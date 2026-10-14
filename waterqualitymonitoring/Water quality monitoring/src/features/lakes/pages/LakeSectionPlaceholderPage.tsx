import { Link, useParams } from 'react-router-dom'
import { getLakeById } from '@/data/mock/lakes'

interface LakeSectionPlaceholderPageProps {
  title: string
  description: string
}

export function LakeSectionPlaceholderPage({
  title,
  description,
}: LakeSectionPlaceholderPageProps) {
  const { lakeId = '' } = useParams()
  const lake = getLakeById(lakeId)

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          {lake?.name ?? 'Lake'} · Coming soon
        </p>
        <h1 className="mt-2 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p>
        <Link
          to={`/lakes/${lakeId}`}
          className="mt-4 inline-flex text-xs text-[var(--color-accent)] hover:underline"
        >
          ← Back to lake overview
        </Link>
      </div>
    </div>
  )
}
