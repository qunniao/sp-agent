import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

/**
 * Vite 构建配置
 * - @ 别名指向 app/src，方便模块内引用
 * - 开发服务器端口 3000
 * - 代理 /api 到后端（后端就绪后启用）
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      "@": resolve(__dirname, "app/src"),
      "@core": resolve(__dirname, "packages/core/src"),
      // 使用完整版 Vue（含模板编译器），确保 .vue 文件和内联模板都能正常编译
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },

  server: {
    port: 3000,
    host: "0.0.0.0",
    // 后端 API 代理，等后端跑起来后取消注释
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8080",
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ""),
    //   },
    // },
  },

  build: {
    outDir: "dist",
    // 按模块拆分 chunk，避免单个包过大
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "vue-router", "pinia"],
          "antd-vendor": ["ant-design-vue", "@ant-design/icons-vue"],
        },
      },
    },
  },
});
