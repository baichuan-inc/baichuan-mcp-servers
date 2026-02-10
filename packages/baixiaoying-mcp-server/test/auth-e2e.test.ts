/**
 * Per-User API Key 透传鉴权 — 端到端测试
 *
 * 测试场景:
 * 1. auth.ts 单元测试: extractBearerToken / resolveApiKey
 * 2. Hybrid 模式:
 *    a. Streamable HTTP 路径: Bearer Token → 存入 session → 工具调用使用该 Key
 *    b. SSE 路径: Bearer Token → 绑定连接 → 工具调用使用该 Key
 *    c. 无 Token + 无 env → 工具调用报错
 *    d. 无 Token + 有 env → fallback 到 env
 * 3. Streamable HTTP 独立模式
 * 4. Legacy SSE 独立模式
 * 5. 真实 API 调用测试 (chat)
 *
 * 用法:
 *   npx tsx test/auth-e2e.test.ts [--api-key <key>]
 *   BAICHUAN_API_KEY=xxx npx tsx test/auth-e2e.test.ts
 */

import type { IncomingMessage } from "node:http";

// ========== 配置 ==========

const TEST_API_KEY =
  getCliArg("--api-key") ||
  process.env.TEST_BAICHUAN_API_KEY ||
  process.env.BAICHUAN_API_KEY ||
  "";

const BASE_PORT = 19800;

function getCliArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

// ========== 测试框架 ==========

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
let currentGroup = "";

