# Maharashtra Climate Atlas data

These two files are bundled as local Vite assets from `src/dashboard/Maharastra-Climate.tsx`:

- `climate_temperature_district.json` — annual district climate records.
- `maharashtra-districts.geojson` — district boundary polygons.

The component loads them using source-relative `new URL(..., import.meta.url)` URLs. This keeps the assets working on both the local root URL and the deployed `/BN-Website/` base path.

The dashboard uses its own Tailwind utilities stylesheet at `src/styles/climate-dashboard.css`. Tailwind Preflight is disabled and no Tailwind base reset is loaded, so the existing Astro site and Navbar styles are not reset.

Tailwind utility selectors are scoped under the `.climate-atlas` main wrapper, so they do not leak into the Navbar or Footer.
