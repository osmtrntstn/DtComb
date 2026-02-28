# Windows'ta rpy2 Kurulum Sorunu ve Çözümü

## Sorun
Windows'ta rpy2 kurulumu sırasında "cannot open input file 'R.lib'" hatası alıyorsunuz.

## Çözüm Adımları

### 1. R'ın Kurulu Olduğunu Doğrulayın

```powershell
# R'ın kurulu olup olmadığını kontrol edin
R --version
```

Eğer R kurulu değilse:
- https://cran.r-project.org/bin/windows/base/ adresinden R'ı indirin ve kurun
- **ÖNEMLİ:** Kurulum sırasında "Add R to PATH" seçeneğini işaretleyin

### 2. R_HOME Environment Variable'ını Ayarlayın

#### Otomatik Yöntem (PowerShell):

```powershell
# R'ın yolunu bulun
$r_path = (Get-Command R).Source
$r_home = Split-Path (Split-Path $r_path)

# Environment variable'ı ayarlayın (geçici - sadece bu session için)
$env:R_HOME = $r_home
$env:PATH = "$env:R_HOME\bin\x64;$env:PATH"

# Kalıcı olarak ayarlamak için:
[System.Environment]::SetEnvironmentVariable("R_HOME", $r_home, "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$r_home\bin\x64;$env:PATH", "User")
```

#### Manuel Yöntem:

1. **R'ın kurulum dizinini bulun** (genellikle):
   - `C:\Program Files\R\R-4.4.3`
   - Veya `C:\Program Files\R\R-4.x.x`

2. **System Environment Variables'ı açın**:
   - Windows Search'te "environment" yazın
   - "Edit the system environment variables" seçin
   - "Environment Variables" butonuna tıklayın

3. **R_HOME ekleyin**:
   - User variables kısmında "New" tıklayın
   - Variable name: `R_HOME`
   - Variable value: `C:\Program Files\R\R-4.4.3` (sizin R versiyonunuza göre)

4. **PATH'e R'ı ekleyin**:
   - PATH variable'ını bulun ve "Edit" tıklayın
   - "New" yapın ve ekleyin: `%R_HOME%\bin\x64`

5. **PowerShell'i yeniden başlatın**

### 3. Doğrulama

```powershell
# R_HOME kontrolü
echo $env:R_HOME
# Çıktı: C:\Program Files\R\R-4.4.3

# R çalışıyor mu?
R --version

# R.lib dosyası var mı?
Test-Path "$env:R_HOME\bin\x64\R.lib"
```

### 4. rpy2 Kurulumu

```powershell
# Virtual environment'ı aktif edin
.\venv\Scripts\Activate.ps1

# rpy2'yi kurun
pip install rpy2==3.5.16
```

## Alternatif Çözümler

### Çözüm 1: Precompiled Wheel Kullanın (ÖNERİLEN)

```powershell
# Unofficial Windows binaries (Christoph Gohlke)
# https://www.lfd.uci.edu/~gohlke/pythonlibs/#rpy2
# İndirin ve kurun:
pip install rpy2‑3.5.16‑cp313‑cp313‑win_amd64.whl
```

### Çözüm 2: Conda Kullanın

```powershell
# Conda environment oluşturun
conda create -n dtcomb python=3.13
conda activate dtcomb

# rpy2'yi conda ile kurun
conda install -c conda-forge rpy2
```

### Çözüm 3: WSL2 (Windows Subsystem for Linux) Kullanın

```bash
# WSL2'de Ubuntu kullanın
wsl --install

# WSL'de:
sudo apt-get update
sudo apt-get install r-base r-base-dev python3 python3-pip
pip3 install rpy2==3.5.16
```

### Çözüm 4: Docker Kullanın (EN İYİ ÇÖZÜM!)

```powershell
# Projeniz zaten Docker destekliyor!
docker-compose build
docker-compose up -d

# rpy2 Docker image içinde çalışacak
```

## Önerilen Yaklaşım: Docker Kullanın! 🐳

Windows'ta rpy2 kurulumu karmaşık olduğu için, **Docker kullanmanızı şiddetle öneriyoruz**:

```powershell
# .env dosyasını oluşturun
cp .env.example .env

# Docker ile başlatın
docker-compose up -d

# Logları izleyin
docker-compose logs -f

# Test edin
curl http://localhost:8000/health
```

Docker, tüm bağımlılıkları (R, Python, rpy2) içerir ve sorunsuz çalışır!

## Hata Giderme

### Hata: "R_HOME not set"
```powershell
$env:R_HOME = "C:\Program Files\R\R-4.4.3"
```

### Hata: "R.lib not found"
```powershell
# R.lib'in olduğunu doğrulayın
Test-Path "$env:R_HOME\bin\x64\R.lib"

# Yoksa R'ı yeniden kurun (tam kurulum)
```

### Hata: "Microsoft Visual C++ 14.0 is required"
```powershell
# Visual Studio Build Tools indirin ve kurun
# https://visualstudio.microsoft.com/downloads/
# "Desktop development with C++" workload'ını seçin
```

## Başarı Testi

```powershell
# Python'da test edin
python -c "import rpy2.robjects as robjects; print('rpy2 çalışıyor!'); print(robjects.r('R.version.string'))"
```

Başarılıysa, şunu göreceksiniz:
```
rpy2 çalışıyor!
R version 4.4.3 (2024-02-29)
```

## Sonuç

✅ **En Kolay Yol:** Docker kullanın (`docker-compose up -d`)  
⚠️ **Alternatif:** Conda ile kurun  
🔧 **Manuel:** R_HOME ayarlayın ve rpy2 kurun

İyi şanslar! 🚀

