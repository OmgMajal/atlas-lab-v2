(function (root, factory) {
  var api = factory(root.AtlasOddsDomain);
  root.AtlasOddsStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis, function (Domain) {
  'use strict';
  var KEY = 'atlas-lab-v2-odds-intelligence-v1';
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fresh() { return { namespace: KEY, version: 2, createdAt: Domain.now(), simulator: { running: false, speed: 1, clock: '2026-08-16T12:00:00.000Z', scenarios: {}, cycles: 0 }, providers: [], bookmakers: [], providerEvents: [], canonicalEvents: [], markets: [], outcomes: [], snapshots: [], rawPayloads: [], validationFailures: [], duplicateCount: 0, matchingConfig: { autoMergeThreshold: 85, startTimeToleranceMinutes: 30 }, matchCandidates: [], matchHistory: [] }; }
  function ensure(state) { var next = state && state.namespace === KEY ? clone(state) : fresh(); ['providers','bookmakers','providerEvents','canonicalEvents','markets','outcomes','snapshots','rawPayloads','validationFailures','matchCandidates','matchHistory'].forEach(function (key) { if (!Array.isArray(next[key])) next[key] = []; }); if (!next.simulator) next.simulator = fresh().simulator; if (!next.matchingConfig) next.matchingConfig = fresh().matchingConfig; return next; }
  function BrowserStore(storage) { this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null); }
  BrowserStore.prototype.load = function () { try { return ensure(this.storage && this.storage.getItem(KEY) ? JSON.parse(this.storage.getItem(KEY)) : null); } catch (_) { return fresh(); } };
  BrowserStore.prototype.save = function (state) { state = ensure(state); if (this.storage) this.storage.setItem(KEY, JSON.stringify(state)); return state; };
  BrowserStore.prototype.reset = function () { var state = fresh(); return this.save(state); };
  function appendSnapshot(state, snapshot) { var seen = {}; state.snapshots.forEach(function (item) { seen[[item.providerId,item.bookmakerId,item.providerEventId,item.marketId,item.outcomeId,item.sequence].join('|')] = true; }); var check = Domain.validateSnapshot(snapshot, seen); if (!check.valid) { state.validationFailures.push({ id: Domain.id('odds-failure'), at: Domain.now(), errors: check.errors, input: clone(snapshot) }); if (check.errors.some(function (error) { return error.indexOf('Duplicate') !== -1; })) state.duplicateCount += 1; return { accepted: false, errors: check.errors }; } state.snapshots.push(clone(snapshot)); return { accepted: true, snapshot: snapshot }; }
  return { KEY: KEY, fresh: fresh, ensure: ensure, BrowserStore: BrowserStore, appendSnapshot: appendSnapshot };
}));
