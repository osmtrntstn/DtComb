import os
import subprocess
import shutil


def get_data(params: dict):
    # 1. Rscript yolunu sistemden (PATH) otomatik bul
    # 'Rscript' komutunun nerede olduğunu sistemden sorgular (shutil.which)
    rscript = shutil.which("Rscript")

    # 2. Eğer sistemde bulunamazsa (Lokal Windows fallback)
    if not rscript:
        rscript = os.environ.get('R_SCRIPT')
        if not rscript or not os.path.exists(rscript):
            r_home = os.environ.get('R_HOME', r'C:\Program Files\R\R-4.4.3')
            rscript = os.path.join(r_home, 'bin', 'x64', 'Rscript.exe')

    # 3. Son kontrol
    if not rscript or not os.path.exists(rscript):
        raise FileNotFoundError(f"Rscript bulunamadı! PATH veya R_HOME ayarlarını kontrol edin.")

    # Script yolunu Docker uyumlu hale getir
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    script_path = os.path.join(project_root, 'app', 'r_logic', 'example_data_script.R')

    # Windows/Linux yol ayracı uyumu (Docker Linux kullanır)
    script_path = os.path.normpath(script_path)

    if not os.path.exists(script_path):
        raise FileNotFoundError(f"R script dosyası bulunamadı: {script_path}")

    data_name = params.get('exampleData', 'laparotomy')

    # Komutu çalıştır
    cmd = [rscript, script_path, data_name]
    proc = subprocess.run(cmd, capture_output=True, text=True)

    if proc.returncode != 0:
        raise RuntimeError(f"R Hatası: {proc.stderr.strip() or proc.stdout.strip()}")

    return proc.stdout.strip()