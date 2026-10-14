# WATER-METHOD-05A — Methodology inventory

Static notes for review. The Python notebook classifies. This inventory records rules read from executable notebook code in WATER-METHOD-05A.1. React does not calculate them.

Notebook: `C:\Users\user\Downloads\Rwanda water quality monitoring.ipynb`. Cell indexes are 0-based.

Screening classes, historical baselines, and cited papers are separate. The notebook calls overall status a screening status, not a regulatory classification. No WHO, Rwanda, legal, or safety limit is cited.

| Indicator | Value/range | Meaning | Reference type | Source |
|---|---|---|---|---|
| Turbidity | `turbidity_fnu < 10` Low; `10 <= value < 25` Moderate; `25 <= value < 60` High; `60 <= value < 1e9` Very high. `level()` uses the first strictly greater upper bound. | Pipeline screening class on a Valid observation. FNU from `T = 228.1 * R / (1 - R / 0.1641)`, red capped at `0.9 * 0.1641`. | pipeline-screening | Cell 1 `TURBIDITY_LEVELS`; cell 17 `turbidity_fnu`, `level`, `derive` |
| NDCI / chlorophyll level | `ndci < 0.02` Low; `< 0.08` Moderate; `< 0.15` High; `0.15 <= ndci < 9` Very high. | `chlorophyll_level` classifies NDCI, not mg/m³. Formula `(B5 - B4) / (B5 + B4)`. | pipeline-screening | Cell 1 `CHLOROPHYLL_LEVELS`; cell 17 `derive` |
| Chlorophyll-a | `None` when `ndci < 0.08`; else `round(max(0, 14.039 + 86.115 * ndci + 194.325 * ndci²), 1)` mg/m³ | Indicative concentration. No separate mg/m³ class. | pipeline-screening | Cell 17 `chl_indicative`; cell 1 `CHL_ESTIMATE_MIN_NDCI = 0.08` |
| Bloom risk | High if `ndci >= 0.15`. Elevated if `ndci >= 0.08` or `fai > 0`. Else Low. `None` if `ndci` is missing. | Uses NDCI and FAI. FAI is `B8 - (B4 + (B11 - B4) * 0.177778)`. | pipeline-screening | Cell 17 `bloom_risk`, `water_stack` |
| Floating vegetation | `floating_veg_flag = "Yes"` when `floating_veg_pct >= 10`, else `"No"`. | Percent is the clear-pixel share with SCL = 4. | pipeline-screening | Cell 21 `finalize_lakes`; cell 1 `FLOATING_VEG_ALERT_PCT = 10` |
| Overall condition | Pending: never checked. No recent data: checked but no clear image, or `days_since_obs > 45`. Poor: turbidity or chlorophyll High or Very high, or bloom High. Fair: either level Moderate, or bloom Elevated, or vegetation `>= 10`. Else Good. | Checked in that order. `status_note` is prose from the same fields. | pipeline-screening | Cell 17 `overall_status`, `status_note`; cell 1 `STALE_DAYS = 45`; cell 21 sets `days_since_obs` |
| Observation quality | Cloudy: clear share `< 0.80`. Hazy or glint: water pixels `>= 25` and clean pixels `< 50%` of water pixels. Too few water pixels: clean pixels `< 25`. Else Valid. | Indices and classes are written only on Valid. No observation when coverage is below 0.60, or 0.25 for a river-shaped unit. | pipeline-screening | Cell 17 `derive`; cell 1 `UNIT_MAX_CLOUD`, `HAZE_MIN_SHARE`, `MIN_WATER_PIXELS` |
| Current measurement update | `apply_obs` and `hist_add` run only when `quality == "Valid"` and the observation id is new. | Non-valid rows are stored as observations and do not replace current WaterBodies measurements. | pipeline-screening | Cell 21 `run_monitoring`, `apply_obs` |
| `turb_base`, `ndci_base` | Unweighted mean of monthly means. Turbidity rounded to 2 decimals; NDCI to 4. Window: months less than 14 behind the current month. | Historical baseline. Only Valid observations enter the month. | historical-baseline | Cell 11 `hist_add`, `hist_baseline`, `hist_dump`; cell 21 `finalize_lakes` |
| `turb_pctrank`, `ndci_pctrank` | `100 × count(monthly means <= current value) / n`. None if the value is missing or fewer than 3 months exist. | Rank of the current measurement against that lake’s monthly means. | historical-baseline | Cell 11 `pct_rank`; cell 21 `finalize_lakes` |
| Per-lake raster | Usual / clearer or less algae / more than usual | Relative to that lake’s 14-month record. Not FNU or mg/m³. | pipeline-screening | Web Map audit layer titles |
| Raster band 0 (`Band_1`) | Fixed turbidity remap, 7 classes | Red minus SWIR classes. Separate from the 4-class FNU screen. | pipeline-screening | Web Map audit `ExtractBand`; cell 17 `TURB_BREAKS` |
| Raster band 1 (`Band_2`) | Fixed chlorophyll remap, 7 classes | NDCI classes, not laboratory mg/m³. | pipeline-screening | Web Map audit `ExtractBand`; cell 17 `NDCI_BREAKS` |
| Raster band 2 (`Band_3`) | Per-lake turbidity | Relative turbidity. | pipeline-screening | Web Map audit `ExtractBand` |
| Raster band 3 (`Band_4`) | Per-lake chlorophyll | Relative chlorophyll. | pipeline-screening | Web Map audit `ExtractBand` |
| External standard | None | Cited papers document methods. They are not recorded as regulatory standards. | — | — |

## Citations recorded from the notebook

- Dogliotti A.I. et al. (2015) Remote Sensing of Environment 156:157-168 — turbidity conversion.
- Mishra S., Mishra D.R. (2012) Remote Sensing of Environment 117:394-406 — NDCI, and the indicative chlorophyll curve when NDCI `>= 0.08`.
- Hu C. (2009) Remote Sensing of Environment 113:2118-2129 — FAI. The guide prints `0.1778`; `water_stack` uses `0.177778`.
- Lacaux et al. (2007) Remote Sensing of Environment 106:66-74 — NDTI.
- Clean-water mask: SCL water (class 6) and B11 `< 0.03`. Clear pixels are SCL 4, 5, 6, and 7. No paper is cited for the mask.
- Bloom, floating vegetation, and overall status have an empty reference field.

## Still not recovered

- Assignment of `turb_trend` and `chl_trend`.
- `tmp-dashboard-water-quality.json` uses a different chart scale and is not the WaterBodies classifier.
