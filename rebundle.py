"""
rebundle.py — 将 data/ 和 js/ 下更新后的文件重新打包进 index.html

原理：
  index.html 的 manifest 里每个 UUID 对应一段 base64(gzip(文件内容))
  ext_resources 列表将逻辑 id（timeseries/events/...）映射到 UUID
  JS 文件的 UUID 通过固定映射表确定（从 manifest 内容注释识别）
"""

import json
import re
import gzip
import base64
from pathlib import Path

BASE_DIR      = Path(__file__).parent
DATA_DIR      = BASE_DIR / "data"
JS_DIR        = BASE_DIR / "js" / "js"
TEMPLATE_PATH = BASE_DIR / "js" / "template.html"
HTML_PATH     = BASE_DIR / "index.html"

# JS 文件 UUID → 源文件名（固定映射，从 manifest 注释内容识别）
JS_UUID_TO_FILE = {
    "13e37cb5-088d-4188-911d-8d14ce59f712": "tab_overview.js",
    "20fcc60b-425a-4554-9b7c-bfd826df118a": "state.js",
    "a253b5ef-0579-413e-89b9-92bf0571eda6": "ui.js",
    "f6ffb756-4b8d-465d-b9c8-e3c66627e344": "tab_country.js",
    "e3b79dc0-fcea-4c89-b4b5-e2b2b8a0b983": "tab_evolution.js",
    "363f401a-3c1b-486b-b12b-a4c1d1b69a72": "tab_changes.js",
    "3ede55b6-a75e-4dfb-b9ad-3aa7923c8de5": "tab_compare.js",
    "88352e4e-025f-44e3-b07f-bda43a3a7ed6": "ai.js",
    "94efe1a4-1cbf-4603-b26c-2088068bf595": "search.js",
    "93fca39a-560d-41a2-9a1b-0c7e2799da93": "tab_sectors.js",
    "e20255b8-0cf8-4163-8ac8-05f169ce4b93": "main.js",
    "b1c2d3e4-f5a6-7890-abcd-ef1234567890": "screener.js",
}

# ext_resources id → data/ 文件名
ID_TO_FILE = {
    "timeseries": "timeseries.json",
    "events":     "events.json",
    "changes":    "changes.json",
    "yearly":     "yearly_new.json",
    "countries":  "countries.json",
    "policy":     "policy_texts.json",
    "search":     "search_index.json",
}

def encode_file(path: Path) -> str:
    """读取文件 → gzip 压缩 → base64 编码"""
    raw = path.read_bytes()
    compressed = gzip.compress(raw, compresslevel=9)
    return base64.b64encode(compressed).decode("ascii")

def main():
    print("读取 index.html ...")
    content = HTML_PATH.read_text(encoding="utf-8")

    # 解析 ext_resources：id → uuid
    ext_match = re.search(
        r'<script type="__bundler/ext_resources">\s*(.*?)\s*</script>',
        content, re.DOTALL
    )
    if not ext_match:
        print("ERROR: 找不到 __bundler/ext_resources")
        return
    ext_resources = json.loads(ext_match.group(1))
    id_to_uuid = {r["id"]: r["uuid"] for r in ext_resources}

    # 解析 manifest
    manifest_match = re.search(
        r'<script type="__bundler/manifest">(.*?)</script>',
        content, re.DOTALL
    )
    if not manifest_match:
        print("ERROR: 找不到 __bundler/manifest")
        return
    manifest = json.loads(manifest_match.group(1))

    # 逐个替换数据文件
    updated = []
    for res_id, filename in ID_TO_FILE.items():
        uuid = id_to_uuid.get(res_id)
        if not uuid:
            print(f"  SKIP {res_id}: 未在 ext_resources 中找到")
            continue
        if uuid not in manifest:
            print(f"  SKIP {res_id}: UUID {uuid} 不在 manifest 中")
            continue

        data_path = DATA_DIR / filename
        if not data_path.exists():
            print(f"  SKIP {res_id}: {filename} 不存在")
            continue

        old_len = len(manifest[uuid].get("data", ""))
        new_data = encode_file(data_path)
        manifest[uuid]["data"] = new_data
        manifest[uuid]["compressed"] = True
        print(f"  OK {res_id:12s} ({filename}) "
              f"{old_len//1024}KB → {len(new_data)//1024}KB")
        updated.append(res_id)

    # 更新 JS 文件
    js_updated = []
    if JS_DIR.exists():
        print("更新 JS 源文件 ...")
        for uuid, filename in JS_UUID_TO_FILE.items():
            js_path = JS_DIR / filename
            if not js_path.exists():
                print(f"  SKIP {filename}: 文件不存在")
                continue
            if uuid not in manifest:
                manifest[uuid] = {"type": "text/javascript", "compressed": True, "data": ""}
                print(f"  NEW {filename}: created manifest entry")
            old_len = len(manifest[uuid].get("data", ""))
            new_data = encode_file(js_path)
            manifest[uuid]["data"] = new_data
            manifest[uuid]["compressed"] = True
            print(f"  OK {filename:20s} {old_len//1024}KB → {len(new_data)//1024}KB")
            js_updated.append(filename)

    if not updated and not js_updated:
        print("没有任何文件被更新，退出")
        return

    # 序列化新 manifest（紧凑格式，保持单行）
    new_manifest_json = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))

    # 替换 HTML 中的 manifest 内容
    new_content = content[:manifest_match.start(1)] + new_manifest_json + content[manifest_match.end(1):]

    # 更新 HTML template（若 js/template.html 存在）
    if TEMPLATE_PATH.exists():
        template_html = TEMPLATE_PATH.read_text(encoding="utf-8")
        inner_json = json.dumps(template_html, ensure_ascii=False)
        outer_json = json.dumps(inner_json, ensure_ascii=False).replace("</", "<\\/")
        tmpl_match = re.search(
            r'(<script type="__bundler/template">)(.*?)(</script>)',
            new_content, re.DOTALL
        )
        if tmpl_match:
            new_content = new_content[:tmpl_match.start(2)] + outer_json + new_content[tmpl_match.end(2):]
            print("  OK template.html injected")
        else:
            print("  WARN: __bundler/template block not found, skipping")
    else:
        print("  SKIP template.html: file not found")

    # 写回
    HTML_PATH.write_text(new_content, encoding="utf-8")
    size_mb = HTML_PATH.stat().st_size / 1024 / 1024
    print(f"\n完成！index.html 已更新 ({size_mb:.1f} MB)")
    print(f"数据块: {', '.join(updated)}")
    if js_updated:
        print(f"JS文件: {', '.join(js_updated)}")

if __name__ == "__main__":
    main()
