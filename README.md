# Atlas Lab V2

Atlas Lab V2 is a private, dependency-free test build of the unified Atlas
capital-management and betting-operations application. It combines client and
account management, platform balances, bonuses, turnover, calculation sessions,
allocation, settlement, withdrawals, ledger reporting, role-based views, and an
isolated operational Lab.

This repository is a local proof environment, not a production financial system.
Authentication, authorization, and persistence are implemented in browser
`localStorage`. Do not host it publicly or use it with real customer data.

## Current Status

- The unified Atlas application and compact Operations Calculator are working.
- Calculator, Account Pool, platform rule, Mix, Free Bet, settlement, withdrawal,
  spreadsheet export, PDF export, appearance, and Lab services are included.
- Owner, Admin, and Shareholder demo roles are available.
- Atlas Lab V2 uses isolated storage namespaces and fictional seed data.
- A production backend, server-side authorization, transactional ledger, and
  encrypted backup service have not been implemented.

See [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) for the detailed development state.

## Technology Stack

- Static HTML5 and CSS
- Plain JavaScript using browser APIs and CommonJS-compatible domain services
- Browser `localStorage` for local persistence
- Node.js for the local static server and regression tests
- Vendored `pdf-lib` browser bundle for PDF generation
- No package manager, dependency installation, database, Docker image, or
  external API is required

## Requirements

- Git
- Node.js 18 or newer; Node.js 20+ is recommended
- A current desktop browser

## Install on Windows

```powershell
git clone https://github.com/MajalDidIt/atlas-lab-v2.git
cd atlas-lab-v2
copy .env.example .env
node tests\run-all.js
node serve-local.js
```

Open `http://127.0.0.1:4190/`.

The `.env` file is optional today because the application has no required
environment variables. It is ignored by Git.

## Demo Access

These credentials are fictional test fixtures stored in the source:

```text
Owner: owner / owner123
Admin: admin / admin123
Shareholder: shareholder / client123
```

They do not provide production security. Replace this login system before any
real deployment.

## Environment Variables

There are no required environment variables. `serve-local.js` optionally reads:

```env
PORT=4190
```

The value is not secret and may be set for the current PowerShell session:

```powershell
$env:PORT=4200
node serve-local.js
```

Keep future credentials in `.env`, a password manager, or a deployment secret
store. Add variable names, never values, to `.env.example`.

## Data and Backups

There is no database file or remote database. All working data is stored in the
browser profile that opens the application.

Before moving computers, sign in as Owner and create both backups:

1. Use the top-bar **Export Data** action for the unified Atlas state.
2. Open **Atlas Lab V2 > Administration** and use **Export Lab Backup** for the
   isolated Lab state.

Transfer those JSON files through a secure private channel. They may contain
account information, notes, audit history, and locally created login records, so
they are intentionally excluded from Git. On the new computer, use the matching
Owner-only import actions.

## Development Commands

Run every syntax and regression check:

```powershell
node tests\run-all.js
```

Run an individual check:

```powershell
node tests\atlas-lab-tests.js
node tests\atlas-calculator-view-model-tests.js
node tests\atlas-mix-tests.js
node tests\atlas-theme-tests.js
node tests\atlas-acceptance-tests.mjs
node --check app.js
```

Start the local application:

```powershell
node serve-local.js
```

There is no compilation or production build command. The tracked source files are
the runnable artifact. Verify packaging by running the full checks and serving
the repository root.

## Project Structure

```text
index.html                         Application shell and workspaces
app.js                            Main state, role, workflow, and UI controller
styles.css                        Responsive application styles
atlas-calculator-service.js       Calculator source of truth
atlas-calculator-view-model.js    Compact calculator presentation model
atlas-workflow-service.js         Accounting and platform eligibility rules
atlas-mix-service.js              Free Bet and sequential Mix logic
atlas-lab-service.js              Isolated Lab state and operational logic
atlas-lab-controller.js           Lab workspace UI
atlas-theme-service.js            Versioned appearance model and validation
atlas-appearance-controller.js    Appearance workspace UI
atlas-xlsx-service.js             Spreadsheet export
atlas-pdf-service.js              PDF report export
vendor-pdf-lib.min.js             Required vendored PDF library
tests/                            Dependency-free regression suites
serve-local.js                    Local HTTP server
```

## Known Issues and Limits

- Browser storage is machine- and browser-profile-specific.
- Client-side roles are demonstration controls, not a security boundary.
- Multi-user concurrency, server transactions, immutable audits, notifications,
  and real payment/platform integrations are not implemented.
- Demo passwords are plain-text fixtures and must never be reused for real users.
- The static server binds only to `127.0.0.1`; this is intentional.

## Continuing with Codex

Open the cloned repository root in Codex. Before edits, ask Codex to inspect this
README, `PROJECT_HANDOFF.md`, `RESTORE_ON_NEW_COMPUTER.md`, and the latest Git
history. Keep calculator formulas in their existing domain services and preserve
the Lab storage namespaces.
