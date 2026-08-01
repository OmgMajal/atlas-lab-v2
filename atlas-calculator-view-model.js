(function (root, factory) {
  var service = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = service;
  if (root) root.AtlasCalculatorViewModel = service;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function sum(list, getter) {
    return (list || []).reduce(function (total, item, index) {
      return total + num(getter(item, index));
    }, 0);
  }

  function unique(list) {
    var seen = {};
    return (list || []).filter(function (item) {
      var key = String(item.category || '') + '|' + String(item.message || '') + '|' +
        String(item.accountId || '') + '|' + String(item.eventId || '');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function stakeParts(allocation) {
    var cash = num(allocation.cashAmount);
    var bonus = num(allocation.bonusAmount);
    var freeBet = num(allocation.freeBetAmount);
    var parts = [];
    if (cash) parts.push('C' + cash);
    if (bonus) parts.push('B' + bonus);
    if (freeBet) parts.push('FB' + freeBet);
    return {
      cash: cash,
      bonus: bonus,
      freeBet: freeBet,
      total: cash + bonus + freeBet || num(allocation.finalStake || allocation.plannedStake || allocation.stakeAmount),
      compact: parts.join(' + ') || '-'
    };
  }

  function allocationStatus(allocation) {
    if (num(allocation.executedStake) > 0 || allocation.executionStatus === 'Executed' || allocation.status === 'Executed') return 'Executed';
    if (allocation.locked || allocation.lockedAt || allocation.status === 'Locked') return 'Locked';
    if (allocation.status === 'Cancelled') return 'Cancelled';
    return 'Draft';
  }

  function eventTimeLabel(event, today) {
    if (event.status === 'Settled' || event.resultStatus === 'Settled') return event.actualResult || event.resultName || 'Settled';
    var raw = event.eventStartTime || event.startTime || event.eventDate || '';
    if (!raw) return event.marketName || event.marketType || '';
    var date = String(raw).slice(0, 10);
    var time = String(raw).indexOf('T') >= 0 ? String(raw).slice(11, 16) : '';
    if (date === today) return time || '';
    var parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parsed.getMonth()];
      return month + ' ' + parsed.getDate() + (time ? ', ' + time : '');
    }
    return date;
  }

  function mixTimingLabel(mix) {
    var minutes = num(mix.nextGapMinutes);
    if (!minutes && minutes !== 0) return '';
    if (minutes >= 30) return '+' + minutes + 'm';
    if (minutes >= 15) return minutes + 'm Limited';
    return minutes + 'm Too Close';
  }

  function eventHeader(event, today) {
    if (event.isMix) {
      return {
        id: event.id,
        shortName: 'M' + num(event.legCount) + ' \u2022 ' + num(event.combinedOdds).toFixed(2),
        meta: (event.activeLegLabel || 'No active leg') + (mixTimingLabel(event) ? ' \u2022 ' + mixTimingLabel(event) : ''),
        status: event.status || 'Draft',
        isMix: true
      };
    }
    return {
      id: event.id,
      shortName: event.shortName || event.eventName || 'Untitled Event',
      meta: [event.marketName || event.marketType || '', eventTimeLabel(event, today)].filter(Boolean).join(' \u2022 '),
      status: event.status || 'Draft',
      isMix: false
    };
  }

  function eventAllocations(event) {
    return event.assignments || event.allocations || [];
  }

  function buildCell(account, event) {
    var allocations = eventAllocations(event).filter(function (allocation) {
      return allocation.platformAccountId === account.platformAccountId;
    });
    if (!allocations.length) {
      return {
        accountId: account.platformAccountId,
        eventId: event.id,
        allocations: [],
        empty: true,
        label: 'Add allocation',
        status: 'Empty',
        warningCount: 0
      };
    }
    var total = sum(allocations, function (allocation) { return stakeParts(allocation).total; });
    var statuses = allocations.map(allocationStatus);
    var status = statuses.indexOf('Executed') !== -1 ? 'Executed' :
      (statuses.indexOf('Locked') !== -1 ? 'Locked' : 'Draft');
    var labels = allocations.map(function (allocation) {
      var parts = stakeParts(allocation);
      return {
        id: allocation.id || '',
        outcome: allocation.outcomeName || allocation.outcome || 'Outcome',
        odds: num(allocation.lockedOdds || allocation.odds),
        stake: parts.total,
        composition: parts.compact,
        status: allocationStatus(allocation)
      };
    });
    return {
      accountId: account.platformAccountId,
      eventId: event.id,
      allocations: allocations,
      empty: false,
      label: labels.length > 1 ? labels.length + ' allocations' : labels[0].outcome,
      odds: labels.length === 1 ? labels[0].odds : 0,
      total: total,
      composition: labels.length === 1 ? labels[0].composition : labels.length + ' portions',
      status: status,
      warningCount: sum(allocations, function (allocation) { return (allocation.warnings || []).length; }),
      rows: labels
    };
  }

  function outcomeCoverage(result, events, coverageRows) {
    if (coverageRows && coverageRows.length) {
      return coverageRows.map(function (row) {
        return {
          outcomeId: row.outcomeId,
          name: row.name || row.outcomeName,
          requiredStake: num(row.requiredStake),
          assignedStake: num(row.assignedStake),
          remainingStake: Math.max(0, num(row.remainingStake))
        };
      });
    }
    if (!result || !result.outcomeRows) return [];
    var current = events.filter(function (event) { return event.isCurrent; })[0] || events[events.length - 1] || {};
    var assignments = eventAllocations(current);
    return result.outcomeRows.map(function (outcome) {
      var assigned = sum(assignments.filter(function (allocation) {
        return allocation.outcomeId === outcome.outcomeId;
      }), function (allocation) { return stakeParts(allocation).total; });
      return {
        outcomeId: outcome.outcomeId,
        name: outcome.name,
        requiredStake: num(outcome.stake),
        assignedStake: assigned,
        remainingStake: Math.max(0, num(outcome.stake) - assigned)
      };
    });
  }

  function buildWarnings(input, coverage) {
    var warnings = (input.warnings || []).map(function (warning) {
      if (typeof warning === 'string') return { category: 'Calculator', severity: 'warning', message: warning };
      return warning;
    });
    if (!(input.accounts || []).length) {
      warnings.push({
        category: 'Missing account pool',
        severity: 'warning',
        message: 'Add at least one Client-scoped Platform Account to this Session.'
      });
    }
    coverage.forEach(function (row) {
      if (row.remainingStake > 0.00001) {
        warnings.push({
          category: 'Incomplete outcome coverage',
          severity: 'warning',
          eventId: input.activeEventId || '',
          outcomeId: row.outcomeId,
          message: row.name + ' has ' + row.remainingStake.toFixed(2) + ' remaining to allocate.'
        });
      }
    });
    (input.accounts || []).forEach(function (account) {
      (account.warnings || []).forEach(function (message) {
        warnings.push({
          category: 'Account',
          severity: 'warning',
          accountId: account.platformAccountId,
          message: message
        });
      });
    });
    (input.mixWarnings || []).forEach(function (warning) {
      warnings.push(typeof warning === 'string' ? {
        category: 'Mix timing',
        severity: 'warning',
        message: warning
      } : warning);
    });
    return unique(warnings);
  }

  function buildSummary(input, coverage, warnings) {
    var accounts = input.accounts || [];
    var result = input.result || {};
    var scenarios = result.scenarios || [];
    var available = sum(accounts, function (account) { return account.availableCapital; });
    var reserved = sum(accounts, function (account) { return account.reservedCapital; });
    var executed = sum(accounts, function (account) { return account.executedCapital; });
    var required = num(result.totalStake) || sum(input.events || [], function (event) {
      return sum(eventAllocations(event), function (allocation) { return stakeParts(allocation).total; });
    });
    var returns = scenarios.map(function (scenario) { return num(scenario.grossReturn); });
    var minimumReturn = returns.length ? Math.min.apply(Math, returns) : 0;
    var maximumReturn = returns.length ? Math.max.apply(Math, returns) : 0;
    var currentReturnPercentage = required > 0 ? minimumReturn / required * 100 : 0;
    var targetReturnPercentage = num(input.targetReturnPercentage);
    var targetGross = required * targetReturnPercentage / 100;
    var remainingImbalance = Math.max(0, targetGross - minimumReturn);
    return {
      accountsSelected: accounts.length,
      availableCapital: available,
      reservedCapital: reserved,
      executedCapital: executed,
      remainingCapital: Math.max(0, available - reserved),
      requiredCapital: required,
      minimumReturn: minimumReturn,
      maximumReturn: maximumReturn,
      worstCaseProfit: num(result.worstProfit),
      bestCaseProfit: num(result.bestProfit),
      currentReturnPercentage: currentReturnPercentage,
      targetReturnPercentage: targetReturnPercentage,
      remainingImbalance: remainingImbalance,
      uncoveredOutcomes: coverage.filter(function (row) { return row.remainingStake > 0.00001; }).length,
      warningCount: warnings.length
    };
  }

  function build(input) {
    input = input || {};
    var today = input.today || String(new Date().toISOString()).slice(0, 10);
    var accounts = input.accounts || [];
    var events = input.events || [];
    var coverage = outcomeCoverage(input.result, events, input.coverageRows);
    var warnings = buildWarnings(input, coverage);
    var summary = buildSummary(input, coverage, warnings);
    return {
      session: input.session || {},
      view: input.view || 'allocation',
      density: input.density || 'compact',
      accounts: accounts,
      events: events.map(function (event) {
        return Object.assign({}, event, {
          header: eventHeader(event, today),
          cells: accounts.map(function (account) { return buildCell(account, event); })
        });
      }),
      coverage: coverage,
      warnings: warnings,
      summary: summary,
      balancing: {
        scenarios: (input.result && input.result.scenarios) || [],
        currentReturnPercentage: summary.currentReturnPercentage,
        targetReturnPercentage: summary.targetReturnPercentage,
        remainingImbalance: summary.remainingImbalance
      },
      turnover: accounts.map(function (account) {
        return {
          accountId: account.platformAccountId,
          accountName: account.accountName,
          platformName: account.platformName,
          required: num(account.requiredTurnover),
          completed: num(account.completedTurnover),
          remaining: num(account.remainingTurnover),
          eligibleOdds: account.eligibleOdds || '-',
          sessionContribution: num(account.sessionTurnoverContribution),
          status: num(account.remainingTurnover) <= 0 ? 'Complete' : (num(account.sessionTurnoverContribution) > 0 ? 'In Progress' : 'Action Required')
        };
      }),
      results: events.map(function (event) {
        return {
          eventId: event.id,
          eventName: event.eventName,
          actualResult: event.actualResult || '',
          status: event.status || 'Draft',
          allocations: eventAllocations(event).filter(function (allocation) {
            return num(allocation.executedStake) > 0 || allocation.executionStatus === 'Executed' || allocation.status === 'Settled';
          })
        };
      })
    };
  }

  return {
    build: build,
    stakeParts: stakeParts,
    allocationStatus: allocationStatus,
    eventTimeLabel: eventTimeLabel,
    mixTimingLabel: mixTimingLabel
  };
});
