/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
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
import {expectToBeRejectedWithError} from '../spec.util';
import {MessageListItemPO} from './message-list-item.po';
import {Capability, IntentMessage} from '@scion/microfrontend-platform';
import {LookupCapabilityPagePO} from '../manifest/lookup-capability-page.po';

const anyCapability: Capability = {} as any;

/**
 * Contains Specs for intent-based messaging.
 */
export namespace IntendBasedMessagingSpecs {

  /**
   * Tests that an intent can only be issued if having declared a respective intention.
   */
  export async function publisherNotQualifiedSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');

    await publisherPO.selectFlavor(MessagingFlavor.Intent);
    await publisherPO.enterIntent('testing', {key: 'value'});
    await publisherPO.clickPublish();

    await expect(publisherPO.getPublishError()).toContain('[NotQualifiedError]');
  }

  /**
   * Tests that an intent can only be issued if there is one application at minimum providing a respective capability.
   */
  export async function intentNotFulfilledSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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

    await expect(publisherPO.getPublishError()).toContain('[NullProviderError]');
  }

  /**
   * Tests that an application can issue intents to its private capabilities without registering an intention.
   * However, because not explicitly registered an intention, the intent should not be transported to other applications which provide a matching, public capability.
   */
  export async function dispatchToOwnPrivateCapabilitiesSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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

    await expect(publisherPO_app3.getPublishError()).toBeNull();

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
  export async function rejectDispatchingToPrivateForeignCapabilitiesSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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
    await expect(publisherPO_app3.getPublishError()).toContain('[NullProviderError]');

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application can issue intents to its public capabilities without registering an intention.
   * However, because not explicitly registered an intention, the intent should not be transported to other applications which provide a matching, public capability.
   */
  export async function dispatchToOwnPublicCapabilitiesSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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

    await expect(publisherPO.getPublishError()).toBeNull();

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
  export async function dispatchToPublicForeignCapabilitiesSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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

    await expect(publisherPO_app3.getPublishError()).toBeNull();

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
  export async function dispatchToMultipleSubscribersSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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

    await expect(publisherPO_app2.getPublishError()).toBeNull();

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
  export async function receiveMultipleIntentsSpecs(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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
  export async function replySpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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
  export async function receiveAndFilterSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4_1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
      receiver_app4_2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
      receiver_app4_3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
      receiver_app4_4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
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

    // receive the intent using qualifier: {key1: 'value1', key2: '*', key3: '?'}
    const receiverPO_app4_2 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_2');
    await receiverPO_app4_2.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_2.enterIntentSelector('testing', {key1: 'value1', key2: '*', key3: '?'});
    await receiverPO_app4_2.clickSubscribe();

    // receive the intent using qualifier: {'*': '*'}
    const receiverPO_app4_3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_3');
    await receiverPO_app4_3.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_3.enterIntentSelector('testing', {'*': '*'});
    await receiverPO_app4_3.clickSubscribe();

    // receive the intent using qualifier: undefined
    const receiverPO_app4_4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4_4');
    await receiverPO_app4_4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4_4.enterIntentSelector('testing');
    await receiverPO_app4_4.clickSubscribe();

    // issue the intent
    const publisherPO_app3 = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', {key1: 'value1', key2: 'value2'});
    await publisherPO_app3.clickPublish();

    // assert receiving the intent
    await receiverPO_app4_1.getFirstMessageOrElseReject();
    await receiverPO_app4_2.getFirstMessageOrElseReject();
    await receiverPO_app4_3.getFirstMessageOrElseReject();
    await receiverPO_app4_4.getFirstMessageOrElseReject();
  }

  /**
   * Tests that intent routing for capabilities declaring wildcard characters works as expected.
   */
  export async function receiveIfMatchingCapabilityWildcardQualifierSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

    const pagePOs = await testingAppPO.navigateTo({
      managerOutlet: 'about:blank',
      publisher_app1: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_app4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const managerOutlet = pagePOs.get<BrowserOutletPO>('managerOutlet');

    // register the intention
    const intentionManagerPO_app1 = await managerOutlet.enterUrl<RegisterIntentionPagePO>({useClass: RegisterIntentionPagePO, origin: TestingAppOrigins.APP_1});
    await intentionManagerPO_app1.registerIntention({type: 'testing', qualifier: {'*': '*'}});

    // register the capability
    // app-3: {key1: 'value1', key2: '*'}
    // app-4: {key1: 'value1', key2: '?'}
    const capabilityManagerPO_app3 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_3});
    await capabilityManagerPO_app3.registerCapability({type: 'testing', qualifier: {key1: 'value1', key2: '*'}, private: false});

    const capabilityManagerPO_app4 = await managerOutlet.enterUrl<RegisterCapabilityPagePO>({useClass: RegisterCapabilityPagePO, origin: TestingAppOrigins.APP_4});
    await capabilityManagerPO_app4.registerCapability({type: 'testing', qualifier: {key1: 'value1', key2: '?'}, private: false});

    // receive the intent in app-3
    const receiverPO_app3 = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiverPO_app3.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app3.clickSubscribe();

    // receive the intent in app-4
    const receiverPO_app4 = pagePOs.get<ReceiveMessagePagePO>('receiver_app4');
    await receiverPO_app4.selectFlavor(MessagingFlavor.Intent);
    await receiverPO_app4.clickSubscribe();

    // issue the intent: {key1: 'value1', key2: 'value2'}
    const publisherPO_app1 = pagePOs.get<PublishMessagePagePO>('publisher_app1');
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('testing', {key1: 'value1', key2: 'value2'});
    await publisherPO_app1.clickPublish();

    // assert receiving the intent
    await expect(await (await receiverPO_app3.getFirstMessageOrElseReject()).getIntentQualifier()).toEqual({'key1': 'value1', 'key2': 'value2'});
    await expect(await (await receiverPO_app4.getFirstMessageOrElseReject()).getIntentQualifier()).toEqual({'key1': 'value1', 'key2': 'value2'});

    await receiverPO_app3.clickClearMessages();
    await receiverPO_app4.clickClearMessages();

    // issue the intent: {key1: 'value1'}
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('testing', {key1: 'value1'});
    await publisherPO_app1.clickPublish();

    // assert receiving the intent
    await expectToBeRejectedWithError(receiverPO_app3.getFirstMessageOrElseReject(), /[TimeoutError]/);
    await expect(await (await receiverPO_app4.getFirstMessageOrElseReject()).getIntentQualifier()).toEqual({'key1': 'value1'});
    await receiverPO_app3.clickClearMessages();
    await receiverPO_app4.clickClearMessages();
  }

  /**
   * Tests that intent routing for capabilities declaring params works as expected.
   */
  export async function receiveIfMatchingCapabilityParamsSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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
    await publisherPO_app1.enterIntent('testing', undefined, new Map<string, any>().set('param', 'value'));
    await publisherPO_app1.clickPublish();

    // assert receiving the intent
    await expect(await (await receiverPO_app3.getFirstMessageOrElseReject()).getIntentParams()).toEqual(new Map<string, any>().set('param', 'value'));
    await expect(await (await receiverPO_app4.getFirstMessageOrElseReject()).getIntentParams()).toEqual(new Map<string, any>().set('param', 'value'));

    await receiverPO_app3.clickClearMessages();
    await receiverPO_app4.clickClearMessages();

    // issue the intent without params
    await publisherPO_app1.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app1.enterIntent('testing');
    await publisherPO_app1.clickPublish();

    // assert intent not to be dispatched
    await expect(publisherPO_app1.getPublishError()).toContain('[ParamMismatchError]');

    // assert intent not to be received
    await expect(await receiverPO_app3.getMessages()).toEqual([]);
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests that an application cannot issue intents if params do not match the params of the capability.
   */
  export async function publisherNotMatchingParamsSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();

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
    await publisherPO_app3.enterIntent('testing', undefined, new Map<string, any>().set('param2', 'value'));
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    // assert intent not to be dispatched
    await expect(publisherPO_app3.getPublishError()).toContain('[ParamMismatchError]');

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);

    // issue the intent with additional param: {'param1': 'value', 'unsupported-param': 'value'}
    await publisherPO_app3.selectFlavor(MessagingFlavor.Intent);
    await publisherPO_app3.enterIntent('testing', undefined, new Map<string, any>().set('param1', 'value').set('unsupported-param', 'value'));
    await publisherPO_app3.enterMessage('some payload');
    await publisherPO_app3.clickPublish();

    // assert intent not to be dispatched
    await expect(publisherPO_app3.getPublishError()).toContain('[ParamMismatchError]');

    // assert intent not to be received
    await expect(await receiverPO_app4.getMessages()).toEqual([]);
  }

  /**
   * Tests to set headers on a message.
   */
  export async function passHeadersSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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
    await publisherPO.enterHeaders(new Map().set('header1', 'value').set('header2', '42'));
    await publisherPO.clickPublish();

    await expectIntent(receiverPO.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testing', qualifier: {q1: 'v1', q2: 'v2'}},
      body: '',
      headers: new Map().set('header1', 'value').set('header2', '42'),
      capability: anyCapability,
    });
  }

  /**
   * Tests intent interception by changing the intent body to upper case characters.
   * The testing app is configured to uppercase the intent body of intents of the type 'uppercase'.
   */
  export async function interceptIntentSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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

    await expectIntent(receiverPO.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'uppercase', qualifier: {}},
      body: 'PAYLOAD',
      headers: new Map(),
      capability: anyCapability,
    });
  }

  /**
   * Tests intent rejection.
   * The testing app is configured to reject intents of the type 'reject'.
   */
  export async function interceptIntentRejectSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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
  export async function interceptIntentSwallowSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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
   * Tests that the platform resolves to the satisfying capability.
   */
  export async function resolveCapabilitySpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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
    await expectIntent(receiver1_app2.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app2,
    });

    // verify intent received in app-2 with resolved capability `capabilityId_app2` (client-2)
    await expectIntent(receiver2_app2.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app2,
    });

    // verify intent received in app-3 with resolved capability `capabilityId_app3` (client-1)
    await expectIntent(receiver1_app3.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app3,
    });

    // verify intent received in app-3 with resolved capability `capabilityId_app3` (client-2)
    await expectIntent(receiver2_app3.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testing', qualifier: {key: 'value'}},
      headers: new Map(),
      capability: capability_app3,
    });
  }

  /**
   * Tests that the capability is present on the intent message to be intercepted.
   * The interceptor continues the interceptor chain with the message body replaced with the stringified capability.
   */
  export async function interceptIntentCapabilityPresentSpec(): Promise<void> {
    const testingAppPO = new TestingAppPO();
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
    await expectIntent(receiver_app2.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testee', qualifier: {}},
      body: JSON.stringify(capability_app2),
      headers: new Map(),
      capability: capability_app2,
    });

    // verify the interceptor to have replaced the message body with the stringified capability.
    await expectIntent(receiver_app3.getFirstMessageOrElseReject()).toEqual({
      intent: {type: 'testee', qualifier: {}},
      body: JSON.stringify(capability_app3),
      headers: new Map(),
      capability: capability_app3,
    });
  }

  /**
   * Expects the intent to equal the expected intent with its headers to contain at minimum the given map entries.
   */
  function expectIntent(actual: Promise<MessageListItemPO>): {toEqual: (expected: IntentMessage) => void} {
    return {
      toEqual: async (expected: IntentMessage): Promise<void> => {
        const actualMessage = await actual;
        await expect(await actualMessage.getIntentType()).toEqual(expected.intent.type);
        await expect(await actualMessage.getIntentQualifier()).toEqual(expected.intent.qualifier);
        if (expected.body !== undefined) {
          await expect(actualMessage.getBody()).toEqual(expected.body);
        }
        if (expected.capability !== anyCapability) {
          await expect(await actualMessage.getCapability()).toEqual(expected.capability);
        }
        // Jasmine 3.5 provides 'mapContaining' matcher; when updated, this custom matcher can be removed.
        await expect([...await actualMessage.getHeaders()]).toEqual(jasmine.arrayContaining([...expected.headers]));
      },
    };
  }
}
