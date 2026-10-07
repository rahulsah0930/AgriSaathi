import os
from flask import Blueprint, request, jsonify, g, current_app
from datetime import datetime
from models import db
from models.transaction import Transaction, TransactionHistory
from models.payment import PaymentRecord
from models.lot import CropLot
from models.offer import Offer
from models.notification import Notification
from utils.auth import jwt_required, role_required
from services.transaction_service import (
    calculate_financials,
    validate_transition,
    normalize_status,
    record_transaction_history,
    emit_transaction_notification
)

transaction_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

@transaction_bp.route('', methods=['GET'])
@jwt_required
def list_transactions():
    """List transactions securely scoped for the authenticated user, or all for admin."""
    user = g.current_user
    query = Transaction.query

    if user.role == 'BUYER':
        query = query.filter_by(buyer_id=user.id)
    elif user.role in ['FARMER', 'FPO']:
        query = query.filter_by(seller_id=user.id)
    elif user.role == 'ADMIN':
        target_user_id = request.args.get('user_id', type=int)
        target_role = request.args.get('role', '').upper()
        if target_user_id:
            if target_role == 'BUYER':
                query = query.filter_by(buyer_id=target_user_id)
            elif target_role in ['FARMER', 'FPO']:
                query = query.filter_by(seller_id=target_user_id)
            else:
                query = query.filter((Transaction.buyer_id == target_user_id) | (Transaction.seller_id == target_user_id))
    else:
        query = query.filter((Transaction.buyer_id == user.id) | (Transaction.seller_id == user.id))

    transactions = query.order_by(Transaction.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(transactions),
        'transactions': [t.to_dict() for t in transactions]
    }), 200


