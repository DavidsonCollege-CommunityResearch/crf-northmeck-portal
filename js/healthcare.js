// Healthcare page scripts
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { MDConnection } from "https://cdn.jsdelivr.net/npm/@motherduck/wasm-client@1.5.4-r.1/+esm";

// Block 1 (plain)
(function() {
    (function(){
      // ── Shared style tokens ──────────────────────────────────────────
      var INS_BLUE   = '#2E86AB';
      var INS_AMBER  = '#E8A838';
      var INS_TEXT   = '#444';
      var INS_LABEL  = '#555';
      var INS_FONT   = "500 12px 'Hanken Grotesk', sans-serif";

      // ── Helper: clear a container and return it ──────────────────────
      function clear(id){ var el = document.getElementById(id); if(el) el.innerHTML=''; return el; }

      // ── Shared floating tooltip ───────────────────────────────────────
      var TT = document.createElement('div');
      TT.style.cssText = 'position:fixed;pointer-events:none;background:#1a1a2e;color:#fff;font:500 12px Hanken Grotesk,sans-serif;padding:7px 11px;border-radius:7px;box-shadow:0 4px 16px rgba(0,0,0,.22);white-space:nowrap;opacity:0;transition:opacity .12s;z-index:9999';
      document.body.appendChild(TT);
      function ttShow(html, e){ TT.innerHTML=html; TT.style.opacity='1'; ttMove(e); }
      function ttMove(e){ TT.style.left=(e.clientX+14)+'px'; TT.style.top=(e.clientY-36)+'px'; }
      function ttHide(){ TT.style.opacity='0'; }

      // ── 1. HEATMAP — always all towns, filtered to activeYear ────────
      function renderHeatmap(data, year){
        var el = clear('hc-ins-heatmap'); if(!el) return;
        var rows = data.filter(function(d){ return d.year === year; });
        if(!rows.length) return;

        var types = [
          { key:'emp_based_ins', label:'Employer-based' },
          { key:'dir_purchase_ins', label:'Direct-purchase' },
          { key:'medicare_cov', label:'Medicare' },
          { key:'medicaid_cov', label:'Medicaid' },
          { key:'tricare_cov', label:'Tricare' },
          { key:'VA_cov', label:'VA' },
          { key:'other_cov_type', label:'Other' },
          { key:'all_unins', label:'Uninsured' }
        ];
        var towns = ['Cornelius','Davidson','Huntersville'];

        var cellW = 95, cellH = 54, padX = 14, labelLeft = 110, top = 48, legendH = 32;
        var W = labelLeft + types.length * (cellW + padX);
        var H = top + towns.length * (cellH + padX) + legendH + 10;

        var colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 65]);

        var svg = d3.select(el).append('svg')
          .attr('width', '100%').attr('height', H).attr('viewBox', '0 0 '+W+' '+H)
          .attr('style','font-family:Hanken Grotesk,sans-serif');

        // column headers
        types.forEach(function(t, i){
          svg.append('text')
            .attr('x', labelLeft + i*(cellW+padX) + cellW/2)
            .attr('y', top - 8)
            .attr('text-anchor','middle')
            .attr('font-size', 11).attr('fill', '#1B4F72').attr('font-weight','600')
            .text(t.label);
        });

        rows.forEach(function(d, ri){
          // row label
          svg.append('text')
            .attr('x', labelLeft - 8).attr('y', top + ri*(cellH+padX) + cellH/2 + 4)
            .attr('text-anchor','end').attr('font-size', 12).attr('fill', INS_TEXT)
            .text(d.Town);

          types.forEach(function(t, ci){
            var val = (d[t.key] / d.Tot_pop) * 100;
            var x = labelLeft + ci*(cellW+padX), y = top + ri*(cellH+padX);
            svg.append('rect').attr('x',x).attr('y',y)
              .attr('width',cellW).attr('height',cellH).attr('rx',6)
              .attr('fill', colorScale(val));
            svg.append('text').attr('x',x+cellW/2).attr('y',y+cellH/2+4)
              .attr('text-anchor','middle').attr('font-size',12).attr('font-weight','600')
              .attr('fill', val > 35 ? '#fff' : '#1B4F72')
              .text(val.toFixed(1)+'%');
          });
        });

        // gradient legend
        var lgX = labelLeft, lgY = H - legendH + 4, lgW = 180;
        var defs = svg.append('defs');
        var grad = defs.append('linearGradient').attr('id','hc-hm-grad').attr('x1','0%').attr('x2','100%');
        d3.range(0,1.01,0.1).forEach(function(s){
          grad.append('stop').attr('offset',s*100+'%').attr('stop-color', colorScale(s*65));
        });
        svg.append('rect').attr('x',lgX).attr('y',lgY).attr('width',lgW).attr('height',10).attr('rx',4).attr('fill','url(#hc-hm-grad)');
        svg.append('text').attr('x',lgX-4).attr('y',lgY+8).attr('text-anchor','end').attr('font-size',10).attr('fill',INS_LABEL).text('Low %');
        svg.append('text').attr('x',lgX+lgW+4).attr('y',lgY+8).attr('font-size',10).attr('fill',INS_LABEL).text('High %');
      }

      // ── 2. INCOME chart — side-by-side bars per bracket ─────────────
      function renderIncome(rows){
        var el = clear('hc-ins-income'); if(!el||!rows.length) return;
        var d = rows[0];
        var brackets = [
          { label:'Under $25k', ins:(d.ins_U25/(d.ins_U25+d.no_ins_U25))*100, unins:(d.no_ins_U25/(d.ins_U25+d.no_ins_U25))*100 },
          { label:'$25k–$50k',  ins:(d.ins_25_50/(d.ins_25_50+d.no_ins_25_50))*100, unins:(d.no_ins_25_50/(d.ins_25_50+d.no_ins_25_50))*100 },
          { label:'$50k–$75k',  ins:(d.ins_50_75/(d.ins_50_75+d.no_ins_50_75))*100, unins:(d.no_ins_50_75/(d.ins_50_75+d.no_ins_50_75))*100 },
          { label:'$75k–$100k', ins:(d.ins_75_100/(d.ins_75_100+d.no_ins_75_100))*100, unins:(d.no_ins_75_100/(d.ins_75_100+d.no_ins_75_100))*100 },
          { label:'Above $100k',ins:(d.ins_100_above/(d.ins_100_above+d.no_ins_100_above))*100, unins:(d.no_ins_100_above/(d.ins_100_above+d.no_ins_100_above))*100 }
        ];
        var mL=105, mR=16, mT=16, mB=52, bH=18, gap=10, subGap=3;
        var W=440, rowH=bH*2+subGap+gap;
        var H=mT+brackets.length*rowH+mB;
        var xScale=d3.scaleLinear().domain([0,100]).range([0,W-mL-mR]);
        var colorScale=d3.scaleOrdinal().domain(['Insured','Uninsured']).range([INS_BLUE,INS_AMBER]);
        var svg=d3.select(el).append('svg').attr('width','100%').attr('height',H).attr('viewBox','0 0 '+W+' '+H).attr('style','font-family:Hanken Grotesk,sans-serif');
        var g=svg.append('g').attr('transform','translate('+mL+','+mT+')');
        brackets.forEach(function(b,i){
          var y0=i*rowH;
          g.append('text').attr('x',-6).attr('y',y0+bH*1+subGap/2).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-size',11).attr('fill',INS_TEXT).text(b.label);
          [['Insured',b.ins],['Uninsured',b.unins]].forEach(function(pair,j){
            var ry=y0+j*(bH+subGap);
            g.append('rect').attr('x',0).attr('y',ry).attr('width',xScale(pair[1])).attr('height',bH).attr('fill',colorScale(pair[0])).attr('rx',2)
              .on('mouseover',function(e){ ttShow('<b>'+b.label+'</b> · '+pair[0]+': <b>'+pair[1].toFixed(1)+'%</b>',e); })
              .on('mousemove',ttMove).on('mouseout',ttHide);
            if(pair[1]>4) g.append('text').attr('x',xScale(pair[1])+3).attr('y',ry+bH/2).attr('dominant-baseline','middle').attr('font-size',10).attr('fill',INS_LABEL).text(pair[1].toFixed(1)+'%');
          });
        });
        // x axis
        var axG=g.append('g').attr('transform','translate(0,'+brackets.length*rowH+')');
        axG.call(d3.axisBottom(xScale).ticks(5).tickFormat(function(d){return d+'%'}));
        axG.select('.domain').attr('stroke','#ccc');
        axG.selectAll('line').attr('stroke','#ccc');
        axG.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);
        // legend
        var lgY=brackets.length*rowH+36;
        ['Insured','Uninsured'].forEach(function(k,i){ g.append('rect').attr('x',i*90).attr('y',lgY).attr('width',10).attr('height',10).attr('fill',colorScale(k)); g.append('text').attr('x',i*90+13).attr('y',lgY+8).attr('font-size',10).attr('fill',INS_LABEL).text(k); });
      }

      // ── 3. AGE chart — side-by-side bars (same format as income) ────────
      function renderAge(rows){
        var el = clear('hc-ins-age'); if(!el||!rows.length) return;
        var d = rows[0];
        var groups = [
          { label:'Under 19', ins:(d.ins_U18/(d.ins_U18+d.unins_U18))*100, unins:(d.unins_U18/(d.ins_U18+d.unins_U18))*100 },
          { label:'19–25',    ins:(d.ins_19_25/(d.ins_19_25+d.unins_19_25))*100, unins:(d.unins_19_25/(d.ins_19_25+d.unins_19_25))*100 },
          { label:'26–34',    ins:(d.ins_26_34/(d.ins_26_34+d.unins_26_34))*100, unins:(d.unins_26_34/(d.ins_26_34+d.unins_26_34))*100 },
          { label:'35–64',    ins:(d.ins_35_64/(d.ins_35_64+d.unins_35_64))*100, unins:(d.unins_35_64/(d.ins_35_64+d.unins_35_64))*100 },
          { label:'65+',      ins:(d.ins_65_over/(d.ins_65_over+d.unins_65_over))*100, unins:(d.unins_65_over/(d.ins_65_over+d.unins_65_over))*100 }
        ];
        var mL=70, mR=16, mT=16, mB=52, bH=18, gap=10, subGap=3;
        var W=440, rowH=bH*2+subGap+gap;
        var H=mT+groups.length*rowH+mB;
        var xScale=d3.scaleLinear().domain([0,100]).range([0,W-mL-mR]);
        var colorScale=d3.scaleOrdinal().domain(['Insured','Uninsured']).range([INS_BLUE,INS_AMBER]);
        var svg=d3.select(el).append('svg').attr('width','100%').attr('height',H).attr('viewBox','0 0 '+W+' '+H).attr('style','font-family:Hanken Grotesk,sans-serif');
        var g=svg.append('g').attr('transform','translate('+mL+','+mT+')');
        groups.forEach(function(b,i){
          var y0=i*rowH;
          g.append('text').attr('x',-6).attr('y',y0+bH+subGap/2).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-size',11).attr('fill',INS_TEXT).text(b.label);
          [['Insured',b.ins],['Uninsured',b.unins]].forEach(function(pair,j){
            var ry=y0+j*(bH+subGap);
            g.append('rect').attr('x',0).attr('y',ry).attr('width',xScale(pair[1])).attr('height',bH).attr('fill',colorScale(pair[0])).attr('rx',2)
              .on('mouseover',function(e){ ttShow('<b>'+b.label+'</b> · '+pair[0]+': <b>'+pair[1].toFixed(1)+'%</b>',e); })
              .on('mousemove',ttMove).on('mouseout',ttHide);
            if(pair[1]>4) g.append('text').attr('x',xScale(pair[1])+3).attr('y',ry+bH/2).attr('dominant-baseline','middle').attr('font-size',10).attr('fill',INS_LABEL).text(pair[1].toFixed(1)+'%');
          });
        });
        var axG=g.append('g').attr('transform','translate(0,'+groups.length*rowH+')');
        axG.call(d3.axisBottom(xScale).ticks(5).tickFormat(function(d){return d+'%'}));
        axG.select('.domain').attr('stroke','#ccc'); axG.selectAll('line').attr('stroke','#ccc'); axG.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);
        var lgY=groups.length*rowH+36;
        ['Insured','Uninsured'].forEach(function(k,i){ g.append('rect').attr('x',i*90).attr('y',lgY).attr('width',10).attr('height',10).attr('fill',colorScale(k)); g.append('text').attr('x',i*90+13).attr('y',lgY+8).attr('font-size',10).attr('fill',INS_LABEL).text(k); });
      }

      // ── 4. TREND chart — line chart over years ───────────────────────
      function renderTrend(rows){
        var el = clear('hc-ins-trend'); if(!el||!rows.length) return;
        rows = rows.slice().sort(function(a,b){return a.year-b.year;});
        var trendData = rows.map(function(d){
          var tot = d.all_ins + d.all_unins || 1;
          return { year:d.year, Insured:(d.all_ins/tot)*100, Uninsured:(d.all_unins/tot)*100 };
        });
        var mL=52, mR=20, mT=16, mB=52, W=440, H=260;
        var xScale=d3.scalePoint().domain(trendData.map(function(d){return d.year;})).range([0,W-mL-mR]).padding(0.4);
        var yScale=d3.scaleLinear().domain([0,100]).range([H-mT-mB,0]);
        var colorScale=d3.scaleOrdinal().domain(['Insured','Uninsured']).range([INS_BLUE,INS_AMBER]);
        var svg=d3.select(el).append('svg').attr('width','100%').attr('height',H).attr('viewBox','0 0 '+W+' '+H).attr('style','font-family:Hanken Grotesk,sans-serif');
        var g=svg.append('g').attr('transform','translate('+mL+','+mT+')');
        var lineH=H-mT-mB;
        ['Insured','Uninsured'].forEach(function(key){
          var line=d3.line().x(function(d){return xScale(d.year);}).y(function(d){return yScale(d[key]);});
          g.append('path').datum(trendData).attr('fill','none').attr('stroke',colorScale(key)).attr('stroke-width',2.5).attr('d',line);
          g.selectAll('.dot-'+key).data(trendData).join('circle').attr('class','dot-'+key)
            .attr('cx',function(d){return xScale(d.year);}).attr('cy',function(d){return yScale(d[key]);}).attr('r',5).attr('fill',colorScale(key))
            .on('mouseover',function(e,d){ ttShow('<b>'+d.year+'</b> · '+key+': <b>'+d[key].toFixed(1)+'%</b>',e); })
            .on('mousemove',ttMove).on('mouseout',ttHide);
        });
        var axX=g.append('g').attr('transform','translate(0,'+lineH+')');
        axX.call(d3.axisBottom(xScale)); axX.select('.domain').attr('stroke','#ccc'); axX.selectAll('line').attr('stroke','#ccc'); axX.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);
        var axY=g.append('g');
        axY.call(d3.axisLeft(yScale).ticks(5).tickFormat(function(d){return d+'%'})); axY.select('.domain').attr('stroke','#ccc'); axY.selectAll('line').attr('stroke','#ccc'); axY.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);
        var lgY=lineH+38;
        ['Insured','Uninsured'].forEach(function(k,i){ g.append('rect').attr('x',i*90).attr('y',lgY).attr('width',10).attr('height',10).attr('fill',colorScale(k)); g.append('text').attr('x',i*90+13).attr('y',lgY+8).attr('font-size',10).attr('fill',INS_LABEL).text(k); });
      }

      // ── 5. EMPLOYMENT chart — stacked vertical bars ──────────────────
      function renderEmp(rows){
        var el = clear('hc-ins-emp'); if(!el||!rows.length) return;
        var d = rows[0];
        var cats = [
          { label:'Employed',   ins:(d.emp_insured/(d.emp_insured+d.emp_uninsured))*100, unins:(d.emp_uninsured/(d.emp_insured+d.emp_uninsured))*100 },
          { label:'Unemployed', ins:(d.unemp_insured/(d.unemp_insured+d.unemp_uninsured))*100, unins:(d.unemp_uninsured/(d.unemp_insured+d.unemp_uninsured))*100 }
        ];
        var mL=48, mR=20, mT=16, mB=52, bW=80, bGap=60, W=320, H=260;
        var innerH=H-mT-mB;
        var yScale=d3.scaleLinear().domain([0,100]).range([innerH,0]);
        var colorScale=d3.scaleOrdinal().domain(['Insured','Uninsured']).range([INS_BLUE,INS_AMBER]);
        var svg=d3.select(el).append('svg').attr('width','100%').attr('height',H).attr('viewBox','0 0 '+W+' '+H).attr('style','font-family:Hanken Grotesk,sans-serif');
        var g=svg.append('g').attr('transform','translate('+mL+','+mT+')');
        cats.forEach(function(c,i){
          var x=i*(bW+bGap);
          var stack=[['Insured',c.ins],['Uninsured',c.unins]];
          var y0=innerH;
          stack.forEach(function(pair){
            var h=innerH-yScale(pair[1]);
            y0-=h;
            g.append('rect').attr('x',x).attr('y',y0).attr('width',bW).attr('height',h).attr('fill',colorScale(pair[0])).attr('rx',2)
              .on('mouseover',function(e){ ttShow('<b>'+c.label+'</b> · '+pair[0]+': <b>'+pair[1].toFixed(1)+'%</b>',e); })
              .on('mousemove',ttMove).on('mouseout',ttHide);
            if(pair[1]>3) g.append('text').attr('x',x+bW/2).attr('y',y0+h/2).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',11).attr('fill','#fff').text(pair[1].toFixed(1)+'%');
          });
          g.append('text').attr('x',x+bW/2).attr('y',innerH+14).attr('text-anchor','middle').attr('font-size',11).attr('fill',INS_TEXT).text(c.label);
        });
        var axY=g.append('g');
        axY.call(d3.axisLeft(yScale).ticks(5).tickFormat(function(d){return d+'%'})); axY.select('.domain').attr('stroke','#ccc'); axY.selectAll('line').attr('stroke','#ccc'); axY.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);
        var lgY=innerH+36;
        ['Insured','Uninsured'].forEach(function(k,i){ g.append('rect').attr('x',i*90).attr('y',lgY).attr('width',10).attr('height',10).attr('fill',colorScale(k)); g.append('text').attr('x',i*90+13).attr('y',lgY+8).attr('font-size',10).attr('fill',INS_LABEL).text(k); });
      }

      // ── 6. DOT CHART — 10×10 waffle per town ────────────────────────
      function renderDotChart(allRows){
        var el = clear('hc-ins-dot'); if(!el) return;
        var yr = allRows.filter(function(d){ return d.year === 2024; });
        var towns = ['Cornelius','Davidson','Huntersville'];
        var TOWN_COLORS_DOT = { Cornelius:'#3f4e75', Davidson:'#f0a500', Huntersville:'#e05c4b' };
        var townData = towns.map(function(t){
          var d = yr.find(function(r){ return r.Town === t; });
          if(!d) return null;
          var tot = d.all_ins + d.all_unins || 1;
          return { town:t, uninsuredCount: Math.round((d.all_unins/tot)*100), pct:(d.all_unins/tot*100).toFixed(1) };
        }).filter(Boolean);

        var cols=10, dotR=8, dotS=20, gridW=cols*dotS;
        var perW = gridW + 48, totalW = towns.length * perW + 20;
        var H = 16 + 10*dotS + 44;

        var svg = d3.select(el).append('svg')
          .attr('width','100%').attr('height',H)
          .attr('viewBox','0 0 '+totalW+' '+H)
          .attr('style','font-family:Hanken Grotesk,sans-serif');

        townData.forEach(function(td, ti){
          var xOff = ti * perW + 24;
          svg.append('text').attr('x', xOff+gridW/2).attr('y',12)
            .attr('text-anchor','middle').attr('font-size',13).attr('font-weight','600')
            .attr('fill', TOWN_COLORS_DOT[td.town]).text(td.town);
          svg.append('text').attr('x', xOff+gridW/2).attr('y',24)
            .attr('text-anchor','middle').attr('font-size',10).attr('fill','#888')
            .text(td.uninsuredCount+' of 100 uninsured');

          for(var i=0;i<100;i++){
            var col=i%cols, row=Math.floor(i/cols);
            var isUnins = i >= (100-td.uninsuredCount);
            var circ = svg.append('circle')
              .attr('cx', xOff + col*dotS + dotR)
              .attr('cy', 30 + row*dotS + dotR)
              .attr('r', dotR-1)
              .attr('fill', isUnins ? INS_AMBER : INS_BLUE);
            (function(iU, town, pct){ circ
              .on('mouseover', function(e){ ttShow('<b>'+town+'</b> · '+(iU?'Uninsured':'Insured')+(iU?' · '+pct+'% uninsured':''),e); })
              .on('mousemove',ttMove).on('mouseout',ttHide);
            })(isUnins, td.town, td.pct);
          }
        });

        var lgX = totalW/2 - 85, lgY = H - 12;
        ['Insured','Uninsured'].forEach(function(k,i){
          svg.append('circle').attr('cx',lgX+i*100+6).attr('cy',lgY).attr('r',6).attr('fill',i?INS_AMBER:INS_BLUE);
          svg.append('text').attr('x',lgX+i*100+16).attr('y',lgY+4).attr('font-size',11).attr('fill',INS_TEXT).text(k);
        });
      }

      // ── 7. COVERAGE BAR — single town, all insurance types ──────────
      function renderCoverageBar(d){
        var el = clear('hc-ins-heatmap'); if(!el) return;
        var types = [
          { key:'emp_based_ins',  label:'Employer-based', color:'#1B4F72' },
          { key:'dir_purchase_ins',label:'Direct-purchase',color:'#2E86AB' },
          { key:'medicare_cov',   label:'Medicare',       color:'#5DADE2' },
          { key:'medicaid_cov',   label:'Medicaid',       color:'#90C7E3' },
          { key:'tricare_cov',    label:'Tricare',        color:'#E8A838' },
          { key:'VA_cov',         label:'VA',             color:'#D4AC0D' },
          { key:'other_cov_type', label:'Other',          color:'#A93226' },
          { key:'all_unins',      label:'Uninsured',      color:'#7B7D7D' }
        ];
        var bars = types.map(function(t){
          return { label:t.label, value:(d[t.key]/d.Tot_pop)*100, color:t.color };
        });

        var mL=46, mR=20, mT=20, mB=72, W=620, innerH=220;
        var H=mT+innerH+mB;
        var yMax = d3.max(bars,function(b){return b.value;}) * 1.2;
        var xScale = d3.scaleBand().domain(bars.map(function(b){return b.label;})).range([0,W-mL-mR]).padding(0.3);
        var yScale = d3.scaleLinear().domain([0,yMax]).range([innerH,0]);

        var svg = d3.select(el).append('svg').attr('width','100%').attr('height',H)
          .attr('viewBox','0 0 '+W+' '+H)
          .attr('style','font-family:Hanken Grotesk,sans-serif');
        var g = svg.append('g').attr('transform','translate('+mL+','+mT+')');

        // Y axis label
        svg.append('text').attr('transform','rotate(-90)')
          .attr('x',-(mT+innerH/2)).attr('y',14)
          .attr('text-anchor','middle').attr('font-size',11).attr('fill',INS_LABEL)
          .text('Percent covered (%)');

        bars.forEach(function(b){
          var x=xScale(b.label), bh=innerH-yScale(b.value), y=yScale(b.value);
          g.append('rect').attr('x',x).attr('y',y).attr('width',xScale.bandwidth()).attr('height',bh).attr('fill',b.color).attr('rx',3)
            .on('mouseover',function(e){ ttShow('<b>'+b.label+'</b>: <b>'+b.value.toFixed(1)+'%</b>',e); })
            .on('mousemove',ttMove).on('mouseout',ttHide);
          if(bh > 12) g.append('text').attr('x',x+xScale.bandwidth()/2).attr('y',y-5)
            .attr('text-anchor','middle').attr('font-size',10).attr('fill','#555').text(b.value.toFixed(1)+'%');
        });

        var axY = g.append('g');
        axY.call(d3.axisLeft(yScale).ticks(5).tickFormat(function(d){return d+'%';}));
        axY.select('.domain').attr('stroke','#ccc'); axY.selectAll('line').attr('stroke','#ccc'); axY.selectAll('text').attr('font-size',10).attr('fill',INS_LABEL);

        var axX = g.append('g').attr('transform','translate(0,'+innerH+')');
        axX.call(d3.axisBottom(xScale).tickSize(0));
        axX.select('.domain').attr('stroke','#ccc');
        axX.selectAll('text').attr('transform','rotate(-30)').style('text-anchor','end').attr('font-size',11).attr('fill',INS_LABEL);

        // X axis label
        svg.append('text').attr('x',mL+(W-mL-mR)/2).attr('y',H-4)
          .attr('text-anchor','middle').attr('font-size',11).attr('fill',INS_LABEL).text('Type of insurance');
      }

      // ── Aggregation helper (for "All North Meck") ────────────────────
      var NUM_COLS = ['emp_insured','emp_uninsured','unemp_insured','unemp_uninsured','ins_U25','no_ins_U25','ins_25_50','no_ins_25_50','ins_50_75','no_ins_50_75','ins_75_100','no_ins_75_100','ins_100_above','no_ins_100_above','all_ins','all_unins','ins_U18','unins_U18','ins_19_25','unins_19_25','ins_26_34','unins_26_34','ins_35_64','unins_35_64','ins_65_over','unins_65_over','emp_based_ins','dir_purchase_ins','medicare_cov','medicaid_cov','tricare_cov','VA_cov','other_cov_type','Tot_pop'];
      function aggregate(rows){
        if(!rows.length) return [];
        var out = { year: rows[0].year, Town: 'All North Meck' };
        NUM_COLS.forEach(function(k){
          out[k] = rows.reduce(function(s,d){ return s + (d[k]||0); }, 0);
        });
        return [out];
      }

      // ── Per-chart town state ─────────────────────────────────────────
      window.window.HC_INS_DATA = null;
      var HC_INS_TOWNS = { income: null, age: null, trend: null, emp: null };

      function getSingleRows(town){
        var yr = window.HC_INS_DATA.filter(function(d){ return d.year === 2024; });
        return town ? yr.filter(function(d){ return d.Town === town; }) : aggregate(yr);
      }
      function getTrendRows(town){
        if(town) return window.HC_INS_DATA.filter(function(d){ return d.Town === town; });
        var byYear={};
        window.HC_INS_DATA.forEach(function(d){ if(!byYear[d.year]) byYear[d.year]=[]; byYear[d.year].push(d); });
        return Object.keys(byYear).sort().map(function(y){ return aggregate(byYear[y])[0]; });
      }

      function hcInsRenderAll(){
        if(!window.HC_INS_DATA) return;
        var data2024 = window.HC_INS_DATA.filter(function(d){ return d.year === 2024; });
        renderHeatmap(data2024, 2024);
        renderDotChart(data2024);
        renderIncome(getSingleRows(HC_INS_TOWNS.income));
        renderAge(getSingleRows(HC_INS_TOWNS.age));
        renderTrend(getTrendRows(HC_INS_TOWNS.trend));
        renderEmp(getSingleRows(HC_INS_TOWNS.emp));
      }
      window.hcInsRenderAll = hcInsRenderAll;

      // ── Global town chip handler (dot chart + heatmap/coverage bar) ──
      window.hcInsGlobalChip = function(el){
        var val = el.dataset.hcinsGlobal;
        document.querySelectorAll('[data-hcins-global]').forEach(function(c){
          c.classList.toggle('on', c === el);
        });
        var data2024 = window.HC_INS_DATA.filter(function(d){ return d.year === 2024; });
        var dotWrap = document.getElementById('hc-ins-dot-wrap');
        var titleEl = document.getElementById('hc-ins-heatmap-title');
        var subEl   = document.getElementById('hc-ins-heatmap-sub');
        if(val === 'all'){
          if(dotWrap) dotWrap.style.display = '';
          if(titleEl) titleEl.textContent = 'Insurance coverage type by town (2024)';
          if(subEl)   subEl.textContent   = 'ACS Table B27010 · % of total population · all three towns shown';
          renderHeatmap(data2024, 2024);
          renderDotChart(data2024);
        } else {
          if(dotWrap) dotWrap.style.display = 'none';
          var row = data2024.find(function(d){ return d.Town === val; });
          if(titleEl) titleEl.textContent = 'Insurance coverage mix — ' + val + ' (2024)';
          if(subEl)   subEl.textContent   = 'ACS Table B27010 · % of total population · select a different town above';
          if(row) renderCoverageBar(row);
        }
      };

      // ── Per-chart chip handler ───────────────────────────────────────
      window.hcInsLocalChip = function(el){
        var chart = el.dataset.hcinsChart;
        var town = el.dataset.hcinsTown === 'all' ? null : el.dataset.hcinsTown;
        document.querySelectorAll('[data-hcins-chart="'+chart+'"]').forEach(function(c){
          c.classList.toggle('on', c === el);
        });
        HC_INS_TOWNS[chart] = town;
        if(chart === 'income') renderIncome(getSingleRows(town));
        else if(chart === 'age')    renderAge(getSingleRows(town));
        else if(chart === 'trend')  renderTrend(getTrendRows(town));
        else if(chart === 'emp')    renderEmp(getSingleRows(town));
      };

      // Data loaded via MotherDuck module script below; render called from there.

      // REMOVED: inline window.HC_INS_DATA — data now loaded from MotherDuck above
      // legacy placeholder so variable exists before async resolves:
      /* eslint-disable */ if(false){window.HC_INS_DATA = [{"GEOID":"3714700","Town":"Cornelius","Tot_pop":28052,"year":2017,"emp_insured":12599,"emp_uninsured":1015,"unemp_insured":494,"unemp_uninsured":203,"ins_U25":2303,"no_ins_U25":399,"ins_25_50":3103,"no_ins_25_50":331,"ins_50_75":2983,"no_ins_50_75":374,"ins_75_100":3716,"no_ins_75_100":419,"ins_100_above":13715,"no_ins_100_above":664,"all_ins":25828,"all_unins":2187,"ins_U18":6245,"unins_U18":452,"ins_19_25":1369,"unins_19_25":172,"ins_26_34":2951,"unins_26_34":321,"ins_35_64":11304,"unins_35_64":1175,"ins_65_over":3959,"unins_65_over":67,"emp_based_ins":14332,"dir_purchase_ins":2758,"medicare_cov":3383,"medicaid_cov":1167,"tricare_cov":271,"VA_cov":53,"other_cov_type":1066},{"GEOID":"3716400","Town":"Davidson","Tot_pop":12325,"year":2017,"emp_insured":5221,"emp_uninsured":390,"unemp_insured":217,"unemp_uninsured":12,"ins_U25":655,"no_ins_U25":29,"ins_25_50":675,"no_ins_25_50":211,"ins_50_75":1049,"no_ins_50_75":74,"ins_75_100":802,"no_ins_75_100":77,"ins_100_above":7083,"no_ins_100_above":108,"all_ins":11689,"all_unins":554,"ins_U18":3191,"unins_U18":91,"ins_19_25":1723,"unins_19_25":115,"ins_26_34":800,"unins_26_34":75,"ins_35_64":4506,"unins_35_64":273,"ins_65_over":1469,"unins_65_over":0,"emp_based_ins":6490,"dir_purchase_ins":1135,"medicare_cov":1240,"medicaid_cov":487,"tricare_cov":48,"VA_cov":14,"other_cov_type":407},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":53302,"year":2017,"emp_insured":24907,"emp_uninsured":1965,"unemp_insured":561,"unemp_uninsured":395,"ins_U25":2471,"no_ins_U25":702,"ins_25_50":4854,"no_ins_25_50":857,"ins_50_75":6365,"no_ins_50_75":627,"ins_75_100":7395,"no_ins_75_100":772,"ins_100_above":28528,"no_ins_100_above":421,"all_ins":49627,"all_unins":3389,"ins_U18":15113,"unins_U18":536,"ins_19_25":2279,"unins_19_25":236,"ins_26_34":5595,"unins_26_34":700,"ins_35_64":22047,"unins_35_64":1879,"ins_65_over":4593,"unins_65_over":38,"emp_based_ins":31261,"dir_purchase_ins":3830,"medicare_cov":3737,"medicaid_cov":2112,"tricare_cov":560,"VA_cov":27,"other_cov_type":2224},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":28649,"year":2018,"emp_insured":12833,"emp_uninsured":1146,"unemp_insured":416,"unemp_uninsured":140,"ins_U25":2259,"no_ins_U25":536,"ins_25_50":2768,"no_ins_25_50":362,"ins_50_75":2936,"no_ins_50_75":405,"ins_75_100":3736,"no_ins_75_100":149,"ins_100_above":14518,"no_ins_100_above":907,"all_ins":26225,"all_unins":2359,"ins_U18":6461,"unins_U18":501,"ins_19_25":1368,"unins_19_25":97,"ins_26_34":2746,"unins_26_34":439,"ins_35_64":11823,"unins_35_64":1269,"ins_65_over":3827,"unins_65_over":53,"emp_based_ins":15227,"dir_purchase_ins":2966,"medicare_cov":3214,"medicaid_cov":1072,"tricare_cov":281,"VA_cov":54,"other_cov_type":1191},{"GEOID":"3716400","Town":"Davidson","Tot_pop":12666,"year":2018,"emp_insured":5218,"emp_uninsured":310,"unemp_insured":159,"unemp_uninsured":0,"ins_U25":398,"no_ins_U25":41,"ins_25_50":722,"no_ins_25_50":142,"ins_50_75":1029,"no_ins_50_75":29,"ins_75_100":758,"no_ins_75_100":111,"ins_100_above":7743,"no_ins_100_above":92,"all_ins":12158,"all_unins":431,"ins_U18":3546,"unins_U18":86,"ins_19_25":1621,"unins_19_25":38,"ins_26_34":735,"unins_26_34":102,"ins_35_64":4660,"unins_35_64":205,"ins_65_over":1596,"unins_65_over":0,"emp_based_ins":7153,"dir_purchase_ins":1177,"medicare_cov":1269,"medicaid_cov":454,"tricare_cov":24,"VA_cov":14,"other_cov_type":413},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":54572,"year":2018,"emp_insured":25458,"emp_uninsured":1693,"unemp_insured":588,"unemp_uninsured":285,"ins_U25":2589,"no_ins_U25":708,"ins_25_50":5007,"no_ins_25_50":962,"ins_50_75":6237,"no_ins_50_75":554,"ins_75_100":7041,"no_ins_75_100":379,"ins_100_above":30200,"no_ins_100_above":589,"all_ins":51087,"all_unins":3204,"ins_U18":15528,"unins_U18":645,"ins_19_25":2314,"unins_19_25":237,"ins_26_34":6067,"unins_26_34":649,"ins_35_64":22441,"unins_35_64":1635,"ins_65_over":4737,"unins_65_over":38,"emp_based_ins":31463,"dir_purchase_ins":4085,"medicare_cov":3895,"medicaid_cov":2607,"tricare_cov":519,"VA_cov":48,"other_cov_type":2076},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":29256,"year":2019,"emp_insured":12809,"emp_uninsured":1129,"unemp_insured":346,"unemp_uninsured":167,"ins_U25":2343,"no_ins_U25":455,"ins_25_50":2682,"no_ins_25_50":227,"ins_50_75":3417,"no_ins_50_75":346,"ins_75_100":3053,"no_ins_75_100":196,"ins_100_above":15441,"no_ins_100_above":1018,"all_ins":26943,"all_unins":2242,"ins_U18":6587,"unins_U18":492,"ins_19_25":1682,"unins_19_25":115,"ins_26_34":2160,"unins_26_34":497,"ins_35_64":12182,"unins_35_64":1071,"ins_65_over":4332,"unins_65_over":67,"emp_based_ins":15836,"dir_purchase_ins":3045,"medicare_cov":3643,"medicaid_cov":1204,"tricare_cov":222,"VA_cov":96,"other_cov_type":1252},{"GEOID":"3716400","Town":"Davidson","Tot_pop":12735,"year":2019,"emp_insured":5178,"emp_uninsured":301,"unemp_insured":125,"unemp_uninsured":21,"ins_U25":408,"no_ins_U25":39,"ins_25_50":894,"no_ins_25_50":166,"ins_50_75":1230,"no_ins_50_75":80,"ins_75_100":600,"no_ins_75_100":27,"ins_100_above":7542,"no_ins_100_above":123,"all_ins":12231,"all_unins":435,"ins_U18":3535,"unins_U18":61,"ins_19_25":1659,"unins_19_25":7,"ins_26_34":645,"unins_26_34":123,"ins_35_64":4673,"unins_35_64":229,"ins_65_over":1719,"unins_65_over":15,"emp_based_ins":6831,"dir_purchase_ins":1481,"medicare_cov":1325,"medicaid_cov":508,"tricare_cov":41,"VA_cov":13,"other_cov_type":482},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":55980,"year":2019,"emp_insured":25379,"emp_uninsured":1723,"unemp_insured":670,"unemp_uninsured":178,"ins_U25":2704,"no_ins_U25":568,"ins_25_50":4765,"no_ins_25_50":840,"ins_50_75":6265,"no_ins_50_75":538,"ins_75_100":6715,"no_ins_75_100":467,"ins_100_above":31987,"no_ins_100_above":833,"all_ins":52450,"all_unins":3258,"ins_U18":15894,"unins_U18":697,"ins_19_25":2698,"unins_19_25":225,"ins_26_34":5697,"unins_26_34":542,"ins_35_64":22771,"unins_35_64":1736,"ins_65_over":5390,"unins_65_over":58,"emp_based_ins":31936,"dir_purchase_ins":3963,"medicare_cov":4576,"medicaid_cov":2963,"tricare_cov":639,"VA_cov":38,"other_cov_type":2164},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":30925,"year":2021,"emp_insured":12865,"emp_uninsured":1134,"unemp_insured":406,"unemp_uninsured":170,"ins_U25":1796,"no_ins_U25":311,"ins_25_50":3275,"no_ins_25_50":495,"ins_50_75":2974,"no_ins_50_75":246,"ins_75_100":3598,"no_ins_75_100":270,"ins_100_above":17064,"no_ins_100_above":891,"all_ins":28712,"all_unins":2213,"ins_U18":6957,"unins_U18":495,"ins_19_25":1808,"unins_19_25":103,"ins_26_34":1924,"unins_26_34":503,"ins_35_64":12635,"unins_35_64":1077,"ins_65_over":5388,"unins_65_over":35,"emp_based_ins":16915,"dir_purchase_ins":2500,"medicare_cov":4565,"medicaid_cov":1578,"tricare_cov":224,"VA_cov":154,"other_cov_type":1494},{"GEOID":"3716400","Town":"Davidson","Tot_pop":14644,"year":2021,"emp_insured":5905,"emp_uninsured":406,"unemp_insured":137,"unemp_uninsured":28,"ins_U25":755,"no_ins_U25":201,"ins_25_50":611,"no_ins_25_50":64,"ins_50_75":1226,"no_ins_50_75":60,"ins_75_100":797,"no_ins_75_100":14,"ins_100_above":8999,"no_ins_100_above":285,"all_ins":13950,"all_unins":639,"ins_U18":3601,"unins_U18":95,"ins_19_25":1907,"unins_19_25":18,"ins_26_34":686,"unins_26_34":156,"ins_35_64":5513,"unins_35_64":347,"ins_65_over":2243,"unins_65_over":23,"emp_based_ins":8361,"dir_purchase_ins":1759,"medicare_cov":1668,"medicaid_cov":553,"tricare_cov":59,"VA_cov":9,"other_cov_type":561},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":60166,"year":2021,"emp_insured":26870,"emp_uninsured":1888,"unemp_insured":622,"unemp_uninsured":415,"ins_U25":2369,"no_ins_U25":598,"ins_25_50":5570,"no_ins_25_50":583,"ins_50_75":5600,"no_ins_50_75":684,"ins_75_100":7831,"no_ins_75_100":473,"ins_100_above":35109,"no_ins_100_above":1097,"all_ins":56495,"all_unins":3448,"ins_U18":16246,"unins_U18":747,"ins_19_25":2992,"unins_19_25":252,"ins_26_34":4843,"unins_26_34":963,"ins_35_64":25337,"unins_35_64":1477,"ins_65_over":7077,"unins_65_over":9,"emp_based_ins":35282,"dir_purchase_ins":4334,"medicare_cov":5889,"medicaid_cov":2942,"tricare_cov":505,"VA_cov":77,"other_cov_type":2549},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":31396,"year":2022,"emp_insured":13772,"emp_uninsured":877,"unemp_insured":338,"unemp_uninsured":129,"ins_U25":1267,"no_ins_U25":248,"ins_25_50":3409,"no_ins_25_50":379,"ins_50_75":2896,"no_ins_50_75":118,"ins_75_100":2724,"no_ins_75_100":179,"ins_100_above":19459,"no_ins_100_above":713,"all_ins":29759,"all_unins":1637,"ins_U18":6874,"unins_U18":322,"ins_19_25":1855,"unins_19_25":82,"ins_26_34":2405,"unins_26_34":400,"ins_35_64":12782,"unins_35_64":797,"ins_65_over":5843,"unins_65_over":36,"emp_based_ins":17679,"dir_purchase_ins":2560,"medicare_cov":4699,"medicaid_cov":1106,"tricare_cov":139,"VA_cov":145,"other_cov_type":1721},{"GEOID":"3716400","Town":"Davidson","Tot_pop":15199,"year":2022,"emp_insured":6179,"emp_uninsured":375,"unemp_insured":128,"unemp_uninsured":23,"ins_U25":704,"no_ins_U25":178,"ins_25_50":653,"no_ins_25_50":45,"ins_50_75":1187,"no_ins_50_75":55,"ins_75_100":652,"no_ins_75_100":13,"ins_100_above":9836,"no_ins_100_above":278,"all_ins":14554,"all_unins":581,"ins_U18":3567,"unins_U18":98,"ins_19_25":2029,"unins_19_25":15,"ins_26_34":680,"unins_26_34":140,"ins_35_64":6005,"unins_35_64":309,"ins_65_over":2273,"unins_65_over":19,"emp_based_ins":8973,"dir_purchase_ins":1637,"medicare_cov":1743,"medicaid_cov":513,"tricare_cov":39,"VA_cov":0,"other_cov_type":529},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":61202,"year":2022,"emp_insured":28351,"emp_uninsured":1899,"unemp_insured":851,"unemp_uninsured":443,"ins_U25":1994,"no_ins_U25":619,"ins_25_50":4854,"no_ins_25_50":473,"ins_50_75":6253,"no_ins_50_75":760,"ins_75_100":6366,"no_ins_75_100":258,"ins_100_above":37985,"no_ins_100_above":1327,"all_ins":57485,"all_unins":3450,"ins_U18":15523,"unins_U18":693,"ins_19_25":3413,"unins_19_25":298,"ins_26_34":5247,"unins_26_34":1036,"ins_35_64":25617,"unins_35_64":1414,"ins_65_over":7685,"unins_65_over":9,"emp_based_ins":35450,"dir_purchase_ins":4282,"medicare_cov":6506,"medicaid_cov":2700,"tricare_cov":392,"VA_cov":111,"other_cov_type":2697},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":32009,"year":2023,"emp_insured":13829,"emp_uninsured":852,"unemp_insured":412,"unemp_uninsured":100,"ins_U25":1246,"no_ins_U25":261,"ins_25_50":3107,"no_ins_25_50":425,"ins_50_75":2774,"no_ins_50_75":73,"ins_75_100":2707,"no_ins_75_100":130,"ins_100_above":20624,"no_ins_100_above":659,"all_ins":30461,"all_unins":1548,"ins_U18":7069,"unins_U18":263,"ins_19_25":1855,"unins_19_25":84,"ins_26_34":2434,"unins_26_34":337,"ins_35_64":12899,"unins_35_64":808,"ins_65_over":6204,"unins_65_over":56,"emp_based_ins":18204,"dir_purchase_ins":2498,"medicare_cov":5063,"medicaid_cov":1328,"tricare_cov":40,"VA_cov":186,"other_cov_type":1479},{"GEOID":"3716400","Town":"Davidson","Tot_pop":14852,"year":2023,"emp_insured":6049,"emp_uninsured":252,"unemp_insured":235,"unemp_uninsured":27,"ins_U25":805,"no_ins_U25":162,"ins_25_50":424,"no_ins_25_50":36,"ins_50_75":777,"no_ins_50_75":66,"ins_75_100":595,"no_ins_75_100":12,"ins_100_above":10096,"no_ins_100_above":205,"all_ins":14294,"all_unins":492,"ins_U18":3444,"unins_U18":116,"ins_19_25":1897,"unins_19_25":13,"ins_26_34":630,"unins_26_34":60,"ins_35_64":5992,"unins_35_64":280,"ins_65_over":2331,"unins_65_over":23,"emp_based_ins":8863,"dir_purchase_ins":1591,"medicare_cov":1805,"medicaid_cov":611,"tricare_cov":99,"VA_cov":0,"other_cov_type":512},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":62458,"year":2023,"emp_insured":29602,"emp_uninsured":1769,"unemp_insured":756,"unemp_uninsured":443,"ins_U25":1390,"no_ins_U25":237,"ins_25_50":5206,"no_ins_25_50":362,"ins_50_75":5218,"no_ins_50_75":787,"ins_75_100":6064,"no_ins_75_100":199,"ins_100_above":40958,"no_ins_100_above":1670,"all_ins":58880,"all_unins":3269,"ins_U18":15919,"unins_U18":490,"ins_19_25":3535,"unins_19_25":268,"ins_26_34":5403,"unins_26_34":955,"ins_35_64":26167,"unins_35_64":1525,"ins_65_over":7856,"unins_65_over":31,"emp_based_ins":36709,"dir_purchase_ins":3995,"medicare_cov":6567,"medicaid_cov":2747,"tricare_cov":256,"VA_cov":76,"other_cov_type":2789},{"GEOID":"3714700","Town":"Cornelius","Tot_pop":32783,"year":2024,"emp_insured":14475,"emp_uninsured":860,"unemp_insured":377,"unemp_uninsured":0,"ins_U25":1522,"no_ins_U25":391,"ins_25_50":2725,"no_ins_25_50":424,"ins_50_75":2911,"no_ins_50_75":79,"ins_75_100":2826,"no_ins_75_100":105,"ins_100_above":21208,"no_ins_100_above":562,"all_ins":31193,"all_unins":1561,"ins_U18":7027,"unins_U18":352,"ins_19_25":2083,"unins_19_25":49,"ins_26_34":2950,"unins_26_34":326,"ins_35_64":12635,"unins_35_64":778,"ins_65_over":6498,"unins_65_over":56,"emp_based_ins":17192,"dir_purchase_ins":2894,"medicare_cov":5651,"medicaid_cov":1424,"tricare_cov":137,"VA_cov":93,"other_cov_type":1537},{"GEOID":"3716400","Town":"Davidson","Tot_pop":15660,"year":2024,"emp_insured":6325,"emp_uninsured":269,"unemp_insured":270,"unemp_uninsured":2,"ins_U25":817,"no_ins_U25":160,"ins_25_50":575,"no_ins_25_50":177,"ins_50_75":482,"no_ins_50_75":0,"ins_75_100":769,"no_ins_75_100":12,"ins_100_above":10691,"no_ins_100_above":174,"all_ins":15059,"all_unins":534,"ins_U18":3586,"unins_U18":207,"ins_19_25":2017,"unins_19_25":13,"ins_26_34":672,"unins_26_34":34,"ins_35_64":6371,"unins_35_64":279,"ins_65_over":2413,"unins_65_over":1,"emp_based_ins":9477,"dir_purchase_ins":1278,"medicare_cov":1869,"medicaid_cov":748,"tricare_cov":75,"VA_cov":0,"other_cov_type":649},{"GEOID":"3733120","Town":"Huntersville","Tot_pop":63969,"year":2024,"emp_insured":31116,"emp_uninsured":1775,"unemp_insured":713,"unemp_uninsured":421,"ins_U25":1417,"no_ins_U25":152,"ins_25_50":4682,"no_ins_25_50":414,"ins_50_75":5513,"no_ins_50_75":696,"ins_75_100":6390,"no_ins_75_100":349,"ins_100_above":42456,"no_ins_100_above":1508,"all_ins":60525,"all_unins":3130,"ins_U18":15555,"unins_U18":517,"ins_19_25":3197,"unins_19_25":247,"ins_26_34":6523,"unins_26_34":947,"ins_35_64":26882,"unins_35_64":1340,"ins_65_over":8368,"unins_65_over":79,"emp_based_ins":36979,"dir_purchase_ins":4404,"medicare_cov":6698,"medicaid_cov":2407,"tricare_cov":196,"VA_cov":78,"other_cov_type":3103}]; } // end if(false)

      document.addEventListener('masterTownChange', function(e){
        var town = e.detail.town || null;
        // sync all per-chart chips and state
        ['income','age','trend','emp'].forEach(function(chart){
          HC_INS_TOWNS[chart] = town;
          document.querySelectorAll('[data-hcins-chart="'+chart+'"]').forEach(function(c){
            c.classList.toggle('on', town ? c.dataset.hcinsTown === town : c.dataset.hcinsTown === 'all');
          });
        });
        hcInsRenderAll();
      });
    })();
})();

