import { useLocalSearchParams } from 'expo-router';

import { IndustryHubScreen } from '@/screens/hubs/industry-hub';

export default function ConsumerHubRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IndustryHubScreen id={id} />;
}
