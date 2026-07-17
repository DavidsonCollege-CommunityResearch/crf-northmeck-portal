// Education page scripts
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Block 1 (module)
(async function() {
          const TOWN_COLORS = {Cornelius:'#4e79a7',Davidson:'#f28e2b',Huntersville:'#59a14f'};
          const rawData = [
            {town:'Cornelius',year:2018,k12:5233},{town:'Cornelius',year:2019,k12:5439},{town:'Cornelius',year:2021,k12:5944},{town:'Cornelius',year:2022,k12:5581},{town:'Cornelius',year:2023,k12:5643},
            {town:'Davidson',year:2018,k12:2488},{town:'Davidson',year:2019,k12:2532},{town:'Davidson',year:2021,k12:2627},{town:'Davidson',year:2022,k12:2613},{town:'Davidson',year:2023,k12:2639},
            {town:'Huntersville',year:2018,k12:10558},{town:'Huntersville',year:2019,k12:11030},{town:'Huntersville',year:2021,k12:11979},{town:'Huntersville',year:2022,k12:11670},{town:'Huntersville',year:2023,k12:11607}
          ];
          const el = document.getElementById('chart-k12-trend');
          function render(town) {
            const data = town === 'All' ? rawData : rawData.filter(d => d.town === town);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 320,
              marginLeft: 65, marginRight: 20, marginTop: 20, marginBottom: 40,
              x: {label: 'Year', tickFormat: d => String(d)},
              y: {label: 'K–12 Enrollment', grid: true},
              color: {domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: town === 'All'},
              marks: [
                Plot.line(data, {x:'year', y:'k12', stroke:'town', strokeWidth: town === 'All' ? 2 : 3}),
                Plot.dot(data, {x:'year', y:'k12', stroke:'town', fill:'white', strokeWidth:1.5, r:4,
                  tip: true, title: d => `${d.town}\n${d.year}: ${d.k12.toLocaleString()}`})
              ]
            }));
          }
          render('All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();

// Block 2 (module)
(async function() {
          const byTown = {
            Cornelius: [{year:2018,elem14:1851,elem58:1069,hs:1927},{year:2019,elem14:1923,elem58:1229,hs:1982},{year:2021,elem14:1771,elem58:1944,hs:2010},{year:2022,elem14:1557,elem58:1764,hs:1989},{year:2023,elem14:1541,elem58:1971,hs:1906}],
            Davidson: [{year:2018,elem14:735,elem58:819,hs:642},{year:2019,elem14:761,elem58:939,hs:571},{year:2021,elem14:857,elem58:933,hs:602},{year:2022,elem14:810,elem58:847,hs:648},{year:2023,elem14:778,elem58:844,hs:819}],
            Huntersville: [{year:2018,elem14:3259,elem58:3259,hs:3326},{year:2019,elem14:3375,elem58:3606,hs:3284},{year:2021,elem14:3650,elem58:3818,hs:3604},{year:2022,elem14:3615,elem58:3761,hs:3422},{year:2023,elem14:3622,elem58:3748,hs:3580}]
          };
          const YEARS = [2018,2019,2021,2022,2023];
          const LEVEL_COLORS = {'Grades 1–4':'#aec6e8','Grades 5–8':'#6baed6','High School':'#2171b5'};
          const el = document.getElementById('chart-level-trend');
          function buildRows(town) {
            const towns = town === 'All' ? ['Cornelius','Davidson','Huntersville'] : [town];
            return YEARS.map(yr => {
              let e14=0, e58=0, h=0;
              for(const t of towns) {
                const row = byTown[t].find(r => r.year === yr);
                if(row) { e14 += row.elem14; e58 += row.elem58; h += row.hs; }
              }
              return [
                {year:yr, level:'Grades 1–4', count:e14},
                {year:yr, level:'Grades 5–8', count:e58},
                {year:yr, level:'High School', count:h}
              ];
            }).flat();
          }
          function render(town) {
            const data = buildRows(town);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 340,
              marginLeft: 65, marginRight: 20, marginTop: 20, marginBottom: 40,
              x: {label: 'Year', tickFormat: d => String(d)},
              y: {label: 'Enrollment', grid: true},
              color: {domain: Object.keys(LEVEL_COLORS), range: Object.values(LEVEL_COLORS), legend: true},
              marks: [
                Plot.areaY(data, Plot.stackY({x:'year', y:'count', fill:'level',
                  order: ['Grades 1–4','Grades 5–8','High School'], fillOpacity:0.85})),
                Plot.lineY(data, Plot.stackY({x:'year', y:'count', stroke:'level',
                  strokeWidth:1.5, order: ['Grades 1–4','Grades 5–8','High School']}))
              ]
            }));
          }
          render('All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();

// Block 3 (module)
(async function() {
          const TOWN_COLORS = {Cornelius:'#4e79a7',Davidson:'#f28e2b',Huntersville:'#59a14f'};
          const rawData = [
            {town:'Cornelius',year:2018,bach_plus:54.49},{town:'Cornelius',year:2019,bach_plus:53.53},{town:'Cornelius',year:2021,bach_plus:55.69},{town:'Cornelius',year:2022,bach_plus:58.62},{town:'Cornelius',year:2023,bach_plus:59.63},
            {town:'Davidson',year:2018,bach_plus:33.87},{town:'Davidson',year:2019,bach_plus:73.36},{town:'Davidson',year:2021,bach_plus:74.96},{town:'Davidson',year:2022,bach_plus:33.25},{town:'Davidson',year:2023,bach_plus:75.56},
            {town:'Huntersville',year:2018,bach_plus:55.84},{town:'Huntersville',year:2019,bach_plus:55.8},{town:'Huntersville',year:2021,bach_plus:55.45},{town:'Huntersville',year:2022,bach_plus:56.0}
          ];
          const el = document.getElementById('chart-bach-trend');
          function render(town) {
            const data = town === 'All' ? rawData : rawData.filter(d => d.town === town);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 320,
              marginLeft: 55, marginRight: 20, marginTop: 20, marginBottom: 40,
              x: {label: 'Year', tickFormat: d => String(d)},
              y: {label: "Bachelor's+ (%)", grid: true, domain: [20, 85]},
              color: {domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: town === 'All'},
              marks: [
                Plot.line(data, {x:'year', y:'bach_plus', stroke:'town', strokeWidth: town === 'All' ? 2 : 3}),
                Plot.dot(data, {x:'year', y:'bach_plus', stroke:'town', fill:'white', strokeWidth:1.5, r:4,
                  tip: true, title: d => `${d.town}\n${d.year}: ${d.bach_plus.toFixed(1)}%`})
              ]
            }));
          }
          render('All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();

// Block 4 (module)
(async function() {
          const breakdown = [
            {town:'Cornelius',level:'Less than HS',pct:2.75,order:0},
            {town:'Cornelius',level:'HS/GED',pct:10.31,order:1},
            {town:'Cornelius',level:'Some College',pct:19.02,order:2},
            {town:'Cornelius',level:"Associate's",pct:9.3,order:3},
            {town:'Cornelius',level:"Bachelor's",pct:39.03,order:4},
            {town:'Cornelius',level:'Graduate/Prof',pct:19.59,order:5},
            {town:'Davidson',level:'Less than HS',pct:10.52,order:0},
            {town:'Davidson',level:'HS/GED',pct:1.78,order:1},
            {town:'Davidson',level:'Some College',pct:13.44,order:2},
            {town:'Davidson',level:"Associate's",pct:41.01,order:3},
            {town:'Davidson',level:"Bachelor's",pct:21.41,order:4},
            {town:'Davidson',level:'Graduate/Prof',pct:11.84,order:5},
            {town:'Huntersville',level:'Less than HS',pct:3.24,order:0},
            {town:'Huntersville',level:'HS/GED',pct:13.84,order:1},
            {town:'Huntersville',level:'Some College',pct:17.68,order:2},
            {town:'Huntersville',level:"Associate's",pct:9.23,order:3},
            {town:'Huntersville',level:"Bachelor's",pct:36.41,order:4},
            {town:'Huntersville',level:'Graduate/Prof',pct:19.58,order:5}
          ];
          const LEVEL_COLORS = {'Less than HS':'#d73027','HS/GED':'#fc8d59','Some College':'#fee090',"Associate's":'#e0f3f8',"Bachelor's":'#74add1','Graduate/Prof':'#4575b4'};
          const LEVELS = ['Less than HS','HS/GED','Some College',"Associate's","Bachelor's",'Graduate/Prof'];
          const el = document.getElementById('chart-attainment-breakdown');
          function render(town) {
            const data = town === 'All' ? breakdown : breakdown.filter(d => d.town === town);
            const towns = [...new Set(data.map(d => d.town))];
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 60 + towns.length * 60,
              marginLeft: 110, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: 'Share (%)', tickFormat: d => d + '%', grid: true},
              y: {label: null},
              color: {domain: LEVELS, range: LEVELS.map(l => LEVEL_COLORS[l]), legend: true},
              marks: [
                Plot.barX(data, Plot.stackX({
                  x: 'pct', y: 'town', fill: 'level',
                  order: LEVELS, tip: true,
                  title: d => `${d.level}: ${d.pct.toFixed(1)}%`
                })),
                Plot.ruleX([0])
              ]
            }));
          }
          render('All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();

// Block 5 (module)
(async function() {
          const TOWN_COLORS = {Cornelius:'#4e79a7',Davidson:'#f28e2b',Huntersville:'#59a14f'};
          const LEVEL_ORDER = ['Less than HS','HS Diploma','Some College',"Bachelor's",'Graduate/Prof'];
          const earningsRaw = [
            {town:'Cornelius',level:'Less than HS',earnings:25255},
            {town:'Cornelius',level:'HS Diploma',earnings:44030},
            {town:'Cornelius',level:'Some College',earnings:59510},
            {town:'Cornelius',level:"Bachelor's",earnings:88510},
            {town:'Cornelius',level:'Graduate/Prof',earnings:111383},
            {town:'Davidson',level:'Less than HS',earnings:27750},
            {town:'Davidson',level:'Some College',earnings:46319},
            {town:'Davidson',level:"Bachelor's",earnings:135211},
            {town:'Davidson',level:'Graduate/Prof',earnings:151226},
            {town:'Huntersville',level:'Less than HS',earnings:24041},
            {town:'Huntersville',level:'HS Diploma',earnings:45963},
            {town:'Huntersville',level:'Some College',earnings:60143},
            {town:'Huntersville',level:"Bachelor's",earnings:90507},
            {town:'Huntersville',level:'Graduate/Prof',earnings:103843}
          ];
          const el = document.getElementById('chart-earnings');
          function render(town) {
            const data = town === 'All' ? earningsRaw : earningsRaw.filter(d => d.town === town);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 360,
              marginLeft: 110, marginRight: 20, marginTop: 20, marginBottom: 50,
              x: {label: 'Education Level', domain: LEVEL_ORDER},
              y: {label: 'Median Earnings', grid: true, tickFormat: d => '$' + Math.round(d/1000) + 'k'},
              color: {domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: true},
              marks: [
                Plot.dot(data, {x:'level', y:'earnings', stroke:'town', fill:'town', r:7, fillOpacity:0.85,
                  tip: true, title: d => `${d.town}\n${d.level}\n$${d.earnings.toLocaleString()}`}),
                Plot.ruleY([0], {strokeOpacity:0})
              ]
            }));
          }
          render('All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();



// Block 6 (module) - Grade level Proficiency
(async function() {
          let proficiency;
          try {
            proficiency = await window.loadData('grade-level-proficiency');
          } catch (e) {
            console.error('grade-level-proficiency load failed:', e);
            window.mdShowError('chart-grade-level-proficiency');
            return;
          }
          const el = document.getElementById('chart-grade-level-proficiency');
          function render(town) {
            const filtered = town === 'All' ? proficiency : proficiency.filter(d => d.town === town);
            const withRate = filtered.map(d => {
              if (d.glp != null) return d;
              const match = /^[<>]?\s*(\d+(\.\d+)?)/.exec(d.glp_raw || '');
              return match ? { ...d, glp: parseFloat(match[1]) } : d;
            });
            const data = withRate.filter(d => d.glp != null).sort((a, b) => b.glp - a.glp);
            const w = el.clientWidth || 750;
            el.innerHTML = '';
            el.append(Plot.plot({
              title: "Grade-Level Proficiency Across North Mecklenburg (2024-25)",
              width: w,
              height: 100 + data.length * 22,
              marginLeft: 220, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: "Grade-Level Proficiency (%)", domain: [0, 100], grid: true},
              y: {label: null, domain: data.map(d => d.school)},
              marks: [
                Plot.barX(data, {
                  x: "glp",
                  y: "school",
                  fill: "#4e79a7",
                  tip: true,
                  title: d => `${d.school} (${d.grade_span})\nGrade-Level Proficient: ${d.glp}%\nCollege/Career Ready: ${d.ccr}%`
                }),
                Plot.ruleX([0])
              ]
            }));
          }

          let activeGlpTown = window.__masterTown || 'All';
          render(activeGlpTown);

          document.querySelectorAll('[data-glp-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-glp-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeGlpTown = btn.dataset.glpTown;
              render(activeGlpTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeGlpTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-glp-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.glpTown === activeGlpTown));
            render(activeGlpTown);
          });
})();


