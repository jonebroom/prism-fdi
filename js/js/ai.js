/* ============================================================
   PRISM — AI Q&A drawer (window.claude.complete, context-aware)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let mounted=false, busy=false;
  const history=[];
  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }
  function fmt(s,v){ return s.replace(/\{(\w+)\}/g,(_,k)=>v[k]??''); }

  // ---- config helpers ----
  function loadCfg(){
    try{ return JSON.parse(localStorage.getItem('prism_ai_cfg')||'{}'); }catch(e){ return {}; }
  }
  function saveCfg(cfg){
    const prev=loadCfg();
    localStorage.setItem('prism_ai_cfg',JSON.stringify({...prev,...cfg}));
    // backward-compat: also update old key slot
    if(cfg.key) localStorage.setItem('prism_claude_key',cfg.key);
  }
  function clearCfg(){ localStorage.removeItem('prism_ai_cfg'); localStorage.removeItem('prism_claude_key'); }

  // chip: { label(展示文字), query(发给AI的英文指令) }
  // zh 模式下 label 显示中文，query 保持英文保证模型理解
  const STARTERS=[
    { label:'美国与德国外资审查机制的核心差异是什么？',
      query:'What are the core differences between the US and German FDI screening mechanisms?' },
    { label:'2020 年哪些国家因新冠疫情出台了临时审查立法？',
      query:'Which countries added temporary screening legislation due to COVID-19 in 2020?' },
    { label:'当前年度哪些国家将人工智能行业纳入审查范围？',
      query:'Which countries cover the "Artificial Intelligence" sector in the current year?' },
    { label:'"跨行业型"与"行业型"覆盖有何区别？',
      query:'Explain the difference between "Cross-sectoral" and "Sectoral" coverage.' },
    { label:'严格程度最高的五个国家是哪些？它们有何共同点？',
      query:'Which are the five strictest countries, and what do they have in common?' },
  ];

  function dynamicChips(){
    const c=P.STATE.selectedCountry, yr=P.STATE.year, tab=UI.activeTab();
    const zh=window.PRISM_I18N&&window.PRISM_I18N.lang==='zh';
    const cnDisplay=UI.cnShort(c);   // 中文显示名
    const cnQuery=c||'';              // 英文国家名（发给AI）
    const chips=[];

    function chip(labelEn, labelZh, query){
      return { label: zh ? labelZh : labelEn, query: query||labelEn };
    }

    if(c){
      chips.push(chip(
        `How has ${cnQuery}'s FDI screening mechanism evolved?`,
        `${cnDisplay}的外资审查机制如何演变？`,
        `How has ${cnQuery}'s FDI screening mechanism evolved over time?`
      ));
      chips.push(chip(
        `How does ${cnQuery} compare to the OECD average in strictness?`,
        `${cnDisplay}的严格程度与 OECD 均值相比如何？`,
        `How does ${cnQuery} compare to the OECD average in strictness score?`
      ));
      const r=P.rec(c,yr);
      if(r&&r.coverage){
        const covEn=r.coverage;
        const covDisplay=(UI.COVERAGE[r.coverage]||{cn:r.coverage}).cn;
        chips.push(chip(
          `Which countries share the same "${covEn}" coverage type as ${cnQuery}?`,
          `哪些国家与${cnDisplay}同样采用"${covDisplay}"覆盖模式？`,
          `Which countries share the same "${covEn}" coverage type as ${cnQuery}?`
        ));
      }
    }
    if(tab==='overview'||tab==='country'){
      chips.push(chip(
        `Which are the five strictest countries in ${yr}?`,
        `${yr}年严格程度最高的五个国家是哪些？`,
        `Which are the five strictest countries in ${yr} and what powers do they have?`
      ));
    }
    if(tab==='evolution'){
      chips.push(chip(
        `Which coverage type trend is most prominent in the chart?`,
        `图表中哪种覆盖类型趋势最为突出？`,
        `Which coverage type trend is most prominent over the years?`
      ));
      chips.push(chip(
        `${yr} countries with fully mandatory notification and pre-approval?`,
        `${yr}年哪些国家要求全部强制通知和预批准？`,
        `Which countries in ${yr} have fully mandatory notification and pre-approval?`
      ));
    }
    if(tab==='compare'){
      chips.push(chip(
        'Which countries exceed the OECD average on all dimensions?',
        '哪些国家在所有维度上均超过 OECD 均值？',
        'Which countries exceed the OECD average on all dimensions in the parallel coordinates?'
      ));
    }
    if(tab==='changes'){
      chips.push(chip(
        `Which countries were most legislatively active in ${yr}?`,
        `${yr}年立法活动最活跃的国家有哪些？`,
        `Which countries were most legislatively active in ${yr} and what changed?`
      ));
    }
    if(tab==='sectors'){
      chips.push(chip(
        'Which sector has spread fastest over the past decade?',
        '过去十年哪个行业被纳入审查的速度最快？',
        'Which sector has spread fastest across countries over the past decade?'
      ));
      chips.push(chip(
        'What do countries covering the AI sector have in common?',
        '将 AI 行业纳入审查的国家有何共同特征？',
        'What do countries that cover the AI sector have in common?'
      ));
    }
    if(chips.length<3) chips.push(...STARTERS.slice(0,3-chips.length));
    return chips.slice(0,4);
  }

  function mount(){
    const el=document.getElementById('aiDrawer');
    el.innerHTML=`
      <div class="ai-head">
        <div class="ai-t"><span class="dot"></span>${t('ai_title')}</div>
        <button class="ai-cfg-btn" id="aiCfg" title="Configure API Key">⚙</button>
        <button class="drawer-close" id="aiClose">✕</button>
      </div>
      <div class="ai-ctx" id="aiCtx"></div>
      <div class="ai-msgs" id="aiMsgs"></div>
      <div class="ai-chips" id="aiChips"></div>
      <div class="ai-input">
        <textarea id="aiText" placeholder="${t('ai_placeholder')}"></textarea>
        <button class="ai-send" id="aiSend">↑</button>
      </div>`;
    document.getElementById('aiClose').onclick=close;
    document.getElementById('aiScrim').onclick=close;
    document.getElementById('aiCfg').onclick=()=>{
      const existing=document.getElementById('aiKeyForm');
      if(existing){ existing.remove(); return; }
      const cfg=loadCfg();
      const inp=(id,ph,val,type='text')=>`<input id="${id}" type="${type}" placeholder="${ph}" value="${esc(val||'')}" style="width:100%;padding:5px 9px;border:1px solid var(--line-strong);border-radius:6px;font-size:11.5px;background:var(--panel);color:var(--ink);font-family:monospace;box-sizing:border-box;">`;
      const s=(id,opts,val)=>`<select id="${id}" style="width:100%;padding:5px 9px;border:1px solid var(--line-strong);border-radius:6px;font-size:11.5px;background:var(--panel);color:var(--ink);">${opts.map(o=>`<option value="${o.v}"${o.v===val?' selected':''}>${o.l}</option>`).join('')}</select>`;
      const PROVIDERS=[
        {v:'anthropic',l:'Anthropic (Claude)'},
        {v:'openai',l:'OpenAI'},
        {v:'deepseek',l:'DeepSeek'},
        {v:'minimax',l:'MiniMax'},
        {v:'zhipu',l:'Zhipu GLM'},
        {v:'moonshot',l:'Moonshot Kimi'},
        {v:'custom',l:'Custom (OpenAI-compatible)'},
      ];
      const MODELS={
        anthropic:['claude-opus-4-8','claude-sonnet-4-6','claude-haiku-4-5-20251001'],
        openai:['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'],
        deepseek:['deepseek-chat','deepseek-reasoner'],
        minimax:['MiniMax-Text-01','abab6.5s-chat'],
        zhipu:['glm-4-flash','glm-4-air','glm-4'],
        moonshot:['moonshot-v1-8k','moonshot-v1-32k','moonshot-v1-128k'],
      };
      const form=document.createElement('div');
      form.id='aiKeyForm';
      form.style.cssText='padding:10px 14px;background:var(--paper-2);border-bottom:1px solid var(--line-strong);display:flex;flex-direction:column;gap:7px;';
      form.innerHTML=`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">${t('ai_prov_label')}</div>${s('aiProvider',PROVIDERS,cfg.provider)}</div>
          <div id="aiModelWrap"><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">${t('ai_model_label')}</div><input id="aiModel" placeholder="Model name" value="${esc(cfg.model||'')}" style="width:100%;padding:5px 9px;border:1px solid var(--line-strong);border-radius:6px;font-size:11.5px;background:var(--panel);color:var(--ink);font-family:monospace;box-sizing:border-box;"></div>
        </div>
        <div id="aiBaseUrlWrap" style="display:none"><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">${t('ai_baseurl_label')}</div>${inp('aiBaseUrl','https://...  (v1/chat/completions prefix)',cfg.baseUrl)}</div>
        <div><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">${t('ai_key_label')}</div>${inp('aiKeyInput',t('ai_key_ph'),cfg.key,'password')}</div>
        <div style="display:flex;gap:6px;">
          <button id="aiKeySave" style="flex:1;padding:5px;border-radius:6px;background:var(--clay);color:#fff;border:none;cursor:pointer;font-size:12px;">${t('ai_save')}</button>
          <button id="aiKeyClear" style="padding:5px 10px;border-radius:6px;background:none;border:1px solid var(--line-strong);cursor:pointer;font-size:12px;color:var(--ink-soft);">${t('ai_clear')}</button>
        </div>`;
      el.querySelector('.ai-head').insertAdjacentElement('afterend', form);
      const updateForm=()=>{
        const pv=document.getElementById('aiProvider').value;
        document.getElementById('aiBaseUrlWrap').style.display=pv==='custom'?'block':'none';
        const ms=MODELS[pv];
        if(ms){const m=document.getElementById('aiModel');if(!ms.includes(m.value))m.value=ms[0];}
      };
      document.getElementById('aiProvider').onchange=updateForm;
      updateForm();
      function doSave(){
        const k=document.getElementById('aiKeyInput').value.trim();
        saveCfg({
          provider:document.getElementById('aiProvider').value,
          model:document.getElementById('aiModel').value.trim(),
          baseUrl:document.getElementById('aiBaseUrl')?.value.trim()||'',
          key:k,
        });
        const btn=document.getElementById('aiKeySave');
        btn.textContent=t('ai_saved'); btn.style.background='#3f8a5e';
        setTimeout(()=>{ form.remove(); pushBot(k?t('ai_key_saved'):t('ai_cfg_updated')); },600);
      }
      document.getElementById('aiKeySave').onclick=doSave;
      document.getElementById('aiKeyInput').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); doSave(); } };
      document.getElementById('aiKeyClear').onclick=()=>{ clearCfg(); pushBot(t('ai_cfg_cleared')); form.remove(); };
      document.getElementById('aiKeyInput').focus();
    };
    const ta=document.getElementById('aiText');
    ta.oninput=()=>{ta.style.height='40px';ta.style.height=Math.min(120,ta.scrollHeight)+'px';};
    ta.onkeydown=e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };
    document.getElementById('aiSend').onclick=send;
    renderChips(); 
    if(!history.length){ pushBot(fmt(t('ai_welcome'),{n:P.DATA.countries.length,y1:P.DATA.yearMin,y2:P.DATA.yearMax})); }
    mounted=true;
  }

  function renderCtx(){
    const c=P.STATE.selectedCountry, yr=P.STATE.year;
    const _gKeyMap={oecd:'group_oecd',eu:'group_eu',fiveeyes:'group_fiveeyes'};
    const groups=Object.entries(P.STATE.groups).filter(([k,v])=>v).map(([k])=>t(_gKeyMap[k])||P.GROUPS[k].label);
    document.getElementById('aiCtx').innerHTML=
      `<span>${t('ai_ctx_label')}</span><span class="ctag">${t('ai_ctx_year')} ${yr}</span><span class="ctag">${t('ai_ctx_country')} ${UI.cnShort(c)}</span><span class="ctag">${t('ai_ctx_groups')} ${groups.join('/')}</span><span class="ctag">${t('ai_ctx_tab')} ${tabCN()}</span>`;
  }
  function tabCN(){ return ({overview:t('ai_tab_overview'),country:t('ai_tab_country'),compare:t('ai_tab_compare'),evolution:t('ai_tab_evolution'),changes:t('ai_tab_changes'),sectors:t('ai_tab_sectors')})[UI.activeTab()]; }

  function renderChips(){
    const chips=dynamicChips();
    document.getElementById('aiChips').innerHTML=chips.map(c=>`<button class="ai-chip">${typeof c==='string'?c:c.label}</button>`).join('');
    document.querySelectorAll('#aiChips .ai-chip').forEach((b,i)=>b.onclick=()=>{
      const c=chips[i];
      document.getElementById('aiText').value=typeof c==='string'?c:c.query;
      send();
    });
  }

  function open(){ if(!mounted)mount(); renderCtx(); renderChips(); document.getElementById('aiDrawer').classList.add('open'); document.getElementById('aiScrim').classList.add('open'); setTimeout(()=>document.getElementById('aiText').focus(),200); }
  function close(){ document.getElementById('aiDrawer').classList.remove('open'); document.getElementById('aiScrim').classList.remove('open'); }

  function pushUser(t){ history.push({role:'user',text:t}); renderMsgs(); }
  function pushBot(t){ history.push({role:'bot',text:t}); renderMsgs(); }
  function renderMsgs(){
    const m=document.getElementById('aiMsgs');
    m.innerHTML=history.map(h=>`<div class="ai-msg ${h.role}"><div class="bub">${h.role==='bot'?md(h.text):esc(h.text)}</div></div>`).join('')+
      (busy?`<div class="ai-msg bot"><div class="ai-typing"><span></span><span></span><span></span></div></div>`:'');
    m.scrollTop=m.scrollHeight;
  }

  async function send(){
    const ta=document.getElementById('aiText'); const q=ta.value.trim();
    if(!q||busy)return; ta.value='';ta.style.height='40px';
    pushUser(q); busy=true; renderMsgs(); renderChips();
    try{
      const ctx=buildContext(q);
      const isZh=window.PRISM_I18N&&window.PRISM_I18N.lang==='zh';
      const langInstruct=isZh?'请用中文专业、简洁地回答，可使用 Markdown 格式。':'Answer in English, professionally and concisely. You may use Markdown.';
      const prompt=`You are the PRISM FDI Screening analyst. ${langInstruct} Base your answer on the real data below. Do not fabricate numbers not in the data.

=== Data Context ===
${ctx}

=== User Question ===
${q}

Give a well-supported answer (under ~250 words unless a comparison list is needed):`;
      let ans;
      if(window.claude&&window.claude.complete){
        ans=await window.claude.complete(prompt);
      } else {
        const cfg=loadCfg();
        const rawKey=cfg.key||localStorage.getItem('prism_claude_key')||'';
        // Strip all non-printable-ASCII characters (non ISO-8859-1 safe range)
        const key=rawKey.replace(/[^\x21-\x7E]/g,'');
        if(key!==rawKey&&rawKey) pushBot(t('ai_nonascii_warn'));
        const provider=cfg.provider||'anthropic';
        const model=cfg.model||(provider==='openai'?'gpt-4o-mini':'claude-haiku-4-5-20251001');
        if(!key){
          ans=t('ai_no_key');
        } else if(provider==='anthropic'){
          const resp=await fetch('https://api.anthropic.com/v1/messages',{
            method:'POST',
            headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json',
                     'anthropic-dangerous-direct-browser-access':'true'},
            body:JSON.stringify({model,max_tokens:800,messages:[{role:'user',content:prompt}]})
          });
          if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error?.message||resp.statusText);}
          ans=(await resp.json()).content?.[0]?.text||'';
        } else {
          // OpenAI-compatible
          const BASE_URLS={
            openai:'https://api.openai.com/v1',
            deepseek:'https://api.deepseek.com/v1',
            minimax:'https://api.minimax.chat/v1',
            zhipu:'https://open.bigmodel.cn/api/paas/v4',
            moonshot:'https://api.moonshot.cn/v1',
          };
          const base=provider==='custom'?(cfg.baseUrl||'').replace(/\/+$/,''):(BASE_URLS[provider]||'https://api.openai.com/v1');
          const resp=await fetch(base+'/chat/completions',{
            method:'POST',
            headers:{'Authorization':'Bearer '+key,'content-type':'application/json'},
            body:JSON.stringify({model,max_tokens:800,messages:[{role:'user',content:prompt}]})
          });
          if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error(e.error?.message||resp.statusText);}
          ans=(await resp.json()).choices?.[0]?.message?.content||'';
        }
      }
      busy=false; pushBot(ans||t('ai_no_response'));
    }catch(e){ busy=false; pushBot(t('ai_req_error')+e.message); }
  }

  // build compact data context relevant to the query
  function buildContext(q){
    const yr=P.STATE.year; const lines=[];
    lines.push(`Year: ${yr}; data covers ${P.DATA.countries.length} countries, ${P.DATA.yearMin}–${P.DATA.yearMax}.`);
    lines.push(`Strictness = sum of 13 procedural powers (formal call-in, NS test, fines, mitigation, interagency review, etc.).`);
    // mentioned countries
    const mentioned=P.DATA.countries.filter(c=>q.includes(c.country)||q.includes(UI.cnShort(c.country)));
    const focus=mentioned.length?mentioned:[P.countryMeta(P.STATE.selectedCountry)].filter(Boolean);
    focus.slice(0,6).forEach(c=>{ const r=P.rec(c.country,yr); if(!r)return;
      lines.push(`【${UI.cnShort(c.country)} ${yr}】mechanisms:${r.num_mechanisms} strictness:${P.strictness(r)}/13 coverage:${r.coverage} authority:${r.lead_authority||'—'} threshold:${r.threshold!=null?(r.threshold*100)+'%':'—'} timeframe:${r.time_frame_days||'—'} days, sectors:${P.sectorCount(r)}/${P.DATA.sectorNames.length} ns_test:${r.ns_test?'Yes':'No'} mitigation:${r.mitigation?'Yes':'No'} fines:${r.fines?'Yes':'No'} interagency:${r.interagency_review?'Yes':'No'}`);
    });
    // strictness ranking
    const ranked=P.activeCountries().map(c=>{const r=P.rec(c,yr);return r&&r.num_mechanisms?{c,s:P.strictness(r),sec:P.sectorCount(r)}:null;}).filter(Boolean).sort((a,b)=>b.s-a.s);
    lines.push(`Strictness ranking (top 8): ${ranked.slice(0,8).map(x=>UI.cnShort(x.c)+'('+x.s+')').join('、')}。`);
    // yearly new
    const gy=P.DATA.yearly.global_yearly[yr];
    if(gy)lines.push(`${yr} new mechanisms globally: new_law=${gy.new_law} amendment=${gy.new_amendment} eo=${gy.new_eo} total=${gy.total_new}。`);
    // sector coverage if query mentions a sector
    P.DATA.sectorNames.forEach(s=>{ if(q.toLowerCase().includes(s.toLowerCase())||q.includes(secCN(s))){
      const list=P.activeCountries().filter(c=>{const r=P.rec(c,yr);return r&&r.sectors[s];}).map(UI.cnShort);
      lines.push(`${yr} covering "${secCN(s)}" sector (${list.length}): ${list.join('、')}。`);
    }});
    // covid
    if(q.includes('COVID')||q.includes('pandemic')||q.includes('2020')){
      const covid=P.DATA.ts.data.filter(r=>r.covid_temporary&&r.year===2020).map(r=>UI.cnShort(r.country));
      if(covid.length)lines.push(`COVID-19 temporary legislation countries (2020): ${[...new Set(covid)].join('、')}。`);
    }
    return lines.join('\n');
  }

  const SEC_CN={'Artificial Intelligence and Machine Learning':'AI & ML','Defense Production':'Defense Production','Energy Infrastructure':'Energy Infrastructure','Telecommunications Infrastructure':'Telecom Infrastructure','Sensitive Personal Data':'Sensitive Personal Data','Finance':'Finance','Cyber Security':'Cyber Security','Quantum Information and Sensing Technology':'Quantum Technology','Robotics':'Robotics','Healthcare Infrastructure':'Healthcare Infrastructure'};
  function secCN(s){ return SEC_CN[s]||s; }

  function askAbout(q){ open(); setTimeout(()=>{ document.getElementById('aiText').value=q; send(); },300); }

  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function md(s){ return esc(s)
    .replace(/^### (.*)$/gm,'<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^[-•] (.*)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g,m=>'<ul>'+m+'</ul>')
    .replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>'); }

  function init(){
    document.getElementById('aiOpen').onclick=open;
    P.on('country',()=>mounted&&renderCtx());
    P.on('year',()=>mounted&&renderCtx());
    P.on('tab',()=>mounted&&renderCtx());
    // 语言切换：重建抽屉 UI（保留对话历史）
    P.on('lang',()=>{
      if(!mounted) return;
      mounted=false;
      mount();
      renderCtx();
      renderChips();
    });
  }
  window.PRISM_AI={init,open,askAbout};
})();
