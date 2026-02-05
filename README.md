# Baichuan MCP Servers

<p align="center">
  <strong>百川 MCP Servers 集合</strong> —— 基于 Model Context Protocol 的医疗 AI 服务器合集
</p>

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://modelcontextprotocol.io/docs/extensions/apps"><img src="https://img.shields.io/badge/MCP-Apps%20Supported-brightgreen.svg" alt="MCP Apps"></a>
</p>

<p align="center">
  <a href="https://www.baichuan-ai.com/home">官网</a> •
  <a href="https://ying.ai/">百小应</a> •
  <a href="https://www.baichuan-ai.com/blog/baichuan-M3">学术报告</a> •
  <a href="https://github.com/baichuan-inc/Baichuan-M3-235B">M3 Github</a>
</p>

---

## ✨ 亮点

### 🏆 SOTA 医学大模型

基于百川智能 **Baichuan-M3-Plus** —— 最低幻觉循证增强医疗大模型：

| 指标            | 表现                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| **幻觉率**      | 基准测试仅 **2.6%**，大幅领先行业                                       |
| **HealthBench** | 超越 OpenAI GPT-5.2，达到 SOTA                                          |
| **SCAN-bench**  | 唯一在 Clinical Inquiry、Laboratory Testing、Diagnosis 三项同时排名第一 |
| **成本**        | 相比上一代模型**降低 70%**                                              |

### 🧬 核心技术优势

- **六源循证系统** - 首创证据锚定技术，回答严谨可追溯
- **临床问诊思维** - 模型底层具备临床医生的问诊思维与循证思维
- **高保真临床问诊** - 将问诊过程重构为临床级别、结构化、可审计的信息生成流水线

### 🧩 MCP APPs 协议

已支持 MCP 最新协议 **MCP APPs**，输出可视化内容，效果与 [百小应](https://ying.ai/) 官方 APP 完全对齐。

### 🎁 海纳百川计划

百川推出「海纳百川」计划，**面向所有为医务工作者提供服务的机构，免费提供循证增强的 M3-Plus API**。

👉 [立即申请](https://www.baichuan-ai.com/home)

---

## 📦 MCP Servers

| 包名                                                                     | 描述                                                          | 状态      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- | --------- |
| [@baichuan-ai/baixiaoying-mcp-server](./packages/baixiaoying-mcp-server) | 百小应医学大模型 MCP Server，支持医学问答、文档问答、六源循证 | ✅ 已发布 |

### @baichuan-ai/baixiaoying-mcp-server

百小应医学大模型 MCP Server，提供 Baichuan-M3-Plus 和 Baichuan-M2-Plus 模型的对话能力。

**核心功能：**

- 🖥️ MCP APPs 可视化回答
- 🩺 专业医学问答对话
- 📄 医学文档智能问答
- 📚 六源循证与证据引用
- 🧠 展示模型推理思考过程

**快速使用：**

```bash
npm install @baichuan-ai/baixiaoying-mcp-server
```

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

👉 [查看完整文档](./packages/baixiaoying-mcp-server/README.md)

---

## 🔗 资源链接

| 资源            | 链接                                                           |
| --------------- | -------------------------------------------------------------- |
| 🏠 百川官网     | https://www.baichuan-ai.com/home                               |
| 📱 百小应 APP   | https://ying.ai/                                               |
| 📖 学术报告     | https://www.baichuan-ai.com/blog/baichuan-M3                   |
| 💻 M3 Github    | https://github.com/baichuan-inc/Baichuan-M3-235B               |
| 🤗 M3 Model     | https://huggingface.co/baichuan-inc/Baichuan-M3-235B           |
| ⚡ M3 GPTQ-4bit | https://huggingface.co/baichuan-inc/Baichuan-M3-235B-GPTQ-INT4 |
| 🔑 API Key 申请 | https://platform.baichuan-ai.com/                              |

---

## 📄 License

Apache-2.0
