/**
 * 百小应对话工具
 * 实现 baixiaoying_chat MCP Tool
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { Message, ContentItem, BaixiaoyingModel } from "../api/index.js";
import { getUiResourceUri } from "../ui/resource.js";
import type { ClientResolver } from "./index.js";

// 工具输入参数 Schema
export const chatInputSchema = {
  model: z
    .enum(["Baichuan-M3-Plus", "Baichuan-M2-Plus"])
    .default("Baichuan-M3-Plus")
    .describe("选择使用的模型"),
  message: z.string().describe("用户输入的问题或消息"),
  file_ids: z
    .array(z.string())
    .optional()
    .describe("可选，已上传文件的 ID 列表，用于基于文档的问答"),
  temperature: z
    .number()
    .min(0)
    .max(1)
    .default(0.3)
    .describe("采样温度，越高回答越多样"),
  evidence_scope: z
    .enum(["grounded", "cited"])
    .default("grounded")
    .describe("证据范围：grounded(已对齐证据) 或 cited(已引用证据)"),
};

export type ChatInput = z.infer<z.ZodObject<typeof chatInputSchema>>;

/**
 * 注册对话工具到 MCP Server
 */
export function registerChatTool(server: McpServer, resolveClient: ClientResolver) {
  // 获取 UI 资源 URI
  const resourceUri = getUiResourceUri();

  // 使用 registerAppTool 注册工具，将 _meta.ui.resourceUri 放在工具配置中
  registerAppTool(
    server,
    "baixiaoying_chat",
    {
      title: "百小应医学问答",
      description: "使用百小应大模型进行医学问答对话，支持 Baichuan-M3-Plus 和 Baichuan-M2-Plus 模型，可处理文本和医学文档",
      inputSchema: chatInputSchema,
      // 关键：_meta.ui.resourceUri 必须在工具配置中指定
      _meta: {
        ui: {
          resourceUri,
        },
      },
    },
    async (args, extra) => {
      const client = resolveClient({ sessionId: extra?.sessionId });
      if (!client) {
        return {
          content: [
            {
              type: "text" as const,
              text: "错误：未提供 API Key。请在连接时通过 Authorization: Bearer <your-api-key> 传入百川 API Key，或在服务器配置 BAICHUAN_API_KEY 环境变量。",
            },
          ],
          isError: true,
        };
      }

      const {
        model = "Baichuan-M3-Plus",
        message,
        file_ids,
        temperature = 0.3,
        evidence_scope = "grounded",
      } = args as ChatInput;

      // 构建消息内容
      let content: string | ContentItem[];
      if (file_ids && file_ids.length > 0) {
        content = [
          ...file_ids.map((id) => ({
            type: "file" as const,
            file: { file_id: id },
          })),
          { type: "text" as const, text: message },
        ];
      } else {
        content = message;
      }

      const messages: Message[] = [{ role: "user", content }];

      try {
        const response = await client.chat({
          model: model as BaixiaoyingModel,
          messages,
          temperature,
          metadata: { evidence_scope },
        });

        // 返回完整的响应数据（JSON 格式）
        // MCP Apps UI 会解析这个 JSON 来渲染界面
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `API 调用失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// 导出 RESOURCE_MIME_TYPE 供其他模块使用
export { RESOURCE_MIME_TYPE };
