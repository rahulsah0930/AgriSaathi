from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import models to ensure they are registered with SQLAlchemy metadata
from .user import User, FarmerProfile, FPOProfile, BuyerProfile, WarehouseProfile
from .lot import CropLot, CropLotImage, FPOLotMember, QualityReport
from .offer import Offer, NegotiationHistory
from .transaction import Transaction
from .payment import PaymentRecord
from .grievance import Grievance
from .storage import Warehouse, StorageBooking
from .market import MarketPrice
from .prediction import PricePrediction
from .notification import Notification
