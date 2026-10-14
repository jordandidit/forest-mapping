import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // App is served under /water-quality/ (router basename + OAuth redirect derive from this).
  base: '/water-quality/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
    // Prevent duplicate IdentityManager / esriConfig instances (breaks OAuth + WebMap).
    dedupe: ['@arcgis/core'],
  },
  server: {
    proxy: {
      // Localhost CORS bridge for Enterprise Portal REST (WebMap item/data).
      '/__rw_portal': {
        target: 'https://gh.space.gov.rw',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/__rw_portal/, '/portal'),
      },
    },
  },
  optimizeDeps: {
    include: [
      '@arcgis/core',
      '@arcgis/core/identity/IdentityManager.js',
      '@arcgis/core/identity/OAuthInfo.js',
      '@arcgis/core/portal/Portal.js',
      '@arcgis/core/request.js',
      '@arcgis/core/WebMap.js',
      '@arcgis/core/views/MapView.js',
      '@arcgis/core/layers/ImageryLayer.js',
      '@arcgis/core/layers/GraphicsLayer.js',
      '@arcgis/core/config.js',
    ],
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
