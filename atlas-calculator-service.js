(function () {
  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function roundTo(value, increment) {
    var step = num(increment) || 0.01;
    return Math.round(num(value) / step) * step;
  }

  function sum(list, getter) {
    return (list || []).reduce(function (total, item, index) {
      return total + num(getter(item, index));
    }, 0);
  }

  function makeOutcomeDefaults(marketType) {
    if (marketType === 'Two Outcome') {
      return [
        { id: uid('out'), name: 'Team 1 Win', marketKey: 'team1_win', odds: 1.90, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
        { id: uid('out'), name: 'Team 2 Win', marketKey: 'team2_win', odds: 1.90, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' }
      ];
    }
    if (marketType === 'Mixed/DNB') {
      return [
        { id: uid('out'), name: 'Team 1 Win', marketKey: 'team1_win', odds: 1.62, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
        { id: uid('out'), name: 'Draw', marketKey: 'draw', odds: 3.90, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
        { id: uid('out'), name: 'Team 2 Win', marketKey: 'team2_win', odds: 6.85, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
        { id: uid('out'), name: 'Team 1 DNB', marketKey: 'team1_dnb', odds: 1.20, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
        { id: uid('out'), name: 'Team 2 DNB', marketKey: 'team2_dnb', odds: 4.70, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' }
      ];
    }
    return [
      { id: uid('out'), name: 'Team 1 Win', marketKey: 'team1_win', odds: 1.90, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
      { id: uid('out'), name: 'Draw', marketKey: 'draw', odds: 3.20, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' },
      { id: uid('out'), name: 'Team 2 Win', marketKey: 'team2_win', odds: 3.80, active: true, locked: false, plannedStake: 0, minStake: '', maxStake: '', requiredTurnover: '' }
    ];
  }

  function activeOutcomes(outcomes) {
    return (outcomes || []).filter(function (outcome) {
      return outcome.active !== false && num(outcome.odds) > 1;
    });
  }

  function scenarioNames(marketType, outcomes) {
    if (marketType === 'Two Outcome') return ['Team 1 Win', 'Team 2 Win'];
    var hasDraw = (outcomes || []).some(function (outcome) {
      return outcome.marketKey === 'draw' || /draw/i.test(outcome.name || '');
    });
    return hasDraw || marketType === 'Mixed/DNB' ? ['Team 1 Win', 'Draw', 'Team 2 Win'] : (outcomes || []).map(function (item) { return item.name; });
  }

  function outcomeReturnFactor(outcome, scenario) {
    var key = outcome.marketKey || '';
    if (scenario === 'Team 1 Win') {
      if (key === 'team1_win' || key === 'team1_dnb') return num(outcome.odds);
      return 0;
    }
    if (scenario === 'Draw') {
      if (key === 'draw') return num(outcome.odds);
      if (key === 'team1_dnb' || key === 'team2_dnb') return 1;
      return 0;
    }
    if (scenario === 'Team 2 Win') {
      if (key === 'team2_win' || key === 'team2_dnb') return num(outcome.odds);
      return 0;
    }
    return scenario === outcome.name ? num(outcome.odds) : 0;
  }

  function buildScenarioMatrix(marketType, outcomes) {
    var active = activeOutcomes(outcomes);
    var scenarios = scenarioNames(marketType, active);
    return scenarios.map(function (scenario) {
      return {
        name: scenario,
        factors: active.map(function (outcome) {
          return outcomeReturnFactor(outcome, scenario);
        })
      };
    });
  }

  function scenarioReturns(stakes, matrix) {
    return matrix.map(function (scenario) {
      return sum(scenario.factors, function (factor, index) {
        return factor * num(stakes[index]);
      });
    });
  }

  function score(stakes, matrix, totalStake) {
    var returns = scenarioReturns(stakes, matrix);
    var profits = returns.map(function (value) { return value - totalStake; });
    var maxProfit = Math.max.apply(Math, profits);
    var minProfit = Math.min.apply(Math, profits);
    var worstLossPenalty = minProfit < 0 ? Math.abs(minProfit) * 0.15 : 0;
    return (maxProfit - minProfit) + worstLossPenalty;
  }

  function applyLimits(stakes, outcomes, increment) {
    return stakes.map(function (stake, index) {
      var outcome = outcomes[index];
      var next = Math.max(0, num(stake));
      if (outcome.minStake !== '' && outcome.minStake != null) next = Math.max(next, num(outcome.minStake));
      if (outcome.maxStake !== '' && outcome.maxStake != null && num(outcome.maxStake) > 0) next = Math.min(next, num(outcome.maxStake));
      return roundTo(next, increment);
    });
  }

  function normalizeToCapital(stakes, totalCapital, outcomes, increment) {
    var total = sum(stakes, function (stake) { return stake; });
    if (total <= 0) return stakes;
    var scaled = stakes.map(function (stake) { return stake * totalCapital / total; });
    var limited = applyLimits(scaled, outcomes, increment);
    var diff = roundTo(totalCapital - sum(limited, function (stake) { return stake; }), increment);
    if (Math.abs(diff) >= (num(increment) || 0.01) / 2 && limited.length) {
      var index = 0;
      for (var i = 1; i < limited.length; i += 1) {
        if (limited[i] > limited[index]) index = i;
      }
      limited[index] = roundTo(Math.max(0, limited[index] + diff), increment);
    }
    return limited;
  }

  function initialStakes(active, settings, matrix) {
    var totalCapital = num(settings.totalCapital);
    if (settings.mode === 'Manual Stakes') {
      return applyLimits(active.map(function (outcome) { return num(outcome.plannedStake); }), active, settings.increment);
    }
    if (settings.mode === 'Target Gross Return') {
      var target = num(settings.targetReturn);
      return applyLimits(active.map(function (outcome) {
        return target > 0 ? target / num(outcome.odds) : 0;
      }), active, settings.increment);
    }
    var lockedTotal = sum(active, function (outcome) {
      return outcome.locked ? num(outcome.plannedStake) : 0;
    });
    var unlocked = active.filter(function (outcome) { return !outcome.locked; });
    if (lockedTotal > 0 && unlocked.length) {
      var remainingCapital = Math.max(0, totalCapital - lockedTotal);
      var unlockedInverse = sum(unlocked, function (outcome) { return 1 / num(outcome.odds); });
      var lockedAware = active.map(function (outcome) {
        if (outcome.locked) return num(outcome.plannedStake);
        return unlockedInverse > 0 ? remainingCapital * (1 / num(outcome.odds)) / unlockedInverse : 0;
      });
      return applyLimits(lockedAware, active, settings.increment);
    }
    var inverseTotal = sum(active, function (outcome) { return 1 / num(outcome.odds); });
    var inverseStakes = active.map(function (outcome) {
      return inverseTotal > 0 ? totalCapital * (1 / num(outcome.odds)) / inverseTotal : 0;
    });
    return normalizeToCapital(inverseStakes, totalCapital, active, settings.increment);
  }

  function optimizeStakes(stakes, active, settings, matrix) {
    if (settings.mode !== 'Equal Scenario Profit') return stakes;
    var totalCapital = num(settings.totalCapital);
    var increment = num(settings.increment) || 0.01;
    var current = normalizeToCapital(stakes, totalCapital, active, increment);
    var step = Math.max(increment, totalCapital / 20);
    var bestScore = score(current, matrix, sum(current, function (stake) { return stake; }));

    for (var round = 0; round < 80; round += 1) {
      var improved = false;
      for (var from = 0; from < current.length; from += 1) {
        for (var to = 0; to < current.length; to += 1) {
          if (from === to || current[from] < step) continue;
          var candidate = current.slice();
          candidate[from] = Math.max(0, candidate[from] - step);
          candidate[to] += step;
          candidate = applyLimits(candidate, active, increment);
          candidate = normalizeToCapital(candidate, totalCapital, active, increment);
          var candidateScore = score(candidate, matrix, sum(candidate, function (stake) { return stake; }));
          if (candidateScore + 0.00001 < bestScore) {
            current = candidate;
            bestScore = candidateScore;
            improved = true;
          }
        }
      }
      if (!improved) step = step / 2;
      if (step < increment) break;
    }
    return current;
  }

  function calculate(settings) {
    var active = activeOutcomes(settings.outcomes);
    var warnings = [];
    if (!active.length) warnings.push('Add at least one active outcome with odds above 1.');
    if (num(settings.totalCapital) <= 0 && settings.mode !== 'Target Gross Return') warnings.push('Total calculator capital must be positive.');
    var matrix = buildScenarioMatrix(settings.marketType, active);
    var stakes = initialStakes(active, settings, matrix);
    stakes = optimizeStakes(stakes, active, settings, matrix);
    var totalStake = sum(stakes, function (stake) { return stake; });
    var returns = scenarioReturns(stakes, matrix);
    var profits = returns.map(function (value) { return value - totalStake; });

    active.forEach(function (outcome, index) {
      if (outcome.requiredTurnover !== '' && num(stakes[index]) < num(outcome.requiredTurnover)) {
        warnings.push(outcome.name + ' stake is below its required turnover constraint.');
      }
      if (outcome.maxStake !== '' && num(outcome.maxStake) > 0 && num(stakes[index]) > num(outcome.maxStake)) {
        warnings.push(outcome.name + ' exceeds maximum stake.');
      }
    });
    if (settings.mode === 'Target Gross Return' && num(settings.totalCapital) > 0 && totalStake > num(settings.totalCapital) + 0.00001) {
      warnings.push('Target gross return requires more than the available calculator capital.');
    }

    return {
      settings: settings,
      activeOutcomes: active,
      outcomeRows: active.map(function (outcome, index) {
        return {
          outcomeId: outcome.id,
          name: outcome.name,
          marketKey: outcome.marketKey,
          odds: num(outcome.odds),
          stake: num(stakes[index]),
          locked: outcome.locked === true,
          requiredTurnover: num(outcome.requiredTurnover),
          maxStake: outcome.maxStake === '' ? 0 : num(outcome.maxStake),
          minStake: outcome.minStake === '' ? 0 : num(outcome.minStake)
        };
      }),
      scenarios: matrix.map(function (scenario, index) {
        return {
          name: scenario.name,
          grossReturn: returns[index],
          profitLoss: profits[index],
          returnFactors: scenario.factors
        };
      }),
      totalStake: totalStake,
      bestProfit: profits.length ? Math.max.apply(Math, profits) : 0,
      worstProfit: profits.length ? Math.min.apply(Math, profits) : 0,
      spread: profits.length ? Math.max.apply(Math, profits) - Math.min.apply(Math, profits) : 0,
      warnings: warnings
    };
  }

  window.AtlasCalculatorService = {
    makeOutcomeDefaults: makeOutcomeDefaults,
    calculate: calculate,
    buildScenarioMatrix: buildScenarioMatrix
  };
})();
