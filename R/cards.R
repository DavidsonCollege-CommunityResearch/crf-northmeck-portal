# Card and list templates for content kept in _data/*.yml. Source after R/nm.R
# and call from an `output: asis` chunk, e.g.
#
#   topics <- yaml::read_yaml("_data/topics.yml")
#   topic_cards(topics)

# Topic dashboard cards (Topics page grid and home page carousel).
# first_active: the home carousel marks its first card .is-active.
topic_cards <- function(topics, first_active = FALSE) {
  cards <- vapply(seq_along(topics), function(i) {
    t <- topics[[i]]
    cls <- if (first_active && i == 1) "tcard is-active" else "tcard"
    paste0(
      sprintf('<div class="%s" onclick="window.location=\'/%s.html\'">', cls, t$page),
      sprintf('<div class="tc-icon"><i class="ti %s"></i></div>', t$icon),
      '<div class="tc-t">', esc(t$title), '</div>',
      '<div class="tc-b">', esc(t$description), '</div>',
      '<div class="tc-foot"><span class="badge b-live dot">Last Updated: ', esc(t$updated),
      '</span><span class="tc-go">Open →</span></div></div>'
    )
  }, "")
  paste(cards, collapse = "\n")
}

# Numbered bibliography for the Sources page.
source_list <- function(groups) {
  n <- 0
  out <- vapply(groups, function(g) {
    cites <- vapply(g$sources, function(s) {
      n <<- n + 1
      paste0(
        sprintf('<div class="cite"><div class="cite-num">%02d</div><div class="cite-body">', n),
        '<div class="cite-t">', esc(s$title), '</div>',
        '<div class="cite-pub">', esc(s$publisher), '</div>',
        sprintf('<div class="cite-meta"><a class="cite-link" href="%s" target="_blank" rel="noopener">%s <i class="ti ti-external-link" style="font-size:13px"></i></a></div>',
                esc(s$url), esc(s$link)),
        '</div></div>'
      )
    }, "")
    paste0('<div class="biblio-group">\n<div class="biblio-h" style="font-size:15px">', esc(g$group), '</div>\n',
           paste(cites, collapse = "\n"), '\n</div>')
  }, "")
  paste(out, collapse = "\n")
}

# United Neighborhoods cards on the home page.
neighborhood_cards <- function(nbhds) {
  cards <- vapply(nbhds, function(n) {
    paste0(
      sprintf('<div class="nbhd-tcard" onclick="window.location=\'/neighborhoods.html#%s\'">', n$anchor),
      '<span class="town">', esc(n$town), '</span>',
      '<span class="nm" style="font-size:20px"><i class="ti ti-map-pin tc-pin"></i>', esc(n$name), '</span>',
      '<span class="ds">', esc(n$description), '</span>',
      '<span class="tc-go">Explore →</span></div>'
    )
  }, "")
  paste(cards, collapse = "\n")
}

# Counts for the home page's Resources cards.
count_sources <- function(groups) sum(vapply(groups, function(g) length(g$sources), 0L))
count_datasets <- function(path = "_data/datasets.yml") {
  sum(vapply(yaml::read_yaml(path)$sections, function(s) length(s$datasets), 0L))
}
# Glossary terms live in the glossary modal markup (_partials/after-body.html).
count_glossary_terms <- function(path = "_partials/after-body.html") {
  length(gregexpr('class="gloss-term"', paste(readLines(path, warn = FALSE), collapse = "\n"))[[1]])
}
