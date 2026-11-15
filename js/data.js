// ============================================================================
// BLOK 1: VERİ KATMANI (CHÓKWÈ, MOZAMBİK - OCAK 2026 JEauZAMSAL & HİDROLOJİK VERİLER)
// ============================================================================

const CHOKWE_CENTER = [-24.5300, 32.9800];

// Scenarios based on NASA NISAR (Jan 5 & Jan 17, 2026) & Copernicus EMSR857
const SCENARIOS = {
  pre: {
    id: 'pre',
    name: '05 Ocak 2026 (Taşkın Öncesi Referans - NISAR Pass 1)',
    waterLevel: 0.8,
    slopeLimit: 5.0,
    rainfallMm: 42,
    soilMoisturePct: 58.4,
    dischargeM3s: 620,
    floodAreaKm2: 38.5,
    polygonCount: 84,
    memoryOverlapPct: 31.0,
    alertText: 'NORMAL İZLEME • NEHİR YATAĞI İÇİNDE AKIŞ'
  },
  onset: {
    id: 'onset',
    name: '12 Ocak 2026 (Macarretane Kapak Deşarjı & İlk Taşkın)',
    waterLevel: 2.3,
    slopeLimit: 5.0,
    rainfallMm: 146,
    soilMoisturePct: 86.5,
    dischargeM3s: 2890,
    floodAreaKm2: 412.8,
    polygonCount: 510,
    memoryOverlapPct: 74.2,
    alertText: 'SEVİYE 3 TURUNCU ALARM • 4º BAIRRO VE KÖPRÜ RİSKİ'
  },
  peak: {
    id: 'peak',
    name: '17 Ocak 2026 (EMSR857 & NISAR Zirve Taşkın - 847.3 km²)',
    waterLevel: 3.4,
    slopeLimit: 5.0,
    rainfallMm: 218,
    soilMoisturePct: 94.2,
    dischargeM3s: 4850,
    floodAreaKm2: 847.3,
    polygonCount: 935,
    memoryOverlapPct: 88.6,
    alertText: 'EMSR857 AKTİF TAŞKIN • SEVİYE 4 KIRMIZI ALARM'
  },
  extreme: {
    id: 'extreme',
    name: 'Süper Taşkın Simülasyonu (2000 Siklon Eline Ölçeği + Tam Deşarj)',
    waterLevel: 4.8,
    slopeLimit: 6.5,
    rainfallMm: 310,
    soilMoisturePct: 98.9,
    dischargeM3s: 7400,
    floodAreaKm2: 1124.6,
    polygonCount: 1280,
    memoryOverlapPct: 96.4,
    alertText: 'FELAKET SENARYOSU • TÜM OVALAR VE TRAFOLAR SU ALTINDA'
  }
};

