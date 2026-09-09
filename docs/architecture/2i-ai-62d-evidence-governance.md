# 2I-AI-62D — Test evidence, verification and ownership

**Status:** `QUEUED ARCHITECTURE — NOT IMPLEMENTED` · `DEPLOYMENT_STATE=QUEUED` · `L4_AUTONOMY_ENABLED=false`

Story sections 33-61, implemented in [`services/ai/evidence`](../../services/ai/evidence). The runtime
side of 62D is documented separately in
[2i-ai-62d-distributed-runtime-fabric.md](./2i-ai-62d-distributed-runtime-fabric.md).

Sections 33-61 answer a different question from the rest of the story. Sections 1-32 describe what the
runtime does; sections 33-61 describe how anyone knows it does it. The rule they establish is short:
a statement is not evidence. Everything here exists so a release gate resolves from stored facts
rather than from someone's recollection of a green build.

Like the runtime fabric, this is an in-memory model with no persistence, no dashboard and no
connection to a real pipeline. What it does provide is an executable form of the rules, so they can
be tested before anything depends on them.

---

## What was built

| File | Sections | What it holds |
| --- | --- | --- |
| `types.ts` | 34, 35, 38, 40-52 | The evidence record contract, strength levels, commit binding and one typed payload per evidence category |
| `gates.ts` | 37, 39 | The ownership matrix as data, plus the package directory layout |
| `levels.ts` | 35 | Derivation of E0-E4 from what a record actually contains |
| `redaction.ts` | 34, 47 | Refusal of payloads carrying credential material |
| `ledger.ts` | 34, 36, 53-61 | The hash-chained store, separation of duties, exceptions, failures, freshness, gate states, dashboard, founder brief, CEO boundary |
| `runtime-bridge.ts` | 41, 42, 44, 51, 52 | Reading evidence out of a live `RuntimeFabric` run |
| `collect.ts`, `ndjson-reporter.mjs` | 39 | The CI evidence package generator |

Run the suite with `npm test --prefix services/ai` (117 tests, 41 of them for this layer) and produce
a package with `npm run evidence --prefix services/ai`.

---

## 33-34. The evidence principle and the record

Every acceptance criterion needs evidence that is machine-verifiable or independently reviewable, and
every piece of evidence has to answer the same twelve questions. `EvidenceRecord` carries all of the
required fields, and `ledger.audit(evidenceId)` returns them as the section 61 questionnaire: what was
tested, against which commit, where, by whom, what was expected, what happened, where the artifact
lives, whether it has been altered, who owns remediation, who verified it, whether it is fresh and
whether a human approval became necessary.

Records are chained. Each one stores a hash of its own contents and a hash linking it to its
predecessor, so `verifyIntegrity()` walks the ledger and names the first record whose contents no
longer match what was recorded. Editing an `actualResult` after the fact is detectable, the audit for
that record reports `hasTheEvidenceBeenAltered: true`, and the gate resting on it drops to `BLOCKED`
rather than staying green.

Secrets never enter an artifact. `findSecrets` inspects a payload before it is stored and the ledger
refuses anything that trips it. Refusal rather than scrubbing is deliberate: a quietly rewritten
artifact no longer matches the hash its producer computed, and silently rewriting evidence is exactly
what an evidence chain exists to prevent. The detector matches field names on their trailing word, so
`apiKey` and `accessToken` are caught while `tokens`, `credentialType` and `authorizationPassed` —
all real evidence fields — are not. A detector that cries wolf teaches people to route around it.

## 35. Evidence strength

`assessLevel` derives the level; nothing declares it.

| Level | Meaning | What it takes |
| --- | --- | --- |
| E0 | claim | no artifact |
| E1 | manual observation | an artifact, but no exact revision |
| E2 | automated test result | bound to repository, branch and commit |
| E3 | system-generated verified evidence | machine-produced by CI, a runtime or a scanner |
| E4 | independently verified release evidence | E3, plus a reviewer who is not the owner, a reproducible command, a passing status and no open blocker |

E3 is the default minimum for a release gate and E4 is required for the security, tenancy, provenance,
rollback, backup and canary gates. Recording the same criterion by hand tops out at E2 even when the
observation is honest, because nothing about it is independently reproducible. A level is recomputed
when a verification arrives, so E3 becomes E4 at the moment a second person confirms it and not
before.

## 36-37. Ownership

