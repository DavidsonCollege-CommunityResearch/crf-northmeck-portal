// Shared building blocks for every Observable JS chart on the site.
//
// Pages import what they need inside an {ojs} cell:
//
//   import {Plot, stdPlot, chips, responsive, loadData, TOWNS, townColor} from "/js/nm-charts.js"
//
// Keep chart conventions (fonts, margins, town colors, axis arrows) here so a
// change lands on every page at once instead of being copied chart by chart.

import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
export {Plot};

export const TOWNS = ["Cornelius", "Davidson", "Huntersville"];
// Viridis-based, colorblind-safe. Matches window.TOWN_COLORS in main.js.
export const TOWN_COLORS = {Cornelius: "#440154", Davidson: "#21908c", Huntersville: "#b5de2b"};
export const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
export const FONT = {fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px"};

// Plot color scale for the three towns: {color: townColor({legend: true})}
export function townColor(opts = {}) {
  return {domain: TOWNS, range: TOWNS.map(t => TOWN_COLORS[t]), ...opts};
}

export const fmtDollar = d => "$" + Math.round(d).toLocaleString();
export const fmtK = d => "$" + (d / 1000).toFixed(0) + "k";
export const fmtPct = (d, digits = 0) => d.toFixed(digits) + "%";
export const fmtInt = d => Math.round(d).toLocaleString();
// Short income-bracket labels for tight axes: "$10k-$19,999" -> "$10–20k",
// "$75k-$100k" -> "$75–100k". Anything else is returned unchanged.
export const shortBracket = d => String(d)
  .replace(/^\$(\d+)k-\$(\d+),999$/, (_, a, b) => `$${a}–${+b + 1}k`)
  .replace(/^\$(\d+)k-\$(\d+)k$/, "$$$1–$2k");

// x axis for the 2018–2024 annual series used across the dashboards.
export function yearAxis(opts = {}) {
  return {label: "Year", labelOffset: 50, ticks: YEARS, tickFormat: d => String(d), ...opts};
}

// Round a domain outward to a step, e.g. niceDomain([1213, 1834], 200) -> [1000, 2000].
// Pass {zero: true} to pin the low end at 0.
export function niceDomain(values, step, {zero = false, pad = 0} = {}) {
  const v = values.filter(x => x != null && !Number.isNaN(x));
  const lo = zero ? 0 : Math.max(0, Math.floor((Math.min(...v) - pad) / step) * step);
  const hi = Math.ceil((Math.max(...v) + pad) / step) * step;
  return [lo, hi];
}

const MARGINS = {marginLeft: 64, marginRight: 40, marginTop: 24, marginBottom: 48};

// Render a chart offscreen at its real width and report how far its labels
// spill past each edge (where the SVG clips them), and how far x-axis tick
// labels run into the x-axis title or y-axis tick labels into the y title.
function labelOverflow(chart, width) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;left:-10000px;top:0;width:${width}px;visibility:hidden`;
  probe.append(chart);
  document.body.append(probe);
  try {
    // With a legend, Plot returns a <figure>; the chart is its largest SVG.
    const svgs = chart.tagName.toLowerCase() === "svg" ? [chart] : [...chart.querySelectorAll("svg")];
    const svg = svgs.reduce((a, b) => (b.getBoundingClientRect().height > a.getBoundingClientRect().height ? b : a));
    const box = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim());
    const role = t => (t.closest("[aria-label]") || {getAttribute: () => ""}).getAttribute("aria-label") || "";
    const need = {left: 0, right: 0, top: 0, bottom: 0, xTitle: 0, xTitleAxis: "x", yTitle: 0, crowdedTicks: null, leftGap: 0};
    for (const t of texts) {
      const r = t.getBoundingClientRect();
      need.left = Math.max(need.left, box.left - r.left);
      need.right = Math.max(need.right, r.right - box.right);
      need.top = Math.max(need.top, box.top - r.top);
      need.bottom = Math.max(need.bottom, r.bottom - box.bottom);
    }
    // Empty space between the chart's left edge and its leftmost label or mark
    // (e.g. a left margin estimated too generously for category names).
    const drawn = [...texts, ...svg.querySelectorAll("rect, path, circle, line")].filter(e => !e.closest("defs, clipPath"));
    const lefts = drawn.map(e => e.getBoundingClientRect()).filter(r => r.width || r.height).map(r => r.left);
    if (lefts.length) need.leftGap = Math.min(...lefts) - box.left;
    const overlapHeight = (a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      return w > 0 && h > 0 ? h : 0;
    };
    for (const axis of ["x", "fx"]) {
      const titles = texts.filter(t => role(t) === `${axis}-axis label`);
      const ticks = texts.filter(t => /^f?x-axis tick label$/.test(role(t)));
      for (const title of titles) for (const tick of ticks) {
        const h = overlapHeight(title, tick);
        if (h > need.xTitle) { need.xTitle = h; need.xTitleAxis = axis; }
      }
    }
    // Neighboring x tick labels that run into each other (narrow charts).
    for (const axis of ["x", "fx"]) {
      const ticks = texts.filter(t => role(t) === `${axis}-axis tick label`);
      for (let i = 1; i < ticks.length; i++) {
        if (overlapHeight(ticks[i - 1], ticks[i]) > 0) { need.crowdedTicks = axis; break; }
      }
    }
    for (const title of texts.filter(t => role(t) === "y-axis label")) {
      for (const tick of texts.filter(t => role(t) === "y-axis tick label")) {
        need.yTitle = Math.max(need.yTitle, overlapHeight(title, tick));
      }
    }
    return need;
  } finally {
    probe.remove();
  }
}

// Plot.plot with the site's defaults: margins, font, a left margin wide enough
// for categorical y labels, y starting at zero unless a domain is given, and
// arrows on axis labels (↑ y, x →).
//
// Charts are also fitted to their box: if any label would be clipped at an
// edge, or an axis title would run into tick labels, the matching margin
// grows and the chart is redrawn. Charts that already fit are unchanged.
export function stdPlot(opts) {
  const merged = {...MARGINS, style: FONT, ...opts};
  if (merged.y && Array.isArray(merged.y.domain) && merged.y.domain.length &&
      merged.y.domain.every(d => typeof d === "string")) {
    const longest = merged.y.domain.reduce((a, b) => (b.length > a.length ? b : a), "");
    const fontSize = parseInt(merged.style.fontSize || "12", 10) || 12;
    const needed = Math.ceil(longest.length * fontSize * 0.62) + 26;
    if (!(opts.marginLeft > needed)) merged.marginLeft = needed;
  }
  if (merged.y && merged.y.domain === undefined && merged.y.zero === undefined) {
    merged.y = {...merged.y, zero: true};
  }
  if (merged.y && typeof merged.y.label === "string" && merged.y.label && !merged.y.label.startsWith("↑")) {
    merged.y = {...merged.y, label: "↑ " + merged.y.label};
  }
  if (merged.x && typeof merged.x.label === "string" && merged.x.label && !merged.x.label.endsWith("→")) {
    merged.x = {...merged.x, label: merged.x.label + " →"};
  }
  if (!merged.width || typeof document === "undefined") return Plot.plot(merged);
  let chart = fitLabels(merged);
  // In a .chart-grid row, grow to match the tallest card (see equalizeRow).
  const extra = takeExtraHeight();
  if (extra > 0) {
    merged.height = (merged.height ?? chartHeight(chart, merged.width)) + extra;
    chart = fitLabels(merged);
  }
  return chart;
}

// Draw a chart, then grow margins / tilt ticks until no label is clipped or
// colliding (see labelOverflow). Mutates and returns the plot for `merged`.
function fitLabels(merged) {
  let chart = Plot.plot(merged);
  const PAD = 2;
  let trimmed = false;
  const stuck = {};
  for (let pass = 0; pass < 7; pass++) {
    const need = labelOverflow(chart, merged.width);
    let changed = false;
    for (const [side, key] of [["left", "marginLeft"], ["right", "marginRight"], ["top", "marginTop"], ["bottom", "marginBottom"]]) {
      // Ignore ≤2px (the bottom of lettering isn't visibly clipped), and stop
      // growing a side whose overflow didn't shrink last pass: that label is
      // anchored to the edge and moves with the margin.
      if (need[side] > 2 && !(stuck[side] && need[side] >= stuck[side])) {
        stuck[side] = need[side];
        merged[key] += Math.ceil(need[side]) + PAD;
        changed = true;
      }
    }
    if (need.xTitle > 0.5) {
      // Push the x-axis title below the tick labels it collides with.
      const extra = Math.ceil(need.xTitle) + PAD;
      const axis = merged[need.xTitleAxis] || {};
      if (axis.labelOffset != null) merged[need.xTitleAxis] = {...axis, labelOffset: axis.labelOffset + extra};
      merged.marginBottom += extra;
      changed = true;
    }
    const crowded = need.crowdedTicks && merged[need.crowdedTicks];
    if (crowded && (crowded.tickRotate == null || crowded.tickRotate > -90)) {
      // Tick labels collide: tilt them (-30°, then steeper up to -90°); the
      // next pass makes room for them below the chart.
      const tickRotate = crowded.tickRotate == null ? -30 : Math.max(-90, crowded.tickRotate - 30);
      merged[need.crowdedTicks] = {...crowded, tickRotate};
      changed = true;
    }
    if (need.yTitle > 0.5) {
      // The "↑" y title sits above the plot; more top margin moves the ticks down.
      merged.marginTop += Math.ceil(need.yTitle) + PAD;
      changed = true;
    }
    if (!changed && !trimmed && need.leftGap > 12) {
      // Reclaim unused left margin (once), leaving a little breathing room.
      merged.marginLeft = Math.max(0, merged.marginLeft - Math.floor(need.leftGap - 6));
      trimmed = true;
      changed = true;
    }
    if (!changed) break;
    chart = Plot.plot(merged);
  }
  return chart;
}

// Fetch /data/<name>.json, the same snapshot R reads at build time.
export async function loadData(name) {
  const res = await fetch(`/data/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load data/${name}.json: HTTP ${res.status}`);
  return res.json();
}

function errorBox() {
  const div = document.createElement("div");
  div.className = "md-error";
  div.style.cssText = "padding:24px 12px;text-align:center;color:var(--ink-3);font-family:'Hanken Grotesk',sans-serif;font-size:13.5px";
  div.innerHTML = '<i class="ti ti-cloud-off" style="font-size:22px;display:block;margin-bottom:6px;opacity:.55"></i>' +
    "Couldn't load this chart right now.<br><a href=\"javascript:location.reload()\" style=\"color:var(--accent)\">Try refreshing the page</a>";
  return div;
}

// Height of a chart's main SVG at a given width (rendered offscreen).
function chartHeight(chart, width) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;left:-10000px;top:0;width:${width}px;visibility:hidden`;
  probe.append(chart);
  document.body.append(probe);
  const svgs = chart.tagName.toLowerCase() === "svg" ? [chart] : [...chart.querySelectorAll("svg")];
  const h = Math.max(...svgs.map(svg => svg.getBoundingClientRect().height));
  probe.remove();
  return Math.round(h);
}

