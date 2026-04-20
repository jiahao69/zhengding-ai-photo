import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ViteImageOptimizer()],
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5175,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
