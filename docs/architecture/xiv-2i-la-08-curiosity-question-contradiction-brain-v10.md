# 2I-LA-08 — Curiosity + Question + Contradiction Brain V10

**Status:** QUEUED (documentation only).  
**Title:** Curiosity + Question + Contradiction Brain V10 — 24/7 Intelligence Challenge Network  
**Sequencing:** QUEUE **AFTER** **2I-LA-07** (Trust + Privacy + Legal + Contract + Commerce Control Plane).  
**HARD STOP:** **DO NOT IMPLEMENT** runtime / schema / UI / agents from this document until **LA-07 PASS** (and inherited LA-01→LA-06 gates as required by foundation policy).  
**Do not interrupt** active validated LA-01–03+ code work.

**Canonical sibling queue:** [`xiv-master-build-queue-2i-ad-to-2i-kz.md`](./xiv-master-build-queue-2i-ad-to-2i-kz.md)  
**Label correction:** Curiosity was previously mislabeled as LA-07; **Curiosity is LA-08**. LA-07 is Trust.

---

## Founder user story

As the XIV AI Founder, I want XIV’s Brains and authorized AI agents to continuously question assumptions, discover unknowns, challenge one another, search for contradictory evidence, generate research missions, run safe experiments, and learn from outcomes — so that XIV becomes more accurate and useful over time instead of becoming more confident merely because its agents agree with one another.

**Design direction:** evidence-first / contradiction-edges intelligence — not agreement optimization.

### Core loop (contract)

```
OBSERVE
→ QUESTION
→ CHALLENGE
→ EVIDENCE
→ CONTRADICTION
→ RESEARCH
→ EXPERIMENT
→ SYNTHESIS
→ DECISION PROPOSAL
→ OUTCOME
→ LESSON
→ NEW QUESTION
```

---

## Architectural emphasis (CEO)

| Principle | Contract |
|-----------|----------|
| **Agreement ≠ truth** | Do not optimize for agents agreeing; optimize for evidence quality and calibrated decisions |
| **UNKNOWN is valid** | First-class state; never silently promote UNKNOWN → FACT |
| **Challenge is purposeful** | Devil’s advocate ≠ automatic disagreement; identify weaknesses that matter |
| **Bounded research** | More research ≠ automatically better; stop criteria required |
| **Simulation ≠ reality** | Experiments stay sandboxed; production is not a lab |
| **Authority unchanged** | Curiosity / meetings / overnight brainstorm do not mint L4, credentials, or silent prod deploy |
| **Private ≠ global** | Company knowledge stays tenant/Universe scoped unless promotion gates PASS |

---

## Surface contracts (document only — do not implement yet)

### 1–3. CuriosityBrain / QuestionBrain / UnknownEngine

