# XIV AGENT HANDOFF — US-AGT-01

BRANCH: grok/us-agt-01-supplier-sim-propose
BASE: local/offline-build-recovery @ b7c9b4e5
STORY_ID: US-AGT-01
ONLINE: hybrid
WORKER: grok (one writer)

GOAL: Wire AI Workforce propose supplier simulation + human approval.
CONSTRAINTS: L4 false; SIMULATION ≠ PRODUCTION; no Guardian/RLS weaken; no main/force/xiv-v2.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (US-AGT-01 entry)
NEXT: US-AGT-02 approval audit trail persistence (queued)
