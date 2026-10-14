export default function EmptyState({ title, description, action = null }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      {description ? <p className="max-w-md text-sm muted">{description}</p> : null}
      {action}
    </div>
  )
}
