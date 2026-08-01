'use strict';

var assert = require('assert');
var Theme = require('../atlas-theme-service.js');

function freshState() {
  return {
    themes: [], themeVersions: [], activeThemes: [], appearancePermissions: [],
    userAppearancePreferences: [], appearancePolicies: [], auditLogs: [],
    authUsers: [
      { id: 'owner-1', name: 'Owner', role: 'owner' },
      { id: 'admin-1', name: 'Admin', role: 'admin' },
      { id: 'shareholder-1', name: 'Client', role: 'shareholder' }
    ],
    clients: [{ id: 'client-private', name: 'Private Client' }],
    ledger: [{ id: 'ledger-private', amount: 5000 }]
  };
}

function testInitializationAndPermissions() {
  var state = freshState();
  Theme.ensureState(state);
  assert.strictEqual(state.themes.length, 6, 'six built-in presets should be created');
  assert.strictEqual(Theme.activeVersion(state).themeId, 'theme-atlas-clean-financial');
  assert.strictEqual(Theme.can(state, state.authUsers[0], 'canActivate'), true);
  assert.strictEqual(Theme.can(state, state.authUsers[1], 'canView'), false);
  assert.strictEqual(Theme.can(state, state.authUsers[2], 'canView'), false);

  Theme.updatePermission(state, state.authUsers[0], 'admin-1', {
    canView: true, canEdit: true, canImport: true, canExport: true, canActivate: true
  });
  assert.strictEqual(Theme.can(state, state.authUsers[1], 'canEdit'), true);
  assert.throws(function () {
    Theme.updatePermission(state, state.authUsers[1], 'admin-1', { canView: true });
  }, /Only the Owner/);
}

function testThemeWorkflow() {
  var state = freshState();
  Theme.ensureState(state);
  var owner = state.authUsers[0];
  var admin = state.authUsers[1];
  Theme.updatePermission(state, owner, admin.id, {
    canView: true, canEdit: true, canImport: true, canExport: true, canActivate: true, canReset: true
  });

  var created = Theme.createDraft(state, admin, {
    sourceThemeId: 'theme-atlas-clean-financial', name: 'Admin Draft', description: 'Approval test'
  });
  assert.strictEqual(created.version.status, 'Draft');
  var tokens = Object.assign({}, created.version.tokens, { colorPrimary: '#244f78' });
  var version = Theme.saveVersion(state, admin, created.theme.id, {
    name: 'Admin Draft', description: 'Approval test', changeSummary: 'Safer primary',
    tokens: tokens, branding: Theme.defaultBranding()
  });
  assert.strictEqual(version.versionNumber, 2);
  var differences = Theme.compareVersions(state, version.id);
  assert.ok(differences.some(function (change) { return change.field === 'colorPrimary'; }));
  Theme.submitForApproval(state, admin, version.id);
  assert.strictEqual(version.status, 'Pending Approval');
  assert.throws(function () { Theme.activate(state, admin, version.id); }, /Owner approval/);
  Theme.decideApproval(state, owner, version.id, true, 'Approved after contrast review');
  assert.strictEqual(version.status, 'Approved');
  Theme.activate(state, admin, version.id);
  assert.strictEqual(Theme.activeVersion(state).id, version.id);
  assert.strictEqual(state.activeThemes[0].previousThemeVersionId, 'theme-version-atlas-clean-financial-1');
  Theme.rollback(state, owner);
  assert.strictEqual(Theme.activeVersion(state).themeId, 'theme-atlas-clean-financial');
  assert.ok(state.auditLogs.length >= 7, 'workflow actions should create audit records');

  var removable = Theme.createDraft(state, owner, { name: 'Temporary Draft' });
  Theme.deleteDraft(state, owner, removable.theme.id);
  assert.strictEqual(Theme.themeById(state, removable.theme.id), null);
  var archivable = Theme.createDraft(state, owner, { name: 'Archive Draft' });
  Theme.archiveTheme(state, owner, archivable.theme.id);
  assert.strictEqual(Theme.themeById(state, archivable.theme.id).isArchived, true);
}

