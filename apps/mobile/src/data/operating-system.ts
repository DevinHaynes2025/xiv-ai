import type { AgentRiskLevel } from '@/lib/ai';
import type { OsEmphasis } from '@/lib/os-routes';

export const DEMO_MARK = 'DEMO' as const;
export const SAMPLE_MARK = 'SAMPLE DATA' as const;

export type StoryStep = {
  label: string;
  text: string;
};

export type OsStory = {
  id: string;
  kicker: string;
  happened: string;
  why: string;
  affects: string;
  recommends: string;
  ifWeAct: string;
  risk: AgentRiskLevel;
  chain: string[];
  evidence: { id: string; label: string; detail: string }[];
};

export const fulfillmentStory: OsStory = {
  id: 'fulfillment-dallas-zone-c',
  kicker: "Today's story",
  happened: 'Fulfillment risk increased today.',
  why: 'Dallas warehouse picking time increased 14%. XIV traced the issue to congestion in Zone C caused by a surge in SKU 432 inventory.',
  affects: '287 orders could ship late.',
  recommends: 'Temporarily rebalance picking labor from Zone A to Zone C.',
  ifWeAct: 'Same-day recovery window on the Dallas wave. No live labor system is moved from this card.',
  risk: 'high',
  chain: [
    'Customer demand',
    'Sales forecast',
    'Orders',
    'Inventory',
    'Supplier',
    'Warehouse',
    'Shipment',
    'Customer experience',
    'Revenue',
  ],
  evidence: [
    { id: 'ev1', label: 'Picking time', detail: 'Dallas Zone C +14% vs yesterday. SAMPLE DATA — no WMS feed.' },
    { id: 'ev2', label: 'SKU 432 surge', detail: 'Inbound overlay parked in Zone C. SAMPLE DATA — not a live SKU record.' },
    { id: 'ev3', label: 'At-risk orders', detail: '287 orders in the same-day wave. SAMPLE DATA — not a live order book.' },
  ],
};

export const salesStalledStory: OsStory = {
  id: 'sales-stalled-410k',
  kicker: 'Sales story',
  happened: 'A $410K enterprise deal stalled after the last mutual close plan.',
  why: 'No owner follow-up in 9 days. Operations also flagged a late sample shipment on the same account.',
  affects: 'Quarter forecast color and the customer health card both move to watch.',
  recommends: 'Draft a follow-up the seller can send. Do not auto-send.',
  ifWeAct: 'The draft stays in the governed agent. Nothing leaves the device until a human sends it.',
  risk: 'medium',
  chain: ['Lead', 'Opportunity', 'Order promise', 'Inventory hold', 'Warehouse', 'Customer experience'],
  evidence: [
    { id: 'se1', label: 'Idle days', detail: '9 days since last seller note. SAMPLE DATA — CRM is NOT CONNECTED.' },
    { id: 'se2', label: 'Amount', detail: '$410K staged as commit. SAMPLE DATA — not a live pipeline row.' },
    { id: 'se3', label: 'Ops overlap', detail: 'Sample carton late on the same account. SAMPLE DATA — conceptual only.' },
  ],
};

export const warehouseHealth = {
  score: 91,
  label: 'Warehouse Health',
  insight: 'Zone C congestion is the fulfillment story today. Dallas is the only site in the DEMO set.',
};

export const warehousePulse = [
  { id: 'wp1', title: 'Orders Today', value: '1,284', detail: 'Dallas wave', spark: [0.4, 0.55, 0.5, 0.7, 0.8, 1] },
  { id: 'wp2', title: 'Orders Shipped', value: '1,019', detail: 'On the dock', spark: [0.5, 0.6, 0.58, 0.7, 0.72, 0.8] },
  { id: 'wp3', title: 'Orders At Risk', value: '287', detail: 'Zone C delay', spark: [0.2, 0.25, 0.3, 0.45, 0.6, 0.85] },
  { id: 'wp4', title: 'Inventory Accuracy', value: '97.4%', detail: 'Cycle count', spark: [0.9, 0.88, 0.92, 0.91, 0.94, 0.97] },
];

export const warehouseReceiving = [
  { id: 'wr1', title: 'Trucks expected', body: '6 inbound appointments before 18:00. SAMPLE DATA.' },
  { id: 'wr2', title: 'Delayed', body: '2 trailers late — SKU 432 overlay is already on the floor. SAMPLE DATA.' },
];

