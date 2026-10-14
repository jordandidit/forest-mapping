/**
 * Inventory of water-quality methodology.
 * WATER-METHOD-05A and WATER-METHOD-05A.1. Documentation only — not a classifier.
 *
 * Numeric screening rules below were read from executable functions in
 * `Rwanda water quality monitoring.ipynb`. This module records them.
 * It does not classify a lake, an observation, or a raster.
 */

export const METHODOLOGY_REFERENCE_TYPES = [
  'pipeline-screening',
  'historical-baseline',
  'external-standard',
] as const

export type MethodologyReferenceType = (typeof METHODOLOGY_REFERENCE_TYPES)[number]

export interface MethodologySource {
  path: string
  detail: string
}

export interface MethodologyEntry {
  key: string
  displayName: string
  unit: string | null
  explanation: string
  referenceType: MethodologyReferenceType
  role: string
  /** Bounds only when a project source states them. */
  classes: { label: string; bounds: string }[] | null
  /** Labels the project records, without the rule that assigns them. */
  knownLabels: string[]
  source: MethodologySource
  caveats: string[]
}

export interface RasterBandInventory {
  /** 0-based BandIDs in the production rendering rule. */
  bandId: 0 | 1 | 2 | 3
  /** 1-based name published by the image service. */
  serviceBandName: 'Band_1' | 'Band_2' | 'Band_3' | 'Band_4'
  layerTitle: string
  interpretation: string
  referenceType: 'pipeline-screening'
  source: MethodologySource
}

export interface RemapClassBreak {
  outputValue: number
  inputMin: number
  inputMax: number
}

export interface UnverifiedMethodologyItem {
  topic: string
  lookedFor: string
  result: string
}

const waterBodyFields: MethodologySource = {
  path: 'src/data/arcgis/dto/water-body.dto.ts',
  detail: 'Production WaterBodies fields mapped into the app. Numeric class bounds are not in this file.',
}

const observationFields: MethodologySource = {
  path: 'src/data/arcgis/dto/observation.dto.ts',
  detail: 'Production observation fields. Quality is a pipeline label, not a frontend score.',
}

const authority: MethodologySource = {
  path: 'src/domain/intelligence/AUTHORITY.ts',
  detail: 'Pipeline owns classifications. React presents them and must not recreate thresholds.',
}

const webMapAudit: MethodologySource = {
  path: 'docs/audits/WATER-DATA-02A-sanitized.json',
  detail: 'Sanitized production Web Map audit (RW Water Quality Monitor - Map).',
}

/** Nightly GeoHub notebook. Cell indexes are 0-based. */
const pipelineNotebook = 'C:\\Users\\user\\Downloads\\Rwanda water quality monitoring.ipynb'

const pipelineRules: MethodologySource = {
  path: pipelineNotebook,
  detail:
    'Executable rules in cell 17: level, turbidity_fnu, chl_indicative, bloom_risk, derive, overall_status, status_note. Constants in cell 1.',
}

