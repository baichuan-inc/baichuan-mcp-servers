# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages
pnpm dev                  # Watch mode for all packages
pnpm lint                 # Type check all packages
pnpm test                 # Run tests
pnpm clean                # Clean all build outputs
```

### Single Package Commands

```bash
pnpm --filter @baichuan-ai/<package-name> build   # Build specific package
pnpm --filter @baichuan-ai/<package-name> dev     # Watch mode for specific package
pnpm --filter @baichuan-ai/<package-name> start   # Run specific MCP server
```

### Publishing

```bash
pnpm changeset            # Create changeset for version bump
pnpm version-packages     # Update versions from changesets
pnpm release              # Build and publish to npm
```

## Architecture

This is a **pnpm workspace monorepo** using **Turborepo** for build orchestration. All MCP servers are TypeScript ESM modules.

### Package Structure

- `packages/` - Individual MCP server packages, each publishable to npm under `@baichuan-ai/` scope
- Each package extends `tsconfig.base.json` and outputs to its own `dist/` directory

### MCP Server Pattern

Each MCP server follows this structure:

- Uses `@modelcontextprotocol/sdk` with `McpServer` class
- Uses `zod` for tool parameter schema validation
- Communicates via `StdioServerTransport`
- Entry point is `src/index.ts` with shebang for CLI execution

Tool registration pattern:

```typescript
server.tool(
  "tool-name",
  "description",
  { param: z.string().describe("param description") },
  async ({ param }) => {
    return { content: [{ type: "text", text: "result" }] };
  },
);
```

### Creating New MCP Server

1. Copy `packages/baixiaoying-mcp-server` as template
2. Update `package.json`: name (`@baichuan-ai/<name>`), description, bin entry
3. Update `src/index.ts`: server name, version, tools, and resources
