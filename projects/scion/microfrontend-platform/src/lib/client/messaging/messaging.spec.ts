/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { PlatformMessageClient } from '../../host/platform-message-client';
import { first, publishReplay, timeoutWith } from 'rxjs/operators';
import { ConnectableObservable, noop, Observable, Subject, throwError } from 'rxjs';
import { IntentMessage, MessageHeaders, ResponseStatusCodes, TopicMessage } from '../../messaging.model';
import { MessageClient, takeUntilUnsubscribe } from './message-client';
import { IntentClient } from './intent-client';
import { Logger } from '../../logger';
import { ManifestRegistry } from '../../host/manifest-registry/manifest-registry';
import { ApplicationConfig } from '../../host/platform-config';
import { PLATFORM_SYMBOLIC_NAME } from '../../host/platform.constants';
import { expectEmissions, expectPromise, serveManifest, waitForCondition } from '../../spec.util.spec';
import { MicrofrontendPlatform } from '../../microfrontend-platform';
import { Defined, Objects } from '@scion/toolkit/util';
import { ClientRegistry } from '../../host/message-broker/client.registry';
import { MessageEnvelope } from '../../ɵmessaging.model';
import { PlatformIntentClient } from '../../host/platform-intent-client';
import { Beans } from '@scion/toolkit/bean-manager';
import { ManifestService } from '../manifest-registry/manifest-service';
import { ObserveCaptor } from '@scion/toolkit/testing';

const bodyExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): T => msg.body;
const headersExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): Map<string, any> => msg.headers;
const paramsExtractFn = <T>(msg: IntentMessage<T>): Map<string, any> => msg.intent.params;
const capabilityIdExtractFn = <T>(msg: IntentMessage<T>): string => msg.capability.metadata.id;

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

    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(messageCaptor);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'A');
    await Beans.get(PlatformMessageClient).publish('some-topic', 'B');
    await Beans.get(PlatformMessageClient).publish('some-topic', 'C');

    await expectEmissions(messageCaptor).toEqual(['A', 'B', 'C']);
  });

  it('should allow issuing an intent', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const intentCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(IntentClient).observe$<string>().subscribe(intentCaptor);

    await Beans.get(IntentClient).publish({type: 'some-capability'}, 'payload');

    await expectEmissions(intentCaptor).toEqual(['payload']);
  });

  it('should allow issuing an intent for which the app has not declared a respective intention, but only if \'intention check\' is disabled for that app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl, intentionCheckDisabled: true}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await expectPromise(Beans.get(IntentClient).publish({type: 'some-type'})).toResolve();
  });

  it('should not allow issuing an intent for which the app has not declared a respective intention, if \'intention check\' is enabled or not specified for that app', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await expectPromise(Beans.get(IntentClient).publish({type: 'some-type'})).toReject(/NotQualifiedError/);
  });

  it('should dispatch a message to subscribers with a wildcard subscription', async () => {
    await MicrofrontendPlatform.startHost([]);

    const messageCaptor = new ObserveCaptor();

    // Subscribe to 'myhome/:room/temperature'
    await Beans.get(PlatformMessageClient).observe$<string>('myhome/:room/temperature').subscribe(messageCaptor);

    // Publish messages
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '25°C');
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '26°C');
    await Beans.get(PlatformMessageClient).publish('myhome/kitchen/temperature', '22°C');
    await Beans.get(PlatformMessageClient).publish('myhome/kitchen/humidity', '15%');

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
    await MicrofrontendPlatform.startHost([]);

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(PlatformMessageClient).publish('some-topic', undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('header1', 'value').set('header2', 42)));
  });

  it('should allow passing headers when issuing an intent', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    await Beans.get(IntentClient).observe$().subscribe(headerCaptor);

    await Beans.get(IntentClient).publish({type: 'some-capability'}, undefined, {headers: new Map().set('header1', 'value').set('header2', 42)});
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('header1', 'value').set('header2', 42)));
  });

  it('should return an empty headers dictionary if no headers are set', async () => {
    await MicrofrontendPlatform.startHost([]);

    const headerCaptor = new ObserveCaptor(headersExtractFn);
    await Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(headerCaptor);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'payload');
    await headerCaptor.waitUntilEmitCount(1);
    await expect(headerCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map()));
  });

  it('should allow passing headers when sending a request', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', msg.headers.get('request-header').toUpperCase())});
    });

    const replyHeaderCaptor = new ObserveCaptor(headersExtractFn);
    await Beans.get(PlatformMessageClient).request$('some-topic', undefined, {headers: new Map().set('request-header', 'ping')}).subscribe(replyHeaderCaptor);
    await replyHeaderCaptor.waitUntilEmitCount(1);
    await expect(replyHeaderCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('reply-header', 'PING')));
  });

  it('should allow passing headers when sending an intent request', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, undefined, {headers: new Map().set('reply-header', intent.headers.get('request-header').toUpperCase())});
    });

    const replyHeaderCaptor = new ObserveCaptor(headersExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, undefined, {headers: new Map().set('request-header', 'ping')}).subscribe(replyHeaderCaptor);
    await replyHeaderCaptor.waitUntilEmitCount(1);
    await expect(replyHeaderCaptor.getLastValue()).toEqual(jasmine.mapContaining(new Map().set('reply-header', 'PING')));
  });

  it('should transport a topic message to both, the platform client and the host client, respectively', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    // Observe messages using the {PlatformMessageClient}
    const platformMessageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(platformMessageCaptor);

    // Observe messages using the {MessageClient}
    const clientMessageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(clientMessageCaptor);

    // Wait until subscribed
    await waitUntilSubscriberCount('some-topic', 2);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'A');
    await Beans.get(MessageClient).publish('some-topic', 'B');

    await expectEmissions(platformMessageCaptor).toEqual(['A', 'B']);
    await expectEmissions(clientMessageCaptor).toEqual(['A', 'B']);
  });

  it('should allow receiving a reply for a request (by not replying with a status code)', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should allow receiving a reply for a request (by replying with the status code 200)', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should allow receiving multiple replies for a request', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should complete the request when replying with the status code 250 (with the first reply)', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeTrue();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should complete the request when replying with the status code 250 (after multiple replies)', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase());
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).toBeTrue();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should error the request when replying with the status code 500', async () => {
    await MicrofrontendPlatform.startHost([]);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(msg => {
      const replyTo = msg.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, msg.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(PlatformMessageClient).request$<string>('some-topic', 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getValues()).toEqual([]);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeTrue();
    expect(replyCaptor.getError().message).toEqual('PING');
  });

  it('should allow receiving a reply for an intent request (by not replying with a status code)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should allow receiving a reply for an intent request (by replying with the status code 200)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should allow receiving multiple replies for an intent request', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should complete the intent request when replying with the status code 250 (with the first reply)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING']);
    expect(replyCaptor.hasCompleted()).toBeTrue();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should complete the intent request when replying with the status code 250 (after multiple replies)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(PlatformMessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(PlatformMessageClient).publish(replyTo, intent.body.toUpperCase());
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await expectEmissions(replyCaptor).toEqual(['PING', 'PING', 'PING']);
    expect(replyCaptor.hasCompleted()).toBeTrue();
    expect(replyCaptor.hasErrored()).toBeFalse();
  });

  it('should error the intent request when replying with the status code 500', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    Beans.get(IntentClient).observe$<string>().subscribe(intent => {
      const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
      Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase(), {headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR)});
    });

    const replyCaptor = new ObserveCaptor(bodyExtractFn);
    await Beans.get(IntentClient).request$({type: 'some-capability'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getValues()).toEqual([]);
    expect(replyCaptor.hasCompleted()).toBeFalse();
    expect(replyCaptor.hasErrored()).toBeTrue();
    expect(replyCaptor.getError().message).toEqual('PING');
  });

  it('should reject a \'request-response\' intent if no replier is found', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', intentions: [{type: 'some-type'}]});
    const clientManifestUrl = serveManifest({name: 'Client Application', capabilities: [{type: 'some-type', private: false}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}, {symbolicName: 'client-app', manifestUrl: clientManifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const replyCaptor = new ObserveCaptor();
    await Beans.get(IntentClient).request$({type: 'some-type'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getError()).toEqual('[RequestReplyError] No client is currently running which could answer the intent \'{type=some-type, qualifier=undefined}\'.');
  });

  it('should reject an intent if no application provides a satisfying capability', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', intentions: [{type: 'some-type'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    const replyCaptor = new ObserveCaptor();
    await Beans.get(IntentClient).request$({type: 'some-type'}, 'ping').subscribe(replyCaptor);
    await replyCaptor.waitUntilCompletedOrErrored();
    expect(replyCaptor.getError()).toEqual('[NullProviderError] No application found to provide a capability of the type \'some-type\' and qualifiers \'{}\'. Maybe, the capability is not public API or the providing application not available.');
  });

  it('should reject a client connect attempt if the app is not registered', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'warn', 'info']);
    const readLoggedWarnings = (): string[] => loggerSpy.warn.calls.all().map(callData => callData.args[0]);
    Beans.register(Logger, {useValue: loggerSpy});
    await MicrofrontendPlatform.startHost([]); // no app is registered

    const badClient = mountBadClientAndConnect({symbolicName: 'bad-client'});
    try {
      const expectedLogMessage = `[WARNING] Client connect attempt rejected by the message broker: Unknown client. [app='bad-client']`;
      await waitForCondition(() => readLoggedWarnings().some(warning => warning === expectedLogMessage), 1000).catch(noop);
      expect(readLoggedWarnings()).toEqual(jasmine.arrayContaining([expectedLogMessage]));
    }
    finally {
      badClient.dispose();
    }
    expect(true).toBeTrue();
  });

  it('should reject a client connect attempt if the client\'s origin is different to the registered app origin', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'warn', 'info']);
    const readLoggedWarnings = (): string[] => loggerSpy.warn.calls.all().map(callData => callData.args[0]);
    Beans.register(Logger, {useValue: loggerSpy});

    const manifestUrl = serveManifest({name: 'Client', baseUrl: 'http://app-origin'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'client', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps);

    const badClient = mountBadClientAndConnect({symbolicName: 'client'}); // bad client connects under karma test runner origin (window.origin)
    try {
      const expectedLogMessage = `[WARNING] Client connect attempt blocked by the message broker: Wrong origin [actual='${window.origin}', expected='http://app-origin', app='client']`;
      await waitForCondition(() => readLoggedWarnings().some(warning => warning === expectedLogMessage), 1000).catch(noop);
      expect(readLoggedWarnings()).toEqual(jasmine.arrayContaining([expectedLogMessage]));
    }
    finally {
      badClient.dispose();
    }
  });

  it('should reject startup promise if the message broker cannot be discovered', async () => {
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'info', 'warn']);
    Beans.register(Logger, {useValue: loggerSpy});

    const startup = MicrofrontendPlatform.connectToHost({symbolicName: 'client-app', messaging: {brokerDiscoverTimeout: 250}});
    await expectPromise(startup).toReject(/PlatformStartupError/);

    expect(loggerSpy.error).toHaveBeenCalledWith('[BrokerDiscoverTimeoutError] Message broker not discovered within the 250ms timeout. Messages cannot be published or received.');
  });

  it('should not error with `BrokerDiscoverTimeoutError` when starting the platform host and initializers in runlevel 0 take a long time to complete, e.g., when fetching manifests', async () => {
    const brokerDiscoverTimeout = 250;
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

    // Mock the logger
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'info', 'warn']);
    Beans.register(Logger, {useValue: loggerSpy});

    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    const startup = MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout}});

    await expectPromise(startup).toResolve();
    expect(initializerCompleted).toBeTrue();
    expect(loggerSpy.error).not.toHaveBeenCalled();
  });

  it('should not error with `BrokerDiscoverTimeoutError` when publishing a message in runlevel 0 and runlevel 0 takes a long time to complete (messaging only enabled in runlevel 2)', async () => {
    const brokerDiscoverTimeout = 250;
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

    // Mock the logger
    const loggerSpy = jasmine.createSpyObj(Logger.name, ['error', 'info', 'warn']);
    Beans.register(Logger, {useValue: loggerSpy});

    // Start the host
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    const startup = MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout}});

    // Expect the startup not to error
    await expectPromise(startup).toResolve();
    expect(loggerSpy.error).not.toHaveBeenCalled();

    // Expect the message to be published
    const messageCaptor = new ObserveCaptor(bodyExtractFn);
    Beans.get(MessageClient).observe$('some-topic').subscribe(messageCaptor);
    await messageCaptor.waitUntilEmitCount(1);
    expect(messageCaptor.getLastValue()).toEqual('payload');
  });

  describe('Separate registries for the platform and the host client app', () => {

    it('should dispatch an intent only to the platform intent client', async () => {
      const manifestUrl = serveManifest({name: 'Host Application'});
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register a platform capability. Intents should not be received by the host-app intent client.
      await Beans.get(ManifestRegistry).registerCapability({type: 'some-capability'}, PLATFORM_SYMBOLIC_NAME);
      const platformClientIntentCaptor = new ObserveCaptor();
      Beans.get(PlatformIntentClient).observe$().subscribe(platformClientIntentCaptor);
      const hostClientIntentCaptor = new ObserveCaptor();
      Beans.get(IntentClient).observe$().subscribe(hostClientIntentCaptor);

      // Issue the intent via platform intent client.
      await Beans.get(PlatformIntentClient).publish({type: 'some-capability'});

      // Verify host-app intent client not receiving the intent.
      expect(platformClientIntentCaptor.getLastValue()).toBeDefined();
      expect(hostClientIntentCaptor.getLastValue()).toBeUndefined();

      // Verify host-app intent client not allowed to issue the intent.
      await expectPromise(Beans.get(IntentClient).publish({type: 'some-capability'})).toReject(/NotQualifiedError/);
    });

    it('should dispatch an intent only to the host-app intent client', async () => {
      const manifestUrl = serveManifest({name: 'Host Application'});
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

      // Register a host-app capability. Intents should not be received by the platform intent client.
      Beans.get(ManifestRegistry).registerCapability({type: 'some-host-app-capability'}, 'host-app');
      const platformClientIntentCaptor = new ObserveCaptor();
      Beans.get(PlatformIntentClient).observe$().subscribe(platformClientIntentCaptor);
      const hostClientIntentCaptor = new ObserveCaptor();
      Beans.get(IntentClient).observe$().subscribe(hostClientIntentCaptor);

      // Issue the intent via host-app intent client.
      await Beans.get(IntentClient).publish({type: 'some-host-app-capability'});

      // Verify platform intent client not receiving the intent.
      expect(platformClientIntentCaptor.getLastValue()).toBeUndefined();
      expect(hostClientIntentCaptor.getLastValue()).toBeDefined();

      // Verify platform intent client not allowed to issue the intent.
      await expectPromise(Beans.get(PlatformIntentClient).publish({type: 'some-host-app-capability'})).toReject(/NotQualifiedError/);
    });
  });

  it('should allow multiple subscriptions to the same topic in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    const receiver1$ = Beans.get(MessageClient).observe$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;
    const receiver2$ = Beans.get(MessageClient).observe$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;
    const receiver3$ = Beans.get(MessageClient).observe$<string>('topic').pipe(publishReplay(1)) as ConnectableObservable<TopicMessage<string>>;

    const subscription1 = receiver1$.connect();
    const subscription2 = receiver2$.connect();
    const subscription3 = receiver3$.connect();

    // publish 'message 1a'
    await Beans.get(MessageClient).publish('topic', 'message 1a', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 1a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 1a'})).toResolve();

    // publish 'message 1b'
    await Beans.get(MessageClient).publish('topic', 'message 1b', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 1b'})).toResolve();

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // publish 'message 2a'
    await Beans.get(MessageClient).publish('topic', 'message 2a', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 2a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2a'})).toResolve();

    // publish 'message 2b'
    await Beans.get(MessageClient).publish('topic', 'message 2b', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 2b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toResolve();

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // publish 'message 3a'
    await Beans.get(MessageClient).publish('topic', 'message 3a', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 3a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toResolve();

    // publish 'message 3b'
    await Beans.get(MessageClient).publish('topic', 'message 3b', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toResolve();

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // publish 'message 4a'
    await Beans.get(MessageClient).publish('topic', 'message 4a', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toResolve();

    // publish 'message 4b'
    await Beans.get(MessageClient).publish('topic', 'message 4b', {retain: true});
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'message 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'message 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'message 2b'})).toResolve();
  });

  it('should allow multiple subscriptions to the same intent in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'xyz'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

    const receiver1$ = Beans.get(IntentClient).observe$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;
    const receiver2$ = Beans.get(IntentClient).observe$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;
    const receiver3$ = Beans.get(IntentClient).observe$<string>().pipe(publishReplay(1)) as ConnectableObservable<IntentMessage<string>>;

    const subscription1 = receiver1$.connect();
    const subscription2 = receiver2$.connect();
    const subscription3 = receiver3$.connect();

    // issue 'intent 1a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 1a');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 1a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 1a'})).toResolve();

    // issue 'intent 1b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 1b');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 1b'})).toResolve();

    // unsubscribe observable 1
    subscription1.unsubscribe();

    // issue 'intent 2a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 2a');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 2a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2a'})).toResolve();

    // issue 'intent 2b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 2b');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 2b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toResolve();

    // unsubscribe observable 3
    subscription3.unsubscribe();

    // issue 'intent 3a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 3a');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 3a'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toResolve();

    // issue 'intent 3b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 3b');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toResolve();

    // unsubscribe observable 2
    subscription2.unsubscribe();

    // issue 'intent 4a'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 4a');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toResolve();

    // issue 'intent 4b'
    await Beans.get(IntentClient).publish({type: 'xyz'}, 'intent 4b');
    await expectPromise(waitUntilMessageReceived(receiver1$, {body: 'intent 1b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver2$, {body: 'intent 3b'})).toResolve();
    await expectPromise(waitUntilMessageReceived(receiver3$, {body: 'intent 2b'})).toResolve();
  });

  it('should receive a message once regardless of the number of subscribers in the same client', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    await Beans.get(PlatformMessageClient).publish('myhome/livingroom/temperature', '25°C', {retain: true});

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
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'xyz'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app', messaging: {brokerDiscoverTimeout: 250}});

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
    await MicrofrontendPlatform.startHost([]);

    // Subscribe and wait until the initial subscription count, which is 0, is reported.
    const subscriberCountCaptor = new ObserveCaptor();
    Beans.get(PlatformMessageClient).subscriberCount$('some-topic').subscribe(subscriberCountCaptor);

    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe().unsubscribe();
    const subscription2 = Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe();
    const subscription3 = Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe();
    subscription2.unsubscribe();
    subscription3.unsubscribe();

    await expectEmissions(subscriberCountCaptor).toEqual([0, 1, 0, 1, 2, 1, 0]);
  });

  it('should set message headers about the sender (platform)', async () => {
    await MicrofrontendPlatform.startHost([]);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'body', {retain: true});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toBeDefined();
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).toEqual(PLATFORM_SYMBOLIC_NAME);
  });

  it('should set message headers about the sender (host-app)', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toBeDefined();
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
  });

  it('should deliver custom headers in retained message', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true, headers: new Map().set('custom-header', 'some-value')});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toBeDefined();
    expect(headersCaptor.getLastValue().get(MessageHeaders.AppSymbolicName)).toEqual('host-app');
    expect(headersCaptor.getLastValue().get('custom-header')).toEqual('some-value');
  });

  it('should deliver the client-id from the publisher when receiving a retained message upon subscription', async () => {
    const manifestUrl = serveManifest({name: 'Host Application'});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

    await waitForCondition((): boolean => Beans.get(ClientRegistry).getByApplication('host-app').length > 0, 1000);
    const senderClientId = Beans.get(ClientRegistry).getByApplication('host-app')[0].id;

    await Beans.get(MessageClient).publish('some-topic', 'body', {retain: true});

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$<string>('some-topic').subscribe(headersCaptor);

    await headersCaptor.waitUntilEmitCount(1);
    expect(headersCaptor.getLastValue().get(MessageHeaders.ClientId)).toEqual(senderClientId);
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
    expect(() => Beans.get(PlatformMessageClient).observe$(null)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).observe$(undefined)).toThrowError(/IllegalTopicError/);
    expect(() => Beans.get(PlatformMessageClient).observe$('')).toThrowError(/IllegalTopicError/);
  });

  it('should throw if the qualifier of an intent contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformIntentClient).publish({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformIntentClient).publish({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformIntentClient).publish({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should throw if the qualifier of an intent request contains wildcard characters', async () => {
    await MicrofrontendPlatform.startHost([]);
    expect(() => Beans.get(PlatformIntentClient).request$({type: 'type', qualifier: {entity: 'person', id: '*'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformIntentClient).request$({type: 'type', qualifier: {entity: 'person', id: '?'}})).toThrowError(/IllegalQualifierError/);
    expect(() => Beans.get(PlatformIntentClient).request$({type: 'type', qualifier: {entity: '*', id: '*'}})).toThrowError(/IllegalQualifierError/);
  });

  it('should prevent overriding platform specific message headers [pub/sub]', async () => {
    await MicrofrontendPlatform.startHost([]);

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(headersCaptor);

    await Beans.get(PlatformMessageClient).publish('some-topic', 'payload', {
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
    await MicrofrontendPlatform.startHost([]);

    const headersCaptor = new ObserveCaptor(headersExtractFn);
    Beans.get(PlatformMessageClient).observe$('some-topic').subscribe(headersCaptor);

    Beans.get(PlatformMessageClient).request$('some-topic', 'payload', {
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
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

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
    const manifestUrl = serveManifest({name: 'Host Application', capabilities: [{type: 'some-capability'}]});
    const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
    await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

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
      await MicrofrontendPlatform.startHost([]);

      const subscription = Beans.get(PlatformMessageClient).observe$('some-topic').subscribe();
      await waitUntilSubscriberCount('some-topic', 1);

      const testee = new Subject<void>()
        .pipe(
          takeUntilUnsubscribe('some-topic', PlatformMessageClient),
          timeoutWith(new Date(Date.now() + 2000), throwError('[SpecTimeoutError] Timeout elapsed.')),
        )
        .toPromise();

      // unsubscribe from the topic
      subscription.unsubscribe();

      await expectPromise(testee).toResolve();
    });

    it('should complete the source observable immediately when no subscriber is subscribed', async () => {
      await MicrofrontendPlatform.startHost([]);

      const testee = new Subject<void>()
        .pipe(
          takeUntilUnsubscribe('nobody-subscribed-to-this-topic', PlatformMessageClient),
          timeoutWith(new Date(Date.now() + 500), throwError('[SpecTimeoutError] Timeout elapsed.')),
        )
        .toPromise();

      await expectPromise(testee).toResolve();
    });
  });

  describe('intents with params', () => {

    it('should allow issuing an intent with parameters', async () => {
      const manifestUrl = serveManifest({
        name: 'Host Application', capabilities: [
          {type: 'some-capability-1', requiredParams: ['param']},
          {type: 'some-capability-2', requiredParams: ['param']},
        ],
      });
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

      // request-reply
      Beans.get(IntentClient).observe$<string>({type: 'some-capability-1'}).subscribe(intent => {
        const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
        Beans.get(MessageClient).publish(replyTo, intent.intent.params.get('param'));
      });
      const replyCaptor = new ObserveCaptor(bodyExtractFn);
      await Beans.get(IntentClient).request$({type: 'some-capability-1', params: new Map<string, any>().set('param', 'value')}, 'payload').subscribe(replyCaptor);
      await expectEmissions(replyCaptor).toEqual(['value']);

      // publish
      const observeCaptor = new ObserveCaptor(paramsExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'some-capability-2'}).subscribe(observeCaptor);
      await Beans.get(IntentClient).publish({type: 'some-capability-2', params: new Map<string, any>().set('param', 'value')}, 'payload');
      await expectEmissions(observeCaptor).toEqual(new Map<string, any>().set('param', 'value'));
    });

    it('should allow issuing an intent without optional parameters', async () => {
      const manifestUrl = serveManifest({
        name: 'Host Application', capabilities: [
          {type: 'some-capability-1', optionalParams: ['param']},
          {type: 'some-capability-2', optionalParams: ['param']},
        ],
      });
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

      // request-reply
      Beans.get(IntentClient).observe$<string>({type: 'some-capability-1'}).subscribe(intent => {
        const replyTo = intent.headers.get(MessageHeaders.ReplyTo);
        Beans.get(MessageClient).publish(replyTo, intent.body.toUpperCase());
      });
      const replyCaptor = new ObserveCaptor(bodyExtractFn);
      await Beans.get(IntentClient).request$({type: 'some-capability-1'}, 'payload').subscribe(replyCaptor);
      await expectEmissions(replyCaptor).toEqual(['PAYLOAD']);

      // publish
      const observeCaptor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).observe$<string>({type: 'some-capability-2'}).subscribe(observeCaptor);
      await Beans.get(IntentClient).publish({type: 'some-capability-2'}, 'payload');
      await expectEmissions(observeCaptor).toEqual(['payload']);
    });

    it('should reject an intent if parameters are missing', async () => {
      const manifestUrl = serveManifest({
        name: 'Host Application', capabilities: [
          {type: 'some-type-1', requiredParams: ['param1', 'param2']},
          {type: 'some-type-2', requiredParams: ['param1', 'param2']},
        ],
      });
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

      // request-reply
      const replyCaptor = new ObserveCaptor();
      await Beans.get(IntentClient).request$({type: 'some-type-1', params: new Map<string, any>().set('param1', 'value1')}, 'ping').subscribe(replyCaptor);
      await replyCaptor.waitUntilCompletedOrErrored();
      expect(replyCaptor.getError()).toMatch(/\[ParamMismatchError].*missingRequiredParams=\[param2]/);

      // publish
      await expectPromise(Beans.get(IntentClient).publish({type: 'some-type-2', params: new Map<string, any>().set('param1', 'value1')}, 'ping')).toReject(/ParamMismatchError/);
    });

    it('should reject an intent if it includes non-specified parameter', async () => {
      const manifestUrl = serveManifest({
        name: 'Host Application', capabilities: [
          {type: 'some-type-1', requiredParams: ['param1']},
          {type: 'some-type-2', requiredParams: ['param1']},
        ],
      });
      const registeredApps: ApplicationConfig[] = [{symbolicName: 'host-app', manifestUrl: manifestUrl}];
      await MicrofrontendPlatform.startHost(registeredApps, {symbolicName: 'host-app'});

      // request-reply
      const replyCaptor = new ObserveCaptor();
      await Beans.get(IntentClient).request$({type: 'some-type-1', params: new Map<string, any>().set('param1', 'value1').set('param2', 'value2')}, 'ping').subscribe(replyCaptor);
      await replyCaptor.waitUntilCompletedOrErrored();
      expect(replyCaptor.getError()).toMatch(/\[ParamMismatchError].*unexpectedParams=\[param2]/);

      // publish
      await expectPromise(Beans.get(IntentClient).publish({type: 'some-type-2', params: new Map<string, any>().set('param1', 'value1').set('param2', 'value2')}, 'ping')).toReject(/ParamMismatchError/);
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
 * Expects the message to equal the expected message with its headers to contain at minimum the given map entries (because the platform adds platform-specific headers as well).
 */
function expectMessage(actual: TopicMessage): { toMatch: (expected: TopicMessage) => void } {
  return {
    toMatch: (expected: TopicMessage): void => {
      expect(actual).toEqual(jasmine.objectContaining({
        ...expected,
        headers: jasmine.mapContaining(expected.headers),
      }));
    },
  };
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
async function waitUntilMessageReceived(observable$: Observable<TopicMessage | IntentMessage>, waitUntil: { body: any, timeout?: number }): Promise<void> {
  const timeout = Defined.orElse(waitUntil.timeout, 250);
  await observable$
    .pipe(
      first(msg => Objects.isEqual(msg.body, waitUntil.body)),
      timeoutWith(new Date(Date.now() + timeout), throwError('[SpecTimeoutError] Timeout elapsed.')),
    )
    .toPromise();
}
