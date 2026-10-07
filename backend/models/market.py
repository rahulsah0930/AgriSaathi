from models import db
from datetime import datetime, date

class MarketPrice(db.Model):
    __tablename__ = 'market_prices'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop = db.Column(db.String(100), nullable=False)
    commodity_id = db.Column(db.Integer, nullable=True)
    variety = db.Column(db.String(100), nullable=True, default='Standard')
    market_name = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    price_date = db.Column('date', db.Date, nullable=False, default=date.today)
    min_price = db.Column(db.Float, nullable=False)
    max_price = db.Column(db.Float, nullable=False)
    average_price = db.Column(db.Float, nullable=False)
    arrival_volume = db.Column(db.Float, default=0.0) # in quintals
    unit = db.Column(db.String(20), default='kg')
    source_type = db.Column(db.String(20), default='HISTORICAL') # LIVE, HISTORICAL, SAMPLE, SYNTHETIC
    source_name = db.Column(db.String(150), nullable=True, default='Maharashtra APMC Bulletin (Historical)')
    trend = db.Column(db.String(20), default='STABLE') # UP, DOWN, STABLE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        s_date = self.price_date.isoformat() if hasattr(self.price_date, 'isoformat') else str(self.price_date)
        s_type = self.source_type or 'HISTORICAL'
        s_name = self.source_name or ('Maharashtra APMC Bulletin (Historical)' if s_type == 'HISTORICAL' else 'Sample Demonstration Feed')

        return {
            'id': self.id,
            'crop': self.crop,
            'commodity_id': self.commodity_id,
            'variety': self.variety or 'Standard',
            'market_name': self.market_name,
            'district': self.district,
            'date': s_date,
            'source_date': s_date,
            'source_type': s_type,
            'source_name': s_name,
            'min_price': round(self.min_price, 2) if self.min_price is not None else None,
            'max_price': round(self.max_price, 2) if self.max_price is not None else None,
            'average_price': round(self.average_price, 2) if self.average_price is not None else None,
            'modal_price': round(self.average_price, 2) if self.average_price is not None else None,
            'arrival_volume': round(self.arrival_volume, 1) if self.arrival_volume is not None else None,
            'unit': self.unit or 'kg',
            'trend': self.trend or 'STABLE',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
