// Metric registry (MAP.md §3). One entry per column shown in the Atlas.
// Adding a metric = adding an entry here and running `npm run data`.
//
// scale:  warm | anomaly | wet | wetdry | dry | category   (see src/lib/scales.ts)
// breaks: quantile | diverging-symmetric | fixed | categorical

/** @typedef {{ id:string, dataset:string, label:string, short:string, unit:string,
 *   scale:string, breaks:string, help:string, caveat?:string, fixed?:number[],
 *   categories?:string[], decimals:number, higherIs?:string, lowerIs?:string }} Metric */

const GRID_TEMP = 'A 1-degree grid cell is about 110 km wide, so it smooths out the hottest afternoons. Read this as a trend, not as a station count.';
const SMALL = 'Mumbai City and Mumbai Suburban rest on very few grid cells, so their figures describe the surrounding area as much as the district.';

/** @type {Metric[]} */
export const METRICS = [
  // ---------------------------------------------------------------- temperature
  {
    id: 'days_tmax_above_p90', dataset: 'temperature',
    label: 'Unusually hot days (above the 1991 to 2020 90th percentile)', short: 'Hot days',
    unit: 'days', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'hottest', lowerIs: 'least hot',
    help: "Days when the maximum temperature beat the district's own 90th percentile for that time of year, measured over 1991 to 2020. It does not depend on a fixed threshold, so it is the fairest way to compare change over time.",
  },
  {
    id: 'nights_tmin_above_p90', dataset: 'temperature',
    label: 'Unusually warm nights', short: 'Warm nights',
    unit: 'nights', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'warmest nights', lowerIs: 'coolest nights',
    help: "Nights when the minimum temperature beat the district's own 1991 to 2020 90th percentile for that time of year.",
  },
  {
    id: 'tmax_mean_anomaly_c', dataset: 'temperature',
    label: 'Average daily maximum vs 1981 to 2010 (°C)', short: 'Tmax anomaly',
    unit: '°C', scale: 'anomaly', breaks: 'diverging-symmetric', decimals: 2,
    higherIs: 'warmest against normal', lowerIs: 'coolest against normal',
    help: "The year's average daily maximum minus the district's 1981 to 2010 average. Above zero is hotter than normal.",
  },
  {
    id: 'tmax_mean_c', dataset: 'temperature',
    label: 'Average daily maximum (°C)', short: 'Avg max',
    unit: '°C', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'hottest', lowerIs: 'coolest',
    help: 'The average of every daily maximum temperature in the year.',
  },
  {
    id: 'tmin_mean_c', dataset: 'temperature',
    label: 'Average daily minimum (°C)', short: 'Avg min',
    unit: '°C', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'warmest', lowerIs: 'coolest',
    help: 'The average of every daily minimum temperature in the year.',
  },
  {
    id: 'tmax_mean_mar_may_c', dataset: 'temperature',
    label: 'Summer (March to May) average maximum (°C)', short: 'Summer max',
    unit: '°C', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'hottest', lowerIs: 'coolest',
    help: 'The average daily maximum across March, April and May.',
  },
  {
    id: 'tmax_highest_c', dataset: 'temperature',
    label: 'Hottest day of the year (°C)', short: 'Hottest day',
    unit: '°C', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'hottest', lowerIs: 'coolest',
    help: 'The highest daily maximum of the year, on the district average.',
    caveat: GRID_TEMP,
  },
  {
    id: 'days_tmax_40c_or_more', dataset: 'temperature',
    label: 'Days at 40 °C or above', short: '40 °C days',
    unit: 'days', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'hottest', lowerIs: 'least hot',
    help: 'Days when the district-average maximum reached 40 °C or more.',
    caveat: GRID_TEMP,
  },
  {
    id: 'heatwave_days', dataset: 'temperature',
    label: 'Heat wave days (IMD criteria)', short: 'Heat waves',
    unit: 'days', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'most heat wave days', lowerIs: 'fewest heat wave days',
    help: "Days meeting IMD's heat wave rule for the plains: 40 °C or more and at least 4.5 °C above the 1991 to 2020 normal, or 45 °C or more.",
    caveat: "IMD's rule is written for weather stations. On a 1-degree grid the hottest afternoons are smoothed out, so these counts are far lower than station counts and are best read as a trend.",
  },

  // ------------------------------------------------------------------- rainfall
  {
    id: 'rainfall_jun_sep_departure_pct', dataset: 'rainfall',
    label: 'Monsoon rainfall vs 1971 to 2020 average (%)', short: 'Monsoon departure',
    unit: '%', scale: 'wetdry', breaks: 'diverging-symmetric', decimals: 1,
    higherIs: 'wettest against normal', lowerIs: 'driest against normal',
    help: "June to September rainfall compared with the district's 1971 to 2020 average, IMD's long period average. Zero is a normal monsoon.",
  },
  {
    id: 'rainfall_annual_mm', dataset: 'rainfall',
    label: 'Annual rainfall (mm)', short: 'Annual rain',
    unit: 'mm', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'wettest', lowerIs: 'driest',
    help: 'Total rainfall in the calendar year.',
    caveat: "IMD's grid gives Pune an exceptional 2005 (4,342 mm against a 1971 to 2020 average of 1,011 mm). We keep it as IMD published it.",
  },
  {
    id: 'rainfall_jun_sep_mm', dataset: 'rainfall',
    label: 'Monsoon (June to September) rainfall (mm)', short: 'Monsoon rain',
    unit: 'mm', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'wettest', lowerIs: 'driest',
    help: 'Total rainfall from June to September, the south-west monsoon.',
  },
  {
    id: 'rainy_days_2_5mm', dataset: 'rainfall',
    label: 'Rainy days (2.5 mm or more)', short: 'Rainy days',
    unit: 'days', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'most rainy days', lowerIs: 'fewest rainy days',
    help: "Days with 2.5 mm of rain or more, IMD's definition of a rainy day.",
  },
  {
    id: 'heavy_rain_days_64_5mm', dataset: 'rainfall',
    label: 'Heavy rain days (64.5 mm or more)', short: 'Heavy rain days',
    unit: 'days', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'most heavy rain days', lowerIs: 'fewest heavy rain days',
    help: "Days with 64.5 mm or more on the district average, IMD's heavy rain threshold.",
    caveat: 'Counted on the district average, so a downpour over part of a large district counts less than at a single rain gauge.',
  },
  {
    id: 'rx1day_mm', dataset: 'rainfall',
    label: 'Wettest day of the year (mm)', short: 'Wettest day',
    unit: 'mm', scale: 'wet', breaks: 'quantile', decimals: 1,
    higherIs: 'wettest', lowerIs: 'driest',
    help: 'The highest one-day rainfall of the year, on the district average.',
  },
  {
    id: 'monsoon_longest_dry_spell_days', dataset: 'rainfall',
    label: 'Longest monsoon dry spell (days)', short: 'Dry spell',
    unit: 'days', scale: 'dry', breaks: 'quantile', decimals: 0,
    higherIs: 'longest dry spell', lowerIs: 'shortest dry spell',
    help: 'The longest run of days under 2.5 mm between June and September. This is our definition; IMD has no fixed district rule.',
  },
  {
    id: 'spi_jun_sep', dataset: 'rainfall',
    label: 'Monsoon drought index (SPI)', short: 'SPI',
    unit: 'SPI', scale: 'wetdry', breaks: 'fixed', decimals: 2,
    fixed: [-2, -1.5, -1, 1, 1.5, 2],
    higherIs: 'wettest', lowerIs: 'driest',
    help: "June to September rainfall placed on the district's 1971 to 2020 distribution. Below -1 is moderately dry, below -1.5 severely dry, below -2 extremely dry.",
  },
  {
    id: 'monsoon_category', dataset: 'rainfall',
    label: 'Monsoon category (IMD)', short: 'Category',
    unit: '', scale: 'category', breaks: 'categorical', decimals: 0,
    categories: ['large deficient', 'deficient', 'normal', 'excess', 'large excess'],
    help: "IMD's class for the June to September departure from the 1971 to 2020 average: large deficient (-60 to -99%), deficient (-20 to -59%), normal (-19 to +19%), excess (+20 to +59%), large excess (+60% or more).",
  },
  // -------------------------------------------------------------- active fires
  {
    id: 'fire_detections', dataset: 'active-fires',
    label: 'Satellite fire detections in the year', short: 'Fire detections',
    unit: 'detections', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'most fire detections', lowerIs: 'fewest fire detections',
    help: "Vegetation fires picked up by NASA's MODIS satellites (Terra and Aqua) in the district during the year. A measure of crop-residue and forest burning.",
    caveat: 'Detections, not fires or area burnt: a large fire can be counted several times, and small fires or fires under cloud are missed.',
  },
  {
    id: 'fire_detections_mar_may', dataset: 'active-fires',
    label: 'Fire detections, March to May', short: 'Mar–May fires',
    unit: 'detections', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'most spring fire detections', lowerIs: 'fewest spring fire detections',
    help: 'Detections in March, April and May, the main burning season in Maharashtra: forest fires and clearing before the monsoon.',
  },
  {
    id: 'fire_detections_oct_dec', dataset: 'active-fires',
    label: 'Fire detections, October to December', short: 'Oct–Dec fires',
    unit: 'detections', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'most post-monsoon fire detections', lowerIs: 'fewest post-monsoon fire detections',
    help: 'Detections in October, November and December, after the kharif harvest, when crop residue is burnt in some districts.',
  },
  // -------------------------------------------------------------- forest cover
  {
    id: 'forest_cover_pct_of_area', dataset: 'forest-cover',
    label: 'Forest cover (% of district area)', short: 'Forest cover',
    unit: '%', scale: 'forest', breaks: 'quantile', decimals: 1,
    higherIs: 'most forested', lowerIs: 'least forested',
    help: 'Land of 1 hectare or more with tree canopy density of at least 10%, as a share of the district, from the India State of Forest Report 2023.',
    caveat: "Thane here includes Palghar (2011 boundaries): their areas are added and the share recomputed.",
  },
  {
    id: 'forest_cover_total_sq_km', dataset: 'forest-cover',
    label: 'Forest cover (sq km)', short: 'Forest area',
    unit: 'km²', scale: 'forest', breaks: 'quantile', decimals: 0,
    higherIs: 'largest forest area', lowerIs: 'smallest forest area',
    help: 'Very dense, moderately dense and open forest added together, in square kilometres.',
  },
  {
    id: 'very_dense_forest_sq_km', dataset: 'forest-cover',
    label: 'Very dense forest (sq km)', short: 'Very dense forest',
    unit: 'km²', scale: 'forest', breaks: 'quantile', decimals: 0,
    higherIs: 'most very dense forest', lowerIs: 'least very dense forest',
    help: 'Forest with canopy density of 70% or more, in square kilometres. Thirteen districts have none.',
  },
  {
    id: 'change_since_2021_sq_km', dataset: 'forest-cover',
    label: 'Change in forest cover since 2021 (sq km)', short: 'Change since 2021',
    unit: 'km²', scale: 'wetdry', breaks: 'diverging-symmetric', decimals: 1,
    higherIs: 'largest gain', lowerIs: 'largest loss',
    help: 'Forest cover in the 2023 assessment minus the 2021 assessment. Brown is a loss, teal a gain.',
    caveat: 'Part of a change between assessments can come from better satellite data and interpretation, not only from forests growing or being cleared.',
  },
  // ------------------------------------------------------ rainfall variability
  {
    id: 'rainfall_jun_sep_cv_pct', dataset: 'rainfall-variability',
    label: 'Monsoon rainfall variability, 1971 to 2020 (%)', short: 'Monsoon variability',
    unit: '%', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'least reliable monsoon', lowerIs: 'most reliable monsoon',
    help: 'How much June to September rainfall swings from year to year: the standard deviation as a share of the average (coefficient of variation). Higher means a less dependable monsoon.',
  },
  {
    id: 'rainfall_annual_cv_pct', dataset: 'rainfall-variability',
    label: 'Annual rainfall variability, 1971 to 2020 (%)', short: 'Annual variability',
    unit: '%', scale: 'warm', breaks: 'quantile', decimals: 1,
    higherIs: 'least reliable rainfall', lowerIs: 'most reliable rainfall',
    help: "The same for the year's total rainfall: standard deviation as a share of the 1971 to 2020 average.",
  },
  {
    id: 'rainfall_annual_mean_mm', dataset: 'rainfall-variability',
    label: 'Average annual rainfall, 1971 to 2020 (mm)', short: 'Average rainfall',
    unit: 'mm', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'wettest', lowerIs: 'driest',
    help: 'Average yearly rainfall over the fifty years 1971 to 2020, from IMD daily gridded data.',
  },
  // ------------------------------------------------------------ wind resource
  {
    id: 'power_density_100m_mean_w_m2', dataset: 'wind-resource',
    label: 'Wind power density at 100 m (W/m²)', short: 'Wind power density',
    unit: 'W/m²', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'windiest', lowerIs: 'least windy',
    help: 'How much wind energy flows through each square metre at turbine hub height (100 m), averaged over the district, from the Global Wind Atlas (2008 to 2017 climate).',
  },
  {
    id: 'power_density_100m_p90_w_m2', dataset: 'wind-resource',
    label: 'Wind power density at 100 m, windiest 10% of the district (W/m²)', short: 'Best sites',
    unit: 'W/m²', scale: 'wet', breaks: 'quantile', decimals: 0,
    higherIs: 'best wind sites', lowerIs: 'weakest best sites',
    help: "The 90th percentile across the district: what its windiest tenth of land offers. Wind farms go to the best sites, so this often matters more than the average.",
  },
  {
    id: 'wind_speed_100m_mean_ms', dataset: 'wind-resource',
    label: 'Mean wind speed at 100 m (m/s)', short: 'Wind speed',
    unit: 'm/s', scale: 'wet', breaks: 'quantile', decimals: 2,
    higherIs: 'fastest wind', lowerIs: 'slowest wind',
    help: 'Average wind speed at 100 m over the district. Power rises with the cube of speed, so small differences here are large differences in energy.',
  },
  // ---------------------------------------------------------- rural tap water
  {
    id: 'households_with_tap_pct', dataset: 'rural-tap-water',
    label: 'Rural households with a tap connection (%)', short: 'Tap coverage',
    unit: '%', scale: 'wet', breaks: 'quantile', decimals: 1,
    higherIs: 'highest coverage', lowerIs: 'lowest coverage',
    help: 'Share of rural households with a functional household tap connection under the Jal Jeevan Mission, on 28 October 2026.',
    caveat: 'Mumbai City and Mumbai Suburban have no rural households. Thane includes Palghar (2011 boundaries): their households are added and the share recomputed.',
  },
  {
    id: 'households_without_tap', dataset: 'rural-tap-water',
    label: 'Rural households still without a tap', short: 'Without a tap',
    unit: 'households', scale: 'warm', breaks: 'quantile', decimals: 0,
    higherIs: 'most households without a tap', lowerIs: 'fewest households without a tap',
    help: 'Number of rural households that do not yet have a tap connection. Large districts can have a high share connected and still many households waiting.',
  },
  // ------------------------------------------------------------ ODF Plus villages
  {
    id: 'odf_plus_villages_pct', dataset: 'odf-plus-villages',
    label: 'Villages declared ODF Plus (%)', short: 'ODF Plus',
    unit: '%', scale: 'forest', breaks: 'quantile', decimals: 1,
    higherIs: 'highest share', lowerIs: 'lowest share',
    help: 'Share of villages the Swachh Bharat Mission (Grameen) counts as ODF Plus: open defecation free and also managing solid and liquid waste. Two snapshots: 1 April 2022 and 24 November 2026.',
    caveat: 'Mumbai City and Mumbai Suburban have no villages. Thane includes Palghar (2011 boundaries).',
  },
  {
    id: 'odf_plus_model_villages_pct', dataset: 'odf-plus-villages',
    label: 'Villages declared ODF Plus Model (%)', short: 'ODF Plus Model',
    unit: '%', scale: 'forest', breaks: 'quantile', decimals: 1,
    higherIs: 'highest share', lowerIs: 'lowest share',
    help: 'Share of villages at the highest ODF Plus grade, Model: every household and institution has sanitation and the village manages its solid and liquid waste and keeps it visibly clean.',
  },
];

export const SMALL_DISTRICT_NOTE = SMALL;
