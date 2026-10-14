import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getAdminLinks,
  getCurrentUser,
  getFilteredObservations,
  getIndexGuide,
  getObservations,
  getOverlayInfo,
  getRunLog,
  isMockMode,
  listForestUnits,
  logout as apiLogout,
} from '../api/forestHealth'
import { filterForests, sortForests, summarizeForests, uniqueValues } from '../utils/filters'
import { monthsAgo } from '../utils/date'

const EMPTY_FILTERS = {
  search: '',
  province: '',
  district: '',
  forestGroup: '',
  status: '',
}

export function useForestDashboard() {
  const [authChecking, setAuthChecking] = useState(!isMockMode())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forests, setForests] = useState([])
  const [adminLinks, setAdminLinks] = useState([])
  const [indexGuide, setIndexGuide] = useState([])
  const [runLog, setRunLog] = useState([])
  const [overlay, setOverlay] = useState(null)
  const [user, setUser] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sortKey, setSortKey] = useState('risk')
  const [selectedId, setSelectedId] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [tab, setTab] = useState('overview')
  const [historyRange, setHistoryRange] = useState(14)
  const [historyMetric, setHistoryMetric] = useState('combined')
  const [selectedObs, setSelectedObs] = useState([])
  const [obsLoading, setObsLoading] = useState(false)
  const [tableScope, setTableScope] = useState('all')
  const [tableRows, setTableRows] = useState([])
  const obsAbort = useRef(null)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [units, links, guide, logs, ov] = await Promise.all([
        listForestUnits({ force: true }),
        getAdminLinks({ force: true }).catch(() => []),
        getIndexGuide({ force: true }).catch(() => []),
        getRunLog({ force: true }).catch(() => []),
        getOverlayInfo({ force: true }).catch(() => null),
      ])
      setForests(units)
      setAdminLinks(links)
      setIndexGuide(guide)
      setRunLog(logs)
      setOverlay(ov)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setAuthChecking(true)
    setError(null)
    try {
      if (isMockMode()) {
        setUser({ authenticated: true, username: 'mock.user', mock: true })
        await loadDashboardData()
        return
      }
      const me = await getCurrentUser()
      setUser(me)
      if (me?.authenticated) {
        await loadDashboardData()
      }
    } catch (err) {
      setUser({ authenticated: false })
      if (err.status !== 401) setError(err)
    } finally {
      setAuthChecking(false)
    }
  }, [loadDashboardData])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const filtered = useMemo(() => filterForests(forests, filters), [forests, filters])
  const sorted = useMemo(() => sortForests(filtered, sortKey), [filtered, sortKey])
  const summary = useMemo(() => summarizeForests(filtered), [filtered])

  const provinces = useMemo(() => uniqueValues(forests, 'province'), [forests])
  const districts = useMemo(() => {
    const source = filters.province
      ? forests.filter((f) => f.province === filters.province)
      : forests
    return uniqueValues(source, 'district')
  }, [forests, filters.province])
  const groups = useMemo(() => uniqueValues(forests, 'forestGroup'), [forests])
  const statuses = useMemo(() => uniqueValues(forests, 'status'), [forests])

  const selected = useMemo(
    () => forests.find((f) => f.unitId === selectedId) || null,
    [forests, selectedId],
  )

  useEffect(() => {
    if (selectedId && !filtered.some((f) => f.unitId === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setSelectedObs([])
      return
    }
    obsAbort.current?.abort()
    const controller = new AbortController()
    obsAbort.current = controller
    setObsLoading(true)
    getObservations(selectedId, { signal: controller.signal })
      .then((rows) => {
        if (!controller.signal.aborted) setSelectedObs(rows)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setSelectedObs([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setObsLoading(false)
      })
  }, [selectedId])

  useEffect(() => {
    let cancelled = false
    async function loadTable() {
      if (!user?.authenticated && !isMockMode()) {
        if (!cancelled) setTableRows([])
        return
      }
      if (tableScope === 'selected' && selectedId) {
        const rows = await getObservations(selectedId)
        if (!cancelled) setTableRows(rows)
        return
      }
      const rows = await getFilteredObservations({
        province: filters.province || undefined,
        district: filters.district || undefined,
      })
      const allowed = new Set(filtered.map((f) => f.unitId))
      if (!cancelled) setTableRows(rows.filter((r) => allowed.has(r.unitId)))
    }
    loadTable().catch(() => {
      if (!cancelled) setTableRows([])
    })
    return () => {
      cancelled = true
    }
  }, [tableScope, selectedId, filters.province, filters.district, filtered, user])

  const historyObs = useMemo(() => {
    let rows = selectedObs.filter((o) => o.quality === 'Valid' && o.obsDate)
    if (!historyRange || historyRange === 'all') return rows
    const from = monthsAgo(Number(historyRange))
    return rows.filter((o) => o.obsDate >= from)
  }, [selectedObs, historyRange])

  const lastUpdated = useMemo(() => {
    const ok = runLog.find((r) => r.status === 'success' || r.status === 'no_new_data' || r.status === 'partial')
    return ok?.finishedUtc || forests[0]?.updatedUtc || null
  }, [runLog, forests])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'province') next.district = ''
      return next
    })
  }, [])

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), [])

  const selectForest = useCallback((unitId) => {
    setSelectedId(unitId || null)
    // On the single-page layout, selecting a forest scopes the image list to that forest.
    if (unitId) setTableScope('selected')
    else setTableScope('all')
  }, [])

  const toggleCompare = useCallback((unitId) => {
    setCompareIds((prev) => {
      if (prev.includes(unitId)) return prev.filter((id) => id !== unitId)
      if (prev.length >= 4) return prev
      return [...prev, unitId]
    })
  }, [])

  const clearCompare = useCallback(() => setCompareIds([]), [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser({ authenticated: false })
    setForests([])
    setAdminLinks([])
    setIndexGuide([])
    setRunLog([])
    setOverlay(null)
    setSelectedId(null)
    setCompareIds([])
    setSelectedObs([])
    setTableRows([])
    setError(null)
  }, [])

  return {
    authChecking,
    loading,
    error,
    mock: isMockMode(),
    forests,
    filtered,
    sorted,
    summary,
    adminLinks,
    indexGuide,
    runLog,
    overlay,
    user,
    filters,
    setFilter,
    resetFilters,
    provinces,
    districts,
    groups,
    statuses,
    sortKey,
    setSortKey,
    selectedId,
    selected,
    selectForest,
    compareIds,
    toggleCompare,
    clearCompare,
    tab,
    setTab,
    historyRange,
    setHistoryRange,
    historyMetric,
    setHistoryMetric,
    historyObs,
    selectedObs,
    obsLoading,
    tableScope,
    setTableScope,
    tableRows,
    lastUpdated,
    logout,
    reload: loadDashboardData,
  }
}
