# MCP Apps 实现经验总结

> 本文档记录了在实现 baixiaoying-mcp-server 的 MCP Apps 功能时踩过的坑和总结的最佳实践。

## 1. `_meta.ui.resourceUri` 放置位置错误

### 错误做法

```typescript
// ❌ 错误：把 _meta.ui.resourceUri 放在工具返回结果中
server.tool("baixiaoying_chat", "...", schema, async (args) => {
  const response = await client.chat(...);
  return {
    content: [{ type: "text", text: JSON.stringify(response) }],
    _meta: {
      ui: { resourceUri: "ui://baixiaoying/chat-result" }  // ❌ 放这里无效！
    },
  };
});
```

### 正确做法

```typescript
// ✅ 正确：把 _meta.ui.resourceUri 放在工具定义的配置中
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";

registerAppTool(server, "baixiaoying_chat", {
  title: "百小应医学问答",
  description: "...",
  inputSchema: chatInputSchema,
  _meta: {
    ui: { resourceUri: "ui://baixiaoying/chat-result" }  // ✅ 放在工具配置中
  },
}, async (args) => {
  const response = await client.chat(...);
  return {
    content: [{ type: "text", text: JSON.stringify(response) }],
    // 返回结果中不需要 _meta
  };
});
```

### 原因

Host 在**工具定义阶段**（`tools/list`）就需要知道该工具是否有关联的 UI 资源。当 Host 调用工具时，它会：

1. 检查工具定义中的 `_meta.ui.resourceUri`
2. 如果存在，立即加载对应的 UI 资源
3. 工具执行完成后，通过 `ontoolresult` 将结果发送给已加载的 UI

如果 `_meta` 放在返回结果中，Host 在工具定义时看不到它，就不会加载 UI。

---

## 2. 使用错误的注册 API

### 错误做法

```typescript
// ❌ 错误：使用普通的 server.tool() 和 server.registerResource()
server.tool("baixiaoying_chat", "...", schema, handler);
server.registerResource(
  "chat-result-ui",
  "ui://...",
  { mimeType: "..." },
  callback,
);
```

### 正确做法

```typescript
// ✅ 正确：使用 @modelcontextprotocol/ext-apps/server 提供的专用 API
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

registerAppTool(
  server,
  "baixiaoying_chat",
  {
    // ... _meta.ui.resourceUri 会被正确处理
  },
  handler,
);

registerAppResource(
  server,
  "chat-result-ui",
  "ui://...",
  {
    mimeType: RESOURCE_MIME_TYPE, // 自动使用正确的 MIME 类型
  },
  callback,
);
```

### 原因

`registerAppTool` 和 `registerAppResource` 是 MCP Apps 扩展提供的封装函数，它们会：

1. 自动处理 `_meta.ui.resourceUri` 的新旧格式兼容
2. 自动设置正确的 MIME 类型 `text/html;profile=mcp-app`
3. 提供更好的类型支持

---

## 3. UI 没有调用 `app.connect()`

### 错误做法

```typescript
// ❌ 错误：只创建 App 实例，没有调用 connect()
const app = new App({ name: "百小应对话结果", version: "1.0.0" });

app.ontoolresult = (result) => {
  // 这个回调永远不会被触发！
  renderResponse(result);
};
// 缺少 app.connect()
```

### 正确做法

```typescript
// ✅ 正确：创建实例 → 设置 handlers → 调用 connect()
const app = new App({ name: "百小应对话结果", version: "1.0.0" });

// 1. 先设置所有 handlers（在 connect 之前，避免错过通知）
app.ontoolinput = (params) => {
  console.log("工具开始执行，显示 loading");
};

app.ontoolresult = (result) => {
  console.log("工具执行完成，渲染结果");
  renderResponse(result);
};

app.ontoolcancelled = (params) => {
  console.log("工具被取消");
};

// 2. 最后调用 connect()
app.connect().then(() => {
  console.log("已连接到 Host");
});
```

### 原因

`app.connect()` 是建立 UI 与 Host 之间 PostMessage 通信的关键步骤：

1. 调用 `connect()` 后，App 会向 Host 发送 `ui/initialize` 请求
2. Host 返回其能力和上下文信息
3. 建立双向通信通道，之后才能收到 `ontoolinput`、`ontoolresult` 等通知

