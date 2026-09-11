from flask import Blueprint, request, jsonify
from models import db
from models.user import User
from models.lot import CropLot
from models.offer import Offer
from models.notification import Notification

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
def get_dashboard_summary():
    role = request.args.get('role', 'FARMER').upper()
    user_id_param = request.args.get('user_id')

    user_id = None
    if user_id_param is not None and str(user_id_param).strip().isdigit():
        user_id = int(str(user_id_param).strip())

    # Market Price Summary for Maharashtra APMCs
    market_summary = [
        {
            'crop': 'Tomato (Hybrid)',
            'market': 'Pimpalgaon APMC',
            'district': 'Nashik',
            'avg_price': 22.5,
            'min_price': 18.0,
            'max_price': 26.0,
            'trend': 'up',
            'change': '+₹2.50 today',
            'arrival_volume': '1,450 qtl'
        },
        {
            'crop': 'Onion (Nashik Red)',
            'market': 'Lasalgaon APMC',
            'district': 'Nashik',
            'avg_price': 26.5,
            'min_price': 22.0,
            'max_price': 29.0,
            'trend': 'up',
            'change': '+₹1.80 this week',
            'arrival_volume': '3,800 qtl'
        },
        {
            'crop': 'Soybean (Yellow)',
            'market': 'Latur APMC',
            'district': 'Latur',
            'avg_price': 44.0,
            'min_price': 41.5,
            'max_price': 46.5,
            'trend': 'down',
            'change': '-₹0.50 today',
            'arrival_volume': '2,100 qtl'
        },
        {
            'crop': 'Grapes (Thompson)',
            'market': 'Pune APMC',
            'district': 'Pune',
            'avg_price': 65.0,
            'min_price': 55.0,
            'max_price': 78.0,
            'trend': 'up',
            'change': '+₹4.00 this week',
            'arrival_volume': '890 qtl'
        }
    ]

    # Storage Availability Preview
    nearby_warehouses = [
        {
            'id': 301,
            'name': 'Nashik Agro Cold Storage',
            'district': 'Nashik',
            'storage_type': 'COLD_STORAGE',
            'available_capacity': 35.0,
            'unit': 'tonne',
            'price_per_kg_per_day': 0.50,
            'availability_status': 'AVAILABLE'
        },
        {
            'id': 302,
            'name': 'Panchavati Warehouse & Agri Logistics',
            'district': 'Nashik',
            'storage_type': 'NORMAL',
            'available_capacity': 120.0,
            'unit': 'tonne',
            'price_per_kg_per_day': 0.20,
            'availability_status': 'AVAILABLE'
        }
    ]

    # 7-Day Market Trend History for Charts
    trend_history = [
        {'day': 'Day 1', 'Tomato': 19.5, 'Onion': 24.0, 'Soybean': 45.0},
        {'day': 'Day 2', 'Tomato': 20.0, 'Onion': 24.5, 'Soybean': 44.8},
        {'day': 'Day 3', 'Tomato': 20.5, 'Onion': 25.0, 'Soybean': 44.5},
        {'day': 'Day 4', 'Tomato': 21.0, 'Onion': 25.2, 'Soybean': 44.2},
        {'day': 'Day 5', 'Tomato': 21.8, 'Onion': 25.8, 'Soybean': 44.0},
        {'day': 'Day 6', 'Tomato': 22.0, 'Onion': 26.0, 'Soybean': 43.8},
        {'day': 'Day 7 (Today)', 'Tomato': 22.5, 'Onion': 26.5, 'Soybean': 44.0},
    ]

    user = User.query.get(user_id) if user_id else None

    # Query Real Isolated Data If User Exists
    if user:
        # User's own crop lots
        lots_query = CropLot.query.filter_by(seller_id=user.id)
        if role == 'FPO':
            lots_query = CropLot.query.filter_by(seller_id=user.id, seller_type='FPO')
        user_lots = lots_query.order_by(CropLot.created_at.desc()).all()
        crop_lots = [lot.to_dict() for lot in user_lots]

        # Offers on user's lots
        lot_ids = [lot.id for lot in user_lots]
        if lot_ids:
            offers = Offer.query.filter(
                Offer.crop_lot_id.in_(lot_ids),
                Offer.status == 'PENDING'
            ).order_by(Offer.created_at.desc()).all()
            pending_offers = [o.to_dict() for o in offers]
        else:
            pending_offers = []

        # User's notifications
        user_notifs = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(5).all()
        if user_notifs:
            recent_notifications = [n.to_dict() for n in user_notifs]
        else:
            name = user.name or ('FPO Partner' if role == 'FPO' else 'Farmer')
            recent_notifications = [
                {
                    'id': 9001,
                    'title': f'Welcome to AgriSaathi, {name}!',
                    'message': 'Your account registration is active and awaiting official Government verification. You can list produce or explore live mandi rates now.',
                    'type': 'SYSTEM',
                    'created_at': 'Just now',
                    'is_read': False
                }
            ]

        # AI Recommendation based on user's actual crop or seasonal advisory
        if user_lots:
            primary_crop = user_lots[0].crop
            ai_recommendation = {
                'crop': primary_crop,
                'recommendation': 'SELL SOON' if 'Tomato' in primary_crop or 'Vegetable' in primary_crop else 'STORE & HOLD',
                'recommended_window': 'Within 2-3 Days' if 'Tomato' in primary_crop else 'Next 2 Weeks',
                'current_price': user_lots[0].expected_price or 24.0,
                'predicted_price': round((user_lots[0].expected_price or 24.0) * 1.12, 1),
                'estimated_net_return': int((user_lots[0].quantity or 500) * (user_lots[0].expected_price or 24.0) * 1.10),
                'risk': 'MODERATE',
                'reason': f'Market prices in regional APMCs for {primary_crop} are trending upward. High buyer interest observed for Grade A harvests.'
            }
        else:
            ai_recommendation = {
                'crop': 'Tomato & Onion (Maharashtra Kharif)',
                'recommendation': 'REGISTER HARVEST EARLY',
                'recommended_window': 'Upcoming 7 Days',
                'current_price': 24.5,
                'predicted_price': 27.0,
                'estimated_net_return': 0,
                'risk': 'LOW',
                'reason': 'Mandi arrivals across Nashik and Pune APMCs are active. Add your produce lot early to attract premium institutional buyers with advance escrow contracts.'
            }

    else:
        # Fallback only when unauthenticated / general public preview with no user_id
        crop_lots = []
        pending_offers = []
        recent_notifications = [
            {
                'id': 9001,
                'title': 'Welcome to AgriSaathi',
                'message': 'Log in or register your account to view your farm listings and manage direct buyer offers.',
                'type': 'SYSTEM',
                'created_at': 'Just now',
                'is_read': False
            }
        ]
        ai_recommendation = {
            'crop': 'Tomato (Hybrid)',
            'recommendation': 'SELL SOON',
            'recommended_window': 'Within 2 Days',
            'current_price': 22.5,
            'predicted_price': 25.0,
            'estimated_net_return': 27200,
            'risk': 'HIGH',
            'reason': 'Market prices in Pimpalgaon APMC are forecasted to rise by ₹2.5/kg over the next 48 hours. Perishability requires prompt sale or cold storage.'
        }

    return jsonify({
        'success': True,
        'role': role,
        'market_summary': market_summary,
        'crop_lots': crop_lots,
        'ai_recommendation': ai_recommendation,
        'pending_offers': pending_offers,
        'nearby_warehouses': nearby_warehouses,
        'recent_notifications': recent_notifications,
        'trend_history': trend_history
    }), 200
