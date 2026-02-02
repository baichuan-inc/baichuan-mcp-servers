# 百小应 MCP Server Dockerfile
# 支持 Streamable HTTP 模式的独立部署

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./

# 复制 baixiaoying-mcp-server 包
COPY packages/baixiaoying-mcp-server ./packages/baixiaoying-mcp-server

# 安装依赖并构建
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @baichuan-ai/baixiaoying-mcp-server build

# ========== 运行阶段 ==========
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 pnpm（用于运行时依赖）
RUN npm install -g pnpm

# 复制构建产物和依赖
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/baixiaoying-mcp-server/package.json ./packages/baixiaoying-mcp-server/
COPY --from=builder /app/packages/baixiaoying-mcp-server/dist ./packages/baixiaoying-mcp-server/dist

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 8787

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/mcp || exit 1

# 启动命令
CMD ["node", "packages/baixiaoying-mcp-server/dist/index.js", "--http", "--host", "0.0.0.0", "--port", "8787"]
