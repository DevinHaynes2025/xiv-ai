# XIV Build Schedule (America/Chicago)

Honest cadence — not fake “always mining trillions.”

## Standing cadence
| When | What | Owner |
|------|------|-------|
| Weekdays 08:30 | Build digest: tip SHA, open stories, test evidence delta, blockers | Grok routine |
| Weekdays during work | Execute **one** top story (EY* then US-* / product follow-ups) | Local / Grok |
| After each story | Update CURRENT_STATE, TEST_EVIDENCE, DECISION_LOG, HANDOFF | Executing agent |
| When online | Sync ChatGPT stories into MASTER_USER_STORY_QUEUE | Human paste → Grok |
| When Ollama up | Prefer `OFFLINE_PREFER_LOCAL` for executive experiments | Local |

## Near-term sprint (after EY3)
1. **Architecture Reader wire** — from 12D-08 FOLLOW_UP (product lane; do not mutate xiv-ai-12d checkout)
2. Offline snapshot / cache consumer polish if queued
3. Salesforce / Drive connectors only when credentials authorized
4. Data plane v0 corpus packs with founder approval

## Storage plan (ASUS ~1TB target)
| Path (proposed) | Purpose |
|-----------------|---------|
| `C:\Users\Devin\xiv-ai\` | Source of truth (offline product lane) |
| `C:\Users\Devin\xiv-data\corpus\` | Approved offline packs / datasets (cataloged) |
| `C:\Users\Devin\xiv-data\models\` | Local model weights cache |
| Cloud object store | GCS/S3/Azure Blob — only after auth + retention policy |

Never copy secrets into corpus. Classify data PUBLIC→SECRET per NOTICE.
