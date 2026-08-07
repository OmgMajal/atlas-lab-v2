# Atlas Feature Inventory

Statuses describe the restored implementation, not production readiness.

| Feature | Status | Main gap |
|---|---|---|
| Authentication | Prototype, Browser-Only, Needs Backend, Needs Security | Plain-text fictional credentials and local session |
| Roles | Partial, Browser-Only, Needs Backend, Needs Security | Only Owner/Admin/Shareholder; client checks are untrusted |
| Clients | Complete prototype, Browser-Only, Needs Backend | CRUD stored locally |
| Identities | Complete prototype, Browser-Only, Needs Backend, Needs Security | Sensitive identity fields require protected storage |
| Accounts | Complete prototype, Browser-Only, Needs Backend, Needs Security | Balances and credentials cannot remain client-authoritative |
| Platforms/rules | Complete prototype, Browser-Only, Needs Backend | Version snapshots exist; production governance is absent |
| Sessions | Complete prototype, Browser-Only, Needs Backend | No transactions or concurrency |
| Calculator | Complete, Needs Testing | Strong domain core; broaden invariant/property scenarios |
| Account Pool | Complete prototype, Browser-Only, Needs Backend | Cross-user concurrency absent |
| Account Health | Prototype, Needs Backend, Needs UX Improvement, Needs Testing | Multi-dimensional causes need clearer explanations |
| Rotation Planner | Prototype, Needs Backend, Needs Testing | Recommendations are advisory and demo-data driven |
| Exposure | Partial, Browser-Only, Needs Testing, Needs UX Improvement | Terminology and session aggregation need certification |
| Approvals | Prototype, Browser-Only, Needs Backend, Needs Security | Client can forge decisions |
| Tasks | Prototype, Browser-Only, Needs Backend | No shared queue or notifications |
| Free Bets | Complete domain prototype, Needs Testing | Platform-specific stake-return policy needs explicit versioning |
| Mixes | Complete domain prototype, Needs Testing | Sequential lifecycle needs broader repeated-settlement tests |
| Hedges | Complete domain prototype, Needs Testing | Multiple records are preserved; immutable execution needed |
| Turnover | Complete domain prototype, Needs Testing | Backend transaction and platform evidence required |
| Settlement | Complete prototype, Browser-Only, Needs Backend, Needs Security | No idempotent server transaction |
| Withdrawals | Partial, Browser-Only, Needs Backend, Needs Security | No payment integration or dual control |
| Wallets/banks | Prototype, Browser-Only, Needs Backend, Needs Security | Balances and transfers are locally mutable |
| Ledger | Partial, Browser-Only, Needs Backend, Needs Security | Not immutable/double-entry or transaction-safe |
| Reconciliation | Prototype, Browser-Only, Needs Backend, Needs Testing | Checks local claims rather than external evidence |
| Shareholders | Complete prototype, Browser-Only, Needs Backend, Needs Security | Distribution/payment records need period locking |
| Reports | Partial, Needs UX Improvement, Needs Testing | Source lineage and report certification need improvement |
| Excel export | Complete prototype, Needs UX Improvement, Needs Testing | Basic XML workbook; limited styling/print metadata |
| PDF export | Complete prototype, Needs Testing | Strong bilingual structure; snapshot/source references need verification |
| Theme system | Complete prototype, Browser-Only | Global permissions/version activation need server enforcement |
| Notifications | Mock, Browser-Only, Needs Backend | No delivery service |
| Audit history | Prototype, Browser-Only, Needs Backend, Needs Security | Mutable by anyone controlling browser storage |

## Roadmap use

“Complete” means the fictional local workflow works. Any feature marked
Browser-Only or Needs Security is not acceptable as a production control.

Validation: keep this inventory synchronized with acceptance tests and review it
at each phase gate in `ATLAS_NEXT_PHASE_ROADMAP.md`.
