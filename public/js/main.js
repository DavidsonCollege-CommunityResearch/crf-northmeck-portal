/* ── STATIC DATA LOADER ──
   Charts used to query MotherDuck live from the browser (a hardcoded token
   shipped to every visitor, plus MotherDuck's hosted CDN/query channel being
   intermittently flaky). Data is now snapshotted server-side on a schedule
   (scripts/refresh-data.mjs, run by .github/workflows/refresh-data.yml) into
   public/data/*.json, which the client just fetches like any other static
   asset — no token, no live connection, nothing MotherDuck-specific left
   in the browser at all. */
var MD_DATA_BASE = (function(){
  var s = document.currentScript;
  if (s && s.src) return s.src.replace(/js\/main\.js(?:\?.*)?$/, '');
  return './';
})();

window.loadData = async function(name){
  var res = await fetch(MD_DATA_BASE + 'data/' + name + '.json');
  if (!res.ok) throw new Error('Failed to load data/' + name + '.json: HTTP ' + res.status);
  return await res.json();
};

window.mdShowError = function(containerId){
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="md-error" style="padding:24px 12px;text-align:center;color:var(--ink-3);font-family:\'Hanken Grotesk\',sans-serif;font-size:13.5px">'
    + '<i class="ti ti-cloud-off" style="font-size:22px;display:block;margin-bottom:6px;opacity:.55"></i>'
    + "Couldn't load this chart right now.<br><a href=\"javascript:location.reload()\" style=\"color:var(--accent)\">Try refreshing the page</a></div>";
};

// Set active nav link based on current page
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a[data-page]').forEach(function(el) {
    var p = el.getAttribute('data-page');
    var matches = (p === 'home' && (path === '' || path === 'index.html')) ||
                  (path === p + '.html');
    el.classList.toggle('active', matches);
  });
});

/* ── LANGUAGE (EN / ES) ── */
window.LANG = localStorage.getItem('nm_lang') || 'en';
function applyI18n(){
  var es = window.LANG === 'es';
  document.querySelectorAll('[data-es]').forEach(function(el){
    if (el.getAttribute('data-en') === null) el.setAttribute('data-en', el.textContent);
    el.textContent = es ? el.getAttribute('data-es') : el.getAttribute('data-en');
  });
  document.querySelectorAll('[data-es-placeholder]').forEach(function(el){
    if (el.getAttribute('data-en-placeholder') === null) el.setAttribute('data-en-placeholder', el.getAttribute('placeholder') || '');
    el.setAttribute('placeholder', es ? el.getAttribute('data-es-placeholder') : el.getAttribute('data-en-placeholder'));
  });
  document.documentElement.lang = es ? 'es' : 'en';
  document.querySelectorAll('.lang-opt').forEach(function(b){ b.classList.toggle('on', b.dataset.lang === window.LANG); });
  window.dispatchEvent(new CustomEvent('langchange'));
}
function setLang(lang){
  window.LANG = (lang === 'es') ? 'es' : 'en';
  localStorage.setItem('nm_lang', window.LANG);
  applyI18n();
}
window.setLang = setLang;
document.addEventListener('DOMContentLoaded', applyI18n);

// ── Nav search ──────────────────────────────────────────────────────────────
var NAV_INDEX = [
  { title:'Housing', sub:'Affordability, displacement, homeownership', page:'housing', icon:'ti-building-community' },
  { title:'Healthcare', sub:'Insurance, access, mental health, chronic disease', page:'healthcare', icon:'ti-heartbeat' },
  { title:'Education', sub:'Enrollment, outcomes, early childhood', page:'education', icon:'ti-school' },
  { title:'Data Library', sub:'Download open datasets', page:'data', icon:'ti-database' },
  { title:'Neighborhoods', sub:'Cornelius, Davidson, Huntersville, East Catawba', page:'neighborhoods', icon:'ti-map-2' },
  { title:'Stories', sub:'Research in plain English', page:'blog', icon:'ti-newspaper' },
  { title:'About', sub:'Community Research Fellows, Davidson College', page:'about', icon:'ti-users' },
  { title:'Data Dictionary', sub:'Definitions for every term used in this portal', page:'dictionary', icon:'ti-book-2' },
  { title:'Data Sources', sub:'Where our data comes from', page:'sources', icon:'ti-file-text' },
  // Housing subtopics
  { title:'Housing Supply', sub:'Population growth, household counts, housing types', page:'housing', icon:'ti-building-community' },
  { title:'Housing Affordability', sub:'Rent-to-income ratio, home price-to-income', page:'housing', icon:'ti-cash' },
  { title:'Displacement Risk', sub:'Cost burden, ALICE households, severe burden', page:'housing', icon:'ti-alert-triangle' },
  { title:'Homeownership', sub:'Homeownership rates, racial composition', page:'housing', icon:'ti-home' },
  // Healthcare subtopics
  { title:'Health Insurance', sub:'Uninsured rates, coverage gaps', page:'healthcare', icon:'ti-shield-check' },
  { title:'Access to Care', sub:'Primary care, HPSA, healthcare providers', page:'healthcare', icon:'ti-stethoscope' },
  { title:'Mental Health', sub:'Mental health outcomes and provider access', page:'healthcare', icon:'ti-brain' },
  { title:'Maternal Health', sub:'Birth outcomes, prenatal care', page:'healthcare', icon:'ti-heart' },
  { title:'Chronic Disease', sub:'Diabetes, hypertension, obesity rates', page:'healthcare', icon:'ti-activity' },
  // Income & need
  { title:'Income & Economic Need', sub:'Gini index, poverty, ALICE, infrastructure', page:'housing', icon:'ti-trending-up' },
  { title:'Rent', sub:'Median rent trends by town', page:'housing', icon:'ti-home-dollar' },
  { title:'Home Values', sub:'Median home value by town', page:'housing', icon:'ti-building' },
  { title:'Cornelius', sub:'Town data and neighborhood profile', page:'neighborhoods', icon:'ti-map-pin' },
  { title:'Davidson', sub:'Town data and neighborhood profile', page:'neighborhoods', icon:'ti-map-pin' },
  { title:'Huntersville', sub:'Town data and neighborhood profile', page:'neighborhoods', icon:'ti-map-pin' },
];

function navSearchInput(input){
  var q = (input.value || '').trim().toLowerCase();
  var dd = document.getElementById('navSearchDd');
  if (!dd) return;
  if (!q){ dd.classList.remove('open'); dd.innerHTML=''; return; }
  var results = NAV_INDEX.filter(function(r){
    return r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q);
  }).slice(0,6);
  if (!results.length){
    dd.innerHTML='<div class="nav-search-dd-empty">No results for "'+q+'"</div>';
  } else {
    dd.innerHTML = results.map(function(r,i){
      return '<div class="nav-search-dd-item" data-idx="'+i+'" onclick="navSearchGo(\''+r.page+'\')">'
        +'<i class="ti '+r.icon+' nav-search-dd-icon"></i>'
        +'<div class="nav-search-dd-text">'
        +'<div class="nav-search-dd-title">'+r.title+'</div>'
        +'<div class="nav-search-dd-sub">'+r.sub+'</div>'
        +'</div></div>';
    }).join('');
  }
  dd._results = results;
  dd._active = -1;
  dd.classList.add('open');
}

function navSearchKey(e){
  var dd = document.getElementById('navSearchDd');
  if (!dd || !dd.classList.contains('open')) return;
  var items = dd.querySelectorAll('.nav-search-dd-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown'){ e.preventDefault(); dd._active = Math.min((dd._active||0)+1, items.length-1); items.forEach(function(el,i){ el.style.background = i===dd._active ? 'var(--bg-alt)' : ''; }); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); dd._active = Math.max((dd._active||0)-1, 0); items.forEach(function(el,i){ el.style.background = i===dd._active ? 'var(--bg-alt)' : ''; }); }
  else if (e.key === 'Enter' && dd._active >= 0 && dd._results){ navSearchGo(dd._results[dd._active].page); }
  else if (e.key === 'Escape'){ navSearchClose(); }
}

function navSearchGo(page){
  var pageMap = {home:'index.html',housing:'housing.html',education:'education.html',healthcare:'healthcare.html',blog:'blog.html',about:'about.html',data:'data.html',dictionary:'data.html',sources:'data.html',neighborhoods:'neighborhoods.html','nbhd-data':'nbhd-data.html'};
  window.location = pageMap[page] || (page + '.html');
  var inp = document.getElementById('navSearch');
  if (inp) inp.value = '';
  navSearchClose();
}
window.navSearchGo = navSearchGo;

function navSearchClose(){
  var dd = document.getElementById('navSearchDd');
  if (dd){ dd.classList.remove('open'); dd.innerHTML=''; }
}
function navSearchExpand(){
  var wrap = document.getElementById('navSearchWrap');
  var input = document.getElementById('navSearch');
  if(!wrap || !input) return;
  wrap.classList.add('expanded');
  setTimeout(function(){ input.focus(); }, 260);
}
function navSearchCollapse(){
  var wrap = document.getElementById('navSearchWrap');
  var input = document.getElementById('navSearch');
  if(!wrap || !input) return;
  if(wrap.contains(document.activeElement)) return;
  navSearchClose();
  wrap.classList.remove('expanded');
  input.value = '';
}
window.navSearchInput = navSearchInput;
window.navSearchKey = navSearchKey;
window.navSearchClose = navSearchClose;
window.navSearchExpand = navSearchExpand;
window.navSearchCollapse = navSearchCollapse;
// ────────────────────────────────────────────────────────────────────────────

function toggleDD(e, el){
  e.stopPropagation();
  var dd = el.closest('.nav-dd');
  var isOpen = dd.classList.contains('open');
  document.querySelectorAll('.nav-dd').forEach(function(d){ d.classList.remove('open'); });
  if (!isOpen) dd.classList.add('open');
}
window.toggleDD = toggleDD;
document.addEventListener('click', function(){ document.querySelectorAll('.nav-dd').forEach(function(d){ d.classList.remove('open'); }); });

