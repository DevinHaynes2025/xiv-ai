# XIV Adaptive Story Council — Ranked Queue (READ ONLY)

> **READ ONLY** — never auto-applies production. Scores: customerValue, technicalRisk, cost, security, dependencies, evidenceQuality.

## Provider seats

| Agent | Status | Scope | Vote weight |
|-------|--------|-------|------------:|
| LOCAL_RULES | READY | local | 1 |
| OLLAMA | OPTIONAL_OFFLINE | local | 0 |
| GROK | WAITING_PROVIDER | cloud | 0 |
| CHATGPT | WAITING_PROVIDER | cloud | 0 |
| GEMINI | WAITING_PROVIDER | cloud | 0 |

## Ranked stories

| Rank | Story | Domain | Composite | worth | customerValue | technicalRisk | cost | security | deps | evidenceQuality | WAITING_PROVIDER |
|-----:|-------|--------|----------:|------|-------------:|-------------:|-----:|---------:|-----:|----------------:|------------------|
| 1 | `XIV-US-00000014` SECURITY capability increment 14 | SECURITY | 0.723 | yes | 0.760 | 0.590 | 0.450 | 0.950 | 0.420 | 0.920 | GROK, CHATGPT, GEMINI |
| 2 | `XIV-US-00000011` DATABASE capability increment 11 | DATABASE | 0.658 | yes | 0.710 | 0.540 | 0.500 | 0.700 | 0.470 | 0.870 | GROK, CHATGPT, GEMINI |
| 3 | `XIV-US-00000012` AI_RUNTIME capability increment 12 | AI_RUNTIME | 0.651 | yes | 0.810 | 0.640 | 0.450 | 0.650 | 0.420 | 0.820 | GROK, CHATGPT, GEMINI |
| 4 | `XIV-US-00000010` PLATFORM capability increment 10 | PLATFORM | 0.648 | yes | 0.710 | 0.540 | 0.400 | 0.650 | 0.470 | 0.820 | GROK, CHATGPT, GEMINI |
| 5 | `XIV-US-00000013` MOBILE capability increment 13 | MOBILE | 0.646 | yes | 0.860 | 0.490 | 0.500 | 0.600 | 0.370 | 0.770 | GROK, CHATGPT, GEMINI |
| 6 | `XIV-US-00000015` CLOUD capability increment 15 | CLOUD | 0.638 | yes | 0.660 | 0.590 | 0.500 | 0.700 | 0.520 | 0.820 | GROK, CHATGPT, GEMINI |
| 7 | `XIV-US-00000016` SIMULATION capability increment 16 | SIMULATION | 0.606 | yes | 0.610 | 0.440 | 0.350 | 0.500 | 0.320 | 0.920 | GROK, CHATGPT, GEMINI |
| 8 | `XIV-US-00000009` XR capability increment 9 | XR | 0.498 | yes | 0.560 | 0.690 | 0.600 | 0.450 | 0.420 | 0.670 | GROK, CHATGPT, GEMINI |

## Ordered (worth executing)

1. `XIV-US-00000014`
2. `XIV-US-00000011`
3. `XIV-US-00000012`
4. `XIV-US-00000010`
5. `XIV-US-00000013`
6. `XIV-US-00000015`
7. `XIV-US-00000016`
8. `XIV-US-00000009`

## Skipped (not worth)

(none)

## Ethics

Adaptive Council UX is READ ONLY. Ranked scores inform triage only — never auto-merge, auto-deploy, or apply production. Unbound cloud agents remain WAITING_PROVIDER.

- productionAutoApply / productionAutoMerge / productionAutoDeploy: **false**
- cloudAgentsDefaultWaitingIfUnbound: **true**

## Guardrails

```json
{
  "council": {
    "productionAutoMerge": false,
    "productionAutoDeploy": false,
    "destructiveDbAutoApply": false,
    "secretExfiltrationAllowed": false,
    "crossTenantDataCopyAllowed": false,
    "agentDebriefRequired": true,
    "evidenceBeforeDone": true,
    "cloudAgentsDefaultWaitingIfUnbound": true
  },
  "ux": {
    "readOnly": true,
    "productionAutoApply": false,
    "productionAutoMerge": false,
    "productionAutoDeploy": false,
    "destructiveDbAutoApply": false,
    "crossTenantDataCopyAllowed": false,
    "cloudAgentsDefaultWaitingIfUnbound": true
  }
}
```