export const methodologyEntries: readonly MethodologyEntry[] = [
  {
    key: 'turbidity',
    displayName: 'Turbidity',
    unit: 'FNU',
    explanation:
      'turbidity_level is assigned only on a Valid observation by level(turbidity_fnu, TURBIDITY_LEVELS). level returns the first label whose upper bound is strictly greater than the value. turbidity_fnu is None when red reflectance is missing or <= 0; otherwise red is capped at 0.9 * 0.1641 and T = round(228.1 * R / (1 - R / 0.1641), 1).',
    referenceType: 'pipeline-screening',
    role: 'Pipeline screening class on the latest valid measurement. React does not assign the level.',
    classes: [
      { label: 'Low', bounds: 'turbidity_fnu < 10' },
      { label: 'Moderate', bounds: '10 <= turbidity_fnu < 25' },
      { label: 'High', bounds: '25 <= turbidity_fnu < 60' },
      { label: 'Very high', bounds: '60 <= turbidity_fnu < 1e9' },
    ],
    knownLabels: ['Low', 'Moderate', 'High', 'Very high'],
    source: pipelineRules,
    caveats: [
      'Cell 17 IndexGuide marks these FNU thresholds provisional and calls the estimate a semi-analytical Dogliotti conversion, not a laboratory measurement.',
      'The fixed-class map remap is a separate 7-class raster scale on red minus SWIR, not this FNU table.',
    ],
  },
  {
    key: 'ndci',
    displayName: 'NDCI',
    unit: null,
    explanation:
      'NDCI is (B5 - B4) / (B5 + B4). chlorophyll_level is level(ndci, CHLOROPHYLL_LEVELS), using the same strict upper-bound walk as turbidity. It is assigned only on a Valid observation. NDCI is not stored in mg/m³.',
    referenceType: 'pipeline-screening',
    role: 'Spectral index and the input to chlorophyll_level. React does not classify NDCI.',
    classes: [
      { label: 'Low', bounds: 'ndci < 0.02' },
      { label: 'Moderate', bounds: '0.02 <= ndci < 0.08' },
      { label: 'High', bounds: '0.08 <= ndci < 0.15' },
      { label: 'Very high', bounds: '0.15 <= ndci < 9' },
    ],
    knownLabels: ['Low', 'Moderate', 'High', 'Very high'],
    source: pipelineRules,
    caveats: [
      'Cell 17 IndexGuide marks these NDCI thresholds provisional.',
      'The clean-water stack keeps NDCI in [-1, 1] before the mean is taken, so the final bound of 9 is not reached in derive.',
      'The fixed-class chlorophyll remap is a separate 7-class raster scale.',
    ],
  },
  {
    key: 'chlorophyll-a',
    displayName: 'Chlorophyll-a',
    unit: 'mg/m³',
    explanation:
      'chl_mgm3 is chl_indicative(ndci): None when ndci is missing or ndci < 0.08; otherwise round(max(0, 14.039 + 86.115 * ndci + 194.325 * ndci²), 1). chlorophyll_level is the NDCI class above, not a separate mg/m³ class.',
    referenceType: 'pipeline-screening',
    role: 'Indicative concentration beside NDCI. React does not convert NDCI into mg/m³.',
    classes: null,
    knownLabels: [],
    source: pipelineRules,
    caveats: [
      'IndexGuide says the Mishra & Mishra (2012) curve is used only when NDCI >= 0.08, where the notebook says the curve is reliable.',
      'There is no separate Low/Moderate/High table on mg/m³.',
    ],
  },
  {
    key: 'bloom-risk',
    displayName: 'Bloom risk',
    unit: null,
    explanation:
      'bloom_risk(ndci, fai) uses NDCI and FAI. If ndci is None the result is None. Otherwise High when ndci >= 0.15; Elevated when ndci >= 0.08 or (fai is not None and fai > 0); otherwise Low. FAI in the water stack is B8 - (B4 + (B11 - B4) * 0.177778). Assigned only on a Valid observation.',
    referenceType: 'pipeline-screening',
    role: 'Pipeline screening label. React does not derive it.',
    classes: [
      { label: 'High', bounds: 'ndci >= 0.15' },
      { label: 'Elevated', bounds: 'ndci < 0.15 and (ndci >= 0.08 or fai > 0)' },
      { label: 'Low', bounds: 'ndci < 0.08 and (fai is None or fai <= 0)' },
    ],
    knownLabels: ['High', 'Elevated', 'Low'],
    source: pipelineRules,
    caveats: [
      'IndexGuide bloom reference is empty. It calls the flag a screening result from satellite reflectance, not a field measurement.',
      'FAI > 0 can set Elevated while NDCI is still below 0.08.',
      'The frontend mapper also recognizes the word moderate. bloom_risk does not return that word.',
    ],
  },
  {
    key: 'floating-vegetation',
    displayName: 'Floating vegetation',
    unit: '%',
    explanation:
      'floating_veg_pct is the share of clear lake pixels with scene class SCL = 4, times 100. In finalize_lakes, floating_veg_flag is "Yes" when (floating_veg_pct or 0) >= 10 (FLOATING_VEG_ALERT_PCT) and "No" otherwise. The current percent on WaterBodies is copied only from a Valid observation.',
    referenceType: 'pipeline-screening',
    role: 'Pipeline flag. React shows the stored percent and flag and does not set them.',
    classes: [
      { label: 'Yes', bounds: 'floating_veg_pct >= 10' },
      { label: 'No', bounds: 'floating_veg_pct is missing or < 10' },
    ],
    knownLabels: ['Yes', 'No'],
    source: {
      path: pipelineNotebook,
      detail: 'Cell 21 finalize_lakes assigns floating_veg_flag. Cell 1 sets FLOATING_VEG_ALERT_PCT = 10. Cell 17 derive computes floating_veg_pct.',
    },
    caveats: [
      'IndexGuide floating-vegetation reference is empty. Shoreline pixels can add a few percent on small lakes.',
      'There is no Low, Moderate, or High vegetation class.',
    ],
  },
  {
    key: 'lake-condition',
    displayName: 'Overall lake condition',
    unit: null,
    explanation:
      'overall_status checks in order. No last_obs_date and no last_check_date returns Pending. No last_obs_date but a last_check_date returns No recent data. days_since_obs > 45 (STALE_DAYS) returns No recent data. Poor when turbidity_level or chlorophyll_level is High or Very high, or bloom_risk is High. Fair when turbidity_level or chlorophyll_level is Moderate, or bloom_risk is Elevated, or floating_veg_pct >= 10. Otherwise Good. days_since_obs is (today − last clear-image date) in days. status_note is prose from the same fields, not a second classifier.',
    referenceType: 'pipeline-screening',
    role: 'Authoritative current condition. React displays the stored label and does not calculate it.',
    classes: [
      { label: 'Pending', bounds: 'no last_obs_date and no last_check_date' },
      {
        label: 'No recent data',
        bounds: 'no last_obs_date while last_check_date is set, or days_since_obs > 45',
      },
      {
        label: 'Poor',
        bounds: 'turbidity_level or chlorophyll_level is High or Very high, or bloom_risk is High',
      },
      {
        label: 'Fair',
        bounds:
          'turbidity_level or chlorophyll_level is Moderate, or bloom_risk is Elevated, or floating_veg_pct >= 10',
      },
      { label: 'Good', bounds: 'a clear image within 45 days that matches neither Poor nor Fair' },
    ],
    knownLabels: ['Good', 'Fair', 'Poor', 'No recent data', 'Pending'],
    source: pipelineRules,
    caveats: [
      'IndexGuide says screening status, not a regulatory classification, and describes No recent data as no clear image for 45 days. The executable test is days_since_obs > 45.',
      'status_rank is Good 1, Fair 2, Poor 3, and 0 for Pending and No recent data.',
    ],
  },
  {
    key: 'observation-quality',
    displayName: 'Observation quality',
    unit: null,
    explanation:
      'derive assigns quality only after coverage passes. Cloudy when the clear-pixel share is < 0.80 (clear < 1 - UNIT_MAX_CLOUD, default 0.20). Else Hazy or glint when classified water pixels >= 25 and clean water pixels are < 50% of those water pixels. Else Too few water pixels when clean water pixels < 25. Else Valid. Indices, FNU, NDCI classes, chlorophyll estimate, and bloom_risk are written only in the Valid branch. Clean water is SCL water (class 6) and B11 < 0.03.',
    referenceType: 'pipeline-screening',
    role: 'Pipeline label on an observation. The app does not score confidence from it.',
    classes: [
      { label: 'Cloudy', bounds: 'clear-pixel share < 0.80' },
      {
        label: 'Hazy or glint',
        bounds: 'classified water pixels >= 25 and clean water pixels < 0.5 × classified water pixels',
      },
      { label: 'Too few water pixels', bounds: 'clean water pixels < 25, after the haze test fails' },
      { label: 'Valid', bounds: 'none of the three limits above' },
    ],
    knownLabels: ['Valid', 'Cloudy', 'Hazy or glint', 'Too few water pixels'],
    source: pipelineRules,
    caveats: [
      'An observation row is not created when covered pixels are 0 or coverage is below the unit minimum: 0.60 of the lake, or 0.25 for a river-shaped unit (area / bounding box < 0.1).',
      'Only quality == "Valid" calls apply_obs, which copies current WaterBodies measurements.',
    ],
  },
  {
    key: 'turb_base',
    displayName: 'Turbidity historical baseline',
    unit: 'FNU',
    explanation:
      'turb_base is the unweighted mean of monthly mean turbidity, rounded to 2 decimals. Each month’s value is the running mean of Valid observations in that month. hist_dump keeps months whose index is less than 14 months behind the current month (HISTORY_MONTHS = 14).',
    referenceType: 'historical-baseline',
    role: 'Compared with current turbidity. Not an environmental standard and not the screening class.',
    classes: null,
    knownLabels: [],
    source: {
      path: pipelineNotebook,
      detail:
        'Cell 11 hist_add, hist_baseline, hist_dump. Cell 21 finalize_lakes sets turb_base and calls hist_add only for Valid observations.',
    },
    caveats: [
      'Not a regulatory threshold.',
      'hist_recent (mean of the previous 3 monthly means) is defined and is not what finalize_lakes stores in turb_base.',
    ],
  },
  {
    key: 'ndci_base',
    displayName: 'NDCI historical baseline',
    unit: null,
    explanation:
      'ndci_base is the unweighted mean of monthly mean NDCI, rounded to 4 decimals. The month series and 14-month retention are the same as turb_base. Only Valid observations are added.',
    referenceType: 'historical-baseline',
    role: 'Compared with current NDCI. Not an environmental standard and not the NDCI screening class.',
    classes: null,
    knownLabels: [],
    source: {
      path: pipelineNotebook,
      detail: 'Cell 11 hist_baseline. Cell 21 finalize_lakes sets ndci_base from hist_baseline(h, "ndci"). rnd defaults to 4 decimals.',
    },
    caveats: ['Not a regulatory threshold.'],
  },
]

