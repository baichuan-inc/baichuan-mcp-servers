# Iframe src 协议与静态资源加载
_Exported on 2026/2/2 at GMT+8 11:38:44 from Cursor (2.4.22)_

---

**User**

@workspace/mcp-app/ 有个问题，mcp-apps中，mcp-server要提供ui资源和界面，这个界面在host加载的时候iframe的src指向的是什么协议？https？还是file，还是其它什么协议？html和页面所属的静态资源，又是如何在页面中加载的？

---

**Cursor**

让我先查看 `workspace/mcp-app/` 目录下的研究资料，看看是否有关于这个问题的信息。

让我读取相关的研究资料，寻找关于 iframe 协议和静态资源加载的信息。

让我进一步查看实现代码，特别是 app-bridge 的实现，来了解 iframe 具体是如何加载 HTML 的。

让我读取关键的实现文件来了解具体的加载机制。

让我再查看规范中关于资源加载的详细说明。

根据我对 `workspace/mcp-app/` 研究资料的分析，现在可以详细回答你的问题。

## MCP Apps 中 iframe 加载机制

### 1. iframe 的协议问题

MCP Apps 使用**双层 iframe 架构**进行安全隔离：

```
Host (port 8080)
  └── 外层 iframe (port 8081) - Sandbox Proxy [使用 http/https 协议]
        └── 内层 iframe - 实际的 MCP App UI [使用 srcdoc 或 document.write]
```

**关键点：**
- **外层 iframe** 的 `src` 指向一个 **http/https URL**，例如 `http://localhost:8081/sandbox.html`
- **内层 iframe** 不使用传统的 `src` 属性，而是通过 **`srcdoc` 属性**或 **`document.write()`** 直接注入 HTML 内容

从 `sandbox.ts` 的实现可以看到：

```97:108:workspace/mcp-app/github_repo/ext-apps/examples/basic-host/src/sandbox.ts
      if (typeof html === "string") {
        // Use document.write instead of srcdoc (which the CesiumJS Map won't work with)
        const doc = inner.contentDocument || inner.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        } else {
          // Fallback to srcdoc if document is not accessible
          console.warn("[Sandbox] document.write not available, falling back to srcdoc");
          inner.srcdoc = html;
        }
      }
```

### 2. HTML 和静态资源的加载流程

整个流程是这样的：

**Step 1: Host 通过 MCP 协议获取 UI 资源**
```typescript
// Host 调用 resources/read 读取 ui:// 资源
const resource = await serverInfo.client.readResource({ uri: "ui://get-time/mcp-app.html" });
const html = "blob" in content ? atob(content.blob) : content.text;
```

**Step 2: Server 返回打包好的 HTML**
- MIME type 必须是 `text/html;profile=mcp-app`
- 内容通过 `text` (字符串) 或 `blob` (base64) 返回
- **推荐做法**：使用 Vite + `vite-plugin-singlefile` 将所有资源打包成单个 HTML 文件

**Step 3: Host 将 HTML 注入 iframe**
- 通过 `postMessage` 将 HTML 发送到 Sandbox Proxy
- Sandbox Proxy 使用 `document.write()` 或 `srcdoc` 注入到内层 iframe

### 3. 外部资源加载的限制和解决方案

**核心问题**：在 `srcdoc` iframe 中，**外部 `<script src="">` 标签不能直接工作**！

这是 map-server 代码中的注释说明：

```21:23:workspace/mcp-app/github_repo/ext-apps/examples/map-server/src/mcp-app.ts
/**
 * Dynamically load CesiumJS from CDN
 * This is necessary because external <script src=""> tags don't work in srcdoc iframes
 */
```

**解决方案**：通过 JavaScript **动态加载**外部资源：

```typescript
async function loadCesium(): Promise<void> {
  // 动态创建 CSS link
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = `${CESIUM_BASE_URL}/Widgets/widgets.css`;
  document.head.appendChild(cssLink);

  // 动态创建 script
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${CESIUM_BASE_URL}/Cesium.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load"));
    document.head.appendChild(script);
  });
}
```

**同时需要配置 CSP** 允许外部资源域名：

```typescript
_meta: {
  ui: {
    csp: {
      resourceDomains: ["https://cesium.com", "https://cdn.jsdelivr.net"],
      connectDomains: ["https://api.example.com"],
    }
  }
}
```

