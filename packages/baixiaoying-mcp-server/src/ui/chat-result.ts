/**
 * 百小应对话结果 UI
 * MCP Apps UI 实现，用于展示对话结果、思考过程、证据引用等
 *
 * 特性：
 * - Markdown 渲染
 * - 角标重排序（按引用在正文中出现的顺序）
 * - 可折叠的思考过程
 * - 引用列表展示
 */

import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import { marked, type Tokens } from "marked";
import QRCode from "qrcode";

// ========== 常量配置 ==========
const WEBSITE_URL = "https://ying.ai/?channel=mcp";
const DOWNLOAD_URL =
  "https://xiaoying.baichuan-ai.com/r/2pOaNfyLlsKvBFQgmdoRu2";

// Logo Icon SVG
const LOGO_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36" fill="none"><g clip-path="url(#a)"><rect width="36" height="36" fill="#FF7918" rx="8.471"/><path fill="#FF7918" d="M0 0h36v36H0z"/><g filter="url(#b)"><path fill="#fff" d="M18 4.5C9.575 4.5 4.5 9.575 4.5 18c0 3.85 1.06 7 3.016 9.287.273.318.418.725.418 1.144v2.118a.95.95 0 0 0 .95.951H18c8.425 0 13.5-5.075 13.5-13.5 0-8.424-5.075-13.5-13.5-13.5"/></g><g clip-path="url(#c)"><path fill="#FF7918" d="M18.894 11.475c.838 0 1.517-.676 1.517-1.51 0-.833-.68-1.51-1.517-1.51s-1.516.677-1.516 1.51c0 .834.679 1.51 1.516 1.51"/><path fill="#161616" d="M24.763 11.4H20.96a.37.37 0 0 0-.279.126 2.38 2.38 0 0 1-1.787.806 2.38 2.38 0 0 1-1.786-.806.37.37 0 0 0-.279-.125h-2.71c-.445 0-.696.002-.78.002-.11 0-.22.018-.326.039a2.29 2.29 0 0 0-1.864 2.351 47.1 47.1 0 0 1-1.003 12.117 1.01 1.01 0 0 0 1.98.41 49.3 49.3 0 0 0 1.048-12.497v-.025c0-.212.173-.385.386-.385h11.222c.552 0 1-.44 1.01-.986.011-.547-.463-1.026-1.03-1.026Z"/><path fill="#161616" d="M24.864 24.746H14.409c-.558 0-1.01.45-1.01 1.006 0 .555.452 1.006 1.01 1.006h10.457c.558 0 1.01-.45 1.01-1.006s-.453-1.006-1.01-1.006Zm-1.801-1.481 1.611-6.202a1.01 1.01 0 0 0-1.957-.504l-1.61 6.203a1.01 1.01 0 0 0 1.957.504Zm-5.746-1.459-.926-4.696a.956.956 0 0 0-1.877.367l.926 4.695a.956.956 0 0 0 1.877-.366m2.915-1.116-.926-4.695a.956.956 0 0 0-1.877.366l.926 4.696a.956.956 0 0 0 1.877-.366Z"/></g></g><defs><clipPath id="a"><rect width="36" height="36" fill="#fff" rx="8.471"/></clipPath><clipPath id="c"><path fill="#fff" d="M10.125 8.456h15.75v18.667h-15.75z"/></clipPath><filter id="b" width="29.253" height="29.253" x="3.486" y="3.937" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dx=".113" dy=".563"/><feGaussianBlur stdDeviation=".563"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix values="0 0 0 0 0.717647 0 0 0 0 0.345098 0 0 0 0 0 0 0 0 0.6 0"/><feBlend in2="BackgroundImageFix" mode="multiply" result="effect1_dropShadow_583_4"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_583_4" result="shape"/></filter></defs></svg>`;

// Logo Text SVG (百小应)
const LOGO_TEXT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="24" fill="none"><path fill="#262626" d="M2.273 9.247q0-.88.43-1.33.45-.451 1.352-.451h12.368q.88 0 1.33.45.451.43.451 1.331v10.157q0 .88-.45 1.33-.43.451-1.331.451H4.055q-.88 0-1.332-.45-.45-.43-.45-1.331zm13.433.635H4.771v8.887h10.935zm.307 3.01q.942 0 .942.942v.533q0 .94-.942.941H4.464q-.942 0-.942-.941v-.533q0-.942.942-.942h11.55Zm-5.508-8.785q.962 0 .962.963v2.64q0 .963-.962.963h-.533q-.962 0-.962-.963V5.07q0-.963.962-.963zm8.007-1.167q.941 0 .941.942v.532q0 .942-.941.942H1.966q-.942 0-.942-.942v-.532q0-.942.942-.942zm13.801-.389q.963 0 .963.962v15.911q0 1.782-1.782 1.782h-2.19q-.964 0-.963-.962v-.533q0-.962.962-.962h1.474V3.513q0-.962.963-.962zM26.15 6.216q.962.103.84 1.086-.738 5.16-1.905 9.01-.267.921-1.188.614l-.532-.164q-.901-.306-.594-1.228a53 53 0 0 0 1.044-4.28q.471-2.232.717-4.28.082-.471.328-.676.266-.225.757-.163zm12.122-.081q.492-.062.737.143.267.205.348.696.656 4.874 1.761 8.56.307.922-.593 1.228l-.533.164q-.921.307-1.187-.614a57 57 0 0 1-1.127-4.505 63 63 0 0 1-.778-4.505q-.123-.983.84-1.086zm23.631-2.273q.922 0 .922.921v.532q0 .922-.922.922h-14.15v5.734q0 4.485-1.72 8.395-.39.88-1.25.471l-.49-.245q-.43-.205-.553-.533-.103-.307.081-.758 1.475-3.4 1.475-7.33V5.602q0-1.74 1.74-1.74zm-7.27-1.352q.963 0 .963.963v.614q0 .962-.962.962H54.1q-.963 0-.962-.962v-.614q0-.963.962-.963zm7.475 16.034q.942 0 .942.942v.532q0 .942-.942.942H49.002q-.942 0-.942-.942v-.532q0-.942.942-.942zM50.784 8.408q.92-.104 1.024.819l.675 6.225q.104.92-.819 1.024l-.532.04q-.922.103-1.024-.818l-.676-6.226q-.102-.921.82-1.023zm5.058-.185q.921 0 .921.922v6.43q0 .921-.921.921h-.533q-.921 0-.921-.921v-6.43q0-.922.921-.922zm5.058.226q.921.103.819 1.023l-.676 6.226q-.102.921-1.024.819l-.532-.041q-.922-.103-.82-1.024l.676-6.225q.103-.922 1.024-.82z"/><path fill="#FF7918" stroke="#fff" stroke-width="0.758" d="M54.752.38a1.896 1.896 0 1 1 .001 3.792 1.896 1.896 0 0 1 0-3.792Z"/></svg>`;

// ========== 类型定义 ==========
interface ThinkingStep {
  kind: "reasoning" | "searching" | "synthesizing";
  status: string;
  label: string;
}

interface Thinking {
  status: "in_progress" | "completed";
  summary: string;
  steps: ThinkingStep[];
}

interface Evidence {
  ref_num: number;
  id: string;
  url: string;
  title: string;
  title_zh?: string;
  publish_date?: string;
  author?: string;
  journal_name?: string;
  publication_info?: string;
  evidence_class?: string;
}

interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
      reasoning_content?: string;
    };
    thinking?: Thinking;
    grounding?: {
      evidence: Evidence[];
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 引用映射类型
interface CitationMapping {
  originalNum: number;
  newNum: number;
  evidence: Evidence;
}

// ========== DOM 元素引用 ==========
const loadingEl = document.getElementById("loading")!;
const contentEl = document.getElementById("content")!;
const logoIconEl = document.getElementById("logo-icon")!;
const logoTextEl = document.getElementById("logo-text")!;
const gotoWebsiteBtnEl = document.getElementById("goto-website-btn")!;
const thinkingSectionEl = document.getElementById("thinking-section")!;
const thinkingHeaderEl = document.getElementById("thinking-header")!;
const thinkingToggleEl = document.getElementById("thinking-toggle")!;
const thinkingContentEl = document.getElementById("thinking-content")!;
const thinkingStepsEl = document.getElementById("thinking-steps")!;
const thinkingStatusTextEl = document.getElementById("thinking-status-text")!;
const answerSectionEl = document.getElementById("answer-section")!;
const answerContentEl = document.getElementById("answer-content")!;
const referencesSectionEl = document.getElementById("references-section")!;
const referencesHeaderEl = document.getElementById("references-header")!;
const referencesToggleEl = document.getElementById("references-toggle")!;
const referencesContentEl = document.getElementById("references-content")!;
const referencesListEl = document.getElementById("references-list")!;
const referencesTitleEl = document.getElementById("references-title")!;
const footerEl = document.getElementById("footer")!;
const footerQrEl = document.getElementById("footer-qr")!;
const downloadBtnEl = document.getElementById("download-btn")!;

// ========== 初始化 Logo ==========
logoIconEl.innerHTML = LOGO_ICON_SVG;
logoTextEl.innerHTML = LOGO_TEXT_SVG;

// ========== 1. 创建 App 实例 ==========
const app = new App({ name: "百小应对话结果", version: "1.0.0" });

// ========== 2. 设置 handlers BEFORE connecting ==========

// 处理 Host 上下文变化（主题等）
function handleHostContextChanged(ctx: McpUiHostContext) {
  if (ctx.theme) {
    applyDocumentTheme(ctx.theme);
  }
  if (ctx.styles?.variables) {
    applyHostStyleVariables(ctx.styles.variables);
  }
  if (ctx.styles?.css?.fonts) {
    applyHostFonts(ctx.styles.css.fonts);
  }
}

app.onhostcontextchanged = handleHostContextChanged;

// 处理工具输入（工具调用开始时）
app.ontoolinput = (params) => {
  console.info("[百小应] 收到工具输入:", params);
  // 显示 loading 状态
  loadingEl.style.display = "flex";
  contentEl.style.display = "none";
  footerEl.style.display = "none";
};

// 处理工具结果（工具调用完成后）
app.ontoolresult = (result) => {
  console.info("[百小应] 收到工具结果:", result);
  loadingEl.style.display = "none";
  contentEl.style.display = "block";

  try {
    const textContent = result.content?.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      showError("未收到有效的响应数据");
      return;
    }
    handleToolResult(textContent.text);
  } catch (error) {
    showError(`解析响应失败: ${error}`);
  }
};

// 处理工具取消
app.ontoolcancelled = (params) => {
  console.info("[百小应] 工具调用被取消:", params.reason);
  loadingEl.style.display = "none";
  contentEl.style.display = "block";
  showError(`操作已取消: ${params.reason || "未知原因"}`);
};

// 处理错误
app.onerror = (error) => {
  console.error("[百小应] App 错误:", error);
};

// ========== 按钮点击事件 ==========
gotoWebsiteBtnEl.addEventListener("click", () => {
  app.openLink({ url: WEBSITE_URL });
});

downloadBtnEl.addEventListener("click", () => {
  app.openLink({ url: DOWNLOAD_URL });
});

// ========== 思考过程折叠/展开 ==========
let thinkingCollapsed = false;
thinkingHeaderEl.addEventListener("click", () => {
  thinkingCollapsed = !thinkingCollapsed;
  thinkingToggleEl.classList.toggle("collapsed", thinkingCollapsed);
  thinkingContentEl.classList.toggle("collapsed", thinkingCollapsed);
});

// ========== 引用区域折叠/展开 ==========
let referencesCollapsed = false;
referencesHeaderEl.addEventListener("click", () => {
  referencesCollapsed = !referencesCollapsed;
  referencesToggleEl.classList.toggle("collapsed", referencesCollapsed);
  referencesContentEl.classList.toggle("collapsed", referencesCollapsed);
});

// ========== 生成下载二维码 ==========
function generateQRCode() {
  footerQrEl.innerHTML = "";

  // 创建 canvas 元素
  const canvas = document.createElement("canvas");
  footerQrEl.appendChild(canvas);

  QRCode.toCanvas(
    canvas,
    DOWNLOAD_URL,
    {
      width: 68,
      margin: 1,
      color: {
        dark: "#262626",
        light: "#ffffff",
      },
    },
    (error) => {
      if (error) {
        console.error("QR Code generation failed:", error);
        footerQrEl.innerHTML = `
          <div style="text-align: center; font-size: 11px; color: #999; padding: 20px 0;">
            扫码下载
          </div>
        `;
      }
    }
  );
}

// ========== 显示底部区域 ==========
function showFooter() {
  footerEl.style.display = "block";
  generateQRCode();
}

// ========== 错误显示 ==========
function showError(message: string) {
  answerSectionEl.style.display = "block";
  answerContentEl.innerHTML = `
    <div class="error-section">
      <div class="error-title">
        <span>⚠️</span>
        错误
      </div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
  showFooter();
}

