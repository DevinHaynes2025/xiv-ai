import type { AfricanSubregion, CountryBusinessProfile, WorldRegion } from './types';

type Seed = {
  code: string;
  name: string;
  region: WorldRegion;
  africanSubregion?: AfricanSubregion;
  languages: readonly string[];
  currencies: readonly string[];
  timeZones: readonly string[];
};

function profile(seed: Seed): CountryBusinessProfile {
  return {
    countryCode: seed.code,
    countryName: seed.name,
    region: seed.region,
    africanSubregion: seed.africanSubregion,
    languages: seed.languages,
    currencies: seed.currencies,
    timeZones: seed.timeZones,
    keyIndustries: [],
    tradeConnections: [],
    businessSignals: [],
    logisticsInfrastructure: [],
    regulatorySourceLinks: [],
    dataFreshness: 'not_configured',
    dataAvailability: 'not_configured',
  };
}

const AFRICA_SEEDS: readonly Seed[] = [
  { code: 'DZ', name: 'Algeria', region: 'africa', africanSubregion: 'north_africa', languages: ['ar', 'ber'], currencies: ['DZD'], timeZones: ['Africa/Algiers'] },
  { code: 'AO', name: 'Angola', region: 'africa', africanSubregion: 'central_africa', languages: ['pt'], currencies: ['AOA'], timeZones: ['Africa/Luanda'] },
  { code: 'BJ', name: 'Benin', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Porto-Novo'] },
  { code: 'BW', name: 'Botswana', region: 'africa', africanSubregion: 'southern_africa', languages: ['en', 'tn'], currencies: ['BWP'], timeZones: ['Africa/Gaborone'] },
  { code: 'BF', name: 'Burkina Faso', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Ouagadougou'] },
  { code: 'BI', name: 'Burundi', region: 'africa', africanSubregion: 'east_africa', languages: ['fr', 'rn'], currencies: ['BIF'], timeZones: ['Africa/Bujumbura'] },
  { code: 'CV', name: 'Cabo Verde', region: 'africa', africanSubregion: 'west_africa', languages: ['pt'], currencies: ['CVE'], timeZones: ['Atlantic/Cape_Verde'] },
  { code: 'CM', name: 'Cameroon', region: 'africa', africanSubregion: 'central_africa', languages: ['fr', 'en'], currencies: ['XAF'], timeZones: ['Africa/Douala'] },
  { code: 'CF', name: 'Central African Republic', region: 'africa', africanSubregion: 'central_africa', languages: ['fr', 'sg'], currencies: ['XAF'], timeZones: ['Africa/Bangui'] },
  { code: 'TD', name: 'Chad', region: 'africa', africanSubregion: 'central_africa', languages: ['fr', 'ar'], currencies: ['XAF'], timeZones: ['Africa/Ndjamena'] },
  { code: 'KM', name: 'Comoros', region: 'africa', africanSubregion: 'east_africa', languages: ['ar', 'fr'], currencies: ['KMF'], timeZones: ['Indian/Comoro'] },
  { code: 'CG', name: 'Congo', region: 'africa', africanSubregion: 'central_africa', languages: ['fr'], currencies: ['XAF'], timeZones: ['Africa/Brazzaville'] },
  { code: 'CD', name: 'Democratic Republic of the Congo', region: 'africa', africanSubregion: 'central_africa', languages: ['fr'], currencies: ['CDF'], timeZones: ['Africa/Kinshasa', 'Africa/Lubumbashi'] },
  { code: 'CI', name: "Côte d'Ivoire", region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Abidjan'] },
  { code: 'DJ', name: 'Djibouti', region: 'africa', africanSubregion: 'east_africa', languages: ['fr', 'ar'], currencies: ['DJF'], timeZones: ['Africa/Djibouti'] },
  { code: 'EG', name: 'Egypt', region: 'africa', africanSubregion: 'north_africa', languages: ['ar'], currencies: ['EGP'], timeZones: ['Africa/Cairo'] },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'africa', africanSubregion: 'central_africa', languages: ['es', 'fr', 'pt'], currencies: ['XAF'], timeZones: ['Africa/Malabo'] },
  { code: 'ER', name: 'Eritrea', region: 'africa', africanSubregion: 'east_africa', languages: ['ti', 'ar'], currencies: ['ERN'], timeZones: ['Africa/Asmara'] },
  { code: 'SZ', name: 'Eswatini', region: 'africa', africanSubregion: 'southern_africa', languages: ['en', 'ss'], currencies: ['SZL'], timeZones: ['Africa/Mbabane'] },
  { code: 'ET', name: 'Ethiopia', region: 'africa', africanSubregion: 'east_africa', languages: ['am'], currencies: ['ETB'], timeZones: ['Africa/Addis_Ababa'] },
  { code: 'GA', name: 'Gabon', region: 'africa', africanSubregion: 'central_africa', languages: ['fr'], currencies: ['XAF'], timeZones: ['Africa/Libreville'] },
  { code: 'GM', name: 'Gambia', region: 'africa', africanSubregion: 'west_africa', languages: ['en'], currencies: ['GMD'], timeZones: ['Africa/Banjul'] },
  { code: 'GH', name: 'Ghana', region: 'africa', africanSubregion: 'west_africa', languages: ['en'], currencies: ['GHS'], timeZones: ['Africa/Accra'] },
  { code: 'GN', name: 'Guinea', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['GNF'], timeZones: ['Africa/Conakry'] },
  { code: 'GW', name: 'Guinea-Bissau', region: 'africa', africanSubregion: 'west_africa', languages: ['pt'], currencies: ['XOF'], timeZones: ['Africa/Bissau'] },
  { code: 'KE', name: 'Kenya', region: 'africa', africanSubregion: 'east_africa', languages: ['en', 'sw'], currencies: ['KES'], timeZones: ['Africa/Nairobi'] },
  { code: 'LS', name: 'Lesotho', region: 'africa', africanSubregion: 'southern_africa', languages: ['en', 'st'], currencies: ['LSL'], timeZones: ['Africa/Maseru'] },
  { code: 'LR', name: 'Liberia', region: 'africa', africanSubregion: 'west_africa', languages: ['en'], currencies: ['LRD'], timeZones: ['Africa/Monrovia'] },
  { code: 'LY', name: 'Libya', region: 'africa', africanSubregion: 'north_africa', languages: ['ar'], currencies: ['LYD'], timeZones: ['Africa/Tripoli'] },
  { code: 'MG', name: 'Madagascar', region: 'africa', africanSubregion: 'east_africa', languages: ['fr', 'mg'], currencies: ['MGA'], timeZones: ['Indian/Antananarivo'] },
  { code: 'MW', name: 'Malawi', region: 'africa', africanSubregion: 'east_africa', languages: ['en', 'ny'], currencies: ['MWK'], timeZones: ['Africa/Blantyre'] },
  { code: 'ML', name: 'Mali', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Bamako'] },
  { code: 'MR', name: 'Mauritania', region: 'africa', africanSubregion: 'west_africa', languages: ['ar'], currencies: ['MRU'], timeZones: ['Africa/Nouakchott'] },
  { code: 'MU', name: 'Mauritius', region: 'africa', africanSubregion: 'east_africa', languages: ['en', 'fr'], currencies: ['MUR'], timeZones: ['Indian/Mauritius'] },
  { code: 'MA', name: 'Morocco', region: 'africa', africanSubregion: 'north_africa', languages: ['ar', 'ber'], currencies: ['MAD'], timeZones: ['Africa/Casablanca'] },
  { code: 'MZ', name: 'Mozambique', region: 'africa', africanSubregion: 'east_africa', languages: ['pt'], currencies: ['MZN'], timeZones: ['Africa/Maputo'] },
  { code: 'NA', name: 'Namibia', region: 'africa', africanSubregion: 'southern_africa', languages: ['en'], currencies: ['NAD'], timeZones: ['Africa/Windhoek'] },
  { code: 'NE', name: 'Niger', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Niamey'] },
  { code: 'NG', name: 'Nigeria', region: 'africa', africanSubregion: 'west_africa', languages: ['en'], currencies: ['NGN'], timeZones: ['Africa/Lagos'] },
  { code: 'RW', name: 'Rwanda', region: 'africa', africanSubregion: 'east_africa', languages: ['rw', 'en', 'fr'], currencies: ['RWF'], timeZones: ['Africa/Kigali'] },
  { code: 'ST', name: 'Sao Tome and Principe', region: 'africa', africanSubregion: 'central_africa', languages: ['pt'], currencies: ['STN'], timeZones: ['Africa/Sao_Tome'] },
  { code: 'SN', name: 'Senegal', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Dakar'] },
  { code: 'SC', name: 'Seychelles', region: 'africa', africanSubregion: 'east_africa', languages: ['en', 'fr'], currencies: ['SCR'], timeZones: ['Indian/Mahe'] },
  { code: 'SL', name: 'Sierra Leone', region: 'africa', africanSubregion: 'west_africa', languages: ['en'], currencies: ['SLE'], timeZones: ['Africa/Freetown'] },
  { code: 'SO', name: 'Somalia', region: 'africa', africanSubregion: 'east_africa', languages: ['so', 'ar'], currencies: ['SOS'], timeZones: ['Africa/Mogadishu'] },
  { code: 'ZA', name: 'South Africa', region: 'africa', africanSubregion: 'southern_africa', languages: ['en', 'af', 'zu', 'xh'], currencies: ['ZAR'], timeZones: ['Africa/Johannesburg'] },
  { code: 'SS', name: 'South Sudan', region: 'africa', africanSubregion: 'east_africa', languages: ['en'], currencies: ['SSP'], timeZones: ['Africa/Juba'] },
  { code: 'SD', name: 'Sudan', region: 'africa', africanSubregion: 'north_africa', languages: ['ar', 'en'], currencies: ['SDG'], timeZones: ['Africa/Khartoum'] },
  { code: 'TZ', name: 'Tanzania', region: 'africa', africanSubregion: 'east_africa', languages: ['sw', 'en'], currencies: ['TZS'], timeZones: ['Africa/Dar_es_Salaam'] },
  { code: 'TG', name: 'Togo', region: 'africa', africanSubregion: 'west_africa', languages: ['fr'], currencies: ['XOF'], timeZones: ['Africa/Lome'] },
  { code: 'TN', name: 'Tunisia', region: 'africa', africanSubregion: 'north_africa', languages: ['ar'], currencies: ['TND'], timeZones: ['Africa/Tunis'] },
  { code: 'UG', name: 'Uganda', region: 'africa', africanSubregion: 'east_africa', languages: ['en', 'sw'], currencies: ['UGX'], timeZones: ['Africa/Kampala'] },
  { code: 'ZM', name: 'Zambia', region: 'africa', africanSubregion: 'southern_africa', languages: ['en'], currencies: ['ZMW'], timeZones: ['Africa/Lusaka'] },
  { code: 'ZW', name: 'Zimbabwe', region: 'africa', africanSubregion: 'southern_africa', languages: ['en'], currencies: ['ZWG'], timeZones: ['Africa/Harare'] },
];

const WORLD_SEEDS: readonly Seed[] = [
  { code: 'US', name: 'United States', region: 'north_america', languages: ['en'], currencies: ['USD'], timeZones: ['America/New_York'] },
  { code: 'CN', name: 'China', region: 'asia', languages: ['zh'], currencies: ['CNY'], timeZones: ['Asia/Shanghai'] },
  { code: 'GB', name: 'United Kingdom', region: 'europe', languages: ['en'], currencies: ['GBP'], timeZones: ['Europe/London'] },
  { code: 'DE', name: 'Germany', region: 'europe', languages: ['de'], currencies: ['EUR'], timeZones: ['Europe/Berlin'] },
  { code: 'BR', name: 'Brazil', region: 'south_america', languages: ['pt'], currencies: ['BRL'], timeZones: ['America/Sao_Paulo'] },
  { code: 'AE', name: 'United Arab Emirates', region: 'middle_east', languages: ['ar'], currencies: ['AED'], timeZones: ['Asia/Dubai'] },
  { code: 'AU', name: 'Australia', region: 'oceania', languages: ['en'], currencies: ['AUD'], timeZones: ['Australia/Sydney'] },
  { code: 'IN', name: 'India', region: 'asia', languages: ['hi', 'en'], currencies: ['INR'], timeZones: ['Asia/Kolkata'] },
  { code: 'JP', name: 'Japan', region: 'asia', languages: ['ja'], currencies: ['JPY'], timeZones: ['Asia/Tokyo'] },
  { code: 'SG', name: 'Singapore', region: 'asia', languages: ['en', 'zh', 'ms', 'ta'], currencies: ['SGD'], timeZones: ['Asia/Singapore'] },
];

export const COUNTRY_PROFILES: readonly CountryBusinessProfile[] = [...AFRICA_SEEDS, ...WORLD_SEEDS].map(profile);

export function getCountryProfile(countryCode: string) {
  return COUNTRY_PROFILES.find((item) => item.countryCode === countryCode) ?? null;
}

export function africanCountryProfiles() {
  return COUNTRY_PROFILES.filter((item) => item.region === 'africa');
}

export function countryDataIsFabricated(profile: CountryBusinessProfile) {
  return (
    profile.keyIndustries.length > 0 ||
    profile.businessSignals.length > 0 ||
    profile.dataAvailability === 'available'
  );
}

export function unavailableCountryData(countryCode: string) {
  const profile = getCountryProfile(countryCode);
  if (!profile) {
    return {
      countryCode,
      dataAvailability: 'unavailable' as const,
      statistics: null,
      fabricated: false as const,
      reason: 'Country is not in the configuration catalog.',
    };
  }
  return {
    countryCode: profile.countryCode,
    dataAvailability: profile.dataAvailability,
    statistics: null,
    fabricated: false as const,
    reason: 'Country statistics are NOT CONFIGURED. XIV does not invent GDP, company lists, or market sizes.',
  };
}
