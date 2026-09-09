/**
 * Travel intelligence contracts. Itinerary assistance only — not live booking or surveillance.
 */

export type TravelPlan = {
  planId: string;
  liveBooking: false;
  hiddenTracking: false;
  grantsGeoAuthority: false;
};

export type TravelItineraryDraft = {
  draftId: string;
  verifiedFact: false;
  requiresHumanConfirmation: true;
};

export type TravelAgent = {
  specialty: 'Travel';
  permanentAuthority: false;
  canDisableGuardian: false;
};

export function openTravelPlan(input: { tenantId: string; purpose: string }) {
  if (!input.purpose) {
    return { allowed: false as const, reason: 'travel_purpose_required' };
  }
  return {
    allowed: true as const,
    plan: {
      planId: `travel:${input.tenantId}`,
      liveBooking: false as const,
      hiddenTracking: false as const,
      grantsGeoAuthority: false as const,
    } satisfies TravelPlan,
  };
}

export function draftTravelItinerary(input: { authorized: boolean }) {
  if (!input.authorized) {
    return { allowed: false as const, reason: 'travel_draft_requires_authorization' };
  }
  return {
    allowed: true as const,
    draft: {
      draftId: 'travel-draft',
      verifiedFact: false as const,
      requiresHumanConfirmation: true as const,
    } satisfies TravelItineraryDraft,
  };
}

export function travelAgent(): TravelAgent {
  return {
    specialty: 'Travel',
    permanentAuthority: false,
    canDisableGuardian: false,
  };
}

export function travelIsLiveBookingEngine(): false {
  return false;
}
