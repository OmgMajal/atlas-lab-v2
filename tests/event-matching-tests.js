const assert = require('assert');
const Matching = require('../odds-event-matching.js');
const Simulator = require('../odds-simulator.js');
const fixtures = Simulator.matchingFixtures();
function row(name) { return fixtures.find((item) => item.scenario === name).events; }
function canonical(events) { return Object.assign({}, events[0], { id: 'canonical-' + events[0].id }); }
let exact = Matching.scoreCandidate(row('Exact match')[0], canonical(row('Exact match')));
assert.equal(exact.status, 'Auto Matched'); assert.equal(exact.confidenceLabel, 'Exact'); assert(exact.matchReasons.length);
let alias = Matching.scoreCandidate(row('Alias match')[0], canonical(row('Alias match')));
assert(alias.confidenceScore >= 85); assert(alias.matchReasons.some((reason) => reason.includes('aliases')));
let reversed = Matching.scoreCandidate(row('Reversed event')[1], canonical(row('Reversed event')));
assert(reversed.riskFlags.includes('Home/Away reversed'));
let bad = Matching.scoreCandidate(row('Bad match')[1], canonical(row('Bad match')));
assert(bad.confidenceScore < 50 || bad.status === 'Rejected' || bad.status === 'Needs Review');
let generated = Matching.matchAll(row('Conflict'), [canonical(row('Conflict')), Object.assign({}, canonical(row('Conflict')), { id: 'canonical-conflict-2', startTime: '2026-08-16T18:06:00.000Z' })]);
assert(generated.some((candidate) => candidate.status === 'Conflict'));
let state = { matchCandidates: [Object.assign({}, exact, { status: 'Confirmed', reviewedBy: 'Owner' })], matchHistory: [] };
let preserved = Matching.preserveManual(state.matchCandidates, [Object.assign({}, exact, { status: 'Auto Matched' })]);
assert.equal(preserved[0].status, 'Confirmed');
Matching.decide(state, exact.id, 'Rejected', 'Reviewer', 'Different fixture');
assert.equal(state.matchCandidates[0].status, 'Rejected'); assert.equal(state.matchHistory.length, 1);
console.log('Event Matching tests passed.');
