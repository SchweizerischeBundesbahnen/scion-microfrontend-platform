/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Subject} from 'rxjs';
import {IntentMessage, MessageHeaders, ResponseStatusCodes, TopicMessage} from '../../messaging.model';
import {MessageClient, takeUntilUnsubscribe} from './message-client';
import {IntentClient} from './intent-client';
import {expectEmissions, expectPromise, getLoggerSpy, installLoggerSpies, readConsoleLog, resetLoggerSpy, waitForCondition, waitUntilSubscriberCount} from '../../testing/spec.util.spec';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {ClientRegistry} from '../../host/client-registry/client.registry';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestService} from '../manifest-registry/manifest-service';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {Handler, IntentInterceptor, MessageInterceptor} from '../../host/message-broker/message-interception';
import {MicrofrontendFixture} from '../../testing/microfrontend-fixture/microfrontend-fixture';
import {ManifestFixture} from '../../testing/manifest-fixture/manifest-fixture';

const bodyExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): T => msg.body;
const headersExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): Map<string, any> => msg.headers;
const paramsExtractFn = <T>(msg: IntentMessage<T>): Map<string, any> => msg.intent.params;
const capabilityIdExtractFn = <T>(msg: IntentMessage<T>): string => msg.capability.metadata.id;

describe('Messaging', () => {

  const disposables = new Set<Disposable>();

  beforeEach(async () => {
    await MicrofrontendPlatform.destroy();
    installLoggerSpies();
  });

  afterEach(async () => {
    await MicrofrontendPlatform.destroy();
    disposables.forEach(disposable => disposable());
  });

  it('should allow publishing messages to a topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(messageCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'A');
    await Beans.get(MessageClient).publish('some-topic', 'B');
    await Beans.get(MessageClient).publish('some-topic', 'C');

    await expectEmissions(messageCaptor).toEqual(['A', 'B', 'C']);
  });

  it('should allow publishing a message in the platform\'s `whenState(PlatformState.Stopping)` hook', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const captor = new ObserveCaptor<TopicMessage, string>(msg => msg.body);
    Beans.get(MessageClient).observe$('client/whenPlatformStateStopping').subscribe(captor);

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    await microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'sendMessageWhenPlatformStateStopping', {symbolicName: 'client'});
    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in a bean\'s `preDestroy` hook when the platform is stopping`', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const captor = new ObserveCaptor<TopicMessage, string>(msg => msg.body);
    Beans.get(MessageClient).observe$('client/beanPreDestroy').subscribe(captor);

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    await microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'sendMessageOnBeanPreDestroy', {symbolicName: 'client'});
    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in `window.beforeunload` browser hook', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const captor = new ObserveCaptor<TopicMessage, string>(msg => msg.body);
    Beans.get(MessageClient).observe$('client/beforeunload').subscribe(captor);

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    await microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'sendMessageInBeforeUnload', {symbolicName: 'client'});

    // The browser does not trigger the 'beforeunload' event when removing the iframe.
    // For that reason, we navigate to another side.
    microfrontendFixture.setUrl('about:blank');
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in `window.unload` browser hook', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    const captor = new ObserveCaptor<TopicMessage, string>(msg => msg.body);
    Beans.get(MessageClient).observe$('client/unload').subscribe(captor);

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    await microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'sendMessageInUnload', {symbolicName: 'client'});

    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow issuing an intent', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [
            {type: 'some-capability'},
          ],
        },
      },
      applications: [],
    });

    const intentCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    await Beans.get(IntentClient).publish({type: 'some-capability'}, 'payload');

    await expectEmissions(intentCaptor).toEqual(['payload']);
  });

  it('should allow issuing an intent for which the app has not declared a respective intention, but only if \'intention check\' is disabled for that app', async () => {
    await MicrofrontendPlatform.startHost({
      host: {intentionCheckDisabled: true},
      applications: [
        {
          symbolicName: 'client-app',
          manifestUrl: new ManifestFixture({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]}).serve(),
        },
      ],
    });

    await expectPromise(Beans.get(IntentClient).publish({type: 'some-type'})).toResolve();
  });

  it('should not allow issuing an intent for which the app has not declared a respective intention, if \'intention check\' is enabled or not specified for that app', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client-app',
          manifestUrl: new ManifestFixture({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]}).serve(),
        },
      ],
    });

    await expectPromise(Beans.get(IntentClient).publish({type: 'some-type'})).toReject(/NotQualifiedError/);
  });

  it('should dispatch a message to subscribers with a wildcard subscription', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const messageCaptor = new ObserveCaptor();

    // Subscribe to 'myhome/:room/temperature'
    Beans.get(MessageClient).observe$<string>('myhome/:room/temperature').subscribe(messageCaptor);

    // Publish messages
    await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '25°C');
    await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '26°C');
    await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '22°C');
    await Beans.get(MessageClient).publish('myhome/kitchen/humidity', '15%');

    await messageCaptor.waitUntilEmitCount(3);

    expectMessage(messageCaptor.getValues()[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expectMessage(messageCaptor.getValues()[1]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '26°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expectMessage(messageCaptor.getValues()[2]).toMatch({
      topic: 'myhome/kitchen/temperature',
      body: '22°C',
      params: new Map().set('room', 'kitchen'),
      headers: new Map(),
    });
  });

  it('should allow passing headers when publishing a message', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(MessageClient).publish('some-topic', undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('header1', 'value').set('header2', 42)));
  });

  it('should allow passing headers when issuing an intent', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(IntentClient).observe$().subscribe(headerCaptor);

    await Beans.get(IntentClient).publish({type: 'some-capability'}, undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('header1', 'value').set('header2', 42)));
  });

  it('should return an empty headers dictionary if no headers are set', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'payload');
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map()));
  });

  it('should allow passing headers when sending a request', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', msg.headers.get('request-header').toUpperCase())});
    });

    const replyHeaderCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).request$('some-topic', undefined, {headers: new Map().set('request-header', 'ping')}).subscribe(replyHeaderCaptor);
    await replyHeaderCaptor.waitUntilEmitCount(1);
    await expect(replyHeaderCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('reply-header', 'PING')));
  });

  it('should allow passing headers when sending an intent request', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', intent.headers.get('request-header').toUpperCase())});
    });

    const replyHeaderCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, undefined, {headers: new Map().set('request-header', 'ping')}).subscribe(replyHeaderCaptor);
    await replyHeaderCaptor.waitUntilEmitCount(1);
    await expect(replyHeaderCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('reply-header', 'PING')));
  });

  it('should allow receiving a reply for a request (by not replying with a status code)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should allow receiving a reply for a request (by replying with the status code 200)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should allow receiving multiple replies for a request', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should complete the request when replying with the status code 250 (with the first reply)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeTrue();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should complete the request when replying with the status code 250 (after multiple replies)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeTrue();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should error the request when replying with the status code 500', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getValues()).withContext('emissions').toEqual([]);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeTrue();
    expect(replyCaptor.getError().message).toEqual('PING');
  });

  it('should not complete the message Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    Beans.get(MessageClient).observe$('topic').subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
    expect(captor.getValues()).withContext('emissions').toEqual([]);
  });

  it('should not complete the request Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    Beans.get(MessageClient).observe$('topic').subscribe();
    Beans.get(MessageClient).request$('topic').subscribe(captor);
    await waitUntilSubscriberCount('topic', 1);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
    expect(captor.getValues()).withContext('emissions').toEqual([]);
  });

  it('should allow receiving a reply for an intent request (by not replying with a status code)', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should allow receiving a reply for an intent request (by replying with the status code 200)', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should allow receiving multiple replies for an intent request', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should complete the intent request when replying with the status code 250 (with the first reply)', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeTrue();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should complete the intent request when replying with the status code 250 (after multiple replies)', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeTrue();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should error the intent request when replying with the status code 500', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getValues()).withContext('emissions').toEqual([]);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeTrue();
    expect(replyCaptor.getError().message).toEqual('PING');
  });

  it('should reject a \'request-response\' intent if no replier is found', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          intentions: [{type: 'some-type'}],
        },
      },
      applications: [
        {
          symbolicName: 'client-app',
          manifestUrl: new ManifestFixture({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]}).serve(),
        },
      ],
    });

    const replyCaptor = new ObserveCaptor();
    Beans.get(IntentClient).request$({type: 'some-type'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getError()).toEqual('[RequestReplyError] No client is currently running which could answer the intent \'{type=some-type, qualifier=undefined}\'.');
  });

  it('should reject a \'request-response\' topic message if no replier is found', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const replyCaptor = new ObserveCaptor();
    Beans.get(MessageClient).request$('some-topic').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getValues()).withContext('emissions').toEqual([]);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeTrue();
    expect(replyCaptor.getError()).toEqual('[RequestReplyError] No client is currently running which could answer the request sent to the topic \'some-topic\'.');
  });

  it('should allow an interceptor to handle a \'request-response\' intent message if no replier is running', async () => {
    // create an interceptor which handles intents of a given type and then swallows the message
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage, next: Handler<IntentMessage>): void {
        if (message.intent.type === 'some-capability') {
          const replyTo = message.headers.get(MessageHeaders.ReplyTo);
          const body = message.body;
          Beans.get(MessageClient).publish(replyTo, body.toUpperCase());
        }
        else {
          next.handle(message);
        }
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          intentions: [{type: 'some-capability'}],
        },
      },
      applications: [
        {
          symbolicName: 'client-app',
          manifestUrl: new ManifestFixture({name: 'Client Application', capabilities: [{type: 'some-capability', private: false}]}).serve(),
        },
      ],
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should allow an interceptor to handle a \'request-response\' topic message if no replier is running', async () => {
    // create an interceptor which handles messages of a given topic and then swallows the message
    const interceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): void {
        if (message.topic === 'some-topic') {
          const replyTo = message.headers.get(MessageHeaders.ReplyTo);
          const body = message.body;
          Beans.get(MessageClient).publish(replyTo, body.toUpperCase());
        }
        else {
          next.handle(message);
        }
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
    await MicrofrontendPlatform.startHost({applications: []});

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
  });

  it('should reject an intent if no application provides a satisfying capability', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          intentions: [{type: 'some-type'}],
        },
      },
      applications: [],
    });

    const replyCaptor = new ObserveCaptor();
    Beans.get(IntentClient).request$({type: 'some-type'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getError()).toEqual('[NullProviderError] No application found to provide a capability of the type \'some-type\' and qualifiers \'{}\'. Maybe, the capability is not public API or the providing application not available.');
  });

  it('should reject a client connect attempt if the app is not registered', async () => {
    await MicrofrontendPlatform.startHost({applications: []}); // no app is registered

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    const script = microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'connectToHost', {symbolicName: 'bad-client'});

    await expectAsync(script).toBeRejectedWithError(/\[MessageClientConnectError] Client connect attempt rejected by the message broker: Unknown client./);
  });

  it('should reject a client connect attempt if the client\'s origin is different to the registered app origin', async () => {
    await MicrofrontendPlatform.startHost({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client', baseUrl: 'http://app-origin'}).serve(),
        },
      ],
    });

    const microfrontendFixture = registerFixture(new MicrofrontendFixture());
    // Client connects under karma test runner origin, but is registered under `http://app-origin`.
    const script = microfrontendFixture.insertIframe().loadScript('./lib/client/messaging/messaging.script.ts', 'connectToHost', {symbolicName: 'client'});

    await expectAsync(script).toBeRejectedWithError(/\[MessageClientConnectError] Client connect attempt blocked by the message broker: Wrong origin./);
  });

  it('should reject startup promise if the message broker cannot be discovered', async () => {
    const loggerSpy = getLoggerSpy('error');
    const startup = MicrofrontendPlatform.connectToHost('client-app', {brokerDiscoverTimeout: 250});
    await expectPromise(startup).toReject(/MicrofrontendPlatformStartupError/);

    await expect(loggerSpy).toHaveBeenCalledWith('[GatewayError] Message broker not discovered within 250ms. Messages cannot be published or received.');
  });

  it('should not error with `ClientConnectError` when starting the platform host and if initializers in runlevel 0 take a long time to complete, e.g., to fetch manifests', async () => {
    const loggerSpy = getLoggerSpy('error');
    const initializerDuration = 1000;

    // Register a long running initializer in runlevel 0
    let initializerCompleted = false;
    Beans.registerInitializer({
      useFunction: () => new Promise<void>(resolve => setTimeout(() => {
        initializerCompleted = true;
        resolve();
      }, initializerDuration)),
      runlevel: 0,
    });

    const startup = MicrofrontendPlatform.startHost({host: {brokerDiscoverTimeout: 250}, applications: []});

    await expectPromise(startup).toResolve();
    expect(initializerCompleted).toBeTrue();
    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it('should not error with `ClientConnectError` when publishing a message in runlevel 0 and if runlevel 0 takes a long time to complete (host connects to the broker in runlevel 1)', async () => {
    const loggerSpy = getLoggerSpy('error');
    const initializerDuration = 1000;

    // Publish a message in runlevel 0
    Beans.registerInitializer({
      useFunction: () => {
        Beans.get(MessageClient).publish('some-topic', 'payload', {retain: true});
        return Promise.resolve();
      },
      runlevel: 0,
    });

    // Register a long running initializer in runlevel 0
    Beans.registerInitializer({
      useFunction: () => new Promise<void>(resolve => setTimeout(() => {
        resolve();
      }, initializerDuration)),
      runlevel: 0,
    });

    // Start the host
    const startup = MicrofrontendPlatform.startHost({host: {brokerDiscoverTimeout: 250}, applications: []});

    // Expect the startup not to error
    await expectPromise(startup).toResolve();
    expect(loggerSpy).not.toHaveBeenCalled();

    // Expect the message to be published
    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(messageCaptor);
    await messageCaptor.waitUntilEmitCount(1);
    expect(messageCaptor.getLastValue()).toEqual('payload');
  });

  it('should receive a message sent to a topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor<TopicMessage, string>(message => message.body);
    Beans.get(MessageClient).observe$('topic').subscribe(captor);
    // WHEN
    await Beans.get(MessageClient).publish('topic', 'message');
    await captor.waitUntilEmitCount(1);
    // THEN
    expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
    expect(captor.getValues()).withContext('emissions').toEqual(['message']);
  });

  it('should receive multiple messages sent to a topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor<TopicMessage, string>(message => message.body);
    Beans.get(MessageClient).observe$('topic').subscribe(captor);
    // WHEN
    await Beans.get(MessageClient).publish('topic', 'message 1');
    await Beans.get(MessageClient).publish('topic', 'message 2');
    await Beans.get(MessageClient).publish('topic', 'message 3');
    await captor.waitUntilEmitCount(3);
    // THEN
    expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
    expect(captor.getValues()).withContext('emissions').toEqual(['message 1', 'message 2', 'message 3']);
  });

  it('should allow multiple subscriptions to the same topic in the same client', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const captor1 = new ObserveCaptor(bodyExtractFn);
    const captor2 = new ObserveCaptor(bodyExtractFn);
    const captor3 = new ObserveCaptor(bodyExtractFn);

    const subscription1 = Beans.get(MessageClient).observe$<string>('topic').subscribe(captor1);
    const subscription2 = Beans.get(MessageClient).observe$<string>('topic').subscribe(captor2);
    const subscription3 = Beans.get(MessageClient).observe$<string>('topic').subscribe(captor3);

    // publish 'message 1a'
    await Beans.get(MessageClient).publish('topic', 'message 1a', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a']);
    await expectEmissions(captor2).toEqual(['message 1a']);
    await expectEmissions(captor3).toEqual(['message 1a']);

    // publish 'message 1b'
    await Beans.get(MessageClient).publish('topic', 'message 1b', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b']);

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // publish 'message 2a'
    await Beans.get(MessageClient).publish('topic', 'message 2a', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a']);

    // publish 'message 2b'
    await Beans.get(MessageClient).publish('topic', 'message 2b', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // publish 'message 3a'
    await Beans.get(MessageClient).publish('topic', 'message 3a', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b', 'message 3a']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);

    // publish 'message 3b'
    await Beans.get(MessageClient).publish('topic', 'message 3b', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b', 'message 3a', 'message 3b']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // publish 'message 4a'
    await Beans.get(MessageClient).publish('topic', 'message 4a', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b', 'message 3a', 'message 3b']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);

    // publish 'message 4b'
    await Beans.get(MessageClient).publish('topic', 'message 4b', {retain: true});
    await expectEmissions(captor1).toEqual(['message 1a', 'message 1b']);
    await expectEmissions(captor2).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b', 'message 3a', 'message 3b']);
    await expectEmissions(captor3).toEqual(['message 1a', 'message 1b', 'message 2a', 'message 2b']);
  });

  it('should allow multiple subscriptions to the same intent in the same client', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'xyz'},
          ],
        },
      },
      applications: [],
    });

    const captor1 = new ObserveCaptor(bodyExtractFn);
    const captor2 = new ObserveCaptor(bodyExtractFn);
    const captor3 = new ObserveCaptor(bodyExtractFn);

    const subscription1 = Beans.get(IntentClient).observe$<string>().subscribe(captor1);
    const subscription2 = Beans.get(IntentClient).observe$<string>().subscribe(captor2);
    const subscription3 = Beans.get(IntentClient).observe$<string>().subscribe(captor3);

    // issue 'intent 1a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 1a');
    await expectEmissions(captor1).toEqual(['intent 1a']);
    await expectEmissions(captor2).toEqual(['intent 1a']);
    await expectEmissions(captor3).toEqual(['intent 1a']);

    // issue 'intent 1b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 1b');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b']);

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // issue 'intent 2a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 2a');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a']);

    // issue 'intent 2b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 2b');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // issue 'intent 3a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 3a');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b', 'intent 3a']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);

    // issue 'intent 3b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 3b');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b', 'intent 3a', 'intent 3b']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // issue 'intent 4a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 4a');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b', 'intent 3a', 'intent 3b']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);

    // issue 'intent 4b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 4b');
    await expectEmissions(captor1).toEqual(['intent 1a', 'intent 1b']);
    await expectEmissions(captor2).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b', 'intent 3a', 'intent 3b']);
    await expectEmissions(captor3).toEqual(['intent 1a', 'intent 1b', 'intent 2a', 'intent 2b']);
  });

  it('should receive a message once regardless of the number of subscribers in the same client', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // Register two receivers
    Beans.get(MessageClient).observe$<string>('topic').subscribe();
    Beans.get(MessageClient).observe$<string>('topic').subscribe();

    // Register the test receiver
    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$<string>('topic').subscribe(messageCaptor);

    // publish 'message 1'
    await Beans.get(MessageClient).publish('topic', 'message 1');
    // publish 'message 2'
    await Beans.get(MessageClient).publish('topic', 'message 2');

    // expect only the two message to be dispatched
    await expectEmissions(messageCaptor).toEqual(['message 1', 'message 2']);
  });

  it('should dispatch a retained message only to the newly subscribed subscriber', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const messageCollector1 = new ObserveCaptor();
    const messageCollector2 = new ObserveCaptor();
    const messageCollector3 = new ObserveCaptor();
    const messageCollector4 = new ObserveCaptor();
    const messageCollector5 = new ObserveCaptor();
    const messageCollector6 = new ObserveCaptor();

    // Subscribe before publishing the retained message
    Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCollector1);
    Beans.get(MessageClient).observe$<string>('myhome/:room/temperature').subscribe(messageCollector2);

    // Publish the retained message
    await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '25°C', {retain: true});

    await messageCollector1.waitUntilEmitCount(1);
    expectMessage(messageCollector1.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    await messageCollector2.waitUntilEmitCount(1);
    expectMessage(messageCollector2.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    // Subscribe after publishing the retained message
    Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCollector3);
    Beans.get(MessageClient).observe$<string>('myhome/:room/temperature').subscribe(messageCollector4);
    Beans.get(MessageClient).observe$<string>('myhome/:room/:measurement').subscribe(messageCollector5);
    Beans.get(MessageClient).observe$<string>('myhome/kitchen/:measurement').subscribe(messageCollector6);

    await messageCollector1.waitUntilEmitCount(1);
    await messageCollector2.waitUntilEmitCount(1);
    await messageCollector3.waitUntilEmitCount(1);
    await messageCollector4.waitUntilEmitCount(1);
    await messageCollector5.waitUntilEmitCount(1);

    expect(messageCollector1.getValues().length).toEqual(1);
    expectMessage(messageCollector1.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    expect(messageCollector2.getValues().length).toEqual(1);
    expectMessage(messageCollector2.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expect(messageCollector3.getValues().length).toEqual(1);
    expectMessage(messageCollector3.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    expect(messageCollector4.getValues().length).toEqual(1);
    expectMessage(messageCollector4.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expect(messageCollector5.getValues().length).toEqual(1);
    expectMessage(messageCollector5.getLastValue()).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom').set('measurement', 'temperature'),
      headers: new Map(),
    });

    expect(messageCollector6.getValues().length).toEqual(0);
  });

  it('should receive an intent once regardless of the number of subscribers in the same client', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'xyz'},
          ],
        },
      },
      applications: [],
    });

    // Register two intent handlers
    Beans.get(IntentClient).observe$<string>().subscribe();
    Beans.get(IntentClient).observe$<string>().subscribe();

    // Register the test intent handler
    const intentCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    // issue 'intent 1'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 1');
    // issue 'intent 2'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 2');

    // expect only the two intents to be dispatched
    await expectEmissions(intentCaptor).toEqual(['intent 1', 'intent 2']);
  });

  it('should receive an intent for a capability having an exact qualifier', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // Register capability
    const capabilityId = await Beans.get(ManifestService).registerCapability({type: 'view', qualifier: {entity: 'person', id: '5'}});

    // Subscribe for intents
    const intentCaptor = new ObserveCaptor(capabilityIdExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    // Publish the intent
    await Beans.get(IntentClient).publish({type: 'view', qualifier: {entity: 'person', id: '5'}});

    // Expect the intent to be received
    await expectEmissions(intentCaptor).toEqual([capabilityId]);
  });

  it('should receive an intent for a capability having an asterisk qualifier', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // Register capability
    const capabilityId = await Beans.get(ManifestService).registerCapability({type: 'view', qualifier: {entity: 'person', id: '*'}});

    // Subscribe for intents
    const intentCaptor = new ObserveCaptor(capabilityIdExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    // Publish the intent
    await Beans.get(IntentClient).publish({type: 'view', qualifier: {entity: 'person', id: '5'}});

    // Expect the intent to be received
    await expectEmissions(intentCaptor).toEqual([capabilityId]);
  });

  it('should receive an intent for a capability having an optional qualifier', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // Register capability
    const capabilityId = await Beans.get(ManifestService).registerCapability({type: 'view', qualifier: {entity: 'person', id: '?'}});

    // Publish and receive intent published to {entity: 'person', id: '5'}
    const intentCaptor1 = new ObserveCaptor(capabilityIdExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor1);
    await Beans.get(IntentClient).publish({type: 'view', qualifier: {entity: 'person', id: '5'}});
    await expectEmissions(intentCaptor1).toEqual([capabilityId]);

    // Publish and receive intent published to {entity: 'person'}
    const intentCaptor2 = new ObserveCaptor(capabilityIdExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor2);
    await Beans.get(IntentClient).publish({type: 'view', qualifier: {entity: 'person'}});
    await expectEmissions(intentCaptor2).toEqual([capabilityId]);
  });

  it('should allow tracking the subscriptions on a topic', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // Subscribe and wait until the initial subscription count, which is 0, is reported.
    const subscriberCountCaptor = new ObserveCaptor();
    Beans.get(MessageClient).subscriberCount$('some-topic').subscribe(subscriberCountCaptor);

    Beans.get(MessageClient).observe$<string>('some-topic').subscribe().unsubscribe();
    const subscription2 = Beans.get(MessageClient).observe$<string>('some-topic').subscribe();
    const subscription3 = Beans.get(MessageClient).observe$<string>('some-topic').subscribe();
    subscription2.unsubscribe();
    subscription3.unsubscribe();

    await expectEmissions(subscriberCountCaptor).toEqual([0, 1, 0, 1, 2, 1, 0]);
    expect(subscriberCountCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
  });

  it('should not complete the "topic subscriber count" Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    // GIVEN
    const captor = new ObserveCaptor();
    Beans.get(MessageClient).subscriberCount$('topic').subscribe(captor);
    // WHEN
    await MicrofrontendPlatform.destroy();
    // THEN
    expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
    expect(captor.getValues()).withContext('emissions').toEqual([]);
  });

  it('should set message headers about the sender', async () => {
    await MicrofrontendPlatform.startHost({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toBeDefined();
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
  });

  it('should deliver custom headers in retained message', async () => {
    await MicrofrontendPlatform.startHost({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true, headers: new Map().set('custom-header', 'some-value')});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toBeDefined();
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
    expect(headersCaptor.getLastValue().get('custom-header')).toEqual('some-value');
  });

  it('should deliver the client-id from the publisher when receiving a retained message upon subscription', async () => {
    await MicrofrontendPlatform.startHost({
      host: {symbolicName: 'host-app'},
      applications: [],
    });

    await waitForCondition((): boolean => Beans.get(ClientRegistry).getByApplication('host-app').length > 0, 1000);
    const senderClientId = Beans.get(ClientRegistry).getByApplication('host-app')[0].id;

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toEqual(senderClientId);
  });

  it('should throw if the topic of a message to publish is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(MessageClient).publish('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).publish(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).publish(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).publish('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic of a request is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(MessageClient).request$('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).request$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).request$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).request$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic to observe the subscriber count is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(MessageClient).subscriberCount$('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).subscriberCount$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).subscriberCount$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).subscriberCount$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic to observe is empty, `null` or `undefined`', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(MessageClient).observe$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).observe$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(MessageClient).observe$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the qualifier of an intent contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(IntentClient).publish({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(IntentClient).publish({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(IntentClient).publish({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should throw if the qualifier of an intent request contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    expect(() => Beans.get(IntentClient).request$({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(IntentClient).request$({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(IntentClient).request$({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should prevent overriding platform specific message headers [pub/sub]', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headersCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵTopicSubscriberId, 'should-not-be-set'),
      },
    );

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ɵTopicSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific message headers [request/reply]', async () => {
    await MicrofrontendPlatform.startHost({applications: []});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headersCaptor);

    Beans.get(MessageClient).request$('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵTopicSubscriberId, 'should-not-be-set'),
      },
    ).subscribe();

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ɵTopicSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [pub/sub]', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(IntentClient).observe$().subscribe(headersCaptor);

    await Beans.get(IntentClient).publish({type: 'some-capability'}, 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set'),
      },
    );

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [request/reply]', async () => {
    await MicrofrontendPlatform.startHost({
      host: {
        manifest: {
          name: 'Host Application',
          capabilities: [{type: 'some-capability'}],
        },
      },
      applications: [],
    });

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(IntentClient).observe$().subscribe(headersCaptor);

    Beans.get(IntentClient).request$({type: 'some-capability'}, 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set'),
      },
    ).subscribe();

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  describe('takeUntilUnsubscribe operator', () => {

    it('should complete the source observable when all subscribers unsubscribed', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const subscription1 = Beans.get(MessageClient).observe$('some-topic').subscribe();
      const subscription2 = Beans.get(MessageClient).observe$('some-topic').subscribe();
      await waitUntilSubscriberCount('some-topic', 2);

      const captor = new ObserveCaptor();
      new Subject<void>()
        .pipe(takeUntilUnsubscribe('some-topic'))
        .subscribe(captor);

      // unsubscribe subscription1
      subscription1.unsubscribe();
      await waitUntilSubscriberCount('some-topic', 1);

      expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
      expect(captor.getValues()).withContext('emissions').toEqual([]);

      // unsubscribe subscription2
      subscription2.unsubscribe();
      await waitUntilSubscriberCount('some-topic', 0);

      expect(captor.hasCompleted()).withContext('hasCompleted').toBeTrue();
      expect(captor.getValues()).withContext('emissions').toEqual([]);
    });

    it('should complete the source observable immediately when no subscriber is subscribed', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const captor = new ObserveCaptor();
      new Subject<void>()
        .pipe(takeUntilUnsubscribe('nobody-subscribed-to-this-topic'))
        .subscribe(captor);

      await waitUntilSubscriberCount('nobody-subscribed-to-this-topic', 0);
      expect(captor.hasCompleted()).withContext('hasCompleted').toBeTrue();
      expect(captor.getValues()).withContext('emissions').toEqual([]);
    });

    it('should not complete the source Observable upon platform shutdown (as per API)', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      // GIVEN
      const captor = new ObserveCaptor();
      const subscription = new Subject<void>()
        .pipe(takeUntilUnsubscribe('nobody-subscribed-to-this-topic'))
        .subscribe(captor);
      // WHEN
      await MicrofrontendPlatform.destroy();
      // THEN
      expect(captor.hasCompleted()).withContext('hasCompleted').toBeFalse();
      expect(captor.hasErrored()).withContext('hasErrored').toBeFalse();
      expect(captor.getValues()).withContext('emissions').toEqual([]);

      subscription.unsubscribe();
    });
  });

  describe('intents with params', () => {

    it('should allow issuing an intent with parameters', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param1', required: true}],
                requiredParams: ['param2'], // legacy notation
              },
            ],
          },
        },
        applications: [],
      });

      // publish
      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'capability'}).subscribe(observeCaptor);
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1').set('param2', 'value2')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param1', 'value1').set('param2', 'value2'));
    });

    it('should preserve data type of passed intent parameters', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param', required: false}],
              },
            ],
          },
        },
        applications: [],
      });

      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<void>({type: 'capability'}).subscribe(observeCaptor);

      // publish intent with a string param
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', 'string')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', 'string'));

      // publish intent with a numeric param
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', 123)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', 123));

      // publish intent with a boolean param
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', true)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', true));

      // publish intent with a `null` param
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', null)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', null));

      // publish intent with an `undefined` param
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', undefined)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', undefined));

      // publish intent with an object literal param
      observeCaptor.reset();
      const objectLiteralParam = {stringProperty: 'string', numericProperty: 123, booleanProperty: true, undefinedProperty: undefined, nullProperty: null};
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', objectLiteralParam)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', objectLiteralParam));

      // publish intent with a `Map` param
      observeCaptor.reset();
      const mapParam = new Map().set('stringProperty', 'string').set('numericProperty', 123).set('booleanProperty', true).set('undefinedProperty', undefined).set('nullProperty', null);
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', mapParam)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', mapParam));

      // publish intent with a `Set` param
      observeCaptor.reset();
      const setParam = new Set().add('string').add(123).add(true).add(false).add(undefined).add(null);
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', setParam)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', setParam));
    });

    it('should allow issuing an intent without passing optional parameters', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param1', required: false}],
                optionalParams: ['param2'], // legacy notation
              },
            ],
          },
        },
        applications: [],
      });

      // publish
      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'capability'}).subscribe(observeCaptor);
      await Beans.get(IntentClient).publish({type: 'capability'});
      await expectEmissions(observeCaptor).toEqual(new Map());
    });

    it('should reject an intent if parameters are missing', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param1', required: true}],
                requiredParams: ['param2'], // legacy notation
              },
            ],
          },
        },
        applications: [],
      });

      // publish
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')})).toReject(/\[ParamMismatchError].*missingParams=\[param2]/);
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param2', 'value2')})).toReject(/\[ParamMismatchError].*missingParams=\[param1]/);
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1').set('param2', 'value2')})).toResolve();
    });

    it('should reject an intent if it includes non-specified parameter', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param1', required: false}],
              },
            ],
          },
        },
        applications: [],
      });

      // publish
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1').set('param2', 'value2')})).toReject(/\[ParamMismatchError].*unexpectedParams=\[param2]/);
    });

    it('should map deprecated params to their substitutes, if declared', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: false, deprecated: {useInstead: 'param2'}},
                  {name: 'param2', required: true},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      // publish
      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'capability'}).subscribe(observeCaptor);
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param2', 'value1'));

      // assert the deprecation warning
      const expectedLogMessage = `[DEPRECATION] Application 'host-app' passes a deprecated parameter in the intent: 'param1'. Pass parameter 'param2' instead.`;
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual(jasmine.arrayContaining([expectedLogMessage]));
    });

    it('should make deprecated params optional', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: false, deprecated: true},
                  {name: 'param2', required: false, deprecated: {useInstead: 'param3'}},
                  {name: 'param3', required: true},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'capability'}).subscribe(observeCaptor);

      // publish without params
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability'})).toReject(/\[ParamMismatchError].*missingParams=\[param3]/);

      // publish with param1
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')})).toReject(/\[ParamMismatchError].*missingParams=\[param3]/);

      // publish with param2
      observeCaptor.reset();
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param2', 'value2')})).toResolve();
      await expectEmissions(observeCaptor).toEqual(new Map().set('param3', 'value2'));

      // publish with param3
      observeCaptor.reset();
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param3', 'value3')})).toResolve();
      await expectEmissions(observeCaptor).toEqual(new Map().set('param3', 'value3'));
    });

    it('should log deprecation warning when passing deprecated params in an intent', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          symbolicName: 'host-app',
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [
                  {name: 'param1', required: false, deprecated: {message: 'DEPRECATION NOTICE'}},
                  {name: 'param2', required: false, deprecated: {message: 'DEPRECATION NOTICE', useInstead: 'param5'}},
                  {name: 'param3', required: false, deprecated: {useInstead: 'param5'}},
                  {name: 'param4', required: false, deprecated: true},
                  {name: 'param5', required: false},
                ],
              },
            ],
          },
        },
        applications: [],
      });

      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'capability'}).subscribe(observeCaptor);

      // publish without params
      await Beans.get(IntentClient).publish({type: 'capability'});
      await expectEmissions(observeCaptor).toEqual(new Map());
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual([]);

      // publish with deprecated param 'param1'
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param1', 'value1'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual([
        `[DEPRECATION] Application 'host-app' passes a deprecated parameter in the intent: 'param1'. DEPRECATION NOTICE`,
      ]);

      // publish with deprecated param 'param2'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param2', 'value2')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param5', 'value2'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual([
        `[DEPRECATION] Application 'host-app' passes a deprecated parameter in the intent: 'param2'. Pass parameter 'param5' instead. DEPRECATION NOTICE`,
      ]);

      // publish with deprecated param 'param3'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param3', 'value3')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param5', 'value3'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual([
        `[DEPRECATION] Application 'host-app' passes a deprecated parameter in the intent: 'param3'. Pass parameter 'param5' instead.`,
      ]);

      // publish with deprecated param 'param4'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param4', 'value4')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param4', 'value4'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]/})).toEqual([
        `[DEPRECATION] Application 'host-app' passes a deprecated parameter in the intent: 'param4'.`,
      ]);
    });
  });

  /**
   * Registers the fixture for destruction after test execution.
   */
  function registerFixture(fixture: MicrofrontendFixture): MicrofrontendFixture {
    disposables.add(() => fixture.removeIframe());
    return fixture;
  }
});

/**
 * Expects the message to equal the expected message with its headers to contain at minimum the given map entries (because the platform adds platform-specific headers as well).
 */
function expectMessage(actual: TopicMessage): {toMatch: (expected: TopicMessage) => void} {
  return {
    toMatch: (expected: TopicMessage): void => {
      expect(actual).toEqual(jasmine.objectContaining({
        ...expected,
        headers: jasmine.mapContaining(expected.headers),
      }));
    },
  };
}

type Disposable = () => void;
