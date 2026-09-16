# 12D-257 — XIV OS Backend Contract Scaffolds (Python, pure stdlib).
#
# The backend contract layer between a FUTURE FastAPI route layer and the
# offline-team runtime (services/ai). The route layer is a SEPARATE story:
# it needs an authorized `pip install fastapi uvicorn`, and NO dependency is
# installed or claimed here. This module is the fail-closed shape layer the
# routes will call — pure stdlib, no network, no clock, no randomness.
#
# What it enforces (mirroring the TypeScript contracts in
# services/ai/runtime/offline-team/):
#   * EXACT-KEYS-IN-ORDER: every envelope must carry exactly the expected
#     keys, in order. Extra keys, missing keys, or reordered keys refuse.
#   * DIGEST RE-DERIVATION: a packet's packetId is never accepted — it is
#     recomputed from the packet's own declared fields. Any tamper refuses.
#     The canonical serialization mirrors the TypeScript JSON.stringify byte
#     for byte (insertion key order, no whitespace, non-ASCII unescaped), so
#     a digest derived here matches a digest derived in TS (golden-vector
#     tested).
#   * PINNED DECISION SURFACE: kind APPROVAL_REQUIRED, humanDecision
#     REQUIRED — a backend contract can NEVER carry an auto-approval.
#   * LOCAL-ONLY INGEST: the ingest envelope's source is pinned to the local
#     custody stack; anything else refuses.
#   * HONEST FLAGS: humanDecision REQUIRED, learningPromoted False,
#     remoteCalls 0, modelCalls 0, billionUsersProven False.
#
# Disclosed residuals (carried over verbatim):
#   * A verified packet proves the BYTES are intact, not that the content is
#     true — the contract authenticates shape, it does not witness facts.
#   * Possession of this module is not authority: every decision still
#     belongs to the human operator through the custody stack.

import hashlib
import json

STORY_SHELL_CONTRACTS_POLICY = {
    "policyVersion": "12d-257-v1",
    "domain": "XIV_OS_BACKEND_CONTRACTS",
    "wireDomain": "XIV_OS_STORY_SHELL_WIRE",  # matches TS WIRE_DOMAIN
    "wireVersion": 1,
    "wirePolicyVersion": "12d-241-v1",  # matches TS XIV_OS_WIRE_POLICY
}

STORY_SHELL_CONTRACTS_GUARDRAILS = {
    "verifyBeforeRender": True,
    "exactKeysInOrder": True,
    "digestReDerivedNeverAccepted": True,
    "decisionSurfacePinned": True,
    "localSourcesOnly": True,
    "pureStdlib": True,  # no fastapi/uvicorn in this story — none installed
    "modelCalls": 0,
    "remoteCalls": 0,
    "collectsNothing": True,
    "learningPromoted": False,
    "automaticRecovery": False,
    "billionUsersProven": False,
    "humanDecision": "REQUIRED",
}

# Ordered exactly as the TypeScript VERIFIED_PACKET_KEYS — the order IS the
# contract (an exact-keys-in-order gate, not a set check).
STORY_SHELL_PACKET_KEYS = (
    "schemaVersion", "policyVersion", "packetId", "storyId", "headline",
    "bodyText", "generatedAtMs", "avatar", "decisionSurface", "guardrails",
)
DECISION_SURFACE_KEYS = ("kind", "humanDecision", "decidingOver")
# Ordered exactly as the TypeScript derivePacketDigest serialization.
DIGEST_FIELDS = (
    "storyId", "headline", "bodyText", "generatedAtMs", "avatarId",
    "decidingOver",
)

STORY_ID_RE = r"^[A-Za-z0-9][A-Za-z0-9_.:-]{7,95}$"
_HEX64_CHARS = frozenset("0123456789abcdef")


def _fail(msg: str) -> None:
    raise ValueError(f"{msg}; fail closed")


def _is_hex64(value) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and set(value) <= _HEX64_CHARS
    )


def _has_exact_keys_in_order(obj, keys) -> None:
    """Exact-keys-IN-ORDER gate: extra, missing, or reordered keys refuse."""
    actual = tuple(obj.keys())
    if actual != tuple(keys):
        _fail(
            "object must have exactly the keys [{}], in order (got {})".format(
                ", ".join(keys), ", ".join(actual)
            )
        )


def _is_safe_int(value) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and (
        -(2 ** 53) < value < 2 ** 53
    )


def _is_text(value, lo: int, hi: int) -> bool:
    return isinstance(value, str) and lo <= len(value) <= hi


def _canonicalize_digest_fields(fields) -> dict:
    """The canonical digest payload in the TypeScript insertion order, with
    JSON.stringify byte semantics (no whitespace, non-ASCII unescaped)."""
    ordered = {
        "domain": STORY_SHELL_CONTRACTS_POLICY["wireDomain"],
        "wireVersion": STORY_SHELL_CONTRACTS_POLICY["wireVersion"],
        "storyId": fields["storyId"],
        "headline": fields["headline"],
        "bodyText": fields["bodyText"],
        "generatedAtMs": fields["generatedAtMs"],
        "avatarId": fields["avatarId"],
        "decidingOver": fields["decidingOver"],
    }
    return json_bytes(ordered)


