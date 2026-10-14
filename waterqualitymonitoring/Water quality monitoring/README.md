# Rwanda Water Resources Monitoring

Lake-centric water quality monitoring frontend for Rwanda, replacing the ArcGIS Dashboard experience with a focused monitoring application.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Zustand (UI + auth application state)
- TanStack Query (mock / ArcGIS server state)
- Recharts
- `@arcgis/core` IdentityManager (Enterprise OAuth)

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

The app is served under the base path `/water-quality/` (Vite `base` in `vite.config.ts`; the router basename and OAuth redirect URI derive from it).

Dev URL: `http://localhost:5173/water-quality/`

Primary route: `/water-quality/lakes/lake-kivu` (the app root redirects here)

## Data providers

| Variable | Values | Purpose |
|---|---|---|
| `VITE_DATA_PROVIDER` | `mock` (default) / `arcgis` | Select data source |
| `VITE_ARCGIS_PORTAL_URL` | Portal URL | ArcGIS Enterprise Portal |
| `VITE_ARCGIS_CLIENT_ID` | Application Client ID | OAuth app id (no client secret) |
| `VITE_ARCGIS_FEATURE_SERVICE_URL` | FeatureServer base URL | Production tabular service |

Never put ArcGIS session tokens, passwords, or client secrets in source or committed env files.

### OAuth redirect URI

Register this exact redirect URI on the ArcGIS Application item in Portal:

`http://localhost:5173/water-quality/oauth/callback`

For deployments, register `<origin>/water-quality/oauth/callback`.

(Adjust host/port if your Vite origin differs.)

Mock mode bypasses AuthGate. ArcGIS mode requires Enterprise OAuth and does **not** silently fall back to mocks.

## Phases

- **WATER-DATA-01** — ArcGIS REST adapter + Muhazi tabular wiring
- **WATER-AUTH-01** — ArcGIS Enterprise OAuth + IdentityManager
- **WATER-DATA-02** — ImageServer / real map raster (not started)