/**
 * Percentile and trend fields already mapped for the current lake summary.
 * p-values are stored and are not interpreted.
 */
export const historicalContextFields = {
  referenceType: 'historical-baseline' as const,
  fields: [
    {
      key: 'turb_pctrank',
      explanation:
        'pct_rank of current turbidity_fnu against monthly mean turbidity: 100 × count(monthly means <= value) / n, rounded to 1 decimal. None when the value is missing or fewer than 3 months exist. Not computed in React.',
    },
    {
      key: 'ndci_pctrank',
      explanation:
        'Same percentile as turb_pctrank, using current ndci against monthly mean NDCI. None when ndci is missing or fewer than 3 months exist.',
    },
    {
      key: 'turb_trend',
      explanation: 'Pipeline turbidity trend label. Passed through.',
    },
    {
      key: 'chl_trend',
      explanation: 'Pipeline chlorophyll trend label. Passed through.',
    },
  ],
  source: {
    path: pipelineNotebook,
    detail:
      'Cell 11 pct_rank. Cell 21 finalize_lakes stores turb_pctrank and ndci_pctrank. Trend labels are still passed through from stored fields.',
  },
} as const

export const rasterBands: readonly RasterBandInventory[] = [
  {
    bandId: 0,
    serviceBandName: 'Band_1',
    layerTitle:
      'Turbidity · Fixed classes (absolute classes, the same for every water body so they can be compared): blue = clear water, red = muddy',
    interpretation:
      'Absolute turbidity classes for comparison across water bodies. Remap inputs are red-minus-SWIR breaks, separate from the FNU screening classes.',
    referenceType: 'pipeline-screening',
    source: webMapAudit,
  },
  {
    bandId: 1,
    serviceBandName: 'Band_2',
    layerTitle:
      'Chlorophyll · Fixed classes (absolute classes, the same for every water body so they can be compared): blue = little algae, red = bloom',
    interpretation:
      'Absolute chlorophyll classes. Remap inputs run across an index scale. The production legend states these are index classes, not calibrated laboratory units.',
    referenceType: 'pipeline-screening',
    source: webMapAudit,
  },
  {
    bandId: 2,
    serviceBandName: 'Band_3',
    layerTitle:
      'Turbidity · Per lake (each lake against its own 14-month record): grey = usual for this lake, blue = clearer than it usually is, red = more turbid than usual',
    interpretation:
      'Relative to that lake’s usual turbidity. Not direct FNU.',
    referenceType: 'pipeline-screening',
    source: webMapAudit,
  },
  {
    bandId: 3,
    serviceBandName: 'Band_4',
    layerTitle:
      'Chlorophyll · Per lake (each lake against its own 14-month record): grey = usual for this lake, blue = less algae than it usually has, red = more',
    interpretation:
      'Relative to that lake’s usual chlorophyll. Not mg/m³.',
    referenceType: 'pipeline-screening',
    source: webMapAudit,
  },
]

