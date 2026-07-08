# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

North Meck Insights — a static, public-data portal built by Davidson College's Community Research Fellows (CRF) program. It presents housing, education, and healthcare data for North Mecklenburg, NC (Davidson, Cornelius, Huntersville) plus profiles of five "United Neighborhoods." Built with Astro (static output, no server), bilingual (EN/ES) throughout.

## Running it

- `npm install`
- `npm run dev` — local dev server with hot reload
- `npm run build` — outputs to `dist/` (flat `.html` files, not nested per-route folders — see `astro.config.mjs`'s `build.format: 'file'`)
- `npm run preview` — serves the built `dist/` output
- No test suite or linter is configured.

## Architecture

**Astro static site.** Each top-level route is a page component under `src/pages/*.astro` (`index`, `housing`, `education`, `healthcare`, `data`, `neighborhoods`, `nbhd-data`, `blog`, `about`, plus the dynamic `blog-[slug].astro`). Shared chrome — nav, footer, glossary modal, accessibility panel, FAB, chart tooltip — lives once in `src/layouts/BaseLayout.astro` and `src/components/*.astro`, not duplicated per page. Blog posts are an Astro content collection (`src/content/blog/*.md`, schema in `src/content.config.ts`).

`astro.config.mjs` sets `base: '/crf-northmeck-portal/'` (GitHub Pages project-site path) and `trailingSlash: 'never'` — `import.meta.env.BASE_URL` doesn't reliably end in `/`, so pages normalize it with `.replace(/\/*$/, '/')` before building asset URLs.

**JS is one shared file plus one file per topic dashboard, served from `public/js/` (not processed by Astro/Vite — plain script tags):**
- `public/js/main.js` — nav (incl. client-side search over a hardcoded `NAV_INDEX` array), EN/ES language toggle (`data-es`/`data-en` attribute pairs + `localStorage`), glossary modal, accessibility panel (text size, contrast, dyslexia font, screen-reader-via-`SpeechSynthesis`, etc., all persisted to `localStorage`), the "facts bar" ticker, the home-page data-spotlight/topic/neighborhood/blog carousels, the North Meck SVG map modal, `window.loadData(name)` (fetches `data/<name>.json` relative to wherever `main.js` was loaded from), and the Data Library download UI (CSV/Excel/codebook export, driven by the `DATASETS` registry in `main.js`).
- `public/js/housing.js`, `healthcare.js`, `education.js`, `neighborhoods.js` — one file per dashboard page, each self-contained (chart rendering, tab/chip filtering, town selection) and loaded only by its corresponding page.
- Charts are hand-rolled with **D3 v6** and **Observable Plot** (both CDN) rather than a shared charting library. Tabs (`setTab`), town filter chips (`setChip`, dispatching a `masterTownChange` custom event), and per-chart render functions registered on `window.__renders` are the general pattern for wiring a chip/tab click to a redraw.
- `neighborhoods.astro` / `nbhd-data.astro` use a Leaflet map (CDN) plus a `NBHD_META` lookup table in `main.js` for neighborhood metadata.

**Data layer: build-time snapshot, not live client-side queries.** `scripts/refresh-data.mjs` connects to the project's MotherDuck (hosted DuckDB) database using `@duckdb/node-api` and a `MOTHERDUCK_TOKEN`, runs each dashboard's SQL query, and writes the result to `public/data/<name>.json`. Dashboard JS never talks to MotherDuck — it just calls `window.loadData('<name>')`, which fetches the pre-built JSON like any other static asset. `.github/workflows/refresh-data.yml` runs this script on a monthly cron (plus manual `workflow_dispatch`) using the `MOTHERDUCK_TOKEN` repo secret, then commits any changed `public/data/*.json` back to `main` via `stefanzweifel/git-auto-commit-action`; that push triggers `.github/workflows/deploy.yml` to rebuild and redeploy. To regenerate the snapshot locally, export your own `MOTHERDUCK_TOKEN` and run `node scripts/refresh-data.mjs` — no token is ever committed. Three datasets (`race-summary`, `race-composition`, `race-trend`) discover their source columns by name at query time (`findCol()` in the script) rather than hardcoding them, preserving the original client-side self-healing behavior if the underlying table's columns get renamed. `dlib-burden-by-bracket.json` / `dlib-ptr-by-bracket.json` are static exports (no live query backs them).

⚠️ **Known, deliberately-unfixed gaps** (flagged in `refresh-data.mjs` output, not silently hidden):
- `dlib-demographics` — the query references `total_households`, which doesn't exist on the source table (`agg_town_demographics`; that column lives on `agg_town_housing_burden` instead). Produces an empty JSON file; the Data Library download for this dataset fails with a visible "No data returned" toast rather than crashing.
- `pottstown-demographics` — references `nmidw.agg_neighborhood_demographics`, which doesn't exist. Produces an empty JSON file; `nbhd-data.astro`'s Pottstown charts render a "Data unavailable" message instead of crashing.

Don't guess at fixes for either without checking with the data team first — the underlying table/column may simply not exist yet upstream.

**Styling:** a single `public/css/styles.css` using CSS custom properties (`--accent`, `--ink`, `--paper`, etc. defined in `:root`) with `oklch()` colors. No CSS framework, no preprocessor. Per-page inline `style="..."` attributes are used heavily alongside the stylesheet, so don't assume all visual rules live in `styles.css`.

**i18n pattern:** every user-facing string that needs a Spanish translation carries a `data-es="..."` attribute alongside its English text content; `applyI18n()` in `main.js` swaps `textContent` based on `window.LANG` (persisted in `localStorage` as `nm_lang`) and fires a `langchange` event that other modules (e.g. the facts bar) listen for. When adding new user-facing copy, add the matching `data-es` attribute rather than introducing a new i18n mechanism.

**Assets:** images live under `public/images/` (referenced but not all present — some are still pending from the design team; check before assuming an asset exists).

**Legacy artifacts:** `about.html`, `blog.html`, `data.html`, `index.html`, and `neighborhoods.html` still exist at the repo root as pre-Astro static pages. They carry no MotherDuck token and aren't linked from the live Astro build, but they're stale duplicates of `src/pages/*.astro` and will become unreachable once the GitHub Pages deploy source is switched from the legacy branch-based mode to GitHub Actions (not yet done — check `gh api repos/:owner/:repo/pages` for current `build_type`). Don't edit them; treat them the same as a historical artifact and prefer the Astro source of truth.
