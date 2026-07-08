// Housing page scripts
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Block 1 (module)
(async function() {

        const TOWN_C = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        const TOWNS = ["Cornelius", "Davidson", "Huntersville"];
        const FONT = { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "12px" };

        /* ── Shared data ────────────────────────────────────── */
        const rentData = [
          {town:"Cornelius",    year:2018, rent:1241}, {town:"Cornelius",    year:2019, rent:1268},
          {town:"Cornelius",    year:2020, rent:1290}, {town:"Cornelius",    year:2021, rent:1390},
          {town:"Cornelius",    year:2022, rent:1590}, {town:"Cornelius",    year:2023, rent:1650},
          {town:"Cornelius",    year:2024, rent:1720},
          {town:"Davidson",     year:2018, rent:1295}, {town:"Davidson",     year:2019, rent:1312},
          {town:"Davidson",     year:2020, rent:1330}, {town:"Davidson",     year:2021, rent:1435},
          {town:"Davidson",     year:2022, rent:1600}, {town:"Davidson",     year:2023, rent:1615},
          {town:"Davidson",     year:2024, rent:1640},
          {town:"Huntersville", year:2018, rent:1196}, {town:"Huntersville", year:2019, rent:1230},
          {town:"Huntersville", year:2020, rent:1270}, {town:"Huntersville", year:2021, rent:1430},
          {town:"Huntersville", year:2022, rent:1620}, {town:"Huntersville", year:2023, rent:1760},
          {town:"Huntersville", year:2024, rent:1820},
        ];

        const ptrData = [
          {town:"Cornelius",    bracket:"$10k–$19,999", ratio:37.6}, {town:"Cornelius",    bracket:"$20k–$34,999", ratio:20.5},
          {town:"Cornelius",    bracket:"$35k–$49,999", ratio:13.3}, {town:"Cornelius",    bracket:"$50k–$74,999", ratio:9.0},
          {town:"Cornelius",    bracket:"$75k–$99,999", ratio:6.5},  {town:"Cornelius",    bracket:"$100k–$149,999", ratio:4.5},
          {town:"Davidson",     bracket:"$10k–$19,999", ratio:46.2}, {town:"Davidson",     bracket:"$20k–$34,999", ratio:25.2},
          {town:"Davidson",     bracket:"$35k–$49,999", ratio:16.3}, {town:"Davidson",     bracket:"$50k–$74,999", ratio:11.1},
          {town:"Davidson",     bracket:"$75k–$99,999", ratio:7.9},  {town:"Davidson",     bracket:"$100k–$149,999", ratio:5.5},
          {town:"Huntersville", bracket:"$10k–$19,999", ratio:36.8}, {town:"Huntersville", bracket:"$20k–$34,999", ratio:20.1},
          {town:"Huntersville", bracket:"$35k–$49,999", ratio:13.0}, {town:"Huntersville", bracket:"$50k–$74,999", ratio:8.8},
          {town:"Huntersville", bracket:"$75k–$99,999", ratio:6.3},  {town:"Huntersville", bracket:"$100k–$149,999", ratio:4.4},
        ];
        const BRACKETS = ["$10k–$19,999","$20k–$34,999","$35k–$49,999","$50k–$74,999","$75k–$99,999","$100k–$149,999"];

        const homeData = [
          {town:"Cornelius",    value:564571},
          {town:"Davidson",     value:692969},
          {town:"Huntersville", value:552195},
          {town:"U.S. Median",  value:179400},
        ];

        const dpData = [
          {town:"Cornelius",    years:9.99},
          {town:"Huntersville", years:9.52},
          {town:"Davidson",     years:8.88},
        ];

        function w(id) {
          const el = document.getElementById(id);
          el.innerHTML = "";
          const ow = el?.offsetWidth;
          if (ow > 50) return ow;
          // fallback: estimate right column of .stat-row grid (~58% of wrap)
          const ww = el?.closest(".wrap")?.offsetWidth;
          if (ww > 100) return Math.floor(ww * 0.58);
          return 600;
        }

        function renderOvCharts() {

        /* ── Chart 1: Rent over time ───────────────────────── */
        const c1 = Plot.plot({
          width: w("ovf-rent"), height: 280,
          marginLeft: 72, marginRight: 16, marginTop: 16, marginBottom: 52,
          style: FONT,
          x: { label: "Year →", labelOffset: 42, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
          y: { label: "↑ $/mo", labelOffset: 52, grid: true, tickFormat: d => "$" + d.toLocaleString() },
          color: { domain: TOWNS, range: Object.values(TOWN_C), legend: true },
          marks: [
            Plot.line(rentData, { x: "year", y: "rent", stroke: "town", strokeWidth: 2 }),
            Plot.dot(rentData,  { x: "year", y: "rent", fill: "town", r: 3,
              tip: true, title: d => `${d.town} · ${d.year}\n$${d.rent.toLocaleString()}/mo` }),
          ]
        });
        document.getElementById("ovf-rent").replaceChildren(c1);

        /* ── Chart 2: PTR by bracket (grouped bars) ────────── */
        const c2 = Plot.plot({
          width: w("ovf-ptr"), height: 300,
          marginLeft: 55, marginRight: 16, marginTop: 16, marginBottom: 80,
          style: FONT,
          fx: { domain: BRACKETS, axis: "bottom", label: "Income bracket →", tickRotate: -30, padding: 0.12 },
          x: { axis: null },
          y: { label: "↑ Years", labelOffset: 44, grid: true },
          color: { domain: TOWNS, range: Object.values(TOWN_C), legend: true },
          marks: [
            Plot.barY(ptrData, { x: "town", y: "ratio", fx: "bracket", fill: "town",
              tip: true, title: d => `${d.town} · ${d.bracket}\n${d.ratio} years` }),
            Plot.ruleY([0]),
          ]
        });
        document.getElementById("ovf-ptr").replaceChildren(c2);

        /* ── Chart 3: Home values (horizontal bar + US ref) ── */
        const homeDisplay = [...homeData].reverse();
        const c3 = Plot.plot({
          width: w("ovf-home"), height: 240,
          marginLeft: 115, marginRight: 65, marginTop: 16, marginBottom: 52,
          style: FONT,
          x: { label: "Median home value →", labelOffset: 42, grid: true,
               tickFormat: d => "$" + (d/1000).toFixed(0) + "k" },
          y: { label: null },
          color: { domain: [...TOWNS, "U.S. Median"], range: [...Object.values(TOWN_C), "#ccc"] },
          marks: [
            Plot.barX(homeDisplay, { y: "town", x: "value", fill: "town",
              tip: true, title: d => `${d.town}\n$${d.value.toLocaleString()}` }),
            Plot.ruleX([179400], { stroke: "#888", strokeDasharray: "5,3", strokeWidth: 1.5 }),
            Plot.text([{town:"U.S. Median", value:179400}], {
              y: "town", x: "value", text: () => "U.S. median",
              dx: 6, textAnchor: "start", fontSize: 11, fill: "#888"
            }),
            Plot.text(homeDisplay.filter(d => d.town !== "U.S. Median"), {
              y: "town", x: "value",
              text: d => "$" + (d.value/1000).toFixed(0) + "k",
              dx: 5, textAnchor: "start", fontSize: 11, fill: "#555"
            }),
          ]
        });
        document.getElementById("ovf-home").replaceChildren(c3);

        /* ── Chart 4: Down payment savings ─────────────────── */
        const c4 = Plot.plot({
          width: w("ovf-dp"), height: 210,
          marginLeft: 115, marginRight: 65, marginTop: 16, marginBottom: 52,
          style: FONT,
          x: { label: "Years to save 20% down payment →", labelOffset: 42, grid: true, domain: [0, 12] },
          y: { label: null },
          color: { domain: TOWNS, range: Object.values(TOWN_C) },
          marks: [
            Plot.barX(dpData, { y: "town", x: "years", fill: "town",
              tip: true, title: d => `${d.town}\n${d.years.toFixed(1)} years` }),
            Plot.text(dpData, {
              y: "town", x: "years",
              text: d => d.years.toFixed(1) + " yrs",
              dx: 5, textAnchor: "start", fontSize: 11, fill: "#555"
            }),
          ]
        });
        document.getElementById("ovf-dp").replaceChildren(c4);

        } // end renderOvCharts

        window.__renderOvCharts = renderOvCharts;
        // Wait for grid layout to resolve before measuring widths
        requestAnimationFrame(() => requestAnimationFrame(renderOvCharts));
})();

// Block 2 (module)
(async function() {

        // Show loading state
        document.getElementById("rent-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        document.getElementById("income-rent-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';

        let housing;
        try {
          housing = await window.loadData('housing-rent-income');
        } catch (err) {
          console.error("Failed to load housing-rent-income:", err);
          housing = [];
          window.mdShowError('rent-chart');
          window.mdShowError('income-rent-chart');
        }

        // Clear loading states
        document.getElementById("rent-chart").innerHTML = "";
        document.getElementById("income-rent-chart").innerHTML = "";

        function renderRentChart(town) {
          const data = town === "All" ? housing : housing.filter(d => d.town === town);
          if (!data.length) return;
          const w = document.getElementById("rent-chart").offsetWidth || 680;
          const chart = Plot.plot({
            width: w, height: 360, marginLeft: 70, marginBottom: 55,
            style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
            x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
            y: { label: "↑ Median rent ($/mo)", labelOffset: 52, grid: true, tickFormat: d => "$" + d.toLocaleString(), domain: [0, Math.ceil(Math.max(...data.map(d => d.median_rent)) / 200) * 200 + 200] },
            color: { domain: ["Cornelius","Davidson","Huntersville"], range: ["#3f4e75","#f0a500","#e05c4b"], legend: town === "All" },
            marks: [
              Plot.line(data, { x: "year", y: "median_rent", stroke: "town", strokeWidth: 2.5 }),
              Plot.dot(data,  { x: "year", y: "median_rent", fill: "town", r: 4,
                tip: true, title: d => `${d.town}\n${d.year}\n$${d.median_rent.toLocaleString()}/mo` }),
              Plot.ruleY([0])
            ]
          });
          document.getElementById("rent-chart").replaceChildren(chart);
        }

        function renderIncomeRentChart(town) {
          const filt = town === "All" ? housing : housing.filter(d => d.town === town);
          if (!filt.length) return;
          const base = {};
          for (const d of filt) {
            if (d.year === 2018) base[d.town] = { income: d.median_income, rent: d.median_rent };
          }
          const indexed = filt.flatMap(d => base[d.town] ? [
            { town: d.town, year: d.year, metric: "Median Income", value: (d.median_income / base[d.town].income) * 100 },
            { town: d.town, year: d.year, metric: "Median Rent",   value: (d.median_rent   / base[d.town].rent)   * 100 },
          ] : []);
          const w = document.getElementById("income-rent-chart").offsetWidth || 680;
          const isAll = town === "All";
          const chart = Plot.plot({
            width: w, height: isAll ? 840 : 300,
            marginLeft: isAll ? 145 : 75, marginRight: 20, marginBottom: 55,
            style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
            x: { label: "Year →", labelOffset: 55, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
            y: { label: "↑ Index (2018 = 100)", labelOffset: 65, grid: true },
            ...(isAll ? { fy: { axis: "left", label: null, tickSize: 0, tickPadding: 35 } } : {}),
            color: { domain: ["Median Income","Median Rent"], range: ["#3f4e75","#e05c4b"], legend: true },
            ...(isAll ? { facet: { data: indexed, y: "town", label: null } } : {}),
            marks: [
              Plot.line(indexed, { x: "year", y: "value", stroke: "metric", strokeWidth: 2.5 }),
              Plot.dot(indexed,  { x: "year", y: "value", fill: "metric", r: 3,
                tip: true, title: d => `${d.town} · ${d.metric}\n${d.year}\nIndex: ${d.value.toFixed(1)}` }),
              Plot.ruleY([100], { stroke: "#aaa", strokeDasharray: "4,3" }),
            ]
          });
          if (isAll) chart.querySelectorAll('[aria-label*="fy-axis"] text, [aria-label*="fy axis"] text').forEach(el => {
            el.style.fontWeight = "700"; el.style.fontSize = "13px";
          });
          document.getElementById("income-rent-chart").replaceChildren(chart);
        }

        let activeRentTown = (window.__masterTown && window.__masterTown !== "All") ? window.__masterTown : "All";
        renderRentChart(activeRentTown);
        renderIncomeRentChart(activeRentTown);

        document.querySelectorAll("[data-rent-town]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-rent-town]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activeRentTown = btn.dataset.rentTown;
            renderRentChart(activeRentTown);
            renderIncomeRentChart(activeRentTown);
          });
        });

        document.addEventListener('masterTownChange', ({ detail: { town } }) => {
          activeRentTown = town;
          document.querySelectorAll("[data-rent-town]").forEach(b =>
            b.classList.toggle("on", b.dataset.rentTown === town));
          renderRentChart(town);
          renderIncomeRentChart(town);
        });
})();

