import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Served under /quotation-app/ on GitHub Pages (see package.json "homepage").
  // Changing `base`? Sync the same path in index.html (inline script) and public/404.html.
  base: '/quotation-app/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // Keep "build" so the existing gh-pages deploy script (-d build) keeps working.
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('/react/')
            || id.includes('/react-dom/')
            || id.includes('react-router')
            || id.includes('scheduler/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tanstack')) return 'tanstack-table'
          if (id.includes('@base-ui')) return 'base-ui'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
})
