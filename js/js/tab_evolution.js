/* ============================================================
   PRISM — Tab 04: 法规演变 (coverage stream + threshold/timeframe scatter)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let streamChart, scatterChart, ridgeChart, pieChart, bubbleChart, networkChart, root, scatterDim='threshold';

  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }

  const COVS=['Sectoral','Cross-sectoral','Mixed','Asset-based','Draft','Passed (not implemented)'];

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="row2">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2 id="evoPieYr">${t('evo_pie_title')}</h2><p>${t('evo_pie_sub')}</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoPie" style="height:320px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>${t('evo_bubble_title')}</h2><p>${t('evo_bubble_sub')}</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoBubble" style="height:320px;"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>${t('evo_stream_title')}</h2><p>${t('evo_stream_sub')}</p></div>
            <div class="legend-row" id="evoLegend"></div>
          </div>
          <div class="panel-body"><div class="chart" id="evoStream" style="height:340px;"></div></div>
        </div>
        <div class="row2">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>${t('evo_ridge_title')}</h2><p>${t('evo_ridge_sub')}</p></div>
            </div>
            <div class="panel-body"><div class="chart" id="evoRidge" style="height:320px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2 id="evoScSub">${t('evo_sc_threshold')}</h2><p></p></div>
              <div class="seg" id="evoScDim">
                <button data-v="threshold" class="on">${t('evo_sc_threshold')}</button>
                <button data-v="time_frame_days">${t('evo_sc_timeframe')}</button>
              </div>
            </div>
            <div class="panel-body"><div class="chart" id="evoScatter" style="height:320px;"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>${t('evo_net_title')}</h2><p>${t('evo_net_sub')}</p></div>
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
      const axL3=getNotifLabels();
      const label=axL3[ni]||NOTIF_LEVELS[ni];
      const plabel=axL3[pi]||NOTIF_LEVELS[pi];
      const list=p.data.countries;
      UI.openDrawer(t('evo_axis_notif')+': '+label+' / '+t('evo_axis_pre')+': '+plabel,
        `${yr} · ${list.length} ${t('evo_pie_sfx')}`,
        '<div class="evlist">'+list.map(c=>`<div class="evrow" data-c="${c}"><div class="ev-body"><div class="ev-name">${UI.cnShort(c)}</div><div class="ev-ctry">${c}</div></div></div>`).join('')+'</div>');
      document.querySelectorAll('#drawerBody .evrow').forEach(n=>n.onclick=()=>{UI.closeDrawer();UI.selectCountry(n.dataset.c);UI.switchTab('country');});
    });
    pieChart.on('click',p=>{
      if(!p.data) return;
      const cov=p.data.covKey;
      const yr=P.STATE.year;
      const list=P.activeCountries().filter(c=>{const r=P.rec(c,yr);return r&&r.coverage===cov;});
      const m=UI.COVERAGE[cov]||{cn:cov,c:'#9aa0aa'};
      UI.openDrawer(m.cn+' · '+p.data.value+' '+t('evo_pie_sfx'),yr+' · '+m.cn,
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
      yAxis:P.EC.axis({type:'value',name:t('evo_countries_y')}),
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
        h+=P.tipRow(t('evo_avg_strict'),avg[years.indexOf(+y)]??'—');h+=P.tipRow(t('evo_range'),lo[years.indexOf(+y)]+' – '+hi[years.indexOf(+y)]);return h;}}),
      grid:{left:40,right:20,top:14,bottom:30},
      xAxis:P.EC.axis({type:'category',data:years,boundaryGap:false,axisLabel:{fontFamily:P.EC.mono,fontSize:11,color:P.EC.inkSoft}}),
      yAxis:P.EC.axis({type:'value',name:t('evo_strictness_y'),max:13,min:0}),
      series:[
        {name:'Max',type:'line',data:hi,lineStyle:{opacity:0},stack:'band',symbol:'none',areaStyle:{opacity:0}},
        {name:t('evo_range'),type:'line',data:hi.map((h,i)=>h==null?null:h-lo[i]),lineStyle:{opacity:0},areaStyle:{color:'rgba(79,111,158,.10)'},stack:'band',symbol:'none'},
        {name:t('evo_avg_strict'),type:'line',data:avg,smooth:.35,symbol:'circle',symbolSize:6,lineStyle:{width:3,color:'#bf6a4a'},itemStyle:{color:'#bf6a4a'},z:5}
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
    root.querySelector('#evoScSub').textContent=scatterDim==='threshold'?t('evo_sc_thresh_v'):t('evo_sc_time_v');
    scatterChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(UI.cnShort(p.data.country))+
        P.tipRow(scatterDim==='threshold'?t('evo_sc_threshold'):t('evo_sc_timeframe'),p.value[0]+(scatterDim==='threshold'?'%':' '+t('ct_days')))+
        P.tipRow(t('evo_strictness_y'),p.value[1]+'/13')+P.tipRow(t('ov_tip_sectors'),p.value[2])}),
      grid:{left:56,right:24,top:36,bottom:42},
      xAxis:P.EC.axis({type:'value',name:scatterDim==='threshold'?t('evo_axis_thresh'):t('evo_axis_time'),nameLocation:'middle',nameGap:28,scale:true}),
      yAxis:P.EC.axis({type:'value',name:t('evo_axis_strict'),max:13,min:0,nameLocation:'middle',nameGap:40,nameRotate:90}),
      series:[{type:'scatter',data:pts,symbolSize:d=>8+d[2]/P.DATA.sectorNames.length*22,
        itemStyle:{opacity:.78,borderColor:'#fff',borderWidth:1},emphasis:{scale:1.25}}]
    },true);
  }

  function drawPie(){
    const yr=P.STATE.year;
    const active=P.activeCountries();
    const cov={};
    active.forEach(c=>{const r=P.rec(c,yr);if(r&&r.coverage&&r.num_mechanisms)cov[r.coverage]=(cov[r.coverage]||0)+1;});
    root.querySelector('#evoPieYr').textContent=yr+'  '+t('evo_pie_yr_sfx');
    const data=Object.entries(cov).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
      const m=UI.COVERAGE[k]||{cn:k,c:'#9aa0aa'};
      return {name:m.cn,value:v,covKey:k,itemStyle:{color:m.c}};
    });
    pieChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>P.tipHead(p.name)+P.tipRow(t('ov_trend_countries_y'),p.value)+P.tipRow(t('tip_share'),(p.percent).toFixed(1)+'%')}),
      legend:{bottom:0,textStyle:{color:P.EC.inkSoft,fontSize:11},itemWidth:12,itemHeight:10},
      series:[{type:'pie',data,radius:['36%','66%'],center:['50%','46%'],
        label:{formatter:p=>p.name+'\n'+p.value+' '+t('evo_pie_sfx'),color:P.EC.inkSoft,fontSize:11},
        emphasis:{scale:true,scaleSize:6},
        itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:4}}]
    },true);
  }

  // Notification × Preapproval strictness tiers
  const NOTIF_LEVELS=['Not mandatory','Mandatory (some)','Mandatory (all)'];
  function getNotifLabels(){ return [t('evo_notif_none'),t('evo_notif_some'),t('evo_notif_all')]; }
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
    const axisLabels=getNotifLabels();
    bubbleChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{formatter:p=>{
        const axLt=getNotifLabels();
        const label=axLt[p.value[0]]||NOTIF_LEVELS[p.value[0]];
        const plabel=axLt[p.value[1]]||NOTIF_LEVELS[p.value[1]];
        return P.tipHead(t('evo_axis_notif')+': '+label+' / '+t('evo_axis_pre')+': '+plabel)+
          P.tipRow(t('ov_trend_countries_y'),p.value[2])+
          '<div style="margin-top:6px;color:var(--ink-soft);font-size:11px">'+
          p.data.countries.map(c=>UI.cnShort(c)).join('、')+'</div>';
      }}),
      grid:{left:100,right:24,top:24,bottom:90},
      xAxis:Object.assign(P.EC.axis(),{type:'category',data:axisLabels,name:t('evo_axis_notif'),nameLocation:'middle',nameGap:52,axisTick:{show:false},axisLabel:{lineHeight:16}}),
      yAxis:Object.assign(P.EC.axis(),{type:'category',data:axisLabels,name:t('evo_axis_pre'),nameLocation:'middle',nameGap:72,axisTick:{show:false},axisLabel:{lineHeight:16}}),
      series:[{type:'scatter',data,label:{show:true,formatter:p=>p.value[2],color:'#fff',fontWeight:600,fontSize:13,fontFamily:P.EC.mono}}]
    },true);
  }

  function drawNetwork(){
    const active=new Set(P.activeCountries());
    const evs=(P.DATA.changes&&P.DATA.changes.data||[]).filter(e=>active.has(e.country)&&e.superceded&&e.name&&e.superceded.trim());
    if(!evs.length){
      networkChart.setOption({graphic:[{type:'text',style:{text:t('evo_net_no_data'),fill:'#aaa',fontSize:13},left:'center',top:'center'}],series:[]},true);
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
      label:{show:true,formatter:UI.cnShort(d.country)+'\n'+(d.year||t('evo_net_old')),fontSize:9,lineHeight:14,color:'#555'},
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
        const type=d.isNew?t('evo_net_new'):t('evo_net_old');
        return P.tipHead(UI.cnShort(d.country)+(d.year?' '+d.year:''))+
          P.tipRow(t('tip_regulation'),'<span style="white-space:normal;max-width:220px;display:inline-block">'+d.name+'</span>')+
          P.tipRow(t('ai_ctx_country'),d.country)+P.tipRow(t('tip_type'),type);
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
