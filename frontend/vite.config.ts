import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "..",
  server: {
    host: "0.0.0.0",
    port: 5173, //front
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://localhost:7272",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});