// Block 3 (module)
(async function() {

        let hvRows;
        try {
          hvRows = await window.loadData('housing-value-income');
        } catch(e) {
          console.error("Failed to load housing-value-income:", e);
          hvRows = [];
          window.mdShowError('home-value-chart');
        }

        if (hvRows.length) {
          function renderHomeValueChart(town) {
            const filt = town === "All" ? hvRows : hvRows.filter(d => d.town === town);
            if (!filt.length) return;
            const base = {};
            for (const d of filt) {
              if (d.year === 2018) base[d.town] = { income: d.median_income, home: d.median_home_value };
            }
            const indexed = filt.flatMap(d => base[d.town] ? [
              { town: d.town, year: d.year, metric: "Home Value",    value: (d.median_home_value / base[d.town].home)   * 100 },
              { town: d.town, year: d.year, metric: "Median Income", value: (d.median_income      / base[d.town].income) * 100 },
            ] : []);
            const w = document.getElementById("home-value-chart").offsetWidth || 680;
            const isAll = town === "All";
            const chart = Plot.plot({
              width: w, height: isAll ? 840 : 300,
              marginLeft: isAll ? 185 : 80, marginRight: 20, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 55, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Index (2018 = 100)", labelOffset: 68, grid: true, domain: [95, 212] },
              ...(isAll ? { fy: { axis: "left", label: null, tickSize: 0, tickPadding: 60 } } : {}),
              color: { domain: ["Home Value","Median Income"], range: ["#e05c4b","#3f4e75"], legend: true },
              ...(isAll ? { facet: { data: indexed, y: "town", label: null } } : {}),
              marks: [
                Plot.line(indexed,  { x: "year", y: "value", stroke: "metric", strokeWidth: 2.5 }),
                Plot.dot(indexed,   { x: "year", y: "value", fill: "metric", r: 4,
                  tip: true, title: d => `${d.town} · ${d.metric}\n${d.year}\nIndex: ${d.value.toFixed(1)}` }),
                Plot.ruleY([100], { stroke: "#bbb", strokeDasharray: "4,3" }),
              ]
            });
            if (isAll) chart.querySelectorAll('[aria-label*="fy-axis"] text, [aria-label*="fy axis"] text').forEach(el => {
              el.style.fontWeight = "700"; el.style.fontSize = "13px";
            });
            document.getElementById("home-value-chart").replaceChildren(chart);
          }

          let activeHvTown = (window.__masterTown && window.__masterTown !== "All") ? window.__masterTown : "All";
          renderHomeValueChart(activeHvTown);

          document.querySelectorAll("[data-hv-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-hv-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeHvTown = btn.dataset.hvTown;
              renderHomeValueChart(activeHvTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeHvTown = town;
            document.querySelectorAll("[data-hv-town]").forEach(b =>
              b.classList.toggle("on", b.dataset.hvTown === town));
            renderHomeValueChart(town);
          });
        }
})();

// Block 4 (module)
(async function() {

        /* ── HOUSING WAGE CHART ── */
        window.__housingWage = [
          {occupation:"Housing Wage Needed",hourly_wage:35.08,category:"Benchmark"},
          {occupation:"Fast Food/Counter Workers",hourly_wage:13.88,category:"Occupation"},
          {occupation:"Cashiers",hourly_wage:13.77,category:"Occupation"},
          {occupation:"Retail Salespersons",hourly_wage:16.49,category:"Occupation"},
          {occupation:"Laborers & Freight/Stock Movers",hourly_wage:17.49,category:"Occupation"},
          {occupation:"Stockers and Order Fillers",hourly_wage:17.46,category:"Occupation"},
          {occupation:"Customer Service Representatives",hourly_wage:20.70,category:"Occupation"},
          {occupation:"Heavy & Tractor-Trailer Truck Drivers",hourly_wage:26.54,category:"Occupation"},
          {occupation:"Registered Nurses",hourly_wage:40.42,category:"Occupation"}
        ];
        (function(){
          const data = window.__housingWage;
          const benchmark = 35.08;
          const occs = data.filter(d => d.category === "Occupation")
                           .sort((a,b) => b.hourly_wage - a.hourly_wage);
          const domain = occs.map(d => d.occupation);
          const el = document.getElementById("chart-housing-wage");
          if (!el) return;
          function renderWage(width) {
            el.innerHTML = "";
            el.appendChild(Plot.plot({
              width,
              marginLeft: 220,
              marginRight: 110,
              marginBottom: 30,
              x: { label: "Hourly Wage ($)", grid: true, tickFormat: d => "$"+d },
              y: { domain, label: null },
              marks: [
                Plot.barX(occs, { x: "hourly_wage", y: "occupation", fill: "#e07b39", rx: 3 }),
                Plot.ruleX([benchmark], { stroke: "#1d3557", strokeWidth: 2, strokeDasharray: "5,3" }),
                Plot.text([{x: benchmark, label: "Housing wage\n$35.08/hr"}], {
                  x: "x", y: () => domain[0], text: "label",
                  textAnchor: "start", dx: 6, dy: -18, fontSize: 11, fill: "#1d3557", fontWeight: 600
                }),
                Plot.text(occs, {
                  x: "hourly_wage", y: "occupation",
                  text: d => "$"+d.hourly_wage.toFixed(2),
                  textAnchor: "start", dx: 5, fontSize: 11, fill: "#333"
                })
              ]
            }));
          }
          const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            if (w > 0) renderWage(w);
          });
          ro.observe(el);
        })();

        /* ── FMR BY BEDROOM CHART ── */
        window.__fmrBedroom = [
          {region:"Charlotte",bedrooms:"Studio",fmr:1586},
          {region:"Charlotte",bedrooms:"1-Bedroom",fmr:1647},
          {region:"Charlotte",bedrooms:"2-Bedroom",fmr:1824},
          {region:"Charlotte",bedrooms:"3-Bedroom",fmr:2250},
          {region:"Charlotte",bedrooms:"4-Bedroom",fmr:2852},
          {region:"Raleigh",bedrooms:"Studio",fmr:1533},
          {region:"Raleigh",bedrooms:"1-Bedroom",fmr:1592},
          {region:"Raleigh",bedrooms:"2-Bedroom",fmr:1763},
          {region:"Raleigh",bedrooms:"3-Bedroom",fmr:2192},
          {region:"Raleigh",bedrooms:"4-Bedroom",fmr:2961},
          {region:"Atlanta",bedrooms:"Studio",fmr:1591},
          {region:"Atlanta",bedrooms:"1-Bedroom",fmr:1653},
          {region:"Atlanta",bedrooms:"2-Bedroom",fmr:1830},
          {region:"Atlanta",bedrooms:"3-Bedroom",fmr:2205},
          {region:"Atlanta",bedrooms:"4-Bedroom",fmr:2653}
        ];
        (function(){
          const data = window.__fmrBedroom;
          const el = document.getElementById("chart-fmr-bedroom");
          if (!el) return;
          const bedroomOrder = ["Studio","1-Bedroom","2-Bedroom","3-Bedroom","4-Bedroom"];
          const regionOrder = ["Charlotte","Raleigh","Atlanta"];
          function renderFmr(width) {
            el.innerHTML = "";
            el.appendChild(Plot.plot({
            width,
            marginLeft: 50,
            marginBottom: 60,
            fx: { domain: bedroomOrder, label: null, tickSize: 0, padding: 0.12 },
            x: { domain: regionOrder, label: null, tickSize: 0, tickFormat: d => d },
            y: { label: "Monthly Rent ($)", grid: true, tickFormat: d => "$"+d.toLocaleString(), domain: [0, 3200] },
            color: { domain: regionOrder, range: ["#2a6041","#e07b39","#3f6ba3"], legend: true },
            marks: [
              Plot.barY(data, {
                fx: "bedrooms",
                x: "region",
                y: "fmr",
                fill: "region",
                tip: true
              }),
              Plot.ruleY([0])
            ]
          }));
          }
          const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            if (w > 0) renderFmr(w);
          });
          ro.observe(el);
        })();
})();

