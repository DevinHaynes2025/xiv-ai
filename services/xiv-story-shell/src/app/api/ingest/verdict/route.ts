// 12D-262 — the LOCAL arena-verdict endpoint of the story shell. The browser
// sends the raw verdict submission text (transcript + packet + custody record
// + operator identity + clock); this handler re-verifies the WHOLE submission
// through the 12D-253/12D-258 contracts in the LOCAL server process and
// returns ONLY a frozen view model. A refused verdict's content (packet,
// transcript, receipt) never crosses to the browser. No persistence, no
// remote calls, no approve control: remoteCalls 0, modelCalls 0.

import { buildArenaVerdictViewModel } from "../../../../../../ai/runtime/offline-team/xiv-arena-verdict-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-262-v1",
      reason: `verdict submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Arena verdict refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver a fully consistent verdict submission.",
      },
    });
  }
  return Response.json(buildArenaVerdictViewModel(parsed));
}