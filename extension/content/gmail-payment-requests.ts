// Gmail Payment Request Handler
// This script detects payment requests in received emails and shows "Pay with Avail" button

import { extractTokenFromSubject, getTokenButtonStyle } from './email-wallet-mapping';

interface PaymentRequest {
  amount: string;
  token: string;
  sourceChain: string;
  destinationChain: string;
  recipientAddress: string;
  emailId: string;
}

// Extract payment request details from email content
function extractPaymentRequest(emailElement: Element): PaymentRequest | null {
  try {
    // Get email subject - try multiple selectors
    const subjectElement = emailElement.querySelector('[data-legacy-thread-id] h2, .thread-subject, [data-thread-perm-id] h2, .thread-subject, h2[data-thread-perm-id]');
    const subject = subjectElement?.textContent?.trim() || '';
    
    // Get email body content - try multiple selectors for Gmail
    const bodyElement = emailElement.querySelector('.email-body, .message-body, [role="main"] .adn, .ii, .adn, .email-body, .message-body, [data-message-id] .adn, .thread .adn');
    const bodyText = bodyElement?.textContent?.trim() || '';
    
    // Also try to get text from the entire email element as fallback
    const fullText = emailElement.textContent?.trim() || '';
    
    console.log('[Mail-Fi] Analyzing email for payment request:', { 
      subject, 
      bodyText: bodyText.substring(0, 200),
      fullText: fullText.substring(0, 200)
    });
    
    // Check if this is a payment request - use full text as fallback
    const searchText = (subject + ' ' + bodyText + ' ' + fullText).toLowerCase();
    const isPaymentRequest = searchText.includes('payment request') || 
                           searchText.includes('please pay') ||
                           searchText.includes('invoice') ||
                           searchText.includes('my wallet address') ||
                           searchText.includes('requesting a payment') ||
                           searchText.includes('pay with avail');
    
    console.log('[Mail-Fi] Payment request detection:', { isPaymentRequest, searchText: searchText.substring(0, 100) });
    
    if (!isPaymentRequest) {
      return null;
    }
    
    // Extract amount and token from all text
    const amountMatch = searchText.match(/(\d+\.?\d*)\s*(usdc|eth|usdt|dai|pyusd)/i);
    if (!amountMatch) {
      console.log('[Mail-Fi] No amount/token found in payment request');
      return null;
    }
    
    const amount = amountMatch[1];
    const token = amountMatch[2].toUpperCase();
    
    // Extract chains from all text
    const chainText = searchText;
    let sourceChain = 'ethereum-sepolia';
    let destinationChain = 'optimism-sepolia';
    
    // Detect source chain
    if (chainText.includes('from ethereum sepolia') || chainText.includes('from ethereum-sepolia')) {
      sourceChain = 'ethereum-sepolia';
    } else if (chainText.includes('from arbitrum sepolia') || chainText.includes('from arbitrum-sepolia')) {
      sourceChain = 'arbitrum-sepolia';
    } else if (chainText.includes('from optimism sepolia') || chainText.includes('from optimism-sepolia')) {
      sourceChain = 'optimism-sepolia';
    } else if (chainText.includes('from base sepolia') || chainText.includes('from base-sepolia')) {
      sourceChain = 'base-sepolia';
    } else if (chainText.includes('from polygon amoy') || chainText.includes('from polygon-amoy')) {
      sourceChain = 'polygon-amoy';
    }
    
    // Detect destination chain
    if (chainText.includes('to ethereum sepolia') || chainText.includes('to ethereum-sepolia')) {
      destinationChain = 'ethereum-sepolia';
    } else if (chainText.includes('to arbitrum sepolia') || chainText.includes('to arbitrum-sepolia')) {
      destinationChain = 'arbitrum-sepolia';
    } else if (chainText.includes('to optimism sepolia') || chainText.includes('to optimism-sepolia')) {
      destinationChain = 'optimism-sepolia';
    } else if (chainText.includes('to base sepolia') || chainText.includes('to base-sepolia')) {
      destinationChain = 'base-sepolia';
    } else if (chainText.includes('to polygon amoy') || chainText.includes('to polygon-amoy')) {
      destinationChain = 'polygon-amoy';
    }
    
    // Extract recipient wallet address from all text
    const addressMatch = searchText.match(/0x[a-fA-F0-9]{40}/);
    const recipientAddress = addressMatch ? addressMatch[0] : '';
    
    if (!recipientAddress) {
      console.log('[Mail-Fi] No wallet address found in payment request');
      return null;
    }
    
    // Generate unique email ID
    const emailId = `payment-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentRequest: PaymentRequest = {
      amount,
      token,
      sourceChain,
      destinationChain,
      recipientAddress,
      emailId
    };
    
    console.log('[Mail-Fi] Extracted payment request:', paymentRequest);
    return paymentRequest;
    
  } catch (error) {
    console.error('[Mail-Fi] Error extracting payment request:', error);
    return null;
  }
}

// Create payment request button
function createPaymentRequestButton(paymentRequest: PaymentRequest): HTMLElement {
  const button = document.createElement('div');
  button.className = 'mailfi-payment-request-btn';
  button.style.cssText = `
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin: 12px 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  button.innerHTML = `
    <span style="font-size: 16px;">💳</span>
    <span>Pay ${paymentRequest.amount} ${paymentRequest.token}</span>
  `;
  
  // Add hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.02)';
    button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
  });
  
  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlePaymentRequest(paymentRequest);
  });
  
  return button;
}

