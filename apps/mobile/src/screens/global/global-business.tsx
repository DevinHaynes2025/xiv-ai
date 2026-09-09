import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { COUNTRY_PROFILES, WORLD_REGIONS, type WorldRegion } from '../../../../../services/ai/runtime/global';
import { FEED_TYPES } from '../../../../../services/ai/runtime/realtime';

export function GlobalBusinessScreen() {
  const [region, setRegion] = useState<WorldRegion>('africa');
  const countries = COUNTRY_PROFILES.filter((item) => item.region === region);

  return (
    <ExperienceScreen title="Global Business" subtitle="Region → country → industry. Data-driven.">
      <PrototypeNotice text="Discovery is configuration-backed. No one-screen-per-country UI. Statistics stay NOT CONFIGURED." />
      <View style={styles.row}>
        {WORLD_REGIONS.map((item) => (
          <Chip key={item} label={item.replaceAll('_', ' ')} compact selected={region === item} onPress={() => setRegion(item)} />
        ))}
      </View>
      <SectionHeader kicker="Countries" title={region.replaceAll('_', ' ')} />
      {countries.map((country) => (
        <Card key={country.countryCode} style={styles.card}>
          <XivText variant="subtitle">
            {country.countryName} · {country.countryCode}
          </XivText>
          <XivText variant="label" color={Palette.warning}>
            {country.dataAvailability.split('_').join(' ').toUpperCase()}
          </XivText>
          <XivText variant="caption" muted>
            Industries, companies, events, and opportunities appear only when sourced data exists.
          </XivText>
        </Card>
      ))}
      <SectionHeader kicker="Feed" title="Public intelligence types" />
      {FEED_TYPES.map((type) => (
        <Card key={type} style={styles.card}>
          <XivText variant="subtitle">{type.replaceAll('_', ' ')}</XivText>
          <XivText variant="caption" dim>
            Public external intelligence is separate from private organization intelligence. Provenance required.
          </XivText>
        </Card>
      ))}
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