// ========== HTML 转义 ==========
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ========== 角标处理常量 ==========
// 匹配 ^[n]^ 或 ^[n.m]^ 格式
const BRACKET_SUPERSCRIPT_REGEXP = /\^\[(\d+)(?:\.(\d+))?\]\^/g;
// 匹配 ^n^ 格式（不带方括号）
const SIMPLE_SUPERSCRIPT_REGEXP = /\^(\d+)\^/g;
// 匹配书名号引用
const BOOK_TITLE_SUPERSCRIPT_REGEXP = /\^\[《[^》]*》\]\^/g;

// ========== 规范化角标语法 ==========
function normalizeSuperscriptSyntax(rawContent: string): string {
  if (!rawContent) return "";
  let content = rawContent;

  // 过滤掉包含书名号的引用
  content = content.replaceAll(BOOK_TITLE_SUPERSCRIPT_REGEXP, "");

  // 1. 处理 ^[1,6,8]^ 格式 -> ^1^^6^^8^
  content = content.replace(
    /\^\[(\d+(?:\.\d+)?(?:,\d+(?:\.\d+)?)+)\]\^/g,
    (_, numbers) => {
      return numbers
        .split(",")
        .map((num: string) => `^${num.trim()}^`)
        .join("");
    }
  );

  // 2. 处理 ^[n]^ 格式 -> ^n^（统一为不带方括号的格式）
  content = content.replace(/\^\[(\d+(?:\.\d+)?)\]\^/g, "^$1^");

  // 3. 处理 ^3^^11^ 连续格式（确保正确分隔）
  content = content.replace(/\^\^/g, "^ ^");

  return content;
}

