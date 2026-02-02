/**
 * 百小应文件管理工具
 * 实现文件上传、列表、状态查询、删除等 MCP Tools
 */

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BaixiaoyingClient, FileParseStatusType } from "../api/index.js";

// ========== 文件上传工具 ==========
export const uploadFileInputSchema = {
  file_path: z.string().describe("本地文件的绝对路径"),
  file_name: z.string().optional().describe("可选，自定义文件名。不提供则使用原文件名"),
};

export function registerUploadFileTool(server: McpServer, client: BaixiaoyingClient | null) {
  server.tool(
    "baixiaoying_upload_file",
    "上传医学文档用于后续的文档问答。支持 pdf、doc、docx、txt、html、md、csv、png、jpg 等格式。",
    uploadFileInputSchema,
    async (args) => {
      if (!client) {
        return {
          content: [
            {
              type: "text" as const,
              text: "错误：未配置 BAICHUAN_API_KEY 环境变量。",
            },
          ],
          isError: true,
        };
      }

      const { file_path, file_name } = args as {
        file_path: string;
        file_name?: string;
      };

      try {
        // 检查文件是否存在
        await fs.access(file_path);

        // 读取文件内容
        const fileBuffer = await fs.readFile(file_path);

        // 使用提供的文件名或从路径提取
        const filename = file_name || path.basename(file_path);

        // 上传文件
        const result = await client.uploadFile(fileBuffer, filename, "medical");

        return {
          content: [
            {
              type: "text" as const,
              text: `文件上传成功！

📄 文件信息:
- File ID: ${result.id}
- 文件名: ${result.filename}
- 大小: ${(result.bytes / 1024).toFixed(2)} KB
- 用途: ${result.purpose}
- 创建时间: ${new Date(result.created_at * 1000).toLocaleString()}

⏳ 下一步:
请使用 baixiaoying_get_file_status 工具查询文件解析状态。
当状态为 "online" 后，才能在对话中使用该文件。`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `文件上传失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ========== 文件列表工具 ==========
export function registerListFilesTool(server: McpServer, client: BaixiaoyingClient | null) {
  server.tool(
    "baixiaoying_list_files",
    "获取已上传的文件列表",
    {},
    async () => {
      if (!client) {
        return {
          content: [
            {
              type: "text" as const,
              text: "错误：未配置 BAICHUAN_API_KEY 环境变量。",
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await client.listFiles();

        if (result.data.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "📁 当前没有已上传的文件。\n\n使用 baixiaoying_upload_file 工具上传医学文档。",
              },
            ],
          };
        }

        const fileList = result.data
          .map((f, i) => {
            const sizeKB = (f.bytes / 1024).toFixed(2);
            const createTime = new Date(f.created_at * 1000).toLocaleString();
            return `${i + 1}. ${f.filename}
   - ID: ${f.id}
   - 大小: ${sizeKB} KB
   - 用途: ${f.purpose}
   - 创建时间: ${createTime}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `📁 已上传文件列表 (共 ${result.data.length} 个):\n\n${fileList}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `获取文件列表失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ========== 文件状态查询工具 ==========
export const getFileStatusInputSchema = {
  file_id: z.string().describe("要查询的文件 ID"),
};

export function registerGetFileStatusTool(server: McpServer, client: BaixiaoyingClient | null) {
  server.tool(
    "baixiaoying_get_file_status",
    "查询指定文件的解析状态。文件需要解析完成（状态为 online）后才能用于对话。",
    getFileStatusInputSchema,
    async (args) => {
      if (!client) {
        return {
          content: [
            {
              type: "text" as const,
              text: "错误：未配置 BAICHUAN_API_KEY 环境变量。",
            },
          ],
          isError: true,
        };
      }

      const { file_id } = args as { file_id: string };

      try {
        const status = await client.getFileParseStatus(file_id);

        const statusMap: Record<FileParseStatusType, { icon: string; text: string; hint: string }> = {
          init: {
            icon: "⏳",
            text: "待解析",
            hint: "文件已上传，等待解析处理。",
          },
          parsing: {
            icon: "🔄",
            text: "解析中",
            hint: "文件正在解析，请稍后再查询。",
          },
          online: {
            icon: "✅",
            text: "解析成功",
            hint: "文件已可用于对话！使用 baixiaoying_chat 工具并在 file_ids 参数中传入此文件 ID。",
          },
          fail: {
            icon: "❌",
            text: "解析失败",
            hint: "文件解析失败，请检查文件格式或重新上传。",
          },
          unsafe: {
            icon: "⚠️",
            text: "未通过安全检查",
            hint: "文件内容未通过安全检查，无法使用。",
          },
        };

        const info = statusMap[status.status];

        return {
          content: [
            {
              type: "text" as const,
              text: `📄 文件状态: ${info.icon} ${info.text}

File ID: ${file_id}
${info.hint}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `查询文件状态失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ========== 文件删除工具 ==========
export const deleteFileInputSchema = {
  file_id: z.string().describe("要删除的文件 ID"),
};

export function registerDeleteFileTool(server: McpServer, client: BaixiaoyingClient | null) {
  server.tool(
    "baixiaoying_delete_file",
    "删除指定的已上传文件。被知识库使用的文件需要先解除关联后才能删除。",
    deleteFileInputSchema,
    async (args) => {
      if (!client) {
        return {
          content: [
            {
              type: "text" as const,
              text: "错误：未配置 BAICHUAN_API_KEY 环境变量。",
            },
          ],
          isError: true,
        };
      }

      const { file_id } = args as { file_id: string };

      try {
        const result = await client.deleteFile(file_id);

        if (result.deleted) {
          return {
            content: [
              {
                type: "text" as const,
                text: `✅ 文件删除成功！\n\nFile ID: ${file_id}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: `⚠️ 文件删除失败，文件可能不存在或正在被使用。\n\nFile ID: ${file_id}`,
              },
            ],
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `删除文件失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * 注册所有文件管理工具
 */
export function registerFileTools(server: McpServer, client: BaixiaoyingClient | null) {
  registerUploadFileTool(server, client);
  registerListFilesTool(server, client);
  registerGetFileStatusTool(server, client);
  registerDeleteFileTool(server, client);
}
