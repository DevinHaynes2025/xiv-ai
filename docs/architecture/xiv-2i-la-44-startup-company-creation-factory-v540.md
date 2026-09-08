# 2I-LA-44 — XIV Startup + Company Creation Factory V540

**Status:** **QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Documentation only. **DO NOT IMPLEMENT** until **2I-LA-43A** completion gate **PASS** (and **2I-LA-43** PASS; prior LA-01→LA-42 / Guardian gates as applicable).
**Also blocked for code until:** LA-01 → LA-43 PASS minimum; **LA-43A** tip-land PASS when present; compose **LA-16** AI CFO; **LA-25** Company Twin + Business Hospital; **LA-29/30** Org + Founder Mission Control; **LA-34** Capital/Funding; **LA-38** Planetary Simulation; **LA-39** Africa Intelligence; **LA-40** Brain Foundation / Master Plan; **LA-42** Contracts; **LA-43** Offline Intelligence; Guardian.
**Queue rule:** **QUEUE AFTER LA-43A.** Ordering: **LA-43 Offline Intelligence + Global Knowledge Nervous System + Culture/Travel/Business Intelligence + 18+ Private Community Trust OS V530 → LA-43A Global Naturist Business + Tourism + Culture + Private Community Universe V535 → LA-44 (this V540) → LA-45 Global Innovation + Invention + IP Intelligence V550 → LA-46…60**.
**Branch:** `xiv-v2` (never `main`). Dual remotes GitHub + GitLab. Never force-push. Tip may still land **LA-43A** — park on `cursor/queue-2i-la-44-*-4059`; rebase when LA-43A on tip; never force-push.
**Canonical path:** `docs/architecture/xiv-2i-la-44-startup-company-creation-factory-v540.md`
**Founder summary sibling:** [`../queue/2I-LA-44-startup-company-creation-factory.md`](../queue/2I-LA-44-startup-company-creation-factory.md)
**Canonical master queue:** [`xiv-master-build-queue-2i-ad-to-2i-kz.md`](./xiv-master-build-queue-2i-ad-to-2i-kz.md)
**Compose with:** LA-04 Meta Brain, LA-05 Evidence/KG, LA-06 Memory/Learning, LA-07 Trust/Legal/Commerce, LA-08 Curiosity/Contradiction, LA-09 Temporal+Causal, LA-10/LA-38 Simulation (SIM≠reality), LA-11 Model Router, LA-14 Cybersecurity, LA-15 Legal (AI≠lawyer), **LA-16** AI CFO, LA-17 Privacy, LA-18 Age/Identity/Trust, LA-20 Creator OS, LA-21 Product Passport, LA-22 Federation, LA-22B Treasury, LA-23 Security Factory, **LA-24** Supply Chain Twin, **LA-25** Company Twin + Business Hospital, LA-26 Agent University, LA-27 Marketplace, **LA-29** 24/7 Org, **LA-30** Founder Mission Control, LA-31 Identity/Trust, LA-32/LA-42 Contracts, **LA-34** Capital/Funding, LA-35 Fabric, **LA-35A** Zero-Trust, LA-36 C2C, LA-37 Product Twin, **LA-38** Planetary Simulation, **LA-39** Africa Intelligence, **LA-40** Brain Foundation / Master Plan, LA-41 Relationship Graph, **LA-43** Offline factory compose, **LA-43A Global Naturist Business + Tourism + Culture + Private Community Universe V535**, Guardian, Tenant/Universe Isolation, RLS, Secret plane.
**Feeds:** **2I-LA-45** Global Innovation + Invention + IP Intelligence V550 — LA-44 supplies CompanyFactory / StartupBrain / CompanyBlueprint / stage honesty / Founder interview & idea history / Master Plan propose-only / domain brains / financial scenario honesty / virtual org designer / product+MVP factory / Failure Lab / Launch readiness honesty; **not** LA-45 innovation/invention/IP intelligence depth. **Do not start LA-45 from this commit.**

