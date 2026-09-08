# 2I-LA-36 — Company-to-Company Agent Network V220

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / runtime **not started**
Branch: xiv-v2 (prefer ordered `cursor/queue-2i-la-35a-*-4059` with 35A then 36; rebase when LA-35/35A on tip)
HARD STOP: **DO NOT IMPLEMENT** until **2I-LA-35A PASS**. Queue **AFTER LA-35A**. Preserve **LA-35 → LA-35A** when present. Do not interrupt LA-27…LA-35A mid-flight or LA-01–03+ validated / release-critical / deployment-critical work. Do not destabilize 30-day deployment runway. L4 disabled.

**Feature flags (default OFF / FALSE):** `COMPANY_TO_COMPANY_AGENT_NETWORK_ENABLED`, `BUSINESS_AGENT_DIRECTORY_ENABLED`, `BUSINESS_PROTOCOL_GATEWAY_ENABLED`, `BUSINESS_MESSAGE_BUS_ENABLED`, `RFQ_QUOTE_NETWORK_ENABLED`, `NEGOTIATION_AGENT_ENABLED`, `CROSS_COMPANY_WORKFLOW_ENABLED`, `SALES_AGENT_NETWORK_ENABLED`, `PROCUREMENT_AGENT_NETWORK_ENABLED`, `LOGISTICS_AGENT_NETWORK_ENABLED`, `FINANCE_AGENT_NETWORK_ENABLED`, `SECURITY_AGENT_NETWORK_ENABLED`, `CUSTOMER_SUCCESS_AGENT_NETWORK_ENABLED`, `MULTILINGUAL_BUSINESS_MESSAGE_ENABLED`, `TRUST_REPUTATION_GRAPH_ENABLED`, `COMPANY_CONTROL_PANEL_C2C_ENABLED`, `C2C_NETWORK_GRAPH_ENABLED`, `EXTERNAL_AGENT_DISCOVERY_ENABLED`, **`AUTONOMOUS_COMMERCIAL_EXECUTION_ENABLED=FALSE`**.

## Prerequisite (queue ordering)

**2I-LA-35A** (Zero-Trust Security + Agent Defense Fabric V210) must PASS before LA-36 code. Ordering: **LA-35 → LA-35A → LA-36 Company-to-Company Agent Network V220 → LA-37 Global Business Knowledge Exchange → LA-38…47**.

**Tip note:** Fetch tip first (LA-27…LA-35A may still land). Park/include on `cursor/queue-2i-la-35a-*-4059` if tip contested; **rebase when LA-35 / LA-35A present**. Never force-push / never `main`. Master queue: **LA-35 → LA-35A → LA-36 → LA-37 → LA-38…47**.

**Full contracts (architecture §§1–120 + permanent rules):** [`docs/architecture/xiv-2i-la-36-company-to-company-agent-network-v220.md`](../architecture/xiv-2i-la-36-company-to-company-agent-network-v220.md).

**Ancestors ≠ this V220:** LA-31 Identity/Trust + LA-32 Contract/Deal + LA-33 Opportunity + LA-35 Fabric discovery + LA-35A Zero-Trust/AgentSecurityGateway = foundations. Company Brain ↔ Guardian ↔ Agent ↔ Business Protocol Gateway ↔ Trust/Identity/Contract/Security ↔ peer; BusinessAgentDirectory; agent types; agent≠company authority; BusinessMessage+DLP; RFQ/Quote (QUOTE≠CONTRACT); negotiation; binding needs human; LA-32 deal flow; sales/procurement/logistics/finance/security/CS networks; multilingual (translation≠contract interpretation); trust/reputation≠authority; no direct private tool calls; CrossCompanyWorkflow; meetings≠agreement; BusinessProtocolGateway; external agents≠trusted; LA-33/35 discovery; security tests; Company Control Panel; Founder aggregate≠private access; network graph; 24/7≠extra authority; AUTONOMOUS_COMMERCIAL_EXECUTION_ENABLED=FALSE belong here.

