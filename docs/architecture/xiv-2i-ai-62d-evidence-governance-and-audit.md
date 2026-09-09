# 2I-AI-62D §§33–61 — Evidence Governance, and an Audit of What the 62 Series Has Actually Proven

**Story:** 2I-AI-62D — evidence, verification and ownership layer
**Status:** QUEUED ARCHITECTURE — NOT IMPLEMENTED
**Section:** Global Operations Brain, per the [placement rule](./xiv-story-placement-and-ownership-rule.md)
**Contracts:** `services/ai/runtime/queued/2i-ai-62d-evidence.ts` · `npm run test:2i-ai-62d-evidence`

## Why this document audits our own claims first

§33 says a developer statement, an agent statement, a screenshot, a successful
demo, or `PASS` written into documentation is not sufficient by itself. An
evidence framework that is applied only to future work, while the claims already
on record keep their informal standing, fails its own first rule.

So this document does two things: it locks the model from §§34–61 into
executable contracts, and it classifies **every substantive claim the 2I-AI-62
series has made so far** against §35's five levels and §58's brief vocabulary.

The headline result is uncomfortable and worth stating plainly:

> **Nothing in the 62 series currently qualifies as E3, and nothing is VERIFIED.**

That is not a criticism of the work. It is what §35 and §36 actually require,
and no amount of careful local testing substitutes for a system artifact and an
independent reviewer.

## Evidence ledger — the series as it stands

| Claim | Level | Brief status | Why not higher |
| --- | --- | --- | --- |
| Universe-blind RLS allowed a cross-Universe read on `xiv_agent_meetings` | **E2** | OBSERVED | Executed against a local PostgreSQL 16 cluster and reproducible, but not CI-signed and not independently reviewed. The author was also the verifier, which §36 rules out for a critical gate. |
| The Universe-scoped RLS migration closes that read | **E2** | OBSERVED | Behaviourally tested on **one** of the **eighteen** tables the migration alters. |
| Eight compute routers exist, none tenant-aware | **E2** | OBSERVED | Static analysis over the runtime; asserted in a test so a ninth changes the diff, but not CI-signed. |
| Only NVIDIA has a hardware capability detector | **E2** | OBSERVED | Static analysis. |
| The landed 62B meeting engine enforces its RLS schema | **E1** | **REPORTED** | `phase2ai62b.test.ts` is entirely in-process and touches no database. The storage property is untested by it. |
| The XIV runtime test suite passes | **E2** | OBSERVED | Tests pass individually. The aggregate `npm run test:runtime` has never completed in this environment; it halts on a missing `@supabase/supabase-js`. |

The fifth row deserves emphasis. 62B landed with an RLS schema and a test file,
and it is easy to read that pairing as "RLS is tested." It is not: the test file
contains zero database references. Under §58 that is **REPORTED** — a system
reports the state, independent evidence is unavailable — and §58's closing rule
is that REPORTED never becomes VERIFIED without evidence.

## §40 — what the RLS evidence actually covers

§40 requires evidence of behaviour, not a check that `rls_enabled = true`. For
every tenant-bearing table it wants five scenarios across seven operation
classes. Measured against the harness that produced the 62B evidence:

**Scenarios — 2 of 5 covered**

| Scenario | Covered |
| --- | --- |
| `ORG_A → ORG_A → ALLOW` | yes (own-Universe insert succeeds) |
| `ORG_A → ORG_B → DENY` | yes (cross-Universe select and insert both refused) |
| `ORG_B → ORG_A → DENY` | **no** — only one direction was tested |
| `UNAUTHENTICATED → DENY` | **no** |
| `REVOKED USER → DENY` | **no** |

**Operations — 2 of 7 covered**

`SELECT` and `INSERT` were exercised. `UPDATE`, `DELETE`, `RPC`, storage access
and service interfaces were not.

**Tables — 1 of 18.** The migration rewrites policies on eighteen tables. One
was behaviourally probed. The other seventeen rest on the assumption that an
identical policy shape behaves identically, which is reasonable and is still an
assumption rather than evidence.

The direction gap matters more than it looks. A policy that filters correctly
for a member of Universe A can still be wrong for a member of Universe B if the
predicate is asymmetric, and testing one direction cannot distinguish those
cases.

None of this makes the fix wrong. It makes the fix **OBSERVED at E2 on one
table**, which is what the ledger now says, instead of "RLS is proven."

## §38 and §55 applied to a real event

While this work was in progress, `xiv-v2` advanced from `4255a23` to `6098668`
("enhance agent meeting network isolation and surfaces"). The RLS evidence was
captured against the older commit, so §38's rule applies: evidence for commit A
does not automatically prove commit B.

