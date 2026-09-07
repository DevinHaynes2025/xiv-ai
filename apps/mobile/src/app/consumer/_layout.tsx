import { ExperienceTabs } from '@/components/xiv/experience-tabs';

const tabs = [
  { name: 'index', label: 'Home', ios: 'house', android: 'home' },
  { name: 'discover', label: 'Discover', ios: 'safari', android: 'explore' },
  { name: 'create', label: 'Create', ios: 'plus', android: 'add' },
  { name: 'communities', label: 'Community', ios: 'person.3', android: 'groups' },
  { name: 'profile', label: 'Profile', ios: 'person.crop.circle', android: 'person' },
];

export default function ConsumerLayout() {
  return (
    <ExperienceTabs
      tabs={tabs}
      hidden={['assistant', 'agents', 'opportunities', 'inbox', 'activity', 'hubs', 'article', 'live']}
    />
  );
}
