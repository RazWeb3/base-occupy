# Base Mini App Setup Guide

This project is configured to be deployed as a Base Mini App.

## 1. Deploy Your App
Deploy this Next.js application to a public domain (e.g., Vercel).
Note your deployment URL (e.g., `https://base-occupy.vercel.app`).

## 2. Generate Account Association Signature
To verify ownership of your domain for the Mini App, you need to generate a signature.

1. Go to the [Base Build Account Association Tool](https://docs.base.org/mini-apps/quickstart/create-new-miniapp#step-5-associate-your-account) (or search for "Base Build Account Association").
2. Enter your deployed domain (e.g., `base-occupy.vercel.app`).
3. Connect your wallet and sign the message.
4. Copy the generated JSON object containing `header`, `payload`, and `signature`.

## 3. Update Manifest
1. Open `public/.well-known/farcaster.json`.
2. Replace the `accountAssociation` object with the one you generated.
3. Update `homeUrl`, `iconUrl`, `splashImageUrl`, and `screenshotUrls` with your actual deployment URL.

## 4. Redeploy
Commit and push your changes to redeploy the application.
The manifest should now be accessible at `https://YOUR_DOMAIN.vercel.app/.well-known/farcaster.json`.

## 5. Verify
Use the [Coinbase Wallet Validator Tool](https://docs.base.org/mini-apps/troubleshooting/common-issues#cbw-validator-tool) or simply check if your app appears correctly in the Base App or Farcaster client.
