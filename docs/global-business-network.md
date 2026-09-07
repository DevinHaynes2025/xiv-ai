# Global Business Network

Configuration-first country and region architecture.

**Status:** IMPLEMENTED (catalog) · NOT CONFIGURED (statistics / live feeds)

## Regions

Africa · Asia · Europe · North America · South America · Middle East · Oceania

Country logic stays in `services/ai/runtime/global/`. Application screens are data-driven. There is no one-screen-per-country UI.

ISO country codes are used. Country statistics, company lists, and trade volumes are not fabricated.

Phase 2H-B can perform a real World Bank Open Data GET when the adapter is invoked. Missing country values stay unavailable and are never fabricated. Africa is a discovery region, not one economic profile. The same adapter is driven by global country ISO config. China public indicators do not mean XIV is deployed in China (`deployed = false`, `requires_legal_review`, `requires_local_partner`). See [real-business-data-provider.md](./real-business-data-provider.md).

Discovery path: Global Business → Region → Country → Industry → Company → Events → Cases → Opportunities.
