"""initial_production_schema

Revision ID: 874ee9a89149
Revises: 
Create Date: 2026-10-07 17:09:20.193466

"""
from alembic import op
import sqlalchemy as sa
from models import db

# revision identifiers, used by Alembic.
revision = '874ee9a89149'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Applies baseline production schema.
    Ensures all models, indexes, unique constraints, and relationships
    are cleanly instantiated on the target database engine (PostgreSQL or SQLite).
    """
    bind = op.get_bind()
    db.metadata.create_all(bind=bind, checkfirst=True)


def downgrade():
    """
    Downgrades baseline production schema.
    """
    bind = op.get_bind()
    db.metadata.drop_all(bind=bind, checkfirst=True)
