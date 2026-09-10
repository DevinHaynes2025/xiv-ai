# XIV Test Evidence

Append entries; never delete history. Skipped mandatory tests ≠ pass.

## Template

```
### YYYY-MM-DD — STORY_ID — worker
- Branch / SHA:
- Commands run:
- Passed:
- Failed:
- Not run:
- Notes:
```

## 2026-09-09 — bootstrap — grok
- Branch / SHA: `xiv-v2` / `65fa7a0688c63c5d07945ce7e7969185697b6434`
- Commands run: `Invoke-WebRequest http://127.0.0.1:8787/health` (earlier session)
- Passed: health `{"ok":true,"agent":"executive_agent"}` when service started
- Failed: n/a
- Not run: full `npm run test:runtime` (pending EY1)
- Notes: AI service deps present; Ollama not yet installed

### 2026-09-09 � EY0-L � grok
- Branch / SHA: cursor/ey0-l-local-coding-brain / 87dfb54d0182da8813446d0aa9fcacc970281cdb
- Commands run: created AGENTS.md, .cursor/rules/*, docs/operations/*; git commit
- Passed: files present; commit succeeded (12 files, +408)
- Failed: n/a
- Not run: ollama install (next); full test:runtime (EY1)
- Notes: historical working-tree edits left unstaged by design

### 2026-09-09 � EY1 � grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (pre-commit tip 2bfa3b5; stories commit follows)
- Commands run: `ollama run qwen2.5-coder:7b`; `npm run test:runtime` in `services/ai`
- Passed: test:runtime exit_code 0 (~106s); all Phase 2* case suites reported passed in log; Ollama model `qwen2.5-coder:7b` listed (4.7GB)
- Failed: none
- Not run: full mobile test suite; EY2 ModelBackend
- Notes: AI health `{"ok":true,"agent":"executive_agent"}`; L4 remains disabled per suite assertions

### 2026-09-09 � EY2 � grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (commit follows)
- Commands run: `npx tsc --noEmit` in services/ai
- Passed: typecheck after ModelBackend + ollama provider id
- Failed: none
- Not run: live ollama executive turn e2e (optional next)
- Notes: executive-turn routes via model-backend; Metro mock keeps ollama label server-only

### 2026-09-09 � EY3 � grok
- Commands: added hardware-probe.ts + GET /v1/hardware; typecheck clean
- Notes: GPU via XIV_GPU_* env; NPU honestly undetected; Ollama models listed when reachable
- Roster/schedule/data-plane docs + xiv-data dirs created; weekday 8:30 digest routine saved

### 2026-09-09 � US-UNI-01 audit � grok
- Hosted Universes present: Isolation Org A/B with active Universes (internal/business)
- RLS isolation covered by prior test:runtime Phase 2H
- Google Drive connector installed; awaiting user auth card
- Salesforce blocked on CLIENT_ID + SALESFORCE_MCP_URL
- Added XIV_COMPUTE_FABRIC.md (classical-first; QPU candidate only)

### 2026-09-09 � Google Drive connected � grok
- Drive search found XiV Firm Master Blueprint; themes ingested into compute/vision alignment
- Created Drive doc: XIV AI Brain Sync � 2026-09-09
- US-UNI-01 audited: TenantDesk/Provider already implement picker + context

### 2026-09-09 — US-EXE-01 — grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (commit follows)
- Commands run: rewrote `apps/mobile/src/app/executive/health.tsx`; `Invoke-WebRequest http://127.0.0.1:8787/health` (service ok in session)
- Passed: health screen no longer imports `@/data/mock`; mounts `probeAiService` + `runLiveHealth` (`analyzeLiveBusinessHealth`); shows `WAITING_DATA` / blank score when disconnected; `DataStatusMark` + `GovernedHealthResult` for honest status; CRM_ALTERNATIVES.md + XIV_SUPERVISION.md included (parent); historical/* left unstaged
- Failed: none
- Not run: device e2e on Expo; authenticated `GET /v1/business/health` from device
- Notes: L4 remains false; recommendation labeled requiresApproval; score only numeric when `dataStatus === 'live'`

### 2026-09-09 - US-EXE-02 - grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (commit follows)
- Commands run: wired executive story + executive-briefs to LiveStoryBriefScreen (runLiveBrief / summarizeLiveExecutiveBrief); enhanced buildExecutiveBrief criticalChanges from live findings; health probe when service up
- Passed: live governed brief path (not mock DEMO); WAITING_DATA when AI/source unavailable; empty change/why not fabricated; requiresApproval labeled; L4 false; Salesforce skipped; Founder Twin non-approving per XIV_SUPERVISION.md
- Failed: none
- Not run: device e2e on Expo; authenticated business brief from device
- Notes: historical/* and sec-status.ts left unstaged; PremiumStory + WorkspaceExecutiveBriefs share LiveStoryBriefScreen

## 62L-EZ / #175 — sync + Ollama smoke (2026-09-09 20:08 CT)
- Story: GitHub #175 / 62L-EZ
- Branch: `grok/62l-ez-shared-agent-context`
- Base: `xiv-v2` @ `60986682`
- Commands: `git fetch origin`; `git fetch gitlab`; `git switch xiv-v2`; `git pull --ff-only origin xiv-v2`; `git push gitlab xiv-v2:xiv-v2` (accepted); `ollama --version`; `ollama list`; `GET /api/tags`; `POST /api/generate` qwen2.5-coder:7b
- Result: LOCAL=GITHUB=GITLAB=60986682; TREE clean; Ollama reply OK (~9s)
- PASS: git sync + local model heartbeat
- NOT claimed: AMD GPU acceleration VERIFIED; NPU VERIFIED; OFFLINE_AGENT_VERIFIED=true (needs worker contract + heartbeat process)
## 62L-EZ Supabase schema inventory
- PASS: public list_tables only; RLS noted; no secrets schemas queried

## 2026-09-09 20:14 CT — 62L-EZ local coding worker heartbeat+smoke — grok
- Branch / SHA: `grok/62l-ez-shared-agent-context` (commit follows)
- Commands run:
  - `npx tsc --noEmit` in `services/ai` (exit 0)
  - Restarted `npm start` on :8787 with new routes
  - `GET http://127.0.0.1:8787/v1/local-worker/heartbeat`
  - `POST http://127.0.0.1:8787/v1/local-worker/smoke` (real Ollama `localhost:11434`)
- Passed:
  - Heartbeat pre-smoke: connectivity=online; ollamaVersion=0.33.3 DETECTED; model qwen2.5-coder:7b DETECTED; actualDevice=UNKNOWN/NOT_TESTED; offlineAgentVerified=false (no smoke yet)
  - Smoke receipt: result=ok; responsePreview=OK; latencyMs=6529; evalCount=2; memory totalBytes~33.6GB
  - Post-smoke heartbeat: offlineAgentVerified=true (computed from tags+model+smoke ok) — not a static env constant
- Failed: none
- Not run: AMD GPU acceleration proof; NPU probe; full test:runtime
- Notes: GPU device path remains NOT_TESTED/UNKNOWN; do not claim Vulkan/DirectML VERIFIED. xiv-v2 left alone.

## 2026-09-09 ~22:24 CT — mobile↔ai TS boundary — grok
- See docs/operations/XIV_TEST_EVIDENCE_NOTE_TS_BOUNDARY.md (isomorphic checkpoint; tenant barrel without Node review re-exports; mobile durable excludes). Local typecheck/runtime/mobile tsc verification follows on local/offline-build-recovery.


## 2026-09-09 ~22:40 CT - US-AGT-01 propose+approval wire - grok
- Branch / SHA: grok/us-agt-01-supplier-sim-propose (commit follows)
- Commands run: services/ai typecheck; npx tsx supplier-simulation.test.ts; apps/mobile npx tsc --noEmit
- Passed: propose simulate_supplier_reallocation requiresApproval; reject path; approve runs prototype simulation only; Scenario Lab WAITING_SESSION / WAITING_APPROVAL / WAITING_DATA labels; L4 false; SIMULATION_NOT_PRODUCTION
- Failed: none
- Not run: device e2e; US-AGT-02 persisted ai_agent_approvals audit UI
- Notes: historical/* and sec-status left alone; parent recovery tip b7c9b4e5


## 2026-09-09 ~22:45 CT - US-AGT-02 approval+audit trail - grok
- Branch / SHA: grok/us-agt-02-approval-audit (commit follows)
- Commands run: services/ai typecheck; npx tsx approval-audit.test.ts; npx tsx supplier-simulation.test.ts; apps/mobile npx tsc --noEmit
- Passed: listApprovalAuditTrail WAITING_DATA when unbound; approve/deny writes session + governed audit + persistApproval/persistAudit path; Scenario Lab ApprovalAuditPanel; durable listPersistedApprovals/listPersistedAuditEvents with WAITING_DATA; L4 false; no production write without approval
- Failed: none
- Not run: device e2e; hosted Supabase table apply
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip 631f86f (US-AGT-01)


## 2026-09-09 ~22:50 CT - US-EMP-01 anonymous employee feedback - grok
- Branch / SHA: grok/us-emp-01-anonymous-feedback (commit follows)
- Commands run: services/ai typecheck; npx tsx employee-feedback.test.ts; apps/mobile npx tsc --noEmit
- Passed: alias-only payload strips displayName/legalName/email; listEmployeeFeedbackChannel WAITING_DATA when unbound + empty; submit session memory + optional xiv_employee_feedback persistence; Universe/org tenant scope filter; employee feedback.tsx + ideas route; L4 false; no fabricated durable rows
- Failed: none
- Not run: device e2e; hosted xiv_employee_feedback table apply
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip f20b70a (US-AGT-02)
