import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { Field } from '@/components/xiv/field';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import {
  composeAudiences,
  composeIndustries,
  composeKinds,
  composeTopics,
} from '@/data/mock';

export function NetworkComposer() {
  const { session } = useSession();
  const [kind, setKind] = useState<(typeof composeKinds)[number]['id']>('text');
  const [audience, setAudience] = useState<(typeof composeAudiences)[number]>('Followers');
  const [industry, setIndustry] = useState<(typeof composeIndustries)[number]>('Technology');
  const [topic, setTopic] = useState<(typeof composeTopics)[number]>('Operations');
  const [company, setCompany] = useState('');
  const [context, setContext] = useState('');
  const [held, setHeld] = useState(false);

  const selected = composeKinds.find((item) => item.id === kind) ?? composeKinds[0];
  const mediaKind = kind === 'video' || kind === 'image';

  return (
    <ExperienceScreen title="Create" subtitle="Compose for the professional floor.">
      <PrototypeNotice text="Composer drafts stay on this device. There is no posts table, media bucket, or publish path in this preview. Nothing is written to Supabase." />
      <SectionHeader kicker="Entry" title="What are you adding?" />
      <View style={styles.wrap}>
        {composeKinds.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            compact
            selected={kind === item.id}
            onPress={() => {
              setKind(item.id);
              setHeld(false);
            }}
          />
        ))}
      </View>
      <XivText variant="body" muted>
        {selected.detail}
      </XivText>

      {mediaKind ? (
        <EmptyState
          title={kind === 'video' ? 'Video prototype only' : 'Image prototype only'}
          body="Media upload and storage are not connected. A live composer would attach a file here. This preview will not pick, store, or stream media, and it will not pretend a file was uploaded."
          ios={kind === 'video' ? 'video' : 'photo'}
          android={kind === 'video' ? 'videocam' : 'image'}
        />
      ) : null}

      <SectionHeader kicker="Context" title="Where this belongs" />
      <XivText variant="caption" color={Palette.textDim}>
        Audience
      </XivText>
      <View style={styles.wrap}>
        {composeAudiences.map((item) => (
          <Chip key={item} label={item} compact selected={audience === item} onPress={() => setAudience(item)} />
        ))}
      </View>
      <XivText variant="caption" color={Palette.textDim}>
        Industry
      </XivText>
      <View style={styles.wrap}>
        {composeIndustries.map((item) => (
          <Chip key={item} label={item} compact selected={industry === item} onPress={() => setIndustry(item)} />
        ))}
      </View>
      <XivText variant="caption" color={Palette.textDim}>
        Topic
      </XivText>
      <View style={styles.wrap}>
        {composeTopics.map((item) => (
          <Chip key={item} label={item} compact selected={topic === item} onPress={() => setTopic(item)} />
        ))}
      </View>
      <Field
        label="Company"
        placeholder="Optional company context"
        value={company}
        onChangeText={setCompany}
      />
      <Field
        label="Context"
        placeholder="What should the floor see?"
        value={context}
        onChangeText={setContext}
        multiline
        style={styles.context}
      />

      <Button
        label="Hold draft on this device"
        disabled={!context.trim()}
        onPress={() => setHeld(true)}
      />
      {held ? (
        <Card>
          <XivText variant="label" color={Palette.warning}>
            DEMO
          </XivText>
          <XivText variant="subtitle">Draft held locally</XivText>
          <XivText variant="body" muted>
            {session.displayName || 'You'} · {selected.label} · {audience} · {industry} · {topic}
            {company.trim() ? ` · ${company.trim()}` : ''}
          </XivText>
          <XivText variant="body" muted>
            {context.trim()}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            This confirmation is session UI only. Refreshing the screen clears it. No database row was created.
          </XivText>
        </Card>
      ) : null}
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  context: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.three,
  },
});
