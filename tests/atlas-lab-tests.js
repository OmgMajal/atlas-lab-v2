var assert = require('assert');
var Lab = require('../atlas-lab-service.js');

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.00001, message + ': expected ' + expected + ', got ' + actual);
}

var state = Lab.freshState();
assert.strictEqual(state.namespace, 'atlas-lab-v2-state-v1');
assert.strictEqual(state.profile.label, 'Atlas Lab V2');
assert.strictEqual(state.snapshot.verified, true);
assert.strictEqual(state.demo.clients.length, 2);
assert.strictEqual(state.demo.identities.length, 6);
assert.strictEqual(state.demo.platforms.length, 5);
assert.strictEqual(state.demo.accounts.length, 12);
assert.strictEqual(Object.keys(state.featureFlags).length, 10);

var account = state.demo.accounts[0];
var spendable = Lab.accountSpendable(account);
close(spendable.cash, account.cash - account.reservedCash - account.pendingOutgoing - account.restrictedAmount - account.safetyMargin, 'spendable cash');
assert.strictEqual(Lab.accountHealth(state, account).state, 'Needs Turnover');
assert.strictEqual(Lab.rotationRecommendation(state, account).label, 'Complete Turnover First');
assert.strictEqual(Lab.ledgerBalanced(state), true);

var sessionOne = state.demo.sessions[0];
assert.strictEqual(Lab.validateSession(state, sessionOne.id).passed, true);
Lab.transition(state, sessionOne.id, 'Validated', 'Owner', 'Lab test');
assert.strictEqual(sessionOne.status, 'Validated');

var sessionTwo = state.demo.sessions[1];
var invalid = Lab.validateSession(state, sessionTwo.id);
assert.strictEqual(invalid.passed, false);
assert.ok(invalid.errors.some(function (error) { return error.code === 'missing-outcome'; }));
sessionTwo.status = 'Executing';
assert.throws(function () { Lab.transition(state, sessionTwo.id, 'Execution Complete', 'Owner', 'Lab test'); }, /validation issue/);

assert.throws(function () { Lab.setFlag(state, 'atlas_lab_live_exposure', false, 'Admin', 'admin'); }, /Only Owner/);
Lab.setFlag(state, 'atlas_lab_live_exposure', false, 'Owner', 'owner');
assert.strictEqual(state.featureFlags.atlas_lab_live_exposure, false);
Lab.setFlag(state, 'atlas_lab_live_exposure', true, 'Owner', 'owner');

assert.throws(function () { Lab.approve(state, 'lab-approval-01', 'Approved', 'Admin', 'admin', 'No'); }, /Only Owner/);
Lab.approve(state, 'lab-approval-01', 'Approved', 'Owner', 'owner', 'Approved for controlled test.');
assert.strictEqual(state.approvals[0].status, 'Approved');

assert.strictEqual(Lab.reconcile(state, 'Session', sessionOne.id, 'Owner', 'owner').status, 'Exception');
assert.strictEqual(Lab.reconcile(state, 'Session', state.demo.sessions[2].id, 'Owner', 'owner').status, 'Passed');
assert.ok(Lab.buildInsights(state).length >= 1);

var exported = Lab.exportPayload(state);
var imported = Lab.importPayload(exported, 'owner');
assert.strictEqual(imported.namespace, state.namespace);
assert.strictEqual(imported.demo.accounts.length, 12);
assert.throws(function () { Lab.importPayload(exported, 'admin'); }, /Only Owner/);

console.log('Atlas Lab V2 service tests passed.');