// Handle payment request button click
function handlePaymentRequest(paymentRequest: PaymentRequest) {
  try {
    console.log('[Mail-Fi] Handling payment request:', paymentRequest);
    
    // Build nexus-panel URL with payment request details
    const params = new URLSearchParams({
      recipient: paymentRequest.recipientAddress,
      amount: paymentRequest.amount,
      token: paymentRequest.token,
      sourceChain: paymentRequest.sourceChain,
      destinationChain: paymentRequest.destinationChain,
      correlationId: paymentRequest.emailId,
      type: 'payment-request'
    });
    
    const nexusUrl = `http://localhost:3000/nexus-panel?${params.toString()}`;
    
    // Open nexus-panel in new window
    const popup = window.open(
      nexusUrl,
      'mailfi-payment',
      'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site to complete the payment.');
      return;
    }
    
    // Listen for payment completion
    const handlePaymentSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'MAILFI_PAYMENT_SUCCESS') {
        console.log('[Mail-Fi] Payment completed:', event.data.data);
        
        // Update button to show success
        const button = document.querySelector(`[data-email-id="${paymentRequest.emailId}"]`) as HTMLElement;
        if (button) {
          button.innerHTML = `
            <span style="font-size: 16px;">✅</span>
            <span>Payment Completed</span>
          `;
          button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          button.style.cursor = 'default';
          button.onclick = null;
        }
        
        // Close popup
        popup?.close();
        
        // Remove event listener
        window.removeEventListener('message', handlePaymentSuccess);
      }
    };
    
    window.addEventListener('message', handlePaymentSuccess);
    
    // Clean up if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handlePaymentSuccess);
      }
    }, 1000);
    
  } catch (error) {
    console.error('[Mail-Fi] Error handling payment request:', error);
    alert('Error opening payment interface. Please try again.');
  }
}

// Inject payment request button into email
function injectPaymentRequestButton(emailElement: Element, paymentRequest: PaymentRequest) {
  try {
    // Check if button already exists
    const existingButton = emailElement.querySelector('.mailfi-payment-request-btn');
    if (existingButton) {
      return;
    }
    
    // Find a good place to inject the button (usually after the email body)
    const bodyElement = emailElement.querySelector('.email-body, .message-body, [role="main"] .adn, .ii');
    const targetElement = bodyElement || emailElement;
    
    // Create container for the button
    const container = document.createElement('div');
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: #f8f9fa;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      text-align: center;
    `;
    
    // Create button
    const button = createPaymentRequestButton(paymentRequest);
    button.setAttribute('data-email-id', paymentRequest.emailId);
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    header.textContent = 'Payment Request';
    
    // Add payment details
    const details = document.createElement('div');
    details.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.4;
    `;
    details.innerHTML = `
      <div>Amount: <strong>${paymentRequest.amount} ${paymentRequest.token}</strong></div>
      <div>From: <strong>${paymentRequest.sourceChain}</strong> → To: <strong>${paymentRequest.destinationChain}</strong></div>
      <div>Recipient: <strong>${paymentRequest.recipientAddress.slice(0, 6)}...${paymentRequest.recipientAddress.slice(-4)}</strong></div>
    `;
    
    container.appendChild(header);
    container.appendChild(button);
    container.appendChild(details);
    
    // Insert after the target element
    if (targetElement && targetElement.parentNode) {
      targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
    } else {
      emailElement.appendChild(container);
    }
    
    console.log('[Mail-Fi] Injected payment request button for email:', paymentRequest.emailId);
    
  } catch (error) {
    console.error('[Mail-Fi] Error injecting payment request button:', error);
  }
}

