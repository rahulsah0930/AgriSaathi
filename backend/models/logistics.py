from datetime import datetime
from models import db


class TransportOrder(db.Model):
    """
    Logistics & Transport Order model connecting Transaction lifecycle
    from READY_FOR_LOGISTICS to Buyer Physical Confirmation.
    """
    __tablename__ = 'transport_orders'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_ref = db.Column(db.String(50), unique=True, nullable=False, index=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True)
    commodity_id = db.Column(db.Integer, db.ForeignKey('commodities.id', ondelete='SET NULL'), nullable=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Origin / Pickup details
    pickup_address = db.Column(db.String(255), nullable=False)
    pickup_district = db.Column(db.String(100), nullable=True)
    pickup_latitude = db.Column(db.Float, nullable=True)
    pickup_longitude = db.Column(db.Float, nullable=True)

    # Destination / Delivery details
    delivery_address = db.Column(db.String(255), nullable=False)
    delivery_district = db.Column(db.String(100), nullable=True)
    delivery_latitude = db.Column(db.Float, nullable=True)
    delivery_longitude = db.Column(db.Float, nullable=True)

    # Cargo details
    crop_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='KG')

    # Vehicle requirement & Operational Recommendation
    vehicle_type_required = db.Column(db.String(50), default='PICKUP')  # MINI_TRUCK, PICKUP, LCV, TRUCK, REFRIGERATED_VEHICLE
    refrigerated_recommended = db.Column(db.Boolean, default=False)
    refrigeration_note = db.Column(db.String(255), nullable=True)

    # Distance & Cost Estimates
    estimated_distance_km = db.Column(db.Float, nullable=True)
    estimated_transport_cost = db.Column(db.Float, nullable=True)
    cost_status = db.Column(db.String(30), default='ESTIMATED')  # ESTIMATED, PROVIDER_QUOTED, FINAL

    # Assignment & Driver Info
    assigned_provider_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    vehicle_number = db.Column(db.String(50), nullable=True)
    vehicle_type = db.Column(db.String(50), nullable=True)
    driver_name = db.Column(db.String(100), nullable=True)
    driver_phone = db.Column(db.String(20), nullable=True)

    # Milestones & Timestamps
    requested_pickup_at = db.Column(db.DateTime, nullable=True)
    scheduled_pickup_at = db.Column(db.DateTime, nullable=True)
    picked_up_at = db.Column(db.DateTime, nullable=True)
    in_transit_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)

    # Proof of Delivery (POD)
    pod_image_url = db.Column(db.String(255), nullable=True)
    pod_notes = db.Column(db.Text, nullable=True)
    pod_uploaded_at = db.Column(db.DateTime, nullable=True)
    pod_uploaded_by = db.Column(db.Integer, nullable=True)

    # Lifecycle State: REQUESTED, ASSIGNED, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED
    status = db.Column(db.String(50), default='REQUESTED', nullable=False, index=True)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transaction = db.relationship('Transaction', backref=db.backref('logistics_requests', lazy=True, cascade='all, delete-orphan'))
    commodity = db.relationship('Commodity', foreign_keys=[commodity_id])
    seller = db.relationship('User', foreign_keys=[seller_id])
    buyer = db.relationship('User', foreign_keys=[buyer_id])
    assigned_provider = db.relationship('User', foreign_keys=[assigned_provider_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self, current_user=None):
        """
        Serialize model safely. Sensitive driver contact information is only visible
        to relevant transaction participants (Seller, Buyer, Assigned Provider, Admin).
        """
        is_participant_or_admin = False
        if current_user:
            user_id = getattr(current_user, 'id', None)
            user_role = getattr(current_user, 'role', None)
            if user_role == 'ADMIN' or user_id in (self.seller_id, self.buyer_id, self.assigned_provider_id):
                is_participant_or_admin = True

        driver_phone_display = self.driver_phone if is_participant_or_admin else None

        provider_name = None
        if self.assigned_provider:
            provider_name = self.assigned_provider.name
            if self.assigned_provider.logistics_profile and self.assigned_provider.logistics_profile.company_name:
                provider_name = self.assigned_provider.logistics_profile.company_name

        commodity_thumb = None
        if self.commodity:
            commodity_thumb = getattr(self.commodity, 'image_url', None)

        return {
            'id': self.id,
            'order_ref': self.order_ref,
            'transaction_id': self.transaction_id,
            'transaction_ref': self.transaction.transaction_ref if self.transaction else None,
            'commodity_id': self.commodity_id,
            'commodity_thumbnail_url': commodity_thumb,
            'crop_name': self.crop_name,
            'seller_id': self.seller_id,
            'seller_name': self.seller.name if self.seller else None,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.name if self.buyer else None,
            'pickup_address': self.pickup_address,
            'pickup_district': self.pickup_district,
            'pickup_latitude': self.pickup_latitude,
            'pickup_longitude': self.pickup_longitude,
            'delivery_address': self.delivery_address,
            'delivery_district': self.delivery_district,
            'delivery_latitude': self.delivery_latitude,
            'delivery_longitude': self.delivery_longitude,
            'quantity': self.quantity,
            'unit': self.unit,
            'vehicle_type_required': self.vehicle_type_required,
            'refrigerated_recommended': self.refrigerated_recommended,
            'refrigeration_note': self.refrigeration_note,
            'estimated_distance_km': self.estimated_distance_km,
            'estimated_transport_cost': self.estimated_transport_cost,
            'cost_status': self.cost_status,
            'assigned_provider_id': self.assigned_provider_id,
            'provider_name': provider_name,
            'vehicle_number': self.vehicle_number,
            'vehicle_type': self.vehicle_type,
            'driver_name': self.driver_name,
            'driver_phone': driver_phone_display,
            'requested_pickup_at': self.requested_pickup_at.isoformat() if self.requested_pickup_at else None,
            'scheduled_pickup_at': self.scheduled_pickup_at.isoformat() if self.scheduled_pickup_at else None,
            'picked_up_at': self.picked_up_at.isoformat() if self.picked_up_at else None,
            'in_transit_at': self.in_transit_at.isoformat() if self.in_transit_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'pod_image_url': self.pod_image_url,
            'pod_notes': self.pod_notes,
            'pod_uploaded_at': self.pod_uploaded_at.isoformat() if self.pod_uploaded_at else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# Model alias for flexible naming conventions across backend
LogisticsRequest = TransportOrder
