/**
 * Vite 配置
 * 用于将 MCP Apps UI 打包为单个 HTML 文件
 */

import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const INPUT = process.env.INPUT;

if (!INPUT) {
  throw new Error("INPUT environment variable is not set. Example: INPUT=src/ui/chat-result.html");
}

const isDevelopment = process.env.NODE_ENV === "development";
const inputFilename = path.basename(INPUT);

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    sourcemap: isDevelopment ? "inline" : false,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,
    rollupOptions: {
      input: INPUT,
      output: {
        // 保持原始文件名
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    outDir: "dist/ui",
    emptyOutDir: false,
  },
  // 确保能正确处理 TypeScript
  esbuild: {
    target: "es2020",
  },
});
