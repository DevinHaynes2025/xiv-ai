import {
  clearPolicyDenials,
  listSecurityCenterView,
  probeKnownPolicyDenials,
  type SecurityCenterView,
} from '@/lib/ai';

/**
 * US-SEC-01 — mobile helper for Executive Security Center.
 * Guardian read-only checks + policy denial visibility.
 * WAITING_DATA when unbound; never fabricates incidents; L4 false; no exploit tooling.
 */

export type SecurityCenterSessionResult = {
  view: SecurityCenterView;
};

export function sessionSecurityCenterView(): SecurityCenterView {
  return listSecurityCenterView();
}

export function probeSessionPolicyDenials(): SecurityCenterSessionResult {
  probeKnownPolicyDenials();
  return { view: listSecurityCenterView() };
}

export function clearSessionPolicyDenials(): SecurityCenterSessionResult {
  clearPolicyDenials();
  return { view: listSecurityCenterView() };
}
