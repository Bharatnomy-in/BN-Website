# Wind power density and wind speed at 100 m by district, India (2008-2017 climate) — Maharashtra

How much wind energy is available at turbine hub height (100 m) in each district: the long-term mean wind power density and wind speed, and their 90th percentile across the district (wind farms use the windiest spots). Computed by Bharatnomy from the Global Wind Atlas.

## Coverage

- **Rows:** 35
- **Period:** 2008 to 2017
- **Districts:** 35 of 36

## Source

- **Data:** Global Wind Atlas 3 (Technical University of Denmark, DTU, with the World Bank / ESMAP), mean power density and mean wind speed at 100 m on a 250 m grid; modelled from ERA5 reanalysis for 2008-2017, downscaled with WRF and WAsP. Licence CC BY 4.0 (see globalwindatlas.info)
- **Link:** https://globalwindatlas.info/ (country download for India, layers "power-density" and "wind-speed" at 100 m; no login)
- **Downloaded:** 12 Nov 2026 (rasters not committed, about 425 MB; `pipelines/global-wind-atlas/fetch_gwa.sh` downloads them, see [`_sources/global-wind-atlas/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/global-wind-atlas/))
- **District boundaries:** Census 2011 district map from DataMeet (see [`_sources/datameet-maps/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/datameet-maps/))
- **Script:** [`pipelines/global-wind-atlas/build_district_wind_resource.py`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/pipelines/global-wind-atlas/build_district_wind_resource.py)

## How it is computed

- District mean = mean of all 250 m cells whose centre lies inside the district's 2011 boundary; 90th percentile over the same cells.
- Wind power density (W/m2) is the energy flux of the wind through a vertical area, 0.5 x air density x mean of (speed cubed); GWA computes it from the full wind-speed distribution, so it is not simply derived from the mean speed.

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | Place (2011 boundary; today's name and LGD code) |
| `lgd_state_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `district` | text |  | Place (2011 boundary; today's name and LGD code) |
| `lgd_district_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `district_census_code` | text |  | Place (2011 boundary; today's name and LGD code) |
| `power_density_100m_mean_w_m2` | number | W/m² | Wind power density at 100 m: district mean and 90th percentile, W/m2 |
| `power_density_100m_p90_w_m2` | number | W/m² | Wind power density at 100 m: district mean and 90th percentile, W/m2 |
| `wind_speed_100m_mean_ms` | number | m/s | Mean wind speed at 100 m: district mean and 90th percentile, m/s |
| `wind_speed_100m_p90_ms` | number | m/s | Mean wind speed at 100 m: district mean and 90th percentile, m/s |
| `raster_coverage_pct` | number | % | Share of the district covered by the GWA India raster, % |
| `source_flag` | text |  | `not_available` where the raster covers less than half of the district (values left blank) |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- **Model data, long-term average** (one value per district, no years). Not a measurement and not a site assessment.
- The GWA "India" raster follows a different national boundary from the Census map: most districts of Jammu & Kashmir, Ladakh and parts of Arunachal Pradesh are outside it, so 35 districts are blank. Uttarkashi (84% covered) keeps its values.
- Checks (12 Nov 2026): 640 districts; no duplicate keys; no negative values; highest district means are in the Tamil Nadu wind belt (Tirunelveli 390 W/m2, Theni, Tiruppur, Kanniyakumari), consistent with where India's wind farms are.

## Where this comes from

- Warehouse folder [`CLM_wind-resource-100m_2008-to-2017_STATES_BNY_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/CLM_wind-resource-100m_2008-to-2017_STATES_BNY_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `CLM_wind-resource-100m_2008-to-2017_MH_BNY_DIST.csv`, `CLM_wind-resource-100m_2008-to-2017_MH_BNY_DIST.json`.
