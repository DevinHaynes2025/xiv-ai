# Agent Debugging

`AgentDebugger` inspects, classifies, recommends, isolates a malfunctioning agent, and requests human review.

**Status:** IMPLEMENTED (bounded debugger) · FORBIDDEN (deploy / unrestricted shell)

## May

- inspect
- classify
- recommend
- isolate
- request human review

## May not

- rewrite arbitrary production code
- deploy
- modify RLS
- rotate credentials
- disable security controls
- execute unrestricted shell

24/7 AI debugging means continuous health monitoring, evaluation, alerting, and bounded remediation workflows. It does **not** mean unrestricted permission to modify production code.
