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

/**
 * Contains Specs for topic-based messaging.
 */
export namespace TopicBasedMessagingSpecs {

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
    await expect(await message1PO.getTopic()).toEqual('some-topic');
    await expect(await message1PO.getBody()).toEqual('first message');
    await expect(await message1PO.getReplyTo()).toBeUndefined();

    // clear the messages list
    await receiverPO.clickClearMessages();
    await expect(await receiverPO.getMessages()).toEqual([]);

    // publish a second message
    await publisherPO.enterMessage('second message');
    await publisherPO.clickPublish();

    const message2PO = await receiverPO.getFirstMessageOrElseReject();
    await expect(await message2PO.getTopic()).toEqual('some-topic');
    await expect(await message2PO.getBody()).toEqual('second message');
    await expect(await message2PO.getReplyTo()).toBeUndefined();

    // clear the messages list
    await receiverPO.clickClearMessages();
    await expect(await receiverPO.getMessages()).toEqual([]);

    // publish a third message
    await publisherPO.enterMessage('third message');
    await publisherPO.clickPublish();

    const message3PO = await receiverPO.getFirstMessageOrElseReject();
    await expect(await message3PO.getTopic()).toEqual('some-topic');
    await expect(await message3PO.getBody()).toEqual('third message');
    await expect(await message3PO.getReplyTo()).toBeUndefined();
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
    await expect(replyTo).not.toBeUndefined();

    // send a reply
    await messagePO.clickReply();

    const reply1PO = await publisherPO.getFirstReplyOrElseReject();
    await expect(await reply1PO.getTopic()).toEqual(replyTo);
    await expect(await reply1PO.getBody()).toEqual('this is a reply');
    await expect(await reply1PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect(await publisherPO.getReplies()).toEqual([]);

    // send a second reply
    await messagePO.clickReply();
    const reply2PO = await publisherPO.getFirstReplyOrElseReject();
    await expect(await reply2PO.getTopic()).toEqual(replyTo);
    await expect(await reply2PO.getBody()).toEqual('this is a reply');
    await expect(await reply2PO.getReplyTo()).toBeUndefined();

    // clear the replies list
    await publisherPO.clickClearReplies();
    await expect(await publisherPO.getReplies()).toEqual([]);

    // send a third reply
    await messagePO.clickReply();
    const reply3PO = await publisherPO.getFirstReplyOrElseReject();
    await expect(await reply3PO.getTopic()).toEqual(replyTo);
    await expect(await reply3PO.getBody()).toEqual('this is a reply');
    await expect(await reply3PO.getReplyTo()).toBeUndefined();
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

    await expect(await (await receiver1PO.getFirstMessageOrElseReject()).getBody()).toEqual('first message');
    await expect(await (await receiver2PO.getFirstMessageOrElseReject()).getBody()).toEqual('first message');
    await expect(await (await receiver3PO.getFirstMessageOrElseReject()).getBody()).toEqual('first message');

    // clear the messages
    await receiver1PO.clickClearMessages();
    await receiver2PO.clickClearMessages();
    await receiver3PO.clickClearMessages();

    // publish the second message
    await publisherPO.enterMessage('second message');
    await publisherPO.clickPublish();

    await expect(await (await receiver1PO.getFirstMessageOrElseReject()).getBody()).toEqual('second message');
    await expect(await (await receiver2PO.getFirstMessageOrElseReject()).getBody()).toEqual('second message');
    await expect(await (await receiver3PO.getFirstMessageOrElseReject()).getBody()).toEqual('second message');
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

    await expect(await publisherPO.getPublishError()).toContain('[RequestReplyError]');
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
    await expect(await (await publisherPO.getFirstReplyOrElseReject()).getBody()).toEqual('this is a reply');
    await publisherPO.clickClearReplies();

    await (await receiver2PO.getFirstMessageOrElseReject()).clickReply();
    await expect(await (await publisherPO.getFirstReplyOrElseReject()).getBody()).toEqual('this is a reply');
    await publisherPO.clickClearReplies();

    await (await receiver3PO.getFirstMessageOrElseReject()).clickReply();
    await expect(await (await publisherPO.getFirstReplyOrElseReject()).getBody()).toEqual('this is a reply');
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
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    await receiver1PO.clickUnsubscribe();
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);
    await receiver1PO.clickSubscribe();
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(2);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unsubscribe 'receiver1'
    await receiver1PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(2);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unsubscribe 'receiver2'
    await receiver2PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // unload page of 'receiver3'
    const outlet = pagePOs.get<BrowserOutletPO>('receiver3:outlet');
    await outlet.enterUrl('about:blank');

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(1);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // unsubscribe 'receiver4'
    await receiver4PO.clickUnsubscribe();

    // assert subscriber count on 'topic-1'
    await publisherPO.enterTopic('topic-1');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-2'
    await publisherPO.enterTopic('topic-2');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);

    // assert subscriber count on 'topic-3'
    await publisherPO.enterTopic('topic-3');
    await expect(await publisherPO.getTopicSubscriberCount()).toEqual(0);
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
    await expect(await (await receiverApp1PO.getFirstMessageOrElseReject()).getBody()).toEqual('retained message');

    // test to receive retained message in app-2
    let receiverApp2PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_2});
    await receiverApp2PO.selectFlavor(MessagingFlavor.Topic);
    await receiverApp2PO.enterTopic('some-topic');
    await receiverApp2PO.clickSubscribe();
    await expect(await (await receiverApp2PO.getFirstMessageOrElseReject()).getBody()).toEqual('retained message');
    await receiverApp2PO.clickClearMessages();

    // clear the retained message
    await publisherPO.enterMessage('');
    await publisherPO.clickPublish();

    // expect the empty message not to be dispatched
    await expect(receiverApp2PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);

    // test not to receive the retained message in app-4
    receiverApp2PO = await receiverOutletPO.enterUrl<ReceiveMessagePagePO>({useClass: ReceiveMessagePagePO, origin: TestingAppOrigins.APP_4});
    await receiverApp2PO.selectFlavor(MessagingFlavor.Topic);
    await receiverApp2PO.enterTopic('some-topic');
    await receiverApp2PO.clickSubscribe();

    await expect(receiverApp2PO.getFirstMessageOrElseReject()).rejects.toThrow(/\[NoMessageFoundError]/);
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

    await expect(await (await receiverPO.getFirstMessageOrElseReject()).getTopic()).toEqual('some-topic');
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
    await expect(await receiver4PO.getMessages()).toEqual([]);

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
    await expect(await receiver1PO.getMessages()).toEqual([]);
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

    await expect(await publisherPO.getPublishError()).toEqual('Message rejected by interceptor');
    await expect(await receiverPO.getMessages()).toEqual([]);
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

    await expect(await publisherPO.getPublishError()).toBeNull();
    await expect(await receiverPO.getMessages()).toEqual([]);
  }
}
