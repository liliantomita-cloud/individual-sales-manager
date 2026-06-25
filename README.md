# Anyway ISM

Individual Sales Manager for Anyway Travel.

This project is intentionally deployable as a static GitHub Pages app. The main application is `index.html`; Cloudflare Workers are used for browser-blocked or secret-bearing calls.

## Files

- `index.html` - current deployable app.
- `ecb-proxy-worker.js` - Cloudflare Worker for ECB exchange-rate XML.
- `anthropic-proxy-worker.safe.js` - recommended Cloudflare Worker for the AI parser.
- `anthropic-proxy-worker.js` - original simple AI proxy, kept for reference.
- `FIREBASE_AUTH_SETUP.md` - Google sign-in and allowlist setup.
- `firebase.rules.example.json` - Realtime Database rules template with email allowlist.
- `Backups/files_25.06.2026/ISM_RECOVERY.md` - recovery and handoff notes.
- `Backups/files_25.06.2026/index.html` - backup/source snapshot used to restore this working copy.

## Deploy

1. Commit `index.html` to the root of the GitHub Pages repo.
2. Enable Firebase Authentication with Google sign-in.
3. Apply Realtime Database rules from `firebase.rules.example.json` after replacing placeholder emails.
4. Deploy `ecb-proxy-worker.js` to Cloudflare Workers.
5. Deploy `anthropic-proxy-worker.safe.js` to Cloudflare Workers.
6. Set the Cloudflare secret `ANTHROPIC_API_KEY` on the AI Worker.
7. Optionally set `ALLOWED_ORIGINS` on the AI Worker:

```text
https://liliantomita-cloud.github.io,http://localhost:8000,http://127.0.0.1:8000
```

## Local Test

Open `index.html` directly in a browser, or serve this folder with any static server.

Example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Security Notes

It is acceptable for this app to be a static HTML file as long as secrets and permissions do not live in the HTML.

The following are safe or expected in client HTML:

- Firebase web config, including `apiKey`.
- UI state, filters, layout, and non-secret app logic.
- Calls to Cloudflare Worker URLs.

The following must not rely on HTML for security:

- Anthropic API key. It belongs only in the Cloudflare Worker secret `ANTHROPIC_API_KEY`.
- Admin permissions. Client-side admin mode is only a UI convenience; real protection comes from Firebase Auth and Realtime Database Rules.
- Data access. Firebase Realtime Database rules decide who can read/write data.

Current sync namespace defaults to:

```text
/ism/anyway-travel-team/
```

Use the same team username on all devices unless intentionally creating a separate workspace.
