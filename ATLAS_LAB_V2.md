# Atlas Lab V2

Atlas Lab V2 is an isolated feature-test copy of Atlas. The original application folder was not edited.

## Access

- Folder: `outputs/account-management-app-atlas-lab-v2`
- Local URL: `http://127.0.0.1:4190/`
- Server helper: `serve-local.js`
- Demo Owner: `owner` / `owner123`
- Demo Admin: `admin` / `admin123`

The Lab permanently displays `TEST ENVIRONMENT` and `Atlas Lab V2`. It is not a production workspace.

## Isolation

The Lab uses its own localStorage namespaces and application profile:

- Profile: `atlas-lab-v2`
- State namespace: `atlas-lab-v2-state-v1`
- Theme namespace: `atlas-lab-v2-theme-v1`
- Session namespace: `atlas-lab-v2-session-v1`
- Calculator layout namespace: `atlas-lab-v2-calculator-layout-v1`
- Calculator draft namespace: `atlas-calculator-drafts-v1` (local autosave; saved Sessions remain in the Atlas state)
- Logical database: `atlas_lab_v2`
- Files: `atlas-lab-v2/files`
- Exports: `atlas-lab-v2/exports`
- Cache: `atlas-lab-v2/cache`
- Queue: `atlas-lab-v2/queue`
- Notifications: `atlas-lab-v2/notifications-disabled`

The seeded snapshot is sanitized, fictional, read-only source data with a recorded backup location at `atlas-lab-v2/backup/current-atlas-snapshot.json`. Export and import are Owner-only and validate the Lab namespace before accepting data.

## Implemented Lab Surface

- Operations Center with KPI cards, session lifecycle controls, validation snapshots, attention items, and operational tasks.
- Session Account Pool actions, including adding an account to an active session without resetting existing allocations.
- Finance view with spendable-balance explanations, ledger balance check, and reconciliation actions.
- Risk view with account health, rotation recommendations, ranked warnings, and approval controls.
- Intelligence view with Owner attention metrics, client performance, and explainable recommendations.
- Administration view with all ten feature flags, versioned platform rule snapshots, storage/isolation details, acceptance decisions, comparison mode, export/import, and Lab reset.
- Existing Atlas calculator, platform accounts, balances, bonuses, turnover, ledger, settlement, withdrawal, Free Bet, and sequential-mix integrations remain available through the copied app and are not replaced by a disconnected calculator.
- Fictional demo data keeps client, user, identity, platform, account, rule, session, event, allocation, ledger, task, approval, reconciliation, warning, audit, and insight relationships intact.

## Feature Flags

`atlas_lab_account_health`, `atlas_lab_rotation_planner`, `atlas_lab_pre_execution_validation`, `atlas_lab_live_exposure`, `atlas_lab_approval_workflow`, `atlas_lab_operational_tasks`, `atlas_lab_explanation_layer`, `atlas_lab_advanced_reconciliation`, `atlas_lab_intelligence_dashboard`, and `atlas_lab_versioned_platform_rules` are seeded enabled and can be changed by the Owner in Administration.

## Verification

From the project root:

```powershell
node tests\atlas-lab-tests.js
node --check app.js
node --check atlas-lab-service.js
node --check atlas-lab-controller.js
node --check serve-local.js
```

The Lab service test, the existing calculator mix regression, compact view-model, and acceptance tests pass in the source workspace. The self-contained repository test covers the Lab service; JavaScript syntax checks cover the copied application modules.

## Boundaries

This project is a static local proof environment. Its authentication, persistence, and role checks are client-side demo controls backed by localStorage; a production deployment still needs server-side authentication, authorization, database transactions, immutable audit storage, encrypted backups, and real queue/notification isolation. The existing calculator math and settlement services were preserved, but the full 12-scenario operational certification suite and real external payment/withdrawal execution are outside this local Lab proof.

## Rollback and Selective Merge

To remove the experiment, stop the Lab server and remove only the `outputs/account-management-app-atlas-lab-v2` folder plus the Lab localStorage keys listed above. Do not remove the original `outputs/account-management-app-session-pool` folder. For selective merge, review and port individual service/controller/style changes after server-side authorization and persistence are available; do not merge the Lab namespace, demo seed, or test-only login assumptions into production.
