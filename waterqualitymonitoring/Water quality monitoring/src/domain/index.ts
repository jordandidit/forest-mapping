export type { Coordinates, BoundingBox, GeoJsonGeometry, MapBounds } from '@/domain/shared/geo'
export type {
  WaterBody,
  WaterBodyType,
  WaterBodyMetricsSnapshot,
  WaterBodyBaseline,
  WaterBodyTrendMeta,
  WaterBodyPreviousObservation,
} from '@/domain/water-body/types'
export type {
  WaterQualityStatus,
  TrendDirection,
  BloomRisk,
  WaterQualityParameter,
  MapLayerId,
  WaterQualityMetric,
  WaterQualityThreshold,
} from '@/domain/water-quality/types'
export type {
  ObservationQuality,
  ObservationUsability,
  SatelliteMission,
  WaterQualityObservation,
  ObservationAvailabilityItem,
  TimeSeriesPoint,
  TimeSeriesEventAnnotation,
  TimeRangeId,
  ParameterTimeSeries,
} from '@/domain/observation/types'
export type { Hotspot, HotspotConfidence, SamplingStation } from '@/domain/hotspot/types'
export type { SceneRecord } from '@/domain/scene/types'
export type { RasterRecord } from '@/domain/raster/types'
export type {
  AttentionLevel,
  AttentionMapLayer,
  AttentionSignal,
  AttentionSignalKind,
  EvidenceItem,
  EvidenceCategory,
  InterpretationStatement,
  InterpretationTone,
  LakeAttentionAssessment,
  LakeConditionInterpretation,
  ObservationQualityBlock,
} from '@/domain/intelligence'
export {
  assessLakeAttention,
  interpretLakeCondition,
  conditionTone,
} from '@/domain/intelligence'
