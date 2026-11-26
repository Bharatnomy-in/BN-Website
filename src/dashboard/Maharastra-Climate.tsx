import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowUp, CalendarRange, Check, Download, Flame,
  GitCompare, Info, ListOrdered, LocateFixed, Map as MapIcon, Maximize2, Minimize2,
  Moon, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Search, Thermometer,
  TrendingDown, TrendingUp, X, ZoomIn, ZoomOut, Minus,
  type LucideIcon,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { setWorkerUrl, type Map as MaplibreMap, type StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import MapGL, {
  Layer, Source, type LayerProps, type MapLayerMouseEvent, type MapRef,
} from "react-map-gl/maplibre";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


// ==================== src/types/climate.ts ====================
export const METRIC_KEYS = [
  "tmax_mean_c",
  "tmin_mean_c",
  "tmax_highest_c",
  "tmin_highest_c",
  "tmin_lowest_c",
  "tmax_mean_mar_may_c",
  "tmin_mean_mar_may_c",
  "days_tmax_40c_or_more",
  "days_tmax_45c_or_more",
  "heatwave_days",
  "severe_heatwave_days",
  "warm_nights",
  "days_tmax_above_p90",
  "nights_tmin_above_p90",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

/** One source row. Field names are identical to the original JSON columns. */
export interface ClimateRecord extends Record<MetricKey, number | null> {
  state_ut: string;
  lgd_state_code: number | null;
  district: string;
  lgd_district_code: number | null;
  district_census_code: number | null;
  year: number;
}

export interface DistrictInfo {
  name: string;
  lgd: number | null;
  census: number | null;
}

export interface AtlasData {
  records: ClimateRecord[];
  byDistrict: Map<string, ClimateRecord[]>;
  districts: DistrictInfo[];
  years: number[];
  yearMin: number;
  yearMax: number;
}

export interface Period {
  start: number;
  end: number;
}

export type PeriodMode = "year" | "range";

export interface FilterState {
  metric: MetricKey;
  mode: PeriodMode;
  year: number;
  range: Period;
  search: string;
}

export type DrawerTab = "district" | "ranking" | "trends" | "compare" | "periods";

export interface ScaleBin {
  from: number;
  to: number;
  color: string;
  label: string;
}

export interface ColorScale {
  min: number;
  max: number;
  /** true when every district has the same value, so no spread can be shown */
  uniform: boolean;
  bins: ScaleBin[];
}

/** Everything a panel needs to describe the current map state. */
export interface AtlasView {
  data: AtlasData;
  metric: MetricKey;
  mode: PeriodMode;
  period: Period;
  values: Map<string, number | null>;
  scale: ColorScale;
}

export interface SeriesPoint {
  year: number;
  value: number | null;
}

export type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "error"; message: string };


// ==================== src/utils/metrics.ts ====================
export type MetricGroup = "temperature" | "heatwave" | "nights";
export type Aggregation = "mean" | "max" | "min";

export interface MetricConfig {
  key: MetricKey;
  label: string;
  short: string;
  kind: "temperature" | "count";
  /** unit noun: °C, days, nights */
  unit: string;
  group: MetricGroup;
  /** how annual values are combined when a multi-year period is selected (district average of the available years) */
  agg: Aggregation;
}

export const METRICS: readonly MetricConfig[] = [
  { key: "tmax_mean_c", label: "Mean maximum temperature", short: "Mean Tmax", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmin_mean_c", label: "Mean minimum temperature", short: "Mean Tmin", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmax_highest_c", label: "Highest maximum temperature", short: "Highest Tmax", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmin_highest_c", label: "Highest minimum temperature", short: "Highest Tmin", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmin_lowest_c", label: "Lowest minimum temperature", short: "Lowest Tmin", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmax_mean_mar_may_c", label: "Mean maximum temperature (Mar–May)", short: "Tmax Mar–May", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "tmin_mean_mar_may_c", label: "Mean minimum temperature (Mar–May)", short: "Tmin Mar–May", kind: "temperature", unit: "°C", group: "temperature", agg: "mean" },
  { key: "days_tmax_40c_or_more", label: "Days with Tmax ≥ 40 °C", short: "Days ≥ 40 °C", kind: "count", unit: "days", group: "heatwave", agg: "mean" },
  { key: "days_tmax_45c_or_more", label: "Days with Tmax ≥ 45 °C", short: "Days ≥ 45 °C", kind: "count", unit: "days", group: "heatwave", agg: "mean" },
  { key: "heatwave_days", label: "Heatwave days", short: "Heatwave days", kind: "count", unit: "days", group: "heatwave", agg: "mean" },
  { key: "severe_heatwave_days", label: "Severe heatwave days", short: "Severe heatwave", kind: "count", unit: "days", group: "heatwave", agg: "mean" },
  { key: "days_tmax_above_p90", label: "Days with Tmax above 90th percentile", short: "Tmax > P90 days", kind: "count", unit: "days", group: "heatwave", agg: "mean" },
  { key: "warm_nights", label: "Warm nights", short: "Warm nights", kind: "count", unit: "nights", group: "nights", agg: "mean" },
  { key: "nights_tmin_above_p90", label: "Nights with Tmin above 90th percentile", short: "Tmin > P90 nights", kind: "count", unit: "nights", group: "nights", agg: "mean" },
];

export const METRIC_BY_KEY = Object.fromEntries(
  METRICS.map((m) => [m.key, m]),
) as Record<MetricKey, MetricConfig>;

export interface LayerConfig {
  id: MetricGroup;
  label: string;
  defaultMetric: MetricKey;
}

export const LAYERS: readonly LayerConfig[] = [
  { id: "temperature", label: "Temperature", defaultMetric: "tmax_mean_c" },
  { id: "heatwave", label: "Heatwave", defaultMetric: "heatwave_days" },
  { id: "nights", label: "Warm nights", defaultMetric: "warm_nights" },
];

export const METRIC_GROUP_LABEL: Record<MetricGroup, string> = {
  temperature: "Temperature",
  heatwave: "Heatwave & extreme heat",
  nights: "Warm nights",
};

/* ---------- Colour scale ---------- */

export const CLIMATE_COLORS = ["#BFE8F5", "#8DD3E8", "#F4E7A1", "#F7BD75", "#ED8759", "#D94A42"] as const;
export const CLASS_LABELS = ["Very low", "Low", "Moderate", "Elevated", "High", "Very high"] as const;
export const NO_DATA_COLOR = "#CBD5E1";

/** Equal-interval six-class scale computed from the values currently on the map. */
export function buildScale(values: number[]): ColorScale {
  if (values.length === 0) {
    return { min: 0, max: 0, uniform: true, bins: [] };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const uniform = span === 0;
  const step = span / CLIMATE_COLORS.length;
  const bins: ScaleBin[] = CLIMATE_COLORS.map((color, i) => ({
    from: min + step * i,
    to: i === CLIMATE_COLORS.length - 1 ? max : min + step * (i + 1),
    color,
    label: CLASS_LABELS[i],
  }));
  return { min, max, uniform, bins };
}

export function colorFor(scale: ColorScale, value: number | null): string {
  if (value === null || scale.bins.length === 0) return NO_DATA_COLOR;
  if (scale.uniform) return CLIMATE_COLORS[0];
  const span = scale.max - scale.min;
  const idx = Math.min(CLIMATE_COLORS.length - 1, Math.max(0, Math.floor(((value - scale.min) / span) * CLIMATE_COLORS.length)));
  return CLIMATE_COLORS[idx];
}

/* ---------- Formatting ---------- */

export function periodLabel(p: Period): string {
  return p.start === p.end ? String(p.start) : `${p.start}–${p.end}`;
}

export function formatValue(metric: MetricKey, v: number | null): string {
  if (v === null) return "—";
  if (METRIC_BY_KEY[metric].kind === "temperature") return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function unitSuffix(metric: MetricKey, mode: PeriodMode): string {
  const m = METRIC_BY_KEY[metric];
  if (m.kind === "temperature") return " °C";
  return mode === "range" ? ` ${m.unit}/yr` : ` ${m.unit}`;
}

export function formatWithUnit(metric: MetricKey, v: number | null, mode: PeriodMode): string {
  return v === null ? "—" : `${formatValue(metric, v)}${unitSuffix(metric, mode)}`;
}

export function formatDelta(metric: MetricKey, v: number | null): string {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${formatValue(metric, Math.abs(v))}`;
}

/** Plain-language description of how the map value is calculated. */
export function aggregationNote(metric: MetricKey, mode: PeriodMode): string {
  const m = METRIC_BY_KEY[metric];
  if (mode === "year") return "Observed annual value";
  if (m.agg === "max") return "Highest annual value in period";
  if (m.agg === "min") return "Lowest annual value in period";
  return m.kind === "count" ? `Average ${m.unit} per year in period` : "Average of annual values in period";
}


// ==================== src/utils/climate.ts ====================
export function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function numOrNull(v: unknown): number | null {
  return isNum(v) ? v : null;
}

/** Validates the raw JSON; missing metric values become null (never invented). */
export function parseRecords(raw: unknown): ClimateRecord[] {
  if (!Array.isArray(raw)) throw new Error("The climate dataset must be a JSON array.");
  const out: ClimateRecord[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const { district, year } = item;
    if (typeof district !== "string" || !isNum(year)) continue;
    const metrics = {} as Record<MetricKey, number | null>;
    for (const key of METRIC_KEYS) metrics[key] = numOrNull(item[key]);
    out.push({
      state_ut: typeof item.state_ut === "string" ? item.state_ut : "",
      lgd_state_code: numOrNull(item.lgd_state_code),
      district,
      lgd_district_code: numOrNull(item.lgd_district_code),
      district_census_code: numOrNull(item.district_census_code),
      year,
      ...metrics,
    });
  }
  if (out.length === 0) throw new Error("The climate dataset contains no valid records.");
  return out;
}

export function buildAtlasData(records: ClimateRecord[]): AtlasData {
  const byDistrict = new Map<string, ClimateRecord[]>();
  const info = new Map<string, DistrictInfo>();
  const years = new Set<number>();
  for (const r of records) {
    const list = byDistrict.get(r.district);
    if (list) list.push(r);
    else byDistrict.set(r.district, [r]);
    if (!info.has(r.district)) {
      info.set(r.district, { name: r.district, lgd: r.lgd_district_code, census: r.district_census_code });
    }
    years.add(r.year);
  }
  for (const list of byDistrict.values()) list.sort((a, b) => a.year - b.year);
  const sortedYears = [...years].sort((a, b) => a - b);
  return {
    records,
    byDistrict,
    districts: [...info.values()].sort((a, b) => a.name.localeCompare(b.name)),
    years: sortedYears,
    yearMin: sortedYears[0],
    yearMax: sortedYears[sortedYears.length - 1],
  };
}

/* ---------- Aggregation ---------- */

export function aggregate(values: number[], agg: Aggregation): number | null {
  if (values.length === 0) return null;
  if (agg === "max") return Math.max(...values);
  if (agg === "min") return Math.min(...values);
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function inPeriod(year: number, p: Period): boolean {
  return year >= p.start && year <= p.end;
}

export function metricForDistrict(data: AtlasData, district: string, metric: MetricKey, period: Period): number | null {
  const recs = data.byDistrict.get(district);
  if (!recs) return null;
  const vals: number[] = [];
  for (const r of recs) {
    const v = r[metric];
    if (inPeriod(r.year, period) && isNum(v)) vals.push(v);
  }
  return aggregate(vals, METRIC_BY_KEY[metric].agg);
}

export function metricByDistrict(data: AtlasData, metric: MetricKey, period: Period): Map<string, number | null> {
  const out = new Map<string, number | null>();
  for (const d of data.districts) out.set(d.name, metricForDistrict(data, d.name, metric, period));
  return out;
}

export function validValues(values: Map<string, number | null>): number[] {
  const out: number[] = [];
  for (const v of values.values()) if (v !== null) out.push(v);
  return out;
}

export function mean(values: number[]): number | null {
  return aggregate(values, "mean");
}

/* ---------- Series ---------- */

export function annualSeries(data: AtlasData, district: string, metric: MetricKey): SeriesPoint[] {
  const byYear = new Map<number, number | null>();
  for (const r of data.byDistrict.get(district) ?? []) byYear.set(r.year, r[metric]);
  return data.years.map((year) => ({ year, value: byYear.get(year) ?? null }));
}

/** Mean across all districts for each year (districts with a value only). */
export function stateSeries(data: AtlasData, metric: MetricKey): SeriesPoint[] {
  const sums = new Map<number, { sum: number; n: number }>();
  for (const r of data.records) {
    const v = r[metric];
    if (!isNum(v)) continue;
    const s = sums.get(r.year) ?? { sum: 0, n: 0 };
    s.sum += v;
    s.n += 1;
    sums.set(r.year, s);
  }
  return data.years.map((year) => {
    const s = sums.get(year);
    return { year, value: s && s.n > 0 ? s.sum / s.n : null };
  });
}

export interface PeriodStats {
  min: number;
  minYear: number;
  max: number;
  maxYear: number;
  mean: number;
  count: number;
}

export function periodStats(series: SeriesPoint[], period: Period): PeriodStats | null {
  let min = Infinity, max = -Infinity, minYear = 0, maxYear = 0, sum = 0, count = 0;
  for (const p of series) {
    if (!inPeriod(p.year, period) || p.value === null) continue;
    if (p.value < min) { min = p.value; minYear = p.year; }
    if (p.value > max) { max = p.value; maxYear = p.year; }
    sum += p.value;
    count += 1;
  }
  return count === 0 ? null : { min, minYear, max, maxYear, mean: sum / count, count };
}

/** Ordinary least squares slope over the period, expressed per decade. */
export function trendPerDecade(series: SeriesPoint[], period: Period): number | null {
  const pts = series.filter((p): p is { year: number; value: number } => inPeriod(p.year, period) && p.value !== null);
  if (pts.length < 5) return null;
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.year, 0) / n;
  const my = pts.reduce((s, p) => s + p.value, 0) / n;
  let num = 0, den = 0;
  for (const p of pts) {
    num += (p.year - mx) * (p.value - my);
    den += (p.year - mx) ** 2;
  }
  return den === 0 ? null : (num / den) * 10;
}

export interface YoY {
  year: number;
  previousYear: number;
  current: number;
  previous: number;
  delta: number;
  pct: number | null;
}

export function yearOverYear(series: SeriesPoint[], year: number): YoY | null {
  const cur = series.find((p) => p.year === year)?.value ?? null;
  const prev = series.find((p) => p.year === year - 1)?.value ?? null;
  if (cur === null || prev === null) return null;
  const delta = cur - prev;
  return { year, previousYear: year - 1, current: cur, previous: prev, delta, pct: prev !== 0 ? (delta / Math.abs(prev)) * 100 : null };
}

export function yoyDeltas(series: SeriesPoint[], period: Period): { year: number; delta: number }[] {
  const out: { year: number; delta: number }[] = [];
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1], b = series[i];
    if (a.value === null || b.value === null || !inPeriod(b.year, period)) continue;
    out.push({ year: b.year, delta: b.value - a.value });
  }
  return out;
}

export function decadeMeans(series: SeriesPoint[]): { label: string; value: number; years: number }[] {
  const groups = new Map<number, number[]>();
  for (const p of series) {
    if (p.value === null) continue;
    const d = Math.floor(p.year / 10) * 10;
    const arr = groups.get(d);
    if (arr) arr.push(p.value);
    else groups.set(d, [p.value]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, vals]) => ({ label: `${d}s`, value: vals.reduce((s, v) => s + v, 0) / vals.length, years: vals.length }));
}

/* ---------- Ranking ---------- */

export interface RankedRow {
  name: string;
  value: number | null;
  rank: number | null;
}

export function rankDistricts(values: Map<string, number | null>, direction: "desc" | "asc" = "desc"): RankedRow[] {
  const withValue: { name: string; value: number }[] = [];
  const without: RankedRow[] = [];
  for (const [name, value] of values) {
    if (value === null) without.push({ name, value: null, rank: null });
    else withValue.push({ name, value });
  }
  withValue.sort((a, b) => (direction === "desc" ? b.value - a.value : a.value - b.value) || a.name.localeCompare(b.name));
  // Competition ranking: districts with equal values share a rank (1, 2, 2, 4 …).
  const ranked: RankedRow[] = withValue.map((r, i) => {
    const first = withValue.findIndex((x) => x.value === r.value);
    return { name: r.name, value: r.value, rank: first === -1 ? i + 1 : first + 1 };
  });
  return [...ranked, ...without.sort((a, b) => a.name.localeCompare(b.name))];
}

/** Rank of a district when sorted highest-first. */
export function descendingRank(values: Map<string, number | null>, district: string): { rank: number; total: number } | null {
  const rows = rankDistricts(values, "desc").filter((r) => r.rank !== null);
  const row = rows.find((r) => r.name === district);
  return row && row.rank !== null ? { rank: row.rank, total: rows.length } : null;
}


// ==================== src/utils/geo.ts ====================
export type GeoGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoGeometry;
}

export interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
  /** features dropped during validation (non-polygon, malformed or misplaced coordinates) */
  skipped: number;
  /** display labels of the dropped features */
  skippedLabels: string[];
}

function isGeoRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validation window for Maharashtra. It is only a sanity check: any vertex outside it means the
 * feature is misplaced or corrupt, so the whole feature is rejected rather than drawn in the wrong
 * place. Geometry that passes is rendered exactly as supplied (never altered or simplified).
 */
const MAHARASHTRA_EXTENT = { west: 72, south: 15, east: 81.5, north: 22.5 } as const;

function isLonLat(p: unknown): boolean {
  if (!Array.isArray(p) || p.length < 2) return false;
  const x: unknown = p[0];
  const y: unknown = p[1];
  return (
    typeof x === "number" && Number.isFinite(x) && x >= MAHARASHTRA_EXTENT.west && x <= MAHARASHTRA_EXTENT.east &&
    typeof y === "number" && Number.isFinite(y) && y >= MAHARASHTRA_EXTENT.south && y <= MAHARASHTRA_EXTENT.north
  );
}

/** A linear ring needs ≥ 4 valid positions and must be closed (first === last). */
function isValidRing(r: unknown): boolean {
  if (!Array.isArray(r) || r.length < 4 || !r.every(isLonLat)) return false;
  const first = r[0] as number[];
  const last = r[r.length - 1] as number[];
  return first[0] === last[0] && first[1] === last[1];
}

function isValidPolygon(p: unknown): boolean {
  return Array.isArray(p) && p.length > 0 && p.every(isValidRing);
}

/** Property names that hold a human-readable district name (display only — never used for joining). */
const LABEL_KEYS = ["dtname", "Dist"] as const;

const UNKNOWN_FEATURE = "Unknown geographical feature";

/** Display label for a boundary polygon. */
export function featureLabel(props: Record<string, unknown>): string {
  for (const k of LABEL_KEYS) {
    const v = props[k];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return UNKNOWN_FEATURE;
}

/** Parses a GeoJSON FeatureCollection, keeping only valid Polygon / MultiPolygon features. */
export function parseGeo(text: string): GeoCollection {
  const raw: unknown = JSON.parse(text);
  if (!isGeoRecord(raw) || raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) {
    throw new Error("File is not a GeoJSON FeatureCollection.");
  }
  const features: GeoFeature[] = [];
  const skippedLabels: string[] = [];
  for (const f of raw.features as unknown[]) {
    const props = isGeoRecord(f) && isGeoRecord(f.properties) ? f.properties : {};
    if (!isGeoRecord(f) || !isGeoRecord(f.geometry)) { skippedLabels.push(featureLabel(props)); continue; }
    const g = f.geometry;
    const coords = g.coordinates;
    const valid =
      (g.type === "Polygon" && isValidPolygon(coords)) ||
      (g.type === "MultiPolygon" && Array.isArray(coords) && coords.length > 0 && coords.every(isValidPolygon));
    if (!valid) { skippedLabels.push(featureLabel(props)); continue; }
    features.push({ type: "Feature", properties: props, geometry: g as unknown as GeoGeometry });
  }
  if (features.length === 0) throw new Error("GeoJSON contains no valid polygon features.");
  return { type: "FeatureCollection", features, skipped: skippedLabels.length, skippedLabels };
}

/* ---------- Joining boundaries to climate districts: LGD code only ---------- */

/** GeoJSON property holding the LGD district code. Matches `ClimateRecord.lgd_district_code`. */
export const GEO_LGD_FIELD = "dist_lgd";

function toCode(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
}

export interface MatchResult {
  /** climate district name for each feature (same order as geo.features), or null */
  keys: (string | null)[];
  /** LGD code read from each feature's `dist_lgd` (same order), or null */
  lgds: (number | null)[];
  /** LGD code → climate district name, only for LGD codes that have a polygon */
  lgdToDistrict: Map<number, string>;
  matched: Set<string>;
  /** display labels of polygons whose LGD code has no climate district (e.g. Palghar) */
  unmatchedFeatures: string[];
  /** climate districts whose LGD code has no polygon */
  unmatchedDistricts: string[];
}

/**
 * Joins on LGD codes ONLY:  climate `lgd_district_code`  ===  feature `properties.dist_lgd`.
 * Names (including renamed districts), Census codes (`dtcode11`) and state codes are never consulted.
 */
export function matchFeatures(geo: GeoCollection, districts: DistrictInfo[]): MatchResult {
  const byLgd = new Map<number, string>();
  for (const d of districts) if (d.lgd !== null) byLgd.set(d.lgd, d.name);

  const keys: (string | null)[] = [];
  const lgds: (number | null)[] = [];
  const lgdToDistrict = new Map<number, string>();
  const matched = new Set<string>();
  const unmatchedFeatures: string[] = [];

  for (const f of geo.features) {
    const lgd = toCode(f.properties[GEO_LGD_FIELD]);
    const key = lgd !== null ? byLgd.get(lgd) ?? null : null;
    keys.push(key);
    lgds.push(lgd);
    if (key !== null && lgd !== null) {
      matched.add(key);
      lgdToDistrict.set(lgd, key);
    } else {
      unmatchedFeatures.push(featureLabel(f.properties));
    }
  }

  return {
    keys,
    lgds,
    lgdToDistrict,
    matched,
    unmatchedFeatures,
    unmatchedDistricts: districts.filter((d) => !matched.has(d.name)).map((d) => d.name),
  };
}

export interface PreparedGeo {
  /** polygons joined to a climate district; coloured through their `__lgd` property */
  matched: { type: "FeatureCollection"; features: GeoFeature[] };
  /** polygons without climate data (rendered separately in neutral grey) */
  noData: { type: "FeatureCollection"; features: GeoFeature[] };
}

/**
 * Splits features into matched / no-data collections and stamps join properties on each.
 * Geometry objects are reused by reference — coordinates are never copied, edited or simplified.
 * Built once per file: filter changes only update the paint expression, not the source data.
 * `__fid` is a unique numeric id per polygon, promoted to the MapLibre feature id for feature-state styling.
 */
export function prepareGeo(geo: GeoCollection, match: MatchResult): PreparedGeo {
  const matched: GeoFeature[] = [];
  const noData: GeoFeature[] = [];
  geo.features.forEach((f, i) => {
    const key = match.keys[i];
    const lgd = match.lgds[i];
    if (key !== null && lgd !== null) {
      matched.push({ ...f, properties: { ...f.properties, __key: key, __lgd: lgd, __fid: lgd } });
    } else {
      noData.push({ ...f, properties: { ...f.properties, __key: "", __lgd: lgd ?? -1, __fid: lgd ?? 1_000_000 + i, __label: featureLabel(f.properties) } });
    }
  });
  return {
    matched: { type: "FeatureCollection", features: matched },
    noData: { type: "FeatureCollection", features: noData },
  };
}

export type Bounds = [[number, number], [number, number]];

export function computeBounds(geo: GeoCollection): Bounds | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (c.length >= 2 && typeof c[0] === "number" && typeof c[1] === "number") {
      if (c[0] < w) w = c[0];
      if (c[0] > e) e = c[0];
      if (c[1] < s) s = c[1];
      if (c[1] > n) n = c[1];
      return;
    }
    for (const child of c) walk(child);
  };
  for (const f of geo.features) walk(f.geometry.coordinates);
  return Number.isFinite(w) ? [[w, s], [e, n]] : null;
}


// ==================== src/utils/csv.ts ====================
type Cell = string | number | null;

function escapeCell(c: Cell): string {
  if (c === null) return "";
  const s = String(c);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** All districts for the active period: every metric aggregated from source records. */
export function exportPeriodSummary(data: AtlasData, period: Period): void {
  const header: Cell[] = ["district", "lgd_district_code", "period_start", "period_end", ...METRIC_KEYS.map((k) => `${k} (${METRIC_BY_KEY[k].agg}${METRIC_BY_KEY[k].kind === "count" ? " per year" : ""})`)];
  const rows: Cell[][] = [header];
  for (const d of data.districts) {
    rows.push([d.name, d.lgd, period.start, period.end, ...METRIC_KEYS.map((k) => metricForDistrict(data, d.name, k, period))]);
  }
  downloadCsv(`climate-atlas_districts_${periodLabel(period)}.csv`, toCsv(rows));
}

const RAW_COLUMNS: (keyof ClimateRecord)[] = [
  "state_ut", "lgd_state_code", "district", "lgd_district_code", "district_census_code", "year", ...METRIC_KEYS,
];

/** Original, unaggregated records for one district (all 20 source columns). */
export function exportDistrictRecords(data: AtlasData, district: string): void {
  const recs = data.byDistrict.get(district) ?? [];
  const rows: Cell[][] = [RAW_COLUMNS.map(String), ...recs.map((r) => RAW_COLUMNS.map((c) => r[c]))];
  downloadCsv(`climate-atlas_${district.toLowerCase().replace(/\s+/g, "-")}_records.csv`, toCsv(rows));
}


// ==================== src/utils/cn.ts ====================
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


// ==================== src/components/ui.tsx ====================
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]", className)}>{children}</p>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn("flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
            o.value === value ? "bg-white text-[#1E293B] shadow-sm" : "text-[#64748B] hover:text-[#1E293B]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-[#E2E8F0] bg-white px-3 py-2", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#1E293B]">{value}</p>
      {sub ? <p className="text-[10px] text-[#64748B]">{sub}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-sm font-semibold text-[#1E293B]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{body}</p>
    </div>
  );
}

export const selectClass =
  "w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1E293B] outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15";

export const chartTooltipStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  fontSize: 11,
  padding: "6px 10px",
  boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
} as const;


// ==================== src/components/TopNav.tsx ====================
const LAYER_ICONS: Record<MetricGroup, LucideIcon> = {
  temperature: Thermometer,
  heatwave: Flame,
  nights: Moon,
};

const TOOLS: { tab: DrawerTab; label: string; icon: LucideIcon }[] = [
  { tab: "ranking", label: "Ranking", icon: ListOrdered },
  { tab: "trends", label: "Trends", icon: TrendingUp },
  { tab: "compare", label: "Compare", icon: GitCompare },
  { tab: "periods", label: "Periods", icon: CalendarRange },
];

interface TopNavProps {
  metric: MetricKey;
  onLayer: (metric: MetricKey) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  drawerTab: DrawerTab | null;
  onTool: (tab: DrawerTab) => void;
  compareCount: number;
  onExport: () => void;
  coverage: string;
}

export function TopNav({ metric, onLayer, panelOpen, onTogglePanel, drawerTab, onTool, compareCount, onExport, coverage }: TopNavProps) {
  const activeGroup = METRIC_BY_KEY[metric].group;
  const PanelIcon = panelOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="z-30 flex h-12 shrink-0 items-center gap-3 border-b border-[#E2E8F0] bg-white px-3">
      <button
        type="button"
        onClick={onTogglePanel}
        aria-label={panelOpen ? "Hide filters" : "Show filters"}
        className="rounded-md p-1.5 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#1E293B]"
      >
        <PanelIcon size={18} />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0EA5E9] text-white">
          <Thermometer size={15} />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold tracking-tight text-[#1E293B]">
            Climate<span className="text-[#0EA5E9]">Atlas</span>
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-[#64748B]">Maharashtra</p>
        </div>
      </div>

      <nav className="ml-3 flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5" aria-label="Map layer">
        {LAYERS.map((l) => {
          const Icon = LAYER_ICONS[l.id];
          const active = l.id === activeGroup;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onLayer(active ? metric : l.defaultMetric)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                active ? "bg-white text-[#0EA5E9] shadow-sm" : "text-[#64748B] hover:text-[#1E293B]",
              )}
            >
              <Icon size={13} />
              {l.label}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <span className="mr-2 hidden text-[11px] text-[#64748B] xl:inline">{coverage}</span>
        {TOOLS.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTool(tab)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
              drawerTab === tab ? "bg-[#0EA5E9]/10 text-[#0EA5E9]" : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]",
            )}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{label}</span>
            {tab === "compare" && compareCount > 0 ? (
              <span className="rounded-full bg-[#14B8A6] px-1.5 text-[10px] font-semibold text-white">{compareCount}</span>
            ) : null}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-[#E2E8F0]" />
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-xs font-medium text-[#1E293B] transition hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
        >
          <Download size={13} />
          <span className="hidden md:inline">Export CSV</span>
        </button>
      </div>
    </header>
  );
}


// ==================== src/components/FilterPanel.tsx ====================
const PRESETS: { label: string; range: Period }[] = [
  { label: "1951–1980", range: { start: 1951, end: 1980 } },
  { label: "1981–2010", range: { start: 1981, end: 2010 } },
  { label: "2011–2024", range: { start: 2011, end: 2024 } },
];

const GROUPS: MetricGroup[] = ["temperature", "heatwave", "nights"];

interface FilterPanelProps {
  view: AtlasView;
  filters: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  selected: string | null;
  onSelect: (district: string | null) => void;
  compare: string[];
  onToggleCompare: (district: string) => void;
  maxCompare: number;
}

export function FilterPanel({ view, filters, onChange, onReset, selected, onSelect, compare, onToggleCompare, maxCompare }: FilterPanelProps) {
  const { data, metric, values, scale } = view;
  const { years, yearMin, yearMax } = data;

  const list = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return data.districts.filter((d) => d.name.toLowerCase().includes(q));
  }, [data.districts, filters.search]);

  const setStart = (start: number) => onChange({ mode: "range", range: { start, end: Math.max(start, filters.range.end) } });
  const setEnd = (end: number) => onChange({ mode: "range", range: { start: Math.min(end, filters.range.start), end } });
  const presetActive = (r: Period) => filters.mode === "range" && filters.range.start === r.start && filters.range.end === r.end;
  const suffix = unitSuffix(metric, view.mode);

  return (
    <div className="flex h-full w-[296px] flex-col bg-white">
      <div className="space-y-4 border-b border-[#E2E8F0] p-4">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search districts"
            aria-label="Search districts"
            className={cn(selectClass, "pl-8")}
          />
        </div>

        <div>
          <SectionLabel className="mb-1.5">Climate metric</SectionLabel>
          <select
            value={metric}
            onChange={(e) => onChange({ metric: e.target.value as MetricKey })}
            aria-label="Climate metric"
            className={selectClass}
          >
            {GROUPS.map((g) => (
              <optgroup key={g} label={METRIC_GROUP_LABEL[g]}>
                {METRICS.filter((m) => m.group === g).map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 font-mono text-[10px] text-[#64748B]">{metric}</p>
        </div>

        <div>
          <SectionLabel className="mb-1.5">Period</SectionLabel>
          <Segmented
            value={filters.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              { value: "range", label: "Year range" },
              { value: "year", label: "Single year" },
            ]}
          />

          {filters.mode === "year" ? (
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs text-[#64748B]">Year</span>
                <span className="text-sm font-semibold tabular-nums text-[#1E293B]">{filters.year}</span>
              </div>
              <input
                type="range"
                min={yearMin}
                max={yearMax}
                step={1}
                value={filters.year}
                onChange={(e) => onChange({ year: Number(e.target.value) })}
                aria-label="Year"
                className="w-full accent-[#0EA5E9]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B]">
                <span>{yearMin}</span>
                <span>{yearMax}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] text-[#64748B]">
                From
                <select value={filters.range.start} onChange={(e) => setStart(Number(e.target.value))} className={cn(selectClass, "mt-0.5")}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] text-[#64748B]">
                To
                <select value={filters.range.end} onChange={(e) => setEnd(Number(e.target.value))} className={cn(selectClass, "mt-0.5")}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="mt-3 flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange({ mode: "range", range: p.range })}
                className={cn(
                  "flex-1 rounded-md border px-1 py-1 text-[11px] font-medium transition",
                  presetActive(p.range)
                    ? "border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]"
                    : "border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#1E293B]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <SectionLabel>Districts · {list.length}</SectionLabel>
        <span className="text-[10px] text-[#64748B]">{METRIC_BY_KEY[metric].short}</span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {list.length === 0 ? <li className="px-2 py-6 text-center text-xs text-[#64748B]">No districts match “{filters.search}”.</li> : null}
        {list.map((d) => {
          const v = values.get(d.name) ?? null;
          const active = selected === d.name;
          const inCompare = compare.includes(d.name);
          return (
            <li key={d.name} className="group flex items-center">
              <button
                type="button"
                onClick={() => onSelect(active ? null : d.name)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
                  active ? "bg-[#0EA5E9]/10 text-[#1E293B]" : "text-[#1E293B] hover:bg-[#F8FAFC]",
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colorFor(scale, v) }} />
                <span className="truncate font-medium">{d.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-[#64748B]">
                  {formatValue(metric, v)}
                  {v !== null ? <span className="text-[10px]">{suffix.startsWith(" °") ? "°" : ""}</span> : null}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onToggleCompare(d.name)}
                disabled={!inCompare && compare.length >= maxCompare}
                aria-label={inCompare ? `Remove ${d.name} from comparison` : `Add ${d.name} to comparison`}
                title={inCompare ? "Remove from comparison" : compare.length >= maxCompare ? `Up to ${maxCompare} districts` : "Add to comparison"}
                className={cn(
                  "ml-1 rounded-md p-1 transition disabled:cursor-not-allowed disabled:opacity-30",
                  inCompare ? "bg-[#14B8A6] text-white" : "text-[#94A3B8] opacity-0 hover:bg-[#F1F5F9] hover:text-[#1E293B] focus:opacity-100 group-hover:opacity-100",
                )}
              >
                {inCompare ? <Check size={12} /> : <Plus size={12} />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#E2E8F0] p-3">
        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] py-2 text-xs font-medium text-[#64748B] transition hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
        >
          <RotateCcw size={13} />
          Reset filters
        </button>
      </div>
    </div>
  );
}


// ==================== src/components/ClimateMap.tsx ====================
// Vite must bundle MapLibre's worker (and its shared chunk) itself; set once at module load.
setWorkerUrl(workerUrl);

/** Light raster basemap under the district polygons (polygons themselves come only from the GeoJSON file). */
const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#F8FAFC" } },
    { id: "osm-light", type: "raster", source: "osm", paint: { "raster-opacity": 0.62 } },
  ],
};

const NO_LGD = -1;

const SOURCE_ID = "districts";
const NODATA_SOURCE_ID = "districts-nodata";
const FILL_ID = "districts-fill";
const NODATA_FILL_ID = "nodata-fill";
const PICK_LAYERS = [FILL_ID, NODATA_FILL_ID];

/** Both sources use `__fid` (a unique number per polygon) as the feature id so feature-state can address them. */
const PROMOTE_ID = "__fid";

/**
 * Hover / selection styling is driven by MapLibre *feature-state*, never by layer filters.
 * Changing a filter on a GeoJSON source reloads and re-tiles the whole source (≈190k vertices here),
 * which is what made old highlights queue up. Feature-state is paint-only: no tile work at all.
 */
const stateFlag = (key: string): unknown => ["boolean", ["feature-state", key], false];

const lineLayer: LayerProps = {
  id: "districts-line",
  type: "line",
  paint: { "line-color": "#FFFFFF", "line-width": 1 },
};
const hoverLayer = {
  id: "districts-hover",
  type: "line",
  paint: { "line-color": "#1E293B", "line-width": 2, "line-opacity": ["case", stateFlag("hover"), 1, 0] },
} as unknown as LayerProps;
const selectedLayer = {
  id: "districts-selected",
  type: "line",
  paint: { "line-color": "#0EA5E9", "line-width": 3, "line-opacity": ["case", stateFlag("selected"), 1, 0] },
} as unknown as LayerProps;
/** The no-data polygon (Palghar) darkens under the pointer instead of drawing an outline. */
const nodataFillLayer = {
  id: NODATA_FILL_ID,
  type: "fill",
  paint: { "fill-color": ["case", stateFlag("hover"), "#94A3B8", NO_DATA_COLOR], "fill-opacity": 0.95 },
} as unknown as LayerProps;
const nodataLineLayer: LayerProps = {
  id: "nodata-line",
  type: "line",
  paint: { "line-color": "#94A3B8", "line-width": 1, "line-dasharray": [2, 1] },
};

/* ---------- Hover controller (framework-free, requestAnimationFrame-coalesced) ---------- */

export interface HoverHit {
  /** stable identity of the hovered polygon, e.g. "district:483" */
  id: string;
  kind: "district" | "nodata";
  source: string;
  fid: number;
  name: string;
  lgd: number | null;
}

export interface TooltipTarget {
  kind: "district" | "nodata";
  name: string;
  lgd: number | null;
}

/** The slice of the MapLibre `Map` API the hover logic needs (lets it be exercised without a browser). */
export interface HoverMap {
  isMoving(): boolean;
  getLayer(id: string): unknown;
  getSource(id: string): unknown;
  queryRenderedFeatures(
    geometry: [number, number],
    options: { layers: string[] },
  ): { layer: { id: string }; properties: Record<string, unknown> | null }[];
  setFeatureState(target: { source: string; id: number }, state: Record<string, unknown>): void;
  removeFeatureState(target: { source: string; id: number }, key?: string): void;
}

/**
 * Hit-test at one exact pixel. Only the two polygon fill layers are queried, in a single call.
 * There is deliberately no tolerance box: a neighbouring district can never be picked by accident.
 */
export function pickAt(map: HoverMap, x: number, y: number): HoverHit | null {
  const layers = PICK_LAYERS.filter((id) => map.getLayer(id));
  if (layers.length === 0) return null;
  const f = map.queryRenderedFeatures([x, y], { layers })[0];
  if (!f) return null;
  const p = f.properties ?? {};
  const fid = p[PROMOTE_ID];
  if (typeof fid !== "number") return null;
  const lgdRaw = p["__lgd"];
  const lgd = typeof lgdRaw === "number" && lgdRaw !== NO_LGD ? lgdRaw : null;
  if (f.layer.id === NODATA_FILL_ID) {
    const label = p["__label"];
    return { id: `nodata:${fid}`, kind: "nodata", source: NODATA_SOURCE_ID, fid, name: typeof label === "string" ? label : "Unknown geographical feature", lgd };
  }
  const key = p["__key"];
  if (typeof key !== "string" || key === "") return null;
  return { id: `district:${fid}`, kind: "district", source: SOURCE_ID, fid, name: key, lgd };
}

function setHoverState(map: HoverMap, hit: HoverHit, on: boolean): void {
  if (!map.getSource(hit.source)) return;
  if (on) map.setFeatureState({ source: hit.source, id: hit.fid }, { hover: true });
  else map.removeFeatureState({ source: hit.source, id: hit.fid }, "hover");
}

export interface HoverControllerDeps {
  getMap: () => HoverMap | null;
  requestFrame: (cb: () => void) => number;
  cancelFrame: (id: number) => void;
  ui: {
    show: (target: TooltipTarget, x: number, y: number) => void;
    move: (x: number, y: number) => void;
    hide: () => void;
    cursor: (value: string) => void;
  };
}

export interface HoverController {
  /** Record the latest pointer position and make sure one hit-test is scheduled for the next frame. */
  move: (x: number, y: number) => void;
  /** Pointer left the map: drop any pending frame and clear the hover immediately. */
  leave: () => void;
  /** Map started moving (pan / zoom): clear the hover immediately. */
  interrupt: () => void;
  /** Map stopped moving: re-test under the (unmoved) pointer, once. */
  settle: () => void;
  /** Cancel any pending frame (component cleanup). */
  dispose: () => void;
  current: () => HoverHit | null;
}

export function createHoverController(deps: HoverControllerDeps): HoverController {
  let pointer: { x: number; y: number } | null = null; // only ever the LATEST position
  let frame = 0; // 0 = no frame pending (requestAnimationFrame ids start at 1)
  let hovered: HoverHit | null = null;

  /** Applies a hit-test result. Does real work only when the hovered polygon actually changes. */
  const apply = (hit: HoverHit | null, x: number, y: number): void => {
    if ((hit?.id ?? null) === (hovered?.id ?? null)) {
      if (hit) deps.ui.move(x, y); // same district: reposition only, no state, no style update
      return;
    }
    const map = deps.getMap();
    if (map) {
      if (hovered) setHoverState(map, hovered, false); // previous outline off …
      if (hit) setHoverState(map, hit, true); // … and the new one on, in the same tick
    }
    hovered = hit;
    deps.ui.cursor(hit?.kind === "district" ? "pointer" : "");
    if (hit) deps.ui.show({ kind: hit.kind, name: hit.name, lgd: hit.lgd }, x, y);
    else deps.ui.hide();
  };

  const flush = (): void => {
    frame = 0;
    const p = pointer;
    const map = deps.getMap();
    if (!p || !map) {
      apply(null, 0, 0);
      return;
    }
    if (map.isMoving()) {
      apply(null, p.x, p.y);
      return;
    }
    apply(pickAt(map, p.x, p.y), p.x, p.y);
  };

  const schedule = (): void => {
    if (frame === 0) frame = deps.requestFrame(flush);
  };

  const cancel = (): void => {
    if (frame !== 0) {
      deps.cancelFrame(frame);
      frame = 0;
    }
  };

  return {
    move(x, y) {
      pointer = { x, y }; // overwrite: older positions are discarded, never queued
      schedule();
    },
    leave() {
      pointer = null;
      cancel();
      apply(null, 0, 0);
    },
    interrupt() {
      cancel();
      apply(null, 0, 0);
    },
    settle() {
      if (pointer) schedule();
    },
    dispose() {
      cancel();
      pointer = null;
      hovered = null;
    },
    current: () => hovered,
  };
}

/* ---------- Map component ---------- */

interface ClimateMapProps {
  geo: GeoCollection;
  match: MatchResult;
  view: AtlasView;
  selected: string | null;
  onSelect: (district: string | null) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  /** changes whenever surrounding layout changes, so the canvas can resize */
  layoutKey: string;
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0EA5E9]"
    >
      {children}
    </button>
  );
}

export function ClimateMap({ geo, match, view, selected, onSelect, isFullscreen, onToggleFullscreen, layoutKey }: ClimateMapProps) {
  const mapRef = useRef<MapRef>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle>(null);
  const userMoved = useRef(false);

  // Latest props for event handlers, so the handlers themselves stay stable and never re-bind.
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const bounds = useMemo(() => computeBounds(geo), [geo]);
  const prepared = useMemo(() => prepareGeo(geo, match), [geo, match]);
  const districtToLgd = useMemo(() => new Map([...match.lgdToDistrict].map(([lgd, name]) => [name, lgd])), [match.lgdToDistrict]);

  const getMap = useCallback((): MaplibreMap | null => mapRef.current?.getMap() ?? null, []);

  /** Choropleth: one paint expression keyed on LGD code; source data never changes with filters. */
  const fillLayer: LayerProps = useMemo(() => {
    const pairs: (number | string)[] = [];
    for (const [lgd, name] of match.lgdToDistrict) pairs.push(lgd, colorFor(view.scale, view.values.get(name) ?? null));
    const color: unknown = pairs.length === 0 ? NO_DATA_COLOR : ["match", ["get", "__lgd"], ...pairs, NO_DATA_COLOR];
    return { id: FILL_ID, type: "fill", paint: { "fill-color": color, "fill-opacity": 0.95 } } as unknown as LayerProps;
  }, [match.lgdToDistrict, view.values, view.scale]);

  /* ----- hover: rAF-coalesced controller; the tooltip and outline are updated imperatively ----- */

  const hover = useMemo(
    () =>
      createHoverController({
        getMap: () => (mapRef.current?.getMap() as unknown as HoverMap | undefined) ?? null,
        requestFrame: (cb) => window.requestAnimationFrame(cb),
        cancelFrame: (id) => window.cancelAnimationFrame(id),
        ui: {
          show: (t, x, y) => tooltipRef.current?.show(t, x, y),
          move: (x, y) => tooltipRef.current?.move(x, y),
          hide: () => tooltipRef.current?.hide(),
          cursor: (value) => {
            const m = mapRef.current?.getMap();
            if (m) m.getCanvasContainer().style.cursor = value;
          },
        },
      }),
    [],
  );
  useEffect(() => () => hover.dispose(), [hover]);

  /* ----- selection outline: feature-state, applied the instant a district is clicked ----- */

  const desiredLgd = selected !== null ? districtToLgd.get(selected) ?? null : null;
  const desiredLgdRef = useRef<number | null>(desiredLgd);
  desiredLgdRef.current = desiredLgd;
  const appliedLgdRef = useRef<number | null>(null);

  const syncSelected = useCallback(() => {
    const map = getMap();
    if (!map || !map.getSource(SOURCE_ID)) return; // source not on the map yet; retried on sourcedata
    const next = desiredLgdRef.current;
    const prev = appliedLgdRef.current;
    if (prev === next) return;
    if (prev !== null) map.removeFeatureState({ source: SOURCE_ID, id: prev }, "selected");
    if (next !== null) map.setFeatureState({ source: SOURCE_ID, id: next }, { selected: true });
    appliedLgdRef.current = next;
  }, [getMap]);

  useEffect(() => {
    syncSelected();
  }, [selected, districtToLgd, syncSelected]);

  /* ----- framing ----- */

  /** Fits every polygon (all 36, including the grey no-data one) inside the current canvas. */
  const fit = useCallback(
    (animate: boolean) => {
      const map = mapRef.current;
      const el = wrapRef.current;
      if (!map || !el || !bounds) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 50 || h < 50) return;
      map.resize();
      const side = Math.min(40, Math.round(w * 0.06));
      map.fitBounds(bounds, {
        padding: { top: Math.min(40, Math.round(h * 0.06)), bottom: Math.min(96, Math.round(h * 0.2)), left: side, right: side },
        duration: animate ? 600 : 0,
      });
    },
    [bounds],
  );

  // Keep the canvas sized to its container (panel collapse, fullscreen, window resize) and keep the
  // whole state framed until the person pans or zooms themselves.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
      if (!userMoved.current) fit(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      mapRef.current?.resize();
      if (!userMoved.current) fit(false);
    }, 320);
    return () => window.clearTimeout(t);
  }, [layoutKey, fit]);

  /* ----- pointer events ----- */

  // Mouse move: only record the latest position; the controller hit-tests at most once per frame.
  const handleMove = useCallback((e: MapLayerMouseEvent) => hover.move(e.point.x, e.point.y), [hover]);

  // Click: a fresh hit-test at the click's own coordinates — never the hover state.
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const hit = pickAt(e.target as unknown as HoverMap, e.point.x, e.point.y);
      if (hit && hit.kind === "district") {
        const next = hit.name === selectedRef.current ? null : hit.name;
        desiredLgdRef.current = next === null ? null : hit.fid; // outline now, before React re-renders
        syncSelected();
        onSelectRef.current(next);
      } else {
        desiredLgdRef.current = null;
        syncSelected();
        onSelectRef.current(null);
      }
    },
    [syncSelected],
  );

  const stopAutoFit = () => {
    userMoved.current = true;
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <MapGL
        ref={mapRef}
        mapStyle={BASE_STYLE}
        initialViewState={bounds ? { bounds, fitBoundsOptions: { padding: { top: 40, bottom: 90, left: 40, right: 40 } } } : { longitude: 76.5, latitude: 19.5, zoom: 5 }}
        minZoom={3}
        maxZoom={12}
        attributionControl={{ compact: true }}
        dragRotate={false}
        touchPitch={false}
        onLoad={() => {
          fit(false);
          syncSelected();
        }}
        onSourceData={() => {
          if (appliedLgdRef.current !== desiredLgdRef.current) syncSelected();
        }}
        onMoveStart={(e) => {
          // Only gestures (drag, wheel, pinch) carry an original event; programmatic fits do not.
          if ((e as { originalEvent?: unknown }).originalEvent) stopAutoFit();
          hover.interrupt();
        }}
        onMoveEnd={() => hover.settle()}
        onMouseMove={handleMove}
        onMouseOut={() => hover.leave()}
        onClick={handleClick}
        style={{ width: "100%", height: "100%" }}
      >
        {/* tolerance 0: geometry is drawn exactly as supplied, so small exclaves are never simplified away.
            The no-data source is added first so it sits underneath every outline of the matched districts. */}
        <Source id={NODATA_SOURCE_ID} type="geojson" data={prepared.noData} tolerance={0} promoteId={PROMOTE_ID}>
          <Layer {...nodataFillLayer} />
          <Layer {...nodataLineLayer} />
        </Source>
        <Source id={SOURCE_ID} type="geojson" data={prepared.matched} tolerance={0} promoteId={PROMOTE_ID}>
          <Layer {...fillLayer} />
          <Layer {...lineLayer} />
          <Layer {...hoverLayer} />
          <Layer {...selectedLayer} />
        </Source>
      </MapGL>

      <div className="absolute left-3 top-3 z-10 flex flex-col divide-y divide-[#E2E8F0] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <ControlButton label="Zoom in" onClick={() => { stopAutoFit(); mapRef.current?.zoomIn({ duration: 250 }); }}>
          <ZoomIn size={16} />
        </ControlButton>
        <ControlButton label="Zoom out" onClick={() => { stopAutoFit(); mapRef.current?.zoomOut({ duration: 250 }); }}>
          <ZoomOut size={16} />
        </ControlButton>
        <ControlButton label="Reset view" onClick={() => { userMoved.current = false; fit(true); }}>
          <LocateFixed size={16} />
        </ControlButton>
        <ControlButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </ControlButton>
      </div>

      <div className="pointer-events-none absolute bottom-7 right-3 z-10 rounded-md border border-[#E2E8F0] bg-white/90 px-2 py-1 text-[9px] text-[#64748B] shadow-sm">
        District boundaries: 2011 reference vintage · not survey-grade
      </div>

      <TooltipLayer ref={tooltipRef} view={view} hostRef={wrapRef} />
    </div>
  );
}


// ==================== src/components/HoverTooltip.tsx ====================
const EXTRA: MetricKey[] = ["tmax_mean_c", "tmin_mean_c", "heatwave_days", "severe_heatwave_days", "warm_nights"];

const W = 244;

/** Card content for a district with climate data. Positioning is handled by TooltipLayer. */
export function HoverTooltip({ view, name, lgd }: { view: AtlasView; name: string; lgd: number | null }) {
  const { data, metric, mode, period, values, scale } = view;
  const value = values.get(name) ?? null;
  const extras = EXTRA.filter((k) => k !== metric && METRIC_KEYS.includes(k))
    .map((k) => ({ k, v: metricForDistrict(data, name, k, period) }))
    .filter((r): r is { k: MetricKey; v: number } => r.v !== null);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-[#1E293B]">{name}</p>
      <p className="text-[10px] text-[#64748B]">
        {lgd !== null ? `LGD ${lgd} · ` : ""}
        {mode === "year" ? `Year ${period.start}` : `Period ${periodLabel(period)}`}
      </p>

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-2 py-1.5">
        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: colorFor(scale, value) }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] text-[#64748B]">{METRIC_BY_KEY[metric].label}</p>
          <p className="text-sm font-bold tabular-nums text-[#1E293B]">{formatWithUnit(metric, value, mode)}</p>
        </div>
      </div>

      {extras.length > 0 ? (
        <dl className="mt-2 space-y-1">
          {extras.map(({ k, v }) => (
            <div key={k} className="flex justify-between text-[11px]">
              <dt className="text-[#64748B]">{METRIC_BY_KEY[k].short}</dt>
              <dd className="font-medium tabular-nums text-[#1E293B]">{formatWithUnit(k, v, mode)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** Card content for a boundary polygon that has no climate dataset (Palghar). */
export function NoDataTooltip({ name, lgd }: { name: string; lgd: number | null }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-[#1E293B]">{name}</p>
      {lgd !== null ? <p className="text-[10px] text-[#64748B]">LGD {lgd}</p> : null}
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-2 py-1.5">
        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: NO_DATA_COLOR }} />
        <p className="text-[11px] text-[#64748B]">Climate data unavailable for this district.</p>
      </div>
    </div>
  );
}

export interface TooltipHandle {
  /** New hovered polygon: render its content (synchronously) and position it. */
  show: (target: TooltipTarget, x: number, y: number) => void;
  /** Same polygon, pointer moved: update position only — a direct DOM write, no React render. */
  move: (x: number, y: number) => void;
  hide: () => void;
}

interface TooltipLayerProps {
  view: AtlasView;
  hostRef: RefObject<HTMLDivElement>;
}

/**
 * Owns the tooltip's React state. It renders only when the hovered polygon (or the data view) changes;
 * pointer movement inside one district moves the element with `transform`, bypassing React entirely.
 * The element is `pointer-events-none`, so it can never intercept map mouse events.
 */
export const TooltipLayer = forwardRef<TooltipHandle, TooltipLayerProps>(function TooltipLayer({ view, hostRef }, ref) {
  const [target, setTarget] = useState<TooltipTarget | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  const place = useCallback(() => {
    const el = elRef.current;
    const host = hostRef.current;
    if (!el || !host) return;
    const { x, y } = pos.current;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const left = x + 16 + tw > host.clientWidth ? x - 16 - tw : x + 16;
    const top = Math.min(y + 12, host.clientHeight - th - 8);
    el.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
    el.style.visibility = "visible";
  }, [hostRef]);

  // Runs before paint, so a new tooltip never flashes at the wrong position.
  useLayoutEffect(() => {
    if (target) place();
  }, [target, view, place]);

  useImperativeHandle(
    ref,
    () => ({
      show(t, x, y) {
        pos.current = { x, y };
        flushSync(() => setTarget(t)); // called from an animation frame, never during a React render
      },
      move(x, y) {
        pos.current = { x, y };
        place();
      },
      hide() {
        if (elRef.current) elRef.current.style.visibility = "hidden"; // gone this instant …
        setTarget(null); // … and unmounted on the next commit
      },
    }),
    [place],
  );

  if (!target) return null;
  return (
    <div ref={elRef} className="pointer-events-none absolute left-0 top-0 z-20" style={{ width: W, visibility: "hidden", willChange: "transform" }}>
      {target.kind === "nodata" ? <NoDataTooltip name={target.name} lgd={target.lgd} /> : <HoverTooltip view={view} name={target.name} lgd={target.lgd} />}
    </div>
  );
});


// ==================== src/components/MapLegend.tsx ====================
export function MapLegend({ view, hasNoData }: { view: AtlasView; hasNoData: boolean }) {
  const { metric, mode, period, scale } = view;
  const cfg = METRIC_BY_KEY[metric];
  const suffix = unitSuffix(metric, mode);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-10 w-[min(440px,calc(100%-24px))] rounded-xl border border-[#E2E8F0] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="truncate text-[11px] font-semibold text-[#1E293B]">
          {cfg.label} <span className="font-normal text-[#64748B]">· {periodLabel(period)}</span>
        </p>
        <p className="shrink-0 text-[10px] text-[#64748B]">{aggregationNote(metric, mode)}</p>
      </div>

      {scale.bins.length === 0 ? (
        <p className="text-[11px] text-[#64748B]">No values available for this selection.</p>
      ) : scale.uniform ? (
        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
          <span className="h-2.5 w-8 rounded-sm" style={{ backgroundColor: scale.bins[0].color }} />
          Same value in every district: <b className="text-[#1E293B]">{formatValue(metric, scale.min)}{suffix}</b>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="grid flex-1 grid-cols-6 gap-0.5">
            {scale.bins.map((b) => (
              <div key={b.label} title={`${b.label}: ${formatValue(metric, b.from)} – ${formatValue(metric, b.to)}${suffix}`}>
                <div className="h-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                <p className="mt-1 text-center text-[9px] tabular-nums leading-none text-[#64748B]">{formatValue(metric, b.from)}</p>
              </div>
            ))}
          </div>
          <p className="pt-3 text-[9px] tabular-nums leading-none text-[#64748B]">
            {formatValue(metric, scale.max)}
            {suffix.trim().startsWith("°") ? "°" : ""}
          </p>
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#64748B]">
        <span>Very low → Very high · equal intervals</span>
        {hasNoData ? (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: NO_DATA_COLOR }} /> No data
          </span>
        ) : null}
      </div>
    </div>
  );
}


// ==================== src/components/MapPlaceholder.tsx ====================
export function MapPlaceholder({ loading, message }: { loading: boolean; message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F8FAFC]">
      <div
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div className="relative max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <MapIcon size={22} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[#1E293B]">
          {loading ? "Loading district boundaries…" : "District boundaries not loaded"}
        </h2>
        {loading ? null : (
          <>
            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              The Maharashtra district boundaries could not be loaded from
            </p>
            <code className="mt-1.5 inline-block rounded-md bg-[#F1F5F9] px-2 py-1 text-[11px] text-[#1E293B]">{GEOJSON_URL}</code>
            <p className="mt-3 text-xs leading-5 text-[#64748B]">
              No map is drawn until the real boundary file is available. Filters, ranking, trends, comparison and CSV export all work from the
              climate dataset in the meantime.
            </p>
            {message ? <p className="mt-3 text-[10px] text-[#94A3B8]">{message}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}


// ==================== src/components/DistrictDetail.tsx ====================
const INDICATORS: MetricKey[] = ["heatwave_days", "severe_heatwave_days", "warm_nights", "days_tmax_40c_or_more", "days_tmax_45c_or_more", "days_tmax_above_p90"];

interface DistrictDetailProps {
  view: AtlasView;
  district: string | null;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: (d: string) => void;
  onExportRecords: (d: string) => void;
}

export function DistrictDetail({ view, district, inCompare, compareFull, onToggleCompare, onExportRecords }: DistrictDetailProps) {
  const { data, metric, mode, period, values, scale } = view;
  const cfg = METRIC_BY_KEY[metric];

  const series = useMemo(() => (district ? annualSeries(data, district, metric) : []), [data, district, metric]);
  const stats = useMemo(() => periodStats(series, period), [series, period]);
  const trend = useMemo(() => trendPerDecade(series, period), [series, period]);
  const yoy = useMemo(() => yearOverYear(series, period.end), [series, period.end]);
  const deltas = useMemo(() => yoyDeltas(series, period), [series, period]);
  const peakHeat = useMemo(() => {
    if (!district) return null;
    return periodStats(annualSeries(data, district, "heatwave_days"), period);
  }, [data, district, period]);

  if (!district) {
    return <EmptyState title="Select a district" body="Click a district on the map, or pick one from the list, to see its history, extremes and heatwave indicators." />;
  }

  const value = values.get(district) ?? null;
  const rank = descendingRank(values, district);
  const stateMean = mean(validValues(values));
  const vsState = value !== null && stateMean !== null ? value - stateMean : null;
  const info = data.districts.find((d) => d.name === district);
  const hasSeries = series.some((p) => p.value !== null);
  const tooFewForTrend = trend === null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[#1E293B]">{district}</h2>
          <p className="text-[11px] text-[#64748B]">
            {info?.lgd !== null && info?.lgd !== undefined ? `LGD ${info.lgd} · ` : ""}
            {cfg.label} · {mode === "year" ? `Year ${period.start}` : periodLabel(period)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onToggleCompare(district)}
            disabled={!inCompare && compareFull}
            title={inCompare ? "Remove from comparison" : compareFull ? "Comparison is full (4)" : "Add to comparison"}
            className="rounded-md border border-[#E2E8F0] p-1.5 text-[#64748B] transition hover:border-[#14B8A6] hover:text-[#14B8A6] disabled:opacity-40 aria-pressed:border-[#14B8A6] aria-pressed:text-[#14B8A6]"
            aria-pressed={inCompare}
            aria-label="Toggle comparison"
          >
            <GitCompare size={14} />
          </button>
          <button
            type="button"
            onClick={() => onExportRecords(district)}
            title="Download this district's source records (CSV)"
            aria-label="Download district records"
            className="rounded-md border border-[#E2E8F0] p-1.5 text-[#64748B] transition hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3" style={{ borderLeft: `4px solid ${colorFor(scale, value)}` }}>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wide text-[#64748B]">{mode === "year" ? "Value" : "Period value"}</p>
          <p className="text-2xl font-bold tabular-nums text-[#1E293B]">{formatWithUnit(metric, value, mode)}</p>
        </div>
        <div className="text-right text-[11px] text-[#64748B]">
          {rank ? <p>Rank <b className="text-[#1E293B]">#{rank.rank}</b> of {rank.total}</p> : null}
          {vsState !== null ? <p>{formatDelta(metric, vsState)}{unitSuffix(metric, mode).trim().startsWith("°") ? " °C" : ""} vs district mean</p> : null}
        </div>
      </div>

      <section>
        <SectionLabel className="mb-2">Historical annual trend · {cfg.short}</SectionLabel>
        {hasSeries ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [typeof v === "number" ? formatWithUnit(metric, v, "year") : "—", cfg.short]} labelFormatter={(y) => `Year ${y}`} />
                {mode === "range" || period.start !== period.end ? (
                  <ReferenceArea x1={period.start} x2={period.end} fill="#0EA5E9" fillOpacity={0.07} strokeOpacity={0} />
                ) : (
                  <ReferenceArea x1={period.start} x2={period.start} stroke="#0EA5E9" strokeOpacity={0.6} />
                )}
                <Area type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} fill="url(#detailFill)" connectNulls={false} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-[#64748B]">No annual values available for this metric.</p>
        )}
        <p className="mt-1 text-[10px] text-[#64748B]">Shaded band = selected period. Chart always shows the full record.</p>
      </section>

      <section>
        <SectionLabel className="mb-2">Range within {periodLabel(period)}</SectionLabel>
        {stats ? (
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Minimum" value={formatWithUnit(metric, stats.min, "year")} sub={`in ${stats.minYear}`} />
            <Stat label="Maximum" value={formatWithUnit(metric, stats.max, "year")} sub={`in ${stats.maxYear}`} />
            <Stat label="Mean" value={formatWithUnit(metric, stats.mean, "year")} sub={`${stats.count} year${stats.count === 1 ? "" : "s"}`} />
            <Stat
              label="Linear trend"
              value={
                tooFewForTrend ? (
                  <span className="flex items-center gap-1 text-[#64748B]"><Minus size={12} /> n/a</span>
                ) : (
                  <span className="flex items-center gap-1">
                    {trend > 0 ? <TrendingUp size={13} className="text-[#ED8759]" /> : <TrendingDown size={13} className="text-[#0EA5E9]" />}
                    {formatDelta(metric, trend)}
                  </span>
                )
              }
              sub={tooFewForTrend ? "needs ≥ 5 years" : `${cfg.unit} per decade`}
            />
          </div>
        ) : (
          <p className="text-xs text-[#64748B]">No values in this period.</p>
        )}
      </section>

      <section>
        <SectionLabel className="mb-2">Heatwave indicators · {periodLabel(period)}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {INDICATORS.map((k) => {
            const v = metricForDistrict(data, district, k, period);
            return <Stat key={k} label={METRIC_BY_KEY[k].short} value={v === null ? "—" : formatValue(k, v)} sub={mode === "range" ? `${METRIC_BY_KEY[k].unit}/yr avg` : METRIC_BY_KEY[k].unit} />;
          })}
        </div>
        {peakHeat && peakHeat.max > 0 ? (
          <p className="mt-2 text-[11px] text-[#64748B]">
            Peak heatwave year in period: <b className="text-[#1E293B]">{peakHeat.maxYear}</b> ({peakHeat.max} days).
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-[#64748B]">No heatwave days recorded in this period.</p>
        )}
      </section>

      <section>
        <SectionLabel className="mb-2">Year-over-year</SectionLabel>
        {yoy ? (
          <div className="rounded-xl border border-[#E2E8F0] p-3 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-[#64748B]">{yoy.previousYear} → {yoy.year}</span>
              <span className="font-semibold tabular-nums text-[#1E293B]">
                {formatDelta(metric, yoy.delta)} {cfg.unit}
                {yoy.pct !== null ? <span className="ml-1 font-normal text-[#64748B]">({yoy.pct > 0 ? "+" : yoy.pct < 0 ? "−" : ""}{Math.abs(yoy.pct).toFixed(1)}%)</span> : null}
              </span>
            </div>
            <div className="mt-1 flex justify-between tabular-nums text-[#64748B]">
              <span>{formatWithUnit(metric, yoy.previous, "year")}</span>
              <span>{formatWithUnit(metric, yoy.current, "year")}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#64748B]">Year-over-year needs values for both {period.end - 1} and {period.end}.</p>
        )}
        {deltas.length > 1 ? (
          <div className="mt-2 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deltas} margin={{ top: 2, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [typeof v === "number" ? formatDelta(metric, v) : "—", "Change"]} labelFormatter={(y) => `${Number(y) - 1} → ${y}`} />
                <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
                  {deltas.map((d) => (
                    <Cell key={d.year} fill={d.delta >= 0 ? "#ED8759" : "#8DD3E8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </section>
    </div>
  );
}


// ==================== src/components/RankingPanel.tsx ====================
interface RankingPanelProps {
  view: AtlasView;
  selected: string | null;
  onSelect: (d: string) => void;
}

export function RankingPanel({ view, selected, onSelect }: RankingPanelProps) {
  const { metric, mode, period, values, scale } = view;
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const rows = useMemo(() => rankDistricts(values, dir), [values, dir]);
  const span = scale.max - scale.min;
  const DirIcon = dir === "desc" ? ArrowDown : ArrowUp;

  return (
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B]">District ranking</h2>
          <p className="text-[11px] text-[#64748B]">
            {METRIC_BY_KEY[metric].label} · {mode === "year" ? `Year ${period.start}` : periodLabel(period)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDir(dir === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2 py-1 text-[11px] font-medium text-[#64748B] transition hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
        >
          <DirIcon size={12} />
          {dir === "desc" ? "Highest first" : "Lowest first"}
        </button>
      </div>

      <ol className="space-y-0.5">
        {rows.map((r) => {
          const pct = r.value === null ? 0 : scale.uniform || span === 0 ? 100 : 12 + ((r.value - scale.min) / span) * 88;
          return (
            <li key={r.name}>
              <button
                type="button"
                onClick={() => onSelect(r.name)}
                className={cn("w-full rounded-md px-2 py-1.5 text-left transition hover:bg-[#F8FAFC]", selected === r.name && "bg-[#0EA5E9]/10")}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-5 shrink-0 text-right tabular-nums text-[#64748B]">{r.rank ?? "–"}</span>
                  <span className="truncate font-medium text-[#1E293B]">{r.name}</span>
                  <span className="ml-auto shrink-0 tabular-nums font-semibold text-[#1E293B]">
                    {formatValue(metric, r.value)}
                    <span className="ml-0.5 text-[10px] font-normal text-[#64748B]">{r.value === null ? "" : unitSuffix(metric, mode).trim()}</span>
                  </span>
                </div>
                <div className="ml-7 mt-1 h-1 rounded-full bg-[#F1F5F9]">
                  <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: colorFor(scale, r.value) }} />
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}


// ==================== src/components/TrendsPanel.tsx ====================
interface TrendRow {
  year: number;
  state: number | null;
  district: number | null;
}

export function TrendsPanel({ view, selected }: { view: AtlasView; selected: string | null }) {
  const { data, metric, period } = view;
  const cfg = METRIC_BY_KEY[metric];

  const state = useMemo(() => stateSeries(data, metric), [data, metric]);
  const dist = useMemo(() => (selected ? annualSeries(data, selected, metric) : null), [data, selected, metric]);
  const rows: TrendRow[] = useMemo(
    () => state.map((p, i) => ({ year: p.year, state: p.value, district: dist ? dist[i].value : null })),
    [state, dist],
  );
  const decades = useMemo(() => decadeMeans(state), [state]);
  const stats = useMemo(() => periodStats(state, period), [state, period]);
  const trend = useMemo(() => trendPerDecade(state, period), [state, period]);
  const decMin = Math.min(...decades.map((d) => d.value));
  const decMax = Math.max(...decades.map((d) => d.value));

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-bold text-[#1E293B]">Historical trends</h2>
        <p className="text-[11px] text-[#64748B]">{cfg.label} · mean across all districts{selected ? ` vs ${selected}` : ""}</p>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 6, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} minTickGap={28} />
            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(y) => `Year ${y}`} formatter={(v, name) => [typeof v === "number" ? formatWithUnit(metric, v, "year") : "—", name]} />
            <ReferenceArea x1={period.start} x2={period.end} fill="#0EA5E9" fillOpacity={0.07} strokeOpacity={0} />
            <Line name="All-district mean" type="monotone" dataKey="state" stroke="#64748B" strokeWidth={2} dot={false} connectNulls={false} />
            {selected ? <Line name={selected} type="monotone" dataKey="district" stroke="#0EA5E9" strokeWidth={2} dot={false} connectNulls={false} /> : null}
            {selected ? <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} /> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={`Mean ${periodLabel(period)}`} value={stats ? formatWithUnit(metric, stats.mean, "year") : "—"} sub="all districts" />
        <Stat label="Linear trend" value={trend === null ? "n/a" : `${formatDelta(metric, trend)} ${cfg.unit}`} sub={trend === null ? "needs ≥ 5 years" : "per decade, all-district mean"} />
      </div>

      <section>
        <SectionLabel className="mb-2">Decade means · all districts</SectionLabel>
        <ul className="space-y-1.5">
          {decades.map((d) => {
            const span = decMax - decMin;
            const pct = span === 0 ? 100 : 15 + ((d.value - decMin) / span) * 85;
            return (
              <li key={d.label} className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 tabular-nums text-[#64748B]">{d.label}</span>
                <div className="h-2 flex-1 rounded-full bg-[#F1F5F9]">
                  <div className="h-2 rounded-full bg-[#0EA5E9]/70" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-[#1E293B]">{formatValue(metric, d.value)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-[#64748B]">The 1950s bar covers 1951–1959 only ({decades[0]?.years ?? 0} years); the 2020s bar covers 2020–2024.</p>
      </section>
    </div>
  );
}


// ==================== src/components/ComparePanel.tsx ====================
export const COMPARE_COLORS = ["#0EA5E9", "#14B8A6", "#8B5CF6", "#E11D48"] as const;

interface CompareRow {
  year: number;
  [district: string]: number | null;
}

interface ComparePanelProps {
  view: AtlasView;
  compare: string[];
  max: number;
  onAdd: (d: string) => void;
  onRemove: (d: string) => void;
}

export function ComparePanel({ view, compare, max, onAdd, onRemove }: ComparePanelProps) {
  const { data, metric, mode, period } = view;
  const cfg = METRIC_BY_KEY[metric];

  const rows: CompareRow[] = useMemo(() => {
    const all = compare.map((d) => annualSeries(data, d, metric));
    return data.years.map((year, i) => {
      const row: CompareRow = { year };
      compare.forEach((d, j) => {
        row[d] = all[j][i].value;
      });
      return row;
    });
  }, [data, compare, metric]);

  const table = useMemo(
    () =>
      compare.map((d) => {
        const s = annualSeries(data, d, metric);
        return { name: d, value: metricForDistrict(data, d, metric, period), stats: periodStats(s, period), trend: trendPerDecade(s, period) };
      }),
    [data, compare, metric, period],
  );

  const available = data.districts.filter((d) => !compare.includes(d.name));

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-bold text-[#1E293B]">Compare districts</h2>
        <p className="text-[11px] text-[#64748B]">
          {cfg.label} · {mode === "year" ? `Year ${period.start}` : periodLabel(period)} · up to {max} districts
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {compare.map((d, i) => (
          <span key={d} className="flex items-center gap-1.5 rounded-full border border-[#E2E8F0] py-0.5 pl-2 pr-1 text-xs font-medium text-[#1E293B]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }} />
            {d}
            <button type="button" onClick={() => onRemove(d)} aria-label={`Remove ${d}`} className="rounded-full p-0.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      {compare.length < max ? (
        <select
          value=""
          onChange={(e) => e.target.value && onAdd(e.target.value)}
          aria-label="Add district to comparison"
          className={selectClass}
        >
          <option value="">Add a district…</option>
          {available.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      ) : null}

      {compare.length === 0 ? (
        <div className="h-48">
          <EmptyState title="No districts chosen" body="Add districts here, use the + button in the district list, or the compare icon in a district's detail view." />
        </div>
      ) : (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 4, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(y) => `Year ${y}`} formatter={(v, name) => [typeof v === "number" ? formatWithUnit(metric, v, "year") : "—", name]} />
                <ReferenceArea x1={period.start} x2={period.end} fill="#0EA5E9" fillOpacity={0.06} strokeOpacity={0} />
                {compare.map((d, i) => (
                  <Line key={d} name={d} type="monotone" dataKey={d} stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]} strokeWidth={2} dot={false} connectNulls={false} />
                ))}
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-[11px]">
              <thead className="bg-[#F8FAFC] text-[#64748B]">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">District</th>
                  <th className="px-2 py-1.5 text-right font-medium">{mode === "year" ? "Value" : "Period"}</th>
                  <th className="px-2 py-1.5 text-right font-medium">Min</th>
                  <th className="px-2 py-1.5 text-right font-medium">Max</th>
                  <th className="px-2 py-1.5 text-right font-medium">/decade</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-[#1E293B]">
                {table.map((r, i) => (
                  <tr key={r.name} className="border-t border-[#E2E8F0]">
                    <td className="px-2 py-1.5 font-medium">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }} />
                      {r.name}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold">{formatValue(metric, r.value)}</td>
                    <td className="px-2 py-1.5 text-right text-[#64748B]">{r.stats ? formatValue(metric, r.stats.min) : "—"}</td>
                    <td className="px-2 py-1.5 text-right text-[#64748B]">{r.stats ? formatValue(metric, r.stats.max) : "—"}</td>
                    <td className="px-2 py-1.5 text-right text-[#64748B]">{r.trend === null ? "—" : formatDelta(metric, r.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


// ==================== src/components/PeriodComparePanel.tsx ====================
export interface PeriodPair {
  a: Period;
  b: Period;
}

interface PeriodComparePanelProps {
  view: AtlasView;
  pair: PeriodPair;
  onPair: (p: PeriodPair) => void;
  selected: string | null;
  onSelect: (d: string) => void;
}

function PeriodPicker({ label, years, value, onChange }: { label: string; years: number[]; value: Period; onChange: (p: Period) => void }) {
  return (
    <div>
      <SectionLabel className="mb-1">{label}</SectionLabel>
      <div className="grid grid-cols-2 gap-1.5">
        <select aria-label={`${label} start`} className={selectClass} value={value.start} onChange={(e) => { const s = Number(e.target.value); onChange({ start: s, end: Math.max(s, value.end) }); }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select aria-label={`${label} end`} className={selectClass} value={value.end} onChange={(e) => { const en = Number(e.target.value); onChange({ start: Math.min(en, value.start), end: en }); }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

export function PeriodComparePanel({ view, pair, onPair, selected, onSelect }: PeriodComparePanelProps) {
  const { data, metric } = view;
  const cfg = METRIC_BY_KEY[metric];
  const suffix = unitSuffix(metric, "range").trim();

  const rows = useMemo(() => {
    const a = metricByDistrict(data, metric, pair.a);
    const b = metricByDistrict(data, metric, pair.b);
    const list = data.districts.map((d) => {
      const va = a.get(d.name) ?? null;
      const vb = b.get(d.name) ?? null;
      return { name: d.name, a: va, b: vb, delta: va !== null && vb !== null ? vb - va : null };
    });
    list.sort((x, y) => (y.delta ?? -Infinity) - (x.delta ?? -Infinity));
    return { list, meanA: mean(validValues(a)), meanB: mean(validValues(b)) };
  }, [data, metric, pair]);

  const stateDelta = rows.meanA !== null && rows.meanB !== null ? rows.meanB - rows.meanA : null;
  const maxAbs = Math.max(0.0001, ...rows.list.map((r) => Math.abs(r.delta ?? 0)));

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-bold text-[#1E293B]">Year range comparison</h2>
        <p className="text-[11px] text-[#64748B]">{cfg.label} · period B minus period A</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PeriodPicker label="Period A" years={data.years} value={pair.a} onChange={(a) => onPair({ ...pair, a })} />
        <PeriodPicker label="Period B" years={data.years} value={pair.b} onChange={(b) => onPair({ ...pair, b })} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={`A · ${periodLabel(pair.a)}`} value={formatValue(metric, rows.meanA)} sub="district mean" />
        <Stat label={`B · ${periodLabel(pair.b)}`} value={formatValue(metric, rows.meanB)} sub="district mean" />
        <Stat label="Change" value={formatDelta(metric, stateDelta)} sub={suffix} />
      </div>

      <ul className="space-y-0.5">
        {rows.list.map((r) => {
          const w = r.delta === null ? 0 : (Math.abs(r.delta) / maxAbs) * 50;
          return (
            <li key={r.name}>
              <button type="button" onClick={() => onSelect(r.name)} className={cn("w-full rounded-md px-2 py-1.5 text-left hover:bg-[#F8FAFC]", selected === r.name && "bg-[#0EA5E9]/10")}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-[#1E293B]">{r.name}</span>
                  <span className="shrink-0 tabular-nums text-[#64748B]">
                    {formatValue(metric, r.a)} → {formatValue(metric, r.b)}
                    <b className="ml-2 inline-block w-12 text-right text-[#1E293B]">{formatDelta(metric, r.delta)}</b>
                  </span>
                </div>
                <div className="relative mt-1 h-1 rounded-full bg-[#F1F5F9]">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[#CBD5E1]" />
                  {r.delta !== null ? (
                    <div
                      className="absolute h-1 rounded-full"
                      style={{ width: `${w}%`, left: r.delta >= 0 ? "50%" : `${50 - w}%`, backgroundColor: r.delta >= 0 ? "#ED8759" : "#8DD3E8" }}
                    />
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-[#64748B]">Sorted by largest increase. Count metrics are average {cfg.unit} per year in each period.</p>
    </div>
  );
}


// ==================== src/components/InsightDrawer.tsx ====================
const TABS: { id: DrawerTab; label: string }[] = [
  { id: "district", label: "District" },
  { id: "ranking", label: "Ranking" },
  { id: "trends", label: "Trends" },
  { id: "compare", label: "Compare" },
  { id: "periods", label: "Periods" },
];

interface InsightDrawerProps {
  view: AtlasView;
  tab: DrawerTab;
  onTab: (t: DrawerTab) => void;
  onClose: () => void;
  selected: string | null;
  onSelect: (d: string) => void;
  compare: string[];
  maxCompare: number;
  onToggleCompare: (d: string) => void;
  pair: PeriodPair;
  onPair: (p: PeriodPair) => void;
  onExportRecords: (d: string) => void;
}

export function InsightDrawer(props: InsightDrawerProps) {
  const { view, tab, onTab, onClose, selected, onSelect, compare, maxCompare, onToggleCompare, pair, onPair, onExportRecords } = props;

  let body: ReactNode;
  switch (tab) {
    case "district":
      body = (
        <DistrictDetail
          view={view}
          district={selected}
          inCompare={selected !== null && compare.includes(selected)}
          compareFull={compare.length >= maxCompare}
          onToggleCompare={onToggleCompare}
          onExportRecords={onExportRecords}
        />
      );
      break;
    case "ranking":
      body = <RankingPanel view={view} selected={selected} onSelect={onSelect} />;
      break;
    case "trends":
      body = <TrendsPanel view={view} selected={selected} />;
      break;
    case "compare":
      body = <ComparePanel view={view} compare={compare} max={maxCompare} onAdd={onToggleCompare} onRemove={onToggleCompare} />;
      break;
    case "periods":
      body = <PeriodComparePanel view={view} pair={pair} onPair={onPair} selected={selected} onSelect={onSelect} />;
      break;
  }

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute bottom-3 right-3 top-3 z-20 flex w-[380px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
      aria-label="District insights"
    >
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] px-2 py-1.5">
        <div className="flex flex-1 gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition",
                tab === t.id ? "bg-[#0EA5E9]/10 text-[#0EA5E9]" : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Close panel" className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]">
          <X size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </motion.aside>
  );
}


// ==================== src/hooks/useAtlasData.ts ====================
// Source-relative asset URLs are bundled by Vite and work with both / and /BN-Website/ deployments.
export const CLIMATE_URL = new URL("./dataset/maharastra-climate/climate_temperature_district.json", import.meta.url).href;
export const GEOJSON_URL = new URL("./dataset/maharastra-climate/maharashtra-districts.geojson", import.meta.url).href;

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}.`);
  const text = await res.text();
  // Vite's dev server answers unknown paths with index.html — treat that as "missing".
  if (text.trimStart().startsWith("<")) throw new Error(`${url} was not found.`);
  return text;
}

function useLoader<T>(url: string, parse: (text: string) => T): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "loading" });
    fetchText(url, ctrl.signal)
      .then((text) => {
        if (ctrl.signal.aborted) return;
        setState({ status: "ready", value: parse(text) });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error." });
      });
    return () => ctrl.abort();
    // `parse` is a module-level function, stable by construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
}

