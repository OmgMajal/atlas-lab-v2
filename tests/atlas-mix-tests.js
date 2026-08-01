var assert = require('assert');
var Mix = require('../atlas-mix-service.js');

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.00001, message + ': expected ' + expected + ', got ' + actual);
}

var actor = { userId: 'owner', role: 'owner' };
var single = Mix.singleFreeBet(100, 4.5);
close(single.effectiveFreeBetOdds, 3.5, 'single effective odds');
close(single.truePotentialWin, 350, 'single true win');

var mix = Mix.createMix({
  clientId: 'client-a',
  platformAccountId: 'account-a',
  cashPortion: 120,
  normalBonusPortion: 80,
  freeBetPortion: 100
});
[
  ['Leg 1', 1.5, '2026-07-28T18:00'],
  ['Leg 2', 2, '2026-07-28T18:35'],
  ['Leg 3', 1.8, '2026-07-28T19:10']
].forEach(function (row, index) {
  mix = Mix.addLeg(mix, {
    eventName: row[0],
    market: 'Match Winner',
    outcome: 'Selected',
    lockedOdds: row[1],
    eventStartTime: '2026-07-28T17:00',
    expectedSettlementTime: row[2],
    chronologicalPosition: index + 1
  }, actor);
});
mix = Mix.lockMix(mix, actor);
close(Mix.combinedOdds(mix), 5.4, 'combined odds');
var before = Mix.values(mix);
close(before.provisionalFreeBetPotential, 540, 'provisional free bet');
assert.equal(mix.freeBetDeductionApplied, false);
assert.equal(Mix.activeLeg(mix).eventName, 'Leg 1');

mix = Mix.recordLegResult(mix, Mix.activeLeg(mix).id, 'Won', actor);
var afterFirst = Mix.values(mix);
close(afterFirst.adjustedFreeBetPotential, 440, 'adjusted free bet');
close(afterFirst.cashPotential, 648, 'cash potential');
close(afterFirst.normalBonusPotential, 432, 'normal bonus potential');
close(afterFirst.trueCombinedPotential, 1520, 'true combined potential');
assert.equal(mix.freeBetDeductionCount, 1);
assert.equal(Mix.activeLeg(mix).eventName, 'Leg 2');

mix = Mix.recordLegResult(mix, Mix.activeLeg(mix).id, 'Won', actor);
assert.equal(mix.freeBetDeductionCount, 1);
assert.equal(Mix.activeLeg(mix).eventName, 'Leg 3');

var losing = Mix.createMix({ clientId: 'client-a', platformAccountId: 'account-a', freeBetPortion: 100 });
losing = Mix.addLeg(losing, { eventName: 'A', market: '1X2', outcome: 'A', lockedOdds: 1.5, eventStartTime: '2026-07-28T17:00', expectedSettlementTime: '2026-07-28T18:00' }, actor);
losing = Mix.addLeg(losing, { eventName: 'B', market: '1X2', outcome: 'B', lockedOdds: 2, eventStartTime: '2026-07-28T18:00', expectedSettlementTime: '2026-07-28T18:35' }, actor);
losing = Mix.lockMix(losing, actor);
losing = Mix.recordLegResult(losing, Mix.activeLeg(losing).id, 'Lost', actor);
assert.equal(losing.status, 'Lost');
assert.equal(losing.freeBetDeductionApplied, false);
close(Mix.settlement(losing).mainTicketReturn, 0, 'lost main return');

var gapMix = Mix.createMix({ minimumGapMinutes: 15, recommendedGapMinutes: 30 });
gapMix.legs = [
  { id: 'a', expectedSettlementTime: '2026-07-28T18:00', lockedOdds: 2 },
  { id: 'b', expectedSettlementTime: '2026-07-28T18:10', lockedOdds: 2 }
];
assert.equal(Mix.timeGapValidation(gapMix)[0].status, 'Insufficient Time Between Mix Legs');
gapMix.legs[1].expectedSettlementTime = '2026-07-28T18:20';
assert.equal(Mix.timeGapValidation(gapMix)[0].status, 'Limited Balancing Window');
gapMix.legs[1].expectedSettlementTime = '2026-07-28T18:35';
assert.equal(Mix.timeGapValidation(gapMix)[0].status, 'Sufficient Balancing Window');

var hedgeMix = Mix.addHedge(mix, { clientId: 'client-a', platformAccountId: 'hedge-a', outcome: 'Opposite Outcome', stakeType: 'Cash', stakeAmount: 200, lockedOdds: 2.2, executedStatus: 'Executed' }, actor);
hedgeMix = Mix.addHedge(hedgeMix, { clientId: 'client-a', platformAccountId: 'hedge-b', outcome: 'Opposite Outcome', stakeType: 'Cash', stakeAmount: 150, lockedOdds: 2.45, executedStatus: 'Executed' }, actor);
assert.equal(hedgeMix.hedges.length, 2);
close(hedgeMix.hedges[0].stakeAmount, 200, 'first hedge preserved');
close(hedgeMix.hedges[1].stakeAmount, 150, 'second hedge preserved');
var hedgeCountBefore = hedgeMix.hedges.length;
var suggestion = Mix.suggestion(hedgeMix, 2.1);
assert.ok(suggestion && suggestion.committed === false);
assert.equal(hedgeMix.hedges.length, hedgeCountBefore);

console.log('All Atlas Mix acceptance tests passed.');
