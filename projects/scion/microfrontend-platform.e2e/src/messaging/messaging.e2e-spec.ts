/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestingAppOrigins} from '../testing-app.po';
import {TopicBasedMessagingSpecs} from './topic-based-messaging-specs';
import {IntendBasedMessagingSpecs} from './intent-based-messaging-specs';
import {test} from '../fixtures';

test.describe('Messaging', () => {

  test.describe('topic-based', () => {

    test.describe(`[same-origin]`, (): void => {

      test('allows publishing and receiving a message in root outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.RootOutlets.publishSpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_2);
      });

      test('allows publishing and receiving a message in child outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.ChildOutlets.publishSpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_2);
      });

      test('allows replying to a message in root outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.RootOutlets.replySpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_2);
      });

      test('allows replying to a message in child outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.ChildOutlets.replySpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_2);
      });
    });

    test.describe(`[cross-origin]`, (): void => {

      test('allows publishing and receiving a message in root outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.RootOutlets.publishSpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_3);
      });

      test('allows publishing and receiving a message in child outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.ChildOutlets.publishSpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_3);
      });

      test('allows replying to a message in root outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.RootOutlets.replySpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_3);
      });

      test('allows replying to a message in child outlets', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.ChildOutlets.replySpec(testingAppPO, TestingAppOrigins.APP_2, TestingAppOrigins.APP_3);
      });
    });

    test('allows tracking the topic subscriber count', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.subscriberCountSpec(testingAppPO);
    });

    test('allows replying from multiple subscribers', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.subscribersReplySpec(testingAppPO);
    });

    test('allows publishing a message to multiple subscribers', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.subscribersReceiveSpec(testingAppPO);
    });

    test('throws an error when no replier is found to reply a request', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.throwIfNoReplierFoundSpec(testingAppPO);
    });

    test('allows receiving retained messages', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.receiveRetainedMessagesSpec(testingAppPO);
    });

    test('allows receiving messages without a payload', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.receiveMessagesWithoutPayloadSpec(testingAppPO);
    });

    test('allows subscribing to multiple topics simultaneously (using the colon syntax)', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.subscribeToMultipleTopicsSimultaneouslySpec(testingAppPO);
    });

    test('allows passing headers', async ({testingAppPO}) => {
      await TopicBasedMessagingSpecs.passHeadersSpec(testingAppPO);
    });

    test.describe('message-interception', () => {

      test('allows intercepting messages', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.interceptMessageSpec(testingAppPO);
      });

      test('allows rejecting messages', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.interceptMessageRejectSpec(testingAppPO);
      });

      test('allows rejecting messages (async)', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.interceptMessageRejectAsyncSpec(testingAppPO);
      });

      test('allows swallowing messages', async ({testingAppPO}) => {
        await TopicBasedMessagingSpecs.interceptMessageSwallowSpec(testingAppPO);
      });
    });
  });

  test.describe('intent-based', () => {

    test.describe('scope-check', () => {

      test('rejects intent if not qualified', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.publisherNotQualifiedSpec(testingAppPO);
      });

      test('rejects intent if not fulfilled', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.intentNotFulfilledSpec(testingAppPO);
      });

      test('allows issuing intents to own private capabilities with implicit intention', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.dispatchToOwnPrivateCapabilitiesSpec(testingAppPO);
      });

      test('allows issuing intents to own public capabilities with implicit intention', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.dispatchToOwnPublicCapabilitiesSpec(testingAppPO);
      });

      test('rejects intents issued to private capabilities of other applications', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.rejectDispatchingToPrivateForeignCapabilitiesSpec(testingAppPO);
      });

      test('allows issuing intents to public capabilities of other applications', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.dispatchToPublicForeignCapabilitiesSpec(testingAppPO);
      });
    });

    test('allows issuing intents to multiple applications', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.dispatchToMultipleSubscribersSpec(testingAppPO);
    });

    test('allows receiving multiple intents', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.receiveMultipleIntentsSpecs(testingAppPO);
    });

    test('allows replying to an intent', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.replySpec(testingAppPO);
    });

    test('allows subscribing to intents using a qualifier selector which contains wildcards', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.receiveAndFilterSpec(testingAppPO);
    });

    test('allows receiving intents for a capability which declares wildcards in its qualifier', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.receiveIfMatchingCapabilityWildcardQualifierSpec(testingAppPO);
    });

    test('allows receiving intents for a capability which declares required and optional params', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.receiveIfMatchingCapabilityParamsSpec(testingAppPO);
    });

    test('rejects intent if params not matching params of capability', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.publisherNotMatchingParamsSpec(testingAppPO);
    });

    test('preserves data type of passed parameters', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.preserveParamDataTypeSpec(testingAppPO);
    });

    test('does not remove parameters associated with the value `null`', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.preserveNullParamSpec(testingAppPO);
    });

    test('removes parameters associated with the value `undefined`', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.removeUndefinedParamSpec(testingAppPO);
    });

    test('allows passing headers', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.passHeadersSpec(testingAppPO);
    });

    test('resolves to the fulfilling capability', async ({testingAppPO}) => {
      await IntendBasedMessagingSpecs.resolveCapabilitySpec(testingAppPO);
    });

    test.describe('intent-interception', () => {

      test('allows intercepting intents', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.interceptIntentSpec(testingAppPO);
      });

      test('allows rejecting intents', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.interceptIntentRejectSpec(testingAppPO);
      });

      test('allows swallowing intents', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.interceptIntentSwallowSpec(testingAppPO);
      });

      test('contains the resolved capability in the intent', async ({testingAppPO}) => {
        await IntendBasedMessagingSpecs.interceptIntentCapabilityPresentSpec(testingAppPO);
      });
    });
  });
});

