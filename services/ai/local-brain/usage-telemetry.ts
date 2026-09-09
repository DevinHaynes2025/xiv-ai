import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type UsageEvent = {
  id: string;
  tenantId: string;
  universeId: string;
  packageId: string;
  action: 'install' | 'activate' | 'share' | 'export' | 'health' | 'rollback' | 'quarantine' | 'denied';
  summary: string;
  containsSecrets: false;
  productionAnalytics: false;
  createdAt: string;
};

type TelemetryStore = { events: UsageEvent[] };

function storePath(root: string) {
  return xivLocalPath(root, 'package-usage-telemetry.json');
}

export async function recordUsage(input: {
  tenantId: string;
  universeId: string;
  packageId: string;
  action: UsageEvent['action'];
  summary: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<TelemetryStore>(storePath(root), { events: [] });
  const events = Array.isArray(store.events) ? store.events : [];
  const event: UsageEvent = {
    id: `use_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    packageId: input.packageId,
    action: input.action,
    summary: input.summary.slice(0, 2_000),
    containsSecrets: false,
    productionAnalytics: false,
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  await writeJsonFileAtomic(storePath(root), { events: events.slice(-10_000) });
  return event;
}

export async function listUsage(input: {
  tenantId: string;
  universeId: string;
  packageId?: string;
  root?: string;
}) {
  const store = await readJsonFile<TelemetryStore>(storePath(input.root ?? process.cwd()), { events: [] });
  const events = Array.isArray(store.events) ? store.events : [];
  return events.filter(
    (event) =>
      event.tenantId === input.tenantId &&
      event.universeId === input.universeId &&
      (!input.packageId || event.packageId === input.packageId),
  );
}

export async function usageStats(root = process.cwd()) {
  const store = await readJsonFile<TelemetryStore>(storePath(root), { events: [] });
  const events = Array.isArray(store.events) ? store.events : [];
  return {
    events: events.length,
    containsSecrets: false as const,
    productionAnalytics: false as const,
  };
}
