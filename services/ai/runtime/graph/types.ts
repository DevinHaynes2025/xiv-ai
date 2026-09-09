export type BusinessEntityKind =
  | 'company'
  | 'supplier'
  | 'customer'
  | 'warehouse'
  | 'factory'
  | 'port'
  | 'carrier'
  | 'product'
  | 'industry'
  | 'market'
  | 'country'
  | 'region'
  | 'investor'
  | 'partner';

export type BusinessRelationshipKind =
  | 'supplies'
  | 'buys_from'
  | 'ships_through'
  | 'operates_in'
  | 'competes_with'
  | 'partners_with'
  | 'owns'
  | 'manufactures'
  | 'distributes'
  | 'invests_in';

export type BusinessEntity = {
  entityId: string;
  kind: BusinessEntityKind;
  label: string;
  persisted: false;
};

export type BusinessRelationship = {
  relationshipId: string;
  kind: BusinessRelationshipKind;
  fromId: string;
  toId: string;
  persisted: false;
};
