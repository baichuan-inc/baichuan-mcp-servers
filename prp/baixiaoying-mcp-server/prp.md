# 百小应 MCP Server 技术方案文档

> **项目名称**: baixiaoying-mcp-server  
> **版本**: 1.0.0  
> **创建日期**: 2026-02-02  
> **状态**: 设计中

---

## 1. 项目概述

### 1.1 背景

百川智能推出的 Baichuan-M3-Plus 和 Baichuan-M2-Plus 是专业的医疗大模型，具备强大的医学知识推理能力。为了让这些模型能够更好地集成到各类 AI 对话系统中，我们计划开发一个基于 MCP (Model Context Protocol) 的服务器，提供标准化的接口调用能力，并结合 MCP Apps 扩展规范，为用户提供丰富的交互式 UI 体验。

### 1.2 目标

1. **实现百小应 API 集成**：封装 Baichuan-M3-Plus 和 Baichuan-M2-Plus 模型的 chat/completions 接口
2. **支持文件上传**：集成文件上传功能，支持医学文档的解析和对话
3. **MCP Apps UI 展示**：利用 MCP Apps 规范，在对话中展示结构化的思考过程、证据引用等内容
4. **品牌营销曝光**：通过头部 Banner 和底部下载引导，增加百小应品牌曝光和 APP 下载转化
5. **标准化接口**：遵循 MCP 协议规范，确保与各类 MCP 客户端兼容

### 1.3 核心功能

| 功能模块    | 描述                                   | 优先级 |
| ----------- | -------------------------------------- | ------ |
| 模型对话    | 支持 Baichuan-M3-Plus/M2-Plus 同步对话 | P0     |
| 文件上传    | 支持医学文档上传和解析                 | P0     |
| MCP Apps UI | 展示思考过程和证据引用                 | P0     |
| 品牌营销    | 头部 Banner + 底部下载引导 + 二维码    | P0     |
| 文件管理    | 文件列表、删除、状态查询               | P1     |

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Host (Claude/VS Code 等)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Tool 调用请求    │    │   UI Resource 渲染 (iframe)      │   │
│  └────────┬─────────┘    └──────────────┬───────────────────┘   │
│           │                              │                       │
└───────────┼──────────────────────────────┼───────────────────────┘
            │                              │
            │ stdio / HTTP                 │ postMessage
            │                              │
┌───────────▼──────────────────────────────▼───────────────────────┐
│                   baixiaoying-mcp-server                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      MCP Server Core                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ Tool 注册    │  │ Resource 注册│  │ UI Resource 服务 │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    百小应 API Client                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ │
│  │  │ Chat Service │  │ File Service │  │ Response Parser  │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                 百川 API 平台                                      │
│                 https://api.baichuan-ai.com                       │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  /v1/chat/completions  │  /v1/files  │  /v1/files/{id}       │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级        | 技术选型                       | 说明               |
| ----------- | ------------------------------ | ------------------ |
| 运行时      | Node.js 18+                    | LTS 版本，支持 ESM |
| 语言        | TypeScript 5.x                 | 类型安全           |
| MCP SDK     | @modelcontextprotocol/sdk      | MCP 协议实现       |
| MCP Apps    | @modelcontextprotocol/ext-apps | MCP Apps UI 扩展   |
| HTTP 客户端 | fetch (原生)                   | API 调用           |
| UI 构建     | Vite + vite-plugin-singlefile  | 单文件 HTML 打包   |
| 服务器框架  | Express (可选)                 | HTTP 传输支持      |

### 2.3 项目结构

```
baixiaoying-mcp-server/
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
├── main.ts                    # 入口文件
├── server.ts                  # MCP Server 核心
├── src/
│   ├── api/                   # 百小应 API 封装
│   │   ├── client.ts          # HTTP 客户端
│   │   ├── chat.ts            # Chat API
│   │   ├── file.ts            # File API
│   │   └── types.ts           # API 类型定义
│   ├── tools/                 # MCP Tools 定义
│   │   ├── chat-tool.ts       # 对话工具
│   │   ├── file-tools.ts      # 文件工具
│   │   └── index.ts           # 工具导出
│   ├── ui/                    # MCP Apps UI 组件
│   │   ├── chat-result.html   # 对话结果展示 HTML
│   │   ├── chat-result.ts     # 对话结果 UI 逻辑
│   │   └── styles.css         # UI 样式
│   └── utils/                 # 工具函数
│       ├── parser.ts          # 响应解析器
│       └── constants.ts       # 常量定义
├── dist/                      # 构建输出
└── README.md
```

---

## 3. 接口设计

### 3.1 MCP Tools 定义

#### 3.1.1 baixiaoying_chat - 模型对话工具

