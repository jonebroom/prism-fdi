"""
unbundle.py — 将 index.html 从 bundler 模式转换为直接加载模式
生成新的 index.html，不再需要 unpacking 步骤
"""
from pathlib import Path
import re

BASE_DIR = Path(__file__).parent
TEMPLATE_PATH = BASE_DIR / "js" / "template.html"
HTML_PATH = BASE_DIR / "index.html"

UUID_TO_SCRIPT = {
    "74c6b04d-7b3e-47e4-b94c-4624d4d1f9fa": None,  # ECharts → CDN
    "22c67aad-9479-4879-8b1e-6b8df940e6b4": None,  # Fuse.js → CDN
    "20fcc60b-425a-4554-9b7c-bfd826df118a": "js/js/state.js",
    "d8f1a2b3-c4e5-4678-9abc-def012345678": "js/js/i18n.js",
    "a253b5ef-0579-413e-89b9-92bf0571eda6": "js/js/ui.js",
    "13e37cb5-088d-4188-911d-8d14ce59f712": "js/js/tab_overview.js",
    "f6ffb756-4b8d-465d-b9c8-e3c66627e344": "js/js/tab_country.js",
    "3ede55b6-a75e-4dfb-b9ad-3aa7923c8de5": "js/js/tab_compare.js",
    "e3b79dc0-fcea-4c89-b4b5-e2b2b8a0b983": "js/js/tab_evolution.js",
    "363f401a-3c1b-486b-b12b-a4c1d1b69a72": "js/js/tab_changes.js",
    "93fca39a-560d-41a2-9a1b-0c7e2799da93": "js/js/tab_sectors.js",
    "94efe1a4-1cbf-4603-b26c-2088068bf595": "js/js/search.js",
    "88352e4e-025f-44e3-b07f-bda43a3a7ed6": "js/js/ai.js",
    "e20255b8-0cf8-4163-8ac8-05f169ce4b93": "js/js/main.js",
    "b1c2d3e4-f5a6-7890-abcd-ef1234567890": "js/js/screener.js",
}

CDN_SCRIPTS = [
    '<script src="https://fastly.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>',
    '<script src="https://fastly.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>',
]

GOOGLE_FONTS_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">'

RESOURCES_SCRIPT = """<script>
window.__resources = {
  timeseries: 'data/timeseries.json',
  events:     'data/events.json',
  changes:    'data/changes.json',
  yearly:     'data/yearly_new.json',
  countries:  'data/countries.json',
  policy:     'data/policy_texts.json',
  search:     'data/search_index.json',
  worldmap:   'data/world.json'
};
</script>"""

def main():
    template = TEMPLATE_PATH.read_text(encoding='utf-8')
    lines = template.split('\n')

    # Find where @font-face blocks end (line 635 = ":root{")
    font_end = 0
    for i, line in enumerate(lines):
        if line.strip().startswith(':root{') or line.strip().startswith(':root '):
            font_end = i
            break

    # Reconstruct: head with Google Fonts instead of @font-face blocks
    head_before_fonts = '\n'.join(lines[:18])  # up to first @font-face
    css_without_fonts = '\n'.join(lines[font_end:])  # from :root{ onward

    # Replace UUID script srcs with actual paths
    def replace_script(m):
        uuid = m.group(1)
        if uuid in UUID_TO_SCRIPT:
            path = UUID_TO_SCRIPT[uuid]
            if path is None:
                return ''  # remove, will add CDN scripts separately
            return f'<script src="{path}"></script>'
        return m.group(0)

    css_without_fonts = re.sub(
        r'<script src="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"></script>',
        replace_script,
        css_without_fonts
    )

    css_block = '\n'.join(lines[font_end:1200])
    body_block = '\n'.join(lines[1202:1543])
    cdn_block = '\n'.join(CDN_SCRIPTS)
    scripts_block = '\n'.join(lines[1543:1559])

    # Build the new HTML
    new_html = (
        "<!DOCTYPE html>\n"
        "<html lang=\"en\"><head>\n"
        "<meta charset=\"UTF-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        "<title>PRISM · FDI Screening Mechanism Data Platform</title>\n"
        + GOOGLE_FONTS_LINK + "\n"
        "<style>\n" + css_block + "\n</style>\n"
        "</head>\n<body>\n"
        + body_block + "\n"
        + RESOURCES_SCRIPT + "\n"
        + cdn_block + "\n"
        + scripts_block + "\n"
        "</body></html>"
    )

    HTML_PATH.write_text(new_html, encoding='utf-8')
    size_kb = HTML_PATH.stat().st_size / 1024
    print(f"完成！新 index.html 已生成 ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
