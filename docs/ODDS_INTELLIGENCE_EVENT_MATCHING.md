# Odds Intelligence Phase 3 — Event Matching

Phase 3 uses only fictional simulator fixtures. `odds-event-matching.js` normalizes participant and competition names, scores sport (15%), competition (15%), participants (35%), start-time proximity (25%), status (5%), and market compatibility (5%). The default auto-match threshold is 85/100 and the start-time tolerance is ±30 minutes.

Scores are explained with reasons and risk flags. Reversed home/away order is allowed only as a reviewable risk (`Home/Away reversed`); it is never silently ignored. Conflicts, mismatches, and out-of-tolerance times remain `Needs Review` or `Rejected`. Manual Confirm/Reject/Split decisions are kept in `matchHistory` and are not overwritten by a later simulator cycle.

The UI is explicitly marked `Experimental` and `Simulated Data`. Best Odds, opportunity scanning, arbitrage, external providers, and Calculator integration are intentionally out of scope.
