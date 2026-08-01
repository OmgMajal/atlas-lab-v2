import { createRequire } from 'node:module';

globalThis.window = globalThis;
var require = createRequire(import.meta.url);
require('../profit-service.js');
require('../atlas-workflow-service.js');
require('../atlas-calculator-service.js');

function fail(message) {
  throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(message + ' Expected ' + expected + ', got ' + actual + '.');
  }
}

function assertApprox(actual, expected, message) {
  if (Math.abs(actual - expected) > 0.00001) {
    fail(message + ' Expected ' + expected + ', got ' + actual + '.');
  }
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseState() {
  return {
    clients: [
      { id: 'client-a', name: 'Client A', code: 'CLA' },
      { id: 'client-b', name: 'Client B', code: 'CLB' }
    ],
    users: [
      { id: 'user-1', clientId: 'client-a', name: 'User 1', code: 'U1', allocatedCapital: 6000, walletOpening: 2000, bankOpening: 1300, status: 'Active', note: '' },
      { id: 'user-2', clientId: 'client-a', name: 'User 2', code: 'U2', allocatedCapital: 3000, walletOpening: 0, bankOpening: 0, status: 'Active', note: '' },
      { id: 'user-b', clientId: 'client-b', name: 'User B', code: 'UB', allocatedCapital: 1000, walletOpening: 0, bankOpening: 0, status: 'Active', note: '' }
    ],
    shareholders: [
      { id: 'sh-a', clientId: 'client-a', investment: 10000, profitSharePercentage: 40, status: 'Active', investmentDate: '2026-07-01', currency: 'USD' },
      { id: 'sh-b', clientId: 'client-b', investment: 4000, profitSharePercentage: 50, status: 'Active', investmentDate: '2026-07-01', currency: 'USD' }
    ],
    accounts: [
      { id: 'wallet-a1', clientId: 'client-a', userId: 'user-1', platformId: '', name: 'User 1 Wallet', code: 'WAL1', type: 'Wallet', owner: 'Client User', opening: 2000 },
      { id: 'bank-a1', clientId: 'client-a', userId: 'user-1', platformId: '', name: 'User 1 Bank', code: 'BNK1', type: 'Bank', owner: 'Client User', opening: 1300 },
      { id: 'wallet-a2', clientId: 'client-a', userId: 'user-2', platformId: '', name: 'User 2 Wallet', code: 'WAL2', type: 'Wallet', owner: 'Client User', opening: 3000 },
      { id: 'wallet-b1', clientId: 'client-b', userId: 'user-b', platformId: '', name: 'User B Wallet', code: 'WALB', type: 'Wallet', owner: 'Client User', opening: 1000 }
    ],
    websites: [
      { id: 'site-x', name: 'Platform X', code: 'PLTX', type: 'Website' }
    ],
    userPlatforms: [
      { id: 'plat-a1', clientId: 'client-a', userId: 'user-1', platformId: 'site-x', username: 'alpha', accountCode: 'PLATX-A1', status: 'Active' }
    ],
    adminAssignments: [
      { id: 'asg-1', authUserId: 'auth-admin-a', clientId: 'client-a' }
    ],
    platformFundings: [],
    platformResults: [],
    expectedWithdrawals: [],
    platformRules: [],
    platformRuleVersions: [],
    allocations: [],
    operationalSessions: [],
    transfers: [],
    payments: [],
    incomes: [],
    costs: [],
    notifications: [],
    authUsers: [
      { id: 'auth-owner', role: 'owner', clientId: '' },
      { id: 'auth-admin-a', role: 'admin', clientId: '' },
      { id: 'auth-shareholder-a', role: 'shareholder', clientId: 'client-a' }
    ]
  };
}

function computeBalances(state) {
  var balances = {};
  state.accounts.forEach(function (account) {
    balances[account.id] = Number(account.opening) || 0;
  });
  state.platformFundings.forEach(function (funding) {
    balances[funding.sourceAccountId] = (balances[funding.sourceAccountId] || 0) - Number(funding.amount || 0);
  });
  state.expectedWithdrawals.forEach(function (row) {
    balances[row.destinationAccountId] = (balances[row.destinationAccountId] || 0) + Number(row.actualAmountReceived || 0);
  });
  return balances;
}

function run() {
  var state = baseState();
  var owner = state.authUsers[0];

  var summary = window.AtlasWorkflowService.clientCapitalSummary(state, 'client-a');
  assertEqual(summary.remainingCapital, 1000, 'Test 1 remaining capital should be 1000.');
  var allocationErrors = window.AtlasWorkflowService.validateUserAllocation(state, {
    clientId: 'client-a',
    name: 'User 3',
    allocatedCapital: 1500,
    walletOpening: 700,
    bankOpening: 800
  });
  assert(allocationErrors.some(function (item) { return item.indexOf('exceeds') !== -1; }), 'Test 1 should reject over-allocation.');

  var fundingPack = window.AtlasWorkflowService.createPlatformFunding(state, {
    date: '2026-07-09',
    clientId: 'client-a',
    userId: 'user-1',
    sourceType: 'Wallet',
    sourceAccountId: 'wallet-a1',
    platformAccountId: 'plat-a1',
    amount: 500,
    currency: 'USD',
    notes: 'Fund platform'
  }, owner);
  state.platformFundings.push(fundingPack.funding);
  state.notifications.push(fundingPack.notification);
  var balancesAfterFunding = computeBalances(state);
  assertApprox(balancesAfterFunding['wallet-a1'], 1500, 'Test 2 wallet should decrease after funding.');
  assertEqual(fundingPack.notification.title, 'Check platform result and record the expected withdrawal.', 'Test 2 should create the result-check notification.');

  var resultPack = window.AtlasWorkflowService.createPlatformResult(state, {
    clientId: 'client-a',
    userId: 'user-1',
    platformId: 'site-x',
    platformAccountId: 'plat-a1',
    fundingId: fundingPack.funding.id,
    originalAmount: 500,
    resultDate: '2026-07-10',
    resultAmount: 560,
    expectedWithdrawalAmount: 560,
    remainingInsidePlatform: 0,
    platformFees: 0,
    expectedDestinationAccountId: 'wallet-a1',
    assignedAdminId: 'auth-admin-a',
    currency: 'USD',
    notes: 'Settled'
  }, owner);
  state.platformResults.push(resultPack.result);
  state.expectedWithdrawals.push(resultPack.expectedWithdrawal);
  state.notifications.push(resultPack.notification);
  assertEqual(resultPack.expectedWithdrawal.expectedAmount, 560, 'Test 3 should create the expected withdrawal for 560.');
  assertEqual(resultPack.notification.title, 'Check whether the expected platform withdrawal has arrived.', 'Test 3 should create the withdrawal-arrival notification.');

  var received = window.AtlasWorkflowService.updateExpectedWithdrawal(resultPack.expectedWithdrawal, {
    status: 'Received',
    actualAmountReceived: 560,
    actualArrivalDate: '2026-07-11',
    destinationAccountId: 'wallet-a1'
  }, owner);
  state.expectedWithdrawals = [received];
  var balancesAfterReceipt = computeBalances(state);
  assertApprox(balancesAfterReceipt['wallet-a1'], 2060, 'Test 4 wallet should increase after receipt.');
  var perf = window.AtlasWorkflowService.platformPerformance(state, 'plat-a1');
  assertApprox(perf.netCashFlow, 60, 'Test 4 net cash flow should be +60.');
  assertApprox(perf.realizedProfitLoss, 60, 'Test 4 realized result should be +60 before fees.');

  var partial = window.AtlasWorkflowService.updateExpectedWithdrawal(resultPack.expectedWithdrawal, {
    status: 'Partially Received',
    actualAmountReceived: 300,
    actualArrivalDate: '2026-07-11',
    destinationAccountId: 'wallet-a1'
  }, owner);
  assertEqual(partial.status, 'Partially Received', 'Test 5 partial receipt status mismatch.');
  assertApprox(partial.expectedAmount - partial.actualAmountReceived, 260, 'Test 5 remaining expected amount should stay pending.');

  var delayed = window.AtlasWorkflowService.updateExpectedWithdrawal(resultPack.expectedWithdrawal, {
    status: 'Verification Required',
    delayReason: 'Verification Required'
  }, owner);
  assertEqual(delayed.status, 'Verification Required', 'Test 6 delayed status mismatch.');
  assertEqual(delayed.delayReason, 'Verification Required', 'Test 6 should store the reason.');

  var crossUserErrors = window.AtlasWorkflowService.validateTransfer(state, {
    movementType: 'Platform Withdrawal',
    clientId: 'client-a',
    userId: 'user-1',
    platformAccountId: 'plat-a1',
    toAccountId: 'wallet-a2',
    amount: 100
  });
  assert(crossUserErrors.some(function (item) { return item.indexOf('same user wallet or bank') !== -1; }), 'Test 7 should reject platform withdrawal to another user account.');

  var options = window.AtlasWorkflowService.transferOptions(state, {
    movementType: 'Internal Transfer',
    clientId: 'client-a',
    userId: 'user-1',
    fromAccountId: 'wallet-a1'
  });
  assert(options.destinationAccounts.every(function (item) { return item.clientId === 'client-a'; }), 'Test 8 should only show same-client transfer destinations.');
  var crossClientErrors = window.AtlasWorkflowService.validateTransfer(state, {
    movementType: 'Internal Transfer',
    clientId: 'client-a',
    userId: 'user-1',
    fromAccountId: 'wallet-a1',
    toAccountId: 'wallet-b1',
    amount: 50
  });
  assert(crossClientErrors.some(function (item) { return item.indexOf('selected client') !== -1 || item.indexOf('Destination account must belong') !== -1; }), 'Test 8 should reject cross-client transfer attempts.');

  var adminUser = state.authUsers[1];
  var shareholderUser = state.authUsers[2];
  assertEqual(window.AtlasWorkflowService.canAccessClient(state, adminUser, 'client-a'), true, 'Test 9 admin should access assigned Client A.');
  assertEqual(window.AtlasWorkflowService.canAccessClient(state, adminUser, 'client-b'), false, 'Test 9 admin should not access Client B.');
  assertEqual(window.AtlasWorkflowService.canAccessClient(state, shareholderUser, 'client-a'), true, 'Test 10 shareholder should access own client.');
  assertEqual(window.AtlasWorkflowService.canAccessClient(state, shareholderUser, 'client-b'), false, 'Test 10 shareholder should not access another client.');

  var dist = window.AtlasProfitService.calculateDistribution({
    shareholders: [{ id: 'share-a', clientId: 'client-a', investment: 1000, profitSharePercentage: 40, status: 'Active' }],
    payments: [],
    totalCompanyCapital: 4000,
    totalProfitForPeriod: 2000
  });
  assertApprox(dist.rows[0].shareholderPayableProfit, 200, 'Profit-share example should pay 200.');
  assertApprox(dist.rows[0].companyRetainedProfitFromShareholder, 300, 'Profit-share example should retain 300.');

  var rulesState = baseState();
  rulesState.websites = [
    { id: 'platform-a', name: 'Platform A', code: 'PLA', type: 'Website' },
    { id: 'platform-b', name: 'Platform B', code: 'PLB', type: 'Website' },
    { id: 'platform-c', name: 'Platform C', code: 'PLC', type: 'Website' }
  ];
  rulesState.userPlatforms = [
    { id: 'account-a', clientId: 'client-a', userId: 'user-1', platformId: 'platform-a', username: 'a', accountCode: 'A', status: 'Active', cashBalance: 1000, bonusBalance: 0, fundingAmount: 1000, bonusAmount: 0, completedTurnover: 0, turnoverPercentageOverride: '', customEligibleAmount: 0 },
    { id: 'account-b', clientId: 'client-a', userId: 'user-1', platformId: 'platform-b', username: 'b', accountCode: 'B', status: 'Active', cashBalance: 1000, bonusBalance: 0, fundingAmount: 1000, bonusAmount: 0, completedTurnover: 0, turnoverPercentageOverride: '', customEligibleAmount: 0 },
    { id: 'account-c', clientId: 'client-a', userId: 'user-1', platformId: 'platform-c', username: 'c', accountCode: 'C', status: 'Active', cashBalance: 1000, bonusBalance: 0, fundingAmount: 1000, bonusAmount: 0, completedTurnover: 0, turnoverPercentageOverride: '', customEligibleAmount: 0 },
    { id: 'account-reserve', clientId: 'client-a', userId: 'user-1', platformId: 'platform-a', username: 'r', accountCode: 'R', status: 'Active', cashBalance: 500, bonusBalance: 0, fundingAmount: 500, bonusAmount: 0, completedTurnover: 0, turnoverPercentageOverride: '', customEligibleAmount: 0 }
  ];
  rulesState.platformRules = [
    { id: 'rule-a', platformId: 'platform-a', platformStatus: 'Active', turnoverPercentage: 80, turnoverMethod: 'Deposit only', minEligibleOdds: 1.5, maxEligibleOdds: 0, maxStake: 0, maxPayout: 0, sameAccountMultipleOutcomes: false, maxOutcomesPerEvent: 1, sameAccountAcrossMarkets: false, multipleAccountsOneOutcome: false, twoOfThreeOutcomesAllowed: 'Not Allowed', manualApprovalRequired: false, effectiveDate: '2026-07-01' },
    { id: 'rule-b', platformId: 'platform-b', platformStatus: 'Active', turnoverPercentage: 80, turnoverMethod: 'Deposit only', minEligibleOdds: 1.01, maxEligibleOdds: 0, maxStake: 0, maxPayout: 0, sameAccountMultipleOutcomes: true, maxOutcomesPerEvent: 2, sameAccountAcrossMarkets: true, multipleAccountsOneOutcome: true, twoOfThreeOutcomesAllowed: 'Allowed', manualApprovalRequired: false, effectiveDate: '2026-07-01' },
    { id: 'rule-c', platformId: 'platform-c', platformStatus: 'Active', turnoverPercentage: 80, turnoverMethod: 'Deposit only', minEligibleOdds: 1.01, maxEligibleOdds: 0, maxStake: 0, maxPayout: 0, sameAccountMultipleOutcomes: true, maxOutcomesPerEvent: 3, sameAccountAcrossMarkets: true, multipleAccountsOneOutcome: true, twoOfThreeOutcomesAllowed: 'Manual Review Required', manualApprovalRequired: false, effectiveDate: '2026-07-01' }
  ];
  rulesState.allocations = [
    { id: 'alloc-a1', eventId: 'event-1', eventName: 'Team 1 vs Team 2', marketType: 'Three Outcome', marketName: 'Match Winner', outcomeName: 'Team 1', platformId: 'platform-a', platformAccountId: 'account-a', plannedStake: 100, status: 'Reserved' }
  ];
  var blockedSameAccount = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-1',
    eventName: 'Team 1 vs Team 2',
    marketType: 'Three Outcome',
    marketName: 'Match Winner',
    outcomeName: 'Draw',
    platformId: 'platform-a',
    odds: 1.7,
    stake: 100
  }, rulesState.userPlatforms[0]);
  assertEqual(blockedSameAccount.status, 'Unavailable', 'Rule Test 1 should block same account on another outcome.');
  assert(blockedSameAccount.reasons.some(function (item) { return item.indexOf('already assigned') !== -1; }), 'Rule Test 1 should explain same-event assignment.');

  rulesState.allocations = [
    { id: 'alloc-b1', eventId: 'event-2', eventName: 'Team 1 vs Team 2', marketType: 'Three Outcome', marketName: 'Match Winner', outcomeName: 'Team 1', platformId: 'platform-b', platformAccountId: 'account-b', plannedStake: 100, status: 'Reserved' }
  ];
  var secondOutcome = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-2',
    eventName: 'Team 1 vs Team 2',
    marketType: 'Three Outcome',
    marketName: 'Match Winner',
    outcomeName: 'Draw',
    platformId: 'platform-b',
    odds: 1.7,
    stake: 100
  }, rulesState.userPlatforms[1]);
  assert(secondOutcome.status !== 'Unavailable', 'Rule Test 2 should allow one additional outcome when maximum is 2.');
  rulesState.allocations.push({ id: 'alloc-b2', eventId: 'event-2', eventName: 'Team 1 vs Team 2', marketType: 'Three Outcome', marketName: 'Match Winner', outcomeName: 'Draw', platformId: 'platform-b', platformAccountId: 'account-b', plannedStake: 100, status: 'Reserved' });
  var thirdOutcome = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-2',
    eventName: 'Team 1 vs Team 2',
    marketType: 'Three Outcome',
    marketName: 'Match Winner',
    outcomeName: 'Team 2',
    platformId: 'platform-b',
    odds: 1.7,
    stake: 100
  }, rulesState.userPlatforms[1]);
  assertEqual(thirdOutcome.status, 'Unavailable', 'Rule Test 2 should block the third outcome.');

  rulesState.allocations = [
    { id: 'alloc-c1', eventId: 'event-3', eventName: 'Team 1 vs Team 2', marketType: 'Three Outcome', marketName: 'Match Winner', outcomeName: 'Team 1', platformId: 'platform-c', platformAccountId: 'account-c', plannedStake: 100, status: 'Reserved' }
  ];
  var manualReview = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-3',
    eventName: 'Team 1 vs Team 2',
    marketType: 'Three Outcome',
    marketName: 'Match Winner',
    outcomeName: 'Draw',
    platformId: 'platform-c',
    odds: 1.7,
    stake: 100
  }, rulesState.userPlatforms[2]);
  assertEqual(manualReview.status, 'Requires Review', 'Rule Test 3 should require manual review.');
  assert(manualReview.warnings.some(function (item) { return item.indexOf('Manual Platform Rule Review') !== -1; }), 'Rule Test 3 should explain manual review.');

  var depositOnly = window.AtlasWorkflowService.turnoverSummary({ platformId: 'platform-a', fundingAmount: 1000, bonusAmount: 100, completedTurnover: 0 }, rulesState.platformRules[0]);
  assertApprox(depositOnly.requiredTurnoverAmount, 800, 'Rule Test 4 deposit-only turnover should be 800.');
  var depositPlusBonus = window.AtlasWorkflowService.turnoverSummary({ platformId: 'platform-a', fundingAmount: 1000, bonusAmount: 100, completedTurnover: 0 }, Object.assign({}, rulesState.platformRules[0], { turnoverMethod: 'Deposit plus bonus' }));
  assertApprox(depositPlusBonus.requiredTurnoverAmount, 880, 'Rule Test 5 deposit-plus-bonus turnover should be 880.');

  var settleAccount = { id: 'settle-account', platformId: 'platform-b', fundingAmount: 500, bonusAmount: 0, completedTurnover: 0, turnoverPercentageOverride: 100, cashBalance: 1000, bonusBalance: 0 };
  var settled = window.AtlasWorkflowService.settleOperationalSession({
    id: 'session-1',
    ruleSnapshot: Object.assign({}, rulesState.platformRules[1], { turnoverPercentage: 100 }),
    requiredTurnoverAllocation: 300,
    activityLog: []
  }, settleAccount, {
    resultStatus: 'Lost',
    executedStake: 270,
    payout: 0,
    refund: 0,
    paymentStatus: 'Pending'
  }, owner);
  assertApprox(settled.turnoverDelta, 270, 'Rule Test 6 should use executed stake for rollover completion.');

  rulesState.allocations = [
    { id: 'alloc-r1', eventId: 'event-4', eventName: 'Reservation Event', marketType: 'Two Outcome', marketName: 'Winner', outcomeName: 'Team 1', platformId: 'platform-a', platformAccountId: 'account-reserve', plannedStake: 200, status: 'Reserved' }
  ];
  var reservationBlocked = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-5',
    eventName: 'Other Event',
    marketType: 'Two Outcome',
    marketName: 'Winner',
    outcomeName: 'Team 1',
    platformId: 'platform-a',
    odds: 1.7,
    stake: 400
  }, rulesState.userPlatforms[3]);
  assertEqual(reservationBlocked.status, 'Unavailable', 'Rule Test 7 should reject balance after reservation.');
  assertApprox(reservationBlocked.maxAdditionalStake, 300, 'Rule Test 7 maximum available amount should be 300.');

  var oddsBlocked = window.AtlasWorkflowService.evaluatePlatformAccount(rulesState, {
    eventId: 'event-6',
    eventName: 'Low Odds',
    marketType: 'Two Outcome',
    marketName: 'Winner',
    outcomeName: 'Team 1',
    platformId: 'platform-a',
    odds: 1.3,
    stake: 100
  }, rulesState.userPlatforms[0]);
  assert(oddsBlocked.reasons.some(function (item) { return item.indexOf('Odds are outside') !== -1; }), 'Rule Test 8 should warn on odds outside platform rule.');

  var threeWayCalc = window.AtlasCalculatorService.calculate({
    marketType: 'Three Outcome',
    mode: 'Equal Scenario Profit',
    totalCapital: 1000,
    targetReturn: 1000,
    increment: 0.01,
    outcomes: [
      { id: 'o1', name: 'Team 1 Win', marketKey: 'team1_win', odds: 2, active: true, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
      { id: 'o2', name: 'Draw', marketKey: 'draw', odds: 3, active: true, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
      { id: 'o3', name: 'Team 2 Win', marketKey: 'team2_win', odds: 6, active: true, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' }
    ]
  });
  assertApprox(threeWayCalc.totalStake, 1000, 'Calculator Test 1 should use the full capital.');
  assertEqual(threeWayCalc.outcomeRows.length, 3, 'Calculator Test 1 should calculate three active outcomes.');
  assert(threeWayCalc.spread < 0.05, 'Calculator Test 1 should equalize scenario profit.');

  var targetCalc = window.AtlasCalculatorService.calculate({
    marketType: 'Two Outcome',
    mode: 'Target Gross Return',
    totalCapital: 200,
    targetReturn: 100,
    increment: 0.01,
    outcomes: [
      { id: 'o1', name: 'Team 1 Win', marketKey: 'team1_win', odds: 2, active: true, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
      { id: 'o2', name: 'Team 2 Win', marketKey: 'team2_win', odds: 2, active: true, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' }
    ]
  });
  assertApprox(targetCalc.outcomeRows[0].stake, 50, 'Calculator Test 2 target return stake should be 50.');
  assertApprox(targetCalc.scenarios[0].grossReturn, 100, 'Calculator Test 2 gross return should match target.');

  var mixedCalc = window.AtlasCalculatorService.calculate({
    marketType: 'Mixed/DNB',
    mode: 'Equal Scenario Profit',
    totalCapital: 2000,
    targetReturn: 1000,
    increment: 0.01,
    outcomes: window.AtlasCalculatorService.makeOutcomeDefaults('Mixed/DNB')
  });
  assertEqual(mixedCalc.scenarios.length, 3, 'Calculator Test 3 mixed/DNB should evaluate three event-result scenarios.');
  assertEqual(mixedCalc.outcomeRows.length, 5, 'Calculator Test 3 mixed/DNB should keep five active outcome instruments.');
  assertApprox(mixedCalc.totalStake, 2000, 'Calculator Test 3 mixed/DNB should use the configured capital.');

  return 'All Atlas acceptance tests passed.';
}

export { run };

console.log(run());
