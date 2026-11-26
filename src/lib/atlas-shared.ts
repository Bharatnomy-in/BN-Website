// Helpers shared by the Atlas page's build-time code and its browser script:
// formatting, seeds, site URLs, colour scales, hand-drawn sketches, trend charts.
// No Node APIs here, so the browser bundle can import it.
import rough from 'roughjs';
import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear, scaleThreshold } from 'd3-scale';
import { quantile, extent, ticks } from 'd3-array';
import { line as d3line, curveLinear } from 'd3-shape';

// ===== Shared page helpers: formatting =====
// Number and text formatters shared by build-time components and the Atlas.
export function fmt(v: number | null | undefined, decimals = 0): string {
    if (v == null || Number.isNaN(v))
        return 'no data';
    return v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
/** Signed value: +1.2, -0.4, 0. Uses a true minus sign. */
export function signed(v: number | null | undefined, decimals = 0): string {
    if (v == null || Number.isNaN(v))
        return 'no data';
    const s = fmt(Math.abs(v), decimals);
    if (Number(s.replace(/,/g, '')) === 0)
        return s;
    return (v > 0 ? '+' : '−') + s;
}
export function withUnit(v: number | null | undefined, unit: string, decimals = 0): string {
    if (v == null)
        return 'no data';
    const n = fmt(v, decimals);
    if (!unit)
        return n;
    if (unit === '%')
        return `${n}%`;
    if (unit === 'SPI')
        return n;
    return `${n} ${unit}`;
}
export function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
/** "19.44° N  76.00° E" */
export function coords(lon: number, lat: number): string {
    return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}
/** "19 NOV 2026" from an ISO date. */
export function stampDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}
/** Remove em dashes from text we did not write (README titles etc.). */
export function noEmDash(s: string): string {
    return s.replace(/\s*—\s*/g, ': ').replace(/:\s*:/g, ':');
}


