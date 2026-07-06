// 兼容层：将原有 useSyntaxLanguage 导出转发到拆分后的模块。
// - 纯工具函数（syntaxOptions、detectSyntaxKey、isStandaloneWebFile、isMarkdownFile）
//   移至 useFileTypes.js，不依赖任何 CodeMirror 包。
// - resolveLanguageBySyntaxKey 移至 useLanguageLoader.js，通过动态 import 按需加载语言包。
//
// 新代码建议直接从 useFileTypes.js 和 useLanguageLoader.js 导入，
// 本文件仅保证已有导入不中断。
export {
    syntaxOptions,
    detectSyntaxKey,
    isStandaloneWebFile,
    isMarkdownFile,
} from "./useFileTypes.js";
export { resolveLanguageBySyntaxKey } from "./useLanguageLoader.js";
