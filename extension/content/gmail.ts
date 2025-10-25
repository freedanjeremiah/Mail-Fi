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

// Insert a detailed payment snippet into the compose body for the given composeWindow
function insertPaymentSnippet(composeWindow: Element, payload: any, options?: TransferOptions) {
  try {
    const body = composeWindow.querySelector('[aria-label="Message Body"], [role="textbox"][contenteditable="true"]') as HTMLElement | null;
    if (!body) {
      console.warn('[Mail-Fi] compose body not found to insert payment snippet');
      return;
    }

    // Extract transaction details from payload
    const amount = options?.amount || payload?.amount || '';
    const token = options?.token || payload?.token || 'USDC';
    const txHash = payload?.txHash || payload?.transactionHash || payload?.txid || null;
    const intentId = payload?.intentId || payload?.intent?.id || null;
    const explorerUrl = payload?.explorerUrl || payload?.intent?.explorerUrl || null;
    const recipient = options?.recipient || '';
    
    // Get destination chain from URL params or default to Optimism
    const urlParams = new URLSearchParams(window.location.search);
    const destinationChain = urlParams.get('destinationChain') || 'optimism';
    
    // Create rich HTML snippet
    const snippet = document.createElement('div');
    snippet.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      max-width: 600px;
    `;
    
    snippet.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">🎉</span>
        <strong style="color: #0369a1; font-size: 16px;">Payment Completed via Avail Nexus</strong>
      </div>
      
      <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
          <div><strong style="color: #374151;">Amount:</strong> <span style="color: #059669;">${amount} ${token}</span></div>
          <div><strong style="color: #374151;">Destination:</strong> <span style="color: #7c3aed;">${destinationChain === 'arbitrum' ? 'Arbitrum Sepolia' : 'Optimism Sepolia'}</span></div>
          <div><strong style="color: #374151;">Recipient:</strong> <span style="font-family: monospace; color: #6b7280;">${recipient.slice(0, 6)}...${recipient.slice(-4)}</span></div>
          <div><strong style="color: #374151;">Status:</strong> <span style="color: #059669; font-weight: 600;">✅ Completed</span></div>
        </div>
      </div>
      
      ${txHash ? `
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;"><strong>Transaction Hash:</strong></div>
        <div style="font-family: monospace; font-size: 12px; color: #475569; word-break: break-all; margin-bottom: 8px;">
          ${txHash}
        </div>
        <div>
          <a href="https://sepolia.optimism.io/tx/${txHash}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-size: 13px; font-weight: 500; margin-right: 12px;">
            🔗 View on Optimism Explorer
          </a>
          ${destinationChain === 'arbitrum' ? `
          <a href="https://sepolia.arbiscan.io/tx/${txHash}" target="_blank" style="color: #8b5cf6; text-decoration: none; font-size: 13px; font-weight: 500;">
            🔗 View on Arbitrum Explorer
          </a>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      ${intentId ? `
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;"><strong>Avail Nexus Intent ID:</strong></div>
        <div style="font-family: monospace; font-size: 12px; color: #475569; word-break: break-all; margin-bottom: 8px;">
          ${intentId}
        </div>
        ${explorerUrl ? `
        <div>
          <a href="${explorerUrl}" target="_blank" style="color: #8b5cf6; text-decoration: none; font-size: 13px; font-weight: 500;">
            🔗 View on Avail Explorer
          </a>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <div style="margin-top: 12px; padding: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 12px; color: #166534;">
        <strong>💡 Powered by Avail Nexus</strong> - Cross-chain USDC bridging made simple
      </div>
    `;

    body.appendChild(snippet);
    
    // Add some spacing
    const spacer = document.createElement('div');
    spacer.style.cssText = 'height: 16px;';
    body.appendChild(spacer);
    
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

    // Extract amount, token, source chain, and destination chain from subject line
    let destinationChain = 'optimism'; // Default to Optimism Sepolia
    let sourceChain = 'ethereum'; // Default to Ethereum Sepolia
    let token = 'USDC'; // Default to USDC
    let chainId = '11155420'; // Optimism Sepolia chain ID
    let sourceChainId = '11155111'; // Ethereum Sepolia chain ID
    
    // Chain ID mappings for testnet and mainnet
    const chainMappings = {
      // Testnet
      'ethereum-sepolia': { id: '11155111', name: 'Ethereum Sepolia' },
      'arbitrum-sepolia': { id: '421614', name: 'Arbitrum Sepolia' },
      'optimism-sepolia': { id: '11155420', name: 'Optimism Sepolia' },
      'base-sepolia': { id: '84532', name: 'Base Sepolia' },
      'polygon-amoy': { id: '80002', name: 'Polygon Amoy' },
      // Mainnet
      'ethereum': { id: '1', name: 'Ethereum' },
      'arbitrum': { id: '42161', name: 'Arbitrum' },
      'optimism': { id: '10', name: 'Optimism' },
      'base': { id: '8453', name: 'Base' },
      'polygon': { id: '137', name: 'Polygon' },
      'avalanche': { id: '43114', name: 'Avalanche' },
      'bsc': { id: '56', name: 'BSC' }
    };
    
    try {
      const subjectField = composeWindow.querySelector('input[name="subjectbox"]') as HTMLInputElement;
      if (subjectField?.value) {
        const subject = subjectField.value.trim();
        console.log('[Mail-Fi] Subject line:', subject);
        
        // Look for amount pattern like "0.01 USDC" or "0.01" or "1.5 USDC"
        const amountMatch = subject.match(/(\d+\.?\d*)\s*(?:USDC|ETH)?/i);
        if (amountMatch) {
          amount = amountMatch[1];
          console.log('[Mail-Fi] Extracted amount from subject:', amount);
        }
        
        // Extract token type
        if (subject.toLowerCase().includes('eth')) {
          token = 'ETH';
        } else if (subject.toLowerCase().includes('usdc')) {
          token = 'USDC';
        }
        
        // Extract source chain (from beginning of subject)
        if (subject.toLowerCase().includes('arbitrum sepolia')) {
          sourceChain = 'arbitrum-sepolia';
          sourceChainId = '421614';
        } else if (subject.toLowerCase().includes('optimism sepolia')) {
          sourceChain = 'optimism-sepolia';
          sourceChainId = '11155420';
        } else if (subject.toLowerCase().includes('ethereum sepolia')) {
          sourceChain = 'ethereum-sepolia';
          sourceChainId = '11155111';
        } else if (subject.toLowerCase().includes('base sepolia')) {
          sourceChain = 'base-sepolia';
          sourceChainId = '84532';
        } else if (subject.toLowerCase().includes('polygon amoy')) {
          sourceChain = 'polygon-amoy';
          sourceChainId = '80002';
        } else if (subject.toLowerCase().includes('arbitrum')) {
          sourceChain = 'arbitrum';
          sourceChainId = '42161';
        } else if (subject.toLowerCase().includes('optimism')) {
          sourceChain = 'optimism';
          sourceChainId = '10';
        } else if (subject.toLowerCase().includes('ethereum')) {
          sourceChain = 'ethereum';
          sourceChainId = '1';
        } else if (subject.toLowerCase().includes('base')) {
          sourceChain = 'base';
          sourceChainId = '8453';
        } else if (subject.toLowerCase().includes('polygon')) {
          sourceChain = 'polygon';
          sourceChainId = '137';
        } else if (subject.toLowerCase().includes('avalanche')) {
          sourceChain = 'avalanche';
          sourceChainId = '43114';
        } else if (subject.toLowerCase().includes('bsc')) {
          sourceChain = 'bsc';
          sourceChainId = '56';
        }
        
        // Extract destination chain (after "to")
        if (subject.toLowerCase().includes('to arbitrum sepolia')) {
          destinationChain = 'arbitrum-sepolia';
          chainId = '421614';
          console.log('[Mail-Fi] Destination: Arbitrum Sepolia');
        } else if (subject.toLowerCase().includes('to optimism sepolia')) {
          destinationChain = 'optimism-sepolia';
          chainId = '11155420';
          console.log('[Mail-Fi] Destination: Optimism Sepolia');
        } else if (subject.toLowerCase().includes('to ethereum sepolia')) {
          destinationChain = 'ethereum-sepolia';
          chainId = '11155111';
          console.log('[Mail-Fi] Destination: Ethereum Sepolia');
        } else if (subject.toLowerCase().includes('to base sepolia')) {
          destinationChain = 'base-sepolia';
          chainId = '84532';
          console.log('[Mail-Fi] Destination: Base Sepolia');
        } else if (subject.toLowerCase().includes('to polygon amoy')) {
          destinationChain = 'polygon-amoy';
          chainId = '80002';
          console.log('[Mail-Fi] Destination: Polygon Amoy');
        } else if (subject.toLowerCase().includes('to arbitrum')) {
          destinationChain = 'arbitrum';
          chainId = '42161';
          console.log('[Mail-Fi] Destination: Arbitrum');
        } else if (subject.toLowerCase().includes('to optimism')) {
          destinationChain = 'optimism';
          chainId = '10';
          console.log('[Mail-Fi] Destination: Optimism');
        } else if (subject.toLowerCase().includes('to ethereum')) {
          destinationChain = 'ethereum';
          chainId = '1';
          console.log('[Mail-Fi] Destination: Ethereum');
        } else if (subject.toLowerCase().includes('to base')) {
          destinationChain = 'base';
          chainId = '8453';
          console.log('[Mail-Fi] Destination: Base');
        } else if (subject.toLowerCase().includes('to polygon')) {
          destinationChain = 'polygon';
          chainId = '137';
          console.log('[Mail-Fi] Destination: Polygon');
        } else if (subject.toLowerCase().includes('to avalanche')) {
          destinationChain = 'avalanche';
          chainId = '43114';
          console.log('[Mail-Fi] Destination: Avalanche');
        } else if (subject.toLowerCase().includes('to bsc')) {
          destinationChain = 'bsc';
          chainId = '56';
          console.log('[Mail-Fi] Destination: BSC');
        }
        
        console.log('[Mail-Fi] Parsed:', { amount, token, sourceChain, destinationChain, sourceChainId, chainId });
      }
    } catch (err) {
      console.warn('[Mail-Fi] Failed to extract from subject:', err);
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

    console.log('[Mail-Fi] Opening payment for:', recipientAddress, 'Amount:', amount, 'Token:', token, 'Source:', sourceChain, 'Destination:', destinationChain, 'ChainID:', chainId);

    // Open Nexus payment window with TransferButton widget
    const params = new URLSearchParams({
      recipient: recipientAddress,
      amount: amount,
      token: token,
      chainId: chainId,
      sourceChain: sourceChain,
      sourceChainId: sourceChainId,
      destinationChain: destinationChain,
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
          console.log('[Mail-Fi] Inserting payment snippet with data:', payload);
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
