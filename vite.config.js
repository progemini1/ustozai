import { defineConfig } from "vite";
export default defineConfig({
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
