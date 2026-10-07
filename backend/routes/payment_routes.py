from flask import Blueprint, request, jsonify, g
from datetime import datetime
from models import db
from models.payment import PaymentRecord
from models.transaction import Transaction
from models.notification import Notification
from utils.auth import jwt_required, role_required
from services.transaction_service import (
    normalize_status,
    record_transaction_history,
    emit_transaction_notification
)

payment_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payment_bp.route('', methods=['GET'])
@jwt_required
def list_payments():
    """List payment records securely scoped for the authenticated user or all for admin."""
    user = g.current_user
    txn_id = request.args.get('transaction_id', type=int)

    query = PaymentRecord.query
    if user.role != 'ADMIN':
        query = query.filter((PaymentRecord.payer_id == user.id) | (PaymentRecord.payee_id == user.id))
    elif request.args.get('user_id'):
        target_user_id = request.args.get('user_id', type=int)
        query = query.filter((PaymentRecord.payer_id == target_user_id) | (PaymentRecord.payee_id == target_user_id))

    if txn_id:
        if user.role != 'ADMIN':
            txn = Transaction.query.get(txn_id)
            if txn and user.id not in (txn.buyer_id, txn.seller_id):
                return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You are not authorized to view payments for this transaction.'}), 403
        query = query.filter_by(transaction_id=txn_id)

    records = query.order_by(PaymentRecord.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(records),
        'payments': [p.to_dict() for p in records]
    }), 200


@payment_bp.route('/pay-advance', methods=['POST'])
@jwt_required
def pay_advance():
    """Deposit advance into Prototype Escrow with idempotency and strict buyer authentication."""
    data = request.get_json() or {}
    transaction_id = data.get('transaction_id')
    payment_method = data.get('payment_method', 'SIMULATED_ESCROW')

    if not transaction_id:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'transaction_id is required.'}), 400

    txn = Transaction.query.get_or_404(transaction_id)
    user = g.current_user

    # 1. Strictly verify authenticated user is transaction buyer
    if user.id != txn.buyer_id and user.role != 'ADMIN':
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Only the designated buyer can pay advance escrow for this transaction.'
        }), 403

    # Reject client attempt to pass zero or negative amount
    if 'amount' in data:
        try:
            client_amt = float(data['amount'])
            if client_amt <= 0:
                return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Payment amount must be greater than zero.'}), 400
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Payment amount must be a valid number.'}), 400

    # 2. Check for duplicate advance payment (Idempotency)
    existing_advance = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').filter(
        PaymentRecord.status.in_(['ESCROW_HELD', 'RELEASED', 'SETTLED'])
    ).first()
    if existing_advance:
        return jsonify({
            'success': False,
            'error': 'Duplicate Advance Payment',
            'message': 'Advance payment has already been deposited into Prototype Escrow for this transaction.',
            'payment': existing_advance.to_dict(),
            'transaction': txn.to_dict()
        }), 409

    # 3. Check transaction state
    curr_status = normalize_status(txn.status)
    if curr_status not in ['AWAITING_ADVANCE', 'OFFER_ACCEPTED', 'ADVANCE_PENDING', 'DEAL_CONFIRMED']:
        return jsonify({
            'success': False,
            'error': 'Invalid Transaction State',
            'message': f'Advance payment cannot be accepted in {txn.status} status.'
        }), 400

    now = datetime.utcnow()
    ref_num = f'SIM/ESCROW/{now.strftime("%Y%m%d")}/{txn.id}{int(now.timestamp()) % 10000}'
    payment_ref = f'PAY-ADV-{txn.transaction_ref}'

    payment = PaymentRecord(
        payment_ref=payment_ref,
        transaction_id=txn.id,
        payer_id=txn.buyer_id,
        payee_id=txn.seller_id,
        amount=txn.advance_amount,
        stage='ADVANCE',
        status='ESCROW_HELD',
        escrow_status='HELD_IN_SIMULATED_ESCROW',
        payment_method=payment_method,
        reference_number=ref_num,
        govt_audit_notes=f'Prototype Escrow: ₹{txn.advance_amount:,.2f} advance secured under simulated lien reference {ref_num}.',
        settled_at=None
    )
    db.session.add(payment)

    prev_status = txn.status
    txn.status = 'READY_FOR_LOGISTICS'

    record_transaction_history(
        txn=txn,
        event='ADVANCE_ESCROW_HELD',
        actor=user,
        previous_state=prev_status,
        new_state='ADVANCE_ESCROW_HELD',
        details=f'Advance payment of ₹{txn.advance_amount:,.2f} deposited into Prototype Escrow. Order moved to READY_FOR_LOGISTICS.'
    )
    record_transaction_history(
        txn=txn,
        event='READY_FOR_LOGISTICS',
        actor=user,
        previous_state='ADVANCE_ESCROW_HELD',
        new_state='READY_FOR_LOGISTICS',
        details='Order is ready for dispatch and logistics assignment.'
    )

    emit_transaction_notification(
        txn=txn,
        event_name='advance_held',
        recipient_id=txn.seller_id,
        title='Advance Secured in Prototype Escrow',
        message=f'Buyer deposited ₹{txn.advance_amount:,.2f} into Prototype Escrow for {txn.transaction_ref}. Ready for logistics dispatch.'
    )
    emit_transaction_notification(
        txn=txn,
        event_name='advance_held',
        recipient_id=txn.buyer_id,
        title='Prototype Escrow Receipt Confirmed',
        message=f'₹{txn.advance_amount:,.2f} held in Prototype Escrow Vault. Funds will be released upon your delivery sign-off.'
    )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Advance payment of ₹{txn.advance_amount:,.2f} successfully deposited into Prototype Escrow.',
        'transaction': txn.to_dict(),
        'payment': payment.to_dict()
    }), 200


