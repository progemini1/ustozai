import { defineConfig } from "vite";
export default defineConfig({
  server: {
    proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: true } },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          material: [
            "@material/web/button/filled-button.js",
            "@material/web/button/outlined-button.js",
            "@material/web/chips/filter-chip.js",
          ],
          motion: ["motion/react"],
          react: ["react", "react-dom/client"],
        },
      },
    },
  },
});
