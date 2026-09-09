# Operations Center

Developer / prototype operations model.

**Status:** PROTOTYPE · NOT CONFIGURED (production 24/7 monitoring)

## Sections

Platform Health · AI Workforce · Security · Data Sources · Integrations · Live · Tenant Health · Regional Health · Queues · Incidents

Not exposed to normal consumers.

## Self-healing

Safe automated remediation is limited to reversible low-risk operations (retry idempotent work, open a breaker, pause an agent). Never automatically change RLS, delete data, deploy code, rotate secrets, change roles, transfer money, or send legal commitments.

## Incidents

`detected` → `triaged` → `contained` → `investigating` → `recovering` → `resolved` → `postmortem`.
