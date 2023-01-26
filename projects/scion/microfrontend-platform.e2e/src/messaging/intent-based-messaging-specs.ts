/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestingAppOrigins, TestingAppPO} from '../testing-app.po';
import {MessagingFlavor, PublishMessagePagePO} from './publish-message-page.po';
import {ReceiveMessagePagePO} from './receive-message-page.po';
import {RegisterIntentionPagePO} from '../manifest/register-intention-page.po';
import {RegisterCapabilityPagePO} from '../manifest/register-capability-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {LookupCapabilityPagePO} from '../manifest/lookup-capability-page.po';
import {expect} from '@playwright/test';

/**
 * Contains Specs for intent-based messaging.
 */
export namespace IntendBasedMessagingSpecs { // TODO [#222] Separate messaging-related tests into separate files: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/222

  /**
   * Tests that an intent can only be issued if having declared a respective intention.
   */
  export async function publisherNotQualifiedSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');

    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {key: 'value'});
    await publisherPO.clickPublish();

    await expect(await publisherPO.getPublishError()).toContain('[NotQualifiedError]');
  }

  /**
   * Tests that an intent can only be issued if there is one application at minimum providing a fulfilling capability.
   */
  export async function intentNotFulfilledSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      intentionManager: RegisterIntentionPagePO,
    });

    // register the intention
    const intentionManagerPO = pagePOs.get<RegisterIntentionPagePO>('intentionManager');
    await intentionManagerPO.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {key: 'value'});
    await publisherPO.clickPublish();

    await expect(await publisherPO.getPublishError()).toContain('[NullProviderError]');
  }

  /**
   * Tests that an application can issue intents to its private capabilities without registering an intention.
   * However, because not explicitly registered an intention, the intent should not be transported to other applications which provide a matching, public capability.
   */
  export async function dispatchToOwnPrivateCapabilitiesSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // do not register intention, an application can always issue intents to its private capabilities

    // register the capability of app-3
    const capabilityManager_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await capabilityManager_app3.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: true});

    // register the capability of app-4
    const capabilityManager_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManager_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent in app-3
    const receiverPO_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiverPO_app3.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app3.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app3.clickSubscribe();

    // receive the intent in app-4
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key: 'value'});
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    await expect(await publisherPO_app3.getPublishError()).toBeNull();

    // assert intent to be received in app-3
    const intent = await receiverPO_app3.getFirstMessageOrElseReject();
    await expect(await intent.getIntentType()).toEqual('testing');
    await expect(await intent.getBody()).toEqual('some payload');
    await expect(await intent.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent.getReplyTo()).toBeUndefined();

    // assert intent not to be received in app-4
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application cannot issue intents to private capabilities of other applications.
   */
  export async function rejectDispatchingToPrivateForeignCapabilitiesSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: true});

    // receive the intent
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key: 'value'});
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    // assert intent not to be dispatched
    await expect(await publisherPO_app3.getPublishError()).toContain('[NullProviderError]');

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application can issue intents to its public capabilities without registering an intention.
   * However, because not explicitly registered an intention, the intent should not be transported to other applications which provide a matching, public capability.
   */
  export async function dispatchToOwnPublicCapabilitiesSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // do not register intention, an application can always issue intents to its public capabilities

    // register the capability of app-3
    const capabilityManagerPO_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await capabilityManagerPO_app3.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // register the capability of app-4
    const capabilityManager_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManager_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent in app-3
    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('testing', {key: 'value'});
    await receiverPO.clickSubscribe();

    // receive the intent in app-4
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {key: 'value'});
    await publisherPO.enterMessage('some payload');
    await publisherPO.clickPublish();

    await expect(await publisherPO.getPublishError()).toBeNull();

    // assert intent to be received in app-3
    const intent = await receiverPO.getFirstMessageOrElseReject();
    await expect(await intent.getIntentType()).toEqual('testing');
    await expect(await intent.getBody()).toEqual('some payload');
    await expect(await intent.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent.getReplyTo()).toBeUndefined();

    // assert intent not to be received in app-4
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application can issue intents to public capabilities of other applications.
   */
  export async function dispatchToPublicForeignCapabilitiesSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key: 'value'});
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    await expect(await publisherPO_app3.getPublishError()).toBeNull();

    // assert intent to be received
    const intent = await receiverPO_app4.getFirstMessageOrElseReject();
    await expect(await intent.getIntentType()).toEqual('testing');
    await expect(await intent.getBody()).toEqual('some payload');
    await expect(await intent.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent.getReplyTo()).toBeUndefined();
  }

  /**
   * Tests that an intent is dispatched to multiple applications.
   */
  export async function dispatchToMultipleSubscribersSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app2: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver_app2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver_app3_1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app3_2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app2 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_2});
    await intentionManagerPO_app2.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // register the capability in app-2
    const capabilityManagerPO_app2 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    await capabilityManagerPO_app2.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // register the capability in app-3
    const capabilityManagerPO_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await capabilityManagerPO_app3.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent in app-2
    const receiverPO_app2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app2');
    await receiverPO_app2.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app2.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app2.clickSubscribe();

    // receive the intent in app-3_1
    const receiverPO_app3_1 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3_1');
    await receiverPO_app3_1.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app3_1.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app3_1.clickSubscribe();

    // receive the intent in app-3_2
    const receiverPO_app3_2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3_2');
    await receiverPO_app3_2.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app3_2.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app3_2.clickSubscribe();

    // issue the intent from app-2
    const publisherPO_app2 = pagePOs.get<PublishMessagePagePO>('publisher_app2');
    await publisherPO_app2.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app2.enterIntent('testing', {key: 'value'});
    await publisherPO_app2.enterMessage('some payload');
    await publisherPO_app2.clickPublish();

    await expect(await publisherPO_app2.getPublishError()).toBeNull();

    // assert intent to be received by app-2
    const intent_app2 = await receiverPO_app2.getFirstMessageOrElseReject();
    await expect(await intent_app2.getIntentType()).toEqual('testing');
    await expect(await intent_app2.getBody()).toEqual('some payload');
    await expect(await intent_app2.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent_app2.getReplyTo()).toBeUndefined();

    // assert intent to be received by app-3_1
    const intent_app3_1 = await receiverPO_app3_1.getFirstMessageOrElseReject();
    await expect(await intent_app3_1.getIntentType()).toEqual('testing');
    await expect(await intent_app3_1.getBody()).toEqual('some payload');
    await expect(await intent_app3_1.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent_app3_1.getReplyTo()).toBeUndefined();

    // assert intent to be received by app-3_2
    const intent_app3_2 = await receiverPO_app3_2.getFirstMessageOrElseReject();
    await expect(await intent_app3_2.getIntentType()).toEqual('testing');
    await expect(await intent_app3_2.getBody()).toEqual('some payload');
    await expect(await intent_app3_2.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent_app3_2.getReplyTo()).toBeUndefined();
  }

  /**
   * Tests that an application can receive intents from multiple applications.
   */
  export async function receiveMultipleIntentsSpecs(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key: 'value'});

    // assert receiving the first intent
    await publisherPO_app3.clickPublish();
    const intent1 = await receiverPO_app4.getFirstMessageOrElseReject();
    await expect(await intent1.getIntentType()).toEqual('testing');
    await expect(await intent1.getIntentQualifier()).toEqual({key: 'value'});
    await receiverPO_app4.clickClearMessages();
    await expect(await receiverPO_app4.getMessages()).toEqual([]);

    // assert receiving the second intent
    await publisherPO_app3.clickPublish();
    const intent2 = await receiverPO_app4.getFirstMessageOrElseReject();
    await expect(await intent2.getIntentType()).toEqual('testing');
    await expect(await intent2.getIntentQualifier()).toEqual({key: 'value'});
    await receiverPO_app4.clickClearMessages();
    await expect(await receiverPO_app4.getMessages()).toEqual([]);

    // assert receiving the second intent
    await publisherPO_app3.clickPublish();
    const intent3 = await receiverPO_app4.getFirstMessageOrElseReject();
    await expect(await intent3.getIntentType()).toEqual('testing');
    await expect(await intent3.getIntentQualifier()).toEqual({key: 'value'});
    await receiverPO_app4.clickClearMessages();
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application can reply to an intent.
   */
  export async function replySpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // receive the intent
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing', {key: 'value'});
    await receiverPO_app4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.toggleRequestReply(true);
    await publisherPO_app3.enterIntent('testing', {key: 'value'});
    await publisherPO_app3.clickPublish();

    // assert receiving the intent
    const intent = await receiverPO_app4.getFirstMessageOrElseReject();
    await expect(await intent.getIntentType()).toEqual('testing');
    await expect(await intent.getIntentQualifier()).toEqual({key: 'value'});
    await expect(await intent.getReplyTo()).not.toBeUndefined();

    // send the first reply
    await intent.clickReply();
    const reply1 = await publisherPO_app3.getFirstReplyOrElseReject();
    await expect(await reply1.getReplyTo()).toBeUndefined();
    await expect(await reply1.getBody()).toEqual('this is a reply');
    await publisherPO_app3.clickClearReplies();

    // send the second reply
    await intent.clickReply();
    const reply2 = await publisherPO_app3.getFirstReplyOrElseReject();
    await expect(await reply2.getReplyTo()).toBeUndefined();
    await expect(await reply2.getBody()).toEqual('this is a reply');
    await publisherPO_app3.clickClearReplies();
  }

  /**
   * Tests that intents of interest can be filtered.
   */
  export async function receiveAndFilterSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4_1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
      receiver_app4_2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
      receiver_app4_3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing', qualifier: {key1: 'value1', key2: '*'}});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key1: 'value1', key2: 'value2'}, private: false});

    // receive the intent using qualifier: {key1: 'value1', key2: '*'}
    const receiverPO_app4_1 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_1');
    await receiverPO_app4_1.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_1.enterIntentSelector('testing', {key1: 'value1', key2: '*'});
    await receiverPO_app4_1.clickSubscribe();

    // receive the intent using qualifier: {'*': '*'}
    const receiverPO_app4_2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_2');
    await receiverPO_app4_2.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_2.enterIntentSelector('testing', {'*': '*'});
    await receiverPO_app4_2.clickSubscribe();

    // receive the intent using qualifier: undefined
    const receiverPO_app4_3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_3');
    await receiverPO_app4_3.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_3.enterIntentSelector('testing');
    await receiverPO_app4_3.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key1: 'value1', key2: 'value2'});
    await publisherPO_app3.clickPublish();

    // assert receiving the intent
    await receiverPO_app4_1.getFirstMessageOrElseReject();
    await receiverPO_app4_2.getFirstMessageOrElseReject();
    await receiverPO_app4_3.getFirstMessageOrElseReject();
  }

  /**
   * Tests that intent routing for capabilities declaring params works as expected.
   */
  export async function receiveIfMatchingCapabilityParamsSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app1: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app1 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await intentionManagerPO_app1.registerIntention({type: 'testing'});

    // register the capability
    // app-3: required params: 'param'
    // app-4: optional params: 'param'
    const capabilityManagerPO_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await capabilityManagerPO_app3.registerCapability({type: 'testing', params: [{name: 'param', required: true}], private: false});

    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', params: [{name: 'param', required: false}], private: false});

    // receive the intent in app-3
    const receiverPO_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiverPO_app3.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app3.clickSubscribe();

    // receive the intent in app-4
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.clickSubscribe();

    // issue the intent: {param: 'value'}
    const publisherPO_app1 = pagePOs.get<PublishMessagePagePO>('publisher_app1');
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('testing', undefined, {'param': 'value'});
    await publisherPO_app1.clickPublish();

    // assert receiving the intent
    await expect(await (await receiverPO_app3.getFirstMessageOrElseReject()).getIntentParams()).toEqual({'param': 'value [string]'});
    await expect(await (await receiverPO_app4.getFirstMessageOrElseReject()).getIntentParams()).toEqual({'param': 'value [string]'});

    await receiverPO_app3.clickClearMessages();
    await receiverPO_app4.clickClearMessages();

    // issue the intent without params
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('testing');
    await publisherPO_app1.clickPublish();

    // assert intent not to be dispatched
    await expect(await publisherPO_app1.getPublishError()).toMatch(/IntentParamValidationError/);

    // assert intent not to be received by app 3
    await expect(await receiverPO_app3.getMessages()).toEqual([]);
    // assert intent to be received by app 4 because parameter is marked as optional
    await expect(await receiverPO_app4.getMessages()).toHaveLength(1);
  }

  /**
   * Tests that an application cannot issue intents if params do not match the params of the capability.
   */
  export async function publisherNotMatchingParamsSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app3 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_3});
    await intentionManagerPO_app3.registerIntention({type: 'testing'});

    // register the capability
    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', params: [{name: 'param1', required: true}, {name: 'param2', required: false}], private: false});

    // receive the intent
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.enterIntentSelector('testing');
    await receiverPO_app4.clickSubscribe();

    // issue the intent with required param missing: {'param2': 'value'}
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', undefined, {'param2': 'value'});
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    // assert intent not to be dispatched
    await expect(await publisherPO_app3.getPublishError()).toMatch(/IntentParamValidationError/);

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);

    // issue the intent with additional param: {'param1': 'value', 'unsupported-param': 'value'}
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', undefined, {'param1': 'value', 'unsupported-param': 'value'});
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    // assert intent not to be dispatched
    await expect(await publisherPO_app3.getPublishError()).toMatch(/IntentParamValidationError/);

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that data types of passed parameters are preserved.
   */
  export async function preserveParamDataTypeSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app1: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver_app2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app1 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await intentionManagerPO_app1.registerIntention({type: 'test'});

    // register the capability
    const capabilityManagerPO_app2 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    await capabilityManagerPO_app2.registerCapability({
      type: 'test',
      params: [
        {name: 'param1', required: false},
        {name: 'param2', required: false},
        {name: 'param3', required: false},
        {name: 'param4', required: false},
        {name: 'param5', required: false},
        {name: 'param6', required: false},
        {name: 'param7', required: false},
      ],
      private: false,
    });

    // receive the intent
    const receiverPO_app2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app2');
    await receiverPO_app2.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app2.enterIntentSelector('test');
    await receiverPO_app2.clickSubscribe();

    // issue the intent
    const publisherPO_app1 = pagePOs.get<PublishMessagePagePO>('publisher_app1');
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('test', undefined, {
      'param1': '<string>value</string>',
      'param2': '<boolean>true</boolean>',
      'param3': '<boolean>false</boolean>',
      'param4': '<number>123</number>',
      'param5': '<number>0</number>',
      'param6': '<null>',
      'param7': '<undefined>',
    });
    await publisherPO_app1.clickPublish();

    // assert the received intent
    const params = await (await receiverPO_app2.getFirstMessageOrElseReject()).getIntentParams();
    expect(params).toEqual({
      'param1': 'value [string]',
      'param2': 'true [boolean]',
      'param3': 'false [boolean]',
      'param4': '123 [number]',
      'param5': '0 [number]',
      'param6': 'null [null]',
    });
  }

  /**
   * Tests that parameters associated with the value `null` are not removed.
   */
  export async function preserveNullParamSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      registerCapability: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    });

    // register the capability
    const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
    await registerCapabilityPO.registerCapability({
      type: 'test',
      params: [
        {name: 'param', required: false},
      ],
      private: true,
    });

    // receive the intent
    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('test');
    await receiverPO.clickSubscribe();

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('test', undefined, {'param': '<null>'});
    await publisherPO.clickPublish();

    // assert the received intent
    const params = await (await receiverPO.getFirstMessageOrElseReject()).getIntentParams();
    expect(params).toEqual({'param': 'null [null]'});
  }

  /**
   * Tests that parameters associated with the value `undefined` are removed.
   */
  export async function removeUndefinedParamSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      registerCapability: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    });

    // register the capability
    const registerCapabilityPO = pagePOs.get<RegisterCapabilityPagePO>('registerCapability');
    await registerCapabilityPO.registerCapability({
      type: 'test',
      params: [
        {name: 'param', required: false},
      ],
      private: true,
    });

    // receive the intent
    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('test');
    await receiverPO.clickSubscribe();

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('test', undefined, {'param': '<undefined>'});
    await publisherPO.clickPublish();

    // assert the received intent
    const params = await (await receiverPO.getFirstMessageOrElseReject()).getIntentParams();
    expect(params).toEqual({});
  }

  /**
   * Tests to set headers on a message.
   */
  export async function passHeadersSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      capabilityManager: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    });

    const capabilityManagerPO = pagePOs.get<RegisterCapabilityPagePO>('capabilityManager');
    await capabilityManagerPO.registerCapability({type: 'testing', qualifier: {q1: 'v1', q2: 'v2'}, private: true});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {q1: 'v1', q2: 'v2'});
    await publisherPO.enterHeaders({'header1': 'value', 'header2': '42'});
    await publisherPO.clickPublish();

    await expect(receiverPO.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testing', qualifier: {q1: 'v1', q2: 'v2'}},
      body: '',
      headers: new Map().set('header1', 'value').set('header2', '42'),
    });
  }

  /**
   * Tests intent interception by changing the intent body to upper case characters.
   * The testing app is configured to uppercase the intent body of intents of the type 'uppercase'.
   */
  export async function interceptIntentSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      registrator: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-intent:uppercase', 'uppercase')});

    const capabilityRegisterPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
    await capabilityRegisterPO.registerCapability({type: 'uppercase', qualifier: {}, private: true});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('uppercase');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('uppercase');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect(receiverPO.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'uppercase', qualifier: {}},
      body: 'PAYLOAD',
      headers: new Map(),
    });
  }

  /**
   * Tests intent rejection.
   * The testing app is configured to reject intents of the type 'reject'.
   */
  export async function interceptIntentRejectSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      registrator: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-intent:reject', 'reject')});

    const capabilityRegisterPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
    await capabilityRegisterPO.registerCapability({type: 'reject', qualifier: {}, private: true});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('reject');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('reject');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect(await publisherPO.getPublishError()).toEqual('Intent rejected by interceptor');
    await expect(await receiverPO.getMessages()).toEqual([]);
  }

  /**
   * Tests swallowing an intent.
   * The testing app is configured to swallow intents of the type 'swallow'.
   */
  export async function interceptIntentSwallowSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      registrator: RegisterCapabilityPagePO,
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-intent:swallow', 'swallow')});

    const capabilityRegisterPO = pagePOs.get<RegisterCapabilityPagePO>('registrator');
    await capabilityRegisterPO.registerCapability({type: 'swallow', qualifier: {}, private: true});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('swallow');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('swallow');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect(await receiverPO.getMessages()).toEqual([]);
  }

  /**
   * Tests that the platform resolves to the fulfilling capability.
   */
  export async function resolveCapabilitySpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app: PublishMessagePagePO,
      receiver1_app2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver2_app2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver1_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver2_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // Register intention for app-1
    const intentionManager_app1 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await intentionManager_app1.registerIntention({type: 'testing', qualifier: {key: 'value'}});

    // Provide capability in app-2
    const capabilityManager_app2 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    const capabilityId_app2 = await capabilityManager_app2.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    // Provide capability in app-3
    const capabilityManager_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    const capabilityId_app3 = await capabilityManager_app3.registerCapability({type: 'testing', qualifier: {key: 'value'}, private: false});

    const capabilityLookupPO = await managerOutlet.enterUrl<LookupCapabilityPagePO>({useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_1});

    // Lookup capability of app-2
    await capabilityLookupPO.lookup({id: capabilityId_app2});
    const capability_app2 = (await capabilityLookupPO.getLookedUpCapabilities())[0];

    // Lookup capability of app-3
    await capabilityLookupPO.lookup({id: capabilityId_app3});
    const capability_app3 = (await capabilityLookupPO.getLookedUpCapabilities())[0];

    // Receive intents in app-2 (client-1)
    const receiver1_app2 = pagePOs.get<ReceiveMessagePagePO>('receiver1_app2');
    await receiver1_app2.selectFlavor(MessagingFlavor.Intent);
    await receiver1_app2.clickSubscribe();

    // Receive intents in app-2 (client-2)
    const receiver2_app2 = pagePOs.get<ReceiveMessagePagePO>('receiver2_app2');
    await receiver2_app2.selectFlavor(MessagingFlavor.Intent);
    await receiver2_app2.clickSubscribe();

    // Receive intents in app-3 (client-1)
    const receiver1_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver1_app3');
    await receiver1_app3.selectFlavor(MessagingFlavor.Intent);
    await receiver1_app3.clickSubscribe();

    // Receive intents in app-3 (client-2)
    const receiver2_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver2_app3');
    await receiver2_app3.selectFlavor(MessagingFlavor.Intent);
    await receiver2_app3.clickSubscribe();

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {key: 'value'});
    await publisherPO.clickPublish();

    // verify different capabilities
    await expect(capabilityId_app2).not.toEqual(capabilityId_app3);

    // verify intent received in app-2 with resolved capability `capabilityId_app2` (client-1)
    await expect(receiver1_app2.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app2,
    });

    // verify intent received in app-2 with resolved capability `capabilityId_app2` (client-2)
    await expect(receiver2_app2.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app2,
    });

    // verify intent received in app-3 with resolved capability `capabilityId_app3` (client-1)
    await expect(receiver1_app3.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app3,
    });

    // verify intent received in app-3 with resolved capability `capabilityId_app3` (client-2)
    await expect(receiver2_app3.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app3,
    });
  }

  /**
   * Tests receiving intents which are retained on the broker.
   */
  export async function receiveRetainedIntentsSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver: 'about:blank',
      manager: 'about:blank',
    });

    // register private capability in app-1
    const managerOutletPO = pagePOs.get<BrowserOutletPO>('manager');
    const registerCapabilityApp1PO = await managerOutletPO.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_1});
    await registerCapabilityApp1PO.registerCapability({type: 'temperature', qualifier: {room: 'kitchen'}, private: true});

    // register public capability in app-2
    const registerCapabilityApp2PO = await managerOutletPO.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    await registerCapabilityApp2PO.registerCapability({type: 'temperature', qualifier: {room: 'kitchen'}, private: false});

    // register private capability in app-3
    const registerCapabilityApp3PO = await managerOutletPO.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await registerCapabilityApp3PO.registerCapability({type: 'temperature', qualifier: {room: 'kitchen'}, private: true});

    // register intention in app-1
    const registerIntentionApp1PO = await managerOutletPO.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await registerIntentionApp1PO.registerIntention({type: 'temperature', qualifier: {room: 'kitchen'}});

    // publish a retained intent in app-1
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('temperature', {room: 'kitchen'});
    await publisherPO.enterMessage('22°C');
    await publisherPO.toggleRetain(true);
    await publisherPO.clickPublish();

    const receiverOutletPO = pagePOs.get<BrowserOutletPO>('receiver');

    // test to receive retained intent in app-1
    const receiverApp1PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_1});
    await receiverApp1PO.selectFlavor(MessagingFlavor.Intent);
    await receiverApp1PO.enterIntentSelector('temperature', {room: 'kitchen'});
    await receiverApp1PO.clickSubscribe();
    await expect(await (await receiverApp1PO.getFirstMessageOrElseReject()).getBody()).toEqual('22°C');

    // test to receive retained intent in app-2
    const receiverApp2PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2});
    await receiverApp2PO.selectFlavor(MessagingFlavor.Intent);
    await receiverApp1PO.enterIntentSelector('temperature', {room: 'kitchen'});
    await receiverApp2PO.clickSubscribe();
    await expect(await (await receiverApp2PO.getFirstMessageOrElseReject()).getBody()).toEqual('22°C');
    await receiverApp2PO.clickClearMessages();

    // test not to receive the retained message in app-3
    const receiverApp3PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3});
    await receiverApp3PO.selectFlavor(MessagingFlavor.Intent);
    await receiverApp3PO.enterIntentSelector('temperature', {room: 'kitchen'});
    await receiverApp3PO.clickSubscribe();
    await expect(receiverApp3PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);

    // clear the retained intent
    await publisherPO.enterMessage('');
    await publisherPO.clickPublish();

    // expect the empty message not to be dispatched
    await expect(receiverApp1PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
    await expect(receiverApp2PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
  }

  /**
   * Tests receiving requests which are retained on the broker.
   */
  export async function receiveRetainedRequestsSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      manager: 'about:blank',
    });

    // register public capability in app-2
    const managerOutletPO = pagePOs.get<BrowserOutletPO>('manager');
    const registerCapabilityApp1PO = await managerOutletPO.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    await registerCapabilityApp1PO.registerCapability({type: 'temperature', qualifier: {room: 'kitchen'}, private: false});

    // register intention in app-1
    const registerIntentionApp1PO = await managerOutletPO.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await registerIntentionApp1PO.registerIntention({type: 'temperature', qualifier: {room: 'kitchen'}});

    // publish a retained request from app-1
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('temperature', {room: 'kitchen'});
    await publisherPO.toggleRetain(true);
    await publisherPO.toggleRequestReply(true);
    await publisherPO.clickPublish();

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');

    // test to receive retained intent in app-2
    await receiverPO.selectFlavor(MessagingFlavor.Intent);
    await receiverPO.enterIntentSelector('temperature', {room: 'kitchen'});
    await receiverPO.clickSubscribe();
    const requestPO = await receiverPO.getFirstMessageOrElseReject();
    const replyTo = await requestPO.getReplyTo();

    // send reply
    await requestPO.clickReply();

    // expect the reply to be received
    const reply1PO = await publisherPO.getFirstReplyOrElseReject();
    await expect(await reply1PO.getTopic()).toEqual(replyTo);
    await expect(await reply1PO.getBody()).toEqual('this is a reply');
    await expect(await reply1PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect(await publisherPO.getReplies()).toEqual([]);

    // send another reply
    await requestPO.clickReply();
    const replyPO = await publisherPO.getFirstReplyOrElseReject();
    await expect(await replyPO.getTopic()).toEqual(replyTo);
    await expect(await replyPO.getBody()).toEqual('this is a reply');
    await expect(await replyPO.getReplyTo()).toBeUndefined();

    // cancel subscription of requestor
    await publisherPO.clickCancel();

    // expect retained request to be deleted
    await receiverPO.clickUnsubscribe();
    await receiverPO.clickSubscribe();
    await expect(receiverPO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
  }

  /**
   * Tests that the capability is present on the intent message to be intercepted.
   * The interceptor continues the interceptor chain with the message body replaced with the stringified capability.
   */
  export async function interceptIntentCapabilityPresentSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app: PublishMessagePagePO,
      receiver_app2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    }, {queryParams: new Map().set('intercept-intent:capability-present', 'testee')});

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // Register intention for app-1
    const intentionManager_app1 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await intentionManager_app1.registerIntention({type: 'testee'});

    // Provide capability in app-2
    const capabilityManager_app2 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_2});
    const capabilityId_app2 = await capabilityManager_app2.registerCapability({type: 'testee', private: false});

    // Provide capability in app-3
    const capabilityManager_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    const capabilityId_app3 = await capabilityManager_app3.registerCapability({type: 'testee', private: false});

    const capabilityLookupPO = await managerOutlet.enterUrl<LookupCapabilityPagePO>({useClass: LookupCapabilityPagePO, origin: TestingAppOrigins.APP_1});

    // Lookup capability of app-2
    await capabilityLookupPO.lookup({id: capabilityId_app2});
    const capability_app2 = (await capabilityLookupPO.getLookedUpCapabilities())[0];

    // Lookup capability of app-3
    await capabilityLookupPO.lookup({id: capabilityId_app3});
    const capability_app3 = (await capabilityLookupPO.getLookedUpCapabilities())[0];

    // Receive intents in app-2
    const receiver_app2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app2');
    await receiver_app2.selectFlavor(MessagingFlavor.Intent);
    await receiver_app2.clickSubscribe();

    // Receive intents in app-3
    const receiver_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiver_app3.selectFlavor(MessagingFlavor.Intent);
    await receiver_app3.clickSubscribe();

    // issue the intent
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app');
    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testee');
    await publisherPO.clickPublish();

    // verify the interceptor to have replaced the message body with the stringified capability.
    await expect(receiver_app2.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testee', qualifier: {}},
      body: JSON.stringify(capability_app2),
      headers: new Map(),
      capability: capability_app2,
    });

    // verify the interceptor to have replaced the message body with the stringified capability.
    await expect(receiver_app3.getFirstMessageOrElseReject()).toMatchIntentMessage({
      intent: {type: 'testee', qualifier: {}},
      body: JSON.stringify(capability_app3),
      headers: new Map(),
      capability: capability_app3,
    });
  }
}