const parseClimate = (text: string): AtlasData => buildAtlasData(parseRecords(JSON.parse(text)));
const parseGeoText = (text: string): GeoCollection => parseGeo(text);

/** Boundaries come only from the local GeoJSON file; there is no remote or substitute fallback. */
export function useAtlasData(): { climate: LoadState<AtlasData>; geo: LoadState<GeoCollection> } {
  const climate = useLoader(CLIMATE_URL, parseClimate);
  const geo = useLoader(GEOJSON_URL, parseGeoText);
  return { climate, geo };
}


// ==================== src/pages/Home.tsx ====================
const MAX_COMPARE = 4;

function useFullscreen(): [boolean, () => void] {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  }, []);
  return [active, toggle];
}

function initialFilters(data: AtlasData): FilterState {
  return {
    metric: "tmax_mean_c",
    mode: "range",
    year: data.yearMax,
    range: { start: data.yearMin, end: data.yearMax },
    search: "",
  };
}

function defaultPair(data: AtlasData): PeriodPair {
  const clamp = (p: Period): Period => ({ start: Math.max(p.start, data.yearMin), end: Math.min(p.end, data.yearMax) });
  return { a: clamp({ start: 1951, end: 1980 }), b: clamp({ start: 2011, end: 2024 }) };
}

