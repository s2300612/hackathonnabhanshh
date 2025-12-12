const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// SVG support (react-native-svg-transformer)
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    // Polyfill Node modules required by @supabase/realtime-js (ws) for RN
    stream: path.resolve(__dirname, "metro-polyfills/stream.js"),
    ws: path.resolve(__dirname, "metro-polyfills/ws.js"),
    http: path.resolve(__dirname, "metro-polyfills/http.js"),
    https: path.resolve(__dirname, "metro-polyfills/https.js"),
    url: path.resolve(__dirname, "metro-polyfills/url.js"),
    util: path.resolve(__dirname, "metro-polyfills/util.js"),
    events: path.resolve(__dirname, "metro-polyfills/events.js"),
    buffer: path.resolve(__dirname, "metro-polyfills/buffer.js"),
    crypto: path.resolve(__dirname, "metro-polyfills/crypto.js"),
    net: path.resolve(__dirname, "metro-polyfills/net.js"),
    tls: path.resolve(__dirname, "metro-polyfills/tls.js"),
    zlib: path.resolve(__dirname, "metro-polyfills/zlib.js"),
  },
  blockList: [
    /node_modules\/@supabase\/realtime-js\/node_modules\/ws\/.*/,
  ],
};

module.exports = withNativeWind(config, { input: "./global.css" });