function setTab(el){
  var pane = el.dataset.tab;
  var y = window.scrollY;
  el.parentElement.querySelectorAll('.tab').forEach(function(t){ t.classList.toggle('active', t === el); });
  var page = el.closest('.page');
  if (page) page.querySelectorAll('.tabpane').forEach(function(p){ p.classList.toggle('active', p.dataset.pane === pane); });
  window.scrollTo(0, y);
  requestAnimationFrame(function(){
    document.dispatchEvent(new CustomEvent('tabChange', { detail: { pane: pane } }));
    document.dispatchEvent(new CustomEvent('masterTownChange', { detail: { town: window.__masterTown || 'All' } }));
  });
}
window.setTab = setTab;

document.addEventListener('tabChange', function(e){
  var p = e.detail.pane;
  if (p === 'hc-mental'  && window.__mhRender) setTimeout(window.__mhRender, 60);
  if (p === 'hc-chronic' && window.__cdRender) setTimeout(window.__cdRender, 60);
});

function setChip(el){
  el.parentElement.querySelectorAll('.chip').forEach(function(c){ c.classList.toggle('on', c === el); });
  var label = el.textContent.trim();
  window.__masterTown = label === "All North Meck" ? "All" : label;
  document.dispatchEvent(new CustomEvent('masterTownChange', { detail: { town: window.__masterTown } }));
}
window.__masterTown = "All";
window.setChip = setChip;

/* ── SCROLL HELPERS ── */
function scrollTopSmooth(){
  var start = window.scrollY || document.documentElement.scrollTop || 0;
  if (start <= 0) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){ window.scrollTo(0, 0); return; }
  var dur = Math.min(750, Math.max(320, start * 0.55));
  var t0 = null, ease = function(p){ return 1 - Math.pow(1-p, 3); };
  function step(ts){ if (t0 === null) t0 = ts; var p = Math.min(1, (ts-t0)/dur); window.scrollTo(0, Math.round(start*(1-ease(p)))); if (p < 1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
window.scrollTopSmooth = scrollTopSmooth;

function scrollToNbhd(id){
  var el = document.getElementById(id); if (!el) return;
  var targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84);
  var start = window.scrollY || 0, dist = targetY - start;
  if (Math.abs(dist) < 2) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){ window.scrollTo(0, targetY); return; }
  var dur = Math.min(750, Math.max(320, Math.abs(dist) * 0.5));
  var t0 = null, ease = function(p){ return 1 - Math.pow(1-p, 3); };
  function step(ts){ if (t0 === null) t0 = ts; var p = Math.min(1, (ts-t0)/dur); window.scrollTo(0, Math.round(start+dist*ease(p))); if (p<1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
window.scrollToNbhd = scrollToNbhd;

function gotoNbhd(id){ window.location='neighborhoods.html'; setTimeout(function(){ scrollToNbhd(id); }, 80); }
window.gotoNbhd = gotoNbhd;

var NBHD_META = {
  pottstown:       { label:'Pottstown',        town:'Huntersville', sub:'Block-group level ACS data approximating the Pottstown area of Huntersville.', extraNote:' Pottstown spans two block groups, so its figures carry slightly more uncertainty than other neighborhoods.' },
  westdavidson:    { label:'West Davidson',     town:'Davidson',     sub:'Block-group level ACS data approximating the West Davidson area of Davidson.', extraNote:'' },
  smithville:      { label:'Smithville',        town:'Cornelius',    sub:'Block-group level ACS data approximating the Smithville area of Cornelius.', extraNote:'' },
  huntingtongreen: { label:'Huntington Green',  town:'Huntersville', sub:'Block-group level ACS data approximating the Huntington Green area of Huntersville.', extraNote:'' },
  eastcatawba:     { label:'East Catawba',      town:'Cornelius',    sub:'Data not yet available for East Catawba.', extraNote:'' }
};

function setNbhdData(btn){
  var nbhd = btn.dataset.nbhd;
  setNbhdDataByKey(nbhd);
}
window.setNbhdData = setNbhdData;

function setNbhdDataByKey(nbhd){
  var meta = NBHD_META[nbhd] || NBHD_META.pottstown;

  // Update selector buttons
  document.querySelectorAll('.nbhd-sel-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.nbhd === nbhd);
  });

  // Update header
  var titleEl = document.getElementById('nbhd-data-title');
  var subtitleEl = document.getElementById('nbhd-data-subtitle');
  var crumbEl = document.getElementById('nbhd-data-crumb');
  if(titleEl) titleEl.textContent = meta.label;
  if(subtitleEl) subtitleEl.textContent = meta.sub;
  if(crumbEl) crumbEl.textContent = meta.label;
  var disclaimer = document.getElementById('nbhd-disclaimer-text');
  if(disclaimer) disclaimer.innerHTML = '<strong>Data note:</strong> Neighborhood boundaries don\'t align perfectly with U.S. Census geography. The data shown here is from the <strong>ACS block group</strong> that best approximates each neighborhood — the smallest geographic unit the Census publishes. This means the numbers may include some residents just outside the neighborhood boundary.' + (meta.extraNote||'') + ' All data comes from the American Community Survey 5-year estimates.';

  // Show correct panel
  var dataPanel = document.getElementById('nbhd-panel-data');
  var noDataPanel = document.getElementById('nbhd-panel-eastcatawba');
  var isNoData = nbhd === 'eastcatawba';
  if(dataPanel) dataPanel.classList.toggle('active', !isNoData);
  if(noDataPanel) noDataPanel.classList.toggle('active', isNoData);

  // Reset tabs to first tab when switching neighborhoods
  if(!isNoData){
    var tabs = document.getElementById('nbhd-data-tabs');
    if(tabs){
      var first = tabs.querySelector('.tab');
      if(first){
        tabs.querySelectorAll('.tab').forEach(function(t){ t.classList.toggle('active', t === first); });
        var pane = first.dataset.tab;
        document.querySelectorAll('#page-nbhd-data .tabpane').forEach(function(p){ p.classList.toggle('active', p.dataset.pane === pane); });
      }
    }
  }
}
window.setNbhdDataByKey = setNbhdDataByKey;

/* ── FILTER CHIPS ── */
window.econChip = function(el) {
  var chart = el.getAttribute('data-econ-chart');
  var town  = el.getAttribute('data-econ-town');
  document.querySelectorAll('[data-econ-chart="'+chart+'"]').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  if (window.__renders && window.__renders[chart]) {
    window.__renders[chart](town);
  }
};

/* ── GLOSSARY ── */

function glossFilter(q){
  var t=q.trim().toLowerCase();
  var items=document.querySelectorAll('#glossaryModal .gloss');
  var any=false;
  items.forEach(function(el){
    var term=el.querySelector('.gloss-term').textContent.toLowerCase();
    var def=el.querySelector('.gloss-def').textContent.toLowerCase();
    var show=!t||term.includes(t)||def.includes(t);
    el.style.display=show?'':'none';
    if(show) any=true;
  });
  document.getElementById('glossNoResults').style.display=any?'none':'block';
}
function openGlossary(){ document.getElementById('glossaryModal').classList.add('open'); document.body.style.overflow='hidden'; var s=document.getElementById('glossSearch'); if(s){s.value='';glossFilter('');} }
function closeGlossary(){ document.getElementById('glossaryModal').classList.remove('open'); document.body.style.overflow=''; }
window.openGlossary = openGlossary; window.closeGlossary = closeGlossary;

function glossTerm(id){
  openGlossary();
  var body = document.querySelector('#glossaryModal .gloss-modal-body');
  var el = document.querySelector('#glossaryModal .gloss[data-term="'+id+'"]');
  if (!body || !el) return;
  setTimeout(function(){
    var top = Math.max(0, el.offsetTop - body.offsetTop - 18);
    try { body.scrollTo({ top: top, behavior: 'smooth' }); } catch(e){ body.scrollTop = top; }
    el.classList.remove('gloss-hit'); void el.offsetWidth; el.classList.add('gloss-hit');
    setTimeout(function(){ el.classList.remove('gloss-hit'); }, 2700);
  }, 120);
}
window.glossTerm = glossTerm;

document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ closeGlossary(); if(window.closeVizModal) window.closeVizModal(); } });

/* ── FAB ── */
function toggleFab(e){ e.stopPropagation(); document.getElementById('supportFab').classList.toggle('open'); }
window.toggleFab = toggleFab;

/* ── ACCESSIBILITY ── */
// Toggles: on/off
var A11Y_TOGGLES = ['contrast','dyslexia','spacing','motion','noimages'];
// Stepped: 0..max levels
var A11Y_STEPS = { text: 4, lh: 3, cursor: 3, sr: 3 };
var A11Y_STATE = {};
A11Y_TOGGLES.forEach(function(k){ A11Y_STATE[k] = localStorage.getItem('a11y_'+k) === '1'; });
Object.keys(A11Y_STEPS).forEach(function(k){ A11Y_STATE[k] = parseInt(localStorage.getItem('a11y_'+k)||'0',10); });

