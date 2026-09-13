import type { ApprovedDataContext, OrganizationContext, StructuredAgentOutput } from '@/lib/ai';

export class XivAiRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type ErrorBody = {
  error?: { code?: string; message?: string };
};

export type AiServiceProbe = {
  reachable: boolean;
};

export type ExecutiveBrief = {
  generatedAt: string;
  dataStatus: 'live' | 'unavailable' | 'not_configured' | 'stale' | 'prototype';
  freshnessSummary: string;
  topRisks: string[];
  topOpportunities: string[];
  criticalChanges: string[];
  recommendedPriorities: string[];
  decisionsAwaitingApproval: string[];
  confidence: 'low' | 'medium' | 'high';
  sources: string[];
  financialImpactClaimed: false;
  financialImpactNote: string;
};

export type ExecutiveBriefResponse = {
  brief: ExecutiveBrief;
  connectionStatus: string;
};
export type CommunityJoinPreview = { status:'REVIEW_REQUIRED'; membershipCreated:false; accountsConnected:false; devicesControlled:false; earningsGuaranteed:false; partnerStatus:'NOT_CONFIGURED'; communityId:string; nextSteps:string[] };
export type FeedbackIntakePreview = { status:'REVIEW_REQUIRED'; audience:'CUSTOMER'|'CONSUMER'|'COMMUNITY'; feedbackDigest:string; feedbackCharacters:number; consentScope:'IMPROVEMENT_CANDIDATE_ONLY'; learningCandidate:{state:'AWAITING_HUMAN_REVIEW';promoted:false}; feedbackStored:false; rawFeedbackReturned:false; modelWeightsModified:false; neuralPathwayActivated:false; profileInferred:false; compensationGuaranteed:false; externalAccountsAccessed:false; humanReviewRequired:true; nextSteps:string[] };
export type FeedbackGovernanceStatus = { encryptedLocalAdapter:'IMPLEMENTED'; encryption:'AES_256_GCM_INJECTED_KEY'; productionStorage:'NOT_CONFIGURED'; productionWritesEnabled:false; consentWithdrawal:'APPEND_ONLY_TOMBSTONE'; physicalDeletion:'OPERATOR_WORKFLOW_REQUIRED'; automaticPathwayPromotion:false; modelWeightTraining:false; moderationReceipts:'SIGNED_INDEPENDENT_REVIEW'; deletionExecution:'DISABLED' };
export type EcosystemAlignmentReport = { protocol:{version:string;evidenceMode:'SIGNED_RECEIPTS_ONLY';authorityPath:string[];universalInstallationClaimed:false;vendorPartnershipsClaimed:false;chipEmbeddingClaimed:false;automaticAccountAccess:false;automaticAgentAuthority:false};targets:{target:string;layer:string;state:'NOT_CONFIGURED'|'REVIEW_REQUIRED'|'CONFIGURED';reason:string;compatibilityTarget:true;partnershipClaimed:false;productionLive:false;installedOnDevices:false;grantsAuthority:false}[];summary:{targetCount:number;configuredCount:number;productionLiveCount:0;partnershipCount:0;universallyInstalled:false};assurance:{receiptTrust:'SIGNED_RECEIPTS_ONLY';trustStore:'NOT_CONFIGURED';auditChain:'NOT_CONNECTED';independentReview:'REQUIRED';productionActivation:'DISABLED';publicDetail:'AGGREGATES_ONLY'} };

function friendlyMessage(code: string) {
  if (code === 'unauthorized') return 'Your session expired. Sign in again to use the agent.';
  if (code === 'timeout') return 'The request timed out. Try again.';
  if (code === 'malformed') return 'The assistant returned an unusable response. Try again.';
  if (code === 'gemini_failed' || code === 'not_configured') {
    return 'Gemini could not complete this request. Try again in a moment.';
  }
  if (code === 'unreachable') return 'The AI service is unreachable. Make sure it is running, then try again.';
  return 'The AI service is unavailable. Try again in a moment.';
}

