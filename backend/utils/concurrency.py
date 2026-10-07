from models import db

def is_row_locking_supported():
    """
    Checks if the active SQLAlchemy engine supports SELECT ... FOR UPDATE.
    PostgreSQL and MySQL support row-level locks, whereas SQLite does not.
    """
    try:
        bind = db.session.get_bind()
        if bind and bind.dialect.name == 'sqlite':
            return False
        return True
    except Exception:
        return False

def lock_for_update_if_supported(query):
    """
    Applies .with_for_update() to a SQLAlchemy query if running on PostgreSQL/MySQL.
    Gracefully avoids applying it on SQLite to prevent syntax errors.
    """
    if is_row_locking_supported():
        return query.with_for_update()
    return query

def get_with_lock(model_cls, ident):
    """
    Retrieves a single model instance by primary key with row-level lock
    on PostgreSQL/MySQL, or standard get/filter on SQLite.
    """
    q = model_cls.query.filter_by(id=ident)
    if is_row_locking_supported():
        q = q.with_for_update()
    return q.first()
