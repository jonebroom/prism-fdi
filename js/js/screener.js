/* ============================================================
   PRISM — Deal Screener
   Answers: "Do I need to file for this deal?"
   Uses existing timeseries data fields only.
   ============================================================ */
(function(){
  'use strict';
  const P = window.PRISM;

  // Sector categories from timeseries (sector_categories field)
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

  // Broader sector names from detailed sectors field
  function getSectorNames(){
    return (P.DATA.sectorNames||[]).slice();
  }

  function mount(el){
    el.innerHTML = `
      <div class="scr-wrap">
        <div class="scr-intro">Answer a few questions to check whether a foreign investment is likely to trigger screening in a given country.</div>

        <div class="scr-form">
          <div class="scr-field">
            <label class="scr-label">Target Country</label>
            <select class="scr-select" id="scrCountry">
              <option value="">— Select country —</option>
              ${P.DATA.countries.map(c=>`<option value="${c.country}">${c.country}</option>`).join('')}
            </select>
          </div>
          <div class="scr-field">
            <label class="scr-label">Sector / Industry</label>
            <select class="scr-select" id="scrSector">
              <option value="">— Select sector —</option>
              <optgroup label="Broad Categories">
                ${SECTOR_CATS.map(s=>`<option value="cat:${s}">${s}</option>`).join('')}
              </optgroup>
              <optgroup label="Specific Sectors" id="scrSectorDetailed"></optgroup>
            </select>
          </div>
          <div class="scr-field">
            <label class="scr-label">Proposed Acquisition Stake (%)</label>
            <div class="scr-stake-row">
              <input class="scr-input" id="scrStake" type="number" min="0" max="100" step="1" placeholder="e.g. 25">
              <span class="scr-unit">%</span>
            </div>
          </div>
          <div class="scr-field">
            <label class="scr-label">Your Country</label>
            <select class="scr-select" id="scrOrigin">
              <option value="">— Select country —</option>
              <option value="__unknown">Unknown / Not disclosed</option>
              ${P.DATA.countries.map(c=>`<option value="${c.country}" data-eu="${c.eu_eea||0}">${c.country}</option>`).join('')}
            </select>
          </div>
          <button class="scr-btn" id="scrRun">Check this deal →</button>
        </div>

        <div class="scr-result" id="scrResult" style="display:none"></div>

        <div class="scr-disclaimer">
          ⚠ This tool provides an indicative assessment based on publicly available data in the PRISM database. It does not constitute legal advice. Always consult the relevant national authority or legal counsel before proceeding.
        </div>
      </div>`;

    // Populate detailed sectors
    const detailedGroup = el.querySelector('#scrSectorDetailed');
    getSectorNames().forEach(s => {
      const opt = document.createElement('option');
      opt.value = 'sec:' + s;
      opt.textContent = s;
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
    const originCountry = originEl.value;  // country name, '' or '__unknown'
    // Derive EU/EEA status from the selected investor country
    const selectedOpt = originEl.options[originEl.selectedIndex];
    const isEuInvestor = selectedOpt && selectedOpt.dataset.eu === '1';
    const origin = originCountry === '' || originCountry === '__unknown'
      ? 'any'
      : isEuInvestor ? 'eu' : 'non-eu';
    const resultEl = document.getElementById('scrResult');

    if(!country){ showError(resultEl,'Please select a target country.'); return; }

    const r = P.rec(country, P.STATE.year);
    const stake = isNaN(stakeRaw) ? null : stakeRaw / 100; // normalise to 0-1

    // --- No mechanism ---
    if(!r || !r.coverage || r.coverage === 'Draft'){
      showResult(resultEl, 'none', 'No formal screening mechanism',
        `Based on available data, <strong>${country}</strong> does not have an active formal FDI screening mechanism in ${P.STATE.year}. Foreign investments are generally not subject to mandatory review.`,
        [country]);
      return;
    }

    if(r.coverage === 'Passed (not implemented)'){
      showResult(resultEl, 'warn', 'Mechanism enacted but not yet in force',
        `${country} has passed screening legislation as of ${P.STATE.year}, but implementing regulations may not yet be in effect. Monitor for implementation date.`,
        [country]);
      return;
    }

    // --- Analyse ---
    const threshold = r.threshold; // 0-1 or null
    const isMandatory = r.preapproval && r.preapproval.toLowerCase().includes('mandatory');
    const isNotifMandatory = r.notification && r.notification.toLowerCase().includes('mandatory');
    const isCrossSectoral = r.coverage === 'Cross-sectoral' || r.coverage === 'Mixed';
    const euDiff = r.eu_noeu_diff && origin === 'eu';

    // Check sector coverage
    let sectorCovered = null; // null = unknown/not checked
    if(sectorVal){
      if(sectorVal.startsWith('cat:')){
        const catName = sectorVal.slice(4).trim();
        const cats = r.sector_categories || {};
        // Find best match key
        const matchKey = Object.keys(cats).find(k => k.trim().toLowerCase() === catName.toLowerCase());
        if(matchKey !== undefined) sectorCovered = cats[matchKey] === 1 || cats[matchKey] === true;
      } else if(sectorVal.startsWith('sec:')){
        const secName = sectorVal.slice(4);
        const secs = r.sectors || {};
        const matchKey = Object.keys(secs).find(k => k.trim().toLowerCase() === secName.trim().toLowerCase());
        if(matchKey !== undefined) sectorCovered = secs[matchKey] === 1 || secs[matchKey] === true;
      }
    }

    // Threshold check
    let aboveThreshold = null;
    if(stake !== null && threshold !== null){
      aboveThreshold = stake >= threshold;
    }

    // Build verdict
    const points = [];
    let verdict, title, body;

    // Coverage scope
    if(isCrossSectoral){
      points.push(`<strong>${country}</strong> applies <strong>${r.coverage.toLowerCase()}</strong> screening — applies to most or all foreign acquisitions.`);
    } else {
      if(sectorCovered === true){
        points.push(`The selected sector is <strong>within scope</strong> of ${country}'s screening mechanism.`);
      } else if(sectorCovered === false){
        points.push(`The selected sector does <strong>not appear to be covered</strong> by ${country}'s screening mechanism based on available data.`);
      } else {
        points.push(`${country} applies <strong>${r.coverage.toLowerCase()}</strong> screening. Sector coverage for your specific industry could not be determined from available data.`);
      }
    }

    // Threshold check
    if(aboveThreshold === true){
      points.push(`Your proposed stake of <strong>${(stake*100).toFixed(0)}%</strong> is at or above the recorded review threshold of <strong>${(threshold*100).toFixed(0)}%</strong>.`);
    } else if(aboveThreshold === false){
      points.push(`Your proposed stake of <strong>${(stake*100).toFixed(0)}%</strong> is <strong>below</strong> the recorded review threshold of <strong>${(threshold*100).toFixed(0)}%</strong>. However, sector-specific thresholds may be lower.`);
    } else if(threshold !== null){
      points.push(`Review threshold: <strong>≥ ${(threshold*100).toFixed(0)}% equity</strong>.`);
    }

    // Filing type
    if(isMandatory){
      points.push(`<strong>Pre-approval is mandatory</strong> — you must receive approval before closing the transaction.`);
    } else if(isNotifMandatory){
      points.push(`<strong>Notification is mandatory</strong> — filing is required even if pre-approval is not.`);
    }

    // EU difference
    if(r.eu_noeu_diff && origin !== 'any'){
      if(origin === 'eu'){
        points.push(`This mechanism treats EU and non-EU investors differently. As an EU investor you may be subject to <strong>lighter scrutiny</strong>.`);
      } else {
        points.push(`This mechanism treats EU and non-EU investors differently. As a non-EU investor you may face <strong>stricter review conditions</strong>.`);
      }
    }

    // Timeframe
    if(r.time_frame_days) points.push(`Maximum review period: <strong>${r.time_frame_days} days</strong> from notification.`);

    // Authority
    if(r.lead_authority) points.push(`Lead authority: <strong>${r.lead_authority}</strong>.`);

    // Determine verdict
    const likelyCovered = isCrossSectoral || sectorCovered === true;
    const likelyAbove = aboveThreshold === true || (aboveThreshold === null && stake === null);

    if(likelyCovered && likelyAbove && isMandatory){
      verdict = 'high';
      title = 'Review likely required';
    } else if(likelyCovered && aboveThreshold === false){
      verdict = 'low';
      title = 'Below threshold — verify sector rules';
    } else if(sectorCovered === false){
      verdict = 'ok';
      title = 'Sector appears out of scope';
    } else if(likelyCovered || isMandatory){
      verdict = 'warn';
      title = 'Review may apply — verify with authority';
    } else {
      verdict = 'warn';
      title = 'Insufficient data — consult authority';
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
    el.style.display = '';
    el.innerHTML = `
      <div class="scr-verdict" style="background:${c.bg};border-color:${c.border}">
        <div class="scr-verdict-head">
          <span class="scr-verdict-icon" style="color:${c.dot}">${c.icon}</span>
          <span class="scr-verdict-title" style="color:${c.dot}">${title}</span>
        </div>
        <div class="scr-verdict-body">${body}</div>
        ${countries&&countries.length?`<div class="scr-verdict-link"><button class="scr-country-link" data-c="${countries[0]}">View full ${countries[0]} profile →</button></div>`:''}
      </div>`;
    el.querySelectorAll('.scr-country-link').forEach(btn => {
      btn.onclick = () => { window.PRISM_UI.selectCountry(btn.dataset.c); window.PRISM_UI.switchTab('country'); };
    });
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function showError(el, msg){
    el.style.display = '';
    el.innerHTML = `<div class="scr-verdict" style="background:#fdf0ec;border-color:#bf6a4a"><div class="scr-verdict-body" style="color:#bf6a4a">${msg}</div></div>`;
  }

  window.PRISM_SCREENER = { mount };
})();
