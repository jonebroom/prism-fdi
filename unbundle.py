"""
unbundle.py — 生成直接加载版 index.html
核心数据内嵌为 JSON，无需额外 HTTP 请求，GitHub Pages gzip 后约 300KB
"""
import json
import re
from pathlib import Path

BASE_DIR      = Path(__file__).parent
TEMPLATE_PATH = BASE_DIR / "js" / "template.html"
JS_DIR        = BASE_DIR / "js" / "js"
DATA_DIR      = BASE_DIR / "data"
HTML_PATH     = BASE_DIR / "index.html"

# UUID → 本地 JS 文件（None = 改用 CDN）
UUID_TO_SCRIPT = {
    "74c6b04d-7b3e-47e4-b94c-4624d4d1f9fa": None,   # ECharts → CDN
    "22c67aad-9479-4879-8b1e-6b8df940e6b4": None,   # Fuse.js → CDN
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

# 内嵌到 HTML 的核心数据（首屏必需）
INLINE_DATA_FILES = {
    "timeseries": "timeseries.json",
    "events":     "events.json",
    "changes":    "changes.json",
    "yearly":     "yearly_new.json",
    "countries":  "countries.json",
}

GOOGLE_FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" media="print" onload="this.media=\'all\'" '
    'href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600'
    '&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap">\n'
    '<noscript><link rel="stylesheet" '
    'href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600'
    '&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap"></noscript>'
)

CDN_SCRIPTS = (
    '<script src="js/lib/echarts.min.js"></script>\n'
    '<script src="js/lib/fuse.min.js"></script>'
)

def build_inline_data():
    parts = ["<script>window.__PRISM_DATA = {"]
    items = []
    for key, filename in INLINE_DATA_FILES.items():
        path = DATA_DIR / filename
        raw = path.read_text(encoding="utf-8")
        items.append(f'"{key}":{raw}')
        print(f"  内嵌 {filename} ({len(raw)//1024} KB)")
    parts.append(",\n".join(items))
    parts.append("};</script>")
    return "\n".join(parts)

def main():
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    lines = template.split("\n")

    # 找到 @font-face 结束位置（:root{ 开始处）
    font_end = next(i for i, l in enumerate(lines)
                    if l.strip().startswith(":root{") or l.strip().startswith(":root "))

    css_block     = "\n".join(lines[font_end:1200])
    body_block    = "\n".join(lines[1202:1543])
    scripts_block = "\n".join(lines[1543:1559])

    # 替换 UUID script src → 真实路径
    def replace_script(m):
        uuid = m.group(1)
        if uuid not in UUID_TO_SCRIPT:
            return m.group(0)
        path = UUID_TO_SCRIPT[uuid]
        return f'<script src="{path}"></script>' if path else ""

    scripts_block = re.sub(
        r'<script src="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"></script>',
        replace_script, scripts_block
    )

    print("读取并内嵌核心数据...")
    inline_data = build_inline_data()

    new_html = (
        "<!DOCTYPE html>\n"
        "<html lang=\"en\"><head>\n"
        "<meta charset=\"UTF-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        "<title>PRISM · FDI Screening Mechanism Data Platform</title>\n"
        + GOOGLE_FONTS + "\n"
        "<style>\n" + css_block + "\n</style>\n"
        "</head>\n<body>\n"
        + body_block + "\n"
        + inline_data + "\n"
        + CDN_SCRIPTS + "\n"
        + scripts_block + "\n"
        "</body></html>"
    )

    HTML_PATH.write_text(new_html, encoding="utf-8")
    size_kb = HTML_PATH.stat().st_size / 1024
    print(f"\n完成！index.html = {size_kb:.0f} KB（gzip 后约 {size_kb*0.15:.0f}–{size_kb*0.2:.0f} KB）")

if __name__ == "__main__":
    main()
