import { formatDate } from '../../utils/date'
import { formatHa, formatNumber, formatPct, formatSigned } from '../../utils/format'
import StatusBadge from '../ui/StatusBadge'

/**
 * Measurements strip under the map — NDVI / NDMI / NBR and related notes
 * for the active forest or the clicked satellite image.
 */
export default function ForestMeasurements({ forest, observation }) {
  if (!forest && !observation) {
    return (
      <div className="surface px-4 py-3 text-xs muted">
        Select a forest on the left, or an image on the right, to see NDVI, NDMI, NBR and related
        measurements here.
      </div>
    )
  }

  const name = observation?.forestName || forest?.name
  const status = forest?.status
  const ndvi = observation?.ndvi ?? forest?.ndvi
  const ndmi = observation?.ndmi ?? forest?.ndmi
  const nbr = observation?.nbr ?? forest?.nbr
  const date = observation?.obsDate || forest?.lastObservationDate

  return (
    <div className="surface space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{name}</h3>
        {status ? <StatusBadge status={status} size="sm" /> : null}
        {observation?.quality ? (
          <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] muted">
            Image {observation.quality}
          </span>
        ) : null}
        {date ? <span className="text-[11px] muted">{formatDate(date)}</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="NDVI" hint="Greenness" value={formatNumber(ndvi, 3)} />
        <Metric label="NDMI" hint="Moisture" value={formatNumber(ndmi, 3)} />
        <Metric label="NBR" hint="Disturbance" value={formatNumber(nbr, 3)} />
        <Metric
          label="NDVI anom."
          hint="Vs 14-month mean"
          value={formatSigned(forest?.ndviAnomaly)}
        />
        <Metric
          label="NBR drop"
          hint="Recent decline"
          value={formatNumber(forest?.nbrDrop, 3)}
        />
        <Metric
          label={observation ? 'Clear %' : 'Area'}
          hint={observation ? 'Cloud-free' : 'Hectares'}
          value={
            observation
              ? formatPct(observation.clearPercent)
              : formatHa(forest?.areaHa)
          }
        />
      </div>

      {forest?.statusNote ? (
        <p className="text-[11px] leading-relaxed muted">{forest.statusNote}</p>
      ) : observation?.meaning ? (
        <p className="text-[11px] leading-relaxed muted">{observation.meaning}</p>
      ) : (
        <p className="text-[11px] muted">
          NDVI = canopy greenness · NDMI = moisture stress · NBR = burn / clear-cut sensitivity
        </p>
      )}
    </div>
  )
}

function Metric({ label, hint, value }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-2.5 py-2">
      <div className="text-[10px] font-medium muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value ?? '—'}</div>
      {hint ? <div className="mt-0.5 text-[10px] muted">{hint}</div> : null}
    </div>
  )
}
