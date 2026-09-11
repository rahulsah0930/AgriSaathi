from models import db
from datetime import datetime, date

class PricePrediction(db.Model):
    __tablename__ = 'price_predictions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop = db.Column(db.String(100), nullable=False)
    market = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    prediction_date = db.Column(db.Date, nullable=False)
    estimated_price = db.Column(db.Float, nullable=False)
    lower_estimate = db.Column(db.Float, nullable=False)
    upper_estimate = db.Column(db.Float, nullable=False)
    confidence_indicator_placeholder = db.Column(db.String(20), default='HIGH') # HIGH, MEDIUM, LOW
    model_type = db.Column(db.String(50), default='SKLEARN_RIDGE_EMA_ENSEMBLE')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'crop': self.crop,
            'market': self.market,
            'district': self.district,
            'prediction_date': self.prediction_date.isoformat() if hasattr(self.prediction_date, 'isoformat') else str(self.prediction_date),
            'estimated_price': round(self.estimated_price, 2),
            'lower_estimate': round(self.lower_estimate, 2),
            'upper_estimate': round(self.upper_estimate, 2),
            'confidence': self.confidence_indicator_placeholder,
            'model_type': self.model_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
