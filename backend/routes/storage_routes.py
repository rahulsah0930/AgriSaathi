from flask import Blueprint, request, jsonify, g
from datetime import datetime, date, timedelta
import uuid

from models import db
from models.storage import Warehouse, StorageBooking
from models.commodity import Commodity
from models.user import WarehouseProfile, User
from utils.auth import jwt_required, role_required
from services.storage_service import (
    convert_to_tonnes,
    convert_to_kg,
    recommend_storage_type,
    estimate_storage_cost,
    validate_storage_booking_transition,
    emit_storage_notification
)
from services.logistics_service import calculate_haversine_distance_km

storage_bp = Blueprint('storage', __name__, url_prefix='/api')


@storage_bp.route('/warehouses', methods=['GET'])
def list_warehouses():
    """Returns warehouses with filtering by district, storage_type, verified status, and optional Haversine distance."""
    try:
        # Sync any registered WarehouseProfile without a corresponding Warehouse
        existing_names = {w.name.lower() for w in Warehouse.query.all()}
        profiles = WarehouseProfile.query.all()
        for p in profiles:
            if p.warehouse_name and p.warehouse_name.lower() not in existing_names:
                st_type = p.storage_type or 'COLD_STORAGE'
                mapped = 'COLD_STORAGE'
                if 'controlled' in st_type.lower() or 'atmosphere' in st_type.lower():
                    mapped = 'CONTROLLED_STORAGE'
                elif 'dry' in st_type.lower() or 'normal' in st_type.lower() or 'ambient' in st_type.lower():
                    mapped = 'DRY_STORAGE'

                cap = float(p.capacity_mt or 2500.0)
                tariff = float(p.tariff_per_quintal_month or 55.0)
                price_day = round(tariff / (100.0 * 30.0), 4)

                user_v_status = 'PENDING'
                if getattr(p, 'user', None) and p.user.verification_status:
                    user_v_status = p.user.verification_status

                sync_wh = Warehouse(
                    operator_user_id=p.user_id,
                    name=p.warehouse_name.strip(),
                    verification_status=user_v_status,
                    district=p.district.strip() if p.district else 'Nashik',
                    location=p.address.strip() if p.address else f"{p.district or 'Nashik'} Agro Hub",
                    latitude=p.latitude,
                    longitude=p.longitude,
                    storage_type=mapped,
                    supported_crops=p.supported_crops or 'Tomato, Onion, Grapes, Pomegranate',
                    total_capacity=cap,
                    available_capacity=cap,
                    price_per_kg_per_day=price_day if price_day > 0 else 0.018,
                    temperature_range_placeholder='0°C to 4°C' if mapped == 'COLD_STORAGE' else ('1°C to 8°C' if mapped == 'CONTROLLED_STORAGE' else 'Ambient (18-24°C)'),
                    availability_status='AVAILABLE'
                )
                db.session.add(sync_wh)
                existing_names.add(p.warehouse_name.lower())
        db.session.commit()

        district = request.args.get('district')
        storage_type = request.args.get('storage_type')
        status = request.args.get('status')
        search = request.args.get('search')
        verified_only = request.args.get('verified_only', '').lower() in ['true', '1', 'yes']
        crop_name = request.args.get('crop') or request.args.get('commodity')
        client_lat = request.args.get('lat', type=float)
        client_lng = request.args.get('lng', type=float)

        query = Warehouse.query

        if district and district.upper() != 'ALL':
            query = query.filter(Warehouse.district.ilike(f'%{district}%'))
        if storage_type and storage_type.upper() != 'ALL':
            st = storage_type.upper()
            if st in ['NORMAL', 'DRY', 'DRY_STORAGE']:
                query = query.filter(Warehouse.storage_type.in_(['NORMAL', 'DRY_STORAGE']))
            elif 'COLD' in st:
                query = query.filter(Warehouse.storage_type.in_(['COLD_STORAGE', 'Cold Storage (Multi-Chamber)']))
            elif 'CONTROLLED' in st:
                query = query.filter(Warehouse.storage_type.in_(['CONTROLLED', 'CONTROLLED_STORAGE']))
            else:
                query = query.filter(Warehouse.storage_type == storage_type)
        if status and status.upper() != 'ALL':
            query = query.filter(Warehouse.availability_status == status)
        if verified_only:
            query = query.filter(Warehouse.verification_status == 'VERIFIED')
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                (Warehouse.name.ilike(pattern)) |
                (Warehouse.location.ilike(pattern)) |
                (Warehouse.supported_crops.ilike(pattern))
            )

        warehouses = query.order_by(Warehouse.id.desc()).all()

        recommendation = recommend_storage_type(crop_name=crop_name) if crop_name else None

        wh_list = []
        for idx, w in enumerate(warehouses):
            d = w.to_dict()
            d['is_new'] = idx == 0 or w.id > 3
            # Calculate deterministic Haversine distance if client coordinates provided
            if client_lat is not None and client_lng is not None and w.latitude and w.longitude:
                dist = calculate_haversine_distance_km(client_lat, client_lng, w.latitude, w.longitude)
                d['approx_distance_km'] = dist
            else:
                d['approx_distance_km'] = None

            wh_list.append(d)

        return jsonify({
            'success': True,
            'count': len(wh_list),
            'crop_recommendation': recommendation,
            'warehouses': wh_list
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/warehouses', methods=['POST'])
@jwt_required
@role_required('WAREHOUSE', 'ADMIN')
def create_warehouse():
    """Allows adding a new cold storage / warehouse facility."""
    try:
        user = g.current_user
        if getattr(user, 'verification_status', '') == 'SUSPENDED':
            return jsonify({'success': False, 'error': 'Account Suspended', 'message': 'Suspended accounts cannot register new facilities.'}), 403

        data = request.get_json() or {}
        name = data.get('name') or data.get('warehouse_name')
        if not name:
            return jsonify({'success': False, 'error': 'Warehouse name is required'}), 400

        district = data.get('district', 'Nashik').strip()
        location = data.get('location') or data.get('address') or f"{district} Cold Chain Zone"
        storage_type = data.get('storage_type', 'COLD_STORAGE').upper()
        if 'COLD' in storage_type:
            mapped_type = 'COLD_STORAGE'
        elif 'CONTROLLED' in storage_type:
            mapped_type = 'CONTROLLED_STORAGE'
        else:
            mapped_type = 'DRY_STORAGE'

        total_capacity = float(data.get('total_capacity') or data.get('capacity_mt') or 2500.0)
        available_capacity = float(data.get('available_capacity') or total_capacity)
        price_per_kg_per_day = float(data.get('price_per_kg_per_day') or 0.02)
        supported_crops = data.get('supported_crops', 'Tomato, Onion, Grapes, Pomegranate, Potato')
        temp_range = data.get('temperature_range') or ('0°C to 4°C' if mapped_type == 'COLD_STORAGE' else 'Ambient')
        lat = float(data.get('latitude')) if data.get('latitude') else None
        lng = float(data.get('longitude')) if data.get('longitude') else None

        v_status = 'PENDING'
        if user.role == 'ADMIN':
            v_status = 'VERIFIED'

        new_wh = Warehouse(
            operator_user_id=user.id,
            name=name.strip(),
            verification_status=v_status,
            district=district,
            location=location.strip(),
            latitude=lat,
            longitude=lng,
            storage_type=mapped_type,
            supported_crops=supported_crops,
            total_capacity=total_capacity,
            available_capacity=available_capacity,
            price_per_kg_per_day=price_per_kg_per_day,
            temperature_range_placeholder=temp_range,
            availability_status='AVAILABLE'
        )
        db.session.add(new_wh)
        db.session.commit()

        d = new_wh.to_dict()
        d['is_new'] = True

        return jsonify({
            'success': True,
            'message': f'Storage facility {name} registered successfully!',
            'warehouse': d
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/warehouses/<int:warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    """Returns detailed information for a single warehouse."""
    try:
        warehouse = Warehouse.query.get(warehouse_id)
        if not warehouse:
            return jsonify({'success': False, 'error': 'Warehouse not found'}), 404

        return jsonify({
            'success': True,
            'warehouse': warehouse.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/warehouse/my-facility', methods=['GET'])
@jwt_required
@role_required('WAREHOUSE', 'ADMIN')
def get_my_facility():
    """Retrieves facility details and live capacity statistics for authenticated warehouse operator."""
    user = g.current_user
    wh = Warehouse.query.filter_by(operator_user_id=user.id).first()
    if not wh:
        # Fallback search by warehouse profile name
        wh_prof = getattr(user, 'warehouse_profile', None)
        if wh_prof and wh_prof.warehouse_name:
            wh = Warehouse.query.filter(Warehouse.name.ilike(f"%{wh_prof.warehouse_name}%")).first()
            if wh and not wh.operator_user_id:
                wh.operator_user_id = user.id
                db.session.commit()

    if not wh:
        return jsonify({
            'success': True,
            'warehouse': None,
            'message': 'No facility currently registered for this account.'
        }), 200

    active_bookings_count = StorageBooking.query.filter_by(warehouse_id=wh.id).filter(
        StorageBooking.status.in_(['REQUESTED', 'APPROVED', 'CHECKED_IN', 'ACTIVE'])
    ).count()

    pending_count = StorageBooking.query.filter_by(warehouse_id=wh.id, status='REQUESTED').count()

    d = wh.to_dict()
    d['active_bookings_count'] = active_bookings_count
    d['pending_requests_count'] = pending_count

    return jsonify({
        'success': True,
        'warehouse': d
    }), 200


@storage_bp.route('/warehouse/my-bookings', methods=['GET'])
@jwt_required
@role_required('WAREHOUSE', 'ADMIN')
def get_my_warehouse_bookings():
    """Lists storage bookings for the authenticated warehouse operator's facility."""
    user = g.current_user
    wh = Warehouse.query.filter_by(operator_user_id=user.id).first()
    if not wh and user.role == 'ADMIN':
        wh_id = request.args.get('warehouse_id', type=int)
        if wh_id:
            wh = Warehouse.query.get(wh_id)

    if not wh:
        # Fallback search by user profile
        wh_prof = getattr(user, 'warehouse_profile', None)
        if wh_prof and wh_prof.warehouse_name:
            wh = Warehouse.query.filter(Warehouse.name.ilike(f"%{wh_prof.warehouse_name}%")).first()

    if not wh:
        return jsonify({'success': True, 'count': 0, 'bookings': []}), 200

    query = StorageBooking.query.filter_by(warehouse_id=wh.id)
    status_filter = request.args.get('status')
    if status_filter and status_filter.upper() != 'ALL':
        query = query.filter_by(status=status_filter.upper())

    bookings = query.order_by(StorageBooking.created_at.desc()).all()
    return jsonify({
        'success': True,
        'warehouse_id': wh.id,
        'warehouse_name': wh.name,
        'count': len(bookings),
        'bookings': [b.to_dict() for b in bookings]
    }), 200


@storage_bp.route('/storage-bookings', methods=['POST'])
@jwt_required
def create_storage_booking():
    """Authenticated Farmer/FPO/Buyer requests storage space."""
    try:
        user = g.current_user
        if getattr(user, 'verification_status', '') == 'SUSPENDED':
            return jsonify({'success': False, 'error': 'Account Suspended', 'message': 'Suspended accounts cannot initiate storage bookings.'}), 403

        data = request.get_json() or {}
        user_id = user.id
        user_role = user.role
        warehouse_id = data.get('warehouse_id')
        crop = data.get('crop') or data.get('crop_name')
        quantity = float(data.get('quantity', 0))
        unit = data.get('unit', 'kg')
        expected_duration_days = int(data.get('expected_duration_days', 14))
        start_date_str = data.get('start_date')
        storage_type = data.get('storage_type', 'COLD_STORAGE')

        if not warehouse_id or not crop or quantity <= 0:
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Warehouse ID, crop name, and a positive quantity (> 0) are mandatory.'}), 400

        warehouse = Warehouse.query.get(warehouse_id)
        if not warehouse:
            return jsonify({'success': False, 'error': 'Not Found', 'message': 'Target warehouse facility not found.'}), 404

        # Convert quantity to tonnes for capacity protection
        requested_tonnes = convert_to_tonnes(quantity, unit)
        if requested_tonnes > warehouse.available_capacity:
            return jsonify({
                'success': False,
                'error': 'Capacity Exceeded',
                'message': f"Requested capacity ({round(requested_tonnes, 2)} MT) exceeds available capacity ({round(warehouse.available_capacity, 2)} MT). Facility cannot accept overbooking."
            }), 400

        # Authoritative backend cost calculation (ignoring client supplied total)
        estimated_cost = estimate_storage_cost(warehouse, quantity, unit, expected_duration_days)

        start_date_val = date.today()
        if start_date_str:
            try:
                start_date_val = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        expected_end_date_val = start_date_val + timedelta(days=expected_duration_days)

        # Generate unique booking reference
        booking_ref = f"SBK-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        # Resolve commodity ID if catalog match exists
        commodity_id = None
        from services.commodity_service import resolve_commodity_name, get_commodity_by_name
        canonical_name = resolve_commodity_name(crop)
        if canonical_name:
            comm_obj = get_commodity_by_name(canonical_name)
            if comm_obj:
                commodity_id = comm_obj.id

        booking = StorageBooking(
            booking_ref=booking_ref,
            user_id=user_id,
            user_role=user_role,
            warehouse_id=warehouse_id,
            commodity_id=commodity_id,
            crop=crop.strip(),
            quantity=quantity,
            unit=unit.strip().lower(),
            storage_type=storage_type,
            start_date=start_date_val,
            expected_duration_days=expected_duration_days,
            expected_end_date=expected_end_date_val,
            estimated_cost=estimated_cost,
            status='REQUESTED'
        )

        # Capacity hold on request
        warehouse.available_capacity = round(max(0.0, warehouse.available_capacity - requested_tonnes), 2)
        if warehouse.available_capacity <= 0:
            warehouse.availability_status = 'FULL'
        elif warehouse.available_capacity < (warehouse.total_capacity * 0.2):
            warehouse.availability_status = 'LIMITED'

        db.session.add(booking)
        db.session.commit()

        # Emit notification to warehouse operator
        if warehouse.operator_user_id:
            from models.notification import emit_idempotent_notification
            emit_idempotent_notification(
                f"storage_booking:{booking.id}:received",
                warehouse.operator_user_id,
                f"New Storage Request: {booking.booking_ref}",
                f"Inquiry received from {user.name or user.phone} for {booking.crop} ({booking.quantity} {booking.unit}).",
                'INFO'
            )

        return jsonify({
            'success': True,
            'message': f'Storage booking request {booking_ref} submitted successfully for {warehouse.name}',
            'booking': booking.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/storage-bookings', methods=['GET'])
@jwt_required
def list_user_bookings():
    """Lists storage bookings for authenticated user or all for admin."""
    try:
        user = g.current_user
        query = StorageBooking.query
        if user.role != 'ADMIN':
            query = query.filter_by(user_id=user.id)
        elif request.args.get('user_id'):
            query = query.filter_by(user_id=request.args.get('user_id', type=int))

        status_filter = request.args.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            query = query.filter_by(status=status_filter.upper())

        bookings = query.order_by(StorageBooking.created_at.desc()).all()

        return jsonify({
            'success': True,
            'count': len(bookings),
            'bookings': [b.to_dict() for b in bookings]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/storage-bookings/<int:booking_id>', methods=['GET'])
@jwt_required
def get_storage_booking(booking_id):
    """Retrieves single booking. Accessible by booking user, warehouse operator, or ADMIN."""
    try:
        booking = StorageBooking.query.get_or_404(booking_id)
        user = g.current_user

        # Ownership check
        is_owner = (booking.user_id == user.id)
        is_operator = (booking.warehouse and booking.warehouse.operator_user_id == user.id)
        is_admin = (user.role == 'ADMIN')

        if not (is_owner or is_operator or is_admin):
            return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to view this booking.'}), 403

        return jsonify({
            'success': True,
            'booking': booking.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/storage-bookings/<int:booking_id>/status', methods=['POST'])
@jwt_required
def update_storage_booking_status(booking_id):
    """
    State machine transition controller for storage bookings:
    APPROVE, REJECT, CHECK_IN, CHECK_OUT, CANCEL.
    """
    try:
        user = g.current_user
        booking = StorageBooking.query.get_or_404(booking_id)
        data = request.get_json() or {}

        action = str(data.get('action') or data.get('status') or '').strip().upper()
        reason = data.get('reason') or data.get('rejection_reason') or ''
        notes = data.get('notes') or ''

        # Map action to target status
        action_status_map = {
            'APPROVE': 'APPROVED',
            'APPROVED': 'APPROVED',
            'REJECT': 'REJECTED',
            'REJECTED': 'REJECTED',
            'CHECK_IN': 'CHECKED_IN',
            'CHECKED_IN': 'CHECKED_IN',
            'ACTIVATE': 'ACTIVE',
            'ACTIVE': 'ACTIVE',
            'CHECK_OUT': 'CHECKED_OUT',
            'CHECKED_OUT': 'CHECKED_OUT',
            'COMPLETE': 'COMPLETED',
            'COMPLETED': 'COMPLETED',
            'CANCEL': 'CANCELLED',
            'CANCELLED': 'CANCELLED'
        }

        target_status = action_status_map.get(action)
        if not target_status:
            return jsonify({'success': False, 'error': 'Invalid Action', 'message': f"Action '{action}' is not supported."}), 400

        # Authorization & IDOR protection:
        # User who booked can CANCEL if still in REQUESTED or APPROVED.
        # Otherwise, only the warehouse operator of this facility or ADMIN can modify state.
        is_admin = (user.role == 'ADMIN')
        is_booking_owner = (booking.user_id == user.id)
        is_facility_operator = (booking.warehouse and booking.warehouse.operator_user_id == user.id)

        if target_status == 'CANCELLED':
            if not (is_booking_owner or is_facility_operator or is_admin):
                return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You cannot cancel another user\'s storage booking.'}), 403
        else:
            if not (is_facility_operator or is_admin):
                return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the assigned warehouse operator or Administrator can modify booking custody status.'}), 403

        # Validate state machine transition
        valid, err_msg = validate_storage_booking_transition(booking.status, target_status)
        if not valid:
            return jsonify({'success': False, 'error': 'Illegal Transition', 'message': err_msg}), 400

        # Apply state changes & timestamps
        previous_status = booking.status
        booking.status = target_status
        req_tonnes = convert_to_tonnes(booking.quantity, booking.unit)
        warehouse = booking.warehouse

        if target_status == 'APPROVED':
            booking.approved_at = datetime.utcnow()
            booking.approved_by = user.id
            if notes:
                booking.notes = notes

        elif target_status == 'CHECKED_IN':
            booking.actual_check_in_at = datetime.utcnow()
            # Transition to ACTIVE storage custody
            booking.status = 'ACTIVE'

        elif target_status in ['CHECKED_OUT', 'COMPLETED']:
            booking.actual_check_out_at = datetime.utcnow()
            booking.status = 'COMPLETED'
            # Restore available capacity to warehouse facility
            if warehouse:
                warehouse.available_capacity = round(min(warehouse.total_capacity, warehouse.available_capacity + req_tonnes), 2)
                if warehouse.available_capacity > (warehouse.total_capacity * 0.2):
                    warehouse.availability_status = 'AVAILABLE'

        elif target_status in ['REJECTED', 'CANCELLED']:
            booking.rejection_reason = reason or notes or ('Cancelled by user' if is_booking_owner else 'Declined by warehouse')
            # Restore capacity previously held
            if warehouse and previous_status in ['REQUESTED', 'APPROVED']:
                warehouse.available_capacity = round(min(warehouse.total_capacity, warehouse.available_capacity + req_tonnes), 2)
                if warehouse.available_capacity > (warehouse.total_capacity * 0.2):
                    warehouse.availability_status = 'AVAILABLE'

        db.session.commit()

        # Emit idempotent notification
        emit_storage_notification(booking, booking.status, extra_msg=reason or notes)

        return jsonify({
            'success': True,
            'message': f'Storage booking {booking.booking_ref} status updated from {previous_status} to {booking.status}.',
            'booking': booking.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