@transaction_bp.route('/<int:txn_id>', methods=['GET'])
@jwt_required
def get_transaction(txn_id):
    """Retrieve full transaction details with escrow and delivery audit records."""
    txn = Transaction.query.get_or_404(txn_id)
    if g.current_user.id not in (txn.buyer_id, txn.seller_id) and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You are not authorized to view this transaction.'}), 403

    return jsonify({
        'success': True,
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/history', methods=['GET'])
@jwt_required
def get_transaction_history(txn_id):
    """Retrieve immutable audit history ledger for a transaction."""
    txn = Transaction.query.get_or_404(txn_id)
    if g.current_user.id not in (txn.buyer_id, txn.seller_id) and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You are not authorized to view this audit history.'}), 403

    entries = TransactionHistory.query.filter_by(transaction_id=txn.id).order_by(TransactionHistory.created_at.asc()).all()
    return jsonify({
        'success': True,
        'transaction_id': txn.id,
        'transaction_ref': txn.transaction_ref,
        'history': [e.to_dict() for e in entries]
    }), 200


@transaction_bp.route('/<int:txn_id>/status', methods=['POST', 'PATCH'])
@jwt_required
def update_transaction_status(txn_id):
    """Advance transaction lifecycle with participant role verification and state machine validation."""
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    if user.id not in (txn.buyer_id, txn.seller_id) and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You are not authorized to modify this transaction.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status', '').upper().strip()

    if not new_status:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Status is required.'}), 400

    # Role checks
    if new_status in ['BUYER_CONFIRMED'] and user.id != txn.buyer_id and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the purchasing buyer can confirm receipt of delivery.'}), 403

    if new_status in ['IN_TRANSIT', 'IN_DELIVERY', 'DELIVERED'] and user.role not in ['ADMIN', 'LOGISTICS']:
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': f'Status transition to {new_status} must be performed by the assigned Logistics Provider or Admin.'
        }), 403

    if new_status in ['READY_FOR_PICKUP', 'READY_FOR_LOGISTICS'] and user.id != txn.seller_id and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the seller or authorized dispatcher can update transit status.'}), 403

    # Cannot confirm before DELIVERED
    if new_status == 'BUYER_CONFIRMED':
        if normalize_status(txn.status) != 'DELIVERED':
            return jsonify({
                'success': False,
                'error': 'Invalid State Transition',
                'message': 'Delivery cannot be confirmed before produce reaches DELIVERED status.'
            }), 400

    # State machine transition check
    is_valid, err_msg = validate_transition(txn.status, new_status)
    if not is_valid:
        return jsonify({'success': False, 'error': 'Invalid State Transition', 'message': err_msg}), 400

    prev_status = txn.status
    txn.status = new_status
    if data.get('carrier_name'):
        txn.carrier_name = data.get('carrier_name')
    if data.get('tracking_number'):
        txn.tracking_number = data.get('tracking_number')
    if data.get('notes'):
        txn.notes = data.get('notes')

    now = datetime.utcnow()

    # Handle delivery confirmation
    if new_status == 'BUYER_CONFIRMED':
        txn.delivery_confirmed_at = now
        record_transaction_history(
            txn=txn,
            event='BUYER_CONFIRMED',
            actor=user,
            previous_state=prev_status,
            new_state='BUYER_CONFIRMED',
            details='Buyer physically inspected and confirmed delivery. Awaiting balance settlement.'
        )
        emit_transaction_notification(
            txn=txn,
            event_name='buyer_confirmed',
            recipient_id=txn.seller_id,
            title='Delivery Receipt Confirmed',
            message=f'Buyer confirmed delivery for {txn.transaction_ref}. Final balance payment will be settled.'
        )
    elif new_status in ['IN_DELIVERY', 'IN_TRANSIT']:
        record_transaction_history(
            txn=txn,
            event='DISPATCHED_IN_DELIVERY',
            actor=user,
            previous_state=prev_status,
            new_state=new_status,
            details=f'Produce dispatched. Carrier: {txn.carrier_name or "Direct Vehicle"}. Tracking: {txn.tracking_number or "N/A"}.'
        )
        emit_transaction_notification(
            txn=txn,
            event_name='in_delivery',
            recipient_id=txn.buyer_id,
            title='Consignment In Transit',
            message=f'{txn.quantity} {txn.unit} of {txn.crop} is on the way to your delivery hub.'
        )
    elif new_status == 'DELIVERED':
        record_transaction_history(
            txn=txn,
            event='DELIVERED_TO_HUB',
            actor=user,
            previous_state=prev_status,
            new_state='DELIVERED',
            details='Consignment delivered at destination hub. Ready for buyer physical inspection.'
        )
        emit_transaction_notification(
            txn=txn,
            event_name='delivered',
            recipient_id=txn.buyer_id,
            title='Produce Delivered — Action Required',
            message=f'{txn.crop} arrived at your depot. Please inspect produce and confirm receipt.'
        )
    else:
        record_transaction_history(
            txn=txn,
            event=f'STATUS_{new_status}',
            actor=user,
            previous_state=prev_status,
            new_state=new_status,
            details=f'Status transitioned to {new_status}.'
        )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transaction {txn.transaction_ref} status updated to {txn.status}.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/confirm-delivery', methods=['POST'])
@jwt_required
def confirm_delivery(txn_id):
    """Buyer physically confirms delivery receipt."""
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    if user.id != txn.buyer_id and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Only the purchasing buyer can confirm delivery.'}), 403

    if normalize_status(txn.status) != 'DELIVERED':
        return jsonify({
            'success': False,
            'error': 'Invalid State Transition',
            'message': 'Buyer cannot confirm delivery before produce reaches DELIVERED status.'
        }), 400

    now = datetime.utcnow()
    prev_status = txn.status
    txn.status = 'BUYER_CONFIRMED'
    txn.delivery_confirmed_at = now

    record_transaction_history(
        txn=txn,
        event='BUYER_CONFIRMED',
        actor=user,
        previous_state=prev_status,
        new_state='BUYER_CONFIRMED',
        details='Buyer physically inspected and verified produce. Delivery confirmed.'
    )

    emit_transaction_notification(
        txn=txn,
        event_name='buyer_confirmed',
        recipient_id=txn.seller_id,
        title='Delivery Receipt Confirmed',
        message=f'Buyer confirmed delivery for {txn.transaction_ref}. Proceeding to balance escrow settlement.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Delivery confirmed successfully! Please deposit the remaining balance to complete settlement.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/simulate-delivery', methods=['POST'])
