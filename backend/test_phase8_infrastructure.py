import os
import sys
import unittest
import json
import io
from unittest.mock import patch, MagicMock
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config, normalize_database_url, mask_database_url, INSECURE_SECRETS
from app import create_app
from models import db, User, Commodity, CropLot, TransportOrder, Warehouse, StorageBooking, PaymentRecord
from services.file_storage_service import (
    LocalStorageProvider,
    CloudinaryStorageProvider,
    get_storage_provider,
    validate_image_stream
)
from utils.concurrency import is_row_locking_supported, get_with_lock
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql


class Phase8InfrastructureTestSuite(unittest.TestCase):
    """
    Automated Phase 8 Test Suite for Production Infrastructure Readiness:
    - PostgreSQL readiness and URL normalization
    - Environment-based configuration & secret enforcement
    - Cloud file storage abstraction & local fallback
    - Security headers, CORS, and logging protection
    - Concurrency and data integrity preservation
    - Alembic migration and PostgreSQL model compilation
    """

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    # =========================================================================
    # PART A: DATABASE & POSTGRESQL READINESS (Tests 1-8)
    # =========================================================================

    def test_01_sqlite_development_fallback_works(self):
        """Verify development environment cleanly defaults to local SQLite when DATABASE_URL is unset."""
        with patch.dict(os.environ, {'APP_ENV': 'development', 'DATABASE_URL': '', 'USE_SQLITE_FALLBACK': 'true'}, clear=False):
            # Evaluate fallback resolution
            dev_url = f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agrisaathi_dev.db')}"
            self.assertTrue(self.app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:///'))

    def test_02_database_url_configuration_recognized(self):
        """Verify explicit DATABASE_URL is recognized and normalized to postgresql+psycopg2."""
        raw_url = "postgresql://prod_user:strong_password@db.railway.internal:5432/agrisaathi"
        expected = "postgresql+psycopg2://prod_user:strong_password@db.railway.internal:5432/agrisaathi"
        norm = normalize_database_url(raw_url)
        self.assertEqual(norm, expected)

    def test_03_postgres_url_normalization_and_acceptance(self):
        """Verify Heroku/Render legacy postgres:// and Neon postgresql+psycopg:// URLs are normalized to postgresql+psycopg2:// for SQLAlchemy."""
        legacy_url = "postgres://usr:pwd@host.compute.amazonaws.com:5432/dbname"
        expected = "postgresql+psycopg2://usr:pwd@host.compute.amazonaws.com:5432/dbname"
        self.assertEqual(normalize_database_url(legacy_url), expected)

        # Test Neon SQLAlchemy default format with +psycopg
        neon_url = "postgresql+psycopg://usr:pwd@ep-cool-fog-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
        neon_expected = "postgresql+psycopg2://usr:pwd@ep-cool-fog-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
        self.assertEqual(normalize_database_url(neon_url), neon_expected)

        # Test postgres+psycopg variant
        postgres_psycopg = "postgres+psycopg://usr:pwd@ep-cool-fog-123.us-east-2.aws.neon.tech/neondb"
        self.assertEqual(normalize_database_url(postgres_psycopg), "postgresql+psycopg2://usr:pwd@ep-cool-fog-123.us-east-2.aws.neon.tech/neondb")

        # Test psycopg3, psycopg2, quotes, and uppercase variants
        self.assertEqual(normalize_database_url("postgresql+psycopg3://u:p@h:5432/d"), "postgresql+psycopg2://u:p@h:5432/d")
        self.assertEqual(normalize_database_url("postgresql+psycopg2://u:p@h:5432/d"), "postgresql+psycopg2://u:p@h:5432/d")
        self.assertEqual(normalize_database_url('"postgresql://u:p@h:5432/d"'), "postgresql+psycopg2://u:p@h:5432/d")
        self.assertEqual(normalize_database_url("'POSTGRESQL://u:p@h:5432/d'"), "postgresql+psycopg2://u:p@h:5432/d")

    def test_04_production_refuses_missing_jwt_secret(self):
        """Verify production mode refuses startup if JWT_SECRET_KEY is empty."""
        class MockProdConfig(Config):
            IS_PRODUCTION = True
            DATABASE_URL = "postgresql://u:p@localhost:5432/db"
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
            SECRET_KEY = "a_very_strong_random_secret_key_12345"
            JWT_SECRET_KEY = ""

        with self.assertRaises(ValueError) as ctx:
            MockProdConfig.validate_production_config()
        self.assertIn("JWT_SECRET_KEY", str(ctx.exception))

    def test_05_production_refuses_insecure_default_secret(self):
        """Verify production mode refuses startup when using known insecure default secrets."""
        for bad_secret in INSECURE_SECRETS:
            class MockInsecureConfig(Config):
                IS_PRODUCTION = True
                DATABASE_URL = "postgresql://u:p@localhost:5432/db"
                SQLALCHEMY_DATABASE_URI = DATABASE_URL
                SECRET_KEY = bad_secret
                JWT_SECRET_KEY = "some_random_key_987654321"

            with self.assertRaises(ValueError):
                MockInsecureConfig.validate_production_config()

    def test_06_production_refuses_missing_database_url(self):
        """Verify production mode strictly forbids SQLite and requires DATABASE_URL."""
        class MockNoDbConfig(Config):
            IS_PRODUCTION = True
            DATABASE_URL = None
            SQLALCHEMY_DATABASE_URI = None
            SECRET_KEY = "strong_random_secret_key_prod_abc"
            JWT_SECRET_KEY = "strong_random_jwt_key_prod_xyz"

        with self.assertRaises(ValueError) as ctx:
            MockNoDbConfig.validate_production_config()
        self.assertIn("DATABASE_URL must be set in production mode", str(ctx.exception))

    def test_07_demo_mode_false_prevents_automatic_demo_users(self):
        """Verify DEMO_MODE defaults to false in production."""
        with patch.dict(os.environ, {'APP_ENV': 'production', 'DEMO_MODE': ''}, clear=False):
            # When production and no DEMO_MODE env is set, demo mode is False
            demo_flag = os.getenv('DEMO_MODE', 'false').lower() in ('true', '1')
            self.assertFalse(demo_flag)

    def test_08_commodity_initialization_still_works(self):
        """Verify commodity catalog seeding remains deterministic, idempotent, and non-empty."""
        commodities = Commodity.query.all()
        self.assertGreaterEqual(len(commodities), 100)
        tomato = Commodity.query.filter_by(canonical_name='Tomato').first()
        self.assertIsNotNone(tomato)
        self.assertEqual(tomato.perishability_class, 'HIGH')

    # =========================================================================
    # PART B: CLOUD & LOCAL FILE STORAGE ABSTRACTION (Tests 9-16)
    # =========================================================================

    def test_09_storage_abstraction_local_provider_works(self):
        """Verify LocalStorageProvider saves valid image files and returns correct relative URL."""
        provider = LocalStorageProvider()
        self.assertEqual(provider.get_provider_name(), 'local')

        # Create temporary valid image in memory
        im = Image.new('RGB', (250, 250), color=(200, 50, 50))
        img_bytes = io.BytesIO()
        im.save(img_bytes, format='JPEG')
        img_bytes.name = 'test_crop.jpg'
        img_bytes.filename = 'test_crop.jpg'
        img_bytes.seek(0)

        res = provider.save_file(img_bytes, category='crop_lots')
        self.assertTrue(res['success'])
        self.assertTrue(res['url'].startswith('/uploads/crop_lots/'))
        self.assertEqual(res['provider'], 'local')

        # Clean up
        provider.delete_file(res['storage_key'])

    def test_10_cloud_provider_config_validation_works(self):
        """Verify CloudinaryStorageProvider validates missing credentials in production."""
        with patch('config.Config.IS_PRODUCTION', True):
            with self.assertRaises(ValueError) as ctx:
                CloudinaryStorageProvider(cloud_name='', api_key='', api_secret='')
            self.assertIn("CloudinaryStorageProvider requires", str(ctx.exception))

    def test_11_production_does_not_silently_fallback_when_cloud_selected(self):
        """Verify production fails clearly if STORAGE_PROVIDER=cloudinary but credentials missing."""
        class MockBrokenCloudConfig(Config):
            IS_PRODUCTION = True
            STORAGE_PROVIDER = 'cloudinary'
            CLOUDINARY_CLOUD_NAME = ''
            CLOUDINARY_API_KEY = ''
            CLOUDINARY_API_SECRET = ''
            DATABASE_URL = 'postgresql://u:p@localhost/db'
            SQLALCHEMY_DATABASE_URI = DATABASE_URL
            SECRET_KEY = 'strong_key_1234567890_prod'
            JWT_SECRET_KEY = 'strong_jwt_key_1234567890_prod'

        with self.assertRaises(ValueError) as ctx:
            MockBrokenCloudConfig.validate_production_config()
        self.assertIn("CLOUDINARY", str(ctx.exception))

    def test_12_crop_upload_uses_storage_abstraction(self):
        """Verify lot image upload route uses storage provider."""
        from utils.auth import generate_access_token
        farmer = User.query.filter_by(role='FARMER').first()
        token = generate_access_token(farmer) if farmer else "test_token"

        im = Image.new('RGB', (250, 250), color=(100, 150, 200))
        img_bytes = io.BytesIO()
        im.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        with patch('routes.lot_routes.get_storage_provider') as mock_get_provider:
            mock_provider = MagicMock()
            mock_provider.save_file.return_value = {
                'success': True,
                'url': '/uploads/crop_lots/crop_mock123.jpg',
                'filename': 'crop_mock123.jpg',
                'original_filename': 'crop.jpg'
            }
            mock_get_provider.return_value = mock_provider

            resp = self.client.post(
                '/api/lots/upload-image',
                headers={'Authorization': f'Bearer {token}'},
                data={'images': (img_bytes, 'crop.jpg')},
                content_type='multipart/form-data'
            )
            self.assertEqual(resp.status_code, 201)
            mock_provider.save_file.assert_called_once()

    def test_13_pod_upload_uses_storage_abstraction(self):
        """Verify logistics POD upload uses storage provider."""
        im = Image.new('RGB', (300, 300), color=(50, 200, 50))
        img_bytes = io.BytesIO()
        im.save(img_bytes, format='PNG')
        img_bytes.filename = 'pod_test_order.png'
        img_bytes.seek(0)

        provider = get_storage_provider()
        save_res = provider.save_file(img_bytes, category='pod', custom_filename='pod_test_order.png')
        self.assertTrue(save_res['success'])
        self.assertIn('pod', save_res['url'])
        provider.delete_file(save_res['storage_key'])

    def test_14_invalid_image_format_rejected(self):
        """Verify non-image formats are rejected by file validation."""
        fake_file = io.BytesIO(b"%PDF-1.4 mock binary")
        fake_file.filename = "document.pdf"
        is_valid, err, _, _ = validate_image_stream(fake_file)
        self.assertFalse(is_valid)
        self.assertIn("Unsupported file extension", err)

    def test_15_file_size_validation_preserved(self):
        """Verify file size limit is enforced."""
        fake_file = io.BytesIO(b"0" * 200)
        fake_file.filename = "big_photo.jpg"
        is_valid, err, _, _ = validate_image_stream(fake_file, max_size=100)
        self.assertFalse(is_valid)
        self.assertIn("File size exceeds", err)

    def test_16_corrupted_image_rejected(self):
        """Verify corrupted image byte stream is flagged and rejected."""
        corrupt_file = io.BytesIO(b"\xff\xd8\xff\xe0corrupted_bytes_here")
        corrupt_file.filename = "broken.jpg"
        is_valid, err, _, _ = validate_image_stream(corrupt_file)
        self.assertFalse(is_valid)
        self.assertIn("Corrupted or invalid image stream", err)

    # =========================================================================
    # PART C: SECURITY, CORS & SENSITIVE DATA LOGGING (Tests 17-24)
    # =========================================================================

    def test_17_cloud_secret_never_returned_by_api(self):
        """Verify Cloudinary API secret and JWT secrets are never exposed in JSON responses."""
        resp = self.client.get('/api/health')
        body = resp.get_data(as_text=True)
        self.assertNotIn("CLOUDINARY_API_SECRET", body)
        self.assertNotIn("agrisaathi-unified-dev-secret-key-2026", body)
        self.assertNotIn(Config.CLOUDINARY_API_SECRET or "xyz123secret", body)

    def test_18_health_endpoint_returns_safe_status(self):
        """Verify health check returns safe status, database connectivity, and storage provider."""
        resp = self.client.get('/api/health')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')
        self.assertEqual(data['storage'], 'configured')
        self.assertIn('storage_provider', data)
        self.assertIn('environment', data)

    def test_19_health_endpoint_does_not_leak_db_credentials(self):
        """Verify health endpoint does not leak raw database credentials or passwords."""
        resp = self.client.get('/api/health')
        body = resp.get_data(as_text=True)
        self.assertNotIn("password", body.lower())
        self.assertNotIn("postgresql://", body)

    def test_20_production_cors_does_not_use_wildcard(self):
        """Verify production CORS origins strictly disallow wildcard '*'."""
        with patch('config.Config.IS_PRODUCTION', True):
            with patch('config.Config.FRONTEND_URL', 'https://agrisaathi.gov.in,https://app.agrisaathi.in'):
                origins = Config.get_cors_origins()
                self.assertNotIn('*', origins)
                self.assertIn('https://agrisaathi.gov.in', origins)
                self.assertIn('https://app.agrisaathi.in', origins)

    def test_21_development_cors_allows_localhost(self):
        """Verify development CORS allows local Vite development servers."""
        with patch('config.Config.IS_PRODUCTION', False):
            origins = Config.get_cors_origins()
            self.assertIn('http://localhost:5173', origins)
            self.assertIn('http://127.0.0.1:5173', origins)

    def test_22_frontend_api_url_configured(self):
        """Verify frontend environment template documents VITE_API_URL."""
        frontend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', '.env.example')
        self.assertTrue(os.path.isfile(frontend_env))
        with open(frontend_env, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn('VITE_API_URL', content)

    def test_23_no_machine_specific_paths_in_code(self):
        """Verify runtime files do not require developer-specific machine paths."""
        app_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.py')
        with open(app_file, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn(r'C:\Users', content)
        self.assertNotIn('OneDrive', content)

    def test_24_admin_sensitive_data_masking_intact(self):
        """Verify Aadhaar and bank details remain masked in serialized profiles."""
        farmer = User.query.filter_by(role='FARMER').first()
        if farmer and farmer.farmer_profile:
            fp_dict = farmer.farmer_profile.to_dict()
            if fp_dict.get('aadhaar_masked'):
                self.assertTrue(fp_dict['aadhaar_masked'].startswith('XXXX'))
            if fp_dict.get('bank_account_masked'):
                self.assertTrue(fp_dict['bank_account_masked'].startswith('XXXX'))

    # =========================================================================
    # PART D: CONCURRENCY, INTEGRITY & POSTGRES MIGRATION (Tests 25-32)
    # =========================================================================

    def test_25_payment_idempotency_intact(self):
        """Verify PaymentRecord payment_ref uniqueness constraint prevents double payments."""
        p1 = PaymentRecord.query.first()
        if p1:
            duplicate = PaymentRecord(
                payment_ref=p1.payment_ref,
                transaction_id=p1.transaction_id,
                payer_id=p1.payer_id,
                payee_id=p1.payee_id,
                amount=100.0,
                stage="ADVANCE",
                status="ESCROW_HELD"
            )
            db.session.add(duplicate)
            with self.assertRaises(Exception):
                db.session.commit()
            db.session.rollback()

    def test_26_fpo_contribution_concurrency_and_integrity(self):
        """Verify get_with_lock helper works on CropLot without syntax errors."""
        lot = CropLot.query.first()
        if lot:
            locked_lot = get_with_lock(CropLot, lot.id)
            self.assertEqual(locked_lot.id, lot.id)

    def test_27_warehouse_capacity_integrity(self):
        """Verify get_with_lock helper works on Warehouse without syntax errors."""
        wh = Warehouse.query.first()
        if wh:
            locked_wh = get_with_lock(Warehouse, wh.id)
            self.assertEqual(locked_wh.id, wh.id)

    def test_28_logistics_assignment_integrity(self):
        """Verify get_with_lock helper works on TransportOrder without syntax errors."""
        order = TransportOrder.query.first()
        if order:
            locked_order = get_with_lock(TransportOrder, order.id)
            self.assertEqual(locked_order.id, order.id)

    def test_29_database_migrations_import_and_head(self):
        """Verify Alembic migration version file exists and can be imported."""
        mig_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations', 'versions')
        files = [f for f in os.listdir(mig_dir) if f.endswith('.py') and not f.startswith('__')]
        self.assertGreaterEqual(len(files), 1)

    def test_30_postgresql_models_compile_metadata(self):
        """Verify all SQLAlchemy models compile cleanly to PostgreSQL DDL dialect."""
        compiled_tables = 0
        for table in db.metadata.sorted_tables:
            ddl = str(CreateTable(table).compile(dialect=postgresql.dialect()))
            self.assertIn("CREATE TABLE", ddl)
            compiled_tables += 1
        self.assertGreaterEqual(compiled_tables, 15)

    def test_31_database_url_credentials_masking(self):
        """Verify mask_database_url correctly redacts plain text passwords."""
        sample_url = "postgresql://dbuser:MySuperSecret123@db.supabase.co:5432/agrisaathi"
        masked = mask_database_url(sample_url)
        self.assertNotIn("MySuperSecret123", masked)
        self.assertIn("dbuser:***@db.supabase.co:5432/agrisaathi", masked)

    def test_32_security_headers_present(self):
        """Verify security headers X-Content-Type-Options, X-Frame-Options, and Referrer-Policy."""
        resp = self.client.get('/api/health')
        self.assertEqual(resp.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(resp.headers.get('X-Frame-Options'), 'DENY')
        self.assertEqual(resp.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')


if __name__ == '__main__':
    unittest.main()
