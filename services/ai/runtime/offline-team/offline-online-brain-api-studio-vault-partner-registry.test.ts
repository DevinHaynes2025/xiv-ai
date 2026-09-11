import { deriveBrainMode, assessRuntimeStatus } from './offline-online-brain-runtime';
import { validateApiEndpoint } from './xiv-api-studio';
import { canAccessVaultSecret } from './ceo-secret-vault-policy';
import { isVerifiedPartner } from './partner-industry-adapter-registry';
import { validateAgentIdentity } from './agent-individuality-policy';
import { canActivatePathway } from './neural-pathway-router';

const mode = deriveBrainMode({ ollamaReachable: true, networkAllowed: false });
if (mode !== 'OFFLINE') throw new Error('expected offline mode');

const status = assessRuntimeStatus({ ollamaReachable: true, localModel: 'qwen2.5-coder:7b', cpuDetected: true, gpuDetected: true, gpuVerified: false, networkAllowed: false, topSecretExternalRoutingAllowed: false, productionMutationAllowed: false, checkedAt: new Date().toISOString() });
if (status !== 'DEGRADED') throw new Error('unverified GPU should degrade status');

const apiErrors = validateApiEndpoint({ id: 'local-story', tenantId: 'xiv', name: 'Story API', method: 'POST', path: '/story', environment: 'LOCAL_ONLY', visibility: 'PRIVATE', requiredScopes: ['story:read'], secretRef: 'vault://xiv/story', topSecretAllowed: false, humanApprovalRequired: false });
if (apiErrors.length) throw new Error(apiErrors.join(','));

if (!canAccessVaultSecret({ tenantId: 'xiv', secretId: 'strategy', classification: 'TOP_SECRET', requesterRole: 'CEO', delegatedByCeo: false, purpose: 'review', humanApproved: true })) throw new Error('CEO should be allowed');

if (isVerifiedPartner({ id: 'target', name: 'Example', industry: 'OTHER', stage: 'TARGET', dataClasses: [], consentRequired: true, regulatedData: false })) throw new Error('target must not be verified partner');

const agentErrors = validateAgentIdentity({ agentId: 'devops-1', tenantId: 'xiv', role: 'DEVOPS', goals: ['reliability'], memoryNamespace: 'xiv:devops-1', policyVersion: '1', decisionStyle: 'BALANCED', autonomyLevel: 2 });
if (agentErrors.length) throw new Error(agentErrors.join(','));

if (!canActivatePathway({ tenantId: 'xiv', fromNode: 'case:A', toNode: 'lesson:B', relation: 'SUPPORTS', evidenceRefs: ['receipt:1'], confidence: 0.8, approved: true, source: 'CASE_STUDY' })) throw new Error('approved evidence-backed pathway should activate');

console.log('12D-61 offline/online brain API studio vault partner registry contracts: OK');
