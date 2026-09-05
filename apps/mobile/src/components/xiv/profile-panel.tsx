import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Avatar } from '@/components/xiv/avatar';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { experiences, interests as interestCatalog } from '@/data/mock';
import { anonymousAlias } from '@/lib/anonymous-alias';

const earth = require('../../../assets/images/cinematic/earth-night.png');

type Props = {
  mode: 'named' | 'anonymous';
};

export function ProfilePanel({ mode }: Props) {
  const router = useRouter();
  const { session, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const role = experiences.find((item) => item.id === session.experience);
  const selectedInterests = session.interests
    .map((id) => interestCatalog.find((item) => item.id === id)?.label ?? id)
    .filter(Boolean);

  const leave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      router.replace('/welcome' as Href);
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'anonymous') {
    return (
      <ExperienceScreen title="Profile" subtitle="Identity is held apart from this floor.">
        <PrototypeNotice text="Anonymous employee identity is a prototype. Organization membership and protected identity architecture are not complete. This alias is derived on-device and is not a production identity." />
        <SectionHeader kicker="Alias" title="How you appear here" />
        <Card style={styles.identity}>
          <Avatar name={anonymousAlias(session.userId)} size={56} />
          <View style={styles.copy}>
            <XivText variant="subtitle">{anonymousAlias(session.userId)}</XivText>
            <XivText variant="body" muted>
              Your legal name, email, and profile are not shown on employee surfaces.
            </XivText>
          </View>
        </Card>
        <Card>
          <XivText variant="label" color={Palette.accent}>
            Role
          </XivText>
          <XivText variant="subtitle">{role?.title ?? 'Anonymous Employee'}</XivText>
          <XivText variant="body" muted>
            Role is stored on your account. It is not displayed as a personal profile on the floor.
          </XivText>
        </Card>
        <Button label="Switch experience" variant="subtle" onPress={() => router.replace('/experience')} />
        <Button label={busy ? 'Signing out…' : 'Sign out'} variant="subtle" disabled={busy} onPress={() => void leave()} />
      </ExperienceScreen>
    );
  }

  return (
    <ExperienceScreen title="Profile" subtitle="Your identity in this workspace." atmosphere="cinematic">
      <Card padded={false} variant="hero" style={styles.hero}>
        <Image source={earth} style={styles.heroPhoto} contentFit="cover" />
        <View style={styles.heroWash} />
        <View style={styles.heroBody}>
          <Avatar name={session.displayName || session.email} uri={session.avatarUrl || null} size={88} />
          <XivText variant="title">{session.displayName || 'Profile name pending'}</XivText>
          <XivText variant="body">
            {session.professionalTitle || role?.title || 'Professional title not saved yet'}
          </XivText>
          <XivText variant="caption" color={Palette.textMuted}>
            {[session.company, session.industry, session.location || session.country].filter(Boolean).join(' · ') ||
              'Company and location are stored when the identity migration is applied.'}
          </XivText>
        </View>
      </Card>
      <Button label="Edit Profile" onPress={() => router.push('/edit-profile' as Href)} />

      <SectionHeader kicker="Who you are" title="Identity from your account" />
      <Card>
        <XivText variant="body" muted>
          Name, email, region, and role are restored from Supabase. Title, company, industry, location, expertise,
          and photo use the identity migration when it is applied. No biography, trust score, or reputation number is
          invented.
        </XivText>
        {session.expertise ? (
          <XivText variant="caption" color={Palette.accent}>
            Expertise · {session.expertise}
          </XivText>
        ) : null}
        {!session.identitySchemaReady ? (
          <XivText variant="caption" color={Palette.warning}>
            Professional fields and private avatar storage are waiting on the founder SQL migration.
          </XivText>
        ) : null}
      </Card>

      <SectionHeader kicker="What you know" title="Interests you saved" />
      <View style={styles.chips}>
        {selectedInterests.length ? (
          selectedInterests.map((label) => <Chip key={label} label={label} selected />)
        ) : (
          <XivText variant="body" muted>
            None saved yet. Interests are stored in your account, not in the mock feed.
          </XivText>
        )}
      </View>

      <SectionHeader kicker="What you build" title="Projects and portfolio" />
      <Card>
        <XivText variant="label" color={Palette.warning}>
          DEMO
        </XivText>
        <XivText variant="subtitle">No projects connected</XivText>
        <XivText variant="body" muted>
          Portfolio publishing is not live. This block stays empty until a project record exists on your account.
        </XivText>
      </Card>

      <SectionHeader kicker="What you contribute" title="Community and network" />
      <Card>
        <XivText variant="label" color={Palette.warning}>
          DEMO
        </XivText>
        <XivText variant="subtitle">Contribution is a preview</XivText>
        <XivText variant="body" muted>
          Circle membership and contribution history are not connected. No reputation score is calculated.
        </XivText>
      </Card>

      <Button label="Switch experience" variant="subtle" onPress={() => router.replace('/experience')} />
      <Button label={busy ? 'Signing out…' : 'Sign out'} variant="subtle" disabled={busy} onPress={() => void leave()} />
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  hero: {
    gap: 0,
  },
  heroPhoto: {
    height: 132,
    width: '100%',
  },
  heroWash: {
    ...StyleSheet.absoluteFill,
    height: 132,
    backgroundColor: 'rgba(1, 24, 39, 0.45)',
  },
  heroBody: {
    marginTop: -44,
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
