from models import db
from datetime import datetime, date

class MarketPrice(db.Model):
    __tablename__ = 'market_prices'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True, default='Standard')
    market_name = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    price_date = db.Column('date', db.Date, nullable=False, default=date.today)
    min_price = db.Column(db.Float, nullable=False)
    max_price = db.Column(db.Float, nullable=False)
    average_price = db.Column(db.Float, nullable=False)
    arrival_volume = db.Column(db.Float, default=0.0) # in quintals
    unit = db.Column(db.String(20), default='kg')
    source_type = db.Column(db.String(20), default='SAMPLE') # MOCK, SAMPLE, HISTORICAL, LIVE
    trend = db.Column(db.String(20), default='STABLE') # UP, DOWN, STABLE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'crop': self.crop,
            'variety': self.variety or 'Standard',
            'market_name': self.market_name,
            'district': self.district,
            'date': self.price_date.isoformat() if hasattr(self.price_date, 'isoformat') else str(self.price_date),
            'min_price': round(self.min_price, 2),
            'max_price': round(self.max_price, 2),
            'average_price': round(self.average_price, 2),
            'arrival_volume': round(self.arrival_volume, 1),
            'unit': self.unit or 'kg',
            'source_type': self.source_type,
            'trend': self.trend or 'STABLE',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
