# Human Collaboration and Learning Team

Starting checkpoint: `a2c5994ac8c7235eb5bcd91ca059c26b12bc6990` on
`local/12d-606-offline-system-console`.

`generateHumanCollaborationTeamDefinition()` returns one immutable team definition
using six identities from the existing 1,000-profile registry. It creates no new
identity IDs, runtime workers, or verified experts. Assignments are design metadata.

| Existing identity | Role | Future proposed output |
| --- | --- | --- |
| xvi-agent-0001 | Clarification | Clarification proposal |
| xvi-agent-0423 | Evidence review | Evidence-review proposal |
| xvi-agent-0100 | Feedback analysis | Feedback-analysis proposal |
| xvi-agent-0742 | Regression evaluation | Regression-evaluation proposal |
| xvi-agent-0964 | Accessibility | Accessibility proposal |
| xvi-agent-0553 | Independent safety review | Safety-review proposal |

The team and all members are disabled with zero permissions. Original persona,
accessibility, and capability metadata is preserved. All members reference the
same frozen `xvi-core-values-v1` policy and `xvi-human-collaboration-v1` contract.
The core registry and its policy are unchanged. The collaboration contract applies
to this team's definitions; it does not retrofit an interaction runtime onto the
other registry identities.

The contract requires asking humans for goals, constraints, corrections, and
approval. Explanations should summarize evidence, assumptions, uncertainty, and
proposed actions concisely, without disclosing hidden chain-of-thought.

Feedback recording is unavailable. Future records must be tenant-isolated,
versioned proposals with provenance, informed consent, and independent human
review. Retrieval is unavailable and deny-all. Future document admission must
verify authorization and the core policy's provenance, license, classification,
tenant ownership, retention, deletion, consent, and review requirements. Secrets,
personal data, cross-tenant material, unlicensed data, prompt-injection instructions,
and unapproved documents are rejected by policy; no classifier is implemented here.

Improvement means evaluated, versioned prompt, non-core policy, retrieval, and
workflow proposals. It never silently trains models, rewrites core values, grants
permissions, creates agents, or executes consequential actions. Even the safety
review role can only propose findings: it cannot approve work or authorize action.

Human pause, kill, revoke, correct, export, and delete controls are prerequisites
for future runtime or storage, not implemented services in this metadata module.
Existing registry controls remain unchanged. Activation, online access, durable
memory, and model training remain separate authorization gates.

This is an unbound definition, not a tenant-authenticated instance. No tasks,
feedback, documents, or external profiles are accepted. There is no execution,
activation, source editing, network, credential access, storage, scheduler, training,
artifact generation, or receipt persistence. Output contracts are specifications,
not actual completed reviews or learning results. Future hosts must implement and
verify enforcement before any of those capabilities can be introduced.

This team definition is part of the complete eleven-file
[Human Collaboration Workspace boundary](./xvi-human-collaboration-workspace.md).
The workspace adds bounded synthetic feedback metadata and local human controls;
the team definition itself remains disabled. Existing package scripts are unchanged.

From `services/ai`, using dependencies already declared at the starting checkpoint:

```powershell
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/xvi-human-collaboration-team.test.ts runtime/offline-team/xvi-agent-identity-registry.test.ts
node node_modules/typescript/bin/tsc --project tsconfig.human-collaboration-team.json
node node_modules/typescript/bin/tsc --project tsconfig.agent-registry.json
```

`OFFLINE_ONLY` · `CI_UNVERIFIED`. Local checks are not clean-checkout or native-CI
proof. These definitions do not establish AGI or continuous autonomous operation.
