# Docker ile Hızlı Başlangıç (Windows)
# rpy2 kurulum sorunlarından kaçınmak için Docker kullanın!

Write-Host "=== DtComb - Docker ile Hızlı Başlangıç ===" -ForegroundColor Cyan
Write-Host ""

# 1. Docker kontrolü
Write-Host "1. Docker kontrol ediliyor..." -ForegroundColor Yellow
try {
    $docker_version = docker --version
    Write-Host "   ✓ Docker bulundu: $docker_version" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Docker Desktop'ı indirin ve kurun:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# 2. Docker Compose kontrolü
Write-Host ""
Write-Host "2. Docker Compose kontrol ediliyor..." -ForegroundColor Yellow
try {
    $compose_version = docker-compose --version
    Write-Host "   ✓ Docker Compose bulundu: $compose_version" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker Compose bulunamadı!" -ForegroundColor Red
    Write-Host "   Docker Desktop güncel sürümünü kullanın" -ForegroundColor Yellow
    exit 1
}

# 3. .env dosyası kontrolü
Write-Host ""
Write-Host "3. .env dosyası kontrol ediliyor..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ .env dosyası mevcut" -ForegroundColor Green
} else {
    Write-Host "   ! .env dosyası bulunamadı, oluşturuluyor..." -ForegroundColor Yellow

    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   ✓ .env dosyası oluşturuldu" -ForegroundColor Green
        Write-Host ""
        Write-Host "   ⚠️  ÖNEMLİ: .env dosyasını düzenleyin!" -ForegroundColor Red
        Write-Host "   - SECRET_KEY değiştirin" -ForegroundColor Yellow
        Write-Host "   - ADMIN_PASSWORD değiştirin" -ForegroundColor Yellow
        Write-Host ""

        # Secret key oluştur
        Write-Host "   Secret key oluşturuluyor..." -ForegroundColor Cyan
        $secret_key = python -c "import secrets; print(secrets.token_urlsafe(32))"
        if ($secret_key) {
            Write-Host "   Yeni SECRET_KEY: $secret_key" -ForegroundColor Green
            Write-Host "   Bu değeri .env dosyasına kopyalayın" -ForegroundColor Yellow
        }

        Write-Host ""
        $continue = Read-Host ".env dosyasını düzenlediniz mi? Devam etmek için 'Y' basın"
        if ($continue -ne 'Y' -and $continue -ne 'y') {
            Write-Host "   Kurulum iptal edildi. Önce .env dosyasını düzenleyin." -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "   ✗ .env.example dosyası bulunamadı!" -ForegroundColor Red
        exit 1
    }
}

# 4. Docker image build
Write-Host ""
Write-Host "4. Docker image build ediliyor..." -ForegroundColor Yellow
Write-Host "   (Bu işlem ilk seferde 10-15 dakika sürebilir)" -ForegroundColor Cyan
Write-Host ""

try {
    docker-compose build
    Write-Host ""
    Write-Host "   ✓ Docker image başarıyla build edildi!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ✗ Build başarısız!" -ForegroundColor Red
    Write-Host "   Logları kontrol edin: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

# 5. Container'ı başlat
Write-Host ""
Write-Host "5. Container başlatılıyor..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "   ✓ Container başlatıldı!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Container başlatılamadı!" -ForegroundColor Red
    Write-Host "   Logları kontrol edin: docker-compose logs -f" -ForegroundColor Yellow
    exit 1
}

# 6. Sağlık kontrolü (30 saniye bekle)
Write-Host ""
Write-Host "6. Container hazırlanıyor..." -ForegroundColor Yellow
Write-Host "   (30 saniye bekleniyor...)" -ForegroundColor Cyan

for ($i = 1; $i -le 30; $i++) {
    Write-Progress -Activity "Container başlatılıyor" -Status "$i/30 saniye" -PercentComplete (($i / 30) * 100)
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Container başlatılıyor" -Completed

Write-Host ""
Write-Host "7. Health check yapılıyor..." -ForegroundColor Yellow
$max_retries = 5
$retry_count = 0
$health_ok = $false

while ($retry_count -lt $max_retries -and -not $health_ok) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $health_ok = $true
            Write-Host "   ✓ Uygulama çalışıyor!" -ForegroundColor Green
        }
    } catch {
        $retry_count++
        if ($retry_count -lt $max_retries) {
            Write-Host "   ! Deneme $retry_count/$max_retries başarısız, tekrar deneniyor..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

if (-not $health_ok) {
    Write-Host "   ✗ Health check başarısız!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logları kontrol edin:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Container durumunu kontrol edin:" -ForegroundColor Yellow
    Write-Host "   docker-compose ps" -ForegroundColor Cyan
    exit 1
}

# Başarı mesajı
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "     ✓ DtComb BAŞARIYLA BAŞLATILDI!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Web Arayüzü:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Admin Paneli:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000/admin" -ForegroundColor White
Write-Host "   Kullanıcı: admin" -ForegroundColor White
Write-Host "   Şifre: (.env dosyasındaki ADMIN_PASSWORD)" -ForegroundColor White
Write-Host ""
Write-Host "📊 API Dokümantasyonu (DEBUG modunda):" -ForegroundColor Cyan
Write-Host "   http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Yararlı komutlar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Logları görüntüle:" -ForegroundColor White
Write-Host "    docker-compose logs -f" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Container'ı durdur:" -ForegroundColor White
Write-Host "    docker-compose down" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Container'ı yeniden başlat:" -ForegroundColor White
Write-Host "    docker-compose restart" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Container içine gir:" -ForegroundColor White
Write-Host "    docker exec -it dtcomb_app bash" -ForegroundColor Cyan
Write-Host ""
Write-Host "  R'ı test et:" -ForegroundColor White
Write-Host "    docker exec -it dtcomb_app R --version" -ForegroundColor Cyan
Write-Host ""
Write-Host "Yardım için: QUICKSTART.md" -ForegroundColor Yellow
Write-Host ""

# Tarayıcıda aç?
$open_browser = Read-Host "Tarayıcıda açmak ister misiniz? (Y/N)"
if ($open_browser -eq 'Y' -or $open_browser -eq 'y') {
    Start-Process "http://localhost:8000"
}

