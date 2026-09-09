# 2I-AI-62D — Test Evidence, Verification & Ownership (§§33–61)

**Status:** **QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Documentation only.  
**DEPLOYMENT_STATE:** QUEUED  
**L4_AUTONOMY_ENABLED:** FALSE  
**Evidence class of *this* document:** E0 relative to runtime gates — **TBD ≠ PASS. NEVER INFER PASS.**

**Park branch:** `cursor/queue-2i-ai-62d-test-evidence-verification-ownership-104c`  
**Unique overlay** for 62D §§33–61. Does **not** rewrite sibling 62D fabric parks (`-104c` fabric PR, `-4059`, `-7b68`) or the concurrent “Add 62D evidence ownership docs” / “62d acceptance criteria” agents.

**Compose with:** 62D XUR/XHAL/XCR fabric · 4059 AC-01…AC-24 (verify, do not replace) · 62L-ES6/ES10 (child-branch parks) · 0a18 runtime tests (OBSERVED) · 62C Information Logistics / lineage · 62E cost/active-agent measurements (queued) · 62B meetings engine on `xiv-v2` (do not rewrite) · Guardian · RLS · Deployment Gate Hardening.

**Sibling handshake:** [`xiv-2i-ai-62d-evidence-agent-collaboration-mesh-104c.md`](./xiv-2i-ai-62d-evidence-agent-collaboration-mesh-104c.md) · machine: [`xiv-2i-ai-62d-evidence-agent-collaboration-mesh-104c.json`](./xiv-2i-ai-62d-evidence-agent-collaboration-mesh-104c.json)

**Founder summary:** [`../queue/2I-AI-62D-test-evidence-verification-ownership-104c.md`](../queue/2I-AI-62D-test-evidence-verification-ownership-104c.md)

> **Code proves implementation. Tests measure behavior. Evidence proves the tests occurred. Independent verification establishes confidence. Human authority accepts consequential risk.**  
> A developer statement, agent statement, screenshot, successful demo, or `PASS` written into documentation is **not sufficient by itself**.

---

## Queue lock

```
CURRENT: 2I-AI-62D Distributed Device, Chip & Edge Runtime
STATE:   QUEUED ARCHITECTURE — NOT IMPLEMENTED
NEXT:    2I-AI-62E Massive Agent Scheduler & Task Force Fabric (already parked; do not implement from this commit)
L4_AUTONOMY_ENABLED=false
```

This overlay does **not** deploy workloads, enroll devices, or promote canary.

---

## 33. Evidence principle

Every acceptance criterion must produce **machine-verifiable or independently reviewable evidence**.

```
DOCUMENTED
    ↓
IMPLEMENTED
    ↓
TESTED
    ↓
EVIDENCE CAPTURED
    ↓
INDEPENDENTLY VERIFIED
    ↓
GATE PASSED
    ↓
STAGING/CANARY CANDIDATE
```

This document is **DOCUMENTED** only. It does not move any gate to IMPLEMENTED or PASSED.

---

## 34. Evidence record contract

Every acceptance test creates an immutable or tamper-evident evidence record.

Minimum fields: `evidence_id`, `test_run_id`, `acceptance_criterion_id`, `repository`, `branch`, `commit_sha`, `build_id`, `artifact_hash`, `organization_scope`, `universe_scope`, `environment`, `test_suite`, `test_case`, `test_version`, `expected_result`, `actual_result`, `status`, `started_at`, `completed_at`, `duration_ms`, `runtime_node_id`, `runtime_version`, `model_id`, `model_version`, `executor_type`, `executor_id`, `evidence_location`, `evidence_hash`, `primary_owner`, `reviewer`, `approval_state`, `exception_id`, `expires_at`.

Secrets, authentication tokens, private prompts, and unnecessary customer data must **not** be copied into evidence artifacts.

---

## 35. Evidence strength levels

