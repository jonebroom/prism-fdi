/* ============================================================
   PRISM — i18n  中英双语切换
   用法：window.PRISM_I18N.t('key')  获取当前语言文字
         window.PRISM_I18N.setLang('zh'|'en')  切换语言
   ============================================================ */
(function(){
  'use strict';

  /* ── 字典 ─────────────────────────────────────────────── */
  const DICT = {

    en: {
      /* ---- 页面标题 / Loading ---- */
      page_title:        'PRISM · FDI Screening Mechanism Data Platform',
      loading_brand:     'PRISM FDI Screening Database',
      loading_status:    'Loading data…',

      /* ---- 顶栏 ---- */
      brand_mark:        'PRISM ISM Database',
      brand_sub:         'FDI Screening Mechanism Data Platform',
      search_placeholder:'Search countries, regulations, policy text…',
      btn_check_deal:    'Check Deal',
      btn_ask_ai:        'Ask AI',
      btn_info_title:    'User Manual',

      /* ---- 侧栏 ---- */
      rail_year:         'Year',
      rail_groups:       'Country Groups',
      rail_countries:    'Countries',
      filter_countries:  'Filter countries…',
      btn_play:          '▶ Play Timeline',
      btn_pause:         '❚❚ Pause',
      rail_footer:       'Source · PRISM ISM Dataset (2023.12)',
      rail_footer2:      'Time Series 650 · Regulations 143 · Changes 230 · Policy texts 141',

      /* ---- 分组标签 ---- */
      group_oecd:        'OECD',
      group_eu:          'EU / EEA',
      group_fiveeyes:    'Five Eyes',

      /* ---- 导航标签 ---- */
      tab_overview:      'Overview',
      tab_country:       'Country',
      tab_compare:       'Comparison',
      tab_evolution:     'Evolution',
      tab_changes:       'Changes',
      tab_sectors:       'Sectors',

      /* ---- 总览 Tab ---- */
      ov_map_title:      'Global FDI Screening Mechanism Distribution',
      ov_map_sub:        'Countries shaded by selected dimension · Darker = higher value · Click country for details',
      ov_map_tag:        'Time Series Data',
      ov_trend_title:    'Global Trend',
      ov_trend_sub:      'Countries with a given feature · New mechanisms per year globally',
      ov_snap_title:     'Annual Snapshot',
      ov_snap_sub:       'Current filtered country set',
      ov_no_data:        'No data',
      ov_card_view:      'View Details →',
      ov_card_strictness:'Strictness',
      ov_card_sectors:   'Sectors',
      ov_snap_with_mech: 'Countries with mechanism',
      ov_snap_avg_strict:'Avg. Strictness',
      ov_snap_avg_sec:   'Avg. Sectors Covered',
      ov_snap_new_mech:  'New Mechanisms This Year',
      ov_snap_cov_dist:  'Coverage Type Distribution',
      ov_dim_strictness: 'Strictness Score (0–13)',
      ov_dim_sectors:    'Sectors Covered',
      ov_dim_threshold:  'Review Threshold (equity %)',
      ov_dim_timeframe:  'Review Timeframe (days)',
      ov_trend_ns:       'National Security Test',
      ov_trend_fines:    'Fines',
      ov_trend_mit:      'Mitigation',
      ov_trend_inter:    'Interagency Review',
      ov_trend_gov:      'Enhanced Gov. Control',
      ov_trend_callin:   'Formal Call-in',
      ov_trend_fees:     'Filing Fees',
      ov_trend_bar:      'New mechanisms (global)',
      ov_trend_eu:       'EU FDI Regulation',
      ov_trend_covid:    'COVID-19 legislation wave',
      ov_trend_click:    'Click to jump',
      ov_legend_nodata:  'Not in filter / No data',
      ov_snap_yr:        'Snapshot',            /* suffix after year number */
      ov_est_year:       'Est.',

      /* ---- 国家详情 Tab ---- */
      ct_radar_title:    'Multi-Dimensional Radar',
      ct_radar_sub:      'Selected country vs OECD average vs historical comparison',
      ct_kpi_title:      'Key Indicators',
      ct_kpi_sub:        'Mechanism overview for selected year',
      ct_flags_title:    'Procedural Requirements & Coverage',
      ct_flags_sub:      '13 procedural powers + coverage fields (✓ present / ✗ absent)',
      ct_tl_title:       'Regulation Timeline',
      ct_tl_sub:         'All regulations for this country · Bubble size = sectors covered · Click to view full text',
      ct_tl_tag:         'Event Data',
      ct_cmp_no:         'No historical comparison',
      ct_cmp_prefix:     'Compare',
      ct_no_data:        'No mechanism data for this year',
      ct_no_mech:        'No active screening mechanism in {year} — foreign investments are generally unrestricted.',
      ct_filing_title:   'Filing Requirement',
      ct_review_title:   'Review Authority',
      ct_scope_title:    'Scope & Powers',
      ct_pre_req:        'Pre-approval required before closing',
      ct_notif_mand:     'Notification mandatory',
      ct_no_filing:      'No mandatory filing',
      ct_threshold:      'Threshold',
      ct_max_review:     'Max review time',
      ct_notification:   'Notification',
      ct_review_crit:    'Review criteria',
      ct_strictness_sc:  'Strictness score',
      ct_sectors_scope:  'Sectors in scope',
      ct_not_spec:       'Not specified',
      ct_since:          'Since',
      ct_quick_check:    '⚡ Check a specific deal for this country',
      ct_risk_none:      'No mechanism',
      ct_risk_low:       'Screening exists',
      ct_risk_med:       'Active screening',
      ct_risk_high:      'Strict screening',
      ct_criteria_ns:    'National security',
      ct_criteria_net:   'Net economic benefit',
      ct_criteria_comp:  'Competition',
      ct_criteria_dual:  'Dual-use / export control',
      ct_flag_callin:    'Formal call-in',
      ct_flag_inter:     'Interagency review',
      ct_flag_tiered:    'Tiered authority',
      ct_flag_mit:       'Mitigation powers',
      ct_flag_fines:     'Fines / penalties',
      ct_flag_gov:       'Golden share',
      ct_flag_eu:        'EU vs non-EU distinction',
      ct_green_cov:      'Greenfield investments covered',
      ct_re_cov:         'Real estate covered',
      ct_eu_diff:        'Different rules for EU vs non-EU',
      ct_kpi_auth:       'Lead Authority',
      ct_kpi_cov:        'Coverage Type',
      ct_kpi_notif:      'Notification',
      ct_kpi_pre:        'Pre-approval',
      ct_kpi_thresh:     'Review Threshold',
      ct_kpi_tf:         'Review Timeframe',
      ct_kpi_eu:         'EU vs non-EU Difference',
      ct_kpi_covid:      'COVID-19 Temporary Legislation',
      ct_fg_invest:      'Investigation & Review Powers',
      ct_fg_tests:       'Tests & Standards',
      ct_fg_sanct:       'Sanctions & Mechanisms',
      ct_fg_scope:       'Coverage Scope',
      ct_days:           'days',
      ct_sectors_sfx:    'sectors',
      ct_sector_sfx1:    'sector',

      /* ---- 对比 Tab ---- */
      cmp_title:         'Multi-Country Parallel Coordinates',
      cmp_sub:           'Current year cross-section · Drag axis range to filter · Hover to highlight',
      cmp_color_group:   'Color by group',
      cmp_color_strict:  'Color by strictness',

      /* ---- 演变 Tab ---- */
      evo_pie_title:     'Coverage Type Distribution',
      evo_pie_sub:       'Click a segment to see all countries of that type',
      evo_bubble_title:  'Notification × Pre-approval Matrix',
      evo_bubble_sub:    'Procedural strictness combinations for current year · Bubble size = number of countries',
      evo_stream_title:  'Coverage Type Evolution',
      evo_stream_sub:    'Number of countries per coverage model per year · Observe shift from Sectoral to Cross-sectoral',
      evo_ridge_title:   'Strictness Distribution Over Time',
      evo_ridge_sub:     'Mean and range of strictness (0–13) per year',
      evo_sc_threshold:  'Threshold',
      evo_sc_timeframe:  'Timeframe',

      /* ---- 变动 Tab ---- */
      chg_bar_title:     'Global Legislative Activity',
      chg_bar_sub:       'New mechanisms per year by type · Click a bar to view all events for that year',
      chg_list_title:    'Legislative Events',
      chg_list_sub:      'Click a bar above to select a year',
      chg_type_law:      'New Law',
      chg_type_amend:    'Amendment',
      chg_type_eo:       'Exec. Order',
      chg_type_reg:      'Reg. Impl.',

      /* ---- 行业 Tab ---- */
      sec_heat_title:    'Sector Coverage Heatmap',
      sec_heat_sub:      'Rows (sectors) × Columns (countries) · Dark = covered that year',
      sec_bar_title:     'Sector Coverage Ranking',
      sec_bar_sub:       'How many countries include each sector · Click Play to watch coverage spread',
      sec_detail_btn:    'Detailed Sectors',
      sec_aggr_btn:      '8 Aggregate Categories',
      sec_play:          '▶ Play',
      sec_pause:         '❚❚ Pause',

      /* ---- 覆盖类型 ---- */
      cov_sectoral:      'Sectoral',
      cov_cross:         'Cross-sectoral',
      cov_mixed:         'Mixed',
      cov_asset:         'Asset-based',
      cov_draft:         'Draft',
      cov_passed:        'Passed (not impl.)',

      /* ---- 程序标签 (PROC_LABELS) ---- */
      proc_formal_call_in:              'Formal Call-in',
      proc_review_increased_ownership:  'Increased Ownership Review',
      proc_filing_fees:                 'Filing Fees',
      proc_mitigation:                  'Mitigation',
      proc_fines:                       'Fines',
      proc_ns_test:                     'National Security Test',
      proc_net_benefit_test:            'Net Benefit Test',
      proc_competition_test:            'Competition Test',
      proc_interagency_review:          'Interagency Review',
      proc_tiered_authority:            'Tiered Authority',
      proc_local_representation:        'Local Representation',
      proc_enhanced_gov_control:        'Enhanced Gov. Control',
      proc_colocation:                  'Co-location',
      proc_greenfield_covered:          'Greenfield',
      proc_real_estate_covered:         'Real Estate',
      proc_export_control_dualuse:      'Export Control / Dual-Use',

      /* ---- 雷达维度标签 ---- */
      radar_ns_test:                    'NS Test',
      radar_formal_call_in:             'Formal Call-in',
      radar_fines:                      'Fines',
      radar_mitigation:                 'Mitigation',
      radar_interagency_review:         'Interagency',
      radar_net_benefit_test:           'Net Benefit',
      radar_enhanced_gov_control:       'Gov. Control',
      radar_review_increased_ownership: 'Ownership',

      /* ---- Info 抽屉 / Screener 抽屉标题 ---- */
      info_title:         'User Manual',
      info_sub:           'PRISM ISM Database · Version 1.0 · Data coverage: 2007–2023',
      scr_drawer_title:   'Deal Screener',
      scr_drawer_sub:     'Does this investment require filing? · Based on PRISM data',

      /* ---- AI 面板 ---- */
      ai_title:           'PRISM Data Assistant',
      ai_placeholder:     'Ask about the current data… (Enter to send)',
      ai_ctx_label:       'Context',
      ai_ctx_year:        'Year',
      ai_ctx_country:     'Country',
      ai_ctx_groups:      'Groups',
      ai_ctx_tab:         'Tab',
      ai_save:            'Save',
      ai_clear:           'Clear',
      ai_saved:           '✓ Saved',
      ai_key_saved:       '✓ API key saved. You can now ask questions.',
      ai_cfg_updated:     'Configuration updated (key unchanged).',
      ai_cfg_cleared:     'Configuration cleared.',
      ai_no_key:          '**Please configure an API Key first**\n\nClick the ⚙ button to select a provider and enter your key.',
      ai_no_response:     'Sorry, no valid response was received.',
      ai_req_error:       'Request error: ',
      ai_nonascii_warn:   '⚠ Non-ASCII characters were stripped from your API key. Please re-enter it in the ⚙ settings.',
      ai_prov_label:      'Provider',
      ai_model_label:     'Model',
      ai_baseurl_label:   'Base URL',
      ai_key_label:       'API Key',
      ai_key_ph:          'sk-... (leave empty to clear)',

      /* ---- AI 欢迎语 ---- */
      ai_welcome:         'Hello, I am the PRISM Data Assistant. I can answer questions based on the filtered **{n} countries · {y1}–{y2}** FDI screening data — compare countries, explain fields, find trends. Try a prompt below or ask directly.',

      /* ---- AI Tab 名（上下文显示用）---- */
      ai_tab_overview:    'Overview',
      ai_tab_country:     'Country Detail',
      ai_tab_compare:     'Comparison',
      ai_tab_evolution:   'Evolution',
      ai_tab_changes:     'Changes',
      ai_tab_sectors:     'Sectors',

      /* ---- 交易审查（Screener）---- */
      scr_intro:          'Answer a few questions to check whether a foreign investment is likely to trigger screening in a given country.',
      scr_target:         'Target Country',
      scr_sector:         'Sector / Industry',
      scr_stake:          'Proposed Acquisition Stake (%)',
      scr_origin:         'Your Country',
      scr_select_country: '— Select country —',
      scr_select_sector:  '— Select sector —',
      scr_unknown:        'Unknown / Not disclosed',
      scr_broad:          'Broad Categories',
      scr_specific:       'Specific Sectors',
      scr_run:            'Check this deal →',
      scr_disclaimer:     '⚠ This tool provides an indicative assessment based on publicly available data in the PRISM database. It does not constitute legal advice. Always consult the relevant national authority or legal counsel before proceeding.',
      scr_no_mech_title:  'No formal screening mechanism',
      scr_not_impl_title: 'Mechanism enacted but not yet in force',
      scr_high_title:     'Review likely required',
      scr_low_title:      'Below threshold — verify sector rules',
      scr_ok_title:       'Sector appears out of scope',
      scr_warn_title:     'Review may apply — verify with authority',
      scr_insuf_title:    'Insufficient data — consult authority',
      scr_view_profile:   'View full {c} profile →',
      scr_err_country:    'Please select a target country.',
      scr_no_mech_body:   'Based on available data, <strong>{c}</strong> does not have an active formal FDI screening mechanism in {yr}. Foreign investments are generally not subject to mandatory review.',
      scr_not_impl_body:  '{c} has passed screening legislation as of {yr}, but implementing regulations may not yet be in effect. Monitor for implementation date.',
      scr_cross:          '<strong>{c}</strong> applies <strong>{cov}</strong> screening — applies to most or all foreign acquisitions.',
      scr_sec_in:         'The selected sector is <strong>within scope</strong> of {c}\'s screening mechanism.',
      scr_sec_out:        'The selected sector does <strong>not appear to be covered</strong> by {c}\'s screening mechanism based on available data.',
      scr_sec_unk:        '{c} applies <strong>{cov}</strong> screening. Sector coverage for your specific industry could not be determined from available data.',
      scr_above:          'Your proposed stake of <strong>{s}%</strong> is at or above the recorded review threshold of <strong>{thr}%</strong>.',
      scr_below:          'Your proposed stake of <strong>{s}%</strong> is <strong>below</strong> the recorded review threshold of <strong>{thr}%</strong>. However, sector-specific thresholds may be lower.',
      scr_thr_only:       'Review threshold: <strong>≥ {thr}% equity</strong>.',
      scr_pre_mand:       '<strong>Pre-approval is mandatory</strong> — you must receive approval before closing the transaction.',
      scr_notif_mand:     '<strong>Notification is mandatory</strong> — filing is required even if pre-approval is not.',
      scr_eu_lighter:     'This mechanism treats EU and non-EU investors differently. As an EU investor you may be subject to <strong>lighter scrutiny</strong>.',
      scr_eu_stricter:    'This mechanism treats EU and non-EU investors differently. As a non-EU investor you may face <strong>stricter review conditions</strong>.',
      scr_timeframe:      'Maximum review period: <strong>{d} days</strong> from notification.',
      scr_authority:      'Lead authority: <strong>{a}</strong>.',

      /* ---- 数据年份 ---- */
      screener_year:     'Data year: ',

      /* ---- 地图 tooltip ---- */
      ov_tip_est:        'Est. Year',
      ov_tip_coverage:   'Coverage',
      ov_tip_mechanisms: 'Mechanisms',
      ov_tip_sectors:    'Sectors Covered',
      ov_tip_strictness: 'Strictness',
      ov_trend_countries_y: 'Countries',
      ov_trend_new_mech_y:  'New mechanisms',

      /* ---- 国家详情 · 时间线 / 法规抽屉 ---- */
      ct_filing_pre_mand:  'Pre-approval mandatory',
      ct_filing_notif_mand:'Notification mandatory',
      ct_tl_regs:          'regulations',
      ct_tl_no_data:       'No regulation-level data',
      ct_tl_no_data2:      'This country is not included in Event Data',
      ct_reg_yr:           'Year Signed / Effective',
      ct_reg_lead:         'Lead Authority',
      ct_reg_notif:        'Notification',
      ct_reg_thresh:       'Review Threshold',
      ct_reg_tf:           'Review Timeframe',
      ct_reg_sectors:      'Sectors Covered',
      ct_reg_supersedes:   'Supersedes',
      ct_policy_text:      'Policy Text',
      ct_policy_excerpt:   '(excerpt)',
      ct_policy_none:      'No source file matched',
      ct_policy_chars:     'chars',
      ct_summarize_ai:     'Summarize with AI →',
      ct_download_pdf:     '↓ Download PDF',
      ct_view_source:      '↗ View Source',
      ct_radar_oecd:       'OECD Average',
      ct_matched_reg:      'Mechanism data from matched regulation: ',
      ct_no_match:         'No matched regulation record — mechanism details unavailable for this entry',

      /* ---- 政策变动 Tab ---- */
      chg_yr_events:     'Legislative Events',
      chg_new_global:    'new mechanisms globally',
      chg_events_sfx:    'events',
      chg_no_events:     'No events for this year',
      chg_chip_impl:     'Implementation',
      chg_chip_super:    'Supersedes',
      chg_chip_law:      'New Law',
      chg_chip_amend:    'Amendment',
      chg_chip_eo:       'Exec. Order',
      chg_detail_lead:   'Lead Authority',
      chg_detail_thresh: 'Review Threshold',
      chg_detail_tf:     'Review Timeframe',
      chg_detail_strict: 'Strictness',
      chg_detail_sectors:'Sectors Covered',
      chg_detail_ns:     'NS Test',
      chg_detail_super:  'Supersedes',
      chg_view_country:  'details →',
      chg_ref:           'Reference: ',
      chg_event:         'Legislative Event',
      chg_new_mech_y:    'New Mechanisms',

      /* ---- 演变 Tab 额外 ---- */
      evo_notif_none:    'Not\nmandatory',
      evo_notif_some:    'Some\nmandatory',
      evo_notif_all:     'All\nmandatory',
      evo_axis_notif:    'Notification',
      evo_axis_pre:      'Pre-approval',
      evo_axis_thresh:   'Threshold (%)',
      evo_axis_time:     'Timeframe (days)',
      evo_axis_strict:   'Strictness (0–13)',
      evo_sc_thresh_v:   'Threshold vs Strictness',
      evo_sc_time_v:     'Timeframe vs Strictness',
      evo_pie_sfx:       'countries',
      evo_pie_yr_sfx:    'Coverage Type Distribution',
      evo_countries_y:   'Countries',
      evo_strictness_y:  'Strictness',
      evo_net_no_data:   'No supersession data in current filter',
      evo_net_new:       'New law',
      evo_net_old:       'Superseded law',
      evo_net_title:     'Regulation Supersession Network',
      evo_net_sub:       'Directed edges: old → new law (supersession) · Node color by country group · Click to view country',
      evo_avg_strict:    'Avg. Strictness',
      evo_range:         'Range',

      /* ---- 对比 Tab 坐标轴 / 标签（zh 在下方对应） ---- */
      cmp_ax_mechanisms:   'Mechanisms',
      cmp_ax_strictness:   'Strictness',
      cmp_ax_sectors:      'Sectors',
      cmp_ax_threshold:    'Threshold%',
      cmp_ax_timeframe:    'Timeframe',
      cmp_ax_fines:        'Fines',
      cmp_ax_mitigation:   'Mitigation',
      cmp_ax_interagency:  'Interagency',
      cmp_ax_ns_test:      'NS Test',
      cmp_ax_net_benefit:  'Net Benefit',
      cmp_legend_click:    'Click a line to view country details',
      cmp_lenient:         'Lenient',
      cmp_strict_lbl:      'Strict',
      cmp_yes:             'Yes',
      cmp_no:              'No',
      cmp_sub_live:        '{yr} cross-section · {n} countries with mechanisms · Drag axis to filter · Click line for details',

      /* ---- 抽屉元信息标签 ---- */
      ct_source_file:      'File: ',
      ct_doc_chars:        '{n} chars',

      /* ---- 行业 Tab 副标题 ---- */
      sec_sub_countries:   'countries',
      sec_sub_detail_sfx:  'detailed sectors',
      sec_sub_aggr_sfx:    '8 categories',

      /* ---- 字段值翻译（数据库原始字符串） ---- */
      notif_not_mand:      'Not mandatory',
      notif_mand_some:     'Mandatory (some)',
      notif_mand_all:      'Mandatory (all)',
      notif_mand_re:       'Mandatory (real estate only)',
      notif_mand_most:     'Mandatory (most transactions)',
      eu_partial:          'Partial',
      val_yes:             'Yes',
      val_no:              'No',

      /* ---- 搜索框 ---- */
      sr_all:              'All',
      sr_countries:        'Countries',
      sr_regulations:      'Regulations',
      sr_policy:           'Policy Text',
      sr_no_results:       'No results for "{q}"',
      sr_est:              'Est.',
      sr_untitled:         '(untitled)',
      sr_excerpt_sfx:      '… Excerpt; full doc: {n} chars',

      /* ---- 通用 Tooltip / 补充标签 ---- */
      rail_filter:         'Filter',
      ov_trend_line_pfx:   'Line: ',
      ov_trend_legend:     'Countries: {dim}',
      equity_unit:         'equity',
      tip_total:           'Total',
      tip_share:           'Share',
      tip_covered:         '✓ Covered',
      tip_not_covered:     'Not covered',
      tip_coverage_sfx:    '% coverage',
      tip_regulation:      'Regulation',
      tip_type:            'Type',
    },

    /* ═══════════════════════════════════════════════════════ */
    zh: {
      /* ---- 页面标题 / Loading ---- */
      page_title:        'PRISM · 外商直接投资审查机制数据平台',
      loading_brand:     'PRISM 外资审查数据库',
      loading_status:    '数据加载中…',

      /* ---- 顶栏 ---- */
      brand_mark:        'PRISM 投资审查数据库',
      brand_sub:         '外商直接投资审查机制数据平台',
      search_placeholder:'搜索国家、法规、政策文本…',
      btn_check_deal:    '交易审查',
      btn_ask_ai:        'AI 问答',
      btn_info_title:    '用户手册',

      /* ---- 侧栏 ---- */
      rail_year:         '年份',
      rail_groups:       '国家分组',
      rail_countries:    '国家列表',
      filter_countries:  '筛选国家…',
      btn_play:          '▶ 播放时间轴',
      btn_pause:         '❚❚ 暂停',
      rail_footer:       '数据来源 · PRISM ISM 数据集（2023.12）',
      rail_footer2:      '时间序列 650 · 法规 143 · 变动 230 · 政策文本 141',

      /* ---- 分组标签 ---- */
      group_oecd:        'OECD',
      group_eu:          '欧盟 / 欧经区',
      group_fiveeyes:    '五眼联盟',

      /* ---- 导航标签 ---- */
      tab_overview:      '总览',
      tab_country:       '国家详情',
      tab_compare:       '横向对比',
      tab_evolution:     '机制演变',
      tab_changes:       '政策变动',
      tab_sectors:       '行业覆盖',

      /* ---- 总览 Tab ---- */
      ov_map_title:      '全球外资审查机制分布',
      ov_map_sub:        '各国按所选维度着色 · 颜色越深数值越高 · 点击国家查看详情',
      ov_map_tag:        '时间序列数据',
      ov_trend_title:    '全球趋势',
      ov_trend_sub:      '拥有某项特征的国家数 · 全球每年新增机制数',
      ov_snap_title:     '年度快照',
      ov_snap_sub:       '当前筛选国家集合',
      ov_no_data:        '暂无数据',
      ov_card_view:      '查看详情 →',
      ov_card_strictness:'严格程度',
      ov_card_sectors:   '覆盖行业',
      ov_snap_with_mech: '已建立机制的国家',
      ov_snap_avg_strict:'平均严格程度',
      ov_snap_avg_sec:   '平均覆盖行业数',
      ov_snap_new_mech:  '本年新增机制',
      ov_snap_cov_dist:  '覆盖类型分布',
      ov_dim_strictness: '严格程度评分（0–13）',
      ov_dim_sectors:    '覆盖行业数',
      ov_dim_threshold:  '审查门槛（股权比例）',
      ov_dim_timeframe:  '审查时限（天）',
      ov_trend_ns:       '国家安全测试',
      ov_trend_fines:    '罚款',
      ov_trend_mit:      '缓解措施',
      ov_trend_inter:    '跨部门审查',
      ov_trend_gov:      '强化政府控制',
      ov_trend_callin:   '正式调查权',
      ov_trend_fees:     '申报费',
      ov_trend_bar:      '全球新增机制数',
      ov_trend_eu:       '欧盟外资条例',
      ov_trend_covid:    '新冠立法浪潮',
      ov_trend_click:    '点击跳转',
      ov_legend_nodata:  '不在筛选范围 / 无数据',
      ov_snap_yr:        '年度快照',
      ov_est_year:       '建立于',

      /* ---- 国家详情 Tab ---- */
      ct_radar_title:    '多维度雷达图',
      ct_radar_sub:      '所选国家 vs OECD 均值 vs 历史对比',
      ct_kpi_title:      '关键指标',
      ct_kpi_sub:        '当前年度机制概览',
      ct_flags_title:    '程序要求与覆盖范围',
      ct_flags_sub:      '13 项程序权力 + 覆盖字段（✓ 存在 / ✗ 不存在）',
      ct_tl_title:       '法规时间线',
      ct_tl_sub:         '该国所有法规 · 气泡大小 = 覆盖行业数 · 点击查看全文',
      ct_tl_tag:         '事件数据',
      ct_cmp_no:         '不做历史对比',
      ct_cmp_prefix:     '对比',
      ct_no_data:        '本年暂无机制数据',
      ct_no_mech:        '{year} 年尚无主动审查机制，外商投资通常不受限制。',
      ct_filing_title:   '申报要求',
      ct_review_title:   '审查机构',
      ct_scope_title:    '范围与权力',
      ct_pre_req:        '需在交割前完成预批准',
      ct_notif_mand:     '强制通知申报',
      ct_no_filing:      '无强制申报要求',
      ct_threshold:      '审查门槛',
      ct_max_review:     '最长审查时限',
      ct_notification:   '通知要求',
      ct_review_crit:    '审查标准',
      ct_strictness_sc:  '严格程度评分',
      ct_sectors_scope:  '覆盖行业数',
      ct_not_spec:       '未明确规定',
      ct_since:          '建立于',
      ct_quick_check:    '⚡ 检查该国具体交易',
      ct_risk_none:      '无审查机制',
      ct_risk_low:       '存在审查',
      ct_risk_med:       '主动审查',
      ct_risk_high:      '严格审查',
      ct_criteria_ns:    '国家安全',
      ct_criteria_net:   '净经济效益',
      ct_criteria_comp:  '竞争',
      ct_criteria_dual:  '两用品 / 出口管制',
      ct_flag_callin:    '正式调查权',
      ct_flag_inter:     '跨部门审查',
      ct_flag_tiered:    '分级授权',
      ct_flag_mit:       '缓解权力',
      ct_flag_fines:     '罚款 / 处罚',
      ct_flag_gov:       '黄金股',
      ct_flag_eu:        '欧盟与非欧盟差异',
      ct_green_cov:      '涵盖绿地投资',
      ct_re_cov:         '涵盖房地产',
      ct_eu_diff:        '欧盟与非欧盟适用不同规则',
      ct_kpi_auth:       '主管机构',
      ct_kpi_cov:        '覆盖类型',
      ct_kpi_notif:      '通知要求',
      ct_kpi_pre:        '预批准要求',
      ct_kpi_thresh:     '审查门槛',
      ct_kpi_tf:         '审查时限',
      ct_kpi_eu:         '欧盟与非欧盟差异',
      ct_kpi_covid:      '新冠临时立法',
      ct_fg_invest:      '调查与审查权力',
      ct_fg_tests:       '测试与标准',
      ct_fg_sanct:       '制裁与机制',
      ct_fg_scope:       '覆盖范围',
      ct_days:           '天',
      ct_sectors_sfx:    '个行业',
      ct_sector_sfx1:    '个行业',

      /* ---- 对比 Tab ---- */
      cmp_title:         '多国平行坐标图',
      cmp_sub:           '当前年度横截面 · 拖动坐标轴范围以筛选 · 悬停高亮',
      cmp_color_group:   '按分组着色',
      cmp_color_strict:  '按严格程度着色',

      /* ---- 演变 Tab ---- */
      evo_pie_title:     '覆盖类型分布',
      evo_pie_sub:       '点击扇区查看该类型所有国家',
      evo_bubble_title:  '通知 × 预批准矩阵',
      evo_bubble_sub:    '当前年度程序严格程度组合 · 气泡大小 = 国家数',
      evo_stream_title:  '覆盖类型演变',
      evo_stream_sub:    '各年度不同覆盖模式的国家数 · 观察从行业型向跨行业型的转变',
      evo_ridge_title:   '严格程度随时间分布',
      evo_ridge_sub:     '各年度严格程度（0–13）均值与范围',
      evo_sc_threshold:  '门槛',
      evo_sc_timeframe:  '时限',

      /* ---- 变动 Tab ---- */
      chg_bar_title:     '全球立法活动',
      chg_bar_sub:       '各年度按类型划分的新增机制 · 点击柱体查看当年所有事件',
      chg_list_title:    '立法事件',
      chg_list_sub:      '点击上方柱体以选择年份',
      chg_type_law:      '新法律',
      chg_type_amend:    '修正案',
      chg_type_eo:       '行政令',
      chg_type_reg:      '法规实施',

      /* ---- 行业 Tab ---- */
      sec_heat_title:    '行业覆盖热力图',
      sec_heat_sub:      '行（行业）× 列（国家） · 深色 = 当年已覆盖',
      sec_bar_title:     '行业覆盖排名',
      sec_bar_sub:       '各行业被多少国家纳入 · 点击播放观察覆盖扩散',
      sec_detail_btn:    '细分行业',
      sec_aggr_btn:      '8 大类',
      sec_play:          '▶ 播放',
      sec_pause:         '❚❚ 暂停',

      /* ---- 覆盖类型 ---- */
      cov_sectoral:      '行业型',
      cov_cross:         '跨行业型',
      cov_mixed:         '混合型',
      cov_asset:         '资产型',
      cov_draft:         '草案',
      cov_passed:        '已通过（未实施）',

      /* ---- 程序标签 (PROC_LABELS) ---- */
      proc_formal_call_in:              '正式调查权',
      proc_review_increased_ownership:  '增持审查',
      proc_filing_fees:                 '申报费',
      proc_mitigation:                  '缓解措施',
      proc_fines:                       '罚款',
      proc_ns_test:                     '国家安全测试',
      proc_net_benefit_test:            '净效益测试',
      proc_competition_test:            '竞争测试',
      proc_interagency_review:          '跨部门审查',
      proc_tiered_authority:            '分级授权',
      proc_local_representation:        '本地代表要求',
      proc_enhanced_gov_control:        '强化政府控制',
      proc_colocation:                  '共址要求',
      proc_greenfield_covered:          '绿地投资',
      proc_real_estate_covered:         '房地产',
      proc_export_control_dualuse:      '出口管制 / 两用品',

      /* ---- 雷达维度标签 ---- */
      radar_ns_test:                    '国家安全',
      radar_formal_call_in:             '调查权',
      radar_fines:                      '罚款',
      radar_mitigation:                 '缓解措施',
      radar_interagency_review:         '跨部门',
      radar_net_benefit_test:           '净效益',
      radar_enhanced_gov_control:       '政府控制',
      radar_review_increased_ownership: '增持审查',

      /* ---- Info 抽屉 / Screener 抽屉标题 ---- */
      info_title:         '用户手册',
      info_sub:           'PRISM ISM 数据库 · 版本 1.0 · 数据范围：2007–2023',
      scr_drawer_title:   '交易审查',
      scr_drawer_sub:     '此投资是否需要申报？· 基于 PRISM 数据',

      /* ---- AI 面板 ---- */
      ai_title:           'PRISM 数据助手',
      ai_placeholder:     '就当前数据提问…（Enter 发送）',
      ai_ctx_label:       '上下文',
      ai_ctx_year:        '年份',
      ai_ctx_country:     '国家',
      ai_ctx_groups:      '分组',
      ai_ctx_tab:         '标签页',
      ai_save:            '保存',
      ai_clear:           '清除',
      ai_saved:           '✓ 已保存',
      ai_key_saved:       '✓ API Key 已保存，现在可以提问了。',
      ai_cfg_updated:     '配置已更新（Key 未变）。',
      ai_cfg_cleared:     '配置已清除。',
      ai_no_key:          '**请先配置 API Key**\n\n点击 ⚙ 按钮选择服务商并输入您的 Key。',
      ai_no_response:     '抱歉，未收到有效回复。',
      ai_req_error:       '请求错误：',
      ai_nonascii_warn:   '⚠ API Key 中包含非 ASCII 字符已被移除，请重新输入。',
      ai_prov_label:      '服务商',
      ai_model_label:     '模型',
      ai_baseurl_label:   'Base URL',
      ai_key_label:       'API Key',
      ai_key_ph:          'sk-...（留空则清除）',

      /* ---- AI 欢迎语 ---- */
      ai_welcome:         '您好，我是 PRISM 数据助手。我可以基于已筛选的 **{n} 个国家 · {y1}–{y2}** 的外资审查数据回答问题——对比国家、解释字段、发现趋势。请在下方选择提示词，或直接提问。',

      /* ---- AI Tab 名（上下文显示用）---- */
      ai_tab_overview:    '总览',
      ai_tab_country:     '国家详情',
      ai_tab_compare:     '横向对比',
      ai_tab_evolution:   '机制演变',
      ai_tab_changes:     '政策变动',
      ai_tab_sectors:     '行业覆盖',

      /* ---- 交易审查（Screener）---- */
      scr_intro:          '回答以下问题，评估某项外商投资是否可能触发所选国家的审查机制。',
      scr_target:         '目标国家',
      scr_sector:         '行业 / 领域',
      scr_stake:          '拟收购股权比例（%）',
      scr_origin:         '投资方来源国',
      scr_select_country: '— 请选择国家 —',
      scr_select_sector:  '— 请选择行业 —',
      scr_unknown:        '未知 / 未披露',
      scr_broad:          '大类',
      scr_specific:       '细分行业',
      scr_run:            '检查此交易 →',
      scr_disclaimer:     '⚠ 本工具基于 PRISM 数据库的公开数据提供指示性评估，不构成法律建议。在推进交易前，请务必咨询相关国家主管机构或法律顾问。',
      scr_no_mech_title:  '无正式审查机制',
      scr_not_impl_title: '机制已立法但尚未生效',
      scr_high_title:     '很可能需要申报审查',
      scr_low_title:      '低于门槛 — 请核实行业规定',
      scr_ok_title:       '该行业似乎不在适用范围内',
      scr_warn_title:     '可能适用审查 — 请向主管机构核实',
      scr_insuf_title:    '数据不足 — 请咨询主管机构',
      scr_view_profile:   '查看 {c} 完整档案 →',
      scr_err_country:    '请选择目标国家。',
      scr_no_mech_body:   '根据现有数据，<strong>{c}</strong> 在 {yr} 年没有主动的正式外资审查机制，外商投资通常无需强制审查。',
      scr_not_impl_body:  '{c} 截至 {yr} 年已通过审查立法，但实施细则可能尚未生效，请持续关注实施日期。',
      scr_cross:          '<strong>{c}</strong> 实施<strong>{cov}</strong>审查——适用于大多数或所有外商收购交易。',
      scr_sec_in:         '所选行业<strong>属于</strong> {c} 审查机制的覆盖范围之内。',
      scr_sec_out:        '根据现有数据，所选行业<strong>似乎不在</strong> {c} 审查机制的覆盖范围之内。',
      scr_sec_unk:        '{c} 实施<strong>{cov}</strong>审查，但无法从现有数据中确定您所在具体行业的覆盖情况。',
      scr_above:          '您拟收购的 <strong>{s}%</strong> 股权等于或超过了已记录的审查门槛 <strong>{thr}%</strong>。',
      scr_below:          '您拟收购的 <strong>{s}%</strong> 股权<strong>低于</strong>已记录的审查门槛 <strong>{thr}%</strong>，但特定行业的门槛可能更低。',
      scr_thr_only:       '审查门槛：<strong>≥ {thr}% 股权</strong>。',
      scr_pre_mand:       '<strong>强制预批准</strong>——必须在交割前获得批准。',
      scr_notif_mand:     '<strong>强制通知申报</strong>——即使不需要预批准，也必须申报。',
      scr_eu_lighter:     '该机制对欧盟与非欧盟投资者适用不同规则。作为欧盟投资者，您可能面临<strong>较轻的审查</strong>。',
      scr_eu_stricter:    '该机制对欧盟与非欧盟投资者适用不同规则。作为非欧盟投资者，您可能面临<strong>更严格的审查条件</strong>。',
      scr_timeframe:      '最长审查期限：自通知之日起 <strong>{d} 天</strong>。',
      scr_authority:      '主管机构：<strong>{a}</strong>。',

      /* ---- 数据年份 ---- */
      screener_year:     '数据年份：',

      /* ---- 地图 tooltip ---- */
      ov_tip_est:        '建立年份',
      ov_tip_coverage:   '覆盖类型',
      ov_tip_mechanisms: '机制数量',
      ov_tip_sectors:    '覆盖行业数',
      ov_tip_strictness: '严格程度',
      ov_trend_countries_y: '国家数',
      ov_trend_new_mech_y:  '新增机制',

      /* ---- 国家详情 · 时间线 / 法规抽屉 ---- */
      ct_filing_pre_mand:  '需预批准',
      ct_filing_notif_mand:'需通知申报',
      ct_tl_regs:          '项法规',
      ct_tl_no_data:       '暂无法规层级数据',
      ct_tl_no_data2:      '该国未收录于事件数据库',
      ct_reg_yr:           '签署 / 生效年份',
      ct_reg_lead:         '主管机构',
      ct_reg_notif:        '通知要求',
      ct_reg_thresh:       '审查门槛',
      ct_reg_tf:           '审查时限',
      ct_reg_sectors:      '覆盖行业',
      ct_reg_supersedes:   '取代',
      ct_policy_text:      '政策文本',
      ct_policy_excerpt:   '（节选）',
      ct_policy_none:      '未找到对应源文件',
      ct_policy_chars:     '字符',
      ct_summarize_ai:     'AI 摘要 →',
      ct_download_pdf:     '↓ 下载 PDF',
      ct_view_source:      '↗ 查看原文',
      ct_radar_oecd:       'OECD 均值',
      ct_matched_reg:      '匹配法规的机制数据：',
      ct_no_match:         '未匹配到法规记录 — 暂无该条目的机制详情',

      /* ---- 政策变动 Tab ---- */
      chg_yr_events:     '立法事件',
      chg_new_global:    '个新增机制（全球）',
      chg_events_sfx:    '项事件',
      chg_no_events:     '本年暂无立法事件',
      chg_chip_impl:     '法规实施',
      chg_chip_super:    '取代法律',
      chg_chip_law:      '新法律',
      chg_chip_amend:    '修正案',
      chg_chip_eo:       '行政令',
      chg_detail_lead:   '主管机构',
      chg_detail_thresh: '审查门槛',
      chg_detail_tf:     '审查时限',
      chg_detail_strict: '严格程度',
      chg_detail_sectors:'覆盖行业',
      chg_detail_ns:     '国家安全测试',
      chg_detail_super:  '取代',
      chg_view_country:  '详情 →',
      chg_ref:           '参考：',
      chg_event:         '立法事件',
      chg_new_mech_y:    '新增机制',

      /* ---- 演变 Tab 额外 ---- */
      evo_notif_none:    '非\n强制',
      evo_notif_some:    '部分\n强制',
      evo_notif_all:     '全部\n强制',
      evo_axis_notif:    '通知要求',
      evo_axis_pre:      '预批准要求',
      evo_axis_thresh:   '门槛（%）',
      evo_axis_time:     '时限（天）',
      evo_axis_strict:   '严格程度（0–13）',
      evo_sc_thresh_v:   '门槛 vs 严格程度',
      evo_sc_time_v:     '时限 vs 严格程度',
      evo_pie_sfx:       '个国家',
      evo_pie_yr_sfx:    '覆盖类型分布',
      evo_countries_y:   '国家数',
      evo_strictness_y:  '严格程度',
      evo_net_no_data:   '当前筛选条件下无取代关系数据',
      evo_net_new:       '新法律',
      evo_net_old:       '被取代的法律',
      evo_net_title:     '法规取代关系网络',
      evo_net_sub:       '有向边：旧法 → 新法 · 节点颜色按国家分组 · 点击查看国家详情',
      evo_avg_strict:    '平均严格程度',
      evo_range:         '区间',

      /* ---- 对比 Tab 坐标轴 / 标签 ---- */
      cmp_ax_mechanisms:   '机制数',
      cmp_ax_strictness:   '严格程度',
      cmp_ax_sectors:      '覆盖行业',
      cmp_ax_threshold:    '门槛%',
      cmp_ax_timeframe:    '审查时限',
      cmp_ax_fines:        '罚款',
      cmp_ax_mitigation:   '缓解措施',
      cmp_ax_interagency:  '跨部门',
      cmp_ax_ns_test:      '国家安全',
      cmp_ax_net_benefit:  '净效益',
      cmp_legend_click:    '点击折线查看国家详情',
      cmp_lenient:         '宽松',
      cmp_strict_lbl:      '严格',
      cmp_yes:             '是',
      cmp_no:              '否',
      cmp_sub_live:        '{yr} 年横截面 · {n} 个国家存在审查机制 · 拖动坐标轴范围筛选 · 点击折线查看详情',

      /* ---- 抽屉元信息标签 ---- */
      ct_source_file:      '来源文件：',
      ct_doc_chars:        '{n} 字符',

      /* ---- 行业 Tab 副标题 ---- */
      sec_sub_countries:   '个国家',
      sec_sub_detail_sfx:  '个细分行业',
      sec_sub_aggr_sfx:    '8 大类',

      /* ---- 字段值翻译（数据库原始字符串） ---- */
      notif_not_mand:      '非强制申报',
      notif_mand_some:     '部分强制申报',
      notif_mand_all:      '全部强制申报',
      notif_mand_re:       '强制申报（仅限房地产）',
      notif_mand_most:     '强制申报（大多数交易）',
      eu_partial:          '部分差异',
      val_yes:             '是',
      val_no:              '否',

      /* ---- 搜索框 ---- */
      sr_all:              '全部',
      sr_countries:        '国家',
      sr_regulations:      '法规',
      sr_policy:           '政策文本',
      sr_no_results:       '未找到"{q}"的相关结果',
      sr_est:              '建立于',
      sr_untitled:         '（无标题）',
      sr_excerpt_sfx:      '… 节选显示；完整文档共 {n} 字符',

      /* ---- 通用 Tooltip / 补充标签 ---- */
      rail_filter:         '筛选',
      ov_trend_line_pfx:   '折线：',
      ov_trend_legend:     '{dim}（国家数）',
      equity_unit:         '股权',
      tip_total:           '合计',
      tip_share:           '占比',
      tip_covered:         '✓ 已覆盖',
      tip_not_covered:     '未覆盖',
      tip_coverage_sfx:    '% 覆盖率',
      tip_regulation:      '法规',
      tip_type:            '类型',
    }
  };

  /* ── 国家名中英对照 ──────────────────────────────────── */
  const COUNTRY_NAMES = {
    zh: {
      'Australia':        '澳大利亚',
      'Austria':          '奥地利',
      'Belgium':          '比利时',
      'Canada':           '加拿大',
      'Chile':            '智利',
      'Costa Rica':       '哥斯达黎加',
      'Czech Rep.':       '捷克',
      'Czech Republic':   '捷克',
      'Denmark':          '丹麦',
      'Estonia':          '爱沙尼亚',
      'Finland':          '芬兰',
      'France':           '法国',
      'Germany':          '德国',
      'Greece':           '希腊',
      'Hungary':          '匈牙利',
      'Iceland':          '冰岛',
      'Ireland':          '爱尔兰',
      'Israel':           '以色列',
      'Italy':            '意大利',
      'Japan':            '日本',
      'Korea':            '韩国',
      'Republic of Korea':'韩国',
      'Latvia':           '拉脱维亚',
      'Lithuania':        '立陶宛',
      'Luxembourg':       '卢森堡',
      'Mexico':           '墨西哥',
      'Netherlands':      '荷兰',
      'New Zealand':      '新西兰',
      'Norway':           '挪威',
      'Poland':           '波兰',
      'Portugal':         '葡萄牙',
      'Slovak Republic':  '斯洛伐克',
      'Slovakia':         '斯洛伐克',
      'Slovenia':         '斯洛文尼亚',
      'Spain':            '西班牙',
      'Sweden':           '瑞典',
      'Switzerland':      '瑞士',
      'Turkey':           '土耳其',
      'United Kingdom':   '英国',
      'United States':    '美国',
      'Romania':          '罗马尼亚',
      'Bulgaria':         '保加利亚',
      'Croatia':          '克罗地亚',
      'Cyprus':           '塞浦路斯',
      'Malta':            '马耳他',
      'Colombia':         '哥伦比亚',
      'Indonesia':        '印度尼西亚',
      'India':            '印度',
      'Brazil':           '巴西',
      'South Africa':     '南非',
      'Saudi Arabia':     '沙特阿拉伯',
    }
  };

  /* ── 内部状态 ────────────────────────────────────────── */
  let _lang = 'en';

  /* ── API ─────────────────────────────────────────────── */
  function t(key) {
    return (DICT[_lang] && DICT[_lang][key]) ||
           (DICT['en']  && DICT['en'][key])  ||
           key;
  }

  function countryName(english) {
    if (_lang === 'zh') return (COUNTRY_NAMES.zh[english]) || english;
    return english;
  }

  function countryShort(english) {
    // 中文名通常不需要缩写，直接用全名
    return countryName(english);
  }

  function setLang(l) {
    _lang = l;
    // localStorage.setItem('prism_lang', l);

    /* 1. 更新所有带 data-i18n 属性的静态元素 */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (val !== key) el.textContent = val;
    });
    /* 2. 更新 placeholder */
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    /* 3. 更新 title 属性 */
    document.querySelectorAll('[data-i18n-ttl]').forEach(el => {
      el.title = t(el.dataset.i18nTtl);
    });
    /* 4. 更新页面标题 + html lang 属性 */
    document.title = t('page_title');
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    /* 5. 更新切换按钮文字 */
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = l === 'zh' ? '🌐 EN' : '🌐 中文';
    /* 6. 重置已挂载的 tab，触发下次访问时重新渲染 */
    if (window.PRISM_TABS) {
      Object.values(window.PRISM_TABS).forEach(tab => { tab.mounted = false; });
    }
    /* 7. 通知全局事件，重新渲染当前 Tab */
    if (window.PRISM) window.PRISM.emit('lang', l);
  }


  /* ── 行业名称翻译字典 ───────────────────────────────────── */
  const SEC_DISPLAY_EN = {
    'Defense Production':'Defense Production','Energy Infrastructure':'Energy Infrastructure',
    'Water Infrastructure':'Water Infrastructure','Transportation Infrastructure':'Transportation Infrastructure',
    'Telecommunications Infrastructure':'Telecom Infrastructure','Healthcare Infrastructure':'Healthcare Infrastructure',
    'Education and Training':'Education & Training','Agriculture/Food Security':'Agriculture / Food Security',
    'Finance':'Finance','Media':'Media','Research Institutions':'Research Institutions',
    'Sensitive Personal Data':'Sensitive Personal Data','Controlled Dual-Use':'Controlled Dual-Use',
    'Biotechology':'Biotechnology','Biotechnology':'Biotechnology',
    'Artificial Intelligence and Machine Learning':'AI & Machine Learning',
    'Logistics Technology':'Logistics Technology','Microprocessor Technology':'Microprocessor Technology',
    'Advanced Computing Technology':'Advanced Computing','Data Analytics Technology':'Data Analytics',
    'Quantum Information and Sensing Technology':'Quantum Technology',
    'Additive Manufacturing':'Additive Manufacturing','Robotics':'Robotics',
    'Brain-Computer Interfaces':'Brain-Computer Interfaces','Hypersonics':'Hypersonics',
    'Advanced Materials':'Advanced Materials','Advanced Surveillance Technologies':'Advanced Surveillance',
    'Cyber Security':'Cyber Security','Defense Technologies':'Defense Technologies',
    'Energy Storage':'Energy Storage','Civil Nuclear':'Civil Nuclear','Gambling':'Gambling',
    'Mineral Resources':'Mineral Resources','Tourism':'Tourism','Space':'Space',
    'Critical Supplies':'Critical Supplies',
  };
  const SEC_DISPLAY_ZH = {
    'Defense Production':'国防生产','Energy Infrastructure':'能源基础设施',
    'Water Infrastructure':'水务基础设施','Transportation Infrastructure':'交通基础设施',
    'Telecommunications Infrastructure':'电信基础设施','Healthcare Infrastructure':'医疗基础设施',
    'Education and Training':'教育与培训','Agriculture/Food Security':'农业/食品安全',
    'Finance':'金融','Media':'媒体','Research Institutions':'研究机构',
    'Sensitive Personal Data':'个人敏感数据','Controlled Dual-Use':'管制两用品',
    'Biotechology':'生物技术','Biotechnology':'生物技术',
    'Artificial Intelligence and Machine Learning':'AI与机器学习',
    'Logistics Technology':'物流技术','Microprocessor Technology':'微处理器技术',
    'Advanced Computing Technology':'先进计算','Data Analytics Technology':'数据分析',
    'Quantum Information and Sensing Technology':'量子技术',
    'Additive Manufacturing':'增材制造','Robotics':'机器人技术',
    'Brain-Computer Interfaces':'脑机接口','Hypersonics':'超声速技术',
    'Advanced Materials':'先进材料','Advanced Surveillance Technologies':'先进监控',
    'Cyber Security':'网络安全','Defense Technologies':'国防技术',
    'Energy Storage':'储能','Civil Nuclear':'民用核能','Gambling':'博彩',
    'Mineral Resources':'矿产资源','Tourism':'旅游','Space':'航天',
    'Critical Supplies':'关键物资',
  };
  const CAT_DISPLAY_EN = {
    'Defense':'Defense',
    'Physical/Conventional Critical Infrastructure':'Physical Critical Infrastructure',
    'Next Gen Critical Infrastructure':'Next-Gen Critical Infrastructure',
    'Critical Technologies and Dual Use':'Critical Tech & Dual-Use',
    'Non-tradeable Services':'Non-tradeable Services',
    'Finance':'Finance','Media':'Media',
    'Access to Personal Sensitive Data':'Sensitive Personal Data',
  };
  const CAT_DISPLAY_ZH = {
    'Defense':'国防',
    'Physical/Conventional Critical Infrastructure':'实体关键基础设施',
    'Next Gen Critical Infrastructure':'新兴关键基础设施',
    'Critical Technologies and Dual Use':'关键技术与两用品',
    'Non-tradeable Services':'不可贸易性服务',
    'Finance':'金融','Media':'媒体',
    'Access to Personal Sensitive Data':'个人敏感数据',
  };
  function translateSector(s) {
    const map = _lang === 'zh' ? SEC_DISPLAY_ZH : SEC_DISPLAY_EN;
    return map[s] || s;
  }
  function translateCat(s) {
    s = (s||'').trim();
    const map = _lang === 'zh' ? CAT_DISPLAY_ZH : CAT_DISPLAY_EN;
    return map[s] || s;
  }

  /* 通知/预批准字段值翻译（仅 zh 模式下替换，en 模式返回原值） */
  const _NOTIF_KEY_MAP = {
    'Not mandatory':                   'notif_not_mand',
    'Mandatory (some)':                'notif_mand_some',
    'Mandatory (all)':                 'notif_mand_all',
    'Mandatory (real estate only)':    'notif_mand_re',
    'mandatory for most transactions': 'notif_mand_most',
  };
  function translateNotif(val) {
    if (!val) return '—';
    if (_lang !== 'zh') return val;
    const key = _NOTIF_KEY_MAP[val];
    return key ? t(key) : val;
  }

  /* eu_noeu_diff 数值格式化（0/0.5/1 → 否/部分差异/是） */
  function formatEuDiff(val) {
    if (val == null) return '—';
    if (_lang !== 'zh') return val === 1 ? 'Yes' : val === 0 ? 'No' : 'Partial';
    return val === 1 ? t('val_yes') : val === 0 ? t('val_no') : t('eu_partial');
  }

  /* 中文部分匹配 → 英文名列表（供搜索使用） */
  function searchEnByZh(zhQuery) {
    if (!zhQuery) return [];
    const q = zhQuery.trim();
    const map = COUNTRY_NAMES.zh;
    return Object.entries(map)
      .filter(([en, zh]) => zh.includes(q))
      .map(([en]) => en);
  }

  window.PRISM_I18N = { t, setLang, countryName, countryShort, searchEnByZh,
    translateNotif, formatEuDiff, translateSector, translateCat,
    get lang() { return _lang; } };
})();
