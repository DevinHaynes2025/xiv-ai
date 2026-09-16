// 12D-259 — the LOCAL ingest endpoint of the story shell. The browser sends
// raw packet text; this handler runs the 12D-259 ingest (12D-254 verification
// through node:crypto) inside the LOCAL server process and returns ONLY
// frozen view models. A refused packet's content never crosses to the
// browser: refusal view models carry zero packet content by construction.
// No persistence, no remote calls, no approve control: remoteCalls 0,
// modelCalls 0. humanDecision: REQUIRED — decisions happen in the custody
// stack, never through this endpoint.

import { ingestStoryShellPacketJson } from "../../../../../ai/runtime/offline-team/xiv-story-shell-ingest";

export async function POST(request: Request) {
  const raw = await request.text();
  const result = ingestStoryShellPacketJson(raw);
  return Response.json(result);
}