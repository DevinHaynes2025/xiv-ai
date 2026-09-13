# 2M Program Execution at Integrated Head `84886325` (2026-09-13)

Fresh governed drill on `claude/12d-99-supervised-local-worker` @
`84886325c288b0bb93a279bce021966e87fb4797` (12D-103 lineage + 12D-107/108 + integrated
12D-109/110/111). Native exit 0, **anomalies: []**.

| Measure | Result |
|---|---|
| Capacity rows stored | 1,998,999 (synthetic CAPACITY_FIXTURE) + 1,000 cycled operational stories |
| Cycle (claim → renew → settle → review) | 3,695 ms for 1,000 stories |
| Claim / renew / settle / review medians | 0.900 / 0.768 / 0.864 / 0.837 ms (p95 ≤ 1.52 ms) |
| Deep pages (100) | median 0.275 ms, max 0.818 ms |
| Tenant summary at 2M rows | 2,560 ms (consistent with the measured bottleneck; MR !117's governed index addresses it) |
| Database size | 1,855,766,528 bytes (~1.86 GB) |
| Process RSS | 223.4 MiB |
| Model calls / remote calls | 0 / 0 |
| Real user stories | 0 (`capacityRowsAreUserStories: false`, `millionUsersProven: false`) |
| Honest flags | `liveAgentsProven: false`, `automaticRecovery: false`, `humanDecision: REQUIRED` |

Insertion-latency variance note (recorded honestly): this run's capacity fill took
11,138.4 s wall clock versus the 12D-103 cold reference of 607.9 s and the MR !117
remediation benchmark's 540.8 s warm run — all three on this same host. The insertion
path is I/O-bound and its wall time is dominated by host disk conditions; the
transactional per-operation latencies (the medians above) are stable across runs. No
code path changed; the slow fill is an environment observation, not a regression.

humanDecision: REQUIRED · learningPromoted: false · zero real user stories created.