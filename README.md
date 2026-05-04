# Anyway ISM — Individual Sales Manager

Internal tool for managing individual flight ticket sales at Anyway Travel Agency. Sibling product to [Group Booking Manager (GBM)](https://github.com/liliantomita-cloud/group-booking-manager).

🌐 **Live:** https://liliantomita-cloud.github.io/individual-sales-manager/

## What it does

Tracks individual ticket sales across all sources used by the agency: Amadeus, Galileo/SPRK, Wizz Air, FlyOne, HiSky, Ryanair, easyJet, and others. Replaces manual spreadsheet entry with a structured database, Firebase cloud sync, and (where possible) automated parsing of GDS and email confirmations.

## Status

**Phase 1a v1.3 (current).** Foundation release with field-tested refinements and admin features.

- ✅ Manual ticket entry with full data model
- ✅ Passenger & client profiles with autocomplete
- ✅ Firebase cloud sync (shared Firebase project with GBM, separate `/ism/` data root)
- ✅ Agent attribution with initials (LT / OM / EB / IC / OT)
- ✅ Admin / Agent role marker (Path A — UI-level role separation per device)
- ✅ Daily commercial ROE (MDL/EUR) — manual entry, agency-wide
- ✅ Daily public FX (USD/GBP per EUR) — manual entry, agency-wide
- ✅ Multi-currency: EUR, USD, MDL, GBP, AED, RON
- ✅ Three-currency conversion (original → EUR → MDL) with editable Net EUR
- ✅ Sale-price-first entry (enter what client pays; service fee derives)
- ✅ Amadeus PNR parser with paste-and-review workflow
- ✅ Parser auto-detects credit cards from FP lines and matches against agency cards
- ✅ Payment method tracking per ticket (credit card / bank transfer / cash / other)
- ✅ Card management (admin Settings) — CRUD with active/retired toggle
- ✅ Per-ticket Client Reference field (job number, team code, etc.)
- ✅ Per-client Reference Codes list — drives autocomplete suggestions
- ✅ Duplicate prevention (unique key: doc_number + transaction_type)
- ✅ Auto-flip Upcoming → Flown on app load
- ✅ Compact ticket table with sticky toolbar, MDL sale & profit columns
- ✅ Inline payment status edit (one click) from the ticket list
- ✅ Optional Client Ref column (toggle in toolbar) + "Has ref" filter
- ✅ Read-only flight summary with Edit toggle
- ✅ Ticket history capped at 10 most recent (with Show More)
- ✅ Filters & full-text search
- ✅ Mobile responsive

## First-time setup

When you first open ISM v1.3:

1. **Choose your role** — first-run prompt asks if you're admin or agent. The choice is per device; admin sees Settings/Dashboard/Reports, agents don't. You can switch later via the role label below the agent dropdown.
2. **Set today's commercial ROE** — click the ROE badge in the topbar, enter MDL/EUR.
3. **Set today's public FX** — click the FX badge, enter USD per EUR (e.g. 1.17) and GBP per EUR (e.g. 0.85). Auto-applied to USD/GBP tickets.
4. **(Admin)** Add your payment cards — go to Settings → Add card. Format: type (AX/VI/CA/DC/JC) + last 4 digits = identifier (e.g. `AX1017`). Once configured, the parser auto-matches credit card payments from PNRs.
5. **(Optional)** For corporate clients with reference codes (e.g. FMF teams), open the client and fill the "Reference codes" textarea (one code per line).

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1a | Manual entry + Amadeus parser + Firebase sync | ✅ Shipped (v1.3) |
| 1b | CSV/Excel/JSON export · ECB auto-fetch for public ROE | next |
| 2 | Wizz / HiSky / FlyOne / Ryanair / easyJet / Galileo parsers | planned |
| 3 | Invoice PDF generation (RO + EN) · sequential numbering · refund/reissue UI | planned |
| 4 | Reports · dashboard · charts · agent performance · debt analysis | planned |
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
