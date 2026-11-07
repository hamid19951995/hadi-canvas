import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Account API origin; the dev/preview server proxies it under /api so cookies stay same-origin. */
const AUTH_TARGET = process.env.AUTH_PROXY_TARGET || 'http://127.0.0.1:8788'

const proxy = {
  '/api/auth': { target: AUTH_TARGET, changeOrigin: false },
  '/api/mcp': { target: AUTH_TARGET, changeOrigin: false },
}

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: { port: 5173, host: true, proxy },
  preview: { proxy },
})
