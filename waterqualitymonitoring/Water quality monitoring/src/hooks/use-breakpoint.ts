import { useEffect, useState } from 'react'

export type AppBreakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Single active breakpoint so expensive views (MapView) mount once.
 * Matches Tailwind md (768) / lg (1024).
 */
export function useBreakpoint(): AppBreakpoint {
  const [breakpoint, setBreakpoint] = useState<AppBreakpoint>(() =>
    readBreakpoint(),
  )

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const tablet = window.matchMedia('(min-width: 768px)')

    const update = () => {
      setBreakpoint(readBreakpoint(desktop, tablet))
    }

    update()
    desktop.addEventListener('change', update)
    tablet.addEventListener('change', update)
    return () => {
      desktop.removeEventListener('change', update)
      tablet.removeEventListener('change', update)
    }
  }, [])

  return breakpoint
}

function readBreakpoint(
  desktop?: MediaQueryList,
  tablet?: MediaQueryList,
): AppBreakpoint {
  if (typeof window === 'undefined') return 'desktop'
  const d = desktop ?? window.matchMedia('(min-width: 1024px)')
  const t = tablet ?? window.matchMedia('(min-width: 768px)')
  if (d.matches) return 'desktop'
  if (t.matches) return 'tablet'
  return 'mobile'
}
