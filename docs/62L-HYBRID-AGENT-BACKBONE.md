# 62L Hybrid Agent Backbone

Status: BUILD CANDIDATE — NOT VERIFIED — NOT PRODUCTION AUTHORIZATION

## Objective
XIV should operate offline-first on approved local models/data and optionally use authorized cloud capacity when online. Logical agents may communicate through bounded meetings/task forces. Human authority and Guardian policy remain above the agent mesh.

## Runtime topology

Windows/local storage -> Local Brain -> Agent Mesh -> Checkpoints/Learning Ledger
                                      |
                                      +-> GCP adapter (UNAVAILABLE until configured)
                                      +-> Azure adapter (UNAVAILABLE until configured)
                                      +-> AWS adapter (UNAVAILABLE until configured)

Cloud providers are capacity/failover domains, not sources of authority. Provider availability requires configuration, credentials, policy authorization, classification eligibility and verification.

## Agent fleet
Start with a small verified fleet, not millions of continuously running processes. Logical roles include architecture, coding, testing, security, evidence verification, skepticism, business analysis, finance, supply chain, operations, history/culture research and executive synthesis. Wake agents for bounded work; hibernate afterward.

Agent-to-agent communication uses meeting/task IDs, bounded rounds, evidence references and explicit roles. An agent may challenge another agent but may not grant permissions, create unlimited descendants, authorize deployment, sign contracts, spend money or weaken Guardian/RLS.

## Neuron model
A 'neuron' is a logical graph unit: concept, claim, relationship, event, evidence reference, task state, skill, decision or outcome. XIV must not create trillions of physical database rows merely to satisfy a metaphor. Large-scale intelligence should use compressed indexes, graphs, embeddings/caches where appropriate, object storage and tiered retention. Capacity is measured before expansion.

## Civilization knowledge
Supported domain registry includes business, economics/wealth, finance/markets, hedge funds, supply chain/information logistics, technology, history, culture, humanities, spirituality/belief systems, mental health knowledge, public health, local government, politics/public institutions, law/policy, science and education.

Domain registration does NOT mean XIV already possesses trillions of historical records. Data ingestion requires source provenance, licensing/permission, classification, freshness, retention and evidence state. Beliefs/traditions are not silently converted into verified facts. Political claims preserve source and dispute state. Mental-health knowledge is not a substitute for professional care or emergency services.

## Offline/online behavior
Offline: local approved models, local repository, local cache/object store, checkpoints, local knowledge packages and synthetic datasets may continue. Internet-dependent work becomes WAITING_DATA or UNAVAILABLE.

Online: policy may route eligible work to GCP/Azure/AWS or approved external data sources. Private tenant data stays local unless an explicit policy permits the specific provider and classification.

## Storage strategy
1. Hot: local task/checkpoint/agent state.
2. Warm: local object store/database and approved cloud object storage.
3. Knowledge: provenance-first packages, indexes and derived representations.
4. Archive: retention-controlled historical evidence.
5. Never use a single global private-customer super-database.

## Gradual deployment gates
1. Compile/typecheck.
2. Local model responds.
3. Bounded multi-agent meeting works.
4. Checkpoint restart works.
5. Test/Security/Verifier agents challenge output.
6. Learning ledger records evidence without permission changes.
7. Offline disconnect test passes.
8. One cloud sandbox adapter is configured read-only.
9. Hybrid failover is tested with synthetic/non-sensitive data.
10. Only then consider additional cloud/runtime scale.

Production deployment, database migration, provider spending, account creation, external contracts and L4 autonomy remain separately gated.