```typescript
{
  name: "baixiaoying_chat",
  title: "百小应医学对话",
  description: "使用百小应大模型进行医学问答对话，支持 Baichuan-M3-Plus 和 Baichuan-M2-Plus 模型，可处理文本和医学文档。",
  inputSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        enum: ["Baichuan-M3-Plus", "Baichuan-M2-Plus"],
        description: "选择使用的模型",
        default: "Baichuan-M3-Plus"
      },
      message: {
        type: "string",
        description: "用户输入的问题或消息"
      },
      file_ids: {
        type: "array",
        items: { type: "string" },
        description: "可选，已上传文件的 ID 列表，用于基于文档的问答"
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 1,
        default: 0.3,
        description: "采样温度，越高回答越多样"
      },
      evidence_scope: {
        type: "string",
        enum: ["grounded", "cited"],
        default: "grounded",
        description: "证据范围：grounded(已对齐证据) 或 cited(已引用证据)"
      }
    },
    required: ["message"]
  },
  _meta: {
    ui: {
      resourceUri: "ui://baixiaoying/chat-result.html"
    }
  }
}
```

#### 3.1.2 baixiaoying_upload_file - 文件上传工具

```typescript
{
  name: "baixiaoying_upload_file",
  title: "上传医学文档",
  description: "上传医学文档用于后续的文档问答。支持 pdf、doc、docx、txt、html、md、csv、png、jpg 等格式。",
  inputSchema: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "本地文件路径"
      },
      file_content: {
        type: "string",
        description: "Base64 编码的文件内容（与 file_path 二选一）"
      },
      file_name: {
        type: "string",
        description: "文件名称"
      }
    },
    required: ["file_name"]
  }
}
```

#### 3.1.3 baixiaoying_list_files - 文件列表工具

```typescript
{
  name: "baixiaoying_list_files",
  title: "查询文件列表",
  description: "获取已上传的文件列表",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

#### 3.1.4 baixiaoying_get_file_status - 文件状态查询工具

```typescript
{
  name: "baixiaoying_get_file_status",
  title: "查询文件解析状态",
  description: "查询指定文件的解析状态，文件需要解析完成后才能用于对话",
  inputSchema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "文件 ID"
      }
    },
    required: ["file_id"]
  }
}
```

#### 3.1.5 baixiaoying_delete_file - 文件删除工具

```typescript
{
  name: "baixiaoying_delete_file",
  title: "删除文件",
  description: "删除指定的已上传文件",
  inputSchema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "要删除的文件 ID"
      }
    },
    required: ["file_id"]
  }
}
```

### 3.2 MCP Apps UI Resource

#### 3.2.1 对话结果展示 UI

**Resource URI**: `ui://baixiaoying/chat-result.html`

**展示内容**:

- 模型回答内容（支持 Markdown 渲染）
- 思考过程（thinking）展示
  - 思考状态（in_progress / completed）
  - 思考摘要
  - 思考步骤（reasoning / searching / synthesizing）
- 证据引用（grounding/evidence）展示
  - 引用文献编号
  - 文献标题（支持中英文）
  - 作者、期刊、发布日期
  - 证据类型（RCT、Guideline 等）
  - 可点击的原文链接
- Token 使用统计

---

## 4. 详细设计

### 4.1 百小应 API 封装

#### 4.1.1 类型定义 (`src/api/types.ts`)

```typescript
// 模型类型
export type BaixiaoyingModel = "Baichuan-M3-Plus" | "Baichuan-M2-Plus";

// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 消息内容类型
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

// 消息结构
export interface Message {
  role: MessageRole;
  content: string | ContentItem[];
}

// Chat 请求参数
export interface ChatRequest {
  model: BaixiaoyingModel;
  messages: Message[];
  stream?: false; // 只支持同步
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  metadata?: {
    evidence_scope?: "grounded" | "cited";
  };
}

// 思考步骤
export interface ThinkingStep {
  kind: "reasoning" | "searching" | "synthesizing";
  status: string;
  label: string;
}

// 思考信息
export interface Thinking {
  status: "in_progress" | "completed";
  summary: string;
  steps: ThinkingStep[];
}

// 证据信息
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

// Grounding 信息
export interface Grounding {
  evidence: Evidence[];
}

// Choice 结构
export interface Choice {
  index: number;
  finish_reason: "stop" | "content_filter" | "tool_calls" | "refuse_answer";
  message: {
    role: "assistant";
    content: string;
    reasoning_content?: string;
  };
  thinking?: Thinking;
  grounding?: Grounding;
}

// Usage 统计
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  search_count?: number;
}

// Chat 响应
export interface ChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

// 文件对象
export interface FileObject {
  id: string;
  bytes: number;
  created_at: number;
  filename: string;
  object: "file";
  purpose: string;
}

// 文件解析状态
export interface FileParseStatus {
  status: "init" | "parsing" | "online" | "fail" | "unsafe";
  content?: string;
}
```

#### 4.1.2 API Client (`src/api/client.ts`)

```typescript
import {
  ChatRequest,
  ChatResponse,
  FileObject,
  FileParseStatus,
} from "./types";

export class BaixiaoyingClient {
  private baseUrl = "https://api.baichuan-ai.com/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    // 如果不是 FormData，设置 Content-Type
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }

    return response.json();
  }

  // Chat Completions
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        ...request,
        stream: false, // 强制同步模式
      }),
    });
  }

  // 上传文件
  async uploadFile(
    file: Buffer | Blob,
    filename: string,
    purpose: string = "medical",
  ): Promise<FileObject> {
    const formData = new FormData();
    formData.append("purpose", purpose);
    formData.append("file", new Blob([file]), filename);

    return this.request<FileObject>("/files", {
      method: "POST",
      body: formData,
    });
  }

  // 获取文件列表
  async listFiles(): Promise<{ data: FileObject[]; object: "list" }> {
    return this.request("/files");
  }

  // 获取文件详情
  async getFile(fileId: string): Promise<FileObject> {
    return this.request(`/files/${fileId}`);
  }

  // 获取文件解析状态
  async getFileParseStatus(fileId: string): Promise<FileParseStatus> {
    return this.request(`/files/${fileId}/parsed-content`);
  }

  // 删除文件
  async deleteFile(
    fileId: string,
  ): Promise<{ id: string; object: "file"; deleted: boolean }> {
    return this.request(`/files/${fileId}`, {
      method: "DELETE",
    });
  }
}
```

