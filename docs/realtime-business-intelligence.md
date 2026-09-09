# Real-Time Business Intelligence

Provider-adapter architecture for authorized business signals.

**Status:** IMPLEMENTED (types + World Bank adapter) · CONNECTED ONLY WHEN A REAL FETCH SUCCEEDS · FORBIDDEN (arbitrary scraping)

Cadence labels: `live` · `near_real_time` · `periodic` · `historical` · `stale` · `unavailable`. World Bank is historical/periodic, not live. A successful fetch still sets `live = false`.

Future provider interfaces exist as names only: market data, news, business registries, trade data, shipping, ports, weather, commodities, filings. None of those are connected in this phase.

## Sources (future)

Company-authorized APIs, market providers, business news, government and economic data, shipping/logistics, suppliers, weather, commodities, trade statistics, filings, registries, ERP, CRM, WMS, TMS.

Runtime does not scrape arbitrary sources.

## Event requirements

Every item needs source, sourceId, retrievedAt, eventTime, freshness, jurisdiction, classification, confidence, and license/use status.

Stale events are labeled `stale`. Web data is not assumed republishable commercially.

## Graph

In-memory `BusinessEntity` / relationship types exist. Massive graph data is not persisted.