// Block 2 (module)
(async function() {
      const MD_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhqcGFyazEzMzhAZ21haWwuY29tIiwibWRSZWdpb24iOiJhd3MtdXMtZWFzdC0xIiwic2Vzc2lvbiI6ImhqcGFyazEzMzguZ21haWwuY29tIiwicGF0IjoiWlJKR2JmU0VuU0dTQlhodjdROHJSR0VYS0NyR2ZMX3E5QmFFdkJxeHkyWSIsInVzZXJJZCI6ImNjZjM5YjFjLWZiYWEtNGZhOS1iNjkxLWZmOTJmNTIxMWFmMyIsImlzcyI6Im1kX3BhdCIsInJlYWRPbmx5IjpmYWxzZSwidG9rZW5UeXBlIjoicmVhZF93cml0ZSIsImlhdCI6MTc4MTYxNjYyM30.g2FjvYtBsCNBMAHUG9ggxmu10dQRM2Q6iPyxK_5LaRc";
      const conn = MDConnection.create({ mdToken: MD_TOKEN });
      const sql = `
        SELECT
          hi.GEOID,
          hi.town AS "Town",
          CAST(dem.total_population AS INTEGER) AS "Tot_pop",
          hi.year,
          hi.all_ins, hi.all_unins,
          hi.ins_U18,  hi.unins_U18,
          hi.ins_19_25, hi.unins_19_25,
          hi.ins_26_34, hi.unins_26_34,
          hi.ins_35_64, hi.unins_35_64,
          hi.ins_65_over, hi.unins_65_over,
          hi.emp_based_ins, hi.dir_purchase_ins,
          hi.medicare_cov, hi.medicaid_cov,
          hi.tricare_cov, hi.va_cov AS "VA_cov", hi.other_cov_type,
          hd.emp_insured, hd.emp_uninsured,
          hd.unemp_insured, hd.unemp_uninsured,
          hd.ins_U25, hd.no_ins_U25,
          hd.ins_25_50, hd.no_ins_25_50,
          hd.ins_50_75, hd.no_ins_50_75,
          hd.ins_75_100, hd.no_ins_75_100,
          hd.ins_100_above, hd.no_ins_100_above
        FROM nmidw.main.agg_town_health_insurance hi
        JOIN nmidw_cloud.main.agg_town_health_data hd
          ON hi.GEOID = hd.GEOID AND hi.year = hd.year
        JOIN nmidw_cloud.agg_town_demographics dem
          ON hi.GEOID = dem.GEOID AND hi.year = dem.year
        ORDER BY hi.year, hi.town
      `;
      try {
        const rows = await window.mdQuery(await conn, sql);
        window.window.HC_INS_DATA = rows.map(r => {
          const out = {};
          Object.keys(r).forEach(k => { out[k] = typeof r[k] === 'bigint' ? Number(r[k]) : r[k]; });
          return out;
        });
      } catch(e) {
        console.error('MotherDuck health insurance load failed:', e);
      }
      if (window.hcInsRenderAll) window.hcInsRenderAll();
})();

