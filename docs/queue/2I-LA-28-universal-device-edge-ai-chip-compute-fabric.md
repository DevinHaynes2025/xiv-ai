# 2I-LA-28 — XIV Universal Device + Edge + AI Chip Compute Fabric V70

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / runtime **not started**
Branch: xiv-v2
HARD STOP: **DO NOT IMPLEMENT** until **2I-LA-27 PASS**. Queue **AFTER LA-27**; do not interrupt active validated / deployment-critical work. Do not destabilize 30-day deployment runway. L4 disabled.

**Feature flags (default OFF):** `COMPUTE_FABRIC_ENABLED`, `LOCAL_AI_ENABLED`, `EDGE_RUNTIME_ENABLED`, `OFFLINE_OS_ENABLED`, `HARDWARE_ROUTER_ENABLED`, `NPU_RUNTIME_ENABLED`, `CONTRIBUTED_COMPUTE_ENABLED`, `QUANTUM_COMPUTE_ENABLED`.

**`CLOUD_WORKER_VERIFIED` stays FALSE** until authenticated deployment + logs + health + restart/recovery evidence.

## Prerequisite (queue ordering)

**2I-LA-27** (Global Agent + Tool + Plugin + Workflow Marketplace V60) must PASS before LA-28 code. Ordering: **LA-26 Agent University → LA-27 Global Agent + Tool + Plugin + Workflow Marketplace V60 → LA-28 Universal Device + Edge + AI Chip Compute Fabric V70 → LA-29 24/7 AI Organization → LA-30 Founder Mission Control**.

**Tip note:** Fetch tip first (LA-22B–27 may still land). Rebase onto latest tip **including LA-27** when present. Never force-push / never `main`.

**Full contracts (architecture §§1–150 + permanent rules):** [`docs/architecture/xiv-2i-la-28-universal-device-edge-ai-chip-compute-fabric-v70.md`](../architecture/xiv-2i-la-28-universal-device-edge-ai-chip-compute-fabric-v70.md).

**LA-11 ≠ LA-28:** LA-11 = Multi-Model + Universal AI Chip Intelligence Router foundations. Device/edge/offline/contribution/fabric depth + coverage honesty + deployment guard belong here.

## Founder user story

As the XIV AI Founder, I want XIV to run Universal Device + Edge + AI Chip Compute Fabric V70 — Business OS across mobile/desktop/web/edge/warehouse/manufacturing/vehicle/robotics/IoT/cloud **without replacing** host device OSes; device registry + capability discovery with DETECTED≠SUPPORTED; vendor-neutral CPU/GPU/NPU adapters with Hardware≠authority; secured LocalModelRuntime with Model≠Agent; ComputeRouter for local-first privacy / cloud-first performance without auto-authorizing cloud; mobile as real Business OS with device trust and compromised-phone≠company; offline envelopes that expire and cannot override newer server policy; contributed compute consent-gated/isolated; honest AWS/multi-cloud states; Compatibility Lab measured coverage (no “every phone”); no blind retry + mobility revalidates authority; compose LA-26 compute certs + LA-27 marketplace manifests; Hospital/Twin/Supply/Security bounded integrations; attestation/integrity/rollback/observability/Command Center/map; quantum gated; device/sensor/voice/location privacy and device-data≠training — prioritizing mobile/web/cloud-worker foundation, device identity, compute router, offline policy, security, observability for the 30-day runway (universal hardware not first-canary blocker; all fabric flags OFF; `CLOUD_WORKER_VERIFIED=FALSE`) — and feed LA-29 24/7 AI Organization.

## Critical architecture rules (permanent)

