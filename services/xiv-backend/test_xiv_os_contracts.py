# 12D-257 — adversarial tests for the Python backend contract scaffolds.
# Run: python -m unittest discover -s services/xiv-backend -p "test_*.py"
# Pure stdlib (unittest) — pytest is NOT installed and no install is claimed.

import unittest

from xiv_os_contracts import (
    DECISION_SURFACE_KEYS,
    DIGEST_FIELDS,
    STORY_SHELL_CONTRACTS_GUARDRAILS,
    STORY_SHELL_CONTRACTS_POLICY,
    STORY_SHELL_PACKET_KEYS,
    derive_packet_digest,
    json_bytes,
    verify_ingest_envelope,
    verify_story_shell_packet,
)

# GOLDEN VECTOR — generated from the TypeScript side (node, crypto.sha256
# over JSON.stringify of the digest payload with the TS insertion order).
# The Python contract must reproduce this EXACT digest for identical fields.
GOLDEN_FIELDS = {
    "storyId": "12d-257-python-contract-golden-vector",
    "headline": "Cross-language golden digest vector",
    "bodyText": "The Python backend contract must derive this exact digest.",
    "generatedAtMs": 1000000,
    "avatarId": None,
    "decidingOver": "whether the python contract scaffold matches the ts wire digest",
}
GOLDEN_DIGEST = "e22e2e7def4afbccc5d7c97fb56eec7c70827bd06e6f7941b535c97e314e44e8"

# NON-ASCII GOLDEN VECTOR — the follow-up promised in the 12D-257 handoff:
# TS JSON.stringify does not escape non-ASCII; the Python canonical
# serialization must match (ensure_ascii=False). Generated from the TS side.
NON_ASCII_FIELDS = {
    "storyId": "12d-257-nonascii-golden-vector-x",
    "headline": "Non-ASCII golden digest vector ✓",
    "bodyText": "The Python contract must match TS bytes for non-ASCII too — ünïcødé, 中文, emoji \U0001f525.",
    "generatedAtMs": 1000000,
    "avatarId": None,
    "decidingOver": "whether non-ascii content digests identically across languages",
}
NON_ASCII_DIGEST = "32bb7eb762fd6c82c78f6f192dd6477e6184d35f16614f305add46d3fb895c58"


def make_packet(digest_fields=None, **overrides):
    """A minimal packet that passes verify_story_shell_packet, built over the
    golden fields (so its packetId IS the golden digest unless overridden)."""
    fields = dict(GOLDEN_FIELDS)
    for k, v in overrides.pop("_fields", {}).items():
        fields[k] = v
    packet_id = derive_packet_digest(dict(fields))
    packet = {
        "schemaVersion": 1,
        "policyVersion": STORY_SHELL_CONTRACTS_POLICY["wirePolicyVersion"],
        "packetId": packet_id,
        "storyId": fields["storyId"],
        "headline": fields["headline"],
        "bodyText": fields["bodyText"],
        "generatedAtMs": fields["generatedAtMs"],
        "avatar": None if fields["avatarId"] is None else {"avatarId": fields["avatarId"]},
        "decisionSurface": {
            "kind": "APPROVAL_REQUIRED",
            "humanDecision": "REQUIRED",
            "decidingOver": fields["decidingOver"],
        },
        "guardrails": {"humanDecision": "REQUIRED"},
    }
    for k, v in overrides.items():
        packet[k] = v
    return packet


class TestGoldenVector(unittest.TestCase):
    def test_digest_matches_the_typescript_byte_for_byte(self):
        self.assertEqual(derive_packet_digest(dict(GOLDEN_FIELDS)), GOLDEN_DIGEST)

    def test_canonical_serialization_has_json_stringify_byte_semantics(self):
        ordered = {"a": 1, "b": "x", "c": None}
        self.assertEqual(json_bytes(ordered), b'{"a":1,"b":"x","c":null}')

    def test_field_sensitivity(self):
        changed = dict(GOLDEN_FIELDS)
        changed["bodyText"] = changed["bodyText"] + " One byte different."
        self.assertNotEqual(derive_packet_digest(changed), GOLDEN_DIGEST)

    def test_non_ascii_digest_matches_the_typescript_byte_for_byte(self):
        self.assertEqual(derive_packet_digest(dict(NON_ASCII_FIELDS)), NON_ASCII_DIGEST)