> Docs-only queue. **QUEUE AFTER LA-43A.** Do **not** interrupt active validated / deployment-critical work or unfinished **LA-43A** tip-land WIP. Do **not** destabilize the 30-day deployment runway. **No CompanyFactory / StartupBrain / CompanyBlueprint / autonomous company / contract signing / money movement / production deployment runtime in this commit.** **L4 DISABLED**.
>
> **Feature flags (default OFF / FALSE):** `STARTUP_COMPANY_CREATION_FACTORY_V540_ENABLED`, `COMPANY_FACTORY_ENABLED`, `STARTUP_BRAIN_ENABLED`, `COMPANY_BLUEPRINT_ENABLED`, `FOUNDER_INTERVIEW_ENABLED`, `IDEA_HISTORY_ENABLED`, `MASTER_PLAN_PROPOSE_ENABLED`, `PROBLEM_BRAIN_ENABLED`, `MARKET_BRAIN_ENABLED`, `COMPETITOR_BRAIN_ENABLED`, `CUSTOMER_BRAIN_ENABLED`, `BUSINESS_MODEL_SCENARIO_ENABLED`, `FINANCIAL_FORECAST_SCENARIO_ENABLED`, `VIRTUAL_ORG_DESIGNER_ENABLED`, `AI_WORKFORCE_DESIGNER_ENABLED`, `AI_BOARD_ADVISORY_ENABLED`, `PRODUCT_MVP_FACTORY_ENABLED`, `SOFTWARE_FACTORY_ENABLED`, `OFFLINE_FACTORY_COMPOSE_ENABLED`, `DATABASE_ARCHITECT_ENABLED`, `SECURITY_PRIVACY_BY_DESIGN_ENABLED`, `LEGAL_WORKFLOW_ASSIST_ENABLED`, `SUPPLY_CHAIN_STARTUP_COMPOSE_ENABLED`, `BRAND_STUDIO_ENABLED`, `MARKETING_SALES_ASSIST_ENABLED`, `BUSINESS_HOSPITAL_COMPOSE_ENABLED`, `STARTUP_DIGITAL_TWIN_ENABLED`, `STARTUP_SIMULATION_ENABLED`, `AFRICA_COUNTRY_SPECIFIC_STARTUP_ENABLED`, `COMPANY_BRAIN_ISOLATION_ENABLED`, `LESSON_ENGINE_ENABLED`, `EVOLUTION_ENGINE_ENABLED`, `FOUNDER_MISSION_CONTROL_COMPOSE_ENABLED`, `BUILD_MY_X_EXPERIENCE_ENABLED`, `PLAN_FACT_CHECKER_ENABLED`, `FAILURE_LAB_ENABLED`, `LAUNCH_READINESS_CHECK_ENABLED`, **`AUTONOMOUS_COMPANY_FORMATION_ENABLED=FALSE`**, **`AUTONOMOUS_CONTRACT_SIGNING_ENABLED=FALSE`**, **`AUTONOMOUS_MONEY_MOVEMENT_ENABLED=FALSE`**, **`AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED=FALSE`**, **`AI_BOARD_LEGAL_AUTHORITY_ENABLED=FALSE`**, **`XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED=FALSE`**, **`UNRESTRICTED_AGENT_SPAWN_ENABLED=FALSE`**, **`SPAM_OUTREACH_ENABLED=FALSE`**, **`DECEPTIVE_MARKETING_ENABLED=FALSE`**, **`L4_AUTONOMY_ENABLED=FALSE`**.
>
> **Tip note:** Tip may still land **LA-43A Global Naturist Business + Tourism + Culture + Private Community Universe V535** — park on `cursor/queue-2i-la-44-*-4059`; rebase when LA-43A on tip. Dual-push; never force-push / never `main`. Master queue: **LA-43 → LA-43A → LA-44 (this V540) → LA-45 Global Innovation + Invention + IP Intelligence V550 → LA-46…60**.
>
> **Hard honesty (must encode):**
> 1. **IDEA ≠ COMPANY**; **PLAN ≠ OPERATING**; **VISION ≠ FACT**; **FORECAST ≠ FACT**; **CODE ≠ PRODUCTION**; **FUNDING ≠ COMMITMENT**; **OWNERSHIP SIGNUP ≠ EQUITY**; **LAUNCH READINESS ≠ GUARANTEE**.
> 2. Agents may **propose** Master Plan changes — **cannot silently rewrite** the Master Plan.
> 3. XIV does **not** auto-own customer startups (`XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED=FALSE`).
> 4. **No unrestricted agent spawn**; AI Board ≠ legal board; Legal workflow ≠ attorney; Brand ≠ trademark clearance; Marketing/Sales — **no spam / deception**.
> 5. Decimal money; AI CFO limits; Offline factory compose LA-43; Simulation compose LA-38 (SIM≠reality); **L4 DISABLED**.
> 6. Autonomy quartet permanently FALSE until explicit founder + Guardian + evidence gates: **AUTONOMOUS_COMPANY_FORMATION / CONTRACT_SIGNING / MONEY_MOVEMENT / PRODUCTION_DEPLOYMENT = FALSE**.
>
> **Queued architecture ≠ implementation proof.** Evidence placeholders remain **QUEUED / FALSE / UNKNOWN**. **HARD STOP — no LA-44 runtime.** **Do not start LA-45.**

---

## Sequencing (hard)

| Story | Title | Role |
|-------|-------|------|
| **2I-LA-25** | Global Company Digital Twin + Business Hospital | Compose (hospital / twin / AI Board honesty) |
| **2I-LA-30** | Founder Mission Control V130 | Compose (Founder surfaces) |
| **2I-LA-34** | Business Capital + Funding Intelligence | Compose (funding≠commitment) |
| **2I-LA-38** | Planetary Business Simulation + Digital Twin Supercomputer | Compose (Startup Digital Twin + simulation) |
| **2I-LA-40** | Brain Foundation + Master Plan | Master Plan propose-only honesty |
| **2I-LA-42** | Enterprise Contract + Deal Intelligence | Contracts compose (LA-42) |
| **2I-LA-43** | Offline Intelligence + Global Knowledge… V530 | Offline factory compose |
| **2I-LA-43A** | Global Naturist Business + Tourism + Culture + Private Community Universe V535 | **Must PASS before LA-44 code** |
| **2I-LA-44** | Startup + Company Creation Factory V540 | **This document** |
| **2I-LA-45** | Global Innovation + Invention + IP Intelligence V550 | **NEXT** (title queued — do not start) |
| **2I-LA-46…60** | Prepared expansion titles | Title queue |

**Ordering lock:** **LA-43 Offline Intelligence + Global Knowledge Nervous System + Culture/Travel/Business Intelligence + 18+ Private Community Trust OS V530 → LA-43A Global Naturist Business + Tourism + Culture + Private Community Universe V535 → LA-44 Startup + Company Creation Factory V540 → LA-45 Global Innovation + Invention + IP Intelligence V550 → LA-46…60**.

**Deployment runway:** Do **not** block first canary on CompanyFactory LIVE, autonomous formation, contract signing, money movement, or production deployment. Prioritize stage honesty, isolation, Master Plan propose-only, autonomy flags FALSE, Plan fact checker VISION≠FACT. **L4 DISABLED**.

---

