# Quick Start Guide

## Database Connection Setup - Permanent Solution

Your database is now configured to automatically work in both local development and production without any manual intervention!

## What Was Fixed

1. **Correct connection URLs** with proper password encoding (`%24%24`)
2. **Correct region** for pooler (`aws-1-us-east-1` instead of `aws-0-us-east-1`)
3. **Automatic switching** between local (IPv4) and production (IPv6) based on `ENVIRONMENT` variable
4. **Optimized connection pooling** for each environment type

## How To Use

### For Local Development (Your Current Setup)

Simply work as normal. The application is already configured for local development:

```bash
# Your .env file already has:
ENVIRONMENT=development

# This automatically uses:
# - IPv4-compatible Session Pooler
# - Host: aws-1-us-east-1.pooler.supabase.com
```

**You don't need to change anything!** Every time you restart VS Code or run your app, it will automatically connect to the local pooler.

### For Production Deployment (Render.com)

When deploying to Render.com:

1. Set environment variable in Render dashboard:
   ```
   ENVIRONMENT=production
   ```

2. Or use the switch script before deploying:
   ```bash
   python switch_environment.py production
   ```

The app will automatically use the IPv6 direct connection.

## Testing Your Connection

Run the test script anytime:

```bash
python test_connection.py
```

**Expected output on your local machine:**
```
Local (Transaction Pooler IPv4)    SUCCESS! ✓
Production (Direct Connection IPv6) FAILED (This is normal - IPv6 not available locally)
```

## Files Modified

- [.env](.env) - Contains both connection URLs
- [app/config.py](app/config.py) - Auto-switches based on ENVIRONMENT
- [app/database.py](app/database.py) - Detects and optimizes connection type
- [test_connection.py](test_connection.py) - Tests both connections

## New Files Created

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Detailed documentation
- [switch_environment.py](switch_environment.py) - Environment switching utility
- [QUICK_START.md](QUICK_START.md) - This file

## Summary

Your setup is now permanent and will:

- ✓ Work immediately every time you restart VS Code
- ✓ Use IPv4 pooler for local development automatically
- ✓ Switch to IPv6 direct connection for production automatically
- ✓ No manual debugging needed
- ✓ Just set ENVIRONMENT variable and it works!

**Current Status:** Ready to use! Just run your app and it will connect automatically.

For more details, see [DATABASE_SETUP.md](DATABASE_SETUP.md).
