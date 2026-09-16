# 12D-260 — Local LLM Bridge contract (pure stdlib): the fail-closed bridge
# between the XIV OS backend and a LOCAL inference engine (Ollama at
# localhost:11434, authorized by the CEO). The bridge calls ONLY localhost —
# the local plane by definition (no DNS, no internet egress, remoteCalls 0).
# If the local engine is offline, unreachable, slow, or answers anything but
# a well-formed completion, the bridge REFUSES — it NEVER falls back to a
# cloud service. A clean refusal is the product: "the local brain is down"
# is an honest answer, and a silent cloud detour is a security breach.
#
# This module is PURE STDLIB so CI (python:3.12-slim, no pip installs) can
# test the whole contract. The FastAPI/httpx wiring lives in
# xiv_local_llm_bridge_app.py and is imported only at runtime.
#
# Rules, structurally enforced:
#   * LOCALHOST ONLY: every base URL passes is_localhost_base_url — scheme
#     http, host localhost / 127.0.0.1 / [::1]. Anything else refuses at
#     construction time; the bridge cannot even be built pointed outward.
#   * FAIL CLOSED: any transport failure (unreachable, timeout, non-200,
#     malformed payload) yields a REFUSED outcome with the honest reason.
#     No retry storms, no fallback, no auto-recovery.
#   * NO PERSISTENCE: prompts are forwarded to the local engine and
#     discarded — the bridge keeps no history, no logs, no telemetry.
#   * The transport is INJECTED (a callable), so the contract is testable
#     without a live engine and the app wires a real httpx transport.
#
# Disclosed residuals, stated plainly:
#   * The bridge authenticates the CHANNEL, not the model: a locally-running
#     engine that answers confidently is still just a model — its output is
#     a proposal for human review, never a decision.
#   * localhost is trusted transit on this machine only; anything that can
#     read localhost:11434 traffic on this host can observe prompts.
#   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
#     billionUsersProven: false on every surface.

import re
from urllib.parse import urlsplit

LOCAL_LLM_BRIDGE_POLICY = {
    "policyVersion": "12d-260-v1",
    "domain": "XIV_OS_LOCAL_LLM_BRIDGE",
    "engine": "ollama",
    "baseUrl": "http://localhost:11434",
    "generatePath": "/api/generate",
    "versionPath": "/api/version",
    "maxPromptChars": 8192,
    "defaultTimeoutSeconds": 120,
}

LOCAL_LLM_BRIDGE_GUARDRAILS = {
    "localhostOnly": True,          # the bridge refuses to point anywhere else
    "failClosed503": True,          # unreachable/slow/malformed -> refusal, never a detour
    "neverCloudFallback": True,     # there is no cloud path in this module at all
    "noPromptPersistence": True,    # prompts forwarded and discarded
    "localPlaneOnly": True,
    "modelOutputIsProposalOnly": True,  # output is for human review, never a decision
    "remoteCalls": 0,
    "collectsNothing": True,
    "learningPromoted": False,
    "automaticRecovery": False,
    "billionUsersProven": False,
    "humanDecision": "REQUIRED",
}

_MODEL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")
_LOCAL_HOSTS = ("localhost", "127.0.0.1", "::1")


def is_localhost_base_url(url):
    """True only for an http URL whose host is localhost / 127.0.0.1 / ::1."""
    if not isinstance(url, str) or len(url) > 256 or len(url) == 0:
        return False
    try:
        parts = urlsplit(url)
    except ValueError:
        return False
    if parts.scheme != "http":
        return False
    host = (parts.hostname or "").lower()
    # urlsplit strips brackets from [::1]; normalize the comparison.
    return host in _LOCAL_HOSTS


