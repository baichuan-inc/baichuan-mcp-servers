**中文** | [English](./README_EN.md)

# @baichuan-ai/baixiaoying-mcp-server

[![npm version](https://img.shields.io/npm/v/@baichuan-ai/baixiaoying-mcp-server.svg)](https://www.npmjs.com/package/@baichuan-ai/baixiaoying-mcp-server)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/baichuan-inc/baichuan-mcp-servers/blob/main/LICENSE.txt)
[![MCP Apps](https://img.shields.io/badge/MCP-Apps%20Supported-brightgreen.svg)](https://modelcontextprotocol.io/docs/extensions/apps)

百小应医学大模型 MCP Server —— 已支持 **MCP 协议最新 Feature [MCP APPs](https://modelcontextprotocol.io/docs/extensions/apps)**，提供可视化的回答内容，体验完全对标百川官方 APP [百小应](https://ying.ai/?channel=github)。

![Baichuan-M3-Plus](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/src/ui/assets/m3-plus-banner.png)

## 为什么选择百小应 MCP Server？

### 🏆 SOTA 医学大模型

Baichuan-M3-Plus 是百川智能推出的**最低幻觉循证增强医疗大模型**，在权威医学评测中表现卓越：

| 指标                 | 表现                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| **幻觉率**           | 基准测试仅 **2.6%**，大幅领先行业                                       |
| **HealthBench**      | 超越 OpenAI GPT-5.2，达到 SOTA                                          |
| **HealthBench-Hard** | 得分 44.4，超越 GPT-5.2                                                 |
| **SCAN-bench**       | 唯一在 Clinical Inquiry、Laboratory Testing、Diagnosis 三项同时排名第一 |
| **成本**             | 相比上一代模型**降低 70%**                                              |

### 🧬 核心技术优势

- **六源循证系统** - 首创证据锚定技术，回答严谨可追溯，有效抑制幻觉
- **临床问诊思维** - 模型底层具备临床医生的问诊思维与循证思维，支持 SCAN-Driven Clinical-Grade Systematic History Taking
- **高保真临床问诊** - High-Fidelity Clinical Inquiry，将问诊过程重构为临床级别、结构化、可审计的信息生成流水线

### 🧩 MCP APPs 协议

已支持 MCP 最新协议 **MCP APPs**，输出可视化内容，效果与百小应官方 APP 完全对齐：

![百小应可视化回答示例](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/src/ui/assets/baixiaoying-screenshot-1.png)
![百小应引用与证据示例](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/src/ui/assets/baixiaoying-screenshot-2.png)

## 功能特性

- 🖥️ **可视化回答** - 输出可视化内容，效果与百小应官方 APP 对齐
- 🩺 **医学问答对话** - 使用专业医学大模型回答健康相关问题
- 📄 **文档问答** - 上传医学文档进行智能问答
- 📚 **证据引用** - 回答附带专业文献引用
- 🧠 **思考过程** - 展示模型的推理思考步骤
- 🔌 **多协议支持** - 支持 stdio、SSE、Streamable HTTP、Hybrid 四种传输模式
- 🚀 **服务器部署** - 支持独立部署为 HTTP 服务，可供多客户端同时访问

## 📋 应用场景

百小应背后拥有**权威的医疗专业知识库**，涵盖临床指南、药品说明书、医学文献等海量权威数据源，并保持动态更新。无论是日常问诊、临床决策还是医学研究，都能提供最可靠、可信的专业回答。

### 🩺 智能问诊

模拟临床医生的问诊思维，进行系统化的病史采集和症状分析。

```
我最近总是头晕，尤其是早上起床的时候，站起来会眼前发黑，持续大概几秒钟。请帮我分析一下可能的原因？
```

```
孩子 3 岁，昨天开始发烧 38.5°C，伴有流鼻涕和轻微咳嗽，精神状态还可以，需要去医院吗？
```

### 💊 药物分析

深度解析药物成分、作用机制、适应症及不良反应。

```
帮我分析一下阿司匹林和布洛芬的区别，它们的作用机制有什么不同？
```

```
二甲双胍的作用机制是什么？为什么它是 2 型糖尿病的一线用药？
```

### 💉 用药指导

提供专业的用药建议，包括剂量、用法、注意事项及药物相互作用。

```
我正在服用华法林，医生又给我开了阿莫西林，这两种药可以一起吃吗？需要注意什么？
```

```
老年高血压患者长期服用氨氯地平，有哪些需要注意的事项？
```

### 📖 指南查询

快速检索最新临床诊疗指南，获取权威推荐意见。

```
2024 年中国高血压防治指南对于高血压的诊断标准和分级是怎么规定的？
```

```
最新的糖尿病肾病临床诊疗指南中，推荐的一线降糖药物是什么？
```

### 🏥 治疗方案

基于循证医学，提供个性化的治疗方案建议。

```
初诊 2 型糖尿病患者，空腹血糖 9.2mmol/L，糖化血红蛋白 8.1%，BMI 26，无明显并发症，应该如何制定治疗方案？
```

```
社区获得性肺炎的经验性抗菌治疗方案有哪些选择？
```

### 🔬 诊断分析

辅助分析检验检查结果，提供鉴别诊断思路。

```
患者肝功能检查显示 ALT 156 U/L，AST 89 U/L，GGT 正常，请帮我分析可能的原因和需要进一步做的检查。
```

```
甲状腺功能检查 TSH 偏低，FT4 偏高，这提示什么问题？需要做哪些进一步检查？
```

### 📚 医学研究动态

追踪医学领域最新研究进展和突破性成果。

```
GLP-1 受体激动剂在心血管保护方面有哪些最新的研究进展？
```

```
CAR-T 细胞疗法在实体瘤治疗中的最新研究突破有哪些？
```

### ✍️ 医学写作辅助

辅助医学论文写作、病历书写、医学翻译等专业文档工作。

```
帮我写一份急性心肌梗死的入院病历模板，包括主诉、现病史、既往史等要素。
```

```
请帮我将这段临床研究摘要翻译成规范的医学英语。
```

## 🎁 海纳百川计划

![海纳百川计划](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/src/ui/assets/hainabaichuan-plan.png)

百川正式推出「海纳百川」计划，**面向所有为医务工作者提供服务的机构，免费提供循证增强的 M3-Plus API**。

### 参与条件

| 项目         | 说明                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| **适用对象** | 为医务工作者提供服务的机构（医生、药剂师、医技师、护士、健管师、医学生等） |
| **适用场景** | 临床辅助决策、医学教育                                                     |
| **用途限制** | 仅用于真实服务场景，不得用于数据生产                                       |
| **使用要求** | 产品需明确展示 Powered by 百川，不得对模型输出进行影响准确性的修改         |

👉 [立即申请](https://www.baichuan-ai.com/home)

## 支持的模型

| 模型             | 说明                     |
| ---------------- | ------------------------ |
| Baichuan-M3-Plus | 最新医学大模型，推荐使用 |
| Baichuan-M2-Plus | 医学大模型               |

## 学术与资源

- 🏠 **百川官网**：https://www.baichuan-ai.com/home
- 📖 **学术报告**：https://www.baichuan-ai.com/blog/baichuan-M3
- 💻 **M3 Github**：https://github.com/baichuan-inc/Baichuan-M3-235B
- 🤗 **M3 Model**：https://huggingface.co/baichuan-inc/Baichuan-M3-235B
- ⚡ **M3 GPTQ-4bit**：https://huggingface.co/baichuan-inc/Baichuan-M3-235B-GPTQ-INT4

## 快速开始

### 安装

```bash
npm install @baichuan-ai/baixiaoying-mcp-server
```

### 环境变量

| 变量名                   | 必填 | 说明                                                                    |
| ------------------------ | ---- | ----------------------------------------------------------------------- |
| `BAICHUAN_API_KEY`       | 是   | 百川 API Key，从 [百川开放平台](https://platform.baichuan-ai.com/) 获取 |
| `BAICHUAN_TIMEOUT_MS`    | 否   | API 请求超时（毫秒，默认: 120000）                                      |
| `MCP_ALLOWED_ORIGINS`    | 否   | 允许的 Origin 白名单（逗号分隔，仅 HTTP/SSE 模式）                      |
| `MCP_ALLOW_EMPTY_ORIGIN` | 否   | 允许无 Origin 的请求（true/false，默认: true）                          |
| `MCP_SESSION_TTL`        | 否   | Session 过期时间（毫秒，默认: 1800000）                                 |

### 传输协议

百小应 MCP Server 支持三种传输协议，适用于不同场景：

| 模式                | 参数       | 端点                | 适用场景                           |
| ------------------- | ---------- | ------------------- | ---------------------------------- |
| **stdio**           | (默认)     | -                   | Claude Desktop、本地 MCP 客户端    |
| **SSE**             | `--sse`    | `/sse` + `/message` | Cursor、旧版 SSE 客户端            |
| **Streamable HTTP** | `--http`   | `/mcp`              | 新版 MCP 客户端                    |
| **Hybrid**          | `--hybrid` | `/mcp` + `/sse`     | 同时支持多种客户端（推荐服务部署） |

### Claude Desktop 配置（stdio 模式）

在 `claude_desktop_config.json` 中添加：

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

或者使用本地安装：

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

### Cursor 配置（SSE 模式）

1. 启动 SSE 服务器：

```bash
BAICHUAN_API_KEY=your-api-key pnpm start:sse --port 8787
```

2. 在 Cursor 的 `~/.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "baixiaoying": {
      "type": "sse",
      "url": "http://127.0.0.1:8787/sse"
    }
  }
}
```

### 服务器部署（Hybrid 模式）

Hybrid 模式同时支持 Streamable HTTP 和 SSE 协议，推荐用于服务器部署：

```bash
# 启动混合模式服务器
BAICHUAN_API_KEY=your-api-key pnpm start:hybrid --host 0.0.0.0 --port 8787
```

启动后可用的端点：

| 端点       | 协议            | 用途                |
| ---------- | --------------- | ------------------- |
| `/mcp`     | Streamable HTTP | 新版 MCP 客户端     |
| `/sse`     | Legacy SSE      | Cursor 等旧版客户端 |
| `/message` | Legacy SSE POST | SSE 消息发送端点    |

### 命令行参数

```bash
baixiaoying-mcp-server [选项]

选项:
  --sse               启用 SSE 模式（兼容 Cursor）
  --http              启用 Streamable HTTP 模式
  --hybrid            启用混合模式（同时支持 HTTP 和 SSE）
  --host <地址>       监听地址（默认: 127.0.0.1）
  --port <端口>       监听端口（默认: 8787）
  --endpoint <路径>   MCP endpoint 路径（默认: /mcp）
  --help, -h          显示帮助信息
```

## 可用工具

### baixiaoying_chat

使用百小应大模型进行医学问答对话。

**参数：**

| 参数             | 类型     | 必填 | 默认值             | 说明                       |
| ---------------- | -------- | ---- | ------------------ | -------------------------- |
| `message`        | string   | 是   | -                  | 用户输入的问题             |
| `model`          | string   | 否   | "Baichuan-M3-Plus" | 模型选择                   |
| `file_ids`       | string[] | 否   | -                  | 文件 ID 列表，用于文档问答 |
| `temperature`    | number   | 否   | 0.3                | 采样温度 (0-1)             |
| `evidence_scope` | string   | 否   | "grounded"         | 证据范围                   |

**示例：**

```
使用百小应问一下"小儿感冒咳嗽，痰咳不出来怎么办？"
```

### baixiaoying_upload_file

上传医学文档用于后续的文档问答。

**支持的文件格式：** pdf, doc, docx, txt, html, md, csv, png, jpg 等

**参数：**

| 参数        | 类型   | 必填 | 说明         |
| ----------- | ------ | ---- | ------------ |
| `file_path` | string | 是   | 本地文件路径 |
| `file_name` | string | 否   | 自定义文件名 |

### baixiaoying_list_files

获取已上传的文件列表。

### baixiaoying_get_file_status

查询文件的解析状态。

**状态说明：**

- `init` - 待解析
- `parsing` - 解析中
- `online` - 解析成功，可以使用
- `fail` - 解析失败
- `unsafe` - 未通过安全检查

### baixiaoying_delete_file

删除指定的已上传文件。

## 使用示例

### 基础对话

```
问百小应：高血压患者日常需要注意什么？
```

### 文档问答

```
1. 先上传文档
2. 查询文件状态，等待变为 online
3. 使用 baixiaoying_chat 工具，传入 file_ids 参数进行问答
```

## 开发

```bash
# 安装依赖
pnpm install

# Node 版本要求（最低 LTS）
# Node.js >= 18

# 构建
pnpm build

# 开发模式
pnpm dev
```

### 启动脚本

```bash
# stdio 模式（默认）
pnpm start

# SSE 模式（兼容 Cursor）
pnpm start:sse

# Streamable HTTP 模式
pnpm start:http

# Hybrid 模式（推荐服务部署）
pnpm start:hybrid
```

### Docker 部署

```bash
# 构建镜像
docker build -t baixiaoying-mcp-server .

# 运行容器
docker run -d \
  -p 8787:8787 \
  -e BAICHUAN_API_KEY=your-api-key \
  baixiaoying-mcp-server
```

## 许可证

[Apache License 2.0](./LICENSE.txt)
