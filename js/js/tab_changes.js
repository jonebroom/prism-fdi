/* ============================================================
   PRISM — Tab 05: 修法活动 (stacked bar + event list)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let chart, root, selYear=null;

  const TYPES=[
    {key:'new_law',label:'New Law',cls:'law',color:'#4f6f9e'},
    {key:'new_amendment',label:'Amendment',cls:'amend',color:'#7d97b8'},
    {key:'new_eo',label:'Exec. Order',cls:'eo',color:'#c79a3e'},
    {key:'new_reg_impl',label:'Reg. Impl.',cls:'reg',color:'#b6bcc6'},
  ];

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Global Legislative Activity</h2><p>New mechanisms per year by type · Click a bar to view all events for that year</p></div>
            <div class="legend-row" id="chgLegend"></div>
          </div>
          <div class="panel-body"><div class="chart" id="chgChart" style="height:360px;"></div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2 id="chgYrTitle">Legislative Events</h2><p id="chgYrSub">Click a bar above to select a year</p></div>
            <span class="tag" id="chgCount"></span>
          </div>
          <div class="panel-body"><div id="chgList"></div></div>
        </div>
      </div>`;
    chart=echarts.init(el.querySelector('#chgChart'));
    root.querySelector('#chgLegend').innerHTML=TYPES.map(t=>`<div class="lg"><span class="sw" style="background:${t.color}"></span>${t.label}</div>`).join('');
    chart.on('click',p=>{ if(p.name){ selYear=parseInt(p.name); UI.setYear(selYear); drawList(); highlight(); } });
    window.addEventListener('resize',()=>chart&&chart.resize());
  }

  function drawChart(){
    const years=P.DATA.years;
    const gy=P.DATA.yearly.global_yearly;
    const series=TYPES.map(t=>({
      name:t.label,type:'bar',stack:'a',data:years.map(y=>gy[y]?gy[y][t.key]:0),
      itemStyle:{color:t.color},barWidth:'58%',
      emphasis:{focus:'series'}
    }));
    // round top corners on last stack handled by separate emphasis; keep simple
    chart.setOption({
      tooltip:Object.assign(P.EC.tip(),{trigger:'axis',axisPointer:{type:'shadow'},formatter:ps=>{
        let h=P.tipHead(ps[0].axisValue+' '); let tot=0;
        ps.forEach(p=>{ if(p.value){h+=P.tipRow(p.seriesName,p.value);tot+=p.value;} });
        h+=P.tipRow('<b>Total</b>','<b>'+tot+'</b>'); return h;
      }}),
      grid:{left:40,right:24,top:14,bottom:48},
      xAxis:P.EC.axis({type:'category',data:years,axisLabel:{color:P.EC.inkSoft,fontFamily:P.EC.mono,fontSize:11}}),
      yAxis:P.EC.axis({type:'value',name:'New Mechanisms'}),
      series,
      graphic:annot(years)
    },true);
    highlight();
  }

  function annot(years){
    const items=[];
    const peaks=[{y:2020,t:'COVID-19 emergency legislation'},{y:2019,t:'EU FDI Regulation impetus'}];
    // can't easily get pixel; use markPoint instead — simpler: skip graphic
    return items;
  }

  function highlight(){
    // emphasize selected year via xAxis pointer
    chart.dispatchAction({type:'highlight'});
  }

  function drawList(){
    if(selYear===null) selYear=P.STATE.year;
    const evs=P.DATA.changes.data.filter(c=>c.year===selYear)
      .sort((a,b)=>a.country.localeCompare(b.country));
    root.querySelector('#chgYrTitle').textContent=selYear+' Legislative Events';
    const gy=P.DATA.yearly.global_yearly[selYear];
    root.querySelector('#chgYrSub').textContent=gy?`${gy.total_new} new mechanisms globally · ${evs.length} events`:`${evs.length} events`;
    root.querySelector('#chgCount').textContent=evs.length+' events';
    if(!evs.length){ root.querySelector('#chgList').innerHTML='<div class="empty"><span class="big">No events for this year</span></div>'; return; }
    root.querySelector('#chgList').innerHTML=`<div class="evlist">`+evs.map((e,i)=>{
      const tags=[];
      if(e.new_law)tags.push('<span class="chip law">New Law</span>');
      if(e.new_amendment)tags.push('<span class="chip amend">Amendment</span>');
      if(e.new_eo)tags.push('<span class="chip eo">Exec. Order</span>');
      if(!e.new_law&&!e.new_amendment&&!e.new_eo)tags.push('<span class="chip reg">Implementation</span>');
      return `<div class="evrow" data-i="${i}" style="cursor:pointer;">
        <div class="ev-yr">${e.year}</div>
        <div class="ev-body">
          <div class="ev-name">${isWeakName(e.name)?`<span style="color:var(--ink-soft);font-style:italic">Reference: ${e.name||'(untitled)'}</span>`:e.name}${e.superceded?'<span class="chip super">Supersedes</span>':''}</div>
          ${e.explanation?`<div class="ev-exp">${e.explanation}</div>`:''}
          <div class="ev-ctry">${e.country}</div>
        </div>
        <div class="ev-tag">${tags.join(' ')}</div>
      </div>`;
    }).join('')+`</div>`;
    root.querySelectorAll('.evrow').forEach(n=>n.onclick=()=>openChgDetail(evs[+n.dataset.i]));
  }

  // Detect bare reference numbers / date strings that lack meaningful name
  function isWeakName(name){
    if(!name) return true;
    if(/^\d{4}-\d{2}-\d{2}/.test(name)) return true;   // date string
    if(/^\d+\/\d{4}$/.test(name)) return true;          // bare ref like 34/2020
    if(name.trim().length < 6) return true;
    return false;
  }

  function openChgDetail(e){
    const weakName = isWeakName(e.name);
    // Only attempt match if name is meaningful and long enough to be distinctive
    const rg = weakName ? null : (P.DATA.events&&P.DATA.events.data||[]).find(r=>
      r.country&&r.country.trim()===e.country&&r.regulation&&e.name&&
      (r.regulation===e.name||
       (e.name.length>18 && e.name.includes(r.regulation.slice(0,18)))||
       (e.name.length>18 && r.regulation.includes(e.name.slice(0,18)))));
    const cov=rg?(UI.COVERAGE[rg.coverage]||{cn:rg.coverage||'—',c:'#9aa0aa'}):{cn:'—',c:'#9aa0aa'};
    const tags=[];
    if(e.new_law)tags.push('<span class="chip law">New Law</span>');
    if(e.new_amendment)tags.push('<span class="chip amend">Amendment</span>');
    if(e.new_eo)tags.push('<span class="chip eo">Exec. Order</span>');
    if(!e.new_law&&!e.new_amendment&&!e.new_eo)tags.push('<span class="chip reg">Reg. Implementation</span>');
    // policy doc
    const doc=P.DATA.policy&&P.DATA.policy.docs&&e.name?
      P.DATA.policy.docs.find(d=>d.country&&d.country.trim()===e.country&&d.title&&
        (d.title.includes(e.name.slice(0,14))||e.name.includes(d.title.slice(0,14)))):null;
    const rawText=doc?(doc.chunks&&doc.chunks.length?doc.chunks.join('\n\n'):doc.full_text_preview):null;
    const truncated=doc&&doc.char_count>(rawText?.length||0)+50;
    const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const toParas=s=>s.split(/\n{2,}/).map(p=>p.replace(/\n/g,' ').trim()).filter(p=>p).map(p=>`<p>${esc(p)}</p>`).join('');
    const fileLink=doc?(doc.ext==='.pdf'
      ?`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" download="${esc(doc.filename)}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none">↓ Download PDF</a>`
      :`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none">↗ View Source</a>`):'';
    const detail=`
      <div class="dr-section">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          ${cov.cn!=='—'?`<span class="badge" style="background:${cov.c}1f;color:${cov.c}"><span class="bd" style="background:${cov.c}"></span>${cov.cn}</span>`:''}
          ${tags.join('')}
          ${e.superceded?'<span class="chip super">Supersedes</span>':''}
        </div>
        ${e.explanation?`<div style="font-size:12.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:14px;padding:10px 12px;background:var(--bg);border-radius:8px;border-left:3px solid ${cov.c}">${esc(e.explanation)}</div>`:''}
        ${rg?`<div style="font-size:11px;color:var(--ink-faint);margin-bottom:6px;font-style:italic">Mechanism data from matched regulation: "${esc(rg.regulation)}"</div>`:''}
        <div class="inforows">
          ${rg?`<div class="inforow"><span class="ir-k">Lead Authority</span><span class="ir-v txt">${esc(rg.lead_authority||'—')}</span></div>`:''}
          ${rg?`<div class="inforow"><span class="ir-k">Review Threshold</span><span class="ir-v">${rg.threshold!=null?(rg.threshold*100).toFixed(0)+'%':'—'}</span></div>`:''}
          ${rg?`<div class="inforow"><span class="ir-k">Review Timeframe</span><span class="ir-v">${rg.time_frame_days!=null?rg.time_frame_days+' days':'—'}</span></div>`:''}
          ${rg?`<div class="inforow"><span class="ir-k">Strictness</span><span class="ir-v">${P.strictness(rg)} / 13</span></div>`:''}
          ${rg?`<div class="inforow"><span class="ir-k">Sectors Covered</span><span class="ir-v">${P.sectorCount(rg)} / ${P.DATA.sectorNames.length}</span></div>`:''}
          ${rg&&rg.ns_test?'<div class="inforow"><span class="ir-k">NS Test</span><span class="ir-v">✓ Yes</span></div>':''}
          ${!rg?`<div class="inforow"><span class="ir-k" style="color:var(--ink-faint);font-style:italic">No matched regulation record — mechanism details unavailable for this entry</span></div>`:''}
          ${e.superceded?`<div class="inforow"><span class="ir-k">Supersedes</span><span class="ir-v txt">${esc(e.superceded)}</span></div>`:''}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button class="ai-chip" style="flex:1;text-align:center" onclick="window.PRISM_UI.closeDrawer();window.PRISM_UI.selectCountry('${e.country.replace(/'/g,"\\'")}');window.PRISM_UI.switchTab('country')">View ${UI.cnShort(e.country)} details →</button>
        </div>
      </div>
      ${rawText?`<div class="dr-section"><h3>Policy Text${truncated?' (excerpt)':''} · ${doc.char_count.toLocaleString()} chars</h3>
        <div class="policy-text">${toParas(rawText)}${truncated?'<p style="color:var(--ink-faint);font-size:11px">… Full document: '+doc.char_count.toLocaleString()+' chars</p>':''}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${fileLink}
          <button class="ai-chip" style="flex:1;text-align:center" onclick="window.PRISM_AI.askAbout('Summarize the core screening mechanism of this regulation: ${(e.name||'').replace(/'/g,'').replace(/\\/g,'').replace(/"/g,'')}')">Summarize with AI →</button>
        </div></div>`
      :''}`;
    // Display name: if bare ref/date, label it clearly
    const displayName = weakName
      ? (e.name ? `Reference: ${e.name}` : 'Legislative Event')
      : (e.name || 'Legislative Event');
    UI.openDrawer(displayName, `${e.country} · ${e.year}`, detail);
  }

  function update(){ selYear=P.STATE.year; drawChart(); drawList(); }
  P.on('year',()=>{ if(UI.activeTab()==='changes'){ selYear=P.STATE.year; drawList(); highlight(); } });
  window.PRISM_UI&&window.PRISM_UI.register('changes',{mount,update});
})();
