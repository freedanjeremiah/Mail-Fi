// Load polyfills only in the browser to avoid server-side build/runtime errors.
// Some libraries (Nexus, crypto-related) expect `Buffer` and `process` globals.
// Keep this module minimal and safe for Next.js app/router.

if (typeof window !== 'undefined') {
  // Dynamically import to avoid including these modules in the server bundle.
  void import('buffer').then(({ Buffer }) => {
    try {
      (window as any).Buffer = Buffer;
    } catch (e) {
      // ignore in case assignment fails in odd environments
    }
  }).catch(() => {});

  void import('process/browser').then((proc) => {
    try {
      (window as any).process = proc.default || proc;
    } catch (e) {
      // ignore
    }
  }).catch(() => {});

  try {
    // Some libs check `global` for Node-like globals.
    (window as any).global = window;
  } catch (e) {
    // ignore
  }
}

export {};
