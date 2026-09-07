import { ExperienceTabs } from '@/components/xiv/experience-tabs';

const tabs = [
  { name: 'index', label: 'Command', ios: 'square.grid.2x2', android: 'dashboard' },
  { name: 'sales', label: 'Sales', ios: 'chart.bar', android: 'bar_chart' },
  { name: 'operations', label: 'Operations', ios: 'shippingbox', android: 'inventory_2' },
  { name: 'agents', label: 'Agents', ios: 'sparkles', android: 'auto_awesome' },
  { name: 'more', label: 'More', ios: 'ellipsis', android: 'more_horiz' },
];

export default function ExecutiveLayout() {
  return (
    <ExperienceTabs
      tabs={tabs}
      hidden={[
        'health',
        'workforce',
        'profile',
        'assistant',
        'finance',
        'activity',
        'warehouse',
        'inventory',
        'supply-chain',
        'customers',
        'documents',
        'marketing',
        'projects',
        'security',
        'systems',
        'live',
      ]}
    />
  );
}