/** Fixed-class remap breaks copied from the production rendering rules. Not lake-status classes. */
export const rasterRemapBreaks = {
  turbidityFixedBandId: 0 as const,
  chlorophyllFixedBandId: 1 as const,
  turbidityFixed: [
    { outputValue: 1, inputMin: -0.05, inputMax: 0.00427 },
    { outputValue: 2, inputMin: 0.00427, inputMax: 0.008323 },
    { outputValue: 3, inputMin: 0.008323, inputMax: 0.019336 },
    { outputValue: 4, inputMin: 0.019336, inputMax: 0.034601 },
    { outputValue: 5, inputMin: 0.034601, inputMax: 0.065708 },
    { outputValue: 6, inputMin: 0.065708, inputMax: 0.10106 },
    { outputValue: 7, inputMin: 0.10106, inputMax: 1 },
  ] satisfies readonly RemapClassBreak[],
  chlorophyllFixed: [
    { outputValue: 1, inputMin: -1, inputMax: -0.02 },
    { outputValue: 2, inputMin: -0.02, inputMax: 0 },
    { outputValue: 3, inputMin: 0, inputMax: 0.02 },
    { outputValue: 4, inputMin: 0.02, inputMax: 0.05 },
    { outputValue: 5, inputMin: 0.05, inputMax: 0.08 },
    { outputValue: 6, inputMin: 0.08, inputMax: 0.15 },
    { outputValue: 7, inputMin: 0.15, inputMax: 1 },
  ] satisfies readonly RemapClassBreak[],
  source: webMapAudit,
} as const

