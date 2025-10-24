// Inject the page-level Nexus bundle into the page so Nexus runs in the page context (wallets accessible).
function injectNexusBundle() {
  try {
    // During development we serve a UMD build from the Next dev server.
    // Expose it to the page as a global so the page initializer (`nexus-init`) can load it.
    // Avoid injecting inline scripts (Gmail CSP blocks inline); instead inject
    // a small external config script from the extension that sets the UMD URL.
    try {
      const cfgSrc = chrome.runtime.getURL('injected/nexus-config.js');
      if (!document.querySelector(`script[src="${cfgSrc}"]`)) {
        const cfgScript = document.createElement('script');
        cfgScript.src = cfgSrc;
        cfgScript.async = true;
        (document.documentElement || document.head || document.body).appendChild(cfgScript);
        console.debug('[Mail-Fi] injected nexus-config.js into page');
      }
    } catch (e) {
      console.debug('[Mail-Fi] failed to inject nexus-config.js', e);
    }
    // Also request background to set the variable in page context as a fallback
    try {
      const devUmd = 'http://localhost:3000/nexus-umd.js';
      chrome.runtime.sendMessage({ type: 'ENSURE_NEXUS_CONFIG', url: devUmd }, (resp) => {
        if (!resp || resp.ok !== true) {
          console.debug('[Mail-Fi] background ENSURE_NEXUS_CONFIG failed', resp);
        } else {
          console.debug('[Mail-Fi] background ENSURE_NEXUS_CONFIG executed');
        }
      });
    } catch (e) {
      // ignore
    }

    // Prefer prebuilt POC bundle if present in extension; fallback to nexus-init loader
    const preferred = chrome.runtime.getURL('injected/nexus-ca.js');
    const fallback = chrome.runtime.getURL('injected/nexus-init.js');

    if (!document.querySelector(`script[src="${preferred}"]`)) {
      const s = document.createElement('script');
      s.src = preferred;
      s.async = true;
      (document.documentElement || document.head || document.body).appendChild(s);
      console.debug('[Mail-Fi] injected nexus-ca.js into page');
      // Also inject the small messaging bridge that listens for MAILFI_OPEN_TRANSFER
      try {
        const bridge = chrome.runtime.getURL('injected/nexus-messaging-bridge.js');
        if (!document.querySelector(`script[src="${bridge}"]`)) {
          const b = document.createElement('script');
          b.src = bridge;
          b.async = true;
          (document.documentElement || document.head || document.body).appendChild(b);
          console.debug('[Mail-Fi] injected nexus-messaging-bridge.js into page');
        }
      } catch (e) {
        console.debug('[Mail-Fi] failed to inject nexus messaging bridge', e);
      }
      return;
    }

    if (!document.querySelector(`script[src="${fallback}"]`)) {
      const s = document.createElement('script');
      s.src = fallback;
      s.async = true;
      (document.documentElement || document.head || document.body).appendChild(s);
      console.debug('[Mail-Fi] injected nexus-init.js into page');
      try {
        const bridge = chrome.runtime.getURL('injected/nexus-messaging-bridge.js');
        if (!document.querySelector(`script[src="${bridge}"]`)) {
          const b = document.createElement('script');
          b.src = bridge;
          b.async = true;
          (document.documentElement || document.head || document.body).appendChild(b);
          console.debug('[Mail-Fi] injected nexus-messaging-bridge.js into page');
        }
      } catch (e) {
        console.debug('[Mail-Fi] failed to inject nexus messaging bridge', e);
      }
    }
  } catch (e) {
    console.warn('[Mail-Fi] failed to inject nexus bundle into page', e);
  }
}

type TransferOptions = { recipient?: string; amount?: string | null; token?: string | null; correlationId?: string };

const pendingTransfers = new Map<string, { composeWindow: Element; options: TransferOptions }>();

function dispatchOpenTransferWithOptions(options: TransferOptions) {
  try {
    window.postMessage({ type: 'MAILFI_OPEN_TRANSFER', ...options }, '*');
    console.debug('[Mail-Fi] posted MAILFI_OPEN_TRANSFER', options);
  } catch (e) {
    console.warn('[Mail-Fi] failed to post MAILFI_OPEN_TRANSFER', e);
  }
}

// Insert a short payment snippet into the compose body for the given composeWindow
function insertPaymentSnippet(composeWindow: Element, payload: any, options?: TransferOptions) {
  try {
    const body = composeWindow.querySelector('[aria-label="Message Body"], [role="textbox"][contenteditable="true"]') as HTMLElement | null;
    const amount = options?.amount || payload?.amount || '';
    const token = options?.token || payload?.token || '';
    const txHash = payload?.txHash || payload?.transactionHash || payload?.txid || null;
    const intentUrl = payload?.intentUrl || null;
    let snippet = '';

    if (txHash) {
      snippet = `Paid ${amount || ''} ${token || ''} via Avail. Transaction: ${txHash}`;
    } else if (intentUrl) {
      snippet = `Paid ${amount || ''} ${token || ''} via Avail. Details: ${intentUrl}`;
    } else {
      snippet = `Paid ${amount || ''} ${token || ''} via Avail.`.trim();
    }

    if (!body) {
      console.warn('[Mail-Fi] compose body not found to insert payment snippet');
      return;
    }

    // Focus the editor and insert text at caret
    body.focus();
    // Use execCommand as a simple cross-compat insertion method
    try {
      document.execCommand('insertText', false, '\n' + snippet + '\n');
    } catch (e) {
      // Fallback: append a div
      const wrapper = document.createElement('div');
      wrapper.textContent = snippet;
      body.appendChild(wrapper);
    }
  } catch (e) {
    console.error('[Mail-Fi] failed to insert payment snippet', e);
  }
}

