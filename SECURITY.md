# Security Model

ISM is a static browser app. That is fine for an internal tool, but the browser cannot protect secrets or enforce permissions by itself.

## Current State

- The app is static HTML/JS.
- Firebase web config is public by design.
- Admin mode is stored in `localStorage`; it is only a UI convenience.
- Anthropic calls go through a Cloudflare Worker so the API key stays server-side.

## What Must Be Protected Outside HTML

- Firebase Realtime Database read/write rules.
- Anthropic API key in Cloudflare Worker secrets.
- Optional Cloudflare rate limits for the AI proxy URL.

## Firebase Auth

The app now expects Google sign-in before Firebase sync starts. The UI includes a top-bar `auth` control for sign-in/sign-out.

Firebase Realtime Database Rules must still enforce the email allowlist. Client-side checks are only a usability hint.

## Practical Staged Plan

1. Enable Google sign-in in Firebase Authentication.
2. Apply Realtime Database rules with approved user emails.
3. Keep the UI admin mode for convenience, but do not treat it as security.
4. Move destructive actions behind Firebase rules or Cloud Functions/Workers if stricter per-role access is needed.
5. Restrict the AI Worker with `ALLOWED_ORIGINS` and Cloudflare rate limiting.

## Worker Recommendation

Use `anthropic-proxy-worker.safe.js` for deployment. It validates the request shape and restricts browser origins.
