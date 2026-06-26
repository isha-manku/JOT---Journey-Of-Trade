import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/docplatform/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/reference": "http://localhost:8000",
      "/documents": "http://localhost:8000",
    },
  },
});