// EDM Electrical Substations & Transformers in Chókwè District
const SUBSTATIONS_DATA = [
  {
    id: 'EDM-TR01',
    name: 'EDM Chókwè Merkez & 4º Bairro Dağıtım Trafosu',
    voltage: '33/11 kV',
    coords: [-24.5285, 32.9845],
    baseElevationM: 1.4, // Flood threshold water level (m)
    hazardRadiusM: 550,
    bairro: '4º Bairro (Düşük Kot Çukuru)',
    connectedLoads: 'Chókwè Çarşısı, 4. Mahalle Konutları (4,200 Abone)',
    isolated: false
  },
  {
    id: 'EDM-TR02',
    name: 'CIS Ana Sulama Pompa İstasyonu Trafo Merkezi',
    voltage: '33 kV Endüstriyel',
    coords: [-24.5160, 32.9710],
    baseElevationM: 1.6,
    hazardRadiusM: 600,
    bairro: 'Kuzeybatı Sulama Kanalı (CIS)',
    connectedLoads: '45 m³/s Limpopo Ana Kanal Pompaları, Pirinç Tavaları',
    isolated: false
  },
  {
    id: 'EDM-TR03',
    name: 'Guijá – Limpopo Köprü Geçişi Yüksek Gerilim Pilonu',
    voltage: '66 kV İletim Hattı',
    coords: [-24.5045, 32.9965],
    baseElevationM: 1.9,
    hazardRadiusM: 500,
    bairro: 'N221 Limpopo Nehir Yatağı',
    connectedLoads: 'Chókwè–Guijá Kuzey İletim Bağlantısı',
    isolated: false
  },
  {
    id: 'EDM-TR04',
    name: 'Hospital Rural de Chókwè & Centro de Saúde Trafo Düğümü',
    voltage: '11 kV Kritik Sağlık',
    coords: [-24.5349, 33.0054],
    baseElevationM: 2.6,
    hazardRadiusM: 420,
    bairro: '5º Bairro / Doğu Sağlık Yerleşkesi',
    connectedLoads: 'Hospital Rural de Chókwè, Ameliyathane, Soğuk Zincir',
    isolated: false
  },
  {
    id: 'EDM-TR05',
    name: '5º Bairro & CFM Demiryolu İstasyonu Dağıtım Trafosu',
    voltage: '11 kV Şehir Şebekesi',
    coords: [-24.5395, 32.9915],
    baseElevationM: 2.2,
    hazardRadiusM: 450,
    bairro: '5º Bairro (%10.3 HEC-RAS Risk)',
    connectedLoads: 'CFM Limpopo Demiryolu Sinyalizasyon ve 5. Mahalle',
    isolated: false
  },
  {
    id: 'EDM-TR06',
    name: 'Macarretane Barajı Hidro-Kontrol ve Kapak Trafosu',
    voltage: '33 kV Baraj Otomasyon',
    coords: [-24.4083, 32.8789],
    baseElevationM: 3.1,
    hazardRadiusM: 480,
    bairro: 'Macarretane (Aldeia da Barragem)',
    connectedLoads: 'Baraj Savak Kapak Motorları, ARA-Sul Telemetri',
    isolated: false
  },
  {
    id: 'EDM-TR07',
    name: 'Lionde Ana Trafo Merkezi (Subestação de Lionde / ISPG)',
    voltage: '110/33 kV Bölgesel Merkez',
    coords: [-24.5881, 33.0606],
    baseElevationM: 4.5,
    hazardRadiusM: 380,
    bairro: 'Lionde Yüksek Kot Bölgesi',
    connectedLoads: 'ISPG Kampüsü, Chiaquelane İnsani Yardım Koridoru',
    isolated: false
  }
];

