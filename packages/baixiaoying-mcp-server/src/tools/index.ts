/**
 * MCP Tools 导出
 */

import type { BaixiaoyingClient } from "../api/index.js";

/**
 * Client 解析器类型
 *
 * 根据 session 上下文返回对应用户的 BaixiaoyingClient 实例。
 * - SSE 模式: 每个连接绑定一个固定 client
 * - Streamable HTTP 模式: 根据 sessionId 查找对应 client
 * - stdio 模式: 返回环境变量配置的全局 client
 */
export type ClientResolver = (extra: { sessionId?: string }) => BaixiaoyingClient | null;

export { registerChatTool, chatInputSchema } from "./chat.js";
export {
  registerFileTools,
  registerUploadFileTool,
  registerListFilesTool,
  registerGetFileStatusTool,
  registerDeleteFileTool,
  uploadFileInputSchema,
  getFileStatusInputSchema,
  deleteFileInputSchema,
} from "./file.js";
