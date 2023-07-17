/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendFixture} from './microfrontend-fixture';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {NEVER} from 'rxjs';

describe('MicrofrontendFixture', () => {

  const disposables = new Set<Disposable>();

  afterEach(() => disposables.forEach(disposable => disposable()));

  it('should error if the script does not end with ".script.ts"', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    expect(() => fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/some-script.ts', 'noop')).toThrowError(/MicrofrontendFixtureError/);
  });

  it('should insert the iframe to the DOM', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().setUrl('about:blank');
    expect(Array.from(document.body.children).includes(fixture.iframe)).toBeTrue();
  });

  it('should load the passed script into the iframe', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_1');
    expect(fixture.iframe.contentDocument!.querySelector('div.testee')).toBeDefined();
  });

  it('should allow to return data from the script', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_2');

    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.getValues()).toEqual(['a', 'b', 'c']);
  });

  it('should support reporting an error from the script', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    const whenScriptLoaded = fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_3');

    // Expect the script promise to reject.
    await expectAsync(whenScriptLoaded).toBeRejectedWithError('ERROR FROM SCRIPT');

    // Expect the data Observable to error.
    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.hasErrored()).toBeTrue();
    expect(captor.getError()).toEqual(Error('ERROR FROM SCRIPT'));
  });

  it('should report an error if script execution errors', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    const whenScriptLoaded = fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_4');

    // Expect the script promise to reject.
    await expectAsync(whenScriptLoaded).toBeRejectedWithError('SCRIPT EXECUTION ERROR');

    // Expect the data Observable to error.
    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.hasErrored()).toBeTrue();
    expect(captor.getError()).toEqual(Error('SCRIPT EXECUTION ERROR'));
  });

  it('should support completing the data observable from the script', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_5');

    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.hasCompleted()).toBeTrue();
  });

  it('should wait until finished loading the script', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_6');
    expect(fixture.iframe.contentDocument!.querySelector('div.testee.delayed')).toBeDefined();
  });

  it('should allow the script to import project-specific types', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_7');
    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.getLastValue()).not.toBeUndefined();
  });

  it('should allow the script to import vendor-specific types', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_8');
    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.getLastValue()).not.toBeUndefined();
  });

  it('should support loading a web page', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    fixture.insertIframe().setUrl('about:blank');
    expect(fixture.iframe.contentWindow!.location.href).toEqual('about:blank');
  });

  it('should support loading another script into the iframe', async () => {
    const fixture = registerFixture(new MicrofrontendFixture()).insertIframe();
    await fixture.loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_9a');
    expect(fixture.iframe.contentDocument!.querySelector('div.testee-1')).toBeDefined();
    expect(fixture.iframe.contentDocument!.querySelector('div.testee-2')).toBeNull();

    await fixture.loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_9b');
    expect(fixture.iframe.contentDocument!.querySelector('div.testee-1')).toBeNull();
    expect(fixture.iframe.contentDocument!.querySelector('div.testee-2')).toBeDefined();
  });

  it('should destroy the iframe on unmount', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    fixture.insertIframe();
    fixture.iframe.classList.add('testee');
    await fixture.loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'noop');
    expect(document.querySelector('iframe.testee')).toBeDefined();

    fixture.removeIframe();
    expect(() => fixture.iframe).toThrowError(/MicrofrontendFixtureError/);
    expect(document.querySelector('iframe.testee')).toBeNull();
    expect(fixture.message$).toBe(NEVER);
  });

  it('should complete the data observable on unmount', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'noop');
    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);

    expect(captor.hasCompleted()).toBeFalse();

    fixture.removeIframe();
    expect(captor.hasCompleted()).toBeTrue();
    expect(fixture.message$).toBe(NEVER);
  });

  it('should support loading a script after unmounting the iframe', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    fixture.insertIframe();
    await fixture.loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_10a');
    const captor1 = new ObserveCaptor();

    fixture.message$.subscribe(captor1);
    expect(captor1.getValues()).toEqual(['ready (10a)']);

    fixture.removeIframe();

    // Mount a new iframe
    fixture.insertIframe();
    const captor2 = new ObserveCaptor();
    await fixture.loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_10b');
    fixture.message$.subscribe(captor2);
    expect(captor1.getValues()).toEqual(['ready (10a)']);
    expect(captor2.getValues()).toEqual(['ready (10b)']);
  });

  it('should allow passing arguments to the script', async () => {
    const fixture = registerFixture(new MicrofrontendFixture());
    const args = {
      stringArg: 'value1',
      numberArg: 123,
      booleanArg: true,
      objectArg: {key: 'value'},
      mapArg: new Map().set('key', 'value'),
      setArg: new Set().add('value1').add('value2')
    };
    await fixture.insertIframe().loadScript('lib/testing/microfrontend-fixture/microfrontend-fixture.script.ts', 'testcase_11', args);

    const captor = new ObserveCaptor();
    fixture.message$.subscribe(captor);
    expect(captor.getLastValue()).toEqual(args);
  });

  /**
   * Registers passed fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }
});

type Disposable = () => void;
