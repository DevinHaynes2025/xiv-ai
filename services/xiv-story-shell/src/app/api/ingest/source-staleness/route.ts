// 12D-315 — the LOCAL source-staleness endpoint of the story shell: the
// operator's evidence-currency surface (the OpenWiki Grounded-Claims
// discipline). The browser sends { memoryPacket, currentDigests } — the
// pasted REAL 12D-305 memory packet plus the re-fetched sha256 digests
// (lowercase hex64) of the sources the facts were read as — and this
// handler runs the REAL 12D-315 card in the LOCAL server process: the
// packet is re-verified through the REAL 12D-306 gate, the recorded
// digest heads are re-parsed from the verified objectives (the SAME
// record the 12D-287 continuation gate binds re-submissions to), and
// every document's verdict is DERIVED by comparison. No model is called
// (modelCalls 0), nothing is fetched (the operator supplies the
// digests), nothing is mutated. STALE sources are disclosed BY storyId;
// UNCHECKED sources are disclosed as UNCHECKED — undisclosed staleness
// never looks like currency. ONLY the frozen view model renders.

import {
  prepareSourceStalenessCard, buildSourceStalenessCardPacket,
} from "../../../../../../ai/runtime/offline-team/xiv-source-staleness-card";
import { buildSourceStalenessCardViewModel } from "../../../../../../ai/runtime/offline-team/xiv-source-staleness-card-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      kind: "SOURCE_STALENESS_CARD",
      policyVersion: "12d-315-v1",
      reason: `source staleness card input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  const prepared = prepareSourceStalenessCard(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildSourceStalenessCardViewModel(prepared));
  return Response.json(buildSourceStalenessCardViewModel(buildSourceStalenessCardPacket(prepared)));
}