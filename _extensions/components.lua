--[[
Site components: write pages in Markdown and get the site's existing HTML.
Registered for every page in _quarto.yml. See docs/quarto-pages.md for usage.

  [ACS]{.gloss}                  glossary term (term = lowercased text)
  [ALICE report]{.gloss term=alice}

  ::: {.note source="[ACS]{.gloss} 2018–2024"}      callout box
  Text of the callout.                              (.warn / .info for color;
  :::                                                caption="..." for a footer
                                                     that isn't "Source: ...")

  ::: {.chart-card #rent-chart-host chart="rent-chart" title="..." subtitle="..."}
  ```{ojs}                                          chart card: the chart cells
  ...                                               go in <div id="rent-chart">
  ```                                               (main.js keys theme tags,
  ::: {.note ...}                                    search, and Data Library
  :::                                                links off that id); notes
  :::                                                after the chart follow it.

  ::: {.question}                                   question heading + intro
  ### How have rents changed?                       paragraph (.small for the
  Intro paragraph.                                  20px heading); any other
  :::                                               content follows them.

  ::: {.section-head eyebrow="Affordability"}       tab section header
  ## How much does it cost to live here?
  Optional lead paragraph.                          (further paragraphs are
  :::                                                smaller notes)

  ::: {.fact value="42%" tone="warn" source="[ACS]{.gloss} 2018–2024"}
  rent rise in Huntersville since 2018              Overview stat tile
  :::

  ::: {.nbhd-section}                               neighborhood dashboard
  #### Population & Ethnicity                       subsection: heading, lead
  Lead paragraph.                                   paragraph, then its charts
  ...charts...
  :::

Every component also accepts style="..." for one-off spacing, which is added
to the outer element exactly as written.
]]

-- Attribute text is a fragment, not a document: a leading "%" is a percent
-- sign, not a Pandoc title block.
local MD = "markdown-tex_math_dollars-smart-pandoc_title_block-yaml_metadata_block"

local function has(el, class) return el.classes and el.classes:includes(class) end

local function gloss_html(text, term)
  term = term or text:lower()
  return string.format(
    '<span class="gloss-link" data-term="%s" role="button" tabindex="0" onclick="glossTerm(\'%s\')">%s</span>',
    term, term, text)
end

local function gloss_span(span)
  if not has(span, "gloss") then return nil end
  local text = pandoc.utils.stringify(span.content)
  return pandoc.RawInline("html", gloss_html(text, span.attributes.term))
end

-- Markdown in an attribute value (title, source, value...) -> inlines,
-- with glossary spans expanded.
local function md(s)
  if not s or s == "" then return pandoc.Inlines({}) end
  local blocks = pandoc.read(s, MD).blocks
  local inl = pandoc.utils.blocks_to_inlines(blocks)
  return inl:walk({ Span = gloss_span })
end

local function html_inlines(inlines)
  return pandoc.write(pandoc.Pandoc({ pandoc.Plain(inlines) }), "html"):gsub("\n$", "")
end

local function raw(s) return pandoc.RawBlock("html", s) end

-- Attr with an optional style copied from the source element.
local function attr(id, classes, el, default_style)
  local style = el.attributes.style or default_style
  return pandoc.Attr(id or "", classes, style and { style = style } or {})
end

-- A single paragraph becomes Plain so it isn't wrapped in <p>.
local function unwrap(blocks)
  if #blocks == 1 and blocks[1].t == "Para" then
    return { pandoc.Plain(blocks[1].content) }
  end
  return blocks
end

local function note(div)
  local classes = { "nm-callout" }
  for _, tone in ipairs({ "warn", "info" }) do
    if has(div, tone) then table.insert(classes, tone) end
  end
  local inner = {}
  if #div.content > 0 then
    table.insert(inner, pandoc.Div(unwrap(div.content), pandoc.Attr("", { "nm-callout-t" })))
  end
  local footer
  if div.attributes.source then
    footer = pandoc.Inlines({ pandoc.Str("Source:"), pandoc.Space() }) .. md(div.attributes.source)
  elseif div.attributes.caption then
    footer = md(div.attributes.caption)
  end
  if footer then
    table.insert(inner, pandoc.Div({ pandoc.Plain(footer) }, pandoc.Attr("", { "nm-callout-s" })))
  end
  return pandoc.Div(inner, attr("", classes, div))
end

local function chart_card(div)
  local a = div.attributes
  local out = {}
  if a.title then table.insert(out, pandoc.Div({ pandoc.Plain(md(a.title)) }, pandoc.Attr("", { "card-t" }))) end
  if a.subtitle then table.insert(out, pandoc.Div({ pandoc.Plain(md(a.subtitle)) }, pandoc.Attr("", { "card-s" }))) end
  -- Everything up to the first callout is the chart; callouts follow it.
  local chart, after, seen_note = {}, {}, false
  for _, b in ipairs(div.content) do
    if b.t == "Div" and has(b, "nm-callout") then seen_note = true end
    table.insert(seen_note and after or chart, b)
  end
  if a.chart then
    table.insert(out, pandoc.Div(chart, pandoc.Attr(a.chart)))
  else
    for _, b in ipairs(chart) do table.insert(out, b) end
  end
  for _, b in ipairs(after) do table.insert(out, b) end
  return pandoc.Div(out, attr(div.identifier, { "card", "viz-host" }, div))
end

local function question(div)
  local out, lead_done = {}, false
  for _, b in ipairs(div.content) do
    if b.t == "Header" and b.level == 3 and #out == 0 then
      local cls = has(div, "small") and "q-h sm" or "q-h"
      table.insert(out, raw('<h3 class="' .. cls .. '">' .. html_inlines(b.content) .. '</h3>'))
    elseif b.t == "Para" and not lead_done then
      lead_done = true
      table.insert(out, raw('<p class="q-lead">' .. html_inlines(b.content) .. '</p>'))
    else
      table.insert(out, b)
    end
  end
  return pandoc.Div(out, attr(div.identifier, { "q-block" }, div))
end

local function section_head(div)
  local seen_lead = false
  local out = { raw('<span class="eyebrow">' .. html_inlines(md(div.attributes.eyebrow)) .. '</span>') }
  for _, b in ipairs(div.content) do
    if b.t == "Header" then
      table.insert(out, raw('<h2 class="sec-h">' .. html_inlines(b.content) .. '</h2>'))
    elseif b.t == "Para" then
      -- First paragraph is the lead; any after it are smaller notes.
      local cls = seen_lead and "lead lead-note" or "lead"
      seen_lead = true
      table.insert(out, raw('<p class="' .. cls .. '">' .. html_inlines(b.content) .. '</p>'))
    else
      table.insert(out, b)
    end
  end
  return pandoc.Div(out, attr("", { "sec-head" }, div))
end

-- Neighborhood dashboard subsection: a #### heading and lead paragraph, then
-- the subsection's charts.
local function nbhd_section(div)
  local out, lead_done = {}, false
  for _, b in ipairs(div.content) do
    if b.t == "Header" and #out == 0 then
      table.insert(out, raw('<div class="nbhd-sub-h">' .. html_inlines(b.content) .. '</div>'))
    elseif b.t == "Para" and not lead_done then
      lead_done = true
      table.insert(out, raw('<p class="nbhd-sub-lead">' .. html_inlines(b.content) .. '</p>'))
    else
      table.insert(out, b)
    end
  end
  return pandoc.Div(out, attr(div.identifier, { "nbhd-sub-section" }, div))
end

local function fact(div)
  local a = div.attributes
  local tone = a.tone and (" " .. a.tone) or ""
  local label = pandoc.utils.blocks_to_inlines(div.content)
  local out = {
    raw('<div class="stat-n' .. tone .. '">' .. html_inlines(md(a.value)) .. '</div>'),
    raw('<p class="stat-l">' .. html_inlines(label) .. '</p>'),
  }
  if a.source then
    table.insert(out, raw('<span class="stat-src">' .. html_inlines(md(a.source)) .. '</span>'))
  end
  return pandoc.Div(out, attr("", { "srow-fig" }, div))
end

local COMPONENTS = {
  { "note", note },
  { "chart-card", chart_card },
  { "question", question },
  { "section-head", section_head },
  { "fact", fact },
  { "nbhd-section", nbhd_section },
}

return {
  { Span = gloss_span },
  {
    Div = function(div)
      for _, c in ipairs(COMPONENTS) do
        if has(div, c[1]) then return c[2](div) end
      end
    end,
  },
}
