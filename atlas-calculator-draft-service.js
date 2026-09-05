(function (root, factory) {
  var api = factory();
  root.AtlasCalculatorDraftService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var KEY = 'atlas-calculator-drafts-v1';
  var VERSION = 1;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function id() { return 'calc-draft-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function empty() { return { namespace: KEY, schemaVersion: VERSION, activeDraftId: '', drafts: [] }; }
  function safeLoad(storage) { try { var raw = storage && storage.getItem(KEY); var parsed = raw ? JSON.parse(raw) : empty(); return parsed && parsed.namespace === KEY && Array.isArray(parsed.drafts) ? parsed : empty(); } catch (_) { return empty(); } }
  function saveEnvelope(storage, envelope) { if (!storage) throw new Error('Calculator draft storage is unavailable.'); storage.setItem(KEY, JSON.stringify(envelope)); return envelope; }
  function makeDraft(snapshot, previous) { var base = previous || {}, inputs = snapshot.inputs || { sessionDraft: snapshot.sessionDraft, events: snapshot.events, calculatorDraft: snapshot.calculatorDraft, assignments: snapshot.assignments }; return { id: base.id || id(), name: base.name || 'Current Draft', sessionId: inputs.sessionDraft && inputs.sessionDraft.id || base.sessionId || '', clientId: inputs.sessionDraft && inputs.sessionDraft.clientId || base.clientId || '', lastUpdatedAt: now(), editedBy: snapshot.editedBy || base.editedBy || 'local profile', calculatorVersion: snapshot.calculatorVersion || 'atlas-calculator-v2', schemaVersion: VERSION, inputs: clone(inputs || {}), calculationSnapshot: clone(snapshot.calculationSnapshot || null), uiState: clone(snapshot.uiState || {}), dirty: false, recovery: { recoveredAt: base.recovery && base.recovery.recoveredAt || '', source: 'localStorage', lastSaveReason: snapshot.saveReason || 'autosave' } }; }
  function upsert(storage, snapshot, options) { options = options || {}; var envelope = safeLoad(storage), prior = envelope.drafts.filter(function (d) { return d.id === (options.draftId || envelope.activeDraftId); })[0]; var draft = makeDraft(snapshot, prior); if (options.name) draft.name = options.name; envelope.drafts = envelope.drafts.filter(function (d) { return d.id !== draft.id; }); envelope.drafts.push(draft); envelope.activeDraftId = draft.id; saveEnvelope(storage, envelope); return clone(draft); }
  function loadActive(storage) { var envelope = safeLoad(storage); var draft = envelope.drafts.filter(function (d) { return d.id === envelope.activeDraftId; })[0] || envelope.drafts[envelope.drafts.length - 1]; return draft ? clone(draft) : null; }
  function list(storage) { return safeLoad(storage).drafts.slice().sort(function (a, b) { return String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt)); }).map(clone); }
  function markDirty(storage, draftId) { var envelope = safeLoad(storage); var draft = envelope.drafts.filter(function (d) { return d.id === (draftId || envelope.activeDraftId); })[0]; if (!draft) return null; draft.dirty = true; draft.lastUpdatedAt = now(); saveEnvelope(storage, envelope); return clone(draft); }
  function clear(storage, draftId) { var envelope = safeLoad(storage); var target = draftId || envelope.activeDraftId; envelope.drafts = envelope.drafts.filter(function (d) { return d.id !== target; }); envelope.activeDraftId = envelope.drafts.length ? envelope.drafts[envelope.drafts.length - 1].id : ''; saveEnvelope(storage, envelope); return envelope; }
  function restore(snapshot, draft) { if (!draft) return snapshot; var next = clone(snapshot || {}); next.sessionDraft = clone(draft.inputs.sessionDraft || next.sessionDraft); next.events = clone(draft.inputs.events || next.events || []); next.calculatorDraft = clone(draft.inputs.calculatorDraft || next.calculatorDraft); next.assignments = clone(draft.inputs.assignments || next.assignments || {}); next.calculationSnapshot = clone(draft.calculationSnapshot); next.uiState = clone(draft.uiState || next.uiState || {}); return next; }
  function status(storage) { var draft = loadActive(storage); return draft ? (draft.recovery && draft.recovery.recoveredAt ? 'Recovered draft' : (draft.dirty ? 'Unsaved changes' : 'Saved')) : 'No draft'; }
  return { KEY: KEY, VERSION: VERSION, empty: empty, load: safeLoad, save: saveEnvelope, upsert: upsert, loadActive: loadActive, list: list, markDirty: markDirty, clear: clear, restore: restore, status: status };
}));
