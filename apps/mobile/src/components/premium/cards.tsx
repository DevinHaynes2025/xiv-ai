import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Spacing } from '@/constants/theme';

import {
  XivCompanyBadge,
  XivConfidenceIndicator,
  XivEvidenceChip,
  XivGlassPanel,
  XivLiveIndicator,
  XivPremiumButton,
  XivStatusPill,
} from './primitives';

type Demo = { demo?: boolean };

export function XivMetricCard({
  title,
  value,
  detail,
  demo = true,
}: { title: string; value: string; detail?: string } & Demo) {
  return (
    <XivGlassPanel style={styles.metric}>
      <XivText variant="caption" muted numberOfLines={1}>
        {title}
      </XivText>
      <XivText variant="title">{value}</XivText>
      {detail ? (
        <XivText variant="caption" dim numberOfLines={2}>
          {detail}
        </XivText>
      ) : null}
      {demo ? <SampleMark text="DEMONSTRATION" /> : null}
    </XivGlassPanel>
  );
}

export function XivStoryCard({
  title,
  happened,
  stance,
  evidence,
  demo = true,
}: { title: string; happened: string; stance: string; evidence: string } & Demo) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={stance} />
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted>
        {happened}
      </XivText>
      <XivEvidenceChip label={evidence} />
      {demo ? <SampleMark text="DEMONSTRATION · NOT LIVE" /> : null}
    </XivGlassPanel>
  );
}

export function XivIntelligenceCard({
  title,
  body,
  source,
  connected,
  confidence,
}: {
  title: string;
  body: string;
  source: string;
  connected: boolean;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
}) {
  return (
    <XivGlassPanel>
      <XivLiveIndicator connected={connected} />
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
      <XivEvidenceChip label={source} />
      <XivConfidenceIndicator confidence={confidence} />
    </XivGlassPanel>
  );
}

export function XivMeetingCard({
  title,
  when,
  mode,
}: {
  title: string;
  when: string;
  mode: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusPill label="Video NOT CONNECTED" tone="warning" />
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="caption" muted>
        {when} · {mode}
      </XivText>
    </XivGlassPanel>
  );
}

export function XivEventCard({ title, when, kind }: { title: string; when: string; kind: string }) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={kind} />
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="caption" muted>
        {when}
      </XivText>
      <SampleMark text="DEMONSTRATION" />
    </XivGlassPanel>
  );
}

export function XivNetworkCard({
  name,
  title,
  reason,
  company,
}: {
  name: string;
  title: string;
  reason: string;
  company?: string;
}) {
  return (
    <XivGlassPanel>
      {company ? <XivCompanyBadge name={company} /> : null}
      <XivText variant="subtitle">{name}</XivText>
      <XivText variant="caption" muted>
        {title}
      </XivText>
      <XivEvidenceChip label={reason} />
    </XivGlassPanel>
  );
}

export function XivAgentCard({
  name,
  role,
  authority,
  status,
  task,
}: {
  name: string;
  role: string;
  authority: string;
  status: string;
  task: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={status} tone="neutral" />
      <XivText variant="subtitle">{name}</XivText>
      <XivText variant="caption" muted>
        {role} · {authority}
      </XivText>
      <XivText variant="body" muted>
        {task}
      </XivText>
    </XivGlassPanel>
  );
}

export function SponsoredCard({
  disclosure,
  headline,
  body,
  children,
}: {
  disclosure: 'Promoted' | 'Sponsored' | 'Advertisement';
  headline: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <XivGlassPanel style={styles.sponsored}>
      <XivStatusPill label={disclosure} tone="sponsored" />
      <XivText variant="subtitle">{headline}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
      {children}
      <XivPremiumButton label="Not organic ranking" />
    </XivGlassPanel>
  );
}

const styles = StyleSheet.create({
  metric: {
    minWidth: 148,
    flexGrow: 1,
  },
  sponsored: {
    borderColor: 'rgba(244, 201, 93, 0.35)',
    backgroundColor: 'rgba(244, 201, 93, 0.06)',
  },
});

export function CardRow({ children }: { children: ReactNode }) {
  return <View style={stylesRow.row}>{children}</View>;
}

const stylesRow = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
