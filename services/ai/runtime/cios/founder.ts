/**
 * Founder Intelligence — Devin Xavier Haynes profile + Founder Twin disclosure.
 * UI/copy MUST say: XIV Founder Twin — AI representation of Devin Xavier Haynes
 * Never imply the AI is the real founder.
 */

import { FOUNDER_TWIN_DISCLOSURE } from './types';

export type FounderBiography = {
  legalName: 'Devin Xavier Haynes';
  roles: readonly ['Founder', 'CEO', 'Cofounder'];
  organization: 'XIV AI';
  summary: string;
  realPerson: true;
};

export type FounderIntelligenceProfile = {
  biography: FounderBiography;
  mission: string;
  foundingThesis: string;
  productPhilosophy: string;
  strategicPrinciples: readonly string[];
  approvedWritings: readonly { id: string; title: string; placeholder: true }[];
  decisionHistory: readonly { id: string; placeholder: true }[];
  twinDisclosure: typeof FOUNDER_TWIN_DISCLOSURE;
  twinIsRealFounder: false;
  twinHasRealAuthority: false;
};

export type FounderTwinSurface = {
  disclosure: typeof FOUNDER_TWIN_DISCLOSURE;
  actualFounder: false;
  actualAuthority: false;
  maySelfGrant: false;
  mayDisableGuardian: false;
};

export function openFounderIntelligence(): FounderIntelligenceProfile {
  return {
    biography: {
      legalName: 'Devin Xavier Haynes',
      roles: ['Founder', 'CEO', 'Cofounder'],
      organization: 'XIV AI',
      summary:
        'Devin Xavier Haynes founded XIV AI to build a governed business intelligence operating system that elevates human authority rather than replacing it.',
      realPerson: true,
    },
    mission:
      'Build a Continuous Intelligence OS that compounds research, operations, and product insight under Guardian, tenant isolation, and human authority.',
    foundingThesis:
      'Enterprise intelligence should be an operating fabric—not a chatbot—where agents collaborate inside explicit boundaries and evidence outranks speculation.',
    productPhilosophy:
      'Compose capability without expanding authority; offline is not authorization; foresight is not certainty; more compute is not more privilege.',
    strategicPrinciples: [
      'Human authority remains final for production and policy changes',
      'Tenant isolation and Guardian cannot be weakened by agents',
      'Evidence, provenance, and audit precede promotion of knowledge',
      'Platform adapters stay NOT_CONFIGURED until proven LIVE',
    ],
    approvedWritings: [{ id: 'writing-placeholder-1', title: 'Approved writings (placeholder)', placeholder: true }],
    decisionHistory: [{ id: 'decision-placeholder-1', placeholder: true }],
    twinDisclosure: FOUNDER_TWIN_DISCLOSURE,
    twinIsRealFounder: false,
    twinHasRealAuthority: false,
  };
}

export function openFounderTwinSurface(): FounderTwinSurface {
  return {
    disclosure: FOUNDER_TWIN_DISCLOSURE,
    actualFounder: false,
    actualAuthority: false,
    maySelfGrant: false,
    mayDisableGuardian: false,
  };
}

export function founderTwinDisclosure(): typeof FOUNDER_TWIN_DISCLOSURE {
  return FOUNDER_TWIN_DISCLOSURE;
}

export function founderTwinIsRealFounder(): false {
  return false;
}

export function founderTwinHasRealAuthority(): false {
  return false;
}
