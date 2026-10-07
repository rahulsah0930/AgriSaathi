from datetime import datetime, date, timedelta
from models.notification import emit_idempotent_notification

def convert_to_tonnes(quantity, unit):
    """Converts a given quantity to metric tonnes (MT) for facility capacity accounting."""
    if not quantity or quantity <= 0:
        return 0.0
    u = (unit or 'kg').strip().lower()
    if u in ['quintal', 'qtl', 'quintals']:
        return float(quantity) / 10.0
    elif u in ['tonne', 'ton', 'tonnes', 'tons', 'mt']:
        return float(quantity)
    else:
        # Default kg
        return float(quantity) / 1000.0

def convert_to_kg(quantity, unit):
    """Converts a given quantity to kilograms (kg) for daily rate calculations."""
    if not quantity or quantity <= 0:
        return 0.0
    u = (unit or 'kg').strip().lower()
    if u in ['quintal', 'qtl', 'quintals']:
        return float(quantity) * 100.0
    elif u in ['tonne', 'ton', 'tonnes', 'tons', 'mt']:
        return float(quantity) * 1000.0
    else:
        # Default kg
        return float(quantity)

def recommend_storage_type(crop_name=None, commodity=None):
    """
    Returns an operational prototype recommendation for storage facility type
    based on commodity perishability class.
    
    NOTE: Operational recommendation only. Not an official scientific prescription.
    """
    p_class = None
    if commodity:
        p_class = getattr(commodity, 'perishability_class', None)
    elif crop_name:
        from services.commodity_service import resolve_commodity_name, get_commodity_by_name
        canonical = resolve_commodity_name(crop_name)
        if canonical:
            c_obj = get_commodity_by_name(canonical)
            if c_obj:
                p_class = getattr(c_obj, 'perishability_class', None)
        if not p_class:
            name_lower = str(crop_name).lower()
            if any(k in name_lower for k in ['tomato', 'grape', 'grapes', 'strawberry', 'chilli', 'spinach', 'coriander', 'vegetable', 'fruit', 'pomegranate', 'onion']):
                p_class = 'HIGH'
            elif any(k in name_lower for k in ['wheat', 'rice', 'grain', 'maize', 'soybean', 'gram', 'dal', 'pulse']):
                p_class = 'LOW'

    p_class = p_class or 'MEDIUM'

    if p_class == 'HIGH':
        return {
            'storage_type': 'COLD_STORAGE',
            'label': 'Refrigerated Cold Storage (0°C - 4°C)',
            'recommendation_text': 'Operational recommendation: Refrigerated multi-chamber cold storage recommended for high perishability produce to minimize post-harvest loss.'
        }
    elif p_class == 'LOW':
        return {
            'storage_type': 'DRY_STORAGE',
            'label': 'Dry Storage / Ambient Warehouse',
            'recommendation_text': 'Operational recommendation: Dry, ventilated ambient warehouse storage suitable for low perishability produce.'
        }
    else:
        return {
            'storage_type': 'CONTROLLED_STORAGE',
            'label': 'Controlled Atmosphere / Cold Storage',
            'recommendation_text': 'Operational recommendation: Controlled humidity & pre-cooled storage recommended.'
        }

def estimate_storage_cost(warehouse, quantity, unit, duration_days):
    """
    Calculates transparent estimated storage cost on backend.
    Formula: quantity_kg * price_per_kg_per_day * duration_days
    """
    qty_kg = convert_to_kg(quantity, unit)
    days = max(1, int(duration_days or 1))
    rate = float(warehouse.price_per_kg_per_day or 0.02)
    estimated_cost = round(qty_kg * rate * days, 2)
    return estimated_cost

def validate_storage_booking_transition(current_status, target_status):
    """
    Enforces valid state machine progression for storage bookings:
    REQUESTED -> APPROVED -> CHECKED_IN -> ACTIVE -> CHECKED_OUT -> COMPLETED
    or REJECTED / CANCELLED.
    """
    valid_transitions = {
        'REQUESTED': ['APPROVED', 'REJECTED', 'CANCELLED'],
        'APPROVED': ['CHECKED_IN', 'CANCELLED'],
        'CHECKED_IN': ['ACTIVE'],
        'ACTIVE': ['CHECKED_OUT'],
        'CHECKED_OUT': ['COMPLETED'],
        'REJECTED': [],
        'CANCELLED': [],
        'COMPLETED': []
    }

    curr = (current_status or '').upper()
    targ = (target_status or '').upper()

    if curr not in valid_transitions:
        return False, f"Unknown current storage booking status '{curr}'"

    allowed = valid_transitions[curr]
    if targ not in allowed:
        return False, f"Illegal storage booking transition from {curr} to {targ}. Allowed next states: {allowed or 'None (Terminal)'}"

    return True, None

def emit_storage_notification(booking, event_type, extra_msg=None):
    """
    Emits idempotent notifications for storage booking lifecycle milestones.
    """
    event_key = f"storage_booking:{booking.id}:{event_type.lower()}"
    user_id = booking.user_id
    crop_str = f"{booking.crop} ({booking.quantity} {booking.unit})"
    wh_name = booking.warehouse.name if booking.warehouse else "Warehouse"

    titles = {
        'APPROVED': f"Storage Booking Approved: {booking.booking_ref}",
        'REJECTED': f"Storage Booking Declined: {booking.booking_ref}",
        'CHECKED_IN': f"Produce Checked In: {booking.booking_ref}",
        'ACTIVE': f"Produce in Active Storage: {booking.booking_ref}",
        'CHECKED_OUT': f"Produce Checked Out: {booking.booking_ref}",
        'COMPLETED': f"Storage Booking Completed: {booking.booking_ref}",
        'CANCELLED': f"Storage Booking Cancelled: {booking.booking_ref}"
    }

    messages = {
        'APPROVED': f"Your storage reservation for {crop_str} has been approved by {wh_name}. You may proceed with check-in delivery.",
        'REJECTED': f"Your storage reservation for {crop_str} was declined by {wh_name}. {extra_msg or ''}",
        'CHECKED_IN': f"Consignment of {crop_str} was physically received and checked into {wh_name}.",
        'ACTIVE': f"Your consignment of {crop_str} is now stored in active chamber custody at {wh_name}.",
        'CHECKED_OUT': f"Your consignment of {crop_str} has been checked out and released from {wh_name}.",
        'COMPLETED': f"Storage booking {booking.booking_ref} has been concluded and settled.",
        'CANCELLED': f"Storage booking {booking.booking_ref} was cancelled."
    }

    title = titles.get(event_type, f"Storage Update: {booking.booking_ref}")
    msg = messages.get(event_type, f"Status updated to {event_type} for {crop_str} at {wh_name}.")

    notif_type = 'SUCCESS' if event_type in ['APPROVED', 'COMPLETED', 'CHECKED_IN'] else ('WARNING' if event_type in ['REJECTED', 'CANCELLED'] else 'INFO')
    return emit_idempotent_notification(event_key, user_id, title, msg, notif_type)
