var assert = require('assert');
var ViewModel = require('../atlas-calculator-view-model.js');

var model = ViewModel.build({
  today: '2026-07-28',
  view: 'allocation',
  density: 'compact',
  targetReturnPercentage: 97,
  session: { id: 'session-a', name: 'Session 24', status: 'Active' },
  accounts: [
    {
      platformAccountId: 'account-a',
      accountName: 'PX04',
      platformName: 'Platform X',
      availableCapital: 650,
      reservedCapital: 200,
      executedCapital: 150,
      requiredTurnover: 800,
      completedTurnover: 300,
      remainingTurnover: 500,
      sessionTurnoverContribution: 150,
      eligibleOdds: '1.50-5.00'
    }
  ],
  events: [
    {
      id: 'event-a',
      eventName: 'RMA-MIL',
      marketName: '1X2',
      eventStartTime: '2026-07-28T18:30',
      isCurrent: true,
      status: 'Active',
      assignments: [
        {
          id: 'allocation-a',
          platformAccountId: 'account-a',
          outcomeId: 'outcome-a',
          outcomeName: 'Team 1',
          lockedOdds: 1.82,
          cashAmount: 400,
          locked: true
        }
      ]
    }
  ],
  result: {
    totalStake: 1000,
    worstProfit: -40,
    bestProfit: 25,
    outcomeRows: [
      { outcomeId: 'outcome-a', name: 'Team 1', stake: 400 },
      { outcomeId: 'outcome-b', name: 'Draw', stake: 300 },
      { outcomeId: 'outcome-c', name: 'Team 2', stake: 300 }
    ],
    scenarios: [
      { name: 'Team 1', grossReturn: 960, profitLoss: -40 },
      { name: 'Draw', grossReturn: 975, profitLoss: -25 },
      { name: 'Team 2', grossReturn: 1025, profitLoss: 25 }
    ]
  }
});

assert.equal(model.events[0].header.shortName, 'RMA-MIL');
assert.equal(model.events[0].header.meta, '1X2 \u2022 18:30');
assert.equal(model.events[0].cells[0].status, 'Locked');
assert.equal(model.events[0].cells[0].composition, 'C400');
assert.equal(model.summary.availableCapital, 650);
assert.equal(model.summary.reservedCapital, 200);
assert.equal(model.summary.requiredCapital, 1000);
assert.equal(model.summary.currentReturnPercentage, 96);
assert.equal(model.summary.remainingImbalance, 10);
assert.equal(model.summary.uncoveredOutcomes, 2);
assert.equal(model.warnings.length, 2);
assert.equal(model.turnover[0].status, 'In Progress');

assert.deepEqual(ViewModel.stakeParts({ cashAmount: 120, bonusAmount: 80, freeBetAmount: 100 }), {
  cash: 120,
  bonus: 80,
  freeBet: 100,
  total: 300,
  compact: 'C120 + B80 + FB100'
});
assert.equal(ViewModel.eventTimeLabel({ eventStartTime: '2026-07-29T18:30' }, '2026-07-28'), 'Jul 29, 18:30');
assert.equal(ViewModel.mixTimingLabel({ nextGapMinutes: 35 }), '+35m');
assert.equal(ViewModel.mixTimingLabel({ nextGapMinutes: 20 }), '20m Limited');
assert.equal(ViewModel.mixTimingLabel({ nextGapMinutes: 10 }), '10m Too Close');

var manualCoverageModel = ViewModel.build({
  accounts: [{ platformAccountId: 'account-a', availableCapital: 1000 }],
  events: [{ id: 'event-a', isCurrent: true, assignments: [] }],
  result: { totalStake: 400, outcomeRows: [], scenarios: [] },
  coverageRows: [
    { outcomeId: 'one', name: 'Team 1', requiredStake: 400, assignedStake: 400, remainingStake: 0 },
    { outcomeId: 'draw', name: 'Draw', requiredStake: 190, assignedStake: 0, remainingStake: 190 },
    { outcomeId: 'two', name: 'Team 2', requiredStake: 160, assignedStake: 0, remainingStake: 160 }
  ]
});
assert.equal(manualCoverageModel.summary.uncoveredOutcomes, 2);
assert.equal(manualCoverageModel.warnings.length, 2);
assert.equal(manualCoverageModel.warnings[0].message, 'Draw has 190.00 remaining to allocate.');

console.log('All Atlas compact view-model tests passed.');