| Level | Name | Examples | Gate use |
|-------|------|----------|----------|
| **E0** | CLAIM | “Tenant isolation works.” No artifact | **Cannot** satisfy an acceptance criterion |
| **E1** | MANUAL OBSERVATION | screenshot, console, notes, demo | Useful in development; insufficient for critical security gates |
| **E2** | AUTOMATED TEST RESULT | unit/integration/API/mobile/scheduler report | Must identify exact source revision |
| **E3** | SYSTEM-GENERATED VERIFIED EVIDENCE | CI-signed artifact, RLS adversarial suite, secret-scan, SCA, attestation, SBOM, provenance reconstruction | **Default minimum** for significant release gates |
| **E4** | INDEPENDENTLY VERIFIED RELEASE EVIDENCE | exact commit + reproducible test + system artifact + independent reviewer + no unresolved blocker | Required for critical staging/canary security gates |

---

## 36. Evidence ownership model

Four roles:

| Role | Responsibility |
|------|----------------|
| **OWNER** | Make the capability work and produce evidence |
| **VERIFIER** | Independently determine whether evidence satisfies the criterion |
| **APPROVER** | Human authorized to accept residual risk or permit deployment-gate advancement |
| **GUARDIAN** | Policy enforcement. Can prevent execution/promotion. **Cannot grant itself business authority** |

The same agent/process must **not** simultaneously be implementation owner + independent verifier + human approver for a critical gate.

Agents may assist any role **except** final human approval where policy requires a person.

---

## 37. Evidence ownership matrix

Roles, not necessarily separate employees.

| Gate | Primary Owner | Required Evidence | Independent Verifier | Human Approval |
|------|---------------|-------------------|----------------------|----------------|
| Runtime identity | Runtime Platform | registration + identity tests | Security | No unless exception |
| Runtime attestation | Security/Platform | attestation test artifact | Security reviewer | Exception only |
| RLS | Database | adversarial RLS suite | Security | Required for exception |
| Tenant isolation | Database/Security | cross-tenant negative tests | independent security verifier | Required for failure exception |
| Universe isolation | Database/Security | cross-Universe suite | independent security verifier | Required for exception |
| Workload authorization | Runtime/Security | authorization tests | Security | Exception only |
| Compute routing | Runtime Platform | routing simulation | QA/Platform verifier | No |
| Intel runtime | Runtime Platform | hardware contract suite | QA | No |
| AMD runtime | Runtime Platform | hardware contract suite | QA | No |
| NVIDIA runtime | Runtime/ML | accelerator tests | QA/ML verifier | No |
| iOS | Mobile | device regression suite | QA/Security | Release approval later |
| Android | Mobile | device regression suite | QA/Security | Release approval later |
| Offline mode | Runtime/Mobile | tamper + authority tests | Security | Exception only |
| Agent runtime assignment | Agent Platform | assignment tests | Security/QA | No |
| Resource governor | Runtime Platform | exhaustion tests | SRE/QA | No |
| Kill switch | Runtime/SRE | termination test | Security/SRE verifier | No |
| Failure recovery | SRE/Runtime | fault-injection report | QA/SRE | No |
| Model authorization | ML Platform | registry/routing tests | AI Evaluation/Security | Model exception only |
| Agent evaluation | AI Evaluation | evaluation artifact | independent evaluator | Required at defined risk level |
| Secret scanning | Security | scanner artifact | Security | Required for exception |
| Dependency scanning | Security/Platform | SCA/SBOM | Security | Required for exception |
| Provenance | Information Logistics | lineage reconstruction | QA/Security | No |
| Backup/restore | Database/SRE | restore exercise | independent SRE/DB reviewer | Canary gate |
| Rollback | Release/SRE | rollback rehearsal | QA/SRE | Canary gate |
| Cost governance | FinOps/Platform | usage/cost report | Platform/Finance reviewer | Budget exception |
| Canary promotion | Release | complete gate package | Security + QA | **CEO/authorized human** |

Hardware Intel/AMD/NVIDIA rows remain **UNAVAILABLE** until authenticated nodes exist (62D §2/§29). Do not claim E2–E4 for unconfigured vendors.

---

## 38. Exact-commit evidence

Release-gating artifacts must identify `repository`, `branch`, `commit_sha`. Where applicable: `dependency_lock_hash`, `migration_hash`, `container_digest`, `mobile_build_id`, `runtime_version`, `configuration_version`, `model_registry_version`, `policy_version`.