// Block 7 (module) - School Academic Growth
(async function() {
          let growth;
          try {
            growth = await window.loadData('school-academic-growth');
          } catch (e) {
            console.error('school-academic-growth load failed:', e);
            window.mdShowError('chart-school-academic-growth');
            return;
          }
          const el = document.getElementById('chart-school-academic-growth');
          function render(town) {
            const filtered = town === 'All' ? growth : growth.filter(d => d.town === town);
            const data = filtered.slice().sort((a, b) => b.index_score - a.index_score);
            const w = el.clientWidth || 750;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w,
              height: 100 + data.length * 22,
              marginLeft: 220, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: "Growth Index Score (0 = met expected growth)", domain: [-8, 8], grid: true},
              y: {label: null, domain: data.map(d => d.school)},
              color: {
                legend: true,
                domain: ["Exceeded", "Met", "Not Met"],
                range: ["#2ca02c", "#ff7f0e", "#d62728"]
              },
              marks: [
                Plot.barX(data, {
                  x: "index_score",
                  y: "school",
                  fill: "status",
                  tip: true,
                  title: d => `${d.school} (${d.grade_span})\nStatus: ${d.status}\nGrowth Index: ${d.index_score}`
                }),
                Plot.ruleX([0])
              ]
            }));
          }

          let activeGrowthTown = window.__masterTown || 'All';
          render(activeGrowthTown);

          document.querySelectorAll('[data-growth-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-growth-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeGrowthTown = btn.dataset.growthTown;
              render(activeGrowthTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeGrowthTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-growth-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.growthTown === activeGrowthTown));
            render(activeGrowthTown);
          });
})();