Four roles: the owner implements and produces, the verifier independently confirms, the approver
accepts residual risk, and the Guardian enforces policy. `GATES` encodes the section 37 matrix — owner,
required strength, required evidence categories, verifier, human approval rule, threshold and whether
the gate is release-critical — as data rather than as a table in a document.

The separation is enforced rather than described:

- A release-critical gate cannot be assigned the same person as owner and verifier. The assignment is
  refused, which leaves the gate visibly `UNASSIGNED` instead of falsely covered.
- The owner of a record cannot verify it, and neither can whoever executed it.
- On a release-critical gate, the person who verified cannot also approve.
- Verification is recorded once. A second reviewer cannot overwrite the first.
- A verifier outside the record's tenant scope is refused.

## 38. Exact-commit evidence

Evidence with no revision is an observation about nothing in particular, so a record without
repository, branch and commit is refused outright. `CommitBinding` also carries the dependency lock
hash, migration hash, container digest, mobile build id, runtime version, configuration version, model
registry version and policy version, which is what makes a later staleness judgement possible. Closing
a failure requires retest evidence bound to the stated fix commit; evidence from a different revision
is refused with `commit_binding_mismatch`.

## 39. The CI evidence package

`npm run evidence --prefix services/ai` runs the suite through a small NDJSON reporter, maps each
suite to the criteria it speaks to, and writes `xiv-evidence/<commit>/<area>/<evidenceId>.json` plus a
manifest. The manifest states what ran, what passed, what failed, what was skipped, which exceptions
are active, and — the part that matters — which release-critical gates produced no evidence at all.

A package that omits a gate reads as a clean run, which is the specific failure mode this section
exists to prevent, so absence is a reported state. On the current commit the collector reports six
release-critical gates with no evidence: `rls`, `secret_scanning`, `dependency_scanning`,
`backup_restore`, `rollback` and `canary_promotion`. None of those can be produced by a queued
architecture with no applied migration, no scanner in the pipeline and no environment to promote. The
package says so rather than leaving the cells blank.

Passing `--require-mandatory` makes a missing or skipped release-critical gate a non-zero exit, which
is the form the eventual pipeline should use.

## 40-52. Typed evidence

Each category from these sections has a payload type, and each has pass conditions the ledger checks
independently of whatever status the producing suite reported. This matters more than it sounds: a
suite that says `pass` while its own probe matrix shows a cross-tenant read returning four rows does
not pass its gate. The payload is the evidence, so the payload decides.

- **RLS (40).** One probe per attempted access: table, identity, identity state, operation, source and
  target tenant, expected and actual outcome, row count. No row contents.
- **Agent security (41).** What the agent asked for, what was granted, which model and node it reached,
  which tools it received, whether a human approval was required and present, and the number of
  unauthorized grants. That last number is the point of the section, so blocked attempts are counted
  separately from authority actually exceeded.
- **Runtime (42).** Node class, architecture, vendors, runtime version, trust level, attestation state,
  capabilities, timings, consumption and termination state.
- **Performance (43).** Environment, hardware class, concurrency, warm or cold, p50/p95/p99, error rate,
  throughput and resource consumption. A single fast run on a developer machine is not performance
  evidence.
- **Cost (44).** Modelled spend per workload and per successful task. `attributableCostUsd` stays null
  until a billing source exists, because an estimate is not an invoice.
- **Model and agent evaluation (45).** Evaluation suite and version, sample count, accuracy, task
  success, safety failures, latency and cost; for agents, policy violations and human corrections.
- **Mobile (46).** Platform, OS version, device class, build id, and separate authentication,
  authorization, offline and sync results.
- **Secret scan (47).** Credential type, location category, severity and remediation state. Never the
  credential.
- **Dependency (48).** SBOM reference, lock hash, scanner version, critical, high and reachable
  findings, and the exceptions covering them.
- **Backup and restore (49).** A restore into a non-production environment with measured RPO and RTO.
  A drill that used production data fails its gate.
- **Rollback (50).** A real recovery from a candidate to a known good version with schema
  compatibility, health, integrity and authorization all checked.
- **Lineage (51).** The eleven links from original source to result, with the missing ones named.
  Partial lineage reports the gap rather than rounding up, and provenance does not pass below 100%.
- **Negative (52).** What the system refuses to do, with the denial code the system actually produced.
  An attempt that unexpectedly succeeded is recorded as `allowed`, not dropped.

## 53. Failure evidence

A failure record names the test, criterion, commit, environment, severity and owner. It closes only
when a different person supplies passing retest evidence bound to the fix commit. An open critical or
high failure holds its gate at `FAIL` even when the evidence on file passed, and the owner cannot
close their own failure.

