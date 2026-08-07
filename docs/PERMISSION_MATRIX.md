# Atlas Permission Matrix

## Current prototype roles

| Capability | Owner | Admin | Shareholder |
|---|---:|---:|---:|
| Dashboard | All clients | Assigned/visible clients | Own client |
| Calculator and allocation | Yes | No in current route map | No |
| Lab view | Full; flags/admin/approvals | View/operate/task/validate | Own-view only in service |
| Ledger/portfolios/operations | Full | Client-scoped demo access | Own-client display |
| Withdrawals/payments/shareholders/P&L | Full | Client-scoped demo access | Own-client display |
| Users, assignments, settings | Full | Restricted | No |
| Appearance | Full | Explicit capability grants | No global access |
| Import/export/reset | Owner only | No | No |

Every current check is browser-only and must be repeated on a trusted backend.

## Target operational roles

| Role | Read scope | Allowed commands | Prohibited without additional approval |
|---|---|---|---|
| Owner | All authorized clients/company | Governance, approvals, overrides, configuration | Silent correction or audit mutation |
| Admin | Assigned clients | Master-data operations, tasks, prepare sessions | Owner grants, unrestricted financial execution |
| Risk Planner | Assigned sessions/accounts | Plan pool, health/rotation review, validate exposure | Execute, settle, withdraw |
| Executor | Assigned approved sessions | Confirm odds/stake and execute allocations | Change approval/rule snapshots, settle |
| Settlement Operator | Executed assigned events | Record results and propose settlement | Execute new stake, approve own correction |
| Withdrawal Operator | Withdrawal-ready assigned accounts | Prepare/submit/confirm withdrawal evidence | Change balances or destination without approval |
| Accountant | Financial scope | Ledger, reconciliation, adjustments, reports | Execute betting or approve own journal adjustment |
| Shareholder | Own legal/client scope | View approved statements, submit questions | Operational account/identity details and commands |

## Enforcement requirements

- API checks role, client, record state, assignment, approval, and field-level
  visibility for every command and query.
- High-risk actions use separation of duties; an actor cannot approve their own
  withdrawal, settlement correction, or ledger adjustment.
- Shareholders never receive platform credentials, unrelated clients, internal
  risk notes, or raw identity documents.
- Permissions are versioned and audited. UI visibility mirrors backend decisions
  but does not define them.

Validation: create one positive and one denial test per role/action/client-scope
combination before enabling a production endpoint.
