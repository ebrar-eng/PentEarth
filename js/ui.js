// ============================================================================
// BLOK 5: KULLANICI ARAYÜZÜ (UI) RENDER VE BİLDİRİM MODÜLÜ
// ============================================================================

let toastTimer = null;

function showToast(title, body, icon = '📡') {
  const banner = document.getElementById('toastBanner');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastBody').textContent = body;
  document.getElementById('toastIcon').textContent = icon;
  banner.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    banner.classList.add('hidden');
  }, 4500);
}

function updateAllUI() {
  const wl = appState.waterLevelM;

  // Aktif tehlike altındaki trafoları ve yasaklı alanı hesapla
  const activeDangerSubs = appState.substations.filter(s => wl >= s.baseElevationM && !s.isolated);
  const totalHazardAreaKm2 = activeDangerSubs.reduce((acc, s) => {
    const over = Math.max(0, wl - s.baseElevationM);
    const rKm = (s.hazardRadiusM * (1 + over * 0.18)) / 1000;
    return acc + Math.PI * rKm * rKm * 3.8;
  }, 0);

  const closedRoadsCount = ROADS_DATA.filter(r => evaluateRoadStatus(r).code === 'CLOSED').length;

  // KPI Kartlarını Güncelle
  document.getElementById('kpiFloodArea').textContent = `${appState.floodAreaKm2.toFixed(1)} km²`;
  document.getElementById('kpiPolygonCount').textContent = `${appState.polygonCount} poligon`;
  document.getElementById('kpiRainfall').textContent = `${appState.rainfallMm} mm`;
  document.getElementById('kpiSoilMoisture').textContent = `Nem: %${appState.soilMoisturePct.toFixed(1)}`;
  document.getElementById('kpiDischarge').textContent = `${appState.dischargeM3s.toLocaleString('tr-TR')} m³/s`;
  document.getElementById('kpiClosedRoads').textContent = `${closedRoadsCount} / ${ROADS_DATA.length}`;
  document.getElementById('kpiHazardZones').textContent = `${activeDangerSubs.length} Bölge`;
  document.getElementById('kpiHazardRadius').textContent = `${totalHazardAreaKm2.toFixed(1)} km² yasaklı`;

  const scadaEl = document.getElementById('kpiScadaStatus');
  if (activeDangerSubs.length > 0) {
    scadaEl.className = 'text-rose-400 font-semibold';
    scadaEl.textContent = `${activeDangerSubs.length} Aktif Kaçak Riski`;
  } else {
    scadaEl.className = 'text-emerald-400 font-semibold';
    scadaEl.textContent = 'Tüm Riskli Hatlar İzole';
  }

  document.getElementById('kpiMemoryMatch').textContent = `%${appState.memoryOverlapPct.toFixed(1)}`;
  document.getElementById('kpiMemoryCount').textContent = `${appState.memoryRecords.length} Katman`;
  document.getElementById('badgeSavedMemoryCount').textContent = `${appState.memoryRecords.length} Kayıt`;
  document.getElementById('kpiDispatchesSent').textContent = `${appState.dispatches.length} İhbar`;

  // Simülasyon Kaydırıcı Etiketleri
  const statusLabel = wl >= 3.0 ? 'Kritik Taşkın' : wl >= 2.0 ? 'Uyarı Eşiği' : 'Normal';
  document.getElementById('labelWaterLevel').textContent = `+${wl.toFixed(1)} m (${statusLabel})`;
  const flowSpeed = (2.8 * (wl / 3.4)).toFixed(1);
  document.getElementById('labelSlopeFilter').textContent = `< ${appState.slopeLimitDeg.toFixed(1)}° | ${flowSpeed} m/s`;

  renderSubstationList();
  renderRoadList();
  renderMemoryList();
  renderDispatchList();
  renderAllMapLayers();
  updateCharts();
}

