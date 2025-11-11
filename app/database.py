from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

# Setup logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Detect connection type
IS_SUPABASE = "supabase.com" in settings.DATABASE_URL
IS_PRODUCTION = settings.ENVIRONMENT == "production"
IS_POOLER_CONNECTION = "pooler.supabase.com" in settings.DATABASE_URL  # Pooler connection (IPv4)
IS_DIRECT_CONNECTION = "db." in settings.DATABASE_URL and ".supabase.co" in settings.DATABASE_URL  # Direct connection (IPv6)

print(f"Database Configuration:")
print(f"   Environment: {settings.ENVIRONMENT}")
print(f"   Connection Type: {'Direct IPv6' if IS_DIRECT_CONNECTION else 'Pooler IPv4'}")
print(f"   Debug Mode: {settings.DEBUG}")

# Configure engine based on connection type
if IS_DIRECT_CONNECTION:
    # Direct connection (Render production with IPv6)
    print("Using Direct Connection (Optimized for IPv6)")
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,              # More connections for production
        max_overflow=20,           # Allow bursts
        pool_recycle=3600,         # Recycle every hour
        pool_timeout=30,
        echo=settings.DEBUG,
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    )
elif IS_POOLER_CONNECTION:
    # Pooler connection (Local development with IPv4)
    print("Using Pooler Connection (IPv4 Compatible)")
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,               # Moderate pool for pooler
        max_overflow=10,
        pool_recycle=300,          # Recycle more frequently
        pool_timeout=30,
        echo=settings.DEBUG,
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=30000"
        }
    )
else:
    # Fallback (local PostgreSQL)
    print("Using Local PostgreSQL")
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """Test database connection on startup"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"Database connection successful!")
            print(f"   PostgreSQL: {version.split(',')[0]}")
            return True
    except Exception as e:
        print(f"Database connection failed!")
        print(f"   Error: {str(e)}")
        return False