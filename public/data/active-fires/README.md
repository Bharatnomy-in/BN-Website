# Satellite fire detections by district, 2001 to 2025 — Maharashtra

One row per district per year: number of vegetation fires detected by NASA's MODIS satellites (Terra and Aqua), in total and by season. Used as a measure of crop-residue and forest burning. Counted by Bharatnomy from NASA FIRMS.

## Coverage

- **Rows:** 875
- **Period:** 2001 to 2025
- **Districts:** 35 of 36

## Source

- **Data:** NASA Fire Information for Resource Management System (FIRMS), MODIS Collection 6.1 active fire detections (1 km), India country files
- **Link:** https://firms.modaps.eosdis.nasa.gov/country/ (files `data/country/modis/<year>/modis_<year>_India.csv`)
- **Downloaded:** 5 Nov 2026
- **District boundaries:** Census 2011 district map from DataMeet (see [`_sources/datameet-maps/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/datameet-maps/))
- **Original files:** [`_sources/nasa-firms/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/nasa-firms/) (not committed, 31 MB; `pipelines/nasa-firms/fetch_firms.sh` downloads them)
- **Script:** [`pipelines/nasa-firms/build_district_fires.py`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/pipelines/nasa-firms/build_district_fires.py)

## How it is computed

Each detection of type 0 (presumed vegetation fire) is placed in the Census 2011 district whose boundary contains it. Detections of type 2 (static industrial heat sources such as steel plants) and 3 (offshore) are left out. Counts are by date of detection.

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | State/UT today (Telangana and Ladakh districts are under their current state) |
| `lgd_state_code` | text |  | State/UT today (Telangana and Ladakh districts are under their current state) |
| `district` | text |  | District by its current name and LGD code (from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv)) |
| `lgd_district_code` | text |  | District by its current name and LGD code (from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv)) |
| `year` | text |  | Calendar year |
| `fire_detections` | integer |  | Vegetation fire detections in the year (count) |
| `fire_detections_confidence_30_plus` | integer |  | Detections with confidence 30% or more (FIRMS "nominal" and "high"); the rest are low-confidence |
| `fire_detections_jan_feb` | integer |  | Detections by season; they add up to `fire_detections` |
| `fire_detections_mar_may` | integer |  | Detections by season; they add up to `fire_detections` |
| `fire_detections_jun_sep` | integer |  | Detections by season; they add up to `fire_detections` |
| `fire_detections_oct_dec` | integer |  | Detections by season; they add up to `fire_detections` |
| `share_mar_may_pct` | number | % | Share of the year's fire detections in March-May (forest fire season), % |
| `share_oct_dec_pct` | number | % | Share in October-December (kharif crop-residue burning season), % |
| `rank_in_state_year` | integer |  | District's rank within its state that year, 1 = most fire detections |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- **Detections, not fires or area burnt.** A large fire can be detected several times, and small or short fires and fires under cloud are missed. Use the counts to compare places and years.
- The data do not say whether a fire is on farmland; crop-residue burning shows up as the October-December peak in Punjab and Haryana and the March-May peak elsewhere.
- **2011 boundaries:** a district split after 2011 is counted in its parent (Palghar in Thane). Districts with no detection in a year have 0.
- 2000 is left out (MODIS starts in November 2000). Each year 119 to 760 detections fall outside every district polygon (on coasts, borders and in an area the map leaves without a district code in Jammu & Kashmir).
- Checks (5 Nov 2026): 16,000 rows = 640 districts x 25 years; seasons add up to the annual total in every row.

## Where this comes from

- Warehouse folder [`ENV_active-fires_2001-to-2025_STATES_BNY_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/ENV_active-fires_2001-to-2025_STATES_BNY_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `ENV_active-fires_2001-to-2025_MH_BNY_DIST.csv`, `ENV_active-fires_2001-to-2025_MH_BNY_DIST.json`.
