/**
 * 12D-07 Adaptive Council UX — READ ONLY ranked queue views for Command Center / mobile.
 * Never auto-applies production. Preserves WAITING_PROVIDER honesty.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { VirtualUserStory } from './types';
import {
  ADAPTIVE_COUNCIL_GUARDRAILS,
  type AdaptiveQueueResult,
  type CouncilAgentSeat,
  type StoryCouncilDecision,
} from './adaptive-council';
import { DEBATE_SCORE_AXES, type DebateScores } from './priority-scores';

export const COUNCIL_UX_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  destructiveDbAutoApply: false as const,
  crossTenantDataCopyAllowed: false as const,
  cloudAgentsDefaultWaitingIfUnbound: true as const,
} as const;

export type CouncilQueueUxRow = {
  priorityRank: number;
  storyId: string;
  title: string;
  domain: string;
  composite: number;
  worthExecuting: boolean;
  scores: DebateScores;
  waitingProviders: string[];
  readyProviders: string[];
  offlineProviders: string[];
};

export type CouncilQueueUxSummary = {
  title: string;
  readOnly: true;
  productionAutoApply: false;
  productionAutoMerge: false;
  productionAutoDeploy: false;
  ethicsNotice: string;
  scoreAxes: readonly string[];
  providerStatuses: CouncilAgentSeat[];
  ranked: CouncilQueueUxRow[];
  skippedNotWorth: string[];
  orderedStoryIds: string[];
  guardrails: typeof ADAPTIVE_COUNCIL_GUARDRAILS;
  uxGuardrails: typeof COUNCIL_UX_GUARDRAILS;
};

export type CouncilQueueUxView = {
  summary: CouncilQueueUxSummary;
  markdown: string;
  json: string;
  html: string;
  readOnly: true;
  productionAutoApply: false;
};

function assertUxGuardrails(): void {
  if (COUNCIL_UX_GUARDRAILS.productionAutoApply) {
    throw new Error('productionAutoApply must remain false');
  }
  if (COUNCIL_UX_GUARDRAILS.productionAutoMerge) {
    throw new Error('productionAutoMerge must remain false');
  }
  if (COUNCIL_UX_GUARDRAILS.productionAutoDeploy) {
    throw new Error('productionAutoDeploy must remain false');
  }
  if (ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoMerge) {
    throw new Error('ADAPTIVE_COUNCIL productionAutoMerge must remain false');
  }
  if (ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoDeploy) {
    throw new Error('ADAPTIVE_COUNCIL productionAutoDeploy must remain false');
  }
}

function providersByStatus(ballots: StoryCouncilDecision['ballots'], status: string): string[] {
  return ballots.filter((b) => b.status === status).map((b) => b.agent);
}

function fmtScore(n: number): string {
  if (!Number.isFinite(n)) return '0.000';
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

export function buildCouncilQueueUxSummary(input: {
  queue: AdaptiveQueueResult;
  stories?: readonly VirtualUserStory[];
}): CouncilQueueUxSummary {
  assertUxGuardrails();
  const storyById = new Map((input.stories ?? []).map((s) => [s.id, s]));
  const ranked: CouncilQueueUxRow[] = input.queue.decisions.map((d) => {
    const story = storyById.get(d.storyId);
    return {
      priorityRank: d.priorityRank,
      storyId: d.storyId,
      title: story?.title ?? d.storyId,
      domain: story?.domain ?? 'PLATFORM',
      composite: d.composite,
      worthExecuting: d.worthExecuting,
      scores: d.blended,
      waitingProviders: providersByStatus(d.ballots, 'WAITING_PROVIDER'),
      readyProviders: providersByStatus(d.ballots, 'READY'),
      offlineProviders: providersByStatus(d.ballots, 'OPTIONAL_OFFLINE'),
    };
  });

  const ethicsNotice =
    'Adaptive Council UX is READ ONLY. Ranked scores inform triage only — never auto-merge, auto-deploy, or apply production. Unbound cloud agents remain WAITING_PROVIDER.';

  return {
    title: 'XIV Adaptive Story Council — Ranked Queue (READ ONLY)',
    readOnly: true,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    ethicsNotice,
    scoreAxes: [...DEBATE_SCORE_AXES],
    providerStatuses: input.queue.providerStatuses,
    ranked,
    skippedNotWorth: [...input.queue.skippedNotWorth],
    orderedStoryIds: [...input.queue.orderedStoryIds],
    guardrails: ADAPTIVE_COUNCIL_GUARDRAILS,
    uxGuardrails: COUNCIL_UX_GUARDRAILS,
  };
}

export function renderCouncilQueueMarkdown(summary: CouncilQueueUxSummary): string {
  const seatLines = summary.providerStatuses
    .map(
      (s) =>
        '| ' +
        s.agent +
        ' | ' +
        s.status +
        ' | ' +
        (s.local ? 'local' : 'cloud') +
        ' | ' +
        String(s.voteWeight) +
        ' |',
    )
    .join('\n');

  const header =
    '| Rank | Story | Domain | Composite | worth | customerValue | technicalRisk | cost | security | deps | evidenceQuality | WAITING_PROVIDER |';
  const sep =
    '|-----:|-------|--------|----------:|------|-------------:|-------------:|-----:|---------:|-----:|----------------:|------------------|';
  const rows = summary.ranked
    .map((r) => {
      const s = r.scores;
      return (
        '| ' +
        String(r.priorityRank) +
        ' | `' +
        r.storyId +
        '` ' +
        r.title.replace(/\|/g, '/') +
        ' | ' +
        r.domain +
        ' | ' +
        fmtScore(r.composite) +
        ' | ' +
        (r.worthExecuting ? 'yes' : 'no') +
        ' | ' +
        fmtScore(s.customerValue) +
        ' | ' +
        fmtScore(s.technicalRisk) +
        ' | ' +
        fmtScore(s.cost) +
        ' | ' +
        fmtScore(s.security) +
        ' | ' +
        fmtScore(s.dependencies) +
        ' | ' +
        fmtScore(s.evidenceQuality) +
        ' | ' +
        (r.waitingProviders.join(', ') || '—') +
        ' |'
      );
    })
    .join('\n');

  const lines = [
    '# ' + summary.title,
    '',
    '> **READ ONLY** — never auto-applies production. Scores: customerValue, technicalRisk, cost, security, dependencies, evidenceQuality.',
    '',
    '## Provider seats',
    '',
    '| Agent | Status | Scope | Vote weight |',
    '|-------|--------|-------|------------:|',
    seatLines,
    '',
    '## Ranked stories',
    '',
    header,
    sep,
    rows || '| — | (empty) | — | 0 | no | 0 | 0 | 0 | 0 | 0 | 0 | — |',
    '',
    '## Ordered (worth executing)',
    '',
    summary.orderedStoryIds.length
      ? summary.orderedStoryIds.map((id, i) => String(i + 1) + '. `' + id + '`').join('\n')
      : '(none)',
    '',
    '## Skipped (not worth)',
    '',
    summary.skippedNotWorth.length
      ? summary.skippedNotWorth.map((id) => '- `' + id + '`').join('\n')
      : '(none)',
    '',
    '## Ethics',
    '',
    summary.ethicsNotice,
    '',
    '- productionAutoApply / productionAutoMerge / productionAutoDeploy: **false**',
    '- cloudAgentsDefaultWaitingIfUnbound: **true**',
    '',
    '## Guardrails',
    '',
    '```json',
    JSON.stringify({ council: summary.guardrails, ux: summary.uxGuardrails }, null, 2),
    '```',
    '',
  ];
  return lines.join('\n');
}

export function renderCouncilQueueJson(summary: CouncilQueueUxSummary): string {
  return JSON.stringify(
    {
      readOnly: true,
      productionAutoApply: false,
      productionAutoMerge: false,
      productionAutoDeploy: false,
      summary,
    },
    null,
    2,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCouncilQueueHtml(summary: CouncilQueueUxSummary): string {
  const seatRows = summary.providerStatuses
    .map(
      (s) =>
        '<tr><td>' +
        escapeHtml(s.agent) +
        '</td><td><code>' +
        escapeHtml(s.status) +
        '</code></td><td>' +
        (s.local ? 'local' : 'cloud') +
        '</td><td>' +
        String(s.voteWeight) +
        '</td></tr>',
    )
    .join('');
  const storyRows = summary.ranked
    .map((r) => {
      const s = r.scores;
      return (
        '<tr>' +
        '<td>' +
        String(r.priorityRank) +
        '</td>' +
        '<td><code>' +
        escapeHtml(r.storyId) +
        '</code><br/>' +
        escapeHtml(r.title) +
        '</td>' +
        '<td>' +
        escapeHtml(r.domain) +
        '</td>' +
        '<td>' +
        fmtScore(r.composite) +
        '</td>' +
        '<td>' +
        (r.worthExecuting ? 'yes' : 'no') +
        '</td>' +
        '<td>' +
        fmtScore(s.customerValue) +
        '</td>' +
        '<td>' +
        fmtScore(s.technicalRisk) +
        '</td>' +
        '<td>' +
        fmtScore(s.cost) +
        '</td>' +
        '<td>' +
        fmtScore(s.security) +
        '</td>' +
        '<td>' +
        fmtScore(s.dependencies) +
        '</td>' +
        '<td>' +
        fmtScore(s.evidenceQuality) +
        '</td>' +
        '<td>' +
        escapeHtml(r.waitingProviders.join(', ') || '—') +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  return [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    '<title>' + escapeHtml(summary.title) + '</title>',
    '<style>',
    'body{font-family:system-ui,sans-serif;max-width:1100px;margin:2rem auto;padding:0 1rem;line-height:1.4;color:#122}',
    'h1,h2{color:#0b3d5c} table{border-collapse:collapse;width:100%;margin:0.75rem 0;font-size:0.92rem}',
    'th,td{border:1px solid #bcd;padding:0.35rem 0.5rem;text-align:left;vertical-align:top}',
    'th{background:#e8f2f8} .banner{background:#fff6e0;border:1px solid #e0c56a;padding:0.6rem 0.8rem;border-radius:6px}',
    'code{background:#f0f4f8;padding:0.1rem 0.3rem;border-radius:3px}',
    '</style></head><body>',
    '<p class="banner"><strong>READ ONLY</strong> — Adaptive Council ranked queue. Never auto-applies production. Unbound cloud agents stay <code>WAITING_PROVIDER</code>.</p>',
    '<h1>' + escapeHtml(summary.title) + '</h1>',
    '<h2>Provider seats</h2>',
    '<table><thead><tr><th>Agent</th><th>Status</th><th>Scope</th><th>Vote</th></tr></thead><tbody>',
    seatRows,
    '</tbody></table>',
    '<h2>Ranked stories</h2>',
    '<table><thead><tr>',
    '<th>Rank</th><th>Story</th><th>Domain</th><th>Composite</th><th>Worth</th>',
    '<th>customerValue</th><th>technicalRisk</th><th>cost</th><th>security</th><th>deps</th><th>evidenceQuality</th>',
    '<th>WAITING_PROVIDER</th>',
    '</tr></thead><tbody>',
    storyRows || '<tr><td colspan="12">(empty)</td></tr>',
    '</tbody></table>',
    '<h2>Ethics</h2>',
    '<p>' + escapeHtml(summary.ethicsNotice) + '</p>',
    '<ul><li>productionAutoApply / Merge / Deploy: false</li>',
    '<li>cloudAgentsDefaultWaitingIfUnbound: true</li></ul>',
    '</body></html>',
  ].join('\n');
}

export function buildCouncilQueueUxView(summary: CouncilQueueUxSummary): CouncilQueueUxView {
  assertUxGuardrails();
  return {
    summary,
    markdown: renderCouncilQueueMarkdown(summary),
    json: renderCouncilQueueJson(summary),
    html: renderCouncilQueueHtml(summary),
    readOnly: true,
    productionAutoApply: false,
  };
}

export function exportCouncilQueueArtifacts(input: {
  summary: CouncilQueueUxSummary;
  outDir: string;
  basename?: string;
}): { jsonPath: string; mdPath: string; htmlPath: string } {
  const basename = input.basename ?? 'adaptive-council-queue';
  mkdirSync(input.outDir, { recursive: true });
  const jsonPath = join(input.outDir, basename + '.json');
  const mdPath = join(input.outDir, basename + '.md');
  const htmlPath = join(input.outDir, basename + '.html');
  const view = buildCouncilQueueUxView(input.summary);
  writeFileSync(jsonPath, view.json, 'utf8');
  writeFileSync(mdPath, view.markdown, 'utf8');
  writeFileSync(htmlPath, view.html, 'utf8');
  mkdirSync(dirname(jsonPath), { recursive: true });
  return { jsonPath, mdPath, htmlPath };
}
