(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtlasPdfService = api;
})(typeof window !== 'undefined' ? window : this, function () {
  var PAGE_WIDTH = 1240;
  var PAGE_HEIGHT = 1754;
  var PAGE_MARGIN = 76;
  var CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

  var copy = {
    en: {
      language: 'English',
      reportTitle: 'Atlas Complete Operation Report',
      reportSubtitle: 'Calculation, execution, settlement, turnover, balances, and withdrawals',
      generated: 'Generated',
      confidential: 'Owner report - contains client-scoped financial information',
      immutable: 'This report uses the historical values saved with each operation.',
      sessions: 'Sessions',
      sessionSummary: 'Session Summary',
      accountPool: 'Session Account Pool',
      events: 'Events and Possible Outcomes',
      allocations: 'Executed and Planned Allocations',
      mixes: 'Sequential Mixes',
      balances: 'Final Balances',
      turnover: 'Turnover',
      withdrawals: 'Withdrawals',
      history: 'Chronological Activity',
      validation: 'Validation Checks',
      noRows: 'No saved records in this section.',
      page: 'Page',
      showcase: 'SHOWCASE DATA - NOT REAL',
      fields: {
        session: 'Session',
        client: 'Client',
        status: 'Status',
        start: 'Start Date',
        target: 'Target Gross Return',
        capital: 'Capital Used',
        executed: 'Executed',
        returned: 'Returned',
        result: 'Profit / Loss',
        roi: 'ROI',
        cash: 'Cash',
        bonus: 'Bonus',
        freeBet: 'Free Bet',
        turnoverDone: 'Turnover Completed',
        turnoverLeft: 'Turnover Remaining',
        user: 'User',
        platform: 'Platform',
        account: 'Account',
        openingCash: 'Opening Cash',
        openingBonus: 'Opening Bonus',
        openingFreeBet: 'Opening Free Bet',
        funding: 'Funding',
        event: 'Event',
        market: 'Market',
        outcome: 'Outcome',
        odds: 'Odds',
        planned: 'Planned Stake',
        payout: 'Payout',
        refund: 'Refund',
        expectedReturn: 'Expected Return',
        ratio: 'Gross Return Ratio',
        endingCash: 'Ending Cash',
        endingBonus: 'Ending Bonus',
        availableWithdrawal: 'Available to Withdraw',
        withdrawalAmount: 'Expected Amount',
        received: 'Received',
        destination: 'Destination',
        date: 'Date',
        action: 'Action',
        actor: 'Performed By',
        detail: 'Details',
        check: 'Check',
        checkResult: 'Result',
        explanation: 'Explanation',
        ticket: 'Ticket',
        combinedOdds: 'Combined Odds',
        deduction: 'Free Bet Deduction',
        netResult: 'Net Result'
      }
    },
    fa: {
      language: 'فارسی',
      reportTitle: 'گزارش کامل عملیات اطلس',
      reportSubtitle: 'محاسبه، اجرا، تسویه، گردش مالی، مانده‌ها و برداشت‌ها',
      generated: 'زمان ایجاد',
      confidential: 'گزارش ویژه مالک - شامل اطلاعات مالی هر مشتری',
      immutable: 'این گزارش فقط از اطلاعات تاریخی ذخیره‌شده در هر عملیات استفاده می‌کند.',
      sessions: 'جلسه‌ها',
      sessionSummary: 'خلاصه جلسه',
      accountPool: 'مجموعه حساب‌های جلسه',
      events: 'رویدادها و نتیجه‌های ممکن',
      allocations: 'تخصیص‌های برنامه‌ریزی و اجراشده',
      mixes: 'میکس‌های ترتیبی',
      balances: 'مانده‌های نهایی',
      turnover: 'گردش موردنیاز',
      withdrawals: 'برداشت‌ها',
      history: 'تاریخچه زمانی فعالیت‌ها',
      validation: 'کنترل‌های اعتبارسنجی',
      noRows: 'در این بخش اطلاعات ذخیره‌شده‌ای وجود ندارد.',
      page: 'صفحه',
      showcase: 'داده نمایشی - واقعی نیست',
      fields: {
        session: 'جلسه',
        client: 'مشتری',
        status: 'وضعیت',
        start: 'تاریخ شروع',
        target: 'هدف بازگشت ناخالص',
        capital: 'سرمایه استفاده‌شده',
        executed: 'مبلغ اجراشده',
        returned: 'مبلغ برگشتی',
        result: 'سود یا زیان',
        roi: 'نرخ بازده',
        cash: 'وجه نقد',
        bonus: 'بونوس',
        freeBet: 'فری‌بت',
        turnoverDone: 'گردش تکمیل‌شده',
        turnoverLeft: 'گردش باقی‌مانده',
        user: 'کاربر',
        platform: 'پلتفرم',
        account: 'حساب',
        openingCash: 'نقد ابتدای کار',
        openingBonus: 'بونوس ابتدای کار',
        openingFreeBet: 'فری‌بت ابتدای کار',
        funding: 'تأمین وجه',
        event: 'رویداد',
        market: 'بازار',
        outcome: 'نتیجه',
        odds: 'ضریب',
        planned: 'مبلغ برنامه‌ریزی‌شده',
        payout: 'پرداختی',
        refund: 'برگشتی',
        expectedReturn: 'بازگشت مورد انتظار',
        ratio: 'نسبت بازگشت ناخالص',
        endingCash: 'نقد نهایی',
        endingBonus: 'بونوس نهایی',
        availableWithdrawal: 'آماده برداشت',
        withdrawalAmount: 'مبلغ مورد انتظار',
        received: 'دریافت‌شده',
        destination: 'مقصد',
        date: 'تاریخ',
        action: 'اقدام',
        actor: 'انجام‌دهنده',
        detail: 'توضیحات',
        check: 'کنترل',
        checkResult: 'نتیجه',
        explanation: 'شرح',
        ticket: 'بلیط',
        combinedOdds: 'ضریب ترکیبی',
        deduction: 'کسر فری‌بت',
        netResult: 'نتیجه خالص'
      }
    }
  };

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function text(value) {
    return value == null || value === '' ? '-' : String(value);
  }

  function localeCode(locale) {
    return locale === 'fa' ? 'fa-IR' : 'en-US';
  }

  function formatNumber(value, locale, digits) {
    try {
      return new Intl.NumberFormat(localeCode(locale), {
        minimumFractionDigits: digits == null ? 2 : digits,
        maximumFractionDigits: digits == null ? 2 : digits
      }).format(number(value));
    } catch (error) {
      return number(value).toFixed(digits == null ? 2 : digits);
    }
  }

  function formatPercent(value, locale) {
    return formatNumber(number(value) * 100, locale, 2) + '%';
  }

  function formatMoney(value, locale, currency) {
    return formatNumber(value, locale, 2) + ' ' + (currency || 'USD');
  }

  function cleanFilePart(value) {
    var cleaned = String(value || 'operation').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned.slice(0, 72) || 'operation';
  }

  function buildReport(input, locale) {
    var language = locale === 'fa' ? 'fa' : 'en';
    var sessions = list(input && input.sessions);
    return {
      locale: language,
      direction: language === 'fa' ? 'rtl' : 'ltr',
      title: text(input && input.title !== '-' ? input.title : copy[language].reportTitle),
      generatedAt: text(input && input.generatedAt),
      isShowcase: !!(input && input.isShowcase),
      currency: text(input && input.currency !== '-' ? input.currency : 'USD'),
      sessions: sessions,
      checks: list(input && input.checks),
      translations: copy[language],
      filename: 'atlas-operation-' + cleanFilePart(sessions.length === 1 ? sessions[0].name : 'filtered-sessions') + '-' + language + '.pdf'
    };
  }

  function CanvasReport(report) {
    this.report = report;
    this.locale = report.locale;
    this.rtl = report.direction === 'rtl';
    this.pages = [];
    this.page = null;
    this.ctx = null;
    this.y = PAGE_MARGIN;
  }

  CanvasReport.prototype.font = function (size, weight) {
    var family = this.locale === 'fa' ? 'Tahoma, "Segoe UI", Arial, sans-serif' : '"Segoe UI", Arial, sans-serif';
    return (weight || 400) + ' ' + size + 'px ' + family;
  };

  CanvasReport.prototype.startPage = function (section) {
    var canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f9fc';
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(38, 38, PAGE_WIDTH - 76, PAGE_HEIGHT - 76);
    ctx.strokeStyle = '#d9e0ea';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 38, PAGE_WIDTH - 76, PAGE_HEIGHT - 76);
    ctx.direction = this.rtl ? 'rtl' : 'ltr';
    this.pages.push(canvas);
    this.page = canvas;
    this.ctx = ctx;
    this.y = PAGE_MARGIN;
    if (section) {
      this.drawText(section, {
        x: this.rtl ? PAGE_WIDTH - PAGE_MARGIN : PAGE_MARGIN,
        y: this.y,
        width: CONTENT_WIDTH,
        size: 18,
        weight: 700,
        color: '#657084',
        lineHeight: 26
      });
      this.y += 16;
      ctx.fillStyle = '#1f7a65';
      ctx.fillRect(PAGE_MARGIN, this.y, CONTENT_WIDTH, 4);
      this.y += 34;
    }
  };

  CanvasReport.prototype.ensure = function (height, section) {
    if (!this.page || this.y + height > PAGE_HEIGHT - 96) this.startPage(section);
  };

  CanvasReport.prototype.wrap = function (value, width, font) {
    var ctx = this.ctx;
    ctx.font = font;
    var words = String(value == null ? '' : value).split(/\s+/);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width <= width || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  };

  CanvasReport.prototype.drawText = function (value, options) {
    var opts = options || {};
    var ctx = this.ctx;
    var size = opts.size || 24;
    var lineHeight = opts.lineHeight || Math.round(size * 1.35);
    var font = this.font(size, opts.weight || 400);
    var width = opts.width || CONTENT_WIDTH;
    var x = opts.x == null ? (this.rtl ? PAGE_WIDTH - PAGE_MARGIN : PAGE_MARGIN) : opts.x;
    var y = opts.y == null ? this.y : opts.y;
    var lines = this.wrap(value, width, font);
    ctx.font = font;
    ctx.fillStyle = opts.color || '#172033';
    ctx.textBaseline = 'top';
    ctx.textAlign = opts.align || (this.rtl ? 'right' : 'left');
    lines.forEach(function (line, index) {
      ctx.fillText(line, x, y + index * lineHeight, width);
    });
    return lines.length * lineHeight;
  };

  CanvasReport.prototype.heading = function (value, level) {
    var size = level === 1 ? 38 : 28;
    var required = level === 1 ? 70 : 56;
    this.ensure(required, value);
    var height = this.drawText(value, { size: size, weight: 700, color: level === 1 ? '#16243a' : '#1f7a65' });
    this.y += height + 14;
  };

  CanvasReport.prototype.paragraph = function (value, muted) {
    this.ensure(90);
    var height = this.drawText(value, { size: 21, lineHeight: 31, color: muted ? '#657084' : '#303b4f' });
    this.y += height + 18;
  };

  CanvasReport.prototype.metricGrid = function (items) {
    var values = list(items);
    if (!values.length) return;
    var columns = 3;
    var gap = 14;
    var width = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    for (var index = 0; index < values.length; index += columns) {
      this.ensure(112);
      var row = values.slice(index, index + columns);
      for (var col = 0; col < row.length; col += 1) {
        var item = row[col];
        var logical = this.rtl ? columns - 1 - col : col;
        var x = PAGE_MARGIN + logical * (width + gap);
        this.ctx.fillStyle = '#f3f6fa';
        this.ctx.fillRect(x, this.y, width, 92);
        this.ctx.strokeStyle = '#dce3ec';
        this.ctx.strokeRect(x, this.y, width, 92);
        this.drawText(item.label, {
          x: this.rtl ? x + width - 16 : x + 16,
          y: this.y + 12,
          width: width - 32,
          size: 16,
          weight: 600,
          color: '#657084'
        });
        this.drawText(item.value, {
          x: this.rtl ? x + width - 16 : x + 16,
          y: this.y + 48,
          width: width - 32,
          size: 23,
          weight: 700,
          color: item.color || '#172033'
        });
      }
      this.y += 108;
    }
    this.y += 8;
  };

  CanvasReport.prototype.table = function (columns, rows, section) {
    var self = this;
    var values = list(rows);
    if (!values.length) {
      this.paragraph(this.report.translations.noRows, true);
      return;
    }
    var weights = columns.map(function (column) { return number(column.weight) || 1; });
    var weightTotal = weights.reduce(function (sum, value) { return sum + value; }, 0);
    var widths = weights.map(function (weight) { return CONTENT_WIDTH * weight / weightTotal; });
    var pad = 10;
    var headerHeight = 54;

    function cellX(index) {
      var before = widths.slice(0, index).reduce(function (sum, width) { return sum + width; }, 0);
      if (self.rtl) return PAGE_WIDTH - PAGE_MARGIN - before - widths[index];
      return PAGE_MARGIN + before;
    }

    function drawHeader() {
      self.ensure(headerHeight + 10, section);
      columns.forEach(function (column, index) {
        var x = cellX(index);
        self.ctx.fillStyle = '#16243a';
        self.ctx.fillRect(x, self.y, widths[index], headerHeight);
        self.ctx.strokeStyle = '#3d4b61';
        self.ctx.strokeRect(x, self.y, widths[index], headerHeight);
        self.drawText(column.label, {
          x: self.rtl ? x + widths[index] - pad : x + pad,
          y: self.y + 12,
          width: widths[index] - pad * 2,
          size: 15,
          lineHeight: 19,
          weight: 700,
          color: '#ffffff'
        });
      });
      self.y += headerHeight;
    }

    drawHeader();
    values.forEach(function (row, rowIndex) {
      var linePacks = columns.map(function (column, index) {
        return self.wrap(text(row[column.key]), widths[index] - pad * 2, self.font(15, 400));
      });
      var lineCount = Math.max.apply(Math, linePacks.map(function (lines) { return Math.min(4, lines.length); }));
      var rowHeight = Math.max(48, lineCount * 20 + 20);
      if (self.y + rowHeight > PAGE_HEIGHT - 96) {
        self.startPage(section);
        drawHeader();
      }
      columns.forEach(function (column, index) {
        var x = cellX(index);
        self.ctx.fillStyle = rowIndex % 2 ? '#ffffff' : '#f7f9fc';
        self.ctx.fillRect(x, self.y, widths[index], rowHeight);
        self.ctx.strokeStyle = '#dce3ec';
        self.ctx.strokeRect(x, self.y, widths[index], rowHeight);
        self.ctx.font = self.font(15, 400);
        self.ctx.fillStyle = '#253146';
        self.ctx.textBaseline = 'top';
        self.ctx.textAlign = self.rtl ? 'right' : 'left';
        linePacks[index].slice(0, 4).forEach(function (line, lineIndex) {
          self.ctx.fillText(line, self.rtl ? x + widths[index] - pad : x + pad, self.y + 10 + lineIndex * 20, widths[index] - pad * 2);
        });
      });
      self.y += rowHeight;
    });
    self.y += 22;
  };

  CanvasReport.prototype.cover = function () {
    this.startPage('');
    var t = this.report.translations;
    this.ctx.fillStyle = '#1f7a65';
    this.ctx.fillRect(PAGE_MARGIN, 150, 120, 12);
    this.y = 210;
    this.drawText('ATLAS', { size: 26, weight: 700, color: '#1f7a65' });
    this.y += 68;
    this.drawText(t.reportTitle, { size: 54, lineHeight: 68, weight: 700, color: '#16243a' });
    this.y += 170;
    this.drawText(t.reportSubtitle, { size: 27, lineHeight: 40, color: '#4b586c' });
    this.y += 130;
    if (this.report.isShowcase) {
      this.ctx.fillStyle = '#fff4d6';
      this.ctx.fillRect(PAGE_MARGIN, this.y, CONTENT_WIDTH, 72);
      this.drawText(t.showcase, {
        x: this.rtl ? PAGE_WIDTH - PAGE_MARGIN - 20 : PAGE_MARGIN + 20,
        y: this.y + 18,
        width: CONTENT_WIDTH - 40,
        size: 24,
        weight: 700,
        color: '#8a5a00'
      });
      this.y += 120;
    }
    this.metricGrid([
      { label: t.sessions, value: formatNumber(this.report.sessions.length, this.locale, 0) },
      { label: t.generated, value: this.report.generatedAt },
      { label: t.fields.status, value: t.language }
    ]);
    this.y += 60;
    this.paragraph(t.immutable, false);
    this.paragraph(t.confidential, true);
  };

  CanvasReport.prototype.session = function (session) {
    var t = this.report.translations;
    var f = t.fields;
    var totals = session.totals || {};
    this.startPage(t.sessionSummary);
    this.heading(text(session.name), 1);
    this.metricGrid([
      { label: f.client, value: text(session.client) },
      { label: f.status, value: text(session.status) },
      { label: f.start, value: text(session.startDate) },
      { label: f.target, value: formatPercent(number(session.targetReturnPercentage) / 100, this.locale) },
      { label: f.capital, value: formatMoney(totals.totalStake, this.locale, this.report.currency) },
      { label: f.executed, value: formatMoney(totals.executedStake, this.locale, this.report.currency) },
      { label: f.returned, value: formatMoney(totals.totalReturned, this.locale, this.report.currency) },
      { label: f.result, value: formatMoney(totals.profitLoss, this.locale, this.report.currency), color: number(totals.profitLoss) >= 0 ? '#16785c' : '#b42318' },
      { label: f.roi, value: formatPercent(totals.roi, this.locale), color: number(totals.roi) >= 0 ? '#16785c' : '#b42318' },
      { label: f.cash, value: formatMoney(totals.cashUsed, this.locale, this.report.currency) },
      { label: f.bonus, value: formatMoney(totals.bonusUsed, this.locale, this.report.currency) },
      { label: f.freeBet, value: formatMoney(totals.freeBetUsed, this.locale, this.report.currency) },
      { label: f.turnoverDone, value: formatMoney(totals.turnoverCompleted, this.locale, this.report.currency) },
      { label: f.turnoverLeft, value: formatMoney(totals.remainingTurnover, this.locale, this.report.currency) }
    ]);
    if (session.description) this.paragraph(session.description);
    if (session.notes) this.paragraph(session.notes, true);

    this.heading(t.accountPool, 2);
    this.table([
      { key: 'user', label: f.user, weight: 1.1 },
      { key: 'platform', label: f.platform, weight: 1 },
      { key: 'account', label: f.account, weight: 1.2 },
      { key: 'openingCash', label: f.openingCash, weight: 1 },
      { key: 'openingBonus', label: f.openingBonus, weight: 1 },
      { key: 'openingFreeBet', label: f.openingFreeBet, weight: 1 },
      { key: 'remainingTurnover', label: f.turnoverLeft, weight: 1 }
    ], list(session.accountPool).map(function (row) {
      return {
        user: row.user,
        platform: row.platform,
        account: row.account,
        openingCash: formatMoney(row.openingCash, this.locale, this.report.currency),
        openingBonus: formatMoney(row.openingBonus, this.locale, this.report.currency),
        openingFreeBet: formatMoney(row.openingFreeBet, this.locale, this.report.currency),
        remainingTurnover: formatMoney(row.remainingTurnover, this.locale, this.report.currency)
      };
    }, this), t.accountPool);

    this.heading(t.events, 2);
    this.table([
      { key: 'event', label: f.event, weight: 1.7 },
      { key: 'market', label: f.market, weight: 1.1 },
      { key: 'outcome', label: f.outcome, weight: 1.1 },
      { key: 'expectedReturn', label: f.expectedReturn, weight: 1 },
      { key: 'ratio', label: f.ratio, weight: 1 },
      { key: 'status', label: f.status, weight: 1 }
    ], list(session.scenarios).map(function (row) {
      return {
        event: row.event,
        market: row.market,
        outcome: row.outcome,
        expectedReturn: formatMoney(row.expectedReturn, this.locale, this.report.currency),
        ratio: formatPercent(row.grossReturnRatio, this.locale),
        status: row.status
      };
    }, this), t.events);

    this.heading(t.allocations, 2);
    this.table([
      { key: 'event', label: f.event, weight: 1.35 },
      { key: 'account', label: f.account, weight: 1.2 },
      { key: 'outcome', label: f.outcome, weight: 1.05 },
      { key: 'odds', label: f.odds, weight: 0.65 },
      { key: 'planned', label: f.planned, weight: 0.95 },
      { key: 'executed', label: f.executed, weight: 0.95 },
      { key: 'result', label: f.result, weight: 0.95 }
    ], list(session.allocations).map(function (row) {
      return {
        event: row.event,
        account: row.account,
        outcome: row.outcome,
        odds: formatNumber(row.odds, this.locale, 2),
        planned: formatMoney(row.planned, this.locale, this.report.currency),
        executed: formatMoney(row.executed, this.locale, this.report.currency),
        result: formatMoney(row.profitLoss, this.locale, this.report.currency)
      };
    }, this), t.allocations);

    if (list(session.mixes).length) {
      this.heading(t.mixes, 2);
      this.table([
        { key: 'ticket', label: f.ticket, weight: 1.3 },
        { key: 'account', label: f.account, weight: 1.4 },
        { key: 'status', label: f.status, weight: 1 },
        { key: 'combinedOdds', label: f.combinedOdds, weight: 0.9 },
        { key: 'deduction', label: f.deduction, weight: 1.1 },
        { key: 'netResult', label: f.netResult, weight: 1 }
      ], list(session.mixes).map(function (row) {
        return {
          ticket: row.ticket,
          account: row.account,
          status: row.status,
          combinedOdds: formatNumber(row.combinedOdds, this.locale, 2),
          deduction: row.deduction,
          netResult: formatMoney(row.netResult, this.locale, this.report.currency)
        };
      }, this), t.mixes);
    }

    this.heading(t.balances, 2);
    this.table([
      { key: 'account', label: f.account, weight: 1.5 },
      { key: 'openingCash', label: f.openingCash, weight: 1 },
      { key: 'funding', label: f.funding, weight: 0.9 },
      { key: 'executed', label: f.executed, weight: 1 },
      { key: 'endingCash', label: f.endingCash, weight: 1 },
      { key: 'turnoverLeft', label: f.turnoverLeft, weight: 1 },
      { key: 'availableWithdrawal', label: f.availableWithdrawal, weight: 1.1 }
    ], list(session.finalBalances).map(function (row) {
      return {
        account: row.account,
        openingCash: formatMoney(row.openingCash, this.locale, this.report.currency),
        funding: formatMoney(row.funding, this.locale, this.report.currency),
        executed: formatMoney(row.executed, this.locale, this.report.currency),
        endingCash: formatMoney(row.endingCash, this.locale, this.report.currency),
        turnoverLeft: formatMoney(row.remainingTurnover, this.locale, this.report.currency),
        availableWithdrawal: formatMoney(row.availableWithdrawal, this.locale, this.report.currency)
      };
    }, this), t.balances);

    this.heading(t.withdrawals, 2);
    this.table([
      { key: 'account', label: f.account, weight: 1.4 },
      { key: 'amount', label: f.withdrawalAmount, weight: 1 },
      { key: 'received', label: f.received, weight: 1 },
      { key: 'destination', label: f.destination, weight: 1.3 },
      { key: 'date', label: f.date, weight: 1 },
      { key: 'status', label: f.status, weight: 1 }
    ], list(session.withdrawals).map(function (row) {
      return {
        account: row.account,
        amount: formatMoney(row.amount, this.locale, this.report.currency),
        received: formatMoney(row.received, this.locale, this.report.currency),
        destination: row.destination,
        date: row.date,
        status: row.status
      };
    }, this), t.withdrawals);

    this.heading(t.history, 2);
    this.table([
      { key: 'date', label: f.date, weight: 1.1 },
      { key: 'action', label: f.action, weight: 1.35 },
      { key: 'actor', label: f.actor, weight: 1 },
      { key: 'detail', label: f.detail, weight: 2.5 }
    ], list(session.history), t.history);
  };

  CanvasReport.prototype.validation = function () {
    var t = this.report.translations;
    var f = t.fields;
    this.startPage(t.validation);
    this.heading(t.validation, 1);
    this.table([
      { key: 'name', label: f.check, weight: 1.5 },
      { key: 'result', label: f.checkResult, weight: 0.8 },
      { key: 'explanation', label: f.explanation, weight: 2.7 }
    ], this.report.checks, t.validation);
  };

  CanvasReport.prototype.finish = function () {
    var self = this;
    var t = this.report.translations;
    this.pages.forEach(function (canvas, index) {
      var ctx = canvas.getContext('2d');
      ctx.direction = self.rtl ? 'rtl' : 'ltr';
      ctx.font = self.font(15, 600);
      ctx.fillStyle = '#657084';
      ctx.textBaseline = 'top';
      ctx.textAlign = self.rtl ? 'right' : 'left';
      ctx.fillText('ATLAS', self.rtl ? PAGE_WIDTH - PAGE_MARGIN : PAGE_MARGIN, PAGE_HEIGHT - 70);
      ctx.textAlign = self.rtl ? 'left' : 'right';
      ctx.fillText(t.page + ' ' + formatNumber(index + 1, self.locale, 0) + ' / ' + formatNumber(self.pages.length, self.locale, 0), self.rtl ? PAGE_MARGIN : PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 70);
    });
    return this.pages;
  };

  function renderPages(report) {
    if (typeof document === 'undefined') throw new Error('PDF rendering requires a browser document.');
    var renderer = new CanvasReport(report);
    renderer.cover();
    report.sessions.forEach(function (session) { renderer.session(session); });
    renderer.validation();
    return renderer.finish();
  }

  function dataUrlBytes(dataUrl) {
    return fetch(dataUrl).then(function (response) { return response.arrayBuffer(); });
  }

  function triggerDownload(bytes, filename) {
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadOperationPdf(input, locale) {
    var report = buildReport(input, locale);
    if (typeof PDFLib === 'undefined' || !PDFLib.PDFDocument) {
      return Promise.reject(new Error('The bundled PDF library did not load.'));
    }
    var canvases = renderPages(report);
    return PDFLib.PDFDocument.create().then(function (pdf) {
      var chain = Promise.resolve();
      canvases.forEach(function (canvas) {
        chain = chain.then(function () {
          return dataUrlBytes(canvas.toDataURL('image/jpeg', 0.94)).then(function (bytes) {
            return pdf.embedJpg(bytes).then(function (image) {
              var page = pdf.addPage([595.28, 841.89]);
              page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
            });
          });
        });
      });
      return chain.then(function () { return pdf.save(); });
    }).then(function (bytes) {
      triggerDownload(bytes, report.filename);
      return { filename: report.filename, pageCount: canvases.length, bytes: bytes.length };
    });
  }

  return {
    buildReport: buildReport,
    renderPages: renderPages,
    downloadOperationPdf: downloadOperationPdf,
    formatMoney: formatMoney,
    formatPercent: formatPercent
  };
});
