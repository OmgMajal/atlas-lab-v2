# Odds Intelligence Architecture

```text
Simulator / Future Provider
        ↓
Provider Adapter
        ↓
Provider Event
        ↓
Future Event Matching
        ↓
Canonical Event
        ↓
Market → Outcome → Odds Snapshot
        ↓
Future Best Odds / Opportunity Scanner
        ↓
Existing Atlas Calculator
```

`odds-domain.js` provides the decimal-odds models and validation. Provider
formats stop at `odds-provider-adapter.js`; current simulated payloads normalize
to Atlas model records. `odds-store.js` persists only to
`atlas-lab-v2-odds-intelligence-v1`. `odds-simulator.js` produces fictional
events and immutable snapshot history. `odds-controller.js` renders the Lab
screen.

The Calculator is intentionally separate: it remains the authoritative math
engine and does not call adapters or simulator data. Every odds change appends
a snapshot so later latency, slippage, matching, and audit work can use original
observations. Event matching, advanced market normalization, best odds,
opportunities, Calculator integration, and real APIs are deliberately postponed.
