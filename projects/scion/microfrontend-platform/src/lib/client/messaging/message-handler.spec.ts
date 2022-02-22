/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MessageClient} from '../../client/messaging/message-client';
import {expectPromise, waitFor, waitForCondition} from '../../testing/spec.util.spec';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {IntentMessage, TopicMessage} from '../../messaging.model';
import {AsyncSubject, concat, Observable, of, ReplaySubject, Subject, throwError} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {IntentClient} from './intent-client';
import {ObserveCaptor} from '@scion/toolkit/testing';

const bodyExtractFn = <T>(msg: TopicMessage<T> | IntentMessage<T>): T => msg.body;

describe('Message Handler', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('pub/sub', () => {

    it('should receive messages published to a topic', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collector.push(message.body);
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await Beans.get(MessageClient).publish('topic', 'B');
      await Beans.get(MessageClient).publish('topic', 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should not unregister the callback on error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collector.push(message.body);
        throw Error('some error');
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await Beans.get(MessageClient).publish('topic', 'B');
      await Beans.get(MessageClient).publish('topic', 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should not unregister the callback on async error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      Beans.get(MessageClient).onMessage<string>('topic', async message => {
        collector.push(message.body);
        await Promise.reject('some-error');
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await Beans.get(MessageClient).publish('topic', 'B');
      await Beans.get(MessageClient).publish('topic', 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should ignore values returned by the callback', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collector.push(message.body);
        return 'some-value';
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await Beans.get(MessageClient).publish('topic', 'B');
      await Beans.get(MessageClient).publish('topic', 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should ignore async values returned by the callback', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collector.push(message.body);
        return Promise.resolve('some-value');
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await Beans.get(MessageClient).publish('topic', 'B');
      await Beans.get(MessageClient).publish('topic', 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should unregister the handler when cancelling its subscription', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collector = new Array<string>();
      const subscription = Beans.get(MessageClient).onMessage<string>('topic', message => {
        collector.push(message.body);
        return Promise.resolve('some-value');
      });

      await Beans.get(MessageClient).publish('topic', 'A');
      await waitForCondition(() => collector.length === 1);
      await expect(collector).toEqual(['A']);

      subscription.unsubscribe();
      await Beans.get(MessageClient).publish('topic', 'B');
      await waitFor(1000);
      await expect(collector).toEqual(['A']);
    });
  });

  describe('request/response', () => {

    it('should reply with a single response and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        return message.body.toUpperCase();
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with a single response (Promise) and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        return Promise.resolve(message.body.toUpperCase());
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with a single response (Observable) and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        return of(message.body.toUpperCase());
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with multiple responses and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        const body = message.body.toUpperCase();
        return of(`${body}-1`, `${body}-2`, `${body}-3`);
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with multiple responses without completing the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        const body = message.body.toUpperCase();
        const subject = new ReplaySubject(3);
        subject.next(`${body}-1`);
        subject.next(`${body}-2`);
        subject.next(`${body}-3`);
        return subject;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilEmitCount(3);
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
      await waitFor(1000);
      await expect(captor.hasCompleted()).toBeFalse();
      await expect(captor.hasErrored()).toBeFalse();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
    });

    it('should immediately complete the requestor\'s Observable when not returning a value', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        // not returning a value
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should immediately complete the requestor\'s Observable when returning `undefined`', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        return undefined;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should treat `null` as valid reply', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        return null;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([null]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should ignore `undefined` values, but not `null` values', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        const body = message.body.toUpperCase();
        return of(`${body}-1`, undefined, `${body}-2`, null, `${body}-3`);
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', null, 'A-3']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should error the requestor\'s Observable when throwing an error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        throw Error('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should error the requestor\'s Observable when returning a Promise that rejects', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        return Promise.reject('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should error the requestor\'s Observable when returning an Observable that errors', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        return throwError('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should reply values until encountering an error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        return concat(
          of(message.body.toUpperCase()),
          throwError('some error'),
        );
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual(['A']);
    });

    it('should not unregister the handler if the replier Observable errors', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      Beans.get(MessageClient).onMessage<string>('topic', message => {
        return concat(
          of(message.body.toUpperCase()),
          throwError('some error'),
        );
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor1);

      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual(['A']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'b').subscribe(captor2);

      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual(['B']);
    });

    it('should not unregister the handler on error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collected = [];
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collected.push(message.body);
        throw Error('some error');
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual([]);
      expect(collected).toEqual(['a']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'b').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual([]);
      expect(collected).toEqual(['a', 'b']);
    });

    it('should not unregister the handler on async error', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const collected = [];
      Beans.get(MessageClient).onMessage<string>('topic', message => {
        collected.push(message.body);
        return Promise.reject('some error');
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'a').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual([]);
      expect(collected).toEqual(['a']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(MessageClient).request$('topic', 'b').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual([]);
      expect(collected).toEqual(['a', 'b']);
    });

    it('should unsubscribe from the replier Observable when the requestor unsubscribes', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const replierConstruct$ = new Subject();
      const whenReplierConstruct = replierConstruct$.toPromise();

      const replierTeardown$ = new Subject();
      const whenReplierTeardown = replierTeardown$.toPromise();

      const replierFinalize$ = new Subject();
      const whenReplierFinalize = replierFinalize$.toPromise();

      Beans.get(MessageClient).onMessage<string>('topic', () => {
        return new Observable(() => {
          replierConstruct$.complete();
          return () => replierTeardown$.complete();
        })
          .pipe(finalize(() => replierFinalize$.complete()));
      });

      const subscription = Beans.get(MessageClient).request$('topic').subscribe();
      await expectPromise(whenReplierConstruct).toResolve();
      subscription.unsubscribe();
      await expectPromise(whenReplierTeardown).toResolve();
      await expectPromise(whenReplierFinalize).toResolve();
    });

    it('should unsubscribe the replier\'s and requestor\'s Observable when unregistering the handler', async () => {
      await MicrofrontendPlatform.startHost({applications: []});

      const replierConstruct$ = new AsyncSubject();
      const replierTeardown$ = new AsyncSubject();
      const replierFinalize$ = new AsyncSubject();
      const requestorFinalize$ = new AsyncSubject();

      const handlerSubscription = Beans.get(MessageClient).onMessage<string>('topic', () => {
        return new Observable(() => {
          replierConstruct$.complete();
          return () => replierTeardown$.complete();
        })
          .pipe(finalize(() => replierFinalize$.complete()));
      });

      const requestorSubscription = Beans.get(MessageClient).request$('topic')
        .pipe(finalize(() => requestorFinalize$.complete()))
        .subscribe();

      await expectPromise(replierConstruct$.toPromise()).toResolve();
      expect(requestorSubscription.closed).toBeFalse();

      handlerSubscription.unsubscribe();
      await expectPromise(replierTeardown$.toPromise()).toResolve();
      await expectPromise(replierFinalize$.toPromise()).toResolve();
      await expectPromise(requestorFinalize$.toPromise()).toResolve();
      expect(requestorSubscription.closed).toBeTrue();
    });
  });
});

describe('Intent Handler', () => {

  beforeEach(async () => await MicrofrontendPlatform.destroy());
  afterEach(async () => await MicrofrontendPlatform.destroy());

  describe('pub/sub', () => {

    it('should receive intents', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collector.push(intentMessage.body);
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should not unregister the callback on error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collector.push(intentMessage.body);
        throw Error('some error');
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should not unregister the callback on async error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, async intentMessage => {
        collector.push(intentMessage.body);
        await Promise.reject('some-error');
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should ignore values returned by the callback', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collector.push(intentMessage.body);
        return 'some-value';
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should ignore async values returned by the callback', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collector.push(intentMessage.body);
        return Promise.resolve('some-value');
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await Beans.get(IntentClient).publish({type: 'capability'}, 'C');

      await waitForCondition(() => collector.length === 3);
      await expect(collector).toEqual(['A', 'B', 'C']);
    });

    it('should unregister the handler when cancelling its subscription', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collector = new Array<string>();
      const subscription = Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collector.push(intentMessage.body);
        return Promise.resolve('some-value');
      });

      await Beans.get(IntentClient).publish({type: 'capability'}, 'A');
      await waitForCondition(() => collector.length === 1);
      await expect(collector).toEqual(['A']);

      subscription.unsubscribe();
      await Beans.get(IntentClient).publish({type: 'capability'}, 'B');
      await waitFor(1000);
      await expect(collector).toEqual(['A']);
    });
  });

  describe('request/response', () => {

    it('should reply with a single response and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        return intentMessage.body.toUpperCase();
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with a single response (Promise) and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        return Promise.resolve(intentMessage.body.toUpperCase());
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with a single response (Observable) and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        return of(intentMessage.body.toUpperCase());
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with multiple responses and then complete the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        const body = intentMessage.body.toUpperCase();
        return of(`${body}-1`, `${body}-2`, `${body}-3`);
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should reply with multiple responses without completing the requestor\'s Observable', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        const body = intentMessage.body.toUpperCase();
        const subject = new ReplaySubject(3);
        subject.next(`${body}-1`);
        subject.next(`${body}-2`);
        subject.next(`${body}-3`);
        return subject;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilEmitCount(3);
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
      await waitFor(1000);
      await expect(captor.hasCompleted()).toBeFalse();
      await expect(captor.hasErrored()).toBeFalse();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', 'A-3']);
    });

    it('should immediately complete the requestor\'s Observable when not returning a value', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        // not returning a value
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should immediately complete the requestor\'s Observable when returning `undefined`', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return undefined;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should treat `null` as valid reply', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return null;
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual([null]);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should ignore `undefined` values, but not `null` values', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        const body = intentMessage.body.toUpperCase();
        return of(`${body}-1`, undefined, `${body}-2`, null, `${body}-3`);
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.getValues()).toEqual(['A-1', 'A-2', null, 'A-3']);
      await expect(captor.hasCompleted()).toBeTrue();
    });

    it('should error the requestor\'s Observable when throwing an error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        throw Error('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should error the requestor\'s Observable when returning a Promise that rejects', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return Promise.reject('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should error the requestor\'s Observable when returning an Observable that errors', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return throwError('some error');
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual([]);
    });

    it('should reply values until encountering an error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        return concat(
          of(intentMessage.body.toUpperCase()),
          throwError('some error'),
        );
      });

      const captor = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor);

      await captor.waitUntilCompletedOrErrored();
      await expect(captor.hasErrored()).toBeTrue();
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().message).toEqual('some error');
      expect(captor.getValues()).toEqual(['A']);
    });

    it('should not unregister the handler if the replier Observable errors', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        return concat(
          of(intentMessage.body.toUpperCase()),
          throwError('some error'),
        );
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor1);

      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual(['A']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'b').subscribe(captor2);

      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual(['B']);
    });

    it('should not unregister the handler on error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collected = [];
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collected.push(intentMessage.body);
        throw Error('some error');
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual([]);
      expect(collected).toEqual(['a']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'b').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual([]);
      expect(collected).toEqual(['a', 'b']);
    });

    it('should not unregister the handler on async error', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const collected = [];
      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, intentMessage => {
        collected.push(intentMessage.body);
        return Promise.reject('some error');
      });

      const captor1 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'a').subscribe(captor1);
      await captor1.waitUntilCompletedOrErrored();
      await expect(captor1.hasErrored()).toBeTrue();
      expect(captor1.getError().name).toEqual('RequestError');
      expect(captor1.getError().message).toEqual('some error');
      expect(captor1.getValues()).toEqual([]);
      expect(collected).toEqual(['a']);

      const captor2 = new ObserveCaptor(bodyExtractFn);
      Beans.get(IntentClient).request$({type: 'capability'}, 'b').subscribe(captor2);
      await captor2.waitUntilCompletedOrErrored();
      await expect(captor2.hasErrored()).toBeTrue();
      expect(captor2.getError().name).toEqual('RequestError');
      expect(captor2.getError().message).toEqual('some error');
      expect(captor2.getValues()).toEqual([]);
      expect(collected).toEqual(['a', 'b']);
    });

    it('should unsubscribe from the replier Observable when the requestor unsubscribes', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const replierConstruct$ = new Subject();
      const whenReplierConstruct = replierConstruct$.toPromise();

      const replierTeardown$ = new Subject();
      const whenReplierTeardown = replierTeardown$.toPromise();

      const replierFinalize$ = new Subject();
      const whenReplierFinalize = replierFinalize$.toPromise();

      Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return new Observable(() => {
          replierConstruct$.complete();
          return () => replierTeardown$.complete();
        })
          .pipe(finalize(() => replierFinalize$.complete()));
      });

      const subscription = Beans.get(IntentClient).request$({type: 'capability'}).subscribe();
      await expectPromise(whenReplierConstruct).toResolve();
      subscription.unsubscribe();
      await expectPromise(whenReplierTeardown).toResolve();
      await expectPromise(whenReplierFinalize).toResolve();
    });

    it('should unsubscribe the replier\'s and requestor\'s Observable when unregistering the handler', async () => {
      await MicrofrontendPlatform.startHost({
        host: {
          manifest: {
            name: 'Host App',
            capabilities: [{type: 'capability'}],
          },
        },
        applications: [],
      });

      const replierConstruct$ = new AsyncSubject();
      const replierTeardown$ = new AsyncSubject();
      const replierFinalize$ = new AsyncSubject();
      const requestorFinalize$ = new AsyncSubject();

      const handlerSubscription = Beans.get(IntentClient).onIntent<string>({type: 'capability'}, () => {
        return new Observable(() => {
          replierConstruct$.complete();
          return () => replierTeardown$.complete();
        })
          .pipe(finalize(() => replierFinalize$.complete()));
      });

      const requestorSubscription = Beans.get(IntentClient).request$({type: 'capability'})
        .pipe(finalize(() => requestorFinalize$.complete()))
        .subscribe();

      await expectPromise(replierConstruct$.toPromise()).toResolve();
      expect(requestorSubscription.closed).toBeFalse();

      handlerSubscription.unsubscribe();
      await expectPromise(replierTeardown$.toPromise()).toResolve();
      await expectPromise(replierFinalize$.toPromise()).toResolve();
      await expectPromise(requestorFinalize$.toPromise()).toResolve();
      expect(requestorSubscription.closed).toBeTrue();
    });
  });
});
