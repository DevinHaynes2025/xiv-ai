/**
 * 12D-118: the master plan's authority ladder mapped onto the 100 enterprise
 * workforce roles. Ladder definitions are the governed vocabulary from
 * docs/agent-runtime.md:182 — L0 Observe, L1 Recommend, L2 Draft, L3 Human
 * Approval, L4 reserved (disabled by governance, never assigned), L5 Human Only.
 *
 * Every level here is the CEILING a role's output shape may reach under
 * governance — not an activation. Every role remains PROFILE_DEFINED_NOT_ACTIVATED
 * with LOCAL_DRAFT_ONLY execution; activation, approval and any rung above a
 * role's ceiling are human decisions. L3/L5 entries mean the domain is
 * approval-gated or human-reserved; they never imply the role acts.
 *
 * Provenance: levels were proposed by a five-way classified fan-out over the
 * role catalog and adversarially verified (over-privilege skeptic, under-privilege
 * skeptic, governance-consistency checker). The verified findings were applied as
 * conservative refute-downs: model_router, tenant_isolation and prompt_engineer to
 * L1; agent_registry and architecture_council to L0. Justifications cite the
 * roles' own mission wording in enterprise-workforce.ts.
 *
 * HONEST STATE: humanDecision 'REQUIRED', learningPromoted: false,
 * liveAgentCount: null, automaticRecovery: false, zero activated agents.
 */
import { ENTERPRISE_WORKFORCE } from './enterprise-workforce';

export const AUTHORITY_LADDER = Object.freeze([
  { level: 'L0', name: 'OBSERVE', meaning: 'reads, summarizes or curates authorized signals; output is a view of what IS, never a proposal' },
  { level: 'L1', name: 'RECOMMEND', meaning: 'states judgments, comparisons or recommendations for a human; produces no artifact meant to be executed' },
  { level: 'L2', name: 'DRAFT', meaning: 'produces concrete artifacts (code, tests, schemas, documents, designs) proposed for human review' },
  { level: 'L3', name: 'HUMAN_APPROVAL', meaning: 'high-stakes or irreversible domain (secrets, key custody, IAM/privilege, incident response, compliance certification, production-adjacent recovery): even drafts carry an explicit human-approval gate' },
  { level: 'L4', name: 'RESERVED', meaning: 'reserved and disabled by governance; never assigned to any role' },
  { level: 'L5', name: 'HUMAN_ONLY', meaning: 'the core decision domain is reserved to humans; a mapped role may only prepare material for a human actor' },
] as const);

export type AuthorityLadderLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
/** Levels a role may hold. L4 is reserved and can never be assigned. */
export const ASSIGNABLE_LEVELS: readonly AuthorityLadderLevel[] = Object.freeze(['L0', 'L1', 'L2', 'L3', 'L5']);

export interface AuthorityLadderEntry {
  readonly roleId: string;
  readonly level: Exclude<AuthorityLadderLevel, 'L4'>;
  readonly justification: string;
}

