/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// By setting `PLAYWRIGHT_BROWSERS_PATH=0`, chromium binaries are found in `node_modules`
// https://playwright.dev/docs/ci#caching-browsers
process.env.PLAYWRIGHT_BROWSERS_PATH = 0;
process.env.CHROME_BIN = require('playwright-core').chromium.executablePath();

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      // Instruct Karma testrunner to serve and watch script files, but not to load them into the Karma test execution iframe.
      //
      // Note that TypeScript files listed in this section are not transpiled by Karma. Therefore, we also need the `karma-esbuild`
      // plugin to preprocess script files (section `preprocessors`). The preprocessor transpiles script files using `esbuild` bundler.
      // Karma testrunner then serves transpiled script files under `base/PATH_TO_SCRIPT`. When loading a script file into the browser,
      // exported values of the script are exposed under the global variable `esbuild_script` (section `esbuild`).
      //
      // See also:
      // - http://karma-runner.github.io/6.4/config/files.html
      // - https://karma-runner.github.io/6.4/config/preprocessors.html
      // - https://esbuild.github.io/api/#format-iife
      {pattern: 'src/**/*.script.ts', included: false, watched: true, served: true},
    ],
    preprocessors: {
      'src/**/*.script.ts': ['esbuild'],
    },
    esbuild: {
      format: 'iife',
      globalName: 'esbuild_script',
      singleBundle: false,
      tsconfig: './projects/scion/microfrontend-platform/tsconfig.script.spec.json',
    },
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-esbuild'),
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, '../../scion/microfrontend-platform'),
      subdir: '.',
      reporters: [
        {type: 'html'},
        {type: 'text-summary'},
      ],
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [
      process.env.HEADLESS ? 'ChromeHeadlessNoSandbox' : 'Chrome',
    ],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: !!process.env.HEADLESS,
    restartOnFileChange: true,
  });
};