function testValidationAndContrast() {
  var valid = Theme.validateTokens(Theme.CLEAN_TOKENS);
  assert.strictEqual(valid.valid, true);
  Theme.PRESETS.forEach(function (preset) {
    var failures = Theme.contrastChecks(preset.tokens).filter(function (check) {
      return check.critical && check.status === 'Fail';
    });
    assert.deepStrictEqual(failures, [], preset.name + ' should not have critical contrast failures');
  });
  assert.throws(function () {
    var state = freshState();
    Theme.ensureState(state);
    var created = Theme.createDraft(state, state.authUsers[0], { name: 'Unsafe' });
    Theme.saveVersion(state, state.authUsers[0], created.theme.id, {
      name: 'Unsafe', changeSummary: 'Invalid input',
      tokens: Object.assign({}, created.version.tokens, { colorPrimary: 'url(javascript:alert(1))' }),
      branding: Theme.defaultBranding()
    });
  }, /HEX color/);

  var state = freshState();
  Theme.ensureState(state);
  var owner = state.authUsers[0];
  var created = Theme.createDraft(state, owner, { name: 'No Contrast' });
  var version = Theme.saveVersion(state, owner, created.theme.id, {
    name: 'No Contrast', changeSummary: 'Contrast test',
    tokens: Object.assign({}, created.version.tokens, {
      colorPrimary: '#ffffff', colorOnPrimary: '#ffffff'
    }),
    branding: Theme.defaultBranding()
  });
  Theme.submitForApproval(state, owner, version.id);
  assert.throws(function () { Theme.activate(state, owner, version.id); }, /contrast failure/);
}

function testImportExportSecurity() {
  var state = freshState();
  Theme.ensureState(state);
  var owner = state.authUsers[0];
  var payload = Theme.exportPayload(state, 'theme-atlas-clean-financial');
  var serialized = JSON.stringify(payload);
  assert.strictEqual(serialized.indexOf('client-private'), -1);
  assert.strictEqual(serialized.indexOf('ledger-private'), -1);
  assert.strictEqual(serialized.indexOf('password'), -1);

  var imported = Theme.importPayload(state, owner, payload);
  assert.strictEqual(imported.version.status, 'Draft');
  assert.strictEqual(Theme.activeVersion(state).themeId, 'theme-atlas-clean-financial');
  assert.throws(function () {
    Theme.importPayload(state, owner, {
      schema: 'atlas-theme',
      theme: { name: '<script>alert(1)</script>' },
      version: { tokens: Theme.CLEAN_TOKENS, branding: {} }
    });
  }, /unsafe code/);
  assert.throws(function () {
    var future = JSON.parse(JSON.stringify(payload));
    future.applicationVersion = Theme.APP_VERSION + 1;
    Theme.importPayload(state, owner, future);
  }, /newer Atlas/);
  assert.throws(function () {
    Theme.sanitizeBranding({ primaryLogo: 'data:image/svg+xml,<svg onload="alert(1)"></svg>' });
  }, /PNG, WebP, or ICO/);
}

function testPreferencesAndIntentionalDarkMode() {
  var state = freshState();
  Theme.ensureState(state);
  var user = state.authUsers[2];
  var preference = Theme.saveUserPreference(state, user, {
    mode: 'dark', density: 'compact', sidebarState: 'icons', reducedMotion: true
  });
  assert.strictEqual(preference.mode, 'dark');
  assert.strictEqual(preference.sidebarState, 'icons');

  var properties = {};
  var attributes = {};
  var fakeDocument = {
    documentElement: {
      style: { setProperty: function (key, value) { properties[key] = value; } },
      setAttribute: function (key, value) { attributes[key] = value; }
    }
  };
  Theme.applyToDocument(Theme.activeVersion(state), preference, fakeDocument);
  assert.strictEqual(properties['--color-background'], '#111820');
  assert.strictEqual(attributes['data-appearance-mode'], 'dark');
  assert.strictEqual(attributes['data-density'], 'compact');
  assert.strictEqual(attributes['data-sidebar-state'], 'icons');
  assert.strictEqual(attributes['data-motion'], 'reduced');
}

testInitializationAndPermissions();
testThemeWorkflow();
testValidationAndContrast();
testImportExportSecurity();
testPreferencesAndIntentionalDarkMode();

console.log('All Atlas Appearance and theme security tests passed.');
