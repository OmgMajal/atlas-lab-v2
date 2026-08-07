# Atlas Architecture Baseline

## Purpose and boundary

Atlas Lab V2 is a dependency-free static reference implementation. `index.html`,
`styles.css`, and `app.js` provide the shell and controllers. Domain logic is
split across calculator, workflow, Mix, Lab, theme, profit, spreadsheet, and PDF
services. The browser is both the runtime and persistence host. This is suitable
for fictional local testing only.

The target incremental boundary is:

```text
Presentation
  -> Controllers / Application Services
  -> Domain Services
  -> Repository Contract
  -> LocalBrowserRepository (now)
  -> BackendRepository (future)
```

The static prototype remains the behavioral reference while access to
authoritative state is extracted behind repositories one workflow at a time.

## Application areas

| Area | Current implementation | Authority |
|---|---|---|
| Main Atlas | `app.js`, `index.html` | Browser state and controllers |
| Atlas Lab V2 | `atlas-lab-service.js`, `atlas-lab-controller.js` | Isolated Lab service |
| Calculator | calculator service plus compact view model | Calculator service |
| Sessions and Account Pool | `app.js`, workflow service | Workflow service for rules; controller for orchestration |
| Clients, identities, accounts, platforms | `app.js` collections and forms | Browser state |
| Free Bet and sequential Mix | `atlas-mix-service.js` | Mix service |
| Turnover and operational settlement | `atlas-workflow-service.js` | Workflow service |
| Withdrawals, wallets, banks, ledger | `app.js` | Browser state/controller |
| Shareholders | `profit-service.js` plus `app.js` | Profit service for distribution |
| Appearance | theme service and appearance controller | Theme service |
| Excel/PDF exports | XLSX and PDF services | Saved operation snapshots supplied by controller |
| Roles | `app.js`, Lab and Theme services | Browser-only checks |

## Persistence inventory

| Key | Owner | Contents | Operational data | Backend destination |
|---|---|---|---|---|
| `atlas-lab-v2-atlas-state-v1` | `app.js` | Clients, users, accounts, platforms, sessions, allocations, balances, withdrawals, ledger, shareholders, audit and application records | Yes, authoritative in prototype | Move all business collections to backend repositories |
| `atlas-lab-v2-state-v1` | `AtlasLabService` | Isolated Lab demo records, flags, warnings, tasks, approvals, reconciliation, audits | Yes, but fictional Lab-only | Production equivalents require backend persistence; Lab fixtures may remain local |
| `atlas-lab-v2-theme-v1` | `AtlasThemeService` | Themes, immutable versions, branding, appearance permissions/policies and personal preferences | Mixed | Global themes/permissions to backend; personal display preferences may remain local |
| `atlas-lab-v2-session-v1` | `app.js` | Signed-in demo user/session | Security-sensitive | Replace with server session; never trust as authorization |
| `atlas-lab-v2-calculator-layout-v1` | `app.js` | Selected view, density, column widths, filters, collapsed events and mobile selection | No | Remain local UI preference storage |

Local UI state includes calculator layout, density, panel/tab state, and
non-sensitive personal appearance choices. Authoritative business state includes
accounts, sessions, balances, allocations, settlement, withdrawals, ledger,
users, permissions, platform rules, and shareholders. These categories must not
share a future repository.

## Authoritative calculation services

| Rule | Authoritative function |
|---|---|
| Two-way and three-way allocation | `AtlasCalculatorService.calculate` |
| Scenario return matrix | `buildScenarioMatrix` and internal `scenarioReturns` |
| Gross/worst/best return | Calculator result `scenarios`, `worstProfit`, `bestProfit` |
| Balance availability and reservations | `AtlasWorkflowService.platformAvailableBalances`, `reservedAmount` |
| Free Bet stake-not-returned | `AtlasMixService.singleFreeBet` |
| Sequential Mix valuation/deduction | `combinedOdds`, `values`, `recordLegResult` |
| Multiple hedge records and settlement | `addHedge`, `settleHedgesForLeg`, `settlement` |
| Turnover | `turnoverSummary`, `turnoverBaseAmount`, `turnoverPercentForAccount` |
| Operational settlement | `settleOperationalSession` |
| Shareholder distribution | `AtlasProfitService.calculateDistribution` |
| Ledger totals | Controller aggregation in `app.js` |

No calculator formula was found in the compact view model. Some financial
aggregation remains in `app.js` (ledger/dashboard/exposure composition); this is
the principal extraction target. It should move to named domain/application
services, not be reimplemented in UI or API handlers.

## Historical integrity

Rule snapshots are stored with sessions/allocations. Locked allocation revisions
retain superseded records and reasons. Mix snapshots and audit history retain
deduction/hedge history. Production records that must become immutable after
execution include locked odds/stakes, executed allocations, settlements,
received withdrawals, ledger entries, rule versions, and completed shareholder
distributions. Corrections require reversal, adjustment, corrected record, and
audit event records rather than mutation.

## Acceptance criteria

- UI uses domain results rather than duplicating formulas.
- Business repositories and preference storage are separate.
- Historical operations retain rule snapshots and correction history.
- A future backend can implement the same repository contract.
- `node tests/run-all.js` remains green.
