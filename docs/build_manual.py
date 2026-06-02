"""
PRISM ISM Database — User Manual PDF Generator
Generates a fully-formatted PDF manual using ReportLab.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.colors import HexColor, white, black
import os

# ── Colours ──────────────────────────────────────────────────────────────────
C_BLUE   = HexColor('#4f6f9e')
C_CLAY   = HexColor('#bf6a4a')
C_GREEN  = HexColor('#3f8a5e')
C_AMBER  = HexColor('#c79a3e')
C_PURPLE = HexColor('#7d5ba6')
C_INK    = HexColor('#2b3344')
C_SOFT   = HexColor('#5a6477')
C_FAINT  = HexColor('#8a93a3')
C_LINE   = HexColor('#e2e5ea')
C_PAPER  = HexColor('#f8f9fb')
C_BLUE_BG = HexColor('#eef2f8')
C_CLAY_BG = HexColor('#fdf0ec')
C_GREEN_BG = HexColor('#ecf5f0')

W, H = A4  # 595 x 842 pt

# ── Styles ────────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    def S(name, parent='Normal', **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    styles = {}
    styles['Normal'] = S('Body', fontSize=10, leading=15, textColor=C_INK,
                         alignment=TA_JUSTIFY, spaceAfter=6)
    styles['H1'] = S('H1', fontSize=18, leading=22, textColor=C_INK,
                     fontName='Helvetica-Bold', spaceBefore=24, spaceAfter=8)
    styles['H2'] = S('H2', fontSize=13, leading=17, textColor=C_BLUE,
                     fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=6)
    styles['H3'] = S('H3', fontSize=11, leading=14, textColor=C_INK,
                     fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)
    styles['H4'] = S('H4', fontSize=10, leading=13, textColor=C_SOFT,
                     fontName='Helvetica-BoldOblique', spaceBefore=8, spaceAfter=3)
    styles['Title'] = S('ManTitle', fontSize=32, leading=38, textColor=C_CLAY,
                        fontName='Helvetica-Bold', alignment=TA_CENTER)
    styles['Subtitle'] = S('ManSub', fontSize=15, leading=20, textColor=C_INK,
                           fontName='Helvetica-Bold', alignment=TA_CENTER)
    styles['Caption'] = S('Caption', fontSize=9, leading=12, textColor=C_SOFT,
                          fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceAfter=10)
    styles['Bullet'] = S('Bul', fontSize=10, leading=14, textColor=C_INK,
                         leftIndent=14, firstLineIndent=0, spaceAfter=3,
                         bulletIndent=4)
    styles['SubBullet'] = S('SubBul', fontSize=9.5, leading=13, textColor=C_SOFT,
                            leftIndent=28, firstLineIndent=0, spaceAfter=2)
    styles['Code'] = S('Cod', fontSize=8.5, leading=12, textColor=C_INK,
                       fontName='Courier', backColor=C_PAPER,
                       leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=4)
    styles['Note'] = S('Note', fontSize=9.5, leading=13, textColor=C_SOFT,
                       leftIndent=12, rightIndent=12, spaceAfter=4)
    styles['TOCEntry1'] = S('TOC1', fontSize=11, leading=15, textColor=C_INK,
                            fontName='Helvetica-Bold', spaceAfter=2)
    styles['TOCEntry2'] = S('TOC2', fontSize=10, leading=14, textColor=C_SOFT,
                            leftIndent=16, spaceAfter=1)
    styles['Footer'] = S('Foot', fontSize=8, textColor=C_FAINT,
                         alignment=TA_CENTER)
    styles['PageNum'] = S('PNum', fontSize=8, textColor=C_FAINT,
                          alignment=TA_CENTER)
    styles['TableHead'] = S('TH', fontSize=9, leading=12, textColor=white,
                            fontName='Helvetica-Bold', alignment=TA_LEFT)
    styles['TableCell'] = S('TC', fontSize=9, leading=13, textColor=C_INK)
    styles['CenteredBold'] = S('CB', fontSize=10, leading=14, textColor=C_INK,
                               fontName='Helvetica-Bold', alignment=TA_CENTER)
    styles['TipText'] = S('Tip', fontSize=9.5, leading=14, textColor=C_INK,
                          leftIndent=8, rightIndent=8)
    return styles

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr(color=C_LINE, thickness=0.5):
    return HRFlowable(width='100%', thickness=thickness, color=color,
                      spaceAfter=6, spaceBefore=2)

def sp(h=6):
    return Spacer(1, h)

def tip_box(text, title=None, bg=C_BLUE_BG, border=C_BLUE, styles=None):
    """Coloured tip/note box."""
    s = styles
    rows = []
    if title:
        rows.append([Paragraph(f'<b>{title}</b>', s['H4'])])
    rows.append([Paragraph(text, s['TipText'])])
    t = Table(rows, colWidths=[14.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [bg]),
    ]))
    return t

def badge(text, bg, fg=white):
    return f'<font color="#{bg[1:] if bg.startswith("#") else bg}"><b> {text} </b></font>'

def data_table(headers, rows, col_widths, styles):
    """Styled data table with coloured header."""
    data = [[Paragraph(h, styles['TableHead']) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    ts = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_BLUE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, C_PAPER]),
        ('GRID', (0,0), (-1,-1), 0.4, C_LINE),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ])
    t.setStyle(ts)
    return t

# ── Page templates ────────────────────────────────────────────────────────────
class NumberedCanvas:
    """Canvas callback for page numbers/headers."""
    def __init__(self, doc):
        self.doc = doc

def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(C_FAINT)
        canvas.drawString(2*cm, H - 1.3*cm, 'PRISM ISM Database — User Manual')
        canvas.drawRightString(W - 2*cm, H - 1.3*cm, f'Page {doc.page}')
        canvas.setStrokeColor(C_LINE)
        canvas.setLineWidth(0.4)
        canvas.line(2*cm, H - 1.5*cm, W - 2*cm, H - 1.5*cm)
        canvas.line(2*cm, 1.5*cm, W - 2*cm, 1.5*cm)
    canvas.restoreState()

# ── Content builder ───────────────────────────────────────────────────────────
def build_story(styles):
    story = []
    S = styles

    # ── TITLE PAGE ──────────────────────────────────────────────────────────
    story.append(sp(80))
    story.append(Paragraph('PRISM', S['Title']))
    story.append(sp(4))
    story.append(Paragraph('ISM Database', ParagraphStyle('ST2', parent=S['Subtitle'],
                 fontSize=20, textColor=C_INK)))
    story.append(sp(4))
    story.append(Paragraph('FDI Screening Mechanism Data Platform',
                 ParagraphStyle('ST3', parent=S['Subtitle'], fontSize=13,
                 textColor=C_SOFT, fontName='Helvetica')))
    story.append(sp(30))
    story.append(hr(C_LINE, 1))
    story.append(sp(20))

    # info box on title page
    tbl = Table([
        [Paragraph('<b>User Manual</b>', ParagraphStyle('tp', parent=S['CenteredBold'],
                   fontSize=14, textColor=C_CLAY))],
        [Paragraph('Version 1.0 &nbsp;|&nbsp; Data range: 2007–2023',
                   ParagraphStyle('tp2', parent=S['Normal'], alignment=TA_CENTER,
                   textColor=C_SOFT, fontSize=10))],
        [Paragraph('https://jonebroom.github.io/prism-fdi/',
                   ParagraphStyle('tp3', parent=S['Normal'], alignment=TA_CENTER,
                   textColor=C_BLUE, fontSize=10))],
    ], colWidths=[12*cm])
    tbl.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(tbl)
    story.append(sp(30))

    key_rows = [[
        Paragraph('<b>38 Countries</b>', S['CenteredBold']),
        Paragraph('<b>17 Years (2007–2023)</b>', S['CenteredBold']),
        Paragraph('<b>6 Analytical Views</b>', S['CenteredBold']),
    ]]
    kt = Table(key_rows, colWidths=[4.8*cm, 4.8*cm, 4.8*cm])
    kt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BLUE_BG),
        ('BOX', (0,0), (-1,-1), 1, C_BLUE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BLUE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(kt)
    story.append(sp(12))
    story.append(Paragraph(
        'OECD · EU/EEA · Five Eyes · 650 time-series records · 143 regulations · 141 policy documents',
        ParagraphStyle('sub', parent=S['Normal'], alignment=TA_CENTER,
                       textColor=C_FAINT, fontSize=9)))

    story.append(sp(60))
    story.append(Paragraph(
        'This manual covers all platform features, data fields, and analytical modules.<br/>'
        'Intended for lawyers, investment professionals, compliance teams, and researchers.',
        ParagraphStyle('disc', parent=S['Normal'], alignment=TA_CENTER,
                       textColor=C_SOFT, fontSize=9)))
    story.append(PageBreak())

    # ── SECTION HELPER ──────────────────────────────────────────────────────
    _sec_num = [0]
    _sub_num = [0]
    _ssub_num = [0]

    def sec(title):
        _sec_num[0] += 1
        _sub_num[0] = 0
        _ssub_num[0] = 0
        n = _sec_num[0]
        story.append(KeepTogether([
            Paragraph(f'{n}. {title}', S['H1']),
            hr(C_CLAY, 1.2),
            sp(4),
        ]))

    def sub(title):
        _sub_num[0] += 1
        _ssub_num[0] = 0
        n = f'{_sec_num[0]}.{_sub_num[0]}'
        story.append(sp(4))
        story.append(Paragraph(f'{n} {title}', S['H2']))
        story.append(hr(C_BLUE, 0.4))

    def ssub(title):
        _ssub_num[0] += 1
        n = f'{_sec_num[0]}.{_sub_num[0]}.{_ssub_num[0]}'
        story.append(Paragraph(f'{n} {title}', S['H3']))

    def p(text):
        story.append(Paragraph(text, S['Normal']))

    def bul(items, sub=False):
        for item in items:
            if isinstance(item, str):
                story.append(Paragraph(f'• {item}', S['SubBullet'] if sub else S['Bullet']))
            elif isinstance(item, tuple):
                story.append(Paragraph(f'• <b>{item[0]}</b> — {item[1]}', S['Bullet']))

    def tip(text, title='Tip', bg=C_BLUE_BG, border=C_BLUE):
        story.append(sp(4))
        story.append(tip_box(text, title, bg, border, S))
        story.append(sp(4))

    def warn(text, title='Important'):
        tip(text, title, C_CLAY_BG, C_CLAY)

    def note(text, title='Note'):
        tip(text, title, C_PAPER, C_LINE)

    def tbl_caption(text):
        story.append(Paragraph(text, S['Caption']))

    # ── 1. PLATFORM OVERVIEW ────────────────────────────────────────────────
    sec('Platform Overview')
    p('PRISM (Policy Review and Investment Screening Mechanisms) is an interactive data platform '
      'providing comprehensive, time-series coverage of foreign direct investment (FDI) screening '
      'mechanisms across 38 countries from 2007 to 2023.')

    sub('What is FDI Screening?')
    p('Foreign direct investment screening refers to government processes that review—and potentially '
      'block or impose conditions on—inbound foreign investments on grounds of national security, '
      'public order, or strategic economic interests. Since the mid-2010s, the number of countries '
      'operating formal screening mechanisms has grown rapidly, driven by geopolitical tensions, the '
      'COVID-19 pandemic, and the EU FDI Screening Regulation of 2019.')

    sub('Who is this platform for?')
    bul([
        ('Legal practitioners and compliance teams', 'quickly assess whether a proposed transaction triggers mandatory filing in a target jurisdiction.'),
        ('Investment professionals', 'compare screening regimes across potential target markets and understand deal timeline risks.'),
        ('Policy researchers and academics', 'trace the diffusion and tightening of FDI screening norms over time.'),
        ('Government officials', 'benchmark national mechanisms against peer countries.'),
    ])

    sub('Data Scope')
    story.append(sp(4))
    story.append(data_table(
        ['Dimension', 'Coverage'],
        [
            ['Countries', '38 (OECD members, EU/EEA states, Five Eyes)'],
            ['Time range', '2007–2023 (annual observations)'],
            ['Time-series records', '650 country-year entries'],
            ['Regulations', '143 individual regulatory instruments'],
            ['Legislative events', '230 legislative change events'],
            ['Policy documents', '141 full-text source documents (PDF + HTML)'],
            ['Sectors tracked', '36 detailed + 8 aggregate categories'],
            ['Procedural indicators', '13 binary powers + 4 quantitative fields'],
        ],
        [6*cm, 9*cm], S
    ))
    tbl_caption('Table 1 – PRISM data coverage summary')
    tip('All data reflect published information as of late 2023. The 2024 year is '
        'intentionally excluded as coverage was incomplete. The platform uses the most '
        'recent complete year (2023) as the default view.', 'Data currency')

    sub('Country Groups')
    p('Countries are organised into three overlapping groups used throughout the platform for '
      'filtering and colour-coding:')
    bul([
        'OECD — Organisation for Economic Co-operation and Development members (blue)',
        'EU/EEA — European Union and European Economic Area members (green)',
        'Five Eyes — Australia, Canada, New Zealand, United Kingdom, United States (amber)',
    ])
    p('Countries may belong to more than one group (e.g. Australia is both OECD and Five Eyes).')

    # ── 2. INTERFACE LAYOUT ─────────────────────────────────────────────────
    sec('Interface Layout')
    p('The PRISM interface is divided into four persistent areas always visible on screen, '
      'plus drawers that slide in from the right on demand.')

    story.append(sp(4))
    layout_data = [[Paragraph(
        '<font face="Courier" size="8">'
        '┌─────────────────────────────────────────────────────────────┐<br/>'
        '│  TOPBAR: Logo │ Search │ ⚡ Check Deal │ Ask AI │ ℹ Info    │<br/>'
        '├──────────┬──────────────────────────────────────────────────┤<br/>'
        '│          │  TABBAR: 01 Overview │ 02 Country │ … │ 06 Sectors│<br/>'
        '│  RAIL    ├──────────────────────────────────────────────────┤<br/>'
        '│  Year    │                                                   │<br/>'
        '│  Groups  │         MAIN CONTENT AREA (active tab)           │<br/>'
        '│  Country │                                                   │<br/>'
        '└──────────┴──────────────────────────────────────────────────┘'
        '</font>',
        ParagraphStyle('mono', parent=S['Normal'], fontName='Courier', fontSize=8,
                       leading=11, textColor=C_INK))
    ]]
    lt = Table(layout_data, colWidths=[14.5*cm])
    lt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_PAPER),
        ('BOX', (0,0), (-1,-1), 0.5, C_LINE),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(lt)
    tbl_caption('Figure 1 – PRISM interface layout schematic')

    sub('Top Bar')
    bul([
        ('PRISM logo', 'Platform identity; subtitle shows country count and year range.'),
        ('Global Search box', 'Full-text search across countries, regulations, and policy documents. Press [/] anywhere to focus it.'),
        ('⚡ Check Deal', 'Opens the Deal Screener drawer (see Section 9).'),
        ('Ask AI', 'Opens the AI Data Assistant drawer (see Section 10).'),
        ('ℹ', 'Opens the Platform Guide drawer with quick reference information.'),
    ])

    sub('Control Rail (Sidebar)')
    p('The left sidebar contains all global controls that affect the entire platform.')

    ssub('Year Selector')
    bul([
        'The large year number shows the currently selected year.',
        'Drag the slider left or right to move between 2007 and 2023.',
        'Click ▶ Play Timeline to animate through all years automatically (one year per second). Click ❚❚ Pause to stop. Switching to another tab also stops the animation.',
    ])

    ssub('Country Group Filters')
    p('Three toggle buttons filter which countries appear in all charts and lists:')
    bul([
        'OECD (19 countries) — click to include/exclude.',
        'EU/EEA (27 countries) — click to include/exclude.',
        'Five Eyes (5 countries) — click to include/exclude.',
    ])
    warn('At least one group must remain active. If you deactivate all three the last '
         'toggle is automatically re-enabled. Country overlap between groups means total '
         'active countries may be fewer than the sum of group sizes.')

    ssub('Country List')
    bul([
        'Displays all countries passing the current group filter.',
        'Each row shows a coloured dot (group), country name, and year the mechanism was established.',
        'Use the "Filter countries…" search box above the list for quick lookup.',
        'Clicking any country selects it and automatically switches to the Country tab.',
    ])

    sub('Tab Bar')
    p('Six analytical tabs are available. Each tab responds to the global year and country selection.')
    story.append(sp(4))
    story.append(data_table(
        ['No.', 'Tab Name', 'Purpose'],
        [
            ['01', 'Overview', 'World map + global trend line + annual snapshot'],
            ['02', 'Country', 'In-depth profile for the selected country'],
            ['03', 'Comparison', 'Multi-country parallel coordinates chart'],
            ['04', 'Evolution', 'Coverage type trends, strictness distribution, network graph'],
            ['05', 'Changes', 'Global legislative activity by year'],
            ['06', 'Sectors', 'Industry coverage heatmap and ranking'],
        ],
        [1.5*cm, 3.5*cm, 9.5*cm], S
    ))
    tbl_caption('Table 2 – The six analytical tabs')

    sub('Mobile Usage')
    bul([
        'On screens narrower than 768 px, the sidebar is hidden by default. Tap ☰ in the top-left corner to open it.',
        'Tap outside the sidebar (dark overlay) or the ✕ button to close it.',
        'Selecting a country automatically closes the sidebar.',
        'The tab bar becomes horizontally scrollable.',
        'All chart panels stack vertically.',
    ])

    sub('Keyboard Shortcuts')
    story.append(sp(4))
    story.append(data_table(
        ['Key', 'Action'],
        [
            ['[/]', 'Focus the global search box'],
            ['[Esc]', 'Close any open drawer'],
            ['[Enter] in search', 'Navigate to first result'],
            ['[↑] / [↓] in search', 'Move through results'],
        ],
        [5*cm, 9.5*cm], S
    ))
    tbl_caption('Table 3 – Keyboard shortcuts')

    # ── 3. TAB 01: OVERVIEW ─────────────────────────────────────────────────
    sec('Tab 01 — Overview')
    p('The Overview tab is the landing view and provides a global snapshot of FDI screening '
      'activity for the selected year.')

    sub('World Map')
    bul([
        ('Shading dimension', 'Each country is shaded by the selected dimension (chosen from the dropdown). Darker = higher value. Countries outside the active group filter are shown in light grey.'),
        ('Strictness Score (0–13)', 'Sum of all 13 procedural powers.'),
        ('Sectors Covered', 'Number of sectors under the screening mechanism.'),
        ('Review Threshold (%)', 'Minimum equity stake triggering a review.'),
        ('Review Timeframe (days)', 'Maximum statutory review period.'),
        ('Click interaction', 'Click any country to open a floating card with key indicators. Click "View Details →" to jump to that country\'s full profile.'),
        ('Zoom and pan', 'Scroll to zoom, drag to pan. Double-click to reset the view.'),
    ])

    sub('Global Trend Chart')
    bul([
        'The line chart tracks how many countries have a selected feature active each year, overlaid with a bar chart of new mechanisms established globally.',
        'Use the dropdown to change the tracked feature (e.g. National Security Test, Fines, Mitigation powers).',
        'Two vertical dashed lines mark 2019 (EU FDI Regulation impetus, blue) and 2020 (COVID-19 emergency legislation wave, orange).',
        'Click any year on the chart to jump the global year slider to that year.',
    ])

    sub('Annual Snapshot Panel')
    p('The right panel shows a summary for the currently active country set in the selected year:')
    bul([
        ('Countries with mechanism', 'How many of the filtered countries have an active screening regime.'),
        ('Average Strictness', 'Mean strictness score across all countries with mechanisms.'),
        ('Average Sectors Covered', 'Mean sector count across countries with mechanisms.'),
        ('New Mechanisms This Year', 'Globally, how many new mechanisms were established.'),
        ('Coverage Type Distribution', 'Horizontal bar chart showing how many countries fall into each coverage model.'),
    ])

    # ── 4. TAB 02: COUNTRY ──────────────────────────────────────────────────
    sec('Tab 02 — Country')
    p('The Country tab provides the most detailed view of a single country\'s FDI screening '
      'mechanism. Select a country from the sidebar list or by clicking the world map.')

    sub('Practitioner Summary Card')
    p('The top card is designed for quick practical reference and provides an at-a-glance '
      'assessment of filing obligations.')

    ssub('Status Badge')
    story.append(sp(4))
    story.append(data_table(
        ['Badge', 'Colour', 'Meaning'],
        [
            ['No mechanism', 'Grey', 'No active screening mechanism in the selected year'],
            ['Screening exists', 'Green', 'Mechanism exists but strictness score is low (0–3)'],
            ['Active screening', 'Amber', 'Moderate strictness score (4–7)'],
            ['Strict screening', 'Red-orange', 'High strictness score (8–13)'],
        ],
        [3.5*cm, 2.5*cm, 8.5*cm], S
    ))
    tbl_caption('Table 4 – Country status badge definitions')

    ssub('Filing Requirement Block')
    p('Shows the practical answer to "do I need to file?"')
    bul([
        ('Pre-approval required before closing', 'Mandatory pre-approval; the transaction cannot close without government sign-off.'),
        ('Notification mandatory', 'Filing is required but the transaction may proceed before a decision is received.'),
        ('No mandatory filing', 'Voluntary notification only, or no mechanism in the selected year.'),
        ('Threshold', 'The minimum equity stake (%) that triggers the review obligation.'),
        ('Max review time', 'The statutory maximum review period in days.'),
        ('Notification', 'The specific notification regime text from the source data.'),
    ])

    ssub('Review Authority Block')
    bul([
        ('Lead authority', 'The government agency that administers screening.'),
        ('Review criteria', 'The legal grounds on which investments may be blocked (national security, net economic benefit, competition, dual-use/export control).'),
        ('Strictness score', 'The count of all active procedural powers out of 13.'),
        ('Sectors in scope', 'The number of sectors covered by this mechanism.'),
    ])

    ssub('Scope & Powers Block')
    bul([
        'Whether greenfield investments (new establishments, not just acquisitions) are covered.',
        'Whether real estate transactions are covered.',
        'Whether the mechanism distinguishes between EU and non-EU investors.',
        'Feature pills: Formal call-in, Interagency review, Tiered authority, Mitigation powers, Fines/penalties, Golden share, EU vs. non-EU distinction.',
    ])

    ssub('Quick Deal Check Button')
    p('The ⚡ "Check a specific deal for this country" button pre-fills the Deal Screener '
      'with the currently selected country and opens it immediately.')

    sub('Multi-Dimensional Radar Chart')
    p('Plots the selected country on 8 procedural dimensions simultaneously, '
      'with two reference overlays:')
    bul([
        'Red-orange line — selected country in the current year.',
        'Grey dashed line — OECD average for the current year.',
        'Blue dotted line — selected country in a historical comparison year (choose from the "Compare [year]" dropdown).',
    ])
    p('<b>Radar dimensions:</b> NS Test, Formal Call-in, Fines, Mitigation, Interagency Review, '
      'Net Benefit Test, Enhanced Gov. Control, Ownership Review.')
    tip('Switch the comparison year to a specific year (e.g. 2015) to visualise how much '
        'a country\'s mechanism has tightened over time.', 'How to use the radar')

    sub('Key Indicators Panel')
    p('A structured list of all available data fields for the selected country and year: '
      'Lead Authority, Coverage Type, Notification regime, Pre-approval regime, Review Threshold, '
      'Review Timeframe, EU vs. non-EU difference, COVID-19 temporary legislation flag.')

    sub('Procedural Requirements & Coverage')
    p('A grid of 16 binary indicators grouped into four categories:')
    story.append(sp(4))
    story.append(data_table(
        ['Group', 'Indicators'],
        [
            ['Investigation & Review Powers', 'Formal Call-in, Increased Ownership Review, Interagency Review, Tiered Authority, Enhanced Gov. Control'],
            ['Tests & Standards', 'National Security Test, Net Benefit Test, Competition Test'],
            ['Sanctions & Mechanisms', 'Fines, Mitigation, Filing Fees, Local Representation, Co-location'],
            ['Coverage Scope', 'Greenfield, Real Estate, Export Control / Dual-Use'],
        ],
        [5*cm, 9.5*cm], S
    ))
    tbl_caption('Table 5 – Procedural indicators grouped by category')
    p('Each indicator is displayed as ✓ (present, green) or ✕ (absent, grey).')

    sub('Regulation Timeline')
    p('A horizontal bubble timeline showing every regulatory instrument recorded for the '
      'selected country:')
    bul([
        'Bubble size is proportional to the number of sectors covered by that regulation.',
        'Bubble colour reflects the coverage type of that regulation.',
        'Click any bubble to open a detail drawer showing: full regulation name, year signed/effective, lead authority, notification regime, threshold, timeframe, sectors covered, supersession information, policy text excerpt (if available), Summarize with AI button, and a link to download or view the original document.',
    ])

    # ── 5. TAB 03: COMPARISON ───────────────────────────────────────────────
    sec('Tab 03 — Comparison')
    p('The Comparison tab uses a parallel coordinates chart to visualise all active countries '
      'simultaneously across multiple dimensions.')

    sub('Reading the Chart')
    bul([
        'Each vertical axis represents one indicator.',
        'Each coloured line represents one country in the selected year.',
        'Where a line sits on each axis indicates that country\'s value for that indicator.',
        'Countries with no mechanism are excluded from the chart.',
    ])
    p('<b>Axes displayed:</b> Mechanisms count, Strictness score, Sectors covered, '
      'Threshold %, Timeframe (days), Fines (Yes/No), Mitigation (Yes/No), '
      'Interagency review (Yes/No), National Security Test (Yes/No), Net Benefit Test (Yes/No).')

    sub('Interactions')
    bul([
        ('Drag along any axis', 'Create a filter range; only lines passing through the selection remain highlighted. For example, find all countries with threshold below 25% and an active NS test.'),
        ('Hover over a line', 'Highlight it and see a tooltip with all values.'),
        ('Click a line', 'Jump to that country\'s full profile in the Country tab.'),
        ('Color toggle', 'Switch between group-based and strictness-gradient colouring.'),
    ])
    tip('Select a target country and drag the Strictness axis to its value. Remaining '
        'highlighted countries have similar strictness — useful for identifying '
        'jurisdictions with comparable compliance burdens.', 'Typical use case')

    # ── 6. TAB 04: EVOLUTION ────────────────────────────────────────────────
    sec('Tab 04 — Evolution')
    p('The Evolution tab contains five charts that together illustrate how FDI screening '
      'regimes have changed structurally over time.')

    sub('Coverage Type Distribution (Pie Chart)')
    p('A pie chart for the currently selected year showing how many countries fall into '
      'each coverage model:')
    bul([
        'Sectoral — only specific industries are covered.',
        'Cross-sectoral — all sectors are potentially in scope.',
        'Mixed — a combination of broad and sector-specific rules.',
        'Asset-based — screening is triggered by asset type, not sector.',
        'Draft — legislation has been proposed but not yet enacted.',
        'Passed (not impl.) — law passed but implementing regulations not yet in force.',
    ])
    p('Click any segment to open a drawer listing all countries of that type in the selected year.')

    sub('Notification × Pre-approval Matrix (Bubble Chart)')
    p('A 3×3 matrix plotting countries on two procedural axes:')
    bul([
        'X-axis (Notification): Not mandatory · Mandatory (some transactions) · Mandatory (all transactions)',
        'Y-axis (Pre-approval): Not mandatory · Mandatory (some) · Mandatory (all)',
        'Bubble size reflects the number of countries at that combination.',
        'Click any bubble to see the list of countries with that combination.',
    ])

    sub('Coverage Type Evolution (Area Chart)')
    p('A stacked area chart showing, for each year from 2007 to 2023, how many countries '
      'operate each coverage model. Read this chart to observe the structural shift from '
      'Sectoral to Cross-sectoral mechanisms that accelerated markedly after 2019.')

    sub('Strictness Distribution Over Time (Band Chart)')
    p('Plots the mean strictness score per year as a line, surrounded by a band showing '
      'the minimum and maximum values. The widening band reflects growing divergence '
      'between the strictest and most lenient jurisdictions over time.')

    sub('Threshold vs. Strictness / Timeframe vs. Strictness (Scatter Chart)')
    bul([
        'X-axis — Review threshold (%) or Review timeframe (days), switchable via the Threshold/Timeframe toggle.',
        'Y-axis — Strictness score (0–13).',
        'Each point represents one country. Click to navigate to that country\'s profile.',
        'Countries in the top-left (high strictness, low threshold or short timeframe) impose the most demanding practical burden on investors.',
    ])

    sub('Regulation Supersession Network')
    bul([
        'Nodes are individual regulations, coloured by country group.',
        'Directed edges point from an old law to the new law that superseded it.',
        'Clusters of connected nodes represent a country\'s legislative lineage.',
        'Click any node to navigate to that country\'s profile.',
    ])

    # ── 7. TAB 05: CHANGES ──────────────────────────────────────────────────
    sec('Tab 05 — Changes')
    p('The Changes tab focuses on legislative activity — what happened, and when. '
      'It is the primary tool for tracking the pace and nature of regulatory change globally.')

    sub('Global Legislative Activity Bar Chart')
    p('A stacked bar chart showing, for each year, how many legislative events occurred '
      'globally, broken down by type:')
    bul([
        'New Law — an entirely new statute creating a screening mechanism.',
        'Amendment — modifications to an existing law.',
        'Exec. Order — presidential/executive orders or emergency decrees.',
        'Reg. Impl. — implementing regulations under a previously enacted law.',
    ])
    p('<b>Key interaction:</b> Click any bar to select that year. The event list below '
      'updates to show all events for that year, <i>and the global year slider synchronises '
      'to the clicked year</i> — so switching to Country or Overview will show data for '
      'that year automatically.')

    sub('Legislative Events List')
    p('Each event card shows:')
    bul([
        'Year and country.',
        'Law name or reference (bare reference numbers like "34/2020" are labelled as "Reference:" to indicate the full name was not available in source data).',
        'Brief explanation of what changed (if available).',
        'Event type chips: New Law, Amendment, Exec. Order, or Implementation.',
        'A "Supersedes" chip if this legislation replaced an earlier instrument.',
    ])
    p('Click any event card to open a detail drawer with: matched mechanism data, '
      'policy text excerpt with full regulation text, a "View [Country] details" button, '
      'and a "Summarize with AI" option.')

    # ── 8. TAB 06: SECTORS ──────────────────────────────────────────────────
    sec('Tab 06 — Sectors')
    p('The Sectors tab analyses which industries are covered by FDI screening '
      'across countries and over time.')

    sub('Sector Coverage Heatmap')
    bul([
        'Rows — individual sectors (or 8 aggregate categories, switchable).',
        'Columns — countries, sorted by total sector coverage (most covered first).',
        'Cell colour — dark = sector is covered; light = not covered.',
        'Detailed Sectors mode — shows all 36 individual sector names.',
        '8 Aggregate Categories mode — shows coverage as a percentage (0–100%) for each broad category, with gradient colour.',
    ])

    sub('Sector Coverage Ranking (Bar Chart)')
    p('A horizontal bar chart ranking all sectors by the number of countries that '
      'include them in their screening mechanism. Sectors covered by more countries '
      'appear at the top.')
    bul([
        'The chart reflects the currently selected year.',
        'Click ▶ Play to animate through all years, watching the ranking evolve as new sectors are added to national mechanisms.',
        'Click ❚❚ Pause to stop. Switching to a different tab automatically stops the animation.',
    ])

    story.append(sp(4))
    story.append(data_table(
        ['Category', 'Typical sub-sectors'],
        [
            ['Defense', 'Defense production, controlled dual-use, export control'],
            ['Physical Critical Infrastructure', 'Energy, water, transport, healthcare, telecom'],
            ['Next-Gen Critical Infrastructure', 'Space, advanced computing, quantum, AI'],
            ['Critical Tech & Dual-Use', 'Cybersecurity, robotics, biotechnology, advanced materials'],
            ['Non-tradeable Services', 'Gambling, tourism, education, civil nuclear'],
            ['Finance', 'Banking, insurance, payments'],
            ['Media', 'Broadcasting, news, publishing'],
            ['Sensitive Personal Data', 'Access to personal data, brain-computer interfaces'],
        ],
        [5*cm, 9.5*cm], S
    ))
    tbl_caption('Table 6 – The 8 aggregate sector categories')

    # ── 9. DEAL SCREENER ────────────────────────────────────────────────────
    sec('Deal Screener')
    p('The Deal Screener answers the practical question: <b>"Is this transaction likely '
      'to require filing?"</b> It analyses a proposed investment against the PRISM data '
      'for the target country and selected year.')
    tip('Open via ⚡ Check Deal in the top bar, or via the ⚡ "Check a specific deal" '
        'button on any country\'s profile card.', 'How to open')

    sub('Input Fields')
    story.append(sp(4))
    story.append(data_table(
        ['Field', 'Description'],
        [
            ['Target Country', 'The country in which the investment target is located.'],
            ['Sector / Industry', 'Choose from 8 broad categories or 36 detailed sectors. Leave blank if sector is unknown.'],
            ['Acquisition Stake (%)', 'The equity percentage the investor intends to acquire. Leave blank if unknown.'],
            ['Your Country', 'The investor\'s home country. Used to determine EU/EEA status where the mechanism distinguishes between EU and non-EU investors.'],
        ],
        [4*cm, 10.5*cm], S
    ))
    tbl_caption('Table 7 – Deal Screener input fields')

    sub('Verdict Levels')
    story.append(sp(4))
    story.append(data_table(
        ['Verdict', 'Colour', 'Meaning'],
        [
            ['Review likely required', 'Red-orange', 'Sector covered, stake at or above threshold, mandatory pre-approval active'],
            ['Review may apply', 'Amber', 'Some factors suggest filing may be required; certainty is limited'],
            ['Below threshold', 'Green', 'Proposed stake appears below the recorded threshold for this country'],
            ['Sector out of scope', 'Green', 'Selected sector does not appear to be covered by the mechanism'],
            ['No mechanism', 'Grey', 'No active formal screening mechanism in the selected year'],
        ],
        [3.5*cm, 2.5*cm, 8.5*cm], S
    ))
    tbl_caption('Table 8 – Deal Screener verdict levels')

    p('The verdict is accompanied by a plain-language explanation covering: coverage scope, '
      'threshold comparison, filing obligation type, EU/non-EU distinction (if applicable), '
      'maximum review period, and lead authority. A "View full [Country] profile" button '
      'allows immediate navigation to the Country tab for deeper review.')

    warn('The Deal Screener provides an indicative, automated assessment based on publicly '
         'available data in the PRISM database. It does not constitute legal advice. '
         'Always consult the relevant national authority or qualified legal counsel before '
         'proceeding with any transaction.')

    # ── 10. AI ASSISTANT ────────────────────────────────────────────────────
    sec('AI Data Assistant')
    p('The AI Assistant allows natural-language questions about the PRISM data. '
      'It is context-aware and knows the currently selected year, country, active '
      'group filter, and tab.')
    tip('Click Ask AI in the top bar to open.', 'How to open')

    sub('Capabilities')
    bul([
        'Compare mechanisms across countries ("How does Germany\'s screening compare to France\'s in 2022?").',
        'Identify trends ("Which countries tightened their mechanisms most after 2019?").',
        'Explain data fields ("What does the Net Benefit Test mean?").',
        'List countries with specific features ("Which countries cover the AI sector in 2023?").',
        'Summarise individual regulations via the "Summarize with AI →" button in any policy document drawer.',
    ])

    sub('Quick Prompts (Chips)')
    p('The assistant pre-generates 3–4 context-relevant prompt suggestions based on the '
      'current tab and selected country. Click any chip to send it immediately without '
      'typing.')

    sub('Configuration')
    p('Click the ⚙ icon to configure the AI backend:')
    bul([
        ('Provider', 'Anthropic (Claude), OpenAI, DeepSeek, MiniMax, Zhipu GLM, Moonshot Kimi, or any custom OpenAI-compatible endpoint.'),
        ('Model', 'Pre-populated with recommended models per provider; can be overridden manually.'),
        ('Base URL', 'Required only for custom providers.'),
        ('API Key', 'Stored in browser local storage; never transmitted anywhere except directly to the selected provider\'s API endpoint.'),
    ])
    tip('Press [Enter] to send a message. Use [Shift+Enter] for a line break within '
        'the input box.', 'Keyboard shortcut')

    sub('Limitations')
    bul([
        'The assistant\'s answers are based on the data context injected at query time, not real-time web access.',
        'For quantitative questions, the assistant receives the top-8 strictness ranking, the selected country\'s full profile, and any sector coverage lists mentioned in the query.',
        'Responses are capped at approximately 250 words (longer for comparison lists).',
        'The quality of answers depends on the selected AI provider and model.',
    ])

    # ── 11. GLOBAL SEARCH ───────────────────────────────────────────────────
    sec('Global Search')
    p('The search box in the top bar supports three search modes, toggled by the '
      'Countries / Regulations / Policy selector at the top of the results panel.')
    story.append(sp(4))
    story.append(data_table(
        ['Mode', 'What it searches'],
        [
            ['Countries', 'Country names; clicking a result selects that country and opens the Country tab.'],
            ['Regulations', 'Regulation titles and country names from the events database.'],
            ['Policy text', 'Full-text search across all 141 policy documents; matching passages are highlighted in amber.'],
        ],
        [3*cm, 11.5*cm], S
    ))
    tbl_caption('Table 9 – Search modes')
    bul([
        'Policy text results open a detail drawer with the matched excerpt highlighted and a link to download or view the original document.',
        'Press [↑]/[↓] to navigate results, [Enter] to select, [Esc] to close.',
    ])

    # ── 12. URL SHARING ─────────────────────────────────────────────────────
    sec('URL Sharing')
    p('PRISM automatically keeps the browser URL in sync with the current state. '
      'Copy the URL at any time to create a shareable link that restores the exact '
      'same view for another user.')
    story.append(sp(4))
    url_tbl = Table([[Paragraph(
        'https://jonebroom.github.io/prism-fdi/?tab=country&amp;country=Germany&amp;year=2021',
        ParagraphStyle('url', parent=S['Code'], fontSize=9))
    ]], colWidths=[14.5*cm])
    url_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_PAPER),
        ('BOX', (0,0), (-1,-1), 0.5, C_LINE),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(url_tbl)
    story.append(sp(6))
    bul([
        ('tab', 'The active tab name (overview, country, compare, evolution, changes, sectors).'),
        ('country', 'The selected country (exact English name as used in the data, e.g. "United States", "Republic of Korea").'),
        ('year', 'The selected year (2007–2023).'),
    ])

    # ── 13. DATA FIELDS REFERENCE ───────────────────────────────────────────
    sec('Data Fields Reference')

    sub('Quantitative Fields')
    story.append(sp(4))
    story.append(data_table(
        ['Field', 'Type', 'Definition'],
        [
            ['num_mechanisms', 'Integer', 'Number of distinct screening instruments active in this country-year'],
            ['strictness', '0–13', 'Sum of all 13 binary procedural indicators'],
            ['threshold', '% (0–100)', 'Minimum equity acquisition percentage triggering a mandatory review'],
            ['time_frame_days', 'Days', 'Statutory maximum review period at the initial review stage'],
            ['total_sectors', 'Integer', 'Number of sectors explicitly covered by the screening mechanism'],
        ],
        [3.5*cm, 2*cm, 9*cm], S
    ))
    tbl_caption('Table 10 – Quantitative data fields')

    sub('The 13 Procedural Power Indicators')
    p('Each is a binary (0/1) variable coded from official legislation and regulatory guidance. '
      'The sum of all 13 constitutes the Strictness Score.')
    story.append(sp(4))
    story.append(data_table(
        ['Indicator', 'Meaning'],
        [
            ['Formal Call-in', 'Authority can initiate a review on its own motion, without a filing by the investor'],
            ['Increased Ownership Review', 'Subsequent increases in stake above the threshold also require a new review'],
            ['Filing Fees', 'Mandatory fees are charged when submitting a filing'],
            ['Mitigation', 'Authority can impose conditions (remedies) short of full prohibition'],
            ['Fines', 'Monetary penalties can be imposed for non-compliance or violations'],
            ['National Security Test', 'Explicit national security standard in the statutory review criteria'],
            ['Net Benefit Test', 'Economic benefit to the host country is a review criterion'],
            ['Competition Test', 'Effects on market competition are a review criterion'],
            ['Interagency Review', 'Multiple government agencies participate in the review process'],
            ['Tiered Authority', 'Different authorities have jurisdiction depending on sector or deal size'],
            ['Local Representation', 'Acquirer must appoint a local representative or board member post-acquisition'],
            ['Enhanced Gov. Control', 'Government retains a special share or veto right post-approval'],
            ['Co-location', 'Physical infrastructure must be co-located in the host country'],
        ],
        [4.5*cm, 10*cm], S
    ))
    tbl_caption('Table 11 – The 13 procedural power indicators')

    sub('Coverage Type Classification')
    story.append(sp(4))
    story.append(data_table(
        ['Type', 'Definition'],
        [
            ['Sectoral', 'Review is limited to investments in explicitly listed sectors; investments in other sectors are not subject to screening'],
            ['Cross-sectoral', 'All sectors potentially subject to review; broadest scope'],
            ['Mixed', 'Combines mandatory sectoral rules with a discretionary broader review power'],
            ['Asset-based', 'Triggered by the nature of the asset (e.g. critical infrastructure) rather than the sector label'],
            ['Draft', 'Legislation introduced in parliament but not yet enacted into law'],
            ['Passed (not implemented)', 'Law enacted; implementing regulations or effective date not yet in force'],
        ],
        [4*cm, 10.5*cm], S
    ))
    tbl_caption('Table 12 – Coverage type classification')

    sub('Notification and Pre-approval Regimes')
    p('Both the Notification and Pre-approval fields use the same three-level vocabulary:')
    bul([
        'Not mandatory — no formal filing obligation; voluntary submission only.',
        'Mandatory (some) — filing required for transactions meeting specific criteria (sector, threshold, or investor origin).',
        'Mandatory (all) — filing required for all foreign investments above a de minimis level.',
    ])

    # ── 14. FAQ ─────────────────────────────────────────────────────────────
    sec('Frequently Asked Questions')

    faqs = [
        ('Why does a country appear on the map but show "No mechanism" in the Country tab?',
         'The map shows all 38 countries in the dataset. A country will show no mechanism if: (a) the selected year predates when its mechanism was established, or (b) the country has never established a formal screening regime. Use the year slider to check earlier or later years.'),
        ('The threshold field shows "—". What does that mean?',
         'Either the country\'s mechanism applies to all foreign investments without a specific equity threshold, the threshold is defined in subsidiary regulations not captured at this data level, or the information was not available in public sources at time of coding.'),
        ('Why are some regulation names shown as "Reference: 34/2020" instead of a full title?',
         'Some source datasets recorded only the legal reference number (e.g. an act number and year) without the full descriptive title. These are flagged automatically with the "Reference:" prefix to indicate that the name is a bare citation, not a descriptive title.'),
        ('How does the Strictness Score work?',
         'Strictness is the simple sum of the 13 binary procedural power indicators. A country with all 13 powers active scores 13; a country with only an NS test and fines scores 2. It is a measure of procedural complexity, not a measure of how often reviews result in prohibition.'),
        ('Can I export the data?',
         'The platform does not currently include a built-in export function. For research use of the underlying dataset, please contact the dataset creators through the platform website.'),
        ('The AI assistant says it cannot answer my question. Why?',
         'The assistant only uses data available in PRISM. Questions requiring information outside the 38-country, 2007–2023 scope, or requiring real-time legal advice, will receive a disclaimer. Ensure your API key and provider are correctly configured in the ⚙ settings.'),
        ('Is the Deal Screener output legally reliable?',
         'No. It provides an indicative, automated assessment based on coded data. FDI screening obligations depend on transaction-specific facts, regulatory interpretation, and guidance that changes frequently. Always verify with the relevant national authority and qualified legal counsel.'),
        ('Why does the map show a country in grey even though the group filter includes it?',
         'Grey shading indicates either: (a) the country has no mechanism in the selected year, or (b) the selected map dimension has no data for that country-year (e.g. threshold data is missing). Hover over the country for a tooltip explaining what data is available.'),
        ('The URL I shared opens in a different state than expected. Why?',
         'URL restoration requires the target country name to match exactly (e.g. "United States", "Republic of Korea"). If the URL was created with a year outside 2007–2023, the year will be clamped to the nearest valid value.'),
        ('What is the difference between "year signed" and "year effective" in the Regulation Timeline?',
         '"Year signed" is when the legislation was formally enacted or signed into law. "Year effective" is when it came into operational force (which may differ if there was a transition period). Both are shown in the regulation detail drawer.'),
    ]

    for i, (q, a) in enumerate(faqs, 1):
        story.append(KeepTogether([
            Paragraph(f'Q{i}. {q}',
                     ParagraphStyle('FQ', parent=S['H3'], textColor=C_BLUE,
                                    spaceBefore=10, spaceAfter=3)),
            Paragraph(a, S['Normal']),
        ]))

    # ── 15. DATA SOURCES & METHODOLOGY ──────────────────────────────────────
    sec('Data Sources and Methodology')

    sub('Primary Data Source')
    p('The platform is built on the <b>PRISM ISM Dataset</b> (version 2023.12), a structured '
      'database of FDI screening mechanisms compiled from official government sources, '
      'legislative databases, and academic literature.')

    sub('Coding Methodology')
    bul([
        'Binary indicators are coded 1 if the feature is explicitly present in operative legislation and 0 otherwise. Ambiguous cases are coded 0 (conservative approach).',
        'Threshold values reflect the lowest applicable threshold where tiered thresholds exist.',
        'Timeframe values reflect the maximum statutory review period at the initial stage, not including possible extension periods.',
        'Coverage type reflects the primary operative mechanism where multiple instruments co-exist.',
    ])

    sub('Known Limitations')
    bul([
        'Sub-national and sector-specific lower thresholds may not be fully captured by the single threshold field.',
        'Emergency and temporary legislation (including COVID-19 measures) is flagged where identified but may be inconsistently recorded across jurisdictions.',
        'A small number of historical records (pre-2007) are included for countries with long legislative lineages but are not part of the main analytical time series.',
        'Policy document full texts are sourced from publicly available HTML and PDF versions; formatting artefacts from PDF extraction may appear in the text viewer.',
    ])

    # ── 16. QUICK REFERENCE ─────────────────────────────────────────────────
    sec('Quick Reference Card')

    qr_data = [
        ['Action', 'How to do it'],
        ['Open country profile', 'Click country in sidebar list, or click map → View Details'],
        ['Filter by group', 'Toggle OECD / EU/EEA / Five Eyes buttons in the rail'],
        ['Change year', 'Drag the year slider, or click a year on any time-series chart'],
        ['Animate over time', 'Click ▶ Play Timeline (stops automatically on tab switch)'],
        ['Check a deal', '⚡ Check Deal → fill country, sector, stake, origin → Check'],
        ['Ask a question', 'Ask AI → type question or click a chip prompt'],
        ['Find a regulation', 'Press [/] → switch to Policy mode → type keywords'],
        ['Share a view', 'Copy the URL from the browser address bar'],
        ['View policy text', 'Click any regulation bubble or event card → text in drawer'],
        ['Compare years (radar)', 'Country tab → radar chart → select "Compare [year]" dropdown'],
        ['See countries of a type', 'Evolution tab → click Coverage Type pie segment'],
        ['Filter parallel chart', 'Comparison tab → drag along any vertical axis'],
    ]

    qr_table = Table(
        [[Paragraph(c if i == 0 else c, S['TableHead'] if i == 0 else
                   (S['TableCell'] if j > 0 else ParagraphStyle('QRK', parent=S['TableCell'],
                    fontName='Helvetica-Bold', textColor=C_BLUE)))
          for j, c in enumerate(row)]
         for i, row in enumerate(qr_data)],
        colWidths=[5.5*cm, 9*cm]
    )
    qr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_INK),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, C_PAPER]),
        ('GRID', (0,0), (-1,-1), 0.4, C_LINE),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(qr_table)
    tbl_caption('Table 13 – Quick reference for common actions')

    story.append(sp(20))
    story.append(hr(C_LINE, 0.8))
    story.append(sp(6))
    story.append(Paragraph(
        'PRISM ISM Database &nbsp;·&nbsp; https://jonebroom.github.io/prism-fdi/<br/>'
        'Data: PRISM ISM Dataset v2023.12 &nbsp;·&nbsp; 38 countries &nbsp;·&nbsp; 2007–2023',
        ParagraphStyle('foot', parent=S['Normal'], alignment=TA_CENTER,
                       textColor=C_FAINT, fontSize=9)))

    return story


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, 'PRISM_User_Manual.pdf')

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title='PRISM ISM Database — User Manual',
        author='PRISM Platform',
        subject='FDI Screening Mechanism Data Platform User Guide',
    )

    styles = make_styles()
    story = build_story(styles)
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f'OK PDF generated: {out_path}')
