# XIV AGENT HANDOFF - EY3

BRANCH: grok/ey3-hardware-probe-reconcile
BASE: grok/us-plg-01-plugin-marketplace @ 23c744e2
STORY_ID: EY3
ONLINE: hybrid (ASUS local probe + Ollama)
WORKER: grok (one writer)

GOAL: Hardware capability probe reconcile — GET /v1/hardware with honest CPU/GPU/NPU/Ollama truth states; AMD CPU DETECTED on ASUS; GPU/NPU DETECTED or WAITING never fake VERIFIED; Ollama reachability via live /api/tags; tests + executive mobile readout; queue DONE + evidence.
CONSTRAINTS: L4 false; no fabricate silicon VERIFIED; no main/force/xiv-v2; leave historical/* and sec-status alone; do not touch dimensional/* or xiv-12d / xiv-ai-energy.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (EY3 reconcile entry)
NEXT: Architecture Reader wire from 12D-08 FOLLOW_UP (product lane in xiv-ai only — do not mutate xiv-ai-12d / dimensional/* / xiv-ai-energy). If queue empty after EY3, that is the recommended next product story.