function a11yApply(){
  var html = document.documentElement;
  // Toggles
  A11Y_TOGGLES.forEach(function(k){
    html.classList.toggle('a11y-'+k, !!A11Y_STATE[k]);
    var btn = document.getElementById('a11y-'+k);
    if(btn){ btn.classList.toggle('on', !!A11Y_STATE[k]); btn.setAttribute('aria-pressed', A11Y_STATE[k]?'true':'false'); }
  });
  // Stepped
  Object.keys(A11Y_STEPS).forEach(function(k){
    var v = A11Y_STATE[k]||0;
    for(var i=1;i<=A11Y_STEPS[k];i++) html.classList.remove('a11y-'+k+'-'+i);
    if(v>0) html.classList.add('a11y-'+k+'-'+v);
    var btn = document.getElementById('a11y-'+k);
    if(btn) btn.classList.toggle('on', v>0);
    // light up bars
    document.querySelectorAll('[data-k="'+k+'"]').forEach(function(bar){
      bar.classList.toggle('lit', parseInt(bar.dataset.v,10) <= v);
    });
  });
  // Toggle bars (single bar)
  A11Y_TOGGLES.forEach(function(k){
    document.querySelectorAll('[data-k="'+k+'"]').forEach(function(bar){
      bar.classList.toggle('lit', !!A11Y_STATE[k]);
    });
  });
  // Screen reader on/off
  if((A11Y_STATE.sr||0) > 0) srOn(); else srOff();
  // OpenDyslexic on demand
  if(A11Y_STATE.dyslexia && !document.getElementById('od-font')){
    var lnk=document.createElement('link'); lnk.id='od-font'; lnk.rel='stylesheet';
    lnk.href='https://fonts.cdnfonts.com/css/opendyslexic'; document.head.appendChild(lnk);
  }
}

function a11yToggle(k){
  A11Y_STATE[k] = !A11Y_STATE[k];
  localStorage.setItem('a11y_'+k, A11Y_STATE[k]?'1':'0');
  a11yApply();
}

function a11yStep(k, max){
  A11Y_STATE[k] = ((A11Y_STATE[k]||0) % max) + 1;
  // clicking at max wraps back to 0
  if(A11Y_STATE[k] > max) A11Y_STATE[k] = 0;
  localStorage.setItem('a11y_'+k, A11Y_STATE[k]);
  a11yApply();
}

function a11yReset(){
  A11Y_TOGGLES.forEach(function(k){ A11Y_STATE[k]=false; localStorage.removeItem('a11y_'+k); });
  Object.keys(A11Y_STEPS).forEach(function(k){ A11Y_STATE[k]=0; localStorage.removeItem('a11y_'+k); });
  srOff();
  a11yApply();
}

/* ── SCREEN READER (TTS) ── */
var SR_RATES = [0, 0.7, 1.0, 1.5];
var __srActive = false;

function srSpeak(text){
  if(!window.speechSynthesis || !text.trim()) return;
  window.speechSynthesis.cancel();
  var utt = new SpeechSynthesisUtterance(text.trim());
  utt.rate = SR_RATES[A11Y_STATE.sr || 0] || 1.0;
  window.speechSynthesis.speak(utt);
}

function srHandleFocus(e){
  var el = e.target;
  var READ = 'p, li, h1, h2, h3, h4, label, .callout-t, .card-t, .stat-v, .stat-l, button, a, .gloss-term';
  var src = el.matches(READ) ? el : el.closest(READ);
  if(src) srSpeak(src.innerText || src.textContent);
}

function srOn(){
  if(__srActive) return;
  __srActive = true;
  document.addEventListener('focusin', srHandleFocus);
  document.addEventListener('click', srHandleFocus);
}

function srOff(){
  if(!__srActive) return;
  __srActive = false;
  document.removeEventListener('focusin', srHandleFocus);
  document.removeEventListener('click', srHandleFocus);
  if(window.speechSynthesis) window.speechSynthesis.cancel();
}

function toggleA11y(){
  var panel=document.getElementById('a11yPanel');
  var isOpen=panel.classList.toggle('open');
  document.getElementById('a11yBtn').setAttribute('aria-expanded',isOpen);
  if(isOpen){ document.addEventListener('click',a11yOutside,true); }
  else { document.removeEventListener('click',a11yOutside,true); }
}
function a11yOutside(e){
  var panel=document.getElementById('a11yPanel'), btn=document.getElementById('a11yBtn');
  if(!panel.contains(e.target)&&!btn.contains(e.target)){
    panel.classList.remove('open'); btn.setAttribute('aria-expanded','false');
    document.removeEventListener('click',a11yOutside,true);
  }
}
window.toggleA11y=toggleA11y; window.a11yToggle=a11yToggle; window.a11yStep=a11yStep; window.a11yReset=a11yReset;
a11yApply();
document.addEventListener('click', function(e){ var fab = document.getElementById('supportFab'); if (fab && fab.classList.contains('open') && !fab.contains(e.target)) fab.classList.remove('open'); });

/* ── MAP ── */
(function(){
  var modal = document.getElementById('nmapModal');
  var stage = document.getElementById('nmapStage');
  var tip   = document.getElementById('nmapTip');
  if (!modal || !stage) return;
  function nmapMove(e){ var r = stage.getBoundingClientRect(); tip.style.left=(e.clientX-r.left)+'px'; tip.style.top=(e.clientY-r.top)+'px'; }
  function nmapHide(){ tip.classList.remove('on'); }
  window.openMap = function(){ modal.classList.add('open'); document.body.style.overflow='hidden'; };
  window.closeMap = function(){ modal.classList.remove('open'); document.body.style.overflow=''; nmapHide(); };
  document.addEventListener('keydown', function(e){ if (e.key==='Escape' && modal.classList.contains('open')) window.closeMap(); });
  stage.querySelectorAll('[data-nmap]').forEach(function(el){
    el.addEventListener('mouseenter', function(e){
      var name=el.getAttribute('data-name'), town=el.getAttribute('data-town');
      tip.innerHTML = town ? '<b>'+name+'</b><span>in '+town+'</span>' : '<b>'+name+'</b><span>Town</span>';
      tip.classList.add('on'); nmapMove(e);
    });
    el.addEventListener('mousemove', nmapMove);
    el.addEventListener('mouseleave', nmapHide);
  });
})();

