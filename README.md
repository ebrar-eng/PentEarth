# PentEarth — Chókwè 2026 Flood Memory, Road Safety and Electrical Hazard Early-Warning System

PentEarth is an open-source decision-support and early-warning platform developed for the NASA Space Apps Challenge 2026. It monitors the floods in Chókwè (Lower Limpopo Basin), Gaza Province, Mozambique, compares them with traces of past floods, and helps prevent stray-current hazards caused by submerged electrical infrastructure.

## 🚀 Key Features

### 🌊 Satellite-Based Active Flood Mapping (Sentinel-1 & NISAR)
- Visualizes the January 2026 Chókwè flood extent (847.3 km², 935 polygons) together with NASADEM S25/S26 slope filtering in real time.
- Includes flood polygons validated against Copernicus EMSR857 data.

### ⚡ Electric Shock Hazard and SCADA Isolation Engine
- Compares the plinth elevations of 7 critical EDM (Electricidade de Moçambique) substations across Chókwè with the live water level.
- Creates a dynamic Stray-Current Exclusion Zone around submerged transformers and offers a one-click remote SCADA de-energization simulation.

### 🚧 Closed Roads and Safe Evacuation Route Calculator
- Automatically marks roads closed because of water depth and electrical risk (N221 Guijá Bridge, R448 Macarretane Road, 4º Bairro).
- Draws a hazard-free evacuation route from stranded areas to the high-elevation EN101 Lionde – Chiaquelane humanitarian aid camp.

### 🧠 Spatial Flood Memory Bank (2000 • 2013 • 2026)
- Stores the February 2000 Cyclone Eline flood (1,120 km²), the January 2013 Limpopo flood (790.4 km²) and the Chókwè HEC-RAS Neighborhood Susceptibility Model data, so that new flood observations can be recorded against them.

### 📡 Inter-Agency Emergency Notification System (INGD, EDM, ANE, ARA-Sul, MISAU)
- Sends coordinate-based hazard and road-closure packages to the relevant emergency agencies.

## 📂 Modular Project Architecture

The codebase is split into functional blocks for readability and maintainability:

```
PentEarth/
├── index.html          # Simplified, highly readable main user interface
├── css/
│   └── styles.css      # Map sizing, flow animations and custom theme styles
├── js/
│   ├── data.js         # Chókwè 2026 scenario, substation, road, flow-vector and historical memory datasets
│   ├── state.js        # Application state (appState) and localStorage persistence management
│   ├── map.js          # Leaflet GIS map initialization, point inspector, layer drawing and safe-route engine
│   ├── charts.js       # Chart.js hydrological time series and neighborhood risk comparison charts
│   ├── ui.js           # KPI cards, substation/road/memory/notification lists and toast components
│   └── app.js          # Event bindings, scenario switching and application bootstrap
├── .gitignore          # Git version-control exclusion rules
├── LICENSE             # MIT Open Source License
└── README.md           # Project documentation and setup guide
```

## 🛠️ Installation and Usage

The project is fully client-side (vanilla HTML5, Tailwind CSS CDN, Leaflet.js and Chart.js); no build step is required.

```bash
# 1. Clone the repository
git clone https://github.com/ebrar-eng/PentEarth.git
cd PentEarth

# 2. Start a local HTTP server (or open index.html directly in the browser)
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser to use the PentEarth command interface.

## 🛰️ Verified Open Data Sources

- NASA/ISRO NISAR L-Band SAR (5–17 January 2026)
- ESA/NASA Sentinel-1A OPERA RTC
- Copernicus Emergency Management Service — EMSR857
- NASA Earth Observatory — Southern Mozambique Floods (GPM & NASADEM)
- Chókwè HEC-RAS Hydrological Flood Risk Model
