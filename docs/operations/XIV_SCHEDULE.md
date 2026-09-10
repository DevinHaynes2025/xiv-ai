# XIV Build Schedule (America/Chicago)

Honest cadence — not fake “always mining trillions.”

## Standing cadence
| When | What | Owner |
|------|------|-------|
| Weekdays 08:30 | Build digest: tip SHA, open stories, test evidence delta, blockers | Grok routine |
| Weekdays during work | Execute **one** top story (EY* then US-*) | Local / Grok |
| After each story | Update CURRENT_STATE, TEST_EVIDENCE, DECISION_LOG | Executing agent |
| When online | Sync ChatGPT stories into MASTER_USER_STORY_QUEUE | Human paste → Grok |
| When Ollama up | Prefer `OFFLINE_PREFER_LOCAL` for executive experiments | Local |

## Near-term sprint (next 14 days)
1. **EY3** — Hardware probe API (CPU/GPU/NPU/Ollama)
2. **US-UNI-01** — Universe login / membership proof path
3. **US-EXE-01** — Executive Home + Business Health
4. **US-AGT-01/02** — Propose + approve + audit
5. **Data plane v0** — Local corpus folder + catalog schema (no trillion claims); Google Drive/GCS later as authorized connectors
6. Connect Salesforce when ready; Oracle via AWS path when earned

## Storage plan (ASUS ~1TB target)
| Path (proposed) | Purpose |
|-----------------|---------|
| `C:\Users\Devin\xiv-ai\` | Source of truth |
| `C:\Users\Devin\xiv-data\corpus\` | Approved offline packs / datasets (cataloged) |
| `C:\Users\Devin\xiv-data\models\` | Local model weights cache |
| Cloud object store | GCS/S3/Azure Blob — only after auth + retention policy |

Never copy secrets into corpus. Classify data PUBLIC→SECRET per NOTICE.