@jwt_required
def simulate_delivery(txn_id):
    """
    Test/admin helper to advance logistics state for prototype testing in Phase 4.
    Marches: READY_FOR_LOGISTICS -> IN_DELIVERY -> DELIVERED.
    """
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    # Phase 5: Restricted to ADMIN or automated testing environment
    is_test_env = current_app.config.get('TESTING') or os.environ.get('FLASK_ENV') in ('development', 'testing') or current_app.debug
    if user.role != 'ADMIN' and not (is_test_env and user.id in (txn.buyer_id, txn.seller_id)):
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Logistics simulation is restricted to ADMIN and test mode in Phase 5. Use the official transport order workflow.'
        }), 403

    prev_status = txn.status
    txn.status = 'DELIVERED'
    txn.carrier_name = txn.carrier_name or 'Prototype Express Carrier'
    txn.tracking_number = txn.tracking_number or f'TRACK-SIM-{txn.id}88'

    record_transaction_history(
        txn=txn,
        event='SIMULATED_DELIVERY',
        actor=user,
        previous_state=prev_status,
        new_state='DELIVERED',
        details='Simulated delivery completion for Phase 4 prototype testing.'
    )

    emit_transaction_notification(
        txn=txn,
        event_name='delivered',
        recipient_id=txn.buyer_id,
        title='Produce Delivered (Prototype Simulation)',
        message=f'{txn.crop} arrived at destination hub. Please inspect produce and confirm receipt.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Logistics simulation: Transaction {txn.transaction_ref} is now DELIVERED.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/settle', methods=['POST'])
@jwt_required
def settle_transaction(txn_id):
    """
    Settles transaction when all conditions are met:
    1. Advance exists (ESCROW_HELD or RELEASED)
    2. Balance exists (ESCROW_HELD)
    3. Delivery is confirmed
    4. No unresolved dispute
    """
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    if user.id not in (txn.buyer_id, txn.seller_id) and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Unauthorized to settle this transaction.'}), 403

    # Condition 4: No unresolved dispute
    if normalize_status(txn.status) == 'DISPUTED' or txn.dispute_id:
        return jsonify({
            'success': False,
            'error': 'Dispute Blocking Settlement',
            'message': 'Cannot settle transaction while an active dispute is unresolved.'
        }), 400

    # Condition 3: Delivery confirmed
    if not txn.delivery_confirmed_at and normalize_status(txn.status) not in ['BUYER_CONFIRMED', 'BALANCE_ESCROW_HELD']:
        return jsonify({
            'success': False,
            'error': 'Delivery Not Confirmed',
            'message': 'Settlement requires verified delivery confirmation by buyer.'
        }), 400

    # Condition 1: Advance payment exists
    advance_record = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').first()
    if not advance_record or advance_record.status not in ['ESCROW_HELD', 'RELEASED', 'SETTLED']:
        return jsonify({
            'success': False,
            'error': 'Advance Missing',
            'message': 'Settlement requires advance payment deposited in escrow.'
        }), 400

    # Condition 2: Balance payment exists
    balance_record = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='BALANCE').first()
    if not balance_record or balance_record.status not in ['ESCROW_HELD', 'RELEASED', 'SETTLED']:
        return jsonify({
            'success': False,
            'error': 'Balance Missing',
            'message': 'Settlement requires balance payment deposited in escrow.'
        }), 400

    now = datetime.utcnow()

    # Release advance
    advance_record.status = 'RELEASED'
    advance_record.escrow_status = 'RELEASED_TO_SELLER'
    advance_record.settled_at = now

    # Release balance
    balance_record.status = 'RELEASED'
    balance_record.escrow_status = 'RELEASED_TO_SELLER'
    balance_record.settled_at = now

    prev_status = txn.status
    txn.status = 'COMPLETED'
    txn.settled_at = now
    txn.completed_at = now

    # Mark crop lot as SOLD if applicable
    if txn.crop_lot:
        txn.crop_lot.status = 'SOLD'

    # Audit history
    record_transaction_history(
        txn=txn,
        event='SETTLED',
        actor=user,
        previous_state=prev_status,
        new_state='SETTLED',
        details=f'Prototype Escrow released: Advance (₹{advance_record.amount:.2f}) and Balance (₹{balance_record.amount:.2f}) settled to seller.'
    )
    record_transaction_history(
        txn=txn,
        event='COMPLETED',
        actor=user,
        previous_state='SETTLED',
        new_state='COMPLETED',
        details='Contract fulfillment concluded successfully.'
    )

    # Notifications
    emit_transaction_notification(
        txn=txn,
        event_name='settled',
        recipient_id=txn.seller_id,
        title='Prototype Escrow Settled',
        message=f'Total payment of ₹{txn.total_amount:,.2f} released from Prototype Escrow to your registered account.'
    )
    emit_transaction_notification(
        txn=txn,
        event_name='completed',
        recipient_id=txn.buyer_id,
        title='Contract Completed',
        message=f'Contract {txn.transaction_ref} for {txn.quantity} {txn.unit} of {txn.crop} completed successfully.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transaction {txn.transaction_ref} settled and completed successfully.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/cancel', methods=['POST'])
