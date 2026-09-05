(function (root, factory) {
  var api = factory(root.AtlasOddsDomain);
  root.AtlasOddsEventMatching = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis, function (Domain) {
  'use strict';
  var DEFAULT_CONFIG = { autoMergeThreshold: 85, startTimeToleranceMinutes: 30, weights: { sport: 15, competition: 15, participants: 35, startTime: 25, status: 5, markets: 5 } };
  var LABELS = { exact: 'Exact', high: 'High Confidence', medium: 'Medium Confidence', review: 'Needs Review', rejected: 'Rejected' };
  var STATUSES = ['Pending', 'Auto Matched', 'Needs Review', 'Confirmed', 'Rejected', 'Split Required', 'Conflict'];
  var ALIASES = {
    'manchester united': ['man utd', 'man united', 'mufc'],
    'arsenal': ['arsenal fc'],
    'north city': ['north city fc', 'north city united'],
    'river town': ['river town united'],
    'mountain club': ['mountain club fc']
  };
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return Domain && Domain.now ? Domain.now() : new Date().toISOString(); }
  function id(prefix) { return (Domain && Domain.id ? Domain.id(prefix) : prefix + '-' + Date.now()); }
  function config(input) { var next = clone(DEFAULT_CONFIG); input = input || {}; Object.keys(input).forEach(function (key) { if (key === 'weights') next.weights = Object.assign(next.weights, input.weights || {}); else if (input[key] != null) next[key] = input[key]; }); return next; }
  function basic(value) { return String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\b(fc|cf|club|team|united)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
  function normalizeParticipant(value) { var text = basic(value); Object.keys(ALIASES).forEach(function (canonical) { ALIASES[canonical].forEach(function (alias) { if (text === basic(alias)) text = canonical; }); }); return text; }
  function normalizeCompetition(value) { return basic(value).replace(/\b(simulation|league|competition|division)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
  function aliasMatch(a, b) { return normalizeParticipant(a) === normalizeParticipant(b); }
  function minutesBetween(a, b) { return Math.abs(Date.parse(a) - Date.parse(b)) / 60000; }
  function timeScore(diff, tolerance) { if (!isFinite(diff) || diff > tolerance) return 0; if (diff <= 5) return 1; if (diff <= 15) return 0.8; return 0.5; }
  function statusCompatible(a, b) { if (!a || !b) return 0.5; if (a === b) return 1; if ((a === 'UPCOMING' && b === 'LIVE') || (a === 'LIVE' && b === 'UPCOMING')) return 0.5; return 0; }
  function marketTypes(event) { return (event && (event.marketTypes || event.markets || []) || []).map(function (m) { return typeof m === 'string' ? m : m.marketType; }).filter(Boolean); }
  function participantScore(provider, canonical, reasons, risks) {
    var direct = aliasMatch(provider.homeParticipant, canonical.homeParticipant) && aliasMatch(provider.awayParticipant, canonical.awayParticipant);
    var reversed = aliasMatch(provider.homeParticipant, canonical.awayParticipant) && aliasMatch(provider.awayParticipant, canonical.homeParticipant);
    if (direct) { reasons.push('Participants matched through aliases.'); return 1; }
    if (reversed) { reasons.push('Participants matched with reversed home/away order.'); risks.push('Home/Away reversed'); return 0.9; }
    if (normalizeParticipant(provider.homeParticipant) === normalizeParticipant(canonical.homeParticipant) || normalizeParticipant(provider.awayParticipant) === normalizeParticipant(canonical.awayParticipant)) { reasons.push('Only one participant matched.'); return 0.45; }
    reasons.push('Participants did not match.'); risks.push('Participants did not match.'); return 0;
  }
  function candidate(provider, canonical, options) {
    options = config(options); var reasons = [], risks = [], w = options.weights;
    var sport = String(provider.sport || '').toLowerCase() === String(canonical.sport || '').toLowerCase() ? 1 : 0;
    if (sport) reasons.push('Sport matched exactly.'); else risks.push('Sport mismatch');
    var competition = normalizeCompetition(provider.competition) === normalizeCompetition(canonical.competition) ? 1 : (normalizeCompetition(provider.competition).split(' ')[0] === normalizeCompetition(canonical.competition).split(' ')[0] ? 0.7 : 0);
    if (competition === 1) reasons.push('Competition matched through alias.'); else if (competition > 0) reasons.push('Competition partially matched.'); else risks.push('Competition mismatch');
    var participants = participantScore(provider, canonical, reasons, risks);
    var diff = minutesBetween(provider.startTime, canonical.startTime), timing = timeScore(diff, options.startTimeToleranceMinutes);
    if (timing) reasons.push('Start time difference: ' + (isFinite(diff) ? Math.round(diff * 10) / 10 : 'unknown') + ' minutes.'); else risks.push('Start time outside tolerance');
    var status = statusCompatible(provider.status, canonical.status); if (status === 1) reasons.push('Event status is compatible.'); else if (!status) risks.push('Event status conflict');
    var providerMarkets = marketTypes(provider), canonicalMarkets = marketTypes(canonical), markets = !providerMarkets.length || !canonicalMarkets.length ? 0.5 : (providerMarkets.filter(function (m) { return canonicalMarkets.indexOf(m) !== -1; }).length / Math.max(providerMarkets.length, canonicalMarkets.length));
    if (markets >= 1) reasons.push('Market types are compatible.'); else if (!markets) risks.push('Market compatibility is unknown');
    var score = Math.round((sport * w.sport + competition * w.competition + participants * w.participants + timing * w.startTime + status * w.status + markets * w.markets) * 100) / 100;
    var label = score >= 95 ? LABELS.exact : score >= 85 ? LABELS.high : score >= 70 ? LABELS.medium : score >= 50 ? LABELS.review : LABELS.rejected;
    var severe = risks.some(function (risk) { return ['Sport mismatch', 'Participants did not match.', 'Event status conflict', 'Start time outside tolerance'].indexOf(risk) !== -1; });
    var statusValue = score >= options.autoMergeThreshold && !severe ? 'Auto Matched' : (score < 50 || severe && participants === 0 ? 'Rejected' : 'Needs Review');
    return { id: id('match'), providerEventId: provider.id || provider.externalEventId, canonicalEventId: canonical.id, confidenceScore: score, confidenceLabel: label, matchReasons: reasons, riskFlags: risks, status: statusValue, createdAt: now(), updatedAt: now(), reviewedBy: '', reviewedAt: '', reviewNote: '', explanation: { score: score, label: label, reasons: reasons.slice(), riskFlags: risks.slice() } };
  }
  function matchAll(providerEvents, canonicalEvents, options) {
    var rows = []; (providerEvents || []).forEach(function (provider) { (canonicalEvents || []).forEach(function (canonical) { rows.push(candidate(provider, canonical, options)); }); });
    var byProvider = {}; rows.forEach(function (row) { (byProvider[row.providerEventId] = byProvider[row.providerEventId] || []).push(row); });
    rows.forEach(function (row) { var competitors = byProvider[row.providerEventId].filter(function (other) { return other.canonicalEventId !== row.canonicalEventId && Math.abs(other.confidenceScore - row.confidenceScore) < 5; }); if (competitors.length && row.confidenceScore >= 70) { row.status = 'Conflict'; row.riskFlags.push('Multiple similar canonical candidates'); } });
    return rows;
  }
  function decide(state, candidateId, decision, reviewer, note) { var row = (state.matchCandidates || []).filter(function (item) { return item.id === candidateId; })[0]; if (!row) throw new Error('Match candidate not found.'); if (['Confirm Match','Confirmed','Manual Match'].indexOf(decision) !== -1) { row.status = 'Confirmed'; } else if (['Reject Match','Rejected','Manual Split','Split Match'].indexOf(decision) !== -1) { row.status = decision === 'Manual Split' || decision === 'Split Match' ? 'Split Required' : 'Rejected'; } else if (decision === 'Needs Review') row.status = 'Needs Review'; else throw new Error('Unknown match decision.'); row.reviewedBy = reviewer || 'Owner'; row.reviewedAt = now(); row.reviewNote = note || ''; state.matchHistory = state.matchHistory || []; state.matchHistory.push({ id: id('match-decision'), candidateId: row.id, decision: row.status, reviewer: row.reviewedBy, reviewedAt: row.reviewedAt, note: row.reviewNote }); row.updatedAt = row.reviewedAt; return row; }
  function preserveManual(existing, generated) { var manual = {}; (existing || []).forEach(function (row) { if (['Confirmed', 'Rejected', 'Split Required'].indexOf(row.status) !== -1) manual[row.providerEventId + '|' + row.canonicalEventId] = row; }); return (generated || []).map(function (row) { var prior = manual[row.providerEventId + '|' + row.canonicalEventId]; return prior ? Object.assign(row, clone(prior), { updatedAt: now() }) : row; }); }
  return { DEFAULT_CONFIG: DEFAULT_CONFIG, LABELS: LABELS, STATUSES: STATUSES, aliases: clone(ALIASES), normalizeParticipant: normalizeParticipant, normalizeCompetition: normalizeCompetition, minutesBetween: minutesBetween, scoreCandidate: candidate, matchAll: matchAll, decide: decide, preserveManual: preserveManual, config: config };
}));
