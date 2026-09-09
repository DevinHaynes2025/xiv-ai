# PHASE 2I-AD — Plugin Marketplace + Developer Platform + Global Business API Gateway + Agent Tool Foundry

**Status:** PROPOSAL ONLY — awaiting CEO authorization  
**Base:** Phase 2I-AC Neural Brain / Continuous Evolution fabric (`xiv-v2`)  
**Authority:** capability ≠ privilege · `NOT_CONFIGURED` until proven · L4 remains **OFF** · no silent production deploy

## Purpose

Extend XIV from an application surface into a governed **operating ecosystem**: third parties and internal teams can ship plugins, connectors, and agent tools without inheriting production privilege. Extensibility is a product path, not an authority path.

## Scope (authorized only after CEO sign-off)

1. **Plugin Marketplace** — discover, install, version, rollback, region-pin plugins  
2. **Developer Platform** — portal, SDKs, signed manifests, verification pipeline  
3. **Global Business API Gateway** — tenant-scoped APIs, metering, billing contracts  
4. **Agent Tool Foundry** — typed tool SDK, permission scopes, sandbox execution  

Out of scope for this proposal: Phase 2I-AD implementation, LIVE provider credentials, L4 enablement, unattended production deploy.

## Architecture pillars

### 1. Plugin SDK

- Typed plugin lifecycle: `REGISTER → VERIFY → SANDBOX → TENANT_OPT_IN → CANARY → LIVE → ROLLBACK`
- Manifest schema (signed): identity, version, permissions, regions, data classifications, resource limits, rollback target
- Plugin installed ≠ unrestricted access
- Host APIs are capability grants, never ambient privilege

### 2. Signed manifests + permission scopes

- Every package carries a signed manifest (publisher key + XIV counter-signature after verification)
- Scopes are explicit and least-privilege: data read/write classes, tool calls, network egress, tenant boundaries, UI surfaces
- Scope expansion requires human/policy gate — agents cannot self-expand
- Unsigned or signature-mismatch packages stay `NOT_CONFIGURED` / blocked

### 3. Plugin sandbox

- Default execution in isolated sandbox (CPU/memory/time/network budgets)
- No raw secret or PII exfiltration paths in audit payloads (metadata-preferred)
- Cross-tenant calls denied by default
- Sandbox pass ≠ production authority

### 4. Connector SDK

- Builds on Phase 2I-AB Global Connector Fabric contracts
- Connectors declare purpose, classification, retention, and region
- Offline / connected ≠ authorized
- Adapter presence ≠ trust; providers remain `NOT_CONFIGURED` until proven

### 5. Agent Tool SDK + Tool Foundry

- Tools are typed contracts: inputs, outputs, side-effect class, required scopes
- Creative tool authorship ≠ production deploy rights
- Tool foundry pipeline: design → review → security scan → sandbox → RC → human/policy gate
- Continuous Builder / Agent DevOps gates from 2I-AC apply; L4 disabled

### 6. Developer portal

- Publisher onboarding, key management, draft submissions, verification status, usage dashboards
- Founder Twin may brief / discuss — never act as CEO or ultimate authority
- Portal actions that affect production require independent human/policy approval

### 7. Global Business API Gateway

- Tenant- and universe-scoped routing through existing governance stack
- Rate limits, quota classes, regional endpoints, audit event emission
- Gateway must not bypass Guardian / tenant isolation
- Public API availability ≠ elevated privilege

### 8. Usage metering + billing contracts

- Metered dimensions: calls, compute units, data egress class, agent-tool invocations
- Billing contracts are commercial artifacts — not authority grants
- Metering metadata only; no wholesale customer data copies for billing

### 9. Plugin verification + malware/security scanning

- Static + dynamic scans, dependency SBOM, permission lint, malware heuristics
- Failed scan ⇒ cannot leave `NOT_CONFIGURED`
- Independent Contradiction / Security society roles may critique; votes do not create authority

### 10. Versioning + rollback

- Semver + signed channel (`stable` / `canary` / `enterprise-private`)
- One-click rollback to last verified signature
- Night Shift may prepare sandbox builds and RCs; never silent consequential prod deploy overnight

### 11. Regional deployment

- Region pins in manifest; data residency honored
- Cross-region promotion requires explicit authorization
- No automatic Personal→Company / Company→Global / Private→Public promotion patterns for plugin data

### 12. Enterprise private plugins

- Private catalogs per tenant/enterprise
- Same sandbox, scan, and gate requirements as marketplace plugins
- Private ≠ unrestricted; enterprise install still least-privilege

## Security invariants (non-negotiable)

| Invariant | Rule |
|-----------|------|
| Capability ≠ privilege | Installing or authoring a plugin/tool does not grant production authority |
| NOT_CONFIGURED until proven | Providers, connectors, plugins stay `NOT_CONFIGURED` without evidence |
| L4 off | Bounded autonomy / L4 remains disabled through this phase |
| Human/policy gate | Consequential production paths require independent approval |
| No surveillance framing | Authorized lineage/observability ≠ surveillance tracking |
| No silent prod | Agents, Night Shift, Continuous Builder cannot silent-deploy |
| Twin disclosure | Founder Twin is AI representation only — never actual CEO |

## Extensibility path (app → operating ecosystem)

```
XIV App Surfaces
  → Governed APIs (Gateway)
    → Plugin / Connector / Agent Tool SDKs
      → Signed Marketplace + Private Catalogs
        → Sandbox → Verify → Tenant opt-in → Canary → Live (gated)
```

Each hop adds **capability under contract**, never ambient privilege.

## Delivery posture after authorization

- Contracts + deterministic tests first (prefer over UI)
- Dual-sync `xiv-v2` only; no force push; no main promotion by default
- STOP before new production credentials
- Extreme scale remains `ENGINEERING_CAPACITY_TARGET` (unproven)

## Explicit STOP

**Do not implement Phase 2I-AD until CEO authorization.** This document is an architecture proposal only.
