from celery import Celery
from app.config import get_settings
import os

settings = get_settings()

celery = Celery(
    "dtcomb_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.tasks']
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    result_expires=3600,
    task_track_started=True,
)

# Docker/Linux ortamında worker child process'lerin kontrolü için
# İsteğe bağlı: celery.conf.worker_prefetch_multiplier = 1

if __name__ == "__main__":
    # Ortam değişkenine bakarak Windows mu Docker mı olduğunu anlayabiliriz
    is_windows = os.name == 'nt'

    if is_windows:
        # Windows için güvenli mod
        celery.worker_main(['worker', '--loglevel=info', '-P', 'solo'])
    else:
        # Docker (Linux) için yüksek performanslı mod
        # --concurrency ile işlemci çekirdek sayın kadar işi aynı anda yapabilirsin
        celery.worker_main(['worker', '--loglevel=info'])