from flask import Blueprint, request, jsonify, g
from datetime import datetime

from models import db
from models.user import User, LogisticsProfile, WarehouseProfile
from models.lot import CropLot
from models.storage import Warehouse, StorageBooking
from models.transaction import Transaction, TransactionHistory
from models.payment import PaymentRecord
from models.grievance import Grievance
from models.notification import Notification, emit_idempotent_notification
from models.admin import AdminAuditLog
from models.logistics import TransportOrder
from utils.auth import jwt_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def mask_sensitive_string(val):
    """Utility to mask sensitive identification and financial values."""
    if not val:
        return None
    s = str(val).strip()
    if len(s) <= 4:
        return 'XXXX'
    return 'XXXX-' + s[-4:]


@admin_bp.route('/stats', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def get_admin_stats():
    """Summary metrics queried dynamically from live database for Government Admin Dashboard."""
    total_users = User.query.count()
    pending_verifications = User.query.filter_by(verification_status='PENDING').count()
    verified_users = User.query.filter_by(verification_status='VERIFIED').count()
    suspended_users = User.query.filter_by(verification_status='SUSPENDED').count()
    rejected_users = User.query.filter_by(verification_status='REJECTED').count()

    farmers_count = User.query.filter_by(role='FARMER').count()
    fpos_count = User.query.filter_by(role='FPO').count()
    buyers_count = User.query.filter_by(role='BUYER').count()
    warehouses_count = User.query.filter_by(role='WAREHOUSE').count()
    logistics_count = User.query.filter_by(role='LOGISTICS').count()

    active_lots = CropLot.query.filter_by(status='ACTIVE').count()
    active_aggregations = CropLot.query.filter_by(seller_type='FPO', status='ACTIVE').count()

    active_transactions = Transaction.query.filter(Transaction.status.notin_(['COMPLETED', 'CANCELLED'])).count()
    completed_transactions = Transaction.query.filter_by(status='COMPLETED').count()
    disputed_transactions = Transaction.query.filter_by(status='DISPUTED').count()

    # Prototype Escrow tracking
    escrow_held_records = PaymentRecord.query.filter(
        PaymentRecord.escrow_status.in_(['HELD_BY_GOVT_ESCROW', 'ESCROW_HELD'])
    ).all()
    escrow_held_total = sum(p.amount for p in escrow_held_records)

    escrow_released_records = PaymentRecord.query.filter(
        PaymentRecord.escrow_status.in_(['RELEASED_TO_SELLER', 'SETTLED'])
    ).all()
    escrow_released_total = sum(p.amount for p in escrow_released_records)

    refunded_records = PaymentRecord.query.filter_by(payment_type='REFUND').all()
    refunded_total = sum(p.amount for p in refunded_records)

    # Logistics tracking
    active_logistics = TransportOrder.query.filter(
        TransportOrder.status.in_(['REQUESTED', 'ASSIGNED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT'])
    ).count()
    completed_logistics = TransportOrder.query.filter_by(status='DELIVERED').count()

    # Storage tracking
    active_storage = StorageBooking.query.filter(
        StorageBooking.status.in_(['REQUESTED', 'APPROVED', 'CHECKED_IN', 'ACTIVE'])
    ).count()
    total_storage_bookings = StorageBooking.query.count()

    # Grievances
    open_grievances = Grievance.query.filter_by(status='OPEN').count()
    under_review_grievances = Grievance.query.filter(
        Grievance.status.in_(['UNDER_REVIEW', 'UNDER_INVESTIGATION'])
    ).count()
    resolved_grievances = Grievance.query.filter_by(status='RESOLVED').count()

    return jsonify({
        'success': True,
        'stats': {
            'total_users': total_users,
            'pending_verifications': pending_verifications,
            'verified_users': verified_users,
            'suspended_users': suspended_users,
            'rejected_users': rejected_users,
            'farmers_count': farmers_count,
            'fpos_count': fpos_count,
            'buyers_count': buyers_count,
            'warehouses_count': warehouses_count,
            'logistics_count': logistics_count,
            'active_lots': active_lots,
            'active_aggregations': active_aggregations,
            'active_transactions': active_transactions,
            'completed_transactions': completed_transactions,
            'disputed_transactions': disputed_transactions,
            'is_prototype_escrow': True,
            'escrow_held_amount': round(escrow_held_total, 2),
            'escrow_released_amount': round(escrow_released_total, 2),
            'escrow_refunded_amount': round(refunded_total, 2),
            'escrow_records_count': len(escrow_held_records),
            'active_logistics_deliveries': active_logistics,
            'completed_logistics_deliveries': completed_logistics,
            'active_storage_bookings': active_storage,
            'total_storage_bookings': total_storage_bookings,
            'open_grievances': open_grievances,
            'under_review_grievances': under_review_grievances,
            'resolved_grievances': resolved_grievances
        }
    }), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def list_users():
    """List users for Government Verification with multi-tab filters and masked sensitive data."""
    status_filter = request.args.get('status', 'ALL').upper()
    role_filter = request.args.get('role', 'ALL').upper()
    search = request.args.get('search', '').strip()

    query = User.query
    if status_filter != 'ALL':
        query = query.filter_by(verification_status=status_filter)
    if role_filter != 'ALL':
        query = query.filter_by(role=role_filter)
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) |
            (User.phone.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )

    users = query.order_by(User.created_at.desc()).all()

    return jsonify({
        'success': True,
        'total': len(users),
        'status_filter': status_filter,
        'role_filter': role_filter,
        'users': [u.to_dict() for u in users]
    }), 200


