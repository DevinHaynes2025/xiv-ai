export type CommandSurface = 'PHONE_POCKET' | 'DESKTOP_OPERATING_ROOM' | 'WEB';

export type CommandCenter = {
  universe: 'COMPANY';
  surfaces: readonly CommandSurface[];
  replacesHostOs: false;
};

export function openCompanyCommandCenter(): CommandCenter {
  return {
    universe: 'COMPANY',
    surfaces: ['PHONE_POCKET', 'DESKTOP_OPERATING_ROOM', 'WEB'],
    replacesHostOs: false,
  };
}
