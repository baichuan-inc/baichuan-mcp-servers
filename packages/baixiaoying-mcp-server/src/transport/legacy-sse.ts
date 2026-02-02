/**
 * Legacy SSE Transport
 * 兼容旧版 SSE 协议 (2024-11-05)，支持 Cursor 等客户端
 *
 * 协议：
 * - GET /sse: 建立 SSE 连接
 * - POST /message: 发送 JSON-RPC 消息
 */

import {
  createServer,
  IncomingMessage,
  ServerResponse,
  Server,
} from "node:http";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// ========== CORS Headers ==========

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization",
  "Access-Control-Max-Age": "86400",
};

// ========== 配置接口 ==========

export interface LegacySSEOptions {
  /** 监听地址 */
  host: string;
  /** 监听端口 */
  port: number;
  /** SSE endpoint 路径 */
  sseEndpoint: string;
  /** Message endpoint 路径 */
  messageEndpoint: string;
  /** 允许的 Origin 列表 */
  allowedOrigins: string[];
  /** 是否允许空 Origin */
  allowEmptyOrigin: boolean;
}

const DEFAULT_OPTIONS: LegacySSEOptions = {
  host: "127.0.0.1",
  port: 8787,
  sseEndpoint: "/sse",
  messageEndpoint: "/message",
  allowedOrigins: ["http://localhost"],
  allowEmptyOrigin: true,
};

/**
 * Legacy SSE HTTP Server
 * 管理旧版 SSE 连接和消息路由
 */
export class LegacySSEServer {
  private options: LegacySSEOptions;
  private server: Server | null = null;
  private transports: Map<string, SSEServerTransport> = new Map();
  private _started: boolean = false;

  /** 当有新的 transport 准备就绪时的回调 */
  onTransportReady?: (transport: SSEServerTransport) => void;

  constructor(options: Partial<LegacySSEOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
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
          console.error("[LegacySSE] Request handler error:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      });

      this.server.on("error", (err) => {
        console.error("[LegacySSE] Server error:", err);
        reject(err);
      });

      this.server.listen(this.options.port, this.options.host, () => {
        console.error(
          `[LegacySSE] Server listening on http://${this.options.host}:${this.options.port}`
        );
        console.error(
          `  SSE endpoint: ${this.options.sseEndpoint}`
        );
        console.error(
          `  Message endpoint: ${this.options.messageEndpoint}`
        );
        resolve();
      });
    });
  }

  /**
   * 关闭服务器
   */
  async close(): Promise<void> {
    // 关闭所有 transport
    for (const transport of this.transports.values()) {
      await transport.close();
    }
    this.transports.clear();

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error("[LegacySSE] Server closed");
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
    if (url.pathname === this.options.sseEndpoint && req.method === "GET") {
      await this.handleSSE(req, res);
    } else if (
      url.pathname === this.options.messageEndpoint &&
      req.method === "POST"
    ) {
      await this.handleMessage(req, res);
    } else if (url.pathname.startsWith("/message/") && req.method === "POST") {
      // 兼容 /message/:sessionId 格式
      await this.handleMessage(req, res);
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
    // 允许任何 origin（简化处理）
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

  /**
   * 处理 SSE 连接请求
   */
  private async handleSSE(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    console.error("[LegacySSE] New SSE connection");

    // 创建 SSEServerTransport
    // 第一个参数是 POST message 的 endpoint
    const transport = new SSEServerTransport(
      this.options.messageEndpoint,
      res
    );

    // 存储 transport
    this.transports.set(transport.sessionId, transport);

    // 监听关闭
    transport.onclose = () => {
      console.error(`[LegacySSE] Transport ${transport.sessionId} closed`);
      this.transports.delete(transport.sessionId);
    };

    console.error(`[LegacySSE] SSE connection established: ${transport.sessionId}`);

    // 通知新的 transport 准备就绪
    // 注意：不要手动调用 transport.start()，让 MCP Server 的 connect() 方法来调用
    if (this.onTransportReady) {
      this.onTransportReady(transport);
    }
  }

  /**
   * 处理 POST 消息
   */
  private async handleMessage(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    // 从 URL 或查询参数获取 session ID
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    let sessionId = url.searchParams.get("sessionId");

    // 也尝试从路径获取: /message/:sessionId
    if (!sessionId && url.pathname.startsWith("/message/")) {
      sessionId = url.pathname.substring("/message/".length);
    }

    if (!sessionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing sessionId" }));
      return;
    }

    const transport = this.transports.get(sessionId);
    if (!transport) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    // 委托给 transport 处理
    await transport.handlePostMessage(req, res);
  }
}

/**
 * 从环境变量和命令行参数解析旧版 SSE 配置
 */
export function parseLegacySSEOptions(args: string[]): Partial<LegacySSEOptions> {
  const options: Partial<LegacySSEOptions> = {};

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
      case "--sse-endpoint":
        if (nextArg) {
          options.sseEndpoint = nextArg;
          i++;
        }
        break;
      case "--message-endpoint":
        if (nextArg) {
          options.messageEndpoint = nextArg;
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

  return options;
}
