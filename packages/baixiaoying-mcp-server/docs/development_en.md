# Development Guide

## Requirements

- Node.js >= 18 (minimum LTS)
- pnpm

## Installation

```bash
npm install @baichuan-ai/baixiaoying-mcp-server
```

## Environment Variables

| Variable                 | Required    | Description                                                                                                         |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `BAICHUAN_API_KEY`       | Conditional | Baichuan API Key, obtain from [Baichuan Platform](https://platform.baichuan-ai.com/). Required for stdio; fallback for HTTP/SSE |
| `BAICHUAN_TIMEOUT_MS`    | No          | API request timeout (milliseconds, default: 120000)                                                                 |
| `MCP_ALLOWED_ORIGINS`    | No          | Allowed Origin whitelist (comma-separated, HTTP/SSE modes only)                                                     |
| `MCP_ALLOW_EMPTY_ORIGIN` | No          | Allow requests without Origin (true/false, default: true)                                                           |
| `MCP_SESSION_TTL`        | No          | Session expiration (milliseconds, default: 1800000)                                                                 |

> **Authentication**: In HTTP/SSE modes, users pass their Baichuan API Key via the `Authorization: Bearer <your-baichuan-api-key>` header. The server uses this key for subsequent API calls. If not provided, it falls back to the `BAICHUAN_API_KEY` environment variable.

## Transport Protocols

BaiXiaoYing MCP Server supports four transport modes for different scenarios:

| Mode                | Flag       | Endpoints           | Use Case                                          |
| ------------------- | ---------- | ------------------- | ------------------------------------------------- |
| **stdio**           | (default)  | -                   | Claude Desktop, local MCP clients                 |
| **SSE**             | `--sse`    | `/sse` + `/message` | Cursor, legacy SSE clients                        |
| **Streamable HTTP** | `--http`   | `/mcp`              | Modern MCP clients                                |
| **Hybrid**          | `--hybrid` | `/mcp` + `/sse`     | Multi-client support (recommended for deployment) |

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

## Client Configuration

### Claude Desktop (stdio mode)

Add to `claude_desktop_config.json`:

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

Or use local installation:

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

### Cursor (SSE mode)

You can use the official Baichuan SSE service or deploy your own.

**Using the Official SSE Service** (Recommended):

Configure in `~/.cursor/mcp.json`:

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

**Using a Self-Deployed Service**:

1. Start the SSE server:

```bash
BAICHUAN_API_KEY=your-api-key pnpm start:sse --port 8787
```

2. Configure in `~/.cursor/mcp.json`:

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

> If the server has `BAICHUAN_API_KEY` configured as a fallback, the `Authorization` header is optional.

## Server Deployment (Hybrid mode)

Hybrid mode supports both Streamable HTTP and SSE protocols, recommended for server deployment:

```bash
# Start hybrid mode server (optionally set BAICHUAN_API_KEY as fallback)
pnpm start:hybrid --host 0.0.0.0 --port 8787

# Or set fallback API Key
BAICHUAN_API_KEY=your-fallback-key pnpm start:hybrid --host 0.0.0.0 --port 8787
```

> Users pass their Baichuan API Key via `Authorization: Bearer <key>` when connecting. The server automatically uses that key for API calls.

Available endpoints after startup:

| Endpoint   | Protocol        | Purpose                   |
| ---------- | --------------- | ------------------------- |
| `/mcp`     | Streamable HTTP | Modern MCP clients        |
| `/sse`     | Legacy SSE      | Cursor and legacy clients |
| `/message` | Legacy SSE POST | SSE message endpoint      |

## Command Line Options

```bash
baixiaoying-mcp-server [options]

Options:
  --sse               Enable SSE mode (compatible with Cursor)
  --http              Enable Streamable HTTP mode
  --hybrid            Enable Hybrid mode (supports both HTTP and SSE)
  --host <address>    Listen address (default: 127.0.0.1)
  --port <port>       Listen port (default: 8787)
  --endpoint <path>   MCP endpoint path (default: /mcp)
  --help, -h          Show help information
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
