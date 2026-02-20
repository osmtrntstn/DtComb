# 1. Temel İşletim Sistemi (Hafif ve Kararlı)
FROM ubuntu:24.04

# 2. Sistem Bağımlılıkları
# SQLite ve Python-R entegrasyonu için gerekli lib kütüphanelerini ekledik.
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa -y \
    && apt-get update && apt-get install -y \
    r-base \
    r-base-dev \
    python3.13 \
    python3.13-dev \
    python3-pip \
    sqlite3 \
    libsqlite3-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libpng-dev \
    libjpeg-dev \
    libcairo2-dev \
    pkg-config \
    libtirpc-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. R Paketleri
# jsonlite dönüştürme için, dtComb ve OptimalCutpoints analizin için şart.
RUN R -e "install.packages(c('jsonlite', 'dtComb', 'OptimalCutpoints'), repos='https://cloud.r-project.org/', dependencies=TRUE)"

# 4. Python Bağımlılıkları
# SQLAlchemy'yi SQLite yönetimi için ekledim.
# rpy2 derlemesi için gerekli ortam değişkenlerini pip'ten önce tanımlıyoruz
ENV R_HOME=/usr/lib/R
ENV PATH="${R_HOME}/bin:${PATH}"
# rpy2 derlemesi için tirpc kütüphane yollarını gösteriyoruz
ENV CFLAGS="-I/usr/include/tirpc"
ENV LDFLAGS="-ltirpc"

RUN python3.13 -m pip install --no-cache-dir --break-system-packages wheel setuptools && \
    python3.13 -m pip install --no-cache-dir --break-system-packages \
    rpy2 \
    fastapi[standard] \
    uvicorn \
    pandas \
    numpy \
    sqlalchemy \
    itsdangerous  # <--- Eksik olan bu modülü ekledik

# 5. Çalışma Dizini ve Dosyalar
WORKDIR /app
COPY . /app

# 6. SQLite Veritabanı Dosyası İçin İzinler
# Konteyner içinde DB dosyasının yazılabilir olması gerekir.
RUN mkdir -p /app/data && chmod -R 777 /app/data

# 7. rpy2 için Kritik Ortam Değişkenleri
ENV R_HOME=/usr/lib/R
ENV LD_LIBRARY_PATH=$R_HOME/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

EXPOSE 8000

# Başlatma
CMD ["python3.13", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]