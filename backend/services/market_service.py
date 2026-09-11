from datetime import date, timedelta
from models import db
from models.market import MarketPrice

# Realistic Maharashtra Mandi Coordinates and distances relative to Nashik & Pune
DISTRICT_DISTANCES = {
    'Nashik': {
        'Pimpalgaon APMC': {'distance_km': 30, 'toll_cost': 50},
        'Lasalgaon APMC': {'distance_km': 60, 'toll_cost': 120},
        'Dindori APMC': {'distance_km': 25, 'toll_cost': 0},
        'Pune APMC (Gultekdi)': {'distance_km': 210, 'toll_cost': 350},
        'Vashi APMC (Navi Mumbai)': {'distance_km': 165, 'toll_cost': 320},
        'Ahmednagar APMC': {'distance_km': 155, 'toll_cost': 200},
        'Solapur APMC': {'distance_km': 380, 'toll_cost': 550},
        'Latur APMC': {'distance_km': 430, 'toll_cost': 600},
        'Nagpur APMC': {'distance_km': 670, 'toll_cost': 850},
    },
    'Pune': {
        'Pune APMC (Gultekdi)': {'distance_km': 10, 'toll_cost': 0},
        'Baramati APMC': {'distance_km': 100, 'toll_cost': 150},
        'Vashi APMC (Navi Mumbai)': {'distance_km': 150, 'toll_cost': 320},
        'Lasalgaon APMC': {'distance_km': 230, 'toll_cost': 380},
        'Pimpalgaon APMC': {'distance_km': 225, 'toll_cost': 380},
        'Solapur APMC': {'distance_km': 250, 'toll_cost': 350},
        'Ahmednagar APMC': {'distance_km': 120, 'toll_cost': 180},
        'Kolhapur APMC': {'distance_km': 235, 'toll_cost': 350},
        'Latur APMC': {'distance_km': 330, 'toll_cost': 450},
    }
}

# Base transport cost: approx ₹0.012 per kg per km for mini trucks / tempo
TRANSPORT_RATE_PER_KG_KM = 0.012

def calculate_transport_cost(origin_district, market_name):
    """Calculates estimated transport cost in ₹/kg from seller district to mandi."""
    district_info = DISTRICT_DISTANCES.get(origin_district, DISTRICT_DISTANCES['Nashik'])
    market_info = district_info.get(market_name, {'distance_km': 80, 'toll_cost': 100})
    
    distance = market_info['distance_km']
    cost_per_kg = round(distance * TRANSPORT_RATE_PER_KG_KM + (market_info['toll_cost'] / 1000.0), 2)
    return {
        'distance_km': distance,
        'cost_per_kg': max(cost_per_kg, 0.40)
    }

def get_market_prices(crop=None, district=None, market_name=None, search=None, limit=50):
    """Fetches latest market prices with flexible filtering."""
    query = MarketPrice.query

    if crop:
        query = query.filter(MarketPrice.crop.ilike(f'%{crop}%'))
    if district:
        query = query.filter(MarketPrice.district.ilike(f'%{district}%'))
    if market_name:
        query = query.filter(MarketPrice.market_name.ilike(f'%{market_name}%'))
    if search:
        pattern = f'%{search}%'
        query = query.filter(
            (MarketPrice.crop.ilike(pattern)) |
            (MarketPrice.market_name.ilike(pattern)) |
            (MarketPrice.district.ilike(pattern)) |
            (MarketPrice.variety.ilike(pattern))
        )

    # Order by date descending, then crop name
    prices = query.order_by(MarketPrice.price_date.desc(), MarketPrice.average_price.desc()).limit(limit).all()
    return [p.to_dict() for p in prices]

def get_price_history(crop='Tomato', market_name=None, days=14):
    """Generates chronological price & arrival history for charting."""
    today = date.today()
    start_date = today - timedelta(days=days)

    query = MarketPrice.query.filter(
        MarketPrice.crop.ilike(f'%{crop}%'),
        MarketPrice.price_date >= start_date
    )

    if market_name:
        query = query.filter(MarketPrice.market_name.ilike(f'%{market_name}%'))

    records = query.order_by(MarketPrice.price_date.asc()).all()

    # Format into chart-friendly points
    result = []
    # If no records in DB, produce deterministic realistic timeline
    if not records:
        base_prices = {
            'Tomato': 21.0,
            'Onion': 24.5,
            'Soybean': 43.0,
            'Grapes': 62.0,
            'Pomegranate': 82.0,
            'Wheat': 22.0
        }
        base = base_prices.get(crop, 25.0)
        for i in range(days, -1, -1):
            d = today - timedelta(days=i)
            # Small realistic fluctuation
            variance = ((i * 7) % 5) - 2.0
            price = round(base + variance + (0.3 * (days - i)), 2)
            result.append({
                'date': d.strftime('%d %b'),
                'day': d.strftime('%a'),
                'average_price': price,
                'min_price': round(price * 0.88, 2),
                'max_price': round(price * 1.12, 2),
                'arrival_volume': round(1200 + (i * 45 % 400), 0)
            })
    else:
        for r in records:
            result.append({
                'date': r.price_date.strftime('%d %b') if hasattr(r.price_date, 'strftime') else str(r.price_date),
                'market_name': r.market_name,
                'average_price': r.average_price,
                'min_price': r.min_price,
                'max_price': r.max_price,
                'arrival_volume': r.arrival_volume
            })

    return result

def compare_mandis_for_crop(crop='Tomato', origin_district='Nashik'):
    """
    Compares all Mandis offering this crop and computes net realization
    after deducting local transport costs from origin district.
    """
    query = MarketPrice.query.filter(MarketPrice.crop.ilike(f'%{crop}%'))
    records = query.order_by(MarketPrice.average_price.desc()).all()

    comparison = []
    seen_markets = set()

    for r in records:
        if r.market_name in seen_markets:
            continue
        seen_markets.add(r.market_name)

        transport = calculate_transport_cost(origin_district, r.market_name)
        net_price = round(r.average_price - transport['cost_per_kg'], 2)

        comparison.append({
            'market_name': r.market_name,
            'district': r.district,
            'crop': r.crop,
            'variety': r.variety,
            'average_price': r.average_price,
            'min_price': r.min_price,
            'max_price': r.max_price,
            'arrival_volume': r.arrival_volume,
            'unit': r.unit,
            'trend': r.trend,
            'distance_km': transport['distance_km'],
            'transport_cost_per_kg': transport['cost_per_kg'],
            'net_realizable_price': net_price,
            'is_recommended': False
        })

    # Sort by net realizable price descending (best market for farmer)
    comparison.sort(key=lambda x: x['net_realizable_price'], reverse=True)
    if comparison:
        comparison[0]['is_recommended'] = True

    return comparison
