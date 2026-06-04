/* ============================================================
   PRISM — UI shell: rail, tabs, drawer, registry
   ============================================================ */
(function(){
  'use strict';
  const P = window.PRISM;
  const TABS = {};            // name -> {mount, update, mounted}
  window.PRISM_TABS = TABS;

  // 便捷翻译快捷方式（i18n.js 必须在此之前加载）
  function t(k){ return window.PRISM_I18N ? window.PRISM_I18N.t(k) : k; }

  // ---------- URL SYNC ----------
  function updateURL(){
    try{
      const p=new URLSearchParams();
      if(currentTab && currentTab!=='overview') p.set('tab',currentTab);
      if(P.STATE.year) p.set('year',P.STATE.year);
      if(P.STATE.selectedCountry) p.set('country',P.STATE.selectedCountry);
      const qs=p.toString();
      history.replaceState(null,'',qs?('?'+qs):location.pathname);
    }catch(_){}
  }

  // ---------- TAB SWITCHING ----------
  let currentTab='overview';
  function switchTab(name){
    if(name===currentTab) return;
    stopPlay();
    currentTab=name;
    document.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===name));
    document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('active',p.id==='pane-'+name));
    const tab=TABS[name];
    if(tab){
      if(!tab.mounted){ tab.mount(document.getElementById('pane-'+name)); tab.mounted=true; }
      tab.update && tab.update();
    }
    document.getElementById('tabScroll').scrollTop=0;
    P.emit('tab',name);
    updateURL();
  }
  function activeTab(){ return currentTab; }

  // ---------- RAIL: groups ----------
  function buildGroups(){
    const el=document.getElementById('groupList');
    const counts={oecd:0,eu:0,fiveeyes:0};
    P.DATA.countries.forEach(c=>{ if(c.oecd)counts.oecd++; if(c.eu_eea)counts.eu++; if(c.five_eyes)counts.fiveeyes++; });
    el.innerHTML='';
    Object.values(P.GROUPS).forEach(g=>{
      const on=P.STATE.groups[g.key];
      const node=document.createElement('div');
      node.className=`group-toggle g-${g.key==='fiveeyes'?'fe':g.key} ${on?'on':''}`;
      // 分组标签走翻译
      const labelKey = g.key==='oecd'?'group_oecd':g.key==='eu'?'group_eu':'group_fiveeyes';
      node.innerHTML=`<span class="swatch" style="background:${g.color}"></span>
        <span class="lbl">${t(labelKey)}</span>
        <span class="gcnt">${counts[g.key]}</span>
        <span class="check">✓</span>`;
      node.onclick=()=>{
        P.STATE.groups[g.key]=!P.STATE.groups[g.key];
        // never allow all-off
        if(!P.STATE.groups.oecd&&!P.STATE.groups.eu&&!P.STATE.groups.fiveeyes){ P.STATE.groups[g.key]=true; return; }
        buildGroups(); buildCountryList();
        P.emit('filter');
      };
      el.appendChild(node);
    });
  }

  // ---------- RAIL: country list ----------
  let countryFilter='';
  function buildCountryList(){
    const el=document.getElementById('countryList');
    const active=new Set(P.activeCountries());
    const lang = window.PRISM_I18N ? window.PRISM_I18N.lang : 'en';
    const items=P.DATA.countries
      .filter(c=>active.has(c.country))
      .filter(c=>{
        if(!countryFilter) return true;
        // 同时支持英文和中文名搜索
        const zh = window.PRISM_I18N ? window.PRISM_I18N.countryName(c.country).toLowerCase() : '';
        return c.country.toLowerCase().includes(countryFilter) || zh.includes(countryFilter);
      });
    document.getElementById('countryCnt').textContent=active.size+(lang==='zh'?' 个国家':' countries');
    el.innerHTML='';
    items.forEach(c=>{
      const node=document.createElement('div');
      node.className='country-item'+(c.country===P.STATE.selectedCountry?' active':'');
      node.innerHTML=`<span class="flagdot" style="background:${P.groupColor(c.country)}"></span>
        <span class="cname">${cnName(c.country)}</span>
        <span class="cmeta">${c.year_established||'—'}</span>`;
      node.onclick=()=>{ selectCountry(c.country); };
      el.appendChild(node);
    });
  }
  function selectCountry(country){
    P.STATE.selectedCountry=country;
    buildCountryList();
    P.emit('country',country);
    if(activeTab()!=='country'){ switchTab('country'); }
    updateURL();
    closeRail();
  }

  // ---------- RAIL: year ----------
  let playTimer=null;
  function setYear(y, fromPlay){
    y=Math.max(P.DATA.yearMin,Math.min(P.DATA.yearMax,y));
    P.STATE.year=y;
    const sl=document.getElementById('yearSlider');
    sl.value=y;
    const pct=((y-P.DATA.yearMin)/(P.DATA.yearMax-P.DATA.yearMin))*100;
    sl.style.setProperty('--pct',pct+'%');
    document.getElementById('yearVal').textContent=y;
    P.emit('year',y);
    if(!fromPlay){ stopPlay(); updateURL(); }
  }
  function startPlay(){
    const btn=document.getElementById('playBtn');
    btn.classList.add('playing'); btn.textContent=t('btn_pause');
    if(P.STATE.year>=P.DATA.yearMax) setYear(P.DATA.yearMin,true);
    playTimer=setInterval(()=>{
      if(P.STATE.year>=P.DATA.yearMax){ stopPlay(); return; }
      setYear(P.STATE.year+1,true);
    },900);
  }
  function stopPlay(){
    if(playTimer){ clearInterval(playTimer); playTimer=null; }
    const btn=document.getElementById('playBtn');
    btn.classList.remove('playing'); btn.textContent=t('btn_play');
  }
  function togglePlay(){ playTimer?stopPlay():startPlay(); }

  // ---------- DRAWER ----------
  function openDrawer(title, meta, html){
    closeScreener(); closeInfoDrawer();
    document.getElementById('drawerTitle').innerHTML=title;
    document.getElementById('drawerMeta').innerHTML=meta||'';
    document.getElementById('drawerBody').innerHTML=html;
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerScrim').classList.add('open');
  }
  function closeDrawer(){
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerScrim').classList.remove('open');
  }

  // ---------- SCREENER DRAWER ----------
  function openScreener(preCountry){
    closeDrawer(); closeInfoDrawer();
    const body = document.getElementById('screenerBody');
    if(body && !body.hasChildNodes()) window.PRISM_SCREENER.mount(body);
    if(preCountry){
      const sel = document.getElementById('scrCountry');
      if(sel) sel.value = preCountry;
    }
    const yl = document.getElementById('screenerYearLabel');
    if(yl) yl.textContent = t('screener_year') + P.STATE.year;
    document.getElementById('screenerDrawer').classList.add('open');
    document.getElementById('screenerScrim').classList.add('open');
  }
  function closeScreener(){
    document.getElementById('screenerDrawer').classList.remove('open');
    document.getElementById('screenerScrim').classList.remove('open');
  }

  // ---------- RAIL (mobile overlay) ----------
  function openRail(){
    document.getElementById('rail').classList.add('open');
    document.getElementById('railScrim').classList.add('open');
  }
  function closeRail(){
    document.getElementById('rail').classList.remove('open');
    document.getElementById('railScrim').classList.remove('open');
  }

  // ---------- INFO DRAWER ----------
  function buildInfoBody(){
    const zh = window.PRISM_I18N && window.PRISM_I18N.lang === 'zh';
    const el = document.getElementById('infoBody');
    if (!el) return;
    if (!zh) { el.style.display = ''; return; } // 英文：保持静态 HTML
    // 中文版：动态生成
    el.innerHTML = `
    <div class="info-section">
      <div class="info-section-title">1. 平台概述</div>
      <div class="info-section-body">
        <p><strong>PRISM</strong>（政策审查与投资筛查机制数据库）是一个交互式数据平台，提供 2007 至 2023 年间 38 个国家外商直接投资（FDI）审查机制的全面时间序列数据。</p>
        <div class="inforows" style="margin-top:10px">
          <div class="inforow"><span class="ir-k">国家数量</span><span class="ir-v">38（OECD · 欧盟/欧经区 · 五眼联盟）</span></div>
          <div class="inforow"><span class="ir-k">覆盖年份</span><span class="ir-v">2007 – 2023（年度观测）</span></div>
          <div class="inforow"><span class="ir-k">数据规模</span><span class="ir-v">650 条时间序列 · 143 部法规 · 230 次变动 · 141 份政策文本</span></div>
          <div class="inforow"><span class="ir-k">追踪行业</span><span class="ir-v">36 个细分行业 + 8 个聚合类别</span></div>
          <div class="inforow"><span class="ir-k">程序性指标</span><span class="ir-v">13 个二元权力指标 + 4 个定量字段</span></div>
        </div>
        <p style="margin-top:10px"><strong>适用对象：</strong>法律从业者与合规团队、投资专业人士、政策研究者与学者、政府官员。</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">2. 界面布局</div>
      <div class="info-section-body">
        <div class="chart-entry">
          <div class="chart-name">顶部导航栏</div>
          <div class="chart-desc">包含 PRISM 标志、全局搜索框、<strong>⚡ 交易审查</strong>、AI 助手及本手册按钮。在任意位置按 <kbd>/</kbd> 可聚焦搜索框，按 <kbd>Esc</kbd> 可关闭任意抽屉。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">控制侧边栏</div>
          <div class="chart-desc"><strong>年份选择器</strong>——拖动滑块在 2007–2023 年间切换；点击 <strong>▶ 播放时间轴</strong> 逐年自动演示。<strong>国家分组筛选器</strong>——切换 OECD / 欧盟/欧经区 / 五眼联盟。<strong>国家列表</strong>——点击任意国家即选中并跳转至国家详情标签页。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">六个分析标签页</div>
          <div class="chart-desc">所有标签页均响应侧边栏的全局年份与国家选择。</div>
        </div>
        <div class="inforows" style="margin-top:6px">
          <div class="inforow"><span class="ir-k">01 总览</span><span class="ir-v txt">世界地图 + 全球趋势折线图 + 年度快照面板</span></div>
          <div class="inforow"><span class="ir-k">02 国家详情</span><span class="ir-v txt">所选国家的深度数据档案</span></div>
          <div class="inforow"><span class="ir-k">03 横向对比</span><span class="ir-v txt">多国平行坐标图</span></div>
          <div class="inforow"><span class="ir-k">04 机制演变</span><span class="ir-v txt">覆盖类型趋势、严格程度分布、监管网络</span></div>
          <div class="inforow"><span class="ir-k">05 政策变动</span><span class="ir-v txt">按年度的全球立法活动</span></div>
          <div class="inforow"><span class="ir-k">06 行业覆盖</span><span class="ir-v txt">行业覆盖热图与排名图</span></div>
        </div>
        <div class="chart-entry" style="margin-top:10px">
          <div class="chart-name">键盘快捷键</div>
          <div class="chart-desc">
            <div class="inforows">
              <div class="inforow"><span class="ir-k"><kbd>/</kbd></span><span class="ir-v txt">聚焦全局搜索框</span></div>
              <div class="inforow"><span class="ir-k"><kbd>Esc</kbd></span><span class="ir-v txt">关闭任意打开的抽屉</span></div>
              <div class="inforow"><span class="ir-k"><kbd>↑</kbd> <kbd>↓</kbd></span><span class="ir-v txt">在搜索结果中上下移动</span></div>
              <div class="inforow"><span class="ir-k"><kbd>Enter</kbd></span><span class="ir-v txt">跳转至第一条搜索结果</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">3. 各标签页使用指南</div>
      <div class="info-section-body">
        <div class="chart-entry">
          <div class="chart-name">01 总览</div>
          <div class="chart-desc">世界地图按所选维度（严格程度评分、覆盖行业数、审查门槛、最长审查天数）深浅着色。<strong>点击任意国家</strong>弹出摘要卡片，点击<em>查看详情 →</em>跳转至国家档案。下方趋势图中点击任意年份可同步全局年份滑块。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">02 国家详情</div>
          <div class="chart-desc">顶部从业者摘要卡片直答"我是否需要申报"——展示申报要求、审查机构、门槛及最长审查天数。下方有雷达图（8 维度，叠加 OECD 均值与历史对比年份）、完整字段列表、16 项二元指标及法规时间轴。<strong>点击任意法规气泡</strong>打开详情抽屉，含政策文本及 AI 摘要入口。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">03 横向对比</div>
          <div class="chart-desc">平行坐标图，每条彩色线代表一个国家。<strong>在任意坐标轴上拖动</strong>可筛选范围，仅保留通过所选区间的线条高亮。<strong>点击任意线条</strong>跳转至该国档案。使用着色切换按钮在分组颜色与严格程度渐变之间切换。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">04 机制演变</div>
          <div class="chart-desc">五张图表：覆盖类型饼图、通知×预批矩阵（气泡图）、覆盖类型堆积面积图、严格程度带状图（均值±最值），以及门槛/时限与严格程度散点图。监管网络图展示法规替代关系，点击任意节点可跳转至对应国家档案。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">05 政策变动</div>
          <div class="chart-desc">堆积柱状图按年度展示全球立法活动（新立法 · 修正案 · 行政命令 · 实施条例）。<strong>点击任意柱体</strong>选定该年份，下方事件列表同步更新，全局年份滑块也随之跳转。点击任意事件卡片可阅读政策文本。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">06 行业覆盖</div>
          <div class="chart-desc">热图行为行业，列为国家。可切换 36 个细分行业与 8 大聚合类别（以百分比渐变着色）。排名条形图按覆盖国家数量对所有行业排序，点击<strong>▶ 播放</strong>可逐年动态演示排名变化。</div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">4. 交易筛查器</div>
      <div class="info-section-body">
        <p>回答核心实务问题：<em>"此次投资是否可能需要申报？"</em>点击顶部导航栏的 <strong>⚡ 交易审查</strong>，或任意国家档案卡片上的 <strong>⚡ 核查具体交易</strong> 按钮打开。</p>
        <div class="chart-entry">
          <div class="chart-name">输入字段</div>
          <div class="chart-desc"><strong>目标国家</strong> · <strong>行业</strong>（8 大类或 36 个细分行业；不确定可留空）· <strong>拟收购股权比例 %</strong>（不明确可留空）· <strong>您的国家</strong>（审查机制区分欧盟/非欧盟时影响判断）</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">核查结论等级</div>
          <div class="chart-desc">
            <div class="inforows">
              <div class="inforow"><span class="ir-k" style="color:#bf6a4a">可能须接受审查</span><span class="ir-v txt">行业已涵盖、股权超门槛、须强制预批</span></div>
              <div class="inforow"><span class="ir-k" style="color:#c79a3e">可能适用审查</span><span class="ir-v txt">部分因素提示须申报，但确定性有限</span></div>
              <div class="inforow"><span class="ir-k" style="color:#3f8a5e">低于门槛</span><span class="ir-v txt">股权比例低于已记录的触发门槛</span></div>
              <div class="inforow"><span class="ir-k" style="color:#3f8a5e">行业不在范围内</span><span class="ir-v txt">所选行业未纳入审查机制</span></div>
              <div class="inforow"><span class="ir-k" style="color:#9aa0aa">无审查机制</span><span class="ir-v txt">所选年份无有效正式机制</span></div>
            </div>
          </div>
        </div>
        <p style="margin-top:8px;font-size:12px;color:var(--ink-soft)"><strong>免责声明：</strong>筛查器基于 PRISM 数据提供指导性评估，不构成法律意见。推进任何交易前，请务必咨询相关主管机构或具有资质的法律顾问。</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">5. AI 数据助手</div>
      <div class="info-section-body">
        <p>支持以自然语言方式查询 PRISM 数据。助手具有上下文感知能力——了解当前选定年份、国家、激活分组及所在标签页。</p>
        <div class="chart-entry">
          <div class="chart-name">可以做什么</div>
          <div class="chart-desc">跨国比较审查机制 · 识别趋势 · 解释数据字段 · 列出具有特定功能的国家 · 总结具体法规（通过任意政策文件抽屉中的<em>用 AI 总结 →</em>按钮触发）</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">配置（⚙ 图标）</div>
          <div class="chart-desc">选择服务商（Anthropic/OpenAI/DeepSeek/MiniMax/智谱 GLM/月之暗面 Kimi/自定义）、模型及 API 密钥。密钥仅存储于浏览器本地，直接发送至所选服务商，不经任何其他传输。</div>
        </div>
        <p style="margin-top:6px;font-size:12px;color:var(--ink-soft)">按 <kbd>Enter</kbd> 发送消息；输入框内换行请使用 <kbd>Shift+Enter</kbd>。回答字数上限约 250 字。</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">6. 全局搜索</div>
      <div class="info-section-body">
        <div class="inforows">
          <div class="inforow"><span class="ir-k">国家</span><span class="ir-v txt">按名称搜索——点击结果选定该国并打开国家详情标签页</span></div>
          <div class="inforow"><span class="ir-k">法规</span><span class="ir-v txt">法规标题及事件数据库中的国家名称</span></div>
          <div class="inforow"><span class="ir-k">政策文本</span><span class="ir-v txt">跨全部 141 份政策文件的全文检索，匹配段落以琥珀色高亮</span></div>
        </div>
        <p style="margin-top:8px">使用结果面板顶部的<strong>国家 / 法规 / 政策</strong>切换按钮切换搜索模式。在任意位置按 <kbd>/</kbd> 可聚焦搜索框。</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">7. 核心概念</div>
      <div class="info-section-body">
        <div class="chart-entry">
          <div class="chart-name">严格程度评分（0–13）</div>
          <div class="chart-desc">统计 13 项程序性权力在法律中的存在数量。衡量的是<em>程序强度</em>，而非交易被否决的可能性——执法文化和政治环境同样重要。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">覆盖类型</div>
          <div class="chart-desc">
            <div class="inforows">
              <div class="inforow"><span class="ir-k" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#4f6f9e;flex-shrink:0"></span>跨行业型</span><span class="ir-v txt">适用于所有行业，任何外商交易均可能被审查</span></div>
              <div class="inforow"><span class="ir-k" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#bf6a4a;flex-shrink:0"></span>行业型</span><span class="ir-v txt">仅限特定行业（如国防、能源）</span></div>
              <div class="inforow"><span class="ir-k" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#7d5ba6;flex-shrink:0"></span>混合型</span><span class="ir-v txt">宽泛规则加高风险行业专项规定</span></div>
              <div class="inforow"><span class="ir-k" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#c79a3e;flex-shrink:0"></span>资产型</span><span class="ir-v txt">由资产类型触发（土地、基础设施），而非行业</span></div>
              <div class="inforow"><span class="ir-k" style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#9aa0aa;flex-shrink:0"></span>草案 / 尚未生效</span><span class="ir-v txt">法律已提出或通过，但尚未正式实施</span></div>
            </div>
          </div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">"通知"与"预批准"</div>
          <div class="chart-desc"><strong>通知</strong>：投资方须告知政府，但通常可在审查期间继续推进。<strong>预批准</strong>：必须在<em>交割前</em>获得政府许可，是更严格的要求。</div>
        </div>
        <div class="chart-entry">
          <div class="chart-name">13 项严格程度指标</div>
          <div class="chart-desc">
            <div class="inforows">
              <div class="inforow"><span class="ir-k">正式调查权</span><span class="ir-v txt">政府可主动启动审查，无需投资方申报</span></div>
              <div class="inforow"><span class="ir-k">增持审查</span><span class="ir-v txt">投资方增持超过门槛时触发审查</span></div>
              <div class="inforow"><span class="ir-k">申报费</span><span class="ir-v txt">须缴纳费用方可提交申报</span></div>
              <div class="inforow"><span class="ir-k">缓解措施</span><span class="ir-v txt">批准交易但附加约束条件（如剥离资产）</span></div>
              <div class="inforow"><span class="ir-k">罚款</span><span class="ir-v txt">未经批准完成交易将面临经济处罚</span></div>
              <div class="inforow"><span class="ir-k">国家安全测试</span><span class="ir-v txt">国家安全明确列为审查依据</span></div>
              <div class="inforow"><span class="ir-k">净效益测试</span><span class="ir-v txt">评估交易对国家经济的净效益（常见于加拿大）</span></div>
              <div class="inforow"><span class="ir-k">竞争测试</span><span class="ir-v txt">审查是否损害市场竞争</span></div>
              <div class="inforow"><span class="ir-k">跨部门审查</span><span class="ir-v txt">多个部委或机构正式参与决策（如美国 CFIUS）</span></div>
              <div class="inforow"><span class="ir-k">分级授权</span><span class="ir-v txt">不同层级政府按规模或行业分别审批</span></div>
              <div class="inforow"><span class="ir-k">本地代表要求</span><span class="ir-v txt">交割后须任命本地董事或法律代表</span></div>
              <div class="inforow"><span class="ir-k">强化政府控制</span><span class="ir-v txt">政府保留战略企业的特殊否决权（"黄金股"）</span></div>
              <div class="inforow"><span class="ir-k">共址要求</span><span class="ir-v txt">敏感数据或基础设施须存储或运营于本国境内</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-section-title">8. 常见问题</div>
      <div class="info-section-body">
        <div class="faq-item">
          <div class="faq-q">这能告诉我交易是否一定需要审批吗？</div>
          <div class="faq-a">不能——PRISM 提供的是有充分研究支撑的参考起点，而非法律建议。规则可能变动，行业门槛各异，许多国家还存在本数据库未能完整记录的例外情形。在推进交易前，请务必向相关政府主管部门或法律顾问核实。</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">某国显示无审查机制——这意味着交易可以自由推进吗？</div>
          <div class="faq-a">这意味着该国在对应年度未记录到正式外资审查机制。其他规定（反垄断法、行业专项法规、一般公司法）仍可能适用。无审查机制并不等同于通行无阻。</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">某国严格程度评分偏低，但我知道该国实际上管控很严——为什么？</div>
          <div class="faq-a">评分只衡量法律文本中是否存在特定程序性特征，而非实际执法的力度。评分 4 分的国家在实践中的否决率，可能高于评分 9 分的国家——这取决于执法文化和政治环境。</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">为什么年份筛选器影响部分图表，而不影响其他图表？</div>
          <div class="faq-a">年份滑块改变的是横截面视图的"快照年份"（地图、国家档案、行业热力图）。显示时间趋势的图表始终呈现 2007–2023 全程——所选年份仅作为参考标记。</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">数据更新到什么时候？</div>
          <div class="faq-a">数据库完整覆盖至 2023 年底。2024 年及以后颁布或修订的法律尚未纳入。如需最新规定，请查阅官方渠道。</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">可以引用或下载这些数据吗？</div>
          <div class="faq-a">请引用 PRISM ISM 数据库，并联系研究团队获取工作论文参考文献及数据获取方式。</div>
        </div>
      </div>
    </div>`;
  }

  function openInfoDrawer(){
    closeDrawer(); closeScreener();
    buildInfoBody();
    document.getElementById('infoDrawer').classList.add('open');
    document.getElementById('infoScrim').classList.add('open');
  }
  function closeInfoDrawer(){
    document.getElementById('infoDrawer').classList.remove('open');
    document.getElementById('infoScrim').classList.remove('open');
  }

  // ---------- 国家名查询（走 i18n） ----------
  function cnName(c){
    return window.PRISM_I18N ? window.PRISM_I18N.countryName(c) : c;
  }
  function cnShort(c){
    return window.PRISM_I18N ? window.PRISM_I18N.countryShort(c) : c;
  }

  // ---------- COVERAGE label/color（支持翻译） ----------
  const COVERAGE_RAW={
    'Sectoral':                  {key:'cov_sectoral',  c:'#bf6a4a'},
    'Cross-sectoral':            {key:'cov_cross',     c:'#4f6f9e'},
    'Mixed':                     {key:'cov_mixed',     c:'#7d5ba6'},
    'Asset-based':               {key:'cov_asset',     c:'#c79a3e'},
    'Draft':                     {key:'cov_draft',     c:'#9aa0aa'},
    'Passed (not implemented)':  {key:'cov_passed',    c:'#b0b6c0'},
  };
  // 动态 getter，每次调用都用当前语言
  const COVERAGE = new Proxy(COVERAGE_RAW, {
    get(target, prop){
      const raw = target[prop];
      if(!raw) return undefined;
      return { cn: t(raw.key), c: raw.c };
    }
  });

  // ---------- 语言切换处理 ----------
  function onLangChange(){
    // 重建分组 & 国家列表（含中文名）
    buildGroups();
    buildCountryList();
    // 如果 info drawer 当前打开，刷新内容语言
    if(document.getElementById('infoDrawer').classList.contains('open')) buildInfoBody();
    // 更新年份计数标签
    const yearCntEl = document.getElementById('yearCnt');
    if(yearCntEl && P.DATA.years) {
      const isZh = window.PRISM_I18N && window.PRISM_I18N.lang === 'zh';
      yearCntEl.textContent = P.DATA.years.length + (isZh ? ' 年' : ' yrs');
    }
    // 刷新播放按钮文字
    if(!playTimer){
      const btn=document.getElementById('playBtn');
      if(btn) btn.textContent=t('btn_play');
    }
    // 更新 brand sub（countries 数量保持）
    const subEl=document.querySelector('.brand .sub');
    if(subEl){
      const cntEl=subEl.querySelector('b');
      const cnt=cntEl?cntEl.textContent:P.DATA.countries.length;
      subEl.innerHTML=`<span data-i18n="brand_sub">${t('brand_sub')}</span> · <b>${cnt}</b> ${window.PRISM_I18N.lang==='zh'?'个国家':'countries'} · <b>${P.DATA.yearMin}–${P.DATA.yearMax}</b>`;
    }
    // 重新挂载当前 tab（已由 i18n.js 重置 mounted 标志）
    const name=activeTab();
    const tab=TABS[name];
    const pane=document.getElementById('pane-'+name);
    if(tab && pane){ tab.mount(pane); tab.mounted=true; tab.update&&tab.update(); }
  }
  P.on('lang', onLangChange);

  // ---------- init wiring ----------
  function initWiring(){
    document.querySelectorAll('.tab').forEach(tab=>tab.onclick=()=>switchTab(tab.dataset.tab));
    const sl=document.getElementById('yearSlider');
    sl.min=P.DATA.yearMin; sl.max=P.DATA.yearMax; sl.value=P.STATE.year;
    sl.oninput=()=>setYear(parseInt(sl.value));
    document.getElementById('yearRng').textContent=`${P.DATA.yearMin} — ${P.DATA.yearMax}`;
    // brand sub（保留语言感知）
    const subEl=document.querySelector('.brand .sub');
    if(subEl) subEl.innerHTML=`<span data-i18n="brand_sub">${t('brand_sub')}</span> · <b>${P.DATA.countries.length}</b> ${window.PRISM_I18N&&window.PRISM_I18N.lang==='zh'?'个国家':'countries'} · <b>${P.DATA.yearMin}–${P.DATA.yearMax}</b>`;
    document.getElementById('yearCnt').textContent=P.DATA.years.length+(window.PRISM_I18N&&window.PRISM_I18N.lang==='zh'?' 年':' yrs');
    const mid=Math.round((P.DATA.yearMin+P.DATA.yearMax)/2);
    const ticks=document.querySelector('.year-ticks');
    if(ticks) ticks.innerHTML=`<span>${P.DATA.yearMin}</span><span>${mid}</span><span>${P.DATA.yearMax}</span>`;
    document.getElementById('playBtn').onclick=togglePlay;
    document.getElementById('countrySearch').oninput=(e)=>{ countryFilter=e.target.value.toLowerCase(); buildCountryList(); };
    document.getElementById('drawerClose').onclick=closeDrawer;
    document.getElementById('drawerScrim').onclick=closeDrawer;
    document.getElementById('screenerOpen').onclick=()=>openScreener();
    document.getElementById('screenerClose').onclick=closeScreener;
    document.getElementById('screenerScrim').onclick=closeScreener;
    document.getElementById('infoOpen').onclick=openInfoDrawer;
    document.getElementById('infoClose').onclick=closeInfoDrawer;
    document.getElementById('infoScrim').onclick=closeInfoDrawer;
    document.getElementById('railOpen').onclick=openRail;
    document.getElementById('railClose').onclick=closeRail;
    document.getElementById('railScrim').onclick=closeRail;
    // 语言切换按钮
    const langBtn=document.getElementById('langToggle');
    if(langBtn){
      const I18N=window.PRISM_I18N;
      // 初始按钮文字
      if(I18N) langBtn.textContent = I18N.lang==='zh' ? '🌐 EN' : '🌐 中文';
      langBtn.onclick=()=>{
        if(!window.PRISM_I18N) return;
        const next = window.PRISM_I18N.lang==='zh' ? 'en' : 'zh';
        window.PRISM_I18N.setLang(next);
      };
    }
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ closeDrawer(); closeInfoDrawer(); closeScreener(); closeRail(); P.emit('escape'); }
      if(e.key==='/' && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); document.getElementById('globalSearch').focus(); }
    });
    buildGroups(); buildCountryList(); setYear(P.STATE.year);
  }

  window.PRISM_UI = { switchTab, activeTab, selectCountry, setYear, openDrawer, closeDrawer, openInfoDrawer, closeInfoDrawer, openScreener, closeScreener, openRail, closeRail,
    cnName, cnShort, COVERAGE, buildCountryList, initWiring, register:(n,o)=>{TABS[n]=o;} };
})();