function mapServerError(code: string) {
  if (code === 'not_configured' || code === 'unavailable') return 'gemini_failed';
  return code;
}

function apiBaseUrl() {
  return process.env.EXPO_PUBLIC_XIV_AI_URL?.replace(/\/$/, '') ?? '';
}

/** Live Gemini lives on the XIV AI service. This is the only implemented turn route. */
const LIVE_TURN_PATH = '/v1/executive/turn';
const TURN_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 4_000;

let requestSeq = 0;

function nextRequestId() {
  requestSeq += 1;
  return `m${Date.now().toString(36)}-${requestSeq}`;
}

function logAgentRequest(stage: 'start' | 'response' | 'complete' | 'timeout', requestId: string, status?: number) {
  if (!__DEV__) return;
  const suffix = status !== undefined ? ` ${status}` : '';
  console.warn(`[xiv-agent] request:${stage} ${requestId}${suffix}`);
}

function withAbortTimer(ms: number) {
  const controller = new AbortController();
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) controller.abort();
  }, ms);
  const settle = () => {
    settled = true;
    clearTimeout(timer);
  };
  return { controller, settle };
}

export async function probeAiService(): Promise<AiServiceProbe> {
  const base = apiBaseUrl();
  if (!base) return { reachable: false };

  try {
    const { controller, settle } = withAbortTimer(HEALTH_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/health`, { method: 'GET', signal: controller.signal });
      return { reachable: response.ok };
    } finally {
      settle();
    }
  } catch {
    return { reachable: false };
  }
}

export async function requestExecutiveBrief(accessToken: string): Promise<ExecutiveBriefResponse> {
  const base = apiBaseUrl();
  if (!base) throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  const { controller, settle } = withAbortTimer(TURN_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/v1/business/executive-brief`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as ExecutiveBriefResponse | ErrorBody | null;
    if (!response.ok) {
      const raw = payload && 'error' in payload ? payload.error?.code : undefined;
      const code = mapServerError(raw ?? (response.status === 401 ? 'unauthorized' : 'unavailable'));
      throw new XivAiRequestError(code, friendlyMessage(code));
    }
    if (!payload || !('brief' in payload) || !payload.brief || !Array.isArray(payload.brief.recommendedPriorities)) {
      throw new XivAiRequestError('malformed', friendlyMessage('malformed'));
    }
    return payload;
  } catch (caught) {
    if (caught instanceof XivAiRequestError) throw caught;
    if (caught instanceof Error && caught.name === 'AbortError') throw new XivAiRequestError('timeout', friendlyMessage('timeout'));
    throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  } finally { settle(); }
}

export async function requestCommunityJoinPreview(accessToken:string,communityId:string):Promise<CommunityJoinPreview>{
  const base=apiBaseUrl();if(!base)throw new XivAiRequestError('unreachable',friendlyMessage('unreachable'));
  const response=await fetch(`${base}/v1/community/join/preview`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({communityId})});
  const payload=await response.json().catch(()=>null) as CommunityJoinPreview|ErrorBody|null;
  if(!response.ok||!payload||!('nextSteps'in payload)||!Array.isArray(payload.nextSteps)){const code=response.status===401?'unauthorized':'malformed';throw new XivAiRequestError(code,friendlyMessage(code));}
  return payload;
}

