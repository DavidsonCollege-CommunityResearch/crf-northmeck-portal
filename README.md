# North Meck Insights

A public-data portal built by Davidson College's Community Research Fellows (CRF) program. It presents housing, education, and healthcare data for North Mecklenburg, NC (Davidson, Cornelius, Huntersville), plus profiles of five "United Neighborhoods." Bilingual (EN/ES) throughout.

This README is for CRF student developers working on the codebase. If you just want to read the site, visit the live URL; you don't need anything in here.

## Getting started

**Prerequisites:** Node.js **22.12.0 or newer**. Check with `node -v`; if you're on an older version, install a newer one (e.g. via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm)). Older Node versions will fail to build: Astro itself requires 22.12+.

```bash
npm install
npm run dev       # local dev server with hot reload, http://localhost:4321/crf-northmeck-portal
```

Other useful commands:

```bash
npm run build      # builds the static site into dist/
npm run preview    # serves the dist/ build locally, close to what production looks like
```

There's no test suite or linter configured, so the main way to check your work is: does it build, and does it look and behave right in the browser?

You do **not** need any database credentials to do most development work. See [Adding data and visuals](#adding-data-and-visuals) below for the one case where you would.

## Architecture

The site is built with [Astro](https://astro.build) in static-output mode (no server, no API routes; it compiles to plain HTML/CSS/JS).

- **`src/pages/*.astro`**: one file per page/route (`index`, `housing`, `education`, `healthcare`, `topics`, `data-library`, `sources`, `neighborhoods`, `nbhd-data`, `blog`, `about`, plus the dynamic `blog-[slug].astro` for individual posts). Astro compiles these to flat `.html` files (e.g. `src/pages/housing.astro` becomes `housing.html`), matching how the site's internal links are written.
- **`src/layouts/BaseLayout.astro`** and **`src/components/*.astro`**: shared chrome (nav, footer, glossary modal, accessibility panel, floating action button, chart tooltip) that every page uses. Edit these once instead of copy-pasting across pages.
- **`src/content/blog/*.md`**: blog posts as an Astro content collection. See [Adding blog content](#adding-blog-content) below.
- **`public/js/main.js`**: shared across every page. Handles nav (including the search box), the EN/ES language toggle, the glossary modal, the accessibility panel, the homepage carousels, the data-download helper (`window.loadData`), and the Data Library's filter/download UI.
- **`public/js/housing.js`, `healthcare.js`, `education.js`, `neighborhoods.js`**: one file per dashboard page. Each is self-contained: it renders that page's charts, wires up its tabs/filters, and is only loaded on its own page.
- **`public/css/styles.css`**: the one stylesheet, using CSS custom properties (`--accent`, `--ink`, `--paper`, etc.) defined at the top. A lot of one-off styling also lives in inline `style="..."` attributes directly in the `.astro` files, so don't assume every visual rule is in the stylesheet.

**Charts** are hand-rolled with [D3 v6](https://d3js.org) and [Observable Plot](https://observablehq.com/plot/) (both loaded from a CDN, not npm packages). There's no shared charting library or component. Look at an existing chart in `housing.js` for the pattern before writing a new one from scratch.

**Bilingual copy:** any user-facing text that needs a Spanish translation gets a `data-es="..."` attribute next to the English text, e.g. `<h1 data-es="Elige un tema para comenzar">Pick a topic to dig into</h1>`. `main.js` swaps the visible text based on the language toggle. Always add the `data-es` attribute when you add new copy, rather than inventing a different translation mechanism.

## Adding data and visuals

Charts never query the database directly from the browser. That used to happen, and it meant shipping a live database credential to every visitor, which was a real security problem. Instead, data is snapshotted ahead of time into JSON files that ship as static assets:

```
MotherDuck (hosted DuckDB)  ->  scripts/refresh-data.mjs  ->  public/data/<name>.json  ->  window.loadData('<name>')  ->  chart
```

**If the dataset you need already has a JSON file in `public/data/`,** you don't need any database access; just fetch it and render:

```js
const rows = await window.loadData('housing-rent-income'); // public/data/housing-rent-income.json
```

**If you need a brand-new dataset that isn't in `public/data/` yet:**

1. Add a new SQL query to `scripts/refresh-data.mjs`, in the `SIMPLE_QUERIES` object (or as its own block below, if it needs multiple queries or dynamic logic; see the ALICE or race-trend entries for examples of that).
2. Ask a project lead for a `MOTHERDUCK_TOKEN` (this is a real database credential: never commit it, never paste it into a file that isn't `.env`, and never share it outside the team).
3. Run the script locally to generate the JSON file:
   ```bash
   node --env-file=.env scripts/refresh-data.mjs
   ```
   (create a `.env` file in the repo root with `MOTHERDUCK_TOKEN=...`; it's already gitignored, so it won't be committed). This writes and updates files in `public/data/`.
4. In production, this same script runs automatically once a month via `.github/workflows/refresh-data.yml`, and commits any changed JSON files back to `main`. You shouldn't normally need to run it yourself unless you're adding a new query.

**Then, to actually show the data:**

1. Add a container element to the relevant page, e.g. in `src/pages/housing.astro`:
   ```html
   <div id="my-new-chart" style="width:100%"></div>
   ```
2. In that page's JS file (e.g. `public/js/housing.js`), add a new self-invoking block:
   ```js
   (async function() {
     let rows;
     try {
       rows = await window.loadData('my-new-dataset');
     } catch (e) {
       console.error('my-new-chart load failed:', e);
       window.mdShowError('my-new-chart'); // shows a friendly "Data unavailable" message
       return;
     }
     // render with D3 or Observable Plot into #my-new-chart
   })();
   ```
3. If the chart should respond to the town filter chips or tabs, look at how an existing chart listens for the `masterTownChange` event and registers itself on `window.__renders`, and copy that pattern rather than inventing a new one.

**If the dataset should also be downloadable from the Data Library** (`data-library.html`), add an entry to the `DATASETS` object in `main.js` (filename, source, a plain-language `codebook` array describing each column, and any caveats worth noting) and a matching `.dlib-row` block in `src/pages/data-library.astro`. Look at an existing entry; the shape is consistent and easy to copy.

Two datasets (`dlib-demographics`, `pottstown-demographics`) are known to be broken upstream (the source tables/columns they reference don't exist) and are intentionally left broken with a visible error message rather than guessed at. Check with a project lead before "fixing" either.

## Adding blog content

Blog posts live in `src/content/blog/` as Markdown files with an Astro content-collection frontmatter schema (defined in `src/content.config.ts`).

1. **Create a new file**, e.g. `src/content/blog/my-new-post.md`. The filename (minus `.md`) becomes the post's slug and URL: `blog-my-new-post.html`.
2. **Add frontmatter.** Required fields:
   ```yaml
   ---
   title: "Your headline"
   tag: "Housing"           # short category label shown on the card
   date: 2026-09-01
   readTime: "4 min read"
   thumbnailIcon: "ti-cash" # a Tabler Icons name (see tabler-icons.min.css); shown on the post card
   draft: true              # set to false when ready to publish (see below)
   ---
   ```
   Optional fields: `dek` (a longer subhead shown at the top of the full post), `eyebrow` (small label above the headline), `author`, `authorRole`.
3. **Write the body.** The body isn't plain prose Markdown; it's raw HTML using the site's existing post styling classes (`post-lead`, `post-figure`, `post-media`, `post-quote`, `callout`, `post-sources`, etc.). **Copy `src/content/blog/why-it-now-takes-31-an-hour.md`** as a template. It's the one fully-written post and demonstrates every block type in use (lead paragraph, inline bar-chart figures, pull quotes, callout boxes, a source list, and a button linking back to a dashboard).
4. **Keep `draft: true` while you're still writing.** Draft posts show up as a "coming soon" teaser card on the Stories page but don't get a real page built for them (visiting the URL directly won't work). Set `draft: false` once it's ready to publish.
5. **Add the post's slug to the `ORDER` array in `src/pages/blog.astro`.** The Stories page does *not* automatically list every file in the content collection; it only shows posts whose slug is in that hand-curated array, in that order. Forgetting this step is the most common reason a "finished" post doesn't show up anywhere.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the Astro site and publishes it to GitHub Pages automatically. There's no manual deploy step. If it's on `main`, it's live within a few minutes.
