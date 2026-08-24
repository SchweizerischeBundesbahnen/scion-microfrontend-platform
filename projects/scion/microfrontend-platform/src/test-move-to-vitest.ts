/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/******************************************************************************************************************************************
 * ## Project-specific Customizations
 * - We do not activate `zone.js` nor Angular Testbed as SCION Microfrontend Platform is framework-agnostic.
 * - To simulate asynchronous passage of time, use Jasmine clock instead of Angular fakeAsync zone (tick, flush).
 *
 * ## Microfrontend in Unit Tests
 *   - create a *.script.ts file with code to be loaded into the iframe.
 *   - create an iframe using {@link MicrofrontendFixture#insertIframe} and load the script via {@link MicrofrontendFixture#loadScript}.
 *   - in the spec, start the host via {@link MicrofrontendPlatformHost.start} and register the micro app's manifest via {@link ManifestFixture#serve}
 *   - in the script, connect to the host via {@link MicrofrontendPlatformClient.connect}.
 *
 * Setup:
 *   - We use Karma testrunner to serve and watch script files, enabling us to load script files into iframes and to automatically
 *     re-run tests when script files change.
 *   - We use `karma-esbuild` plugin to transpile script files into js files using `esbuild`.
 *   - Transpiled script files are served by Karma testrunner under `base/PATH_TO_SCRIPT`.
 *   - Loading a transpiled script file into the browser exposes its exported values under the global variable `esbuild_script`.
 *   - See karma.conf.js for more information.
 *
 *
 *     #### Script: "src/lib/microfrontend.script.ts"
 *     ```ts
 *     export async function connectToHost(): Promise<void> {
 *       ...
 *     }
 *     ```
 *
 *     #### Transpiled Script: "src/lib/microfrontend.script.js" served under "base/src/lib/microfrontend.script.js"
 *     ```js
 *     var esbuild_script = (() => {
 *      ...
 *      function connectToHost() {
 *        ...
 *      }
 *      ...
 *     }
 *     )();
 *     ```
 ******************************************************************************************************************************************/

export {};
