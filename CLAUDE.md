# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

North Meck Insights: a static, public-data portal built by Davidson College's Community Research Fellows (CRF) program. It presents housing, education, and healthcare data for North Mecklenburg, NC (Davidson, Cornelius, Huntersville) plus profiles of five "United Neighborhoods." Built with **Quarto** (static website, no server); charts are Observable JS, and numbers quoted in text are computed with R at build time. Live at https://northmeckinsights.org/ (custom domain on GitHub Pages).

## Running it

- Needs Quarto 1.9+ and R (packages listed in `DESCRIPTION`: `remotes::install_deps()` installs them).
- `quarto preview`: local server with live reload.
- `quarto render`: builds the whole site into `_site/` (flat `page.html` files at the same URLs the site has always used). `quarto render housing.qmd` builds one page.
- **Windows:** run Quarto and `Rscript` from PowerShell. `Rscript` segfaults when launched from Git Bash.
- No test suite or linter. The closest thing is `nm_claim()` (below): a render fails if page text no longer matches the data.

## Architecture

**Pages** are `.qmd` files at the repo root (`index`, `housing`, `education`, `healthcare`, `neighborhoods`, `nbhd-data`, `topics`, `data-library`, `sources`, `blog`, `about`). Blog posts are `posts/*.qmd`. **Read `docs/quarto-pages.md` before writing or editing a page**: it covers the HTML-in-Markdown rules, the R and OJS patterns, and why things are set up the way they are. `housing.qmd` is the reference dashboard.

`_quarto.yml` uses `theme: none` + `minimal: true` + `page-layout: custom`, so Quarto adds no Bootstrap and no page chrome; `css/styles.css` styles everything. Shared chrome (nav, footer, glossary/viz/map/help modals, facts bar, accessibility panel, FAB, chart tooltip, CDN scripts, `js/main.js`) is injected into every page from `_partials/` (`head.html`, `nav.html`, `after-body.html`), not repeated per page. Pages set `pagetitle` (not `title`, which would add a Quarto title block). Static assets (`css/`, `js/`, `images/`, `data/`, `maps/`) live at the repo root and are copied as-is via `project.resources`; links use root-absolute URLs (`/images/x.jpg`).

Quarto gotchas this setup works around (details in `docs/quarto-pages.md`):
- `class="callout"` is reserved by Quarto, so the site's callout classes are `nm-callout`, `nm-callout-t`, `nm-callout-s`.
- Indented HTML (4+ spaces) becomes a code block, so page HTML is flush left. Pure-HTML pages (`topics`, `data-library`, `sources`, `about`, most of `index`) wrap their HTML in a raw `{=html}` block so Pandoc passes it through untouched.
- `from: markdown-tex_math_dollars-smart`: `$` is a dollar sign, and quotes stay as typed.

**Charts: Observable JS.** Each page has one hidden OJS setup cell that imports from `js/nm-charts.js` (`stdPlot`, `chips`, `townChips`, `responsive`, `loadData`, town colors, axis/format helpers) and loads `data/*.json`. Each chart is an OJS cell wrapped in `<div id="original-chart-id">`; `main.js` uses those ids for theme tags, search anchors (`CHART_INDEX`), and Data Library links, so keep them stable. Filter chips are OJS inputs (`viewof town = townChips(masterTown)`); the page-wide town filter is `viewof masterTown`. Tabs are still plain HTML handled by `setTab` in `main.js`; `responsive()` redraws a chart when its hidden tab opens or the card is expanded.

**Numbers in text: R.** A setup chunk sources `R/nm.R` (`nm_data`, `nm_value`, `pct_change`, `fmt_dollar`, `fmt_pct`, `fmt_num`, `fmt_k`, `fmt_list`, `nm_claim`) and computes every figure the page quotes; the text uses inline `r` expressions. Sentences whose wording depends on the data ("all three towns", "grew fastest") are guarded with `nm_claim(condition, "what the text says")`, which stops the build if a data refresh makes them false. `project.execute-dir: project` means R paths are relative to the repo root everywhere. `R/housing-headlines.R` holds figures shared by the housing Overview tab and the home page spotlight. Claims that can't be checked against our data (outside reports, quotes, national figures) stay as written, with their source noted.

