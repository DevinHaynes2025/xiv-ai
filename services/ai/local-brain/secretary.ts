import { decisionGate, type ConsequenceClass } from './decision-gate';
import { completeWithLocalModel } from './local-model';
import { searchLearning } from './learning-ledger';

export type SecretaryRequest = {
  objective: string;
  context?: string;
  consequence?: ConsequenceClass;
};

export type SecretaryBrief = {
  summary: string;
  priorities: string[];
  decisionsNeeded: string[];
  followUps: string[];
  evidenceNotes: string[];
  canExecuteLocally: boolean;
  humanApprovalRequired: boolean;
};

export async function runExecutiveSecretary(request: SecretaryRequest): Promise<SecretaryBrief> {
  const related = await searchLearning(request.objective);
  const gate = decisionGate({
    id: `secretary_${Date.now().toString(36)}`,
    action: request.objective,
    consequence: request.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const localMemory = related.slice(-8).map((entry) => `${entry.claimState}: ${entry.subject} — ${entry.summary}`).join('\n');
  const result = await completeWithLocalModel([
    'You are the XIV Executive Secretary operating in a bounded local/offline sandbox.',
    'Organize the founder/executive workload; do not impersonate a legal officer or make external commitments.',
    'Create a concise brief with headings: Summary, Priorities, Decisions Needed, Follow-ups, Evidence Notes.',
    'Do not invent calendar, email, internet, financial, legal, or business-system facts.',
    `Objective: ${request.objective}`,
    request.context ? `Context: ${request.context}` : 'No additional context.',
    localMemory ? `Approved local learning:\n${localMemory}` : 'No matching local learning found.',
  ].join('\n\n'));

  const sections = result.text.split(/\n(?=[A-Za-z ]+:)/g);
  const values = (heading: string) => {
    const section = sections.find((item) => item.toLowerCase().startsWith(`${heading.toLowerCase()}:`));
    if (!section) return [];
    return section
      .slice(section.indexOf(':') + 1)
      .split(/\n|;/)
      .map((item) => item.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  return {
    summary: values('Summary').join(' ') || result.text.slice(0, 600),
    priorities: values('Priorities'),
    decisionsNeeded: values('Decisions Needed'),
    followUps: values('Follow-ups'),
    evidenceNotes: values('Evidence Notes'),
    canExecuteLocally: gate.executableByAgent,
    humanApprovalRequired: gate.humanApprovalRequired,
  };
}
