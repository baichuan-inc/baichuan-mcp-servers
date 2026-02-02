# Baichuan MCP Servers

百川 MCP Servers 集合 - 基于 Model Context Protocol 的服务器合集。

## 项目结构

```
baichuan-mcp-servers/
├── packages/
│   └── baixiaoying-mcp-server/     # 百小应 MCP Server
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
pnpm build
```

### 开发模式

```bash
# 启动所有包的开发模式
pnpm dev

# 单独开发某个包
pnpm --filter @baichuan/baixiaoying-mcp-server dev
```

### 运行 MCP Server

```bash
# 直接运行
pnpm --filter @baichuan/baixiaoying-mcp-server start

# 或者构建后运行
node packages/baixiaoying-mcp-server/dist/index.js
```

## 包列表

| 包名 | 描述 | 版本 |
|------|------|------|
| @baichuan/baixiaoying-mcp-server | 百小应 MCP Server | 0.0.1 |

## 开发指南

### 创建新的 MCP Server

1. 在 `packages/` 目录下创建新目录
2. 复制 `baixiaoying-mcp-server` 的结构作为模板
3. 修改 `package.json` 中的包名和描述
4. 实现你的 MCP Server 逻辑

### 发布

使用 changesets 管理版本和发布：

```bash
# 创建变更集
pnpm changeset

# 更新版本
pnpm version-packages

# 发布到 npm
pnpm release
```

## 在 Claude Desktop 中使用

在 `claude_desktop_config.json` 中添加配置：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "command": "node",
      "args": ["/path/to/baichuan-mcp-servers/packages/baixiaoying-mcp-server/dist/index.js"]
    }
  }
}
```

## License

MIT
