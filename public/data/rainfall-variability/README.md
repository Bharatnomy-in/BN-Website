# Rainfall variability by district, Maharashtra, 1971 to 2020 — Maharashtra

One row per district: average yearly rainfall over 1971-2020, its standard deviation, and the coefficient of variation (how much rainfall swings from year to year). Computed by Bharatnomy from IMD's daily gridded rainfall.

## Coverage

- **Rows:** 35
- **Period:** 1971 to 2020
- **Districts:** 35 of 36

## Source

- **Data:** India Meteorological Department (IMD), Pune. Daily rainfall on a 0.25 x 0.25 degree grid (Pai et al. 2014)
- **Link:** https://imdpune.gov.in/lrfindex.php (Gridded data: `Rainfall_25_Bin.html`)
- **Downloaded:** 28 Oct 2026
- **Built from:** the yearly totals in [`CLM_rainfall-indices_1951-to-2025_MH_BNY_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/CLM_rainfall-indices_1951-to-2025_MH_BNY_DIST/) (district averages over 2011 boundaries; method described there)
- **Script:** [`pipelines/imd-gridded/build_district_indices.py`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/pipelines/imd-gridded/build_district_indices.py)

## How it is computed

Over the 50 years 1971-2020 (IMD's long period average): mean, sample standard deviation, and coefficient of variation = standard deviation / mean x 100.

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | Maharashtra, 27 |
| `lgd_state_code` | text |  | Maharashtra, 27 |
| `district` | text |  | District, by its current name and LGD code |
| `lgd_district_code` | text |  | District, by its current name and LGD code |
| `district_census_code` | text |  | Census 2011 district code; the boundary used is the 2011 one |
| `period` | text |  | Years used, `1971-2020` |
| `rainfall_annual_mean_mm` | number | mm | Annual rainfall: mean and standard deviation (mm), coefficient of variation (%) |
| `rainfall_annual_sd_mm` | number | mm | Annual rainfall: mean and standard deviation (mm), coefficient of variation (%) |
| `rainfall_annual_cv_pct` | number | % | Annual rainfall: mean and standard deviation (mm), coefficient of variation (%) |
| `rainfall_jun_sep_mean_mm` | number | mm | The same for June-September rainfall |
| `rainfall_jun_sep_sd_mm` | number | mm | The same for June-September rainfall |
| `rainfall_jun_sep_cv_pct` | number | % | The same for June-September rainfall |
| `years` | integer |  | Number of years used (50) |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- `Thane` includes today's Palghar (2011 boundaries).
- Pune's variability (57%, against 18-34% elsewhere) is driven by one year: IMD's grid gives Pune 4,342 mm in 2005. See the note in `CLM_rainfall-indices_*`.

## Where this comes from

- Warehouse folder [`CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST.csv`, `CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST.json`.