class TestVerifyStoryShellPacket(unittest.TestCase):
    def test_happy_path_returns_the_verified_packet_id(self):
        packet = make_packet()
        self.assertEqual(verify_story_shell_packet(packet), packet["packetId"])

    def test_extra_key_refuses(self):
        packet = make_packet()
        packet["smuggled"] = "free text"
        with self.assertRaisesRegex(ValueError, "exactly the keys"):
            verify_story_shell_packet(packet)

    def test_reordered_keys_refuse(self):
        packet = make_packet()
        reordered = {k: packet[k] for k in reversed(list(packet.keys()))}
        with self.assertRaisesRegex(ValueError, "in order"):
            verify_story_shell_packet(reordered)

    def test_digest_mismatch_refuses(self):
        packet = make_packet()
        packet["packetId"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            verify_story_shell_packet(packet)

    def test_human_decision_flipped_refuses(self):
        packet = make_packet()
        packet["decisionSurface"] = dict(packet["decisionSurface"], humanDecision="OPTIONAL")
        with self.assertRaisesRegex(ValueError, "pinned"):
            verify_story_shell_packet(packet)

    def test_unknown_policy_version_refuses(self):
        packet = make_packet(policyVersion="12d-999-v1")
        with self.assertRaisesRegex(ValueError, "policy version"):
            verify_story_shell_packet(packet)

    def test_non_object_refuses(self):
        for garbage in (None, [], "packet", 42):
            with self.assertRaisesRegex(ValueError, "packet object is required"):
                verify_story_shell_packet(garbage)

    def test_bad_avatar_shape_refuses(self):
        packet = make_packet()
        packet["avatar"] = {"avatarId": "nothex"}
        with self.assertRaisesRegex(ValueError, "avatar"):
            verify_story_shell_packet(packet)


class TestVerifyIngestEnvelope(unittest.TestCase):
    def test_happy_local_envelope_verifies(self):
        packet = make_packet()
        result = verify_ingest_envelope({
            "packet": packet,
            "source": "local-custody-stack",
            "receivedAtMs": 1000000,
        })
        self.assertEqual(result, {"ok": True, "packetId": packet["packetId"]})

    def test_remote_source_refuses(self):
        packet = make_packet()
        with self.assertRaisesRegex(ValueError, "remote sources refuse"):
            verify_ingest_envelope({
                "packet": packet,
                "source": "https://evil.example.com",
                "receivedAtMs": 1000000,
            })

    def test_extra_key_refuses(self):
        packet = make_packet()
        with self.assertRaisesRegex(ValueError, "exactly the keys"):
            verify_ingest_envelope({
                "packet": packet,
                "source": "local-custody-stack",
                "receivedAtMs": 1000000,
                "extra": True,
            })


class TestPolicy(unittest.TestCase):
    def test_pinned_constants_match_the_ts_contracts(self):
        self.assertEqual(STORY_SHELL_CONTRACTS_POLICY["wireDomain"], "XIV_OS_STORY_SHELL_WIRE")
        self.assertEqual(STORY_SHELL_CONTRACTS_POLICY["wireVersion"], 1)
        self.assertEqual(STORY_SHELL_CONTRACTS_POLICY["wirePolicyVersion"], "12d-241-v1")
        self.assertEqual(tuple(STORY_SHELL_PACKET_KEYS), (
            "schemaVersion", "policyVersion", "packetId", "storyId", "headline",
            "bodyText", "generatedAtMs", "avatar", "decisionSurface", "guardrails",
        ))
        self.assertEqual(tuple(DECISION_SURFACE_KEYS), ("kind", "humanDecision", "decidingOver"))
        self.assertEqual(tuple(DIGEST_FIELDS), (
            "storyId", "headline", "bodyText", "generatedAtMs", "avatarId", "decidingOver",
        ))

    def test_honest_flags_pinned(self):
        self.assertEqual(STORY_SHELL_CONTRACTS_GUARDRAILS["humanDecision"], "REQUIRED")
        self.assertEqual(STORY_SHELL_CONTRACTS_GUARDRAILS["remoteCalls"], 0)
        self.assertEqual(STORY_SHELL_CONTRACTS_GUARDRAILS["modelCalls"], 0)
        self.assertFalse(STORY_SHELL_CONTRACTS_GUARDRAILS["learningPromoted"])
        self.assertFalse(STORY_SHELL_CONTRACTS_GUARDRAILS["billionUsersProven"])


if __name__ == "__main__":
    unittest.main()