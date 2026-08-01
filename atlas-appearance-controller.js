(function () {
  'use strict';

  var service = window.AtlasThemeService;
  var bridge = window.AtlasAppearanceBridge;
  if (!service || !bridge) return;

  var selectedThemeId = '';
  var loadedVersionId = '';
  var draftTokens = {};
  var draftBranding = {};
  var activeSection = 'general';
  var previewFrame = 0;

  var SECTION_TOKENS = {
    general: ['appearanceMode', 'workspaceMode', 'density', 'tableDensity', 'shadowLevel'],
    colors: [
      'colorPrimary', 'colorPrimaryHover', 'colorPrimarySoft', 'colorOnPrimary', 'colorSecondary', 'colorAccent',
      'colorBackground', 'colorSurface', 'colorSurfaceSecondary', 'colorTextPrimary',
      'colorTextSecondary', 'colorTextMuted', 'colorBorder', 'colorBorderStrong',
      'colorSuccess', 'colorSuccessSoft', 'colorWarning', 'colorWarningSoft',
      'colorDanger', 'colorDangerSoft', 'colorInfo', 'colorInfoSoft'
    ],
    typography: [
      'fontBody', 'fontHeading', 'fontNumeric', 'baseFontSize', 'tableFontSize',
      'calculatorFontSize', 'sidebarFontSize', 'headingScale', 'fontWeight', 'lineHeight'
    ],
    shape: ['radiusInput', 'radiusButton', 'radiusCard', 'radiusDialog', 'radiusBadge', 'borderWidth'],
    spacing: ['cardPadding', 'sectionSpacing', 'controlHeight'],
    navigation: [
      'sidebarBackground', 'sidebarText', 'sidebarActiveBackground', 'sidebarActiveText',
      'sidebarHoverBackground', 'headerBackground', 'sidebarWidth', 'sidebarCollapsedWidth',
      'headerHeight', 'tableHeaderBackground', 'tableAlternateBackground', 'tableHoverBackground'
    ],
    calculator: [
      'calculatorBackground', 'calculatorGrid', 'calculatorFrozenBackground',
      'calculatorEventHeader', 'calculatorActiveEvent', 'calculatorLockedCell',
      'calculatorEditableCell', 'calculatorCash', 'calculatorBonus', 'calculatorFreeBet',
      'calculatorWarning', 'calculatorCompleted', 'calculatorRowHeight',
      'calculatorCellWidth', 'calculatorFrozenWidth'
    ],
    motion: ['motion']
  };

  var TOKEN_LABELS = {
    colorPrimary: 'Primary action', colorPrimaryHover: 'Primary hover', colorPrimarySoft: 'Primary soft',
    colorOnPrimary: 'Text on primary action',
    colorSecondary: 'Secondary', colorAccent: 'Accent', colorBackground: 'Page background',
    colorSurface: 'Surface', colorSurfaceSecondary: 'Secondary surface',
    colorTextPrimary: 'Primary text', colorTextSecondary: 'Secondary text', colorTextMuted: 'Muted text',
    colorBorder: 'Border', colorBorderStrong: 'Strong border', colorSuccess: 'Success',
    colorSuccessSoft: 'Success soft', colorWarning: 'Warning', colorWarningSoft: 'Warning soft',
    colorDanger: 'Danger', colorDangerSoft: 'Danger soft', colorInfo: 'Information',
    colorInfoSoft: 'Information soft', sidebarBackground: 'Sidebar background',
    sidebarText: 'Sidebar text', sidebarActiveBackground: 'Active item background',
    sidebarActiveText: 'Active item text', sidebarHoverBackground: 'Hover background',
    headerBackground: 'Header surface', tableHeaderBackground: 'Table header',
    tableAlternateBackground: 'Alternate row', tableHoverBackground: 'Row hover',
    calculatorBackground: 'Workspace background', calculatorGrid: 'Grid lines',
    calculatorFrozenBackground: 'Frozen columns', calculatorEventHeader: 'Event header',
    calculatorActiveEvent: 'Active Event', calculatorLockedCell: 'Locked cell',
    calculatorEditableCell: 'Editable cell', calculatorCash: 'Cash indicator',
    calculatorBonus: 'Bonus indicator', calculatorFreeBet: 'Free Bet indicator',
    calculatorWarning: 'Warning indicator', calculatorCompleted: 'Completed indicator',
    fontBody: 'Body font', fontHeading: 'Heading font', fontNumeric: 'Numeric font',
    baseFontSize: 'Base font size', tableFontSize: 'Table font size',
    calculatorFontSize: 'Calculator font size', sidebarFontSize: 'Sidebar font size',
    headingScale: 'Heading scale', fontWeight: 'UI font weight', lineHeight: 'Line height',
    radiusInput: 'Input radius', radiusButton: 'Button radius', radiusCard: 'Card radius',
    radiusDialog: 'Dialog radius', radiusBadge: 'Badge radius', borderWidth: 'Border thickness',
    cardPadding: 'Card padding', sectionSpacing: 'Section spacing', controlHeight: 'Control height',
    sidebarWidth: 'Sidebar width', sidebarCollapsedWidth: 'Collapsed width',
    headerHeight: 'Header height', calculatorRowHeight: 'Calculator row height',
    calculatorCellWidth: 'Event cell width', calculatorFrozenWidth: 'Frozen column width',
    shadowLevel: 'Shadow preset', density: 'Interface density', tableDensity: 'Table density',
    appearanceMode: 'Base appearance', motion: 'Motion level', workspaceMode: 'Workspace mode'
  };

  function state() {
    var value = bridge.state();
    service.ensureState(value);
    return value;
  }

  function user() {
    return bridge.user();
  }

  function can(permission) {
    return service.can(state(), user(), permission);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function money(value) {
    return '$' + Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function latestVersion(themeId) {
    return service.versionsFor(state(), themeId)[0] || null;
  }

  function activeThemeId() {
    var version = service.activeVersion(state());
    return version ? version.themeId : 'theme-atlas-clean-financial';
  }

  function notify(message, tone) {
    var notice = document.getElementById('appearanceNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.className = 'appearance-notice is-' + (tone || 'info');
    notice.hidden = false;
    window.clearTimeout(notice._hideTimer);
    notice._hideTimer = window.setTimeout(function () { notice.hidden = true; }, tone === 'error' ? 8000 : 4500);
  }

  function persistAndRender(message) {
    bridge.save();
    bridge.render();
    if (message) notify(message, 'success');
  }

  function loadVersion(version) {
    if (!version) return;
    loadedVersionId = version.id;
    draftTokens = JSON.parse(JSON.stringify(version.tokens || service.CLEAN_TOKENS));
    draftBranding = JSON.parse(JSON.stringify(version.branding || service.defaultBranding()));
  }

  function ensureSelection() {
    var themes = state().themes.filter(function (theme) { return !theme.isArchived; });
    if (!selectedThemeId || !themes.some(function (theme) { return theme.id === selectedThemeId; })) {
      selectedThemeId = activeThemeId();
      loadedVersionId = '';
    }
    var latest = latestVersion(selectedThemeId);
    if (latest && latest.id !== loadedVersionId) loadVersion(latest);
    return latest;
  }

  function applyBranding() {
    var version = service.activeVersion(state());
    var branding = version && version.branding || service.defaultBranding();
    var name = branding.applicationName || 'Atlas';
    var subtitle = branding.companySubtitle || 'Capital Management';
    document.title = 'Atlas Lab V2 | ' + subtitle;
    document.querySelectorAll('.brand strong').forEach(function (node) { node.textContent = name; });
    document.querySelectorAll('.brand span').forEach(function (node) {
      node.textContent = node.closest('.rail') ? (subtitle || 'Capital Desk') : subtitle;
    });
    document.querySelectorAll('.brand').forEach(function (brand) {
      var existing = brand.querySelector('.brand-image');
      var source = brand.classList.contains('login-brand') ? (branding.loginLogo || branding.primaryLogo) :
        (document.documentElement.getAttribute('data-sidebar-state') === 'icons' ? (branding.compactLogo || branding.primaryLogo) : branding.primaryLogo);
      if (source) {
        if (!existing) {
          existing = document.createElement('img');
          existing.className = 'brand-image';
          existing.alt = name + ' logo';
          brand.insertBefore(existing, brand.firstChild);
        }
        existing.src = source;
        var mark = brand.querySelector('.brand-mark');
        if (mark) mark.hidden = true;
      } else {
        if (existing) existing.remove();
        var defaultMark = brand.querySelector('.brand-mark');
        if (defaultMark) defaultMark.hidden = false;
      }
    });
    if (branding.favicon) {
      var favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = branding.favicon;
      if (!favicon.parentNode) document.head.appendChild(favicon);
    }
    var footer = document.getElementById('globalBrandFooter');
    if (footer) {
      footer.textContent = [branding.footerText, branding.copyrightText].filter(Boolean).join(' / ');
      footer.hidden = !footer.textContent;
    }
    document.documentElement.style.setProperty(
      '--login-background-image',
      branding.loginBackground ? 'url("' + branding.loginBackground + '")' : 'none'
    );
  }

  function renderLibrary() {
    var holder = document.getElementById('themeLibraryList');
    if (!holder) return;
    var currentVersion = service.activeVersion(state());
    var themes = state().themes.filter(function (theme) { return !theme.isArchived; });
    document.getElementById('themeLibraryCount').textContent = themes.length + ' themes';
    holder.innerHTML = themes.map(function (theme) {
      var latest = latestVersion(theme.id);
      var active = currentVersion && currentVersion.themeId === theme.id;
      var selected = theme.id === selectedThemeId;
      return '<button type="button" class="theme-library-item' + (selected ? ' is-selected' : '') + '" data-theme-id="' + esc(theme.id) + '">' +
        '<span class="theme-swatch" style="--swatch-primary:' + esc(latest.tokens.colorPrimary) + ';--swatch-surface:' + esc(latest.tokens.colorSurface) + ';--swatch-background:' + esc(latest.tokens.colorBackground) + '"></span>' +
        '<span class="theme-library-copy"><strong>' + esc(theme.name) + '</strong><small>' + esc(theme.description) + '</small></span>' +
        '<span class="theme-library-meta">' +
          (active ? '<span class="status-badge status-completed">Active</span>' : '') +
          (theme.isBuiltIn ? '<span class="status-badge">Built-in</span>' : '<span class="status-badge">' + esc(latest.status) + '</span>') +
        '</span>' +
      '</button>';
    }).join('');
  }

  function tokenInput(key) {
    var definition = service.TOKEN_DEFINITIONS[key];
    var value = draftTokens[key];
    var label = TOKEN_LABELS[key] || key;
    var reset = '<button class="token-reset-button" type="button" data-reset-token="' + esc(key) + '" title="Reset ' + esc(label) + '">Reset</button>';
    if (definition.type === 'color') {
      return '<label class="theme-token-field theme-color-field"><span>' + esc(label) + '</span>' +
        '<div class="theme-color-control"><input data-theme-token="' + esc(key) + '" type="color" value="' + esc(value) + '" aria-label="' + esc(label) + ' color">' +
        '<input data-theme-token="' + esc(key) + '" type="text" value="' + esc(value) + '" maxlength="7" aria-label="' + esc(label) + ' HEX value">' + reset + '</div></label>';
    }
    if (definition.type === 'enum') {
      return '<label class="theme-token-field"><span>' + esc(label) + '</span><div class="theme-token-control"><select data-theme-token="' + esc(key) + '">' +
        definition.values.map(function (option) {
          return '<option value="' + esc(option) + '"' + (option === value ? ' selected' : '') + '>' + esc(option.replace(/-/g, ' ')) + '</option>';
        }).join('') + '</select>' + reset + '</div></label>';
    }
    return '<label class="theme-token-field"><span>' + esc(label) + '</span><div class="theme-token-control"><input data-theme-token="' + esc(key) + '" type="number" min="' +
      definition.min + '" max="' + definition.max + '" step="' + (definition.max <= 2 ? '0.05' : '1') + '" value="' + esc(value) + '">' + reset + '</div></label>';
  }

  function renderTokenEditor() {
    var holder = document.getElementById('themeTokenEditor');
    if (!holder) return;
    document.querySelectorAll('[data-theme-section]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-theme-section') === activeSection);
    });
    var tokens = SECTION_TOKENS[activeSection] || SECTION_TOKENS.general;
    holder.innerHTML = '<div class="theme-token-section-head"><div><h3>' + esc(activeSection.charAt(0).toUpperCase() + activeSection.slice(1)) +
      '</h3><p>Changes stay inside this preview until a validated version is activated.</p></div>' +
      '<button type="button" class="secondary-button compact-button" data-reset-section="' + esc(activeSection) + '">Reset Section</button></div>' +
      '<div class="theme-token-grid">' + tokens.map(tokenInput).join('') + '</div>';
  }

  function previewVariables(target) {
    var validation = service.validateTokens(draftTokens);
    var tokens = validation.tokens;
    Object.keys(service.TOKEN_DEFINITIONS).forEach(function (key) {
      var definition = service.TOKEN_DEFINITIONS[key];
      if (!definition.css) return;
      var value = tokens[key];
      if (definition.unit) value += definition.unit;
      if (/^font/.test(key)) {
        value = value === 'System UI' ? 'system-ui, sans-serif' : '"' + value + '", system-ui, sans-serif';
      }
      target.style.setProperty(definition.css, value);
    });
  }

  function previewMarkup(workspace) {
    var shellStart = '<div class="preview-shell"><aside><strong>' + esc(draftBranding.applicationName || 'Atlas') + '</strong>' +
      '<span class="is-active">Overview</span><span>Ledger</span><span>Accounts</span><span>Reports</span></aside><main>' +
      '<header><div><small>Client context</small><strong>North Capital</strong></div><span class="status-badge">Owner</span></header>';
    var shellEnd = '</main></div>';
    if (workspace === 'calculator') {
      return shellStart + '<section class="preview-page-head"><div><h3>Operations Calculator</h3><p>Session allocation workspace</p></div><button>Save</button></section>' +
        '<div class="preview-calculator"><div class="preview-calc-row is-header"><strong>Account</strong><strong>Event 1</strong><strong>Event 2</strong></div>' +
        '<div class="preview-calc-row"><span>USR-04 / PX04<br><small>' + money(1150) + ' available</small></span><b>1.90<br>' + money(400) + '</b><i>Editable</i></div>' +
        '<div class="preview-calc-row"><span>USR-07 / QT11<br><small>' + money(680) + ' available</small></span><b class="is-locked">3.50<br>' + money(220) + '</b><i class="is-warning">Review</i></div></div>' +
        '<div class="preview-summary"><span>Required <b>' + money(1000) + '</b></span><span>Worst return <b>97.4%</b></span><span>Gap <b>' + money(18) + '</b></span></div>' + shellEnd;
    }
    if (workspace === 'accounting') {
      return shellStart + '<section class="preview-page-head"><div><h3>Financial Ledger</h3><p>Traceable Client money movement</p></div><button>New Entry</button></section>' +
        '<div class="preview-alert"><strong>Approval required</strong><span>Two transfers are waiting for Owner review.</span></div>' +
        '<table class="preview-table"><thead><tr><th>Reference</th><th>Client</th><th>Status</th><th>Amount</th></tr></thead><tbody>' +
        '<tr><td>TRF-2048</td><td>North Capital</td><td><span class="status-badge">Pending</span></td><td>+' + money(12500) + '</td></tr>' +
        '<tr><td>FND-7311</td><td>Atlas Internal</td><td><span class="status-badge status-completed">Completed</span></td><td>-' + money(3200) + '</td></tr></tbody></table>' + shellEnd;
    }
    return shellStart + '<section class="preview-page-head"><div><h3>Owner Dashboard</h3><p>Capital and operational reporting</p></div><button>New Operation</button></section>' +
      '<div class="preview-kpis"><article><span>Working Capital</span><strong>' + money(128400) + '</strong><small>Available across Clients</small></article>' +
      '<article><span>Reserved Capital</span><strong>' + money(18450) + '</strong><small>7 active Sessions</small></article>' +
      '<article><span>Current Profit</span><strong>+' + money(7280) + '</strong><small>Selected period</small></article></div>' +
      '<table class="preview-table"><thead><tr><th>Account</th><th>Status</th><th>Turnover</th><th>Balance</th></tr></thead><tbody>' +
      '<tr><td>Client A / PX04</td><td><span class="status-badge status-completed">Active</span></td><td>72%</td><td>' + money(28400) + '</td></tr>' +
      '<tr><td>Client B / QT11</td><td><span class="status-badge">Review</span></td><td>41%</td><td>' + money(17600) + '</td></tr></tbody></table>' + shellEnd;
  }

  function renderPreview() {
    var preview = document.getElementById('themeLivePreview');
    if (!preview) return;
    var size = document.getElementById('themePreviewSize').value;
    var workspace = document.getElementById('themePreviewWorkspace').value;
    preview.setAttribute('data-preview-size', size);
    previewVariables(preview);
    preview.innerHTML = previewMarkup(workspace);
  }

  function schedulePreview() {
    window.cancelAnimationFrame(previewFrame);
    previewFrame = window.requestAnimationFrame(function () {
      renderPreview();
      renderValidation();
    });
  }

  function renderValidation() {
    var holder = document.getElementById('themeValidationList');
    if (!holder) return;
    var tokenValidation = service.validateTokens(draftTokens);
    var checks = service.contrastChecks(tokenValidation.tokens);
    var failures = checks.filter(function (check) { return check.status === 'Fail'; }).length + tokenValidation.errors.length;
    document.getElementById('themeValidationMeta').textContent = failures ? failures + ' blocking issues' : 'All critical checks pass';
    holder.innerHTML = tokenValidation.errors.map(function (error) {
      return '<div class="validation-row is-fail"><strong>Token</strong><span>' + esc(error) + '</span><b>Fail</b></div>';
    }).join('') + checks.map(function (check) {
      return '<div class="validation-row is-' + check.status.toLowerCase() + '"><strong>' + esc(check.label) + '</strong>' +
        '<span>' + check.ratio.toFixed(2) + ':1 contrast</span><b>' + check.status + '</b></div>';
    }).join('');
  }

  function renderVersions() {
    var versions = service.versionsFor(state(), selectedThemeId);
    document.getElementById('themeVersionCount').textContent = versions.length + ' versions';
    document.getElementById('themeVersionBody').innerHTML = versions.map(function (version) {
      return '<tr><td>v' + version.versionNumber + '</td><td><span class="status-badge">' + esc(version.status) + '</span></td>' +
        '<td>' + esc(version.createdBy) + '</td><td>' + esc(formatDate(version.createdAt)) + '</td><td>' + esc(version.changeSummary) + '</td>' +
        '<td><div class="action-row"><button type="button" class="compact-button secondary-button" data-load-theme-version="' + esc(version.id) + '">Use as Draft</button>' +
        (version.previousVersionId ? '<button type="button" class="compact-button secondary-button" data-compare-theme-version="' + esc(version.id) + '">Compare</button>' : '') +
        '</div></td></tr>';
    }).join('');
  }

  function renderBranding() {
    var form = document.getElementById('brandingForm');
    if (!form) return;
    ['applicationName', 'companySubtitle', 'footerText', 'copyrightText'].forEach(function (key) {
      form.elements[key].value = draftBranding[key] || '';
    });
    var preview = document.getElementById('brandingLogoPreview');
    var assets = [
      ['Primary', draftBranding.primaryLogo], ['Compact', draftBranding.compactLogo],
      ['Login', draftBranding.loginLogo], ['Background', draftBranding.loginBackground],
      ['Favicon', draftBranding.favicon]
    ].filter(function (item) { return !!item[1]; });
    preview.innerHTML = assets.length ? assets.map(function (item) {
      return '<span class="branding-asset-preview"><img src="' + esc(item[1]) + '" alt="' + esc(item[0]) + ' draft preview"><small>' + esc(item[0]) + '</small></span>';
    }).join('') + '<span>Draft assets are not active until this version is activated.</span>' :
      '<span>No custom assets selected. The protected Atlas mark remains active.</span>';
  }

  function renderPersonalPreferences() {
    var form = document.getElementById('personalAppearanceForm');
    if (!form || !user()) return;
    var preference = service.userPreference(state(), user().id) || {
      mode: 'system', density: 'standard', sidebarState: 'full', reducedMotion: false
    };
    form.elements.mode.value = preference.mode || 'system';
    form.elements.density.value = preference.density || 'standard';
    form.elements.sidebarState.value = preference.sidebarState || 'full';
    form.elements.reducedMotion.checked = !!preference.reducedMotion;
    form.hidden = !state().appearancePolicies[0].allowPersonalPreferences && user().role !== 'owner';
  }

  function permissionCells(admin) {
    var permission = service.permissionFor(state(), admin.id) || {};
    return service.PERMISSION_KEYS.map(function (key) {
      return '<td><input type="checkbox" data-permission-user="' + esc(admin.id) + '" data-permission-key="' + esc(key) + '"' +
        (permission[key] ? ' checked' : '') + ' aria-label="' + esc(key + ' for ' + admin.name) + '"></td>';
    }).join('');
  }

  function renderOwnerControls() {
    var panel = document.getElementById('appearanceOwnerControls');
    if (!panel) return;
    var owner = user() && user().role === 'owner';
    panel.hidden = !owner;
    if (!owner) return;
    var policy = state().appearancePolicies[0];
    document.getElementById('adminThemeApprovalRequired').checked = policy.adminApprovalRequired;
    document.getElementById('allowPersonalAppearance').checked = policy.allowPersonalPreferences;
    var admins = state().authUsers.filter(function (row) { return row.role === 'admin'; });
    document.getElementById('appearancePermissionBody').innerHTML = admins.map(function (admin) {
      return '<tr><td><strong>' + esc(admin.name) + '</strong><small>' + esc(admin.username) + '</small></td>' +
        permissionCells(admin) + '<td><button class="secondary-button compact-button" type="button" data-save-appearance-permission="' + esc(admin.id) + '">Save</button></td></tr>';
    }).join('') || '<tr><td colspan="9" class="muted">No Admin accounts exist yet.</td></tr>';
    var pending = state().themeVersions.filter(function (version) { return version.status === 'Pending Approval'; });
    document.getElementById('themeApprovalCount').textContent = pending.length + ' pending';
    document.getElementById('themeApprovalList').innerHTML = pending.map(function (version) {
      var theme = service.themeById(state(), version.themeId);
      return '<article class="theme-approval-item"><div><strong>' + esc(theme ? theme.name : 'Theme') + ' v' + version.versionNumber + '</strong>' +
        '<span>' + esc(version.changeSummary) + ' by ' + esc(version.createdBy) + '</span></div>' +
        '<input type="text" data-theme-decision-reason="' + esc(version.id) + '" placeholder="Owner decision note">' +
        '<button class="secondary-button compact-button" type="button" data-theme-decision="approve" data-version-id="' + esc(version.id) + '">Approve</button>' +
        '<button class="danger-button compact-button" type="button" data-theme-decision="reject" data-version-id="' + esc(version.id) + '">Reject</button></article>';
    }).join('') || '<div class="empty-state">No theme versions are awaiting Owner approval.</div>';
  }

  function renderEditor() {
    var version = ensureSelection();
    var theme = service.themeById(state(), selectedThemeId);
    if (!theme || !version) return;
    document.getElementById('themeEditorTitle').textContent = theme.name;
    document.getElementById('themeEditorStatus').textContent = (theme.isBuiltIn ? 'Built-in preset' : 'Custom theme') + ' / v' + version.versionNumber + ' / ' + version.status;
    var form = document.getElementById('themeEditorForm');
    form.elements.themeName.value = theme.name;
    form.elements.themeDescription.value = theme.description || '';
    if (!form.elements.changeSummary.value) form.elements.changeSummary.value = '';
    var editable = can('canEdit') && !theme.isBuiltIn;
    document.getElementById('saveThemeVersionButton').disabled = !editable;
    document.getElementById('submitThemeButton').disabled = !editable || version.status !== 'Draft';
    document.getElementById('activateThemeButton').disabled = !can('canActivate') || ['Draft', 'Pending Approval', 'Rejected'].indexOf(version.status) !== -1;
    document.getElementById('duplicateThemeButton').disabled = !can('canEdit');
    var deletableTheme = !theme.isBuiltIn && service.activeVersion(state()).themeId !== theme.id;
    document.getElementById('archiveThemeButton').disabled = !can('canEdit') || !deletableTheme;
    document.getElementById('deleteThemeDraftButton').disabled = !can('canEdit') || !deletableTheme;
    document.getElementById('exportThemeButton').disabled = !can('canExport');
    document.getElementById('importThemeButton').disabled = !can('canImport');
    document.getElementById('restorePreviousThemeButton').disabled = !can('canReset') || !state().activeThemes[0].previousThemeVersionId;
    document.getElementById('restoreAtlasThemeButton').disabled = !can('canReset');
    renderTokenEditor();
    renderPreview();
    renderValidation();
    renderVersions();
    renderBranding();
  }

  function render() {
    applyBranding();
    var nav = document.querySelector('.nav-item[data-view="appearance"]');
    var allowed = can('canView');
    if (nav) nav.hidden = !allowed;
    var denied = document.getElementById('appearanceAccessDenied');
    var workspace = document.getElementById('appearanceWorkspace');
    if (!denied || !workspace) return;
    denied.hidden = allowed;
    workspace.hidden = !allowed;
    if (!allowed) return;
    ensureSelection();
    renderLibrary();
    renderEditor();
    renderPersonalPreferences();
    renderOwnerControls();
  }

  function currentPayload() {
    var form = document.getElementById('themeEditorForm');
    draftBranding.applicationName = document.getElementById('brandingForm').elements.applicationName.value;
    draftBranding.companySubtitle = document.getElementById('brandingForm').elements.companySubtitle.value;
    draftBranding.footerText = document.getElementById('brandingForm').elements.footerText.value;
    draftBranding.copyrightText = document.getElementById('brandingForm').elements.copyrightText.value;
    return {
      name: form.elements.themeName.value,
      description: form.elements.themeDescription.value,
      changeSummary: form.elements.changeSummary.value,
      tokens: draftTokens,
      branding: draftBranding
    };
  }

  function downloadJson(fileName, payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function actionError(error) {
    notify(error && error.message ? error.message : String(error), 'error');
  }

  document.addEventListener('atlas:render', render);

  document.addEventListener('click', function (event) {
    var themeButton = event.target.closest('[data-theme-id]');
    if (themeButton) {
      selectedThemeId = themeButton.getAttribute('data-theme-id');
      loadedVersionId = '';
      document.getElementById('themeEditorForm').elements.changeSummary.value = '';
      render();
      return;
    }
    var sectionButton = event.target.closest('[data-theme-section]');
    if (sectionButton) {
      activeSection = sectionButton.getAttribute('data-theme-section');
      renderTokenEditor();
      return;
    }
    var resetToken = event.target.closest('[data-reset-token]');
    if (resetToken) {
      var token = resetToken.getAttribute('data-reset-token');
      draftTokens[token] = service.CLEAN_TOKENS[token];
      renderTokenEditor();
      schedulePreview();
      return;
    }
    var resetSection = event.target.closest('[data-reset-section]');
    if (resetSection) {
      (SECTION_TOKENS[resetSection.getAttribute('data-reset-section')] || []).forEach(function (key) {
        draftTokens[key] = service.CLEAN_TOKENS[key];
      });
      renderTokenEditor();
      schedulePreview();
      return;
    }
    var loadVersion = event.target.closest('[data-load-theme-version]');
    if (loadVersion) {
      var version = state().themeVersions.filter(function (row) { return row.id === loadVersion.getAttribute('data-load-theme-version'); })[0];
      if (version) {
        loadVersion = version;
        loadedVersionId = latestVersion(selectedThemeId).id;
        draftTokens = JSON.parse(JSON.stringify(version.tokens));
        draftBranding = JSON.parse(JSON.stringify(version.branding || service.defaultBranding()));
        document.getElementById('themeEditorForm').elements.changeSummary.value = 'Restore values from version ' + version.versionNumber;
        renderEditor();
      }
      return;
    }
    var compareButton = event.target.closest('[data-compare-theme-version]');
    if (compareButton) {
      var compareId = compareButton.getAttribute('data-compare-theme-version');
      var changes = service.compareVersions(state(), compareId);
      var compareHolder = document.getElementById('themeVersionCompare');
      compareHolder.hidden = false;
      compareHolder.innerHTML = '<div class="panel-head"><h3>Version Differences</h3><span>' + changes.length + ' changes</span></div>' +
        (changes.length ? changes.map(function (change) {
          return '<div><strong>' + esc(TOKEN_LABELS[change.field] || change.field) + '</strong><span>' + esc(change.previousValue) + '</span><b>' + esc(change.newValue) + '</b></div>';
        }).join('') : '<div class="empty-state">No token or branding differences.</div>');
      return;
    }
    var permissionButton = event.target.closest('[data-save-appearance-permission]');
    if (permissionButton) {
      try {
        var userId = permissionButton.getAttribute('data-save-appearance-permission');
        var values = {};
        service.PERMISSION_KEYS.forEach(function (key) {
          var input = document.querySelector('[data-permission-user="' + userId + '"][data-permission-key="' + key + '"]');
          values[key] = !!(input && input.checked);
        });
        service.updatePermission(state(), user(), userId, values);
        persistAndRender('Appearance access updated.');
      } catch (error) { actionError(error); }
      return;
    }
    var decision = event.target.closest('[data-theme-decision]');
    if (decision) {
      try {
        var versionId = decision.getAttribute('data-version-id');
        var reasonInput = document.querySelector('[data-theme-decision-reason="' + versionId + '"]');
        var reason = reasonInput ? reasonInput.value.trim() : '';
        if (!reason) throw new Error('An Owner decision note is required.');
        service.decideApproval(state(), user(), versionId, decision.getAttribute('data-theme-decision') === 'approve', reason);
        persistAndRender('Theme approval decision recorded.');
      } catch (error) { actionError(error); }
    }
  });

  document.addEventListener('input', function (event) {
    var key = event.target.getAttribute('data-theme-token');
    if (!key) return;
    var definition = service.TOKEN_DEFINITIONS[key];
    var value = definition.type === 'number' ? Number(event.target.value) : event.target.value;
    var validation = service.validateToken(key, value);
    event.target.setAttribute('aria-invalid', validation.valid ? 'false' : 'true');
    if (validation.valid) {
      draftTokens[key] = value;
      document.querySelectorAll('[data-theme-token="' + key + '"]').forEach(function (input) {
        if (input !== event.target) input.value = value;
      });
      schedulePreview();
    }
  });

  document.getElementById('themePreviewSize').addEventListener('change', renderPreview);
  document.getElementById('themePreviewWorkspace').addEventListener('change', renderPreview);

  document.getElementById('newThemeButton').addEventListener('click', function () {
    try {
      var created = service.createDraft(state(), user(), { name: 'Custom Theme', description: 'Owner-managed Atlas appearance profile.' });
      selectedThemeId = created.theme.id;
      loadedVersionId = '';
      persistAndRender('Custom theme created as Draft.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('duplicateThemeButton').addEventListener('click', function () {
    try {
      var source = service.themeById(state(), selectedThemeId);
      var created = service.createDraft(state(), user(), {
        sourceThemeId: selectedThemeId,
        name: (source ? source.name : 'Theme') + ' Copy',
        description: source ? source.description : ''
      });
      selectedThemeId = created.theme.id;
      loadedVersionId = '';
      persistAndRender('Theme duplicated as an editable Draft.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('archiveThemeButton').addEventListener('click', function () {
    if (!window.confirm('Archive this custom theme? Its version and Audit History will remain available in saved data.')) return;
    try {
      service.archiveTheme(state(), user(), selectedThemeId);
      selectedThemeId = activeThemeId();
      loadedVersionId = '';
      persistAndRender('Custom theme archived.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('deleteThemeDraftButton').addEventListener('click', function () {
    if (!window.confirm('Delete this unapproved Draft theme? This cannot delete active, approved, or built-in themes.')) return;
    try {
      service.deleteDraft(state(), user(), selectedThemeId);
      selectedThemeId = activeThemeId();
      loadedVersionId = '';
      persistAndRender('Unapproved Draft theme deleted.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('saveThemeVersionButton').addEventListener('click', function () {
    try {
      var version = service.saveVersion(state(), user(), selectedThemeId, currentPayload());
      loadedVersionId = '';
      document.getElementById('themeEditorForm').elements.changeSummary.value = '';
      persistAndRender('Theme version ' + version.versionNumber + ' saved.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('submitThemeButton').addEventListener('click', function () {
    try {
      var version = latestVersion(selectedThemeId);
      service.submitForApproval(state(), user(), version.id);
      persistAndRender(user().role === 'owner' ? 'Theme approved and ready to activate.' : 'Theme submitted for Owner approval.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('activateThemeButton').addEventListener('click', function () {
    try {
      var version = latestVersion(selectedThemeId);
      service.activate(state(), user(), version.id);
      loadedVersionId = '';
      persistAndRender('Theme activated globally.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('restorePreviousThemeButton').addEventListener('click', function () {
    try {
      var version = service.rollback(state(), user());
      selectedThemeId = version.themeId;
      loadedVersionId = '';
      persistAndRender('Previous theme restored.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('restoreAtlasThemeButton').addEventListener('click', function () {
    if (!window.confirm('Restore the safe Atlas Clean Financial theme? Theme history will be preserved.')) return;
    try {
      var version = service.restoreDefault(state(), user());
      selectedThemeId = version.themeId;
      loadedVersionId = '';
      persistAndRender('Atlas Clean Financial restored.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('exportThemeButton').addEventListener('click', function () {
    try {
      if (!can('canExport')) throw new Error('Theme export permission is required.');
      var payload = service.exportPayload(state(), selectedThemeId);
      var name = payload.theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      downloadJson('atlas-theme-' + (name || 'export') + '.json', payload);
      notify('Theme exported without financial, Client, credential, or access data.', 'success');
    } catch (error) { actionError(error); }
  });

  document.getElementById('importThemeButton').addEventListener('click', function () {
    document.getElementById('importThemeFile').click();
  });

  document.getElementById('importThemeFile').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 500000) { actionError(new Error('Theme JSON must be smaller than 500 KB.')); return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var created = service.importPayload(state(), user(), JSON.parse(reader.result));
        selectedThemeId = created.theme.id;
        loadedVersionId = '';
        persistAndRender('Theme validated and imported as Draft. It was not activated.');
      } catch (error) { actionError(error); }
    };
    reader.onerror = function () { actionError(new Error('The theme file could not be read.')); };
    reader.readAsText(file);
  });

  document.getElementById('applyBrandingDraftButton').addEventListener('click', function () {
    try {
      if (!can('canManageBranding')) throw new Error('Branding permission is required.');
      var form = document.getElementById('brandingForm');
      draftBranding.applicationName = form.elements.applicationName.value;
      draftBranding.companySubtitle = form.elements.companySubtitle.value;
      draftBranding.footerText = form.elements.footerText.value;
      draftBranding.copyrightText = form.elements.copyrightText.value;
      draftBranding = service.sanitizeBranding(draftBranding);
      renderBranding();
      renderPreview();
      notify('Branding applied to the unsaved Draft preview.', 'success');
    } catch (error) { actionError(error); }
  });

  document.querySelectorAll('[data-branding-asset]').forEach(function (input) {
    input.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      var assetKey = event.target.getAttribute('data-branding-asset');
      event.target.value = '';
      if (!file) return;
      if (!/image\/(png|webp|x-icon|vnd\.microsoft\.icon)/i.test(file.type) || file.size > 1000000) {
        actionError(new Error('Use a PNG, WebP, or ICO image smaller than 1 MB.'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          draftBranding[assetKey] = reader.result;
          service.sanitizeBranding(draftBranding);
          renderBranding();
          renderPreview();
        } catch (error) { actionError(error); }
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById('personalAppearanceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var form = event.currentTarget.elements;
      service.saveUserPreference(state(), user(), {
        mode: form.mode.value, density: form.density.value,
        sidebarState: form.sidebarState.value, reducedMotion: form.reducedMotion.checked
      });
      persistAndRender('Personal appearance preferences saved.');
    } catch (error) { actionError(error); }
  });

  document.getElementById('adminThemeApprovalRequired').addEventListener('change', function (event) {
    if (!user() || user().role !== 'owner') return;
    var policy = state().appearancePolicies[0];
    var previous = policy.adminApprovalRequired;
    policy.adminApprovalRequired = event.target.checked;
    policy.updatedAt = bridge.nowIso();
    state().auditLogs.push({
      id: bridge.uid('audit'), userId: user().id, role: user().role,
      action: 'Appearance approval policy changed', entityType: 'Appearance',
      entityId: policy.id, previousValue: previous, newValue: policy.adminApprovalRequired,
      createdAt: bridge.nowIso()
    });
    persistAndRender('Admin approval policy updated.');
  });

  document.getElementById('allowPersonalAppearance').addEventListener('change', function (event) {
    if (!user() || user().role !== 'owner') return;
    var policy = state().appearancePolicies[0];
    var previous = policy.allowPersonalPreferences;
    policy.allowPersonalPreferences = event.target.checked;
    policy.updatedAt = bridge.nowIso();
    state().auditLogs.push({
      id: bridge.uid('audit'), userId: user().id, role: user().role,
      action: 'Personal appearance policy changed', entityType: 'Appearance',
      entityId: policy.id, previousValue: previous, newValue: policy.allowPersonalPreferences,
      createdAt: bridge.nowIso()
    });
    persistAndRender('Personal preference policy updated.');
  });

  render();
})();