def json_bytes(ordered: dict) -> bytes:
    """JSON.stringify byte semantics: separators without whitespace and
    ensure_ascii=False (TS does not escape non-ASCII)."""
    return json.dumps(ordered, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def derive_packet_digest(fields: dict) -> str:
    """sha256 over the canonical digest payload — byte-compatible with the
    TypeScript derivePacketDigest for identical field values."""
    if not isinstance(fields, dict):
        _fail("digest fields must be one object")
    _has_exact_keys_in_order(fields, DIGEST_FIELDS)
    if not _is_text(fields["storyId"], 8, 96) or not re_match(STORY_ID_RE, fields["storyId"]):
        _fail("storyId must match the 12D-242 storyId pattern")
    if not _is_text(fields["headline"], 8, 256):
        _fail("headline must be a string of 8..256 chars")
    if not _is_text(fields["bodyText"], 1, 8192):
        _fail("bodyText must be a string of 1..8192 chars")
    if not _is_safe_int(fields["generatedAtMs"]):
        _fail("generatedAtMs must be a safe integer")
    if fields["avatarId"] is not None and not _is_hex64(fields["avatarId"]):
        _fail("avatarId must be null or lowercase hex64")
    if not _is_text(fields["decidingOver"], 8, 512):
        _fail("decidingOver must be a string of 8..512 chars")
    canonical = _canonicalize_digest_fields(fields)
    return hashlib.sha256(canonical).hexdigest()


def re_match(pattern: str, value: str) -> bool:
    import re
    return re.match(pattern, value) is not None


def verify_story_shell_packet(packet: dict) -> str:
    """Verify a packet received over the wire (either direction). The digest
    re-derives from the packet's OWN declared fields; any tamper refuses.
    Returns the verified packetId. Raises ValueError on ANY anomaly."""
    if not isinstance(packet, dict):
        _fail("a story-shell packet object is required")
    _has_exact_keys_in_order(packet, STORY_SHELL_PACKET_KEYS)
    if packet["schemaVersion"] != 1:
        _fail("unknown story-shell wire version")
    if packet["policyVersion"] != STORY_SHELL_CONTRACTS_POLICY["wirePolicyVersion"]:
        _fail("unknown story-shell wire policy version")
    if not _is_hex64(packet["packetId"]):
        _fail("packetId must be lowercase hex64")
    # The pinned decision surface — the backend can NEVER soften it.
    if not isinstance(packet["decisionSurface"], dict):
        _fail("a story-shell packet carries a decisionSurface object")
    _has_exact_keys_in_order(packet["decisionSurface"], DECISION_SURFACE_KEYS)
    surface = packet["decisionSurface"]
    if surface["kind"] != "APPROVAL_REQUIRED" or surface["humanDecision"] != "REQUIRED":
        _fail("the decision surface is pinned to humanDecision 'REQUIRED' over APPROVAL_REQUIRED")
    if not _is_text(surface["decidingOver"], 8, 512):
        _fail("decidingOver must be a string of 8..512 chars")
    # avatar: None or a dict carrying an avatarId (shape-gated lightly here;
    # the full avatar identity contract stays in the TS runtime).
    if packet["avatar"] is not None:
        if not isinstance(packet["avatar"], dict) or not _is_hex64(packet["avatar"].get("avatarId")):
            _fail("avatar must be null or carry a hex64 avatarId")
    # Digest re-derivation from the packet's OWN declared fields.
    rederived = derive_packet_digest({
        "storyId": packet["storyId"],
        "headline": packet["headline"],
        "bodyText": packet["bodyText"],
        "generatedAtMs": packet["generatedAtMs"],
        "avatarId": None if packet["avatar"] is None else packet["avatar"]["avatarId"],
        "decidingOver": packet["decisionSurface"]["decidingOver"],
    })
    if rederived != packet["packetId"]:
        _fail("story-shell packet digest mismatch — tampered in flight")
    return packet["packetId"]


def STORY_SHELL_CONTRACTS_PACKET_KEYS():
    return STORY_SHELL_PACKET_KEYS


def verify_ingest_envelope(envelope: dict) -> dict:
    """The backend ingest scaffold: an envelope handed to the FUTURE FastAPI
    route layer must be an exact-key local-plane object carrying a packet
    that fully verifies. source is pinned to the local custody stack — a
    remote source refuses. Returns the verified packetId."""
    if not isinstance(envelope, dict):
        _fail("an ingest envelope object is required")
    _has_exact_keys_in_order(envelope, ("packet", "source", "receivedAtMs"))
    if envelope["source"] != "local-custody-stack":
        _fail("ingest source must be the local custody stack — remote sources refuse")
    if not _is_safe_int(envelope["receivedAtMs"]):
        _fail("receivedAtMs must be a safe integer")
    packet_id = verify_story_shell_packet(envelope["packet"])
    return {"ok": True, "packetId": packet_id}