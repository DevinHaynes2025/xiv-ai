import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgentActivityList } from '@/components/agents/agent-activity-list';
import { Chip } from '@/components/xiv/chip';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { useAgent } from '@/hooks/useAgent';
import type { PersistedAgentActionStatus } from '@/lib/ai';

const FILTERS: { id: 'all' | ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'proposed', label: 'Proposed' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

type ActivityFilter = 'proposed' | 'approved' | 'rejected' | 'completed' | 'failed';

function matchesFilter(status: PersistedAgentActionStatus, filter: ActivityFilter) {
  if (filter === 'proposed') return status === 'proposed' || status === 'awaiting_approval';
  if (filter === 'approved') return status === 'approved' || status === 'executing';
  if (filter === 'rejected') return status === 'rejected' || status === 'cancelled';
  return status === filter;
}

export function AgentActivityScreen() {
  const { persistedActions, activityError } = useAgent();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const visible = useMemo(() => {
    if (filter === 'all') return persistedActions;
    return persistedActions.filter((item) => matchesFilter(item.status, filter));
  }, [filter, persistedActions]);

  const select = useCallback((id: (typeof FILTERS)[number]['id']) => setFilter(id), []);

  return (
    <ExperienceScreen title="Agent Activity" subtitle="Governed actions and approvals">
      <PrototypeNotice text="These records are stored for your account. Approvals run a labeled prototype simulation. No production system is changed." />
      <SectionHeader kicker="History" title="Persisted actions" />
      {activityError ? (
        <EmptyState
          title={activityError.kind === 'missing_schema' ? 'Agent tables are not applied' : 'Activity could not load'}
          body={`${activityError.message}${activityError.code ? ` (${activityError.code})` : ''}. ${activityError.hint}`}
          ios="exclamationmark.triangle"
          android="warning"
        />
      ) : (
        <>
          <View style={styles.filters}>
            {FILTERS.map((item) => (
              <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => select(item.id)} />
            ))}
          </View>
          <AgentActivityList actions={visible} />
        </>
      )}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
