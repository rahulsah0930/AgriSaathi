from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db
from models.user import User
from models.lot import CropLot
from models.transaction import Transaction
from models.payment import PaymentRecord
from models.grievance import Grievance
from models.notification import Notification

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
def get_admin_stats():
    """Summary metrics for Government Admin Dashboard."""
    total_users = User.query.count()
    pending_verifications = User.query.filter_by(verification_status='PENDING').count()
    verified_users = User.query.filter_by(verification_status='VERIFIED').count()
    farmers_count = User.query.filter_by(role='FARMER').count()
    fpos_count = User.query.filter_by(role='FPO').count()
    buyers_count = User.query.filter_by(role='BUYER').count()
    warehouses_count = User.query.filter_by(role='WAREHOUSE').count()

    active_transactions = Transaction.query.filter(Transaction.status.notin_(['COMPLETED', 'CANCELLED'])).count()
    escrow_held_records = PaymentRecord.query.filter_by(escrow_status='HELD_BY_GOVT_ESCROW').all()
    escrow_total = sum(p.amount for p in escrow_held_records)
    open_grievances = Grievance.query.filter_by(status='OPEN').count()

    return jsonify({
        'success': True,
        'stats': {
            'total_users': total_users,
            'pending_verifications': pending_verifications,
            'verified_users': verified_users,
            'farmers_count': farmers_count,
            'fpos_count': fpos_count,
            'buyers_count': buyers_count,
            'warehouses_count': warehouses_count,
            'active_transactions': active_transactions,
            'escrow_held_amount': round(escrow_total, 2),
            'escrow_records_count': len(escrow_held_records),
            'open_grievances': open_grievances
        }
    }), 200


@admin_bp.route('/users', methods=['GET'])
def list_users():
    """List users for Government Verification with multi-tab filters."""
    status_filter = request.args.get('status', 'ALL').upper()
    role_filter = request.args.get('role', 'ALL').upper()

    query = User.query
    if status_filter != 'ALL':
        query = query.filter_by(verification_status=status_filter)
    if role_filter != 'ALL':
        query = query.filter_by(role=role_filter)

    users = query.order_by(User.created_at.desc()).all()

    return jsonify({
        'success': True,
        'total': len(users),
        'status_filter': status_filter,
        'role_filter': role_filter,
        'users': [u.to_dict() for u in users]
    }), 200


@admin_bp.route('/users/<int:user_id>/status', methods=['POST'])
def update_user_status(user_id):
    """Update user verification status: VERIFY, REJECT, SUSPEND, REQUEST_INFO."""
    user = User.query.get_or_404(user_id)
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

    if action == 'VERIFY':
        user.verification_status = 'VERIFIED'
        user.verification_notes = notes or 'Verified by Maharashtra Agriculture Department Officer.'
        msg = f'User {user.name or user.phone} verified successfully.'
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
        msg = f'User {user.name or user.phone} verification rejected: {reason}'
    elif action == 'SUSPEND':
        user.verification_status = 'SUSPENDED'
        user.verification_notes = notes or 'Account suspended pending administrative inquiry.'
        msg = f'User {user.name or user.phone} account suspended.'
    elif action == 'REQUEST_INFO':
        user.verification_notes = notes or 'Additional documents requested by Nodal Officer.'
        msg = f'Additional information requested from {user.name or user.phone}.'

    # Notify the user
    notif = Notification(
        user_id=user.id,
        title=f'Verification Status Update: {user.verification_status}',
        message=f'Government verification review complete: {user.verification_notes or user.rejection_reason or "Profile updated."}',
        type='VERIFICATION'
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': msg,
        'user': user.to_dict()
    }), 200


@admin_bp.route('/users/<int:user_id>/verify', methods=['POST'])
def verify_user_direct(user_id):
    """Direct alias for verifying a user."""
    data = request.get_json(silent=True) or {}
    data['action'] = 'VERIFY'
    request._cached_json = (data, data)
    return update_user_status(user_id)


@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
def reject_user_direct(user_id):
    """Direct alias for rejecting a user."""
    data = request.get_json(silent=True) or {}
    data['action'] = 'REJECT'
    request._cached_json = (data, data)
    return update_user_status(user_id)


@admin_bp.route('/escrow', methods=['GET'])
def get_escrow_records():
    """List all Escrow payment transactions for state financial audit."""
    records = PaymentRecord.query.order_by(PaymentRecord.created_at.desc()).all()
    rec_list = [r.to_dict() for r in records]
    return jsonify({
        'success': True,
        'records': rec_list,
        'escrow_records': rec_list
    }), 200


@admin_bp.route('/grievances', methods=['GET'])
def list_grievances():
    """List grievances for Government resolution."""
    status_filter = request.args.get('status', 'ALL').upper()
    query = Grievance.query
    if status_filter != 'ALL':
        query = query.filter_by(status=status_filter)

    grievances = query.order_by(Grievance.created_at.desc()).all()
    return jsonify({
        'success': True,
        'grievances': [g.to_dict() for g in grievances]
    }), 200


@admin_bp.route('/grievances/<int:grievance_id>/resolve', methods=['POST'])
def resolve_grievance(grievance_id):
    """Adjudicate and resolve a grievance."""
    g = Grievance.query.get_or_404(grievance_id)
    data = request.get_json() or {}

    status = data.get('status', 'RESOLVED').upper()
    notes = data.get('resolution_notes', 'Resolved by Nodal Officer.')
    admin_id = data.get('admin_id')

    g.status = status
    g.resolution_notes = notes
    g.resolved_by_admin_id = admin_id
    g.resolved_at = datetime.utcnow()

    # Notify complainant
    notif = Notification(
        user_id=g.complainant_id,
        title=f'Grievance {g.grievance_ref} {status}',
        message=f'Official resolution: {notes}',
        type='INFO'
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Grievance {g.grievance_ref} updated to {status}.',
        'grievance': g.to_dict()
    }), 200
