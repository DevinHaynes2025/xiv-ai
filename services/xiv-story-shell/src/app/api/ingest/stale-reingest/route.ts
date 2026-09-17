// 12D-316 — the LOCAL stale-reingest endpoint of the story shell: the
// operator's evidence-refresh surface. The browser sends
// { memoryPacket, currentDigests, staleDocumentId, newDocumentId,
// newTitle, newBodyText } — the pasted REAL 12D-305 memory packet, the
// re-fetched digests, and the NEW bytes of a source whose recorded
// evidence version moved — and this handler runs the REAL 12D-316 plan
// in the LOCAL server process: the STALE assessment is re-derived through
// the REAL 12D-315 contract (a CURRENT or UNCHECKED source has nothing to
// re-ingest), the successor id is checked genuinely NEW, and the stories
// are produced by the REAL 12D-274 ingest door. No model is called
// (modelCalls 0) and NOTHING is admitted here — the operator submits the
// emitted stories through the REAL 12D-275/12D-278 admission doors. ONLY
// the frozen view model renders. Nothing is persisted.

import {
  prepareStaleReingestPlan, buildStaleReingestPlanPacket,
} from "../../../../../../ai/runtime/offline-team/xiv-stale-reingest-plan";
import { buildStaleReingestPlanViewModel } from "../../../../../../ai/runtime/offline-team/xiv-stale-reingest-plan-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      kind: "STALE_REINGEST_PLAN",
      policyVersion: "12d-316-v1",
      reason: `stale re-ingestion plan input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  const prepared = prepareStaleReingestPlan(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildStaleReingestPlanViewModel(prepared));
  return Response.json(buildStaleReingestPlanViewModel(buildStaleReingestPlanPacket(prepared)));
}