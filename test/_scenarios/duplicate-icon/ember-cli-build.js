'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    svgJar: {
      sourceDirs: ['public/icons', 'vendor/icons'],
    },
  });
  return app.toTree();
};
