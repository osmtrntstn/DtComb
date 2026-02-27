import logging
import os
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime


def setup_logger(name: str = "dtcomb", log_dir: str = "logs") -> logging.Logger:
    # Ortam tespiti (Windows ise lokal kabul ediyoruz)
    is_local = os.name == 'nt'

    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)

    logger = logging.getLogger(name)

    # Sunucuda sadece ERROR ve üzerini, lokalde DEBUG (her şeyi) logla
    logger.setLevel(logging.DEBUG if is_local else logging.ERROR)

    if logger.handlers:
        return logger

    # Formatter ayarları
    detailed_formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Dinamik Dosya Boyutu ve Log Seviyesi
    # Lokal: 10MB, Sunucu: 5MB
    max_bytes = 10 * 1024 * 1024 if is_local else 5 * 1024 * 1024

    log_file = log_path / f"dtcomb_{datetime.now().strftime('%Y%m%d')}.log"

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=5,
        encoding='utf-8'
    )

    # Dosyaya yazılacak minimum seviyeyi ayarla
    file_handler.setLevel(logging.DEBUG if is_local else logging.ERROR)
    file_handler.setFormatter(detailed_formatter)

    # Konsol çıktısı (Genelde Docker loglarında görünmesi için INFO iyidir)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO if is_local else logging.ERROR)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


# Create default logger instance
logger = setup_logger()


# Error log for critical issues
def log_error(message: str, exception: Exception = None):
    """Log error with optional exception details"""
    if exception:
        logger.error(f"{message} - Exception: {str(exception)}", exc_info=True)
    else:
        logger.error(message)


def log_info(message: str):
    """Log informational message"""
    logger.info(message)


def log_warning(message: str):
    """Log warning message"""
    logger.warning(message)


def log_debug(message: str):
    """Log debug message"""
    logger.debug(message)