// Block 8 (module)
(async function() {
          let graduation;
          try {
            graduation = await window.loadData('four-year-school-graduation');
          } catch (e) {
            console.error('four-year-school-graduation load failed:', e);
            window.mdShowError('chart-four-year-graduation-rate');
            return;
          }
          const el = document.getElementById('chart-four-year-graduation-rate');
          function render(town) {
            const filtered = town === 'All' ? graduation : graduation.filter(d => d.town === town);
            const withRate = filtered.map(d => {
              if (d.grad_4yr != null) return d;
              const match = /^[<>]?\s*(\d+(\.\d+)?)/.exec(d.grad_4yr_raw || '');
              return match ? { ...d, grad_4yr: parseFloat(match[1]) } : d;
            });
            const data = withRate.filter(d => d.grad_4yr != null).sort((a, b) => b.grad_4yr - a.grad_4yr);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              title: "Four-Year Graduation Rate: North Meck High Schools (2024-25)",
              width: w,
              height: 100 + data.length * 22,
              marginLeft: 220, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: "Four-Year Cohort Graduation Rate (%)", domain: [0, 100], grid: true},
              y: {label: null, domain: data.map(d => d.school)},
              color: {
                legend: true,
                domain: ["90%+", "80–90%", "Below 80%"],
                range: ["#2ca02c", "#ff7f0e", "#d62728"]
              },
              marks: [
                Plot.barX(data, {
                  x: "grad_4yr",
                  y: "school",
                  fill: d => d.grad_4yr >= 90 ? "90%+" : d.grad_4yr >= 80 ? "80–90%" : "Below 80%",
                  tip: true,
                  title: d => `${d.school}\n4-Year Grad Rate: ${d.grad_4yr_raw}`
                }),
                Plot.ruleX([0])
              ]
            }));
          }

          let activeGradTown = window.__masterTown || 'All';
          render(activeGradTown);

          document.querySelectorAll('[data-grad-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-grad-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeGradTown = btn.dataset.gradTown;
              render(activeGradTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeGradTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-grad-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.gradTown === activeGradTown));
            render(activeGradTown);
          });
})();


