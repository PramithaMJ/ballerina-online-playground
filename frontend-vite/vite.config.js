import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path - '/' for Cloudflare Pages, '/ballerina-online-playground/' for GitHub Pages
  base: '/',
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging production issues
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'monaco-editor': ['@monaco-editor/react']
        }
      }
    }
  },
  // Define environment variables for build time
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify(process.env.VITE_TURNSTILE_SITE_KEY),
    'import.meta.env.VITE_ENABLE_VERIFICATION': JSON.stringify(process.env.VITE_ENABLE_VERIFICATION)
  }
})
