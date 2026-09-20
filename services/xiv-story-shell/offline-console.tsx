import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { listenOfflineConsole } from '../ai/runtime/offline-team/offline-system-console-http';
import type { ConsoleEvidence, ConsoleIdentity, SystemSnapshot } from '../ai/runtime/offline-team/offline-system-snapshot';
import OfflineSystemPanel, { offlineConsoleCss } from './src/app/offline-system-panel';

export function renderOfflineConsole(snapshot: SystemSnapshot): string {
  return '<!doctype html>' + renderToStaticMarkup(<html lang="en"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Offline System Console · XIV</title><style>{offlineConsoleCss}</style></head><body><OfflineSystemPanel snapshot={snapshot} /></body></html>);
}

export function startOfflineConsole(scope: ConsoleIdentity, evidence: ConsoleEvidence, port = 6060) {
  return listenOfflineConsole(scope, evidence, renderOfflineConsole, port);
}
