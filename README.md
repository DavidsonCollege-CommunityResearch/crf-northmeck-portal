# North Meck Insights

A public-data portal built by Davidson College's Community Research Fellows (CRF) program. It presents housing, education, and healthcare data for North Mecklenburg, NC (Davidson, Cornelius, Huntersville), plus profiles of five "United Neighborhoods." Live at https://northmeckinsights.org/.

This README is for CRF student developers working on the codebase. If you just want to read the site, visit the live URL; you don't need anything in here.

## Getting started

**Prerequisites:**

- [Quarto](https://quarto.org/docs/get-started/) 1.9 or newer (`quarto --version`).
- [R](https://cran.r-project.org/) 4.4 or newer, with the packages listed in `DESCRIPTION`. Install them from R with `install.packages(c("jsonlite", "knitr", "rmarkdown"))`, or `remotes::install_deps()`.
- RStudio or Positron is the easiest editor, but any editor works.

```bash
quarto preview          # local server with live reload
quarto render           # builds the whole site into _site/
quarto render housing.qmd   # builds one page
```

On Windows, run these from PowerShell or the RStudio terminal; R crashes when started from Git Bash.

There's no test suite. The main checks are: does it render, does it look and behave right in the browser, and do the `nm_claim()` checks pass (see below).

You do **not** need any database credentials for most work. See [Adding data](#adding-data) for the one case where you would.

## How the site is built

The site is a [Quarto](https://quarto.org) website. **Read [`docs/quarto-pages.md`](docs/quarto-pages.md) before editing a page**; it's short and explains the patterns every page uses.

- **`*.qmd` at the repo root:** one file per page (`index`, `housing`, `education`, `healthcare`, `neighborhoods`, `nbhd-data`, `topics`, `data-library`, `sources`, `blog`, `about`). Each becomes `page.html` at the same URL as before.
- **`posts/*.qmd`:** Stories (blog posts).
- **`_partials/`:** the nav, footer, modals, and accessibility panel shared by every page. Edit them once here.
- **`js/nm-charts.js`:** shared chart helpers (chart defaults, filter chips, resizing, data loading).
- **`R/nm.R`:** shared helpers for quoting numbers in text.
- **`js/main.js`:** site-wide behavior (nav search, glossary, accessibility panel, carousels, chart expand/share, Data Library downloads).
- **`css/styles.css`:** the one stylesheet. A lot of one-off styling also lives in inline `style="..."` attributes in the pages.
- **`data/*.json`:** the data snapshot every chart and number comes from.
- **`_data/*.yml`:** lists that pages are built from: the Data Library catalog (`datasets.yml`), the Sources bibliography (`sources.yml`), topic cards (`topics.yml`, shared by the Topics and home pages), and the home page's neighborhood cards (`neighborhoods.yml`). To add a source, topic, or dataset, edit the YAML, not the page.

**Charts** are [Observable JS](https://quarto.org/docs/interactive/ojs/) cells using [Observable Plot](https://observablehq.com/plot/). Copy a chart from `housing.qmd` rather than starting from scratch: the filter chips, town colors, and resizing are already handled by `js/nm-charts.js`.

**Numbers in text** (stat tiles, callouts, sentences in posts) are computed in R from the same data and written with inline code, so they update when the data does:

```markdown
Median rent in Huntersville reached `r fmt_dollar(rent_2024)` in 2024.
```

When a sentence's wording depends on the data ("all three towns", "grew fastest"), add a check:

```r
nm_claim(all(rent_change > income_change), "callout says rents outpaced incomes in every town")
```

If a future data refresh makes that false, the build stops with your message instead of publishing a sentence that's no longer true.

## Adding data

Charts never query the database from the browser. Data is snapshotted ahead of time into JSON files that ship with the site:

```
MotherDuck (hosted DuckDB)  ->  scripts/refresh-data.mjs  ->  data/<name>.json  ->  R (text) and Observable JS (charts)
```

**If the dataset you need already has a file in `data/`,** you don't need database access. In R: `rows <- nm_data("housing-rent-income")`. In an OJS cell: `rows = loadData("housing-rent-income")`.

**If you need a new dataset:**

1. Add a SQL query to `scripts/refresh-data.mjs`, in the `SIMPLE_QUERIES` object (or as its own block if it needs dynamic logic; see the ALICE or race-trend entries).
2. Ask a project lead for a `MOTHERDUCK_TOKEN`. It's a real database credential: never commit it, never put it anywhere but `.env`, and never share it outside the team.
3. Install Node.js 22.12+, run `npm install`, create a `.env` file with `MOTHERDUCK_TOKEN=...` (it's gitignored), and run:
   ```bash
   node --env-file=.env scripts/refresh-data.mjs
   ```
   This writes and updates files in `data/`.
4. In production, the same script runs once a month (`.github/workflows/refresh-data.yml`), commits changed files to `main`, and the site redeploys automatically.

Never type data values into a page or chart. If a number isn't in `data/` yet, add it to a dataset first.

**If the dataset should also be downloadable from the Data Library**, add an entry to `_data/datasets.yml` (copy an existing one). That one entry builds the row on the Data Library page and drives its CSV, Excel, and codebook downloads.

`dlib-demographics` is known to be broken upstream (it references a column that doesn't exist on its source table) and is intentionally left showing a visible error. Check with a project lead before "fixing" it. Several datasets are static exports with no query behind them yet; `CLAUDE.md` lists them.

## Adding a story

1. **Copy `posts/why-1647-a-month.qmd`** to `posts/my-new-post.qmd`. It shows every block a post uses: lead paragraph, charts, pull quote, callouts, a table built from data, sources, and a button back to a dashboard.
2. **Edit the front matter:**
   ```yaml
   ---
   title: "Your headline"
   description: "One or two sentences shown under the headline."
   pagetitle: "Your headline · North Meck Insights"
   categories: [Housing]       # the tag shown on the card
   eyebrow: "Housing · Analysis"
   date: 2026-09-01
   read-time: "4 min read"
   image: /images/my-thumbnail.jpg    # or leave out and set thumbnail-icon
   thumbnail-icon: ti-cash            # a Tabler Icons name, used when there's no image
   author: "Your Name"
   author-role: "2026 Community Research Fellow"
   draft: true
   ---
   ```
3. **Write the post** in Markdown, using HTML for the site's styled blocks (`post-lead`, `post-figure`, `post-quote`, `nm-callout`, `post-sources`). Put every figure you quote in the R setup chunk and print it with inline `r` code.
4. **Keep `draft: true` while writing.** Drafts aren't published. Remove it when the post is ready: the Stories page and home page list every published post, newest first. To publish a post without listing it, use `unlisted: true`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which renders the site with Quarto and R and publishes it to GitHub Pages. It also runs after the monthly data refresh. If a render fails (for example an `nm_claim()` check), nothing is published and the live site stays as it was; check the workflow's log for the message.
