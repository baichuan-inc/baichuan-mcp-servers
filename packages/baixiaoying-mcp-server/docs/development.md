# 开发指南

## 环境要求

- Node.js >= 18（最低 LTS）
- pnpm

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
