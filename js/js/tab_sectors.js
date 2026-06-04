/* ============================================================
   PRISM — Tab 06: 行业分析 (heatmap matrix + sorted bar)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let heat, bars, root, mode='detail', raceTimer=null, raceYear=null;

  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>${t('sec_heat_title')}</h2><p id="secSub">${t('sec_heat_sub')}</p></div>
            <div class="seg" id="secMode">
              <button data-v="detail" class="on" id="secDetailBtn">${t('sec_detail_btn')}</button>
              <button data-v="aggr">${t('sec_aggr_btn')}</button>
            </div>
          </div>
          <div class="panel-body" style="overflow-x:auto;"><div class="chart" id="secHeat"></div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>${t('sec_bar_title')}</h2><p>${t('sec_bar_sub')}</p></div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="tag" id="secYr"></span>
              <button class="seg-btn" id="secPlay">${t('sec_play')}</button>
            </div>
          </div>
          <div class="panel-body"><div class="chart" id="secBars" style="height:640px;"></div></div>
        </div>
      </div>`;
    heat=echarts.init(el.querySelector('#secHeat'));
    bars=echarts.init(el.querySelector('#secBars'));
    const detailBtn=el.querySelector('#secDetailBtn');
    if(detailBtn) detailBtn.textContent=P.DATA.sectorNames.length+' '+t('sec_detail_btn');
    el.querySelectorAll('#secMode button').forEach(b=>b.onclick=()=>{
      el.querySelectorAll('#secMode button').forEach(x=>x.classList.toggle('on',x===b));
      mode=b.dataset.v; drawHeat();
    });
    el.querySelector('#secPlay').onclick=toggleRace;
    window.addEventListener('resize',()=>{heat&&heat.resize();bars&&bars.resize();});
  }

  function drawHeat(yr){
    yr=yr||P.STATE.year;
    const active=P.activeCountries().filter(c=>{const r=P.rec(c,yr);return r&&r.num_mechanisms;});
    // sort countries by total coverage desc
    active.sort((a,b)=>P.sectorCount(P.rec(b,yr))-P.sectorCount(P.rec(a,yr)));
    const cols=active;
    if(mode==='detail'){
      const sectors=P.DATA.sectorNames.slice();
      // sort sectors by global coverage
      const cov={}; sectors.forEach(s=>{cov[s]=0;active.forEach(c=>{const r=P.rec(c,yr);if(r&&r.sectors[s])cov[s]++;});});
      sectors.sort((a,b)=>cov[a]-cov[b]); // ascending => top of chart has most (y reversed)
      const data=[];
      cols.forEach((c,xi)=>{const r=P.rec(c,yr);sectors.forEach((s,yi)=>{data.push([xi,yi,r&&r.sectors[s]?1:0]);});});
      const seq=['--seq-0','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
      heat.getDom().style.height=Math.max(480,sectors.length*15+120)+'px'; heat.resize();
      heat.setOption({
        tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(secCN(sectors[p.value[1]]))+P.tipRow(UI.cnShort(cols[p.value[0]]),p.value[2]?t('tip_covered'):t('tip_not_covered'))}),
        grid:{left:160,right:20,top:84,bottom:8},
        xAxis:{type:'category',data:cols.map(c=>UI.cnShort(c)),position:'top',
          axisLabel:{rotate:55,color:P.EC.inkSoft,fontSize:10,interval:0},axisLine:{show:false},axisTick:{show:false},splitArea:{show:false}},
        yAxis:{type:'category',data:sectors.map(secCN),
          axisLabel:{color:P.EC.inkSoft,fontSize:10,interval:0},axisLine:{show:false},axisTick:{show:false},splitArea:{show:false}},
        visualMap:{min:0,max:1,show:false,inRange:{color:['#f1f3f6',seq[1]]}},
        series:[{type:'heatmap',data,itemStyle:{borderColor:'#fff',borderWidth:1.5,borderRadius:2},
          emphasis:{itemStyle:{borderColor:'#bf6a4a',borderWidth:1.5}}}]
      },true);
    } else {
      const cats=P.DATA.aggrNames.slice();
      const data=[];
      cols.forEach((c,xi)=>{const r=P.rec(c,yr);cats.forEach((s,yi)=>{
        const v=r&&r.sector_categories?(r.sector_categories[s]??r.sector_categories[s+' ']):null;
        data.push([xi,yi,v==null?0:+v.toFixed(2)]);});});
      const seq=['--seq-0','--seq-2','--seq-4','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
      heat.getDom().style.height='360px'; heat.resize();
      heat.setOption({
        tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(catCN(cats[p.value[1]]))+P.tipRow(UI.cnShort(cols[p.value[0]]),(p.value[2]*100).toFixed(0)+t('tip_coverage_sfx'))}),
        grid:{left:200,right:20,top:84,bottom:8},
        xAxis:{type:'category',data:cols.map(c=>UI.cnShort(c)),position:'top',
          axisLabel:{rotate:55,color:P.EC.inkSoft,fontSize:10,interval:0},axisLine:{show:false},axisTick:{show:false}},
        yAxis:{type:'category',data:cats.map(catCN),axisLabel:{color:P.EC.inkSoft,fontSize:11,interval:0},axisLine:{show:false},axisTick:{show:false}},
        visualMap:{min:0,max:1,show:false,inRange:{color:seq}},
        series:[{type:'heatmap',data,itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:3},label:{show:true,formatter:p=>p.value[2]>0?(p.value[2]*100).toFixed(0):'',color:'#fff',fontSize:9,fontFamily:P.EC.mono}}]
      },true);
    }
    root.querySelector('#secSub').textContent=`${yr} · ${cols.length} ${t('sec_sub_countries')} · ${mode==='detail'?P.DATA.sectorNames.length+' '+t('sec_sub_detail_sfx'):t('sec_sub_aggr_sfx')}`;
  }

  function drawBars(yr){
    yr=yr||P.STATE.year;
    const active=P.activeCountries();
    const sectors=P.DATA.sectorNames.slice();
    const cov=sectors.map(s=>{let n=0;active.forEach(c=>{const r=P.rec(c,yr);if(r&&r.sectors[s])n++;});return {s,n};});
    cov.sort((a,b)=>a.n-b.n);
    const top=cov.slice(-26); // show top 26 to keep readable
    root.querySelector('#secYr').textContent=yr+' ';
    const seq=getComputedStyle(document.documentElement);
    bars.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(secCN(p.name))+P.tipRow(t('ov_trend_countries_y'),p.value+' / '+active.length)}),
      grid:{left:170,right:48,top:10,bottom:20},
      xAxis:P.EC.axis({type:'value',max:active.length,name:t('ov_trend_countries_y'),nameLocation:'middle',nameGap:30}),
      yAxis:{type:'category',data:top.map(d=>secCN(d.s)),axisLabel:{color:P.EC.inkSoft,fontSize:11,interval:0},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:top.map(d=>d.n),barWidth:'62%',
        itemStyle:{color:p=>{const t=p.value/active.length;const c=['--seq-1','--seq-3','--seq-5'][t<.33?0:t<.66?1:2];return seq.getPropertyValue(c).trim();},borderRadius:[0,4,4,0]},
        label:{show:true,position:'right',color:P.EC.inkSoft,fontSize:11,fontFamily:P.EC.mono},
        animationDurationUpdate:600,animationEasingUpdate:'cubicOut'}]
    });
  }

  function secCN(s){ return window.PRISM_I18N ? window.PRISM_I18N.translateSector(s) : s; }
  function catCN(s){ return window.PRISM_I18N ? window.PRISM_I18N.translateCat(s) : s; }

  function toggleRace(){
    if(raceTimer){ stopRace(); return; }
    raceYear=P.DATA.yearMin;
    const btn=root.querySelector('#secPlay');
    btn.textContent=t('sec_pause');
    raceTimer=setInterval(()=>{
      drawBars(raceYear); drawHeat(raceYear);
      root.querySelector('#secYr').textContent=raceYear+' ';
      if(raceYear>=P.DATA.yearMax){ stopRace(); return; }
      raceYear++;
    },800);
  }
  function stopRace(){
    if(raceTimer){ clearInterval(raceTimer); raceTimer=null; }
    const btn=root&&root.querySelector('#secPlay');
    if(btn) btn.textContent=t('sec_play');
  }

  function update(){ stopRace(); drawHeat(); drawBars(); }
  P.on('tab',t=>{ if(t!=='sectors') stopRace(); });
  P.on('year',()=>{ if(UI.activeTab()==='sectors'&&!raceTimer){drawHeat();drawBars();} });
  P.on('filter',()=>{ if(UI.activeTab()==='sectors'){stopRace();drawHeat();drawBars();} });
  window.PRISM_UI&&window.PRISM_UI.register('sectors',{mount,update});
})();
