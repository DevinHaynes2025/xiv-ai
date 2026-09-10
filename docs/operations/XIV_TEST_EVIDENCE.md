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