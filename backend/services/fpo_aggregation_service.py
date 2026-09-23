from datetime import datetime, timedelta
from models import db
from models.notification import Notification
from models.lot import FPOLotMember

CROP_PERISHABILITY_PROFILES = {
    'Tomato': {
        'category': 'VERY_HIGH',
        'ambient_shelf_life_hours': 36,
        'base_ambient_window_hours': 10,
        'base_cold_window_hours': 24,
        'risk_level': 'HIGH',
        'reason': 'Tomato is highly perishable with ambient shelf-life of 24–48 hours. Aggregating within a 10-hour window prevents heat stress, softness, and post-harvest spoilage before cold-chain dispatch.'
    },
    'Grapes': {
        'category': 'VERY_HIGH',
        'ambient_shelf_life_hours': 48,
        'base_ambient_window_hours': 12,
        'base_cold_window_hours': 36,
        'risk_level': 'HIGH',
        'reason': 'Grapes are susceptible to berry drop and dehydration under ambient conditions. A 12-hour collection window is recommended to reach pre-cooling facilities quickly.'
    },
    'Strawberry': {
        'category': 'VERY_HIGH',
        'ambient_shelf_life_hours': 24,
        'base_ambient_window_hours': 8,
        'base_cold_window_hours': 24,
        'risk_level': 'HIGH',
        'reason': 'Strawberries lose firmness rapidly. Immediate aggregation within 8 hours is essential for supermarket and export quality.'
    },
    'Pomegranate': {
        'category': 'HIGH',
        'ambient_shelf_life_hours': 120,
        'base_ambient_window_hours': 24,
        'base_cold_window_hours': 48,
        'risk_level': 'MEDIUM',
        'reason': 'Pomegranates have moderate aril resilience but suffer rind discoloration if left in warm sun. A 24-hour collection window balances harvesting schedules with export quality.'
    },
    'Onion': {
        'category': 'MEDIUM',
        'ambient_shelf_life_hours': 720,
        'base_ambient_window_hours': 72,
        'base_cold_window_hours': 120,
        'risk_level': 'LOW',
        'reason': 'Cured onions have good ambient storage stability. A 72-hour (3-day) aggregation window allows farmers from surrounding villages to deliver produce without risk of degradation.'
    },
    'Potato': {
        'category': 'MEDIUM',
        'ambient_shelf_life_hours': 720,
        'base_ambient_window_hours': 72,
        'base_cold_window_hours': 120,
        'risk_level': 'LOW',
        'reason': 'Potatoes are resilient under shaded ambient conditions. A 72-hour window facilitates bulk grading and bag packing.'
    },
    'Soybean': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 4320,
        'base_ambient_window_hours': 168,
        'base_cold_window_hours': 168,
        'risk_level': 'LOW',
        'reason': 'Soybean is dry oilseed grain with low perishability at standard moisture (<12%). A 7-day (168h) window provides ample time for large-volume mandi/processing aggregation.'
    },
    'Wheat': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 8760,
        'base_ambient_window_hours': 168,
        'base_cold_window_hours': 168,
        'risk_level': 'LOW',
        'reason': 'Wheat is non-perishable dry grain. A 7-day window enables thorough member mobilization and full truckload formation.'
    },
    'Cotton': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 8760,
        'base_ambient_window_hours': 168,
        'base_cold_window_hours': 168,
        'risk_level': 'LOW',
        'reason': 'Seed cotton can be safely collected over a 7-day period for ginning mill aggregation batches.'
    },
}

def get_weather_risk_factor(district=None):
    """
    Pluggable weather service hook.
    Returns available environmental factors. If real weather data is not currently
    connected, transparently reports fallback without inventing simulated readings.
    """
    return {
        'weather_service_active': False,
        'note': 'Real-time weather station integration pluggable. Using agronomic crop perishability baselines.'
    }

def get_smart_collection_duration(crop, storage_status='NOT_STORED', target_quantity=None, unit='kg'):
    """
    Generates a transparent, agronomic advisory recommendation for collection window duration.
    Does NOT use fake random AI values or guarantee crop shelf life.
    """
    clean_crop = crop.strip() if crop else 'Tomato'
    profile = CROP_PERISHABILITY_PROFILES.get(clean_crop)

    if not profile:
        # Fallback check partial matches
        for known_crop, p in CROP_PERISHABILITY_PROFILES.items():
            if known_crop.lower() in clean_crop.lower():
                profile = p
                break

    if not profile:
        profile = {
            'category': 'MEDIUM',
            'ambient_shelf_life_hours': 72,
            'base_ambient_window_hours': 24,
            'base_cold_window_hours': 48,
            'risk_level': 'MEDIUM',
            'reason': f'{clean_crop} standard aggregation window recommendation based on ambient handling norms.'
        }

    is_cold_storage = (storage_status == 'IN_STORAGE')
    suggested_hours = profile['base_cold_window_hours'] if is_cold_storage else profile['base_ambient_window_hours']

    reason = profile['reason']
    if is_cold_storage:
        reason += ' Cold-storage availability safely extends the collection window.'

    factors = {
        'crop': clean_crop,
        'perishability_category': profile['category'],
        'storage_condition': storage_status,
        'cold_storage_available': is_cold_storage,
        'weather_integration': get_weather_risk_factor()
    }

    return {
        'crop': clean_crop,
        'suggested_hours': suggested_hours,
        'risk_level': profile['risk_level'],
        'perishability_category': profile['category'],
        'reason': reason,
        'factors_considered': factors,
        'disclaimer': 'Advisory guideline only. Actual shelf life depends on farm-gate harvest conditions, sorting, and ambient transport temperature.'
    }

