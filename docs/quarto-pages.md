# Writing pages for the Quarto site

The site is a Quarto website (`_quarto.yml`). Every page is a `.qmd` file at the
repo root (posts live in `posts/`). Quarto renders them into `_site/` as flat
`page.html` files at the same URLs the site has always used.

`housing.qmd` is the reference implementation: when in doubt, copy its patterns.

## Page skeleton

```markdown
---
pagetitle: "Housing · North Meck Insights"
---

```{r}
#| include: false
source("R/nm.R")
rent <- nm_data("housing-rent-income")
# ...compute every number the page quotes, plus nm_claim() checks...
```

<div class="page active" style="display:block">
<div class="wrap">
...page HTML...
</div>
</div>
```

- Use `pagetitle`, not `title` (a `title` adds Quarto's own title block).
- The nav, footer, modals, accessibility panel, and `js/main.js` are injected
  on every page from `_partials/`. Don't repeat them in pages.
- Use root-absolute URLs (`/images/x.jpg`, `/housing.html`) so links work from
  `posts/` too.

## Page building blocks

Write pages in Markdown. A filter (`_extensions/components.lua`) turns these
blocks into the site's exact HTML, so you never hand-write the markup:

````markdown
::: {.section-head eyebrow="Affordability"}
## How much does it actually cost to live here?
:::

::: {.question}
### How have rents changed across the three towns?

Median rent by town, 2018–2024.
:::

::: {.chart-card #rent-chart-host chart="rent-chart" title="Median Rent by Town" subtitle="Cornelius, Davidson, Huntersville"}

```{ojs}
...chart code...
```

::: {.note source="[ACS]{.gloss} 2018–2024"}
Median rent in Huntersville rose `r fmt_pct(chg)` since 2018.
:::

:::

::: {.fact value="`r fmt_pct(chg)`" tone="warn" source="[ACS]{.gloss} 2018–2024"}
rent rise in Huntersville since 2018
:::
````

| Block | Makes | Options |
|---|---|---|
| `[ACS]{.gloss}` | clickable glossary term | `term=alice` when the term differs from the text |
| `::: {.note}` | callout box | `.warn` / `.info` color; `source="..."` (adds "Source:"); `caption="..."` for any other footer |
| `::: {.chart-card}` | chart card | `#host-id`; `chart="chart-id"` wraps the chart cells; `title`, `subtitle`; notes after the chart sit under it; `.wide` spans a full `.chart-grid` row |
| `::: {.question}` | question heading + intro | starts with a `###` heading and a paragraph; `.small` for the smaller heading |
| `::: {.section-head}` | a tab's section header | `eyebrow="..."`, a `##` heading, optional lead paragraph (later paragraphs become smaller notes) |
| `::: {.fact}` | Overview headline figure | `value`, `tone="warn"`, `source`; `target="#card-id"` makes it scroll to its chart |
| `::: {.nbhd-section}` | neighborhood dashboard subsection | starts with a `####` heading and a lead paragraph; its charts follow |

Every block takes `style="..."` for one-off spacing. Attribute values are
Markdown, so `[ACS]{.gloss}`, `*italics*`, and inline `r` code work inside
them. Plain layout wrappers are ordinary fenced divs: `::: {.wrap}`,
`::: {.g2}`, `::: {.tabpane data-pane="supply"}`.

### Overview tabs: a figure row and a chart grid

Each dashboard's Overview puts its headline figures in one row and their
charts in a two-column grid below, in the same order:

````markdown
::: {.fact-band}

::: {.fact target="#ov-rent-host" value="`r fmt_pct(chg)`" tone="warn" source="[ACS]{.gloss} 2018–2024"}
rent rise in Huntersville since 2018
:::

...more figures...

:::

::: {.chart-grid}

::: {.chart-card #ov-rent-host title="Median Rent by Town" chart="ov-rent"}
...chart cell...
:::

::: {.chart-card .wide #ov-growth-host title="..." chart="ov-growth"}
...a chart that gets a whole row...
:::

:::
````

- A figure with `target="#card-id"` scrolls to that chart and outlines it when
  clicked (or focused and Enter pressed). A glossary term inside the figure
  still opens the glossary instead.
- Charts in the same grid row are drawn to the same height automatically: the
  shorter one grows to match. Pair charts of similar size, and give a chart
  that is much shorter or taller than its neighbors `.wide` so it gets its own
  row instead of being stretched.
- The figure row wraps to 2×2 and the grid to one column on phones.

One-off layouts (a page's hero and tab bar, the home page) stay as HTML in a
raw block, which Pandoc passes through untouched:

````markdown
```{=html}
<div class="dash-hero">...</div>
```
````

If you write HTML outside a raw block: keep it flush left (4+ leading spaces
make a code block), put blank lines around code cells and fenced divs, and
use `nm-callout`, never `callout` (Quarto reserves that class).

## Numbers in text come from R

Every figure quoted in a stat tile, callout, or paragraph is computed from
`data/*.json` in the setup chunk and printed with inline R:

```markdown
<div class="stat-n warn">`r fmt_pct(rent_chg[rent_top])`</div>
```

Helpers in `R/nm.R`: `nm_data()`, `nm_value()`, `pct_change()`, `fmt_dollar()`,
`fmt_pct()`, `fmt_num()`, `fmt_k()`, `fmt_list()`.

When a sentence's *wording* depends on the data ("all three towns", "grew
fastest", "only registered nurses"), guard it with `nm_claim()`:

```r
nm_claim(all(rent_chg > inc_chg), "callout says rents outpaced incomes in every town")
```

If a data refresh makes the claim false, the build fails with that message
instead of publishing a sentence that is no longer true.

Text that can't be checked against our data (a quote, a national figure, a
statistic from a report we don't hold) stays as written; note where it came
from in the source line.

### Text that follows the Area filter

On dashboards, a stat tile or callout about one town should change when the
reader picks a town. Write the "All North Meck" version and a function that
writes any one town's version; `by_town()` puts every version in the page and
the filter shows the right one:

```r
# setup chunk
rent_all_text <- paste0("Rents rose fastest in ", rent_top, " (", fmt_pct(rent_chg[[rent_top]]), ").")
```

```markdown
::: {.note source="[ACS]{.gloss} 2018–2024"}
`r by_town(rent_all_text, function(t) paste0("Rents in ", t, " rose ", fmt_pct(rent_chg[[t]]), " since 2018."))`
:::
```

- Long "All" sentences read best as a named string in the setup chunk.
- The page needs `showTown(masterTown)` in an OJS cell after the Area filter.
  A callout inside a chart card with its own town chips follows those chips
  instead: put `showTown(rentTown, "#rent-chart-host");` first in the
  chart's cell.
- Guard per-town wording with `nm_claim()` too ("rose", "highest").
- Text that isn't about a single town (definitions, regional data) doesn't
  need `by_town()`.

## Charts are Observable JS

One hidden setup cell per page imports the shared helpers and loads data:

````markdown
```{ojs}
//| output: false
import {Plot, stdPlot, chips, townChips, responsive, loadData, TOWNS, TOWN_COLORS, townColor, yearAxis, niceDomain, fmtDollar, fmtK, FONT} from "/js/nm-charts.js"
rentIncome = loadData("housing-rent-income")
byTown = (rows, town) => town === "All" ? rows : rows.filter(d => d.town === town)
```
````

Each chart lives in a `.chart-card` whose `chart="..."` id main.js uses for
theme tags, search anchors, and Data Library links (keep ids stable):

````markdown
::: {.chart-card #rent-chart-host chart="rent-chart" title="Median Rent by Town"}

```{ojs}
viewof rentTown = townChips(masterTown)
{
  const data = byTown(rentIncome, rentTown);
  return responsive(width => stdPlot({
    width, height: 360,
    x: yearAxis(),
    y: {label: "Median rent ($/mo)", grid: true, tickFormat: fmtDollar},
    color: townColor({legend: rentTown === "All"}),
    marks: [Plot.line(data, {x: "year", y: "median_rent", stroke: "town"})]
  }), {invalidation});
}
```

:::
````

- `stdPlot()` fits each chart to its labels: after drawing, it measures the
  chart and widens a margin when a label would be clipped or collide with an
  axis title, tilts x tick labels that run into each other, and trims unused
  left margin. You rarely need hand-tuned `marginLeft` / `marginBottom`. Style
  axis labels inside the chart definition (e.g. `Plot.axisX({fontWeight: 600})`)
  rather than editing the SVG afterwards, so they're measured as they appear.
- `responsive(render, {invalidation})` redraws at the container's width on
  load, when a hidden tab opens, when the card is expanded, and on resize.
- `chips(options, {label, value, multiple})` renders the site's `.filterbar` /
  `.chip` markup and works as an Observable input (`viewof x = chips(...)`).
- `townChips(masterTown)` gives a chart its own town chips that also follow
  the page-wide filter. The page-wide filter itself is
  `viewof masterTown = chips([{label: "All North Meck", value: "All"}, ...TOWNS], {label: "Area:", hint: "filters every chart"})`.
- Tabs (`<span class="tab" onclick="setTab(this)">` + `.tabpane`) are plain
  HTML handled by main.js; charts in hidden tabs draw when they're shown.

## Data

`data/*.json` is the single source for both R (build time) and OJS (in the
browser). Most files are written by `scripts/refresh-data.mjs` from MotherDuck.
A few are static exports with no query behind them yet; see CLAUDE.md. Never
type data values into a page or chart: add or extend a dataset instead.

## Building and checking

- `quarto render` builds the whole site; `quarto render housing.qmd` builds one page.
- `quarto preview` serves the site with live reload.
- On Windows, run Quarto/R from PowerShell; `Rscript` segfaults when launched
  from Git Bash.
