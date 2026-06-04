/* ============================================================
   PRISM — Deal Screener（国际化版）
   ============================================================ */
(function(){
  'use strict';
  const P = window.PRISM;

  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }
  function fmt(str, vars){ return str.replace(/\{(\w+)\}/g, (_,k)=>vars[k]??''); }

  const SECTOR_CATS = [
    'Defense',
    'Physical/Conventional Critical Infrastructure',
    'Next Gen Critical Infrastructure',
    'Critical Technologies and Dual Use',
    'Non-tradeable Services',
    'Finance',
    'Media',
    'Access to Personal Sensitive Data',
  ];

  function getSectorNames(){
    return (P.DATA.sectorNames||[]).slice();
  }

  function mount(el){
    const cn = k => window.PRISM_UI ? window.PRISM_UI.cnName(k) : k;
    el.innerHTML = `
      <div class="scr-wrap">
        <div class="scr-intro">${t('scr_intro')}</div>

        <div class="scr-form">
          <div class="scr-field">
            <label class="scr-label">${t('scr_target')}</label>
            <select class="scr-select" id="scrCountry">
              <option value="">${t('scr_select_country')}</option>
              ${P.DATA.countries.map(c=>`<option value="${c.country}">${cn(c.country)}</option>`).join('')}
            </select>
          </div>
          <div class="scr-field">
            <label class="scr-label">${t('scr_sector')}</label>
            <select class="scr-select" id="scrSector">
              <option value="">${t('scr_select_sector')}</option>
              <optgroup label="${t('scr_broad')}">
                ${SECTOR_CATS.map(s=>`<option value="cat:${s}">${window.PRISM_I18N?window.PRISM_I18N.translateCat(s):s}</option>`).join('')}
              </optgroup>
              <optgroup label="${t('scr_specific')}" id="scrSectorDetailed"></optgroup>
            </select>
          </div>
          <div class="scr-field">
            <label class="scr-label">${t('scr_stake')}</label>
            <div class="scr-stake-row">
              <input class="scr-input" id="scrStake" type="number" min="0" max="100" step="1" placeholder="e.g. 25">
              <span class="scr-unit">%</span>
            </div>
          </div>
          <div class="scr-field">
            <label class="scr-label">${t('scr_origin')}</label>
            <select class="scr-select" id="scrOrigin">
              <option value="">${t('scr_select_country')}</option>
              <option value="__unknown">${t('scr_unknown')}</option>
              ${P.DATA.countries.map(c=>`<option value="${c.country}" data-eu="${c.eu_eea||0}">${cn(c.country)}</option>`).join('')}
            </select>
          </div>
          <button class="scr-btn" id="scrRun">${t('scr_run')}</button>
        </div>

        <div class="scr-result" id="scrResult" style="display:none"></div>

        <div class="scr-disclaimer">${t('scr_disclaimer')}</div>
      </div>`;

    const detailedGroup = el.querySelector('#scrSectorDetailed');
    getSectorNames().forEach(s => {
      const opt = document.createElement('option');
      opt.value = 'sec:' + s;
      opt.textContent = window.PRISM_I18N ? window.PRISM_I18N.translateSector(s) : s;
      detailedGroup.appendChild(opt);
    });

    el.querySelector('#scrRun').onclick = runScreener;
    el.querySelector('#scrCountry').onchange = () => {
      el.querySelector('#scrResult').style.display = 'none';
    };
  }

  function runScreener(){
    const country = document.getElementById('scrCountry').value;
    const sectorVal = document.getElementById('scrSector').value;
    const stakeRaw = parseFloat(document.getElementById('scrStake').value);
    const originEl = document.getElementById('scrOrigin');
    const originCountry = originEl.value;
    const selectedOpt = originEl.options[originEl.selectedIndex];
    const isEuInvestor = selectedOpt && selectedOpt.dataset.eu === '1';
    const origin = originCountry === '' || originCountry === '__unknown'
      ? 'any'
      : isEuInvestor ? 'eu' : 'non-eu';
    const resultEl = document.getElementById('scrResult');
    const cName = window.PRISM_UI ? window.PRISM_UI.cnName(country) : country;

    if(!country){ showError(resultEl, t('scr_err_country')); return; }

    const r = P.rec(country, P.STATE.year);
    const stake = isNaN(stakeRaw) ? null : stakeRaw / 100;

    if(!r || !r.coverage || r.coverage === 'Draft'){
      showResult(resultEl, 'none', t('scr_no_mech_title'),
        fmt(t('scr_no_mech_body'), {c: cName, yr: P.STATE.year}),
        [country]);
      return;
    }

    if(r.coverage === 'Passed (not implemented)'){
      showResult(resultEl, 'warn', t('scr_not_impl_title'),
        fmt(t('scr_not_impl_body'), {c: cName, yr: P.STATE.year}),
        [country]);
      return;
    }

    const threshold = r.threshold;
    const isMandatory = r.preapproval && r.preapproval.toLowerCase().includes('mandatory');
    const isNotifMandatory = r.notification && r.notification.toLowerCase().includes('mandatory');
    const isCrossSectoral = r.coverage === 'Cross-sectoral' || r.coverage === 'Mixed';

    let sectorCovered = null;
    if(sectorVal){
      if(sectorVal.startsWith('cat:')){
        const catName = sectorVal.slice(4).trim();
        const cats = r.sector_categories || {};
        const matchKey = Object.keys(cats).find(k => k.trim().toLowerCase() === catName.toLowerCase());
        if(matchKey !== undefined) sectorCovered = cats[matchKey] === 1 || cats[matchKey] === true;
      } else if(sectorVal.startsWith('sec:')){
        const secName = sectorVal.slice(4);
        const secs = r.sectors || {};
        const matchKey = Object.keys(secs).find(k => k.trim().toLowerCase() === secName.trim().toLowerCase());
        if(matchKey !== undefined) sectorCovered = secs[matchKey] === 1 || secs[matchKey] === true;
      }
    }

    let aboveThreshold = null;
    if(stake !== null && threshold !== null){
      aboveThreshold = stake >= threshold;
    }

    const points = [];
    let verdict, title;
    const covLabel = (window.PRISM_UI&&window.PRISM_UI.COVERAGE[r.coverage]||{cn:r.coverage}).cn;

    if(isCrossSectoral){
      points.push(fmt(t('scr_cross'), {c: cName, cov: covLabel}));
    } else {
      if(sectorCovered === true){
        points.push(fmt(t('scr_sec_in'), {c: cName}));
      } else if(sectorCovered === false){
        points.push(fmt(t('scr_sec_out'), {c: cName}));
      } else {
        points.push(fmt(t('scr_sec_unk'), {c: cName, cov: covLabel}));
      }
    }

    if(aboveThreshold === true){
      points.push(fmt(t('scr_above'), {s: (stake*100).toFixed(0), thr: (threshold*100).toFixed(0)}));
    } else if(aboveThreshold === false){
      points.push(fmt(t('scr_below'), {s: (stake*100).toFixed(0), thr: (threshold*100).toFixed(0)}));
    } else if(threshold !== null){
      points.push(fmt(t('scr_thr_only'), {thr: (threshold*100).toFixed(0)}));
    }

    if(isMandatory){
      points.push(t('scr_pre_mand'));
    } else if(isNotifMandatory){
      points.push(t('scr_notif_mand'));
    }

    if(r.eu_noeu_diff && origin !== 'any'){
      points.push(t(origin === 'eu' ? 'scr_eu_lighter' : 'scr_eu_stricter'));
    }

    if(r.time_frame_days) points.push(fmt(t('scr_timeframe'), {d: r.time_frame_days}));
    if(r.lead_authority)  points.push(fmt(t('scr_authority'), {a: r.lead_authority}));

    const likelyCovered = isCrossSectoral || sectorCovered === true;
    const likelyAbove = aboveThreshold === true || (aboveThreshold === null && stake === null);

    if(likelyCovered && likelyAbove && isMandatory){
      verdict = 'high'; title = t('scr_high_title');
    } else if(likelyCovered && aboveThreshold === false){
      verdict = 'low';  title = t('scr_low_title');
    } else if(sectorCovered === false){
      verdict = 'ok';   title = t('scr_ok_title');
    } else if(likelyCovered || isMandatory){
      verdict = 'warn'; title = t('scr_warn_title');
    } else {
      verdict = 'warn'; title = t('scr_insuf_title');
    }

    showResult(resultEl, verdict, title, points.join(' '), [country]);
  }

  function showResult(el, verdict, title, body, countries){
    const colors = {
      high:  {bg:'#fdf0ec', border:'#bf6a4a', dot:'#bf6a4a', icon:'⚠'},
      warn:  {bg:'#fdf8ec', border:'#c79a3e', dot:'#c79a3e', icon:'◈'},
      low:   {bg:'#ecf5f0', border:'#3f8a5e', dot:'#3f8a5e', icon:'↓'},
      ok:    {bg:'#ecf5f0', border:'#3f8a5e', dot:'#3f8a5e', icon:'✓'},
      none:  {bg:'#f4f5f7', border:'#9aa0aa', dot:'#9aa0aa', icon:'○'},
    };
    const c = colors[verdict] || colors.none;
    const cName = countries&&countries[0] ? (window.PRISM_UI?window.PRISM_UI.cnName(countries[0]):countries[0]) : '';
    el.style.display = '';
    el.innerHTML = `
      <div class="scr-verdict" style="background:${c.bg};border-color:${c.border}">
        <div class="scr-verdict-head">
          <span class="scr-verdict-icon" style="color:${c.dot}">${c.icon}</span>
          <span class="scr-verdict-title" style="color:${c.dot}">${title}</span>
        </div>
        <div class="scr-verdict-body">${body}</div>
        ${countries&&countries.length?`<div class="scr-verdict-link"><button class="scr-country-link" data-c="${countries[0]}">${fmt(t('scr_view_profile'),{c:cName})}</button></div>`:''}
      </div>`;
    el.querySelectorAll('.scr-country-link').forEach(btn => {
      btn.onclick = () => { window.PRISM_UI.closeScreener(); window.PRISM_UI.selectCountry(btn.dataset.c); window.PRISM_UI.switchTab('country'); };
    });
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function showError(el, msg){
    el.style.display = '';
    el.innerHTML = `<div class="scr-verdict" style="background:#fdf0ec;border-color:#bf6a4a"><div class="scr-verdict-body" style="color:#bf6a4a">${msg}</div></div>`;
  }

  // 语言切换后重建 screener 表单
  if(window.PRISM) window.PRISM.on('lang', ()=>{
    const body = document.getElementById('screenerBody');
    if(body && body.hasChildNodes()){ body.innerHTML=''; mount(body); }
  });

  window.PRISM_SCREENER = { mount };
})();
