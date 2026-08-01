(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtlasLabService = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var NAMESPACE = 'atlas-lab-v2-state-v1';
  var PROFILE_ID = 'atlas-lab-v2';
  var FEATURE_DEFINITIONS = [
    ['atlas_lab_account_health', 'Account Health', 'Operational, KYC, bonus, turnover, and withdrawal readiness.'],
    ['atlas_lab_rotation_planner', 'Rotation Planner', 'Account-use recommendations with a written explanation.'],
    ['atlas_lab_pre_execution_validation', 'Pre-execution Validation', 'A locked validation snapshot before execution.'],
    ['atlas_lab_live_exposure', 'Live Exposure', 'Session and Event downside, coverage, and corrective stake.'],
    ['atlas_lab_approval_workflow', 'Approval Workflow', 'Owner approval for restricted high-risk actions.'],
    ['atlas_lab_operational_tasks', 'Operational Tasks', 'Assignee, priority, due time, and completion history.'],
    ['atlas_lab_explanation_layer', 'Explanation Layer', 'Clickable balance, warning, and insight explanations.'],
    ['atlas_lab_advanced_reconciliation', 'Advanced Reconciliation', 'Session, Account, Client, Wallet, and Ledger checks.'],
    ['atlas_lab_intelligence_dashboard', 'Intelligence Dashboard', 'Owner observations and attention board.'],
    ['atlas_lab_versioned_platform_rules', 'Versioned Platform Rules', 'Immutable rules attached to historical Sessions.']
  ];

  var DEFAULT_FLAGS = FEATURE_DEFINITIONS.reduce(function (out, item) {
    out[item[0]] = true;
    return out;
  }, {});

  var TRANSITIONS = {
    'Draft': ['Planning', 'Cancelled'],
    'Planning': ['Validated', 'Approval Required', 'Cancelled', 'Under Review'],
    'Validated': ['Approval Required', 'Approved', 'Planning', 'Cancelled', 'Under Review'],
    'Approval Required': ['Approved', 'Planning', 'Cancelled', 'Under Review'],
    'Approved': ['Executing', 'Cancelled', 'Under Review'],
    'Executing': ['Partially Executed', 'Execution Complete', 'Under Review', 'Cancelled'],
    'Partially Executed': ['Executing', 'Execution Complete', 'Settling', 'Under Review'],
    'Execution Complete': ['Settling', 'Under Review'],
    'Settling': ['Partially Settled', 'Reconciled', 'Under Review'],
    'Partially Settled': ['Settling', 'Reconciled', 'Under Review'],
    'Reconciled': ['Closed', 'Under Review'],
    'Closed': ['Under Review'],
    'Cancelled': ['Under Review'],
    'Under Review': ['Planning', 'Approval Required', 'Settling', 'Reconciled', 'Closed']
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function nowIso() { return new Date().toISOString(); }
  function today() { return nowIso().slice(0, 10); }
  function n(value) { var parsed = Number(value); return isFinite(parsed) ? parsed : 0; }
  function round(value) { return Math.round(n(value) * 100) / 100; }
  function money(value, currency) { return (currency || 'USD') + ' ' + round(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function byId(list, id) { return (list || []).filter(function (item) { return item.id === id; })[0] || null; }
  function sum(list, fn) { return (list || []).reduce(function (total, item, index) { return total + n(fn ? fn(item, index) : item); }, 0); }

  function definitions() {
    return FEATURE_DEFINITIONS.map(function (item) { return { key: item[0], label: item[1], description: item[2] }; });
  }

  function demoData() {
    var clients = [
      { id: 'lab-client-01', name: 'Northstar Holdings', code: 'NORTH', currency: 'USD' },
      { id: 'lab-client-02', name: 'Cedar Bridge Capital', code: 'CEDAR', currency: 'EUR' }
    ];
    var users = [
      { id: 'lab-user-01', clientId: clients[0].id, name: 'Ava Reed', code: 'AVA' },
      { id: 'lab-user-02', clientId: clients[0].id, name: 'Noah Chen', code: 'NOAH' },
      { id: 'lab-user-03', clientId: clients[0].id, name: 'Mia Stone', code: 'MIA' },
      { id: 'lab-user-04', clientId: clients[1].id, name: 'Leo Martin', code: 'LEO' },
      { id: 'lab-user-05', clientId: clients[1].id, name: 'Sara Mills', code: 'SARA' },
      { id: 'lab-user-06', clientId: clients[1].id, name: 'Owen West', code: 'OWEN' }
    ];
    var identities = users.map(function (user, index) {
      return { id: 'lab-identity-' + (index + 1), userId: user.id, clientId: user.clientId, name: user.name + ' Identity', verification: index === 4 ? 'KYC Review' : 'Verified' };
    });
    var platforms = [
      { id: 'lab-platform-01', name: 'Northline Exchange', status: 'Active', currency: 'USD' },
      { id: 'lab-platform-02', name: 'Blue Oak Markets', status: 'Active', currency: 'USD' },
      { id: 'lab-platform-03', name: 'Crown Bet', status: 'Active', currency: 'EUR' },
      { id: 'lab-platform-04', name: 'Harbor Sports', status: 'Review', currency: 'USD' },
      { id: 'lab-platform-05', name: 'Summit Play', status: 'Active', currency: 'USD' }
    ];
    var rules = platforms.map(function (platform, index) {
      var versionId = 'lab-rule-version-' + (index + 1);
      return {
        id: 'lab-rule-' + (index + 1), platformId: platform.id, versionId: versionId,
        version: 'v' + (index + 1) + '.0', effectiveDate: '2026-07-' + String(10 + index).padStart(2, '0'),
        createdBy: 'lab-owner', changeReason: 'Initial Atlas Lab V2 snapshot', previousVersion: '',
        minOdds: index === 3 ? 1.5 : 1.2, maxOdds: index === 4 ? 6 : 20,
        minStake: 1, maxStake: index === 2 ? 500 : 1000, maxPayout: 5000,
        cashTurnover: 80 + index * 10, bonusTurnover: index === 1 ? 100 : 80,
        freeBetRule: index === 2 ? 'Stake not returned' : 'Stake returned', returnedStakeRule: 'Configured by platform',
        withdrawalLimit: 5000, withdrawalFee: index === 1 ? 2 : 0, twoOfThreeAllowance: index === 0 ? 'Not Allowed' : (index === 3 ? 'Manual Review Required' : 'Allowed'),
        mixRestrictions: index === 4 ? 'Manual review for unsafe timing' : 'Standard', accountReuse: index === 0 ? 'One outcome per event' : 'Up to two outcomes per event',
        safetyMargin: index === 3 ? 100 : 25, notes: 'Historical rule snapshot. Editing creates a new version.'
      };
    });
    var accounts = [];
    users.forEach(function (user, userIndex) {
      for (var slot = 0; slot < 2; slot += 1) {
        var index = accounts.length;
        var platform = platforms[(userIndex + slot) % platforms.length];
        var cash = 720 + index * 95;
        var bonus = index % 3 === 1 ? 100 : 0;
        var freeBet = index === 3 ? 45 : (index === 5 ? 60 : 0);
        var paused = index === 4;
        accounts.push({
          id: 'lab-account-' + String(index + 1).padStart(2, '0'), clientId: user.clientId, userId: user.id,
          identityId: identities[userIndex].id, platformId: platform.id, name: platform.name + ' / ' + user.code + ' / ' + (slot + 1),
          code: 'LAB-' + String(index + 1).padStart(2, '0'), status: paused ? 'Paused' : 'Active',
          operationalStatus: paused ? 'Paused' : 'Operational', kycStatus: paused ? 'KYC Review' : 'Verified',
          cash: cash, bonus: bonus, freeBet: freeBet, openingCash: cash, openingBonus: bonus, openingFreeBet: freeBet,
          reservedCash: index === 1 ? 130 : (index === 7 ? 220 : 0), reservedBonus: 0, reservedFreeBet: 0,
          pendingIncoming: index === 2 ? 100 : 0, pendingOutgoing: index === 6 ? 120 : 0, restrictedAmount: paused ? 50 : 0,
          safetyMargin: rules[index % rules.length].safetyMargin, remainingTurnover: index === 0 ? 74 : (index === 3 ? 0 : 420 + index * 50),
          completedTurnover: index === 0 ? 726 : 0, turnoverPercentage: rules[index % rules.length].cashTurnover,
          lastUseDate: index < 4 ? '2026-07-26' : '2026-07-20', consecutiveUseCount: index < 4 ? index + 2 : 0,
          currentExposure: index === 1 ? 150 : (index === 7 ? 220 : 0), withdrawalStatus: index === 0 ? 'Ready' : 'Not Ready',
          note: paused ? 'Paused for KYC review.' : ''
        });
      }
    });
    var sessions = [
      { id: 'lab-session-01', name: 'Morning 1X2 Coverage', status: 'Planning', createdAt: '2026-07-28T08:20:00.000Z', clientId: clients[0].id, capital: 4200, accountIds: accounts.slice(0, 4).map(function (a) { return a.id; }), events: ['lab-event-01'], approvalRequired: false, validationSnapshot: null },
      { id: 'lab-session-02', name: 'Partial Coverage Review', status: 'Approval Required', createdAt: '2026-07-28T09:10:00.000Z', clientId: clients[1].id, capital: 2400, accountIds: accounts.slice(4, 7).map(function (a) { return a.id; }), events: ['lab-event-02'], approvalRequired: true, validationSnapshot: null },
      { id: 'lab-session-03', name: 'Closed Turnover Example', status: 'Closed', createdAt: '2026-07-27T06:30:00.000Z', clientId: clients[0].id, capital: 1800, accountIds: accounts.slice(7, 10).map(function (a) { return a.id; }), events: ['lab-event-03'], approvalRequired: false, validationSnapshot: { passed: true, validatedAt: '2026-07-27T07:00:00.000Z' } }
    ];
    var events = [
      { id: 'lab-event-01', sessionId: 'lab-session-01', name: 'Riverside FC vs City Athletic', market: 'Match Winner', type: 'Two-way', requiredOutcomes: ['Riverside FC', 'City Athletic'], odds: { 'Riverside FC': 2.1, 'City Athletic': 1.86 }, status: 'Estimated' },
      { id: 'lab-event-02', sessionId: 'lab-session-02', name: 'Harbor United 1X2', market: '1X2', type: 'Three-way', requiredOutcomes: ['Harbor United', 'Draw', 'Lakeside'], odds: { 'Harbor United': 1.75, 'Draw': 3.9, 'Lakeside': 4.5 }, status: 'Approval Required' },
      { id: 'lab-event-03', sessionId: 'lab-session-03', name: 'Old Town Settlement', market: 'Match Winner', type: 'Two-way', requiredOutcomes: ['Old Town', 'East Borough'], odds: { 'Old Town': 2.4, 'East Borough': 1.6 }, status: 'Settled', actualResult: 'Old Town' }
    ];
    var allocations = [
      { id: 'lab-allocation-01', sessionId: 'lab-session-01', eventId: 'lab-event-01', outcome: 'Riverside FC', accountId: accounts[0].id, stake: 280, executedStake: 0, odds: 2.1, locked: true, status: 'Locked' },
      { id: 'lab-allocation-02', sessionId: 'lab-session-01', eventId: 'lab-event-01', outcome: 'City Athletic', accountId: accounts[1].id, stake: 316, executedStake: 0, odds: 1.86, locked: true, status: 'Locked' },
      { id: 'lab-allocation-03', sessionId: 'lab-session-02', eventId: 'lab-event-02', outcome: 'Harbor United', accountId: accounts[4].id, stake: 240, executedStake: 0, odds: 1.75, locked: false, status: 'Suggested' },
      { id: 'lab-allocation-04', sessionId: 'lab-session-03', eventId: 'lab-event-03', outcome: 'Old Town', accountId: accounts[7].id, stake: 150, executedStake: 150, odds: 2.4, locked: true, status: 'Settled' },
      { id: 'lab-allocation-05', sessionId: 'lab-session-03', eventId: 'lab-event-03', outcome: 'East Borough', accountId: accounts[8].id, stake: 225, executedStake: 225, odds: 1.6, locked: true, status: 'Settled' }
    ];
    return { clients: clients, users: users, identities: identities, platforms: platforms, rules: rules, accounts: accounts, sessions: sessions, events: events, allocations: allocations };
  }

  function freshState() {
    var createdAt = nowIso();
    return {
      namespace: NAMESPACE,
      profile: { id: PROFILE_ID, label: 'Atlas Lab V2', environment: 'TEST ENVIRONMENT', source: 'Atlas current isolated snapshot', createdAt: createdAt, version: '2.0-lab' },
      storage: { database: 'atlas_lab_v2', files: 'atlas-lab-v2/files', exports: 'atlas-lab-v2/exports', cache: 'atlas-lab-v2/cache', queue: 'atlas-lab-v2/queue', notifications: 'atlas-lab-v2/notifications-disabled' },
      snapshot: { id: uid('snapshot'), createdAt: createdAt, source: 'account-management-app-session-pool', sanitized: true, readOnlySource: true, verified: true, backupLocation: 'atlas-lab-v2/backup/current-atlas-snapshot.json' },
      featureFlags: clone(DEFAULT_FLAGS),
      demo: demoData(),
      tasks: [
        { id: 'lab-task-01', title: 'Prepare Session', assignee: 'Owner', priority: 'High', due: '2026-07-28T10:00:00.000Z', status: 'In Progress', related: 'lab-session-01', notes: 'Confirm the shared account pool.' },
        { id: 'lab-task-02', title: 'Resolve warning', assignee: 'Operations Admin', priority: 'Critical', due: '2026-07-28T11:00:00.000Z', status: 'New', related: 'lab-session-02', notes: 'Missing Draw coverage blocks execution.' },
        { id: 'lab-task-03', title: 'Confirm receipt', assignee: 'Owner', priority: 'Normal', due: '2026-07-29T12:00:00.000Z', status: 'Waiting', related: 'lab-withdrawal-01', notes: 'Delayed withdrawal example.' }
      ],
      warnings: [],
      approvals: [{ id: 'lab-approval-01', action: 'Approve reduced return Session', related: 'lab-session-02', requestedBy: 'Operations Admin', status: 'Pending', reason: 'Gross return is below the configured minimum.', createdAt: '2026-07-28T09:15:00.000Z', history: [] }],
      ledger: [
        { id: 'lab-ledger-01', date: '2026-07-28', type: 'Capital contribution', description: 'Northstar working capital', debit: 4200, credit: 4200, status: 'Balanced' },
        { id: 'lab-ledger-02', date: '2026-07-28', type: 'Platform funding', description: 'Session pool funding', debit: 800, credit: 800, status: 'Balanced' },
        { id: 'lab-ledger-03', date: '2026-07-27', type: 'Withdrawal', description: 'Delayed receipt example', debit: 250, credit: 250, status: 'Balanced' }
      ],
      reconciliations: [{ id: 'lab-recon-01', scope: 'Platform Account', subject: 'LAB-01', status: 'Passed', difference: 0, checkedAt: '2026-07-28T08:00:00.000Z' }, { id: 'lab-recon-02', scope: 'Session', subject: 'Partial Coverage Review', status: 'Exception', difference: 240, checkedAt: '2026-07-28T09:20:00.000Z' }],
      audits: [{ id: 'lab-audit-01', action: 'Imported isolated snapshot', actor: 'Owner', at: createdAt, target: 'Atlas Lab V2', reason: 'Safe feature test environment' }],
      insights: [],
      acceptance: {},
      comparison: { currentAtlas: { workflowSteps: 8, warnings: 'Current app checks', mobile: 'Desktop-first' }, labV2: { workflowSteps: 6, warnings: 'Explainable, severity-ranked', mobile: 'Task-specific views' } }
    };
  }

  function ensureState(state) {
    var next = state && state.namespace === NAMESPACE ? state : freshState();
    if (!next.profile) next.profile = freshState().profile;
    if (!next.storage) next.storage = freshState().storage;
    if (!next.snapshot) next.snapshot = freshState().snapshot;
    if (!next.featureFlags) next.featureFlags = clone(DEFAULT_FLAGS);
    Object.keys(DEFAULT_FLAGS).forEach(function (key) { if (next.featureFlags[key] == null) next.featureFlags[key] = DEFAULT_FLAGS[key]; });
    if (!next.demo) next.demo = demoData();
    ['tasks', 'warnings', 'approvals', 'ledger', 'reconciliations', 'audits', 'insights'].forEach(function (key) { if (!Array.isArray(next[key])) next[key] = []; });
    if (!next.acceptance) next.acceptance = {};
    return next;
  }

  function load() {
    try { var raw = localStorage.getItem(NAMESPACE); return ensureState(raw ? JSON.parse(raw) : null); } catch (error) { return freshState(); }
  }
  function save(state) { state = ensureState(state); localStorage.setItem(NAMESPACE, JSON.stringify(state)); return state; }
  function reset() { var state = freshState(); save(state); return state; }
  function can(role, action) {
    if (role === 'owner') return true;
    if (role === 'admin') return ['view', 'operate', 'task', 'validate'].indexOf(action) !== -1;
    if (role === 'shareholder') return ['view-own'].indexOf(action) !== -1;
    return false;
  }
  function featureEnabled(state, key) { return !!(state && state.featureFlags && state.featureFlags[key]); }
  function accountSpendable(account) {
    return { cash: round(n(account.cash) - n(account.reservedCash) - n(account.pendingOutgoing) - n(account.restrictedAmount) - n(account.safetyMargin)), bonus: round(n(account.bonus) - n(account.reservedBonus)), freeBet: round(n(account.freeBet) - n(account.reservedFreeBet)), total: round(n(account.cash) + n(account.bonus) + n(account.freeBet) - n(account.reservedCash) - n(account.reservedBonus) - n(account.reservedFreeBet) - n(account.pendingOutgoing) - n(account.restrictedAmount) - n(account.safetyMargin)) };
  }
  function balanceExplanation(account) {
    var spendable = accountSpendable(account);
    return { actualCash: n(account.cash), reservedCash: n(account.reservedCash), pendingOutgoing: n(account.pendingOutgoing), restrictedAmount: n(account.restrictedAmount), safetyMargin: n(account.safetyMargin), spendableCash: spendable.cash, formula: 'Actual cash - reserved cash - pending outgoing - restricted amount - safety margin' };
  }
  function platformRule(state, platformId) { return (state.demo.rules || []).filter(function (rule) { return rule.platformId === platformId; })[0] || null; }
  function accountHealth(state, account) {
    if (account.operationalStatus === 'Paused') return { state: 'Paused', tone: 'critical', reason: account.note || 'Operational status is paused.' };
    if (account.kycStatus !== 'Verified') return { state: 'KYC Review', tone: 'warning', reason: 'Identity verification requires review.' };
    if (n(account.remainingTurnover) > 0 && n(account.remainingTurnover) < 100) return { state: 'Needs Turnover', tone: 'warning', reason: 'Turnover is nearly complete.' };
    if (account.withdrawalStatus === 'Ready') return { state: 'Withdrawal Ready', tone: 'success', reason: 'Turnover is complete and withdrawal can be reviewed.' };
    if (n(account.currentExposure) > accountSpendable(account).cash * 0.5) return { state: 'Manual Review', tone: 'warning', reason: 'Current exposure is above the 50% spendable cash threshold.' };
    return { state: 'Healthy', tone: 'success', reason: 'Operational, verified, and within current exposure limits.' };
  }
  function rotationRecommendation(state, account) {
    var health = accountHealth(state, account);
    if (health.state === 'Paused' || health.state === 'KYC Review') return { label: 'Paused', tone: 'critical', reason: health.reason };
    if (n(account.consecutiveUseCount) >= 4) return { label: 'Cooling Down', tone: 'warning', reason: 'This identity and platform have been used repeatedly.' };
    if (n(account.remainingTurnover) > 0 && n(account.remainingTurnover) < 100) return { label: 'Complete Turnover First', tone: 'warning', reason: 'A small eligible allocation can finish turnover.' };
    if (account.withdrawalStatus === 'Ready') return { label: 'Withdraw First', tone: 'info', reason: 'Withdrawal-ready funds may be cleared before new exposure.' };
    return { label: 'Recommended', tone: 'success', reason: 'No current rotation restriction was found.' };
  }
  function sessionAccounts(state, session) { return (session.accountIds || []).map(function (id) { return byId(state.demo.accounts, id); }).filter(Boolean); }
  function sessionAllocations(state, sessionId) { return (state.demo.allocations || []).filter(function (item) { return item.sessionId === sessionId; }); }
  function validateSession(state, sessionId) {
    var session = byId(state.demo.sessions, sessionId);
    if (!session) return { passed: false, errors: [{ severity: 'Critical', code: 'missing-session', message: 'Session does not exist.' }], checks: [] };
    var errors = [], checks = [], accounts = sessionAccounts(state, session), allocations = sessionAllocations(state, sessionId);
    (session.events || []).forEach(function (eventId) {
      var event = byId(state.demo.events, eventId);
      if (!event) return;
      (event.requiredOutcomes || []).forEach(function (outcome) {
        var allocation = allocations.filter(function (item) { return item.eventId === event.id && item.outcome === outcome; })[0];
        if (!allocation) errors.push({ severity: 'Critical', code: 'missing-outcome', message: 'Missing required outcome: ' + outcome + '.', affected: event.name, fix: 'Add and confirm an allocation for this outcome.' });
      });
    });
    allocations.forEach(function (allocation) {
      var account = byId(accounts, allocation.accountId);
      var stake = n(allocation.executedStake || allocation.stake);
      if (!account) errors.push({ severity: 'Critical', code: 'account-not-in-pool', message: 'Allocation uses an account outside the Session Account Pool.', affected: allocation.outcome, fix: 'Add the account to the Session Pool before execution.' });
      else {
        var spendable = accountSpendable(account);
        if (stake > spendable.cash && allocation.status !== 'Settled') errors.push({ severity: 'Critical', code: 'insufficient-spendable-balance', message: 'Stake exceeds spendable cash for ' + account.code + '.', affected: account.name, fix: 'Reduce the stake, add funding, or select another account.' });
        var rule = platformRule(state, account.platformId);
        if (rule && n(allocation.odds) < n(rule.minOdds)) errors.push({ severity: 'High', code: 'odds-limit', message: 'Odds are below the platform minimum of ' + rule.minOdds + '.', affected: account.name, fix: 'Use eligible odds or select a compliant platform.' });
        if (rule && n(rule.maxStake) && stake > n(rule.maxStake)) errors.push({ severity: 'High', code: 'stake-limit', message: 'Stake exceeds the platform maximum of ' + rule.maxStake + '.', affected: account.name, fix: 'Split the stake or choose another account.' });
      }
    });
    if (session.approvalRequired && !(state.approvals || []).some(function (item) { return item.related === session.id && item.status === 'Approved'; })) errors.push({ severity: 'High', code: 'approval-missing', message: 'Owner approval is required before execution.', affected: session.name, fix: 'Approve the Session or explain the rejection.' });
    checks.push({ label: 'Required outcomes', passed: !errors.some(function (item) { return item.code === 'missing-outcome'; }) });
    checks.push({ label: 'Client ownership', passed: allocations.every(function (item) { var account = byId(accounts, item.accountId); return account && account.clientId === session.clientId; }) });
    checks.push({ label: 'Spendable balance', passed: !errors.some(function (item) { return item.code === 'insufficient-spendable-balance'; }) });
    checks.push({ label: 'Platform and stake limits', passed: !errors.some(function (item) { return item.code === 'odds-limit' || item.code === 'stake-limit'; }) });
    checks.push({ label: 'Required approvals', passed: !errors.some(function (item) { return item.code === 'approval-missing'; }) });
    return { passed: errors.length === 0, errors: errors, checks: checks, validatedAt: nowIso(), sessionId: sessionId };
  }
  function warningSummary(state) {
    var all = [];
    state.demo.sessions.forEach(function (session) { var result = validateSession(state, session.id); result.errors.forEach(function (item) { all.push(Object.assign({ sessionId: session.id, sessionName: session.name }, item)); }); });
    return all;
  }
  function transition(state, sessionId, nextStatus, actor, reason) {
    var session = byId(state.demo.sessions, sessionId);
    if (!session) throw new Error('Session not found.');
    var allowed = (TRANSITIONS[session.status] || []).indexOf(nextStatus) !== -1;
    if (!allowed) throw new Error('Cannot move ' + session.status + ' to ' + nextStatus + '.');
    if (nextStatus === 'Execution Complete') {
      var check = validateSession(state, sessionId);
      if (!check.passed) throw new Error('Execution is blocked by ' + check.errors.length + ' validation issue(s).');
    }
    var previous = session.status;
    session.status = nextStatus;
    session.updatedAt = nowIso();
    state.audits.unshift({ id: uid('lab-audit'), action: 'Session status changed', actor: actor || 'Owner', at: nowIso(), target: session.name, reason: reason || '', previousValue: previous, newValue: nextStatus });
    return session;
  }
  function audit(state, action, actor, target, reason, previousValue, newValue) { state.audits.unshift({ id: uid('lab-audit'), action: action, actor: actor || 'Owner', at: nowIso(), target: target || '', reason: reason || '', previousValue: previousValue == null ? null : clone(previousValue), newValue: newValue == null ? null : clone(newValue) }); }
  function ledgerBalanced(state) { return state.ledger.every(function (entry) { return round(entry.debit) === round(entry.credit); }); }
  function setFlag(state, key, enabled, actor, role) { if (role !== 'owner') throw new Error('Only Owner can change Atlas Lab feature flags.'); if (!Object.prototype.hasOwnProperty.call(DEFAULT_FLAGS, key)) throw new Error('Unknown feature flag.'); var previous = state.featureFlags[key]; state.featureFlags[key] = !!enabled; audit(state, 'Feature flag changed', actor, key, 'Atlas Lab V2 configuration', previous, !!enabled); return state; }
  function approve(state, approvalId, decision, actor, role, reason) { if (role !== 'owner') throw new Error('Only Owner can approve restricted actions.'); var item = byId(state.approvals, approvalId); if (!item) throw new Error('Approval request not found.'); item.status = decision; item.decidedBy = actor || 'Owner'; item.decidedAt = nowIso(); item.history = item.history || []; item.history.push({ decision: decision, actor: actor || 'Owner', at: item.decidedAt, reason: reason || '' }); audit(state, 'Approval decision', actor, item.action, reason, 'Pending', decision); return item; }
  function createTask(state, task, actor, role) { if (!can(role, 'task')) throw new Error('This role cannot create operational tasks.'); var item = Object.assign({ id: uid('lab-task'), status: 'New', createdAt: nowIso(), history: [] }, task); state.tasks.unshift(item); audit(state, 'Task created', actor, item.title, item.notes); return item; }
  function updateTask(state, taskId, status, actor, role, note) { if (!can(role, 'task')) throw new Error('This role cannot update operational tasks.'); var item = byId(state.tasks, taskId); if (!item) throw new Error('Task not found.'); item.status = status; item.history = item.history || []; item.history.push({ status: status, actor: actor || 'Operator', at: nowIso(), note: note || '' }); audit(state, 'Task status changed', actor, item.title, note, '', status); return item; }
  function addPoolAccount(state, sessionId, accountId, actor, role) { if (!can(role, 'operate')) throw new Error('This role cannot update a Session Account Pool.'); var session = byId(state.demo.sessions, sessionId), account = byId(state.demo.accounts, accountId); if (!session || !account) throw new Error('Session or Account not found.'); if ((session.accountIds || []).indexOf(accountId) === -1) { session.accountIds.push(accountId); audit(state, 'Account added to Session Pool', actor, account.code, 'Additional capital or capacity', null, accountId); } return session; }
  function reconcile(state, scope, subject, actor, role) { if (!can(role, 'validate')) throw new Error('This role cannot run reconciliation.'); var difference = 0; if (scope === 'Session') { var session = state.demo.sessions.filter(function (item) { return item.name === subject || item.id === subject; })[0]; if (session) difference = sum(sessionAllocations(state, session.id), function (item) { return n(item.stake) - n(item.executedStake); }); } var item = { id: uid('lab-recon'), scope: scope, subject: subject, status: round(difference) === 0 ? 'Passed' : 'Exception', difference: round(difference), checkedAt: nowIso(), checkedBy: actor || 'Owner' }; state.reconciliations.unshift(item); audit(state, 'Reconciliation completed', actor, scope + ': ' + subject, item.status); return item; }
  function buildInsights(state) {
    var warnings = warningSummary(state), accounts = state.demo.accounts;
    var turnoverReady = accounts.filter(function (a) { return n(a.remainingTurnover) > 0 && n(a.remainingTurnover) < 100; }).length;
    var repeated = accounts.filter(function (a) { return n(a.consecutiveUseCount) >= 4; }).length;
    var observations = [];
    if (turnoverReady) observations.push({ id: 'lab-insight-turnover', type: 'Recommendation', title: turnoverReady + ' Account(s) can finish turnover with a small eligible allocation.', data: 'Remaining turnover below 100 on the Account Health records.', severity: 'Informational' });
    if (repeated) observations.push({ id: 'lab-insight-rotation', type: 'Warning', title: repeated + ' Account(s) have repeated identity and Platform use.', data: 'Consecutive-use count is 4 or greater.', severity: 'Medium' });
    if (warnings.some(function (w) { return w.code === 'missing-outcome'; })) observations.push({ id: 'lab-insight-exposure', type: 'Warning', title: 'One or more Sessions have an uncovered outcome.', data: 'Pre-execution validation found a missing required leg.', severity: 'Critical' });
    if (accounts.some(function (a) { return a.withdrawalStatus === 'Ready'; })) observations.push({ id: 'lab-insight-withdrawal', type: 'Observation', title: 'Withdrawal-ready Accounts should be reviewed before new exposure.', data: 'Withdrawal status is Ready on at least one Account.', severity: 'Informational' });
    return observations;
  }
  function acceptanceItems() { return ['Account Health', 'Rotation Planner', 'New Session lifecycle', 'Account Pool', 'Calculator layout', 'Exposure Panel', 'Warning Center', 'Approval workflow', 'Task system', 'Balance explanation', 'Reconciliation', 'Owner dashboard', 'Intelligence recommendations', 'Mobile workflow']; }
  function setAcceptance(state, label, decision, actor, role) { if (role !== 'owner') throw new Error('Only Owner can record acceptance decisions.'); if (['Keep', 'Modify', 'Remove', 'Not Sure'].indexOf(decision) === -1) throw new Error('Unknown acceptance decision.'); state.acceptance[label] = { decision: decision, updatedBy: actor || 'Owner', updatedAt: nowIso() }; audit(state, 'Acceptance decision recorded', actor, label, decision); }
  function exportPayload(state) { return JSON.stringify({ exportedAt: nowIso(), namespace: NAMESPACE, profile: state.profile, storage: state.storage, snapshot: state.snapshot, featureFlags: state.featureFlags, demo: state.demo, tasks: state.tasks, warnings: state.warnings, approvals: state.approvals, ledger: state.ledger, reconciliations: state.reconciliations, audits: state.audits, insights: state.insights, acceptance: state.acceptance, comparison: state.comparison }, null, 2); }
  function importPayload(raw, role) { if (role !== 'owner') throw new Error('Only Owner can import an Atlas Lab backup.'); var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!parsed || parsed.namespace !== NAMESPACE) throw new Error('This file is not an Atlas Lab V2 backup.'); return ensureState(parsed); }

  return { NAMESPACE: NAMESPACE, PROFILE_ID: PROFILE_ID, TRANSITIONS: TRANSITIONS, definitions: definitions, freshState: freshState, ensureState: ensureState, load: load, save: save, reset: reset, can: can, featureEnabled: featureEnabled, accountSpendable: accountSpendable, balanceExplanation: balanceExplanation, platformRule: platformRule, accountHealth: accountHealth, rotationRecommendation: rotationRecommendation, validateSession: validateSession, warningSummary: warningSummary, transition: transition, audit: audit, ledgerBalanced: ledgerBalanced, setFlag: setFlag, approve: approve, createTask: createTask, updateTask: updateTask, addPoolAccount: addPoolAccount, reconcile: reconcile, buildInsights: buildInsights, acceptanceItems: acceptanceItems, setAcceptance: setAcceptance, exportPayload: exportPayload, importPayload: importPayload, money: money, round: round, byId: byId, uid: uid, nowIso: nowIso };
}));
