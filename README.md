# 🌍 PentEarth — Chókwè 2026 Taşkın Hafızası, Yol Güvenliği ve Elektrik Tehlike Erken Uyarı Sistemi

**PentEarth**, **NASA Space Apps Challenge 2026** kapsamında Mozambik'in Gaza Eyaleti'ndeki **Chókwè (Aşağı Limpopo Havzası)** taşkınlarını izlemek, geçmiş sel izleriyle karşılaştırmak ve su altındaki elektrik şebekesi kaynaklı kaçak akım tehlikelerini önlemek amacıyla geliştirilmiş açık kaynaklı bir karar destek ve erken uyarı platformudur.

---

## 🚀 Temel Özellikler

1. **🌊 Uydu Tabanlı Aktif Taşkın Haritalama (`Sentinel-1` & `NISAR`)**:
   - Ocak 2026 Chókwè taşkın yayılımını (`847.3 km²`, `935 poligon`) ve `NASADEM S25/S26` eğim filtrelemesini gerçek zamanlı görselleştirir.
   - [Copernicus EMSR857](https://mapping.emergency.copernicus.eu/activations/EMSR857/) verileriyle doğrulanmış taşkın poligonlarını içerir.
2. **⚡ Elektrik Çarpma Tehlikesi ve SCADA İzolasyon Motoru**:
   - Chókwè genelindeki 7 kritik **EDM (Electricidade de Moçambique)** trafo merkezinin kaide kotlarını anlık su seviyesi ile karşılaştırır.
   - Su altında kalan trafoların çevresinde dinamik **Kaçak Akım Yasaklı Bölgesi (Exclusion Zone)** oluşturur ve tek tıkla uzaktan SCADA enerjisini kesme simülasyonu sunar.
3. **🚧 Kapanan Yollar ve Güvenli Tahliye Rota Hesaplayıcı**:
   - Su derinliği ve elektrik riski nedeniyle kapanan karayollarını (`N221 Guijá Köprüsü`, `R448 Macarretane Yolu`, `4º Bairro`) otomatik işaretler.
   - Mahsur kalan bölgelerden `EN101 Lionde – Chiaquelane` yüksek kotlu güvenli insani yardım kampına tehlikeden arındırılmış tahliye rotası çizer.
4. **🧠 Uzamsal Sel Hafıza Bankası (2000 • 2013 • 2026)**:
   - Şubat 2000 Siklon Eline (`1,120 km²`), Ocak 2013 Limpopo Taşkını (`790.4 km²`) ve [Chókwè HEC-RAS Mahalle Duyarlılık Modeli](https://www.researchgate.net/publication/392064312_Modelling_and_Mapping_of_Hydrological_Flood_Risk_Areas_A_Case_Study_of_Chokwe_City_Mozambique) verilerini hafızada tutarak yeni taşkın gözlemlerini kaydetmeyi sağlar.
5. **📡 Kurumlar Arası Acil Durum İhbar Sistemi (`INGD`, `EDM`, `ANE`, `ARA-Sul`, `MISAU`)**:
   - Koordinatlı tehlike ve yol kapama paketlerini ilgili acil durum birimlerine iletir.

---

## 📂 Modüler Proje Mimari Yapısı

Kod tabanı okunabilirlik ve sürdürülebilirlik için işlevsel bloklara ayrılmıştır:

```text
PentEarth/
├── index.html          # Sadeleştirilmiş, yüksek okunabilirlikli ana kullanıcı arayüzü
├── css/
│   └── styles.css      # Harita boyutlandırması, akış animasyonları ve özel tema stilleri
├── js/
│   ├── data.js         # Chókwè 2026 senaryo, trafo, yol, akış vektörü ve tarihsel hafıza veri setleri
│   ├── state.js        # Uygulama durumu (appState) ve localStorage kalıcılık yönetimi
│   ├── map.js          # Leaflet CBS harita başlatma, nokta denetçisi, katman çizimi ve güvenli rota motoru
│   ├── charts.js       # Chart.js hidrolojik zaman serisi ve mahalle risk karşılaştırma grafikleri
│   ├── ui.js           # KPI kartları, trafo/yol/hafıza/ihbar listeleri ve bildirim (toast) bileşenleri
│   └── app.js          # Olay dinleyicileri (event bindings), senaryo geçişleri ve uygulama başlatıcı
├── .gitignore          # Git sürüm kontrolü hariç tutma kuralları
├── LICENSE             # MIT Açık Kaynak Lisansı
└── README.md           # Proje dokümantasyonu ve kurulum rehberi
```

---

## 🛠️ Kurulum ve Çalıştırma

Proje tamamen istemci taraflı (vanilla HTML5, Tailwind CSS CDN, Leaflet.js ve Chart.js) olarak yapılandırılmıştır; ek bir derleme adımı gerektirmez.

```bash
# 1. Depoyu klonlayın
git clone https://github.com/ebrar-eng/PentEarth.git
cd PentEarth

# 2. Yerel bir HTTP sunucusu ile başlatın (veya doğrudan index.html dosyasını tarayıcıda açın)
python3 -m http.server 8000
```

Ardından tarayıcınızda `http://localhost:8000` adresine giderek **PentEarth** komuta arayüzünü kullanabilirsiniz.

---

## 🛰️ Doğrulanmış Açık Veri Kaynakları

- [NASA/ISRO NISAR L-Band SAR (05–17 Ocak 2026)](https://svs.gsfc.nasa.gov/5661)
- [ESA/NASA Sentinel-1A OPERA RTC](https://www.earthdata.nasa.gov/news/worldview-image-archive/flooding-mozambique)
- [Copernicus Emergency Management Service — EMSR857](https://mapping.emergency.copernicus.eu/activations/EMSR857/)
- [NASA Earth Observatory — Southern Mozambique Floods (GPM & NASADEM)](https://science.nasa.gov/earth/earth-observatory/floods-inundate-southern-mozambique/)
- [Chókwè HEC-RAS Hidrolojik Taşkın Risk Modeli](https://www.researchgate.net/publication/392064312_Modelling_and_Mapping_of_Hydrological_Flood_Risk_Areas_A_Case_Study_of_Chokwe_City_Mozambique)