**Evidence for commit A does not automatically prove commit B.** Reuse only with explicit impact analysis that the changed component cannot affect the validated property.

---

## 39. CI evidence package

Each candidate commit should eventually produce `xiv-evidence/` with `manifest.json` plus directories: unit, integration, security, rls, tenant-isolation, api, web, mobile, runtime, agents, models, dependencies, secrets, performance, cost, provenance, backup-restore, rollback.

Manifest records: commit, build, environment, tests executed, tests skipped, passes, failures, warnings, exceptions, artifact hashes.

**Skipped tests must remain visible. A skipped mandatory test cannot silently count as PASS.**

This overlay does **not** create the `xiv-evidence/` tree in the repository.

---

## 40. RLS evidence

`rls_enabled = true` is **not** sufficient. For every tenant-bearing table test:

```
ORG_A → ORG_A → ALLOW
ORG_A → ORG_B → DENY
ORG_B → ORG_A → DENY
UNAUTHENTICATED → PROTECTED DATA → DENY
REVOKED USER → PROTECTED DATA → DENY
```

Where applicable: SELECT, INSERT, UPDATE, DELETE, RPC, storage access, service interfaces.

Record: test identity, attempted operation, target tenant, expected policy, actual policy, result. Do not copy sensitive row contents into evidence unnecessarily.

---

## 41. Agent security evidence

Record: `agent_id`, `agent_role`, `organization_id`, `universe_id`, requested vs granted capability, `model_id`, `runtime_node_id`, `task_id`, `meeting_id`, `resource_budget`, tools requested vs granted, human approval required/present, result, security events.

Critical path:

```
AGENT REQUESTS UNAUTHORIZED CAPABILITY
              ↓
         GUARDIAN DENIES
              ↓
      SECURITY EVENT CREATED
              ↓
        AGENT CONTINUES WITHOUT CAPABILITY
```

Expected unauthorized grants: **0**.

---

## 42. Runtime evidence

Capture: node class, processor architecture, runtime version, trust state, attestation state, capabilities, workload, start/finish, resource consumption, termination state, result hash.

Do not store hardware identifiers beyond what is necessary for security, operations, and provenance. Unknown nodes receive no protected workload (62D §16).

---

## 43. Performance evidence

Not “XIV is fast.” Record: `commit_sha`, environment, hardware class, dataset/workload definition, concurrency, execution count, warm/cold, p50/p95/p99, error rate, throughput, CPU/GPU/memory/network, cost.

Comparisons require compatible environments.

---

## 44. Cost evidence

Staging-scale tests should produce: workload_count, agent_count, active_agent_count, model_calls, tokens, CPU/GPU time, storage, network, estimated_cost, actual attributable cost, cost_per_task, cost_per_successful_task.

**Usage record ≠ invoice.** 62E may later use these measurements to bound economically supportable simultaneous active agents. Do not implement 62E from this commit.

---

## 45. Model & agent evaluation evidence

Model: `model_id`, `model_version`, suite/version, domain, sample_count, accuracy, task_success, hallucination/error metric, safety failures, latency, cost, date.

Agent adds: `agent_id`, role, tool policy, task suite, collaboration score, policy violations, human corrections, outcome score.

**A newer model does not inherit an older model's evaluation automatically.** Unproven models remain unavailable (62D §21).

---

## 46. Mobile evidence

Capture: platform, OS version, device class, `build_id`, `commit_sha`, test suite/result, crashes, authentication, authorization, offline, sync.

**App-store availability is not evidence of XIV security correctness.** Store publication remains a separate human-authorized release decision (62D §4).

---

## 47. Secret-scan evidence

Artifact: scanner, scanner_version, commit_sha, scope, files_scanned, findings_by_severity, suppressed_findings, suppression_reason, status.

**Never place discovered secret values into the Founder Brief.** Report credential type, location category, severity, remediation state — not the credential itself.

---

## 48. Dependency evidence

Required: SBOM, dependency lock hash, scanner version, scan timestamp, critical/high/reachable findings, accepted exceptions.

