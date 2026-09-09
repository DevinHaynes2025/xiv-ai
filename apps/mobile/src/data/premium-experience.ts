import type { DataSurfaceState } from '@/lib/surface-state';

export const HEALTH_DOMAINS = [
  { id: 'finance', title: 'Finance', value: '—', note: 'No live ledger.' },
  { id: 'operations', title: 'Operations', value: '—', note: 'No live WMS.' },
  { id: 'supply', title: 'Supply Chain', value: '—', note: 'No live TMS.' },
  { id: 'customer', title: 'Customer', value: '—', note: 'No live CRM.' },
  { id: 'security', title: 'Security', value: 'Governed', note: 'L4 disabled.' },
  { id: 'people', title: 'People', value: '—', note: 'No HRIS feed.' },
  { id: 'growth', title: 'Growth', value: '—', note: 'No live pipeline.' },
] as const;

export const EXPERIENCE_STORY = {
  title: 'Public macro context around a filing period',
  happened: 'SEC public facts and World Bank US macro observations exist as proven adapters.',
  why: 'This screen is illustrating story format. It does not claim those adapters are streaming into this card right now.',
  impact: 'Operators can inspect provenance without treating a dashboard as a live ERP.',
  next: 'Possible next step is opening Sources to see LIVE vs NOT_CONFIGURED.',
  action: 'Review source freshness. Do not execute a warehouse move.',
  evidence: ['world_bank_open_data (adapter LIVE after 2I-D proof)', 'us_sec_edgar (adapter LIVE after 2I-D2 proof)'],
  confidence: 'low' as const,
  source: 'story-engine',
  timestamp: null,
  state: 'DEMO' as DataSurfaceState,
  demo: true,
};

export const FORECAST_STORY = {
  title: 'Modeled scenario — not a fact',
  happened: 'No new operational event was retrieved for this card.',
  why: 'The card exists to keep FORECAST visually distinct from LIVE.',
  impact: 'None claimed.',
  next: 'A future scenario remains non-certain.',
  action: 'Do not treat this as guidance to trade or hire.',
  evidence: ['No operational source attached'],
  confidence: 'unknown' as const,
  source: 'foresight-prototype',
  timestamp: null,
  state: 'FORECAST' as DataSurfaceState,
  demo: true,
};

export const INFERENCE_STORY = {
  title: 'Inferred working-capital pressure',
  happened: 'Sample receivables timing looks extended versus last period.',
  why: 'Modeled from demonstration inputs, not an authorized company ledger.',
  impact: 'If this were live, cash conversion would be the question. It is not live.',
  next: 'A real company source would be required before any action.',
  action: 'Open Sources. Do not treat inference as a ledger fact.',
  evidence: ['Demonstration AR aging sample'],
  confidence: 'low' as const,
  source: 'finance-model-prototype',
  timestamp: null,
  state: 'INFERENCE' as DataSurfaceState,
  demo: true,
};

export const INTELLIGENCE_STORIES = [EXPERIENCE_STORY, INFERENCE_STORY, FORECAST_STORY] as const;

export const INTELLIGENCE_TIMELINE = [
  'Historical public adapter window (World Bank / SEC)',
  'DEMO story card — not a warehouse event',
  'FORECAST scenario — not a fact',
] as const;

export const NETWORK_PEOPLE = [
  {
    name: 'Jordan Hale',
    expertise: 'Supply-chain recovery programs',
    context: 'Mutual context: Dallas operators mixer topic. Declared industry only.',
    state: 'DEMO' as DataSurfaceState,
  },
  {
    name: 'Amira Diallo',
    expertise: 'West Africa trade corridors',
    context: 'Collaboration interest: logistics visibility. Not a follower count.',
    state: 'DEMO' as DataSurfaceState,
  },
];

export const INTRODUCTIONS = [
  {
    from: 'Avery Chen',
    to: 'Jordan Hale',
    reason: 'Shared declared problem: inbound visibility. Not a vanity intro.',
    state: 'DEMO' as DataSurfaceState,
  },
];

