# Atlas Compact Calculator Workspace

## Architecture

The Calculator remains part of the unified Atlas application. It uses the existing
local Atlas state, Account Pool, Platform rules, calculation engine, workflow
service, Mix service, settlement records, Ledger-facing records, and exports.

The compact workspace adds a presentation-only layer:

- `atlas-calculator-view-model.js` shapes Accounts, Events, allocations, warnings,
  turnover rows, result rows, KPIs, and footer values.
- `atlas-calculator-service.js` remains the mathematical source of truth.
- `atlas-workflow-service.js` remains the Account eligibility, turnover, Client
  isolation, and operational validation source of truth.
- `atlas-mix-service.js` remains the Free Bet, sequential Mix, hedge, and Mix
  settlement source of truth.
- `app.js` adapts domain data into the view model and owns explicit Owner actions.

No financial formula was copied into the grid, footer, mobile view, or dialogs.

## Workspace Structure

The active workspace is ordered as:

1. Compact Session bar
2. Compact KPI strip
3. Allocation, Balancing, Turnover, and Results tabs
4. Warning strip
5. Current view
6. Sticky summary footer

Accounts are fixed rows. Events and Mixes are horizontal column groups. The
Account Pool is selected once per Session and is reused by every Event.

## Four Views

- **Allocation:** Account-by-Event grid, compact allocation cells, Account filters,
  Account preview, Event details, and the cell editor.
- **Balancing:** scenario return table, profit/loss, ROI, target comparison, and
  remaining allocation by outcome.
- **Turnover:** required, completed, remaining, eligible odds, Session contribution,
  and status by Platform Account.
- **Results:** executed allocations, execution controls, result entry, settlement,
  final operation plan, final balances, withdrawals, and spreadsheet export.

All views read the same in-memory Session state. Changing a view or density never
changes financial data.

## Progressive Details

Secondary information is available through:

- Session Details drawer
- Manage Session Accounts drawer
- Event Details and Odds drawer
- Calculation and Allocation Details drawer
- Mix Details drawer
- Account Preview dialog
- Allocation cell editor
- Allocation and historical Event details

Locked allocations cannot be silently overwritten. Editing one creates a new
allocation revision, marks the previous record as superseded, and retains the
previous locked snapshot and revision reason. The Notes field is required as the
reason for a locked revision or cancellation.

## Warning and Summary Model

The warning strip combines:

- Calculator-engine warnings
- Missing Account Pool warnings
- Incomplete outcome coverage
- Platform eligibility and review messages
- Account operational warnings
- Mix timing warnings

Manual stakes use the existing equal-return coverage calculation so opposite
outcomes display the additional amounts needed to match the current best return.

The sticky footer reads the view model values produced from the existing
calculation result. It does not calculate stakes.

## Capital States

The compact model keeps these concepts separate:

- Planned: all active draft and locked allocations
- Reserved: locked or approved allocations not yet executed
- Executed: confirmed executed stake
- Spendable: opening balances minus locked reservations, executed use, pending
  outgoing amounts, and safety margin
- Estimated remaining: opening balances minus all current planned allocations

A draft affects planning forecasts but does not appear as financially Reserved.

## Layout Preferences

Calculator layout preferences are stored separately under
`atlas-lab-v2-calculator-layout-v1`:

- Selected view
- Comfortable, Compact, or Ultra Compact density
- Fixed and Event column widths
- Account search and filter
- Collapsed Events
- Mobile-selected Account and Event

These preferences are not stored in Calculator Sessions or financial records.

## Responsive and Accessibility

Desktop and tablet use sticky Account columns with horizontal Event scrolling.
Mobile uses explicit Account and Event selectors, a focused allocation action,
warnings, and a compact summary. Drawers become full-screen on mobile.

The workspace includes visible focus states, semantic labels, keyboard-accessible
dialogs, arrow-key cell navigation, Enter activation, Escape close, and
`Ctrl/Cmd+S` save. Reduced-motion preferences are respected.

## Permissions and Client Isolation

The existing Atlas role map keeps Calculator access Owner-only. Calculator actions
also check the current role before financial or allocation-sensitive changes.

A Session is locked to the Client of its first Account. Accounts from another
Client are rejected even if a stale UI selection is submitted.

## Persistence and Migration

No database migration is required. Existing Calculator Sessions are normalized
with default presentation-neutral fields while historical calculation, allocation,
rule snapshot, Mix, execution, result, and balance records remain unchanged.

## Known Limitations

This Atlas build is a static local application using browser `localStorage`; it has
no server, shared database, or server-side API layer. Therefore true server-side
authorization, database transactions, multi-user optimistic concurrency, and
row-level database isolation cannot be implemented in this build. The current
domain and role checks protect the local application workflow, and JSON backup plus
Excel export remain the data-loss recovery paths.

Large grids are compact and filtered but are not row/column virtualized. Add
virtualization when Atlas moves to a framework and server-backed data layer.
