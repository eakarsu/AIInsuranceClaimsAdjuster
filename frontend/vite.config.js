import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT || 13500),
    strictPort: true,
    proxy: {
      '/api': process.env.BACKEND_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || process.env.PORT || 13501}`
    }
  }
})
