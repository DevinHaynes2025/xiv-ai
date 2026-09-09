# XIV Test Evidence, Verification & Ownership (2I-AI-62D governance)

62A built the civilization and 62B taught it to reason. Both slices ship with
tests, and both tests pass. That is the situation this slice is about.

A passing test is a claim that something worked once, somewhere, against some
code, as reported by whoever ran it. Everything load-bearing is missing from that
sentence: which commit, in which environment, who executed it, whether anyone
independent looked, and whether it is still true. 62D governance is the layer
that holds those answers, and refuses the claim when it cannot.

The governing principle, in the order the words matter:

> Code proves implementation. Tests measure behavior. Evidence proves the tests
> occurred. Independent verification establishes confidence. Human authority
> accepts consequential risk.

## Where this belongs

*Global operations brain.* Evidence governance is shared core, not an enterprise
workflow: every XIV surface — mobile, enterprise, government, runtime — is gated
by the same criteria, and a second copy would be a second definition of what
counts as proven.

It lives in `services/ai/evidence/`, a sibling of `services/ai/civilization/`
rather than a module inside it. The civilization decides what agents may do. This
decides whether XIV is entitled to believe any of it works, including the
civilization itself, so it cannot be a subordinate part of what it judges.

## The one property worth checking

Every rule below is enforced as a **refusal**, in both the service layer and the
database, and no state in the system is writable by the party it describes.

- Nothing can write `PASS`. A gate's state is computed from its evidence.
- Nothing can write `E4`. A level is derived from what the artifact has.
- Nothing can approve on someone's behalf. An approval is stamped with the caller.
- Nothing can edit or delete a result. A wrong one is superseded, and both survive.

The reason for the second enforcement point is plain: the service layer is not
the only way into these tables. PostgREST is. Every rule that would matter if
somebody wrote to the table directly is proved against the table directly, in
`supabase/tests/evidence_governance_test.sql`.

## The record contract

Eight tables: `release_gates`, `evidence_records`, `evidence_verifications`,
`evidence_approvals`, `evidence_exceptions`, `evidence_failures`,
`evidence_revalidations`, `evidence_manifests`. All tenant-scoped and RLS-forced
like the rest of the schema.

`evidence_records` carries every field section 34 names, and none of them is
optional, so a record that cannot answer a question does not exist. It also
carries `reproduction_command`, because a result nobody else can regenerate is a
weaker thing than one they can, and section 35 draws a level boundary exactly
there.

Credential-shaped strings are refused at insert on both sides. This table is
append-only and never deleted from, so a pasted token would live in it forever.
The refusal names the shape and the field and never echoes the value — an error
message is itself somewhere a secret ends up.

## Levels are earned, not claimed

Saying "this is E4" is itself an E0 claim, so the level a record may carry is
checked against what the record demonstrably has.

| Level | What it takes |
| --- | --- |
| E0 | A statement with no artifact. Cannot satisfy any criterion. |
| E1 | An artifact, but narrated by a person **or an agent**. |
| E2 | A system-generated artifact naming the exact commit. |
| E3 | E2 plus a command a third party can re-run. |
| E4 | E3 plus an independent reviewer at the same commit, and no unresolved blocker. |

Two consequences are worth stating plainly.

**An agent reporting its own success is E1.** Not E3, however structured the
output. This is the case section 33 is really written against and the one most
likely to be argued with, so `executor_type = 'agent'` is excluded from the
system-executor set in both the service and the trigger.

**E4 cannot be written at all.** At the moment a record is inserted, nobody
independent has looked at it. E4 is what a record becomes when someone does, and
it drops back to E3 the moment a high or critical failure is opened against its
gate — the evidence did not change, but what XIV is entitled to conclude from it
did.

## Ownership, and the one rule that cannot be satisfied by working harder

Four roles: **owner** produces, **verifier** independently decides whether the
evidence answers the criterion, **approver** is the human who accepts residual
risk, **guardian** enforces policy and may block a promotion but never grant one.

Every other requirement in this framework can be met by producing a better
artifact. This one requires a second party to exist, so it is a refusal rather
than a warning, and it is checked when responsibility is handed out as well as
when evidence arrives — learning that nobody independent is available is more
useful before the gate than at it.

`gates.ts` holds the matrix as data: 28 gates drawn from section 37 and the
section 57 dashboard, plus the five conditions of section 54 as gates of their
own. 22 are release-critical.

### Reconciling section 37 with section 54

Section 37 grants tenant isolation and secret scanning an exception route.
Section 54 says confirmed cross-tenant exposure and unresolved exposed production
secrets can never be waived. Both are true, because they describe different
objects.

A gap in the isolation *test suite* is a schedule problem a named human can
accept for a bounded window. A *confirmed leak between tenants* is not. So the
conditions section 54 protects are modelled as their own gates, marked
`hard_blocker`, and the test gates keep the exception route section 37 gives
them. "We have not finished the cross-tenant suite" is negotiable. "We have
proven data crossed a tenant boundary" is not, and the database refuses to hold
an exception row against it.

## Gate state

One accountable state per gate, computed, never written. The order of precedence
is the policy:

1. `BLOCKED` — a guardian hold, or the capability is not configured at all
2. `FAIL` — a mandatory test failed, or a reviewer found the evidence contradicted
3. `EVIDENCE_PENDING` — a mandatory test **did not run**
4. `UNASSIGNED` — nobody is accountable, however green the suite is
5. `EXCEPTION_APPROVED` / `EXCEPTION_PENDING`, `STALE`, `ASSIGNED`
6. `VERIFICATION_PENDING` — the artifact exists and is waiting on a reviewer
7. `PASS`

