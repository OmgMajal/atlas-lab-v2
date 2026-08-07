import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Mix = require('../atlas-mix-service.js');
const Repository = require('../atlas-repository.js');

function browserService(file, globalName) {
  const window = {};
  vm.runInNewContext(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { window, console });
  return window[globalName];
}

const Calculator = browserService('atlas-calculator-service.js', 'AtlasCalculatorService');
const Workflow = browserService('atlas-workflow-service.js', 'AtlasWorkflowService');
const Profit = browserService('profit-service.js', 'AtlasProfitService');
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.00001, `${message}: ${actual}`);

const twoWay = Calculator.calculate({
  marketType: 'Two Outcome',
  mode: 'Equal Scenario Profit',
  totalCapital: 1000,
  increment: 0.01,
  outcomes: [
    { id: 'a', name: 'A', marketKey: 'team1_win', odds: 2, active: true },
    { id: 'b', name: 'B', marketKey: 'team2_win', odds: 2, active: true }
  ]
});
close(twoWay.totalStake, 1000, 'two-way capital');
close(twoWay.outcomeRows[0].stake, 500, 'two-way first stake');
close(twoWay.scenarios[0].grossReturn, 1000, 'two-way gross return');
close(twoWay.worstProfit, 0, 'two-way worst case');

const threeWay = Calculator.calculate({
  marketType: 'Three Outcome',
  mode: 'Equal Scenario Profit',
  totalCapital: 1200,
  increment: 0.01,
  outcomes: [
    { id: 'a', name: 'Team 1 Win', marketKey: 'team1_win', odds: 3, active: true },
    { id: 'd', name: 'Draw', marketKey: 'draw', odds: 3, active: true },
    { id: 'b', name: 'Team 2 Win', marketKey: 'team2_win', odds: 3, active: true }
  ]
});
close(threeWay.totalStake, 1200, 'three-way capital');
threeWay.scenarios.forEach((row) => close(row.grossReturn, 1200, 'three-way equal return'));

const single = Mix.singleFreeBet(100, 4.5);
close(single.truePotentialWin, 350, 'Free Bet stake is not returned');

let mix = Mix.createMix({ clientId: 'demo-client', platformAccountId: 'demo-account', freeBetPortion: 100 });
mix = Mix.addLeg(mix, { eventName: 'One', market: 'Match Winner', outcome: 'One', lockedOdds: 2, eventStartTime: '2026-08-07T09:00:00Z', expectedSettlementTime: '2026-08-07T10:00:00Z' }, { userId: 'owner', role: 'owner' });
mix = Mix.addLeg(mix, { eventName: 'Two', market: 'Match Winner', outcome: 'Two', lockedOdds: 2, eventStartTime: '2026-08-07T10:30:00Z', expectedSettlementTime: '2026-08-07T11:00:00Z' }, { userId: 'owner', role: 'owner' });
mix = Mix.lockMix(mix, { userId: 'owner', role: 'owner' });
close(Mix.values(mix).provisionalFreeBetPotential, 400, 'provisional Mix value');
mix = Mix.recordLegResult(mix, Mix.activeLeg(mix).id, 'Won', { userId: 'owner', role: 'owner' });
close(Mix.values(mix).adjustedFreeBetPotential, 300, 'Mix deduction value');
assert.equal(mix.freeBetDeductionCount, 1);
mix = Mix.recordLegResult(mix, Mix.activeLeg(mix).id, 'Won', { userId: 'owner', role: 'owner' });
assert.ok(mix.freeBetDeductionCount <= 1, 'Mix deduction must be applied at most once');

let hedged = Mix.addHedge(mix, { clientId: 'demo-client', platformAccountId: 'h1', legId: 'l1', outcome: 'Opposite Outcome', stakeType: 'Cash', stakeAmount: 20, lockedOdds: 2, executedStatus: 'Executed' }, { userId: 'owner', role: 'owner' });
hedged = Mix.addHedge(hedged, { clientId: 'demo-client', platformAccountId: 'h2', legId: 'l2', outcome: 'Opposite Outcome', stakeType: 'Bonus', stakeAmount: 30, lockedOdds: 2.5, executedStatus: 'Executed' }, { userId: 'owner', role: 'owner' });
assert.deepEqual(hedged.hedges.map((row) => row.stakeAmount), [20, 30], 'multiple hedges remain separate');

const rule = Workflow.normalizeRule({ platformId: 'p', turnoverPercentage: 100, turnoverMethod: 'Deposit plus bonus' });
const turnover = Workflow.turnoverSummary({ fundingAmount: 500, bonusAmount: 100, completedTurnover: 150 }, rule);
close(turnover.requiredTurnoverAmount, 600, 'turnover required');
close(turnover.remainingTurnoverAmount, 450, 'turnover remaining');

const settlement = Workflow.settleOperationalSession({
  id: 's', resultStatus: 'Pending', activityLog: [], ruleSnapshot: rule
}, { platformId: 'p', fundingAmount: 500, bonusAmount: 100, completedTurnover: 150 }, {
  resultStatus: 'Won', executedStake: 200, payout: 360, refund: 0, withdrawalAmount: 0
}, { id: 'owner', role: 'owner' });
close(settlement.session.profitLoss, 160, 'settlement profit/loss');
close(settlement.turnoverDelta, 200, 'settlement turnover');

const distribution = Profit.calculateDistribution({
  shareholders: [
    { id: 's1', clientId: 'c1', investment: 600, profitSharePercentage: 50, status: 'Active' },
    { id: 's2', clientId: 'c2', investment: 400, profitSharePercentage: 25, status: 'Active' }
  ],
  totalProfitForPeriod: 1000,
  payments: []
});
close(distribution.rows[0].shareholderPayableProfit, 300, 'shareholder one payable');
close(distribution.rows[1].shareholderPayableProfit, 100, 'shareholder two payable');

const memory = {
  values: {},
  getItem(key) { return this.values[key] || null; },
  setItem(key, value) { this.values[key] = value; }
};
const repository = new Repository.LocalBrowserRepository({ storage: memory });
repository.writeState({ clients: [] });
repository.save('clients', { id: 'fictional-client', name: 'Fictional Client' });
assert.equal(repository.get('clients', 'fictional-client').name, 'Fictional Client');
assert.equal(Repository.isLocalPreferenceKey('atlas-lab-v2-calculator-layout-v1'), true);
assert.equal(Repository.isLocalPreferenceKey('atlas-lab-v2-atlas-state-v1'), false);

console.log('All Atlas domain contract tests passed.');
