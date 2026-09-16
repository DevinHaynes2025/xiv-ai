// 12D-272 — the LOCAL custody-journal-census endpoint of the story shell.
// The browser sends the raw journal census submission text (journal genesis
// + journal lines); this handler re-verifies the WHOLE submission — the full
// 12D-236 hash-chain replay through the 12D-233 registry gates — in the
// LOCAL server process and returns ONLY a frozen view model with MEASURED
// counts. A refused submission's content (lines, ops, genesis) never
// crosses to the browser. No persistence, no write path, no remote calls:
// remoteCalls 0, modelCalls 0.

import { buildCustodyJournalCensusViewModel } from "../../../../../../ai/runtime/offline-team/xiv-custody-journal-census-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-272-v1",
      reason: `custody journal census submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Custody journal census refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact genesis and the untampered journal lines.",
      },
    });
  }
  return Response.json(buildCustodyJournalCensusViewModel(parsed));
}