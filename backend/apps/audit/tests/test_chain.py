"""
Unit tests for SHA-256 cryptographic audit chain.
"""
from django.test import TestCase
from apps.audit.chain import calculate_payload_hash, calculate_block_hash


class AuditChainUnitTests(TestCase):
    def test_calculate_payload_hash_deterministic(self):
        p1 = {'b': 2, 'a': 1}
        p2 = {'a': 1, 'b': 2}
        self.assertEqual(calculate_payload_hash(p1), calculate_payload_hash(p2))

    def test_calculate_block_hash(self):
        h = calculate_block_hash(
            0,
            '2026-01-01T00:00:00',
            'admin@nbsc.edu.ph',
            'GENESIS',
            '0',
            'dummy_payload_hash',
            '0' * 64
        )
        self.assertEqual(len(h), 64)
        self.assertTrue(all(c in '0123456789abcdef' for c in h))

    def test_block_chain_tamper_detection(self):
        genesis_hash = calculate_block_hash(
            0,
            '2026-01-01T00:00:00',
            'system@nbsc.edu.ph',
            'GENESIS',
            '0',
            calculate_payload_hash({'note': 'genesis'}),
            '0' * 64
        )
        block1_hash = calculate_block_hash(
            1,
            '2026-01-01T01:00:00',
            'admin@nbsc.edu.ph',
            'HIRING_APPOINTED',
            'app_123',
            calculate_payload_hash({'candidate': 'Alice', 'status': 'APPOINTED'}),
            genesis_hash
        )
        self.assertNotEqual(genesis_hash, block1_hash)

        # Altering payload should change hash (tamper evidence)
        tampered_hash = calculate_block_hash(
            1,
            '2026-01-01T01:00:00',
            'admin@nbsc.edu.ph',
            'HIRING_APPOINTED',
            'app_123',
            calculate_payload_hash({'candidate': 'Alice', 'status': 'REJECTED'}),  # altered
            genesis_hash
        )
        self.assertNotEqual(block1_hash, tampered_hash)
