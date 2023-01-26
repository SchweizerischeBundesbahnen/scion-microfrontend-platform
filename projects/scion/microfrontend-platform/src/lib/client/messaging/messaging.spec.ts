/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {concat, NEVER, of, Subject} from 'rxjs';
import {Intent, IntentMessage, MessageHeaders, ResponseStatusCodes, TopicMessage} from '../../messaging.model';
import {MessageClient, takeUntilUnsubscribe} from './message-client';
import {IntentClient} from './intent-client';
import {expectEmissions, expectPromise, getLoggerSpy, installLoggerSpies, Latch, readConsoleLog, resetLoggerSpy, waitFor, waitUntilStable, waitUntilSubscriberCount} from '../../testing/spec.util.spec';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {MicrofrontendPlatformHost} from '../../host/microfrontend-platform-host';
import {ClientRegistry} from '../../host/client-registry/client.registry';
import {Beans} from '@scion/toolkit/bean-manager';
import {ManifestService} from '../manifest-registry/manifest-service';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {Handler, IntentInterceptor, MessageInterceptor} from '../../host/message-broker/message-interception';
import {MicrofrontendFixture} from '../../testing/microfrontend-fixture/microfrontend-fixture';
import {ManifestFixture} from '../../testing/manifest-fixture/manifest-fixture';
import {PublishOptions, RequestOptions} from './publish-options';

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
    await MicrofrontendPlatformHost.start({applications: []});

    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$<string>('some-topic').subscribe(messageCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'A');
    await Beans.get(MessageClient).publish('some-topic', 'B');
    await Beans.get(MessageClient).publish('some-topic', 'C');

    await expectEmissions(messageCaptor).toEqual(['A', 'B', 'C']);
  });

  it('should allow publishing a message in the platform\'s `whenState(PlatformState.Stopping)` hook', async () => {
    await MicrofrontendPlatformHost.start({
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
    await microfrontendFixture.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'sendMessageWhenPlatformStateStopping', {symbolicName: 'client'});
    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in a bean\'s `preDestroy` hook when the platform is stopping`', async () => {
    await MicrofrontendPlatformHost.start({
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
    await microfrontendFixture.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'sendMessageOnBeanPreDestroy', {symbolicName: 'client'});
    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in `window.beforeunload` browser hook', async () => {
    await MicrofrontendPlatformHost.start({
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
    await microfrontendFixture.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'sendMessageInBeforeUnload', {symbolicName: 'client'});

    // The browser does not trigger the 'beforeunload' event when removing the iframe.
    // For that reason, we navigate to another side.
    microfrontendFixture.setUrl('about:blank');
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow publishing a message in `window.unload` browser hook', async () => {
    await MicrofrontendPlatformHost.start({
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
    await microfrontendFixture.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'sendMessageInUnload', {symbolicName: 'client'});

    microfrontendFixture.removeIframe();
    await expectEmissions(captor).toEqual(['message from client']);
  });

  it('should allow issuing an intent', async () => {
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(MessageClient).publish('some-topic', undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('header1', 'value').set('header2', 42)));
  });

  it('should allow passing headers when issuing an intent', async () => {
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({applications: []});

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'payload');
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map()));
  });

  it('should allow passing headers when sending a request', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({
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

  it('should allow an interceptor to handle a \'request-response\' intent message if no replier is running', async () => {
    // create an interceptor which handles intents of a given type and then swallows the message
    const interceptor = new class implements IntentInterceptor {
      public intercept(message: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
        if (message.intent.type === 'some-capability') {
          const replyTo = message.headers.get(MessageHeaders.ReplyTo);
          const body = message.body;
          return Beans.get(MessageClient).publish(replyTo, body.toUpperCase());
        }
        else {
          return next.handle(message);
        }
      }
    };
    Beans.register(IntentInterceptor, {useValue: interceptor, multi: true});
    await MicrofrontendPlatformHost.start({
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
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'some-topic') {
          const replyTo = message.headers.get(MessageHeaders.ReplyTo);
          const body = message.body;
          return Beans.get(MessageClient).publish(replyTo, body.toUpperCase());
        }
        else {
          return next.handle(message);
        }
      }
    };
    Beans.register(MessageInterceptor, {useValue: interceptor, multi: true});
    await MicrofrontendPlatformHost.start({applications: []});

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
    expect(replyCaptor.hasErrored()).withContext('hasErrored').toBeFalse();
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

    const startup = MicrofrontendPlatformHost.start({host: {brokerDiscoverTimeout: 250}, applications: []});

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
    const startup = MicrofrontendPlatformHost.start({host: {brokerDiscoverTimeout: 250}, applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({
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
    await MicrofrontendPlatformHost.start({applications: []});

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

  it('should receive an intent once regardless of the number of subscribers in the same client', async () => {
    await MicrofrontendPlatformHost.start({
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

  it(`should receive an intent for a capability having the qualifier {entity: 'person', mode: 'new'}`, async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // Register capability
    const capabilityId = await Beans.get(ManifestService).registerCapability({type: 'view', qualifier: {entity: 'person', mode: 'new'}});

    // Subscribe for intents
    const intentCaptor = new ObserveCaptor(capabilityIdExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    // Publish the intent
    await Beans.get(IntentClient).publish({type: 'view', qualifier: {entity: 'person', mode: 'new'}});

    // Expect the intent to be received
    await expectEmissions(intentCaptor).toEqual([capabilityId]);
  });

  it('should transport topic message to subscribed client(s) only', async () => {
    await MicrofrontendPlatformHost.start({
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({name: 'Client'}).serve(),
        },
      ],
    });

    // Mount client that monitors the topic message channel and subscribes to the test topic.
    const microfrontend1 = registerFixture(new MicrofrontendFixture());
    await microfrontend1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToTopic', {symbolicName: 'client', topic: 'test/topic', monitorTopicMessageChannel: true});
    const microfrontend1TopicMessageChannel = new ObserveCaptor();

    // Mount client that monitors the topic message channel but DOES NOT subscribe to the test topic.
    const microfrontend2 = registerFixture(new MicrofrontendFixture());
    await microfrontend2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'monitorTopicMessageChannel', {symbolicName: 'client'});
    const microfrontend2TopicMessageChannel = new ObserveCaptor();

    // Publish message to the test topic.
    await Beans.get(MessageClient).publish('test/topic', 'Topic message');

    // Capture messages transported to the clients on the topic message channel.
    microfrontend1.message$.subscribe(microfrontend1TopicMessageChannel);
    await waitUntilStable(() => microfrontend1TopicMessageChannel.getValues());
    microfrontend2.message$.subscribe(microfrontend2TopicMessageChannel);
    await waitUntilStable(() => microfrontend2TopicMessageChannel.getValues());

    // Expect message to be transported to client 1 because subscribed to the topic.
    expect(microfrontend1TopicMessageChannel.getValues()).toContain(jasmine.objectContaining({
      topic: 'test/topic',
      body: 'Topic message',
    }));

    // Expect message NOT to be transported to client 2 because not subscribed to the topic.
    expect(microfrontend2TopicMessageChannel.getValues()).not.toContain(jasmine.objectContaining({
      topic: 'test/topic',
      body: 'Topic message',
    }));
  });

  it('should transport intent message to subscribed client(s) only', async () => {
    await MicrofrontendPlatformHost.start({
      host: {
        manifest: {
          name: 'Host Application',
          intentions: [
            {type: 'testee'},
          ],
        },
      },
      applications: [
        {
          symbolicName: 'client',
          manifestUrl: new ManifestFixture({
            name: 'Client',
            capabilities: [
              {type: 'testee', private: false},
            ],
          }).serve(),
        },
      ],
    });

    // Mount client that monitors the intent message channel and subscribes to the test intent.
    const microfrontend1 = registerFixture(new MicrofrontendFixture());
    await microfrontend1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'client', intent: {type: 'testee'}, monitorIntentMessageChannel: true});
    const microfrontend1IntentMessageChannel = new ObserveCaptor();

    // Mount client that monitors the intent message channel but DOES NOT subscribe to the test intent.
    const microfrontend2 = registerFixture(new MicrofrontendFixture());
    await microfrontend2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'monitorIntentMessageChannel', {symbolicName: 'client'});
    const microfrontend2IntentMessageChannel = new ObserveCaptor();

    // Publish test intent.
    await Beans.get(IntentClient).publish({type: 'testee'}, 'Intent message');

    // Capture messages transported to the clients on the intent message channel.
    microfrontend1.message$.subscribe(microfrontend1IntentMessageChannel);
    await waitUntilStable(() => microfrontend1IntentMessageChannel.getValues());
    microfrontend2.message$.subscribe(microfrontend2IntentMessageChannel);
    await waitUntilStable(() => microfrontend2IntentMessageChannel.getValues());

    // Expect message to be transported to client 1 because subscribed to the intent.
    expect(microfrontend1IntentMessageChannel.getValues()).toContain(jasmine.objectContaining({
      intent: jasmine.objectContaining({type: 'testee'}),
      body: 'Intent message',
    }));

    // Expect message NOT to be transported to client 2 because not subscribed to the intent.
    expect(microfrontend2IntentMessageChannel.getValues()).not.toContain(jasmine.objectContaining({
      intent: jasmine.objectContaining({type: 'testee'}),
      body: 'Intent message',
    }));
  });

  it('should allow tracking the subscriptions on a topic', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    // Subscribe and wait until the initial subscription count, which is 0, is reported.
    const subscriberCountCaptor = new ObserveCaptor();

    Beans.get(MessageClient).subscriberCount$('some-topic').subscribe(subscriberCountCaptor);
    await subscriberCountCaptor.waitUntilEmitCount(1);

    const subscription1 = Beans.get(MessageClient).observe$<string>('some-topic').subscribe();
    await subscriberCountCaptor.waitUntilEmitCount(2);

    subscription1.unsubscribe();
    await subscriberCountCaptor.waitUntilEmitCount(3);

    const subscription2 = Beans.get(MessageClient).observe$<string>('some-topic').subscribe();
    await subscriberCountCaptor.waitUntilEmitCount(4);

    const subscription3 = Beans.get(MessageClient).observe$<string>('some-topic').subscribe();
    await subscriberCountCaptor.waitUntilEmitCount(5);

    subscription2.unsubscribe();
    await subscriberCountCaptor.waitUntilEmitCount(6);

    subscription3.unsubscribe();
    await subscriberCountCaptor.waitUntilEmitCount(7);

    expect(subscriberCountCaptor.getValues()).toEqual([0, 1, 0, 1, 2, 1, 0]);
    expect(subscriberCountCaptor.hasCompleted()).withContext('hasCompleted').toBeFalse();
  });

  it('should not complete the "topic subscriber count" Observable upon platform shutdown (as per API)', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

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
    await MicrofrontendPlatformHost.start({
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

  it('should prevent overriding platform specific message headers [pub/sub]', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headersCaptor);

    await Beans.get(MessageClient).publish('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵSubscriberId, 'should-not-be-set'),
      },
    );

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ɵSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific message headers [request/reply]', async () => {
    await MicrofrontendPlatformHost.start({applications: []});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(headersCaptor);

    Beans.get(MessageClient).request$('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵSubscriberId, 'should-not-be-set'),
      },
    ).subscribe();

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ɵSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [pub/sub]', async () => {
    await MicrofrontendPlatformHost.start({
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
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵSubscriberId, 'should-not-be-set'),
      },
    );

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [request/reply]', async () => {
    await MicrofrontendPlatformHost.start({
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
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵSubscriberId, 'should-not-be-set'),
      },
    ).subscribe();

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  describe('takeUntilUnsubscribe operator', () => {

    it('should complete the source observable when all subscribers unsubscribed', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

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
      await MicrofrontendPlatformHost.start({applications: []});

      const captor = new ObserveCaptor();
      new Subject<void>()
        .pipe(takeUntilUnsubscribe('nobody-subscribed-to-this-topic'))
        .subscribe(captor);

      await waitUntilSubscriberCount('nobody-subscribed-to-this-topic', 0);
      expect(captor.hasCompleted()).withContext('hasCompleted').toBeTrue();
      expect(captor.getValues()).withContext('emissions').toEqual([]);
    });

    it('should not complete the source Observable upon platform shutdown (as per API)', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

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
      await MicrofrontendPlatformHost.start({
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
      await MicrofrontendPlatformHost.start({
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
      await expectEmissions(observeCaptor).toEqual(new Map());

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

    it('should not remove params associated with the value `null`', async () => {
      await MicrofrontendPlatformHost.start({
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

      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', null)});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param', null));
    });

    it('should remove params associated with the value `undefined`', async () => {
      await MicrofrontendPlatformHost.start({
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

      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param', undefined)});
      await expectEmissions(observeCaptor).toEqual(new Map());
    });

    it('should allow issuing an intent without passing optional parameters', async () => {
      await MicrofrontendPlatformHost.start({
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
      await MicrofrontendPlatformHost.start({
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
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')})).toReject(/\[IntentParamValidationError].*missingParams=\[param2]/);
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param2', 'value2')})).toReject(/\[IntentParamValidationError].*missingParams=\[param1]/);
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1').set('param2', 'value2')})).toResolve();
    });

    it('should reject an intent if it includes non-specified parameter', async () => {
      await MicrofrontendPlatformHost.start({
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
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1').set('param2', 'value2')})).toReject(/\[IntentParamValidationError].*unexpectedParams=\[param2]/);
    });

    it('should map deprecated params to their substitutes, if declared', async () => {
      await MicrofrontendPlatformHost.start({
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
      const expectedLogMessage = `[DEPRECATION][4EAC5956] Application 'host-app' passes a deprecated parameter in the intent: 'param1'. Pass parameter 'param2' instead.`;
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual(jasmine.arrayContaining([expectedLogMessage]));
    });

    it('should make deprecated params optional', async () => {
      await MicrofrontendPlatformHost.start({
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
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability'})).toReject(/\[IntentParamValidationError].*missingParams=\[param3]/);

      // publish with param1
      await expectPromise(Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')})).toReject(/\[IntentParamValidationError].*missingParams=\[param3]/);

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
      await MicrofrontendPlatformHost.start({
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
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual([]);

      // publish with deprecated param 'param1'
      observeCaptor.reset();
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param1', 'value1')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param1', 'value1'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual([
        `[DEPRECATION][4EAC5956] Application 'host-app' passes a deprecated parameter in the intent: 'param1'. DEPRECATION NOTICE`,
      ]);

      // publish with deprecated param 'param2'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param2', 'value2')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param5', 'value2'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual([
        `[DEPRECATION][4EAC5956] Application 'host-app' passes a deprecated parameter in the intent: 'param2'. Pass parameter 'param5' instead. DEPRECATION NOTICE`,
      ]);

      // publish with deprecated param 'param3'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param3', 'value3')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param5', 'value3'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual([
        `[DEPRECATION][4EAC5956] Application 'host-app' passes a deprecated parameter in the intent: 'param3'. Pass parameter 'param5' instead.`,
      ]);

      // publish with deprecated param 'param4'
      observeCaptor.reset();
      resetLoggerSpy('warn');
      await Beans.get(IntentClient).publish({type: 'capability', params: new Map().set('param4', 'value4')});
      await expectEmissions(observeCaptor).toEqual(new Map().set('param4', 'value4'));
      expect(readConsoleLog('warn', {filter: /\[DEPRECATION]\[4EAC5956]/})).toEqual([
        `[DEPRECATION][4EAC5956] Application 'host-app' passes a deprecated parameter in the intent: 'param4'.`,
      ]);
    });

    it('should validate params before intent interception', async () => {
      let intercepted = false;

      // Register interceptor
      Beans.register(IntentInterceptor, {
        multi: true,
        useValue: new class implements IntentInterceptor {
          public intercept(intent: IntentMessage, next: Handler<IntentMessage>): Promise<void> {
            intercepted = true;
            return next.handle(intent);
          }
        },
      });

      // Start the platform
      await MicrofrontendPlatformHost.start({
        host: {
          manifest: {
            name: 'Host Application',
            capabilities: [
              {
                type: 'capability',
                params: [{name: 'param', required: true}],
              },
            ],
          },
        },
        applications: [],
      });

      // Publish intent without passing required param.
      await expectAsync(Beans.get(IntentClient).publish({type: 'capability'})).toBeRejectedWithError(/IntentParamValidationError/);
      expect(intercepted).toBeFalse();
    });
  });

  describe('topic-based messaging', () => {

    it('should not error if no subscriber is found', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      // Send message.
      const whenPublished = Beans.get(MessageClient).publish('myhome/temperature/kitchen', '20°C');
      await expectAsync(whenPublished).toBeResolved();
    });

    it('should error if publish topic is "empty", "null" or "undefined"', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(MessageClient).publish('')).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish(null)).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish(undefined)).toBeRejectedWithError(/IllegalTopicError/);
    });

    it('should error if publish topic contains empty segments', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(MessageClient).publish('/myhome/kitchen/')).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish('/myhome/kitchen')).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish('myhome/kitchen/')).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish('/myhome//temperature')).toBeRejectedWithError(/IllegalTopicError/);
      await expectAsync(Beans.get(MessageClient).publish('/')).toBeRejectedWithError(/IllegalTopicError/);
    });

    it('should error if publish topic contains wildcard segments', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(MessageClient).publish('myhome/:room/temperature')).toBeRejectedWithError(/IllegalTopicError/);
    });

    it('should error if observe topic is "empty", "null" or "undefined"', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor1 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      expect(captor1.getError()).toMatch(/IllegalTopicError/);

      const captor2 = new ObserveCaptor();
      Beans.get(MessageClient).observe$(null).subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      expect(captor2.getError()).toMatch(/IllegalTopicError/);

      const captor3 = new ObserveCaptor();
      Beans.get(MessageClient).observe$(undefined).subscribe(captor3);
      await captor3.waitUntilCompletedOrErrored();
      expect(captor3.getError()).toMatch(/IllegalTopicError/);
    });

    it('should error if observe topic contains empty segments', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor1 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('/myhome/kitchen/').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      expect(captor1.getError()).toMatch(/IllegalTopicError/);

      const captor2 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('/myhome/kitchen').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      expect(captor2.getError()).toMatch(/IllegalTopicError/);

      const captor3 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('myhome/kitchen/').subscribe(captor3);
      await captor3.waitUntilCompletedOrErrored();
      expect(captor3.getError()).toMatch(/IllegalTopicError/);

      const captor4 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('/myhome//temperature').subscribe(captor4);
      await captor4.waitUntilCompletedOrErrored();
      expect(captor4.getError()).toMatch(/IllegalTopicError/);

      const captor5 = new ObserveCaptor();
      Beans.get(MessageClient).observe$('/').subscribe(captor5);
      await captor5.waitUntilCompletedOrErrored();
      expect(captor5.getError()).toMatch(/IllegalTopicError/);
    });

    it('should error if subscriber count topic is empty', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor1 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      expect(captor1.getError()).toMatch(/IllegalTopicError/);

      const captor2 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$(null).subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      expect(captor2.getError()).toMatch(/IllegalTopicError/);

      const captor3 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$(undefined).subscribe(captor3);
      await captor3.waitUntilCompletedOrErrored();
      expect(captor3.getError()).toMatch(/IllegalTopicError/);
    });

    it('should error if subscriber count topic contains empty segments', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor1 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('/myhome/kitchen/').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      expect(captor1.getError()).toMatch(/IllegalTopicError/);

      const captor2 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('/myhome/kitchen').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      expect(captor2.getError()).toMatch(/IllegalTopicError/);

      const captor3 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('myhome/kitchen/').subscribe(captor3);
      await captor3.waitUntilCompletedOrErrored();
      expect(captor3.getError()).toMatch(/IllegalTopicError/);

      const captor4 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('/myhome//temperature').subscribe(captor4);
      await captor4.waitUntilCompletedOrErrored();
      expect(captor4.getError()).toMatch(/IllegalTopicError/);

      const captor5 = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('/').subscribe(captor5);
      await captor5.waitUntilCompletedOrErrored();
      expect(captor5.getError()).toMatch(/IllegalTopicError/);
    });

    it('should error if subscriber count topic contains wildcard segments', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor = new ObserveCaptor();
      Beans.get(MessageClient).subscriberCount$('myhome/:room/temperature').subscribe(captor);
      await captor.waitUntilCompletedOrErrored();
      expect(captor.getError()).toMatch(/IllegalTopicError/);
    });

    describe('request', () => {

      it('should error if request topic is empty', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor1 = new ObserveCaptor();
        Beans.get(MessageClient).request$('').subscribe(captor1);
        await captor1.waitUntilCompletedOrErrored();
        expect(captor1.getError()).toMatch(/IllegalTopicError/);

        const captor2 = new ObserveCaptor();
        Beans.get(MessageClient).request$(null).subscribe(captor2);
        await captor2.waitUntilCompletedOrErrored();
        expect(captor2.getError()).toMatch(/IllegalTopicError/);

        const captor3 = new ObserveCaptor();
        Beans.get(MessageClient).request$(undefined).subscribe(captor3);
        await captor3.waitUntilCompletedOrErrored();
        expect(captor3.getError()).toMatch(/IllegalTopicError/);
      });

      it('should error if request topic contains empty segments', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor1 = new ObserveCaptor();
        Beans.get(MessageClient).request$('/myhome/kitchen/').subscribe(captor1);
        await captor1.waitUntilCompletedOrErrored();
        expect(captor1.getError()).toMatch(/IllegalTopicError/);

        const captor2 = new ObserveCaptor();
        Beans.get(MessageClient).request$('/myhome/kitchen').subscribe(captor2);
        await captor2.waitUntilCompletedOrErrored();
        expect(captor2.getError()).toMatch(/IllegalTopicError/);

        const captor3 = new ObserveCaptor();
        Beans.get(MessageClient).request$('myhome/kitchen/').subscribe(captor3);
        await captor3.waitUntilCompletedOrErrored();
        expect(captor3.getError()).toMatch(/IllegalTopicError/);

        const captor4 = new ObserveCaptor();
        Beans.get(MessageClient).request$('/myhome//temperature').subscribe(captor4);
        await captor4.waitUntilCompletedOrErrored();
        expect(captor4.getError()).toMatch(/IllegalTopicError/);

        const captor5 = new ObserveCaptor();
        Beans.get(MessageClient).request$('/').subscribe(captor5);
        await captor5.waitUntilCompletedOrErrored();
        expect(captor5.getError()).toMatch(/IllegalTopicError/);
      });

      it('should error if request topic contains wildcard segments', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor = new ObserveCaptor();
        Beans.get(MessageClient).request$('myhome/:room/temperature').subscribe(captor);
        await captor.waitUntilCompletedOrErrored();
        expect(captor.getError()).toMatch(/IllegalTopicError/);
      });

      it('should error if no replier is found', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send request.
        const responseCaptor = new ObserveCaptor();
        Beans.get(MessageClient).request$('myhome/temperature/kitchen').subscribe(responseCaptor);

        // Expect the request to error.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.hasErrored()).toBeTrue();
        expect(responseCaptor.getError()).toMatch(/\[MessagingError].*No subscriber registered to answer the request/);
      });
    });

    describe('retained message', () => {

      it('should not error if no subscriber is found', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send intent.
        const whenPublished = Beans.get(MessageClient).publish('myhome/temperature/kitchen', '20°C', {retain: true});
        await expectAsync(whenPublished).toBeResolved();
      });

      it('should receive retained messages matching an exact subscription', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Publish retained messages
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '20°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '19.5°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/diningroom/temperature', '21°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/diningroom/temperature', '21.5°C', {retain: true});

        // Subscribe to topic 'myhome/kitchen/temperature'
        const messageCaptor1 = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/kitchen/temperature').subscribe(messageCaptor1);
        await waitUntilSubscriberCount('myhome/kitchen/temperature', 1);
        expect(messageCaptor1.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/kitchen/temperature',
            body: '19.5°C',
            params: new Map(),
          }),
        ]));

        // Subscribe to topic 'myhome/livingroom/temperature'
        const messageCaptor2 = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCaptor2);
        await waitUntilSubscriberCount('myhome/livingroom/temperature', 1);
        expect(messageCaptor2.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/livingroom/temperature',
            body: '22°C',
            params: new Map(),
          }),
        ]));

        // Subscribe to topic 'myhome/diningroom/temperature'
        const messageCaptor3 = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/diningroom/temperature').subscribe(messageCaptor3);
        await waitUntilSubscriberCount('myhome/diningroom/temperature', 1);
        expect(messageCaptor3.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/diningroom/temperature',
            body: '21.5°C',
            params: new Map(),
          }),
        ]));
      });

      it('should receive retained messages matching a wildcard subscription', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const messageCaptor = new ObserveCaptor();

        // Publish retained messages
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '20°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '19.5°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/diningroom/temperature', '21°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/diningroom/temperature', '21.5°C', {retain: true});

        // Subscribe to topic 'myhome/:room/temperature'
        Beans.get(MessageClient).observe$<string>('myhome/:room/temperature').subscribe(messageCaptor);
        await waitUntilStable(() => messageCaptor.getValues().length);
        expect(messageCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/livingroom/temperature',
            body: '22°C',
            params: jasmine.mapContaining(new Map().set('room', 'livingroom')),
          }),
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/kitchen/temperature',
            body: '19.5°C',
            params: jasmine.mapContaining(new Map().set('room', 'kitchen')),
          }),
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/diningroom/temperature',
            body: '21.5°C',
            params: jasmine.mapContaining(new Map().set('room', 'diningroom')),
          }),
        ]));
      });

      it('should delete retained message', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Publish retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});
        await Beans.get(MessageClient).publish('myhome/kitchen/temperature', '20°C', {retain: true});

        // Delete retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', undefined, {retain: true});

        // Subscribe to topic 'myhome/livingroom/temperature'
        const messageCaptor1 = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCaptor1);
        await waitUntilSubscriberCount('myhome/livingroom/temperature', 1);
        expect(messageCaptor1.getValues()).toEqual([]);

        // Subscribe to topic 'myhome/kitchen/temperature'
        const messageCaptor2 = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/kitchen/temperature').subscribe(messageCaptor2);
        await waitUntilSubscriberCount('myhome/kitchen/temperature', 1);
        expect(messageCaptor2.getValues()).toEqual([
          jasmine.objectContaining({
            topic: 'myhome/kitchen/temperature',
            body: '20°C',
            params: new Map(),
          }),
        ]);
      });

      it('should not delete retained message if sending `null` payload', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Publish retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});

        // Publish retained message with `null` payload
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', null, {retain: true});

        // Subscribe to topic 'myhome/livingroom/temperature'
        const messageCaptor = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCaptor);
        await waitUntilSubscriberCount('myhome/livingroom/temperature', 1);
        expect(messageCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/livingroom/temperature',
            body: null,
            params: new Map(),
          }),
        ]));
      });

      it('should not delete retained message if sending `falsy` payload', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Publish retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});

        // Publish retained message with `0` payload
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', 0, {retain: true});

        // Subscribe to topic 'myhome/livingroom/temperature'
        const messageCaptor = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCaptor);
        await waitUntilSubscriberCount('myhome/livingroom/temperature', 1);
        expect(messageCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/livingroom/temperature',
            body: 0,
            params: new Map(),
          }),
        ]));
      });

      it('should not dispatch retained message deletion event', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Publish retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', '22°C', {retain: true});

        // Subscribe to topic 'myhome/livingroom/temperature'
        const messageCaptor = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('myhome/livingroom/temperature').subscribe(messageCaptor);
        await waitUntilSubscriberCount('myhome/livingroom/temperature', 1);
        expect(messageCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/livingroom/temperature',
            body: '22°C',
            params: new Map(),
          }),
        ]));

        messageCaptor.reset();

        // Delete retained message
        await Beans.get(MessageClient).publish('myhome/livingroom/temperature', undefined, {retain: true});
        expect(messageCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([]));
      });

      it('should dispatch a retained message only to the newly subscribed subscriber', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

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

      it('should deliver headers in retained message', async () => {
        await MicrofrontendPlatformHost.start({
          host: {symbolicName: 'host-app'},
          applications: [],
        });

        await waitUntilStable(() => Beans.get(ClientRegistry).getByApplication('host-app').length);
        const senderClientId = Beans.get(ClientRegistry).getByApplication('host-app')[0].id;

        await Beans.get(MessageClient).publish('temperature', '18°C', {retain: true, headers: new Map().set('room', 'livingroom')});

        const captor = new ObserveCaptor();
        Beans.get(MessageClient).observe$<string>('temperature').subscribe(captor);

        await waitUntilStable(() => captor.getValues().length);
        expect(captor.getValues()).toEqual([
          jasmine.objectContaining<TopicMessage>({
            topic: 'temperature',
            body: '18°C',
            headers: jasmine.mapContaining(new Map()
              .set('room', 'livingroom')
              .set(MessageHeaders.AppSymbolicName, 'host-app')
              .set(MessageHeaders.ClientId, senderClientId),
            ),
          }),
        ]);
      });
    });

    describe('retained request', () => {

      it('should not error if no replier is found', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send request.
        const responseCaptor = new ObserveCaptor();
        Beans.get(MessageClient).request$('myhome/temperature/kitchen', undefined, {retain: true}).subscribe(responseCaptor);

        // Expect the request not to error.
        await waitFor(100);
        expect(responseCaptor.hasErrored()).toBeFalse();
      });

      it('should deliver retained request to late subscribers', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/livingroom/temperature', undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(MessageClient).onMessage('myhome/livingroom/temperature', () => '20°C');

        // Expect the request to be answered.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['20°C']);
      });

      it('should not replace retained request by later retained request', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request.
        const responseCaptor1 = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/temperature', 'kitchen', {retain: true, headers: new Map().set('temperature', '20°C')}).subscribe(responseCaptor1);

        const responseCaptor2 = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/temperature', 'livingroom', {retain: true, headers: new Map().set('temperature', '21°C')}).subscribe(responseCaptor2);

        const responseCaptor3 = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/temperature', 'livingroom', {retain: true, headers: new Map().set('temperature', '22°C')}).subscribe(responseCaptor3);

        const responseCaptor4 = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/temperature', 'livingroom', {retain: true, headers: new Map().set('temperature', '22°C')}).subscribe(responseCaptor4);

        // Send retained message to the same topic.
        await Beans.get(MessageClient).publish('myhome/temperature', 'basement', {retain: true, headers: new Map().set('temperature', '18°C')});

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(MessageClient).onMessage('myhome/temperature', request => `${request.body}: ${request.headers.get('temperature')}`);

        // Expect the request to be answered.
        await responseCaptor1.waitUntilCompletedOrErrored();
        expect(responseCaptor1.getValues()).toEqual(['kitchen: 20°C']);

        await responseCaptor2.waitUntilCompletedOrErrored();
        expect(responseCaptor2.getValues()).toEqual(['livingroom: 21°C']);

        await responseCaptor3.waitUntilCompletedOrErrored();
        expect(responseCaptor3.getValues()).toEqual(['livingroom: 22°C']);

        await responseCaptor4.waitUntilCompletedOrErrored();
        expect(responseCaptor4.getValues()).toEqual(['livingroom: 22°C']);

        const requestCaptor = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/temperature').subscribe(requestCaptor);

        // Expect retained requests not to be received anymore because above request-response communications have been completed.
        // However, we should still receive the retained message sent to the same topic.
        await requestCaptor.waitUntilEmitCount(1);
        expect(requestCaptor.getValues()).toEqual([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/temperature',
            body: 'basement',
            headers: jasmine.mapContaining(new Map().set('temperature', '18°C')),
          }),
        ]);
      });

      it('should not replace retained request by later retained message', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/temperature', 'kitchen', {retain: true, headers: new Map().set('temperature', '20°C')}).subscribe(responseCaptor);

        // Send retained message to the same topic.
        await Beans.get(MessageClient).publish('myhome/temperature', 'basement', {retain: true, headers: new Map().set('temperature', '18°C')});

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(MessageClient).onMessage('myhome/temperature', request => `${request.body}: ${request.headers.get('temperature')}`);

        // Expect the request to be answered.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['kitchen: 20°C']);
      });

      it('should delete retained request when the replier terminates the communication', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Reply to the request with 20°C.
        const latch = new Latch();
        const replier$ = new Subject<string>();
        Beans.get(MessageClient).onMessage('myhome/kitchen/temperature', () => {
          latch.release();
          return replier$;
        });
        await latch.whenRelesed;
        replier$.next('20°C');

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(1);
        expect(responseCaptor.getValues()).toEqual(['20°C']);

        // Expect the retained request still to be received.
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/:room/temperature').subscribe(requestCaptor1);
        await requestCaptor1.waitUntilEmitCount(1);
        expect(requestCaptor1.getValues()).toEqual([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/kitchen/temperature',
            params: jasmine.mapContaining(new Map().set('room', 'kitchen')),
          }),
        ]);

        // Reply to the request with 21°C.
        replier$.next('21°C');

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(2);
        expect(responseCaptor.getValues()).toEqual(['20°C', '21°C']);

        // Expect the retained request still to be received.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature').subscribe(requestCaptor2);
        await requestCaptor2.waitUntilEmitCount(1);
        expect(requestCaptor2.getValues()).not.toEqual([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/kitchen/temperature',
            params: jasmine.mapContaining(new Map().set('room', 'kitchen')),
          }),
        ]);
        expect(requestCaptor2.getValues()).toEqual([
          jasmine.objectContaining<TopicMessage>({
            topic: 'myhome/kitchen/temperature',
          }),
        ]);

        // Terminate the communication by completing the replier's Observable.
        replier$.complete();

        // Expect the communication to be terminated.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['20°C', '21°C']);
        expect(responseCaptor.hasCompleted()).toBeTrue();

        // Expect the retained request to be deleted.
        const requestCaptor3 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature').subscribe(requestCaptor2);
        await waitUntilStable(() => requestCaptor3.getValues().length);
        expect(requestCaptor3.getValues()).toEqual([]);
      });

      it('should delete retained request when the requestor unsubscribes before receiving a reply', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        const subscription = Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe(responseCaptor);
        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Expect the retained request still to be received.
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature').subscribe(requestCaptor1);
        await requestCaptor1.waitUntilEmitCount(1);
        expect(requestCaptor1.getValues()).toEqual([jasmine.objectContaining<TopicMessage>({topic: 'myhome/kitchen/temperature'})]);

        // Unsubscribe the requestor.
        subscription.unsubscribe();

        // Wait some time until unsubscribed.
        await waitFor(100);

        // Expect the retained request to be deleted.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature').subscribe(requestCaptor2);
        await waitUntilStable(() => requestCaptor2.getValues().length);
        expect(requestCaptor2.getValues()).toEqual([]);
      });

      it('should delete retained request when the requestor unsubscribes after received a reply', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        const subscription = Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Respond to the request but do not terminate the communication.
        Beans.get(MessageClient).onMessage('myhome/kitchen/temperature', () => concat(of('20°C'), NEVER)); // never terminates the communication

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(1);
        expect(responseCaptor.getValues()).toEqual(['20°C']);

        // Wait some time.
        await waitFor(100);

        // Expect the retained request still to be received
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature').subscribe(requestCaptor1);
        await waitUntilStable(() => requestCaptor1.getValues().length);
        expect(requestCaptor1.getValues()).toEqual([jasmine.objectContaining<TopicMessage>({topic: 'myhome/kitchen/temperature'})]);

        // Unsubscribe the requestor.
        subscription.unsubscribe();

        // Wait some time until unsubscribed.
        await waitFor(100);

        // Expect the retained request to be deleted.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/kitchen/temperature1').subscribe(requestCaptor2);
        await waitUntilStable(() => requestCaptor2.getValues().length);
        expect(requestCaptor2.getValues()).toEqual([]);
      });

      it('should not delete previous retained request when sending a retained request without payload', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        // Send retained request
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe(responseCaptor);

        // Send retained request without payload
        Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe();

        // Expect the retained request not to be deleted.
        const requestCaptor = new ObserveCaptor();
        Beans.get(MessageClient).observe$('myhome/:room/temperature').subscribe(requestCaptor);
        await requestCaptor.waitUntilEmitCount(2);
        expect(requestCaptor.getValues()).toHaveSize(2);
      });

      it('should receive request by multiple subscribers', async () => {
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({name: 'App 1'}).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({name: 'App 2'}).serve(),
            },
          ],
        });

        // Send retained request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(MessageClient).request$('myhome/kitchen/temperature', undefined, {retain: true}).subscribe(responseCaptor);

        // Mount microfrontend of app 1.
        const microfrontendApp1 = registerFixture(new MicrofrontendFixture());
        await microfrontendApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToTopic', {symbolicName: 'app1', topic: 'myhome/kitchen/temperature'});
        const requestCaptorApp1 = new ObserveCaptor();
        microfrontendApp1.message$.subscribe(requestCaptorApp1);

        // Mount microfrontend of app 2.
        const microfrontendApp2 = registerFixture(new MicrofrontendFixture());
        await microfrontendApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToTopic', {symbolicName: 'app2', topic: 'myhome/kitchen/temperature'});
        const requestCaptorApp2 = new ObserveCaptor();
        microfrontendApp2.message$.subscribe(requestCaptorApp2);

        // Expect the retained request to be received in app 1.
        await requestCaptorApp1.waitUntilEmitCount(1);
        expect(requestCaptorApp1.getValues()).toEqual([jasmine.objectContaining<TopicMessage>({topic: 'myhome/kitchen/temperature'})]);

        // Expect the retained request to be received in app 2.
        await requestCaptorApp2.waitUntilEmitCount(1);
        expect(requestCaptorApp2.getValues()).toEqual([jasmine.objectContaining<TopicMessage>({topic: 'myhome/kitchen/temperature'})]);
      });
    });
  });

  describe('intent-based messaging', () => {

    it('should error if no application provides a fulfilling capability', async () => {
      await MicrofrontendPlatformHost.start({
        host: {
          manifest: {
            name: 'Host App',
            intentions: [
              {type: 'temperature', qualifier: {room: 'kitchen'}},
            ],
          },
        },
        applications: [],
      });

      // Send intent.
      const whenPublished = Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C');
      await expectAsync(whenPublished).toBeRejectedWithError(/NullProviderError/);
    });

    it('should not error if no subscriber is found', async () => {
      await MicrofrontendPlatformHost.start({
        host: {
          manifest: {
            name: 'Host Application',
            intentions: [
              {type: 'temperature', qualifier: {room: 'kitchen'}},
            ],
          },
        },
        applications: [
          {
            symbolicName: 'app1',
            manifestUrl: new ManifestFixture({name: 'App 1', capabilities: [{type: 'temperature', qualifier: {room: 'kitchen'}, private: false}]}).serve(),
          },
        ],
      });

      // Send intent.
      const whenPublished = Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C');
      await expectAsync(whenPublished).toBeResolved();
    });

    it('should error if publish qualifier contains wildcards', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: '*'}})).toBeRejectedWithError(/IllegalQualifierError/);
      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {'*': '*'}})).toBeRejectedWithError(/IllegalQualifierError/);
    });

    it('should error if publish qualifier contains entries with an illegal data type', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: {} as any}})).toBeRejectedWithError(/IllegalQualifierError/);
    });

    it('should error if publish qualifier contains empty entries', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: ''}})).toBeRejectedWithError(/IllegalQualifierError/);
      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: null}})).toBeRejectedWithError(/IllegalQualifierError/);
      await expectAsync(Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: undefined}})).toBeRejectedWithError(/IllegalQualifierError/);
    });

    it('should error if observe qualifier contains entries with an illegal data type', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor = new ObserveCaptor();
      Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: {} as any}}).subscribe(captor);
      await captor.waitUntilCompletedOrErrored();
      expect(captor.getError()).toMatch(/IllegalQualifierError/);
    });

    it('should error if observe qualifier contains empty entries', async () => {
      await MicrofrontendPlatformHost.start({applications: []});

      const captor1 = new ObserveCaptor();
      Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: ''}}).subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      expect(captor1.getError()).toMatch(/IllegalQualifierError/);

      const captor2 = new ObserveCaptor();
      Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: null}}).subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      expect(captor2.getError()).toMatch(/IllegalQualifierError/);

      const captor3 = new ObserveCaptor();
      Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: undefined}}).subscribe(captor3);
      await captor3.waitUntilCompletedOrErrored();
      expect(captor3.getError()).toMatch(/IllegalQualifierError/);
    });

    describe('intent request', () => {

      it('should error if request qualifier contains wildcards', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor1 = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: '*'}}).subscribe(captor1);
        await captor1.waitUntilCompletedOrErrored();
        expect(captor1.getError()).toMatch(/IllegalQualifierError/);

        const captor2 = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {'*': '*'}}).subscribe(captor2);
        await captor2.waitUntilCompletedOrErrored();
        expect(captor2.getError()).toMatch(/IllegalQualifierError/);
      });

      it('should error if request qualifier contains entries with an illegal data type', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: {} as any}}).subscribe(captor);
        await captor.waitUntilCompletedOrErrored();
        expect(captor.getError()).toMatch(/IllegalQualifierError/);
      });

      it('should error if request qualifier contains empty entries', async () => {
        await MicrofrontendPlatformHost.start({applications: []});

        const captor1 = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: ''}}).subscribe(captor1);
        await captor1.waitUntilCompletedOrErrored();
        expect(captor1.getError()).toMatch(/IllegalQualifierError/);

        const captor2 = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: null}}).subscribe(captor2);
        await captor2.waitUntilCompletedOrErrored();
        expect(captor2.getError()).toMatch(/IllegalQualifierError/);

        const captor3 = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: undefined}}).subscribe(captor3);
        await captor3.waitUntilCompletedOrErrored();
        expect(captor3.getError()).toMatch(/IllegalQualifierError/);
      });

      it('should error if no application provides a fulfilling capability', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host Application',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(responseCaptor);

        // Expect the request to error.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.hasErrored()).toBeTrue();
        expect(responseCaptor.getError()).toMatch(/NullProviderError/);
      });

      it('should error if no replier is found', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host Application',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({name: 'App 1', capabilities: [{type: 'temperature', qualifier: {room: 'kitchen'}, private: false}]}).serve(),
            },
          ],
        });

        // Send intent request.
        const responseCaptor = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(responseCaptor);

        // Expect the request to error.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.hasErrored()).toBeTrue();
        expect(responseCaptor.getError()).toMatch(/\[MessagingError].*No subscriber registered to answer the intent/);
      });
    });

    describe('retained intent', () => {

      it('should error if no application provides a fulfilling capability', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent.
        const whenPublished = Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C', {retain: true});
        await expectAsync(whenPublished).toBeRejectedWithError(/NullProviderError/);
      });

      it('should not error if no subscriber is found', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host Application',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({name: 'App 1', capabilities: [{type: 'temperature', qualifier: {room: 'kitchen'}, private: false}]}).serve(),
            },
          ],
        });

        // Send intent.
        const whenPublished = Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C', {retain: true});
        await expectAsync(whenPublished).toBeResolved();
      });

      it('should receive retained intents matching an exact subscription', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
                {type: 'temperature', qualifier: {room: 'kitchen'}},
                {type: 'temperature', qualifier: {room: 'diningroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intents
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '19.5°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'diningroom'}}, '21°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'diningroom'}}, '21.5°C', {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'kitchen'}}
        const intentCaptor1 = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(intentCaptor1);
        await waitUntilStable(() => intentCaptor1.getValues().length);
        expect(intentCaptor1.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
            body: '19.5°C',
          }),
        ]);

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor2 = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor2);
        await waitUntilStable(() => intentCaptor2.getValues().length);
        expect(intentCaptor2.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '22°C',
          }),
        ]);

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'diningroom'}}
        const intentCaptor3 = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'diningroom'}}).subscribe(intentCaptor3);
        await waitUntilStable(() => intentCaptor3.getValues().length);
        expect(intentCaptor3.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'diningroom'}, params: new Map()},
            body: '21.5°C',
          }),
        ]);
      });

      it('should receive retained intents matching a wildcard subscription', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
                {type: 'temperature', qualifier: {room: 'kitchen'}},
                {type: 'temperature', qualifier: {room: 'diningroom'}},
              ],
            },
          },
          applications: [],
        });

        const intentCaptor = new ObserveCaptor();

        // Publish retained intents
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '19.5°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'diningroom'}}, '21°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'diningroom'}}, '21.5°C', {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: '*'}}
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: '*'}}).subscribe(intentCaptor);

        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '22°C',
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
            body: '19.5°C',
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'diningroom'}, params: new Map()},
            body: '21.5°C',
          }),
        ]));
      });

      it('should delete retained intent', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'kitchen'}}, '20°C', {retain: true});

        // Delete retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, undefined, {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor1 = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor1);
        await waitUntilStable(() => intentCaptor1.getValues().length);
        expect(intentCaptor1.getValues()).toEqual([]);

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'kitchen'}}
        const intentCaptor2 = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(intentCaptor2);
        await waitUntilStable(() => intentCaptor2.getValues().length);
        expect(intentCaptor2.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
            body: '20°C',
          }),
        ]);
      });

      it('should not delete retained intent if sending `null` payload', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});

        // Publish retained intent with `null` payload
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, null, {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor);
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: null,
          }),
        ]);
      });

      it('should not delete retained intent if sending `falsy` payload', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});

        // Publish retained intent with a `falsy` payload
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, 0, {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor);
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: 0,
          }),
        ]);
      });

      it('should not dispatch retained intent deletion event', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor);
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '22°C',
          }),
        ]);

        intentCaptor.reset();

        // Delete retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, undefined, {retain: true});
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([]);
      });

      it('should delete retained intent(s) when unregistering associated capability', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '22°C', {retain: true});

        // Unregister the capability
        await Beans.get(ManifestService).unregisterCapabilities({type: 'temperature', qualifier: {room: 'livingroom'}});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor);

        // Expect the intent not to be received.
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([]);
      });

      it('should dispatch a retained intent only to the newly subscribed subscriber', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        const intentCaptor1 = new ObserveCaptor();
        const intentCaptor2 = new ObserveCaptor();
        const intentCaptor3 = new ObserveCaptor();
        const intentCaptor4 = new ObserveCaptor();
        const intentCaptor5 = new ObserveCaptor();

        // Subscribe before publishing the retained intent
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor1);
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: '*'}}).subscribe(intentCaptor2);

        // Publish the retained intent
        await Beans.get(IntentClient).publish({type: 'temperature', qualifier: {room: 'livingroom'}}, '25°C', {retain: true});

        await waitUntilStable(() => intentCaptor1.getValues().length);
        expect(intentCaptor1.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);
        expect(intentCaptor2.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);

        // Subscribe after publishing the retained intent
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor3);
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: '*'}}).subscribe(intentCaptor4);
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(intentCaptor5);

        // Expect subscriber 1 not to receive the intent again
        await waitUntilStable(() => intentCaptor1.getValues().length);
        expect(intentCaptor1.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);
        // Expect subscriber 2 not to receive the intent again
        await waitUntilStable(() => intentCaptor2.getValues().length);
        expect(intentCaptor2.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);
        // Expect subscriber 3 to receive the retained intent
        await waitUntilStable(() => intentCaptor3.getValues().length);
        expect(intentCaptor3.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);
        // Expect subscriber 4 to receive the retained intent
        await waitUntilStable(() => intentCaptor4.getValues().length);
        expect(intentCaptor4.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '25°C',
          }),
        ]);
        // Expect subscriber 5 not to receive the retained intent
        await waitUntilStable(() => intentCaptor5.getValues().length);
        expect(intentCaptor5.getValues()).toEqual([]);
      });

      it('should deliver headers in retained intent', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            symbolicName: 'host-app',
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature'},
              ],
            },
          },
          applications: [],
        });

        await waitUntilStable(() => Beans.get(ClientRegistry).getByApplication('host-app').length);
        const senderClientId = Beans.get(ClientRegistry).getByApplication('host-app')[0].id;

        await Beans.get(IntentClient).publish({type: 'temperature'}, '22°C', {retain: true, headers: new Map().set('room', 'livingroom')});

        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature'}).subscribe(intentCaptor);
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map()},
            body: '22°C',
            headers: jasmine.mapContaining(new Map()
              .set('room', 'livingroom')
              .set(MessageHeaders.AppSymbolicName, 'host-app')
              .set(MessageHeaders.ClientId, senderClientId),
            ),
          }),
        ]);
      });

      it('should receive the latest intent per capability which the application is qualified to receive (1/4)', async () => {
        // Two applications provide both the same public capability but declare no intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent sent by app 1
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '20°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 to receive retained intent sent by app 2
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      }, 10_000);

      it('should receive the latest intent per capability which the application is qualified to receive (2/4)', async () => {
        // Two applications provide both the same public capability and declare an intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent sent by app 2
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 to receive retained intent sent by app 2
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      }, 10_000);

      it('should receive the latest intent per capability which the application is qualified to receive (3/4)', async () => {
        // Two applications provide both the same private capability and declare an intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: true},
                ],
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: true},
                ],
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent sent by app 1
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '20°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 to receive retained intent sent by app 2
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      }, 10_000);

      it('should receive the latest intent per capability which the application is qualified to receive (4/4)', async () => {
        // Two applications provide both the same capability, but with different visiblity.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: true},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app3',
              manifestUrl: new ManifestFixture({
                name: 'App 3',
                intentions: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app3
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app3',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '22°C',
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent sent by app 1
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '20°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 to receive retained intent sent by app 3
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '22°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app3')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      }, 10_000);

      it('should delete retained intent per qualified capability (1/2)', async () => {
        // Two applications provide both the same capability with private visiblity
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Delete intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: undefined,
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 not to receive retained intent because deleted
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([]);

        // Expect app2 to still receive retained intent sent by app 2
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      });

      it('should delete retained intent per qualified capability (2/2)', async () => {
        // Two applications provide both the same capability with public visiblity
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Publish retained intent in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '21°C',
          options: {retain: true} as PublishOptions,
        });

        // Delete intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: undefined,
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 not to receive retained intent because deleted
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([]);

        // Expect app2 to still receive retained intent sent by app 2
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '21°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      });

      it('should not receive retained intent if not qualified to receive', async () => {
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
              }).serve(),
            },
          ],
        });

        // Publish retained intent in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'publishIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          body: '20°C',
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            body: '20°C',
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 not to receive retained intent
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([]);
      });
    });

    describe('retained intent request', () => {

      it('should not error if no replier is found', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({name: 'App 1', capabilities: [{type: 'temperature', qualifier: {room: 'kitchen'}, private: false}]}).serve(),
            },
          ],
        });

        // Send request.
        const responseCaptor = new ObserveCaptor();
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Expect the request not to error.
        await waitFor(100);
        expect(responseCaptor.hasErrored()).toBeFalse();
      });

      it('should error if no application provides a fulfilling capability', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Expect the request to error.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.hasErrored()).toBeTrue();
        expect(responseCaptor.getError()).toMatch(/NullProviderError/);
      });

      it('should deliver retained intent request to late subscribers', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'livingroom'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(IntentClient).onIntent({type: 'temperature', qualifier: {room: 'livingroom'}}, () => '20°C');

        // Expect the request to be answered.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['20°C']);
      });

      it('should not replace retained intent request by later retained request', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', params: [{name: 'room', required: true}]},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor1 = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', params: new Map().set('room', 'kitchen')}, '20°C', {retain: true}).subscribe(responseCaptor1);

        const responseCaptor2 = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', params: new Map().set('room', 'livingroom')}, '21°C', {retain: true}).subscribe(responseCaptor2);

        const responseCaptor3 = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', params: new Map().set('room', 'livingroom')}, '22°C', {retain: true}).subscribe(responseCaptor3);

        const responseCaptor4 = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', params: new Map().set('room', 'livingroom')}, '22°C', {retain: true}).subscribe(responseCaptor4);

        // Send retained intent to the same destination.
        await Beans.get(IntentClient).publish({type: 'temperature', params: new Map().set('room', 'basement')}, '18°C', {retain: true});

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(IntentClient).onIntent({type: 'temperature'}, request => `${request.intent.params!.get('room')}: ${request.body}`);

        // Expect the request to be answered.
        await responseCaptor1.waitUntilCompletedOrErrored();
        expect(responseCaptor1.getValues()).toEqual(['kitchen: 20°C']);

        await responseCaptor2.waitUntilCompletedOrErrored();
        expect(responseCaptor2.getValues()).toEqual(['livingroom: 21°C']);

        await responseCaptor3.waitUntilCompletedOrErrored();
        expect(responseCaptor3.getValues()).toEqual(['livingroom: 22°C']);

        await responseCaptor4.waitUntilCompletedOrErrored();
        expect(responseCaptor4.getValues()).toEqual(['livingroom: 22°C']);

        // Expect retained intent requests not to be received anymore because above request-response communications have been completed.
        // However, we should still receive the retained intent sent to the same capability.
        const requestCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature'}).subscribe(requestCaptor);
        await requestCaptor.waitUntilEmitCount(1);
        expect(requestCaptor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            body: '18°C',
          }),
        ]);
      });

      it('should not replace retained intent request by later retained intent', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', params: [{name: 'room', required: true}]},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', params: new Map().set('room', 'kitchen')}, '20°C', {retain: true}).subscribe(responseCaptor);

        // Send retained intent to the same topic.
        await Beans.get(IntentClient).publish({type: 'temperature', params: new Map().set('room', 'basement')}, '18°C', {retain: true});

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Add late subscriber.
        Beans.get(IntentClient).onIntent({type: 'temperature'}, request => `${request.intent.params!.get('room')}: ${request.body}`);

        // Expect the request to be answered.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['kitchen: 20°C']);
      });

      it('should delete retained intent request when the replier terminates the communication', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Reply to the request with 20°C.
        const latch = new Latch();
        const replier$ = new Subject<string>();
        Beans.get(IntentClient).onIntent({type: 'temperature', qualifier: {room: 'kitchen'}}, () => {
          latch.release();
          return replier$;
        });
        await latch.whenRelesed;
        replier$.next('20°C');

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(1);
        expect(responseCaptor.getValues()).toEqual(['20°C']);

        // Expect the retained intent request still to be received.
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: '*'}}).subscribe(requestCaptor1);
        await requestCaptor1.waitUntilEmitCount(1);
        expect(requestCaptor1.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
          }),
        ]);

        // Reply to the request with 21°C.
        replier$.next('21°C');

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(2);
        expect(responseCaptor.getValues()).toEqual(['20°C', '21°C']);

        // Expect the retained intentrequest still to be received.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: '*'}}).subscribe(requestCaptor2);
        await waitUntilStable(() => requestCaptor2.getValues().length);
        expect(requestCaptor2.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
          }),
        ]);

        // Terminate the communication by completing the replier's Observable.
        replier$.complete();

        // Expect the communication to be terminated.
        await responseCaptor.waitUntilCompletedOrErrored();
        expect(responseCaptor.getValues()).toEqual(['20°C', '21°C']);
        expect(responseCaptor.hasCompleted()).toBeTrue();

        // Expect the retained intent request to be deleted.
        const requestCaptor3 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: '*'}}).subscribe(requestCaptor3);
        await waitUntilStable(() => requestCaptor3.getValues().length);
        expect(requestCaptor3.getValues()).toEqual([]);
      });

      it('should delete retained intent request when the requestor unsubscribes before receiving a reply', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        const subscription = Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);
        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Expect the retained intent request still to be received.
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(requestCaptor1);
        await waitUntilStable(() => requestCaptor1.getValues().length);
        expect(requestCaptor1.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()},
          }),
        ]);

        // Unsubscribe the requestor.
        subscription.unsubscribe();

        // Wait some time until unsubscribed.
        await waitFor(100);

        // Expect the retained intent request to be deleted.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(requestCaptor2);
        await waitUntilStable(() => requestCaptor2.getValues().length);
        expect(requestCaptor2.getValues()).toEqual([]);
      });

      it('should delete retained intent request when the requestor unsubscribes after received a reply', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        const subscription = Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Wait some time to simulate late subscriber.
        await waitFor(100);

        // Respond to the request but do not terminate the communication.
        Beans.get(IntentClient).onIntent({type: 'temperature', qualifier: {room: 'kitchen'}}, () => concat(of('20°C'), NEVER)); // never terminates the communication

        // Expect the response to be received.
        await responseCaptor.waitUntilEmitCount(1);
        expect(responseCaptor.getValues()).toEqual(['20°C']);

        // Wait some time.
        await waitFor(100);

        // Expect the retained intent request still to be received
        const requestCaptor1 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(requestCaptor1);
        await requestCaptor1.waitUntilEmitCount(1);
        expect(requestCaptor1.getValues()).toEqual([jasmine.objectContaining<IntentMessage>({intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()}})]);

        // Unsubscribe the requestor.
        subscription.unsubscribe();

        // Wait some time until unsubscribed.
        await waitFor(100);

        // Expect the retained intent request to be deleted.
        const requestCaptor2 = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: 'kitchen'}}).subscribe(requestCaptor2);

        // Wait some time until subscribed.
        await waitFor(100);
        expect(requestCaptor2.getValues()).toEqual([]);
      });

      it('should not delete previous retained intent request when sending a retained request without payload', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [],
        });

        // Send retained intent request
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, 'body', {retain: true}).subscribe(responseCaptor);

        // Send retained intent request without payload
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe();

        // Expect the retained request not to be deleted.
        const requestCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$({type: 'temperature', qualifier: {room: '*'}}).subscribe(requestCaptor);
        await requestCaptor.waitUntilEmitCount(2);
        expect(requestCaptor.getValues()).toHaveSize(2);
      });

      it('should delete retained intent request(s) when unregistering associated capability', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              capabilities: [
                {type: 'temperature', qualifier: {room: 'livingroom'}},
              ],
            },
          },
          applications: [],
        });

        // Publish retained intent
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'livingroom'}}, undefined, {retain: true}).subscribe();

        // Unregister the capability
        await Beans.get(ManifestService).unregisterCapabilities({type: 'temperature', qualifier: {room: 'livingroom'}});

        // Subscribe to intents {type: 'temperature', qualifier: {room: 'livingroom'}}
        const intentCaptor = new ObserveCaptor();
        Beans.get(IntentClient).observe$<string>({type: 'temperature', qualifier: {room: 'livingroom'}}).subscribe(intentCaptor);

        // Expect the intent not to be received.
        await waitUntilStable(() => intentCaptor.getValues().length);
        expect(intentCaptor.getValues()).toEqual([]);
      });

      it('should receive intent request by multiple subscribers', async () => {
        await MicrofrontendPlatformHost.start({
          host: {
            manifest: {
              name: 'Host App',
              intentions: [
                {type: 'temperature', qualifier: {room: 'kitchen'}},
              ],
            },
          },
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'kitchen'}, private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'kitchen'}, private: false},
                ],
              }).serve(),
            },
          ],
        });

        // Send retained intent request.
        const responseCaptor = new ObserveCaptor(bodyExtractFn);
        Beans.get(IntentClient).request$({type: 'temperature', qualifier: {room: 'kitchen'}}, undefined, {retain: true}).subscribe(responseCaptor);

        // Mount microfrontend of app 1.
        const microfrontendApp1 = registerFixture(new MicrofrontendFixture());
        await microfrontendApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1', intent: {type: 'temperature', qualifier: {room: 'kitchen'}}});
        const requestCaptorApp1 = new ObserveCaptor();
        microfrontendApp1.message$.subscribe(requestCaptorApp1);

        // Mount microfrontend of app 2.
        const microfrontendApp2 = registerFixture(new MicrofrontendFixture());
        await microfrontendApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2', intent: {type: 'temperature', qualifier: {room: 'kitchen'}}});
        const requestCaptorApp2 = new ObserveCaptor();
        microfrontendApp2.message$.subscribe(requestCaptorApp2);

        // Expect the retained intent request to be received in app 1.
        await requestCaptorApp1.waitUntilEmitCount(1);
        expect(requestCaptorApp1.getValues()).toEqual([jasmine.objectContaining<IntentMessage>({intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()}})]);

        // Expect the retained intent request to be received in app 2.
        await requestCaptorApp2.waitUntilEmitCount(1);
        expect(requestCaptorApp2.getValues()).toEqual([jasmine.objectContaining<IntentMessage>({intent: {type: 'temperature', qualifier: {room: 'kitchen'}, params: new Map()}})]);
      }, 10_000);

      it('should receive intent requests per capability which the application is qualified to receive (1/4)', async () => {
        // Two applications provide both the same public capability but declare no intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: false},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'livingroom')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'basement')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Receive intent requests in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intent requests in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent requests
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]));

        // Expect app2 to receive retained intent requests
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]);
      }, 10_000);

      it('should receive intent requests per capability which the application is qualified to receive (2/4)', async () => {
        // Two applications provide both the same public capability and declare an intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: false},
                ],
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: false},
                ],
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'livingroom')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'basement')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent requests
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]));

        // Expect app2 to receive retained intent requests
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]));
      }, 10_000);

      it('should receive intent requests per capability which the application is qualified to receive (3/4)', async () => {
        // Two applications provide both the same private capability and declare an intention.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: true},
                ],
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: true},
                ],
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'livingroom')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'basement')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent requests
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]));

        // Expect app2 to receive retained intent requests
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]));
      }, 10_000);

      it('should receive intent requests per capability which the application is qualified to receive (4/4)', async () => {
        // Two applications provide both the same capability, but with different visiblity.
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: true},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
                capabilities: [
                  {type: 'temperature', params: [{name: 'room', required: true}], private: false},
                ],
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app3',
              manifestUrl: new ManifestFixture({
                name: 'App 3',
                intentions: [
                  {type: 'temperature'},
                ],
              }).serve(),
            },
          ],
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'livingroom')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent request in app2
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app2',
          intent: {type: 'temperature', params: new Map().set('room', 'basement')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent in app3
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app3',
          intent: {type: 'temperature', params: new Map().set('room', 'basement')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent in app3
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app3',
          intent: {type: 'temperature', params: new Map().set('room', 'kitchen')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Publish retained intent in app3
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app3',
          intent: {type: 'temperature', params: new Map().set('room', 'livingroom')} as Intent,
          options: {retain: true} as RequestOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent requests
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual(jasmine.arrayWithExactContents([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]));

        // Expect app2 to receive retained intent requests
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual(jasmine.arrayContaining([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app2')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'basement')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app3')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'kitchen')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app3')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', params: new Map().set('room', 'livingroom')},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app3')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app2'})}),
          }),
        ]));
      }, 10_000);

      it('should not receive retained intent request if not qualified to receive', async () => {
        await MicrofrontendPlatformHost.start({
          applications: [
            {
              symbolicName: 'app1',
              manifestUrl: new ManifestFixture({
                name: 'App 1',
                capabilities: [
                  {type: 'temperature', qualifier: {room: 'livingroom'}, private: false},
                ],
              }).serve(),
            },
            {
              symbolicName: 'app2',
              manifestUrl: new ManifestFixture({
                name: 'App 2',
              }).serve(),
            },
          ],
        });

        // Publish retained intent request in app1
        await registerFixture(new MicrofrontendFixture()).insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'requestViaIntent', {
          symbolicName: 'app1',
          intent: {type: 'temperature', qualifier: {room: 'livingroom'}} as Intent,
          options: {retain: true} as PublishOptions,
        });

        // Receive intents in app1
        const intentApp1Captor = new ObserveCaptor();
        const receiveIntentApp1 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp1.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app1'});
        receiveIntentApp1.message$.subscribe(intentApp1Captor);

        // Receive intents in app2
        const intentApp2Captor = new ObserveCaptor();
        const receiveIntentApp2 = registerFixture(new MicrofrontendFixture());
        await receiveIntentApp2.insertIframe().loadScript('lib/client/messaging/messaging.script.ts', 'subscribeToIntent', {symbolicName: 'app2'});
        receiveIntentApp2.message$.subscribe(intentApp2Captor);

        // Expect app1 to receive retained intent
        await waitUntilStable(() => intentApp1Captor.getValues().length);
        expect(intentApp1Captor.getValues()).toEqual([
          jasmine.objectContaining<IntentMessage>({
            intent: {type: 'temperature', qualifier: {room: 'livingroom'}, params: new Map()},
            headers: jasmine.mapContaining(new Map().set(MessageHeaders.AppSymbolicName, 'app1')),
            capability: jasmine.objectContaining({metadata: jasmine.objectContaining({appSymbolicName: 'app1'})}),
          }),
        ]);

        // Expect app2 not to receive retained intent
        await waitUntilStable(() => intentApp2Captor.getValues().length);
        expect(intentApp2Captor.getValues()).toEqual([]);
      });
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