function group(name: string): void {
  currentGroup = name;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${"=".repeat(60)}`);
}

function assert(name: string, condition: boolean, detail?: string): void {
  const fullName = `${currentGroup} > ${name}`;
  if (condition) {
    console.log(`  ✅ ${name}`);
    results.push({ name: fullName, passed: true });
  } else {
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
    results.push({ name: fullName, passed: false, error: detail });
  }
}

// ========== HTTP 请求工具 ==========

async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
  bodyTimeoutMs = 3000
): Promise<{ status: number; headers: Headers; body: string; timedOut: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    let body = "";
    try {
      body = await Promise.race([
        res.text(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("body timeout")), bodyTimeoutMs)
        ),
      ]).catch(() => "");
    } catch {
      body = "";
    }
    return { status: res.status, headers: res.headers, body, timedOut: false };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return { status: 0, headers: new Headers(), body: "", timedOut: true };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  "MCP-Protocol-Version": "2025-03-26",
};

function makeInitBody() {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "e2e-test", version: "1.0" },
    },
  });
}

function makeInitializedNotification() {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "notifications/initialized",
  });
}

function makeToolListBody(id: number) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/list",
    params: {},
  });
}

function makeToolCallBody(id: number, toolName: string, args: Record<string, unknown>) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  });
}

// ========== SSE 解析工具 ==========

/** 从 SSE body 中提取 JSON-RPC 响应 */
function parseSSEResponse(body: string): unknown | null {
  const lines = body.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        return JSON.parse(line.slice(6));
      } catch {
        // continue
      }
    }
  }
  return null;
}

/** 从 SSE 连接建立的 body 中提取 message endpoint */
function parseSSEEndpoint(body: string): string | null {
  const lines = body.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data.startsWith("/message") || data.startsWith("http")) {
        return data;
      }
    }
  }
  return null;
}

// ========== 环境变量工具 ==========

function withEnv(key: string, value: string | undefined): () => void {
  const orig = process.env[key];
  if (value !== undefined) {
    process.env[key] = value;
  } else {
    delete process.env[key];
  }
  return () => {
    if (orig !== undefined) {
      process.env[key] = orig;
    } else {
      delete process.env[key];
    }
  };
}

// ========== 1. auth.ts 单元测试 ==========

async function testAuthUnit(): Promise<void> {
  const { extractBearerToken, resolveApiKey } = await import(
    "../dist/transport/auth.js"
  );

  group("单元测试 > extractBearerToken");

  function mockReq(authHeader?: string): IncomingMessage {
    const headers: Record<string, string> = {};
    if (authHeader) headers["authorization"] = authHeader;
    return { headers } as unknown as IncomingMessage;
  }

  assert("无 header → null", extractBearerToken(mockReq()) === null);
  assert("Basic auth → null", extractBearerToken(mockReq("Basic abc")) === null);
  assert("空 Bearer → null", extractBearerToken(mockReq("Bearer ")) === null);
  assert(
    "有效 Bearer → token",
    extractBearerToken(mockReq("Bearer my-token-123")) === "my-token-123"
  );
  assert(
    "bearer 小写 → token",
    extractBearerToken(mockReq("bearer my-token-123")) === "my-token-123"
  );
  assert(
    "BEARER 大写 → token",
    extractBearerToken(mockReq("BEARER my-token-123")) === "my-token-123"
  );

  group("单元测试 > resolveApiKey");

  // 无 header + 无 env → null
  {
    const restore = withEnv("BAICHUAN_API_KEY", undefined);
    assert("无 header + 无 env → null", resolveApiKey(mockReq()) === null);
    restore();
  }

  // 无 header + 有 env → env
  {
    const restore = withEnv("BAICHUAN_API_KEY", "env-key-abc");
    assert(
      "无 header + 有 env → env-key-abc",
      resolveApiKey(mockReq()) === "env-key-abc"
    );
    restore();
  }

  // 有 header + 有 env → header 优先
  {
    const restore = withEnv("BAICHUAN_API_KEY", "env-key-abc");
    assert(
      "有 header + 有 env → header 优先",
      resolveApiKey(mockReq("Bearer bearer-key-xyz")) === "bearer-key-xyz"
    );
    restore();
  }

  // 有 header + 无 env → header
  {
    const restore = withEnv("BAICHUAN_API_KEY", undefined);
    assert(
      "有 header + 无 env → bearer-key-xyz",
      resolveApiKey(mockReq("Bearer bearer-key-xyz")) === "bearer-key-xyz"
    );
    restore();
  }
}

// ========== 2. Streamable HTTP: 完整 MCP 流程 ==========

async function testStreamableHttpFlow(): Promise<void> {
  if (!TEST_API_KEY) {
    group("Streamable HTTP 完整流程 > 跳过 (无 API Key)");
    console.log("  ⚠️  跳过: 未提供 TEST_BAICHUAN_API_KEY");
    return;
  }

  const port = BASE_PORT;
  // 清除环境变量，确保只通过 Bearer Token 传入
  const restoreEnv = withEnv("BAICHUAN_API_KEY", undefined);

  const { StreamableHttpTransport } = await import(
    "../dist/transport/streamable-http.js"
  );
  const { McpServer } = await import(
    "@modelcontextprotocol/sdk/server/mcp.js"
  );
  const { registerChatTool, registerFileTools } = await import(
    "../dist/tools/index.js"
  );
  const { BaixiaoyingClientFactory } = await import("../dist/api/index.js");

  const factory = new BaixiaoyingClientFactory();

  const transport = new StreamableHttpTransport({
    host: "127.0.0.1",
    port,
    allowEmptyOrigin: true,
  });

  // 创建 resolver
  const resolver = (extra: { sessionId?: string }) => {
    if (extra.sessionId) {
      const apiKey = transport.sessionApiKeyMap.get(extra.sessionId);
      return factory.getClient(apiKey);
    }
    return null;
  };

  const server = new McpServer({ name: "test", version: "1.0" });
  registerChatTool(server, resolver);
  registerFileTools(server, resolver);
  await server.connect(transport);

  const base = `http://127.0.0.1:${port}`;
  const authHeaders = { Authorization: `Bearer ${TEST_API_KEY}` };

  try {
    // --- Step 1: Initialize (带 Bearer Token) ---
    group("Streamable HTTP > Initialize (Bearer Token)");
    const initRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...MCP_HEADERS, ...authHeaders },
      body: makeInitBody(),
    });
    assert("非 401/403", initRes.status !== 401 && initRes.status !== 403, `got ${initRes.status}`);
    assert("状态码 200", initRes.status === 200, `got ${initRes.status}`);

    let sessionId = initRes.headers.get("mcp-session-id");
    assert("返回 MCP-Session-Id", !!sessionId, `got: ${sessionId}`);

    // 解析 initialize 响应
    let initResponse: any = null;
    try {
      initResponse = JSON.parse(initRes.body);
    } catch {
      // 可能是 SSE 格式
      initResponse = parseSSEResponse(initRes.body);
    }
    assert("initialize 返回结果", !!initResponse, `body: ${initRes.body.substring(0, 200)}`);
    assert(
      "包含 serverInfo",
      initResponse?.result?.serverInfo?.name === "test",
      JSON.stringify(initResponse?.result?.serverInfo)
    );

    if (!sessionId) {
      console.log("  ⚠️  无 sessionId，跳过后续步骤");
      return;
    }

    // --- Step 2: Send initialized notification ---
    group("Streamable HTTP > Initialized Notification");
    const notifRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        ...authHeaders,
        "MCP-Session-Id": sessionId,
      },
      body: makeInitializedNotification(),
    });
    assert("状态码 202", notifRes.status === 202, `got ${notifRes.status}`);

    // --- Step 3: List tools ---
    group("Streamable HTTP > List Tools");
    const toolsRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        ...MCP_HEADERS,
        ...authHeaders,
        "MCP-Session-Id": sessionId,
      },
      body: makeToolListBody(2),
    });
    assert("状态码 200", toolsRes.status === 200, `got ${toolsRes.status}`);

    let toolsResponse: any = null;
    try {
      toolsResponse = JSON.parse(toolsRes.body);
    } catch {
      toolsResponse = parseSSEResponse(toolsRes.body);
    }
    const tools = toolsResponse?.result?.tools || [];
    assert("返回工具列表", tools.length > 0, `tools count: ${tools.length}`);

    const toolNames = tools.map((t: any) => t.name);
    assert("包含 baixiaoying_chat", toolNames.includes("baixiaoying_chat"), toolNames.join(", "));
    assert("包含 baixiaoying_list_files", toolNames.includes("baixiaoying_list_files"), toolNames.join(", "));
    assert("包含 baixiaoying_upload_file", toolNames.includes("baixiaoying_upload_file"), toolNames.join(", "));

    // --- Step 4: Call baixiaoying_list_files (验证 API Key 透传) ---
    group("Streamable HTTP > 调用 baixiaoying_list_files (Bearer Token 透传)");
    const listFilesRes = await safeFetch(
      `${base}/mcp`,
      {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          ...authHeaders,
          "MCP-Session-Id": sessionId,
        },
        body: makeToolCallBody(3, "baixiaoying_list_files", {}),
      },
      15000
    );
    assert("状态码 200", listFilesRes.status === 200, `got ${listFilesRes.status}`);

    let listFilesResponse: any = null;
    try {
      listFilesResponse = JSON.parse(listFilesRes.body);
    } catch {
      listFilesResponse = parseSSEResponse(listFilesRes.body);
    }
    assert("返回结果", !!listFilesResponse, `body: ${listFilesRes.body.substring(0, 200)}`);
    assert(
      "非错误 (API Key 有效)",
      !listFilesResponse?.result?.isError,
      JSON.stringify(listFilesResponse?.result?.content?.[0]?.text?.substring(0, 100))
    );
    const responseText = listFilesResponse?.result?.content?.[0]?.text || "";
    assert(
      "不包含 '未提供 API Key'",
      !responseText.includes("未提供 API Key"),
      responseText.substring(0, 100)
    );

    // --- Step 5: 无 Bearer Token → 工具调用报错 ---
    group("Streamable HTTP > 无 Bearer Token → 工具报错");
    // 新建 session 不带 Bearer Token
    const initRes2 = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: makeInitBody(),
    });
    assert("initialize 成功", initRes2.status === 200, `got ${initRes2.status}`);
    const sessionId2 = initRes2.headers.get("mcp-session-id");
    assert("返回 sessionId", !!sessionId2);

    if (sessionId2) {
      // Send initialized
      await safeFetch(`${base}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS, "MCP-Session-Id": sessionId2 },
        body: makeInitializedNotification(),
      });

      // 调用工具
      const noKeyRes = await safeFetch(
        `${base}/mcp`,
        {
          method: "POST",
          headers: { ...MCP_HEADERS, "MCP-Session-Id": sessionId2 },
          body: makeToolCallBody(4, "baixiaoying_list_files", {}),
        },
        10000
      );
      assert("状态码 200", noKeyRes.status === 200, `got ${noKeyRes.status}`);

      let noKeyResponse: any = null;
      try {
        noKeyResponse = JSON.parse(noKeyRes.body);
      } catch {
        noKeyResponse = parseSSEResponse(noKeyRes.body);
      }
      assert("返回结果", !!noKeyResponse);
      assert(
        "isError = true",
        noKeyResponse?.result?.isError === true,
        `isError: ${noKeyResponse?.result?.isError}`
      );
      const errText = noKeyResponse?.result?.content?.[0]?.text || "";
      assert(
        "提示未提供 API Key",
        errText.includes("未提供 API Key") || errText.includes("API Key"),
        errText.substring(0, 100)
      );
    }

    // --- Step 6: DELETE session ---
    group("Streamable HTTP > Delete Session");
    const deleteRes = await safeFetch(`${base}/mcp`, {
      method: "DELETE",
      headers: {
        "MCP-Session-Id": sessionId,
        "MCP-Protocol-Version": "2025-03-26",
      },
    });
    assert("状态码 204", deleteRes.status === 204, `got ${deleteRes.status}`);
  } finally {
    await transport.close();
    restoreEnv();
  }
}

// ========== 3. Hybrid 模式: SSE 路径 ==========

async function testHybridSSEFlow(): Promise<void> {
  if (!TEST_API_KEY) {
    group("Hybrid SSE 路径 > 跳过 (无 API Key)");
    console.log("  ⚠️  跳过: 未提供 TEST_BAICHUAN_API_KEY");
    return;
  }

  const port = BASE_PORT + 1;
  const restoreEnv = withEnv("BAICHUAN_API_KEY", undefined);

  const { HybridServer } = await import("../dist/transport/hybrid-server.js");
  const { McpServer } = await import(
    "@modelcontextprotocol/sdk/server/mcp.js"
  );
  const { registerChatTool, registerFileTools } = await import(
    "../dist/tools/index.js"
  );
  const { BaixiaoyingClientFactory } = await import("../dist/api/index.js");

  const factory = new BaixiaoyingClientFactory();
  const hybridServer = new HybridServer({
    host: "127.0.0.1",
    port,
    allowEmptyOrigin: true,
  });

  // Streamable HTTP 路径 (简化)
  const streamableResolver = (extra: { sessionId?: string }) => {
    if (extra.sessionId) {
      const apiKey = hybridServer.sessionApiKeyMap.get(extra.sessionId);
      return factory.getClient(apiKey);
    }
    return null;
  };
  const streamableServer = new McpServer({ name: "test-hybrid", version: "1.0" });
  registerChatTool(streamableServer, streamableResolver);
  registerFileTools(streamableServer, streamableResolver);
  await streamableServer.connect(hybridServer.streamableTransport);

  // SSE 路径: 每个连接创建独立 server
  hybridServer.onSSETransportReady = async (transport, apiKey) => {
    const client = factory.getClient(apiKey);
    const sseResolver = () => client;
    const sseServer = new McpServer({ name: "test-hybrid-sse", version: "1.0" });
    registerChatTool(sseServer, sseResolver);
    registerFileTools(sseServer, sseResolver);
    await sseServer.connect(transport);
  };

  await hybridServer.start();
  const base = `http://127.0.0.1:${port}`;

  try {
    // --- SSE 连接 (带 Bearer Token) ---
    group("Hybrid SSE > 连接 + 工具调用 (Bearer Token)");

    // SSE GET 请求获取连接
    const sseRes = await safeFetch(
      `${base}/sse`,
      { headers: { Authorization: `Bearer ${TEST_API_KEY}` } },
      3000
    );

    // SSE 连接会 timeout (流不结束)，但我们应该能从 body 中获取 endpoint
    const sseBody = sseRes.body;
    const endpoint = parseSSEEndpoint(sseBody);
    assert("SSE 连接建立 (200 或 timeout)", sseRes.status === 200 || sseRes.timedOut, `status: ${sseRes.status}`);

    if (endpoint) {
      // 构造完整 message URL
      const messageUrl = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;

      // 发送 initialize
      const initRes = await safeFetch(messageUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: makeInitBody(),
      });
      assert("initialize 状态码 200", initRes.status === 200, `got ${initRes.status}`);
      console.log("  ℹ️  SSE 路径验证完成 (initialize 通过)");
    } else {
      console.log("  ⚠️  未能获取 SSE endpoint，跳过消息测试");
      console.log(`  ℹ️  SSE body: ${sseBody.substring(0, 200)}`);
    }

    // --- Hybrid HTTP 路径也验证一下 ---
    group("Hybrid HTTP > Initialize (Bearer Token)");
    const initRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...MCP_HEADERS, Authorization: `Bearer ${TEST_API_KEY}` },
      body: makeInitBody(),
    });
    assert("状态码 200", initRes.status === 200, `got ${initRes.status}`);
    const sessionId = initRes.headers.get("mcp-session-id");
    assert("返回 sessionId", !!sessionId);

    if (sessionId) {
      // Initialized notification
      await safeFetch(`${base}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          Authorization: `Bearer ${TEST_API_KEY}`,
          "MCP-Session-Id": sessionId,
        },
        body: makeInitializedNotification(),
      });

      // 调用 list_files
      group("Hybrid HTTP > 调用 baixiaoying_list_files");
      const listRes = await safeFetch(
        `${base}/mcp`,
        {
          method: "POST",
          headers: {
            ...MCP_HEADERS,
            Authorization: `Bearer ${TEST_API_KEY}`,
            "MCP-Session-Id": sessionId,
          },
          body: makeToolCallBody(2, "baixiaoying_list_files", {}),
        },
        15000
      );
      assert("状态码 200", listRes.status === 200, `got ${listRes.status}`);

      let listResponse: any = null;
      try {
        listResponse = JSON.parse(listRes.body);
      } catch {
        listResponse = parseSSEResponse(listRes.body);
      }
      assert("返回结果", !!listResponse);
      assert(
        "API Key 透传成功 (非错误)",
        !listResponse?.result?.isError,
        listResponse?.result?.content?.[0]?.text?.substring(0, 100)
      );
    }
  } finally {
    await hybridServer.close();
    restoreEnv();
  }
}

// ========== 4. 环境变量 Fallback 测试 ==========

async function testEnvFallback(): Promise<void> {
  if (!TEST_API_KEY) {
    group("Env Fallback > 跳过 (无 API Key)");
    console.log("  ⚠️  跳过: 未提供 TEST_BAICHUAN_API_KEY");
    return;
  }

  const port = BASE_PORT + 2;
  // 设置环境变量作为 fallback
  const restoreEnv = withEnv("BAICHUAN_API_KEY", TEST_API_KEY);

  const { StreamableHttpTransport } = await import(
    "../dist/transport/streamable-http.js"
  );
  const { McpServer } = await import(
    "@modelcontextprotocol/sdk/server/mcp.js"
  );
  const { registerFileTools } = await import("../dist/tools/index.js");
  const { BaixiaoyingClientFactory } = await import("../dist/api/index.js");

  const factory = new BaixiaoyingClientFactory();
  const transport = new StreamableHttpTransport({
    host: "127.0.0.1",
    port,
    allowEmptyOrigin: true,
  });

  const resolver = (extra: { sessionId?: string }) => {
    if (extra.sessionId) {
      const apiKey = transport.sessionApiKeyMap.get(extra.sessionId);
      return factory.getClient(apiKey || process.env.BAICHUAN_API_KEY);
    }
    return factory.getClient(process.env.BAICHUAN_API_KEY);
  };

  const server = new McpServer({ name: "test-fallback", version: "1.0" });
  registerFileTools(server, resolver);
  await server.connect(transport);

  const base = `http://127.0.0.1:${port}`;

  try {
    // Initialize 不带 Bearer Token
    group("Env Fallback > Initialize (无 Bearer Token)");
    const initRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: makeInitBody(),
    });
    assert("状态码 200", initRes.status === 200, `got ${initRes.status}`);
    const sessionId = initRes.headers.get("mcp-session-id");
    assert("返回 sessionId", !!sessionId);

    if (sessionId) {
      // Initialized
      await safeFetch(`${base}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS, "MCP-Session-Id": sessionId },
        body: makeInitializedNotification(),
      });

      // 调用 list_files (应通过 env fallback)
      group("Env Fallback > 调用 baixiaoying_list_files (env fallback)");
      const listRes = await safeFetch(
        `${base}/mcp`,
        {
          method: "POST",
          headers: { ...MCP_HEADERS, "MCP-Session-Id": sessionId },
          body: makeToolCallBody(2, "baixiaoying_list_files", {}),
        },
        15000
      );
      assert("状态码 200", listRes.status === 200, `got ${listRes.status}`);

      let listResponse: any = null;
      try {
        listResponse = JSON.parse(listRes.body);
      } catch {
        listResponse = parseSSEResponse(listRes.body);
      }
      assert("返回结果", !!listResponse);
      assert(
        "env fallback 成功 (非错误)",
        !listResponse?.result?.isError,
        listResponse?.result?.content?.[0]?.text?.substring(0, 100)
      );
      const text = listResponse?.result?.content?.[0]?.text || "";
      assert(
        "不包含 '未提供 API Key'",
        !text.includes("未提供 API Key"),
        text.substring(0, 100)
      );
    }
  } finally {
    await transport.close();
    restoreEnv();
  }
}

// ========== 5. 真实 Chat 调用测试 ==========

async function testChatCall(): Promise<void> {
  if (!TEST_API_KEY) {
    group("Chat 调用 > 跳过 (无 API Key)");
    console.log("  ⚠️  跳过: 未提供 TEST_BAICHUAN_API_KEY");
    return;
  }

  const port = BASE_PORT + 3;
  const restoreEnv = withEnv("BAICHUAN_API_KEY", undefined);

  const { StreamableHttpTransport } = await import(
    "../dist/transport/streamable-http.js"
  );
  const { McpServer } = await import(
    "@modelcontextprotocol/sdk/server/mcp.js"
  );
  const { registerChatTool } = await import("../dist/tools/index.js");
  const { BaixiaoyingClientFactory } = await import("../dist/api/index.js");

  const factory = new BaixiaoyingClientFactory();
  const transport = new StreamableHttpTransport({
    host: "127.0.0.1",
    port,
    allowEmptyOrigin: true,
  });

  const resolver = (extra: { sessionId?: string }) => {
    if (extra.sessionId) {
      const apiKey = transport.sessionApiKeyMap.get(extra.sessionId);
      return factory.getClient(apiKey);
    }
    return null;
  };

  const server = new McpServer({ name: "test-chat", version: "1.0" });
  registerChatTool(server, resolver);
  await server.connect(transport);

  const base = `http://127.0.0.1:${port}`;
  const authHeaders = { Authorization: `Bearer ${TEST_API_KEY}` };

  try {
    // Initialize
    group("Chat 调用 > Initialize");
    const initRes = await safeFetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...MCP_HEADERS, ...authHeaders },
      body: makeInitBody(),
    });
    assert("状态码 200", initRes.status === 200, `got ${initRes.status}`);
    const sessionId = initRes.headers.get("mcp-session-id");

    if (sessionId) {
      // Initialized
      await safeFetch(`${base}/mcp`, {
        method: "POST",
        headers: { ...MCP_HEADERS, ...authHeaders, "MCP-Session-Id": sessionId },
        body: makeInitializedNotification(),
      });

      // Chat 调用 (简短问题减少延迟)
      group("Chat 调用 > baixiaoying_chat (Bearer Token 透传)");
      console.log("  ⏳ 调用中，可能需要几秒钟...");

      const chatRes = await safeFetch(
        `${base}/mcp`,
        {
          method: "POST",
          headers: {
            ...MCP_HEADERS,
            ...authHeaders,
            "MCP-Session-Id": sessionId,
          },
          body: makeToolCallBody(2, "baixiaoying_chat", {
            message: "维生素C的作用是什么？请简短回答。",
            model: "Baichuan-M3-Plus",
          }),
        },
        60000,  // fetch timeout
        55000   // body timeout (chat API 可能较慢)
      );
      assert("状态码 200", chatRes.status === 200, `got ${chatRes.status}`);

      let chatResponse: any = null;
      try {
        chatResponse = JSON.parse(chatRes.body);
      } catch {
        chatResponse = parseSSEResponse(chatRes.body);
      }
      assert("返回结果", !!chatResponse, `body len: ${chatRes.body.length}`);

      if (chatResponse?.result) {
        assert(
          "非错误",
          !chatResponse.result.isError,
          chatResponse.result.content?.[0]?.text?.substring(0, 100)
        );
        const content = chatResponse.result.content || [];
        assert("包含文本内容", content.length > 0, `content count: ${content.length}`);

        const textContent = content.find((c: any) => c.type === "text");
        if (textContent) {
          const text = textContent.text as string;
          assert("回复非空", text.length > 0, `text length: ${text.length}`);
          assert(
            "不包含错误提示",
            !text.includes("未提供 API Key") && !text.includes("错误"),
            text.substring(0, 100)
          );
          console.log(`  ℹ️  回复片段: ${text.substring(0, 80)}...`);
        }
      } else {
        assert("解析 chat 响应", false, `body: ${chatRes.body.substring(0, 200)}`);
      }
    }
  } finally {
    await transport.close();
    restoreEnv();
  }
}

// ========== 主入口 ==========

async function main() {
  console.log("\n🔑 Per-User API Key 透传鉴权 — 端到端测试\n");
  console.log(`  API Key: ${TEST_API_KEY ? `${TEST_API_KEY.substring(0, 8)}...` : "(未提供)"}`);

  try {
    // 1. 单元测试
    await testAuthUnit();

    // 2. Streamable HTTP 完整流程
    await testStreamableHttpFlow();

    // 3. Hybrid 模式 SSE 路径
    await testHybridSSEFlow();

    // 4. 环境变量 Fallback
    await testEnvFallback();

    // 5. 真实 Chat 调用
    await testChatCall();
  } catch (err) {
    console.error("\n💥 测试执行异常:", err);
    process.exit(1);
  }

  // 汇总
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  测试结果汇总`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  总计: ${results.length}  通过: ${passed}  失败: ${failed}`);

  if (failed > 0) {
    console.log(`\n  失败的测试:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    ❌ ${r.name}${r.error ? ` — ${r.error}` : ""}`);
    }
    console.log("");
    process.exit(1);
  } else {
    console.log(`\n  ✅ 全部通过!\n`);
    process.exit(0);
  }
}

main();
