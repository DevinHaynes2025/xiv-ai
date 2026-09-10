# XIV User Stories — Detailed (OS execution pack)

Format: ID · Persona · Goal · Acceptance · Evidence

---

## EY1 — Release & Runtime Verification Gate
**Persona:** Founder / platform engineer  
**Goal:** Know what actually runs on the ASUS tip before shipping more features.  
**Acceptance:**
1. `services/ai` health returns ok on `:8787`
2. `npm run test:runtime` executed; pass/fail recorded in `XIV_TEST_EVIDENCE.md`
3. Failures get one root-cause fix at a time (or clearly deferred with issue note)
4. Ollama reachable; local model listed  
**Evidence:** commands + counts in TEST_EVIDENCE  
**Status:** IN PROGRESS

---

## EY2 — ModelBackend Phase 0
**Persona:** Platform engineer  
**Goal:** Route executive structured turns through a replaceable backend (gemini | openai | ollama) without bypassing policy.  
**Acceptance:**
1. `MODEL_BACKEND` env selects backend; `auto` prefers ollama when offline/`OFFLINE_PREFER_LOCAL`
2. Gemini path still works when selected
3. Ollama adapter talks to `localhost:11434` with graceful `WAITING_PROVIDER` when down
4. `gateStructuredOutput` / approvals unchanged  
**APIs:** `POST /v1/executive/turn`  
**Evidence:** unit/integration tests + manual turn  
**Status:** QUEUED

---

## EY3 — Hardware capability probe
**Persona:** Platform / Guardian  
**Goal:** Agents can honestly see CPU/GPU/NPU/Ollama status (AMD 780M, no CUDA lies).  
**Acceptance:**
1. Read-only endpoint or governed tool returns CPU cores, GPU name/vendor, ollamaReachable, model names
2. NPU reported as unknown/absent unless detected
3. No secrets; no shell exec of arbitrary commands  
**Status:** QUEUED

---

## US-UNI-01 — Universe login
**Persona:** Executive  
**Goal:** Sign into a private Universe and only see that org’s data.  
**Acceptance:** RLS blocks cross-universe reads; membership required; mobile shows Universe name.  
**APIs/screens:** Supabase auth + `xiv_universes` / memberships; mobile executive routes  
**Status:** QUEUED

## US-EXE-01 — Executive Home + Business Health
**Persona:** Executive  
**Goal:** See a coherent health score and next recommended (non-executed) action.  
**Acceptance:** Score labeled prototype/synthetic if mock; recommendation requiresApproval.  
**Status:** QUEUED

## US-EXE-02 — Story Engine brief
**Persona:** Executive  
**Goal:** Get a narrative of what changed and why (not a dashboard dump).  
**Acceptance:** Structured brief with evidence sources; no silent production writes.  
**Status:** QUEUED

## US-AGT-01 — Propose supplier simulation
**Persona:** Executive  
**Goal:** Ask AI workforce to recommend supplier reallocation simulation.  
**Acceptance:** Action status `proposed`; human approval required; policy blocks auto-exec.  
**Status:** QUEUED

## US-AGT-02 — Approval + audit
**Persona:** Executive  
**Goal:** Approve/deny proposed actions and see audit events.  
**Acceptance:** Rows in `ai_agent_approvals` / `ai_agent_audit_events`; denied actions do not execute.  
**Status:** QUEUED

## US-EMP-01 — Anonymous employee feedback
**Persona:** Anonymous employee  
**Goal:** Submit candid feedback under alias.  
**Acceptance:** No legal name in agent context; Universe-scoped storage.  
**Status:** QUEUED

## US-CON-01 — Consumer innovate loop
**Persona:** Consumer  
**Goal:** Contribute an idea / early-access interest into a company Universe.  
**Acceptance:** Idea captured with consent; org isolation preserved.  
**Status:** QUEUED

## US-SOC-01 — Profiles + daily business articles
**Persona:** Consumer / Business  
**Goal:** Profiles and a daily generated business article feed (prototype).  
**Acceptance:** Article generator job writes draft articles; human publish gate; no scraped copyrighted dump.  
**Status:** QUEUED (prototype only)

## US-NET-01 — Supplier / manufacturer search
**Persona:** Business  
**Goal:** Search suppliers/manufacturers in a permissioned directory.  
**Acceptance:** Search returns stub/index data under RLS; no cross-tenant leak.  
**Status:** QUEUED

## US-PLG-01 — Plugin marketplace
**Persona:** Builder  
**Goal:** Browse and install a signed XIV plugin into a Universe.  
**Acceptance:** Unsigned install refused; install recorded; L4 still false.  
**Status:** QUEUED

---

## Out of scope for near-term (park)
- Quantum / QPU execution (authorized candidate only in architecture diagrams)
- Billion-user claims without evidence
- Production cloud provisioning for AWS/Azure/GCP until MVP earns it
