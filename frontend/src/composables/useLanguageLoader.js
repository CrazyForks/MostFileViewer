// CodeMirror 语言包的统一懒加载器。
// 所有 @codemirror/lang-* 和 @codemirror/legacy-modes 均通过动态 import 按需加载，
// 避免将全部语言包打入首屏或 Markdown 预览 chunk。
// 加载结果通过 Promise 缓存，同一语法键的重复调用不会触发二次导入。

import { StreamLanguage } from "@codemirror/language";

/**
 * 围栏语言名 / 别名 → 语法键，用于 Markdown 代码块高亮。
 * 与 useFileTypes.js 中 detectSyntaxKey 的扩展名映射互补。
 */
export const langAliasToSyntaxKey = {
    // JavaScript / TypeScript
    javascript: "javascript", js: "javascript", jsx: "javascript",
    mjs: "javascript", cjs: "javascript",
    typescript: "typescript", ts: "typescript", tsx: "typescript",
    // Web
    html: "html", htm: "html",
    css: "css", scss: "css", less: "css",
    vue: "vue",
    xml: "xml", svg: "xml", xhtml: "xml",
    // Data
    json: "json", jsonc: "json",
    yaml: "yaml", yml: "yaml",
    toml: "toml",
    properties: "properties", ini: "properties", env: "properties",
    // Markdown
    markdown: "markdown", md: "markdown",
    // Systems
    python: "python", py: "python",
    java: "java",
    c: "cpp", cpp: "cpp", "c++": "cpp", cc: "cpp", h: "cpp", hpp: "cpp",
    csharp: "csharp", cs: "csharp", "c#": "csharp",
    kotlin: "kotlin", kt: "kotlin",
    scala: "scala",
    dart: "dart",
    go: "go", golang: "go",
    rust: "rust", rs: "rust",
    php: "php",
    ruby: "ruby", rb: "ruby",
    swift: "swift",
    lua: "lua",
    perl: "perl", pl: "perl",
    r: "r",
    clojure: "clojure", clj: "clojure",
    // Shell / Config
    shell: "shell", sh: "shell", bash: "shell", zsh: "shell",
    powershell: "powershell", ps1: "powershell",
    dockerfile: "dockerfile", docker: "dockerfile",
    cmake: "cmake",
    nginx: "nginx",
    // Other
    sql: "sql",
    protobuf: "protobuf", proto: "protobuf",
    diff: "diff", patch: "diff",
};

