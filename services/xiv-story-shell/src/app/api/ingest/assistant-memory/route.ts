// 12D-306 — the LOCAL assistant-memory endpoint of the story shell.
// The operator pastes the RAW 12D-305 memory packet (produced
// runtime-side by prepareAssistantMemoryRead over a trusted queue — the
// 12D-286 lesson: queue doors are never shell-imported); this handler
// re-verifies the WHOLE packet through the REAL 12D-306 view model in
// the LOCAL server process — exact keys, re-derived digest, re-screened
// objectives, honest flags, consistent bounds — and returns ONLY the
// frozen view model. A refused packet's content (ids, digests,
// objectives) never crosses to the browser. No persistence, no queue,
// no write path, no remote calls: remoteCalls 0, modelCalls 0.

import { buildAssistantMemoryViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-306-v1",
      reason: `assistant memory packet text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant memory read refused — HUMAN DECISION REQUIRED",
        bodyText: "The packet was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact packet the REAL 12D-305 door produced.",
      },
    });
  }
  return Response.json(buildAssistantMemoryViewModel(parsed));
}