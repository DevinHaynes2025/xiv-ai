# Global Security Architecture

Architectural security domains. These are not marketed as certified layers.

**Status:** IMPLEMENTED (domain map + interfaces) · PLANNED (step-up, many controls)

## Domains

Identity, session, device, tenant, data, agent, tool, model, API, media, live, infrastructure, supply chain, audit, recovery, global deployment.

## Continuous authorization

Authenticate → authorize → observe → re-evaluate → step-up / deny / expire when risk changes.

Step-up authentication remains PLANNED.

Phase 2H-A adds authorization freshness and architectural hardening checks (session fixation, selector tampering, stale membership, provenance tampering). No fake detections. See [authorization-freshness.md](./authorization-freshness.md).

## Feedback

SecurityEvent → classify → correlate → score risk → policy response → containment → investigation → recovery → lesson.

Security AI cannot rewrite its own policies. Forecasts are marked observed / suspected / projected. No fake detections.

## Prompt injection

External content is untrusted. Instructions stay separate from data, retrieved documents, user content, agent messages, and tool output. Retrieved business content is not system authority.

## Agent-to-agent

Every handoff still passes Agent Firewall, Policy Engine, tenant, scope, classification, authority, budget, loop guard, and provenance checks.
