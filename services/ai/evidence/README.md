# Evidence governance (2I-AI-62D, story sections 33-61)

`DEPLOYMENT_STATE=QUEUED`. Importing this module does not run a pipeline, write to a database,
publish a dashboard or approve anything. It is an in-memory model of the evidence rules, written so
they can be executed rather than described.

Full architecture: [`docs/architecture/2i-ai-62d-evidence-governance.md`](../../../docs/architecture/2i-ai-62d-evidence-governance.md).

## Running it

```bash
cd services/ai
npm install
npm test          # runtime and evidence suites
npm run evidence  # writes xiv-evidence/<commit>/ and a manifest
npm run typecheck
```

## Shape

```ts
import { EvidenceLedger } from './evidence';

const ledger = new EvidenceLedger();

// CI produces the evidence.
const { record } = ledger.recordEvidence(ci, {
  criterion: 'rls',
  commit,                       // repository, branch and exact sha are mandatory
  primaryOwner: 'database_owner',
  payload: { kind: 'rls', probes },
  /* ... */
});

// Someone who is not the owner confirms it. This is what takes E3 to E4.
ledger.verifyEvidence(securityReviewer, { evidenceId, verdict: 'satisfies', note });

ledger.gateState('rls');            // PASS
ledger.founderBriefStatus('rls');   // VERIFIED
ledger.audit(evidenceId);           // the twelve section 61 questions
```

Every contract returns `{ ok: true, ... }` or `{ ok: false, code, message }`, where `code` is a closed
enum in `types.ts`.

## The rules this module enforces

- A statement is not evidence. E0 is a claim and cannot satisfy a criterion.
- Strength is derived from what a record contains, never declared by its author.
- Evidence with no exact commit is refused.
- A payload carrying credential material is refused, not scrubbed.
- The owner of a criterion cannot verify it; the verifier of a critical gate cannot approve it.
- Automation produces and formats evidence. Verification and approval stay with a person.
- A gate resting on altered evidence is blocked, and the alteration is named.
- A failure closes only on passing retest evidence bound to the stated fix commit.
- Cross-tenant exposure, Guardian bypass, unauthorized production action, an exposed production
  secret and an unstoppable dangerous workload can never be waived by exception.
- An empty cell is TBD. TBD is never PASS.
