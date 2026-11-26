// Where the site's data comes from. Plain JS (not TS) so that
// scripts/build-data.mjs can import it on any Node 18+ without a TS loader.
//
// The data repo is the Bharatnomy *front* repo (Bharatnomy-in/BN-FRONT): the cleaned, per-state copy of
// the warehouse, already joined on LGD codes. To move to newer data, change
// DATA_REF to a newer commit of DATA_REPO and run `npm run data`.

export const DATA_REPO = 'https://github.com/Bharatnomy-in/BN-FRONT';
export const DATA_REF = '5ced7f6577ce1abaef9bbc6ce8c41c20de32c687';

// Set DATA_LOCAL=/path/to/a/checkout to build from a local copy instead of
// cloning (offline work). The commit stamp is then read from that checkout.

// The site covers India. Today only Maharashtra has district data; adding a
// state means adding it here once its data is in the front repo.
export const STATE = { slug: 'maharashtra', name: 'Maharashtra', lgd: '27' };
export const STATES_MAPPED = [STATE];

// All-India state outlines for the home page, dissolved from the Census 2011
// district map (DataMeet) kept in the warehouse. Boundaries are those of 2011.
export const INDIA_BOUNDARIES = {
  repo: 'https://github.com/Bharatnomy-in/BN-DATA',
  ref: 'cd7ce2d673103cc0e606e3cc37e49a9ae75f849a',
  dir: '_sources/datameet-maps/raw',
  file: 'datameet-maps_census2011-districts_2011.shp',
  stateField: 'ST_NM',
};

// Paths inside the data repo.
export const BOUNDARIES_PATH = `states/${STATE.slug}/districts.geojson`;

