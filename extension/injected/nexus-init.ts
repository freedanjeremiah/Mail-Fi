// This script runs in the page context (not the extension isolated world).
// It attempts to initialize the Avail Nexus SDK with a page provider (window.ethereum)
// and exposes it as window.nexus so page-level code (and our extension iframe) can use it.
// This script attempts to initialize Nexus in the page context without bundling the SDK.
// It will use an existing `window.nexus` if available, or attempt to load a UMD bundle
// from a CDN if a URL is provided via window.__MAILFI_NEXUS_UMD_URL (optional).

(function init() {
  try {
    const win: any = window;

    const notifyStatus = () => {
      window.postMessage({ type: 'MAILFI_NEXUS_STATUS', available: !!win.nexus }, '*');
    };

    // If the page already has nexus, just notify and return
    if (win.nexus) {
      console.debug('[mailfi/injected] window.nexus already present');
      notifyStatus();
      return;
    }

    // Helper to initialize with provider if nexus constructor is present
    const tryInitWithConstructor = async () => {
      try {
        if (typeof win.NexusSDK === 'function') {
          const provider = win.ethereum || null;
          const ca = new win.NexusSDK();
          if (provider && ca && typeof ca.initialize === 'function') {
            await ca.initialize(provider);
            win.nexus = ca;
            console.debug('[mailfi/injected] Nexus initialized via UMD NexusSDK');
            notifyStatus();
            return true;
          }
        }
      } catch (e) {
        console.warn('[mailfi/injected] tryInitWithConstructor failed', e);
      }
      return false;
    };

    // If a UMD URL is configured, load it and attempt init
    const umdUrl = (win.__MAILFI_NEXUS_UMD_URL as string) || null;
    if (umdUrl) {
      const s = document.createElement('script');
      s.src = umdUrl;
      s.onload = async () => {
        await tryInitWithConstructor();
      };
      s.onerror = () => {
        console.warn('[mailfi/injected] failed to load nexus UMD from', umdUrl);
        notifyStatus();
      };
      document.documentElement.appendChild(s);
      return;
    }

    // No UMD configured: wait briefly for wallets or page scripts to expose Nexus
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      if (win.nexus) return notifyStatus();
      const ok = await tryInitWithConstructor();
      if (ok) return;
      if (attempts < 10) {
        setTimeout(tick, 200);
      } else {
        notifyStatus();
      }
    };
    setTimeout(tick, 200);

    // Handshake listener
    window.addEventListener('message', (ev) => {
      if (!ev?.data) return;
      if (ev.data?.type === 'MAILFI_GET_NEXUS') {
        window.postMessage({ type: 'MAILFI_NEXUS_STATUS', available: !!win.nexus }, '*');
      }
    });
  } catch (err) {
    console.error('[mailfi/injected] unexpected error', err);
  }
})();
