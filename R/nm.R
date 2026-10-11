# Helpers for quoting figures in page and post text.
#
# Every .qmd starts with a setup chunk that sources this file:
#
#   ```{r}
#   #| include: false
#   source("R/nm.R")
#   ```
#
# (_quarto.yml sets execute-dir: project, so paths are relative to the repo
# root no matter where the .qmd lives.)
#
# Then read a dataset and quote values inline, e.g.
#
#   rent <- nm_data("housing-rent-income")
#   Huntersville's median rent reached `r fmt_dollar(nm_value(rent, "median_rent", town = "Huntersville", year = 2024))`.
#
# The numbers come from the same data/*.json snapshot the charts draw from,
# so text and charts can't drift apart when the data refreshes.

# Read data/<name>.json (written by scripts/refresh-data.mjs) as a data frame.
nm_data <- function(name) {
  path <- file.path("data", paste0(name, ".json"))
  if (!file.exists(path)) stop("No dataset at ", path, call. = FALSE)
  jsonlite::fromJSON(path)
}

# Pull exactly one value out of a dataset by matching columns, e.g.
#   nm_value(rent, "median_rent", town = "Davidson", year = 2018)
# Stops the build if the filters match zero rows or more than one, so a
# renamed town or a missing year fails loudly instead of printing NA.
nm_value <- function(df, col, ...) {
  filters <- list(...)
  keep <- rep(TRUE, nrow(df))
  for (k in names(filters)) keep <- keep & df[[k]] == filters[[k]]
  hits <- df[[col]][which(keep)]
  if (length(hits) != 1) {
    stop(sprintf("nm_value(%s): expected 1 row for %s, found %d", col,
                 paste(names(filters), filters, sep = "=", collapse = ", "), length(hits)),
         call. = FALSE)
  }
  hits
}

# Percent change from `from` to `to`, as a number (42.4 means +42.4%).
pct_change <- function(from, to) (to - from) / from * 100

fmt_dollar <- function(x, digits = 0) {
  paste0(ifelse(x < 0, "-", ""), "$", formatC(abs(x), format = "f", digits = digits, big.mark = ","))
}
fmt_num <- function(x, digits = 0) formatC(x, format = "f", digits = digits, big.mark = ",")
fmt_pct <- function(x, digits = 0) paste0(formatC(x, format = "f", digits = digits), "%")
# "$693k" style, for big dollar figures in stat tiles. Use prefix = "" when
# the "$" is styled separately (e.g. <span class="cur">$</span>).
fmt_k <- function(x, digits = 0, prefix = "$") paste0(prefix, formatC(x / 1000, format = "f", digits = digits), "k")

# "Cornelius, Davidson and Huntersville"
fmt_list <- function(x) {
  if (length(x) <= 1) return(paste(x))
  paste(paste(x[-length(x)], collapse = ", "), "and", x[length(x)])
}

# Guard a sentence whose wording depends on the data, e.g. text that says
# "all three towns" or "Huntersville grew fastest". If a data refresh makes
# the premise false, the build stops with your message instead of publishing
# a sentence that's no longer true. Update the text, then the claim.
#
#   nm_claim(all(hpti_2024 >= 4), "Affordability callout says all three towns are over 4x")
nm_claim <- function(ok, message) {
  if (!isTRUE(all(ok))) {
    stop("Text no longer matches the data: ", message,
         "\nUpdate the sentence (and this nm_claim) in the page that raised it.", call. = FALSE)
  }
  invisible(TRUE)
}

# Building HTML from R (used by R/cards.R and R/data-library.R): escape text,
# and emit a raw block so Pandoc passes generated markup through untouched.
esc <- function(x) htmltools::htmlEscape(x)
raw_html <- function(...) cat("\n```{=html}\n", ..., "\n```\n\n", sep = "")

# Text that follows the page's Area filter. `all` is what "All North Meck"
# shows; `town` is a function(town) returning the text for one town. Every
# version is computed here at build time and written into the page;
# showTown() in js/nm-charts.js displays the one matching the filter (or a
# chart card's own town chips). Use it inline:
#
#   `r by_town(paste("rents rose", fmt_pct(max(chg)), "in", top),
#              function(t) paste("rents rose", fmt_pct(chg[t]), "in", t))`
#
# Single quotes in the markup let it sit inside a component attribute
# (e.g. a .fact's value="...").
NM_TOWNS <- c("Cornelius", "Davidson", "Huntersville")
by_town <- function(all, town) {
  variants <- vapply(NM_TOWNS, function(t) {
    sprintf("<span class='by-town' data-town='%s' hidden>%s</span>", t, town(t))
  }, "")
  paste0("<span class='by-town' data-town='All'>", all, "</span>", paste(variants, collapse = ""))
}

# A chart title or subtitle that names the area, for a .chart-card's title= /
# subtitle=. `town` is a template where {town} becomes each town's name:
#   title="`r area_label('Median Rent by Town', 'Median Rent in {town}')`"
area_label <- function(all, town) by_town(all, function(t) gsub("{town}", t, town, fixed = TRUE))