export const warehousePicking = [
  { id: 'wk1', title: 'Zone C congestion', body: 'Picking time +14%. Labor still weighted to Zone A. SAMPLE DATA.' },
  { id: 'wk2', title: 'Zone A slack', body: 'Capacity to lend two pickers for a recovery window. SAMPLE DATA.' },
];

export const warehouseShipping = [
  { id: 'ws1', title: 'On-time', body: '91% of the cut wave. At-risk remainder is the 287 DEMO orders.' },
  { id: 'ws2', title: 'Cut time', body: 'Dallas dock holds the late Zone C cartons. SAMPLE DATA.' },
];

export const warehousePutaway = [
  { id: 'wu1', title: 'SKU 432 overlay', body: 'Inbound parked in Zone C instead of reserve. SAMPLE DATA.' },
  { id: 'wu2', title: 'Open slots', body: 'Zone A still has reserve face. No live slotting engine.' },
];

export const warehousePacking = [
  { id: 'wkp1', title: 'Stations open', body: '4 of 6 pack benches active. SAMPLE DATA.' },
  { id: 'wkp2', title: 'At-risk cartons', body: 'Zone C picks arrive late to pack. SAMPLE DATA.' },
];

export const warehouseReturns = [
  { id: 'wrt1', title: 'Open returns', body: '9 cartons waiting inspection. SAMPLE DATA.' },
  { id: 'wrt2', title: 'Keel sample', body: '1 late sample on the same account as the sales stall. SAMPLE DATA.' },
];

export const warehouseExceptions = [
  { id: 'we1', title: 'Zone C congestion', body: 'The only named fulfillment exception in this DEMO set.' },
  { id: 'we2', title: 'Two late trailers', body: 'Receiving delay already on the floor. SAMPLE DATA.' },
];

export const warehouseLabor = [
  { id: 'wl1', title: 'Zone A slack', body: 'Capacity to lend two pickers. SAMPLE DATA — no labor system.' },
  { id: 'wl2', title: 'Zone C load', body: 'Picking time +14%. Recommendation stays on the story card.' },
];

export const warehousePrototypeActions = [
  { id: 'scan', label: 'Scan' },
  { id: 'receive', label: 'Receive' },
  { id: 'move', label: 'Move' },
  { id: 'pick', label: 'Confirm pick' },
  { id: 'ship', label: 'Ship' },
  { id: 'exception', label: 'Exception' },
] as const;

export const inventoryPulse = [
  { id: 'inv1', title: 'Health', value: '88', detail: 'Composite · DEMO', spark: [0.7, 0.72, 0.75, 0.8, 0.78, 0.88] },
  { id: 'inv2', title: 'Stockouts', value: '11', detail: 'Critical SKUs', spark: [0.2, 0.3, 0.28, 0.4, 0.35, 0.32] },
  { id: 'inv3', title: 'Excess', value: '6.2%', detail: 'Over cover', spark: [0.5, 0.48, 0.52, 0.55, 0.5, 0.46] },
  { id: 'inv4', title: 'Slow moving', value: '38', detail: 'SKU watch', spark: [0.4, 0.42, 0.44, 0.4, 0.38, 0.36] },
];

export const inventoryCritical = [
  { id: 'ic1', title: 'SKU 432', body: 'Surge in Dallas Zone C. Reorder risk is low; putaway risk is high. SAMPLE DATA.' },
  { id: 'ic2', title: 'SKU 118', body: 'Two-day cover on the Nordic lane. SAMPLE DATA — not a live ATP.' },
];

export const inventoryStockouts = [
  { id: 'is1', title: '11 stockouts', body: 'Critical SKUs in the DEMO book. No live ATP feed.' },
  { id: 'is2', title: 'SKU 118', body: 'Nordic lane cover is the tightest named item. SAMPLE DATA.' },
];

export const inventoryExcess = [
  { id: 'ie1', title: '6.2% over cover', body: 'SKU 432 overlay is the named excess. SAMPLE DATA.' },
  { id: 'ie2', title: 'Dallas Zone C', body: 'Excess sits where pickers need space. SAMPLE DATA.' },
];

export const inventorySlow = [
  { id: 'isl1', title: '38 slow movers', body: 'Watch list only. No markdown engine. SAMPLE DATA.' },
  { id: 'isl2', title: 'Harbor reserve', body: 'Aged packs still within SLA. SAMPLE DATA.' },
];

