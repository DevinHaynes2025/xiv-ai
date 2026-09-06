# XIV Live Data Integration

## Status

| Piece | Maturity |
| --- | --- |
| Authorized session records (profile + agent activity) | IMPLEMENTED |
| HTTP `/health` connection probe | IMPLEMENTED |
| Live Business Health from session records | IMPLEMENTED (technology context only) |
| Live Executive Intelligence Brief | IMPLEMENTED (no invented financial impact) |
| ERP / WMS / TMS | NOT CONFIGURED / PLANNED |
| Silent live → prototype fallback | FORBIDDEN |

## What is actually available

Real records, when the signed-in user can read them:

- `profile_identity` — company, industry, professional title already on the owner profile
- `agent_activity` — count and latest timestamp of `ai_agent_actions` under owner RLS

These are **not** warehouse, SLA, or finance facts. They are labeled technology / identity context.

If the activity table is missing, the reader fails closed and does not invent rows.

## Flow

```
Live Adapter
  → Company Data Gateway
  → Context Provider
  → Domain Findings
  → Story Engine
  → Business Health Report
  → Executive Intelligence Brief
```

Observed claims require real evidence. Inferred / hypothesized / recommended labels stay on beats.

Prototype findings never appear in a live report unless the user is explicitly on a prototype button.

## Server endpoints

Auth required. No raw adapter access. No secrets.

| Route | Status |
| --- | --- |
| `GET /v1/business/source/status` | IMPLEMENTED (connection health + domain map) |
| `GET /v1/business/health` | IMPLEMENTED (no prototype fallback) |
| `GET /v1/business/executive-brief` | IMPLEMENTED |
| `POST /v1/executive/turn` | UNCHANGED (Gemini path) |

Session-record reads stay on the mobile authorized reader. The AI service process reports `sessionRecords: not_configured` rather than inventing them.
