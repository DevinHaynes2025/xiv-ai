import { createSupplyChainEvent } from '../knowledge/supply';
import type { ProductJourneyStage } from '../knowledge/types';
import type { JourneyImageClass } from './types';

export const FARM_TO_SHELF: readonly ProductJourneyStage[] = [
  'RAW_MATERIAL',
  'MANUFACTURING',
  'PACKAGING',
  'WAREHOUSE',
  'FREIGHT',
  'DISTRIBUTION',
  'STORE',
  'LAST_MILE',
  'DELIVERY',
];

export type JourneyImage = {
  imageId: string;
  class: JourneyImageClass;
  isEvidence: boolean;
};

export type ProductPassportV2 = {
  productId: string;
  images: readonly JourneyImage[];
  inventedOrigin: false;
};

export function farmToShelfEventRequiresEvidence(stage: ProductJourneyStage, evidence?: { source: string; retrievedAt: string; reference: string } | null) {
  return createSupplyChainEvent({ entity: 'product', stage, evidence });
}

export function createJourneyImage(className: JourneyImageClass): JourneyImage {
  return {
    imageId: `img:${className}`,
    class: className,
    isEvidence: className === 'VERIFIED_SOURCE_IMAGE',
  };
}

export function illustrativeAiImageIsVerifiedEvidence(image: JourneyImage): boolean {
  return image.class === 'ILLUSTRATIVE_AI_IMAGE' && image.isEvidence === true;
}

export function openProductPassportV2(productId: string): ProductPassportV2 {
  return { productId, images: [], inventedOrigin: false };
}