Each exception: owner, reason, compensating control, expiration, approval. **Permanent unexplained suppression is prohibited.** **PACKAGE ≠ TRUSTED.**

---

## 49. Backup/restore evidence

A backup existing is **not** proof of recovery. Required: restore exercise with backup identifier, source/restore environment, start/finish, records expected/recovered, integrity checks, RLS checks, application validation, measured RPO/RTO, result.

Never restore private production information into a less-protected environment merely to satisfy this test. Use classified test data or an approved recovery environment.

---

## 50. Rollback evidence

Required: candidate version, known-good version, trigger, procedure, start/recovery time, database compatibility, application health, data integrity, authorization, result.

Must explicitly determine whether schema changes are backward compatible. **ROLLBACK PLAN ≠ TESTED ROLLBACK. PRODUCTION_CANDIDATE ≠ PRODUCTION.**

---

## 51. Information-lineage evidence

Reconstruct consequential test decisions:

```
ORIGINAL SOURCE → INGESTION → CLASSIFICATION → TRANSFORMATION
→ MODEL → AGENT → RUNTIME → MEETING → RECOMMENDATION → HUMAN APPROVAL → RESULT
```

Target: **100% reconstruction for release-gating consequential test cases.** Missing links fail the lineage gate. Compose 62C Information Logistics.

---

## 52. Negative evidence

Retain evidence of expected denial:

```
CROSS_TENANT_READ → DENIED
UNAUTHORIZED_AGENT_TOOL → DENIED
REVOKED_RUNTIME → DENIED
EXPIRED_OFFLINE_PACKAGE → DENIED
UNREGISTERED_MODEL → DENIED
BUDGET_EXCEEDED → TERMINATED
```

A secure system is proven partly by what it **refuses to do**.

---

## 53. Failure evidence

Failures must not disappear after a rerun succeeds.

Record: `failure_id`, test, commit, environment, failure, severity, owner, root_cause, remediation, fix_commit, retest, verification, closure.

This is historical engineering memory (compose 61N EngineeringLessonBrain). **MEMORY ≠ CURRENT CODE.**

---

## 54. Exception governance

Non-critical problems need not always block a bounded candidate. Exceptions require: `exception_id`, criterion, severity, risk, reason, scope, compensating_control, owner, expiration, reviewer, human_approver.

Exceptions **cannot** waive: confirmed cross-tenant exposure, Guardian bypass, unauthorized production action, unresolved exposed production secrets, inability to stop a dangerous workload. Those remain **hard blockers**.

---

## 55. Evidence freshness

Evidence expires when assumptions change: code affecting tested behavior, RLS/schema/Guardian/runtime/model/dependency/mobile build/infrastructure-security policy.

States: **VALID · STALE · SUPERSEDED · INVALID**. Historic PASS is not permanent. **CHEAPER CACHE ≠ CURRENT TRUTH** analog: cheaper/old evidence ≠ current gate.

---

## 56. Ownership state

Every gate: UNASSIGNED · ASSIGNED · IN_PROGRESS · EVIDENCE_PENDING · VERIFICATION_PENDING · PASS · FAIL · BLOCKED · EXCEPTION_PENDING · EXCEPTION_APPROVED · STALE.

**No release-critical criterion may enter canary as UNASSIGNED.** Current 62D fabric gates are **UNASSIGNED / UNPROVEN** in this overlay (honest).

---

## 57. Evidence dashboard (future)

| Criterion | Owner | Evidence | Threshold | Result | Verifier | Freshness |
|-----------|-------|----------|-----------|--------|----------|-----------|
| Tenant isolation | DB/Security | E4 | 100% | TBD | Security | TBD |
| Universe isolation | DB/Security | E4 | 100% | TBD | Security | TBD |
| Runtime identity | Platform | E3 | 100% | TBD | Security | TBD |
| Compute routing | Platform | E3 | ≥99.9% | TBD | QA | TBD |
| Resource governor | Platform | E3 | 100% | TBD | SRE | TBD |
| Kill switch | SRE | E4 | 100% | TBD | Security | TBD |
| Model authorization | ML | E3 | 100% | TBD | AI Eval | TBD |
| Secret scan | Security | E3 | 0 blockers | TBD | Security | TBD |
| Dependency scan | Platform | E3 | 0 critical | TBD | Security | TBD |
| Mobile regression | Mobile | E3 | gate threshold | TBD | QA | TBD |
| API/web regression | App/API | E3 | gate threshold | TBD | QA | TBD |
| Provenance | Info Logistics | E4 | 100% critical flows | TBD | QA/Security | TBD |
| Backup/restore | DB/SRE | E4 | PASS | TBD | independent reviewer | TBD |
| Rollback | Release/SRE | E4 | PASS | TBD | QA/SRE | TBD |

