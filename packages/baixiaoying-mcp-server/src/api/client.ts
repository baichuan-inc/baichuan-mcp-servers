/**
 * 百小应 API 客户端
 * 封装百川 chat/completions 和文件管理 API
 */

import {
  ChatRequest,
  ChatResponse,
  FileObject,
  FileListResponse,
  FileDeleteResponse,
  FileParseStatus,
  BaixiaoyingApiError,
} from "./types.js";

const BASE_URL = "https://api.baichuan-ai.com/v1";

export class BaixiaoyingClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(apiKey: string, baseUrl: string = BASE_URL, timeoutMs: number = 25000) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * 发送 HTTP 请求的通用方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    // 如果不是 FormData，设置 Content-Type
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string>),
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new BaixiaoyingApiError(
          `API Error: Request timeout after ${this.timeoutMs}ms`,
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const requestId = response.headers.get("X-BC-Request-Id") || undefined;

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorBody = await response.json() as { error?: { message?: string }; message?: string };
        errorMessage = errorBody.error?.message || errorBody.message || response.statusText;
      } catch {
        errorMessage = await response.text() || response.statusText;
      }
      throw new BaixiaoyingApiError(
        `API Error: ${response.status} - ${errorMessage}`,
        response.status,
        requestId
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * 发起 Chat 请求（同步模式）
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        ...request,
        stream: false, // 强制同步模式
      }),
    });
  }

  /**
   * 上传文件
   * @param file 文件内容（Buffer 或 Blob）
   * @param filename 文件名
   * @param purpose 文件用途，默认为 medical（医学文档）
   */
  async uploadFile(
    file: Buffer | Blob,
    filename: string,
    purpose: string = "medical"
  ): Promise<FileObject> {
    const formData = new FormData();
    formData.append("purpose", purpose);

    // 将 Buffer 转换为 Blob
    const blob = file instanceof Blob ? file : new Blob([file]);
    formData.append("file", blob, filename);

    return this.request<FileObject>("/files", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * 获取文件列表
   */
  async listFiles(): Promise<FileListResponse> {
    return this.request<FileListResponse>("/files", {
      method: "GET",
    });
  }

  /**
   * 获取文件详情
   */
  async getFile(fileId: string): Promise<FileObject> {
    return this.request<FileObject>(`/files/${fileId}`, {
      method: "GET",
    });
  }

  /**
   * 获取文件解析状态
   * 仅对 purpose 为 file-parsing 或 medical 的文件有效
   */
  async getFileParseStatus(fileId: string): Promise<FileParseStatus> {
    return this.request<FileParseStatus>(`/files/${fileId}/parsed-content`, {
      method: "GET",
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<FileDeleteResponse> {
    return this.request<FileDeleteResponse>(`/files/${fileId}`, {
      method: "DELETE",
    });
  }
}
