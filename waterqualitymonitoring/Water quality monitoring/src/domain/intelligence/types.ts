/**
 * Scientific authority boundary for lake condition intelligence.
 *
 * PYTHON MONITORING PIPELINE owns:
 * - water-quality calculations
 * - observation validity / quality classification
 * - turbidity / chlorophyll / bloom-risk / vegetation classifications
 * - overall lake status and status_note
 * - trend classifications produced by the pipeline
 *
 * REACT FRONTEND owns:
 * - presentation and sentence composition
 * - formatting
 * - arithmetic comparisons (current vs 14-month mean, vs previous observation)
 * - progressive disclosure and evidence traceability
 *
 * React must NOT independently reproduce environmental thresholds or
 * reclassify lake status, bloom risk, chlorophyll level, turbidity level,
 * or observation quality.
 */

export type InterpretationTone =
  | 'positive'
  | 'neutral'
  | 'watch'
  | 'concern'
  | 'unknown'

/** Provenance grouping for evidence disclosure (user-facing categories). */
export type EvidenceCategory =
  | 'pipeline_classification'
  | 'measurement'
  | 'historical_context'
  | 'observation'

export type EvidenceItem = {
  id: string
  label: string
  value?: string | number | null
  unit?: string | null
  category: EvidenceCategory
  /** Domain-oriented source path for developer/debug (not shown in normal UI). */
  sourceField: string
  observationDate?: string | null
}

export type InterpretationStatement = {
  id: string
  title: string
  detail?: string
  tone: InterpretationTone
  evidence: EvidenceItem[]
}

export type LakeConditionBlock = {
  /** Authoritative pipeline status label (e.g. Fair). Pass-through only. */
  status: string | null
  /** Concise frontend summary: present / explain / compare — not reclassify. */
  summary: string
  /** Authoritative pipeline status_note when present. */
  note?: string | null
}

/**
 * Observation quality from the pipeline — not a frontend confidence score.
 */
export type ObservationQualityBlock = {
  /** Authoritative quality label (Valid, Cloudy, Hazy or glint, …). */
  qualityLabel: string | null
  /** Plain-language explanation of that label + quantitative context. */
  qualityExplanation: string
  /** The quantitative context behind the explanation, for compact display. Null when unavailable. */
  qualityFacts: {
    clearPct: number | null
    daysSinceObservation: number | null
    observationDate: string | null
    observationCount14Month: number | null
  }
  evidence: EvidenceItem[]
}

/**
 * Attention kinds — sentences composed from pipeline labels, not new classes.
 * WATER-INTEL-03B
 */
export type AttentionSignalKind =
  | 'turbidity'
  | 'chlorophyll'
  | 'bloom'
  | 'vegetation'
  | 'trend'
  | 'recency'

/**
 * UI prioritization weight only — never present as a scientific severity class.
 * Prefer ordering + restrained markers in the UI; do not label these as risk tiers.
 */
export type AttentionLevel = 'info' | 'watch' | 'attention'

/** Existing map mode for a turbidity or chlorophyll attention item. */
export type AttentionMapLayer = 'turbidity' | 'ndci'

export type AttentionSignal = {
  id: string
  kind: AttentionSignalKind
  title: string
  summary: string
  /** UI prominence only — not an environmental classification. */
  level: AttentionLevel
  evidence: EvidenceItem[]
  source: 'pipeline' | 'historical_comparison' | 'observation_metadata'
  /** Deterministic sort key (lower first). UI concern only. */
  order: number
  relatedMapLayer?: AttentionMapLayer | null
}

export type LakeAttentionAssessment = {
  signals: AttentionSignal[]
  hasAttentionSignals: boolean
  /** Date of the latest valid water-quality observation used for condition signals. */
  evidenceDate: string | null
  emptyStateMessage: string | null
}

export type LakeConditionInterpretation = {
  condition: LakeConditionBlock
  signals: InterpretationStatement[]
  changes: InterpretationStatement[]
  observationQuality: ObservationQualityBlock
  /** WATER-INTEL-03B — what deserves investigation attention. */
  attention: LakeAttentionAssessment
  generatedFrom: {
    /** Date of the latest observation used for quality context (date-only). */
    latestObservationDate: string | null
    fields: string[]
  }
}

export type InterpretLakeConditionInput = {
  waterBody: import('@/domain/water-body/types').WaterBody
  latestObservation?: import('@/domain/observation/types').WaterQualityObservation | null
}

/** @deprecated Use ObservationQualityBlock — retained name alias during rename. */
export type ObservationConfidenceBlock = ObservationQualityBlock
