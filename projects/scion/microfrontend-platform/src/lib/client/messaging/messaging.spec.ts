/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Beans } from '../../bean-manager';
import { PlatformMessageClient } from '../../host/platform-message-client';
import { first, publishReplay, timeoutWith } from 'rxjs/operators';
import { ConnectableObservable, Observable, Subject, throwError } from 'rxjs';
import { IntentMessage, MessageHeaders, TopicMessage } from '../../messaging.model';
import { MessageClient, takeUntilUnsubscribe } from './message-client';
import { Logger } from '../../logger';
import { ManifestRegistry } from '../../host/manifest-registry/manifest-registry';
import { ApplicationConfig } from '../../host/platform-config';
import { PLATFORM_SYMBOLIC_NAME } from '../../host/platform.constants';
import { collectToPromise, expectMap, expectToBeRejectedWithError, serveManifest, waitFor, waitForCondition } from '../../spec.util.spec';
import { MicrofrontendPlatform } from '../../microfrontend-platform';
import { Defined, Objects } from '@scion/toolkit/util';
import { ClientRegistry } from '../../host/message-broker/client.registry';
import { MessageEnvelope } from '../../ɵmessaging.model';
import Spy = jasmine.Spy;

const bodyExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): T => msg.body;
const headersExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): Map<string, any> => msg.headers;

/**
 * Tests most important and fundamental features of the messaging facility with a single client, the host-app, only.
 *
 * More advanced and deeper testing with having multiple, cross-origin clients connected, is done end-to-end with Protractor against the testing app.
 *
 * See `messaging.e2e-spec.ts` for end-to-end tests.
 */
