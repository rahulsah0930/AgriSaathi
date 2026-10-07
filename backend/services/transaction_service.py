from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from models import db
from models.transaction import Transaction, TransactionHistory
from models.payment import PaymentRecord
from models.notification import Notification, emit_idempotent_notification

CANONICAL_STATES = [
    'OFFER_ACCEPTED',
    'AWAITING_ADVANCE',
    'ADVANCE_ESCROW_HELD',
    'READY_FOR_LOGISTICS',
    'IN_DELIVERY',
    'DELIVERED',
    'BUYER_CONFIRMED',
    'BALANCE_ESCROW_HELD',
    'SETTLED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
    'REFUND_PENDING',
    'REFUNDED'
]

STATE_ALIASES = {
    'DEAL_CONFIRMED': 'OFFER_ACCEPTED',
    'ADVANCE_PENDING': 'AWAITING_ADVANCE',
    'ADVANCE_PAID': 'ADVANCE_ESCROW_HELD',
    'PREPARING': 'READY_FOR_LOGISTICS',
    'READY_FOR_PICKUP': 'READY_FOR_LOGISTICS',
    'IN_TRANSIT': 'IN_DELIVERY'
}

LEGAL_TRANSITIONS = {
    'OFFER_ACCEPTED': ['AWAITING_ADVANCE', 'CANCELLED'],
    'AWAITING_ADVANCE': ['ADVANCE_ESCROW_HELD', 'READY_FOR_LOGISTICS', 'CANCELLED'],
    'ADVANCE_ESCROW_HELD': ['READY_FOR_LOGISTICS', 'IN_DELIVERY', 'CANCELLED', 'REFUND_PENDING', 'DISPUTED'],
    'READY_FOR_LOGISTICS': ['IN_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'DISPUTED'],
    'IN_DELIVERY': ['DELIVERED', 'DISPUTED'],
    'DELIVERED': ['BUYER_CONFIRMED', 'DISPUTED'],
    'BUYER_CONFIRMED': ['BALANCE_ESCROW_HELD', 'SETTLED', 'COMPLETED', 'DISPUTED'],
    'BALANCE_ESCROW_HELD': ['SETTLED', 'COMPLETED', 'DISPUTED'],
    'SETTLED': ['COMPLETED'],
    'COMPLETED': [],
    'DISPUTED': ['REFUND_PENDING', 'READY_FOR_LOGISTICS', 'IN_DELIVERY', 'DELIVERED', 'BUYER_CONFIRMED', 'BALANCE_ESCROW_HELD', 'SETTLED', 'COMPLETED', 'CANCELLED'],
    'REFUND_PENDING': ['REFUNDED', 'CANCELLED'],
    'REFUNDED': [],
    'CANCELLED': []
}

def normalize_status(status_str):
    if not status_str:
        return 'AWAITING_ADVANCE'
    s = str(status_str).strip().upper()
    return STATE_ALIASES.get(s, s)

def calculate_financials(quantity, price_per_unit, advance_percentage=20.0):
    """
    Financial calculation with fixed-point Decimal precision (2 decimal places).
    Returns (total_amount, advance_amount, balance_amount) as floats.
    """
    q = Decimal(str(quantity))
    p = Decimal(str(price_per_unit))
    pct = Decimal(str(advance_percentage))

    total = (q * p).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    advance = (total * (pct / Decimal('100'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    balance = (total - advance).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return float(total), float(advance), float(balance)

def validate_transition(current_status, target_status):
    """
    Validates whether transition from current_status to target_status is legal.
    Returns (is_valid, error_message).
    """
    curr = normalize_status(current_status)
    tgt = normalize_status(target_status)

    if curr == tgt:
        return True, None

    allowed = LEGAL_TRANSITIONS.get(curr, [])
    if tgt not in allowed:
        return False, f"Invalid transition from {curr} to {tgt}. Allowed next states: {', '.join(allowed) if allowed else 'None (Terminal state)'}."

    return True, None

def record_transaction_history(txn, event, actor=None, actor_role=None, previous_state=None, new_state=None, details=None):
    """
    Appends an immutable audit event to the transaction history ledger.
    """
    actor_id = actor.id if hasattr(actor, 'id') else (actor if isinstance(actor, int) else None)
    if not actor_role and hasattr(actor, 'role'):
        actor_role = actor.role

    entry = TransactionHistory(
        transaction_id=txn.id,
        event=event,
        actor_id=actor_id,
        actor_role=actor_role or 'SYSTEM',
        previous_state=previous_state or txn.status,
        new_state=new_state or txn.status,
        details=details or f"Event {event} recorded.",
        created_at=datetime.utcnow()
    )
    db.session.add(entry)
    return entry

def emit_transaction_notification(txn, event_name, recipient_id, title, message, event_type='PAYMENT'):
    """
    Emits a strictly idempotent notification for transaction milestones.
    Key format: transaction:<txn_id>:<event_name>:<recipient_id>
    """
    event_key = f"transaction:{txn.id}:{event_name}:{recipient_id}"
    return emit_idempotent_notification(
        event_key=event_key,
        recipient_user_id=recipient_id,
        title=title,
        message=message,
        notif_type=event_type
    )
