# XIV 12D-06 — AI Team Council + Adaptive Story Prioritization

**Ticket:** 12D-06  
**Branch:** `grok/12d-06-adaptive-story-council`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Ingest:** `origin/xiv-12d-dimensional-fabric` @ `2804115e` (Million-Scale Story Factory + Debrief Council; GL mirror `9bf99c24`)  
**Prior:** 12D-05 @ `5d91f1e0`  
**State:** research / feature branch — virtual queue triage + learning stubs  
**L4 / production auto:** false

## Guardrails

| Flag | Value |
|------|-------|
| productionAutoMerge | false |
| productionAutoDeploy | false |
| destructiveDbAutoApply | false |
| crossTenantDataCopyAllowed | false |
| secretExfiltrationAllowed | false |
| agentDebriefRequired | true |
| evidenceBeforeDone | true |
| cloudAgentsDefaultWaitingIfUnbound | true |

## Debate score axes

`customerValue`, `technicalRisk`, `cost`, `security`, `dependencies`, `evidenceQuality`

Business-bar aligned (adoption / reliability / security / unit economics / customer value). No valuation theater.

## Provider honesty

| Seat | Behavior |
|------|----------|
| LOCAL_RULES | Deterministic offline scorer — always READY |
| OLLAMA | Optional; OPTIONAL_OFFLINE when unreachable |
| GROK / CHATGPT / GEMINI | WAITING_PROVIDER when unbound |

## Deliverables

| Module | Role |
|--------|------|
| `priority-scores.ts` | LOCAL_RULES deterministic scorer + composite |
| `adaptive-council.ts` | Multi-agent debate, queue reprioritization, debrief learning |
| `12d06.test.ts` | Contract tests |
| Ingested `storyfactory/*` | Virtual story generator, assignment orchestrator, debrief council |

## Tests

```bash
cd services/ai
npx tsx runtime/storyfactory/storyfactory.test.ts
npx tsx runtime/storyfactory/12d06.test.ts
npx tsx runtime/dimensional/12d05.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.