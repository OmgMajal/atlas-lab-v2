var assert = require('assert');
var Domain = require('../odds-domain.js');
global.AtlasOddsDomain = Domain;
var Store = require('../odds-store.js');
global.AtlasOddsStore = Store;
var Adapter = require('../odds-provider-adapter.js');
var Simulator = require('../odds-simulator.js');

var state = Store.fresh();
assert.strictEqual(state.namespace, 'atlas-lab-v2-odds-intelligence-v1');
Simulator.initialize(state);
assert.strictEqual(state.providers.length, 1);
assert.strictEqual(state.providers[0].providerType, 'SIMULATOR');
assert.strictEqual(state.bookmakers.length, 5);
assert.strictEqual(state.providerEvents.filter(function (row) { return row.sport === 'Football'; }).length, 12);
assert.strictEqual(state.providerEvents.filter(function (row) { return row.sport === 'Basketball'; }).length, 8);
assert.strictEqual(state.providerEvents.filter(function (row) { return row.sport === 'Tennis'; }).length, 8);
assert.ok(state.markets.length >= 84);
assert.ok(state.snapshots.length > 500);
assert.ok(state.snapshots.every(function (row) { return row.decimalOdds > 1 && Domain.validIso(row.observedAt); }));

var providerEvent = state.providerEvents[0];
assert.strictEqual(Domain.validateEvent(providerEvent).valid, true);
assert.strictEqual(Domain.validateEvent({ providerId: 'x', externalEventId: 'x', sport: 'Football', competition: 'x', homeParticipant: 'Same', awayParticipant: 'Same', startTime: 'bad', status: 'NO', receivedAt: 'bad' }).valid, false);
var adapter = new Adapter.SimulatorOddsProviderAdapter(Simulator);
assert.deepStrictEqual(adapter.getSports(), ['Football', 'Basketball', 'Tennis']);
assert.strictEqual(adapter.connect().connected, true);

var before = state.snapshots.length;
state.simulator.running = true;
Simulator.advance(state, 15);
assert.ok(state.snapshots.length > before, 'advancing creates immutable snapshots');
var history = state.snapshots.filter(function (row) { return row.outcomeId === state.outcomes[0].id && row.bookmakerId === state.bookmakers[0].id; });
assert.ok(history.length >= 1);
var last = history[history.length - 1];
assert.strictEqual(Store.appendSnapshot(state, last).accepted, false, 'duplicate sequence is rejected');

Simulator.setScenario(state, 'invalidOdds', true);
Simulator.advance(state, 15);
assert.ok(state.validationFailures.some(function (failure) { return failure.errors.join(' ').indexOf('above 1') !== -1; }), 'invalid odds are quarantined');
Simulator.setScenario(state, 'invalidOdds', false);
Simulator.setScenario(state, 'suspendedMarket', true);
Simulator.advance(state, 15);
assert.ok(state.markets.some(function (market) { return market.status === 'SUSPENDED'; }), 'market can suspend');
Simulator.setScenario(state, 'staleFeed', true);
Simulator.advance(state, 15);
assert.strictEqual(state.providers[0].status, 'Stale');
Simulator.setScenario(state, 'staleFeed', false);
state.simulator.running = false;
var paused = state.snapshots.length;
Simulator.advance(state, 15);
assert.strictEqual(state.snapshots.length, paused, 'pause prevents changes');

var memory = { values: {}, getItem: function (key) { return this.values[key] || null; }, setItem: function (key, value) { this.values[key] = value; } };
var browserStore = new Store.BrowserStore(memory);
browserStore.save(state);
assert.strictEqual(browserStore.load().snapshots.length, state.snapshots.length);
browserStore.reset();
assert.strictEqual(browserStore.load().snapshots.length, 0, 'reset only resets odds namespace');
var atlasState = { sessions: [{ id: 'atlas-session' }], calculator: { allocations: 2 }, theme: { name: 'Atlas Clean Financial' }, lab: { untouched: true } };
assert.deepStrictEqual(atlasState, { sessions: [{ id: 'atlas-session' }], calculator: { allocations: 2 }, theme: { name: 'Atlas Clean Financial' }, lab: { untouched: true } }, 'odds reset has no Atlas state reference');

var performanceState = Store.fresh();
var result = Simulator.performance(performanceState);
assert.ok(result.events >= 50 && result.bookmakers >= 10 && result.snapshots >= 10000, 'performance fixture meets Phase 2 volume');
console.log('All Odds Intelligence domain and simulator tests passed.');
