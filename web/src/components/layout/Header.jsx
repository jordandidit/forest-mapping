import { Trees, Sun, Moon, CircleHelp, LogOut, UserRound } from 'lucide-react'
import { PROJECT } from '../../constants/status'
import { formatDateTime } from '../../utils/date'

export default function Header({
  theme,
  onToggleTheme,
  lastUpdated,
  user,
  onHelp,
  onLogout,
  mock,
  compact = false,
}) {
  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div
        className={`mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-3 md:px-4 ${
          compact ? 'py-1.5' : 'px-4 py-3 md:px-6'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`flex items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)] ${
              compact ? 'h-8 w-8' : 'h-10 w-10'
            }`}
          >
            <Trees className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1
              className={`truncate font-[family-name:var(--font-display)] font-semibold tracking-tight ${
                compact ? 'text-sm' : 'text-base md:text-lg'
              }`}
            >
              {PROJECT.title}
            </h1>
            {!compact ? (
              <p className="truncate text-xs muted md:text-sm">{PROJECT.shortSubtitle}</p>
            ) : null}
          </div>
          {mock ? (
            <span className="hidden rounded-full border border-[var(--amber)]/40 bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--amber)] sm:inline">
              Mock
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className={`hidden text-right muted lg:block ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <div>Updated</div>
            <div className="font-medium text-[var(--text)]">{formatDateTime(lastUpdated)}</div>
          </div>

          <button
            type="button"
            onClick={onHelp}
            className={`inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] ${
              compact ? 'h-8 w-8' : 'h-9 w-9'
            }`}
            aria-label="Understanding the indices"
            title="Understanding the indices"
          >
            <CircleHelp className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] ${
              compact ? 'h-8 w-8' : 'h-9 w-9'
            }`}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div
            className={`flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] ${
              compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
            }`}
          >
            <UserRound className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            <span className="max-w-[120px] truncate text-xs font-medium">
              {user?.username || (user?.authenticated ? 'Signed in' : 'Guest')}
            </span>
            {user?.authenticated && !mock ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
