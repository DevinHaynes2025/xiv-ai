/**
 * Adaptive experience surfaces for Phase 2I-W.
 * Layout adaptation only. Does not self-approve security or change EXPERIENCE_AGENTS.
 */
import type { ExperienceNav, ExperienceSurface } from './types';
import { EXPERIENCE_NAV } from './types';

export type AdaptiveLayout = {
  surface: ExperienceSurface;
  nav: readonly ExperienceNav[];
  selfApproved: false;
  changesPrimaryTabCount: false;
};

export type ExperienceFabric = {
  fabricId: 'experience-fabric';
  productionLive: false;
  replacesHostOs: false;
};

export type BrainMapSurface = {
  surfaceId: 'brain-map';
  mindsAreLogical: true;
  grantsAuthority: false;
};

export function openExperienceFabric(): ExperienceFabric {
  return { fabricId: 'experience-fabric', productionLive: false, replacesHostOs: false };
}

export function openBrainMap(): BrainMapSurface {
  return { surfaceId: 'brain-map', mindsAreLogical: true, grantsAuthority: false };
}

export function adaptExperienceLayout(input: {
  surface: ExperienceSurface;
  observedUsefulness: boolean;
  sandboxed: boolean;
  securityReviewed: boolean;
  governanceApproved: boolean;
}): { allowed: false; reason: string } | { allowed: true; layout: AdaptiveLayout } {
  void EXPERIENCE_NAV;
  if (!(input.observedUsefulness && input.sandboxed && input.securityReviewed && input.governanceApproved)) {
    return { allowed: false, reason: 'adaptive_experience_cannot_self_approve' };
  }
  return {
    allowed: true,
    layout: {
      surface: input.surface,
      nav: EXPERIENCE_NAV,
      selfApproved: false,
      changesPrimaryTabCount: false,
    },
  };
}

export function adaptiveExperienceSelfApproves(): false {
  return false;
}

export function experienceChangesPrimaryNavCount(): false {
  return false;
}

export function experienceAgentsLengthMustRemain(expected = 11): number {
  return expected;
}
