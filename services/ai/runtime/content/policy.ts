import { consumerMayAccessClassification } from '../security/classification';
import type { ContentItem } from './types';

export function consumerCanReadContent(item: ContentItem) {
  if (item.source === 'company' && item.visibility !== 'public') {
    return { allowed: false as const, reason: 'Consumers must not automatically gain access to private company Universes.' };
  }
  if (item.universeId && item.visibility !== 'public') {
    return { allowed: false as const, reason: 'Company data must not automatically become public content.' };
  }
  if (!consumerMayAccessClassification(item.classification)) {
    return { allowed: false as const, reason: 'Consumer cannot read classified company content.' };
  }
  return { allowed: true as const, reason: 'Consumer may read public or own-scope content.' };
}

export function companyContentIsAutomaticallyPublic(item: ContentItem) {
  return item.source === 'company' && item.visibility === 'public';
}
