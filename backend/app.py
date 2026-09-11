import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
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
from utils.seed_db import seed_demo_accounts

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    upload_folder = os.path.join(app.root_path, 'uploads', 'crop_lots')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # Enable CORS for frontend integration and media access
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/uploads/*": {"origins": "*"}})

    # Initialize SQLAlchemy database
    db.init_app(app)

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

    # Auto-create tables and seed demo accounts for all 5 roles
    with app.app_context():
        db.create_all()
        seed_demo_accounts()

    @app.route('/uploads/crop_lots/<path:filename>')
    def serve_crop_image(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"[AgriSaathi] Unified GovTech Platform Backend running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', True))