@payment_bp.route('/pay-balance', methods=['POST'])
@jwt_required
def pay_balance():
    """Deposit remaining balance into Prototype Escrow and auto-settle upon satisfaction of conditions."""
    data = request.get_json() or {}
    transaction_id = data.get('transaction_id')
    payment_method = data.get('payment_method', 'SIMULATED_ESCROW')

    if not transaction_id:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'transaction_id is required.'}), 400

    txn = Transaction.query.get_or_404(transaction_id)
    user = g.current_user

    # 1. Strictly verify authenticated user is transaction buyer
    if user.id != txn.buyer_id and user.role != 'ADMIN':
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Only the designated buyer can pay balance escrow for this transaction.'
        }), 403

    # Reject client attempt to pass zero or negative amount
    if 'amount' in data:
        try:
            client_amt = float(data['amount'])
            if client_amt <= 0:
                return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Payment amount must be greater than zero.'}), 400
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Payment amount must be a valid number.'}), 400

    # 2. Check delivery confirmation pre-condition
    curr_status = normalize_status(txn.status)
    if curr_status not in ['BUYER_CONFIRMED', 'BALANCE_ESCROW_HELD'] and not txn.delivery_confirmed_at:
        return jsonify({
            'success': False,
            'error': 'Delivery Not Confirmed',
            'message': 'Balance payment is unavailable before delivery confirmation.'
        }), 400

    # 3. Check for duplicate balance payment (Idempotency)
    existing_balance = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='BALANCE').filter(
        PaymentRecord.status.in_(['ESCROW_HELD', 'RELEASED', 'SETTLED'])
    ).first()
    if existing_balance:
        return jsonify({
            'success': False,
            'error': 'Duplicate Balance Payment',
            'message': 'Balance payment has already been deposited into Prototype Escrow for this transaction.',
            'payment': existing_balance.to_dict(),
            'transaction': txn.to_dict()
        }), 409

    now = datetime.utcnow()
    ref_num = f'SIM/BAL/{now.strftime("%Y%m%d")}/{txn.id}{int(now.timestamp()) % 10000}'
    payment_ref = f'PAY-BAL-{txn.transaction_ref}'

    payment = PaymentRecord(
        payment_ref=payment_ref,
        transaction_id=txn.id,
        payer_id=txn.buyer_id,
        payee_id=txn.seller_id,
        amount=txn.balance_amount,
        stage='BALANCE',
        status='ESCROW_HELD',
        escrow_status='HELD_IN_SIMULATED_ESCROW',
        payment_method=payment_method,
        reference_number=ref_num,
        govt_audit_notes=f'Prototype Escrow: ₹{txn.balance_amount:,.2f} balance secured under simulated reference {ref_num}.',
        settled_at=None
    )
    db.session.add(payment)

    prev_status = txn.status
    txn.status = 'BALANCE_ESCROW_HELD'

    record_transaction_history(
        txn=txn,
        event='BALANCE_ESCROW_HELD',
        actor=user,
        previous_state=prev_status,
        new_state='BALANCE_ESCROW_HELD',
        details=f'Balance payment of ₹{txn.balance_amount:,.2f} deposited into Prototype Escrow.'
    )

    emit_transaction_notification(
        txn=txn,
        event_name='balance_held',
        recipient_id=txn.seller_id,
        title='Balance Payment Secured in Escrow',
        message=f'Buyer deposited balance payment of ₹{txn.balance_amount:,.2f} into Prototype Escrow.'
    )

    # 4. Auto-settle if conditions are satisfied (Delivery confirmed + No dispute)
    advance_record = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').first()
    if advance_record and not txn.dispute_id and normalize_status(txn.status) != 'DISPUTED':
        # Execute settlement
        advance_record.status = 'RELEASED'
        advance_record.escrow_status = 'RELEASED_TO_SELLER'
        advance_record.settled_at = now

        payment.status = 'RELEASED'
        payment.escrow_status = 'RELEASED_TO_SELLER'
        payment.settled_at = now

        txn.status = 'COMPLETED'
        txn.settled_at = now
        txn.completed_at = now

        if txn.crop_lot:
            txn.crop_lot.status = 'SOLD'

        record_transaction_history(
            txn=txn,
            event='SETTLED',
            actor=user,
            previous_state='BALANCE_ESCROW_HELD',
            new_state='SETTLED',
            details=f'Prototype Escrow released: Total ₹{txn.total_amount:,.2f} settled to seller.'
        )
        record_transaction_history(
            txn=txn,
            event='COMPLETED',
            actor=user,
            previous_state='SETTLED',
            new_state='COMPLETED',
            details='Transaction successfully fulfilled and completed.'
        )

        emit_transaction_notification(
            txn=txn,
            event_name='settled',
            recipient_id=txn.seller_id,
            title='Payment Settled to Seller',
            message=f'Buyer confirmed delivery and balance. Total ₹{txn.total_amount:,.2f} released from Prototype Escrow.'
        )
        emit_transaction_notification(
            txn=txn,
            event_name='completed',
            recipient_id=txn.buyer_id,
            title='Contract Completed',
            message=f'Transaction {txn.transaction_ref} concluded successfully. Thank you for using AgriSaathi.'
        )

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Balance payment of ₹{txn.balance_amount:,.2f} deposited into Prototype Escrow and settled.',
        'transaction': txn.to_dict(),
        'payment': payment.to_dict()
    }), 200