Third place is section 39's rule and the cheapest one to break: a skipped
mandatory test cannot be averaged away by the passes beside it. Fourth place is
section 56's: a green suite does not fill the hole where an owner should be, and
no release-critical criterion enters canary `UNASSIGNED`.

## Freshness

A permanent `PASS` is a lie with a delay on it. A cross-tenant suite that passed
before an RLS policy changed says nothing about the policy deployed now, and the
dangerous version of that sentence is the one where nobody notices.

So XIV records the events that could invalidate a result — code, RLS policy,
schema, Guardian, runtime, model, dependency, mobile build, infrastructure and
security policy changes — and recomputes `VALID`, `STALE`, `SUPERSEDED` or
`INVALID` on read. A change scoped to one gate does not age another gate's
evidence, an unscoped change ages everything, and the change that *produced* a
commit does not age evidence taken against it, or every run would invalidate its
own output.

## Exceptions and failures

An exception must name a compensating control, an independent reviewer and a
future expiry, and it covers nothing until a human who does not own the gap
accepts it. An exception with no end date is a policy change nobody voted on. It
also excuses only missing evidence — a *failing* test is a result, and no
exception turns a found credential into an absent one.

Failures are kept after they are fixed. A test fails, someone reruns it, it
passes, and the incident is never spoken of again: what is lost is the only
interesting datum in the exchange, that the system produced a wrong answer once
under conditions nobody characterised. Closing a failure requires a root cause
and a passing artifact taken against the commit claimed as the fix — proved in
the database too, since "reran it and it passed" is exactly what section 53 is
written to prevent.

## The package and the brief

`npm --prefix services/ai run evidence` runs the SQL harnesses and the service
tests, parses their per-expectation output, and writes `xiv-evidence/`: one
JSONL artifact per gate under the section 39 category directories, a
`manifest.json` whose own hash makes an edited count detectable, `readiness.json`
and `founder-brief.md`.

The directory is gitignored on purpose. Committing it would freeze evidence
against the commit before the one it describes, and section 38 says evidence for
commit A proves nothing about commit B. CI publishes it as a build artifact
instead.

The brief may only use six words, and it computes which one applies rather than
accepting one: `VERIFIED`, `OBSERVED`, `REPORTED`, `UNPROVEN`, `BLOCKED`,
`UNAVAILABLE`. `assertBriefClaim` refuses an upgrade the evidence does not
support, which makes "never upgrade REPORTED to VERIFIED" checkable instead of
aspirational.

**What it currently reports, at the commit that added it:**

```
0 of 33 gates PASS, 0 FAIL, 33 TBD
canary eligible: no — 5 hard blockers are not proven,
                      22 release-critical gates are not PASS
```

That is the correct answer, and producing it was the point. Roughly a thousand
real results exist, most gates sit at `VERIFICATION_PENDING` because nobody
independent has read them, and the gates XIV has no artifact for say so instead
of inheriting confidence from the ones it does. A framework whose first run
reported readiness would have been measuring itself.

Secret scanning is the sharpest illustration. The governance suite proves a
credential cannot be written into the evidence trail, which is a different claim
from the repository being free of exposed secrets, so those results are not filed
against `no_exposed_production_secrets`. That gate stays `UNPROVEN` until a
scanner produces an artifact.

## Automation's boundary

Automation collects evidence, hashes it, calculates thresholds and recommends.
The absence in the API is deliberate and permanent: there is no function that
sets a gate to `PASS`, and none that records an approval on somebody else's
behalf. Section 59 reserves that act for a person, and the way to make a rule
like that hold is to leave no entry point for breaking it.

## The twelve questions

`answerDefinitionOfDone` returns section 61's questions with answers drawn from
stored evidence, and `UNPROVEN` where there are none. It is the fastest way to
see whether a gate is real:

what was tested, against which commit and build, where, executed by whom, what
was expected, what happened, where the evidence is, whether it has been altered,
who owns remediation, who independently verified it, whether it is still fresh,
and whether a human approval became necessary.

## What this does not authorize

62D remains queued architecture. This slice adds no runtime, no deployment and no
authority: it is the instrument XIV will be measured with, built before the thing
it measures so that the measurements cannot be written to fit. `L4_AUTONOMY_ENABLED`
stays false.

## Running it

```bash
cd services/ai
npm install
npm run typecheck
npm test                    # 196 tests, no external dependencies

./supabase/tests/run-local.sh    # migrations + every SQL harness
npm --prefix services/ai run evidence
```

Against a hosted Supabase project, run
`supabase/migrations/20260909120000_evidence_verification_ownership.sql` in the
SQL editor after the 62A and 62B migrations, then `NOTIFY pgrst, 'reload schema';`,
then `supabase/tests/evidence_governance_test.sql` and
`supabase/tests/rls_matrix_test.sql`. The migration is re-runnable and both
harnesses end in `ROLLBACK`.

## The RLS matrix

Section 40 asks for behaviour rather than a configuration check, so
`rls_matrix_test.sql` discovers every tenant-bearing table from
`information_schema`, seeds it in dependency order, and runs the full matrix as
the `authenticated` and `anon` roles:

```
ORG_A → ORG_A → ALLOW      UNAUTHENTICATED → DENY
ORG_A → ORG_B → DENY       REVOKED USER    → DENY
ORG_B → ORG_A → DENY
```

39 tables, 0 skipped, across `SELECT`, `UPDATE` and `DELETE`. A table it cannot
seed is reported as skipped rather than passing quietly, because a table nobody
tested is the one that leaks.

One deliberate exception is visible in the output: a revoked member can still
read *their own* membership row, which is how a person finds out they were
revoked. The matrix excludes that row rather than pretending the table is opaque,
so the exception is stated where a reader can argue with it.
