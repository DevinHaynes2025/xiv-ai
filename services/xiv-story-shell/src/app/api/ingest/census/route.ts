// 12D-271 — the LOCAL pathway-census endpoint of the story shell. The
// browser sends the raw ledger census submission text (ledger genesis +
// ledger lines); this handler re-verifies the WHOLE submission — the full
// 12D-264 hash-chain replay — through the 12D-264 contracts in the LOCAL
// server process and returns ONLY a frozen view model with MEASURED counts.
// A refused submission's content (lines, candidates, genesis) never crosses
// to the browser. No persistence, no write path, no remote calls: remoteCalls
// 0, modelCalls 0.

import { buildPathwayCensusViewModel } from "../../../../../../ai/runtime/offline-team/xiv-pathway-census-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-271-v1",
      reason: `pathway ledger census submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Pathway ledger census refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact genesis and the untampered ledger lines.",
      },
    });
  }
  return Response.json(buildPathwayCensusViewModel(parsed));
}