## Critical architecture rules (permanent — hard honesty)

### Stage / ontology honesty

| Rule | Contract |
|------|----------|
| IDEA | ≠ COMPANY |
| PLAN | ≠ OPERATING |
| VISION | ≠ FACT |
| FORECAST | ≠ FACT |
| CODE | ≠ PRODUCTION |
| FUNDING | ≠ COMMITMENT |
| OWNERSHIP SIGNUP | ≠ EQUITY |
| LAUNCH READINESS | ≠ GUARANTEE / success claim |
| One DB | ≠ everything |
| Brand assets | ≠ trademark clearance |
| Legal workflow assist | ≠ attorney |
| AI Board | ≠ legal board of directors |
| AI CFO | ≠ money-release authority |

### Autonomy / ownership bans (permanent defaults)

| Flag / rule | Default |
|-------------|---------|
| `AUTONOMOUS_COMPANY_FORMATION_ENABLED` | **FALSE** |
| `AUTONOMOUS_CONTRACT_SIGNING_ENABLED` | **FALSE** |
| `AUTONOMOUS_MONEY_MOVEMENT_ENABLED` | **FALSE** |
| `AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED` | **FALSE** |
| `XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED` | **FALSE** |
| `UNRESTRICTED_AGENT_SPAWN_ENABLED` | **FALSE** |
| `AI_BOARD_LEGAL_AUTHORITY_ENABLED` | **FALSE** |
| `SPAM_OUTREACH_ENABLED` | **FALSE** |
| `DECEPTIVE_MARKETING_ENABLED` | **FALSE** |
| `L4_AUTONOMY_ENABLED` | **FALSE** |

### Master Plan connection

| Rule | Contract |
|------|----------|
| Agents | May **propose** Master Plan deltas with evidence packs |
| Silent rewrite | **Forbidden** — no agent may silently rewrite Master Plan |
| Human/Founder | Approve / reject / defer proposals |
| Compose | LA-40 Master Plan Intelligence honesty |

---

## Founder user story

As the XIV AI Founder, I want XIV to run **Startup + Company Creation Factory V540** — a governed **CompanyFactory / StartupBrain** that turns founder ideas into **CompanyBlueprints** through honest stages (**IDEA ≠ COMPANY**, **PLAN ≠ OPERATING**); captures **Founder interview + idea history**; connects to the **Master Plan** so agents **propose** but **cannot silently rewrite**; runs **Problem / Market / Competitor / Customer** brains; models **business + financial scenarios** (**forecast ≠ fact**, **decimal money**) with **AI CFO limits**; treats **funding ≠ commitment** and **ownership signup ≠ equity**; ensures **XIV does not auto-own customer startups**; designs **virtual orgs + AI workforce** without unrestricted agent spawn; keeps **AI Board ≠ legal board**; runs **Product / MVP / Software factory** where **code ≠ production**; composes **Offline factory (LA-43)**; uses a **Database architect** honesty (**one DB ≠ everything**); applies **Security / Privacy-by-design**; runs **Legal workflow ≠ attorney** and **Contracts (LA-42)**; covers **Supply chain**, **Brand ≠ trademark clearance**, **Marketing/Sales (no spam/deception)**; composes **Business Hospital**, **Startup Digital Twin + simulation (LA-38)**, **Africa country-specific** paths; enforces **Company Brain isolation**; runs **Lesson / Evolution engines**; surfaces **Founder Mission Control**; supports **“Build my X”** experiences; runs a **Plan fact checker (VISION ≠ FACT)** and **Failure Lab**; treats **Launch readiness ≠ guarantee**; keeps **L4 DISABLED**; documents **DB/RLS**, **tests**, **release slices 1–5**, feature flags with **AUTONOMOUS_COMPANY_FORMATION / CONTRACT_SIGNING / MONEY_MOVEMENT / PRODUCTION_DEPLOYMENT = FALSE**; permanent rules; evidence **NEVER INFER PASS**; next **LA-45 Global Innovation + Invention + IP Intelligence V550 → LA-46…60** — with **no runtime in this commit**.

### Core loops (contract)

**Idea → blueprint loop**

```
Founder idea / “Build my X”
→ Founder interview + idea history capture
→ Stage = IDEA (≠ COMPANY)
→ Domain brains (Problem/Market/Competitor/Customer) → evidence-graded
→ CompanyBlueprint DRAFT
→ Plan fact checker (VISION ≠ FACT)
→ Human gate → PLAN stage (≠ OPERATING)
→ Never auto-form company / sign / move money / deploy
```

**Master Plan propose loop**

```
Factory insight / EvolutionEngine candidate
→ MasterPlanProposal (evidence + diff)
→ Founder / authorized human review
→ Accept | Reject | Defer
→ Silent rewrite FORBIDDEN
```

**Formation honesty loop**

```
AUTONOMOUS_COMPANY_FORMATION_ENABLED = FALSE
AUTONOMOUS_CONTRACT_SIGNING_ENABLED = FALSE
AUTONOMOUS_MONEY_MOVEMENT_ENABLED = FALSE
AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED = FALSE
→ Formation / signing / money / prod deploy = human + Guardian gated
→ XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED = FALSE
```

**Failure → lesson loop**

```
Failure Lab scenario / real postmortem
→ LessonEngine capture (tenant-isolated)
→ EvolutionEngine proposal (not silent apply)
→ Company Brain isolation preserved
```

---

## 1. Mission

Queue a governed **Startup + Company Creation Factory V540** that helps founders go from idea to blueprint to plan to (eventually) operating company — without autonomous formation, without silent Master Plan rewrite, without XIV auto-owning customer startups, without unrestricted agent spawn, without treating forecasts as facts, code as production, funding as commitment, signup as equity, AI Board as legal board, legal assist as attorney, brand as trademark clearance, launch readiness as guarantee, or one database as the entire platform.