export const MIXERS = [
  { title: 'Founders Mixer', topic: 'founders', when: 'Fri 17:00' },
  { title: 'Supply-chain operators', topic: 'supply_chain', when: 'Tue 08:00' },
  { title: 'Innovation room', topic: 'technology', when: 'Thu 12:00' },
  { title: 'Investor / founder session', topic: 'investment', when: 'Wed 16:00' },
];

export const EVENTS = [
  { title: 'Product briefing (internal)', kind: 'company event', when: 'Wed 10:00' },
  { title: 'Industry session', kind: 'industry session', when: 'Next week' },
  { title: 'Training: provenance', kind: 'training', when: 'On demand' },
  { title: 'Business Live session', kind: 'business live', when: 'Not a live stream' },
];

export const CONVERSATIONS = [
  { id: 'c1', title: 'Avery Chen', preview: 'Intro timing stays in-tenant.', kind: 'direct' },
  { id: 'c2', title: 'Dallas operators', preview: 'Group room. No live bus.', kind: 'group' },
  { id: 'c3', title: 'Company ops', preview: 'Company room. Tenant scoped.', kind: 'company_channel' },
  { id: 'c4', title: 'Project Atlas', preview: 'Project room shell.', kind: 'project' },
  { id: 'c5', title: 'Q3 review thread', preview: 'Meeting conversation shell.', kind: 'meeting_chat' },
  { id: 'c6', title: 'Mixer follow-up', preview: 'Event conversation shell.', kind: 'event_chat' },
];

export const THREAD = [
  { kind: 'human' as const, author: 'Avery Chen', body: 'Can we keep this in the company room?' },
  { kind: 'xiv_agent' as const, author: 'Meeting Agent', body: 'I can draft a prep note. L3 approval required to send.' },
  { kind: 'system' as const, author: 'XIV', body: 'Transport is NOT_CONFIGURED. Nothing was delivered.' },
  { kind: 'workflow' as const, author: 'Workflow', body: 'Approval request opened. L4 remains disabled.' },
];

export const MEETING_KINDS = [
  'internal team meeting',
  'customer call',
  'investor meeting',
  'supplier meeting',
  'founder meeting',
  'industry roundtable',
  '1:1',
  'group meeting',
] as const;

export const MEETING_PREP = {
  title: 'Q3 ops review',
  when: 'Today · 2:00 PM',
  kind: 'internal team meeting',
  summary: 'Preparation is a DEMO brief. No live calendar or video provider.',
  agenda: ['Working-capital story (DEMO)', 'Supplier delay sample (DEMO)', 'Approvals: none pending'],
  notes: 'Notes stay local to this prototype. Not a transcript.',
  actions: ['Confirm human owner for the sample DSO story', 'Do not treat FORECAST as a shipping plan'],
  decisions: ['No production write authorized'],
  intelligence: 'Company intelligence requires an authorized Company Brain source. NOT_CONFIGURED.',
};

export const PROFESSIONAL_PROFILE = {
  legalName: 'Jordan Hale',
  expertise: ['Supply-chain recovery', 'Operator rooms'],
  problemsSolved: ['Inbound visibility programs'],
  industries: ['Logistics'],
  projects: ['Dallas operators mixer follow-through'],
  contributions: ['Shared a DEMO playbook — not a live warehouse claim'],
  businessInterests: ['Working-capital discipline'],
  collaborationInterests: ['Introductions around declared problems'],
  followerCountShown: false as const,
  state: 'DEMO' as DataSurfaceState,
};

export const COMPANY_PROFILE = {
  legalName: 'Northwind Logistics',
  industry: 'Logistics (sample)',
  surface: 'DEMO' as DataSurfaceState,
  note: 'Public company surface. Private tenant data stays private. Company Brain does not auto-enter Global Brain.',
};

