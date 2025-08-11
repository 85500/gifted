import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: { __ADSENSE_CLIENT_ID__: JSON.stringify(env.ADSENSE_CLIENT_ID || '') },
    build: { outDir: 'dist' }
  }
})