// Block 5 (module)
(async function() {
        window.__amiGap = [
          {bedrooms:"Studio",ami_level:"30% AMI",max_affordable_rent:590,fmr:1586},
          {bedrooms:"Studio",ami_level:"50% AMI",max_affordable_rent:982,fmr:1586},
          {bedrooms:"Studio",ami_level:"80% AMI",max_affordable_rent:1571,fmr:1586},
          {bedrooms:"Studio",ami_level:"100% AMI",max_affordable_rent:1965,fmr:1586},
          {bedrooms:"1-Bedroom",ami_level:"30% AMI",max_affordable_rent:674,fmr:1647},
          {bedrooms:"1-Bedroom",ami_level:"50% AMI",max_affordable_rent:1122,fmr:1647},
          {bedrooms:"1-Bedroom",ami_level:"80% AMI",max_affordable_rent:1795,fmr:1647},
          {bedrooms:"1-Bedroom",ami_level:"100% AMI",max_affordable_rent:2245,fmr:1647},
          {bedrooms:"2-Bedroom",ami_level:"30% AMI",max_affordable_rent:758,fmr:1824},
          {bedrooms:"2-Bedroom",ami_level:"50% AMI",max_affordable_rent:1262,fmr:1824},
          {bedrooms:"2-Bedroom",ami_level:"80% AMI",max_affordable_rent:2020,fmr:1824},
          {bedrooms:"2-Bedroom",ami_level:"100% AMI",max_affordable_rent:2525,fmr:1824},
          {bedrooms:"3-Bedroom",ami_level:"30% AMI",max_affordable_rent:841,fmr:2250},
          {bedrooms:"3-Bedroom",ami_level:"50% AMI",max_affordable_rent:1402,fmr:2250},
          {bedrooms:"3-Bedroom",ami_level:"80% AMI",max_affordable_rent:2244,fmr:2250},
          {bedrooms:"3-Bedroom",ami_level:"100% AMI",max_affordable_rent:2805,fmr:2250},
          {bedrooms:"4-Bedroom",ami_level:"30% AMI",max_affordable_rent:909,fmr:2852},
          {bedrooms:"4-Bedroom",ami_level:"50% AMI",max_affordable_rent:1515,fmr:2852},
          {bedrooms:"4-Bedroom",ami_level:"80% AMI",max_affordable_rent:2424,fmr:2852},
          {bedrooms:"4-Bedroom",ami_level:"100% AMI",max_affordable_rent:3030,fmr:2852}
        ];
        (function(){
          const data = window.__amiGap;
          const el = document.getElementById("chart-ami-gap");
          if (!el) return;
          const amiOrder = ["30% AMI","50% AMI","80% AMI","100% AMI"];
          const bedroomOrder = ["Studio","1-BR","2-BR","3-BR","4-BR"];
          const bedroomMap = {"Studio":"Studio","1-Bedroom":"1-BR","2-Bedroom":"2-BR","3-Bedroom":"3-BR","4-Bedroom":"4-BR"};
          /* Compound x key to prevent stacking: "30% AMI|max", "30% AMI|fmr" */
          const xDomain = amiOrder.flatMap(a => [a+"|max", a+"|fmr"]);
          const paired = [];
          data.forEach(d => {
            const br = bedroomMap[d.bedrooms] || d.bedrooms;
            paired.push({bedrooms:br, ami_level:d.ami_level, xk:d.ami_level+"|max", type:"Max Affordable Rent", value:d.max_affordable_rent});
            paired.push({bedrooms:br, ami_level:d.ami_level, xk:d.ami_level+"|fmr", type:"Fair Market Rent", value:d.fmr});
          });
          function renderAmi(width) {
            el.innerHTML = "";
            el.appendChild(Plot.plot({
              width,
              height: 400,
              marginLeft: 60,
              marginBottom: 55,
              marginTop: 30,
              fx: { domain: bedroomOrder, label: null, tickSize: 0, padding: 0.15 },
              x: { domain: xDomain, label: null, tickSize: 0,
                   tickFormat: d => d.endsWith("|max") ? d.replace("|max","").replace(" AMI","") : "" },
              y: { label: "Monthly Rent ($)", grid: true, tickFormat: d => "$"+d.toLocaleString(), domain: [0, 3400] },
              color: { domain: ["Max Affordable Rent","Fair Market Rent"], range: ["#2a8c6a","#e07b39"], legend: true },
              marks: [
                Plot.barY(paired, { x: "xk", y: "value", fx: "bedrooms", fill: "type",
                  tip: true, title: d => `${d.bedrooms} · ${d.ami_level}\n${d.type}: $${d.value.toLocaleString()}` }),
                Plot.ruleY([0])
              ]
            }));
          }
          const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            if (w > 0) renderAmi(w);
          });
          ro.observe(el);
        })();
})();

// Block 6 (module)
(async function() {
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        document.getElementById("rti-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        document.getElementById("hpti-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        let afRows;
        try {
          afRows = await window.loadData('housing-affordability-index');
        } catch(e) {
          console.error("Failed to load housing-affordability-index:", e);
          ["rti-chart","hpti-chart"].forEach(id => window.mdShowError(id));
        }
        if (afRows && afRows.length) {
          function renderAffordabilityIndex(town) {
            const data = town === "All" ? afRows : afRows.filter(d => d.town === town);
            if (!data.length) return;
            const showLegend = town === "All";
            const rtiIsDecimal = afRows.some(d => d.rti < 2);

            const rtiVals = data.map(d => d.rti).filter(v => v != null);
            const rtiLo = Math.min(...rtiVals), rtiHi = Math.max(...rtiVals);
            const rtiStep = rtiIsDecimal ? 0.05 : 5;
            const rtiDomain = [Math.max(0, Math.floor((rtiLo - rtiStep) / rtiStep) * rtiStep), Math.ceil((rtiHi + rtiStep * 0.5) / rtiStep) * rtiStep];

            const hptiVals = data.map(d => d.hpti).filter(v => v != null);
            const hptiLo = Math.min(...hptiVals), hptiHi = Math.max(...hptiVals);
            const hptiStep = 0.5;
            const hptiDomain = [Math.max(0, Math.floor((hptiLo - hptiStep) / hptiStep) * hptiStep), Math.ceil((hptiHi + hptiStep * 0.5) / hptiStep) * hptiStep];

            const w1 = document.getElementById("rti-chart").offsetWidth || 540;
            document.getElementById("rti-chart").replaceChildren(Plot.plot({
              width: w1, height: 280, marginLeft: 80, marginRight: 20, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Rent-to-income ratio", labelOffset: 68, grid: true, tickFormat: d => rtiIsDecimal ? (d * 100).toFixed(0) + "%" : d.toFixed(1) + "%", domain: rtiDomain },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: showLegend },
              marks: [
                Plot.ruleY([rtiIsDecimal ? 0.30 : 30], { stroke: "#aaa", strokeDasharray: "4,3" }),
                Plot.line(data, { x: "year", y: "rti", stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: "rti", fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}\n${rtiIsDecimal ? (d.rti*100).toFixed(1) : d.rti.toFixed(1)}% of income` }),
              ]
            }));

            const w2 = document.getElementById("hpti-chart").offsetWidth || 540;
            document.getElementById("hpti-chart").replaceChildren(Plot.plot({
              width: w2, height: 280, marginLeft: 80, marginRight: 20, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Home price-to-income ratio", labelOffset: 68, grid: true, domain: hptiDomain },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: showLegend },
              marks: [
                Plot.ruleY([4], { stroke: "#aaa", strokeDasharray: "4,3" }),
                Plot.line(data, { x: "year", y: "hpti", stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: "hpti", fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}\n${d.hpti}× annual income` }),
              ]
            }));
          }
          let activeAfTown = window.__masterTown || "All";
          renderAffordabilityIndex(activeAfTown);
          document.querySelectorAll("[data-af-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-af-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeAfTown = btn.dataset.afTown;
              renderAffordabilityIndex(activeAfTown);
            });
          });
          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeAfTown = town;
            document.querySelectorAll("[data-af-town]").forEach(b => b.classList.toggle("on", b.dataset.afTown === town));
            renderAffordabilityIndex(town);
          });
        }
})();

