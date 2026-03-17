import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/stocks/',
  build: { outDir: 'dist/stocks' },
  plugins: [react()],
  server: {
    proxy: {
      '/stocks/api': {
        target: 'http://localhost:5001',
        rewrite: (path) => path,
      },
    },
  },
})
