import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { RightInsightsPanel } from '@/components/layout/RightInsightsPanel'
import { DataStatePanel } from '@/components/ui/DataStatePanel'
import { LakeConditionPanel } from '@/features/lakes/components/LakeConditionPanel'
import { LakeMap } from '@/features/lakes/components/LakeMap'
import { LakeWorkspaceFrame, LakeWorkspaceHeader } from '@/features/lakes/components/LakeWorkspaceHeader'
import { useWaterBody } from '@/features/lakes/hooks/use-water-body'
import { mapObservationsToTimeSeries } from '@/data/arcgis/mappers/observation.mapper'
import { ObservationHistory } from '@/features/observations/components/ObservationHistory'
import {
  commitObservationSelection,
  commitReturnToLatest,
} from '@/features/observations/commit-observation-selection'
import {
  buildObservationComparison,
  clearComparisonSelection,
  latestValidObservation,
  observationForCurrentCondition,
  observationQualityLabel,
  selectObservation,
  sortObservationsNewestFirst,
  toggleComparisonSelection,
} from '@/features/observations/history'
import { surfaceTrendLabel } from '@/domain/intelligence/helpers'
import { mapLayerWhileViewing } from '@/features/map/historical-sentinel'
import { ParameterTrendChart } from '@/features/water-quality/components/ParameterTrendChart'
import { useHotspots } from '@/features/observations/hooks/use-scenes'
import {
  useLatestObservation,
  useObservations,
  useParameterTimeSeries,
} from '@/features/water-quality/hooks/use-observations'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { resizeTemporalPanelHeight } from '@/features/lakes/temporal-panel-size'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