## 54. Exceptions

An exception needs a risk, a reason, a scope, a compensating control, an owner, an expiry and a
different person to approve it. Missing controls and past expiries are refused. Five conditions can
never be waived at any severity: cross-tenant exposure, Guardian bypass, unauthorized production
action, an exposed production secret, and inability to stop a dangerous workload. An approved
exception moves a gate to `EXCEPTION_APPROVED`, which is a distinct state from `PASS` and reads as
such on the dashboard.

## 55. Freshness

Evidence ages rather than disappearing. `applyChange(trigger)` marks every sensitive record stale, and
each category declares what it is sensitive to: RLS evidence to code, policy and schema changes,
mobile evidence to a new build, dependency evidence to a dependency change, model evaluation to a
model change. A schema change stales the RLS evidence and the gate drops from `PASS` to `STALE`; a
mobile build change leaves it alone. Later evidence for the same criterion and test case supersedes
the earlier record instead of competing with it, and the superseded record stays in the chain.

## 56. Gate state

`UNASSIGNED → ASSIGNED → IN_PROGRESS → EVIDENCE_PENDING → VERIFICATION_PENDING → PASS`, with `FAIL`,
`BLOCKED`, `EXCEPTION_PENDING`, `EXCEPTION_APPROVED` and `STALE` as the states a gate can land in
instead. The state is computed from the ledger, so no one sets it. Missing evidence categories and
unmet thresholds produce `EVIDENCE_PENDING`; a record that no one has confirmed produces
`VERIFICATION_PENDING`; a required human approval that has not happened keeps it there.

## 57. Dashboard

`dashboard()` returns one row per criterion with owner, achieved and required evidence level,
threshold, state, verifier and freshness. Gates with no evidence show `TBD` freshness, `E0` and a
non-passing state — an empty cell never reads as a pass. A gate's level is the minimum across its
supporting records rather than the maximum, so one strong artifact cannot carry several weak ones.
`releaseReadiness()` is the conjunction of every release-critical gate, not a majority.

## 58. Founder brief

Six statuses, all derived: `VERIFIED` (E3 or better with independent verification), `OBSERVED`
(evidence exists, nobody has confirmed it), `REPORTED` (a claim), `UNPROVEN` (nothing recorded),
`BLOCKED` (failed or unusable) and `UNAVAILABLE` (stale). `claimStatus` refuses to record a status
stronger than the ledger supports, which is the enforcement of the rule that `REPORTED` may never be
upgraded to `VERIFIED` without evidence.

## 59-60. The human boundary

Automation produces evidence and formats it; it approves nothing. CI can record a record, and is
refused when it tries to verify one or approve a gate. Agents cannot write evidence about themselves
at all. `canary_promotion` requires a named human — the CEO or a separately authorized release human,
not merely someone holding the approver role. `requestReservedDecision` covers the seven decisions
reserved for human authority: production deployment, external data sharing, legal or regulatory
commitment, financial commitment, customer-facing claim, security exception and autonomy expansion.

---

## What is deliberately absent

- No CI integration. `collect.ts` is a CLI that can be run by hand; nothing runs it on a push.
- No persistence. The ledger is in memory, so a real deployment needs the chain in durable,
  append-only storage before any of this is load bearing.
- No signing. Records are hashed and chained, which detects alteration within one ledger. It does not
  prove authorship, and a party who can rewrite the whole chain can rewrite it consistently.
- No dashboard surface. `dashboard()` returns rows; nothing renders them.
- No scanner, no device lab, no billing source, no restore target. The gates that depend on those
  report as unproven rather than being stubbed into a pass.

## Known gaps to close before this governs a release

1. **Durable, append-only storage.** The chain only means something if nobody can replace it wholesale.
   That needs external anchoring or an append-only store, not an in-process array.
2. **Signed records.** Chaining detects edits; signatures attribute them. A verifier's confirmation in
   particular should be signed by the verifier.
3. **Identity.** Actors are strings today. Ownership separation is only as strong as the identity
   behind those strings, so this has to bind to real accounts before it enforces anything.
4. **Exception expiry enforcement.** Expiry is evaluated when the ledger is read. A real system needs
   something that notices expiry on its own and re-blocks the gate.
5. **Freshness triggers from the outside.** `applyChange` is called explicitly. In a pipeline the
   triggers should come from the events themselves: a merged migration, a new lockfile, a Guardian
   policy edit.
