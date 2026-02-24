import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/hive-api': {
        target: 'https://api.thehive.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hive-api/, ''),
      },
      '/sightengine-api': {
        target: 'https://api.sightengine.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sightengine-api/, ''),
      }
    }
  }
})
