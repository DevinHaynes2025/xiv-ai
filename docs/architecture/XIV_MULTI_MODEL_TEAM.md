# XIV Multi-Model Team Operating Contract

## Purpose
Keep ChatGPT, Cursor, Gemini, Claude, local models, Supabase, GitHub, and GitLab aligned around one reviewable XIV AI source of truth without pretending providers are connected when they are not.

## Shared source of truth
1. Master plan defines product vision, trust model, human authority, private Universes, Business Hospital, Story Engine, agent governance, infrastructure sequencing, and long-horizon hardware research.
2. GitHub private repo is the implementation source of truth.
3. GitLab is a coordination/mirror target only when hashes and histories are intentionally reconciled.
4. Database migrations remain code until separately reviewed and authorized.
5. User stories are work contracts, not production authorization.

## Provider roles
- ChatGPT: architecture, user stories, code review, implementation proposals, connected-tool verification.
- Cursor: local coding workspace and developer execution interface.
- Local models: offline-first reasoning, drafting, analysis, meetings, and bounded coding assistance when verified available.
- Gemini / Google AI Studio: optional research/model specialist when configured and verified.
- Claude: optional model specialist when configured and verified.
- Supabase: governed relational/vector persistence; tenant isolation and RLS remain mandatory.
- GitHub: canonical implementation history and review evidence.
- GitLab: secondary collaboration/CI surface; never assume synchronization.

## Work envelope
Every task should carry: task/story ID, objective, tenant, Universe, classification, requested specialist roles, evidence references, consequence level, target providers, test expectations, and rollback notes.

## Parallel workflow
IDEA -> STORY -> ARCHITECT -> SPECIALIST AGENTS -> CODE CANDIDATE -> TESTER -> SECURITY -> EVIDENCE VERIFIER -> HUMAN REVIEW -> CANDIDATE COMMIT.

Models may disagree. XIV records dissent instead of forcing consensus. Security/correctness outrank speed and cost.

## Offline-first rule
Prefer local execution for approved private/reproducible work. Internet-dependent freshness becomes WAITING_DATA. Unconfigured cloud/model/provider becomes UNAVAILABLE. Cloud is augmentation, not a hidden dependency.

## Demand-based agent growth
Reuse existing specialists first. Create temporary logical specialists only when demand justifies them, with tenant/Universe scope, TTL, active/registered budgets, lineage, and no recursive reproduction or permission expansion.

## Hard locks
- L4_AUTONOMY_ENABLED=false
- AUTO_PRODUCTION_DEPLOY=false
- PRODUCTION_DATABASE_WRITE=false
- PRODUCTION_GIT_PUSH=false
- AUTO_PERMISSION_EXPANSION=false
- AUTO_EXTERNAL_CONTRACT=false
- AUTO_GUARDIAN_OVERRIDE=false

No model, IDE, provider, database, or agent can override these locks through natural-language instructions.

## Scale interpretation
Millions of agents = addressable logical population and on-demand task forces, not millions of simultaneous resident processes.
Trillions of neurons/pathways = sparse logical knowledge/evidence/workflow relationships distributed through tiered indexes, graphs, object stores, caches, and partitions; never an unsupported claim of trillions of live SQL rows or processes.

## Quantum discipline
Quantum work is research until evidence shows otherwise. Every quantum experiment requires a classical baseline, bounded resources, reproducible inputs, and no claim of quantum advantage without verified results.