/** No external standard in the repository names an authority and a source. */
export const externalStandards: readonly {
  key: string
  referenceType: 'external-standard'
  source: MethodologySource
}[] = []

export const methodologyGuardrails: readonly string[] = [
  'Satellite indicators in this project support monitoring. The notebook runs nightly Sentinel-2 water quality for Rwanda’s lakes and rivers.',
  'Screening classes, historical baselines, and cited papers stay separate. The notebook calls overall status a screening status, not a regulatory classification.',
  'NDCI is stored separately from indicative chlorophyll-a in mg/m³.',
  'Per-lake raster colors are relative to that lake’s 14-month record, not direct FNU or mg/m³.',
  'turb_base and ndci_base are means of monthly means over the retained 14-month window, not the FNU or NDCI screening classes.',
  'A non-valid observation is written to Observations and does not call apply_obs. React does not recalculate WaterBodies status.',
]

export interface PipelineCitation {
  topic: string
  citation: string
  where: string
}

/**
 * Method citations copied from the notebook IndexGuide and formulas.
 * They explain algorithm origin. They are not regulatory standards.
 */
export const pipelineCitations: readonly PipelineCitation[] = [
  {
    topic: 'Turbidity conversion',
    citation:
      'Dogliotti A.I. et al. (2015) Remote Sensing of Environment 156:157-168. Formula in the guide and in turbidity_fnu: T = 228.1 * R / (1 - R / 0.1641), R = red reflectance (B4, 665 nm). Thresholds marked provisional.',
    where: 'Notebook cell 17 IndexGuide TURBIDITY; cell 17 turbidity_fnu; cell 1 TURBIDITY_LEVELS',
  },
  {
    topic: 'NDCI',
    citation:
      'Mishra S., Mishra D.R. (2012) Remote Sensing of Environment 117:394-406. Formula: (B5 - B4) / (B5 + B4). Thresholds marked provisional.',
    where: 'Notebook cell 17 IndexGuide NDCI; cell 17 nd_raw("B5", "B4")',
  },
  {
    topic: 'Chlorophyll estimate',
    citation:
      'IndexGuide says indicative chlorophyll-a (mg/m³) uses the Mishra & Mishra (2012) curve only when NDCI >= 0.08. Executable: 14.039 + 86.115 * ndci + 194.325 * ndci², floored at 0.',
    where: 'Notebook cell 17 IndexGuide NDCI caveats; cell 17 chl_indicative; cell 1 CHL_ESTIMATE_MIN_NDCI = 0.08',
  },
  {
    topic: 'Bloom thresholds',
    citation:
      'IndexGuide BLOOM formula: High: NDCI >= 0.15; Elevated: NDCI >= 0.08 or FAI > 0. Reference field is empty.',
    where: 'Notebook cell 17 bloom_risk and IndexGuide BLOOM',
  },
  {
    topic: 'FAI',
    citation:
      'Hu C. (2009) Remote Sensing of Environment 113:2118-2129. IndexGuide formula B8 - (B4 + (B11 - B4) * 0.1778). Executable water_stack uses 0.177778.',
    where: 'Notebook cell 17 IndexGuide FAI; cell 17 water_stack',
  },
  {
    topic: 'NDTI',
    citation:
      'Lacaux et al. (2007) Remote Sensing of Environment 106:66-74. Formula: (B4 - B3) / (B4 + B3).',
    where: 'Notebook cell 17 IndexGuide NDTI',
  },
  {
    topic: 'Water masking',
    citation:
      'Clear pixels use scene classes 4, 5, 6, and 7. Clean water is scene class 6 and B11 < 0.03 (SWIR_MAX). IndexGuide says pixels with B11 >= 0.03 are excluded as haze or glint. No paper is cited for the mask.',
    where: 'Notebook cell 6 SCL table; cell 1 SWIR_MAX; cell 7 threshold01; cell 17 water_stack and clean_water_mask',
  },
  {
    topic: 'Classification thresholds and status',
    citation:
      'IndexGuide STATUS reference is empty. Caveat text: screening status, not a regulatory classification. Floating vegetation reference is empty; threshold text is >= 10% flagged.',
    where: 'Notebook cell 17 IndexGuide STATUS and FLOATING_VEG; cell 17 overall_status; cell 1 STALE_DAYS and FLOATING_VEG_ALERT_PCT',
  },
]

