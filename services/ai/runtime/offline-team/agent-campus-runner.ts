import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createWorkforceAgent, createCampusSpace } from './ai-workforce-campus';
import { createAgentMeeting } from './agent-campus-meetings';
import { evaluateMentalGym } from './innovation-mental-gym';

export interface CampusRunReceipt {
  generatedAt: string;
  agents: readonly ReturnType<typeof createWorkforceAgent>[];
  spaces: readonly ReturnType<typeof createCampusSpace>[];
  meeting: ReturnType<typeof createAgentMeeting>;
  gym: ReturnType<typeof evaluateMentalGym>;
  productionMutationAllowed: false;
}

export async function runCampusCycle(rootDir = resolve(process.cwd(), '..', '..', '..')): Promise<CampusRunReceipt> {
  const now = new Date().toISOString();
  const agents = Object.freeze([
    createWorkforceAgent({ agentId: 'devops-01', tenantId: 'xiv-local', department: 'DEVOPS', role: 'Build Engineer', skills: ['build', 'ci', 'observability'], evidenceRefs: ['ROLE_DEFINED:12D33'] }),
    createWorkforceAgent({ agentId: 'ai-eng-01', tenantId: 'xiv-local', department: 'AI_ENGINEERING', role: 'LLM Engineer', skills: ['ollama', 'evaluation', 'prompting'], evidenceRefs: ['ROLE_DEFINED:12D33'] }),
    createWorkforceAgent({ agentId: 'ai-hr-01', tenantId: 'xiv-local', department: 'AI_HR', role: 'Capability Coordinator', skills: ['skills', 'training', 'assignment'], evidenceRefs: ['ROLE_DEFINED:12D33'] }),
    createWorkforceAgent({ agentId: 'think-01', tenantId: 'xiv-local', department: 'THINK_TANK', role: 'Challenger', skills: ['critique', 'scenario-analysis'], evidenceRefs: ['ROLE_DEFINED:12D33'] }),
  ]);
  const spaces = Object.freeze([
    createCampusSpace({ spaceId: 'library', kind: 'LIBRARY', purpose: 'Source-backed study', tenantId: 'xiv-local' }),
    createCampusSpace({ spaceId: 'media', kind: 'MEDIA_CENTER', purpose: 'Authorized documentary and case-study learning', tenantId: 'xiv-local' }),
    createCampusSpace({ spaceId: 'gym', kind: 'MENTAL_GYM', purpose: 'Reasoning and critique exercises', tenantId: 'xiv-local' }),
    createCampusSpace({ spaceId: 'innovation', kind: 'INNOVATION_HUB', purpose: 'Sandboxed hypothesis review', tenantId: 'xiv-local' }),
  ]);
  const meeting = createAgentMeeting({ meetingId: `xiv-campus-${Date.now()}`, tenantId: 'xiv-local', kind: 'THINK_TANK', participantAgentIds: agents.map(a => a.agentId), agenda: ['Review evidence', 'Challenge assumptions', 'Select next bounded experiment'], evidenceRefs: ['CAMPUS_CYCLE:12D33'] });
  const gym = evaluateMentalGym({ exercise: { exerciseId: 'reasoning-01', skill: 'EVIDENCE', prompt: 'Separate claims from verified evidence.', rubric: ['names evidence', 'preserves uncertainty'], maxScore: 10 }, agentId: 'think-01', score: 8, evidenceRefs: ['RUBRIC_EVAL:LOCAL'] });
  const receipt = Object.freeze({ generatedAt: now, agents, spaces, meeting, gym, productionMutationAllowed: false as const });
  const outDir = resolve(rootDir, '.xiv-runtime');
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, 'agent-campus-status.json'), JSON.stringify(receipt, null, 2), 'utf8');
  return receipt;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runCampusCycle().then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exitCode = 1; });
}
