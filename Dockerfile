# 1. Temel İşletim Sistemi
FROM ubuntu:24.04

# 2. Sistem Bağımlılıkları (R ve Python için Gerekli Kütüphaneler)
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
    # Eski projeden gelen ek sistem bağımlılıkları
    libglpk-dev libgdal-dev libproj-dev libudunits2-dev \
    tcl tk tcl-dev tk-dev libglu1 openjdk-11-jdk \
    cmake \
    libabsl-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    libfontconfig1-dev \
    libxml2-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. R Paketleri (Mantıksal Gruplara Ayrılmış)

# Temel Araçlar
RUN R -e "install.packages(c('jsonlite', 'Rcpp', 'RcppArmadillo', 'devtools'), repos='https://cloud.r-project.org/')"

# Alttaki Sistem Bağımlılıkları (s2, sf ve epiR için kritik olanlar)
RUN R -e "install.packages(c('systemfonts', 'textshaping', 'ragg'), repos='https://cloud.r-project.org/')"
RUN R -e "install.packages('s2', repos='https://cloud.r-project.org/')"
RUN R -e "install.packages('sf', repos='https://cloud.r-project.org/')"

# Ara Katman Paketleri
RUN R -e "install.packages(c('officer', 'flextable', 'epiR'), repos='https://cloud.r-project.org/')"

# Devasa Bağımlılık Listesi (dtComb'un çalışması için gerekenler)
# Not: epiR ve plyr gibi paketleri zaten kurduğumuz için buradan çıkarabiliriz veya bırakabiliriz.
RUN R -e "install.packages(c('rgl','glmnet','gam','fastAdaboost','doParallel','adabag','plotrix','Formula','plotmo','TeachingDemos','earth','mda','rprojroot','diffobj','rematch2','brio','callr','desc','pkgload','praise','processx','ps','waldo','testthat','minqa','nloptr','lme4','abind','coda','ada','mvtnorm','stabs','nnls','quadprog','import','libcoin','inum','partykit','mboost','bitops','caTools','rJava','RWekajars','RWeka','party','coin','strucchange','multcomp','sandwich','modeltools','matrixStats','TH.data','kerndwd','xgboost','RSpectra','rARPACK','HDclassif','kknn','klaR','questionr','labelled','styler','haven','R.cache','readr','R.utils','vroom','R.oo','bit64','combinat','rstudioapi','miniUI','forcats','R.methodsS3','clipr','bit','optimx','monmlp','RSNNS','ncvreg','msaenet','naivebayes','pamr','randomForest','pls','dotCall64','gridExtra','backports','statnet.common','maps','SparseM','MatrixModels','permute','carData','network','spam','viridis','broom','vegan','quantreg','sna','fields','pbkrtest','bipartite','car','plsRglm','stepPlr','ordinalNet','RRF','LiblineaR','DEoptimR','pcaPP','robustbase','rrcov','truncnorm','mclust','Rsolnp','robustDA','rotationForest','kohonen','entropy','corpcor','fdrtool','sda','sdwd','lars','elasticnet','sparseLDA','spls','deepnet','gbm','evtree','wsrf','readxl','stringr','dtComb','ggplot2','dplyr','plyr','pROC','OptimalCutpoints','ROCR','rapport','arm','Cubist','C50','kernlab','misc3d','plot3D','prim','supervisedPRIM','munsell'), repos='https://cloud.r-project.org/')"

# BiocManager ve Özel Paketler
# Ubuntu 24.04 (R 4.3+) için BiocManager 3.18 daha uyumludur.
RUN R -e "install.packages('BiocManager', repos = 'https://cloud.r-project.org')" && \
    R -e "BiocManager::install(version = '3.18', ask=FALSE)" && \
    R -e "BiocManager::install('gpls', ask=FALSE)"

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
COPY . /app
RUN mkdir -p /app/data && chmod -R 777 /app/data

# 7. rpy2 için Kritik Ortam Değişkenleri
ENV LD_LIBRARY_PATH=$R_HOME/lib:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

EXPOSE 8000

CMD ["python3.13", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]