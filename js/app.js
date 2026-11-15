// ============================================================================
// BLOK 6: OLAY DİNLEYİCİLERİ, SENARYO KONTROLLERİ VE UYGULAMA BAŞLATICI
// ============================================================================

function applyScenario(key) {
  const sc = SCENARIOS[key];
  if (!sc) return;

  appState.currentScenario = key;
  appState.waterLevelM = sc.waterLevel;
  appState.slopeLimitDeg = sc.slopeLimit;
  appState.rainfallMm = sc.rainfallMm;
  appState.soilMoisturePct = sc.soilMoisturePct;
  appState.dischargeM3s = sc.dischargeM3s;
  appState.floodAreaKm2 = sc.floodAreaKm2;
  appState.polygonCount = sc.polygonCount;
  appState.memoryOverlapPct = sc.memoryOverlapPct;

  document.getElementById('sliderWaterLevel').value = sc.waterLevel;
  document.getElementById('sliderSlopeFilter').value = sc.slopeLimit;
  document.getElementById('liveAlertBadge').textContent = sc.alertText;

  const btnMap = {
    pre: 'btnScenarioPre',
    onset: 'btnScenarioOnset',
    peak: 'btnScenarioPeak',
    extreme: 'btnScenarioExtreme'
  };

  Object.entries(btnMap).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (k === key) {
      el.className = 'px-3 py-1.5 rounded-md font-bold transition bg-cyan-500 text-slate-950 text-xs';
    } else {
      el.className = 'px-3 py-1.5 rounded-md font-medium transition text-slate-300 hover:text-white text-xs';
    }
  });

  updateAllUI();
  showToast('Senaryo Yüklendi', `${sc.name} parametreleri harita ve trafo modeline uygulandı.`, '🌊');
}

function recordNewMemoryEntry(title, affectedBairros) {
  const wl = appState.waterLevelM;
  const closedCount = ROADS_DATA.filter(r => evaluateRoadStatus(r).code === 'CLOSED').length;
  const newRec = {
    id: 'MEM-USR-' + Date.now().toString().slice(-4),
    year: '2026 Kaydı (Hafıza)',
    title: title,
    peakLevelM: +wl.toFixed(1),
    areaKm2: +appState.floodAreaKm2.toFixed(1),
    affectedBairros: affectedBairros,
    recurrenceLessons: `Kaydedilen durumda ${closedCount} yol kapandı, GPM yağış ${appState.rainfallMm} mm ve toprak nemi %${appState.soilMoisturePct.toFixed(1)} olarak gelecekteki erken uyarılar için hafızaya alındı.`,
    sourceUrl: '',
    polygon: [
      [-24.5150, 32.9700],
      [-24.5200, 33.0080],
      [-24.5490, 33.0120],
      [-24.5480, 32.9740]
    ],
    color: '#34d399'
  };
  appState.memoryRecords.unshift(newRec);
  savePersistedState();
  updateAllUI();
  switchTab('memory');
  showToast('Sel Hafıza Bankasına Kaydedildi', `"${title}" gelecekteki taşkın tahminlerinde kullanılmak üzere hafızaya eklendi.`, '🧠');
}