function renderSubstationList() {
  const container = document.getElementById('substationListContainer');
  const wl = appState.waterLevelM;
  const filter = appState.electroFilter;

  const filtered = appState.substations.filter(sub => {
    const isFlooded = wl >= sub.baseElevationM;
    const isDanger = isFlooded && !sub.isolated;
    if (filter === 'danger') return isDanger;
    if (filter === 'isolated') return sub.isolated;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-5 text-center text-sm text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
        Seçilen filtreye uygun trafo kaydı bulunmuyor.
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(sub => {
    const isFlooded = wl >= sub.baseElevationM;
    const overtoppingM = Math.max(0, +(wl - sub.baseElevationM).toFixed(2));
    const isDanger = isFlooded && !sub.isolated;
    const dynamicRadius = isDanger ? Math.round(sub.hazardRadiusM * (1 + overtoppingM * 0.18)) : sub.hazardRadiusM;

    const borderClass = isDanger
      ? 'border-rose-500/70 bg-rose-950/25'
      : sub.isolated
        ? 'border-emerald-500/40 bg-slate-900/80'
        : 'border-slate-800 bg-slate-900/80';

    const statusBadge = isDanger
      ? `<span class="px-2.5 py-1 rounded-full text-xs font-mono-tech font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">⚡ YASAKLI (${dynamicRadius}m)</span>`
      : sub.isolated
        ? `<span class="px-2.5 py-1 rounded-full text-xs font-mono-tech font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🔒 İZOLE EDİLDİ</span>`
        : `<span class="px-2.5 py-1 rounded-full text-xs font-mono-tech font-bold bg-slate-800 text-slate-300">✓ GÜVENLİ</span>`;

    return `
      <div class="p-3.5 rounded-xl border ${borderClass} transition space-y-2.5">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono-tech font-bold text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">${sub.id}</span>
              <h3 class="text-sm font-bold text-white">${sub.name}</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">${sub.bairro} • ${sub.voltage} • Kritik Su Eşiği: ${sub.baseElevationM}m</p>
          </div>
          ${statusBadge}
        </div>

        <div class="text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/70">
          <span><strong>Abone / Yük:</strong> ${sub.connectedLoads}</span>
          <span class="font-mono-tech ${isDanger ? 'text-rose-300 font-bold' : 'text-emerald-300'}">
            ${isFlooded ? `Su Altında: +${overtoppingM}m` : `Güvenli Pay: ${(sub.baseElevationM - wl).toFixed(1)}m`}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2 pt-1">
          <button type="button" data-action="focus-sub" data-id="${sub.id}" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            🎯 Haritada Göster
          </button>
          <div class="flex items-center gap-2">
            <button type="button" data-action="toggle-isolate" data-id="${sub.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${sub.isolated ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'}">
              ${sub.isolated ? 'Enerjiyi Aç' : '⚡ Enerjiyi Kes'}
            </button>
            <button type="button" data-action="alert-sub" data-id="${sub.id}" class="px-3 py-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-500 text-white text-xs font-semibold transition">
              İhbar Geç
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRoadList() {
  const container = document.getElementById('roadListContainer');
  container.innerHTML = ROADS_DATA.map(road => {
    const st = evaluateRoadStatus(road);
    const cardStyle = st.code === 'CLOSED'
      ? 'border-rose-500/60 bg-rose-950/20'
      : st.code === 'CAUTION'
        ? 'border-amber-500/50 bg-amber-950/15'
        : 'border-emerald-500/40 bg-slate-900/80';

    const badgeStyle = st.code === 'CLOSED'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : st.code === 'CAUTION'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

    return `
      <div class="p-3.5 rounded-xl border ${cardStyle} space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-white">${road.name}</h3>
            <p class="text-xs text-slate-400 mt-0.5">${road.type} • Kapama Eşiği: ${road.thresholdLevelM}m</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-mono-tech font-bold border shrink-0 ${badgeStyle}">
            ${st.badge}
          </span>
        </div>
        <p class="text-xs text-slate-200">${st.reason}</p>
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button type="button" data-action="focus-road" data-id="${road.id}" class="text-cyan-400 hover:underline font-semibold">
            🗺️ Haritada İncele
          </button>
          <button type="button" data-action="alert-road" data-id="${road.id}" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium">
            Bariyer İhbarı Geç
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderMemoryList() {
  const container = document.getElementById('memoryListContainer');
  container.innerHTML = appState.memoryRecords.map(rec => `
    <div class="p-3.5 rounded-xl border border-purple-500/30 bg-slate-900/80 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="px-2.5 py-0.5 rounded-md text-xs font-mono-tech font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          ${rec.year}
        </span>
        <span class="font-mono-tech text-xs text-cyan-300 font-bold">${rec.areaKm2} km² • Zirve: +${rec.peakLevelM}m</span>
      </div>
      <h3 class="text-sm font-bold text-white">${rec.title}</h3>
      <p class="text-xs text-slate-300"><strong>Etkilenen Alanlar:</strong> ${rec.affectedBairros}</p>
      <div class="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
        <strong>Tarihsel Ders:</strong> ${rec.recurrenceLessons}
      </div>
      <div class="flex items-center justify-between pt-1 text-xs">
        ${rec.sourceUrl ? `<a href="${rec.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline font-medium">Resmi Kaynak ↗</a>` : `<span class="text-purple-300">Saha Gözlem Kaydı</span>`}
        <button type="button" data-action="apply-memory" data-id="${rec.id}" class="px-3 py-1.5 rounded-lg bg-purple-600/35 hover:bg-purple-600/55 text-purple-100 font-semibold transition">
          Haritada Simüle Et
        </button>
      </div>
    </div>
  `).join('');
}

function renderDispatchList() {
  const container = document.getElementById('dispatchLogContainer');
  container.innerHTML = appState.dispatches.map(d => {
    const isRed = d.priority.includes('KIRMIZI');
    const isOrange = d.priority.includes('TURUNCU');
    const badgeCls = isRed
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : isOrange
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

    return `
      <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs font-bold text-cyan-300">${d.agency}</span>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono-tech font-bold border ${badgeCls}">${d.priority}</span>
        </div>
        <p class="text-xs text-slate-200 leading-relaxed">${d.message}</p>
        <div class="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 pt-1">
          <span>Kod: ${d.id} | Konum: ${d.coords}</span>
          <span class="text-emerald-400">${d.time} ✓</span>
        </div>
      </div>
    `;
  }).join('');
}

function switchTab(tabKey) {
  document.querySelectorAll('.module-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabKey) {
      btn.className = 'module-tab-btn px-3 py-2.5 rounded-lg text-xs font-bold transition bg-cyan-500 text-slate-950 shadow flex items-center justify-center gap-1.5';
    } else {
      btn.className = 'module-tab-btn px-3 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center justify-center gap-1.5';
    }
  });

  document.querySelectorAll('.module-tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const target = document.getElementById(`tabPanel-${tabKey}`);
  if (target) target.classList.remove('hidden');
}
