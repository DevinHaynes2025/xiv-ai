# 2I-AI-62C — Knowledge Schema Reconciliation

**Story:** 2I-AI-62C — XIV Historical, Cultural & Multilingual Intelligence Network
**Status:** QUEUED ARCHITECTURE — NOT IMPLEMENTED
**Scope of this document:** the §26 database slice only.

## What this document is

The full 62C narrative — XCKG, XLIN, XCCE, XTIE, the contradiction engine, the
knowledge supply chain and the rest of the twenty-eight sections — is specified
in `xiv-2i-ai-62c-historical-cultural-multilingual-intelligence-network.md`.
This document does not restate it.

This document covers one thing that specification does not: **§26 names fifteen
tables, two of them are concepts 62A already planned under different names, and
none of the fifteen exist yet.** That makes the naming fork preventable right
now, which it will not be once a migration lands.

## Why this is worth doing before the migration and not after

The same situation already occurred in this series and was not caught in time.

62A's engineering slice planned a meeting table. 62B independently planned a
meeting table. Neither story referenced the other's name. Both shipped. The tip
now carries two parallel families:

| Concept | 62A slice / mission control | 62B, landed |
| --- | --- | --- |
| Meeting | `agent_meetings` | `xiv_agent_meetings` |
| Participant | `agent_meeting_participants` | `xiv_agent_meeting_participants` |
| Message | `agent_meeting_messages` | `xiv_agent_meeting_messages` |

Nothing about that fork was a mistake in either story read on its own. It
happened because two specifications named one concept differently and the
collision only became visible after both had been implemented, at which point
resolving it means a data migration rather than an edit to a table name.

62C is at the point where 62B was before it landed.

## The two collisions, stated exactly

Neither name exists in `supabase/migrations` today. Both are planned only.

| Concept | 62A slice 1 calls it | 62C §26 calls it |
| --- | --- | --- |
| Knowledge source registry | `agent_knowledge_sources` | `xiv_knowledge_sources` |
| Lineage chain | `knowledge_lineage` | `xiv_knowledge_lineage` |

These are the same two concepts, not two pairs of related ones. 62A §26 describes
its knowledge source table as the record of where an agent's information came
from; 62C §3 describes `source_id` on the historical knowledge record as exactly
that. 62A's lineage table and 62C §17's lineage path are one chain.

**This needs a founder decision before either story is implemented.** The
decision is only a choice of name, and it is cheap now. The options:

1. **Adopt the `xiv_` names.** Consistent with everything else 62B landed and
   with the whole of 62C §26. 62A's slice-1 entries become aliases in its
   documentation. Recommended.
2. **Adopt the unprefixed names.** Consistent with the older mission-control
   tables, inconsistent with the rest of the 62 series.
3. **Declare them genuinely different concepts.** Requires stating what
   distinguishes an agent knowledge source from a knowledge source, which
   neither specification currently does.

Until this is resolved, `unresolvedNameCollisions()` in
`services/ai/runtime/queued/2i-ai-62c.ts` returns both pairs and the contract
test asserts the count is exactly two. The count drops to zero when the decision
is recorded, so the reconciliation cannot be silently skipped.

## Tenant-bearing versus reference data

§26 closes with "tenant-bearing structures require RLS", which leaves open which
of the fifteen are tenant-bearing. That is not a detail that can be deferred to
implementation, because it fails in both directions:

- Mark shared reference data tenant-bearing, and every organization has to
  re-import the historical record before its agents can reason about Rome.
- Mark tenant data global, and private organizational knowledge lands in a
  shared layer, which §16 forbids in as many words.

The split below is encoded in `KNOWLEDGE_SCHEMA_PLAN` with a rationale per table.

**Tenant-bearing (10) — require tenant + Universe RLS:**

`xiv_knowledge_sources`, `xiv_knowledge_objects`, `xiv_knowledge_versions`,
`xiv_knowledge_claims`, `xiv_knowledge_contradictions`,
`xiv_knowledge_translations`, `xiv_knowledge_lineage`,
`xiv_agent_knowledge_access`, `xiv_knowledge_evaluations`,
`xiv_knowledge_quarantine`

The governing rule is that anything holding a claim, deriving from one, or
recording who may read one inherits the access class of the claim. A translation
of private content is private content. Lineage is especially sensitive because it
reveals which decision depended on which source even when the source row itself
is unreadable.

**Shared reference (5) — no tenant column:**

`xiv_civilizations`, `xiv_historical_periods`, `xiv_languages`,
`xiv_professions`, `xiv_knowledge_domains`

No tenant owns a civilization, a language, or the taxonomy of professional
domains from §6. These are registries the whole platform reads.

Note that `xiv_historical_periods` being shared does not make period boundaries
global facts. §2 requires overlapping regional timelines, so the table carries
region-scoped ranges rather than one canonical set of dates per period.

## RLS requirement for the ten tenant-bearing tables

The 62B audit found that every agent table carrying `universe_id` had RLS
policies that filtered on `tenant_id` alone, so a member of Universe A could read
Universe B rows belonging to the same organization. That was reproduced against
PostgreSQL and fixed in `20260908160000_xiv_agent_universe_rls.sql`, which
introduces the `xiv_universe_ref_is_member` security-definer helper and rewrites
eighteen tables' policies to check tenant and Universe together.

The ten tenant-bearing knowledge tables must use that same predicate from their
first migration rather than inheriting the tenant-only pattern a third time. This
matters more for knowledge than it did for meetings: §15 routes knowledge access
through Universe explicitly, and §16's `UNIVERSE_PRIVATE` class has no meaning at
all under a tenant-only policy.

The static reviewer added alongside that fix
(`services/ai/runtime/agentmeetings/rls-review.ts`) generalizes — it flags any
RLS-enabled table that carries `universe_id` without a Universe-scoped policy —
so it will catch a non-conforming knowledge migration automatically once both
land. §27's tenant isolation test should be extended to a Universe isolation
test on the same tables, since the tenant-level version passes even when the
Universe boundary is open.

## Contracts lock

`services/ai/runtime/queued/2i-ai-62c.ts` pins what 62C asserts while queued:
the fifteen §4 classifications kept distinct, the six §16 access classes, the
twelve §2 periods with overlap permitted, the §8 translation chain rooted at the
original, the twelve §17 lineage stages, the nine §20 supply chain stages
including reverse logistics, the §22 pipeline with the permission check ahead of
context assembly, the seven §24 quarantine reasons, the §26 table plan, and the
eight §27 evaluations all recorded as not demonstrated.

Every capability flag and every `AUTO_` flag is false, so the security boundary
holds as an executed assertion rather than a paragraph. `npm run test:2i-ai-62c`.

## Not decided here

- The name collision itself. This document states the choice; it does not make it.
- Whether 62A's slice-1 knowledge entries are withdrawn in favour of 62C's, which
  depends on the same decision.
- Column-level design for any of the fifteen tables. §3's twenty-five-field
  knowledge record is a conceptual structure, not a DDL proposal, and turning it
  into one is implementation work this story does not authorize.
- The `tenant_id` type split recorded in the 62A architecture document, which
  will affect these tables when they are written but is not caused by them.