// The datasets in the Atlas (and the full-data build). Adding one = an entry
// here plus its metrics in metrics.mjs. Only datasets that make a good district
// map belong here: most of the 35 districts covered, real spread between them.
//   tab         label on the Atlas dataset switch
//   time        'year' (a year column), 'date' (a date column; its year is used)
//               or 'static' (one reading per district, shown as staticYear)
//   periodLabel how a single reading's period is written (static datasets)
//   yearLabels  how each year is written when the record has dates, not years
//   baseline    normal period for trend bands and "vs normal" (null = none)
//   views       Atlas views that make sense for this record
//   periods     default periods for the Atlas "Change" view
//   classPerYear colour classes from the year shown, not the whole record
//   changeScale colour scale for the Change view (default anomaly: blue down, red up)
//   fold        tables on post-2014 boundaries: Palghar's rows are added into
//               Thane, since the map uses 2011 boundaries (Thane then included
//               Palghar). `sum` columns are added; `ratio` columns recomputed
//               as num / den * 100. Every metric must be one or the other.
//   computed    the "how" part of the source line
//   downloads   false: the Datasets page build copies the original files
//   aggregate   tables with one row per point (e.g. per plant): rows are summed
//               into one row per district first. Each metric is { sum: col,
//               fuels? }, { count: true, fuels? } or { ratio: [num, den] } (as %)
//   points      the Atlas draws the rows as dots only, no district shading
//               (needs latitude/longitude); mapTitle and help replace the measure's
const IMD_COMPUTED = 'district indices computed by Bharatnomy';
export const DATASETS = [
  {
    slug: 'temperature', tab: 'Temperature',
    caveat: "Figures are district averages of IMD's gridded data on 2011 boundaries. They are best compared across years and districts, not with a single weather station. Thane includes today's Palghar.",
    code: 'BN-DATA-CLM-001',
    lens: 'Climate adaptation & resilience',
    folder: 'CLM_temperature-indices_1951-to-2024_MH_BNY_DIST',
    path: `states/${STATE.slug}/climate-adaptation/CLM_temperature-indices_1951-to-2024_MH_BNY_DIST`,
    title: 'Temperature and heat by district',
    defaultMetric: 'days_tmax_above_p90',
    source: 'IMD gridded daily temperature (1° grid)',
    sourceUrl: 'https://imdpune.gov.in/lrfindex.php',
    time: 'year', baseline: [1991, 2020], views: ['year', 'decade', 'change'],
    periods: { a: [1961, 1990], b: [1995, 2024] }, changeScale: 'anomaly', computed: IMD_COMPUTED,
  },
  {
    slug: 'rainfall', tab: 'Rainfall',
    caveat: "Figures are district averages of IMD's gridded data on 2011 boundaries. They are best compared across years and districts, not with a single rain gauge. Thane includes today's Palghar.",
    code: 'BN-DATA-CLM-002',
    lens: 'Climate adaptation & resilience',
    folder: 'CLM_rainfall-indices_1951-to-2025_MH_BNY_DIST',
    path: `states/${STATE.slug}/climate-adaptation/CLM_rainfall-indices_1951-to-2025_MH_BNY_DIST`,
    title: 'Rainfall and monsoon by district',
    defaultMetric: 'rainfall_jun_sep_departure_pct',
    source: 'IMD gridded daily rainfall (0.25° grid)',
    sourceUrl: 'https://imdpune.gov.in/lrfindex.php',
    time: 'year', baseline: [1971, 2020], views: ['year', 'decade', 'change'],
    periods: { a: [1961, 1990], b: [1996, 2025] }, changeScale: 'wetdry', computed: IMD_COMPUTED,
  },
  {
    slug: 'active-fires', tab: 'Fires',
    caveat: "Satellite detections, not fires or area burnt: one large fire can be counted several times, and small fires or fires under cloud are missed. Use the counts to compare places and years. Palghar is counted in Thane (2011 boundaries).",
    folder: 'ENV_active-fires_2001-to-2025_MH_BNY_DIST',
    path: `states/${STATE.slug}/climate-adaptation/ENV_active-fires_2001-to-2025_MH_BNY_DIST`,
    defaultMetric: 'fire_detections',
    source: 'NASA FIRMS MODIS active fire detections (1 km)',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/country/',
    time: 'year', baseline: null, views: ['year', 'decade', 'change'],
    periods: { a: [2001, 2005], b: [2021, 2025] }, changeScale: 'anomaly',
    computed: 'detections counted by district by Bharatnomy', downloads: false,
  },
  {
    slug: 'forest-cover', tab: 'Forest',
    caveat: "One assessment, the India State of Forest Report 2023. Thane includes today's Palghar (2011 boundaries): their areas are added and the shares recomputed.",
    folder: 'ENV_forest-cover_2023_MH_FSI_DIST',
    path: `states/${STATE.slug}/climate-adaptation/ENV_forest-cover_2023_MH_FSI_DIST`,
    defaultMetric: 'forest_cover_pct_of_area',
    source: 'Forest Survey of India, India State of Forest Report 2023',
    sourceUrl: 'https://fsi.nic.in/forest-report-2023',
    time: 'static', staticYear: 2023, periodLabel: '2023', baseline: null, views: ['year'],
    computed: 'Palghar added into Thane (2011 boundaries)', downloads: false,
    fold: {
      sum: ['geographical_area_sq_km', 'very_dense_forest_sq_km', 'moderately_dense_forest_sq_km', 'open_forest_sq_km', 'forest_cover_total_sq_km', 'change_since_2021_sq_km', 'scrub_sq_km'],
      ratio: { forest_cover_pct_of_area: ['forest_cover_total_sq_km', 'geographical_area_sq_km'] },
    },
  },
  {
    slug: 'rainfall-variability', tab: 'Rain variability',
    caveat: "One value per district for 1971 to 2020, from IMD's daily gridded rainfall. Variability is the year-to-year spread relative to the average, so a dry district and a wet one can score alike.",
    folder: 'CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST',
    path: `states/${STATE.slug}/climate-adaptation/CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST`,
    defaultMetric: 'rainfall_jun_sep_cv_pct',
    source: 'IMD gridded daily rainfall (0.25° grid)',
    sourceUrl: 'https://imdpune.gov.in/lrfindex.php',
    time: 'static', staticYear: 2020, periodLabel: '1971–2020', baseline: null, views: ['year'],
    computed: IMD_COMPUTED, downloads: false,
  },
  {
    slug: 'wind-resource', tab: 'Wind',
    caveat: "Long-term averages from a model (Global Wind Atlas, 2008 to 2017 climate), not measurements at each site. Good for comparing districts, not for siting a turbine.",
    folder: 'CLM_wind-resource-100m_2008-to-2017_MH_BNY_DIST',
    path: `states/${STATE.slug}/energy-policy/CLM_wind-resource-100m_2008-to-2017_MH_BNY_DIST`,
    defaultMetric: 'power_density_100m_mean_w_m2',
    source: 'Global Wind Atlas 3 (DTU, World Bank / ESMAP)',
    sourceUrl: 'https://globalwindatlas.info/',
    time: 'static', staticYear: 2017, periodLabel: '2008–2017 climate', baseline: null, views: ['year'],
    computed: 'district averages computed by Bharatnomy', downloads: false,
  },
  {
    slug: 'rural-tap-water', tab: 'Tap water',
    caveat: "As shown on the Jal Jeevan Mission dashboard on 28 October 2026. Rural households only: Mumbai City and Mumbai Suburban have none. Thane includes today's Palghar (2011 boundaries).",
    folder: 'WAT_tap-water-connections-rural_2026-10_MH_MOJS_DIST',
    path: `states/${STATE.slug}/climate-adaptation/WAT_tap-water-connections-rural_2026-10_MH_MOJS_DIST`,
    defaultMetric: 'households_with_tap_pct',
    source: 'Jal Jeevan Mission dashboard, Ministry of Jal Shakti',
    sourceUrl: 'https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx',
    time: 'date', periodLabel: 'October 2026', baseline: null, views: ['year'],
    nodataLabel: 'no rural households',
    computed: 'Palghar added into Thane (2011 boundaries)', downloads: false,
    fold: {
      sum: ['total_households', 'households_with_tap', 'households_with_tap_on_2019_08_15', 'households_without_tap'],
      ratio: { households_with_tap_pct: ['households_with_tap', 'total_households'] },
    },
  },
  {
    slug: 'odf-plus-villages', tab: 'ODF Plus',
    caveat: "Two snapshots of the Swachh Bharat Mission (Grameen) dashboard, 1 April 2022 and 24 November 2026. Villages only: the Mumbai districts have none. Thane includes today's Palghar (2011 boundaries).",
    folder: 'WAT_odf-plus-villages_2022-to-2026_MH_MOJS_DIST',
    path: `states/${STATE.slug}/climate-adaptation/WAT_odf-plus-villages_2022-to-2026_MH_MOJS_DIST`,
    defaultMetric: 'odf_plus_villages_pct',
    source: 'Swachh Bharat Mission (Grameen) dashboard, Ministry of Jal Shakti',
    sourceUrl: 'https://sbm.gov.in/sbmgdashboard/statesdashboard.aspx',
    time: 'date', yearLabels: { 2022: 'April 2022', 2026: 'November 2026' }, baseline: null, views: ['year'],   // no Change view: every district rose 75+ points, one flat colour
    classPerYear: true,   // 2022 and 2026 are far apart (near 0% then near 100%): colour each snapshot on its own spread
    periods: { a: [2022, 2022], b: [2026, 2026] }, changeScale: 'wetdry',
    nodataLabel: 'no rural villages',
    computed: 'Palghar added into Thane (2011 boundaries)', downloads: false,
    fold: {
      sum: ['total_villages', 'odf_plus_villages', 'odf_plus_aspiring_villages', 'odf_plus_rising_villages', 'odf_plus_model_villages'],
      ratio: { odf_plus_villages_pct: ['odf_plus_villages', 'total_villages'], odf_plus_model_villages_pct: ['odf_plus_model_villages', 'total_villages'] },
    },
  },
  {
    slug: 'power-plants', tab: 'Power plants',
    caveat: "WRI's Global Power Plant Database is frozen at 2021: plants built since about 2020 (much of today's solar and wind) are missing, and capacities for non-CEA plants can be older than 2019. Not an official Indian government release.",
    folder: 'ENG_power-plants_2021_MH_WRI_DIST',
    path: `states/${STATE.slug}/energy-policy/ENG_power-plants_2021_MH_WRI_DIST`,
    defaultMetric: 'capacity_mw_total',
    source: 'WRI Global Power Plant Database v1.3.0',
    sourceUrl: 'https://datasets.wri.org/dataset/globalpowerplantdatabase',
    time: 'static', staticYear: 2021, periodLabel: '2021 release', baseline: null, views: ['year'],
    mapTitle: 'Power plants by fuel and capacity',
    help: "Every plant in Maharashtra listed in WRI's Global Power Plant Database (2021 release), coal to solar. Each dot is one plant: its size is the plant's capacity, its colour the main fuel. Hover a dot for its name, or select a district to list its plants.",
    computed: 'district totals (side panel and table) summed by Bharatnomy', downloads: false,
    // one row per plant. The map shows the plants as dots only (no district
    // shading); the rows are also summed by district for the panel and table.
    points: true,
    aggregate: {
      capacity_mw_total: { sum: 'capacity_mw' },
      plant_count: { count: true },
      capacity_mw_fossil: { sum: 'capacity_mw', fuels: ['Coal', 'Gas', 'Oil'] },
      capacity_mw_renewable: { sum: 'capacity_mw', fuels: ['Solar', 'Wind', 'Hydro', 'Biomass'] },
      renewable_share_pct: { ratio: ['capacity_mw_renewable', 'capacity_mw_total'] },
    },
  },
];

