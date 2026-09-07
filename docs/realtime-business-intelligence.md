# Real-Time Business Intelligence

Provider-adapter architecture for authorized business signals.

**Status:** IMPLEMENTED (types + adapters) · NOT CONFIGURED (providers) · FORBIDDEN (arbitrary scraping)

## Sources (future)

Company-authorized APIs, market providers, business news, government and economic data, shipping/logistics, suppliers, weather, commodities, trade statistics, filings, registries, ERP, CRM, WMS, TMS.

Runtime does not scrape arbitrary sources.

## Event requirements

Every item needs source, sourceId, retrievedAt, eventTime, freshness, jurisdiction, classification, confidence, and license/use status.

Stale events are labeled `stale`. Web data is not assumed republishable commercially.

## Graph

In-memory `BusinessEntity` / relationship types exist. Massive graph data is not persisted.
