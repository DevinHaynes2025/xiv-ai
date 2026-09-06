export type PublishingKind =
  | 'company_update'
  | 'announcement'
  | 'product_information'
  | 'founder_update'
  | 'training_material'
  | 'business_report'
  | 'public_company_media'
  | 'private_universe_media';

export type PublishingState = 'draft' | 'private' | 'internal' | 'public' | 'archived';

export type CompanyPublication = {
  publicationId: string;
  organizationId: string;
  universeId: string;
  kind: PublishingKind;
  state: PublishingState;
  authorId: string;
  createdAt: string;
  prototype: boolean;
};
