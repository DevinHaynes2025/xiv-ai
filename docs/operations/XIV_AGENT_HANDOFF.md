# XIV AGENT HANDOFF - US-NET-01

BRANCH: grok/us-net-01-supplier-directory
BASE: grok/us-soc-01-profiles-articles @ 582d30e
STORY_ID: US-NET-01
ONLINE: hybrid
WORKER: grok (one writer)

GOAL: Supplier / manufacturer directory search - search index stub + RLS-scoped for Business; honest WAITING_INDEX / WAITING_DATA when unbound; never fabricate supplier inventory or ratings; L4 false; no production mutations; services/ai module + mobile screens + tests + queue/TEST_EVIDENCE/handoff.
CONSTRAINTS: L4 false; WAITING_INDEX when index unbound; WAITING_DATA on RLS mismatch; never fabricate onHand/skuCount/stars/reviews/trustScore; stub index only; no main/force/xiv-v2; leave historical/* and sec-status alone; do not touch dimensional/* or xiv-12d / xiv-ai-energy.
EVIDENCE: docs/operations/XIV_TEST_EVIDENCE.md (US-NET-01 entry)
NEXT: US-PLG-01 Plugin marketplace install (signed) - stay off xiv-12d / dimensional/*