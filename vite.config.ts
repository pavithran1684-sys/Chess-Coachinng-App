import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['5173-it5og2vzfv9a1rhygzv3o.e2b.app'],
    cors: {
      origin: [
        'https://5173-it5og2vzfv9a1rhygzv3o.e2b.app',
        'https://app.useagent.org',
      ],
    },
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
