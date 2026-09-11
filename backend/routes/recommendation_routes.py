from flask import Blueprint, request, jsonify
from services.sale_recommendation import calculate_net_sale_recommendation
from services.crop_knowledge import CROP_PROFILES, get_crop_profile

recommendation_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

@recommendation_bp.route('', methods=['POST'])
def get_recommendation():
    """Calculates comprehensive Net Return sale recommendation and strategy comparison."""
    try:
        data = request.get_json() or {}
        crop = data.get('crop', 'Tomato')
        variety = data.get('variety', 'Standard')
        quantity = float(data.get('quantity', 1000))
        unit = data.get('unit', 'kg')
        district = data.get('district', 'Nashik')
        market_name = data.get('market_name', 'Pimpalgaon APMC')
        harvest_date = data.get('harvest_date')
        current_storage_status = data.get('storage_status', 'NOT_STORED')

        recommendation = calculate_net_sale_recommendation(
            crop=crop,
            variety=variety,
            quantity=quantity,
            unit=unit,
            district=district,
            market_name=market_name,
            harvest_date=harvest_date,
            current_storage_status=current_storage_status
        )

        return jsonify({
            'success': True,
            'recommendation': recommendation
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@recommendation_bp.route('', methods=['GET'])
def get_recommendation_get():
    """Quick GET endpoint for Net Return advisory."""
    try:
        crop = request.args.get('crop', 'Tomato')
        quantity = float(request.args.get('quantity', 1000))
        unit = request.args.get('unit', 'kg')
        district = request.args.get('district', 'Nashik')
        market_name = request.args.get('market_name', 'Pimpalgaon APMC')

        recommendation = calculate_net_sale_recommendation(
            crop=crop,
            quantity=quantity,
            unit=unit,
            district=district,
            market_name=market_name
        )

        return jsonify({
            'success': True,
            'recommendation': recommendation
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@recommendation_bp.route('/knowledge', methods=['GET'])
def get_crop_knowledge():
    """Returns empirical perishability, shelf life, and storage cost profiles."""
    crop = request.args.get('crop')
    if crop:
        return jsonify({
            'success': True,
            'profile': get_crop_profile(crop)
        }), 200

    return jsonify({
        'success': True,
        'crops': CROP_PROFILES
    }), 200
