# 12D-321 — The Stale-Re-ingestion Flow CLI (staleness → plan → REAL doors, one invocation)

**Story rung:** 12D-321 · **Policy:** `12d-321-v1` (domain
`XIV_OS_STALE_REINGEST_FLOW_CLI`) · **Parents:** 12D-316 (the
re-ingestion plan; its "next candidate" #3) / 12D-315 (the staleness
contract re-derived inside the plan) / 12D-278 (the bound-admission
bridge) / 12D-275 (the provenance-required admission door) / 12D-296
(the CLI discipline: executor, not decider)

## What this rung is

The operator-flow wiring left unwired since 12D-316: until now the
staleness card and the re-ingestion plan had shell surfaces, but the
plan's emitted stories had NO wired path to the REAL admission doors —
the operator had to hand-carry them. This rung closes that gap with ONE
CLI invocation (LOCAL plane only, the operator-side discipline — the
12D-278 bridge must never be imported by the shell, the 12D-273
lesson):

```
node xiv-stale-reingest-flow.cli.ts --queue=<path> --register=<path>
  --genesis=<g> --source=<id> --memory=<packet.json> --digests=<digests.json>
  --document=<stale-id> --new-document=<successor-id>
  --new-title=<title> --new-body=<body.txt>
```

## The chain (every stage a REAL door, called never re-implemented)

1. **THE REAL 12D-316 plan** — `prepareStaleReingestPlan` re-derives
   the staleness through the **REAL 12D-315 contract** (a CURRENT or
   UNCHECKED source refuses "nothing to re-ingest"), requires a
   genuinely-new successor id, and produces the stories through the
   **REAL 12D-274 ingest door** (its secret re-gate and over-budget
   refusals carry through).
2. **THE PREPARED RESULT IS RE-DERIVED, NEVER TRUSTED** — the CLI
   re-runs the REAL 12D-274 door over the plan packet's OWN
   `newBodyText` and refuses unless the re-derived digest, chunk count
   and story ids match the plan's claims. (There is no plan-packet
   handoff to tamper with — the CLI derives internally — so the
   equivalent attack surface is the INPUT files, and those refuse
   fail-closed: secret-shaped body, malformed digests, tampered
   register.)
3. **THE REAL 12D-278 BRIDGE admits** — the binding is re-derived from
   the register chain bytes and cross-gated against the prepared
   identity; the **REAL 12D-275 door** (provenance REQUIRED, the
   12D-295 adoption) does the queue admission itself.

## Fail-closed by construction

- Exactly the ten flags, each once; unknown/duplicate/missing refuse.
  **NO tenant flag** — the tenant comes from the verified memory
  packet, never the operator's word. **No digest flag anywhere** — the
  digest is the doors', never a claim.
- The CLI NEVER REGISTERS (read-only store, save throws) and NEVER
  decides; a refusal at ANY stage prints the door's own message
  verbatim and exits 2 with NOTHING admitted (the queue is opened only
  after the plan passes — a CURRENT refusal leaves no queue file).
- modelCalls 0, remoteCalls 0, no network primitive; the receipt's
  `stoppedBefore` discloses that the successor stories are ADMITTED but
  never claimed, settled, reviewed or promoted here.

## Adversarial tests (9, all through REAL doors)

Guardrails pinned (no tenant/digest escape hatch in the flag list);
parser discipline (arity, unknown, duplicate, empty, malformed ids,
short genesis, unbounded title); the REAL loop → `STALE_REINGEST_ADMITTED`
with re-derived lineage + queue rows verified in the REAL database;
CURRENT → "nothing to re-ingest", NOTHING admitted (no queue file
exists); secret-shaped successor body refuses pre-admission, never
echoed; provenance (unregistered source / tampered register line /
malformed register file) refuses with NOTHING admitted; digests-file
shapes (not-an-array / wrong keys / non-hex64) refuse; unreadable
memory packet refuses; the read-only store's save throws; colliding
successor id refuses at the plan.

## LIVE measure (real invocation, REAL memory packet over a REAL queue)

| Case | Result |
|---|---|
| STALE source (moved digest) + new successor id | `STALE_REINGEST_ADMITTED` — lineage `cccc… → dddd…`, successor `live-doc-1-reingest-1`, 2/2 rows inserted, binding `OPEN_SOURCE_REPO`, registerEntries 1 |
| CURRENT source (unmoved digest) | `STALE_REINGEST_FLOW_REFUSED` — "PLAN REFUSED — nothing to re-ingest: the target document is assessed CURRENT, not STALE; fail closed" (exit 2, nothing admitted) |

## Measured (local, nothing remote)

- `typecheck:12d-321` exit 0; new suite **9/9**.
- **Full chain regression 1484/1484 across 249 files** (1475 + 9),
  0 failures.
- Python suites OK (17 + 20 = 37); shell build exit 0 (unchanged — the
  bridge is operator-side only by the 12D-273 lesson; the shell keeps
  its measurement-only staleness/plan surfaces).

## What this is NOT

- NOT any review decision, claim, settle, or learning action: the flow
  admits PREPARED rows only — the supervised cycle and the operator
  decide what happens to them.
- NOT a fetcher: the successor bytes come from the operator's LOCAL
  file; the flow never touches the network.
- NOT a shell surface: queue-touching doors stay out of the shell
  (12D-273 lesson); the shell's staleness/plan panels remain
  measurement-only.
- NOT any change to the 133-story queue's review state — the live
  exercise used a fresh scratch queue; review decisions remain the
  CEO's.

## Next candidates

1. CEO review decisions on the 35 drafts (clean slate, CEO-gated).
2. The eight-copy `SECRET_CONTENT_RE` collapse to one shared export —
   only if a review asks.
3. A staleness→plan→flow runbook page in the handoff tree (documentation
   rung) if the operator wants a printed runbook for the flow.