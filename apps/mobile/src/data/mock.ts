import type { HomeExperience, RoleId } from '@/types/session';

export const regions = [
  'United States',
  'United Kingdom',
  'Canada',
  'Nigeria',
  'Kenya',
  'South Africa',
  'Ghana',
  'India',
  'United Arab Emirates',
  'Germany',
] as const;

export const interests = [
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'ai', label: 'AI' },
  { id: 'technology', label: 'Technology' },
  { id: 'supply-chain', label: 'Supply Chain' },
  { id: 'retail', label: 'Retail' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'startups', label: 'Startups' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'africa-business', label: 'Africa Business' },
  { id: 'sustainability', label: 'Sustainability' },
] as const;

export const securitySteps = [
  {
    id: 'identity',
    title: 'Identity verification',
    action: 'Simulate check',
    detail:
      'XIV would confirm who you are before opening a workspace. In this preview, no documents are uploaded and no identity provider is called.',
    ios: 'person.text.rectangle.fill',
    android: 'badge',
  },
  {
    id: 'passkey',
    title: 'Passkey / MFA',
    action: 'Simulate factor',
    detail:
      'A production account would request a passkey or second factor. Nothing is enrolled on this device.',
    ios: 'key.fill',
    android: 'key',
  },
  {
    id: 'device',
    title: 'Device verification',
    action: 'Mark this device',
    detail:
      'Trusted-device flow is shown here as product intent. This prototype does not fingerprint or enroll hardware.',
    ios: 'iphone',
    android: 'smartphone',
  },
  {
    id: 'privacy',
    title: 'Privacy controls',
    action: 'Save preferences',
    detail: 'Choose what this preview account can reveal. Selections stay in local session state only.',
    ios: 'eye.slash.fill',
    android: 'visibility_off',
  },
  {
    id: 'permissions',
    title: 'Data permissions',
    action: 'Confirm scopes',
    detail: 'Grant or deny mock data scopes. No live company, personal, or payment data is accessed.',
    ios: 'slider.horizontal.3',
    android: 'tune',
  },
  {
    id: 'complete',
    title: 'Security completion',
    action: 'Enter XIV',
    detail:
      'This workspace is marked ready for the rest of the preview. Encryption, recovery, and continuous monitoring are not implemented.',
    ios: 'checkmark.shield.fill',
    android: 'verified_user',
  },
] as const;

export const privacyControls = [
  { id: 'discovery', label: 'Keep my profile off public discovery' },
  { id: 'location', label: 'Use approximate region only' },
  { id: 'identity', label: 'Do not attach my legal name to communities' },
];

export const dataPermissions = [
  { id: 'products', label: 'Early-access product matching' },
  { id: 'surveys', label: 'Survey and paid-project invitations' },
  { id: 'workplace', label: 'Anonymous workplace signal (optional later)' },
];

export const experiences: {
  id: RoleId;
  title: string;
  summary: string;
  route: '/consumer' | '/employee' | '/business' | '/executive';
  ios: string;
  android: string;
}[] = [
  {
    id: 'consumer',
    title: 'XIV Consumer',
    summary: 'Discover, connect, contribute, earn and build.',
    route: '/consumer',
    ios: 'sparkles',
    android: 'auto_awesome',
  },
  {
    id: 'employee',
    title: 'XIV Anonymous Employee',
    summary: 'Speak safely, learn, share ideas and improve your company.',
    route: '/employee',
    ios: 'person.fill.questionmark',
    android: 'privacy_tip',
  },
  {
    id: 'business_owner',
    title: 'XIV Business',
    summary: 'See company health, data, AI agents and executive intelligence.',
    route: '/business',
    ios: 'building.2.fill',
    android: 'apartment',
  },
  {
    id: 'executive',
    title: 'XIV Executive',
    summary: 'See company health, data, AI agents and executive intelligence.',
    route: '/executive',
    ios: 'briefcase.fill',
    android: 'work',
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneur',
    summary: 'Discover, connect, contribute, earn and build.',
    route: '/consumer',
    ios: 'lightbulb.fill',
    android: 'lightbulb',
  },
];

