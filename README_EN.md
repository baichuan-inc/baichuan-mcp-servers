[中文](./README.md) | **English**

# Baichuan MCP Servers

<p align="center">
  <strong>Baichuan MCP Servers Collection</strong> — Among the first medical AI server collections to implement the MCP Apps protocol
</p>

<p align="center">
  <a href="./LICENSE.txt"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://modelcontextprotocol.io/docs/extensions/apps"><img src="https://img.shields.io/badge/MCP-Apps%20Supported-brightgreen.svg" alt="MCP Apps"></a>
</p>

<p align="center">
  <a href="https://www.baichuan-ai.com/home">Website</a> •
  <a href="https://ying.ai/">BaiXiaoYing</a> •
  <a href="https://www.baichuan-ai.com/blog/baichuan-M3">Academic Report</a> •
  <a href="https://github.com/baichuan-inc/Baichuan-M3-235B">M3 Github</a>
</p>

---

## ✨ Highlights

### 🏆 SOTA Medical LLM

Based on Baichuan AI's **Baichuan-M3-Plus** — the lowest hallucination evidence-enhanced medical large language model:

| Metric                 | Performance                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Hallucination Rate** | Only **2.6%** in benchmark tests, significantly leading the industry                               |
| **HealthBench**        | Surpasses OpenAI GPT-5.2, achieving SOTA                                                           |
| **SCAN-bench**         | The only model ranking first in Clinical Inquiry, Laboratory Testing, and Diagnosis simultaneously |
| **Cost**               | **70% reduction** compared to the previous generation model                                        |

### 🧬 Core Technical Advantages

- **Six-Source Evidence System** - Pioneering evidence anchoring technology for rigorous and traceable answers
- **Clinical Inquiry Mindset** - Model fundamentally possesses clinical physicians' inquiry and evidence-based thinking
- **High-Fidelity Clinical Inquiry** - Reconstructs the inquiry process into a clinical-grade, structured, and auditable information generation pipeline

### 🧩 MCP Apps Protocol

Supports the latest MCP protocol **MCP Apps**, outputting visual content that is fully aligned with the official [BaiXiaoYing](https://ying.ai/) APP.

### 🎁 Hainabaichuan Program

Baichuan has launched the "Hainabaichuan" program, **providing free evidence-enhanced M3-Plus API to all institutions serving medical professionals**.

👉 [Apply Now](https://www.baichuan-ai.com/home)

---

## 📦 MCP Servers

| Package                                                                  | Description                                                                                 | Status      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------- |
| [@baichuan-ai/baixiaoying-mcp-server](./packages/baixiaoying-mcp-server) | BaiXiaoYing Medical LLM MCP Server, supports medical Q&A, document Q&A, six-source evidence | ✅ Released |

### @baichuan-ai/baixiaoying-mcp-server

BaiXiaoYing Medical LLM MCP Server, providing conversational capabilities of Baichuan-M3-Plus and Baichuan-M2-Plus models.

**Core Features:**

- 🖥️ MCP Apps visual responses
- 🩺 Professional medical Q&A dialogue
- 📄 Medical document intelligent Q&A
- 📚 Six-source evidence with citations
- 🧠 Display model reasoning process

**Quick Start:**

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

👉 [View Full Documentation](./packages/baixiaoying-mcp-server/README_EN.md)

---

## 🔗 Resources

| Resource            | Link                                                           |
| ------------------- | -------------------------------------------------------------- |
| 🏠 Baichuan Website | https://www.baichuan-ai.com/home                               |
| 📱 BaiXiaoYing APP  | https://ying.ai/                                               |
| 📖 Academic Report  | https://www.baichuan-ai.com/blog/baichuan-M3                   |
| 💻 M3 Github        | https://github.com/baichuan-inc/Baichuan-M3-235B               |
| 🤗 M3 Model         | https://huggingface.co/baichuan-inc/Baichuan-M3-235B           |
| ⚡ M3 GPTQ-4bit     | https://huggingface.co/baichuan-inc/Baichuan-M3-235B-GPTQ-INT4 |
| 🔑 API Key          | https://platform.baichuan-ai.com/                              |

---

## 📄 License

[Apache-2.0](./LICENSE.txt)
