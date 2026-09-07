import { ExperienceTabs } from '@/components/xiv/experience-tabs';

const tabs = [
  { name: 'index', label: 'Home', ios: 'house', android: 'home' },
  { name: 'intelligence', label: 'Intel', ios: 'lightbulb', android: 'lightbulb' },
  { name: 'network', label: 'Network', ios: 'person.2', android: 'groups' },
  { name: 'meetings', label: 'Meetings', ios: 'video', android: 'videocam' },
  { name: 'agents', label: 'AI', ios: 'sparkles', android: 'auto_awesome' },
];

const hidden = [
  'sales',
  'operations',
  'more',
  'health',
  'team',
  'profile',
  'briefing',
  'performance',
  'people',
  'control',
  'systems',
  'assistant',
  'activity',
  'warehouse',
  'inventory',
  'supply-chain',
  'customers',
  'documents',
  'marketing',
  'finance',
  'projects',
  'security',
  'live',
  'cases',
  'africa',
  'global',
  'ops',
  'messages',
  'conversation',
  'events',
  'mixer',
  'marketplace',
  'promote',
  'ads',
  'story',
  'sources',
  'company',
  'professional',
  'meeting-room',
  'agent-room',
];

export default function BusinessLayout() {
  return <ExperienceTabs tabs={tabs} hidden={hidden} />;
}