/** Control flow in the nightly writer. Descriptive only. */
export const currentMeasurementUpdate = {
  rule: 'Only a Valid observation updates current WaterBodies measurements.',
  controlFlow:
    'In run_monitoring, apply_obs and hist_add run only when obs["quality"] == "Valid" and the observation id is not already stored. apply_obs copies LATEST_KEYS (turbidity, NDCI, chlorophyll, bloom, FAI, floating vegetation percent, water percent, clear percent) when that date is newer than last_obs_date. An older Valid date can update previous-observation fields only. Non-valid rows are still appended to Observations. last_check_date and last_check_result update for any derived quality.',
  source: 'Notebook cell 21, functions run_monitoring and apply_obs',
} as const

export const unverifiedMethodology: readonly UnverifiedMethodologyItem[] = [
  {
    topic: 'Turbidity and chlorophyll trend labels',
    lookedFor: 'How turb_trend and chl_trend are assigned',
    result: 'Not read in this pass. The app still passes stored trend labels through.',
  },
  {
    topic: 'Older dashboard chart',
    lookedFor: 'Arcade clarity classes and a 0.1 High Bloom Risk guide in tmp-dashboard-water-quality.json',
    result: 'Not used. WaterBodies classes come from the notebook functions above.',
  },
]

export const methodologySources = [
  authority,
  waterBodyFields,
  observationFields,
  webMapAudit,
  pipelineRules,
] as const
