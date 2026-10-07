import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename

from models import db
from models.user import User
from models.transaction import Transaction, TransactionHistory
from models.commodity import Commodity
from models.logistics import TransportOrder, LogisticsRequest
from utils.auth import jwt_required
from services.file_storage_service import get_storage_provider
from services.logistics_service import (
    calculate_haversine_distance_km,
    recommend_vehicle_requirement,
    estimate_transport_cost,
    validate_logistics_transition,
    emit_logistics_notification
)

logistics_bp = Blueprint('logistics', __name__, url_prefix='/api/logistics')

ALLOWED_POD_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_POD_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_POD_EXTENSIONS


@logistics_bp.route('/request', methods=['POST'])
@jwt_required
def create_transport_request():
    """
    Seller/FPO requests logistics for a transaction in READY_FOR_LOGISTICS.
    Derived from JWT. Prevents duplicate active logistics requests.
    """
    user = g.current_user
    if getattr(user, 'verification_status', '') == 'SUSPENDED':
        return jsonify({'success': False, 'error': 'Account Suspended', 'message': 'Suspended accounts cannot request transport dispatches.'}), 403

    data = request.get_json() or {}
    txn_id = data.get('transaction_id')

    if not txn_id:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'transaction_id is required.'}), 400

    txn = Transaction.query.get(txn_id)
    if not txn:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transaction {txn_id} not found.'}), 404

    # Security check: User must be Seller or Admin
    if user.id != txn.seller_id and user.role != 'ADMIN':
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Only the seller or an administrator can request transport for this transaction.'
        }), 403

    # State check: Must be in READY_FOR_LOGISTICS
    if txn.status != 'READY_FOR_LOGISTICS':
        return jsonify({
            'success': False,
            'error': 'Invalid State',
            'message': f"Transport can only be requested when transaction is in 'READY_FOR_LOGISTICS'. Current status: '{txn.status}'."
        }), 400

    # Prevent duplicate active requests for the same transaction
    existing = TransportOrder.query.filter(
        TransportOrder.transaction_id == txn.id,
        TransportOrder.status != 'CANCELLED'
    ).first()
    if existing:
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'An active transport request ({existing.order_ref}) already exists for this transaction.'
        }), 409

    # Determine Commodity & Perishability
    commodity = None
    if txn.commodity_id:
        commodity = Commodity.query.get(txn.commodity_id)
    elif txn.crop_lot and txn.crop_lot.commodity_id:
        commodity = Commodity.query.get(txn.crop_lot.commodity_id)

    # Calculate approximate distance (Haversine)
    distance_km = calculate_haversine_distance_km(
        txn.pickup_lat, txn.pickup_lng,
        txn.delivery_lat, txn.delivery_lng
    )

    # Vehicle requirement & Perishable produce recommendation
    vehicle_type, refrigerated_rec, ref_note = recommend_vehicle_requirement(
        quantity_kg=txn.quantity,
        crop_name=txn.crop,
        commodity=commodity
    )

    # Transport cost estimation
    est_cost = estimate_transport_cost(
        distance_km=distance_km,
        vehicle_type=vehicle_type,
        refrigerated_recommended=refrigerated_rec
    )

    # Create TransportOrder
    order_ref = f"TRN-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

    pickup_time = None
    if data.get('preferred_pickup_at'):
        try:
            pickup_time = datetime.fromisoformat(data['preferred_pickup_at'].replace('Z', '+00:00'))
        except Exception:
            pickup_time = None

    order = TransportOrder(
        order_ref=order_ref,
        transaction_id=txn.id,
        commodity_id=commodity.id if commodity else None,
        seller_id=txn.seller_id,
        buyer_id=txn.buyer_id,
        pickup_address=data.get('pickup_address') or txn.pickup_address or 'Seller Farm / FPO Aggregation Centre',
        pickup_district=txn.pickup_district or 'Nashik',
        pickup_latitude=txn.pickup_lat,
        pickup_longitude=txn.pickup_lng,
        delivery_address=data.get('delivery_address') or txn.delivery_address or 'Buyer Central Distribution Hub',
        delivery_district=txn.delivery_district or 'Vashi, Navi Mumbai',
        delivery_latitude=txn.delivery_lat,
        delivery_longitude=txn.delivery_lng,
        crop_name=txn.crop or (commodity.canonical_name if commodity else 'Agricultural Produce'),
        quantity=float(txn.quantity),
        unit=txn.unit or 'KG',
        vehicle_type_required=vehicle_type,
        refrigerated_recommended=refrigerated_rec,
        refrigeration_note=ref_note,
        estimated_distance_km=distance_km,
        estimated_transport_cost=est_cost,
        cost_status='ESTIMATED',
        requested_pickup_at=pickup_time,
        status='REQUESTED',
        notes=data.get('notes')
    )

    db.session.add(order)
    db.session.flush()

    # Record in transaction history
    record_hist = TransactionHistory(
        transaction_id=txn.id,
        event='LOGISTICS_REQUESTED',
        actor_id=user.id,
        actor_role=user.role,
        previous_state=txn.status,
        new_state=txn.status,
        details=f"Transport requested ({order.order_ref}). Recommended: {vehicle_type}. Approx distance: {distance_km or 'N/A'} km."
    )
    db.session.add(record_hist)
    db.session.commit()

    # Emit notifications
    emit_logistics_notification(
        order=order,
        event_key='requested',
        recipient_id=txn.buyer_id,
        title='Logistics Requested',
        message=f'Seller requested transport dispatch for {txn.crop} ({txn.transaction_ref}). Order {order.order_ref} awaiting provider.'
    )
    emit_logistics_notification(
        order=order,
        event_key='requested_seller',
        recipient_id=txn.seller_id,
        title='Transport Request Created',
        message=f'Logistics consignment {order.order_ref} created. Transporters have been notified for pickup.'
    )

    return jsonify({
        'success': True,
        'message': f'Transport request {order.order_ref} created successfully.',
        'transport_order': order.to_dict(current_user=user)
    }), 201


