import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { listXivAgents } from '../agents';
import { DEFAULT_OFFLINE_TEAM } from './orchestrator';
import { buildAgentCensus } from './agent-census';
import { runApprovedMasterPlanMeeting, APPROVED_MASTER_PLAN_SHA256 } from './approved-master-plan-meeting';
import { runBoundedBackgroundShift, BACKGROUND_SHIFT_DEFAULTS, validateShiftPolicy, type ShiftContribution } from './bounded-background-shift';
import { reviewerArgs, reviewOrdinaryMemo, type TextReviewerConfig } from './claude-text-reviewer';

function options(args: string[]): Map<string, string> {
  const flags = new Set(['--approve-local-meetings', '--approve-external-review', '--reviewer-policy-reviewed']);
  const values = new Set(['--tenant', '--master-plan', '--rounds', '--interval-minutes', '--claude-bin', '--reviewer-model', '--reviewer-provider']);
  const parsed = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (parsed.has(key) || (!flags.has(key) && !values.has(key))) throw new Error('unknown or duplicate option');
    if (flags.has(key)) parsed.set(key, 'true');
    else { const value = args[++i]; if (!value || value.startsWith('--')) throw new Error('option value missing'); parsed.set(key, value); }
  }
  return parsed;
}
async function main(): Promise<void> {
  const census = buildAgentCensus(listXivAgents(), DEFAULT_OFFLINE_TEAM);
  if (process.argv.slice(2).length === 0 || (process.argv.length === 3 && process.argv[2] === '--census')) {
    console.log(JSON.stringify(census, null, 2)); return;
  }
  const opts = options(process.argv.slice(2));
  if (opts.get('--approve-local-meetings') !== 'true') throw new Error('explicit local approval required');
  const tenantId = opts.get('--tenant') ?? '';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(tenantId)) throw new Error('valid tenant required');
  const planPath = opts.get('--master-plan'); if (!planPath) throw new Error('master plan required');
  const planInfo = lstatSync(planPath);
  if (!planInfo.isFile() || planInfo.isSymbolicLink() || planInfo.size > 32 * 1024 * 1024) throw new Error('approved regular master-plan file required');
  const masterPlanSha256 = createHash('sha256').update(readFileSync(planPath)).digest('hex');
  if (masterPlanSha256 !== APPROVED_MASTER_PLAN_SHA256) throw new Error('master-plan revision mismatch');
  const policy = { ...BACKGROUND_SHIFT_DEFAULTS, rounds: Number(opts.get('--rounds') ?? 2),
    intervalMs: Number(opts.get('--interval-minutes') ?? 30) * 60_000 };
  validateShiftPolicy(policy);
  let reviewer: TextReviewerConfig | undefined;
  if (opts.has('--approve-external-review')) {
    reviewer = { executable: resolve(opts.get('--claude-bin') ?? join(homedir(), '.local', 'bin', 'claude.exe')),
      modelId: opts.get('--reviewer-model') ?? '', providerLabel: opts.get('--reviewer-provider') ?? '',
      externalReviewApproved: true, policyReviewed: opts.has('--reviewer-policy-reviewed'), maxBudgetUsd: .25 };
    reviewerArgs(reviewer);
  } else if (['--claude-bin', '--reviewer-model', '--reviewer-provider', '--reviewer-policy-reviewed'].some(k => opts.has(k))) throw new Error('external approval required for reviewer options');
  const root = join(homedir(), '.xiv-ai-operator');
  mkdirSync(root, { recursive: true, mode: 0o700 });
  if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) throw new Error('unsafe report directory');
  const lock = join(root, 'meeting.lock');
  mkdirSync(lock, { mode: 0o700 }); // Exclusive across working copies. Never steal an existing lock.
  const shiftId = randomUUID(); const directory = join(root, shiftId);
  let release = false;
  const controller = new AbortController();
  const stop = () => controller.abort();
  let poll: ReturnType<typeof setInterval> | undefined;
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    mkdirSync(directory, { mode: 0o700 });
    writeFileSync(join(lock, 'owner.json'), JSON.stringify({ shiftId, pid: process.pid, directory }), { flag: 'wx', mode: 0o600 });
    writeFileSync(join(directory, 'census.json'), JSON.stringify(census, null, 2), { flag: 'wx', mode: 0o600 });
    writeFileSync(join(directory, 'start.json'), JSON.stringify({ shiftId, tenantId, policy, masterPlanSha256,
      externalReviewApproved: Boolean(reviewer), rawPrivateDataAllowed: false, state: 'STARTING', generatedAt: new Date().toISOString() }, null, 2), { flag: 'wx', mode: 0o600 });
    poll = setInterval(() => { if (existsSync(join(directory, 'STOP'))) stop(); }, 1_000);
    console.log(`XIV shift ${shiftId}\nReports: ${directory}\nStop: create ${join(directory, 'STOP')} or press Ctrl+C`);
    const result = await runBoundedBackgroundShift({ policy, signal: controller.signal,
      round: async (_round, priorOrdinaryReview, signal): Promise<ShiftContribution> => {
        const packet = await runApprovedMasterPlanMeeting({ tenantId, masterPlanSha256, priorOrdinaryReview,
          request: (url, init) => fetch(url, { ...init, signal: AbortSignal.any(init.signal ? [init.signal, signal] : [signal]) }) });
        const localMemo = packet.localContribution?.ordinaryMemo;
        if (packet.status !== 'AWAITING_REVIEW' || !localMemo) return {
          localStatus: packet.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED', reviewerStatus: 'PENDING',
          modelIdentity: { localModel: packet.heartbeat.receipt?.modelId ?? null, grok: 'PENDING_NO_ADAPTER_CALL' } };
        if (!reviewer) return { localStatus: 'RECEIVED', localMemo, reviewerStatus: 'PENDING',
          modelIdentity: { localModel: packet.localContribution?.modelId, claudeCode: 'NOT_ENABLED', grok: 'PENDING_NO_ADAPTER_CALL' } };
        try {
          const reviewed = await reviewOrdinaryMemo(reviewer, localMemo, process.cwd(), signal);
          return { localStatus: 'RECEIVED', localMemo, reviewerStatus: 'RECEIVED', reviewerMemo: reviewed.memo,
            modelIdentity: { localModel: packet.localContribution?.modelId, tool: 'CLAUDE_CODE',
              providerLabel: reviewed.providerLabel, requestedModel: reviewed.requestedModel,
              reportedModels: reviewed.reportedModels, identityAssurance: reviewed.identityAssurance,
              estimatedCostUsd: reviewed.estimatedCostUsd, grok: 'PENDING_NO_ADAPTER_CALL' } };
        } catch {
          return { localStatus: 'RECEIVED', localMemo, reviewerStatus: 'FAILED', modelIdentity: {
            tool: 'CLAUDE_CODE', reviewerState: 'FAILED_OR_UNAVAILABLE_NO_RETRY', grok: 'PENDING_NO_ADAPTER_CALL' } };
        }
      },
      report: async report => {
        writeFileSync(join(directory, `round-${report.round}.json`), JSON.stringify({ ceo: 'Devin Xavier Haynes',
          generatedAt: new Date().toISOString(), shiftId, tenantId, ...report }, null, 2), { flag: 'wx', mode: 0o600 });
        console.log(`Round ${report.round}: ${report.status}`);
      },
    });
    writeFileSync(join(directory, 'summary.json'), JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 });
    release = result.lockMayBeReleased;
    process.exitCode = result.stopped || result.reports.some(r => ['BLOCKED', 'FAILED', 'STOPPED'].includes(r.status)) ? 2 : 0;
  } finally {
    controller.abort(); if (poll) clearInterval(poll);
    process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
    if (release) { unlinkSync(join(lock, 'owner.json')); rmdirSync(lock); }
    else console.error('Shift stopped. Lock retained for operator review; confirm owned child/provider work has stopped before clearing it.');
  }
}
main().catch(() => {
  console.error('XIV shift not completed. Check approved arguments/document, dependency policy, credentials and operator lock. No automatic retry.');
  process.exitCode = 2;
});
