# XIV Master User Story Queue

Priority order for agents. Only the top authorized story should be in active implementation unless handoff says otherwise.

Stories need: persona, goal, acceptance criteria, APIs/screens, evidence plan.
No story may weaken Guardian/RLS or enable L4.

## Now
| ID | Title | Owner lane | Status |
|----|-------|------------|--------|
| **EY0-L** | Local Coding Workforce + Unified Agent Context Spine | Local / Grok | DONE (branch pushed; PR pending token write scope) |
| **EY1** | Release & Runtime Verification Gate | Local / Grok | DONE |
| **EY2** | ModelBackend Phase 0 (gemini | openai | ollama) | Local / Grok | DONE |
| **EY3** | Hardware capability probe (CPU/GPU/NPU/ollama) | Local / Grok | QUEUED |

## Product epics (queued â€” master plan aligned)
| ID | Title | Persona | Notes |
|----|-------|---------|-------|
| US-UNI-01 | Universe login + membership gate | Executive | DONE (core); device e2e pending |
| US-EXE-01 | Executive Home + Business Health score | Executive | DONE (live wire + WAITING_DATA; CRM alts doc) |
| US-EXE-02 | Story Engine brief (what changed / why) | Executive | DONE (live runLiveBrief + WAITING_DATA; Founder Twin guidance-only) |
| US-AGT-01 | AI Workforce: propose supplier simulation | Executive | WIRED propose+approval (branch); requiresApproval=true; L4 false |
| US-AGT-02 | Agent approval + audit trail | Executive | ai_agent_approvals / audit_events |
| US-EMP-01 | Anonymous employee feedback channel | Employee | alias only; no legal name leak |
| US-CON-01 | Consumer innovate / early access loop | Consumer | Structured ideas into Universe |
| US-SYS-01 | System Navigator CSV/commerce demo | Executive | Connector stub, not live ERP |
| US-SEC-01 | Security Center: policy denials visible | Executive | Guardian read-only checks |
| US-SOC-01 | Profiles + business articles feed (daily) | Consumer/Business | Prototype content pipeline |
| US-NET-01 | Supplier / manufacturer directory search | Business | Search index stub + RLS |
| US-PLG-01 | Plugin marketplace install (signed) | Builder | In-memory â†’ signed packages later |

## Done / parked
| ID | Notes |
|----|-------|
| Inventory | Monorepo + Supabase schema mapped (2026-09-09) |
| Ollama | `qwen2.5-coder:7b` pulled on ASUS (2026-09-09) |

## Rules
- ChatGPT may author US-MOB / US-* detail; Grok executes EY* + backend; local Ollama implements offline.
- Sync via Git + this queue, not chat memory.