// Block 9 (module) - School Achievement and Economic Gap
(async function() {
          let econGap;
          try {
            econGap = await window.loadData('school-achievement-and-economic-gap');
          } catch (e) {
            console.error('school-achievement-and-economic-gap load failed:', e);
            window.mdShowError('chart-school-achievement-economic-gap');
            return;
          }
          const el = document.getElementById('chart-school-achievement-economic-gap');
          function render(town) {
            const filtered = town === 'All' ? econGap : econGap.filter(d => d.town === town);
            const data = filtered.slice().sort((a, b) => b.gap - a.gap);
            const w = el.clientWidth || 750;
            el.innerHTML = '';
            el.append(Plot.plot({
              subtitle: "Grade-level proficiency: economically disadvantaged vs. non-disadvantaged students",
              width: w,
              height: 100 + data.length * 22,
              marginLeft: 220, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: "Grade-Level Proficient (%)", domain: [0, 100], grid: true},
              y: {label: null, domain: data.map(d => d.school)},
              color: {
                legend: true,
                domain: ["Economically Disadvantaged", "Not Economically Disadvantaged"],
                range: ["#d62728", "#4e79a7"]
              },
              marks: [
                Plot.link(data, {
                  x1: "econ_disadv",
                  x2: "not_disadv",
                  y: "school",
                  stroke: "#cccccc",
                  strokeWidth: 2
                }),
                Plot.dot(data, {
                  x: "econ_disadv",
                  y: "school",
                  fill: "#d62728",
                  r: 5,
                  tip: true,
                  title: d => `${d.school}\nEconomically Disadvantaged: ${d.econ_disadv}%\nNot Disadvantaged: ${d.not_disadv}%\nGap: ${d.gap} points`
                }),
                Plot.dot(data, {
                  x: "not_disadv",
                  y: "school",
                  fill: "#4e79a7",
                  r: 5
                })
              ]
            }));
          }

          let activeEconGapTown = window.__masterTown || 'All';
          render(activeEconGapTown);

          document.querySelectorAll('[data-econgap-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-econgap-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeEconGapTown = btn.dataset.econgapTown;
              render(activeEconGapTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeEconGapTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-econgap-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.econgapTown === activeEconGapTown));
            render(activeEconGapTown);
          });
})();


