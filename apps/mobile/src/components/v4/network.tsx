import { View } from 'react-native';

import { XivGlassPanel, XivStatusPill } from '@/components/premium';
import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import type { DataSurfaceState } from '@/lib/surface-state';

import { XivStatusIndicator } from './story';

export function ExpertiseTag({ label }: { label: string }) {
  return <XivStatusPill label={label} tone="neutral" />;
}

export function ContributionSignal({ text }: { text: string }) {
  return (
    <XivText variant="body" muted>
      Contribution: {text}
    </XivText>
  );
}

export function MutualContext({ text }: { text: string }) {
  return (
    <XivText variant="metadata" dim>
      Mutual context: {text}
    </XivText>
  );
}

export function NetworkActivityCard({
  title,
  body,
  state,
}: {
  title: string;
  body: string;
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="card">{title}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
    </XivGlassPanel>
  );
}

export function IntroductionCard({
  from,
  to,
  reason,
  state,
}: {
  from: string;
  to: string;
  reason: string;
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel accessibilityLabel={`Introduction ${from} to ${to}`}>
      <XivStatusIndicator state={state} />
      <XivText variant="card">
        {from} → {to}
      </XivText>
      <XivText variant="body" muted>
        {reason}
      </XivText>
      <XivText variant="micro" dim>
        Introduction is a request, not a follower graph.
      </XivText>
      {state === 'DEMO' ? <SampleMark text="DEMONSTRATION · NOT PRODUCTION" /> : null}
    </XivGlassPanel>
  );
}

export function RecommendedRelationship({
  name,
  why,
  state,
}: {
  name: string;
  why: string;
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="card">{name}</XivText>
      <XivText variant="body" muted>
        {why}
      </XivText>
      <XivText variant="micro" dim>
        Recommended around a declared problem. Not entertainment ranking.
      </XivText>
    </XivGlassPanel>
  );
}

export function ProfessionalProfileCard({
  legalName,
  expertise,
  problemsSolved,
  industries,
  projects,
  contributions,
  businessInterests,
  collaborationInterests,
  state,
}: {
  legalName: string;
  expertise: readonly string[];
  problemsSolved: readonly string[];
  industries: readonly string[];
  projects: readonly string[];
  contributions: readonly string[];
  businessInterests: readonly string[];
  collaborationInterests: readonly string[];
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel accessibilityLabel={`Professional profile ${legalName}`}>
      <XivStatusIndicator state={state} />
      <XivText variant="pageTitle">{legalName}</XivText>
      <XivText variant="micro" dim>
        No follower count. No vanity metrics.
      </XivText>
      <XivText variant="label" color={Palette.accent}>
        Expertise
      </XivText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one }}>
        {expertise.map((item) => (
          <ExpertiseTag key={item} label={item} />
        ))}
      </View>
      <XivText variant="label" color={Palette.accent}>
        Problems solved
      </XivText>
      <XivText variant="body" muted>
        {problemsSolved.join(' · ')}
      </XivText>
      <XivText variant="label" color={Palette.accent}>
        Industries
      </XivText>
      <XivText variant="body" muted>
        {industries.join(' · ')}
      </XivText>
      <XivText variant="label" color={Palette.accent}>
        Projects
      </XivText>
      <XivText variant="body" muted>
        {projects.join(' · ')}
      </XivText>
      {contributions.map((item) => (
        <ContributionSignal key={item} text={item} />
      ))}
      <XivText variant="label" color={Palette.accent}>
        Business interests
      </XivText>
      <XivText variant="body" muted>
        {businessInterests.join(' · ')}
      </XivText>
      <XivText variant="label" color={Palette.accent}>
        Collaboration
      </XivText>
      <XivText variant="body" muted>
        {collaborationInterests.join(' · ')}
      </XivText>
      {state === 'DEMO' ? <SampleMark text="DEMONSTRATION PROFILE" /> : null}
    </XivGlassPanel>
  );
}

export function CompanyProfileCard({
  legalName,
  industry,
  note,
  state,
}: {
  legalName: string;
  industry: string;
  note: string;
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel accessibilityLabel={`Company profile ${legalName}`}>
      <XivStatusIndicator state={state} />
      <XivText variant="pageTitle">{legalName}</XivText>
      <XivText variant="metadata" muted>
        {industry}
      </XivText>
      <XivText variant="body" muted>
        {note}
      </XivText>
      {state === 'DEMO' ? <SampleMark text="DEMONSTRATION COMPANY SURFACE" /> : null}
    </XivGlassPanel>
  );
}
