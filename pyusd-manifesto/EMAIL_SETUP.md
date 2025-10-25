# Email Setup for Mail-Fi

## Current Status
The email API endpoint exists at `/api/send-email` but needs configuration.

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Create a Gmail App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in to your Google account
   - Create a new app password for "Mail-Fi"
   - Copy the 16-character password

2. **Add to .env.local**
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-16-char-app-password
   ```

3. **Restart the dev server**
   ```bash
   npm run dev
   ```

### Option 2: Resend (Better for Production)

1. **Sign up at Resend**
   - Visit: https://resend.com
   - Create free account (100 emails/day free)
   - Get API key

2. **Install Resend**
   ```bash
   npm install resend
   ```

3. **Update API route** (I'll do this for you)

4. **Add to .env.local**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

## Which Option Do You Want?

Let me know and I'll:
1. Set up the email configuration
2. Test it for you
3. Make sure emails actually send

---

## Current Email Flow

When you send/request PYUSD via Mail-Fi:
1. User fills form (email, amount, description)
2. Frontend calls `/api/send-email`
3. API sends beautiful HTML email
4. Recipient gets notification

**But currently it's not sending because .env.local needs configuration!**
