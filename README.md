# Anyway ISM — Individual Sales Manager

Internal tool for managing individual flight ticket sales at Anyway Travel Agency. Sibling product to [Group Booking Manager (GBM)](https://github.com/liliantomita-cloud/group-booking-manager).

🌐 **Live:** https://liliantomita-cloud.github.io/individual-sales-manager/

## What it does

Tracks individual ticket sales across all sources used by the agency: Amadeus, Galileo/SPRK, Wizz Air, FlyOne, HiSky, Ryanair, easyJet, and others. Replaces manual spreadsheet entry with a structured database, Firebase cloud sync, and (where possible) automated parsing of GDS and email confirmations.

## Status

**Phase 1b v1.5 (current).** Foundation + exports + ECB auto-fetch.

- ✅ Manual ticket entry with full data model
- ✅ Passenger & client profiles with autocomplete
- ✅ Firebase cloud sync (shared Firebase project with GBM, separate `/ism/` data root)
- ✅ Username visible in topbar with switch modal — no more lost-data syncing surprises
- ✅ Agent attribution with initials (LT / OM / EB / IC / OT)
- ✅ Admin / Agent role marker (Path A — UI-level role separation per device)
- ✅ Daily commercial ROE (MDL/EUR) — manual entry, agency-wide
- ✅ Daily public FX (USD/GBP/RON per EUR) — manual entry **or auto-fetch from ECB**
- ✅ Multi-currency: EUR, USD, MDL, GBP, AED, RON
- ✅ Three-currency conversion (original → EUR → MDL) with editable Net EUR
- ✅ Sale-price-first entry (enter what client pays; service fee derives)
- ✅ Amadeus PNR parser with paste-and-review workflow
- ✅ Parser auto-detects credit cards from FP lines and matches against agency cards
- ✅ Payment method tracking per ticket (credit card / bank transfer / cash / other)
- ✅ Card management (admin Settings) — CRUD with active/retired toggle
- ✅ Per-ticket Client Reference field (job number, team code, etc.)
- ✅ Per-client Reference Codes list — drives autocomplete suggestions
- ✅ Per-ticket Check-in tracking with visual urgency cues in the table
- ✅ Duplicate prevention (unique key: doc_number + transaction_type)
- ✅ Auto-flip Upcoming → Flown on app load
- ✅ Compact ticket table with sticky toolbar; dedicated Client and Airline columns
- ✅ Smart Travel column showing date ranges for round-trip/multi-segment journeys
- ✅ "Until departure" column replaces static Status — surfaces urgent check-ins
- ✅ Inline payment status edit (one click) from the ticket list
- ✅ Optional Client Ref column (toggle in toolbar) + "Has ref" filter
- ✅ Collapsible sidebar — more horizontal space for the ticket table
- ✅ Read-only flight summary with Edit toggle
- ✅ Ticket history capped at 10 most recent (with Show More)
- ✅ Filters & full-text search
- ✅ Mobile responsive
- ✅ **Export to CSV** (filtered tickets, full set of fields)
- ✅ **Export to Excel** (3 sheets: Tickets, Passengers, Clients)
- ✅ **Export to JSON** (full backup snapshot)
- ✅ **ECB auto-fetch** for USD / GBP / RON daily rates (via Cloudflare Worker proxy)

## First-time setup

When you first open ISM:

1. **Choose your role** — first-run prompt asks if you're admin or agent. The choice is per device.
2. **Set your username** — when prompted on first sync. Use the same value on every device. The topbar shows the current username; click it to switch later if needed.
3. **Set today's commercial ROE** — click the ROE badge in the topbar, enter MDL/EUR.
4. **Set today's public FX** — click the FX badge. Either enter USD/GBP/RON manually, or click "📡 Fetch from ECB" (requires one-time proxy setup, see below).
5. **(Admin)** Add your payment cards — go to Settings → Add card. Format: type (AX/VI/CA/DC/JC) + last 4 digits = identifier (e.g. `AX1017`). Once configured, the parser auto-matches credit card payments from PNRs.
6. **(Optional)** For corporate clients with reference codes (e.g. FMF teams), open the client and fill the "Reference codes" textarea (one code per line).

## ECB auto-fetch setup (one-time, ~5 minutes)

ECB doesn't allow direct browser fetches (no CORS headers). To enable auto-fetch, deploy a tiny Cloudflare Worker that proxies the request. The Worker code is in `ecb-proxy-worker.js` in this repo, with full instructions at the top of the file.

Steps:
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create application → Create Worker
2. Deploy with the default code, then "Edit code" — paste in the contents of `ecb-proxy-worker.js`
3. Save and deploy. Copy the resulting URL (looks like `https://ism-ecb-proxy.your-name.workers.dev`)
4. In ISM, open the FX modal and click "📡 Fetch from ECB". Paste the proxy URL when prompted (one time per device).
5. From then on, ECB rates auto-fill on every app load, falling back to yesterday's if today's hasn't been published yet (ECB publishes around 16:00 CET).

Free tier: 100,000 requests/day. ISM uses ~5/day per user. Effectively unlimited.

## Firebase security rules

ISM and GBM share the same Firebase project. Recommended rules whitelist your team's username:

```json
{
  "rules": {
    "users": {
      "$username": {
        ".read": true,
        ".write": true
      }
    },
    "ism": {
      "anyway-travel-team": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Replace `anyway-travel-team` with your chosen username, and add more lines under `ism` if multiple usernames need access.

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1a | Manual entry + Amadeus parser + Firebase sync + UI polish | ✅ Shipped (v1.4) |
| 1b | CSV/Excel/JSON export · ECB auto-fetch for public ROE | ✅ Shipped (v1.5) |
| 2 | AI-driven parser for online sources (Wizz, Ryanair, easyJet, HiSky, FlyOne) — via Anthropic Claude or OpenAI API · Galileo regex parser | next |
| 3 | Invoice PDF generation (RO + EN) · sequential numbering · refund/reissue UI | planned |
| 4 | Reports · dashboard · charts · agent performance · debt analysis · check-in alerts/notifications | planned |
| 5+ | Dedicated client/passenger detail pages with full sortable history; non-air products (hotels, trains, transfers); Path B real authentication if/when needed | parked |

## Architecture

- **Single HTML file** — no backend, no build step. Deployed to GitHub Pages.
- **Firebase Realtime Database** for cross-device sync (compat SDK v8.10.1).
- **localStorage** as offline cache; works without network, syncs when online.
- **No external auth** — shared username convention (same as GBM).

## Data model

Core entities:
- **Ticket** — one record per passenger per issued document (ETKT or CONF). Booking refs (PNR/confirmation code) are a field, not a separate entity.
- **Passenger** — long-lived profile, links to multiple tickets.
- **Client** — who is invoiced. Individual or corporate.
- **Invoice** — Phase 3.

Three-currency model: every ticket stores amounts in original currency (USD/GBP/AED/etc.) → converted to EUR via *public* ROE → converted to MDL via *commercial* ROE (set manually each day, agency-wide). All conversion rates are stored on the ticket itself so historical records remain reproducible.

Single profit component: service fee, entered in EUR per ticket.

## Setup for new team members

1. Open https://liliantomita-cloud.github.io/individual-sales-manager/
2. On first launch, enter the team username (use the same one as GBM)
3. Pick your name from the agent dropdown (bottom of sidebar)
4. Set today's commercial MDL/EUR rate when prompted
5. Start entering tickets via **+ New Ticket** or **📋 Paste Amadeus**

## Keyboard shortcuts (in ticket entry modal)

- `Ctrl+S` — Save and close
- `Ctrl+Enter` — Save and start a new ticket
- `Ctrl+D` — Save and duplicate (carry all fields forward)
- `Esc` — Close any modal

## Known limitations

The Amadeus parser handles the standard `RP/.../FA PAX/INF/TST` pattern. Edge cases not yet supported in Phase 1a:

- Heavily reformatted GDS output
- Embedded agent free-text in the PNR display polluting FA lines
- Exchange ticket reference patterns (`RIA USD-...-F EXCHANGE...`)
- EMDs without a base ticket in the same paste
- Other GDS formats (Galileo SPRK ET RECORD) — Phase 2

When the parser fails or misses fields, the review pane flags them red — the agent fixes them before save, so silent data corruption isn't possible.

## Development

This is a single-file HTML application. To modify:

1. Edit `index.html` directly
2. Test locally by opening the file in a browser (Firebase will work if config is unchanged)
3. Commit and push — GitHub Pages auto-deploys

The Amadeus parser logic is contained in the `parseAmadeus()` JavaScript function. To add new patterns, add them as additional regex handlers and verify they don't break existing matches.

## Tech stack

- Vanilla HTML / CSS / JavaScript (no framework, no build)
- Firebase Realtime Database 8.10.1 (compat SDK)
- Designed to run on GitHub Pages free tier

## License

Internal tool, all rights reserved by Anyway Travel.
