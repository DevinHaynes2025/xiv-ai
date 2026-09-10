# XIV Universe Simulation Kernel — Architecture Reader

> **READ ONLY** — Command Center / mobile topology view. Never auto-applies production.

## Identity

| Field | Value |
|-------|-------|
| Universe | `demo-ux` |
| Layer | `SIMULATION` |
| Tenant | `xiv` |
| Fingerprint | `dg1:a934702223c0aabd` |
| Manifest | WAITING_SYNC |

## Topology

| Metric | Count |
|--------|------:|
| City tiers | 5 |
| Companies | 2 |
| Supply links | 1 |
| Agent population | 25 |
| World entities | 1 |
| Scenario branches | 1 |

- **City ladder:** device → local_shard → company_brain → regional_brain → global_brain
- **Stances:** HYPOTHESIS, OBSERVED, SIMULATION
- **Business-bar metrics:** reliability
- **Route target:** n/a
- **Route nodes:** n/a

## Memory heat

| Tier | Entities |
|------|---------:|
| hot | 1 |
| warm | 0 |
| cold | 0 |
| archive | 0 |

## Ethics

Universes are SIMULATION layers only. Red-line capabilities remain disabled. GCP/Azure used for sandbox routing only.

- productionAutoApply: **false**
- L4_PRODUCTION_ENABLED: **false**
- cloudProvidersAreSandboxRoutingOnly: **true**

## Guardrails

```json
{
  "UNIVERSES_ARE_SIMULATION_LAYERS_ONLY": true,
  "PHYSICAL_PORTALS_BANNED": true,
  "PHYSICAL_PORTAL_CAPABILITY": false,
  "QUANTUM_ADVANTAGE_CLAIM": false,
  "VALUATION_THEATER_ALLOWED": false,
  "PRODUCTION_DIMENSIONAL_FABRIC_ENABLED": false,
  "L4_PRODUCTION_ENABLED": false,
  "autonomousProductionDDL": false,
  "autonomousProductionDML": false,
  "autonomousDestructiveMigration": false,
  "autonomousSecretCreation": false,
  "autonomousDeployment": false,
  "autonomousProductionReplication": false,
  "autonomousCrossTenantReplication": false,
  "autonomousCloudCreation": false,
  "destructiveSchemaEvolution": false,
  "cloudProvidersAreSandboxRoutingOnly": true,
  "liveProductionDdlAllowed": false,
  "literalGalaxiesClaim": false
}
```
