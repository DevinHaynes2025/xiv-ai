import { composeClientVisual } from './client-visual-component-gateway';
import { OfflineChartDataService } from './offline-chart-data-service';
import { buildInteractionContract } from './visual-interaction-contract';

const payload = composeClientVisual({
  tenantId: 'tenant-a',
  title: 'Supplier variability',
  narrative: 'Lead-time variation increased inventory buffers and fulfillment pressure.',
  component: 'LINE',
  formFactor: 'PHONE',
  points: [{ label: 'lead-time', value: 18, evidenceRefs: ['evidence:1'] }],
  confidence: 0.82,
  requiresHumanApproval: true,
  classification: 'CONFIDENTIAL',
});
if (!payload.payloadId.startsWith('visual:tenant-a:')) throw new Error('payload id missing');

const cache = new OfflineChartDataService();
cache.put({ cacheKey: 'supplier', tenantId: 'tenant-a', createdAt: new Date().toISOString(), sourceHash: 'sha256:abc', payload, classification: 'CONFIDENTIAL' });
if (!cache.get('tenant-a', 'supplier')) throw new Error('tenant cache missing');
if (cache.get('tenant-b', 'supplier')) throw new Error('cross-tenant cache leak');

const phone = buildInteractionContract('PHONE');
const desktop = buildInteractionContract('DESKTOP');
if (!phone.modes.includes('TOUCH')) throw new Error('phone touch contract missing');
if (desktop.drilldownDepth <= phone.drilldownDepth) throw new Error('desktop drilldown should be deeper');

console.log('12D-49 mobile/desktop visual component gateway contracts: OK');
