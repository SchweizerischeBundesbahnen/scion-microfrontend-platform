import type {Mock, MockedObject} from 'vitest';
/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {chainInterceptors, Handler, IntentInterceptor, Interceptor, MessageInterceptor, PublishInterceptorChain} from './message-interception';
import {IntentMessage, TopicMessage} from '../../messaging.model';
import {expectPromise} from '../../testing/spec.util.spec';
// TODO review and simplify
type SpyObj<T> = MockedObject<T>;
type Spy = Mock;

function createSpyObj<T>(name: string, methods: (keyof T & string)[]): MockedObject<T> {
  const obj: Record<string, unknown> = {};
  for (const method of methods) {
    obj[method] = vi.fn();
  }
  return obj as unknown as MockedObject<T>;
}

function createSpy(_name?: string): Mock {
  return vi.fn();
}

const asyncNoop = async (): Promise<void> => Promise.resolve();

describe('Message Interception', () => {

  let interceptor1: SpyObj<MessageInterceptor>;
  let interceptor2: SpyObj<MessageInterceptor>;
  let interceptor3: SpyObj<MessageInterceptor>;
  let publisher: Spy;
  let publishChain: PublishInterceptorChain<TopicMessage>;

  beforeEach(() => {
    interceptor1 = createSpyObj<Interceptor<unknown, Handler<TopicMessage>>>('interceptor-1', ['intercept']);
    interceptor1.intercept.mockImplementation((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    interceptor2 = createSpyObj<Interceptor<unknown, Handler<TopicMessage>>>('interceptor-2', ['intercept']);
    interceptor2.intercept.mockImplementation((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    interceptor3 = createSpyObj<Interceptor<unknown, Handler<TopicMessage>>>('interceptor-3', ['intercept']);
    interceptor3.intercept.mockImplementation((message: TopicMessage, next: Handler<TopicMessage>) => next.handle(message));

    publisher = createSpy('publisher');
    publishChain = chainInterceptors([interceptor1, interceptor2, interceptor3], publisher);
  });

  it('should invoke the publisher even if no interceptors are given', async () => {
    publisher = createSpy('publisher');
    publishChain = chainInterceptors(new Array<Interceptor<unknown, Handler<unknown>>>(), publisher);
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};

    await publishChain.interceptAndPublish(message);
    expect(publisher).toHaveBeenCalledWith(message);
  });

  it('should pass a message through the interceptors in registration order', async () => {
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await publishChain.interceptAndPublish(message);

    // assert interceptor invocation arguments
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(publisher).toHaveBeenCalledWith(message);

    // assert interceptor invocation order
    expect(Math.min(...vi.mocked(interceptor1.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(interceptor2.intercept).mock.invocationCallOrder));
    expect(Math.min(...vi.mocked(interceptor2.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(interceptor3.intercept).mock.invocationCallOrder));
    expect(Math.min(...vi.mocked(interceptor3.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(publisher).mock.invocationCallOrder));

    // assert interceptor being invoked only once
    expect(interceptor1.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor2.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor3.intercept).toHaveBeenCalledTimes(1);
    expect(publisher).toHaveBeenCalledTimes(1);
  });

  it('should allow to reject publishing by throwing an error', async () => {
    interceptor2.intercept.mockImplementation(() => {
      throw new Error('MESSAGE REJECTED BY INTERCEPTOR 2');
    });

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    expect(() => publishChain.interceptAndPublish(message)).toThrow(/MESSAGE REJECTED BY INTERCEPTOR 2/);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to reject publishing by rejecting with an error', async () => {
    interceptor2.intercept.mockRejectedValue('MESSAGE REJECTED BY INTERCEPTOR 2');

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await expectPromise(publishChain.interceptAndPublish(message)).toReject(/MESSAGE REJECTED BY INTERCEPTOR 2/);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to swallow a message by not calling the next handler', async () => {
    interceptor2.intercept.mockImplementation(asyncNoop);

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic'};
    await publishChain.interceptAndPublish(message);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to modify a message', async () => {
    interceptor1.intercept.mockImplementation((message: unknown, next: Handler<TopicMessage>) => {
      (message as TopicMessage<string[]>).headers.set('HEADER_INTERCEPTOR_1', true);
      (message as TopicMessage<string[]>).body!.push('INTERCEPTOR_1');
      return next.handle(message as TopicMessage);
    });
    interceptor2.intercept.mockImplementation((message: unknown, next: Handler<TopicMessage>) => {
      (message as TopicMessage<string[]>).headers.set('HEADER_INTERCEPTOR_2', true);
      (message as TopicMessage<string[]>).body!.push('INTERCEPTOR_2');
      return next.handle(message as TopicMessage);
    });
    interceptor3.intercept.mockImplementation((message: unknown, next: Handler<TopicMessage>) => {
      (message as TopicMessage<string[]>).headers.set('HEADER_INTERCEPTOR_3', true);
      (message as TopicMessage<string[]>).body!.push('INTERCEPTOR_3');
      return next.handle(message as TopicMessage);
    });

    // Run the test
    const message: TopicMessage = {headers: new Map(), topic: 'topic', body: []};
    await publishChain.interceptAndPublish(message);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(message, expect.any(Handler));
    expect(publisher).toHaveBeenCalledWith({
      body: ['INTERCEPTOR_1', 'INTERCEPTOR_2', 'INTERCEPTOR_3'],
      headers: new Map<string, boolean>().set('HEADER_INTERCEPTOR_1', true).set('HEADER_INTERCEPTOR_2', true).set('HEADER_INTERCEPTOR_3', true),
      topic: 'topic',
    });
  });
});

describe('Intent Interception', () => {

  let interceptor1: SpyObj<IntentInterceptor>;
  let interceptor2: SpyObj<IntentInterceptor>;
  let interceptor3: SpyObj<IntentInterceptor>;
  let publisher: Spy;
  let publishChain: PublishInterceptorChain<IntentMessage>;

  beforeEach(() => {
    interceptor1 = createSpyObj<Interceptor<unknown, Handler<IntentMessage>>>('interceptor-1', ['intercept']);
    interceptor1.intercept.mockImplementation((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    interceptor2 = createSpyObj<Interceptor<unknown, Handler<IntentMessage>>>('interceptor-2', ['intercept']);
    interceptor2.intercept.mockImplementation((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    interceptor3 = createSpyObj<Interceptor<unknown, Handler<IntentMessage>>>('interceptor-3', ['intercept']);
    interceptor3.intercept.mockImplementation((intent: IntentMessage, next: Handler<IntentMessage>) => next.handle(intent));

    publisher = createSpy('publisher');
    publishChain = chainInterceptors([interceptor1, interceptor2, interceptor3], publisher);
  });

  it('should invoke the publisher even if no interceptors are given', async () => {
    publisher = createSpy('publisher');
    publishChain = chainInterceptors(new Array<Interceptor<unknown, Handler<unknown>>>(), publisher);
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined!};

    await publishChain.interceptAndPublish(intent);
    expect(publisher).toHaveBeenCalledWith(intent);
  });

  it('should pass an intent through the interceptors in registration order', async () => {
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined!};
    await publishChain.interceptAndPublish(intent);

    // assert interceptor invocation arguments
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(publisher).toHaveBeenCalledWith(intent);

    // assert interceptor invocation order
    expect(Math.min(...vi.mocked(interceptor1.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(interceptor2.intercept).mock.invocationCallOrder));
    expect(Math.min(...vi.mocked(interceptor2.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(interceptor3.intercept).mock.invocationCallOrder));
    expect(Math.min(...vi.mocked(interceptor3.intercept).mock.invocationCallOrder)).toBeLessThan(Math.min(...vi.mocked(publisher).mock.invocationCallOrder));

    // assert interceptor being invoked only once
    expect(interceptor1.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor2.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor3.intercept).toHaveBeenCalledTimes(1);
    expect(publisher).toHaveBeenCalledTimes(1);
  });

  it('should allow to reject publishing by throwing an error', async () => {
    interceptor2.intercept.mockImplementation(() => {
      throw new Error('INTENT REJECTED BY INTERCEPTOR 2');
    });

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined!};
    expect(() => publishChain.interceptAndPublish(intent)).toThrow(/INTENT REJECTED BY INTERCEPTOR 2/);

    //  Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to reject publishing by rejecting with an error', async () => {
    interceptor2.intercept.mockRejectedValue('INTENT REJECTED BY INTERCEPTOR 2');

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined!};
    await expectPromise(publishChain.interceptAndPublish(intent)).toReject(/INTENT REJECTED BY INTERCEPTOR 2/);

    //  Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to swallow an intent by not calling the next handler', async () => {
    interceptor2.intercept.mockImplementation(asyncNoop);

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, capability: undefined!};
    await publishChain.interceptAndPublish(intent);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor3.intercept).not.toHaveBeenCalled();
    expect(publisher).not.toHaveBeenCalled();
  });

  it('should allow to modify an intent', async () => {
    interceptor1.intercept.mockImplementation((intent: unknown, next: Handler<IntentMessage>) => {
      (intent as IntentMessage<string[]>).headers.set('HEADER_INTERCEPTOR_1', true);
      (intent as IntentMessage<string[]>).body!.push('INTERCEPTOR_1');
      return next.handle(intent as IntentMessage);
    });
    interceptor2.intercept.mockImplementation((intent: unknown, next: Handler<IntentMessage>) => {
      (intent as IntentMessage<string[]>).headers.set('HEADER_INTERCEPTOR_2', true);
      (intent as IntentMessage<string[]>).body!.push('INTERCEPTOR_2');
      return next.handle(intent as IntentMessage);
    });
    interceptor3.intercept.mockImplementation((intent: unknown, next: Handler<IntentMessage>) => {
      (intent as IntentMessage<string[]>).headers.set('HEADER_INTERCEPTOR_3', true);
      (intent as IntentMessage<string[]>).body!.push('INTERCEPTOR_3');
      return next.handle(intent as IntentMessage);
    });

    // Run the test
    const intent: IntentMessage = {headers: new Map(), intent: {type: 'type'}, body: [], capability: undefined!};
    await publishChain.interceptAndPublish(intent);

    // Verify
    expect(interceptor1.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor2.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(interceptor3.intercept).toHaveBeenCalledWith(intent, expect.any(Handler));
    expect(publisher).toHaveBeenCalledWith({
      body: ['INTERCEPTOR_1', 'INTERCEPTOR_2', 'INTERCEPTOR_3'],
      headers: new Map<string, boolean>().set('HEADER_INTERCEPTOR_1', true).set('HEADER_INTERCEPTOR_2', true).set('HEADER_INTERCEPTOR_3', true),
      intent: {type: 'type'},
      capability: undefined!,
    });
  });
});
