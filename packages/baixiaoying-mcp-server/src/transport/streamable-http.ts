/**
 * Streamable HTTP Transport
 * 实现 MCP 协议的 Streamable HTTP 传输层
 *
 * 协议版本: 2025-11-25
 * 参考: mcp_transports.md
 */

import {
  createServer,
  IncomingMessage,
  ServerResponse,
  Server,
} from "node:http";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./sse-session.js";
import { SSEStream } from "./sse-stream.js";
import { resolveApiKey } from "./auth.js";

// ========== 配置接口 ==========

export interface StreamableHttpOptions {
  /** 监听地址 */
  host: string;
  /** 监听端口 */
  port: number;
  /** MCP endpoint 路径 */
  endpoint: string;
  /** 允许的 Origin 列表（逗号分隔或数组） */
  allowedOrigins: string[];
  /** 是否允许空 Origin（CLI/服务端调用） */
  allowEmptyOrigin: boolean;
  /** Session TTL（毫秒） */
  sessionTtl: number;
  /** 期望的协议版本 */
  protocolVersion: string;
  /** 缺失 header 时的回退协议版本 */
  protocolFallback: string;
}

// ========== 默认配置 ==========

const DEFAULT_OPTIONS: StreamableHttpOptions = {
  host: "127.0.0.1",
  port: 8787,
  endpoint: "/mcp",
  allowedOrigins: ["http://localhost"],
  allowEmptyOrigin: false,
  sessionTtl: 30 * 60 * 1000, // 30分钟
  protocolVersion: "2025-11-25",
  protocolFallback: "2025-03-26",
};

// ========== 允许的协议版本 ==========

const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2025-11-25",
  "2025-03-26",
  "2024-11-05",
]);

// ========== CORS Headers ==========

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Authorization",
  "Access-Control-Expose-Headers": "MCP-Session-Id",
  "Access-Control-Max-Age": "86400",
};

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
 * Streamable HTTP Transport
 * 实现 MCP ServerTransport 接口
 */
export class StreamableHttpTransport implements Transport {
  private options: StreamableHttpOptions;
  private server: Server | null = null;
  private sessionManager: SessionManager;

  /** 按 session 存储的 API Key，供外部 ClientResolver 查找 */
  private _sessionApiKeys: Map<string, string> = new Map();

  /** 是否已启动 */
  private _started: boolean = false;

  /** 当前活跃的 session ID，供 MCP SDK 在 extra 中传递给工具 handler */
  sessionId?: string;

  /** 消息回调 */
  onmessage?: (message: JSONRPCMessage) => void;

  /** 错误回调 */
  onerror?: (error: Error) => void;

  /** 关闭回调 */
  onclose?: () => void;

  /** 等待响应的请求（按 request id 索引） */
  private pendingRequests: Map<string | number, PendingRequest> = new Map();

  /** 当前活跃的 session ID（用于发送服务器主动消息） */
  private activeSessionId: string | null = null;

  constructor(options: Partial<StreamableHttpOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.sessionManager = new SessionManager(this.options.sessionTtl);
  }

  /** 获取 session 与 API Key 的映射表（只读） */
  get sessionApiKeyMap(): ReadonlyMap<string, string> {
    return this._sessionApiKeys;
  }

