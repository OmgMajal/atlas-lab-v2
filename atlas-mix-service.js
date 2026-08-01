(function (root, factory) {
  var service = factory();
  root.AtlasMixService = service;
  if (typeof module !== 'undefined' && module.exports) module.exports = service;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this), function () {
  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function round(value) {
    return Math.round(num(value) * 1000000) / 1000000;
  }

  function sum(list, getter) {
    return (list || []).reduce(function (total, item, index) {
      return total + num(getter(item, index));
    }, 0);
  }

  function product(list, getter) {
    return (list || []).reduce(function (total, item, index) {
      return total * num(getter(item, index));
    }, 1);
  }

  function singleFreeBet(stake, lockedOdds) {
    var originalOdds = num(lockedOdds);
    var effectiveOdds = Math.max(0, originalOdds - 1);
    return {
      originalOdds: originalOdds,
      effectiveFreeBetOdds: effectiveOdds,
      freeBetStake: num(stake),
      truePotentialWin: round(num(stake) * effectiveOdds)
    };
  }

  function defaultMix(data) {
    data = data || {};
    return {
      id: data.id || uid('mix'),
      sessionId: data.sessionId || '',
      clientId: data.clientId || '',
      userId: data.userId || '',
      platformId: data.platformId || '',
      platformAccountId: data.platformAccountId || '',
      ticketReference: data.ticketReference || '',
      status: data.status || 'Draft',
      cashPortion: num(data.cashPortion),
      normalBonusPortion: num(data.normalBonusPortion),
      freeBetPortion: num(data.freeBetPortion),
      minimumGapMinutes: num(data.minimumGapMinutes) || 15,
      recommendedGapMinutes: num(data.recommendedGapMinutes) || 30,
      primaryGoal: data.primaryGoal || '',
      secondaryGoal: data.secondaryGoal || '',
      minimumTargetReturn: num(data.minimumTargetReturn),
      legs: clone(data.legs || []),
      hedges: clone(data.hedges || []),
      freeBetDeductionApplied: data.freeBetDeductionApplied === true,
      freeBetDeductionCount: num(data.freeBetDeductionCount),
      freeBetDeductionTriggeredByLegId: data.freeBetDeductionTriggeredByLegId || '',
      freeBetDeductionTriggeredAt: data.freeBetDeductionTriggeredAt || '',
      combinedOddsBeforeDeduction: num(data.combinedOddsBeforeDeduction),
      effectiveFreeBetOddsAfterDeduction: num(data.effectiveFreeBetOddsAfterDeduction),
      snapshots: clone(data.snapshots || []),
      auditHistory: clone(data.auditHistory || []),
      createdAt: data.createdAt || new Date().toISOString(),
      createdBy: data.createdBy || '',
      lockedAt: data.lockedAt || '',
      lockedBy: data.lockedBy || '',
      settledAt: data.settledAt || ''
    };
  }

  function normalizeLeg(leg) {
    return {
      id: leg.id || uid('leg'),
      eventId: leg.eventId || '',
      eventName: leg.eventName || '',
      market: leg.market || '',
      outcome: leg.outcome || '',
      lockedOdds: num(leg.lockedOdds),
      eventStartTime: leg.eventStartTime || '',
      expectedSettlementTime: leg.expectedSettlementTime || '',
      chronologicalPosition: num(leg.chronologicalPosition),
      status: leg.status || 'Pending',
      result: leg.result || '',
      lockedAt: leg.lockedAt || '',
      lockedBy: leg.lockedBy || ''
    };
  }

  function sortedLegs(mix) {
    return (mix.legs || []).map(normalizeLeg).sort(function (a, b) {
      var timeOrder = String(a.expectedSettlementTime || '').localeCompare(String(b.expectedSettlementTime || ''));
      if (timeOrder) return timeOrder;
      return num(a.chronologicalPosition) - num(b.chronologicalPosition);
    }).map(function (leg, index) {
      leg.chronologicalPosition = index + 1;
      return leg;
    });
  }

  function validOddsLegs(mix) {
    return sortedLegs(mix).filter(function (leg) {
      return leg.status !== 'Voided' && leg.status !== 'Irrelevant' && leg.status !== 'Cancelled' && num(leg.lockedOdds) > 1;
    });
  }

  function combinedOdds(mix) {
    var legs = validOddsLegs(mix);
    return legs.length ? round(product(legs, function (leg) { return leg.lockedOdds; })) : 0;
  }

  function activeLeg(mix) {
    if (['Lost', 'Completed', 'Cancelled', 'Closed by Owner'].indexOf(mix.status) !== -1) return null;
    return sortedLegs(mix).filter(function (leg) {
      return leg.status !== 'Won' && leg.status !== 'Voided' && leg.status !== 'Irrelevant' && leg.status !== 'Cancelled';
    })[0] || null;
  }

  function gapMinutes(first, second) {
    var firstTime = Date.parse(first.expectedSettlementTime || '');
    var secondTime = Date.parse(second.expectedSettlementTime || '');
    if (!isFinite(firstTime) || !isFinite(secondTime)) return null;
    return Math.round((secondTime - firstTime) / 60000);
  }

  function timeGapValidation(mix) {
    var legs = sortedLegs(mix);
    return legs.slice(0, -1).map(function (leg, index) {
      var next = legs[index + 1];
      var minutes = gapMinutes(leg, next);
      var status = 'Unknown';
      if (minutes != null) {
        if (minutes >= num(mix.recommendedGapMinutes || 30)) status = 'Sufficient Balancing Window';
        else if (minutes >= num(mix.minimumGapMinutes || 15)) status = 'Limited Balancing Window';
        else status = 'Insufficient Time Between Mix Legs';
      }
      return {
        fromLegId: leg.id,
        toLegId: next.id,
        minutes: minutes,
        status: status,
        requiresOwnerOverride: minutes != null && minutes < num(mix.minimumGapMinutes || 15)
      };
    });
  }

  function values(mix) {
    var odds = combinedOdds(mix);
    var adjustedOdds = Math.max(0, odds - 1);
    var cashPotential = round(num(mix.cashPortion) * odds);
    var normalBonusPotential = round(num(mix.normalBonusPortion) * odds);
    var provisionalFreeBetPotential = round(num(mix.freeBetPortion) * odds);
    var adjustedFreeBetPotential = round(num(mix.freeBetPortion) * adjustedOdds);
    var freeBetPotential = mix.freeBetDeductionApplied ? adjustedFreeBetPotential : provisionalFreeBetPotential;
    var realizedHedges = sum(mix.hedges || [], function (hedge) {
      return hedge.executedStatus === 'Executed' ? num(hedge.actualReturn) : 0;
    });
    return {
      combinedLockedOdds: odds,
      effectiveFreeBetOdds: adjustedOdds,
      cashPotential: cashPotential,
      normalBonusPotential: normalBonusPotential,
      provisionalFreeBetPotential: provisionalFreeBetPotential,
      adjustedFreeBetPotential: adjustedFreeBetPotential,
      currentFreeBetPotential: freeBetPotential,
      provisionalCombinedPotential: round(cashPotential + normalBonusPotential + provisionalFreeBetPotential),
      trueCombinedPotential: round(cashPotential + normalBonusPotential + (mix.freeBetDeductionApplied ? adjustedFreeBetPotential : 0)),
      currentTrueWithdrawableValue: round(realizedHedges),
      totalStake: round(num(mix.cashPortion) + num(mix.normalBonusPortion) + num(mix.freeBetPortion))
    };
  }

  function audit(mix, action, actor, previousValue, newValue, reason) {
    mix.auditHistory = mix.auditHistory || [];
    mix.auditHistory.push({
      id: uid('mixaudit'),
      action: action,
      userId: actor && actor.userId || '',
      role: actor && actor.role || '',
      createdAt: new Date().toISOString(),
      previousValue: clone(previousValue == null ? null : previousValue),
      newValue: clone(newValue == null ? null : newValue),
      reason: reason || '',
      clientId: mix.clientId,
      sessionId: mix.sessionId
    });
  }

  function snapshot(mix, type) {
    var data = {
      id: uid('mixsnap'),
      type: type,
      createdAt: new Date().toISOString(),
      status: mix.status,
      legs: clone(sortedLegs(mix)),
      hedges: clone(mix.hedges || []),
      stakeComposition: {
        cash: num(mix.cashPortion),
        normalBonus: num(mix.normalBonusPortion),
        freeBet: num(mix.freeBetPortion)
      },
      values: values(mix),
      freeBetDeductionApplied: mix.freeBetDeductionApplied,
      freeBetDeductionCount: num(mix.freeBetDeductionCount),
      combinedOddsBeforeDeduction: num(mix.combinedOddsBeforeDeduction),
      effectiveFreeBetOddsAfterDeduction: num(mix.effectiveFreeBetOddsAfterDeduction)
    };
    mix.snapshots = mix.snapshots || [];
    mix.snapshots.push(data);
    return data;
  }

  function addLeg(mixInput, legInput, actor) {
    var mix = defaultMix(mixInput);
    var leg = normalizeLeg(legInput || {});
    if (!leg.eventName) throw new Error('Mix leg requires an Event.');
    if (!leg.market) throw new Error('Mix leg requires a Market.');
    if (!leg.outcome) throw new Error('Mix leg requires an Outcome.');
    if (leg.lockedOdds <= 1) throw new Error('Mix leg odds must be above 1.');
    if (!leg.eventStartTime || !leg.expectedSettlementTime) throw new Error('Mix leg start and settlement times are required.');
    mix.legs.push(leg);
    mix.legs = sortedLegs(mix);
    audit(mix, 'Leg added', actor, null, leg, '');
    return mix;
  }

  function removeLeg(mixInput, legId, actor) {
    var mix = defaultMix(mixInput);
    var previous = mix.legs.filter(function (leg) { return leg.id === legId; })[0] || null;
    if (previous && previous.lockedAt) throw new Error('Locked Mix legs cannot be removed.');
    mix.legs = mix.legs.filter(function (leg) { return leg.id !== legId; });
    mix.legs = sortedLegs(mix);
    audit(mix, 'Leg removed', actor, previous, null, '');
    return mix;
  }

  function lockMix(mixInput, actor, override) {
    var mix = defaultMix(mixInput);
    if (!mix.platformAccountId) throw new Error('Select one main Platform Account.');
    if (mix.legs.length < 2) throw new Error('A Mix requires at least two legs.');
    if (values(mix).totalStake <= 0) throw new Error('Enter at least one stake portion.');
    var gaps = timeGapValidation(mix);
    var hardWarnings = gaps.filter(function (gap) { return gap.requiresOwnerOverride; });
    if (hardWarnings.length && !(override && override.confirmed && override.reason)) {
      throw new Error('Owner override and note are required for insufficient time between Mix legs.');
    }
    var before = clone(mix);
    mix.legs = sortedLegs(mix).map(function (leg) {
      leg.lockedAt = leg.lockedAt || new Date().toISOString();
      leg.lockedBy = leg.lockedBy || actor.userId;
      return leg;
    });
    mix.status = 'Waiting for First Leg';
    mix.lockedAt = new Date().toISOString();
    mix.lockedBy = actor.userId;
    mix.combinedOddsBeforeDeduction = combinedOdds(mix);
    snapshot(mix, 'Before First-Leg Settlement');
    if (hardWarnings.length) audit(mix, 'Owner time-gap override used', actor, hardWarnings, override, override.reason);
    audit(mix, 'Mix locked', actor, before, mix, '');
    return mix;
  }

  function addHedge(mixInput, hedgeInput, actor) {
    var mix = defaultMix(mixInput);
    var active = activeLeg(mix);
    var hedge = {
      id: hedgeInput.id || uid('hedge'),
      clientId: hedgeInput.clientId || mix.clientId,
      userId: hedgeInput.userId || '',
      platformId: hedgeInput.platformId || '',
      platformAccountId: hedgeInput.platformAccountId || '',
      mixId: mix.id,
      legId: hedgeInput.legId || (active && active.id) || '',
      outcome: hedgeInput.outcome || '',
      stakeType: hedgeInput.stakeType || '',
      stakeAmount: num(hedgeInput.stakeAmount),
      lockedOdds: num(hedgeInput.lockedOdds),
      expectedReturn: round(num(hedgeInput.stakeAmount) * num(hedgeInput.lockedOdds)),
      executedStatus: hedgeInput.executedStatus || 'Draft',
      settlementResult: hedgeInput.settlementResult || '',
      actualReturn: num(hedgeInput.actualReturn),
      createdAt: hedgeInput.createdAt || new Date().toISOString(),
      createdBy: hedgeInput.createdBy || actor.userId
    };
    if (!hedge.platformAccountId || !hedge.outcome || !hedge.stakeType || hedge.stakeAmount <= 0 || hedge.lockedOdds <= 1) {
      throw new Error('Hedge requires an Account, Outcome, Stake Type, positive Stake, and Odds above 1.');
    }
    if (hedge.clientId !== mix.clientId) throw new Error('Hedge Account must belong to the same Client.');
    mix.hedges.push(hedge);
    audit(mix, 'Hedge added', actor, null, hedge, '');
    return mix;
  }

  function settleHedgesForLeg(mix, legId, activeWon) {
    mix.hedges.forEach(function (hedge) {
      if (hedge.legId !== legId || hedge.executedStatus !== 'Executed') return;
      var hedgeWins = activeWon ? hedge.outcome === 'Selected Outcome' : hedge.outcome !== 'Selected Outcome';
      hedge.settlementResult = hedgeWins ? 'Won' : 'Lost';
      hedge.actualReturn = hedgeWins ? round(hedge.stakeAmount * hedge.lockedOdds) : 0;
    });
  }

  function recordLegResult(mixInput, legId, result, actor) {
    var mix = defaultMix(mixInput);
    var active = activeLeg(mix);
    if (!active || active.id !== legId) throw new Error('Only the Current Active Leg may be settled.');
    var allowed = ['Won', 'Lost', 'Void', 'Refunded'];
    if (allowed.indexOf(result) === -1) throw new Error('Unsupported Mix leg result.');
    var before = clone(mix);
    var wasFirstWin = !mix.freeBetDeductionApplied && !sortedLegs(mix).some(function (leg) { return leg.status === 'Won'; });
    mix.legs = mix.legs.map(function (leg) {
      if (leg.id !== legId) return leg;
      leg.status = result === 'Refunded' ? 'Voided' : result;
      leg.result = result;
      return leg;
    });

    if (result === 'Lost') {
      settleHedgesForLeg(mix, legId, false);
      mix.legs = mix.legs.map(function (leg) {
        if (leg.id !== legId && leg.status === 'Pending') leg.status = 'Irrelevant';
        return leg;
      });
      mix.status = 'Lost';
      mix.settledAt = new Date().toISOString();
      snapshot(mix, wasFirstWin ? 'First Leg Lost - Mix Closed' : 'Later Leg Lost - Mix Closed');
    } else if (result === 'Won') {
      settleHedgesForLeg(mix, legId, true);
      if (!mix.freeBetDeductionApplied) {
        mix.freeBetDeductionApplied = true;
        mix.freeBetDeductionCount = 1;
        mix.freeBetDeductionTriggeredByLegId = legId;
        mix.freeBetDeductionTriggeredAt = new Date().toISOString();
        mix.combinedOddsBeforeDeduction = combinedOdds(mix);
        mix.effectiveFreeBetOddsAfterDeduction = Math.max(0, mix.combinedOddsBeforeDeduction - 1);
        snapshot(mix, 'After First-Leg Win and Deduction');
        audit(mix, 'Free Bet deduction applied', actor, false, true, 'First valid chronological leg won.');
      }
      if (activeLeg(mix)) {
        mix.status = wasFirstWin ? 'First Leg Won' : 'Next Leg Active';
      } else {
        mix.status = 'Completed';
        mix.settledAt = new Date().toISOString();
        snapshot(mix, 'Completed - All Legs Won');
      }
    } else {
      mix.status = activeLeg(mix) ? 'Next Leg Active' : 'Voided';
      snapshot(mix, 'Leg Void or Refund Recalculation');
    }
    audit(mix, 'Leg result entered', actor, before, mix, result);
    return mix;
  }

  function cumulativePosition(mix) {
    var active = activeLeg(mix);
    var valuation = values(mix);
    var activeHedges = (mix.hedges || []).filter(function (hedge) {
      return active && hedge.legId === active.id && hedge.executedStatus === 'Executed';
    });
    var hedgeCapital = sum(mix.hedges || [], function (hedge) {
      return hedge.executedStatus === 'Executed' ? hedge.stakeAmount : 0;
    });
    var activeHedgeCapital = sum(activeHedges, function (hedge) { return hedge.stakeAmount; });
    var activeHedgeWinReturn = sum(activeHedges, function (hedge) {
      return hedge.outcome !== 'Selected Outcome' ? hedge.expectedReturn : 0;
    });
    var activeHedgeLoseReturn = sum(activeHedges, function (hedge) {
      return hedge.outcome === 'Selected Outcome' ? hedge.expectedReturn : 0;
    });
    var mainTicketValue = mix.freeBetDeductionApplied ? valuation.trueCombinedPotential : valuation.provisionalCombinedPotential;
    var totalCapital = valuation.totalStake + hedgeCapital;
    var winBranch = round(mainTicketValue + activeHedgeLoseReturn);
    var loseBranch = round(activeHedgeWinReturn);
    var minimumReturn = Math.min(winBranch, loseBranch);
    var maximumReturn = Math.max(winBranch, loseBranch);
    return {
      activeLeg: active,
      mainMixValueIfActiveLegWins: mainTicketValue,
      mainMixValueIfActiveLegLoses: 0,
      existingHedgeCapital: hedgeCapital,
      activeHedgeCapital: activeHedgeCapital,
      activeLegWinBranchReturn: winBranch,
      activeLegLoseBranchReturn: loseBranch,
      minimumReturn: minimumReturn,
      maximumReturn: maximumReturn,
      worstCaseResult: round(minimumReturn - totalCapital),
      bestCaseResult: round(maximumReturn - totalCapital),
      currentRoi: totalCapital ? round(minimumReturn / totalCapital * 100) : 0,
      remainingImbalance: round(Math.abs(winBranch - loseBranch)),
      totalCapitalUsed: totalCapital
    };
  }

  function suggestion(mixInput, hedgeOdds) {
    var mix = defaultMix(mixInput);
    var position = cumulativePosition(mix);
    var odds = num(hedgeOdds);
    if (!position.activeLeg || odds <= 1) return null;
    var outcome = position.activeLegWinBranchReturn > position.activeLegLoseBranchReturn ? 'Opposite Outcome' : 'Selected Outcome';
    var amount = round(position.remainingImbalance / odds);
    var requiredReturn = num(mix.minimumTargetReturn);
    return {
      mixId: mix.id,
      legId: position.activeLeg.id,
      recommendedHedgeOutcome: outcome,
      suggestedAmount: amount,
      hedgeOdds: odds,
      expectedReturn: round(amount * odds),
      requiredCapital: amount,
      targetReturn: requiredReturn,
      timeAvailable: timeGapValidation(mix).filter(function (gap) { return gap.fromLegId === position.activeLeg.id; })[0] || null,
      reason: 'Reduces the current two-branch imbalance using the full cumulative Mix position.',
      committed: false
    };
  }

  function settlement(mixInput) {
    var mix = defaultMix(mixInput);
    var valuation = values(mix);
    var allWon = sortedLegs(mix).length && sortedLegs(mix).every(function (leg) { return leg.status === 'Won' || leg.status === 'Voided'; });
    var mainReturn = allWon ? valuation.cashPotential + valuation.normalBonusPotential + valuation.adjustedFreeBetPotential : 0;
    var hedgeReturn = sum(mix.hedges || [], function (hedge) { return hedge.actualReturn; });
    var hedgeCapital = sum(mix.hedges || [], function (hedge) { return hedge.executedStatus === 'Executed' ? hedge.stakeAmount : 0; });
    var totalCapital = valuation.totalStake + hedgeCapital;
    var realized = round(mainReturn + hedgeReturn);
    var converted = num(mix.freeBetPortion) ? round(realized / num(mix.freeBetPortion) * 100) : 0;
    return {
      mainTicketReturn: round(mainReturn),
      externalHedgeReturn: round(hedgeReturn),
      totalCapitalUsed: round(totalCapital),
      cashUsed: num(mix.cashPortion),
      normalBonusUsed: num(mix.normalBonusPortion),
      freeBetUsed: num(mix.freeBetPortion),
      realizedWithdrawableValue: realized,
      netResult: round(realized - totalCapital),
      roi: totalCapital ? round((realized - totalCapital) / totalCapital * 100) : 0,
      freeBetConversionRate: converted,
      completedLegs: sortedLegs(mix).filter(function (leg) { return leg.status === 'Won'; }).length
    };
  }

  return {
    singleFreeBet: singleFreeBet,
    createMix: defaultMix,
    sortedLegs: sortedLegs,
    combinedOdds: combinedOdds,
    activeLeg: activeLeg,
    timeGapValidation: timeGapValidation,
    values: values,
    addLeg: addLeg,
    removeLeg: removeLeg,
    lockMix: lockMix,
    addHedge: addHedge,
    recordLegResult: recordLegResult,
    cumulativePosition: cumulativePosition,
    suggestion: suggestion,
    settlement: settlement,
    snapshot: snapshot
  };
});
