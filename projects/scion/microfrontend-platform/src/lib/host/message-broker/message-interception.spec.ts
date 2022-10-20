/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {chainInterceptors, Handler, IntentInterceptor, MessageInterceptor, PublishInterceptorChain} from './message-interception';
import {IntentMessage, TopicMessage} from '../../messaging.model';
import any = jasmine.any;
import createSpyObj = jasmine.createSpyObj;
import createSpy = jasmine.createSpy;
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import {expectPromise} from '../../testing/spec.util.spec';

const asyncNoop = async (): Promise<void> => Promise.resolve();

describe('Message Interception', () => {

  let interceptor1: SpyObj<MessageInterceptor>;
  let interceptor2: SpyObj<MessageInterceptor>;
  let interceptor3: SpyObj<MessageInterceptor>;
  let publisher: Spy;
  let publishChain: PublishInterceptorChain<TopicMessage>;

  beforeEach(() => {
    interceptor1 = createSpyObj('interceptor-1', ['intercept']);
    interceptor1.intercept.and.callFake((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    interceptor2 = createSpyObj('interceptor-2', ['intercept']);
    interceptor2.intercept.and.callFake((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    interceptor3 = createSpyObj('interceptor-3', ['intercept']);
    interceptor3.intercept.and.callFake((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    publisher = createSpy('publisher');
    publishChain = chainInterceptors([interceptor1, interceptor2, interceptor3], publisher);
  });

  it('should invoke the publisher even if no interceptors are given', async () => {
    publisher = createSpy('publisher');
    publishChain = chainInterceptors([], publisher);
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};

    await publishChain.interceptAndPublish(message);
    expect(publisher).toHaveBeenCalledWith(message);
  });

  it('should pass a message through the interceptors in registration order', async () => {
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await publishChain.interceptAndPublish(message);

    // assert interceptor invocation arguments
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(publisher).toHaveBeenCalledWith(message);

    // assert interceptor invocation order
    expect(interceptor1.intercept).toHaveBeenCalledBefore(interceptor2.intercept);
    expect(interceptor2.intercept).toHaveBeenCalledBefore(interceptor3.intercept);
    expect(interceptor3.intercept).toHaveBeenCalledBefore(publisher);

    // assert interceptor being invoked only once
    expect(interceptor1.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor2.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor3.intercept).toHaveBeenCalledTimes(1);
    expect(publisher).toHaveBeenCalledTimes(1);
  });

  it('should allow to reject publishing by throwing an error', async () => {
    interceptor2.intercept.and.throwError('MESSAGE REJECTED BY INTERCEPTOR 2');

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    expect(() => publishChain.interceptAndPublish(message)).toThrowError(/MESSAGE REJECTED BY INTERCEPTOR 2/);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to reject publishing by rejecting with an error', async () => {
    interceptor2.intercept.and.rejectWith('MESSAGE REJECTED BY INTERCEPTOR 2');

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await expectPromise(publishChain.interceptAndPublish(message)).toReject(/MESSAGE REJECTED BY INTERCEPTOR 2/);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to swallow a message by not calling the next handler', async () => {
    interceptor2.intercept.and.callFake(asyncNoop);

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await publishChain.interceptAndPublish(message);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to modify a message', async () => {
    interceptor1.intercept.and.callFake((message: TopicMessage<string[]>, next: Handler<TopicMessage>) => {
      message.headers.set('HEADER_INTERCEPTOR_1', true);
      message.body.push('INTERCEPTOR_1');
      return next.handle(message);
    });
    interceptor2.intercept.and.callFake((message: TopicMessage<string[]>, next: Handler<TopicMessage>) => {
      message.headers.set('HEADER_INTERCEPTOR_2', true);
      message.body.push('INTERCEPTOR_2');
      return next.handle(message);
    });
    interceptor3.intercept.and.callFake((message: TopicMessage<string[]>, next: Handler<TopicMessage>) => {
      message.headers.set('HEADER_INTERCEPTOR_3', true);
      message.body.push('INTERCEPTOR_3');
      return next.handle(message);
    });

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic', body: []};
    await publishChain.interceptAndPublish(message);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(message, any(Handler));
    expect(publisher).toHaveBeenCalledWith({
      body: ['INTERCEPTOR_1', 'INTERCEPTOR_2', 'INTERCEPTOR_3'],
      headers: new Map().set('HEADER_INTERCEPTOR_1', true).set('HEADER_INTERCEPTOR_2', true).set('HEADER_INTERCEPTOR_3', true),
      topic: 'topic',
    } as TopicMessage);
  });
});

describe('Intent Interception', () => {

  let interceptor1: SpyObj<IntentInterceptor>;
  let interceptor2: SpyObj<IntentInterceptor>;
  let interceptor3: SpyObj<IntentInterceptor>;
  let publisher: Spy;
  let publishChain: PublishInterceptorChain<IntentMessage>;

  beforeEach(() => {
    interceptor1 = createSpyObj('interceptor-1', ['intercept']);
    interceptor1.intercept.and.callFake((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    interceptor2 = createSpyObj('interceptor-2', ['intercept']);
    interceptor2.intercept.and.callFake((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    interceptor3 = createSpyObj('interceptor-3', ['intercept']);
    interceptor3.intercept.and.callFake((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    publisher = createSpy('publisher');
    publishChain = chainInterceptors([interceptor1, interceptor2, interceptor3], publisher);
  });

  it('should invoke the publisher even if no interceptors are given', async () => {
    publisher = createSpy('publisher');
    publishChain = chainInterceptors([], publisher);
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined};

    await publishChain.interceptAndPublish(intent);
    expect(publisher).toHaveBeenCalledWith(intent);
  });

  it('should pass an intent through the interceptors in registration order', async () => {
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined};
    await publishChain.interceptAndPublish(intent);

    // assert interceptor invocation arguments
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(publisher).toHaveBeenCalledWith(intent);

    // assert interceptor invocation order
    expect(interceptor1.intercept).toHaveBeenCalledBefore(interceptor2.intercept);
    expect(interceptor2.intercept).toHaveBeenCalledBefore(interceptor3.intercept);
    expect(interceptor3.intercept).toHaveBeenCalledBefore(publisher);

    // assert interceptor being invoked only once
    expect(interceptor1.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor2.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor3.intercept).toHaveBeenCalledTimes(1);
    expect(publisher).toHaveBeenCalledTimes(1);
  });

  it('should allow to reject publishing by throwing an error', async () => {
    interceptor2.intercept.and.throwError('INTENT REJECTED BY INTERCEPTOR 2');

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined};
    expect(() => publishChain.interceptAndPublish(intent)).toThrowError(/INTENT REJECTED BY INTERCEPTOR 2/);

    //  Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to reject publishing by rejecting with an error', async () => {
    interceptor2.intercept.and.rejectWith('INTENT REJECTED BY INTERCEPTOR 2');

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined};
    await expectPromise(publishChain.interceptAndPublish(intent)).toReject(/INTENT REJECTED BY INTERCEPTOR 2/);

    //  Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to swallow an intent by not calling the next handler', async () => {
    interceptor2.intercept.and.callFake(asyncNoop);

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined};
    await publishChain.interceptAndPublish(intent);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to modify an intent', async () => {
    interceptor1.intercept.and.callFake((intent: IntentMessage<string[]>, next: Handler<IntentMessage>) => {
      intent.headers.set('HEADER_INTERCEPTOR_1', true);
      intent.body.push('INTERCEPTOR_1');
      return next.handle(intent);
    });
    interceptor2.intercept.and.callFake((intent: IntentMessage<string[]>, next: Handler<IntentMessage>) => {
      intent.headers.set('HEADER_INTERCEPTOR_2', true);
      intent.body.push('INTERCEPTOR_2');
      return next.handle(intent);
    });
    interceptor3.intercept.and.callFake((intent: IntentMessage<string[]>, next: Handler<IntentMessage>) => {
      intent.headers.set('HEADER_INTERCEPTOR_3', true);
      intent.body.push('INTERCEPTOR_3');
      return next.handle(intent);
    });

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, body: [], capability: undefined};
    await publishChain.interceptAndPublish(intent);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(intent, any(Handler));
    expect(publisher).toHaveBeenCalledWith({
      body: ['INTERCEPTOR_1', 'INTERCEPTOR_2', 'INTERCEPTOR_3'],
      headers: new Map().set('HEADER_INTERCEPTOR_1', true).set('HEADER_INTERCEPTOR_2', true).set('HEADER_INTERCEPTOR_3', true),
      intent: {type: 'type'},
      capability: undefined,
    } as IntentMessage);
  });
});


