# DtComb - Hızlı Başlangıç Rehberi

## 🚀 Kurulum ve Çalıştırma

### 1. Environment Dosyasını Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını açın ve aşağıdaki değerleri değiştirin:

```env
# Güvenli bir secret key oluşturun
SECRET_KEY=your-generated-secret-key-here

# Admin şifresini değiştirin
ADMIN_PASSWORD=your-secure-password-here
```

**Secret Key Oluşturma:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Docker ile Çalıştırma (Önerilen)

```bash
# Image'ı build et
docker-compose build

# Uygulamayı başlat
docker-compose up -d

# Logları takip et
docker-compose logs -f
```

Uygulama şu adreste çalışacak: http://localhost:8000

### 3. Lokal Geliştirme Ortamı

```bash
# Virtual environment oluştur
python -m venv venv

# Aktif et (Windows)
venv\Scripts\activate

# Aktif et (Linux/Mac)
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Uygulamayı başlat
python main.py
```

## 📊 Kullanım

### Giriş Yapma

1. http://localhost:8000/login adresine gidin
2. Kullanıcı adı: `admin` (veya .env'deki ADMIN_USERNAME)
3. Şifre: `.env` dosyasındaki ADMIN_PASSWORD

### Analiz Yapma

1. **Data Upload** sayfasından veri yükleyin veya örnek veri seçin
2. **Analysis** sayfasında:
   - Fonksiyon ve metod seçin
   - Parametreleri ayarlayın
   - "Analyze" butonuna tıklayın
3. Sonuçları görüntüleyin ve indirin

## 🔍 Health Check

```bash
# Uygulama çalışıyor mu kontrol et
curl http://localhost:8000/health

# Beklenen yanıt:
# {"status":"healthy","service":"dtcomb-api","version":"1.0.0"}
```

## 🧪 Test Çalıştırma

```bash
# Tüm testleri çalıştır
pytest tests/ -v

# Coverage ile
pytest tests/ --cov=app --cov-report=html

# Sonuçları görüntüle
# htmlcov/index.html dosyasını tarayıcıda aç
```

## 🛠️ Geliştirme Komutları

```bash
# Kod formatla
black app/ main.py --line-length=120

# Linting
flake8 app/ --max-line-length=120

# Makefile ile (eğer make yüklüyse)
make install    # Bağımlılıkları yükle
make test       # Testleri çalıştır
make lint       # Linting yap
make format     # Kod formatla
```

## 📝 API Dokümantasyonu

Debug mode aktifken:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ⚠️ Önemli Notlar

### Güvenlik

1. **Asla .env dosyasını commit etmeyin!**
2. Production'da mutlaka güçlü şifreler kullanın
3. SECRET_KEY'i güvenli bir şekilde saklayın
4. HTTPS kullanın (production)

### Production Deployment

Production'a deploy etmeden önce:

```env
# .env dosyasında
DEBUG=False
SECRET_KEY=very-long-and-secure-key
ADMIN_PASSWORD=very-secure-password
```

### Docker İpuçları

```bash
# Container'a bağlan
docker exec -it dtcomb_app bash

# R'ı test et
docker exec -it dtcomb_app R --version

# Logları temizle
docker-compose down -v

# Yeniden build et (cache kullanmadan)
docker-compose build --no-cache
```

## 🐛 Sorun Giderme

### Port zaten kullanımda

```bash
# Windows'ta 8000 portunu kullanan process'i bul
netstat -ano | findstr :8000

# Process'i kapat (PID ile)
taskkill /PID <process_id> /F
```

### R paketleri yüklenemiyor

Container içinde:
```bash
docker exec -it dtcomb_app bash
R
# R console'da:
install.packages("dtComb")
```

### Database hataları

```bash
# SQLite database'i sıfırla (dikkat: tüm veriyi siler!)
rm app/db/dtcomb_data.db
# Uygulamayı yeniden başlat
```

## 📚 Daha Fazla Bilgi

- [README.md](README.md) - Detaylı dokümantasyon
- [CONTRIBUTING.md](CONTRIBUTING.md) - Katkı rehberi
- [SECURITY.md](SECURITY.md) - Güvenlik politikaları
- [PROJE_ANALIZ_RAPORU.md](PROJE_ANALIZ_RAPORU.md) - Proje analizi

## 💬 Destek

Sorun bildirmek için GitHub Issues kullanın.

---

**Hazır!** 🎉 Artık DtComb'u kullanmaya başlayabilirsiniz.