export const ENTERPRISE_ROLE_LADDER_MAP: readonly AuthorityLadderEntry[] = Object.freeze([
  { roleId: "executive", level: "L5" as const,
    justification: "Mission: 'Turn authorized evidence into a CEO decision brief.' The core executive decision is a founder/executive domain reserved to humans; the role only prepares the brief (the material) for that human decision, so it is L5 Human Only, not a recommender." },
  { roleId: "strategy", level: "L1" as const,
    justification: "Mission: 'Compare strategic options and state tradeoffs.' Output is an options comparison and judgment for a human, not an executable artifact — exactly L1 Recommend." },
  { roleId: "business_case", level: "L1" as const,
    justification: "Mission: 'Build evidence-linked business cases.' A business case is an evidence-linked recommendation/investment judgment for a human decision-maker, not an artifact meant to be executed; torn between L1 and L2, the lower L1 applies." },
  { roleId: "communications", level: "L2" as const,
    justification: "Mission: 'Draft progress updates without sending them.' Produces concrete written artifacts (update drafts) proposed for human review, with the send action explicitly withheld — L2 Draft." },
  { roleId: "product_owner", level: "L1" as const,
    justification: "Mission: 'Prioritize user value and acceptance criteria.' Prioritization is a value judgment/recommendation to a human owner rather than a self-standing artifact; torn between L1 and L2, the lower L1 applies." },
  { roleId: "program_planner", level: "L2" as const,
    justification: "Mission: 'Map dependencies and bounded delivery milestones.' The deliverable is a concrete planning artifact (dependency map and milestone plan) proposed for human review — L2 Draft." },
  { roleId: "backlog_editor", level: "L2" as const,
    justification: "Mission: 'Deduplicate stories and preserve traceability.' Produces concrete backlog artifacts (edited, deduplicated stories with traceability) for human review — L2 Draft." },
  { roleId: "requirements_analyst", level: "L2" as const,
    justification: "Mission: 'Convert needs into testable requirements.' The output is a requirements document artifact (testable requirement statements) proposed for human review — L2 Draft." },
  { roleId: "architecture_council", level: "L0" as const,
    justification: "Mission is 'Record architecture options and dissent' — a curated record of the council's proceedings (the same output shape as meeting_moderator's record of contributions), not a judgment of its own; 'Record' is curation, unlike strategy's 'Compare strategic options and state tradeoffs'. Conservative L0." },
  { roleId: "release_coordinator", level: "L2" as const,
    justification: "Mission: 'Prepare release evidence without deploying.' The output is an evidence package/document prepared for human review; deployment itself is explicitly out of scope and release prep is not in the L3 domain list (secrets, IAM, incident response, certification, recovery), so ordinary-review L2." },
  { roleId: "customer_experience", level: "L0" as const,
    justification: "Mission: 'Explain service gaps from authorized context.' The output is an explanation of what IS — a view of authorized signals about service gaps, never a proposal — L0 Observe." },
  { roleId: "localization", level: "L2" as const,
    justification: "Mission: 'Draft translations and locale test cases.' Produces concrete artifacts (translations and test cases) proposed for human review — L2 Draft." },
  { roleId: "web_engineer", level: "L2" as const,
    justification: "Mission: 'Draft accessible web components.' Produces code artifacts (component drafts) proposed for human review; the mission's own verb is 'Draft' — L2." },
  { roleId: "mobile_engineer", level: "L2" as const,
    justification: "Mission: 'Draft mobile-first navigation and screens.' Produces design/code artifacts for human review; the mission's own verb is 'Draft' — L2." },
  { roleId: "design_system", level: "L2" as const,
    justification: "Mission: 'Maintain reusable component tokens and contracts.' Produces concrete engineering artifacts (token definitions and component contracts) proposed for human review — L2 Draft, the default for engineering roles." },
  { roleId: "accessibility", level: "L1" as const,
    justification: "Mission: 'Check keyboard, focus and screen-reader behavior.' The output is review findings — stated judgments about behavior against criteria for a human (the 'risk is ...' shape), not artifacts and not a bare evidence view; L1 Recommend, chosen over L2 as the lower torn option." },
  { roleId: "offline_ux", level: "L2" as const,
    justification: "Mission: 'Design honest offline and stale-data states.' Produces concrete design artifacts (state/UX designs) proposed for human review — L2 Draft." },
  { roleId: "visualization", level: "L0" as const,
    justification: "Mission: 'Render sourced metrics without false precision.' The output is a rendered view of what IS — a faithful presentation of authorized metrics, never a proposal; torn between L0 and L2, the lower L0 Observe applies." },
  { roleId: "client_state", level: "L2" as const,
    justification: "Mission: 'Design recoverable client state and cache ownership.' Produces concrete design artifacts (state/cache ownership designs) proposed for human review — L2 Draft." },
  { roleId: "client_security", level: "L1" as const,
    justification: "Mission: 'Review browser storage and injection surfaces.' The output is security review findings — stated judgments about exposure risk for a human, without producing executable artifacts; torn between L0 and L1, the lower fitting level for stated judgments is L1 (and it stays below the L3 security-custody tier since the role writes no fixes or policy)." },
  { roleId: "technology", level: "L1" as const,
    justification: "Mission is 'Diagnose approved system context without production writes' (enterprise-workforce.ts:29). The output is a diagnosis — a stated judgment about the system's condition for a human — not a concrete artifact or proposal for execution; 'without production writes' confirms no artifact/execution surface. Judgments without artifacts place it at L1 RECOMMEND, above pure observation but below drafting." },
  { roleId: "api_architect", level: "L2" as const,
    justification: "Mission: 'Specify versioned request and response contracts' (enterprise-workforce.ts:30). A versioned API contract is a concrete engineering artifact proposed for human review, squarely the L2 DRAFT default for engineering roles; composeRoleDraft's 'Produce a patch proposal where relevant, never execute it' contract reinforces draft-only status." },
  { roleId: "node_backend", level: "L2" as const,
    justification: "Mission: 'Draft bounded TypeScript handlers' (enterprise-workforce.ts:31). The mission's own verb is 'Draft' — code artifacts proposed for human review — the textbook L2 DRAFT case named in the ladder rules." },
  { roleId: "event_bus", level: "L2" as const,
    justification: "Mission: 'Design idempotent typed events and replay behavior' (enterprise-workforce.ts:32). Event contract designs are concrete design artifacts proposed for human review; engineering-design output maps to L2 DRAFT." },
  { roleId: "authentication", level: "L2" as const,
    justification: "Mission: 'Draft authenticated-session flows and denial tests' (enterprise-workforce.ts:33). The output is drafted flows and test artifacts for ordinary human review; this role drafts session flows but neither holds nor proposes secrets, key custody, or privilege grants, so it does not meet the L3 bar ('secrets, key custody, IAM/privilege'). Torn between L2 and L3, the conservative rule assigns the lower: L2." },
  { roleId: "authorization", level: "L3" as const,
    justification: "Mission: 'Map explicit least-privilege action checks' (enterprise-workforce.ts:34). The role's domain is privilege/authorization design — explicitly listed as an L3 trigger ('IAM/privilege') where even drafts carry an explicit human-approval gate beyond ordinary review. Its least-privilege check mappings directly shape who may do what, so L3 HUMAN_APPROVAL." },
  { roleId: "tenant_isolation", level: "L1" as const,
    justification: "Mission is 'Prove cross-tenant reads and writes are rejected' — a verification verdict about isolation behavior stated for human review; the mapping's verification family (accessibility, documentation_qa, release_verifier) sits at L0/L1 and no artifact verb appears in the mission, so the conservative torn rule assigns L1. Any rejection tests it proposes are proposals only under LOCAL_DRAFT_ONLY — never executed verification." },
  { roleId: "integration_adapter", level: "L2" as const,
    justification: "Mission: 'Draft provider adapters behind a stable contract' (enterprise-workforce.ts:36). The mission verb is 'Draft' — adapter code artifacts proposed for human review. Standard engineering output, L2 DRAFT." },
  { roleId: "database_access", level: "L2" as const,
    justification: "Mission: 'Design parameterized queries and transaction boundaries' (enterprise-workforce.ts:37). Query designs and transaction-boundary specs are concrete engineering artifacts for human review; the role designs access patterns but neither holds credentials nor grants privilege, so L2 rather than L3." },
  { roleId: "job_queue", level: "L2" as const,
    justification: "Mission: 'Implement durable admission, backpressure and settlement' (enterprise-workforce.ts:38). Under the workforce contract every output is 'LOCAL_DRAFT_ONLY' with 'Produce a patch proposal where relevant, never execute it' (enterprise-workforce.ts:117,146), so 'implement' means proposed code artifacts for human review. L2 DRAFT." },
  { roleId: "data_quality", level: "L1" as const,
    justification: "Mission: 'Assess provenance, completeness and freshness' (enterprise-workforce.ts:39). The output is an assessment — stated judgments about data state for a human — not a produced artifact or executed fix. 'Assess' matches L1 RECOMMEND ('states judgments/recommendations for a human')." },
  { roleId: "data_engineer", level: "L2" as const,
    justification: "Mission: 'Design validated ingestion with bounded batches' (enterprise-workforce.ts:40). Pipeline designs with validation rules are concrete engineering artifacts proposed for human review. L2 DRAFT." },
  { roleId: "schema_designer", level: "L2" as const,
    justification: "Mission is 'Version schemas and reversible migration plans' (enterprise-workforce.ts:41). Schemas and migration plans are concrete artifacts proposed for human review; because the plans are only proposals (never executed — productionAuthority: false, enterprise-workforce.ts:119), ordinary review suffices and no L3 gate is warranted. L2 DRAFT." },
  { roleId: "retrieval_index", level: "L2" as const,
    justification: "Mission: 'Design scoped indexes and retrieval relevance tests' (enterprise-workforce.ts:42). Index designs and relevance-test artifacts proposed for human review — engineering output, L2 DRAFT." },
  { roleId: "memory_curator", level: "L2" as const,
    justification: "Mission: 'Prepare sourced memory candidates without automatic promotion' (enterprise-workforce.ts:43). The output is concrete candidate artifacts (prepared memory entries with sources) proposed for human review; 'without automatic promotion' confirms they are drafts awaiting a human decision, but preparation itself is artifact production, not mere judgment, so L2 DRAFT." },
  { roleId: "provenance", level: "L0" as const,
    justification: "Mission: 'Bind records to sources and collection timestamps' (enterprise-workforce.ts:44). The output is provenance metadata binding records to what IS (their sources and timestamps) — evidence curation, explicitly an L0 activity ('reads/summarizes authorized signals or curates evidence'), never a proposal. L0 OBSERVE." },
  { roleId: "license", level: "L0" as const,
    justification: "Mission: 'Record reuse terms and block unknown rights' (enterprise-workforce.ts:45). The output is a rights record — a curated view of what the reuse terms ARE — and 'block unknown rights' is an exclusion gate that keeps unverified material out of the record, not a proposal, judgment, or artifact for execution. Torn between L0 and L1, the conservative rule assigns the lower: L0 OBSERVE." },
  { roleId: "privacy_retention", level: "L2" as const,
    justification: "Mission: 'Draft retention, deletion and export policies' (enterprise-workforce.ts:46). The mission verb is 'Draft' — policy documents are concrete artifacts proposed for human review. The role drafts policy text only; it performs no deletion, holds no privilege, and certifies nothing, so it does not meet the L3 bar, and the conservative tie-break keeps it at L2 DRAFT." },
  { roleId: "backup_restore", level: "L3" as const,
    justification: "Mission: 'Propose tested recovery procedures' (enterprise-workforce.ts:47). The role's domain is backup/restore — explicitly listed as an L3 trigger ('production-adjacent recovery') where even proposed procedures carry an explicit human-approval gate beyond ordinary review, since executed recovery touches production and is hard to reverse. L3 HUMAN_APPROVAL." },
  { roleId: "analytics", level: "L2" as const,
    justification: "Mission: 'Specify measurable events and metric definitions' (enterprise-workforce.ts:48). Metric specifications and event definitions are concrete written artifacts proposed for human review — a specification document, not merely a stated judgment — so L2 DRAFT rather than L1." },
  { roleId: "innovation", level: "L0" as const,
    justification: "Mission is 'Collect ideas as labeled experiments' — the concrete output is a curated, labeled collection of ideas (a view of what was gathered), not a proposal or executable artifact; curation of authorized signals is L0 Observe. Torn between L0 and L1, the lower level is assigned." },
  { roleId: "local_reasoner", level: "L2" as const,
    justification: "Mission is 'Produce local bounded code and reasoning drafts' — the concrete output is code and reasoning drafts proposed for human review, exactly the L2 Draft default for engineering roles." },
  { roleId: "prompt_engineer", level: "L1" as const,
    justification: "Mission is 'Separate trusted instructions from untrusted context' — the mission names no artifact verb (no draft/design/template wording), and the parallel role prompt_injection ('Test separation of retrieved data from tool authority') was assigned L1; the conservative torn rule keeps this role at L1, not above its parallel." },
  { roleId: "model_router", level: "L1" as const,
    justification: "Mission is 'Deny unavailable or disallowed model routes' — the output is a gatekeeping verdict about a route (available or disallowed) stated for a human decision-maker, the same verdict form as learning_safety's 'Reject …' assignment; no artifact verb appears in the mission, so the conservative torn rule assigns L1. It drafts no routing artifact and executes nothing (PROFILE_DEFINED_NOT_ACTIVATED)." },
  { roleId: "eval_engineer", level: "L2" as const,
    justification: "Mission is 'Design holdout tasks and regression thresholds' — the concrete output is evaluation artifacts (holdout task suites and threshold definitions) proposed for human review; test/design artifact production is L2 Draft." },
  { roleId: "reasoning_pathway", level: "L2" as const,
    justification: "Mission is 'Version workflows with evaluation and rollback' — the concrete output is versioned workflow definitions plus rollback plans (documents/artifacts proposed for review), not execution of rollback; L2 Draft." },
  { roleId: "memory_consolidation", level: "L1" as const,
    justification: "Mission is 'Compare candidate lessons with source evidence' — the concrete output is comparative judgments about which candidate lessons are supported by evidence, stated for a human reviewer without producing executable artifacts; L1 Recommend." },
  { roleId: "agent_registry", level: "L0" as const,
    justification: "Mission is 'Keep role definitions separate from enrolled instances' — record maintenance/curation of what IS (role definitions vs enrolled instances), the same curation family as provenance, license and forensics; the mission names no document, design or code artifact. Conservative L0." },
  { roleId: "meeting_moderator", level: "L0" as const,
    justification: "Mission is 'Collect real contributions, pending reviews and dissent' — the concrete output is a record of what was said and what is pending, a view of what IS with no proposal; L0 Observe." },
  { roleId: "learning_safety", level: "L1" as const,
    justification: "Mission is 'Reject poisoned or unsupported learning promotion' — the concrete output is rejection verdicts with supporting evidence stated for a human decision-maker; it states a judgment ('this promotion must be rejected') rather than producing an executed action or artifact, so L1 Recommend. Torn with L3, the lower level is assigned; actual promotion decisions stay with humans." },
  { roleId: "security", level: "L0" as const,
    justification: "Mission is 'Review security signals without weakening isolation' — the output is a summarized view of what the authorized security signals currently show, never a proposal or remediation plan, fitting L0 Observe." },
  { roleId: "risk", level: "L1" as const,
    justification: "Mission is 'Explain evidence-backed risk and uncertainty' — the concrete output is a stated judgment ('risk is X, with uncertainty Y') for a human decision-maker, the definition of L1 Recommend; it produces no executable artifact." },
  { roleId: "compliance", level: "L3" as const,
    justification: "Mission is 'Map evidence to controls without unsupported certification' — the role sits in the compliance-certification domain, which the L3 rule names as requiring an explicit human-approval gate on even its evidence-to-control mappings; the certification decision itself stays human-reserved." },
  { roleId: "moderation", level: "L1" as const,
    justification: "Mission is 'Recommend content-policy actions without automatic bans' — the role's own wording says recommend, and bans (the enforcement action) are explicitly not automatic, so the output is a recommendation for human action: L1." },
  { roleId: "guardian", level: "L0" as const,
    justification: "Mission is 'Validate development health without private dataset access' — the output is a health-status verdict on what IS (a view of current development state), not a proposal; torn with L1, the conservative lower level L0 applies." },
  { roleId: "threat_modeler", level: "L2" as const,
    justification: "Mission is 'Map assets, trust boundaries and abuse cases' — the concrete output is a threat-model document (a design artifact) proposed for human review, matching L2 Draft." },
  { roleId: "secure_code_reviewer", level: "L1" as const,
    justification: "Mission is 'Review changed code for exploitable defects' — the output is review findings stating judgments that a defect is exploitable, for a human to act on; it drafts no code artifact, so L1 rather than L2." },
  { roleId: "dependency_auditor", level: "L1" as const,
    justification: "Mission is 'Assess locked dependency provenance and advisories' — the output is an evaluative risk judgment about dependency trustworthiness for a human, not a view of raw signals and not a changed artifact: L1." },
  { roleId: "secret_scanner", level: "L0" as const,
    justification: "Mission is 'Identify accidental exposure without printing secret values' — the output is factual detection of where exposure exists, a view of what IS; the role never handles secret values, so it does not enter the secrets/key-custody L3 domain, and the conservative lower level is L0." },
  { roleId: "iam_auditor", level: "L3" as const,
    justification: "Mission is 'Review privilege grants and account separation' — the role's domain is IAM/privilege, which the L3 rule explicitly names as requiring an explicit human-approval gate beyond ordinary review on anything it produces about privilege." },
  { roleId: "network_defense", level: "L2" as const,
    justification: "Mission is 'Draft deny-by-default ingress and egress plans' — the role's own wording says draft, and the output is a concrete network policy plan artifact proposed for human review: L2." },
  { roleId: "endpoint_defense", level: "L1" as const,
    justification: "Mission is 'Review local runtime hardening and process boundaries' — the output is an evaluative judgment on whether hardening is adequate, for a human; torn with L0, the judgment-bearing character of a hardening review keeps it at the lower defensible level L1, not L2 (no artifact is drafted)." },
  { roleId: "detection_engineer", level: "L2" as const,
    justification: "Mission is 'Draft high-signal alerts and false-positive tests' — the role's own wording says draft, and the output is concrete alert definitions and test artifacts proposed for review: L2." },
  { roleId: "incident_triage", level: "L1" as const,
    justification: "Mission is 'Classify authorized incident evidence' — triage classification is a stated severity/priority judgment that drives human response decisions; it takes no response action itself, so L1 (not the incident-response L3 gate, which belongs to the planner role)." },
  { roleId: "incident_response", level: "L3" as const,
    justification: "Mission is 'Prepare containment playbooks without taking host action' — the domain is incident response, explicitly named by the L3 rule: even its containment playbooks (proposals touching potentially irreversible host/production action) must carry an explicit human-approval gate." },
  { roleId: "forensics", level: "L0" as const,
    justification: "Mission is 'Preserve authorized evidence provenance and chain of custody' — the output is curated, provenance-bound evidence, i.e. a custodied view of what IS, matching L0 Observe/curation." },
  { roleId: "encryption", level: "L3" as const,
    justification: "Mission is 'Review standard cryptography and key-custody designs' — the domain is key custody, which the L3 rule names as approval-gated; its design reviews feed key-custody decisions that are themselves human-reserved, so its outputs carry the explicit gate." },
  { roleId: "security_test", level: "L2" as const,
    justification: "Mission is 'Write defensive negative tests in approved sandboxes' — the role's own wording says write, and the output is test code artifacts proposed for review: L2." },
  { roleId: "prompt_injection", level: "L1" as const,
    justification: "Mission is 'Test separation of retrieved data from tool authority' — the output is a security verdict stating whether untrusted data can reach tool authority, a judgment a human acts on; it drafts no artifact (unlike security_test), so L1 rather than L2." },
  { roleId: "supply_chain_security", level: "L1" as const,
    justification: "Mission is 'Review build artifacts, signatures and dependency trust' — the output is an evaluative trust judgment on build provenance for a human; torn with L0, the trust-assessment character keeps it at L1, not L2 (no artifact is produced)." },
  { roleId: "operations", level: "L0" as const,
    justification: "Mission is 'Explain operations signals without modifying production' — the concrete output is an explanation/summary of authorized operational signals, a view of what IS with no proposal; L0 Observe." },
  { roleId: "local_runtime", level: "L2" as const,
    justification: "Mission is 'Design supervised startup, stop and recovery behavior' — the concrete output is behavior design documents/specifications proposed for review, not the execution of start/stop/recovery actions; L2 Draft." },
  { roleId: "amd_compute", level: "L0" as const,
    justification: "Mission is 'Interpret supported hardware evidence without changing drivers' — the concrete output is an interpretation of hardware evidence, a view of what the evidence shows, with driver changes explicitly out of scope; L0 Observe. Torn between L0 and L1, the lower level is assigned." },
  { roleId: "cpu_performance", level: "L0" as const,
    justification: "Mission is 'Measure bounded local inference baselines' — the concrete output is baseline measurement results, observational data about what IS rather than a proposal or design artifact; L0 Observe." },
  { roleId: "gpu_benchmark", level: "L2" as const,
    justification: "Mission is 'Plan controlled CPU versus GPU comparisons' — the concrete output is benchmark plan artifacts (controlled comparison protocols) meant to be executed by others, which places it beyond L1's 'without producing artifacts meant to be executed'; L2 Draft." },
  { roleId: "container_planner", level: "L2" as const,
    justification: "Mission is 'Draft resource-bounded sandbox definitions' — the concrete output is drafted sandbox definition artifacts proposed for human review; the mission wording itself says 'Draft', so L2 Draft. Torn with L3 (isolation-adjacent), the lower level is assigned." },
  { roleId: "virtual_server_planner", level: "L2" as const,
    justification: "Mission is 'Design logical service allocation without provisioning' — the concrete output is allocation design documents; provisioning is explicitly excluded, so no infrastructure action is proposed for execution by the role itself beyond reviewable designs; L2 Draft." },
  { roleId: "sre_observability", level: "L2" as const,
    justification: "Mission is 'Specify honest service health and stale-state telemetry' — the concrete output is telemetry specifications (metrics, health and stale-state definitions) produced as artifacts for review; L2 Draft." },
  { roleId: "cost_budget", level: "L1" as const,
    justification: "Mission is 'Calculate bounded time, memory and provider budgets' — the concrete output is budget calculations and stated limits (judgments such as 'this fits within X') for a human, without producing executable artifacts; L1 Recommend. Torn between L0 and L1, the lower was considered but a budget calculation is a stated judgment/recommendation, so L1." },
  { roleId: "offline_recovery", level: "L2" as const,
    justification: "Mission is 'Design restart-safe local state and denied cloud fallback' — the concrete output is design documents for restart-safe state and cloud-fallback denial; it designs behavior and does not execute recovery, so it stays at L2 Draft. Torn with L3 (recovery-adjacent), the lower level is assigned." },
  { roleId: "test_architect", level: "L2" as const,
    justification: "Mission: 'Map requirements to representative test coverage.' Its concrete output is a coverage map / test design artifact proposed for human review (design documents fall under L2's 'documents, designs'); it writes no production code and approves nothing, but it produces more than a recommendation, so L2, not L1." },
  { roleId: "unit_test", level: "L2" as const,
    justification: "Mission: 'Write small deterministic behavioral tests.' The output is test code artifacts proposed for review under the role contract's 'tests_proposed_or_run' and LOCAL_DRAFT_ONLY; classic L2 draft work with no approval or execution authority." },
  { roleId: "contract_test", level: "L2" as const,
    justification: "Mission: 'Test frontend, backend and provider interfaces.' Its deliverable is concrete interface test artifacts proposed for human review; it does not gate or execute releases, so L2." },
  { roleId: "integration_test", level: "L2" as const,
    justification: "Mission: 'Exercise bounded cross-module workflows.' Output is integration test artifacts and results evidence ('tests_proposed_or_run') for human review; bounded and non-production, so L2." },
  { roleId: "offline_test", level: "L2" as const,
    justification: "Mission: 'Test operation with network disabled and local assets present.' Produces offline acceptance test artifacts and evidence for review; no network or production authority, so L2." },
  { roleId: "sync_test", level: "L2" as const,
    justification: "Mission: 'Test deduplication, conflicts and tenant-safe reconnect.' Deliverable is synchronization test artifacts proposed for review; tenant-safety is checked, not granted, so L2." },
  { roleId: "load_test", level: "L2" as const,
    justification: "Mission is 'Measure synthetic queues without inflating product claims.' The deliverable is proposed synthetic load scenarios and bounded measurement plans for human review — no load is generated against anything today (networkAuthority and productionAuthority are both false, enterprise-workforce.ts:119). Designing synthetic measurement plans is concrete test-artifact work, so L2." },
  { roleId: "chaos_test", level: "L2" as const,
    justification: "Mission: 'Inject safe timeouts and interrupted writes.' Output is failure-injection test designs and recovery evidence ('safe' injections in bounded sandboxes) proposed for human review; it takes no host or production action, so L2." },
  { roleId: "release_verifier", level: "L0" as const,
    justification: "Mission: 'Check commit-specific build and acceptance evidence.' Its output is a verification view of what the evidence IS (present/absent per commit), not a proposal or a release decision; torn between L0 and L1, the lower level L0 applies per the conservative tie-break rule." },
  { roleId: "documentation_qa", level: "L0" as const,
    justification: "Mission: 'Verify commands and claims against tested source.' Output is a findings view of what IS consistent with tested source, not proposed corrections or executable artifacts; torn between L0 and L1, resolved down to L0." },
  { roleId: "supply_chain", level: "L0" as const,
    justification: "Mission: 'Explain authorized logistics signals without placing orders.' The explicit 'without placing orders' clause confines output to explanatory views of what IS; pure observation, L0." },
  { roleId: "finance", level: "L0" as const,
    justification: "Mission: 'Summarize financial context without transfers or ledger writes.' Output is summaries of authorized financial context — a view of what IS with explicit denial of any write action; L0." },
  { roleId: "market", level: "L1" as const,
    justification: "Mission: 'Compare sourced market context without invented prices.' Comparison and stated judgments for a human (sourced, no invented prices) is exactly L1 recommend territory; it produces no executable artifact, so L1, not L2." },
  { roleId: "international", level: "L1" as const,
    justification: "Mission: 'Research cross-border workflows with uncertainty labels.' Output is analytical judgments and findings with explicit uncertainty labels for human readers — recommendations/assessments rather than artifacts meant to be executed; L1." },
  { roleId: "healthcare_workflow", level: "L2" as const,
    justification: "Mission: 'Draft nonclinical workflow requirements without patient data.' The verb 'Draft' plus explicit nonclinical, no-patient-data scoping makes this ordinary document drafting for human review; not high-stakes/irreversible enough for L3, so L2." },
  { roleId: "research", level: "L2" as const,
    justification: "Mission: 'Assemble traceable research packs.' Assembling a traceable research pack is producing a concrete document deliverable proposed for human review (L2 names 'documents'); it recommends nothing executable, so L2." },
  { roleId: "live_intelligence", level: "L0" as const,
    justification: "Mission: 'Summarize authorized updates without publishing.' Summaries of authorized signals with an explicit no-publish clause are views of what IS; observation only, L0." },
  { roleId: "public_source_discovery", level: "L0" as const,
    justification: "Mission: 'Find permitted primary sources and document freshness.' This is evidence curation — locating permitted sources and recording freshness — exactly L0's 'curates evidence'; output is a sourced view, never a proposal." },
  { roleId: "evidence_synthesizer", level: "L0" as const,
    justification: "Mission: 'Separate facts, inference, disagreement and missing evidence.' Output is a curated, fact-separated view of the authorized evidence (what is known, inferred, disputed, missing) — evidence curation rather than a proposal or executable artifact; torn between L0 and L1, resolved down to L0." },
  { roleId: "technical_writer", level: "L2" as const,
    justification: "Mission: 'Draft reproducible developer guides with source references.' The verb 'Draft' plus guides as the concrete output type is textbook L2 document drafting for human review; L2." },
]);

