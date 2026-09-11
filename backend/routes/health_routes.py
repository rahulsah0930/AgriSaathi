from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "AgriSaathi Unified GovTech Platform",
        "version": "2.0-unified",
        "target_state": "Maharashtra",
        "roles": [
            "FARMER",
            "FPO",
            "BUYER",
            "WAREHOUSE",
            "ADMIN"
        ],
        "database": "connected",
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
