(function () {
  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function byId(list, id) {
    return (list || []).filter(function (item) { return item.id === id; })[0] || null;
  }

  function sum(list, getter) {
    return (list || []).reduce(function (total, item) {
      return total + num(getter(item));
    }, 0);
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function unique(values) {
    var seen = {};
    return (values || []).filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function shareholderForClient(state, clientId) {
    return (state.shareholders || []).filter(function (item) { return item.clientId === clientId; })[0] || null;
  }

  function clientCapitalSummary(state, clientId, editingUserId) {
    var users = (state.users || []).filter(function (user) {
      return user.clientId === clientId;
    });
    var shareholder = shareholderForClient(state, clientId);
    var committed = num(shareholder && shareholder.investment);
    var allocated = sum(users, function (user) { return user.allocatedCapital; });
    var allocatedExcludingEditing = sum(users.filter(function (user) {
      return user.id !== editingUserId;
    }), function (user) { return user.allocatedCapital; });
    var currentUser = byId(state.users, editingUserId);
    var currentUserAllocation = num(currentUser && currentUser.allocatedCapital);
    return {
      clientId: clientId,
      committedCapital: committed,
      allocatedCapital: allocated,
      remainingCapital: committed - allocated,
      availableForAllocation: committed - allocatedExcludingEditing,
      currentUserAllocation: currentUserAllocation
    };
  }

  function userAccounts(state, userId, type) {
    return (state.accounts || []).filter(function (account) {
      if (account.userId !== userId) return false;
      if (!type) return true;
      return account.type === type;
    });
  }

  function userPlatformAccounts(state, userId) {
    return (state.userPlatforms || []).filter(function (item) {
      return item.userId === userId;
    });
  }

  function adminAssignedClientIds(state, authUserId) {
    return unique((state.adminAssignments || []).filter(function (item) {
      return item.authUserId === authUserId;
    }).map(function (item) {
      return item.clientId;
    }));
  }

  function assignedClientIds(state, authUser) {
    if (!authUser) return [];
    if (authUser.role === 'owner') {
      return unique((state.clients || []).map(function (client) { return client.id; }));
    }
    if (authUser.role === 'admin') {
      return adminAssignedClientIds(state, authUser.id);
    }
    if (authUser.role === 'shareholder' && authUser.clientId) {
      return [authUser.clientId];
    }
    return [];
  }

  function canAccessClient(state, authUser, clientId) {
    if (!clientId) return false;
    return assignedClientIds(state, authUser).indexOf(clientId) !== -1;
  }

  function validateUserAllocation(state, data, editingUserId) {
    var errors = [];
    if (!data.clientId) errors.push('Client is required.');
    if (!data.name) errors.push('User name is required.');
    if (num(data.allocatedCapital) < 0) {
      errors.push('Allocated capital cannot be negative.');
    }
    var summary = clientCapitalSummary(state, data.clientId, editingUserId);
    if (!shareholderForClient(state, data.clientId)) {
      errors.push('Create the shareholder/client investment profile before allocating user capital.');
    }
    if (num(data.allocatedCapital) > num(summary.availableForAllocation) + 0.00001) {
      errors.push('Allocated capital exceeds the client remaining unallocated capital.');
    }
    if (num(data.walletOpening) + num(data.bankOpening) > num(data.allocatedCapital) + 0.00001) {
      errors.push('Wallet opening amount plus bank opening amount cannot exceed the allocated capital.');
    }
    if (!data.clientId) return errors;
    return errors;
  }

  function validateAccount(state, data, editingId) {
    var errors = [];
    var user = byId(state.users || [], data.userId);
    if (!data.clientId) errors.push('Client is required.');
    if (!data.userId) errors.push('User is required.');
    if (!user) errors.push('Selected user no longer exists.');
    if (user && user.clientId !== data.clientId) {
      errors.push('The selected account user must belong to the selected client.');
    }
    if (data.type === 'Wallet') {
      var existingWallet = userAccounts(state, data.userId, 'Wallet').filter(function (item) {
        return item.id !== editingId;
      });
      if (existingWallet.length) errors.push('Each user can have only one wallet.');
    }
    if (data.type === 'Bank') {
      var existingBank = userAccounts(state, data.userId, 'Bank').filter(function (item) {
        return item.id !== editingId;
      });
      if (existingBank.length) errors.push('Each user can have only one bank account.');
    }
    return errors;
  }

  function validatePlatformAccount(state, data) {
    var errors = [];
    var user = byId(state.users || [], data.userId);
    if (!data.clientId) errors.push('Client is required.');
    if (!data.userId) errors.push('User is required.');
    if (!data.platformId) errors.push('Platform is required.');
    if (!user) errors.push('Linked user is required for every platform account.');
    if (user && user.clientId !== data.clientId) {
      errors.push('Platform account ownership must match the selected client and user.');
    }
    return errors;
  }

  function walletAndBankAccounts(state, clientId, userId) {
    return (state.accounts || []).filter(function (account) {
      if (account.clientId !== clientId) return false;
      if (userId && account.userId !== userId) return false;
      return account.type === 'Wallet' || account.type === 'Bank';
    });
  }

  function transferOptions(state, data) {
    var clientId = data.clientId;
    var userId = data.userId;
    var sameClientAccounts = walletAndBankAccounts(state, clientId);
    var userOwnedAccounts = walletAndBankAccounts(state, clientId, userId);
    var userPlatforms = (state.userPlatforms || []).filter(function (item) {
      return item.clientId === clientId && item.userId === userId;
    });
    var movementType = data.movementType || 'Internal Transfer';

    if (movementType === 'Platform Funding') {
      return {
        sourceAccounts: userOwnedAccounts,
        destinationAccounts: [],
        sourcePlatformAccounts: [],
        destinationPlatformAccounts: userPlatforms
      };
    }
    if (movementType === 'Platform Withdrawal') {
      return {
        sourceAccounts: [],
        destinationAccounts: userOwnedAccounts,
        sourcePlatformAccounts: userPlatforms,
        destinationPlatformAccounts: []
      };
    }
    return {
      sourceAccounts: sameClientAccounts,
      destinationAccounts: sameClientAccounts.filter(function (item) { return item.id !== data.fromAccountId; }),
      sourcePlatformAccounts: [],
      destinationPlatformAccounts: []
    };
  }

  function validateTransfer(state, data) {
    var errors = [];
    var movementType = data.movementType || 'Internal Transfer';
    var user = byId(state.users || [], data.userId);
    if (!data.clientId) errors.push('Client is required.');
    if (!data.userId) errors.push('User is required.');
    if (!user) errors.push('User is required.');
    if (user && user.clientId !== data.clientId) {
      errors.push('The selected user must belong to the selected client.');
    }
    if (num(data.amount) <= 0) errors.push('Transfer amount must be positive.');

    var fromAccount = byId(state.accounts || [], data.fromAccountId);
    var toAccount = byId(state.accounts || [], data.toAccountId);
    var platformAccount = byId(state.userPlatforms || [], data.platformAccountId);

    if (movementType === 'Internal Transfer') {
      if (!fromAccount || !toAccount) errors.push('Select both source and destination accounts.');
      if (fromAccount && fromAccount.clientId !== data.clientId) errors.push('Source account must belong to the selected client.');
      if (toAccount && toAccount.clientId !== data.clientId) errors.push('Destination account must belong to the selected client.');
      if (fromAccount && toAccount && fromAccount.id === toAccount.id) errors.push('Source and destination cannot be the same account.');
    }

    if (movementType === 'Platform Funding') {
      if (!fromAccount) errors.push('Select the wallet or bank used for funding.');
      if (!platformAccount) errors.push('Select the destination platform account.');
      if (fromAccount && fromAccount.userId !== data.userId) {
        errors.push('Platform funding must use the selected user wallet or bank.');
      }
      if (platformAccount && platformAccount.userId !== data.userId) {
        errors.push('Platform funding must target a platform account owned by the same user.');
      }
    }

    if (movementType === 'Platform Withdrawal') {
      if (!platformAccount) errors.push('Select the source platform account.');
      if (!toAccount) errors.push('Select the destination wallet or bank.');
      if (platformAccount && platformAccount.userId !== data.userId) {
        errors.push('Platform withdrawal must come from a platform account owned by the same user.');
      }
      if (toAccount && toAccount.userId !== data.userId) {
        errors.push('Platform withdrawal can only be received by the same user wallet or bank.');
      }
    }

    return errors;
  }

  function createNotification(data) {
    return {
      id: data.id || uid('ntf'),
      type: data.type || 'Owner Task',
      title: data.title || 'Action required',
      description: data.description || '',
      clientId: data.clientId || '',
      userId: data.userId || '',
      platformId: data.platformId || '',
      relatedEntityType: data.relatedEntityType || '',
      relatedEntityId: data.relatedEntityId || '',
      assignedAuthUserId: data.assignedAuthUserId || '',
      createdDate: data.createdDate || today(),
      dueDate: data.dueDate || data.createdDate || today(),
      priority: data.priority || 'Normal',
      status: data.status || 'New',
      unread: data.unread !== false
    };
  }

  function createAudit(data) {
    return {
      id: data.id || uid('audit'),
      userId: data.userId || '',
      role: data.role || '',
      action: data.action || '',
      entityType: data.entityType || '',
      entityId: data.entityId || '',
      previousValue: data.previousValue || null,
      newValue: data.newValue || null,
      createdAt: data.createdAt || nowIso()
    };
  }

  function validatePlatformFunding(state, data) {
    var errors = [];
    var sourceAccount = byId(state.accounts || [], data.sourceAccountId);
    var platformAccount = byId(state.userPlatforms || [], data.platformAccountId);
    if (!data.clientId) errors.push('Client is required.');
    if (!data.userId) errors.push('User is required.');
    if (!sourceAccount) errors.push('Funding source wallet or bank is required.');
    if (!platformAccount) errors.push('Platform account is required.');
    if (sourceAccount && sourceAccount.userId !== data.userId) {
      errors.push('Platform funding source must belong to the same user.');
    }
    if (platformAccount && platformAccount.userId !== data.userId) {
      errors.push('Platform funding destination must belong to the same user.');
    }
    if (num(data.amount) <= 0) errors.push('Funding amount must be positive.');
    return errors;
  }

  function createPlatformFunding(state, data, actor) {
    var platformAccount = byId(state.userPlatforms || [], data.platformAccountId);
    var funding = {
      id: uid('fund'),
      date: data.date || today(),
      clientId: data.clientId,
      userId: data.userId,
      sourceType: data.sourceType || '',
      sourceAccountId: data.sourceAccountId,
      platformId: platformAccount ? platformAccount.platformId : '',
      platformAccountId: data.platformAccountId,
      amount: num(data.amount),
      currency: data.currency || 'USD',
      notes: data.notes || '',
      createdBy: actor ? actor.id : '',
      createdAt: nowIso()
    };
    var notification = createNotification({
      type: 'Check Platform Result',
      title: 'Check platform result and record the expected withdrawal.',
      description: 'Funding ' + funding.id + ' is waiting for result entry.',
      clientId: funding.clientId,
      userId: funding.userId,
      platformId: funding.platformId,
      relatedEntityType: 'PlatformFunding',
      relatedEntityId: funding.id,
      assignedAuthUserId: data.assignedAuthUserId || '',
      priority: 'High'
    });
    var audit = createAudit({
      userId: actor ? actor.id : '',
      role: actor ? actor.role : '',
      action: 'Funding recorded',
      entityType: 'PlatformFunding',
      entityId: funding.id,
      newValue: funding
    });
    return { funding: funding, notification: notification, audit: audit };
  }

  function validatePlatformResult(state, data) {
    var errors = [];
    var funding = byId(state.platformFundings || [], data.fundingId);
    var platformAccount = byId(state.userPlatforms || [], data.platformAccountId);
    if (!funding) errors.push('A related platform funding transaction is required.');
    if (!platformAccount) errors.push('Platform account is required.');
    if (funding && funding.clientId !== data.clientId) errors.push('Result must stay inside the same client ownership chain.');
    if (funding && funding.userId !== data.userId) errors.push('Result must stay inside the same user ownership chain.');
    if (platformAccount && platformAccount.userId !== data.userId) errors.push('Platform account must belong to the selected user.');
    if (num(data.resultAmount) < 0) errors.push('Result amount cannot be negative.');
    if (num(data.expectedWithdrawalAmount) < 0) errors.push('Expected withdrawal amount cannot be negative.');
    if (num(data.remainingInsidePlatform) < 0) errors.push('Remaining inside platform cannot be negative.');
    return errors;
  }

  function createPlatformResult(state, data, actor) {
    var funding = byId(state.platformFundings || [], data.fundingId);
    var destinationAccount = byId(state.accounts || [], data.expectedDestinationAccountId);
    var result = {
      id: uid('result'),
      clientId: data.clientId,
      userId: data.userId,
      platformId: data.platformId,
      platformAccountId: data.platformAccountId,
      fundingId: data.fundingId,
      originalAmount: num(data.originalAmount || (funding && funding.amount)),
      resultDate: data.resultDate || today(),
      resultAmount: num(data.resultAmount),
      expectedWithdrawalAmount: num(data.expectedWithdrawalAmount),
      remainingInsidePlatform: num(data.remainingInsidePlatform),
      platformFees: num(data.platformFees),
      notes: data.notes || '',
      referenceNumber: data.referenceNumber || '',
      settlementPeriod: data.settlementPeriod || '',
      supportingDocument: data.supportingDocument || '',
      createdBy: actor ? actor.id : '',
      createdAt: nowIso()
    };
    var expectedWithdrawal = {
      id: uid('exp'),
      clientId: data.clientId,
      userId: data.userId,
      platformId: data.platformId,
      platformAccountId: data.platformAccountId,
      fundingId: data.fundingId,
      resultId: result.id,
      expectedAmount: num(data.expectedWithdrawalAmount),
      currency: data.currency || 'USD',
      expectedDestination: destinationAccount ? destinationAccount.type : '',
      destinationAccountId: data.expectedDestinationAccountId || '',
      requestDate: data.resultDate || today(),
      expectedArrivalDate: data.expectedArrivalDate || '',
      actualAmountReceived: 0,
      actualArrivalDate: '',
      difference: 0,
      status: 'Expected',
      delayReason: '',
      notes: data.withdrawalNotes || data.notes || '',
      assignedAdminId: data.assignedAdminId || '',
      createdBy: actor ? actor.id : '',
      lastUpdated: nowIso()
    };
    var notification = createNotification({
      type: 'Check Withdrawal Arrival',
      title: 'Check whether the expected platform withdrawal has arrived.',
      description: 'Expected withdrawal ' + expectedWithdrawal.id + ' is waiting for arrival confirmation.',
      clientId: data.clientId,
      userId: data.userId,
      platformId: data.platformId,
      relatedEntityType: 'ExpectedWithdrawal',
      relatedEntityId: expectedWithdrawal.id,
      assignedAuthUserId: data.assignedAdminId || '',
      priority: 'High'
    });
    var audit = createAudit({
      userId: actor ? actor.id : '',
      role: actor ? actor.role : '',
      action: 'Result recorded',
      entityType: 'PlatformResult',
      entityId: result.id,
      newValue: result
    });
    return {
      result: result,
      expectedWithdrawal: expectedWithdrawal,
      notification: notification,
      audit: audit
    };
  }

  function validateExpectedWithdrawalUpdate(state, currentRecord, patch) {
    var errors = [];
    var record = currentRecord || {};
    var nextStatus = patch.status || record.status;
    var actualAmount = patch.actualAmountReceived != null ? num(patch.actualAmountReceived) : num(record.actualAmountReceived);
    if (!record.id) errors.push('Expected withdrawal record is required.');
    if ((nextStatus === 'Received' || nextStatus === 'Partially Received') && actualAmount <= 0) {
      errors.push('Actual received amount is required for received or partially received withdrawals.');
    }
    if ((nextStatus === 'Received' || nextStatus === 'Partially Received') && !(patch.actualArrivalDate || record.actualArrivalDate)) {
      errors.push('Arrival date is required when money has been received.');
    }
    if ((nextStatus === 'Delayed' || nextStatus === 'Verification Required' || nextStatus === 'Payment Problem') && !(patch.delayReason || record.delayReason)) {
      errors.push('A delay or verification reason is required.');
    }
    return errors;
  }

  function waitingDays(fromDate, toDate) {
    if (!fromDate) return 0;
    var start = new Date(fromDate);
    var end = new Date(toDate || today());
    if (!isFinite(start.getTime()) || !isFinite(end.getTime())) return 0;
    return Math.max(0, Math.round((end - start) / 86400000));
  }

  function updateExpectedWithdrawal(record, patch, actor) {
    var next = {};
    Object.keys(record || {}).forEach(function (key) { next[key] = record[key]; });
    Object.keys(patch || {}).forEach(function (key) { next[key] = patch[key]; });
    next.actualAmountReceived = num(next.actualAmountReceived);
    next.expectedAmount = num(next.expectedAmount);
    next.difference = next.actualAmountReceived - next.expectedAmount;
    next.lastUpdated = nowIso();
    next.updatedBy = actor ? actor.id : '';
    if (next.status === 'Received' && !next.actualArrivalDate) {
      next.actualArrivalDate = today();
    }
    return next;
  }

  function platformPerformance(state, platformAccountId) {
    var fundings = (state.platformFundings || []).filter(function (item) {
      return item.platformAccountId === platformAccountId;
    });
    var results = (state.platformResults || []).filter(function (item) {
      return item.platformAccountId === platformAccountId;
    });
    var withdrawals = (state.expectedWithdrawals || []).filter(function (item) {
      return item.platformAccountId === platformAccountId;
    });
    var settledWithdrawals = withdrawals.filter(function (item) { return item.status === 'Received'; });
    var completedResults = results.filter(function (result) {
      var linked = withdrawals.filter(function (item) { return item.resultId === result.id; })[0];
      return linked && linked.status === 'Received' && num(result.remainingInsidePlatform) <= 0;
    });
    var waitingRows = withdrawals.filter(function (item) { return item.actualArrivalDate; });
    var averageWaiting = waitingRows.length ? sum(waitingRows, function (item) {
      return waitingDays(item.requestDate, item.actualArrivalDate);
    }) / waitingRows.length : 0;
    var totalFees = sum(results, function (item) { return item.platformFees; });
    var totalFunded = sum(fundings, function (item) { return item.amount; });
    var totalReceived = sum(withdrawals, function (item) { return item.actualAmountReceived; });
    var totalExpected = sum(withdrawals, function (item) { return item.expectedAmount; });
    var totalPending = sum(withdrawals.filter(function (item) {
      return item.status !== 'Received' && item.status !== 'Cancelled';
    }), function (item) {
      return Math.max(0, num(item.expectedAmount) - num(item.actualAmountReceived));
    });
    var totalResultAmount = sum(results, function (item) { return item.resultAmount; });
    var realizedProfitLoss = sum(completedResults, function (result) {
      var linked = withdrawals.filter(function (item) { return item.resultId === result.id; })[0];
      return num(linked && linked.actualAmountReceived) - num(result.originalAmount) - num(result.platformFees);
    });
    return {
      totalFunded: totalFunded,
      totalResultAmount: totalResultAmount,
      totalExpectedWithdrawals: totalExpected,
      totalPendingWithdrawals: totalPending,
      totalReceivedWithdrawals: totalReceived,
      totalDelayedWithdrawals: withdrawals.filter(function (item) {
        return item.status === 'Delayed';
      }).length,
      currentPlatformBalance: sum(results, function (item) { return item.remainingInsidePlatform; }),
      totalFees: totalFees,
      netCashFlow: totalReceived - totalFunded,
      realizedProfitLoss: realizedProfitLoss,
      completedOperations: completedResults.length,
      averageReturn: completedResults.length ? realizedProfitLoss / completedResults.length : 0,
      averageWithdrawalWaitingTime: averageWaiting,
      withdrawalCompletionRate: withdrawals.length ? settledWithdrawals.length / withdrawals.length : 0,
      verificationIssues: withdrawals.filter(function (item) { return item.status === 'Verification Required'; }).length,
      paymentProblems: withdrawals.filter(function (item) { return item.status === 'Payment Problem'; }).length
    };
  }

  function userPlatformAnalysis(state, userId) {
    return userPlatformAccounts(state, userId).map(function (platformAccount) {
      var metrics = platformPerformance(state, platformAccount.id);
      return {
        platformAccountId: platformAccount.id,
        clientId: platformAccount.clientId,
        userId: platformAccount.userId,
        platformId: platformAccount.platformId,
        username: platformAccount.username,
        status: platformAccount.status,
        totalFunded: metrics.totalFunded,
        totalResultAmount: metrics.totalResultAmount,
        totalWithdrawn: metrics.totalReceivedWithdrawals,
        pendingWithdrawal: metrics.totalPendingWithdrawals,
        currentPlatformBalance: metrics.currentPlatformBalance,
        realizedProfitLoss: metrics.realizedProfitLoss,
        netCashFlow: metrics.netCashFlow,
        averageWithdrawalWaitingTime: metrics.averageWithdrawalWaitingTime,
        withdrawalSuccessRate: metrics.withdrawalCompletionRate
      };
    });
  }

  function clientPlatformSummary(state, clientId) {
    var users = (state.users || []).filter(function (user) { return user.clientId === clientId; });
    var rows = [];
    users.forEach(function (user) {
      rows = rows.concat(userPlatformAnalysis(state, user.id));
    });
    return {
      rows: rows,
      totalFunded: sum(rows, function (row) { return row.totalFunded; }),
      totalResultAmount: sum(rows, function (row) { return row.totalResultAmount; }),
      totalWithdrawn: sum(rows, function (row) { return row.totalWithdrawn; }),
      totalPendingWithdrawal: sum(rows, function (row) { return row.pendingWithdrawal; }),
      totalRealizedProfitLoss: sum(rows, function (row) { return row.realizedProfitLoss; }),
      currentPlatformBalance: sum(rows, function (row) { return row.currentPlatformBalance; })
    };
  }

  function notificationCounts(notifications) {
    var todayValue = today();
    var rows = notifications || [];
    return {
      unreadCount: rows.filter(function (item) { return item.unread; }).length,
      pendingCount: rows.filter(function (item) { return item.status !== 'Completed' && item.status !== 'Dismissed'; }).length,
      overdueCount: rows.filter(function (item) {
        return item.status !== 'Completed' && item.status !== 'Dismissed' && item.dueDate && item.dueDate < todayValue;
      }).length
    };
  }

  function bool(value) {
    return value === true || value === 'true' || value === 'Allowed' || value === 'Yes';
  }

  function splitList(value) {
    if (Array.isArray(value)) return value;
    return String(value || '').split(',').map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function defaultPlatformRule(platformId) {
    return {
      id: '',
      platformId: platformId || '',
      platformStatus: 'Active',
      defaultCurrency: 'USD',
      turnoverPercentage: 100,
      turnoverMethod: 'Deposit only',
      minEligibleOdds: 1,
      maxEligibleOdds: 0,
      maxStake: 0,
      maxPayout: 0,
      bonusTypesSupported: '',
      sameAccountMultipleOutcomes: false,
      maxOutcomesPerEvent: 1,
      sameAccountAcrossMarkets: false,
      multipleAccountsOneOutcome: false,
      twoOfThreeOutcomesAllowed: 'Not Allowed',
      manualApprovalRequired: false,
      effectiveDate: today(),
      lastReviewedDate: '',
      notes: ''
    };
  }

  function normalizeRule(rule, platformId) {
    var base = defaultPlatformRule(platformId || (rule && rule.platformId));
    var next = {};
    Object.keys(base).forEach(function (key) {
      next[key] = rule && rule[key] != null && rule[key] !== '' ? rule[key] : base[key];
    });
    next.id = rule && rule.id || '';
    next.turnoverPercentage = num(next.turnoverPercentage);
    next.minEligibleOdds = num(next.minEligibleOdds) || 1;
    next.maxEligibleOdds = num(next.maxEligibleOdds);
    next.maxStake = num(next.maxStake);
    next.maxPayout = num(next.maxPayout);
    next.maxOutcomesPerEvent = Math.max(1, Math.floor(num(next.maxOutcomesPerEvent) || 1));
    next.sameAccountMultipleOutcomes = bool(next.sameAccountMultipleOutcomes);
    next.sameAccountAcrossMarkets = bool(next.sameAccountAcrossMarkets);
    next.multipleAccountsOneOutcome = bool(next.multipleAccountsOneOutcome);
    next.manualApprovalRequired = bool(next.manualApprovalRequired);
    return next;
  }

  function latestPlatformRule(state, platformId, asOfDate) {
    var date = asOfDate || today();
    var rules = (state.platformRules || []).filter(function (rule) {
      return rule.platformId === platformId && (!rule.effectiveDate || rule.effectiveDate <= date);
    }).sort(function (a, b) {
      return String(b.effectiveDate || '').localeCompare(String(a.effectiveDate || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    return normalizeRule(rules[0] || {}, platformId);
  }

  function turnoverPercentForAccount(account, rule) {
    var override = account && account.turnoverPercentageOverride;
    return override !== '' && override != null && isFinite(Number(override)) ? num(override) : num(rule.turnoverPercentage);
  }

  function turnoverBaseAmount(account, rule) {
    var method = rule.turnoverMethod || 'Deposit only';
    var deposit = num(account && account.fundingAmount);
    var bonus = num(account && account.bonusAmount);
    if (method === 'Bonus only') return bonus;
    if (method === 'Deposit plus bonus') return deposit + bonus;
    if (method === 'Custom eligible amount') return num(account && account.customEligibleAmount);
    return deposit;
  }

  function turnoverSummary(account, rule) {
    var activeRule = normalizeRule(rule || {}, account && account.platformId);
    var percentValue = turnoverPercentForAccount(account || {}, activeRule);
    var eligibleBase = turnoverBaseAmount(account || {}, activeRule);
    var required = eligibleBase * percentValue / 100;
    var completed = num(account && account.completedTurnover);
    return {
      platformDefaultPercentage: num(activeRule.turnoverPercentage),
      accountOverridePercentage: account && account.turnoverPercentageOverride !== '' && account.turnoverPercentageOverride != null ? num(account.turnoverPercentageOverride) : null,
      effectiveTurnoverPercentage: percentValue,
      turnoverMethod: activeRule.turnoverMethod,
      eligibleFundingBase: eligibleBase,
      requiredTurnoverAmount: required,
      completedTurnoverAmount: completed,
      remainingTurnoverAmount: Math.max(0, required - completed)
    };
  }

  function activeAllocations(state) {
    return (state.allocations || []).filter(function (item) {
      return ['Reserved', 'Pending', 'Review Required', 'Confirmed'].indexOf(item.status || 'Reserved') !== -1;
    });
  }

  function reservationsForAccount(state, platformAccountId, excludeAllocationId) {
    return activeAllocations(state).filter(function (item) {
      return item.platformAccountId === platformAccountId && item.id !== excludeAllocationId;
    });
  }

  function reservedAmount(state, platformAccountId, excludeAllocationId) {
    return sum(reservationsForAccount(state, platformAccountId, excludeAllocationId), function (item) {
      return item.plannedStake || item.stake;
    });
  }

  function eventAllocations(state, data, platformAccountId) {
    var eventId = data.eventId || data.eventName || '';
    return activeAllocations(state).filter(function (item) {
      if (platformAccountId && item.platformAccountId !== platformAccountId) return false;
      return (item.eventId || item.eventName || '') === eventId;
    });
  }

  function distinct(values) {
    var seen = {};
    return (values || []).filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function platformAvailableBalances(state, account) {
    var performance = platformPerformance(state, account && account.id);
    var cash = num(account && account.cashBalance) + num(performance.currentPlatformBalance);
    var bonus = num(account && account.bonusBalance);
    var freeBet = num(account && account.freeBetBalance);
    var reserved = reservedAmount(state, account && account.id);
    return {
      cashBalance: cash,
      bonusBalance: bonus,
      freeBetBalance: freeBet,
      existingReservation: reserved,
      availableCash: Math.max(0, cash - reserved),
      availableTotal: Math.max(0, cash + bonus + freeBet - reserved)
    };
  }

  function classifyStatus(errors, reviews) {
    if (errors.length) return 'Unavailable';
    if (reviews.length) return 'Requires Review';
    return 'Recommended';
  }

  function evaluatePlatformAccount(state, criteria, account) {
    var rule = latestPlatformRule(state, account && account.platformId, criteria && criteria.date);
    var data = criteria || {};
    var errors = [];
    var reviews = [];
    var info = [];
    var badges = [];
    var stake = num(data.stake);
    var odds = num(data.odds);
    var payout = num(data.potentialPayout || (stake && odds ? stake * odds : 0));
    var balance = platformAvailableBalances(state, account || {});
    var turnover = turnoverSummary(account || {}, rule);
    var accountEventAllocations = eventAllocations(state, data, account && account.id);
    var sameEventOutcomeAllocations = eventAllocations(state, data).filter(function (item) {
      return item.outcomeName === data.outcomeName;
    });
    var platformEventAllocations = eventAllocations(state, data).filter(function (item) {
      return item.platformId === (account && account.platformId);
    });
    var currentOutcomeAlreadyUsed = accountEventAllocations.some(function (item) {
      return item.outcomeName === data.outcomeName;
    });
    var newOutcomeCount = distinct(accountEventAllocations.map(function (item) { return item.outcomeName; }).concat([data.outcomeName])).length;
    var platformOutcomeCount = distinct(platformEventAllocations.map(function (item) { return item.outcomeName; }).concat([data.outcomeName])).length;

    if (!account) {
      errors.push('Platform account is required.');
    } else {
      if (data.platformId && account.platformId !== data.platformId) errors.push('Account belongs to another platform.');
      if (account.status !== 'Active') errors.push('Account operational status is ' + (account.status || 'Unknown') + '.');
    }
    if (rule.platformStatus !== 'Active') errors.push('Platform status is ' + rule.platformStatus + '.');
    if (stake <= 0) errors.push('Planned stake must be positive.');
    if (balance.availableTotal + 0.00001 < stake) {
      errors.push('Insufficient available balance. Maximum available amount is ' + balance.availableTotal.toFixed(2) + '.');
    }
    if (odds && odds < num(rule.minEligibleOdds)) errors.push('Odds are outside the configured platform rule: below minimum ' + rule.minEligibleOdds + '.');
    if (odds && num(rule.maxEligibleOdds) && odds > num(rule.maxEligibleOdds)) errors.push('Odds are outside the configured platform rule: above maximum ' + rule.maxEligibleOdds + '.');
    if (num(rule.maxStake) && stake > num(rule.maxStake)) errors.push('Maximum stake exceeded for this platform.');
    if (num(rule.maxPayout) && payout > num(rule.maxPayout)) errors.push('Maximum payout exceeded for this platform.');
    if (num(data.requiredTurnoverAllocation) > turnover.remainingTurnoverAmount + 0.00001) {
      errors.push('Required turnover allocation exceeds remaining turnover.');
    }
    if (num(data.requiredTurnoverAllocation) > stake + 0.00001) {
      errors.push('Stake is below the required turnover amount for this calculation.');
    }

    if (accountEventAllocations.length) {
      badges.push('Already Used in Event');
      if (!rule.sameAccountMultipleOutcomes && !currentOutcomeAlreadyUsed) {
        errors.push('This account is already assigned to another outcome in this event.');
      } else {
        info.push('Platform configuration allows multiple outcome allocations.');
      }
      if (newOutcomeCount > num(rule.maxOutcomesPerEvent)) {
        errors.push('Maximum outcomes reached for this account in this event.');
      }
    }

    if (sameEventOutcomeAllocations.some(function (item) { return item.platformAccountId !== (account && account.id); }) && !rule.multipleAccountsOneOutcome) {
      errors.push('Platform rule does not allow multiple accounts on one outcome.');
    }

    if (!rule.sameAccountAcrossMarkets && accountEventAllocations.some(function (item) {
      return item.marketName && data.marketName && item.marketName !== data.marketName;
    })) {
      errors.push('Same account is not allowed across different markets of the same event.');
    }

    if (String(data.marketType || '').toLowerCase().indexOf('three') !== -1 && platformOutcomeCount >= 2) {
      if (rule.twoOfThreeOutcomesAllowed === 'Not Allowed') {
        errors.push('Platform does not allow two of three outcomes for this event.');
      } else if (rule.twoOfThreeOutcomesAllowed === 'Manual Review Required') {
        reviews.push('Manual Platform Rule Review Required for two of three outcomes.');
      } else {
        info.push('Two of three outcomes allowed by platform configuration.');
      }
    }

    var supportedBonuses = splitList(rule.bonusTypesSupported).map(function (item) { return item.toLowerCase(); });
    if (num(account && account.bonusBalance) > 0 && account && account.bonusType && supportedBonuses.length && supportedBonuses.indexOf(String(account.bonusType).toLowerCase()) === -1) {
      reviews.push('Bonus type requires review for this platform rule.');
    }
    if (rule.manualApprovalRequired) reviews.push('Manual approval is required by platform profile.');

    if (turnover.effectiveTurnoverPercentage) badges.push('Turnover ' + turnover.effectiveTurnoverPercentage + '%');
    if (num(account && account.bonusBalance) > 0) badges.push('Bonus Active');
    if (turnover.remainingTurnoverAmount > 0) badges.push('Turnover Pending');
    if (num(rule.maxOutcomesPerEvent) === 1) badges.push('One Outcome Maximum');
    if (num(rule.maxOutcomesPerEvent) === 2 || rule.twoOfThreeOutcomesAllowed === 'Allowed') badges.push('Two Outcomes Allowed');
    if (reviews.length) badges.push('Manual Review');

    var hardMax = balance.availableTotal;
    if (num(rule.maxStake)) hardMax = Math.min(hardMax, num(rule.maxStake));
    if (num(rule.maxPayout) && odds > 0) hardMax = Math.min(hardMax, num(rule.maxPayout) / odds);
    var status = classifyStatus(errors, reviews);

    return {
      accountId: account && account.id,
      platformId: account && account.platformId,
      clientId: account && account.clientId,
      userId: account && account.userId,
      status: status,
      reasons: errors.concat(reviews, info),
      errors: errors,
      warnings: reviews,
      info: info,
      badges: badges,
      rule: rule,
      turnover: turnover,
      balances: balance,
      existingAllocationsInEvent: accountEventAllocations,
      maxAdditionalStake: Math.max(0, hardMax),
      suggested: status === 'Recommended'
    };
  }

  function eligibilityPreview(state, criteria) {
    var platformId = criteria && criteria.platformId;
    var accounts = (state.userPlatforms || []).filter(function (account) {
      return !platformId || account.platformId === platformId;
    });
    var evaluations = accounts.map(function (account) {
      return evaluatePlatformAccount(state, criteria, account);
    }).sort(function (a, b) {
      return b.maxAdditionalStake - a.maxAdditionalStake;
    });
    var groups = {
      recommended: evaluations.filter(function (item) { return item.status === 'Recommended'; }),
      eligible: evaluations.filter(function (item) { return item.status === 'Eligible'; }),
      requiresReview: evaluations.filter(function (item) { return item.status === 'Requires Review'; }),
      unavailable: evaluations.filter(function (item) { return item.status === 'Unavailable'; })
    };
    if (groups.recommended.length > 1) {
      groups.eligible = groups.recommended.slice(1).concat(groups.eligible);
      groups.recommended = groups.recommended.slice(0, 1);
      groups.eligible.forEach(function (item) {
        if (item.status === 'Recommended') item.status = 'Eligible';
      });
    }
    return {
      evaluations: evaluations,
      groups: groups
    };
  }

  function validateAllocation(state, data, actor) {
    var account = byId(state.userPlatforms || [], data.platformAccountId);
    var evaluation = evaluatePlatformAccount(state, data, account);
    var errors = [];
    var warnings = evaluation.warnings.slice();
    var ownerOverride = data.ownerOverride === true || data.ownerOverride === 'true';
    if (!account) errors.push('Select a platform account before reserving a stake.');
    if (evaluation.status === 'Unavailable' && !ownerOverride) {
      errors = errors.concat(evaluation.errors);
    }
    if (evaluation.status === 'Requires Review' && !ownerOverride) {
      errors.push('Owner confirmation is required before finalizing this allocation.');
    }
    if (ownerOverride) {
      if (!actor || actor.role !== 'owner') errors.push('Only the Owner can override platform-account eligibility rules.');
      if (!data.overrideReason) errors.push('Override reason is required.');
    }
    return { errors: unique(errors), warnings: unique(warnings), evaluation: evaluation };
  }

  function sessionActivity(action, data, actor) {
    return {
      id: uid('act'),
      action: action,
      userId: actor ? actor.id : '',
      role: actor ? actor.role : '',
      createdAt: nowIso(),
      data: data || {}
    };
  }

  function buildOperationalSession(data, account, evaluation, actor) {
    var rule = evaluation.rule;
    var turnover = evaluation.turnover;
    var balance = evaluation.balances;
    var allocationId = uid('alloc');
    var sessionId = uid('sess');
    var session = {
      id: sessionId,
      allocationId: allocationId,
      eventId: data.eventId || data.eventName,
      eventName: data.eventName || data.eventId,
      marketType: data.marketType || '',
      marketName: data.marketName || '',
      outcomeName: data.outcomeName || '',
      platformId: account.platformId,
      platformAccountId: account.id,
      clientId: account.clientId,
      userId: account.userId,
      ruleVersionId: data.ruleVersionId || rule.versionId || '',
      ruleSnapshot: rule,
      openingCashBalance: balance.cashBalance,
      openingBonusBalance: balance.bonusBalance,
      odds: num(data.odds),
      plannedStake: num(data.stake),
      executedStake: 0,
      cashAmount: num(data.cashAmount),
      bonusAmount: num(data.bonusAmount),
      requiredTurnoverAllocation: num(data.requiredTurnoverAllocation),
      turnoverBefore: turnover,
      completedTurnover: 0,
      remainingTurnover: turnover.remainingTurnoverAmount,
      resultStatus: 'Pending',
      payout: 0,
      refund: 0,
      profitLoss: 0,
      endingCashBalance: null,
      endingBonusBalance: null,
      withdrawalAmount: 0,
      paymentStatus: 'Pending',
      notes: data.notes || '',
      status: data.ownerOverride ? 'Review Required' : 'Reserved',
      createdBy: actor ? actor.id : '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      activityLog: [
        sessionActivity('Session created', {
          selectedUser: account.userId,
          selectedPlatformAccount: account.id,
          ruleSnapshot: rule,
          validation: evaluation
        }, actor),
        sessionActivity('Stake reserved', {
          plannedStake: num(data.stake),
          cashAmount: num(data.cashAmount),
          bonusAmount: num(data.bonusAmount),
          requiredTurnoverAllocation: num(data.requiredTurnoverAllocation)
        }, actor)
      ]
    };
    var allocation = {
      id: allocationId,
      sessionId: sessionId,
      eventId: session.eventId,
      eventName: session.eventName,
      marketType: session.marketType,
      marketName: session.marketName,
      outcomeName: session.outcomeName,
      platformId: account.platformId,
      platformAccountId: account.id,
      clientId: account.clientId,
      userId: account.userId,
      odds: num(data.odds),
      plannedStake: num(data.stake),
      potentialPayout: num(data.potentialPayout || (num(data.stake) * num(data.odds))),
      cashAmount: num(data.cashAmount),
      bonusAmount: num(data.bonusAmount),
      requiredTurnoverAllocation: num(data.requiredTurnoverAllocation),
      status: session.status,
      ruleSnapshot: rule,
      ruleVersionId: session.ruleVersionId,
      overrideReason: data.overrideReason || '',
      createdBy: actor ? actor.id : '',
      createdAt: nowIso()
    };
    return { session: session, allocation: allocation };
  }

  function settleOperationalSession(session, account, patch, actor) {
    var next = JSON.parse(JSON.stringify(session || {}));
    var rule = next.ruleSnapshot || latestPlatformRule({ platformRules: [] }, account && account.platformId);
    var currentTurnover = turnoverSummary(account || {}, rule);
    var executedStake = num(patch.executedStake);
    var eligibleExecutedTurnover = Math.min(executedStake, currentTurnover.remainingTurnoverAmount);
    var newRemaining = Math.max(0, currentTurnover.remainingTurnoverAmount - eligibleExecutedTurnover);
    next.resultStatus = patch.resultStatus || next.resultStatus;
    next.executedStake = executedStake;
    next.payout = num(patch.payout);
    next.refund = num(patch.refund);
    next.profitLoss = next.payout + next.refund - executedStake;
    next.endingCashBalance = patch.endingCashBalance === '' || patch.endingCashBalance == null ? next.endingCashBalance : num(patch.endingCashBalance);
    next.endingBonusBalance = patch.endingBonusBalance === '' || patch.endingBonusBalance == null ? next.endingBonusBalance : num(patch.endingBonusBalance);
    next.withdrawalAmount = num(patch.withdrawalAmount);
    next.paymentStatus = patch.paymentStatus || next.paymentStatus;
    next.completedTurnover = eligibleExecutedTurnover;
    next.remainingTurnover = newRemaining;
    next.status = next.resultStatus === 'Pending' ? 'Reserved' : 'Settled';
    next.updatedAt = nowIso();
    next.activityLog = next.activityLog || [];
    next.activityLog.push(sessionActivity('Settlement recorded', {
      previousRemainingTurnover: currentTurnover.remainingTurnoverAmount,
      executedStake: executedStake,
      eligibleExecutedTurnover: eligibleExecutedTurnover,
      newRemainingTurnover: newRemaining,
      payout: next.payout,
      refund: next.refund,
      profitLoss: next.profitLoss,
      endingCashBalance: next.endingCashBalance,
      endingBonusBalance: next.endingBonusBalance,
      withdrawalAmount: next.withdrawalAmount,
      paymentStatus: next.paymentStatus,
      notes: patch.notes || ''
    }, actor));
    return {
      session: next,
      turnoverDelta: eligibleExecutedTurnover,
      previousRemainingTurnover: currentTurnover.remainingTurnoverAmount,
      newRemainingTurnover: newRemaining
    };
  }

  window.AtlasWorkflowService = {
    assignedClientIds: assignedClientIds,
    canAccessClient: canAccessClient,
    clientCapitalSummary: clientCapitalSummary,
    validateUserAllocation: validateUserAllocation,
    validateAccount: validateAccount,
    validatePlatformAccount: validatePlatformAccount,
    transferOptions: transferOptions,
    validateTransfer: validateTransfer,
    validatePlatformFunding: validatePlatformFunding,
    createPlatformFunding: createPlatformFunding,
    validatePlatformResult: validatePlatformResult,
    createPlatformResult: createPlatformResult,
    validateExpectedWithdrawalUpdate: validateExpectedWithdrawalUpdate,
    updateExpectedWithdrawal: updateExpectedWithdrawal,
    platformPerformance: platformPerformance,
    userPlatformAnalysis: userPlatformAnalysis,
    clientPlatformSummary: clientPlatformSummary,
    notificationCounts: notificationCounts,
    createNotification: createNotification,
    createAudit: createAudit,
    userAccounts: userAccounts,
    waitingDays: waitingDays,
    defaultPlatformRule: defaultPlatformRule,
    normalizeRule: normalizeRule,
    latestPlatformRule: latestPlatformRule,
    turnoverSummary: turnoverSummary,
    turnoverBaseAmount: turnoverBaseAmount,
    turnoverPercentForAccount: turnoverPercentForAccount,
    platformAvailableBalances: platformAvailableBalances,
    evaluatePlatformAccount: evaluatePlatformAccount,
    eligibilityPreview: eligibilityPreview,
    validateAllocation: validateAllocation,
    buildOperationalSession: buildOperationalSession,
    settleOperationalSession: settleOperationalSession,
    sessionActivity: sessionActivity,
    reservedAmount: reservedAmount
  };
})();
