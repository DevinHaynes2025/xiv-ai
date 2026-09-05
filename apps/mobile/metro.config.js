const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../../services/ai')];

const serverOnly = /[\\/]services[\\/]ai[\\/](server|gemini-provider|auth|audit|executive-turn)\.ts$/;
const existing = config.resolver.blockList;
config.resolver.blockList = existing
  ? [existing, serverOnly].flat()
  : serverOnly;

module.exports = config;
