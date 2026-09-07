import { type Href } from 'expo-router';

import { experienceRoute } from '@/lib/onboarding';
import type { RoleId } from '@/types/session';

export type OsPath =
  | 'sales'
  | 'operations'
  | 'more'
  | 'warehouse'
  | 'inventory'
  | 'supply-chain'
  | 'customers'
  | 'documents'
  | 'marketing'
  | 'finance'
  | 'projects'
  | 'security'
  | 'systems'
  | 'people'
  | 'health'
  | 'profile'
  | 'assistant'
  | 'agents'
  | 'team'
  | 'workforce'
  | 'live'
  | 'cases'
  | 'africa'
  | 'global'
  | 'ops'
  | 'intelligence'
  | 'network'
  | 'meetings'
  | 'messages'
  | 'conversation'
  | 'events'
  | 'mixer'
  | 'marketplace'
  | 'promote'
  | 'ads'
  | 'story'
  | 'sources'
  | 'company'
  | 'professional'
  | 'meeting-room'
  | 'agent-room'
  | 'offline'
  | 'discover'
  | 'watchlist'
  | 'research'
  | 'sheets'
  | 'charts'
  | 'originals'
  | 'daily'
  | 'idea-room'
  | 'privacy';

export type OsEmphasis = 'operator' | 'chair';

export function osHome(role: RoleId | null): '/business' | '/executive' {
  return role === 'executive' ? '/executive' : '/business';
}

export function osEmphasis(role: RoleId | null): OsEmphasis {
  return role === 'executive' ? 'chair' : 'operator';
}

export function osHref(role: RoleId | null, path: OsPath): Href {
  const home = osHome(role);
  if (path === 'people' || path === 'workforce' || path === 'team') {
    return (role === 'executive' ? `${home}/workforce` : `${home}/people`) as Href;
  }
  return `${home}/${path}` as Href;
}

export function assistantHref(role: RoleId | null): Href {
  const home = role ? experienceRoute(role) : '/business';
  return `${home}/assistant` as Href;
}

export function canAskLiveXiv(role: RoleId | null) {
  return role === 'business_owner' || role === 'executive';
}
