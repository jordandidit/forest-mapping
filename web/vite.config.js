import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEV_BASE = '/forest-mapping/'

function normalizeBase(base) {
  if (!base || base === '/') return '/'
  return base.endsWith('/') ? base : `${base}/`
}

export default defineConfig(({ mode }) => {
  // Vercel: force root base + /api before loadEnv so .env.production GeoHub paths cannot win.
  const onVercel = Boolean(process.env.VERCEL)
  if (onVercel) {
    process.env.VITE_BASE_PATH = process.env.VITE_BASE_PATH || '/'
    process.env.VITE_API_BASE = process.env.VITE_API_BASE || '/api'
    process.env.VITE_USE_GIS_PROXY = process.env.VITE_USE_GIS_PROXY || 'true'
  }

  const env = loadEnv(mode, process.cwd(), '')
  // Local + GeoHub IIS: /forest-mapping/ from .env*. Vercel: site root (see above).
  const APP_BASE = normalizeBase(
    onVercel
      ? process.env.VITE_BASE_PATH || '/'
      : env.VITE_BASE_PATH || DEV_BASE,
  )
  const underBaseApi = APP_BASE === '/' ? null : `${APP_BASE}api`.replace(/\/{2,}/g, '/')

  const apiProxy = {
    target: 'http://localhost:8787',
    changeOrigin: true,
  }

  const proxy = {
    // Prefer host-root /api so map GIS proxy keeps working if the app base path changes.
    '/api': apiProxy,
  }
  if (underBaseApi) {
    proxy[underBaseApi] = {
      ...apiProxy,
      rewrite: (path) => path.replace(new RegExp(`^${APP_BASE.replace(/\/$/, '')}`), ''),
    }
  }

  return {
    base: APP_BASE,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'redirect-root-to-app',
        configureServer(server) {
          if (APP_BASE === '/' || APP_BASE === '') return
          server.middlewares.use((req, res, next) => {
            const url = req.url || ''
            if (url === '/' || url === '') {
              res.statusCode = 302
              res.setHeader('Location', APP_BASE)
              res.end()
              return
            }
            next()
          })
        },
      },
    ],
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy: { '/api': apiProxy },
    },
    optimizeDeps: {
      exclude: ['@arcgis/core'],
    },
  }
})
