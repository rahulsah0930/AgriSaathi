import os
import re
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

INSECURE_SECRETS = {
    'agrisaathi-unified-dev-secret-key-2026',
    'dev-secret',
    'secret123',
    'changeme',
    'secret',
    'default',
    'test',
    'admin123',
    ''
}

def normalize_database_url(url: str) -> str:
    """
    Normalizes database URLs to be fully SQLAlchemy compatible with psycopg2.
    Specifically handles:
      - 'postgresql+psycopg://' -> 'postgresql://' (Neon default Python/SQLAlchemy connection strings)
      - 'postgres+psycopg://'   -> 'postgresql://'
      - 'postgresql+psycopg3://'-> 'postgresql://'
      - 'postgres://'            -> 'postgresql://' (Heroku/Render legacy scheme)
    Preserves existing postgresql:// and postgresql+psycopg2:// URLs, as well as SQLite.
    """
    if not url:
        return url
    trimmed = url.strip()
    pattern = r'^(?:postgres|postgresql)(?:\+(?:psycopg3|psycopg))?://'
    if re.match(pattern, trimmed):
        return re.sub(pattern, 'postgresql://', trimmed, count=1)
    return trimmed

def mask_database_url(url: str) -> str:
    """
    Safely masks user credentials from database URLs for logs/audits.
    e.g. postgresql://user:secret@host:5432/db -> postgresql://user:***@host:5432/db
    """
    if not url:
        return 'none'
    try:
        parsed = urlparse(url)
        if parsed.password:
            netloc = f"{parsed.username}:***@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return parsed._replace(netloc=netloc).geturl()
        return url
    except Exception:
        # Fallback regex masking
        return re.sub(r':([^/@]+)@', r':***@', url)


class Config:
    APP_ENV = os.getenv('APP_ENV', os.getenv('FLASK_ENV', 'development')).lower()
    IS_PRODUCTION = APP_ENV in ('production', 'prod')
    FLASK_ENV = 'production' if IS_PRODUCTION else 'development'
    DEBUG = not IS_PRODUCTION and os.getenv('DEBUG', 'true').lower() == 'true'

    # Secret keys
    SECRET_KEY = os.getenv('SECRET_KEY', 'agrisaathi-unified-dev-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))  # 24 hours in seconds

    # Database resolution
    DATABASE_URL = normalize_database_url(os.getenv('DATABASE_URL'))
    USE_SQLITE_FALLBACK = os.getenv('USE_SQLITE_FALLBACK', 'true').lower() == 'true'

    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    elif not IS_PRODUCTION and USE_SQLITE_FALLBACK:
        # Development SQLite fallback
        sqlite_file = os.path.join(os.path.dirname(__file__), 'agrisaathi_dev.db')
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{sqlite_file}"
    else:
        # Production without DATABASE_URL is not allowed; fallback dummy for class evaluation
        SQLALCHEMY_DATABASE_URI = None

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Production engine pooling for PostgreSQL
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgresql'):
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_size': int(os.getenv('DB_POOL_SIZE', 10)),
            'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 20)),
            'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 300))
        }

    # Demo Mode: Disabled by default in production
    DEMO_MODE = os.getenv('DEMO_MODE', 'false' if IS_PRODUCTION else 'true').lower() in ('true', '1', 'yes')

    # Cloud Object Storage Configuration
    STORAGE_PROVIDER = os.getenv('STORAGE_PROVIDER', 'local').lower()
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '').strip()
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '').strip()

    # Upload limitations
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 10 * 1024 * 1024))  # 10 MB

    # CORS frontend origin configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    @classmethod
    def get_cors_origins(cls):
        """
        Returns allowed CORS origins.
        In production: strictly enforces configured FRONTEND_URL. No wildcard.
        In development: allows local dev servers alongside FRONTEND_URL.
        """
        if cls.IS_PRODUCTION:
            origins = []
            if cls.FRONTEND_URL:
                for item in cls.FRONTEND_URL.split(','):
                    cleaned = item.strip().rstrip('/')
                    if cleaned and cleaned not in origins:
                        origins.append(cleaned)
            return origins if origins else ['http://localhost:5173']
        
        origins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000']
        if cls.FRONTEND_URL:
            for item in cls.FRONTEND_URL.split(','):
                cleaned = item.strip().rstrip('/')
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        return origins

    @classmethod
    def validate_production_config(cls):
        """
        Validates that production environment is not using insecure secrets,
        missing database credentials, or broken cloud storage configuration.
        """
        if not cls.IS_PRODUCTION:
            return

        # 1. Validate DATABASE_URL
        if not cls.DATABASE_URL or not cls.SQLALCHEMY_DATABASE_URI:
            raise ValueError(
                "CRITICAL: DATABASE_URL must be set in production mode (APP_ENV=production). "
                "SQLite fallback is forbidden in production."
            )

        # 2. Validate Secrets
        if not cls.SECRET_KEY or cls.SECRET_KEY in INSECURE_SECRETS:
            raise ValueError(
                "CRITICAL: Insecure or default SECRET_KEY detected in production. "
                "Please configure a strong, random SECRET_KEY."
            )

        if not cls.JWT_SECRET_KEY or cls.JWT_SECRET_KEY in INSECURE_SECRETS:
            raise ValueError(
                "CRITICAL: Insecure or default JWT_SECRET_KEY detected in production. "
                "Please configure a strong, random JWT_SECRET_KEY."
            )

        # 3. Validate Cloud Storage if configured for Cloudinary
        if cls.STORAGE_PROVIDER == 'cloudinary':
            if not (cls.CLOUDINARY_CLOUD_NAME and cls.CLOUDINARY_API_KEY and cls.CLOUDINARY_API_SECRET):
                raise ValueError(
                    "CRITICAL: STORAGE_PROVIDER=cloudinary selected in production, but "
                    "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing."
                )

    @classmethod
    def get_safe_status(cls):
        """Returns safe non-sensitive configuration diagnostics for health checks."""
        return {
            'environment': cls.APP_ENV,
            'is_production': cls.IS_PRODUCTION,
            'demo_mode': cls.DEMO_MODE,
            'storage_provider': cls.STORAGE_PROVIDER,
            'database_engine': 'postgresql' if (cls.SQLALCHEMY_DATABASE_URI and 'postgresql' in cls.SQLALCHEMY_DATABASE_URI) else 'sqlite'
        }