describe('Messaging', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  it('should allow publishing messages to a topic', async () => {
    await MicrofrontendPlatform.startHost([]);

    const actual$ = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic');
    const actual = collectToPromise(actual$, {take: 3, projectFn: bodyExtractFn});

    Beans.get(PlatformMessageClient).publish('some-topic', 'A');
    Beans.get(PlatformMessageClient).publish('some-topic', 'B');
    Beans.get(PlatformMessageClient).publish('some-topic', 'C');

    await expectAsync(actual).toBeResolvedTo(['A', 'B', 'C']);
  });

  it('should allow issuing an intent', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const actual$ = Beans.get(MessageClient).onIntent$<string>();
    const actual = collectToPromise(actual$, {take: 1, projectFn: bodyExtractFn});

    Beans.get(MessageClient).issueIntent({type: 'some-capability'}, 'payload');

    await expectAsync(actual).toBeResolvedTo(['payload']);
  });

  it('should allow issuing an intent for which the app has not declared a respective intention, but only if \'intention check\' is disabled for that app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl, intentionCheckDisabled: true}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await expectAsync(Beans.get(MessageClient).issueIntent({type: 'some-type'})).toBeResolved();
  });

  it('should not allow issuing an intent for which the app has not declared a respective intention, if \'intention check\' is enabled or not specified for that app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await expectToBeRejectedWithError(Beans.get(MessageClient).issueIntent({type: 'some-type'}), /NotQualifiedError/);
  });

  it('should dispatch a message to subscribers with a wildcard subscription', async () => {
    await MicrofrontendPlatform.startHost([]);

    const collectedMessages: TopicMessage[] = [];

    // Subscribe to 'myhome/:room/temperature'
    await Beans.get(PlatformMessageClient).onMessage$<string>('myhome/:room/temperature').subscribe(msg => collectedMessages.push(msg));

    // Publish messages
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '25°C');
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '26°C');
    await Beans.get(PlatformMessageClient).publish('myhome/kitchen/temperature', '22°C');
    await Beans.get(PlatformMessageClient).publish('myhome/kitchen/humidity', '15%');

    await waitFor(100);

    expect(collectedMessages.length).toEqual(3);

    expectMessage(collectedMessages[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expectMessage(collectedMessages[1]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '26°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expectMessage(collectedMessages[2]).toMatch({
      topic: 'myhome/kitchen/temperature',
      body: '22°C',
      params: new Map().set('room', 'kitchen'),
      headers: new Map(),
    });
  });

  it('should allow passing headers when publishing a message', async () => {
    await MicrofrontendPlatform.startHost([]);

    const actual$ = Beans.get(PlatformMessageClient).onMessage$('some-topic');
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    Beans.get(PlatformMessageClient).publish('some-topic', undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await expectMap(actual).toContain(new Map().set('header1', 'value').set('header2', 42));
  });

  it('should allow passing headers when issuing an intent', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const actual$ = Beans.get(MessageClient).onIntent$();
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    Beans.get(MessageClient).issueIntent({type: 'some-capability'}, undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await expectMap(actual).toContain(new Map().set('header1', 'value').set('header2', 42));
  });

  it('should return an empty headers dictionary if no headers are set', async () => {
    await MicrofrontendPlatform.startHost([]);

    const actual$ = Beans.get(PlatformMessageClient).onMessage$('some-topic');
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    Beans.get(PlatformMessageClient).publish('some-topic', 'payload');
    await expectMap(actual).toContain(new Map());
  });

  it('should allow passing headers when sending a request', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).onMessage$('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', msg.headers.get('request-header').toUpperCase())});
    });

    const ping$ = Beans.get(PlatformMessageClient).request$('some-topic', undefined, {headers: new Map().set('request-header', 'ping')});
    const actual = collectToPromise(ping$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    await expectMap(actual).toContain(new Map().set('reply-header', 'PING'));
  });

  it('should allow passing headers when sending an intent request', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).onIntent$().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', intent.headers.get('request-header').toUpperCase())});
    });

    const ping$ = Beans.get(MessageClient).requestByIntent$({type: 'some-capability'}, undefined, {headers: new Map().set('request-header', 'ping')});
    const actual = collectToPromise(ping$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    await expectMap(actual).toContain(new Map().set('reply-header', 'PING'));
  });

  it('should transport a topic message to both, the platform client and the host client, respectively', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const messagesReceivedByPlatformMessageClient = collectToPromise(Beans.get(PlatformMessageClient).onMessage$('some-topic'), {take: 2, projectFn: bodyExtractFn});
    const messagesReceivedByHostMessageClient = collectToPromise(Beans.get(MessageClient).onMessage$('some-topic'), {take: 2, projectFn: bodyExtractFn});

    await expectAsync(waitUntilSubscriberCount('some-topic', 2)).toBeResolved();
    await Beans.get(PlatformMessageClient).publish('some-topic', 'A');
    await Beans.get(MessageClient).publish('some-topic', 'B');

    await expectAsync(messagesReceivedByPlatformMessageClient).toBeResolvedTo(['A', 'B']);
    await expectAsync(messagesReceivedByHostMessageClient).toBeResolvedTo(['A', 'B']);
  });

  it('should allow receiving a reply for a request', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).onMessage$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
    });

    const ping$ = Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping');
    const actual = collectToPromise(ping$, {take: 1, projectFn: bodyExtractFn});

    await expectAsync(actual).toBeResolvedTo(['PING']);
  });

  it('should allow receiving a reply for an intent request', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).onIntent$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const ping$ = Beans.get(MessageClient).requestByIntent$({type: 'some-capability'}, 'ping');
    const actual = collectToPromise(ping$, {take: 1, projectFn: bodyExtractFn});
    await expectAsync(actual).toBeResolvedTo(['PING']);
  });

  it('should reject a \'request-response\' intent if no replier is found', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', intentions: [{type: 'some-type'}]});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).onIntent$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const ping$ = Beans.get(MessageClient).requestByIntent$({type: 'some-type'}, 'ping');
    const actual = collectToPromise(ping$, {take: 1, projectFn: bodyExtractFn});
    await expectAsync(actual).toBeRejectedWith('[RequestReplyError] No client is currently running which could answer the intent \'{type=some-type, qualifier=undefined}\'.');
  });

  it('should reject an intent if no application provides a satisfying capability', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', intentions: [{type: 'some-type'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).onIntent$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const ping$ = Beans.get(MessageClient).requestByIntent$({type: 'some-type'}, 'ping');
    const actual = collectToPromise(ping$, {take: 1, projectFn: bodyExtractFn});
    await expectAsync(actual).toBeRejectedWith('[NullProviderError] No application found to provide a capability of the type \'some-type\' and qualifiers \'{}\'. Maybe, the capability is not public API or the providing application not available.');
  });

  it('should reject a client connect attempt if the app is not registered', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'warn', 'info']);
    Beans.register(Logger, {useValue: loggerSpy});
    await MicrofrontendPlatform.startHost([]); // no app is registered

    const badClient = mountBadClientAndConnect({symbolicName: 'bad-client'});
    try {
      await waitForCondition(() => loggerSpy.warn.calls.all().length > 0, 1000);
      await expect(loggerSpy.warn.calls.mostRecent().args[0]).toEqual('[WARNING] Client connect attempt rejected by the message broker: Unknown client. [app=\'bad-client\']');
    }
    finally {
      badClient.dispose();
    }
    await expect(true).toBeTruthy();
  });

  it('should reject a client connect attempt if the client\'s origin is different to the registered app origin', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'warn', 'info']);
    Beans.register(Logger, {useValue: loggerSpy});

    const manifestUrl = serveManifest({name: 'Client', baseUrl: 'http://app-origin'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'client', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps);

    const badClient = mountBadClientAndConnect({symbolicName: 'client'}); // bad client connects under karma test runner origin (window.origin)
    try {
      await waitForCondition(() => loggerSpy.warn.calls.all().length > 0, 1000);
      await expect(loggerSpy.warn.calls.mostRecent().args[0]).toEqual(`[WARNING] Client connect attempt blocked by the message broker: Wrong origin [actual='${window.origin}', expected='http://app-origin', app='client']`);
    }
    finally {
      badClient.dispose();
    }
  });

  it('should log an error if the message broker cannot be discovered', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'info', ['warn']]);
    Beans.register(Logger, {useValue: loggerSpy});
    const logCapturePromise = waitUntilInvoked(loggerSpy.error);

    await MicrofrontendPlatform.connectToHost({symbolicName: 'client-app', messaging: {brokerDiscoverTimeout: 250}});

    await expectAsync(logCapturePromise).toBeResolved();
    await expect(loggerSpy.error).toHaveBeenCalledWith('[BrokerDiscoverTimeoutError] Message broker not discovered within the 250ms timeout. Messages cannot be published or received.');
  });

  it('should throw an error when publishing a message and if the message broker is not discovered', async () => {
    await MicrofrontendPlatform.connectToHost({symbolicName: 'client-app', messaging: {brokerDiscoverTimeout: 250}});
    await expectToBeRejectedWithError(Beans.get(MessageClient).publish('some-topic'), /BrokerDiscoverTimeoutError/);
  });

  describe('Separate registries for the platform and the host client app', () => {

    it('should dispatch an intent only to the platform message client', async () => {
      const manifestUrl = serveManifest({name: 'Host Application'});
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register a platform capability. Intents should not be received by the host-app message client.
      Beans.get(ManifestRegistry).registerCapability({type: 'some-capability'}, PLATFORM_SYMBOLIC_NAME);
      const intentsReceivedByPlatformMessageClient = collectToPromise(Beans.get(PlatformMessageClient).onIntent$(), {take: 1, projectFn: bodyExtractFn});
      const intentsReceivedByHostMessageClient = collectToPromise(Beans.get(MessageClient).onIntent$(), {take: 1, projectFn: bodyExtractFn});

      // Issue the intent via platform message client.
      await Beans.get(PlatformMessageClient).issueIntent({type: 'some-capability'});

      // Verify host-app message client not receiving the intent.
      await expectAsync(intentsReceivedByPlatformMessageClient).toBeResolved();
      await expectAsync(intentsReceivedByHostMessageClient).toBeRejected();

      // Verify host-app message client not allowed to issue the intent.
      await expectToBeRejectedWithError(Beans.get(MessageClient).issueIntent({type: 'some-capability'}), /NotQualifiedError/);
    });

    it('should dispatch an intent only to the host-app message client', async () => {
      const manifestUrl = serveManifest({name: 'Host Application'});
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register a host-app capability. Intents should not be received by the platform message client.
      Beans.get(ManifestRegistry).registerCapability({type: 'some-host-app-capability'}, 'host-app');
      const intentsReceivedByPlatformMessageClient = collectToPromise(Beans.get(PlatformMessageClient).onIntent$(), {take: 1, projectFn: bodyExtractFn});
      const intentsReceivedByHostMessageClient = collectToPromise(Beans.get(MessageClient).onIntent$(), {take: 1, projectFn: bodyExtractFn});

      // Issue the intent via host-app message client.
      await Beans.get(MessageClient).issueIntent({type: 'some-host-app-capability'});

      // Verify platform message client not receiving the intent.
      await expectAsync(intentsReceivedByPlatformMessageClient).toBeRejected();
      await expectAsync(intentsReceivedByHostMessageClient).toBeResolved();

      // Verify platform message client not allowed to issue the intent.
      await expectToBeRejectedWithError(Beans.get(PlatformMessageClient).issueIntent({type: 'some-host-app-capability'}), /NotQualifiedError/);
    });
  });

  it('should allow multiple subscriptions to the same topic in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    const receiver1$ = Beans.get(MessageClient).onMessage$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;
    const receiver2$ = Beans.get(MessageClient).onMessage$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;
    const receiver3$ = Beans.get(MessageClient).onMessage$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;

    const subscription1 = receiver1$.connect();
    const subscription2 = receiver2$.connect();
    const subscription3 = receiver3$.connect();

    // publish 'message 1a'
    await Beans.get(MessageClient).publish('topic', 'message 1a', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 1a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 1a'})).toBeResolved();

    // publish 'message 1b'
    await Beans.get(MessageClient).publish('topic', 'message 1b', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 1b'})).toBeResolved();

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // publish 'message 2a'
    await Beans.get(MessageClient).publish('topic', 'message 2a', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 2a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2a'})).toBeResolved();

    // publish 'message 2b'
    await Beans.get(MessageClient).publish('topic', 'message 2b', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 2b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toBeResolved();

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // publish 'message 3a'
    await Beans.get(MessageClient).publish('topic', 'message 3a', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 3a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toBeResolved();

    // publish 'message 3b'
    await Beans.get(MessageClient).publish('topic', 'message 3b', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toBeResolved();

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // publish 'message 4a'
    await Beans.get(MessageClient).publish('topic', 'message 4a', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toBeResolved();

    // publish 'message 4b'
    await Beans.get(MessageClient).publish('topic', 'message 4b', {retain: true});
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toBeResolved();
  });

  it('should allow multiple subscriptions to the same intent in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'xyz'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    const receiver1$ = Beans.get(MessageClient).onIntent$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;
    const receiver2$ = Beans.get(MessageClient).onIntent$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;
    const receiver3$ = Beans.get(MessageClient).onIntent$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;

    const subscription1 = receiver1$.connect();
    const subscription2 = receiver2$.connect();
    const subscription3 = receiver3$.connect();

    // issue 'intent 1a'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 1a');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 1a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 1a'})).toBeResolved();

    // issue 'intent 1b'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 1b');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 1b'})).toBeResolved();

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // issue 'intent 2a'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 2a');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 2a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2a'})).toBeResolved();

    // issue 'intent 2b'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 2b');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 2b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toBeResolved();

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // issue 'intent 3a'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 3a');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 3a'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toBeResolved();

    // issue 'intent 3b'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 3b');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toBeResolved();

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // issue 'intent 4a'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 4a');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toBeResolved();

    // issue 'intent 4b'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 4b');
    await expectAsync(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toBeResolved();
    await expectAsync(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toBeResolved();
  });

  it('should warn if an intent cannot be uniquely resolved to a capability of an application', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'warn', 'info']);
    Beans.register(Logger, {useValue: loggerSpy});

    const manifestUrl = serveManifest({
      name: 'Host Application', capabilities: [
        {type: 'microfrontend', qualifier: {entity: 'product', id: '*'}},
        {type: 'microfrontend', qualifier: {entity: '*', id: '*'}},
      ],
    });
    const platformConfig: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(platformConfig, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    Beans.get(MessageClient).issueIntent({type: 'microfrontend', qualifier: {entity: 'product', id: '42'}});
    await waitForCondition(() => loggerSpy.warn.calls.all().find(call => {
      const log: string = call.args[0];
      return log.match(/Intent cannot be uniquely resolved to a capability/);
    }), 1000);

    expect(true).toBeTrue(); // add noop expectation to omit 'no expectations warning'
  });

  it('should receive a message once regardless of the number of subscribers in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    // Register two receivers
    Beans.get(MessageClient).onMessage$<string>('topic').subscribe();
    Beans.get(MessageClient).onMessage$<string>('topic').subscribe();

    // Register the test receiver
    const receiver = collectToPromise(Beans.get(MessageClient).onMessage$<string>('topic'), {take: 2, projectFn: bodyExtractFn});

    // publish 'message 1'
    await Beans.get(MessageClient).publish('topic', 'message 1');
    // publish 'message 2'
    await Beans.get(MessageClient).publish('topic', 'message 2');

    // expect only the two message to be dispatched
    await expectAsync(receiver).toBeResolvedTo(['message 1', 'message 2']);
  });

  it('should dispatch a retained message only to the newly subscribed subscriber', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    const collectedMessagesSub1: TopicMessage[] = [];
    const collectedMessagesSub2: TopicMessage[] = [];
    const collectedMessagesSub3: TopicMessage[] = [];
    const collectedMessagesSub4: TopicMessage[] = [];
    const collectedMessagesSub5: TopicMessage[] = [];
    const collectedMessagesSub6: TopicMessage[] = [];

    // Subscribe before publishing the retained message
    await Beans.get(MessageClient).onMessage$<string>('myhome/livingroom/temperature').subscribe(msg => collectedMessagesSub1.push(msg));
    await Beans.get(MessageClient).onMessage$<string>('myhome/:room/temperature').subscribe(msg => collectedMessagesSub2.push(msg));

    // Publish the retained message
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '25°C', {retain: true});

    await waitFor(100);
    expect(collectedMessagesSub1.length).toEqual(1);
    expectMessage(collectedMessagesSub1[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    expect(collectedMessagesSub2.length).toEqual(1);
    expectMessage(collectedMessagesSub2[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    // Subscribe after publishing the retained message
    await Beans.get(MessageClient).onMessage$<string>('myhome/livingroom/temperature').subscribe(msg => collectedMessagesSub3.push(msg));
    await Beans.get(MessageClient).onMessage$<string>('myhome/:room/temperature').subscribe(msg => collectedMessagesSub4.push(msg));
    await Beans.get(MessageClient).onMessage$<string>('myhome/:room/:measurement').subscribe(msg => collectedMessagesSub5.push(msg));
    await Beans.get(MessageClient).onMessage$<string>('myhome/kitchen/:measurement').subscribe(msg => collectedMessagesSub6.push(msg));

    await waitFor(100);

    expect(collectedMessagesSub1.length).toEqual(1);
    expectMessage(collectedMessagesSub1[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    expect(collectedMessagesSub2.length).toEqual(1);
    expectMessage(collectedMessagesSub2[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expect(collectedMessagesSub3.length).toEqual(1);
    expectMessage(collectedMessagesSub3[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });

    expect(collectedMessagesSub4.length).toEqual(1);
    expectMessage(collectedMessagesSub4[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });

    expect(collectedMessagesSub5.length).toEqual(1);
    expectMessage(collectedMessagesSub5[0]).toMatch({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom').set('measurement', 'temperature'),
      headers: new Map(),
    });

    expect(collectedMessagesSub6.length).toEqual(0);
  });

  it('should receive an intent once regardless of the number of subscribers in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'xyz'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    // Register two intent handlers
    Beans.get(MessageClient).onIntent$<string>().subscribe();
    Beans.get(MessageClient).onIntent$<string>().subscribe();

    // Register the test intent handler
    const receiver = collectToPromise(Beans.get(MessageClient).onIntent$<string>(), {take: 2, projectFn: bodyExtractFn});

    // issue 'intent 1'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 1');
    // issue 'intent 2'
    await Beans.get(MessageClient).issueIntent({type: 'xyz'}, 'intent 2');

    // expect only the two intents to be dispatched
    await expectAsync(receiver).toBeResolvedTo(['intent 1', 'intent 2']);
  });

  it('should allow tracking the subscriptions on a topic', async () => {
    await MicrofrontendPlatform.startHost([]);

    // Subscribe and wait until the initial subscription count, which is 0, is reported.
    const collectedCounts = collectToPromise(Beans.get(PlatformMessageClient).subscriberCount$('some-topic'), {take: 7});
    await waitUntilSubscriberCount('some-topic', 0, {timeout: 250});

    Beans.get(PlatformMessageClient).onMessage$<string>('some-topic').subscribe().unsubscribe();
    const subscription2 = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic').subscribe();
    const subscription3 = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic').subscribe();
    subscription2.unsubscribe();
    subscription3.unsubscribe();

    await expectAsync(collectedCounts).toBeResolvedTo([0, 1, 0, 1, 2, 1, 0]);
  });

  it('should set message headers about the sender (platform)', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).publish('some-topic', 'body', {retain: true});

    const actual$ = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic');
    const message = await collectToPromise(actual$, {take: 1}).then(takeFirstElement);

    expect(message.headers.get(MessageHeaders.ClientId)).toBeDefined();
    expect(message.headers.get(MessageHeaders.AppSymbolicName)).toEqual(PLATFORM_SYMBOLIC_NAME);
  });

  it('should set message headers about the sender (host-app)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});

    const actual$ = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic');
    const message = await collectToPromise(actual$, {take: 1}).then(takeFirstElement);

    expect(message.headers.get(MessageHeaders.ClientId)).toBeDefined();
    expect(message.headers.get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
  });

  it('should deliver custom headers in retained message', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(MessageClient).publish('some-topic', 'body', {retain: true, headers: new Map().set('custom-header', 'some-value')});
    await waitFor(500); // ensure the message to be delivered as retained message

    const actual$ = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic');
    const message = await collectToPromise(actual$, {take: 1}).then(takeFirstElement);

    expect(message.headers.get(MessageHeaders.ClientId)).toBeDefined();
    expect(message.headers.get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
    expect(message.headers.get('custom-header')).toEqual('some-value');
  });

  it('should deliver the client-id from the publisher when receiving a retained message upon subscription', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await waitForCondition((): boolean => Beans.get(ClientRegistry).getByApplication('host-app').length > 0, 1000);
    const senderClientId = Beans.get(ClientRegistry).getByApplication('host-app')[0].id;

    Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});
    await waitFor(500); // ensure the message to be delivered as retained message

    const actual$ = Beans.get(PlatformMessageClient).onMessage$<string>('some-topic');
    const message = await collectToPromise(actual$, {take: 1}).then(takeFirstElement);

    expect(message.headers.get(MessageHeaders.ClientId)).toEqual(senderClientId);
  });

  it('should throw if the topic of a message to publish is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).publish('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).publish(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).publish(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).publish('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic of a request is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).request$('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).request$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).request$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).request$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic to observe the subscriber count is empty, `null` or `undefined`, or contains wildcard segments', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).subscriberCount$('myhome/:room/temperature')).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).subscriberCount$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).subscriberCount$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).subscriberCount$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the topic to observe is empty, `null` or `undefined`', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).onMessage$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).onMessage$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).onMessage$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the qualifier of an intent contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).issueIntent({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformMessageClient).issueIntent({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformMessageClient).issueIntent({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should throw if the qualifier of an intent request contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformMessageClient).requestByIntent$({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformMessageClient).requestByIntent$({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformMessageClient).requestByIntent$({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should prevent overriding platform specific message headers [pub/sub]', async () => {
    await MicrofrontendPlatform.startHost([]);

    const actual$ = Beans.get(PlatformMessageClient).onMessage$('some-topic');
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵTopicSubscriberId, 'should-not-be-set'),
      },
    );

    const headers = await actual;
    expect(headers.get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ɵTopicSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific message headers [request/reply]', async () => {
    await MicrofrontendPlatform.startHost([]);

    const actual$ = Beans.get(PlatformMessageClient).onMessage$('some-topic');
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    Beans.get(PlatformMessageClient).request$('some-topic', 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set')
          .set(MessageHeaders.ɵTopicSubscriberId, 'should-not-be-set'),
      },
    ).subscribe();

    const headers = await actual;
    expect(headers.get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ɵTopicSubscriberId)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [pub/sub]', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const actual$ = Beans.get(MessageClient).onIntent$();
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    await Beans.get(MessageClient).issueIntent({type: 'some-capability'}, 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set'),
      },
    );

    const headers = await actual;
    expect(headers.get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  it('should prevent overriding platform specific intent message headers [request/reply]', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const actual$ = Beans.get(MessageClient).onIntent$();
    const actual = collectToPromise(actual$, {take: 1, projectFn: headersExtractFn}).then(takeFirstElement);

    Beans.get(MessageClient).requestByIntent$({type: 'some-capability'}, 'payload', {
        headers: new Map()
          .set(MessageHeaders.Timestamp, 'should-not-be-set')
          .set(MessageHeaders.ClientId, 'should-not-be-set')
          .set(MessageHeaders.AppSymbolicName, 'should-not-be-set'),
      },
    ).subscribe();

    const headers = await actual;
    expect(headers.get(MessageHeaders.Timestamp)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.ClientId)).not.toEqual('should-not-be-set');
    expect(headers.get(MessageHeaders.AppSymbolicName)).not.toEqual('should-not-be-set');
  });

  describe('takeUntilUnsubscribe operator', () => {

    it('should complete the source observable when all subscribers unsubscribed', async () => {
      await MicrofrontendPlatform.startHost([]);

      const subscription = Beans.get(PlatformMessageClient).onMessage$('some-topic').subscribe();
      const testee = new Subject<void>()
        .pipe(
          takeUntilUnsubscribe('some-topic', PlatformMessageClient),
          timeoutWith(new Date(Date.now() + 500), throwError('[SpecTimeoutError] Timeout elapsed.')),
        )
        .toPromise();

      // unsubscribe from the topic
      subscription.unsubscribe();

      await expectAsync(testee).toBeResolved();
    });

    it('should complete the source observable immediately when no subscriber is subscribed', async () => {
      await MicrofrontendPlatform.startHost([]);

      const testee = new Subject<void>()
        .pipe(
          takeUntilUnsubscribe('nobody-subscribed-to-this-topic', PlatformMessageClient),
          timeoutWith(new Date(Date.now() + 500), throwError('[SpecTimeoutError] Timeout elapsed.')),
        )
        .toPromise();

      await expectAsync(testee).toBeResolved();
    });
  });
});

