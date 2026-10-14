export default function Select({ label, value, onChange, options, placeholder = 'All', className = '', id }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || undefined
  const compact = !label
  return (
    <label
      className={`flex flex-col ${compact ? '' : 'gap-1'} text-xs muted ${
        className.includes('min-w-0') || className.includes('flex-1') ? 'min-w-0' : 'min-w-[140px]'
      } ${className}`}
    >
      {label ? <span>{label}</span> : null}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] ${
          compact
            ? 'h-[34px] rounded-lg px-2.5 text-xs'
            : 'h-9 rounded-xl px-3 text-sm'
        }`}
      >
        {placeholder !== '' ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => {
          const v = typeof opt === 'string' ? opt : opt.value
          const labelText = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={v} value={v}>
              {labelText}
            </option>
          )
        })}
      </select>
    </label>
  )
}
