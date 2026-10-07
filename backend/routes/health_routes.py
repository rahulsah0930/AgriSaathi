from flask import Blueprint, jsonify
from sqlalchemy import text
from models import db
from config import Config
from services.file_storage_service import get_storage_provider

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    # Safe database connectivity check
    db_status = "connected"
    try:
        db.session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {type(e).__name__}"

    # Safe storage provider status check
    storage_provider = get_storage_provider()
    storage_name = storage_provider.get_provider_name()
    storage_status = "configured"
    if storage_name == 'cloudinary' and not (Config.CLOUDINARY_CLOUD_NAME and Config.CLOUDINARY_API_KEY):
        storage_status = "unconfigured_credentials"

    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "AgriSaathi Unified GovTech Platform",
        "version": "2.0-unified",
        "target_state": "Maharashtra",
        "database": db_status,
        "storage": storage_status,
        "storage_provider": storage_name,
        "environment": Config.APP_ENV,
        "demo_mode": Config.DEMO_MODE,
        "roles": [
            "FARMER",
            "FPO",
            "BUYER",
            "WAREHOUSE",
            "ADMIN",
            "LOGISTICS"
        ],
        "modules": [
            "Farmer Portal",
            "FPO Aggregation Portal",
            "Buyer Marketplace & Two-Way Negotiations",
            "Cold Storage & Warehouse Logistics",
            "Government Nodal Verification & Escrow Oversight",
            "AI-Assisted Visual Quality Verification",
            "APMC Mandi Intelligence & Ridge-EMA Price Forecasts",
            "Contract Transactions & Two-Stage Escrow Payments",
            "Grievance Redressal & Official Adjudication"
        ]
    }), 200
