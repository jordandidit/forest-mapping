import { useEffect, useId, useRef, useState } from 'react'
import { useArcGISAuth } from '@/features/auth/hooks/useArcGISAuth'
import { cn } from '@/lib/cn'

function initials(name: string | null | undefined, username: string): string {
  const source = (name && name.trim()) || username
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function UserMenu() {
  const { user, isArcGisMode, signOut, status } = useArcGISAuth()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (!isArcGisMode || status !== 'authenticated' || !user) {
    return (
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-transparent text-2xs font-semibold text-[var(--color-text-secondary)] shadow-none"
        aria-label="User"
        role="img"
      >
        DN
      </div>
    )
  }

  const label = user.fullName || user.username

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-8 max-w-[10rem] items-center gap-2 rounded-full border border-transparent bg-transparent pl-0.5 pr-2 text-2xs font-semibold text-[var(--color-text-secondary)] shadow-none transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {user.thumbnailUrl ? (
          <img
            src={user.thumbnailUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-panel)]">
            {initials(user.fullName, user.username)}
          </span>
        )}
        <span className="hidden truncate sm:inline">{label}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[var(--color-bg-panel-elevated)] shadow-[var(--shadow-overlay)]"
        >
          <div className="border-b border-[var(--color-border-subtle)] px-3 py-2">
            <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
              {user.fullName || user.username}
            </p>
            <p className="truncate text-2xs text-[var(--color-text-muted)]">{user.username}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className={cn(
              'block w-full px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
            )}
            onClick={() => setOpen(false)}
          >
            Account
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-xs text-[var(--color-status-poor)] hover:bg-[var(--color-bg-hover)]"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
