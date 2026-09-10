import crypto from 'node:crypto';

export type BrainLesson = { tenantId: string; sourcePacketHash: string; lesson: string; evidenceRefs: string[]; approved: boolean; cellId: string };

export function createApprovedBrainLesson(input: Omit<BrainLesson,'cellId'>): BrainLesson {
  if (!input.approved) throw new Error('HUMAN_APPROVAL_REQUIRED');
  if (!input.tenantId.trim()) throw new Error('TENANT_REQUIRED');
  if (!input.evidenceRefs.length) throw new Error('EVIDENCE_REQUIRED');
  if (/password|secret key|api[_ -]?key|private key/i.test(input.lesson)) throw new Error('SECRET_LIKE_CONTENT_BLOCKED');
  const cellId = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return {...input, cellId};
}
