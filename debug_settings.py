from app.config import get_settings
try:
    settings = get_settings()
    print("Settings loaded successfully")
except Exception as e:
    print(e)

