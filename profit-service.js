(function () {
  function num(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function activeShareholders(shareholders) {
    return (shareholders || []).filter(function (item) {
      return item.status !== 'Paused';
    });
  }

  function investedAmount(shareholder) {
    return num(shareholder && shareholder.investment);
  }

  function profitShareRate(shareholder) {
    return num(shareholder && shareholder.profitSharePercentage) / 100;
  }

  function completedWithdrawals(payments, shareholderId) {
    return (payments || []).filter(function (payment) {
      return payment.shareholderId === shareholderId && payment.status === 'Completed';
    }).reduce(function (total, payment) {
      return total + num(payment.amount);
    }, 0);
  }

  function totalCapital(shareholders) {
    return activeShareholders(shareholders).reduce(function (total, shareholder) {
      return total + investedAmount(shareholder);
    }, 0);
  }

  function calculateOne(shareholder, context) {
    var shareholders = activeShareholders(context.shareholders || []);
    var capitalTotal = num(context.totalCompanyCapital);
    if (!capitalTotal) capitalTotal = totalCapital(shareholders);

    var invested = investedAmount(shareholder);
    var totalProfit = num(context.totalProfitForPeriod);
    var sharePercent = num(shareholder.profitSharePercentage);
    var withdrawals = completedWithdrawals(context.payments || [], shareholder.id);
    var capitalRatio = capitalTotal > 0 ? invested / capitalTotal : 0;
    var grossProfit = totalProfit * capitalRatio;
    var payableProfit = grossProfit * (sharePercent / 100);
    var retainedProfit = grossProfit - payableProfit;
    var unpaidProfit = payableProfit - withdrawals;

    return {
      shareholderId: shareholder.id,
      clientId: shareholder.clientId,
      investedAmount: invested,
      activeCapital: shareholder.status === 'Paused' ? 0 : invested,
      totalCompanyCapital: capitalTotal,
      capitalRatio: capitalRatio,
      profitSharePercentage: sharePercent,
      grossProfitShare: grossProfit,
      shareholderPayableProfit: payableProfit,
      companyRetainedProfitFromShareholder: retainedProfit,
      withdrawalsPaid: withdrawals,
      remainingUnpaidProfit: unpaidProfit,
      netCurrentBalance: invested + unpaidProfit
    };
  }

  function calculateDistribution(context) {
    var shareholders = activeShareholders(context.shareholders || []);
    var capitalTotal = num(context.totalCompanyCapital);
    if (!capitalTotal) capitalTotal = totalCapital(shareholders);

    var rows = shareholders.map(function (shareholder) {
      return calculateOne(shareholder, {
        shareholders: shareholders,
        payments: context.payments || [],
        totalCompanyCapital: capitalTotal,
        totalProfitForPeriod: context.totalProfitForPeriod
      });
    });

    return {
      totalCompanyCapital: capitalTotal,
      totalProfitForPeriod: num(context.totalProfitForPeriod),
      totalShareholderPayableProfit: rows.reduce(function (total, row) {
        return total + row.shareholderPayableProfit;
      }, 0),
      totalCompanyRetainedProfit: rows.reduce(function (total, row) {
        return total + row.companyRetainedProfitFromShareholder;
      }, 0),
      rows: rows
    };
  }

  function validateShareholder(input) {
    var errors = [];
    if (investedAmount(input) <= 0) errors.push('Invested amount must be positive.');
    if (num(input.profitSharePercentage) < 0 || num(input.profitSharePercentage) > 100) {
      errors.push('Profit share percentage must be between 0 and 100.');
    }
    return errors;
  }

  window.AtlasProfitService = {
    totalCapital: totalCapital,
    calculateOne: calculateOne,
    calculateDistribution: calculateDistribution,
    validateShareholder: validateShareholder
  };
})();
