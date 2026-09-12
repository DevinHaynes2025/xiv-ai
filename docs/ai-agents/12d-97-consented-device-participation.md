# 12D-97: consented device participation and optional personal representatives

## What this implements

A bounded JSON policy assessor and stdin CLI using the existing 12D-45 device enrollment validator. It adds missing expiry, consent purpose/version, user/tenant/device/subject binding, revocation/pause, freshness, local-only routing and device-resource checks. It neither authenticates supplied claims nor runs a model, worker, shell, enrollment service, profile copier or training job. A favorable result is POLICY_ELIGIBLE_NOT_STARTED and operationalAuthorizationGranted remains false.

The existing validator accepts expired enrollments; a regression test reproduces that issue and proves this NEW path rejects it. Older callers remain unchanged and must migrate before claiming the gap is closed everywhere. The older CONFIDENTIAL-routing inconsistency is also not repaired here.

Inputs are capped at 16 KiB and unknown fields are rejected. Proposed task bounds are one inference at a time, 512 output tokens and 120 seconds. Consent and device snapshots require checks within five minutes. The assessment expires at the earliest dependency expiry or 60 seconds. A downstream executor must re-evaluate at dispatch and enforce the minimum of task and consent/assessment deadlines; this module cannot cancel a real process. Offline revocation originating on another device is NOT immediately knowable. Stale cached authorization blocks; do not manufacture a fresh checkedAtMs or silently renew consent.

Background work requires both separate consent and OS allowance. CPU/GPU/NPU and OS labels are supplied claims, not an attestation or compatibility test. Unknown runtime/thermal states, missing local model, inadequate memory, low battery off charger, stale evidence and cloud requests block. Product access must not depend on volunteering compute or accepting a personal representative. No continuous worker or second daemon is installed.

## Personal representatives and education

PERSONAL_REPRESENTATIVE requires an explicit purpose and matching authenticated user, subject and profile-owner context. This is an optional AI assistant based only on approved material, not a copy of a person's consciousness or identity. No face/voice cloning, bulk user copying, employer surveillance, contacts export or external impersonation occurs. Real consent provenance, revocation storage, deletion/export and clear AI labeling in the UI are still required before launch.

EDUCATIONAL_PRACTICE is a separate opt-in purpose for synthetic exercises. It does not authorize model-weight changes, promotion of unreviewed memory, an accredited university, or actual quantum computing. If 'XIV Quantum University' becomes branding, distinguish it from the master plan's existing XIV Academy educational-sandbox program and from any accreditation or hardware claims.

## Source basis and current divergence

Newly supplied Investor Edition (8) is byte-identical to edition (7): SHA-256 891b6ad7830fab8fedac99a14aa84451adb7d0d2035a23468a4ee8d12e60ac7c. This records provenance, NOT activation approval. The older meeting pin remains d66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c and is not altered.

Source requirements: master pages 27/30/31 specify least privilege, separate recommendation/authorization/execution, tenant isolation and privacy; page 49 specifies XIV Academy sandboxes; page 60 describes Founder AI as governed and explicitly not an uncontrolled clone; page 64 describes infrastructure partnerships as research, not existing access. Applying personal representatives to every opt-in user is a NEW proposal, not a current feature asserted by those pages.

Three independent branches share the label 12D-96:

| Branch suffix | Last inspected SHA | Scope |
|---|---|---|
| sparse-atomic-workforce | 6e20b3beef307377de2e190e69487c8f6237bc77 | MR !16: 100 supplemental templates, trillion logical addresses per tenant; no running-agent claim |
| enterprise-workforce-queue | 2ff023526a56294b7426e5e317963d32fa0fc7d0 | Different 100-profile catalog including 21 core references and 79 specializations; SQLite ordinary backlog and untrusted research summaries |
| shared-host-lease-contract | 13fdb2bef5cef4ef221b78ab37dff38e70d69e00 | MR !15: shared lease contract not yet adopted by host runtimes |

12D-97 builds only on sparse-atomic-workforce. The three branches are NOT merged. Do not add overlapping role counts or claim the queue/lease is active on Windows. Resolve canonical catalog IDs and code lineage before integrating the queue. A trillion IDs is not a trillion running models; task-count growth does not establish billion-user readiness.

## Validation and reviewer handoff

Local Node 22.16.0/TypeScript 5.8.3 strict scoped compilation and 31 tests passed. Tests use synthetic user, consent, device and hardware claims. The CLI was executed with a synthetic favorable fixture (exit 0) and revoked fixture (exit 2). No real consent or hardware was authenticated. Full repository CI must be checked at the final commit, not inferred from prior pipelines.

In an isolated checkout with already approved locked dependencies, from services/ai:

```text
npm run typecheck
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/device-participation-assessment.test.ts
```

The CLI reads a finite JSON document from stdin; it is not a daemon. Never pipe credentials or real personal data into review logs. Return actual tool/provider/model, exact reviewed SHA, exit codes and dissent. Do not claim independent review from multiple role labels on one model.

Keep private source in private GitLab. Preserve normal safety/dependency approval and stop on a denial. No merging, deployment, user enrollment, device/driver changes, model calls, cloud spending, operational-key generation or learning promotion is authorized by this assessment.

## Proposed bounded integration queue (not scheduled workers)

1. CATALOG-RECONCILE: map the two 100-role catalogs without double-counting. Acceptance: stable canonical IDs, explicit aliases, no increased live count, joint tests across selected lineage.
2. CONSENT-UI: separate access to XIV from optional local compute and optional representative creation. Acceptance: defaults off, each purpose explained, pause/revoke/delete/export controls, tenant-safe authenticated persistence and no hidden sensitive capture.
3. HOST-LEASE-ADOPTION: integrate the existing shared lease contract into ONE existing runtime before overlapping host work. Acceptance: expiry and ignored cancellation cannot admit a second request; no new daemon.
4. LOCAL-E2E: one supervised ordinary-data task from the bounded queue through Ollama, scoped presence, tests, independent review and CEO UI. Acceptance: actual model identity, request/latency evidence, no cloud fallback, fresh revocation checks and visible pending reviews.
5. DEVICE-MATRIX: test one desktop and one phone build against real background, battery, memory and offline/reconnect behavior. Acceptance: documented support matrix, unsupported devices remain client-only, no 'every chip' claim.

## Primary external research (not ingested training data)

Android WorkManager constraints: https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work
Apple background launch is OS-controlled: https://developer.apple.com/documentation/backgroundtasks/bgtaskrequest/earliestbegindate
ONNX hardware-specific execution providers: https://onnxruntime.ai/docs/execution-providers/QNN-ExecutionProvider.html and https://onnxruntime.ai/docs/execution-providers/Vitis-AI-ExecutionProvider.html
GPS positioning/navigation/timing: https://www.gps.gov/gps

These sources inform the design; no runtime/library is installed. Internet connectivity is not permission to execute on satellites. Source retrieval does not train the model or establish Starlink/AMD/ARM partnerships.
