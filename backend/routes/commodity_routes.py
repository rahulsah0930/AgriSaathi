from flask import Blueprint, request, jsonify
from services.commodity_service import (
    search_commodities,
    get_commodity_by_id,
    get_commodity_by_name,
    resolve_commodity_name
)
from models.commodity import Commodity

commodity_bp = Blueprint('commodities', __name__, url_prefix='/api/commodities')

@commodity_bp.route('', methods=['GET'])
def list_commodities():
    """
    List active commodities with optional category filter and pagination.
    """
    try:
        category = request.args.get('category')
        limit = min(int(request.args.get('limit', 100)), 200)
        offset = max(int(request.args.get('offset', 0)), 0)

        query = Commodity.query.filter_by(is_active=True)
        if category and category.upper() != 'ALL':
            query = query.filter(Commodity.category.ilike(f"%{category}%"))

        total_count = query.count()
        commodities = query.order_by(Commodity.canonical_name.asc()).offset(offset).limit(limit).all()

        return jsonify({
            'success': True,
            'total': total_count,
            'count': len(commodities),
            'commodities': [c.to_dict() for c in commodities]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@commodity_bp.route('/search', methods=['GET'])
def search_endpoint():
    """
    Multilingual fuzzy search endpoint for commodities.
    Accepts:
    - q: search string (English, Hindi, Marathi, Roman transliterations, typos)
    - category: optional category filter
    - limit: max number of results (default 10, max 30)
    """
    try:
        q = request.args.get('q', '').strip()
        category = request.args.get('category')
        limit = min(int(request.args.get('limit', 10)), 30)

        results = search_commodities(query=q, category=category, limit=limit)

        return jsonify({
            'success': True,
            'query': q,
            'count': len(results),
            'commodities': results
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@commodity_bp.route('/categories', methods=['GET'])
def list_categories():
    """Returns distinct commodity categories in the catalog."""
    try:
        categories = [r[0] for r in Commodity.query.with_entities(Commodity.category).distinct().order_by(Commodity.category.asc()).all() if r[0]]
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@commodity_bp.route('/resolve', methods=['GET'])
def resolve_endpoint():
    """
    Resolves a raw query string (e.g. 'tamatar', 'pyaaj', 'tomatto')
    to its canonical commodity name and object.
    """
    try:
        q = request.args.get('q', '').strip()
        if not q:
            return jsonify({'success': False, 'message': 'Query parameter "q" is required.'}), 400

        results = search_commodities(query=q, limit=1)
        if results and results[0].get('match_score', 0) >= 65.0:
            top_match = results[0]
            return jsonify({
                'success': True,
                'resolved': True,
                'canonical_name': top_match['canonical_name'],
                'commodity': top_match
            }), 200

        return jsonify({
            'success': True,
            'resolved': False,
            'canonical_name': q,
            'commodity': None
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@commodity_bp.route('/<int:commodity_id>', methods=['GET'])
def get_commodity(commodity_id):
    """Fetches details for a single commodity by its primary key ID."""
    try:
        commodity = get_commodity_by_id(commodity_id)
        if not commodity or not commodity.is_active:
            return jsonify({
                'success': False,
                'error': 'Not Found',
                'message': f'Commodity #{commodity_id} not found.'
            }), 404

        return jsonify({
            'success': True,
            'commodity': commodity.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
