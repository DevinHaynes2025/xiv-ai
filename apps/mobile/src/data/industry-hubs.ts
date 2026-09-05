export type IndustryHubId = 'trading' | 'real-estate' | 'insurance';

export type HubSection = {
  id: string;
  title: string;
  body: string;
  items: { title: string; detail: string }[];
};

export type IndustryHub = {
  id: IndustryHubId;
  name: string;
  kicker: string;
  summary: string;
  disclaimer: string;
  agent: {
    name: string;
    status: 'coming_soon';
    note: string;
  };
  metrics: { title: string; value: string; detail: string }[];
  sections: HubSection[];
};

export const industryHubs: IndustryHub[] = [
  {
    id: 'trading',
    name: 'Trading & Markets',
    kicker: 'Markets desk',
    summary: 'A professional markets floor for overview, research, education, and community — not a brokerage.',
    disclaimer:
      'DEMO only. XIV does not promise returns, execute trades, or issue guaranteed buy/sell signals. No live market feed is connected.',
    agent: {
      name: 'AI Market Assistant',
      status: 'coming_soon',
      note: 'Trading Research Agent has no Gemini route yet. Only the existing Business/Executive agent is ACTIVE.',
    },
    metrics: [
      { title: 'Session tone', value: 'Quiet', detail: 'Sample desk color — not a live index' },
      { title: 'Watchlist', value: '8 names', detail: 'Local DEMO list' },
      { title: 'Calendar', value: '3 prints', detail: 'Sample economic events' },
    ],
    sections: [
      {
        id: 'overview',
        title: 'Market Overview',
        body: 'A terminal-style scan of the session. Figures are sample copy until a licensed feed exists.',
        items: [
          { title: 'Rates desk', detail: 'Sample: front-end quieter than last print. Not a recommendation.' },
          { title: 'Credit tone', detail: 'Sample: mid-market spreads described as orderly. DEMO.' },
        ],
      },
      {
        id: 'watchlists',
        title: 'Watchlists',
        body: 'Names you would keep on a pad. Nothing is brokered from this list.',
        items: [
          { title: 'Corridor operators', detail: 'Keel & Current · DEMO ticker card' },
          { title: 'Clinic ops', detail: 'Nimbus Assay · DEMO ticker card' },
        ],
      },
      {
        id: 'news',
        title: 'Market News',
        body: 'Headlines for operators. No wire is connected.',
        items: [{ title: 'Physical assets stay in the letters', detail: 'Quiet Capital desk note · DEMO' }],
      },
      {
        id: 'research',
        title: 'Research',
        body: 'Longer notes for chairs. Not investment advice.',
        items: [{ title: 'Patient capital and uptime', detail: 'Sample research card · DEMO' }],
      },
      {
        id: 'education',
        title: 'Trading Education',
        body: 'How a desk reads risk. Education only — no trade tickets.',
        items: [{ title: 'Reading a chair packet', detail: 'Lesson outline · DEMO' }],
      },
      {
        id: 'communities',
        title: 'Communities',
        body: 'Rooms that already exist as DEMO circles on Discover.',
        items: [{ title: 'Quiet Capital', detail: 'Patient ventures · DEMO membership' }],
      },
      {
        id: 'ideas',
        title: 'Ideas',
        body: 'Operator ideas, not signals.',
        items: [{ title: 'Overnight exception language', detail: 'From the professional feed · DEMO' }],
      },
      {
        id: 'calendar',
        title: 'Economic Calendar',
        body: 'Sample prints. Times are illustrative.',
        items: [{ title: 'Labor print (sample)', detail: 'Tuesday · DEMO calendar' }],
      },
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    kicker: 'Property desk',
    summary: 'Listings, markets, clients, and neighborhood context for operators — not an appraisal shop.',
    disclaimer:
      'DEMO only. XIV does not claim legal appraisal or valuation authority. No listing MLS or deed record is connected.',
    agent: {
      name: 'AI Real Estate Agent',
      status: 'coming_soon',
      note: 'Real Estate Agent has no backend route. Only the existing Business/Executive agent is ACTIVE.',
    },
    metrics: [
      { title: 'Open listings', value: '12', detail: 'Sample inventory' },
      { title: 'Active leads', value: '5', detail: 'DEMO pipeline' },
      { title: 'Deals in motion', value: '2', detail: 'No closing system' },
    ],
    sections: [
      {
        id: 'listings',
        title: 'Listings',
        body: 'Property cards for the floor. Photos are cinematic placeholders, not uploaded assets.',
        items: [{ title: 'Harbor loft, berth district', detail: 'Sample listing · DEMO' }],
      },
      {
        id: 'markets',
        title: 'Markets',
        body: 'Neighborhood tone, not a certified valuation.',
        items: [{ title: 'Port-adjacent absorption', detail: 'Sample market note · DEMO' }],
      },
      {
        id: 'clients',
        title: 'Clients',
        body: 'Relationship list. No CRM write.',
        items: [{ title: 'Atlas Operators desk', detail: 'Sample client · DEMO' }],
      },
      {
        id: 'leads',
        title: 'Leads',
        body: 'Inbound interest. Local preview only.',
        items: [{ title: 'Clinic-floor site search', detail: 'Vellum Health · DEMO' }],
      },
      {
        id: 'deals',
        title: 'Deals',
        body: 'Stages without a closing engine.',
        items: [{ title: 'Letter of intent rehearsal', detail: 'No documents executed · DEMO' }],
      },
      {
        id: 'neighborhood',
        title: 'Neighborhood Intelligence',
        body: 'Context for operators. Not a legal survey.',
        items: [{ title: 'Night-desk access and freight windows', detail: 'Sample brief · DEMO' }],
      },
      {
        id: 'documents',
        title: 'Documents',
        body: 'A vault sketch. No files are stored.',
        items: [{ title: 'Offering memo placeholder', detail: 'Storage not wired · DEMO' }],
      },
      {
        id: 'marketing',
        title: 'Marketing',
        body: 'Listing stories for the professional feed.',
        items: [{ title: 'Quiet launch packet', detail: 'Composer preview · DEMO' }],
      },
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance',
    kicker: 'Coverage desk',
    summary: 'Clients, policies, renewals, and education for operators — not a carrier or binder.',
    disclaimer:
      'DEMO only. XIV does not provide binding coverage or regulated underwriting. No policy admin system is connected.',
    agent: {
      name: 'AI Insurance Agent',
      status: 'coming_soon',
      note: 'Insurance Agent has no backend route. Only the existing Business/Executive agent is ACTIVE.',
    },
    metrics: [
      { title: 'Clients', value: '18', detail: 'Sample book' },
      { title: 'Renewals', value: '4', detail: 'DEMO calendar' },
      { title: 'Open claims', value: '1', detail: 'Support sketch only' },
    ],
    sections: [
      {
        id: 'clients',
        title: 'Clients',
        body: 'A book of business preview. No carrier feed.',
        items: [{ title: 'Northstar Logistics', detail: 'Sample account · DEMO' }],
      },
      {
        id: 'policies',
        title: 'Policies',
        body: 'Coverage language for education. Not a binder.',
        items: [{ title: 'Cargo delay endorsement (sample)', detail: 'Not issued · DEMO' }],
      },
      {
        id: 'leads',
        title: 'Leads',
        body: 'Inbound interest. Local only.',
        items: [{ title: 'Clinic-floor equipment cover', detail: 'Vellum Health · DEMO' }],
      },
      {
        id: 'renewals',
        title: 'Renewals',
        body: 'Dates on a pad. No billing run.',
        items: [{ title: 'Q4 corridor program', detail: 'Sample renewal · DEMO' }],
      },
      {
        id: 'education',
        title: 'Education',
        body: 'How operators talk about risk transfer. Not advice to bind.',
        items: [{ title: 'Reading an exception vs a claim', detail: 'Lesson outline · DEMO' }],
      },
      {
        id: 'claims',
        title: 'Claims Support',
        body: 'A support sketch. No FNOL is filed.',
        items: [{ title: 'Temperature excursion packet', detail: 'Checklist only · DEMO' }],
      },
      {
        id: 'marketing',
        title: 'Marketing',
        body: 'Education posts for the professional floor.',
        items: [{ title: 'Renewal season brief', detail: 'Composer preview · DEMO' }],
      },
    ],
  },
];

export function industryHubById(id: string | undefined) {
  return industryHubs.find((hub) => hub.id === id) ?? null;
}
