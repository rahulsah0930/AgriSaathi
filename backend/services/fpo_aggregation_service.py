from datetime import datetime, timedelta
from models import db
from models.notification import Notification, NotificationEvent, emit_idempotent_notification
from models.lot import FPOLotMember
from models.commodity import Commodity

CROP_PERISHABILITY_PROFILES = {
    'Tomato': {
        'category': 'HIGH',
        'ambient_shelf_life_hours': 36,
        'base_ambient_window_hours': 12,
        'base_cold_window_hours': 24,
        'risk_level': 'HIGH',
        'reason': 'Tomato is highly perishable. Recommended collection window is 12 hours to prevent heat stress, softness, and post-harvest spoilage before cold-chain dispatch.'
    },
    'Grapes': {
        'category': 'HIGH',
        'ambient_shelf_life_hours': 48,
        'base_ambient_window_hours': 18,
        'base_cold_window_hours': 36,
        'risk_level': 'HIGH',
        'reason': 'Grapes are susceptible to berry drop and dehydration under ambient conditions. An 18-hour collection window is recommended.'
    },
    'Strawberry': {
        'category': 'HIGH',
        'ambient_shelf_life_hours': 24,
        'base_ambient_window_hours': 12,
        'base_cold_window_hours': 24,
        'risk_level': 'HIGH',
        'reason': 'Strawberries lose firmness rapidly. Immediate aggregation within 12 hours is recommended.'
    },
    'Pomegranate': {
        'category': 'MEDIUM',
        'ambient_shelf_life_hours': 120,
        'base_ambient_window_hours': 48,
        'base_cold_window_hours': 72,
        'risk_level': 'MEDIUM',
        'reason': 'Pomegranates have moderate ambient stability. A 48-hour collection window balances harvesting schedules with market quality.'
    },
    'Onion': {
        'category': 'MEDIUM',
        'ambient_shelf_life_hours': 720,
        'base_ambient_window_hours': 48,
        'base_cold_window_hours': 72,
        'risk_level': 'MEDIUM',
        'reason': 'Cured onions have good ambient storage stability. A 48-hour aggregation window allows farmers from surrounding villages to deliver produce.'
    },
    'Potato': {
        'category': 'MEDIUM',
        'ambient_shelf_life_hours': 720,
        'base_ambient_window_hours': 48,
        'base_cold_window_hours': 72,
        'risk_level': 'MEDIUM',
        'reason': 'Potatoes are resilient under shaded ambient conditions. A 48-hour window facilitates bulk grading and bag packing.'
    },
    'Soybean': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 4320,
        'base_ambient_window_hours': 72,
        'base_cold_window_hours': 120,
        'risk_level': 'LOW',
        'reason': 'Soybean is dry oilseed grain with low perishability at standard moisture (<12%). A 72-hour window provides ample time for large-volume aggregation.'
    },
    'Wheat': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 8760,
        'base_ambient_window_hours': 72,
        'base_cold_window_hours': 120,
        'risk_level': 'LOW',
        'reason': 'Wheat is non-perishable dry grain. A 72-hour window enables thorough member mobilization and full truckload formation.'
    },
    'Cotton': {
        'category': 'LOW',
        'ambient_shelf_life_hours': 8760,
        'base_ambient_window_hours': 72,
        'base_cold_window_hours': 120,
        'risk_level': 'LOW',
        'reason': 'Seed cotton can be safely collected over a 72-hour period for ginning mill aggregation batches.'
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
    Authoritatively queries Commodity.default_collection_window_hours and Commodity.perishability_class.
    Does NOT use fake random AI values or guarantee crop shelf life.
    """
    clean_crop = crop.strip() if crop else 'Tomato'
    commodity = None

    # 1. Direct canonical name lookup
    try:
        commodity = Commodity.query.filter(Commodity.canonical_name.ilike(clean_crop)).first()
        if not commodity:
            from services.commodity_service import resolve_commodity_name
            canon = resolve_commodity_name(clean_crop)
            if canon:
                commodity = Commodity.query.filter_by(canonical_name=canon).first()
    except Exception:
        pass

    is_cold_storage = (storage_status == 'IN_STORAGE')

    if commodity:
        base_hours = float(commodity.default_collection_window_hours or 24.0)
        p_class = commodity.perishability_class or 'MEDIUM'
        canon_name = commodity.canonical_name
        cid = commodity.id

        if is_cold_storage:
            if p_class == 'HIGH':
                suggested_hours = base_hours * 2.0
            elif p_class == 'MEDIUM':
                suggested_hours = base_hours * 1.5
            else:
                suggested_hours = base_hours
        else:
            suggested_hours = base_hours

        risk_level = 'HIGH' if p_class == 'HIGH' else ('MEDIUM' if p_class == 'MEDIUM' else 'LOW')

        if p_class == 'HIGH':
            reason = f"{canon_name} has high perishability. Recommended collection window is {suggested_hours:g} hours to prevent field heat accumulation and preserve fresh grade before dispatch."
        elif p_class == 'MEDIUM':
            reason = f"{canon_name} has moderate shelf stability. Recommended collection window is {suggested_hours:g} hours to allow cluster mobilization and packhouse sorting."
        else:
            reason = f"{canon_name} has low perishability. Recommended collection window is {suggested_hours:g} hours to enable broad member aggregation across villages."

        if is_cold_storage:
            reason += ' Cold-storage availability safely extends the collection window.'

        factors = {
            'crop': canon_name,
            'commodity_id': cid,
            'perishability_category': p_class,
            'perishability_class': p_class,
            'storage_condition': storage_status,
            'cold_storage_available': is_cold_storage,
            'weather_integration': get_weather_risk_factor()
        }

        return {
            'crop': canon_name,
            'commodity_id': cid,
            'suggested_hours': suggested_hours,
            'risk_level': risk_level,
            'perishability_category': p_class,
            'perishability_class': p_class,
            'reason': reason,
            'factors_considered': factors,
            'disclaimer': 'Operational advisory guideline. Actual shelf life depends on farm-gate harvest conditions, sorting, and ambient transport temperature.'
        }

    # Fallback to static profile or sensible default
    profile = CROP_PERISHABILITY_PROFILES.get(clean_crop)
    if not profile:
        for known_crop, p in CROP_PERISHABILITY_PROFILES.items():
            if known_crop.lower() in clean_crop.lower():
                profile = p
                break

    if not profile:
        profile = {
            'category': 'MEDIUM',
            'ambient_shelf_life_hours': 72,
            'base_ambient_window_hours': 48,
            'base_cold_window_hours': 72,
            'risk_level': 'MEDIUM',
            'reason': f'{clean_crop} standard aggregation window recommendation based on ambient handling norms.'
        }

    suggested_hours = profile['base_cold_window_hours'] if is_cold_storage else profile['base_ambient_window_hours']
    reason = profile['reason']
    if is_cold_storage:
        reason += ' Cold-storage availability safely extends the collection window.'

    factors = {
        'crop': clean_crop,
        'commodity_id': None,
        'perishability_category': profile['category'],
        'perishability_class': profile['category'],
        'storage_condition': storage_status,
        'cold_storage_available': is_cold_storage,
        'weather_integration': get_weather_risk_factor()
    }

    return {
        'crop': clean_crop,
        'commodity_id': None,
        'suggested_hours': suggested_hours,
        'risk_level': profile['risk_level'],
        'perishability_category': profile['category'],
        'perishability_class': profile['category'],
        'reason': reason,
        'factors_considered': factors,
        'disclaimer': 'Operational advisory guideline. Actual shelf life depends on farm-gate harvest conditions, sorting, and ambient transport temperature.'
    }

def evaluate_aggregation_status(lot, commit=True):
    """
    Authoritative backend evaluation of an aggregation lot lifecycle:
    - Checks deadline against server time (UTC)
    - Calculates committed quantity vs target
    - Deterministic Transitions: OPEN -> NEAR_CAPACITY (90%) -> FILLED (100%) or EXPIRED
    - Generates strictly IDEMPOTENT notifications using NotificationEvent keys:
        aggregation:<id>:near_capacity
        aggregation:<id>:filled:fpo
        aggregation:<id>:filled:farmer:<farmer_id>
        aggregation:<id>:deadline_warning
        aggregation:<id>:expired:fpo
        aggregation:<id>:expired:farmer:<farmer_id>
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
    if lot.collection_deadline_at and now >= lot.collection_deadline_at:
        if committed_qty < target_qty:
            if lot.aggregation_status != 'EXPIRED':
                lot.aggregation_status = 'EXPIRED'
                lot.status = 'EXPIRED'
                changed = True

            # Exactly ONE idempotent notification for FPO
            event_key_fpo = f"aggregation:{lot.id}:expired:fpo"
            exp_msg = f"{lot.crop} aggregation window has closed. {committed_qty:g} of {target_qty:g} {lot.unit} was collected."
            notif = emit_idempotent_notification(
                event_key=event_key_fpo,
                recipient_user_id=lot.seller_id,
                title=f"{lot.crop} Aggregation Window Closed",
                message=exp_msg,
                notif_type='FPO'
            )
            if notif:
                lot.deadline_notified_at = now
                changed = True

            # Exactly ONE idempotent notification for each distinct contributing farmer
            farmer_ids = {m.farmer_id for m in lot.members if m.farmer_id}
            for f_id in farmer_ids:
                event_key_farmer = f"aggregation:{lot.id}:expired:farmer:{f_id}"
                emit_idempotent_notification(
                    event_key=event_key_farmer,
                    recipient_user_id=f_id,
                    title=f"{lot.crop} Aggregation Window Closed",
                    message=exp_msg,
                    notif_type='FARMER'
                )

            if changed and commit:
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            return lot.aggregation_status

    # 2. Check 100% Target Reached (FILLED)
    if target_qty > 0 and committed_qty >= target_qty:
        if lot.aggregation_status != 'FILLED':
            lot.aggregation_status = 'FILLED'
            changed = True

        # Exactly ONE idempotent notification for FPO
        event_key_fpo = f"aggregation:{lot.id}:filled:fpo"
        fill_msg = f"{lot.crop} aggregation requirement has been filled successfully."
        notif = emit_idempotent_notification(
            event_key=event_key_fpo,
            recipient_user_id=lot.seller_id,
            title=f"{lot.crop} Aggregation Filled",
            message=fill_msg,
            notif_type='FPO'
        )
        if notif:
            lot.filled_notified_at = now
            changed = True

        # Exactly ONE idempotent notification for each contributing farmer
        farmer_ids = {m.farmer_id for m in lot.members if m.farmer_id}
        for f_id in farmer_ids:
            event_key_farmer = f"aggregation:{lot.id}:filled:farmer:{f_id}"
            emit_idempotent_notification(
                event_key=event_key_farmer,
                recipient_user_id=f_id,
                title=f"{lot.crop} Aggregation Filled",
                message=fill_msg,
                notif_type='FARMER'
            )

        if changed and commit:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        return lot.aggregation_status

    # 3. Check 90% Target Reached (NEAR_CAPACITY)
    if target_qty > 0 and committed_qty >= (0.9 * target_qty) and committed_qty < target_qty:
        if lot.aggregation_status != 'NEAR_CAPACITY':
            lot.aggregation_status = 'NEAR_CAPACITY'
            changed = True

        # Exactly ONE idempotent notification for 90% near-capacity
        event_key = f"aggregation:{lot.id}:near_capacity"
        remaining = max(0.0, round(target_qty - committed_qty, 2))
        near_msg = f"{lot.crop} requirement is 90% filled. Only {remaining:g} {lot.unit} remaining."
        notif = emit_idempotent_notification(
            event_key=event_key,
            recipient_user_id=lot.seller_id,
            title=f"{lot.crop} Aggregation 90% Full",
            message=near_msg,
            notif_type='FPO'
        )
        if notif:
            lot.near_capacity_notified_at = now
            changed = True

        # Check deadline warning if <= 2 hours remaining
        if lot.collection_deadline_at and 0 < (lot.collection_deadline_at - now).total_seconds() <= 7200:
            warn_key = f"aggregation:{lot.id}:deadline_warning"
            emit_idempotent_notification(
                event_key=warn_key,
                recipient_user_id=lot.seller_id,
                title=f"{lot.crop} Deadline Approaching",
                message=f"{lot.crop} aggregation requirement closes in less than 2 hours. Current collection: {committed_qty:g} of {target_qty:g} {lot.unit}.",
                notif_type='FPO'
            )

        if changed and commit:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        return lot.aggregation_status

    # 4. Check Deadline Warning if OPEN and <= 2 hours remaining
    if lot.collection_deadline_at and 0 < (lot.collection_deadline_at - now).total_seconds() <= 7200:
        warn_key = f"aggregation:{lot.id}:deadline_warning"
        emit_idempotent_notification(
            event_key=warn_key,
            recipient_user_id=lot.seller_id,
            title=f"{lot.crop} Deadline Approaching",
            message=f"{lot.crop} aggregation requirement closes in less than 2 hours. Current collection: {committed_qty:g} of {target_qty:g} {lot.unit}.",
            notif_type='FPO'
        )

    # 5. Standard OPEN Status (unless DRAFT)
    if lot.aggregation_status not in ('DRAFT', 'OPEN'):
        lot.aggregation_status = 'OPEN'
        changed = True

    if changed and commit:
        try:
            db.session.commit()
        except Exception:
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

    if category == 'HIGH':
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

    if category == 'MEDIUM':
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