// Extra height requested for the chart responsive() is drawing right now.
// Only the first stdPlot() in a draw uses it.
let pendingExtraHeight = 0;
function takeExtraHeight() {
  const extra = pendingExtraHeight;
  pendingExtraHeight = 0;
  return extra;
}

// Charts in the same row of a .chart-grid are drawn to the same height: each
// card's chart grows by the difference between the row's tallest card and its
// own natural height. Runs whenever a card's size changes (charts drawing, a
// hidden tab opening, the window resizing). Single-column grids (phones) have
// one card per row, so nothing grows.
function equalizeRow(grid) {
  const cards = [...grid.children].filter(c => c.offsetParent && c.querySelector(".nm-responsive"));
  const rows = new Map();
  for (const card of cards) {
    const top = Math.round(card.getBoundingClientRect().top);
    rows.set(top, [...(rows.get(top) || []), card]);
  }
  for (const row of rows.values()) {
    const sized = row.map(card => {
      const host = card.querySelector(".nm-responsive");
      const applied = +host.dataset.extraHeight || 0;
      return {host, applied, natural: card.getBoundingClientRect().height - applied};
    });
    const tallest = Math.max(...sized.map(c => c.natural));
    for (const {host, applied, natural} of sized) {
      const want = row.length > 1 ? Math.round(tallest - natural) : 0;
      if (Math.abs(want - applied) > 1) { host.dataset.extraHeight = want; host.nmRedraw?.(); }
    }
  }
}
function watchGrid(grid) {
  let frame = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => equalizeRow(grid)); });
  ro.observe(grid);
  for (const card of grid.children) ro.observe(card);
}
if (typeof document !== "undefined") document.querySelectorAll(".chart-grid").forEach(watchGrid);