// Road Network & Evacuation Corridors in Chókwè
const ROADS_DATA = [
  {
    id: 'RD-N221',
    name: 'N221 Chókwè – Guijá (Caniçado) Limpopo Köprü Yolu',
    type: 'Ana Bölgesel Karayolu',
    thresholdLevelM: 1.5,
    electroSubstationId: 'EDM-TR03',
    coords: [
      [-24.5300, 32.9800],
      [-24.5210, 32.9890],
      [-24.5090, 32.9950],
      [-24.5000, 33.0000]
    ],
    notes: 'Limpopo Nehri taşkın yatağı üzerinde; su hızı 2.8 m/s, köprü ayakları su altında.'
  },
  {
    id: 'RD-R448',
    name: 'R448 Macarretane Barajı – Chókwè Kuzeybatı Nehir Yolu',
    type: 'Baraj Erişim ve Sulama Koridoru',
    thresholdLevelM: 1.7,
    electroSubstationId: 'EDM-TR02',
    coords: [
      [-24.4083, 32.8789],
      [-24.4520, 32.9180],
      [-24.4910, 32.9520],
      [-24.5160, 32.9710],
      [-24.5300, 32.9800]
    ],
    notes: 'CIS ana sulama kanalı taşması nedeniyle yol gövdesi yarıldı; giriş-çıkış imkansız.'
  },
  {
    id: 'RD-B4',
    name: '4º Bairro Çarşı – Limpopo Kıyı Bulvarı (Şehir İçi)',
    type: 'Kentsel Düşük Kot Arteri',
    thresholdLevelM: 1.3,
    electroSubstationId: 'EDM-TR01',
    coords: [
      [-24.5230, 32.9760],
      [-24.5285, 32.9845],
      [-24.5335, 32.9930]
    ],
    notes: 'HEC-RAS modeline göre %25.2 kronik taşkın çukuru + EDM-TR01 elektrik kaçak akım alanı.'
  },
  {
    id: 'RD-HOSP',
    name: 'Chókwè Merkez – Hospital Rural de Chókwè Doğu Bağlantısı',
    type: 'Acil Sağlık Erişim Yolu',
    thresholdLevelM: 2.4,
    electroSubstationId: 'EDM-TR04',
    coords: [
      [-24.5300, 32.9800],
      [-24.5325, 32.9940],
      [-24.5349, 33.0054]
    ],
    notes: 'Su seviyesi 2.4m üstüne çıktığında amfibik bot (INGD) dışında sivil araç girişine kapalı.'
  },
  {
    id: 'RD-CFM',
    name: 'CFM Limpopo Demiryolu Hattı (Macarretane – Chókwè – Lionde)',
    type: 'Ulusal Demiryolu Koridoru',
    thresholdLevelM: 2.0,
    electroSubstationId: 'EDM-TR05',
    coords: [
      [-24.4150, 32.8850],
      [-24.4850, 32.9480],
      [-24.5395, 32.9915],
      [-24.5920, 33.0550]
    ],
    notes: 'Ocak 2026 taşkınında balast erozyonu nedeniyle CFM seferleri durduruldu (3 Milyon USD hasar).'
  },
  {
    id: 'RD-B6',
    name: '5º ve 6º Bairro Güney Tarım Kanalları Yolu',
    type: 'Tali Tahliye Yolu',
    thresholdLevelM: 2.7,
    electroSubstationId: 'EDM-TR05',
    coords: [
      [-24.5395, 32.9915],
      [-24.5520, 32.9860],
      [-24.5640, 33.0020]
    ],
    notes: 'Tahliye kanalları geri tepme (backwater) etkisinde; ağır vasıta hariç geçiş tehlikeli.'
  },
  {
    id: 'RD-SAFE1',
    name: 'EN101 / R208 Chókwè (1º Bairro) – Lionde Yüksek Kot Tahliye Yolu',
    type: 'Birincil Güvenli Tahliye Koridoru',
    thresholdLevelM: 4.9,
    electroSubstationId: 'EDM-TR07',
    coords: [
      [-24.5340, 32.9770],
      [-24.5550, 33.0080],
      [-24.5730, 33.0360],
      [-24.5881, 33.0606]
    ],
    notes: 'NASADEM verilerine göre yüksek sırt hattı; sivil tahliye ve yardım konvoyları için AÇIK.'
  },
  {
    id: 'RD-SAFE2',
    name: 'EN101 Lionde – Chiaquelane Kalıcı İnsani Yardım Kampı Koridoru',
    type: 'Ana Tahliye Koridoru (Güney)',
    thresholdLevelM: 5.5,
    electroSubstationId: 'EDM-TR07',
    coords: [
      [-24.5881, 33.0606],
      [-24.6140, 33.0890],
      [-24.6450, 33.1150]
    ],
    notes: '2000, 2013 ve 2026 afetlerinde su basmayan en güvenli yüksek tahliye koridoru.'
  }
];