@logistics_bp.route('/available', methods=['GET'])
@jwt_required
def get_available_requests():
    """
    Logistics providers list unassigned transport requests.
    """
    user = g.current_user
    if user.role not in ['LOGISTICS', 'ADMIN']:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only registered logistics providers can view available requests.'}), 403

    orders = TransportOrder.query.filter_by(status='REQUESTED').order_by(TransportOrder.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(orders),
        'requests': [o.to_dict(current_user=user) for o in orders]
    }), 200


@logistics_bp.route('/my-deliveries', methods=['GET'])
@jwt_required
def get_my_deliveries():
    """
    Logistics provider retrieves assigned and completed deliveries.
    """
    user = g.current_user
    if user.role not in ['LOGISTICS', 'ADMIN']:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Access restricted to logistics providers.'}), 403

    query = TransportOrder.query
    if user.role != 'ADMIN':
        query = query.filter_by(assigned_provider_id=user.id)

    orders = query.order_by(TransportOrder.updated_at.desc()).all()
    active = [o.to_dict(current_user=user) for o in orders if o.status in ['ASSIGNED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT']]
    completed = [o.to_dict(current_user=user) for o in orders if o.status == 'DELIVERED']

    return jsonify({
        'success': True,
        'active_deliveries': active,
        'completed_deliveries': completed
    }), 200


