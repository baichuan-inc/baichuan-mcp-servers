/**
 * Hybrid HTTP Server
 * 同时支持 Streamable HTTP 和旧版 SSE 协议
 *
 * 路由：
 * - /mcp: Streamable HTTP (POST/GET/DELETE/OPTIONS)
 * - /sse: 旧版 SSE 连接 (GET)
 * - /message: 旧版 SSE 消息 (POST)
 */

import {
  createServer,
  IncomingMessage,
  ServerResponse,
  Server,
} from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./sse-session.js";
import { SSEStream } from "./sse-stream.js";
import { resolveApiKey } from "./auth.js";

// ========== CORS Headers ==========

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Authorization",
  "Access-Control-Expose-Headers": "MCP-Session-Id",
  "Access-Control-Max-Age": "86400",
};

// ========== 配置接口 ==========

export interface HybridServerOptions {
  /** 监听地址 */
  host: string;
  /** 监听端口 */
  port: number;
  /** Streamable HTTP endpoint 路径 */
  mcpEndpoint: string;
  /** SSE endpoint 路径 */
  sseEndpoint: string;
  /** SSE message endpoint 路径 */
  messageEndpoint: string;
  /** 允许的 Origin 列表 */
  allowedOrigins: string[];
  /** 是否允许空 Origin */
  allowEmptyOrigin: boolean;
  /** Session TTL（毫秒） */
  sessionTtl: number;
  /** 协议版本 */
  protocolVersion: string;
  /** 回退协议版本 */
  protocolFallback: string;
}

const DEFAULT_OPTIONS: HybridServerOptions = {
  host: "127.0.0.1",
  port: 8787,
  mcpEndpoint: "/mcp",
  sseEndpoint: "/sse",
  messageEndpoint: "/message",
  allowedOrigins: ["http://localhost"],
  allowEmptyOrigin: true,
  sessionTtl: 30 * 60 * 1000,
  protocolVersion: "2025-11-25",
  protocolFallback: "2025-03-26",
};

// ========== 支持的协议版本 ==========

const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2025-11-25",
  "2025-03-26",
  "2024-11-05",
]);

// ========== 请求上下文 ==========

interface RequestContext {
  sessionId: string | null;
  protocolVersion: string;
  origin: string | null;
  acceptsSSE: boolean;
  acceptsJSON: boolean;
}

// ========== 等待中的请求 ==========

interface PendingRequest {
  stream: SSEStream;
  resolve: () => void;
}

/**
 * Hybrid HTTP Server
 * 同时支持 Streamable HTTP 和旧版 SSE
 */
export class HybridServer {
  private options: HybridServerOptions;
  private server: Server | null = null;
  private _started: boolean = false;

  // Streamable HTTP 相关
  private sessionManager: SessionManager;
  private pendingRequests: Map<string | number, PendingRequest> = new Map();
  private activeSessionId: string | null = null;

  /** 按 session 存储的 API Key，供外部 ClientResolver 查找 */
  private _sessionApiKeys: Map<string, string> = new Map();

  // 旧版 SSE 相关
  private sseTransports: Map<string, SSEServerTransport> = new Map();

  /** Streamable HTTP Transport 接口 */
  streamableTransport: StreamableHttpInterface;

  /** 当有新的 SSE Transport 准备就绪时的回调，附带从请求中提取的 API Key */
  onSSETransportReady?: (transport: SSEServerTransport, apiKey: string | null) => void;

  constructor(options: Partial<HybridServerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.sessionManager = new SessionManager(this.options.sessionTtl);

    // 创建 Streamable HTTP Transport 接口
    this.streamableTransport = {
      sessionId: undefined,
      onmessage: undefined,
      onerror: undefined,
      onclose: undefined,
      start: async () => { },
      close: async () => await this.close(),
      send: async (message: JSONRPCMessage) => await this.sendStreamableMessage(message),
    };
  }

  /** 获取 session 与 API Key 的映射表（只读） */
  get sessionApiKeyMap(): ReadonlyMap<string, string> {
    return this._sessionApiKeys;
  }

