# XIV AGENT HANDOFF — US-AGT-02

BRANCH: grok/us-agt-02-approval-audit
BASE: grok/us-agt-01-supplier-sim-propose @ 631f86f
STORY_ID: US-AGT-02
ONLINE: hybrid
WORKER: grok (one writer)

GOAL: Persist/list approval + audit trail; surface in Scenario Lab; wire approve/deny audit events.
CONSTRAINTS: L4 false; WAITING_DATA when DB unavailable; no production writes without approval; no main/force/xiv-v2; leave historical/* and sec-status alone; do not touch dimensional/* or xiv-12d.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (US-AGT-02 entry)
NEXT: US-EMP-01 anonymous employee feedback (or next queued product story) — stay off xiv-12d / dimensional/*
