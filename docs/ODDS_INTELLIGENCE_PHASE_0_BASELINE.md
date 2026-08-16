# Odds Intelligence Phase 0 Baseline

## Passing baseline

Before Odds Intelligence, Atlas passed syntax, Lab, Calculator view-model,
Mix/Free Bet, appearance security, financial domain contract, and acceptance
tests. The expanded contract suite protects two-way and three-way allocation,
stake distribution, gross return, best/worst case, Free Bet stake-not-returned,
one-time Mix deduction, multiple hedges, turnover, settlement profit/loss, and
shareholder distribution.

## Protected rules

- Calculator remains the only allocation/return engine.
- Free Bet return is stake × (decimal odds − 1) unless a future platform rule
  explicitly says stake is returned.
- Sequential Mix deduction is applied at most once.
- Multiple hedges remain independent records.
- Turnover uses its existing workflow-service rules.
- Settlement and historic snapshots must not be silently overwritten.

## Potential existing issue

`atlas-workflow-service.js` settlement calculation is intentionally treated as a
pure calculation in the current browser prototype. It does not by itself create
a server-side idempotency boundary. Risk: a future controller could apply a
calculated result twice. Follow-up: introduce transaction command IDs and an
append-only settlement ledger during the backend phase; do not change prototype
financial behavior in this Odds Intelligence work.

## Limitations

The browser prototype cannot guarantee server authorization, atomic settlement,
multi-device concurrency, or immutable financial storage. Odds Intelligence is
separate and must not alter these existing limitations.
