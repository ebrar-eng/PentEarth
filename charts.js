// ============================================================================
// BLOK 4: VERİ GÖRSELLEŞTİRME VE GRAFİK MODÜLÜ (CHART.JS)
// ============================================================================

let hydroChartInstance = null;
let bairroChartInstance = null;

function initCharts() {
  const ctxHydro = document.getElementById('hydroChart').getContext('2d');
  hydroChartInstance = new Chart(ctxHydro, {
    type: 'line',
    data: {
      labels: ['05 Oca', '08 Oca', '11 Oca', '14 Oca', '17 Oca (Zirve)', '20 Oca', '24 Oca'],
      datasets: [
        {
          label: 'Taşkın Alanı (km² - Sentinel-1/NISAR)',
          data: [38.5, 112.0, 340.5, 615.2, 847.3, 760.4, 620.0],
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.15)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'Kümülatif GPM Yağış (mm)',
          data: [42, 78, 129, 184, 218, 232, 240],
          borderColor: '#38bdf8',
          borderDash: [5, 5],
          tension: 0.3,
          yAxisID: 'y1'
        },
        {
          label: 'GLDAS Toprak Nemi (%)',
          data: [58, 69, 82, 91, 94.2, 93, 89],
          borderColor: '#f59e0b',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#cbd5e1', font: { size: 11 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        },
        y: {
          position: 'left',
          title: { display: true, text: 'Alan (km²)', color: '#22d3ee', font: { size: 11 } },
          ticks: { color: '#22d3ee', font: { size: 11 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Yağış (mm) / Nem (%)', color: '#f59e0b', font: { size: 11 } },
          ticks: { color: '#f59e0b', font: { size: 11 } },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  const ctxBairro = document.getElementById('bairroRiskChart').getContext('2d');
  bairroChartInstance = new Chart(ctxBairro, {
    type: 'bar',
    data: {
      labels: ['4º Bairro', '5º Bairro', '6º Bairro', 'Guijá Köprü', '1º Bairro', 'Lionde'],
      datasets: [
        {
          label: 'HEC-RAS Tarihsel Sel Duyarlılığı (%)',
          data: [25.2, 10.3, 8.0, 22.5, 2.7, 0.8],
          backgroundColor: 'rgba(168, 85, 247, 0.75)',
          borderColor: '#c084fc',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: '2026 Anlık Elektrik & Taşkın Risk Skoru (0-100)',
          data: [96, 82, 68, 91, 34, 12],
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderColor: '#fbbf24',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#cbd5e1', font: { size: 11 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#cbd5e1', font: { size: 11 } },
          grid: { color: 'rgba(51, 65, 85, 0.3)' }
        }
      }
    }
  });
}

function updateCharts() {
  if (!hydroChartInstance || !bairroChartInstance) return;
  const wl = appState.waterLevelM;
  const ratio = wl / 3.4;

  hydroChartInstance.data.datasets[0].data[4] = +(appState.floodAreaKm2).toFixed(1);
  hydroChartInstance.data.datasets[1].data[4] = appState.rainfallMm;
  hydroChartInstance.data.datasets[2].data[4] = +(appState.soilMoisturePct).toFixed(1);
  hydroChartInstance.update();

  const tr01Isolated = appState.substations.find(s => s.id === 'EDM-TR01')?.isolated;
  const tr05Isolated = appState.substations.find(s => s.id === 'EDM-TR05')?.isolated;
  const tr03Isolated = appState.substations.find(s => s.id === 'EDM-TR03')?.isolated;

  bairroChartInstance.data.datasets[1].data = [
    Math.min(100, Math.round((tr01Isolated ? 55 : 96) * ratio)),
    Math.min(100, Math.round((tr05Isolated ? 48 : 82) * ratio)),
    Math.min(100, Math.round(68 * ratio)),
    Math.min(100, Math.round((tr03Isolated ? 52 : 91) * ratio)),
    Math.min(100, Math.round(34 * ratio)),
    Math.min(100, Math.round(12 * ratio))
  ];
  bairroChartInstance.update();
}