export const AGENT_WORKSPACE = {
  active: 'Executive',
  investigating: 'Sample working-capital story. No live ledger attached.',
  sources: ['story-engine (DEMO)', 'world_bank_open_data (adapter may be LIVE)', 'us_sec_edgar (adapter may be LIVE)'],
  evidence: ['Demonstration AR aging', 'Public adapter capability — not this card streaming'],
  confidence: 'low' as const,
  proposedAction: 'Draft a brief for human review. Do not move inventory.',
  requiredApproval: 'L3 Human Approval',
  currentAuthority: 'L1 Recommend',
  outcome: 'No production write. L4 remains disabled.',
  audit: ['Observed DEMO story', 'Recommendation drafted', 'Consequential action blocked without human approval'],
};

export const EXPERIENCE_AGENTS = [
  { name: 'Executive', authority: 'L3', status: 'Observe / recommend', task: 'Chair brief. No self-authority edit.' },
  { name: 'Finance', authority: 'L1', status: 'Recommend', task: 'No ledger write.' },
  { name: 'Supply Chain', authority: 'L1', status: 'Recommend', task: 'No WMS move.' },
  { name: 'Operations', authority: 'L1', status: 'Recommend', task: 'Read-only layout.' },
  { name: 'Security', authority: 'L5', status: 'Human only', task: 'Cannot self-edit policy.' },
  { name: 'Procurement', authority: 'L1', status: 'Recommend', task: 'No PO send.' },
  { name: 'Growth', authority: 'L1', status: 'Recommend', task: 'No CRM blast.' },
  { name: 'Customer Experience', authority: 'L1', status: 'Recommend', task: 'No live ticket write.' },
  { name: 'Technology', authority: 'L1', status: 'Recommend', task: 'No deploy.' },
  { name: 'People', authority: 'L5', status: 'Human only', task: 'No HRIS mutation.' },
  { name: 'Innovation', authority: 'L1', status: 'Recommend', task: 'Hypothesis ≠ fact.' },
] as const;

export const SOURCE_ROWS: {
  name: string;
  owner: string;
  classification: string;
  state: DataSurfaceState;
  lastSync: string;
  note: string;
}[] = [
  {
    name: 'World Bank Open Data',
    owner: 'Global public',
    classification: 'public',
    state: 'LIVE',
    lastSync: 'Validated in 2I-D proof',
    note: 'Adapter LIVE. This card is not a streaming ticker.',
  },
  {
    name: 'U.S. SEC EDGAR',
    owner: 'Global public',
    classification: 'public',
    state: 'LIVE',
    lastSync: 'Validated in 2I-D2 proof',
    note: 'Adapter LIVE. Bounded public facts only.',
  },
  {
    name: 'Oracle Database',
    owner: 'Tenant',
    classification: 'restricted',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'Read-only connector foundation. Not connected.',
  },
  {
    name: 'PostgreSQL / Supabase',
    owner: 'Tenant',
    classification: 'restricted',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'Hosted tenant writes remain blocked.',
  },
  {
    name: 'Snowflake / BigQuery / SQL Server',
    owner: 'Tenant',
    classification: 'restricted',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'Catalogued. Not proven LIVE.',
  },
  {
    name: 'CRM / ERP / WMS / TMS',
    owner: 'Tenant',
    classification: 'confidential',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'No fake live inventory, accounts, or revenue.',
  },
  {
    name: 'NVIDIA compute',
    owner: 'Infrastructure',
    classification: 'internal',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'No GPU fabric claimed.',
  },
  {
    name: 'Messaging transport',
    owner: 'Product',
    classification: 'internal',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'Inbox is a visual foundation. No live bus.',
  },
  {
    name: 'Video meetings',
    owner: 'Product',
    classification: 'internal',
    state: 'NOT_CONFIGURED',
    lastSync: 'never',
    note: 'Meeting room is visual-only. No WebRTC.',
  },
];
