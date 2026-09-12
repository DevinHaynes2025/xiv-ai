import { setTimeout as sleep } from 'node:timers/promises';

export interface ShiftPolicy { rounds: number; intervalMs: number; roundTimeoutMs: number }
export const BACKGROUND_SHIFT_DEFAULTS: Readonly<ShiftPolicy> = Object.freeze({ rounds: 2, intervalMs: 1_800_000, roundTimeoutMs: 420_000 });
export interface ShiftContribution {
  localStatus: 'RECEIVED' | 'BLOCKED' | 'FAILED';
  localMemo?: string;
  reviewerStatus: 'RECEIVED' | 'PENDING' | 'FAILED';
  reviewerMemo?: string;
  modelIdentity: Readonly<Record<string, unknown>>;
}
export interface ShiftRoundReport {
  round: number;
  status: 'AWAITING_HUMAN_REVIEW' | 'AWAITING_EXTERNAL_REVIEW' | 'BLOCKED' | 'FAILED' | 'STOPPED';
  contribution: ShiftContribution | null;
  learningPromoted: false;
  modelWeightsChanged: false;
  productionMutation: false;
  allAgentsAligned: false;
  settlementUnknown: boolean;
}
export function validateShiftPolicy(p: ShiftPolicy): void {
  if (!Number.isSafeInteger(p.rounds) || p.rounds < 1 || p.rounds > 4
    || !Number.isSafeInteger(p.intervalMs) || p.intervalMs < 900_000 || p.intervalMs > 3_600_000
    || !Number.isSafeInteger(p.roundTimeoutMs) || p.roundTimeoutMs < 1 || p.roundTimeoutMs > 420_000) throw new Error('invalid bounded shift policy');
}
const validMemo = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 8_192;
function validContribution(v: ShiftContribution): boolean {
  return Boolean(v && ['RECEIVED', 'BLOCKED', 'FAILED'].includes(v.localStatus)
    && ['RECEIVED', 'PENDING', 'FAILED'].includes(v.reviewerStatus)
    && (v.localStatus !== 'RECEIVED' || validMemo(v.localMemo))
    && (v.reviewerStatus !== 'RECEIVED' || (v.localStatus === 'RECEIVED' && validMemo(v.reviewerMemo))));
}
/** Sequential and finite. On interruption, do not accept late results or start another round. */
export async function runBoundedBackgroundShift(input: {
  policy: ShiftPolicy;
  signal: AbortSignal;
  round: (round: number, priorOrdinaryReview: string | undefined, signal: AbortSignal) => Promise<ShiftContribution>;
  report: (report: ShiftRoundReport) => Promise<void>;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
}) {
  validateShiftPolicy(input.policy);
  const reports: ShiftRoundReport[] = [];
  let prior: string | undefined;
  for (let index = 1; index <= input.policy.rounds; index++) {
    if (input.signal.aborted) break;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abortListener: (() => void) | undefined;
    let contribution: ShiftContribution | null = null;
    let settlementUnknown = false;
    let status: ShiftRoundReport['status'];
    try {
      const deadline = new Promise<never>((_, reject) => {
        abortListener = () => { controller.abort(); reject(new Error('shift interrupted')); };
        input.signal.addEventListener('abort', abortListener, { once: true });
        timer = setTimeout(() => { controller.abort(); reject(new Error('round deadline')); }, input.policy.roundTimeoutMs);
        if (input.signal.aborted) abortListener();
      });
      contribution = await Promise.race([deadline, Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new Error('round cancelled before start');
        return input.round(index, prior, controller.signal);
      })]);
      if (controller.signal.aborted || input.signal.aborted) throw new Error('late output rejected');
      if (!validContribution(contribution)) throw new Error('invalid contribution');
      status = contribution.localStatus === 'BLOCKED' ? 'BLOCKED'
        : contribution.localStatus === 'FAILED' || contribution.reviewerStatus === 'FAILED' ? 'FAILED'
        : contribution.reviewerStatus === 'RECEIVED' ? 'AWAITING_HUMAN_REVIEW' : 'AWAITING_EXTERNAL_REVIEW';
      settlementUnknown = status === 'FAILED' || status === 'BLOCKED';
      // Volatile discussion context, NOT trusted memory or a weight update.
      prior = contribution.reviewerStatus === 'RECEIVED' ? contribution.reviewerMemo : undefined;
    } catch {
      status = input.signal.aborted ? 'STOPPED' : 'FAILED';
      settlementUnknown = true;
      contribution = null;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (abortListener) input.signal.removeEventListener('abort', abortListener);
      controller.abort();
    }
    const report: ShiftRoundReport = Object.freeze({ round: index, status, contribution,
      learningPromoted: false, modelWeightsChanged: false, productionMutation: false,
      allAgentsAligned: false, settlementUnknown });
    // A failing disk/report sink is a hard stop; never report success without evidence.
    await input.report(report); reports.push(report);
    if (['FAILED', 'BLOCKED', 'STOPPED'].includes(status)) break;
    if (index < input.policy.rounds) {
      try { await (input.wait ?? ((ms, signal) => sleep(ms, undefined, { signal })))(input.policy.intervalMs, input.signal); }
      catch { break; }
    }
  }
  return Object.freeze({ completedReports: reports.length, reports: Object.freeze(reports),
    stopped: input.signal.aborted, automaticRestart: false,
    lockMayBeReleased: reports.every(r => !r.settlementUnknown) });
}
