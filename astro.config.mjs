import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep the MapLibre worker available at a stable public URL for the Atlas.
// This replaces the separate scripts/copy-vendor.mjs helper.
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const workerSource = path.join(ROOT, 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-worker.mjs');
const workerDirectory = path.join(ROOT, 'public', 'maplibre');
const workerOutput = path.join(workerDirectory, 'maplibre-gl-worker.mjs');

if (!fs.existsSync(workerSource)) {
  throw new Error(`MapLibre worker not found: ${workerSource}. Run npm install before starting the site.`);
}
fs.mkdirSync(workerDirectory, { recursive: true });
fs.copyFileSync(workerSource, workerOutput);

// Hosting: GitHub Pages serves the site at /BN-Website/.
// For a custom domain at the root, build with BASE_PATH=/ (and SITE_URL=https://bharatnomy.com).
export default defineConfig({
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
  site: process.env.SITE_URL ?? 'https://bharatnomy-in.github.io',
  base: process.env.BASE_PATH ?? '/BN-Website',
  output: 'static',
});
