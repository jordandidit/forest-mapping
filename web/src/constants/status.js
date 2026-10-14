/** Status values and colors from RW_ForestHealth_Nightly.ipynb */
export const STATUS_COLORS = {
  'Disturbance alert': '#b71c1c',
  'Moisture stress': '#ef6c00',
  Watch: '#fbc02d',
  Healthy: '#2e7d32',
  'Low canopy': '#a1887f',
  'No recent data': '#9e9e9e',
  Pending: '#cfd8dc',
}

export const STATUS_ORDER = [
  'Disturbance alert',
  'Moisture stress',
  'Watch',
  'Healthy',
  'Low canopy',
  'No recent data',
  'Pending',
]

export const STATUS_RANK = {
  Healthy: 1,
  'Low canopy': 2,
  Watch: 2,
  'Moisture stress': 3,
  'Disturbance alert': 4,
}

export const FOREST_GROUPS = ['Natural forest', 'Dry forest & savannah']

export const CONDITION_NDVI = {
  'Natural forest': { good: 0.7, fair: 0.55 },
  'Dry forest & savannah': { good: 0.4, fair: 0.22 },
}

export const THRESHOLDS = {
  DISTURBANCE_NBR_DROP: 0.1,
  DISTURBANCE_NDVI_DROP: 0.08,
  MOISTURE_ANOMALY: -0.1,
  WATCH_NDVI_ANOMALY: -0.08,
  STALE_DAYS: 45,
  HISTORY_MONTHS: 14,
}

export const NDVI_PALETTE = ['#8e2526', '#d84315', '#ef9a3d', '#ffd54f', '#9ccc65', '#43a047', '#1b5e20']
export const NDVI_BREAKS = [-1.0, 0.2, 0.35, 0.5, 0.6, 0.7, 0.8, 1.0]

export const NBR_PALETTE = ['#b71c1c', '#e53935', '#fb8c00', '#fdd835', '#7cb342', '#43a047', '#1b5e20']
export const NBR_BREAKS = [-1.0, 0.0, 0.1, 0.2, 0.3, 0.45, 0.6, 1.0]

export const PROJECT = {
  title: 'Rwanda Forest Health Monitor',
  subtitle: "Canopy condition, disturbance and moisture stress of Rwanda's parks and natural forests from Sentinel-2, last 14 months",
  shortSubtitle: "Satellite monitoring of Rwanda's protected forests",
  serviceName: 'RW_ForestHealth_V2',
  themeKey: 'forest-health-theme',
}

export const COMPARE_COLORS = ['#16794A', '#2563EB', '#D97706', '#7C3AED']

export const LAYER_NAMES = {
  ForestUnits: 'ForestUnits',
  Observations: 'Observations',
  AdminLinks: 'AdminLinks',
  IndexGuide: 'IndexGuide',
  RunLog: 'RunLog',
  RasterRegistry: 'RasterRegistry',
}