// Hydrological Flow Routes (D8 Flow Direction from NASADEM S25/S26)
const FLOW_ROUTES_DATA = [
  {
    name: 'Limpopo Ana Yatağı Deşarj Akışı (Macarretane → Guijá → Chókwè Doğu)',
    velocityMs: 3.1,
    coords: [
      [-24.4083, 32.8789],
      [-24.4420, 32.9260],
      [-24.4780, 32.9680],
      [-24.5000, 33.0000],
      [-24.5280, 33.0250],
      [-24.5650, 33.0750]
    ]
  },
  {
    name: 'Chókwè Ana Sulama Kanalı (CIS) Taşkın Yarığı (Macarretane → 4º Bairro → 5º Bairro)',
    velocityMs: 2.6,
    coords: [
      [-24.4250, 32.8920],
      [-24.4750, 32.9410],
      [-24.5160, 32.9710],
      [-24.5285, 32.9845],
      [-24.5395, 32.9915],
      [-24.5580, 33.0120]
    ]
  },
  {
    name: 'Doğu Taşkın Ovası Yayılım Kolu (Guijá → Hospital Rural de Chókwè Çukuru)',
    velocityMs: 2.2,
    coords: [
      [-24.5000, 33.0000],
      [-24.5190, 32.9980],
      [-24.5349, 33.0054],
      [-24.5520, 33.0280]
    ]
  }
];

// Historical Flood Memory Bank (2000, 2013, HEC-RAS, plus user-saved entries)
const DEFAULT_MEMORY_RECORDS = [
  {
    id: 'MEM-2000',
    year: 'Şubat 2000',
    title: 'Siklon Eline & Gloria Tarihsel Rekor Limpopo Taşkını',
    peakLevelM: 5.1,
    areaKm2: 1120.0,
    affectedBairros: 'Tüm Chókwè (1º–6º Bairro), Guijá, Macarretane, Hospital Rural',
    recurrenceLessons: 'Hospital Rural de Chókwè jeneratör ve ameliyathanesi tamamen su altında kaldı; 23,140 kişi tahliye edildi. Chiaquelane yüksek kampı kuruldu.',
    sourceUrl: 'https://www.unocha.org/publications/report/mozambique/mozambique-floods-ocha-situation-report-no-17',
    polygon: [
      [-24.3950, 32.8650],
      [-24.4550, 32.9850],
      [-24.5150, 33.0480],
      [-24.5750, 33.0650],
      [-24.5780, 32.9680],
      [-24.5100, 32.9100]
    ],
    color: '#a855f7'
  },
  {
    id: 'MEM-2013',
    year: 'Ocak 2013',
    title: '2013 Aşağı Limpopo Taşkını (NASA EO-1 / Terra MODIS Hafızası)',
    peakLevelM: 3.8,
    areaKm2: 790.4,
    affectedBairros: '4º Bairro, 5º Bairro, 6º Bairro, Guijá N221 Köprüsü',
    recurrenceLessons: '100 mahalle (bairro) birimi sular altında kaldı; 2026 taşkın poligonlarıyla %88.6 uzamsal örtüşme göstererek erken uyarıda referans alındı.',
    sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/close-up-of-flooding-in-mozambique-80297/',
    polygon: [
      [-24.4050, 32.8750],
      [-24.4700, 32.9780],
      [-24.5200, 33.0320],
      [-24.5620, 33.0420],
      [-24.5580, 32.9720],
      [-24.4950, 32.9250]
    ],
    color: '#c084fc'
  },
  {
    id: 'MEM-HECRAS',
    year: 'HEC-RAS (2–25 Yıl)',
    title: 'Chókwè Belediyesi HEC-RAS + CBS Mahalle Duyarlılık Hafızası',
    peakLevelM: 2.5,
    areaKm2: 310.0,
    affectedBairros: '4º Bairro (%25.2 alan, 2m kot), 5º Bairro (%10.3), 6º Bairro (%8.0), 1º Bairro (%2.7)',
    recurrenceLessons: 'Yağmur suyu drenaj havzası dolduğunda ilk olarak 4º Bairro (EDM-TR01 çevresi) ve 5º Bairro sular altında kalmaktadır.',
    sourceUrl: 'https://www.researchgate.net/publication/392064312_Modelling_and_Mapping_of_Hydrological_Flood_Risk_Areas_A_Case_Study_of_Chokwe_City_Mozambique',
    polygon: [
      [-24.5180, 32.9720],
      [-24.5220, 33.0020],
      [-24.5480, 33.0080],
      [-24.5490, 32.9780]
    ],
    color: '#f472b6'
  },
  {
    id: 'MEM-2026-SAR',
    year: '17 Ocak 2026',
    title: 'PentEarth Sentinel-1 & NISAR Otsu Eşikleme + NASADEM Kaydı',
    peakLevelM: 3.4,
    areaKm2: 847.3,
    affectedBairros: '935 Poligon — Chókwè, Guijá, Macarretane, CFM Demiryolu',
    recurrenceLessons: 'GPM yağış verisi (218 mm) ve GLDAS toprak nemi (%94.2) doygunluğu sonrası Copernicus EMSR857 ile doğrulanan aktif afet izi.',
    sourceUrl: 'https://mapping.emergency.copernicus.eu/activations/EMSR857/',
    polygon: [
      [-24.4020, 32.8720],
      [-24.4620, 32.9720],
      [-24.5120, 33.0350],
      [-24.5680, 33.0480],
      [-24.5610, 32.9740],
      [-24.4980, 32.9220]
    ],
    color: '#22d3ee'
  }
];

