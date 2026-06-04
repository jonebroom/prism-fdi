/* ============================================================
   PRISM — Tab 02: 国家详情 (radar + KPI + flags + timeline)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let radarChart, root, cmpYear=null;

  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }
  function cn(c){ return window.PRISM_I18N ? window.PRISM_I18N.countryName(c) : c; }

  function mount(el){
    root=el;
    el.innerHTML=`
      <div class="stack">
        <div class="panel" id="cHead"></div>
        <div class="row-2-1">
          <div class="panel">
            <div class="panel-head">
              <div class="titles"><h2>${t('ct_radar_title')}</h2><p>${t('ct_radar_sub')}</p></div>
              <select class="dim-select" id="cCmpYear"></select>
            </div>
            <div class="panel-body"><div class="chart" id="cRadar" style="height:360px;"></div></div>
          </div>
          <div class="panel">
            <div class="panel-head"><div class="titles"><h2>${t('ct_kpi_title')}</h2><p>${t('ct_kpi_sub')}</p></div></div>
            <div class="panel-body"><div id="cKpi"></div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="titles"><h2>${t('ct_flags_title')}</h2><p>${t('ct_flags_sub')}</p></div></div>
          <div class="panel-body"><div id="cFlags"></div></div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <div class="titles"><h2>${t('ct_tl_title')}</h2><p>${t('ct_tl_sub')}</p></div>
            <span class="tag" id="cRegTag">${t('ct_tl_tag')}</span>
          </div>
          <div class="panel-body"><div id="cTimeline"></div></div>
        </div>
      </div>`;
    radarChart=echarts.init(el.querySelector('#cRadar'));
    const cy=el.querySelector('#cCmpYear');
    cy.innerHTML=`<option value="">${t('ct_cmp_no')}</option>`;
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
    cy.innerHTML=`<option value="">${t('ct_cmp_no')}</option>`+arr.map(y=>`<option value="${y}">${t('ct_cmp_prefix')} ${y}</option>`).join('');
    if(cur&&arr.includes(parseInt(cur))) cy.value=cur; else cmpYear=null;
  }

  // Helper: plain-language filing requirement summary
  function filingLine(r){
    if(!r) return null;
    const thr = r.threshold!=null ? (r.threshold*100).toFixed(0)+'%' : null;
    const days = r.time_frame_days!=null ? r.time_frame_days+' days' : null;
    const pre = r.preapproval && r.preapproval.toLowerCase().includes('mandatory');
    const notif = r.notification && r.notification.toLowerCase().includes('mandatory');
    const parts=[];
    if(pre) parts.push(t('ct_filing_pre_mand'));
    else if(notif) parts.push(t('ct_filing_notif_mand'));
    if(thr) parts.push('threshold ≥'+thr+' equity');
    if(days) parts.push('reviewed within '+days);
    return parts.length ? parts.join(' · ') : null;
  }

  // Helper: risk level for the filing badge
  function filingRisk(r){
    if(!r || !r.coverage || ['Draft','Passed (not implemented)'].includes(r.coverage)) return 'none';
    const score = P.strictness(r);
    if(score >= 8) return 'high';
    if(score >= 4) return 'medium';
    return 'low';
  }

  function drawHead(c,r){
    const meta=P.countryMeta(c);
    const groupDefs=[];
    if(meta.oecd)      groupDefs.push({label:t('group_oecd'),      hex:P.GROUPS.oecd.hex});
    if(meta.eu_eea)    groupDefs.push({label:t('group_eu'),        hex:P.GROUPS.eu.hex});
    if(meta.five_eyes) groupDefs.push({label:t('group_fiveeyes'),  hex:P.GROUPS.fiveeyes.hex});
    const cov=UI.COVERAGE[r&&r.coverage]||{cn:(r&&r.coverage)||'No mechanism',c:'#9aa0aa'};
    const noMech = !r || !r.coverage || r.coverage==='Draft' || r.coverage==='Passed (not implemented)';
    const risk = filingRisk(r);
    const riskLabel = {none:t('ct_risk_none'),low:t('ct_risk_low'),medium:t('ct_risk_med'),high:t('ct_risk_high')}[risk];
    const riskColor = {none:'#9aa0aa',low:'#3f8a5e',medium:'#c79a3e',high:'#bf6a4a'}[risk];
    const fline = filingLine(r);

    // Review criteria in plain language
    const criteria=[];
    if(r&&r.ns_test) criteria.push(t('ct_criteria_ns'));
    if(r&&r.net_benefit_test) criteria.push(t('ct_criteria_net'));
    if(r&&r.competition_test) criteria.push(t('ct_criteria_comp'));
    if(r&&r.export_control_dualuse) criteria.push(t('ct_criteria_dual'));

    // Key procedural flags as pills
    const flags=[];
    if(r&&r.formal_call_in) flags.push(t('ct_flag_callin'));
    if(r&&r.interagency_review) flags.push(t('ct_flag_inter'));
    if(r&&r.tiered_authority) flags.push(t('ct_flag_tiered'));
    if(r&&r.mitigation) flags.push(t('ct_flag_mit'));
    if(r&&r.fines) flags.push(t('ct_flag_fines'));
    if(r&&r.enhanced_gov_control) flags.push(t('ct_flag_gov'));
    if(r&&r.eu_noeu_diff) flags.push(t('ct_flag_eu'));

    root.querySelector('#cHead').innerHTML=`
      <div class="pcard">
        <!-- top row: identity -->
        <div class="pcard-top">
          <div class="pcard-accent" style="background:${P.groupColor(c)}"></div>
          <div class="pcard-identity">
            <div class="pcard-name">${cn(c)}</div>
            <div class="pcard-sub">
              ${groupDefs.map(g=>`<span class="badge" style="background:var(--paper-2);color:var(--ink-2);"><span class="bd" style="background:${g.hex}"></span>${g.label}</span>`).join('')}
              <span style="font-size:11.5px;color:var(--ink-soft);font-family:var(--mono);">${t('ct_since')} ${meta.year_established||'—'}</span>
            </div>
          </div>
          <div class="pcard-status" style="border-color:${riskColor}20;background:${riskColor}10">
            <span class="pcard-status-dot" style="background:${riskColor}"></span>
            <span class="pcard-status-lbl" style="color:${riskColor}">${riskLabel}</span>
            <span class="pcard-status-cov" style="color:var(--ink-soft)">${cov.cn}</span>
          </div>
        </div>
        ${noMech ? `<div class="pcard-nomech">${t('ct_no_mech').replace('{year}',P.STATE.year)}</div>` : `
        <!-- main grid -->
        <div class="pcard-grid">
          <div class="pcard-block">
            <div class="pcard-block-title">${t('ct_filing_title')}</div>
            ${r.preapproval&&r.preapproval.toLowerCase().includes('mandatory')?
              `<div class="pcard-alert">${t('ct_pre_req')}</div>` :
              r.notification&&r.notification.toLowerCase().includes('mandatory')?
              `<div class="pcard-alert pcard-alert--warn">${t('ct_notif_mand')}</div>` :
              `<div class="pcard-alert pcard-alert--ok">${t('ct_no_filing')}</div>`}
            <div class="pcard-detail-rows">
              ${r.threshold!=null?`<div class="pcard-row"><span>${t('ct_threshold')}</span><strong>≥ ${(r.threshold*100).toFixed(0)}% ${t('equity_unit')}</strong></div>`:''}
              ${r.time_frame_days!=null?`<div class="pcard-row"><span>${t('ct_max_review')}</span><strong>${r.time_frame_days} ${t('ct_days')}</strong></div>`:''}
              <div class="pcard-row"><span>${t('ct_notification')}</span><strong>${window.PRISM_I18N?window.PRISM_I18N.translateNotif(r.notification):(r.notification||'—')}</strong></div>
            </div>
          </div>
          <div class="pcard-block">
            <div class="pcard-block-title">${t('ct_review_title')}</div>
            <div class="pcard-authority">${r.lead_authority||t('ct_not_spec')}</div>
            <div class="pcard-detail-rows">
              ${criteria.length?`<div class="pcard-row"><span>${t('ct_review_crit')}</span><strong>${criteria.join(', ')}</strong></div>`:''}
              <div class="pcard-row"><span>${t('ct_strictness_sc')}</span><strong>${P.strictness(r)}/13</strong></div>
              <div class="pcard-row"><span>${t('ct_sectors_scope')}</span><strong>${P.sectorCount(r)} ${P.sectorCount(r)!==1?t('ct_sectors_sfx'):t('ct_sector_sfx1')}</strong></div>
            </div>
          </div>
          <div class="pcard-block">
            <div class="pcard-block-title">${t('ct_scope_title')}</div>
            ${r.greenfield_covered?`<div class="pcard-scope-tag">${t('ct_green_cov')}</div>`:''}
            ${r.real_estate_covered?`<div class="pcard-scope-tag">${t('ct_re_cov')}</div>`:''}
            ${r.eu_noeu_diff?`<div class="pcard-scope-tag">${t('ct_eu_diff')}</div>`:''}
            <div class="pcard-pills">${flags.map(f=>`<span class="pcard-pill">${f}</span>`).join('')}</div>
          </div>
        </div>
        <!-- quick-check CTA -->
        <div class="pcard-cta">
          <button class="pcard-cta-btn" id="cQuickCheck">${t('ct_quick_check')}</button>
        </div>
        `}
      </div>`;

    // Wire quick-check button
    const qc = root.querySelector('#cQuickCheck');
    if(qc) qc.onclick = () => window.PRISM_UI.openScreener(c);
  }

  function drawKpi(c,r){
    if(!r){ root.querySelector('#cKpi').innerHTML=`<div class="empty"><span class="big">${t('ct_no_data')}</span></div>`; return; }
    const cov=UI.COVERAGE[r.coverage]||{cn:r.coverage||'—'};
    const I18N=window.PRISM_I18N;
    const tn=v=>I18N?I18N.translateNotif(v):(v||'—');
    root.querySelector('#cKpi').innerHTML=`
      <div class="inforows">
        <div class="inforow"><span class="ir-k">${t('ct_kpi_auth')}</span><span class="ir-v txt">${r.lead_authority||'—'}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_cov')}</span><span class="ir-v txt">${cov.cn}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_notif')}</span><span class="ir-v txt">${tn(r.notification)}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_pre')}</span><span class="ir-v txt">${tn(r.preapproval)}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_thresh')}</span><span class="ir-v">${r.threshold!=null?(r.threshold*100).toFixed(0)+'% '+t('equity_unit'):'—'}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_tf')}</span><span class="ir-v">${r.time_frame_days!=null?r.time_frame_days+' '+t('ct_days'):'—'}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_eu')}</span><span class="ir-v txt">${I18N?I18N.formatEuDiff(r.eu_noeu_diff):(r.eu_noeu_diff!=null?r.eu_noeu_diff:'—')}</span></div>
        <div class="inforow"><span class="ir-k">${t('ct_kpi_covid')}</span><span class="ir-v txt">${P.fmt.yn(r.covid_temporary)}</span></div>
      </div>`;
  }

  function getFLAG_GROUPS(){ return [
    {h:t('ct_fg_invest'), keys:['formal_call_in','review_increased_ownership','interagency_review','tiered_authority','enhanced_gov_control']},
    {h:t('ct_fg_tests'),  keys:['ns_test','net_benefit_test','competition_test']},
    {h:t('ct_fg_sanct'),  keys:['fines','mitigation','filing_fees','local_representation','colocation']},
    {h:t('ct_fg_scope'),  keys:['greenfield_covered','real_estate_covered','export_control_dualuse']},
  ]; }
  function drawFlags(c,r){
    if(!r){ root.querySelector('#cFlags').innerHTML=`<div class="empty">${t('ov_no_data')}</div>`; return; }
    root.querySelector('#cFlags').innerHTML=`<div class="row2">`+
      getFLAG_GROUPS().map(g=>`<div class="fieldgroup">
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
    const series=[{value:avg,name:t('ct_radar_oecd'),areaStyle:{color:'rgba(138,147,163,.10)'},lineStyle:{color:'#9aa0aa',width:1.5,type:'dashed'},itemStyle:{color:'#9aa0aa'},symbolSize:3}];
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
    root.querySelector('#cRegTag').textContent=regs.length+' '+t('ct_tl_regs');
    if(!regs.length){ root.querySelector('#cTimeline').innerHTML=`<div class="empty"><span class="big">${t('ct_tl_no_data')}</span><span>${t('ct_tl_no_data2')}</span></div>`; return; }
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
      if(chg.new_law) typeTags.push(`<span class="chip law">${t('chg_chip_law')}</span>`);
      if(chg.new_amendment) typeTags.push(`<span class="chip amend">${t('chg_chip_amend')}</span>`);
      if(chg.new_eo) typeTags.push(`<span class="chip eo">${t('chg_chip_eo')}</span>`);
    }
    // policy full text from chunks
    const rawText=doc?(doc.chunks&&doc.chunks.length?doc.chunks.join('\n\n'):doc.full_text_preview):null;
    const truncated=doc&&doc.char_count>(rawText?.length||0)+50;
    const fileLink=doc?(doc.ext==='.pdf'
      ?`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" download="${escapeHtml(doc.filename)}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none">${t('ct_download_pdf')}</a>`
      :`<a href="policy_files/policy_files/${encodeURIComponent(doc.filename)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none">${t('ct_view_source')}</a>`):'';
    const detail=`
      <div class="dr-section">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <span class="badge" style="background:${cov.c}1f;color:${cov.c}"><span class="bd" style="background:${cov.c}"></span>${cov.cn}</span>
          ${typeTags.join('')}
          ${rg.ns_test?`<span class="chip law">${t('chg_detail_ns')}</span>`:''}
          ${rg.mitigation?`<span class="chip reg">${t('ct_flag_mit')}</span>`:''}
          ${rg.fines?`<span class="chip eo">${t('ct_flag_fines')}</span>`:''}
        </div>
        ${chg&&chg.explanation?`<div style="font-size:12.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:14px;padding:10px 12px;background:var(--bg);border-radius:8px;border-left:3px solid ${cov.c}">${escapeHtml(chg.explanation)}</div>`:''}
        <div class="inforows">
          <div class="inforow"><span class="ir-k">${t('ct_reg_yr')}</span><span class="ir-v">${rg.year_signed||'—'} / ${rg.year_effective||'—'}</span></div>
          <div class="inforow"><span class="ir-k">${t('ct_reg_lead')}</span><span class="ir-v txt">${rg.lead_authority||'—'}</span></div>
          <div class="inforow"><span class="ir-k">${t('ct_reg_notif')}</span><span class="ir-v txt">${window.PRISM_I18N?window.PRISM_I18N.translateNotif(rg.notification):(rg.notification||'—')}</span></div>
          <div class="inforow"><span class="ir-k">${t('ct_reg_thresh')}</span><span class="ir-v">${rg.threshold!=null?(rg.threshold*100).toFixed(0)+'%':'—'}</span></div>
          <div class="inforow"><span class="ir-k">${t('ct_reg_tf')}</span><span class="ir-v">${rg.time_frame_days!=null?rg.time_frame_days+' '+t('ct_days'):'—'}</span></div>
          <div class="inforow"><span class="ir-k">${t('ct_reg_sectors')}</span><span class="ir-v">${P.sectorCount(rg)} / ${P.DATA.sectorNames.length}</span></div>
          ${chg&&chg.superceded?`<div class="inforow"><span class="ir-k">${t('ct_reg_supersedes')}</span><span class="ir-v txt">${escapeHtml(chg.superceded)}</span></div>`:''}
        </div>
      </div>
      ${rawText?`<div class="dr-section"><h3>${t('ct_policy_text')}${truncated?' '+t('ct_policy_excerpt'):''} · ${t('ct_doc_chars').replace('{n}',doc.char_count.toLocaleString())}</h3>
        <div class="policy-text">${toParas(rawText)}${truncated?`<p style="color:var(--ink-faint);font-size:11px">… ${doc.char_count.toLocaleString()} ${t('ct_policy_chars')}</p>`:''}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${fileLink}
          <button class="ai-chip" style="flex:1;text-align:center" onclick="window.PRISM_AI.askAbout('Summarize the core screening mechanism of this regulation: ${rg.regulation.replace(/'/g,'').replace(/\\/g,'').replace(/"/g,'')}')">${t('ct_summarize_ai')}</button>
        </div></div>`
      :`<div class="dr-section"><h3>${t('ct_policy_text')}</h3><div class="muted" style="font-size:12.5px">${t('ct_policy_none')}</div></div>`}`;
    UI.openDrawer(rg.regulation,`${UI.cnShort(rg.country.trim())} · ${rg.year_signed||''}`,detail);
  }

  function findPolicy(fileName){
    if(!fileName||!P.DATA.policy||!P.DATA.policy.docs) return null;
    const stem=fileName.replace(/\.(pdf|html)$/i,'');
    return P.DATA.policy.docs.find(d=>d.filename===fileName || d.id===stem) || null;
  }

  function shorten(s,n){ if(!s)return '—'; return s.length>n?s.slice(0,n-1)+'…':s; }
  function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function toParas(s){ return (s||'').split(/\n{2,}/).map(p=>p.replace(/\n/g,' ').trim()).filter(p=>p).map(p=>`<p>${escapeHtml(p)}</p>`).join(''); }

  P.on('country',()=>{ if(UI.activeTab()==='country')update(); });
  P.on('year',()=>{ if(UI.activeTab()==='country')update(); });
  P.on('filter',()=>{ if(UI.activeTab()==='country')update(); });
  window.PRISM_UI&&window.PRISM_UI.register('country',{mount,update});
})();
