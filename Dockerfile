# 1. Temel İşletim Sistemi
FROM ubuntu:24.04

# 2. Sistem Bağımlılıkları
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa -y \
    && apt-get update && apt-get install -y \
    r-base r-base-dev \
    python3.13 python3.13-dev python3-pip \
    sqlite3 libsqlite3-dev \
    libcurl4-openssl-dev libssl-dev libxml2-dev \
    libpng-dev libjpeg-dev libcairo2-dev \
    pkg-config libtirpc-dev \
    curl \
    libglpk-dev libgdal-dev libproj-dev libudunits2-dev \
    tcl tk tcl-dev tk-dev libglu1 openjdk-11-jdk \
    cmake libabsl-dev libharfbuzz-dev libfribidi-dev \
    libfreetype6-dev libtiff5-dev libfontconfig1-dev \
    libgeos-dev redis-server supervisor \
    && rm -rf /var/lib/apt/lists/*

# 3. R PAKETLERİ AYARI
# ---------------------------------------------------------
ENV R_LIBS_USER=/usr/local/lib/R/site-library

# Posit Package Manager (Ubuntu 24.04 Noble için Binary Repo)
# R 4.3.x uyumluluğu için tarih bazlı bir snapshot ekledim.
ENV R_REPOS="options(repos = c(P3M = 'https://packagemanager.posit.co/cran/__linux__/noble/2024-05-13', CRAN = 'https://cloud.r-project.org/'))"

# Paket Kurulumu (Kritik bağımlılıklarla beraber)
RUN R -e "${R_REPOS}; install.packages(c('jsonlite', 'Rcpp', 'RcppArmadillo', 'devtools', 'systemfonts', 'textshaping', 'ragg', 's2', 'sf', 'officer', 'flextable', 'epiR'))"

# Devasa Bağımlılık Listesi (Gruplandırılmış ve Hızlandırılmış)
RUN R -e "${R_REPOS}; install.packages(c('rgl','glmnet','gam','fastAdaboost','doParallel','adabag','plotrix','Formula','plotmo','TeachingDemos','earth','mda'))"
RUN R -e "${R_REPOS}; install.packages(c('rprojroot','diffobj','rematch2','brio','callr','desc','pkgload','praise','processx','ps','waldo','testthat'))"
RUN R -e "${R_REPOS}; install.packages(c('minqa','nloptr','lme4','abind','coda','ada','mvtnorm','stabs','nnls','quadprog','import','libcoin'))"
RUN R -e "${R_REPOS}; install.packages(c('inum','partykit','mboost','bitops','caTools','rJava','RWekajars','RWeka','party','coin','strucchange'))"
RUN R -e "${R_REPOS}; install.packages(c('multcomp','sandwich','modeltools','matrixStats','TH.data','kerndwd','xgboost','RSpectra','rARPACK','HDclassif'))"
RUN R -e "${R_REPOS}; install.packages(c('kknn','klaR','questionr','labelled','styler','haven','R.cache','readr','R.utils','vroom','R.oo','bit64'))"
RUN R -e "${R_REPOS}; install.packages(c('combinat','rstudioapi','miniUI','forcats','R.methodsS3','clipr','bit','optimx','monmlp','RSNNS','ncvreg'))"
RUN R -e "${R_REPOS}; install.packages(c('msaenet','naivebayes','pamr','randomForest','pls','dotCall64','gridExtra','backports','statnet.common','maps'))"
RUN R -e "${R_REPOS}; install.packages(c('SparseM','MatrixModels','permute','carData','network','spam','viridis','broom','vegan','quantreg','sna','fields'))"
RUN R -e "${R_REPOS}; install.packages(c('pbkrtest','bipartite','car','plsRglm','stepPlr','ordinalNet','RRF','LiblineaR','DEoptimR','pcaPP','robustbase'))"
RUN R -e "${R_REPOS}; install.packages(c('rrcov','truncnorm','mclust','Rsolnp','robustDA','rotationForest','kohonen','entropy','corpcor','fdrtool','sda','sdwd'))"
RUN R -e "${R_REPOS}; install.packages(c('lars','elasticnet','sparseLDA','spls','deepnet','gbm','evtree','wsrf','readxl','stringr','ggplot2','dplyr','plyr'))"
RUN R -e "${R_REPOS}; install.packages(c('pROC','OptimalCutpoints','ROCR','rapport','arm','Cubist','C50','kernlab','misc3d','plot3D','prim','supervisedPRIM','munsell'))"

# KRİTİK: dtComb Kurulumu (P3M Repo ile binary olarak deniyoruz)
RUN R -e "${R_REPOS}; install.packages('dtComb', dependencies=TRUE, lib='/usr/local/lib/R/site-library')"

# Doğrulama adımı (Hata burada olursa kurulum loguna bakabileceğiz)
RUN R -e ".libPaths('/usr/local/lib/R/site-library'); library(dtComb)"

# BiocManager ve Özel Paketler
RUN R -e "install.packages('BiocManager', repos = 'https://cloud.r-project.org')" && \
    R -e "BiocManager::install(version = '3.18', ask=FALSE)" && \
    R -e "BiocManager::install('gpls', ask=FALSE)"

# Yerel tar.gz paketleri
RUN R -e "install.packages('./no_cran_packages/obliqueRF_0.3.tar.gz', repos = NULL, type = 'source')"
RUN R -e "install.packages('./no_cran_packages/nodeHarvest_0.7-3.tar.gz', repos = NULL, type = 'source')"
RUN R -e "install.packages('./no_cran_packages/FCNN4R_0.6.2.tar.gz', repos = NULL, type = 'source')"
RUN R -e "install.packages('./no_cran_packages/extraTrees_1.0.5.tar.gz', repos = NULL, type = 'source')"
RUN R -e "install.packages('./no_cran_packages/kohonen_3.0.12.tar.gz', repos = NULL, type = 'source')"

# 4. Python Bağımlılıkları
ENV R_HOME=/usr/lib/R
ENV PATH="${R_HOME}/bin:${PATH}"
ENV CFLAGS="-I/usr/include/tirpc"
ENV LDFLAGS="-ltirpc"

RUN python3.13 -m pip install --no-cache-dir --break-system-packages wheel setuptools && \
    python3.13 -m pip install --no-cache-dir --break-system-packages \
    rpy2 fastapi[standard] uvicorn pandas numpy sqlalchemy itsdangerous

# 5. Çalışma Dizini ve İzinler
WORKDIR /app
COPY requirements.txt .
RUN python3.13 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

COPY . /app
RUN mkdir -p /app/data && chmod -R 777 /app/data
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENV LD_LIBRARY_PATH="${R_HOME}/lib:/usr/lib/x86_64-linux-gnu"

EXPOSE 3838
CMD ["/usr/bin/supervisord"]