  /**
   * 启动 HTTP 服务器
   */
  async start(): Promise<void> {
    if (this._started) {
      return;
    }
    this._started = true;

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          console.error("[HybridServer] Request handler error:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      });

      this.server.on("error", (err) => {
        console.error("[HybridServer] Server error:", err);
        reject(err);
      });

      this.server.listen(this.options.port, this.options.host, () => {
        console.error(
          `[HybridServer] Server listening on http://${this.options.host}:${this.options.port}`
        );
        console.error(`  Streamable HTTP: ${this.options.mcpEndpoint}`);
        console.error(`  Legacy SSE: ${this.options.sseEndpoint}`);
        resolve();
      });
    });
  }

  /**
   * 关闭服务器
   */
  async close(): Promise<void> {
    this.sessionManager.close();

    // 关闭所有 SSE transports
    for (const transport of this.sseTransports.values()) {
      await transport.close();
    }
    this.sseTransports.clear();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error("[HybridServer] Server closed");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 处理 HTTP 请求
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const origin = req.headers.origin as string | undefined;

    // CORS 预检
    if (req.method === "OPTIONS") {
      this.handleCors(res, origin);
      return;
    }

    // 添加 CORS 头
    this.addCorsHeaders(res, origin);

    // 路由
    if (url.pathname === this.options.mcpEndpoint) {
      // Streamable HTTP
      await this.handleStreamableHttp(req, res, url);
    } else if (url.pathname === this.options.sseEndpoint && req.method === "GET") {
      // 旧版 SSE 连接
      await this.handleSSEConnect(req, res);
    } else if (
      url.pathname === this.options.messageEndpoint ||
      url.pathname.startsWith("/message/")
    ) {
      // 旧版 SSE 消息
      if (req.method === "POST") {
        await this.handleSSEMessage(req, res, url);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }

  /**
   * 处理 CORS 预检
   */
  private handleCors(res: ServerResponse, origin?: string): void {
    this.addCorsHeaders(res, origin);
    res.writeHead(204);
    res.end();
  }

  /**
   * 添加 CORS 响应头
   */
  private addCorsHeaders(res: ServerResponse, origin?: string): void {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (this.options.allowEmptyOrigin) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Vary", "Origin");
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.setHeader(key, value);
    }
  }

  // ========== Streamable HTTP 处理 ==========

  /**
   * 处理 Streamable HTTP 请求
   */
  private async handleStreamableHttp(
    req: IncomingMessage,
    res: ServerResponse,
    _url: URL
  ): Promise<void> {
    const context = this.parseRequestContext(req);

    // 协议版本校验
    if (!SUPPORTED_PROTOCOL_VERSIONS.has(context.protocolVersion)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `Unsupported protocol version: ${context.protocolVersion}`,
        })
      );
      return;
    }

    switch (req.method) {
      case "POST":
        await this.handleStreamablePost(req, res, context);
        break;
      case "GET":
        await this.handleStreamableGet(req, res, context);
        break;
      case "DELETE":
        this.handleStreamableDelete(req, res, context);
        break;
      default:
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  }

  private parseRequestContext(req: IncomingMessage): RequestContext {
    const sessionId = (req.headers["mcp-session-id"] as string) || null;
    const protocolVersion =
      (req.headers["mcp-protocol-version"] as string) ||
      this.options.protocolFallback;
    const origin = (req.headers["origin"] as string) || null;
    const accept = req.headers["accept"] || "";

    return {
      sessionId,
      protocolVersion,
      origin,
      acceptsSSE: accept.includes("text/event-stream"),
      acceptsJSON: accept.includes("application/json"),
    };
  }

  private async handleStreamablePost(
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): Promise<void> {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      res.writeHead(415, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unsupported Media Type" }));
      return;
    }

    if (!context.acceptsSSE && !context.acceptsJSON) {
      res.writeHead(406, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Acceptable" }));
      return;
    }

    const body = await this.readRequestBody(req);
    let message: JSONRPCMessage;
    try {
      message = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const isRequest = "method" in message && "id" in message;
    const isNotification = "method" in message && !("id" in message);
    const isResponse = "result" in message || "error" in message;

    if (isNotification || isResponse) {
      if (context.sessionId && !this.sessionManager.hasSession(context.sessionId)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }
      if (context.sessionId) {
        this.activeSessionId = context.sessionId;
        this.streamableTransport.sessionId = context.sessionId;
      }
      res.writeHead(202);
      res.end();
      this.streamableTransport.onmessage?.(message);
      return;
    }

    if (isRequest) {
      const requestMessage = message as JSONRPCMessage & {
        method: string;
        id: string | number;
      };
      await this.handleStreamableRequest(req, res, context, requestMessage);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON-RPC message" }));
    }
  }

  private async handleStreamableRequest(
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext,
    message: JSONRPCMessage & { method: string; id: string | number }
  ): Promise<void> {
    const isInitialize = message.method === "initialize";

    if (!isInitialize) {
      if (!context.sessionId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing MCP-Session-Id header" }));
        return;
      }
      if (!this.sessionManager.hasSession(context.sessionId)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }
    }

    let sessionId: string;
    if (isInitialize) {
      const session = this.sessionManager.createSession(context.protocolVersion);
      sessionId = session.sessionId;

      // 提取并存储该 session 的 API Key
      const apiKey = resolveApiKey(req);
      if (apiKey) {
        this._sessionApiKeys.set(sessionId, apiKey);
      }
    } else {
      sessionId = context.sessionId!;
    }

    this.activeSessionId = sessionId;
    this.streamableTransport.sessionId = sessionId;

    if (context.acceptsSSE) {
      res.setHeader("MCP-Session-Id", sessionId);
      const stream = this.sessionManager.createStream(sessionId, res);
      if (!stream) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to create stream" }));
        return;
      }

      await new Promise<void>((resolve) => {
        this.pendingRequests.set(message.id, { stream, resolve });
        this.streamableTransport.onmessage?.(message);
      });
    } else {
      res.setHeader("MCP-Session-Id", sessionId);
      let responseMessage: JSONRPCMessage | null = null;

      const responsePromise = new Promise<void>((resolve) => {
        const tempStream = {
          send: (msg: JSONRPCMessage) => {
            responseMessage = msg;
          },
          close: () => {
            resolve();
          },
          closed: false,
        } as unknown as SSEStream;

        this.pendingRequests.set(message.id, { stream: tempStream, resolve });
      });

      this.streamableTransport.onmessage?.(message);
      await responsePromise;

      if (responseMessage) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseMessage));
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No response received" }));
      }
    }
  }

  private async handleStreamableGet(
    _req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): Promise<void> {
    if (!context.acceptsSSE) {
      res.writeHead(406, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "GET requires Accept: text/event-stream" }));
      return;
    }

    if (!context.sessionId || !this.sessionManager.hasSession(context.sessionId)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    const stream = this.sessionManager.createStream(context.sessionId, res);
    if (!stream) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create stream" }));
      return;
    }

    this.activeSessionId = context.sessionId;
    this.streamableTransport.sessionId = context.sessionId;
  }

  private handleStreamableDelete(
    _req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): void {
    if (!context.sessionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing MCP-Session-Id header" }));
      return;
    }

    const deleted = this.sessionManager.deleteSession(context.sessionId);
    if (deleted) {
      this._sessionApiKeys.delete(context.sessionId);
      if (this.activeSessionId === context.sessionId) {
        this.activeSessionId = null;
      }
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
    }
  }

  /**
   * 发送 Streamable HTTP 消息
   */
  private async sendStreamableMessage(message: JSONRPCMessage): Promise<void> {
    if ("id" in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        pending.stream.send(message);
        pending.stream.close();
        pending.resolve();
        this.pendingRequests.delete(message.id);
        return;
      }
    }

    if (this.activeSessionId) {
      const stream = this.sessionManager.getPrimaryStream(this.activeSessionId);
      if (stream) {
        stream.send(message);
        return;
      }
    }
  }

  // ========== 旧版 SSE 处理 ==========

  /**
   * 处理 SSE 连接请求
   */
  private async handleSSEConnect(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const apiKey = resolveApiKey(req);

    console.error(`[HybridServer] New SSE connection (apiKey: ${apiKey ? "provided" : "using env fallback or none"})`);

    const transport = new SSEServerTransport(this.options.messageEndpoint, res);
    this.sseTransports.set(transport.sessionId, transport);

    transport.onclose = () => {
      console.error(`[HybridServer] SSE transport ${transport.sessionId} closed`);
      this.sseTransports.delete(transport.sessionId);
    };

    console.error(`[HybridServer] SSE connection established: ${transport.sessionId}`);

    if (this.onSSETransportReady) {
      this.onSSETransportReady(transport, apiKey);
    }
  }

  /**
   * 处理 SSE 消息请求
   */
  private async handleSSEMessage(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
  ): Promise<void> {
    let sessionId = url.searchParams.get("sessionId");

    if (!sessionId && url.pathname.startsWith("/message/")) {
      sessionId = url.pathname.substring("/message/".length);
    }

    if (!sessionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing sessionId" }));
      return;
    }

    const transport = this.sseTransports.get(sessionId);
    if (!transport) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    await transport.handlePostMessage(req, res);
  }

  // ========== 工具方法 ==========

  private readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }
}

