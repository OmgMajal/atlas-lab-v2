(function (root, factory) {
  var api = factory();
  root.AtlasOddsDomain = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var PROVIDER_TYPES = ['SIMULATOR', 'API', 'AGGREGATOR', 'EXCHANGE', 'MANUAL'];
  var HEALTH_STATES = ['Healthy', 'Delayed', 'Stale', 'Disconnected', 'Error', 'Paused'];
  var EVENT_STATUSES = ['UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'];
  var MARKET_TYPES = ['MONEYLINE_2WAY', 'MATCH_RESULT_3WAY', 'TOTAL', 'SPREAD', 'BOTH_TEAMS_TO_SCORE', 'DRAW_NO_BET', 'DOUBLE_CHANCE', 'SET_WINNER', 'TOTAL_GAMES'];
  var OUTCOME_TYPES = ['HOME', 'DRAW', 'AWAY', 'OVER', 'UNDER', 'YES', 'NO'];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function now() { return new Date().toISOString(); }
  function validIso(value) { return typeof value === 'string' && isFinite(Date.parse(value)); }
  function requireText(value, label, errors) { if (!String(value || '').trim()) errors.push(label + ' is required.'); }
  function validateSnapshot(input, seenSequences) {
    var errors = []; input = input || {};
    requireText(input.providerId, 'Provider', errors); requireText(input.bookmakerId, 'Bookmaker', errors);
    requireText(input.providerEventId, 'Provider event', errors); requireText(input.marketId, 'Market', errors); requireText(input.outcomeId, 'Outcome', errors);
    if (!isFinite(Number(input.decimalOdds)) || Number(input.decimalOdds) <= 1) errors.push('Decimal odds must be a numeric value above 1.');
    if (!validIso(input.observedAt) || !validIso(input.receivedAt)) errors.push('Observed and received timestamps must be ISO 8601 UTC values.');
    var key = [input.providerId, input.bookmakerId, input.providerEventId, input.marketId, input.outcomeId, input.sequence].join('|');
    if (seenSequences && seenSequences[key]) errors.push('Duplicate snapshot sequence.');
    return { valid: !errors.length, errors: errors, key: key };
  }
  function validateEvent(event) {
    var errors = []; event = event || {};
    ['providerId', 'externalEventId', 'sport', 'competition', 'homeParticipant', 'awayParticipant', 'status', 'receivedAt'].forEach(function (key) { requireText(event[key], key, errors); });
    if (!validIso(event.startTime) || !validIso(event.receivedAt)) errors.push('Event timestamps must be ISO 8601 UTC values.');
    if (event.status && EVENT_STATUSES.indexOf(event.status) === -1) errors.push('Unknown event status.');
    if (event.homeParticipant && event.homeParticipant === event.awayParticipant) errors.push('Participants cannot be identical.');
    return { valid: !errors.length, errors: errors };
  }
  function model(type, values) { return Object.assign({ id: id(type), metadata: {} }, clone(values || {})); }
  return { PROVIDER_TYPES: PROVIDER_TYPES, HEALTH_STATES: HEALTH_STATES, EVENT_STATUSES: EVENT_STATUSES, MARKET_TYPES: MARKET_TYPES, OUTCOME_TYPES: OUTCOME_TYPES, id: id, now: now, model: model, validateEvent: validateEvent, validateSnapshot: validateSnapshot, validIso: validIso };
}));
