import type { WaterQualityObservation } from '@/domain/observation/types'
import { layerToRestore } from '@/features/map/historical-sentinel'
import { selectExistingObservation } from '@/features/observations/observation-explorer'
import { useUiStore } from '@/stores/ui-store'

/** Chart, history, and the nav date picker all write this one id. */
export function commitObservationSelection(
  observations: readonly WaterQualityObservation[],
  observationId: string,
): void {
  const next = selectExistingObservation(observations, observationId)
  if (!next) return
  const state = useUiStore.getState()
  useUiStore.setState({
    layerBeforeHistorical:
      state.selectedObservationId == null ? state.selectedLayer : state.layerBeforeHistorical,
    selectedLayer: 'true_colour',
    selectedObservationId: next,
  })
}

export function commitReturnToLatest(): void {
  const { layerBeforeHistorical } = useUiStore.getState()
  useUiStore.setState({
    layerBeforeHistorical: null,
    selectedObservationId: null,
    ...(layerBeforeHistorical ? { selectedLayer: layerToRestore(layerBeforeHistorical) } : {}),
  })
}