// Block 10 (module) - High School College and Career Readiness (Uses the grade-level-proficiency dataset)
(async function() {
          let proficiencyHS;
          try {
            proficiencyHS = await window.loadData('grade-level-proficiency');
          } catch (e) {
            console.error('grade-level-proficiency (HS CCR) load failed:', e);
            window.mdShowError('chart-hs-ccr');
            return;
          }
          const HS_SPANS = ['09-12', '09-11', '11-13', '0K-12'];
          const el = document.getElementById('chart-hs-ccr');
          function render(town) {
            const byTown = town === 'All' ? proficiencyHS : proficiencyHS.filter(d => d.town === town);
            const withRate = byTown.map(d => {
              if (d.glp != null) return d;
              const match = /^[<>]?\s*(\d+(\.\d+)?)/.exec(d.glp_raw || '');
              return match ? { ...d, glp: parseFloat(match[1]) } : d;
            });
            const data = withRate
              .filter(d => HS_SPANS.includes(d.grade_span))
              .filter(d => d.ccr != null)
              .sort((a, b) => b.ccr - a.ccr);
            const long = data.flatMap(d => [
              {school: d.school, metric: "Grade-Level Proficient", value: d.glp},
              {school: d.school, metric: "College/Career Ready", value: d.ccr}
            ]).filter(d => d.value != null);
            const w = el.clientWidth || 750;
            el.innerHTML = '';
            el.append(Plot.plot({
              title: "High School College & Career Readiness: North Meck (2024-25)",
              subtitle: "Grades 9–12 only",
              width: w,
              height: 60 + data.length * 46,
              marginLeft: 220, marginRight: 20, marginTop: 40, marginBottom: 40,
              x: {label: "Percent of students (%)", domain: [0, 100], grid: true},
              y: {axis: null, domain: ["Grade-Level Proficient", "College/Career Ready"]},
              fy: {label: null, domain: data.map(d => d.school)},
              color: {
                legend: true,
                domain: ["Grade-Level Proficient", "College/Career Ready"],
                range: ["#a0cbe8", "#4e79a7"]
              },
              marks: [
                Plot.barX(long, {
                  x: "value",
                  y: "metric",
                  fy: "school",
                  fill: "metric",
                  tip: true,
                  title: d => `${d.school}\n${d.metric}: ${d.value}%`
                }),
                Plot.ruleX([0])
              ]
            }));
          }

          let activeCcrTown = window.__masterTown || 'All';
          render(activeCcrTown);

          document.querySelectorAll('[data-ccr-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-ccr-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeCcrTown = btn.dataset.ccrTown;
              render(activeCcrTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeCcrTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-ccr-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.ccrTown === activeCcrTown));
            render(activeCcrTown);
          });
})();


