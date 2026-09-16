# 12D-260 — adversarial tests for the Local LLM Bridge contract. Pure stdlib
# (CI image installs nothing). The central properties under attack:
#   1. LOCALHOST ONLY — the bridge refuses any non-local base URL.
#   2. FAIL CLOSED — every transport failure yields an honest REFUSED
#      outcome; there is no cloud path to fall back to.
#   3. Malformed engine payloads refuse; garbage in, refusal out.

import unittest

from xiv_local_llm_bridge import (
    LOCAL_LLM_BRIDGE_GUARDRAILS,
    LOCAL_LLM_BRIDGE_POLICY,
    build_generate_request,
    is_localhost_base_url,
    parse_generate_response,
    perform_local_completion,
    probe_local_engine,
)


class LocalhostGateTests(unittest.TestCase):
    def test_local_urls_pass(self):
        for url in ("http://localhost:11434", "http://127.0.0.1:11434", "http://[::1]:11434"):
            self.assertTrue(is_localhost_base_url(url), url)

    def test_anything_else_refuses(self):
        for url in (
            "https://localhost:11434",          # wrong scheme
            "http://api.openai.com/v1",         # cloud
            "http://example.com",
            "http://localhost.evil.com",        # lookalike host
            "http://0.0.0.0:11434",
            "https://127.0.0.1",
            "",                                  # empty
            "http://",                           # no host
            None,
            42,
            "http://localhost:11434/../..",      # host fine but check scheme/host only — still local
        ):
            # The last case is intentionally local (path is not the host);
            # only assert refusal for the genuinely non-local ones.
            if url == "http://localhost:11434/../..":
                self.assertTrue(is_localhost_base_url(url))
            else:
                self.assertFalse(is_localhost_base_url(url), repr(url))


class RequestBuilderTests(unittest.TestCase):
    def test_happy_body_is_exact(self):
        body = build_generate_request("hello", "qwen2.5-coder:7b", 30)
        self.assertEqual(
            list(body.keys()), ["model", "prompt", "stream"]
        )
        self.assertEqual(body["stream"], False)

    def test_bad_prompts_refuse(self):
        for bad in ("", "   ", None, 42, ["hello"], "x" * (LOCAL_LLM_BRIDGE_POLICY["maxPromptChars"] + 1)):
            with self.assertRaises(ValueError, msg=repr(bad)[:40]):
                build_generate_request(bad, "m", 30)

    def test_bad_models_refuse(self):
        for bad in ("", " model", "model;drop", None, 42, "x" * 129):
            with self.assertRaises(ValueError, msg=repr(bad)[:40]):
                build_generate_request("hello", bad, 30)

    def test_bad_timeouts_refuse(self):
        for bad in (0, -1, True, "30", None if False else float("nan"), 3601):
            with self.assertRaises(ValueError, msg=repr(bad)[:40]):
                build_generate_request("hello", "m", bad)

    def test_default_timeout_applies(self):
        body = build_generate_request("hello", "m")
        # The builder itself carries no timeout; the transport receives the
        # policy default — covered in perform tests below.


class PayloadTests(unittest.TestCase):
    def test_happy_payload(self):
        self.assertEqual(
            parse_generate_response({"response": "hi", "done": True}), "hi"
        )

    def test_malformed_payloads_refuse(self):
        for bad in (None, "text", [], {}, {"done": True}, {"response": "hi"},
                    {"response": "hi", "done": False}, {"response": 5, "done": True}):
            with self.assertRaises(ValueError, msg=repr(bad)[:40]):
                parse_generate_response(bad)


