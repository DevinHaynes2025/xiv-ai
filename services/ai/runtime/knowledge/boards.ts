import type { AiBoardId } from './types';

export const AI_BOARD_IDS: readonly AiBoardId[] = [
  'EXECUTIVE',
  'CYBERSECURITY',
  'SUPPLY_CHAIN',
  'FINANCIAL_INTELLIGENCE',
  'INNOVATION',
  'RISK',
  'GLOBAL_EXPANSION',
  'CUSTOMER',
];

export type AiBoardPosition = {
  member: string;
  stance: string;
  evidence: string | null;
};

export type AiBoardSession = {
  board: AiBoardId;
  question: string;
  positions: readonly AiBoardPosition[];
  disagreementVisible: true;
  silentMajorityPromotesFact: false;
  contradictionSeat: true;
};

export function openAiBoard(input: {
  board: AiBoardId;
  question: string;
  positions: readonly AiBoardPosition[];
}): AiBoardSession {
  return {
    board: input.board,
    question: input.question,
    positions: input.positions,
    disagreementVisible: true,
    silentMajorityPromotesFact: false,
    contradictionSeat: input.board !== 'INNOVATION' || true,
  };
}

export function aiBoardDisagreementVisible(session: AiBoardSession): boolean {
  return session.disagreementVisible === true && session.silentMajorityPromotesFact === false;
}

export function consequentialBoardHasContradictionSeat(board: AiBoardId): boolean {
  return AI_BOARD_IDS.includes(board);
}
