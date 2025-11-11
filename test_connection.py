import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Get actual credentials from .env
DATABASE_URL_LOCAL = os.getenv("DATABASE_URL_LOCAL")
DATABASE_URL_PRODUCTION = os.getenv("DATABASE_URL_PRODUCTION")

# Test configurations
CONNECTIONS = {
    "Local (Transaction Pooler IPv4)": DATABASE_URL_LOCAL,
    "Production (Direct Connection IPv6)": DATABASE_URL_PRODUCTION
}

def test_connection(name, url):
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")

    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10}
        )

        with engine.connect() as conn:
            # Test basic query
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]

            # Test response time
            import time
            start = time.time()
            conn.execute(text("SELECT 1"))
            latency = (time.time() - start) * 1000

            print(f"SUCCESS!")
            print(f"   PostgreSQL: {version.split(',')[0]}")
            print(f"   Latency: {latency:.2f}ms")
            return True

    except Exception as e:
        print(f"FAILED!")
        print(f"   Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("\nTesting Supabase Connections\n")

    results = {}
    for name, url in CONNECTIONS.items():
        results[name] = test_connection(name, url)

    print(f"\n{'='*60}")
    print("SUMMARY:")
    print(f"{'='*60}")
    for name, success in results.items():
        status = "Working" if success else "Failed"
        print(f"{name:30} {status}")

    print("\nRecommendation:")
    if results["Local (Transaction Pooler IPv4)"]:
        print("   Use Transaction Pooler for LOCAL development (set ENVIRONMENT=development)")
    if results["Production (Direct Connection IPv6)"]:
        print("   Use Direct Connection for RENDER production (set ENVIRONMENT=production)")