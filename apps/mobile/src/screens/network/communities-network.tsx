import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SampleMark } from '@/components/xiv/sample-mark';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { professionalCommunities } from '@/data/mock';

export function CommunitiesNetwork() {
  const [joined, setJoined] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  return (
    <ExperienceScreen title="Communities" subtitle="Closed professional circles, not public forums.">
      <PrototypeNotice text="Membership, rosters, and threads are DEMO. Joining a circle stays on this device and does not write to Supabase." />
      <SectionHeader kicker="XIV circles" title="Where operators gather" />
      {note ? <EmptyState title="Preview only" body={note} ios="info.circle" android="info" /> : null}
      {professionalCommunities.map((item) => {
        const member = joined.includes(item.id);
        return (
          <Card key={item.id} variant="elevated" style={styles.card}>
            <View style={styles.head}>
              <XivText variant="label" color={Palette.accent}>
                {item.focus}
              </XivText>
              <SampleMark text="DEMO" />
            </View>
            <XivText variant="subtitle">{item.name}</XivText>
            <XivText variant="body" muted>
              {item.detail}
            </XivText>
            <XivText variant="caption" color={Palette.textDim}>
              {item.members} members in this preview roster. Count is invented for the walkthrough.
            </XivText>
            <View style={styles.actions}>
              <Button
                label={member ? 'In circle' : 'Request seat'}
                variant={member ? 'secondary' : 'primary'}
                onPress={() =>
                  setJoined((current) =>
                    current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id],
                  )
                }
                style={styles.action}
              />
              <Button
                label="Open"
                variant="subtle"
                onPress={() =>
                  setNote(`${item.name} has no live room. Threads and membership are not connected.`)
                }
                style={styles.action}
              />
            </View>
          </Card>
        );
      })}
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  action: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
});
