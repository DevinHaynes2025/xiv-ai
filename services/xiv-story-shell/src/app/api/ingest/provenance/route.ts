// 12D-282 — the LOCAL reading-provenance endpoint of the story shell.
// The browser sends the raw pathway-ledger submission text (ledger
// genesis + ledger lines); this handler re-verifies the WHOLE
// submission — the full 12D-264 hash-chain replay and the 12D-281
// provenance view — through the REAL contracts in the LOCAL server
// process and returns ONLY a frozen view model. A refused submission's
// content (lines, candidates, genesis) never crosses to the browser.
// No persistence, no write path, no remote calls: remoteCalls 0,
// modelCalls 0.

import { buildReadingProvenanceViewModel } from "../../../../../../ai/runtime/offline-team/xiv-reading-provenance-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-282-v1",
      reason: `reading provenance submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Reading provenance view refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact ledger genesis and the untampered ledger lines.",
      },
    });
  }
  return Response.json(buildReadingProvenanceViewModel(parsed));
}