// ===== Shared page helpers: deterministic seeds =====
// Fixed, seeded "randomness" so every tilt and wobble is identical on every load.
/** 32-bit FNV-1a hash of a string. */
export function hash(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
/** Deterministic PRNG (mulberry32). */
export function rng(seed: number | string) {
    let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** A fixed tilt in degrees within ±max, from a seed string. Never exactly 0 (0 if max is 0). */
export function tilt(seed: string, max = 3): number {
    const r = rng(seed)();
    const v = (r * 2 - 1) * max;
    const min = max * 0.3;
    const out = Math.abs(v) < min ? (v < 0 ? -min : min) : v;
    return Math.round(out * 10) / 10;
}


// ===== Shared page helpers: site URLs =====
// Every internal URL goes through u(), so the site works at a sub-path
// (GitHub Pages: /BN-Website/) or at a domain root, set by BASE_PATH.
export const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const u = (p: string): string => (/^(https?:|mailto:|#|data:)/.test(p) ? p : BASE + (p.startsWith('/') ? p : `/${p}`));
export const base = BASE;


// ===== Shared page helpers: data colour scales =====
export const STOPS = {
    warm: ['#F6EBD3', '#F0C46E', '#E07E3C', '#B53D2C', '#6B1F1D'],
    anomaly: ['#2F5D9A', '#9DB7D5', '#EEEDE6', '#E5A07C', '#A8322A'],
    wet: ['#EEF2E6', '#BCD9C6', '#6FB0AC', '#2C7C92', '#173F5C'],
    // forest and sanitation: light sage to deep green (the macro lens colour)
    forest: ['#EEF0E4', '#C9DBB3', '#8DB47F', '#4A7556', '#23412C'],
    wetdry: ['#8A5626', '#D6A86E', '#EEEDE6', '#7FC0B8', '#1E6E73'],
    // brown half of dry/wet, light to dark, for "longer dry spell = darker"
    dry: ['#F1EBDD', '#E2CDA6', '#D6A86E', '#B07B42', '#8A5626'],
    // reversed dry/wet, for changes where a bigger number is drier (longer dry spells)
    wetdry_rev: ['#1E6E73', '#7FC0B8', '#EEEDE6', '#D6A86E', '#8A5626'],
    // ordinal monsoon category: large deficient .. large excess
    category: ['#8A5626', '#D6A86E', '#EEEDE6', '#7FC0B8', '#1E6E73'],
} as const;
export type ScaleKind = keyof typeof STOPS;
export const NO_DATA = 'url(#nodata)';
export interface Classed {
    color: (v: number | string | null) => string | null;
    /** legend entries, light to dark (or dry to wet) */
    legend: {
        color: string;
        label: string;
        from?: number;
        to?: number;
    }[];
    breaks: number[];
}
export const nice = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
/** Pretty step for symmetric diverging breaks. */
export function niceStep(maxAbs: number): number {
    const raw = maxAbs / 2.5;
    const p = 10 ** Math.floor(Math.log10(raw));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
/**
 * Build a 5-class scale.
 * - quantile / equal: sequential metrics (values = every value currently shown)
 * - diverging-symmetric: breaks at ±step/2 and ±1.5 step around zero
 * - fixed: metric.fixed breaks (SPI), mapped to 5 colours
 * - categorical: metric.categories in order
 */
export function classify(opts: {
    kind: ScaleKind;
    breaks: string;
    values: number[];
    method?: 'quantile' | 'equal';
    decimals?: number;
    unit?: string;
    fixed?: number[];
    categories?: string[];
}): Classed {
    const stops = [...STOPS[opts.kind]];
    const d = opts.decimals ?? 0;
    const u = opts.unit === '%' ? '%' : opts.unit && opts.unit !== 'SPI' ? ` ${opts.unit}` : '';
    if (opts.breaks === 'categorical') {
        const cats = opts.categories ?? [];
        const map = new Map(cats.map((c, i) => [c, stops[i]]));
        return {
            color: (v) => (v == null ? null : map.get(String(v)) ?? null),
            legend: cats.map((c, i) => ({ color: stops[i], label: c })),
            breaks: [],
        };
    }
    const vals = opts.values.filter((v) => v != null && !Number.isNaN(v)).sort((a, b) => a - b);
    let breaks: number[];
    if (opts.breaks === 'fixed' && opts.fixed) {
        // SPI: -2,-1.5,-1 | 1,1.5,2 → 5 classes: <=-1.5, -1.5..-1, -1..1, 1..1.5, >=1.5
        // (the outermost ±2 break is shown in the legend text of the end classes)
        const f = opts.fixed;
        breaks = [f[1], f[2], f[3], f[4]];
        const s = scaleThreshold<number, string>().domain(breaks).range(stops);
        return {
            color: (v) => (v == null ? null : s(+v)),
            legend: [
                { color: stops[0], label: `below ${f[1]} (severe, extreme below ${f[0]})` },
                { color: stops[1], label: `${f[1]} to ${f[2]} (moderately dry)` },
                { color: stops[2], label: `${f[2]} to ${f[3]} (near normal)` },
                { color: stops[3], label: `${f[3]} to ${f[4]} (moderately wet)` },
                { color: stops[4], label: `above ${f[4]} (very wet, extreme above ${f[5]})` },
            ],
            breaks,
        };
    }
    if (opts.breaks === 'diverging-symmetric') {
        const maxAbs = Math.max(Math.abs(vals[0] ?? 1), Math.abs(vals[vals.length - 1] ?? 1)) || 1;
        const step = niceStep(maxAbs);
        breaks = [-1.5 * step, -0.5 * step, 0.5 * step, 1.5 * step];
        const s = scaleThreshold<number, string>().domain(breaks).range(stops);
        const f = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(nice(x, 2)).toLocaleString('en-IN');
        return {
            color: (v) => (v == null ? null : s(+v)),
            legend: [
                { color: stops[0], label: `below ${f(breaks[0])}${u}`, to: breaks[0] },
                { color: stops[1], label: `${f(breaks[0])} to ${f(breaks[1])}${u}`, from: breaks[0], to: breaks[1] },
                { color: stops[2], label: `${f(breaks[1])} to ${f(breaks[2])}${u} (near zero)`, from: breaks[1], to: breaks[2] },
                { color: stops[3], label: `${f(breaks[2])} to ${f(breaks[3])}${u}`, from: breaks[2], to: breaks[3] },
                { color: stops[4], label: `above ${f(breaks[3])}${u}`, from: breaks[3] },
            ],
            breaks,
        };
    }
    // sequential
    const lo = vals[0] ?? 0, hi = vals[vals.length - 1] ?? 1;
    if (opts.method === 'equal') {
        const w = (hi - lo) / 5;
        breaks = [1, 2, 3, 4].map((i) => nice(lo + w * i, d));
    }
    else {
        breaks = [0.2, 0.4, 0.6, 0.8].map((p) => nice(quantile(vals, p) ?? lo, d));
    }
    // collapse duplicate breaks (many equal values) so classes stay ordered
    for (let i = 1; i < breaks.length; i++)
        if (breaks[i] <= breaks[i - 1])
            breaks[i] = breaks[i - 1] + 10 ** -d;
    const s = scaleThreshold<number, string>().domain(breaks).range(stops);
    const n = (x: number) => x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
    const edges = [lo, ...breaks, hi];
    return {
        color: (v) => (v == null ? null : s(+v)),
        legend: stops.map((c, i) => ({
            color: c,
            label: i === 0 ? `under ${n(edges[1])}${u}` : i === 4 ? `${n(edges[4])}${u} or more` : `${n(edges[i])} to under ${n(edges[i + 1])}${u}`,
            from: edges[i], to: edges[i + 1],
        })),
        breaks,
    };
}
/** Darkest usable stop of a scale (for compare lines etc.). */
export const darkEnd = (k: ScaleKind) => STOPS[k][4];


// ===== Shared page helpers: hand-drawn SVG sketches =====
export const gen = rough.generator();
/** Round every number in a path string to 1 decimal (keeps inline SVG small). */
export const tidy = (d: string, dec = 1) => d.replace(/-?\d+\.\d+/g, (n) => (Math.round(+n * 10 ** dec) / 10 ** dec).toString());
export interface Frame {
    width: number;
    height: number;
    project: (p: [
        number,
        number
    ]) => [
        number,
        number
    ];
}
export function allCoords(g: any, out: Position[] = []): Position[] {
    if (!g)
        return out;
    if (g.type === 'FeatureCollection')
        g.features.forEach((f: any) => allCoords(f.geometry, out));
    else if (g.type === 'GeometryCollection')
        g.geometries.forEach((x: any) => allCoords(x, out));
    else if (g.type === 'Feature')
        allCoords(g.geometry, out);
    else if (g.type === 'Point')
        out.push(g.coordinates);
    else if (g.type === 'MultiPoint' || g.type === 'LineString')
        out.push(...g.coordinates);
    else if (g.type === 'Polygon' || g.type === 'MultiLineString')
        g.coordinates.forEach((r: Position[]) => out.push(...r));
    else if (g.type === 'MultiPolygon')
        g.coordinates.forEach((p: Position[][]) => p.forEach((r) => out.push(...r)));
    return out;
}
export function frameFor(fc: FeatureCollection, width: number, height: number, pad = 12): Frame {
    // Fit to the coordinates as points: d3-geo is spherical and treats rings with
    // the "wrong" winding (RFC 7946 order) as the whole globe minus the shape.
    const proj = geoMercator().fitExtent([[pad, pad], [width - pad, height - pad]], { type: 'MultiPoint', coordinates: allCoords(fc) } as any);
    return { width, height, project: (p) => proj(p) as [
            number,
            number
        ] };
}
export function rings(g: Geometry): Position[][] {
    if (g.type === 'Polygon')
        return [g.coordinates[0]];
    if (g.type === 'MultiPolygon')
        return g.coordinates.map((p) => p[0]);
    return [];
}
export interface SketchedDistrict {
    lgd: string;
    name: string;
    x: number;
    y: number;
    outline: string[];
    hatch: string[];
    plain: string;
}
export interface SketchOpts {
    frame: Frame;
    /** value per lgd; districts without a value get outline only */
    values?: Record<string, number | null>;
    /** value range mapped to hachure gap (sparse at lo, dense at hi) */
    range?: [
        number,
        number
    ];
    gap?: [
        number,
        number
    ]; // [sparse, dense] px, default [14, 2.5]
    roughness?: number;
    seedSalt?: number;
    hatchWeight?: number;
}
export function hachureGap(v: number, range: [
    number,
    number
], gap: [
    number,
    number
] = [14, 2.5]): number {
    const t = Math.max(0, Math.min(1, (v - range[0]) / (range[1] - range[0] || 1)));
    // interpolate line density (1/gap), not gap, so darkness grows evenly with the value
    return 1 / (1 / gap[0] + (1 / gap[1] - 1 / gap[0]) * t);
}
export function sketchDistricts(fc: FeatureCollection, o: SketchOpts): SketchedDistrict[] {
    const path = geoPath();
    const out: SketchedDistrict[] = [];
    for (const f of fc.features as Feature[]) {
        const p = f.properties as {
            lgd: string;
            name: string;
            cx: number;
            cy: number;
        };
        const seed = Number(p.lgd) + (o.seedSalt ?? 0) * 1000;
        const polys = rings(f.geometry).map((r) => r.map((c) => o.frame.project(c as [
            number,
            number
        ])));
        if (polys.some((r) => r.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))))
            throw new Error(`sketch: non-finite projection for ${p.name}`);
        const v = o.values?.[p.lgd];
        const outline: string[] = [];
        const hatch: string[] = [];
        polys.forEach((pts, i) => {
            if (pts.length < 3)
                return;
            const s = seed + i * 7;
            for (const pi of gen.toPaths(gen.polygon(pts, { roughness: o.roughness ?? 0.75, bowing: 0.6, stroke: '#16181C', strokeWidth: 1, seed: s, disableMultiStroke: true })))
                outline.push(tidy(pi.d));
            if (v != null && o.range) {
                const g = gen.polygon(pts, {
                    stroke: 'none', fill: '#16181C', fillStyle: 'hachure', hachureAngle: -41,
                    hachureGap: hachureGap(v, o.range, o.gap), fillWeight: o.hatchWeight ?? 0.7,
                    roughness: 0.4, seed: s + 3, disableMultiStrokeFill: true,
                });
                for (const pi of gen.toPaths(g))
                    if (pi.fill === 'none' || pi.stroke !== 'none')
                        hatch.push(tidy(pi.d, 0));
            }
        });
        const [x, y] = o.frame.project([p.cx, p.cy]);
        const plain = tidy(path({ type: 'MultiPolygon', coordinates: polys.map((r) => [r]) } as any) ?? '');
        out.push({ lgd: String(p.lgd), name: p.name, x, y, outline, hatch, plain });
    }
    return out;
}
/** Rough outlines of every feature (e.g. India's states), one path string each. */
export function sketchOutlines(fc: FeatureCollection, frame: Frame, o: {
    roughness?: number;
    seedSalt?: number;
} = {}) {
    return (fc.features as Feature[]).map((f, k) => {
        const props = (f.properties ?? {}) as Record<string, any>;
        const d: string[] = [];
        rings(f.geometry).forEach((r, i) => {
            const pts = r.map((c) => frame.project(c as [
                number,
                number
            ]));
            if (pts.length < 3)
                return;
            for (const pi of gen.toPaths(gen.polygon(pts, { roughness: o.roughness ?? 0.6, bowing: 0.5, stroke: '#16181C', strokeWidth: 1, seed: 7000 + k * 31 + i + (o.seedSalt ?? 0), disableMultiStroke: true })))
                d.push(tidy(pi.d));
        });
        return { props, d: d.join(' ') };
    });
}
/** A single rough line through points (the "pen line"). */
export function roughLine(points: [
    number,
    number
][], seed: number, roughness = 0.4): string {
    return gen.toPaths(gen.curve(points, { roughness, bowing: 0.5, stroke: '#2346C7', strokeWidth: 2, seed, disableMultiStroke: true })).map((p) => tidy(p.d)).join(' ');
}
/** A rough circle outline, e.g. for waypoints or lens circles. */
export function roughCircle(x: number, y: number, d: number, seed: number, roughness = 0.8): string {
    return gen.toPaths(gen.circle(x, y, d, { roughness, stroke: '#16181C', strokeWidth: 1, seed })).map((p) => tidy(p.d)).join(' ');
}


// ===== Shared page helpers: trend charts =====
export interface TrendSeries {
    label: string;
    values: (number | null)[];
    /** 'ink' main line, 'accent' pen line, or a dash pattern for compares */
    style?: 'ink' | 'accent' | 'faint';
    dash?: string;
    color?: string;
}
export interface TrendOpts {
    years: number[];
    series: TrendSeries[];
    width?: number;
    height?: number;
    unit?: string;
    decimals?: number;
    baseline?: [
        number,
        number
    ]; // shaded normal period
    highlight?: number; // marked year
    rolling?: number; // rolling mean window (applied to series[0])
    zeroLine?: boolean;
    title?: string; // accessible title
    desc?: string;
}
export const escTrend = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
export function rollingMean(v: (number | null)[], w: number): (number | null)[] {
    return v.map((_, i) => {
        if (i < w - 1)
            return null;
        const win = v.slice(i - w + 1, i + 1).filter((x): x is number => x != null);
        return win.length === w ? win.reduce((a, b) => a + b, 0) / w : null;
    });
}
export function renderTrend(o: TrendOpts): string {
    const W = o.width ?? 560, H = o.height ?? 220;
    const m = { t: 24, r: 12, b: 26, l: 40 };
    const years = o.years;
    const all = o.series.flatMap((s) => s.values).filter((v): v is number => v != null);
    let [lo, hi] = extent(all) as [
        number,
        number
    ];
    if (o.zeroLine) {
        lo = Math.min(lo, 0);
        hi = Math.max(hi, 0);
    }
    const padY = (hi - lo) * 0.08 || 1;
    const x = scaleLinear().domain([years[0], years[years.length - 1]]).range([m.l, W - m.r]);
    const y0 = lo >= 0 && lo - padY < 0 ? 0 : lo - padY; // counts never go below zero
    const y = scaleLinear().domain([y0, hi + padY]).range([H - m.b, m.t]).nice(4);
    const d = o.decimals ?? 0;
    const yt = y.ticks(4);
    const xt = ticks(Math.ceil(years[0] / 10) * 10, Math.floor(years[years.length - 1] / 10) * 10, 8).filter((t) => t % 10 === 0);
    const mk = (vals: (number | null)[]) => d3line<number | null>().defined((v) => v != null).x((_, i) => x(years[i])).y((v) => y(v as number)).curve(curveLinear)(vals) ?? '';
    const parts: string[] = [];
    parts.push(`<svg class="trend" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escTrend(o.title ?? 'Trend chart')}">`);
    if (o.desc)
        parts.push(`<desc>${escTrend(o.desc)}</desc>`);
    // baseline band
    if (o.baseline) {
        const [a, b] = o.baseline;
        parts.push(`<rect class="trend-band" x="${x(Math.max(a, years[0])).toFixed(1)}" y="${m.t}" width="${(x(Math.min(b, years[years.length - 1])) - x(Math.max(a, years[0]))).toFixed(1)}" height="${H - m.b - m.t}"/>`);
        parts.push(`<text class="trend-bandlabel" x="${(x(Math.max(a, years[0])) + 4).toFixed(1)}" y="${m.t + 10}">NORMAL ${a}–${b}</text>`);
    }
    // y grid + ticks
    for (const t of yt) {
        parts.push(`<line class="trend-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`);
        parts.push(`<text class="trend-tick" x="${m.l - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end">${t.toLocaleString('en-IN', { maximumFractionDigits: Math.max(0, d) })}</text>`);
    }
    if (o.zeroLine && lo < 0 && hi > 0)
        parts.push(`<line class="trend-zero" x1="${m.l}" x2="${W - m.r}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/>`);
    // x ticks
    parts.push(`<line class="trend-axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`);
    for (const t of xt) {
        parts.push(`<line class="trend-axis" x1="${x(t).toFixed(1)}" x2="${x(t).toFixed(1)}" y1="${H - m.b}" y2="${H - m.b + 4}"/>`);
        parts.push(`<text class="trend-tick" x="${x(t).toFixed(1)}" y="${H - m.b + 15}" text-anchor="middle">${t}</text>`);
    }
    if (o.unit)
        parts.push(`<text class="trend-tick trend-unit" x="0" y="10">${escTrend(o.unit.toUpperCase())}</text>`);
    // highlight year
    if (o.highlight != null && years.includes(o.highlight)) {
        const hx = x(o.highlight).toFixed(1);
        parts.push(`<line class="trend-hl" x1="${hx}" x2="${hx}" y1="${m.t}" y2="${H - m.b}"/>`);
        parts.push(`<text class="trend-hllabel" x="${hx}" y="${m.t - 6}" text-anchor="end">${o.highlight}</text>`);
    }
    // series
    o.series.forEach((s, i) => {
        const cls = s.style === 'accent' ? 'trend-pen' : s.style === 'faint' ? 'trend-faint' : 'trend-ink';
        const extra = `${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${s.color ? ` style="stroke:${s.color}"` : ''}`;
        parts.push(`<path class="${cls}" d="${mk(s.values)}"${extra}><title>${escTrend(s.label)}</title></path>`);
        if (i === 0 && o.rolling)
            parts.push(`<path class="trend-roll" d="${mk(rollingMean(s.values, o.rolling))}"><title>${o.rolling}-year rolling mean</title></path>`);
        if (i === 0 && o.highlight != null) {
            const k = years.indexOf(o.highlight);
            const v = s.values[k];
            if (v != null)
                parts.push(`<circle class="trend-dot" cx="${x(o.highlight).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5"/>`);
        }
    });
    parts.push('</svg>');
    return parts.join('');
}


