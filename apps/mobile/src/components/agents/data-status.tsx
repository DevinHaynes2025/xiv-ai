import { StyleSheet, View } from 'react-native';

import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { BusinessHealthReport, ExecutiveBrief } from '@/lib/ai';

export type DataStatusKind = 'live' | 'prototype' | 'stale' | 'unavailable' | 'not_configured';

export function statusFromReport(report: BusinessHealthReport | null | undefined): DataStatusKind {
  if (!report) return 'prototype';
  if (report.dataStatus === 'live') return 'live';
  if (report.dataStatus === 'stale') return 'stale';
  if (report.dataStatus === 'unavailable' || report.dataStatus === 'not_configured') return report.dataStatus;
  return report.prototype ? 'prototype' : 'unavailable';
}

const LABEL: Record<DataStatusKind, string> = {
  live: 'LIVE DATA',
  prototype: 'PROTOTYPE DATA',
  stale: 'STALE DATA',
  unavailable: 'SOURCE UNAVAILABLE',
  not_configured: 'NOT CONFIGURED',
};

const DETAIL: Record<DataStatusKind, string> = {
  live: 'Authorized live source. Freshness and retrieved time are shown when present.',
  prototype: 'Prototype / sample environment',
  stale: 'Live source responded with stale data. Do not treat this as current.',
  unavailable: 'Live source unavailable',
  not_configured: 'Not configured. No live source is wired for this request.',
};

export function DataStatusMark({
  status,
  source,
  freshness,
  retrievedAt,
}: {
  status: DataStatusKind;
  source?: string;
  freshness?: string;
  retrievedAt?: string;
}) {
  const live = status === 'live';
  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, live ? styles.live : status === 'prototype' ? styles.proto : styles.warn]}>
        <XivText variant="label" color={live ? Palette.success : status === 'prototype' ? Palette.accent : Palette.warning}>
          {LABEL[status]}
        </XivText>
      </View>
      <XivText variant="caption" dim>
        {DETAIL[status]}
      </XivText>
      {live && source ? (
        <XivText variant="caption" muted>
          Source {source}
          {freshness ? ` · freshness ${freshness}` : ''}
          {retrievedAt ? ` · retrieved ${retrievedAt}` : ''}
        </XivText>
      ) : null}
    </View>
  );
}

export function briefStatus(brief: ExecutiveBrief): DataStatusKind {
  if (brief.dataStatus === 'live') return 'live';
  if (brief.dataStatus === 'stale') return 'stale';
  if (brief.dataStatus === 'unavailable' || brief.dataStatus === 'not_configured') return brief.dataStatus;
  return 'prototype';
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  live: {
    borderColor: Palette.success,
  },
  proto: {
    borderColor: Palette.accent,
  },
  warn: {
    borderColor: Palette.warning,
  },
});
