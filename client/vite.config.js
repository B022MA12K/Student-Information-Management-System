import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to :5173. Vite forwards /api and /uploads to Express on :3001,
// so the React code never needs the API address and CORS is not a problem in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
