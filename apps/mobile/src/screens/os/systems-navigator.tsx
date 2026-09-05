import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { systemLinks } from '@/data/operating-system';

export function SystemsNavigator() {
  return (
    <ExperienceScreen title="Systems" subtitle="What is actually connected.">
      <PrototypeNotice text="ERP, CRM, WMS, and document systems are NOT CONNECTED. XIV does not store connector credentials on this device." />
      <SectionHeader kicker="Company universe" title="Connected systems" />
      {systemLinks.map((item) => (
        <Card key={item.id} style={styles.card}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.accent}>
              {item.domain}
            </XivText>
            <XivText variant="label" color={Palette.warning}>
              {item.status}
            </XivText>
          </View>
          <XivText variant="subtitle">{item.name}</XivText>
          <XivText variant="caption" muted>
            Freshness · {item.freshness}
          </XivText>
          <XivText variant="caption" muted>
            Agent access · {item.access}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            Permissions stay tenant-scoped. No live ingest.
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
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
