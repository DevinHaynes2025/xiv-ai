import { validateAvatarGenome } from './avatar-genome-registry';
import { canPromoteHistoricalRecord } from './historical-business-tech-archive';
import { lessonCanEnterTrustedCurriculum } from './devops-programming-library';
import { canLoadOpenSourceTool } from './open-source-tool-collaboration-registry';
import { validateAgentMediaSession } from './agent-media-study-room';

validateAvatarGenome({
  avatarId: 'avatar:a', tenantId: 'tenant:a', userId: 'user:a', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  strands: [{ strandId: 's1', domain: 'TECHNICAL', capabilityRefs: ['python'], preferenceRefs: [], evidenceRefs: ['e:1'], version: 1, confidence: 0.9 }],
});

if (!canPromoteHistoricalRecord({ recordId: 'h1', title: 'Historical system', domains: ['technology'], sourceKind: 'DOCUMENT', sourceRef: 'source:1', evidenceRefs: ['e:2'], summary: 'reviewed', reviewState: 'APPROVED', confidence: 0.9, ingestedAt: new Date().toISOString() })) throw new Error('approved historical record should promote');

if (!lessonCanEnterTrustedCurriculum({ lessonId: 'l1', track: 'PYTHON', title: 'Python foundations', sourceRefs: ['src:1'], exerciseRefs: ['ex:1'], difficulty: 'FOUNDATION', approved: true }, { agentId: 'agent:1', lessonId: 'l1', score: 0.9, evidenceRefs: ['eval:1'], completedAt: new Date().toISOString() })) throw new Error('approved lesson should enter curriculum');

if (!canLoadOpenSourceTool({ toolId: 't1', name: 'tool', repositoryRef: 'repo:1', licenseRef: 'license:1', capabilityTags: ['devops'], offlineCapable: true, trust: 'APPROVED', securityReviewRefs: ['sec:1'], versionPin: '1.0.0' })) throw new Error('approved tool should load');

validateAgentMediaSession({ sessionId: 'm1', agentIds: ['agent:1','agent:2'], mediaIds: ['media:1'], startedAt: new Date().toISOString(), discussionRefs: [], evaluationRefs: [], approvedLessonRefs: [] });

console.log('12D-58 offline academy/history/genome/tool registry contracts: OK');
