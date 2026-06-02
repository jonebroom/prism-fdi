/* ============================================================
   PRISM — bootstrap
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;

  // world map geojson (ECharts classic world)
  const MAP_URL='https://fastly.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json';

  async function loadMap(){
    try{
      const url=(window.__resources&&window.__resources.worldmap)||MAP_URL;
      const geo=await fetch(url).then(r=>r.json());
      echarts.registerMap('world',geo);
      // compute centroids per feature (defensive — never let one bad feature abort the rest)
      const cen={};
      geo.features.forEach(f=>{
        try{
          const name=f.properties&&f.properties.name;
          if(!name||!f.geometry) return;
          const c=centroid(f.geometry);
          if(c) cen[name]=c;
        }catch(_){}
      });
      Object.assign(cen,{
        'Luxembourg':[6.1,49.8],'Iceland':[-18.6,64.9],'Israel':[34.9,31.4],
        'Estonia':[25.5,58.6],'Latvia':[24.6,56.9],'Lithuania':[23.9,55.2],
        'Slovenia':[14.8,46.1],'Czech Rep.':[15.5,49.8],'Slovakia':[19.5,48.7],
        'Costa Rica':[-84,9.9],'Korea':[127.8,36.5],'Netherlands':[5.6,52.2],
        'Belgium':[4.5,50.6],'Switzerland':[8.2,46.8],'Denmark':[10,56],
      });
      P.DATA.centroids=cen;
      P.DATA.mapRegistered=true;
      P.emit('mapready');
    }catch(e){ console.error('map load failed',e); P.DATA.centroids=P.DATA.centroids||{}; }
  }

  function centroid(geom){
    const pts=[];
    function collect(coords){
      if(!Array.isArray(coords)) return;
      if(typeof coords[0]==='number'){ pts.push(coords); return; }
      for(const c of coords) collect(c);
    }
    if(geom.type==='Polygon')collect(geom.coordinates);
    else if(geom.type==='MultiPolygon'){
      let best=null,bestLen=0;
      geom.coordinates.forEach(poly=>{ if(poly&&poly[0]&&poly[0].length>bestLen){bestLen=poly[0].length;best=poly;} });
      if(best)collect(best);
    }
    if(!pts.length)return null;
    let x=0,y=0; pts.forEach(p=>{x+=p[0];y+=p[1];}); return [x/pts.length,y/pts.length];
  }

  async function boot(){
    const status=document.getElementById('loadStatus');
    function setStatus(msg){ if(status) status.textContent=msg; }
    function showErr(msg){
      console.error(msg);
      const el=document.getElementById('loadStatus')||document.body;
      if(el) el.innerHTML='<span style="color:#c0392b">'+msg+'</span>';
    }
    try{
      if(!P){ showErr('Error: PRISM state module failed to load. Check browser console.'); return; }
      if(!UI){ showErr('Error: PRISM UI module failed to load. Check browser console.'); return; }
      setStatus('Loading dataset…');
      await P.load();
      setStatus('Initializing UI…');
      UI.initWiring();
      window.PRISM_SEARCH.init();
      window.PRISM_AI.init();
      // ---- URL param restore ----
      const params=new URLSearchParams(location.search);
      const urlYear=parseInt(params.get('year'));
      const urlCountry=params.get('country');
      const urlTab=params.get('tab');
      if(urlYear && urlYear>=P.DATA.yearMin && urlYear<=P.DATA.yearMax) UI.setYear(urlYear);

      const ov=window.PRISM_TABS.overview;
      ov.mount(document.getElementById('pane-overview')); ov.mounted=true; ov.update();

      if(urlTab && ['overview','country','compare','evolution','changes','sectors'].includes(urlTab)){
        UI.switchTab(urlTab);
      }
      if(urlCountry){
        const match=P.DATA.countries.find(c=>c.country===urlCountry||String(c.iso3n)===urlCountry);
        if(match){ UI.selectCountry(match.country); if(!urlTab) UI.switchTab('country'); }
      }

      // reveal the dashboard immediately — map + search/policy data stream in afterward
      document.getElementById('loading').classList.add('hidden');
      loadMap();
      P.loadHeavy();
    }catch(e){
      console.error(e);
      showErr('Load failed: '+e.message);
      setTimeout(()=>{ const l=document.getElementById('loading'); if(l)l.classList.add('hidden'); },3000);
    }
  }

  if(document.readyState!=='loading')boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