// A container that redraws its chart whenever its own width changes: on page
// load, when a hidden tab becomes visible, when the card is expanded into the
// full-screen viewer, and on window resize. render(width) returns a node.
//
//   responsive(width => stdPlot({width, ...}), {invalidation})
//
// Pass the cell's `invalidation` promise so the observer is released when the
// cell re-runs (e.g. after a chip changes).
export function responsive(render, {invalidation, minWidth = 50} = {}) {
  const host = document.createElement("div");
  host.className = "nm-responsive";
  host.style.width = "100%";
  let last = 0, frame = 0;
  const draw = width => {
    // Extra height only applies while the card sits in a .chart-grid (not,
    // e.g., when it's moved into the expanded-chart viewer).
    pendingExtraHeight = host.closest(".chart-grid") ? (+host.dataset.extraHeight || 0) : 0;
    try { host.replaceChildren(render(width)); }
    catch (err) { console.error(err); host.replaceChildren(errorBox()); }
    finally { pendingExtraHeight = 0; }
  };
  host.nmRedraw = () => { if (last) draw(last); };
  const ro = new ResizeObserver(entries => {
    const width = Math.floor(entries[0].contentRect.width);
    if (width < minWidth || width === last) return;
    last = width;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => draw(width));
  });
  ro.observe(host);
  // Charts are fitted to their labels' measured size, so redraw once the web
  // fonts have loaded (a first draw may have measured a fallback font).
  if (document.fonts && document.fonts.status !== "loaded") {
    document.fonts.ready.then(() => { if (last && host.isConnected) draw(last); });
  }
  if (invalidation) invalidation.then(() => { ro.disconnect(); cancelAnimationFrame(frame); });
  return host;
}