// ========== 角标重排序 ==========
interface ReorderResult {
  content: string;
  orderedEvidence: Evidence[];
  citationOrderMap: Record<string, number>;
}

function reorderCitations(
  rawContent: string,
  evidenceList: Evidence[]
): ReorderResult {
  // 先规范化角标语法，统一为 ^n^ 格式
  const content = normalizeSuperscriptSyntax(rawContent);

  if (!content) {
    return { content: "", orderedEvidence: [], citationOrderMap: {} };
  }

  if (evidenceList.length === 0) {
    // 没有引用列表时，移除所有角标
    const cleanContent = content.replace(SIMPLE_SUPERSCRIPT_REGEXP, "");
    return { content: cleanContent, orderedEvidence: [], citationOrderMap: {} };
  }

  // 用于记录原始编号到新编号的映射
  const orderMap = new Map<number, number>();
  // 按出现顺序排列的引用列表
  const reorderedEvidence: Evidence[] = [];
  // 当前新编号
  let currentIndex = 1;

  // 处理 ^n^ 格式的角标，按出现顺序重新编号
  const remappedContent = content.replace(
    SIMPLE_SUPERSCRIPT_REGEXP,
    (match, numStr) => {
      const originalNum = parseInt(numStr, 10);
      const evidence = evidenceList[originalNum - 1];

      if (!evidence) {
        return ""; // 无效引用，移除
      }

      // 如果这个原始编号第一次出现，分配新编号
      if (!orderMap.has(originalNum)) {
        orderMap.set(originalNum, currentIndex);
        reorderedEvidence.push({
          ...evidence,
          ref_num: currentIndex,
        });
        currentIndex += 1;
      }

      // 返回新编号的角标
      const newNum = orderMap.get(originalNum)!;
      return `^${newNum}^`;
    }
  );

  return {
    content: remappedContent,
    orderedEvidence: reorderedEvidence,
    citationOrderMap: Object.fromEntries(
      Array.from(orderMap.entries()).map(([k, v]) => [String(k), v])
    ),
  };
}