## 2. CompanyFactory / StartupBrain

| Object | Contract |
|--------|----------|
| `CompanyFactory` | Orchestrates startup creation workflows across stages |
| `StartupBrain` | Meta-coordination brain for idea→blueprint→plan guidance |
| Authority | Advisory / drafting only — **no** formation, signing, money, or prod deploy authority |
| Isolation | Per-founder / per-company-tenant; PRIVATE ≠ Global Brain default |
| Ban | Autonomous company creation theater |
| Flag | `COMPANY_FACTORY_ENABLED`, `STARTUP_BRAIN_ENABLED` (default OFF); **`AUTONOMOUS_COMPANY_FORMATION_ENABLED=FALSE`** |

## 3. CompanyBlueprint

| Object | Contract |
|--------|----------|
| `CompanyBlueprint` | Versioned structured plan: problem, market, model, org, product, risk, finances (scenario) |
| States | IDEA / DRAFT / PLAN / READY_FOR_REVIEW / APPROVED_PLAN / ARCHIVED |
| Honesty | Blueprint APPROVED_PLAN ≠ operating company; ≠ legal entity formed |
| Provenance | Every section evidence-graded; UNKNOWN allowed |
| Diff | Blueprint versions supersede; no silent overwrite of Founder-approved sections |

## 4. Stages (IDEA ≠ COMPANY, PLAN ≠ OPERATING)

| Stage | Meaning | Hard ban |
|-------|---------|----------|
| `IDEA` | Captured concept | ≠ COMPANY |
| `PLAN` | Structured blueprint / Master Plan proposal path | ≠ OPERATING |
| `FORMING` | Human-gated legal/formation assist (future) | No auto-form |
| `OPERATING` | Live company ops (future compose) | Requires human + Guardian gates |
| `PAUSED` / `FAILED` / `ARCHIVED` | Explicit lifecycle | Failure Lab / LessonEngine hooks |

Stage labels must appear in UI/API truth labels. Calendar progress ≠ stage promotion.

## 5. Founder interview + idea history

| Object | Contract |
|--------|----------|
| `FounderInterview` | Guided intake; consent-scoped; private by default |
| `IdeaHistory` | Bitemporal idea versions + decisions + abandoned paths |
| Honesty | Interview notes ≠ commitments; ideas ≠ IP assignment to XIV |
| Compose | LA-30 Founder Mission Control; LA-40 Founder Idea Memory |
| Training | Founder private interview ≠ Global Brain / ads training default |

## 6. Master Plan connection (agents propose, cannot silently rewrite)

| Object | Contract |
|--------|----------|
| `MasterPlanProposal` | Diff + evidence + rationale from Factory / EvolutionEngine |
| Apply path | Human accept only |
| Ban | Silent rewrite; agent self-merge; “auto-align Master Plan” without approval |
| Compose | LA-40 Master Plan Intelligence |
| Flag | `MASTER_PLAN_PROPOSE_ENABLED` (default OFF) — propose ≠ apply |

## 7. Problem / Market / Competitor / Customer brains

| Brain | Contract | Hard honesty |
|-------|----------|--------------|
| `ProblemBrain` | Problem framing / JTBD / pain evidence | Hypothesis ≠ validated problem |
| `MarketBrain` | Market sizing / segments | Estimate ≠ fact; TAM theater banned without evidence |
| `CompetitorBrain` | Competitor maps | Public research ≠ private dossiers; INFERRED≠VERIFIED |
| `CustomerBrain` | Persona / segment / interview synthesis | Persona ≠ real person surveillance |

All outputs evidence-graded; UNKNOWN valid; compose LA-08 contradiction; LA-41 relationship honesty where applicable.

## 8. Business model + financial scenarios (forecast ≠ fact, decimal money)

| Object | Contract |
|--------|----------|
| `BusinessModelScenario` | Canvas / revenue model alternatives labeled SCENARIO |
| `FinancialForecastScenario` | Projections with assumptions + ranges |
| Money | **Decimal** money types — no float currency math |
| Honesty | **FORECAST ≠ FACT**; projected revenue ≠ collected revenue |
| Compose | LA-16 AI CFO; LA-22B Treasury honesty |
| Ban | Presenting scenario as bank-backed fact |

## 9. AI CFO limits

| Rule | Contract |
|------|----------|
| AI CFO | Advisory / scenario / variance analysis only |
| Ban | Money release, payment initiation, settlement claims without provider proof |
| Compose | LA-16 limits; autonomy money flag FALSE |
| Ledger UI | ≠ bank balance unless provider-proven |

## 10. Funding ≠ commitment; ownership signup ≠ equity

| Claim | Reality |
|-------|---------|
| Funding interest / pipeline | ≠ commitment / closed round |
| Term sheet draft | ≠ binding investment |
| Ownership signup / waitlist | ≠ equity / royalty / partnership |
| Cap table scenario | ≠ issued equity |
| XIV platform signup | ≠ XIV ownership of customer startup |
| Flag | **`XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED=FALSE`** |
| Compose | LA-34 Capital/Funding Intelligence |

## 11. XIV does not auto-own customer startups

Customer companies created via the Factory remain customer-owned. XIV may offer platform services under explicit contracts (LA-42). No ambient equity claim from using XIV. No silent share issuance to XIV entities.

## 12. Virtual org + AI workforce designer (no unrestricted agent spawn)

