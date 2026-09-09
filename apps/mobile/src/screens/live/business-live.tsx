import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useTenant } from '@/context/tenant';
import {
  LIVE_SURFACES,
  PROTOTYPE_LIVE_ROOMS,
  canHostBusinessLive,
  consumerCanHostBusinessLive,
  liveInfrastructureLabel,
  type LiveSurface,
} from '../../../../../services/ai/runtime/live';

export function BusinessLiveScreen({
  title,
  hostMode = false,
}: {
  title: string;
  hostMode?: boolean;
}) {
  const { session } = useSession();
  const { tenant } = useTenant();
  const [surface, setSurface] = useState<LiveSurface>('live');
  const hosting = canHostBusinessLive({
    experienceRole: session.experience,
    persistenceStatus: tenant.persistenceStatus,
  });
  const showHost = hostMode && !consumerCanHostBusinessLive() && session.experience !== 'consumer';
  const rooms = PROTOTYPE_LIVE_ROOMS.filter((room) => {
    if (surface === 'learning') return room.category === 'training' || room.category === 'education';
    if (surface === 'innovation') return room.category === 'innovation' || room.category === 'product_demo';
    if (surface === 'company') return room.category === 'ceo_update' || room.category === 'town_hall';
    return true;
  });

  return (
    <ExperienceScreen title={title} subtitle="Business-only live. Not entertainment streaming.">
      <PrototypeNotice text={`${liveInfrastructureLabel()}. No live video, viewer counts, or recordings are attached.`} />
      <XivText variant="caption" dim>
        Persistence is {tenant.persistenceStatus}. Private organization and Universe rooms stay blocked while the hosted
        organizations collision remains.
      </XivText>
      <View style={styles.row}>
        {LIVE_SURFACES.map((item) => (
          <Chip key={item} label={item} compact selected={surface === item} onPress={() => setSurface(item)} />
        ))}
      </View>
      <SectionHeader kicker="Catalog" title="Business rooms" />
      {rooms.map((room) => (
        <Card key={room.streamId} style={styles.card}>
          <XivText variant="label" color={Palette.warning}>
            {room.status.split('_').join(' ').toUpperCase()}
          </XivText>
          <XivText variant="subtitle">{room.title}</XivText>
          <XivText variant="caption" muted>
            {room.description}
          </XivText>
          <XivText variant="caption" dim>
            Visibility {room.visibility} · classification {room.dataClassification}. Viewer count is not shown because
            delivery is not configured.
          </XivText>
        </Card>
      ))}
      {showHost ? (
        <Card style={styles.card}>
          <XivText variant="label" color={Palette.accent}>
            Host
          </XivText>
          <XivText variant="subtitle">{session.experience === 'executive' ? 'Start a chair broadcast' : 'Schedule a company update'}</XivText>
          <XivText variant="caption" muted>
            {hosting.reason} Consumers never receive a Go Live control. Start and schedule stay disabled.
          </XivText>
          <Button label="Start broadcast" variant="subtle" disabled />
          <Button label="Schedule update" variant="subtle" disabled />
        </Card>
      ) : (
        <XivText variant="caption" dim>
          Watch-only on this surface. Only authorized business representatives can host, and hosting remains NOT
          CONFIGURED.
        </XivText>
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
