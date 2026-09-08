# 62L-E — Knowledge Graph, Agent Population & Founder Reporting

Status: IMPLEMENTED AS BUILD CANDIDATE — NOT VERIFIED — NOT PRODUCTION AUTHORIZATION

This phase adds a durable local knowledge graph, a bounded agent population governor, a founder report generator, and local safety tests.

## Knowledge graph
- Local file: `.xiv-local/knowledge-graph.json`
- Node types: concept, claim, event, entity, skill, decision, outcome.
- Edge types: SUPPORTS, CONTRADICTS, RELATES_TO, CAUSED_BY, DERIVED_FROM, AFFECTS, PRECEDES.
- All nodes carry domain, claim state, source references, classification, and optional confidence.
- Graph size is capped for the local JSON MVP. Larger scale should migrate to partitioned graph/index/object storage after benchmarks.

## Agent population
- Maximum active local instances: 32.
- Maximum active instances per role: 4.
- Instances expire by TTL.
- Instances cannot create agents, expand permissions, or receive production authority.
- Logical role count is separate from concurrently running process count.

## Founder report
`npm run local:founder-report` summarizes Local Brain health, graph size, contradictions, learning, agent population, blockers, and decisions needed.

## Tests
`npm run test:62le` checks the 18-role mesh count, graph contradiction tracking, and the hard agent-instance authority locks.

Passing the test is not proof of offline operation on the Windows node. Offline PASS still requires a real local-model run with the network disconnected and restart/checkpoint evidence.
