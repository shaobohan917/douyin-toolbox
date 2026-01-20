import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname),
  plugins: [],
  server: {
    port: 8080,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist'
  }
})
