/* ============================================================
   PRISM — Tab 02: 国家详情 (radar + KPI + flags + timeline)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let radarChart, root, cmpYear=null;

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel" id="cHead"></div>
        <div class="row-2-1">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>Multi-Dimensional Radar</h2><p>Selected country vs OECD average vs historical comparison</p></div>
              <select class="dim-select" id="cCmpYear"></select>
            </div>
            <div class="panel-body"><div class="chart" id="cRadar" style="height:360px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="titles"><h2>Key Indicators</h2><p>Mechanism overview for selected year</p></div></div>
            <div class="panel-body"><div id="cKpi"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="titles"><h2>Procedural Requirements & Coverage</h2><p>13 procedural powers + coverage fields (✓ present / ✗ absent)</p></div></div>
          <div class="panel-body"><div id="cFlags"></div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>Regulation Timeline</h2><p>All regulations for this country · Bubble size = sectors covered · Click to view full text</p></div>
            <span class="tag" id="cRegTag">Event Data</span>
          </div>
          <div class="panel-body"><div id="cTimeline"></div></div>
        </div>
      </div>`;
    radarChart=echarts.init(el.querySelector('#cRadar'));
    const cy=el.querySelector('#cCmpYear');
    cy.innerHTML='<option value="">No historical comparison</option>';
    cy.onchange=()=>{ cmpYear=cy.value?parseInt(cy.value):null; drawRadar(); };
    window.addEventListener('resize',()=>radarChart&&radarChart.resize());
  }

  function update(){
    const c=P.STATE.selectedCountry, r=P.rec(c);
    drawHead(c,r); drawKpi(c,r); drawFlags(c,r); drawTimeline(c); fillCmpYears(c); drawRadar();
  }

  function fillCmpYears(c){
    const cy=root.querySelector('#cCmpYear'); const cur=cy.value;
    const arr=(P.DATA.byCountry.get(c)||[]).map(r=>r.year);
    cy.innerHTML='<option value="">No historical comparison</option>'+arr.map(y=>`<option value="${y}">Compare ${y}</option>`).join('');
    if(cur&&arr.includes(parseInt(cur))) cy.value=cur; else cmpYear=null;
  }

  function drawHead(c,r){
    const meta=P.countryMeta(c);
    const groups=[]; if(meta.oecd)groups.push('OECD'); if(meta.eu_eea)groups.push('EU/EEA'); if(meta.five_eyes)groups.push('Five Eyes');
    const cov=UI.COVERAGE[r&&r.coverage]||{cn:(r&&r.coverage)||'No mechanism',c:'#9aa0aa'};
    root.querySelector('#cHead').innerHTML=`
      <div style="display:flex;align-items:center;gap:22px;padding:20px 24px;flex-wrap:wrap;">
        <div style="width:14px;height:46px;border-radius:4px;background:${P.groupColor(c)};"></div>
        <div>
          <div style="font-family:var(--serif);font-size:26px;font-weight:600;color:var(--ink);line-height:1;">${c}</div>
          <div style="font-size:12px;color:var(--ink-soft);margin-top:5px;font-family:var(--mono);">ISO ${meta.iso3n} · Est. ${meta.year_established||'—'}</div>
        </div>
        <div style="display:flex;gap:7px;margin-left:8px;">
          ${groups.map(g=>`<span class="badge" style="background:var(--paper-2);color:var(--ink-2);"><span class="bd" style="background:${g==='OECD'?P.GROUPS.oecd.hex:g==='EU/EEA'?P.GROUPS.eu.hex:P.GROUPS.fiveeyes.hex}"></span>${g}</span>`).join('')}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:28px;">
          <div style="text-align:right"><div class="mono" style="font-size:24px;font-weight:600;color:var(--ink)">${r?r.num_mechanisms:'—'}</div><div style="font-size:11px;color:var(--ink-soft)">Mechanisms</div></div>
          <div style="text-align:right"><div class="mono" style="font-size:24px;font-weight:600;color:var(--clay)">${r?P.strictness(r):'—'}<span style="font-size:13px;color:var(--ink-faint)">/13</span></div><div style="font-size:11px;color:var(--ink-soft)">Strictness</div></div>
          <div style="text-align:right"><div class="mono" style="font-size:24px;font-weight:600;color:var(--ink)">${r?P.sectorCount(r):'—'}<span style="font-size:13px;color:var(--ink-faint)">/${P.DATA.sectorNames.length}</span></div><div style="font-size:11px;color:var(--ink-soft)">Sectors Covered</div></div>
        </div>
      </div>`;
  }

  function drawKpi(c,r){
    if(!r){ root.querySelector('#cKpi').innerHTML='<div class="empty"><span class="big">No mechanism data for this year</span></div>'; return; }
    const cov=UI.COVERAGE[r.coverage]||{cn:r.coverage||'—'};
    root.querySelector('#cKpi').innerHTML=`
      <div class="inforows">
        <div class="inforow"><span class="ir-k">Lead Authority</span><span class="ir-v txt">${r.lead_authority||'—'}</span></div>
        <div class="inforow"><span class="ir-k">Coverage Type</span><span class="ir-v txt">${cov.cn}</span></div>
        <div class="inforow"><span class="ir-k">Notification</span><span class="ir-v txt">${r.notification||'—'}</span></div>
        <div class="inforow"><span class="ir-k">Pre-approval</span><span class="ir-v txt">${r.preapproval||'—'}</span></div>
        <div class="inforow"><span class="ir-k">Review Threshold</span><span class="ir-v">${r.threshold!=null?(r.threshold*100).toFixed(0)+'% equity':'—'}</span></div>
        <div class="inforow"><span class="ir-k">Review Timeframe</span><span class="ir-v">${r.time_frame_days!=null?r.time_frame_days+' days':'—'}</span></div>
        <div class="inforow"><span class="ir-k">EU vs non-EU Difference</span><span class="ir-v">${r.eu_noeu_diff!=null?r.eu_noeu_diff:'—'}</span></div>
        <div class="inforow"><span class="ir-k">COVID-19 Temporary Legislation</span><span class="ir-v txt">${P.fmt.yn(r.covid_temporary)}</span></div>
      </div>`;
  }

  const FLAG_GROUPS=[
    {h:'Investigation & Review Powers',keys:['formal_call_in','review_increased_ownership','interagency_review','tiered_authority','enhanced_gov_control']},
    {h:'Tests & Standards',keys:['ns_test','net_benefit_test','competition_test']},
    {h:'Sanctions & Mechanisms',keys:['fines','mitigation','filing_fees','local_representation','colocation']},
    {h:'Coverage Scope',keys:['greenfield_covered','real_estate_covered','export_control_dualuse']},
  ];
  function drawFlags(c,r){
    if(!r){ root.querySelector('#cFlags').innerHTML='<div class="empty">No data</div>'; return; }
    root.querySelector('#cFlags').innerHTML=`<div class="row2" style="grid-template-columns:repeat(2,1fr)">`+
      FLAG_GROUPS.map(g=>`<div class="fieldgroup">
        <div class="fg-h">${g.h}</div>
        <div class="flag-grid">${g.keys.map(k=>{const on=!!r[k];return `<div class="flag ${on?'yes':'no'}"><span class="fc">${on?'✓':'✕'}</span><span class="ft">${P.PROC_LABELS[k]||k}</span></div>`;}).join('')}</div>
      </div>`).join('')+`</div>`;
  }

  function drawRadar(){
    const c=P.STATE.selectedCountry, r=P.rec(c);
    const dims=P.RADAR_DIMS;
    const indicator=dims.map(d=>({name:d.label,max:1}));
    // OECD average per dim
    const oecd=P.DATA.countries.filter(x=>x.oecd).map(x=>x.country);
    const avg=dims.map(d=>{ let s=0,n=0; oecd.forEach(cc=>{const rr=P.rec(cc);if(rr){s+=rr[d.field]?1:0;n++;}}); return n?+(s/n).toFixed(2):0; });
    const series=[{value:avg,name:'OECD Average',areaStyle:{color:'rgba(138,147,163,.10)'},lineStyle:{color:'#9aa0aa',width:1.5,type:'dashed'},itemStyle:{color:'#9aa0aa'},symbolSize:3}];
    if(r){ series.unshift({value:dims.map(d=>r[d.field]?1:0),name:UI.cnShort(c)+' '+P.STATE.year,
      areaStyle:{color:'rgba(191,106,74,.16)'},lineStyle:{color:'#bf6a4a',width:2.5},itemStyle:{color:'#bf6a4a'},symbolSize:5}); }
    if(cmpYear){ const rc=P.rec(c,cmpYear); if(rc) series.push({value:dims.map(d=>rc[d.field]?1:0),name:UI.cnShort(c)+' '+cmpYear,
      lineStyle:{color:'#4f6f9e',width:1.5,type:'dotted'},itemStyle:{color:'#4f6f9e'},areaStyle:{color:'rgba(79,111,158,.06)'},symbolSize:4}); }
    radarChart.setOption({
      tooltip:Object.assign(P.EC.tip(),{}),
      legend:{bottom:0,textStyle:{color:P.EC.inkSoft,fontSize:11},itemWidth:14,itemHeight:8},
      radar:{indicator,radius:'66%',center:['50%','46%'],splitNumber:4,
        axisName:{color:P.EC.inkSoft,fontSize:11},
        splitLine:{lineStyle:{color:'#e6e8ed'}},splitArea:{areaStyle:{color:['#fbfbfc','#f4f5f7']}},
        axisLine:{lineStyle:{color:'#e0e3e8'}}},
      series:[{type:'radar',data:series,emphasis:{lineStyle:{width:3}}}]
    },true);
  }

  function drawTimeline(c){
    const regs=(P.DATA.events.by_country[c]||P.DATA.events.by_country[c+' ']||[]).slice()
      .sort((a,b)=>(a.year_signed||9999)-(b.year_signed||9999));
    root.querySelector('#cRegTag').textContent=regs.length+' regulations';
    if(!regs.length){ root.querySelector('#cTimeline').innerHTML='<div class="empty"><span class="big">No regulation-level data</span><span>This country is not included in Event Data</span></div>'; return; }
    const maxSec=Math.max(1,...regs.map(r=>P.sectorCount(r)));
    const html=`<div class="tl-track"><div class="tl-line" style="--bub:18px"></div>`+
      regs.map((rg,i)=>{
        const sec=P.sectorCount(rg); const sz=14+sec/maxSec*16;
        const cov=UI.COVERAGE[rg.coverage]||{c:'#9aa0aa'};
        return `<div class="tl-node" data-idx="${i}">
          <div class="tl-bubble" style="--sz:${sz}px;background:${cov.c}"></div>
          <div class="tl-yr">${rg.year_signed||'—'}</div>
          <div class="tl-lbl">${shorten(rg.regulation,38)}</div>
        </div>`;
      }).join('')+`</div>`;
    const node=root.querySelector('#cTimeline'); node.innerHTML=html;
    node.querySelectorAll('.tl-node').forEach(n=>n.onclick=()=>openReg(regs[+n.dataset.idx]));
  }

  function openReg(rg){
    const cov=UI.COVERAGE[rg.coverage]||{cn:rg.coverage||'—',c:'#9aa0aa'};
    const doc=findPolicy(rg.file_name);
    // match changes entry for explanation / type / superceded
    const chg=(P.DATA.changes&&P.DATA.changes.data||[]).find(c=>
      c.country===rg.country.trim()&&c.name&&rg.regulation&&
      (c.name===rg.regulation||rg.regulation.includes(c.name.slice(0,16))||c.name.includes(rg.regulation.slice(0,16))));
    const typeTags=[];
    if(chg){
      if(chg.new_law) typeTags.push('<span class="chip law">New Law</span>');
      if(chg.new_amendment) typeTags.push('<span class="chip amend">Amendment</span>');
      if(chg.new_eo) typeTags.push('<span class="chip eo">Exec. Order</span>');
    }
    // policy full text from chunks
    const rawText=doc?(doc.chunks&&doc.chunks.length?doc.chunks.join('\n\n'):doc.full_text_preview):null;
    const truncated=doc&&doc.char_count>(rawText?.length||0)+50;
    const fileLink=doc?(doc.ext==='.pdf'
      ?`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" download="${escapeHtml(doc.filename)}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--border);font-size:12px;color:var(--ink-soft);text-decoration:none">↓ Download PDF</a>`
      :`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--border);font-size:12px;color:var(--ink-soft);text-decoration:none">↗ View Source</a>`):'';
    const detail=`
      <div class="dr-section">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <span class="badge" style="background:${cov.c}1f;color:${cov.c}"><span class="bd" style="background:${cov.c}"></span>${cov.cn}</span>
          ${typeTags.join('')}
          ${rg.ns_test?'<span class="chip law">NS Test</span>':''}
          ${rg.mitigation?'<span class="chip reg">Mitigation</span>':''}
          ${rg.fines?'<span class="chip eo">Fines</span>':''}
        </div>
        ${chg&&chg.explanation?`<div style="font-size:12.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:14px;padding:10px 12px;background:var(--bg);border-radius:8px;border-left:3px solid ${cov.c}">${escapeHtml(chg.explanation)}</div>`:''}
        <div class="inforows">
          <div class="inforow"><span class="ir-k">Year Signed / Effective</span><span class="ir-v">${rg.year_signed||'—'} / ${rg.year_effective||'—'}</span></div>
          <div class="inforow"><span class="ir-k">Lead Authority</span><span class="ir-v txt">${rg.lead_authority||'—'}</span></div>
          <div class="inforow"><span class="ir-k">Notification</span><span class="ir-v txt">${rg.notification||'—'}</span></div>
          <div class="inforow"><span class="ir-k">Review Threshold</span><span class="ir-v">${rg.threshold!=null?(rg.threshold*100).toFixed(0)+'%':'—'}</span></div>
          <div class="inforow"><span class="ir-k">Review Timeframe</span><span class="ir-v">${rg.time_frame_days!=null?rg.time_frame_days+' days':'—'}</span></div>
          <div class="inforow"><span class="ir-k">Sectors Covered</span><span class="ir-v">${P.sectorCount(rg)} / ${P.DATA.sectorNames.length}</span></div>
          ${chg&&chg.superceded?`<div class="inforow"><span class="ir-k">Supersedes</span><span class="ir-v txt">${escapeHtml(chg.superceded)}</span></div>`:''}
        </div>
      </div>
      ${rawText?`<div class="dr-section"><h3>Policy Text${truncated?' (excerpt)':''} · ${doc.char_count.toLocaleString()} chars</h3>
        <div class="policy-text">${escapeHtml(rawText)}${truncated?'\n\n<span style="color:var(--ink-faint);font-size:11px">… Full document: '+doc.char_count.toLocaleString()+' chars</span>':''}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${fileLink}
          <button class="ai-chip" style="flex:1;text-align:center" onclick="window.PRISM_AI.askAbout('Summarize the core screening mechanism of this regulation: ${rg.regulation.replace(/'/g,'').replace(/\\/g,'').replace(/"/g,'')}')">Summarize with AI →</button>
        </div></div>`
      :`<div class="dr-section"><h3>Policy Text</h3><div class="muted" style="font-size:12.5px">No source file matched</div></div>`}`;
    UI.openDrawer(rg.regulation,`${UI.cnShort(rg.country.trim())} · ${rg.year_signed||''}`,detail);
  }

  function findPolicy(fileName){
    if(!fileName||!P.DATA.policy||!P.DATA.policy.docs) return null;
    const stem=fileName.replace(/\.(pdf|html)$/i,'');
    return P.DATA.policy.docs.find(d=>d.filename===fileName || d.id===stem) || null;
  }

  function shorten(s,n){ if(!s)return '—'; return s.length>n?s.slice(0,n-1)+'…':s; }
  function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  P.on('country',()=>{ if(UI.activeTab()==='country')update(); });
  P.on('year',()=>{ if(UI.activeTab()==='country')update(); });
  P.on('filter',()=>{ if(UI.activeTab()==='country')update(); });
  window.PRISM_UI&&window.PRISM_UI.register('country',{mount,update});
})();
