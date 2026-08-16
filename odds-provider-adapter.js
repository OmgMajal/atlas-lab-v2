(function (root, factory) {
  var api = factory(root.AtlasOddsDomain);
  root.AtlasOddsProviderAdapter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis, function (Domain) {
  'use strict';
  function Contract() {}
  ['connect','disconnect','healthCheck','getSports','getUpcomingEvents','getLiveEvents','getMarkets','getOdds','normalizeEvent','normalizeMarket','normalizeOutcome','normalizeOdds'].forEach(function (name) { Contract.prototype[name] = function () { throw new Error('Provider adapter must implement ' + name + '().'); }; });
  function SimulatorOddsProviderAdapter(simulator) { this.simulator = simulator; }
  SimulatorOddsProviderAdapter.prototype = Object.create(Contract.prototype);
  SimulatorOddsProviderAdapter.prototype.constructor = SimulatorOddsProviderAdapter;
  SimulatorOddsProviderAdapter.prototype.connect = function () { return { connected: true, mode: 'SIMULATOR' }; };
  SimulatorOddsProviderAdapter.prototype.disconnect = function () { return { connected: false }; };
  SimulatorOddsProviderAdapter.prototype.healthCheck = function (state) { return state.providers[0] || null; };
  SimulatorOddsProviderAdapter.prototype.getSports = function () { return ['Football','Basketball','Tennis']; };
  SimulatorOddsProviderAdapter.prototype.getUpcomingEvents = function (state) { return state.providerEvents.filter(function (event) { return event.status === 'UPCOMING'; }); };
  SimulatorOddsProviderAdapter.prototype.getLiveEvents = function (state) { return state.providerEvents.filter(function (event) { return event.status === 'LIVE'; }); };
  SimulatorOddsProviderAdapter.prototype.getMarkets = function (state, event) { return state.markets.filter(function (market) { return market.eventId === (event.canonicalEventId || event.id); }); };
  SimulatorOddsProviderAdapter.prototype.getOdds = function (state, event) { return state.snapshots.filter(function (row) { return row.providerEventId === event.externalEventId; }); };
  SimulatorOddsProviderAdapter.prototype.normalizeEvent = function (raw) { return raw; };
  SimulatorOddsProviderAdapter.prototype.normalizeMarket = function (raw) { return raw; };
  SimulatorOddsProviderAdapter.prototype.normalizeOutcome = function (raw) { return raw; };
  SimulatorOddsProviderAdapter.prototype.normalizeOdds = function (raw) { return Number(raw.decimalOdds); };
  return { Contract: Contract, SimulatorOddsProviderAdapter: SimulatorOddsProviderAdapter };
}));
