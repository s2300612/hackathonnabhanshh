// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Configure Metro to resolve Node.js modules for React Native compatibility
// This prevents bundling errors when Supabase tries to import Node.js modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    // Resolve Node.js modules to empty polyfills (React Native uses native implementations)
    // These are required because @supabase/realtime-js includes 'ws' package which imports Node.js stdlib
    stream: path.resolve(__dirname, 'metro-polyfills/stream.js'),
    ws: path.resolve(__dirname, 'metro-polyfills/ws.js'),
    http: path.resolve(__dirname, 'metro-polyfills/http.js'),
    https: path.resolve(__dirname, 'metro-polyfills/https.js'),
    url: path.resolve(__dirname, 'metro-polyfills/url.js'),
    util: path.resolve(__dirname, 'metro-polyfills/util.js'),
    events: path.resolve(__dirname, 'metro-polyfills/events.js'),
    buffer: path.resolve(__dirname, 'metro-polyfills/buffer.js'),
    crypto: path.resolve(__dirname, 'metro-polyfills/crypto.js'),
    net: path.resolve(__dirname, 'metro-polyfills/net.js'),
    tls: path.resolve(__dirname, 'metro-polyfills/tls.js'),
    zlib: path.resolve(__dirname, 'metro-polyfills/zlib.js'),
  },
  // Block ws package from being processed (Supabase will use native WebSocket)
  blockList: [
    /node_modules\/@supabase\/realtime-js\/node_modules\/ws\/.*/,
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
