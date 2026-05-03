# Anyway ISM — Individual Sales Manager

Internal tool for managing individual flight ticket sales at Anyway Travel Agency. Sibling product to [Group Booking Manager (GBM)](https://github.com/liliantomita-cloud/group-booking-manager).

🌐 **Live:** https://liliantomita-cloud.github.io/individual-sales-manager/

## What it does

Tracks individual ticket sales across all sources used by the agency: Amadeus, Galileo/SPRK, Wizz Air, FlyOne, HiSky, Ryanair, easyJet, and others. Replaces manual spreadsheet entry with a structured database, Firebase cloud sync, and (where possible) automated parsing of GDS and email confirmations.

## Status

**Phase 1a (current).** Foundation release.

- ✅ Manual ticket entry with full data model
- ✅ Passenger & client profiles with autocomplete
- ✅ Firebase cloud sync (shared Firebase project with GBM, separate `/ism/` data root)
- ✅ Agent attribution (Lilian / Oxana / Elena / Irina / Other)
- ✅ Daily commercial ROE entry
- ✅ Multi-currency: EUR, USD, MDL, GBP, AED, RON
- ✅ Three-currency conversion (original → EUR → MDL)
- ✅ Amadeus PNR parser (clean cases — RP/FA/TST patterns, multi-pax with infants)
- ✅ Auto-flip Upcoming → Flown on app load
- ✅ Filters & full-text search
- ✅ Mobile responsive

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1a | Manual entry + Amadeus parser + Firebase sync | ✅ Shipped |
| 1b | CSV/Excel/JSON export · ECB auto-fetch for public ROE | next |
| 2 | Wizz / HiSky / FlyOne / Ryanair / easyJet / Galileo parsers | planned |
| 3 | Invoice PDF generation (RO + EN) · sequential numbering · refund/reissue UI | planned |
| 4 | Reports · dashboard · charts · agent performance · debt analysis | planned |

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