export const consumerFeed = [
  {
    id: '1',
    tag: 'Feed',
    title: 'Helios Grid opens a limited field trial',
    body: 'Regional energy operators can request a 90-day operations cockpit.',
    meta: 'North Atlantic · 2h · synthetic',
  },
  {
    id: '2',
    tag: 'Feed',
    title: 'Lagos logistics cohort is forming',
    body: 'Operators comparing cold-chain reliability across West African corridors.',
    meta: 'Africa Business · 5h · synthetic',
  },
];

export const consumerEarlyAccess = [
  {
    id: 'ea1',
    title: 'Lumen Ledger private beta',
    body: 'Audit-ready spend mapping for mid-market finance teams.',
    meta: 'Closes in 6 days',
  },
  {
    id: 'ea2',
    title: 'Harbor Desk invite',
    body: 'A calm operations desk for port-side inventory before public launch.',
    meta: 'Invite only',
  },
];

export const consumerCommunities = [
  { id: 'c1', name: 'Atlas Operators', members: '8,420', focus: 'Supply networks' },
  { id: 'c2', name: 'Quiet Capital', members: '3,110', focus: 'Patient ventures' },
  { id: 'c3', name: 'Civic Markets', members: '5,604', focus: 'Public-interest business' },
];

export const consumerDiscover = [
  { id: 'd1', name: 'Nimbus Assay', category: 'Healthcare', status: 'Raising Series B' },
  { id: 'd2', name: 'Keel & Current', category: 'Supply Chain', status: 'Live product' },
  { id: 'd3', name: 'Vellum Health', category: 'Clinic ops', status: 'Pilot cohort' },
];

export const consumerOpportunities = [
  { id: 'o1', kind: 'Earn', title: 'Co-build a local procurement club', pay: 'Equity conversation' },
  { id: 'o2', kind: 'Build', title: 'Annotate industrial SKUs', pay: '$220 estimate' },
];

export const consumerSurveys = [
  { id: 's1', kind: 'Survey', title: 'Retail trust after outages', pay: 'XIV Credits 40' },
  { id: 's2', kind: 'Project', title: 'Map last-mile cold storage gaps', pay: 'XIV Credits 75' },
];

export const consumerProducts = [
  { id: 'np1', name: 'Harbor Desk', category: 'Operations', status: 'New · early access' },
  { id: 'np2', name: 'Lumen Ledger', category: 'Finance', status: 'New · private beta' },
  { id: 'np3', name: 'Keel Signals', category: 'Supply Chain', status: 'New · waitlist' },
];

export const consumerInbox = [
  { id: 'in1', from: 'Atlas Operators', title: 'Circle digest', body: 'Two new threads on cold-chain reliability. Mock mail only.' },
  { id: 'in2', from: 'XIV Early Access', title: 'Harbor Desk invite', body: 'Your preview seat is held. No product is live.' },
  { id: 'in3', from: 'Quiet Capital', title: 'Cohort note', body: 'Patient-venture salon is forming. Synthetic invite.' },
];

export const employeeThreads = [
  { id: 'e1', handle: 'Signal-4C', topic: 'Shift handoff still loses context', replies: 38 },
  { id: 'e2', handle: 'North-19', topic: 'A quieter way to flag unsafe overtime', replies: 21 },
  { id: 'e3', handle: 'Keel-02', topic: 'Shared runbooks across plants', replies: 54 },
];

export const employeeIdeas = [
  { id: 'i1', title: 'Blind review for process changes', heat: 'High' },
  { id: 'i2', title: 'Cross-site apprenticeship pods', heat: 'Rising' },
  { id: 'i3', title: 'Customer-safe language kit for support', heat: 'Steady' },
];

export const employeeGrowth = [
  { id: 'g1', title: 'Systems thinking for operators', kind: 'Learning' },
  { id: 'g2', title: 'Internal mobility: control-room path', kind: 'Career' },
  { id: 'g3', title: 'Night-shift project: inventory truth', kind: 'Project' },
];