// Block 3 (plain)
(function() {
    (function(){
      var MH_BLUE   = '#2E86AB';
      var MH_BLUE2  = '#1B4F72';
      var MH_AMBER  = '#E8A838';
      var MH_LIGHT  = '#90C7E3';
      var MH_FONT   = "500 12px 'Hanken Grotesk', sans-serif";
      var MH_TEXT   = '#444';

      // Inlined CDC PLACES data
      var MH_DEPRESSION = [
        {town:'Cornelius',  year:2019, val:22.4, lo:21.8, hi:23.0},
        {town:'Cornelius',  year:2021, val:21.6, lo:18.7, hi:24.8},
        {town:'Cornelius',  year:2023, val:24.6, lo:21.1, hi:28.0},
        {town:'Davidson',   year:2019, val:22.3, lo:21.5, hi:23.2},
        {town:'Davidson',   year:2021, val:21.6, lo:18.8, hi:24.8},
        {town:'Davidson',   year:2023, val:24.6, lo:21.3, hi:28.1},
        {town:'Huntersville',year:2019,val:21.8, lo:21.5, hi:22.3},
        {town:'Huntersville',year:2021,val:21.0, lo:18.1, hi:24.3},
        {town:'Huntersville',year:2023,val:23.8, lo:20.5, hi:27.2}
      ];
      var MH_DISTRESS = [
        {town:'Cornelius',   year:2023, val:14.7, lo:12.9, hi:16.5},
        {town:'Davidson',    year:2023, val:14.4, lo:12.7, hi:16.4},
        {town:'Huntersville',year:2023, val:14.6, lo:12.9, hi:16.4}
      ];

      var TOWNS = ['Cornelius','Davidson','Huntersville'];
      var YEARS = [2019, 2021, 2023];

      // Shared tooltip
      var MH_TT = document.createElement('div');
      MH_TT.style.cssText = 'position:fixed;pointer-events:none;background:#1a1a2e;color:#fff;font:500 12px Hanken Grotesk,sans-serif;padding:7px 11px;border-radius:7px;box-shadow:0 4px 16px rgba(0,0,0,.22);white-space:nowrap;opacity:0;transition:opacity .12s;z-index:9999';
      document.body.appendChild(MH_TT);
      function ttShow(html,e){MH_TT.innerHTML=html;MH_TT.style.opacity='1';ttMove(e);}
      function ttMove(e){MH_TT.style.left=(e.clientX+14)+'px';MH_TT.style.top=(e.clientY-36)+'px';}
      function ttHide(){MH_TT.style.opacity='0';}

      // ── Dumbbell chart (2019 vs 2023, all towns) ──────────────────────
      function renderDumbbell() {
        var el = document.getElementById('mh-dumbbell-chart');
        if (!el) return;
        el.innerHTML = '';
        var W = el.offsetWidth || 420;
        var M = {top:30, right:30, bottom:50, left:100};
        var iw = W - M.left - M.right;
        var ih = 220;
        var H = ih + M.top + M.bottom;

        var dumData = TOWNS.map(function(t){
          var r19 = MH_DEPRESSION.find(function(d){return d.town===t && d.year===2019;});
          var r23 = MH_DEPRESSION.find(function(d){return d.town===t && d.year===2023;});
          return {town:t, v19:r19?r19.val:null, v23:r23?r23.val:null};
        });

        var xDom = [0, d3.max(dumData, function(d){return Math.max(d.v19,d.v23);}) * 1.1];
        var x = d3.scaleLinear().domain(xDom).range([0, iw]);
        var y = d3.scaleBand().domain(TOWNS).range([0, ih]).padding(0.5);

        var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
        var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

        // connecting lines
        g.selectAll('.db-line').data(dumData).join('line')
          .attr('x1',function(d){return x(d.v19);}).attr('x2',function(d){return x(d.v23);})
          .attr('y1',function(d){return y(d.town)+y.bandwidth()/2;})
          .attr('y2',function(d){return y(d.town)+y.bandwidth()/2;})
          .attr('stroke',MH_LIGHT).attr('stroke-width',3);

        // 2019 dots
        g.selectAll('.db-19').data(dumData).join('circle')
          .attr('cx',function(d){return x(d.v19);})
          .attr('cy',function(d){return y(d.town)+y.bandwidth()/2;})
          .attr('r',7).attr('fill',MH_LIGHT)
          .on('mouseover',function(event,d){ttShow('<b>'+d.town+'</b> (2019): '+d.v19+'%',event);})
          .on('mousemove',ttMove).on('mouseout',ttHide);

        // 2023 dots
        g.selectAll('.db-23').data(dumData).join('circle')
          .attr('cx',function(d){return x(d.v23);})
          .attr('cy',function(d){return y(d.town)+y.bandwidth()/2;})
          .attr('r',7).attr('fill',MH_BLUE2)
          .on('mouseover',function(event,d){ttShow('<b>'+d.town+'</b> (2023): '+d.v23+'%',event);})
          .on('mousemove',ttMove).on('mouseout',ttHide);

        // axes
        g.append('g').attr('transform','translate(0,'+ih+')')
          .call(d3.axisBottom(x).tickFormat(function(d){return d+'%';}).ticks(5))
          .call(function(ax){ax.select('.domain').remove();});
        g.append('g').call(d3.axisLeft(y))
          .call(function(ax){ax.select('.domain').remove(); ax.selectAll('.tick line').remove();});

        // x label
        svg.append('text').attr('x',M.left+iw/2).attr('y',H-8)
          .attr('text-anchor','middle').attr('font-size',11).attr('fill',MH_TEXT)
          .text('Depression Prevalence (%)');

        // legend
        var lgY = H - 14;
        [[MH_LIGHT,'2019'],[MH_BLUE2,'2023']].forEach(function(pair,i){
          svg.append('circle').attr('cx',M.left+i*80).attr('cy',lgY-3).attr('r',5).attr('fill',pair[0]);
          svg.append('text').attr('x',M.left+i*80+12).attr('y',lgY).attr('font-size',11).attr('fill',MH_TEXT).text(pair[1]);
        });
      }

      // ── Depression bars by year (filterable by town) ───────────────────
      var mhDepTown = window.__masterTown || 'All';
      function renderDepBar(town) {
        var el = document.getElementById('mh-depbar-chart');
        if (!el) return;
        el.innerHTML = '';
        town = town || mhDepTown;
        var W = el.offsetWidth || 420;
        var M = {top:30, right:20, bottom:50, left:52};
        var iw = W - M.left - M.right;
        var ih = 200;
        var H = ih + M.top + M.bottom;

        var rows;
        if (!town || town === 'All') {
          rows = MH_DEPRESSION.filter(function(d){return d.year!==2021;}).map(function(d){return d;});
          // group by year, then town within year
          var yearGroups = [2019,2023];
          var x0 = d3.scaleBand().domain(yearGroups.map(String)).range([0,iw]).padding(0.25);
          var x1 = d3.scaleBand().domain(TOWNS).range([0,x0.bandwidth()]).padding(0.06);
          var yMax = d3.max(rows,function(d){return d.hi;});
          var y = d3.scaleLinear().domain([0,yMax*1.18]).range([ih,0]);
          var townColor = d3.scaleOrdinal().domain(TOWNS).range([MH_BLUE, MH_BLUE2, MH_AMBER]);

          var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
          var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

          // grid
          g.append('g').call(d3.axisLeft(y).tickSize(-iw).tickFormat(''))
            .call(function(ax){ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#e8e8e8');});

          yearGroups.forEach(function(yr){
            var grp = g.append('g').attr('transform','translate('+x0(String(yr))+',0)');
            var yrRows = rows.filter(function(d){return d.year===yr;});
            yrRows.forEach(function(d){
              var bx = x1(d.town);
              var bw = x1.bandwidth();
              grp.append('rect')
                .attr('x',bx).attr('y',y(d.val)).attr('width',bw).attr('height',ih-y(d.val))
                .attr('fill',townColor(d.town)).attr('rx',2)
                .on('mouseover',function(event){ttShow('<b>'+d.town+'</b> '+yr+': '+d.val+'%',event);})
                .on('mousemove',ttMove).on('mouseout',ttHide);
              // error bar
              grp.append('line').attr('x1',bx+bw/2).attr('x2',bx+bw/2).attr('y1',y(d.lo)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
              grp.append('line').attr('x1',bx+bw/2-4).attr('x2',bx+bw/2+4).attr('y1',y(d.hi)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
              grp.append('line').attr('x1',bx+bw/2-4).attr('x2',bx+bw/2+4).attr('y1',y(d.lo)).attr('y2',y(d.lo)).attr('stroke','#333').attr('stroke-width',1.5);
            });
          });

          g.append('g').attr('transform','translate(0,'+ih+')')
            .call(d3.axisBottom(x0).tickFormat(function(d){return d;}))
            .call(function(ax){ax.select('.domain').remove();});
          g.append('g').call(d3.axisLeft(y).tickFormat(function(d){return d+'%';}).ticks(5))
            .call(function(ax){ax.select('.domain').remove();});

          // legend
          TOWNS.forEach(function(t,i){
            svg.append('rect').attr('x',M.left+i*100).attr('y',H-13).attr('width',10).attr('height',10).attr('fill',townColor(t)).attr('rx',2);
            svg.append('text').attr('x',M.left+i*100+13).attr('y',H-4).attr('font-size',11).attr('fill',MH_TEXT).text(t);
          });
        } else {
          // Single town: bars by year
          rows = MH_DEPRESSION.filter(function(d){return d.town===town;}).sort(function(a,b){return a.year-b.year;});
          var colorByYear = d3.scaleOrdinal().domain(YEARS).range([MH_BLUE, MH_BLUE2, MH_AMBER]);
          var x = d3.scaleBand().domain(rows.map(function(d){return String(d.year);})).range([0,iw]).padding(0.35);
          var yMax2 = d3.max(rows,function(d){return d.hi;});
          var y2 = d3.scaleLinear().domain([0,yMax2*1.18]).range([ih,0]);

          var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
          var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

          g.append('g').call(d3.axisLeft(y2).tickSize(-iw).tickFormat(''))
            .call(function(ax){ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#e8e8e8');});

          rows.forEach(function(d){
            var bx = x(String(d.year));
            var bw = x.bandwidth();
            g.append('rect').attr('x',bx).attr('y',y2(d.val)).attr('width',bw).attr('height',ih-y2(d.val))
              .attr('fill',colorByYear(d.year)).attr('rx',2)
              .on('mouseover',function(event){ttShow('<b>'+d.year+'</b>: '+d.val+'% (CI: '+d.lo+'–'+d.hi+'%)',event);})
              .on('mousemove',ttMove).on('mouseout',ttHide);
            // bar label
            g.append('text').attr('x',bx+bw/2).attr('y',y2(d.val)+ih/2.5).attr('text-anchor','middle')
              .attr('font-size',13).attr('font-weight','500').attr('fill','#fff').text(d.val+'%');
            // error bar
            g.append('line').attr('x1',bx+bw/2).attr('x2',bx+bw/2).attr('y1',y2(d.lo)).attr('y2',y2(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
            g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y2(d.hi)).attr('y2',y2(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
            g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y2(d.lo)).attr('y2',y2(d.lo)).attr('stroke','#333').attr('stroke-width',1.5);
          });

          g.append('g').attr('transform','translate(0,'+ih+')')
            .call(d3.axisBottom(x)).call(function(ax){ax.select('.domain').remove();});
          g.append('g').call(d3.axisLeft(y2).tickFormat(function(d){return d+'%';}).ticks(5))
            .call(function(ax){ax.select('.domain').remove();});
        }
      }

      // ── Frequent Mental Distress bars (2023, by town) ─────────────────
      function renderDistress() {
        var el = document.getElementById('mh-distress-chart');
        if (!el) return;
        el.innerHTML = '';
        var W = el.offsetWidth || 560;
        var M = {top:24, right:24, bottom:50, left:52};
        var iw = W - M.left - M.right;
        var ih = 180;
        var H = ih + M.top + M.bottom;

        var x = d3.scaleBand().domain(MH_DISTRESS.map(function(d){return d.town;})).range([0,iw]).padding(0.4);
        var yMax = d3.max(MH_DISTRESS,function(d){return d.hi;});
        var y = d3.scaleLinear().domain([0,yMax*1.2]).range([ih,0]);
        var colorByTown = d3.scaleOrdinal().domain(TOWNS).range([MH_BLUE, MH_BLUE2, MH_AMBER]);

        var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
        var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

        g.append('g').call(d3.axisLeft(y).tickSize(-iw).tickFormat(''))
          .call(function(ax){ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#e8e8e8').attr('stroke-dasharray','3,3');});

        MH_DISTRESS.forEach(function(d){
          var bx = x(d.town); var bw = x.bandwidth();
          g.append('rect').attr('x',bx).attr('y',y(d.val)).attr('width',bw).attr('height',ih-y(d.val))
            .attr('fill',colorByTown(d.town)).attr('rx',2)
            .on('mouseover',function(event){ttShow('<b>'+d.town+'</b> 2023: '+d.val+'% (CI: '+d.lo+'–'+d.hi+'%)',event);})
            .on('mousemove',ttMove).on('mouseout',ttHide);
          g.append('text').attr('x',bx+bw/2).attr('y',y(d.val)+ih/2.5).attr('text-anchor','middle')
            .attr('font-size',13).attr('font-weight','500').attr('fill','#fff').text(d.val+'%');
          // error bars
          g.append('line').attr('x1',bx+bw/2).attr('x2',bx+bw/2).attr('y1',y(d.lo)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
          g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y(d.hi)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
          g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y(d.lo)).attr('y2',y(d.lo)).attr('stroke','#333').attr('stroke-width',1.5);
        });

        g.append('g').attr('transform','translate(0,'+ih+')')
          .call(d3.axisBottom(x)).call(function(ax){ax.select('.domain').remove();});
        g.append('g').call(d3.axisLeft(y).tickFormat(function(d){return d+'%';}).ticks(5))
          .call(function(ax){ax.select('.domain').remove();});

        svg.append('text').attr('x',M.left+iw/2).attr('y',H-8)
          .attr('text-anchor','middle').attr('font-size',11).attr('fill',MH_TEXT).text('Town · 2023');
      }

      // Render all
      function mhRenderAll() {
        renderDumbbell();
        renderDepBar(mhDepTown);
        renderDistress();
      }

      // ResizeObserver for hidden-tab rendering
      ['mh-dumbbell-chart','mh-depbar-chart','mh-distress-chart'].forEach(function(id){
        var el = document.getElementById(id);
        if (!el) return;
        var ro = new ResizeObserver(function(entries){
          var w = entries[0].contentRect.width;
          if (w > 0) mhRenderAll();
        });
        ro.observe(el);
        if (el.offsetWidth > 0) mhRenderAll();
      });

      // masterTownChange listener — re-renders all charts (also fires on tab switch via setTab)
      document.addEventListener('masterTownChange', function(e){
        mhDepTown = e.detail.town || 'All';
        mhRenderAll();
      });

      // Exposed for goto() hook
      window.__mhRender = mhRenderAll;
    })();
})();

// Block 4 (module)
(async function() {
      let facilities;
      try {
        const conn = await window.__mdConn;
        const rows = await window.mdQuery(conn, `
          SELECT
            ANY_VALUE(facility_name) AS facility_name,
            ANY_VALUE(street1)       AS street1,
            ANY_VALUE(city)          AS city,
            latitude,
            longitude,
            STRING_AGG(DISTINCT facility_type_label, ', ') AS types
          FROM nmidw.agg_mhsu_facility_detail
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          GROUP BY latitude, longitude
        `);
        facilities = rows.map(function(d){
          return {
            name: d.facility_name,
            address: (d.street1||'') + (d.city ? ', '+d.city : ''),
            lat: Number(d.latitude),
            lng: Number(d.longitude),
            type: d.types || ''
          };
        });
      } catch(e) {
        console.error('MotherDuck facility map load failed:', e);
        window.mdShowError('mh-facility-map');
        return;
      }

      const map = L.map('mh-facility-map').setView([35.48, -80.85], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      }).addTo(map);

      const northMeckCenter = L.latLng(35.48, -80.85);
      let activeCenter = northMeckCenter;
      let userMarker = null;
      let radiusCircle = null;

      const allMarkers = facilities.map(function(f){
        const m = L.marker([f.lat, f.lng])
          .addTo(map)
          .bindPopup('<strong>'+f.name+'</strong><br>'+f.address+(f.type?'<br><em>'+f.type+'</em>':''));
        return { marker: m, lat: f.lat, lng: f.lng, distance: northMeckCenter.distanceTo(L.latLng(f.lat, f.lng)) / 1609.34 };
      });

      function updateRadiusCircle(center, radiusMi) {
        if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }
        if (radiusMi === 'all') return;
        radiusCircle = L.circle(center, {
          radius: radiusMi * 1609.34,
          color: '#2E86AB', fillColor: '#2E86AB', fillOpacity: 0.08, weight: 1.5
        }).addTo(map);
        map.fitBounds(radiusCircle.getBounds());
      }

      function filterMarkers(radiusMi) {
        allMarkers.forEach(function(item){
          if (radiusMi === 'all' || item.distance <= radiusMi) {
            if (!map.hasLayer(item.marker)) item.marker.addTo(map);
          } else {
            if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
          }
        });
      }

      document.querySelectorAll('[data-mh-radius]').forEach(function(btn){
        btn.addEventListener('click', function(){
          document.querySelectorAll('[data-mh-radius]').forEach(function(b){ b.classList.remove('on'); });
          this.classList.add('on');
          const r = this.dataset.mhRadius;
          const val = r === 'all' ? 'all' : Number(r);
          updateRadiusCircle(activeCenter, val);
          filterMarkers(val);
        });
      });

      document.getElementById('mh-address-btn').addEventListener('click', function(){
        const addr = document.getElementById('mh-address-input').value.trim();
        if (!addr) return;
        fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(addr))
          .then(function(res){return res.json();})
          .then(function(results){
            if (!results.length) { alert('Address not found. Try again.'); return; }
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            const loc = L.latLng(lat, lng);
            activeCenter = loc;
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker(loc, {
              radius: 10, color: '#2E86AB', fillColor: '#2E86AB', fillOpacity: 0.8
            }).addTo(map).bindPopup('Your location');
            allMarkers.forEach(function(item){
              item.distance = loc.distanceTo(L.latLng(item.lat, item.lng)) / 1609.34;
            });
            map.setView(loc, 13);
            const activeBtn = document.querySelector('[data-mh-radius].on');
            const val = activeBtn ? (activeBtn.dataset.mhRadius === 'all' ? 'all' : Number(activeBtn.dataset.mhRadius)) : 'all';
            updateRadiusCircle(activeCenter, val);
            filterMarkers(val);
          });
      });
})();

// Block 5 (plain)
(function() {
    (function(){
      var CD_BLUE  = '#2E86AB';
      var CD_DARK  = '#1B4F72';
      var CD_AMBER = '#E8A838';
      var CD_TEXT  = '#444';
      var TOWNS    = ['Cornelius','Davidson','Huntersville'];
      var YEARS    = [2019,2021,2023];

      var CD_DATA = {
        diabetes: [
          {town:'Cornelius',   year:2019, val:7.2, lo:6.9, hi:7.5},
          {town:'Cornelius',   year:2021, val:7.7, lo:6.6, hi:8.9},
          {town:'Cornelius',   year:2023, val:7.1, lo:6.0, hi:8.1},
          {town:'Davidson',    year:2019, val:7.2, lo:6.8, hi:7.6},
          {town:'Davidson',    year:2021, val:7.7, lo:6.7, hi:8.9},
          {town:'Davidson',    year:2023, val:6.9, lo:5.9, hi:8.0},
          {town:'Huntersville',year:2019, val:7.4, lo:7.2, hi:7.6},
          {town:'Huntersville',year:2021, val:7.8, lo:6.8, hi:9.0},
          {town:'Huntersville',year:2023, val:7.6, lo:6.5, hi:8.7}
        ],
        obesity: [
          {town:'Cornelius',   year:2019, val:24.4, lo:23.8, hi:25.0},
          {town:'Cornelius',   year:2021, val:29.5, lo:25.2, hi:34.2},
          {town:'Cornelius',   year:2023, val:25.1, lo:20.6, hi:29.8},
          {town:'Davidson',    year:2019, val:24.3, lo:23.5, hi:25.1},
          {town:'Davidson',    year:2021, val:29.3, lo:25.2, hi:34.0},
          {town:'Davidson',    year:2023, val:24.7, lo:20.2, hi:29.2},
          {town:'Huntersville',year:2019, val:24.5, lo:24.1, hi:24.9},
          {town:'Huntersville',year:2021, val:29.5, lo:25.2, hi:34.2},
          {town:'Huntersville',year:2023, val:25.6, lo:21.1, hi:30.2}
        ],
        hbp: [
          {town:'Cornelius',   year:2019, val:26.4, lo:25.9, hi:27.0},
          {town:'Cornelius',   year:2021, val:25.7, lo:22.8, hi:28.8},
          {town:'Cornelius',   year:2023, val:26.1, lo:22.9, hi:29.2},
          {town:'Davidson',    year:2019, val:26.3, lo:25.6, hi:27.0},
          {town:'Davidson',    year:2021, val:25.6, lo:22.8, hi:28.6},
          {town:'Davidson',    year:2023, val:25.8, lo:22.7, hi:28.9},
          {town:'Huntersville',year:2019, val:26.5, lo:26.2, hi:26.9},
          {town:'Huntersville',year:2021, val:25.8, lo:22.9, hi:28.9},
          {town:'Huntersville',year:2023, val:26.9, lo:23.7, hi:30.0}
        ]
      };

      var CD_TT = document.createElement('div');
      CD_TT.style.cssText = 'position:fixed;pointer-events:none;background:#1a1a2e;color:#fff;font:500 12px Hanken Grotesk,sans-serif;padding:7px 11px;border-radius:7px;box-shadow:0 4px 16px rgba(0,0,0,.22);white-space:nowrap;opacity:0;transition:opacity .12s;z-index:9999';
      document.body.appendChild(CD_TT);
      function ttShow(html,e){CD_TT.innerHTML=html;CD_TT.style.opacity='1';ttMove(e);}
      function ttMove(e){CD_TT.style.left=(e.clientX+14)+'px';CD_TT.style.top=(e.clientY-36)+'px';}
      function ttHide(){CD_TT.style.opacity='0';}

      var colorByYear = d3.scaleOrdinal().domain(YEARS).range([CD_BLUE, CD_DARK, CD_AMBER]);
      var colorByTown = d3.scaleOrdinal().domain(TOWNS).range([CD_BLUE, CD_DARK, CD_AMBER]);

      var cdTown = window.__masterTown || 'All';

      function renderCDChart(elId, data, yLabel) {
        var el = document.getElementById(elId);
        if (!el) return;
        el.innerHTML = '';
        var town = cdTown;
        var W = el.offsetWidth || 420;
        var M = {top:24, right:20, bottom:50, left:54};
        var iw = W - M.left - M.right;
        var ih = 200;
        var H = ih + M.top + M.bottom;

        var rows, x, y, colorFn, xDomain;

        if (!town || town === 'All') {
          // Grouped by year, towns within year
          rows = data;
          var yearGroups = YEARS;
          x = d3.scaleBand().domain(yearGroups.map(String)).range([0,iw]).padding(0.25);
          var x1 = d3.scaleBand().domain(TOWNS).range([0,x.bandwidth()]).padding(0.06);
          var yMax = d3.max(rows,function(d){return d.hi;});
          y = d3.scaleLinear().domain([0,yMax*1.18]).range([ih,0]);

          var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
          var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');
          g.append('g').call(d3.axisLeft(y).tickSize(-iw).tickFormat('')).call(function(ax){ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#e8e8e8');});

          yearGroups.forEach(function(yr){
            var grp = g.append('g').attr('transform','translate('+x(String(yr))+',0)');
            data.filter(function(d){return d.year===yr;}).forEach(function(d){
              var bx = x1(d.town); var bw = x1.bandwidth();
              grp.append('rect').attr('x',bx).attr('y',y(d.val)).attr('width',bw).attr('height',ih-y(d.val))
                .attr('fill',colorByTown(d.town)).attr('rx',2)
                .on('mouseover',function(event){ttShow('<b>'+d.town+'</b> '+yr+': '+d.val+'%',event);})
                .on('mousemove',ttMove).on('mouseout',ttHide);
              grp.append('line').attr('x1',bx+bw/2).attr('x2',bx+bw/2).attr('y1',y(d.lo)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
              grp.append('line').attr('x1',bx+bw/2-4).attr('x2',bx+bw/2+4).attr('y1',y(d.hi)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
              grp.append('line').attr('x1',bx+bw/2-4).attr('x2',bx+bw/2+4).attr('y1',y(d.lo)).attr('y2',y(d.lo)).attr('stroke','#333').attr('stroke-width',1.5);
            });
          });
          g.append('g').attr('transform','translate(0,'+ih+')').call(d3.axisBottom(x)).call(function(ax){ax.select('.domain').remove();});
          g.append('g').call(d3.axisLeft(y).tickFormat(function(d){return d+'%';}).ticks(5)).call(function(ax){ax.select('.domain').remove();});
          svg.append('text').attr('x',M.left+iw/2).attr('y',H-8).attr('text-anchor','middle').attr('font-size',11).attr('fill',CD_TEXT).text('Year');

          // legend
          TOWNS.forEach(function(t,i){
            svg.append('rect').attr('x',M.left+i*105).attr('y',H-13).attr('width',10).attr('height',10).attr('fill',colorByTown(t)).attr('rx',2);
            svg.append('text').attr('x',M.left+i*105+13).attr('y',H-4).attr('font-size',11).attr('fill',CD_TEXT).text(t);
          });
        } else {
          // Single town: bars by year, colored by year
          rows = data.filter(function(d){return d.town===town;}).sort(function(a,b){return a.year-b.year;});
          x = d3.scaleBand().domain(rows.map(function(d){return String(d.year);})).range([0,iw]).padding(0.4);
          var yMax2 = d3.max(rows,function(d){return d.hi;});
          y = d3.scaleLinear().domain([0,yMax2*1.2]).range([ih,0]);

          var svg = d3.select(el).append('svg').attr('width',W).attr('height',H);
          var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');
          g.append('g').call(d3.axisLeft(y).tickSize(-iw).tickFormat('')).call(function(ax){ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#e8e8e8').attr('stroke-dasharray','3,3');});

          rows.forEach(function(d){
            var bx = x(String(d.year)); var bw = x.bandwidth();
            g.append('rect').attr('x',bx).attr('y',y(d.val)).attr('width',bw).attr('height',ih-y(d.val))
              .attr('fill',colorByYear(d.year)).attr('rx',2)
              .on('mouseover',function(event){ttShow('<b>'+d.year+'</b>: '+d.val+'% (CI: '+d.lo+'–'+d.hi+'%)',event);})
              .on('mousemove',ttMove).on('mouseout',ttHide);
            g.append('text').attr('x',bx+bw/2).attr('y',y(d.val)+ih/2.4).attr('text-anchor','middle')
              .attr('font-size',13).attr('font-weight','500').attr('fill','#fff').text(d.val+'%');
            g.append('line').attr('x1',bx+bw/2).attr('x2',bx+bw/2).attr('y1',y(d.lo)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
            g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y(d.hi)).attr('y2',y(d.hi)).attr('stroke','#333').attr('stroke-width',1.5);
            g.append('line').attr('x1',bx+bw/2-5).attr('x2',bx+bw/2+5).attr('y1',y(d.lo)).attr('y2',y(d.lo)).attr('stroke','#333').attr('stroke-width',1.5);
          });
          g.append('g').attr('transform','translate(0,'+ih+')').call(d3.axisBottom(x)).call(function(ax){ax.select('.domain').remove();});
          g.append('g').call(d3.axisLeft(y).tickFormat(function(d){return d+'%';}).ticks(5)).call(function(ax){ax.select('.domain').remove();});
          svg.append('text').attr('x',M.left+iw/2).attr('y',H-8).attr('text-anchor','middle').attr('font-size',11).attr('fill',CD_TEXT).text('Year · '+town);
        }
      }

      function cdRenderAll() {
        renderCDChart('cd-diabetes-chart', CD_DATA.diabetes, 'Diabetes prevalence (%)');
        renderCDChart('cd-obesity-chart',  CD_DATA.obesity,  'Obesity prevalence (%)');
        renderCDChart('cd-hbp-chart',      CD_DATA.hbp,      'High blood pressure (%)');
      }

      ['cd-diabetes-chart','cd-obesity-chart','cd-hbp-chart'].forEach(function(id){
        var el = document.getElementById(id);
        if (!el) return;
        var ro = new ResizeObserver(function(entries){
          if (entries[0].contentRect.width > 0) cdRenderAll();
        });
        ro.observe(el);
        if (el.offsetWidth > 0) cdRenderAll();
      });

      document.addEventListener('masterTownChange', function(e){
        cdTown = e.detail.town || 'All';
        cdRenderAll();
      });

      window.__cdRender = cdRenderAll;
    })();
})();
