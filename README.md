# Bharatnomy website

The public website for Bharatnomy: India's economy, read as one connected system.
Built with Astro as a static site. Live at https://sarveshkant2003-afk.github.io/bharatnomy-website/

## Run it

```bash
npm install
npm run dev        # http://localhost:4321/bharatnomy-website/
npm run build      # static site in dist/
npm run data       # rebuild public/data/ from the Bharatnomy front repo (pinned in src/config/data.mjs)
```

Needs Node 22.23.4 or newer (Astro's requirement). Every push to `main` builds and deploys to GitHub Pages
(`.github/workflows/pages.yml`). For a custom domain at the root, build with `BASE_PATH=/`.

## Where things are

- Specs: `CLAUDE.md`, `DESIGN.md`, `CONTENT.md`, `PAGES.md`, `MAP.md`, and `SPEC-README.md`.
- Pages: `src/pages/`. Each page contains its own markup, styles, helpers, and page interactions.
- Datasets: one file, `src/pages/datasets/[...slug].astro`, serves both `/datasets` and `/datasets/temperature` or `/datasets/rainfall`.
- There are no separate frontend component, layout, helper-library, script, or style folders under `src/`.
- Data is intentionally kept separate and unchanged: `src/config/` and `public/data/`. The data pipeline remains `scripts/build-data.mjs` → `public/data/`.
- The MapLibre worker copy is handled inside `astro.config.mjs`; no separate copy-vendor script is needed.
- The Home page's scroll-driven interactions and CSS are contained in `src/pages/index.astro`; there is no separate ScrollCraft runtime folder or asset dependency.

Data: India Meteorological Department gridded records, district indices computed by Bharatnomy. Licence CC BY 4.0.
