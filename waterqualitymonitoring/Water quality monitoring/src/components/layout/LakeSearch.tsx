import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterBodies } from '@/features/lakes/hooks/use-water-bodies'
import { LakeSearchMenu } from '@/components/layout/LakeSearchMenu'
import { filterLakesByCondition } from '@/features/lakes/lake-condition-filter'
import {
  lakeSearchSelection,
  searchKeyAction,
  searchLakes,
} from '@/features/lakes/lake-search'
import { useUiStore } from '@/stores/ui-store'

export function LakeSearch() {
  const navigate = useNavigate()
  const { data: lakes = [], isLoading } = useWaterBodies()
  const query = useUiStore((state) => state.lakeSearchQuery)
  const setQuery = useUiStore((state) => state.setLakeSearchQuery)
  const conditionFilter = useUiStore((state) => state.lakeConditionFilter)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const results = searchLakes(filterLakesByCondition(lakes, conditionFilter), query)
  const visible = open && query.trim().length > 0

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function openResult(lakeId: string) {
    const selection = lakeSearchSelection(lakeId)
    navigate(selection.route)
    if (selection.clearQuery) setQuery('')
    if (selection.close) setOpen(false)
    setActiveIndex(0)
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <label className="sr-only" htmlFor="global-lake-search">
        Search lakes
      </label>
      <input
        id="global-lake-search"
        type="search"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          visible && results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined
        }
        placeholder="Search lakes..."
        autoComplete="off"
        value={query}
        className="h-8 w-44 xl:w-52 rounded-[var(--radius-control)] border border-transparent bg-transparent px-3 text-sm text-[var(--color-text-primary)] shadow-none transition-colors duration-[var(--transition-fast)] placeholder:text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true)
        }}
        onKeyDown={(event) => {
          const action = searchKeyAction({
            key: event.key,
            results,
            activeIndex,
            open: visible,
          })
          if (action.type === 'close') {
            event.preventDefault()
            setOpen(false)
          } else if (action.type === 'move') {
            event.preventDefault()
            setActiveIndex(action.index)
            setOpen(true)
          } else if (action.type === 'navigate') {
            event.preventDefault()
            openResult(action.lakeId)
          }
        }}
      />
      {visible ? (
        <LakeSearchMenu
          id={listId}
          query={query}
          results={results}
          activeIndex={activeIndex}
          loading={isLoading}
          onHighlight={setActiveIndex}
          onSelect={openResult}
        />
      ) : null}
    </div>
  )
}
