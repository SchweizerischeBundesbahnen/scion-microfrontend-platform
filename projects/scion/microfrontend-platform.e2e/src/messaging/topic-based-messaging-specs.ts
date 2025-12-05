/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Outlets, TestingAppOrigins, TestingAppPO} from '../testing-app.po';
import {MessagingFlavor, PublishMessagePagePO} from './publish-message-page.po';
import {ReceiveMessagePagePO} from './receive-message-page.po';
import {BrowserOutletPO} from '../browser-outlet/browser-outlet.po';
import {expect} from '@playwright/test';
import {OutletRouterPagePO} from '../router-outlet/outlet-router-page.po';
import {RouterOutletPagePO} from '../router-outlet/router-outlet-page.po';
import {ClearOutletThenSendMessageTestPagePO} from '../test-pages/clear-outlet-then-send-message-test-page.po';
import {ConsoleLogs} from '../console-logs';

/**
 * Contains Specs for topic-based messaging.
 */
export namespace TopicBasedMessagingSpecs { // TODO [#222] Separate messaging-related tests into separate files: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/222

  export namespace RootOutlets {

    /**
     * Tests that messages can be published and received.
     */
    export async function publishSpec(testingAppPO: TestingAppPO, publisherOrigin: string, receiverOrigin: string): Promise<void> {
      await testPublishInternal(testingAppPO, {
        publisher: {useClass: PublishMessagePagePO, origin: publisherOrigin},
        receiver: {useClass: ReceiveMessagePagePO, origin: receiverOrigin},
      });
    }

    /**
     * Tests that an application can reply to a message.
     */
    export async function replySpec(testingAppPO: TestingAppPO, publisherOrigin: string, receiverOrigin: string): Promise<void> {
      await testReplyInternal(testingAppPO, {
        publisher: {useClass: PublishMessagePagePO, origin: publisherOrigin},
        receiver: {useClass: ReceiveMessagePagePO, origin: receiverOrigin},
      });
    }
  }

  export namespace ChildOutlets {

    /**
     * Tests that messages can be published and received.
     */
    export async function publishSpec(testingAppPO: TestingAppPO, publisherOrigin: string, receiverOrigin: string): Promise<void> {
      await testPublishInternal(testingAppPO, {
        outlet1: {
          outlet2: {
            publisher: {useClass: PublishMessagePagePO, origin: publisherOrigin},
          },
        },
        outlet3: {
          outlet4: {
            outlet5: {
              receiver: {useClass: ReceiveMessagePagePO, origin: receiverOrigin},
            },
          },
        },
      });
    }

    /**
     * Tests that an application can reply to a message.
     */
    export async function replySpec(testingAppPO: TestingAppPO, publisherOrigin: string, receiverOrigin: string): Promise<void> {
      await testReplyInternal(testingAppPO, {
        outlet1: {
          outlet2: {
            publisher: {useClass: PublishMessagePagePO, origin: publisherOrigin},
          },
        },
        outlet3: {
          outlet4: {
            outlet5: {
              receiver: {useClass: ReceiveMessagePagePO, origin: receiverOrigin},
            },
          },
        },
      });
    }
  }

  /**
   * Tests that messages can be published and received.
   */
  async function testPublishInternal(testingAppPO: TestingAppPO, testSetup: Outlets): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo(testSetup);

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('some-topic');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.enterMessage('first message');

    // publish the first message
    await publisherPO.clickPublish();

    const message1PO = await receiverPO.getFirstMessageOrElseReject();
    await expect.poll(() => message1PO.getTopic()).toEqual('some-topic');
    await expect.poll(() => message1PO.getBody()).toEqual('first message');
    await expect.poll(() => message1PO.getReplyTo()).toBeUndefined();

    // clear the messages list
    await receiverPO.clickClearMessages();
    await expect.poll(() => receiverPO.getMessages()).toEqual([]);

    // publish a second message
    await publisherPO.enterMessage('second message');
    await publisherPO.clickPublish();

    const message2PO = await receiverPO.getFirstMessageOrElseReject();
    await expect.poll(() => message2PO.getTopic()).toEqual('some-topic');
    await expect.poll(() => message2PO.getBody()).toEqual('second message');
    await expect.poll(() => message2PO.getReplyTo()).toBeUndefined();

