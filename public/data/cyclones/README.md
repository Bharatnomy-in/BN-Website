# Cyclones and depressions crossing each district, 1982 to 2025 — Maharashtra

For every district and year: how many depressions and cyclones passed over it, how many of them were at cyclone strength (or stronger) while doing so, and the strongest wind. Computed by Bharatnomy from IMD's best tracks.

## Coverage

- **Rows:** 1,540
- **Period:** 1982 to 2025
- **Districts:** 35 of 36

## Source

- **Data:** India Meteorological Department (IMD), RSMC New Delhi, best tracks of cyclonic disturbances over the North Indian Ocean, as cleaned in [`CLM_cyclone-best-tracks_1982-to-2026_IN_IMD`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/CLM_cyclone-best-tracks_1982-to-2026_IN_IMD/)
- **Link:** https://rsmcnewdelhi.imd.gov.in/report.php?internal_menu=MzM=
- **Downloaded:** 12 Nov 2026
- **District boundaries:** Census 2011 district map from DataMeet (see [`_sources/datameet-maps/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/datameet-maps/))
- **Script:** [`pipelines/imd-rsmc/build_district_cyclones.py`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/pipelines/imd-rsmc/build_district_cyclones.py)

## How it is computed

- Each system's track points (every 3 or 6 hours) are joined by straight lines. A system **crosses** a district if its track line touches the district's 2011 boundary.
- The strength of each track segment is the higher maximum sustained wind of its two ends; a district gets the strongest segment that touches it.
- Thresholds are IMD's grades: cyclonic storm 34 kt or more, severe cyclonic storm 48 kt, very severe 64 kt (1 kt = 1.852 km/h).

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | Place (2011 boundary; today's name and LGD code) |
| `lgd_state_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `district` | text |  | Place (2011 boundary; today's name and LGD code) |
| `lgd_district_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `district_census_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `year` | text |  | Calendar year |
| `systems_crossing` | integer |  | Depressions, deep depressions and cyclones whose track crossed the district |
| `cyclonic_storms_crossing_34kt` | integer |  | Of these, systems at cyclonic-storm strength (34 kt or more) on a segment touching the district |
| `severe_cyclonic_storms_crossing_48kt` | integer |  | Same, 48 kt or more |
| `very_severe_cyclonic_storms_crossing_64kt` | integer |  | Same, 64 kt or more |
| `max_wind_over_district_kt` | integer | knots | Highest maximum sustained wind on a track segment touching the district, knots. Blank if no system crossed (or the crossing points have no wind value) |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- **Our calculation, not an IMD table.** It counts the storm centre's path only; districts brushed by a storm's rain or wind field without the centre passing over them get 0. A straight line between 3-6 hourly positions is an approximation of the real path.
- Taking the higher wind of a segment's two ends overstates strength for a segment that starts at sea and ends inland (e.g. the first inland district after landfall). Read the strength columns as "up to".
- Covers only systems from the Bay of Bengal and Arabian Sea (and those formed over land) that IMD tracked; western disturbances and local thunderstorms are not in the best tracks.
- 2026 is left out (IMD marks it tentative). Districts with no crossing in a year have 0.
- Two 2011 districts have no `lgd_district_code` (same as in other 2011-boundary datasets).
- Checks (12 Nov 2026): 28,160 rows = 640 districts x 44 years; no duplicate keys; 2,219 district-years with at least one crossing.

## Where this comes from

- Warehouse folder [`CLM_cyclone-crossings_1982-to-2025_STATES_BNY_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/CLM_cyclone-crossings_1982-to-2025_STATES_BNY_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `CLM_cyclone-crossings_1982-to-2025_MH_BNY_DIST.csv`, `CLM_cyclone-crossings_1982-to-2025_MH_BNY_DIST.json`.
