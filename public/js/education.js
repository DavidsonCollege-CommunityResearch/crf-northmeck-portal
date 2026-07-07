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
