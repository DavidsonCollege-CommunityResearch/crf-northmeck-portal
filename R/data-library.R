# Builds the Data Library page from _data/datasets.yml. Source after R/nm.R.
#
#   catalog <- dlib_catalog()
#   dlib_sections(catalog)          # in an `output: asis` chunk: the dataset rows
#   dlib_download_registry(catalog) # in an `output: asis` chunk: download info for main.js

dlib_catalog <- function(path = "_data/datasets.yml") yaml::read_yaml(path)

dlib_row <- function(d, themes) {
  pills <- vapply(d$themes, function(t) {
    sprintf('<span class="theme-pill dlib-theme-tag theme-%s">%s</span>', t, esc(themes[[t]]))
  }, "")
  tags <- vapply(d$tags, function(t) sprintf('<span class="dlib-tag">%s</span>', esc(t)), "")
  paste0(
    sprintf('<div class="dlib-row" id="dlib-%s" data-id="%s" data-name="%s" data-geo="%s" data-topic="%s" data-theme="%s">',
            d$id, d$id, esc(d$keywords), d$level, paste(d$topics, collapse = " "), paste(d$themes, collapse = " ")),
    '<div class="dlib-row-info">',
    '<div class="dlib-row-name">', esc(d$name), '</div>',
    '<div class="dlib-row-desc">', esc(d$description), '</div>',
    '<div class="dlib-row-meta">', paste(pills, collapse = ""), paste(tags, collapse = ""), '</div>',
    '</div>',
    '<div class="dlib-row-actions">',
    '<button class="dlib-dl" onclick="dlibDownload(event,\'CSV\')"><i class="ti ti-file-text"></i> CSV</button>',
    '<button class="dlib-dl" onclick="dlibDownload(event,\'Excel\')"><i class="ti ti-table"></i> Excel</button>',
    '<button class="dlib-dl dlib-cb" onclick="dlibDownload(event,\'Codebook\')"><i class="ti ti-book-2"></i> Codebook</button>',
    '</div></div>'
  )
}

dlib_sections <- function(catalog) {
  for (s in catalog$sections) {
    rows <- vapply(s$datasets, dlib_row, "", themes = catalog$themes)
    raw_html('<div class="dlib-section"><h2 class="dlib-section-h">', esc(s$title), '</h2>\n',
             paste(rows, collapse = "\n"), '\n</div>')
  }
}

# window.DLIB_DATASETS, in the shape main.js's download code expects.
dlib_download_registry <- function(catalog) {
  reg <- list()
  for (s in catalog$sections) for (d in s$datasets) {
    dl <- d$download
    entry <- list(
      filename = dl$file, source = dl$source, years = dl$years, jsonFile = dl$data,
      codebook = lapply(dl$codebook, function(c) c(c$column, c$type, c$description))
    )
    if (!is.null(dl$notes)) entry$notes <- dl$notes
    reg[[d$id]] <- entry
  }
  raw_html("<script>window.DLIB_DATASETS = ",
           jsonlite::toJSON(reg, auto_unbox = TRUE), ";</script>")
}