export const employeeWellness = [
  { id: 'w1', title: 'Private check-in', detail: 'Stays off the company feed in this preview.' },
  { id: 'w2', title: 'Recovery window', detail: 'Mock schedule protection — not connected to HR.' },
  { id: 'w3', title: 'Peer support room', detail: 'Anonymous, facilitated, synthetic members.' },
];

export const employeeProjects = [
  { id: 'p1', title: 'Inventory truth sprint', detail: 'Night-shift volunteers mapping SKU drift.' },
  { id: 'p2', title: 'Safety language kit', detail: 'Shared phrases that do not expose individuals.' },
];

export const employeePolls = [
  { id: 'pl1', question: 'Which handoff still loses the most context?', options: ['Shift notes', 'Radio', 'Ticket system'] },
  { id: 'pl2', question: 'Where should the next quiet room land?', options: ['Plant 2', 'HQ annex', 'Remote first'] },
];

export const employeeUniverse = {
  name: 'Northstar Logistics',
  status: 'Company universe · placeholder',
  detail: 'Organization membership is not connected. This tenant is a visual stand-in.',
};

export const businessHealthScore = {
  score: 86,
  label: 'Business Health',
  detail: 'Composite of revenue integrity, operations load, customer trust, and workforce risk. Synthetic.',
};

export const businessHealth = [
  { id: 'b1', label: 'Revenue integrity', value: '98.2', unit: 'index', tone: 'good' as const },
  { id: 'b2', label: 'Operations load', value: '74', unit: '%', tone: 'watch' as const },
  { id: 'b3', label: 'Customer trust', value: '4.6', unit: '/5', tone: 'good' as const },
  { id: 'b4', label: 'Workforce risk', value: 'Low', unit: '', tone: 'good' as const },
];

export const businessRevenue = {
  trailing: '$48.2M',
  change: '+4.1% vs prior period',
  detail: 'Recognized versus pipeline. Figures are invented for the investor walkthrough.',
};

export const businessRisks = [
  { id: 'r1', title: 'Two warehouses off SLA', detail: 'Harbor agent drafted a recovery plan. Simulated.' },
  { id: 'r2', title: 'Vendor token due for rotation', detail: 'Security center flagged it. No live system is linked.' },
];

export const businessBriefing = [
  'Overnight bookings in the Nordic corridor recovered after the weather hold.',
  'Two connected warehouses drifted out of SLA; agent “Harbor” drafted a recovery plan.',
  'Security center marked a vendor token for rotation. Action is simulated.',
];

export const businessAgents = [
  { id: 'a1', name: 'Harbor', activity: 'Drafted warehouse recovery in 14 minutes' },
  { id: 'a2', name: 'Brief', activity: 'Compiled overnight executive notes' },
  { id: 'a3', name: 'Audit', activity: 'Queued vendor token rotation reminder' },
];

export const businessSystems = [
  { id: 'sys1', name: 'ERP', status: 'NOT CONNECTED' },
  { id: 'sys2', name: 'CRM', status: 'NOT CONNECTED' },
  { id: 'sys3', name: 'Warehouse', status: 'NOT CONNECTED' },
];

export const businessActions = [
  { id: 'ac1', title: 'Approve recovery window', detail: 'Gives Harbor 6 hours on the two lagging sites.' },
  { id: 'ac2', title: 'Rotate vendor token', detail: 'Opens the security center checklist. Not executed here.' },
  { id: 'ac3', title: 'Share briefing with the chair', detail: 'Copies today’s notes into a simulated send queue.' },
];

export const businessTeam = [
  { id: 't1', title: 'Operations', detail: '142 people · coverage steady · synthetic roster' },
  { id: 't2', title: 'Finance', detail: '18 people · close calendar on track · synthetic' },
  { id: 't3', title: 'Customer success', detail: '36 people · two accounts flagged · synthetic' },
];

export const executiveFinance = [
  { id: 'f1', title: 'Trailing revenue', detail: '$48.2M recognized · +4.1% vs prior period' },
  { id: 'f2', title: 'Gross margin', detail: '41.6% · watch labor mix on two sites' },
  { id: 'f3', title: 'Cash runway', detail: '14 months at current burn · synthetic' },
];

