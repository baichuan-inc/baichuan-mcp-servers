Title: Quickstart | @modelcontextprotocol/ext-apps - v1.0.1

URL Source: https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html

Published Time: Tue, 27 Jan 2026 23:44:47 GMT

Markdown Content:
Quickstart | @modelcontextprotocol/ext-apps - v1.0.1
===============

[@modelcontextprotocol/ext-apps - v1.0.1](https://modelcontextprotocol.github.io/ext-apps/api/index.html)

[GitHub](https://github.com/modelcontextprotocol/ext-apps)[Specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)

[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#)

- [Quickstart](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html)

# Build Your First MCP App[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#build-your-first-mcp-app)

This tutorial walks you through building an MCP App—a tool with an interactive **View** (a UI that renders inside an iframe) that displays in MCP hosts like Claude Desktop.

Tip

Feel like vibe coding instead? Try the [MCP Apps agent skills](https://modelcontextprotocol.github.io/ext-apps/api/documents/Agent_Skills.html).

## What You'll Build[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#what-youll-build)

A simple app that fetches the current server time and displays it in an interactive View. You'll learn the core pattern: **MCP Apps = Tool + UI Resource**. The complete example is available in [`examples/quickstart`](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/quickstart).

## Prerequisites[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#prerequisites)

This tutorial assumes you've built an MCP server before and are comfortable with [Tools](https://modelcontextprotocol.io/docs/learn/server-concepts#tools) and [Resources](https://modelcontextprotocol.io/docs/learn/server-concepts#resources). If not, the [official MCP quickstart](https://modelcontextprotocol.io/docs/develop/build-server) is a good place to start.

We'll use the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) to build the server.

You'll also need Node.js 18+.

1. Set up the project[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#1-set-up-the-project)

---

We'll set up a minimal TypeScript project with Vite for bundling.

Start by creating a project directory:

```
mkdir my-mcp-app && cd my-mcp-app
```

Copy
Install the dependencies you'll need:

```
npm init -ynpm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk express corsnpm install -D typescript vite vite-plugin-singlefile @types/express @types/cors @types/node tsx concurrently cross-env
```

Copy
Configure your [`package.json`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/package.json):

```
npm pkg set type=modulenpm pkg set scripts.build="tsc --noEmit && tsc -p tsconfig.server.json && cross-env INPUT=mcp-app.html vite build"npm pkg set scripts.start="concurrently 'cross-env NODE_ENV=development INPUT=mcp-app.html vite build --watch' 'tsx watch main.ts'"
```

Copy

Create [`tsconfig.json`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/tsconfig.json):

```
{  "compilerOptions": {    "target": "ESNext",    "lib": ["ESNext", "DOM", "DOM.Iterable"],    "module": "ESNext",    "moduleResolution": "bundler",    "allowImportingTsExtensions": true,    "resolveJsonModule": true,    "isolatedModules": true,    "verbatimModuleSyntax": true,    "noEmit": true,    "strict": true,    "skipLibCheck": true,    "noUnusedLocals": true,    "noUnusedParameters": true,    "noFallthroughCasesInSwitch": true  },  "include": ["src", "server.ts", "main.ts"]}
```

Copy

Create [`tsconfig.server.json`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/tsconfig.server.json) — for compiling server-side code:

```
{  "compilerOptions": {    "target": "ES2022",    "lib": ["ES2022"],    "module": "NodeNext",    "moduleResolution": "NodeNext",    "declaration": true,    "emitDeclarationOnly": true,    "outDir": "./dist",    "rootDir": ".",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "noUnusedLocals": true,    "noUnusedParameters": true,    "noFallthroughCasesInSwitch": true  },  "include": ["server.ts", "main.ts"]}
```

Copy

Create [`vite.config.ts`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/vite.config.ts) — bundles UI into a single HTML file:

```
import { defineConfig } from "vite";import { viteSingleFile } from "vite-plugin-singlefile";const INPUT = process.env.INPUT;if (!INPUT) {  throw new Error("INPUT environment variable is not set");}const isDevelopment = process.env.NODE_ENV === "development";export default defineConfig({  plugins: [viteSingleFile()],  build: {    sourcemap: isDevelopment ? "inline" : undefined,    cssMinify: !isDevelopment,    minify: !isDevelopment,    rollupOptions: {      input: INPUT,    },    outDir: "dist",    emptyOutDir: false,  },});
```

Copy

Your `my-mcp-app` directory should now contain:

```
my-mcp-app/├── package.json├── tsconfig.json├── tsconfig.server.json└── vite.config.ts
```

Copy
With the project scaffolded, let's write the server code.

2. Register the tool and UI resource[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#2-register-the-tool-and-ui-resource)

---

MCP Apps use a **two-part registration**:

1.  A **tool** that the LLM/host calls
2.  A **resource** that contains the View HTML

The tool's `_meta` field links them together via the resource's URI. When an MCP Apps-capable host calls the tool, it will also read the resource and render the View.

Create [`server.ts`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/server.ts), which registers the tool and its UI resource:

```
import {  registerAppResource,  registerAppTool,  RESOURCE_MIME_TYPE,} from "@modelcontextprotocol/ext-apps/server";import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";import fs from "node:fs/promises";import path from "node:path";const DIST_DIR = path.join(import.meta.dirname, "dist");/** * Creates a new MCP server instance with tools and resources registered. */export function createServer(): McpServer {  const server = new McpServer({    name: "Quickstart MCP App Server",    version: "1.0.0",  });  // Two-part registration: tool + resource, tied together by the resource URI.  const resourceUri = "ui://get-time/mcp-app.html";  // Register a tool with UI metadata. When the host calls this tool, it reads  // `_meta.ui.resourceUri` to know which resource to fetch and render as an  // interactive UI.  registerAppTool(    server,    "get-time",    {      title: "Get Time",      description: "Returns the current server time.",      inputSchema: {},      _meta: { ui: { resourceUri } }, // Links this tool to its UI resource    },    async () => {      const time = new Date().toISOString();      return { content: [{ type: "text", text: time }] };    },  );  // Register the resource, which returns the bundled HTML/JavaScript for the UI.  registerAppResource(    server,    resourceUri,    resourceUri,    { mimeType: RESOURCE_MIME_TYPE },    async () => {      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");      return {        contents: [          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },        ],      };    },  );  return server;}
```

Copy

Create [`main.ts`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/main.ts) — the entry point that starts the server:

```
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";import cors from "cors";import type { Request, Response } from "express";import { createServer } from "./server.js";/** * Starts an MCP server with Streamable HTTP transport in stateless mode. * * @param createServer - Factory function that creates a new McpServer instance per request. */export async function startStreamableHTTPServer(  createServer: () => McpServer,): Promise<void> {  const port = parseInt(process.env.PORT ?? "3001", 10);  const app = createMcpExpressApp({ host: "0.0.0.0" });  app.use(cors());  app.all("/mcp", async (req: Request, res: Response) => {    const server = createServer();    const transport = new StreamableHTTPServerTransport({      sessionIdGenerator: undefined,    });    res.on("close", () => {      transport.close().catch(() => {});      server.close().catch(() => {});    });    try {      await server.connect(transport);      await transport.handleRequest(req, res, req.body);    } catch (error) {      console.error("MCP error:", error);      if (!res.headersSent) {        res.status(500).json({          jsonrpc: "2.0",          error: { code: -32603, message: "Internal server error" },          id: null,        });      }    }  });  const httpServer = app.listen(port, (err) => {    if (err) {      console.error("Failed to start server:", err);      process.exit(1);    }    console.log(`MCP server listening on http://localhost:${port}/mcp`);  });  const shutdown = () => {    console.log("\nShutting down...");    httpServer.close(() => process.exit(0));  };  process.on("SIGINT", shutdown);  process.on("SIGTERM", shutdown);}/** * Starts an MCP server with stdio transport. * * @param createServer - Factory function that creates a new McpServer instance. */export async function startStdioServer(  createServer: () => McpServer,): Promise<void> {  await createServer().connect(new StdioServerTransport());}async function main() {  if (process.argv.includes("--stdio")) {    await startStdioServer(createServer);  } else {    await startStreamableHTTPServer(createServer);  }}main().catch((e) => {  console.error(e);  process.exit(1);});
```

Copy

Your `my-mcp-app` directory should now contain:

```
my-mcp-app/├── main.ts├── package.json├── server.ts├── tsconfig.json├── tsconfig.server.json└── vite.config.ts
```

Copy
Let's verify everything compiles:

```
npx tsc --noEmit
```

Copy
No output means success! If you see errors, check for typos in `server.ts` or `main.ts`.

The server can return the current time when the tool is called. Now let's build the UI to display it.

3. Build the View[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#3-build-the-view)

---

The View consists of an HTML page and a script that connects to the host.

Create [`mcp-app.html`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/mcp-app.html), the HTML for your View:

```
<!DOCTYPE html><html lang="en">  <head>    <meta charset="UTF-8" />    <title>Get Time App</title>  </head>  <body>    <p>      <strong>Server Time:</strong> <code id="server-time">Loading...</code>    </p>    <button id="get-time-btn">Get Server Time</button>    <script type="module" src="/src/mcp-app.ts"></script>  </body></html>
```

Copy
Create [`src/mcp-app.ts`](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/quickstart/src/mcp-app.ts), which connects to the host and handles user interactions:

```
import { App } from "@modelcontextprotocol/ext-apps";// Get element referencesconst serverTimeEl = document.getElementById("server-time")!;const getTimeBtn = document.getElementById("get-time-btn")!;// Create app instanceconst app = new App({ name: "Get Time App", version: "1.0.0" });// Handle tool results from the server. Set before `app.connect()` to avoid// missing the initial tool result.app.ontoolresult = (result) => {  const time = result.content?.find((c) => c.type === "text")?.text;  serverTimeEl.textContent = time ?? "[ERROR]";};// Wire up button clickgetTimeBtn.addEventListener("click", async () => {  // `app.callServerTool()` lets the UI request fresh data from the server  const result = await app.callServerTool({ name: "get-time", arguments: {} });  const time = result.content?.find((c) => c.type === "text")?.text;  serverTimeEl.textContent = time ?? "[ERROR]";});// Connect to hostapp.connect();
```

Copy
Your `my-mcp-app` directory should now contain:

```
my-mcp-app/├── main.ts├── mcp-app.html├── package.json├── server.ts├── src/│   └── mcp-app.ts├── tsconfig.json├── tsconfig.server.json└── vite.config.ts
```

Copy
Now let's build the bundled View:

```
npm run build
```

Copy
This produces `dist/mcp-app.html`:

```
$ ls dist/mcp-app.html
```

Copy
The View will connect to the host, receive the tool result, and display it. Let's see it in action!

4. See it in action[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#4-see-it-in-action)

---

You'll need two terminal windows.

**Terminal 1** — Start your server (with watch mode):

```
npm start
```

Copy
You should see:

```
MCP server listening on http://localhost:3001/mcp
```

Copy
**Terminal 2** — Run the test host (from the [ext-apps repo](https://github.com/modelcontextprotocol/ext-apps)):

```
git clone https://github.com/modelcontextprotocol/ext-apps.gitcd ext-apps/examples/basic-hostnpm installnpm start
```

Copy
Open [http://localhost:8080](http://localhost:8080/) in your browser:

1.  Select **get-time** from the "Tool Name" dropdown
2.  Click **Call Tool**
3.  Your View renders in the sandbox below
4.  Click **Get Server Time** — the current time appears!

![Image 2: Your first MCP App](https://modelcontextprotocol.github.io/ext-apps/api/media/quickstart-success.png)

You've built your first MCP App!

## Next Steps[](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#next-steps)

- **Continue learning**: The [`basic-server-vanillajs`](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-vanillajs) example builds on this quickstart with host communication, theming, and lifecycle handlers
- **React version**: Compare with [`basic-server-react`](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-react) for a React-based UI
- **Other frameworks**: See also [Vue](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-vue), [Svelte](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-svelte), [Preact](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-preact), and [Solid](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-solid) examples
- **API reference**: See the full [API documentation](https://modelcontextprotocol.github.io/ext-apps/api/)

### Settings

Member Visibility

- - [x] Protected
- - [x] Inherited
- - [x] External

Theme

### On This Page

[Build Your First MCP App](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#build-your-first-mcp-app)

- [What You'll Build](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#what-youll-build)
- [Prerequisites](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#prerequisites)
- [1. Set up the project](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#1-set-up-the-project)
- [2. Register the tool and UI resource](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#2-register-the-tool-and-ui-resource)
- [3. Build the View](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#3-build-the-view)
- [4. See it in action](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#4-see-it-in-action)
- [Next Steps](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html#next-steps)

[GitHub](https://github.com/modelcontextprotocol/ext-apps)[Specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)[@modelcontextprotocol/ext-apps - v1.0.1](https://modelcontextprotocol.github.io/ext-apps/api/modules.html)

- Documents

      *   [Overview](https://modelcontextprotocol.github.io/ext-apps/api/documents/Overview.html)
      *   [Quickstart](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html)
      *   [Agent Skills](https://modelcontextprotocol.github.io/ext-apps/api/documents/Agent_Skills.html)
      *   [Testing MCP Apps](https://modelcontextprotocol.github.io/ext-apps/api/documents/Testing_MCP_Apps.html)
      *   [Patterns](https://modelcontextprotocol.github.io/ext-apps/api/documents/Patterns.html)
      *   [Migrate Open AI App](https://modelcontextprotocol.github.io/ext-apps/api/documents/Migrate_OpenAI_App.html)

- Modules

      *

  [@modelcontextprotocol/ext-apps/react](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html)

          *

  Interfaces

              *   [App State](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/_modelcontextprotocol_ext-apps_react.AppState.html)
              *   [Use App Options](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/_modelcontextprotocol_ext-apps_react.UseAppOptions.html)

          *

  Functions

              *   [use App](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useApp.html)
              *   [use Auto Resize](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useAutoResize.html)
              *   [use Document Theme](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useDocumentTheme.html)
              *   [use Host Fonts](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useHostFonts.html)
              *   [use Host Styles](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useHostStyles.html)
              *   [use Host Style Variables](https://modelcontextprotocol.github.io/ext-apps/api/functions/_modelcontextprotocol_ext-apps_react.useHostStyleVariables.html)

          *

  References

              *   [App](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#app)
              *   [apply Document Theme](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#applydocumenttheme)
              *   [apply Host Fonts](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#applyhostfonts)
              *   [apply Host Style Variables](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#applyhoststylevariables)
              *   [App Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#appnotification)
              *   [App Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#apprequest)
              *   [App Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#appresult)
              *   [get Document Theme](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#getdocumenttheme)
              *   [HOST_ CONTEXT_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#host_context_changed_method)
              *   [INITIALIZE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#initialize_method)
              *   [INITIALIZED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#initialized_method)
              *   [LATEST_ PROTOCOL_ VERSION](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#latest_protocol_version)
              *   [Mcp Ui App Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiappcapabilities)
              *   [Mcp Ui App Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiappcapabilitiesschema)
              *   [Mcp Ui Client Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiclientcapabilities)
              *   [Mcp Ui Display Mode](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuidisplaymode)
              *   [Mcp Ui Display Mode Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuidisplaymodeschema)
              *   [Mcp Ui Host Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcapabilities)
              *   [Mcp Ui Host Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcapabilitiesschema)
              *   [Mcp Ui Host Context](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcontext)
              *   [Mcp Ui Host Context Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcontextchangednotification)
              *   [Mcp Ui Host Context Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcontextchangednotificationschema)
              *   [Mcp Ui Host Context Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcontextschema)
              *   [Mcp Ui Host Css](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcss)
              *   [Mcp Ui Host Css Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihostcssschema)
              *   [Mcp Ui Host Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihoststyles)
              *   [Mcp Ui Host Styles Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuihoststylesschema)
              *   [Mcp Ui Initialized Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializednotification)
              *   [Mcp Ui Initialized Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializednotificationschema)
              *   [Mcp Ui Initialize Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializerequest)
              *   [Mcp Ui Initialize Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializerequestschema)
              *   [Mcp Ui Initialize Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializeresult)
              *   [Mcp Ui Initialize Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiinitializeresultschema)
              *   [Mcp Ui Message Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuimessagerequest)
              *   [Mcp Ui Message Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuimessagerequestschema)
              *   [Mcp Ui Message Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuimessageresult)
              *   [Mcp Ui Message Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuimessageresultschema)
              *   [Mcp Ui Open Link Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiopenlinkrequest)
              *   [Mcp Ui Open Link Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiopenlinkrequestschema)
              *   [Mcp Ui Open Link Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiopenlinkresult)
              *   [Mcp Ui Open Link Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiopenlinkresultschema)
              *   [Mcp Ui Request Display Mode Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuirequestdisplaymoderequest)
              *   [Mcp Ui Request Display Mode Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuirequestdisplaymoderequestschema)
              *   [Mcp Ui Request Display Mode Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuirequestdisplaymoderesult)
              *   [Mcp Ui Request Display Mode Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuirequestdisplaymoderesultschema)
              *   [Mcp Ui Resource Csp](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcecsp)
              *   [Mcp Ui Resource Csp Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcecspschema)
              *   [Mcp Ui Resource Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcemeta)
              *   [Mcp Ui Resource Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcemetaschema)
              *   [Mcp Ui Resource Permissions](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcepermissions)
              *   [Mcp Ui Resource Permissions Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourcepermissionsschema)
              *   [Mcp Ui Resource Teardown Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourceteardownrequest)
              *   [Mcp Ui Resource Teardown Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourceteardownrequestschema)
              *   [Mcp Ui Resource Teardown Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourceteardownresult)
              *   [Mcp Ui Resource Teardown Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiresourceteardownresultschema)
              *   [Mcp Ui Sandbox Proxy Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisandboxproxyreadynotification)
              *   [Mcp Ui Sandbox Proxy Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisandboxproxyreadynotificationschema)
              *   [Mcp Ui Sandbox Resource Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisandboxresourcereadynotification)
              *   [Mcp Ui Sandbox Resource Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisandboxresourcereadynotificationschema)
              *   [Mcp Ui Size Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisizechangednotification)
              *   [Mcp Ui Size Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisizechangednotificationschema)
              *   [Mcp Ui Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuistyles)
              *   [Mcp Ui Style Variable Key](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuistylevariablekey)
              *   [Mcp Ui Supported Content Block Modalities](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisupportedcontentblockmodalities)
              *   [Mcp Ui Supported Content Block Modalities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuisupportedcontentblockmodalitiesschema)
              *   [Mcp Ui Theme](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitheme)
              *   [Mcp Ui Theme Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuithemeschema)
              *   [Mcp Ui Tool Cancelled Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolcancellednotification)
              *   [Mcp Ui Tool Cancelled Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolcancellednotificationschema)
              *   [Mcp Ui Tool Input Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolinputnotification)
              *   [Mcp Ui Tool Input Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolinputnotificationschema)
              *   [Mcp Ui Tool Input Partial Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolinputpartialnotification)
              *   [Mcp Ui Tool Input Partial Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolinputpartialnotificationschema)
              *   [Mcp Ui Tool Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolmeta)
              *   [Mcp Ui Tool Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolmetaschema)
              *   [Mcp Ui Tool Result Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolresultnotification)
              *   [Mcp Ui Tool Result Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolresultnotificationschema)
              *   [Mcp Ui Tool Visibility](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolvisibility)
              *   [Mcp Ui Tool Visibility Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuitoolvisibilityschema)
              *   [Mcp Ui Update Model Context Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiupdatemodelcontextrequest)
              *   [Mcp Ui Update Model Context Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#mcpuiupdatemodelcontextrequestschema)
              *   [MESSAGE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#message_method)
              *   [OPEN_ LINK_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#open_link_method)
              *   [Post Message Transport](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#postmessagetransport)
              *   [REQUEST_ DISPLAY_ MODE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#request_display_mode_method)
              *   [RESOURCE_ MIME_ TYPE](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#resource_mime_type)
              *   [RESOURCE_ TEARDOWN_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#resource_teardown_method)
              *   [RESOURCE_ URI_ META_ KEY](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#resource_uri_meta_key)
              *   [SANDBOX_ PROXY_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#sandbox_proxy_ready_method)
              *   [SANDBOX_ RESOURCE_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#sandbox_resource_ready_method)
              *   [SIZE_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#size_changed_method)
              *   [TOOL_ CANCELLED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#tool_cancelled_method)
              *   [TOOL_ INPUT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#tool_input_method)
              *   [TOOL_ INPUT_ PARTIAL_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#tool_input_partial_method)
              *   [TOOL_ RESULT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/_modelcontextprotocol_ext-apps_react.html#tool_result_method)

      *

  [app](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html)

          *

  Classes

              *   [App](https://modelcontextprotocol.github.io/ext-apps/api/classes/app.App.html)

          *

  Interfaces

              *   [Mcp Ui App Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiAppCapabilities.html)
              *   [Mcp Ui Client Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiClientCapabilities.html)
              *   [Mcp Ui Host Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiHostCapabilities.html)
              *   [Mcp Ui Host Context](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiHostContext.html)
              *   [Mcp Ui Host Context Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiHostContextChangedNotification.html)
              *   [Mcp Ui Host Css](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiHostCss.html)
              *   [Mcp Ui Host Styles](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiHostStyles.html)
              *   [Mcp Ui Initialized Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiInitializedNotification.html)
              *   [Mcp Ui Initialize Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiInitializeRequest.html)
              *   [Mcp Ui Initialize Result](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiInitializeResult.html)
              *   [Mcp Ui Message Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiMessageRequest.html)
              *   [Mcp Ui Message Result](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiMessageResult.html)
              *   [Mcp Ui Open Link Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiOpenLinkRequest.html)
              *   [Mcp Ui Open Link Result](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiOpenLinkResult.html)
              *   [Mcp Ui Request Display Mode Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiRequestDisplayModeRequest.html)
              *   [Mcp Ui Request Display Mode Result](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiRequestDisplayModeResult.html)
              *   [Mcp Ui Resource Csp](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiResourceCsp.html)
              *   [Mcp Ui Resource Meta](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiResourceMeta.html)
              *   [Mcp Ui Resource Permissions](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiResourcePermissions.html)
              *   [Mcp Ui Resource Teardown Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiResourceTeardownRequest.html)
              *   [Mcp Ui Resource Teardown Result](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiResourceTeardownResult.html)
              *   [Mcp Ui Sandbox Proxy Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiSandboxProxyReadyNotification.html)
              *   [Mcp Ui Sandbox Resource Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiSandboxResourceReadyNotification.html)
              *   [Mcp Ui Size Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiSizeChangedNotification.html)
              *   [Mcp Ui Supported Content Block Modalities](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiSupportedContentBlockModalities.html)
              *   [Mcp Ui Tool Cancelled Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiToolCancelledNotification.html)
              *   [Mcp Ui Tool Input Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiToolInputNotification.html)
              *   [Mcp Ui Tool Input Partial Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiToolInputPartialNotification.html)
              *   [Mcp Ui Tool Meta](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiToolMeta.html)
              *   [Mcp Ui Tool Result Notification](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiToolResultNotification.html)
              *   [Mcp Ui Update Model Context Request](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/app.McpUiUpdateModelContextRequest.html)

          *

  Type Aliases

              *   [Mcp Ui Display Mode](https://modelcontextprotocol.github.io/ext-apps/api/types/app.McpUiDisplayMode.html)
              *   [Mcp Ui Styles](https://modelcontextprotocol.github.io/ext-apps/api/types/app.McpUiStyles.html)
              *   [Mcp Ui Style Variable Key](https://modelcontextprotocol.github.io/ext-apps/api/types/app.McpUiStyleVariableKey.html)
              *   [Mcp Ui Theme](https://modelcontextprotocol.github.io/ext-apps/api/types/app.McpUiTheme.html)
              *   [Mcp Ui Tool Visibility](https://modelcontextprotocol.github.io/ext-apps/api/types/app.McpUiToolVisibility.html)

          *

  Variables

              *   [HOST_ CONTEXT_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.HOST_CONTEXT_CHANGED_METHOD.html)
              *   [INITIALIZE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.INITIALIZE_METHOD.html)
              *   [INITIALIZED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.INITIALIZED_METHOD.html)
              *   [LATEST_ PROTOCOL_ VERSION](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.LATEST_PROTOCOL_VERSION.html)
              *   [Mcp Ui App Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiAppCapabilitiesSchema.html)
              *   [Mcp Ui Display Mode Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiDisplayModeSchema.html)
              *   [Mcp Ui Host Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiHostCapabilitiesSchema.html)
              *   [Mcp Ui Host Context Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiHostContextChangedNotificationSchema.html)
              *   [Mcp Ui Host Context Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiHostContextSchema.html)
              *   [Mcp Ui Host Css Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiHostCssSchema.html)
              *   [Mcp Ui Host Styles Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiHostStylesSchema.html)
              *   [Mcp Ui Initialized Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiInitializedNotificationSchema.html)
              *   [Mcp Ui Initialize Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiInitializeRequestSchema.html)
              *   [Mcp Ui Initialize Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiInitializeResultSchema.html)
              *   [Mcp Ui Message Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiMessageRequestSchema.html)
              *   [Mcp Ui Message Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiMessageResultSchema.html)
              *   [Mcp Ui Open Link Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiOpenLinkRequestSchema.html)
              *   [Mcp Ui Open Link Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiOpenLinkResultSchema.html)
              *   [Mcp Ui Request Display Mode Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiRequestDisplayModeRequestSchema.html)
              *   [Mcp Ui Request Display Mode Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiRequestDisplayModeResultSchema.html)
              *   [Mcp Ui Resource Csp Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiResourceCspSchema.html)
              *   [Mcp Ui Resource Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiResourceMetaSchema.html)
              *   [Mcp Ui Resource Permissions Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiResourcePermissionsSchema.html)
              *   [Mcp Ui Resource Teardown Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiResourceTeardownRequestSchema.html)
              *   [Mcp Ui Resource Teardown Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiResourceTeardownResultSchema.html)
              *   [Mcp Ui Sandbox Proxy Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiSandboxProxyReadyNotificationSchema.html)
              *   [Mcp Ui Sandbox Resource Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiSandboxResourceReadyNotificationSchema.html)
              *   [Mcp Ui Size Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiSizeChangedNotificationSchema.html)
              *   [Mcp Ui Supported Content Block Modalities Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiSupportedContentBlockModalitiesSchema.html)
              *   [Mcp Ui Theme Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiThemeSchema.html)
              *   [Mcp Ui Tool Cancelled Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolCancelledNotificationSchema.html)
              *   [Mcp Ui Tool Input Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolInputNotificationSchema.html)
              *   [Mcp Ui Tool Input Partial Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolInputPartialNotificationSchema.html)
              *   [Mcp Ui Tool Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolMetaSchema.html)
              *   [Mcp Ui Tool Result Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolResultNotificationSchema.html)
              *   [Mcp Ui Tool Visibility Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiToolVisibilitySchema.html)
              *   [Mcp Ui Update Model Context Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.McpUiUpdateModelContextRequestSchema.html)
              *   [MESSAGE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.MESSAGE_METHOD.html)
              *   [OPEN_ LINK_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.OPEN_LINK_METHOD.html)
              *   [REQUEST_ DISPLAY_ MODE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.REQUEST_DISPLAY_MODE_METHOD.html)
              *   [RESOURCE_ MIME_ TYPE](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.RESOURCE_MIME_TYPE.html)
              *   [RESOURCE_ TEARDOWN_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.RESOURCE_TEARDOWN_METHOD.html)
              *   [RESOURCE_ URI_ META_ KEY](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.RESOURCE_URI_META_KEY.html)
              *   [SANDBOX_ PROXY_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.SANDBOX_PROXY_READY_METHOD.html)
              *   [SANDBOX_ RESOURCE_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.SANDBOX_RESOURCE_READY_METHOD.html)
              *   [SIZE_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.SIZE_CHANGED_METHOD.html)
              *   [TOOL_ CANCELLED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.TOOL_CANCELLED_METHOD.html)
              *   [TOOL_ INPUT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.TOOL_INPUT_METHOD.html)
              *   [TOOL_ INPUT_ PARTIAL_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.TOOL_INPUT_PARTIAL_METHOD.html)
              *   [TOOL_ RESULT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/variables/app.TOOL_RESULT_METHOD.html)

          *

  Functions

              *   [apply Document Theme](https://modelcontextprotocol.github.io/ext-apps/api/functions/app.applyDocumentTheme.html)
              *   [apply Host Fonts](https://modelcontextprotocol.github.io/ext-apps/api/functions/app.applyHostFonts.html)
              *   [apply Host Style Variables](https://modelcontextprotocol.github.io/ext-apps/api/functions/app.applyHostStyleVariables.html)
              *   [get Document Theme](https://modelcontextprotocol.github.io/ext-apps/api/functions/app.getDocumentTheme.html)

          *

  References

              *   [App Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html#appnotification)
              *   [App Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html#apprequest)
              *   [App Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html#appresult)
              *   [Post Message Transport](https://modelcontextprotocol.github.io/ext-apps/api/modules/app.html#postmessagetransport)

      *

  [app-bridge](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html)

          *

  Classes

              *   [App Bridge](https://modelcontextprotocol.github.io/ext-apps/api/classes/app-bridge.AppBridge.html)

          *

  Type Aliases

              *   [Host Options](https://modelcontextprotocol.github.io/ext-apps/api/types/app-bridge.HostOptions.html)

          *

  Variables

              *   [SUPPORTED_ PROTOCOL_ VERSIONS](https://modelcontextprotocol.github.io/ext-apps/api/variables/app-bridge.SUPPORTED_PROTOCOL_VERSIONS.html)

          *

  Functions

              *   [build Allow Attribute](https://modelcontextprotocol.github.io/ext-apps/api/functions/app-bridge.buildAllowAttribute.html)
              *   [get Tool Ui Resource Uri](https://modelcontextprotocol.github.io/ext-apps/api/functions/app-bridge.getToolUiResourceUri.html)

          *

  References

              *   [App Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#appnotification)
              *   [App Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#apprequest)
              *   [App Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#appresult)
              *   [HOST_ CONTEXT_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#host_context_changed_method)
              *   [INITIALIZE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#initialize_method)
              *   [INITIALIZED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#initialized_method)
              *   [LATEST_ PROTOCOL_ VERSION](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#latest_protocol_version)
              *   [Mcp Ui App Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiappcapabilities)
              *   [Mcp Ui App Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiappcapabilitiesschema)
              *   [Mcp Ui Client Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiclientcapabilities)
              *   [Mcp Ui Display Mode](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuidisplaymode)
              *   [Mcp Ui Display Mode Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuidisplaymodeschema)
              *   [Mcp Ui Host Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcapabilities)
              *   [Mcp Ui Host Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcapabilitiesschema)
              *   [Mcp Ui Host Context](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcontext)
              *   [Mcp Ui Host Context Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcontextchangednotification)
              *   [Mcp Ui Host Context Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcontextchangednotificationschema)
              *   [Mcp Ui Host Context Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcontextschema)
              *   [Mcp Ui Host Css](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcss)
              *   [Mcp Ui Host Css Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihostcssschema)
              *   [Mcp Ui Host Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihoststyles)
              *   [Mcp Ui Host Styles Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuihoststylesschema)
              *   [Mcp Ui Initialized Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializednotification)
              *   [Mcp Ui Initialized Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializednotificationschema)
              *   [Mcp Ui Initialize Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializerequest)
              *   [Mcp Ui Initialize Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializerequestschema)
              *   [Mcp Ui Initialize Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializeresult)
              *   [Mcp Ui Initialize Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiinitializeresultschema)
              *   [Mcp Ui Message Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuimessagerequest)
              *   [Mcp Ui Message Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuimessagerequestschema)
              *   [Mcp Ui Message Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuimessageresult)
              *   [Mcp Ui Message Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuimessageresultschema)
              *   [Mcp Ui Open Link Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiopenlinkrequest)
              *   [Mcp Ui Open Link Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiopenlinkrequestschema)
              *   [Mcp Ui Open Link Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiopenlinkresult)
              *   [Mcp Ui Open Link Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiopenlinkresultschema)
              *   [Mcp Ui Request Display Mode Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuirequestdisplaymoderequest)
              *   [Mcp Ui Request Display Mode Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuirequestdisplaymoderequestschema)
              *   [Mcp Ui Request Display Mode Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuirequestdisplaymoderesult)
              *   [Mcp Ui Request Display Mode Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuirequestdisplaymoderesultschema)
              *   [Mcp Ui Resource Csp](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcecsp)
              *   [Mcp Ui Resource Csp Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcecspschema)
              *   [Mcp Ui Resource Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcemeta)
              *   [Mcp Ui Resource Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcemetaschema)
              *   [Mcp Ui Resource Permissions](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcepermissions)
              *   [Mcp Ui Resource Permissions Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourcepermissionsschema)
              *   [Mcp Ui Resource Teardown Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourceteardownrequest)
              *   [Mcp Ui Resource Teardown Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourceteardownrequestschema)
              *   [Mcp Ui Resource Teardown Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourceteardownresult)
              *   [Mcp Ui Resource Teardown Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiresourceteardownresultschema)
              *   [Mcp Ui Sandbox Proxy Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisandboxproxyreadynotification)
              *   [Mcp Ui Sandbox Proxy Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisandboxproxyreadynotificationschema)
              *   [Mcp Ui Sandbox Resource Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisandboxresourcereadynotification)
              *   [Mcp Ui Sandbox Resource Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisandboxresourcereadynotificationschema)
              *   [Mcp Ui Size Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisizechangednotification)
              *   [Mcp Ui Size Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisizechangednotificationschema)
              *   [Mcp Ui Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuistyles)
              *   [Mcp Ui Style Variable Key](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuistylevariablekey)
              *   [Mcp Ui Supported Content Block Modalities](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisupportedcontentblockmodalities)
              *   [Mcp Ui Supported Content Block Modalities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuisupportedcontentblockmodalitiesschema)
              *   [Mcp Ui Theme](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitheme)
              *   [Mcp Ui Theme Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuithemeschema)
              *   [Mcp Ui Tool Cancelled Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolcancellednotification)
              *   [Mcp Ui Tool Cancelled Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolcancellednotificationschema)
              *   [Mcp Ui Tool Input Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolinputnotification)
              *   [Mcp Ui Tool Input Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolinputnotificationschema)
              *   [Mcp Ui Tool Input Partial Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolinputpartialnotification)
              *   [Mcp Ui Tool Input Partial Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolinputpartialnotificationschema)
              *   [Mcp Ui Tool Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolmeta)
              *   [Mcp Ui Tool Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolmetaschema)
              *   [Mcp Ui Tool Result Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolresultnotification)
              *   [Mcp Ui Tool Result Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolresultnotificationschema)
              *   [Mcp Ui Tool Visibility](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolvisibility)
              *   [Mcp Ui Tool Visibility Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuitoolvisibilityschema)
              *   [Mcp Ui Update Model Context Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiupdatemodelcontextrequest)
              *   [Mcp Ui Update Model Context Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#mcpuiupdatemodelcontextrequestschema)
              *   [MESSAGE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#message_method)
              *   [OPEN_ LINK_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#open_link_method)
              *   [Post Message Transport](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#postmessagetransport)
              *   [REQUEST_ DISPLAY_ MODE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#request_display_mode_method)
              *   [RESOURCE_ MIME_ TYPE](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#resource_mime_type)
              *   [RESOURCE_ TEARDOWN_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#resource_teardown_method)
              *   [RESOURCE_ URI_ META_ KEY](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#resource_uri_meta_key)
              *   [SANDBOX_ PROXY_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#sandbox_proxy_ready_method)
              *   [SANDBOX_ RESOURCE_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#sandbox_resource_ready_method)
              *   [SIZE_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#size_changed_method)
              *   [TOOL_ CANCELLED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#tool_cancelled_method)
              *   [TOOL_ INPUT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#tool_input_method)
              *   [TOOL_ INPUT_ PARTIAL_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#tool_input_partial_method)
              *   [TOOL_ RESULT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/app-bridge.html#tool_result_method)

      *

  [message-transport](https://modelcontextprotocol.github.io/ext-apps/api/modules/message-transport.html)

          *

  Classes

              *   [Post Message Transport](https://modelcontextprotocol.github.io/ext-apps/api/classes/message-transport.PostMessageTransport.html)

      *

  [server-helpers](https://modelcontextprotocol.github.io/ext-apps/api/modules/server-helpers.html)

          *

  Interfaces

              *   [Mcp Ui App Resource Config](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/server-helpers.McpUiAppResourceConfig.html)
              *   [Mcp Ui App Tool Config](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/server-helpers.McpUiAppToolConfig.html)
              *   [Tool Config](https://modelcontextprotocol.github.io/ext-apps/api/interfaces/server-helpers.ToolConfig.html)

          *

  Type Aliases

              *   [Read Resource Callback](https://modelcontextprotocol.github.io/ext-apps/api/types/server-helpers.ReadResourceCallback.html)
              *   [Resource Metadata](https://modelcontextprotocol.github.io/ext-apps/api/types/server-helpers.ResourceMetadata.html)
              *   [Tool Callback](https://modelcontextprotocol.github.io/ext-apps/api/types/server-helpers.ToolCallback.html)

          *

  Variables

              *   [EXTENSION_ ID](https://modelcontextprotocol.github.io/ext-apps/api/variables/server-helpers.EXTENSION_ID.html)

          *

  Functions

              *   [get Ui Capability](https://modelcontextprotocol.github.io/ext-apps/api/functions/server-helpers.getUiCapability.html)
              *   [register App Resource](https://modelcontextprotocol.github.io/ext-apps/api/functions/server-helpers.registerAppResource.html)
              *   [register App Tool](https://modelcontextprotocol.github.io/ext-apps/api/functions/server-helpers.registerAppTool.html)

          *

  References

              *   [RESOURCE_ MIME_ TYPE](https://modelcontextprotocol.github.io/ext-apps/api/modules/server-helpers.html#resource_mime_type)
              *   [RESOURCE_ URI_ META_ KEY](https://modelcontextprotocol.github.io/ext-apps/api/modules/server-helpers.html#resource_uri_meta_key)

      *

  [types](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html)

          *

  Type Aliases

              *   [App Notification](https://modelcontextprotocol.github.io/ext-apps/api/types/types.AppNotification.html)
              *   [App Request](https://modelcontextprotocol.github.io/ext-apps/api/types/types.AppRequest.html)
              *   [App Result](https://modelcontextprotocol.github.io/ext-apps/api/types/types.AppResult.html)

          *

  References

              *   [HOST_ CONTEXT_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#host_context_changed_method)
              *   [INITIALIZE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#initialize_method)
              *   [INITIALIZED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#initialized_method)
              *   [LATEST_ PROTOCOL_ VERSION](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#latest_protocol_version)
              *   [Mcp Ui App Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiappcapabilities)
              *   [Mcp Ui App Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiappcapabilitiesschema)
              *   [Mcp Ui Client Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiclientcapabilities)
              *   [Mcp Ui Display Mode](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuidisplaymode)
              *   [Mcp Ui Display Mode Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuidisplaymodeschema)
              *   [Mcp Ui Host Capabilities](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcapabilities)
              *   [Mcp Ui Host Capabilities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcapabilitiesschema)
              *   [Mcp Ui Host Context](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcontext)
              *   [Mcp Ui Host Context Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcontextchangednotification)
              *   [Mcp Ui Host Context Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcontextchangednotificationschema)
              *   [Mcp Ui Host Context Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcontextschema)
              *   [Mcp Ui Host Css](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcss)
              *   [Mcp Ui Host Css Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihostcssschema)
              *   [Mcp Ui Host Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihoststyles)
              *   [Mcp Ui Host Styles Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuihoststylesschema)
              *   [Mcp Ui Initialized Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializednotification)
              *   [Mcp Ui Initialized Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializednotificationschema)
              *   [Mcp Ui Initialize Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializerequest)
              *   [Mcp Ui Initialize Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializerequestschema)
              *   [Mcp Ui Initialize Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializeresult)
              *   [Mcp Ui Initialize Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiinitializeresultschema)
              *   [Mcp Ui Message Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuimessagerequest)
              *   [Mcp Ui Message Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuimessagerequestschema)
              *   [Mcp Ui Message Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuimessageresult)
              *   [Mcp Ui Message Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuimessageresultschema)
              *   [Mcp Ui Open Link Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiopenlinkrequest)
              *   [Mcp Ui Open Link Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiopenlinkrequestschema)
              *   [Mcp Ui Open Link Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiopenlinkresult)
              *   [Mcp Ui Open Link Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiopenlinkresultschema)
              *   [Mcp Ui Request Display Mode Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuirequestdisplaymoderequest)
              *   [Mcp Ui Request Display Mode Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuirequestdisplaymoderequestschema)
              *   [Mcp Ui Request Display Mode Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuirequestdisplaymoderesult)
              *   [Mcp Ui Request Display Mode Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuirequestdisplaymoderesultschema)
              *   [Mcp Ui Resource Csp](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcecsp)
              *   [Mcp Ui Resource Csp Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcecspschema)
              *   [Mcp Ui Resource Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcemeta)
              *   [Mcp Ui Resource Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcemetaschema)
              *   [Mcp Ui Resource Permissions](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcepermissions)
              *   [Mcp Ui Resource Permissions Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourcepermissionsschema)
              *   [Mcp Ui Resource Teardown Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourceteardownrequest)
              *   [Mcp Ui Resource Teardown Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourceteardownrequestschema)
              *   [Mcp Ui Resource Teardown Result](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourceteardownresult)
              *   [Mcp Ui Resource Teardown Result Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiresourceteardownresultschema)
              *   [Mcp Ui Sandbox Proxy Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisandboxproxyreadynotification)
              *   [Mcp Ui Sandbox Proxy Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisandboxproxyreadynotificationschema)
              *   [Mcp Ui Sandbox Resource Ready Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisandboxresourcereadynotification)
              *   [Mcp Ui Sandbox Resource Ready Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisandboxresourcereadynotificationschema)
              *   [Mcp Ui Size Changed Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisizechangednotification)
              *   [Mcp Ui Size Changed Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisizechangednotificationschema)
              *   [Mcp Ui Styles](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuistyles)
              *   [Mcp Ui Style Variable Key](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuistylevariablekey)
              *   [Mcp Ui Supported Content Block Modalities](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisupportedcontentblockmodalities)
              *   [Mcp Ui Supported Content Block Modalities Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuisupportedcontentblockmodalitiesschema)
              *   [Mcp Ui Theme](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitheme)
              *   [Mcp Ui Theme Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuithemeschema)
              *   [Mcp Ui Tool Cancelled Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolcancellednotification)
              *   [Mcp Ui Tool Cancelled Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolcancellednotificationschema)
              *   [Mcp Ui Tool Input Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolinputnotification)
              *   [Mcp Ui Tool Input Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolinputnotificationschema)
              *   [Mcp Ui Tool Input Partial Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolinputpartialnotification)
              *   [Mcp Ui Tool Input Partial Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolinputpartialnotificationschema)
              *   [Mcp Ui Tool Meta](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolmeta)
              *   [Mcp Ui Tool Meta Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolmetaschema)
              *   [Mcp Ui Tool Result Notification](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolresultnotification)
              *   [Mcp Ui Tool Result Notification Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolresultnotificationschema)
              *   [Mcp Ui Tool Visibility](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolvisibility)
              *   [Mcp Ui Tool Visibility Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuitoolvisibilityschema)
              *   [Mcp Ui Update Model Context Request](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiupdatemodelcontextrequest)
              *   [Mcp Ui Update Model Context Request Schema](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#mcpuiupdatemodelcontextrequestschema)
              *   [MESSAGE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#message_method)
              *   [OPEN_ LINK_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#open_link_method)
              *   [REQUEST_ DISPLAY_ MODE_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#request_display_mode_method)
              *   [RESOURCE_ TEARDOWN_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#resource_teardown_method)
              *   [SANDBOX_ PROXY_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#sandbox_proxy_ready_method)
              *   [SANDBOX_ RESOURCE_ READY_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#sandbox_resource_ready_method)
              *   [SIZE_ CHANGED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#size_changed_method)
              *   [TOOL_ CANCELLED_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#tool_cancelled_method)
              *   [TOOL_ INPUT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#tool_input_method)
              *   [TOOL_ INPUT_ PARTIAL_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#tool_input_partial_method)
              *   [TOOL_ RESULT_ METHOD](https://modelcontextprotocol.github.io/ext-apps/api/modules/types.html#tool_result_method)

Generated using [TypeDoc](https://typedoc.org/) with [typedoc-github-theme](https://github.com/JulianWowra/typedoc-github-theme)