// Block 7 (module)
(async function() {
          const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
          document.getElementById("population-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
          let rows;
          try {
            rows = await window.loadData('town-population');
          } catch(e) { console.error("Failed to load town-population:", e); rows = []; }
          if (rows.length) {
            function renderPopulation(town) {
              const data = town === "All" ? rows : rows.filter(d => d.town === town);
              if (!data.length) return;
              const w = document.getElementById("population-chart").offsetWidth || 680;
              const chart = Plot.plot({
                width: w, height: 340, marginLeft: 90, marginRight: 90, marginBottom: 55,
                style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
                x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
                y: (() => { const vals = data.map(d => d.population).filter(v=>v!=null); const hi = Math.max(...vals); const s = 5000; return { label: "↑ Total population", labelOffset: 78, grid: true, tickFormat: d => (d/1000).toFixed(0) + "k", domain: [0, Math.ceil((hi + s) / s) * s] }; })(),
                color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: town === "All" },
                marks: [
                  Plot.line(data, { x: "year", y: "population", stroke: "town", strokeWidth: 2.5 }),
                  Plot.dot(data,  { x: "year", y: "population", fill: "town", r: 4,
                    tip: true, title: d => `${d.town}\n${d.year}\n${d.population.toLocaleString()} residents` }),
                  Plot.ruleY([0])
                ]
              });
              document.getElementById("population-chart").replaceChildren(chart);
            }
            let activePopTown = window.__masterTown || "All";
            renderPopulation(activePopTown);

            document.querySelectorAll("[data-pop-town]").forEach(btn => {
              btn.addEventListener("click", () => {
                document.querySelectorAll("[data-pop-town]").forEach(b => b.classList.remove("on"));
                btn.classList.add("on");
                activePopTown = btn.dataset.popTown;
                renderPopulation(activePopTown);
              });
            });

            document.addEventListener("masterTownChange", ({ detail: { town } }) => {
              activePopTown = town === "All" ? "All" : town;
              document.querySelectorAll("[data-pop-town]").forEach(b =>
                b.classList.toggle("on", b.dataset.popTown === activePopTown));
              renderPopulation(activePopTown);
            });
          } else {
            window.mdShowError('population-chart');
          }
})();

// Block 8 (module)
(async function() {
          const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
          const TENURE_COLORS = { "Owner-occupied": "#3f4e75", "Renter-occupied": "#e05c4b" };

          let rows = [];
          let activeTown = "All";

          function renderTenure() {
            const el = document.getElementById("tenure-chart");
            const data = activeTown === "All" ? rows : rows.filter(d => d.town === activeTown);
            if (!data.length) return;
            const w = el.offsetWidth || 680;
            const isAll = activeTown === "All";
            const chart = Plot.plot({
              width: w, height: 300, marginLeft: 85, marginRight: 20, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 45, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: (() => { const vals = data.map(d => d.total_households).filter(v=>v!=null); const hi = Math.max(...vals); const s = 500; return { label: "↑ Households", labelOffset: 73, grid: true, tickFormat: d => d >= 1000 ? (d/1000).toFixed(0)+"k" : d, domain: [0, Math.ceil((hi + s) / s) * s] }; })(),
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: isAll },
              marks: [
                Plot.line(data, { x: "year", y: "total_households", stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data,  { x: "year", y: "total_households", fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}: ${d.total_households.toLocaleString()} households` }),
                Plot.ruleY([0]),
              ]
            });
            el.replaceChildren(chart);
          }

          try {
            rows = await window.loadData('town-households');
            document.getElementById("tenure-chart").innerHTML = "";
            renderTenure();
          } catch(e) {
            console.error("Failed to load town-households:", e);
            window.mdShowError('tenure-chart');
          }

          document.querySelectorAll("[data-tenure-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-tenure-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeTown = btn.dataset.tenureTown;
              renderTenure();
            });
          });

          document.addEventListener("masterTownChange", ({ detail: { town } }) => {
            activeTown = town === "All" ? "All" : town;
            document.querySelectorAll("[data-tenure-town]").forEach(b =>
              b.classList.toggle("on", b.dataset.tenureTown === activeTown));
            renderTenure();
          });
})();

// Block 9 (module)
(async function() {
          const housing_types = [
            {town:"Cornelius", bucket:"Single-family",              count:10417, pct:69.7},
            {town:"Cornelius", bucket:"Small multifamily (2-4 units)", count:622,   pct:4.2},
            {town:"Cornelius", bucket:"Large multifamily (5+ units)",  count:3804,  pct:25.4},
            {town:"Cornelius", bucket:"Mobile / other",               count:113,   pct:0.8},
            {town:"Davidson",  bucket:"Single-family",              count:5031,  pct:79.9},
            {town:"Davidson",  bucket:"Small multifamily (2-4 units)", count:78,    pct:1.2},
            {town:"Davidson",  bucket:"Large multifamily (5+ units)",  count:1185,  pct:18.8},
            {town:"Davidson",  bucket:"Mobile / other",               count:0,     pct:0},
            {town:"Huntersville", bucket:"Single-family",           count:20998, pct:81},
            {town:"Huntersville", bucket:"Small multifamily (2-4 units)", count:539, pct:2.1},
            {town:"Huntersville", bucket:"Large multifamily (5+ units)",  count:4051, pct:15.6},
            {town:"Huntersville", bucket:"Mobile / other",              count:325,  pct:1.3}
          ];
          const order = ["Single-family","Small multifamily (2-4 units)","Large multifamily (5+ units)","Mobile / other"];
          const COLORS = {"Single-family":"#5a9e8f","Small multifamily (2-4 units)":"#f0a500","Large multifamily (5+ units)":"#3f4e75","Mobile / other":"#e8a598"};
          function renderHousingTypes() {
            const host = document.getElementById("housing-types-chart");
            const w = host.offsetWidth || 680;
            host.innerHTML = "";
            const chart = Plot.plot({
              width: w, height: 220, marginLeft: 90, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: {label: "Share of units →", labelOffset: 45, tickFormat: d => d + "%", domain: [0, 100]},
              y: {label: null},
              color: {
                legend: true,
                domain: order,
                range: order.map(b => COLORS[b])
              },
              marks: [
                Plot.barX(housing_types, {
                  x: "pct", y: "town", fill: "bucket",
                  order,
                  tip: true,
                  title: d => `${d.town}\n${d.bucket}: ${d.pct}% (${d.count.toLocaleString()} units)`
                }),
                Plot.ruleX([0])
              ]
            });
            host.appendChild(chart);
          }
          // Render when the host becomes visible (tab activated)
          const _htObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { renderHousingTypes(); _htObs.disconnect(); }
          });
          _htObs.observe(document.getElementById("housing-types-host"));
})();

// Block 10 (module)
(async function() {

        const BRACKETS = ["Less than $10k","$10k-$19,999","$20k-$34,999","$35k-$49,999","$50k-$74,999","$75k-$99,999","$100k+"];
        const BURDENS  = ["Not burdened (<30%)","Cost burdened (30-50%)","Severely burdened (50%+)"];
        const BCOLORS  = ["#5a9e8f","#f0a500","#e05c4b"];

        const raw = await window.loadData('dlib-burden-by-bracket');

        let activeTown = "Cornelius", activeTenure = "Renter";

        function renderBurden() {
          const subset = raw.filter(d => d.town === activeTown && d.tenure === activeTenure);
          const w = document.getElementById("burden-chart").offsetWidth || 680;
          const chart = Plot.plot({
            width: w, height: 360, marginLeft: 90, marginBottom: 82,
            style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
            x: { domain: BRACKETS, label: "Income bracket →", labelOffset: 65, tickRotate: -30 },
            y: { label: "↑ Households", labelOffset: 78, grid: true, tickFormat: d => d.toLocaleString() },
            color: { domain: BURDENS, range: BCOLORS, legend: true },
            marks: [
              Plot.barY(subset, { x: "income_bracket", y: "count", fill: "burden",
                order: BURDENS,
                tip: true,
                title: d => `${d.burden}\n${d.count.toLocaleString()} households`
              }),
              Plot.ruleY([0])
            ]
          });
          document.getElementById("burden-chart").replaceChildren(chart);
        }

        renderBurden();

        document.querySelectorAll("[data-burden-town]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-burden-town]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activeTown = btn.dataset.burdenTown;
            renderBurden();
          });
        });
        document.querySelectorAll("[data-burden-tenure]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-burden-tenure]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activeTenure = btn.dataset.burdenTenure;
            renderBurden();
          });
        });

        document.addEventListener('masterTownChange', ({ detail: { town } }) => {
          if (town !== "All") {
            activeTown = town;
            document.querySelectorAll("[data-burden-town]").forEach(b => b.classList.toggle("on", b.dataset.burdenTown === town));
          }
          renderBurden();
        });
        document.addEventListener('tabChange', renderBurden);
})();

// Block 11 (module)
(async function() {

        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };

        let burdenTrend;
        try {
          burdenTrend = await window.loadData('housing-burden-trend');
        } catch(e) {
          console.error("Failed to load housing-burden-trend:", e);
          window.mdShowError('burden-trend-chart');
        }

        if (burdenTrend) {
          let activeBMetric = "rate";
          let activeBTown = window.__masterTown || "All";

          function renderBurdenTrend() {
            const data = activeBTown === "All" ? burdenTrend : burdenTrend.filter(d => d.town === activeBTown);
            if (!data.length) return;
            const w = document.getElementById("burden-trend-chart").offsetWidth || 680;
            const yKey = activeBMetric === "rate" ? "burden_rate" : activeBMetric === "count" ? "cost_burdened" : "severe_rate";
            const yLabel = activeBMetric === "rate" ? "Cost-burdened renters (%) →" : activeBMetric === "count" ? "Cost-burdened households →" : "Severely burdened renters (%) →";
            const yFmt = activeBMetric === "count" ? d => d.toLocaleString() : d => d + "%";
            const yVals = data.map(d => d[yKey]).filter(v => v != null);
            const yLo = Math.min(...yVals), yHi = Math.max(...yVals);
            const step = activeBMetric === "count" ? 500 : 5;
            const yDomain = [Math.max(0, Math.floor((yLo - step) / step) * step), Math.ceil((yHi + step * 0.5) / step) * step];
            const chart = Plot.plot({
              width: w, height: 320, marginLeft: 90, marginRight: 90, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: yLabel, labelOffset: 78, grid: true, tickFormat: yFmt, domain: yDomain },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: activeBTown === "All" },
              marks: [
                Plot.line(data, { x: "year", y: yKey, stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: yKey, fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}\n${yFmt(d[yKey])}` }),
                activeBMetric === "rate" ? Plot.ruleY([30], { stroke: "#e05c4b", strokeDasharray: "4,3", strokeWidth: 1.5 }) : null,
              ].filter(Boolean)
            });
            document.getElementById("burden-trend-chart").replaceChildren(chart);
          }

          renderBurdenTrend();

          document.querySelectorAll("[data-btrend-metric]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-btrend-metric]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeBMetric = btn.dataset.btrendMetric;
              renderBurdenTrend();
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeBTown = town;
            renderBurdenTrend();
          });
        }
})();

