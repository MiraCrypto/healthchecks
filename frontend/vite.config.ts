import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/ping': 'http://localhost:8080',
      '/payload': 'http://localhost:8080',
    },
  },
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
  },
})