function injectComposeButton(composeWindow: Element) {
  const toolbar = composeWindow.querySelector('[role="toolbar"]');
  console.log('[Mail-Fi] Toolbar found:', !!toolbar, composeWindow);
  if (!toolbar) return;

  const existingBtn = toolbar.querySelector('.mailfi-compose-btn');
  if (existingBtn) return; // already injected

  const btn = document.createElement('button');
  btn.className = 'mailfi-compose-btn';
  // start disabled until bridge reports Nexus ready
  btn.disabled = true;
  btn.title = 'Nexus loading…';
  btn.setAttribute('aria-label', 'Pay with Avail');
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    </svg>
    <span style="margin-left: 4px;">Pay with Avail</span>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure the Nexus bundle is injected into the page before sending message
    injectNexusBundle();

    // Try to extract recipient from compose "To" field
    const toField = composeWindow.querySelector('input[name="to"]') as HTMLInputElement;
    const recipient = toField?.value || '';

    // Prompt for optional prefill amount/token (simple fast-path UI)
    let amount: string | null = null;
    let token: string | null = null;
    try {
      amount = window.prompt?.('Amount to send (optional)', '') || null;
      token = window.prompt?.('Token (e.g. AVAIL, USDC) (optional)', '') || null;
    } catch (e) {
      // ignore
    }

    // Correlation id so we can map completion back to this compose window
    const correlationId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const options = { recipient: recipient || undefined, amount, token, correlationId };
    pendingTransfers.set(correlationId, { composeWindow, options });

    // Post a window-level message the injected bundle can handle
    dispatchOpenTransferWithOptions(options);
  });

  // Insert before the last item (usually "More options" or trash)
  try {
    const lastBtn = toolbar.querySelector('[role="button"]:last-child');
    if (lastBtn && lastBtn.parentElement === toolbar) {
      toolbar.insertBefore(btn, lastBtn);
    } else {
      toolbar.appendChild(btn);
    }
  } catch (e) {
    try {
      toolbar.appendChild(btn);
    } catch (err) {
      console.error('[Mail-Fi] Failed to insert compose button', err);
    }
  }
}

// Enable any Mail-Fi compose buttons when Nexus is ready
function enableComposeButtonsWhenReady() {
  window.addEventListener('message', (ev) => {
    try {
      if (!ev || !ev.data || ev.source !== window) return;
      const d = ev.data;
      if (d.type === 'MAILFI_NEXUS_READY') {
        const ready = !!d.ready;
        const buttons = document.querySelectorAll('.mailfi-compose-btn');
        buttons.forEach((b) => {
          try {
            (b as HTMLButtonElement).disabled = !ready;
            (b as HTMLButtonElement).title = ready ? 'Pay with Avail' : 'Nexus loading…';
          } catch (e) {}
        });
      }
    } catch (e) {
      // ignore
    }
  });
}

function observeComposeWindows() {
  const observer = new MutationObserver(() => {
    const composeWindows = document.querySelectorAll('[role="dialog"], div[class*="M9"]');
    console.log('[Mail-Fi] Found compose windows:', composeWindows.length);
    composeWindows.forEach((win) => {
      injectComposeButton(win);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const existingComposeWindows = document.querySelectorAll('[role="dialog"], div[class*="M9"]');
  console.log('[Mail-Fi] Initial compose windows:', existingComposeWindows.length);
  existingComposeWindows.forEach((win) => {
    injectComposeButton(win);
  });
}

(function init() {
  if (!/mail\.google\.com/.test(location.host)) return;
  // Inject the Nexus bundle into the page immediately so it's available to any compose button
  injectNexusBundle();
  observeComposeWindows();
  // Wire up readiness -> enable buttons
  enableComposeButtonsWhenReady();
  // Listen for completion events posted by the in-page bridge and insert snippets
  window.addEventListener('message', (ev) => {
    try {
      if (!ev || !ev.data || ev.source !== window) return;
      const d = ev.data;
      if (d.type === 'MAILFI_TRANSFER_COMPLETE') {
        const correlationId = d.correlationId;
        const payload = d.data || {};
        if (!correlationId) return;
        const entry = pendingTransfers.get(correlationId);
        if (entry) {
          insertPaymentSnippet(entry.composeWindow, payload, entry.options);
          pendingTransfers.delete(correlationId);
        }
      } else if (d.type === 'MAILFI_TRANSFER_ERROR') {
        console.warn('[Mail-Fi] transfer error', d.error, d.correlationId);
      } else if (d.type === 'MAILFI_TRANSFER_STARTED') {
        // Could show a temporary UI indicator in the compose; for now log it
        console.debug('[Mail-Fi] transfer started', d.correlationId);
      }
    } catch (e) {
      console.debug('[Mail-Fi] message handler error', e);
    }
  });

  chrome.runtime.sendMessage({ type: 'PING' }, () => {});
})();
