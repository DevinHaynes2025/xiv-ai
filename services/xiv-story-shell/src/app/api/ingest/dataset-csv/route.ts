// 12D-298 — the LOCAL dataset-CSV-census endpoint of the story shell.
// The browser sends { fileName, csvText } as JSON; this handler
// re-verifies the WHOLE CSV — exact shape, RFC 4180 parsing, header
// discipline, the PII-shaped refusal, and the 2,000,000-row measured
// ceiling — through the REAL contract in the LOCAL server process and
// returns ONLY a frozen view model of MEASURED counts. A refused CSV's
// cell content never crosses to the browser, and refusal reasons never
// echo cell content. No persistence, no write path, no remote calls:
// remoteCalls 0, modelCalls 0.

import { buildDatasetCsvViewModel } from "../../../../../../ai/runtime/offline-team/xiv-dataset-csv-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      policyVersion: "12d-298-v1",
      headline: "Dataset CSV census refused — HUMAN DECISION REQUIRED",
      reason: `dataset CSV input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      records: [],
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  return Response.json(buildDatasetCsvViewModel(parsed));
}