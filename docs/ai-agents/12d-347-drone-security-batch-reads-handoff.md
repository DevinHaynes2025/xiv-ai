# 12D-347 — directive-#7 verified reads, drone-security batch (RemoteIDReceiver, Drone-Detection-YOLOv8x, Asv.Drones)

**Story rung:** 12D-347 (operational rung over committed doors — the
12D-341/342/343/345/346 read pattern; no code changed) ·
**Parents:** CEO directive #7 / 12D-276 / 12D-283 / 12D-322 ·
**Policy footprint:** none added

## What this rung is

Three directive-#7 DRONE-SECURITY repos — all DEFENSIVE (airspace
awareness, detection, ground control), all licenses verified BEFORE
read, all three read:

- **cyber-defence-campus/RemoteIDReceiver** — READ (MIT verified).
  Web platform capturing/decoding/storing/visualizing drone Remote ID
  broadcasts (ASD-STAN prEN 4709-002, all message types); modular
  Python backend with REST + WebSocket; VueJS + MapLibre frontend
  (offline-capable via self-hosted TileServer); monitor + replay
  modes; README itself discloses proof-of-concept status.
- **doguilmak/Drone-Detection-YOLOv8x** — READ (MIT verified).
  Real-time drone detection (defensive, security/privacy); Kaggle
  dataset, YOLOv8x, Colab training, weights on Hugging Face with
  named provenance; SECURITY.md shipped; precision/recall/F1 named
  but no numbers on the page — recorded as claimed-not-measured.
- **asv-soft/asv-drones** — READ (MIT verified, license text quoted,
  AS IS disclaimer). Open-source ground control station for
  ArduPilot/PX4: C#/.NET 10.0/Avalonia, plugin system with
  `Asv.Drones.Plugin.` prefix, Asv.Mavlink/Asv.Gnss/Asv.Common/
  Asv.Avalonia libraries, Core/Shell split, private security
  reporting (me@asv.me).

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-347/`, never committed)

- 3 registered (OPEN_SOURCE_REPO, https, per-source licenseNote),
  **6 chunks read** (each README split in 2, the REAL 12D-287
  continuation gate exercised on all three chunk-2s) = **6 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 6 drafts AWAITING_REVIEW (draftChars
  661/770/1306/631/1769/816 measured), stopped before review.
- Slate: 6 of 6, 0 redactions, digest `414ead4122b6…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **RemoteIDReceiver**: receiving what drones are legally required
  to broadcast is DEFENSIVE airspace awareness (no interception of
  private signals, no jamming); a published standard (prEN 4709-002)
  as the exact implementation boundary; monitor + replay over one
  stored message set = queue-as-truth for airspace events.
- **Drone-Detection**: capability claimed, numbers not shown on the
  page — recorded exactly that way (claimed-not-measured honesty);
  SECURITY.md next to the model = disclosure-before-service.
- **Asv.Drones**: plugin prefix + plugins/ directory = a
  permission-shaped extension surface; GCS-to-hardware over MAVLink =
  intended state declared via bounded APIs (OpenMetal ironic's shape
  applied to drones); private vulnerability reporting named.

## What this is NOT

- NOT any interception/jamming/tracking of private signals (Remote ID
  reception only, and only as a reading reference), NOT any weights
  download or model training, NOT any drone or autopilot hardware
  action of any kind, NOT any model-weight mutation or learning
  promotion, NOT any review decision (CEO-gated).

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: LDCS,
   earthspecies repos, email/home-automation lists, Socrata retry).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).