@admin_bp.route('/users/<int:user_id>/status', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def update_user_status(user_id):
    """Update user verification status: VERIFY, REJECT, SUSPEND, REQUEST_INFO with append-only audit trail."""
    user = User.query.get_or_404(user_id)
    admin_id = g.current_user.id
    data = request.get_json() or {}

    action = str(data.get('action', '')).upper()
    reason = str(data.get('reason', '')).strip()
    notes = str(data.get('notes', '')).strip()

    if action not in ['VERIFY', 'REJECT', 'SUSPEND', 'REQUEST_INFO']:
        return jsonify({
            'success': False,
            'error': 'Invalid Action',
            'message': "Action must be one of: 'VERIFY', 'REJECT', 'SUSPEND', 'REQUEST_INFO'"
        }), 400

    previous_status = user.verification_status

    if action == 'VERIFY':
        user.verification_status = 'VERIFIED'
        user.verification_notes = notes or 'Verified by Maharashtra Agriculture Department Officer.'
        audit_action = 'USER_VERIFIED'
        msg = f'User {user.name or user.phone} verified successfully.'

        # Synchronize associated warehouse records if user is WAREHOUSE
        if user.role == 'WAREHOUSE':
            whs = Warehouse.query.filter(
                (Warehouse.operator_user_id == user.id) |
                (Warehouse.name.ilike(f'%{user.name}%'))
            ).all()
            for w in whs:
                w.verification_status = 'VERIFIED'
                w.verified_at = datetime.utcnow()
                w.verified_by_admin_id = admin_id

        elif user.role in ['FARMER', 'FPO']:
            CropLot.query.filter_by(seller_id=user.id).update({'seller_verification_status': 'VERIFIED'})

        elif user.role == 'LOGISTICS' and user.logistics_profile:
            user.logistics_profile.verification_status = 'VERIFIED'

    elif action == 'REJECT':
        if not reason:
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': 'A rejection reason is mandatory when rejecting verification.'
            }), 400
        user.verification_status = 'REJECTED'
        user.rejection_reason = reason
        user.verification_notes = notes
        audit_action = 'USER_REJECTED'
        msg = f'User {user.name or user.phone} verification rejected: {reason}'

        if user.role == 'WAREHOUSE':
            whs = Warehouse.query.filter(
                (Warehouse.operator_user_id == user.id) |
                (Warehouse.name.ilike(f'%{user.name}%'))
            ).all()
            for w in whs:
                w.verification_status = 'REJECTED'
                w.rejection_reason = reason
        elif user.role in ['FARMER', 'FPO']:
            CropLot.query.filter_by(seller_id=user.id).update({'seller_verification_status': 'REJECTED'})
        elif user.role == 'LOGISTICS' and user.logistics_profile:
            user.logistics_profile.verification_status = 'REJECTED'

    elif action == 'SUSPEND':
        user.verification_status = 'SUSPENDED'
        user.verification_notes = notes or reason or 'Account suspended pending administrative inquiry.'
        audit_action = 'USER_SUSPENDED'
        msg = f'User {user.name or user.phone} account suspended.'

    elif action == 'REQUEST_INFO':
        user.verification_notes = notes or 'Additional documents requested by Nodal Officer.'
        audit_action = 'USER_INFO_REQUESTED'
        msg = f'Additional information requested from {user.name or user.phone}.'

    # Append to AdminAuditLog
    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=audit_action,
        target_type='USER',
        target_id=user.id,
        details=f"Verification status transitioned from {previous_status} to {user.verification_status}. {notes}",
        reason=reason or notes
    )
    db.session.add(audit_log)

    # Idempotent notification to user
    notif_event_key = f"user:{user.id}:verification:{user.verification_status.lower()}"
    emit_idempotent_notification(
        notif_event_key,
        user.id,
        f"Verification Update: {user.verification_status}",
        f"Review completed by Nodal Officer: {user.verification_notes or user.rejection_reason or 'Profile updated.'}",
        'SUCCESS' if user.verification_status == 'VERIFIED' else ('WARNING' if user.verification_status == 'REJECTED' else 'INFO')
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': msg,
        'user': user.to_dict()
    }), 200


