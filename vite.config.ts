import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    strictPort: true,
    // Enable HTTPS for WebRTC media access
    https: {
      key: fs.readFileSync("cert/localhost.key"),
      cert: fs.readFileSync("cert/localhost.crt"),
    },
    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'https://localhost:5000', // Change port if your backend uses a different one
        secure: false, // Allow self-signed certificates
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
