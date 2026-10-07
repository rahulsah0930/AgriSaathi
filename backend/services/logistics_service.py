import math
from datetime import datetime
from models import db
from models.logistics import TransportOrder
from models.transaction import Transaction, TransactionHistory
from models.user import User
from models.commodity import Commodity
from models.notification import emit_idempotent_notification


ALLOWED_LOGISTICS_TRANSITIONS = {
    'REQUESTED': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['PICKUP_SCHEDULED', 'CANCELLED'],
    'PICKUP_SCHEDULED': ['PICKED_UP', 'CANCELLED'],
    'PICKED_UP': ['IN_TRANSIT'],
    'IN_TRANSIT': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': []
}


def calculate_haversine_distance_km(lat1, lon1, lat2, lon2):
    """
    Deterministic spherical distance calculation using the Haversine formula.
    Clearly labeled 'Approximate distance' (not road-routed).
    Returns None if any coordinate is missing or invalid.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
        return None

    # Earth radius in km
    R = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 1)


def recommend_vehicle_requirement(quantity_kg, crop_name=None, commodity=None):
    """
    Operational vehicle recommendation based primarily on quantity payload.
    Also flags perishable commodities for refrigerated recommendation.
    """
    qty = float(quantity_kg or 0)
    if qty <= 1000:
        vehicle_type = 'MINI_TRUCK'
    elif qty <= 2500:
        vehicle_type = 'PICKUP'
    elif qty <= 6000:
        vehicle_type = 'LCV'
    else:
        vehicle_type = 'TRUCK'

    refrigerated_recommended = False
    refrigeration_note = None

    perishable_keywords = [
        'tomato', 'grape', 'strawberry', 'flower', 'milk', 'capsicum',
        'mushroom', 'spinach', 'leafy', 'pomegranate', 'custard apple', 'banana'
    ]
    crop_lower = (crop_name or '').lower()
    
    if commodity:
        cat = (getattr(commodity, 'category', '') or '').lower()
        if cat in ['vegetables', 'fruits', 'dairy', 'flowers']:
            refrigerated_recommended = True
    
    if any(kw in crop_lower for kw in perishable_keywords):
        refrigerated_recommended = True

    if refrigerated_recommended:
        refrigeration_note = "Refrigerated transport recommended (Operational recommendation for fresh/perishable produce)"

    return vehicle_type, refrigerated_recommended, refrigeration_note


def estimate_transport_cost(distance_km, vehicle_type='PICKUP', refrigerated_recommended=False):
    """
    Transparent prototype estimate:
    base charge + distance * rate_per_km * vehicle_multiplier.
    Returns None if distance is unavailable.
    """
    if distance_km is None:
        return None

    base_charge = 1200.0
    rate_per_km = 32.0

    multipliers = {
        'MINI_TRUCK': 1.0,
        'PICKUP': 1.15,
        'LCV': 1.4,
        'TRUCK': 1.8,
        'REFRIGERATED_VEHICLE': 1.6
    }
    mult = multipliers.get(vehicle_type, 1.15)
    if refrigerated_recommended:
        mult *= 1.25

    cost = base_charge + (distance_km * rate_per_km * mult)
    return round(cost, 2)


def validate_logistics_transition(current_status, new_status):
    """
    Validates state machine transitions.
    Rejects invalid jumps.
    """
    current_status = str(current_status).strip().upper()
    new_status = str(new_status).strip().upper()

    allowed = ALLOWED_LOGISTICS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        return False, f"Invalid state transition from '{current_status}' to '{new_status}'. Allowed transitions: {allowed}"
    return True, None


def emit_logistics_notification(order, event_key, recipient_id, title, message):
    """
    Emits an idempotent notification using unique key: logistics:<order_id>:<event_key>.
    """
    idempotency_key = f"logistics:{order.id}:{event_key}"
    return emit_idempotent_notification(
        event_key=idempotency_key,
        recipient_user_id=recipient_id,
        title=title,
        message=message,
        notif_type='LOGISTICS_UPDATE'
    )
