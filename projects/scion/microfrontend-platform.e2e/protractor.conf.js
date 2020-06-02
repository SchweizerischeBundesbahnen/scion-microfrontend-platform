/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {SpecReporter} = require('jasmine-spec-reporter');

const puppeteer = require('puppeteer');
const chromeArgs = ['--window-size=2048,1536'];

// Allow resolving modules specified by paths in 'tsconfig', e.g., to resolve '@scion/microfrontend-platform' module. This is required when working with secondary entry point.
// By default, 'ts-node' only looks in the 'node_modules' folder for modules and not in paths specified in 'tsconfig'.
// See https://www.npmjs.com/package/tsconfig-paths
require('tsconfig-paths/register');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts',
  ],
  suites: {
    activator: [
      './src/**/activator.e2e-spec.ts',
    ],
    context: [
      './src/**/context.e2e-spec.ts',
    ],
    focus: [
      './src/**/focus.e2e-spec.ts',
    ],
    keyboardEvent: [
      './src/**/keyboard-event.e2e-spec.ts',
    ],
    manifest: [
      './src/**/manifest-registry.e2e-spec.ts',
    ],
    messaging: [
      './src/**/messaging.e2e-spec.ts',
    ],
    routing: [
      './src/**/router-outlet.e2e-spec.ts',
    ],
    preferredSize: [
      './src/**/preferred-size.e2e-spec.ts',
    ],
    properties: [
      './src/**/platform-properties.e2e-spec.ts',
    ],
  },
  capabilities: {
    'browserName': 'chrome',
    chromeOptions: {
      args: process.env.HEADLESS ? ['--headless', ...chromeArgs] : chromeArgs,
      binary: puppeteer.executablePath(),
    },
  },
  SELENIUM_PROMISE_MANAGER: false,
  directConnect: true,
  baseUrl: 'http://localhost:4201/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function () {
    },
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.json'),
    });
    jasmine.getEnv().addReporter(new SpecReporter({spec: {displayStacktrace: true}}));
  },
};