| Surface | Contract types / notes |
|---------|------------------------|
| **CuriosityBrain** | `CuriosityBrain`, `CuriositySignal`, `CuriosityQuestion`, `KnowledgeGap`, `ResearchNeed`, `ExperimentNeed`, `AssumptionChallenge`, `CuriosityPriority` |
| **Curiosity prompts** | What changed? Why? What don’t we know? Missing/disagreeing evidence? Assumptions? Falsifiers? Tests? Next problems/opportunities? |
| **QuestionBrain** | `QuestionBrain` + typed questions (Research / Business / Technical / Security / Database / Scientific / Strategic / Clarification) |
| **Question lifecycle** | `GENERATED → CLASSIFIED → PRIORITIZED → ROUTED → RESEARCHING → PARTIALLY_ANSWERED → ANSWERED → UNRESOLVED → STALE → REOPENED` |
| **UnknownEngine** | Types: `MISSING_DATA`, `MISSING_EVIDENCE`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`, `STALE_INFORMATION`, `UNAUTHORIZED_INFORMATION`, `UNAVAILABLE_SOURCE`, `UNTESTED_HYPOTHESIS`, `UNSUPPORTED_PREDICTION`, `UNRESOLVED_CAUSE` |

### 4–5. ContradictionBrain + states

| Surface | Contract |
|---------|----------|
| **Types** | `ContradictionBrain`, `Contradiction`, `ContradictionEvidence`, `ContradictionHypothesis`, `ContradictionResolution`, `ContradictionHistory` |
| **Edge model** | CLAIM A ↕ CONTRADICTS ↕ CLAIM B — preserve both claims + evidence (contradiction edges, not overwrite) |
| **States** | `OPEN`, `INVESTIGATING`, `PARTIALLY_RESOLVED`, `RESOLVED`, `UNRESOLVABLE`, `STALE`, `REOPENED` |
| **History** | Never delete historical contradictions merely because a newer source is stronger |

### 6–9. Devil’s Advocate network / domain critics / Independent Position / Adversarial Council

| Surface | Contract |
|---------|----------|
| **Devil’s Advocate network** | `ChiefContradictionAgent`, `DevilsAdvocateAgent`, `SkepticAgent`, `AssumptionAuditorAgent`, `CounterexampleAgent`, `EvidenceCriticAgent`, `SourceCriticAgent`, `LogicCriticAgent`, `BiasDetectionAgent`, `FailurePredictionAgent`, `AlternativeHypothesisAgent`, `DisconfirmationResearchAgent` |
| **Domain critics** | Security / Privacy / Database / Architecture / Product / Customer / SupplyChain / Finance / Sales / LegalWorkflow / Quantum / Scientific / Simulation Devil’s Advocates |
| **Independent Position Protocol** | Agents write independent positions **before** exchanging results (anti-anchoring) |
| **Adversarial Council** (high-impact) | Primary → Evidence → Skeptic → Devil’s Advocate → Counterexample → Security/Privacy critic → Domain specialist → Synthesis |

### 10–13. Claim Challenge / Disconfirmation / Source Diversity / Evidence Stability

| Surface | Contract |
|---------|----------|
| **Claim Challenge** | SHOW EVIDENCE / ORIGINAL SOURCE / PROVENANCE / FRESHNESS / CONTRADICTIONS / ASSUMPTIONS / COUNTEREXAMPLE / HISTORICAL OUTCOME / FALSIFIER |
| **Disconfirmation Search** | High-confidence claims may trigger “what would prove this wrong?” missions — do not search until preferred answer appears |
| **Source Diversity** | Track `SourceIdentity`, `SourceFamily`, `SourceType`, `SourceAuthority`, `SourceIndependence` — copies ≠ independent corroboration |
| **Evidence Stability** | Stop when: sufficient evidence, stable graph, resolved question, budget exhausted, max iterations, source exhaustion, human decision required |

### 14–15. Research Mission Generator + Research Agent Expansion

| Surface | Contract |
|---------|----------|
| **Mission pipeline** | KnowledgeGap → ResearchQuestion → RequiredEvidence → SourceScope → Budget → ResearchAgents → AcceptanceCriteria → Mission |
| **Research agents** | ResearchDirector + PrimarySource / PublicData / Academic / Company / Industry / Economic / Technology / Patent / Regulatory / Historical / SupplyChain / Market / Scientific / Quantum / Standards ResearchAgents |

### 16–21. ExperimentBrain + labs + Parallel Hypothesis Universes

| Surface | Contract |
|---------|----------|
| **ExperimentBrain** | `Experiment`, `Hypothesis`, `Control`, `Variable`, `Measurement`, `ExpectedOutcome`, `ActualOutcome`, `Result`, `Limitation`, `ReplicationNeed` |
| **Generator** | QUESTION → HYPOTHESIS → TESTABLE PREDICTION → DESIGN → SAFETY → COST → SANDBOX → EXECUTE → MEASURE → LESSON |
| **Labs** | Software / Agent / Database experiment labs (comparisons, routing, query opts — **not** production as sandbox) |
| **Parallel Hypothesis Universes** | Isolated hypothesis spaces; no production mutation from speculative universes |

### 22–26. Contradiction DB + Assumption / Prediction registries + calibration

| Surface | Contract |
|---------|----------|
| **Contradiction DB** | Tables/collections for contradictions, claims, evidence, resolutions, history (inspectable) |
| **Assumption Registry** | Register, challenge, expire assumptions; stale assumptions reopen questions |
| **Prediction Registry** | Predictions with outcomes; feed Forecast Calibration |
| **Forecast Calibration** | Confidence vs outcomes — confidence ≠ evidence |

### 27–30. Decision Challenge + Pre/Post-mortem + Success Analysis

| Surface | Contract |
|---------|----------|
| **Decision Challenge** | Challenge consequential proposals with evidence, alternatives, risks, falsifiers |
| **Pre-mortem** | Failure modes before commit |
| **Post-mortem** | Outcomes, missed signals, lessons (append; no silent history rewrite) |
| **Success Analysis** | Why success happened — avoid superstition / narrative bias |

### 31–33. Agent Meetings + Overnight Brainstorm (authority limits)

| Surface | Contract |
|---------|----------|
| **Agent Meetings** | Structured, mission-triggered or scheduled; meeting ≠ authority |
| **Overnight Brainstorm** | Idea generation only within budgets |
| **Overnight limits** | No silent prod deploy, no L4, no credential self-grant, no unrestricted research spend |

### 34–36. Founder UIs

| UI | Contract |
|----|----------|
| **XIV Changed Its Mind** | Belief revisions with evidence + prior state |
| **XIV Does Not Know** | Explicit UNKNOWN surfaces |
| **XIV Disagrees With Itself** | Open contradictions / adversarial positions retained visibly |

### 37–42. Priority / KnowledgeFrontier / Idea Factory / Evidence Gate / User Story Generator / Queue Governor

| Surface | Contract |
|---------|----------|
| **Curiosity Priority Engine** | Rank by business/security/customer impact, decision dependency, gap severity, evidence weakness, researchability, cost, urgency |
| **KnowledgeFrontier** | `KNOWN_STRONG` / `KNOWN_PARTIAL` / `CONTESTED` / `UNKNOWN` / `STALE` / `UNDER_RESEARCH` |
| **Idea Factory** | Product / Architecture / Research / Tool / Security / Database / Business / SupplyChain / Cost / CX ideas |
| **Idea Evidence Gate** | problem, evidence, expected value, risk, cost, dependencies, acceptance criteria, test plan — interesting ≠ priority |
| **User Story Generator** | Validated discoveries → Epic / Feature / UserStory / Research / Security / Database / TechDebt / Experiment stories |
| **Queue Governor** | `IDEA_POOL` / `RESEARCH_QUEUE` / `BACKLOG` / `READY` / `ACTIVE` / `BLOCKED` / `VALIDATION` / `DONE` / `ARCHIVED` — idea pool may grow; **ACTIVE stays bounded** |

### 43–47. Structured messages / quality agents / graph integrity / mutation audit

| Surface | Contract |
|---------|----------|
| **Message types** | `QUESTION`, `POSITION`, `EVIDENCE`, `CHALLENGE`, `COUNTEREXAMPLE`, `ALTERNATIVE`, `UNKNOWN`, `EXPERIMENT`, `RESULT`, `SYNTHESIS`, `HANDOFF` |
| **Continuous dialogue** | Mission-triggered or scheduled; bound by purpose, budget, iterations, time, completion — no endless chatter |
| **Quality agents** | TruthMaintenance, EpistemicQuality, ResearchQuality, ExperimentQuality, PredictionCalibration, DecisionQuality, OutcomeQuality, GraphIntegrity, OntologyDrift, KnowledgePoisoningDetection |
| **Graph integrity** | Unexpected mutations, source changes, entity confusion, broken provenance, schema drift, suspicious relationships, large confidence shifts |
| **Knowledge mutation audit** | who/agent, mission, source, old/new state, reason, evidence, timestamp, tenant, Universe |

### 48–54. Security / DB council / GitHub–Cursor contrib / loops / budgets / metrics

| Surface | Contract |
|---------|----------|
| **Security tests** | Fake evidence, forged source, cross-tenant claim, cross-Universe contradiction, agent impersonation, research-tool escalation, poisoning, graph tampering, confidence manipulation → **DENIED/QUARANTINED + AUDITED** |
| **Database Agent Council** | DatabaseArchitect, Postgres, Supabase, RLS, Security, Performance, Migration, Backup, Contradiction agents review schema proposals |
| **GitHub / Cursor contrib** | `CursorCoordinatorAgent` + Architecture / Backend / Database / AI / Security / QA / Documentation / CodeReview / Contradiction — Git remains source of truth |
| **Dev feedback loop** | STORY → architecture → challenge → implementation → typecheck → tests → security → review → failure analysis → fix → retest → commit → push → outcome → lesson |
| **Continuous test loop** | defect → reproduction → failing test → fix → passing test → regression test |
| **Performance budget** | agent/model/research/tool/DB calls, tokens, latency, compute cost — curiosity ≠ uncontrolled spending |
| **Completion metrics** | OpenQuestions, QuestionsResolved, KnowledgeGaps, Open/Resolved Contradictions, Experiments, ResearchMissions, ChangedBeliefs, PredictionCalibration, UsefulStoriesGenerated, ResearchCost, EvidenceCoverage |

---

## Checkpoint commit plan (future implementation — document only)

Independently valid future commits (not authorized by this docs queue):

1. `feat(xiv): add curiosity and question brain`
2. `feat(xiv): add contradiction intelligence runtime`
3. `feat(xiv): add adversarial agent council`
4. `feat(xiv): add experiment and hypothesis engine`
5. `feat(xiv): add continuous research feedback loop`
6. `feat(xiv): add knowledge frontier interface`

Per checkpoint (when authorized): TYPECHECK → TEST → SECURITY → SECRET SCAN → `git diff --check` → COMMIT → PUSH `origin xiv-v2` → GitLab after sync gate. **Never force push. Never push `main`.**

---

## Final gate fields (implementation era — never infer PASS)

```
LOCAL=  GITHUB=  GITLAB=  TREE=
CURIOSITY_BRAIN=  QUESTION_BRAIN=  UNKNOWN_ENGINE=
CONTRADICTION_BRAIN=  ADVERSARIAL_COUNCIL=
RESEARCH_ENGINE=  EXPERIMENT_ENGINE=  KNOWLEDGE_FRONTIER=
DATABASE=  SECURITY=  CONTINUOUS_TESTING=
```

---

## Next after LA-08 (titles only)

| ID | Title |
|----|-------|
| **2I-LA-09** | Temporal + Causal Intelligence V10 |
| **2I-LA-10** | Parallel Quantum Universe Simulation Grid |
| **2I-LA-11** | Multi-Model + AI Chip Intelligence Router |
| **2I-LA-12** | Quantum/Hybrid Compute Lab |
| **2I-LA-13** | Nested AI Tool Foundry |
| **2I-LA-14** | Cybersecurity + Digital Forensics OS |
| **2I-LA-15** | Global Legal + Contract Intelligence OS V10 + Autonomous Product Owner + 24/7 User Story Evolution Engine |
| **2I-LA-16** | AI CFO + Banking + Wealth Intelligence + Executive Agent Organization V20 |
| **2I-LA-17** | Personal Privacy Vault + Private Search |
| **2I-LA-18** | 18+ Age Assurance + Global Identity + Community Trust OS V20 |
| **2I-LA-19** | 18+ Cultural / Naturist Business Universes V20 |
| **2I-LA-20** | Creator + Influencer Business OS |
| **2I-LA-21** | Retail Product Passport |
| **2I-LA-22** | Global Database Federation |
| **2I-LA-23** | Autonomous QA / Red-Blue Test Factory |
| **2I-LA-24** | Supply Chain Digital Twin |
| **2I-LA-25** | Global Business Digital Twin |
| **2I-LA-26** | AI Agent University + Evaluation System |
| **2I-LA-27** | Global AI Tool + Plugin Marketplace |
| **2I-LA-28** | Universal Device + AI Chip Fabric |
| **2I-LA-29** | Overnight AI Organization V20 |
| **2I-LA-30** | Founder Mission Control V25 |

---

## Permanent rules (LA-08 / CEO)

```
QUESTION ≠ FACT
HYPOTHESIS ≠ FACT
CORRELATION ≠ CAUSATION
REPETITION ≠ CORROBORATION
CONSENSUS ≠ TRUTH
CONFIDENCE ≠ EVIDENCE
SIMULATION ≠ REALITY
DEVIL'S ADVOCATE ≠ AUTOMATIC DISAGREEMENT
MORE RESEARCH ≠ AUTOMATICALLY BETTER
PRIVATE COMPANY KNOWLEDGE ≠ GLOBAL KNOWLEDGE
AGENT MEETING ≠ AUTHORITY
UNKNOWN IS A VALID ANSWER
L4 REMAINS DISABLED
```

### Inheritance

Guardian, Tenant Isolation, Universe Isolation, Agent Firewall, Data Access Gateway, Evidence/Provenance, Audit, Human + Policy Authority, providers `NOT_CONFIGURED` until proven, specialization ≠ authority, Founder Brief `devinhaynes2025@gmail.com`.

### Out of scope for this docs commit

- Any LA-08 (or LA-07/06/05/04) runtime code, schemas, credentials, or UI implementation
- Interrupting LA-01–03+ active validated work
- Claiming Curiosity/Contradiction brains are LIVE
- Force push / push to `main`

Docs-only commit message for this queue: `docs(xiv): queue 2I-LA-08 curiosity question contradiction brain v10`