export const executiveOperations = [
  { id: 'op1', title: 'Throughput', detail: 'Harbor corridor recovered overnight after weather hold.' },
  { id: 'op2', title: 'Exceptions', detail: '14 open · two warehouses off SLA.' },
  { id: 'op3', title: 'Capacity', detail: 'Plant 3 at 91% · no live WMS is linked.' },
];

export const executiveCustomers = [
  { id: 'cu1', title: 'Account health', detail: '4.6 / 5 composite. Names are fictional.' },
  { id: 'cu2', title: 'Expansion', detail: 'Three named accounts sit in a mock pipeline.' },
  { id: 'cu3', title: 'Churn watch', detail: 'One logistics contract in a simulated review.' },
];

export const executiveWorkforce = [
  { id: 'wf1', title: 'Coverage', detail: 'Night-shift depth is thin on Plant 2. Synthetic.' },
  { id: 'wf2', title: 'Climate', detail: 'Anonymous employee signal is summarized, not identified.' },
  { id: 'wf3', title: 'Mobility', detail: 'Control-room path has 11 mock candidates.' },
];

export const executiveRecommendations = [
  { id: 'er1', title: 'Hold the recovery window', detail: 'Give Harbor six hours before escalating the two lagging sites.' },
  { id: 'er2', title: 'Brief the chair on Nordic bookings', detail: 'Overnight recovery is the cleanest narrative for the board packet.' },
  { id: 'er3', title: 'Rotate the vendor token', detail: 'Security center flagged it. No live rotation is executed here.' },
];

export const businessModules = [
  { id: 'revenue', title: 'Revenue', detail: 'Pipeline, recognized, and leakage map' },
  { id: 'operations', title: 'Operations', detail: 'Throughput, exceptions, capacity' },
  { id: 'customers', title: 'Customers', detail: 'Accounts, health, and expansion' },
  { id: 'employees', title: 'Employees', detail: 'Coverage, skill, anonymous climate' },
  { id: 'marketing', title: 'Marketing', detail: 'Demand quality, not vanity volume' },
  { id: 'systems', title: 'Connected systems', detail: 'ERP, CRM, and warehouse links' },
  { id: 'agents', title: 'AI agents', detail: 'Briefing, recovery, and audit agents' },
  { id: 'security', title: 'Security center', detail: 'Access, vendors, and control posture' },
];

export const feedCategories = [
  'For You',
  'Business',
  'Technology',
  'Markets',
  'Supply Chain',
  'Innovation',
  'Leadership',
  'AI',
  'Entrepreneurship',
] as const;

export type NetworkContentKind =
  | 'text'
  | 'image'
  | 'video'
  | 'article'
  | 'poll'
  | 'question'
  | 'idea'
  | 'project'
  | 'product';
export type NetworkPreview = 'network' | 'earth';

export type ProfessionalFeedItem = {
  id: string;
  category: (typeof feedCategories)[number] | string;
  kind: NetworkContentKind;
  author: string;
  role: string;
  company: string;
  industry: string;
  title: string;
  description: string;
  tags: string[];
  timestamp: string;
  duration?: string;
  readingTime?: string;
  preview?: NetworkPreview;
  pollOptions?: string[];
  trustLabel: string;
  summary?: string;
  body?: string[];
};