**如果不调用 `connect()`，UI 就是一个孤立的页面，无法与 Host 通信。**

---

## 4. 外链处理方式错误

### 错误做法

```html
<!-- ❌ 错误：直接使用 <a href> 跳转 -->
<a href="https://ying.baichuan-ai.com/chat" target="_blank"> 体验完整功能 </a>
```

### 正确做法

```html
<!-- ✅ 正确：使用 button，通过 app.openLink() 请求 Host 打开 -->
<button id="brand-banner">体验完整功能</button>
```

```typescript
brandBannerEl.addEventListener("click", () => {
  app.openLink({ url: "https://ying.baichuan-ai.com/chat" });
});
```

### 原因

MCP Apps UI 运行在 Host 的沙箱 iframe 中：

1. 直接使用 `<a href>` 可能被 iframe sandbox 策略阻止
2. 使用 `app.openLink()` 让 Host 决定如何处理外链（可能需要用户确认）
3. Host 可以实施安全策略，防止恶意链接

---

## 5. MCP Apps 生命周期理解

### 完整流程

```
┌─────────────────────────────────────────────────────────────────┐
│                          Host (Claude/Cursor)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. 用户发起对话，模型决定调用工具                                  │
│     ↓                                                            │
│  2. Host 检查工具定义中的 _meta.ui.resourceUri                     │
│     ↓                                                            │
│  3. Host 通过 resources/read 获取 UI HTML                         │
│     ↓                                                            │
│  4. Host 在沙箱 iframe 中加载 UI                                   │
│     ↓                                                            │
│  5. UI 执行 app.connect() → 与 Host 建立连接                       │
│     ↓                                                            │
│  6. Host 发送 ontoolinput（工具参数）→ UI 可显示 loading           │
│     ↓                                                            │
│  7. MCP Server 执行工具...                                        │
│     ↓                                                            │
│  8. Host 发送 ontoolresult（工具结果）→ UI 渲染结果                │
└─────────────────────────────────────────────────────────────────┘
```

### 关键时序

| 事件                   | 触发时机         | UI 应该做什么     |
| ---------------------- | ---------------- | ----------------- |
| `ontoolinput`          | 工具开始执行     | 显示 loading 状态 |
| `ontoolinputpartial`   | 流式参数（可选） | 实时预览参数      |
| `ontoolresult`         | 工具执行完成     | 渲染最终结果      |
| `ontoolcancelled`      | 用户取消/出错    | 显示取消提示      |
| `onhostcontextchanged` | Host 上下文变化  | 适配主题/样式     |

---

## 6. 常见调试技巧

### 添加日志

```typescript
app.ontoolinput = (params) => {
  console.info("[百小应] 收到工具输入:", params);
};

app.ontoolresult = (result) => {
  console.info("[百小应] 收到工具结果:", result);
};

app.onerror = (error) => {
  console.error("[百小应] App 错误:", error);
};
```

### 检查 Host 能力

```typescript
app.connect().then(() => {
  const capabilities = app.getHostCapabilities();
  console.log("Host 能力:", capabilities);

  const context = app.getHostContext();
  console.log("Host 上下文:", context);
});
```

### 使用 MCP Inspector

```bash
BAICHUAN_API_KEY=your-key pnpm exec mcp-inspector -- node dist/index.js
```

---

## 7. 检查清单

在实现 MCP Apps 功能时，确保：

- [ ] 使用 `registerAppTool()` 注册工具
- [ ] 使用 `registerAppResource()` 注册 UI 资源
- [ ] `_meta.ui.resourceUri` 放在**工具配置**中，而非返回结果中
- [ ] UI 资源 URI 使用 `ui://` 协议
- [ ] UI 的 MIME 类型是 `text/html;profile=mcp-app`
- [ ] UI 代码中调用了 `app.connect()`
- [ ] handlers 在 `connect()` 之前设置
- [ ] 外链使用 `app.openLink()` 而非直接 `<a href>`
- [ ] 处理了 `ontoolresult`、`ontoolcancelled` 等关键回调

---

## 参考资料

- [MCP Apps 官方文档](https://modelcontextprotocol.io/docs/extensions/apps)
- [ext-apps GitHub 仓库](https://github.com/modelcontextprotocol/ext-apps)
- [ext-apps/examples](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples)
- [cursor_iframe_src.md](./cursor_iframe_src.md) - iframe 加载机制详解
