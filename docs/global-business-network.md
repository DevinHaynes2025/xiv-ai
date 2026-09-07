# Global Business Network

Configuration-first country and region architecture.

**Status:** IMPLEMENTED (catalog) · NOT CONFIGURED (statistics / live feeds)

## Regions

Africa · Asia · Europe · North America · South America · Middle East · Oceania

Country logic stays in `services/ai/runtime/global/`. Application screens are data-driven. There is no one-screen-per-country UI.

ISO country codes are used. Country statistics, company lists, and trade volumes are not fabricated.

Phase 2H-A maps World Bank observations per country when a sourced record exists. Africa stays country-specific. China deployment remains `requires_legal_review` / `requires_local_partner`. See [real-business-data-provider.md](./real-business-data-provider.md).

Discovery path: Global Business → Region → Country → Industry → Company → Events → Cases → Opportunities.
