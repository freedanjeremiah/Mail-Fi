import { join } from 'path';
import { existsSync } from 'fs';
import type { NextConfig } from 'next';

// Keep the config minimal to avoid pulling in dev-only plugins during typecheck.
const baseConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      // Resolve buffer and process/browser if available. If process/browser
      // isn't installed (can happen in some environments), fall back to a
      // local shim so next.js's server-side config evaluation doesn't crash.
      let processFallback: string | false = false;
      try {
        processFallback = require.resolve('process/browser');
      } catch (e) {
        const localShim = join(__dirname, 'shims', 'process-browser.js');
        processFallback = existsSync(localShim) ? localShim : false;
      }

      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        buffer: require.resolve('buffer/'),
        ...(processFallback ? { process: processFallback } : {}),
        crypto: false,
        stream: false,
        path: false,
        fs: false,
      };

      const root = join(__dirname);
      const shimsDir = join(root, 'shims');

      config.resolve.alias = config.resolve.alias || {};
      const asyncShim = join(shimsDir, 'async-storage-shim.js');
      const pinoShim = join(shimsDir, 'pino-pretty-shim.js');

      if (existsSync(asyncShim)) {
        config.resolve.alias['@react-native-async-storage/async-storage'] = asyncShim;
      }
      if (existsSync(pinoShim)) {
        config.resolve.alias['pino-pretty'] = pinoShim;
        config.resolve.alias['pino-pretty/default'] = pinoShim;
      }

      // Provide Buffer and process globally during bundling so modules that
      // access these at module-init time (before runtime polyfills) won't fail.
      // Require webpack lazily so this file stays compatible with lightweight
      // typechecks and environments that don't expose webpack types.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    return config;
  },
};

export default baseConfig;