@jwt_required
def cancel_transaction(txn_id):
    """Cancels transaction. If advance was held, triggers refund ledger record."""
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    if user.id not in (txn.buyer_id, txn.seller_id) and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Unauthorized to cancel this transaction.'}), 403

    if normalize_status(txn.status) in ['COMPLETED', 'CANCELLED', 'REFUNDED']:
        return jsonify({'success': False, 'error': f'Transaction is already in terminal state {txn.status}.'}), 400

    now = datetime.utcnow()
    prev_status = txn.status

    # Check if advance payment was already held
    advance_record = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').first()
    has_advance_held = advance_record and advance_record.status in ['ESCROW_HELD', 'RELEASED', 'SETTLED']

    if has_advance_held:
        # Post-advance cancellation: preserve financial records and create REFUND entry
        refund_record = PaymentRecord(
            payment_ref=f'REFUND-{txn.transaction_ref}',
            transaction_id=txn.id,
            payer_id=txn.seller_id,
            payee_id=txn.buyer_id,
            amount=advance_record.amount,
            stage='REFUND',
            status='REFUNDED',
            escrow_status='REFUNDED_TO_BUYER',
            payment_method='SIMULATED_ESCROW_REFUND',
            reference_number=f'REF/SIM/{now.strftime("%Y%m%d")}/{txn.id}',
            govt_audit_notes='Prototype refund processed following transaction cancellation.',
            settled_at=now
        )
        db.session.add(refund_record)
        txn.status = 'REFUNDED'
        txn.cancelled_at = now

        record_transaction_history(
            txn=txn,
            event='CANCELLED_WITH_REFUND',
            actor=user,
            previous_state=prev_status,
            new_state='REFUNDED',
            details=f'Post-advance cancellation by {user.name or user.role}. Refund of ₹{advance_record.amount:.2f} credited to buyer.'
        )
        emit_transaction_notification(
            txn=txn,
            event_name='refunded',
            recipient_id=txn.buyer_id,
            title='Prototype Refund Processed',
            message=f'₹{advance_record.amount:,.2f} refunded to your simulated escrow wallet.'
        )
    else:
        # Pre-advance cancellation
        txn.status = 'CANCELLED'
        txn.cancelled_at = now
        record_transaction_history(
            txn=txn,
            event='CANCELLED',
            actor=user,
            previous_state=prev_status,
            new_state='CANCELLED',
            details=f'Pre-advance cancellation by {user.name or user.role}. No financial escrow entries created.'
        )

    # Release reserved lot
    if txn.crop_lot and txn.crop_lot.status == 'RESERVED':
        txn.crop_lot.status = 'ACTIVE'

    emit_transaction_notification(
        txn=txn,
        event_name='cancelled',
        recipient_id=txn.seller_id if user.id == txn.buyer_id else txn.buyer_id,
        title='Contract Cancelled',
        message=f'Contract {txn.transaction_ref} was cancelled.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transaction {txn.transaction_ref} has been cancelled.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/dispute', methods=['POST'])
