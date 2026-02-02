#!/usr/bin/env node

/**
 * 百小应 MCP Server
 * 提供百小应医学大模型的 MCP 协议集成
 *
 * 支持的模型: Baichuan-M3-Plus, Baichuan-M2-Plus
 * 支持的功能: 医学问答对话、文件上传、文档问答
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

// ========== 主函数 ==========
async function main() {
  const args = process.argv.slice(2);
  const useHttp = args.includes("--http");

  if (useHttp) {
    // HTTP 模式 - 后续可以扩展实现
    console.error("HTTP mode is not yet implemented. Use stdio mode instead.");
    process.exit(1);
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
