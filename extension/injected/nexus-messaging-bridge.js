// Small in-page bridge that listens for window messages from the content script
// and calls programmatic Nexus APIs exposed on window.nexus to open/prefill the
// transfer/intent modal. This file is intentionally tiny and defensive so it can
// be audited easily.

(function () {
  const LOG_PREFIX = '[mailfi/bridge]';

  function waitForNexus(timeout = 10000) {
    return new Promise((resolve) => {
      if (window.nexus) return resolve(window.nexus);
      const start = Date.now();
      const iv = setInterval(() => {
        if (window.nexus) {
          clearInterval(iv);
          return resolve(window.nexus);
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          return resolve(null);
        }
      }, 50);
    });
  }

  // Report readiness status to the page so content scripts can enable UI
  function postNexusStatus(ready) {
    try {
      window.__mailfi_bridge = window.__mailfi_bridge || {};
      window.__mailfi_bridge.status = ready ? 'ready' : 'unavailable';
    } catch (e) {
      // ignore
    }
    try {
      window.postMessage({ type: 'MAILFI_NEXUS_READY', ready }, '*');
    } catch (e) {
      // ignore
    }
  }

  // Pending requests keyed by correlationId when nexus isn't available yet
  const pendingRequests = new Map();

  function processPendingRequestsIfReady() {
    if (!window.nexus) return;
    try {
      // announce readiness
      postNexusStatus(true);
      for (const [corr, opts] of Array.from(pendingRequests.entries())) {
        pendingRequests.delete(corr);
        // fire without re-queueing
        _openTransfer(opts, true).catch((e) => {
          console.debug(LOG_PREFIX, 'retry openTransfer failed for', corr, e);
        });
      }
    } catch (e) {
      console.debug(LOG_PREFIX, 'processPendingRequestsIfReady error', e);
    }
  }

  // Poller in case the Nexus bundle doesn't emit a status event
  let nexusPollInterval = null;
  function ensureNexusPollerRunning() {
    if (nexusPollInterval) return;
    nexusPollInterval = setInterval(() => {
      try {
        if (window.nexus) {
          console.debug(LOG_PREFIX, 'nexus detected by poller');
          clearInterval(nexusPollInterval);
          nexusPollInterval = null;
          postNexusStatus(true);
          processPendingRequestsIfReady();
        }
      } catch (e) {
        console.debug(LOG_PREFIX, 'nexus poller error', e);
      }
    }, 1000);
  }

  // Listen for status messages from nexus-init/nexus-ca and retry pending requests
  window.addEventListener('message', (ev) => {
    try {
      if (!ev || !ev.data || ev.source !== window) return;
      const d = ev.data;
      if (d.type === 'MAILFI_NEXUS_STATUS' || d.type === 'NEXUS_PROVIDER_UPDATE') {
        // give a short delay for window.nexus to be set by the bundle
        setTimeout(() => {
          // reflect new status
          postNexusStatus(!!window.nexus);
          processPendingRequestsIfReady();
        }, 50);
      }
    } catch (e) {
      // ignore
    }
  });

  async function openTransfer(opts) {
    const { recipient = null, amount = null, token = null, correlationId = null } = opts || {};
    const nexus = await waitForNexus(30000); // wait up to 30s for nexus to appear
    if (!nexus) {
      console.warn(LOG_PREFIX, 'window.nexus not available - queuing request', correlationId);
      // queue the request and wait for MAILFI_NEXUS_STATUS / NEXUS_PROVIDER_UPDATE
      const corr = correlationId || `pending-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      pendingRequests.set(corr, opts);
      // announce not-ready status
      postNexusStatus(false);
      // start a poller in case nexus never emits a status message
      ensureNexusPollerRunning();
      // notify the page that we queued the request
      window.postMessage({ type: 'MAILFI_TRANSFER_QUEUED', correlationId: corr }, '*');
      return;
    }

    // If nexus exists, perform the actual open
    return _openTransfer(opts, false);
  }

  async function _openTransfer(opts, isRetry) {
    const { recipient = null, amount = null, token = null, correlationId = null } = opts || {};
    const nexus = window.nexus;
    try {
      console.debug(LOG_PREFIX, 'opening transfer for', recipient, 'amount', amount, 'token', token, 'corr', correlationId, 'isRetry', !!isRetry);

      let intent = null;

      // Try common programmatic entry points in a safe order.
      // 1) createIntent()
      if (typeof nexus.createIntent === 'function') {
        try {
          // Attempt to create a transfer intent. Include amount/token if present.
          const intentPayload = { type: 'transfer', recipient: recipient || null };
          if (amount) intentPayload.amount = amount;
          if (token) intentPayload.token = token;
          intent = await nexus.createIntent(intentPayload);
        } catch (e) {
          console.debug(LOG_PREFIX, 'nexus.createIntent failed', e);
          intent = null;
        }
      }

      // 2) setIntentModal(open, intent?)
      if (typeof nexus.setIntentModal === 'function') {
        try {
          nexus.setIntentModal(true, intent || { recipient, amount, token });
          window.postMessage({ type: 'MAILFI_TRANSFER_STARTED', recipient, correlationId }, '*');
          attachCompletionListener(nexus, correlationId);
          return;
        } catch (e) {
          console.debug(LOG_PREFIX, 'nexus.setIntentModal failed', e);
        }
      }

      // 3) openIntentModal(intent?)
      if (typeof nexus.openIntentModal === 'function') {
        try {
          nexus.openIntentModal(intent || { recipient, amount, token });
          window.postMessage({ type: 'MAILFI_TRANSFER_STARTED', recipient, correlationId }, '*');
          attachCompletionListener(nexus, correlationId);
          return;
        } catch (e) {
          console.debug(LOG_PREFIX, 'nexus.openIntentModal failed', e);
        }
      }

      // 4) openIntent / showIntent / showIntentModal
      const altFns = ['openIntent', 'showIntent', 'showIntentModal'];
      for (const fn of altFns) {
        if (typeof nexus[fn] === 'function') {
          try {
            nexus[fn](intent || { recipient, amount, token });
            window.postMessage({ type: 'MAILFI_TRANSFER_STARTED', recipient, correlationId }, '*');
            attachCompletionListener(nexus, correlationId);
            return;
          } catch (e) {
            console.debug(LOG_PREFIX, `${fn} failed`, e);
          }
        }
      }

      // 5) Try to set state on a possible intentModal object
      try {
        if (nexus.intentModal && typeof nexus.intentModal.setState === 'function') {
          nexus.intentModal.setState({ open: true, intent: intent || { recipient, amount, token } });
          window.postMessage({ type: 'MAILFI_TRANSFER_STARTED', recipient, correlationId }, '*');
          attachCompletionListener(nexus, correlationId);
          return;
        }
      } catch (e) {
        console.debug(LOG_PREFIX, 'intentModal.setState attempt failed', e);
      }

      console.warn(LOG_PREFIX, 'no known API found to open Nexus intent modal');
      window.postMessage({ type: 'MAILFI_TRANSFER_ERROR', error: 'no_open_api', correlationId }, '*');
    } catch (err) {
      console.error(LOG_PREFIX, 'unexpected error opening transfer', err);
      window.postMessage({ type: 'MAILFI_TRANSFER_ERROR', error: String(err), correlationId }, '*');
    }
  }

  function attachCompletionListener(nexus, correlationId) {
    try {
      // If the Nexus runtime exposes an event emitter, listen for step/complete events
      // and forward them to the extension/content script for further processing.
      if (nexus.nexusEvents && typeof nexus.nexusEvents.on === 'function') {
        const onStepComplete = (data) => {
          try {
            window.postMessage({ type: 'MAILFI_TRANSFER_COMPLETE', correlationId, data }, '*');
          } catch (e) {
            console.debug(LOG_PREFIX, 'failed to post completion', e);
          }
        };

        // Many flows emit `step_complete` or `expected_steps` — listen for both.
        try { nexus.nexusEvents.on('step_complete', onStepComplete); } catch (e) {}
        try { nexus.nexusEvents.on('complete', onStepComplete); } catch (e) {}
      }
    } catch (e) {
      console.debug(LOG_PREFIX, 'attachCompletionListener error', e);
    }
  }

  // Window message listener — only accept messages from same window (page -> page)
  window.addEventListener('message', (ev) => {
    try {
      if (!ev || !ev.data || ev.source !== window) return;
      const data = ev.data;
      // quick diagnostic: respond to readiness probe
      if (data && data.type === 'MAILFI_NEXUS_PROBE') {
        try {
          const ready = !!window.nexus;
          window.postMessage({ type: 'MAILFI_NEXUS_PROBE_RESPONSE', ready }, '*');
        } catch (e) {}
        return;
      }
      if (data && data.type === 'MAILFI_OPEN_TRANSFER') {
        // Pass the whole payload (recipient, amount, token, correlationId)
        openTransfer(data);
      }
    } catch (e) {
      // swallow
      console.debug(LOG_PREFIX, 'message handler error', e);
    }
  });

  // Expose a debug helper for manual testing
  try {
    window.__mailfi_bridge = window.__mailfi_bridge || {};
    window.__mailfi_bridge.openTransfer = openTransfer;
    window.__mailfi_bridge.status = window.nexus ? 'ready' : 'unavailable';
  } catch (e) {}
})();
