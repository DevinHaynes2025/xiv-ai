import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { PROTOTYPE_BUSINESS_CASES, type BusinessCase } from '../../../../../services/ai/runtime/cases';

const DISCOVER = ['global', 'africa', 'china', 'usa', 'industry', 'supply chain', 'operations', 'security', 'finance', 'innovation'] as const;

function matchesDiscover(item: BusinessCase, facet: string) {
  if (facet === 'global') return true;
  if (facet === 'africa') return item.countries.some((code) => ['DZ', 'EG', 'NG', 'KE', 'ZA', 'GH'].includes(code));
  if (facet === 'china') return item.countries.includes('CN');
  if (facet === 'usa') return item.countries.includes('US');
  if (facet === 'industry') return Boolean(item.industry);
  if (facet === 'supply chain') return item.businessHealthDomains.includes('supply_chain');
  if (facet === 'operations') return item.businessHealthDomains.includes('operations');
  if (facet === 'security') return item.businessHealthDomains.includes('security');
  if (facet === 'finance') return item.businessHealthDomains.includes('finance');
  if (facet === 'innovation') return item.businessHealthDomains.includes('innovation');
  return true;
}

export function BusinessCasesScreen() {
  const [facet, setFacet] = useState<(typeof DISCOVER)[number]>('global');
  const cases = PROTOTYPE_BUSINESS_CASES.filter((item) => matchesDiscover(item, facet));

  return (
    <ExperienceScreen title="Business Cases" subtitle="Structured learning. Hypothetical stays hypothetical.">
      <PrototypeNotice text="Only explicit prototype and hypothetical examples are shown. No invented customer incidents." />
      <View style={styles.row}>
        {DISCOVER.map((item) => (
          <Chip key={item} label={item} compact selected={facet === item} onPress={() => setFacet(item)} />
        ))}
      </View>
      <SectionHeader kicker="Cases" title={facet} />
      {cases.length === 0 ? (
        <Card style={styles.card}>
          <XivText variant="subtitle">No cases for this facet</XivText>
          <XivText variant="caption" muted>
            Unavailable data is not fabricated. This filter has no matching prototype example.
          </XivText>
        </Card>
      ) : (
        cases.map((item) => (
          <Card key={item.caseId} style={styles.card}>
            <XivText variant="label" color={item.status === 'hypothetical' ? Palette.warning : Palette.accent}>
              {item.status.split('_').join(' ').toUpperCase()}
            </XivText>
            <XivText variant="subtitle">{item.title}</XivText>
            <XivText variant="caption" dim>
              {item.anonymizedCompany ? 'Anonymized company' : item.companyName}
            </XivText>
            <XivText variant="label">What happened</XivText>
            <XivText variant="caption" muted>
              {item.challenge}
            </XivText>
            <XivText variant="label">Why</XivText>
            <XivText variant="caption" muted>
              {item.rootCauses[0] ?? item.context}
            </XivText>
            <XivText variant="label">Impact</XivText>
            <XivText variant="caption" muted>
              {item.context}
            </XivText>
            <XivText variant="label">Decision</XivText>
            <XivText variant="caption" muted>
              {item.decisions[0] ?? 'No decision recorded.'}
            </XivText>
            <XivText variant="label">Result</XivText>
            <XivText variant="caption" muted>
              {item.outcomes[0] ?? 'Outcome unmeasured.'}
            </XivText>
            <XivText variant="label">Lesson</XivText>
            <XivText variant="caption" muted>
              {item.lessons[0] ?? 'No lesson recorded.'}
            </XivText>
            <XivText variant="label">Sources</XivText>
            <XivText variant="caption" dim>
              {item.sources[0] ?? 'No sources attached.'}
            </XivText>
          </Card>
        ))
      )}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.two,
  },
});
