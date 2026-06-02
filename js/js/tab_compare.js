/* ============================================================
   PRISM — Tab 03: 多国对比 (parallel coordinates)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let chart, root, colorBy='group';

  const AXES=[
    {name:'Mechanisms',get:r=>r.num_mechanisms,max:6},
    {name:'Strictness',get:r=>P.strictness(r),max:13},
    {name:'Sectors',get:r=>P.sectorCount(r),max:37},
    {name:'Threshold%',get:r=>r.threshold!=null?+(r.threshold*100).toFixed(0):null,max:50},
    {name:'Timeframe',get:r=>r.time_frame_days,max:300},
    {name:'Fines',get:r=>r.fines?1:0,max:1,bin:true},
    {name:'Mitigation',get:r=>r.mitigation?1:0,max:1,bin:true},
    {name:'Interagency',get:r=>r.interagency_review?1:0,max:1,bin:true},
    {name:'NS Test',get:r=>r.ns_test?1:0,max:1,bin:true},
    {name:'Net Benefit',get:r=>r.net_benefit_test?1:0,max:1,bin:true},
  ];

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="panel">
        <div class="panel-head">
          <div class="titles"><h2>Multi-Country Parallel Coordinates</h2><p id="cmpSub">Current year cross-section · Drag axis range to filter · Hover to highlight</p></div>
          <div class="seg" id="cmpColor">
            <button data-v="group" class="on">Color by group</button>
            <button data-v="strict">Color by strictness</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="legend-row" id="cmpLegend" style="margin-bottom:8px;"></div>
          <div class="chart" id="cmpChart" style="height:560px;"></div>
        </div>
      </div>`;
    chart=echarts.init(el.querySelector('#cmpChart'));
    el.querySelectorAll('#cmpColor button').forEach(b=>b.onclick=()=>{
      el.querySelectorAll('#cmpColor button').forEach(x=>x.classList.toggle('on',x===b));
      colorBy=b.dataset.v; draw();
    });
    chart.on('click',p=>{ if(p.data&&p.data.country){ UI.selectCountry(p.data.country); UI.switchTab('country'); } });
    window.addEventListener('resize',()=>chart&&chart.resize());
  }

  function legend(){
    if(colorBy==='group'){
      root.querySelector('#cmpLegend').innerHTML=
        `<div class="lg"><span class="sw" style="background:${P.GROUPS.oecd.hex}"></span>OECD</div>
         <div class="lg"><span class="sw" style="background:${P.GROUPS.eu.hex}"></span>EU/EEA</div>
         <div class="lg"><span class="sw" style="background:${P.GROUPS.fiveeyes.hex}"></span>Five Eyes</div>
         <div class="lg muted" style="margin-left:6px;font-size:11px">Click a line to view country details</div>`;
    } else {
      const seq=['--seq-1','--seq-3','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
      root.querySelector('#cmpLegend').innerHTML=`<div class="lg"><span style="font-family:var(--mono);color:var(--ink-faint)">Lenient</span>
        <span style="display:inline-block;width:120px;height:10px;border-radius:5px;background:linear-gradient(to right,${seq.join(',')})"></span>
        <span style="font-family:var(--mono);color:var(--ink-faint)">Strict</span></div>`;
    }
  }

  function draw(){
    legend();
    const yr=P.STATE.year;
    const active=P.activeCountries();
    const rows=[];
    active.forEach(c=>{ const r=P.rec(c,yr); if(!r||!r.num_mechanisms) return;
      const vals=AXES.map(a=>a.get(r));
      rows.push({country:c,value:vals,strict:P.strictness(r)});
    });
    root.querySelector('#cmpSub').innerHTML=`${yr} cross-section · ${rows.length} countries with mechanisms · Drag axis to filter · Click line for details`;
    const seq=['--seq-1','--seq-3','--seq-5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim());
    const lineColor=(d)=> colorBy==='group'? P.groupColor(d.country)
      : seq[d.strict<=4?0:d.strict<=8?1:2];
    chart.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'item',formatter:p=>{
        const d=p.data; let h=P.tipHead(UI.cnShort(d.country));
        AXES.forEach((a,i)=>{ h+=P.tipRow(a.name, a.bin?P.fmt.yn(d.value[i]):(d.value[i]==null?'—':d.value[i]+(a.name.includes('%')?'%':a.name==='Timeframe'?' days':''))); });
        return h;
      }}),
      parallelAxis:AXES.map((a,i)=>({dim:i,name:a.name,max:a.max,min:0,
        nameTextStyle:{color:P.EC.inkSoft,fontSize:11},
        axisLine:{lineStyle:{color:'#cdd2db'}},
        axisLabel:{color:P.EC.faint,fontSize:10,fontFamily:P.EC.mono,
          formatter:a.bin?(v=>v>=1?'Yes':v<=0?'No':''):undefined},
        axisTick:{show:false},
        ...(a.bin?{interval:1}:{})
      })),
      parallel:{left:60,right:42,top:30,bottom:24,
        parallelAxisDefault:{},
        axisExpandable:false},
      series:[{type:'parallel',data:rows.map(d=>({value:d.value,country:d.country,strict:d.strict,
          lineStyle:{color:lineColor(d),width:1.6,opacity:.55}})),
        emphasis:{lineStyle:{width:3,opacity:1}},
        inactiveOpacity:.06,activeOpacity:.7,
        smooth:.1
      }]
    },true);
  }

  function update(){ draw(); }
  P.on('year',()=>{ if(UI.activeTab()==='compare')draw(); });
  P.on('filter',()=>{ if(UI.activeTab()==='compare')draw(); });
  window.PRISM_UI&&window.PRISM_UI.register('compare',{mount,update});
})();
