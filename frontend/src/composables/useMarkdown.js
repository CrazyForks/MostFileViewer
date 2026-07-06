import { marked } from "marked";
import DOMPurify from "dompurify";
import { highlightCodeToHtml } from "./useCodeHighlight.js";

marked.setOptions({
    gfm: true, // 表格、删除线、任务列表
    breaks: false, // 遵循 CommonMark 换行规则
});

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// 将含 Unicode 的字符串编码为 base64，供 data 属性安全承载 mermaid 源码，
// 避免 --> 等语法字符被 DOMPurify 转义或语法高亮破坏。
function encodeMermaidSource(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function encodeCodeSource(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function decodeCodeSource(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}

// 自定义代码块渲染：用 CodeMirror 的 Lezer 解析器生成带 tok-* class 的高亮 HTML，
// class 配色在 theme.css 中映射到 --cm-syntax-* 变量，与编辑器一致并联动明暗主题。
// 由于语言包改为懒加载，renderer 先输出带 data-raw-code 的占位代码块，
// 再由 renderMarkdown 异步高亮后替换内容。
marked.use({
    renderer: {
        code({ text, lang }) {
            const language = (lang || "").trim().split(/\s+/)[0];
            // mermaid 代码块输出占位容器，源码经 base64 存入 data 属性，
            // 由 useMermaid 在 DOM 挂载后异步渲染为 SVG。
            if (language === "mermaid") {
                return `<div class="mermaid-diagram" data-mermaid-source="${encodeMermaidSource(text)}"></div>\n`;
            }
            // 普通代码块：先输出转义后的纯文本占位，data-raw-code 供异步高亮替换
            const langClass = language ? ` class="language-${language}"` : "";
            const encoded = encodeCodeSource(text);
            return `<pre><code${langClass} data-raw-code="${encoded}" data-lang="${language}">${escapeHtml(text)}</code></pre>\n`;
        },
    },
});

// 净化后为所有链接补全在新窗口打开的属性，避免在应用内跳转导致预览上下文丢失。
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.hasAttribute("href")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
    }
});

/**
 * 将 Markdown 源码解析为经过净化的安全 HTML 字符串。
 * 代码块通过懒加载的语言包异步高亮；无法识别语言时回退为转义纯文本。
 * @param {string} source Markdown 源文本
 * @returns {Promise<string>} 可直接用于 v-html 的净化后 HTML
 */
export async function renderMarkdown(source) {
    const rawHtml = marked.parse(source ?? "");

    // 使用 DOM 容器解析 HTML，定位代码块占位节点并异步高亮
    const container = document.createElement("div");
    container.innerHTML = rawHtml;

    const codeBlocks = container.querySelectorAll("code[data-raw-code]");
    if (codeBlocks.length > 0) {
        await Promise.all(
            Array.from(codeBlocks).map(async (block) => {
                const lang = block.getAttribute("data-lang") || "";
                const encoded = block.getAttribute("data-raw-code") || "";
                // 清理 data 属性，避免残留到最终 HTML
                block.removeAttribute("data-raw-code");
                block.removeAttribute("data-lang");

                if (!encoded) return;

                let code;
                try {
                    code = decodeCodeSource(encoded);
                } catch {
                    return;
                }

                const highlighted = await highlightCodeToHtml(code, lang);
                if (highlighted) {
                    block.innerHTML = highlighted;
                }
            }),
        );
    }

    return DOMPurify.sanitize(container.innerHTML, {
        ADD_ATTR: ["target", "rel", "class", "data-mermaid-source"],
    });
}
