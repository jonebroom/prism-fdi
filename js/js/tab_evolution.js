/* ============================================================
   PRISM — Tab 04: 法规演变 (coverage stream + threshold/timeframe scatter)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let streamChart, scatterChart, ridgeChart, pieChart, bubbleChart, networkChart, root, scatterDim='threshold';

  const COVS=['Sectoral','Cross-sectoral','Mixed','Asset-based','Draft','Passed (not implemented)'];

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="row2">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2 id="evoPieYr">Coverage Type Distribution</h2><p>Click a segment to see all countries of that type</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoPie" style="height:320px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>Notification × Pre-approval Matrix</h2><p>Procedural strictness combinations for current year · Bubble size = number of countries</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoBubble" style="height:320px;"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Coverage Type Evolution</h2><p>Number of countries per coverage model per year · Observe shift from Sectoral to Cross-sectoral</p></div>
            <div class="legend-row" id="evoLegend"></div>
          </div>
          <div class="panel-body"><div class="chart" id="evoStream" style="height:340px;"></div></div>
        </div>
        <div class="row2">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>Strictness Distribution Over Time</h2><p>Mean and range of strictness (0–13) per year</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoRidge" style="height:320px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2 id="evoScSub">Threshold vs Strictness</h2><p>Country mechanism positioning for current year · Click to view details</p></div>
              <div class="seg" id="evoScDim">
                <button data-v="threshold" class="on">Threshold</button>
                <button data-v="time_frame_days">Timeframe</button>
              </div>
            </div>
            <div class="panel-body"><div class="chart" id="evoScatter" style="height:320px;"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Regulation Supersession Network</h2><p>Directed edges: old → new law (supersession) · Node color by country group · Click to view country</p></div>
          </div>
          <div class="panel-body"><div class="chart" id="evoNetwork" style="height:480px;"></div></div>
        </div>
      </div>`;
    streamChart=echarts.init(el.querySelector('#evoStream'));
    scatterChart=echarts.init(el.querySelector('#evoScatter'));
    ridgeChart=echarts.init(el.querySelector('#evoRidge'));
    pieChart=echarts.init(el.querySelector('#evoPie'));
    bubbleChart=echarts.init(el.querySelector('#evoBubble'));
    networkChart=echarts.init(el.querySelector('#evoNetwork'));
    root.querySelector('#evoLegend').innerHTML=COVS.map(c=>{const m=UI.COVERAGE[c];return `<div class="lg"><span class="sw" style="background:${m.c}"></span>${m.cn}</div>`;}).join('');
    el.querySelectorAll('#evoScDim button').forEach(b=>b.onclick=()=>{
      el.querySelectorAll('#evoScDim button').forEach(x=>x.classList.toggle('on',x===b));
      scatterDim=b.dataset.v; drawScatter();
    });
    scatterChart.on('click',p=>{ if(p.data&&p.data.country){ UI.selectCountry(p.data.country); UI.switchTab('country'); } });
    bubbleChart.on('click',p=>{
      if(!p.data||!p.data.countries||!p.data.countries.length) return;
      const ni=p.value[0], pi=p.value[1], yr=P.STATE.year;
      const label=NOTIF_CN[NOTIF_LEVELS[ni]]||NOTIF_LEVELS[ni];
      const plabel=NOTIF_CN[NOTIF_LEVELS[pi]]||NOTIF_LEVELS[pi];
      const list=p.data.countries;
      UI.openDrawer(`Notification: ${label} / Pre-approval: ${plabel}`,
        `${yr} · ${list.length} countries`,
        '<div class="evlist">'+list.map(c=>`<div class="evrow" data-c="${c}"><div class="ev-body"><div class="ev-name">${UI.cnShort(c)}</div><div class="ev-ctry">${c}</div></div></div>`).join('')+'</div>');
      document.querySelectorAll('#drawerBody .evrow').forEach(n=>n.onclick=()=>{UI.closeDrawer();UI.selectCountry(n.dataset.c);UI.switchTab('country');});
    });
    pieChart.on('click',p=>{
      if(!p.data) return;
      const cov=p.data.covKey;
      const yr=P.STATE.year;
      const list=P.activeCountries().filter(c=>{const r=P.rec(c,yr);return r&&r.coverage===cov;});
      const m=UI.COVERAGE[cov]||{cn:cov,c:'#9aa0aa'};
      UI.openDrawer(m.cn+' · '+p.data.value+' countries',yr+'  · Coverage type: '+m.cn,
        '<div class="evlist">'+list.map(c=>`<div class="evrow" data-c="${c}"><div class="ev-body"><div class="ev-name">${UI.cnShort(c)}</div><div class="ev-ctry">${c}</div></div></div>`).join('')+'</div>');
      document.querySelectorAll('#drawerBody .evrow').forEach(n=>n.onclick=()=>{ UI.closeDrawer(); UI.selectCountry(n.dataset.c); UI.switchTab('country'); });
    });
    window.addEventListener('resize',()=>{
      streamChart&&streamChart.resize(); scatterChart&&scatterChart.resize();
      ridgeChart&&ridgeChart.resize(); pieChart&&pieChart.resize(); bubbleChart&&bubbleChart.resize(); networkChart&&networkChart.resize();
    });
  }

  function drawStream(){
    const years=P.DATA.years;
    const active=new Set(P.activeCountries());
    const series=COVS.map(cov=>({
      name:UI.COVERAGE[cov].cn,type:'line',stack:'t',smooth:.4,
      areaStyle:{color:UI.COVERAGE[cov].c,opacity:.78},lineStyle:{width:0},symbol:'none',
      emphasis:{focus:'series'},
      data:years.map(y=>{let n=0;P.DATA.countries.forEach(c=>{if(!active.has(c.country))return;const r=P.rec(c.country,y);if(r&&r.coverage===cov)n++;});return n;})
    }));
    streamChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'axis',formatter:ps=>{let h=P.tipHead(ps[0].axisValue+' ');ps.slice().reverse().forEach(p=>{if(p.value)h+=P.tipRow(p.seriesName,p.value);});return h;}}),
      grid:{left:40,right:20,top:14,bottom:30},
      xAxis:P.EC.axis({type:'category',data:years,boundaryGap:false,axisLabel:{fontFamily:P.EC.mono,fontSize:11,color:P.EC.inkSoft}}),
      yAxis:P.EC.axis({type:'value',name:'Countries'}),
      series
    },true);
  }

  function drawRidge(){
    const ch=ridgeChart; const years=P.DATA.years;
    const active=P.activeCountries();
    // average strictness over time + min/max band
    const avg=[],hi=[],lo=[];
    years.forEach(y=>{const vals=[];active.forEach(c=>{const r=P.rec(c,y);if(r&&r.num_mechanisms)vals.push(P.strictness(r));});
      if(vals.length){avg.push(+(vals.reduce((a,b)=>a+b)/vals.length).toFixed(2));hi.push(Math.max(...vals));lo.push(Math.min(...vals));}
      else{avg.push(null);hi.push(null);lo.push(null);}});
    ch.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'axis',formatter:ps=>{const y=ps[0].axisValue;const r=P.rec; let h=P.tipHead(y+' ');
        h+=P.tipRow('Avg. Strictness',avg[years.indexOf(+y)]??'—');h+=P.tipRow('Range',lo[years.indexOf(+y)]+' – '+hi[years.indexOf(+y)]);return h;}}),
      grid:{left:40,right:20,top:14,bottom:30},
      xAxis:P.EC.axis({type:'category',data:years,boundaryGap:false,axisLabel:{fontFamily:P.EC.mono,fontSize:11,color:P.EC.inkSoft}}),
      yAxis:P.EC.axis({type:'value',name:'Strictness',max:13,min:0}),
      series:[
        {name:'Max',type:'line',data:hi,lineStyle:{opacity:0},stack:'band',symbol:'none',areaStyle:{opacity:0}},
        {name:'Range',type:'line',data:hi.map((h,i)=>h==null?null:h-lo[i]),lineStyle:{opacity:0},areaStyle:{color:'rgba(79,111,158,.10)'},stack:'band',symbol:'none'},
        {name:'Avg. Strictness',type:'line',data:avg,smooth:.35,symbol:'circle',symbolSize:6,lineStyle:{width:3,color:'#bf6a4a'},itemStyle:{color:'#bf6a4a'},z:5}
      ]
    },true);
  }

  function drawScatter(){
    const yr=P.STATE.year;
    const active=P.activeCountries();
    const pts=[];
    active.forEach(c=>{const r=P.rec(c,yr);if(!r||!r.num_mechanisms)return;
      const x=scatterDim==='threshold'?(r.threshold!=null?r.threshold*100:null):r.time_frame_days;
      if(x==null)return;
      pts.push({value:[x,P.strictness(r),P.sectorCount(r)],country:c,itemStyle:{color:P.groupColor(c)}});
    });
    root.querySelector('#evoScSub').textContent=scatterDim==='threshold'?'Threshold vs Strictness':'Timeframe vs Strictness';
    scatterChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(UI.cnShort(p.data.country))+
        P.tipRow(scatterDim==='threshold'?'Threshold':'Timeframe',p.value[0]+(scatterDim==='threshold'?'%':' days'))+
        P.tipRow('Strictness',p.value[1]+'/13')+P.tipRow('Sectors',p.value[2])}),
      grid:{left:56,right:24,top:36,bottom:42},
      xAxis:P.EC.axis({type:'value',name:scatterDim==='threshold'?'Threshold (%)':'Timeframe (days)',nameLocation:'middle',nameGap:28,scale:true}),
      yAxis:P.EC.axis({type:'value',name:'Strictness (0–13)',max:13,min:0,nameLocation:'middle',nameGap:40,nameRotate:90}),
      series:[{type:'scatter',data:pts,symbolSize:d=>8+d[2]/P.DATA.sectorNames.length*22,
        itemStyle:{opacity:.78,borderColor:'#fff',borderWidth:1},emphasis:{scale:1.25}}]
    },true);
  }

  function drawPie(){
    const yr=P.STATE.year;
    const active=P.activeCountries();
    const cov={};
    active.forEach(c=>{const r=P.rec(c,yr);if(r&&r.coverage&&r.num_mechanisms)cov[r.coverage]=(cov[r.coverage]||0)+1;});
    root.querySelector('#evoPieYr').textContent=yr+'  Coverage Type Distribution';
    const data=Object.entries(cov).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
      const m=UI.COVERAGE[k]||{cn:k,c:'#9aa0aa'};
      return {name:m.cn,value:v,covKey:k,itemStyle:{color:m.c}};
    });
    pieChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(p.name)+P.tipRow('Countries',p.value)+P.tipRow('Share',(p.percent).toFixed(1)+'%')}),
      legend:{bottom:0,textStyle:{color:P.EC.inkSoft,fontSize:11},itemWidth:12,itemHeight:10},
      series:[{type:'pie',data,radius:['36%','66%'],center:['50%','46%'],
        label:{formatter:'{b}\n{c} countries',color:P.EC.inkSoft,fontSize:11},
        emphasis:{scale:true,scaleSize:6},
        itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:4}}]
    },true);
  }

  // Notification × Preapproval strictness tiers
  const NOTIF_LEVELS=['Not mandatory','Mandatory (some)','Mandatory (all)'];
  const NOTIF_CN={'Not mandatory':'Not mandatory','Mandatory (some)':'Some mandatory','Mandatory (all)':'All mandatory'};
  function notifLevel(v){
    if(!v||v==='Not mandatory') return 0;
    if(v.includes('some')||v.includes('real estate')) return 1;
    return 2;
  }

  function drawBubble(){
    const yr=P.STATE.year;
    const active=P.activeCountries();
    // count [notif_level][preapproval_level] → {n, countries}
    const grid=Array.from({length:3},()=>Array.from({length:3},()=>({n:0,countries:[]})));
    active.forEach(c=>{
      const r=P.rec(c,yr); if(!r||!r.num_mechanisms) return;
      const ni=notifLevel(r.notification), pi=notifLevel(r.preapproval);
      grid[ni][pi].n++; grid[ni][pi].countries.push(c);
    });
    const data=[];
    grid.forEach((row,ni)=>row.forEach((cell,pi)=>{
      if(cell.n>0) data.push({value:[ni,pi,cell.n],countries:cell.countries,
        symbolSize:Math.min(72,Math.max(20,cell.n*10)),itemStyle:{color:P.EC.color[ni*3+pi]||P.EC.color[0],opacity:.75}});
    }));
    const axisLabels=['Not\nmandatory','Some\nmandatory','All\nmandatory'];
    bubbleChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>{
        const label=NOTIF_CN[NOTIF_LEVELS[p.value[0]]]||NOTIF_LEVELS[p.value[0]];
        const plabel=NOTIF_CN[NOTIF_LEVELS[p.value[1]]]||NOTIF_LEVELS[p.value[1]];
        return P.tipHead('Notification: '+label+' / Pre-approval: '+plabel)+
          P.tipRow('Countries',p.value[2])+
          '<div style="margin-top:6px;color:var(--ink-soft);font-size:11px">'+
          p.data.countries.map(c=>UI.cnShort(c)).join('、')+'</div>';
      }}),
      grid:{left:100,right:24,top:24,bottom:90},
      xAxis:Object.assign(P.EC.axis(),{type:'category',data:axisLabels,name:'Notification',nameLocation:'middle',nameGap:52,axisTick:{show:false},axisLabel:{lineHeight:16}}),
      yAxis:Object.assign(P.EC.axis(),{type:'category',data:axisLabels,name:'Pre-approval',nameLocation:'middle',nameGap:72,axisTick:{show:false},axisLabel:{lineHeight:16}}),
      series:[{type:'scatter',data,label:{show:true,formatter:p=>p.value[2],color:'#fff',fontWeight:600,fontSize:13,fontFamily:P.EC.mono}}]
    },true);
  }

  function drawNetwork(){
    const active=new Set(P.activeCountries());
    const evs=(P.DATA.changes&&P.DATA.changes.data||[]).filter(e=>active.has(e.country)&&e.superceded&&e.name&&e.superceded.trim());
    if(!evs.length){
      networkChart.setOption({graphic:[{type:'text',style:{text:'No supersession data in current filter',fill:'#aaa',fontSize:13},left:'center',top:'center'}],series:[]},true);
      return;
    }
    // build node map: name → {country, year, isNew}
    const nodeMap=new Map();
    const addNode=(name,country,year,isNew)=>{
      if(!nodeMap.has(name)) nodeMap.set(name,{name,country,year,isNew});
    };
    evs.forEach(e=>{
      addNode(e.name,e.country,e.year,true);
      addNode(e.superceded.trim(),e.country,null,false);
    });

    const nodes=Array.from(nodeMap.values()).map(d=>({
      id:d.name,
      label:{show:true,formatter:UI.cnShort(d.country)+'\n'+(d.year||'Old law'),fontSize:9,lineHeight:14,color:'#555'},
      symbolSize:d.isNew?16:12,
      itemStyle:{color:P.groupColor(d.country),opacity:d.isNew?1:.65,borderColor:'#fff',borderWidth:1.5},
      _d:d
    }));
    const links=evs.map(e=>({
      source:e.superceded.trim(), target:e.name,
      lineStyle:{color:'#b6bcc6',width:1.4,curveness:.15}
    }));

    networkChart.setOption({
      graphic:[],
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>{
        if(p.dataType==='edge') return '';
        const d=p.data._d; if(!d) return '';
        const type=d.isNew?'New law':'Superseded law';
        return P.tipHead(UI.cnShort(d.country)+(d.year?' '+d.year:''))+
          P.tipRow('Regulation','<span style="white-space:normal;max-width:220px;display:inline-block">'+d.name+'</span>')+
          P.tipRow('Country',d.country)+P.tipRow('Type',type);
      }}),
      series:[{
        type:'graph', layout:'force', roam:true, draggable:true,
        force:{repulsion:220,gravity:0.06,edgeLength:[60,140],layoutAnimation:true},
        nodes, links,
        edgeSymbol:['none','arrow'], edgeSymbolSize:8,
        emphasis:{focus:'adjacency',scale:true,scaleSize:4},
        label:{show:true}, lineStyle:{opacity:.7}
      }]
    },true);

    networkChart.off('click');
    networkChart.on('click',p=>{
      if(p.dataType!=='node'||!p.data._d) return;
      UI.selectCountry(p.data._d.country); UI.switchTab('country');
    });
  }

  function update(){ drawPie(); drawBubble(); drawStream(); drawRidge(); drawScatter(); drawNetwork(); }
  P.on('year',()=>{ if(UI.activeTab()==='evolution'){drawPie();drawBubble();drawScatter();} });
  P.on('filter',()=>{ if(UI.activeTab()==='evolution'){update();} });
  window.PRISM_UI&&window.PRISM_UI.register('evolution',{mount,update});
})();
