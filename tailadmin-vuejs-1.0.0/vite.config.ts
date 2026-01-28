import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)
  const enableDevTools =
    mode === 'development' && process.env.VITE_ENABLE_VUE_DEVTOOLS !== 'false'

  return {
    base: process.env.NODE_ENV === 'production' ? '/tailadmin-vuejs/' : '/',
    plugins: [vue(), vueJsx(), enableDevTools ? vueDevTools() : null].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    // listen untuk LAN
    server: {
      host: true, // atau '0.0.0.0'
      port: 5173,
      strictPort: true,
      allowedHosts: ['sankyu-transport.fun'],
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  }
})
