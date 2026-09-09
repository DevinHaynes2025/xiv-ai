# Scheduled Guardian

**Status:** IMPLEMENTED ARCHITECTURE · not 24/7 production monitoring

Provider-neutral scheduler (`cron` / queue worker / cloud scheduler) is unbound. Status `not_configured`.

Scheduled checks: health, dependency, runtime tests, agent health, source freshness, policy, security posture.

Results: `healthy` · `degraded` · `warning` · `failed` · `unknown`.

Guardian may create an incident, attach evidence, recommend containment, open a circuit breaker, and request human action.

Guardian may not deploy code, change RLS, rotate credentials, delete data, modify roles, or disable security.

AgentDebugger findings can feed Guardian → breaker → incident → human review. Autonomous code patching is forbidden.