| Object | Contract |
|--------|----------|
| `VirtualOrgDesigner` | Org charts / role maps / RACI drafts |
| `AIWorkforceDesigner` | Capability → role proposals (compose LA-26/29) |
| Role creation | Capability gap → evidence → proposal → duplicate check → cost → security → eval → sandbox → approval → registry |
| Ban | **`UNRESTRICTED_AGENT_SPAWN_ENABLED=FALSE`** — title ≠ permission; more agents ≠ authority |
| Compose | LA-04 role creation principle; LA-29 24/7 Org |

## 13. AI Board ≠ legal board

| Object | Contract |
|--------|----------|
| `AIBoardAdvisory` | Scenario review / risk challenge / recommendation council |
| Honesty | **≠ legal board of directors**; ≠ fiduciary authority; ≠ signatory |
| Flag | **`AI_BOARD_LEGAL_AUTHORITY_ENABLED=FALSE`** |
| Compose | LA-25 AI Board honesty |

## 14. Product / MVP / Software factory (code ≠ production)

| Object | Contract |
|--------|----------|
| `ProductMvpFactory` | MVP scope, experiments, acceptance criteria drafts |
| `SoftwareFactory` | Codegen / scaffolding / CI stubs — sandboxed |
| Honesty | **CODE ≠ PRODUCTION**; generated app ≠ deployed product; green local build ≠ canary |
| Ban | **`AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED=FALSE`** |
| Compose | LA-23 QA/security; Guardian deploy gates |

## 15. Offline factory (LA-43)

Compose OfflineBrain / offline capability classes / candidate knowledge honesty from LA-43. Offline blueprint edits = CANDIDATE sync; no silent promotion; offline ≠ authority expansion.

## 16. Database architect (one DB ≠ everything)

| Object | Contract |
|--------|----------|
| `DatabaseArchitectAssist` | Schema proposals, tenancy, RLS, storage router advice |
| Honesty | **One DB ≠ everything**; Universe ≠ single physical DB; federation compose LA-22 |
| Ban | “Put the whole company in one table/database” as architecture truth |

## 17. Security / Privacy-by-design

| Object | Contract |
|--------|----------|
| `SecurityPrivacyByDesignGate` | Threat model stubs, data-minimization, consent, secret plane |
| Compose | LA-14, LA-17, LA-35A Zero-Trust |
| Defaults | Fail closed; least privilege; PRIVATE ≠ training |
| Ban | Security theater without evidence; inventing certifications |

## 18. Legal workflow ≠ attorney; Contracts LA-42

| Object | Contract |
|--------|----------|
| `LegalWorkflowAssist` | Checklists, jurisdiction questions, document drafts |
| Honesty | **≠ attorney**; **≠ legal advice product claim** |
| Contracts | Compose **LA-42** Deal/Contract Intelligence — templates ≠ advice; human signatory |
| Flags | **`AUTONOMOUS_CONTRACT_SIGNING_ENABLED=FALSE`** |

## 19. Supply chain

Compose LA-24 Supply Chain Digital Twin for startup physical/digital supply plans. Plans ≠ live supplier commitments; concentration honesty; no fake LIVE logistics.

## 20. Brand ≠ trademark clearance

| Object | Contract |
|--------|----------|
| `BrandStudioAssist` | Naming / brand kit drafts |
| Honesty | Brand draft ≠ trademark clearance / registrability guarantee |
| Ban | Claiming “name is clear globally” without evidence + counsel path |

## 21. Marketing / Sales (no spam / deception)

| Rule | Contract |
|------|----------|
| Assist | Campaign drafts, ICP, messaging experiments |
| Ban | **`SPAM_OUTREACH_ENABLED=FALSE`**; **`DECEPTIVE_MARKETING_ENABLED=FALSE`** |
| Honesty | Opportunity ≠ revenue; open rate ≠ consent forever |
| Compose | LA-17 sales tech honesty; LA-41 no autonomous outreach |

## 22. Business Hospital

Compose LA-25 Business Hospital for startup health diagnosis metaphor. Treatment proposal ≠ production surgery; hospital ≠ practicing medicine; COMPANY HEALTH vanity scores banned without evidence.

## 23. Startup Digital Twin + simulation (LA-38)

| Object | Contract |
|--------|----------|
| `StartupDigitalTwin` | Twin of blueprint/company scenario |
| Simulation | Compose LA-38 planetary/business sim — **SIM ≠ reality / future / authority** |
| Ban | Sim results as guaranteed outcomes; sim→prod write |
| Flag | `STARTUP_DIGITAL_TWIN_ENABLED`, `STARTUP_SIMULATION_ENABLED` (default OFF) |

## 24. Africa country-specific

| Object | Contract |
|--------|----------|
| `AfricaCountrySpecificStartupPath` | Country-aware checklists / market / jurisdiction questions |
| Compose | LA-39 Global Africa Intelligence Brain |
| Honesty | Country pack ≠ omniscient compliance; JurisdictionResolver questions; Africa first-class — not afterthought |
| Ban | One-size “Africa” monolith without country specificity |

## 25. Company Brain isolation

| Rule | Contract |
|------|----------|
| Company A Brain | ≠ Company B Brain ≠ Global Brain ≠ Founder private finance |
| Cross-tenant | Clean-room / explicit share only |
| Leak | Forbidden; RLS + Universe isolation mandatory when implemented |
| Compose | LA-25 Company Brain isolation |

## 26. Lesson / Evolution engines

| Object | Contract |
|--------|----------|
| `LessonEngine` | Captures failures / wins with provenance |
| `EvolutionEngine` | Proposes improvements — **propose ≠ silent apply** |
| Honesty | Lesson ≠ automatic production change; evolution ≠ L4 self-rewrite |
| Compose | LA-40 EvolutionEngine honesty |

