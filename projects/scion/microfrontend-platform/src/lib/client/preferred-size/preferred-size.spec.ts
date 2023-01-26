/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {waitUntilStable} from '../../testing/spec.util.spec';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MicrofrontendPlatformHost} from '../../host/microfrontend-platform-host';
import {MicrofrontendFixture} from '../../testing/microfrontend-fixture/microfrontend-fixture';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../messaging/message-client';
import {Objects} from '@scion/toolkit/util';

describe('PreferredSize', () => {

  const disposables = new Set<Disposable>();

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
  });

  afterEach(async () => {
    await MicrofrontendPlatform.destroy();
    disposables.forEach(disposable => disposable());
  });

  it('should set the initial size of the router outlet', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const scriptPreferredSizeTopic = 'script/preferred-size';
    await Beans.get(MessageClient).publish(scriptPreferredSizeTopic, {width: '15px', height: '30px'}, {retain: true});

    const microfrontendFixture = registerFixture(new MicrofrontendFixture({useSciRouterOutlet: true}));
    await microfrontendFixture.insertIframe().loadScript('lib/client/preferred-size/preferred-size.script.ts', 'reportPreferredSize', {scriptPreferredSizeTopic});
    await waitUntilStable(() => microfrontendFixture.routerOutlet.preferredSize, {isStable: Objects.isEqual});

    expect(microfrontendFixture.routerOutlet.preferredSize).toEqual(jasmine.objectContaining({width: '15px', height: '30px'}));
    expect(microfrontendFixture.iframe.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 15, height: 30}));
    expect(microfrontendFixture.routerOutlet.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 15, height: 30}));
  });

  it('should change the size of the router outlet', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const scriptPreferredSizeTopic = 'script/preferred-size';
    const microfrontendFixture = registerFixture(new MicrofrontendFixture({useSciRouterOutlet: true}));
    await microfrontendFixture.insertIframe().loadScript('lib/client/preferred-size/preferred-size.script.ts', 'reportPreferredSize', {scriptPreferredSizeTopic});

    await waitUntilStable(() => microfrontendFixture.routerOutlet.preferredSize, {isStable: Objects.isEqual});
    expect(microfrontendFixture.routerOutlet.preferredSize).toBeUndefined();

    // WHEN reporting a preferred size
    await Beans.get(MessageClient).publish(scriptPreferredSizeTopic, {width: '10px', height: '20px'});
    await waitUntilStable(() => microfrontendFixture.routerOutlet.preferredSize, {isStable: Objects.isEqual});
    // THEN expect router outlet to change its size
    expect(microfrontendFixture.routerOutlet.preferredSize).toEqual(jasmine.objectContaining({width: '10px', height: '20px'}));
    expect(microfrontendFixture.iframe.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 10, height: 20}));
    expect(microfrontendFixture.routerOutlet.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 10, height: 20}));

    // WHEN reporting a preferred size
    await Beans.get(MessageClient).publish(scriptPreferredSizeTopic, {width: '50px', height: '100px'});
    await waitUntilStable(() => microfrontendFixture.routerOutlet.preferredSize, {isStable: Objects.isEqual});
    // THEN expect router outlet to change its size
    expect(microfrontendFixture.routerOutlet.preferredSize).toEqual(jasmine.objectContaining({width: '50px', height: '100px'}));
    expect(microfrontendFixture.iframe.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 50, height: 100}));
    expect(microfrontendFixture.routerOutlet.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 50, height: 100}));

    // WHEN reporting a preferred size
    await Beans.get(MessageClient).publish(scriptPreferredSizeTopic, {width: '30px', height: '70px'});
    await waitUntilStable(() => microfrontendFixture.routerOutlet.preferredSize, {isStable: Objects.isEqual});
    // THEN expect router outlet to change its size
    expect(microfrontendFixture.routerOutlet.preferredSize).toEqual(jasmine.objectContaining({width: '30px', height: '70px'}));
    expect(microfrontendFixture.iframe.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 30, height: 70}));
    expect(microfrontendFixture.routerOutlet.getBoundingClientRect()).toEqual(jasmine.objectContaining({width: 30, height: 70}));
  });

  /**
   * Registers the fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }
});

type Disposable = () => void;
