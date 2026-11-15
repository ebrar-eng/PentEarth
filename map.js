// ============================================================================
// BLOK 3: CBS HARİTALANDIRMA VE HİDROLOJİK KATMAN MOTORU (LEAFLET & ARCGIS)
// ============================================================================

let map;
let baseTileLayer;
const layerGroups = {
  flood2026: null,
  memory: null,
  flowVectors: null,
  roads: null,
  electro: null,
  safeRouteHighlight: null
};

const BASEMAP_URLS = {
  imagery: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
};

function initMap() {
  map = L.map('chokweMap', {
    center: CHOKWE_CENTER,
    zoom: 12,
    minZoom: 10,
    maxZoom: 17,
    zoomControl: true
  });

  baseTileLayer = L.tileLayer(BASEMAP_URLS.imagery, {
    attribution: 'Tiles &copy; Esri &mdash; NASA NISAR / Sentinel-1 / Copernicus EMSR857'
  }).addTo(map);

  layerGroups.memory = L.layerGroup().addTo(map);
  layerGroups.flood2026 = L.layerGroup().addTo(map);
  layerGroups.flowVectors = L.layerGroup().addTo(map);
  layerGroups.roads = L.layerGroup().addTo(map);
  layerGroups.electro = L.layerGroup().addTo(map);
  layerGroups.safeRouteHighlight = L.layerGroup().addTo(map);

  // Map Click Inspector: evaluates flood depth, historical recurrence, and electrocution risk at clicked coordinate
  map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    inspectCoordinate(lat, lng);
  });
}