export const professionalFeed: ProfessionalFeedItem[] = [
  {
    id: 'nf1',
    category: 'Supply Chain',
    kind: 'video',
    author: 'Amara Okonkwo',
    role: 'Head of Network Operations',
    company: 'Keel & Current',
    industry: 'Logistics',
    title: 'West African cold-chain corridors are rewriting last-mile risk',
    description:
      'A field briefing on reliability gaps between Lagos, Accra, and Abidjan — and what operators are changing this quarter.',
    tags: ['Logistics', 'Africa Business'],
    timestamp: '2h',
    duration: '4:12',
    preview: 'network',
    trustLabel: 'Verified operator',
  },
  {
    id: 'nf2',
    category: 'Markets',
    kind: 'article',
    author: 'Helena Voss',
    role: 'Capital Markets Lead',
    company: 'Quiet Capital',
    industry: 'Finance',
    title: 'Patient capital is moving back into physical infrastructure',
    description:
      'A desk note on why mid-market logistics and energy assets are attracting quieter checks than software this cycle.',
    tags: ['Capital', 'Infrastructure'],
    timestamp: '4h',
    readingTime: '6 min',
    preview: 'earth',
    trustLabel: 'Identity checked',
    summary:
      'Allocators are writing longer letters for warehouses, corridors, and power — not because software stopped mattering, but because physical uptime is the scarce asset this cycle.',
    body: [
      'The last two years trained a generation of desks to treat software multiples as the default clock. That clock is slowing. The letters crossing Quiet Capital this quarter are longer, quieter, and more physical: cold storage, berth windows, and mid-market energy that can survive an audit.',
      'This is not a buy or sell signal. It is a reading of how operators are describing risk to their chairs. Patient capital is asking for recovery language — SLA breach, spare capacity, and who can act overnight — instead of a growth narrative that cannot name the exception.',
      'XIV labels this article DEMO. No market feed is connected, and no model is summarizing this page live.',
    ],
  },
  {
    id: 'nf3',
    category: 'AI',
    kind: 'video',
    author: 'Jonah Rhee',
    role: 'Applied Intelligence',
    company: 'Lumen Ledger',
    industry: 'Finance',
    title: 'Governed agents belong on the close calendar, not the demo stage',
    description:
      'How finance teams are asking for approval-bound agents instead of open-ended copilots during month-end.',
    tags: ['Finance', 'Governance'],
    timestamp: '6h',
    duration: '6:40',
    preview: 'network',
    trustLabel: 'Verified operator',
  },
  {
    id: 'nf4',
    category: 'Technology',
    kind: 'image',
    author: 'Sana El-Masri',
    role: 'Product Architect',
    company: 'Harbor Desk',
    industry: 'Operations',
    title: 'Harbor Desk’s operations surface, before public launch',
    description:
      'A still from the private beta: port-side inventory without the noise of a consumer feed.',
    tags: ['Operations', 'Product'],
    timestamp: '8h',
    preview: 'earth',
    trustLabel: 'Identity checked',
  },
  {
    id: 'nf5',
    category: 'Leadership',
    kind: 'text',
    author: 'Marcus Adeyemi',
    role: 'Chair, Operating Partners',
    company: 'Atlas Operators',
    industry: 'Operations',
    title: 'The chair packet should read like a recovery plan',
    description:
      'Overnight exceptions, two warehouses off SLA, and why the first paragraph must name the action. No cinematic still is attached because this is a text brief, not an uploaded image.',
    tags: ['Executive', 'Operations'],
    timestamp: '11h',
    trustLabel: 'Verified operator',
  },
  {
    id: 'nf6',
    category: 'Entrepreneurship',
    kind: 'question',
    author: 'Priya Raman',
    role: 'Founder',
    company: 'Nimbus Assay',
    industry: 'Healthcare',
    title: 'Who has closed a Series B without a public social graph?',
    description:
      'Looking for operators who raised inside a professional network rather than a consumer platform. Answers are not persisted in this preview.',
    tags: ['Startups', 'Healthcare'],
    timestamp: '14h',
    trustLabel: 'Identity checked',
  },
  {
    id: 'nf7',
    category: 'Innovation',
    kind: 'product',
    author: 'Theo March',
    role: 'Industrial Design',
    company: 'Vellum Health',
    industry: 'Healthcare',
    title: 'Clinic-floor hardware that stays out of the way',
    description:
      'A product sketch from a pilot cohort: instrumentation designed for operators, not a launch video. Catalog writes are not live.',
    tags: ['Healthcare', 'Hardware'],
    timestamp: '1d',
    preview: 'network',
    trustLabel: 'Verified operator',
  },
  {
    id: 'nf8',
    category: 'Business',
    kind: 'idea',
    author: 'Clara Jensen',
    role: 'Revenue Integrity',
    company: 'Northstar Logistics',
    industry: 'Logistics',
    title: 'Recognized versus pipeline as the first health signal',
    description:
      'An idea for composite business health: start with revenue integrity, not vanity volume. No idea table is written.',
    tags: ['Revenue', 'Health'],
    timestamp: '1d',
    trustLabel: 'Identity checked',
  },
  {
    id: 'nf9',
    category: 'Markets',
    kind: 'poll',
    author: 'Helena Voss',
    role: 'Capital Markets Lead',
    company: 'Quiet Capital',
    industry: 'Finance',
    title: 'What should a chair packet open with this quarter?',
    description: 'Votes stay on this device. There is no poll table and no live tally.',
    tags: ['Leadership', 'Markets'],
    timestamp: '2d',
    pollOptions: ['Recovery actions', 'Pipeline color', 'Hiring freeze notes', 'Vendor risk'],
    trustLabel: 'Identity checked',
  },
  {
    id: 'nf10',
    category: 'Technology',
    kind: 'project',
    author: 'Jonah Rhee',
    role: 'Applied Intelligence',
    company: 'Lumen Ledger',
    industry: 'Finance',
    title: 'Close-calendar agent rehearsal',
    description:
      'A collaboration sketch for approval-bound agents during month-end. No project record is created.',
    tags: ['Governance', 'Finance'],
    timestamp: '2d',
    trustLabel: 'Verified operator',
  },
];

