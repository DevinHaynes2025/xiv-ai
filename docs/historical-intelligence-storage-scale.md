# Historical intelligence storage scale (design only)

**Status: DESIGNED. Not LIVE. Not current capacity.**

XIV must not store trillions of business events in Supabase/PostgreSQL alone.

## Future plane separation

| Plane | Role |
| --- | --- |
| transactional PostgreSQL | Tenant records, memberships, billing, module installs |
| object / data lake | Filings, documents, media, cold historical extracts |
| analytics warehouse / lakehouse | Macro series, aggregates, Time Machine scans |
| event streaming | Real-time signals (when a provider is actually configured) |
| vector / search | Similarity retrieval with provenance filters |
| graph / knowledge | Entity relationships after evidenced resolution |
| caches | Hot reads, never a system of record |
| cold / archive | Retention and recovery copies |

## Event-scale milestones (targets, not claims)

- 1 million
- 100 million
- 1 billion
- 100 billion
- 1 trillion+

Phase 2I-D uses an **in-memory append-only ledger**. It does not persist to hosted tenant tables and does not change RLS.
