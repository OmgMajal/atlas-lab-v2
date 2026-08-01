(function () {
  var STORAGE_KEY = 'atlas-lab-v2-atlas-state-v1';
  var SESSION_KEY = 'atlas-lab-v2-session-v1';
  var CALCULATOR_LAYOUT_KEY = 'atlas-lab-v2-calculator-layout-v1';

  var seedState = {
    clients: [],
    users: [],
    websites: [],
    userPlatforms: [],
    shareholders: [],
    admins: [],
    adminAssignments: [],
    accounts: [],
    incomes: [],
    costs: [],
    transfers: [],
    payments: [],
    platformFundings: [],
    platformResults: [],
    expectedWithdrawals: [],
    notifications: [],
    questions: [],
    questionMessages: [],
    tasks: [],
    auditLogs: [],
    platformRules: [],
    platformRuleVersions: [],
    allocations: [],
    operationalSessions: [],
    calculatorSessions: [],
    mixTickets: [],
    accountBookmarks: [],
    exchanges: [],
    capitalContributions: [],
    approvalRequests: [],
    moneyPlacements: [],
    themes: [],
    themeVersions: [],
    activeThemes: [],
    appearancePermissions: [],
    userAppearancePreferences: [],
    appearancePolicies: [],
    authUsers: [
      { id: 'auth-owner', name: 'Owner', username: 'owner', password: 'owner123', role: 'owner', clientId: '' },
      { id: 'auth-admin', name: 'Operations Admin', username: 'admin', password: 'admin123', role: 'admin', clientId: '' },
      { id: 'auth-shareholder', name: 'Shareholder Client', username: 'shareholder', password: 'client123', role: 'shareholder', clientId: '' }
    ]
  };

  var state = loadState();
  var filters = { from: '2026-07-09', to: '2026-07-09', search: '' };
  var expandedTreeGroups = {};
  var currentSession = loadSession();
  var currentUser = null;
  var calculatorSessionDraft = createCalculatorSessionDraft();
  var calculatorSessionEvents = [];
  var activeCalculatorEventId = '';
  var calculatorDraft = createCalculatorDraft('Three Outcome');
  var calculatorResult = null;
  var calculatorAssignments = {};
  var activeCalculatorSessionId = '';
  var currentMixDraft = null;
  var currentMixSuggestion = null;
  var calculatorLayout = loadCalculatorLayout();
  var compactCalculatorModel = null;
  var calculatorCellContext = null;
  var calculatorDialogReturnFocus = null;

  var viewMeta = {
    dashboard: { title: 'Owner Dashboard', subtitle: 'Capital, payments, profit/loss, and operational reporting.' },
    calculator: { title: 'Calculator Setup', subtitle: 'Plan stakes, compare event scenarios, then send outcomes to rule-checked account allocation.' },
    lab: { title: 'Atlas Lab V2', subtitle: 'Isolated operations, finance, risk, intelligence, and acceptance testing.' },
    ledger: { title: 'Financial Ledger', subtitle: 'Income, costs, internal transfers, and platform-linked movements.' },
    portfolios: { title: 'Portfolios', subtitle: 'Client-scoped capital locations, approvals, and money movement history.' },
    operations: { title: 'Platform Operations', subtitle: 'Platform funding, result entry, and profitability workflow.' },
    withdrawals: { title: 'Expected Platform Withdrawals', subtitle: 'Arrival checks, pending money, and delay follow-up.' },
    payments: { title: 'Payment Management', subtitle: 'Pending, processing, completed, and failed shareholder payments.' },
    shareholders: { title: 'Shareholder Registry', subtitle: 'Investor capital and profit-share agreements.' },
    profitLoss: { title: 'Shareholder Profit/Loss', subtitle: 'Profit distribution, withdrawals, unpaid profit, and monthly history.' },
    parties: { title: 'Certified Account Holders', subtitle: 'Verified client, user, platform, bank, and wallet account registry.' },
    actions: { title: 'Notifications & Action Center', subtitle: 'Persistent reminders, follow-ups, and audit snapshot.' },
    questions: { title: 'Questions & Requests', subtitle: 'Shareholder, admin, and owner communication history.' },
    tasks: { title: 'Admin Tasks', subtitle: 'Owner-to-admin task assignment and operational follow-up.' },
    settings: { title: 'Owner Settings', subtitle: 'Role access, system users, and calculation rules.' },
    appearance: { title: 'Appearance & Branding', subtitle: 'Theme profiles, branding, accessibility, and workspace presentation.' },
    noAccess: { title: 'No Access', subtitle: 'This role cannot view the requested page.' }
  };

  var viewRoles = {
    dashboard: ['owner', 'admin', 'shareholder'],
    calculator: ['owner'],
    lab: ['owner', 'admin'],
    ledger: ['owner', 'admin', 'shareholder'],
    portfolios: ['owner', 'admin', 'shareholder'],
    operations: ['owner', 'admin'],
    withdrawals: ['owner', 'admin', 'shareholder'],
    payments: ['owner', 'admin', 'shareholder'],
    shareholders: ['owner', 'admin', 'shareholder'],
    profitLoss: ['owner', 'admin', 'shareholder'],
    parties: ['owner', 'admin', 'shareholder'],
    actions: ['owner', 'admin', 'shareholder'],
    questions: ['owner', 'admin', 'shareholder'],
    tasks: ['owner', 'admin'],
    settings: ['owner'],
    appearance: ['owner', 'admin'],
    noAccess: ['owner', 'admin', 'shareholder']
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return normalizeState(JSON.parse(raw));
      }
    } catch (error) {
      console.warn(error);
    }
    return normalizeState(clone(seedState));
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function defaultCalculatorLayout() {
    return {
      view: 'allocation',
      density: 'compact',
      fixedColumnWidth: 250,
      eventColumnWidth: 180,
      accountSearch: '',
      accountFilter: 'all',
      collapsedEvents: {},
      selectedAccountId: '',
      selectedEventId: ''
    };
  }

  function loadCalculatorLayout() {
    try {
      var raw = localStorage.getItem(CALCULATOR_LAYOUT_KEY);
      return Object.assign(defaultCalculatorLayout(), raw ? JSON.parse(raw) : {});
    } catch (error) {
      return defaultCalculatorLayout();
    }
  }

  function saveCalculatorLayout() {
    localStorage.setItem(CALCULATOR_LAYOUT_KEY, JSON.stringify(calculatorLayout));
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function saveSession(user) {
    currentSession = user ? { userId: user.id } : null;
    if (currentSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function normalizeState(input) {
    var next = input || {};
    Object.keys(seedState).forEach(function (key) {
      if (!Array.isArray(next[key])) next[key] = clone(seedState[key]);
    });
    next.incomes.forEach(function (item) {
      if (!item.accountId) item.accountId = '';
      if (!item.routeCode) item.routeCode = buildRoute('INC', item.date, item.clientId, item.userId, item.site, item.site, item.accountId);
    });
    next.costs.forEach(function (item) {
      if (!item.routeCode) item.routeCode = buildRoute('CST', item.date, item.clientId, item.userId, item.platformId, item.accountId, 'expense');
    });
    next.transfers.forEach(function (item) {
      if (!item.routeCode) item.routeCode = buildRoute('TRF', item.date, item.clientId, item.userId, item.platformId, item.from, item.to);
    });
    next.accounts.forEach(function (item) {
      if (!item.clientId) item.clientId = '';
      if (!item.userId) item.userId = '';
      if (!item.platformId) item.platformId = '';
    });
    next.userPlatforms.forEach(function (item) {
      if (!item.clientId) item.clientId = '';
      if (!item.userId) item.userId = '';
      if (!item.platformId) item.platformId = '';
      if (!item.status) item.status = 'Active';
      if (item.cashBalance == null) item.cashBalance = 0;
      if (item.bonusBalance == null) item.bonusBalance = 0;
      if (item.freeBetBalance == null) item.freeBetBalance = 0;
      if (item.bonusAmount == null) item.bonusAmount = num(item.bonusBalance);
      if (!item.bonusType) item.bonusType = '';
      if (!item.bonusExpiry) item.bonusExpiry = '';
      if (item.fundingAmount == null) item.fundingAmount = 0;
      if (item.turnoverPercentageOverride == null) item.turnoverPercentageOverride = '';
      if (item.completedTurnover == null) item.completedTurnover = 0;
      if (item.customEligibleAmount == null) item.customEligibleAmount = 0;
      var rule = window.AtlasWorkflowService ? window.AtlasWorkflowService.latestPlatformRule(next, item.platformId) : null;
      if (rule && window.AtlasWorkflowService) {
        var turnover = window.AtlasWorkflowService.turnoverSummary(item, rule);
        item.requiredTurnoverAmount = turnover.requiredTurnoverAmount;
        item.remainingTurnoverAmount = turnover.remainingTurnoverAmount;
      }
    });
    next.users.forEach(function (item) {
      if (!item.clientId) item.clientId = '';
      if (item.allocatedCapital == null) item.allocatedCapital = 0;
      if (item.walletOpening == null) item.walletOpening = 0;
      if (item.bankOpening == null) item.bankOpening = 0;
      if (!item.note) item.note = '';
      if (!item.status) item.status = 'Active';
    });
    next.shareholders.forEach(function (item) {
      if (!item.clientId) item.clientId = '';
      if (item.investment == null) item.investment = num(item.share);
      if (item.profitSharePercentage == null) item.profitSharePercentage = 100;
      if (!item.investmentDate) item.investmentDate = todayString();
      if (!item.currency) item.currency = 'USD';
      if (!item.status) item.status = 'Active';
    });
    next.payments.forEach(function (item) {
      if (!item.status) item.status = 'Pending';
      if (!item.note) item.note = '';
      if (!item.reference) item.reference = '';
      if (!item.paymentDate) item.paymentDate = '';
    });
    next.authUsers.forEach(function (item) {
      if (!item.role) item.role = 'shareholder';
      if (!item.clientId) item.clientId = '';
    });
    next.transfers.forEach(function (item) {
      if (!item.movementType) item.movementType = 'Internal Transfer';
      if (!item.platformAccountId) item.platformAccountId = '';
      if (!item.status) item.status = 'Completed';
      if (!item.currency) item.currency = 'USD';
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.createdBy) item.createdBy = '';
    });
    next.platformFundings.forEach(function (item) {
      if (!item.currency) item.currency = 'USD';
      if (!item.createdAt) item.createdAt = nowIso();
    });
    next.platformResults.forEach(function (item) {
      if (!item.createdAt) item.createdAt = nowIso();
      if (item.platformFees == null) item.platformFees = 0;
      if (item.remainingInsidePlatform == null) item.remainingInsidePlatform = 0;
    });
    next.expectedWithdrawals.forEach(function (item) {
      if (!item.status) item.status = 'Expected';
      if (!item.currency) item.currency = 'USD';
      if (item.actualAmountReceived == null) item.actualAmountReceived = 0;
      if (item.difference == null) item.difference = 0;
      if (!item.lastUpdated) item.lastUpdated = nowIso();
    });
    next.notifications.forEach(function (item) {
      if (!item.priority) item.priority = 'Normal';
      if (!item.status) item.status = 'New';
      if (item.unread == null) item.unread = true;
    });
    next.questions.forEach(function (item) {
      if (!item.status) item.status = 'Open';
      if (!item.priority) item.priority = 'Normal';
      if (!item.createdDate) item.createdDate = todayString();
    });
    next.tasks.forEach(function (item) {
      if (!item.status) item.status = 'New';
      if (!item.priority) item.priority = 'Normal';
      if (!item.startDate) item.startDate = todayString();
    });
    next.platformRules.forEach(function (item) {
      if (!item.platformStatus) item.platformStatus = 'Active';
      if (!item.defaultCurrency) item.defaultCurrency = 'USD';
      if (item.turnoverPercentage == null) item.turnoverPercentage = 100;
      if (!item.turnoverMethod) item.turnoverMethod = 'Deposit only';
      if (item.minEligibleOdds == null) item.minEligibleOdds = 1;
      if (item.maxEligibleOdds == null) item.maxEligibleOdds = '';
      if (item.maxStake == null) item.maxStake = '';
      if (item.maxPayout == null) item.maxPayout = '';
      if (!item.bonusTypesSupported) item.bonusTypesSupported = '';
      if (item.sameAccountMultipleOutcomes == null) item.sameAccountMultipleOutcomes = false;
      if (item.maxOutcomesPerEvent == null) item.maxOutcomesPerEvent = 1;
      if (item.sameAccountAcrossMarkets == null) item.sameAccountAcrossMarkets = false;
      if (item.multipleAccountsOneOutcome == null) item.multipleAccountsOneOutcome = false;
      if (!item.twoOfThreeOutcomesAllowed) item.twoOfThreeOutcomesAllowed = 'Not Allowed';
      if (item.manualApprovalRequired == null) item.manualApprovalRequired = false;
      if (!item.effectiveDate) item.effectiveDate = todayString();
      if (!item.lastReviewedDate) item.lastReviewedDate = '';
      if (!item.updatedAt) item.updatedAt = nowIso();
    });
    next.platformRuleVersions.forEach(function (item) {
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.ruleSnapshot) item.ruleSnapshot = {};
    });
    next.allocations.forEach(function (item) {
      if (!item.status) item.status = 'Reserved';
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.ruleSnapshot) item.ruleSnapshot = {};
    });
    next.operationalSessions.forEach(function (item) {
      if (!item.status) item.status = 'Reserved';
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.updatedAt) item.updatedAt = item.createdAt;
      if (!Array.isArray(item.activityLog)) item.activityLog = [];
    });
    next.calculatorSessions.forEach(function (item) {
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.createdBy) item.createdBy = '';
      if (!item.status) item.status = 'Calculated';
      if (!Array.isArray(item.assignments)) item.assignments = [];
      if (!Array.isArray(item.executionRecords)) item.executionRecords = [];
      if (!Array.isArray(item.resultRecords)) item.resultRecords = [];
      if (!item.finalBalanceSummary) item.finalBalanceSummary = null;
      if (!Array.isArray(item.accountPool)) item.accountPool = [];
      if (!Array.isArray(item.events)) item.events = [];
      if (!Array.isArray(item.history)) item.history = [];
      if (!item.sessionName) item.sessionName = item.eventName || 'Calculator Session';
      if (!item.startDate) item.startDate = item.eventDate || String(item.createdAt || '').slice(0, 10);
      if (!item.expectedEndDate) item.expectedEndDate = '';
      if (!item.expectedRolloverDate) item.expectedRolloverDate = '';
      if (!item.clientId && item.accountPool[0]) item.clientId = item.accountPool[0].clientId || '';
      if (item.targetReturnPercentage == null) item.targetReturnPercentage = 97;
      if (!item.objective) item.objective = '';
      if (!item.description) item.description = '';
      if (!Array.isArray(item.mixTickets)) item.mixTickets = [];
    });
    next.mixTickets.forEach(function (item) {
      if (!Array.isArray(item.legs)) item.legs = [];
      if (!Array.isArray(item.hedges)) item.hedges = [];
      if (!Array.isArray(item.snapshots)) item.snapshots = [];
      if (!Array.isArray(item.auditHistory)) item.auditHistory = [];
      if (item.freeBetDeductionApplied == null) item.freeBetDeductionApplied = false;
      if (item.freeBetDeductionCount == null) item.freeBetDeductionCount = 0;
    });
    next.accountBookmarks.forEach(function (item) {
      if (!item.createdAt) item.createdAt = nowIso();
      if (!item.createdBy) item.createdBy = '';
    });
    next.accounts.forEach(function (item) {
      if (item.reservedBalance == null) item.reservedBalance = 0;
      if (item.safetyMargin == null) item.safetyMargin = 0;
      if (!item.currency) item.currency = 'USD';
    });
    next.exchanges.forEach(function (item) {
      if (!item.status) item.status = 'Executed';
      if (!item.createdAt) item.createdAt = nowIso();
    });
    next.capitalContributions.forEach(function (item) {
      if (!item.status) item.status = 'Approved';
      if (!item.createdAt) item.createdAt = nowIso();
    });
    next.approvalRequests.forEach(function (item) {
      if (!item.status) item.status = 'Pending Owner Approval';
      if (!Array.isArray(item.history)) item.history = [];
    });
    next.moneyPlacements.forEach(function (item) {
      if (!item.createdAt) item.createdAt = nowIso();
    });
    if (window.AtlasThemeService) window.AtlasThemeService.ensureState(next);
    return next;
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function slug(value, fallback) {
    var clean = String(value || fallback || 'X')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8);
    return clean || fallback || 'X';
  }

  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function money(value) {
    var sign = value < 0 ? '-' : '';
    var abs = Math.abs(num(value));
    return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function percent(value) {
    return num(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
  }

  function byId(list, id) {
    return (list || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function resolveCurrentUser() {
    currentUser = currentSession ? byId(state.authUsers, currentSession.userId) : null;
    if (!currentUser && currentSession) saveSession(null);
    return currentUser;
  }

  function currentRole() {
    return currentUser ? currentUser.role : 'guest';
  }

  function isOwner() {
    return currentRole() === 'owner';
  }

  function isAdmin() {
    return currentRole() === 'admin';
  }

  function isShareholderRole() {
    return currentRole() === 'shareholder';
  }

  function workflow() {
    return window.AtlasWorkflowService;
  }

  function currentActor() {
    return currentUser ? { id: currentUser.id, role: currentUser.role, clientId: currentUser.clientId } : null;
  }

  function assignedClientIdsForCurrentUser() {
    return workflow().assignedClientIds(state, currentUser);
  }

  function canView(viewId) {
    var roles = viewRoles[viewId] || [];
    if (viewId === 'appearance') {
      return !!(window.AtlasThemeService && window.AtlasThemeService.can(state, currentUser, 'canView'));
    }
    return roles.indexOf(currentRole()) !== -1;
  }

  function defaultViewForRole() {
    if (isShareholderRole()) return 'profitLoss';
    if (isAdmin()) return 'dashboard';
    return 'dashboard';
  }

  function canSeeClient(clientId) {
    return workflow().canAccessClient(state, currentUser, clientId);
  }

  function canEditKind(kind) {
    if (isOwner()) return true;
    if (['PlatformRule', 'Allocation', 'OperationalSession'].indexOf(kind) !== -1) return false;
    if (isAdmin()) return ['Payment', 'Income', 'Cost', 'Transfer', 'User', 'Account', 'UserPlatform', 'Task'].indexOf(kind) !== -1;
    return false;
  }

  function canDeleteKind(kind, id) {
    if (!isOwner()) return false;
    if (kind === 'AuthUser' && currentUser && id === currentUser.id) return false;
    return true;
  }

  function canEditOwnProfile(clientId) {
    return isShareholderRole() && currentUser.clientId && currentUser.clientId === clientId;
  }

  function accountName(id) {
    var source = state || seedState;
    var account = byId(source.accounts, id);
    return account ? account.name : String(id || '');
  }

  function accountCode(id) {
    var source = state || seedState;
    var account = byId(source.accounts, id);
    return account ? account.code : slug(id, 'ACC');
  }

  function clientCode(id) {
    var source = state || seedState;
    var client = byId(source.clients, id);
    return client ? client.code : 'GEN';
  }

  function userCode(id) {
    var source = state || seedState;
    var user = byId(source.users, id);
    return user ? user.code : 'USR';
  }

  function platformCode(id) {
    var source = state || seedState;
    var platform = byId(source.websites, id);
    return platform ? platform.code : 'PLT';
  }

  function platformName(id) {
    var platform = byId(state.websites, id);
    return platform ? platform.name : String(id || '');
  }

  function clientName(id) {
    var client = byId(state.clients, id);
    return client ? client.name : String(id || '');
  }

  function userName(id) {
    var user = byId(state.users, id);
    return user ? user.name : String(id || '');
  }

  function accountPath(account) {
    var parts = [];
    if (account.clientId) parts.push(clientName(account.clientId));
    if (account.userId) parts.push(userName(account.userId));
    if (account.platformId) parts.push(platformName(account.platformId));
    return parts.filter(Boolean).join(' / ') || account.owner || 'Unassigned';
  }

  function accountSelectLabel(account) {
    var path = accountPath(account);
    return account.name + ' (' + account.code + ')' + (path ? ' - ' + path : '');
  }

  function platformAccountLabel(item) {
    if (!item) return 'Unknown platform account';
    return platformName(item.platformId) + ' / ' + item.username + ' (' + item.accountCode + ')';
  }

  function authUserName(id) {
    var user = byId(state.authUsers, id);
    return user ? user.name : '';
  }

  function clientCapitalSummary(clientId, editingUserId) {
    return workflow().clientCapitalSummary(state, clientId, editingUserId);
  }

  function userCurrentBalance(userId) {
    var balances = walletBalances();
    var accountBalance = sum(state.accounts.filter(function (account) {
      return account.userId === userId;
    }), function (account) {
      return balances[account.id];
    });
    var platformBalance = sum(state.userPlatforms.filter(function (item) {
      return item.userId === userId;
    }), function (item) {
      return workflow().platformPerformance(state, item.id).currentPlatformBalance;
    });
    var pendingWithdrawals = sum(state.expectedWithdrawals.filter(function (item) {
      return item.userId === userId && item.status !== 'Received' && item.status !== 'Cancelled';
    }), function (item) {
      return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived));
    });
    return accountBalance + platformBalance + pendingWithdrawals;
  }

  function investorCapital(item) {
    return num(item.investment != null ? item.investment : item.share) + sum(state.capitalContributions.filter(function (row) {
      return row.clientId === item.clientId && row.status === 'Approved';
    }), function (row) { return row.amount; });
  }

  function activeInvestors() {
    return state.shareholders.filter(function (item) { return item.status !== 'Paused'; });
  }

  function totalInvestorCapital() {
    return sum(activeInvestors(), investorCapital);
  }

  function buildRoute(kind, date, clientId, userId, platformId, fromAccountId, toAccountId) {
    var day = String(date || '').replace(/-/g, '') || 'DATE';
    var source = state || seedState;
    var fromPlatformAccount = byId(source.userPlatforms, fromAccountId);
    var toPlatformAccount = byId(source.userPlatforms, toAccountId);
    var activePlatformId = platformId || (fromPlatformAccount && fromPlatformAccount.platformId) || (toPlatformAccount && toPlatformAccount.platformId) || '';
    var fromCode = fromPlatformAccount ? slug(fromPlatformAccount.accountCode, 'PLTACC') : (byId(source.websites, fromAccountId) ? platformCode(fromAccountId) : accountCode(fromAccountId));
    var toCode = toAccountId === 'expense' ? 'EXP' : (toPlatformAccount ? slug(toPlatformAccount.accountCode, 'PLTACC') : accountCode(toAccountId));
    return [kind, day, clientCode(clientId), userCode(userId), platformCode(activePlatformId), fromCode + '>' + toCode].join('/');
  }

  function inRange(item) {
    if (filters.from && item.date < filters.from) return false;
    if (filters.to && item.date > filters.to) return false;
    return true;
  }

  function sum(list, getter) {
    return list.reduce(function (total, item) { return total + num(getter(item)); }, 0);
  }

  function filteredIncomes() {
    return state.incomes.filter(inRange).filter(function (item) { return canSeeClient(item.clientId); });
  }

  function filteredCosts() {
    return state.costs.filter(inRange).filter(function (item) { return canSeeClient(item.clientId); });
  }

  function filteredTransfers() {
    return state.transfers.filter(inRange).filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visibleShareholders() {
    if (isOwner()) return state.shareholders;
    if (isAdmin()) {
      return state.shareholders.filter(function (item) { return canSeeClient(item.clientId); });
    }
    if (isShareholderRole()) {
      return state.shareholders.filter(function (item) { return item.clientId === currentUser.clientId; });
    }
    return [];
  }

  function visiblePayments() {
    if (isOwner()) return state.payments;
    if (isAdmin()) {
      return state.payments.filter(function (item) { return canSeeClient(item.clientId); });
    }
    if (isShareholderRole()) {
      return state.payments.filter(function (item) { return item.clientId === currentUser.clientId; });
    }
    return [];
  }

  function visibleClients() {
    if (isOwner()) return state.clients;
    var ids = assignedClientIdsForCurrentUser();
    return state.clients.filter(function (client) {
      return ids.indexOf(client.id) !== -1;
    });
  }

  function visibleUsers() {
    if (isOwner()) return state.users;
    return state.users.filter(function (user) { return canSeeClient(user.clientId); });
  }

  function visiblePlatformAccounts() {
    if (isOwner()) return state.userPlatforms;
    return state.userPlatforms.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visiblePlatformFundings() {
    if (isOwner()) return state.platformFundings;
    return state.platformFundings.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visiblePlatformResults() {
    if (isOwner()) return state.platformResults;
    return state.platformResults.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visibleExpectedWithdrawals() {
    if (isOwner()) return state.expectedWithdrawals;
    return state.expectedWithdrawals.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visibleNotifications() {
    if (isOwner()) return state.notifications;
    if (isAdmin()) {
      return state.notifications.filter(function (item) {
        return (!item.clientId || canSeeClient(item.clientId)) &&
          (!item.assignedAuthUserId || item.assignedAuthUserId === currentUser.id);
      });
    }
    return state.notifications.filter(function (item) {
      return !item.clientId || item.clientId === currentUser.clientId;
    });
  }

  function visibleQuestions() {
    if (isOwner()) return state.questions;
    if (isAdmin()) {
      return state.questions.filter(function (item) {
        return !item.clientId || canSeeClient(item.clientId) || item.assignedAdminId === currentUser.id;
      });
    }
    return state.questions.filter(function (item) { return item.clientId === currentUser.clientId; });
  }

  function visibleTasks() {
    if (isOwner()) return state.tasks;
    if (isAdmin()) {
      return state.tasks.filter(function (item) { return item.assignedAdminId === currentUser.id; });
    }
    return [];
  }

  function visibleAuditLogs() {
    if (!isOwner()) return [];
    return state.auditLogs.slice();
  }

  function visibleAllocations() {
    if (isOwner()) return state.allocations;
    return state.allocations.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function visibleOperationalSessions() {
    if (isOwner()) return state.operationalSessions;
    return state.operationalSessions.filter(function (item) { return canSeeClient(item.clientId); });
  }

  function activePlatformRule(platformId, date) {
    return workflow().latestPlatformRule(state, platformId, date);
  }

  function latestRuleVersionId(platformId) {
    var rows = state.platformRuleVersions.filter(function (item) { return item.platformId === platformId; }).sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    return rows[0] ? rows[0].id : '';
  }

  function canViewQuestion(question) {
    if (!question) return false;
    if (isOwner()) return true;
    if (isAdmin()) return canSeeClient(question.clientId) || question.assignedAdminId === currentUser.id || question.createdBy === currentUser.id;
    return question.clientId === currentUser.clientId || question.createdBy === currentUser.id;
  }

  function createCalculatorDraft(marketType) {
    var type = marketType || 'Three Outcome';
    return {
      eventName: '',
      eventDate: todayString(),
      marketType: type,
      marketName: 'Match Winner',
      totalCapital: 1000,
      mode: 'Equal Scenario Profit',
      targetReturn: 1000,
      increment: 0.01,
      settlementPeriod: '',
      notes: '',
      outcomes: window.AtlasCalculatorService ? window.AtlasCalculatorService.makeOutcomeDefaults(type) : []
    };
  }

  function createCalculatorSessionDraft() {
    return {
      id: uid('calc_session'),
      sessionName: 'New Operation Session',
      clientId: '',
      startDate: todayString(),
      expectedEndDate: '',
      expectedRolloverDate: '',
      targetReturnPercentage: 97,
      objective: '',
      description: '',
      notes: '',
      status: 'Draft',
      accountPool: [],
      mixTickets: [],
      history: []
    };
  }

  function visibleCalculatorSessions() {
    return isOwner() ? state.calculatorSessions : [];
  }

  function allInRange(list) {
    return list.filter(inRange);
  }

  function totals() {
    var incomes = filteredIncomes();
    var costs = filteredCosts();
    var transfers = filteredTransfers();
    var benefit = sum(incomes, function (item) { return item.benefit; });
    var directCosts = sum(costs, function (item) { return item.amount; });
    var fees = sum(transfers, function (item) { return item.fee; });
    return {
      benefit: benefit,
      costs: directCosts + fees,
      directCosts: directCosts,
      fees: fees,
      net: benefit - directCosts - fees,
      transferVolume: sum(transfers, function (item) { return item.amount; }),
      transferCount: transfers.length,
      incomeCount: incomes.length,
      costCount: costs.length
    };
  }

  function companyTotals() {
    var incomes = allInRange(state.incomes);
    var costs = allInRange(state.costs);
    var transfers = allInRange(state.transfers);
    var benefit = sum(incomes, function (item) { return item.benefit; });
    var directCosts = sum(costs, function (item) { return item.amount; });
    var fees = sum(transfers, function (item) { return item.fee; });
    return {
      benefit: benefit,
      costs: directCosts + fees,
      net: benefit - directCosts - fees,
      transferVolume: sum(transfers, function (item) { return item.amount; }),
      incomeCount: incomes.length,
      costCount: costs.length,
      transferCount: transfers.length
    };
  }

  function currentDistribution() {
    var service = window.AtlasProfitService;
    var t = companyTotals();
    return service.calculateDistribution({
      shareholders: state.shareholders,
      payments: state.payments,
      totalCompanyCapital: totalInvestorCapital(),
      totalProfitForPeriod: t.net
    });
  }

  function distributionRowsForRole() {
    var dist = currentDistribution();
    if (isShareholderRole()) {
      dist.rows = dist.rows.filter(function (row) { return row.clientId === currentUser.clientId; });
    } else if (isAdmin()) {
      dist.rows = dist.rows.filter(function (row) { return canSeeClient(row.clientId); });
    }
    return dist;
  }

  function shareholderLabel(shareholderOrRow) {
    var shareholder = shareholderOrRow.clientId ? shareholderOrRow : byId(state.shareholders, shareholderOrRow.shareholderId);
    if (!shareholder) return 'Unknown shareholder';
    return clientName(shareholder.clientId) || shareholder.name || shareholder.note || 'Investor Client';
  }

  function paymentTotals() {
    var rows = visiblePayments();
    return {
      pending: sum(rows.filter(function (item) { return item.status === 'Pending' || item.status === 'Processing'; }), function (item) { return item.amount; }),
      pendingCount: rows.filter(function (item) { return item.status === 'Pending' || item.status === 'Processing'; }).length,
      completed: sum(rows.filter(function (item) { return item.status === 'Completed'; }), function (item) { return item.amount; }),
      completedCount: rows.filter(function (item) { return item.status === 'Completed'; }).length
    };
  }

  function totalOwnerCapital() {
    return state.accounts.reduce(function (total, account) {
      var owner = String(account.owner || '').toLowerCase();
      if (owner.indexOf('owner') !== -1 || account.type === 'Owner') return total + num(account.opening);
      return total;
    }, 0);
  }

  function renderMiniList(id, rows, renderRow) {
    var holder = document.getElementById(id);
    if (!holder) return;
    clear(holder);
    if (!rows.length) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No records yet';
      holder.appendChild(empty);
      return;
    }
    rows.forEach(function (row) {
      var item = document.createElement('div');
      item.className = 'mini-item';
      item.innerHTML = renderRow(row);
      holder.appendChild(item);
    });
  }

  function renderTopShareholderLists(rows) {
    if (isAdmin()) {
      setText('topCapitalMeta', 'Restricted');
      setText('topPayableMeta', 'Restricted');
      renderMiniList('topCapitalList', [], function () { return ''; });
      renderMiniList('topPayableList', [], function () { return ''; });
      return;
    }
    var visibleRows = isShareholderRole() ? distributionRowsForRole().rows : rows;
    var byCapital = visibleRows.slice().sort(function (a, b) { return b.investedAmount - a.investedAmount; }).slice(0, 5);
    var byPayable = visibleRows.slice().sort(function (a, b) { return b.shareholderPayableProfit - a.shareholderPayableProfit; }).slice(0, 5);
    setText('topCapitalMeta', byCapital.length + ' records');
    setText('topPayableMeta', byPayable.length + ' records');
    renderMiniList('topCapitalList', byCapital, function (row) {
      return '<span>' + htmlEscape(shareholderLabel(row)) + '</span><strong>' + money(row.investedAmount) + '</strong>';
    });
    renderMiniList('topPayableList', byPayable, function (row) {
      return '<span>' + htmlEscape(shareholderLabel(row)) + '</span><strong>' + money(row.shareholderPayableProfit) + '</strong>';
    });
  }

  function renderOperationalSummary() {
    var withdrawals = visibleExpectedWithdrawals();
    var notifications = visibleNotifications();
    var tasks = visibleTasks();
    var operationalRows = [
      { label: 'Expected withdrawals', value: withdrawals.length },
      { label: 'Pending withdrawals', value: withdrawals.filter(function (item) { return item.status !== 'Received' && item.status !== 'Cancelled'; }).length },
      { label: 'Delayed withdrawals', value: withdrawals.filter(function (item) { return item.status === 'Delayed'; }).length },
      { label: 'Verification follow-ups', value: withdrawals.filter(function (item) { return item.status === 'Verification Required'; }).length }
    ];
    setText('operationalSummaryMeta', operationalRows.length + ' items');
    renderMiniList('operationalSummary', operationalRows, function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(String(row.value)) + '</strong>';
    });

    var noticeCounts = workflow().notificationCounts(notifications);
    var taskOverdue = tasks.filter(function (item) {
      return item.status !== 'Completed' && item.status !== 'Cancelled' && item.dueDate && item.dueDate < todayString();
    }).length;
    var actionRows = [
      { label: 'Unread notifications', value: noticeCounts.unreadCount },
      { label: 'Pending notifications', value: noticeCounts.pendingCount },
      { label: 'Overdue notifications', value: noticeCounts.overdueCount },
      { label: 'Open admin tasks', value: tasks.filter(function (item) { return item.status !== 'Completed' && item.status !== 'Cancelled'; }).length },
      { label: 'Overdue admin tasks', value: taskOverdue }
    ];
    setText('actionSummaryMeta', actionRows.length + ' items');
    renderMiniList('actionSummary', actionRows, function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(String(row.value)) + '</strong>';
    });
  }

  function dailyRows() {
    var map = {};
    function ensure(date) {
      if (!map[date]) {
        map[date] = { date: date, bet: 0, siteAmount: 0, benefit: 0, costs: 0, fees: 0, net: 0 };
      }
      return map[date];
    }

    filteredIncomes().forEach(function (item) {
      var row = ensure(item.date);
      row.bet += num(item.bet);
      row.siteAmount += num(item.siteAmount);
      row.benefit += num(item.benefit);
    });

    filteredCosts().forEach(function (item) {
      ensure(item.date).costs += num(item.amount);
    });

    filteredTransfers().forEach(function (item) {
      ensure(item.date).fees += num(item.fee);
    });

    return Object.keys(map).sort().map(function (date) {
      var row = map[date];
      row.net = row.benefit - row.costs - row.fees;
      return row;
    });
  }

  function walletBalances() {
    var balances = {};
    state.accounts.forEach(function (account) {
      balances[account.id] = num(account.opening);
    });

    state.incomes.forEach(function (income) {
      if (income.accountId) {
        balances[income.accountId] = num(balances[income.accountId]) + num(income.benefit);
      }
    });

    state.transfers.filter(function (transfer) { return transfer.status === 'Completed' || transfer.status === 'Executed' || !transfer.status; }).forEach(function (transfer) {
      balances[transfer.from] = num(balances[transfer.from]) - num(transfer.amount) - num(transfer.fee);
      balances[transfer.to] = num(balances[transfer.to]) + num(transfer.amount);
    });

    state.costs.forEach(function (cost) {
      balances[cost.accountId] = num(balances[cost.accountId]) - num(cost.amount);
    });

    state.platformFundings.forEach(function (funding) {
      balances[funding.sourceAccountId] = num(balances[funding.sourceAccountId]) - num(funding.amount);
    });

    state.expectedWithdrawals.forEach(function (item) {
      balances[item.destinationAccountId] = num(balances[item.destinationAccountId]) + num(item.actualAmountReceived);
    });

    state.exchanges.filter(function (item) { return item.status === 'Executed'; }).forEach(function (item) {
      balances[item.sourceBankId] = num(balances[item.sourceBankId]) - num(item.sourceAmount);
      balances[item.destinationWalletId] = num(balances[item.destinationWalletId]) + num(item.netAmount);
    });

    return balances;
  }

  function walletBalanceSummary(accountId) {
    var account = byId(state.accounts, accountId);
    var current = num(walletBalances()[accountId]);
    var pending = sum(state.approvalRequests.filter(function (item) {
      return item.sourceAccountId === accountId && item.status === 'Pending Owner Approval';
    }), function (item) { return item.amount; });
    var reserved = num(account && account.reservedBalance);
    var safety = num(account && account.safetyMargin);
    return { current: current, reserved: reserved, pending: pending, safety: safety, available: Math.max(0, current - reserved - pending - safety) };
  }

  function fundingSources(clientId, excludedId) {
    var balances = walletBalances();
    return state.accounts.filter(function (item) {
      return item.clientId === clientId && item.id !== excludedId && num(balances[item.id]) > 0;
    }).map(function (item) {
      var summary = walletBalanceSummary(item.id);
      return { account: item, available: summary.available };
    }).filter(function (item) { return item.available > 0; });
  }

  function renderExchangePreview() {
    var form = document.getElementById('exchangeForm');
    var holder = document.getElementById('exchangePreview');
    if (!form || !holder) return;
    var f = form.elements;
    var source = byId(state.accounts, f.sourceBankId.value);
    var destination = byId(state.accounts, f.destinationWalletId.value);
    var sourceBalance = source ? num(walletBalances()[source.id]) : 0;
    var destinationBalance = destination ? num(walletBalances()[destination.id]) : 0;
    var amount = num(f.sourceAmount.value);
    var gross = amount * num(f.exchangeRate.value);
    var fee = gross * num(f.feePercentage.value) / 100 + num(f.fixedFee.value);
    var net = Math.max(0, gross - fee);
    holder.innerHTML = '<span>Source bank balance <strong>' + money(sourceBalance) + '</strong></span><span>Gross converted <strong>' + money(gross) + '</strong></span><span>Total fee <strong>' + money(fee) + '</strong></span><span>Net wallet credit <strong>' + money(net) + '</strong></span><span>Bank after <strong>' + money(sourceBalance - amount) + '</strong></span><span>Wallet after <strong>' + money(destinationBalance + net) + '</strong></span>';
  }

  function ledgerRows() {
    var rows = [];
    state.incomes.forEach(function (item) {
      rows.push({
        type: 'Income',
        id: item.id,
        date: item.date,
        account: accountName(item.accountId),
        routeCode: item.routeCode,
        counterparty: platformName(item.site),
        amount: num(item.benefit),
        note: clientName(item.clientId) + ' / ' + userName(item.userId)
      });
    });
    state.costs.forEach(function (item) {
      rows.push({
        type: 'Cost',
        id: item.id,
        date: item.date,
        account: accountName(item.accountId),
        routeCode: item.routeCode,
        counterparty: item.owner,
        amount: -num(item.amount),
        note: item.category + (item.description ? ' - ' + item.description : '')
      });
    });
    state.transfers.forEach(function (item) {
      var label = item.movementType || 'Internal Transfer';
      rows.push({
        type: label,
        id: item.id,
        date: item.date,
        account: accountName(item.from) + ' -> ' + accountName(item.to),
        routeCode: item.routeCode,
        counterparty: item.counterparty || platformName(item.platformId),
        amount: num(item.amount),
        note: item.note + (num(item.fee) ? ' / fee ' + money(item.fee) : '')
      });
    });

    visiblePlatformFundings().forEach(function (item) {
      rows.push({
        type: 'Platform Funding',
        id: item.id,
        date: item.date,
        account: accountName(item.sourceAccountId) + ' -> ' + platformAccountLabel(byId(state.userPlatforms, item.platformAccountId)),
        routeCode: 'FUND/' + slug(item.id, 'FUND'),
        counterparty: platformName(item.platformId),
        amount: -num(item.amount),
        note: item.notes || 'Deposit to platform'
      });
    });

    visiblePlatformResults().forEach(function (item) {
      rows.push({
        type: 'Platform Result',
        id: item.id,
        date: item.resultDate,
        account: platformAccountLabel(byId(state.userPlatforms, item.platformAccountId)),
        routeCode: 'RESULT/' + slug(item.id, 'RESULT'),
        counterparty: platformName(item.platformId),
        amount: num(item.resultAmount) - num(item.originalAmount) - num(item.platformFees),
        note: 'Expected withdrawal ' + money(item.expectedWithdrawalAmount) + (num(item.remainingInsidePlatform) ? ' / remaining ' + money(item.remainingInsidePlatform) : '')
      });
    });

    visibleExpectedWithdrawals().forEach(function (item) {
      if (num(item.actualAmountReceived) <= 0) return;
      rows.push({
        type: 'Platform Withdrawal',
        id: item.id,
        date: item.actualArrivalDate || item.requestDate,
        account: platformAccountLabel(byId(state.userPlatforms, item.platformAccountId)) + ' -> ' + accountName(item.destinationAccountId),
        routeCode: 'WD/' + slug(item.id, 'WITHDRAW'),
        counterparty: platformName(item.platformId),
        amount: num(item.actualAmountReceived),
        note: item.notes || item.status
      });
    });

    state.mixTickets.filter(function (mix) { return canSeeClient(mix.clientId); }).forEach(function (mix) {
      if (mix.placedAt) {
        rows.push({
          type: 'Mix Ticket Placed',
          id: mix.id,
          date: String(mix.placedAt).slice(0, 10),
          account: platformAccountLabel(byId(state.userPlatforms, mix.platformAccountId)),
          routeCode: 'MIX/' + slug(mix.ticketReference || mix.id, 'MIX'),
          counterparty: clientName(mix.clientId),
          amount: -window.AtlasMixService.values(mix).totalStake,
          note: 'Cash ' + money(mix.cashPortion) + ' / bonus ' + money(mix.normalBonusPortion) + ' / Free Bet ' + money(mix.freeBetPortion)
        });
      }
      if (mix.settlement && mix.settlement.settledAt) {
        rows.push({
          type: 'Mix Settlement',
          id: mix.id + '-settlement',
          date: String(mix.settlement.settledAt).slice(0, 10),
          account: platformAccountLabel(byId(state.userPlatforms, mix.platformAccountId)),
          routeCode: 'MIXSET/' + slug(mix.ticketReference || mix.id, 'MIX'),
          counterparty: clientName(mix.clientId),
          amount: num(mix.settlement.realizedWithdrawableValue),
          note: 'Net result ' + money(mix.settlement.netResult) + ' / conversion ' + percent(mix.settlement.freeBetConversionRate)
        });
      }
    });

    var term = filters.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(function (row) {
        return Object.keys(row).some(function (key) {
          return String(row[key]).toLowerCase().indexOf(term) !== -1;
        });
      });
    }

    return rows.filter(inRange).sort(function (a, b) {
      return a.date === b.date ? a.type.localeCompare(b.type) : a.date.localeCompare(b.date);
    });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function clear(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  function htmlEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function editButton(kind, id) {
    if (!canEditKind(kind)) return '';
    return '<button class="row-action edit-action" type="button" title="Edit" data-edit="' + htmlEscape(kind) + '" data-id="' + htmlEscape(id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg></button>';
  }

  function deleteButton(kind, id) {
    if (!canDeleteKind(kind, id)) return '';
    return '<button class="row-action" type="button" title="Delete" data-delete="' + htmlEscape(kind) + '" data-id="' + htmlEscape(id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v8M15 10v8M7 7l1 14h8l1-14"></path></svg></button>';
  }

  function compactList(items, key, singularLabel, pluralLabel, renderItem) {
    var expanded = !!expandedTreeGroups[key];
    var visible = expanded ? items : items.slice(0, 2);
    var html = visible.map(renderItem).join('');
    if (items.length > 2) {
      var hidden = items.length - 2;
      var label = expanded ? 'Show less' : 'Show ' + hidden + ' more ' + (hidden === 1 ? singularLabel : pluralLabel);
      html += '<button class="tree-more" type="button" data-toggle-tree="' + htmlEscape(key) + '">' + htmlEscape(label) + '</button>';
    }
    return html;
  }

  function collectionForKind(kind) {
    return {
      Client: 'clients',
      User: 'users',
      Website: 'websites',
      UserPlatform: 'userPlatforms',
      AdminAssignment: 'adminAssignments',
      Account: 'accounts',
      Shareholder: 'shareholders',
      Income: 'incomes',
      Cost: 'costs',
      Transfer: 'transfers',
      Payment: 'payments',
      Task: 'tasks',
      AuthUser: 'authUsers',
      PlatformRule: 'platformRules',
      Allocation: 'allocations',
      OperationalSession: 'operationalSessions'
    }[kind];
  }

  function formForKind(kind) {
    return {
      Client: 'clientForm',
      User: 'userForm',
      Website: 'websiteForm',
      UserPlatform: 'platformAccountForm',
      AdminAssignment: 'adminAssignmentForm',
      Account: 'accountForm',
      Shareholder: 'shareholderForm',
      Income: 'incomeForm',
      Cost: 'costForm',
      Transfer: 'transferForm',
      Payment: 'paymentForm',
      Task: 'taskForm',
      AuthUser: 'accessUserForm',
      PlatformRule: 'platformRuleForm',
      Allocation: 'allocationForm',
      OperationalSession: 'settlementForm'
    }[kind];
  }

  function viewForKind(kind) {
    if (kind === 'Income' || kind === 'Cost' || kind === 'Transfer') return 'ledger';
    if (kind === 'AdminAssignment') return 'settings';
    if (kind === 'Payment') return 'payments';
    if (kind === 'Task') return 'tasks';
    if (kind === 'Shareholder') return 'shareholders';
    if (kind === 'AuthUser') return 'settings';
    if (kind === 'PlatformRule') return 'settings';
    if (kind === 'Allocation' || kind === 'OperationalSession') return 'operations';
    return 'parties';
  }

  function setFormMode(form, kind, id) {
    var button = form.querySelector('.primary-button');
    if (button && !button.dataset.defaultText) button.dataset.defaultText = button.textContent.trim();
    form.dataset.editingKind = kind || '';
    form.dataset.editingId = id || '';
    if (button) {
      var label = form.dataset.editingId ? 'Update ' + (kind === 'UserPlatform' ? 'Platform Account' : kind) : button.dataset.defaultText;
      var svg = button.querySelector('svg');
      button.textContent = '';
      if (svg) button.appendChild(svg);
      button.appendChild(document.createTextNode(' ' + label));
    }
  }

  function resetFormMode(form) {
    if (!form) return;
    setFormMode(form, '', '');
  }

  function saveRecord(kind, prefix, form, data) {
    if (!canEditKind(kind)) {
      activateView('noAccess');
      return;
    }
    var key = collectionForKind(kind);
    var id = form.dataset.editingId || uid(prefix);
    data.id = id;
    if (form.dataset.editingId) {
      state[key] = state[key].map(function (item) { return item.id === id ? data : item; });
    } else {
      state[key].push(data);
    }
    form.reset();
    resetFormMode(form);
    saveState();
    render();
  }

  function activateView(viewId) {
    if (viewId !== 'noAccess' && !canView(viewId)) {
      viewId = 'noAccess';
    }
    document.body.classList.toggle('is-calculator-workspace', viewId === 'calculator');
    var calculatorWorkbench = document.getElementById('calculatorWorkbench');
    document.body.classList.toggle('calculator-has-workbench', viewId === 'calculator' && calculatorWorkbench && !calculatorWorkbench.hidden);
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });
    document.querySelectorAll('.view').forEach(function (view) {
      view.classList.toggle('active', view.id === viewId);
    });
    updatePageMeta(viewId);
  }

  function updatePageMeta(viewId) {
    var meta = viewMeta[viewId] || viewMeta.dashboard;
    if (viewId === 'dashboard' && isAdmin()) {
      meta = { title: 'Payment Operations Dashboard', subtitle: 'Payment queue and operational ledger status.' };
    } else if (viewId === 'dashboard' && isShareholderRole()) {
      meta = { title: 'My Profit/Loss Summary', subtitle: 'Your linked capital, profit share, and unpaid profit.' };
    }
    setText('pageTitle', meta.title);
    setText('pageSubtitle', meta.subtitle);
  }

  function activeViewId() {
    var active = document.querySelector('.view.active');
    return active ? active.id : defaultViewForRole();
  }

  function setField(form, name, value) {
    if (!form.elements[name]) return;
    form.elements[name].value = value == null ? '' : value;
  }

  function fillForm(kind, form, item) {
    populateSelects();
    if (item.clientId && form.elements.clientId) {
      form.elements.clientId.value = item.clientId;
      if (form.elements.userId) {
        setOptions(form.elements.userId, usersForClient(item.clientId), function (user) { return user.id; }, function (user) { return user.name + ' (' + user.code + ')'; });
      }
    }
    Object.keys(item).forEach(function (key) {
      setField(form, key, item[key]);
    });
    if (kind === 'Website') setField(form, 'type', item.type);
    if (kind === 'Income') setField(form, 'site', item.site);
    if (kind === 'Transfer') {
      setField(form, 'from', item.from);
      setField(form, 'to', item.to);
    }
    setFormMode(form, kind, item.id);
    updateRoutePreviews();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleEdit(kind, id) {
    var key = collectionForKind(kind);
    var formId = formForKind(kind);
    var item = byId(state[key], id);
    var form = document.getElementById(formId);
    if (!item || !form) return;
    activateView(viewForKind(kind));
    fillForm(kind, form, item);
  }

  function clearEditingRecord(kind, id) {
    document.querySelectorAll('form').forEach(function (form) {
      if (form.dataset.editingKind === kind && form.dataset.editingId === id) {
        form.reset();
        resetFormMode(form);
      }
    });
  }

  function deleteDirect(kind, id) {
    var key = collectionForKind(kind);
    if (!key) return;
    state[key] = state[key].filter(function (item) { return item.id !== id; });
    clearEditingRecord(kind, id);
  }

  function deleteWhere(key, predicate) {
    state[key] = state[key].filter(function (item) { return !predicate(item); });
  }

  function deleteSummary(kind, id) {
    if (kind === 'Client') {
      var users = state.users.filter(function (item) { return item.clientId === id; }).length;
      var accounts = state.accounts.filter(function (item) { return item.clientId === id; }).length;
      var ledger = state.incomes.concat(state.costs, state.transfers).filter(function (item) { return item.clientId === id; }).length;
      var payments = state.payments.filter(function (item) { return item.clientId === id; }).length;
      var workflows = state.platformFundings.concat(state.platformResults, state.expectedWithdrawals).filter(function (item) { return item.clientId === id; }).length;
      return 'This will also remove ' + users + ' users, ' + accounts + ' accounts, ' + ledger + ' ledger records, ' + payments + ' payments, and ' + workflows + ' platform workflow records for this client.';
    }
    if (kind === 'User') {
      var profiles = state.userPlatforms.filter(function (item) { return item.userId === id; }).length;
      var userAccounts = state.accounts.filter(function (item) { return item.userId === id; }).length;
      var userLedger = state.incomes.concat(state.costs, state.transfers).filter(function (item) { return item.userId === id; }).length;
      return 'This will also remove ' + profiles + ' platform profiles, ' + userAccounts + ' accounts, and ' + userLedger + ' ledger records for this user.';
    }
    if (kind === 'Website') {
      var platformProfiles = state.userPlatforms.filter(function (item) { return item.platformId === id; }).length;
      var platformAccounts = state.accounts.filter(function (item) { return item.platformId === id; }).length;
      var platformLedger = state.incomes.concat(state.costs, state.transfers).filter(function (item) { return item.platformId === id || item.site === id; }).length;
      return 'This will also remove ' + platformProfiles + ' platform profiles, ' + platformAccounts + ' accounts, and ' + platformLedger + ' ledger records for this platform.';
    }
    if (kind === 'Account') {
      var accountLedger = state.incomes.concat(state.costs, state.transfers).filter(function (item) { return item.accountId === id || item.from === id || item.to === id; }).length;
      return 'This will also remove ' + accountLedger + ' ledger records connected to this account.';
    }
    if (kind === 'Shareholder') {
      var paymentRows = state.payments.filter(function (item) { return item.shareholderId === id; }).length;
      return 'This will also remove ' + paymentRows + ' payment records for this shareholder.';
    }
    if (kind === 'AdminAssignment') {
      return 'This will remove the admin-to-client assignment.';
    }
    return 'This will remove this record.';
  }

  function removeRecord(kind, id) {
    if (!collectionForKind(kind)) return;
    if (!canDeleteKind(kind, id)) {
      activateView('noAccess');
      return;
    }
    var message = 'Delete ' + (kind === 'UserPlatform' ? 'Platform Account' : kind) + '?\n\n' + deleteSummary(kind, id);
    if (!window.confirm(message)) return;

    if (kind === 'Client') {
      deleteWhere('users', function (item) { return item.clientId === id; });
      deleteWhere('userPlatforms', function (item) { return item.clientId === id; });
      deleteWhere('accounts', function (item) { return item.clientId === id; });
      deleteWhere('incomes', function (item) { return item.clientId === id; });
      deleteWhere('costs', function (item) { return item.clientId === id; });
      deleteWhere('transfers', function (item) { return item.clientId === id; });
      deleteWhere('payments', function (item) { return item.clientId === id; });
      deleteWhere('platformFundings', function (item) { return item.clientId === id; });
      deleteWhere('platformResults', function (item) { return item.clientId === id; });
      deleteWhere('expectedWithdrawals', function (item) { return item.clientId === id; });
      deleteWhere('notifications', function (item) { return item.clientId === id; });
      deleteWhere('questions', function (item) { return item.clientId === id; });
      deleteWhere('adminAssignments', function (item) { return item.clientId === id; });
      deleteWhere('tasks', function (item) { return item.clientId === id; });
      deleteDirect('Client', id);
    } else if (kind === 'User') {
      deleteWhere('userPlatforms', function (item) { return item.userId === id; });
      deleteWhere('accounts', function (item) { return item.userId === id; });
      deleteWhere('incomes', function (item) { return item.userId === id; });
      deleteWhere('costs', function (item) { return item.userId === id; });
      deleteWhere('transfers', function (item) { return item.userId === id; });
      deleteWhere('platformFundings', function (item) { return item.userId === id; });
      deleteWhere('platformResults', function (item) { return item.userId === id; });
      deleteWhere('expectedWithdrawals', function (item) { return item.userId === id; });
      deleteWhere('notifications', function (item) { return item.userId === id; });
      deleteDirect('User', id);
    } else if (kind === 'Website') {
      deleteWhere('userPlatforms', function (item) { return item.platformId === id; });
      deleteWhere('accounts', function (item) { return item.platformId === id; });
      deleteWhere('incomes', function (item) { return item.site === id; });
      deleteWhere('costs', function (item) { return item.platformId === id; });
      deleteWhere('transfers', function (item) { return item.platformId === id; });
      deleteWhere('platformFundings', function (item) { return item.platformId === id; });
      deleteWhere('platformResults', function (item) { return item.platformId === id; });
      deleteWhere('expectedWithdrawals', function (item) { return item.platformId === id; });
      deleteWhere('notifications', function (item) { return item.platformId === id; });
      deleteDirect('Website', id);
    } else if (kind === 'Account') {
      deleteWhere('incomes', function (item) { return item.accountId === id; });
      deleteWhere('costs', function (item) { return item.accountId === id; });
      deleteWhere('transfers', function (item) { return item.from === id || item.to === id; });
      deleteWhere('platformFundings', function (item) { return item.sourceAccountId === id; });
      deleteWhere('expectedWithdrawals', function (item) { return item.destinationAccountId === id; });
      deleteDirect('Account', id);
    } else if (kind === 'UserPlatform') {
      deleteWhere('platformFundings', function (item) { return item.platformAccountId === id; });
      deleteWhere('platformResults', function (item) { return item.platformAccountId === id; });
      deleteWhere('expectedWithdrawals', function (item) { return item.platformAccountId === id; });
      deleteDirect('UserPlatform', id);
    } else if (kind === 'Shareholder') {
      deleteWhere('payments', function (item) { return item.shareholderId === id; });
      deleteDirect('Shareholder', id);
    } else if (kind === 'Task') {
      deleteWhere('notifications', function (item) { return item.relatedEntityType === 'Task' && item.relatedEntityId === id; });
      deleteDirect('Task', id);
    } else {
      deleteDirect(kind, id);
    }

    saveState();
    render();
  }

  function updateAuthChrome() {
    var signedIn = !!currentUser;
    document.body.classList.toggle('is-authenticated', signedIn);
    document.body.classList.toggle('is-guest', !signedIn);
    if (!signedIn) {
      document.body.classList.remove('is-calculator-workspace');
      setText('sessionName', 'Not signed in');
      setText('sessionRole', 'Guest');
      return;
    }

    setText('sessionName', currentUser.name || currentUser.username);
    setText('sessionRole', currentRole());

    document.querySelectorAll('.nav-item').forEach(function (item) {
      var viewId = item.getAttribute('data-view');
      item.hidden = !canView(viewId);
    });

    document.querySelectorAll('form').forEach(function (form) {
      var kind = formKind(form);
      if (!kind) return;
      form.hidden = !canEditKind(kind);
    });

    document.querySelectorAll('[data-owner-only]').forEach(function (el) {
      el.hidden = !isOwner();
    });

    var ownerAdminOnly = ['platformFundingForm', 'platformResultForm', 'withdrawalUpdateForm'];
    ownerAdminOnly.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = !(isOwner() || isAdmin());
    });

    var ownerOnly = ['adminAssignmentForm'];
    ownerOnly.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = !isOwner();
    });

    var taskForm = document.getElementById('taskForm');
    if (taskForm) taskForm.hidden = !(isOwner() || isAdmin());

    var replyForm = document.getElementById('questionReplyForm');
    if (replyForm) replyForm.hidden = false;
  }

  function formKind(form) {
    return {
      transferForm: 'Transfer',
      incomeForm: 'Income',
      costForm: 'Cost',
      paymentForm: 'Payment',
      taskForm: 'Task',
      shareholderForm: 'Shareholder',
      clientForm: 'Client',
      userForm: 'User',
      websiteForm: 'Website',
      platformAccountForm: 'UserPlatform',
      adminAssignmentForm: 'AdminAssignment',
      accountForm: 'Account',
      accessUserForm: 'AuthUser',
      platformRuleForm: 'PlatformRule',
      allocationForm: 'Allocation',
      settlementForm: 'OperationalSession',
      calculatorSetupForm: 'CalculatorSession'
    }[form.id];
  }

  function render() {
    resolveCurrentUser();
    updateAuthChrome();
    if (!currentUser) return;
    if (window.AtlasThemeService) {
      window.AtlasThemeService.ensureState(state);
      window.AtlasThemeService.applyToDocument(
        window.AtlasThemeService.activeVersion(state),
        window.AtlasThemeService.userPreference(state, currentUser.id),
        document
      );
    }
    if (!canView(activeViewId())) activateView(defaultViewForRole());
    renderKpis();
    renderCalculator();
    renderOperationalSummary();
    renderChart();
    renderDailyTable();
    renderLedger();
    renderPortfolios();
    renderPlatformOperations();
    renderExpectedWithdrawals();
    renderPayments();
    renderShareholders();
    renderProfitLoss();
    renderParties();
    renderAccounts();
    renderAccessUsers();
    renderAdminAssignments();
    renderPlatformRules();
    renderActionCenter();
    renderQuestions();
    renderTasks();
    renderEligibilityPreview();
    renderPlatformTurnoverPreview();
    renderSessionHistory();
    renderChecks();
    populateSelects();
    updateRoutePreviews();
    window.__famAppReady = true;
    window.__famCounts = {
      clients: state.clients.length,
      users: state.users.length,
      websites: state.websites.length,
      incomes: state.incomes.length,
      costs: state.costs.length,
      transfers: state.transfers.length,
      shareholders: state.shareholders.length,
      payments: state.payments.length,
      authUsers: state.authUsers.length,
      fundings: state.platformFundings.length,
      results: state.platformResults.length,
      expectedWithdrawals: state.expectedWithdrawals.length,
      notifications: state.notifications.length,
      questions: state.questions.length,
      tasks: state.tasks.length,
      platformRules: state.platformRules.length,
      allocations: state.allocations.length,
      operationalSessions: state.operationalSessions.length,
      calculatorSessions: state.calculatorSessions.length
    };
    document.dispatchEvent(new CustomEvent('atlas:render'));
  }

  function syncCalculatorFormFromDraft() {
    var form = document.getElementById('calculatorSetupForm');
    if (!form) return;
    Object.keys(calculatorDraft).forEach(function (key) {
      if (key !== 'outcomes' && form.elements[key]) {
        form.elements[key].value = calculatorDraft[key] == null ? '' : calculatorDraft[key];
      }
    });
  }

  function updateCalculatorDraftFromForm() {
    var form = document.getElementById('calculatorSetupForm');
    if (!form) return;
    var f = form.elements;
    calculatorDraft.eventName = f.eventName.value;
    calculatorDraft.eventDate = f.eventDate.value;
    calculatorDraft.marketType = f.marketType.value;
    calculatorDraft.marketName = f.marketName.value;
    calculatorDraft.totalCapital = num(f.totalCapital.value);
    calculatorDraft.mode = f.mode.value;
    calculatorDraft.targetReturn = num(f.targetReturn.value);
    calculatorDraft.increment = num(f.increment.value) || 0.01;
    calculatorDraft.settlementPeriod = f.settlementPeriod.value;
    calculatorDraft.notes = f.notes.value;
  }

  function updateCalculatorOutcomeFromInput(input) {
    var id = input.getAttribute('data-outcome-id');
    var field = input.getAttribute('data-outcome-field');
    var outcome = calculatorDraft.outcomes.filter(function (item) { return item.id === id; })[0];
    if (!outcome || !field) return;
    if (field === 'active') {
      outcome.active = input.checked;
    } else if (field === 'locked') {
      outcome.locked = input.checked;
    } else if (['odds', 'plannedStake', 'minStake', 'maxStake', 'requiredTurnover', 'bonusAmount'].indexOf(field) !== -1) {
      outcome[field] = input.value === '' ? '' : num(input.value);
      if (field === 'plannedStake') {
        if (num(input.value) > 0) {
          calculatorDraft.mode = 'Manual Stakes';
          var form = document.getElementById('calculatorSetupForm');
          if (form && form.elements.mode) form.elements.mode.value = 'Manual Stakes';
        }
        syncManualStakeAssignment(outcome.id);
      }
    } else {
      outcome[field] = input.value;
    }
  }

  function calculateDraft() {
    updateCalculatorDraftFromForm();
    calculatorResult = window.AtlasCalculatorService.calculate(clone(calculatorDraft));
    return calculatorResult;
  }

  function activeCalculatorOutcomesForBoard() {
    return (calculatorDraft.outcomes || []).filter(function (outcome) {
      return outcome.active !== false && num(outcome.odds) > 1;
    });
  }

  function manualStakeCoverage() {
    var active = activeCalculatorOutcomesForBoard();
    var stakes = active.map(function (outcome) { return num(outcome.plannedStake); });
    var matrix = window.AtlasCalculatorService.buildScenarioMatrix(calculatorDraft.marketType, active);
    var totalStake = sum(stakes, function (stake) { return stake; });
    var baseCapital = num(calculatorDraft.totalCapital) || totalStake || 0;
    var inverseSum = sum(active, function (outcome) { return num(outcome.odds) > 0 ? 1 / num(outcome.odds) : 0; });
    var equalGrossReturn = inverseSum > 0 && baseCapital > 0 ? baseCapital / inverseSum : 0;
    var bestMoneyBackPercent = baseCapital > 0 ? equalGrossReturn / baseCapital * 100 : 0;
    var equalRows = active.map(function (outcome) {
      var odds = num(outcome.odds);
      var equalStake = odds > 0 && equalGrossReturn > 0 ? equalGrossReturn / odds : 0;
      return {
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        odds: odds,
        equalStake: equalStake,
        equalGrossReturn: equalGrossReturn,
        moneyBackPercent: bestMoneyBackPercent,
        roi: bestMoneyBackPercent - 100
      };
    });
    var grossReturns = matrix.map(function (scenario) {
      return sum(scenario.factors, function (factor, index) { return factor * stakes[index]; });
    });
    var targetGross = active.length ? Math.max.apply(Math, active.map(function (outcome, index) {
      return num(stakes[index]) * num(outcome.odds);
    })) : 0;
    var minGross = grossReturns.length ? Math.min.apply(Math, grossReturns) : 0;
    var maxGross = targetGross;
    var profits = grossReturns.map(function (gross) { return gross - totalStake; });
    var neededRows = active.map(function (outcome, outcomeIndex) {
      var odds = num(outcome.odds);
      var currentStake = num(stakes[outcomeIndex]);
      var currentGross = currentStake * odds;
      var targetStake = targetGross > 0 && odds > 0 ? targetGross / odds : 0;
      var needed = Math.max(0, targetStake - currentStake);
      return {
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        odds: odds,
        currentStake: currentStake,
        currentGross: currentGross,
        neededToEqual: needed,
        totalStakeAfterAdd: currentStake + needed,
        equalGrossTarget: targetGross
      };
    });
    var totalNeededToEqual = sum(neededRows, function (row) { return row.neededToEqual; });
    var moneyBackAfterEqual = totalStake + totalNeededToEqual > 0 && targetGross > 0 ? targetGross / (totalStake + totalNeededToEqual) * 100 : 0;
    return {
      active: active,
      stakes: stakes,
      matrix: matrix,
      totalStake: totalStake,
      baseCapital: baseCapital,
      inverseSum: inverseSum,
      equalGrossReturn: equalGrossReturn,
      bestMoneyBackPercent: bestMoneyBackPercent,
      bestEqualRoi: bestMoneyBackPercent - 100,
      equalRows: equalRows,
      grossReturns: grossReturns,
      targetGross: targetGross,
      minGross: minGross,
      maxGross: maxGross,
      worstProfit: profits.length ? Math.min.apply(Math, profits) : 0,
      bestProfit: profits.length ? Math.max.apply(Math, profits) : 0,
      worstRoi: totalStake ? (profits.length ? Math.min.apply(Math, profits) : 0) / totalStake * 100 : 0,
      bestRoi: totalStake ? (profits.length ? Math.max.apply(Math, profits) : 0) / totalStake * 100 : 0,
      neededRows: neededRows,
      totalNeededToEqual: totalNeededToEqual,
      moneyBackAfterEqual: moneyBackAfterEqual,
      suggestions: active.map(function (outcome, outcomeIndex) {
        var needed = 0;
        matrix.forEach(function (scenario, scenarioIndex) {
          var factor = num(scenario.factors[outcomeIndex]);
          var deficit = targetGross - num(grossReturns[scenarioIndex]);
          if (factor > 0 && deficit > 0) needed = Math.max(needed, deficit / factor);
        });
        var projectedStake = totalStake + needed;
        var projectedGross = num(stakes[outcomeIndex]) * num(outcome.odds) + needed * num(outcome.odds);
        return {
          outcomeId: outcome.id,
          outcomeName: outcome.name,
          odds: num(outcome.odds),
          currentStake: num(stakes[outcomeIndex]),
          currentGross: num(stakes[outcomeIndex]) * num(outcome.odds),
          suggestedAdditional: needed,
          projectedRoi: projectedStake ? (projectedGross - projectedStake) / projectedStake * 100 : 0
        };
      })
    };
  }

  function hasManualStakes() {
    return activeCalculatorOutcomesForBoard().some(function (outcome) {
      return num(outcome.plannedStake) > 0;
    });
  }

  function syncManualStakeAssignment(outcomeId) {
    var outcome = calculatorOutcomeById(outcomeId);
    if (!outcome) return;
    var stake = num(outcome.plannedStake);
    var rows = assignmentRowsForOutcome(outcomeId);
    if (stake <= 0) {
      calculatorAssignments[outcomeId] = rows.filter(function (row) { return !row.manualPrompt || row.platformAccountId; });
      return;
    }
    if (!rows.length) {
      rows.push({
        id: uid('asgn'),
        outcomeId: outcomeId,
        platformAccountId: '',
        cashAmount: stake,
        bonusAmount: 0,
        freeBetAmount: 0,
        requiredTurnover: num(outcome.requiredTurnover),
        manualPrompt: true
      });
      return;
    }
    var prompt = rows.filter(function (row) { return row.manualPrompt; })[0];
    if (prompt && !prompt.platformAccountId) prompt.cashAmount = stake;
  }

  function calculatorSessionName() {
    return calculatorSessionDraft.sessionName || calculatorDraft.eventName || 'Calculator Session';
  }

  function calculatorEventName() {
    return calculatorDraft.eventName || 'Event ' + (calculatorSessionEvents.length + 1);
  }

  function syncCalculatorSessionFormFromDraft() {
    var form = document.getElementById('calculatorSessionForm');
    if (!form) return;
    Object.keys(calculatorSessionDraft).forEach(function (key) {
      if (form.elements[key]) form.elements[key].value = calculatorSessionDraft[key] == null ? '' : calculatorSessionDraft[key];
    });
    setText('calculatorSessionStatus', calculatorSessionDraft.status || 'Draft');
  }

  function updateCalculatorSessionDraftFromForm() {
    var form = document.getElementById('calculatorSessionForm');
    if (!form) return;
    calculatorSessionDraft.sessionName = form.elements.sessionName.value || calculatorSessionDraft.sessionName;
    calculatorSessionDraft.startDate = form.elements.startDate.value;
    calculatorSessionDraft.expectedEndDate = form.elements.expectedEndDate.value;
    calculatorSessionDraft.expectedRolloverDate = form.elements.expectedRolloverDate.value;
    calculatorSessionDraft.targetReturnPercentage = num(form.elements.targetReturnPercentage.value);
    calculatorSessionDraft.objective = form.elements.objective.value;
    calculatorSessionDraft.description = form.elements.description.value;
    calculatorSessionDraft.notes = form.elements.notes.value;
  }

  function sessionHistory(action, detail) {
    return {
      id: uid('hist'),
      action: action,
      detail: detail || '',
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      createdAt: nowIso()
    };
  }

  function sessionPoolEntries() {
    if (!Array.isArray(calculatorSessionDraft.accountPool)) calculatorSessionDraft.accountPool = [];
    return calculatorSessionDraft.accountPool;
  }

  function poolEntryByAccountId(platformAccountId) {
    return sessionPoolEntries().filter(function (item) { return item.platformAccountId === platformAccountId; })[0] || null;
  }

  function sessionPoolAccountIds() {
    return sessionPoolEntries().map(function (item) { return item.platformAccountId; });
  }

  function createPoolEntry(account, data) {
    var balances = workflow().platformAvailableBalances(state, account);
    var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
    return {
      id: uid('pool'),
      clientId: account.clientId,
      userId: account.userId,
      platformId: account.platformId,
      platformAccountId: account.id,
      openingCashBalance: data.cashBalance !== '' && data.cashBalance != null ? num(data.cashBalance) : balances.cashBalance,
      openingBonusBalance: data.bonusBalance !== '' && data.bonusBalance != null ? num(data.bonusBalance) : balances.bonusBalance,
      openingFreeBetBalance: data.freeBetBalance !== '' && data.freeBetBalance != null ? num(data.freeBetBalance) : num(account.freeBetBalance),
      manualFundingAdded: 0,
      remainingTurnover: data.remainingTurnover !== '' && data.remainingTurnover != null ? num(data.remainingTurnover) : turnover.remainingTurnoverAmount,
      reason: data.reason || 'Initial session account pool',
      addedAt: data.addedAt || nowIso().slice(0, 16),
      addedBy: currentUser ? currentUser.id : '',
      notes: ''
    };
  }

  function currentEventAssignments() {
    return allCalculatorAssignments().filter(function (assignment) {
      return assignment.status !== 'Cancelled' && assignment.status !== 'Superseded';
    }).map(function (assignment) {
      var outcome = calculatorOutcomeById(assignment.outcomeId) || {};
      var resultRow = resultRowByOutcomeId(assignment.outcomeId) || {};
      return Object.assign({}, assignment, {
        eventId: activeCalculatorEventId,
        eventName: calculatorEventName(),
        eventDate: calculatorDraft.eventDate,
        marketType: calculatorDraft.marketType,
        outcomeName: outcome.name || '',
        marketKey: outcome.marketKey || '',
        marketName: calculatorDraft.marketName,
        odds: num(resultRow.odds || outcome.odds),
        plannedStake: num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount),
        finalStake: num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount),
        executedStake: num(assignment.executedStake),
        result: assignment.result || '',
        payout: num(assignment.payout),
        refund: num(assignment.refund),
        profitLoss: num(assignment.profitLoss)
      });
    });
  }

  function sessionEventAssignments(includeCurrent) {
    var rows = [];
    calculatorSessionEvents.forEach(function (event) {
      (event.assignments || []).forEach(function (assignment) { rows.push(assignment); });
    });
    if (includeCurrent) {
      currentEventAssignments().forEach(function (assignment) {
        var existingEvent = calculatorSessionEvents.some(function (event) { return event.id === assignment.eventId; });
        if (!existingEvent) rows.push(assignment);
      });
    }
    return rows;
  }

  function poolUsageForAccount(platformAccountId, includeCurrent) {
    var entry = poolEntryByAccountId(platformAccountId);
    var rows = sessionEventAssignments(includeCurrent).filter(function (row) { return row.platformAccountId === platformAccountId; });
    var manualFunding = entry ? num(entry.manualFundingAdded) : 0;
    var plannedCash = sum(rows, function (row) { return num(row.cashAmount); });
    var plannedBonus = sum(rows, function (row) { return num(row.bonusAmount); });
    var plannedFreeBet = sum(rows, function (row) { return num(row.freeBetAmount); });
    var executed = sum(rows, function (row) { return num(row.executedStake); });
    var lockedRows = rows.filter(function (row) {
      return row.locked || row.lockedAt || ['Locked', 'Reserved', 'Approved'].indexOf(row.status) !== -1;
    });
    function remainingLockedPortion(row, field) {
      var total = num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount);
      var executedRatio = total > 0 ? Math.min(1, num(row.executedStake) / total) : 0;
      return num(row[field]) * (1 - executedRatio);
    }
    function executedPortion(row, field) {
      var total = num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount);
      var executedRatio = total > 0 ? Math.min(1, num(row.executedStake) / total) : 0;
      return num(row[field]) * executedRatio;
    }
    var reservedCash = sum(lockedRows, function (row) { return remainingLockedPortion(row, 'cashAmount'); });
    var reservedBonus = sum(lockedRows, function (row) { return remainingLockedPortion(row, 'bonusAmount'); });
    var reservedFreeBet = sum(lockedRows, function (row) { return remainingLockedPortion(row, 'freeBetAmount'); });
    var executedCash = sum(rows, function (row) { return executedPortion(row, 'cashAmount'); });
    var executedBonus = sum(rows, function (row) { return executedPortion(row, 'bonusAmount'); });
    var executedFreeBet = sum(rows, function (row) { return executedPortion(row, 'freeBetAmount'); });
    var planned = plannedCash + plannedBonus + plannedFreeBet;
    var openingCash = entry ? num(entry.openingCashBalance) : 0;
    var openingBonus = entry ? num(entry.openingBonusBalance) : 0;
    var openingFreeBet = entry ? num(entry.openingFreeBetBalance) : 0;
    var reservedMixes = (calculatorSessionDraft.mixTickets || []).filter(function (mix) {
      return mix.status !== 'Draft' && mix.status !== 'Ready to Lock' && mix.status !== 'Cancelled';
    });
    var mixCash = sum(reservedMixes.filter(function (mix) { return mix.platformAccountId === platformAccountId; }), function (mix) { return mix.cashPortion; });
    var mixBonus = sum(reservedMixes.filter(function (mix) { return mix.platformAccountId === platformAccountId; }), function (mix) { return mix.normalBonusPortion; });
    var mixFreeBet = sum(reservedMixes.filter(function (mix) { return mix.platformAccountId === platformAccountId; }), function (mix) { return mix.freeBetPortion; });
    var hedgeCash = 0;
    var hedgeBonus = 0;
    var hedgeFreeBet = 0;
    reservedMixes.forEach(function (mix) {
      (mix.hedges || []).filter(function (hedge) {
        return hedge.platformAccountId === platformAccountId && hedge.executedStatus === 'Executed';
      }).forEach(function (hedge) {
        if (hedge.stakeType === 'Cash') hedgeCash += num(hedge.stakeAmount);
        if (hedge.stakeType === 'Normal Bonus') hedgeBonus += num(hedge.stakeAmount);
        if (hedge.stakeType === 'Free Bet') hedgeFreeBet += num(hedge.stakeAmount);
      });
    });
    var remainingCash = Math.max(0, openingCash + manualFunding - plannedCash - mixCash - hedgeCash);
    var remainingBonus = Math.max(0, openingBonus - plannedBonus - mixBonus - hedgeBonus);
    var spendableCash = Math.max(0, openingCash + manualFunding - reservedCash - executedCash - mixCash - hedgeCash);
    var spendableBonus = Math.max(0, openingBonus - reservedBonus - executedBonus - mixBonus - hedgeBonus);
    var spendableFreeBet = Math.max(0, openingFreeBet - reservedFreeBet - executedFreeBet - mixFreeBet - hedgeFreeBet);
    return {
      openingCashBalance: openingCash,
      openingBonusBalance: openingBonus,
      openingFreeBetBalance: openingFreeBet,
      manualFundingAdded: manualFunding,
      totalPlanned: planned + mixCash + mixBonus + mixFreeBet + hedgeCash + hedgeBonus + hedgeFreeBet,
      totalExecuted: executed,
      totalReserved: reservedCash + reservedBonus + reservedFreeBet + mixCash + mixBonus + mixFreeBet,
      remainingAvailableCash: remainingCash,
      remainingBonus: remainingBonus,
      remainingFreeBet: Math.max(0, openingFreeBet - plannedFreeBet - mixFreeBet - hedgeFreeBet),
      spendableCash: spendableCash,
      spendableBonus: spendableBonus,
      spendableFreeBet: spendableFreeBet,
      remainingTurnover: Math.max(0, num(entry && entry.remainingTurnover) - executed),
      estimatedBalanceAfterEvents: remainingCash + remainingBonus + Math.max(0, openingFreeBet - plannedFreeBet - mixFreeBet - hedgeFreeBet)
    };
  }

  function lockCurrentEventIntoSession(reason) {
    if (!calculatorResult) return false;
    updateCalculatorDraftFromForm();
    var event = {
      id: activeCalculatorEventId || uid('evt'),
      eventName: calculatorEventName(),
      eventDate: calculatorDraft.eventDate,
      marketType: calculatorDraft.marketType,
      marketName: calculatorDraft.marketName,
      input: clone(calculatorDraft),
      result: clone(calculatorResult),
      assignments: currentEventAssignments(),
      status: 'Locked',
      lockedAt: nowIso(),
      lockedBy: currentUser ? currentUser.id : ''
    };
    activeCalculatorEventId = event.id;
    calculatorSessionEvents = calculatorSessionEvents.filter(function (item) { return item.id !== event.id; });
    calculatorSessionEvents.push(event);
    calculatorSessionDraft.status = 'Calculating';
    calculatorSessionDraft.history.push(sessionHistory(reason || 'Event locked', event.eventName));
    return true;
  }

  function addAccountToActiveSession(event) {
    event.preventDefault();
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    updateCalculatorSessionDraftFromForm();
    var form = event.target;
    var account = byId(state.userPlatforms, form.elements.platformAccountId.value);
    if (!account) {
      window.alert('Choose an existing platform account from Account Management.');
      return;
    }
    if (calculatorSessionDraft.clientId && calculatorSessionDraft.clientId !== account.clientId) {
      window.alert('Client isolation blocked this Account. A Calculator Session can use Accounts from only one Client.');
      return;
    }
    if (poolEntryByAccountId(account.id)) {
      window.alert('This platform account is already in the active session pool.');
      return;
    }
    var entry = createPoolEntry(account, {
      cashBalance: form.elements.cashBalance.value,
      bonusBalance: form.elements.bonusBalance.value,
      freeBetBalance: form.elements.freeBetBalance.value,
      remainingTurnover: form.elements.remainingTurnover.value,
      reason: form.elements.reason.value,
      addedAt: form.elements.addedAt.value
    });
    sessionPoolEntries().push(entry);
    calculatorSessionDraft.clientId = account.clientId;
    calculatorSessionDraft.status = sessionPoolEntries().length ? 'Preparing Accounts' : 'Draft';
    calculatorSessionDraft.history.push(sessionHistory('Account added to active session', platformAccountLabel(account) + ' / ' + entry.reason));
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: 'Calculator session account added',
      entityType: 'CalculatorSession',
      entityId: calculatorSessionDraft.id,
      newValue: entry
    }));
    form.elements.reason.value = '';
    saveState();
    renderCalculator();
  }

  function addEventUsingSessionPool() {
    if (!sessionPoolEntries().length) {
      window.alert('Add platform accounts to the Session Account Pool before adding events.');
      return;
    }
    updateCalculatorSessionDraftFromForm();
    if (calculatorResult) lockCurrentEventIntoSession('Event locked before adding next event');
    var previousType = calculatorDraft.marketType;
    var previousMode = calculatorDraft.mode;
    var previousIncrement = calculatorDraft.increment;
    calculatorDraft = createCalculatorDraft(previousType);
    calculatorDraft.mode = previousMode;
    calculatorDraft.increment = previousIncrement;
    calculatorDraft.eventName = 'Event ' + (calculatorSessionEvents.length + 1);
    calculatorDraft.totalCapital = Math.max(0, sum(sessionPoolEntries(), function (entry) {
      var usage = poolUsageForAccount(entry.platformAccountId, false);
      return usage.remainingAvailableCash + usage.remainingBonus;
    }));
    activeCalculatorEventId = uid('evt');
    calculatorResult = null;
    calculatorAssignments = {};
    calculatorSessionDraft.status = 'Calculating';
    calculatorSessionDraft.history.push(sessionHistory('New event added', calculatorDraft.eventName));
    renderCalculator();
    openCalculatorDialog('calculatorEventDetailsDialog');
  }

  function updateCalculatorSegments() {
    document.querySelectorAll('[data-market-choice]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-market-choice') === calculatorDraft.marketType);
    });
    setText('calculatorModePill', calculatorDraft.marketType);
  }

  function calculatorOutcomeById(outcomeId) {
    return calculatorDraft.outcomes.filter(function (item) { return item.id === outcomeId; })[0] || null;
  }

  function resultRowByOutcomeId(outcomeId) {
    if (!calculatorResult) return null;
    return calculatorResult.outcomeRows.filter(function (item) { return item.outcomeId === outcomeId; })[0] || null;
  }

  function assignmentRowsForOutcome(outcomeId) {
    if (!calculatorAssignments[outcomeId]) calculatorAssignments[outcomeId] = [];
    return calculatorAssignments[outcomeId];
  }

  function assignmentTotal(outcomeId) {
    return sum(assignmentRowsForOutcome(outcomeId), function (row) {
      return num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount);
    });
  }

  function remainingAssignmentStake(outcomeId) {
    var row = resultRowByOutcomeId(outcomeId);
    return Math.max(0, num(row && row.stake) - assignmentTotal(outcomeId));
  }

  function allCalculatorAssignments() {
    var rows = [];
    Object.keys(calculatorAssignments).forEach(function (outcomeId) {
      assignmentRowsForOutcome(outcomeId).forEach(function (assignment) {
        if (assignment.platformAccountId && assignment.status !== 'Cancelled' && assignment.status !== 'Superseded') rows.push(assignment);
      });
    });
    return rows;
  }

  function bookmarkedAccountIds() {
    return state.accountBookmarks.map(function (item) { return item.platformAccountId; });
  }

  function sortedPlatformAccountsForCalculator(platformId) {
    var bookmarked = bookmarkedAccountIds();
    var poolIds = sessionPoolAccountIds();
    if (!poolIds.length) return [];
    return visiblePlatformAccounts().filter(function (account) {
      return poolIds.indexOf(account.id) !== -1 && (!platformId || account.platformId === platformId);
    }).sort(function (a, b) {
      var favA = bookmarked.indexOf(a.id) !== -1 ? 0 : 1;
      var favB = bookmarked.indexOf(b.id) !== -1 ? 0 : 1;
      if (favA !== favB) return favA - favB;
      return platformAccountLabel(a).localeCompare(platformAccountLabel(b));
    });
  }

  function platformAccountOptionLabel(account) {
    var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
    var balances = workflow().platformAvailableBalances(state, account);
    var usage = poolEntryByAccountId(account.id) ? poolUsageForAccount(account.id, true) : null;
    var favorite = bookmarkedAccountIds().indexOf(account.id) !== -1 ? '* ' : '';
    var available = usage ? usage.remainingAvailableCash + usage.remainingBonus : balances.availableTotal;
    return favorite + platformAccountLabel(account) + ' / session available ' + money(available) + ' / rollover ' + percent(turnover.effectiveTurnoverPercentage);
  }

  function assignmentEligibility(assignment) {
    var account = byId(state.userPlatforms, assignment.platformAccountId);
    var outcome = calculatorOutcomeById(assignment.outcomeId);
    var resultRow = resultRowByOutcomeId(assignment.outcomeId) || {};
    if (!account || !outcome) return null;
    var evaluation = workflow().evaluatePlatformAccount(state, {
      eventName: calculatorDraft.eventName || 'Calculator Event',
      eventId: slug(calculatorDraft.eventName || 'EVENT', 'EVENT'),
      marketType: calculatorDraft.marketType === 'Two Outcome' ? 'Two Outcome' : 'Three Outcome',
      marketName: calculatorDraft.marketName,
      outcomeName: outcome.name,
      platformId: account.platformId,
      odds: resultRow.odds || outcome.odds,
      stake: num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount),
      potentialPayout: (num(assignment.cashAmount) + num(assignment.bonusAmount)) * num(resultRow.odds || outcome.odds) + window.AtlasMixService.singleFreeBet(num(assignment.freeBetAmount), num(resultRow.odds || outcome.odds)).truePotentialWin,
      requiredTurnoverAllocation: num(assignment.requiredTurnover || resultRow.requiredTurnover),
      date: calculatorDraft.eventDate
    }, account);
    var poolIds = sessionPoolAccountIds();
    var stake = num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount);
    if (poolIds.length && poolIds.indexOf(account.id) === -1) {
      evaluation.status = 'Unavailable';
      evaluation.suggested = false;
      evaluation.errors.push('Account is not part of the active Session Account Pool.');
      evaluation.reasons.push('Account is not part of the active Session Account Pool.');
    }
    if (poolEntryByAccountId(account.id)) {
      var usage = poolUsageForAccount(account.id, false);
      var maxSessionAvailable = usage.remainingAvailableCash + usage.remainingBonus;
      if (stake > maxSessionAvailable + 0.00001) {
        evaluation.status = 'Unavailable';
        evaluation.suggested = false;
        evaluation.errors.push('Session pool remaining balance is only ' + maxSessionAvailable.toFixed(2) + '.');
        evaluation.reasons.push('Session pool remaining balance is only ' + maxSessionAvailable.toFixed(2) + '.');
      }
      evaluation.maxAdditionalStake = Math.min(evaluation.maxAdditionalStake, maxSessionAvailable);
    }
    return evaluation;
  }

  function openCalculatorWorkbench(marketType, mode) {
    calculatorSessionDraft = createCalculatorSessionDraft();
    calculatorSessionEvents = [];
    activeCalculatorEventId = uid('evt');
    calculatorDraft = createCalculatorDraft(marketType || 'Three Outcome');
    calculatorDraft.mode = mode || calculatorDraft.mode;
    calculatorDraft.marketType = marketType || calculatorDraft.marketType;
    calculatorResult = null;
    calculatorAssignments = {};
    var home = document.getElementById('calculatorHome');
    var workbench = document.getElementById('calculatorWorkbench');
    if (home) home.hidden = true;
    if (workbench) workbench.hidden = false;
    document.body.classList.add('calculator-has-workbench');
    renderCalculator();
  }

  function closeCalculatorWorkbench() {
    var home = document.getElementById('calculatorHome');
    var workbench = document.getElementById('calculatorWorkbench');
    if (home) home.hidden = false;
    if (workbench) workbench.hidden = true;
    document.body.classList.remove('calculator-has-workbench');
    closeAllCalculatorDialogs();
    renderCalculatorSessions();
  }

  function addCalculatorAssignment(outcomeId) {
    var row = resultRowByOutcomeId(outcomeId);
    if (!row) return;
    var remaining = remainingAssignmentStake(outcomeId);
    assignmentRowsForOutcome(outcomeId).push({
      id: uid('asgn'),
      outcomeId: outcomeId,
      platformAccountId: '',
      cashAmount: remaining || row.stake,
      bonusAmount: 0,
      freeBetAmount: 0,
      requiredTurnover: row.requiredTurnover || 0
    });
    renderCalculator();
  }

  function removeCalculatorAssignment(outcomeId, index) {
    calculatorAssignments[outcomeId] = assignmentRowsForOutcome(outcomeId).filter(function (item, itemIndex) {
      return itemIndex !== index;
    });
    renderCalculator();
  }

  function updateCalculatorAssignmentFromInput(input) {
    var outcomeId = input.getAttribute('data-outcome-id');
    var index = Number(input.getAttribute('data-assignment-index'));
    var field = input.getAttribute('data-assignment-field');
    var assignment = assignmentRowsForOutcome(outcomeId)[index];
    if (!assignment || !field) return;
    assignment[field] = field === 'platformAccountId' ? input.value : num(input.value);
    if (field === 'platformAccountId' && input.value) {
      var account = byId(state.userPlatforms, input.value);
      if (account && bookmarkedAccountIds().indexOf(account.id) === -1 && window.confirm('Bookmark this platform account for quick calculator access?')) {
        toggleAccountBookmark(account.id);
      }
    }
  }

  function openCalculatorDialog(id, opener) {
    var dialog = document.getElementById(id);
    if (!dialog) return;
    calculatorDialogReturnFocus = opener || document.activeElement;
    document.querySelectorAll('.calculator-drawer[open], .calculator-popover-dialog[open]').forEach(function (item) {
      if (item !== dialog && typeof item.close === 'function') item.close();
    });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeCalculatorDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (calculatorDialogReturnFocus && typeof calculatorDialogReturnFocus.focus === 'function') {
      calculatorDialogReturnFocus.focus();
    }
    calculatorDialogReturnFocus = null;
  }

  function closeAllCalculatorDialogs() {
    document.querySelectorAll('.calculator-drawer[open], .calculator-popover-dialog[open]').forEach(function (dialog) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
  }

  function calculatorCompactEvents() {
    var events = calculatorSessionEvents.map(function (event) {
      return Object.assign({}, event, {
        eventDate: event.eventDate || ((event.input || {}).eventDate),
        marketName: event.marketName || ((event.input || {}).marketName),
        assignments: (event.assignments || []).filter(function (assignment) {
          return assignment.status !== 'Cancelled' && assignment.status !== 'Superseded';
        }),
        isCurrent: event.id === activeCalculatorEventId
      });
    });
    if (activeCalculatorEventId && !events.some(function (event) { return event.id === activeCalculatorEventId; })) {
      events.push({
        id: activeCalculatorEventId,
        eventName: calculatorEventName(),
        eventDate: calculatorDraft.eventDate,
        marketName: calculatorDraft.marketName,
        marketType: calculatorDraft.marketType,
        status: calculatorResult ? 'Calculated' : 'Draft',
        assignments: currentEventAssignments(),
        result: calculatorResult,
        input: clone(calculatorDraft),
        isCurrent: true
      });
    }
    (calculatorSessionDraft.mixTickets || []).forEach(function (mix) {
      var service = window.AtlasMixService;
      var activeLeg = service.activeLeg(mix);
      var gaps = service.timeGapValidation(mix);
      var nextGap = gaps.filter(function (gap) {
        return activeLeg && (gap.fromLegId === activeLeg.id || gap.toLegId === activeLeg.id);
      })[0] || gaps[0];
      var assignments = [];
      if (mix.platformAccountId) {
        assignments.push({
          id: mix.id,
          platformAccountId: mix.platformAccountId,
          outcomeName: 'Main Mix',
          lockedOdds: service.combinedOdds(mix),
          cashAmount: mix.cashPortion,
          bonusAmount: mix.normalBonusPortion,
          freeBetAmount: mix.freeBetPortion,
          status: mix.status,
          lockedAt: mix.lockedAt,
          executedStake: mix.placedAt ? service.values(mix).totalStake : 0
        });
      }
      (mix.hedges || []).forEach(function (hedge) {
        assignments.push({
          id: hedge.id,
          platformAccountId: hedge.platformAccountId,
          outcomeName: hedge.outcome,
          lockedOdds: hedge.lockedOdds,
          cashAmount: hedge.stakeType === 'Cash' ? hedge.stakeAmount : 0,
          bonusAmount: hedge.stakeType === 'Normal Bonus' ? hedge.stakeAmount : 0,
          freeBetAmount: hedge.stakeType === 'Free Bet' ? hedge.stakeAmount : 0,
          status: hedge.executedStatus,
          executedStake: hedge.executedStatus === 'Executed' ? hedge.stakeAmount : 0
        });
      });
      events.push({
        id: mix.id,
        eventName: 'Mix ' + (mix.ticketReference || mix.id),
        status: mix.status,
        isMix: true,
        legCount: (mix.legs || []).length,
        combinedOdds: service.combinedOdds(mix),
        activeLegLabel: activeLeg ? 'L' + (service.sortedLegs(mix).indexOf(activeLeg) + 1) + ' Active' : 'No active leg',
        nextGapMinutes: nextGap ? nextGap.minutes : '',
        assignments: assignments,
        mix: mix
      });
    });
    return events;
  }

  function pendingOutgoingForPlatformAccount(accountId) {
    return sum(state.expectedWithdrawals.filter(function (item) {
      return item.platformAccountId === accountId && ['Received', 'Cancelled'].indexOf(item.status) === -1;
    }), function (item) {
      return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived));
    });
  }

  function calculatorCompactAccounts() {
    return sessionPoolEntries().map(function (entry) {
      var account = byId(state.userPlatforms, entry.platformAccountId);
      if (!account) return null;
      var usage = poolUsageForAccount(account.id, true);
      var rule = activePlatformRule(account.platformId);
      var turnover = workflow().turnoverSummary(account, rule);
      var pendingOutgoing = pendingOutgoingForPlatformAccount(account.id);
      var safetyMargin = num(account.safetyMargin);
      var available = Math.max(0, usage.spendableCash + usage.spendableBonus + usage.spendableFreeBet - pendingOutgoing - safetyMargin);
      var balanceTypes = [];
      if (usage.spendableCash > 0) balanceTypes.push('C');
      if (usage.spendableBonus > 0) balanceTypes.push('B');
      if (usage.spendableFreeBet > 0) balanceTypes.push('FB');
      var warnings = [];
      if (account.status !== 'Active') warnings.push('Account operational status is ' + (account.status || 'Unknown') + '.');
      if (pendingOutgoing > 0) warnings.push('Pending outgoing amount reduces spendable balance by ' + money(pendingOutgoing) + '.');
      return {
        platformAccountId: account.id,
        clientId: account.clientId,
        userId: account.userId,
        platformId: account.platformId,
        clientName: clientName(account.clientId),
        userName: userName(account.userId),
        platformName: platformName(account.platformId),
        accountName: account.accountCode || account.username || account.id,
        shortName: userName(account.userId) + ' / ' + (account.accountCode || account.username || account.id),
        status: account.status || 'Unknown',
        balanceTypes: balanceTypes.join('+') || '-',
        openingCash: usage.openingCashBalance,
        openingBonus: usage.openingBonusBalance,
        openingFreeBet: usage.openingFreeBetBalance,
        currentCash: usage.spendableCash,
        currentBonus: usage.spendableBonus,
        currentFreeBet: usage.spendableFreeBet,
        reservedCapital: usage.totalReserved,
        executedCapital: usage.totalExecuted,
        pendingOutgoing: pendingOutgoing,
        safetyMargin: safetyMargin,
        availableCapital: available,
        requiredTurnover: turnover.requiredTurnoverAmount,
        completedTurnover: turnover.completedTurnoverAmount,
        remainingTurnover: usage.remainingTurnover,
        sessionTurnoverContribution: usage.totalExecuted,
        eligibleOdds: String(rule.minEligibleOdds || 1) + (num(rule.maxEligibleOdds) ? '-' + rule.maxEligibleOdds : '+'),
        maximumStake: rule.maxStake,
        maximumPayout: rule.maxPayout,
        restrictions: [
          rule.sameAccountMultipleOutcomes ? 'Multiple outcomes allowed' : 'One-outcome restriction',
          'Maximum ' + num(rule.maxOutcomesPerEvent || 1) + ' outcomes per event'
        ],
        withdrawalStatus: pendingOutgoing > 0 ? 'Pending outgoing' : 'No pending withdrawal',
        warnings: warnings
      };
    }).filter(Boolean);
  }

  function compactCalculatorWarnings(events) {
    var rows = (calculatorResult && calculatorResult.warnings ? calculatorResult.warnings.slice() : []);
    currentEventAssignments().forEach(function (assignment) {
      var evaluation = assignmentEligibility(assignment);
      if (!evaluation) return;
      evaluation.errors.concat(evaluation.reviews || []).forEach(function (message) {
        rows.push({
          category: evaluation.errors.indexOf(message) !== -1 ? 'Platform rule' : 'Review required',
          severity: evaluation.errors.indexOf(message) !== -1 ? 'critical' : 'warning',
          accountId: assignment.platformAccountId,
          eventId: assignment.eventId || activeCalculatorEventId,
          outcomeId: assignment.outcomeId,
          message: message
        });
      });
    });
    var mixWarnings = [];
    (calculatorSessionDraft.mixTickets || []).forEach(function (mix) {
      window.AtlasMixService.timeGapValidation(mix).forEach(function (gap) {
        if (gap.status === 'Sufficient Balancing Window') return;
        mixWarnings.push({
          category: 'Mix timing',
          severity: gap.requiresOwnerOverride ? 'critical' : 'warning',
          eventId: mix.id,
          message: gap.status + ': ' + gap.minutes + ' minutes.'
        });
      });
    });
    return { rows: rows, mixWarnings: mixWarnings, events: events };
  }

  function buildCompactCalculatorModel() {
    var events = calculatorCompactEvents();
    var warningPack = compactCalculatorWarnings(events);
    var coverageRows = [];
    if (hasManualStakes()) {
      coverageRows = manualStakeCoverage().neededRows.map(function (row) {
        return {
          outcomeId: row.outcomeId,
          name: row.outcomeName,
          requiredStake: row.totalStakeAfterAdd,
          assignedStake: row.currentStake,
          remainingStake: row.neededToEqual
        };
      });
    }
    compactCalculatorModel = window.AtlasCalculatorViewModel.build({
      today: todayString(),
      view: calculatorLayout.view,
      density: calculatorLayout.density,
      session: {
        id: calculatorSessionDraft.id,
        name: calculatorSessionName(),
        clientId: calculatorSessionDraft.clientId,
        status: calculatorSessionDraft.status,
        saveState: activeCalculatorSessionId ? 'Saved' : 'Not saved'
      },
      targetReturnPercentage: calculatorSessionDraft.targetReturnPercentage,
      activeEventId: activeCalculatorEventId,
      accounts: calculatorCompactAccounts(),
      events: events,
      result: calculatorResult,
      coverageRows: coverageRows,
      warnings: warningPack.rows,
      mixWarnings: warningPack.mixWarnings
    });
    return compactCalculatorModel;
  }

  function compactKpi(label, value, tone) {
    return '<div class="compact-kpi' + (tone ? ' is-' + tone : '') + '"><span>' + htmlEscape(label) + '</span><strong>' + htmlEscape(value) + '</strong></div>';
  }

  function renderCompactSession(model) {
    setText('compactSessionName', calculatorSessionName());
    setText('compactSessionClient', calculatorSessionDraft.clientId ? clientName(calculatorSessionDraft.clientId) : 'No client');
    setText('compactSessionTarget', 'Target ' + percent(model.summary.targetReturnPercentage));
    setText('compactSaveState', activeCalculatorSessionId ? 'Saved' : 'Not saved');
    var kpis = document.getElementById('calculatorKpiStrip');
    if (kpis) {
      kpis.innerHTML =
        compactKpi('Accounts', String(model.summary.accountsSelected)) +
        compactKpi('Available', money(model.summary.availableCapital)) +
        compactKpi('Reserved', money(model.summary.reservedCapital)) +
        compactKpi('Executed', money(model.summary.executedCapital)) +
        compactKpi('Required', money(model.summary.requiredCapital)) +
        compactKpi('Min Return', percent(model.summary.currentReturnPercentage), model.summary.currentReturnPercentage >= model.summary.targetReturnPercentage ? 'positive' : 'warning') +
        compactKpi('Target', percent(model.summary.targetReturnPercentage)) +
        compactKpi('Imbalance', money(model.summary.remainingImbalance), model.summary.remainingImbalance ? 'warning' : 'positive') +
        compactKpi('Issues', String(model.summary.warningCount), model.summary.warningCount ? 'warning' : 'positive');
    }
  }

  function renderCompactWarnings(model) {
    var holder = document.getElementById('compactWarningStrip');
    if (!holder) return;
    if (!model.warnings.length) {
      holder.innerHTML = '<strong>No open issues</strong><span>Current Calculator checks are clear.</span>';
      holder.classList.add('is-clear');
      return;
    }
    holder.classList.remove('is-clear');
    holder.innerHTML =
      '<strong>' + model.warnings.length + ' Issue' + (model.warnings.length === 1 ? '' : 's') + '</strong>' +
      '<div class="warning-strip-items">' + model.warnings.slice(0, 4).map(function (warning, index) {
        return '<button type="button" data-compact-warning-index="' + index + '">' +
          '<span class="warning-severity">' + htmlEscape(warning.severity === 'critical' ? 'Critical' : 'Review') + '</span>' +
          '<span>' + htmlEscape(warning.message) + '</span></button>';
      }).join('') + '</div>' +
      (model.warnings.length > 4 ? '<span class="warning-more">+' + (model.warnings.length - 4) + ' more</span>' : '');
  }

  function renderCompactBalancing(model) {
    var holder = document.getElementById('calculatorBalancingView');
    if (!holder) return;
    if (!calculatorResult) {
      holder.innerHTML = '<div class="compact-empty-state"><strong>No exposure calculation yet</strong><span>Open Event Details, enter odds or stakes, and calculate.</span></div>';
      return;
    }
    var scenarioRows = model.balancing.scenarios.map(function (scenario) {
      var roi = model.summary.requiredCapital ? num(scenario.profitLoss) / model.summary.requiredCapital * 100 : 0;
      return '<tr><td>' + htmlEscape(scenario.name) + '</td><td class="num">' + money(scenario.grossReturn) + '</td><td class="num ' + (scenario.profitLoss >= 0 ? 'positive' : 'negative') + '">' + money(scenario.profitLoss) + '</td><td class="num">' + percent(roi) + '</td></tr>';
    }).join('');
    var coverageRows = model.coverage.map(function (row) {
      return '<tr><td>' + htmlEscape(row.name) + '</td><td class="num">' + money(row.requiredStake) + '</td><td class="num">' + money(row.assignedStake) + '</td><td class="num ' + (row.remainingStake > 0 ? 'negative' : 'positive') + '">' + money(row.remainingStake) + '</td></tr>';
    }).join('');
    holder.innerHTML =
      '<div class="compact-metric-row">' +
        compactKpi('Current Return', percent(model.summary.currentReturnPercentage)) +
        compactKpi('Target Return', percent(model.summary.targetReturnPercentage)) +
        compactKpi('Worst Case', money(model.summary.worstCaseProfit), model.summary.worstCaseProfit >= 0 ? 'positive' : 'warning') +
        compactKpi('Best Case', money(model.summary.bestCaseProfit)) +
        compactKpi('Required Capital', money(model.summary.requiredCapital)) +
      '</div>' +
      '<div class="compact-table-pair">' +
        '<div class="table-wrap"><table><thead><tr><th>Possible result</th><th>Gross return</th><th>Profit/Loss</th><th>ROI</th></tr></thead><tbody>' + scenarioRows + '</tbody></table></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Outcome</th><th>Required</th><th>Assigned</th><th>Remaining</th></tr></thead><tbody>' + coverageRows + '</tbody></table></div>' +
      '</div>';
  }

  function renderCompactTurnover(model) {
    var holder = document.getElementById('calculatorTurnoverView');
    if (!holder) return;
    if (!model.turnover.length) {
      holder.innerHTML = '<div class="compact-empty-state"><strong>No Session Accounts</strong><span>Add Accounts to monitor turnover.</span></div>';
      return;
    }
    holder.innerHTML = '<div class="table-wrap"><table class="compact-data-table"><thead><tr><th>Account</th><th>Platform</th><th>Required</th><th>Completed</th><th>Remaining</th><th>Eligible odds</th><th>Session contribution</th><th>Status</th></tr></thead><tbody>' +
      model.turnover.map(function (row) {
        return '<tr><td><button class="text-action" type="button" data-account-preview="' + htmlEscape(row.accountId) + '">' + htmlEscape(row.accountName) + '</button></td><td>' + htmlEscape(row.platformName) + '</td><td class="num">' + money(row.required) + '</td><td class="num">' + money(row.completed) + '</td><td class="num">' + money(row.remaining) + '</td><td>' + htmlEscape(row.eligibleOdds) + '</td><td class="num">' + money(row.sessionContribution) + '</td><td><span class="' + paymentStatusClass(row.status) + '">' + htmlEscape(row.status) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderCompactResults(model) {
    var holder = document.getElementById('calculatorResultsView');
    if (!holder) return;
    if (!model.results.length) {
      holder.innerHTML = '<div class="compact-empty-state"><strong>No Events</strong><span>Add an Event before recording execution or settlement.</span></div>';
      return;
    }
    holder.innerHTML = '<div class="table-wrap"><table class="compact-data-table"><thead><tr><th>Event</th><th>Status</th><th>Result</th><th>Executed allocations</th><th>Executed capital</th><th>Profit/Loss</th></tr></thead><tbody>' +
      model.results.map(function (event) {
        var executed = sum(event.allocations, function (row) { return row.executedStake; });
        var profitLoss = sum(event.allocations, function (row) { return row.profitLoss; });
        return '<tr><td>' + htmlEscape(event.eventName || 'Event') + '</td><td><span class="' + paymentStatusClass(event.status) + '">' + htmlEscape(event.status) + '</span></td><td>' + htmlEscape(event.actualResult || '-') + '</td><td class="num">' + event.allocations.length + '</td><td class="num">' + money(executed) + '</td><td class="num ' + (profitLoss >= 0 ? 'positive' : 'negative') + '">' + money(profitLoss) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderCompactFooter(model) {
    var holder = document.getElementById('calculatorSummaryFooter');
    if (!holder) return;
    holder.innerHTML =
      '<div class="summary-footer-values">' +
        '<span>Required <strong>' + money(model.summary.requiredCapital) + '</strong></span>' +
        '<span>Available <strong>' + money(model.summary.availableCapital) + '</strong></span>' +
        '<span>Reserved <strong>' + money(model.summary.reservedCapital) + '</strong></span>' +
        '<span>Worst <strong>' + money(model.summary.minimumReturn) + '</strong></span>' +
        '<span>ROI <strong>' + percent(model.summary.currentReturnPercentage) + '</strong></span>' +
        '<span>Gap <strong>' + money(model.summary.remainingImbalance) + '</strong></span>' +
        '<span>Uncovered <strong>' + model.summary.uncoveredOutcomes + '</strong></span>' +
      '</div>' +
      '<div class="summary-footer-actions">' +
        '<button class="secondary-button compact-button" type="button" data-open-calculator-dialog="calculatorMathDetailsDialog">Generate Suggestion</button>' +
        '<button id="compactCompleteAllocation" class="primary-button compact-button" type="button">Mark Allocation Complete</button>' +
        '<button id="compactOpenSettlement" class="secondary-button compact-button" type="button">Settle</button>' +
      '</div>';
  }

  function renderCompactSessionHistory() {
    var holder = document.getElementById('compactSessionHistory');
    if (!holder) return;
    var rows = (calculatorSessionDraft.history || []).slice().reverse().slice(0, 12);
    holder.innerHTML = '<h3>Status and Audit History</h3>' + (rows.length ? rows.map(function (row) {
      return '<div class="history-row"><span>' + htmlEscape(row.action) + '</span><strong>' + htmlEscape(row.detail || '') + '</strong><time>' + htmlEscape(String(row.createdAt || '').replace('T', ' ').slice(0, 16)) + '</time></div>';
    }).join('') : '<div class="compact-empty-state"><span>No Session actions recorded yet.</span></div>');
  }

  function applyCalculatorViewState(model) {
    var workbench = document.getElementById('calculatorWorkbench');
    if (!workbench) return;
    workbench.setAttribute('data-density', calculatorLayout.density);
    workbench.style.setProperty('--calculator-fixed-width', num(calculatorLayout.fixedColumnWidth) + 'px');
    workbench.style.setProperty('--calculator-event-width', num(calculatorLayout.eventColumnWidth) + 'px');
    document.querySelectorAll('[data-calculator-view-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-calculator-view-panel') !== calculatorLayout.view;
    });
    document.querySelectorAll('[data-calculator-view]').forEach(function (button) {
      var active = button.getAttribute('data-calculator-view') === calculatorLayout.view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    var density = document.getElementById('calculatorDensity');
    if (density) density.value = calculatorLayout.density;
    var fixedColumnWidth = document.getElementById('calculatorFixedColumnWidth');
    if (fixedColumnWidth) fixedColumnWidth.value = calculatorLayout.fixedColumnWidth;
    var eventColumnWidth = document.getElementById('calculatorEventColumnWidth');
    if (eventColumnWidth) eventColumnWidth.value = calculatorLayout.eventColumnWidth;
    var search = document.getElementById('calculatorAccountSearch');
    if (search && search.value !== calculatorLayout.accountSearch) search.value = calculatorLayout.accountSearch;
    var filter = document.getElementById('calculatorAccountFilter');
    if (filter) filter.value = calculatorLayout.accountFilter;
  }

  function renderCompactCalculator() {
    var workbench = document.getElementById('calculatorWorkbench');
    if (!workbench || workbench.hidden) return;
    var model = buildCompactCalculatorModel();
    applyCalculatorViewState(model);
    renderCompactSession(model);
    renderCompactWarnings(model);
    renderSessionMoneyGrid(model);
    renderCompactBalancing(model);
    renderCompactTurnover(model);
    renderCompactResults(model);
    renderCompactFooter(model);
    renderCompactSessionHistory();
    renderCalculatorMobileWorkspace(model);
  }

  function renderCalculator() {
    var outcomeBody = document.getElementById('calculatorOutcomeBody');
    if (!outcomeBody) return;
    syncCalculatorSessionFormFromDraft();
    syncCalculatorFormFromDraft();
    updateCalculatorSegments();
    clear(outcomeBody);
    setText('calculatorOutcomeMeta', calculatorDraft.outcomes.length + ' outcomes');
    calculatorDraft.outcomes.forEach(function (outcome) {
      var card = document.createElement('article');
      card.className = 'calc-outcome-card';
      card.innerHTML =
        '<div class="calc-outcome-head">' +
          '<label class="switch-row"><input type="checkbox" ' + (outcome.active !== false ? 'checked' : '') + ' data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="active"><span>Use</span></label>' +
          '<input class="outcome-title-input" value="' + htmlEscape(outcome.name) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="name">' +
        '</div>' +
        '<div class="calc-number-grid">' +
          '<label class="field"><span>Odds</span><input type="number" min="1" step="0.01" value="' + htmlEscape(outcome.odds) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="odds"></label>' +
          '<label class="field"><span>Stake</span><input type="number" min="0" step="0.01" value="' + htmlEscape(outcome.plannedStake || 0) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="plannedStake"></label>' +
          '<label class="switch-row lock-row"><input type="checkbox" ' + (outcome.locked ? 'checked' : '') + ' data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="locked"><span>Lock stake</span></label>' +
        '</div>' +
        '<div class="calc-account-preview" id="outcomeAccountPreview-' + htmlEscape(outcome.id) + '"></div>' +
        '<details class="advanced-details">' +
          '<summary>Advanced settings</summary>' +
          '<div class="form-grid">' +
            '<label><span>Provider / Platform</span><input value="' + htmlEscape(outcome.provider || '') + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="provider" placeholder="Optional before assignment"></label>' +
            '<label><span>Market Key</span><select data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="marketKey">' +
              '<option value="team1_win"' + (outcome.marketKey === 'team1_win' ? ' selected' : '') + '>Team 1 Win</option>' +
              '<option value="draw"' + (outcome.marketKey === 'draw' ? ' selected' : '') + '>Draw</option>' +
              '<option value="team2_win"' + (outcome.marketKey === 'team2_win' ? ' selected' : '') + '>Team 2 Win</option>' +
              '<option value="team1_dnb"' + (outcome.marketKey === 'team1_dnb' ? ' selected' : '') + '>Team 1 DNB</option>' +
              '<option value="team2_dnb"' + (outcome.marketKey === 'team2_dnb' ? ' selected' : '') + '>Team 2 DNB</option>' +
            '</select></label>' +
            '<label><span>Bonus Amount</span><input type="number" min="0" step="0.01" value="' + htmlEscape(outcome.bonusAmount || '') + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="bonusAmount"></label>' +
            '<label><span>Turnover Requirement</span><input type="number" min="0" step="0.01" value="' + htmlEscape(outcome.requiredTurnover) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="requiredTurnover"></label>' +
            '<label><span>Minimum Stake</span><input type="number" min="0" step="0.01" value="' + htmlEscape(outcome.minStake) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="minStake"></label>' +
            '<label><span>Maximum Stake</span><input type="number" min="0" step="0.01" value="' + htmlEscape(outcome.maxStake) + '" data-outcome-id="' + htmlEscape(outcome.id) + '" data-outcome-field="maxStake"></label>' +
          '</div>' +
        '</details>';
      outcomeBody.appendChild(card);
    });

    renderCalculatorResult();
    renderSessionAccountPool();
    renderSessionEvents();
    renderMixWorkspace();
    renderManualCoverageBoard();
    renderStakePlacementPrompt();
    renderCalculatorSessions();
    renderCalculatorAssignments();
    renderOperationPlan();
    renderCalculatorBookmarks();
    renderExecutionAndResults();
    renderFinalBalanceSummary();
    renderCompactCalculator();
  }

  function renderManualCoverageBoard() {
    var holder = document.getElementById('manualCoverageBoard');
    if (!holder) return;
    clear(holder);
    var coverage = manualStakeCoverage();
    if (!coverage.active.length) {
      holder.innerHTML = '<div class="manual-coverage-empty">Enter odds above 1.00 to see equal-return stake amounts and money-back percentage.</div>';
      return;
    }
    var scenarioRows = coverage.matrix.map(function (scenario, index) {
      var gross = coverage.grossReturns[index];
      var profit = gross - coverage.totalStake;
      var roi = coverage.totalStake ? profit / coverage.totalStake * 100 : 0;
      return '<tr><td>' + htmlEscape(scenario.name) + '</td><td class="num">' + money(gross) + '</td><td class="num ' + (profit >= 0 ? 'positive' : 'negative') + '">' + money(profit) + '</td><td class="num">' + percent(roi) + '</td></tr>';
    }).join('');
    var equalRows = coverage.equalRows.map(function (item) {
      return '<tr><td>' + htmlEscape(item.outcomeName) + '</td><td class="num">' + htmlEscape(String(item.odds)) + '</td><td class="num strong">' + money(item.equalStake) + '</td><td class="num">' + money(item.equalGrossReturn) + '</td><td class="num ' + (item.roi >= 0 ? 'positive' : 'negative') + '">' + percent(item.roi) + '</td></tr>';
    }).join('');
    var neededRows = coverage.neededRows.map(function (item) {
      var label = coverage.totalStake ? (item.neededToEqual > 0 ? money(item.neededToEqual) : 'Covered') : 'Enter stake';
      return '<tr><td>' + htmlEscape(item.outcomeName) + '</td><td class="num">' + money(item.currentStake) + '</td><td class="num">' + money(item.currentGross) + '</td><td class="num strong">' + label + '</td><td class="num">' + money(item.totalStakeAfterAdd) + '</td></tr>';
    }).join('');
    holder.innerHTML =
      '<div class="manual-coverage-head">' +
        '<div><h3>Live ROI and Equal-Return Coverage</h3><span>No automatic split. It only tells you the amounts; you choose whether to use them.</span></div>' +
        '<div class="manual-coverage-kpis">' +
          '<div><span>Best money back using odds</span><strong class="' + (coverage.bestMoneyBackPercent >= 100 ? 'positive' : 'negative') + '">' + percent(coverage.bestMoneyBackPercent) + '</strong></div>' +
          '<div><span>Equal-return ROI</span><strong class="' + (coverage.bestEqualRoi >= 0 ? 'positive' : 'negative') + '">' + percent(coverage.bestEqualRoi) + '</strong></div>' +
          '<div><span>Equal gross return</span><strong>' + money(coverage.equalGrossReturn) + '</strong></div>' +
          '<div><span>Capital used for equal table</span><strong>' + money(coverage.baseCapital) + '</strong></div>' +
          '<div><span>Your current stake</span><strong>' + money(coverage.totalStake) + '</strong></div>' +
          '<div><span>Needed to equal current stake</span><strong>' + (coverage.totalStake ? money(coverage.totalNeededToEqual) : '-') + '</strong></div>' +
          '<div><span>Money back after equal</span><strong class="' + (coverage.moneyBackAfterEqual >= 100 ? 'positive' : 'negative') + '">' + (coverage.totalStake ? percent(coverage.moneyBackAfterEqual) : '-') + '</strong></div>' +
          '<div><span>Worst ROI now</span><strong class="' + (coverage.worstRoi >= 0 ? 'positive' : 'negative') + '">' + (coverage.totalStake ? percent(coverage.worstRoi) : '-') + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<div class="manual-coverage-tables">' +
        '<div class="table-wrap"><table><thead><tr><th>Odd</th><th>Odds</th><th>Stake to equal all</th><th>Equal gross return</th><th>ROI</th></tr></thead><tbody>' + equalRows + '</tbody></table></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Odd</th><th>Your stake</th><th>Current return</th><th>Needed to equal current best</th><th>Total on odd after add</th></tr></thead><tbody>' + neededRows + '</tbody></table></div>' +
      '</div>';
    if (coverage.totalStake) {
      holder.innerHTML += '<details class="advanced-details"><summary>Current possible-result ROI</summary><div class="table-wrap"><table><thead><tr><th>Possible result</th><th>Gross return</th><th>Profit/Loss</th><th>ROI</th></tr></thead><tbody>' + scenarioRows + '</tbody></table></div></details>';
    }
  }

  function renderStakePlacementPrompt() {
    var holder = document.getElementById('stakePlacementPrompt');
    if (!holder) return;
    clear(holder);
    var manualOutcomes = activeCalculatorOutcomesForBoard().filter(function (outcome) { return num(outcome.plannedStake) > 0; });
    if (!manualOutcomes.length) {
      holder.innerHTML = '';
      return;
    }
    var rowsHtml = manualOutcomes.map(function (outcome) {
      syncManualStakeAssignment(outcome.id);
      var rows = assignmentRowsForOutcome(outcome.id);
      var prompt = rows[0];
      var index = rows.indexOf(prompt);
      var evaluation = prompt && prompt.platformAccountId ? assignmentEligibility(prompt) : null;
      var account = prompt && prompt.platformAccountId ? byId(state.userPlatforms, prompt.platformAccountId) : null;
      return '<article class="stake-placement-card">' +
        '<div><h3>' + htmlEscape(outcome.name) + '</h3><span>Stake entered: ' + money(outcome.plannedStake) + '. Choose where this stake is being placed.</span></div>' +
        '<div class="stake-placement-grid">' +
          '<label><span>Platform account</span><select data-assignment-field="platformAccountId" data-outcome-id="' + htmlEscape(outcome.id) + '" data-assignment-index="' + index + '">' + renderAccountSelectOptions(prompt ? prompt.platformAccountId : '', account ? account.platformId : '') + '</select></label>' +
          '<label><span>Cash amount</span><input type="number" min="0" step="0.01" value="' + htmlEscape(prompt ? prompt.cashAmount : outcome.plannedStake) + '" data-assignment-field="cashAmount" data-outcome-id="' + htmlEscape(outcome.id) + '" data-assignment-index="' + index + '"></label>' +
          '<label><span>Bonus amount</span><input type="number" min="0" step="0.01" value="' + htmlEscape(prompt ? prompt.bonusAmount : 0) + '" data-assignment-field="bonusAmount" data-outcome-id="' + htmlEscape(outcome.id) + '" data-assignment-index="' + index + '"></label>' +
          '<label><span>Free Bet amount</span><input type="number" min="0" step="0.01" value="' + htmlEscape(prompt ? prompt.freeBetAmount : 0) + '" data-assignment-field="freeBetAmount" data-outcome-id="' + htmlEscape(outcome.id) + '" data-assignment-index="' + index + '"></label>' +
        '</div>' +
        '<div class="placement-status">' + (evaluation ? renderEligibilityMini(evaluation) : '<span class="status-badge">Waiting for account</span><span class="assignment-reason">Select one pooled account for this stake.</span>') + '</div>' +
      '</article>';
    }).join('');
    holder.innerHTML = '<div class="placement-head"><h3>Where Are These Stakes Going?</h3><span>This is a draft prompt. It does not execute or save anything until you confirm the operation.</span></div>' + rowsHtml;
  }

  function renderSessionAccountPool() {
    var holder = document.getElementById('sessionAccountPoolSummary');
    if (!holder) return;
    clear(holder);
    var entries = sessionPoolEntries();
    setText('sessionPoolMeta', entries.length + ' accounts');
    if (!entries.length) {
      holder.innerHTML = '<div class="empty-state">Add platform accounts once at session level. Every event will use this shared account pool.</div>';
      return;
    }
    entries.forEach(function (entry) {
      var account = byId(state.userPlatforms, entry.platformAccountId);
      var usage = poolUsageForAccount(entry.platformAccountId, true);
      var card = document.createElement('article');
      card.className = 'session-pool-card';
      card.innerHTML =
        '<header><div><h3>' + htmlEscape(platformAccountLabel(account)) + '</h3><span class="muted">' + htmlEscape(clientName(entry.clientId)) + ' / ' + htmlEscape(userName(entry.userId)) + ' / added ' + htmlEscape(entry.addedAt || '') + '</span></div><div class="action-row"><button class="secondary-button compact-button" type="button" data-account-preview="' + htmlEscape(account.id) + '">Preview</button><button class="secondary-button compact-button" type="button" data-remove-session-account="' + htmlEscape(account.id) + '">Remove unused</button></div></header>' +
        '<div class="pool-metrics">' +
          '<div class="metric"><span>Opening Cash</span><strong>' + money(usage.openingCashBalance) + '</strong></div>' +
          '<div class="metric"><span>Opening Bonus</span><strong>' + money(usage.openingBonusBalance) + '</strong></div>' +
          '<div class="metric"><span>Opening Free Bet</span><strong>' + money(usage.openingFreeBetBalance) + '</strong></div>' +
          '<div class="metric"><span>Manual Funding Added</span><strong>' + money(usage.manualFundingAdded) + '</strong></div>' +
          '<div class="metric"><span>Total Planned</span><strong>' + money(usage.totalPlanned) + '</strong></div>' +
          '<div class="metric"><span>Total Executed</span><strong>' + money(usage.totalExecuted) + '</strong></div>' +
          '<div class="metric"><span>Total Reserved</span><strong>' + money(usage.totalReserved) + '</strong></div>' +
          '<div class="metric"><span>Remaining Cash</span><strong>' + money(usage.remainingAvailableCash) + '</strong></div>' +
          '<div class="metric"><span>Remaining Bonus</span><strong>' + money(usage.remainingBonus) + '</strong></div>' +
          '<div class="metric"><span>Remaining Free Bet</span><strong>' + money(usage.remainingFreeBet) + '</strong></div>' +
          '<div class="metric"><span>Remaining Turnover</span><strong>' + money(usage.remainingTurnover) + '</strong></div>' +
          '<div class="metric"><span>Estimated Balance</span><strong>' + money(usage.estimatedBalanceAfterEvents) + '</strong></div>' +
        '</div>';
      holder.appendChild(card);
    });
  }

  function renderSessionEvents() {
    var holder = document.getElementById('sessionEventList');
    if (!holder) return;
    clear(holder);
    var events = calculatorSessionEvents.slice();
    if (calculatorDraft.eventName || calculatorResult) {
      events = events.concat([{ id: activeCalculatorEventId, eventName: calculatorEventName(), marketType: calculatorDraft.marketType, result: calculatorResult, assignments: currentEventAssignments(), status: 'Active' }]);
    }
    if (!events.length) {
      holder.innerHTML = '<div class="empty-state">Add Event creates a new event that uses the same Session Account Pool.</div>';
      return;
    }
    events.forEach(function (event) {
      var assignments = event.assignments || [];
      var planned = sum(assignments, function (row) { return num(row.finalStake || (num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount))); });
      var card = document.createElement('article');
      card.className = 'session-event-card';
      card.innerHTML =
        '<header><div><h3>' + htmlEscape(event.eventName || 'Event') + '</h3><span class="muted">' + htmlEscape(event.marketType || '') + ' / ' + assignments.length + ' account allocations</span></div><span class="' + paymentStatusClass(event.status || 'Locked') + '">' + htmlEscape(event.status || 'Locked') + '</span></header>' +
        '<div class="pool-metrics">' +
          '<div class="metric"><span>Planned Capital</span><strong>' + money(planned) + '</strong></div>' +
          '<div class="metric"><span>Possible Outcomes</span><strong>' + (((event.result || {}).scenarios || []).length || 0) + '</strong></div>' +
          '<div class="metric"><span>Minimum Return</span><strong>' + money((event.result || {}).minimumReturn || 0) + '</strong></div>' +
          '<div class="metric"><span>Status</span><strong>' + htmlEscape(event.status || 'Locked') + '</strong></div>' +
        '</div>';
      holder.appendChild(card);
    });
  }

  function mixActor() {
    return { userId: currentUser ? currentUser.id : '', role: currentRole() };
  }

  function ensureMixDraft() {
    if (!currentMixDraft) {
      currentMixDraft = window.AtlasMixService.createMix({
        sessionId: calculatorSessionDraft.id,
        minimumGapMinutes: 15,
        recommendedGapMinutes: 30,
        createdBy: currentUser ? currentUser.id : ''
      });
    }
    if (!Array.isArray(calculatorSessionDraft.mixTickets)) calculatorSessionDraft.mixTickets = [];
    return currentMixDraft;
  }

  function replaceMix(list, mix) {
    var found = false;
    var next = (list || []).map(function (item) {
      if (item.id !== mix.id) return item;
      found = true;
      return clone(mix);
    });
    if (!found) next.push(clone(mix));
    return next;
  }

  function syncMixDraftFromControls() {
    var mix = ensureMixDraft();
    var account = byId(state.userPlatforms, (document.getElementById('mixMainAccount') || {}).value);
    mix.platformAccountId = account ? account.id : '';
    mix.clientId = account ? account.clientId : '';
    mix.userId = account ? account.userId : '';
    mix.platformId = account ? account.platformId : '';
    mix.ticketReference = (document.getElementById('mixTicketReference') || {}).value || '';
    mix.cashPortion = num((document.getElementById('mixCashPortion') || {}).value);
    mix.normalBonusPortion = num((document.getElementById('mixBonusPortion') || {}).value);
    mix.freeBetPortion = num((document.getElementById('mixFreeBetPortion') || {}).value);
    mix.minimumGapMinutes = num((document.getElementById('mixMinimumGap') || {}).value) || 15;
    mix.recommendedGapMinutes = num((document.getElementById('mixRecommendedGap') || {}).value) || 30;
    mix.primaryGoal = (document.getElementById('mixPrimaryGoal') || {}).value || '';
    mix.secondaryGoal = (document.getElementById('mixSecondaryGoal') || {}).value || '';
    mix.minimumTargetReturn = num((document.getElementById('mixTargetReturn') || {}).value);
    return mix;
  }

  function syncMixControlsFromDraft() {
    var mix = ensureMixDraft();
    var fields = {
      mixMainAccount: mix.platformAccountId,
      mixTicketReference: mix.ticketReference,
      mixCashPortion: mix.cashPortion,
      mixBonusPortion: mix.normalBonusPortion,
      mixFreeBetPortion: mix.freeBetPortion,
      mixMinimumGap: mix.minimumGapMinutes,
      mixRecommendedGap: mix.recommendedGapMinutes,
      mixPrimaryGoal: mix.primaryGoal,
      mixSecondaryGoal: mix.secondaryGoal,
      mixTargetReturn: mix.minimumTargetReturn
    };
    Object.keys(fields).forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.value = fields[id] == null ? '' : fields[id];
    });
  }

  function eligibleMixHedgeAccounts(mix) {
    var active = window.AtlasMixService.activeLeg(mix);
    if (!active || !mix.clientId) return [];
    return sessionPoolEntries().map(function (entry) {
      var account = byId(state.userPlatforms, entry.platformAccountId);
      if (!account || account.clientId !== mix.clientId || account.id === mix.platformAccountId) return null;
      var usage = poolUsageForAccount(account.id, true);
      var rule = activePlatformRule(account.platformId);
      var odds = num((document.getElementById('mixSuggestionOdds') || {}).value) || active.lockedOdds;
      var evaluation = workflow().evaluatePlatformAccount(state, {
        eventId: active.eventId || active.id,
        outcomeName: active.outcome,
        odds: odds,
        stake: 0.01,
        potentialPayout: odds * 0.01,
        platformId: account.platformId,
        marketName: active.market,
        marketType: 'Three Outcome'
      }, account);
      return { account: account, usage: usage, evaluation: evaluation };
    }).filter(Boolean);
  }

  function mixStatusLabel(mix) {
    if (!mix) return 'No Mix';
    if (mix.status === 'Lost') {
      var firstLeg = window.AtlasMixService.sortedLegs(mix)[0];
      return firstLeg && firstLeg.status === 'Lost' ? 'First Leg Lost - Mix Closed' : 'Later Leg Lost - Mix Closed';
    }
    if (mix.status === 'Completed') return 'Completed - All Legs Won';
    return mix.status || 'Draft';
  }

  function renderSingleFreeBetValuation() {
    var holder = document.getElementById('singleFreeBetResult');
    if (!holder) return;
    var result = window.AtlasMixService.singleFreeBet(
      (document.getElementById('singleFreeBetStake') || {}).value,
      (document.getElementById('singleFreeBetOdds') || {}).value
    );
    holder.innerHTML =
      '<div><span>Original Locked Odds</span><strong>' + result.originalOdds.toFixed(2) + '</strong></div>' +
      '<div><span>Effective Free Bet Odds</span><strong>' + result.effectiveFreeBetOdds.toFixed(2) + '</strong></div>' +
      '<div><span>Free Bet Stake</span><strong>' + money(result.freeBetStake) + '</strong></div>' +
      '<div><span>True Potential Win</span><strong>' + money(result.truePotentialWin) + '</strong></div>';
  }

  function renderMixWorkspace() {
    var structure = document.getElementById('betStructure');
    var singlePanel = document.getElementById('singleFreeBetPanel');
    var builder = document.getElementById('mixBuilder');
    if (!structure || !singlePanel || !builder) return;
    singlePanel.hidden = structure.value !== 'Single';
    builder.hidden = structure.value !== 'Mix';
    if (structure.value === 'Single') renderSingleFreeBetValuation();
    if (structure.value !== 'Mix') return;

    var mix = ensureMixDraft();
    var mainSelect = document.getElementById('mixMainAccount');
    setOptions(mainSelect, sessionPoolEntries().map(function (entry) {
      return byId(state.userPlatforms, entry.platformAccountId);
    }).filter(Boolean), function (item) { return item.id; }, platformAccountOptionLabel, mix.platformAccountId);
    syncMixControlsFromDraft();

    var eventSelect = document.querySelector('#mixLegForm select[name="eventId"]');
    var eventRows = calculatorSessionEvents.slice();
    if (activeCalculatorEventId && !eventRows.some(function (event) { return event.id === activeCalculatorEventId; })) {
      eventRows.push({ id: activeCalculatorEventId, eventName: calculatorEventName() });
    }
    setOptions(eventSelect, eventRows, function (item) { return item.id; }, function (item) { return item.eventName || item.id; }, eventSelect.value);

    var hedgeSelect = document.querySelector('#mixHedgeForm select[name="platformAccountId"]');
    var hedgeRows = eligibleMixHedgeAccounts(mix);
    setOptions(hedgeSelect, hedgeRows, function (row) { return row.account.id; }, function (row) {
      return platformAccountLabel(row.account) + ' / Cash ' + money(row.usage.remainingAvailableCash) + ' / Bonus ' + money(row.usage.remainingBonus) + ' / Free Bet ' + money(row.usage.remainingFreeBet) + ' / ' + row.evaluation.status;
    }, hedgeSelect.value);

    var service = window.AtlasMixService;
    var legs = service.sortedLegs(mix);
    var active = service.activeLeg(mix);
    var gaps = service.timeGapValidation(mix);
    var timeline = document.getElementById('mixTimeline');
    timeline.innerHTML = legs.length ? legs.map(function (leg, index) {
      var gap = gaps[index];
      var activeClass = active && active.id === leg.id ? ' is-active' : '';
      var gapClass = gap && gap.requiresOwnerOverride ? ' is-danger' : (gap && gap.status === 'Limited Balancing Window' ? ' is-warning' : '');
      return '<article class="mix-leg' + activeClass + '"><header><span>Leg ' + (index + 1) + '</span><strong>' + htmlEscape(leg.status) + '</strong></header><h4>' + htmlEscape(leg.eventName) + '</h4><p>' + htmlEscape(leg.market + ' / ' + leg.outcome) + '</p><dl><div><dt>Locked odds</dt><dd>' + num(leg.lockedOdds).toFixed(2) + '</dd></div><div><dt>Start</dt><dd>' + htmlEscape(String(leg.eventStartTime).replace('T', ' ')) + '</dd></div><div><dt>Settlement</dt><dd>' + htmlEscape(String(leg.expectedSettlementTime).replace('T', ' ')) + '</dd></div></dl>' + (!leg.lockedAt ? '<button class="icon-button compact-button" type="button" title="Remove leg" data-remove-mix-leg="' + leg.id + '">x</button>' : '') + (gap ? '<div class="mix-gap' + gapClass + '">' + htmlEscape(gap.status) + ' / ' + gap.minutes + ' min</div>' : '') + '</article>';
    }).join('<span class="mix-arrow">&rarr;</span>') : '<div class="empty-state">Add at least two chronological Mix legs. No Event or outcome is selected automatically.</div>';

    var valuation = service.values(mix);
    document.getElementById('mixValueSummary').innerHTML =
      '<div><span>Combined Locked Odds</span><strong>' + valuation.combinedLockedOdds.toFixed(2) + '</strong></div>' +
      '<div class="provisional"><span>Provisional Mix Potential</span><strong>' + money(valuation.provisionalCombinedPotential) + '</strong><small>Planning value, not realized cash</small></div>' +
      '<div><span>Current True Withdrawable</span><strong>' + money(valuation.currentTrueWithdrawableValue) + '</strong></div>' +
      '<div><span>Adjusted Free Bet Potential</span><strong>' + (mix.freeBetDeductionApplied ? money(valuation.adjustedFreeBetPotential) : 'Not triggered') + '</strong></div>' +
      '<div><span>Free Bet Deduction</span><strong>' + (mix.freeBetDeductionApplied ? 'Applied once' : 'Not applied') + '</strong></div>';

    var position = service.cumulativePosition(mix);
    document.getElementById('mixExposureSummary').innerHTML =
      '<div><span>Current Active Leg</span><strong>' + htmlEscape(position.activeLeg ? position.activeLeg.eventName : 'None') + '</strong></div>' +
      '<div><span>Win Branch Return</span><strong>' + money(position.activeLegWinBranchReturn) + '</strong></div>' +
      '<div><span>Lose Branch Return</span><strong>' + money(position.activeLegLoseBranchReturn) + '</strong></div>' +
      '<div><span>Remaining Imbalance</span><strong>' + money(position.remainingImbalance) + '</strong></div>' +
      '<div><span>Worst / Best Result</span><strong>' + money(position.worstCaseResult) + ' / ' + money(position.bestCaseResult) + '</strong></div>' +
      '<div><span>Current Minimum Return</span><strong>' + percent(position.currentRoi) + '</strong></div>';

    setText('mixStatusBadge', mixStatusLabel(mix));
    document.getElementById('viewMixReport').hidden = false;
    renderMixReport();
    renderMixSuggestion();
  }

  function renderMixSuggestion() {
    var holder = document.getElementById('mixSuggestionResult');
    if (!holder) return;
    if (!currentMixSuggestion) {
      holder.innerHTML = '<div class="empty-state">A suggestion appears only after the Owner presses Generate Mix Suggestion.</div>';
      return;
    }
    var accounts = eligibleMixHedgeAccounts(ensureMixDraft()).filter(function (row) {
      return row.evaluation.status !== 'Unavailable';
    });
    holder.innerHTML =
      '<strong>Suggested: ' + htmlEscape(currentMixSuggestion.recommendedHedgeOutcome) + ' / ' + money(currentMixSuggestion.suggestedAmount) + '</strong>' +
      '<p>' + htmlEscape(currentMixSuggestion.reason) + '</p>' +
      '<p>Expected hedge return: ' + money(currentMixSuggestion.expectedReturn) + '. No account, stake, odds, or execution state has been selected or committed.</p>' +
      '<details><summary>Suggested eligible accounts</summary>' + (accounts.length ? accounts.map(function (row) {
        return '<div class="suggested-account"><span>' + htmlEscape(platformAccountLabel(row.account)) + '</span><strong>' + htmlEscape(row.evaluation.status) + '</strong></div>';
      }).join('') : '<p>No eligible pooled external account.</p>') + '</details>';
  }

  function renderMixReport() {
    var panel = document.getElementById('mixReportPanel');
    if (!panel || !currentMixDraft) return;
    var mix = currentMixDraft;
    var service = window.AtlasMixService;
    var value = service.values(mix);
    var settled = service.settlement(mix);
    panel.innerHTML =
      '<div class="section-head"><div><p class="eyebrow">Immutable ticket report</p><h3>' + htmlEscape(mix.ticketReference || mix.id) + '</h3></div><span class="' + paymentStatusClass(mix.status) + '">' + htmlEscape(mixStatusLabel(mix)) + '</span></div>' +
      '<div class="mix-report-grid">' +
        '<section><h4>Main Ticket</h4><p>' + htmlEscape(clientName(mix.clientId) + ' / ' + userName(mix.userId)) + '</p><p>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, mix.platformAccountId))) + '</p></section>' +
        '<section><h4>Stake Composition</h4><p>Cash ' + money(mix.cashPortion) + '</p><p>Normal Bonus ' + money(mix.normalBonusPortion) + '</p><p>Free Bet ' + money(mix.freeBetPortion) + '</p></section>' +
        '<section><h4>Free Bet Logic</h4><p>Original combined odds ' + value.combinedLockedOdds.toFixed(2) + '</p><p>Effective Free Bet odds ' + value.effectiveFreeBetOdds.toFixed(2) + '</p><p>Deduction count ' + num(mix.freeBetDeductionCount) + '</p></section>' +
        '<section><h4>Performance</h4><p>Realized ' + money(settled.realizedWithdrawableValue) + '</p><p>Net result ' + money(settled.netResult) + '</p><p>Conversion ' + percent(settled.freeBetConversionRate) + '</p></section>' +
      '</div>' +
      '<div class="table-wrap"><table><thead><tr><th>Leg</th><th>Event</th><th>Outcome</th><th>Odds</th><th>Settlement</th><th>Result</th></tr></thead><tbody>' +
        service.sortedLegs(mix).map(function (leg, index) { return '<tr><td>' + (index + 1) + '</td><td>' + htmlEscape(leg.eventName) + '</td><td>' + htmlEscape(leg.outcome) + '</td><td>' + num(leg.lockedOdds).toFixed(2) + '</td><td>' + htmlEscape(String(leg.expectedSettlementTime).replace('T', ' ')) + '</td><td>' + htmlEscape(leg.result || leg.status) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Hedge Account</th><th>Leg</th><th>Outcome</th><th>Type</th><th>Stake</th><th>Locked Odds</th><th>Status</th><th>Return</th></tr></thead><tbody>' +
        (mix.hedges || []).map(function (hedge) { return '<tr><td>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, hedge.platformAccountId))) + '</td><td>' + htmlEscape(hedge.legId) + '</td><td>' + htmlEscape(hedge.outcome) + '</td><td>' + htmlEscape(hedge.stakeType) + '</td><td>' + money(hedge.stakeAmount) + '</td><td>' + num(hedge.lockedOdds).toFixed(2) + '</td><td>' + htmlEscape(hedge.executedStatus) + '</td><td>' + money(hedge.actualReturn) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
  }

  function persistCurrentMix(action) {
    var mix = syncMixDraftFromControls();
    calculatorSessionDraft.mixTickets = replaceMix(calculatorSessionDraft.mixTickets, mix);
    state.mixTickets = replaceMix(state.mixTickets, mix);
    calculatorSessionDraft.history.push(sessionHistory(action, mix.ticketReference || mix.id));
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: action,
      entityType: 'MixTicket',
      entityId: mix.id,
      newValue: clone(mix)
    }));
    saveState();
  }

  function mixBalanceCapacity(mix) {
    var entry = poolEntryByAccountId(mix.platformAccountId);
    if (!entry) return { cash: 0, normalBonus: 0, freeBet: 0 };
    var otherMixes = (calculatorSessionDraft.mixTickets || []).filter(function (item) {
      return item.id !== mix.id && item.platformAccountId === mix.platformAccountId &&
        item.status !== 'Draft' && item.status !== 'Ready to Lock' && item.status !== 'Cancelled';
    });
    return {
      cash: Math.max(0, num(entry.openingCashBalance) + num(entry.manualFundingAdded) - sum(otherMixes, function (item) { return item.cashPortion; })),
      normalBonus: Math.max(0, num(entry.openingBonusBalance) - sum(otherMixes, function (item) { return item.normalBonusPortion; })),
      freeBet: Math.max(0, num(entry.openingFreeBetBalance) - sum(otherMixes, function (item) { return item.freeBetPortion; }))
    };
  }

  function recordMixPlacement(mix) {
    var account = byId(state.userPlatforms, mix.platformAccountId);
    if (!account) throw new Error('Main Mix Platform Account is unavailable.');
    var capacity = mixBalanceCapacity(mix);
    if (num(mix.cashPortion) > capacity.cash) throw new Error('Mix Cash Portion exceeds remaining Session cash.');
    if (num(mix.normalBonusPortion) > capacity.normalBonus) throw new Error('Mix Normal Bonus Portion exceeds remaining Session bonus.');
    if (num(mix.freeBetPortion) > capacity.freeBet) throw new Error('Mix Free Bet Portion exceeds remaining Session Free Bet balance.');
    account.cashBalance = Math.max(0, num(account.cashBalance) - num(mix.cashPortion));
    account.bonusBalance = Math.max(0, num(account.bonusBalance) - num(mix.normalBonusPortion));
    account.freeBetBalance = Math.max(0, num(account.freeBetBalance) - num(mix.freeBetPortion));
    var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
    var eligibleTurnover = Math.min(window.AtlasMixService.values(mix).totalStake, turnover.remainingTurnoverAmount);
    account.completedTurnover = num(account.completedTurnover) + eligibleTurnover;
    mix.turnover = {
      mainTicketGenerated: eligibleTurnover,
      hedgeGenerated: num(mix.turnover && mix.turnover.hedgeGenerated),
      remainingTurnoverAfterPlacement: Math.max(0, turnover.remainingTurnoverAmount - eligibleTurnover),
      platformRuleSnapshot: clone(activePlatformRule(account.platformId))
    };
    mix.placedAt = nowIso();
    mix.placedBy = currentUser ? currentUser.id : '';
    mix.status = 'First Leg Active';
    mix.turnoverPosted = true;
    state.moneyPlacements.push({
      id: uid('place'),
      clientId: mix.clientId,
      userId: mix.userId,
      type: 'Mix Ticket Execution',
      previousLocation: platformAccountLabel(account),
      currentLocation: 'Active in Session',
      amount: window.AtlasMixService.values(mix).totalStake,
      currency: 'USD',
      date: todayString(),
      status: 'Executed',
      relatedTransactionId: mix.id,
      createdAt: nowIso()
    });
  }

  function recordExecutedHedgeBalance(mix, hedge) {
    if (hedge.executedStatus !== 'Executed' || hedge.balanceDebited) return;
    var account = byId(state.userPlatforms, hedge.platformAccountId);
    if (!account) throw new Error('Hedge Platform Account is unavailable.');
    var usage = poolUsageForAccount(account.id, true);
    var available = hedge.stakeType === 'Cash' ? usage.remainingAvailableCash : (hedge.stakeType === 'Normal Bonus' ? usage.remainingBonus : usage.remainingFreeBet);
    if (hedge.stakeAmount > available + 0.00001) throw new Error('Hedge exceeds the selected ' + hedge.stakeType + ' balance.');
    if (hedge.stakeType === 'Cash') account.cashBalance = Math.max(0, num(account.cashBalance) - hedge.stakeAmount);
    if (hedge.stakeType === 'Normal Bonus') account.bonusBalance = Math.max(0, num(account.bonusBalance) - hedge.stakeAmount);
    if (hedge.stakeType === 'Free Bet') account.freeBetBalance = Math.max(0, num(account.freeBetBalance) - hedge.stakeAmount);
    var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
    var delta = Math.min(hedge.stakeAmount, turnover.remainingTurnoverAmount);
    account.completedTurnover = num(account.completedTurnover) + delta;
    hedge.turnoverGenerated = delta;
    hedge.balanceDebited = true;
    hedge.executedAt = nowIso();
    mix.turnover = mix.turnover || {};
    mix.turnover.hedgeGenerated = num(mix.turnover.hedgeGenerated) + delta;
  }

  function postMixSettlementBalances(mix) {
    (mix.hedges || []).forEach(function (hedge) {
      if (!hedge.settlementResult || hedge.settlementBalancePosted) return;
      var account = byId(state.userPlatforms, hedge.platformAccountId);
      if (account) account.cashBalance = num(account.cashBalance) + num(hedge.actualReturn);
      hedge.settlementBalancePosted = true;
    });
    if (['Completed', 'Lost', 'Voided'].indexOf(mix.status) === -1 || mix.mainSettlementBalancePosted) return;
    var report = window.AtlasMixService.settlement(mix);
    var mainAccount = byId(state.userPlatforms, mix.platformAccountId);
    if (mainAccount) mainAccount.cashBalance = num(mainAccount.cashBalance) + num(report.mainTicketReturn);
    mix.settlement = Object.assign({}, report, {
      settledAt: nowIso(),
      returnedPrincipalClassifiedAsProfit: false,
      bonusConversionClassifiedAsContribution: false,
      accountingTreatment: 'Returns credited to platform cash; net result reported separately.'
    });
    mix.mainSettlementBalancePosted = true;
    state.moneyPlacements.push({
      id: uid('place'),
      clientId: mix.clientId,
      userId: mix.userId,
      type: 'Mix Settlement',
      previousLocation: 'Active in Session',
      currentLocation: platformAccountLabel(mainAccount),
      amount: report.realizedWithdrawableValue,
      currency: 'USD',
      date: todayString(),
      status: 'Executed',
      relatedTransactionId: mix.id,
      createdAt: nowIso()
    });
  }

  function accountVisibleInCompactGrid(account, model) {
    var search = String(calculatorLayout.accountSearch || '').toLowerCase();
    var haystack = [account.clientName, account.userName, account.platformName, account.accountName].join(' ').toLowerCase();
    if (search && haystack.indexOf(search) === -1) return false;
    var filter = calculatorLayout.accountFilter || 'all';
    if (filter === 'active') {
      return model.events.some(function (event) {
        return event.cells.some(function (cell) { return cell.accountId === account.platformAccountId && !cell.empty; });
      });
    }
    if (filter === 'cash') return account.currentCash > 0;
    if (filter === 'bonus') return account.currentBonus > 0;
    if (filter === 'freebet') return account.currentFreeBet > 0;
    if (filter === 'turnover') return account.remainingTurnover > 0;
    if (filter === 'warning') return account.warnings.length > 0;
    return true;
  }

  function compactCellHtml(cell) {
    if (cell.empty) {
      return '<span class="cell-empty-action">+ Add allocation</span>';
    }
    if (cell.rows.length > 1) {
      return '<span class="cell-primary">' + cell.rows.length + ' allocations</span><span class="cell-secondary">' + money(cell.total) + ' total</span><span class="cell-status">' + htmlEscape(cell.status) + '</span>';
    }
    var row = cell.rows[0];
    return '<span class="cell-primary">' + htmlEscape(row.outcome) + ' @ ' + num(row.odds).toFixed(2) + '</span>' +
      '<span class="cell-secondary">' + money(row.stake) + ' ' + htmlEscape(row.composition) + '</span>' +
      '<span class="cell-status">' + htmlEscape(row.status) + (cell.warningCount ? ' / !' : '') + '</span>';
  }

  function renderSessionMoneyGrid(model) {
    var head = document.getElementById('sessionMoneyGridHead');
    var body = document.getElementById('sessionMoneyGridBody');
    if (!head || !body) return;
    model = model || buildCompactCalculatorModel();
    var accounts = model.accounts.filter(function (account) { return accountVisibleInCompactGrid(account, model); });
    head.innerHTML = '<tr><th class="sticky-account"><span>Account</span><small>User / Platform / Spendable</small></th>' + model.events.map(function (event) {
      var collapsed = !!calculatorLayout.collapsedEvents[event.id];
      return '<th class="event-group-head' + (collapsed ? ' is-collapsed' : '') + '" data-event-column="' + htmlEscape(event.id) + '">' +
        '<button class="event-heading-button" type="button" data-open-event-info="' + htmlEscape(event.id) + '"><strong>' + htmlEscape(event.header.shortName) + '</strong><small>' + htmlEscape(event.header.meta) + '</small></button>' +
        '<button class="event-collapse-button" type="button" data-toggle-event="' + htmlEscape(event.id) + '" title="' + (collapsed ? 'Expand Event' : 'Collapse Event') + '" aria-label="' + (collapsed ? 'Expand Event' : 'Collapse Event') + '">' + (collapsed ? '+' : '\u2212') + '</button>' +
      '</th>';
    }).join('') + '</tr>';
    body.innerHTML = accounts.map(function (account, rowIndex) {
      return '<tr data-account-row="' + htmlEscape(account.platformAccountId) + '">' +
        '<td class="sticky-account"><button class="account-identity-button" type="button" data-account-preview="' + htmlEscape(account.platformAccountId) + '">' +
          '<strong>' + htmlEscape(account.shortName) + '</strong>' +
          '<span>' + htmlEscape(account.platformName) + ' / ' + money(account.availableCapital) + '</span>' +
          '<small>' + htmlEscape(account.balanceTypes) + ' / ' + htmlEscape(account.status) + (account.warnings.length ? ' / !' : '') + '</small>' +
        '</button></td>' +
        model.events.map(function (event, columnIndex) {
          var cell = event.cells.filter(function (item) { return item.accountId === account.platformAccountId; })[0];
          var collapsed = !!calculatorLayout.collapsedEvents[event.id];
          return '<td class="event-allocation-cell' + (cell.empty ? ' empty' : '') + (collapsed ? ' is-collapsed' : '') + '" data-event-column="' + htmlEscape(event.id) + '">' +
            '<button class="allocation-cell-button" type="button" data-open-cell data-account-id="' + htmlEscape(account.platformAccountId) + '" data-event-id="' + htmlEscape(event.id) + '" data-row-index="' + rowIndex + '" data-column-index="' + columnIndex + '" aria-label="' + htmlEscape((cell.empty ? 'Add allocation' : cell.label) + ' for ' + account.shortName + ' and ' + event.header.shortName) + '">' +
              compactCellHtml(cell) +
            '</button>' +
          '</td>';
        }).join('') +
      '</tr>';
    }).join('');
    if (!accounts.length) {
      body.innerHTML = '<tr><td colspan="' + (1 + model.events.length) + '"><div class="compact-empty-state"><strong>No visible Session Accounts</strong><span>Add an Account or change the Account filter.</span></div></td></tr>';
    }
  }

  function compactAccountById(accountId) {
    return (compactCalculatorModel && compactCalculatorModel.accounts || []).filter(function (account) {
      return account.platformAccountId === accountId;
    })[0] || null;
  }

  function compactEventById(eventId) {
    return (compactCalculatorModel && compactCalculatorModel.events || []).filter(function (event) {
      return event.id === eventId;
    })[0] || null;
  }

  function compactCellByIds(accountId, eventId) {
    var event = compactEventById(eventId);
    if (!event) return null;
    return event.cells.filter(function (cell) { return cell.accountId === accountId; })[0] || null;
  }

  function renderCalculatorMobileWorkspace(model) {
    var holder = document.getElementById('calculatorMobileWorkspace');
    if (!holder) return;
    var account = model.accounts.filter(function (item) { return item.platformAccountId === calculatorLayout.selectedAccountId; })[0] || null;
    var event = model.events.filter(function (item) { return item.id === calculatorLayout.selectedEventId; })[0] || null;
    var cell = account && event ? event.cells.filter(function (item) { return item.accountId === account.platformAccountId; })[0] : null;
    holder.innerHTML =
      '<div class="mobile-selector-row">' +
        '<label><span>Account</span><select id="calculatorMobileAccount"><option value="">Select Account</option>' + model.accounts.map(function (item) {
          return '<option value="' + htmlEscape(item.platformAccountId) + '"' + (account && account.platformAccountId === item.platformAccountId ? ' selected' : '') + '>' + htmlEscape(item.shortName + ' / ' + item.platformName) + '</option>';
        }).join('') + '</select></label>' +
        '<label><span>Event</span><select id="calculatorMobileEvent"><option value="">Select Event</option>' + model.events.map(function (item) {
          return '<option value="' + htmlEscape(item.id) + '"' + (event && event.id === item.id ? ' selected' : '') + '>' + htmlEscape(item.header.shortName) + '</option>';
        }).join('') + '</select></label>' +
      '</div>' +
      (account ? '<div class="mobile-account-summary"><strong>' + htmlEscape(account.shortName) + '</strong><span>' + htmlEscape(account.platformName) + '</span><span>Spendable ' + money(account.availableCapital) + '</span><span>' + htmlEscape(account.balanceTypes) + '</span></div>' : '<div class="compact-empty-state"><span>Select an Account.</span></div>') +
      (event ? '<div class="mobile-event-summary"><strong>' + htmlEscape(event.header.shortName) + '</strong><span>' + htmlEscape(event.header.meta) + '</span></div>' : '<div class="compact-empty-state"><span>Select an Event.</span></div>') +
      (cell ? '<button class="mobile-allocation-button" type="button" data-open-cell data-account-id="' + htmlEscape(account.platformAccountId) + '" data-event-id="' + htmlEscape(event.id) + '">' + compactCellHtml(cell) + '</button>' : '') +
      '<div class="mobile-summary-row"><span>ROI <strong>' + percent(model.summary.currentReturnPercentage) + '</strong></span><span>Warnings <strong>' + model.summary.warningCount + '</strong></span><span>Gap <strong>' + money(model.summary.remainingImbalance) + '</strong></span></div>';
  }

  function renderAccountPreview(accountId) {
    var account = compactAccountById(accountId);
    var body = document.getElementById('calculatorAccountPreviewBody');
    if (!account || !body) return;
    body.innerHTML =
      '<div class="preview-identity"><strong>' + htmlEscape(account.clientName + ' / ' + account.userName) + '</strong><span>' + htmlEscape(account.platformName + ' / ' + account.accountName) + '</span></div>' +
      '<div class="preview-metric-grid">' +
        compactKpi('Cash', money(account.currentCash)) +
        compactKpi('Normal Bonus', money(account.currentBonus)) +
        compactKpi('Free Bet', money(account.currentFreeBet)) +
        compactKpi('Reserved', money(account.reservedCapital)) +
        compactKpi('Pending outgoing', money(account.pendingOutgoing)) +
        compactKpi('Safety margin', money(account.safetyMargin)) +
        compactKpi('Spendable', money(account.availableCapital)) +
        compactKpi('Remaining turnover', money(account.remainingTurnover)) +
      '</div>' +
      '<dl class="preview-detail-list">' +
        '<div><dt>Eligible odds</dt><dd>' + htmlEscape(account.eligibleOdds) + '</dd></div>' +
        '<div><dt>Maximum stake</dt><dd>' + (num(account.maximumStake) ? money(account.maximumStake) : 'Not configured') + '</dd></div>' +
        '<div><dt>Maximum payout</dt><dd>' + (num(account.maximumPayout) ? money(account.maximumPayout) : 'Not configured') + '</dd></div>' +
        '<div><dt>Restrictions</dt><dd>' + htmlEscape(account.restrictions.join(' / ')) + '</dd></div>' +
        '<div><dt>Account status</dt><dd>' + htmlEscape(account.status) + '</dd></div>' +
        '<div><dt>Withdrawal status</dt><dd>' + htmlEscape(account.withdrawalStatus) + '</dd></div>' +
      '</dl>';
    openCalculatorDialog('calculatorAccountPreviewDialog');
  }

  function renderEventInfo(eventId) {
    var event = compactEventById(eventId);
    if (!event) return;
    if (event.isCurrent && !event.isMix) {
      openCalculatorDialog('calculatorEventDetailsDialog');
      return;
    }
    var body = document.getElementById('calculatorAllocationDetailsBody');
    if (!body) return;
    var allocations = event.assignments || event.allocations || [];
    body.innerHTML =
      '<div class="preview-identity"><strong>' + htmlEscape(event.eventName || event.header.shortName) + '</strong><span>' + htmlEscape(event.header.meta) + '</span></div>' +
      '<dl class="preview-detail-list">' +
        '<div><dt>Status</dt><dd>' + htmlEscape(event.status || 'Draft') + '</dd></div>' +
        '<div><dt>Market</dt><dd>' + htmlEscape(event.marketName || event.marketType || '-') + '</dd></div>' +
        '<div><dt>Allocations</dt><dd>' + allocations.length + '</dd></div>' +
        '<div><dt>Result</dt><dd>' + htmlEscape(event.actualResult || '-') + '</dd></div>' +
      '</dl>' +
      '<div class="compact-history"><h3>Related allocations</h3>' + (allocations.length ? allocations.map(function (row) {
        return '<div class="history-row"><span>' + htmlEscape(row.outcomeName || row.outcome || 'Allocation') + '</span><strong>' + money(num(row.finalStake || row.plannedStake || row.stakeAmount || (num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount)))) + ' @ ' + num(row.lockedOdds || row.odds).toFixed(2) + '</strong><time>' + htmlEscape(row.status || 'Draft') + '</time></div>';
      }).join('') : '<div class="compact-empty-state"><span>No allocations.</span></div>') + '</div>';
    openCalculatorDialog('calculatorAllocationDetailsDialog');
  }

  function currentAssignmentById(assignmentId) {
    var match = null;
    Object.keys(calculatorAssignments).some(function (outcomeId) {
      match = assignmentRowsForOutcome(outcomeId).filter(function (row) { return row.id === assignmentId; })[0] || null;
      return !!match;
    });
    return match;
  }

  function allocationForCell(cell) {
    if (!cell || !cell.allocations || !cell.allocations.length) return null;
    return cell.allocations.length === 1 ? cell.allocations[0] : null;
  }

  function renderAllocationDetails(accountId, eventId) {
    var account = compactAccountById(accountId);
    var event = compactEventById(eventId);
    var cell = compactCellByIds(accountId, eventId);
    var body = document.getElementById('calculatorAllocationDetailsBody');
    if (!account || !event || !body) return;
    body.innerHTML =
      '<div class="preview-identity"><strong>' + htmlEscape(account.shortName + ' / ' + event.header.shortName) + '</strong><span>' + htmlEscape(account.platformName + ' / ' + event.header.meta) + '</span></div>' +
      ((cell && cell.allocations.length) ? cell.allocations.map(function (allocation) {
        var parts = window.AtlasCalculatorViewModel.stakeParts(allocation);
        return '<section class="allocation-detail-row">' +
          '<div><strong>' + htmlEscape(allocation.outcomeName || allocation.outcome || 'Outcome') + '</strong><span>' + num(allocation.lockedOdds || allocation.odds).toFixed(2) + ' / ' + money(parts.total) + ' / ' + htmlEscape(parts.compact) + '</span></div>' +
          '<span class="' + paymentStatusClass(window.AtlasCalculatorViewModel.allocationStatus(allocation)) + '">' + htmlEscape(window.AtlasCalculatorViewModel.allocationStatus(allocation)) + '</span>' +
          (event.isCurrent && !event.isMix ? '<button class="secondary-button compact-button" type="button" data-edit-current-allocation="' + htmlEscape(allocation.id) + '" data-account-id="' + htmlEscape(accountId) + '" data-event-id="' + htmlEscape(eventId) + '">Open Editor</button>' : '') +
        '</section>';
      }).join('') : '<div class="compact-empty-state"><span>No allocation in this cell.</span></div>');
    openCalculatorDialog('calculatorAllocationDetailsDialog');
  }

  function openCalculatorCellEditor(accountId, eventId, assignmentId) {
    var account = compactAccountById(accountId);
    var event = compactEventById(eventId);
    var cell = compactCellByIds(accountId, eventId);
    if (!account || !event) return;
    if (event.isMix || !event.isCurrent) {
      renderAllocationDetails(accountId, eventId);
      return;
    }
    if (!assignmentId && cell && cell.allocations.length > 1) {
      renderAllocationDetails(accountId, eventId);
      return;
    }
    var allocation = assignmentId ? currentAssignmentById(assignmentId) : allocationForCell(cell);
    calculatorCellContext = {
      accountId: accountId,
      eventId: eventId,
      assignmentId: allocation ? allocation.id : ''
    };
    var form = document.getElementById('calculatorCellEditorForm');
    var outcomeSelect = form.elements.outcomeId;
    outcomeSelect.innerHTML = '<option value="">Select Outcome</option>' + calculatorDraft.outcomes.filter(function (outcome) {
      return outcome.active !== false;
    }).map(function (outcome) {
      return '<option value="' + htmlEscape(outcome.id) + '">' + htmlEscape(outcome.name) + '</option>';
    }).join('');
    var stakeType = '';
    if (allocation) {
      if (num(allocation.cashAmount)) stakeType = 'Cash';
      else if (num(allocation.bonusAmount)) stakeType = 'Normal Bonus';
      else if (num(allocation.freeBetAmount)) stakeType = 'Free Bet';
    }
    outcomeSelect.value = allocation ? allocation.outcomeId || '' : '';
    form.elements.odds.value = allocation ? num(allocation.lockedOdds || allocation.odds) : '';
    form.elements.stake.value = allocation ? window.AtlasCalculatorViewModel.stakeParts(allocation).total : '';
    form.elements.stakeType.value = stakeType;
    form.elements.status.value = allocation ? window.AtlasCalculatorViewModel.allocationStatus(allocation) : 'Draft';
    form.elements.notes.value = allocation ? allocation.notes || '' : '';
    document.getElementById('calculatorCellContext').innerHTML =
      '<strong>' + htmlEscape(account.shortName) + '</strong><span>' + htmlEscape(account.platformName + ' / ' + event.header.shortName) + '</span><span>Spendable ' + money(account.availableCapital) + '</span>';
    setText('calculatorCellValidation', allocation && (allocation.locked || allocation.lockedAt) ? 'Locked values are immutable. Editing creates an auditable revision.' : 'No funds are reserved until the allocation is explicitly locked or approved.');
    openCalculatorDialog('calculatorAllocationDialog');
  }

  function cellEditorCandidate() {
    var form = document.getElementById('calculatorCellEditorForm');
    var outcome = calculatorOutcomeById(form.elements.outcomeId.value);
    var stakeType = form.elements.stakeType.value;
    var stake = num(form.elements.stake.value);
    return {
      id: calculatorCellContext.assignmentId || uid('asgn'),
      outcomeId: outcome ? outcome.id : '',
      platformAccountId: calculatorCellContext.accountId,
      cashAmount: stakeType === 'Cash' ? stake : 0,
      bonusAmount: stakeType === 'Normal Bonus' ? stake : 0,
      freeBetAmount: stakeType === 'Free Bet' ? stake : 0,
      requiredTurnover: outcome ? num(outcome.requiredTurnover) : 0,
      lockedOdds: num(form.elements.odds.value),
      odds: num(form.elements.odds.value),
      notes: form.elements.notes.value,
      status: 'Draft'
    };
  }

  function syncOutcomeStakeFromAssignments(outcomeId) {
    var outcome = calculatorOutcomeById(outcomeId);
    if (!outcome) return;
    outcome.plannedStake = sum(assignmentRowsForOutcome(outcomeId).filter(function (row) {
      return row.status !== 'Cancelled' && row.status !== 'Superseded';
    }), function (row) {
      return num(row.cashAmount) + num(row.bonusAmount) + num(row.freeBetAmount);
    });
  }

  function auditCalculatorCell(action, assignment, reason) {
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: action,
      entityType: 'CalculatorAllocation',
      entityId: assignment.id,
      newValue: clone(assignment),
      reason: reason || ''
    }));
    calculatorSessionDraft.history.push(sessionHistory(action, reason || assignment.id));
  }

  function clearCalculatorCellAllocation() {
    if (!calculatorCellContext || !calculatorCellContext.assignmentId) {
      closeCalculatorDialog(document.getElementById('calculatorAllocationDialog'));
      return;
    }
    var existing = currentAssignmentById(calculatorCellContext.assignmentId);
    if (!existing) return;
    if (existing.locked || existing.lockedAt) {
      var reason = document.getElementById('calculatorCellEditorForm').elements.notes.value || '';
      if (!reason) {
        setText('calculatorCellValidation', 'Enter a cancellation reason in Notes before clearing a locked allocation.');
        return;
      }
      existing.status = 'Cancelled';
      existing.cancelledAt = nowIso();
      existing.cancelledBy = currentUser ? currentUser.id : '';
      existing.cancellationReason = reason;
      auditCalculatorCell('Locked allocation cancelled', existing, reason);
    } else {
      calculatorAssignments[existing.outcomeId] = assignmentRowsForOutcome(existing.outcomeId).filter(function (row) { return row.id !== existing.id; });
      auditCalculatorCell('Draft allocation cleared', existing, 'Draft cleared before lock');
    }
    syncOutcomeStakeFromAssignments(existing.outcomeId);
    calculatorResult = calculateDraft();
    saveState();
    closeCalculatorDialog(document.getElementById('calculatorAllocationDialog'));
    renderCalculator();
  }

  function applyCalculatorCellEditor(action) {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    if (!calculatorCellContext || calculatorCellContext.eventId !== activeCalculatorEventId) {
      window.alert('Historical Event allocations are immutable. Open the active Event to create a new allocation.');
      return;
    }
    var candidate = cellEditorCandidate();
    var outcome = calculatorOutcomeById(candidate.outcomeId);
    var form = document.getElementById('calculatorCellEditorForm');
    var errors = [];
    if (!outcome) errors.push('Select an Outcome.');
    if (!form.elements.stakeType.value) errors.push('Select a Stake Type.');
    if (candidate.lockedOdds <= 1) errors.push('Odds must be above 1.00.');
    if (window.AtlasCalculatorViewModel.stakeParts(candidate).total <= 0) errors.push('Stake must be positive.');
    if (errors.length) {
      setText('calculatorCellValidation', errors.join(' '));
      return;
    }
    var evaluation = assignmentEligibility(candidate);
    if ((action === 'lock' || action === 'execute') && evaluation && evaluation.errors.length) {
      setText('calculatorCellValidation', evaluation.errors.join(' '));
      return;
    }
    var existing = calculatorCellContext.assignmentId ? currentAssignmentById(calculatorCellContext.assignmentId) : null;
    var reason = '';
    if (existing && (existing.locked || existing.lockedAt)) {
      reason = form.elements.notes.value || '';
      if (!reason) {
        setText('calculatorCellValidation', 'Enter a revision reason in Notes. The locked allocation has not been changed.');
        return;
      }
      existing.status = 'Superseded';
      existing.supersededAt = nowIso();
      existing.supersededBy = currentUser ? currentUser.id : '';
      candidate.id = uid('asgn');
      candidate.revisionOf = existing.id;
      candidate.previousLockedSnapshot = clone(existing);
      candidate.revisionReason = reason;
    } else if (existing) {
      candidate.id = existing.id;
      calculatorAssignments[existing.outcomeId] = assignmentRowsForOutcome(existing.outcomeId).filter(function (row) { return row.id !== existing.id; });
    }
    if (action === 'lock' || action === 'execute') {
      candidate.locked = true;
      candidate.lockedAt = nowIso();
      candidate.lockedBy = currentUser ? currentUser.id : '';
      candidate.status = 'Locked';
    }
    candidate.warnings = evaluation ? evaluation.errors.concat(evaluation.reviews || []) : [];
    assignmentRowsForOutcome(candidate.outcomeId).push(candidate);
    outcome.odds = candidate.lockedOdds;
    syncOutcomeStakeFromAssignments(candidate.outcomeId);
    calculatorDraft.mode = 'Manual Stakes';
    var setup = document.getElementById('calculatorSetupForm');
    if (setup && setup.elements.mode) setup.elements.mode.value = 'Manual Stakes';
    calculatorResult = calculateDraft();
    auditCalculatorCell(reason ? 'Locked allocation revised' : (candidate.locked ? 'Allocation locked' : 'Draft allocation applied'), candidate, reason);
    activeCalculatorSessionId = '';
    saveState();
    closeCalculatorDialog(document.getElementById('calculatorAllocationDialog'));
    if (action === 'execute') {
      calculatorLayout.view = 'results';
      saveCalculatorLayout();
      window.alert('The allocation is locked. Save the Operation, then confirm its executed stake in Results so settlement uses the existing Atlas execution workflow.');
    }
    renderCalculator();
  }

  function removeSessionAccount(accountId) {
    var used = sessionEventAssignments(true).some(function (row) { return row.platformAccountId === accountId; }) ||
      (calculatorSessionDraft.mixTickets || []).some(function (mix) {
        return mix.platformAccountId === accountId || (mix.hedges || []).some(function (hedge) { return hedge.platformAccountId === accountId; });
      });
    if (used) {
      window.alert('This Account has allocations in the Session and cannot be removed.');
      return;
    }
    var entry = poolEntryByAccountId(accountId);
    calculatorSessionDraft.accountPool = sessionPoolEntries().filter(function (item) { return item.platformAccountId !== accountId; });
    if (!calculatorSessionDraft.accountPool.length) calculatorSessionDraft.clientId = '';
    calculatorSessionDraft.history.push(sessionHistory('Unused Account removed from Session', platformAccountLabel(byId(state.userPlatforms, accountId))));
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: 'Unused Calculator Session Account removed',
      entityType: 'CalculatorSession',
      entityId: calculatorSessionDraft.id,
      previousValue: entry
    }));
    saveState();
    render();
  }

  function activateCalculatorView(view) {
    calculatorLayout.view = ['allocation', 'balancing', 'turnover', 'results'].indexOf(view) !== -1 ? view : 'allocation';
    saveCalculatorLayout();
    renderCompactCalculator();
  }

  function navigateCompactWarning(index) {
    var warning = compactCalculatorModel && compactCalculatorModel.warnings[index];
    if (!warning) return;
    activateCalculatorView('allocation');
    if (warning.accountId && warning.eventId) {
      calculatorLayout.selectedAccountId = warning.accountId;
      calculatorLayout.selectedEventId = warning.eventId;
      saveCalculatorLayout();
      renderCompactCalculator();
      var target = document.querySelector('[data-open-cell][data-account-id="' + warning.accountId + '"][data-event-id="' + warning.eventId + '"]');
      if (target) {
        target.classList.add('is-warning-target');
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        target.focus();
      }
      renderAllocationDetails(warning.accountId, warning.eventId);
    } else if (warning.accountId) {
      renderAccountPreview(warning.accountId);
    } else if (warning.eventId) {
      renderEventInfo(warning.eventId);
    } else {
      openCalculatorDialog('calculatorMathDetailsDialog');
    }
  }

  function renderCalculatorResult() {
    var resultBody = document.getElementById('calculatorResultBody');
    var scenarioBody = document.getElementById('calculatorScenarioBody');
    var warnings = document.getElementById('calculatorWarnings');
    if (!resultBody || !scenarioBody || !warnings) return;
    clear(resultBody);
    clear(scenarioBody);
    clear(warnings);
    if (!calculatorResult) {
      setText('calculatorSummaryMeta', 'Ready');
      setText('calculatorResultMeta', '0 rows');
      setText('calculatorScenarioMeta', '0 scenarios');
      renderMiniList('calculatorSummary', [
        { label: 'Calculator capital', value: money(calculatorDraft.totalCapital) },
        { label: 'Mode', value: calculatorDraft.mode },
        { label: 'Market type', value: calculatorDraft.marketType }
      ], function (row) {
        return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(row.value) + '</strong>';
      });
      return;
    }
    setText('calculatorSummaryMeta', 'Calculated');
    setText('calculatorResultMeta', calculatorResult.outcomeRows.length + ' outcomes');
    setText('calculatorScenarioMeta', calculatorResult.scenarios.length + ' scenarios');
    var remainingCapital = Math.max(0, num(calculatorDraft.totalCapital) - num(calculatorResult.totalStake));
    renderMiniList('calculatorSummary', [
      { label: 'Total capital used', value: money(calculatorResult.totalStake) },
      { label: 'Minimum return', value: money(Math.min.apply(Math, calculatorResult.scenarios.map(function (item) { return item.grossReturn; }))) },
      { label: 'Maximum return', value: money(Math.max.apply(Math, calculatorResult.scenarios.map(function (item) { return item.grossReturn; }))) },
      { label: 'Total planned stake', value: money(calculatorResult.totalStake) },
      { label: 'Worst scenario', value: money(calculatorResult.worstProfit) },
      { label: 'Best scenario', value: money(calculatorResult.bestProfit) },
      { label: 'Outcome spread', value: money(calculatorResult.spread) },
      { label: 'Remaining capital', value: money(remainingCapital) }
    ], function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(row.value) + '</strong>';
    });
    calculatorResult.outcomeRows.forEach(function (row, index) {
      var scenario = calculatorResult.scenarios[index] || {};
      var roi = row.stake ? ((num(row.stake * row.odds) - calculatorResult.totalStake) / calculatorResult.totalStake) * 100 : 0;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(row.name) + '</td>' +
        '<td class="num">' + htmlEscape(String(row.odds)) + '</td>' +
        '<td class="num">' + money(row.stake) + '</td>' +
        '<td class="num">' + money(row.stake * row.odds) + '</td>' +
        '<td class="num ' + (num(scenario.profitLoss) >= 0 ? 'positive' : 'negative') + '">' + money(scenario.profitLoss || ((row.stake * row.odds) - calculatorResult.totalStake)) + '</td>' +
        '<td class="num">' + percent(roi) + '</td>';
      resultBody.appendChild(tr);
    });
    calculatorResult.scenarios.forEach(function (scenario) {
      var roi = calculatorResult.totalStake ? (scenario.profitLoss / calculatorResult.totalStake) * 100 : 0;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(scenario.name) + '</td>' +
        '<td class="num">' + money(scenario.grossReturn) + '</td>' +
        '<td class="num ' + (scenario.profitLoss >= 0 ? 'positive' : 'negative') + '">' + money(scenario.profitLoss) + '</td>' +
        '<td class="num">' + percent(roi) + '</td>';
      scenarioBody.appendChild(tr);
    });
    if (!calculatorResult.warnings.length) {
      var ok = document.createElement('div');
      ok.className = 'risk-item risk-ok';
      ok.innerHTML = '<strong>Calculator checks</strong><span>No calculator warnings.</span>';
      warnings.appendChild(ok);
    }
    calculatorResult.warnings.forEach(function (message) {
      var item = document.createElement('div');
      item.className = 'risk-item risk-warn';
      item.innerHTML = '<strong>Calculator warning</strong><span>' + htmlEscape(message) + '</span>';
      warnings.appendChild(item);
    });
  }

  function renderEligibilityMini(evaluation) {
    if (!evaluation) return '<span class="status-badge">Select account</span>';
    return '<span class="' + paymentStatusClass(evaluation.status) + '">' + htmlEscape(evaluation.status) + '</span>' +
      '<span class="assignment-reason">' + htmlEscape(evaluation.reasons[0] || 'Eligible by current platform rules.') + '</span>';
  }

  function renderAccountSelectOptions(selectedId, platformId) {
    var accounts = sortedPlatformAccountsForCalculator(platformId);
    var html = '<option value="">Choose account</option>';
    accounts.forEach(function (account) {
      html += '<option value="' + htmlEscape(account.id) + '"' + (account.id === selectedId ? ' selected' : '') + '>' + htmlEscape(platformAccountOptionLabel(account)) + '</option>';
    });
    return html;
  }

  function renderCalculatorAssignments() {
    var holder = document.getElementById('calculatorAssignmentList');
    if (!holder) return;
    clear(holder);
    if (!calculatorResult) {
      holder.innerHTML = '<div class="empty-state">Calculate stakes first. Account assignment appears here after the mathematical result is visible.</div>';
      return;
    }
    if (!sessionPoolAccountIds().length) {
      holder.innerHTML = '<div class="empty-state">Add platform accounts to the Session Account Pool before assigning stakes. Every event in this session will reuse that same pool.</div>';
      return;
    }
    calculatorResult.outcomeRows.forEach(function (row) {
      var outcome = calculatorOutcomeById(row.outcomeId);
      var assignments = assignmentRowsForOutcome(row.outcomeId);
      var remaining = remainingAssignmentStake(row.outcomeId);
      var card = document.createElement('article');
      card.className = 'assignment-card';
      var assignmentHtml = assignments.map(function (assignment, assignmentIndex) {
        var account = byId(state.userPlatforms, assignment.platformAccountId);
        var evaluation = assignmentEligibility(assignment);
        var turnover = account ? workflow().turnoverSummary(account, activePlatformRule(account.platformId)) : null;
        var balances = account ? workflow().platformAvailableBalances(state, account) : null;
        return '<div class="assignment-row">' +
          '<select data-assignment-field="platformAccountId" data-outcome-id="' + htmlEscape(row.outcomeId) + '" data-assignment-index="' + assignmentIndex + '">' + renderAccountSelectOptions(assignment.platformAccountId, account ? account.platformId : '') + '</select>' +
          '<input type="number" min="0" step="0.01" value="' + htmlEscape(assignment.cashAmount || 0) + '" data-assignment-field="cashAmount" data-outcome-id="' + htmlEscape(row.outcomeId) + '" data-assignment-index="' + assignmentIndex + '" title="Cash amount">' +
          '<input type="number" min="0" step="0.01" value="' + htmlEscape(assignment.bonusAmount || 0) + '" data-assignment-field="bonusAmount" data-outcome-id="' + htmlEscape(row.outcomeId) + '" data-assignment-index="' + assignmentIndex + '" title="Bonus amount">' +
          '<input type="number" min="0" step="0.01" value="' + htmlEscape(assignment.freeBetAmount || 0) + '" data-assignment-field="freeBetAmount" data-outcome-id="' + htmlEscape(row.outcomeId) + '" data-assignment-index="' + assignmentIndex + '" title="Free Bet amount">' +
          '<button class="row-action" type="button" title="Remove assignment" data-remove-assignment="' + htmlEscape(row.outcomeId) + '" data-assignment-index="' + assignmentIndex + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v8M15 10v8M7 7l1 14h8l1-14"></path></svg></button>' +
          '<div class="assignment-status">' + renderEligibilityMini(evaluation) + '</div>' +
          '<div class="assignment-facts">' +
            '<span>User: <strong>' + htmlEscape(account ? userName(account.userId) : '-') + '</strong></span>' +
            '<span>Platform: <strong>' + htmlEscape(account ? platformName(account.platformId) : '-') + '</strong></span>' +
            '<span>Available: <strong>' + (balances ? money(balances.availableTotal) : '-') + '</strong></span>' +
            '<span>Bonus: <strong>' + (balances ? money(balances.bonusBalance) : '-') + '</strong></span>' +
            '<span>Remaining turnover: <strong>' + (turnover ? money(turnover.remainingTurnoverAmount) : '-') + '</strong></span>' +
          '</div>' +
        '</div>';
      }).join('');
      card.innerHTML =
        '<div class="assignment-head">' +
          '<div><h3>' + htmlEscape(row.name) + '</h3><span>Calculated stake ' + money(row.stake) + ' / remaining to assign ' + money(remaining) + '</span></div>' +
          '<button class="secondary-button compact-button" type="button" data-add-assignment="' + htmlEscape(row.outcomeId) + '">Add Account Split</button>' +
        '</div>' +
        (assignmentHtml || '<div class="empty-state">No platform account assigned yet.</div>') +
        '<details class="advanced-details"><summary>Recommended and unavailable accounts</summary><div class="eligibility-board compact-eligibility">' + renderAssignmentEligibilityGroups(row) + '</div></details>';
      holder.appendChild(card);
    });
  }

  function renderAssignmentEligibilityGroups(row) {
    var preview = workflow().eligibilityPreview(state, {
      eventName: calculatorDraft.eventName || 'Calculator Event',
      eventId: slug(calculatorDraft.eventName || 'EVENT', 'EVENT'),
      marketType: calculatorDraft.marketType === 'Two Outcome' ? 'Two Outcome' : 'Three Outcome',
      marketName: calculatorDraft.marketName,
      outcomeName: row.name,
      platformId: '',
      odds: row.odds,
      stake: row.stake,
      potentialPayout: row.stake * row.odds,
      requiredTurnoverAllocation: row.requiredTurnover,
      date: calculatorDraft.eventDate
    });
    var groupDefs = [
      { key: 'recommended', label: 'Recommended Accounts' },
      { key: 'eligible', label: 'Eligible Accounts' },
      { key: 'requiresReview', label: 'Requires Review' },
      { key: 'unavailable', label: 'Unavailable' }
    ];
    var poolIds = sessionPoolAccountIds();
    return groupDefs.map(function (group) {
      var rows = (preview.groups[group.key] || []).filter(function (evaluation) {
        return poolIds.length && poolIds.indexOf(evaluation.accountId) !== -1;
      }).slice(0, 4);
      return '<section><h4>' + htmlEscape(group.label) + '</h4>' + (rows.length ? rows.map(function (evaluation) {
        var account = byId(state.userPlatforms, evaluation.accountId);
        return '<div class="eligibility-mini-row"><span>' + htmlEscape(platformAccountLabel(account)) + '</span><strong>' + htmlEscape(evaluation.status) + '</strong></div>';
      }).join('') : '<div class="empty-state">No accounts</div>') + '</section>';
    }).join('');
  }

  function renderOperationPlan() {
    var body = document.getElementById('operationPlanBody');
    if (!body) return;
    clear(body);
    var rows = sessionEventAssignments(true);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="10" class="muted">Assign platform accounts to build the final plan.</td></tr>';
      return;
    }
    rows.forEach(function (assignment) {
      var account = byId(state.userPlatforms, assignment.platformAccountId);
      var stake = num(assignment.finalStake || (num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount)));
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(account ? clientName(account.clientId) : '') + '</td>' +
        '<td>' + htmlEscape(account ? userName(account.userId) : '') + '</td>' +
        '<td>' + htmlEscape(account ? platformName(account.platformId) : '') + '</td>' +
        '<td>' + htmlEscape(account ? platformAccountLabel(account) : '') + '</td>' +
        '<td>' + htmlEscape(assignment.eventName || calculatorEventName()) + '</td>' +
        '<td>' + htmlEscape(assignment.outcomeName || '') + '</td>' +
        '<td class="num">' + htmlEscape(String(assignment.odds || '')) + '</td>' +
        '<td class="num">' + money(assignment.cashAmount) + '</td>' +
        '<td class="num">' + money(assignment.bonusAmount) + '</td>' +
        '<td class="num">' + money(assignment.freeBetAmount) + '</td>' +
        '<td class="num">' + money(stake) + '</td>';
      body.appendChild(tr);
    });
  }

  function renderCalculatorBookmarks() {
    var holder = document.getElementById('calculatorBookmarkList');
    if (!holder) return;
    clear(holder);
    var bookmarks = state.accountBookmarks.filter(function (bookmark) {
      return byId(state.userPlatforms, bookmark.platformAccountId);
    });
    if (!bookmarks.length) {
      holder.innerHTML = '<div class="empty-state">No account bookmarks yet. Bookmark accounts from an assignment row after selecting them.</div>';
      return;
    }
    bookmarks.forEach(function (bookmark) {
      var account = byId(state.userPlatforms, bookmark.platformAccountId);
      var balances = workflow().platformAvailableBalances(state, account);
      var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
      var row = document.createElement('div');
      row.className = 'bookmark-row';
      row.innerHTML =
        '<div><strong>' + htmlEscape(platformAccountLabel(account)) + '</strong><span>' + htmlEscape(userName(account.userId)) + ' / ' + htmlEscape(platformName(account.platformId)) + '</span></div>' +
        '<div><span>Cash ' + money(balances.availableCash) + '</span><span>Bonus ' + money(balances.bonusBalance) + '</span><span>Turnover ' + money(turnover.remainingTurnoverAmount) + '</span></div>' +
        '<button class="row-action" type="button" title="Remove bookmark" data-remove-bookmark="' + htmlEscape(bookmark.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M9 7V5h6v2M9 10v8M15 10v8M7 7l1 14h8l1-14"></path></svg></button>';
      holder.appendChild(row);
    });
  }

  function activeCalculatorSession() {
    return byId(state.calculatorSessions, activeCalculatorSessionId) || state.calculatorSessions.slice().reverse().filter(function (item) {
      return item.status === 'Operation Saved' || item.status === 'Ready for Execution' || item.status === 'Executed' || item.status === 'Settled';
    })[0] || null;
  }

  function renderExecutionAndResults() {
    var execution = document.getElementById('executionControls');
    var results = document.getElementById('resultEntryControls');
    if (!execution || !results) return;
    clear(execution);
    clear(results);
    var session = activeCalculatorSession();
    if (!session) {
      setText('executionSummaryMeta', 'No saved operation selected');
      execution.innerHTML = '<div class="empty-state">Save an operation plan to record execution and results.</div>';
      return;
    }
    setText('executionSummaryMeta', session.status || 'Operation Saved');
    execution.innerHTML =
      '<div class="form-grid">' +
        '<label><span>Execution Status</span><select id="calculatorExecutionStatus"><option>Executed</option><option>Partially Executed</option><option>Failed</option><option>Cancelled</option></select></label>' +
        '<label><span>Execution Date</span><input id="calculatorExecutionDate" type="date" value="' + htmlEscape(todayString()) + '"></label>' +
        '<label><span>Executed Stake Override</span><input id="calculatorExecutedStake" type="number" min="0" step="0.01" placeholder="Blank uses planned stakes"></label>' +
        '<label class="full"><span>Execution Notes</span><input id="calculatorExecutionNotes" type="text"></label>' +
      '</div>' +
      '<button id="saveExecutionStatus" class="primary-button" type="button">Save Execution</button>';
    results.innerHTML =
      '<div class="form-grid">' +
        '<label><span>Actual Result</span><select id="calculatorActualResult"><option>Team 1 Win</option><option>Draw</option><option>Team 2 Win</option><option>Void</option><option>Cancelled</option></select></label>' +
        '<label><span>Result Date</span><input id="calculatorResultDate" type="date" value="' + htmlEscape(todayString()) + '"></label>' +
        '<label class="full"><span>Result Notes</span><input id="calculatorResultNotes" type="text"></label>' +
      '</div>' +
      '<button id="saveActualResult" class="primary-button" type="button">Complete Settlement</button>';
  }

  function sessionAssignments(session) {
    return (session && session.assignments) || [];
  }

  function resultFactorForAssignment(assignment, actualResult) {
    var key = assignment.marketKey || '';
    if (actualResult === 'Void' || actualResult === 'Cancelled') return 1;
    if (actualResult === 'Team 1 Win') return key === 'team1_win' || key === 'team1_dnb' ? num(assignment.odds) : 0;
    if (actualResult === 'Draw') {
      if (key === 'draw') return num(assignment.odds);
      if (key === 'team1_dnb' || key === 'team2_dnb') return 1;
      return 0;
    }
    if (actualResult === 'Team 2 Win') return key === 'team2_win' || key === 'team2_dnb' ? num(assignment.odds) : 0;
    return 0;
  }

  function buildFinalBalanceSummary(session) {
    var map = {};
    sessionAssignments(session).forEach(function (assignment) {
      var account = byId(state.userPlatforms, assignment.platformAccountId);
      if (!account) return;
      var key = account.id;
      if (!map[key]) {
        var balances = workflow().platformAvailableBalances(state, account);
        var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
        map[key] = {
          clientId: account.clientId,
          userId: account.userId,
          platformId: account.platformId,
          platformAccountId: account.id,
          openingCashBalance: assignment.openingCashBalance != null ? assignment.openingCashBalance : balances.cashBalance,
          openingBonusBalance: assignment.openingBonusBalance != null ? assignment.openingBonusBalance : balances.bonusBalance,
          platformFunding: num(assignment.manualFundingAdded),
          totalPlannedAllocation: 0,
          totalExecutedStake: 0,
          totalWinningReturn: 0,
          totalRefunds: 0,
          totalLosses: 0,
          bonusConverted: 0,
          completedTurnover: 0,
          remainingTurnover: turnover.remainingTurnoverAmount,
          endingCashBalance: 0,
          endingBonusBalance: balances.bonusBalance,
          availableForWithdrawal: 0,
          remainingInPlatform: 0,
          realizedProfitLoss: 0
        };
      }
      var row = map[key];
      row.totalPlannedAllocation += num(assignment.finalStake || assignment.plannedStake);
      row.totalExecutedStake += num(assignment.executedStake != null ? assignment.executedStake : assignment.finalStake);
      row.totalWinningReturn += num(assignment.payout);
      row.totalRefunds += num(assignment.refund);
      row.totalLosses += Math.max(0, num(assignment.executedStake != null ? assignment.executedStake : assignment.finalStake) - num(assignment.refund) - num(assignment.payout));
      row.completedTurnover += num(assignment.completedTurnover);
      row.realizedProfitLoss += num(assignment.profitLoss);
      row.endingCashBalance = row.openingCashBalance + row.platformFunding - row.totalExecutedStake + row.totalWinningReturn + row.totalRefunds;
      row.availableForWithdrawal = Math.max(0, row.endingCashBalance);
      row.remainingInPlatform = row.endingCashBalance + row.endingBonusBalance;
    });
    return Object.keys(map).map(function (key) { return map[key]; });
  }

  function saveCalculatorOperationPlan() {
    updateCalculatorSessionDraftFromForm();
    if (!calculatorResult && hasManualStakes()) {
      calculatorDraft.mode = 'Manual Stakes';
      calculatorResult = calculateDraft();
    }
    if (calculatorResult) lockCurrentEventIntoSession('Operation plan saved');
    var sessionMixes = clone(calculatorSessionDraft.mixTickets || []);
    if (!calculatorSessionEvents.length && !sessionMixes.length) {
      window.alert('Add and calculate at least one Event or save a Mix before saving an operation.');
      return;
    }
    var assignments = sessionEventAssignments(false);
    if (!assignments.length && !sessionMixes.length) {
      window.alert('Assign at least one pooled platform account or save a Mix before saving the operation.');
      return;
    }
    var operationAssignments = [];
    var errors = [];
    sessionPoolEntries().forEach(function (entry) {
      var accountRows = assignments.filter(function (row) { return row.platformAccountId === entry.platformAccountId; });
      var plannedCash = sum(accountRows, function (row) { return row.cashAmount; });
      var plannedBonus = sum(accountRows, function (row) { return row.bonusAmount; });
      var plannedFreeBet = sum(accountRows, function (row) { return row.freeBetAmount; });
      if (plannedCash > num(entry.openingCashBalance) + num(entry.manualFundingAdded) + 0.00001) {
        errors.push(platformAccountLabel(byId(state.userPlatforms, entry.platformAccountId)) + ': planned cash exceeds session pool cash balance.');
      }
      if (plannedBonus > num(entry.openingBonusBalance) + 0.00001) {
        errors.push(platformAccountLabel(byId(state.userPlatforms, entry.platformAccountId)) + ': planned bonus exceeds session pool bonus balance.');
      }
      if (plannedFreeBet > num(entry.openingFreeBetBalance) + 0.00001) {
        errors.push(platformAccountLabel(byId(state.userPlatforms, entry.platformAccountId)) + ': planned Free Bet exceeds session pool Free Bet balance.');
      }
    });
    assignments.forEach(function (assignment) {
      var account = byId(state.userPlatforms, assignment.platformAccountId);
      if (!account) return;
      if (!poolEntryByAccountId(account.id)) {
        errors.push(platformAccountLabel(account) + ': account is not part of the active Session Account Pool.');
        return;
      }
      var finalStake = num(assignment.finalStake || (num(assignment.cashAmount) + num(assignment.bonusAmount) + num(assignment.freeBetAmount)));
      var freeBetValue = window.AtlasMixService.singleFreeBet(num(assignment.freeBetAmount), assignment.odds);
      var data = {
        eventName: assignment.eventName || calculatorEventName(),
        eventId: assignment.eventId || slug(assignment.eventName || 'EVENT', 'EVENT'),
        marketType: assignment.marketType === 'Two Outcome' ? 'Two Outcome' : 'Three Outcome',
        marketName: assignment.marketName || calculatorDraft.marketName,
        outcomeName: assignment.outcomeName,
        platformId: account.platformId,
        platformAccountId: account.id,
        odds: assignment.odds,
        stake: finalStake,
        potentialPayout: (num(assignment.cashAmount) + num(assignment.bonusAmount)) * num(assignment.odds) + freeBetValue.truePotentialWin,
        cashAmount: num(assignment.cashAmount),
        bonusAmount: num(assignment.bonusAmount),
        freeBetAmount: num(assignment.freeBetAmount),
        requiredTurnoverAllocation: num(assignment.requiredTurnover),
        ownerOverride: false,
        overrideReason: ''
      };
      var validation = workflow().validateAllocation(state, data, currentActor());
      if (validation.errors.length) errors = errors.concat(validation.errors.map(function (message) {
        return assignment.outcomeName + ' / ' + platformAccountLabel(account) + ': ' + message;
      }));
      var balances = workflow().platformAvailableBalances(state, account);
      var turnover = workflow().turnoverSummary(account, activePlatformRule(account.platformId));
      var poolEntry = poolEntryByAccountId(account.id);
      operationAssignments.push({
        id: uid('opbet'),
        eventId: assignment.eventId,
        outcomeId: assignment.outcomeId,
        outcomeName: assignment.outcomeName,
        marketKey: assignment.marketKey,
        marketName: assignment.marketName || calculatorDraft.marketName,
        eventName: assignment.eventName || calculatorEventName(),
        clientId: account.clientId,
        userId: account.userId,
        platformId: account.platformId,
        platformAccountId: account.id,
        odds: num(assignment.odds),
        plannedStake: finalStake,
        executedStake: 0,
        difference: finalStake,
        cashAmount: num(assignment.cashAmount),
        bonusAmount: num(assignment.bonusAmount),
        freeBetAmount: num(assignment.freeBetAmount),
        originalOdds: num(assignment.odds),
        effectiveFreeBetOdds: freeBetValue.effectiveFreeBetOdds,
        freeBetTruePotentialWin: freeBetValue.truePotentialWin,
        finalStake: finalStake,
        status: 'Planned',
        result: '',
        payout: 0,
        refund: 0,
        profitLoss: 0,
        openingCashBalance: poolEntry ? num(poolEntry.openingCashBalance) : balances.cashBalance,
        openingBonusBalance: poolEntry ? num(poolEntry.openingBonusBalance) : balances.bonusBalance,
        openingFreeBetBalance: poolEntry ? num(poolEntry.openingFreeBetBalance) : balances.freeBetBalance,
        manualFundingAdded: poolEntry ? num(poolEntry.manualFundingAdded) : 0,
        openingTurnoverRequirement: poolEntry ? num(poolEntry.remainingTurnover) : turnover.remainingTurnoverAmount,
        completedTurnover: 0,
        remainingTurnover: poolEntry ? num(poolEntry.remainingTurnover) : turnover.remainingTurnoverAmount,
        ruleSnapshot: validation.evaluation.rule
      });
    });
    if (errors.length) {
      window.alert(errors.join('\n'));
      return;
    }
      var session = {
        id: uid('calc'),
        sessionName: calculatorSessionName(),
        clientId: calculatorSessionDraft.clientId,
        targetReturnPercentage: calculatorSessionDraft.targetReturnPercentage,
        objective: calculatorSessionDraft.objective,
        description: calculatorSessionDraft.description,
        eventName: calculatorSessionName(),
      startDate: calculatorSessionDraft.startDate,
      expectedEndDate: calculatorSessionDraft.expectedEndDate,
      expectedRolloverDate: calculatorSessionDraft.expectedRolloverDate,
      eventDate: calculatorSessionDraft.startDate,
      marketType: calculatorSessionEvents.map(function (item) { return item.marketType; }).filter(Boolean).join(', '),
      marketName: 'Session Account Pool Operation',
      settlementPeriod: calculatorDraft.settlementPeriod,
      notes: calculatorSessionDraft.notes,
      input: clone(calculatorSessionDraft),
      result: clone((calculatorSessionEvents[0] || {}).result || calculatorResult),
      accountPool: clone(sessionPoolEntries()),
      events: clone(calculatorSessionEvents),
      mixTickets: sessionMixes,
      history: clone(calculatorSessionDraft.history.concat([sessionHistory('Session operation saved', calculatorSessionName())])),
      assignments: operationAssignments,
      executionRecords: [],
      resultRecords: [],
      finalBalanceSummary: null,
      status: 'Ready for Execution',
      createdBy: currentUser ? currentUser.id : '',
      createdAt: nowIso()
    };
    state.calculatorSessions.push(session);
    sessionMixes.forEach(function (mix) {
      state.mixTickets = replaceMix(state.mixTickets, mix);
    });
    activeCalculatorSessionId = session.id;
    operationAssignments.forEach(function (assignment) {
      var account = byId(state.userPlatforms, assignment.platformAccountId);
      var pack = workflow().buildOperationalSession({
        eventName: assignment.eventName,
        eventId: slug(assignment.eventName, 'EVENT'),
        marketType: assignment.marketType === 'Two Outcome' ? 'Two Outcome' : 'Three Outcome',
        marketName: assignment.marketName,
        outcomeName: assignment.outcomeName,
        odds: assignment.odds,
        stake: assignment.finalStake,
        potentialPayout: (num(assignment.cashAmount) + num(assignment.bonusAmount)) * assignment.odds + num(assignment.freeBetTruePotentialWin),
        cashAmount: assignment.cashAmount,
        bonusAmount: assignment.bonusAmount,
        freeBetAmount: assignment.freeBetAmount,
        originalOdds: assignment.originalOdds,
        effectiveFreeBetOdds: assignment.effectiveFreeBetOdds,
        requiredTurnoverAllocation: assignment.openingTurnoverRequirement,
        notes: 'Saved from Atlas Operations Calculator.'
      }, account, { rule: assignment.ruleSnapshot, turnover: workflow().turnoverSummary(account, activePlatformRule(account.platformId)), balances: workflow().platformAvailableBalances(state, account) }, currentActor());
      state.allocations.push(pack.allocation);
      state.operationalSessions.push(pack.session);
    });
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: 'Calculator operation saved',
      entityType: 'CalculatorSession',
      entityId: session.id,
      newValue: session
    }));
    saveState();
    render();
  }

  function saveExecutionForActiveSession() {
    var session = activeCalculatorSession();
    if (!session) return;
    var status = (document.getElementById('calculatorExecutionStatus') || {}).value || 'Executed';
    var date = (document.getElementById('calculatorExecutionDate') || {}).value || todayString();
    var override = num((document.getElementById('calculatorExecutedStake') || {}).value);
    var notes = (document.getElementById('calculatorExecutionNotes') || {}).value || '';
    session.assignments = sessionAssignments(session).map(function (assignment) {
      var planned = num(assignment.plannedStake);
      var executed = override > 0 ? Math.min(override, planned) : (status === 'Failed' || status === 'Cancelled' ? 0 : planned);
      assignment.executionStatus = status;
      assignment.executionDate = date;
      assignment.executedStake = executed;
      assignment.difference = planned - executed;
      assignment.status = status;
      assignment.executionNotes = notes;
      return assignment;
    });
    session.executionRecords.push({ id: uid('exec'), status: status, executionDate: date, notes: notes, createdBy: currentUser ? currentUser.id : '', createdAt: nowIso() });
    session.status = status;
    activeCalculatorSessionId = session.id;
    saveState();
    render();
  }

  function settleActiveCalculatorSession() {
    var session = activeCalculatorSession();
    if (!session) return;
    var actualResult = (document.getElementById('calculatorActualResult') || {}).value || 'Void';
    var resultDate = (document.getElementById('calculatorResultDate') || {}).value || todayString();
    var notes = (document.getElementById('calculatorResultNotes') || {}).value || '';
    session.assignments = sessionAssignments(session).map(function (assignment) {
      var executed = num(assignment.executedStake != null ? assignment.executedStake : assignment.plannedStake);
      var factor = resultFactorForAssignment(assignment, actualResult);
      var executionRatio = num(assignment.plannedStake) ? executed / num(assignment.plannedStake) : 0;
      var executedCash = num(assignment.cashAmount) * executionRatio;
      var executedBonus = num(assignment.bonusAmount) * executionRatio;
      var executedFreeBet = num(assignment.freeBetAmount) * executionRatio;
      var payout = factor > 1 ? (executedCash + executedBonus) * factor + executedFreeBet * Math.max(0, factor - 1) : 0;
      var refund = factor === 1 ? executedCash + executedBonus : 0;
      var freeBetRefunded = factor === 1 ? executedFreeBet : 0;
      var profitLoss = payout + refund - executed;
      assignment.result = actualResult;
      assignment.resultDate = resultDate;
      assignment.payout = payout;
      assignment.refund = refund;
      assignment.freeBetRefunded = freeBetRefunded;
      assignment.originalOdds = num(assignment.originalOdds || assignment.odds);
      assignment.effectiveFreeBetOdds = Math.max(0, assignment.originalOdds - 1);
      assignment.profitLoss = profitLoss;
      assignment.completedTurnover = Math.min(executed, num(assignment.remainingTurnover || assignment.openingTurnoverRequirement));
      assignment.remainingTurnover = Math.max(0, num(assignment.openingTurnoverRequirement) - assignment.completedTurnover);
      assignment.status = 'Settled';
      return assignment;
    });
    session.resultRecords.push({ id: uid('res'), result: actualResult, resultDate: resultDate, notes: notes, createdBy: currentUser ? currentUser.id : '', createdAt: nowIso() });
    session.status = 'Settled';
    session.finalBalanceSummary = buildFinalBalanceSummary(session);
    activeCalculatorSessionId = session.id;
    saveState();
    render();
  }

  function recordQuickFunding(event) {
    event.preventDefault();
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    var f = event.currentTarget.elements;
    var sourceAccount = byId(state.accounts, f.sourceAccountId.value);
    var platformAccount = byId(state.userPlatforms, f.platformAccountId.value);
    if (!sourceAccount || !platformAccount) {
      window.alert('Select a source wallet/bank and platform account.');
      return;
    }
    var errors = workflow().validatePlatformFunding(state, {
      clientId: platformAccount.clientId,
      userId: platformAccount.userId,
      sourceAccountId: sourceAccount.id,
      platformAccountId: platformAccount.id,
      amount: num(f.amount.value)
    });
    if (errors.length) {
      window.alert(errors.join('\n'));
      return;
    }
    var created = workflow().createPlatformFunding(state, {
      date: todayString(),
      clientId: platformAccount.clientId,
      userId: platformAccount.userId,
      sourceType: sourceAccount.type,
      sourceAccountId: sourceAccount.id,
      platformAccountId: platformAccount.id,
      amount: num(f.amount.value),
      currency: 'USD',
      notes: f.notes.value || 'Quick calculator funding'
    }, currentActor());
    created.funding.calculatorSessionId = calculatorSessionDraft.id;
    state.platformFundings.push(created.funding);
    state.notifications.push(created.notification);
    state.auditLogs.push(created.audit);
    state.userPlatforms = state.userPlatforms.map(function (item) {
      if (item.id !== platformAccount.id) return item;
      var next = clone(item);
      next.cashBalance = num(next.cashBalance) + num(f.amount.value);
      next.fundingAmount = num(next.fundingAmount) + num(f.amount.value);
      var turnover = workflow().turnoverSummary(next, activePlatformRule(next.platformId));
      next.requiredTurnoverAmount = turnover.requiredTurnoverAmount;
      next.remainingTurnoverAmount = turnover.remainingTurnoverAmount;
      return next;
    });
    var poolEntry = poolEntryByAccountId(platformAccount.id);
    if (poolEntry) {
      poolEntry.manualFundingAdded = num(poolEntry.manualFundingAdded) + num(f.amount.value);
      calculatorSessionDraft.history.push(sessionHistory('Manual funding added during session', platformAccountLabel(platformAccount) + ' / ' + money(f.amount.value)));
    }
    event.currentTarget.reset();
    saveState();
    render();
  }

  function toggleAccountBookmark(platformAccountId) {
    if (!platformAccountId) return;
    var existing = state.accountBookmarks.filter(function (item) { return item.platformAccountId === platformAccountId; })[0];
    if (existing) {
      state.accountBookmarks = state.accountBookmarks.filter(function (item) { return item.id !== existing.id; });
    } else {
      state.accountBookmarks.push({ id: uid('fav'), platformAccountId: platformAccountId, createdBy: currentUser ? currentUser.id : '', createdAt: nowIso() });
    }
    saveState();
    renderCalculator();
  }

  function sessionDateForExport(session) {
    return String(session.startDate || session.eventDate || session.createdAt || '').slice(0, 10);
  }

  function calculatorExportSessionsFromFilters() {
    var filters = document.getElementById('operationExportFilters');
    var active = activeCalculatorSession();
    if (!filters || filters.elements.scope.value === 'current') return active ? [active] : [];
    var from = filters.elements.dateFrom.value;
    var to = filters.elements.dateTo.value;
    var clientId = filters.elements.exportClientId.value;
    var userId = filters.elements.exportUserId.value;
    var platformId = filters.elements.exportPlatformId.value;
    var platformAccountId = filters.elements.exportPlatformAccountId.value;
    return visibleCalculatorSessions().filter(function (session) {
      var sessionDate = sessionDateForExport(session);
      if (from && (!sessionDate || sessionDate < from)) return false;
      if (to && (!sessionDate || sessionDate > to)) return false;
      var rows = sessionAssignments(session);
      var mixes = session.mixTickets || [];
      if (clientId && !rows.some(function (row) { return row.clientId === clientId; }) && !mixes.some(function (mix) { return mix.clientId === clientId; })) return false;
      if (userId && !rows.some(function (row) { return row.userId === userId; }) && !mixes.some(function (mix) { return mix.userId === userId; })) return false;
      if (platformId && !rows.some(function (row) { return row.platformId === platformId; }) && !mixes.some(function (mix) { return mix.platformId === platformId; })) return false;
      if (platformAccountId && !rows.some(function (row) { return row.platformAccountId === platformAccountId; }) && !mixes.some(function (mix) { return mix.platformAccountId === platformAccountId; })) return false;
      return true;
    });
  }

  function sessionTotalsForExport(session) {
    var assignments = sessionAssignments(session);
    var executedStake = sum(assignments, function (row) { return row.executedStake; });
    var totalReturned = sum(assignments, function (row) { return num(row.payout) + num(row.refund); });
    var profitLoss = sum(assignments, function (row) { return row.profitLoss; });
    return {
      totalStake: sum(assignments, function (row) { return row.plannedStake; }),
      executedStake: executedStake,
      cashUsed: sum(assignments, function (row) { return row.cashAmount; }),
      bonusUsed: sum(assignments, function (row) { return row.bonusAmount; }),
      freeBetUsed: sum(assignments, function (row) { return row.freeBetAmount; }),
      totalReturned: totalReturned,
      profitLoss: profitLoss,
      roi: executedStake ? profitLoss / executedStake : 0,
      turnoverCompleted: sum(assignments, function (row) { return row.completedTurnover; }),
      remainingTurnover: sum(assignments, function (row) { return row.remainingTurnover; })
    };
  }

  function pdfHistoryDetail(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  function calculatorPdfSession(session) {
    var assignments = sessionAssignments(session);
    var accountIds = {};
    assignments.forEach(function (row) { accountIds[row.platformAccountId] = true; });
    (session.accountPool || []).forEach(function (entry) { accountIds[entry.platformAccountId] = true; });
    var scenarios = [];
    (session.events || []).forEach(function (event) {
      var result = event.result || {};
      (result.scenarios || []).forEach(function (scenario) {
        var totalStake = num(result.totalStake);
        var ratio = totalStake ? num(scenario.grossReturn) / totalStake : 0;
        scenarios.push({
          event: event.eventName,
          market: event.marketName || ((event.input || {}).marketName) || '',
          outcome: scenario.name,
          expectedReturn: num(scenario.grossReturn),
          grossReturnRatio: ratio,
          status: ratio >= 0.97 && ratio <= 0.98 ? 'Within 97%-98%' : (ratio < 0.97 ? 'Below target' : 'Above target')
        });
      });
    });
    if (!scenarios.length) {
      ((session.result || {}).scenarios || []).forEach(function (scenario) {
        var totalStake = num((session.result || {}).totalStake);
        var ratio = totalStake ? num(scenario.grossReturn) / totalStake : 0;
        scenarios.push({
          event: session.eventName,
          market: session.marketName || '',
          outcome: scenario.name,
          expectedReturn: num(scenario.grossReturn),
          grossReturnRatio: ratio,
          status: ratio >= 0.97 && ratio <= 0.98 ? 'Within 97%-98%' : (ratio < 0.97 ? 'Below target' : 'Above target')
        });
      });
    }
    var history = (session.history || []).map(function (row) {
      return {
        date: row.createdAt || '',
        action: row.action || '',
        actor: authUserName(row.userId) || row.userId || row.role || '',
        detail: pdfHistoryDetail(row.detail)
      };
    });
    (session.executionRecords || []).forEach(function (row) {
      history.push({
        date: row.createdAt || row.executionDate || '',
        action: 'Execution ' + (row.status || 'recorded'),
        actor: authUserName(row.createdBy) || row.createdBy || '',
        detail: row.notes || ''
      });
    });
    (session.resultRecords || []).forEach(function (row) {
      history.push({
        date: row.createdAt || row.resultDate || '',
        action: 'Result recorded: ' + (row.result || ''),
        actor: authUserName(row.createdBy) || row.createdBy || '',
        detail: row.notes || ''
      });
    });
    history.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    return {
      id: session.id,
      name: session.sessionName || session.eventName,
      client: clientName(session.clientId),
      status: session.status,
      startDate: sessionDateForExport(session),
      targetReturnPercentage: num(session.targetReturnPercentage),
      description: session.description || '',
      notes: session.notes || '',
      totals: sessionTotalsForExport(session),
      accountPool: (session.accountPool || []).map(function (entry) {
        var account = byId(state.userPlatforms, entry.platformAccountId);
        return {
          user: account ? userName(account.userId) : entry.userId || '',
          platform: account ? platformName(account.platformId) : entry.platformId || '',
          account: account ? platformAccountLabel(account) : entry.platformAccountId,
          openingCash: num(entry.openingCashBalance),
          openingBonus: num(entry.openingBonusBalance),
          openingFreeBet: num(entry.openingFreeBetBalance),
          remainingTurnover: num(entry.remainingTurnover)
        };
      }),
      scenarios: scenarios,
      allocations: assignments.map(function (row) {
        return {
          event: row.eventName,
          account: platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)),
          outcome: row.outcomeName,
          odds: num(row.originalOdds || row.odds),
          planned: num(row.plannedStake),
          executed: num(row.executedStake),
          profitLoss: num(row.profitLoss)
        };
      }),
      mixes: (session.mixTickets || []).map(function (mix) {
        var values = window.AtlasMixService.values(mix);
        var settlement = mix.settlement || window.AtlasMixService.settlement(mix);
        return {
          ticket: mix.ticketReference || mix.id,
          account: platformAccountLabel(byId(state.userPlatforms, mix.platformAccountId)),
          status: mix.status,
          combinedOdds: values.combinedLockedOdds,
          deduction: mix.freeBetDeductionApplied ? 'Applied once (' + num(mix.freeBetDeductionCount) + ')' : 'Not applied',
          netResult: settlement.netResult
        };
      }),
      finalBalances: (session.finalBalanceSummary || buildFinalBalanceSummary(session)).map(function (row) {
        return {
          account: platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)),
          openingCash: num(row.openingCashBalance),
          funding: num(row.platformFunding),
          executed: num(row.totalExecutedStake),
          endingCash: num(row.endingCashBalance),
          remainingTurnover: num(row.remainingTurnover),
          availableWithdrawal: num(row.availableForWithdrawal)
        };
      }),
      withdrawals: visibleExpectedWithdrawals().filter(function (row) {
        return !!accountIds[row.platformAccountId];
      }).map(function (row) {
        return {
          account: platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)),
          amount: num(row.expectedAmount),
          received: num(row.actualAmountReceived),
          destination: accountName(row.destinationAccountId),
          date: row.requestDate || '',
          status: row.status
        };
      }),
      history: history
    };
  }

  function calculatorPdfPayload(sessions) {
    var rows = sessions.map(calculatorPdfSession);
    var assignments = [];
    var balances = [];
    var mixes = [];
    sessions.forEach(function (session) {
      assignments = assignments.concat(sessionAssignments(session));
      balances = balances.concat(session.finalBalanceSummary || []);
      mixes = mixes.concat(session.mixTickets || []);
    });
    var clientIsolationPass = sessions.every(function (session) {
      return sessionAssignments(session).every(function (row) { return !session.clientId || row.clientId === session.clientId; }) &&
        (session.accountPool || []).every(function (row) { return !session.clientId || row.clientId === session.clientId; });
    });
    var lockedOddsPass = assignments.every(function (row) { return num(row.originalOdds || row.odds) > 1; });
    var ruleSnapshotsPass = assignments.every(function (row) { return !!row.ruleSnapshot; });
    var settlementPass = sessions.every(function (session) {
      return session.status !== 'Settled' || sessionAssignments(session).every(function (row) { return row.status === 'Settled'; });
    });
    var freeBetPass = mixes.every(function (mix) { return num(mix.freeBetDeductionCount) <= 1; });
    var balancePass = balances.every(function (row) {
      return num(row.endingCashBalance) >= -0.00001 && num(row.endingBonusBalance) >= -0.00001;
    });
    function check(name, passed, explanation) {
      return { name: name, result: passed ? 'PASS' : 'REVIEW', explanation: explanation };
    }
    return {
      title: 'Atlas Complete Operation Report',
      generatedAt: nowIso(),
      currency: 'USD',
      isShowcase: sessions.some(function (session) { return session.isShowcaseData === true || /^SHOWCASE|Atlas Full Potential Showcase/i.test(session.sessionName || session.eventName || ''); }),
      sessions: rows,
      checks: [
        check('Client isolation', clientIsolationPass, clientIsolationPass ? 'Every exported Account belongs to its saved Session Client.' : 'A Client mismatch needs Owner review.'),
        check('Locked odds preserved', lockedOddsPass, lockedOddsPass ? 'Every allocation retains its saved original odds.' : 'One or more allocations has no valid saved odds.'),
        check('Platform rule snapshots', ruleSnapshotsPass, ruleSnapshotsPass ? 'Every allocation contains its historical Platform rule snapshot.' : 'One or more old allocations needs a rule-snapshot review.'),
        check('Settlement uses saved execution', settlementPass, settlementPass ? 'Settled Sessions contain settled allocation records.' : 'A settled Session contains an unsettled allocation.'),
        check('Free Bet deduction count', freeBetPass, freeBetPass ? 'No Mix applied the Free Bet odds deduction more than once.' : 'A Mix deduction count is greater than one.'),
        check('No negative final balances', balancePass, balancePass ? 'Saved final Cash and Bonus balances are not negative.' : 'A final balance needs Owner review.')
      ]
    };
  }

  function exportCalculatorPdf(locale) {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    var sessions = calculatorExportSessionsFromFilters();
    if (!sessions.length) {
      window.alert('Save an operation or adjust the export filters before exporting.');
      return;
    }
    if (!window.AtlasPdfService) {
      window.alert('The PDF export service did not load.');
      return;
    }
    var button = document.getElementById(locale === 'fa' ? 'exportOperationPdfPersian' : 'exportOperationPdfEnglish');
    var original = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = locale === 'fa' ? 'در حال ساخت...' : 'Building PDF...';
    }
    window.AtlasPdfService.downloadOperationPdf(calculatorPdfPayload(sessions), locale).then(function (result) {
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: 'Operation PDF exported',
        entityType: 'CalculatorSession',
        entityId: sessions.length === 1 ? sessions[0].id : 'filtered-sessions',
        newValue: { language: locale, filename: result.filename, pageCount: result.pageCount }
      }));
      saveState();
    }).catch(function (error) {
      window.alert('Could not create PDF: ' + error.message);
    }).then(function () {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  function exportCalculatorSpreadsheet() {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    var sessions = calculatorExportSessionsFromFilters();
    if (!sessions.length) {
      window.alert('Save an operation or adjust the export filters before exporting.');
      return;
    }
    var allAssignments = [];
    var finalRows = [];
    var possibleRows = [['Session', 'Event', 'Possible result', 'Expected gross return', 'Expected profit/loss', 'Expected ROI']];
    var actualRows = [['Session', 'Event', 'Actual result', 'Winning positions', 'Losing positions', 'Refunded positions', 'Actual return', 'Actual profit/loss']];
    var accountIds = {};
    var mixRows = [['Session', 'Ticket', 'Client', 'User', 'Platform Account', 'Status', 'Cash Portion', 'Normal Bonus Portion', 'Free Bet Portion', 'Combined Locked Odds', 'Effective Free Bet Odds', 'Provisional Potential', 'Adjusted Free Bet Potential', 'Deduction Applied', 'Deduction Count', 'Realized Return', 'Net Result', 'Conversion Rate']];
    var mixLegRows = [['Session', 'Ticket', 'Position', 'Event', 'Market', 'Outcome', 'Locked Odds', 'Start', 'Expected Settlement', 'Result']];
    var mixHedgeRows = [['Session', 'Ticket', 'Leg', 'Client', 'User', 'Platform Account', 'Outcome', 'Stake Type', 'Stake', 'Locked Odds', 'Execution', 'Result', 'Actual Return']];
    sessions.forEach(function (session) {
      var assignments = sessionAssignments(session);
      assignments.forEach(function (row) {
        var copy = clone(row);
        copy.sessionName = session.eventName;
        allAssignments.push(copy);
        accountIds[row.platformAccountId] = true;
      });
      (session.finalBalanceSummary || buildFinalBalanceSummary(session)).forEach(function (row) {
        var balanceCopy = clone(row);
        balanceCopy.sessionName = session.eventName;
        finalRows.push(balanceCopy);
      });
      ((session.result && session.result.scenarios) || []).forEach(function (row) {
        possibleRows.push([session.eventName, session.eventName, row.name, row.grossReturn, row.profitLoss, session.result.totalStake ? row.profitLoss / session.result.totalStake : 0]);
      });
      (session.resultRecords || []).forEach(function (record) {
        var totals = sessionTotalsForExport(session);
        actualRows.push([session.eventName, session.eventName, record.result, assignments.filter(function (row) { return row.payout > 0; }).length, assignments.filter(function (row) { return row.profitLoss < 0; }).length, assignments.filter(function (row) { return row.refund > 0; }).length, totals.totalReturned, totals.profitLoss]);
      });
      (session.mixTickets || []).forEach(function (mix) {
        var mixValue = window.AtlasMixService.values(mix);
        var mixSettlement = mix.settlement || window.AtlasMixService.settlement(mix);
        mixRows.push([session.sessionName || session.eventName, mix.ticketReference || mix.id, clientName(mix.clientId), userName(mix.userId), platformAccountLabel(byId(state.userPlatforms, mix.platformAccountId)), mix.status, mix.cashPortion, mix.normalBonusPortion, mix.freeBetPortion, mixValue.combinedLockedOdds, mixValue.effectiveFreeBetOdds, mixValue.provisionalCombinedPotential, mixValue.adjustedFreeBetPotential, mix.freeBetDeductionApplied, mix.freeBetDeductionCount, mixSettlement.realizedWithdrawableValue, mixSettlement.netResult, mixSettlement.freeBetConversionRate / 100]);
        window.AtlasMixService.sortedLegs(mix).forEach(function (leg, index) {
          mixLegRows.push([session.sessionName || session.eventName, mix.ticketReference || mix.id, index + 1, leg.eventName, leg.market, leg.outcome, leg.lockedOdds, leg.eventStartTime, leg.expectedSettlementTime, leg.result || leg.status]);
        });
        (mix.hedges || []).forEach(function (hedge) {
          mixHedgeRows.push([session.sessionName || session.eventName, mix.ticketReference || mix.id, hedge.legId, clientName(hedge.clientId), userName(hedge.userId), platformAccountLabel(byId(state.userPlatforms, hedge.platformAccountId)), hedge.outcome, hedge.stakeType, hedge.stakeAmount, hedge.lockedOdds, hedge.executedStatus, hedge.settlementResult, hedge.actualReturn]);
        });
      });
    });
    var summaryRows = [['Session name', 'Start date', 'Expected end date', 'Expected rollover date', 'Total capital used', 'Total cash used', 'Total bonus used', 'Total Free Bet used', 'Total returned', 'Total profit/loss', 'ROI', 'Turnover completed', 'Remaining turnover']].concat(sessions.map(function (session) {
      var totals = sessionTotalsForExport(session);
      return [session.sessionName || session.eventName, sessionDateForExport(session), session.expectedEndDate || '', session.expectedRolloverDate || '', totals.totalStake, totals.cashUsed, totals.bonusUsed, totals.freeBetUsed, totals.totalReturned, totals.profitLoss, totals.roi, totals.turnoverCompleted, totals.remainingTurnover];
    }));
    var sheets = [
      { name: 'Session Summary', rows: summaryRows },
      {
        name: 'Bets by Profile',
        rows: [['Session', 'Client', 'User', 'Platform', 'Platform account', 'Event', 'Market', 'Outcome', 'Original Odds', 'Effective Free Bet Odds', 'Planned stake', 'Executed stake', 'Cash used', 'Bonus used', 'Free Bet used', 'Result', 'Payout', 'Refund', 'Profit/loss']].concat(allAssignments.map(function (row) {
          return [row.sessionName, clientName(row.clientId), userName(row.userId), platformName(row.platformId), platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)), row.eventName, row.marketName, row.outcomeName, row.originalOdds || row.odds, row.effectiveFreeBetOdds || '', row.plannedStake, row.executedStake, row.cashAmount, row.bonusAmount, row.freeBetAmount, row.result, row.payout, row.refund, row.profitLoss];
        }))
      },
      { name: 'Possible Outcomes', rows: possibleRows },
      { name: 'Actual Results', rows: actualRows },
      { name: 'Mix Tickets', rows: mixRows },
      { name: 'Mix Legs', rows: mixLegRows },
      { name: 'Mix Hedges', rows: mixHedgeRows },
      {
        name: 'Account Balance History',
        rows: [['Session', 'Client', 'User', 'Platform', 'Account', 'Opening Cash', 'Opening Bonus', 'Manual Funding', 'Planned Allocation', 'Executed Allocation', 'Payout', 'Refund', 'Ending Cash', 'Ending Bonus', 'Remaining Balance']].concat(finalRows.map(function (row) {
          return [row.sessionName, clientName(row.clientId), userName(row.userId), platformName(row.platformId), platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)), row.openingCashBalance, row.openingBonusBalance, row.platformFunding, row.totalPlannedAllocation, row.totalExecutedStake, row.totalWinningReturn, row.totalRefunds, row.endingCashBalance, row.endingBonusBalance, row.remainingInPlatform];
        }))
      },
      {
        name: 'Turnover History',
        rows: [['Session', 'Client', 'User', 'Platform', 'Account', 'Opening turnover requirement', 'Turnover completed in session', 'Remaining turnover', 'Turnover percentage', 'Bonus type']].concat(allAssignments.map(function (row) {
          var account = byId(state.userPlatforms, row.platformAccountId);
          var turnover = account ? workflow().turnoverSummary(account, activePlatformRule(account.platformId)) : {};
          return [row.sessionName, clientName(row.clientId), userName(row.userId), platformName(row.platformId), platformAccountLabel(account), row.openingTurnoverRequirement, row.completedTurnover, row.remainingTurnover, (turnover.effectiveTurnoverPercentage || 0) / 100, account ? account.bonusType : ''];
        }))
      },
      {
        name: 'Final Balances',
        rows: [['Session', 'Client', 'User', 'Platform', 'Platform account', 'Opening cash', 'Opening bonus', 'Funding', 'Stakes', 'Payouts', 'Refunds', 'Ending cash', 'Ending bonus', 'Pending withdrawal', 'Available for withdrawal']].concat(finalRows.map(function (row) {
          return [row.sessionName, clientName(row.clientId), userName(row.userId), platformName(row.platformId), platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)), row.openingCashBalance, row.openingBonusBalance, row.platformFunding, row.totalExecutedStake, row.totalWinningReturn, row.totalRefunds, row.endingCashBalance, row.endingBonusBalance, 0, row.availableForWithdrawal];
        }))
      },
      {
        name: 'Withdrawals',
        rows: [['Client', 'User', 'Platform', 'Account', 'Withdrawal requested', 'Expected amount', 'Received amount', 'Remaining amount', 'Destination wallet or bank', 'Status', 'Request date', 'Received date', 'Delay reason']].concat(visibleExpectedWithdrawals().filter(function (row) {
          return accountIds[row.platformAccountId];
        }).map(function (row) {
          return [clientName(row.clientId), userName(row.userId), platformName(row.platformId), platformAccountLabel(byId(state.userPlatforms, row.platformAccountId)), row.status !== 'Cancelled', row.expectedAmount, row.actualAmountReceived, Math.max(0, num(row.expectedAmount) - num(row.actualAmountReceived)), accountName(row.destinationAccountId), row.status, row.requestDate, row.actualArrivalDate, row.delayReason];
        }))
      }
    ];
    var blob = window.AtlasXlsxService.workbook(sheets);
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    var fileLabel = sessions.length === 1 ? slug(sessions[0].eventName, 'SESSION') : 'filtered-sessions';
    link.href = url;
    link.download = 'atlas-operation-' + fileLabel + '.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderFinalBalanceSummary() {
    var holder = document.getElementById('finalBalanceSummary');
    if (!holder) return;
    clear(holder);
    var session = activeCalculatorSession();
    var rows = session && session.finalBalanceSummary ? session.finalBalanceSummary : (session ? buildFinalBalanceSummary(session) : []);
    if (!rows.length) {
      holder.innerHTML = '<div class="empty-state">Final balances appear after an operation is saved and settled.</div>';
      return;
    }
    rows.forEach(function (row) {
      var card = document.createElement('article');
      card.className = 'session-card';
      card.innerHTML =
        '<div class="tree-title compact"><h3>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, row.platformAccountId))) + '</h3><span class="' + (row.realizedProfitLoss >= 0 ? 'positive' : 'negative') + '">' + money(row.realizedProfitLoss) + '</span></div>' +
        '<div class="share-metrics wide-metrics">' +
          '<div class="metric"><span>Opening Cash</span><strong>' + money(row.openingCashBalance) + '</strong></div>' +
          '<div class="metric"><span>Opening Bonus</span><strong>' + money(row.openingBonusBalance) + '</strong></div>' +
          '<div class="metric"><span>Manual Funding</span><strong>' + money(row.platformFunding) + '</strong></div>' +
          '<div class="metric"><span>Planned Allocation</span><strong>' + money(row.totalPlannedAllocation) + '</strong></div>' +
          '<div class="metric"><span>Executed Stake</span><strong>' + money(row.totalExecutedStake) + '</strong></div>' +
          '<div class="metric"><span>Winning Return</span><strong>' + money(row.totalWinningReturn) + '</strong></div>' +
          '<div class="metric"><span>Refunds</span><strong>' + money(row.totalRefunds) + '</strong></div>' +
          '<div class="metric"><span>Losses</span><strong>' + money(row.totalLosses) + '</strong></div>' +
          '<div class="metric"><span>Completed Turnover</span><strong>' + money(row.completedTurnover) + '</strong></div>' +
          '<div class="metric"><span>Remaining Turnover</span><strong>' + money(row.remainingTurnover) + '</strong></div>' +
          '<div class="metric"><span>Ending Cash</span><strong>' + money(row.endingCashBalance) + '</strong></div>' +
          '<div class="metric"><span>Available Withdrawal</span><strong>' + money(row.availableForWithdrawal) + '</strong></div>' +
        '</div>';
      holder.appendChild(card);
    });
  }

  function renderCalculatorSessions() {
    var holder = document.getElementById('calculatorSessionList');
    if (!holder) return;
    clear(holder);
    var sessions = visibleCalculatorSessions().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    setText('calculatorSessionMeta', sessions.length + ' sessions');
    if (!sessions.length) {
      holder.innerHTML = '<div class="empty-state">No saved calculations yet.</div>';
      return;
    }
    sessions.forEach(function (session) {
      var result = session.result || {};
      var card = document.createElement('article');
      card.className = 'session-card';
      card.innerHTML =
        '<div class="tree-title compact"><h3>' + htmlEscape(session.eventName || 'Calculation') + '</h3><span class="' + paymentStatusClass(session.status) + '">' + htmlEscape(session.status || 'Calculated') + '</span></div>' +
        '<div class="share-metrics wide-metrics">' +
          '<div class="metric"><span>Date</span><strong>' + htmlEscape(session.eventDate || '') + '</strong></div>' +
          '<div class="metric"><span>Market</span><strong>' + htmlEscape(session.marketType || '') + '</strong></div>' +
          '<div class="metric"><span>Total Stake</span><strong>' + money(result.totalStake || 0) + '</strong></div>' +
          '<div class="metric"><span>Worst Scenario</span><strong class="' + (num(result.worstProfit) >= 0 ? 'positive' : 'negative') + '">' + money(result.worstProfit || 0) + '</strong></div>' +
          '<div class="metric"><span>Spread</span><strong>' + money(result.spread || 0) + '</strong></div>' +
          '<div class="metric"><span>Created</span><strong>' + htmlEscape(String(session.createdAt || '').slice(0, 10)) + '</strong></div>' +
        '</div>' +
        '<div class="action-row"><button class="secondary-button compact-button" type="button" data-open-saved-calculator="' + htmlEscape(session.id) + '">Open Session</button></div>';
      holder.appendChild(card);
    });
  }

  function openSavedCalculatorSession(sessionId) {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    var session = byId(state.calculatorSessions, sessionId);
    if (!session) return;
    activeCalculatorSessionId = session.id;
    calculatorSessionDraft = {
      id: session.id,
      sessionName: session.sessionName || session.eventName || 'Saved Operation Session',
      clientId: session.clientId || '',
      startDate: session.startDate || session.eventDate || todayString(),
      expectedEndDate: session.expectedEndDate || '',
      expectedRolloverDate: session.expectedRolloverDate || '',
      targetReturnPercentage: num(session.targetReturnPercentage) || 97,
      objective: session.objective || '',
      description: session.description || '',
      notes: session.notes || '',
      status: session.status || 'Saved',
      accountPool: clone(session.accountPool || []),
      mixTickets: clone(session.mixTickets || []),
      history: clone(session.history || [])
    };
    calculatorSessionEvents = clone(session.events || []);
    var selectedEvent = calculatorSessionEvents[0] || null;
    if (selectedEvent) {
      activeCalculatorEventId = selectedEvent.id;
      calculatorDraft = clone(selectedEvent.input || createCalculatorDraft(selectedEvent.marketType || 'Three Outcome'));
      calculatorResult = clone(selectedEvent.result || null);
      calculatorAssignments = {};
      (selectedEvent.assignments || []).forEach(function (assignment) {
        var outcomeId = assignment.outcomeId || assignment.marketKey || assignment.outcomeName;
        if (!calculatorAssignments[outcomeId]) calculatorAssignments[outcomeId] = [];
        calculatorAssignments[outcomeId].push(clone(assignment));
      });
    } else {
      activeCalculatorEventId = '';
      calculatorDraft = createCalculatorDraft('Three Outcome');
      calculatorResult = clone(session.result || null);
      calculatorAssignments = {};
    }
    currentMixDraft = calculatorSessionDraft.mixTickets[0] ? clone(calculatorSessionDraft.mixTickets[0]) : null;
    var home = document.getElementById('calculatorHome');
    var workbench = document.getElementById('calculatorWorkbench');
    if (home) home.hidden = true;
    if (workbench) workbench.hidden = false;
    document.body.classList.add('calculator-has-workbench');
    calculatorLayout.view = 'results';
    saveCalculatorLayout();
    renderCalculator();
  }

  function prepareAllocationFromCalculator(index) {
    if (!calculatorResult || !calculatorResult.outcomeRows[index]) {
      window.alert('Calculate stakes before preparing an allocation.');
      return;
    }
    var row = calculatorResult.outcomeRows[index];
    var form = document.getElementById('allocationForm');
    if (!form) return;
    activateView('operations');
    populateSelects();
    form.elements.eventName.value = calculatorDraft.eventName || 'Calculator Event';
    form.elements.eventId.value = slug(calculatorDraft.eventName || 'EVENT', 'EVENT');
    form.elements.marketType.value = calculatorDraft.marketType === 'Two Outcome' ? 'Two Outcome' : 'Three Outcome';
    form.elements.marketName.value = calculatorDraft.marketName || 'Match Winner';
    form.elements.outcomeName.value = row.name;
    form.elements.odds.value = row.odds;
    form.elements.stake.value = row.stake;
    form.elements.potentialPayout.value = row.stake * row.odds;
    form.elements.requiredTurnoverAllocation.value = row.requiredTurnover || 0;
    form.elements.cashAmount.value = row.stake;
    form.elements.bonusAmount.value = 0;
    form.elements.notes.value = 'Prepared from calculator setup.';
    renderEligibilityPreview();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderKpis() {
    var company = companyTotals();
    var distribution = currentDistribution();
    var paymentStats = paymentTotals();
    var visibleDist = distributionRowsForRole();
    var ownRow = visibleDist.rows[0];
    var visibleWithdrawalRows = visibleExpectedWithdrawals();
    var pendingWithdrawalAmount = sum(visibleWithdrawalRows.filter(function (item) {
      return item.status !== 'Received' && item.status !== 'Cancelled';
    }), function (item) {
      return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived));
    });
    var totalAllocatedCapital = sum(visibleUsers(), function (item) { return item.allocatedCapital; });
    var totalUnallocatedCapital = sum(visibleShareholders(), function (item) {
      return Math.max(0, investorCapital(item) - sum(state.users.filter(function (user) { return user.clientId === item.clientId; }), function (user) { return user.allocatedCapital; }));
    });
    var totalPlatformBalance = sum(visiblePlatformAccounts(), function (item) {
      return workflow().platformPerformance(state, item.id).currentPlatformBalance;
    });
    var totalRealizedProfitLoss = sum(visibleShareholders(), function (item) {
      return workflow().clientPlatformSummary(state, item.clientId).totalRealizedProfitLoss;
    });
    var visibleWalletAccounts = state.accounts.filter(function (account) {
      return isOwner() || canSeeClient(account.clientId);
    });
    var balances = walletBalances();
    var availableWalletCapital = sum(visibleWalletAccounts, function (account) {
      return Math.max(0, num(balances[account.id]) - num(account.reservedBalance) - num(account.safetyMargin));
    });
    var availablePlatformCapital = sum(visiblePlatformAccounts(), function (account) {
      return Math.max(0, num(account.cashBalance) + num(account.bonusBalance) + num(account.freeBetBalance) - num(account.reservedBalance));
    });
    var reservedWalletCapital = sum(visibleWalletAccounts, function (account) { return account.reservedBalance; });
    var visibleSessionRows = isOwner() ? state.calculatorSessions : visibleOperationalSessions();
    var activeSessionRows = visibleSessionRows.filter(function (session) {
      return ['Completed', 'Settled', 'Cancelled', 'Failed'].indexOf(session.status) === -1;
    });
    var reservedSessionCapital = isOwner() ? sum(activeSessionRows, function (session) {
      return sum((session.assignments || []).filter(function (assignment) {
        return ['Locked', 'Reserved', 'Approved'].indexOf(assignment.status) !== -1;
      }), function (assignment) {
        return assignment.executedStake || assignment.finalStake || assignment.stake;
      });
    }) : 0;
    var attentionAccounts = visiblePlatformAccounts().filter(function (account) {
      return account.status !== 'Active' || num(account.remainingTurnoverAmount) > 0;
    });

    if (isShareholderRole() && ownRow) {
      var ownUsersCurrentCapital = sum(visibleUsers(), function (user) { return userCurrentBalance(user.id); });
      setText('kpiCapital', money(ownRow.investedAmount));
      setText('kpiCapitalMeta', percent(ownRow.capitalRatio * 100) + ' of total capital');
      setText('kpiBenefit', money(ownUsersCurrentCapital));
      setText('kpiBenefitMeta', 'current capital across own users');
      setText('kpiPayable', money(ownRow.shareholderPayableProfit));
      setText('kpiPayableMeta', percent(ownRow.profitSharePercentage) + ' agreement');
      setText('kpiRetained', money(pendingWithdrawalAmount));
      setText('kpiRetainedMeta', 'pending platform withdrawals');
    } else if (isAdmin()) {
      setText('kpiCapital', htmlEscape(String(visibleClients().length)));
      setText('kpiCapitalMeta', 'assigned clients');
      setText('kpiBenefit', money(pendingWithdrawalAmount));
      setText('kpiBenefitMeta', 'pending withdrawals');
      setText('kpiPayable', htmlEscape(String(visibleWithdrawalRows.filter(function (item) { return item.status === 'Delayed'; }).length)));
      setText('kpiPayableMeta', 'delayed withdrawals');
      setText('kpiRetained', htmlEscape(String(visibleTasks().filter(function (item) { return item.status !== 'Completed' && item.status !== 'Cancelled'; }).length)));
      setText('kpiRetainedMeta', 'open tasks');
    } else {
      setText('kpiCapital', money(distribution.totalCompanyCapital));
      setText('kpiCapitalMeta', money(totalOwnerCapital()) + ' owner capital');
      setText('kpiBenefit', money(totalAllocatedCapital));
      setText('kpiBenefitMeta', 'allocated client capital');
      setText('kpiPayable', money(totalUnallocatedCapital));
      setText('kpiPayableMeta', 'unallocated client capital');
      setText('kpiRetained', money(totalPlatformBalance + totalRealizedProfitLoss));
      setText('kpiRetainedMeta', 'platform balance plus realized P/L');
    }

    setText('kpiPendingPayments', money(pendingWithdrawalAmount));
    setText('kpiPendingMeta', visibleWithdrawalRows.filter(function (item) { return item.status !== 'Received' && item.status !== 'Cancelled'; }).length + ' pending withdrawals');
    setText('kpiCompletedPayments', money(isAdmin() ? paymentStats.completed : totalRealizedProfitLoss));
    setText('kpiCompletedMeta', isAdmin() ? paymentStats.completedCount + ' completed payments' : visibleWithdrawalRows.filter(function (item) { return item.status === 'Received'; }).length + ' received withdrawals');
    setText('kpiAvailableCapital', money(availableWalletCapital + availablePlatformCapital));
    setText('kpiAvailableCapitalMeta', visibleWalletAccounts.length + visiblePlatformAccounts().length + ' visible money locations');
    setText('kpiReservedCapital', money(reservedWalletCapital + reservedSessionCapital));
    setText('kpiReservedCapitalMeta', reservedSessionCapital ? 'wallet reserves plus locked Session stakes' : 'wallet and operation reserves');
    setText('kpiActiveSessions', String(activeSessionRows.length));
    setText('kpiActiveSessionsMeta', 'operations not completed or cancelled');
    setText('kpiAttentionAccounts', String(attentionAccounts.length));
    setText('kpiAttentionAccountsMeta', 'status or remaining turnover review');
    renderTopShareholderLists(distribution.rows);
  }

  function renderDailyTable() {
    var body = document.getElementById('dailyBody');
    clear(body);
    var rows = dailyRows();
    setText('dailyCount', rows.length + ' rows');

    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(row.date) + '</td>' +
        '<td class="num">' + money(row.bet) + '</td>' +
        '<td class="num">' + money(row.siteAmount) + '</td>' +
        '<td class="num positive">' + money(row.benefit) + '</td>' +
        '<td class="num negative">' + money(row.costs + row.fees) + '</td>' +
        '<td class="num ' + (row.net >= 0 ? 'positive' : 'negative') + '">' + money(row.net) + '</td>';
      body.appendChild(tr);
    });
  }

  function renderChart() {
    var canvas = document.getElementById('pnlChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    var rows = dailyRows();
    var themeStyles = window.getComputedStyle(document.documentElement);
    function chartToken(name, fallback) {
      return String(themeStyles.getPropertyValue(name) || '').trim() || fallback;
    }
    var chartFont = chartToken('--font-body', 'Segoe UI, Arial');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = chartToken('--color-surface', '#ffffff');
    ctx.fillRect(0, 0, width, height);

    if (!rows.length) {
      ctx.fillStyle = chartToken('--color-text-secondary', '#687476');
      ctx.font = '14px ' + chartFont;
      ctx.fillText('No daily rows in this range', 24, 42);
      return;
    }

    var padding = { left: 54, right: 24, top: 24, bottom: 42 };
    var plotW = width - padding.left - padding.right;
    var plotH = height - padding.top - padding.bottom;
    var values = rows.map(function (row) { return row.net; });
    var max = Math.max.apply(Math, values.concat([0]));
    var min = Math.min.apply(Math, values.concat([0]));
    if (max === min) {
      max += 10;
      min -= 10;
    }
    var scaleY = function (value) {
      return padding.top + (max - value) / (max - min) * plotH;
    };
    var zeroY = scaleY(0);

    ctx.strokeStyle = chartToken('--color-border', '#dce4e1');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotH);
    ctx.lineTo(padding.left + plotW, padding.top + plotH);
    ctx.stroke();

    ctx.strokeStyle = chartToken('--color-border-strong', '#bdcbc6');
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(padding.left + plotW, zeroY);
    ctx.stroke();

    var barGap = 12;
    var barW = Math.max(22, (plotW - barGap * (rows.length - 1)) / rows.length);
    rows.forEach(function (row, index) {
      var x = padding.left + index * (barW + barGap);
      var y = scaleY(row.net);
      var top = Math.min(y, zeroY);
      var h = Math.max(2, Math.abs(zeroY - y));
      ctx.fillStyle = row.net >= 0 ? chartToken('--color-success', '#21805a') : chartToken('--color-danger', '#b4483e');
      ctx.fillRect(x, top, barW, h);
      ctx.fillStyle = chartToken('--color-text-secondary', '#687476');
      ctx.font = '11px ' + chartFont;
      ctx.textAlign = 'center';
      ctx.fillText(row.date.slice(5), x + barW / 2, height - 16);
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = chartToken('--color-text-secondary', '#687476');
    ctx.font = '12px ' + chartFont;
    ctx.fillText(money(max), 8, padding.top + 4);
    ctx.fillText(money(min), 8, padding.top + plotH);
    setText('chartSummary', rows.length + ' days / net ' + money(totals().net));
  }

  function renderLedger() {
    var body = document.getElementById('ledgerBody');
    clear(body);
    ledgerRows().forEach(function (row) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(row.date) + '</td>' +
        '<td>' + htmlEscape(row.type) + '</td>' +
        '<td>' + htmlEscape(row.account) + '</td>' +
        '<td class="route-code" title="' + htmlEscape(row.routeCode) + '">' + htmlEscape(row.routeCode) + '</td>' +
        '<td>' + htmlEscape(row.counterparty) + '</td>' +
        '<td class="num ' + (row.amount >= 0 ? 'positive' : 'negative') + '">' + money(row.amount) + '</td>' +
        '<td>' + htmlEscape(row.note) + '</td>' +
        '<td><div class="action-row">' + editButton(row.type, row.id) + deleteButton(row.type, row.id) + '</div></td>';
      body.appendChild(tr);
    });
  }

  function renderPortfolios() {
    var body = document.getElementById('placementBody');
    var metrics = document.getElementById('portfolioMetrics');
    var queue = document.getElementById('approvalQueue');
    if (!body || !metrics || !queue) return;
    var filter = document.getElementById('portfolioClientFilter');
    var clientId = filter ? filter.value : '';
    var allowed = function (row) { return canSeeClient(row.clientId) && (!clientId || row.clientId === clientId); };
    var accounts = state.accounts.filter(allowed);
    var platformAccounts = state.userPlatforms.filter(allowed);
    var balances = walletBalances();
    var walletCapital = sum(accounts.filter(function (item) { return item.type === 'Wallet'; }), function (item) { return balances[item.id]; });
    var bankCapital = sum(accounts.filter(function (item) { return item.type === 'Bank'; }), function (item) { return balances[item.id]; });
    var platformCapital = sum(platformAccounts, function (item) { return workflow().platformAvailableBalances(state, item).availableTotal; });
    var reserved = sum(accounts, function (item) { return item.reservedBalance; });
    var pendingWithdrawals = sum(state.expectedWithdrawals.filter(allowed).filter(function (item) { return item.status !== 'Received' && item.status !== 'Cancelled'; }), function (item) { return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived)); });
    var capital = walletCapital + bankCapital + platformCapital + pendingWithdrawals;
    metrics.innerHTML = [
      ['Total Capital', capital], ['Wallet Capital', walletCapital], ['Bank Capital', bankCapital],
      ['Platform Capital', platformCapital], ['Reserved Capital', reserved], ['Available Capital', Math.max(0, capital - reserved - pendingWithdrawals)]
    ].map(function (item) { return '<div><span>' + item[0] + '</span><strong>' + money(item[1]) + '</strong></div>'; }).join('');

    clear(body);
    state.moneyPlacements.filter(allowed).slice().reverse().forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + htmlEscape(String(item.date || item.createdAt || '').slice(0, 10)) + '</td><td>' + htmlEscape(clientName(item.clientId)) + '</td><td>' + htmlEscape(userName(item.userId)) + '</td><td>' + htmlEscape(item.type || '') + '</td><td>' + htmlEscape(item.previousLocation || '') + '</td><td>' + htmlEscape(item.currentLocation || '') + '</td><td class="num">' + money(item.amount) + '</td><td><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status || '') + '</span></td><td>' + htmlEscape(item.relatedTransactionId || '') + '</td>';
      body.appendChild(tr);
    });
    if (!body.children.length) body.innerHTML = '<tr><td colspan="9"><div class="empty-state">No money placements for this client.</div></td></tr>';

    clear(queue);
    var approvals = state.approvalRequests.filter(allowed).slice().reverse();
    setText('approvalCount', approvals.length + ' requests');
    approvals.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'approval-card';
      card.innerHTML = '<div><strong>' + htmlEscape(item.type) + ' / ' + money(item.amount) + '</strong><span>' + htmlEscape(clientName(item.clientId) + ' / ' + userName(item.userId)) + '</span><p>' + htmlEscape(item.notes || 'No note') + '</p></div><div><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status) + '</span>' + (isOwner() && item.status === 'Pending Owner Approval' ? '<div class="action-row"><button type="button" class="secondary-button compact-button" data-approval-action="Approved" data-approval-id="' + item.id + '">Approve</button><button type="button" class="secondary-button compact-button" data-approval-action="Rejected" data-approval-id="' + item.id + '">Reject</button><button type="button" class="secondary-button compact-button" data-approval-action="Changes Requested" data-approval-id="' + item.id + '">Request Changes</button></div>' : '') + '</div>';
      queue.appendChild(card);
    });
    if (!approvals.length) queue.innerHTML = '<div class="empty-state">No approval requests for this client.</div>';
  }

  function paymentStatusClass(status) {
    return 'status-badge status-' + String(status || 'Pending').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function renderPayments() {
    var body = document.getElementById('paymentBody');
    if (!body) return;
    clear(body);
    var rows = visiblePayments();
    setText('paymentCount', rows.length + ' rows');
    rows.forEach(function (payment) {
      var shareholder = byId(state.shareholders, payment.shareholderId);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(payment.date) + '</td>' +
        '<td>' + htmlEscape(shareholder ? shareholderLabel(shareholder) : clientName(payment.clientId)) + '</td>' +
        '<td class="num">' + money(payment.amount) + '</td>' +
        '<td><span class="' + paymentStatusClass(payment.status) + '">' + htmlEscape(payment.status) + '</span></td>' +
        '<td>' + htmlEscape(payment.reference || '') + '</td>' +
        '<td>' + htmlEscape(payment.paymentDate || '') + '</td>' +
        '<td>' + htmlEscape(payment.note || '') + '</td>' +
        '<td><div class="action-row">' + editButton('Payment', payment.id) + deleteButton('Payment', payment.id) + '</div></td>';
      body.appendChild(tr);
    });
    renderPaymentSummary();
  }

  function renderPaymentSummary() {
    var rows = visiblePayments();
    var groups = ['Pending', 'Processing', 'Completed', 'Failed'].map(function (status) {
      var statusRows = rows.filter(function (payment) { return payment.status === status; });
      return { status: status, count: statusRows.length, amount: sum(statusRows, function (payment) { return payment.amount; }) };
    });
    setText('paymentSummaryMeta', rows.length + ' payments');
    renderMiniList('paymentSummary', groups, function (row) {
      return '<span><span class="' + paymentStatusClass(row.status) + '">' + htmlEscape(row.status) + '</span> ' + row.count + '</span><strong>' + money(row.amount) + '</strong>';
    });
  }

  function renderPlatformOperations() {
    var fundingBody = document.getElementById('platformFundingBody');
    var resultBody = document.getElementById('platformResultBody');
    if (fundingBody) clear(fundingBody);
    if (resultBody) clear(resultBody);

    var fundings = visiblePlatformFundings();
    setText('platformFundingCount', fundings.length + ' rows');
    fundings.forEach(function (item) {
      if (!fundingBody) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.date) + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId)) + '</td>' +
        '<td>' + htmlEscape(userName(item.userId)) + '</td>' +
        '<td>' + htmlEscape(accountName(item.sourceAccountId)) + '</td>' +
        '<td>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, item.platformAccountId))) + '</td>' +
        '<td class="num">' + money(item.amount) + '</td>' +
        '<td>' + htmlEscape(item.currency || 'USD') + '</td>' +
        '<td>' + htmlEscape(item.notes || '') + '</td>';
      fundingBody.appendChild(tr);
    });

    var results = visiblePlatformResults();
    setText('platformResultCount', results.length + ' rows');
    results.forEach(function (item) {
      if (!resultBody) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.resultDate) + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId)) + '</td>' +
        '<td>' + htmlEscape(userName(item.userId)) + '</td>' +
        '<td>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, item.platformAccountId))) + '</td>' +
        '<td class="num">' + money(item.originalAmount) + '</td>' +
        '<td class="num">' + money(item.resultAmount) + '</td>' +
        '<td class="num">' + money(item.expectedWithdrawalAmount) + '</td>' +
        '<td class="num">' + money(item.remainingInsidePlatform) + '</td>' +
        '<td class="num">' + money(item.platformFees) + '</td>';
      resultBody.appendChild(tr);
    });
  }

  function renderExpectedWithdrawals() {
    var body = document.getElementById('expectedWithdrawalBody');
    if (!body) return;
    clear(body);
    var rows = visibleExpectedWithdrawals();
    setText('expectedWithdrawalCount', rows.length + ' rows');
    var summaryRows = [
      { label: 'Expected', value: rows.filter(function (item) { return item.status === 'Expected'; }).length },
      { label: 'Processing', value: rows.filter(function (item) { return item.status === 'Processing' || item.status === 'Withdrawal Requested'; }).length },
      { label: 'Received', value: rows.filter(function (item) { return item.status === 'Received'; }).length },
      { label: 'Delayed', value: rows.filter(function (item) { return item.status === 'Delayed'; }).length },
      { label: 'Verification', value: rows.filter(function (item) { return item.status === 'Verification Required'; }).length }
    ];
    setText('expectedWithdrawalSummaryMeta', rows.length + ' records');
    renderMiniList('expectedWithdrawalSummary', summaryRows, function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(String(row.value)) + '</strong>';
    });
    rows.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.id) + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId)) + '</td>' +
        '<td>' + htmlEscape(userName(item.userId)) + '</td>' +
        '<td>' + htmlEscape(platformAccountLabel(byId(state.userPlatforms, item.platformAccountId))) + '</td>' +
        '<td class="num">' + money(item.expectedAmount) + '</td>' +
        '<td>' + htmlEscape(accountName(item.destinationAccountId)) + '</td>' +
        '<td>' + htmlEscape(item.requestDate) + '</td>' +
        '<td class="num">' + htmlEscape(String(workflow().waitingDays(item.requestDate, item.actualArrivalDate))) + '</td>' +
        '<td class="num">' + money(item.actualAmountReceived) + '</td>' +
        '<td class="num">' + money(item.difference) + '</td>' +
        '<td><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status) + '</span></td>' +
        '<td>' + htmlEscape(item.delayReason || '') + '</td>';
      body.appendChild(tr);
    });
  }

  function renderActionCenter() {
    var body = document.getElementById('notificationBody');
    if (!body) return;
    clear(body);
    var notifications = visibleNotifications();
    var counts = workflow().notificationCounts(notifications);
    setText('notificationSummaryMeta', notifications.length + ' records');
    renderMiniList('notificationSummary', [
      { label: 'Unread', value: counts.unreadCount },
      { label: 'Pending', value: counts.pendingCount },
      { label: 'Overdue', value: counts.overdueCount }
    ], function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(String(row.value)) + '</strong>';
    });
    setText('notificationCount', notifications.length + ' rows');
    notifications.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.type) + '</td>' +
        '<td>' + htmlEscape(item.title) + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId) || '') + '</td>' +
        '<td>' + htmlEscape(userName(item.userId) || '') + '</td>' +
        '<td>' + htmlEscape(platformName(item.platformId) || '') + '</td>' +
        '<td>' + htmlEscape(authUserName(item.assignedAuthUserId) || '') + '</td>' +
        '<td>' + htmlEscape(item.dueDate || '') + '</td>' +
        '<td><span class="' + paymentStatusClass(item.priority) + '">' + htmlEscape(item.priority) + '</span></td>' +
        '<td><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status) + '</span></td>';
      body.appendChild(tr);
    });

    var audits = visibleAuditLogs().slice(-5).reverse();
    setText('auditSummaryMeta', audits.length + ' records');
    renderMiniList('auditSummary', audits, function (row) {
      return '<span>' + htmlEscape(row.action + ' / ' + row.entityType) + '</span><strong>' + htmlEscape(String(row.createdAt).slice(0, 10)) + '</strong>';
    });
  }

  function renderQuestions() {
    var body = document.getElementById('questionBody');
    if (!body) return;
    clear(body);
    var rows = visibleQuestions();
    setText('questionCount', rows.length + ' threads');
    rows.forEach(function (item) {
      var messages = state.questionMessages.filter(function (row) { return row.questionId === item.id; });
      var firstMessage = messages[0] || {};
      var senderName = authUserName(firstMessage.authorId) || firstMessage.authorRole || authUserName(item.createdBy) || 'Unknown';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.subject) + '</td>' +
        '<td class="message-cell">' + htmlEscape(firstMessage.message || item.message || '') + '</td>' +
        '<td>' + htmlEscape(senderName) + '<span class="muted block-text">' + htmlEscape(firstMessage.authorRole || '') + '</span></td>' +
        '<td>' + htmlEscape(clientName(item.clientId) || '') + '</td>' +
        '<td>' + htmlEscape(item.category) + '</td>' +
        '<td>' + htmlEscape(firstMessage.createdAt ? String(firstMessage.createdAt).slice(0, 10) : item.createdDate || '') + '</td>' +
        '<td><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status) + '</span></td>' +
        '<td><button class="secondary-button compact-button" type="button" data-open-question="' + htmlEscape(item.id) + '">View Message</button></td>';
      body.appendChild(tr);
    });
  }

  function openQuestionThread(id) {
    var question = byId(state.questions, id);
    if (!canViewQuestion(question)) {
      activateView('noAccess');
      return;
    }
    var dialog = document.getElementById('conversationDialog');
    var body = document.getElementById('conversationBody');
    if (!dialog || !body || !question) return;
    setText('conversationTitle', question.subject || 'Conversation');
    setText('conversationMeta', [
      clientName(question.clientId) || 'No related client',
      question.category || 'General',
      question.status || 'Open',
      question.createdDate || ''
    ].filter(Boolean).join(' / '));
    clear(body);
    var messages = state.questionMessages.filter(function (row) { return row.questionId === question.id; }).sort(function (a, b) {
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
    if (!messages.length) {
      body.innerHTML = '<div class="empty-state">No written message is stored for this thread.</div>';
    }
    messages.forEach(function (message) {
      var item = document.createElement('article');
      item.className = 'conversation-message';
      item.innerHTML =
        '<div class="conversation-message-head"><strong>' + htmlEscape(authUserName(message.authorId) || message.authorRole || 'Unknown') + '</strong><span>' + htmlEscape(message.authorRole || '') + ' / ' + htmlEscape(String(message.createdAt || '').replace('T', ' ').slice(0, 19)) + '</span></div>' +
        '<p>' + htmlEscape(message.message || '') + '</p>';
      body.appendChild(item);
    });
    var details = document.createElement('div');
    details.className = 'conversation-details';
    details.innerHTML =
      '<span>Sender: <strong>' + htmlEscape(authUserName(question.createdBy) || '') + '</strong></span>' +
      '<span>Assigned: <strong>' + htmlEscape(authUserName(question.assignedAdminId) || 'Unassigned') + '</strong></span>' +
      '<span>Priority: <strong>' + htmlEscape(question.priority || 'Normal') + '</strong></span>' +
      '<span>Status: <strong>' + htmlEscape(question.status || 'Open') + '</strong></span>';
    body.insertBefore(details, body.firstChild);
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', 'open');
  }

  function renderTasks() {
    var body = document.getElementById('taskBody');
    if (!body) return;
    clear(body);
    var rows = visibleTasks();
    setText('taskCount', rows.length + ' rows');
    setText('taskSummaryMeta', rows.length + ' records');
    renderMiniList('taskSummary', [
      { label: 'New', value: rows.filter(function (item) { return item.status === 'New'; }).length },
      { label: 'In Progress', value: rows.filter(function (item) { return item.status === 'In Progress'; }).length },
      { label: 'Waiting', value: rows.filter(function (item) { return item.status === 'Waiting'; }).length },
      { label: 'Overdue', value: rows.filter(function (item) { return item.status !== 'Completed' && item.status !== 'Cancelled' && item.dueDate && item.dueDate < todayString(); }).length }
    ], function (row) {
      return '<span>' + htmlEscape(row.label) + '</span><strong>' + htmlEscape(String(row.value)) + '</strong>';
    });
    rows.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.title) + '</td>' +
        '<td>' + htmlEscape(authUserName(item.assignedAdminId) || '') + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId) || '') + '</td>' +
        '<td><span class="' + paymentStatusClass(item.priority) + '">' + htmlEscape(item.priority) + '</span></td>' +
        '<td>' + htmlEscape(item.startDate || '') + '</td>' +
        '<td>' + htmlEscape(item.dueDate || '') + '</td>' +
        '<td><span class="' + paymentStatusClass(item.status) + '">' + htmlEscape(item.status) + '</span></td>' +
        '<td>' + htmlEscape(item.adminResponse || '') + '<div class="action-row">' + editButton('Task', item.id) + deleteButton('Task', item.id) + '</div></td>';
      body.appendChild(tr);
    });
  }

  function renderAdminAssignments() {
    var body = document.getElementById('adminAssignmentBody');
    if (!body) return;
    clear(body);
    if (!isOwner()) {
      setText('adminAssignmentCount', 'Restricted');
      return;
    }
    setText('adminAssignmentCount', state.adminAssignments.length + ' assignments');
    state.adminAssignments.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(authUserName(item.authUserId)) + '</td>' +
        '<td>' + htmlEscape(clientName(item.clientId)) + '</td>' +
        '<td><div class="action-row">' + deleteButton('AdminAssignment', item.id) + '</div></td>';
      body.appendChild(tr);
    });
  }

  function renderPlatformRules() {
    var cards = document.getElementById('platformRuleCards');
    var versionBody = document.getElementById('platformRuleVersionBody');
    if (cards) clear(cards);
    if (versionBody) clear(versionBody);
    if (!isOwner()) {
      setText('platformRuleCount', 'Restricted');
      setText('platformRuleVersionCount', 'Restricted');
      return;
    }
    setText('platformRuleCount', state.platformRules.length + ' profiles');
    if (cards && !state.platformRules.length) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No platform rule profiles yet.';
      cards.appendChild(empty);
    }
    state.platformRules.forEach(function (rule) {
      if (!cards) return;
      var card = document.createElement('article');
      card.className = 'rule-card';
      card.innerHTML =
        '<div class="tree-title compact"><h3>' + htmlEscape(platformName(rule.platformId)) + '</h3><span class="action-row"><span class="' + paymentStatusClass(rule.platformStatus) + '">' + htmlEscape(rule.platformStatus) + '</span>' + editButton('PlatformRule', rule.id) + deleteButton('PlatformRule', rule.id) + '</span></div>' +
        '<div class="rule-meta">' +
          '<span>Turnover <strong>' + percent(rule.turnoverPercentage) + '</strong></span>' +
          '<span>Method <strong>' + htmlEscape(rule.turnoverMethod) + '</strong></span>' +
          '<span>Odds <strong>' + htmlEscape(String(rule.minEligibleOdds || 1)) + (rule.maxEligibleOdds ? ' - ' + htmlEscape(String(rule.maxEligibleOdds)) : '+') + '</strong></span>' +
          '<span>Max outcomes <strong>' + htmlEscape(String(rule.maxOutcomesPerEvent || 1)) + '</strong></span>' +
          '<span>Two of three <strong>' + htmlEscape(rule.twoOfThreeOutcomesAllowed || 'Not Allowed') + '</strong></span>' +
        '</div>' +
        '<p>' + htmlEscape(rule.notes || 'No notes') + '</p>';
      cards.appendChild(card);
    });

    var versions = state.platformRuleVersions.slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    setText('platformRuleVersionCount', versions.length + ' versions');
    versions.forEach(function (version) {
      if (!versionBody) return;
      var snapshot = version.ruleSnapshot || {};
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(platformName(version.platformId)) + '</td>' +
        '<td>' + htmlEscape(snapshot.effectiveDate || '') + '</td>' +
        '<td class="num">' + percent(snapshot.turnoverPercentage || 0) + '</td>' +
        '<td>' + htmlEscape(snapshot.turnoverMethod || '') + '</td>' +
        '<td>' + htmlEscape(authUserName(version.createdBy) || '') + '</td>' +
        '<td>' + htmlEscape(version.changeReason || '') + '</td>';
      versionBody.appendChild(tr);
    });
  }

  function allocationCriteriaFromForm() {
    var form = document.getElementById('allocationForm');
    if (!form) return {};
    var f = form.elements;
    return {
      eventName: f.eventName.value,
      eventId: f.eventId.value || slug(f.eventName.value, 'EVENT'),
      marketType: f.marketType.value,
      marketName: f.marketName.value,
      outcomeName: f.outcomeName.value,
      platformId: f.platformId.value,
      odds: num(f.odds.value),
      stake: num(f.stake.value),
      potentialPayout: num(f.potentialPayout.value || (num(f.stake.value) * num(f.odds.value))),
      requiredTurnoverAllocation: num(f.requiredTurnoverAllocation.value),
      platformAccountId: f.platformAccountId.value,
      cashAmount: num(f.cashAmount.value),
      bonusAmount: num(f.bonusAmount.value),
      ownerOverride: f.ownerConfirmed.value === 'true',
      overrideReason: f.overrideReason.value,
      notes: f.notes.value,
      date: filters.to || todayString()
    };
  }

  function renderEligibilityCard(evaluation) {
    var account = byId(state.userPlatforms, evaluation.accountId);
    if (!account) return '';
    var badges = evaluation.badges.slice(0, 4).map(function (badge) {
      return '<span class="status-badge">' + htmlEscape(badge) + '</span>';
    }).join('');
    var reason = evaluation.reasons.length ? evaluation.reasons[0] : 'Meets platform, balance, bonus, turnover, odds, and event-allocation rules.';
    return '<article class="eligibility-card status-' + String(evaluation.status).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '">' +
      '<div class="tree-title compact"><h3>' + htmlEscape(platformAccountLabel(account)) + '</h3><span class="' + paymentStatusClass(evaluation.status) + '">' + htmlEscape(evaluation.status) + '</span></div>' +
      '<div class="eligibility-badges">' + badges + '</div>' +
      '<div class="share-metrics wide-metrics">' +
        '<div class="metric"><span>Client</span><strong>' + htmlEscape(clientName(account.clientId)) + '</strong></div>' +
        '<div class="metric"><span>User</span><strong>' + htmlEscape(userName(account.userId)) + '</strong></div>' +
        '<div class="metric"><span>Available Cash</span><strong>' + money(evaluation.balances.availableCash) + '</strong></div>' +
        '<div class="metric"><span>Bonus</span><strong>' + money(evaluation.balances.bonusBalance) + '</strong></div>' +
        '<div class="metric"><span>Remaining Turnover</span><strong>' + money(evaluation.turnover.remainingTurnoverAmount) + '</strong></div>' +
        '<div class="metric"><span>Effective Rollover</span><strong>' + percent(evaluation.turnover.effectiveTurnoverPercentage) + '</strong></div>' +
        '<div class="metric"><span>Event Allocations</span><strong>' + htmlEscape(String(evaluation.existingAllocationsInEvent.length)) + '</strong></div>' +
        '<div class="metric"><span>Max Additional Stake</span><strong>' + money(evaluation.maxAdditionalStake) + '</strong></div>' +
      '</div>' +
      '<details><summary>Rule details</summary><p>' + htmlEscape(reason) + '</p><p>Platform default: ' + percent(evaluation.turnover.platformDefaultPercentage) + ' / Account override: ' + (evaluation.turnover.accountOverridePercentage == null ? 'None' : percent(evaluation.turnover.accountOverridePercentage)) + ' / Method: ' + htmlEscape(evaluation.turnover.turnoverMethod) + '</p></details>' +
    '</article>';
  }

  function renderEligibilityPreview() {
    var holder = document.getElementById('eligibilityPreview');
    if (!holder) return;
    clear(holder);
    var criteria = allocationCriteriaFromForm();
    if (!criteria.platformId) {
      setText('eligibilityMeta', 'Select a platform');
      holder.innerHTML = '<div class="empty-state">Select an event, outcome, platform, odds, and stake to preview account eligibility.</div>';
      return;
    }
    var preview = workflow().eligibilityPreview(state, criteria);
    setText('eligibilityMeta', preview.evaluations.length + ' accounts');
    var groups = [
      { key: 'recommended', label: 'Recommended' },
      { key: 'eligible', label: 'Eligible' },
      { key: 'requiresReview', label: 'Requires Review' },
      { key: 'unavailable', label: 'Unavailable' }
    ];
    groups.forEach(function (group) {
      var rows = preview.groups[group.key] || [];
      var section = document.createElement('section');
      section.className = 'eligibility-section';
      section.innerHTML = '<div class="panel-head compact-head"><h2>' + htmlEscape(group.label) + '</h2><span>' + rows.length + '</span></div>' +
        (rows.length ? rows.map(renderEligibilityCard).join('') : '<div class="empty-state">No accounts in this group.</div>');
      holder.appendChild(section);
    });
    var selected = byId(state.userPlatforms, criteria.platformAccountId);
    if (selected) {
      var validation = workflow().validateAllocation(state, criteria, currentActor());
      var summary = document.getElementById('allocationValidationSummary');
      if (summary) {
        summary.innerHTML =
          '<span>Final Validation: <strong>' + (validation.errors.length ? 'Blocked' : 'Ready for Owner confirmation') + '</strong></span>' +
          '<span>Warnings: <strong>' + htmlEscape(String(validation.warnings.length)) + '</strong></span>' +
          '<span>Details: <strong>' + htmlEscape((validation.errors[0] || validation.warnings[0] || validation.evaluation.reasons[0] || 'No blocking rule triggered.')) + '</strong></span>';
      }
    }
  }

  function renderPlatformTurnoverPreview() {
    var form = document.getElementById('platformAccountForm');
    var holder = document.getElementById('platformTurnoverPreview');
    if (!form || !holder) return;
    var f = form.elements;
    var account = {
      platformId: f.platformId.value,
      fundingAmount: num(f.fundingAmount.value),
      bonusAmount: num(f.bonusAmount.value),
      turnoverPercentageOverride: f.turnoverPercentageOverride.value,
      completedTurnover: num(f.completedTurnover.value),
      customEligibleAmount: num(f.customEligibleAmount.value)
    };
    var rule = activePlatformRule(account.platformId);
    var turnover = workflow().turnoverSummary(account, rule);
    holder.innerHTML =
      '<span>Platform Default: <strong>' + percent(turnover.platformDefaultPercentage) + '</strong></span>' +
      '<span>Account Override: <strong>' + (turnover.accountOverridePercentage == null ? 'None' : percent(turnover.accountOverridePercentage)) + '</strong></span>' +
      '<span>Effective Turnover Requirement: <strong>' + percent(turnover.effectiveTurnoverPercentage) + '</strong></span>' +
      '<span>Eligible Funding Base: <strong>' + money(turnover.eligibleFundingBase) + '</strong></span>' +
      '<span>Required / Completed / Remaining: <strong>' + money(turnover.requiredTurnoverAmount) + ' / ' + money(turnover.completedTurnoverAmount) + ' / ' + money(turnover.remainingTurnoverAmount) + '</strong></span>';
  }

  function sessionTimelineHtml(session) {
    var log = session.activityLog || [];
    if (!log.length) return '<div class="empty-state">No activity recorded.</div>';
    return '<div class="timeline">' + log.map(function (item) {
      return '<div class="timeline-item"><strong>' + htmlEscape(item.action) + '</strong><span>' + htmlEscape(String(item.createdAt || '').replace('T', ' ').slice(0, 19)) + ' / ' + htmlEscape(authUserName(item.userId) || item.role || '') + '</span><p>' + htmlEscape(JSON.stringify(item.data || {})) + '</p></div>';
    }).join('') + '</div>';
  }

  function renderSessionHistory() {
    var holder = document.getElementById('sessionHistory');
    if (!holder) return;
    clear(holder);
    var sessions = visibleOperationalSessions().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    setText('sessionHistoryMeta', sessions.length + ' sessions');
    if (!sessions.length) {
      holder.innerHTML = '<div class="empty-state">No operational sessions yet.</div>';
      return;
    }
    sessions.forEach(function (session) {
      var account = byId(state.userPlatforms, session.platformAccountId);
      var card = document.createElement('article');
      card.className = 'session-card';
      card.innerHTML =
        '<div class="tree-title compact"><h3>' + htmlEscape(session.eventName || session.eventId) + '</h3><span class="' + paymentStatusClass(session.status) + '">' + htmlEscape(session.status) + '</span></div>' +
        '<div class="share-metrics wide-metrics">' +
          '<div class="metric"><span>Outcome</span><strong>' + htmlEscape(session.outcomeName) + '</strong></div>' +
          '<div class="metric"><span>Account</span><strong>' + htmlEscape(platformAccountLabel(account)) + '</strong></div>' +
          '<div class="metric"><span>Opening Cash</span><strong>' + money(session.openingCashBalance) + '</strong></div>' +
          '<div class="metric"><span>Opening Bonus</span><strong>' + money(session.openingBonusBalance) + '</strong></div>' +
          '<div class="metric"><span>Odds</span><strong>' + htmlEscape(String(session.odds || '')) + '</strong></div>' +
          '<div class="metric"><span>Planned / Executed</span><strong>' + money(session.plannedStake) + ' / ' + money(session.executedStake) + '</strong></div>' +
          '<div class="metric"><span>Turnover Before</span><strong>' + money(session.turnoverBefore && session.turnoverBefore.remainingTurnoverAmount) + '</strong></div>' +
          '<div class="metric"><span>Completed / Remaining</span><strong>' + money(session.completedTurnover) + ' / ' + money(session.remainingTurnover) + '</strong></div>' +
          '<div class="metric"><span>Payout / Refund</span><strong>' + money(session.payout) + ' / ' + money(session.refund) + '</strong></div>' +
          '<div class="metric"><span>Profit/Loss</span><strong class="' + (num(session.profitLoss) >= 0 ? 'positive' : 'negative') + '">' + money(session.profitLoss) + '</strong></div>' +
          '<div class="metric"><span>Withdrawal</span><strong>' + money(session.withdrawalAmount) + '</strong></div>' +
          '<div class="metric"><span>Payment</span><strong>' + htmlEscape(session.paymentStatus || 'Pending') + '</strong></div>' +
        '</div>' +
        '<details><summary>Complete activity log</summary>' + sessionTimelineHtml(session) + '</details>';
      holder.appendChild(card);
    });
  }

  function lifetimeCompanyTotals() {
    var oldFrom = filters.from;
    var oldTo = filters.to;
    filters.from = '';
    filters.to = '';
    var t = companyTotals();
    filters.from = oldFrom;
    filters.to = oldTo;
    return t;
  }

  function shareholderLifetimeRow(shareholder) {
    var service = window.AtlasProfitService;
    var t = lifetimeCompanyTotals();
    return service.calculateOne(shareholder, {
      shareholders: state.shareholders,
      payments: state.payments,
      totalCompanyCapital: totalInvestorCapital(),
      totalProfitForPeriod: t.net
    });
  }

  function monthKey(date) {
    return String(date || '').slice(0, 7) || 'Unknown';
  }

  function monthlyProfitRows() {
    var monthsMap = {};
    state.incomes.concat(state.costs, state.transfers, state.payments).forEach(function (item) {
      var date = item.date || item.paymentDate;
      if (date) monthsMap[monthKey(date)] = true;
    });
    var months = Object.keys(monthsMap).sort();
    var rows = [];
    months.forEach(function (month) {
      var oldFrom = filters.from;
      var oldTo = filters.to;
      filters.from = month + '-01';
      filters.to = month + '-31';
      var t = companyTotals();
      filters.from = oldFrom;
      filters.to = oldTo;
      var dist = window.AtlasProfitService.calculateDistribution({
        shareholders: state.shareholders,
        payments: state.payments.filter(function (payment) { return monthKey(payment.paymentDate || payment.date) === month; }),
        totalCompanyCapital: totalInvestorCapital(),
        totalProfitForPeriod: t.net
      });
      dist.rows.forEach(function (row) {
        if (isShareholderRole() && row.clientId !== currentUser.clientId) return;
        rows.push({ month: month, row: row });
      });
    });
    return rows;
  }

  function renderProfitLoss() {
    var holder = document.getElementById('profitLossCards');
    if (!holder) return;
    clear(holder);
    var dist = distributionRowsForRole();
    setText('profitLossMeta', dist.rows.length + ' records');
    if (!dist.rows.length) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = isShareholderRole() ? 'No shareholder profile is linked to this login yet.' : 'No shareholder records yet.';
      holder.appendChild(empty);
    }
    dist.rows.forEach(function (row) {
      var shareholder = byId(state.shareholders, row.shareholderId);
      var lifetime = shareholder ? shareholderLifetimeRow(shareholder) : row;
      var card = document.createElement('article');
      card.className = 'share-card profit-card';
      card.innerHTML =
        '<div class="share-top"><div><h3>' + htmlEscape(shareholderLabel(row)) + '</h3><span class="muted">Profit-share agreement: ' + percent(row.profitSharePercentage) + '</span></div><span class="badge">' + percent(row.capitalRatio * 100) + ' capital</span></div>' +
        '<div class="share-metrics wide-metrics">' +
          '<div class="metric"><span>Total Invested</span><strong>' + money(row.investedAmount) + '</strong></div>' +
          '<div class="metric"><span>Active Capital</span><strong>' + money(row.activeCapital) + '</strong></div>' +
          '<div class="metric"><span>Gross Profit</span><strong>' + money(row.grossProfitShare) + '</strong></div>' +
          '<div class="metric"><span>Payable Profit</span><strong class="positive">' + money(row.shareholderPayableProfit) + '</strong></div>' +
          '<div class="metric"><span>Company Retained</span><strong>' + money(row.companyRetainedProfitFromShareholder) + '</strong></div>' +
          '<div class="metric"><span>Withdrawals Paid</span><strong>' + money(row.withdrawalsPaid) + '</strong></div>' +
          '<div class="metric"><span>Remaining Unpaid</span><strong>' + money(row.remainingUnpaidProfit) + '</strong></div>' +
          '<div class="metric"><span>Net Balance</span><strong>' + money(row.netCurrentBalance) + '</strong></div>' +
          '<div class="metric"><span>Lifetime Profit</span><strong>' + money(lifetime.shareholderPayableProfit) + '</strong></div>' +
          '<div class="metric"><span>Lifetime Withdrawals</span><strong>' + money(lifetime.withdrawalsPaid) + '</strong></div>' +
        '</div>';
      holder.appendChild(card);
    });

    var body = document.getElementById('monthlyHistoryBody');
    clear(body);
    var history = monthlyProfitRows();
    setText('monthlyHistoryMeta', history.length + ' rows');
    history.forEach(function (item) {
      var row = item.row;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(item.month) + '</td>' +
        '<td>' + htmlEscape(shareholderLabel(row)) + '</td>' +
        '<td class="num">' + money(row.investedAmount) + '</td>' +
        '<td class="num">' + percent(row.capitalRatio * 100) + '</td>' +
        '<td class="num">' + money(row.grossProfitShare) + '</td>' +
        '<td class="num positive">' + money(row.shareholderPayableProfit) + '</td>' +
        '<td class="num">' + money(row.companyRetainedProfitFromShareholder) + '</td>' +
        '<td class="num">' + money(row.withdrawalsPaid) + '</td>' +
        '<td class="num">' + money(row.remainingUnpaidProfit) + '</td>';
      body.appendChild(tr);
    });
  }

  function renderAccessUsers() {
    var body = document.getElementById('accessUserBody');
    if (!body) return;
    clear(body);
    if (!isOwner()) {
      setText('accessUserCount', 'Restricted');
      return;
    }
    setText('accessUserCount', state.authUsers.length + ' users');
    state.authUsers.forEach(function (user) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + htmlEscape(user.name) + '</td>' +
        '<td>' + htmlEscape(user.username) + '</td>' +
        '<td><span class="status-badge status-role">' + htmlEscape(user.role) + '</span></td>' +
        '<td>' + htmlEscape(clientName(user.clientId) || 'All / none') + '</td>' +
        '<td><div class="action-row">' + editButton('AuthUser', user.id) + deleteButton('AuthUser', user.id) + '</div></td>';
      body.appendChild(tr);
    });
  }

  function renderShareholders() {
    var holder = document.getElementById('shareholderCards');
    var tableBody = document.getElementById('shareholderTableBody');
    clear(holder);
    clear(tableBody);
    var distribution = currentDistribution();
    var rowsById = {};
    distribution.rows.forEach(function (row) { rowsById[row.shareholderId] = row; });
    setText('shareTotal', money(distribution.totalCompanyCapital) + ' capital');
    var rows = visibleShareholders();
    if (!rows.length) {
      if (tableBody) {
        var emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="11" class="muted">No shareholder records yet.</td>';
        tableBody.appendChild(emptyRow);
      }
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No shareholder records yet.';
      holder.appendChild(empty);
    }

    rows.forEach(function (shareholder) {
      var row = rowsById[shareholder.id] || window.AtlasProfitService.calculateOne(shareholder, {
        shareholders: state.shareholders,
        payments: state.payments,
        totalCompanyCapital: distribution.totalCompanyCapital,
        totalProfitForPeriod: distribution.totalProfitForPeriod
      });
      var users = state.users.filter(function (user) { return user.clientId === shareholder.clientId; });
      var allocatedCapital = sum(users, function (user) { return user.allocatedCapital; });
      var capitalRemaining = investorCapital(shareholder) - allocatedCapital;
      var currentCapital = sum(users, function (user) { return userCurrentBalance(user.id); });
      var pendingWithdrawals = sum(state.expectedWithdrawals.filter(function (item) {
        return item.clientId === shareholder.clientId && item.status !== 'Received' && item.status !== 'Cancelled';
      }), function (item) {
        return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived));
      });
      var clientPerformance = workflow().clientPlatformSummary(state, shareholder.clientId);
      var displayName = clientName(shareholder.clientId) || shareholder.name || 'Investor Client';
      if (tableBody) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + htmlEscape(displayName) + '</td>' +
          '<td class="num">' + money(row.investedAmount) + '</td>' +
          '<td class="num">' + percent(row.profitSharePercentage) + '</td>' +
          '<td class="num">' + money(allocatedCapital) + '</td>' +
          '<td class="num">' + money(capitalRemaining) + '</td>' +
          '<td class="num">' + money(currentCapital) + '</td>' +
          '<td class="num ' + (clientPerformance.totalRealizedProfitLoss >= 0 ? 'positive' : 'negative') + '">' + money(clientPerformance.totalRealizedProfitLoss) + '</td>' +
          '<td class="num positive">' + money(row.shareholderPayableProfit) + '</td>' +
          '<td class="num">' + money(pendingWithdrawals) + '</td>' +
          '<td><span class="' + paymentStatusClass(shareholder.status) + '">' + htmlEscape(shareholder.status) + '</span></td>' +
          '<td><div class="action-row">' + editButton('Shareholder', shareholder.id) + deleteButton('Shareholder', shareholder.id) + '</div></td>';
        tableBody.appendChild(tr);
      }
      var card = document.createElement('article');
      card.className = 'share-card';
      card.innerHTML =
        '<div class="share-top"><div><h3>' + htmlEscape(displayName) + '</h3><span class="muted">' + htmlEscape(shareholder.note || 'Investor client') + '</span></div><div class="action-row"><span class="badge">' + percent(row.profitSharePercentage) + '</span>' + editButton('Shareholder', shareholder.id) + deleteButton('Shareholder', shareholder.id) + '</div></div>' +
        '<div class="share-metrics">' +
          '<div class="metric"><span>Invested</span><strong>' + money(row.investedAmount) + '</strong></div>' +
          '<div class="metric"><span>Allocated</span><strong>' + money(allocatedCapital) + '</strong></div>' +
          '<div class="metric"><span>Remaining</span><strong>' + money(capitalRemaining) + '</strong></div>' +
          '<div class="metric"><span>Current Capital</span><strong>' + money(currentCapital) + '</strong></div>' +
          '<div class="metric"><span>Gross Profit</span><strong>' + money(row.grossProfitShare) + '</strong></div>' +
          '<div class="metric"><span>Payable</span><strong class="' + (row.shareholderPayableProfit >= 0 ? 'positive' : 'negative') + '">' + money(row.shareholderPayableProfit) + '</strong></div>' +
          '<div class="metric"><span>Pending Withdrawals</span><strong>' + money(pendingWithdrawals) + '</strong></div>' +
          '<div class="metric"><span>Realized P/L</span><strong class="' + (clientPerformance.totalRealizedProfitLoss >= 0 ? 'positive' : 'negative') + '">' + money(clientPerformance.totalRealizedProfitLoss) + '</strong></div>' +
          '<div class="metric"><span>Status</span><strong>' + htmlEscape(shareholder.status) + '</strong></div>' +
        '</div>';
      holder.appendChild(card);
    });
  }

  function renderParties() {
    var holder = document.getElementById('clientTree');
    clear(holder);
    var clients = visibleClients();
    if (!clients.length) {
      setText('partyCount', '0 visible records');
      return;
    }
    var visibleUsersCount = visibleUsers().length;
    var visiblePlatformCount = visiblePlatformAccounts().length;
    setText('partyCount', clients.length + ' clients / ' + visibleUsersCount + ' users / ' + visiblePlatformCount + ' platform accounts');

    clients.forEach(function (client) {
      var clientUsers = state.users.filter(function (user) { return user.clientId === client.id; });
      var clientProfiles = state.userPlatforms.filter(function (item) { return item.clientId === client.id; });
      var clientAccounts = state.accounts.filter(function (item) { return item.clientId === client.id; });
      var card = document.createElement('article');
      card.className = 'tree-client';
      var usersHtml = clientUsers.map(function (user) {
        var platformRows = state.userPlatforms.filter(function (item) { return item.userId === user.id; });
        var accountRows = state.accounts.filter(function (item) { return item.userId === user.id; });
        var platformText = compactList(platformRows, 'platforms:' + user.id, 'profile', 'profiles', function (item) {
          return '<span class="tree-line">' + htmlEscape(platformName(item.platformId) + ' / ' + item.username + ' / ' + item.accountCode) + '<span class="action-row">' + editButton('UserPlatform', item.id) + deleteButton('UserPlatform', item.id) + '</span></span>';
        });
        var accountText = compactList(accountRows, 'accounts:' + user.id, 'account', 'accounts', function (item) {
          return '<span class="tree-line">' + htmlEscape(item.name + ' / ' + item.type + ' / ' + item.code + ' / ' + money(num(item.opening))) + '<span class="action-row">' + editButton('Account', item.id) + deleteButton('Account', item.id) + '</span></span>';
        });
        return '<div class="tree-user"><div class="tree-title compact"><strong>' + htmlEscape(user.name) + ' <span class="badge">' + htmlEscape(user.code) + '</span></strong><span class="action-row">' + editButton('User', user.id) + deleteButton('User', user.id) + '</span></div><div class="tree-section">' + (platformText || '<span>No platform account</span>') + '</div><div class="tree-section">' + (accountText || '<span>No bank or wallet account</span>') + '</div></div>';
      }).join('');
      card.innerHTML =
        '<div class="tree-title client-title"><div><h3>' + htmlEscape(client.name) + '</h3><span class="client-summary">' + clientUsers.length + ' users / ' + clientProfiles.length + ' profiles / ' + clientAccounts.length + ' accounts</span></div><div class="action-row"><span class="badge">' + htmlEscape(client.code) + '</span>' + editButton('Client', client.id) + deleteButton('Client', client.id) + '</div></div>' +
        '<div class="tree-users">' + (usersHtml || '<div class="tree-user"><strong>No users</strong><span>Add a user to create branches.</span></div>') + '</div>';
      holder.appendChild(card);
    });

    if (state.websites.length && !isShareholderRole()) {
      var platformCard = document.createElement('article');
      platformCard.className = 'tree-client';
      platformCard.innerHTML =
        '<div class="tree-title"><h3>Platforms</h3><span class="badge">' + state.websites.length + '</span></div>' +
        '<div class="tree-users">' + compactList(state.websites, 'platforms:all', 'platform', 'platforms', function (site) {
          return '<div class="tree-user"><div class="tree-title compact"><strong>' + htmlEscape(site.name) + ' <span class="badge">' + htmlEscape(site.code) + '</span></strong><span class="action-row">' + editButton('Website', site.id) + deleteButton('Website', site.id) + '</span></div><span>' + htmlEscape(site.type) + '</span></div>';
        }) + '</div>';
      holder.appendChild(platformCard);
    }
  }

  function renderAccounts() {
    var grid = document.getElementById('accountGrid');
    clear(grid);
    var accounts = isOwner() ? state.accounts : state.accounts.filter(function (account) { return canSeeClient(account.clientId); });
    if (!accounts.length) {
      setText('accountCount', '0 accounts');
      return;
    }
    var balances = walletBalances();
    setText('accountCount', accounts.length + ' accounts');
    accounts.forEach(function (account) {
      var balance = num(balances[account.id]);
      var card = document.createElement('article');
      card.className = 'account-card';
      card.innerHTML =
        '<div class="tree-title compact"><h3>' + htmlEscape(account.name) + '</h3><span class="action-row">' + editButton('Account', account.id) + deleteButton('Account', account.id) + '</span></div>' +
        '<strong class="' + (balance >= 0 ? 'positive' : 'negative') + '">' + money(balance) + '</strong>' +
        '<span>' + htmlEscape(account.type) + ' / ' + htmlEscape(account.code) + '</span>' +
        '<span>' + htmlEscape(accountPath(account)) + '</span>';
      grid.appendChild(card);
    });
  }

  function renderChecks() {
    var holder = document.getElementById('riskList');
    clear(holder);
    var balances = walletBalances();
    var warnings = [];
    var capitalTotal = totalInvestorCapital();
    if (!state.clients.length || !state.users.length || !state.websites.length || !state.accounts.length) {
      warnings.push({ level: 'warn', title: 'Setup needed', body: 'Add at least one client, user, platform, and account before entering ledger rows.' });
    }
    if (!state.shareholders.length) {
      warnings.push({ level: 'warn', title: 'Investor clients', body: 'Add investor clients and their money input to calculate profit allocation.' });
    } else if (capitalTotal <= 0) {
      warnings.push({ level: 'warn', title: 'Investor capital', body: 'Investor clients exist, but total active money input is zero.' });
    } else {
      warnings.push({ level: 'ok', title: 'Investor capital', body: 'Profit split is based on ' + money(capitalTotal) + ' active money input.' });
    }
    state.shareholders.forEach(function (shareholder) {
      var errors = window.AtlasProfitService.validateShareholder(shareholder);
      if (errors.length) {
        warnings.push({ level: 'bad', title: shareholderLabel(shareholder), body: errors.join(' ') });
      }
    });
    state.websites.forEach(function (site) {
      if (!state.platformRules.some(function (rule) { return rule.platformId === site.id; })) {
        warnings.push({ level: 'warn', title: site.name + ' rules', body: 'No platform rule profile has been configured yet.' });
      }
    });
    state.userPlatforms.forEach(function (account) {
      var rule = activePlatformRule(account.platformId);
      var turnover = workflow().turnoverSummary(account, rule);
      if (turnover.remainingTurnoverAmount > 0 && account.status === 'Active') {
        warnings.push({ level: 'warn', title: platformAccountLabel(account), body: 'Remaining turnover is ' + money(turnover.remainingTurnoverAmount) + ' using ' + turnover.turnoverMethod + '.' });
      }
    });
    state.accounts.forEach(function (account) {
      if (num(balances[account.id]) < 0) {
        warnings.push({ level: 'bad', title: account.name + ' balance', body: 'Wallet is negative at ' + money(balances[account.id]) + '.' });
      }
    });
    state.users.forEach(function (user) {
      var allocationErrors = workflow().validateUserAllocation(state, user, user.id);
      if (allocationErrors.length) {
        warnings.push({ level: 'bad', title: user.name + ' allocation', body: allocationErrors.join(' ') });
      }
      var walletCount = state.accounts.filter(function (account) { return account.userId === user.id && account.type === 'Wallet'; }).length;
      var bankCount = state.accounts.filter(function (account) { return account.userId === user.id && account.type === 'Bank'; }).length;
      if (walletCount > 1 || bankCount > 1) {
        warnings.push({ level: 'bad', title: user.name + ' ownership', body: 'Each user can have only one wallet and one bank account.' });
      }
    });
    if (isOwner() && adminAuthUsers().length && !state.adminAssignments.length) {
      warnings.push({ level: 'warn', title: 'Admin assignments', body: 'Admins exist but no assigned-client mapping has been recorded yet.' });
    }
    if (!filteredIncomes().length) {
      warnings.push({ level: 'warn', title: 'Income range', body: 'No income rows are inside the selected dates.' });
    }
    if (!warnings.length) {
      warnings.push({ level: 'ok', title: 'Checks', body: 'No warnings for the selected period.' });
    }
    setText('riskCount', warnings.length + ' checks');
    warnings.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'risk-item risk-' + item.level;
      row.innerHTML = '<strong>' + htmlEscape(item.title) + '</strong><span>' + htmlEscape(item.body) + '</span>';
      holder.appendChild(row);
    });
  }

  function setOptions(select, list, valueFn, labelFn, selectedValue) {
    if (!select) return;
    var current = selectedValue != null ? selectedValue : select.value;
    var emptyLabel = select.getAttribute('data-empty') || ('Select ' + String(select.name || 'option').replace(/Id$/, '').replace(/([A-Z])/g, ' $1').trim());
    select.innerHTML = '';
    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = list.length ? emptyLabel : 'No options available';
    select.appendChild(emptyOption);
    list.forEach(function (item) {
      var option = document.createElement('option');
      option.value = valueFn(item);
      option.textContent = labelFn(item);
      select.appendChild(option);
    });
    if (current && list.some(function (item) { return valueFn(item) === current; })) {
      select.value = current;
    } else select.value = '';
    select.disabled = !list.length || !!select.getAttribute('data-parent-empty');
  }

  function usersForClient(clientId) {
    return state.users.filter(function (user) {
      return (!clientId || user.clientId === clientId) && canSeeClient(user.clientId);
    });
  }

  function accountsForClientUser(clientId, userId) {
    return state.accounts.filter(function (account) {
      return (!clientId || account.clientId === clientId) &&
        (!userId || account.userId === userId) &&
        canSeeClient(account.clientId);
    });
  }

  function platformAccountsForClientUser(clientId, userId) {
    return state.userPlatforms.filter(function (item) {
      return (!clientId || item.clientId === clientId) &&
        (!userId || item.userId === userId) &&
        canSeeClient(item.clientId);
    });
  }

  function adminAuthUsers() {
    return state.authUsers.filter(function (item) { return item.role === 'admin'; });
  }

  function renderUserAllocationSummary() {
    var holder = document.getElementById('userAllocationSummary');
    var form = document.getElementById('userForm');
    if (!holder || !form) return;
    var clientId = form.elements.clientId.value;
    if (!clientId) {
      holder.textContent = 'Select a client to see committed capital, allocated capital, and remaining capital.';
      return;
    }
    var summary = clientCapitalSummary(clientId, form.dataset.editingId);
    var allocated = num(form.elements.allocatedCapital.value);
    var walletOpening = num(form.elements.walletOpening.value);
    var bankOpening = num(form.elements.bankOpening.value);
    var remainingAfter = summary.availableForAllocation - allocated;
    var unassignedUserCapital = allocated - walletOpening - bankOpening;
    holder.innerHTML =
      '<span>Client Invested Capital: <strong>' + money(summary.committedCapital) + '</strong></span>' +
      '<span>Client Capital Already Allocated: <strong>' + money(summary.allocatedCapital) + '</strong></span>' +
      '<span>Client Remaining Unallocated Capital: <strong>' + money(summary.remainingCapital) + '</strong></span>' +
      '<span>Amount Being Allocated to This User: <strong>' + money(allocated) + '</strong></span>' +
      '<span>Remaining Capital After This Allocation: <strong>' + money(remainingAfter) + '</strong></span>' +
      '<span>Unassigned User Capital: <strong>' + money(unassignedUserCapital) + '</strong></span>';
  }

  function refreshTransferOptions() {
    var form = document.getElementById('transferForm');
    if (!form) return;
    var f = form.elements;
    var options = workflow().transferOptions(state, {
      movementType: f.movementType.value,
      clientId: f.clientId.value,
      userId: f.userId.value,
      fromAccountId: f['from'].value,
      toAccountId: f.to.value,
      platformAccountId: f.platformAccountId.value
    });
    setOptions(f.platformAccountId, platformAccountsForClientUser(f.clientId.value, f.userId.value), function (item) { return item.id; }, platformAccountLabel);
    setOptions(f['from'], options.sourceAccounts || [], function (item) { return item.id; }, accountSelectLabel, f['from'].value);
    setOptions(f.to, options.destinationAccounts || [], function (item) { return item.id; }, accountSelectLabel, f.to.value);
  }

  function populateSelects() {
    var visibleClientRows = visibleClients();
    var portfolioFilter = document.getElementById('portfolioClientFilter');
    if (portfolioFilter) setOptions(portfolioFilter, visibleClientRows, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; }, portfolioFilter.value);

    document.querySelectorAll('select[name="accountId"]').forEach(function (select) {
      var form = select.closest('form');
      var clientId = form && form.elements.clientId ? form.elements.clientId.value : '';
      var userId = form && form.elements.userId ? form.elements.userId.value : '';
      setOptions(select, accountsForClientUser(clientId, userId), function (item) { return item.id; }, accountSelectLabel);
    });

    document.querySelectorAll('select[name="site"], select[name="platformId"]').forEach(function (select) {
      setOptions(select, state.websites, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
    });

    var allocationPlatformSelect = document.querySelector('#allocationForm select[name="platformId"]');
    if (allocationPlatformSelect) {
      setOptions(allocationPlatformSelect, [{ id: '', name: 'Choose platform', code: 'REQ' }].concat(state.websites), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
    }

    document.querySelectorAll('select[name="clientId"]').forEach(function (select) {
      setOptions(select, visibleClientRows, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
    });

    document.querySelectorAll('select[name="shareholderId"]').forEach(function (select) {
      setOptions(select, visibleShareholders(), function (item) { return item.id; }, function (item) { return shareholderLabel(item) + ' - ' + money(investorCapital(item)); });
    });

    var linkedClient = document.querySelector('#accessUserForm select[name="clientId"]');
    if (linkedClient) {
      setOptions(linkedClient, [{ id: '', name: 'No linked client', code: 'ALL' }].concat(state.clients), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
    }

    var adminAssignmentClient = document.querySelector('#adminAssignmentForm select[name="clientId"]');
    if (adminAssignmentClient) {
      setOptions(adminAssignmentClient, state.clients, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
    }

    document.querySelectorAll('select[name="authUserId"], select[name="assignedAdminId"]').forEach(function (select) {
      var rows = adminAuthUsers();
      if (select.name === 'assignedAdminId' && isAdmin()) {
        rows = rows.filter(function (item) { return item.id === currentUser.id; });
      }
      setOptions(select, rows, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.username + ')'; });
    });

    document.querySelectorAll('form').forEach(function (form) {
      if (!form.elements.clientId || !form.elements.userId) return;
      setOptions(form.elements.userId, usersForClient(form.elements.clientId.value), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
      form.elements.userId.disabled = !form.elements.clientId.value;
    });

    var exchangeForm = document.getElementById('exchangeForm');
    if (exchangeForm) {
      var ef = exchangeForm.elements;
      var exchangeAccounts = accountsForClientUser(ef.clientId.value, ef.userId.value);
      setOptions(ef.sourceBankId, exchangeAccounts.filter(function (item) { return item.type === 'Bank'; }), function (item) { return item.id; }, accountSelectLabel);
      setOptions(ef.destinationWalletId, exchangeAccounts.filter(function (item) { return item.type === 'Wallet'; }), function (item) { return item.id; }, accountSelectLabel);
      ef.sourceBankId.disabled = !ef.userId.value;
      ef.destinationWalletId.disabled = !ef.userId.value;
      renderExchangePreview();
    }

    document.querySelectorAll('select[name="platformAccountId"]').forEach(function (select) {
      var form = select.closest('form');
      var clientId = form && form.elements.clientId ? form.elements.clientId.value : '';
      var userId = form && form.elements.userId ? form.elements.userId.value : '';
      setOptions(select, platformAccountsForClientUser(clientId, userId), function (item) { return item.id; }, platformAccountLabel);
    });

    var fundingForm = document.getElementById('platformFundingForm');
    if (fundingForm) {
      setOptions(fundingForm.elements.sourceAccountId, accountsForClientUser(fundingForm.elements.clientId.value, fundingForm.elements.userId.value), function (item) { return item.id; }, accountSelectLabel);
    }

    var resultForm = document.getElementById('platformResultForm');
    if (resultForm) {
      var fundingRows = visiblePlatformFundings().filter(function (item) {
        return (!resultForm.elements.clientId.value || item.clientId === resultForm.elements.clientId.value) &&
          (!resultForm.elements.userId.value || item.userId === resultForm.elements.userId.value) &&
          (!resultForm.elements.platformAccountId.value || item.platformAccountId === resultForm.elements.platformAccountId.value);
      });
      setOptions(resultForm.elements.fundingId, fundingRows, function (item) { return item.id; }, function (item) {
        return item.id + ' / ' + money(item.amount) + ' / ' + platformAccountLabel(byId(state.userPlatforms, item.platformAccountId));
      });
      setOptions(resultForm.elements.expectedDestinationAccountId, accountsForClientUser(resultForm.elements.clientId.value, resultForm.elements.userId.value), function (item) { return item.id; }, accountSelectLabel);
    }

    var withdrawalForm = document.getElementById('withdrawalUpdateForm');
    if (withdrawalForm) {
      setOptions(withdrawalForm.elements.expectedWithdrawalId, visibleExpectedWithdrawals(), function (item) { return item.id; }, function (item) {
        return item.id + ' / ' + clientName(item.clientId) + ' / ' + money(item.expectedAmount);
      });
      var selectedWithdrawal = byId(state.expectedWithdrawals, withdrawalForm.elements.expectedWithdrawalId.value);
      setOptions(withdrawalForm.elements.destinationAccountId, selectedWithdrawal ? accountsForClientUser(selectedWithdrawal.clientId, selectedWithdrawal.userId) : [], function (item) { return item.id; }, accountSelectLabel, selectedWithdrawal ? selectedWithdrawal.destinationAccountId : '');
    }

    var questionReplyForm = document.getElementById('questionReplyForm');
    if (questionReplyForm) {
      setOptions(questionReplyForm.elements.questionId, visibleQuestions(), function (item) { return item.id; }, function (item) { return item.subject; });
    }

    var allocationForm = document.getElementById('allocationForm');
    if (allocationForm) {
      var accountRows = visiblePlatformAccounts().filter(function (item) {
        return !allocationForm.elements.platformId.value || item.platformId === allocationForm.elements.platformId.value;
      });
      setOptions(allocationForm.elements.platformAccountId, [{ id: '', label: 'Owner selection required' }].concat(accountRows), function (item) { return item.id; }, function (item) {
        if (!item.id) return item.label;
        var rule = activePlatformRule(item.platformId);
        var turnover = workflow().turnoverSummary(item, rule);
        return platformAccountLabel(item) + ' / ' + money(workflow().platformAvailableBalances(state, item).availableTotal) + ' available / ' + percent(turnover.effectiveTurnoverPercentage);
      });
    }

    var settlementForm = document.getElementById('settlementForm');
    if (settlementForm) {
      var sessions = visibleOperationalSessions().filter(function (item) {
        return item.status !== 'Settled' && item.status !== 'Cancelled';
      });
      setOptions(settlementForm.elements.sessionId, sessions, function (item) { return item.id; }, function (item) {
        return item.eventName + ' / ' + item.outcomeName + ' / ' + money(item.plannedStake);
      });
    }

    var quickFundingForm = document.getElementById('quickFundingForm');
    if (quickFundingForm) {
      var userRows = visibleUsers().filter(function (item) {
        return !calculatorSessionDraft.clientId || item.clientId === calculatorSessionDraft.clientId;
      });
      setOptions(quickFundingForm.elements.userId, userRows, function (item) { return item.id; }, function (item) { return clientName(item.clientId) + ' / ' + item.name; });
      var selectedUser = byId(state.users, quickFundingForm.elements.userId.value);
      var clientIdForFunding = selectedUser ? selectedUser.clientId : '';
      setOptions(quickFundingForm.elements.sourceAccountId, accountsForClientUser(clientIdForFunding, quickFundingForm.elements.userId.value).filter(function (item) {
        return item.type === 'Wallet' || item.type === 'Bank';
      }), function (item) { return item.id; }, accountSelectLabel);
      setOptions(quickFundingForm.elements.platformAccountId, platformAccountsForClientUser(clientIdForFunding, quickFundingForm.elements.userId.value), function (item) { return item.id; }, platformAccountOptionLabel);
    }

    var sessionAccountPoolForm = document.getElementById('sessionAccountPoolForm');
    if (sessionAccountPoolForm) {
      var sessionClients = visibleClientRows.filter(function (item) {
        return !calculatorSessionDraft.clientId || item.id === calculatorSessionDraft.clientId;
      });
      setOptions(sessionAccountPoolForm.elements.clientId, sessionClients, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; }, calculatorSessionDraft.clientId || sessionAccountPoolForm.elements.clientId.value);
      setOptions(sessionAccountPoolForm.elements.userId, usersForClient(sessionAccountPoolForm.elements.clientId.value), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
      setOptions(sessionAccountPoolForm.elements.platformId, state.websites, function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
      var poolIds = sessionPoolAccountIds();
      var poolRows = platformAccountsForClientUser(sessionAccountPoolForm.elements.clientId.value, sessionAccountPoolForm.elements.userId.value).filter(function (item) {
        return (!sessionAccountPoolForm.elements.platformId.value || item.platformId === sessionAccountPoolForm.elements.platformId.value) && poolIds.indexOf(item.id) === -1;
      });
      setOptions(sessionAccountPoolForm.elements.platformAccountId, poolRows, function (item) { return item.id; }, platformAccountOptionLabel);
      var selectedPoolAccount = byId(state.userPlatforms, sessionAccountPoolForm.elements.platformAccountId.value);
      if (selectedPoolAccount) {
        var selectedPoolBalances = workflow().platformAvailableBalances(state, selectedPoolAccount);
        var selectedPoolTurnover = workflow().turnoverSummary(selectedPoolAccount, activePlatformRule(selectedPoolAccount.platformId));
        if (!sessionAccountPoolForm.elements.cashBalance.value) sessionAccountPoolForm.elements.cashBalance.value = selectedPoolBalances.cashBalance;
        if (!sessionAccountPoolForm.elements.bonusBalance.value) sessionAccountPoolForm.elements.bonusBalance.value = selectedPoolBalances.bonusBalance;
        if (!sessionAccountPoolForm.elements.freeBetBalance.value) sessionAccountPoolForm.elements.freeBetBalance.value = num(selectedPoolAccount.freeBetBalance);
        if (!sessionAccountPoolForm.elements.remainingTurnover.value) sessionAccountPoolForm.elements.remainingTurnover.value = selectedPoolTurnover.remainingTurnoverAmount;
        if (!sessionAccountPoolForm.elements.addedAt.value) sessionAccountPoolForm.elements.addedAt.value = nowIso().slice(0, 16);
      }
    }

    var operationExportFilters = document.getElementById('operationExportFilters');
    if (operationExportFilters) {
      var exportClientId = operationExportFilters.elements.exportClientId.value;
      var exportUserId = operationExportFilters.elements.exportUserId.value;
      var exportPlatformId = operationExportFilters.elements.exportPlatformId.value;
      setOptions(operationExportFilters.elements.exportClientId, [{ id: '', name: 'All clients', code: 'ALL' }].concat(visibleClientRows), function (item) { return item.id; }, function (item) { return item.id ? item.name + ' (' + item.code + ')' : item.name; }, exportClientId);
      var exportUsers = visibleUsers().filter(function (item) { return !operationExportFilters.elements.exportClientId.value || item.clientId === operationExportFilters.elements.exportClientId.value; });
      setOptions(operationExportFilters.elements.exportUserId, [{ id: '', name: 'All users', code: 'ALL' }].concat(exportUsers), function (item) { return item.id; }, function (item) { return item.id ? clientName(item.clientId) + ' / ' + item.name : item.name; }, exportUserId);
      setOptions(operationExportFilters.elements.exportPlatformId, [{ id: '', name: 'All platforms', code: 'ALL' }].concat(state.websites), function (item) { return item.id; }, function (item) { return item.id ? item.name + ' (' + item.code + ')' : item.name; }, exportPlatformId);
      var exportAccounts = state.userPlatforms.filter(function (item) {
        return (!operationExportFilters.elements.exportClientId.value || item.clientId === operationExportFilters.elements.exportClientId.value) &&
          (!operationExportFilters.elements.exportUserId.value || item.userId === operationExportFilters.elements.exportUserId.value) &&
          (!operationExportFilters.elements.exportPlatformId.value || item.platformId === operationExportFilters.elements.exportPlatformId.value);
      });
      setOptions(operationExportFilters.elements.exportPlatformAccountId, [{ id: '', name: 'All accounts' }].concat(exportAccounts), function (item) { return item.id; }, function (item) { return item.id ? platformAccountOptionLabel(item) : item.name; });
    }

    var taskForm = document.getElementById('taskForm');
    if (taskForm) {
      setOptions(taskForm.elements.userId, usersForClient(taskForm.elements.clientId.value), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
      setOptions(taskForm.elements.platformAccountId, platformAccountsForClientUser(taskForm.elements.clientId.value, taskForm.elements.userId.value), function (item) { return item.id; }, platformAccountLabel);
      setOptions(taskForm.elements.expectedWithdrawalId, visibleExpectedWithdrawals(), function (item) { return item.id; }, function (item) { return item.id + ' / ' + money(item.expectedAmount); });
    }

    refreshTransferOptions();
    renderUserAllocationSummary();
    setDefaultDates();
  }

  function setDefaultDates() {
    document.querySelectorAll('form input[type="date"]').forEach(function (input) {
      if (!input.value) input.value = filters.to || '2026-06-17';
    });
  }

  function updateRoutePreviews() {
    var transferForm = document.getElementById('transferForm');
    var incomeForm = document.getElementById('incomeForm');
    var costForm = document.getElementById('costForm');
    if (transferForm) {
      var transferPlatform = byId(state.userPlatforms, transferForm.elements.platformAccountId.value);
      var transferKind = transferForm.elements.movementType.value === 'Platform Funding' ? 'PFD' : (transferForm.elements.movementType.value === 'Platform Withdrawal' ? 'PWD' : 'TRF');
      var fromId = transferForm.elements.movementType.value === 'Platform Withdrawal' ? transferForm.elements.platformAccountId.value : transferForm.elements['from'].value;
      var toId = transferForm.elements.movementType.value === 'Platform Funding' ? transferForm.elements.platformAccountId.value : transferForm.elements.to.value;
      transferForm.elements.routeCode.value = buildRoute(transferKind, transferForm.elements.date.value, transferForm.elements.clientId.value, transferForm.elements.userId.value, transferPlatform ? transferPlatform.platformId : '', fromId, toId);
    }
    if (incomeForm) {
      incomeForm.elements.routeCode.value = buildRoute('INC', incomeForm.elements.date.value, incomeForm.elements.clientId.value, incomeForm.elements.userId.value, incomeForm.elements.site.value, incomeForm.elements.site.value, incomeForm.elements.accountId.value);
    }
    if (costForm) {
      costForm.elements.routeCode.value = buildRoute('CST', costForm.elements.date.value, costForm.elements.clientId.value, costForm.elements.userId.value, costForm.elements.platformId.value, costForm.elements.accountId.value, 'expense');
    }
  }

  function handleDelete(type, id) {
    removeRecord(type, id);
  }

  function wireForms() {
    document.getElementById('calculatorSessionForm').addEventListener('input', function () {
      updateCalculatorSessionDraftFromForm();
      renderSessionAccountPool();
      renderSessionEvents();
      activeCalculatorSessionId = '';
      renderCompactCalculator();
    });

    document.getElementById('sessionAccountPoolForm').addEventListener('submit', addAccountToActiveSession);

    document.getElementById('calculatorCellEditorForm').addEventListener('submit', function (event) {
      event.preventDefault();
      applyCalculatorCellEditor('apply');
    });

    document.getElementById('betStructure').addEventListener('change', function () {
      if (this.value === 'Mix') ensureMixDraft();
      currentMixSuggestion = null;
      renderMixWorkspace();
    });

    ['singleFreeBetStake', 'singleFreeBetOdds'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', renderSingleFreeBetValuation);
    });

    ['mixMainAccount', 'mixTicketReference', 'mixCashPortion', 'mixBonusPortion', 'mixFreeBetPortion', 'mixMinimumGap', 'mixRecommendedGap', 'mixPrimaryGoal', 'mixSecondaryGoal', 'mixTargetReturn'].forEach(function (id) {
      var node = document.getElementById(id);
      node.addEventListener(node.tagName === 'SELECT' ? 'change' : 'input', function () {
        syncMixDraftFromControls();
        currentMixSuggestion = null;
        renderMixWorkspace();
      });
    });

    document.getElementById('mixLegForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      syncMixDraftFromControls();
      var selectedEvent = calculatorSessionEvents.filter(function (item) { return item.id === f.eventId.value; })[0];
      if (!selectedEvent && activeCalculatorEventId === f.eventId.value) selectedEvent = { id: activeCalculatorEventId, eventName: calculatorEventName() };
      var eventName = f.eventName.value || (selectedEvent && selectedEvent.eventName) || '';
      try {
        currentMixDraft = window.AtlasMixService.addLeg(currentMixDraft, {
          eventId: selectedEvent ? selectedEvent.id : '',
          eventName: eventName,
          market: f.market.value,
          outcome: f.outcome.value,
          lockedOdds: num(f.lockedOdds.value),
          eventStartTime: f.eventStartTime.value,
          expectedSettlementTime: f.expectedSettlementTime.value
        }, mixActor());
        calculatorSessionDraft.history.push(sessionHistory('Mix leg added', eventName));
        event.currentTarget.reset();
        currentMixSuggestion = null;
        renderMixWorkspace();
      } catch (error) {
        window.alert(error.message);
      }
    });

    document.getElementById('newMixTicket').addEventListener('click', function () {
      currentMixDraft = null;
      currentMixSuggestion = null;
      ensureMixDraft();
      renderMixWorkspace();
    });

    document.getElementById('saveMixDraft').addEventListener('click', function () {
      persistCurrentMix('Mix draft saved');
      render();
    });

    document.getElementById('lockMixTicket').addEventListener('click', function () {
      var mix = syncMixDraftFromControls();
      var capacity = mixBalanceCapacity(mix);
      var balanceErrors = [];
      if (mix.cashPortion > capacity.cash) balanceErrors.push('Cash Portion exceeds remaining Session cash.');
      if (mix.normalBonusPortion > capacity.normalBonus) balanceErrors.push('Normal Bonus Portion exceeds remaining Session bonus.');
      if (mix.freeBetPortion > capacity.freeBet) balanceErrors.push('Free Bet Portion exceeds remaining Session Free Bet balance.');
      if (balanceErrors.length) { window.alert(balanceErrors.join('\n')); return; }
      var hardGaps = window.AtlasMixService.timeGapValidation(mix).filter(function (gap) { return gap.requiresOwnerOverride; });
      var override = null;
      if (hardGaps.length) {
        if (!window.confirm('INSUFFICIENT TIME BETWEEN MIX LEGS. Use Owner override?')) return;
        var reason = String((document.getElementById('mixOverrideReason') || {}).value || '').trim();
        if (!reason) { window.alert('Owner override note is required.'); return; }
        override = { confirmed: true, reason: reason };
      }
      try {
        currentMixDraft = window.AtlasMixService.lockMix(mix, mixActor(), override);
        persistCurrentMix('Mix ticket locked');
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });

    document.getElementById('placeMixTicket').addEventListener('click', function () {
      var mix = syncMixDraftFromControls();
      if (!mix.lockedAt || mix.status === 'Draft') { window.alert('Lock the Mix ticket before confirming placement.'); return; }
      if (mix.turnoverPosted) { window.alert('This Mix has already been marked as placed.'); return; }
      if (!window.confirm('Confirm that the Owner placed this Mix ticket? Atlas will post the selected balance portions and turnover.')) return;
      try {
        recordMixPlacement(mix);
        currentMixDraft = mix;
        persistCurrentMix('Mix ticket placed');
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });

    document.getElementById('generateMixSuggestion').addEventListener('click', function () {
      syncMixDraftFromControls();
      currentMixSuggestion = window.AtlasMixService.suggestion(currentMixDraft, document.getElementById('mixSuggestionOdds').value);
      if (!currentMixSuggestion) window.alert('Add chronological legs and enter valid hedge odds first.');
      if (currentMixSuggestion) {
        currentMixDraft.auditHistory.push({
          id: uid('mixaudit'),
          action: 'Hedge suggested',
          userId: currentUser ? currentUser.id : '',
          role: currentRole(),
          createdAt: nowIso(),
          previousValue: null,
          newValue: clone(currentMixSuggestion),
          reason: currentMixSuggestion.reason,
          clientId: currentMixDraft.clientId,
          sessionId: calculatorSessionDraft.id
        });
      }
      renderMixSuggestion();
    });

    document.getElementById('mixHedgeForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var mix = syncMixDraftFromControls();
      var active = window.AtlasMixService.activeLeg(mix);
      var account = byId(state.userPlatforms, f.platformAccountId.value);
      if (!active) { window.alert('There is no Current Active Leg.'); return; }
      if (!account || !poolEntryByAccountId(account.id)) { window.alert('Select an eligible Account from this Session Pool.'); return; }
      var stake = num(f.stakeAmount.value);
      var odds = num(f.lockedOdds.value);
      var evaluation = workflow().evaluatePlatformAccount(state, {
        eventId: active.eventId || active.id,
        marketName: active.market,
        marketType: 'Three Outcome',
        outcomeName: f.outcome.value,
        platformId: account.platformId,
        odds: odds,
        stake: stake,
        potentialPayout: stake * odds
      }, account);
      if (evaluation.errors.length) { window.alert(evaluation.errors.join('\n')); return; }
      try {
        currentMixDraft = window.AtlasMixService.addHedge(mix, {
          clientId: account.clientId,
          userId: account.userId,
          platformId: account.platformId,
          platformAccountId: account.id,
          legId: active.id,
          outcome: f.outcome.value,
          stakeType: f.stakeType.value,
          stakeAmount: stake,
          lockedOdds: odds,
          executedStatus: f.executedStatus.value,
          createdBy: currentUser ? currentUser.id : ''
        }, mixActor());
        var hedge = currentMixDraft.hedges[currentMixDraft.hedges.length - 1];
        recordExecutedHedgeBalance(currentMixDraft, hedge);
        persistCurrentMix('Mix hedge allocation recorded');
        currentMixSuggestion = null;
        event.currentTarget.reset();
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });

    document.getElementById('mixLegResultForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var result = event.currentTarget.elements.result.value;
      var mix = syncMixDraftFromControls();
      var active = window.AtlasMixService.activeLeg(mix);
      if (!mix.turnoverPosted) { window.alert('Confirm the Mix as placed before entering a result.'); return; }
      if (!active || !result) { window.alert('Select a result for the Current Active Leg.'); return; }
      try {
        currentMixDraft = window.AtlasMixService.recordLegResult(mix, active.id, result, mixActor());
        postMixSettlementBalances(currentMixDraft);
        persistCurrentMix('Mix leg result recorded');
        currentMixSuggestion = null;
        event.currentTarget.reset();
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });

    document.getElementById('viewMixReport').addEventListener('click', function () {
      var panel = document.getElementById('mixReportPanel');
      panel.hidden = !panel.hidden;
      this.textContent = panel.hidden ? 'Mix Details' : 'Hide Mix Details';
    });

    document.getElementById('calculatorSetupForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var result = calculateDraft();
      if (result.warnings.length) {
        state.auditLogs.push(workflow().createAudit({
          userId: currentUser ? currentUser.id : '',
          role: currentRole(),
          action: 'Calculator run with warnings',
          entityType: 'Calculator',
          entityId: slug(calculatorDraft.eventName || 'EVENT', 'EVENT'),
          newValue: { warnings: result.warnings, totalStake: result.totalStake }
        }));
        saveState();
      }
      renderCalculator();
    });

    document.getElementById('resetCalculatorOutcomes').addEventListener('click', function () {
      updateCalculatorDraftFromForm();
      calculatorDraft.outcomes = window.AtlasCalculatorService.makeOutcomeDefaults(calculatorDraft.marketType);
      calculatorResult = null;
      renderCalculator();
    });

    document.getElementById('saveCalculatorSession').addEventListener('click', function () {
      if (!isOwner()) {
        activateView('noAccess');
        return;
      }
      var result = calculatorResult || calculateDraft();
      if (!result || !result.outcomeRows.length) {
        window.alert('Calculate stakes before saving a calculator session.');
        return;
      }
      var session = {
        id: uid('calc'),
        sessionName: calculatorSessionName(),
        clientId: calculatorSessionDraft.clientId,
        targetReturnPercentage: calculatorSessionDraft.targetReturnPercentage,
        objective: calculatorSessionDraft.objective,
        description: calculatorSessionDraft.description,
        eventName: calculatorEventName(),
        startDate: calculatorSessionDraft.startDate,
        expectedEndDate: calculatorSessionDraft.expectedEndDate,
        expectedRolloverDate: calculatorSessionDraft.expectedRolloverDate,
        eventDate: calculatorDraft.eventDate,
        marketType: calculatorDraft.marketType,
        marketName: calculatorDraft.marketName,
        settlementPeriod: calculatorDraft.settlementPeriod,
        notes: calculatorSessionDraft.notes || calculatorDraft.notes,
        input: clone(calculatorDraft),
        result: clone(result),
        accountPool: clone(sessionPoolEntries()),
        events: clone(calculatorSessionEvents.concat([{ id: activeCalculatorEventId, eventName: calculatorEventName(), input: clone(calculatorDraft), result: clone(result), assignments: currentEventAssignments(), status: 'Calculated' }])),
        assignments: currentEventAssignments(),
        history: clone(calculatorSessionDraft.history.concat([sessionHistory('Calculation saved', calculatorEventName())])),
        status: 'Calculated',
        createdBy: currentUser ? currentUser.id : '',
        createdAt: nowIso()
      };
      state.calculatorSessions.push(session);
      activeCalculatorSessionId = session.id;
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: 'Calculator session saved',
        entityType: 'CalculatorSession',
        entityId: session.id,
        newValue: session
      }));
      saveState();
      renderCalculator();
    });

    document.getElementById('quickFundingForm').addEventListener('submit', recordQuickFunding);

    document.getElementById('exchangeForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var f = form.elements;
      var bank = byId(state.accounts, f.sourceBankId.value);
      var wallet = byId(state.accounts, f.destinationWalletId.value);
      var amount = num(f.sourceAmount.value);
      var rate = num(f.exchangeRate.value);
      var gross = amount * rate;
      var fee = gross * num(f.feePercentage.value) / 100 + num(f.fixedFee.value);
      var net = gross - fee;
      var errors = [];
      if (!bank || bank.type !== 'Bank') errors.push('Select a source bank.');
      if (!wallet || wallet.type !== 'Wallet') errors.push('Select a destination wallet.');
      if (bank && wallet && (bank.clientId !== wallet.clientId || bank.userId !== wallet.userId)) errors.push('Exchange is limited to the same client and user.');
      if (amount <= 0 || rate <= 0 || net < 0) errors.push('Enter a valid amount, rate, and fees.');
      if (bank && num(walletBalances()[bank.id]) < amount) errors.push('INSUFFICIENT BANK BALANCE. Missing ' + money(amount - num(walletBalances()[bank.id])) + '.');
      if (errors.length) { window.alert(errors.join('\n')); return; }
      var id = uid('ex');
      var exchange = { id: id, clientId: bank.clientId, userId: bank.userId, sourceBankId: bank.id, destinationWalletId: wallet.id, sourceAmount: amount, exchangeRate: rate, grossAmount: gross, feePercentage: num(f.feePercentage.value), fixedFee: num(f.fixedFee.value), totalFee: fee, netAmount: net, date: f.date.value, reference: f.reference.value, notes: f.notes.value, status: isOwner() ? 'Executed' : 'Pending Owner Approval', createdBy: currentUser.id, createdAt: nowIso() };
      if (isOwner()) {
        state.exchanges.push(exchange);
        ['Bank Debit', 'Exchange Conversion', 'Exchange Fee', 'Wallet Credit'].forEach(function (type) {
          state.moneyPlacements.push({ id: uid('place'), clientId: bank.clientId, userId: bank.userId, type: type, previousLocation: type === 'Wallet Credit' ? 'Exchange' : bank.name, currentLocation: type === 'Wallet Credit' ? wallet.name : 'Exchange', amount: type === 'Exchange Fee' ? fee : (type === 'Wallet Credit' ? net : amount), currency: wallet.currency || 'USD', date: exchange.date, status: 'Executed', relatedTransactionId: id, createdAt: nowIso() });
        });
      } else {
        state.approvalRequests.push({ id: uid('approval'), type: 'Bank Exchange', clientId: bank.clientId, userId: bank.userId, sourceAccountId: bank.id, destinationAccountId: wallet.id, amount: amount, status: 'Pending Owner Approval', notes: exchange.notes, payload: exchange, createdBy: currentUser.id, submittedAt: nowIso(), history: [] });
      }
      state.auditLogs.push(workflow().createAudit({ userId: currentUser.id, role: currentRole(), action: 'Bank exchange ' + exchange.status, entityType: 'Exchange', entityId: id, newValue: exchange }));
      form.reset(); saveState(); render();
    });

    document.getElementById('contributionForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var row = { id: uid('contrib'), clientId: f.clientId.value, amount: num(f.amount.value), date: f.date.value, currency: f.currency.value || 'USD', fundingSource: f.fundingSource.value, notes: f.notes.value, status: 'Approved', createdBy: currentUser.id, approvedBy: currentUser.id, createdAt: nowIso() };
      if (!row.clientId || row.amount <= 0) { window.alert('Select a client and enter a positive contribution.'); return; }
      state.capitalContributions.push(row);
      state.moneyPlacements.push({ id: uid('place'), clientId: row.clientId, userId: '', type: 'Additional Capital Contribution', previousLocation: row.fundingSource, currentLocation: 'Unallocated Client Capital', amount: row.amount, currency: row.currency, date: row.date, status: 'Executed', relatedTransactionId: row.id, createdAt: nowIso() });
      state.auditLogs.push(workflow().createAudit({ userId: currentUser.id, role: currentRole(), action: 'Additional capital contribution recorded', entityType: 'CapitalContribution', entityId: row.id, newValue: row }));
      event.currentTarget.reset(); saveState(); render();
    });

    document.getElementById('transferForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var platformAccount = byId(state.userPlatforms, f.platformAccountId.value);
      var movement = {
        date: f.date.value,
        movementType: f.movementType.value,
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: platformAccount ? platformAccount.platformId : '',
        platformAccountId: f.platformAccountId.value,
        from: f['from'].value,
        to: f.to.value,
        counterparty: f.counterparty.value,
        amount: num(f.amount.value),
        fee: num(f.fee.value),
        note: f.note.value || 'Manual transfer',
        routeCode: f.routeCode.value,
        status: 'Completed',
        currency: 'USD',
        createdBy: currentUser ? currentUser.id : '',
        createdAt: nowIso()
      };
      var transferErrors = workflow().validateTransfer(state, {
        movementType: movement.movementType,
        clientId: movement.clientId,
        userId: movement.userId,
        fromAccountId: movement.from,
        toAccountId: movement.to,
        platformAccountId: movement.platformAccountId,
        amount: movement.amount
      });
      if (transferErrors.length) {
        window.alert(transferErrors.join('\n'));
        return;
      }
      var sourceSummary = walletBalanceSummary(movement.from);
      var requested = movement.amount + movement.fee;
      if (requested > sourceSummary.available) {
        var sources = fundingSources(movement.clientId, movement.from);
        window.alert('INSUFFICIENT WALLET BALANCE\nRequested: ' + money(requested) + '\nAvailable: ' + money(sourceSummary.available) + '\nMissing: ' + money(requested - sourceSummary.available) + '\n\nSame-client funding sources:\n' + (sources.map(function (row) { return accountSelectLabel(row.account) + ': ' + money(row.available); }).join('\n') || 'None available'));
        return;
      }
      if (isAdmin()) {
        movement.status = 'Pending Owner Approval';
        state.transfers.push(movement);
        state.approvalRequests.push({ id: uid('approval'), type: movement.movementType, clientId: movement.clientId, userId: movement.userId, sourceAccountId: movement.from, destinationAccountId: movement.to, amount: requested, status: 'Pending Owner Approval', notes: movement.note, payload: movement, createdBy: currentUser.id, submittedAt: nowIso(), history: [] });
        event.currentTarget.reset(); saveState(); render(); return;
      }
      saveRecord('Transfer', 'tr', event.currentTarget, movement);
    });

    document.getElementById('incomeForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      saveRecord('Income', 'inc', event.currentTarget, {
        date: f.date.value,
        clientId: f.clientId.value,
        userId: f.userId.value,
        site: f.site.value,
        accountId: f.accountId.value,
        bet: num(f.bet.value),
        siteAmount: num(f.siteAmount.value),
        benefit: num(f.benefit.value),
        routeCode: f.routeCode.value
      });
    });

    document.getElementById('costForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      saveRecord('Cost', 'cost', event.currentTarget, {
        date: f.date.value,
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: f.platformId.value,
        owner: f.owner.value,
        accountId: f.accountId.value,
        category: f.category.value || 'Operations',
        amount: num(f.amount.value),
        description: f.description.value,
        routeCode: f.routeCode.value
      });
    });

    document.getElementById('paymentForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var shareholder = byId(state.shareholders, f.shareholderId.value);
      if (!shareholder) {
        window.alert('Select a shareholder/client before adding a payment.');
        return;
      }
      if (num(f.amount.value) <= 0) {
        window.alert('Payment amount must be positive.');
        return;
      }
      saveRecord('Payment', 'pay', event.currentTarget, {
        date: f.date.value,
        shareholderId: f.shareholderId.value,
        clientId: shareholder.clientId,
        amount: num(f.amount.value),
        status: f.status.value,
        reference: f.reference.value,
        paymentDate: f.paymentDate.value,
        note: f.note.value
      });
    });

    document.getElementById('shareholderForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var data = {
        clientId: f.clientId.value,
        investment: num(f.investment.value),
        profitSharePercentage: num(f.profitSharePercentage.value),
        investmentDate: f.investmentDate.value,
        currency: f.currency.value || 'USD',
        status: f.status.value,
        note: f.note.value
      };
      var errors = window.AtlasProfitService.validateShareholder(data);
      if (errors.length) {
        window.alert(errors.join('\n'));
        return;
      }
      saveRecord('Shareholder', 'sh', event.currentTarget, {
        clientId: data.clientId,
        investment: data.investment,
        profitSharePercentage: data.profitSharePercentage,
        investmentDate: data.investmentDate,
        currency: data.currency,
        status: data.status,
        note: data.note
      });
    });

    document.getElementById('clientForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      saveRecord('Client', 'client', event.currentTarget, { name: f.name.value, code: slug(f.code.value || f.name.value, 'CLT') });
    });

    document.getElementById('userForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var form = event.currentTarget;
      var userId = form.dataset.editingId || uid('user');
      var userData = {
        id: userId,
        clientId: f.clientId.value,
        name: f.name.value,
        code: slug(f.code.value || f.name.value, 'USR'),
        allocatedCapital: num(f.allocatedCapital.value),
        walletOpening: num(f.walletOpening.value),
        bankOpening: num(f.bankOpening.value),
        status: f.status.value,
        note: f.note.value
      };
      var allocationErrors = workflow().validateUserAllocation(state, userData, form.dataset.editingId);
      if (allocationErrors.length) {
        window.alert(allocationErrors.join('\n'));
        return;
      }
      if (form.dataset.editingId) {
        state.users = state.users.map(function (item) { return item.id === userId ? userData : item; });
      } else {
        state.users.push(userData);
      }

      var existingWallet = state.accounts.filter(function (item) { return item.userId === userId && item.type === 'Wallet'; })[0];
      if (!existingWallet) {
        state.accounts.push({
          id: uid('acc'),
          clientId: userData.clientId,
          userId: userId,
          platformId: '',
          name: userData.name + ' Wallet',
          code: slug(userData.code + 'WL', 'WALLET'),
          type: 'Wallet',
          owner: 'Client User',
          opening: userData.walletOpening
        });
      }
      var existingBank = state.accounts.filter(function (item) { return item.userId === userId && item.type === 'Bank'; })[0];
      if (!existingBank) {
        state.accounts.push({
          id: uid('acc'),
          clientId: userData.clientId,
          userId: userId,
          platformId: '',
          name: userData.name + ' Bank',
          code: slug(userData.code + 'BK', 'BANK'),
          type: 'Bank',
          owner: 'Client User',
          opening: userData.bankOpening
        });
      }

      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: form.dataset.editingId ? 'User updated' : 'User created',
        entityType: 'User',
        entityId: userId,
        newValue: userData
      }));
      form.reset();
      resetFormMode(form);
      saveState();
      render();
    });

    document.getElementById('websiteForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      saveRecord('Website', 'site', event.currentTarget, { name: f.name.value, code: slug(f.name.value, 'PLT'), type: f.type.value });
    });

    document.getElementById('platformRuleForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!isOwner()) {
        activateView('noAccess');
        return;
      }
      var f = event.currentTarget.elements;
      var form = event.currentTarget;
      var ruleId = form.dataset.editingId || uid('rule');
      var previous = byId(state.platformRules, ruleId);
      var ruleData = {
        id: ruleId,
        platformId: f.platformId.value,
        platformStatus: f.platformStatus.value,
        defaultCurrency: f.defaultCurrency.value || 'USD',
        turnoverPercentage: num(f.turnoverPercentage.value),
        turnoverMethod: f.turnoverMethod.value,
        minEligibleOdds: num(f.minEligibleOdds.value),
        maxEligibleOdds: f.maxEligibleOdds.value === '' ? '' : num(f.maxEligibleOdds.value),
        maxStake: f.maxStake.value === '' ? '' : num(f.maxStake.value),
        maxPayout: f.maxPayout.value === '' ? '' : num(f.maxPayout.value),
        bonusTypesSupported: f.bonusTypesSupported.value,
        sameAccountMultipleOutcomes: f.sameAccountMultipleOutcomes.value === 'true',
        maxOutcomesPerEvent: Math.max(1, Math.floor(num(f.maxOutcomesPerEvent.value) || 1)),
        sameAccountAcrossMarkets: f.sameAccountAcrossMarkets.value === 'true',
        multipleAccountsOneOutcome: f.multipleAccountsOneOutcome.value === 'true',
        twoOfThreeOutcomesAllowed: f.twoOfThreeOutcomesAllowed.value,
        manualApprovalRequired: f.manualApprovalRequired.value === 'true',
        effectiveDate: f.effectiveDate.value,
        lastReviewedDate: f.lastReviewedDate.value,
        changeReason: f.changeReason.value,
        notes: f.notes.value,
        updatedAt: nowIso(),
        updatedBy: currentUser ? currentUser.id : ''
      };
      if (!ruleData.platformId || !ruleData.changeReason) {
        window.alert('Platform and change reason are required.');
        return;
      }
      var versionId = uid('rulever');
      var version = {
        id: versionId,
        platformId: ruleData.platformId,
        ruleId: ruleId,
        ruleSnapshot: clone(ruleData),
        createdBy: currentUser ? currentUser.id : '',
        createdAt: nowIso(),
        changeReason: ruleData.changeReason,
        previousVersionId: previous ? latestRuleVersionId(previous.platformId) : ''
      };
      ruleData.currentVersionId = versionId;
      if (form.dataset.editingId) {
        state.platformRules = state.platformRules.map(function (item) { return item.id === ruleId ? ruleData : item; });
      } else {
        state.platformRules.push(ruleData);
      }
      state.platformRuleVersions.push(version);
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: previous ? 'Platform rule updated' : 'Platform rule created',
        entityType: 'PlatformRule',
        entityId: ruleId,
        previousValue: previous || null,
        newValue: ruleData
      }));
      form.reset();
      resetFormMode(form);
      saveState();
      render();
    });

    document.getElementById('platformAccountForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var rule = activePlatformRule(f.platformId.value);
      var turnoverInput = {
        platformId: f.platformId.value,
        fundingAmount: num(f.fundingAmount.value),
        bonusAmount: num(f.bonusAmount.value),
        turnoverPercentageOverride: f.turnoverPercentageOverride.value,
        completedTurnover: num(f.completedTurnover.value),
        customEligibleAmount: num(f.customEligibleAmount.value)
      };
      var turnover = workflow().turnoverSummary(turnoverInput, rule);
      var platformData = {
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: f.platformId.value,
        username: f.username.value,
        accountCode: slug(f.accountCode.value || f.username.value, 'PLTACC'),
        status: f.status.value,
        cashBalance: num(f.cashBalance.value),
        bonusBalance: num(f.bonusBalance.value),
        freeBetBalance: num(f.freeBetBalance.value),
        bonusType: f.bonusType.value,
        bonusExpiry: f.bonusExpiry.value,
        fundingAmount: turnoverInput.fundingAmount,
        bonusAmount: turnoverInput.bonusAmount,
        turnoverPercentageOverride: f.turnoverPercentageOverride.value,
        completedTurnover: turnover.completedTurnoverAmount,
        customEligibleAmount: turnoverInput.customEligibleAmount,
        requiredTurnoverAmount: turnover.requiredTurnoverAmount,
        remainingTurnoverAmount: turnover.remainingTurnoverAmount
      };
      var platformErrors = workflow().validatePlatformAccount(state, platformData);
      if (platformErrors.length) {
        window.alert(platformErrors.join('\n'));
        return;
      }
      saveRecord('UserPlatform', 'up', event.currentTarget, platformData);
    });

    document.getElementById('accountForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var accountData = {
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: '',
        name: f.name.value,
        code: slug(f.name.value, 'ACC'),
        type: f.type.value,
        owner: f.owner.value,
        opening: num(f.opening.value)
        ,reservedBalance: num(f.reservedBalance.value)
        ,safetyMargin: num(f.safetyMargin.value)
        ,currency: f.currency.value || 'USD'
      };
      var accountErrors = workflow().validateAccount(state, accountData, event.currentTarget.dataset.editingId);
      if (accountErrors.length) {
        window.alert(accountErrors.join('\n'));
        return;
      }
      saveRecord('Account', 'acc', event.currentTarget, accountData);
    });

    document.getElementById('accessUserForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      saveRecord('AuthUser', 'auth', event.currentTarget, {
        name: f.name.value,
        username: f.username.value,
        password: f.password.value,
        role: f.role.value,
        clientId: f.clientId.value
      });
    });

    document.getElementById('adminAssignmentForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var exists = state.adminAssignments.filter(function (item) {
        return item.authUserId === f.authUserId.value && item.clientId === f.clientId.value && item.id !== event.currentTarget.dataset.editingId;
      })[0];
      if (exists) {
        window.alert('This admin is already assigned to that client.');
        return;
      }
      saveRecord('AdminAssignment', 'asn', event.currentTarget, {
        authUserId: f.authUserId.value,
        clientId: f.clientId.value
      });
    });

    document.getElementById('platformFundingForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var sourceAccount = byId(state.accounts, f.sourceAccountId.value);
      var fundingErrors = workflow().validatePlatformFunding(state, {
        clientId: f.clientId.value,
        userId: f.userId.value,
        sourceAccountId: f.sourceAccountId.value,
        platformAccountId: f.platformAccountId.value,
        amount: num(f.amount.value)
      });
      if (fundingErrors.length) {
        window.alert(fundingErrors.join('\n'));
        return;
      }
      var fundingBalance = walletBalanceSummary(f.sourceAccountId.value);
      if (num(f.amount.value) > fundingBalance.available) {
        window.alert('INSUFFICIENT WALLET BALANCE\nRequested: ' + money(f.amount.value) + '\nAvailable: ' + money(fundingBalance.available) + '\nMissing: ' + money(num(f.amount.value) - fundingBalance.available));
        return;
      }
      var createdFunding = workflow().createPlatformFunding(state, {
        date: f.date.value,
        clientId: f.clientId.value,
        userId: f.userId.value,
        sourceType: sourceAccount ? sourceAccount.type : '',
        sourceAccountId: f.sourceAccountId.value,
        platformAccountId: f.platformAccountId.value,
        amount: num(f.amount.value),
        currency: f.currency.value || 'USD',
        notes: f.notes.value,
        assignedAuthUserId: (state.adminAssignments.filter(function (item) { return item.clientId === f.clientId.value; })[0] || {}).authUserId || ''
      }, currentActor());
      state.platformFundings.push(createdFunding.funding);
      state.notifications.push(createdFunding.notification);
      state.auditLogs.push(createdFunding.audit);
      event.currentTarget.reset();
      saveState();
      render();
    });

    document.getElementById('platformResultForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var funding = byId(state.platformFundings, f.fundingId.value);
      var platformAccount = byId(state.userPlatforms, f.platformAccountId.value);
      var resultErrors = workflow().validatePlatformResult(state, {
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: platformAccount ? platformAccount.platformId : '',
        platformAccountId: f.platformAccountId.value,
        fundingId: f.fundingId.value,
        resultAmount: num(f.resultAmount.value),
        expectedWithdrawalAmount: num(f.expectedWithdrawalAmount.value),
        remainingInsidePlatform: num(f.remainingInsidePlatform.value),
        platformFees: num(f.platformFees.value)
      });
      if (resultErrors.length) {
        window.alert(resultErrors.join('\n'));
        return;
      }
      var createdResult = workflow().createPlatformResult(state, {
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformId: platformAccount ? platformAccount.platformId : '',
        platformAccountId: f.platformAccountId.value,
        fundingId: f.fundingId.value,
        originalAmount: num(f.originalAmount.value || (funding && funding.amount)),
        resultDate: f.resultDate.value,
        resultAmount: num(f.resultAmount.value),
        expectedWithdrawalAmount: num(f.expectedWithdrawalAmount.value),
        remainingInsidePlatform: num(f.remainingInsidePlatform.value),
        platformFees: num(f.platformFees.value),
        expectedDestinationAccountId: f.expectedDestinationAccountId.value,
        assignedAdminId: f.assignedAdminId.value,
        currency: 'USD',
        notes: f.notes.value,
        referenceNumber: f.referenceNumber.value,
        settlementPeriod: f.settlementPeriod.value,
        supportingDocument: f.supportingDocument.value
      }, currentActor());
      state.platformResults.push(createdResult.result);
      state.expectedWithdrawals.push(createdResult.expectedWithdrawal);
      state.notifications.push(createdResult.notification);
      state.auditLogs.push(createdResult.audit);
      event.currentTarget.reset();
      saveState();
      render();
    });

    document.getElementById('allocationForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!isOwner()) {
        activateView('noAccess');
        return;
      }
      var data = allocationCriteriaFromForm();
      if (!data.cashAmount && !data.bonusAmount) data.cashAmount = data.stake;
      data.ownerOverride = data.ownerOverride || false;
      data.ruleVersionId = latestRuleVersionId(data.platformId);
      var validation = workflow().validateAllocation(state, data, currentActor());
      if (validation.errors.length) {
        window.alert(validation.errors.join('\n'));
        return;
      }
      var account = byId(state.userPlatforms, data.platformAccountId);
      if (!account) {
        window.alert('Select a platform account before reserving a stake.');
        return;
      }
      if (Math.abs((data.cashAmount + data.bonusAmount) - data.stake) > 0.00001) {
        var proceed = window.confirm('Cash amount plus bonus amount does not equal the planned stake. Continue with this owner-confirmed split?');
        if (!proceed) return;
      }
      var pack = workflow().buildOperationalSession(data, account, validation.evaluation, currentActor());
      state.allocations.push(pack.allocation);
      state.operationalSessions.push(pack.session);
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: data.ownerOverride ? 'Owner override allocation reserved' : 'Allocation reserved',
        entityType: 'OperationalSession',
        entityId: pack.session.id,
        newValue: pack.session
      }));
      event.currentTarget.reset();
      saveState();
      render();
    });

    document.getElementById('settlementForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!isOwner()) {
        activateView('noAccess');
        return;
      }
      var f = event.currentTarget.elements;
      var session = byId(state.operationalSessions, f.sessionId.value);
      if (!session) {
        window.alert('Select an operational session before saving settlement.');
        return;
      }
      var account = byId(state.userPlatforms, session.platformAccountId);
      if (!account) {
        window.alert('The selected session no longer has a platform account.');
        return;
      }
      var settled = workflow().settleOperationalSession(session, account, {
        resultStatus: f.resultStatus.value,
        executedStake: num(f.executedStake.value),
        payout: num(f.payout.value),
        refund: num(f.refund.value),
        endingCashBalance: f.endingCashBalance.value,
        endingBonusBalance: f.endingBonusBalance.value,
        withdrawalAmount: num(f.withdrawalAmount.value),
        paymentStatus: f.paymentStatus.value,
        notes: f.notes.value
      }, currentActor());
      state.operationalSessions = state.operationalSessions.map(function (item) {
        return item.id === session.id ? settled.session : item;
      });
      state.allocations = state.allocations.map(function (item) {
        if (item.id !== session.allocationId) return item;
        item.status = settled.session.status;
        item.executedStake = settled.session.executedStake;
        item.payout = settled.session.payout;
        item.refund = settled.session.refund;
        item.profitLoss = settled.session.profitLoss;
        return item;
      });
      state.userPlatforms = state.userPlatforms.map(function (item) {
        if (item.id !== account.id) return item;
        var next = clone(item);
        next.completedTurnover = num(next.completedTurnover) + settled.turnoverDelta;
        if (f.endingCashBalance.value !== '') next.cashBalance = num(f.endingCashBalance.value);
        if (f.endingBonusBalance.value !== '') next.bonusBalance = num(f.endingBonusBalance.value);
        var turnover = workflow().turnoverSummary(next, activePlatformRule(next.platformId));
        next.requiredTurnoverAmount = turnover.requiredTurnoverAmount;
        next.remainingTurnoverAmount = turnover.remainingTurnoverAmount;
        return next;
      });
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: 'Operational session settled',
        entityType: 'OperationalSession',
        entityId: session.id,
        previousValue: session,
        newValue: settled.session
      }));
      event.currentTarget.reset();
      saveState();
      render();
    });

    document.getElementById('withdrawalUpdateForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var currentWithdrawal = byId(state.expectedWithdrawals, f.expectedWithdrawalId.value);
      var withdrawalErrors = workflow().validateExpectedWithdrawalUpdate(state, currentWithdrawal, {
        status: f.status.value,
        actualAmountReceived: num(f.actualAmountReceived.value),
        actualArrivalDate: f.actualArrivalDate.value,
        delayReason: f.delayReason.value,
        notes: f.notes.value
      });
      if (withdrawalErrors.length) {
        window.alert(withdrawalErrors.join('\n'));
        return;
      }
      var nextWithdrawal = workflow().updateExpectedWithdrawal(currentWithdrawal, {
        status: f.status.value,
        actualAmountReceived: num(f.actualAmountReceived.value),
        actualArrivalDate: f.actualArrivalDate.value,
        destinationAccountId: f.destinationAccountId.value || currentWithdrawal.destinationAccountId,
        delayReason: f.delayReason.value,
        notes: f.notes.value,
        assignedAdminId: f.assignedAdminId.value || currentWithdrawal.assignedAdminId
      }, currentActor());
      state.expectedWithdrawals = state.expectedWithdrawals.map(function (item) {
        return item.id === nextWithdrawal.id ? nextWithdrawal : item;
      });
      state.notifications = state.notifications.map(function (item) {
        if (item.relatedEntityType === 'ExpectedWithdrawal' && item.relatedEntityId === nextWithdrawal.id) {
          item.status = nextWithdrawal.status === 'Received' ? 'Completed' : 'In Progress';
          item.unread = false;
        }
        return item;
      });
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: 'Withdrawal status updated',
        entityType: 'ExpectedWithdrawal',
        entityId: nextWithdrawal.id,
        newValue: nextWithdrawal
      }));
      saveState();
      render();
    });

    document.getElementById('questionForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var questionId = uid('q');
      var question = {
        id: questionId,
        clientId: f.clientId.value || (currentUser ? currentUser.clientId : ''),
        category: f.category.value,
        priority: f.priority.value,
        status: f.status.value,
        subject: f.subject.value,
        createdBy: currentUser ? currentUser.id : '',
        createdDate: todayString(),
        assignedAdminId: ''
      };
      state.questions.push(question);
      state.questionMessages.push({
        id: uid('qm'),
        questionId: questionId,
        authorId: currentUser ? currentUser.id : '',
        authorRole: currentRole(),
        message: f.message.value,
        createdAt: nowIso()
      });
      state.notifications.push(workflow().createNotification({
        type: currentRole() === 'admin' ? 'Admin Question' : 'Shareholder Question',
        title: question.subject,
        description: f.message.value,
        clientId: question.clientId,
        assignedAuthUserId: isOwner() ? '' : 'auth-owner',
        relatedEntityType: 'Question',
        relatedEntityId: questionId
      }));
      saveState();
      event.currentTarget.reset();
      render();
    });

    document.getElementById('questionReplyForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var question = byId(state.questions, f.questionId.value);
      if (!question) {
        window.alert('Select a thread before replying.');
        return;
      }
      if (!canViewQuestion(question)) {
        activateView('noAccess');
        return;
      }
      state.questionMessages.push({
        id: uid('qm'),
        questionId: question.id,
        authorId: currentUser ? currentUser.id : '',
        authorRole: currentRole(),
        message: f.replyMessage.value,
        createdAt: nowIso()
      });
      state.questions = state.questions.map(function (item) {
        if (item.id !== question.id) return item;
        item.status = (isOwner() || isAdmin()) ? f.status.value : item.status;
        item.priority = (isOwner() || isAdmin()) ? f.priority.value : item.priority;
        item.assignedAdminId = (isOwner() || isAdmin()) ? f.assignedAdminId.value : item.assignedAdminId;
        return item;
      });
      saveState();
      event.currentTarget.reset();
      render();
    });

    document.getElementById('taskForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var form = event.currentTarget;
      if (isAdmin() && !form.dataset.editingId) {
        window.alert('Admins can update their own tasks, but only owners can create new tasks.');
        return;
      }
      if (isAdmin() && f.assignedAdminId.value && f.assignedAdminId.value !== currentUser.id) {
        window.alert('Admins can only update tasks assigned to themselves.');
        return;
      }
      var taskId = form.dataset.editingId || uid('task');
      var taskData = {
        id: taskId,
        title: f.title.value,
        description: f.description.value,
        assignedAdminId: f.assignedAdminId.value,
        clientId: f.clientId.value,
        userId: f.userId.value,
        platformAccountId: f.platformAccountId.value,
        expectedWithdrawalId: f.expectedWithdrawalId.value,
        priority: f.priority.value,
        startDate: f.startDate.value,
        dueDate: f.dueDate.value,
        status: f.status.value,
        ownerNotes: f.ownerNotes.value,
        adminResponse: f.adminResponse.value
      };
      if (form.dataset.editingId) {
        state.tasks = state.tasks.map(function (item) { return item.id === taskId ? taskData : item; });
      } else {
        state.tasks.push(taskData);
        state.notifications.push(workflow().createNotification({
          type: 'Owner Task',
          title: f.title.value,
          description: f.description.value,
          clientId: f.clientId.value,
          userId: f.userId.value,
          relatedEntityType: 'Task',
          relatedEntityId: taskId,
          assignedAuthUserId: f.assignedAdminId.value,
          dueDate: f.dueDate.value,
          priority: f.priority.value
        }));
      }
      state.auditLogs.push(workflow().createAudit({
        userId: currentUser ? currentUser.id : '',
        role: currentRole(),
        action: form.dataset.editingId ? 'Task updated' : 'Task created',
        entityType: 'Task',
        entityId: taskId,
        newValue: taskData
      }));
      form.reset();
      resetFormMode(form);
      saveState();
      render();
    });

    document.addEventListener('input', function (event) {
      if (event.target.id === 'calculatorAccountSearch') {
        calculatorLayout.accountSearch = event.target.value;
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      if (event.target.closest('#calculatorSetupForm')) {
        updateCalculatorDraftFromForm();
      }
      if (event.target.getAttribute('data-outcome-field')) {
        updateCalculatorOutcomeFromInput(event.target);
        calculatorResult = null;
        renderCalculatorResult();
        renderCalculatorAssignments();
        renderManualCoverageBoard();
        renderStakePlacementPrompt();
        renderOperationPlan();
      }
      if (event.target.getAttribute('data-assignment-field')) {
        updateCalculatorAssignmentFromInput(event.target);
      }
      if (event.target.closest('form')) {
        renderUserAllocationSummary();
        renderPlatformTurnoverPreview();
        renderEligibilityPreview();
        renderExchangePreview();
        updateRoutePreviews();
      }
    });

    document.addEventListener('change', function (event) {
      if (event.target.id === 'calculatorDensity') {
        calculatorLayout.density = event.target.value;
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      if (event.target.id === 'calculatorFixedColumnWidth') {
        calculatorLayout.fixedColumnWidth = Math.max(190, Math.min(360, num(event.target.value)));
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      if (event.target.id === 'calculatorEventColumnWidth') {
        calculatorLayout.eventColumnWidth = Math.max(140, Math.min(280, num(event.target.value)));
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      if (event.target.id === 'calculatorAccountFilter') {
        calculatorLayout.accountFilter = event.target.value;
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      if (event.target.id === 'calculatorMobileAccount') {
        calculatorLayout.selectedAccountId = event.target.value;
        saveCalculatorLayout();
        renderCalculatorMobileWorkspace(compactCalculatorModel || buildCompactCalculatorModel());
        return;
      }
      if (event.target.id === 'calculatorMobileEvent') {
        calculatorLayout.selectedEventId = event.target.value;
        saveCalculatorLayout();
        renderCalculatorMobileWorkspace(compactCalculatorModel || buildCompactCalculatorModel());
        return;
      }
      if (event.target.closest('#calculatorSetupForm') && event.target.name === 'marketType') {
        updateCalculatorDraftFromForm();
        calculatorDraft.outcomes = window.AtlasCalculatorService.makeOutcomeDefaults(calculatorDraft.marketType);
        calculatorResult = null;
        renderCalculator();
      }
      if (event.target.getAttribute('data-outcome-field')) {
        updateCalculatorOutcomeFromInput(event.target);
        calculatorResult = null;
        renderCalculatorResult();
        renderCalculatorAssignments();
        renderManualCoverageBoard();
        renderStakePlacementPrompt();
      }
      if (event.target.getAttribute('data-assignment-field')) {
        updateCalculatorAssignmentFromInput(event.target);
        renderStakePlacementPrompt();
        renderCalculatorAssignments();
        renderOperationPlan();
      }
      if (event.target.name === 'clientId') {
        var form = event.target.closest('form');
        if (form && form.elements.userId) {
          form.elements.userId.value = '';
          ['accountId', 'sourceAccountId', 'platformAccountId', 'from', 'to', 'sourceBankId', 'destinationWalletId'].forEach(function (name) { if (form.elements[name]) form.elements[name].value = ''; });
          setOptions(form.elements.userId, usersForClient(event.target.value), function (item) { return item.id; }, function (item) { return item.name + ' (' + item.code + ')'; });
        }
      }
      if (event.target.name === 'userId') {
        var parentForm = event.target.closest('form');
        if (parentForm) ['accountId', 'sourceAccountId', 'platformAccountId', 'from', 'to', 'sourceBankId', 'destinationWalletId'].forEach(function (name) { if (parentForm.elements[name]) parentForm.elements[name].value = ''; });
      }
      if (event.target.id === 'portfolioClientFilter') renderPortfolios();
      if (event.target.closest('#sessionAccountPoolForm')) {
        var poolForm = document.getElementById('sessionAccountPoolForm');
        if (poolForm && event.target.name === 'platformAccountId') {
          var poolAccount = byId(state.userPlatforms, poolForm.elements.platformAccountId.value);
          if (poolAccount) {
            var poolBalances = workflow().platformAvailableBalances(state, poolAccount);
            var poolTurnover = workflow().turnoverSummary(poolAccount, activePlatformRule(poolAccount.platformId));
            poolForm.elements.cashBalance.value = poolBalances.cashBalance;
            poolForm.elements.bonusBalance.value = poolBalances.bonusBalance;
            poolForm.elements.remainingTurnover.value = poolTurnover.remainingTurnoverAmount;
          }
        }
      }
      if (event.target.closest('form')) {
        populateSelects();
        renderPlatformTurnoverPreview();
        renderEligibilityPreview();
        updateRoutePreviews();
      }
    });

    document.addEventListener('click', function (event) {
      var closeDialogButton = event.target.closest('[data-close-calculator-dialog]');
      if (closeDialogButton) {
        closeCalculatorDialog(closeDialogButton.closest('dialog'));
        return;
      }
      var openDialogButton = event.target.closest('[data-open-calculator-dialog]');
      if (openDialogButton) {
        openCalculatorDialog(openDialogButton.getAttribute('data-open-calculator-dialog'), openDialogButton);
        return;
      }
      var calculatorViewButton = event.target.closest('[data-calculator-view]');
      if (calculatorViewButton) {
        activateCalculatorView(calculatorViewButton.getAttribute('data-calculator-view'));
        return;
      }
      var accountPreview = event.target.closest('[data-account-preview]');
      if (accountPreview) {
        renderAccountPreview(accountPreview.getAttribute('data-account-preview'));
        return;
      }
      var eventInfo = event.target.closest('[data-open-event-info]');
      if (eventInfo) {
        renderEventInfo(eventInfo.getAttribute('data-open-event-info'));
        return;
      }
      var openCell = event.target.closest('[data-open-cell]');
      if (openCell) {
        calculatorLayout.selectedAccountId = openCell.getAttribute('data-account-id');
        calculatorLayout.selectedEventId = openCell.getAttribute('data-event-id');
        saveCalculatorLayout();
        openCalculatorCellEditor(calculatorLayout.selectedAccountId, calculatorLayout.selectedEventId);
        return;
      }
      var editAllocation = event.target.closest('[data-edit-current-allocation]');
      if (editAllocation) {
        closeCalculatorDialog(editAllocation.closest('dialog'));
        openCalculatorCellEditor(editAllocation.getAttribute('data-account-id'), editAllocation.getAttribute('data-event-id'), editAllocation.getAttribute('data-edit-current-allocation'));
        return;
      }
      var toggleEvent = event.target.closest('[data-toggle-event]');
      if (toggleEvent) {
        var eventId = toggleEvent.getAttribute('data-toggle-event');
        calculatorLayout.collapsedEvents[eventId] = !calculatorLayout.collapsedEvents[eventId];
        saveCalculatorLayout();
        renderCompactCalculator();
        return;
      }
      var removeSessionAccountButton = event.target.closest('[data-remove-session-account]');
      if (removeSessionAccountButton) {
        removeSessionAccount(removeSessionAccountButton.getAttribute('data-remove-session-account'));
        return;
      }
      var warningButton = event.target.closest('[data-compact-warning-index]');
      if (warningButton) {
        navigateCompactWarning(Number(warningButton.getAttribute('data-compact-warning-index')));
        return;
      }
      var cellAction = event.target.closest('[data-cell-action]');
      if (cellAction) {
        var action = cellAction.getAttribute('data-cell-action');
        if (action === 'cancel') closeCalculatorDialog(cellAction.closest('dialog'));
        else if (action === 'clear') clearCalculatorCellAllocation();
        else if (action === 'apply') return;
        else applyCalculatorCellEditor(action);
        return;
      }
      if (event.target.closest('#compactCompleteAllocation')) {
        saveCalculatorOperationPlan();
        return;
      }
      if (event.target.closest('#compactOpenSettlement')) {
        activateCalculatorView('results');
        return;
      }
      var openCalc = event.target.closest('[data-open-calculator]');
      if (openCalc) {
        openCalculatorWorkbench(openCalc.getAttribute('data-open-calculator'), openCalc.getAttribute('data-calculator-mode'));
        return;
      }
      var openSavedCalculator = event.target.closest('[data-open-saved-calculator]');
      if (openSavedCalculator) {
        openSavedCalculatorSession(openSavedCalculator.getAttribute('data-open-saved-calculator'));
        return;
      }
      var marketChoice = event.target.closest('[data-market-choice]');
      if (marketChoice) {
        var workbench = document.getElementById('calculatorWorkbench');
        if (workbench && !workbench.hidden) {
          updateCalculatorDraftFromForm();
          calculatorDraft.marketType = marketChoice.getAttribute('data-market-choice');
          calculatorDraft.outcomes = window.AtlasCalculatorService.makeOutcomeDefaults(calculatorDraft.marketType);
          calculatorResult = null;
          calculatorAssignments = {};
          activeCalculatorSessionId = '';
          renderCalculator();
        } else {
          openCalculatorWorkbench(marketChoice.getAttribute('data-market-choice'), document.getElementById('calculatorSetupForm').elements.mode.value);
        }
        return;
      }
      var addAssignment = event.target.closest('[data-add-assignment]');
      if (addAssignment) {
        addCalculatorAssignment(addAssignment.getAttribute('data-add-assignment'));
        return;
      }
      var removeAssignment = event.target.closest('[data-remove-assignment]');
      if (removeAssignment) {
        removeCalculatorAssignment(removeAssignment.getAttribute('data-remove-assignment'), Number(removeAssignment.getAttribute('data-assignment-index')));
        return;
      }
      var removeBookmark = event.target.closest('[data-remove-bookmark]');
      if (removeBookmark) {
        state.accountBookmarks = state.accountBookmarks.filter(function (item) { return item.id !== removeBookmark.getAttribute('data-remove-bookmark'); });
        saveState();
        renderCalculator();
        return;
      }
      var toggle = event.target.closest('[data-toggle-tree]');
      if (toggle) {
        var key = toggle.getAttribute('data-toggle-tree');
        expandedTreeGroups[key] = !expandedTreeGroups[key];
        renderParties();
        return;
      }
      var openQuestion = event.target.closest('[data-open-question]');
      if (openQuestion) {
        openQuestionThread(openQuestion.getAttribute('data-open-question'));
        return;
      }
      var prepareAllocation = event.target.closest('[data-prepare-allocation]');
      if (prepareAllocation) {
        prepareAllocationFromCalculator(Number(prepareAllocation.getAttribute('data-prepare-allocation')));
        return;
      }
      var edit = event.target.closest('[data-edit]');
      if (edit) {
        handleEdit(edit.getAttribute('data-edit'), edit.getAttribute('data-id'));
        return;
      }
      var remove = event.target.closest('[data-delete]');
      if (remove) {
        handleDelete(remove.getAttribute('data-delete'), remove.getAttribute('data-id'));
      }
    });
  }

  function exportBackup() {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    var payload = {
      app: 'Atlas Lab V2',
      version: 6,
      exportedAt: nowIso(),
      storageKey: STORAGE_KEY,
      state: state
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'atlas-lab-v2-backup-' + todayString() + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    state.auditLogs.push(workflow().createAudit({
      userId: currentUser ? currentUser.id : '',
      role: currentRole(),
      action: 'Data export created',
      entityType: 'Backup',
      entityId: 'local-json',
      newValue: { exportedAt: payload.exportedAt }
    }));
    saveState();
  }

  function importBackupFile(file) {
    if (!isOwner()) {
      activateView('noAccess');
      return;
    }
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || '{}'));
        var nextState = parsed.state || parsed;
        if (!nextState || !Array.isArray(nextState.authUsers)) {
          window.alert('This JSON file does not look like an Atlas backup.');
          return;
        }
        if (!window.confirm('Import this Atlas backup and replace the current local data?')) return;
        state = normalizeState(nextState);
        state.auditLogs.push(workflow().createAudit({
          userId: currentUser ? currentUser.id : '',
          role: currentRole(),
          action: 'Data backup imported',
          entityType: 'Backup',
          entityId: file.name,
          newValue: { importedAt: nowIso(), fileName: file.name }
        }));
        saveState();
        render();
      } catch (error) {
        window.alert('Could not import backup: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  function wireChrome() {
    document.getElementById('loginForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var f = event.currentTarget.elements;
      var username = String(f.username.value || '').trim();
      var password = String(f.password.value || '');
      var user = state.authUsers.filter(function (item) {
        return item.username === username && item.password === password;
      })[0];
      if (!user) {
        setText('loginError', 'Invalid username or password.');
        return;
      }
      setText('loginError', '');
      saveSession(user);
      resolveCurrentUser();
      activateView(defaultViewForRole());
      render();
    });

    document.getElementById('logoutButton').addEventListener('click', function () {
      saveSession(null);
      currentUser = null;
      render();
    });

    document.getElementById('backToDashboard').addEventListener('click', function () {
      activateView(defaultViewForRole());
    });

    document.getElementById('returnToAtlas').addEventListener('click', function () {
      activateView('dashboard');
    });

    document.getElementById('returnToAtlasWorkbench').addEventListener('click', function () {
      closeAllCalculatorDialogs();
      activateView('dashboard');
    });

    document.getElementById('backToCalculatorHome').addEventListener('click', closeCalculatorWorkbench);

    document.getElementById('compactSaveButton').addEventListener('click', function () {
      document.getElementById('saveCalculatorSession').click();
    });

    document.getElementById('resetCalculatorLayout').addEventListener('click', function () {
      calculatorLayout = defaultCalculatorLayout();
      saveCalculatorLayout();
      renderCompactCalculator();
    });

    document.getElementById('addSessionEventButton').addEventListener('click', addEventUsingSessionPool);

    document.getElementById('saveOperationPlan').addEventListener('click', saveCalculatorOperationPlan);

    document.getElementById('exportOperationSpreadsheet').addEventListener('click', function () {
      exportCalculatorSpreadsheet();
    });

    document.getElementById('exportOperationPdfEnglish').addEventListener('click', function () {
      exportCalculatorPdf('en');
    });

    document.getElementById('exportOperationPdfPersian').addEventListener('click', function () {
      exportCalculatorPdf('fa');
    });

    document.addEventListener('click', function (event) {
      if (event.target && event.target.id === 'saveExecutionStatus') saveExecutionForActiveSession();
      if (event.target && event.target.id === 'saveActualResult') settleActiveCalculatorSession();
      var approvalButton = event.target.closest('[data-approval-action]');
      if (approvalButton && isOwner()) {
        var request = byId(state.approvalRequests, approvalButton.getAttribute('data-approval-id'));
        if (request && request.status === 'Pending Owner Approval') {
          var action = approvalButton.getAttribute('data-approval-action');
          var note = window.prompt('Owner note', '') || '';
          request.status = action;
          request.ownerDecision = action;
          request.ownerNote = note;
          request.decidedBy = currentUser.id;
          request.decisionDate = nowIso();
          request.history.push({ action: action, note: note, userId: currentUser.id, createdAt: nowIso() });
          if (action === 'Approved') {
            if (request.type === 'Bank Exchange' && request.payload) { request.payload.status = 'Executed'; state.exchanges.push(request.payload); }
            var pendingTransfer = state.transfers.filter(function (row) { return request.payload && row.createdAt === request.payload.createdAt; })[0];
            if (pendingTransfer) pendingTransfer.status = 'Completed';
            request.status = 'Executed'; request.executedDate = nowIso();
          }
          state.auditLogs.push(workflow().createAudit({ userId: currentUser.id, role: currentRole(), action: 'Approval ' + action, entityType: 'ApprovalRequest', entityId: request.id, newValue: request }));
          saveState(); render();
        }
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!document.body.classList.contains('is-calculator-workspace')) return;
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 's') {
        event.preventDefault();
        document.getElementById('compactSaveButton').click();
        return;
      }
      if (event.key === 'Escape') {
        var openDialog = document.querySelector('.calculator-drawer[open], .calculator-popover-dialog[open]');
        if (openDialog) {
          event.preventDefault();
          closeCalculatorDialog(openDialog);
        }
        return;
      }
      var cell = event.target.closest && event.target.closest('.allocation-cell-button');
      if (!cell || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      event.preventDefault();
      var row = Number(cell.getAttribute('data-row-index'));
      var column = Number(cell.getAttribute('data-column-index'));
      if (event.key === 'ArrowLeft') column -= 1;
      if (event.key === 'ArrowRight') column += 1;
      if (event.key === 'ArrowUp') row -= 1;
      if (event.key === 'ArrowDown') row += 1;
      var next = document.querySelector('.allocation-cell-button[data-row-index="' + row + '"][data-column-index="' + column + '"]');
      if (next) next.focus();
    });

    document.querySelectorAll('.nav-item').forEach(function (button) {
      button.addEventListener('click', function () {
        activateView(button.getAttribute('data-view'));
      });
    });

    var from = document.getElementById('filterFrom');
    var to = document.getElementById('filterTo');
    from.value = filters.from;
    to.value = filters.to;
    from.addEventListener('change', function () {
      filters.from = from.value;
      render();
    });
    to.addEventListener('change', function () {
      filters.to = to.value;
      render();
    });

    document.getElementById('ledgerSearch').addEventListener('input', function (event) {
      filters.search = event.target.value;
      renderLedger();
    });

    document.getElementById('resetData').addEventListener('click', function () {
      state = normalizeState(clone(seedState));
      saveState();
      render();
    });

    document.getElementById('exportData').addEventListener('click', exportBackup);
    document.getElementById('importDataButton').addEventListener('click', function () {
      document.getElementById('importDataFile').click();
    });
    document.getElementById('importDataFile').addEventListener('change', function (event) {
      importBackupFile(event.target.files && event.target.files[0]);
      event.target.value = '';
    });

    document.getElementById('closeConversation').addEventListener('click', function () {
      var dialog = document.getElementById('conversationDialog');
      if (dialog.close) dialog.close();
      else dialog.removeAttribute('open');
    });
  }

  window.AtlasAppearanceBridge = {
    state: function () { return state; },
    user: function () { return currentUser; },
    role: currentRole,
    save: saveState,
    render: render,
    activateView: activateView,
    canView: canView,
    nowIso: nowIso,
    uid: uid
  };

  wireChrome();
  wireForms();
  render();
})();
