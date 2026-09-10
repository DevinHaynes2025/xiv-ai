# XIV Test Evidence

Append entries; never delete history. Skipped mandatory tests â‰  pass.

## Template

```
### YYYY-MM-DD â€” STORY_ID â€” worker
- Branch / SHA:
- Commands run:
- Passed:
- Failed:
- Not run:
- Notes:
```

## 2026-09-09 â€” bootstrap â€” grok
- Branch / SHA: `xiv-v2` / `65fa7a0688c63c5d07945ce7e7969185697b6434`
- Commands run: `Invoke-WebRequest http://127.0.0.1:8787/health` (earlier session)
- Passed: health `{"ok":true,"agent":"executive_agent"}` when service started
- Failed: n/a
- Not run: full `npm run test:runtime` (pending EY1)
- Notes: AI service deps present; Ollama not yet installed

### 2026-09-09 ï¿½ EY0-L ï¿½ grok
- Branch / SHA: cursor/ey0-l-local-coding-brain / 87dfb54d0182da8813446d0aa9fcacc970281cdb
- Commands run: created AGENTS.md, .cursor/rules/*, docs/operations/*; git commit
- Passed: files present; commit succeeded (12 files, +408)
- Failed: n/a
- Not run: ollama install (next); full test:runtime (EY1)
- Notes: historical working-tree edits left unstaged by design

### 2026-09-09 ï¿½ EY1 ï¿½ grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (pre-commit tip 2bfa3b5; stories commit follows)
- Commands run: `ollama run qwen2.5-coder:7b`; `npm run test:runtime` in `services/ai`
- Passed: test:runtime exit_code 0 (~106s); all Phase 2* case suites reported passed in log; Ollama model `qwen2.5-coder:7b` listed (4.7GB)
- Failed: none
- Not run: full mobile test suite; EY2 ModelBackend
- Notes: AI health `{"ok":true,"agent":"executive_agent"}`; L4 remains disabled per suite assertions

### 2026-09-09 ï¿½ EY2 ï¿½ grok
- Branch / SHA: cursor/ey0-l-local-coding-brain (commit follows)
- Commands run: `npx tsc --noEmit` in services/ai
- Passed: typecheck after ModelBackend + ollama provider id
- Failed: none
- Not run: live ollama executive turn e2e (optional next)
- Notes: executive-turn routes via model-backend; Metro mock keeps ollama label server-only

### 2026-09-09 ï¿½ EY3 ï¿½ grok
- Commands: added hardware-probe.ts + GET /v1/hardware; typecheck clean
- Notes: GPU via XIV_GPU_* env; NPU honestly undetected; Ollama models listed when reachable
- Roster/schedule/data-plane docs + xiv-data dirs created; weekday 8:30 digest routine saved

### 2026-09-09 ï¿½ US-UNI-01 audit ï¿½ grok
- Hosted Universes present: Isolation Org A/B with active Universes (internal/business)
- RLS isolation covered by prior test:runtime Phase 2H
- Google Drive connector installed; awaiting user auth card
- Salesforce blocked on CLIENT_ID + SALESFORCE_MCP_URL
- Added XIV_COMPUTE_FABRIC.md (classical-first; QPU candidate only)

### 2026-09-09 ï¿½ Google Drive connected ï¿½ grok
- Drive search found XiV Firm Master Blueprint; themes ingested into compute/vision alignment
- Created Drive doc: XIV AI Brain Sync ï¿½ 2026-09-09
- US-UNI-01 audited: TenantDesk/Provider already implement picker + context

### 2026-09-09 â€” US-EXE-01 â€” grok
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

## 62L-EZ / #175 â€” sync + Ollama smoke (2026-09-09 20:08 CT)
- Story: GitHub #175 / 62L-EZ
- Branch: `grok/62l-ez-shared-agent-context`
- Base: `xiv-v2` @ `60986682`
- Commands: `git fetch origin`; `git fetch gitlab`; `git switch xiv-v2`; `git pull --ff-only origin xiv-v2`; `git push gitlab xiv-v2:xiv-v2` (accepted); `ollama --version`; `ollama list`; `GET /api/tags`; `POST /api/generate` qwen2.5-coder:7b
- Result: LOCAL=GITHUB=GITLAB=60986682; TREE clean; Ollama reply OK (~9s)
- PASS: git sync + local model heartbeat
- NOT claimed: AMD GPU acceleration VERIFIED; NPU VERIFIED; OFFLINE_AGENT_VERIFIED=true (needs worker contract + heartbeat process)
## 62L-EZ Supabase schema inventory
- PASS: public list_tables only; RLS noted; no secrets schemas queried

## 2026-09-09 20:14 CT â€” 62L-EZ local coding worker heartbeat+smoke â€” grok
- Branch / SHA: `grok/62l-ez-shared-agent-context` (commit follows)
- Commands run:
  - `npx tsc --noEmit` in `services/ai` (exit 0)
  - Restarted `npm start` on :8787 with new routes
  - `GET http://127.0.0.1:8787/v1/local-worker/heartbeat`
  - `POST http://127.0.0.1:8787/v1/local-worker/smoke` (real Ollama `localhost:11434`)
- Passed:
  - Heartbeat pre-smoke: connectivity=online; ollamaVersion=0.33.3 DETECTED; model qwen2.5-coder:7b DETECTED; actualDevice=UNKNOWN/NOT_TESTED; offlineAgentVerified=false (no smoke yet)
  - Smoke receipt: result=ok; responsePreview=OK; latencyMs=6529; evalCount=2; memory totalBytes~33.6GB
  - Post-smoke heartbeat: offlineAgentVerified=true (computed from tags+model+smoke ok) â€” not a static env constant
- Failed: none
- Not run: AMD GPU acceleration proof; NPU probe; full test:runtime
- Notes: GPU device path remains NOT_TESTED/UNKNOWN; do not claim Vulkan/DirectML VERIFIED. xiv-v2 left alone.

## 2026-09-09 ~22:24 CT â€” mobileâ†”ai TS boundary â€” grok
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

## 2026-09-09 ~22:55 CT - US-CON-01 consumer innovate / early access - grok
- Branch / SHA: grok/us-con-01-consumer-innovate / 74c402a5c29f963e230b12db23bbe48f0876544f
- Commands run: services/ai typecheck; npx tsx consumer-innovate.test.ts; apps/mobile npx tsc --noEmit
- Passed: named consumer handle (â‰  employee anonymous alias prefixes); submitConsumerIdea proposalOnly; listConsumerInnovateChannel WAITING_DATA when unbound + empty; acceptanceMetrics always WAITING_DATA (never fabricated); optional xiv_consumer_ideas persistence; Universe/org tenant scope filter; consumer innovate.tsx + early-access route; L4 false; productionMutation false
- Failed: none
- Not run: device e2e; hosted xiv_consumer_ideas table apply
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip 92efdee (US-EMP-01)

## 2026-09-09 ~23:00 CT - US-SYS-01 System Navigator CSV/commerce demo - grok
- Branch / SHA: grok/us-sys-01-system-navigator / 4401c153613c57571d2bfc95c9868fa65e0d3396
- Commands run: services/ai typecheck; npx tsx system-navigator.test.ts; apps/mobile npx tsc --noEmit
- Passed: connector stubs (not live ERP); listSystemNavigatorView WAITING_CONNECTOR when unbound with null commerce totals; loadCommerceCsvDemo surfaces DEMO_CSV only; parseCommerceCsvDemo; L4 false; productionMutation false; mobile SystemsNavigator + CommerceCsvDemoScreen; never fabricate metrics
- Failed: none
- Not run: device e2e; live ERP connector (intentionally out of scope)
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip 52f06a6 (US-CON-01)


## 2026-09-09 ~23:10 CT - US-SEC-01 Security Center policy denials - grok
- Branch / SHA: grok/us-sec-01-security-center / df3f31d1eb8e98972b9c757a21d8d8631093f1ea
- Commands run: services/ai typecheck; npx tsx security-center.test.ts; apps/mobile npx tsc --noEmit
- Passed: Guardian read-only check catalog; listSecurityCenterView WAITING_DATA when unbound with denials=null and incidents=null; recordPolicyDenial only for verdict=denied; probeKnownPolicyDenials surfaces real evaluatePolicy denials as SESSION_DENIALS; requires_approval not recorded as denial; L4 false; liveExploitTooling false; productionMutation false; mobile SecurityCenterScreen + PolicyDenialsScreen; never fabricate incidents
- Failed: none
- Not run: device e2e; host guardian:validate suite from mobile (intentionally out of scope — read-only catalog only)
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip 6cbef82 (US-SYS-01)


## 2026-09-09 ~23:15 CT - US-SOC-01 Profiles + business articles feed - grok
- Branch / SHA: grok/us-soc-01-profiles-articles / 7c0a1ff37a153c337a6a96a8385b95e5d8126b65
- Commands run: services/ai typecheck; npx tsx profiles-articles.test.ts; apps/mobile npx tsc --noEmit
- Passed: listProfilesArticlesView WAITING_DATA when unbound with profiles=null articles=null engagement WAITING_DATA; loadPrototypeProfilesArticlesFeed surfaces PROTOTYPE_DEMO daily profiles+articles; engagement likes/views/shares/followers/comments always null; L4 false; liveSocialMetrics false; productionMutation false; mobile ProfilesArticlesFeedScreen + BusinessArticlesFeedScreen; never fabricate live social metrics
- Failed: none
- Not run: device e2e; live social network ingest (intentionally out of scope)
- Notes: historical/* and sec-status left alone; did not checkout xiv-12d or touch dimensional/*; parent tip 1b60ad0 (US-SEC-01)

