import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/VolunteerFrontend/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Используется, только если VITE_API_URL пуст (запросы идут на origin dev-сервера). Локальный API.
        target: 'https://localhost:7227',
        changeOrigin: true,
        secure: false, // dev-сертификат ASP.NET
      },
    },
  },
});
