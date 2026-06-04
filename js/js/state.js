/* ============================================================
   PRISM — global state, data store, helpers
   ============================================================ */
(function(){
  'use strict';

  const DATA = { ts:null, events:null, changes:null, yearly:null, countries:null, policy:null, search:null,
                 sectorNames:[], aggrNames:[], years:[], yearMin:2007, yearMax:2023,
                 byCountryYear:new Map(), byCountry:new Map() };

  const STATE = {
    year: 2023,
    groups: { oecd:true, eu:true, fiveeyes:true },   // which group filters are ON (acts as union filter; if all on -> all countries)
    onlyGroups:false,                                 // whether group toggles filter the set
    selectedCountry: 'United States',
    mapDim: 'strictness',
    compareCountries: ['United States','Australia','Germany','Japan','United Kingdom'],
  };

  // ---- event bus ----
  const bus = {};
  function on(ev, fn){ (bus[ev]=bus[ev]||[]).push(fn); }
  function emit(ev, payload){ (bus[ev]||[]).forEach(fn=>{ try{fn(payload);}catch(e){console.error(e);} }); }

  // ---- group meta ----
  const GROUPS = {
    oecd:     { key:'oecd',     field:'oecd',      label:'OECD',      color:'var(--steel)', hex:'#4f6f9e' },
    eu:       { key:'eu',       field:'eu_eea',    label:'EU / EEA',  color:'var(--moss)',  hex:'#3f8a5e' },
    fiveeyes: { key:'fiveeyes', field:'five_eyes', label:'Five Eyes', color:'var(--amber)', hex:'#c79a3e' },
  };

  // procedural 0/1 fields used for "strictness"
  const PROC_FIELDS = ['formal_call_in','review_increased_ownership','filing_fees','mitigation','fines',
    'ns_test','net_benefit_test','competition_test','interagency_review','tiered_authority',
    'local_representation','enhanced_gov_control','colocation'];

  // PROC_LABELS — Proxy 实现运行时翻译（i18n.js 加载后自动生效）
  const _PROC_LABELS_EN = {
    formal_call_in:'Formal Call-in', review_increased_ownership:'Increased Ownership Review', filing_fees:'Filing Fees',
    mitigation:'Mitigation', fines:'Fines', ns_test:'National Security Test', net_benefit_test:'Net Benefit Test',
    competition_test:'Competition Test', interagency_review:'Interagency Review', tiered_authority:'Tiered Authority',
    local_representation:'Local Representation', enhanced_gov_control:'Enhanced Gov. Control', colocation:'Co-location',
    greenfield_covered:'Greenfield', real_estate_covered:'Real Estate', export_control_dualuse:'Export Control / Dual-Use'
  };
  const PROC_LABELS = new Proxy(_PROC_LABELS_EN, {
    get(target, prop) {
      const raw = target[prop];
      if (raw === undefined) return undefined;
      const i18n = window.PRISM_I18N;
      if (!i18n) return raw;
      const k = 'proc_' + prop;
      const tr = i18n.t(k);
      return tr !== k ? tr : raw;
    }
  });

  // RADAR_DIMS — 运行时取翻译标签
  const _RADAR_DIMS = [
    {field:'ns_test',                    labelKey:'radar_ns_test'},
    {field:'formal_call_in',             labelKey:'radar_formal_call_in'},
    {field:'fines',                      labelKey:'radar_fines'},
    {field:'mitigation',                 labelKey:'radar_mitigation'},
    {field:'interagency_review',         labelKey:'radar_interagency_review'},
    {field:'net_benefit_test',           labelKey:'radar_net_benefit_test'},
    {field:'enhanced_gov_control',       labelKey:'radar_enhanced_gov_control'},
    {field:'review_increased_ownership', labelKey:'radar_review_increased_ownership'},
  ];
  // 每次访问都返回带当前语言 label 的新数组
  const RADAR_DIMS = new Proxy(_RADAR_DIMS, {
    get(target, prop) {
      const val = target[prop];
      if (typeof prop === 'string' && !isNaN(prop)) {
        const item = val;
        if (!item) return item;
        const i18n = window.PRISM_I18N;
        const label = i18n ? i18n.t(item.labelKey) : item.labelKey;
        return Object.assign({}, item, {label});
      }
      return val;
    }
  });

  // map: data country name -> echarts world geojson feature name
  const MAP_NAME = {
    'United States':'United States',
    'United Kingdom':'United Kingdom',
    'Republic of Korea':'Korea',
    'Czech Republic':'Czech Rep.',
    'Slovak Republic':'Slovakia',
    'Turkey':'Turkey',
    'Costa Rica':'Costa Rica',
  };

  // resolve a data URL — uses inlined blob (standalone build) if present, else the file path
  function dataUrl(id, path){ return (window.__resources && window.__resources[id]) || path; }

  // ---- load ----
  async function load(){
    const f = (p)=>fetch(p).then(r=>r.json());
    const D = window.__PRISM_DATA;
    const get = (id, path) => (D && D[id]) ? Promise.resolve(D[id]) : f(dataUrl(id, path));
    // core data needed for first paint
    const [ts,events,changes,yearly,countries] = await Promise.all([
      get('timeseries','data/timeseries.json'), get('events','data/events.json'),
      get('changes','data/changes.json'), get('yearly','data/yearly_new.json'),
      get('countries','data/countries.json')
    ]);
    DATA.ts=ts; DATA.events=events; DATA.changes=changes; DATA.yearly=yearly;
    DATA.countries=countries.countries;
    DATA.sectorNames = ts.meta.sector_names.filter(n=>n!=='Total Sectors');
    DATA.aggrNames = ts.meta.sector_category_names.map(s=>s.trim());

    // dedupe sector names (Logistics Technology appears twice)
    DATA.sectorNames = [...new Set(DATA.sectorNames)];

    const yrs=new Set();
    ts.data.forEach(r=>{
      yrs.add(r.year);
      DATA.byCountryYear.set(r.country+'|'+r.year, r);
      if(!DATA.byCountry.has(r.country)) DATA.byCountry.set(r.country, []);
      DATA.byCountry.get(r.country).push(r);
      // compute total_sectors from sector dict if null
      if(r.total_sectors==null){
        r.total_sectors = Object.values(r.sectors||{}).reduce((a,b)=>a+(b?1:0),0);
      }
    });
    DATA.byCountry.forEach(arr=>arr.sort((a,b)=>a.year-b.year));
    DATA.years=[...yrs].sort((a,b)=>a-b);
    // drop trailing incomplete years (fewer than half the typical record count)
    const typicalCount=Math.max(...DATA.years.slice(0,-1).map(y=>[...DATA.byCountryYear.keys()].filter(k=>k.endsWith('|'+y)).length));
    while(DATA.years.length>1){
      const last=DATA.years[DATA.years.length-1];
      const cnt=[...DATA.byCountryYear.keys()].filter(k=>k.endsWith('|'+last)).length;
      if(cnt<typicalCount*0.5) DATA.years.pop(); else break;
    }
    DATA.yearMin=DATA.years[0]; DATA.yearMax=DATA.years[DATA.years.length-1];
    STATE.year=DATA.yearMax;
  }

  // ---- deferred load: policy texts + search index (only needed by search/AI) ----
  let _heavyPromise=null;
  function loadHeavy(){
    if(_heavyPromise) return _heavyPromise;
    const f=(p)=>fetch(p).then(r=>r.json());
    _heavyPromise=Promise.all([f(dataUrl('policy','data/policy_texts.json')),f(dataUrl('search','data/search_index.json'))])
      .then(([policy,search])=>{ DATA.policy=policy; DATA.search=search; emit('heavyready'); return true; })
      .catch(e=>{ console.error('heavy load failed',e); return false; });
    return _heavyPromise;
  }

  // ---- accessors ----
  function rec(country, year){ return DATA.byCountryYear.get(country+'|'+(year??STATE.year)); }
  function countryMeta(country){ return DATA.countries.find(c=>c.country===country); }

  // list of countries passing current group filter
  function activeCountries(){
    const g=STATE.groups;
    const allOn = g.oecd && g.eu && g.fiveeyes;
    return DATA.countries.filter(c=>{
      if(allOn) return true;
      return (g.oecd&&c.oecd)||(g.eu&&c.eu_eea)||(g.fiveeyes&&c.five_eyes);
    }).map(c=>c.country);
  }

  function groupOf(country){
    const c=countryMeta(country); if(!c) return 'other';
    if(c.five_eyes) return 'fiveeyes';
    if(c.eu_eea) return 'eu';
    if(c.oecd) return 'oecd';
    return 'other';
  }
  function groupColor(country){
    const m={oecd:GROUPS.oecd.hex,eu:GROUPS.eu.hex,fiveeyes:GROUPS.fiveeyes.hex,other:'#9aa0aa'};
    return m[groupOf(country)];
  }

  // strictness 0..13
  function strictness(r){ if(!r) return 0; return PROC_FIELDS.reduce((a,f)=>a+(r[f]?1:0),0); }
  // strictness color from sequential scale
  function strictColor(score){
    const seq=['--seq-0','--seq-1','--seq-2','--seq-3','--seq-4','--seq-5'];
    const t=Math.max(0,Math.min(1,score/13));
    const idx=Math.round(t*(seq.length-1));
    return getComputedStyle(document.documentElement).getPropertyValue(seq[idx]).trim();
  }

  // sector category aggregation lookups
  function sectorCount(r){ return r? Object.values(r.sectors||{}).reduce((a,b)=>a+(b?1:0),0):0; }

  const fmt = {
    pct:(v)=> v==null?'—':(Math.round(v*1000)/10)+'%',
    num:(v)=> v==null?'—':v,
    days:(v)=> {
      if(v==null) return '—';
      const u=window.PRISM_I18N?window.PRISM_I18N.t('ct_days'):'days';
      return v+' '+u;
    },
    yn:(v)=> {
      const I=window.PRISM_I18N;
      if(!I) return v?'Yes':'No';
      return v?I.t('val_yes'):I.t('val_no');
    },
  };

  // ECharts shared theme bits
  const EC = {
    color:['#4f6f9e','#bf6a4a','#3f8a5e','#c79a3e','#7d5ba6','#5b8a9e','#a85a78','#6a8a4a'],
    font:'IBM Plex Sans, IBM Plex Sans SC, sans-serif',
    mono:'IBM Plex Mono, monospace',
    ink:'#2b3344', inkSoft:'#5a6477', faint:'#8a93a3', line:'#e2e5ea',
    axis(extra){ return Object.assign({
      axisLine:{lineStyle:{color:'#cdd2db'}},
      axisLabel:{color:'#5a6477',fontFamily:'IBM Plex Mono, monospace',fontSize:11},
      axisTick:{show:false},
      splitLine:{lineStyle:{color:'#eceef2'}},
      nameTextStyle:{color:'#8a93a3',fontSize:11}
    },extra||{}); },
    tip(){ return {
      backgroundColor:'#fff', borderColor:'#e2e5ea', borderWidth:1,
      padding:[10,13], textStyle:{color:'#2b3344',fontFamily:'IBM Plex Sans, IBM Plex Sans SC, sans-serif',fontSize:12},
      extraCssText:'box-shadow:0 8px 28px rgba(40,48,70,.14);border-radius:9px;'
    }; }
  };

  function tipRow(k,v){ return `<div class="tt-r"><span class="k">${k}</span><span class="v">${v}</span></div>`; }
  function tipHead(t){ return `<div class="tt-h">${t}</div>`; }

  window.PRISM = { DATA, STATE, GROUPS, PROC_FIELDS, PROC_LABELS, RADAR_DIMS, MAP_NAME,
    on, emit, load, loadHeavy, rec, countryMeta, activeCountries, groupOf, groupColor,
    strictness, strictColor, sectorCount, fmt, EC, tipRow, tipHead };
})();
