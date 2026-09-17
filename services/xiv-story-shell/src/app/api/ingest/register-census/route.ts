// 12D-293 — the LOCAL reading-register-census endpoint of the story
// shell. The browser sends the raw register submission text (register
// genesis + register lines); this handler re-verifies the WHOLE
// submission — the full 12D-276 hash-chain replay and the measured
// census — through the REAL contracts in the LOCAL server process and
// returns ONLY a frozen view model. A refused submission's content
// (lines, sources, genesis) never crosses to the browser.
// No persistence, no write path, no remote calls: remoteCalls 0,
// modelCalls 0.

import { buildReadingRegisterCensusViewModel } from "../../../../../../ai/runtime/offline-team/xiv-reading-register-census-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-293-v1",
      reason: `reading register census submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Reading register census refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact register genesis and the untampered register lines.",
      },
    });
  }
  return Response.json(buildReadingRegisterCensusViewModel(parsed));
}