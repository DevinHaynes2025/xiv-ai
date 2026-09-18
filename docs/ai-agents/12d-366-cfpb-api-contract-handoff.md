# 12D-366 — CFPB Consumer Complaint Database API contract verified (reading rung)

**Story rung:** 12D-366 (verify-then-read — interface-contract
verification, 12D-361/362 pattern) · **Parents:** 12D-363 ·
**Policy footprint:** none added

## What this rung is

The 12D-359/365 disclosure ("CFPB API contract honestly unverified —
JS/Swagger-only") is now UPGRADED. The publisher's own machine-readable
OpenAPI spec was fetched and quoted:

- Spec: `github.com/cfpb/ccdb5-api` — `swagger-config.yaml`
  (OpenAPI 3.0.0), fetched raw 2026-09-19.
- License verified BEFORE read from the spec info block itself:
  "Creative Commons License CC0" (license URL = repo LICENSE); the
  CFPB docs page states verbatim "As a work of the United States
  Government, source code released by the CFPB is in the public
  domain by default within the United States."

## Verified contract (verbatim)

- Base URL: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/`
- Endpoints (spec): `/` search, `/_suggest_company`, `/_suggest_zip`,
  `/{complaintId}`; docs pages additionally describe `/geo/states`
  and `/trends`.
- Pagination: `size` integer min 1 **max 100** default 10; `frm`
  integer min 1 **max 100000**, "only if format parameter is not
  specified"; `search_after` — "Used in conjunction with frm
  parameter to paginate results."
- Formats: docs — "json, csv, xls, or xlsx"; spec enum csv.
- Unauthenticated; "The database generally updates daily."
- Rate limits NOT documented (disclosed, same disclosure as World
  Bank 12D-361).

## Measured

- Single unauthenticated GET of the base search URL: index
  `complaint-public-v2`, **total hits 17,842,775**. Count observed
  only — NO bulk extraction. Any future extraction stays a bounded
  CEO-gated measured rung (size ≤ 100, frm ≤ 100000, search_after
  pagination, rows counted against the 2,000,000 rows/database
  measured ceiling).
- 1 source registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-366/cfpb-ccdb-api-contract.md`
  · driver: `.xiv-runtime/reading-driver-12d-366.ts` (never
  committed).

## Honest limits

- CC0/public-domain posture covers CFPB data and code; consumer
  narratives are published with consent flags
  (`consumer_consent_provided`) — per-field consent discipline
  disclosed; PII-shaped fields follow the HRDATA lesson
  (secret-screened, never echoed, never sent to any model).

## CEO directive recorded (2026-09-19, verbatim)

"and if ollama go down we need to find alternatives to keep the brain
running lets have multiple llms and kekep continue working 24/7"

Honest mapping: a **multi-reasoner failover rung** is the named next
candidate — loopback-only callers with a health-checked preference
order; ALL-DOWN is an honest blocker (reading drivers already fail
durably with no silent retry, and the 12D-288 operator recovery door
exists); remote/cloud fallback stays unauthorized (remoteCalls 0
pinned; TOP_SECRET/CONFIDENTIAL never to remote models). Actual
model installs are env changes gated on a local `ollama list`
census + CEO authorization.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 → 363
   (9 prepared commits; landed through 364+365 = HEAD b996dd82) +
   this rung.
2. 12D-340 apply execution — CEO-approved ("go ahead and run the
   apply driver", 2026-09-19); 33 queues staged; classifier-gate
   blocked this segment.
3. Multi-LLM failover rung (directive above): census `ollama list`
   → failover caller with health check → honest all-down blocker.
4. Bounded CFPB extraction rung (CEO-gated): size-bounded pages,
   rows counted against the ceiling, CC0 attribution carried.