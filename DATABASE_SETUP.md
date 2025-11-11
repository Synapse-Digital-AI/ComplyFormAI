# Database Connection Setup

This document explains how to work with both local (IPv4) and production (IPv6) database connections without needing to debug every time you restart VS Code.

## Overview

The application supports two database connection modes:

1. **Local Development** (IPv4 - Session Pooler)
   - For working on your local machine
   - Uses Supabase Session Pooler which supports IPv4
   - Automatically used when `ENVIRONMENT=development`

2. **Production Deployment** (IPv6 - Direct Connection)
   - For deploying to Render.com
   - Uses direct connection which requires IPv6
   - Automatically used when `ENVIRONMENT=production`

## Configuration

All database settings are stored in the `.env` file:

```env
# Environment: development (local) or production (render)
ENVIRONMENT=development

# Local Development - Session Pooler (IPv4 Compatible)
DATABASE_URL_LOCAL=postgresql://postgres.lfizixmiqrspdskubdyj:sgnAdmin11%24%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Production - Direct Connection (IPv6 Required)
DATABASE_URL_PRODUCTION=postgresql://postgres:sgnAdmin11%24%24@db.lfizixmiqrspdskubdyj.supabase.co:5432/postgres
```

## How It Works

The application automatically selects the correct database URL based on the `ENVIRONMENT` variable:

- `ENVIRONMENT=development` → Uses `DATABASE_URL_LOCAL` (IPv4 Pooler)
- `ENVIRONMENT=production` → Uses `DATABASE_URL_PRODUCTION` (IPv6 Direct)

This is handled automatically in [app/config.py](app/config.py):

```python
@property
def DATABASE_URL(self) -> str:
    """Automatically switch between local and production based on ENVIRONMENT"""
    if self.ENVIRONMENT == "production":
        return self.DATABASE_URL_PRODUCTION
    return self.DATABASE_URL_LOCAL
```

## Switching Between Environments

### For Local Development (Default)

Keep `ENVIRONMENT=development` in your `.env` file. This is the default and will use the IPv4-compatible pooler connection.

```env
ENVIRONMENT=development
```

### For Production Deployment (Render.com)

When deploying to Render.com, set the environment variable:

```env
ENVIRONMENT=production
```

Or in Render.com dashboard:
- Go to your service → Environment
- Add: `ENVIRONMENT` = `production`

## Testing Connections

Run the test script to verify both connections:

```bash
python test_connection.py
```

**Expected Result (on local machine):**
```
Testing Supabase Connections

============================================================
Testing: Local (Transaction Pooler IPv4)
============================================================
SUCCESS!
   PostgreSQL: PostgreSQL 17.6 on aarch64-unknown-linux-gnu
   Latency: 196.31ms

============================================================
Testing: Production (Direct Connection IPv6)
============================================================
FAILED!
   Error: could not translate host name "db.lfizixmiqrspdskubdyj.supabase.co" to address: No such host is known.
```

**Note:** It's normal for the production (IPv6) connection to fail on local machines that don't support IPv6. This connection will work when deployed to Render.com.

## Connection Details

### Local (IPv4 - Session Pooler)
- **Host:** `aws-1-us-east-1.pooler.supabase.com`
- **Port:** `5432`
- **Username:** `postgres.lfizixmiqrspdskubdyj`
- **Compatible with:** Windows, macOS, Linux (IPv4 only)
- **Best for:** Local development

### Production (IPv6 - Direct Connection)
- **Host:** `db.lfizixmiqrspdskubdyj.supabase.co`
- **Port:** `5432`
- **Username:** `postgres`
- **Requires:** IPv6 support
- **Best for:** Cloud deployment (Render.com, Railway, etc.)

## Troubleshooting

### Connection Fails on Local Machine

If the local connection fails:

1. Check that `ENVIRONMENT=development` in `.env`
2. Verify your password is URL-encoded (`$$` → `%24%24`)
3. Check your Supabase project is active
4. Verify the project reference: `lfizixmiqrspdskubdyj`

### Connection Fails on Render.com

If the production connection fails on Render:

1. Ensure `ENVIRONMENT=production` is set in Render environment variables
2. Verify Render has IPv6 enabled (it should by default)
3. Check all environment variables are correctly set

### Password Encoding

The password `sgnAdmin11$$` must be URL-encoded as `sgnAdmin11%24%24` in connection strings because `$` is a special character in URLs.

## File Structure

- [.env](.env) - Environment variables (git-ignored)
- [app/config.py](app/config.py) - Configuration management with auto-switching
- [app/database.py](app/database.py) - Database engine setup with optimized pooling
- [test_connection.py](test_connection.py) - Connection testing script

## Security Notes

- Never commit `.env` file to version control
- Keep your database password secure
- Use environment variables for production deployments
- The `.env` file is already in `.gitignore`

## Summary

You now have a permanent solution that:

1. Automatically uses IPv4 pooler connection for local development
2. Automatically uses IPv6 direct connection for production deployment
3. Switches between connections based on `ENVIRONMENT` variable
4. Requires no manual intervention after initial setup
5. Works every time you restart VS Code

Just set `ENVIRONMENT=development` for local work and `ENVIRONMENT=production` when deploying to Render.com!