## 27. Founder Mission Control

Compose LA-30 Founder Mission Control surfaces for factory missions, briefs, and gates. Founder control ≠ raw root; Founder Twin ≠ Founder; offline Founder ≠ authority expansion.

## 28. “Build my X” experiences

| Object | Contract |
|--------|----------|
| `BuildMyXExperience` | Guided factory journeys (“Build my marketplace”, “Build my clinic ops”, …) |
| Honesty | Experience progress ≠ live company; templates ≠ unique strategy proof |
| Gate | Still bound by autonomy flags FALSE and stage honesty |

## 29. Plan fact checker (VISION ≠ FACT)

| Object | Contract |
|--------|----------|
| `PlanFactChecker` | Labels claims VISION / HYPOTHESIS / FORECAST / FACT / UNKNOWN |
| Ban | Vision language presented as verified fact |
| Compose | LA-40 PLAN≠IMPLEMENTED; LA-42 DealClaimVerifier spirit |
| Flag | `PLAN_FACT_CHECKER_ENABLED` (default OFF until implemented) |

## 30. Failure Lab

| Object | Contract |
|--------|----------|
| `FailureLab` | Sandbox for premortems, stress scenarios, competitor shocks |
| Honesty | Lab outcome ≠ destiny; failure rehearsal ≠ real incident |
| Output | Feeds LessonEngine; no silent org mutation |

## 31. Launch readiness ≠ guarantee

| Object | Contract |
|--------|----------|
| `LaunchReadinessCheck` | Checklist / evidence pack for go-live gates |
| Honesty | **READY label ≠ success guarantee**; ≠ market outcome promise |
| Ban | Marketing “guaranteed launch success” from checklist green |

## 32. L4 DISABLED

**`L4_AUTONOMY_ENABLED=FALSE`**. Bounded autonomy must not self-promote to L4. Factory cannot grant itself formation / signing / money / prod deploy powers.

## 33. DB / RLS (evaluation list — not create-yet)

Evaluate later: `company_factories`, `startup_brains`, `company_blueprints`, `blueprint_versions`, `factory_stages`, `founder_interviews`, `idea_histories`, `master_plan_proposals`, `problem_brain_runs`, `market_brain_runs`, `competitor_brain_runs`, `customer_brain_runs`, `business_model_scenarios`, `financial_forecast_scenarios`, `virtual_org_designs`, `ai_workforce_designs`, `ai_board_advisory_sessions`, `product_mvp_factory_runs`, `software_factory_runs`, `database_architect_proposals`, `security_privacy_gates`, `legal_workflow_assists`, `brand_studio_drafts`, `marketing_sales_assists`, `startup_digital_twins`, `startup_simulations`, `africa_country_startup_paths`, `company_brain_isolation_policies`, `lesson_engine_entries`, `evolution_engine_proposals`, `build_my_x_sessions`, `plan_fact_checker_results`, `failure_lab_runs`, `launch_readiness_checks`. **Do not create in this docs commit.** RLS / tenant / Universe / company_id columns required on tenant-scoped tables when created. Cross-company reads fail closed.

## 34. Tests (document — do not implement yet)

Document tests for: IDEA≠COMPANY; PLAN≠OPERATING; VISION≠FACT; FORECAST≠FACT; CODE≠PRODUCTION; FUNDING≠COMMITMENT; OWNERSHIP SIGNUP≠EQUITY; LAUNCH READINESS≠GUARANTEE; Master Plan silent rewrite deny; XIV auto-own deny; unrestricted agent spawn deny; AI Board≠legal board; AI CFO no money release; decimal money; autonomous formation/signing/money/prod deploy deny; spam/deception deny; brand≠trademark clearance; legal≠attorney; one DB≠everything; Company Brain isolation; SIM≠reality; Africa country-specific honesty; Plan fact checker labels; Failure Lab no silent mutation; L4 disabled; RLS/tenant isolation; evidence NEVER INFER PASS.

## 35. Feature flags (default OFF)

```
STARTUP_COMPANY_CREATION_FACTORY_V540_ENABLED=false
COMPANY_FACTORY_ENABLED=false
STARTUP_BRAIN_ENABLED=false
COMPANY_BLUEPRINT_ENABLED=false
FOUNDER_INTERVIEW_ENABLED=false
IDEA_HISTORY_ENABLED=false
MASTER_PLAN_PROPOSE_ENABLED=false
PROBLEM_BRAIN_ENABLED=false
MARKET_BRAIN_ENABLED=false
COMPETITOR_BRAIN_ENABLED=false
CUSTOMER_BRAIN_ENABLED=false
BUSINESS_MODEL_SCENARIO_ENABLED=false
FINANCIAL_FORECAST_SCENARIO_ENABLED=false
VIRTUAL_ORG_DESIGNER_ENABLED=false
AI_WORKFORCE_DESIGNER_ENABLED=false
AI_BOARD_ADVISORY_ENABLED=false
PRODUCT_MVP_FACTORY_ENABLED=false
SOFTWARE_FACTORY_ENABLED=false
OFFLINE_FACTORY_COMPOSE_ENABLED=false
DATABASE_ARCHITECT_ENABLED=false
SECURITY_PRIVACY_BY_DESIGN_ENABLED=false
LEGAL_WORKFLOW_ASSIST_ENABLED=false
SUPPLY_CHAIN_STARTUP_COMPOSE_ENABLED=false
BRAND_STUDIO_ENABLED=false
MARKETING_SALES_ASSIST_ENABLED=false
BUSINESS_HOSPITAL_COMPOSE_ENABLED=false
STARTUP_DIGITAL_TWIN_ENABLED=false
STARTUP_SIMULATION_ENABLED=false
AFRICA_COUNTRY_SPECIFIC_STARTUP_ENABLED=false
COMPANY_BRAIN_ISOLATION_ENABLED=false
LESSON_ENGINE_ENABLED=false
EVOLUTION_ENGINE_ENABLED=false
FOUNDER_MISSION_CONTROL_COMPOSE_ENABLED=false
BUILD_MY_X_EXPERIENCE_ENABLED=false
PLAN_FACT_CHECKER_ENABLED=false
FAILURE_LAB_ENABLED=false
LAUNCH_READINESS_CHECK_ENABLED=false
AUTONOMOUS_COMPANY_FORMATION_ENABLED=false
AUTONOMOUS_CONTRACT_SIGNING_ENABLED=false
AUTONOMOUS_MONEY_MOVEMENT_ENABLED=false
AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED=false
AI_BOARD_LEGAL_AUTHORITY_ENABLED=false
XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED=false
UNRESTRICTED_AGENT_SPAWN_ENABLED=false
SPAM_OUTREACH_ENABLED=false
DECEPTIVE_MARKETING_ENABLED=false
L4_AUTONOMY_ENABLED=false
```