// ========== 自定义 Markdown 渲染器 ==========
function createMarkdownRenderer() {
  const renderer = new marked.Renderer();

  // 自定义链接渲染
  renderer.link = ({ href, title, text }: Tokens.Link) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href || "")}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  // 自定义表格渲染
  renderer.table = ({ header, rows }: Tokens.Table) => {
    const headerHtml = header
      .map((cell) => `<th>${cell.text}</th>`)
      .join("");
    const bodyHtml = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${cell.text}</td>`).join("")}</tr>`
      )
      .join("");
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
  };

  return renderer;
}

// ========== 渲染 Markdown 内容（含角标处理） ==========
function renderMarkdownWithCitations(content: string): string {
  // 配置 marked
  marked.setOptions({
    renderer: createMarkdownRenderer(),
    gfm: true,
    breaks: true,
  });

  // 先渲染 Markdown
  let html = marked.parse(content) as string;

  // Markdown 渲染后，将 ^n^ 格式转换为 bc-sup 元素
  // 注意：^ 符号在 Markdown 中不是特殊字符，会被保留
  html = html.replace(/\^(\d+)\^/g, (_, num) => {
    return `<bc-sup data-ref="${num}">${num}</bc-sup>`;
  });

  return html;
}

// ========== 渲染思考步骤 ==========
function renderThinkingSteps(thinking: Thinking) {
  const steps = thinking.steps || [];
  const summary = thinking.summary || "";

  // 更新状态文本
  thinkingStatusTextEl.textContent =
    thinking.status === "completed" ? "完成思考" : "思考中...";

  // 图标映射
  const iconMap: Record<string, string> = {
    reasoning: `<svg viewBox="0 0 24 24" fill="#FF7918"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
    searching: `<svg viewBox="0 0 24 24" fill="#FF7918"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    synthesizing: `<svg viewBox="0 0 24 24" fill="#FF7918"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
  };

  // 如果有步骤，显示步骤；否则从 summary 解析
  let stepsToRender: { icon: string; text: string }[] = [];

  if (steps.length > 0) {
    stepsToRender = steps.map((step) => ({
      icon: iconMap[step.kind] || iconMap.reasoning,
      text: step.label || step.status,
    }));
  } else if (summary) {
    // 从 summary 中解析步骤
    const lines = summary.split("\n").filter((line) => line.trim());
    stepsToRender = lines.slice(0, 3).map((line) => ({
      icon: iconMap.reasoning,
      text: line.trim(),
    }));
  } else {
    // 默认步骤
    stepsToRender = [
      { icon: iconMap.reasoning, text: "理解问题" },
      { icon: iconMap.searching, text: "检索相关信息" },
      { icon: iconMap.synthesizing, text: "整理相关信息" },
    ];
  }

  thinkingStepsEl.innerHTML = stepsToRender
    .map(
      (step) => `
      <div class="thinking-step">
        <span class="thinking-step-icon">${step.icon}</span>
        <span>${escapeHtml(step.text)}</span>
      </div>
    `
    )
    .join("");

  thinkingSectionEl.style.display = "block";
}

// ========== 获取证据类型标签 ==========
function getEvidenceTypeTag(evidence: Evidence): string {
  // 根据 evidence_class 或其他字段推断类型
  if (evidence.evidence_class) {
    return evidence.evidence_class;
  }
  // 根据 journal_name 判断
  if (evidence.journal_name) {
    return "文献";
  }
  // 默认
  return "参考资料";
}

// ========== 渲染引用列表 ==========
function renderReferences(evidenceList: Evidence[]) {
  if (evidenceList.length === 0) {
    referencesSectionEl.style.display = "none";
    return;
  }

  referencesTitleEl.textContent = `全部引用`;

  referencesListEl.innerHTML = evidenceList
    .map((evidence) => {
      // 确定中文标题和英文标题
      const titleZh = evidence.title_zh || evidence.title;
      const titleEn = evidence.title_zh ? evidence.title : null;

      // 类型标签
      const typeTag = getEvidenceTypeTag(evidence);

      // 构建元信息行
      const metaLines: string[] = [];

      // 作者信息
      if (evidence.author) {
        metaLines.push(escapeHtml(evidence.author));
      }

      // 期刊/出版信息 + 日期
      const pubParts: string[] = [];
      if (evidence.journal_name) {
        pubParts.push(evidence.journal_name);
      }
      if (evidence.publish_date) {
        pubParts.push(evidence.publish_date);
      }
      if (evidence.publication_info) {
        pubParts.push(evidence.publication_info);
      }
      if (pubParts.length > 0) {
        metaLines.push(escapeHtml(pubParts.join(" ")));
      }

      // 点击跳转
      const clickHandler = evidence.url
        ? `onclick="window.open('${escapeHtml(evidence.url)}', '_blank')"`
        : "";

      return `
        <div class="reference-item" id="ref-${evidence.ref_num}" ${clickHandler}>
          <!-- 第一行：序号 + 类型标签 + 标题 -->
          <div class="reference-row-main">
            <span class="reference-num">${evidence.ref_num}.</span>
            <span class="reference-type-tag">${escapeHtml(typeTag)}</span>
            <span class="reference-title-zh">${escapeHtml(titleZh)}</span>
          </div>
          ${titleEn
          ? `
          <!-- 第二行：原文标题 -->
          <div class="reference-row-origin">
            <span class="reference-title-en">[原] ${escapeHtml(titleEn)}</span>
          </div>
          `
          : ""
        }
          ${metaLines.length > 0
          ? `
          <!-- 第三行：元信息 -->
          <div class="reference-row-meta">
            ${metaLines.map((line) => `<span class="reference-meta-line">${line}</span>`).join("")}
          </div>
          `
          : ""
        }
        </div>
      `;
    })
    .join("");

  referencesSectionEl.style.display = "block";

  // 绑定角标点击事件 (bc-sup 元素)
  document.querySelectorAll("bc-sup").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const refNum = (el as HTMLElement).dataset.ref;
      const targetEl = document.getElementById(`ref-${refNum}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        // 高亮效果
        targetEl.style.background = "#fff7f0";
        targetEl.style.margin = "0 -8px";
        targetEl.style.padding = "8px";
        targetEl.style.borderRadius = "8px";
        setTimeout(() => {
          targetEl.style.background = "";
          targetEl.style.margin = "";
          targetEl.style.padding = "8px 0";
          targetEl.style.borderRadius = "";
        }, 2000);
      }
    });
  });
}

