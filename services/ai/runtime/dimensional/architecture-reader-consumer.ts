/**
 * 12D-08 — Thin Command Center / mobile-ready consumer of Architecture Reader + Council UX.
 * Isomorphic composition module: no node:fs. Accepts pre-built 12D-07 views or builds them
 * when summaries are supplied. Product-lane React Native wire is a documented follow-up.
 *
 * Guardrails: readOnly; productionAutoApply false; Twin ethics; no bio DNA;
 * wormholes = sparse SIMULATION pathways only.
 */
import {
  buildArchitectureReaderView,
  type ArchitectureReaderSummary,
  type ArchitectureReaderView,
} from './architecture-reader';
import {
  assertEthicsSafeCopy,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
} from './universe-ethics';
import {
  FOUNDER_TWIN_GUARDRAILS,
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
  summarizeFounderTwinRoster,
  type FounderTwinRoster,
} from './founder-twin-roster';
import {
  planRosterDutyCycle,
  type RosterDutyCyclePlan,
} from './roster-duty-cycle-scheduler';
import {
  buildCouncilQueueUxView,
  COUNCIL_UX_GUARDRAILS,
  type CouncilQueueUxSummary,
  type CouncilQueueUxView,
} from '../storyfactory/adaptive-council-ux';

export const ARCH_READER_CONSUMER_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  destructiveDbAutoApply: false as const,
  crossTenantDataCopyAllowed: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  cloudAgentsDefaultWaitingIfUnbound: true as const,
  VALUATION_THEATER_ALLOWED: false as const,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  bioCloningAllowed: false as const,
  alwaysOnInfiniteClonesAllowed: false as const,
  wormholesAreSparseSimulationPathwaysOnly: true as const,
  replicaHardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
  maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
  productLaneMobileWire: 'FOLLOW_UP' as const,
} as const;

export type ArchitectureCard = {
  universeId: string;
  tenantId: string;
  layerKind: 'SIMULATION';
  fingerprint: string;
  companyCount: number;
  supplyLinkCount: number;
  agentPopulationTotal: number;
  worldEntityCount: number;
  branchCount: number;
  cityLadder: string;
  routeTarget: string | null;
  manifestStatus: string;
};

export type CouncilRankPreviewRow = {
  priorityRank: number;
  storyId: string;
  title: string;
  domain: string;
  composite: number;
  worthExecuting: boolean;
  waitingProviders: string[];
  readyProviders: string[];
};

export type MobileReadyConsumerPayload = {
  architectureCard: ArchitectureCard | null;
  councilTop: CouncilRankPreviewRow[];
  councilProviderHonesty: string[];
  dutyCycleStatus: {
    replicaCount: number;
    hardCap: number;
    energyRemaining: number;
    energyBudgetTotal: number;
    maxDutyCycle: number;
    sparsePathwayCount: number;
    bioCloningAllowed: false;
    wormholesAreSparseSimulationPathwaysOnly: true;
  } | null;
  banners: string[];
};

export type CommandCenterConsumerBundle = {
  title: string;
  architecture: ArchitectureReaderView | null;
  council: CouncilQueueUxView | null;
  dutyPlan: RosterDutyCyclePlan | null;
  mobileReady: MobileReadyConsumerPayload;
  markdown: string;
  html: string;
  json: string;
  readOnly: true;
  productionAutoApply: false;
  layerKind: 'SIMULATION';
  ethicsNotice: string;
  guardrails: typeof ARCH_READER_CONSUMER_GUARDRAILS;
  productLaneFollowUp: string;
};

