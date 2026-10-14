import { useMatch } from 'react-router-dom'
import { ObservationDatePicker } from '@/features/observations/components/ObservationDatePicker'
import {
  commitObservationSelection,
  commitReturnToLatest,
} from '@/features/observations/commit-observation-selection'
import { sortObservationsNewestFirst } from '@/features/observations/history'
import { useWaterBody } from '@/features/lakes/hooks/use-water-body'
import { useObservations } from '@/features/water-quality/hooks/use-observations'
import { useUiStore } from '@/stores/ui-store'

/** Lake observation date picker in the top bar. Hidden off a lake route. */
export function NavDatePicker() {
  const match = useMatch({ path: '/lakes/:lakeId', end: false })
  const lakeId = match?.params.lakeId
  const { data: lake } = useWaterBody(lakeId)
  const observationsQuery = useObservations(lakeId ? lake : null)
  const selectedObservationId = useUiStore((state) => state.selectedObservationId)
  if (!lakeId) return null

  const observations = sortObservationsNewestFirst(observationsQuery.data ?? [])

  return (
    <ObservationDatePicker
      key={lakeId}
      observations={observations}
      selectedObservationId={selectedObservationId}
      onSelectObservation={(observationId) =>
        commitObservationSelection(observations, observationId)
      }
      onReturnToLatest={commitReturnToLatest}
    />
  )
}