// ========== 渲染响应内容 ==========
function renderResponse(response: ChatResponse) {
  const choice = response.choices[0];
  const message = choice?.message;
  const thinking = choice?.thinking;
  const grounding = choice?.grounding;

  // 1. 渲染思考过程
  if (thinking || message?.reasoning_content) {
    const thinkingData: Thinking = thinking || {
      status: "completed",
      summary: message?.reasoning_content || "",
      steps: [],
    };
    renderThinkingSteps(thinkingData);
  }

  // 2. 处理正文和引用
  let content = message?.content || "";
  let orderedEvidence: Evidence[] = grounding?.evidence || [];

  // 如果有引用，进行角标重排序
  if (orderedEvidence.length > 0 && content) {
    const result = reorderCitations(content, orderedEvidence);
    content = result.content;
    orderedEvidence = result.orderedEvidence;
  }

  // 3. 渲染正文
  if (content) {
    const html = renderMarkdownWithCitations(content);
    answerContentEl.innerHTML = html;
    answerSectionEl.style.display = "block";
  }

  // 4. 渲染引用列表
  renderReferences(orderedEvidence);

  // 5. 显示底部
  showFooter();
}

// ========== 解析响应数据 ==========
function parseResponse(text: string): ChatResponse | null {
  try {
    return JSON.parse(text) as ChatResponse;
  } catch {
    return null;
  }
}

// ========== 处理工具结果 ==========
function handleToolResult(text: string) {
  // 检查是否是错误信息
  if (text.startsWith("错误") || text.startsWith("API 调用失败")) {
    showError(text);
    return;
  }

  // 尝试解析 JSON
  const response = parseResponse(text);
  if (response) {
    renderResponse(response);
  } else {
    // 如果不是 JSON，直接渲染为 Markdown
    const html = renderMarkdownWithCitations(text);
    answerContentEl.innerHTML = html;
    answerSectionEl.style.display = "block";
    showFooter();
  }
}

// ========== 3. 连接到 Host ==========
app
  .connect()
  .then(() => {
    console.info("[百小应] 已连接到 Host");
    // 连接成功后应用 Host 上下文
    const ctx = app.getHostContext();
    if (ctx) {
      handleHostContextChanged(ctx);
    }
  })
  .catch((error) => {
    console.error("[百小应] 连接失败:", error);
  });

export { renderResponse, showError, handleToolResult };
