from flask import Blueprint, request, jsonify
from services.market_service import (
    get_market_prices,
    get_price_history,
    compare_mandis_for_crop,
    calculate_transport_cost
)
from models.market import MarketPrice
from models import db

market_bp = Blueprint('market', __name__, url_prefix='/api/market-prices')

@market_bp.route('', methods=['GET'])
def list_prices():
    """Fetch all current APMC prices with search & filter params."""
    try:
        crop = request.args.get('crop')
        district = request.args.get('district')
        market_name = request.args.get('market_name')
        search = request.args.get('search')
        limit = int(request.args.get('limit', 60))

        prices = get_market_prices(
            crop=crop,
            district=district,
            market_name=market_name,
            search=search,
            limit=limit
        )

        return jsonify({
            'success': True,
            'count': len(prices),
            'prices': prices
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@market_bp.route('/history', methods=['GET'])
def price_history():
    """Get historical price and arrival trends for charts."""
    try:
        crop = request.args.get('crop', 'Tomato')
        market_name = request.args.get('market_name')
        days = int(request.args.get('days', 14))

        history = get_price_history(crop=crop, market_name=market_name, days=days)

        return jsonify({
            'success': True,
            'crop': crop,
            'market_name': market_name,
            'days': days,
            'data': history
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@market_bp.route('/compare', methods=['GET'])
def compare_markets():
    """
    Compares all Mandis offering a specified crop and calculates
    net realizable price after transport deductions from seller district.
    """
    try:
        crop = request.args.get('crop', 'Tomato')
        origin_district = request.args.get('district', 'Nashik')

        comparison = compare_mandis_for_crop(crop=crop, origin_district=origin_district)

        return jsonify({
            'success': True,
            'crop': crop,
            'origin_district': origin_district,
            'count': len(comparison),
            'comparison': comparison
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@market_bp.route('/meta', methods=['GET'])
def get_metadata():
    """Returns available crops, districts, and APMCs for dropdown filters."""
    try:
        crops = [r[0] for r in db.session.query(MarketPrice.crop).distinct().all() if r[0]]
        districts = [r[0] for r in db.session.query(MarketPrice.district).distinct().all() if r[0]]
        mandis = [r[0] for r in db.session.query(MarketPrice.market_name).distinct().all() if r[0]]

        # Provide default fallbacks if database was just initiated
        if not crops:
            crops = ['Tomato', 'Onion', 'Grapes', 'Pomegranate', 'Soybean', 'Wheat', 'Sugarcane', 'Cotton', 'Banana']
        if not districts:
            districts = ['Nashik', 'Pune', 'Ahmednagar', 'Solapur', 'Kolhapur', 'Latur', 'Jalgaon', 'Nagpur', 'Mumbai']
        if not mandis:
            mandis = [
                'Pimpalgaon APMC', 'Lasalgaon APMC', 'Dindori APMC',
                'Pune APMC (Gultekdi)', 'Vashi APMC (Navi Mumbai)',
                'Ahmednagar APMC', 'Latur APMC', 'Solapur APMC', 'Kolhapur APMC'
            ]

        return jsonify({
            'success': True,
            'crops': sorted(crops),
            'districts': sorted(districts),
            'mandis': sorted(mandis)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
