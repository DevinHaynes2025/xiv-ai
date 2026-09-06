import { listPersistedAgentActions } from '@/lib/agent-persistence';
import type { SessionSnapshot } from '@/types/session';
import type { AuthorizedSessionRecord } from '../../../../services/ai/runtime/context/adapters';

/**
 * Owner-scoped personal records already readable under existing RLS.
 * Profile company/title are user-declared identity, not organization records.
 * Does not invent ERP/WMS/TMS rows. Missing tables fail closed. No service-role key.
 */
export async function loadAuthorizedSessionRecords(session: SessionSnapshot): Promise<AuthorizedSessionRecord[]> {
  const records: AuthorizedSessionRecord[] = [];
  if (session.userId && session.identitySchemaReady) {
    records.push({
      kind: 'profile_identity',
      ownerId: session.userId,
      scope: 'personal',
      sourceRecordId: session.userId,
      organizationId: null,
      universeId: null,
      company: session.company || null,
      industry: session.industry || null,
      professionalTitle: session.professionalTitle || null,
      sourceUpdatedAt: null,
    });
  }

  const activity = await listPersistedAgentActions();
  if (!activity.error && session.userId) {
    records.push({
      kind: 'agent_activity',
      ownerId: session.userId,
      scope: 'personal',
      sourceRecordId: activity.actions[0]?.id ?? null,
      organizationId: null,
      universeId: null,
      actionCount: activity.actions.length,
      lastActionAt: activity.actions[0]?.created_at ?? null,
      sourceUpdatedAt: activity.actions[0]?.created_at ?? null,
    });
  }

  return records;
}
