import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import wails from "@wailsio/runtime/plugins/vite";

export default defineConfig({
  base: "./",
  plugins: [vue(), wails("./bindings")],
  build: {
    // @silurus/ooxml 的 WASM 模块可能使用 top-level await，
    // 需确保构建目标支持该特性。WebView2 基于 Chromium，完整支持。
    target: 'esnext',
    // 禁止内联任何资源为 base64，确保 WASM、字体等均以独立文件输出。
    // Wails 内嵌文件服务器无 HTTP 请求数量限制，多文件不影响性能。
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // CodeMirror 核心包被 CodePreview 和 Markdown 预览共享，
          // 统一归组避免重复打包。
          'codemirror-core': [
            'codemirror',
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/language',
            '@codemirror/search',
          ],
        },
      },
    },
  },
});
