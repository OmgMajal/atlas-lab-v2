(function (root, factory) {
  var api = factory();
  root.AtlasRepository = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this), function () {
  'use strict';

  var BUSINESS_COLLECTIONS = [
    'clients', 'users', 'platforms', 'accounts', 'calculatorSessions',
    'sessionEvents', 'allocations', 'operationalSessions', 'expectedWithdrawals',
    'ledger', 'shareholders', 'authUsers', 'appearancePermissions'
  ];

  var LOCAL_PREFERENCE_KEYS = [
    'atlas-lab-v2-calculator-layout-v1'
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function requireCollection(name) {
    if (BUSINESS_COLLECTIONS.indexOf(name) === -1) {
      throw new Error('Unknown Atlas business collection: ' + name);
    }
  }

  function LocalBrowserRepository(options) {
    options = options || {};
    this.storage = options.storage;
    this.stateKey = options.stateKey || 'atlas-lab-v2-atlas-state-v1';
    if (!this.storage || typeof this.storage.getItem !== 'function' || typeof this.storage.setItem !== 'function') {
      throw new Error('LocalBrowserRepository requires a Storage-compatible adapter.');
    }
  }

  LocalBrowserRepository.prototype.readState = function () {
    var raw = this.storage.getItem(this.stateKey);
    return raw ? JSON.parse(raw) : {};
  };

  LocalBrowserRepository.prototype.writeState = function (state) {
    this.storage.setItem(this.stateKey, JSON.stringify(clone(state || {})));
  };

  LocalBrowserRepository.prototype.list = function (collection) {
    requireCollection(collection);
    var state = this.readState();
    return clone(Array.isArray(state[collection]) ? state[collection] : []);
  };

  LocalBrowserRepository.prototype.get = function (collection, id) {
    return this.list(collection).filter(function (item) { return item.id === id; })[0] || null;
  };

  LocalBrowserRepository.prototype.save = function (collection, record) {
    requireCollection(collection);
    if (!record || !record.id) throw new Error('Repository records require a stable id.');
    var state = this.readState();
    var rows = Array.isArray(state[collection]) ? state[collection].slice() : [];
    var index = rows.findIndex(function (item) { return item.id === record.id; });
    if (index === -1) rows.push(clone(record));
    else rows[index] = clone(record);
    state[collection] = rows;
    this.writeState(state);
    return clone(record);
  };

  function isLocalPreferenceKey(key) {
    return LOCAL_PREFERENCE_KEYS.indexOf(key) !== -1;
  }

  return {
    BUSINESS_COLLECTIONS: BUSINESS_COLLECTIONS.slice(),
    LOCAL_PREFERENCE_KEYS: LOCAL_PREFERENCE_KEYS.slice(),
    LocalBrowserRepository: LocalBrowserRepository,
    isLocalPreferenceKey: isLocalPreferenceKey
  };
});
