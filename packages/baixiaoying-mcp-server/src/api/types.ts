/**
 * 百小应 API 类型定义
 * 基于百川 API 文档: https://platform.baichuan-ai.com/docs
 */

// ========== 模型类型 ==========
export type BaixiaoyingModel = "Baichuan-M3-Plus" | "Baichuan-M2-Plus";

// ========== 消息相关类型 ==========
export type MessageRole = "user" | "assistant" | "system";

export interface TextContent {
  type: "text";
  text: string;
}

export interface FileContent {
  type: "file";
  file: {
    file_id: string;
  };
}

export type ContentItem = TextContent | FileContent;

export interface Message {
  role: MessageRole;
  content: string | ContentItem[];
}

// ========== Chat 请求参数 ==========
export interface ChatRequest {
  model: BaixiaoyingModel;
  messages: Message[];
  stream?: false; // 只支持同步模式
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  metadata?: {
    evidence_scope?: "grounded" | "cited";
  };
}

// ========== 思考过程相关类型 ==========
export type ThinkingStepKind = "reasoning" | "searching" | "synthesizing";

export interface ThinkingStep {
  kind: ThinkingStepKind;
  status: string;
  label: string;
}

export interface Thinking {
  status: "in_progress" | "completed";
  summary: string;
  steps: ThinkingStep[];
}

// ========== 证据引用相关类型 ==========
export interface Evidence {
  ref_num: number;
  id: string;
  url: string;
  title: string;
  title_zh?: string;
  publish_date?: string;
  author?: string;
  journal_name?: string;
  publication_info?: string;
  press?: string;
  drug_approve_date?: string;
  evidence_class?: string;
}

export interface Grounding {
  evidence: Evidence[];
}

// ========== Chat 响应相关类型 ==========
export type FinishReason = "stop" | "content_filter" | "tool_calls" | "refuse_answer";

export interface AssistantMessage {
  role: "assistant";
  content: string;
  reasoning_content?: string;
}

export interface Choice {
  index: number;
  finish_reason: FinishReason;
  message: AssistantMessage;
  thinking?: Thinking;
  grounding?: Grounding;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  search_count?: number;
}

export interface ChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

// ========== 文件相关类型 ==========
export type FilePurpose = "knowledge-base" | "assistants" | "file-parsing" | "medical";

export interface FileObject {
  id: string;
  bytes: number;
  created_at: number;
  filename: string;
  object: "file";
  purpose: string;
}

export interface FileListResponse {
  data: FileObject[];
  object: "list";
}

export interface FileDeleteResponse {
  id: string;
  object: "file";
  deleted: boolean;
}

export type FileParseStatusType = "init" | "parsing" | "online" | "fail" | "unsafe";

export interface FileParseStatus {
  status: FileParseStatusType;
  content?: string;
}

// ========== API 错误类型 ==========
export interface ApiError {
  code: string;
  message: string;
}

export class BaixiaoyingApiError extends Error {
  public readonly statusCode: number;
  public readonly requestId?: string;

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message);
    this.name = "BaixiaoyingApiError";
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}
