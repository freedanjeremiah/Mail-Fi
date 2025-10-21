This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Browser Extension (Mail‑Fi for Gmail)

This repo also contains a Chrome Manifest V3 extension that injects a payment panel into Gmail and will integrate with Avail Nexus.

### Build

```powershell
npm run build:ext
```

Artifacts will be placed in `dist/extension`.

### Load in Chrome

1. Open `chrome://extensions`
2. Toggle on "Developer mode"
3. Click "Load unpacked" and select the `dist/extension` folder
4. Open Gmail (https://mail.google.com). A "Pay with Avail" floating button appears. Click it to open the panel.

### Development

Watch and rebuild on changes:

```powershell
npm run watch:ext
```

### API Stubs

An example route handler exists at `src/app/api/payments/route.ts` for server-side actions; wire this to Avail Nexus as needed.
