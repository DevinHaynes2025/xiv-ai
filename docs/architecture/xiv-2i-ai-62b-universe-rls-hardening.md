# 2I-AI-62B — Universe-scoped RLS hardening + conformance audit

**Status:** hardening applied to the landed 62B engine. **Nothing marked live. L4 remains disabled. `DEPLOYMENT_STATE` unchanged.**
**Scope:** `supabase/migrations/20260908160000_xiv_agent_universe_rls.sql`, `services/ai/runtime/agentmeetings/rls-review.ts` (+ test).
**Companion:** [`xiv-2i-ai-62b-agent-meetings-human-intelligence-bridge.md`](./xiv-2i-ai-62b-agent-meetings-human-intelligence-bridge.md) (the story). The defect was first recorded as §0.2 of the 2I-AI-62A architecture document, which is still in review and not yet on `xiv-v2`; section references to 62A below point at that pending document.

---

## Conformance audit of the landed 62B engine

The 62B engine was checked section by section against the story. It conforms closely:

| Story section | State |
|---|---|
| §2 Meeting lifecycle (17 stages) | Present in `MEETING_LIFECYCLE`, in order |
| §3 Ten meeting tables | All present, with classification, provenance, retention policy, audit linkage, timestamps, `ENABLE` + `FORCE ROW LEVEL SECURITY` |
| §4 XARP (10 reasoning roles) | All ten present in `XARP_ROLES` |
| §5 Proposal fields (11) | All present on `MeetingProposal` and the proposals table |
| §6 Preserved disagreement | `OptionProfile.preserved: true`; covered by test |
| §7–8 Human bridge, 6 knowledge classes | Present; `isUniversalTruth: false` pinned |
| §10 Task force lifecycle (7 stages) | Present, with sleep rather than permanent compute |
| §12 Reputation (10 signals) | All ten present; `authorityExpanded: false` pinned |
| §18 Kill/pause controls (7) | All present; enforced without agent cooperation |
| §19 Resource governor (8 budgets) | All eight present in `MeetingBudget` |
| §21 API surface (14 routes) | All routed; `apiNameGrantsCapability()` returns `false` |
| §22 Required tests (10) | All ten present and passing **in-process** |
| §23 Definition of done | End-to-end test present and passing |

**The gap was one layer down.** Every §22 test exercises the in-process engine, which does enforce the Universe boundary — `engine.ts` and `society.ts` compare `universeId` in eight places. The database did not. That combination is the dangerous one: a green "universe boundary" test alongside a database that does not enforce it.

## The defect

Every policy on the agent tables filtered on tenant only:

```sql
FOR ALL USING (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
```

All of those tables carry a `universe_id` column, but no policy referenced it. **18 tables** were affected: the 10 from `20260908150000_xiv_agent_meetings.sql` and the 8 from `20260908040000_agent_mission_control.sql`, where the shape originated before being copied into 62B.

Reproduced against a real PostgreSQL 16 cluster with the actual migrations applied: a user holding an active membership in **Universe A only**, presenting a valid tenant JWT, could read a private meeting belonging to **Universe B** in the same tenant.

```
BEFORE:  Universe A private meeting
         Universe B PRIVATE meeting     <-- should not be visible
AFTER:   Universe A private meeting
```

## The fix

`xiv_universe_ref_is_member(text)` resolves a text universe reference to an active Universe membership backed by an active organization membership, following the semantics of the existing `xiv_is_universe_member` helper.

The resolver takes **text**, not uuid, and matches either `universes.slug` or `universes.id::text`. This matters: the agent tables store `universe_id` as text holding slugs, so a `universe_id::uuid` cast would raise on real data. (Related: the engine's own fixtures use `universe_a`, which cannot be a valid `universes.slug` — the slug constraint is `^[a-z0-9][a-z0-9-]{0,62}$` and rejects underscores. Reconciling those identifiers is 62A §0.1 Slice 1.0 work and is not attempted here.)

Each tenant-only policy is **dropped** and replaced with a tenant AND Universe policy. Dropping is required, not cosmetic: PostgreSQL combines permissive policies with `OR`, so leaving the old policy in place would have fully negated the new predicate.

The migration also adds what the tables were missing relative to conventions already established elsewhere in the repo:

- **CHECK constraints** pinning `meeting_equals_authority`, `l4_enabled`, and `production_live` to false, and forbidding an action recorded as both `unauthorized` and `executed`. The TypeScript types already pinned these as literal `false`, but a direct `INSERT` could set them true. `agent_workers` in `20260908031500` established this convention; the meeting tables had defaults without constraints.
- **Foreign keys** from objections and votes to proposals. Both carried `proposal_id` with no reference, so a vote could be recorded against a proposal that does not exist — which cannot satisfy §5's evidence-before-consensus requirement.
- **Indexes** supporting the RLS predicates and the `meeting_id` joins.

## Verification

Executed against PostgreSQL 16 with the real migrations applied, not asserted from reading:

| Check | Result |
|---|---|
| Cross-Universe SELECT | only Universe A visible |
| Cross-Universe INSERT | rejected by `WITH CHECK` |
| Own-Universe INSERT | accepted |
| Cross-tenant read | 0 rows |
| `l4_enabled = true` | rejected |
| `meeting_equals_authority = true` | rejected |
| `production_live = true` | rejected |
| action both unauthorized and executed | rejected |
| vote against non-existent proposal | rejected |
| legitimate queued action | accepted |
| migration re-applied | idempotent |
| all 18 tables | Universe-scoped |

`rls-review.ts` is a static regression guard: it parses the migration set, finds every RLS-enabled table carrying `universe_id`, and fails if any is left tenant-only. Membership tables are excluded because they are the authority the predicate resolves against. Deny-all policies are accepted as stricter. With the new migration removed, the guard reports all 18 tables; with it present, it passes.

## Not fixed here

- **`tenant_id` type split** — `text` in `agent_cloud_workforce`, `uuid` in `agent_mission_control` and the 62B tables (62A §0.2 Defect 2).
- **`universe_id` is unresolvable text** — slugs like `universe_a` cannot match `universes.slug`. The resolver handles this safely by matching rather than casting, but the identifiers themselves still need reconciling.
- **Two pre-existing migrations fail a from-scratch bootstrap**, independently of this change: `20260904200000_profile_identity_and_avatars.sql` requires a `public.profiles` table no migration creates, and `20260906230000_xiv_tenant_reconciliation.sql` fails with *cannot change return type of existing function* for `xiv_create_organization`. Both reproduce on a clean database without this migration.
- **The parallel meeting schemas** — `agent_meetings` and `xiv_agent_meetings` both exist (62A §0.1). This hardening covers both rather than choosing between them.
