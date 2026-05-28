import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/query': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
