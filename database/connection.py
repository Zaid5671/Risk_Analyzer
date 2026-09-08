import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

def get_db_url() -> str:
    """Retrieves Database URL from environment or constructs from parts."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    # Fallback to individual components
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    db = os.getenv("DB_NAME", "postgres")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")

    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

def get_engine(db_url: str = None, pool_size: int = 10, max_overflow: int = 20):
    """Creates a thread-safe SQLAlchemy engine with connection pooling."""
    if db_url is None:
        db_url = get_db_url()
    
    # Enable connect_args with keepalives for reliable cloud/pooler connections
    connect_args = {
        "connect_timeout": 15,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
    
    return create_engine(
        db_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

_engine = None
_SessionLocal = None

def get_session():
    """Contextual session generator."""
    global _engine, _SessionLocal
    if _engine is None:
        _engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _SessionLocal()

def check_connection() -> bool:
    """Verifies that the database is reachable."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            from sqlalchemy import text
            res = conn.execute(text("SELECT 1;")).scalar()
            return res == 1
    except Exception:
        return False
