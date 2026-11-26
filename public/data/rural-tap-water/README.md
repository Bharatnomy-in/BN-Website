# Rural households with tap water connections by district, Oct 2026 — Maharashtra

Number of rural households and how many have a functional household tap connection under the Jal Jeevan Mission (JJM), for every district, as shown on the JJM dashboard on 28 Oct 2026.

## Coverage

- **Rows:** 34
- **Period:** 2026-10
- **Districts:** 34 of 36
- 1 state-total row(s) from the warehouse table are left out; add up district rows instead.

## Source

- **Data:** Department of Drinking Water & Sanitation, Ministry of Jal Shakti, Jal Jeevan Mission IMIS
- **Table taken from:** JJM dashboard, "Households with tap water supply" table, state-wise and each state's district-wise view (the dashboard's `Bind_table_graph` data)
- **Link:** https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx
- **Downloaded:** 28 Oct 2026
- **Original file:** [`_sources/jalshakti-jjm/raw/`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_sources/jalshakti-jjm/raw/) (the JSON the dashboard returns)

## Columns

| Column | Type | Unit | Description |
|---|---|---|---|
| `state_ut` | text |  | State or UT. `State total` rows are the dashboard's state figures |
| `lgd_state_code` | text |  | State/UT code in the Local Government Directory (LGD), from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv). Blank for All India and for old units LGD no longer lists |
| `district` | text |  | District as spelled on the dashboard |
| `lgd_district_code` | text |  | District code in the Local Government Directory (LGD), from [`_reference/geography.csv`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/geography.csv). Blank for totals and names that could not be matched |
| `date` | text |  | Date the dashboard was read (figures are live, as on that date) |
| `jjm_district_code` | text |  | District code used by the dashboard |
| `total_households` | integer |  | Rural households |
| `households_with_tap` | integer |  | Rural households with a tap connection |
| `households_with_tap_pct` | number | % | Share with a tap connection, % (as published) |
| `households_with_tap_on_2019_08_15` | integer |  | Households that had a tap connection when JJM started (15 Aug 2019) |
| `households_without_tap` | integer |  | Households still without a tap connection |

Units are read from the column name (warehouse convention). Empty cells (`null` in JSON) mean no value.

## Notes from the warehouse

These describe the full warehouse table (all states).

- Rural households only. Urban water supply (e.g. Nagpur city) is not covered by JJM; Delhi and Chandigarh are not on the dashboard.
- The dashboard is live; a later download will give different figures.
- `lgd_state_code` and `lgd_district_code` added on 5 Nov 2026 from the LGD directory (see [`_reference/README.md`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/_reference/README.md)). LGD codes identify today's state or district; for years before a split (Telangana 2014, Ladakh 2019, new districts) the same code covers a larger area than it does now.

## Where this comes from

- Warehouse folder [`WAT_tap-water-connections-rural_2026-10_STATES_MOJS_DIST`](https://github.com/sarveshkant2003-afk/bharatnomy-data/tree/ff7d662c4206e81ed483c708cd23a4ab4c946d2c/WAT_tap-water-connections-rural_2026-10_STATES_MOJS_DIST) at commit `ff7d662c4206`
- Filtered to `lgd_state_code` and cleaned by `build.py` in this repo. Files: `WAT_tap-water-connections-rural_2026-10_MH_MOJS_DIST.csv`, `WAT_tap-water-connections-rural_2026-10_MH_MOJS_DIST.json`.
