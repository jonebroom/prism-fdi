/* ============================================================
   PRISM — Tab 01: 全球概览 (world map + global trend)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let mapChart, trendChart, root;
  let mapDim='strictness', trendDim='ns_test';

  const DIMS={
    strictness:{label:'Strictness Score (0–13)',min:0,max:13,get:r=>P.strictness(r),unit:''},
    total_sectors:{label:'Sectors Covered',min:0,max:37,get:r=>P.sectorCount(r),unit:''},
    threshold:{label:'Review Threshold (equity %)',min:0,max:0.5,get:r=>r&&r.threshold!=null?r.threshold:null,unit:'%',pct:true},
    time_frame_days:{label:'Review Timeframe (days)',min:0,max:300,get:r=>r&&r.time_frame_days!=null?r.time_frame_days:null,unit:' days'},
  };
  const TREND_DIMS={
    ns_test:'National Security Test', fines:'Fines', mitigation:'Mitigation',
    interagency_review:'Interagency Review', enhanced_gov_control:'Enhanced Gov. Control',
    formal_call_in:'Formal Call-in', filing_fees:'Filing Fees',
  };

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Global FDI Screening Mechanism Distribution</h2><p>Countries shaded by selected dimension · Darker = higher value · Click country for details</p></div>
            <div style="display:flex;gap:10px;align-items:center;">
              <span class="tag">Time Series Data</span>
              <select class="dim-select" id="ovMapDim"></select>
            </div>
          </div>
          <div class="panel-body" style="padding-bottom:8px;">
            <div class="legend-row" id="ovMapLegend" style="margin-bottom:6px;"></div>
            <div class="chart" id="ovMap" style="height:500px;"></div>
          </div>
        </div>

        <div class="row-2-1">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>Global Trend</h2><p>Countries with a given feature · New mechanisms per year globally</p></div>
              <select class="dim-select" id="ovTrendDim"></select>
            </div>
            <div class="panel-body"><div class="chart" id="ovTrend" style="height:340px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="titles"><h2 id="ovSnapYr">Annual Snapshot</h2><p>Current filtered country set</p></div></div>
            <div class="panel-body"><div id="ovSnap"></div></div>
          </div>
        </div>
      </div>`;

    const ms=el.querySelector('#ovMapDim');
    Object.entries(DIMS).forEach(([k,d])=>ms.appendChild(new Option(d.label,k)));
    ms.value=mapDim; ms.onchange=()=>{mapDim=ms.value;drawMap();drawLegend();};
    const ts=el.querySelector('#ovTrendDim');
    Object.entries(TREND_DIMS).forEach(([k,l])=>ts.appendChild(new Option('Line: '+l,k)));
    ts.value=trendDim; ts.onchange=()=>{trendDim=ts.value;drawTrend();};

    mapChart=echarts.init(el.querySelector('#ovMap'));
    trendChart=echarts.init(el.querySelector('#ovTrend'));

    // floating country card
    const mapWrap=el.querySelector('#ovMap');
    mapWrap.style.position='relative';
    const mapCard=document.createElement('div');
    mapCard.id='ovMapCard';
    mapCard.style.cssText='display:none;position:absolute;z-index:120;background:#1e2433;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px;box-shadow:0 6px 28px rgba(0,0,0,.38);min-width:196px;pointer-events:auto;';
    mapWrap.appendChild(mapCard);

    mapChart.on('click',p=>{
      if(!p.data||!p.data.country||!p.data._r){ mapCard.style.display='none'; return; }
      const c=p.data.country, r=p.data._r;
      const mx=p.event.offsetX, my=p.event.offsetY;
      const mw=mapWrap.clientWidth, mh=mapWrap.clientHeight;
      const cw=210, ch=190;
      mapCard.style.left=Math.min(mx+14,mw-cw-8)+'px';
      mapCard.style.top=Math.min(my,mh-ch-8)+'px';
      mapCard.style.display='block';
      const m=UI.COVERAGE[r.coverage]||{cn:r.coverage||'—',c:'#9aa0aa'};
      mapCard.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div><div style="font-size:13px;font-weight:700;color:#f0f2f6;">${UI.cnShort(c)}</div>
          <div style="font-size:10.5px;color:#8a93a8;margin-top:1px">${c}</div></div>
          <button id="ovCardClose" style="border:none;background:none;cursor:pointer;font-size:14px;color:#8a93a8;padding:0 0 0 8px;line-height:1">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
          <div style="background:rgba(255,255,255,.07);padding:6px 8px;border-radius:6px;"><div style="font-size:9.5px;color:#8a93a8;margin-bottom:2px">Strictness</div><div style="font-size:16px;font-weight:700;color:#e8836a;font-family:var(--mono)">${P.strictness(r)}<span style="font-size:10px;font-weight:400;color:#8a93a8">/13</span></div></div>
          <div style="background:rgba(255,255,255,.07);padding:6px 8px;border-radius:6px;"><div style="font-size:9.5px;color:#8a93a8;margin-bottom:2px">Sectors</div><div style="font-size:16px;font-weight:700;color:#f0f2f6;font-family:var(--mono)">${P.sectorCount(r)}<span style="font-size:10px;font-weight:400;color:#8a93a8">/${P.DATA.sectorNames.length}</span></div></div>
        </div>
        <div style="font-size:11px;color:#8a93a8;margin-bottom:11px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${m.c};margin-right:5px;vertical-align:middle"></span>${m.cn}${r.year_established?' · Est. '+r.year_established:''}</div>
        <button id="ovCardGo" style="width:100%;padding:7px;border-radius:7px;background:var(--clay);color:#fff;border:none;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600;">View Details →</button>`;
      document.getElementById('ovCardClose').onclick=e=>{e.stopPropagation();mapCard.style.display='none';};
      document.getElementById('ovCardGo').onclick=()=>{mapCard.style.display='none';UI.selectCountry(c);UI.switchTab('country');};
    });
    document.addEventListener('click',e=>{if(!e.target.closest('#ovMapCard')&&!e.target.closest('#ovMap'))mapCard.style.display='none';});
    window.addEventListener('resize',()=>{mapChart&&mapChart.resize();trendChart&&trendChart.resize();});
  }

  function drawLegend(){
    const d=DIMS[mapDim];
    const seq=['--seq-0','--seq-1','--seq-2','--seq-3','--seq-4','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
    const lo=d.pct?(d.min*100):d.min, hi=d.pct?(d.max*100):d.max, u=d.pct?'%':d.unit;
    let grad=`<div class="lg"><span style="color:var(--ink-soft);font-size:11.5px">${d.label}</span></div>
      <span style="flex:1"></span>
      <div class="lg"><span style="font-family:var(--mono);color:var(--ink-faint)">${lo}${u}</span>
      <span style="display:inline-block;width:200px;height:11px;border-radius:6px;background:linear-gradient(to right,${seq.join(',')});border:1px solid var(--line)"></span>
      <span style="font-family:var(--mono);color:var(--ink-faint)">${hi}${u}</span></div>
      <div class="lg" style="margin-left:10px"><span class="sw" style="background:#eef0f3;border:1px solid var(--line-strong)"></span><span style="color:var(--ink-faint);font-size:11px">Not in filter / No data</span></div>
      `;
    document.getElementById('ovMapLegend').innerHTML=grad;
  }

  function drawMap(){
    if(!P.DATA.mapRegistered) return;
    const d=DIMS[mapDim], yr=P.STATE.year;
    const active=new Set(P.activeCountries());
    const mapData=[];
    P.DATA.countries.forEach(c=>{
      const r=P.rec(c.country,yr); if(!r) return;
      const inSet=active.has(c.country);
      const val=d.get(r);
      const style=inSet?{}:{areaColor:'#eef0f3',opacity:.45};
      mapData.push({ name:P.MAP_NAME[c.country]||c.country, value:(inSet&&val!=null)?val:null, country:c.country,
        itemStyle:style, _r:r, _off:!inSet });
    });
    const seq=['--seq-0','--seq-1','--seq-2','--seq-3','--seq-4','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
    mapChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'item',formatter:p=>{
        if(!p.data||!p.data._r) return UI.cnShort(p.name||'')+'<br><span style="color:#999">No data</span>';
        const r=p.data._r;
        const val=d.get(r);
        return P.tipHead(UI.cnShort(p.data.country))+
          P.tipRow('Est. Year',r.year_established||'—')+
          P.tipRow('Coverage',(UI.COVERAGE[r.coverage]||{cn:r.coverage||'—'}).cn)+
          P.tipRow('Mechanisms',r.num_mechanisms??'—')+
          P.tipRow('Sectors Covered',P.sectorCount(r))+
          P.tipRow('Strictness',P.strictness(r)+' / 13')+
          P.tipRow(d.label.replace(/\s*\(.*\)/,''), d.pct&&val!=null?(val*100).toFixed(0)+'%':(val==null?'—':val));
      }}),
      visualMap:{ min:d.min,max:d.max,calculable:true,show:false,inRange:{color:seq} },
      geo:{ map:'world', roam:true, zoom:1.2, center:[15,25], scaleLimit:{min:1,max:8},
        itemStyle:{areaColor:'#f1f2f5',borderColor:'#d4d8df',borderWidth:.5},
        emphasis:{itemStyle:{areaColor:'#e6e9ee'},label:{show:false}},
        select:{itemStyle:{areaColor:'#dfe3ea'},label:{show:false}} },
      series:[
        { type:'map', geoIndex:0, name:d.label, data:mapData,
          emphasis:{label:{show:false},itemStyle:{borderColor:'#bf6a4a',borderWidth:1.2}} }
      ]
    },true);
  }

  function drawTrend(){
    const years=P.DATA.years;
    const lineData=years.map(y=>{
      let cnt=0; P.DATA.countries.forEach(c=>{ const r=P.rec(c.country,y); if(r&&r[trendDim])cnt++; });
      return cnt;
    });
    const gy=P.DATA.yearly.global_yearly;
    const barData=years.map(y=>gy[y]?gy[y].total_new:0);
    trendChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'axis',axisPointer:{type:'cross',crossStyle:{color:'#c4c9d2'}},formatter:ps=>{
        const y=ps[0].axisValue; let h=P.tipHead(y+' · Click to jump');
        ps.forEach(p=>{ h+=P.tipRow(p.seriesName,p.value); }); return h;
      }}),
      grid:{left:44,right:48,top:70,bottom:30},
      legend:{data:['Countries with "'+TREND_DIMS[trendDim]+'"','New mechanisms (global)','EU FDI Regulation','COVID-19 legislation wave'],top:6,textStyle:{color:P.EC.inkSoft,fontSize:11},itemWidth:14,itemHeight:9},
      xAxis:[P.EC.axis({type:'category',data:years,boundaryGap:true})],
      yAxis:[
        P.EC.axis({type:'value',name:'Countries',position:'left',max:40}),
        P.EC.axis({type:'value',name:'New mechanisms',position:'right',splitLine:{show:false}})
      ],
      series:[
        { name:'New mechanisms (global)',type:'bar',yAxisIndex:1,data:barData,barWidth:'52%',
          itemStyle:{color:'#e3d9c7',borderRadius:[3,3,0,0]},z:1 },
        { name:'Countries with "'+TREND_DIMS[trendDim]+'"',type:'line',yAxisIndex:0,data:lineData,smooth:.3,
          symbol:'circle',symbolSize:6,lineStyle:{width:2.5,color:'#bf6a4a'},itemStyle:{color:'#bf6a4a'},
          areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(191,106,74,.18)'},{offset:1,color:'rgba(191,106,74,0)'}])},z:3,
          markLine:{symbol:'none',silent:true,label:{show:false},
            data:[
              {xAxis:'2019',lineStyle:{color:'#5b8db8',type:'dashed'}},
              {xAxis:'2020',lineStyle:{color:'#e07b4a',type:'dashed'}}
            ] }
        },
        {name:'EU FDI Regulation',type:'line',data:[],lineStyle:{color:'#5b8db8',type:'dashed',width:1.5},itemStyle:{color:'#5b8db8'},symbol:'none'},
        {name:'COVID-19 legislation wave',type:'line',data:[],lineStyle:{color:'#e07b4a',type:'dashed',width:1.5},itemStyle:{color:'#e07b4a'},symbol:'none'}
      ]
    },true);
    trendChart.off('click');
    trendChart.on('click',p=>{
      // p.name is the category label (year string) for bar/line on category axis
      const yr=parseInt(p.name);
      if(!isNaN(yr)&&yr>=P.DATA.yearMin&&yr<=P.DATA.yearMax) UI.setYear(yr);
    });
  }

  function drawSnap(){
    const snapYrEl=document.getElementById('ovSnapYr');
    const snapEl=document.getElementById('ovSnap');
    if(!snapYrEl||!snapEl) return;
    const yr=P.STATE.year, active=P.activeCountries();
    let withMech=0,sumSec=0,nSec=0,strictSum=0,nStrict=0; const cov={};
    active.forEach(c=>{ const r=P.rec(c,yr); if(!r)return;
      if(r.num_mechanisms){ withMech++; }
      const sc=P.sectorCount(r); if(r.num_mechanisms){sumSec+=sc;nSec++;}
      strictSum+=P.strictness(r);nStrict++;
      if(r.coverage){ cov[r.coverage]=(cov[r.coverage]||0)+1; }
    });
    snapYrEl.textContent=yr+' Snapshot';
    const covSorted=Object.entries(cov).sort((a,b)=>b[1]-a[1]);
    const covMax=Math.max(1,...covSorted.map(c=>c[1]));
    let covHtml=covSorted.map(([k,v])=>{
      const m=UI.COVERAGE[k]||{cn:k,c:'#9aa0aa'};
      return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px;">
        <span style="width:74px;font-size:11.5px;color:var(--ink-2)">${m.cn}</span>
        <span style="flex:1;height:8px;background:var(--paper-2);border-radius:4px;overflow:hidden;">
          <span style="display:block;height:100%;width:${v/covMax*100}%;background:${m.c};border-radius:4px;"></span></span>
        <span class="mono" style="font-size:11px;color:var(--ink-soft);width:18px;text-align:right">${v}</span></div>`;
    }).join('');
    document.getElementById('ovSnap').innerHTML=`
      <div class="kpi-grid kpi-grid-2" style="gap:10px;margin-bottom:16px;">
        <div class="kpi accent"><div class="kl">Countries with mechanism</div><div class="kv">${withMech}<span class="u">/ ${active.length}</span></div></div>
        <div class="kpi"><div class="kl">Avg. Strictness</div><div class="kv">${(strictSum/nStrict).toFixed(1)}<span class="u">/13</span></div></div>
        <div class="kpi"><div class="kl">Avg. Sectors Covered</div><div class="kv">${nSec?(sumSec/nSec).toFixed(0):'—'}<span class="u">/${P.DATA.sectorNames.length}</span></div></div>
        <div class="kpi"><div class="kl">New Mechanisms This Year</div><div class="kv">${P.DATA.yearly.global_yearly[yr]?P.DATA.yearly.global_yearly[yr].total_new:0}</div></div>
      </div>
      <div class="fg-h" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-faint);margin-bottom:11px;">Coverage Type Distribution</div>
      ${covHtml}`;
  }

  function update(){ drawMap(); drawTrend(); drawSnap(); drawLegend(); }

  P.on('year',()=>{ if(UI.activeTab()==='overview'){drawMap();drawSnap();} });
  P.on('filter',()=>{ if(UI.activeTab()==='overview'){drawMap();drawTrend();drawSnap();drawLegend();} });
  P.on('mapready',()=>{ if(UI.activeTab()==='overview')drawMap(); });

  window.PRISM_UI&&window.PRISM_UI.register('overview',{mount,update});
})();
