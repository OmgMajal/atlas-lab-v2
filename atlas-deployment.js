(function (root) {
  'use strict';
  var host = String((root.location && root.location.hostname) || '');
  var isAtlasPublicDemoHost = host === 'atlas-lab-v2-demo.pages.dev' || /\.atlas-lab-v2-demo\.pages\.dev$/.test(host) || host.indexOf('atlas-demo.') === 0;
  var mode = host === '127.0.0.1' || host === 'localhost' ? 'local' : (host.indexOf('staging-atlas.') === 0 ? 'staging' : (isAtlasPublicDemoHost ? 'public-demo' : 'prototype'));
  var labels = {
    local: 'Local Development',
    staging: 'Protected Staging',
    'public-demo': 'Public Demo — Fictional Data Only',
    prototype: 'Production Not Enabled'
  };
  root.AtlasDeployment = {
    version: '2.3.0-online-beta',
    mode: mode,
    label: labels[mode],
    isPublicDemo: function () { return mode === 'public-demo'; },
    isProtectedStaging: function () { return mode === 'staging'; },
    storageNotice: 'Prototype Mode — Browser-stored data only. Changes are stored on this device; there is no multi-device sync.',
    routeView: function (path) {
      var routes = { '/calculator': 'calculator', '/odds-intelligence': 'odds', '/settings': 'settings', '/reports': 'dashboard' };
      return routes[path] || '';
    }
  };
}(window));
