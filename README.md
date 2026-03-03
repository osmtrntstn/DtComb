# DtComb - ROC Analysis & Biomarker Combination Tool

A FastAPI-based web application for ROC (Receiver Operating Characteristic) analysis and biomarker combination using R's dtComb package.

## 🎯 Features

- **ROC Analysis**: Comprehensive ROC curve analysis for biomarker evaluation
- **Multiple Combination Methods**: Linear and non-linear biomarker combination methods
- **Interactive Visualizations**: Dynamic charts with sensitivity/specificity curves
- **Data Upload**: Support for CSV, TSV, and other delimited formats
- **Example Datasets**: Built-in example datasets from dtComb package
- **Prediction Module**: Make predictions using trained models
- **Admin Panel**: Manage methods, functions, and parameters

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Python 3.13+ and R 4.3+ for local development

### Installation

#### Option 1: Docker (Recommended) 🐳

**Windows:**
```powershell
# Otomatik kurulum scripti
.\setup_docker.ps1
```

**Linux/Mac:**
```bash
# .env dosyası oluştur
cp .env.example .env
# .env'i düzenle (SECRET_KEY ve ADMIN_PASSWORD değiştir)

# Docker ile başlat
docker-compose up -d
```

#### Option 2: Local Installation

**Windows:**
```powershell
# Otomatik kurulum scripti (rpy2 sorunlarını çözer)
.\setup_windows.ps1
```

⚠️ **Windows Not:** rpy2 kurulumu zor olabilir. Docker kullanmanızı öneriyoruz!
Detaylar için: [WINDOWS_RPY2_SETUP.md](WINDOWS_RPY2_SETUP.md)

**Linux/Mac:**
```bash
# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# R'ın kurulu olduğundan emin olun
sudo apt-get install r-base r-base-dev  # Ubuntu/Debian

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyası oluştur
cp .env.example .env
# .env'i düzenle

# Uygulamayı başlat
python main.py
```

#### Access the Application
- Web Interface: http://localhost:3838
- Admin Panel: http://localhost:3838/admin
- Default credentials: `admin` / `change-this-password` (⚠️ Change these!)

## 📋 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-super-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
DEBUG=False
PORT=3838
```

### Local Development Setup

1. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

2. **Install R packages** (see Dockerfile for complete list)
```r
install.packages("dtComb")
install.packages("OptimalCutpoints")
# ... other packages
```

3. **Run the application**
```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 3838
```

### PyCharm IDE Users 🧑‍💻

If you're using PyCharm, the FastAPI run configuration has been set to use port 3838:

1. **Option 1:** Use the configured "DtComb" run configuration (port 3838 is already set)
2. **Option 2:** Run `run_dev.py` directly for explicit configuration
3. **Note:** If you see port 8000 instead of 3838, restart PyCharm to reload the configuration

The configuration is stored in `.idea/workspace.xml` with these parameters:
```
--host 0.0.0.0 --port 3838 --reload
```

## 🏗️ Project Structure

```
DtComb/
├── app/
│   ├── controllers/        # API route handlers
│   ├── db/                 # Database models and operations
│   ├── engines/            # R integration engines
│   ├── handlers/           # Exception handlers
│   ├── injections/         # Dependency injections (session control)
│   ├── models/             # Pydantic data models
│   ├── r_logic/            # R scripts for analysis
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── views/              # HTML templates
├── static/                 # CSS, JS, images
├── data/                   # User data storage
├── logs/                   # Application logs
├── no_cran_packages/       # Custom R packages
├── docker-compose.yml
├── Dockerfile
├── main.py                 # Application entry point
└── requirements.txt
```

## 🔒 Security Notes

⚠️ **IMPORTANT**: Before deploying to production:

1. Change `SECRET_KEY` in `.env` to a strong random string
2. Change default admin credentials
3. Use HTTPS in production
4. Review and update CORS settings
5. Enable rate limiting
6. Use environment-specific configurations

## 📊 Usage

### 1. Data Upload
- Navigate to "Data Upload" page
- Upload your CSV/TSV file or use example datasets
- Select status column and markers

### 2. Analysis
- Choose combination function (e.g., `linComb`)
- Select combination method (e.g., `scoring`)
- Configure parameters (resampling, standardization, etc.)
- Click "Analyze" to run ROC analysis

### 3. Results
- View ROC curves for individual markers and combination
- Download results as JSON
- Compare AUC values and diagnostic statistics

## 🛠️ Technologies

- **Backend**: FastAPI (Python 3.13)
- **R Integration**: rpy2
- **Statistical Analysis**: R (dtComb, OptimalCutpoints, pROC)
- **Database**: SQLite with SQLAlchemy
- **Frontend**: HTML, JavaScript (jQuery), Bootstrap AdminLTE
- **Charts**: Chart.js
- **Containerization**: Docker

## 📝 API Documentation

Once running, visit:
- Swagger UI: http://localhost:3838/docs
- ReDoc: http://localhost:3838/redoc

## 🐛 Troubleshooting

### Docker Issues

```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f
```

### R Package Issues

```bash
# Enter container
docker exec -it dtcomb_app bash

# Test R installation
R --version

# Test package loading
R -e "library(dtComb)"
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

[Add your license here]

## 👤 Author

[Your Name]

## 🙏 Acknowledgments

- dtComb R package developers
- FastAPI framework
- rpy2 project