// Process email thread for payment requests
function processEmailThread(threadElement: Element) {
  try {
    console.log('[Mail-Fi] Processing email thread:', threadElement);
    
    // Find all email messages in the thread - try multiple selectors
    const emailMessages = threadElement.querySelectorAll('[data-legacy-thread-id], .thread-message, .email-message, .thread .adn, [data-message-id], .email-content');
    
    console.log('[Mail-Fi] Found email messages:', emailMessages.length);
    
    emailMessages.forEach((emailElement, index) => {
      console.log('[Mail-Fi] Processing email message:', index, emailElement);
      
      // Skip if already processed
      if (emailElement.querySelector('.mailfi-payment-request-btn')) {
        console.log('[Mail-Fi] Button already exists, skipping');
        return;
      }
      
      // Extract payment request from this email
      const paymentRequest = extractPaymentRequest(emailElement);
      
      if (paymentRequest) {
        console.log('[Mail-Fi] Found payment request in email:', paymentRequest);
        injectPaymentRequestButton(emailElement, paymentRequest);
      } else {
        console.log('[Mail-Fi] No payment request found in email');
      }
    });
    
  } catch (error) {
    console.error('[Mail-Fi] Error processing email thread:', error);
  }
}

// Main initialization function
function initializePaymentRequests() {
  try {
    console.log('[Mail-Fi] Initializing payment request detection...');
    
    // Process existing email threads - try multiple selectors
    const threadElements = document.querySelectorAll('[data-thread-perm-id], .thread, .email-thread, [data-legacy-thread-id], .thread-content, .email-thread-content');
    console.log('[Mail-Fi] Found thread elements:', threadElements.length);
    threadElements.forEach(processEmailThread);
    
    // Also process any individual email messages that might not be in threads
    const emailElements = document.querySelectorAll('[data-message-id], .email-message, .thread .adn, [data-legacy-thread-id]');
    console.log('[Mail-Fi] Found individual email elements:', emailElements.length);
    emailElements.forEach((emailElement) => {
      const paymentRequest = extractPaymentRequest(emailElement);
      if (paymentRequest) {
        console.log('[Mail-Fi] Found payment request in individual email:', paymentRequest);
        injectPaymentRequestButton(emailElement, paymentRequest);
      }
    });
    
    // Watch for new email threads (when navigating)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if this is a new email thread
            if (element.matches('[data-thread-perm-id], .thread, .email-thread, [data-legacy-thread-id]') ||
                element.querySelector('[data-thread-perm-id], .thread, .email-thread, [data-legacy-thread-id]')) {
              console.log('[Mail-Fi] New thread detected:', element);
              processEmailThread(element);
            }
            
            // Also check for individual email messages
            if (element.matches('[data-message-id], .email-message, .thread .adn') ||
                element.querySelector('[data-message-id], .email-message, .thread .adn')) {
              console.log('[Mail-Fi] New email message detected:', element);
              const paymentRequest = extractPaymentRequest(element);
              if (paymentRequest) {
                console.log('[Mail-Fi] Found payment request in new email:', paymentRequest);
                injectPaymentRequestButton(element, paymentRequest);
              }
            }
          }
        });
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Mail-Fi] Payment request detection initialized');
    
  } catch (error) {
    console.error('[Mail-Fi] Error initializing payment requests:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePaymentRequests);
} else {
  initializePaymentRequests();
}

// Manual trigger function for testing
function manualTriggerPaymentDetection() {
  console.log('[Mail-Fi] Manual trigger - scanning all elements for payment requests...');
  
  // Get all elements on the page
  const allElements = document.querySelectorAll('*');
  console.log('[Mail-Fi] Scanning', allElements.length, 'elements');
  
  allElements.forEach((element, index) => {
    if (element.textContent && element.textContent.includes('0.001 USDC')) {
      console.log('[Mail-Fi] Found element with 0.001 USDC:', element, element.textContent.substring(0, 200));
      
      const paymentRequest = extractPaymentRequest(element);
      if (paymentRequest) {
        console.log('[Mail-Fi] Successfully extracted payment request:', paymentRequest);
        injectPaymentRequestButton(element, paymentRequest);
      }
    }
  });
}

// Make manual trigger available globally for testing
(window as any).mailfiTriggerPaymentDetection = manualTriggerPaymentDetection;

export { initializePaymentRequests, manualTriggerPaymentDetection };
