// ============================================================================
// BLOK 2: DURUM YÖNETİMİ VE YEREL DEPOLAMA (STATE & STORAGE)
// ============================================================================

const STORAGE_KEYS = {
  MEMORY: 'pentearth_chokwe_memory_v1',
  DISPATCHES: 'pentearth_chokwe_dispatches_v1'
};

const appState = {
  currentScenario: 'peak',
  waterLevelM: 3.4,
  slopeLimitDeg: 5.0,
  rainfallMm: 218,
  soilMoisturePct: 94.2,
  dischargeM3s: 4850,
  floodAreaKm2: 847.3,
  polygonCount: 935,
  memoryOverlapPct: 88.6,
  historicalFilter: 'all',
  electroFilter: 'all',
  layers: {
    flood2026: true,
    memory: true,
    flowVectors: true,
    roads: true,
    electro: true
  },
  substations: JSON.parse(JSON.stringify(SUBSTATIONS_DATA)),
  memoryRecords: [],
  dispatches: []
};

function loadPersistedState() {
  try {
    const savedMem = localStorage.getItem(STORAGE_KEYS.MEMORY);
    appState.memoryRecords = savedMem
      ? JSON.parse(savedMem)
      : JSON.parse(JSON.stringify(DEFAULT_MEMORY_RECORDS));

    const savedDisp = localStorage.getItem(STORAGE_KEYS.DISPATCHES);
    appState.dispatches = savedDisp
      ? JSON.parse(savedDisp)
      : JSON.parse(JSON.stringify(INITIAL_DISPATCHES));
  } catch (e) {
    appState.memoryRecords = JSON.parse(JSON.stringify(DEFAULT_MEMORY_RECORDS));
    appState.dispatches = JSON.parse(JSON.stringify(INITIAL_DISPATCHES));
  }
}

function savePersistedState() {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(appState.memoryRecords));
    localStorage.setItem(STORAGE_KEYS.DISPATCHES, JSON.stringify(appState.dispatches));
  } catch (e) {
    // Sandboxed ortamda depolama kısıtlamalarını yoksay
  }
}