export async function requestFeedbackIntakePreview(input:{accessToken:string;audience:'CUSTOMER'|'CONSUMER'|'COMMUNITY';feedback:string;improvementConsent:boolean}):Promise<FeedbackIntakePreview>{
  const base=apiBaseUrl();if(!base)throw new XivAiRequestError('unreachable',friendlyMessage('unreachable'));
  const response=await fetch(`${base}/v1/feedback/intake/preview`,{method:'POST',headers:{Authorization:`Bearer ${input.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({audience:input.audience,feedback:input.feedback,improvementConsent:input.improvementConsent})});
  const payload=await response.json().catch(()=>null) as FeedbackIntakePreview|ErrorBody|null;
  if(!response.ok||!payload||!('learningCandidate'in payload)||payload.learningCandidate.state!=='AWAITING_HUMAN_REVIEW'){const code=response.status===401?'unauthorized':'malformed';throw new XivAiRequestError(code,friendlyMessage(code));}
  return payload;
}

export async function requestFeedbackGovernanceStatus(accessToken:string):Promise<FeedbackGovernanceStatus>{
  const base=apiBaseUrl();if(!base)throw new XivAiRequestError('unreachable',friendlyMessage('unreachable'));
  const response=await fetch(`${base}/v1/feedback/governance/status`,{headers:{Authorization:`Bearer ${accessToken}`}});
  const payload=await response.json().catch(()=>null) as FeedbackGovernanceStatus|ErrorBody|null;
  if(!response.ok||!payload||!('productionWritesEnabled'in payload)||payload.productionWritesEnabled!==false){const code=response.status===401?'unauthorized':'malformed';throw new XivAiRequestError(code,friendlyMessage(code));}
  return payload;
}

export async function requestEcosystemAlignmentReport(accessToken:string):Promise<EcosystemAlignmentReport>{
  const base=apiBaseUrl();if(!base)throw new XivAiRequestError('unreachable',friendlyMessage('unreachable'));
  const response=await fetch(`${base}/v1/ecosystem/alignment/report`,{headers:{Authorization:`Bearer ${accessToken}`}});
  const payload=await response.json().catch(()=>null) as EcosystemAlignmentReport|ErrorBody|null;
  if(!response.ok||!payload||!('summary'in payload)||!('assurance'in payload)||payload.summary.universallyInstalled!==false||payload.assurance.productionActivation!=='DISABLED'){const code=response.status===401?'unauthorized':'malformed';throw new XivAiRequestError(code,friendlyMessage(code));}
  return payload;
}

export async function requestExecutiveTurn(input: {
  accessToken: string;
  message: string;
  role: string;
  organizationContext?: OrganizationContext;
  approvedDataContext?: ApprovedDataContext;
}): Promise<StructuredAgentOutput> {
  const base = apiBaseUrl();
  if (!base) {
    throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  }

  const requestId = nextRequestId();
  logAgentRequest('start', requestId);

  let response: Response;
  const { controller, settle } = withAbortTimer(TURN_TIMEOUT_MS);
  try {
    response = await fetch(`${base}${LIVE_TURN_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Xiv-Request-Id': requestId,
      },
      body: JSON.stringify({
        message: input.message,
        role: input.role,
        organizationContext: input.organizationContext,
        approvedDataContext: input.approvedDataContext,
      }),
      signal: controller.signal,
    });
  } catch (caught) {
    if (caught instanceof Error && caught.name === 'AbortError') {
      logAgentRequest('timeout', requestId);
      throw new XivAiRequestError('timeout', friendlyMessage('timeout'));
    }
    throw new XivAiRequestError('unreachable', friendlyMessage('unreachable'));
  } finally {
    settle();
  }

  logAgentRequest('response', requestId, response.status);

  let payload: { output?: StructuredAgentOutput } & ErrorBody = {};
  try {
    payload = (await response.json()) as { output?: StructuredAgentOutput } & ErrorBody;
  } catch {
    throw new XivAiRequestError('malformed', friendlyMessage('malformed'));
  }

  if (!response.ok) {
    const raw = payload.error?.code ?? (response.status === 401 ? 'unauthorized' : 'gemini_failed');
    const code = mapServerError(raw);
    throw new XivAiRequestError(code, friendlyMessage(code));
  }

  const output = payload.output;
  if (
    !output?.summary ||
    !output.recommendation ||
    !output.riskLevel ||
    typeof output.requiresApproval !== 'boolean' ||
    !Array.isArray(output.evidence)
  ) {
    throw new XivAiRequestError('malformed', friendlyMessage('malformed'));
  }

  logAgentRequest('complete', requestId, response.status);
  return output;
}
