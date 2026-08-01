# Project Handoff

## Current Status

Atlas Lab V2 is a self-contained static feature-test copy of the Atlas application. It is isolated from the original Atlas folder by a separate directory and separate browser localStorage namespaces. It is suitable for local demo and UX testing only.

## Completed Features

- Existing Atlas calculator, account pool, platform account, balance, bonus, turnover, ledger, settlement, withdrawal, Free Bet, and sequential mix flows are preserved in this copy.
- Permanent `TEST ENVIRONMENT` and `Atlas Lab V2` identification.
- Lab Operations Center with session lifecycle controls and validation.
- Session Account Pool visibility and add-account action.
- Account Health, Rotation Planner, warnings, approvals, tasks, balance explanations, reconciliation, Owner intelligence, versioned platform rules, feature flags, and comparison view.
- Fictional multi-client demo data with client, user, identity, platform, account, session, event, allocation, rule, task, ledger, approval, reconciliation, warning, audit, and insight relationships.
- Owner-only Lab JSON export/import/reset controls.
- Local server, project documentation, restore instructions, and calculator,
  workflow, Mix, appearance, and Lab regression suites.

## Partial or Intentionally Local Features

- Authentication and role enforcement are client-side demo logic in `app.js` and `atlas-lab-service.js`.
- Data persistence is browser localStorage, not a shared database.
- Storage paths, queue paths, and notification paths in the Lab state are logical isolation metadata for this static proof; they are not server-backed services.
- External platform, payment, withdrawal, notification, and cloud storage integrations are not connected.

## Important Design Decisions

- The original current app was copied into `outputs/account-management-app-atlas-lab-v2`; the original `outputs/account-management-app-session-pool` folder must remain unchanged.
- Financial arithmetic is rounded to two decimals in the Lab service. Historical rule snapshots are attached to demo records rather than resolved from a mutable global setting.
- The Lab controller reads and writes only through `AtlasLabService`; it does not reuse the main app storage key.
- The existing calculator remains the mathematical source of truth. Do not duplicate calculator formulas in presentation components.
- Demo data is fictional. Never replace it with real customer data in Git.

## Data and Authentication Architecture

- Main copied app state key: `atlas-lab-v2-atlas-state-v1`.
- Lab workspace state key: `atlas-lab-v2-state-v1`.
- Theme key: `atlas-lab-v2-theme-v1`.
- Session key: `atlas-lab-v2-session-v1`.
- Calculator layout key: `atlas-lab-v2-calculator-layout-v1`.
- Roles in the copied app: Owner, Admin, and Shareholder.
- Lab administration and feature flag mutations require the Owner role. Admins can view, operate, validate, and manage tasks within the local demo limits.

## External Services and Deployment

There are no detected external APIs, backend services, cloud databases, Docker files, migrations, or deployment manifests. Run the dependency-free local server with `node serve-local.js`. A production deployment must be designed separately and must not treat localStorage as an authorization boundary.

## Important Files

- `index.html`, `app.js`, `styles.css`: application shell and existing app.
- `atlas-lab-service.js`, `atlas-lab-controller.js`: Lab implementation.
- `atlas-workflow-service.js`, `atlas-calculator-service.js`, `atlas-mix-service.js`: preserved domain logic.
- `tests/atlas-lab-tests.js`: Lab service regression coverage.
- `tests/run-all.js`: complete dependency-free syntax and regression runner.
- `ATLAS_LAB_V2.md`: original Lab feature-test report.
- `README.md`: clone, run, test, backup, and architecture instructions.
- `RESTORE_ON_NEW_COMPUTER.md`: machine recovery procedure.

## Recommended Next Tasks

1. Add a server-backed database schema and migrations.
2. Replace client-side demo login with server-side authentication and session management.
3. Enforce role, client, and shareholder isolation in API/data-access code.
4. Move secrets to a managed secret store and add encrypted backup storage.
5. Add immutable audit events and transaction-safe ledger/settlement workflows.
6. Add full browser acceptance coverage for desktop and mobile workflows.
7. Add CI checks for syntax, tests, build packaging, secret scanning, and backup restore.

## Warnings for the Next Session

- Do not add `.env`, browser exports, localStorage dumps, customer data, or real credentials to Git.
- Create both the main **Export Data** backup and the Administration
  **Export Lab Backup** before changing computers. They contain different
  localStorage namespaces.
- Do not change the production Atlas folders while experimenting in this repository.
- Do not claim the static role checks provide production security.
- Read the latest Git history and this handoff before changing calculator or settlement math.
