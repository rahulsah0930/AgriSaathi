import json
from datetime import datetime, timezone
from models import db

class Commodity(db.Model):
    __tablename__ = 'commodities'

    id = db.Column(db.Integer, primary_key=True)
    canonical_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(60), nullable=False, index=True)
    sub_category = db.Column(db.String(60), nullable=True)
    english_name = db.Column(db.String(100), nullable=False)
    hindi_name = db.Column(db.String(100), nullable=False)
    marathi_name = db.Column(db.String(100), nullable=False)
    aliases = db.Column(db.Text, nullable=True)  # JSON-encoded array of aliases / Roman transliterations
    transliterations = db.Column(db.Text, nullable=True)  # JSON-encoded alternative phonetic variants
    search_keywords = db.Column(db.Text, nullable=True)  # Flattened search tokens
    image_url = db.Column(db.String(300), nullable=True)
    image_source = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    perishability_class = db.Column(db.String(20), default='MEDIUM', nullable=False)  # 'HIGH', 'MEDIUM', 'LOW'
    default_collection_window_hours = db.Column(db.Float, default=24.0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def get_aliases_list(self):
        """Returns parsed list of aliases."""
        if not self.aliases:
            return []
        try:
            return json.loads(self.aliases)
        except Exception:
            return [a.strip() for a in self.aliases.split(',') if a.strip()]

    def to_dict(self, match_score=None):
        data = {
            'id': self.id,
            'canonical_name': self.canonical_name,
            'english_name': self.english_name,
            'hindi_name': self.hindi_name,
            'marathi_name': self.marathi_name,
            'category': self.category,
            'sub_category': self.sub_category,
            'image_url': self.image_url or '/uploads/commodities/placeholder.svg',
            'image_source': self.image_source,
            'perishability_class': self.perishability_class,
            'default_collection_window_hours': self.default_collection_window_hours,
            'aliases': self.get_aliases_list(),
            'is_active': self.is_active
        }
        if match_score is not None:
            data['match_score'] = round(match_score, 1)
        return data

    def __repr__(self):
        return f"<Commodity #{self.id} {self.canonical_name} ({self.category})>"
