import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide browser polyfills for Node.js modules needed by Nexus SDK
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        crypto: false,
        stream: false,
        path: false,
        fs: false,
      };
      // Alias some optional/server-only modules to a tiny shim so client bundling won't fail.
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@react-native-async-storage/async-storage': require.resolve('./src/shims/empty-module.js'),
        'pino-pretty': require.resolve('./src/shims/empty-module.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
