# Windows rpy2 Kurulum Script
# Bu script R_HOME'u otomatik bulur ve ayarlar

Write-Host "=== DtComb - Windows rpy2 Kurulum Yardımcısı ===" -ForegroundColor Cyan
Write-Host ""

# 1. R'ın kurulu olup olmadığını kontrol et
Write-Host "1. R kurulumu kontrol ediliyor..." -ForegroundColor Yellow
try {
    $r_command = Get-Command R -ErrorAction Stop
    $r_path = $r_command.Source
    Write-Host "   ✓ R bulundu: $r_path" -ForegroundColor Green
} catch {
    Write-Host "   ✗ R bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Çözüm adımları:" -ForegroundColor Yellow
    Write-Host "1. R'ı buradan indirin: https://cran.r-project.org/bin/windows/base/" -ForegroundColor White
    Write-Host "2. Kurulum sırasında 'Add R to PATH' seçeneğini işaretleyin" -ForegroundColor White
    Write-Host "3. Bu scripti tekrar çalıştırın" -ForegroundColor White
    Write-Host ""
    Write-Host "YA DA Docker kullanın (önerilen):" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor White
    exit 1
}

# 2. R_HOME'u bul
Write-Host ""
Write-Host "2. R_HOME hesaplanıyor..." -ForegroundColor Yellow
$r_home = Split-Path (Split-Path $r_path)
Write-Host "   ✓ R_HOME: $r_home" -ForegroundColor Green

# 3. R.lib dosyasının varlığını kontrol et
Write-Host ""
Write-Host "3. R.lib dosyası kontrol ediliyor..." -ForegroundColor Yellow
$r_lib_path = Join-Path $r_home "bin\x64\R.lib"
if (Test-Path $r_lib_path) {
    Write-Host "   ✓ R.lib bulundu: $r_lib_path" -ForegroundColor Green
} else {
    Write-Host "   ✗ R.lib bulunamadı: $r_lib_path" -ForegroundColor Red
    Write-Host "   R'ı tam kurulum yaparak yeniden kurun" -ForegroundColor Yellow
    exit 1
}

# 4. Environment variables ayarla
Write-Host ""
Write-Host "4. Environment variables ayarlanıyor..." -ForegroundColor Yellow

# Geçici olarak bu session için
$env:R_HOME = $r_home
$env:PATH = "$r_home\bin\x64;$env:PATH"
Write-Host "   ✓ R_HOME ayarlandı (geçici)" -ForegroundColor Green

# Kalıcı olarak ayarla mı?
Write-Host ""
$response = Read-Host "Environment variables'ı kalıcı olarak ayarlamak ister misiniz? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    try {
        [System.Environment]::SetEnvironmentVariable("R_HOME", $r_home, "User")

        # PATH'e ekle (mevcut PATH'i koru)
        $current_path = [System.Environment]::GetEnvironmentVariable("PATH", "User")
        $r_bin_path = "$r_home\bin\x64"

        if ($current_path -notlike "*$r_bin_path*") {
            $new_path = "$r_bin_path;$current_path"
            [System.Environment]::SetEnvironmentVariable("PATH", $new_path, "User")
        }

        Write-Host "   ✓ Environment variables kalıcı olarak ayarlandı" -ForegroundColor Green
        Write-Host "   ! PowerShell'i yeniden başlatın" -ForegroundColor Yellow
    } catch {
        Write-Host "   ✗ Kalıcı ayarlama başarısız: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   ⊙ Sadece bu session için ayarlandı" -ForegroundColor Cyan
}

# 5. Virtual environment kontrolü
Write-Host ""
Write-Host "5. Virtual environment kontrol ediliyor..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "   ✓ venv bulundu" -ForegroundColor Green

    # venv'i aktif et
    Write-Host ""
    Write-Host "Virtual environment aktif ediliyor..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    Write-Host "   ✓ venv aktif" -ForegroundColor Green
} else {
    Write-Host "   ! venv bulunamadı, oluşturuluyor..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "   ✓ venv oluşturuldu" -ForegroundColor Green
    & "venv\Scripts\Activate.ps1"
}

# 6. rpy2 kurulumu
Write-Host ""
Write-Host "6. rpy2 kuruluyor..." -ForegroundColor Yellow
Write-Host "   (Bu işlem birkaç dakika sürebilir)" -ForegroundColor Cyan
Write-Host ""

try {
    pip install --upgrade pip setuptools wheel
    pip install rpy2==3.5.16
    Write-Host ""
    Write-Host "   ✓ rpy2 başarıyla kuruldu!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "   ✗ rpy2 kurulumu başarısız!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif çözümler:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ÇÖZÜM 1: Docker kullanın (ÖNERİLEN)" -ForegroundColor Cyan
    Write-Host "   docker-compose build" -ForegroundColor White
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "ÇÖZÜM 2: Conda kullanın" -ForegroundColor Cyan
    Write-Host "   conda create -n dtcomb python=3.13" -ForegroundColor White
    Write-Host "   conda activate dtcomb" -ForegroundColor White
    Write-Host "   conda install -c conda-forge rpy2" -ForegroundColor White
    Write-Host ""
    Write-Host "Detaylı bilgi için: WINDOWS_RPY2_SETUP.md" -ForegroundColor Yellow
    exit 1
}

# 7. Test
Write-Host ""
Write-Host "7. rpy2 test ediliyor..." -ForegroundColor Yellow
try {
    $test_result = python -c "import rpy2.robjects as robjects; print('SUCCESS'); print(robjects.r('R.version.string')[0])"
    if ($test_result -like "*SUCCESS*") {
        Write-Host "   ✓ rpy2 çalışıyor!" -ForegroundColor Green
        Write-Host "   $($test_result -split '\n' | Select-Object -Last 1)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Test başarısız: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 8. Diğer bağımlılıkları kur
Write-Host ""
Write-Host "8. Diğer bağımlılıklar kuruluyor..." -ForegroundColor Yellow
try {
    pip install -r requirements.txt
    Write-Host "   ✓ Tüm bağımlılıklar kuruldu" -ForegroundColor Green
} catch {
    Write-Host "   ! Bazı bağımlılıklar kurulamadı" -ForegroundColor Yellow
}

# Başarı mesajı
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "     ✓ KURULUM TAMAMLANDI!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adımlar:" -ForegroundColor Yellow
Write-Host "1. .env dosyası oluşturun:" -ForegroundColor White
Write-Host "   cp .env.example .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. .env dosyasını düzenleyin (SECRET_KEY ve ADMIN_PASSWORD)" -ForegroundColor White
Write-Host ""
Write-Host "3. Uygulamayı başlatın:" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Tarayıcıda açın:" -ForegroundColor White
Write-Host "   http://localhost:3838" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test etmek için:" -ForegroundColor Yellow
Write-Host "   pytest tests/ -v" -ForegroundColor Cyan
Write-Host ""
Write-Host "Yardım için: QUICKSTART.md ve WINDOWS_RPY2_SETUP.md" -ForegroundColor Yellow
Write-Host ""