/**
 * Mounts an iframe that tries to connect to the platform.
 */
function mountBadClientAndConnect(badClientConfig: { symbolicName: string }): { dispose(): void } {
  // Note: DO NOT USE CODE FROM OTHER MODULES BECAUSE SOLELY THE 'TO-STRING' REPRESENTATION OF FOLLOWING FUNCTION
  //       IS LOADED INTO THE IFRAME. THE ONLY EXCEPTION ARE REFERENCES TO INTERFACE TYPES AS NOT TRANSPILED INTO
  //       JAVASCRIPT.
  function sendConnnectRequest(symbolicName: string): void {
    const env: MessageEnvelope<TopicMessage> = {
      transport: 'sci://microfrontend-platform/gateway-to-broker' as any,
      channel: 'topic' as any,
      message: {
        topic: 'ɵCLIENT_CONNECT',
        headers: new Map()
          .set('ɵMESSAGE_ID', '123')
          .set('ɵAPP_SYMBOLIC_NAME', symbolicName),
      },
    };
    window.parent.postMessage(env, '*');
  }

  const script = `(${sendConnnectRequest.toString()})('${badClientConfig.symbolicName}');`; // invokes the transpiled function
  const html = `<html><head><script>${script}</script></head><body>BAD CLIENT</body></html>`;
  const iframeUrl = URL.createObjectURL(new Blob([html], {type: 'text/html'}));
  const iframe = document.body.appendChild(document.createElement('iframe'));
  iframe.setAttribute('src', iframeUrl);
  return {
    dispose(): void {
      URL.revokeObjectURL(iframeUrl);
      document.body.removeChild(iframe);
    },
  };
}