export const inventoryReorder = [
  { id: 'ir1', title: 'SKU 118', body: 'Two-day cover. Reorder risk is high on paper. SAMPLE DATA.' },
  { id: 'ir2', title: 'SKU 432', body: 'Do not reorder — putaway first. SAMPLE DATA.' },
];

export const inventoryDistribution = [
  { id: 'id1', title: 'Dallas', value: '41%', detail: 'Congested Zone C', share: 0.41 },
  { id: 'id2', title: 'Harbor', value: '33%', detail: 'Within SLA', share: 0.33 },
  { id: 'id3', title: 'Nordic', value: '26%', detail: 'Weather hold cleared', share: 0.26 },
];

export const inventoryRings = [
  { id: 'irg1', title: 'Health', value: 88, detail: 'Composite' },
  { id: 'irg2', title: 'Availability', value: 79, detail: '11 stockouts' },
  { id: 'irg3', title: 'Balance', value: 72, detail: 'Excess in Dallas' },
];

export const inventoryStory: OsStory = {
  id: 'inventory-sku-432',
  kicker: "Today's inventory",
  happened: 'SKU 432 excess is crowding Dallas Zone C.',
  why: 'Inbound landed faster than putaway. SKU 118 is the named reorder risk.',
  affects: 'Pickers lose face and 287 DEMO orders stay at risk.',
  recommends: 'Putaway first. Do not auto-reorder 432.',
  ifWeAct: 'No stock, PO, or transfer is written from this card.',
  risk: 'medium',
  chain: ['Demand', 'Orders', 'Inventory', 'Warehouse', 'Shipment'],
  evidence: [
    { id: 'ie1', label: 'SKU 432', detail: 'Excess overlay in Zone C. SAMPLE DATA.' },
    { id: 'ie2', label: 'SKU 118', detail: 'Two-day cover. SAMPLE DATA — not a live ATP.' },
  ],
};

export const supplyTower = [
  { id: 'sc1', title: 'Suppliers', value: 'Watch', detail: '2 late POs · DEMO' },
  { id: 'sc2', title: 'Procurement', value: 'On plan', detail: 'No live PO system' },
  { id: 'sc3', title: 'Inventory', value: '88', detail: 'Health composite' },
  { id: 'sc4', title: 'Warehouses', value: '91', detail: 'Dallas story' },
  { id: 'sc5', title: 'Transportation', value: '2 late', detail: 'Trailers · DEMO' },
  { id: 'sc6', title: 'Orders', value: '287', detail: 'At risk · DEMO' },
  { id: 'sc7', title: 'Service', value: '91%', detail: 'On-time ship' },
  { id: 'sc8', title: 'Forecast', value: 'Soft', detail: 'Sales overlap' },
];

export const supplyRisks = [
  { id: 'sr1', title: 'Fulfillment', body: 'Dallas Zone C is the only named risk in this DEMO tower.' },
  { id: 'sr2', title: 'Supplier', body: 'Two purchase orders sit late. No supplier portal is connected.' },
];

export const salesToday = [
  { id: 'st1', title: 'Hot Leads', value: '18', detail: 'Ready for a human', spark: [0.3, 0.4, 0.45, 0.5, 0.6, 0.7] },
  { id: 'st2', title: 'Pipeline Value', value: '$2.4M', detail: 'Weighted · DEMO', spark: [0.5, 0.55, 0.6, 0.58, 0.7, 0.8] },
  { id: 'st3', title: 'Deals At Risk', value: '4', detail: 'Including $410K', spark: [0.2, 0.22, 0.3, 0.35, 0.4, 0.45] },
  { id: 'st4', title: 'Follow-Ups', value: '12', detail: 'Not auto-sent', spark: [0.4, 0.42, 0.5, 0.48, 0.52, 0.55] },
];

export const salesPipeline = [
  { id: 'sp1', stage: 'Lead', value: '$180K', weight: 0.2 },
  { id: 'sp2', stage: 'Qualify', value: '$420K', weight: 0.35 },
  { id: 'sp3', stage: 'Propose', value: '$790K', weight: 0.55 },
  { id: 'sp4', stage: 'Commit', value: '$1.01M', weight: 0.85 },
];

