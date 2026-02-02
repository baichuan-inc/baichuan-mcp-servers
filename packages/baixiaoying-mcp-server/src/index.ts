#!/usr/bin/env node

/**
 * 百小应 MCP Server
 * 提供百小应医学大模型的 MCP 协议集成
 *
 * 支持的模型: Baichuan-M3-Plus, Baichuan-M2-Plus
 * 支持的功能: 医学问答对话、文件上传、文档问答
 *
 * 传输模式:
 * - stdio: 标准输入输出（默认）
 * - sse: 旧版 SSE 协议（--sse 参数启用，兼容 Cursor）
 * - http: Streamable HTTP（--http 参数启用）
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { BaixiaoyingClient } from "./api/index.js";
import { registerChatTool, registerFileTools } from "./tools/index.js";
import { getUiResourceUri, loadUiHtml } from "./ui/resource.js";
import {
  StreamableHttpTransport,
  parseOptions,
  LegacySSEServer,
  parseLegacySSEOptions,
  HybridServer,
  parseHybridOptions,
} from "./transport/index.js";

// ========== 服务器信息 ==========
const SERVER_NAME = "baixiaoying-mcp-server";
const SERVER_VERSION = "0.0.1";

// ========== 创建 MCP Server ==========
function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 获取 API Key
  const apiKey = process.env.BAICHUAN_API_KEY;
  const timeoutMs = Number(process.env.BAICHUAN_TIMEOUT_MS || "120000");

  // 创建客户端（如果有 API Key）
  let client: BaixiaoyingClient | null = null;
  if (apiKey) {
    client = new BaixiaoyingClient(apiKey, undefined, Number.isFinite(timeoutMs) ? timeoutMs : 25000);
  } else {
    console.error(
      "Warning: BAICHUAN_API_KEY environment variable is not set. " +
      "Tools will return errors until the API key is configured."
    );
  }

  // 注册所有工具
  registerChatTool(server, client);
  registerFileTools(server, client);

  // 注册服务器信息资源
  server.registerResource(
    "info",
    "baixiaoying://info",
    {
      title: "服务器信息",
      description: "百小应 MCP Server 基本信息",
      mimeType: "application/json",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                name: SERVER_NAME,
                version: SERVER_VERSION,
                description: "百小应医学大模型 MCP 服务",
                models: ["Baichuan-M3-Plus", "Baichuan-M2-Plus"],
                capabilities: {
                  chat: true,
                  fileUpload: true,
                  documentQA: true,
                },
                apiKeyConfigured: !!apiKey,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 使用 registerAppResource 注册 MCP Apps UI 资源
  const uiResourceUri = getUiResourceUri();
  registerAppResource(
    server,
    "百小应对话结果 UI",
    uiResourceUri,
    {
      description: "MCP Apps 对话结果展示界面，包含回答、思考过程、证据引用等",
      mimeType: RESOURCE_MIME_TYPE,
    },
    async () => {
      const html = await loadUiHtml();
      return {
        contents: [
          {
            uri: uiResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    }
  );

  return server;
}

// ========== 打印帮助信息 ==========
function printHelp(): void {
  console.log(`
百小应 MCP Server v${SERVER_VERSION}

用法:
  baixiaoying-mcp-server [选项]

选项:
  --sse               启用旧版 SSE 模式（兼容 Cursor 等客户端）
  --http              启用 Streamable HTTP 模式
  --hybrid            启用混合模式（同时支持 Streamable HTTP 和 SSE）
  --host <地址>       HTTP/SSE 监听地址（默认: 127.0.0.1）
  --port <端口>       HTTP/SSE 监听端口（默认: 8787）
  --endpoint <路径>   MCP endpoint 路径（默认: /mcp）
  --help, -h          显示帮助信息

环境变量:
  BAICHUAN_API_KEY         百川 API Key（必需）
  BAICHUAN_TIMEOUT_MS      API 请求超时（毫秒，默认: 120000）
  MCP_ALLOWED_ORIGINS      允许的 Origin 白名单（逗号分隔）
  MCP_ALLOW_EMPTY_ORIGIN   允许无 Origin 的请求（true/false，默认: true）
  MCP_SESSION_TTL          Session 过期时间（毫秒，默认: 1800000）

示例:
  # stdio 模式（默认）
  BAICHUAN_API_KEY=xxx baixiaoying-mcp-server

  # SSE 模式（兼容 Cursor）
  BAICHUAN_API_KEY=xxx baixiaoying-mcp-server --sse --port 8787

  # Streamable HTTP 模式
  BAICHUAN_API_KEY=xxx baixiaoying-mcp-server --http --host 0.0.0.0 --port 8787

  # 混合模式（推荐，同时支持 Streamable HTTP 和 SSE）
  BAICHUAN_API_KEY=xxx baixiaoying-mcp-server --hybrid --port 8787
`);
}

// ========== 主函数 ==========
async function main() {
  const args = process.argv.slice(2);

  // 帮助信息
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const useHttp = args.includes("--http");
  const useSSE = args.includes("--sse");
  const useHybrid = args.includes("--hybrid");

  if (useHybrid) {
    // 混合模式 - 同时支持 Streamable HTTP 和 SSE
    const options = parseHybridOptions(args);
    const hybridServer = new HybridServer(options);

    // Streamable HTTP: 创建一个 MCP Server 实例
    const streamableServer = createServer();
    await streamableServer.connect(hybridServer.streamableTransport);
    console.error("[Main] MCP Server connected to Streamable HTTP transport");

    // 旧版 SSE: 每个连接创建一个新的 MCP Server 实例
    hybridServer.onSSETransportReady = async (transport) => {
      const server = createServer();
      await server.connect(transport);
      console.error(`[Main] MCP Server connected to SSE transport: ${transport.sessionId}`);
    };

    // 启动混合服务器
    await hybridServer.start();

    const host = options.host || "127.0.0.1";
    const port = options.port || 8787;

    console.error(
      `${SERVER_NAME} v${SERVER_VERSION} running in hybrid mode on http://${host}:${port}`
    );
    console.error(`  Streamable HTTP: http://${host}:${port}/mcp`);
    console.error(`  Legacy SSE: http://${host}:${port}/sse`);
    console.error(`  Cursor 配置: {"type": "sse", "url": "http://${host}:${port}/sse"}`);

    // 优雅关闭
    const shutdown = async () => {
      console.error("\nShutting down...");
      await hybridServer.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else if (useSSE) {
    // SSE 模式 - 旧版 SSE 协议（兼容 Cursor）
    const options = parseLegacySSEOptions(args);
    const sseServer = new LegacySSEServer(options);

    // 当有新的 SSE 连接时，创建一个新的 McpServer 实例
    sseServer.onTransportReady = async (transport) => {
      const server = createServer();
      await server.connect(transport);
      console.error(`[Main] MCP Server connected to SSE transport: ${transport.sessionId}`);
    };

    // 启动 SSE 服务器
    await sseServer.start();

    const host = options.host || "127.0.0.1";
    const port = options.port || 8787;

    console.error(
      `${SERVER_NAME} v${SERVER_VERSION} running in SSE mode on http://${host}:${port}`
    );
    console.error(`  Cursor 配置: {"type": "sse", "url": "http://${host}:${port}/sse"}`);

    // 优雅关闭
    const shutdown = async () => {
      console.error("\nShutting down...");
      await sseServer.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else if (useHttp) {
    // HTTP 模式 - Streamable HTTP
    const server = createServer();
    const options = parseOptions(args);
    const transport = new StreamableHttpTransport(options);

    // 连接 MCP Server 和 Transport（connect 会自动调用 transport.start()）
    await server.connect(transport);

    const host = options.host || "127.0.0.1";
    const port = options.port || 8787;
    const endpoint = options.endpoint || "/mcp";

    console.error(
      `${SERVER_NAME} v${SERVER_VERSION} running on http://${host}:${port}${endpoint}`
    );

    // 优雅关闭
    const shutdown = async () => {
      console.error("\nShutting down...");
      await transport.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } else {
    // stdio 模式
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
  }
}

// ========== 启动服务器 ==========
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
