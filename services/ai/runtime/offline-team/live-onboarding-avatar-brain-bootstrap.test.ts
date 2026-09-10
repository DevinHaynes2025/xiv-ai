import { canBootstrapAvatarBrain } from './live-onboarding-runtime';
import { bootstrapAvatarBrain } from './avatar-brain-bootstrap';
import { loadPermittedTools } from './permission-scoped-tool-loader';
import { createAvatarUniverseSession } from './avatar-universe-session';

const receipt = {
  userId: 'user-1', tenantId: 'tenant-1', state: 'ENROLLED' as const,
  identityVerified: true, mfaVerified: true, contractsAccepted: true,
  privacyConfigured: true, deviceTrusted: true, consentRefs: ['consent:1']
};
if (!canBootstrapAvatarBrain(receipt)) throw new Error('enrollment gate failed');
const brain = bootstrapAvatarBrain(receipt, false);
if (!brain.localFirst || brain.cloudSync !== 'DISABLED') throw new Error('brain bootstrap policy failed');
const tools = loadPermittedTools([{ toolId:'ollama', tenantId:'tenant-1', userId:'user-1', capabilities:['local-llm'], consentRef:'consent:tool:1', networkAllowed:false, classificationCeiling:'CONFIDENTIAL' }]);
if (tools.length !== 1) throw new Error('tool permission loader failed');
const session = createAvatarUniverseSession(brain);
if (!session.offlineReady || session.tenantId !== 'tenant-1') throw new Error('avatar universe session failed');
console.log('12D-55 live onboarding/avatar brain bootstrap contracts: OK');
