// Email to wallet address mapping (simulating database lookup)
export const EMAIL_WALLET_MAPPING: Record<string, string> = {
  // Default mapping for testing
  'user@example.com': '0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25',
  'test@gmail.com': '0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25',
  'demo@mail.com': '0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25',
  
  // Add more mappings as needed
  'alice@example.com': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  'bob@example.com': '0x8ba1f109551bD432803012645Hac136c',
  'charlie@example.com': '0x1234567890123456789012345678901234567890',
};

// Simulate database lookup with loading state
export async function lookupWalletAddress(email: string): Promise<string | null> {
  console.log(`[Mail-Fi] Looking up wallet address for email: ${email}`);
  
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clean email (remove any extra characters)
  const cleanEmail = email.toLowerCase().trim();
  
  // Check if email exists in mapping
  if (EMAIL_WALLET_MAPPING[cleanEmail]) {
    const walletAddress = EMAIL_WALLET_MAPPING[cleanEmail];
    console.log(`[Mail-Fi] Found wallet address: ${walletAddress}`);
    return walletAddress;
  }
  
  // Default fallback for any email
  console.log(`[Mail-Fi] Using default wallet address for: ${cleanEmail}`);
  return '0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25';
}

// Extract email addresses from Gmail's "To" field
export function extractEmailAddresses(composeWindow: Element): string[] {
  const emails: string[] = [];
  
  try {
    // Try multiple selectors for Gmail's "To" field
    const toField = composeWindow.querySelector('input[name="to"]') as HTMLInputElement;
    const toSpans = composeWindow.querySelectorAll('span[email]');
    const toInputs = composeWindow.querySelectorAll('input[type="text"]');
    
    // Method 1: Direct input field
    if (toField?.value) {
      const value = toField.value.trim();
      // Split by comma and extract emails
      const emailList = value.split(',').map(email => email.trim()).filter(email => email.includes('@'));
      emails.push(...emailList);
    }
    
    // Method 2: Email spans (Gmail's chip format)
    toSpans.forEach(span => {
      const email = span.getAttribute('email');
      if (email && email.includes('@')) {
        emails.push(email);
      }
    });
    
    // Method 3: Check all text inputs for email patterns
    toInputs.forEach(input => {
      const value = (input as HTMLInputElement).value?.trim();
      if (value && value.includes('@')) {
        // Split by comma and extract emails
        const emailList = value.split(',').map(email => email.trim()).filter(email => email.includes('@'));
        emails.push(...emailList);
      }
    });
    
    console.log('[Mail-Fi] Extracted emails:', emails);
  } catch (err) {
    console.warn('[Mail-Fi] Failed to extract emails:', err);
  }
  
  return emails;
}
