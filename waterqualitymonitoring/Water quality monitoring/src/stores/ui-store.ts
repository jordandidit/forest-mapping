import { create } from 'zustand'
import type { MapLayerId } from '@/domain/water-quality/types'
import type { TimeRangeId } from '@/domain/observation/types'
import { DEFAULT_LAKE_ID } from '@/data/mock/lakes'
import type { LakeConditionFilter } from '@/features/lakes/lake-condition-filter'

export type ComparisonMode = 'single_date' | 'before_after' | 'layer_comparison'

export type TrendParameterTab = 'turbidity' | 'ndci' | 'floating_vegetation'

export type TrendView = 'chart' | 'table'

export type BasemapMode = 'map' | 'satellite' | 'terrain'

interface UiState {
  selectedLakeId: string
  selectedLayer: MapLayerId
  /** Null means Latest. Shared by the nav date picker, chart, and history. */
  selectedObservationId: string | null
  /** Map layer to restore when historical viewing ends. */
  layerBeforeHistorical: MapLayerId | null
  selectedObservationDate: string | null
  selectedHotspotId: string | null
  comparisonMode: ComparisonMode
  basemapMode: BasemapMode
  sidebarCollapsed: boolean
  /** Shared with the top-nav lake search and the sidebar list. */
  lakeSearchQuery: string
  /** Top-bar condition chip. Filters the sidebar lake list. */
  lakeConditionFilter: LakeConditionFilter
  /** Pixel height of the water-quality-over-time panel. Null uses the default. */
  temporalPanelHeight: number | null
  trendParameter: TrendParameterTab
  trendTimeRange: TimeRangeId
  /** Water quality over time shows either the chart or the observation table. */
  trendView: TrendView
  setSelectedLakeId: (lakeId: string) => void
  setSelectedLayer: (layer: MapLayerId) => void
  setSelectedObservationDate: (date: string | null) => void
  setSelectedHotspotId: (hotspotId: string | null) => void
  setComparisonMode: (mode: ComparisonMode) => void
  setBasemapMode: (mode: BasemapMode) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setLakeSearchQuery: (query: string) => void
  setLakeConditionFilter: (filter: LakeConditionFilter) => void
  setTemporalPanelHeight: (height: number | null) => void
  setTrendParameter: (parameter: TrendParameterTab) => void
  setTrendTimeRange: (range: TimeRangeId) => void
  setTrendView: (view: TrendView) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedLakeId: DEFAULT_LAKE_ID,
  /** Production default matches Web Map: Turbidity · Per lake visible. */
  selectedLayer: 'turbidity',
  selectedObservationId: null,
  layerBeforeHistorical: null,
  selectedObservationDate: '2026-10-03',
  selectedHotspotId: null,
  comparisonMode: 'single_date',
  basemapMode: 'satellite',
  sidebarCollapsed: false,
  lakeSearchQuery: '',
  lakeConditionFilter: 'all',
  temporalPanelHeight: null,
  trendParameter: 'turbidity',
  trendTimeRange: '1Y',
  trendView: 'chart',
  setSelectedLakeId: (lakeId) => set({ selectedLakeId: lakeId }),
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  setSelectedObservationDate: (date) => set({ selectedObservationDate: date }),
  setSelectedHotspotId: (hotspotId) => set({ selectedHotspotId: hotspotId }),
  setComparisonMode: (mode) => set({ comparisonMode: mode }),
  setBasemapMode: (mode) => set({ basemapMode: mode }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setLakeSearchQuery: (query) => set({ lakeSearchQuery: query }),
  setLakeConditionFilter: (filter) => set({ lakeConditionFilter: filter }),
  setTemporalPanelHeight: (height) => set({ temporalPanelHeight: height }),
  setTrendParameter: (parameter) => set({ trendParameter: parameter }),
  setTrendTimeRange: (range) => set({ trendTimeRange: range }),
  setTrendView: (view) => set({ trendView: view }),
}))