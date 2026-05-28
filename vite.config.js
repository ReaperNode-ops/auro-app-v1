import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into its own chunk - loads in parallel
          firebase: ["firebase/app", "firebase/auth"],
          // Split React into its own chunk
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
