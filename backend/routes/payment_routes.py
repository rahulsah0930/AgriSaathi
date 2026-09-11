from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db
from models.payment import PaymentRecord
from models.transaction import Transaction
from models.notification import Notification

payment_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payment_bp.route('', methods=['GET'])
def list_payments():
    """List payment records for user or transaction."""
    user_id = request.args.get('user_id', type=int)
    txn_id = request.args.get('transaction_id', type=int)

    query = PaymentRecord.query
    if txn_id:
        query = query.filter_by(transaction_id=txn_id)
    elif user_id:
        query = query.filter((PaymentRecord.payer_id == user_id) | (PaymentRecord.payee_id == user_id))

    records = query.order_by(PaymentRecord.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(records),
        'payments': [p.to_dict() for p in records]
    }), 200


@payment_bp.route('/pay-advance', methods=['POST'])
def pay_advance():
    """Simulate buyer depositing advance into Government Escrow."""
    data = request.get_json() or {}
    transaction_id = data.get('transaction_id')
    payment_method = data.get('payment_method', 'UPI_SIMULATED')

    txn = Transaction.query.get_or_404(transaction_id)

    if txn.status not in ['DEAL_CONFIRMED', 'ADVANCE_PENDING']:
        return jsonify({
            'success': False,
            'error': 'Invalid Transaction State',
            'message': f'Advance payment cannot be accepted in {txn.status} status.'
        }), 400

    now = datetime.utcnow()
    ref_num = f'UPI/ESCROW/{now.strftime("%Y%m%d")}/{txn.id}{int(now.timestamp()) % 10000}'
    payment_ref = f'PAY-ADV-{txn.transaction_ref}'

    payment = PaymentRecord(
        payment_ref=payment_ref,
        transaction_id=txn.id,
        payer_id=txn.buyer_id,
        payee_id=txn.seller_id,
        amount=txn.advance_amount,
        stage='ADVANCE',
        status='ESCROW_HELD',
        escrow_status='HELD_BY_GOVT_ESCROW',
        payment_method=payment_method,
        reference_number=ref_num,
        govt_audit_notes=f'₹{txn.advance_amount:,.2f} advance secured in State Agriculture Escrow Vault under Lien Reference {ref_num}.',
        settled_at=now
    )
    db.session.add(payment)

    # Move transaction to ADVANCE_PAID
    txn.status = 'ADVANCE_PAID'

    # Notify Seller
    db.session.add(Notification(
        user_id=txn.seller_id,
        title='Advance Secured by Government Escrow',
        message=f'Buyer deposited ₹{txn.advance_amount:,.2f} into Government Escrow for {txn.transaction_ref}. You can now prepare harvest/crates for transit.',
        type='PAYMENT'
    ))

    # Notify Buyer
    db.session.add(Notification(
        user_id=txn.buyer_id,
        title='Escrow Deposit Receipt Confirmed',
        message=f'₹{txn.advance_amount:,.2f} is held safely in Maharashtra Agritech Escrow Vault. Funds will be released upon your delivery sign-off.',
        type='PAYMENT'
    ))

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Advance payment of ₹{txn.advance_amount:,.2f} successfully deposited into Government Escrow.',
        'transaction': txn.to_dict(),
        'payment': payment.to_dict()
    }), 200
