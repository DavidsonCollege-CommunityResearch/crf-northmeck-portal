// Neighborhoods / nbhd-data page scripts
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
window.Plot = Plot;

(async function () {
  // ── Design tokens ─────────────────────────────────────────────────────────
  const STYLE   = { fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px' };
  const ACCENT  = '#3f4e75';
  const RED     = '#e05c4b';
  const BLUE2   = '#6b7fa3';
  const GOLD    = '#f0a500';
  const MUTED   = '#b0b8c8';

  const RACE_COLORS = {
    'White alone':         BLUE2,
    'Black or Afr. Am.':  ACCENT,
    'Hispanic or Latino':  RED,
    'Asian alone':         GOLD,
    'Other / multiracial': MUTED,
  };

  // ── Neighborhood metadata ─────────────────────────────────────────────────
  const NBHD_META = {
    pottstown:       { name: 'Pottstown',        subtitle: 'Block-group level ACS data for the Pottstown area in Huntersville.' },
    westdavidson:    { name: 'West Davidson',    subtitle: 'Block-group level ACS data for the West Davidson area in Davidson.' },
    smithville:      { name: 'Smithville',       subtitle: 'Block-group level ACS data for the Smithville area in Cornelius.' },
    huntingtongreen: { name: 'Huntington Green', subtitle: 'Block-group level ACS data for the Huntington Green area in Huntersville.' },
    eastcatawba:     { name: 'East Catawba',     subtitle: 'Data coming soon for the East Catawba area in Cornelius.' },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let currentKey = 'pottstown';
  const CHARTS   = {}; // id → { el, buildFn, dataset }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function forNbhd(ds, key) {
    const name = (NBHD_META[key] || {}).name || key;
    return ds.filter(d => d.neighborhood_name === name);
  }

  function noData(el) {
    el.innerHTML = '<p style="color:#e05c4b;padding:12px;font-size:13px;font-family:\'Hanken Grotesk\',sans-serif">Data unavailable</p>';
  }

  function yMax(rows, col, padding) {
    const mx = Math.max(...rows.map(d => d[col] || 0));
    return Math.ceil((mx * padding) / 5) * 5 || 10;
  }

  // ── Chart registry ────────────────────────────────────────────────────────
  // reg() associates a chart ID with a dataset and build function.
  // ResizeObserver renders it at the correct width whenever it becomes visible.
  // Neighborhood switches call draw(id) directly to re-render all registered charts.
  function reg(id, dataset, buildFn) {
    const el = document.getElementById(id);
    if (!el) return;
    CHARTS[id] = { el, buildFn, dataset };
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) draw(id, w);
    });
    ro.observe(el);
    if (el.offsetWidth > 0) draw(id, el.offsetWidth);
  }

  function draw(id, w) {
    const { el, buildFn, dataset } = CHARTS[id];
    const rows = forNbhd(dataset, currentKey);
    if (!rows.length) { noData(el); return; }
    const svg = buildFn(rows, w || el.offsetWidth || 480);
    if (svg) el.replaceChildren(svg);
  }

  function redrawAll() {
    for (const id in CHARTS) draw(id);
  }

  // ── Load all datasets concurrently ────────────────────────────────────────
  let DEMO = [], ECON = [], HOUS = [], EDUC = [], TRAN = [], CHLD = [];
  try {
    [DEMO, ECON, HOUS, EDUC, TRAN, CHLD] = await Promise.all([
      window.loadData('nbhd-demographics'),
      window.loadData('nbhd-economic'),
      window.loadData('nbhd-housing'),
      window.loadData('nbhd-education'),
      window.loadData('nbhd-transportation'),
      window.loadData('nbhd-childcare'),
    ]);
    // Coerce all numeric strings to numbers in-place
    for (const ds of [DEMO, ECON, HOUS, EDUC, TRAN, CHLD]) {
      ds.forEach(row => {
        for (const k in row) {
          if (k !== 'neighborhood_name' && row[k] !== null && !isNaN(row[k])) {
            row[k] = Number(row[k]);
          }
        }
      });
    }
  } catch (e) {
    console.error('Neighborhood data load failed:', e);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: DEMOGRAPHICS
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-pop-chart', DEMO, (rows, w) => {
    const mx = Math.max(...rows.map(d => d.total_population));
    return window.stdPlot({
      width: w, height: 260, marginBottom: 48, style: STYLE,
      x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
      y: { label: '↑ Population', labelOffset: 48, grid: true,
           domain: [0, Math.ceil((mx * 1.15) / 50) * 50] },
      marks: [
        Plot.line(rows, { x: 'year', y: 'total_population', stroke: ACCENT, strokeWidth: 2.5 }),
        Plot.dot(rows,  { x: 'year', y: 'total_population', fill: ACCENT, r: 4,
          tip: true, title: d => `${d.year}\n${Math.round(d.total_population).toLocaleString()} residents` }),
        Plot.ruleY([0]),
      ],
    });
  });

  reg('nd-race-chart', DEMO, (rows, w) => {
    const latest = rows[rows.length - 1];
    if (!latest) return null;
    const total = latest.total_population || 1;
    const other = Math.max(0, total - latest.race_white - latest.race_black - latest.race_asian);
    const raceData = [
      { group: 'White alone',         pct: +(latest.race_white / total * 100).toFixed(1) },
      { group: 'Black or Afr. Am.',   pct: +(latest.race_black / total * 100).toFixed(1) },
      { group: 'Hispanic or Latino',  pct: +(latest.hispanic_latino / total * 100).toFixed(1) },
      { group: 'Asian alone',         pct: +(latest.race_asian / total * 100).toFixed(1) },
      { group: 'Other / multiracial', pct: +(other / total * 100).toFixed(1) },
    ];
    return window.stdPlot({
      width: w, height: 280, marginBottom: 56, style: STYLE,
      y: { label: 'Share of population (%)', labelOffset: 48, grid: true, domain: [0, 100],
           tickFormat: d => d + '%' },
      x: { label: null, domain: raceData.map(d => d.group) },
      marks: [
        Plot.barY(raceData, { x: 'group', y: 'pct', fill: d => RACE_COLORS[d.group], rx: 3 }),
        Plot.text(raceData, { x: 'group', y: 'pct', text: d => d.pct + '%', dy: -8,
          fill: 'var(--ink-2)', fontSize: 12 }),
        Plot.ruleY([0]),
      ],
    });
  });

  reg('nd-hl-chart', DEMO, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 36, marginLeft: 54, style: STYLE,
    y: { label: null, domain: rows.map(d => d.year), tickFormat: String },
    x: { label: 'Share Hispanic or Latino (%)', labelOffset: 30, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'hispanic_rate', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.barX(rows, { x: 'hispanic_rate', y: 'year', fill: RED, rx: 3 }),
      Plot.text(rows, { x: 'hispanic_rate', y: 'year',
        text: d => (d.hispanic_rate || 0) + '%', dx: 6,
        textAnchor: 'start', fill: 'var(--ink-2)', fontSize: 12 }),
      Plot.ruleX([0]),
    ],
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: ECONOMIC PROFILE
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-income-dist-chart', ECON, (rows, w) => {
    const latest = rows[rows.length - 1];
    if (!latest) return null;
    const total = latest.total_households || 1;
    const brackets = [
      { label: 'Under $25k', pct: +(latest.income_under_25k / total * 100).toFixed(1) },
      { label: '$25k–$50k',  pct: +(latest.income_25k_50k  / total * 100).toFixed(1) },
      { label: '$50k–$100k', pct: +(latest.income_50k_100k / total * 100).toFixed(1) },
      { label: '$100k+',     pct: +(latest.income_100k_plus / total * 100).toFixed(1) },
    ];
    return window.stdPlot({
      width: w, height: 210, marginBottom: 36, style: STYLE,
      x: { label: 'Share of households (%) →', labelOffset: 30, domain: [0, 100],
           tickFormat: d => d + '%' },
      y: { label: null, domain: brackets.map(d => d.label) },
      marks: [
        Plot.barX(brackets, { x: 'pct', y: 'label', fill: ACCENT, rx: 3 }),
        Plot.text(brackets, { x: 'pct', y: 'label', text: d => d.pct + '%', dx: 6,
          textAnchor: 'start', fill: 'var(--ink-2)', fontSize: 12 }),
        Plot.ruleX([0]),
      ],
    });
  });

  reg('nd-income-trend-chart', ECON, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ Median Household Income', labelOffset: 56, grid: true,
         tickFormat: d => '$' + (d / 1000).toFixed(0) + 'k' },
    marks: [
      Plot.line(rows, { x: 'year', y: 'median_household_income', stroke: ACCENT, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'median_household_income', fill: ACCENT, r: 4,
        tip: true, title: d => `${d.year}\n$${Math.round(d.median_household_income).toLocaleString()}` }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-poverty-chart', ECON, (rows, w) => window.stdPlot({
    width: w, height: 200, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ Poverty Rate', labelOffset: 40, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'poverty_rate', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.line(rows, { x: 'year', y: 'poverty_rate', stroke: RED, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'poverty_rate', fill: RED, r: 4,
        tip: true, title: d => `${d.year}\n${d.poverty_rate}% below poverty line` }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-gini-chart', ECON, (rows, w) => window.stdPlot({
    width: w, height: 200, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ Gini Index', labelOffset: 40, grid: true, domain: [0, 1] },
    marks: [
      Plot.line(rows, { x: 'year', y: 'gini', stroke: BLUE2, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'gini', fill: BLUE2, r: 4,
        tip: true, title: d => `${d.year}\nGini: ${d.gini}` }),
      Plot.ruleY([0]),
    ],
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: HOUSING
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-tenure-chart', HOUS, (rows, w) => {
    const latest = rows[rows.length - 1];
    if (!latest) return null;
    const tenureData = [
      { label: 'Owner-occupied',  pct: latest.owner_rate  },
      { label: 'Renter-occupied', pct: latest.renter_rate },
    ];
    return window.stdPlot({
      width: w, height: 170, marginBottom: 36, style: STYLE,
      x: { label: 'Share of occupied units (%) →', labelOffset: 30, domain: [0, 100],
           tickFormat: d => d + '%' },
      y: { label: null, domain: tenureData.map(d => d.label) },
      marks: [
        Plot.barX(tenureData, { x: 'pct', y: 'label',
          fill: d => d.label.startsWith('Owner') ? ACCENT : RED, rx: 3 }),
        Plot.text(tenureData, { x: 'pct', y: 'label', text: d => d.pct + '%', dx: 6,
          textAnchor: 'start', fill: 'var(--ink-2)', fontSize: 12 }),
        Plot.ruleX([0]),
      ],
    });
  });

  reg('nd-rent-value-chart', HOUS, (rows, w) => {
    const latest = rows[rows.length - 1];
    if (!latest) return null;
    const bars = [
      { label: 'Median Gross Rent', value: latest.median_gross_rent, note: '/mo' },
      { label: 'Median Home Value', value: latest.median_home_value, note: '' },
    ];
    return window.stdPlot({
      width: w, height: 190, marginBottom: 36, style: STYLE,
      x: { label: 'Dollars →', labelOffset: 30, tickFormat: d => '$' + (d / 1000).toFixed(0) + 'k' },
      y: { label: null, domain: bars.map(d => d.label) },
      marks: [
        Plot.barX(bars, { x: 'value', y: 'label', fill: ACCENT, rx: 3 }),
        Plot.text(bars, { x: 'value', y: 'label',
          text: d => '$' + (d.value || 0).toLocaleString() + d.note,
          dx: 6, textAnchor: 'start', fill: 'var(--ink-2)', fontSize: 12 }),
        Plot.ruleX([0]),
      ],
    });
  });

  reg('nd-burden-chart', HOUS, (rows, w) => window.stdPlot({
    width: w, height: 220, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ Cost Burden Rate', labelOffset: 40, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'burden_rate', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.line(rows, { x: 'year', y: 'burden_rate', stroke: RED, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'burden_rate', fill: RED, r: 4,
        tip: true, title: d => `${d.year}\n${d.burden_rate}% cost-burdened` }),
      Plot.ruleY([0]),
    ],
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: EDUCATION
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-attainment-composition-chart', EDUC, (rows, w) => {
    const LEVELS = ['Less than HS', 'HS / Equivalent', 'Some College', "Associate's", "Bachelor's", 'Graduate/Prof.'];
    const LEVEL_COLORS = {
      'Less than HS':    '#440154',
      'HS / Equivalent': '#414487',
      'Some College':    '#2a788e',
      "Associate's":     '#22a884',
      "Bachelor's":      '#7ad151',
      'Graduate/Prof.':  '#fde725',
    };
    const long = [];
    rows.forEach(d => {
      const tot = d.pop_25_plus || 0;
      if (!tot) return;
      long.push({ year: d.year, level: 'Less than HS',    pct: +(d.n_less_than_hs    / tot * 100).toFixed(1) });
      long.push({ year: d.year, level: 'HS / Equivalent', pct: +(d.n_hs_or_equiv     / tot * 100).toFixed(1) });
      long.push({ year: d.year, level: 'Some College',    pct: +(d.n_some_college    / tot * 100).toFixed(1) });
      long.push({ year: d.year, level: "Associate's",     pct: +(d.n_associates      / tot * 100).toFixed(1) });
      long.push({ year: d.year, level: "Bachelor's",      pct: +(d.n_bachelors       / tot * 100).toFixed(1) });
      long.push({ year: d.year, level: 'Graduate/Prof.',  pct: +(d.n_graduate_or_prof/ tot * 100).toFixed(1) });
    });
    if (!long.length) return null;
    return window.stdPlot({
      width: w, height: 300, marginBottom: 70, marginRight: 20, style: STYLE,
      x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
      y: { label: 'Share of Adults 25+ (%)', labelOffset: 48, grid: true, domain: [0, 100], tickFormat: d => d + '%' },
      color: { domain: LEVELS, range: LEVELS.map(l => LEVEL_COLORS[l]), legend: true },
      marks: [
        Plot.barY(long, Plot.stackY({ order: LEVELS, x: 'year', y: 'pct', fill: 'level',
          tip: true, title: d => `${d.level}\n${d.year}: ${d.pct}%` })),
        Plot.ruleY([0]),
      ],
    });
  });

  reg('nd-bachelors-chart', EDUC, (rows, w) => window.stdPlot({
    width: w, height: 300, marginBottom: 48, style: STYLE,
    x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: "% Bachelor's or Higher", labelOffset: 40, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'pct_bachelors_or_higher', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.line(rows, { x: 'year', y: 'pct_bachelors_or_higher', stroke: ACCENT, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'pct_bachelors_or_higher', fill: ACCENT, r: 4,
        tip: true, title: d => `${d.year}\n${d.pct_bachelors_or_higher}% bachelor's+` }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-pop25-chart', EDUC, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: 'Population 25+', labelOffset: 52, grid: true,
         domain: [0, yMax(rows, 'pop_25_plus', 1.15)] },
    marks: [
      Plot.barY(rows, { x: 'year', y: 'pop_25_plus', fill: ACCENT, rx: 3,
        tip: true, title: d => `${d.year}\n${d.pop_25_plus.toLocaleString()} adults 25+` }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-less-hs-chart', EDUC, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '% Less Than High School', labelOffset: 44, grid: true,
         domain: [0, Math.max(5, Math.ceil(Math.max(...rows.map(d => d.pct_less_than_hs || 0)) * 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.line(rows, { x: 'year', y: 'pct_less_than_hs', stroke: RED, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'pct_less_than_hs', fill: RED, r: 4,
        tip: true, title: d => `${d.year}\n${d.pct_less_than_hs}% less than HS` }),
      Plot.ruleY([0]),
    ],
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: TRANSPORTATION
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-commute-mode-chart', TRAN, (rows, w) => {
    const latest = rows[rows.length - 1];
    if (!latest) return null;
    const other = Math.max(0, +(100 - latest.pct_drove_alone - latest.pct_public_transit - latest.pct_worked_from_home).toFixed(1));
    const modeData = [
      { label: 'Drove alone',      pct: latest.pct_drove_alone },
      { label: 'Worked from home', pct: latest.pct_worked_from_home },
      { label: 'Other',            pct: other },
      { label: 'Public transit',   pct: latest.pct_public_transit },
    ];
    return window.stdPlot({
      width: w, height: 200, marginBottom: 36, style: STYLE,
      x: { label: 'Share of workers (%) →', labelOffset: 30, domain: [0, 100],
           tickFormat: d => d + '%' },
      y: { label: null, domain: modeData.map(d => d.label) },
      marks: [
        Plot.barX(modeData, { x: 'pct', y: 'label', fill: ACCENT, rx: 3 }),
        Plot.text(modeData, { x: 'pct', y: 'label', text: d => d.pct + '%', dx: 6,
          textAnchor: 'start', fill: 'var(--ink-2)', fontSize: 12 }),
        Plot.ruleX([0]),
      ],
    });
  });

  reg('nd-commute-trend-chart', TRAN, (rows, w) => {
    const long = [];
    rows.forEach(d => {
      long.push({ year: d.year, series: 'Drove alone',      pct: d.pct_drove_alone });
      long.push({ year: d.year, series: 'Public transit',   pct: d.pct_public_transit });
      long.push({ year: d.year, series: 'Worked from home', pct: d.pct_worked_from_home });
    });
    const SERIES_COLORS = { 'Drove alone': ACCENT, 'Public transit': BLUE2, 'Worked from home': GOLD };
    return window.stdPlot({
      width: w, height: 240, marginBottom: 48, style: STYLE,
      x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
      y: { label: 'Share of workers (%)', labelOffset: 48, grid: true, domain: [0, 100], tickFormat: d => d + '%' },
      color: { domain: Object.keys(SERIES_COLORS), range: Object.values(SERIES_COLORS), legend: true },
      marks: [
        Plot.line(long, { x: 'year', y: 'pct', stroke: 'series', strokeWidth: 2.5 }),
        Plot.dot(long,  { x: 'year', y: 'pct', fill: 'series', r: 3.5,
          tip: true, title: d => `${d.series}\n${d.year}: ${d.pct}%` }),
        Plot.ruleY([0]),
      ],
    });
  });

  reg('nd-remote-work-chart', TRAN, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: 'Working From Home (%)', labelOffset: 48, grid: true,
         domain: [0, Math.ceil(Math.max(...rows.map(d => d.pct_worked_from_home || 0)) * 1.2 / 5) * 5 || 20] },
    marks: [
      Plot.line(rows, { x: 'year', y: 'pct_worked_from_home', stroke: GOLD, strokeWidth: 2.5 }),
      Plot.dot(rows,  { x: 'year', y: 'pct_worked_from_home', fill: GOLD, r: 4,
        tip: true, title: d => `${d.year}\n${d.pct_worked_from_home}% worked from home` }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-total-workers-chart', TRAN, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: 'Total Workers', labelOffset: 48, grid: true,
         domain: [0, yMax(rows, 'total_workers', 1.15)] },
    marks: [
      Plot.barY(rows, { x: 'year', y: 'total_workers', fill: ACCENT, rx: 3,
        tip: true, title: d => `${d.year}\n${d.total_workers.toLocaleString()} workers` }),
      Plot.ruleY([0]),
    ],
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: CHILDCARE
  // ════════════════════════════════════════════════════════════════════════════

  reg('nd-under6-chart', CHLD, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ % Under-6 Needing Care', labelOffset: 40, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'pct_under6_needs_childcare', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.barY(rows, { x: 'year', y: 'pct_under6_needs_childcare', fill: ACCENT, rx: 3 }),
      Plot.text(rows, { x: 'year', y: 'pct_under6_needs_childcare',
        text: d => (d.pct_under6_needs_childcare || 0) + '%', dy: -6, textAnchor: 'middle',
        fill: 'var(--ink-2)', fontSize: 12 }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-afterschool-chart', CHLD, (rows, w) => window.stdPlot({
    width: w, height: 240, marginBottom: 48, style: STYLE,
    x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
    y: { label: '↑ % Ages 6–17 Needing Care', labelOffset: 40, grid: true,
         domain: [0, Math.min(100, yMax(rows, 'pct_6_17_needs_afterschool', 1.3))],
         tickFormat: d => d + '%' },
    marks: [
      Plot.barY(rows, { x: 'year', y: 'pct_6_17_needs_afterschool', fill: BLUE2, rx: 3 }),
      Plot.text(rows, { x: 'year', y: 'pct_6_17_needs_afterschool',
        text: d => (d.pct_6_17_needs_afterschool || 0) + '%', dy: -6, textAnchor: 'middle',
        fill: 'var(--ink-2)', fontSize: 12 }),
      Plot.ruleY([0]),
    ],
  }));

  reg('nd-grandparent-chart', CHLD, (rows, w) => {
    const mx = Math.max(...rows.map(d => d.grandparent_caregivers || 0));
    return window.stdPlot({
      width: w, height: 200, marginBottom: 48, style: STYLE,
      x: { label: 'Year →', labelOffset: 42, ticks: rows.map(d => d.year), tickFormat: String },
      y: { label: '↑ Households', labelOffset: 48, grid: true,
           domain: [0, Math.ceil((mx * 1.2) / 5) * 5 || 10] },
      marks: [
        Plot.barY(rows, { x: 'year', y: 'grandparent_caregivers', fill: BLUE2, rx: 3 }),
        Plot.ruleY([0]),
      ],
    });
  });

  // ── Neighborhood switching ────────────────────────────────────────────────
  function setNbhdDataByKey(key) {
    currentKey = key;
    const meta = NBHD_META[key] || { name: key, subtitle: '' };

    const title    = document.getElementById('nbhd-data-title');
    const subtitle = document.getElementById('nbhd-data-subtitle');
    const crumb    = document.getElementById('nbhd-data-crumb');
    if (title)    title.textContent    = meta.name;
    if (subtitle) subtitle.textContent = meta.subtitle;
    if (crumb)    crumb.textContent    = meta.name;

    const dataPanel = document.getElementById('nbhd-panel-data');
    const ecPanel   = document.getElementById('nbhd-panel-eastcatawba');
    if (key === 'eastcatawba') {
      if (dataPanel) dataPanel.classList.remove('active');
      if (ecPanel)   ecPanel.classList.add('active');
    } else {
      if (dataPanel) dataPanel.classList.add('active');
      if (ecPanel)   ecPanel.classList.remove('active');
      redrawAll();
    }

    document.querySelectorAll('.nbhd-sel-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nbhd === key);
    });
  }

  function setNbhdData(btn) {
    setNbhdDataByKey(btn.dataset.nbhd);
  }

  window.setNbhdData      = setNbhdData;
  window.setNbhdDataByKey = setNbhdDataByKey;

  // ── Initialize from URL param ─────────────────────────────────────────────
  const initKey = new URLSearchParams(window.location.search).get('nbhd') || 'pottstown';
  if (initKey !== 'pottstown') setNbhdDataByKey(initKey);
})();
