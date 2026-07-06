import { highlightCode, tagHighlighter } from "@lezer/highlight";
import { tags as t } from "@lezer/highlight";
import { langAliasToSyntaxKey, loadParser } from "./useLanguageLoader.js";

// 将高亮标签映射为 class 名，class 的具体配色在 theme.css 中通过
// --cm-syntax-* 变量定义，从而与 CodeMirror 编辑器保持一致并自动联动明暗主题。
const highlighter = tagHighlighter([
    { tag: t.comment, class: "tok-comment" },
    { tag: [t.keyword, t.operatorKeyword, t.modifier], class: "tok-keyword" },
    { tag: [t.string, t.character, t.attributeValue], class: "tok-string" },
    { tag: [t.number, t.bool, t.null, t.atom], class: "tok-constant" },
    {
        tag: [t.variableName, t.propertyName, t.attributeName],
        class: "tok-variable",
    },
    {
        tag: [
            t.function(t.variableName),
            t.function(t.propertyName),
            t.labelName,
        ],
        class: "tok-function",
    },
    {
        tag: [t.typeName, t.className, t.namespace, t.tagName],
        class: "tok-type",
    },
    { tag: [t.operator, t.punctuation, t.bracket], class: "tok-operator" },
    { tag: [t.regexp, t.escape, t.special(t.string)], class: "tok-special" },
    {
        tag: [t.meta, t.annotation, t.processingInstruction],
        class: "tok-meta",
    },
    { tag: [t.heading, t.strong], class: "tok-heading" },
    { tag: t.link, class: "tok-link" },
    { tag: t.invalid, class: "tok-invalid" },
]);

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * 将代码字符串按指定语言异步生成带高亮 class 的 HTML。
 * 语言包通过动态 import 按需加载，首次调用可能稍慢，后续走缓存。
 * 无法识别语言或解析失败时返回 null，交由调用方回退为纯文本。
 * @param {string} code 代码内容
 * @param {string} lang 围栏语言名
 * @returns {Promise<string|null>} 带 <span class="tok-*"> 的 HTML，或 null
 */
export async function highlightCodeToHtml(code, lang) {
    const syntaxKey = langAliasToSyntaxKey[(lang || "").toLowerCase()];
    if (!syntaxKey) {
        return null;
    }
    const parser = await loadParser(syntaxKey);
    if (!parser) {
        return null;
    }
    try {
        const tree = parser.parse(code);
        let result = "";
        highlightCode(
            code,
            tree,
            highlighter,
            (text, classes) => {
                result += classes
                    ? `<span class="${classes}">${escapeHtml(text)}</span>`
                    : escapeHtml(text);
            },
            () => {
                result += "\n";
            },
        );
        return result;
    } catch {
        return null;
    }
}
