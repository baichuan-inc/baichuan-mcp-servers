# 开发指南

## 环境要求

- Node.js >= 18（最低 LTS）
- pnpm

## 安装

```bash
npm install @baichuan-ai/baixiaoying-mcp-server
```

## 环境变量

| 变量名                   | 必填 | 说明                                                                                                               |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `BAICHUAN_API_KEY`       | 条件 | 百川 API Key，从 [百川开放平台](https://platform.baichuan-ai.com/) 获取。stdio 模式下必需；HTTP/SSE 模式下作为后备 |
| `BAICHUAN_TIMEOUT_MS`    | 否   | API 请求超时（毫秒，默认: 120000）                                                                                 |
| `MCP_ALLOWED_ORIGINS`    | 否   | 允许的 Origin 白名单（逗号分隔，仅 HTTP/SSE 模式）                                                                 |
| `MCP_ALLOW_EMPTY_ORIGIN` | 否   | 允许无 Origin 的请求（true/false，默认: true）                                                                     |
| `MCP_SESSION_TTL`        | 否   | Session 过期时间（毫秒，默认: 1800000）                                                                            |

> **鉴权说明**: HTTP/SSE 模式下，用户通过 `Authorization: Bearer <your-baichuan-api-key>` 传入自己的百川 API Key，服务端将使用该 Key 进行后续 API 调用。如未传入，则回退到 `BAICHUAN_API_KEY` 环境变量。

## 传输协议

百小应 MCP Server 支持四种传输模式，适用于不同场景：

| 模式                | 参数       | 端点                | 适用场景                           |
| ------------------- | ---------- | ------------------- | ---------------------------------- |
| **stdio**           | (默认)     | -                   | Claude Desktop、本地 MCP 客户端    |
| **SSE**             | `--sse`    | `/sse` + `/message` | Cursor、旧版 SSE 客户端            |
| **Streamable HTTP** | `--http`   | `/mcp`              | 新版 MCP 客户端                    |
| **Hybrid**          | `--hybrid` | `/mcp` + `/sse`     | 同时支持多种客户端（推荐服务部署） |

## 开发流程

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式
pnpm dev
```

## 启动脚本

```bash
# stdio 模式（默认）
pnpm start

# SSE 模式（兼容 Cursor）
pnpm start:sse

# Streamable HTTP 模式
pnpm start:http

# Hybrid 模式（推荐服务部署）
pnpm start:hybrid
```

## 客户端配置

### Claude Desktop（stdio 模式）

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "command": "npx",
      "args": ["-y", "@baichuan-ai/baixiaoying-mcp-server"],
      "env": {
        "BAICHUAN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

或者使用本地安装：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "command": "node",
      "args": ["/path/to/baixiaoying-mcp-server/dist/index.js"],
      "env": {
        "BAICHUAN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor（SSE 模式）

可以使用百川官方 SSE 服务，也可以自行部署。

**使用官方 SSE 服务**（推荐）：

在 `~/.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "type": "sse",
      "url": "https://baixiaoying-mcp-server.baichuan-ai.com/sse",
      "headers": {
        "Authorization": "Bearer your-baichuan-api-key"
      }
    }
  }
}
```

**使用自部署服务**：

1. 启动 SSE 服务器：

```bash
BAICHUAN_API_KEY=your-api-key pnpm start:sse --port 8787
```

2. 在 `~/.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "type": "sse",
      "url": "http://127.0.0.1:8787/sse",
      "headers": {
        "Authorization": "Bearer your-baichuan-api-key"
      }
    }
  }
}
```

> 如果服务端已配置 `BAICHUAN_API_KEY` 环境变量作为后备，也可以不传 `Authorization` header。

## 服务器部署（Hybrid 模式）

Hybrid 模式同时支持 Streamable HTTP 和 SSE 协议，推荐用于服务器部署：

```bash
# 启动混合模式服务器（可选设置 BAICHUAN_API_KEY 作为后备）
pnpm start:hybrid --host 0.0.0.0 --port 8787

# 或设置后备 API Key
BAICHUAN_API_KEY=your-fallback-key pnpm start:hybrid --host 0.0.0.0 --port 8787
```

> 用户连接时通过 `Authorization: Bearer <key>` 传入自己的百川 API Key，服务端自动使用该 Key 进行 API 调用。

启动后可用的端点：

| 端点       | 协议            | 用途                |
| ---------- | --------------- | ------------------- |
| `/mcp`     | Streamable HTTP | 新版 MCP 客户端     |
| `/sse`     | Legacy SSE      | Cursor 等旧版客户端 |
| `/message` | Legacy SSE POST | SSE 消息发送端点    |

## 命令行参数

```bash
baixiaoying-mcp-server [选项]

选项:
  --sse               启用 SSE 模式（兼容 Cursor）
  --http              启用 Streamable HTTP 模式
  --hybrid            启用混合模式（同时支持 HTTP 和 SSE）
  --host <地址>       监听地址（默认: 127.0.0.1）
  --port <端口>       监听端口（默认: 8787）
  --endpoint <路径>   MCP endpoint 路径（默认: /mcp）
  --help, -h          显示帮助信息
```

## Docker 部署

```bash
# 构建镜像
docker build -t baixiaoying-mcp-server .

# 运行容器（可选设置后备 API Key）
docker run -d \
  -p 8787:8787 \
  baixiaoying-mcp-server

# 或设置后备 API Key
docker run -d \
  -p 8787:8787 \
  -e BAICHUAN_API_KEY=your-fallback-key \
  baixiaoying-mcp-server
```
