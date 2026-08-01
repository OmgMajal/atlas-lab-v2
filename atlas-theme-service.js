(function (root, factory) {
  var service = factory();
  if (typeof module === 'object' && module.exports) module.exports = service;
  root.AtlasThemeService = service;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STORAGE_KEY = 'atlas-lab-v2-theme-v1';
  var APP_VERSION = 1;
  var FONT_CHOICES = ['Inter', 'IBM Plex Sans', 'Manrope', 'Roboto', 'Open Sans', 'System UI'];
  var NUMERIC_FONT_CHOICES = ['IBM Plex Mono', 'JetBrains Mono', 'Roboto Mono', 'System UI'];
  var DENSITIES = ['compact', 'standard', 'comfortable'];
  var TABLE_DENSITIES = ['extra-compact', 'compact', 'standard', 'comfortable'];
  var MODES = ['light', 'dark'];
  var MOTION_LEVELS = ['none', 'reduced', 'standard', 'enhanced'];
  var WORKSPACE_MODES = ['accounting', 'calculator', 'executive', 'mobile'];
  var PERMISSION_KEYS = [
    'canView', 'canEdit', 'canManageBranding', 'canImport', 'canExport',
    'canActivate', 'canReset'
  ];

  var TOKEN_DEFINITIONS = {
    colorPrimary: { type: 'color', css: '--color-primary' },
    colorPrimaryHover: { type: 'color', css: '--color-primary-hover' },
    colorPrimarySoft: { type: 'color', css: '--color-primary-soft' },
    colorOnPrimary: { type: 'color', css: '--color-on-primary' },
    colorSecondary: { type: 'color', css: '--color-secondary' },
    colorAccent: { type: 'color', css: '--color-accent' },
    colorBackground: { type: 'color', css: '--color-background' },
    colorSurface: { type: 'color', css: '--color-surface' },
    colorSurfaceSecondary: { type: 'color', css: '--color-surface-secondary' },
    colorTextPrimary: { type: 'color', css: '--color-text-primary' },
    colorTextSecondary: { type: 'color', css: '--color-text-secondary' },
    colorTextMuted: { type: 'color', css: '--color-text-muted' },
    colorBorder: { type: 'color', css: '--color-border' },
    colorBorderStrong: { type: 'color', css: '--color-border-strong' },
    colorSuccess: { type: 'color', css: '--color-success' },
    colorSuccessSoft: { type: 'color', css: '--color-success-soft' },
    colorWarning: { type: 'color', css: '--color-warning' },
    colorWarningSoft: { type: 'color', css: '--color-warning-soft' },
    colorDanger: { type: 'color', css: '--color-danger' },
    colorDangerSoft: { type: 'color', css: '--color-danger-soft' },
    colorInfo: { type: 'color', css: '--color-info' },
    colorInfoSoft: { type: 'color', css: '--color-info-soft' },
    sidebarBackground: { type: 'color', css: '--sidebar-background' },
    sidebarText: { type: 'color', css: '--sidebar-text' },
    sidebarActiveBackground: { type: 'color', css: '--sidebar-active-background' },
    sidebarActiveText: { type: 'color', css: '--sidebar-active-text' },
    sidebarHoverBackground: { type: 'color', css: '--sidebar-hover-background' },
    headerBackground: { type: 'color', css: '--header-background' },
    tableHeaderBackground: { type: 'color', css: '--table-header-background' },
    tableAlternateBackground: { type: 'color', css: '--table-alternate-background' },
    tableHoverBackground: { type: 'color', css: '--table-hover-background' },
    calculatorBackground: { type: 'color', css: '--calculator-background' },
    calculatorGrid: { type: 'color', css: '--calculator-grid' },
    calculatorFrozenBackground: { type: 'color', css: '--calculator-frozen-background' },
    calculatorEventHeader: { type: 'color', css: '--calculator-event-header' },
    calculatorActiveEvent: { type: 'color', css: '--calculator-active-event' },
    calculatorLockedCell: { type: 'color', css: '--calculator-locked-cell' },
    calculatorEditableCell: { type: 'color', css: '--calculator-editable-cell' },
    calculatorCash: { type: 'color', css: '--calculator-cash' },
    calculatorBonus: { type: 'color', css: '--calculator-bonus' },
    calculatorFreeBet: { type: 'color', css: '--calculator-free-bet' },
    calculatorWarning: { type: 'color', css: '--calculator-warning' },
    calculatorCompleted: { type: 'color', css: '--calculator-completed' },
    fontBody: { type: 'enum', values: FONT_CHOICES, css: '--font-body' },
    fontHeading: { type: 'enum', values: FONT_CHOICES, css: '--font-heading' },
    fontNumeric: { type: 'enum', values: NUMERIC_FONT_CHOICES, css: '--font-numeric' },
    baseFontSize: { type: 'number', min: 13, max: 18, unit: 'px', css: '--font-size-base' },
    tableFontSize: { type: 'number', min: 12, max: 16, unit: 'px', css: '--font-size-table' },
    calculatorFontSize: { type: 'number', min: 12, max: 17, unit: 'px', css: '--font-size-calculator' },
    sidebarFontSize: { type: 'number', min: 12, max: 16, unit: 'px', css: '--font-size-sidebar' },
    headingScale: { type: 'number', min: 0.9, max: 1.3, css: '--heading-scale' },
    fontWeight: { type: 'number', min: 400, max: 700, css: '--font-weight-ui' },
    lineHeight: { type: 'number', min: 1.2, max: 1.8, css: '--line-height-ui' },
    radiusInput: { type: 'number', min: 0, max: 16, unit: 'px', css: '--radius-input' },
    radiusButton: { type: 'number', min: 0, max: 16, unit: 'px', css: '--radius-button' },
    radiusCard: { type: 'number', min: 0, max: 18, unit: 'px', css: '--radius-card' },
    radiusDialog: { type: 'number', min: 0, max: 20, unit: 'px', css: '--radius-dialog' },
    radiusBadge: { type: 'number', min: 0, max: 999, unit: 'px', css: '--radius-badge' },
    borderWidth: { type: 'number', min: 1, max: 3, unit: 'px', css: '--border-width' },
    cardPadding: { type: 'number', min: 8, max: 28, unit: 'px', css: '--card-padding' },
    sectionSpacing: { type: 'number', min: 8, max: 32, unit: 'px', css: '--section-spacing' },
    controlHeight: { type: 'number', min: 34, max: 48, unit: 'px', css: '--control-height' },
    sidebarWidth: { type: 'number', min: 210, max: 320, unit: 'px', css: '--sidebar-width' },
    sidebarCollapsedWidth: { type: 'number', min: 64, max: 96, unit: 'px', css: '--sidebar-collapsed-width' },
    headerHeight: { type: 'number', min: 56, max: 92, unit: 'px', css: '--header-height' },
    calculatorRowHeight: { type: 'number', min: 48, max: 92, unit: 'px', css: '--calculator-row-height' },
    calculatorCellWidth: { type: 'number', min: 140, max: 280, unit: 'px', css: '--calculator-cell-width' },
    calculatorFrozenWidth: { type: 'number', min: 190, max: 360, unit: 'px', css: '--calculator-frozen-width' },
    shadowLevel: { type: 'enum', values: ['none', 'border', 'soft', 'medium', 'elevated'], css: null },
    density: { type: 'enum', values: DENSITIES, css: null },
    tableDensity: { type: 'enum', values: TABLE_DENSITIES, css: null },
    appearanceMode: { type: 'enum', values: MODES, css: null },
    motion: { type: 'enum', values: MOTION_LEVELS, css: null },
    workspaceMode: { type: 'enum', values: WORKSPACE_MODES, css: null }
  };

  var CLEAN_TOKENS = {
    colorPrimary: '#1f4b7a', colorPrimaryHover: '#193f68', colorPrimarySoft: '#edf4fa',
    colorOnPrimary: '#ffffff',
    colorSecondary: '#53657a', colorAccent: '#2774ae', colorBackground: '#f5f7fa',
    colorSurface: '#ffffff', colorSurfaceSecondary: '#f9fafb', colorTextPrimary: '#17212b',
    colorTextSecondary: '#5c6875', colorTextMuted: '#77838f', colorBorder: '#dfe5eb',
    colorBorderStrong: '#c5ced8', colorSuccess: '#188754', colorSuccessSoft: '#eaf7f0',
    colorWarning: '#9a650f', colorWarningSoft: '#fff7e6', colorDanger: '#bd3434',
    colorDangerSoft: '#fcecec', colorInfo: '#246da8', colorInfoSoft: '#eaf3fa',
    sidebarBackground: '#ffffff', sidebarText: '#536170', sidebarActiveBackground: '#eaf1f8',
    sidebarActiveText: '#173f68', sidebarHoverBackground: '#f3f6f9', headerBackground: '#ffffff',
    tableHeaderBackground: '#f4f7f9', tableAlternateBackground: '#fbfcfd',
    tableHoverBackground: '#eef4f8', calculatorBackground: '#eef2f4', calculatorGrid: '#d9e0e6',
    calculatorFrozenBackground: '#ffffff', calculatorEventHeader: '#f4f7f9',
    calculatorActiveEvent: '#eaf3fa', calculatorLockedCell: '#edf4fa',
    calculatorEditableCell: '#ffffff', calculatorCash: '#246da8', calculatorBonus: '#75662a',
    calculatorFreeBet: '#78528d', calculatorWarning: '#9a650f', calculatorCompleted: '#188754',
    fontBody: 'Inter', fontHeading: 'Inter', fontNumeric: 'IBM Plex Mono',
    baseFontSize: 14, tableFontSize: 13, calculatorFontSize: 13, sidebarFontSize: 13,
    headingScale: 1, fontWeight: 600, lineHeight: 1.45,
    radiusInput: 6, radiusButton: 6, radiusCard: 8, radiusDialog: 10, radiusBadge: 999,
    borderWidth: 1, cardPadding: 16, sectionSpacing: 16, controlHeight: 38,
    sidebarWidth: 248, sidebarCollapsedWidth: 76, headerHeight: 68,
    calculatorRowHeight: 64, calculatorCellWidth: 180, calculatorFrozenWidth: 250,
    shadowLevel: 'soft', density: 'standard', tableDensity: 'compact',
    appearanceMode: 'light', motion: 'standard', workspaceMode: 'accounting'
  };

  function merge(base, extra) {
    var output = {};
    Object.keys(base || {}).forEach(function (key) { output[key] = base[key]; });
    Object.keys(extra || {}).forEach(function (key) { output[key] = extra[key]; });
    return output;
  }

  var PRESETS = [
    { id: 'atlas-clean-financial', name: 'Atlas Clean Financial', description: 'Calm, light, data-focused financial operations.', tokens: CLEAN_TOKENS },
    { id: 'minimal-accounting', name: 'Minimal Accounting', description: 'Dense tables, crisp borders, and low decoration.', tokens: merge(CLEAN_TOKENS, {
      colorPrimary: '#31465a', colorPrimaryHover: '#26394a', colorPrimarySoft: '#edf1f4',
      sidebarActiveBackground: '#edf1f4', shadowLevel: 'border', density: 'compact',
      tableDensity: 'extra-compact', radiusCard: 4, radiusButton: 4, radiusInput: 4,
      workspaceMode: 'accounting'
    }) },
    { id: 'fintech-blue', name: 'Fintech Blue', description: 'Controlled blue emphasis with restrained modern surfaces.', tokens: merge(CLEAN_TOKENS, {
      colorPrimary: '#185f91', colorPrimaryHover: '#124b74', colorAccent: '#2480b8',
      colorPrimarySoft: '#e8f3fa', sidebarActiveBackground: '#e8f3fa',
      calculatorActiveEvent: '#e3f1f9'
    }) },
    { id: 'executive-dark', name: 'Executive Dark', description: 'Intentional dark tokens for executive review.', tokens: merge(CLEAN_TOKENS, {
      appearanceMode: 'dark', workspaceMode: 'executive', colorPrimary: '#69a9d4',
      colorPrimaryHover: '#89bde0', colorPrimarySoft: '#18354b', colorOnPrimary: '#111820', colorBackground: '#111820',
      colorSurface: '#19232d', colorSurfaceSecondary: '#202c37', colorTextPrimary: '#edf3f7',
      colorTextSecondary: '#bac7d1', colorTextMuted: '#97a8b5', colorBorder: '#33414d',
      colorBorderStrong: '#4a5966', colorSuccess: '#5dc18b', colorSuccessSoft: '#163a2a',
      colorWarning: '#e2b65b', colorWarningSoft: '#3d3018', colorDanger: '#ee7878',
      colorDangerSoft: '#421f22', colorInfo: '#70b1dd', colorInfoSoft: '#18354b',
      sidebarBackground: '#151f28', sidebarText: '#bac7d1', sidebarActiveBackground: '#244158',
      sidebarActiveText: '#ffffff', sidebarHoverBackground: '#202f3b', headerBackground: '#19232d',
      tableHeaderBackground: '#202c37', tableAlternateBackground: '#1c2731',
      tableHoverBackground: '#263541', calculatorBackground: '#111820',
      calculatorGrid: '#384753', calculatorFrozenBackground: '#19232d',
      calculatorEventHeader: '#202c37', calculatorActiveEvent: '#244158',
      calculatorLockedCell: '#20394b', calculatorEditableCell: '#19232d',
      calculatorCash: '#70b1dd', calculatorBonus: '#dfc476', calculatorFreeBet: '#c59add',
      calculatorWarning: '#e2b65b', calculatorCompleted: '#5dc18b', shadowLevel: 'medium'
    }) },
    { id: 'high-contrast', name: 'High Contrast', description: 'Maximum clarity for critical financial work.', tokens: merge(CLEAN_TOKENS, {
      colorPrimary: '#003f73', colorPrimaryHover: '#002e55', colorPrimarySoft: '#dcecf8',
      colorBackground: '#f2f4f5', colorTextPrimary: '#0a0d0f', colorTextSecondary: '#303a42',
      colorTextMuted: '#46515a', colorBorder: '#8a969f', colorBorderStrong: '#4a555d',
      colorSuccess: '#006b3d', colorWarning: '#755000', colorDanger: '#a30d18',
      sidebarText: '#263039', sidebarActiveText: '#002e55', tableHeaderBackground: '#e4e9ed',
      calculatorGrid: '#7d8992', borderWidth: 2, shadowLevel: 'border'
    }) },
    { id: 'custom-starter', name: 'Custom', description: 'Safe neutral starting point for a new Company theme.', tokens: merge(CLEAN_TOKENS, {
      shadowLevel: 'border', workspaceMode: 'accounting'
    }) }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function safeText(value, max) {
    return String(value == null ? '' : value).replace(/[<>]/g, '').trim().slice(0, max || 160);
  }

  function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ''));
  }

  function validateToken(key, value) {
    var definition = TOKEN_DEFINITIONS[key];
    if (!definition) return { valid: false, error: 'Unknown token: ' + key };
    if (definition.type === 'color' && !isHexColor(value)) return { valid: false, error: key + ' must be a six-digit HEX color.' };
    if (definition.type === 'enum' && definition.values.indexOf(value) === -1) return { valid: false, error: key + ' has an unsupported value.' };
    if (definition.type === 'number') {
      var number = Number(value);
      if (!isFinite(number) || number < definition.min || number > definition.max) {
        return { valid: false, error: key + ' must be between ' + definition.min + ' and ' + definition.max + '.' };
      }
    }
    return { valid: true };
  }

  function validateTokens(tokens) {
    var errors = [];
    var output = {};
    Object.keys(tokens || {}).forEach(function (key) {
      var result = validateToken(key, tokens[key]);
      if (!result.valid) errors.push(result.error);
      else output[key] = tokens[key];
    });
    Object.keys(TOKEN_DEFINITIONS).forEach(function (key) {
      if (output[key] == null) output[key] = CLEAN_TOKENS[key];
    });
    return { valid: !errors.length, errors: errors, tokens: output };
  }

  function hexRgb(hex) {
    var value = String(hex).slice(1);
    return [0, 2, 4].map(function (offset) { return parseInt(value.slice(offset, offset + 2), 16); });
  }

  function luminance(hex) {
    var channels = hexRgb(hex).map(function (channel) {
      var normalized = channel / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrastRatio(foreground, background) {
    if (!isHexColor(foreground) || !isHexColor(background)) return 0;
    var first = luminance(foreground);
    var second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }

  function contrastChecks(tokens) {
    var pairs = [
      ['Primary text', 'colorTextPrimary', 'colorBackground', 4.5, true],
      ['Secondary text', 'colorTextSecondary', 'colorBackground', 4.5, true],
      ['Card text', 'colorTextPrimary', 'colorSurface', 4.5, true],
      ['Primary button', 'colorOnPrimary', 'colorPrimary', 4.5, true],
      ['Sidebar text', 'sidebarText', 'sidebarBackground', 4.5, true],
      ['Active navigation', 'sidebarActiveText', 'sidebarActiveBackground', 4.5, true],
      ['Table header', 'colorTextPrimary', 'tableHeaderBackground', 4.5, true],
      ['Warning', 'colorWarning', 'colorWarningSoft', 4.5, true],
      ['Danger', 'colorDanger', 'colorDangerSoft', 4.5, true],
      ['Calculator values', 'colorTextPrimary', 'calculatorEditableCell', 4.5, true]
    ];
    return pairs.map(function (pair) {
      var ratio = contrastRatio(tokens[pair[1]], tokens[pair[2]]);
      return {
        label: pair[0], foreground: pair[1], background: pair[2], ratio: ratio,
        critical: pair[4], status: ratio >= pair[3] ? 'Pass' : ratio >= 3 ? 'Warning' : 'Fail'
      };
    });
  }

  function defaultBranding() {
    return {
      applicationName: 'Atlas', companySubtitle: 'Capital Management', footerText: '',
      copyrightText: '', primaryLogo: '', compactLogo: '', loginLogo: '', loginBackground: '', favicon: ''
    };
  }

  function sanitizeBranding(branding) {
    var input = branding || {};
    var output = defaultBranding();
    ['applicationName', 'companySubtitle', 'footerText', 'copyrightText'].forEach(function (key) {
      output[key] = safeText(input[key], key === 'footerText' ? 240 : 100);
    });
    ['primaryLogo', 'compactLogo', 'loginLogo', 'loginBackground', 'favicon'].forEach(function (key) {
      var value = String(input[key] || '');
      if (!value) return;
      if (!/^data:image\/(png|webp|x-icon|vnd\.microsoft\.icon);base64,[a-z0-9+/=]+$/i.test(value)) {
        throw new Error(key + ' must be a local PNG, WebP, or ICO data image.');
      }
      if (value.length > 1400000) throw new Error(key + ' exceeds the 1 MB encoded size limit.');
      output[key] = value;
    });
    return output;
  }

  function audit(state, actor, action, entityId, previousValue, newValue, reason) {
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];
    state.auditLogs.push({
      id: uid('audit'), userId: actor ? actor.id : '', role: actor ? actor.role : 'system',
      action: action, entityType: 'Appearance', entityId: entityId || '',
      previousValue: clone(previousValue || null), newValue: clone(newValue || null),
      reason: safeText(reason, 240), createdAt: nowIso()
    });
  }

  function ensureState(state) {
    ['themes', 'themeVersions', 'activeThemes', 'appearancePermissions', 'userAppearancePreferences', 'appearancePolicies'].forEach(function (key) {
      if (!Array.isArray(state[key])) state[key] = [];
    });
    if (!state.appearancePolicies.length) {
      state.appearancePolicies.push({
        id: 'appearance-policy-global', adminApprovalRequired: true,
        allowPersonalPreferences: true, updatedAt: nowIso()
      });
    }
    PRESETS.forEach(function (preset, index) {
      var themeId = 'theme-' + preset.id;
      var versionId = 'theme-version-' + preset.id + '-1';
      if (!state.themes.some(function (theme) { return theme.id === themeId; })) {
        state.themes.push({
          id: themeId, name: preset.name, description: preset.description, isBuiltIn: true,
          isArchived: false, createdBy: 'system', createdAt: nowIso(), updatedAt: nowIso()
        });
      }
      if (!state.themeVersions.some(function (version) { return version.id === versionId; })) {
        state.themeVersions.push({
          id: versionId, themeId: themeId, versionNumber: 1, tokens: clone(preset.tokens),
          branding: defaultBranding(), workspaceSettings: {
            mode: preset.tokens.workspaceMode, density: preset.tokens.density,
            tableDensity: preset.tokens.tableDensity
          },
          status: index === 0 ? 'Active' : 'Inactive', createdBy: 'system',
          createdRole: 'system', approvedBy: 'system', createdAt: nowIso(),
          approvedAt: index === 0 ? nowIso() : '', activatedAt: index === 0 ? nowIso() : '',
          changeSummary: 'Built-in Atlas preset', previousVersionId: ''
        });
      }
    });
    if (!state.activeThemes.length) {
      state.activeThemes.push({
        id: 'active-theme-global', themeVersionId: 'theme-version-atlas-clean-financial-1',
        activatedBy: 'system', activatedAt: nowIso(), previousThemeVersionId: ''
      });
    }
    return state;
  }

  function permissionFor(state, userId) {
    return (state.appearancePermissions || []).filter(function (row) {
      return row.userId === userId && !row.revokedAt;
    })[0] || null;
  }

  function can(state, user, permission) {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (user.role !== 'admin') return false;
    var record = permissionFor(state, user.id);
    if (permission === 'manageAppearance') return !!(record && record.canView && record.canEdit);
    return !!(record && record[permission || 'canView']);
  }

  function updatePermission(state, actor, userId, values) {
    if (!actor || actor.role !== 'owner') throw new Error('Only the Owner can grant Appearance permissions.');
    var previous = permissionFor(state, userId);
    if (previous) previous.revokedAt = nowIso();
    var record = {
      id: uid('appearance-permission'), userId: userId, grantedBy: actor.id,
      grantedAt: nowIso(), revokedAt: ''
    };
    PERMISSION_KEYS.forEach(function (key) { record[key] = !!(values && values[key]); });
    if (!record.canView && Object.keys(record).some(function (key) { return /^can[A-Z]/.test(key) && record[key]; })) record.canView = true;
    state.appearancePermissions.push(record);
    audit(state, actor, 'Appearance permission updated', userId, previous, record, 'Owner permission change');
    return record;
  }

  function activeVersion(state) {
    ensureState(state);
    var active = state.activeThemes[0];
    return state.themeVersions.filter(function (version) { return version.id === active.themeVersionId; })[0] ||
      state.themeVersions.filter(function (version) { return version.id === 'theme-version-atlas-clean-financial-1'; })[0];
  }

  function themeById(state, themeId) {
    return (state.themes || []).filter(function (theme) { return theme.id === themeId; })[0] || null;
  }

  function versionsFor(state, themeId) {
    return (state.themeVersions || []).filter(function (version) { return version.themeId === themeId; })
      .sort(function (a, b) { return b.versionNumber - a.versionNumber; });
  }

  function compareVersions(state, versionId, previousVersionId) {
    var current = (state.themeVersions || []).filter(function (row) { return row.id === versionId; })[0];
    var previousId = previousVersionId || (current && current.previousVersionId);
    var previous = (state.themeVersions || []).filter(function (row) { return row.id === previousId; })[0];
    if (!current || !previous) return [];
    var changes = [];
    Object.keys(TOKEN_DEFINITIONS).forEach(function (key) {
      if (current.tokens[key] !== previous.tokens[key]) {
        changes.push({ field: key, previousValue: previous.tokens[key], newValue: current.tokens[key] });
      }
    });
    Object.keys(defaultBranding()).forEach(function (key) {
      if ((current.branding || {})[key] !== (previous.branding || {})[key]) {
        var isAsset = ['primaryLogo', 'compactLogo', 'loginLogo', 'loginBackground', 'favicon'].indexOf(key) !== -1;
        changes.push({
          field: 'branding.' + key,
          previousValue: isAsset ? '[asset]' : (previous.branding || {})[key],
          newValue: isAsset ? '[asset]' : (current.branding || {})[key]
        });
      }
    });
    return changes;
  }

  function createDraft(state, actor, options) {
    if (!can(state, actor, 'canEdit')) throw new Error('Appearance editing permission is required.');
    var source = options && options.sourceThemeId ? versionsFor(state, options.sourceThemeId)[0] : activeVersion(state);
    var theme = {
      id: uid('theme'), name: safeText(options && options.name, 80) || 'Custom Theme',
      description: safeText(options && options.description, 180), isBuiltIn: false,
      isArchived: false, createdBy: actor.id, createdAt: nowIso(), updatedAt: nowIso()
    };
    state.themes.push(theme);
    var version = {
      id: uid('theme-version'), themeId: theme.id, versionNumber: 1,
      tokens: clone(source.tokens), branding: clone(source.branding || defaultBranding()),
      workspaceSettings: clone(source.workspaceSettings || {}), status: 'Draft',
      createdBy: actor.id, createdRole: actor.role, approvedBy: '', createdAt: nowIso(),
      approvedAt: '', activatedAt: '', changeSummary: 'Theme created', previousVersionId: ''
    };
    state.themeVersions.push(version);
    audit(state, actor, 'Theme created', theme.id, null, theme, 'New custom theme');
    return { theme: theme, version: version };
  }

  function saveVersion(state, actor, themeId, payload) {
    if (!can(state, actor, 'canEdit')) throw new Error('Appearance editing permission is required.');
    var theme = themeById(state, themeId);
    if (!theme || theme.isBuiltIn) throw new Error('Duplicate a built-in preset before editing it.');
    var validation = validateTokens(payload.tokens);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    var branding = sanitizeBranding(payload.branding);
    var previous = versionsFor(state, themeId)[0];
    var version = {
      id: uid('theme-version'), themeId: theme.id,
      versionNumber: previous ? previous.versionNumber + 1 : 1,
      tokens: validation.tokens, branding: branding,
      workspaceSettings: {
        mode: validation.tokens.workspaceMode, density: validation.tokens.density,
        tableDensity: validation.tokens.tableDensity
      },
      status: 'Draft', createdBy: actor.id, createdRole: actor.role, approvedBy: '',
      createdAt: nowIso(), approvedAt: '', activatedAt: '',
      changeSummary: safeText(payload.changeSummary, 240) || 'Theme values updated',
      previousVersionId: previous ? previous.id : ''
    };
    theme.name = safeText(payload.name, 80) || theme.name;
    theme.description = safeText(payload.description, 180);
    theme.updatedAt = nowIso();
    state.themeVersions.push(version);
    audit(state, actor, 'Theme version saved', version.id, previous, version, version.changeSummary);
    return version;
  }

  function submitForApproval(state, actor, versionId) {
    if (!can(state, actor, 'canEdit')) throw new Error('Appearance editing permission is required.');
    var version = state.themeVersions.filter(function (row) { return row.id === versionId; })[0];
    if (!version || version.status !== 'Draft') throw new Error('Only Draft versions can be submitted.');
    version.status = actor.role === 'owner' ? 'Approved' : 'Pending Approval';
    if (actor.role === 'owner') {
      version.approvedBy = actor.id;
      version.approvedAt = nowIso();
    }
    audit(state, actor, 'Theme submitted', version.id, { status: 'Draft' }, { status: version.status }, 'Theme review workflow');
    return version;
  }

  function decideApproval(state, actor, versionId, approved, reason) {
    if (!actor || actor.role !== 'owner') throw new Error('Only the Owner can decide theme approvals.');
    var version = state.themeVersions.filter(function (row) { return row.id === versionId; })[0];
    if (!version || version.status !== 'Pending Approval') throw new Error('This theme is not awaiting approval.');
    version.status = approved ? 'Approved' : 'Rejected';
    version.approvedBy = approved ? actor.id : '';
    version.approvedAt = approved ? nowIso() : '';
    audit(state, actor, approved ? 'Theme approved' : 'Theme rejected', version.id, { status: 'Pending Approval' }, { status: version.status }, reason);
    return version;
  }

  function activate(state, actor, versionId) {
    if (!can(state, actor, 'canActivate')) throw new Error('Theme activation permission is required.');
    var version = state.themeVersions.filter(function (row) { return row.id === versionId; })[0];
    if (!version) throw new Error('Theme version was not found.');
    var policy = state.appearancePolicies[0];
    if (actor.role === 'admin' && policy.adminApprovalRequired && version.status !== 'Approved') {
      throw new Error('Owner approval is required before this Admin theme can be activated.');
    }
    var validation = validateTokens(version.tokens);
    var contrast = contrastChecks(validation.tokens);
    var failures = contrast.filter(function (check) { return check.critical && check.status === 'Fail'; });
    if (!validation.valid || failures.length) throw new Error('Theme activation blocked by validation or critical contrast failure.');
    var active = state.activeThemes[0];
    var previousId = active.themeVersionId;
    state.themeVersions.forEach(function (row) {
      if (row.status === 'Active') row.status = 'Inactive';
    });
    version.status = 'Active';
    version.activatedAt = nowIso();
    active.previousThemeVersionId = previousId;
    active.themeVersionId = version.id;
    active.activatedBy = actor.id;
    active.activatedAt = nowIso();
    audit(state, actor, 'Theme activated', version.id, { themeVersionId: previousId }, { themeVersionId: version.id }, 'Global theme activation');
    return version;
  }

  function rollback(state, actor) {
    if (!can(state, actor, 'canReset')) throw new Error('Theme rollback permission is required.');
    var active = state.activeThemes[0];
    if (!active.previousThemeVersionId) throw new Error('There is no previous theme version to restore.');
    var target = active.previousThemeVersionId;
    return activate(state, actor, target);
  }

  function restoreDefault(state, actor) {
    if (!can(state, actor, 'canReset')) throw new Error('Theme reset permission is required.');
    var version = activate(state, actor, 'theme-version-atlas-clean-financial-1');
    audit(state, actor, 'Atlas default theme restored', version.id, null, version, 'Restore safe default');
    return version;
  }

  function archiveTheme(state, actor, themeId) {
    if (!can(state, actor, 'canEdit')) throw new Error('Appearance editing permission is required.');
    var theme = themeById(state, themeId);
    if (!theme || theme.isBuiltIn) throw new Error('Built-in Atlas presets cannot be archived.');
    if (activeVersion(state).themeId === themeId) throw new Error('The active theme cannot be archived.');
    theme.isArchived = true;
    theme.updatedAt = nowIso();
    audit(state, actor, 'Theme archived', theme.id, { isArchived: false }, { isArchived: true }, 'Theme library maintenance');
    return theme;
  }

  function deleteDraft(state, actor, themeId) {
    if (!can(state, actor, 'canEdit')) throw new Error('Appearance editing permission is required.');
    var theme = themeById(state, themeId);
    if (!theme || theme.isBuiltIn) throw new Error('Built-in Atlas presets cannot be deleted.');
    if (activeVersion(state).themeId === themeId) throw new Error('The active theme cannot be deleted.');
    var versions = versionsFor(state, themeId);
    if (versions.some(function (version) { return ['Active', 'Approved', 'Inactive'].indexOf(version.status) !== -1; })) {
      throw new Error('Only themes containing Draft or Rejected versions can be deleted.');
    }
    state.themes = state.themes.filter(function (row) { return row.id !== themeId; });
    state.themeVersions = state.themeVersions.filter(function (row) { return row.themeId !== themeId; });
    audit(state, actor, 'Theme Draft deleted', themeId, theme, null, 'Draft removal');
    return true;
  }

  function dangerousValue(value) {
    var text = JSON.stringify(value || '').toLowerCase();
    return /<script|javascript:|data:text\/html|expression\s*\(|@import|url\s*\(|onerror\s*=|onload\s*=|<iframe|<object/.test(text);
  }

  function exportPayload(state, themeId) {
    var theme = themeById(state, themeId);
    var version = versionsFor(state, themeId)[0];
    if (!theme || !version) throw new Error('Theme could not be exported.');
    return {
      schema: 'atlas-theme', applicationVersion: APP_VERSION, exportedAt: nowIso(),
      theme: { name: theme.name, description: theme.description },
      version: {
        tokens: clone(version.tokens), branding: clone(version.branding),
        workspaceSettings: clone(version.workspaceSettings), versionNumber: version.versionNumber
      }
    };
  }

  function importPayload(state, actor, payload) {
    if (!can(state, actor, 'canImport')) throw new Error('Theme import permission is required.');
    if (!payload || payload.schema !== 'atlas-theme' || !payload.theme || !payload.version) throw new Error('Unsupported Atlas theme file.');
    if (Number(payload.applicationVersion || 0) > APP_VERSION) throw new Error('This theme requires a newer Atlas application version.');
    if (dangerousValue(payload)) throw new Error('Theme import contains unsafe code or URL values.');
    var validation = validateTokens(payload.version.tokens);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    var branding = sanitizeBranding(payload.version.branding);
    var created = createDraft(state, actor, {
      name: safeText(payload.theme.name, 80) + ' (Imported)',
      description: safeText(payload.theme.description, 180)
    });
    created.version.tokens = validation.tokens;
    created.version.branding = branding;
    created.version.workspaceSettings = clone(payload.version.workspaceSettings || {});
    created.version.changeSummary = 'Imported as Draft';
    audit(state, actor, 'Theme imported', created.theme.id, null, created.version, 'Validated theme import');
    return created;
  }

  function userPreference(state, userId) {
    return (state.userAppearancePreferences || []).filter(function (row) { return row.userId === userId; })[0] || null;
  }

  function saveUserPreference(state, user, values) {
    if (!user) throw new Error('Sign in before saving appearance preferences.');
    var policy = state.appearancePolicies[0];
    if (!policy.allowPersonalPreferences && user.role !== 'owner') throw new Error('Personal preferences are disabled by the Owner.');
    var record = userPreference(state, user.id);
    if (!record) {
      record = { id: uid('appearance-preference'), userId: user.id };
      state.userAppearancePreferences.push(record);
    }
    record.mode = ['light', 'dark', 'system'].indexOf(values.mode) !== -1 ? values.mode : 'system';
    record.density = DENSITIES.indexOf(values.density) !== -1 ? values.density : 'standard';
    record.sidebarState = ['full', 'compact', 'icons'].indexOf(values.sidebarState) !== -1 ? values.sidebarState : 'full';
    record.reducedMotion = !!values.reducedMotion;
    record.updatedAt = nowIso();
    return record;
  }

  function cssFont(value) {
    if (value === 'System UI') return '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    return '"' + value + '", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  function shadowValue(level) {
    return {
      none: 'none', border: '0 0 0 1px var(--color-border)',
      soft: '0 1px 3px rgba(15, 23, 42, 0.08)',
      medium: '0 4px 14px rgba(15, 23, 42, 0.12)',
      elevated: '0 10px 28px rgba(15, 23, 42, 0.16)'
    }[level] || 'none';
  }

  function applyToDocument(version, preference, documentRef) {
    var doc = documentRef || (typeof document !== 'undefined' ? document : null);
    if (!doc || !version) return;
    var validation = validateTokens(version.tokens || {});
    var tokens = validation.tokens;
    var requestedMode = preference && preference.mode || '';
    var systemDark = requestedMode === 'system' && typeof matchMedia === 'function' &&
      matchMedia('(prefers-color-scheme: dark)').matches;
    if (requestedMode === 'dark' || systemDark) {
      tokens = merge(PRESETS[3].tokens, {
        density: tokens.density, tableDensity: tokens.tableDensity,
        workspaceMode: tokens.workspaceMode, motion: tokens.motion
      });
    } else if (requestedMode === 'light' || (requestedMode === 'system' && tokens.appearanceMode === 'dark')) {
      tokens = merge(CLEAN_TOKENS, {
        density: tokens.density, tableDensity: tokens.tableDensity,
        workspaceMode: tokens.workspaceMode, motion: tokens.motion
      });
    }
    var root = doc.documentElement;
    Object.keys(TOKEN_DEFINITIONS).forEach(function (key) {
      var definition = TOKEN_DEFINITIONS[key];
      if (!definition.css) return;
      var value = tokens[key];
      if (/^font/.test(key) && definition.type === 'enum') value = cssFont(value);
      if (definition.unit) value = value + definition.unit;
      root.style.setProperty(definition.css, value);
    });
    root.style.setProperty('--shadow-component', shadowValue(tokens.shadowLevel));
    root.style.setProperty('--shadow-dialog', shadowValue(tokens.shadowLevel === 'none' ? 'medium' : tokens.shadowLevel));
    root.style.setProperty('--shadow-sticky', tokens.shadowLevel === 'none' ? 'none' : '2px 0 5px rgba(15, 23, 42, 0.08)');
    var mode = tokens.appearanceMode;
    root.setAttribute('data-appearance-mode', mode);
    root.setAttribute('data-density', preference && preference.density || tokens.density);
    root.setAttribute('data-table-density', tokens.tableDensity);
    root.setAttribute('data-motion', preference && preference.reducedMotion ? 'reduced' : tokens.motion);
    root.setAttribute('data-sidebar-state', preference && preference.sidebarState || 'full');
    root.setAttribute('data-workspace-mode', tokens.workspaceMode);
    root.setAttribute('data-theme-version', version.id || 'fallback');
  }

  function bootstrapFromStorage(storageKey) {
    if (typeof localStorage === 'undefined' || typeof document === 'undefined') return;
    try {
      var state = JSON.parse(localStorage.getItem(storageKey || STORAGE_KEY) || '{}');
      ensureState(state);
      var version = activeVersion(state);
      var session = JSON.parse(localStorage.getItem('atlas-lab-v2-session-v1') || 'null');
      var preference = session ? userPreference(state, session.userId) : null;
      applyToDocument(version, preference, document);
    } catch (error) {
      applyToDocument({ id: 'fallback', tokens: CLEAN_TOKENS }, null, document);
      document.documentElement.setAttribute('data-theme-fallback', 'true');
    }
  }

  return {
    APP_VERSION: APP_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    TOKEN_DEFINITIONS: clone(TOKEN_DEFINITIONS),
    CLEAN_TOKENS: clone(CLEAN_TOKENS),
    PRESETS: clone(PRESETS),
    FONT_CHOICES: FONT_CHOICES.slice(),
    NUMERIC_FONT_CHOICES: NUMERIC_FONT_CHOICES.slice(),
    PERMISSION_KEYS: PERMISSION_KEYS.slice(),
    ensureState: ensureState,
    can: can,
    permissionFor: permissionFor,
    updatePermission: updatePermission,
    activeVersion: activeVersion,
    themeById: themeById,
    versionsFor: versionsFor,
    compareVersions: compareVersions,
    createDraft: createDraft,
    saveVersion: saveVersion,
    submitForApproval: submitForApproval,
    decideApproval: decideApproval,
    activate: activate,
    rollback: rollback,
    restoreDefault: restoreDefault,
    archiveTheme: archiveTheme,
    deleteDraft: deleteDraft,
    validateToken: validateToken,
    validateTokens: validateTokens,
    contrastRatio: contrastRatio,
    contrastChecks: contrastChecks,
    sanitizeBranding: sanitizeBranding,
    exportPayload: exportPayload,
    importPayload: importPayload,
    userPreference: userPreference,
    saveUserPreference: saveUserPreference,
    applyToDocument: applyToDocument,
    bootstrapFromStorage: bootstrapFromStorage,
    defaultBranding: defaultBranding
  };
});
