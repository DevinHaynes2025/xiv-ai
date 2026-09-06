# XIV Business Health Intelligence

Reusable typed findings and narratives for the governed runtime. This is **prototype sample context**. It is not live enterprise data.

## Pipeline

```
Context Provider
    ↓
Domain signals
    ↓
Findings
    ↓
Story Engine
    ↓
Business Health Report
    ↓
Agent recommendation
    ↓
Human approval if consequential
```

## Invariants

- Hypotheses are not facts. Stance labels stay on every beat.
- Sample/prototype source labels stay on every finding.
- Agents read through registered governed tools. There is no context bypass.
- Human approval does not override policy.
- The governed runtime is not the live Gemini Executive turn path.

## Domains

`supply_chain` · `operations` · `inventory` · `warehouse` · `customer` · `finance` · `security` · `people` · `technology`

## Finding

A `BusinessHealthFinding` includes:

- `findingId`, `domain`, `severity`, `title`, `summary`
- `whatHappened`, `whyItMatters`, `likelyCauses`, `businessImpact`, `recommendedActions`
- `confidence`, `evidenceQuality`, `sourceLabels`, `causalChain`
- `detectedAt`, `prototype`

Prototype output always carries `prototype: true`, `evidenceQuality: 'sample'`, and `prototype_sample` in `sourceLabels`.

## Story Engine

`buildNarrative()` / `buildCausalChain()` turn findings into a structured business narrative:

1. Signal — observed
2. Change — inferred
3. Cause hypothesis — hypothesized
4. Business impact — inferred
5. Recommendation — recommended
6. Expected outcome — hypothesized
7. Evidence / confidence

Sample chain:

Supplier variability (observed) → safety stock increased (inferred) → warehouse congestion (inferred) → order cycle time increased (inferred) → fulfillment delays (inferred) → customer complaints (hypothesized) → review recovery window (recommended)

Stances:

- **observed** — labeled sample signal
- **inferred** — derived from the sample model
- **hypothesized** — not a fact
- **recommended** — human review only; not executed

`hypothesisIsMarked()` fails if a cause or expected outcome is presented as observed fact.

## Business Health Report

`buildBusinessHealthReport()` returns:

- `organization`
- `overallStatus` / `overallScore`
- `topRisks` / `topOpportunities`
- `findings`
- `narrativeSummary`
- `sourceSummary`
- `generatedAt`
- `prototype: true`

The prototype Context Provider (`getBusinessHealthReport()`) is the only current source. No ERP, WMS, TMS, or CRM is connected. People findings are aggregate only.

`toStructuredHealthResult()` maps a report into the existing structured-result card shape for **presentation**. It does not merge the governed runtime with Gemini.

## Agent integration

All access still goes Agent Registry → Policy Engine → Tool Gateway.

| Agent | Reads | Must not |
| --- | --- | --- |
| Supply Chain | supply-chain findings | reallocate suppliers |
| Operations | operations findings / diagnostic story | change production systems |
| Executive | cross-domain report | execute production actions |
| Guardian | system/validation health only | read business context or run host checks |

`business_health_report` is a read-only L0 tool. Guardian is not allowlisted for it.

Consequential tools still require human approval, then policy re-check, then still refuse production writes.