// Block 12 (module)
(async function() {
          const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
          let rows = [];
          let activeTown = "All";

          function renderSeverelyBurdened() {
            const el = document.getElementById("severely-burdened-chart");
            const data = activeTown === "All" ? rows : rows.filter(d => d.town === activeTown);
            if (!data.length) return;
            const w = el.offsetWidth || 680;
            const isAll = activeTown === "All";

            const yVals = data.map(d => d.severely_cost_burdened_households).filter(v => v != null);
            const yHi = Math.max(...yVals);
            const s = 200;
            const chart = Plot.plot({
              width: w, height: 320,
              marginLeft: 90, marginRight: 90, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Severely burdened households", labelOffset: 78, grid: true,
                   tickFormat: d => d.toLocaleString(), domain: [0, Math.ceil((yHi + s) / s) * s] },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: isAll },
              marks: [
                Plot.line(data, { x: "year", y: "severely_cost_burdened_households",
                  stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: "severely_cost_burdened_households",
                  fill: "town", r: 4,
                  tip: true, title: d => `${d.town} · ${d.year}\n${d.severely_cost_burdened_households.toLocaleString()} severely burdened households` }),
                Plot.ruleY([0]),
              ]
            });
            el.replaceChildren(chart);
          }

          try {
            rows = await window.loadData('severely-burdened-households');
            document.getElementById("severely-burdened-chart").innerHTML = "";
            renderSeverelyBurdened();
          } catch(e) {
            console.error("Failed to load severely-burdened-households:", e);
            window.mdShowError('severely-burdened-chart');
          }

          document.querySelectorAll("[data-sevburd-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-sevburd-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeTown = btn.dataset.sevburdTown;
              renderSeverelyBurdened();
            });
          });

          document.addEventListener("masterTownChange", ({ detail: { town } }) => {
            activeTown = town;
            document.querySelectorAll("[data-sevburd-town]").forEach(b =>
              b.classList.toggle("on", b.dataset.sevburdTown === activeTown));
            renderSeverelyBurdened();
          });
})();

// Block 13 (module)
(async function() {

        const CORE_RACES = ["White, not Hispanic","Black or African American","Hispanic or Latino","Asian","Two or more races"];
        const raceData = [{"town":"Cornelius","race":"White alone","total":12014,"owner":8802,"renter":3212,"ownership_rate":73.3,"renter_rate":26.7},{"town":"Davidson","race":"White alone","total":4809,"owner":3934,"renter":875,"ownership_rate":81.8,"renter_rate":18.2},{"town":"Huntersville","race":"White alone","total":18426,"owner":13928,"renter":4498,"ownership_rate":75.6,"renter_rate":24.4},{"town":"Cornelius","race":"Black or African American","total":511,"owner":148,"renter":363,"ownership_rate":29,"renter_rate":71},{"town":"Davidson","race":"Black or African American","total":392,"owner":245,"renter":147,"ownership_rate":62.5,"renter_rate":37.5},{"town":"Huntersville","race":"Black or African American","total":3544,"owner":1679,"renter":1865,"ownership_rate":47.4,"renter_rate":52.6},{"town":"Cornelius","race":"American Indian/Alaska Native","total":61,"owner":8,"renter":53,"ownership_rate":13.1,"renter_rate":86.9},{"town":"Cornelius","race":"Asian","total":325,"owner":166,"renter":159,"ownership_rate":51.1,"renter_rate":48.9},{"town":"Davidson","race":"Asian","total":120,"owner":120,"renter":0,"ownership_rate":100,"renter_rate":0},{"town":"Huntersville","race":"Asian","total":1206,"owner":1100,"renter":106,"ownership_rate":91.2,"renter_rate":8.8},{"town":"Cornelius","race":"Some other race","total":182,"owner":80,"renter":102,"ownership_rate":44,"renter_rate":56},{"town":"Huntersville","race":"Some other race","total":708,"owner":393,"renter":315,"ownership_rate":55.5,"renter_rate":44.5},{"town":"Cornelius","race":"Two or more races","total":791,"owner":446,"renter":345,"ownership_rate":56.4,"renter_rate":43.6},{"town":"Davidson","race":"Two or more races","total":237,"owner":143,"renter":94,"ownership_rate":60.3,"renter_rate":39.7},{"town":"Huntersville","race":"Two or more races","total":1150,"owner":850,"renter":300,"ownership_rate":73.9,"renter_rate":26.1},{"town":"Cornelius","race":"White, not Hispanic","total":11924,"owner":8754,"renter":3170,"ownership_rate":73.4,"renter_rate":26.6},{"town":"Davidson","race":"White, not Hispanic","total":4744,"owner":3882,"renter":862,"ownership_rate":81.8,"renter_rate":18.2},{"town":"Huntersville","race":"White, not Hispanic","total":18158,"owner":13763,"renter":4395,"ownership_rate":75.8,"renter_rate":24.2},{"town":"Cornelius","race":"Hispanic or Latino","total":578,"owner":310,"renter":268,"ownership_rate":53.6,"renter_rate":46.4},{"town":"Davidson","race":"Hispanic or Latino","total":165,"owner":78,"renter":87,"ownership_rate":47.3,"renter_rate":52.7},{"town":"Huntersville","race":"Hispanic or Latino","total":1621,"owner":963,"renter":658,"ownership_rate":59.4,"renter_rate":40.6}];

        const coreData = raceData.filter(d => CORE_RACES.includes(d.race));
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };

        let activeView = "ownership";
        let activeRaceTown = window.__masterTown || "All";

        function renderRace() {
          const filtered = activeRaceTown === "All" ? coreData : coreData.filter(d => d.town === activeRaceTown);
          const w = document.getElementById("race-chart").offsetWidth || 680;
          let chart;
          if (activeView === "ownership") {
            chart = Plot.plot({
              width: w, height: 320, marginLeft: 200, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Ownership rate (%) →", labelOffset: 45, domain: [0, 105], grid: true },
              y: { label: null, domain: [...CORE_RACES].reverse() },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: true },
              marks: [
                Plot.barX(filtered, Plot.groupY({ x: "mean" }, {
                  x: "ownership_rate", y: "race", fill: "town",
                  tip: true, title: d => `${d.race}\n${d.town}\n${d.ownership_rate}% own`
                })),
                Plot.ruleX([0])
              ]
            });
          } else {
            const stacked = filtered.flatMap(d => [
              { town: d.town, race: d.race, tenure: "Owner", count: d.owner },
              { town: d.town, race: d.race, tenure: "Renter", count: d.renter },
            ]);
            const isAll = activeRaceTown === "All";
            chart = Plot.plot({
              width: w, height: isAll ? 900 : 320, marginLeft: 180, marginRight: isAll ? 110 : 20, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Households →", labelOffset: 45, grid: true },
              y: { label: null, domain: [...CORE_RACES].reverse() },
              color: { domain: ["Owner","Renter"], range: ["#3f4e75","#e05c4b"], legend: true },
              ...(isAll ? { facet: { data: stacked, y: "town", label: null }, fy: { axis: "right", label: null, tickSize: 0, tickPadding: 10 } } : {}),
              marks: [
                Plot.barX(stacked, { x: "count", y: "race", fill: "tenure",
                  offset: "normalize",
                  tip: true, title: d => `${d.race} · ${d.tenure}\n${d.count.toLocaleString()} HH`
                }),
                Plot.ruleX([0])
              ]
            });
          }
          document.getElementById("race-chart").replaceChildren(chart);
        }

        renderRace();

        document.querySelectorAll("[data-race-view]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-race-view]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activeView = btn.dataset.raceView;
            renderRace();
          });
        });

        document.querySelectorAll("[data-race-town]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-race-town]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activeRaceTown = btn.dataset.raceTown;
            renderRace();
          });
        });

        document.addEventListener('masterTownChange', ({ detail: { town } }) => {
          activeRaceTown = town;
          document.querySelectorAll("[data-race-town]").forEach(b =>
            b.classList.toggle("on", b.dataset.raceTown === town));
          renderRace();
        });
})();