### 4. 总结

| 层级 | 协议/方式 | 说明 |
|-----|---------|------|
| 外层 iframe | `http://` 或 `https://` | Sandbox Proxy，提供安全隔离 |
| 内层 iframe | `srcdoc` 或 `document.write()` | 直接注入 HTML 字符串，非 URL |
| 静态资源 | 动态 JS 加载 + CSP 白名单 | 打包内联或运行时动态加载 |

**最佳实践**：
1. 使用 `vite-plugin-singlefile` 将所有资源打包成单个 HTML
2. 如需外部资源（如 CDN 库），使用 `document.createElement()` 动态加载
3. 在 `_meta.ui.csp` 中声明所需的外部域名

---

**User**

为什么一定要双层IFrame机制来实现？技术考量是什么

---

**Cursor**

这是一个很好的问题。让我从规范文档中找到关于双层 iframe 安全架构的详细解释。

现在让我基于规范和实现代码，详细解释双层 iframe 架构的技术考量。

## 为什么需要双层 iframe 架构？

### 核心安全威胁模型

规范中明确列出了需要防范的攻击场景：

```
- Malicious server delivers harmful HTML content
- Compromised View attempts to escape sandbox
- View attempts unauthorized tool execution
- View exfiltrates sensitive host data
- View performs phishing or social engineering
```

### 技术考量 1：同源策略隔离

**规范强制要求**：
> "The Host and the Sandbox MUST have different origins."

**为什么？** 如果只用单层 iframe：

```
Host (claude.ai)
  └── iframe with srcdoc [问题：与 Host 同源！]
```

**单层 iframe 的致命问题**：
- `srcdoc` iframe 会继承父页面的 origin
- 恶意代码可能通过某些浏览器漏洞访问父页面
- 即使有 `sandbox` 属性，同源仍是风险

**双层解决方案**：

```
Host (claude.ai, port 8080)
  └── 外层 iframe (sandbox.cloudflare.com, port 8081) ← 不同 origin!
        └── 内层 iframe (srcdoc) ← 与外层同源，但与 Host 隔离
```

### 技术考量 2：安全自测验证

从 `sandbox.ts` 的代码可以看到关键的安全验证：

```26:38:workspace/mcp-app/github_repo/ext-apps/examples/basic-host/src/sandbox.ts
// Security self-test: verify iframe isolation is working correctly.
// This MUST throw a SecurityError -- if `window.top` is accessible, the sandbox
// configuration is dangerously broken and untrusted content could escape.
try {
  window.top!.alert("If you see this, the sandbox is not setup securely.");
  throw "FAIL";
} catch (e) {
  if (e === "FAIL") {
    throw new Error("The sandbox is not setup securely.");
  }
  // Expected: SecurityError confirms proper sandboxing.
}
```

如果能访问 `window.top`，说明隔离失败，整个安全模型崩溃。

### 技术考量 3：CSP 只能通过 HTTP Header 强制执行

**问题**：HTML `<meta>` 标签设置的 CSP 可以被恶意脚本绕过（在 meta 标签解析前执行）。

**解决方案**：外层 iframe 通过 HTTP 请求加载 `sandbox.html`，服务器返回 CSP Header：

```typescript
// serve.ts - 通过 HTTP Header 设置 CSP，无法被客户端篡改
const cspHeader = [
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ${resourceDomains}`,
  `style-src 'self' 'unsafe-inline' blob: data: ${resourceDomains}`,
  `img-src 'self' data: blob: ${resourceDomains}`,
  // ...
].join("; ");
res.setHeader("Content-Security-Policy", cspHeader);
```

### 技术考量 4：消息审计与过滤

双层架构让所有通信都经过中间层：

```
Host ↔ Sandbox Proxy ↔ View (内层 iframe)
     postMessage      postMessage
```

**优势**：
- **审计**：可以记录所有 RPC 调用
- **过滤**：可以拦截和阻止危险操作
- **权限控制**：Host 可以决定是否批准某些请求

```40:68:workspace/mcp-app/github_repo/ext-apps/examples/basic-host/src/sandbox.ts
// Double-iframe sandbox architecture: THIS file is the outer sandbox proxy
// iframe on a separate origin. It creates an inner iframe for untrusted HTML
// content. Per the specification, the Host and the Sandbox MUST have different
// origins.