function Atlas({ data, geoState }: { data: AtlasData; geoState: LoadState<GeoCollection> }) {
  const [filters, setFilters] = useState<FilterState>(() => initialFilters(data));
  const [selected, setSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [tab, setTab] = useState<DrawerTab | null>(null);
  const [panelOpen, setPanelOpen] = useState<boolean>(() => window.innerWidth >= 1024);
  const [pair, setPair] = useState<PeriodPair>(() => defaultPair(data));
  const [isFullscreen, toggleFullscreen] = useFullscreen();

  const period: Period = useMemo(
    () => (filters.mode === "year" ? { start: filters.year, end: filters.year } : filters.range),
    [filters.mode, filters.year, filters.range],
  );

  const values = useMemo(() => metricByDistrict(data, filters.metric, period), [data, filters.metric, period]);
  const scale = useMemo(() => buildScale(validValues(values)), [values]);
  const view: AtlasView = useMemo(
    () => ({ data, metric: filters.metric, mode: filters.mode, period, values, scale }),
    [data, filters.metric, filters.mode, period, values, scale],
  );

  const geo = geoState.status === "ready" ? geoState.value : null;
  const match = useMemo(() => (geo ? matchFeatures(geo, data.districts) : null), [geo, data.districts]);
  const hasNoData = useMemo(
    () => [...values.values()].some((v) => v === null) || (match?.unmatchedFeatures.length ?? 0) > 0,
    [values, match],
  );

  const patchFilters = useCallback((patch: Partial<FilterState>) => setFilters((f) => ({ ...f, ...patch })), []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters(data));
    setSelected(null);
    setTab((t) => (t === "district" ? null : t));
  }, [data]);

  /** Selecting from the map or district list opens the district drawer. */
  const selectAndOpen = useCallback((d: string | null) => {
    setSelected(d);
    setTab((t) => (d ? "district" : t === "district" ? null : t));
  }, []);

  const toggleCompare = useCallback((d: string) => {
    setCompare((c) => (c.includes(d) ? c.filter((x) => x !== d) : c.length >= MAX_COMPARE ? c : [...c, d]));
  }, []);

  const toggleTool = useCallback((t: DrawerTab) => setTab((cur) => (cur === t ? null : t)), []);

  const setLayerMetric = useCallback((metric: FilterState["metric"]) => patchFilters({ metric }), [patchFilters]);

  const coverage = geo && match ? `${match.matched.size}/${data.districts.length} districts joined to boundaries by LGD code` : `${data.districts.length} districts · ${data.yearMin}–${data.yearMax}`;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-[#1E293B]">
      <TopNav
        metric={filters.metric}
        onLayer={setLayerMetric}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
        drawerTab={tab}
        onTool={toggleTool}
        compareCount={compare.length}
        onExport={() => exportPeriodSummary(data, period)}
        coverage={coverage}
      />

      <div className="relative flex min-h-0 flex-1">
        <motion.aside
          initial={false}
          animate={{ width: panelOpen ? 296 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 overflow-hidden border-r border-[#E2E8F0] bg-white"
          aria-hidden={!panelOpen}
        >
          <FilterPanel
            view={view}
            filters={filters}
            onChange={patchFilters}
            onReset={resetFilters}
            selected={selected}
            onSelect={selectAndOpen}
            compare={compare}
            onToggleCompare={toggleCompare}
            maxCompare={MAX_COMPARE}
          />
        </motion.aside>

        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#F8FAFC]">
          {geo && match ? (
            <ClimateMap
              geo={geo}
              match={match}
              view={view}
              selected={selected}
              onSelect={selectAndOpen}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              layoutKey={`${panelOpen}`}
            />
          ) : (
            <MapPlaceholder loading={geoState.status === "loading"} message={geoState.status === "error" ? geoState.message : undefined} />
          )}

          {geo && match && (match.unmatchedDistricts.length > 0 || match.unmatchedFeatures.length > 0 || geo.skipped > 0) ? (
            <div
              className={cn(
                "absolute left-1/2 top-3 z-10 flex max-w-[60%] -translate-x-1/2 items-start gap-2 rounded-lg border bg-white px-3 py-1.5 text-[11px] text-[#64748B] shadow-sm",
                match.unmatchedDistricts.length > 0 || geo.skipped > 0 ? "border-[#F7BD75]" : "border-[#E2E8F0]",
              )}
            >
              {match.unmatchedDistricts.length > 0 || geo.skipped > 0 ? (
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#ED8759]" />
              ) : (
                <Info size={13} className="mt-0.5 shrink-0 text-[#64748B]" />
              )}
              <span className="space-y-0.5">
                {geo.skipped > 0 ? (
                  <span className="block">
                    {geo.skipped} boundary feature{geo.skipped === 1 ? "" : "s"} failed geometry validation and {geo.skipped === 1 ? "was" : "were"} not drawn:{" "}
                    <b className="text-[#1E293B]">{geo.skippedLabels.join(", ")}</b>.
                  </span>
                ) : null}
                {match.unmatchedDistricts.length > 0 ? (
                  <span className="block">
                    {match.unmatchedDistricts.length} climate district{match.unmatchedDistricts.length === 1 ? "" : "s"} with no boundary for its LGD code:{" "}
                    <b className="text-[#1E293B]">{match.unmatchedDistricts.join(", ")}</b>.
                  </span>
                ) : null}
                {match.unmatchedFeatures.length > 0 ? (
                  <span className="block">
                    No climate data for <b className="text-[#1E293B]">{match.unmatchedFeatures.join(", ")}</b> — shown in grey.
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}

          <MapLegend view={view} hasNoData={hasNoData} />

          <AnimatePresence>
            {tab ? (
              <InsightDrawer
                key="drawer"
                view={view}
                tab={tab}
                onTab={setTab}
                onClose={() => setTab(null)}
                selected={selected}
                onSelect={setSelected}
                compare={compare}
                maxCompare={MAX_COMPARE}
                onToggleCompare={toggleCompare}
                pair={pair}
                onPair={setPair}
                onExportRecords={(d) => exportDistrictRecords(data, d)}
              />
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Home() {
  const { climate, geo } = useAtlasData();

  if (climate.status === "loading") {
    return <div className="flex h-screen items-center justify-center bg-white text-sm text-[#64748B]">Loading climate records…</div>;
  }
  if (climate.status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-white px-6 text-center">
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">Climate dataset could not be loaded</p>
          <p className="mt-1 text-xs text-[#64748B]">{climate.message}</p>
        </div>
      </div>
    );
  }
  return <Atlas data={climate.value} geoState={geo} />;
}

export default Home;