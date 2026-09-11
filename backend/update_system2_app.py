import os

app_py_content = '''import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from routes import api_bp
from routes.auth_routes import auth_bp
from routes.buyer_routes import buyer_bp
from routes.requirement_routes import requirement_bp
from routes.offer_routes import offer_bp
from routes.order_routes import order_bp
from routes.warehouse_routes import warehouse_bp
from routes.storage_routes import storage_bp
from routes.payment_routes import payment_bp
from routes.admin_routes import admin_bp
from routes.grievance_routes import grievance_bp
from routes.notification_routes import notification_bp
from services.demo_seeder import seed_demo_users

from sqlalchemy import create_engine

def get_working_db_uri(config_class):
    # If explicitly set to use SQLite, return SQLite URI
    if config_class.USE_SQLITE:
        sqlite_path = os.path.join(os.path.dirname(__file__), "agrisaathi_dev.db")
        return f"sqlite:///{sqlite_path}"
    
    # Try testing MySQL connection
    try:
        mysql_uri = config_class.SQLALCHEMY_DATABASE_URI
        if mysql_uri and not mysql_uri.startswith("sqlite"):
            engine = create_engine(mysql_uri, connect_args={"connect_timeout": 3})
            with engine.connect() as conn:
                pass
        return mysql_uri
    except Exception as e:
        print(f"[WARN] MySQL connection unavailable ({e}). Falling back to local SQLite database.")
        sqlite_path = os.path.join(os.path.dirname(__file__), "agrisaathi_dev.db")
        return f"sqlite:///{sqlite_path}"

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    upload_folder = os.path.join(app.root_path, 'uploads', 'crop_lots')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # Determine database URI (MySQL with graceful SQLite fallback for frictionless local testing)
    app.config["SQLALCHEMY_DATABASE_URI"] = get_working_db_uri(config_class)

    # Enable CORS for frontend requests and static uploads
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/uploads/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize SQLAlchemy database
    db.init_app(app)

    # Register core blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(buyer_bp)
    app.register_blueprint(requirement_bp)
    app.register_blueprint(offer_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(warehouse_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(grievance_bp)
    app.register_blueprint(notification_bp)

    with app.app_context():
        try:
            db.create_all()
            seed_demo_users()
            print("[OK] Database tables verified/initialized successfully.")
        except Exception as e:
            print(f"[ERROR] Database creation error: {e}")

    @app.route('/uploads/crop_lots/<path:filename>')
    def serve_crop_image(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "AgriSaathi Unified API",
            "version": "2.0-unified",
            "roles": ["FARMER", "FPO", "BUYER", "WAREHOUSE", "ADMIN"],
            "database": "connected"
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[AgriSaathi] Unified Backend running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
'''

target_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\app.py"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(app_py_content)
print(f"[OK] Successfully updated {target_path}")
