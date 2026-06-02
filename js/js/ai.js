/* ============================================================
   PRISM — AI Q&A drawer (window.claude.complete, context-aware)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let mounted=false, busy=false;
  const history=[];

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

  const STARTERS=[
    'What are the core differences between the US and German FDI screening mechanisms?',
    'Which countries added temporary screening legislation due to COVID-19 in 2020?',
    'Which countries cover the "Artificial Intelligence" sector in the current year?',
    'Explain the difference between "Cross-sectoral" and "Sectoral" coverage.',
    'Which are the five strictest countries, and what do they have in common?',
  ];

  function dynamicChips(){
    const c=P.STATE.selectedCountry, yr=P.STATE.year, tab=UI.activeTab();
    const cn=UI.cnShort(c);
    const chips=[];
    // country-specific
    if(c){
      chips.push(`${cn}'s FDI screening mechanism evolved?`);
      chips.push(`${cn}compared to the OECD average in strictness?`);
      const r=P.rec(c,yr);
      if(r&&r.coverage) chips.push(`Which countries share the same "${(UI.COVERAGE[r.coverage]||{cn:r.coverage}).cn}" coverage type as ${cn}?`);
    }
    // tab-specific
    if(tab==='overview'||tab==='country'){
      chips.push(`${yr} strictest five countries?`);
    }
    if(tab==='evolution'){
      chips.push(`In the coverage type chart, which trend is most prominent?`);
      chips.push(`${yr} countries with fully mandatory notification and pre-approval?`);
    }
    if(tab==='compare'){
      chips.push('In the parallel coordinates, which countries exceed the average on all dimensions?');
    }
    if(tab==='changes'){
      chips.push(`${yr} most legislatively active countries and what changed?`);
    }
    if(tab==='sectors'){
      chips.push('Which sector has spread fastest over the past decade?');
      chips.push('What do countries covering the AI sector have in common?');
    }
    // fallback to starters if too few
    if(chips.length<3) chips.push(...STARTERS.slice(0,3-chips.length));
    return chips.slice(0,4);
  }

  function mount(){
    const el=document.getElementById('aiDrawer');
    el.innerHTML=`
      <div class="ai-head">
        <div class="ai-t"><span class="dot"></span>PRISM Data Assistant</div>
        <button class="ai-cfg-btn" id="aiCfg" title="Configure API Key">⚙</button>
        <button class="drawer-close" id="aiClose">✕</button>
      </div>
      <div class="ai-ctx" id="aiCtx"></div>
      <div class="ai-msgs" id="aiMsgs"></div>
      <div class="ai-chips" id="aiChips"></div>
      <div class="ai-input">
        <textarea id="aiText" placeholder="Ask about the current data… (Enter to send)"></textarea>
        <button class="ai-send" id="aiSend">↑</button>
      </div>`;
    document.getElementById('aiClose').onclick=close;
    document.getElementById('aiScrim').onclick=close;
    document.getElementById('aiCfg').onclick=()=>{
      const existing=document.getElementById('aiKeyForm');
      if(existing){ existing.remove(); return; }
      const cfg=loadCfg();
      const inp=(id,ph,val,type='text')=>`<input id="${id}" type="${type}" placeholder="${ph}" value="${esc(val||'')}" style="width:100%;padding:5px 9px;border:1px solid var(--border);border-radius:6px;font-size:11.5px;background:var(--bg-panel);color:var(--ink);font-family:monospace;box-sizing:border-box;">`;
      const s=(id,opts,val)=>`<select id="${id}" style="width:100%;padding:5px 9px;border:1px solid var(--border);border-radius:6px;font-size:11.5px;background:var(--bg-panel);color:var(--ink);">${opts.map(o=>`<option value="${o.v}"${o.v===val?' selected':''}>${o.l}</option>`).join('')}</select>`;
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
      form.style.cssText='padding:10px 14px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:7px;';
      form.innerHTML=`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">Provider</div>${s('aiProvider',PROVIDERS,cfg.provider)}</div>
          <div id="aiModelWrap"><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">Model</div><input id="aiModel" placeholder="Model name" value="${esc(cfg.model||'')}" style="width:100%;padding:5px 9px;border:1px solid var(--border);border-radius:6px;font-size:11.5px;background:var(--bg-panel);color:var(--ink);font-family:monospace;box-sizing:border-box;"></div>
        </div>
        <div id="aiBaseUrlWrap" style="display:none"><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">Base URL</div>${inp('aiBaseUrl','https://...  (v1/chat/completions prefix)',cfg.baseUrl)}</div>
        <div><div style="font-size:10px;color:var(--ink-faint);margin-bottom:3px">API Key</div>${inp('aiKeyInput','sk-... (leave empty to clear)',cfg.key,'password')}</div>
        <div style="display:flex;gap:6px;">
          <button id="aiKeySave" style="flex:1;padding:5px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:12px;">Save</button>
          <button id="aiKeyClear" style="padding:5px 10px;border-radius:6px;background:none;border:1px solid var(--border);cursor:pointer;font-size:12px;color:var(--ink-soft);">Clear</button>
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
        btn.textContent='✓ Saved'; btn.style.background='#3f8a5e';
        setTimeout(()=>{ form.remove(); pushBot(k?'✓ API key saved. You can now ask questions.':'Configuration updated (key unchanged).'); },600);
      }
      document.getElementById('aiKeySave').onclick=doSave;
      document.getElementById('aiKeyInput').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); doSave(); } };
      document.getElementById('aiKeyClear').onclick=()=>{ clearCfg(); pushBot('Configuration cleared.'); form.remove(); };
      document.getElementById('aiKeyInput').focus();
    };
    const ta=document.getElementById('aiText');
    ta.oninput=()=>{ta.style.height='40px';ta.style.height=Math.min(120,ta.scrollHeight)+'px';};
    ta.onkeydown=e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };
    document.getElementById('aiSend').onclick=send;
    renderChips(); 
    if(!history.length){ pushBot(`Hello, I am the PRISM Data Assistant. I can answer questions based on the filtered **${P.DATA.countries.length} countries · ${P.DATA.yearMin}–${P.DATA.yearMax}** FDI screening data — compare countries, explain fields, find trends. Try a prompt below or ask directly.`); }
    mounted=true;
  }

  function renderCtx(){
    const c=P.STATE.selectedCountry, yr=P.STATE.year;
    const groups=Object.entries(P.STATE.groups).filter(([k,v])=>v).map(([k])=>P.GROUPS[k].label);
    document.getElementById('aiCtx').innerHTML=
      `<span>Context</span><span class="ctag">Year ${yr}</span><span class="ctag">Country ${UI.cnShort(c)}</span><span class="ctag">Groups ${groups.join('/')}</span><span class="ctag">Tab ${tabCN()}</span>`;
  }
  function tabCN(){ return ({overview:'Overview',country:'Country Detail',compare:'Comparison',evolution:'Evolution',changes:'Changes',sectors:'Sectors'})[UI.activeTab()]; }

  function renderChips(){
    const chips=dynamicChips();
    document.getElementById('aiChips').innerHTML=chips.map(s=>`<button class="ai-chip">${s}</button>`).join('');
    document.querySelectorAll('#aiChips .ai-chip').forEach((b,i)=>b.onclick=()=>{document.getElementById('aiText').value=chips[i];send();});
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
      const prompt=`You are the PRISM FDI Screening analyst. Answer the user question based on the real data below, in English, professionally and concisely. You may use Markdown. Do not fabricate numbers not in the data.

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
        if(key!==rawKey&&rawKey) pushBot('⚠ Non-ASCII characters were stripped from your API key. Please re-enter it in the ⚙ settings.');
        const provider=cfg.provider||'anthropic';
        const model=cfg.model||(provider==='openai'?'gpt-4o-mini':'claude-haiku-4-5-20251001');
        if(!key){
          ans='**Please configure an API Key first**\n\nClick the ⚙ button to select a provider and enter your key.';
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
      busy=false; pushBot(ans||'Sorry, no valid response was received.');
    }catch(e){ busy=false; pushBot('Request error: '+e.message); }
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

  function init(){ document.getElementById('aiOpen').onclick=open; P.on('country',()=>mounted&&renderCtx()); P.on('year',()=>mounted&&renderCtx()); P.on('tab',()=>mounted&&renderCtx()); }
  window.PRISM_AI={init,open,askAbout};
})();
