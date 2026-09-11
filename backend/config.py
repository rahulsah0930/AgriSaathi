import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    SECRET_KEY = os.getenv('SECRET_KEY', 'agrisaathi-system1-dev-secret-key-2026')
    
    # Database configuration
    DB_USER = os.getenv('DATABASE_USER', 'root')
    DB_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DB_HOST = os.getenv('DATABASE_HOST', 'localhost')
    DB_PORT = os.getenv('DATABASE_PORT', '3306')
    DB_NAME = os.getenv('DATABASE_NAME', 'agrisaathi_db')
    
    # SQLAlchemy database URI (defaults to MySQL, fallback sqlite support for local dev without mysql)
    USE_SQLITE_FALLBACK = os.getenv('USE_SQLITE_FALLBACK', 'true').lower() == 'true'
    
    if os.getenv('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    elif not DB_PASSWORD and USE_SQLITE_FALLBACK:
        # Convenient local SQLite database for prototyping if MySQL is not currently running
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'agrisaathi_dev.db')}"
    else:
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS frontend origin
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
