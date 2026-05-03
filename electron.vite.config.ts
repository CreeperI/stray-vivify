import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import vueDevtools from 'vite-plugin-vue-devtools'

const plugins = (process.env.NODE_ENV === 'development' || process.argv.includes("--dt")) ? [vue(), vueDevtools()] : [vue()]

export default defineConfig({
  main: {
    plugins: []
  },
  preload: {
    plugins: []
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: plugins
  }
})