// Initial Official Dispatches to Authorities
const INITIAL_DISPATCHES = [
  {
    id: 'DSP-104',
    time: '17 Oca 2026 • 14:20 UTC',
    agency: 'EDM (Electricidade de Moçambique - SCADA)',
    priority: 'KIRMIZI KOD (ACİL MÜDAHALE)',
    coords: '-24.5285, 32.9845',
    message: '4º Bairro (EDM-TR01) ve CIS Pompa İstasyonu (EDM-TR02) trafolarında taşkın derinliği 2.8m seviyesine ulaştı. 550m yarıçaplı Elektrik Çarpma Yasaklı Bölgesi ilan edildi; uzaktan kesici açılması talep edildi.'
  },
  {
    id: 'DSP-103',
    time: '17 Oca 2026 • 13:55 UTC',
    agency: 'ANE & PRM (Karayolları İdaresi & Trafik Polisi)',
    priority: 'TURUNCU KOD (TAHLİYE & KAPAMA)',
    coords: '-24.5045, 32.9965',
    message: 'N221 Guijá–Chókwè Limpopo Köprüsü ve R448 Macarretane yolu su basması nedeniyle giriş-çıkışa kapatıldı. Tüm tahliye trafiği EN101 Lionde–Chiaquelane yüksek koridoruna yönlendirildi.'
  },
  {
    id: 'DSP-102',
    time: '17 Oca 2026 • 12:40 UTC',
    agency: 'INGD / CENOE (Ulusal Afet Yönetimi & Bot Kurtarma)',
    priority: 'KIRMIZI KOD (ACİL MÜDAHALE)',
    coords: '-24.5349, 33.0054',
    message: 'Tarihsel sel hafızası (2000 & 2013) ile örtüşen 4º ve 5º Bairro çukurlarında mahsur kalan siviller için 14 bot ve 4 helikopterin (AIM/INGD filosu) yüksek gerilim tellerinden arındırılmış koridorlardan sevk edilmesi.'
  },
  {
    id: 'DSP-101',
    time: '16 Oca 2026 • 21:10 UTC',
    agency: 'ARA-Sul (Güney Bölgesi Su & Macarretane Barajı)',
    priority: 'SARI KOD (ÖNLEYİCİ İZLEME)',
    coords: '-24.4083, 32.8789',
    message: 'NASA GPM yağış birikimi 195 mm ve GLDAS kök bölgesi toprak nemi %92 eşik değerini aştı. Macarretane Barajı deşarj vektörü Chókwè merkezine 6 saat içinde ulaşacak.'
  }
];