export const AUTHORITY_LADDER_GUARDRAILS = Object.freeze({
  mapIsCeilingsNotActivations: true,
  l4NeverAssigned: true,
  l4DisabledByGovernance: true,
  roleActivationRequiresHumanDecision: true,
  promotionRequiresHumanDecision: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

/** Mechanical invariants over a ladder map; throws on any violation (fail closed). */
export function assertLadderMapInvariants(map: readonly AuthorityLadderEntry[]): void {
  const seen = new Set<string>();
  for (const entry of map) {
    if (seen.has(entry.roleId)) throw new Error(`duplicate ladder entry for role ${entry.roleId}`);
    seen.add(entry.roleId);
    if (!ASSIGNABLE_LEVELS.includes(entry.level)) throw new Error(`role ${entry.roleId} has a non-assignable or reserved level`);
    if (typeof entry.justification !== 'string' || entry.justification.trim().length < 40) {
      throw new Error(`role ${entry.roleId} lacks a substantive justification`);
    }
  }
  const catalog = new Set(ENTERPRISE_WORKFORCE.map((r) => r.id));
  for (const id of catalog) if (!seen.has(id)) throw new Error(`workforce role ${id} is missing from the ladder map`);
  for (const id of seen) if (!catalog.has(id)) throw new Error(`ladder map names unknown role ${id}`);
}

export interface AuthorityLadderPacket {
  readonly kind: 'ENTERPRISE_AUTHORITY_LADDER_MAP';
  readonly generatedAtMs: number;
  readonly rolesMapped: number;
  readonly levelCounts: Readonly<Record<AuthorityLadderLevel, number>>;
  readonly maxAssignedLevel: 'L3';
  readonly reservedLevels: readonly ['L4'];
  readonly activationState: 'PROFILE_DEFINED_NOT_ACTIVATED';
  readonly executionContract: 'LOCAL_DRAFT_ONLY';
  readonly map: readonly AuthorityLadderEntry[];
  readonly liveAgentCount: null;
  readonly learningPromoted: false;
  readonly automaticRecovery: false;
  readonly humanDecision: 'REQUIRED';
}

/** Builds the governed ladder packet; fails closed on any map invariant violation. */
export function composeAuthorityLadderPacket(input: { generatedAtMs: number }): AuthorityLadderPacket {
  if (!Number.isSafeInteger(input?.generatedAtMs) || input.generatedAtMs < 0) throw new Error('packet timestamp required');
  assertLadderMapInvariants(ENTERPRISE_ROLE_LADDER_MAP);
  const levelCounts = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 } as Record<AuthorityLadderLevel, number>;
  for (const e of ENTERPRISE_ROLE_LADDER_MAP) levelCounts[e.level] += 1;
  return Object.freeze({
    kind: 'ENTERPRISE_AUTHORITY_LADDER_MAP',
    generatedAtMs: input.generatedAtMs,
    rolesMapped: ENTERPRISE_ROLE_LADDER_MAP.length,
    levelCounts: Object.freeze(levelCounts),
    maxAssignedLevel: 'L3',
    reservedLevels: Object.freeze(['L4'] as const),
    activationState: 'PROFILE_DEFINED_NOT_ACTIVATED',
    executionContract: 'LOCAL_DRAFT_ONLY',
    map: ENTERPRISE_ROLE_LADDER_MAP,
    liveAgentCount: null,
    learningPromoted: false,
    automaticRecovery: false,
    humanDecision: 'REQUIRED',
  });
}
