# XUR — XIV Universal Runtime (2I-AI-62D)

`DEPLOYMENT_STATE=QUEUED`. Importing this module does not deploy a workload, enroll a device,
activate an agent, purchase compute, open a network connection or touch a database. It is an
in-memory model of the governed runtime fabric, written so the security guarantees can be executed
instead of described.

Full architecture: [`docs/architecture/2i-ai-62d-distributed-runtime-fabric.md`](../../../docs/architecture/2i-ai-62d-distributed-runtime-fabric.md).

## Running it

```bash
cd services/ai
npm install
npm test        # the section 29 tests and the section 30 walkthrough
npm run typecheck
```

## Shape

```ts
import { createRuntimeFabric } from './runtime';

const fabric = createRuntimeFabric();
const operator = { actorType: 'human_operator', actorId: 'op_1', scope } as const;

// A lane is unusable until it is individually proven with evidence.
fabric.recordVendorValidation(operator, {
  laneId: 'intel_x86_64',
  support: 'proven',
  evidence: ['conformance-suite:intel_x86_64'],
});

// Agents ask for a capability. They never name a machine.
const workload = fabric.submitWorkload(agent, request);
const decision = fabric.scheduleWorkload(guardian, workload.workload.workloadId);
```

Every contract returns a discriminated result rather than throwing: `{ ok: true, ... }` or
`{ ok: false, code, message }`, where `code` is a closed enum in `types.ts`. Denials are meant to be
read, logged and asserted on.

## The rules this module enforces

- Authorization is resolved beneath every contract, never by the caller.
- Scope equality is enforced for every actor type, Guardian included. A row in another Universe reads
  as absent, not as forbidden.
- Registration grants nothing. Attestation earns `verified` at most; `trusted` and `protected` are
  operator grants with a recorded justification.
- Security filters run before performance ranking. An unauthorized node is never the cheapest option,
  because it is not an option.
- The control plane is authoritative. Terminating work does not require the workload to cooperate.
- Consequential external actions are never automatically replayed.
- Offline execution never adds authority.
- The security lock is data. `SECURITY_LOCK` is read at runtime and closes the paths it names.
