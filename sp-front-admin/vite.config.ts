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
    // 后端 API 代理：sp-ai（8081）控制器自带 /api 前缀；sp-base（8080）靠 rewrite 剥前缀
    proxy: {
      // sp-ai：AI 客服后端（知识库/问答/意图/客户/订单/风险）
      "/api/kb": { target: "http://localhost:8081", changeOrigin: true },
      "/api/chat": { target: "http://localhost:8081", changeOrigin: true },
      "/api/intent": { target: "http://localhost:8081", changeOrigin: true },
      "/api/customer": { target: "http://localhost:8081", changeOrigin: true },
      "/api/orders": { target: "http://localhost:8081", changeOrigin: true },
      "/api/risk": { target: "http://localhost:8081", changeOrigin: true },
      // sp-base：传统业务后端，控制器无 /api 前缀，转发前剥掉
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
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
