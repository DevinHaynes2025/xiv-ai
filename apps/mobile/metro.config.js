const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../../services/ai')];

// Monorepo resolution: shared services/ai modules are transformed with Expo's
// Babel preset (which references expo/virtual/env). Metro's hierarchical lookup
// from services/ai never reaches this app's node_modules, so declare it here.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// expo-sqlite web support: bundle the wa-sqlite wasm asset and send the COOP/COEP
// headers required for SharedArrayBuffer.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}
config.server = config.server ?? {};
const previousEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const wrapped = (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return middleware(req, res, next);
  };
  return previousEnhanceMiddleware ? previousEnhanceMiddleware(wrapped, server) : wrapped;
};

const serverOnly = /[\\/]services[\\/]ai[\\/](server|gemini-provider|auth|audit|executive-turn)\.ts$/;
const existing = config.resolver.blockList;
config.resolver.blockList = existing
  ? [existing, serverOnly].flat()
  : serverOnly;

module.exports = config;
