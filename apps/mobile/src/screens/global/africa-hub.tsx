import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import {
  AFRICAN_SUBREGIONS,
  africaIsNotOneMarket,
  africanCountryProfiles,
  regionalProfile,
} from '../../../../../services/ai/runtime/global';
import { PROTOTYPE_BUSINESS_CASES } from '../../../../../services/ai/runtime/cases';

export function AfricaHubScreen() {
  const countries = africanCountryProfiles();
  const market = africaIsNotOneMarket();
  const africaCases = PROTOTYPE_BUSINESS_CASES.filter((item) => item.countries.some((code) => countries.some((country) => country.countryCode === code)));

  return (
    <ExperienceScreen title="Africa Business" subtitle="Country-level context. Not one market.">
      <PrototypeNotice text="Country configuration is present. Statistics, companies, and trade volumes are NOT CONFIGURED and are not invented." />
      <XivText variant="caption" dim>
        Regional grouping is discovery-only. Shared legal regime: {String(market.sharedRulesForEveryCountry)}.
      </XivText>
      <SectionHeader kicker="Regions" title="African subregions" />
      <View style={styles.row}>
        {AFRICAN_SUBREGIONS.map((region) => {
          const profile = regionalProfile('africa', region);
          return <Chip key={region} label={`${region.replaceAll('_', ' ')} · ${profile.countryCodes.length}`} compact />;
        })}
      </View>
      <SectionHeader kicker="Countries" title={`${countries.length} configured`} />
      {countries.map((country) => (
        <Card key={country.countryCode} style={styles.card}>
          <XivText variant="subtitle">
            {country.countryName} · {country.countryCode}
          </XivText>
          <XivText variant="caption" muted>
            {country.africanSubregion?.replaceAll('_', ' ')} · {country.languages.join(', ')} · {country.currencies.join(', ')}
          </XivText>
          <XivText variant="label" color={Palette.warning}>
            DATA {country.dataAvailability.split('_').join(' ').toUpperCase()}
          </XivText>
          <XivText variant="caption" dim>
            Industries, trade, and risk scores are unavailable. No invented companies or GDP figures.
          </XivText>
        </Card>
      ))}
      <SectionHeader kicker="Cases" title="Business cases" />
      {africaCases.length === 0 ? (
        <Card style={styles.card}>
          <XivText variant="subtitle">No Africa-tagged cases yet</XivText>
          <XivText variant="caption" muted>
            Unavailable case content is not fabricated.
          </XivText>
        </Card>
      ) : null}
      <SectionHeader kicker="Opportunities" title="Trade and companies" />
      <Card style={styles.card}>
        <XivText variant="subtitle">Trade opportunities</XivText>
        <XivText variant="caption" muted>
          NOT CONFIGURED. Corridor statistics are not invented.
        </XivText>
      </Card>
      <Card style={styles.card}>
        <XivText variant="subtitle">Companies</XivText>
        <XivText variant="caption" muted>
          Company lists appear only when authorized data is available. None is loaded here.
        </XivText>
      </Card>
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
