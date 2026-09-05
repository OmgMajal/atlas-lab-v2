# Calculator autosave

Calculator drafts are stored locally under `atlas-calculator-drafts-v1`. The draft contains the session, events, odds, stakes, account assignments, mix/hedge inputs, calculation snapshot, and UI layout state. Changes are debounced for 500ms, flushed on blur-like navigation, section changes, and `beforeunload`.

The workbench shows `Saving...`, `Saved`, `Recovered draft`, `Unsaved changes`, or `Save failed`. `Start New Calculation` requires explicit confirmation and clears only the local draft; saved Calculator Sessions in the Atlas state are not deleted. Corrupt or unavailable draft storage is treated as a recoverable empty state and never crashes the app.
