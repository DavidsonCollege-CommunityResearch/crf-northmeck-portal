# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

North Meck Insights — a static, public-data portal built by Davidson College's Community Research Fellows (CRF) program. It presents housing, education, and healthcare data for North Mecklenburg, NC (Davidson, Cornelius, Huntersville) plus profiles of five "United Neighborhoods." No build step, no package manager, no framework: plain HTML/CSS/JS served directly as static files. Bilingual (EN/ES) throughout.

## Running it

There is no build/lint/test tooling. To work on the site, just open the HTML files directly in a browser or serve the directory with any static file server (e.g. `npx serve .` or the VS Code "Live Server" extension) — no compilation needed.

## Architecture

**Pages are independent HTML files, not a SPA.** Each top-level page (`index.html`, `housing.html`, `education.html`, `healthcare.html`, `data.html`, `neighborhoods.html`, `nbhd-data.html`, `blog.html`, `about.html`) duplicates the same `<nav>`, footer, glossary modal, accessibility panel, and FAB markup inline. There is no templating system — shared markup is kept in sync by hand across files. When editing shared chrome (nav links, glossary terms, footer), grep across all page files, not just one.

- `__INDEX.html` is a legacy monolithic single-file version of the whole site, kept for reference/rollback only. It is not linked from anywhere and should not be edited as part of normal work — treat it as a historical artifact unless the user asks to restore something from it.

**JS is one shared file plus one file per topic dashboard:**
- `js/main.js` — nav (incl. client-side search over a hardcoded `NAV_INDEX` array), EN/ES language toggle (`data-es`/`data-en` attribute pairs + `localStorage`), glossary modal, accessibility panel (text size, contrast, dyslexia font, screen-reader-via-`SpeechSynthesis`, etc., all persisted to `localStorage`), the "facts bar" ticker, the home-page data-spotlight/topic/neighborhood/blog carousels, the North Meck SVG map modal, and the Data Library download UI (CSV/Excel/codebook export).
- `js/housing.js`, `js/healthcare.js`, `js/education.js`, `js/neighborhoods.js` — one file per dashboard page, each self-contained (chart rendering, tab/chip filtering, town selection) and loaded only by its corresponding HTML page.
- Charts are hand-rolled with **D3 v6** (loaded from CDN) rather than a charting library. Tabs (`setTab`), town filter chips (`setChip`, dispatching a `masterTownChange` custom event), and per-chart render functions registered on `window.__renders` are the general pattern for wiring a chip/tab click to a redraw.
- `neighborhoods.html` / `nbhd-data.html` use a Leaflet map (also CDN) plus a `NBHD_META` lookup table in `main.js` for neighborhood metadata.

**Data layer:** dashboards query a hosted DuckDB (MotherDuck) database directly from the browser via `@motherduck/wasm-client`, loaded dynamically inside an IIFE in each dashboard's JS file (`getMDConn()` pattern). Table names follow `nmidw_cloud.agg_town_*`. Some smaller datasets (e.g. cost-burden-by-bracket) are inlined as JS literals instead of queried live. The Data Library page (`data.html`, wired in `main.js`) re-runs these same queries to produce CSV/Excel/codebook downloads.

⚠️ **Known issue:** a MotherDuck personal access token (`MD_TOKEN`, `tokenType: "read_write"`) is hardcoded as a plaintext string literal repeated throughout `js/housing.js`, `js/healthcare.js`, `js/main.js`, and several HTML files. Because this is a static site with no backend, that token is shipped to and readable by every visitor, and it grants **write** access to the underlying MotherDuck database. Flag this to the user before doing further data-layer work — it should be replaced with a read-only token at minimum, and ideally moved behind a proxy/backend so it isn't exposed client-side at all.

**Styling:** a single `css/styles.css` using CSS custom properties (`--accent`, `--ink`, `--paper`, etc. defined in `:root`) with `oklch()` colors. No CSS framework, no preprocessor. Per-page inline `style="..."` attributes are used heavily alongside the stylesheet, so don't assume all visual rules live in `styles.css`. Note `data-accent`/`data-hero`/`data-stats` attributes on `<html>` in several pages are leftover/unused hooks — there's no matching CSS selector for them.

**i18n pattern:** every user-facing string that needs a Spanish translation carries a `data-es="..."` attribute alongside its English text content; `applyI18n()` in `main.js` swaps `textContent` based on `window.LANG` (persisted in `localStorage` as `nm_lang`) and fires a `langchange` event that other modules (e.g. the facts bar) listen for. When adding new user-facing copy, add the matching `data-es` attribute rather than introducing a new i18n mechanism.

**Assets:** images live under `images/` (referenced but not all present in some page templates — check before assuming an asset exists).