### 4.2 MCP Server 实现

#### 4.2.1 Server 核心 (`server.ts`)

```typescript
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "node:fs/promises";
import path from "node:path";
import { BaixiaoyingClient } from "./src/api/client.js";
import { Message, ContentItem, ChatResponse } from "./src/api/types.js";

const DIST_DIR = path.join(import.meta.dirname, "dist");

export function createServer(): McpServer {
  const server = new McpServer({
    name: "baixiaoying-mcp-server",
    version: "1.0.0",
  });

  // 从环境变量获取 API Key
  const apiKey = process.env.BAICHUAN_API_KEY;
  if (!apiKey) {
    console.warn("Warning: BAICHUAN_API_KEY not set");
  }

  const client = apiKey ? new BaixiaoyingClient(apiKey) : null;

  // UI Resource URI
  const chatResultResourceUri = "ui://baixiaoying/chat-result.html";

  // ========== 注册 Chat 工具 ==========
  registerAppTool(
    server,
    "baixiaoying_chat",
    {
      title: "百小应医学对话",
      description:
        "使用百小应大模型进行医学问答对话，支持 Baichuan-M3-Plus 和 Baichuan-M2-Plus 模型",
      inputSchema: {
        type: "object",
        properties: {
          model: {
            type: "string",
            enum: ["Baichuan-M3-Plus", "Baichuan-M2-Plus"],
            description: "选择使用的模型",
            default: "Baichuan-M3-Plus",
          },
          message: {
            type: "string",
            description: "用户输入的问题或消息",
          },
          file_ids: {
            type: "array",
            items: { type: "string" },
            description: "可选，已上传文件的 ID 列表",
          },
          temperature: {
            type: "number",
            minimum: 0,
            maximum: 1,
            default: 0.3,
            description: "采样温度",
          },
          evidence_scope: {
            type: "string",
            enum: ["grounded", "cited"],
            default: "grounded",
            description: "证据范围",
          },
        },
        required: ["message"],
      },
      _meta: { ui: { resourceUri: chatResultResourceUri } },
    },
    async (args) => {
      if (!client) {
        return {
          content: [{ type: "text", text: "错误：未配置 BAICHUAN_API_KEY" }],
        };
      }

      const {
        model = "Baichuan-M3-Plus",
        message,
        file_ids,
        temperature = 0.3,
        evidence_scope = "grounded",
      } = args as {
        model?: string;
        message: string;
        file_ids?: string[];
        temperature?: number;
        evidence_scope?: string;
      };

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
          model: model as any,
          messages,
          temperature,
          metadata: { evidence_scope: evidence_scope as any },
        });

        // 返回完整的响应数据供 UI 渲染
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `API 调用失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    },
  );

  // ========== 注册文件上传工具 ==========
  server.tool(
    "baixiaoying_upload_file",
    "上传医学文档用于后续的文档问答",
    {
      file_path: {
        type: "string",
        description: "本地文件路径",
      },
      file_name: {
        type: "string",
        description: "文件名称",
      },
    },
    async (args) => {
      if (!client) {
        return {
          content: [{ type: "text", text: "错误：未配置 BAICHUAN_API_KEY" }],
        };
      }

      const { file_path, file_name } = args as {
        file_path: string;
        file_name: string;
      };

      try {
        const fileBuffer = await fs.readFile(file_path);
        const result = await client.uploadFile(
          fileBuffer,
          file_name,
          "medical",
        );
        return {
          content: [
            {
              type: "text",
              text: `文件上传成功！\nFile ID: ${result.id}\n文件名: ${result.filename}\n大小: ${result.bytes} bytes\n\n请使用 baixiaoying_get_file_status 查询解析状态，状态为 online 后才能用于对话。`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `文件上传失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    },
  );

  // ========== 注册文件列表工具 ==========
  server.tool(
    "baixiaoying_list_files",
    "获取已上传的文件列表",
    {},
    async () => {
      if (!client) {
        return {
          content: [{ type: "text", text: "错误：未配置 BAICHUAN_API_KEY" }],
        };
      }

      try {
        const result = await client.listFiles();
        const fileList = result.data
          .map(
            (f) =>
              `- ${f.filename} (ID: ${f.id}, ${f.bytes} bytes, 用途: ${f.purpose})`,
          )
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `已上传文件列表：\n${fileList || "（暂无文件）"}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `获取文件列表失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    },
  );

  // ========== 注册文件状态查询工具 ==========
  server.tool(
    "baixiaoying_get_file_status",
    "查询指定文件的解析状态",
    {
      file_id: {
        type: "string",
        description: "文件 ID",
      },
    },
    async (args) => {
      if (!client) {
        return {
          content: [{ type: "text", text: "错误：未配置 BAICHUAN_API_KEY" }],
        };
      }

      const { file_id } = args as { file_id: string };

      try {
        const status = await client.getFileParseStatus(file_id);
        const statusText = {
          init: "待解析",
          parsing: "解析中",
          online: "解析成功 ✓",
          fail: "解析失败 ✗",
          unsafe: "未通过安全检查 ✗",
        }[status.status];

        return {
          content: [
            {
              type: "text",
              text: `文件状态：${statusText}\n\n${
                status.status === "online" ? "该文件已可用于对话。" : ""
              }`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `查询文件状态失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    },
  );

  // ========== 注册文件删除工具 ==========
  server.tool(
    "baixiaoying_delete_file",
    "删除指定的已上传文件",
    {
      file_id: {
        type: "string",
        description: "要删除的文件 ID",
      },
    },
    async (args) => {
      if (!client) {
        return {
          content: [{ type: "text", text: "错误：未配置 BAICHUAN_API_KEY" }],
        };
      }

      const { file_id } = args as { file_id: string };

      try {
        const result = await client.deleteFile(file_id);
        return {
          content: [
            {
              type: "text",
              text: result.deleted
                ? `文件 ${file_id} 已成功删除`
                : `文件删除失败`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `删除文件失败: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    },
  );

  // ========== 注册 UI Resource ==========
  registerAppResource(
    server,
    chatResultResourceUri,
    chatResultResourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "chat-result.html"),
        "utf-8",
      );
      return {
        contents: [
          {
            uri: chatResultResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  return server;
}
```

### 4.3 MCP Apps UI 实现

#### 4.3.1 UI 布局结构

UI 界面分为三个主要区域：

```
┌─────────────────────────────────────────────────────────────┐
│                    【头部品牌 Banner】                        │
│  ┌─────────┐                                                │
│  │  Logo   │  百小应 - 专业医学AI助手                        │
│  └─────────┘  点击体验完整功能 →                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    【主体内容区域】                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 回答内容                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧠 思考过程                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📚 参考文献                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 Token 统计                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  【底部下载引导区域】                         │
│  ┌───────────────────────┐  ┌─────────────────────────┐    │
│  │                       │  │ 📱 下载百小应 APP        │    │
│  │     [二维码图片]       │  │ 随时随地获取专业医学建议  │    │
│  │                       │  │                         │    │
│  │                       │  │ [立即下载] 按钮          │    │
│  └───────────────────────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 对话结果 HTML (`src/ui/chat-result.html`)

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>百小应对话结果</title>
    <!-- 引入 QRCode 库用于生成二维码 -->
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: var(--text-primary, #1a1a1a);
        background: var(--bg-primary, #ffffff);
        padding: 0;
      }

      .container {
        max-width: 800px;
        margin: 0 auto;
      }

      /* ========== 头部品牌 Banner ========== */
      .brand-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .brand-banner::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.1) 0%,
          transparent 50%
        );
        pointer-events: none;
      }

      .brand-banner:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }

      .brand-banner-content {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 1;
      }

      .brand-logo {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: #667eea;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .brand-info {
        flex: 1;
      }

      .brand-name {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .brand-badge {
        font-size: 10px;
        background: rgba(255, 255, 255, 0.25);
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 500;
      }

      .brand-slogan {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.9);
      }

      .brand-cta {
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        font-size: 13px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 20px;
        transition: background 0.2s;
      }

      .brand-cta:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .brand-cta-arrow {
        transition: transform 0.2s;
      }

      .brand-banner:hover .brand-cta-arrow {
        transform: translateX(4px);
      }

      /* ========== 主内容区域 ========== */
      .main-content {
        padding: 16px;
      }

      .section {
        margin-bottom: 20px;
        padding: 16px;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 12px;
        border: 1px solid var(--border-color, #e9ecef);
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-secondary, #6c757d);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title .icon {
        font-size: 16px;
      }

      /* 回答内容 */
      .answer-content {
        font-size: 15px;
        line-height: 1.8;
        white-space: pre-wrap;
      }

      /* 思考过程 */
      .thinking-section {
        background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
        border-color: #c7d2fe;
      }

      .thinking-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .thinking-status.completed {
        background: #dcfce7;
        color: #166534;
      }

      .thinking-status.in_progress {
        background: #fef3c7;
        color: #92400e;
      }

      .thinking-summary {
        margin-top: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 8px;
        font-size: 14px;
      }

      .thinking-steps {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .thinking-step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        font-size: 13px;
      }

      .step-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 12px;
      }

      .step-icon.reasoning {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .step-icon.searching {
        background: #fef3c7;
        color: #92400e;
      }
      .step-icon.synthesizing {
        background: #dcfce7;
        color: #166534;
      }

      /* 证据引用 */
      .evidence-section {
        background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
        border-color: #fde047;
      }

      .evidence-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .evidence-item {
        padding: 12px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        border-left: 3px solid #eab308;
      }

      .evidence-header {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .evidence-num {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eab308;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
      }

      .evidence-title {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
      }

      .evidence-title-zh {
        font-size: 13px;
        color: #6c757d;
        margin-top: 4px;
      }

      .evidence-meta {
        margin-top: 8px;
        font-size: 12px;
        color: #6c757d;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .evidence-meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .evidence-type {
        display: inline-block;
        padding: 2px 8px;
        background: #dbeafe;
        color: #1d4ed8;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      .evidence-link {
        margin-top: 8px;
      }

      .evidence-link a {
        color: #2563eb;
        text-decoration: none;
        font-size: 12px;
      }

      .evidence-link a:hover {
        text-decoration: underline;
      }

      /* Token 统计 */
      .usage-section {
        background: var(--bg-tertiary, #f1f3f5);
      }

      .usage-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .usage-item {
        text-align: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 8px;
      }

      .usage-value {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary, #1a1a1a);
      }

      .usage-label {
        font-size: 12px;
        color: var(--text-secondary, #6c757d);
        margin-top: 4px;
      }

      /* 错误状态 */
      .error-section {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
      }

      /* 加载状态 */
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--text-secondary, #6c757d);
      }

      .loading::after {
        content: "";
        width: 20px;
        height: 20px;
        margin-left: 10px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ========== 底部下载引导区域 ========== */
      .download-section {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #86efac;
        border-radius: 16px;
        padding: 20px;
        margin: 16px;
        margin-top: 0;
      }

      .download-content {
        display: flex;
        gap: 24px;
        align-items: center;
      }

      .download-qr {
        flex-shrink: 0;
        width: 120px;
        height: 120px;
        background: white;
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .download-qr canvas,
      .download-qr img {
        width: 100% !important;
        height: 100% !important;
      }

      .download-info {
        flex: 1;
      }

      .download-title {
        font-size: 18px;
        font-weight: 700;
        color: #166534;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .download-title-icon {
        font-size: 24px;
      }

      .download-desc {
        font-size: 14px;
        color: #15803d;
        margin-bottom: 16px;
        line-height: 1.6;
      }

      .download-features {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }

      .download-feature {
        font-size: 12px;
        background: rgba(22, 163, 74, 0.1);
        color: #166534;
        padding: 4px 12px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .download-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        font-size: 15px;
        font-weight: 600;
        padding: 12px 24px;
        border-radius: 25px;
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
      }

      .download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
      }

      .download-btn-icon {
        font-size: 18px;
      }

      .download-hint {
        margin-top: 12px;
        font-size: 12px;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* 响应式布局 */
      @media (max-width: 600px) {
        .download-content {
          flex-direction: column;
          text-align: center;
        }

        .download-features {
          justify-content: center;
        }

        .brand-banner-content {
          flex-wrap: wrap;
        }

        .brand-cta {
          width: 100%;
          justify-content: center;
          margin-top: 8px;
        }
      }

      /* ========== 深色模式 ========== */
      @media (prefers-color-scheme: dark) {
        body {
          --text-primary: #f1f1f1;
          --text-secondary: #a0a0a0;
          --bg-primary: #1a1a1a;
          --bg-secondary: #2a2a2a;
          --bg-tertiary: #333333;
          --border-color: #404040;
        }

        .brand-banner {
          background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
        }

        .thinking-section {
          background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4f 100%);
          border-color: #4f46e5;
        }

        .evidence-section {
          background: linear-gradient(135deg, #2a2a1f 0%, #3a3a2f 100%);
          border-color: #ca8a04;
        }

        .thinking-summary,
        .thinking-step,
        .evidence-item,
        .usage-item {
          background: rgba(0, 0, 0, 0.3);
        }

        .download-section {
          background: linear-gradient(135deg, #1a2e1a 0%, #1e3a1e 100%);
          border-color: #22543d;
        }

        .download-title {
          color: #86efac;
        }

        .download-desc {
          color: #6ee7b7;
        }

        .download-feature {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .download-qr {
          background: #ffffff;
        }

        .download-hint {
          color: #9ca3af;
        }
      }
    </style>
  </head>
  <body>
    <!-- 头部品牌 Banner -->
    <div class="brand-banner" id="brand-banner">
      <div class="brand-banner-content">
        <div class="brand-logo">百</div>
        <div class="brand-info">
          <div class="brand-name">
            百小应
            <span class="brand-badge">专业医学AI</span>
          </div>
          <div class="brand-slogan">
            基于百川医学大模型，为您提供专业可靠的医学知识服务
          </div>
        </div>
        <div class="brand-cta">
          体验完整功能
          <span class="brand-cta-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="container">
      <div class="main-content">
        <div id="loading" class="loading">正在加载结果...</div>
        <div id="content" style="display: none"></div>
      </div>
    </div>

    <!-- 底部下载引导区域 -->
    <div class="download-section" id="download-section" style="display: none">
      <div class="download-content">
        <div class="download-qr" id="download-qr">
          <!-- 二维码将在 JS 中生成 -->
        </div>
        <div class="download-info">
          <div class="download-title">
            <span class="download-title-icon">📱</span>
            下载百小应 APP
          </div>
          <div class="download-desc">
            随时随地获取专业医学建议，支持语音问诊、图片识别、病历分析等更多功能
          </div>
          <div class="download-features">
            <span class="download-feature">✓ 7×24小时在线</span>
            <span class="download-feature">✓ 专业医学知识库</span>
            <span class="download-feature">✓ 隐私安全保障</span>
            <span class="download-feature">✓ 免费体验</span>
          </div>
          <a
            href="https://xiaoying.baichuan-ai.com/r/2pOaNfyLlsKvBFQgmdoRu2"
            target="_blank"
            rel="noopener"
            class="download-btn"
            id="download-btn"
          >
            <span class="download-btn-icon">⬇️</span>
            立即下载
          </a>
          <div class="download-hint">
            <span>📷</span>
            扫描二维码或点击按钮下载
          </div>
        </div>
      </div>
    </div>

    <script type="module" src="/src/ui/chat-result.ts"></script>
  </body>
</html>
```

#### 4.3.3 对话结果 UI 逻辑 (`src/ui/chat-result.ts`)

```typescript
import { App } from "@modelcontextprotocol/ext-apps";

// ========== 常量配置 ==========
const BRAND_URL = "https://ying.baichuan-ai.com/chat";
const DOWNLOAD_URL =
  "https://xiaoying.baichuan-ai.com/r/2pOaNfyLlsKvBFQgmdoRu2";

// ========== 类型定义 ==========
interface ThinkingStep {
  kind: "reasoning" | "searching" | "synthesizing";
  status: string;
  label: string;
}

interface Thinking {
  status: "in_progress" | "completed";
  summary: string;
  steps: ThinkingStep[];
}

interface Evidence {
  ref_num: number;
  id: string;
  url: string;
  title: string;
  title_zh?: string;
  publish_date?: string;
  author?: string;
  journal_name?: string;
  publication_info?: string;
  evidence_class?: string;
}

interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
      reasoning_content?: string;
    };
    thinking?: Thinking;
    grounding?: {
      evidence: Evidence[];
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ========== DOM 元素引用 ==========
const loadingEl = document.getElementById("loading")!;
const contentEl = document.getElementById("content")!;
const brandBannerEl = document.getElementById("brand-banner")!;
const downloadSectionEl = document.getElementById("download-section")!;
const downloadQrEl = document.getElementById("download-qr")!;

// ========== 初始化 App ==========
const app = new App({ name: "百小应对话结果", version: "1.0.0" });

// ========== 品牌 Banner 点击事件 ==========
brandBannerEl.addEventListener("click", () => {
  // 使用 MCP Apps 的 sendOpenLink 方法打开外链
  // 这样可以让 Host 处理链接打开，而不是直接在 iframe 中打开
  app.sendOpenLink({ url: BRAND_URL });
});

// ========== 生成下载二维码 ==========
function generateQRCode() {
  // 检查 QRCode 库是否加载
  if (typeof (window as any).QRCode !== "undefined") {
    const QRCode = (window as any).QRCode;

    // 清空容器
    downloadQrEl.innerHTML = "";

    // 生成二维码
    QRCode.toCanvas(
      downloadQrEl,
      DOWNLOAD_URL,
      {
        width: 104,
        margin: 0,
        color: {
          dark: "#166534", // 绿色，与下载区域主题一致
          light: "#ffffff",
        },
      },
      (error: any) => {
        if (error) {
          console.error("QR Code generation failed:", error);
          // 降级方案：显示文字提示
          downloadQrEl.innerHTML = `
            <div style="text-align: center; font-size: 12px; color: #6b7280;">
              扫码下载<br>百小应 APP
            </div>
          `;
        }
      },
    );
  } else {
    // QRCode 库未加载，使用在线 API 生成二维码图片作为降级方案
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=104x104&data=${encodeURIComponent(
      DOWNLOAD_URL,
    )}`;
    downloadQrEl.innerHTML = `<img src="${qrApiUrl}" alt="下载二维码" style="width: 104px; height: 104px;" />`;
  }
}

// ========== 显示下载区域 ==========
function showDownloadSection() {
  downloadSectionEl.style.display = "block";
  generateQRCode();
}

// ========== 处理工具结果 ==========
app.ontoolresult = (result) => {
  loadingEl.style.display = "none";
  contentEl.style.display = "block";

  try {
    const textContent = result.content?.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      showError("未收到有效的响应数据");
      return;
    }

    // 检查是否是错误信息
    if (
      textContent.text.startsWith("错误") ||
      textContent.text.startsWith("API 调用失败")
    ) {
      showError(textContent.text);
      return;
    }

    const response: ChatResponse = JSON.parse(textContent.text);
    renderResponse(response);

    // 显示下载引导区域
    showDownloadSection();
  } catch (error) {
    showError(`解析响应失败: ${error}`);
  }
};

// ========== 错误显示 ==========
function showError(message: string) {
  contentEl.innerHTML = `
    <div class="section error-section">
      <div class="section-title">
        <span class="icon">⚠️</span>
        错误
      </div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
  // 即使出错也显示下载区域，增加品牌曝光
  showDownloadSection();
}

// ========== HTML 转义 ==========
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ========== 渲染响应内容 ==========
function renderResponse(response: ChatResponse) {
  const choice = response.choices[0];
  const message = choice?.message;
  const thinking = choice?.thinking;
  const grounding = choice?.grounding;
  const usage = response.usage;

  let html = "";

  // 1. 回答内容
  if (message?.content) {
    html += `
      <div class="section">
        <div class="section-title">
          <span class="icon">💬</span>
          回答
        </div>
        <div class="answer-content">${formatContent(message.content)}</div>
      </div>
    `;
  }

  // 2. 思考过程
  if (thinking) {
    const statusIcon = thinking.status === "completed" ? "✓" : "⏳";
    const statusClass = thinking.status;
    const statusText = thinking.status === "completed" ? "思考完成" : "思考中";

    html += `
      <div class="section thinking-section">
        <div class="section-title">
          <span class="icon">🧠</span>
          思考过程
          <span class="thinking-status ${statusClass}">${statusIcon} ${statusText}</span>
        </div>
        ${
          thinking.summary
            ? `<div class="thinking-summary">${escapeHtml(
                thinking.summary,
              )}</div>`
            : ""
        }
        ${thinking.steps?.length ? renderThinkingSteps(thinking.steps) : ""}
      </div>
    `;
  }

  // 3. 推理内容（如果有）
  if (message?.reasoning_content) {
    html += `
      <div class="section thinking-section">
        <div class="section-title">
          <span class="icon">💭</span>
          推理过程
        </div>
        <div class="thinking-summary">${escapeHtml(
          message.reasoning_content,
        )}</div>
      </div>
    `;
  }

  // 4. 证据引用
  if (grounding?.evidence?.length) {
    html += `
      <div class="section evidence-section">
        <div class="section-title">
          <span class="icon">📚</span>
          参考文献 (${grounding.evidence.length})
        </div>
        <div class="evidence-list">
          ${grounding.evidence.map(renderEvidence).join("")}
        </div>
      </div>
    `;
  }

  // 5. Token 使用统计
  if (usage) {
    html += `
      <div class="section usage-section">
        <div class="section-title">
          <span class="icon">📊</span>
          Token 统计
        </div>
        <div class="usage-grid">
          <div class="usage-item">
            <div class="usage-value">${usage.prompt_tokens.toLocaleString()}</div>
            <div class="usage-label">输入 Token</div>
          </div>
          <div class="usage-item">
            <div class="usage-value">${usage.completion_tokens.toLocaleString()}</div>
            <div class="usage-label">输出 Token</div>
          </div>
          <div class="usage-item">
            <div class="usage-value">${usage.total_tokens.toLocaleString()}</div>
            <div class="usage-label">总计 Token</div>
          </div>
        </div>
      </div>
    `;
  }

  contentEl.innerHTML = html;
}

// ========== 渲染思考步骤 ==========
function renderThinkingSteps(steps: ThinkingStep[]): string {
  const iconMap: Record<string, string> = {
    reasoning: "🤔",
    searching: "🔍",
    synthesizing: "✨",
  };

  return `
    <div class="thinking-steps">
      ${steps
        .map(
          (step) => `
        <div class="thinking-step">
          <div class="step-icon ${step.kind}">${
            iconMap[step.kind] || "📝"
          }</div>
          <div class="step-content">
            <strong>${step.label}</strong>
            ${step.status ? ` - ${step.status}` : ""}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

// ========== 渲染证据引用 ==========
function renderEvidence(evidence: Evidence): string {
  const meta: string[] = [];
  if (evidence.author) meta.push(`👤 ${evidence.author}`);
  if (evidence.journal_name) meta.push(`📖 ${evidence.journal_name}`);
  if (evidence.publish_date) meta.push(`📅 ${evidence.publish_date}`);

  return `
    <div class="evidence-item">
      <div class="evidence-header">
        <span class="evidence-num">${evidence.ref_num}</span>
        <div>
          <div class="evidence-title">${escapeHtml(evidence.title)}</div>
          ${
            evidence.title_zh
              ? `<div class="evidence-title-zh">${escapeHtml(
                  evidence.title_zh,
                )}</div>`
              : ""
          }
        </div>
      </div>
      ${
        meta.length
          ? `<div class="evidence-meta">${meta
              .map((m) => `<span class="evidence-meta-item">${m}</span>`)
              .join("")}</div>`
          : ""
      }
      ${
        evidence.evidence_class
          ? `<div style="margin-top: 8px;"><span class="evidence-type">${evidence.evidence_class}</span></div>`
          : ""
      }
      ${
        evidence.url
          ? `<div class="evidence-link"><a href="${evidence.url}" target="_blank" rel="noopener">查看原文 →</a></div>`
          : ""
      }
    </div>
  `;
}

// ========== 格式化内容 ==========
function formatContent(content: string): string {
  // 简单的 Markdown 转换
  return escapeHtml(content)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

// ========== 连接到 Host ==========
app.connect();
```

#### 4.3.4 营销链接配置说明

| 配置项         | URL                                                       | 用途                                              |
| -------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `BRAND_URL`    | https://ying.baichuan-ai.com/chat                         | 头部 Banner 点击跳转，引导用户体验完整 Web 版功能 |
| `DOWNLOAD_URL` | https://xiaoying.baichuan-ai.com/r/2pOaNfyLlsKvBFQgmdoRu2 | 底部下载引导，渠道增长链接                        |

**二维码生成策略**：

1. **优先方案**：使用 [qrcode](https://www.npmjs.com/package/qrcode) 库在客户端生成 Canvas 二维码
2. **降级方案**：如果库加载失败，使用在线 QR Code API 生成图片

**外链打开方式**：

- 使用 MCP Apps 的 `app.sendOpenLink()` 方法请求 Host 打开链接
- 这样可以确保链接在用户的默认浏览器中打开，而不是在 iframe 沙盒中
- Host 可以根据安全策略决定是否允许打开

---

## 5. 配置与部署

### 5.1 环境变量

| 变量名             | 必填 | 说明                          | 示例      |
| ------------------ | ---- | ----------------------------- | --------- |
| `BAICHUAN_API_KEY` | 是   | 百川 API Key                  | `sk-xxxx` |
| `PORT`             | 否   | HTTP 服务端口（仅 HTTP 模式） | `3001`    |

### 5.2 package.json

```json
{
  "name": "baixiaoying-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc -p tsconfig.server.json && cross-env INPUT=src/ui/chat-result.html vite build",
    "start": "node dist/main.js",
    "start:stdio": "node dist/main.js --stdio",
    "dev": "concurrently 'cross-env NODE_ENV=development INPUT=src/ui/chat-result.html vite build --watch' 'tsx watch main.ts'"
  },
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "@types/qrcode": "^1.5.5",
    "concurrently": "^8.0.0",
    "cross-env": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-singlefile": "^2.0.0"
  }
}
```

### 5.3 MCP 客户端配置

#### Claude Desktop / VS Code 配置 (stdio 模式)

```json
{
  "mcpServers": {
    "baixiaoying": {
      "command": "node",
      "args": ["/path/to/baixiaoying-mcp-server/dist/main.js", "--stdio"],
      "env": {
        "BAICHUAN_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

#### HTTP 模式配置

```json
{
  "mcpServers": {
    "baixiaoying": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

---

## 6. 使用示例

### 6.1 基础对话

```
用户: 使用百小应问一下"小儿感冒咳嗽，痰咳不出来怎么办？"

[Agent 调用 baixiaoying_chat 工具]
- model: "Baichuan-M3-Plus"
- message: "小儿感冒咳嗽，痰咳不出来怎么办？"

[返回结果 - 在 MCP Apps UI 中展示]
- 详细的医学建议回答
- 思考过程（推理 → 搜索 → 综合）
- 参考文献列表
- Token 使用统计
```

### 6.2 文档问答

```
用户: 上传这份病历文档，然后帮我分析一下

[Agent 调用 baixiaoying_upload_file 工具]
- file_path: "/path/to/medical_record.pdf"
- file_name: "medical_record.pdf"

[返回] 文件上传成功！File ID: file-abc123

[Agent 调用 baixiaoying_get_file_status 工具]
- file_id: "file-abc123"

[返回] 文件状态：解析成功 ✓

[Agent 调用 baixiaoying_chat 工具]
- model: "Baichuan-M3-Plus"
- message: "请分析这份病历，给出诊断建议"
- file_ids: ["file-abc123"]

[返回结果 - 基于文档的详细分析]
```

---

## 7. 安全考虑

### 7.1 API Key 安全

- API Key 仅通过环境变量传递，不硬编码
- 不在日志中输出完整的 API Key
- 建议使用密钥管理服务

### 7.2 文件上传安全

- 依赖百川平台的文件安全检查
- 本地仅作为中转，不持久化存储文件内容

### 7.3 MCP Apps UI 安全

- UI 运行在沙盒 iframe 中
- 所有通信通过 JSON-RPC over postMessage
- 外链通过 `app.sendOpenLink()` 请求 Host 打开，由 Host 控制安全策略
- 二维码通过客户端生成，不依赖外部服务（有降级方案）

### 7.4 营销链接管理

| 链接类型     | URL                                                       | 可配置性                   |
| ------------ | --------------------------------------------------------- | -------------------------- |
| 品牌官网     | https://ying.baichuan-ai.com/chat                         | 通过常量配置               |
| APP 下载渠道 | https://xiaoying.baichuan-ai.com/r/2pOaNfyLlsKvBFQgmdoRu2 | 通过常量配置，支持渠道追踪 |

**注意事项**：

- 渠道链接应包含追踪参数，便于统计转化效果
- 建议定期检查链接有效性
- 可通过环境变量覆盖默认链接配置

---

## 8. 后续规划

### 8.1 短期 (v1.1)

- [ ] 支持多轮对话上下文
- [ ] 文件状态轮询自动化
- [ ] UI 主题跟随系统

### 8.2 中期 (v1.5)

- [ ] 支持知识库检索 (retrieval)
- [ ] 支持 Web 搜索增强
- [ ] 批量文件上传

### 8.3 长期 (v2.0)

- [ ] 流式输出支持
- [ ] 多模型切换 UI
- [ ] 对话历史管理

---

## 9. 参考资料

- [百川 API 文档](https://platform.baichuan-ai.com/docs)
- [MCP 官方文档](https://modelcontextprotocol.io/docs)
- [MCP Apps 规范](https://modelcontextprotocol.github.io/ext-apps/api/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [ext-apps 仓库](https://github.com/modelcontextprotocol/ext-apps)
