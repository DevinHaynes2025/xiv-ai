import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { SystemStatus, type SystemStatusKind } from '@/components/xiv/system-status';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { GuardianHealthReport } from '@/lib/ai';

function overallSurface(status: GuardianHealthReport['overallStatus']): SystemStatusKind {
  if (status === 'healthy') return 'ACTIVE';
  if (status === 'warning' || status === 'critical') return 'NEEDS ATTENTION';
  return 'CONFIGURED';
}

export function GuardianStatusPanel({
  report,
  busy,
  onRun,
}: {
  report: GuardianHealthReport | null;
  busy: boolean;
  onRun: () => void;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.intelligence}>
          Guardian
        </XivText>
        <SystemStatus status={report ? overallSurface(report.overallStatus) : 'CONFIGURED'} />
      </View>
      <XivText variant="caption" color={Palette.accent}>
        Developer validation · On-demand · Not continuous monitoring
      </XivText>
      <XivText variant="caption" muted>
        {report
          ? `${report.summary} Last run ${report.generatedAt}.`
          : 'No validation snapshot in this session. Guardian is not watching in the background.'}
      </XivText>
      {report ? (
        <XivText variant="label" color={Palette.textDim}>
          {report.counts.passed} passed · {report.counts.warning} warning · {report.counts.failed} failed ·{' '}
          {report.counts.unknown} unknown
        </XivText>
      ) : null}
      <Button
        label={busy ? 'Running validation…' : 'Run developer validation'}
        variant="subtle"
        disabled={busy}
        onPress={onRun}
      />
      {report
        ? report.checks.map((check) => (
            <XivText key={String(check.id)} variant="caption" dim>
              {check.name}: {check.status} — {check.message}
            </XivText>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