export const discoverCategories = [
  'Companies',
  'Startups',
  'Products',
  'Ideas',
  'Industry Problems',
  'Projects',
  'Communities',
  'Creators',
] as const;

export const discoverEntities = [
  {
    id: 'de1',
    kind: 'Companies',
    name: 'Nimbus Assay',
    detail: 'Clinical operations intelligence for multi-site labs.',
    meta: 'Healthcare · Raising Series B',
  },
  {
    id: 'de2',
    kind: 'Companies',
    name: 'Keel & Current',
    detail: 'Corridor reliability for cold-chain and bulk freight.',
    meta: 'Supply Chain · Live product',
  },
  {
    id: 'de3',
    kind: 'Companies',
    name: 'Vellum Health',
    detail: 'Clinic-floor software for operators, not waiting rooms.',
    meta: 'Clinic ops · Pilot cohort',
  },
  {
    id: 'de4',
    kind: 'Startups',
    name: 'Harbor Desk',
    detail: 'A calm operations desk for port-side inventory.',
    meta: 'Operations · Private beta',
  },
  {
    id: 'de5',
    kind: 'Startups',
    name: 'Lumen Ledger',
    detail: 'Audit-ready spend mapping for mid-market finance.',
    meta: 'Finance · Invite only',
  },
  {
    id: 'de6',
    kind: 'Products',
    name: 'Keel Signals',
    detail: 'Exception radar for warehouses that drift off SLA.',
    meta: 'Supply Chain · Waitlist',
  },
  {
    id: 'de7',
    kind: 'Products',
    name: 'Harbor Desk',
    detail: 'Port inventory without the consumer-feed chrome.',
    meta: 'Operations · Early access',
  },
  {
    id: 'de8',
    kind: 'Ideas',
    name: 'Shared runbooks across plants',
    detail: 'A common language for shift handoff that does not expose people.',
    meta: 'Operations · Open brief',
  },
  {
    id: 'de9',
    kind: 'Industry Problems',
    name: 'Last-mile cold storage gaps',
    detail: 'Mapping where perishable freight loses temperature on West African corridors.',
    meta: 'Logistics · Open problem',
  },
  {
    id: 'de10',
    kind: 'Projects',
    name: 'Inventory truth sprint',
    detail: 'Night-shift volunteers mapping SKU drift before a WMS is connected.',
    meta: 'Operations · Cohort',
  },
  {
    id: 'de11',
    kind: 'Communities',
    name: 'Atlas Operators',
    detail: 'Closed circle for operators comparing corridor reliability.',
    meta: 'Supply networks · DEMO',
  },
  {
    id: 'de12',
    kind: 'Creators',
    name: 'Amara Okonkwo',
    detail: 'Field briefings on African logistics and network operations.',
    meta: 'Operator · DEMO profile',
  },
  {
    id: 'de13',
    kind: 'Creators',
    name: 'Helena Voss',
    detail: 'Patient-capital notes on physical infrastructure.',
    meta: 'Markets · DEMO profile',
  },
];

