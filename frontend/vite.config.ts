import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      // FE dev proxy: /api·/files → http://localhost:8080 (BE 포트 8080)
      // /files: 백엔드가 서빙하는 업로드 이미지(공간 사진·도면). 없으면 dev에서 이미지가 404난다.
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/files': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