§38 permits reuse only when explicit impact analysis proves the changed
component cannot affect the validated property. That analysis, done rather than
assumed:

- The validated property is the behaviour of RLS policies, which live entirely
  in `supabase/migrations`.
- `git diff --stat 4255a23..6098668 -- supabase/migrations/` is **empty**. No
  migration changed.
- The commit changes `services/ai/runtime/agentmeetings/*.ts`, the 62B test
  file, `server.ts`, and queue documentation.

**Conclusion: freshness = VALID**, by impact analysis, for the database-layer
property. Note the scope: the runtime-layer isolation behaviour that commit
*did* change has its own evidence needs and inherits nothing from the RLS work.

This is the mechanism §55 asks for — a calculated state rather than treating a
historic PASS as permanent — and it is recorded here as a worked example so the
next revalidation has a pattern to follow.

## §36 / §37 — ownership, and one tension in the matrix

All 26 gates from §37 are encoded with owner, verifier, required evidence level
and human-approval rule. Every one is currently **UNASSIGNED**, and §56 is
explicit that no release-critical criterion may enter canary in that state. That
is the single largest gap between 62D as specified and 62D as it exists.

One tension is worth surfacing rather than quietly resolving. §37 lists **secret
scanning** with Security as both owner and verifier. §37's own note allows this
("for a small team, these are roles, not necessarily separate employees") while
§36 pushes the other way. It is the only gate in the matrix that verifies
itself, so `selfVerifyingGates()` returns exactly `['secret_scanning']` and the
contract test pins that count at one. If a second gate ever becomes
self-verifying, the test fails and someone has to decide deliberately.

Eight gates require **E4** and therefore an independent reviewer: `rls`,
`tenant_isolation`, `universe_isolation`, `kill_switch`, `provenance`,
`backup_restore`, `rollback`, `canary_promotion`.

Against the ledger above, this has a direct consequence. The isolation gates
require E4; the isolation evidence is E2 produced by the same actor that wrote
the fix. **An agent cannot close those gates alone, by construction** — not
because the work is untrusted, but because independence is a property of who
looks, not how carefully.

## §57 dashboard

Every row reads TBD, which is the honest state and not a placeholder to be
filled in optimistically later.

| Criterion | Owner | Required | Result | Verifier | Freshness |
| --- | --- | --- | --- | --- | --- |
| Tenant isolation | DB/Security | E4 | TBD | independent security verifier | n/a |
| Universe isolation | DB/Security | E4 | TBD | independent security verifier | VALID for E2 partial evidence |
| Runtime identity | Platform | E3 | TBD | Security | n/a |
| Compute routing | Platform | E3 | TBD | QA | n/a |
| Resource governor | Platform | E3 | TBD | SRE | n/a |
| Kill switch | SRE | E4 | TBD | Security | n/a |
| Model authorization | ML | E3 | TBD | AI Eval | n/a |
| Secret scan | Security | E3 | TBD | Security (self-verifying) | n/a |
| Dependency scan | Platform | E3 | TBD | Security | n/a |
| Mobile regression | Mobile | E3 | TBD | QA | n/a |
| API/web regression | App/API | E3 | TBD | QA | n/a |
| Provenance | Info Logistics | E4 | TBD | QA/Security | n/a |
| Backup/restore | DB/SRE | E4 | TBD | independent reviewer | n/a |
| Rollback | Release/SRE | E4 | TBD | QA/SRE | n/a |

## What would move the isolation gates forward

Concrete and bounded, in the order that buys the most per unit of work:

1. **Complete the §40 matrix on the one table already probed** — add the
   `ORG_B → ORG_A`, unauthenticated and revoked-user rows, and the `UPDATE` and
   `DELETE` operations. This is an extension of an existing harness.
2. **Extend it across all eighteen tables** rather than reasoning from policy
   shape. Mechanical once step 1 exists.
3. **Run it in CI and keep the artifact**, which converts E2 into E3 by
   supplying the system-generated signature §35 asks for.
4. **Have someone who did not write the migration review the artifact**, which
   is the only step that reaches E4 and the only one an agent cannot perform for
   its own work.

Steps 1–3 are ordinary engineering. Step 4 is a role assignment, and it is what
§36 exists to insist on.

## Not decided here

- Who fills each of the 26 owner and verifier roles. §37 says these are roles
  rather than necessarily separate employees, but §56 still requires them to be
  assigned before canary.
- Whether the `secret_scanning` self-verification is accepted or split.
- Whether the evidence store is a repository directory per §39, a database, or
  both. §34's tamper-evidence requirement constrains this and is not settled by
  writing files into a git tree, since a git tree is rewritable by the same
  actor that produced the evidence.