@jwt_required
def dispute_transaction(txn_id):
    """Enters dispute state and links dispute/grievance."""
    txn = Transaction.query.get_or_404(txn_id)
    user = g.current_user

    if user.id not in (txn.buyer_id, txn.seller_id) and user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Unauthorized.'}), 403

    data = request.get_json() or {}
    dispute_id = data.get('dispute_id') or data.get('grievance_id')
    reason = data.get('reason', 'Quality or delivery discrepancy reported.')

    prev_status = txn.status
    txn.status = 'DISPUTED'
    if dispute_id:
        txn.dispute_id = int(dispute_id)

    record_transaction_history(
        txn=txn,
        event='DISPUTED',
        actor=user,
        previous_state=prev_status,
        new_state='DISPUTED',
        details=f'Dispute opened: {reason}. Settlement is locked.'
    )

    emit_transaction_notification(
        txn=txn,
        event_name='disputed',
        recipient_id=txn.seller_id if user.id == txn.buyer_id else txn.buyer_id,
        title='Dispute Flagged on Contract',
        message=f'A dispute has been flagged on {txn.transaction_ref}: {reason}. Settlement is paused.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transaction {txn.transaction_ref} is now marked as DISPUTED. Settlement is paused.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/create', methods=['POST'])
@jwt_required
def create_transaction():
    """Create a new transaction directly or from an agreed offer with strict backend financial calculations."""
    data = request.get_json() or {}

    crop_lot_id = data.get('crop_lot_id')
    buyer_id = data.get('buyer_id')
    seller_id = data.get('seller_id')
    
    try:
        quantity = float(data.get('quantity', 0))
        agreed_price = float(data.get('agreed_price', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Quantity and price must be valid numbers.'}), 400

    if not buyer_id or not seller_id or quantity <= 0 or agreed_price <= 0:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'buyer_id, seller_id, positive quantity, and agreed_price are required.'
        }), 400

    lot = CropLot.query.get(crop_lot_id) if crop_lot_id else None
    offer_id = data.get('offer_id')

    # Calculate financials on backend using Decimal precision — ignore client totals
    advance_pct = float(data.get('advance_percentage', 20.0))
    total_amount, advance_amount, balance_amount = calculate_financials(quantity, agreed_price, advance_pct)

    txn_ref = f'TXN-2026-MH-{datetime.utcnow().strftime("%f")[:4]}'
    commodity_id = lot.commodity_id if (lot and getattr(lot, 'commodity_id', None)) else None

    txn = Transaction(
        transaction_ref=txn_ref,
        crop_lot_id=crop_lot_id,
        commodity_id=commodity_id,
        offer_id=offer_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        crop=lot.crop if lot else data.get('crop', 'Produce'),
        variety=lot.variety if lot else data.get('variety', 'Standard'),
        quantity=quantity,
        unit=lot.unit if lot else data.get('unit', 'kg'),
        agreed_price_per_unit=agreed_price,
        total_amount=total_amount,
        advance_percentage=advance_pct,
        advance_amount=advance_amount,
        balance_amount=balance_amount,
        status='AWAITING_ADVANCE',
        pickup_address=data.get('pickup_address') or (lot.address if lot else 'Farm Gate'),
        pickup_district=data.get('pickup_district') or (lot.district if lot else 'Nashik'),
        pickup_lat=data.get('pickup_lat') or (lot.latitude if lot else None),
        pickup_lng=data.get('pickup_lng') or (lot.longitude if lot else None),
        delivery_address=data.get('delivery_address', 'Buyer Central Depot'),
        delivery_district=data.get('delivery_district', 'Navi Mumbai'),
        notes=data.get('notes', 'Contract created upon offer agreement.')
    )
    db.session.add(txn)
    db.session.flush()

    if lot:
        lot.status = 'RESERVED'

    if offer_id:
        off = Offer.query.get(offer_id)
        if off:
            off.status = 'ACCEPTED'

    record_transaction_history(
        txn=txn,
        event='TRANSACTION_CREATED',
        actor=g.current_user,
        previous_state='OFFER_ACCEPTED',
        new_state='AWAITING_ADVANCE',
        details=f'Transaction {txn_ref} created. Agreed: ₹{agreed_price}/{txn.unit}. Total: ₹{total_amount:.2f}.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Deal confirmed! Transaction {txn_ref} created. Advance of ₹{advance_amount:,.2f} ({advance_pct}%) is pending in Prototype Escrow.',
        'transaction': txn.to_dict()
    }), 201