// Block 14 (module)
(async function() {
        const wrap = document.getElementById("race-summary-table-wrap");
        try {
          const popRows = await window.loadData('race-summary');

          // Race columns are resolved server-side (scripts/refresh-data.mjs
          // replicates the same column-name matching this block used to do
          // client-side via DESCRIBE) - only include a race here if the
          // snapshot actually found and populated that column.
          const races = ["White, not Hispanic", "Black or African American", "Hispanic or Latino", "Asian"]
            .filter(label => popRows.some(r => label in r))
            .map(label => ({ label }));

          // Aggregate race populations across all three towns
          const raceTotals = {};
          let grandTotal = 0;
          for (const row of popRows) {
            grandTotal += row.total_pop;
            for (const { label } of races) {
              raceTotals[label] = (raceTotals[label] || 0) + (row[label] || 0);
            }
          }

          // Ownership rates from the existing ACS race chart data (same source, pre-loaded)
          const ownershipByRace = {
            "White, not Hispanic": { ownership: 77, renter: 23 },
            "Black or African American": { ownership: 46, renter: 54 },
            "Hispanic or Latino": { ownership: 54, renter: 46 },
            "Asian": { ownership: 78, renter: 22 },
          };

          // Build table rows
          const rows = races.map(({ label }) => {
            const pop = raceTotals[label] || 0;
            const shareOfTotal = grandTotal ? Math.round(pop / grandTotal * 100) : 0;
            const { ownership, renter } = ownershipByRace[label] || { ownership: "—", renter: "—" };
            const isHigh = label !== "White, not Hispanic";
            return `<tr>
              <td class="name">${label}</td>
              <td class="num">${pop.toLocaleString()} <span style="color:var(--ink-3);font-size:12px">(${shareOfTotal}%)</span></td>
              <td class="${renter > 40 ? 'hi' : 'ok'}">${renter}%</td>
              <td class="${ownership < 60 ? 'hi' : 'ok'}">${ownership}%</td>
            </tr>`;
          }).join("");

          wrap.innerHTML = `
            <table style="margin-top:0">
              <thead><tr>
                <th>Group</th>
                <th>Population (2024)</th>
                <th>Renter households</th>
                <th>Homeownership rate</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="font-size:12px;color:var(--ink-3);margin-top:8px;font-family:'Hanken Grotesk',sans-serif">Population totals: ACS 2024 · Tenure rates: ACS 2024 Census tenure by race</p>
          `;
        } catch(e) {
          console.error("race table error:", e);
          window.mdShowError('race-summary-table-wrap');
        }
})();

// Block 15 (module)
(async function() {
          const RACE_ORDER = ["White","Black","Two or More Races","Asian","Some Other Race","American Indian/Alaska Native","Native Hawaiian/Pacific Islander"];
          const RACE_COLORS = {"White":"#3f4e75","Black":"#e05c4b","Two or More Races":"#f0a500","Asian":"#5a9e8f","Some Other Race":"#a0522d","American Indian/Alaska Native":"#7a9e4e","Native Hawaiian/Pacific Islander":"#b07bbf"};
          try {
            // Column discovery + latest-year lookup now happen server-side
            // (scripts/refresh-data.mjs) - this snapshot's rows already have
            // town/total/white/black/asian/hispanic/two_more/native/nhpi/other.
            const rows = await window.loadData('race-composition');
            const raceMap = {
              "White": r => r.white,
              "Black": r => r.black,
              "Asian": r => r.asian,
              "Two or More Races": r => r.two_more,
              "Some Other Race": r => r.other,
              "American Indian/Alaska Native": r => r.native,
              "Native Hawaiian/Pacific Islander": r => r.nhpi
            };
            const allData = [];
            for (const r of rows) {
              const total = r.total || 1;
              for (const [race, fn] of Object.entries(raceMap)) {
                const count = fn(r) || 0;
                allData.push({ town: r.town, race, count, pct: Math.round(count / total * 1000) / 10 });
              }
            }

            function renderRaceComp(town) {
              const data = town === "All" ? allData : allData.filter(d => d.town === town);
              const ww = document.getElementById("race-comp-chart").offsetWidth || 680;
              const nTowns = [...new Set(data.map(d => d.town))].length;
              const chart = Plot.plot({
                width: ww, height: Math.max(120, nTowns * 60 + 80), marginLeft: 90, marginBottom: 50,
                style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
                x: {label: "Share of population →", labelOffset: 45, tickFormat: d => d + "%", domain: [0, 100]},
                y: {label: null},
                color: { legend: true, domain: RACE_ORDER, range: RACE_ORDER.map(r => RACE_COLORS[r]) },
                marks: [
                  Plot.barX(data, {
                    x: "pct", y: "town", fill: "race",
                    order: RACE_ORDER, tip: true,
                    title: d => `${d.town}\n${d.race}: ${d.pct}% (${d.count.toLocaleString()})`
                  }),
                  Plot.ruleX([0])
                ]
              });
              document.getElementById("race-comp-chart").innerHTML = "";
              document.getElementById("race-comp-chart").appendChild(chart);
            }

            let activeRaceCompTown = window.__masterTown || "All";
            renderRaceComp(activeRaceCompTown);

            document.querySelectorAll("[data-racecomp-town]").forEach(btn => {
              btn.addEventListener("click", () => {
                document.querySelectorAll("[data-racecomp-town]").forEach(b => b.classList.remove("on"));
                btn.classList.add("on");
                activeRaceCompTown = btn.dataset.racecompTown;
                renderRaceComp(activeRaceCompTown);
              });
            });

            document.addEventListener("masterTownChange", ({ detail: { town } }) => {
              activeRaceCompTown = town === "All" ? "All" : town;
              document.querySelectorAll("[data-racecomp-town]").forEach(b =>
                b.classList.toggle("on", b.dataset.racecompTown === activeRaceCompTown));
              renderRaceComp(activeRaceCompTown);
            });
          } catch(e) {
            console.error("race-comp-chart error:", e);
            window.mdShowError('race-comp-chart');
          }
})();

// Block 16 (module)
(async function() {
          const RACE_COLORS = {
            "White": "#3f4e75", "Black": "#e05c4b",
            "Hispanic": "#f0a500", "Asian": "#5a9e8f", "Other": "#aaa"
          };
          document.getElementById("race-trend-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
          let rawRows;
          try {
            // Column discovery now happens server-side (scripts/refresh-data.mjs)
            // - this snapshot's rows already have town/year/total/white/black/hispanic/asian.
            rawRows = await window.loadData('race-trend');
          } catch(e) {
            console.error("Failed to load race-trend:", e);
            rawRows = [];
          }

          if (!rawRows || !rawRows.length) {
            window.mdShowError('race-trend-chart');
          } else {

          // Expand to long format: one row per town × year × race
          const long = rawRows.flatMap(d => {
            const t = d.total || 1;
            const other = Math.max(0, d.total - d.white - d.black - d.hispanic - d.asian);
            return [
              { town: d.town, year: d.year, race: "White",    pct: d.white    / t * 100 },
              { town: d.town, year: d.year, race: "Black",    pct: d.black    / t * 100 },
              { town: d.town, year: d.year, race: "Hispanic", pct: d.hispanic / t * 100 },
              { town: d.town, year: d.year, race: "Asian",    pct: d.asian    / t * 100 },
              { town: d.town, year: d.year, race: "Other",    pct: other      / t * 100 },
            ];
          });

          let activeTown = (window.__masterTown && window.__masterTown !== "All") ? window.__masterTown : "Cornelius";

          function renderRaceTrend() {
            const activeRaces = new Set([...document.querySelectorAll('[data-racetrend-race].on')].map(b => b.dataset.racetrendRace));
            const subset = long.filter(d => d.town === activeTown && activeRaces.has(d.race));
            const w = document.getElementById("race-trend-chart").offsetWidth || 680;
            const chart = Plot.plot({
              width: w, height: 320, marginLeft: 90, marginRight: 90, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 45, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Share of population (%)", labelOffset: 78, grid: true, tickFormat: d => d.toFixed(0) + "%" },
              color: { domain: Object.keys(RACE_COLORS), range: Object.values(RACE_COLORS), legend: true },
              marks: [
                Plot.ruleY([100], { stroke: "#aaa", strokeDasharray: "4,3" }),
                Plot.line(subset, { x: "year", y: "pct", stroke: "race", strokeWidth: 2.5 }),
                Plot.dot(subset, { x: "year", y: "pct", fill: "race", r: 5,
                  tip: true, title: d => `${d.race}\n${d.year}\n${d.pct.toFixed(1)}%` }),
              ]
            });
            document.getElementById("race-trend-chart").replaceChildren(chart);
          }

          renderRaceTrend();

          document.querySelectorAll("[data-racetrend-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-racetrend-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeTown = btn.dataset.racetrendTown;
              renderRaceTrend();
            });
          });

          document.querySelectorAll("[data-racetrend-race]").forEach(btn => {
            btn.addEventListener("click", () => {
              btn.classList.toggle("on");
              renderRaceTrend();
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            if (town !== "All") {
              activeTown = town;
              document.querySelectorAll("[data-racetrend-town]").forEach(b => b.classList.toggle("on", b.dataset.racetrendTown === town));
              renderRaceTrend();
            }
          });
          } // end else (data loaded)
})();

// Block 17 (module)
(async function() {
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };

        let dpRows = [];

        function renderDownPayment(town) {
          const el = document.getElementById("down-payment-chart");
          const data = town === "All" ? dpRows : dpRows.filter(d => d.town === town);
          if (!data.length) return;
          const w = el.offsetWidth || 680;
          const chart = Plot.plot({
            width: w, height: town === "All" ? 200 : 100,
            marginLeft: 120, marginRight: 60, marginTop: 20, marginBottom: 55,
            style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
            x: { label: "Years to Save 20% Down Payment →", labelOffset: 50, grid: true, domain: [0, 12] },
            y: { label: null },
            marks: [
              Plot.barX(data, {
                y: "town", x: "years", fill: "town",
                tip: true, title: d => `${d.town}\n${d.years.toFixed(1)} years\n(home value: $${(d.home_value/1000).toFixed(0)}k, income: $${(d.median_income/1000).toFixed(0)}k)`
              }),
              Plot.ruleX([8.5], { stroke: "#bbb", strokeDasharray: "4,3", strokeWidth: 1.5 }),
              Plot.text(data, {
                y: "town", x: "years", text: d => d.years.toFixed(1) + " yrs",
                dx: 6, textAnchor: "start", fontSize: 12, fill: "#555"
              }),
            ],
            color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS) },
          });
          el.replaceChildren(chart);
        }

        try {
          dpRows = await window.loadData('down-payment-years');
          renderDownPayment(window.__masterTown || "All");
        } catch(e) {
          console.error("Down payment chart load failed:", e);
          window.mdShowError('down-payment-chart');
        }

        document.addEventListener("masterTownChange", ({ detail: { town } }) => renderDownPayment(town));
})();

