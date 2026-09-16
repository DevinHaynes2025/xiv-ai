# 12D-260 — FastAPI wiring for the Local LLM Bridge (runtime module). This
# file imports fastapi + httpx and is NEVER imported by the stdlib test
# suite (CI's python:3.12-slim installs no packages). The contract lives in
# xiv_local_llm_bridge.py; this module only wires it to a real local
# transport and maps outcomes to honest HTTP responses:
#
#   * COMPLETED          -> 200 with the text + honest flags
#   * REFUSED            -> 503 {"error": "SECURE_SERVICE_UNAVAILABLE", ...}
#                           (unreachable, timeout, bad status, bad payload)
#   * malformed request  -> 400 with an honest reason (client-side input)
#
# There is NO cloud path in this file. If the local engine is down, the API
# says so — it does not quietly go looking for a substitute.

from typing import Any, Callable, Tuple

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from xiv_local_llm_bridge import (
    LOCAL_LLM_BRIDGE_GUARDRAILS,
    LOCAL_LLM_BRIDGE_POLICY,
    perform_local_completion,
    probe_local_engine,
)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=LOCAL_LLM_BRIDGE_POLICY["maxPromptChars"])
    model: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")
    timeoutSeconds: float = Field(default=LOCAL_LLM_BRIDGE_POLICY["defaultTimeoutSeconds"], gt=0, le=3600)


def make_transport(base_url: str) -> Callable[[str, Any, float], Tuple[int, Any]]:
    """A real LOCAL transport over httpx. The base URL is validated at
    construction: an app pointed anywhere but localhost refuses to build."""
    if not base_url.startswith("http://localhost") and not base_url.startswith("http://127.0.0.1") \
            and not base_url.startswith("http://[::1]"):
        raise ValueError("the local LLM bridge refuses to point anywhere but localhost; fail closed")
    client = httpx.Client(base_url=base_url, timeout=LOCAL_LLM_BRIDGE_POLICY["defaultTimeoutSeconds"])

    def transport(path: str, body: Any, timeout_seconds: float) -> Tuple[int, Any]:
        if body is None:
            response = client.get(path, timeout=timeout_seconds)
        else:
            response = client.post(path, json=body, timeout=timeout_seconds)
        try:
            payload: Any = response.json()
        except ValueError:
            payload = None
        return response.status_code, payload

    return transport


def create_app(base_url: str = LOCAL_LLM_BRIDGE_POLICY["baseUrl"]) -> FastAPI:
    transport = make_transport(base_url)
    app = FastAPI(title="XIV OS Local LLM Bridge", version=LOCAL_LLM_BRIDGE_POLICY["policyVersion"])

    @app.post("/api/bridge/generate")
    def generate(req: GenerateRequest) -> dict:
        try:
            outcome = perform_local_completion(
                transport, req.prompt, req.model, req.timeoutSeconds
            )
        except ValueError as err:
            raise HTTPException(status_code=400, detail=str(err))
        if outcome["kind"] == "REFUSED":
            # Fail closed: the ONLY honest answer when the local brain is
            # unreachable is a clean 503 — never a cloud detour.
            raise HTTPException(
                status_code=503,
                detail={"error": "SECURE_SERVICE_UNAVAILABLE", "reason": outcome["reason"]},
            )
        return {
            "policyVersion": outcome["policyVersion"],
            "model": outcome["model"],
            "text": outcome["text"],
            "guardrails": outcome["guardrails"],
        }

    @app.get("/api/bridge/health")
    def health() -> dict:
        verdict = probe_local_engine(transport)
        if verdict["kind"] != "REACHABLE":
            raise HTTPException(
                status_code=503,
                detail={"error": "SECURE_SERVICE_UNAVAILABLE", "reason": verdict["reason"]},
            )
        return {
            "status": "LOCAL_MODEL_REACHABLE",
            "engine": LOCAL_LLM_BRIDGE_POLICY["engine"],
            "engineVersion": verdict["engineVersion"],
            "guardrails": LOCAL_LLM_BRIDGE_GUARDRAILS,
        }

    return app


app = create_app()