  /**
   * 启动 HTTP 服务器
   * 注意：MCP SDK 的 connect() 方法会自动调用 start()
   */
  async start(): Promise<void> {
    // 防止重复启动
    if (this._started) {
      return;
    }
    this._started = true;

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          console.error("[StreamableHttp] Request handler error:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      });

      this.server.on("error", (err) => {
        console.error("[StreamableHttp] Server error:", err);
        this.onerror?.(err);
        reject(err);
      });

      this.server.listen(this.options.port, this.options.host, () => {
        console.error(
          `[StreamableHttp] Server listening on http://${this.options.host}:${this.options.port}${this.options.endpoint}`
        );
        resolve();
      });
    });
  }

  /**
   * 关闭 HTTP 服务器
   */
  async close(): Promise<void> {
    this.sessionManager.close();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error("[StreamableHttp] Server closed");
          this.onclose?.();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 发送消息到客户端
   * 根据消息类型选择合适的发送方式
   */
  async send(message: JSONRPCMessage): Promise<void> {
    // 检查是否是对 pending request 的响应
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

    // 服务器主动推送的消息，发送到主流
    if (this.activeSessionId) {
      const stream = this.sessionManager.getPrimaryStream(this.activeSessionId);
      if (stream) {
        stream.send(message);
        return;
      }
    }

    console.error(
      "[StreamableHttp] No available stream to send message:",
      JSON.stringify(message).substring(0, 100)
    );
  }

  /**
   * 处理 HTTP 请求
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // 检查路径
    if (url.pathname !== this.options.endpoint) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    // 解析请求上下文
    const context = this.parseRequestContext(req);

    // OPTIONS 预检请求
    if (req.method === "OPTIONS") {
      this.handleOptions(req, res, context);
      return;
    }

    // Origin 校验
    if (!this.validateOrigin(context.origin)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden: Invalid origin" }));
      return;
    }

    // 协议版本校验
    if (!this.validateProtocolVersion(context.protocolVersion)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `Unsupported protocol version: ${context.protocolVersion}`,
        })
      );
      return;
    }

    // 添加 CORS 响应头
    this.addCorsHeaders(res, context.origin);

    switch (req.method) {
      case "POST":
        await this.handlePost(req, res, context);
        break;
      case "GET":
        await this.handleGet(req, res, context);
        break;
      case "DELETE":
        this.handleDelete(req, res, context);
        break;
      default:
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  }

  /**
   * 解析请求上下文
   */
  private parseRequestContext(req: IncomingMessage): RequestContext {
    const sessionId =
      (req.headers["mcp-session-id"] as string) || null;
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

  /**
   * 校验 Origin
   */
  private validateOrigin(origin: string | null): boolean {
    // 空 Origin 处理
    if (!origin) {
      return this.options.allowEmptyOrigin;
    }

    // 检查白名单
    for (const allowed of this.options.allowedOrigins) {
      if (allowed === "*") {
        return true;
      }
      // 支持通配符匹配（如 http://localhost:*）
      if (allowed.includes("*")) {
        const pattern = allowed
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*");
        if (new RegExp(`^${pattern}$`).test(origin)) {
          return true;
        }
      } else if (origin === allowed || origin.startsWith(allowed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 校验协议版本
   */
  private validateProtocolVersion(version: string): boolean {
    return SUPPORTED_PROTOCOL_VERSIONS.has(version);
  }

  /**
   * 添加 CORS 响应头
   */
  private addCorsHeaders(res: ServerResponse, origin: string | null): void {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.setHeader(key, value);
    }
  }

  /**
   * 处理 OPTIONS 请求
   */
  private handleOptions(
    _req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): void {
    this.addCorsHeaders(res, context.origin);
    res.writeHead(204);
    res.end();
  }

  /**
   * 处理 POST 请求
   */
  private async handlePost(
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): Promise<void> {
    // 检查 Content-Type
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      res.writeHead(415, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Unsupported Media Type: Expected application/json" })
      );
      return;
    }

    // 检查 Accept
    if (!context.acceptsSSE && !context.acceptsJSON) {
      res.writeHead(406, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Not Acceptable: Accept header must include application/json or text/event-stream",
        })
      );
      return;
    }

    // 读取请求体
    let body: string;
    try {
      body = await this.readRequestBody(req);
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to read request body" }));
      return;
    }

    // 解析 JSON-RPC 消息
    let message: JSONRPCMessage;
    try {
      message = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    // 判断消息类型
    const isRequest = "method" in message && "id" in message;
    const isNotification = "method" in message && !("id" in message);
    const isResponse = "result" in message || "error" in message;

    // notification/response -> 202 Accepted
    if (isNotification || isResponse) {
      // 检查 session（非 initialize 请求需要 session）
      if (context.sessionId) {
        if (!this.sessionManager.hasSession(context.sessionId)) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found" }));
          return;
        }
        this.activeSessionId = context.sessionId;
        this.sessionId = context.sessionId;
      }

      res.writeHead(202);
      res.end();

      // 传递消息给 MCP Server
      this.onmessage?.(message);
      return;
    }

    // request -> 返回 SSE 或 JSON
    if (isRequest) {
      const requestMessage = message as JSONRPCMessage & {
        method: string;
        id: string | number;
      };
      await this.handlePostRequest(req, res, context, requestMessage);
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON-RPC message" }));
    }
  }

  /**
   * 处理 POST request 消息
   */
  private async handlePostRequest(
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext,
    message: JSONRPCMessage & { method: string; id: string | number }
  ): Promise<void> {
    const isInitialize = message.method === "initialize";

    // 非 initialize 请求需要检查 session
    if (!isInitialize) {
      if (!context.sessionId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing MCP-Session-Id header" })
        );
        return;
      }

      if (!this.sessionManager.hasSession(context.sessionId)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }
    }

    // initialize 请求 -> 创建新 session 并存储 API Key
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
    // 设置 Transport 接口的 sessionId，供 MCP SDK 在 extra 中传递
    this.sessionId = sessionId;

    // 根据 Accept 决定响应方式
    if (context.acceptsSSE) {
      // 设置 Session-Id header（必须在创建 SSE 流之前，因为 SSE 流会立即发送响应头）
      res.setHeader("MCP-Session-Id", sessionId);

      // 创建 SSE 流
      const stream = this.sessionManager.createStream(sessionId, res);
      if (!stream) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to create stream" }));
        return;
      }

      // 注册 pending request
      await new Promise<void>((resolve) => {
        this.pendingRequests.set(message.id, { stream, resolve });

        // 传递消息给 MCP Server
        this.onmessage?.(message);
      });
    } else {
      // JSON 响应模式（同步等待）
      res.setHeader("MCP-Session-Id", sessionId);

      // 创建临时流用于收集响应
      let responseMessage: JSONRPCMessage | null = null;

      // 创建一个 Promise 等待响应
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

        this.pendingRequests.set(message.id, {
          stream: tempStream,
          resolve,
        });
      });

      // 传递消息给 MCP Server
      this.onmessage?.(message);

      // 等待响应
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

  /**
   * 处理 GET 请求（建立 SSE 流）
   */
  private async handleGet(
    _req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
  ): Promise<void> {
    // 必须接受 SSE
    if (!context.acceptsSSE) {
      res.writeHead(406, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Not Acceptable: GET requires Accept: text/event-stream",
        })
      );
      return;
    }

    // 必须有 session
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

    // 创建 SSE 流
    const stream = this.sessionManager.createStream(context.sessionId, res);
    if (!stream) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create stream" }));
      return;
    }

    this.activeSessionId = context.sessionId;
    this.sessionId = context.sessionId;

    // 保持连接打开，流会在客户端断开时自动关闭
    console.error(
      `[StreamableHttp] GET SSE stream established for session ${context.sessionId}`
    );
  }

  /**
   * 处理 DELETE 请求（关闭 session）
   */
  private handleDelete(
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
   * 读取请求体
   */
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
 * 从环境变量和命令行参数解析配置
 */
export function parseOptions(args: string[]): Partial<StreamableHttpOptions> {
  const options: Partial<StreamableHttpOptions> = {};

  // 解析命令行参数
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
      case "--endpoint":
        if (nextArg) {
          options.endpoint = nextArg;
          i++;
        }
        break;
    }
  }

  // 从环境变量读取
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

  const envProtocolVersion = process.env.MCP_PROTOCOL_VERSION;
  if (envProtocolVersion) {
    options.protocolVersion = envProtocolVersion;
  }

  const envProtocolFallback = process.env.MCP_PROTOCOL_FALLBACK;
  if (envProtocolFallback) {
    options.protocolFallback = envProtocolFallback;
  }

  return options;
}
