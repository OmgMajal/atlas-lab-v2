# Atlas Next-Phase Roadmap

Prioritization order is financial risk, technical dependency, operational value,
user value, then implementation complexity.

## Phase A — Stabilization

- Preserve recovery commit/tag and verified development branch.
- Keep full regression suite green and add browser smoke checks.
- Maintain architecture, feature, permission, and production-gap baselines.
- Separate local UI preferences from authoritative business state.

Exit: clean tests, documented boundaries, reproducible environment, no private
data, and rollback to the recovery tag.

## Phase B — Domain hardening

- Expand two-/three-way calculator invariants and rounding/limit cases.
- Protect Free Bet stake-not-returned and platform-version behavior.
- Test Mix idempotency, void/cancel sequences, and multiple hedge settlement.
- Extract exposure, ledger totals, settlement and turnover invariants from UI.
- Define warnings with severity, block flag, record, fix and deduplication key.

Exit: domain services are deterministic and UI-independent with financial
contract tests.

## Phase C — Data layer

- Adopt repository contracts for clients, identities, platforms, accounts,
  sessions, events, allocations, settlements, withdrawals, ledger,
  shareholders, users and permissions.
- Move one bounded workflow at a time from direct state mutation to
  `LocalBrowserRepository`.
- Add optimistic version fields, command IDs and correction records.
- Keep preference storage in a separate local adapter.

Exit: the prototype operates through repositories without behavior changes.

## Phase D — Production backend

- Select backend architecture only after domain/data contracts stabilize.
- Implement authentication, secure sessions, database migrations and encrypted
  secrets.
- Enforce server-side roles, client/row scope, field visibility and approvals.
- Implement append-only audits, idempotent commands and multi-device access.

Exit: threat model, restore drill, authorization tests, migration rollback, and
no browser-authoritative financial state.

## Phase E — Financial integrity

- Double-entry ledger and balance derivation.
- Transactional settlement, withdrawals, reconciliation and correction flows.
- Locked shareholder periods, approved distributions and payment linkage.
- Independent reconciliation evidence and exception ownership.

Exit: balanced journals, immutable history, dual-control high-risk actions, and
certified end-to-end scenarios.

## Phase F — Operational intelligence

- Multi-dimensional Account Health with evidence and explanation.
- Explainable Rotation recommendations and alternatives.
- Owner “What Needs Attention” board.
- Actionable, deduplicated warning lifecycle.

Exit: recommendations never auto-execute and every item explains why, rule,
alternative, owner and blocking state.

## Phase G — UX refinement

- Mobile operational flows, density and accessibility certification.
- Consistent history/correction/approval actions.
- Export styling, lineage, reconciliation and print quality.
- Performance/virtualization for large tables.

Exit: representative desktop/mobile acceptance and accessible keyboard workflows.

## Immediate recommended slice

Begin production preparation with a read-only backend proof for platform rules
and account metadata, not balances or settlement. It exercises authentication,
client scope, repository substitution, migrations and audit without making the
first backend increment financially authoritative. Move money state only after
authorization, idempotency, ledger, backup and rollback foundations pass.
