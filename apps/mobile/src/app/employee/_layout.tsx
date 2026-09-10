import { ExperienceTabs } from '@/components/xiv/experience-tabs';

const tabs = [
  { name: 'index', label: 'Command', ios: 'square.grid.2x2', android: 'dashboard' },
  { name: 'agents', label: 'Agents', ios: 'sparkles', android: 'auto_awesome' },
  { name: 'wellness', label: 'Health', ios: 'heart', android: 'favorite' },
  { name: 'profile', label: 'Profile', ios: 'person.crop.circle', android: 'person' },
];

export default function EmployeeLayout() {
  return (
    <ExperienceTabs
      tabs={tabs}
      hidden={['assistant', 'ideas', 'feedback', 'learn', 'growth', 'activity']}
    />
  );
}