/* ── DATA LIBRARY ── */
(function(){
  var state = { search:'', geo:'all', topic:'all' };

  /* ── filter / UI ── */
  window.dlibToggle = function(btn){
    var dd=btn.closest('.dlib-dd'), open=dd.classList.contains('open');
    document.querySelectorAll('.dlib-dd').forEach(function(d){ d.classList.remove('open'); });
    if (!open) dd.classList.add('open');
  };
  document.addEventListener('click', function(e){ if (!e.target.closest('.dlib-dd')) document.querySelectorAll('.dlib-dd').forEach(function(d){ d.classList.remove('open'); }); });
  window.dlibPick = function(opt){
    var dd=opt.closest('.dlib-dd'), key=dd.getAttribute('data-key'), val=opt.getAttribute('data-val');
    state[key]=val;
    dd.querySelectorAll('.dlib-dd-opt').forEach(function(o){ o.classList.toggle('on', o===opt); });
    var btn=dd.querySelector('.dlib-dd-btn'), txt=btn.querySelector('.dlib-dd-txt');
    btn.classList.toggle('active', val!=='all');
    txt.textContent=(val==='all')?btn.getAttribute('data-label'):opt.textContent.trim();
    dd.classList.remove('open');
    window.dlibFilter();
  };
  window.dlibFilter = function(){
    var sEl=document.getElementById('dlibSearch');
    state.search=(sEl&&sEl.value?sEl.value:'').trim().toLowerCase();
    var any=false;
    document.getElementById('dlibResults').querySelectorAll('.dlib-row').forEach(function(r){
      var ok=true;
      if (state.search && r.getAttribute('data-name').indexOf(state.search)<0) ok=false;
      if (state.geo!=='all' && r.getAttribute('data-geo')!==state.geo) ok=false;
      if (state.topic!=='all' && (' '+r.getAttribute('data-topic')+' ').indexOf(' '+state.topic+' ')<0) ok=false;
      r.style.display=ok?'':'none';
      if (ok) any=true;
    });
    document.getElementById('dlibResults').querySelectorAll('.dlib-section').forEach(function(s){
      var vis=Array.prototype.some.call(s.querySelectorAll('.dlib-row'),function(r){ return r.style.display!=='none'; });
      s.style.display=vis?'':'none';
    });
    document.getElementById('dlibEmpty').style.display=any?'none':'block';
  };
  window.dlibClear = function(){
    state={search:'',geo:'all',topic:'all'};
    var s=document.getElementById('dlibSearch'); if(s) s.value='';
    document.querySelectorAll('.dlib-dd').forEach(function(dd){
      var btn=dd.querySelector('.dlib-dd-btn'),txt=btn.querySelector('.dlib-dd-txt');
      btn.classList.remove('active'); txt.textContent=btn.getAttribute('data-label');
      dd.querySelectorAll('.dlib-dd-opt').forEach(function(o){ o.classList.toggle('on',o.getAttribute('data-val')==='all'); });
    });
    window.dlibFilter();
  };

  /* ── dataset registry ── */
  var DATASETS = {
    'economic-trends': {
      filename: 'nmidw_economic_trends_2018-2024',
      source: 'U.S. Census Bureau, American Community Survey (ACS) 5-year estimates',
      years: '2018–2024',
      jsonFile: 'dlib-economic-trends',
      codebook: [
        ['town','text','Municipality name (Cornelius, Davidson, or Huntersville)'],
        ['year','integer','ACS survey year'],
        ['median_rent_monthly_usd','integer','Median gross rent in dollars per month (ACS Table B25064)'],
        ['median_household_income_usd','integer','Median household income in dollars (ACS Table B19013)'],
        ['median_home_value_usd','integer','Median owner-occupied home value in dollars (ACS Table B25077)'],
        ['home_price_to_income_ratio','decimal','Median home value ÷ median household income. Ratios above 3× are considered unaffordable by conventional standards; above 4× signals severe pressure for first-time buyers.'],
        ['rent_to_income_pct','decimal','Annual rent (monthly × 12) as a percentage of median household income. HUD defines cost burden at 30%.'],
        ['gini_coefficient','decimal','Gini coefficient for income inequality within the town (0 = perfect equality, 1 = maximum inequality). Derived from ACS income distribution tables.']
      ],
      notes: 'All dollar values are nominal (not inflation-adjusted). ACS 5-year estimates carry a margin of error; small-area figures for Davidson may be imprecise due to small sample size.'
    },
    'housing-burden': {
      filename: 'nmidw_housing_burden_2018-2024',
      source: 'U.S. Census Bureau, American Community Survey (ACS) 5-year estimates',
      years: '2018–2024',
      jsonFile: 'dlib-housing-burden',
      codebook: [
        ['town','text','Municipality name (Cornelius, Davidson, or Huntersville)'],
        ['year','integer','ACS survey year'],
        ['total_households','integer','Total number of renter households in the town'],
        ['cost_burdened_households','integer','Renter households spending 30–50% of gross income on housing (ACS CHAS)'],
        ['severely_cost_burdened_households','integer','Renter households spending more than 50% of gross income on housing (ACS CHAS). At this level, households have less than half their income for food, healthcare, transportation, and savings.'],
        ['cost_burden_rate_pct','decimal','Share of renter households that are cost-burdened (spending 30%+), as a percentage']
      ],
      notes: 'Cost burden is measured for renter households only. The 30% threshold is the HUD standard definition of housing cost burden. ACS 5-year estimates.'
    },
    'burden-by-bracket': {
      filename: 'nmidw_cost_burden_by_bracket_2024',
      source: 'U.S. Census Bureau, ACS Comprehensive Housing Affordability Strategy (CHAS) via HUD',
      years: '2024',
      jsonFile: 'dlib-burden-by-bracket',
      codebook: [
        ['town','text','Municipality name (Cornelius, Davidson, or Huntersville)'],
        ['tenure','text','Housing tenure: Renter or Owner'],
        ['income_bracket','text','Household income bracket (7 levels from Less than $10k to $100k+)'],
        ['burden','text','Cost burden category: Not burdened (<30%), Cost burdened (30-50%), or Severely burdened (50%+)'],
        ['count','integer','Estimated number of households in this town/tenure/bracket/burden combination. Zero may indicate suppressed small values.']
      ],
      notes: 'Source: ACS CHAS (Comprehensive Housing Affordability Strategy) data via HUD, 2024. Small cell counts (under 10 households) are suppressed and shown as 0. Use row totals with caution for Davidson due to small sample size.'
    },
    'ptr-by-bracket': {
      filename: 'nmidw_home_affordability_by_bracket_2024',
      source: 'U.S. Census Bureau, American Community Survey (ACS) 5-year estimates, 2024',
      years: '2024',
      jsonFile: 'dlib-ptr-by-bracket',
      codebook: [
        ['town','text','Municipality name (Cornelius, Davidson, or Huntersville)'],
        ['home_value','integer','Median home value in dollars for the town (ACS Table B25077, 2024)'],
        ['income_bracket','text','Household income bracket'],
        ['midpoint','integer','Midpoint of the income bracket in dollars, used as the denominator for the ratio'],
        ['ratio','decimal','Years of gross income to purchase the median home: median_home_value ÷ income_bracket_midpoint. Does not account for down payment, mortgage rates, or property taxes.']
      ],
      notes: 'The ratio is a simplified affordability metric. A ratio of 3× is the conventional threshold for "affordable" homeownership; ratios above 4× are considered severely unaffordable. This metric does not account for mortgage interest rates, which significantly affect monthly payment affordability.'
    },
    'demographics': {
      filename: 'nmidw_demographics_2018-2024',
      source: 'U.S. Census Bureau, American Community Survey (ACS) 5-year estimates',
      years: '2018–2024',
      jsonFile: 'dlib-demographics',
      codebook: [
        ['town','text','Municipality name (Cornelius, Davidson, or Huntersville)'],
        ['year','integer','ACS survey year'],
        ['total_population','integer','Total resident population estimate (ACS Table B01003)'],
        ['total_households','integer','Total number of occupied housing units (ACS Table B11001)'],
        ['median_household_income_usd','integer','Median household income in dollars (ACS Table B19013). Includes all income sources before taxes.']
      ],
      notes: 'ACS 5-year estimates are rolling averages centered on the reference year. Population and household counts reflect ACS estimates, not decennial Census counts. Racial composition data is available separately in the portal charts.'
    }
  };

  /* ── helpers ── */
  function toast(msg, dur){
    var t=document.getElementById('dlibToast');
    t.innerHTML=msg; t.classList.add('on');
    clearTimeout(t._timer);
    t._timer=setTimeout(function(){ t.classList.remove('on'); }, dur||3000);
  }

  function triggerDownload(content, filename, mime){
    var blob=new Blob([content],{type:mime});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function rowsToCSV(rows){
    if (!rows.length) return '';
    var headers=Object.keys(rows[0]);
    var lines=[headers.join(',')];
    rows.forEach(function(r){
      lines.push(headers.map(function(h){
        var v=r[h]==null?'':String(r[h]);
        return v.includes(',')||v.includes('"')||v.includes('\n') ? '"'+v.replace(/"/g,'""')+'"' : v;
      }).join(','));
    });
    return lines.join('\r\n');
  }

  function rowsToExcelHTML(rows, title){
    if (!rows.length) return '';
    var headers=Object.keys(rows[0]);
    var hRow='<tr>'+headers.map(function(h){ return '<th style="background:#3f4e75;color:#fff;font-weight:bold;padding:6px 10px">'+h+'</th>'; }).join('')+'</tr>';
    var dRows=rows.map(function(r,i){
      var bg=i%2===0?'#ffffff':'#f5f6fa';
      return '<tr>'+headers.map(function(h){
        return '<td style="padding:5px 10px;background:'+bg+'">'+( r[h]==null?'':r[h] )+'</td>';
      }).join('')+'</tr>';
    }).join('');
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>table{border-collapse:collapse}th,td{border:1px solid #ddd}</style></head><body><h2 style="font-family:Arial">'+title+'</h2><p style="font-family:Arial;color:#666;font-size:12px">Source: North Meck Insights · northmeckinsights.org · Downloaded '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+'</p><table>'+hRow+dRows+'</table></body></html>';
  }

  function buildCodebook(ds, datasetName){
    var lines=[
      'NORTH MECK INSIGHTS — DATA CODEBOOK',
      '=====================================',
      'Dataset: '+datasetName,
      'Source:  '+ds.source,
      'Years:   '+ds.years,
      'Published by: Community Research Fellows, Davidson College',
      'Downloaded:   '+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
      '',
      'COLUMN DEFINITIONS',
      '------------------'
    ];
    ds.codebook.forEach(function(c){
      lines.push(c[0].padEnd(38)+c[1].padEnd(12)+c[2]);
    });
    lines.push('','NOTES','-----',ds.notes,'','For methodology and full source citations, visit northmeckinsights.org/sources');
    return lines.join('\r\n');
  }

  /* ── inline JSON datasets (hardcoded in page) ── */
  /* ── main download handler ── */
  var toastT;
  window.dlibDownload = async function(e, fmt){
    var btn=e.target.closest('.dlib-dl');
    var row=e.target.closest('.dlib-row');
    var dsId=row?row.getAttribute('data-id'):'';
    var dsName=row?row.querySelector('.dlib-row-name').textContent.trim():'Dataset';
    var ds=DATASETS[dsId];
    if (!ds){ toast('Dataset not found.'); return; }

    if (fmt==='Codebook'){
      triggerDownload(buildCodebook(ds,dsName), ds.filename+'_codebook.txt', 'text/plain;charset=utf-8');
      toast('<b>Codebook</b> downloaded · '+dsName, 2800);
      return;
    }

    /* set loading state */
    btn.classList.add('loading');
    var origHTML=btn.innerHTML;
    btn.innerHTML='<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Loading…';
    toast('Fetching data…', 30000);

    try {
      var rows=[];

      if (ds.jsonFile){
        rows=await window.loadData(ds.jsonFile);
      }

      if (!rows.length) throw new Error('No data returned.');

      var today=new Date().toISOString().slice(0,10);
      if (fmt==='CSV'){
        triggerDownload(rowsToCSV(rows), ds.filename+'_'+today+'.csv', 'text/csv;charset=utf-8');
        toast('<b>CSV</b> downloaded · '+rows.length+' rows', 2800);
      } else {
        triggerDownload(rowsToExcelHTML(rows,dsName), ds.filename+'_'+today+'.xls', 'application/vnd.ms-excel');
        toast('<b>Excel</b> downloaded · '+rows.length+' rows', 2800);
      }
    } catch(err){
      toast('Error: '+err.message, 4000);
      console.error('dlibDownload error:', err);
    } finally {
      btn.classList.remove('loading');
      btn.innerHTML=origHTML;
    }
  };
})();

/* ── FACTS BAR ── */
var FACTS = [
  { icon:'ti-ripple',title:'Lake Norman',desc:"NC's largest man-made lake, formed by damming the Catawba River in 1963." },
  { icon:'ti-building-bank',title:'Davidson College',desc:'Founded in 1837; its best-known alumnus is NBA star Stephen Curry.' },
  { icon:'ti-history',title:"Battle of Cowan's Ford",desc:'General Davidson fell here in 1781, now beneath Lake Norman.' },
  { icon:'ti-home-heart',title:'Smithville',desc:'Settled in 1908 by formerly enslaved families on land sold by Jacob Smith.' },
  { icon:'ti-plant',title:'How Cornelius began',desc:"The town was born from an 1890s dispute over weighing cotton." },
  { icon:'ti-school',title:'Torrence-Lytle School',desc:"From 1937–1966, the area's only high school for Black students." },
  { icon:'ti-train',title:'The railroad town',desc:'Incorporated in 1873, Huntersville grew up around its rail depot.' },
  { icon:'ti-building-factory',title:'Linden Cotton Factory',desc:"Davidson's first textile mill, built on Depot Street in 1890." },
  { icon:'ti-trending-up',title:'A fast-growing region',desc:'Huntersville grew from 4,000 residents in 1990 to 60,000 today.' },
  { icon:'ti-walk',title:'Walkable by design',desc:'Davidson banned drive-thru windows in the 1990s to stay walkable.' },
  { icon:'ti-feather',title:'Carolina Raptor Center',desc:'At Latta Preserve, home to 30+ species of eagles and owls.' },
  { icon:'ti-flag',title:'Loch Norman Games',desc:'Historic Rural Hill hosts the Loch Norman Highland Games each April.' },
  { icon:'ti-building-monument',title:'A protected downtown',desc:"Davidson's core earned National Register Historic status in 2009." },
  { icon:'ti-droplet',title:'Mountain Island Lake',desc:'A Catawba reservoir supplying drinking water across Mecklenburg.' }
];
var FACTS_ES = [
  { title:'Lago Norman',desc:'El lago artificial más grande de NC, formado al represar el río Catawba en 1963.' },
  { title:'Davidson College',desc:'Fundado en 1837; su exalumno más conocido es la estrella de la NBA Stephen Curry.' },
  { title:"Batalla de Cowan's Ford",desc:'El general Davidson cayó aquí en 1781, hoy bajo el lago Norman.' },
  { title:'Smithville',desc:'Fundado en 1908 por familias anteriormente esclavizadas en tierras vendidas por Jacob Smith.' },
  { title:'Cómo nació Cornelius',desc:'El pueblo surgió de una disputa de la década de 1890 sobre el pesaje del algodón.' },
  { title:'Escuela Torrence-Lytle',desc:'De 1937 a 1966, la única secundaria de la zona para estudiantes negros.' },
  { title:'El pueblo del ferrocarril',desc:'Incorporado en 1873, Huntersville creció alrededor de su estación de tren.' },
  { title:'Fábrica de algodón Linden',desc:"El primer molino textil de Davidson, construido en Depot Street en 1890." },
  { title:'Una región de rápido crecimiento',desc:'Huntersville pasó de 4,000 residentes en 1990 a 60,000 hoy.' },
  { title:'Caminable por diseño',desc:'Davidson prohibió las ventanillas de autoservicio en los años 90 para seguir siendo caminable.' },
  { title:'Carolina Raptor Center',desc:'En Latta Preserve, hogar de más de 30 especies de águilas y búhos.' },
  { title:'Juegos de Loch Norman',desc:'El histórico Rural Hill hosts the Loch Norman Highland Games cada abril.' },
  { title:'Un centro protegido',desc:'El núcleo de Davidson obtuvo el estatus histórico del Registro Nacional en 2009.' },
  { title:'Lago Mountain Island',desc:'Un embalse del Catawba que suministra agua potable en todo Mecklenburg.' }
];
(function(){
  var bar=document.getElementById('factsBar'); if(!bar) return;
  var rot=document.getElementById('factsRot');
  var iconEl=document.getElementById('factIcon'),titleEl=document.getElementById('factTitle'),descEl=document.getElementById('factDesc');
  var i=0, paused=false, swapT;
  function paint(n){
    var f=(window.LANG==='es'&&FACTS_ES[n])?FACTS_ES[n]:FACTS[n];
    iconEl.className='ti '+FACTS[n].icon;
    titleEl.textContent=f.title; descEl.textContent=f.desc;
  }
  window.addEventListener('langchange',function(){ paint(i); });
  function swap(){
    rot.style.opacity=0; rot.style.transform='translateY(4px)';
    clearTimeout(swapT);
    swapT=setTimeout(function(){ i=(i+1)%FACTS.length; paint(i); rot.style.opacity=1; rot.style.transform='none'; }, 400);
  }
  paint(0);
  bar.addEventListener('mouseenter',function(){ paused=true; });
  bar.addEventListener('mouseleave',function(){ paused=false; });
  setInterval(function(){ if(!paused) swap(); }, 7000);
})();

/* ── DATA SPOTLIGHT CAROUSEL ── */
var SPOT = [
  { topic:'housing',   label:'Housing',   label_es:'Vivienda',       icon:'ti-building-community', h:'The housing squeeze, in four numbers',   h_es:'La presión de la vivienda, en cuatro cifras',   lead:'A quick read on affordability in North Meck; the fuller picture lives in the topic dashboards.', lead_es:'Una lectura rápida sobre la asequibilidad en North Meck; el panorama completo está en los paneles temáticos.' },
  { topic:'education', label:'Education', label_es:'Educación',      icon:'ti-school',             h:'The opportunity gap at a glance',         h_es:'La brecha de oportunidades de un vistazo',       lead:'How North Meck students are faring across reading, attendance, and resources, and where the gaps open widest.', lead_es:'Cómo les va a los estudiantes de North Meck en lectura, asistencia y recursos, y dónde se abren más las brechas.' },
  { topic:'healthcare', label:'Healthcare', label_es:'Salud',             icon:'ti-heartbeat',          h:'Coverage gaps hiding in plain sight',     h_es:'Brechas de cobertura a plena vista',             lead:'Who is uninsured in North Meck, which age groups face the most risk, and how employment status shapes access to care.', lead_es:'Quiénes no tienen seguro en North Meck, qué grupos de edad enfrentan mayor riesgo y cómo el empleo define el acceso a la salud.' },
];
var TR = function(o,f){ return (window.LANG==='es' && o[f+'_es']) ? o[f+'_es'] : o[f]; };
(function(){
  var track=document.getElementById('spotTrack'); if(!track) return;
  var hEl=document.getElementById('spotH'),leadEl=document.getElementById('spotLead');
  var topicEl=document.getElementById('spotTopic'),topicIcon=document.getElementById('spotTopicIcon'),topicName=document.getElementById('spotTopicName');
  var dotsWrap=document.getElementById('spotDots'),prev=document.getElementById('spotPrev'),next=document.getElementById('spotNext'); if(!dotsWrap||!prev||!next) return;
  var idx=0, swapTimer, scrollTimer;
  SPOT.forEach(function(s,i){
    var b=document.createElement('button');
    b.className='spot-dot'+(i===0?' on':'');
    b.setAttribute('aria-label','Show '+s.topic+' spotlight');
    b.addEventListener('click',function(){ spotGo(i); });
    dotsWrap.appendChild(b);
  });
  function render(i){
    hEl.style.opacity=0; leadEl.style.opacity=0;
    if(topicEl){ topicEl.style.opacity=0; topicEl.dataset.topic=SPOT[i].topic; }
    clearTimeout(swapTimer);
    swapTimer=setTimeout(function(){
      hEl.textContent=TR(SPOT[i],'h'); leadEl.textContent=TR(SPOT[i],'lead');
      if(topicIcon) topicIcon.className='ti '+SPOT[i].icon;
      if(topicName) topicName.textContent=TR(SPOT[i],'label');
      hEl.style.opacity=1; leadEl.style.opacity=1;
      if(topicEl) topicEl.style.opacity=1;
    }, 170);
    Array.prototype.forEach.call(dotsWrap.children,function(d,j){ d.classList.toggle('on',j===i); });
    prev.disabled=(i===0); next.disabled=(i===SPOT.length-1);
  }
  window.spotGo=function(i){ i=Math.max(0,Math.min(SPOT.length-1,i)); idx=i; render(i); track.scrollTo({left:i*track.clientWidth,behavior:'smooth'}); };
  window.spotStep=function(d){ window.spotGo(idx+d); };
  window.addEventListener('langchange',function(){ render(idx); });
  function syncFromScroll(){
    var i=Math.max(0,Math.min(SPOT.length-1,Math.round(track.scrollLeft/track.clientWidth)));
    if(i!==idx){ idx=i; render(i); }
  }
  track.addEventListener('scroll',function(){ clearTimeout(scrollTimer); scrollTimer=setTimeout(syncFromScroll,90); });
  track.scrollLeft=0; render(0);
  requestAnimationFrame(function(){ track.scrollLeft=0; });
  window.addEventListener('load',function(){ track.scrollLeft=0; idx=0; render(0); });
  window.addEventListener('pagehide',function(){ track.scrollLeft=0; });
  window.addEventListener('beforeunload',function(){ track.scrollLeft=0; });
})();

/* ── BLOG CAROUSEL ── */
(function(){
  var track=document.getElementById('blogTrack'); if(!track) return;
  var prev=document.getElementById('blogPrev'),next=document.getElementById('blogNext');
  function stepBy(){ var card=track.querySelector('.bcard'); return card?card.getBoundingClientRect().width+22:track.clientWidth; }
  function update(){ var max=track.scrollWidth-track.clientWidth-2; prev.disabled=track.scrollLeft<=2; next.disabled=track.scrollLeft>=max; }
  window.blogStep=function(d){ track.scrollBy({left:d*stepBy(),behavior:'smooth'}); };
  var t; track.addEventListener('scroll',function(){ clearTimeout(t); t=setTimeout(update,90); });
  track.scrollLeft=0; update();
  window.addEventListener('load',function(){ track.scrollLeft=0; update(); });
  window.addEventListener('pagehide',function(){ track.scrollLeft=0; });
})();

/* ── TOPICS CAROUSEL ── */
(function(){
  var track=document.getElementById('topicsTrack'); if(!track) return;
  track.scrollLeft=0;
  window.addEventListener('load',function(){ track.scrollLeft=0; });
})();

/* ── NEIGHBORHOODS CAROUSEL ── */
(function(){
  var track=document.getElementById('nbhdTrack'); if(!track) return;
  var prev=document.getElementById('nbhdPrev'),next=document.getElementById('nbhdNext');
  function stepBy(){ var card=track.querySelector('.nbhd-tcard'); return card?card.getBoundingClientRect().width+16:track.clientWidth; }
  function update(){ var max=track.scrollWidth-track.clientWidth-2; prev.disabled=track.scrollLeft<=2; next.disabled=track.scrollLeft>=max; }
  window.nbhdStep=function(d){ track.scrollBy({left:d*stepBy(),behavior:'smooth'}); };
  var t; track.addEventListener('scroll',function(){ clearTimeout(t); t=setTimeout(update,90); });
  track.scrollLeft=0; update();
  window.addEventListener('load',function(){ track.scrollLeft=0; update(); });
  window.addEventListener('pagehide',function(){ track.scrollLeft=0; });
})();

/* ── ROTATING STORY LINKS ── */
(function(){
  var STORY = {
    housing: [
      { t:'Why it now takes $31 an hour to afford a one-bedroom', t_es:'Por qué ahora se necesitan $31 por hora para pagar un apartamento de una habitación', go:'post-housing' },
      { t:'Black renters are twice as likely to be cost-burdened', t_es:'Los inquilinos negros tienen el doble de probabilidad de estar sobrecargados por el costo', go:'post-housing' },
      { t:'52,000 filings: what the eviction data really tells us', t_es:'52,000 demandas: lo que los datos de desalojo realmente nos dicen', go:'post-housing' }
    ],
    education: [{ t:'The racial makeup of North Meck schools, explained', t_es:'La composición racial de las escuelas de North Meck, explicada', go:'blog' }],
    healthcare: [{ t:'Why young adults in North Meck are falling through the coverage gap', go:'blog' }],
  };
  var ST=function(o){ return (window.LANG==='es'&&o.t_es)?o.t_es:o.t; };
  var HOLD=4500, ANIM=430;
  window.storyGo=function(btn){ window.location = (btn._go === 'post-housing' ? 'blog' : (btn._go||'blog')) + '.html'; };
  document.querySelectorAll('.spot-readmore[data-topic]').forEach(function(btn){
    var list=STORY[btn.dataset.topic]||[];
    if(!list.length) return;
    var el=btn.querySelector('.rs-title'),txt=btn.querySelector('.rs-text');
    var i=0;
    txt.textContent=ST(list[i]); btn._go=list[i].go;
    window.addEventListener('langchange',function(){ txt.textContent=ST(list[i]); });
    if(list.length<2) return;
    setInterval(function(){
      el.style.transition='transform .42s cubic-bezier(.4,0,.2,1), opacity .42s ease';
      el.style.transform='translateY(-115%)'; el.style.opacity='0';
      setTimeout(function(){
        i=(i+1)%list.length; txt.textContent=ST(list[i]); btn._go=list[i].go;
        el.style.transition='none'; el.style.transform='translateY(115%)';
        void el.offsetHeight;
        el.style.transition='transform .42s cubic-bezier(.4,0,.2,1), opacity .42s ease';
        el.style.transform='translateY(0)'; el.style.opacity='1';
      }, ANIM);
    }, HOLD);
  });
})();

/* ── VIZ EXPAND ── */
(function(){
  function makeTools(host){
    var tools=document.createElement('div'); tools.className='viz-tools';
    var share=document.createElement('button'); share.className='viz-share'; share.type='button';
    share.setAttribute('aria-label','Share or download this visualization');
    share.innerHTML='<i class="ti ti-share-2"></i>';
    share.onclick=function(e){ e.stopPropagation(); if(window.openSharePop) window.openSharePop(share,host,'viz'); };
    var b=document.createElement('button'); b.className='viz-expand'; b.type='button';
    b.setAttribute('aria-label','Expand chart for a larger view');
    b.onclick=function(e){ e.stopPropagation(); window.expandViz(b); };
    b.innerHTML='<i class="ti ti-arrows-diagonal"></i><span>Expand</span>';
    tools.appendChild(share); tools.appendChild(b); return tools;
  }
  function initViz(){
    var set=new Set();
    document.querySelectorAll('.bars').forEach(function(bars){
      if(bars.closest('.minichart')) return;
      set.add(bars.closest('.card')||bars.parentElement);
    });
    document.querySelectorAll('.minichart').forEach(function(m){ set.add(m); });
    document.querySelectorAll('.map-ph').forEach(function(m){ set.add(m); });
    document.querySelectorAll('.srow-viz').forEach(function(s){ set.add(s); });
    set.forEach(function(root){
      if(!root||root.classList.contains('viz-host')) return;
      root.classList.add('viz-host'); root.appendChild(makeTools(root));
    });
    document.querySelectorAll('.viz-host').forEach(function(root){
      if(root.querySelector('.viz-tools')) return;
      root.appendChild(makeTools(root));
    });
    document.querySelectorAll('table').forEach(function(tbl){
      if(tbl.closest('.viz-host')) return;
      var host=document.createElement('div'); host.className='viz-host table-host';
      tbl.parentNode.insertBefore(host,tbl); host.appendChild(tbl); host.appendChild(makeTools(host));
    });
  }
  window.expandViz=function(btn){
    var root=btn.closest('.viz-host'); if(!root) return;
    window.__vizHost=root;
    window.__vizParent=root.parentNode;
    window.__vizNext=root.nextSibling;
    var body=document.getElementById('vizBody'); body.innerHTML='';
    root.classList.add('viz-clone');
    body.appendChild(root); // move (not clone) — keeps all event listeners
    document.getElementById('vizModal').classList.add('open'); document.body.style.overflow='hidden';
    // Re-render charts at modal width after layout settles
    setTimeout(function(){
      document.dispatchEvent(new CustomEvent('masterTownChange', { detail: { town: window.__masterTown || 'All' } }));
      document.dispatchEvent(new CustomEvent('tabChange', { detail: { pane: 'expand' } }));
      // Force ResizeObserver-based charts to re-render at modal width
      root.querySelectorAll('[id^="chart-"]').forEach(function(el){
        var w = el.offsetWidth;
        if(w > 0){ el.style.width=(w-1)+'px'; requestAnimationFrame(function(){ el.style.width=''; }); }
      });
    }, 80);
  };
  window.closeVizModal=function(){
    var m=document.getElementById('vizModal'); if(m) m.classList.remove('open');
    document.body.style.overflow='';
    // move element back to its original position
    if(window.__vizHost && window.__vizParent){
      window.__vizHost.classList.remove('viz-clone');
      if(window.__vizNext && window.__vizNext.parentNode===window.__vizParent){
        window.__vizParent.insertBefore(window.__vizHost, window.__vizNext);
      } else {
        window.__vizParent.appendChild(window.__vizHost);
      }
      window.__vizHost=null; window.__vizParent=null; window.__vizNext=null;
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initViz);
  else initViz();
})();

/* ── BAR CHART TOOLTIPS (v1 feature) ── */
(function(){
  var tooltip=document.getElementById('chartTooltip');
  var ttVal=document.getElementById('ttVal'),ttLabel=document.getElementById('ttLabel'),ttSrc=document.getElementById('ttSrc');
  document.querySelectorAll('.bar[data-val]').forEach(function(bar){
    bar.addEventListener('mouseenter',function(){
      ttVal.textContent=bar.dataset.val; ttLabel.textContent=bar.dataset.label; ttSrc.textContent='Source: '+bar.dataset.src;
      tooltip.classList.add('visible');
    });
    bar.addEventListener('mousemove',function(e){
      var x=e.clientX+14, y=e.clientY-10, tw=tooltip.offsetWidth;
      tooltip.style.left=(x+tw>window.innerWidth?e.clientX-tw-14:x)+'px'; tooltip.style.top=y+'px';
    });
    bar.addEventListener('mouseleave',function(){ tooltip.classList.remove('visible'); });
  });
})();

/* ── GLOSSARY TERM LINKING ── */
(function(){
  var TERMS = [
    { id:'severely-cost-burdened', a:[['severely[\\s-]+cost[\\s-]+burdened?',false]] },
    { id:'cost-burdened',          a:[['cost[\\s-]+burdened?',false]] },
    { id:'ami',                    a:[['area median income',false],['AMI',true]] },
    { id:'fmr',                    a:[['fair market rent',false],['FMR',true]] },
    { id:'noah',                   a:[['naturally occurring affordable housing',false],['NOAH',true]] },
    { id:'eviction-filing',        a:[['eviction filings?',false],['eviction cases?',false]] },
    { id:'data-equity',            a:[['data[\\s-]equity',false]] },
    { id:'housing-wage',           a:[['housing wage',false]] },
    { id:'acs',                    a:[['american community survey',false],['ACS',true]] },
    { id:'hud',                    a:[['HUD',true]] },
    { id:'redlining',              a:[['redlin(?:ing|ed)',false]] },
    { id:'homeownership',          a:[['homeownership',false]] },
    { id:'voucher',                a:[['housing choice vouchers?',false],['section 8',false]] },
    { id:'msa',                    a:[['metropolitan statistical area',false],['MSA',true]] },
    { id:'two-gen',                a:[['two[\\s-]generation',false]] },
    { id:'alice',                  a:[['ALICE(?!\\s+threshold)',true],['asset limited,? income constrained',false]] },
    { id:'alice-threshold',        a:[['ALICE threshold',true],['ALICE Threshold',true]] },
    { id:'fpl',                    a:[['federal poverty (?:line|level|guideline)s?',false],['FPL',true],['poverty line',false]] },
    { id:'gini',                   a:[['Gini coefficient',false],['Gini index',false]] },
    { id:'survival-budget',        a:[['survival budget',false]] }
  ];
  TERMS.forEach(function(t){ t.re=t.a.map(function(p){ return new RegExp('\\b(?:'+p[0]+')\\b',p[1]?'g':'gi'); }); });
  var ROOTS=['.page'];
  var CAND='p, li, td, th, blockquote, figcaption, .lead, .card-s, .stat-l, .callout-t, .post-dek, .post-lead, .minichart-cap';
  var SKIP='a, button, .btn, .gloss-link, .link, .stat-src, .gloss, #glossaryModal, nav, .nav, .crumb, .eyebrow, .tab, .chip, [data-no-gloss], h1, h2, h3, .sec-h, .card-t, .ovchart-h, .minichart-h, .bcard-t, .partner-name';
  function isSkipped(el){ return !el||!!el.closest(SKIP); }
  function firstMatch(text,from,used){
    var best=null;
    for(var i=0;i<TERMS.length;i++){
      var t=TERMS[i]; if(used.has(t.id)) continue;
      for(var j=0;j<t.re.length;j++){
        var re=t.re[j]; re.lastIndex=from; var m=re.exec(text);
        if(m){ var c={id:t.id,start:m.index,end:m.index+m[0].length,str:m[0]}; if(!best||c.start<best.start||(c.start===best.start&&c.str.length>best.str.length)) best=c; }
      }
    }
    return best;
  }
  function wrapTextNode(node,used){
    var text=node.nodeValue,hits=[],pos=0,m;
    while((m=firstMatch(text,pos,used))){ hits.push(m); used.add(m.id); pos=m.end; }
    if(!hits.length) return;
    var frag=document.createDocumentFragment(),last=0;
    hits.forEach(function(h){
      if(h.start>last) frag.appendChild(document.createTextNode(text.slice(last,h.start)));
      var span=document.createElement('span'); span.className='gloss-link'; span.setAttribute('data-term',h.id);
      span.setAttribute('role','button'); span.setAttribute('tabindex','0'); span.setAttribute('title','What does this mean?');
      span.textContent=h.str;
      span.addEventListener('click',function(e){ e.stopPropagation(); glossTerm(h.id); });
      span.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); glossTerm(h.id); } });
      frag.appendChild(span); last=h.end;
    });
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag,node);
  }
  function processSection(section){
    var used=new Set();
    section.querySelectorAll('.gloss-link[data-term]').forEach(function(s){ used.add(s.getAttribute('data-term')); });
    var walker=document.createTreeWalker(section,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue||!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      var p=n.parentElement;
      if(!p||isSkipped(p)||!p.closest(CAND)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[],nn;
    while((nn=walker.nextNode())) nodes.push(nn);
    nodes.forEach(function(n){ wrapTextNode(n,used); });
  }
  function runAll(){
    ROOTS.forEach(function(sel){
      var root=document.querySelector(sel); if(!root) return;
      var secs=Array.prototype.slice.call(root.querySelectorAll('.tabpane,.post,.section')).filter(function(s){ return !s.parentElement.closest('.tabpane,.post,.section'); });
      if(secs.length) secs.forEach(processSection); else processSection(root);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',runAll);
  else runAll();
  window.addEventListener('langchange',runAll);
})();

/* ── SHARE SYSTEM ── */
(function(){
  'use strict';
  function txt(el){ return el?el.textContent.replace(/\s+/g,' ').trim():''; }
  function clean(s){ return (s||'').replace(/^\s*source[:·\s-]*/i,'').trim(); }
  function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,52); }
  function cssEsc(s){ if(window.CSS&&CSS.escape) return CSS.escape(s); return s.replace(/["\\]/g,'\\$&'); }
  function pageOf(el){ var p=el.closest('.page'); return p?p.id.replace(/^page-/,''):'home'; }
  function paneOf(el){ var p=el.closest('.tabpane'); return p?p.getAttribute('data-pane'):null; }
  function knownPage(p){ return true; }
  function baseUrl(){ return location.origin+location.pathname; }
  function linkFor(id){ return baseUrl()+'#s='+encodeURIComponent(id); }
  function linkPage(p){ return baseUrl()+'#p='+encodeURIComponent(p); }
  var usedIds={};
  function assignId(el,base){
    if(el.dataset.shareId){ usedIds[el.dataset.shareId]=1; return el.dataset.shareId; }
    var id=slug(base)||'item',u=id,k=2;
    while(usedIds[u]) u=id+'-'+(k++);
    usedIds[u]=1; el.dataset.shareId=u; return u;
  }
  function shareId(el){ return el.dataset.shareId||assignId(el,pageOf(el)+'-'+findTitle(el)); }
  function linkOf(el){ return el.dataset.shareLink||linkFor(shareId(el)); }
  function findTitle(host){
    var sel=['.card-t','.ovchart-h','.minichart-h'];
    for(var i=0;i<sel.length;i++){ var e=host.querySelector(sel[i]); if(e) return txt(e); }
    var cap=host.querySelector('caption'); if(cap) return txt(cap);
    if(host.classList.contains('map-ph')){ var mt=host.querySelector('.t'); if(mt) return txt(mt); }
    var sec=host.closest('.tabpane,.section,.page');
    if(sec){ var h=sec.querySelector('.sec-h,.post-title'); if(h) return txt(h); }
    return 'North Meck data';
  }
  function findSource(host){
    var fig=host.closest('figure');
    if(fig){ var fc=fig.querySelector('figcaption'); if(fc) return clean(txt(fc)); }
    var sel=['.callout-s','.minichart-cap','.scale-lbl'];
    for(var i=0;i<sel.length;i++){ var e=host.querySelector(sel[i]); if(e) return clean(txt(e)); }
    var row=host.closest('.stat-row');
    if(row){ var ss=row.querySelector('.stat-src'); if(ss) return clean(txt(ss)); }
    var own=host.querySelector('.stat-src'); if(own) return clean(txt(own));
    return 'North Meck Insights';
  }
  function vizData(host){
    var out=[],i;
    var table=host.querySelector('table');
    if(table){
      var heads=[].map.call(table.querySelectorAll('thead th'),txt);
      if(heads.length) out.push(heads.join('  |  '));
      [].forEach.call(table.querySelectorAll('tbody tr'),function(tr){ out.push([].map.call(tr.querySelectorAll('th,td'),txt).join('  |  ')); });
      return out;
    }
    if(host.querySelector('.ovlolly')){ [].forEach.call(host.querySelectorAll('.ovlolc'),function(c){ out.push(txt(c.querySelector('.ovll'))+': '+txt(c.querySelector('.ovlv'))); }); return out; }
    if(host.querySelector('.ovbullet')){ [].forEach.call(host.querySelectorAll('.ovbrow'),function(r){ out.push(txt(r.querySelector('.ovblabel'))+': '+txt(r.querySelector('.ovbval'))); }); var flag=host.querySelector('.ovbtflag'); if(flag) out.push('Threshold — '+txt(flag)); return out; }
    if(host.querySelector('.ovarea')){ var xs=[].map.call(host.querySelectorAll('.ovarea-x span'),txt); var vs=[].map.call(host.querySelectorAll('.ovpv'),txt); for(i=0;i<vs.length;i++) out.push((xs[i]?xs[i]+': ':'')+vs[i]); return out; }
    if(host.classList.contains('minichart')){ var mx=[].map.call(host.querySelectorAll('.bars-x span'),txt); var mv=[].map.call(host.querySelectorAll('.bar .bv'),txt); for(i=0;i<mv.length;i++) out.push((mx[i]?mx[i]+': ':'')+mv[i]); return out; }
    var bcs=host.querySelectorAll('.bc');
    if(bcs.length){ [].forEach.call(bcs,function(bc){ var lbl=bc.querySelector('.bc-lbl'); if(!lbl) return; var b=lbl.querySelector('b'); var val=b?txt(b):''; var name=txt(lbl); if(val) name=name.replace(val,'').trim(); out.push(val?(name+': '+val):name); }); return out; }
    var sub=host.querySelector('.s'); if(sub) out.push(txt(sub));
    return out;
  }
  function buildVizText(host){
    var parts=[findTitle(host)];
    var data=vizData(host).slice(0,16);
    if(data.length){ parts.push('',data.join('\n')); }
    parts.push('','Source: '+findSource(host),linkOf(host));
    return parts.join('\n');
  }
  function buildStatText(el){
    var n=txt(el.querySelector('.stat-n')),l=txt(el.querySelector('.stat-l'));
    var s=clean(txt(el.querySelector('.stat-src')))||'North Meck Insights';
    return [n+(l?' — '+l:''),'','Source: '+s,linkOf(el)].join('\n');
  }
  function buildStoryText(a){
    var parts=[txt(a.querySelector('.post-title'))];
    var dek=txt(a.querySelector('.post-dek')); if(dek) parts.push('',dek);
    var srcs=[].map.call(a.querySelectorAll('.post-sources li'),function(li){ return '• '+txt(li); });
    if(srcs.length){ parts.push('','Sources:',srcs.join('\n')); }
    parts.push('',linkOf(a)); return parts.join('\n');
  }
  function fallbackCopy(t){ try{ var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.focus(); ta.select(); var ok=document.execCommand('copy'); ta.remove(); return ok; }catch(e){ return false; } }
  function copyText(t){ if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function(){ return true; },function(){ return fallbackCopy(t); }); return Promise.resolve(fallbackCopy(t)); }
  function exportViz(host){
    if(typeof htmlToImage==='undefined'){ alert('Image download needs an internet connection. Please try again while online.'); return Promise.resolve(false); }
    var clone=host.cloneNode(true);
    clone.querySelectorAll('.viz-tools,.share-corner,.share-btn').forEach(function(e){ e.remove(); });
    clone.querySelectorAll('i.ti,.ti').forEach(function(e){ if(/\bti-/.test(e.className)) e.remove(); });
    clone.classList.remove('viz-host'); clone.classList.add('viz-clone');
    var wrap=document.createElement('div'); wrap.className='viz-export';
    var inner=document.createElement('div'); inner.className='viz-export-inner';
    inner.appendChild(clone);
    var foot=document.createElement('div'); foot.className='viz-export-src'; foot.textContent='Source: '+findSource(host);
    inner.appendChild(foot); wrap.appendChild(inner); document.body.appendChild(wrap);
    return new Promise(function(resolve){ setTimeout(resolve,70); }).then(function(){
      return htmlToImage.toPng(wrap,{pixelRatio:2,backgroundColor:'#fbf7ef',width:920,skipFonts:true,fontEmbedCSS:'',cacheBust:false});
    }).then(function(url){
      var a=document.createElement('a'); a.href=url; a.download=(slug(findTitle(host))||'north-meck-chart')+'.png';
      document.body.appendChild(a); a.click(); a.remove(); return true;
    }).catch(function(err){ console.warn('[share] PNG export failed',err); alert('Sorry — the image could not be generated.'); return false; })
    .then(function(r){ wrap.remove(); return r; });
  }
  var POP,BACK;
  function ensurePop(){
    if(POP) return;
    BACK=document.createElement('div'); BACK.className='share-pop-back';
    BACK.addEventListener('click',closeSharePop);
    POP=document.createElement('div'); POP.className='share-pop'; POP.setAttribute('role','menu');
    POP.addEventListener('click',function(e){ e.stopPropagation(); });
    document.body.appendChild(BACK); document.body.appendChild(POP);
  }
  function actionsFor(el,type){
    if(type==='viz') return [
      { ic:'ti-download', label:'Download as image', ok:'Saved', run:function(){ return exportViz(el); } },
      { ic:'ti-clipboard-text', label:'Copy summary + source', ok:'Copied', run:function(){ return copyText(buildVizText(el)); } },
      { ic:'ti-link', label:'Copy link to this chart', ok:'Copied', run:function(){ return copyText(linkOf(el)); } }
    ];
    if(type==='story') return [
      { ic:'ti-link', label:'Copy link to this story', ok:'Copied', run:function(){ return copyText(linkOf(el)); } },
      { ic:'ti-clipboard-text', label:'Copy story + sources', ok:'Copied', run:function(){ return copyText(buildStoryText(el)); } },
      { ic:'ti-printer', label:'Print / Save as PDF', ok:'Opening', run:function(){ setTimeout(function(){ window.print(); },80); return true; } }
    ];
    if(type==='stat') return [
      { ic:'ti-clipboard-text', label:'Copy stat + source', ok:'Copied', run:function(){ return copyText(buildStatText(el)); } },
      { ic:'ti-link', label:'Copy link to this stat', ok:'Copied', run:function(){ return copyText(linkOf(el)); } }
    ];
    return [
      { ic:'ti-link', label:'Copy link', ok:'Copied', run:function(){ return copyText(linkOf(el)); } },
      { ic:'ti-clipboard-text', label:'Copy title + link', ok:'Copied', run:function(){ return copyText((el.dataset.shareTitle||'')+'\n'+linkOf(el)); } }
    ];
  }
  function runAction(row,a){
    if(row.classList.contains('busy')||row.classList.contains('ok')) return;
    row.classList.add('busy');
    Promise.resolve(a.run()).then(function(ok){
      row.classList.remove('busy'); if(ok===false) return;
      var lbl=row.querySelector('.share-row-label'),ic=row.querySelector('i');
      var oldL=lbl.textContent,oldI=ic.className;
      row.classList.add('ok'); ic.className='ti ti-check'; lbl.textContent=(a.ok||'Done')+'!';
      setTimeout(function(){ row.classList.remove('ok'); ic.className=oldI; lbl.textContent=oldL; closeSharePop(); },1150);
    });
  }
  function openSharePop(anchor,el,type){
    ensurePop(); POP.innerHTML='';
    var h=document.createElement('div'); h.className='share-pop-h'; h.textContent='Share this';
    POP.appendChild(h);
    actionsFor(el,type).forEach(function(a){
      var row=document.createElement('button'); row.type='button'; row.className='share-row'; row.setAttribute('role','menuitem');
      row.innerHTML='<i class="ti '+a.ic+'"></i><span class="share-row-label">'+a.label+'</span>';
      row.addEventListener('click',function(){ runAction(row,a); });
      POP.appendChild(row);
    });
    POP.classList.add('open'); BACK.classList.add('open'); positionPop(anchor);
  }
  function positionPop(anchor){
    var r=anchor.getBoundingClientRect(),pw=POP.offsetWidth,ph=POP.offsetHeight;
    var top=r.bottom+8,left=r.right-pw;
    var minL=8,maxL=Math.max(minL,document.documentElement.clientWidth-pw-8);
    if(left<minL) left=minL;
    if(left>maxL) left=maxL;
    if(r.bottom+8+ph>window.innerHeight&&r.top-8-ph>0) top=r.top-8-ph;
    POP.style.top=top+'px'; POP.style.left=left+'px';
  }
  function closeSharePop(){ if(POP){ POP.classList.remove('open'); BACK.classList.remove('open'); } }
  window.openSharePop=openSharePop; window.closeSharePop=closeSharePop;
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeSharePop(); });
  window.addEventListener('resize',closeSharePop);
  window.addEventListener('scroll',function(){ if(POP&&POP.classList.contains('open')) closeSharePop(); },true);
  function mkBtn(cls,label){ var b=document.createElement('button'); b.type='button'; b.className='share-btn'+(cls?' '+cls:''); b.setAttribute('aria-label',label||'Share'); b.innerHTML='<i class="ti ti-share-2"></i>'; return b; }
  function injectStoryBar(a){
    var body=a.querySelector('.post-body'); if(!body||body.querySelector('.share-bar')) return;
    var bar=document.createElement('div'); bar.className='share-bar';
    bar.innerHTML='<span class="share-bar-lbl"><i class="ti ti-share-2"></i>Share</span>';
    [['ti-link','Copy link','link'],['ti-clipboard-text','Copy with sources','src'],['ti-printer','Save as PDF','print']].forEach(function(d){
      var b=document.createElement('button'); b.type='button'; b.className='share-act';
      b.innerHTML='<i class="ti '+d[0]+'"></i>'+d[1];
      b.addEventListener('click',function(){ storyAct(b,a,d[2]); });
      bar.appendChild(b);
    });
    body.insertBefore(bar,body.firstChild);
  }
  function flashBtn(btn,label){ if(btn.classList.contains('ok')) return; var html=btn.innerHTML; btn.classList.add('ok'); btn.innerHTML='<i class="ti ti-check"></i>'+label; setTimeout(function(){ btn.classList.remove('ok'); btn.innerHTML=html; },1300); }
  function storyAct(btn,a,kind){ var p; if(kind==='link') p=copyText(linkOf(a)); else if(kind==='src') p=copyText(buildStoryText(a)); else{ setTimeout(function(){ window.print(); },80); p=Promise.resolve(true); } Promise.resolve(p).then(function(ok){ if(ok!==false) flashBtn(btn,kind==='print'?'Opening…':'Copied'); }); }
  function attachCardShare(card){
    if(card.querySelector('.bcard-share')) return;
    var oc=card.getAttribute('onclick')||''; var m=oc.match(/(?:goto|openPost)\('([^']+)'/);
    var target=m?m[1]:'blog'; card.dataset.shareLink=linkPage(knownPage(target)?target:'blog');
    card.dataset.shareTitle=txt(card.querySelector('.bcard-t'));
    var btn=mkBtn('bcard-share','Share this story');
    btn.addEventListener('click',function(e){ e.stopPropagation(); openSharePop(btn,card,'card'); });
    card.appendChild(btn);
  }
  function attachCornerShare(el,type,label,idBase){
    if(el.querySelector(':scope > .share-corner')) return;
    el.classList.add('has-share'); assignId(el,idBase);
    var wrap=document.createElement('div'); wrap.className='share-corner';
    var btn=mkBtn('',label);
    btn.addEventListener('click',function(e){ e.stopPropagation(); openSharePop(btn,el,type); });
    wrap.appendChild(btn); el.appendChild(wrap); return btn;
  }
  function scrollToEl(el){ var y=el.getBoundingClientRect().top+window.scrollY-110; window.scrollTo({top:Math.max(0,y),behavior:'smooth'}); el.classList.remove('share-flash'); void el.offsetWidth; el.classList.add('share-flash'); setTimeout(function(){ el.classList.remove('share-flash'); },1800); }
  function applyHash(){
    var hs=location.hash||'';
    var mp=hs.match(/^#p=(.+)$/);
    if(mp){ return; } // MPA: hash-based page navigation not needed
    var ms=hs.match(/^#s=(.+)$/); if(!ms) return;
    var id=decodeURIComponent(ms[1]);
    var el=document.querySelector('[data-share-id="'+cssEsc(id)+'"]'); if(!el) return;
    var pane=paneOf(el); if(pane){ var tab=document.querySelector('.tab[data-tab="'+pane+'"]'); if(tab&&window.setTab) setTab(tab); }
    setTimeout(function(){ scrollToEl(el); },150);
  }
  function init(){
    document.querySelectorAll('.viz-host').forEach(function(h){ assignId(h,pageOf(h)+'-'+findTitle(h)); });
    document.querySelectorAll('article.post').forEach(function(a){ assignId(a,pageOf(a)); a.dataset.shareLink=linkPage(pageOf(a)); injectStoryBar(a); });
    document.querySelectorAll('.bcard').forEach(attachCardShare);
    window.addEventListener('hashchange',applyHash); applyHash();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();

/* ── MAP MODAL OVERRIDE ── */
function openMap() {
  var modal = document.getElementById("map-modal");
  var iframe = document.getElementById("map-iframe");
  if (modal) {
    if (iframe && (!iframe.src || iframe.src === window.location.href)) {
      iframe.src = "map-overview.html";
    }
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  } else {
    // Fallback: use nmap SVG modal
    var nmap = document.getElementById('nmapModal');
    if (nmap) { nmap.classList.add('open'); document.body.style.overflow='hidden'; }
  }
}
function closeMap() {
  var modal = document.getElementById("map-modal");
  if (modal) { modal.style.display = "none"; document.body.style.overflow = ""; }
  var nmap = document.getElementById('nmapModal');
  if (nmap) { nmap.classList.remove('open'); document.body.style.overflow = ""; }
}
window.openMap = openMap;
window.closeMap = closeMap;
document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById("map-modal");
  if (modal) {
    modal.addEventListener("click", function(e) { if (e.target === this) closeMap(); });
  }
});
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeMap();
});
