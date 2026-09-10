import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { XivStatusPill } from '@/components/premium';
import { Card } from '@/components/xiv/card';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import {
  APPROVAL_AUDIT_POLICY,
  listApprovalAuditTrail,
  type AgentApproval,
  type AgentIntentLog,
} from '@/lib/ai';
import {
  listPersistedApprovals,
  listPersistedAuditEvents,
  type AgentActivityLoadError,
  type PersistedAgentApproval,
  type PersistedAgentAuditEvent,
} from '@/lib/agent-persistence';

/**
 * US-AGT-02 — approval history + audit trail near Scenario Lab / approval panel.
 * Session memory + governed store always; durable DB via ai_agent_approvals / audit_events.
 * Honest WAITING_DATA when DB unavailable. L4 false.
 */
export function ApprovalAuditPanel({
  approvals = [],
  intents = [],
}: {
  approvals?: AgentApproval[];
  intents?: AgentIntentLog[];
}) {
  const sessionTrail = useMemo(
    () => listApprovalAuditTrail({ approvals, intents }),
    [approvals, intents],
  );

  const [persistedApprovals, setPersistedApprovals] = useState<PersistedAgentApproval[]>([]);
  const [persistedEvents, setPersistedEvents] = useState<PersistedAgentAuditEvent[]>([]);
  const [dbStatus, setDbStatus] = useState<'READY' | 'WAITING_DATA'>('WAITING_DATA');
  const [dbError, setDbError] = useState<AgentActivityLoadError | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listPersistedApprovals(), listPersistedAuditEvents()]).then(
      ([approvalResult, auditResult]) => {
        if (cancelled) return;
        setPersistedApprovals(approvalResult.approvals);
        setPersistedEvents(
          auditResult.events.filter((event) => event.event_type === 'approve' || event.event_type === 'reject'),
        );
        const waiting =
          approvalResult.status === 'WAITING_DATA' || auditResult.status === 'WAITING_DATA';
        setDbStatus(waiting ? 'WAITING_DATA' : 'READY');
        setDbError(approvalResult.error ?? auditResult.error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [approvals.length, intents.length]);

  const gate =
    dbStatus === 'WAITING_DATA' && sessionTrail.sessionApprovals.length === 0
      ? 'WAITING_DATA'
      : sessionTrail.status === 'WAITING_DATA' && dbStatus === 'WAITING_DATA'
        ? 'WAITING_DATA'
        : 'READY';

  return (
    <Card style={styles.card}>
      <SectionHeader kicker="US-AGT-02" title="Approval + audit trail" />
      <XivStatusPill label="L4 autonomy: false" tone="warning" />
      <XivStatusPill label={APPROVAL_AUDIT_POLICY.label} tone="warning" />
      <XivStatusPill
        label={`Durable DB: ${dbStatus}`}
        tone={dbStatus === 'READY' ? 'success' : 'warning'}
      />
      <XivStatusPill label={`Gate: ${gate}`} tone={gate === 'READY' ? 'success' : 'warning'} />

      <XivText variant="caption" muted>
        Approve/deny from Scenario Lab writes session approvals, governed memory events, and (when bound)
        ai_agent_approvals + ai_agent_audit_events. Production writes stay blocked without approval — and
        approval still does not authorize production mutation here.
      </XivText>

      {dbStatus === 'WAITING_DATA' ? (
        <XivText variant="caption" color={Palette.warning}>
          WAITING_DATA — durable ai_agent_approvals / ai_agent_audit_events unavailable
          {dbError ? ` (${dbError.kind}: ${dbError.code})` : ''}. Showing in-memory session trail only.
          {dbError?.hint ? ` ${dbError.hint}` : ''}
        </XivText>
      ) : null}

      <XivText variant="label" color={Palette.accent}>
        Session decisions
      </XivText>
      {sessionTrail.sessionApprovals.length === 0 ? (
        <XivText variant="caption" dim>
          No approve/deny decisions in this session yet.
        </XivText>
      ) : (
        sessionTrail.sessionApprovals
          .slice()
          .reverse()
          .slice(0, 8)
          .map((item) => (
            <View key={item.id} style={styles.row}>
              <XivText variant="caption" color={Palette.text}>
                {item.decision} · {item.agentType}
              </XivText>
              <XivText variant="label" color={Palette.textDim}>
                {item.decidedAt}
              </XivText>
              <XivText variant="caption" muted numberOfLines={2}>
                {item.note} · action {item.actionId.slice(0, 8)}
              </XivText>
            </View>
          ))
      )}

      <XivText variant="label" color={Palette.accent}>
        Session audit events (approve/reject)
      </XivText>
      {sessionTrail.sessionDecisionEvents.length === 0 ? (
        <XivText variant="caption" dim>
          No approve/reject intent logs yet.
        </XivText>
      ) : (
        sessionTrail.sessionDecisionEvents
          .slice()
          .reverse()
          .slice(0, 8)
          .map((item) => (
            <View key={item.id} style={styles.row}>
              <XivText variant="caption" color={Palette.text}>
                {item.kind}
                {item.toolId ? ` · ${item.toolId}` : ''}
              </XivText>
              <XivText variant="label" color={Palette.textDim}>
                {item.at}
              </XivText>
              <XivText variant="caption" muted numberOfLines={2}>
                {item.note}
              </XivText>
            </View>
          ))
      )}

      {dbStatus === 'READY' ? (
        <>
          <XivText variant="label" color={Palette.accent}>
            Durable approvals (ai_agent_approvals)
          </XivText>
          {persistedApprovals.length === 0 ? (
            <XivText variant="caption" dim>
              Tables reachable. No durable approval rows for this user yet.
            </XivText>
          ) : (
            persistedApprovals.slice(0, 6).map((item) => (
              <View key={item.id} style={styles.row}>
                <XivText variant="caption" color={Palette.text}>
                  {item.decision}
                </XivText>
                <XivText variant="label" color={Palette.textDim}>
                  {item.created_at}
                </XivText>
                <XivText variant="caption" muted numberOfLines={2}>
                  {item.decision_note ?? '—'} · action {item.action_id.slice(0, 8)}
                </XivText>
              </View>
            ))
          )}

          <XivText variant="label" color={Palette.accent}>
            Durable audit (ai_agent_audit_events)
          </XivText>
          {persistedEvents.length === 0 ? (
            <XivText variant="caption" dim>
              No durable approve/reject audit events for this user yet.
            </XivText>
          ) : (
            persistedEvents.slice(0, 6).map((item) => (
              <View key={item.id} style={styles.row}>
                <XivText variant="caption" color={Palette.text}>
                  {item.event_type}
                </XivText>
                <XivText variant="label" color={Palette.textDim}>
                  {item.created_at}
                </XivText>
              </View>
            ))
          )}
        </>
      ) : null}

      <XivText variant="micro" dim>
        {sessionTrail.note}
      </XivText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  row: {
    gap: 2,
    paddingVertical: Spacing.one,
  },
});
