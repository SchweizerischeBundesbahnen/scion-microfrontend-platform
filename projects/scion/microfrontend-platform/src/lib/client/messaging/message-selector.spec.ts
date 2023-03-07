/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {identity, NEVER, Subject} from 'rxjs';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {MessageSelector} from './message-selector';

describe('Message Selector', () => {

  it('should select message with id `2`', async () => {
    // GIVEN
    const messages$ = new Subject<{id: string; text: string}>();
    const captor = new ObserveCaptor();

    // WHEN
    const selectMessagesById = new MessageSelector({source$: messages$, keySelector: message => message.id});
    selectMessagesById.select$('2').subscribe(captor);
    messages$.next({id: '1', text: 'foo'});
    messages$.next({id: '2', text: 'bar'});
    messages$.next({id: '3', text: 'foobar'});

    // THEN
    expect(captor.getValues()).toEqual([{id: '2', text: 'bar'}]);
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should select messages with id `2`', async () => {
    // GIVEN
    const messages$ = new Subject<{id: string; text: string}>();
    const captor = new ObserveCaptor();

    // WHEN
    const selectMessagesById = new MessageSelector({source$: messages$, keySelector: message => message.id});
    selectMessagesById.select$('2').subscribe(captor);
    messages$.next({id: '1', text: 'msg-1'});
    messages$.next({id: '2', text: 'msg-2'});
    messages$.next({id: '1', text: 'msg-3'});
    messages$.next({id: '2', text: 'msg-4'});

    // THEN
    expect(captor.getValues()).toEqual([{id: '2', text: 'msg-2'}, {id: '2', text: 'msg-4'}]);
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should support multiple subscribers on the same key', async () => {
    // GIVEN
    const messages$ = new Subject<{id: string; text: string}>();
    const captor1 = new ObserveCaptor();
    const captor2 = new ObserveCaptor();

    // WHEN
    const selectMessagesById = new MessageSelector({source$: messages$, keySelector: message => message.id});
    selectMessagesById.select$('1').subscribe(captor1);
    selectMessagesById.select$('1').subscribe(captor2);

    messages$.next({id: '1', text: 'foo'});
    messages$.next({id: '2', text: 'bar'});

    // THEN
    expect(captor1.getValues()).toEqual([{id: '1', text: 'foo'}]);
    expect(captor1.hasCompleted()).toBeFalse();

    expect(captor2.getValues()).toEqual([{id: '1', text: 'foo'}]);
    expect(captor2.hasCompleted()).toBeFalse();
  });

  it('should not buffer messages sent before subscription', async () => {
    // GIVEN
    const messages$ = new Subject<{id: string; text: string}>();
    const captor = new ObserveCaptor();

    // WHEN
    const selectMessagesById = new MessageSelector({source$: messages$, keySelector: message => message.id});
    messages$.next({id: '1', text: 'foo'});
    selectMessagesById.select$('1').subscribe(captor);

    // THEN
    expect(captor.getValues()).toEqual([]);
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should complete when disconnected', async () => {
    // GIVEN
    const messages$ = new Subject<string>();
    const captor = new ObserveCaptor();

    // WHEN
    const selectMessagesById = new MessageSelector({source$: messages$, keySelector: identity});
    selectMessagesById.select$('foo').subscribe(captor);
    selectMessagesById.disconnect();
    messages$.next('foo');

    // THEN
    expect(captor.getValues()).toEqual([]);
    expect(captor.hasCompleted()).toBeTrue();
    expect(selectMessagesById.ɵsubscriberCount()).toBe(0);
  });

  it('should complete when the source completes', async () => {
    // GIVEN
    const source$ = new Subject<string>();
    const captor = new ObserveCaptor();

    const selectMessagesById = new MessageSelector({source$, keySelector: identity});
    selectMessagesById.select$('1').subscribe(captor);
    expect(captor.hasCompleted()).toBeFalse();

    // WHEN completing the source
    source$.complete();

    // THEN expect source to be completed
    expect(captor.hasCompleted()).toBeTrue();
    expect(selectMessagesById.ɵsubscriberCount()).toBe(0);
  });

  it('should error when the source errors', async () => {
    // GIVEN
    const source$ = new Subject<string>();
    const captor = new ObserveCaptor();
    const selectMessagesById = new MessageSelector({source$, keySelector: identity});
    selectMessagesById.select$('1').subscribe(captor);

    // WHEN erroring the source
    source$.error('error');

    // THEN expect source to be errored
    expect(captor.hasErrored()).toBeTrue();
    expect(selectMessagesById.ɵsubscriberCount()).toBe(0);
  });

  it('should unsubscribe when unsubscribing a subscriber', async () => {
    // GIVEN
    const messageSelector = new MessageSelector({source$: NEVER, keySelector: identity});

    // WHEN subscribing subscriber 1
    const subscription1 = messageSelector.select$('1').subscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(1);

    // WHEN subscribing subscriber 2
    const subscription2 = messageSelector.select$('1').subscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(2);

    // WHEN subscribing subscriber 3
    const subscription3 = messageSelector.select$('2').subscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(3);

    // WHEN unsubscribing subscriber 1
    subscription1.unsubscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(2);

    // WHEN unsubscribing subscriber 2
    subscription2.unsubscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(1);

    // WHEN unsubscribing subscriber 3
    subscription3.unsubscribe();
    // THEN
    expect(messageSelector.ɵsubscriberCount()).toBe(0);
  });
});
