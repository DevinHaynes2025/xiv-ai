# Real business data provider

**Status:** NOT CONFIGURED (no live World Bank session in this phase)

First sourced adapter class: World Bank Open Data (government / economic API). No HTML scraping.

Observations require country, indicator, and period. `value = null` produces **no event**.

Cadence is `historical` / `periodic`, not `live` or `near_real_time`.

License: CC BY 4.0, attribution required. Redistribution allowed only with attribution. XIV does not invent GDP or other statistics.

Africa remains country-specific. China public indicators do not mean XIV is deployed in China (`requires_legal_review` / `requires_local_partner`).