**Blog.** `blog.qmd` and the home page's story carousel are Quarto listings of `posts/` rendered through custom EJS templates (`_partials/blog-cards.ejs`, `_partials/home-stories.ejs`; keep their card markup in sync). Post front matter: `title`, `description` (the dek), `categories` (the tag), `eyebrow`, `date`, `read-time`, `image`, `thumbnail-icon`, `author`, `author-role`. `draft: true` posts aren't published; `unlisted: true` posts are published but left off both listings. `posts/_metadata.yml` applies the post header partial (`_partials/post/title-block.html`) and `_extensions/post-layout.lua`, which wraps the body and closes the article. Old `blog-<slug>.html` URLs redirect via `aliases`.

**main.js** (`js/main.js`, plain script on every page): nav (incl. client-side search over a hardcoded `NAV_INDEX` array, with a `pageMap` translating search result keys to `.html` filenames; keep both in sync when adding or renaming pages), glossary modal, accessibility panel (text size, contrast, dyslexia font, screen-reader-via-`SpeechSynthesis`, etc., persisted to `localStorage`), the facts-bar ticker, home-page carousels, the North Meck SVG map modal, chart expand/share/image export, and the Data Library download UI (CSV/Excel/codebook export driven by the `DATASETS` registry). `neighborhoods` and `nbhd-data` use Leaflet (CDN) plus a `NBHD_META` lookup table in `main.js`.

**Data layer: build-time snapshot, not live client-side queries.** `scripts/refresh-data.mjs` connects to the project's MotherDuck (hosted DuckDB) database using `@duckdb/node-api` and a `MOTHERDUCK_TOKEN`, runs each dataset's SQL query, and writes `data/<name>.json`. Both R (at build time) and OJS (in the browser) read those same files; nothing talks to MotherDuck at render or run time. `.github/workflows/refresh-data.yml` runs the script monthly (plus manual `workflow_dispatch`) and commits changed `data/*.json` to `main`; `deploy.yml` runs when that workflow finishes (a `GITHUB_TOKEN` push alone wouldn't trigger it), renders with Quarto + R, and publishes `_site/` to GitHub Pages. If an `nm_claim()` fails, the deploy fails and the live site stays as it was. To regenerate the snapshot locally, export your own `MOTHERDUCK_TOKEN` and run `node scripts/refresh-data.mjs` (needs `npm install`); no token is ever committed. Three datasets (`race-summary`, `race-composition`, `race-trend`) discover their source columns by name at query time (`findCol()`), so they survive column renames upstream.

**Static datasets (no query behind them; values were hand-exported or moved out of old chart code):** `dlib-burden-by-bracket`, `dlib-ptr-by-bracket`, `charlotte-housing-wage`, `charlotte-fmr-bedroom`, `charlotte-ami-gap`, `cdc-preventive-care`, `school-economic-gap`, `cdc-chronic-disease`, `race-tenure`, `housing-types`, `k12-enrollment-by-level`, `bachelors-attainment-trend`, `attainment-breakdown-2022`, `earnings-by-education`. They don't change on refresh; each needs a warehouse query eventually. Never type data values into a page or chart: add or extend a dataset instead.

⚠️ **Known, deliberately-unfixed gap** (flagged in `refresh-data.mjs` output, not silently hidden):
- `dlib-demographics`: the query references `total_households`, which doesn't exist on the source table (`agg_town_demographics`; that column lives on `agg_town_housing_burden` instead). Produces an empty JSON file; the Data Library download for this dataset fails with a visible "No data returned" toast rather than crashing. Fix options: join `total_households` in from `agg_town_housing_burden`, or drop it from the download schema. Check with the data team before changing.

**Styling:** a single `css/styles.css` using CSS custom properties (`--accent`, `--ink`, `--paper`, etc. defined in `:root`) with `oklch()` colors, plus `css/quarto-overrides.css` (neutralizes Quarto's cell wrappers and the Bootstrap-only `d-none` class its listing script uses). Per-page inline `style="..."` attributes are used heavily, so don't assume all visual rules live in `styles.css`. Plot marks can't use CSS variables in `fill`, so charts use hex colors.

**Assets:** images live under `images/`, all real (not placeholder) photography and logos supplied by the design team. Note `mulliss-logo.jpg` is a JPG despite older references expecting a `.png`; the about page's image tag was updated to match the actual file rather than converting it.
