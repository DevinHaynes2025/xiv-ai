# XIV CRM Alternatives (Salesforce deferred)

Decision: continue building **without Salesforce** until credentials + MCP URL exist and CEO explicitly reconnects that lane.

## Preferred stack (in order)
1. **Native XIV CRM** — Universe-scoped tables in Supabase with RLS (customers, pipeline, interactions).
2. **Supabase** — operational store + pgvector for retrieval; not a Salesforce clone.
3. **Google Drive / Sheets** — founder docs, lightweight pipeline sheets, brain sync (connector live).
4. **HubSpot** — optional later CRM SaaS if native tables are insufficient.
5. **Airtable-style** — flexible ops tables for early GTM; treat as connector stub until approved.
6. **Notion DB** — roadmap/content only; not system of record for money.

## Explicitly out of scope for now
- Salesforce MCP install (needs `CLIENT_ID` + `SALESFORCE_MCP_URL`)
- Live ERP writes
- Fabricating CRM pipeline metrics

## Agent guidance
When a story says "CRM", implement against Supabase/XIV CRM schemas or Sheets stubs with `WAITING_PROVIDER` for HubSpot/Airtable until connected.
