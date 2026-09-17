// 12D-297 — the LOCAL dataset-metadata-census endpoint of the story
// shell. The browser sends the raw OEX-style metadata packet text; this
// handler re-verifies the WHOLE packet — exact shape, geometry-sum
// cross-binding, per-column bounds, the 2,000,000-row measured ceiling,
// and the disclosed license — through the REAL contract in the LOCAL
// server process and returns ONLY a frozen view model. A refused
// packet's content (columns, top values, bboxes) never crosses to the
// browser. No persistence, no write path, no remote calls: remoteCalls
// 0, modelCalls 0.

import { buildDatasetMetadataViewModel } from "../../../../../../ai/runtime/offline-team/xiv-dataset-metadata-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      policyVersion: "12d-297-v1",
      headline: "Dataset metadata census refused — HUMAN DECISION REQUIRED",
      reason: `dataset metadata packet text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      records: [],
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  return Response.json(buildDatasetMetadataViewModel(parsed));
}