def evaluate_aggregation_status(lot, commit=True):
    """
    Authoritative backend evaluation of an aggregation lot lifecycle:
    - Checks deadline against server time
    - Calculates committed quantity vs target
    - Transitions status: OPEN -> CLOSING_SOON (90%) -> FILLED (100%) or EXPIRED
    - Generates strictly IDEMPOTENT notifications for 90%, 100%, and deadline expiration.
    """
    if not lot or lot.seller_type != 'FPO':
        return getattr(lot, 'aggregation_status', 'OPEN')

    # If lot is explicitly finalized or cancelled, do not mutate state
    if lot.aggregation_status in ('CLOSED', 'CANCELLED'):
        return lot.aggregation_status

    now = datetime.utcnow()
    # Compute committed quantity accurately from database query or fallback to lot.quantity
    db_sum = db.session.query(db.func.sum(FPOLotMember.quantity)).filter_by(fpo_lot_id=lot.id).scalar()
    committed_qty = round(float(db_sum if db_sum is not None else (lot.quantity or 0.0)), 2)
    target_qty = round(lot.target_quantity if lot.target_quantity is not None else (lot.quantity or 0.0), 2)
    changed = False

    # 1. Check Deadline Expiration
    if lot.collection_deadline_at and now > lot.collection_deadline_at:
        if committed_qty < target_qty:
            if lot.aggregation_status != 'EXPIRED':
                lot.aggregation_status = 'EXPIRED'
                lot.status = 'EXPIRED'
                changed = True

            # Minimal idempotent notification for deadline reached
            if lot.deadline_notified_at is None:
                lot.deadline_notified_at = now
                changed = True
                notif = Notification(
                    user_id=lot.seller_id,
                    title=f'{lot.crop} Collection Window Ended',
                    message=f'Collection window for {lot.crop} (Lot #{lot.id}) ended with {committed_qty:g} {lot.unit} committed out of {target_qty:g} {lot.unit}. You can proceed with collected quantity or extend window.',
                    type='FPO'
                )
                db.session.add(notif)

            if changed and commit:
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
            return lot.aggregation_status

    # 2. Check 100% Target Reached (FILLED)
    if target_qty > 0 and committed_qty >= target_qty:
        if lot.aggregation_status != 'FILLED':
            lot.aggregation_status = 'FILLED'
            changed = True

        # Minimal idempotent notification for 100% target reached
        if lot.filled_notified_at is None:
            lot.filled_notified_at = now
            changed = True
            notif = Notification(
                user_id=lot.seller_id,
                title=f'{lot.crop} Aggregation Target Reached',
                message=f'{lot.crop} aggregation (Lot #{lot.id}) has reached its target of {target_qty:g} {lot.unit}. New contributions are now closed.',
                type='FPO'
            )
            db.session.add(notif)

        if changed and commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
        return lot.aggregation_status

    # 3. Check 90% Target Reached (CLOSING_SOON)
    if target_qty > 0 and committed_qty >= (0.9 * target_qty) and committed_qty < target_qty:
        if lot.aggregation_status != 'CLOSING_SOON':
            lot.aggregation_status = 'CLOSING_SOON'
            changed = True

        # Minimal idempotent notification for 90% near-capacity
        if lot.near_capacity_notified_at is None:
            lot.near_capacity_notified_at = now
            changed = True
            remaining = round(target_qty - committed_qty, 2)
            notif = Notification(
                user_id=lot.seller_id,
                title=f'{lot.crop} Aggregation 90% Full',
                message=f'{lot.crop} aggregation (Lot #{lot.id}) is 90% full. Only {remaining:g} {lot.unit} capacity remains.',
                type='FPO'
            )
            db.session.add(notif)

        if changed and commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
        return lot.aggregation_status

    # 4. Standard OPEN Status (unless DRAFT)
    if lot.aggregation_status not in ('DRAFT', 'OPEN'):
        lot.aggregation_status = 'OPEN'
        changed = True

    if changed and commit:
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()

    return lot.aggregation_status

def calculate_sell_urgency(crop, storage_status, verified_qty, created_at=None):
    """
    Determines advisory urgency indicator for consolidated FPO inventory:
    - SELL URGENTLY
    - SELL SOON
    - STABLE
    """
    clean_crop = crop.strip() if crop else 'Tomato'
    profile = CROP_PERISHABILITY_PROFILES.get(clean_crop)
    if not profile:
        for k, p in CROP_PERISHABILITY_PROFILES.items():
            if k.lower() in clean_crop.lower():
                profile = p
                break

    category = profile['category'] if profile else 'MEDIUM'
    is_stored = (storage_status == 'IN_STORAGE')

    if category == 'VERY_HIGH':
        if not is_stored:
            return {
                'priority': 'SELL URGENTLY',
                'badge_variant': 'danger',
                'reason': f'{clean_crop} is highly perishable and stored under ambient packhouse conditions. Urgent dispatch advised.'
            }
        else:
            return {
                'priority': 'SELL SOON',
                'badge_variant': 'warning',
                'reason': f'{clean_crop} is in cold storage. Controlled temperature retards ripening, but timely sale optimizes fresh premium.'
            }

    if category == 'HIGH':
        if not is_stored:
            return {
                'priority': 'SELL SOON',
                'badge_variant': 'warning',
                'reason': f'{clean_crop} has moderate ambient shelf life. Schedule buyer dispatch within 48–72 hours.'
            }
        else:
            return {
                'priority': 'STABLE',
                'badge_variant': 'success',
                'reason': f'{clean_crop} is safely cold-stored with excellent condition stability.'
            }

    return {
        'priority': 'STABLE',
        'badge_variant': 'success',
        'reason': f'{clean_crop} is a resilient crop with extended post-harvest shelf life. Hold or liquidate based on price benchmarks.'
    }