## 36. Release slices 1–5

| Slice | Scope | Non-blocking / stays FALSE |
|-------|-------|------------------------------|
| **1** | Hard honesty bans; autonomy quartet FALSE; IDEA≠COMPANY; PLAN≠OPERATING; VISION≠FACT; XIV auto-own deny; L4 off | Autonomous form/sign/money/prod |
| **2** | CompanyFactory / StartupBrain / CompanyBlueprint stubs; Founder interview + idea history contracts; stage labels | Operating company theater |
| **3** | Domain brains read-only; Plan fact checker; Master Plan propose-only (no silent rewrite); decimal money scenario labels | Forecast-as-fact; silent Master Plan apply |
| **4** | Virtual org + AI workforce designer gates; Product/MVP/Software factory sandboxes; Security/Privacy-by-design; DB architect honesty | Unrestricted spawn; CODE=PRODUCTION deploy |
| **5** | Failure Lab + Lesson/Evolution propose; Launch readiness≠guarantee; Africa country-specific packs; Startup twin/sim compose LA-38; Business Hospital compose | Launch success guarantees; L4; autonomy quartet |

**Entire V540 Startup + Company Creation Factory does not block first canary.**

## 37. Next queue — LA-45…60

| Story | Title |
|-------|-------|
| **2I-LA-45** | **Global Innovation + Invention + IP Intelligence V550** |
| **2I-LA-46** | Negotiated Obligation + Performance Twin (title queued) |
| **2I-LA-47** | Living Business Map Runtime (SIM≠reality) |
| **2I-LA-48** | Founder Simulation Sandbox Runtime (≠ reality) |
| **2I-LA-49** | Morning/Evening Brief + Overnight Learning Runtime |
| **2I-LA-50** | Mobile CEO Mode + Master Control Room Runtime |
| **2I-LA-51** | Continuous Assurance + Verification Fabric |
| **2I-LA-52** | Cross-Tenant Knowledge Firewalls + Collaboration Honesty (title queued) |
| **2I-LA-53** | Evidence Economy + Provenance Marketplace Honesty (title queued) |
| **2I-LA-54** | Autonomous Evaluation Harness Expansion (title queued) |
| **2I-LA-55** | Planetary Observability + Sensor Integrity Fabric (title queued) |
| **2I-LA-56** | Cross-Domain Twin Interoperability Runtime (title queued) |
| **2I-LA-57** | Enterprise Services Settlement + Delivery Honesty (title queued) |
| **2I-LA-58** | Global Procurement Integrity + Supplier Twin Expansion (title queued) |
| **2I-LA-59** | Business Services Exchange + AI Solution Network (title queued — prior LA-43 concept may land here if founder reassigns) |
| **2I-LA-60** | Continuity + Expansion Control Plane (title queued) |

**NEXT after LA-44:** **2I-LA-45** Global Innovation + Invention + IP Intelligence V550. **Do not implement LA-45…60 from this commit.** **Do not start LA-45.**

## 38. Completion evidence placeholders

| Evidence | State |
|----------|-------|
| Architecture queued | **QUEUED** |
| Runtime implemented | **FALSE** |
| AUTONOMOUS_COMPANY_FORMATION | **FALSE** |
| AUTONOMOUS_CONTRACT_SIGNING | **FALSE** |
| AUTONOMOUS_MONEY_MOVEMENT | **FALSE** |
| AUTONOMOUS_PRODUCTION_DEPLOYMENT | **FALSE** |
| XIV auto-own customer startups | **FALSE** (forbidden) |
| Unrestricted agent spawn | **FALSE** (forbidden) |
| AI Board legal authority | **FALSE** (forbidden) |
| Spam / deceptive marketing | **FALSE** (forbidden) |
| L4 autonomy | **FALSE** |
| CompanyFactory LIVE validated | **UNKNOWN** |
| Master Plan silent rewrite prevented LIVE | **UNKNOWN** |
| Overall LA-44 PASS | **UNKNOWN** — **NEVER INFER PASS** |

## 39–90. Permanent operational reminders (selected)