// 语法键 → 动态加载函数，返回 LanguageSupport 或 StreamLanguage。
// 现代语言包直接返回 .language 或默认导出；legacy-modes 需用 StreamLanguage.define 包装。
const languageLoaders = {
    javascript: () =>
        import("@codemirror/lang-javascript").then((m) =>
            m.javascript({ jsx: true }),
        ),
    typescript: () =>
        import("@codemirror/lang-javascript").then((m) =>
            m.javascript({ jsx: true, typescript: true }),
        ),
    html: () => import("@codemirror/lang-html").then((m) => m.html()),
    css: () => import("@codemirror/lang-css").then((m) => m.css()),
    json: () => import("@codemirror/lang-json").then((m) => m.json()),
    markdown: () => import("@codemirror/lang-markdown").then((m) => m.markdown()),
    python: () => import("@codemirror/lang-python").then((m) => m.python()),
    java: () => import("@codemirror/lang-java").then((m) => m.java()),
    cpp: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
    go: () => import("@codemirror/lang-go").then((m) => m.go()),
    rust: () => import("@codemirror/lang-rust").then((m) => m.rust()),
    php: () => import("@codemirror/lang-php").then((m) => m.php()),
    sql: () => import("@codemirror/lang-sql").then((m) => m.sql()),
    xml: () => import("@codemirror/lang-xml").then((m) => m.xml()),
    yaml: () => import("@codemirror/lang-yaml").then((m) => m.yaml()),
    // Vue 需要 html 作为 base，复用已缓存的 html LanguageSupport
    vue: async () => {
        const { vue } = await import("@codemirror/lang-vue");
        const htmlSupport = await loadLanguageSupport("html");
        return vue({ base: htmlSupport });
    },
    // Legacy modes — 需用 StreamLanguage.define 包装
    csharp: () =>
        import("@codemirror/legacy-modes/mode/clike").then((m) =>
            StreamLanguage.define(m.csharp),
        ),
    kotlin: () =>
        import("@codemirror/legacy-modes/mode/clike").then((m) =>
            StreamLanguage.define(m.kotlin),
        ),
    scala: () =>
        import("@codemirror/legacy-modes/mode/clike").then((m) =>
            StreamLanguage.define(m.scala),
        ),
    dart: () =>
        import("@codemirror/legacy-modes/mode/clike").then((m) =>
            StreamLanguage.define(m.dart),
        ),
    clojure: () =>
        import("@codemirror/legacy-modes/mode/clojure").then((m) =>
            StreamLanguage.define(m.clojure),
        ),
    cmake: () =>
        import("@codemirror/legacy-modes/mode/cmake").then((m) =>
            StreamLanguage.define(m.cmake),
        ),
    diff: () =>
        import("@codemirror/legacy-modes/mode/diff").then((m) =>
            StreamLanguage.define(m.diff),
        ),
    dockerfile: () =>
        import("@codemirror/legacy-modes/mode/dockerfile").then((m) =>
            StreamLanguage.define(m.dockerFile),
        ),
    lua: () =>
        import("@codemirror/legacy-modes/mode/lua").then((m) =>
            StreamLanguage.define(m.lua),
        ),
    nginx: () =>
        import("@codemirror/legacy-modes/mode/nginx").then((m) =>
            StreamLanguage.define(m.nginx),
        ),
    perl: () =>
        import("@codemirror/legacy-modes/mode/perl").then((m) =>
            StreamLanguage.define(m.perl),
        ),
    powershell: () =>
        import("@codemirror/legacy-modes/mode/powershell").then((m) =>
            StreamLanguage.define(m.powerShell),
        ),
    properties: () =>
        import("@codemirror/legacy-modes/mode/properties").then((m) =>
            StreamLanguage.define(m.properties),
        ),
    protobuf: () =>
        import("@codemirror/legacy-modes/mode/protobuf").then((m) =>
            StreamLanguage.define(m.protobuf),
        ),
    r: () =>
        import("@codemirror/legacy-modes/mode/r").then((m) =>
            StreamLanguage.define(m.r),
        ),
    ruby: () =>
        import("@codemirror/legacy-modes/mode/ruby").then((m) =>
            StreamLanguage.define(m.ruby),
        ),
    shell: () =>
        import("@codemirror/legacy-modes/mode/shell").then((m) =>
            StreamLanguage.define(m.shell),
        ),
    swift: () =>
        import("@codemirror/legacy-modes/mode/swift").then((m) =>
            StreamLanguage.define(m.swift),
        ),
    toml: () =>
        import("@codemirror/legacy-modes/mode/toml").then((m) =>
            StreamLanguage.define(m.toml),
        ),
};

// 缓存：syntaxKey → Promise<LanguageSupport | Language>
const cache = new Map();

/**
 * 按语法键异步加载 CodeMirror 语言支持。
 * 返回 Promise，结果会被缓存。未知语法键返回空数组（CodeMirror 视为无语言支持）。
 * @param {string} syntaxKey 语法键
 * @returns {Promise<LanguageSupport | Language | []>}
 */
export function loadLanguageSupport(syntaxKey) {
    if (cache.has(syntaxKey)) {
        return cache.get(syntaxKey);
    }
    const loader = languageLoaders[syntaxKey];
    if (!loader) {
        return Promise.resolve([]);
    }
    const promise = loader().catch((err) => {
        // 加载失败时移除缓存，使下次调用可重试
        cache.delete(syntaxKey);
        throw err;
    });
    cache.set(syntaxKey, promise);
    return promise;
}

/**
 * 按语法键异步加载 Lezer parser，用于代码高亮。
 * @param {string} syntaxKey 语法键
 * @returns {Promise<Parser | null>}
 */
export async function loadParser(syntaxKey) {
    const support = await loadLanguageSupport(syntaxKey);
    if (!support || (Array.isArray(support) && support.length === 0)) {
        return null;
    }
    // LanguageSupport 有 .language.parser；StreamLanguage（Language）直接有 .parser
    if (support.language && support.language.parser) {
        return support.language.parser;
    }
    if (support.parser) {
        return support.parser;
    }
    return null;
}

/**
 * 按语法键异步加载 CodeMirror 语言支持（兼容旧接口名称）。
 * @param {string} syntax 语法键
 * @returns {Promise<LanguageSupport | Language | []>}
 */
export function resolveLanguageBySyntaxKey(syntax) {
    return loadLanguageSupport(syntax);
}
