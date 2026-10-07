import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config, mask_database_url, normalize_database_url
from utils.error_handlers import register_error_handlers
from models import db
from routes.health_routes import health_bp
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.lot_routes import lot_bp
from routes.fpo_routes import fpo_bp
from routes.market_routes import market_bp
from routes.prediction_routes import prediction_bp
from routes.recommendation_routes import recommendation_bp
from routes.storage_routes import storage_bp
from routes.offer_routes import offer_bp
from routes.notification_routes import notification_bp
from routes.admin_routes import admin_bp
from routes.transaction_routes import transaction_bp
from routes.payment_routes import payment_bp
from routes.grievance_routes import grievance_bp
from routes.commodity_routes import commodity_bp
from routes.logistics_routes import logistics_bp
from utils.seed_db import seed_demo_accounts

migrate = Migrate()

def create_app(config_class=Config):
    # Enforce production security and credential validations before app creation
    config_class.validate_production_config()

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Explicitly enforce database URI normalization on app.config before engine initialization
    raw_db_uri = app.config.get('SQLALCHEMY_DATABASE_URI') or os.getenv('DATABASE_URL')
    if raw_db_uri:
        app.config['SQLALCHEMY_DATABASE_URI'] = normalize_database_url(raw_db_uri)

    # Safe diagnostic: print ONLY the selected database dialect/driver scheme during startup
    active_uri = app.config.get('SQLALCHEMY_DATABASE_URI') or ''
    scheme = active_uri.split('://')[0] if '://' in active_uri else 'unknown'
    print(f"[AgriSaathi] Database driver selected: {scheme}")

    upload_folder = os.path.join(app.root_path, 'uploads', 'crop_lots')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # Enable CORS with strict origin controls
    allowed_origins = config_class.get_cors_origins()
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        },
        r"/uploads/*": {"origins": allowed_origins}
    })

    # Initialize SQLAlchemy database and Flask-Migrate
    db.init_app(app)
    migrate.init_app(app, db)

    # Register error handlers
    register_error_handlers(app)

    # Register all unified blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(lot_bp)
    app.register_blueprint(fpo_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(offer_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(grievance_bp)
    app.register_blueprint(commodity_bp)
    app.register_blueprint(logistics_bp)

    # Commodity uploads directory
    commodity_folder = os.path.join(app.root_path, 'uploads', 'commodities')
    os.makedirs(commodity_folder, exist_ok=True)
    app.config['COMMODITY_FOLDER'] = commodity_folder

    # POD uploads directory
    pod_folder = os.path.join(app.root_path, 'uploads', 'pod')
    os.makedirs(pod_folder, exist_ok=True)
    app.config['POD_FOLDER'] = pod_folder

    # Add security headers
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Database initialization & migrations
    with app.app_context():
        try:
            is_sqlite = db.engine.url.drivername.startswith('sqlite')
            if is_sqlite:
                db.create_all()
                from utils.migrate_aggregation import run_aggregation_migration
                run_aggregation_migration()
                from utils.migrate_phase4 import run_phase4_migration
                run_phase4_migration()
                from utils.migrate_phase5 import run_phase5_migration
                run_phase5_migration()
                from utils.migrate_phase6 import run_phase6_migration
                run_phase6_migration()
                from utils.migrate_phase7 import run_phase7_migration
                run_phase7_migration()
            else:
                # Production PostgreSQL: ensure tables exist if alembic hasn't run yet
                db.create_all()

            # Demo account seeding only if explicitly enabled
            if app.config.get('DEMO_MODE', False):
                seed_demo_accounts()
            else:
                print("[AgriSaathi] Production initialization: Demo accounts auto-seeding disabled (DEMO_MODE=false).")

            # Reference commodity catalog seeding is always deterministic and idempotent
            from services.commodity_service import seed_commodities_if_needed
            seed_commodities_if_needed()
        except Exception as e:
            print(f"[WARN] Database initialization notice: {e}")

    # Static file serving routes for local development or fallback
    @app.route('/uploads/crop_lots/<path:filename>')
    def serve_crop_image(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/uploads/commodities/<path:filename>')
    def serve_commodity_image(filename):
        return send_from_directory(app.config['COMMODITY_FOLDER'], filename)

    @app.route('/uploads/pod/<path:filename>')
    def serve_pod_image(filename):
        return send_from_directory(app.config['POD_FOLDER'], filename)

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    safe_db = mask_database_url(app.config.get('SQLALCHEMY_DATABASE_URI'))
    print(f"[AgriSaathi] GovTech Platform Backend starting on port {port}")
    print(f"[AgriSaathi] Active Database: {safe_db}")
    print(f"[AgriSaathi] Storage Provider: {app.config.get('STORAGE_PROVIDER', 'local')}")
    print(f"[AgriSaathi] Demo Mode: {app.config.get('DEMO_MODE', False)}")
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', True))