export function LakeOverviewPage() {
  const { lakeId = '' } = useParams()
  const {
    data: lake,
    isLoading: lakeLoading,
    isPlaceholderData: lakePending,
    error: lakeError,
    isFetched,
  } = useWaterBody(lakeId)

  const {
    selectedLayer,
    selectedHotspotId,
    trendParameter,
    trendTimeRange,
    setSelectedLakeId,
    setSelectedHotspotId,
    setSelectedLayer,
    setTrendParameter,
    setTrendTimeRange,
    trendView,
    setTrendView,
  } = useUiStore()
  const selectedObservationId = useUiStore((state) => state.selectedObservationId)
  const temporalPanelHeight = useUiStore((state) => state.temporalPanelHeight)
  const setTemporalPanelHeight = useUiStore((state) => state.setTemporalPanelHeight)
  const temporalPanelRef = useRef<HTMLElement>(null)
  const breakpoint = useBreakpoint()
  const [comparing, setComparing] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const observationQuery = useLatestObservation(lake)
  const observationsQuery = useObservations(lake)
  const hotspotsQuery = useHotspots(lake?.id)
  const seriesQuery = useParameterTimeSeries(lake, trendParameter)

  useEffect(() => {
    if (lake) {
      setSelectedLakeId(lake.id)
    }
  }, [lake, setSelectedLakeId])

  useEffect(() => {
    commitReturnToLatest()
    setComparing(false)
    setCompareIds(clearComparisonSelection())
  }, [lake?.id])

  const historicalLock = selectedObservationId != null
  useEffect(() => {
    if (historicalLock && selectedLayer !== 'true_colour') {
      setSelectedLayer('true_colour')
    }
  }, [historicalLock, selectedLayer, setSelectedLayer])

  if (!lakeLoading && isFetched && !lakeError && !lake) {
    return <Navigate to="/lakes" replace />
  }

  const observation = observationForCurrentCondition(observationQuery.data) ?? undefined
  const historyObservations = sortObservationsNewestFirst(observationsQuery.data ?? [])
  const latestScene = historyObservations[0] ?? observation ?? null
  const latestValid =
    latestValidObservation(historyObservations) ??
    (observation?.qualityLabel?.trim().toLowerCase() === 'valid' ? observation : null)
  const inspectedObservation = selectObservation(historyObservations, selectedObservationId)
  const historicalObservation = inspectedObservation != null
  const mapLayer = mapLayerWhileViewing(historicalObservation, selectedLayer)
  const chooseObservation = (observationId: string) => {
    commitObservationSelection(historyObservations, observationId)
  }
  const returnToLatest = () => {
    commitReturnToLatest()
  }
  const comparison = buildObservationComparison(historyObservations, compareIds)
  const hotspots = hotspotsQuery.data ?? []
  const series = seriesQuery.data

  const pageError =
    (lakeError as Error | null) ??
    (observationQuery.error as Error | null) ??
    (seriesQuery.error as Error | null)

  const pageLoading = lakeLoading || (!lake && !lakeError)

  if (pageLoading || pageError || !lake) {
    return (
      <DataStatePanel
        className="h-full"
        isLoading={pageLoading}
        error={pageError}
        isEmpty={!pageLoading && !pageError && !lake}
        emptyMessage="Water body not found."
      >
        {null}
      </DataStatePanel>
    )
  }

  const dateSelection = {
    observations: historyObservations,
    selectedObservationId,
    onSelectObservation: chooseObservation,
    onReturnToLatest: returnToLatest,
  }
  const dateMotionKey = selectedObservationId ?? 'latest'
  const workspaceHeader = (
    <div key={lake.id} className={cn('motion-context', lakePending && 'motion-pending')}>
      <LakeWorkspaceHeader lakeName={lake.name} province={lake.province} />
    </div>
  )
  const lakeMap = (
    <LakeMap
      lake={lake}
      layer={mapLayer}
      hotspots={hotspots}
      selectedHotspotId={selectedHotspotId}
      latestSceneDate={latestScene?.date ?? null}
      latestSceneQuality={latestScene ? observationQualityLabel(latestScene) : null}
      latestSceneCloud={latestScene?.cloudCover ?? null}
      latestValidDate={latestValid?.date ?? null}
      dateSelection={dateSelection}
      onSelectHotspot={setSelectedHotspotId}
    />
  )

  const chartBaseline =
    trendParameter === 'turbidity'
      ? (lake.baseline?.turbidity14MonthMean ?? null)
      : trendParameter === 'ndci'
        ? (lake.baseline?.ndci14MonthMean ?? null)
        : null
  const chartTrendLabel =
    trendParameter === 'turbidity'
      ? surfaceTrendLabel(lake.turbidityTrendLabel)
      : trendParameter === 'ndci'
        ? surfaceTrendLabel(lake.chlorophyllTrendLabel)
        : null

  const conditionPanel = (
    <LakeConditionPanel
      lake={lake}
      observation={observation}
      selectedObservation={inspectedObservation}
      observations={historyObservations}
    />
  )
  const historyPanel = (
    <ObservationHistory
      key={lake.id}
      observations={historyObservations}
      isLoading={observationsQuery.isLoading}
      error={(observationsQuery.error as Error | null) ?? null}
      selectedId={selectedObservationId}
      onSelect={chooseObservation}
      comparing={comparing}
      compareIds={compareIds}
      onComparingChange={(next) => {
        setComparing(next)
        if (!next && compareIds.length < 2) setCompareIds(clearComparisonSelection())
      }}
      onToggleCompare={(observationId) =>
        setCompareIds((current) => toggleComparisonSelection(current, observationId))
      }
      onClearComparison={() => {
        setCompareIds(clearComparisonSelection())
        setComparing(false)
      }}
      className="min-h-0 flex-1"
    />
  )
  const mappedSeries =
    historyObservations.length > 0
      ? mapObservationsToTimeSeries(lake.id, trendParameter, historyObservations)
      : null
  const chartSeries = mappedSeries
    ? {
        ...mappedSeries,
        annotations: series?.annotations?.length ? series.annotations : mappedSeries.annotations,
        threshold: series?.threshold ?? mappedSeries.threshold,
      }
    : series

  const temporalPanel = (
    <section
      ref={temporalPanelRef}
      className="relative flex min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-[var(--radius-surface)] bg-[var(--color-bg-panel)] shadow-[var(--shadow-surface)]"
      style={{
        height:
          temporalPanelHeight ??
          (comparison ? 'min(46vh, 27rem)' : 'var(--temporal-panel-height)'),
      }}
      aria-label="Water quality over time"
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize water quality over time"
        aria-valuemin={220}
        aria-valuenow={temporalPanelHeight ?? undefined}
        tabIndex={0}
        title="Drag to resize. Double-click to reset."
        className="absolute inset-x-0 top-0 z-10 flex h-2 cursor-ns-resize items-center justify-center"
        onPointerDown={(event) => {
          const panel = temporalPanelRef.current
          if (!panel) return
          event.preventDefault()
          const startY = event.clientY
          const startHeight = panel.getBoundingClientRect().height
          const handle = event.currentTarget
          handle.setPointerCapture(event.pointerId)
          const move = (pointerEvent: PointerEvent) => {
            setTemporalPanelHeight(
              resizeTemporalPanelHeight(
                startHeight,
                pointerEvent.clientY - startY,
                window.innerHeight,
              ),
            )
          }
          const end = (pointerEvent: PointerEvent) => {
            if (handle.hasPointerCapture(pointerEvent.pointerId)) {
              handle.releasePointerCapture(pointerEvent.pointerId)
            }
            handle.removeEventListener('pointermove', move)
            handle.removeEventListener('pointerup', end)
            handle.removeEventListener('pointercancel', end)
          }
          handle.addEventListener('pointermove', move)
          handle.addEventListener('pointerup', end)
          handle.addEventListener('pointercancel', end)
        }}
        onDoubleClick={() => setTemporalPanelHeight(null)}
        onKeyDown={(event) => {
          const panel = temporalPanelRef.current
          if (!panel) return
          const current = panel.getBoundingClientRect().height
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setTemporalPanelHeight(resizeTemporalPanelHeight(current, -32, window.innerHeight))
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            setTemporalPanelHeight(resizeTemporalPanelHeight(current, 32, window.innerHeight))
          } else if (event.key === 'Home') {
            event.preventDefault()
            setTemporalPanelHeight(null)
          }
        }}
      >
        <span className="h-0.5 w-8 rounded-full bg-[var(--border-float)]" aria-hidden="true" />
      </div>
      <div
        key={lake.id}
        className={cn(
          'motion-context flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          lakePending && 'motion-pending',
        )}
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden pt-1">
          <ParameterTrendChart
            series={chartSeries}
            parameter={trendParameter}
            timeRange={trendTimeRange}
            onParameterChange={setTrendParameter}
            onTimeRangeChange={setTrendTimeRange}
            baselineMean={chartBaseline}
            trendLabel={chartTrendLabel}
            selectedObservationId={selectedObservationId}
            onSelectObservation={chooseObservation}
            comparisonDates={
              comparison ? [comparison.leftDate, comparison.rightDate] : undefined
            }
            view={trendView}
            onViewChange={setTrendView}
            table={
              <div key={dateMotionKey} className="motion-date flex min-h-0 min-w-0 flex-1 flex-col">
                {historyPanel}
              </div>
            }
          />
        </div>
      </div>
    </section>
  )

  if (breakpoint === 'desktop') {
    return (
      <div className="flex h-full min-h-0 min-w-0 gap-1.5">
        <LakeWorkspaceFrame header={workspaceHeader} map={lakeMap} below={temporalPanel} />
        <RightInsightsPanel className="overflow-hidden rounded-[var(--radius-surface)] bg-[var(--color-bg-panel)] shadow-[var(--shadow-surface)]">
          <div className="panel-scroll flex h-full min-h-0 min-w-0 flex-col overflow-auto">
            <div key={lake.id} className={cn('motion-context', lakePending && 'motion-pending')}>
              <div key={dateMotionKey} className="motion-date">
                {conditionPanel}
              </div>
            </div>
          </div>
        </RightInsightsPanel>
      </div>
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-1.5 overflow-y-auto overflow-x-hidden">
      <div
        data-region="lake-map"
        className="relative h-[calc(52vh+2.75rem)] min-h-[280px] shrink-0 overflow-hidden rounded-[var(--radius-surface)] shadow-[var(--shadow-map)]"
      >
        {lakeMap}
        <div className="pointer-events-none absolute left-3 top-2.5 z-20">{workspaceHeader}</div>
      </div>
      {temporalPanel}
      <div className="min-w-0 overflow-hidden rounded-[var(--radius-surface)] bg-[var(--color-bg-panel)] shadow-[var(--shadow-surface)]">
        <div key={lake.id} className={cn('motion-context', lakePending && 'motion-pending')}>
          <div key={dateMotionKey} className="motion-date">
            {conditionPanel}
          </div>
        </div>
      </div>
    </div>
  )
}
