# XIV Agent Handoff Protocol

Use this when switching workers (local ↔ ChatGPT ↔ Grok ↔ Cursor cloud).

## Packet (always include)
1. Current branch
2. Current SHA (`git rev-parse HEAD`)
3. `docs/operations/XIV_AGENT_CONTEXT.md`
4. `docs/operations/XIV_CURRENT_STATE.md`
5. Current story ID from the queue
6. Relevant file paths
7. Latest `XIV_TEST_EVIDENCE.md` entries for this story

## Handoff template

```
BRANCH:
SHA:
STORY_ID:
ONLINE: yes|no
WORKER: local|chatgpt|grok|cursor-cloud|other

GOAL:
CONSTRAINTS:
FILES:
EVIDENCE:
NEXT:
```

## Rules
- Receiving agent reads `AGENTS.md` first.
- Do not assume prior chat memory.
- If offline: continue local implementation; mark cloud-dependent work `WAITING_PROVIDER`.