export const professionalCommunities = [
  {
    id: 'pc1',
    name: 'Atlas Operators',
    focus: 'Supply networks',
    members: '8,420',
    detail: 'Closed circle for operators comparing corridor reliability across Atlantic and African lanes.',
  },
  {
    id: 'pc2',
    name: 'Quiet Capital',
    focus: 'Patient ventures',
    members: '3,110',
    detail: 'A salon for investors who underwrite physical systems on longer clocks than software.',
  },
  {
    id: 'pc3',
    name: 'Civic Markets',
    focus: 'Public-interest business',
    members: '5,604',
    detail: 'Operators and civic buyers working on procurement that can survive an audit.',
  },
  {
    id: 'pc4',
    name: 'Harbor Circle',
    focus: 'Port operations',
    members: '1,280',
    detail: 'Night desks, berth windows, and inventory truth before a public product launch.',
  },
  {
    id: 'pc5',
    name: 'Lumen Finance',
    focus: 'Revenue integrity',
    members: '2,040',
    detail: 'Controllers and close-calendar leads who want governed intelligence, not a chatbot.',
  },
];

export const composeKinds = [
  { id: 'text', label: 'Text', detail: 'A professional update. Nothing is published.' },
  { id: 'image', label: 'Image', detail: 'A still for a product, site, or field note. Media is not stored.' },
  { id: 'video', label: 'Video', detail: 'A briefing card. Upload and storage are not connected.' },
  { id: 'article', label: 'Article', detail: 'A long-form desk note. Summarize stays prototype.' },
  { id: 'poll', label: 'Poll', detail: 'A preview poll. Votes stay on this device.' },
  { id: 'question', label: 'Question', detail: 'Ask a closed circle. Answers are not persisted.' },
  { id: 'idea', label: 'Idea', detail: 'A build note for the professional floor.' },
  { id: 'project', label: 'Project', detail: 'Describe a collaboration. No project table is written.' },
  { id: 'product', label: 'Product', detail: 'List a product sketch. Catalog writes are not live.' },
] as const;

export const composeAudiences = ['Public network', 'Followers', 'Communities', 'Company only'] as const;
export const composeIndustries = [
  'Technology',
  'Supply Chain',
  'Finance',
  'Trading & Markets',
  'Real Estate',
  'Insurance',
  'Healthcare',
  'Energy',
  'Manufacturing',
  'Retail',
] as const;
export const composeTopics = [
  'Operations',
  'Markets',
  'Leadership',
  'AI',
  'Entrepreneurship',
  'Innovation',
] as const;

export const consumerNotifications = [
  {
    id: 'nt1',
    title: 'Circle digest',
    body: 'Atlas Operators has two new threads. Mock notice only.',
  },
  {
    id: 'nt2',
    title: 'Harbor Desk invite',
    body: 'A preview seat is held. No product is live.',
  },
];

export const assistantPrompts: Record<HomeExperience, string[]> = {
  consumer: [
    'Which communities match my interests?',
    'Show early-access products in logistics.',
    'Find paid research I can complete this week.',
  ],
  employee: [
    'Summarize anonymous feedback themes.',
    'Suggest a career path without revealing my name.',
    'Draft a private wellness check-in.',
  ],
  business: [
    'Give me the executive briefing.',
    'Where is operations load concentrating?',
    'What would the security center flag first?',
  ],
  executive: [
    'Prepare the overnight brief for the chair.',
    'Where is company health most fragile?',
    'Which strategic action should move first?',
  ],
};
