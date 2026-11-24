# Bharatnomy website spec: how to use these files

These Markdown files document the site's design, content, page structure, map behaviour, and build workflow. They are reference material; the live frontend implementation is kept in the corresponding `.astro` page files.

1. Read `CLAUDE.md`, then `DESIGN.md`, `CONTENT.md`, `PAGES.md`, and `MAP.md` as needed.
2. Open the project folder and install the dependencies with `npm install` (Node 22.23.4 or newer).
3. Each page is self-contained. Make frontend changes directly in its page file under `src/pages/`.
4. The dataset index and dataset detail pages are both in `src/pages/datasets/[...slug].astro`.
5. Do not edit `public/data/` or `src/config/` unless a data change is explicitly required. The data refresh tool is `scripts/build-data.mjs`.
6. Run `npm run build` to verify the site before deploying.
