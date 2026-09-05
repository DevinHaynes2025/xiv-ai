import { StyleSheet } from 'react-native';

import { Card } from '@/components/xiv/card';
import { ExperienceScreen, ModuleCard } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { businessHealth, businessHealthScore, businessRisks } from '@/data/mock';

export default function ExecutiveHealth() {
  return (
    <ExperienceScreen title="Company health" subtitle="Same synthetic composite as XIV Business.">
      <PrototypeNotice text="Metrics are mock. They are not persisted." />
      <Card accent style={styles.score}>
        <XivText variant="caption" color={Palette.accent}>
          {businessHealthScore.label}
        </XivText>
        <XivText variant="display" color={Palette.success}>
          {businessHealthScore.score}
        </XivText>
        <XivText variant="body" muted>
          {businessHealthScore.detail}
        </XivText>
      </Card>
      <SectionHeader kicker="Composite" title="Where health is made" />
      {businessHealth.map((item) => (
        <ModuleCard
          key={item.id}
          tag={item.tone}
          title={`${item.label} · ${item.value}${item.unit ? ` ${item.unit}` : ''}`}
          body="Shared mock layer with the business owner workspace."
        />
      ))}
      <SectionHeader kicker="Watch" title="Risks" />
      {businessRisks.map((item) => (
        <ModuleCard key={item.id} tag="Risk" title={item.title} body={item.detail} />
      ))}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  score: {
    gap: Spacing.two,
  },
});