39. CompanyFactory / StartupBrain advisory only. 40. CompanyBlueprint ≠ operating company. 41. IDEA ≠ COMPANY. 42. PLAN ≠ OPERATING. 43. Founder interview + idea history private. 44. Master Plan propose ≠ silent rewrite. 45. Problem/Market/Competitor/Customer brains evidence-graded. 46. Forecast ≠ fact. 47. Decimal money. 48. AI CFO limits. 49. Funding ≠ commitment. 50. Ownership signup ≠ equity. 51. XIV does not auto-own customer startups. 52. No unrestricted agent spawn. 53. AI Board ≠ legal board. 54. CODE ≠ PRODUCTION. 55. Offline factory compose LA-43. 56. One DB ≠ everything. 57. Security/Privacy-by-design. 58. Legal workflow ≠ attorney. 59. Contracts LA-42. 60. Supply chain compose. 61. Brand ≠ trademark clearance. 62. No spam/deception. 63. Business Hospital compose. 64. Startup Digital Twin + sim LA-38; SIM≠reality. 65. Africa country-specific. 66. Company Brain isolation. 67. Lesson/Evolution propose≠apply. 68. Founder Mission Control compose. 69. Build my X honesty. 70. Plan fact checker VISION≠FACT. 71. Failure Lab. 72. Launch readiness ≠ guarantee. 73. Autonomy quartet FALSE. 74. Flags default OFF. 75. Release slices 1–5. 76. UNKNOWN valid. 77. Never infer PASS. 78. L4 DISABLED. 79. Queued architecture ≠ implementation proof. 80. Do not start LA-45 from this commit.

## 91–160. Permanent rules block (CEO)

```
COMPANYFACTORY / STARTUPBRAIN — ADVISORY / DRAFT ONLY
COMPANYBLUEPRINT ≠ OPERATING COMPANY
IDEA ≠ COMPANY
PLAN ≠ OPERATING
VISION ≠ FACT
FORECAST ≠ FACT
CODE ≠ PRODUCTION
FUNDING ≠ COMMITMENT
OWNERSHIP SIGNUP ≠ EQUITY
LAUNCH READINESS ≠ GUARANTEE
FOUNDER INTERVIEW + IDEA HISTORY — PRIVATE BY DEFAULT
MASTER PLAN — AGENTS PROPOSE; CANNOT SILENTLY REWRITE
PROBLEM / MARKET / COMPETITOR / CUSTOMER BRAINS — EVIDENCE GRADED
BUSINESS MODEL + FINANCIAL SCENARIOS — DECIMAL MONEY
AI CFO LIMITS — NO MONEY RELEASE
XIV DOES NOT AUTO-OWN CUSTOMER STARTUPS
XIV_AUTO_OWN_CUSTOMER_STARTUPS_ENABLED = FALSE
VIRTUAL ORG + AI WORKFORCE DESIGNER
UNRESTRICTED_AGENT_SPAWN_ENABLED = FALSE
MORE AGENTS ≠ AUTHORITY
AI BOARD ≠ LEGAL BOARD
AI_BOARD_LEGAL_AUTHORITY_ENABLED = FALSE
PRODUCT / MVP / SOFTWARE FACTORY — CODE ≠ PRODUCTION
OFFLINE FACTORY COMPOSE LA-43
DATABASE ARCHITECT — ONE DB ≠ EVERYTHING
SECURITY / PRIVACY-BY-DESIGN
LEGAL WORKFLOW ≠ ATTORNEY
CONTRACTS COMPOSE LA-42
SUPPLY CHAIN COMPOSE
BRAND ≠ TRADEMARK CLEARANCE
MARKETING / SALES — NO SPAM / DECEPTION
SPAM_OUTREACH_ENABLED = FALSE
DECEPTIVE_MARKETING_ENABLED = FALSE
BUSINESS HOSPITAL COMPOSE
STARTUP DIGITAL TWIN + SIMULATION LA-38 — SIM ≠ REALITY
AFRICA COUNTRY-SPECIFIC PATHS
COMPANY BRAIN ISOLATION
LESSON / EVOLUTION ENGINES — PROPOSE ≠ SILENT APPLY
FOUNDER MISSION CONTROL COMPOSE
BUILD MY X EXPERIENCES — PROGRESS ≠ LIVE COMPANY
PLAN FACT CHECKER — VISION ≠ FACT
FAILURE LAB
AUTONOMOUS_COMPANY_FORMATION_ENABLED = FALSE
AUTONOMOUS_CONTRACT_SIGNING_ENABLED = FALSE
AUTONOMOUS_MONEY_MOVEMENT_ENABLED = FALSE
AUTONOMOUS_PRODUCTION_DEPLOYMENT_ENABLED = FALSE
FEATURE FLAGS DEFAULT OFF
RELEASE SLICES 1–5
UNKNOWN IS VALID
QUEUED ARCHITECTURE ≠ IMPLEMENTATION PROOF
NEVER INFER PASS
L4 DISABLED
DO NOT START LA-45 FROM THIS COMMIT
```

---

## Docs-only landing gate (this commit)

| Check | Result required |
|-------|-----------------|
| Docs paths | architecture V540 + queue summary + master/KZ update |
| Ordering | **LA-43 → LA-43A → LA-44 QUEUED (this V540) → LA-45 Global Innovation + Invention + IP Intelligence V550 → LA-46…60** |
| Remotes | LOCAL = GITHUB = GITLAB after dual-push |
| Tree | CLEAN |
| Runtime | **HARD STOP — no LA-44 runtime** |
| Flags | all listed flags default OFF; autonomy quartet / XIV auto-own / unrestricted spawn / AI Board legal / spam / deception / L4 **FALSE** |
| Evidence | **QUEUED / FALSE / UNKNOWN** |
| Parking | `cursor/queue-2i-la-44-*-4059` until LA-43A on tip; rebase — never force-push |
| Next | **Do not start LA-45** |

*END architecture queue for 2I-LA-44 — Startup + Company Creation Factory V540*
