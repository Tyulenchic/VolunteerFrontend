import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Используется, только если VITE_API_URL пуст (запросы идут на origin dev-сервера). Локальный PHP-API: php -S 127.0.0.1:8000 -t public.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
