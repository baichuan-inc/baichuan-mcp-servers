[中文](./README.md) | **English**

# @baichuan-ai/baixiaoying-mcp-server

[![npm version](https://img.shields.io/npm/v/@baichuan-ai/baixiaoying-mcp-server.svg)](https://www.npmjs.com/package/@baichuan-ai/baixiaoying-mcp-server)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/baichuan-inc/baichuan-mcp-servers/blob/main/LICENSE.txt)
[![MCP Apps](https://img.shields.io/badge/MCP-Apps%20Supported-brightgreen.svg)](https://modelcontextprotocol.io/docs/extensions/apps)

BaiXiaoYing Medical LLM MCP Server — Supports the **latest MCP protocol feature [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps)**, providing visual response content that fully matches the official Baichuan APP [BaiXiaoYing](https://ying.ai/).

![Baichuan-M3-Plus](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/assets/m3-plus-banner.png)

## Why Choose BaiXiaoYing MCP Server?

### 🏆 SOTA Medical LLM

Baichuan-M3-Plus is Baichuan AI's **lowest hallucination evidence-enhanced medical large language model**, with excellent performance in authoritative medical evaluations:

| Metric                 | Performance                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Hallucination Rate** | Only **2.6%** in benchmark tests, significantly leading the industry                               |
| **HealthBench**        | Surpasses OpenAI GPT-5.2, achieving SOTA                                                           |
| **HealthBench-Hard**   | Score of 44.4, exceeding GPT-5.2                                                                   |
| **SCAN-bench**         | The only model ranking first in Clinical Inquiry, Laboratory Testing, and Diagnosis simultaneously |
| **Cost**               | **70% reduction** compared to the previous generation model                                        |

### 🧬 Core Technical Advantages

- **Six-Source Evidence System** - Pioneering evidence anchoring technology for rigorous and traceable answers, effectively suppressing hallucinations
- **Clinical Inquiry Mindset** - Model fundamentally possesses clinical physicians' inquiry and evidence-based thinking, supporting SCAN-Driven Clinical-Grade Systematic History Taking
- **High-Fidelity Clinical Inquiry** - Reconstructs the inquiry process into a clinical-grade, structured, and auditable information generation pipeline

### 🧩 MCP Apps Protocol

Supports the latest MCP protocol **MCP Apps**, outputting visual content that is fully aligned with the official BaiXiaoYing APP:

![BaiXiaoYing Visual Response Example](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/assets/baixiaoying-screenshot-1.png)
![BaiXiaoYing Evidence and Citation Example](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/assets/baixiaoying-screenshot-2.png)

## Features

- 🖥️ **Visual Responses** - Output visual content aligned with the official BaiXiaoYing APP
- 🩺 **Medical Q&A Dialogue** - Use professional medical LLM to answer health-related questions
- 📄 **Document Q&A** - Upload medical documents for intelligent Q&A
- 📚 **Evidence Citations** - Answers include professional literature citations
- 🧠 **Thinking Process** - Display the model's reasoning steps
- 🔌 **Multi-Protocol Support** - Supports stdio, SSE, Streamable HTTP, and Hybrid transport modes
- 🚀 **Server Deployment** - Can be deployed as an HTTP service for multi-client access

## 📋 Application Scenarios

BaiXiaoYing is powered by an **authoritative medical knowledge base** that encompasses clinical guidelines, drug information, medical literature, and other comprehensive authoritative data sources, with continuous dynamic updates. Whether for daily consultations, clinical decision-making, or medical research, it provides the most reliable and trustworthy professional answers.

### 🩺 Intelligent Consultation

Simulates clinical physicians' diagnostic thinking for systematic medical history collection and symptom analysis.

```
I've been feeling dizzy lately, especially when I wake up in the morning. When I stand up, my vision goes black for a few seconds. Can you help me analyze the possible causes?
```

```
My 3-year-old child started having a fever of 38.5°C yesterday, with runny nose and slight cough. The child's spirits seem okay. Do we need to go to the hospital?
```

### 💊 Drug Analysis

In-depth analysis of drug components, mechanisms of action, indications, and adverse reactions.

```
Can you explain the difference between aspirin and ibuprofen? How do their mechanisms of action differ?
```

```
What is the mechanism of action of metformin? Why is it considered the first-line medication for type 2 diabetes?
```

### 💉 Medication Guidance

Provides professional medication advice including dosage, administration, precautions, and drug interactions.

```
I'm currently taking warfarin, and my doctor also prescribed amoxicillin. Can I take these two medications together? What should I be aware of?
```

```
What precautions should elderly hypertension patients taking long-term amlodipine be aware of?
```

### 📖 Guideline Queries

Quickly retrieve the latest clinical practice guidelines and authoritative recommendations.

```
What are the diagnostic criteria and classification standards for hypertension according to the 2024 Chinese Hypertension Prevention and Treatment Guidelines?
```

```
What are the recommended first-line hypoglycemic agents in the latest clinical practice guidelines for diabetic nephropathy?
```

### 🏥 Treatment Plans

Provides personalized treatment plan recommendations based on evidence-based medicine.

```
A newly diagnosed type 2 diabetes patient with fasting blood glucose of 9.2mmol/L, HbA1c of 8.1%, BMI of 26, and no obvious complications. How should the treatment plan be formulated?
```

```
What are the options for empirical antimicrobial therapy for community-acquired pneumonia?
```

### 🔬 Diagnostic Analysis

Assists in analyzing laboratory and examination results, providing differential diagnosis approaches.

```
A patient's liver function test shows ALT 156 U/L, AST 89 U/L, with normal GGT. Please help analyze the possible causes and what further tests are needed.
```

```
Thyroid function test shows low TSH and high FT4. What does this indicate? What further examinations are needed?
```

### 📚 Medical Research Updates

Track the latest research progress and breakthrough achievements in the medical field.

```
What are the latest research developments on GLP-1 receptor agonists in cardiovascular protection?
```

```
What are the latest research breakthroughs in CAR-T cell therapy for solid tumor treatment?
```

### ✍️ Medical Writing Assistance

Assists with medical paper writing, medical record documentation, medical translation, and other professional documentation tasks.

```
Help me write a template for an acute myocardial infarction admission medical record, including chief complaint, history of present illness, past medical history, and other elements.
```

```
Please help me translate this clinical research abstract into standard medical English.
```

## 🎁 Hainabaichuan Program

![Hainabaichuan Program](https://raw.githubusercontent.com/baichuan-inc/baichuan-mcp-servers/main/packages/baixiaoying-mcp-server/assets/hainabaichuan-plan.png)

Baichuan has officially launched the "Hainabaichuan" program, **providing free evidence-enhanced M3-Plus API to all institutions serving medical professionals**.

### Eligibility

| Item             | Description                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Target Users** | Institutions serving medical professionals (doctors, pharmacists, technicians, nurses, health managers, medical students, etc.) |
| **Use Cases**    | Clinical decision support, medical education                                                                                    |
| **Restrictions** | For genuine service scenarios only, not for data production                                                                     |
| **Requirements** | Products must clearly display "Powered by Baichuan", no modifications affecting output accuracy                                 |

👉 [Apply Now](https://www.baichuan-ai.com/home)

## Supported Models

| Model            | Description                     |
| ---------------- | ------------------------------- |
| Baichuan-M3-Plus | Latest medical LLM, recommended |
| Baichuan-M2-Plus | Medical LLM                     |

## Academic & Resources

- 🏠 **Baichuan Website**: https://www.baichuan-ai.com/home
- 📖 **Academic Report**: https://www.baichuan-ai.com/blog/baichuan-M3
- 💻 **M3 Github**: https://github.com/baichuan-inc/Baichuan-M3-235B
- 🤗 **M3 Model**: https://huggingface.co/baichuan-inc/Baichuan-M3-235B
- ⚡ **M3 GPTQ-4bit**: https://huggingface.co/baichuan-inc/Baichuan-M3-235B-GPTQ-INT4

## Quick Start

### Installation

```bash
npm install @baichuan-ai/baixiaoying-mcp-server
```

### Environment Variables

| Variable                 | Required | Description                                                                          |
| ------------------------ | -------- | ------------------------------------------------------------------------------------ |
| `BAICHUAN_API_KEY`       | Yes      | Baichuan API Key, obtain from [Baichuan Platform](https://platform.baichuan-ai.com/) |
| `BAICHUAN_TIMEOUT_MS`    | No       | API request timeout (milliseconds, default: 120000)                                  |
| `MCP_ALLOWED_ORIGINS`    | No       | Allowed Origin whitelist (comma-separated, HTTP/SSE modes only)                      |
| `MCP_ALLOW_EMPTY_ORIGIN` | No       | Allow requests without Origin (true/false, default: true)                            |
| `MCP_SESSION_TTL`        | No       | Session expiration (milliseconds, default: 1800000)                                  |

### Transport Protocols

BaiXiaoYing MCP Server supports three transport protocols for different scenarios:

| Mode                | Flag       | Endpoints           | Use Case                                          |
| ------------------- | ---------- | ------------------- | ------------------------------------------------- |
| **stdio**           | (default)  | -                   | Claude Desktop, local MCP clients                 |
| **SSE**             | `--sse`    | `/sse` + `/message` | Cursor, legacy SSE clients                        |
| **Streamable HTTP** | `--http`   | `/mcp`              | Modern MCP clients                                |
| **Hybrid**          | `--hybrid` | `/mcp` + `/sse`     | Multi-client support (recommended for deployment) |

### Claude Desktop Configuration (stdio mode)

Add to `claude_desktop_config.json`:

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

Or use local installation:

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

### Cursor Configuration (SSE mode)

1. Start the SSE server:

```bash
BAICHUAN_API_KEY=your-api-key pnpm start:sse --port 8787
```

2. Configure in Cursor's `~/.cursor/mcp.json`:

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

### Server Deployment (Hybrid mode)

Hybrid mode supports both Streamable HTTP and SSE protocols, recommended for server deployment:

```bash
# Start hybrid mode server
BAICHUAN_API_KEY=your-api-key pnpm start:hybrid --host 0.0.0.0 --port 8787
```

Available endpoints after startup:

| Endpoint   | Protocol        | Purpose                   |
| ---------- | --------------- | ------------------------- |
| `/mcp`     | Streamable HTTP | Modern MCP clients        |
| `/sse`     | Legacy SSE      | Cursor and legacy clients |
| `/message` | Legacy SSE POST | SSE message endpoint      |

### Command Line Options

```bash
baixiaoying-mcp-server [options]

Options:
  --sse               Enable SSE mode (compatible with Cursor)
  --http              Enable Streamable HTTP mode
  --hybrid            Enable Hybrid mode (supports both HTTP and SSE)
  --host <address>    Listen address (default: 127.0.0.1)
  --port <port>       Listen port (default: 8787)
  --endpoint <path>   MCP endpoint path (default: /mcp)
  --help, -h          Show help information
```

## Available Tools

### baixiaoying_chat

Use BaiXiaoYing LLM for medical Q&A dialogue.

**Parameters:**

| Parameter        | Type     | Required | Default            | Description                   |
| ---------------- | -------- | -------- | ------------------ | ----------------------------- |
| `message`        | string   | Yes      | -                  | User's question               |
| `model`          | string   | No       | "Baichuan-M3-Plus" | Model selection               |
| `file_ids`       | string[] | No       | -                  | File ID list for document Q&A |
| `temperature`    | number   | No       | 0.3                | Sampling temperature (0-1)    |
| `evidence_scope` | string   | No       | "grounded"         | Evidence scope                |

**Example:**

```
Ask BaiXiaoYing: "What should I do if my child has a cold and cough and can't cough up phlegm?"
```

### baixiaoying_upload_file

Upload medical documents for subsequent document Q&A.

**Supported file formats:** pdf, doc, docx, txt, html, md, csv, png, jpg, etc.

**Parameters:**

| Parameter   | Type   | Required | Description      |
| ----------- | ------ | -------- | ---------------- |
| `file_path` | string | Yes      | Local file path  |
| `file_name` | string | No       | Custom file name |

### baixiaoying_list_files

Get the list of uploaded files.

### baixiaoying_get_file_status

Query the parsing status of a file.

**Status descriptions:**

- `init` - Pending parsing
- `parsing` - Parsing in progress
- `online` - Successfully parsed, ready to use
- `fail` - Parsing failed
- `unsafe` - Did not pass security check

### baixiaoying_delete_file

Delete a specified uploaded file.

## Usage Examples

### Basic Dialogue

```
Ask BaiXiaoYing: What should hypertension patients pay attention to in daily life?
```

### Document Q&A

```
1. First upload the document
2. Query file status, wait until it becomes online
3. Use baixiaoying_chat tool with file_ids parameter for Q&A
```

## Development

```bash
# Install dependencies
pnpm install

# Node version requirement (minimum LTS)
# Node.js >= 18

# Build
pnpm build

# Development mode
pnpm dev
```

### Startup Scripts

```bash
# stdio mode (default)
pnpm start

# SSE mode (compatible with Cursor)
pnpm start:sse

# Streamable HTTP mode
pnpm start:http

# Hybrid mode (recommended for server deployment)
pnpm start:hybrid
```

### Docker Deployment

```bash
# Build image
docker build -t baixiaoying-mcp-server .

# Run container
docker run -d \
  -p 8787:8787 \
  -e BAICHUAN_API_KEY=your-api-key \
  baixiaoying-mcp-server
```

## License

[Apache License 2.0](./LICENSE.txt)
