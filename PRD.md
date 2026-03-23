🚕 Ürün Gereksinim Dokümanı (PRD): GeoDurak
Proje Adı: GeoDurak

Versiyon: 1.0.0

Hazırlayan: Full Stack Developer (Umut)

Tarih: 23 Mart 2026

1. Ürün Vizyonu
GeoDurak, geleneksel taksi duraklarını GPS ve Geofence teknolojileriyle dijitalleştiren bir yönetim ekosistemidir. Fiziksel buton, telsiz karmaşası ve "sıra kavgası" sorunlarını ortadan kaldırarak; şeffaf, otomatik ve konum tabanlı bir durak yönetimi sunar.

Motto: "Sınırın İçinde, Sıranın Başında!"

2. Temel Özellikler (Core Features)
📍 2.1. Akıllı Geofence Kontrolü
Tanım: Durak etrafında belirlenen (örn: 100m) sanal sınırın yönetimi.

İşleyiş: Sürücünün koordinatları arka planda takip edilir. Sadece sınır içindeyken sisteme dahil olabilir.

Teknik Not: PostGIS koordinat sistemi ile Point-in-Polygon kontrolü yapılır.

📋 2.2. Dijital Sıra Yönetimi
Canlı Takip: Sürücüler sıradaki yerlerini, önlerindeki araç sayısını ve tahmini bekleme süresini uygulama üzerinden anlık görebilir.

Otomatik Giriş: Sınır içine giren sürücü "Sıraya Gir" butonuna basarak sıranın en sonuna dahil olur.

⚡ 2.3. Otomatik Denetim & İhraç
Sınır İhlali: Sürücü müşteri almadan veya izin almadan Geofence alanını terk ederse sistem uyarı gönderir.

Tolerans Süresi: Sınır dışına çıkan sürücüye 2 dakikalık "geri dön" süresi tanınır; aksi halde sıradan otomatik olarak düşürülür.

🖥️ 2.4. Durak Yönetim Paneli (Admin)
Dashboard: Duraktaki toplam araç, aktif sıra ve günlük tamamlanan sefer verilerini içeren web tabanlı panel.

Manuel Müdahale: Lastik patlaması, arıza veya özel izin durumlarında admin sırayı dondurabilir veya düzenleyebilir.

3. Teknik Gereksinimler
🛠 Teknoloji Yığını (Tech Stack)
Mobil: React Native (Cross-platform GPS desteği).

Backend: Node.js / NestJS (Yüksek trafikli socket bağlantıları için).

Veritabanı: PostgreSQL + PostGIS (Coğrafi veriler için).

Anlık Veri: Socket.io (Sıra güncellemeleri için).

Sunucu: Linux (Pardus veya Ubuntu Server).

📡 Donanım Gereksinimleri
Sürücüler için GPS ve internet bağlantısı olan bir akıllı telefon.

Durak merkezi için tercihen bir tablet veya akıllı ekran (Sıra paneli için).

4. Kullanıcı Hikayeleri (User Stories)
Sürücü: "Yemek yerken sıramı telefonumdan görebilmeliyim ki durağa boşuna gidip beklemeyeyim."

Yönetici: "Hangi aracın ne zaman sıradan çıktığını ve durağın günlük verimliliğini raporlayabilmeliyim."

Yeni Sürücü: "Durak sınırına girdiğimde kimseye sormadan sisteme dahil olabilmeliyim."

5. Yol Haritası (Roadmap)
[ ] Faz 1: MVP (Minimum Uygulanabilir Ürün) - Sadece Sıra ve Geofence.

[ ] Faz 2: Bildirim Sistemi - Sırası yaklaşan sürücüye "Hazırlan" bildirimi.

[ ] Faz 3: İstatistik Modülü - Python (Pandas/Matplotlib) ile aylık verimlilik raporları.

[ ] Faz 4: Ödeme Entegrasyonu - Durak aidatlarının uygulama üzerinden toplanması.

6. Riskler ve Çözümler
GPS Sapması: Bazı telefonların konum verisi hatalı olabilir.

Çözüm: Konum verisi alınırken "Yüksek Doğruluk" (High Accuracy) modu zorunlu tutulacak.

İnternet Kesintisi: Sürücü tünel veya otopark gibi yerlerde sinyal kaybedebilir.

Çözüm: Kısa süreli kopmalar için sıradan çıkarma işlemi hemen değil, belirli bir timeout sonrası yapılacak.