/**
 * Streamable HTTP Transport 接口
 */
interface StreamableHttpInterface extends Transport {
  // Transport 接口已定义所需方法
}

/**
 * 从命令行参数解析配置
 */
export function parseHybridOptions(args: string[]): Partial<HybridServerOptions> {
  const options: Partial<HybridServerOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--host":
        if (nextArg) {
          options.host = nextArg;
          i++;
        }
        break;
      case "--port":
        if (nextArg) {
          options.port = parseInt(nextArg, 10);
          i++;
        }
        break;
      case "--mcp-endpoint":
        if (nextArg) {
          options.mcpEndpoint = nextArg;
          i++;
        }
        break;
      case "--sse-endpoint":
        if (nextArg) {
          options.sseEndpoint = nextArg;
          i++;
        }
        break;
    }
  }

  const envOrigins = process.env.MCP_ALLOWED_ORIGINS;
  if (envOrigins) {
    options.allowedOrigins = envOrigins.split(",").map((s) => s.trim());
  }

  const envAllowEmpty = process.env.MCP_ALLOW_EMPTY_ORIGIN;
  if (envAllowEmpty) {
    options.allowEmptyOrigin = envAllowEmpty.toLowerCase() === "true";
  }

  const envSessionTtl = process.env.MCP_SESSION_TTL;
  if (envSessionTtl) {
    const ttl = parseInt(envSessionTtl, 10);
    if (!isNaN(ttl)) {
      options.sessionTtl = ttl;
    }
  }

  return options;
}
