import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendLearning } from './learning-ledger';

export type CalibrationState = 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED';

export type IntelligenceCalibration = {
  id: string;
  tenantId: string;
  universeId: string;
  priorConfidence: number;
  posteriorConfidence: number;
  state: CalibrationState;
  reason: string;
  inventedSuccess: false;
  productionAuthorization: false;
};

type Store = { calibrations: IntelligenceCalibration[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'intelligence-calibration.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { calibrations: [] });
  return Array.isArray(parsed.calibrations) ? parsed.calibrations : [];
}

async function save(root: string, calibrations: IntelligenceCalibration[]) {
  await writeJsonFileAtomic(pathFor(root), { calibrations: calibrations.slice(-5_000) });
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export async function calibrateIntelligence(input: {
  tenantId: string;
  universeId: string;
  priorConfidence: number;
  observedSuccess?: boolean;
  evidenceCount: number;
  evidenceState?: CalibrationState;
  root?: string;
}): Promise<IntelligenceCalibration> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const prior = clamp01(input.priorConfidence);
  let state: CalibrationState = input.evidenceState ?? 'NOT_TESTED';
  let posterior = prior;
  let reason = 'No new evidence; calibration remains NOT_TESTED/UNKNOWN.';
  if (input.evidenceState === 'WAITING_DATA') {
    state = 'WAITING_DATA';
    posterior = prior * 0.9;
    reason = 'Freshness-dependent evidence is WAITING_DATA. Confidence is not inflated.';
  } else if (input.evidenceState === 'UNAVAILABLE') {
    state = 'UNAVAILABLE';
    posterior = Math.min(prior, 0.2);
    reason = 'Required capability is UNAVAILABLE. No invented PASS.';
  } else if (input.evidenceCount <= 0) {
    state = 'UNKNOWN';
    posterior = Math.min(prior, 0.15);
    reason = 'Zero sourced evidence refs. State is UNKNOWN, not PASS.';
  } else if (input.observedSuccess === true) {
    state = 'PASS';
    posterior = clamp01(prior + Math.min(0.2, input.evidenceCount * 0.04));
    reason = 'Local sourced evidence supported the hypothesis. Still not production authorization.';
  } else if (input.observedSuccess === false) {
    state = 'FAIL';
    posterior = clamp01(prior * 0.5);
    reason = 'Observed failure reduced confidence. Contradiction retained.';
  }

  const calibration: IntelligenceCalibration = {
    id: cortexId('cal'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    priorConfidence: prior,
    posteriorConfidence: posterior,
    state,
    reason,
    inventedSuccess: false,
    productionAuthorization: false,
  };
  const root = input.root ?? process.cwd();
  const rows = await load(root);
  rows.push(calibration);
  await save(root, rows);
  await appendLearning({
    domain: 'science',
    subject: 'intelligence-calibration',
    claimState: state === 'PASS' ? 'MODEL_INFERENCE' : 'UNKNOWN',
    summary: `calibrated ${prior.toFixed(2)} → ${posterior.toFixed(2)} state=${state}`,
    sourceRefs: [`cal:${calibration.id}`],
    evidence: [`cal:${calibration.id}`],
    confidence: posterior,
  }, root);
  return calibration;
}
