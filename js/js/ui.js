/* ============================================================
   PRISM — UI shell: rail, tabs, drawer, registry
   ============================================================ */
(function(){
  'use strict';
  const P = window.PRISM;
  const TABS = {};            // name -> {mount, update, mounted}
  window.PRISM_TABS = TABS;

  // ---------- URL SYNC ----------
  function updateURL(){
    try{
      const p=new URLSearchParams();
      if(currentTab && currentTab!=='overview') p.set('tab',currentTab);
      if(P.STATE.year) p.set('year',P.STATE.year);
      if(P.STATE.selectedCountry) p.set('country',P.STATE.selectedCountry);
      const qs=p.toString();
      history.replaceState(null,'',qs?('?'+qs):location.pathname);
    }catch(_){}
  }

  // ---------- TAB SWITCHING ----------
  let currentTab='overview';
  function switchTab(name){
    if(name===currentTab) return;
    stopPlay();
    currentTab=name;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
    document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('active',p.id==='pane-'+name));
    const t=TABS[name];
    if(t){
      if(!t.mounted){ t.mount(document.getElementById('pane-'+name)); t.mounted=true; }
      t.update && t.update();
    }
    document.getElementById('tabScroll').scrollTop=0;
    P.emit('tab',name);
    updateURL();
  }
  function activeTab(){ return currentTab; }

  // ---------- RAIL: groups ----------
  function buildGroups(){
    const el=document.getElementById('groupList');
    const counts={oecd:0,eu:0,fiveeyes:0};
    P.DATA.countries.forEach(c=>{ if(c.oecd)counts.oecd++; if(c.eu_eea)counts.eu++; if(c.five_eyes)counts.fiveeyes++; });
    el.innerHTML='';
    Object.values(P.GROUPS).forEach(g=>{
      const on=P.STATE.groups[g.key];
      const node=document.createElement('div');
      node.className=`group-toggle g-${g.key==='fiveeyes'?'fe':g.key} ${on?'on':''}`;
      node.innerHTML=`<span class="swatch" style="background:${g.color}"></span>
        <span class="lbl">${g.label}</span>
        <span class="gcnt">${counts[g.key]}</span>
        <span class="check">✓</span>`;
      node.onclick=()=>{
        P.STATE.groups[g.key]=!P.STATE.groups[g.key];
        // never allow all-off
        if(!P.STATE.groups.oecd&&!P.STATE.groups.eu&&!P.STATE.groups.fiveeyes){ P.STATE.groups[g.key]=true; return; }
        buildGroups(); buildCountryList();
        P.emit('filter');
      };
      el.appendChild(node);
    });
  }

  // ---------- RAIL: country list ----------
  let countryFilter='';
  function buildCountryList(){
    const el=document.getElementById('countryList');
    const active=new Set(P.activeCountries());
    const items=P.DATA.countries
      .filter(c=>active.has(c.country))
      .filter(c=>!countryFilter || c.country.toLowerCase().includes(countryFilter));
    document.getElementById('countryCnt').textContent=active.size+' countries';
    el.innerHTML='';
    items.forEach(c=>{
      const node=document.createElement('div');
      node.className='country-item'+(c.country===P.STATE.selectedCountry?' active':'');
      node.innerHTML=`<span class="flagdot" style="background:${P.groupColor(c.country)}"></span>
        <span class="cname">${cnName(c.country)}</span>
        <span class="cmeta">${c.year_established||'—'}</span>`;
      node.onclick=()=>{ selectCountry(c.country); };
      el.appendChild(node);
    });
  }
  function selectCountry(country){
    P.STATE.selectedCountry=country;
    buildCountryList();
    P.emit('country',country);
    if(activeTab()==='overview'){ switchTab('country'); }
    updateURL();
  }

  // ---------- RAIL: year ----------
  let playTimer=null;
  function setYear(y, fromPlay){
    y=Math.max(P.DATA.yearMin,Math.min(P.DATA.yearMax,y));
    P.STATE.year=y;
    const sl=document.getElementById('yearSlider');
    sl.value=y;
    const pct=((y-P.DATA.yearMin)/(P.DATA.yearMax-P.DATA.yearMin))*100;
    sl.style.setProperty('--pct',pct+'%');
    document.getElementById('yearVal').textContent=y;
    P.emit('year',y);
    if(!fromPlay){ stopPlay(); updateURL(); }
  }
  function startPlay(){
    const btn=document.getElementById('playBtn');
    btn.classList.add('playing'); btn.textContent='❚❚ Pause';
    if(P.STATE.year>=P.DATA.yearMax) setYear(P.DATA.yearMin,true);
    playTimer=setInterval(()=>{
      if(P.STATE.year>=P.DATA.yearMax){ stopPlay(); return; }
      setYear(P.STATE.year+1,true);
    },900);
  }
  function stopPlay(){
    if(playTimer){ clearInterval(playTimer); playTimer=null; }
    const btn=document.getElementById('playBtn');
    btn.classList.remove('playing'); btn.textContent='▶ Play Timeline';
  }
  function togglePlay(){ playTimer?stopPlay():startPlay(); }

  // ---------- DRAWER ----------
  function openDrawer(title, meta, html){
    closeScreener(); closeInfoDrawer();
    document.getElementById('drawerTitle').innerHTML=title;
    document.getElementById('drawerMeta').innerHTML=meta||'';
    document.getElementById('drawerBody').innerHTML=html;
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerScrim').classList.add('open');
  }
  function closeDrawer(){
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerScrim').classList.remove('open');
  }

  // ---------- SCREENER DRAWER ----------
  function openScreener(preCountry){
    closeDrawer(); closeInfoDrawer();
    const body = document.getElementById('screenerBody');
    if(body && !body.hasChildNodes()) window.PRISM_SCREENER.mount(body);
    // pre-fill country if provided
    if(preCountry){
      const sel = document.getElementById('scrCountry');
      if(sel) sel.value = preCountry;
    }
    // update year label
    const yl = document.getElementById('screenerYearLabel');
    if(yl) yl.textContent = 'Data year: ' + P.STATE.year;
    document.getElementById('screenerDrawer').classList.add('open');
    document.getElementById('screenerScrim').classList.add('open');
  }
  function closeScreener(){
    document.getElementById('screenerDrawer').classList.remove('open');
    document.getElementById('screenerScrim').classList.remove('open');
  }

  // ---------- INFO DRAWER ----------
  function openInfoDrawer(){
    closeDrawer(); closeScreener();
    document.getElementById('infoDrawer').classList.add('open');
    document.getElementById('infoScrim').classList.add('open');
  }
  function closeInfoDrawer(){
    document.getElementById('infoDrawer').classList.remove('open');
    document.getElementById('infoScrim').classList.remove('open');
  }

  // ---------- Name lookup (English-only) ----------
  function cnName(c){ return c; }
  function cnShort(c){ return c; }

  // ---------- COVERAGE label/color ----------
  const COVERAGE={
    'Sectoral':{cn:'Sectoral',c:'#bf6a4a'}, 'Cross-sectoral':{cn:'Cross-sectoral',c:'#4f6f9e'},
    'Mixed':{cn:'Mixed',c:'#7d5ba6'}, 'Asset-based':{cn:'Asset-based',c:'#c79a3e'},
    'Draft':{cn:'Draft',c:'#9aa0aa'}, 'Passed (not implemented)':{cn:'Passed (not impl.)',c:'#b0b6c0'}
  };

  // ---------- init wiring ----------
  function initWiring(){
    document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
    const sl=document.getElementById('yearSlider');
    sl.min=P.DATA.yearMin; sl.max=P.DATA.yearMax; sl.value=P.STATE.year;
    sl.oninput=()=>setYear(parseInt(sl.value));
    document.getElementById('yearRng').textContent=`${P.DATA.yearMin} — ${P.DATA.yearMax}`;
    const subEl=document.querySelector('.brand .sub');
    if(subEl) subEl.innerHTML=`FDI Screening Mechanism Data Platform · <b>${P.DATA.countries.length}</b> countries · <b>${P.DATA.yearMin}–${P.DATA.yearMax}</b>`;
    document.getElementById('yearCnt').textContent=P.DATA.years.length+' yrs';
    const mid=Math.round((P.DATA.yearMin+P.DATA.yearMax)/2);
    const ticks=document.querySelector('.year-ticks');
    if(ticks) ticks.innerHTML=`<span>${P.DATA.yearMin}</span><span>${mid}</span><span>${P.DATA.yearMax}</span>`;
    document.getElementById('playBtn').onclick=togglePlay;
    document.getElementById('countrySearch').oninput=(e)=>{ countryFilter=e.target.value.toLowerCase(); buildCountryList(); };
    document.getElementById('drawerClose').onclick=closeDrawer;
    document.getElementById('drawerScrim').onclick=closeDrawer;
    document.getElementById('screenerOpen').onclick=()=>openScreener();
    document.getElementById('screenerClose').onclick=closeScreener;
    document.getElementById('screenerScrim').onclick=closeScreener;
    document.getElementById('infoOpen').onclick=openInfoDrawer;
    document.getElementById('infoClose').onclick=closeInfoDrawer;
    document.getElementById('infoScrim').onclick=closeInfoDrawer;
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ closeDrawer(); closeInfoDrawer(); closeScreener(); P.emit('escape'); }
      if(e.key==='/' && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); document.getElementById('globalSearch').focus(); }
    });
    buildGroups(); buildCountryList(); setYear(P.STATE.year);
  }

  window.PRISM_UI = { switchTab, activeTab, selectCountry, setYear, openDrawer, closeDrawer, openInfoDrawer, closeInfoDrawer, openScreener, closeScreener,
    cnName, cnShort, COVERAGE, buildCountryList, initWiring, register:(n,o)=>{TABS[n]=o;} };
})();