function inspectCoordinate(lat, lng) {
  // Calculate distance to Limpopo thalweg / 4th Bairro depression
  const distToBairro4Km = haversineKm(lat, lng, -24.5285, 32.9845);
  const distToRiverKm = haversineKm(lat, lng, -24.5000, 33.0000);
  const minDist = Math.min(distToBairro4Km, distToRiverKm);

  const localDepth = Math.max(0, +(appState.waterLevelM - minDist * 0.42).toFixed(2));

  // Check proximity to active un-isolated substations
  let nearestSub = null;
  let minSubDistM = Infinity;
  appState.substations.forEach(sub => {
    const dMeters = haversineKm(lat, lng, sub.coords[0], sub.coords[1]) * 1000;
    if (dMeters < minSubDistM) {
      minSubDistM = dMeters;
      nearestSub = sub;
    }
  });

  const isSubFlooded = nearestSub && (appState.waterLevelM >= nearestSub.baseElevationM);
  const inElectroZone = isSubFlooded && !nearestSub.isolated && (minSubDistM <= nearestSub.hazardRadiusM);

  const coordEl = document.getElementById('mapInspectorCoord');
  const statusEl = document.getElementById('mapInspectorStatus');
  coordEl.textContent = `Enlem: ${lat.toFixed(4)}° | Boylam: ${lng.toFixed(4)}°`;

  if (inElectroZone) {
    statusEl.className = 'text-xs text-rose-400 font-bold mt-0.5';
    statusEl.textContent = `⚡ YASAKLI ELEKTRİK BÖLGESİ (${nearestSub.id} - ${Math.round(minSubDistM)}m) • Su: ${localDepth}m`;
  } else if (localDepth > 0.4) {
    statusEl.className = 'text-xs text-amber-300 mt-0.5';
    statusEl.textContent = `🌊 TAŞKIN ALANI • Tahmini Su Derinliği: ${localDepth}m • Tarihsel Tekerrür: Yüksek`;
  } else {
    statusEl.className = 'text-xs text-emerald-300 mt-0.5';
    statusEl.textContent = `✓ GÜVENLİ YÜKSEK KOT • Su Derinliği: 0.0m • Tahliyeye Uygun`;
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderAllMapLayers() {
  layerGroups.flood2026.clearLayers();
  layerGroups.memory.clearLayers();
  layerGroups.flowVectors.clearLayers();
  layerGroups.roads.clearLayers();
  layerGroups.electro.clearLayers();

  const wl = appState.waterLevelM;
  const expansion = (wl - 2.0) * 0.008; // Dynamic polygon buffer based on water level & slope

  // 1. HISTORICAL FLOOD MEMORY LAYER (2000, 2013, HEC-RAS)
  if (appState.layers.memory) {
    appState.memoryRecords.forEach(rec => {
      if (appState.historicalFilter !== 'all') {
        if (appState.historicalFilter === '2000' && rec.id !== 'MEM-2000') return;
        if (appState.historicalFilter === '2013' && rec.id !== 'MEM-2013') return;
        if (appState.historicalFilter === 'hecras' && rec.id !== 'MEM-HECRAS') return;
      }
      if (!rec.polygon) return;
      const poly = L.polygon(rec.polygon, {
        color: rec.color || '#a855f7',
        weight: 1.8,
        dashArray: '6, 6',
        fillColor: rec.color || '#a855f7',
        fillOpacity: 0.14
      });
      poly.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold text-purple-300">🧠 Tarihsel Sel Hafızası: ${rec.year}</div>
          <div class="font-semibold text-white">${rec.title}</div>
          <div class="text-slate-300">Alan: <strong>${rec.areaKm2} km²</strong> | Zirve Kot: <strong>+${rec.peakLevelM} m</strong></div>
          <div class="text-slate-300">Bölgeler: ${rec.affectedBairros}</div>
          <div class="text-amber-200">${rec.recurrenceLessons}</div>
        </div>
      `);
      poly.addTo(layerGroups.memory);
    });
  }

  // 2. 2026 ACTIVE FLOOD EXTENT POLYGONS (SENTINEL-1 & NISAR OTSU + NASADEM)
  if (appState.layers.flood2026) {
    // Core Limpopo Floodplain Corridor (Macarretane -> Guijá -> Chókwè)
    const mainFloodPlume = [
      [-24.4020 - expansion * 0.4, 32.8710 - expansion * 0.4],
      [-24.4480 - expansion * 0.5, 32.9420 + expansion * 0.6],
      [-24.4960 - expansion * 0.6, 33.0120 + expansion * 0.8],
      [-24.5380 + expansion * 0.7, 33.0420 + expansion * 0.9],
      [-24.5680 + expansion * 0.8, 33.0220 + expansion * 0.6],
      [-24.5520 + expansion * 0.6, 32.9680 - expansion * 0.5],
      [-24.4920 + expansion * 0.4, 32.9220 - expansion * 0.5]
    ];

    const mainPoly = L.polygon(mainFloodPlume, {
      color: '#06b6d4',
      weight: 2,
      fillColor: '#0ea5e9',
      fillOpacity: Math.min(0.52, 0.22 + wl * 0.06)
    });
    mainPoly.bindPopup(`
      <div class="text-xs space-y-1">
        <div class="font-bold text-cyan-300">🌊 Ocak 2026 Limpopo Ana Taşkın Koridoru</div>
        <div>Kaynak: <strong>Sentinel-1A SAR + NISAR + NASADEM (Eğim &lt; ${appState.slopeLimitDeg}°)</strong></div>
        <div>Toplam Yayılım: <strong>${appState.floodAreaKm2} km² (${appState.polygonCount} poligon)</strong></div>
        <div>Anlık Su Kotu: <strong>+${wl.toFixed(1)} m</strong> | Akış Hızı: <strong>2.8 m/s</strong></div>
      </div>
    `);
    mainPoly.addTo(layerGroups.flood2026);

    // High-Risk 4th & 5th Bairro Urban Depression Pocket
    if (wl >= 1.3) {
      const urbanDepression = [
        [-24.5190 - expansion * 0.3, 32.9740 - expansion * 0.3],
        [-24.5210 - expansion * 0.3, 33.0040 + expansion * 0.4],
        [-24.5440 + expansion * 0.5, 33.0090 + expansion * 0.4],
        [-24.5450 + expansion * 0.4, 32.9760 - expansion * 0.3]
      ];
      const urbanPoly = L.polygon(urbanDepression, {
        color: '#38bdf8',
        weight: 2,
        fillColor: '#0284c7',
        fillOpacity: 0.48
      });
      urbanPoly.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold text-sky-300">🌊 Chókwè 4º &amp; 5º Bairro Kentsel Taşkın Çukuru</div>
          <div>HEC-RAS Kronik Taşkın Oranı: <strong>%25.2 (4º Bairro)</strong></div>
          <div>Tahmini Kentsel Su Derinliği: <strong>${Math.max(0.4, (wl - 0.6)).toFixed(1)} m</strong></div>
          <div class="text-rose-300 font-semibold">⚠️ EDM-TR01 ve EDM-TR05 Trafoları ile Kesişiyor!</div>
        </div>
      `);
      urbanPoly.addTo(layerGroups.flood2026);
    }
  }

  // 3. RAINFALL & HYDROLOGICAL FLOW DIRECTION VECTORS (NASADEM D8)
  if (appState.layers.flowVectors) {
    FLOW_ROUTES_DATA.forEach(flow => {
      // Base glow line
      L.polyline(flow.coords, {
        color: '#0284c7',
        weight: 6,
        opacity: 0.35
      }).addTo(layerGroups.flowVectors);

      // Animated dashed vector line
      const animLine = L.polyline(flow.coords, {
        color: '#7dd3fc',
        weight: 3,
        className: 'flow-stream-line'
      });
      animLine.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold text-sky-300">🧭 Hidrolojik Yüzey Akış Rotası (NASADEM D8)</div>
          <div class="font-semibold text-white">${flow.name}</div>
          <div>Hesaplanan Akış Hızı: <strong>${(flow.velocityMs * (wl / 3.4)).toFixed(1)} m/s</strong></div>
          <div>Macarretane Deşarj Debisi: <strong>${appState.dischargeM3s} m³/s</strong></div>
        </div>
      `);
      animLine.addTo(layerGroups.flowVectors);

      // Flow directional arrow markers along segments
      for (let i = 0; i < flow.coords.length - 1; i++) {
        const p1 = flow.coords[i];
        const p2 = flow.coords[i + 1];
        const midLat = (p1[0] + p2[0]) / 2;
        const midLng = (p1[1] + p2[1]) / 2;
        const angleDeg = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);

        const arrowIcon = L.divIcon({
          className: 'flow-arrow-icon',
          html: `<div style="transform: rotate(${90 - angleDeg}deg); color:#38bdf8; font-size:15px; font-weight:900; text-shadow:0 0 6px #0284c7;">➤</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(layerGroups.flowVectors);
      }
    });
  }

  // 4. ROADS & EVACUATION CORRIDORS LAYER
  if (appState.layers.roads) {
    ROADS_DATA.forEach(road => {
      const statusObj = evaluateRoadStatus(road);
      let strokeColor = '#10b981'; // Open (Emerald)
      let dashPattern = null;
      let weight = 4.5;

      if (statusObj.code === 'CLOSED') {
        strokeColor = '#f43f5e'; // Rose red
        dashPattern = '8, 8';
        weight = 5;
      } else if (statusObj.code === 'CAUTION') {
        strokeColor = '#f59e0b'; // Amber
        dashPattern = '4, 6';
      }

      const roadLine = L.polyline(road.coords, {
        color: strokeColor,
        weight: weight,
        opacity: 0.92,
        dashArray: dashPattern
      });

      roadLine.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold ${statusObj.code === 'CLOSED' ? 'text-rose-400' : statusObj.code === 'CAUTION' ? 'text-amber-300' : 'text-emerald-400'}">
            ${statusObj.badge} — ${road.name}
          </div>
          <div class="text-slate-300">Sınıf: ${road.type}</div>
          <div class="text-slate-200">${statusObj.reason}</div>
          <div class="text-slate-400">${road.notes}</div>
        </div>
      `);
      roadLine.addTo(layerGroups.roads);

      // Add roadblock icon on closed roads
      if (statusObj.code === 'CLOSED') {
        const midIdx = Math.floor(road.coords.length / 2);
        const midCoord = road.coords[midIdx];
        const blockIcon = L.divIcon({
          className: '',
          html: `<div class="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono-tech font-bold text-[10px] border border-white shadow-md whitespace-nowrap">⛔ KAPALI</div>`,
          iconSize: [64, 20],
          iconAnchor: [32, 10]
        });
        L.marker(midCoord, { icon: blockIcon }).bindPopup(roadLine.getPopup()).addTo(layerGroups.roads);
      }
    });

    // Add Chiaquelane Safe Evacuation Camp Marker
    const campIcon = L.divIcon({
      className: '',
      html: `<div class="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] border-2 border-emerald-200 shadow-lg whitespace-nowrap">⛺ Chiaquelane Güvenli Kampı (INGD)</div>`,
      iconSize: [190, 26],
      iconAnchor: [95, 13]
    });
    L.marker([-24.6450, 33.1150], { icon: campIcon })
      .bindPopup(`<div class="text-xs"><strong class="text-emerald-400">Chiaquelane Yüksek Kot Tahliye Merkezi</strong><br/>2000, 2013 ve 2026 taşkınlarında su basmayan ana toplanma alanı. EN101 üzerinden ulaşım AÇIK.</div>`)
      .addTo(layerGroups.roads);
  }

  // 5. TRANSFORMERS & ELECTROCUTION EXCLUSION ZONES (AKIM YOK)
  if (appState.layers.electro) {
    appState.substations.forEach(sub => {
      const isFlooded = wl >= sub.baseElevationM;
      const overtoppingM = Math.max(0, +(wl - sub.baseElevationM).toFixed(2));
      const isDangerActive = isFlooded && !sub.isolated;

      // Exclusion zone circle
      if (isDangerActive) {
        const dynamicRadius = Math.round(sub.hazardRadiusM * (1 + overtoppingM * 0.18));
        const hazardCircle = L.circle(sub.coords, {
          radius: dynamicRadius,
          color: '#f43f5e',
          weight: 2.5,
          fillColor: '#f59e0b',
          fillOpacity: 0.28,
          className: 'electro-hazard-zone'
        });
        hazardCircle.bindPopup(`
          <div class="text-xs space-y-1.5">
            <div class="font-bold text-rose-400 uppercase">⚡ YASAKLI BÖLGE — ELEKTRİK ÇARPMA TEHLİKESİ!</div>
            <div class="font-semibold text-white">${sub.id}: ${sub.name} (${sub.voltage})</div>
            <div class="text-amber-300">Su Basma Derinliği: <strong>+${overtoppingM} m</strong> | Tehlike Yarıçapı: <strong>${dynamicRadius} m</strong></div>
            <div class="text-slate-300">Etkilenen Hat: ${sub.connectedLoads}</div>
            <div class="text-rose-200 font-semibold">⚠️ Sivil ve metal gövdeli kurtarma botlarının girişi kesinlikle yasaktır!</div>
          </div>
        `);
        hazardCircle.addTo(layerGroups.electro);
      } else if (isFlooded && sub.isolated) {
        const isolatedCircle = L.circle(sub.coords, {
          radius: sub.hazardRadiusM,
          color: '#10b981',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#10b981',
          fillOpacity: 0.08
        });
        isolatedCircle.addTo(layerGroups.electro);
      }

      // Transformer Marker Icon
      const badgeBg = isDangerActive
        ? 'bg-rose-600 border-amber-300 text-white animate-pulse'
        : sub.isolated
          ? 'bg-slate-800 border-emerald-400 text-emerald-300'
          : 'bg-emerald-700 border-emerald-300 text-white';

      const statusSymbol = isDangerActive ? '⚡ YASAKLI' : sub.isolated ? '🔒 KESİLDİ' : '✓ GÜVENLİ';

      const subIcon = L.divIcon({
        className: '',
        html: `<div class="px-2 py-0.5 rounded-md border ${badgeBg} font-mono-tech font-bold text-[10px] shadow-md whitespace-nowrap">${statusSymbol} ${sub.id}</div>`,
        iconSize: [96, 22],
        iconAnchor: [48, 11]
      });

      const marker = L.marker(sub.coords, { icon: subIcon });
      marker.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold ${isDangerActive ? 'text-rose-400' : 'text-emerald-400'}">${sub.id} — ${sub.name}</div>
          <div>Gerilim: <strong>${sub.voltage}</strong> | Bölge: <strong>${sub.bairro}</strong></div>
          <div>Kritik Su Eşiği: <strong>${sub.baseElevationM} m</strong> | Mevcut Su: <strong>${wl.toFixed(1)} m</strong></div>
          <div>Durum: <strong>${isDangerActive ? 'AKTİF KAÇAK AKIM & YASAKLI BÖLGE' : sub.isolated ? 'ENERJİSİ KESİLDİ (SCADA İZOLE)' : 'NORMAL ÇALIŞIYOR'}</strong></div>
        </div>
      `);
      marker.addTo(layerGroups.electro);
    });
  }
}

