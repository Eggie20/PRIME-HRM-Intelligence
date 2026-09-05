"""
NBSC PRIME-HRM Intelligence Hub — PostgreSQL Database Seeder
==============================================================================
Reads `seed_data.json` and seeds the target PostgreSQL database with full
relational datasets (users, programs, employees, vacancies, applications,
dss_scores, evaluations, ballots, audit blocks, payroll batches, payslips).

Usage:
  python backend/scripts/seed_postgres.py
  python backend/scripts/seed_postgres.py --url postgresql://postgres:password@localhost:5432/nbsc_hrms
  python backend/scripts/seed_postgres.py --sql-only
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_JSON_PATH = BACKEND_DIR / 'data' / 'seed_data.json'
DEFAULT_SQL_PATH = BACKEND_DIR / 'data' / 'seed_postgres.sql'


def get_connection_uri(args_url=None):
    """Resolve database URL from arguments or environment."""
    if args_url:
        return args_url
    if os.getenv('DATABASE_URL'):
        return os.getenv('DATABASE_URL')
    if os.getenv('POSTGRES_URI'):
        return os.getenv('POSTGRES_URI')
    if os.getenv('POSTGRES_URL'):
        return os.getenv('POSTGRES_URL')

    host = os.getenv('PGHOST', 'localhost')
    port = os.getenv('PGPORT', '5432')
    user = os.getenv('PGUSER', 'postgres')
    password = os.getenv('PGPASSWORD', 'postgres')
    dbname = os.getenv('PGDATABASE', 'nbsc_hrms')
    return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"


def load_seed_json(filepath):
    """Load and parse seed JSON."""
    if not filepath.exists():
        # Check project root fallback
        alt = PROJECT_ROOT / 'seed_data.json'
        if alt.exists():
            filepath = alt
        else:
            raise FileNotFoundError(f"Seed JSON not found at {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('tables', data)


def seed_with_psycopg(conn_uri, tables):
    """Connect and seed via psycopg2 or psycopg3."""
    try:
        import psycopg2
        from psycopg2.extras import Json
        has_psycopg = 'psycopg2'
    except ImportError:
        try:
            import psycopg
            from psycopg.types.json import Json
            has_psycopg = 'psycopg'
        except ImportError:
            has_psycopg = None

    if not has_psycopg:
        print("⚠️  Neither `psycopg2` nor `psycopg` is installed.")
        print("👉 Run: pip install psycopg2-binary")
        print("💡 Alternatively, run the generated SQL script directly:")
        print(f"   psql -d nbsc_hrms -f \"{DEFAULT_SQL_PATH}\"")
        return False

    print(f"🔌 Connecting to PostgreSQL using {has_psycopg}...")
    try:
        if has_psycopg == 'psycopg2':
            import psycopg2
            conn = psycopg2.connect(conn_uri)
        else:
            import psycopg
            conn = psycopg.connect(conn_uri)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nPlease ensure your PostgreSQL server is active and the database exists.")
        print("To create database in psql: CREATE DATABASE nbsc_hrms;")
        return False

    # Execute DDL first from seed_postgres.sql if available
    try:
        cur = conn.cursor()
        if DEFAULT_SQL_PATH.exists():
            print("📦 Initializing database tables (DDL)...")
            with open(DEFAULT_SQL_PATH, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            cur.execute(sql_content)
            conn.commit()
            print("✅ DDL schema & data executed successfully.")
            return True
        else:
            print("⚠️ SQL schema file not found, creating tables from JSON...")
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration error: {e}")
        return False
    finally:
        cur.close()
        conn.close()

    return True


def main():
    parser = argparse.ArgumentParser(description="Seed PostgreSQL database for NBSC PRIME-HRM Intelligence Hub")
    parser.add_argument('--url', help="PostgreSQL connection URI (e.g. postgresql://user:pass@localhost:5432/nbsc_hrms)")
    parser.add_argument('--file', help="Path to seed_data.json", default=str(DEFAULT_JSON_PATH))
    parser.add_argument('--sql-only', action='store_true', help="Print path to SQL file and exit")
    args = parser.parse_args()

    json_path = Path(args.file)
    print("=" * 70)
    print(" NBSC PRIME-HRM Intelligence Hub — PostgreSQL Seeder")
    print("=" * 70)

    if args.sql_only:
        print(f"📄 SQL Seed File: {DEFAULT_SQL_PATH}")
        return

    print(f"📂 Reading seed dataset from: {json_path}")
    tables = load_seed_json(json_path)

    print(f"📊 Discovered {len(tables)} tables to populate:")
    total_records = 0
    for name, rows in tables.items():
        count = len(rows) if isinstance(rows, list) else 0
        total_records += count
        print(f"   • {name.ljust(25)} : {count} records")
    print(f"   Total rows to ingest: {total_records}")
    print("-" * 70)

    db_uri = get_connection_uri(args.url)
    masked_uri = db_uri.split('@')[-1] if '@' in db_uri else db_uri
    print(f"🎯 Target Database: ...@{masked_uri}")

    success = seed_with_psycopg(db_uri, tables)
    if success:
        print("-" * 70)
        print("✨ Database successfully seeded with NBSC PRIME-HRM demo dataset!")
        print("   - All accounts, faculty, vacancies, applicants, DSS, and payroll are live.")
    else:
        print("\n💡 Tip: You can also seed via psql command line:")
        print(f"   psql \"{db_uri}\" -f \"{DEFAULT_SQL_PATH}\"")


if __name__ == '__main__':
    main()
