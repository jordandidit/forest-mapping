import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { completeOAuthLogin, isMockMode } from './api/forestHealth'
import { isOAuthReturn, registerOAuth } from './api/oauth'

async function boot() {
  if (!isMockMode()) {
    registerOAuth()
  }

  // GeoHub redirects to the registered URI (app root) with #access_token=...
  if (!isMockMode() && isOAuthReturn()) {
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML =
        '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font:14px/1.4 system-ui,sans-serif;color:#555">Completing GeoHub sign-in…</div>'
    }
    try {
      await completeOAuthLogin()
    } catch (err) {
      if (root) {
        root.innerHTML = `<div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:12px;font:14px/1.4 system-ui,sans-serif;padding:24px;text-align:center"><p style="color:#b71c1c">${String(err?.message || err)}</p><a href="${import.meta.env.BASE_URL || '/'}">Back to app</a></div>`
      }
      return
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