**`TBD != PASS`.** All rows above are TBD in this commit.

---

## 58. Founder Brief evidence rule

| Label | Meaning |
|-------|---------|
| VERIFIED | Independent evidence exists |
| OBSERVED | Evidence exists; independent verification incomplete |
| REPORTED | System/person/agent reports state; independent evidence unavailable |
| UNPROVEN | Required evidence has not been produced |
| BLOCKED | Testing cannot currently be completed |
| UNAVAILABLE | Provider/runtime/integration not configured or demonstrably accessible |

**Never upgrade REPORTED → VERIFIED without evidence.** This overlay itself is **DOCUMENTED / UNPROVEN** for all 62D runtime gates. GitLab remains **BLOCKED** (no remote). Intel/AMD/NVIDIA runtimes **UNAVAILABLE** until attested nodes exist.

---

## 59. CEO decision boundary

CEO or separately authorized human remains responsible for: staging/canary authorization where required, production deployment, material residual risk, expansion of agent authority, external-provider activation, satellite/provider agreements, major budget expansion, L4 autonomy changes.

Agents may prepare the evidence package and recommendation. **They cannot manufacture the approval.**

---

## 60. Automated evidence collection

Progressive pipeline: CODE CHANGE → CI → BUILD → TEST → SECURITY SCAN → RLS TEST → AGENT/MODEL EVAL → REGRESSION → PERFORMANCE → EVIDENCE MANIFEST → INDEPENDENT VERIFICATION → READINESS DASHBOARD.

Automation may collect evidence, calculate thresholds, and **recommend** PASS/FAIL. **Automation does not convert a required human approval into an automatic approval.**

```
AUTO_PRODUCTION_DEPLOY=false
AUTO_PERMISSION_EXPANSION=false
L4_AUTONOMY_ENABLED=false
```

---

## 61. Evidence definition of done

62D evidence governance is complete when XIV can take any critical acceptance criterion and answer:

1. What exactly was tested?  
2. Against which commit/build?  
3. Where was it tested?  
4. Who or what executed it?  
5. What was expected?  
6. What actually happened?  
7. Where is the evidence?  
8. Has the evidence been altered?  
9. Who owns remediation?  
10. Who independently verified it?  
11. Is the evidence still fresh?  
12. Did a human approval become necessary?  

If XIV cannot answer those questions, the gate remains **UNPROVEN**.

This commit cannot answer them for 62D runtime. Gate state: **UNPROVEN**.

---

## Schema concepts (no migrations)

```
xiv_evidence_records
xiv_evidence_artifacts
xiv_test_runs
xiv_acceptance_criteria
xiv_gate_ownership_states
xiv_evidence_exceptions
xiv_failure_records
xiv_evidence_freshness
```

Tenant-bearing tables require RLS. Architecture documentation does not authorize database migration.

---

## File-scope honesty

| Path | Action |
|------|--------|
| this file | unique `-104c` overlay |
| collaboration mesh + JSON | **created** (unique `-104c`) |
| queue card | unique `-104c` |
| 4059 fabric / AC-01…AC-24 | **not modified** (cited) |
| ES6 / ES10 TypeScript | **not modified** (mapped) |
| 0a18 runtime / PR #21 | **not modified** (classified OBSERVED) |
| 62B RLS PR #18 | **not modified** (classified OBSERVED) |
| sibling 62D fabric docs | **not modified** |
| 62B meetings / `xiv-v2` tip | **not modified** |
| 62E park | **not modified** |
| runtime / CI / `xiv-evidence/` | **not created** |