## Founder user story

As the XIV AI Founder, I want XIV to run Company-to-Company Agent Network V220 — Company Brain ↔ Guardian ↔ Agent ↔ Business Protocol Gateway ↔ Trust/Identity/Contract/Security ↔ peer; BusinessAgentDirectory; agent types; **agent≠company authority**; BusinessMessage protocol + DLP; RFQ/Quote (**QUOTE≠CONTRACT**); negotiation; binding needs human; LA-32 deal flow; sales/procurement/logistics/finance/security/CS networks; multilingual (**translation≠contract interpretation**); trust/reputation≠authority; no direct private tool calls; CrossCompanyWorkflow; meetings≠agreement; BusinessProtocolGateway; external agents≠trusted; LA-33/35 discovery; security tests; Company Control Panel; Founder aggregate≠private access; network graph; 24/7 ≠ extra authority; feature flags with **`AUTONOMOUS_COMMERCIAL_EXECUTION_ENABLED=FALSE`**; release priority; next **LA-37…47**; permanent rules; evidence **NEVER INFER PASS**.

## Critical architecture rules (permanent)

1. Agent ≠ company authority; directory ≠ trust; external agents ≠ trusted.
2. BusinessMessage delivery ≠ agreement; RFQ ≠ commitment; QUOTE ≠ CONTRACT.
3. Negotiation ≠ binding; binding needs human; meetings ≠ agreement.
4. Translation ≠ contract interpretation; trust/reputation ≠ authority.
5. No direct private tool calls; gateway mandatory; compose LA-35A.
6. Founder aggregate ≠ private access; 24/7 ≠ extra authority.
7. AUTONOMOUS_COMMERCIAL_EXECUTION_ENABLED=FALSE; Guardian above agents.
8. Queued ≠ implemented; UNKNOWN valid; never infer PASS; L4 disabled.

## Release posture (30-day guard)

**Entire C2C network does not block first canary.**  
**Prioritize:** honesty dictionary, human binding gates, deny direct private tools, DLP, external≠trusted, LA-35A SecurityContext on peer path, flag defaults FALSE.  
**Feature-gated until verified:** broad multilingual LIVE, universal mesh scale, auto-negotiation close, autonomous commercial execution (remains FALSE).

## Core surfaces (document only)

- Company Brain ↔ Guardian ↔ Agent ↔ Business Protocol Gateway ↔ peer
- BusinessAgentDirectory; agent types; agent≠company authority
- BusinessMessage + DLP; RFQ/Quote (QUOTE≠CONTRACT); negotiation; human binding
- LA-32 deal flow handoff
- Sales/procurement/logistics/finance/security/CS networks
- Multilingual (translation≠contract interpretation)
- Trust/reputation≠authority; no direct private tool calls
- CrossCompanyWorkflow; meetings≠agreement; BusinessProtocolGateway
- External agents≠trusted; LA-33/35 discovery; security tests
- Company Control Panel; Founder aggregate≠private access; network graph
- 24/7 ≠ extra authority; AUTONOMOUS_COMMERCIAL_EXECUTION_ENABLED=FALSE
- Evidence QUEUED/FALSE/UNKNOWN; Next LA-37…47

## Next queue

- **2I-LA-37** Global Business Knowledge Exchange
- **2I-LA-38** Business Simulation Supercomputer (refine when authored)
- **2I-LA-39** Global Economic + Trade Intelligence (refine when authored)
- **2I-LA-40** Self-Improving Business OS Evaluation System (refine when authored)
- **2I-LA-41…47** prepared expansion titles (refine when authored)

## Docs-only gate

LOCAL = GITHUB = GITLAB; TREE = CLEAN; runtime **NOT** started. Evidence **QUEUED / FALSE / UNKNOWN**. Never infer PASS. **HARD STOP — no LA-36 runtime.**
