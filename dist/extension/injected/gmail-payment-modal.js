// Gmail In-Page Payment Modal (Vanilla JS)
// Based on nexus-hyperliquid-poc approach but simplified

(function() {
  'use strict';

  console.log('[Mail-Fi] Gmail payment modal script loaded');

  // Create modal HTML
  function createModalHTML(data) {
    const { recipientEmail, recipientAddress, amount } = data;
    
    return `
      <div id="mailfi-modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        animation: fadeIn 0.2s ease-in;
      ">
        <div id="mailfi-modal" style="
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        " onclick="event.stopPropagation()">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            padding: 24px;
            color: white;
            border-radius: 16px 16px 0 0;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0; font-family: system-ui, -apple-system, sans-serif;">
                  Pay with Avail
                </h2>
                <p style="font-size: 14px; opacity: 0.9; margin: 0; font-family: system-ui, -apple-system, sans-serif;">
                  Powered by Nexus • Cross-chain payment
                </p>
              </div>
              <button id="mailfi-close-btn" style="
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 8px;
                width: 32px;
                height: 32px;
                cursor: pointer;
                color: white;
                font-size: 24px;
                line-height: 1;
                font-family: system-ui;
              ">×</button>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
            <!-- Amount Display -->
            <div style="
              background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 24px;
              border: 1px solid #bfdbfe;
              text-align: center;
            ">
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">Payment Amount</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 36px; font-weight: 700; color: #1e40af;">${amount || '0.001'}</span>
                <span style="
                  font-size: 18px;
                  font-weight: 600;
                  color: #7c3aed;
                  background: #ede9fe;
                  padding: 6px 12px;
                  border-radius: 8px;
                ">USDC</span>
              </div>
              <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">on Optimism Sepolia</p>
            </div>

            <!-- Recipient Info -->
            ${recipientEmail ? `
              <div style="
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 20px;
              ">
                <p style="font-size: 11px; font-weight: 600; color: #1e40af; margin: 0 0 6px 0;">SENDING TO</p>
                <p style="font-size: 14px; color: #3b82f6; margin: 0;">📧 ${recipientEmail}</p>
              </div>
            ` : ''}

            <!-- Status Message -->
            <div id="mailfi-status" style="margin-bottom: 20px; display: none;"></div>

            <!-- Main Content Area -->
            <div id="mailfi-content">
              <div style="text-align: center; padding: 20px 0;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                  This will open the Nexus payment page in a new window.
                </p>
                <button id="mailfi-open-payment-btn" style="
                  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                  color: white;
                  border: none;
                  padding: 14px 32px;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  font-family: system-ui, -apple-system, sans-serif;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)';">
                  Open Payment Window
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;
  }

  // Show payment modal
  function showPaymentModal(data) {
    console.log('[Mail-Fi] Showing payment modal:', data);

    // Remove existing modal if any
    const existing = document.getElementById('mailfi-modal-overlay');
    if (existing) {
      existing.remove();
    }

    // Create modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = createModalHTML(data);
    document.body.appendChild(modalContainer.firstElementChild);

    // Attach event listeners
    const overlay = document.getElementById('mailfi-modal-overlay');
    const closeBtn = document.getElementById('mailfi-close-btn');
    const openPaymentBtn = document.getElementById('mailfi-open-payment-btn');

    const closeModal = () => {
      if (overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
    };

    // Close on overlay click
    overlay.addEventListener('click', closeModal);

    // Close button
    closeBtn.addEventListener('click', closeModal);

    // Open payment window button
    openPaymentBtn.addEventListener('click', () => {
      const { recipientEmail, recipientAddress, amount } = data;
      
      // Build URL
      const params = new URLSearchParams({
        payment: 'true',
        amount: amount || '0.001',
        token: 'USDC',
        chain: '11155420',
      });
      
      if (recipientEmail) {
        params.set('recipientEmail', recipientEmail);
      }
      
      if (recipientAddress) {
        params.set('recipient', recipientAddress);
      }
      
      const paymentUrl = `http://localhost:3000/nexus-panel?${params.toString()}`;
      
      // Open popup
      const popup = window.open(
        paymentUrl,
        'AvailPayment',
        'width=800,height=700,menubar=no,toolbar=no,location=no,status=no'
      );
      
      if (popup) {
        // Monitor for completion
        const checkInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkInterval);
            console.log('[Mail-Fi] Payment window closed');
            closeModal();
          }
        }, 500);
      } else {
        alert('Please allow popups for this site to complete the payment.');
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Listen for payment requests
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    
    if (data.type === 'MAILFI_OPEN_PAYMENT') {
      console.log('[Mail-Fi] Received payment request:', data);
      showPaymentModal(data);
    }
  });

  console.log('[Mail-Fi] Payment modal system ready');
})();

