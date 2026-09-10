# XIV Agent Society Energy

Honest continuous learning without continuous GPU burn.

## Principle

**Agents learn continuously but preserve energy.** Architecture existing does **not** mean 24/7 live inference. Durable memory + scheduled duty cycles beat always-on silicon.

| Claim | Truth |
| --- | --- |
| Architecture exists ⇒ 24/7 live | **False** (`architectureExistsMeans247Live = false`) |
| Always-on multi-agent debate | **False** — duty cycles + sleep/idle |
| Overnight = full autonomy | **False** — checkpoint / debrief only unless incident |
| Debrief ⇒ global brain rewrite | **False** — lessons enter `WAITING_REVIEW` |
| Meeting ⇒ authority / L4 | **False** — consequential actions `requireApproval` |
| Quantum agentic = QPU-first | **False** — classical-first; QPU is a candidate path |

## Runtime module

`services/ai/runtime/agentsociety/`

- `energy.ts` — `EnergyBudget`, `DutyCycle`, sleep/idle; prefer batch/debrief over constant inference
- `meetings.ts` — bounded agenda, turn limits, energy cost; stops on budget exhaustion; approval for consequential turns
- `learning-loop.ts` — debrief lesson candidates → `WAITING_REVIEW`; never auto-rewrite `AGENTS.md` / global truth
- `schedule.ts` — weekday daytime default active window; overnight = checkpoint/debrief unless incident
- `index.ts` — exports + `agentSocietyStatus()`

Related (existing):

- `agentmeetings/` — richer meeting network (L4 disabled, overnight ≠ uncontrolled)
- `cloudworkforce/debrief.ts` — `promotesToGlobalBrain` stays **false**
- `cloudworkforce/nightshift.ts` — overnight allowlist; forbids `FABRICATE_LIVE_247_CLAIM` / `GLOBAL_BRAIN_AUTO_PROMOTION`

## 24/7 learning (honest definition)

1. **Durable memory** — lessons, checkpoints, briefs persist when agents sleep.
2. **Scheduled duty cycles** — weekday/daytime active windows; overnight checkpoint/debrief.
3. **Human review gates** — nothing promotes to global brain or rewrites `AGENTS.md` without approval.
4. **Energy budgets** — exhaustion stops meetings; budgets are not self-expandable.
5. **Batch over continuous** — prefer debrief batches to constant inference.

This is continuous *learning posture*, not continuous *compute*.

## Quantum agentic note

Quantum agentic work is **classical-first**. QPU paths are candidates only — not a claim of live quantum orchestration, and never a reason to keep GPUs burning overnight.

## Invariants (tested)

- `L4_AUTONOMY_ENABLED === false`
- `architectureExistsMeans247Live() === false`
- `AGENT_SOCIETY_ALWAYS_ON === false`
- Debrief lessons land in `WAITING_REVIEW`; auto-promote denied
- Energy budget exhaustion → meeting `STOPPED_ENERGY`

Run:

```bash
npx tsx services/ai/runtime/agentsociety/agentsociety.test.ts
```
