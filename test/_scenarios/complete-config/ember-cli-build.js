'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { setConfig } = await import('@warp-drive/core/build-config');
  const { buildOnce } = await import('@embroider/vite');

  let app = new EmberApp(defaults, {
    svgJar: {
      strategy: ['inline', 'symbol'],
      sourceDirs: ['public/images/icons'],
      stripPath: true,
      optimizer: {
        plugins: [{ removeTitle: false }, { removeDesc: { removeAny: false } }, { removeViewBox: false }],
      },
      persist: true,
      rootURL: '/',
      validations: {
        validateViewBox: true,
        checkForDuplicates: true,
      },

      inline: {
        idGen: (filepath) => filepath,
        sourceDirs: ['public/images/icons'],
        stripPath: true,
        optimizer: {},
      },

      symbol: {
        idGen: (filePath, { prefix }) => `${prefix}${filePath}`.replace(/[\s]/g, '-'),
        outputFile: '/assets/symbols.svg',
        prefix: '',
        includeLoader: true,
        containerAttrs: {
          style: 'position: absolute; width: 0; height: 0;',
          width: '0',
          height: '0',
          version: '1.1',
          xmlns: 'http://www.w3.org/2000/svg',
          'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        },
        sourceDirs: ['public/images/symbols'],
        stripPath: true,
        optimizer: {},
      },
    },
  });

  setConfig(app, __dirname, {
    // this should be the most recent <major>.<minor> version for
    // which all deprecations have been fully resolved
    // and should be updated when that changes
    compatWith: '5.8',
    deprecations: {
      // ... list individual deprecations that have been resolved here
    },
  });

  return compatBuild(app, buildOnce);
};