/**
 * Expects the message to equal the expected message with its headers to contain at minimum the given map entries.
 *
 * Jasmine 3.5 provides 'mapContaining' matcher; when updated, this custom matcher can be removed.
 */
function expectMessage(actual: TopicMessage): { toMatch: (expected: TopicMessage) => void } {
  return {
    toMatch: (expected: TopicMessage): void => {
      // Transform the 'headers' map to an array with tuples of map entries to allow using 'jasmine.objectContaining' matcher.
      const actualWithHeaderMapAsArray = {
        ...actual,
        headers: [...actual.headers],
      };
      const expectedWithMapsAsArray = {
        ...expected,
        headers: jasmine.arrayContaining([...expected.headers]),
      };
      expect(actualWithHeaderMapAsArray).toEqual(jasmine.objectContaining(expectedWithMapsAsArray) as any);
    },
  };
}

/**
 * Waits until the give Jasmin spy is invoked, or throws an error if not invoked within the specified timeout.
 */
function waitUntilInvoked(spy: Spy, options?: { timeout?: number }): Promise<never> {
  const timeout = Defined.orElse(options && options.timeout, 1000);
  return new Promise((resolve, reject) => { // tslint:disable-line:typedef
    const timeoutHandle = setTimeout(() => reject('[SpecTimeoutError] Timeout elapsed.'), timeout);
    spy.and.callFake(() => {
      clearTimeout(timeoutHandle);
      resolve();
    });
  });
}

/**
 * Waits until the given number of subscribers are subscribed to the given topic, or throws an error otherwise.
 */
async function waitUntilSubscriberCount(topic: string, expectedCount: number, options?: { timeout?: number }): Promise<void> {
  const timeout = Defined.orElse(options && options.timeout, 1000);
  await Beans.opt(PlatformMessageClient).subscriberCount$(topic)
    .pipe(
      first(count => count === expectedCount),
      timeoutWith(new Date(Date.now() + timeout), throwError('[SpecTimeoutError] Timeout elapsed.')),
    )
    .toPromise();
}

/**
 * Waits until a message with the given body is received.
 */
async function waitUntilMessageReceived(observable$: Observable<TopicMessage<any> | IntentMessage<any>>, waitUntil: { body: any, timeout?: number }): Promise<void> {
  const timeout = Defined.orElse(waitUntil.timeout, 250);
  await observable$
    .pipe(
      first(msg => Objects.isEqual(msg.body, waitUntil.body)),
      timeoutWith(new Date(Date.now() + timeout), throwError('[SpecTimeoutError] Timeout elapsed.')),
    )
    .toPromise();
}

function takeFirstElement<T>(array: T[]): T {
  return array[0];
}
