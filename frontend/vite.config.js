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
  },
});
