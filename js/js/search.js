/* ============================================================
   PRISM — global search (fuzzy + full text)
   ============================================================ */
(function(){
  'use strict';
  const P=window.PRISM, UI=window.PRISM_UI;
  let fuseCountry, fuseReg, fusePolicy, mode='all';
  const input=()=>document.getElementById('globalSearch');
  const box=()=>document.getElementById('searchResults');

  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }

  function build(){
    fuseCountry=new Fuse(P.DATA.countries,{keys:['country'],threshold:.4,includeMatches:true});
    fuseReg=new Fuse(P.DATA.events.data,{keys:['regulation','lead_authority','country'],threshold:.4,includeMatches:true,ignoreLocation:true});
    buildPolicy();
  }
  function buildPolicy(){
    if(P.DATA.policy&&P.DATA.policy.docs){
      fusePolicy=new Fuse(P.DATA.policy.docs,{keys:['title','filename','full_text_preview'],threshold:.45,includeMatches:true,ignoreLocation:true,minMatchCharLength:3});
    }
  }

  /* 中文输入时，同时用英文名搜索（通过 i18n 反查） */
  function searchCountries(q){
    const results=fuseCountry.search(q);
    const seen=new Set(results.map(r=>r.item.country));
    // 中文反查
    const I18N=window.PRISM_I18N;
    if(I18N&&I18N.lang==='zh'){
      const enNames=I18N.searchEnByZh(q);
      enNames.forEach(en=>{
        if(!seen.has(en)){
          const item=P.DATA.countries.find(c=>c.country===en);
          if(item){ results.push({item,matches:[],score:0.1}); seen.add(en); }
        }
      });
    }
    return results.slice(0,5);
  }

  function run(q){
    if(!q||q.trim().length<1){ box().classList.remove('open'); return; }
    q=q.trim();
    const cR=mode==='policy'?[]:searchCountries(q);
    const rR=mode==='policy'||mode==='country'?[]:fuseReg.search(q).slice(0,7);
    const pR=(mode==='country'||!fusePolicy)?[]:fusePolicy.search(q).slice(0,8);
    let html=`<div class="sr-mode">
      <button data-m="all" class="${mode==='all'?'on':''}">${t('sr_all')}</button>
      <button data-m="country" class="${mode==='country'?'on':''}">${t('sr_countries')}</button>
      <button data-m="reg" class="${mode==='reg'?'on':''}">${t('sr_regulations')}</button>
      <button data-m="policy" class="${mode==='policy'?'on':''}">${t('sr_policy')}</button>
    </div>`;
    if(!cR.length&&!rR.length&&!pR.length){
      html+=`<div class="sr-empty">${t('sr_no_results').replace('{q}',esc(q))}</div>`;
      box().innerHTML=html; box().classList.add('open'); wireMode(); return;
    }
    if(cR.length){ html+=`<div class="sr-group"><div class="sr-label">${t('sr_countries')} · ${cR.length}</div>`+cR.map(r=>{
      const c=r.item;
      const regSfx=window.PRISM_I18N&&window.PRISM_I18N.lang==='zh'
        ? c.regulation_count+' '+t('ct_tl_regs')
        : c.regulation_count+' regulations';
      return `<div class="sr-item" data-act="country" data-v="${c.country}">
        <span class="si-ico" style="background:${P.groupColor(c.country)}22;color:${P.groupColor(c.country)}">◆</span>
        <div class="si-main"><div class="si-t">${UI.cnShort(c.country)}</div>
        <div class="si-s">${c.country} · ${regSfx} · ${t('sr_est')} ${c.year_established||'—'}</div></div></div>`;
    }).join('')+`</div>`; }
    if(rR.length){ html+=`<div class="sr-group"><div class="sr-label">${t('sr_regulations')} · ${rR.length}</div>`+rR.map(r=>{
      const e=r.item; return `<div class="sr-item" data-act="reg" data-no="${e.no}">
        <span class="si-ico">§</span>
        <div class="si-main"><div class="si-t">${hl(e.regulation,r,'regulation')}</div>
        <div class="si-s">${UI.cnShort(e.country.trim())} · ${e.year_signed||'—'} · ${e.lead_authority||'—'}</div></div></div>`;
    }).join('')+`</div>`; }
    if(pR.length){ html+=`<div class="sr-group"><div class="sr-label">${t('sr_policy')} · ${pR.length}</div>`+pR.map(r=>{
      const d=r.item; const snip=ctxSnippet(d,q);
      return `<div class="sr-item" data-act="policy" data-id="${d.id}">
        <span class="si-ico">¶</span>
        <div class="si-main"><div class="si-t">${d.title||d.filename}</div>
        <div class="si-s">${snip}</div></div></div>`;
    }).join('')+`</div>`; }
    box().innerHTML=html; box().classList.add('open');
    wireMode();
    box().querySelectorAll('.sr-item').forEach(n=>n.onclick=()=>act(n));
  }

  function wireMode(){ box().querySelectorAll('.sr-mode button').forEach(b=>b.onclick=()=>{mode=b.dataset.m;run(input().value);}); }

  function act(n){
    const a=n.dataset.act;
    if(a==='country'){ UI.selectCountry(n.dataset.v); UI.switchTab('country'); }
    else if(a==='reg'){ const e=P.DATA.events.data.find(x=>x.no==n.dataset.no); if(e){UI.selectCountry(e.country.trim());UI.switchTab('country');} }
    else if(a==='policy'){ openPolicy(n.dataset.id); }
    box().classList.remove('open'); input().blur();
  }

  function openPolicy(id){
    const d=P.DATA.policy.docs.find(x=>x.id===id); if(!d)return;
    const q=input().value.trim();
    const raw=(d.chunks&&d.chunks.length)?d.chunks.join('\n\n'):d.full_text_preview;
    const re=q&&q.length>2?new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'):null;
    const highlight=s=>re?s.replace(re,'<mark>$1</mark>'):s;
    const paras=raw.split(/\n{2,}/).map(p=>p.replace(/\n/g,' ').trim()).filter(p=>p)
      .map(p=>`<p>${highlight(esc(p))}</p>`).join('');
    const truncated=d.char_count>(raw.length+50);
    const excerptNote=t('sr_excerpt_sfx').replace('{n}',d.char_count.toLocaleString());
    const metaTitle = d.title && d.title !== d.filename ? d.title : null;
    const drawerLabel = metaTitle || d.filename;
    const charStr = t('ct_doc_chars').replace('{n}', d.char_count.toLocaleString());
    UI.openDrawer(drawerLabel,
      `${UI.cnShort((d.country||'').trim())} · ${charStr} · ${t('ct_source_file')}${d.filename}`,
      `<div class="dr-section"><div class="policy-text">${paras}${truncated?`<p style="color:var(--ink-faint);font-size:11px">${excerptNote}</p>`:''}</div></div>
       <div class="dr-section" style="margin-top:16px;display:flex;gap:8px;">
         <button class="ai-chip" style="flex:1;text-align:center" onclick="window.PRISM_AI.askAbout('Summarize the core screening mechanism of this regulation: ${(d.title||d.filename).replace(/'/g,'').replace(/\\/g,'').replace(/"/g,'')}')">${t('ct_summarize_ai')}</button>
         ${(d.ext==='.pdf'||!d.ext)
           ?`<a href="policy_files/policy_files/${encodeURIComponent(d.filename)}" download="${esc(d.filename)}" style="display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none;white-space:nowrap;">${t('ct_download_pdf')}</a>`
           :`<a href="policy_files/policy_files/${encodeURIComponent(d.filename)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;border:1px solid var(--line-strong);font-size:12px;color:var(--ink-soft);text-decoration:none;white-space:nowrap;">${t('ct_view_source')}</a>`
         }
       </div>`);
  }

  function ctxSnippet(d,q){
    const txt=d.full_text_preview||''; const lo=txt.toLowerCase(); const idx=lo.indexOf(q.toLowerCase());
    if(idx<0) return esc(txt.slice(0,90));
    const s=Math.max(0,idx-30),e=Math.min(txt.length,idx+q.length+50);
    return (s>0?'…':'')+esc(txt.slice(s,idx))+'<mark>'+esc(txt.slice(idx,idx+q.length))+'</mark>'+esc(txt.slice(idx+q.length,e))+'…';
  }
  function hl(text,r,key){ const m=(r.matches||[]).find(x=>x.key===key); if(!m)return esc(text);
    let out='',last=0; m.indices.slice(0,4).forEach(([a,b])=>{out+=esc(text.slice(last,a))+'<mark>'+esc(text.slice(a,b+1))+'</mark>';last=b+1;}); out+=esc(text.slice(last)); return out; }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function init(){
    build();
    P.on('heavyready',buildPolicy);
    const inp=input();
    let timer; inp.oninput=()=>{ clearTimeout(timer); timer=setTimeout(()=>run(inp.value),120); };
    inp.onfocus=()=>{ if(inp.value)run(inp.value); };
    document.addEventListener('click',e=>{ if(!e.target.closest('.search-box'))box().classList.remove('open'); });
    inp.onkeydown=e=>{ if(e.key==='Escape'){box().classList.remove('open');inp.blur();} };
  }
  window.PRISM_SEARCH={init,openPolicy};
})();
