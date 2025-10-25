// Inject Nexus SDK bundle into page (like nexus-hyperliquid-poc)
function injectNexusBundle() {
  try {
    // Inject the full Nexus SDK React app
    const nexusScript = chrome.runtime.getURL('injected/nexus-ca.js');
    
    if (!document.querySelector(`script[src="${nexusScript}"]`)) {
      const s = document.createElement('script');
      s.src = nexusScript;
      s.async = true;
      (document.documentElement || document.head || document.body).appendChild(s);
      console.log('[Mail-Fi] Injected nexus-ca.js into page');
    }
  } catch (e) {
    console.error('[Mail-Fi] Failed to inject Nexus SDK:', e);
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
  // Button is enabled - payment happens in popup window
  btn.disabled = false;
  btn.title = 'Pay with Avail - Opens payment window';
  btn.setAttribute('aria-label', 'Pay with Avail');
  btn.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 6px; color: white; font-weight: 500; font-size: 13px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
      </svg>
      <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2;">
        <span style="font-size: 11px; opacity: 0.9;">Pay with Avail</span>
        <span style="font-size: 14px; font-weight: 700;">USDC</span>
      </div>
    </div>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Extract wallet address from Gmail's "To" field (where email addresses go)
    let recipientAddress = '';
    let amount = '0.001'; // Default amount
    
    try {
      // Try multiple selectors for Gmail's "To" field
      const toField = composeWindow.querySelector('input[name="to"]') as HTMLInputElement;
      const toSpans = composeWindow.querySelectorAll('span[email]');
      const toInputs = composeWindow.querySelectorAll('input[type="text"]');
      
      if (toField?.value) {
        recipientAddress = toField.value.trim();
      } else if (toSpans.length > 0) {
        recipientAddress = toSpans[0].getAttribute('email') || '';
      } else if (toInputs.length > 0) {
        // Check all text inputs for 0x addresses
        for (const input of toInputs) {
          const value = (input as HTMLInputElement).value?.trim();
          if (value && value.startsWith('0x') && value.length === 42) {
            recipientAddress = value;
            break;
          }
        }
      }
      
      console.log('[Mail-Fi] Extracted from To field:', recipientAddress);
    } catch (err) {
      console.warn('[Mail-Fi] Failed to extract recipient:', err);
    }

    // Extract amount from subject line
    try {
      const subjectField = composeWindow.querySelector('input[name="subjectbox"]') as HTMLInputElement;
      if (subjectField?.value) {
        const subject = subjectField.value.trim();
        console.log('[Mail-Fi] Subject line:', subject);
        
        // Look for amount pattern like "0.01 USDC" or "0.01" or "1.5 USDC"
        const amountMatch = subject.match(/(\d+\.?\d*)\s*(?:USDC)?/i);
        if (amountMatch) {
          amount = amountMatch[1];
          console.log('[Mail-Fi] Extracted amount from subject:', amount);
        }
      }
    } catch (err) {
      console.warn('[Mail-Fi] Failed to extract amount from subject:', err);
    }

    // Validate it's an Ethereum address
    if (!recipientAddress || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      alert('Please enter a valid Ethereum wallet address (0x...) in the "To" field\n\nExample: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      return;
    }

    const correlationId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    pendingTransfers.set(correlationId, { 
      composeWindow, 
      options: { 
        correlationId,
        recipient: recipientAddress,
        amount: amount,
        token: 'USDC'
      } 
    });

    console.log('[Mail-Fi] Opening payment for:', recipientAddress, 'Amount:', amount);

    // Open Nexus payment window with TransferButton widget
    const params = new URLSearchParams({
      recipient: recipientAddress,
      amount: amount,
      token: 'USDC',
      chainId: '11155420',
      correlationId
    });

    const paymentUrl = `http://localhost:3000/nexus-panel?${params.toString()}`;
    
    const popup = window.open(
      paymentUrl,
      'MailFiPayment',
      'width=500,height=700,menubar=no,toolbar=no,location=no'
    );

    if (!popup) {
      alert('Please allow popups for Gmail');
      return;
    }

    // Monitor popup and handle completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('[Mail-Fi] Payment window closed');
      }
    }, 500);
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

// Note: Button is always enabled since payment happens in popup window
// The popup window handles Nexus SDK initialization and wallet connection

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
  
  console.log('[Mail-Fi] Initializing Gmail integration');
  
  // Inject the Nexus payment system into the page
  injectNexusBundle();
  
  // Observe and inject payment buttons into compose windows
  observeComposeWindows();
  // Listen for payment success from popup window
  window.addEventListener('message', (ev) => {
    try {
      if (!ev || !ev.data) return;
      const d = ev.data;
      
      if (d.type === 'MAILFI_PAYMENT_SUCCESS') {
        console.log('[Mail-Fi] Payment successful:', d.data);
        
        // Find the compose window and insert payment snippet
        for (const [correlationId, entry] of pendingTransfers.entries()) {
          const payload = d.data || {};
          insertPaymentSnippet(entry.composeWindow, payload, entry.options);
          pendingTransfers.delete(correlationId);
          break; // Only insert once
        }
      } else if (d.type === 'MAILFI_TRANSFER_COMPLETE') {
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
      }
    } catch (e) {
      console.debug('[Mail-Fi] message handler error', e);
    }
  });

  chrome.runtime.sendMessage({ type: 'PING' }, () => {});
})();
