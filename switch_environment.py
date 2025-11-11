"""
Simple script to switch between development and production environments.
This updates the ENVIRONMENT variable in .env file.

Usage:
    python switch_environment.py development
    python switch_environment.py production
"""

import sys
import os

def switch_environment(env):
    """Switch the ENVIRONMENT variable in .env file"""
    if env not in ['development', 'production']:
        print(f"Error: Invalid environment '{env}'")
        print("Valid options: development, production")
        return False

    env_file = '.env'
    if not os.path.exists(env_file):
        print(f"Error: {env_file} file not found")
        return False

    # Read the current .env file
    with open(env_file, 'r') as f:
        lines = f.readlines()

    # Update the ENVIRONMENT line
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('ENVIRONMENT='):
            lines[i] = f'ENVIRONMENT={env}\n'
            updated = True
            break

    if not updated:
        print("Error: ENVIRONMENT variable not found in .env")
        return False

    # Write back to .env file
    with open(env_file, 'w') as f:
        f.writelines(lines)

    print(f"\nEnvironment switched to: {env}")
    print(f"\nConfiguration:")
    if env == 'development':
        print("  - Connection: IPv4 Session Pooler (aws-1-us-east-1.pooler.supabase.com)")
        print("  - Best for: Local development on your machine")
    else:
        print("  - Connection: IPv6 Direct Connection (db.lfizixmiqrspdskubdyj.supabase.co)")
        print("  - Best for: Production deployment on Render.com")

    print("\nRestart your application to apply changes.")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python switch_environment.py [development|production]")
        print("\nExamples:")
        print("  python switch_environment.py development  # For local work")
        print("  python switch_environment.py production   # For Render deployment")
        sys.exit(1)

    env = sys.argv[1].lower()
    if switch_environment(env):
        sys.exit(0)
    else:
        sys.exit(1)