// Every Maharashtra dataset in the front repo, as listed on the Datasets page.
// `npm run data` copies each folder's CSV, JSON and README.md into
// public/data/<slug>/ and zips them as <folder>.zip. A folder in the repo that
// is missing here makes the build fail, so new datasets are never silently left out.
//   featured   shown on the hanging line at the top of the Datasets page (in this order)
//   summary    replaces the README's first paragraph when that describes the all-India table
export const CATALOG = [
  { slug: 'temperature', code: 'BN-DATA-CLM-001', folder: 'CLM_temperature-indices_1951-to-2024_MH_BNY_DIST', title: 'Temperature and heat by district', theme: 'Climate', featured: 1 },
  { slug: 'rainfall', code: 'BN-DATA-CLM-002', folder: 'CLM_rainfall-indices_1951-to-2025_MH_BNY_DIST', title: 'Rainfall and monsoon by district', theme: 'Climate', featured: 2 },
  { slug: 'air-quality', code: 'BN-DATA-ENV-001', folder: 'ENV_aqi-days-by-category_2015-to-2026_MH_BNY_DIST', title: 'Air quality days by district', theme: 'Environment', featured: 3 },
  { slug: 'power-stations', code: 'BN-DATA-ENG-001', folder: 'ENG_power-station-generation-co2_2017-18-to-2025-26_MH_BNY_DIST', title: 'Power station generation and CO2', theme: 'Energy', featured: 4 },
  { slug: 'forest-cover', code: 'BN-DATA-ENV-002', folder: 'ENV_forest-cover_2023_MH_FSI_DIST', title: 'Forest cover by district', theme: 'Environment', featured: 5,
    summary: 'Forest cover in every Maharashtra district by canopy density, from the India State of Forest Report 2023. Forest cover = land of 1 ha or more with tree canopy density of at least 10%.' },
  { slug: 'cyclones', code: 'BN-DATA-CLM-003', folder: 'CLM_cyclone-crossings_1982-to-2025_MH_BNY_DIST', title: 'Cyclones crossing each district', theme: 'Climate' },
  { slug: 'rainfall-variability', code: 'BN-DATA-CLM-004', folder: 'CLM_rainfall-variability_1971-to-2020_MH_BNY_DIST', title: 'Rainfall variability by district', theme: 'Climate' },
  { slug: 'wind-resource', code: 'BN-DATA-CLM-005', folder: 'CLM_wind-resource-100m_2008-to-2017_MH_BNY_DIST', title: 'Wind resource at 100 m by district', theme: 'Energy' },
  { slug: 'active-fires', code: 'BN-DATA-ENV-003', folder: 'ENV_active-fires_2001-to-2025_MH_BNY_DIST', title: 'Satellite fire detections by district', theme: 'Environment' },
  { slug: 'power-plants', code: 'BN-DATA-ENG-002', folder: 'ENG_power-plants_2021_MH_WRI_DIST', title: 'Power plants with location', theme: 'Energy',
    summary: "Every power plant in Maharashtra in WRI's Global Power Plant Database (2021 release), of every fuel: capacity, coordinates, owner and commissioning year as WRI published them, plus the district each plant stands in." },
  { slug: 'solar-resource', code: 'BN-DATA-ENG-003', folder: 'ENG_solar-resource_1999-to-2018_MH_BNY_DIST', title: 'Solar resource by district', theme: 'Energy' },
  { slug: 'odf-plus-villages', code: 'BN-DATA-WAT-001', folder: 'WAT_odf-plus-villages_2022-to-2026_MH_MOJS_DIST', title: 'ODF Plus villages by district', theme: 'Water & sanitation' },
  { slug: 'rural-tap-water', code: 'BN-DATA-WAT-002', folder: 'WAT_tap-water-connections-rural_2026-10_MH_MOJS_DIST', title: 'Rural tap water connections by district', theme: 'Water & sanitation' },
];
// Datasets in the front repo that the site leaves out on purpose.
export const CATALOG_EXCLUDED = [
  'CLM_heat-indicators-nagpur_1951-to-2025_MH_BNY_DIST',
  'ENV_mangrove-cover_2021-to-2023_MH_FSI_DIST',
  'ENG_fly-ash-power-stations_2025-26_MH_BNY_DIST',
];
// Lens names for the front repo's lens folders.
export const LENS_FOLDERS = { 'climate-adaptation': 'Climate adaptation & resilience', 'energy-policy': 'Energy policy & markets' };
