# Forest cover by district, 2023 — Maharashtra

Forest cover by canopy density for 750 districts, plus a `State total` row per state. Forest cover = land of 1 ha or more with tree canopy density of at least 10%.

## Coverage

- **Rows:** 36
- **Period:** 2023
- **Districts:** 36 of 36
- 1 state-total row(s) from the warehouse table are left out; add up district rows instead.

## Source

- **Data:** Forest Survey of India (FSI), MoEFCC, *India State of Forest Report 2023*, Volume II, Table 10.x.3 of each state chapter
- **Link:** https://fsi.nic.in/forest-report-2023
- **Downloaded:** 19 Oct 2026
- **Original file:** [`_sources/fsi-isfr/raw/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/fsi-isfr/raw/)

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | State or Union Territory |
| `lgd_state_code` | text |  | State/UT code in the Local Government Directory (LGD), from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv). Blank for All India and for old units LGD no longer lists |
| `district` | text |  | District as spelled in the report. `State total` = the state's published total |
| `lgd_district_code` | text |  | District code in the Local Government Directory (LGD), from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv). Blank for totals and names that could not be matched |
| `geographical_area_sq_km` | number | km² | District area, sq km |
| `very_dense_forest_sq_km` | number | km² | Canopy density 70% and above, sq km |
| `moderately_dense_forest_sq_km` | number | km² | Canopy density 40% to under 70%, sq km |
| `open_forest_sq_km` | number | km² | Canopy density 10% to under 40%, sq km |
| `forest_cover_total_sq_km` | number | km² | Very dense + moderately dense + open forest, sq km |
| `forest_cover_pct_of_area` | number |  | Forest cover as % of geographical area |
| `change_since_2021_sq_km` | number | km² | Change in forest cover since the 2021 assessment, sq km (can be negative) |
| `scrub_sq_km` | number | km² | Canopy density under 10%, sq km (not forest cover) |
| `source_marks` | text |  | `district:H` = hill district; `district:**` = marked `**` in the report (no reason given) |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- `lgd_state_code` and `lgd_district_code` added on 5 Nov 2026 from the LGD directory (see [`_reference/README.md`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/README.md)). LGD codes identify today's state or district; for years before a split (Telangana 2014, Ladakh 2019, new districts) the same code covers a larger area than it does now.

## Where this comes from

- Warehouse folder [`ENV_forest-cover_2023_STATES_FSI_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/ENV_forest-cover_2023_STATES_FSI_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `ENV_forest-cover_2023_MH_FSI_DIST.csv`, `ENV_forest-cover_2023_MH_FSI_DIST.json`.
