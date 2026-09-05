"""
NBSC PRIME-HRM Intelligence Hub — CLI Audit Chain Verifier
Validates the cryptographic integrity of the SHA-256 audit blockchain from Genesis to Head.
Exits with code 0 on PASS, code 1 on FAIL.
"""
import os
import sys
import json
import argparse
from pathlib import Path

# Setup Django & paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import django
django.setup()

from core.mongo import init_mongo
from apps.audit.chain import verify_chain, ensure_genesis_block
from apps.audit.models import AuditBlock


def run_cli_verification(verbose=False, json_output=False):
    import pymongo.errors

    try:
        init_mongo()
        ensure_genesis_block()
        report = verify_chain()
    except (pymongo.errors.ServerSelectionTimeoutError, pymongo.errors.PyMongoError) as exc:
        err_msg = f"Could not connect to MongoDB server: {exc}"
        if json_output:
            print(json.dumps({'valid': False, 'error': err_msg, 'total_blocks': 0}))
        else:
            print("=" * 70)
            print("  NBSC PRIME-HRM INTELLIGENCE HUB — AUDIT CHAIN VERIFIER")
            print("=" * 70)
            print(f"  ❌ Database Connection Error: {err_msg}")
            print("  Please verify your MongoDB instance is running or configure MONGODB_URI in .env.")
            print("=" * 70)
        sys.exit(2)

    if json_output:
        print(json.dumps(report, indent=2))
        sys.exit(0 if report.get('valid') else 1)

    print("=" * 70)
    print("  NBSC PRIME-HRM INTELLIGENCE HUB — AUDIT CHAIN INTEGRITY REPORT")
    print("=" * 70)
    print(f"  Total Blocks Mined   : {report.get('total_blocks', 0)}")
    print(f"  Cryptographic Algo   : SHA-256 (Deterministic String Serialization)")
    print(f"  Verification Result  : {'PASS (100% INTACT)' if report.get('valid') else 'FAIL (TAMPERED)'}")
    print(f"  Status Message       : {report.get('message', '')}")
    print("-" * 70)

    if verbose:
        print("\n[VERBOSE AUDIT LEDGER TRAVERSAL]")
        blocks = list(AuditBlock.objects.order_by('index'))
        for b in blocks:
            flag = "✓"
            if not report.get('valid') and report.get('tampered_block_index') == b.index:
                flag = "✗ [CORRUPT]"
            print(f"  [{flag}] Block #{b.index:<3} | {b.action:<20} | Hash: {b.hash[:16]}... | Prev: {b.prev_hash[:16]}...")

    print("=" * 70)
    if report.get('valid'):
        print("  ✅ All audit blocks cryptographically verified and immutable.\n")
        sys.exit(0)
    else:
        print(f"  ❌ AUDIT FAILURE: Tampering detected at Block #{report.get('tampered_block_index')}!\n")
        sys.exit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="NBSC PRIME-HRM Cryptographic Audit Chain Verifier")
    parser.add_argument('-v', '--verbose', action='store_true', help="Print verbose details of all chain blocks")
    parser.add_argument('--json', action='store_true', help="Output results in raw JSON format")
    args = parser.parse_args()

    run_cli_verification(verbose=args.verbose, json_output=args.json)
