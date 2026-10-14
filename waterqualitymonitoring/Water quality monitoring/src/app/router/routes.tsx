import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/layouts/AppShell'
import { LakeMonitorLayout } from '@/app/layouts/LakeMonitorLayout'
import { LakesIndexPage } from '@/features/lakes/pages/LakesIndexPage'
import { LakeOverviewPage } from '@/features/lakes/pages/LakeOverviewPage'
import { LakeSectionPlaceholderPage } from '@/features/lakes/pages/LakeSectionPlaceholderPage'
import { ObservationsPage } from '@/features/observations/pages/ObservationsPage'
import { AlertsPage } from '@/features/alerts/pages/AlertsPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { DEFAULT_LAKE_ID } from '@/data/mock/lakes'
import { OAUTH_CALLBACK_PATH } from '@/data/arcgis/config'

function OAuthCallbackPage() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-[var(--color-bg-app)] px-6">
      <p className="text-sm text-[var(--color-text-muted)]">
        Completing ArcGIS Enterprise sign-in…
      </p>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={OAUTH_CALLBACK_PATH} element={<OAuthCallbackPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={`/lakes/${DEFAULT_LAKE_ID}`} replace />} />
        <Route path="lakes" element={<LakesIndexPage />} />
        <Route path="lakes/:lakeId" element={<LakeMonitorLayout />}>
          <Route index element={<LakeOverviewPage />} />
          <Route
            path="quality"
            element={
              <LakeSectionPlaceholderPage
                title="Water quality analysis"
                description="Detailed parameter analysis will be expanded in a later phase."
              />
            }
          />
          <Route
            path="satellite"
            element={
              <LakeSectionPlaceholderPage
                title="Satellite observation explorer"
                description="Scene browser and band composites will connect to Sentinel observations later."
              />
            }
          />
          <Route
            path="trends"
            element={
              <LakeSectionPlaceholderPage
                title="Historical trends"
                description="Extended multi-year analysis workspace placeholder."
              />
            }
          />
          <Route
            path="hotspots"
            element={
              <LakeSectionPlaceholderPage
                title="Hotspots"
                description="Dedicated hotspot investigation view placeholder."
              />
            }
          />
          <Route
            path="field-data"
            element={
              <LakeSectionPlaceholderPage
                title="Field sampling"
                description="In-situ measurements will appear here once field APIs are connected."
              />
            }
          />
          <Route
            path="reports"
            element={
              <LakeSectionPlaceholderPage
                title="Lake reports"
                description="Generated lake reports placeholder."
              />
            }
          />
        </Route>
        <Route path="observations" element={<ObservationsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to={`/lakes/${DEFAULT_LAKE_ID}`} replace />} />
      </Route>
    </Routes>
  )
}
