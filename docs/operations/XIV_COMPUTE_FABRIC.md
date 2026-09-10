# XIV Compute Fabric — Classical First, QPU Candidate Later

Aligned with the master plan: **build the foundation before owning exotic infrastructure.**

## Today (EY2/EY3)
- Classical CPU + AMD iGPU (Radeon 780M) via Ollama
- Cloud models (Gemini / OpenAI) behind `model-backend.ts`
- Hardware probe: `GET /v1/hardware`
- Offline: `WAITING_PROVIDER` / `WAITING_DATA` — never fabricate

## “Quantum physics techniques” (honest mapping)
We use **quantum-inspired engineering metaphors** only where they improve classical systems:
- **Superposition → parallel candidate plans** — agents propose multiple options; humans collapse to one approval
- **Entanglement → Universe isolation** — correlated access controls; no cross-tenant leakage
- **Interference → evidence scoring** — reinforce proven signals, cancel unproven claims
- **Measurement → audit / gate state** — observing a claim requires an evidence artifact

## QPU (authorized candidate — not live)
- No quantum hardware is connected.
- Future: optional `compute_router` target `qpu_candidate` only after policy, budget, and evidence gates.
- Product claims must say `NOT_CONFIGURED` until a real backend exists.

## Chip / device compatibility (roadmap language)
XIV OS targets **interfaces** (APIs, SDKs, connectors), not “every chip known to man” as a literal claim.
Phones/laptops/tablets talk to XIV through the mobile app + API; silicon vendors via future compute adapters.
