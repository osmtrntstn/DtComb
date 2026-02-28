# Database Connection Pool Management
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
from app.config import get_settings
from app.utils.logger import log_info, log_error

settings = get_settings()

# Create engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    poolclass=pool.StaticPool,  # Use StaticPool for SQLite
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI routes to get database session
    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database session
    Usage:
        with get_db_context() as db:
            result = db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        log_error(f"Database error: {str(e)}", e)
        raise
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    try:
        # Import all models here to register them
        from app.db.db_models import function_schema, method_schema, parameter_schema

        log_info("Database initialized successfully")
    except Exception as e:
        log_error(f"Failed to initialize database: {str(e)}", e)
        raise