// A row of filter chips that works as an Observable input:
//
//   viewof town = chips(["All", ...TOWNS], {label: "Town:", value: "All"})
//
// Options can be strings or {label, value} objects. With {multiple: true} each
// chip toggles independently and the value is an array of the chips that are on.
// Renders the same .filterbar / .chip / .chip.on markup the site's CSS styles.
export function chips(options, {label, hint, value, multiple = false, style} = {}) {
  const opts = options.map(o => (typeof o === "object" ? o : {label: String(o), value: o}));
  const bar = document.createElement("div");
  bar.className = "filterbar";
  if (style) bar.style.cssText = style;
  if (label) {
    const span = document.createElement("span");
    span.className = "lbl";
    span.textContent = label;
    bar.append(span);
  }
  let current = multiple
    ? (value === undefined ? opts.map(o => o.value) : [...value])
    : (value === undefined ? opts[0].value : value);
  const buttons = opts.map(o => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = o.label;
    b.addEventListener("click", () => {
      if (multiple) {
        current = current.includes(o.value) ? current.filter(v => v !== o.value) : [...current, o.value];
      } else {
        if (current === o.value) return;
        current = o.value;
      }
      sync();
      bar.dispatchEvent(new Event("input", {bubbles: true}));
    });
    bar.append(b);
    return [b, o.value];
  });
  if (hint) {
    const span = document.createElement("span");
    span.className = "hint";
    span.textContent = hint;
    bar.append(span);
  }
  function sync() {
    for (const [b, v] of buttons) {
      const on = multiple ? current.includes(v) : current === v;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  Object.defineProperty(bar, "value", {
    get: () => (multiple ? [...current] : current),
    set: v => { current = multiple ? [...v] : v; sync(); }
  });
  sync();
  return bar;
}

// Town chips in the shape most dashboard charts use. `follow` is the page's
// master town filter: when it changes, this chart's chips jump to match it.
//   viewof rentTown = townChips(masterTown)
export function townChips(follow = "All", {all = "All towns", label = "Town:", includeAll = true} = {}) {
  const options = [...(includeAll ? [{label: all, value: "All"}] : []), ...TOWNS];
  const value = !includeAll && follow === "All" ? TOWNS[0] : follow;
  return chips(options, {label, value, style: "margin-bottom:14px"});
}

// Show the town-specific version of text written with by_town() in R/nm.R.
// With no scope it updates the whole page (call it with the page's Area
// filter); pass a selector to update only the text inside one chart card,
// e.g. showTown(rentTown, "#rent-chart-host") from that chart's cell.
// Text inside a card that has its own town chips follows those chips.
export function showTown(town, scope) {
  const root = scope ? document.querySelector(scope) : document;
  if (!root) return;
  for (const el of root.querySelectorAll(".by-town")) {
    if (!scope && el.closest("[data-town-scope]")) continue;
    el.hidden = el.dataset.town !== town;
  }
  if (scope) root.setAttribute("data-town-scope", "");
}
