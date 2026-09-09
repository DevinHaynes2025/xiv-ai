import { StyleSheet } from 'react-native';

import { Card } from '@/components/xiv/card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { operationsCenterSnapshot } from '../../../../../services/ai/runtime/operations';

export function OperationsCenterScreen() {
  const snapshot = operationsCenterSnapshot();

  return (
    <ExperienceScreen title="Operations Center" subtitle="Developer prototype. Not consumer diagnostics.">
      <PrototypeNotice text="Architecture for 24/7 operations. Production monitoring is NOT CONFIGURED. Billion-user readiness is not claimed." />
      <XivText variant="caption" dim>
        Audience {snapshot.audience}. Consumer exposed {String(snapshot.consumerExposed)}. Persistence {snapshot.tenantPersistence}.
      </XivText>
      <SectionHeader kicker="Sections" title="Platform surfaces" />
      {snapshot.sections.map((section) => (
        <Card key={section} style={styles.card}>
          <XivText variant="subtitle">{section.replaceAll('_', ' ')}</XivText>
          <XivText variant="label" color={Palette.warning}>
            NOT CONFIGURED
          </XivText>
          <XivText variant="caption" muted>
            {section === 'live' ? snapshot.live : 'Scheduled diagnostics are planned. No production 24/7 monitoring is running.'}
          </XivText>
        </Card>
      ))}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
});
