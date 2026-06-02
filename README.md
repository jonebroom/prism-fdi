# PRISM — FDI Screening Mechanism Data Platform

An interactive data visualization platform for analyzing foreign direct investment (FDI) screening mechanisms across 38 countries from 2007 to 2023.

**Live site → [https://jonebroom.github.io/prism-fdi/](https://jonebroom.github.io/prism-fdi/)**

---

## Overview

PRISM provides a structured, visual interface for exploring how countries design and evolve their FDI screening regimes. It covers procedural features, sector coverage, strictness scores, and legislative histories across OECD, EU/EEA, and Five Eyes member states.

## Features

| Tab | Description |
|-----|-------------|
| **Overview** | World map + global trend chart (new mechanisms per year) |
| **Country** | Per-country detail: strictness radar, KPI cards, regulation timeline |
| **Comparison** | Parallel coordinates across all countries for a selected year |
| **Evolution** | Coverage type stream, bubble matrix, strictness distribution, supersession network |
| **Changes** | Year-by-year legislative activity (new laws, amendments, executive orders) |
| **Sectors** | Heatmap of sector coverage × country, with animated race chart |

**AI Assistant** — ask natural-language questions about the data using any OpenAI-compatible API (Anthropic Claude, OpenAI GPT, DeepSeek, Moonshot, etc.)

## Data

The dataset is based on the **PRISM ISM Dataset (2023.12)**, covering:
- 38 countries · 2007–2023
- 650+ country-year time-series records
- 143 regulation-level events
- 230 legislative change entries
- 141 policy texts

Country groups: OECD · EU/EEA · Five Eyes

## Project Structure

```
prism-fdi/
├── index.html          # Self-contained deployable app (2.5 MB)
├── rebundle.py         # Build script: packs data/ + js/ into index.html
├── preprocess.py       # Data preprocessing utilities
├── data/               # Source data files (JSON)
│   ├── timeseries.json
│   ├── events.json
│   ├── changes.json
│   ├── yearly_new.json
│   ├── countries.json
│   ├── policy_texts.json
│   └── search_index.json
└── js/js/              # Source JavaScript modules
    ├── state.js        # Global state & data store
    ├── ui.js           # Layout, navigation, rail controls
    ├── main.js         # Bootstrap & data loading
    ├── tab_overview.js
    ├── tab_country.js
    ├── tab_compare.js
    ├── tab_evolution.js
    ├── tab_changes.js
    ├── tab_sectors.js
    ├── search.js
    ├── screener.js     # Deal Screener
    └── ai.js           # AI assistant integration
```

## Local Development

No build tools or Node.js required. The app runs as a single HTML file.

```bash
# Serve locally (Python)
cd prism-fdi
python -m http.server 8765
# Open http://localhost:8765
```

After editing any file in `js/js/` or `data/`, rebuild:

```bash
python rebundle.py
```

## How to Update the Site (Step-by-Step)

The site is hosted on GitHub Pages. Every time you push a change, the live site updates automatically within ~1 minute.

### Prerequisites (one-time setup)

Make sure you have these installed on your computer:
- [Python 3](https://www.python.org/downloads/) — for running `rebundle.py`
- [Git](https://git-scm.com/downloads/) — for pushing to GitHub
- A GitHub account with access to this repository

---

### Option A — Easiest: Double-click `update.bat`

A helper script is included. Just:

1. Make your changes (edit files in `data/` or `js/js/`)
2. Double-click **`update.bat`** in the project folder
3. Type a short description when prompted (e.g. `Add 2024 data`) and press Enter
4. Done — the site updates in about 1 minute

---

### Option B — Command line

Open a terminal in the project folder and run:

```bash
# Step 1: Rebuild index.html from source files
python rebundle.py

# Step 2: Stage, commit, and push
git add index.html data/ js/
git commit -m "Describe what you changed"
git push
```

---

### What to edit for common updates

| What you want to do | What to edit |
|---|---|
| Add / update country data | Replace files in `data/` (JSON) |
| Fix a chart or layout | Edit the relevant file in `js/js/` |
| Add a new tab or feature | Add a new file in `js/js/`, register it in `main.js` |
| Change text or labels | Search for the text in `js/js/` files |

After any edit, always run `python rebundle.py` before pushing — this step packs everything into `index.html`.

---

### Verify your update

After pushing, wait ~1 minute then open the live site:
**[https://jonebroom.github.io/prism-fdi/](https://jonebroom.github.io/prism-fdi/)**

If the page looks wrong, check the [Actions tab](https://github.com/jonebroom/prism-fdi/actions) on GitHub for deployment status.

## Tech Stack

- **Visualization**: [Apache ECharts 5](https://echarts.apache.org/)
- **Fonts**: IBM Plex Sans / IBM Plex Mono
- **AI**: Direct browser-to-API calls (Anthropic, OpenAI-compatible)
- **Hosting**: GitHub Pages (static, no backend)

## Citation

If you use this platform or the underlying dataset in academic work, please cite the PRISM ISM Dataset (2023.12).

## License

Data and visualizations are provided for research and educational purposes.