@admin_bp.route('/users/<int:user_id>/verify', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def verify_user_direct(user_id):
    """Direct alias for verifying a user."""
    data = request.get_json(silent=True) or {}
    data['action'] = 'VERIFY'
    request._cached_json = (data, data)
    return update_user_status(user_id)


@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def reject_user_direct(user_id):
    """Direct alias for rejecting a user."""
    data = request.get_json(silent=True) or {}
    data['action'] = 'REJECT'
    request._cached_json = (data, data)
    return update_user_status(user_id)


@admin_bp.route('/warehouses', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def list_admin_warehouses():
    """List all registered warehouses for administrative oversight and audit."""
    status_filter = request.args.get('status', 'ALL').upper()
    query = Warehouse.query
    if status_filter != 'ALL':
        query = query.filter_by(verification_status=status_filter)

    warehouses = query.order_by(Warehouse.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(warehouses),
        'warehouses': [w.to_dict() for w in warehouses]
    }), 200


@admin_bp.route('/warehouses/<int:warehouse_id>/status', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def update_warehouse_status(warehouse_id):
    """Admin verifies, rejects, or suspends a storage facility."""
    wh = Warehouse.query.get_or_404(warehouse_id)
    admin_id = g.current_user.id
    data = request.get_json() or {}

    action = str(data.get('action', '')).upper()
    reason = str(data.get('reason', '')).strip()

    if action not in ['VERIFY', 'REJECT', 'SUSPEND']:
        return jsonify({'success': False, 'error': 'Invalid Action', 'message': "Action must be 'VERIFY', 'REJECT', or 'SUSPEND'"}), 400

    previous_status = wh.verification_status

    if action == 'VERIFY':
        wh.verification_status = 'VERIFIED'
        wh.verified_at = datetime.utcnow()
        wh.verified_by_admin_id = admin_id
        wh.rejection_reason = None
        audit_action = 'WAREHOUSE_VERIFIED'
        msg = f"Warehouse '{wh.name}' verified on AgriSaathi prototype."

    elif action == 'REJECT':
        if not reason:
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Rejection reason is required.'}), 400
        wh.verification_status = 'REJECTED'
        wh.rejection_reason = reason
        audit_action = 'WAREHOUSE_REJECTED'
        msg = f"Warehouse '{wh.name}' verification rejected: {reason}"

    elif action == 'SUSPEND':
        wh.verification_status = 'SUSPENDED'
        wh.rejection_reason = reason or 'Facility suspended pending inspection.'
        audit_action = 'WAREHOUSE_SUSPENDED'
        msg = f"Warehouse '{wh.name}' facility suspended."

    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=audit_action,
        target_type='WAREHOUSE',
        target_id=wh.id,
        details=f"Warehouse verification changed from {previous_status} to {wh.verification_status}.",
        reason=reason
    )
    db.session.add(audit_log)

    if wh.operator_user_id:
        emit_idempotent_notification(
            f"warehouse:{wh.id}:verification:{wh.verification_status.lower()}",
            wh.operator_user_id,
            f"Facility Verification: {wh.verification_status}",
            f"Administrative review for {wh.name} complete: {wh.verification_status}.",
            'SUCCESS' if wh.verification_status == 'VERIFIED' else 'WARNING'
        )

    db.session.commit()
    return jsonify({'success': True, 'message': msg, 'warehouse': wh.to_dict()}), 200


@admin_bp.route('/logistics', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def list_admin_logistics():
    """List logistics providers for administrative verification."""
    query = LogisticsProfile.query.order_by(LogisticsProfile.created_at.desc()).all()
    res = []
    for p in query:
        d = p.to_dict()
        d['user_name'] = p.user.name if p.user else None
        d['user_phone'] = p.user.phone if p.user else None
        res.append(d)
    return jsonify({'success': True, 'count': len(res), 'logistics_providers': res}), 200


@admin_bp.route('/logistics/<int:profile_id>/status', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def update_logistics_status(profile_id):
    """Admin verifies, rejects, or suspends a logistics provider."""
    prof = LogisticsProfile.query.get_or_404(profile_id)
    admin_id = g.current_user.id
    data = request.get_json() or {}

    action = str(data.get('action', '')).upper()
    reason = str(data.get('reason', '')).strip()

    if action not in ['VERIFY', 'REJECT', 'SUSPEND']:
        return jsonify({'success': False, 'error': 'Invalid Action', 'message': "Action must be 'VERIFY', 'REJECT', or 'SUSPEND'"}), 400

    user = User.query.get(prof.user_id) if prof.user_id else None
    previous_status = user.verification_status if user else 'PENDING'

    if action == 'VERIFY':
        new_status = 'VERIFIED'
        if user:
            user.verification_status = 'VERIFIED'
            user.verified_at = datetime.utcnow()
            user.verified_by_admin_id = admin_id
            user.rejection_reason = None
        audit_action = 'LOGISTICS_PROVIDER_VERIFIED'
        msg = f"Logistics provider '{prof.company_name}' verified."

    elif action == 'REJECT':
        if not reason:
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Rejection reason is required.'}), 400
        new_status = 'REJECTED'
        if user:
            user.verification_status = 'REJECTED'
            user.rejection_reason = reason
        audit_action = 'LOGISTICS_PROVIDER_REJECTED'
        msg = f"Logistics provider '{prof.company_name}' rejected: {reason}"

    elif action == 'SUSPEND':
        new_status = 'SUSPENDED'
        if user:
            user.verification_status = 'SUSPENDED'
            user.rejection_reason = reason or 'Provider suspended pending regulatory audit.'
        audit_action = 'LOGISTICS_PROVIDER_SUSPENDED'
        msg = f"Logistics provider '{prof.company_name}' suspended."

    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=audit_action,
        target_type='LOGISTICS',
        target_id=prof.id,
        details=f"Logistics provider status changed from {previous_status} to {new_status}.",
        reason=reason
    )
    db.session.add(audit_log)

    if prof.user_id:
        emit_idempotent_notification(
            f"logistics:{prof.id}:verification:{new_status.lower()}",
            prof.user_id,
            f"Transporter Verification: {new_status}",
            f"Administrative review of {prof.company_name} is complete.",
            'SUCCESS' if new_status == 'VERIFIED' else 'WARNING'
        )

    db.session.commit()
    return jsonify({'success': True, 'message': msg, 'profile': prof.to_dict()}), 200


@admin_bp.route('/transactions/<int:txn_id>/audit', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def audit_transaction(txn_id):
    """360-degree transaction dossier for administrative inspection and financial audit."""
    txn = Transaction.query.get_or_404(txn_id)

    # Linked transport consignment
    active_transport = None
    if hasattr(txn, 'logistics_requests') and txn.logistics_requests:
        valid_reqs = [r for r in txn.logistics_requests if r.status != 'CANCELLED']
        active_transport = (valid_reqs[-1] if valid_reqs else txn.logistics_requests[-1]).to_dict(current_user=g.current_user)

    # Linked grievances / disputes
    disputes = [g_item.to_dict() for g_item in Grievance.query.filter_by(transaction_id=txn.id).all()]

    dossier = {
        'transaction': txn.to_dict(),
        'seller': {
            'id': txn.seller.id if txn.seller else None,
            'name': txn.seller.name if txn.seller else None,
            'phone': txn.seller.phone if txn.seller else None,
            'role': txn.seller.role if txn.seller else None,
            'verification_status': txn.seller.verification_status if txn.seller else None
        },
        'buyer': {
            'id': txn.buyer.id if txn.buyer else None,
            'name': txn.buyer.name if txn.buyer else None,
            'phone': txn.buyer.phone if txn.buyer else None,
            'role': txn.buyer.role if txn.buyer else None,
            'verification_status': txn.buyer.verification_status if txn.buyer else None
        },
        'escrow_records': [p.to_dict() for p in txn.payments] if txn.payments else [],
        'logistics_order': active_transport,
        'disputes': disputes,
        'history_events': [h.to_dict() for h in txn.history] if txn.history else []
    }

    return jsonify({'success': True, 'audit_dossier': dossier}), 200


@admin_bp.route('/logistics/<int:order_id>/audit', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def audit_logistics_order(order_id):
    """Detailed administrative audit of a transport order including vehicle, driver, and POD."""
    order = TransportOrder.query.get_or_404(order_id)
    return jsonify({
        'success': True,
        'transport_order': order.to_dict(current_user=g.current_user)
    }), 200


@admin_bp.route('/storage/bookings', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def audit_storage_bookings():
    """Lists all storage bookings across all facilities for administrative oversight."""
    status_filter = request.args.get('status', 'ALL').upper()
    query = StorageBooking.query
    if status_filter != 'ALL':
        query = query.filter_by(status=status_filter)

    bookings = query.order_by(StorageBooking.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(bookings),
        'bookings': [b.to_dict() for b in bookings]
    }), 200


@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def list_admin_audit_logs():
    """Returns chronological audit records of all administrative actions."""
    logs = AdminAuditLog.query.order_by(AdminAuditLog.created_at.desc()).limit(100).all()
    return jsonify({
        'success': True,
        'count': len(logs),
        'audit_logs': [l.to_dict() for l in logs]
    }), 200


@admin_bp.route('/escrow', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def get_escrow_records():
    """List all Prototype Escrow payment transactions for administrative oversight."""
    records = PaymentRecord.query.order_by(PaymentRecord.created_at.desc()).all()
    rec_list = [r.to_dict() for r in records]
    return jsonify({
        'success': True,
        'is_prototype_escrow': True,
        'records': rec_list,
        'escrow_records': rec_list
    }), 200


@admin_bp.route('/grievances', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def list_grievances():
    """List grievances for Government resolution."""
    status_filter = request.args.get('status', 'ALL').upper()
    query = Grievance.query
    if status_filter != 'ALL':
        if status_filter in ['UNDER_REVIEW', 'UNDER_INVESTIGATION']:
            query = query.filter(Grievance.status.in_(['UNDER_REVIEW', 'UNDER_INVESTIGATION']))
        else:
            query = query.filter_by(status=status_filter)

    grievances = query.order_by(Grievance.created_at.desc()).all()
    return jsonify({
        'success': True,
        'grievances': [g_item.to_dict() for g_item in grievances]
    }), 200


@admin_bp.route('/grievances/<int:grievance_id>/status', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def update_grievance_status(grievance_id):
    """
    Adjudicate and advance grievance lifecycle:
    UNDER_REVIEW, RESOLVED, REJECTED.
    """
    g_item = Grievance.query.get_or_404(grievance_id)
    admin_id = g.current_user.id
    data = request.get_json() or {}

    action = str(data.get('action') or data.get('status') or '').strip().upper()
    notes = str(data.get('resolution_notes') or data.get('notes') or '').strip()

    if action in ['UNDER_REVIEW', 'UNDER_INVESTIGATION', 'START_REVIEW']:
        g_item.status = 'UNDER_REVIEW'
        g_item.resolution_notes = notes or 'Grievance placed under formal administrative investigation by Nodal Officer.'
        audit_action = 'GRIEVANCE_REVIEW_STARTED'
        msg = f"Grievance {g_item.grievance_ref} is now UNDER REVIEW."

    elif action in ['RESOLVE', 'RESOLVED']:
        g_item.status = 'RESOLVED'
        g_item.resolution_notes = notes or 'Grievance resolved following administrative review.'
        g_item.resolved_by_admin_id = admin_id
        g_item.resolved_at = datetime.utcnow()
        audit_action = 'GRIEVANCE_RESOLVED'
        msg = f"Grievance {g_item.grievance_ref} resolved."

        # If linked to a transaction, check if resolution unblocks transaction
        if g_item.transaction_id:
            txn = Transaction.query.get(g_item.transaction_id)
            if txn and txn.status == 'DISPUTED':
                outcome = data.get('transaction_outcome', 'UNBLOCK').upper()
                if outcome == 'UNBLOCK':
                    txn.status = 'IN_DELIVERY' if txn.carrier_name else 'READY_FOR_LOGISTICS'
                    TransactionHistory.record(
                        txn.id,
                        'DISPUTE_RESOLVED',
                        actor_id=admin_id,
                        actor_role='ADMIN',
                        prev_state='DISPUTED',
                        new_state=txn.status,
                        details=f"Administrative grievance {g_item.grievance_ref} resolved: {notes}"
                    )

    elif action in ['REJECT', 'REJECTED', 'DISMISS', 'DISMISSED']:
        g_item.status = 'DISMISSED'
        g_item.resolution_notes = notes or 'Grievance dismissed following preliminary evaluation.'
        g_item.resolved_by_admin_id = admin_id
        g_item.resolved_at = datetime.utcnow()
        audit_action = 'GRIEVANCE_DISMISSED'
        msg = f"Grievance {g_item.grievance_ref} dismissed."

    else:
        return jsonify({'success': False, 'error': 'Invalid Action', 'message': f"Action '{action}' is not supported."}), 400

    # Write to AdminAuditLog
    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=audit_action,
        target_type='GRIEVANCE',
        target_id=g_item.id,
        details=f"Grievance ref {g_item.grievance_ref} status changed to {g_item.status}. {notes}",
        reason=notes
    )
    db.session.add(audit_log)

    # Notify complainant
    emit_idempotent_notification(
        f"grievance:{g_item.id}:{g_item.status.lower()}",
        g_item.complainant_id,
        f"Grievance Update: {g_item.grievance_ref}",
        f"Status: {g_item.status}. Note: {g_item.resolution_notes}",
        'SUCCESS' if g_item.status == 'RESOLVED' else 'INFO'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': msg,
        'grievance': g_item.to_dict()
    }), 200


@admin_bp.route('/grievances/<int:grievance_id>/resolve', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def resolve_grievance(grievance_id):
    """Backward-compatible resolution endpoint."""
    data = request.get_json(silent=True) or {}
    data['action'] = 'RESOLVE'
    request._cached_json = (data, data)
    return update_grievance_status(grievance_id)


@admin_bp.route('/intelligence-audit', methods=['GET'])
@jwt_required
@role_required('ADMIN')
def get_intelligence_audit():
    """
    Administrative provenance and intelligence layer transparency audit.
    Segregates real/historical from synthetic/sample data to ensure
    synthetic intelligence is never treated as official regulatory evidence.
    """
    from models.market import MarketPrice
    from models.prediction import PricePrediction
    from models.lot import QualityReport

    market_records = db.session.query(
        MarketPrice.source_type, db.func.count(MarketPrice.id)
    ).group_by(MarketPrice.source_type).all()
    market_provenance = {r[0] or 'HISTORICAL': r[1] for r in market_records}

    pred_records = db.session.query(
        PricePrediction.model_type, db.func.count(PricePrediction.id)
    ).group_by(PricePrediction.model_type).all()
    pred_provenance = {r[0] or 'UNKNOWN': r[1] for r in pred_records}

    quality_records = db.session.query(
        QualityReport.verification_status, db.func.count(QualityReport.id)
    ).group_by(QualityReport.verification_status).all()
    quality_breakdown = {r[0] or 'SELF_REPORTED': r[1] for r in quality_records}

    image_validation_records = db.session.query(
        QualityReport.image_validation_status, db.func.count(QualityReport.id)
    ).group_by(QualityReport.image_validation_status).all()
    image_breakdown = {r[0] or 'PASSED': r[1] for r in image_validation_records}

    return jsonify({
        'success': True,
        'regulatory_notice': 'Decision-support outputs are advisory prototype estimates and must not replace physical quality inspection, official mandi data, or professional market judgment.',
        'data_provenance': {
            'market_prices': {
                'total_records': MarketPrice.query.count(),
                'breakdown_by_source': market_provenance,
                'historical_count': market_provenance.get('HISTORICAL', 0),
                'sample_count': market_provenance.get('SAMPLE', 0),
                'synthetic_count': market_provenance.get('SYNTHETIC', 0),
                'live_count': market_provenance.get('LIVE', 0)
            },
            'predictions': {
                'total_predictions_logged': PricePrediction.query.count(),
                'breakdown_by_model': pred_provenance
            },
            'lot_quality': {
                'total_quality_reports': QualityReport.query.count(),
                'breakdown_by_verification': quality_breakdown,
                'breakdown_by_image_validation': image_breakdown
            }
        }
    }), 200

