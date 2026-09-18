# 12D-326 — The CEO media/streaming references read through the supervised cycle

**Story rung:** 12D-326 (operational rung over committed doors — the
12D-318 pattern; no code changed) · **Parents:** the 2026-09-17 CEO
directive #6 (fifth inbox drop) / 12D-276 (the register) / 12D-283/284
(the supervised cycle) / 12D-322 (the slate measurement) · **Policy
footprint:** none added — committed doors only

## What this rung is

The actionable half of the CEO's streaming-platform directive: the
CEO-named media references are REGISTERED through the REAL 12D-276
contract and READ through the REAL 12D-283 supervised cycle — one
chunk per invocation, local Ollama qwen2.5-coder:7b at 127.0.0.1:11434
only, remoteCalls 0, every draft settled as AWAITING_REVIEW and STOPPED
before review. XIV AI Media itself (the streaming platform, the
community-of-souls vision) remains FUTURE DESIGN, CEO-gated, nothing
built — this rung builds the reading evidence, not the platform.

## Registered + read (scratch register + queue under `.xiv-runtime/reading-12d-326/`, never committed)

| Source | Class | License (verified 2026-09-17) | Chunks read |
|---|---|---|---|
| Chocobozzz/PeerTube | OPEN_SOURCE_REPO | AGPL-3.0 — reference-only (strong copyleft) | 1 |
| datarhei/restreamer | OPEN_SOURCE_REPO | Apache-2.0 | 1 |
| Open-Streaming-Platform | OPEN_SOURCE_REPO | MIT (maintenance ended; deamos fork ref) | 1 |
| soundcloud/twinagle | OPEN_SOURCE_REPO | Apache-2.0 | 1 |
| SoundCloud p99 blog | PUBLIC_WEB | public engineering article, cited per use | 2 |
| SoundCloud AAC blog | PUBLIC_WEB | public engineering article, cited per use | 2 |

- **6 registered** (idempotent through the REAL contract's duplicate
  refusal), **8 chunks prepared + 8 read = 8 counted model calls**,
  all loopback, all `draftChars` recorded (248–753), every draft
  sha256 in the queue, `remainingReady 0` per document, the 12D-287
  continuation gate exercised on both 2-chunk documents.
- Scratch census: **8 AWAITING_REVIEW**; slate measured over the
  scratch queue — 8 of 8 listed, 0 redactions, digest `89773abd6d19…`.
  The live queue (35 AWAITING_REVIEW + 98 DONE) is UNCHANGED.
- Fidelity disclosure: the fetched snapshots are faithful
  extractions of the READMEs/articles saved under
  `.xiv-runtime/reading-sources-12d-326/` (not byte-verbatim copies;
  provenance header on each file discloses the fetch). The 12D-274
  door's paragraph gate accepted all six bodies as-is — no re-chunk
  needed this batch.

## Reading notes (build references — never copies)

- **PeerTube (AGPL-3.0, reference-only)**: federation via ActivityPub +
  WebRTC P2P + community redundancy + the "no dark pattern, no data
  mining, no recommendation machinery" posture — the reference posture
  for the future CEO-gated media platform design; the codebase itself
  is never vendored.
- **Restreamer (Apache-2.0)**: single-board-friendly self-hosting +
  RTMP/HLS via nginx-rtmp + REST API — the pipeline shape reference.
- **OSP (MIT)**: per-channel chat + channel moderation + protected
  channels + on-demand playback — maps to the community/moderation
  needs of a media platform; maintenance-ended, reference only.
- **Twinagle (Apache-2.0)**: Twirp's simple protobuf-over-HTTP RPC —
  a build reference for internal local service contracts.
- **SoundCloud p99 article**: "an unconditional log line is a hot-path
  dependency"; intended absence vs anomalous absence need different
  handling; wait through a full traffic cycle before quoting a number —
  all three map directly onto our per-invocation modelCalls pins,
  optional-vs-tampered field gates, and measured-evidence-only
  discipline.
- **SoundCloud AAC article**: deliberate, DISCLOSED budget allocation
  (cut what cannot be heard, spend bits where ears are) is the same
  shape as our disclosed truncation bounds — bounded windows, counted
  truncations, nothing hidden.

## What this is NOT

- NOT the XIV AI Media platform: no platform code, no deploy, no cloud
  change, no streaming service built — the design rung is CEO-gated
  FUTURE DESIGN.
- NOT any review decision: the 8 new drafts (and the 35 live ones)
  settle AWAITING_REVIEW; decisions are the CEO's (the
  slate→worksheet→decisions-file→apply loop is tooled for them).
- NOT any fetch of TOP_SECRET/CONFIDENTIAL material and NOT any
  third-party scanning: public references only, defensive reading
  only (the wazuh/wireshark/ossec/CAI half of the batch is queued as
  the next reading rung; CAI is reference-only — dual license,
  mostly proprietary, archived).
- NOT any learning promotion or activation: learningPromoted false,
  activated 0, humanDecision REQUIRED on every packet.

## Next candidates

1. CEO review decisions on the 35 live + 8 new AWAITING_REVIEW drafts
   (CEO-gated; the tooled loop is ready).
2. The defensive-security half of the batch read (wazuh, wireshark,
   ossec, CAI — defensive reading only).
3. XIV AI Media design rung (CEO-gated FUTURE DESIGN — a design memo,
   not a build).