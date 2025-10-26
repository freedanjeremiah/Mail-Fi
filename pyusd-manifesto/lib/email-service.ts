export interface EmailPaymentRequest {
  recipientEmail: string
  amount: number
  description: string
  requestType: 'send' | 'request'
  senderWallet?: string
  recipientWallet?: string
  txSignature?: string
}

export async function sendPaymentEmail(data: EmailPaymentRequest) {
  const { recipientEmail, amount, description, requestType, senderWallet, recipientWallet, txSignature } = data

  let subject = ''
  let html = ''

  if (requestType === 'send') {
    subject = `💸 You received ${amount} PYUSD on Mail-Fi`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .wallet { background: #fff; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Mail-Fi Payment Received!</h1>
          </div>
          <div class="content">
            <p>Great news! You've received a PYUSD payment.</p>

            <div class="amount">${amount} PYUSD</div>

            <p><strong>Description:</strong> ${description}</p>

            ${senderWallet ? `<p><strong>From:</strong></p><div class="wallet">${senderWallet}</div>` : ''}

            ${txSignature ? `
              <p>
                <a href="https://explorer.solana.com/tx/${txSignature}?cluster=devnet" class="button">
                  View Transaction on Solana Explorer
                </a>
              </p>
            ` : ''}

            <p>This payment was sent via <strong>Mail-Fi</strong>, a decentralized payment platform powered by PYUSD on Solana.</p>
          </div>
          <div class="footer">
            <p>Mail-Fi - Decentralized Payments Made Simple</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  } else {
    subject = `💰 Payment Request: ${amount} PYUSD on Mail-Fi`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 32px; font-weight: bold; color: #f5576c; margin: 20px 0; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .wallet { background: #fff; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Request</h1>
          </div>
          <div class="content">
            <p>You have a payment request on Mail-Fi.</p>

            <div class="amount">${amount} PYUSD</div>

            <p><strong>Description:</strong> ${description}</p>

            ${recipientWallet ? `<p><strong>Pay to:</strong></p><div class="wallet">${recipientWallet}</div>` : ''}

            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                Pay Now on Mail-Fi
              </a>
            </p>

            <p>This payment request was sent via <strong>Mail-Fi</strong>, a decentralized payment platform powered by PYUSD on Solana.</p>
          </div>
          <div class="footer">
            <p>Mail-Fi - Decentralized Payments Made Simple</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: recipientEmail, subject, html, type: requestType }),
  })

  if (!response.ok) {
    throw new Error('Failed to send email')
  }

  return await response.json()
}