// Block 18 (module)
(async function() {

        const PTR_BRACKETS = ["Less than $10k","$10k-$19,999","$20k-$34,999","$35k-$49,999","$50k-$74,999","$75k-$99,999","$100k-$149,999"];
        const ptrData = await window.loadData('dlib-ptr-by-bracket');

        const TOWN_COLORS_PTR = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        const BRACKET_ORDER = PTR_BRACKETS.slice(1);
        let activePtrTown = "all";

        function renderPTR() {
          const isAll = activePtrTown === "all";
          const subset = ptrData
            .filter(d => d.income_bracket !== "Less than $10k")
            .filter(d => isAll || d.town === activePtrTown);
          const w = document.getElementById("ptr-chart").offsetWidth || 680;

          let chart;
          if (isAll) {
            // Grouped bar chart — all 3 towns side by side per bracket
            chart = Plot.plot({
              width: w, height: 400, marginLeft: 80, marginBottom: 90,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              fx: { domain: BRACKET_ORDER, axis: "bottom", label: "Income bracket →", tickRotate: -30, padding: 0.15 },
              x: { axis: null },
              y: { label: "↑ Years of gross income", labelOffset: 68, grid: true },
              color: { domain: Object.keys(TOWN_COLORS_PTR), range: Object.values(TOWN_COLORS_PTR), legend: true },
              marks: [
                Plot.barY(subset, {
                  x: "town", y: "ratio", fx: "income_bracket", fill: "town",
                  tip: true, title: d => `${d.town}\n${d.income_bracket}\n${d.ratio} years`
                }),
                Plot.ruleY([0]),
              ]
            });
          } else {
            // Horizontal bar chart — single town, colored by ratio value
            const bracketDomain = [...BRACKET_ORDER].reverse();
            chart = Plot.plot({
              width: w, height: 280, marginLeft: 120, marginRight: 60, marginTop: 10, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Price-to-Income Ratio (Years) →", labelOffset: 50, grid: true },
              y: { label: null, domain: bracketDomain },
              color: { type: "sequential", scheme: "YlOrRd", domain: [0, Math.ceil(Math.max(...subset.map(d => d.ratio)))], legend: true, label: "Price-to-Income Ratio" },
              marks: [
                Plot.barX(subset, {
                  y: "income_bracket", x: "ratio", fill: "ratio",
                  tip: true, title: d => `${d.income_bracket}\n${d.ratio} years`
                }),
                Plot.text(subset, {
                  y: "income_bracket", x: "ratio",
                  text: d => d.ratio + "×",
                  dx: 5, textAnchor: "start", fontSize: 11, fill: "#555"
                }),
              ]
            });
          }
          document.getElementById("ptr-chart").replaceChildren(chart);
        }

        renderPTR();

        document.querySelectorAll("[data-ptr-town]").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll("[data-ptr-town]").forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
            activePtrTown = btn.dataset.ptrTown;
            renderPTR();
          });
        });

        document.addEventListener("masterTownChange", ({ detail: { town } }) => {
          if (town !== "All") {
            activePtrTown = town;
            document.querySelectorAll("[data-ptr-town]").forEach(b =>
              b.classList.toggle("on", b.dataset.ptrTown === town));
          } else {
            activePtrTown = "all";
            document.querySelectorAll("[data-ptr-town]").forEach(b =>
              b.classList.toggle("on", b.dataset.ptrTown === "all"));
          }
          renderPTR();
        });
})();

// Block 19 (module)
(async function() {
          const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
          document.getElementById("median-income-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
          let rows;
          try {
            rows = await window.loadData('median-income-trend');
          } catch(e) { console.error(e); rows = []; }
          if (rows.length) {
            function renderMedianIncome(town) {
              const data = town === "All" ? rows : rows.filter(d => d.town === town);
              if (!data.length) return;
              const w = document.getElementById("median-income-chart").offsetWidth || 680;
              const chart = Plot.plot({
                width: w, height: 340, marginLeft: 90, marginRight: 90, marginBottom: 55,
                style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
                x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
                y: (() => { const vals = data.map(d => d.income).filter(v=>v!=null); const lo = Math.min(...vals), hi = Math.max(...vals); const s = 10000; return { label: "↑ Median household income", labelOffset: 78, grid: true, tickFormat: d => "$" + (d/1000).toFixed(0) + "k", domain: [Math.floor((lo - s) / s) * s, Math.ceil((hi + s * 0.5) / s) * s] }; })(),
                color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: town === "All" },
                marks: [
                  Plot.line(data, { x: "year", y: "income", stroke: "town", strokeWidth: 2.5 }),
                  Plot.dot(data,  { x: "year", y: "income", fill: "town", r: 4,
                    tip: true, title: d => `${d.town}\n${d.year}\n$${d.income.toLocaleString()}` }),
                  Plot.ruleY([0])
                ]
              });
              document.getElementById("median-income-chart").replaceChildren(chart);
            }
            renderMedianIncome(window.__masterTown || "All");
            window.__renders = window.__renders || {};
            window.__renders['income'] = renderMedianIncome;
            document.addEventListener('masterTownChange', ({ detail: { town } }) => renderMedianIncome(town));
          } else {
            window.mdShowError('median-income-chart');
          }
})();

// Block 20 (module)
(async function() {

        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };

        document.getElementById("gini-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        document.getElementById("ptr-trend-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';

        let trends;
        try {
          trends = await window.loadData('gini-ptr-trend');
        } catch(e) {
          console.error("Trends load failed:", e);
          ["gini-chart","ptr-trend-chart"].forEach(id => window.mdShowError(id));
        }

        if (trends) {
          let activeTrendTown = window.__masterTown || "All";

          function renderGiniPTR() {
            const data = activeTrendTown === "All" ? trends : trends.filter(d => d.town === activeTrendTown);
            if (!data.length) return;
            const showLegend = activeTrendTown === "All";

            const w1 = document.getElementById("gini-chart").offsetWidth || 680;
            const giniChart = Plot.plot({
              width: w1, height: 300, marginLeft: 90, marginRight: 90, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: { label: "↑ Gini coefficient", labelOffset: 78, grid: true, domain: [0.35, 0.56] },
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: showLegend },
              marks: [
                Plot.line(data, { x: "year", y: "gini", stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: "gini", fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}\nGini: ${d.gini}` }),
                Plot.ruleY([0.4], { stroke: "#aaa", strokeDasharray: "4,3" }),
                Plot.text([{ x: 2024, y: 0.4 }], { x: "x", y: "y", text: () => "U.S. avg ~0.40", textAnchor: "start", dx: 8, fontSize: 11, fill: "#999" }),
              ]
            });
            document.getElementById("gini-chart").replaceChildren(giniChart);

            const w2 = document.getElementById("ptr-trend-chart").offsetWidth || 680;
            const ptrChart = Plot.plot({
              width: w2, height: 300, marginLeft: 90, marginRight: 90, marginBottom: 55,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 50, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: (() => { const vals = data.map(d => d.ptr).filter(v=>v!=null); const lo = Math.min(...vals), hi = Math.max(...vals); const s = 0.5; return { label: "↑ Price-to-income ratio", labelOffset: 78, grid: true, domain: [Math.max(0, Math.floor((lo-s)/s)*s), Math.ceil((hi+s*0.5)/s)*s] }; })(),
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: showLegend },
              marks: [
                Plot.line(data, { x: "year", y: "ptr", stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(data, { x: "year", y: "ptr", fill: "town", r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}\n${d.ptr}× annual income` }),
                Plot.ruleY([3], { stroke: "#aaa", strokeDasharray: "4,3" }),
                Plot.text([{ x: 2024, y: 3 }], { x: "x", y: "y", text: () => "3× rule of thumb", textAnchor: "start", dx: 8, fontSize: 11, fill: "#999" }),
              ]
            });
            document.getElementById("ptr-trend-chart").replaceChildren(ptrChart);
          }

          renderGiniPTR();
          window.__renders = window.__renders || {};
          window.__renders['gini'] = (town) => { activeTrendTown = town; renderGiniPTR(); };
          document.querySelectorAll("[data-ptr-town]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-ptr-town]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeTrendTown = btn.dataset.ptrTown;
              renderGiniPTR();
            });
          });
          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeTrendTown = town;
            document.querySelectorAll("[data-ptr-town]").forEach(b => b.classList.toggle("on", b.dataset.ptrTown === town));
            renderGiniPTR();
          });
        }
})();