def build_generate_request(prompt, model, timeout_seconds=None):
    """Validate the prompt and model name; return the exact /api/generate body.

    Raises ValueError on any malformed input (fail closed).
    """
    if not isinstance(prompt, str) or len(prompt.strip()) == 0:
        raise ValueError("prompt must be a non-empty string; fail closed")
    if len(prompt) > LOCAL_LLM_BRIDGE_POLICY["maxPromptChars"]:
        raise ValueError(
            "prompt exceeds %d chars; fail closed"
            % LOCAL_LLM_BRIDGE_POLICY["maxPromptChars"]
        )
    if not isinstance(model, str) or not _MODEL_RE.match(model):
        raise ValueError("model must match ^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$; fail closed")
    if timeout_seconds is None:
        timeout_seconds = LOCAL_LLM_BRIDGE_POLICY["defaultTimeoutSeconds"]
    if not isinstance(timeout_seconds, (int, float)) or isinstance(timeout_seconds, bool) \
            or not timeout_seconds > 0 or timeout_seconds > 3600:
        raise ValueError("timeout_seconds must be a positive number <= 3600; fail closed")
    return {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }


def parse_generate_response(payload):
    """Extract the completion text from a well-formed non-streaming Ollama
    response. Raises ValueError on ANY malformed payload (fail closed)."""
    if not isinstance(payload, dict):
        raise ValueError("bridge payload is not an object; fail closed")
    if payload.get("done") is not True:
        raise ValueError("bridge payload is not a completed generation; fail closed")
    text = payload.get("response")
    if not isinstance(text, str):
        raise ValueError("bridge payload carries no response text; fail closed")
    return text


def perform_local_completion(transport, prompt, model, timeout_seconds=None):
    """Run ONE local completion through the injected transport and return a
    frozen outcome. `transport(url_path, body, timeout_seconds)` must return
    `(status:int, payload:dict)` or raise. Any failure yields REFUSED —
    this function never retries, never falls back, never raises.

    Returns:
      {"kind": "COMPLETED", "text": ..., "model": ..., "policyVersion": ...,
       "guardrails": ...}
      {"kind": "REFUSED", "reason": ...}
    """
    try:
        body = build_generate_request(prompt, model, timeout_seconds)
    except ValueError as err:
        return _refused(str(err))
    try:
        status, payload = transport(
            LOCAL_LLM_BRIDGE_POLICY["generatePath"], body, timeout_seconds
            if timeout_seconds is not None
            else LOCAL_LLM_BRIDGE_POLICY["defaultTimeoutSeconds"],
        )
        if not isinstance(status, int) or status != 200:
            return _refused("local engine returned status %r; fail closed" % (status,))
        text = parse_generate_response(payload)
    except ValueError as err:
        return _refused(str(err))
    except Exception as err:  # any transport failure refuses — including timeouts
        return _refused("local engine unreachable: %s; fail closed" % (err,))
    return {
        "kind": "COMPLETED",
        "text": text,
        "model": model,
        "policyVersion": LOCAL_LLM_BRIDGE_POLICY["policyVersion"],
        "guardrails": LOCAL_LLM_BRIDGE_GUARDRAILS,
    }


def probe_local_engine(transport):
    """One-shot liveness probe of the local engine's /api/version.
    Returns {"kind": "REACHABLE", "engineVersion": ...} or
    {"kind": "UNREACHABLE", "reason": ...} — never raises."""
    try:
        status, payload = transport(LOCAL_LLM_BRIDGE_POLICY["versionPath"], None, 5)
        if status != 200:
            return {"kind": "UNREACHABLE", "reason": "status %d; fail closed" % status}
        version = payload.get("version") if isinstance(payload, dict) else None
        if not isinstance(version, str) or len(version) == 0:
            return {"kind": "UNREACHABLE", "reason": "no engine version in payload; fail closed"}
        return {"kind": "REACHABLE", "engineVersion": version}
    except Exception as err:
        return {"kind": "UNREACHABLE", "reason": "local engine unreachable: %s; fail closed" % (err,)}


def _refused(reason):
    return {"kind": "REFUSED", "reason": reason}