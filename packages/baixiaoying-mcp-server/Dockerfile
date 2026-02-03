# 百小应 MCP Server Dockerfile
# 独立构建模式 - 在包目录内执行 docker build
#
# 使用方式：
#   cd packages/baixiaoying-mcp-server
#   docker build -t baixiaoying-mcp-server .

# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 全局安装构建工具
RUN npm install -g typescript

# 复制 package.json 和 lock 文件
COPY package.json ./

# 复制源代码和配置
COPY tsconfig.json vite.config.ts ./
COPY src ./src

# 创建 tsconfig.base.json（独立构建不依赖 monorepo）
# 并修改 tsconfig.json 的 extends 路径
RUN echo '{"compilerOptions":{"target":"ES2022","module":"Node16","moduleResolution":"Node16","lib":["ES2022"],"declaration":true,"declarationMap":true,"sourceMap":true,"strict":true,"esModuleInterop":true,"skipLibCheck":true,"forceConsistentCasingInFileNames":true,"resolveJsonModule":true,"isolatedModules":true,"noUnusedLocals":true,"noUnusedParameters":true,"noImplicitReturns":true,"noFallthroughCasesInSwitch":true}}' > tsconfig.base.json && \
    sed -i 's|"../../tsconfig.base.json"|"./tsconfig.base.json"|g' tsconfig.json

# 安装依赖（包括开发依赖用于构建）
RUN npm install

# 构建项目
RUN npm run build

# ========== 运行阶段 ==========
FROM node:20-alpine AS runner

WORKDIR /app

# 复制 package.json
COPY package.json ./

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 只安装生产依赖
RUN npm install --omit=dev

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 8787

# 健康检查 - SSE 端点
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/sse || exit 1

# 默认使用 Hybrid 模式（同时支持 SSE 和 Streamable HTTP）
# 可通过环境变量 MCP_MODE 切换: sse, http, hybrid
ENV MCP_MODE=hybrid

# 启动命令
CMD ["sh", "-c", "node dist/index.js --${MCP_MODE:-hybrid} --host 0.0.0.0 --port 8787"]