// Block 11 (module) - Highschool Achievement gap by Economic status
(async function() {
          let hsEconGap;
          try {
            hsEconGap = await window.loadData('highschool-achievement-economic-gap');
          } catch (e) {
            console.error('highschool-achievement-economic-gap load failed:', e);
            window.mdShowError('chart-hs-achievement-economic-gap');
            return;
          }
          const el = document.getElementById('chart-hs-achievement-economic-gap');
          function render(town) {
            const filtered = town === 'All' ? hsEconGap : hsEconGap.filter(d => d.town === town);
            const data = filtered
              .filter(d => d.econ_disadv != null && d.not_disadv != null && d.gap != null)
              .sort((a, b) => b.gap - a.gap);
            const w = el.clientWidth || 750;
            el.innerHTML = '';
            el.append(Plot.plot({
              title: "Economic Achievement Gap in North Meck High Schools (2024-25)",
              subtitle: "Grades 9–12 grade-level proficiency: economically disadvantaged vs. not",
              width: w,
              height: 100 + data.length * 22,
              marginLeft: 200, marginRight: 20, marginTop: 30, marginBottom: 40,
              x: {label: "Grade-Level Proficient (%)", domain: [0, 100], grid: true},
              y: {label: null, domain: data.map(d => d.school)},
              color: {
                legend: true,
                domain: ["Economically Disadvantaged", "Not Economically Disadvantaged"],
                range: ["#d62728", "#4e79a7"]
              },
              marks: [
                Plot.link(data, {
                  x1: "econ_disadv", x2: "not_disadv", y: "school",
                  stroke: "#cccccc", strokeWidth: 2
                }),
                Plot.dot(data, {
                  x: "econ_disadv", y: "school", fill: "#d62728", r: 5, tip: true,
                  title: d => `${d.school}\nEconomically Disadvantaged: ${d.econ_disadv}%\nNot Disadvantaged: ${d.not_disadv}%\nGap: ${d.gap} points`
                }),
                Plot.dot(data, {
                  x: "not_disadv", y: "school", fill: "#4e79a7", r: 5
                })
              ]
            }));
          }

          let activeHsGapTown = window.__masterTown || 'All';
          render(activeHsGapTown);

          document.querySelectorAll('[data-hsgap-town]').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('[data-hsgap-town]').forEach(b => b.classList.remove('on'));
              btn.classList.add('on');
              activeHsGapTown = btn.dataset.hsgapTown;
              render(activeHsGapTown);
            });
          });

          document.addEventListener('masterTownChange', ({ detail: { town } }) => {
            activeHsGapTown = town === 'All' ? 'All' : town;
            document.querySelectorAll('[data-hsgap-town]').forEach(b =>
              b.classList.toggle('on', b.dataset.hsgapTown === activeHsGapTown));
            render(activeHsGapTown);
          });
})();


