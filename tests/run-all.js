'use strict';

var childProcess = require('child_process');
var path = require('path');

var root = path.resolve(__dirname, '..');
var checks = [
  ['Syntax: app.js', ['--check', 'app.js']],
  ['Syntax: Atlas Lab service', ['--check', 'atlas-lab-service.js']],
  ['Syntax: Atlas Lab controller', ['--check', 'atlas-lab-controller.js']],
  ['Syntax: local server', ['--check', 'serve-local.js']],
  ['Lab service regression', ['tests/atlas-lab-tests.js']],
  ['Calculator regression', ['tests/atlas-calculator-view-model-tests.js']],
  ['Mix and Free Bet regression', ['tests/atlas-mix-tests.js']],
  ['Appearance security regression', ['tests/atlas-theme-tests.js']],
  ['Atlas acceptance regression', ['tests/atlas-acceptance-tests.mjs']]
];

checks.forEach(function (check) {
  process.stdout.write('\n' + check[0] + '\n');
  var result = childProcess.spawnSync(process.execPath, check[1], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
});

console.log('\nAll Atlas Lab V2 checks passed.');
