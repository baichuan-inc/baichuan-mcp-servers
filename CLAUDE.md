# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (UI bundle + TypeScript)
pnpm dev                  # Watch mode for all packages
pnpm lint                 # Type check all packages (tsc --noEmit)
pnpm test                 # Run tests
pnpm clean                # Clean all build outputs
pnpm inspector            # Launch MCP Inspector for interactive debugging
```

### Single Package Commands

```bash
pnpm --filter @baichuan-ai/<package-name> build   # Build specific package
pnpm --filter @baichuan-ai/<package-name> dev     # Watch mode for specific package
pnpm --filter @baichuan-ai/<package-name> start   # Run MCP server (stdio)
pnpm --filter @baichuan-ai/<package-name> start:sse     # Run in SSE mode (Cursor)
pnpm --filter @baichuan-ai/<package-name> start:http    # Run in Streamable HTTP mode
pnpm --filter @baichuan-ai/<package-name> start:hybrid  # Run in hybrid mode (recommended)
```

### Publishing

```bash
pnpm changeset            # Create changeset for version bump
pnpm version-packages     # Update versions from changesets
pnpm release              # Build and publish to npm (runs scripts/publish.mjs --all)
```

## Architecture

This is a **pnpm workspace monorepo** using **Turborepo** for build orchestration. All MCP servers are TypeScript ESM modules (ES2022 target, Node16 module resolution) under the `@baichuan-ai/` npm scope.

### Build Pipeline

Each package has a two-stage build:
1. **UI bundle**: Vite + `vite-plugin-singlefile` compiles HTML templates (e.g., `src/ui/chat-result.html`) into self-contained single-file HTML in `dist/ui/`
2. **TypeScript**: `tsc` compiles all `.ts` to `dist/` with declarations and source maps

### Package Layout

Within each MCP server package (`packages/<name>/`):

```
src/
├── index.ts          # Entry point: server init, transport selection, tool registration
├── tools/            # MCP tool definitions (zod schemas + handlers)
├── api/              # API client (HTTP fetch wrapper, types, error handling)
├── transport/        # Multi-protocol support (stdio, SSE, HTTP, hybrid)
└── ui/               # MCP Apps visual components (HTML templates, resources)
```

### Transport Modes

Servers support four transport modes selected via CLI args:

| Mode | Flag | Endpoints | Use Case |
|------|------|-----------|----------|
| stdio | (default) | — | Claude Desktop, local clients |
| SSE | `--sse` | `/sse`, `/message` | Cursor, legacy MCP clients |
| HTTP | `--http` | `/mcp` | Modern MCP clients |
| Hybrid | `--hybrid` | `/mcp`, `/sse`, `/message` | Server deployment (recommended) |

All HTTP/SSE modes accept `--host` (default: 127.0.0.1) and `--port` (default: 8787).

### MCP Server Pattern

Tools use `registerAppTool` from `@modelcontextprotocol/ext-apps` for MCP Apps UI integration:

```typescript
registerAppTool(
  server,
  "tool-name",
  {
    title: "Display Title",
    description: "Tool description",
    inputSchema: { param: z.string().describe("param description") },
    _meta: { ui: { resourceUri } }
  },
  async (args) => {
    return { content: [{ type: "text", text: "result" }] };
  }
);
```

For simpler tools without UI, use the standard SDK pattern:

```typescript
server.tool("tool-name", "description", { param: z.string() }, async ({ param }) => {
  return { content: [{ type: "text", text: "result" }] };
});
```

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `BAICHUAN_API_KEY` | Yes | — | Baichuan API authentication |
| `BAICHUAN_TIMEOUT_MS` | No | 120000 | API request timeout (ms) |
| `MCP_ALLOWED_ORIGINS` | No | — | CORS origin whitelist (comma-separated) |
| `MCP_ALLOW_EMPTY_ORIGIN` | No | true | Allow requests without Origin header |
| `MCP_SESSION_TTL` | No | 1800000 | Session expiration (ms, 30 min) |

### Creating New MCP Server

1. Copy `packages/baixiaoying-mcp-server` as template
2. Update `package.json`: name (`@baichuan-ai/<name>`), description, bin entry
3. Update `src/index.ts`: server name, version, tool registrations
4. The transport layer (`src/transport/`) is reusable across packages via the `./transport` export