export const salesAccounts = [
  { id: 'sa1', title: 'Keel Atlantic', body: 'Health watch · late sample carton. SAMPLE DATA — not a live account.' },
  { id: 'sa2', title: 'Harbor Retail', body: 'Expansion conversation. SAMPLE DATA — CRM is NOT CONNECTED.' },
];

export const salesLeads = [
  { id: 'sl1', title: 'Nordic cold-chain RFP', body: 'Hot · no auto-outreach. SAMPLE DATA.' },
  { id: 'sl2', title: 'Plant-3 spare parts', body: 'Warm · seller owned. SAMPLE DATA.' },
];

export const salesOpportunities = [
  { id: 'so1', title: 'Keel Atlantic commit', body: '$410K stalled · 9 idle days. SAMPLE DATA.', amount: '$410K', stage: 'Commit' },
  { id: 'so2', title: 'Harbor multi-site', body: '$260K propose. SAMPLE DATA.', amount: '$260K', stage: 'Propose' },
];

export const salesContacts = [
  { id: 'sk1', title: 'Elena Marsh', body: 'Keel Atlantic · economic buyer. SAMPLE DATA — not a live contact.' },
  { id: 'sk2', title: 'Ravi Patel', body: 'Harbor Retail · operations sponsor. SAMPLE DATA.' },
];

export const salesActivity = [
  { id: 'sy1', title: 'Last seller note', body: '9 idle days on Keel Atlantic. SAMPLE DATA — CRM is NOT CONNECTED.' },
  { id: 'sy2', title: 'Ops overlap', body: 'Late sample carton on the same account. SAMPLE DATA.' },
];

export const salesCampaigns = [
  { id: 'sm1', title: 'Q4 chair breakfast', body: 'Draft only. Nothing is sent from this desk.' },
  { id: 'sm2', title: 'Harbor expansion note', body: 'XIV Sales Agent is COMING SOON. No auto-send.' },
];

export const customerCards = [
  {
    id: 'cc1',
    title: 'Keel Atlantic',
    relationship: 'Strategic',
    orders: '14 open · 1 late sample',
    service: 'Watch',
    returns: '2 this period',
    health: '72',
  },
  {
    id: 'cc2',
    title: 'Harbor Retail',
    relationship: 'Growing',
    orders: '6 open · on time',
    service: 'Steady',
    returns: '0 this period',
    health: '88',
  },
];

export const customerStory: OsStory = {
  id: 'customer-keel-health',
  kicker: 'Customer intelligence',
  happened: 'Keel Atlantic health slipped because a sales stall and a late sample landed on the same account.',
  why: 'CRM follow-up went quiet and the Dallas wave put their carton in the at-risk set.',
  affects: 'Relationship tone and next-quarter expansion both sit on watch.',
  recommends: 'Show the seller the ops overlap. Do not invent a live integration.',
  ifWeAct: 'The chair sees one story. No customer record is written.',
  risk: 'medium',
  chain: ['Relationship', 'Orders', 'Service', 'Returns', 'Revenue'],
  evidence: [
    { id: 'ce1', label: 'Relationship', detail: 'Strategic account in the DEMO book. Not a live CRM row.' },
    { id: 'ce2', label: 'Orders', detail: '1 late sample in the Dallas wave. SAMPLE DATA.' },
    { id: 'ce3', label: 'Returns', detail: '2 returns this period. SAMPLE DATA.' },
  ],
};

export type SystemLinkStatus = 'NOT CONNECTED' | 'COMING SOON';

export const systemLinks = [
  { id: 'sys-erp', name: 'ERP', domain: 'Physical', status: 'NOT CONNECTED' as SystemLinkStatus, freshness: 'No ingest', access: 'None' },
  { id: 'sys-wms', name: 'WMS', domain: 'Physical', status: 'NOT CONNECTED' as SystemLinkStatus, freshness: 'No ingest', access: 'None' },
  { id: 'sys-tms', name: 'Transportation', domain: 'Physical', status: 'COMING SOON' as SystemLinkStatus, freshness: 'No ingest', access: 'None' },
  { id: 'sys-crm', name: 'CRM', domain: 'Digital', status: 'NOT CONNECTED' as SystemLinkStatus, freshness: 'No ingest', access: 'None' },
  { id: 'sys-docs', name: 'Documents', domain: 'Digital', status: 'COMING SOON' as SystemLinkStatus, freshness: 'No ingest', access: 'Permission-aware later' },
  { id: 'sys-mail', name: 'Messaging', domain: 'Digital', status: 'COMING SOON' as SystemLinkStatus, freshness: 'No ingest', access: 'None' },
];

