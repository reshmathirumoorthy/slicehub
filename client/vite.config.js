import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite + React + Tailwind CSS v4
// Proxy /api in development so the browser can call the backend without CORS friction.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on IPv4 + IPv6 so email links to localhost / 127.0.0.1 both work.
    // Without this, Vite often binds only to ::1 and 127.0.0.1 is unreachable.
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