    // clear the messages list
    await receiverPO.clickClearMessages();
    await expect.poll(() => receiverPO.getMessages()).toEqual([]);

    // publish a third message
    await publisherPO.enterMessage('third message');
    await publisherPO.clickPublish();

    const message3PO = await receiverPO.getFirstMessageOrElseReject();
    await expect.poll(() => message3PO.getTopic()).toEqual('some-topic');
    await expect.poll(() => message3PO.getBody()).toEqual('third message');
    await expect.poll(() => message3PO.getReplyTo()).toBeUndefined();
  }

  /**
   * Tests that an application can reply to a message.
   */
  async function testReplyInternal(testingAppPO: TestingAppPO, testSetup: Outlets): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo(testSetup);

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('some-topic');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.enterMessage('some-payload');
    await publisherPO.toggleRequestReply(true);
    await publisherPO.clickPublish();

    const messagePO = await receiverPO.getFirstMessageOrElseReject();
    const replyTo = await messagePO.getReplyTo();
    await expect.poll(() => replyTo).not.toBeUndefined();

    // send a reply
    await messagePO.clickReply();

    const reply1PO = await publisherPO.getFirstReplyOrElseReject();
    await expect.poll(() => reply1PO.getTopic()).toEqual(replyTo);
    await expect.poll(() => reply1PO.getBody()).toEqual('this is a reply');
    await expect.poll(() => reply1PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect.poll(() => publisherPO.getReplies()).toEqual([]);

    // send a second reply
    await messagePO.clickReply();
    const reply2PO = await publisherPO.getFirstReplyOrElseReject();
    await expect.poll(() => reply2PO.getTopic()).toEqual(replyTo);
    await expect.poll(() => reply2PO.getBody()).toEqual('this is a reply');
    await expect.poll(() => reply2PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect.poll(() => publisherPO.getReplies()).toEqual([]);

    // send a third reply
    await messagePO.clickReply();
    const reply3PO = await publisherPO.getFirstReplyOrElseReject();
    await expect.poll(() => reply3PO.getTopic()).toEqual(replyTo);
    await expect.poll(() => reply3PO.getBody()).toEqual('this is a reply');
    await expect.poll(() => reply3PO.getReplyTo()).toBeUndefined();
  }

  /**
   * Tests that a message is dispatched to multiple subscribers.
   */
  export async function subscribersReceiveSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');

    const receiver1PO = pagePOs.get<ReceiveMessagePagePO>('receiver1');
    await receiver1PO.selectFlavor(MessagingFlavor.Topic);
    await receiver1PO.enterTopic('some-topic');
    await receiver1PO.clickSubscribe();

    const receiver2PO = pagePOs.get<ReceiveMessagePagePO>('receiver2');
    await receiver2PO.selectFlavor(MessagingFlavor.Topic);
    await receiver2PO.enterTopic('some-topic');
    await receiver2PO.clickSubscribe();

    const receiver3PO = pagePOs.get<ReceiveMessagePagePO>('receiver3');
    await receiver3PO.selectFlavor(MessagingFlavor.Topic);
    await receiver3PO.enterTopic('some-topic');
    await receiver3PO.clickSubscribe();

    // publish the first message
    await publisherPO.enterMessage('first message');
    await publisherPO.clickPublish();

    await expect.poll(() => receiver1PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('first message');
    await expect.poll(() => receiver2PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('first message');
    await expect.poll(() => receiver3PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('first message');

    // clear the messages
    await receiver1PO.clickClearMessages();
    await receiver2PO.clickClearMessages();
    await receiver3PO.clickClearMessages();

    // publish the second message
    await publisherPO.enterMessage('second message');
    await publisherPO.clickPublish();

    await expect.poll(() => receiver1PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('second message');
    await expect.poll(() => receiver2PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('second message');
    await expect.poll(() => receiver3PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('second message');
  }

  /**
   * Tests that publishing a request to a topic throws an error when no replier is subscribed to the topic.
   */
  export async function throwIfNoReplierFoundSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.toggleRequestReply(true);
    await publisherPO.clickPublish();

    await expect.poll(() => publisherPO.getPublishError()).toContain('[MessagingError]');
  }

  /**
   * Tests receiving replies of multiple message subscribers.
   */
  export async function subscribersReplySpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.toggleRequestReply(true);

    const receiver1PO = pagePOs.get<ReceiveMessagePagePO>('receiver1');
    await receiver1PO.selectFlavor(MessagingFlavor.Topic);
    await receiver1PO.enterTopic('some-topic');
    await receiver1PO.clickSubscribe();

    const receiver2PO = pagePOs.get<ReceiveMessagePagePO>('receiver2');
    await receiver2PO.selectFlavor(MessagingFlavor.Topic);
    await receiver2PO.enterTopic('some-topic');
    await receiver2PO.clickSubscribe();

    const receiver3PO = pagePOs.get<ReceiveMessagePagePO>('receiver3');
    await receiver3PO.selectFlavor(MessagingFlavor.Topic);
    await receiver3PO.enterTopic('some-topic');
    await receiver3PO.clickSubscribe();

    // publish the message
    await publisherPO.enterMessage('message');
    await publisherPO.clickPublish();

    // send a replies from every subscriber
    await (await receiver1PO.getFirstMessageOrElseReject()).clickReply();
    await expect.poll(() => publisherPO.getFirstReplyOrElseReject().then(message => message.getBody())).toEqual('this is a reply');
    await publisherPO.clickClearReplies();

    await (await receiver2PO.getFirstMessageOrElseReject()).clickReply();
    await expect.poll(() => publisherPO.getFirstReplyOrElseReject().then(message => message.getBody())).toEqual('this is a reply');
    await publisherPO.clickClearReplies();

    await (await receiver3PO.getFirstMessageOrElseReject()).clickReply();
    await expect.poll(() => publisherPO.getFirstReplyOrElseReject().then(message => message.getBody())).toEqual('this is a reply');
    await publisherPO.clickClearReplies();
  }

  /**
   * Tests topic subscription count to work as expected.
   */
  export async function subscriberCountSpec(testingAppPO: TestingAppPO): Promise<void> {

    const pagePOs = await testingAppPO.navigateTo({
      publisher_app3: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app3');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);

    // 'receiver1' subscribes to 'topic-1'
    const receiver1PO = pagePOs.get<ReceiveMessagePagePO>('receiver1');
    await receiver1PO.selectFlavor(MessagingFlavor.Topic);
    await receiver1PO.enterTopic('topic-1');
    await receiver1PO.clickSubscribe();

    // 'receiver2' subscribes to 'topic-2'
    const receiver2PO = pagePOs.get<ReceiveMessagePagePO>('receiver2');
    await receiver2PO.selectFlavor(MessagingFlavor.Topic);
    await receiver2PO.enterTopic('topic-2');
    await receiver2PO.clickSubscribe();

    // 'receiver3' subscribes to 'topic-3'
    const receiver3PO = pagePOs.get<ReceiveMessagePagePO>('receiver3');
    await receiver3PO.selectFlavor(MessagingFlavor.Topic);
    await receiver3PO.enterTopic('topic-3');
    await receiver3PO.clickSubscribe();

    // 'receiver4' subscribes to 'topic-2'
    const receiver4PO = pagePOs.get<ReceiveMessagePagePO>('receiver4');
    await receiver4PO.selectFlavor(MessagingFlavor.Topic);
    await receiver4PO.enterTopic('topic-2');
    await receiver4PO.clickSubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    await receiver1PO.clickUnsubscribe();
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);
    await receiver1PO.clickSubscribe();
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(2);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unsubscribe 'receiver1'
    await receiver1PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(2);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unsubscribe 'receiver2'
    await receiver2PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unload page of 'receiver3'
    const outlet = pagePOs.get<BrowserOutletPO>('receiver3:outlet');
    await outlet.enterUrl('about:blank');

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // unsubscribe 'receiver4'
    await receiver4PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect.poll(() => publisherPO.getTopicSubscriberCount()).toEqual(0);
  }

  /**
   * Tests receiving messages which are retained on the broker.
   */
  export async function receiveRetainedMessagesSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher_app2: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver: 'about:blank',
    });

    // publish a retained message
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app2');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.toggleRetain(true);
    await publisherPO.enterMessage('retained message');
    await publisherPO.clickPublish();

    const receiverOutletPO = pagePOs.get<BrowserOutletPO>('receiver');

    // test to receive retained message in app-1
    const receiverApp1PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_1});
    await receiverApp1PO.selectFlavor(MessagingFlavor.Topic);
    await receiverApp1PO.enterTopic('some-topic');
    await receiverApp1PO.clickSubscribe();
    await expect.poll(() => receiverApp1PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('retained message');

    // test to receive retained message in app-2
    const receiverApp2PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2});
    await receiverApp2PO.selectFlavor(MessagingFlavor.Topic);
    await receiverApp2PO.enterTopic('some-topic');
    await receiverApp2PO.clickSubscribe();
    await expect.poll(() => receiverApp2PO.getFirstMessageOrElseReject().then(message => message.getBody())).toEqual('retained message');
    await receiverApp2PO.clickClearMessages();

    // clear the retained message
    await publisherPO.enterMessage('');
    await publisherPO.clickPublish();

    // expect the empty message not to be dispatched
    await expect(receiverApp2PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);

    // test not to receive the retained message in app-4
    const receiverApp4PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4});
    await receiverApp4PO.selectFlavor(MessagingFlavor.Topic);
    await receiverApp4PO.enterTopic('some-topic');
    await receiverApp4PO.clickSubscribe();

    await expect(receiverApp4PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
  }

  /**
   * Tests receiving requests which are retained on the broker.
   */
  export async function receiveRetainedRequestsSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher_app2: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver: 'about:blank',
    });

    // publish a retained request from app-1
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app2');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.toggleRetain(true);
    await publisherPO.toggleRequestReply(true);
    await publisherPO.enterMessage('retained request');
    await publisherPO.clickPublish();

    const receiverOutletPO = pagePOs.get<BrowserOutletPO>('receiver');

    // test to receive retained message in app-2
    const receiverPO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2});
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('some-topic');
    await receiverPO.clickSubscribe();
    const requestPO = await receiverPO.getFirstMessageOrElseReject();
    const replyTo = await requestPO.getReplyTo();
    await expect.poll(() => requestPO.getBody()).toEqual('retained request');
    await expect.poll(() => replyTo).not.toBeUndefined();

    // send reply
    await requestPO.clickReply();

    // expect the reply to be received
    const reply1PO = await publisherPO.getFirstReplyOrElseReject();
    await expect.poll(() => reply1PO.getTopic()).toEqual(replyTo);
    await expect.poll(() => reply1PO.getBody()).toEqual('this is a reply');
    await expect.poll(() => reply1PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect.poll(() => publisherPO.getReplies()).toEqual([]);

    // send another reply
    await requestPO.clickReply();
    const replyPO = await publisherPO.getFirstReplyOrElseReject();
    await expect.poll(() => replyPO.getTopic()).toEqual(replyTo);
    await expect.poll(() => replyPO.getBody()).toEqual('this is a reply');
    await expect.poll(() => replyPO.getReplyTo()).toBeUndefined();

    // cancel subscription of requestor
    await publisherPO.clickCancel();

    // expect retained request to be deleted
    await receiverPO.clickUnsubscribe();
    await receiverPO.clickSubscribe();
    await expect(receiverPO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
  }

  /**
   * Tests receiving messages without a payload.
   */
  export async function receiveMessagesWithoutPayloadSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher_app2: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver_app3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
    });

    // test to receive retained message in app-3
    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver_app3');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('some-topic');
    await receiverPO.clickSubscribe();

    // publish a retained message
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher_app2');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.clickPublish();

    await expect.poll(() => receiverPO.getFirstMessageOrElseReject().then(message => message.getTopic())).toEqual('some-topic');
  }

  /**
   * Tests receiving multiple message simultaneously if specifying wildcard topic segments.
   */
  export async function subscribeToMultipleTopicsSimultaneouslySpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: {useClass: PublishMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver_1: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_1},
      receiver_2: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2},
      receiver_3: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_3},
      receiver_4: {useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4},
    });

    const receiver1PO = pagePOs.get<ReceiveMessagePagePO>('receiver_1');
    await receiver1PO.selectFlavor(MessagingFlavor.Topic);
    await receiver1PO.enterTopic('myhome/livingroom/temperature');
    await receiver1PO.clickSubscribe();

    const receiver2PO = pagePOs.get<ReceiveMessagePagePO>('receiver_2');
    await receiver2PO.selectFlavor(MessagingFlavor.Topic);
    await receiver2PO.enterTopic('myhome/:room/temperature');
    await receiver2PO.clickSubscribe();

    const receiver3PO = pagePOs.get<ReceiveMessagePagePO>('receiver_3');
    await receiver3PO.selectFlavor(MessagingFlavor.Topic);
    await receiver3PO.enterTopic('myhome/:room/:measurement');
    await receiver3PO.clickSubscribe();

    const receiver4PO = pagePOs.get<ReceiveMessagePagePO>('receiver_4');
    await receiver4PO.selectFlavor(MessagingFlavor.Topic);
    await receiver4PO.enterTopic('myhome/kitchen/:measurement');
    await receiver4PO.clickSubscribe();

    // Publish a message to 'myhome/livingroom/temperature'
    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('myhome/livingroom/temperature');
    await publisherPO.enterMessage('25°C');
    await publisherPO.clickPublish();

    // Verify receiver 1 subscribed to 'myhome/livingroom/temperature'
    await expect(receiver1PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map(),
      headers: new Map(),
    });
    // Verify receiver 2 subscribed to 'myhome/:room/temperature'
    await expect(receiver2PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom'),
      headers: new Map(),
    });
    // Verify receiver 3 subscribed to 'myhome/:room/:measurement'
    await expect(receiver3PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/livingroom/temperature',
      body: '25°C',
      params: new Map().set('room', 'livingroom').set('measurement', 'temperature'),
      headers: new Map(),
    });
    // Verify receiver 4 subscribed to 'myhome/kitchen/:measurement'
    await expect.poll(() => receiver4PO.getMessages()).toEqual([]);

    await receiver1PO.clickClearMessages();
    await receiver2PO.clickClearMessages();
    await receiver3PO.clickClearMessages();
    await receiver4PO.clickClearMessages();

    // Publish a message to 'myhome/kitchen/temperature'
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('myhome/kitchen/temperature');
    await publisherPO.enterMessage('20°C');
    await publisherPO.clickPublish();

    // Verify receiver 1 subscribed to 'myhome/livingroom/temperature'
    await expect.poll(() => receiver1PO.getMessages()).toEqual([]);
    // Verify receiver 2 subscribed to 'myhome/:room/temperature'
    await expect(receiver2PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/kitchen/temperature',
      body: '20°C',
      params: new Map().set('room', 'kitchen'),
      headers: new Map(),
    });
    // Verify receiver 3 subscribed to 'myhome/:room/:measurement'
    await expect(receiver3PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/kitchen/temperature',
      body: '20°C',
      params: new Map().set('room', 'kitchen').set('measurement', 'temperature'),
      headers: new Map(),
    });
    // Verify receiver 4 subscribed to 'myhome/kitchen/:measurement'
    await expect(receiver4PO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'myhome/kitchen/temperature',
      body: '20°C',
      params: new Map().set('measurement', 'temperature'),
      headers: new Map(),
    });
  }

  /**
   * Tests to set headers on a message.
   */
  export async function passHeadersSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    });

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('some-topic');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('some-topic');
    await publisherPO.enterMessage('some-payload');
    await publisherPO.enterHeaders({'header1': 'value', 'header2': '42'});
    await publisherPO.clickPublish();

    await expect(receiverPO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'some-topic',
      body: 'some-payload',
      headers: new Map().set('header1', 'value').set('header2', '42'),
      params: new Map(),
    });
  }

  /**
   * Tests to not post messages to disposed windows, causing "Failed to execute 'postMessage' on 'DOMWindow'" error.
   *
   * The error occurred when posting a message to a microfrontend that was unloaded, but before the disconnect event arrived in the broker.
   * To reproduce the bug, we subscribe to messages in a router outlet, unload it, and send a message right after.
   */
  export async function doNotPostMessageToDisposedWindow(testingAppPO: TestingAppPO, consoleLogs: ConsoleLogs): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      testpage: ClearOutletThenSendMessageTestPagePO,
      router: OutletRouterPagePO,
      receiver1: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_2},
      receiver2: {useClass: RouterOutletPagePO, origin: TestingAppOrigins.APP_3},
    });

    // Mount router outlet.
    const routerOutlet1PO = pagePOs.get<RouterOutletPagePO>('receiver1');
    await routerOutlet1PO.enterOutletName('test-outlet');
    await routerOutlet1PO.clickApply();

    // Mount router outlet.
    const routerOutlet2PO = pagePOs.get<RouterOutletPagePO>('receiver2');
    await routerOutlet2PO.enterOutletName('test-outlet');
    await routerOutlet2PO.clickApply();

    // Load message receiver into the outlets.
    const routerPO = pagePOs.get<OutletRouterPagePO>('router');
    await routerPO.enterOutletName('test-outlet');
    await routerPO.enterUrl(`../${ReceiveMessagePagePO.PATH}`);
    await routerPO.clickNavigate();

    // Subscribe to messages in the outlet.
    const receiver1PO = new ReceiveMessagePagePO(routerOutlet1PO.routerOutletFrameLocator);
    await receiver1PO.enterTopic('test-topic');
    await receiver1PO.clickSubscribe();

    // Subscribe to messages in the outlet.
    const receiver2PO = new ReceiveMessagePagePO(routerOutlet2PO.routerOutletFrameLocator);
    await receiver2PO.enterTopic('test-topic');
    await receiver2PO.clickSubscribe();

    // Run the test to provoke the error.
    // 1. Unload the outlet that has loaded a microfrontend subscribed to messages.
    // 2. Send a message to the subscribed topic.
    const testepagePO = pagePOs.get<ClearOutletThenSendMessageTestPagePO>('testpage');
    await testepagePO.enterOutletName('test-outlet');
    await testepagePO.enterTopic('test-topic');
    await testepagePO.clickRunTest();

    // Expect no error to be thrown
    const errors = await consoleLogs.get({filter: /Failed to execute 'postMessage' on 'DOMWindow'/, severity: 'error'});
    await expect.poll(() => errors).toEqual([]);
  }

  /**
   * Tests message interception by changing the message body to upper case characters.
   * The testing app is configured to uppercase messages sent to the topic 'uppercase'.
   */
  export async function interceptMessageSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-message:uppercase', 'uppercase')});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('uppercase');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('uppercase');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect(receiverPO.getFirstMessageOrElseReject()).toMatchTopicMessage({
      topic: 'uppercase',
      body: 'PAYLOAD',
      headers: new Map(),
      params: new Map(),
    });
  }

  /**
   * Tests message rejection.
   * The testing app is configured to reject messages sent to the topic 'reject'.
   */
  export async function interceptMessageRejectSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-message:reject', 'reject')});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('reject');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('reject');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect.poll(() => publisherPO.getPublishError()).toEqual('Message rejected by interceptor');
    await expect.poll(() => receiverPO.getMessages()).toEqual([]);
  }

  /**
   * Tests message rejection (async).
   * The testing app is configured to reject messages sent to the topic 'reject-async'.
   */
  export async function interceptMessageRejectAsyncSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-message:reject-async', 'reject-async')});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('reject-async');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('reject-async');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect.poll(() => publisherPO.getPublishError()).toEqual('Message rejected (async) by interceptor');
    await expect.poll(() => receiverPO.getMessages()).toEqual([]);
  }

  /**
   * Tests swallowing a message.
   * The testing app is configured to swallow messages sent to the topic 'swallow'.
   */
  export async function interceptMessageSwallowSpec(testingAppPO: TestingAppPO): Promise<void> {
    const pagePOs = await testingAppPO.navigateTo({
      publisher: PublishMessagePagePO,
      receiver: ReceiveMessagePagePO,
    }, {queryParams: new Map().set('intercept-message:swallow', 'swallow')});

    const receiverPO = pagePOs.get<ReceiveMessagePagePO>('receiver');
    await receiverPO.selectFlavor(MessagingFlavor.Topic);
    await receiverPO.enterTopic('swallow');
    await receiverPO.clickSubscribe();

    const publisherPO = pagePOs.get<PublishMessagePagePO>('publisher');
    await publisherPO.selectFlavor(MessagingFlavor.Topic);
    await publisherPO.enterTopic('swallow');
    await publisherPO.enterMessage('payload');
    await publisherPO.clickPublish();

    await expect.poll(() => publisherPO.getPublishError()).toBeNull();
    await expect.poll(() => receiverPO.getMessages()).toEqual([]);
  }
}