export const informationDesks = [
  { id: 'im1', title: 'Knowledge', body: 'Company universe notes stay permission-aware. No private files are loaded in this preview.' },
  { id: 'im2', title: 'Documents', body: 'Contracts and packs would appear only if you are allowed to see them. Nothing is stored here.' },
  { id: 'im3', title: 'Meetings', body: 'Decision notes are conceptual. No calendar or transcript is connected.' },
];

export const moreModules: {
  id: OsPathLike;
  title: string;
  body: string;
  emphasis: OsEmphasis[];
}[] = [
  { id: 'supply-chain', title: 'Supply Chain', body: 'Physical foundation', emphasis: ['chair', 'operator'] },
  { id: 'warehouse', title: 'Warehouse', body: 'Fulfillment control tower', emphasis: ['operator', 'chair'] },
  { id: 'inventory', title: 'Inventory', body: 'Stock, excess, reorder risk', emphasis: ['operator', 'chair'] },
  { id: 'customers', title: 'Customers', body: 'Health across sales and ops', emphasis: ['chair', 'operator'] },
  { id: 'marketing', title: 'Marketing', body: 'Demand quality', emphasis: ['operator', 'chair'] },
  { id: 'projects', title: 'Projects', body: 'Decisions in motion', emphasis: ['operator', 'chair'] },
  { id: 'finance', title: 'Finance', body: 'Chair snapshot', emphasis: ['chair', 'operator'] },
  { id: 'people', title: 'People', body: 'Coverage, not surveillance', emphasis: ['chair', 'operator'] },
  { id: 'systems', title: 'Systems', body: 'What is actually connected', emphasis: ['operator', 'chair'] },
  { id: 'documents', title: 'Documents', body: 'Information foundation', emphasis: ['chair', 'operator'] },
  { id: 'security', title: 'Security', body: 'Access and vendors', emphasis: ['chair', 'operator'] },
];

type OsPathLike =
  | 'warehouse'
  | 'inventory'
  | 'supply-chain'
  | 'customers'
  | 'projects'
  | 'finance'
  | 'marketing'
  | 'people'
  | 'systems'
  | 'documents'
  | 'security';

export const peopleCoverage = [
  { id: 'pe1', title: 'Coverage', body: 'Night desk is staffed in the DEMO set. Individual names are never shown.' },
  { id: 'pe2', title: 'Climate', body: 'Anonymous employee signal stays summarized. No monitoring of people.' },
  { id: 'pe3', title: 'Demand quality', body: 'Inquiry quality would score here. SAMPLE DATA only.' },
];

export const commandPulse = {
  sales: { title: 'Sales', value: '$2.4M', detail: 'Pipeline · 4 at risk' },
  supply: { title: 'Supply chain', value: '287', detail: 'Orders at risk · Dallas' },
  customers: { title: 'Customers', value: '72', detail: 'Keel Atlantic watch' },
};

export const commandOperatingPulse = [
  { id: 'cp1', title: 'Revenue', value: '$48.2M', detail: 'Trailing · DEMO', spark: [0.4, 0.55, 0.5, 0.7, 0.85, 1] },
  { id: 'cp2', title: 'Operations', value: '74%', detail: 'Load on two sites', spark: [0.8, 0.7, 0.75, 0.62, 0.7, 0.68] },
  { id: 'cp3', title: 'Customers', value: '4.6', detail: 'Trust composite', spark: [0.6, 0.65, 0.7, 0.72, 0.8, 0.85] },
  { id: 'cp4', title: 'Supply Chain', value: '287', detail: 'Orders at risk', spark: [0.2, 0.28, 0.35, 0.5, 0.62, 0.7] },
  { id: 'cp5', title: 'Inventory', value: '88', detail: 'Health composite', spark: [0.7, 0.72, 0.75, 0.8, 0.78, 0.88] },
  { id: 'cp6', title: 'Pipeline', value: '$2.4M', detail: 'Weighted · 4 at risk', spark: [0.5, 0.55, 0.6, 0.58, 0.7, 0.8] },
];

export function moreForEmphasis(emphasis: OsEmphasis) {
  const primary = moreModules.filter((item) => item.emphasis.includes(emphasis));
  const rest = moreModules.filter((item) => !item.emphasis.includes(emphasis));
  return { primary, rest };
}