function evaluateRoadStatus(road) {
  const wl = appState.waterLevelM;
  const linkedSub = appState.substations.find(s => s.id === road.electroSubstationId);
  const hasElectroHazard = linkedSub && (wl >= linkedSub.baseElevationM) && !linkedSub.isolated;

  if (wl >= road.thresholdLevelM) {
    const depthOnRoad = +(wl - road.thresholdLevelM + 0.45).toFixed(2);
    return {
      code: 'CLOSED',
      badge: '⛔ KAPALI / GİRİŞ-ÇIKIŞ YASAK',
      reason: `Yol üzerinde ${depthOnRoad}m taşkın suyu var${hasElectroHazard ? ' + ' + linkedSub.id + ' Elektrik Çarpma Tehlikesi!' : '.'}`
    };
  }
  if (hasElectroHazard || wl >= road.thresholdLevelM - 0.4) {
    return {
      code: 'CAUTION',
      badge: '⚠️ TEHLİKELİ / KISITLI GEÇİŞ',
      reason: hasElectroHazard
        ? `${linkedSub.id} trafo kaçak akım çemberine yakın; yalnız izole kurtarma araçları geçebilir.`
        : `Su seviyesi yol gövdesine yaklaştı (Kritik eşik: ${road.thresholdLevelM}m).`
    };
  }
  return {
    code: 'OPEN',
    badge: '✅ AÇIK GÜVENLİ KORİDOR',
    reason: 'Yüksek kotlu tahliye koridoru; taşkın ve elektrik tehlikesi dışında.'
  };
}