// ...

// Message relay: This Sandbox (outer iframe) acts as a bidirectional bridge,
// forwarding messages between:
//
//   Host (parent window) ↔ Sandbox (outer frame) ↔ View (inner iframe)
//
// Reason: the parent window and inner iframe have different origins and can't
// communicate directly, so the outer iframe forwards messages in both
// directions to connect them.
```

### 技术考量 5：Origin 验证防止消息欺骗

```72:84:workspace/mcp-app/github_repo/ext-apps/examples/basic-host/src/sandbox.ts
window.addEventListener("message", async (event) => {
  if (event.source === window.parent) {
    // Validate that messages from parent come from the expected host origin.
    // This prevents malicious pages from sending messages to this sandbox.
    if (event.origin !== EXPECTED_HOST_ORIGIN) {
      console.error(
        "[Sandbox] Rejecting message from unexpected origin:",
        event.origin,
        "expected:",
        EXPECTED_HOST_ORIGIN
      );
      return;
    }
```

### 总结：为什么不能用单层 iframe？

| 安全问题 | 单层 iframe | 双层 iframe |
|---------|------------|-------------|
| Origin 隔离 | ❌ srcdoc 继承父 origin | ✅ 外层 iframe 独立 origin |
| CSP 强制执行 | ❌ meta 标签可被绕过 | ✅ HTTP Header 不可篡改 |
| window.top 访问 | ⚠️ 可能被利用 | ✅ 跨 origin 时抛 SecurityError |
| 消息审计 | ❌ 直接通信 | ✅ 中间层可审计过滤 |
| Cookie/Storage 隔离 | ❌ 可能共享 | ✅ 不同 origin 完全隔离 |

**核心原则**：浏览器的同源策略是最强的安全边界。双层 iframe 通过引入不同的 origin，将不可信的 MCP App UI 完全隔离在安全边界之外。

---

**User**

对于mcp server构建方来说，这个机制对于提供的ui资源协议的限制有哪些？
未来host的话语权和限制空间又有哪些？mcp -server 开发者新增的话语权和可操作空间又有哪些？

---

**Cursor**

这是一个很好的架构权力分配问题。让我从规范中整理出各方的限制和权力。

这是一个关于 MCP Apps 架构中**权力分配**的好问题。让我从三个角度详细分析：

---

## 一、MCP Server 开发者面临的限制

### 1. UI 资源协议限制

| 限制项 | 具体说明 |
|-------|---------|
| **MIME 类型** | 当前只支持 `text/html;profile=mcp-app`，不支持外部 URL 嵌入 |
| **URI 协议** | 必须使用 `ui://` scheme |
| **资源交付方式** | 必须通过 MCP `resources/read` 返回 HTML 字符串，不能直接返回 URL |
| **外部资源** | 需要显式声明 CSP 白名单，Host 可以拒绝 |
| **脚本加载** | `srcdoc` iframe 中 `<script src="">` 不工作，需要动态加载 |

### 2. 通信和权限限制

```typescript
// Server 必须声明所有需要的外部域名
_meta: {
  ui: {
    csp: {
      connectDomains: ["https://api.example.com"],  // 网络请求
      resourceDomains: ["https://cdn.example.com"], // 静态资源
      frameDomains: ["https://youtube.com"],        // 嵌套 iframe
    },
    permissions: {
      camera: {},       // 需要 Host 批准
      microphone: {},   // 需要 Host 批准
      geolocation: {},  // 需要 Host 批准
      clipboardWrite: {}, // 需要 Host 批准
    }
  }
}
```

**关键限制**：
- **Host 可以进一步限制但不能放宽** - "Host MAY further restrict but MUST NOT allow undeclared domains"
- **权限只是请求** - Host 有最终决定权

### 3. 功能限制

- **无法访问 Host 页面** - iframe sandbox 完全隔离
- **无法直接访问用户数据** - cookies、localStorage 都是隔离的
- **无法自动执行 Tool** - 需要通过 `app.callServerTool()` 请求，Host 可能要求用户确认
- **无法控制显示模式** - 只能请求，Host 决定是否批准

---

## 二、Host 的话语权和控制空间

Host 在这个架构中拥有**绝对的控制权**：

### 1. 安全控制权

| 控制项 | Host 权力 |
|-------|----------|
| **CSP 执行** | 可以进一步限制，可以实现全局黑白名单 |
| **权限审批** | 可以拒绝任何 permissions 请求 |
| **资源审查** | 可以在渲染前检查 HTML 内容 |
| **消息审计** | 可以记录、拦截、阻止任何 RPC 调用 |
| **Tool 调用审批** | 可以要求用户确认每次 Tool 调用 |

### 2. 展示控制权

```typescript
// Host 决定 View 的展示环境
hostContext: {
  theme: "dark",                    // 主题由 Host 决定
  displayMode: "inline",            // 显示模式由 Host 决定
  availableDisplayModes: ["inline"], // Host 可以不支持全屏
  containerDimensions: { 
    width: 400,      // 固定宽度
    maxHeight: 600   // 限制高度
  },
  // ... 样式变量也由 Host 提供
}
```

### 3. 能力协商权

```typescript
// Host 在 initialize 时声明支持什么
hostCapabilities: {
  openLinks: {},           // 可以不支持打开链接
  serverTools: { ... },    // 可以限制 Tool 访问
  serverResources: { ... }, // 可以限制 Resource 访问
  logging: {},             // 可以不支持日志
  updateModelContext: { text: {}, image: {} }, // 可以限制 context 更新
}
```

### 4. 未来扩展空间

规范中预留的 Host 控制点：
- `sandboxPolicies`: 支持的 sandbox 配置
- `features`: 特定功能支持（streaming、persistence 等）
- 全局域名黑白名单
- 资源哈希签名验证

---

## 三、MCP Server 开发者的新话语权

虽然限制很多，但开发者也获得了重要的能力：

### 1. 交互控制权

```typescript
// App 可以主动调用 Server Tool
const result = await app.callServerTool({
  name: "fetch_details",
  arguments: { id: "123" }
});

// App 可以更新模型上下文
await app.updateModelContext({
  content: [{ type: "text", text: "用户选择了选项 B" }]
});

// App 可以发送消息推动对话
await app.sendMessage({
  content: [{ type: "text", text: "请帮我分析这个结果" }]
});
```

### 2. Tool 可见性控制

```typescript
// Server 可以控制 Tool 对谁可见
_meta: {
  ui: {
    visibility: ["app"]     // 只对 App 可见，Model 看不到
    // visibility: ["model"] // 只对 Model 可见，App 调不了
    // visibility: ["model", "app"] // 默认：都可见
  }
}
```

这让 Server 可以设计**仅供 UI 使用的内部 API**。

### 3. 显示模式协商

```typescript
// App 声明支持的显示模式
appCapabilities: {
  availableDisplayModes: ["inline", "fullscreen", "pip"]
}

// App 可以请求切换模式
await app.requestDisplayMode({ mode: "fullscreen" });
```

### 4. 尺寸控制（有限度）

```typescript
// App 可以告知 Host 期望的尺寸
app.sendSizeChanged({ width: 800, height: 600 });
```

但 Host 有 `containerDimensions` 限制，可能会覆盖 App 的请求。

### 5. 持久化和状态管理

- 可以使用 `localStorage`（在 sandbox origin 内）
- 可以通过 `viewUUID` 实现跨会话状态恢复
- 规范预留了 State persistence and restoration 的扩展点

---

## 四、权力博弈总结

```
                    ┌─────────────────────────────┐
                    │         Host (Claude)        │
                    │  • 安全边界的最终裁判者        │
                    │  • CSP、权限、审计的控制者     │
                    │  • 显示和交互的决定者          │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │   Model (LLM)    │  │   MCP Server    │  │    User (人)     │
    │ • 调用 Tool      │  │ • 提供 Tool/UI   │  │ • 最终决策权     │
    │ • 看到 context   │  │ • 声明 CSP 需求  │  │ • 审批敏感操作   │
    │ • visibility控制 │  │ • Tool可见性控制 │  │                 │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 设计哲学

1. **Host 拥有绝对安全控制权** - 因为 Host 要对用户负责
2. **Server 拥有功能定义权** - 可以决定提供什么 Tool 和 UI
3. **App 拥有交互控制权** - 可以主动触发操作，但需要 Host 批准
4. **User 拥有最终审批权** - 敏感操作需要人类确认

这是一个**安全优先**的架构，Server 开发者需要在这个框架内设计应用，而不是期望获得更多底层控制权。

