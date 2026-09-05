import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { Card } from '@/components/xiv/card';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SampleMark } from '@/components/xiv/sample-mark';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { consumerInbox } from '@/data/mock';
import { StyleSheet, View } from 'react-native';

export default function ConsumerInbox() {
  return (
    <ExperienceScreen title="Messages" subtitle="Invites and circle notes. Mock only.">
      <PrototypeNotice text="Inbox is a DEMO surface. There is no live messaging service, and nothing here is delivered." />
      <SectionHeader kicker="Held" title="For this preview seat" />
      {consumerInbox.map((item) => (
        <Card key={item.id} variant="elevated" style={styles.card}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.accent}>
              {item.from}
            </XivText>
            <SampleMark text="DEMO" />
          </View>
          <XivText variant="subtitle">{item.title}</XivText>
          <XivText variant="body" muted>
            {item.body}
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
