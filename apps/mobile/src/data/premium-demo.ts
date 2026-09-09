/**
 * Clearly labeled demonstration data for premium UI.
 * Never presented as live. No secrets. No fabricated provider connections.
 */
export const DEMO_NOTICE =
  'DEMONSTRATION DATA. Not live. Not a connected feed. Private Company Brain is not shown.';

export const premiumHome = {
  brief: 'Morning brief is a prototype layout. No live operator feed is connected.',
  health: { title: 'Business Health', value: '—', detail: 'Live health requires an authorized company source.' },
  meetings: [{ title: 'Q3 ops review', when: 'Today · 2:00 PM', mode: 'team meeting' }],
  opportunities: [
    {
      name: 'Jordan Hale',
      title: 'VP Supply Chain',
      company: 'Northwind Logistics',
      reason: 'Reason: shared declared industry + Dallas mixer topic. Not a sensitive-trait inference.',
    },
  ],
  agents: [
    {
      name: 'Executive Agent',
      role: 'Chair intelligence',
      authority: 'L3 Human Approval',
      status: 'governed',
      task: 'No production write. L4 disabled.',
    },
  ],
  market: {
    title: 'Market Intelligence',
    body: 'World Bank and SEC adapters exist in the data fabric. This card is not a live ticker.',
    source: 'us_sec_edgar / world_bank_open_data',
    connected: false,
    confidence: 'unknown' as const,
  },
  alerts: 'Company alerts require an authorized Company Brain source. NOT CONNECTED.',
  events: [{ title: 'Dallas Business Mixer', when: 'Thu 6:00 PM', kind: 'mixer' }],
  story: {
    title: 'Fulfillment pressure',
    happened: 'Observed: public demonstration story only.',
    stance: 'observed',
    evidence: 'Evidence: sample card · not a live WMS row',
  },
};

export const premiumAgents = [
  { name: 'Executive Agent', role: 'Chair', authority: 'L3', status: 'governed', task: 'Briefs only' },
  { name: 'Finance Agent', role: 'Finance', authority: 'L1', status: 'prototype', task: 'No ledger write' },
  { name: 'Operations Agent', role: 'Ops', authority: 'L1', status: 'prototype', task: 'Read-only layout' },
  { name: 'Supply Chain Agent', role: 'Supply', authority: 'L1', status: 'prototype', task: 'No WMS move' },
  { name: 'Sales Agent', role: 'Sales', authority: 'L1', status: 'prototype', task: 'No CRM send' },
  { name: 'Security Agent', role: 'Security', authority: 'L5', status: 'governed', task: 'Cannot self-edit policy' },
  { name: 'Data Quality Agent', role: 'Quality', authority: 'L1', status: 'prototype', task: 'Scores ≠ certainty' },
  { name: 'Foresight Agent', role: 'Foresight', authority: 'L1', status: 'prototype', task: 'Forecast ≠ fact' },
  { name: 'Marketing Agent', role: 'Marketing', authority: 'L1', status: 'prototype', task: 'No auto-publish' },
  { name: 'Research Agent', role: 'Research', authority: 'L1', status: 'prototype', task: 'Citations required' },
  { name: 'Networking Agent', role: 'Network', authority: 'L1', status: 'prototype', task: 'Evidence-backed intros' },
  { name: 'Meeting Agent', role: 'Meetings', authority: 'L1', status: 'prototype', task: 'Video NOT CONNECTED' },
  { name: 'Content Agent', role: 'Content', authority: 'L3', status: 'prototype', task: 'Human approval required' },
];

export const premiumSources = [
  { source: 'World Bank Open Data', connected: true, live: true, note: 'Public macro adapter validated in 2I-D.' },
  { source: 'U.S. SEC EDGAR', connected: true, live: true, note: 'Public company adapter validated in 2I-D2.' },
  { source: 'Video meetings', connected: false, live: false, note: 'Provider not_configured.' },
  { source: 'NVIDIA compute', connected: false, live: false, note: 'Provider not_configured.' },
  { source: 'Oracle Database', connected: false, live: false, note: 'Read-only connector foundation. Not connected.' },
  { source: 'Messaging realtime', connected: false, live: false, note: 'Inbox is a prototype shell.' },
];

export const premiumAd = {
  disclosure: 'Sponsored' as const,
  headline: 'B2B warehouse software',
  body: 'Paid placement. This is not organic intelligence.',
};

export const premiumMessages = [
  { id: 'm1', from: 'Avery Chen', preview: 'Can we move the intro to Thursday?', kind: 'direct' },
  { id: 'm2', from: 'Ops channel', preview: 'Wave notes stay in-tenant.', kind: 'company_channel' },
];