function bindEvents() {
  // Senaryo Butonları
  document.getElementById('btnScenarioPre').addEventListener('click', () => applyScenario('pre'));
  document.getElementById('btnScenarioOnset').addEventListener('click', () => applyScenario('onset'));
  document.getElementById('btnScenarioPeak').addEventListener('click', () => applyScenario('peak'));
  document.getElementById('btnScenarioExtreme').addEventListener('click', () => applyScenario('extreme'));

  // SCADA Otomatik Trafo Kesici
  document.getElementById('btnEmergencyCutoffAll').addEventListener('click', () => {
    const wl = appState.waterLevelM;
    let cutCount = 0;
    appState.substations.forEach(sub => {
      if (wl >= sub.baseElevationM && !sub.isolated) {
        sub.isolated = true;
        cutCount++;
      }
    });

    if (cutCount > 0) {
      const newDisp = {
        id: 'DSP-' + Math.floor(105 + Math.random() * 890),
        time: 'Şimdi • SCADA Otomatik',
        agency: 'EDM (Electricidade de Moçambique - SCADA)',
        priority: 'KIRMIZI KOD (ACİL MÜDAHALE)',
        coords: '-24.5300, 32.9800',
        message: `SCADA Otomatik Koruma: Su altında kalan ${cutCount} trafo merkezinin enerjisi uzaktan kesildi ve elektrik çarpma tehlikesi izole edildi.`
      };
      appState.dispatches.unshift(newDisp);
      savePersistedState();
      updateAllUI();
      showToast('SCADA Otomatik Kesici Devrede', `Su basan ${cutCount} trafo merkezinin enerjisi kesildi, kaçak akım tehlikesi önlendi.`, '⚡');
    } else {
      appState.substations.forEach(sub => { sub.isolated = false; });
      updateAllUI();
      showToast('Trafo Enerjileri Yeniden Aktif', 'Simülasyon testi için tüm trafolar tekrar enerjilendirildi.', '🔄');
    }
  });

  // Genel Acil Durum İhbarı
  document.getElementById('btnBroadcastAll').addEventListener('click', () => {
    const wl = appState.waterLevelM;
    const dangerSubs = appState.substations.filter(s => wl >= s.baseElevationM && !s.isolated).map(s => s.id).join(', ') || 'İzole';
    const closedRoads = ROADS_DATA.filter(r => evaluateRoadStatus(r).code === 'CLOSED').map(r => r.id).join(', ');

    const newDisp = {
      id: 'DSP-' + Math.floor(200 + Math.random() * 790),
      time: 'Şimdi • Genel Alarm',
      agency: 'INGD / CENOE + EDM + ANE Ortak Komuta',
      priority: 'KIRMIZI KOD (ACİL MÜDAHALE)',
      coords: '-24.5300, 32.9800',
      message: `CHÓKWÈ ACİL DURUM PAKETİ: Taşkın alanı ${appState.floodAreaKm2.toFixed(1)} km², Su kotu +${wl.toFixed(1)}m. Kapalı Yollar: [${closedRoads}]. Yasaklı Elektrik Bölgeleri: [${dangerSubs}]. Tahliyeler EN101 Chiaquelane koridorundan yapılıyor.`
    };
    appState.dispatches.unshift(newDisp);
    savePersistedState();
    updateAllUI();
    switchTab('dispatch');
    showToast('Acil Durum İhbarı Geçildi', 'INGD, EDM ve ANE birimlerine koordinatlı yol kapama ve yasaklı bölge paketi iletildi.', '📡');
  });

  // Harita Katman Onay Kutuları
  document.getElementById('toggleLayerFlood2026').addEventListener('change', (e) => {
    appState.layers.flood2026 = e.target.checked;
    renderAllMapLayers();
  });
  document.getElementById('toggleLayerMemory').addEventListener('change', (e) => {
    appState.layers.memory = e.target.checked;
    renderAllMapLayers();
  });
  document.getElementById('toggleLayerFlowVectors').addEventListener('change', (e) => {
    appState.layers.flowVectors = e.target.checked;
    renderAllMapLayers();
  });
  document.getElementById('toggleLayerRoads').addEventListener('change', (e) => {
    appState.layers.roads = e.target.checked;
    renderAllMapLayers();
  });
  document.getElementById('toggleLayerElectro').addEventListener('change', (e) => {
    appState.layers.electro = e.target.checked;
    renderAllMapLayers();
  });

  // Altlık Harita Seçimi
  document.getElementById('selectBasemap').addEventListener('change', (e) => {
    const url = BASEMAP_URLS[e.target.value] || BASEMAP_URLS.imagery;
    baseTileLayer.setUrl(url);
  });

  // Haritayı Merkezle
  document.getElementById('btnResetMapBounds').addEventListener('click', () => {
    layerGroups.safeRouteHighlight.clearLayers();
    map.setView(CHOKWE_CENTER, 12);
  });

  // Su Kotu Kaydırıcısı
  document.getElementById('sliderWaterLevel').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    appState.waterLevelM = val;
    appState.floodAreaKm2 = +(Math.max(25, (val / 3.4) * 847.3)).toFixed(1);
    appState.polygonCount = Math.round((val / 3.4) * 935);
    appState.dischargeM3s = Math.round((val / 3.4) * 4850);
    appState.rainfallMm = Math.round((val / 3.4) * 218);
    appState.soilMoisturePct = Math.min(99.5, +(50 + val * 13).toFixed(1));
    updateAllUI();
  });

  // Eğim Filtresi Kaydırıcısı
  document.getElementById('sliderSlopeFilter').addEventListener('input', (e) => {
    const slopeVal = parseFloat(e.target.value);
    appState.slopeLimitDeg = slopeVal;
    const slopeFactor = 0.85 + (slopeVal / 5.0) * 0.15;
    appState.floodAreaKm2 = +((appState.waterLevelM / 3.4) * 847.3 * slopeFactor).toFixed(1);
    updateAllUI();
  });

  // Tarihsel Katman Filtresi
  document.getElementById('selectHistoricalOverlay').addEventListener('change', (e) => {
    appState.historicalFilter = e.target.value;
    renderAllMapLayers();
  });

  // Hızlı Hafıza Kaydı
  document.getElementById('btnRecordCurrentToMemory').addEventListener('click', () => {
    recordNewMemoryEntry(
      `Anlık Simülasyon Kaydı (+${appState.waterLevelM.toFixed(1)}m Su Kotu)`,
      '4º ve 5º Bairro + N221 Köprü Koridoru'
    );
  });

  // Sekme Geçişleri
  document.querySelectorAll('.module-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Trafo Filtresi
  document.getElementById('filterElectroStatus').addEventListener('change', (e) => {
    appState.electroFilter = e.target.value;
    renderSubstationList();
  });

  // Trafo Listesi Aksiyonları
  document.getElementById('substationListContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const sub = appState.substations.find(s => s.id === id);
    if (!sub) return;

    if (action === 'focus-sub') {
      map.setView(sub.coords, 14);
      inspectCoordinate(sub.coords[0], sub.coords[1]);
    } else if (action === 'toggle-isolate') {
      sub.isolated = !sub.isolated;
      updateAllUI();
      showToast(
        sub.isolated ? `${sub.id} Enerjisi Kesildi` : `${sub.id} Enerjilendirildi`,
        sub.isolated
          ? `${sub.name} SCADA üzerinden izole edildi; yasaklı bölge güvenli hale getirildi.`
          : `${sub.name} tekrar devreye alındı.`,
        '⚡'
      );
    } else if (action === 'alert-sub') {
      const newDisp = {
        id: 'DSP-' + Math.floor(105 + Math.random() * 890),
        time: 'Şimdi • Trafo İhbarı',
        agency: 'EDM (Electricidade de Moçambique - SCADA)',
        priority: 'KIRMIZI KOD (ACİL MÜDAHALE)',
        coords: `${sub.coords[0].toFixed(4)}, ${sub.coords[1].toFixed(4)}`,
        message: `YASAKLI BÖLGE UYARISI: ${sub.id} (${sub.name}) taşkın bölgesi içinde. ${sub.hazardRadiusM}m yarıçaplı alana giriş yasaklandı, saha ekibi yönlendirildi.`
      };
      appState.dispatches.unshift(newDisp);
      savePersistedState();
      updateAllUI();
      showToast('EDM & INGD Birimlerine Uyarı Geçildi', `${sub.id} trafo tehlike raporu iletildi.`, '📡');
    }
  });

  // Yol Listesi Aksiyonları
  document.getElementById('roadListContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const road = ROADS_DATA.find(r => r.id === id);
    if (!road) return;

    if (action === 'focus-road') {
      const poly = L.polyline(road.coords);
      map.fitBounds(poly.getBounds(), { padding: [50, 50] });
    } else if (action === 'alert-road') {
      const st = evaluateRoadStatus(road);
      const mid = road.coords[Math.floor(road.coords.length / 2)];
      const newDisp = {
        id: 'DSP-' + Math.floor(105 + Math.random() * 890),
        time: 'Şimdi • Yol Güvenliği',
        agency: 'ANE & PRM (Karayolları İdaresi & Trafik Polisi)',
        priority: st.code === 'CLOSED' ? 'KIRMIZI KOD (ACİL MÜDAHALE)' : 'TURUNCU KOD (TAHLİYE & KAPAMA)',
        coords: `${mid[0].toFixed(4)}, ${mid[1].toFixed(4)}`,
        message: `${road.name}: ${st.badge}. ${st.reason} Fiziki bariyer ve yönlendirme levhası talep edildi.`
      };
      appState.dispatches.unshift(newDisp);
      savePersistedState();
      updateAllUI();
      showToast('Karayolları & Polise İhbar Geçildi', `${road.name} durum raporu ANE ve PRM birimlerine iletildi.`, '🚧');
    }
  });

  // Güvenli Tahliye Rotası Hesaplama
  document.getElementById('btnCalculateSafeRoute').addEventListener('click', calculateSafeEvacuationRoute);

  // Sel Hafızasına Yeni Gözlem Ekleme
  document.getElementById('btnAddMemoryEntry').addEventListener('click', () => {
    const titleInput = document.getElementById('inputMemoryTitle');
    const bairroSelect = document.getElementById('inputMemoryBairro');
    const title = titleInput.value.trim() || 'Yeni Chókwè Taşkın Saha Kaydı';
    recordNewMemoryEntry(title, bairroSelect.value);
  });

  // Tarihsel Afet Seviyesini Simüle Etme
  document.getElementById('memoryListContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="apply-memory"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const rec = appState.memoryRecords.find(r => r.id === id);
    if (!rec) return;

    appState.waterLevelM = rec.peakLevelM;
    appState.floodAreaKm2 = rec.areaKm2;
    document.getElementById('sliderWaterLevel').value = Math.min(5.2, rec.peakLevelM);
    updateAllUI();
    showToast('Tarihsel Sel Hafızası Yüklendi', `${rec.year} (${rec.title}) su seviyesi (+${rec.peakLevelM}m) harita üzerinde simüle ediliyor.`, '🧠');
  });

  // Manuel Birim İhbarı Gönderme
  document.getElementById('btnSendDispatch').addEventListener('click', () => {
    const agency = document.getElementById('selectDispatchAgency').value;
    const priority = document.getElementById('selectDispatchPriority').value;
    const msgInput = document.getElementById('inputDispatchMessage');
    const msg = msgInput.value.trim();
    if (!msg) return;

    const newDisp = {
      id: 'DSP-' + Math.floor(105 + Math.random() * 890),
      time: 'Şimdi • Operatör İhbarı',
      agency: agency,
      priority: priority,
      coords: '-24.5300, 32.9800',
      message: msg
    };
    appState.dispatches.unshift(newDisp);
    savePersistedState();
    updateAllUI();
    showToast('Birim Uyarısı Gönderildi', `${agency} birimine "${priority}" kodlu mesaj iletildi.`, '📡');
  });
}

// Uygulamayı Başlat
window.addEventListener('DOMContentLoaded', () => {
  loadPersistedState();
  initMap();
  initCharts();
  bindEvents();
  updateAllUI();
});
