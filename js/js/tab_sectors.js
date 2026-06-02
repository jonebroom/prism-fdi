/* ============================================================
   PRISM — Tab 06: 行业分析 (heatmap matrix + sorted bar)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let heat, bars, root, mode='detail', raceTimer=null, raceYear=null;

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Sector Coverage Heatmap</h2><p id="secSub">Rows (sectors) × Columns (countries) · Dark = covered that year</p></div>
            <div class="seg" id="secMode">
              <button data-v="detail" class="on" id="secDetailBtn">Detailed Sectors</button>
              <button data-v="aggr">8 Aggregate Categories</button>
            </div>
          </div>
          <div class="panel-body" style="overflow-x:auto;"><div class="chart" id="secHeat"></div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Sector Coverage Ranking</h2><p>How many countries include each sector · Click Play to watch coverage spread</p></div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="tag" id="secYr"></span>
              <button class="seg-btn" id="secPlay">▶ Play</button>
            </div>
          </div>
          <div class="panel-body"><div class="chart" id="secBars" style="height:640px;"></div></div>
        </div>
      </div>`;
    heat=echarts.init(el.querySelector('#secHeat'));
    bars=echarts.init(el.querySelector('#secBars'));
    const detailBtn=el.querySelector('#secDetailBtn');
    if(detailBtn) detailBtn.textContent=P.DATA.sectorNames.length+' detailed sectors';
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
        tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(secCN(sectors[p.value[1]]))+P.tipRow(UI.cnShort(cols[p.value[0]]),p.value[2]?'✓ Covered':'Not covered')}),
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
        tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(catCN(cats[p.value[1]]))+P.tipRow(UI.cnShort(cols[p.value[0]]),(p.value[2]*100).toFixed(0)+'% coverage')}),
        grid:{left:200,right:20,top:84,bottom:8},
        xAxis:{type:'category',data:cols.map(c=>UI.cnShort(c)),position:'top',
          axisLabel:{rotate:55,color:P.EC.inkSoft,fontSize:10,interval:0},axisLine:{show:false},axisTick:{show:false}},
        yAxis:{type:'category',data:cats.map(catCN),axisLabel:{color:P.EC.inkSoft,fontSize:11,interval:0},axisLine:{show:false},axisTick:{show:false}},
        visualMap:{min:0,max:1,show:false,inRange:{color:seq}},
        series:[{type:'heatmap',data,itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:3},label:{show:true,formatter:p=>p.value[2]>0?(p.value[2]*100).toFixed(0):'',color:'#fff',fontSize:9,fontFamily:P.EC.mono}}]
      },true);
    }
    root.querySelector('#secSub').textContent=`${yr} · ${cols.length} countries · ${mode==='detail'?P.DATA.sectorNames.length+' detailed sectors':'8 categories'}`;
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
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(secCN(p.name))+P.tipRow('Countries',p.value+' / '+active.length)}),
      grid:{left:170,right:48,top:10,bottom:20},
      xAxis:P.EC.axis({type:'value',max:active.length,name:'Countries',nameLocation:'middle',nameGap:30}),
      yAxis:{type:'category',data:top.map(d=>secCN(d.s)),axisLabel:{color:P.EC.inkSoft,fontSize:11,interval:0},axisLine:{show:false},axisTick:{show:false}},
      series:[{type:'bar',data:top.map(d=>d.n),barWidth:'62%',
        itemStyle:{color:p=>{const t=p.value/active.length;const c=['--seq-1','--seq-3','--seq-5'][t<.33?0:t<.66?1:2];return seq.getPropertyValue(c).trim();},borderRadius:[0,4,4,0]},
        label:{show:true,position:'right',color:P.EC.inkSoft,fontSize:11,fontFamily:P.EC.mono},
        animationDurationUpdate:600,animationEasingUpdate:'cubicOut'}]
    });
  }

  // sector CN labels (concise)
const SEC_CN={'Defense Production':'Defense Production','Energy Infrastructure':'Energy Infrastructure','Water Infrastructure':'Water Infrastructure','Transportation Infrastructure':'Transportation Infrastructure','Telecommunications Infrastructure':'Telecom Infrastructure','Healthcare Infrastructure':'Healthcare Infrastructure','Education and Training':'Education & Training','Agriculture/Food Security':'Agriculture / Food Security','Finance':'Finance','Media':'Media','Research Institutions':'Research Institutions','Sensitive Personal Data':'Sensitive Personal Data','Controlled Dual-Use':'Controlled Dual-Use','Biotechology':'Biotechnology','Biotechnology':'Biotechnology','Artificial Intelligence and Machine Learning':'AI & Machine Learning','Logistics Technology':'Logistics Technology','Microprocessor Technology':'Microprocessor Technology','Advanced Computing Technology':'Advanced Computing','Data Analytics Technology':'Data Analytics','Quantum Information and Sensing Technology':'Quantum Technology','Additive Manufacturing':'Additive Manufacturing','Robotics':'Robotics','Brain-Computer Interfaces':'Brain-Computer Interfaces','Hypersonics':'Hypersonics','Advanced Materials':'Advanced Materials','Advanced Surveillance Technologies':'Advanced Surveillance','Cyber Security':'Cyber Security','Defense Technologies':'Defense Technologies','Energy Storage':'Energy Storage','Civil Nuclear':'Civil Nuclear','Gambling':'Gambling','Mineral Resources':'Mineral Resources','Tourism':'Tourism','Space':'Space','Critical Supplies':'Critical Supplies'};
const CAT_CN={'Defense':'Defense','Physical/Conventional Critical Infrastructure':'Physical Critical Infrastructure','Next Gen Critical Infrastructure':'Next-Gen Critical Infrastructure','Critical Technologies and Dual Use':'Critical Tech & Dual-Use','Non-tradeable Services':'Non-tradeable Services','Finance':'Finance','Media':'Media','Access to Personal Sensitive Data':'Sensitive Personal Data'};
  function secCN(s){ return SEC_CN[s]||s; }
  function catCN(s){ s=s.trim(); return CAT_CN[s]||s; }

  function toggleRace(){
    if(raceTimer){ stopRace(); return; }
    raceYear=P.DATA.yearMin;
    const btn=root.querySelector('#secPlay');
    btn.textContent='❚❚ Pause';
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
    if(btn) btn.textContent='▶ Play';
  }

  function update(){ stopRace(); drawHeat(); drawBars(); }
  P.on('year',()=>{ if(UI.activeTab()==='sectors'&&!raceTimer){drawHeat();drawBars();} });
  P.on('filter',()=>{ if(UI.activeTab()==='sectors'){stopRace();drawHeat();drawBars();} });
  window.PRISM_UI&&window.PRISM_UI.register('sectors',{mount,update});
})();