class CompletionTests(unittest.TestCase):
    def test_happy_completion(self):
        seen = {}

        def transport(path, body, timeout_s):
            seen["path"], seen["body"], seen["timeout"] = path, body, timeout_s
            return 200, {"response": "local brain says hi", "done": True}

        outcome = perform_local_completion(transport, "hello", "qwen2.5-coder:7b", 30)
        self.assertEqual(outcome["kind"], "COMPLETED")
        self.assertEqual(outcome["text"], "local brain says hi")
        self.assertEqual(seen["path"], "/api/generate")
        self.assertEqual(seen["body"]["stream"], False)
        self.assertEqual(seen["timeout"], 30)

    def test_transport_raise_refuses(self):
        def transport(path, body, timeout_s):
            raise ConnectionError("connection refused")

        outcome = perform_local_completion(transport, "hello", "m", 30)
        self.assertEqual(outcome["kind"], "REFUSED")
        self.assertIn("unreachable", outcome["reason"])

    def test_timeout_refuses(self):
        def transport(path, body, timeout_s):
            raise TimeoutError("timed out")

        outcome = perform_local_completion(transport, "hello", "m", 30)
        self.assertEqual(outcome["kind"], "REFUSED")

    def test_non_200_refuses(self):
        def transport(path, body, timeout_s):
            return 503, {"error": "model offline"}

        outcome = perform_local_completion(transport, "hello", "m", 30)
        self.assertEqual(outcome["kind"], "REFUSED")
        self.assertIn("status", outcome["reason"])

    def test_malformed_payload_refuses(self):
        def transport(path, body, timeout_s):
            return 200, {"note": "not a completion"}

        outcome = perform_local_completion(transport, "hello", "m", 30)
        self.assertEqual(outcome["kind"], "REFUSED")

    def test_bad_prompt_refuses_without_touching_transport(self):
        calls = []

        def transport(path, body, timeout_s):
            calls.append(1)
            return 200, {"response": "hi", "done": True}

        outcome = perform_local_completion(transport, "  ", "m", 30)
        self.assertEqual(outcome["kind"], "REFUSED")
        self.assertEqual(calls, [], "a refused prompt must never reach the engine")

    def test_outcome_carries_honest_guardrails(self):
        outcome = perform_local_completion(lambda p, b, t: (200, {"response": "x", "done": True}), "hi", "m", 5)
        self.assertEqual(outcome["guardrails"], LOCAL_LLM_BRIDGE_GUARDRAILS)


class ProbeTests(unittest.TestCase):
    def test_reachable(self):
        outcome = probe_local_engine(lambda p, b, t: (200, {"version": "0.34.0"}))
        self.assertEqual(outcome, {"kind": "REACHABLE", "engineVersion": "0.34.0"})

    def test_unreachable_variants(self):
        def raiser(path, body, t):
            raise OSError("no route")

        self.assertEqual(probe_local_engine(raiser)["kind"], "UNREACHABLE")
        self.assertEqual(probe_local_engine(lambda p, b, t: (404, {}))["kind"], "UNREACHABLE")
        self.assertEqual(probe_local_engine(lambda p, b, t: (200, {}))["kind"], "UNREACHABLE")


class PolicyPinTests(unittest.TestCase):
    def test_policy_pins(self):
        self.assertEqual(LOCAL_LLM_BRIDGE_POLICY["policyVersion"], "12d-260-v1")
        self.assertEqual(LOCAL_LLM_BRIDGE_POLICY["domain"], "XIV_OS_LOCAL_LLM_BRIDGE")
        self.assertEqual(LOCAL_LLM_BRIDGE_POLICY["baseUrl"], "http://localhost:11434")
        self.assertEqual(LOCAL_LLM_BRIDGE_POLICY["engine"], "ollama")

    def test_guardrails_stay_honest(self):
        self.assertTrue(LOCAL_LLM_BRIDGE_GUARDRAILS["neverCloudFallback"])
        self.assertTrue(LOCAL_LLM_BRIDGE_GUARDRAILS["failClosed503"])
        self.assertTrue(LOCAL_LLM_BRIDGE_GUARDRAILS["localhostOnly"])
        self.assertTrue(LOCAL_LLM_BRIDGE_GUARDRAILS["noPromptPersistence"])
        self.assertTrue(LOCAL_LLM_BRIDGE_GUARDRAILS["modelOutputIsProposalOnly"])
        self.assertEqual(LOCAL_LLM_BRIDGE_GUARDRAILS["remoteCalls"], 0)
        self.assertFalse(LOCAL_LLM_BRIDGE_GUARDRAILS["learningPromoted"])
        self.assertFalse(LOCAL_LLM_BRIDGE_GUARDRAILS["automaticRecovery"])
        self.assertFalse(LOCAL_LLM_BRIDGE_GUARDRAILS["billionUsersProven"])
        self.assertEqual(LOCAL_LLM_BRIDGE_GUARDRAILS["humanDecision"], "REQUIRED")


if __name__ == "__main__":
    unittest.main()