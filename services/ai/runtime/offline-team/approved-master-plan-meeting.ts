import { runHeartbeatMeeting, type HeartbeatOptions } from './agent-tool-heartbeat-fabric';

/** Founder-uploaded revision; changes require review, not a request-body override. */
export const APPROVED_MASTER_PLAN_SHA256 = 'd66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c' as const;

/** Public CLI boundary. A digest match binds the document revision, not agent compliance. */
export async function runApprovedMasterPlanMeeting(options: HeartbeatOptions & { masterPlanSha256: string }) {
  if (typeof options.masterPlanSha256 !== 'string'
    || options.masterPlanSha256.toLowerCase() !== APPROVED_MASTER_PLAN_SHA256) {
    throw new Error('master-plan revision is not approved; no model request was made');
  }
  const packet = await runHeartbeatMeeting({ ...options, masterPlanSha256: APPROVED_MASTER_PLAN_SHA256 });
  return Object.freeze({ ...packet, masterPlanRevisionVerified: true as const, approvalScope: 'DOCUMENT_REVISION_ONLY' as const });
}
