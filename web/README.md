# Rwanda Forest Health Monitor

Custom React dashboard for Sentinel-2 forest health monitoring. Reads the GIS team's `RW_ForestHealth_V2` Feature Service / View through a small secure Node proxy — it does **not** embed the ArcGIS Dashboard.

## Quick start (mock data)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

Default `.env` uses `VITE_USE_MOCK_DATA=true` so the UI is fully functional without GeoHub credentials.

## Connect to the real service

1. In GeoHub, open the hosted item **`RW_ForestHealth_V2_View`** (preferred) or **`RW_ForestHealth_V2`**.
2. Copy its Feature Service URL, for example:

   `https://gh.space.gov.rw/server/rest/services/Hosted/<ItemName>/FeatureServer`

3. Set in `.env`:

```env
VITE_USE_MOCK_DATA=false
AUTH_REQUIRED=true
ARCGIS_PORTAL_URL=https://gh.space.gov.rw/portal
ARCGIS_USERNAME=
ARCGIS_PASSWORD=
FOREST_HEALTH_SERVICE_URL=https://gh.space.gov.rw/server/rest/services/Hosted/.../FeatureServer
SESSION_SECRET=<long-random-string>
```

4. Restart `npm run dev` and sign in with GeoHub credentials.

The notebook does **not** hard-code the hosted Feature Service URL (it is created/found by title at runtime), so you must supply `FOREST_HEALTH_SERVICE_URL`.

## Architecture

```
GeoHub Feature Service (ForestUnits, Observations, AdminLinks, IndexGuide, RunLog, RasterRegistry)
        │
        ▼
server/access-server.js   (token in HttpOnly cookie; no arbitrary URL proxy)
        │
        ▼
src/api/forestHealth.js
        │
        ▼
React dashboard (map, KPIs, filters, charts, compare, observations)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + access server |
| `npm run build` | Production client build |
| `npm run start` | Access server only |

## Notebook source of truth

Service schema, status values, thresholds, and overlay behaviour come from `RW_ForestHealth_Nightly.ipynb`.
