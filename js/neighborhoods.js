// Neighborhoods / nbhd-data page scripts

// Block 1 (module)
(async function() {
      import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
      const STYLE = { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" };
      const ACCENT = "#3f4e75";

      let rows = [];
      try {
        const conn = await window.__mdConn;
        const r = await conn.evaluateQuery(`
          SELECT
            year,
            SUM(total_population)          AS total_population,
            SUM(race_white_alone)          AS race_white,
            SUM(race_black_alone)          AS race_black,
            SUM(race_asian_alone)          AS race_asian,
            SUM(ethnicity_hispanic_or_latino) AS hispanic_latino,
            ROUND(SUM(ethnicity_hispanic_or_latino) * 100.0 / NULLIF(SUM(total_population),0), 1) AS hispanic_rate
          FROM nmidw.agg_neighborhood_demographics
          WHERE neighborhood_name = 'Pottstown'
          GROUP BY year
          ORDER BY year
        `);
        rows = r.data.toRows().map(d => ({
          year: Number(d.year),
          total_population: Number(d.total_population),
          race_white: Number(d.race_white),
          race_black: Number(d.race_black),
          race_asian: Number(d.race_asian),
          hispanic_latino: Number(d.hispanic_latino),
          hispanic_rate: Number(d.hispanic_rate)
        }));
      } catch(e) {
        console.error('Pottstown demographics query failed:', e);
        ['pott-pop-chart','pott-race-chart','pott-hl-chart'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = '<p style="color:#e05c4b;padding:12px;font-family:\'Hanken Grotesk\',sans-serif">Data unavailable</p>';
        });
      }

      if (rows.length) {
        // ── Chart 1: Total Population trend ──────────────────────────────────
        const popEl = document.getElementById('pott-pop-chart');
        function renderPop() {
          const w = popEl.offsetWidth || 480;
          const maxPop = Math.max(...rows.map(d => d.total_population));
          popEl.replaceChildren(Plot.plot({
            width: w, height: 260, marginLeft: 60, marginRight: 20, marginBottom: 48, style: STYLE,
            x: { label: "Year →", labelOffset: 42, ticks: rows.map(d=>d.year), tickFormat: d => String(d) },
            y: { label: "↑ Population", labelOffset: 48, grid: true, domain: [0, Math.ceil((maxPop * 1.15) / 50) * 50] },
            marks: [
              Plot.line(rows, { x: "year", y: "total_population", stroke: ACCENT, strokeWidth: 2.5 }),
              Plot.dot(rows,  { x: "year", y: "total_population", fill: ACCENT, r: 4,
                tip: true, title: d => `${d.year}\n${Math.round(d.total_population).toLocaleString()} residents` }),
              Plot.ruleY([0])
            ]
          }));
        }
        const roP = new ResizeObserver(e => { const w = e[0].contentRect.width; if(w>0) renderPop(); });
        roP.observe(popEl);
        if (popEl.offsetWidth > 0) renderPop();

        // ── Chart 2: Racial composition horizontal bar (most recent year) ────
        const raceEl = document.getElementById('pott-race-chart');
        function renderRace() {
          const w = raceEl.offsetWidth || 480;
          const latest = rows[rows.length - 1];
          const total = latest.total_population || 1;
          const other = Math.max(0, total - latest.race_white - latest.race_black - latest.race_asian);
          const raceData = [
            { group: "White alone",          count: latest.race_white,    pct: +(latest.race_white / total * 100).toFixed(1) },
            { group: "Black or Afr. Am.",    count: latest.race_black,    pct: +(latest.race_black / total * 100).toFixed(1) },
            { group: "Hispanic or Latino",   count: latest.hispanic_latino, pct: +(latest.hispanic_latino / total * 100).toFixed(1) },
            { group: "Asian alone",          count: latest.race_asian,    pct: +(latest.race_asian / total * 100).toFixed(1) },
            { group: "Other / multiracial",  count: other,                pct: +(other / total * 100).toFixed(1) }
          ];
          const RACE_COLORS = {
            "White alone": "#6b7fa3", "Black or Afr. Am.": ACCENT,
            "Hispanic or Latino": "#e05c4b", "Asian alone": "#f0a500", "Other / multiracial": "#b0b8c8"
          };
          raceEl.replaceChildren(Plot.plot({
            width: w, height: 240, marginLeft: 150, marginRight: 60, marginBottom: 36, style: STYLE,
            x: { label: "Share of population (%) →", labelOffset: 30, domain: [0, 100], tickFormat: d => d + "%" },
            y: { label: null, domain: raceData.map(d => d.group) },
            marks: [
              Plot.barX(raceData, { x: "pct", y: "group", fill: d => RACE_COLORS[d.group], rx: 3 }),
              Plot.text(raceData, { x: "pct", y: "group", text: d => d.pct + "%", dx: 6, textAnchor: "start",
                fill: "var(--ink-2)", fontSize: 12 }),
              Plot.ruleX([0])
            ]
          }));
        }
        const roR = new ResizeObserver(e => { const w = e[0].contentRect.width; if(w>0) renderRace(); });
        roR.observe(raceEl);
        if (raceEl.offsetWidth > 0) renderRace();

        // ── Chart 3: Hispanic / Latino rate trend ────────────────────────────
        const hlEl = document.getElementById('pott-hl-chart');
        function renderHL() {
          const w = hlEl.offsetWidth || 480;
          const maxRate = Math.max(...rows.map(d => d.hispanic_rate || 0));
          hlEl.replaceChildren(Plot.plot({
            width: w, height: 240, marginLeft: 52, marginRight: 20, marginBottom: 48, style: STYLE,
            x: { label: "Year →", labelOffset: 42, ticks: rows.map(d=>d.year), tickFormat: d => String(d) },
            y: { label: "↑ % Hispanic or Latino", labelOffset: 40, grid: true,
                 domain: [0, Math.min(100, Math.ceil((maxRate * 1.3) / 5) * 5 || 10)],
                 tickFormat: d => d + "%" },
            marks: [
              Plot.barY(rows, { x: "year", y: "hispanic_rate", fill: "#e05c4b", rx: 3 }),
              Plot.text(rows, { x: "year", y: "hispanic_rate", text: d => (d.hispanic_rate||0) + "%",
                dy: -6, textAnchor: "middle", fill: "var(--ink-2)", fontSize: 12 }),
              Plot.ruleY([0])
            ]
          }));
        }
        const roHL = new ResizeObserver(e => { const w = e[0].contentRect.width; if(w>0) renderHL(); });
        roHL.observe(hlEl);
        if (hlEl.offsetWidth > 0) renderHL();

        // Expose render functions so goto() can trigger them when page becomes visible
        window.__pottDemoRender = function() {
          renderPop(); renderRace(); renderHL();
        };
      }
})();
