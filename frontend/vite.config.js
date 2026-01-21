import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    root: resolve(__dirname),
    plugins: [],
    server: {
      port: 8080,
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist'
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '/api')
    }
  }
})
