# XIV AGENT HANDOFF - US-PLG-01

BRANCH: grok/us-plg-01-plugin-marketplace
BASE: grok/us-net-01-supplier-directory @ 9b1edc9 (docs) / 7aacce1 (feat)
STORY_ID: US-PLG-01
ONLINE: hybrid
WORKER: grok (one writer)

GOAL: Plugin marketplace install (signed) - in-memory marketplace stub for Builder; WAITING_SIGNING when unbound; never claim cryptographic verification without a real verifier; install proposals requireApproval; L4 false; no production mutations; services/ai module + mobile Builder screens + tests + queue/TEST_EVIDENCE/handoff.
CONSTRAINTS: L4 false; WAITING_SIGNING when signing/marketplace unbound; cryptographicallyVerified always false without real verifier; install proposals requireApproval; no production mutations; stub marketplace only; no main/force/xiv-v2; leave historical/* and sec-status alone; do not touch dimensional/* or xiv-12d / xiv-ai-energy.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (US-PLG-01 entry)
NEXT: EY3 Hardware capability probe (CPU/GPU/NPU/ollama) — queued in master Now lane; stay off xiv-12d / dimensional/* / xiv-ai-energy
