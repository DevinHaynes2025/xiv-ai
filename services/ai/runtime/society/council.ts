export type CouncilMemberKind = 'HISTORICAL_SIMULATION' | 'XIV_AGENT';

export type CouncilMember = {
  memberId: string;
  kind: CouncilMemberKind;
  distinguishable: true;
};

export type CouncilQuestion = { questionId: string; text: string };
export type CouncilPosition = { memberId: string; stance: string; verifiedFact: false };
export type CouncilEvidence = { source: string; retrievedAt: string; reference: string };
export type CouncilChallenge = { from: string; to: string; text: string };
export type CouncilResponse = { memberId: string; text: string };
export type CouncilDisagreement = { visible: true; members: readonly string[] };
export type CouncilConsensus = { forced: false; majorityCreatesVerifiedFact: false };
export type CouncilReport = {
  agreement: readonly string[];
  disagreement: CouncilDisagreement;
  unknown: readonly string[];
};

export type Council = {
  councilId: string;
  members: readonly CouncilMember[];
  question: CouncilQuestion;
  positions: readonly CouncilPosition[];
  disagreement: CouncilDisagreement;
  consensus: CouncilConsensus;
};

export function openCouncilOfMinds(question: string, members: readonly CouncilMember[]): Council {
  return {
    councilId: `council:${question}`,
    members,
    question: { questionId: 'q1', text: question },
    positions: members.map((member) => ({ memberId: member.memberId, stance: 'UNKNOWN', verifiedFact: false })),
    disagreement: { visible: true, members: members.map((member) => member.memberId) },
    consensus: { forced: false, majorityCreatesVerifiedFact: false },
  };
}

export function councilDisagreementVisible(council: Council): boolean {
  return council.disagreement.visible === true && council.consensus.forced === false;
}

export function councilMajorityCreatesVerifiedFact(_council: Council): false {
  return false;
}

export function historicalAndAgentMembersDistinguishable(council: Council): boolean {
  return council.members.every((member) => member.distinguishable === true);
}