function assertConsumerGuardrails(): void {
  if (!ARCH_READER_CONSUMER_GUARDRAILS.readOnly) {
    throw new Error('readOnly must remain true');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.productionAutoApply) {
    throw new Error('productionAutoApply must remain false');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.productionAutoMerge) {
    throw new Error('productionAutoMerge must remain false');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.productionAutoDeploy) {
    throw new Error('productionAutoDeploy must remain false');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.L4_PRODUCTION_ENABLED) {
    throw new Error('L4_PRODUCTION_ENABLED must remain false');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.bioCloningAllowed) {
    throw new Error('bioCloningAllowed must remain false');
  }
  if (ARCH_READER_CONSUMER_GUARDRAILS.alwaysOnInfiniteClonesAllowed) {
    throw new Error('alwaysOnInfiniteClonesAllowed must remain false');
  }
  if (!ARCH_READER_CONSUMER_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly) {
    throw new Error('wormholes must remain sparse SIMULATION pathways only');
  }
  if (!COUNCIL_UX_GUARDRAILS.readOnly || COUNCIL_UX_GUARDRAILS.productionAutoApply) {
    throw new Error('council UX guardrails must remain read-only');
  }
  if (FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed) {
    throw new Error('founder twin bio cloning must remain false');
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveArchitectureView(input: {
  architectureView?: ArchitectureReaderView | null;
  architectureSummary?: ArchitectureReaderSummary | null;
}): ArchitectureReaderView | null {
  if (input.architectureView) return input.architectureView;
  if (input.architectureSummary) return buildArchitectureReaderView(input.architectureSummary);
  return null;
}

function resolveCouncilView(input: {
  councilView?: CouncilQueueUxView | null;
  councilSummary?: CouncilQueueUxSummary | null;
}): CouncilQueueUxView | null {
  if (input.councilView) return input.councilView;
  if (input.councilSummary) return buildCouncilQueueUxView(input.councilSummary);
  return null;
}

function toArchitectureCard(view: ArchitectureReaderView): ArchitectureCard {
  const s = view.summary;
  return {
    universeId: s.universeId,
    tenantId: s.tenantId,
    layerKind: 'SIMULATION',
    fingerprint: s.fingerprint,
    companyCount: s.companyCount,
    supplyLinkCount: s.supplyLinkCount,
    agentPopulationTotal: s.agentPopulationTotal,
    worldEntityCount: s.worldEntityCount,
    branchCount: s.branchCount,
    cityLadder: s.cityTiers.join(' → ') || '(none)',
    routeTarget: s.routeTarget,
    manifestStatus: s.manifestStatus ?? 'n/a',
  };
}

function toCouncilPreview(view: CouncilQueueUxView, limit = 8): CouncilRankPreviewRow[] {
  return view.summary.ranked.slice(0, limit).map((r) => ({
    priorityRank: r.priorityRank,
    storyId: r.storyId,
    title: r.title,
    domain: r.domain,
    composite: r.composite,
    worthExecuting: r.worthExecuting,
    waitingProviders: r.waitingProviders,
    readyProviders: r.readyProviders,
  }));
}

function renderConsumerMarkdown(input: {
  architecture: ArchitectureReaderView | null;
  council: CouncilQueueUxView | null;
  dutyPlan: RosterDutyCyclePlan | null;
  ethicsNotice: string;
  mobileReady: MobileReadyConsumerPayload;
}): string {
  const lines = [
    '# XIV Command Center Consumer — Architecture Reader + Council (12D-08)',
    '',
    '> **READ ONLY** — Thin mobile/Command Center payload. Never auto-applies production.',
    '',
    input.ethicsNotice,
    '',
    '## Guardrails',
    '',
    '- readOnly: **true**',
    '- productionAutoApply: **false**',
    '- bioCloningAllowed: **false**',
    '- wormholesAreSparseSimulationPathwaysOnly: **true**',
    '- productLaneMobileWire: **FOLLOW_UP**',
    '',
  ];
  if (input.mobileReady.architectureCard) {
    const c = input.mobileReady.architectureCard;
    lines.push(
      '## Architecture card',
      '',
      '| Field | Value |',
      '|-------|-------|',
      '| Universe | `' + c.universeId + '` |',
      '| Layer | `' + c.layerKind + '` |',
      '| Companies | ' + String(c.companyCount) + ' |',
      '| Supply links | ' + String(c.supplyLinkCount) + ' |',
      '| Agents | ' + String(c.agentPopulationTotal) + ' |',
      '| City ladder | ' + c.cityLadder + ' |',
      '',
    );
  }
  if (input.mobileReady.councilTop.length) {
    lines.push('## Council top ranks', '', '| Rank | Story | Composite | Waiting |', '|-----:|-------|----------:|---------|');
    for (const row of input.mobileReady.councilTop) {
      lines.push(
        '| ' +
          String(row.priorityRank) +
          ' | ' +
          row.title +
          ' | ' +
          String(row.composite) +
          ' | ' +
          (row.waitingProviders.join(', ') || '—') +
          ' |',
      );
    }
    lines.push('');
  }
  if (input.dutyPlan) {
    lines.push(
      '## Roster duty-cycle plan (stub)',
      '',
      '- cycleId: `' + input.dutyPlan.cycleId + '`',
      '- replicas planned: ' + String(input.dutyPlan.replicaSlots.length),
      '- energy remaining: ' + String(input.dutyPlan.energyRemaining) + ' / ' + String(input.dutyPlan.energyBudgetTotal),
      '- maxDutyCycle: ' + String(input.dutyPlan.maxDutyCycle),
      '- hardCap: ' + String(input.dutyPlan.replicaHardCap),
      '',
    );
  }
  if (input.architecture) {
    lines.push('## Architecture Reader (embedded)', '', input.architecture.markdown, '');
  }
  if (input.council) {
    lines.push('## Adaptive Council UX (embedded)', '', input.council.markdown, '');
  }
  const md = lines.join('\n');
  assertEthicsSafeCopy(md, '12d08 consumer markdown');
  return md;
}

function renderConsumerHtml(input: {
  architecture: ArchitectureReaderView | null;
  council: CouncilQueueUxView | null;
  dutyPlan: RosterDutyCyclePlan | null;
  ethicsNotice: string;
  mobileReady: MobileReadyConsumerPayload;
}): string {
  const card = input.mobileReady.architectureCard;
  const councilRows = input.mobileReady.councilTop
    .map(
      (r) =>
        '<tr><td>' +
        String(r.priorityRank) +
        '</td><td>' +
        escapeHtml(r.title) +
        '</td><td>' +
        String(r.composite) +
        '</td><td>' +
        escapeHtml(r.waitingProviders.join(', ') || '—') +
        '</td></tr>',
    )
    .join('');
  const duty = input.dutyPlan;
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    '<title>XIV Command Center Consumer (12D-08)</title>',
    '<style>',
    'body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;line-height:1.45;color:#122}',
    'h1,h2{color:#0b3d5c} table{border-collapse:collapse;width:100%;margin:0.75rem 0}',
    'th,td{border:1px solid #bcd;padding:0.4rem 0.6rem;text-align:left}',
    'th{background:#e8f2f8} .banner{background:#fff6e0;border:1px solid #e0c56a;padding:0.6rem 0.8rem;border-radius:6px}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem}',
    '.card{border:1px solid #bcd;border-radius:8px;padding:0.75rem;background:#f7fbfe}',
    'code{background:#f0f4f8;padding:0.1rem 0.3rem;border-radius:3px}',
    '</style></head><body>',
    '<p class="banner"><strong>READ ONLY</strong> — 12D-08 Command Center / mobile consumer preview. Never auto-applies production. Product-lane RN wire = follow-up.</p>',
    '<h1>XIV Command Center Consumer</h1>',
    '<p>' + escapeHtml(input.ethicsNotice) + '</p>',
    '<h2>Architecture card</h2>',
    card
      ? [
          '<div class="grid">',
          '<div class="card"><strong>Universe</strong><br/><code>' + escapeHtml(card.universeId) + '</code></div>',
          '<div class="card"><strong>Layer</strong><br/><code>SIMULATION</code></div>',
          '<div class="card"><strong>Companies</strong><br/>' + String(card.companyCount) + '</div>',
          '<div class="card"><strong>Agents</strong><br/>' + String(card.agentPopulationTotal) + '</div>',
          '<div class="card"><strong>City ladder</strong><br/>' + escapeHtml(card.cityLadder) + '</div>',
          '<div class="card"><strong>Fingerprint</strong><br/><code>' + escapeHtml(card.fingerprint) + '</code></div>',
          '</div>',
        ].join('\n')
      : '<p>(no architecture view)</p>',
    '<h2>Council top ranks</h2>',
    councilRows
      ? '<table><thead><tr><th>Rank</th><th>Story</th><th>Composite</th><th>Waiting</th></tr></thead><tbody>' +
        councilRows +
        '</tbody></table>'
      : '<p>(no council view)</p>',
    '<h2>Roster duty-cycle (stub)</h2>',
    duty
      ? '<ul><li>cycleId: <code>' +
        escapeHtml(duty.cycleId) +
        '</code></li><li>slots: ' +
        String(duty.replicaSlots.length) +
        '</li><li>energy: ' +
        String(duty.energyRemaining) +
        ' / ' +
        String(duty.energyBudgetTotal) +
        '</li><li>maxDuty: ' +
        String(duty.maxDutyCycle) +
        '</li><li>hardCap: ' +
        String(duty.replicaHardCap) +
        '</li></ul>'
      : '<p>(no duty plan)</p>',
    '<h2>Banners</h2>',
    '<ul>' + input.mobileReady.banners.map((b) => '<li>' + escapeHtml(b) + '</li>').join('') + '</ul>',
    '</body></html>',
  ].join('\n');
  assertEthicsSafeCopy(html, '12d08 consumer html');
  return html;
}

/**
 * Build a thin Command Center / mobile-ready consumer bundle from 12D-07 views.
 * Prefer passing pre-built views for isomorphic call sites that already hold payloads.
 */
export function buildArchitectureReaderConsumer(input: {
  architectureView?: ArchitectureReaderView | null;
  architectureSummary?: ArchitectureReaderSummary | null;
  councilView?: CouncilQueueUxView | null;
  councilSummary?: CouncilQueueUxSummary | null;
  roster?: FounderTwinRoster | null;
  dutyPlan?: RosterDutyCyclePlan | null;
  councilPreviewLimit?: number;
}): CommandCenterConsumerBundle {
  assertConsumerGuardrails();
  const architecture = resolveArchitectureView(input);
  const council = resolveCouncilView(input);
  const dutyPlan =
    input.dutyPlan ?? (input.roster ? planRosterDutyCycle(input.roster) : null);

  const ethicsNotice =
    'Command Center consumer is READ ONLY over SIMULATION layers. Twin roster uses digital replicas only (CAP ' +
    String(FOUNDER_TWIN_REPLICA_HARD_CAP) +
    ', maxDuty ' +
    String(FOUNDER_TWIN_MAX_DUTY_CYCLE) +
    '). No bio cloning; wormholes are sparse SIMULATION pathways. Never auto-apply production.';
  assertEthicsSafeCopy(ethicsNotice, '12d08 consumer ethicsNotice');

  const twinSummary = input.roster ? summarizeFounderTwinRoster(input.roster) : null;
  const mobileReady: MobileReadyConsumerPayload = {
    architectureCard: architecture ? toArchitectureCard(architecture) : null,
    councilTop: council ? toCouncilPreview(council, input.councilPreviewLimit ?? 8) : [],
    councilProviderHonesty: council
      ? council.summary.providerStatuses.map((s) => s.agent + ':' + s.status)
      : [],
    dutyCycleStatus: twinSummary
      ? {
          replicaCount: twinSummary.replicaCount,
          hardCap: twinSummary.hardCap,
          energyRemaining: twinSummary.energyBudgetRemaining,
          energyBudgetTotal: twinSummary.energyBudgetTotal,
          maxDutyCycle: twinSummary.maxDutyCycle,
          sparsePathwayCount: twinSummary.sparsePathwayCount,
          bioCloningAllowed: false,
          wormholesAreSparseSimulationPathwaysOnly: true,
        }
      : dutyPlan
        ? {
            replicaCount: dutyPlan.replicaSlots.length,
            hardCap: dutyPlan.replicaHardCap,
            energyRemaining: dutyPlan.energyRemaining,
            energyBudgetTotal: dutyPlan.energyBudgetTotal,
            maxDutyCycle: dutyPlan.maxDutyCycle,
            sparsePathwayCount: 0,
            bioCloningAllowed: false,
            wormholesAreSparseSimulationPathwaysOnly: true,
          }
        : null,
    banners: [
      'READ ONLY',
      'productionAutoApply=false',
      'layerKind=SIMULATION',
      'productLaneMobileWire=FOLLOW_UP',
    ],
  };

  const markdown = renderConsumerMarkdown({ architecture, council, dutyPlan, ethicsNotice, mobileReady });
  const html = renderConsumerHtml({ architecture, council, dutyPlan, ethicsNotice, mobileReady });
  const payload = {
    readOnly: true as const,
    productionAutoApply: false as const,
    layerKind: 'SIMULATION' as const,
    ethicsNotice,
    mobileReady,
    dutyPlan,
    architectureSummary: architecture?.summary ?? null,
    councilSummary: council?.summary ?? null,
    guardrails: ARCH_READER_CONSUMER_GUARDRAILS,
  };
  const json = JSON.stringify(payload, null, 2);
  assertEthicsSafeCopy(json, '12d08 consumer json');

  return {
    title: 'XIV Command Center Consumer — Architecture Reader + Council (12D-08)',
    architecture,
    council,
    dutyPlan,
    mobileReady,
    markdown,
    html,
    json,
    readOnly: true,
    productionAutoApply: false,
    layerKind: 'SIMULATION',
    ethicsNotice,
    guardrails: ARCH_READER_CONSUMER_GUARDRAILS,
    productLaneFollowUp:
      'Wire apps/mobile command-center + council screens in product lane (xiv-ai) to import buildArchitectureReaderConsumer / mobileReady payload. This worktree ships portable TS + HTML preview only.',
  };
}

/** Convenience: consumer from architecture summary alone (council/roster optional). */
export function buildCommandCenterArchConsumer(
  architectureSummary: ArchitectureReaderSummary,
  extras?: {
    councilSummary?: CouncilQueueUxSummary | null;
    roster?: FounderTwinRoster | null;
  },
): CommandCenterConsumerBundle {
  return buildArchitectureReaderConsumer({
    architectureSummary,
    councilSummary: extras?.councilSummary ?? null,
    roster: extras?.roster ?? null,
  });
}

