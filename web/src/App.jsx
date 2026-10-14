import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/layout/Header'
import KpiCards from './components/forest/KpiCards'
import ForestSidePanel from './components/forest/ForestSidePanel'
import ImagesList from './components/forest/ImagesList'
import IndexGuideModal from './components/forest/IndexGuideModal'
import ForestMap from './components/map/ForestMap'
import EmptyState from './components/ui/EmptyState'
import Skeleton from './components/ui/Skeleton'
import { useTheme } from './hooks/useTheme'
import { useForestDashboard } from './hooks/useForestDashboard'
import { beginOAuthLogin, isMockMode } from './api/forestHealth'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const dash = useForestDashboard()
  const [helpOpen, setHelpOpen] = useState(false)
  /** Satellite image shown on the centre map — independent of left forest selection. */
  const [mapImage, setMapImage] = useState(null)
  const [oauthError, setOauthError] = useState(null)
  const oauthStarted = useRef(false)

  const needsLogin = useMemo(() => {
    if (isMockMode()) return false
    if (dash.authChecking) return false
    return !dash.user?.authenticated
  }, [dash.user, dash.authChecking])

  useEffect(() => {
    if (!needsLogin || oauthStarted.current) return
    oauthStarted.current = true
    try {
      beginOAuthLogin()
    } catch (err) {
      setOauthError(err?.message || 'Could not start GeoHub OAuth')
    }
  }, [needsLogin])

  const handleSelectForest = (unitId) => {
    setMapImage(null)
    dash.selectForest(unitId)
  }

  const handleBackToList = () => {
    setMapImage(null)
    dash.selectForest(null)
  }

  const handleSelectImage = (row) => {
    // Second click on the same image clears it and returns the map to forest / overview.
    setMapImage((prev) => (prev?.id === row.id ? null : row))
  }

  if (dash.authChecking || needsLogin) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[var(--bg)] px-4 text-center text-sm muted">
        <span>{dash.authChecking ? 'Checking session…' : 'Redirecting to GeoHub…'}</span>
        {oauthError ? (
          <p className="max-w-md rounded-xl border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2 text-[var(--danger)]">
            {oauthError}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        lastUpdated={dash.lastUpdated}
        user={dash.user}
        onHelp={() => setHelpOpen(true)}
        onLogout={dash.logout}
        mock={dash.mock}
        compact
      />

      <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-1.5 overflow-hidden px-2.5 py-1.5 md:px-3 md:py-2">
        {dash.error && !dash.loading ? (
          <div className="surface shrink-0 border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] p-3">
            <EmptyState
              title={
                dash.error.code === 'SERVICE_URL_MISSING'
                  ? 'Service unavailable'
                  : dash.error.code === 'AUTH_FAILED'
                    ? 'Authentication failed'
                    : 'Unable to load forest health data'
              }
              description={dash.error.message}
              action={
                <button
                  type="button"
                  onClick={dash.reload}
                  className="mt-2 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-sm text-white"
                >
                  Retry
                </button>
              }
            />
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-hidden xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.4fr)_minmax(260px,0.8fr)]">
          <aside className="min-h-0 overflow-hidden xl:h-full">
            <ForestSidePanel
              forests={dash.sorted}
              selectedForest={dash.selected}
              onSelect={handleSelectForest}
              onBack={handleBackToList}
              search={dash.filters.search}
              onSearchChange={(v) => dash.setFilter('search', v)}
              statusFilter={dash.filters.status}
              onStatusFilter={(v) => dash.setFilter('status', v)}
              summary={dash.summary}
              filters={dash.filters}
              setFilter={dash.setFilter}
              resetFilters={dash.resetFilters}
              provinces={dash.provinces}
              districts={dash.districts}
              groups={dash.groups}
              historyObs={dash.historyObs}
              historyMetric={dash.historyMetric}
              onHistoryMetricChange={dash.setHistoryMetric}
              historyRange={dash.historyRange}
              onHistoryRangeChange={dash.setHistoryRange}
              historyLoading={dash.obsLoading}
            />
          </aside>

          <div className="flex min-h-0 flex-col gap-1.5 overflow-hidden">
            <div className="shrink-0">
              <KpiCards summary={dash.summary} loading={dash.loading} />
            </div>

            {dash.loading ? (
              <Skeleton className="min-h-0 flex-1" />
            ) : (
              <ForestMap
                forests={dash.filtered}
                selectedId={dash.selectedId}
                selectedObs={mapImage}
                onSelect={handleSelectForest}
                filters={dash.filters}
                fill
              />
            )}
          </div>

          <aside className="min-h-0 overflow-hidden xl:h-full">
            <ImagesList
              rows={dash.tableRows}
              selectedObsId={mapImage?.id}
              onSelect={handleSelectImage}
              forestName={dash.selected?.name}
              tableScope={dash.tableScope}
              onScopeChange={dash.setTableScope}
              hasSelection={Boolean(dash.selectedId)}
            />
          </aside>
        </div>
      </main>

      <IndexGuideModal open={helpOpen} onClose={() => setHelpOpen(false)} guide={dash.indexGuide} />
    </div>
  )
}
