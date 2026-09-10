# XIV AGENT HANDOFF - US-SYS-01

BRANCH: grok/us-sys-01-system-navigator
BASE: grok/us-con-01-consumer-innovate @ 52f06a6
STORY_ID: US-SYS-01
ONLINE: hybrid
WORKER: grok (one writer)

GOAL: System Navigator CSV/commerce demo for Executive — connector stubs (not live ERP); honest WAITING_CONNECTOR / WAITING_DATA when unbound; DEMO_CSV metrics only after explicit session load; never fabricate commerce metrics; L4 false; no autonomous production mutations; mobile Systems Navigator + Commerce CSV demo screens + services/ai module + tests.
CONSTRAINTS: L4 false; WAITING_CONNECTOR/WAITING_DATA when unbound; never fabricate commerce metrics; no live ERP; no main/force/xiv-v2; leave historical/* and sec-status alone; do not touch dimensional/* or xiv-12d / xiv-ai-energy.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (US-SYS-01 entry)
NEXT: US-SEC-01 Security Center policy denials (Guardian read-only) — stay off xiv-12d / dimensional/*