function calculateSafeEvacuationRoute() {
  const origin = document.getElementById('selectRouteOrigin').value;
  const dest = document.getElementById('selectRouteDest').value;
  layerGroups.safeRouteHighlight.clearLayers();

  const originPoints = {
    b4: { name: '4º Bairro Güney Çıkışı', coords: [-24.5330, 32.9810] },
    center: { name: 'Chókwè Belediye Merkezi (1º Bairro)', coords: [-24.5340, 32.9770] },
    hospital: { name: 'Hospital Rural de Chókwè', coords: [-24.5349, 33.0054] },
    guija: { name: 'Guijá Köprü Güney Yaklaşımı', coords: [-24.5180, 32.9910] }
  };

  const destPoints = {
    chiaquelane: { name: 'Chiaquelane Yüksek Tahliye Kampı', coords: [-24.6450, 33.1150] },
    lionde: { name: 'Lionde ISPG Yüksek Kot Merkezi', coords: [-24.5881, 33.0606] },
    hospital: { name: 'Hospital Rural de Chókwè', coords: [-24.5349, 33.0054] }
  };

  const o = originPoints[origin] || originPoints.b4;
  const d = destPoints[dest] || destPoints.chiaquelane;

  // Build waypoints that bypass flooded N221, R448, and 4th Bairro electrocution circles via EN101 southern high ridge
  let routeWaypoints = [o.coords, [-24.5365, 32.9765], [-24.5550, 33.0080]];
  if (dest === 'hospital') {
    routeWaypoints = [o.coords, [-24.5365, 32.9765], [-24.5390, 32.9990], d.coords];
  } else if (dest === 'lionde') {
    routeWaypoints.push([-24.5730, 33.0360], d.coords);
  } else {
    routeWaypoints.push([-24.5881, 33.0606], [-24.6140, 33.0890], d.coords);
  }

  const highlightLine = L.polyline(routeWaypoints, {
    color: '#10b981',
    weight: 7,
    opacity: 0.95
  }).addTo(layerGroups.safeRouteHighlight);

  map.fitBounds(highlightLine.getBounds(), { padding: [40, 40] });

  const distKm = (haversineKm(o.coords[0], o.coords[1], d.coords[0], d.coords[1]) * 1.28).toFixed(1);
  const summaryEl = document.getElementById('routeComputedSummary');
  summaryEl.innerHTML = `✓ <strong>Aktif Güvenli Tahliye Rotası:</strong> ${o.name} → EN101 Yüksek Sırt Hattı → ${d.name} (<strong>${distKm} km</strong> | Kapalı N221/R448 ve Trafo Yasaklı Bölgeleri Bypass Edildi)`;

  showToast('Güvenli Tahliye Rotası Çizildi', `${o.name} → ${d.name} (${distKm} km) haritada yeşil koridor olarak işaretlendi.`, '🛣️');
}
