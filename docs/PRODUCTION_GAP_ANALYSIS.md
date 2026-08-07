# Atlas Production Gap Analysis

## Risk register

| Area | Severity | Classification | Browser-trust failure | Required control |
|---|---|---|---|---|
| Authentication/session | Critical | Must fix before production | User/session can be edited locally | Server identity provider, secure sessions, revocation, MFA policy |
| Authorization and client isolation | Critical | Must fix before production | UI checks can be bypassed | Deny-by-default API authorization and row/client scope |
| Account balances/capital | Critical | Must fix before production | Values can be rewritten without transaction | ACID ledger-backed balance model |
| Allocations/execution | Critical | Must fix before production | Execution claims are client-authored | Idempotent commands, approval policy, immutable evidence |
| Settlement | Critical | Must fix before production | Repeat/alter settlement is possible | Transactional idempotent settlement with reversals |
| Withdrawals/banks/wallets | Critical | Must fix before production | Payment state and destinations are untrusted | Dual control, destination verification, payment integration |
| Ledger | Critical | Must fix before production | Audit and money rows are mutable | Append-only journal, balanced entries, reconciliation |
| Shareholder distributions | Critical | Must fix before production | Payables can be recomputed from altered inputs | Locked periods, approved distributions, payment linkage |
| Platform rule history | High | Must fix before production | Local rule/version records can be changed | Immutable versioned rules with effective dates |
| Audit history | Critical | Must fix before production | Same actor can rewrite its audit trail | Append-only server audit with actor/request correlation |
| Identities/account secrets | Critical | Must fix before production | Browser storage is readable to local scripts/users | Encryption, secret vaulting, strict field access |
| Approvals/permissions | Critical | Must fix before production | Approval decision can be forged | Server-side workflow and separation of duties |
| Reconciliation | High | Must fix before production | Compares locally asserted records | Independent sources and signed reconciliation runs |
| Notifications/tasks | Medium | Can remain prototype behavior | No reliable delivery/shared queue | Durable queue and delivery tracking |
| Account Health/Rotation | Medium | Can remain prototype behavior | Recommendations use local, incomplete evidence | Explainable backend features with human confirmation |
| Themes/global appearance | Low | Must fix before production for shared publishing | Admin capability can be modified locally | Server permissions/version publishing |
| Calculator layout/density/tab state | Low | Local preference only | Loss affects convenience only | Keep local; validate shape and size |
| Personal non-sensitive theme preference | Low | Local preference only | Loss affects appearance only | May remain local |

## Workflow findings

- Browser roles are navigation/demo controls, not a security boundary.
- `app.js` owns too many persistence and financial orchestration duties.
- Historical rule snapshots are a strong foundation and must be preserved.
- Execution, settlement, withdrawal, and ledger changes need idempotency keys and
  transaction boundaries before multi-device use.
- Multiple hedges are modeled as separate records and must not be collapsed.
- Corrections need explicit reversal/adjustment workflows; delete/edit controls
  must be removed for executed financial records in production.

## UI action audit

The prototype exposes create/edit/delete forms for most master data; calculator
save, lock, execute, settle, withdraw, reconcile, approve/reject, import/export,
and appearance version actions exist. Important gaps:

- No universal record history action on accounts, rules, withdrawals, ledger, or
  shareholder distributions.
- Archive/restore is inconsistent; destructive delete remains common.
- Executed records lack a uniform Correct/Reversal action.
- Approval submission and decision states are not consistently visible beside
  the affected record.
- Duplicate is useful for rules/themes/session templates but not consistently
  available.
- Export controls lack an explicit data-scope preview.

Buttons should only be added with an application command, permission, state
transition, audit event, and test.

## Operational intelligence findings

### Account Health

The Lab represents operational, bonus, KYC, turnover, withdrawal, rotation,
restriction, exposure, last-use, and consecutive-use factors across demo
records, but the UI summary can read like one status. Retain dimensions and show
reason, evidence time, blocking effect, and recommended action.

### Rotation Planner

Recommendations are advisory and include cause text, but alternatives and exact
rule/version references are not uniformly displayed. Never auto-select or
execute. Test Recommended, Available, Caution, Turnover First, Withdraw First,
Cooling Down, Avoid, and Manual Review scenarios.

### Exposure

Calculator scenario returns cover total stake, return, profit/loss, best/worst
and missing coverage. Session-level terms need standard definitions:
capital exposed = executed unresolved stake; reserved = locked unexecuted;
planned = active draft plus locked; maximum downside = minimum scenario net
result. Avoid calling planned or reserved money “exposed.”

### Warnings

Warnings contain severity/message/affected/fix in Lab validation, but severity
vocabulary varies across the main app and repeated low-value warnings are
possible. Normalize Critical/High/Medium/Informational, add a stable code,
blocking flag, record reference, resolution action, deduplication key, and
acknowledgement lifecycle.

### Owner dashboard

The dashboard covers capital, reserved capital, profit, shareholder payable,
payments, sessions and accounts needing attention. Add a prioritized “What Needs
Attention” command list for critical warnings, pending settlement/withdrawal,
reconciliation differences, turnover blockers, withdrawal-ready accounts, and
shareholder payable. Keep metrics explainable via component breakdowns.

## Export quality findings

- XLSX has readable sheets, column widths, frozen first row, and filters.
- XLSX lacks cell styles, currency/percentage/date number formats, print areas,
  explicit raw-data separation, and source/reference metadata.
- PDF provides English/Persian labels, currency/percentage formatting,
  operation sections, validation, historical-value notice, and showcase marking.
- Both formats need stable report ID, generation actor/time, filter/scope summary,
  source record IDs/versions, reconciliation status, and automated content tests.

## Acceptance criteria

Production work cannot begin with real data until all Critical “Must fix” items
have designs, tests, ownership, and rollback plans. Local preferences must stay
separate from business repositories. Financial state transitions must be
server-authorized, idempotent, transactional, and auditable.