1. XIV Business OS ≠ replacing iOS/Android/Windows/macOS/Linux.
2. DETECTED ≠ SUPPORTED; chip/device detected ≠ supported; model installed ≠ approved; unknown accelerator → EVALUATION_REQUIRED.
3. Model ≠ Agent; Hardware ≠ authority; Local ≠ automatically safe; Cloud ≠ automatically authorized; Edge ≠ trusted; Connected ≠ trusted; Offline ≠ authorized.
4. Device identity ≠ company access; compromised phone ≠ compromised company.
5. Faster/cheaper ≠ better; benchmark ≠ business outcome; quantum backend ≠ advantage.
6. User device ≠ XIV compute farm without explicit consent; contributed device ≠ authorized private compute.
7. Never fabricate AWS/multi-cloud LIVE; potential adapter ≠ supported; no “works on every phone”; track measured coverage.
8. Offline permission must not override newer server policy on reconnect; authority does not move automatically with agent mobility; Founder asleep ≠ authority; more compute ≠ more authority; L4 off.

## Release posture (30-day guard)

**Do not block first canary on universal hardware.**  
**Prioritize:** mobile, web, cloud-worker foundation, device identity, compute router, offline policy, security, observability.  
**Feature-gated OFF / non-blocking:** full NPU matrix, contributed compute, quantum, every-edge SKU, universal coverage claims (all listed flags default OFF). `CLOUD_WORKER_VERIFIED=FALSE` until evidence.

## Core surfaces (document only)

- Founder mission; XIV≠device OS; ComputeFabric kernel + node types
- Device registry + capability discovery + DETECTED≠SUPPORTED
- Hardware capability graph + vendor-neutral adapters
- CPU/GPU/NPU/AI accelerator abstractions; Hardware≠authority
- LocalModelRuntime + security; Model≠agent
- Model-to-hardware router + execution options
- Local-first privacy / cloud-first performance + ComputeRouter + routing policy
- Mobile Business OS (not thin remote) + device trust + compromised phone
- Desktop/Web/Edge OS + use cases
- Warehouse/manufacturing/vehicle/robotics/IoT gateways (connected≠authorized autonomous)
- Offline OS + authority/data/expiration; Secure sync + conflicts
- Event nervous system; GlobalComputeScheduler + priorities≠authority
- Follow-the-sun + local PC offline + cloud worker truth
- Compute economics + cost-aware routing + cheapest≠best
- Latency/Performance brains; Energy/thermal/battery-aware
- User device consent + contributed compute (feature-gated) + security
- Isolation + residency + device-to-company boundary + sessions + lost device
- Passkey/MFA + secure hardware + secrets
- Cloud broker + provider registry/states + AWS honesty + multi-cloud architecture≠deployment
- Local/Company private/XIV cloud/hybrid modes + data minimization
- Model router (LA-11) + multi-model + local eval + quantization
- Hardware Compatibility Lab + device matrix + coverage + fallback + graceful degradation
- Failure/Recovery brains + no blind retry + checkpointed agents + agent mobility + authority revalidation
- Agent University (LA-26) compute certs; Marketplace (LA-27) requirements
- Business Hospital / Company Twin / Supply Chain edge / Security OS integrations
- Attestation + model integrity + edge update/rollback
- Observability + Command Center + map
- Capacity/Forecast/Procurement/Partnership brains
- NVIDIA/chip ecosystem + future chips plug-in path
- Quantum abstraction (LA-12) + routing + advantage gate
- Research lab (research≠deployment); Innovation + story factory
- 24/7 council + night shift; Learning loop + router learning (no uncontrolled rewrite)
- Device/sensor/voice/location privacy; Device data≠training
- DB tables; Security/offline/router/hardware/model/performance tests; No fake coverage
- Deployment guard + flags; Checkpoint protocol + suggested commits
- Completion evidence (never infer PASS); Next LA-29 24/7 AI Organization then LA-30 Founder Mission Control

## Next queue

- **2I-LA-29** 24/7 AI Organization
- Then **2I-LA-30** Founder Mission Control

## Docs-only gate

LOCAL = GITHUB = GITLAB; TREE = CLEAN; runtime **NOT** started. Never infer PASS. **HARD STOP — no LA-28 runtime.**