// Block 12 (module) - Population Growth vs K-12 Enrollment
(async function() {
          let enrollment;
          try {
            enrollment = await window.loadData('pop-growth-k12-enrollment');
          } catch (e) {
            console.error('pop-growth-k12-enrollment load failed:', e);
            window.mdShowError('chart-pop-vs-k12');
            return;
          }
          const el = document.getElementById('chart-pop-vs-k12');
          const ALL_TOWNS = ["Cornelius", "Davidson", "Huntersville"];
          function render(town) {
            const towns = (!town || town === 'All') ? ALL_TOWNS : [town];
            const enrollIndex = towns.flatMap(t => {
              const rows = enrollment.filter(d => d.town === t).sort((a, b) => a.year - b.year);
              if (!rows.length) return [];
              const base = rows[0];
              return rows.flatMap(d => [
                {town: t, year: d.year, series: "Total population (3+)",
                 index: (d.total_pop_3_plus / base.total_pop_3_plus) * 100, raw: d.total_pop_3_plus},
                {town: t, year: d.year, series: "K-12 enrollment",
                 index: (d.n_enrolled_k12_total / base.n_enrolled_k12_total) * 100, raw: d.n_enrolled_k12_total}
              ]);
            });
            const w = el.clientWidth || 760;
            el.innerHTML = '';
            el.append(Plot.plot({
              subtitle: "Indexed to 2018 = 100. K-12 student counts rose only 3–6% while town populations grew 14–26%.",
              caption: "Source: U.S. Census Bureau, ACS 5-Year Estimates, Tables B01003 and B14007. Population shown is age 3+, the universe for the ACS school enrollment question.",
              width: w,
              height: 300,
              marginRight: 20,
              x: {label: "Year", tickFormat: "d", ticks: [2018, 2020, 2022, 2024]},
              fx: {label: null},
              y: {label: "Index (2018 = 100)", domain: [95, 130], grid: true},
              color: {legend: true, domain: ["Total population (3+)", "K-12 enrollment"], range: ["#b5495b", "#3b6ea5"], label: null},
              facet: {data: enrollIndex, x: "town"},
              marks: [
                Plot.ruleY([100], {stroke: "#ccc", strokeDasharray: "3,3"}),
                Plot.line(enrollIndex, {x: "year", y: "index", stroke: "series", strokeWidth: 2.5}),
                Plot.dot(enrollIndex, {x: "year", y: "index", fill: "series", r: 3}),
                Plot.tip(enrollIndex, Plot.pointer({
                  x: "year", y: "index", stroke: "series",
                  title: d => `${d.town}, ${d.year}\n${d.series}\n${d.raw.toLocaleString()} (${d.index.toFixed(1)} vs 2018)`
                }))
              ]
            }));
          }
          render(window.__masterTown || 'All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();


// Block 13 (module) - Total Enrollment Trend by Town
(async function() {
          let enrollment;
          try {
            enrollment = await window.loadData('pop-growth-k12-enrollment');
          } catch (e) {
            console.error('pop-growth-k12-enrollment (total enrollment trend) load failed:', e);
            window.mdShowError('chart-total-enrollment-trend');
            return;
          }
          const TOWN_COLORS = {Cornelius: "#4e79a7", Davidson: "#f28e2b", Huntersville: "#59a14f"};
          const el = document.getElementById('chart-total-enrollment-trend');
          const allValues = enrollment.map(d => d.n_enrolled_total);
          const yMin = Math.floor(Math.min(...allValues) / 1000) * 1000;
          const yMax = Math.ceil(Math.max(...allValues) / 1000) * 1000;
          function render(town) {
            const data = (town === 'All' ? enrollment : enrollment.filter(d => d.town === town))
              .slice().sort((a, b) => a.year - b.year);
            const w = el.clientWidth || 700;
            el.innerHTML = '';
            el.append(Plot.plot({
              width: w, height: 340,
              marginLeft: 65, marginRight: 20, marginTop: 20, marginBottom: 40,
              x: {label: "Year", tickFormat: d => String(d), insetLeft: 12, insetRight: 12},
              y: {label: "Total Enrollment", grid: true, interval: 1000, domain: [yMin, yMax]},
              color: {domain: Object.keys(TOWN_COLORS), range: Object.values(TOWN_COLORS), legend: town === 'All'},
              marks: [
                Plot.line(data, {x: "year", y: "n_enrolled_total", stroke: "town", strokeWidth: town === 'All' ? 2 : 3}),
                Plot.dot(data, {x: "year", y: "n_enrolled_total", stroke: "town", fill: "white", strokeWidth: 1.5, r: 4,
                  tip: true, title: d => `${d.town}\n${d.year}: ${d.n_enrolled_total.toLocaleString()} enrolled`})
              ]
            }));
          }
          render(window.__masterTown || 'All');
          document.addEventListener('masterTownChange', e => render(e.detail.town));
})();
