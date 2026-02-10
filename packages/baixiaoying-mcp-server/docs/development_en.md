# Development Guide

## Requirements

- Node.js >= 18 (minimum LTS)
- pnpm

## Development Workflow

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development mode
pnpm dev
```

## Startup Scripts

```bash
# stdio mode (default)
pnpm start

# SSE mode (compatible with Cursor)
pnpm start:sse

# Streamable HTTP mode
pnpm start:http

# Hybrid mode (recommended for server deployment)
pnpm start:hybrid
```

## Docker Deployment

```bash
# Build image
docker build -t baixiaoying-mcp-server .

# Run container (optionally set fallback API Key)
docker run -d \
  -p 8787:8787 \
  baixiaoying-mcp-server

# Or set fallback API Key
docker run -d \
  -p 8787:8787 \
  -e BAICHUAN_API_KEY=your-fallback-key \
  baixiaoying-mcp-server
```
