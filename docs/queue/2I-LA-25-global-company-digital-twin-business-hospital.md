# 2I-LA-25 — Global Company Digital Twin + Business Hospital V40

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / runtime **not started**
Branch: xiv-v2
HARD STOP: **DO NOT IMPLEMENT** until **2I-LA-24 PASS**. Queue **AFTER LA-24**; do not interrupt active validated / deployment-critical work (LA-22B/23/24 may still land). Do not destabilize 30-day deployment runway. L4 disabled.

**Feature flags (default OFF):** `COMPANY_TWIN_ENABLED`, `BUSINESS_HOSPITAL_ENABLED`, `AI_BOARD_ENABLED`, `COMPANY_SIMULATION_ENABLED`, `COMPANY_STORY_ENGINE_ENABLED`, `CONTINUOUS_COMPANY_LEARNING_ENABLED`.

## Prerequisite (queue ordering)

**2I-LA-24** (Global Supply Chain Digital Twin) must PASS before LA-25 code. Ordering: **LA-23 Autonomous QA + Defensive Red/Blue Security Factory → LA-24 Global Supply Chain Digital Twin → LA-25 Global Company Digital Twin + Business Hospital V40 → LA-26 AI Agent University + Evaluation System**.

**Tip note:** Fetch tip first (~`7050e3e` LA-16…22B; LA-23/24 may still land). Rebase onto latest tip **including LA-24** when present. Never force-push / never `main`.

**Full contracts (architecture §§1–130 + permanent rules):** [`docs/architecture/xiv-2i-la-25-global-company-digital-twin-business-hospital-v40.md`](../architecture/xiv-2i-la-25-global-company-digital-twin-business-hospital-v40.md).

**Ancestors ≠ this V40:** 2I-CC Company Digital Twin + 2I-CD Business Hospital V6 = twin≠reality + hospital metaphor foundations. LA-10 = simulation grid. Financial/Security/Supply depth compose LA-22B / LA-23 / LA-24. Company Twin kernel + Hospital V40 + AI Board + ExecutiveBrain + value proof + trillion-target honesty belong here.

## Founder user story

As the XIV AI Founder, I want XIV to run Global Company Digital Twin + Business Hospital V40 — keep DIGITAL TWIN ≠ ACTUAL COMPANY and Company A ≠ B ≠ Global Brain; operate Business Hospital as business metaphor only (not medicine) with health records/diagnosis/health graphs and **no fake COMPANY HEALTH = 97%** (explain metrics/evidence/unknowns); compose domain twins (Financial≠bank balance, Customer≠unrestricted profile, Org≠employee surveillance, plus Revenue/Sales/Ops/Supply/Tech/Security/Contract); run Skills graph + AI workforce + AI Board (≠ legal directors; consensus ≠ truth) + ExecutiveBrain + Command Center + CEO morning; connect Story/Causal/Contradiction/Question/Curiosity/Strategy brains (AFTER≠BECAUSE); compose LA-10 Company Simulation Universes for foresight/early warning without treating sims as future/production/authority (sim agent ≠ production credentials); learn via Decision/Outcome/Failure/Success brains; score value/savings/revenue/ROI with projected≠verified and trillion-savings as strategic target not claim; propose treatment/preventative/emergency plans without L4; run research/innovation + AI Product Owner + 24/7 story factory with governors (unlimited ideas ≠ unlimited execution); scale logical workforce without more-agents=authority or executive-offline authority expansion; bind brain-to-brain via DataAccessGateway; enforce privacy + security/red teams; bound Founder Twin (exact label ≠ Devin; cannot change ownership/move money/override Guardian) and disclaim Company AI CEO; expose Twin API + Brain Health + Ask XIV explainability + time machine/future simulator honesty + value graph/reporting + night shift briefs; support multi-company collaboration without merging brains; connect XIV revenue honestly; prove value with aggregation discipline — prioritizing Company Brain isolation, tenant isolation, provenance, basic health contracts, security, and core reporting for the 30-day runway (complete twin not first-canary blocker; advanced sims feature-gated OFF) — and feed LA-26 Agent University.

## Critical architecture rules (permanent)

1. DIGITAL TWIN ≠ ACTUAL COMPANY; Company A ≠ B ≠ Global Brain.
2. Business Hospital = business metaphor, not practicing medicine.
3. No fake COMPANY HEALTH = 97% — explain metrics/evidence/unknowns.
4. Financial twin ≠ bank balance; Customer twin ≠ unrestricted profile; Org twin ≠ employee surveillance.
5. AI Board ≠ legal directors; AI consensus ≠ truth/authority; Founder Twin exact label ≠ Devin; Founder Twin cannot change ownership/move money/override Guardian; Founder private finance ≠ Company Brain.
6. Simulation ≠ future/production/authority; Simulation agent ≠ production credentials; Projected ≠ verified savings/revenue; Trillion-savings = strategic target not claim.
7. AFTER ≠ BECAUSE; Unlimited ideas ≠ unlimited execution; More agents ≠ authority; Executive offline ≠ authority expansion.
8. Queued architecture ≠ implementation proof; never infer PASS; L4 disabled.

## Release posture (30-day guard)

**Priority (do not regress / prefer first):** Company Brain isolation, tenant isolation, provenance, basic health contracts, security, core reporting.  
**Feature-gated OFF / non-blocking:** complete multi-domain twin mesh, advanced Company Simulation Universes, AI Board scale demos, continuous company learning, story factory at scale — complete Company Digital Twin is **not** a first-canary blocker.

## Core surfaces (document only)

- Founder mission; CompanyDigitalTwin kernel; CompanyBrain + domain brains
- Private Company Brain + data firewall; Knowledge graph + memory + temporal
- Business Hospital V40 + health record + diagnosis discipline + health graph/states; No fake score
- Domain twins (Financial LA-22B, Revenue, Sales, Customer+privacy, Operations, Supply Chain LA-24, Technology, Security LA-23, Contract, People/Org + privacy)
- Skills graph + AI workforce; AI Board + meeting + disagreement + consensus rules
- ExecutiveBrain + synthesis + Command Center + CEO morning; Story engine + classification
- Causal/Contradiction/Question/Curiosity brains; StrategyBrain + alignment
- Company Simulation Universes (LA-10) + Future/Foresight/Early warning
- Decision/Outcome/Failure/Success brains + organizational learning
- Business Value/Savings/Revenue impact/ROI; Treatment plan + preventative + emergency (not L4)
- Research/competitive/market/innovation; AI Product Owner + 24/7 story factory + governor + duplication + value scoring
- 24/7 workforce + logical scale + role generator + directory + employment analogy + performance/promotion + meetings
- Brain-to-brain + DataAccessGateway; Privacy (financial/Founder/customer/employee); Security + red teams
- Founder Twin authority; Company AI CEO disclaimer; Twin API + Brain Health + knowledge quality
- Mobile UI + Ask XIV + explainability; Time machine + historical replay + future simulator
- Value graph + reporting; Night shift; Multi-company + collaboration + network; XIV revenue connection
- Value proof + aggregation + trillion target; DB tables; Security/sim/agent-clone/performance tests
- Deployment guard + flags; Checkpoint protocol + suggested commits; Completion evidence (never infer PASS)
- Next LA-26 Agent University

## Next queue

- **2I-LA-26** AI Agent University + Evaluation System
- Then **LA-27…LA-30** per master queue titles

## Docs-only gate

LOCAL = GITHUB = GITLAB; TREE = CLEAN; runtime **NOT** started. Never infer PASS. **HARD STOP — no LA-25 runtime.**