// Block 21 (module)
(async function() {
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        const SEGMENTS = ["Below FPL", "ALICE", "Above ALICE threshold"];
        const SEG_COLORS = { "Below FPL": "#e05c4b", "ALICE": "#f0a500", "Above ALICE threshold": "#3f4e75" };

        ['alice-bar-chart','alice-trend-chart','alice-county-chart'].forEach(id =>
          document.getElementById(id).innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>'
        );

        let townRows, countyRows;
        try {
          const [townRows2, countyRows2] = await Promise.all([
            window.loadData('alice-town'),
            window.loadData('alice-county')
          ]);
          townRows  = townRows2;
          countyRows = countyRows2;
        } catch(e) {
          console.error("ALICE load failed:", e);
          ['alice-bar-chart','alice-trend-chart','alice-county-chart'].forEach(id => window.mdShowError(id));
        }

        if (townRows && townRows.length) {
          const maxYear = Math.max(...townRows.map(d => d.year));
          const trend = townRows.map(d => ({
            town: d.town, year: d.year,
            pct: (d.poverty_households + d.alice_households) / d.total_households * 100
          }));

          function renderAliceBar(filterTown) {
            const src = filterTown === "All" ? townRows.filter(d => d.year === maxYear)
                        : townRows.filter(d => d.year === maxYear && d.town === filterTown);
            const long = src.flatMap(d => [
              { town: d.town, segment: "Below FPL",             pct: d.poverty_households    / d.total_households * 100, n: d.poverty_households },
              { town: d.town, segment: "ALICE",                 pct: d.alice_households       / d.total_households * 100, n: d.alice_households },
              { town: d.town, segment: "Above ALICE threshold", pct: d.above_alice_households / d.total_households * 100, n: d.above_alice_households },
            ]);
            const w1 = document.getElementById("alice-bar-chart").offsetWidth || 480;
            const h = filterTown === "All" ? 200 : 120;
            document.getElementById("alice-bar-chart").replaceChildren(Plot.plot({
              width: w1, height: h, marginLeft: 110, marginRight: 20, marginBottom: 40,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Share of households →", labelOffset: 35, tickFormat: d => d.toFixed(0)+"%", domain: [0,100] },
              y: { label: null },
              color: { domain: SEGMENTS, range: SEGMENTS.map(s => SEG_COLORS[s]), legend: filterTown === "All" },
              marks: [
                Plot.barX(long, Plot.stackX({ order: SEGMENTS, x: "pct", y: "town", fill: "segment",
                  tip: true, title: d => `${d.town} · ${maxYear}\n${d.segment}: ${d.pct.toFixed(1)}% (${d.n.toLocaleString()} households)` })),
                Plot.ruleX([0]),
              ]
            }));
          }

          function renderAliceTrend() {
            const lollipop = townRows
              .filter(d => d.year === maxYear)
              .map(d => ({
                town: d.town,
                pct: (d.poverty_households + d.alice_households) / d.total_households * 100
              }))
              .sort((a, b) => b.pct - a.pct);
            const w3 = document.getElementById("alice-trend-chart").offsetWidth || 680;
            document.getElementById("alice-trend-chart").replaceChildren(Plot.plot({
              width: w3, height: 160, marginLeft: 110, marginRight: 80, marginBottom: 40,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "% below ALICE threshold →", labelOffset: 35, tickFormat: d => d.toFixed(0)+"%", domain: [0, Math.ceil(Math.max(...lollipop.map(d=>d.pct))/5)*5 + 5] },
              y: { label: null },
              marks: [
                Plot.ruleX([0]),
                Plot.ruleY(lollipop, { x1: 0, x2: "pct", y: "town", stroke: d => TOWN_COLORS[d.town], strokeWidth: 2.5 }),
                Plot.dot(lollipop, { x: "pct", y: "town", fill: d => TOWN_COLORS[d.town], r: 7,
                  tip: true, title: d => `${d.town} · ${maxYear}\n${d.pct.toFixed(1)}% below ALICE threshold` }),
                Plot.text(lollipop, { x: "pct", y: "town", text: d => d.pct.toFixed(1)+"%", textAnchor: "start", dx: 14, fontSize: 12, fill: d => TOWN_COLORS[d.town], fontWeight: "600" }),
              ]
            }));
          }

          renderAliceBar("All");
          renderAliceTrend();
          window.__renders = window.__renders || {};
          window.__renders['alice-bar'] = renderAliceBar;
        }

        // ── 3. County comparison — latest year bar ──────────────────────
        if (countyRows && countyRows.length && townRows && townRows.length) {
          const maxYearT  = Math.max(...townRows.map(d => d.year));
          const maxYearC  = Math.max(...countyRows.map(d => d.year));
          const latestT   = townRows.filter(d => d.year === maxYearT);
          const latestC   = countyRows.filter(d => d.year === maxYearC);

          const bars = [
            ...latestT.map(d => ({
              label: d.town,
              pct: (d.poverty_households + d.alice_households) / d.total_households * 100,
              color: TOWN_COLORS[d.town] || "#888"
            })),
            ...latestC.map(d => ({
              label: d.county + " County",
              pct: (d.poverty_households + d.alice_households) / d.total_households * 100,
              color: "#aaa"
            }))
          ].sort((a,b) => b.pct - a.pct);

          const w2 = document.getElementById("alice-county-chart").offsetWidth || 480;
          document.getElementById("alice-county-chart").replaceChildren(Plot.plot({
            width: w2, height: 180, marginLeft: 140, marginRight: 60, marginBottom: 40,
            style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
            x: { label: "% below ALICE threshold →", labelOffset: 35, tickFormat: d => d.toFixed(0)+"%" },
            y: { label: null },
            marks: [
              Plot.barX(bars, { x: "pct", y: "label", fill: "color", rx: 3,
                tip: true, title: d => `${d.label}\n${d.pct.toFixed(1)}% below ALICE threshold` }),
              Plot.text(bars, { x: "pct", y: "label", text: d => d.pct.toFixed(1)+"%", textAnchor: "start", dx: 5, fontSize: 11, fill: "#555" }),
              Plot.ruleX([0]),
            ]
          }));
        }
})();

// Block 22 (module)
(async function() {
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        const METRIC_LABELS = {
          renter_no_car: "Renter no-car rate (%)",
          owner_no_car: "Owner no-car rate (%)",
          no_internet: "No internet access (%)",
          labor_uninsured: "Workers uninsured (%)",
          senior_uninsured: "Seniors uninsured (%)"
        };
        document.getElementById("infra-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        let infraRows;
        try {
          infraRows = await window.loadData('infrastructure-access');
        } catch(e) {
          console.error("Infrastructure access load failed:", e);
          window.mdShowError('infra-chart');
        }
        if (infraRows && infraRows.length) {
          let activeMetric = "renter_no_car";
          function renderInfra() {
            const w = document.getElementById("infra-chart").offsetWidth || 680;
            document.getElementById("infra-chart").replaceChildren(Plot.plot({
              width: w, height: 300, marginLeft: 65, marginRight: 20, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 45, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: (() => { const vals = infraRows.map(d => d[activeMetric]).filter(v=>v!=null); const lo = Math.min(...vals), hi = Math.max(...vals); const s = 2; return { label: "↑ " + METRIC_LABELS[activeMetric], labelOffset: 55, grid: true, tickFormat: d => d.toFixed(1) + "%", domain: [Math.max(0, Math.floor((lo-s)/s)*s), Math.ceil((hi+s*0.5)/s)*s] }; })(),
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: true },
              marks: [
                Plot.line(infraRows, { x: "year", y: activeMetric, stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(infraRows, { x: "year", y: activeMetric, fill: "town", r: 5,
                  tip: true, title: d => `${d.town}\n${d.year}\n${d[activeMetric].toFixed(1)}%` }),
              ]
            }));
          }
          renderInfra();
          document.addEventListener('tabChange', renderInfra);
          document.querySelectorAll("[data-infra-metric]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-infra-metric]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeMetric = btn.dataset.infraMetric;
              renderInfra();
            });
          });
        }
})();

// Block 23 (module)
(async function() {
        const TOWN_COLORS = { Cornelius: "#3f4e75", Davidson: "#f0a500", Huntersville: "#e05c4b" };
        const MOB_LABELS = {
          edu: "Adults with bachelor's or higher (%)",
          poverty: "Poverty rate (%)",
          unemployment: "Unemployment rate (%)"
        };
        document.getElementById("mobility-chart").innerHTML = '<p style="color:#888;font-family:\'Hanken Grotesk\',sans-serif;padding:12px">Loading data…</p>';
        let mobRows;
        try {
          mobRows = await window.loadData('economic-mobility');
        } catch(e) {
          console.error("Economic mobility load failed:", e);
          window.mdShowError('mobility-chart');
        }
        if (mobRows && mobRows.length) {
          let activeMetric = "edu";
          function renderMobility() {
            const w = document.getElementById("mobility-chart").offsetWidth || 680;
            document.getElementById("mobility-chart").replaceChildren(Plot.plot({
              width: w, height: 300, marginLeft: 65, marginRight: 20, marginBottom: 50,
              style: { fontFamily: "Hanken Grotesk, sans-serif", fontSize: "13px" },
              x: { label: "Year →", labelOffset: 45, ticks: [2018,2019,2020,2021,2022,2023,2024], tickFormat: d => String(d) },
              y: (() => { const vals = mobRows.map(d => d[activeMetric]).filter(v=>v!=null); const lo = Math.min(...vals), hi = Math.max(...vals); const s = 2; return { label: "↑ " + MOB_LABELS[activeMetric], labelOffset: 55, grid: true, tickFormat: d => d.toFixed(1) + "%", domain: [Math.max(0, Math.floor((lo-s)/s)*s), Math.ceil((hi+s*0.5)/s)*s] }; })(),
              color: { domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: true },
              marks: [
                Plot.line(mobRows, { x: "year", y: activeMetric, stroke: "town", strokeWidth: 2.5 }),
                Plot.dot(mobRows, { x: "year", y: activeMetric, fill: "town", r: 5,
                  tip: true, title: d => `${d.town}\n${d.year}\n${d[activeMetric].toFixed(1)}%` }),
              ]
            }));
          }
          renderMobility();
          document.addEventListener('tabChange', renderMobility);
          document.querySelectorAll("[data-mob-metric]").forEach(btn => {
            btn.addEventListener("click", () => {
              document.querySelectorAll("[data-mob-metric]").forEach(b => b.classList.remove("on"));
              btn.classList.add("on");
              activeMetric = btn.dataset.mobMetric;
              renderMobility();
            });
          });
        }
})();