@logistics_bp.route('/<int:order_id>/accept', methods=['POST'])
@jwt_required
def accept_transport_request(order_id):
    """
    Logistics provider accepts a transport request.
    Concurrency protected: Only the first provider succeeds; second receives conflict.
    """
    user = g.current_user
    if user.role not in ['LOGISTICS', 'ADMIN']:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only logistics providers can accept transport requests.'}), 403

    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    # Concurrency Protection: check status and assignment atomically
    if order.status != 'REQUESTED' or order.assigned_provider_id is not None:
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': 'This transport request has already been assigned to another provider.'
        }), 409

    order.assigned_provider_id = user.id
    order.status = 'ASSIGNED'
    order.updated_at = datetime.utcnow()

    db.session.commit()

    # Emit idempotent notifications
    emit_logistics_notification(
        order=order,
        event_key='assigned',
        recipient_id=order.seller_id,
        title='Transporter Assigned',
        message=f'Logistics provider {user.name} accepted transport request {order.order_ref}. Vehicle scheduling pending.'
    )
    emit_logistics_notification(
        order=order,
        event_key='assigned_buyer',
        recipient_id=order.buyer_id,
        title='Logistics Assigned',
        message=f'Transporter assigned for consignment {order.order_ref}. Pickup will be scheduled shortly.'
    )

    return jsonify({
        'success': True,
        'message': f'Transport request {order.order_ref} accepted successfully. Please assign vehicle and driver.',
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/<int:order_id>/assign-vehicle', methods=['POST'])
@jwt_required
def assign_vehicle_and_driver(order_id):
    """
    Assigned provider assigns vehicle number, driver details, and pickup schedule.
    """
    user = g.current_user
    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    if user.role != 'ADMIN' and order.assigned_provider_id != user.id:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the assigned logistics provider can assign vehicle details.'}), 403

    if order.status not in ['ASSIGNED', 'PICKUP_SCHEDULED']:
        return jsonify({
            'success': False,
            'error': 'Invalid State',
            'message': f"Cannot assign vehicle in status '{order.status}'. Must be ASSIGNED or PICKUP_SCHEDULED."
        }), 400

    data = request.get_json() or {}
    vehicle_number = str(data.get('vehicle_number', '')).strip().upper()
    vehicle_type = str(data.get('vehicle_type', order.vehicle_type_required)).strip()
    driver_name = str(data.get('driver_name', '')).strip()
    driver_phone = str(data.get('driver_phone', '')).strip()
    pickup_str = data.get('scheduled_pickup_at')

    if not vehicle_number or not driver_name or not driver_phone:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'vehicle_number, driver_name, and driver_phone are required.'
        }), 400

    digits = ''.join(filter(str.isdigit, driver_phone))
    if len(digits) < 10:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Please provide a valid 10-digit mobile number for the driver.'
        }), 400

    scheduled_pickup = datetime.utcnow()
    if pickup_str:
        try:
            scheduled_pickup = datetime.fromisoformat(pickup_str.replace('Z', '+00:00'))
        except Exception:
            pass

    order.vehicle_number = vehicle_number
    order.vehicle_type = vehicle_type
    order.driver_name = driver_name
    order.driver_phone = driver_phone
    order.scheduled_pickup_at = scheduled_pickup
    order.status = 'PICKUP_SCHEDULED'
    order.updated_at = datetime.utcnow()

    # Synchronize carrier info onto Transaction
    txn = order.transaction
    if txn:
        txn.carrier_name = f"{vehicle_type} - {vehicle_number}"
        txn.tracking_number = order.order_ref

    db.session.commit()

    emit_logistics_notification(
        order=order,
        event_key='pickup_scheduled',
        recipient_id=order.seller_id,
        title='Pickup Scheduled',
        message=f'Pickup scheduled for {order.crop_name} by vehicle {vehicle_number} ({driver_name}).'
    )
    emit_logistics_notification(
        order=order,
        event_key='pickup_scheduled_buyer',
        recipient_id=order.buyer_id,
        title='Vehicle Dispatched for Pickup',
        message=f'Consignment {order.order_ref} scheduled for pickup via vehicle {vehicle_number}.'
    )

    return jsonify({
        'success': True,
        'message': 'Vehicle and driver assigned successfully.',
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/<int:order_id>/status', methods=['POST'])
@jwt_required
def update_logistics_status(order_id):
    """
    Logistics provider advances status: PICKED_UP -> IN_TRANSIT -> DELIVERED.
    Synchronizes parent Transaction state:
    - PICKED_UP / IN_TRANSIT -> Transaction IN_DELIVERY
    - DELIVERED -> Transaction DELIVERED
    """
    user = g.current_user
    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    if user.role != 'ADMIN' and order.assigned_provider_id != user.id:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the assigned logistics provider can update delivery status.'}), 403

    data = request.get_json() or {}
    new_status = str(data.get('status', '')).strip().upper()

    valid, err_msg = validate_logistics_transition(order.status, new_status)
    if not valid:
        return jsonify({'success': False, 'error': 'Invalid State Transition', 'message': err_msg}), 400

    now = datetime.utcnow()
    prev_status = order.status
    order.status = new_status
    order.updated_at = now

    txn = order.transaction

    if new_status == 'PICKED_UP':
        order.picked_up_at = now
        if txn and txn.status == 'READY_FOR_LOGISTICS':
            txn.status = 'IN_DELIVERY'
            db.session.add(TransactionHistory(
                transaction_id=txn.id,
                event='PRODUCE_PICKED_UP',
                actor_id=user.id,
                actor_role=user.role,
                previous_state='READY_FOR_LOGISTICS',
                new_state='IN_DELIVERY',
                details=f"Produce picked up by {order.driver_name} ({order.vehicle_number}). Consignment moving to buyer destination."
            ))
        emit_logistics_notification(
            order=order,
            event_key='picked_up',
            recipient_id=order.seller_id,
            title='Produce Picked Up',
            message=f'Consignment {order.order_ref} has been picked up from origin by {order.vehicle_number}.'
        )
        emit_logistics_notification(
            order=order,
            event_key='picked_up_buyer',
            recipient_id=order.buyer_id,
            title='Produce Dispatched',
            message=f'Consignment {order.order_ref} picked up and loaded. En route to your destination hub.'
        )

    elif new_status == 'IN_TRANSIT':
        order.in_transit_at = now
        if txn and txn.status in ['READY_FOR_LOGISTICS', 'READY_FOR_PICKUP']:
            txn.status = 'IN_DELIVERY'
        emit_logistics_notification(
            order=order,
            event_key='in_transit',
            recipient_id=order.buyer_id,
            title='Produce In Transit',
            message=f'Consignment {order.order_ref} is in transit to your depot.'
        )

    elif new_status == 'DELIVERED':
        order.delivered_at = now
        if txn:
            txn.status = 'DELIVERED'
            db.session.add(TransactionHistory(
                transaction_id=txn.id,
                event='DELIVERED_TO_HUB',
                actor_id=user.id,
                actor_role=user.role,
                previous_state=txn.status,
                new_state='DELIVERED',
                details=f"Consignment delivered at buyer destination by {order.vehicle_number}. Awaiting buyer physical inspection and receipt."
            ))
        emit_logistics_notification(
            order=order,
            event_key='delivered_buyer',
            recipient_id=order.buyer_id,
            title='Produce Arrived at Destination',
            message=f'Consignment {order.order_ref} delivered at your hub! Please inspect produce and confirm receipt.'
        )
        emit_logistics_notification(
            order=order,
            event_key='delivered_seller',
            recipient_id=order.seller_id,
            title='Consignment Delivered',
            message=f'Consignment {order.order_ref} has been delivered to buyer depot. Awaiting buyer confirmation.'
        )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Logistics order {order.order_ref} transitioned from {prev_status} to {new_status}.',
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/<int:order_id>/upload-pod', methods=['POST'])
@jwt_required
def upload_proof_of_delivery(order_id):
    """
    Assigned provider uploads Proof of Delivery (POD) photo and notes.
    Validates file extension, size, and secure filename.
    """
    user = g.current_user
    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    if user.role != 'ADMIN' and order.assigned_provider_id != user.id:
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the assigned logistics provider can upload Proof of Delivery.'}), 403

    file = request.files.get('pod_image') or request.files.get('file')
    if not file or file.filename == '':
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Please select a valid image file to upload as POD.'}), 400

    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Invalid file type. Allowed image formats: PNG, JPG, JPEG, WEBP.'
        }), 400

    # Validate file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_POD_FILE_SIZE:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'File size exceeds maximum limit of 5MB.'}), 400

    storage_provider = get_storage_provider()
    custom_pod_name = f"pod_{order.id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
    try:
        save_res = storage_provider.save_file(file, category='pod', custom_filename=custom_pod_name)
    except ValueError as val_err:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': str(val_err)}), 400

    order.pod_image_url = save_res['url']
    order.pod_notes = request.form.get('pod_notes') or request.form.get('notes')
    order.pod_uploaded_at = datetime.utcnow()
    order.pod_uploaded_by = user.id
    order.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Proof of Delivery uploaded successfully.',
        'pod_image_url': order.pod_image_url,
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required
def get_order_details(order_id):
    """
    Retrieve details of a transport order.
    Participant and privacy protected.
    """
    user = g.current_user
    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    # Security check: participant, provider, or admin
    is_participant = (
        user.role == 'ADMIN' or
        user.id in [order.seller_id, order.buyer_id, order.assigned_provider_id]
    )
    if not is_participant and user.role != 'LOGISTICS':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to inspect this consignment.'}), 403

    return jsonify({
        'success': True,
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/transaction/<int:txn_id>', methods=['GET'])
@jwt_required
def get_transport_by_transaction(txn_id):
    """
    Get linked transport order for a transaction.
    """
    user = g.current_user
    txn = Transaction.query.get(txn_id)
    if not txn:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transaction {txn_id} not found.'}), 404

    # Check authorization
    if user.role != 'ADMIN' and user.id not in [txn.seller_id, txn.buyer_id] and user.role != 'LOGISTICS':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Access denied.'}), 403

    order = TransportOrder.query.filter_by(transaction_id=txn.id).order_by(TransportOrder.id.desc()).first()
    if not order:
        return jsonify({
            'success': True,
            'transport_order': None,
            'message': 'No logistics order created yet for this transaction.'
        }), 200

    return jsonify({
        'success': True,
        'transport_order': order.to_dict(current_user=user)
    }), 200


@logistics_bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required
def cancel_transport_order(order_id):
    """
    Cancel transport order before pickup.
    Only Seller or Admin can cancel.
    """
    user = g.current_user
    order = TransportOrder.query.get(order_id)
    if not order:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Transport order {order_id} not found.'}), 404

    if user.id != order.seller_id and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the seller or admin can cancel this transport request.'}), 403

    if order.status in ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED']:
        return jsonify({
            'success': False,
            'error': 'Invalid State',
            'message': f"Cannot cancel transport order in status '{order.status}' after produce has been picked up."
        }), 400

    order.status = 'CANCELLED'
    order.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transport order {order.order_ref} cancelled successfully.',
        'transport_order': order.to_dict(current_user=user)
    }), 200
