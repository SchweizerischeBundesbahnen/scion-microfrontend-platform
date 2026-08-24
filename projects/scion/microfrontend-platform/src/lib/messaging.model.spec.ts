/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Subject} from 'rxjs';
import {MessageHeaders, ResponseStatusCodes, throwOnErrorStatus, TopicMessage} from './messaging.model';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('Messaging', () => {

  describe('RxJS operator \'throwOnErrorStatus\'', () => {

    const source$ = new Subject<TopicMessage>();

    it('should pass the message if no response status code is present', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage());
      expect(captor.getValues()).toEqual([expect.objectContaining<Partial<TopicMessage>>({headers: new Map()})]);
      expect(captor.hasErrored(), 'errored check').toBe(false);
      expect(captor.hasCompleted(), 'completion check').toBe(false);
    });

    it('should pass messages with a status code between 0 and 399', () => {
      for (let i = 0; i <= 399; i++) {
        if (i === ResponseStatusCodes.TERMINAL) {
          continue;
        }

        const captor = new ObserveCaptor<TopicMessage>();
        source$.pipe(throwOnErrorStatus()).subscribe(captor);
        source$.next(newTopicMessage({statusCode: i}));
        expect(captor.getValues(), `expect message with status '${i}' to be emitted`).toEqual([expect.objectContaining<Partial<TopicMessage>>({headers: new Map().set(MessageHeaders.Status, i)})]);
        expect(captor.hasErrored(), `expect message with status '${i}' not to error the observable`).toBe(false);
        expect(captor.hasCompleted(), `expect message with status '${i}' not to complete the observable`).toBe(false);
      }
    });

    it('should pass the message but then immediately complete the Observable if the message has the status code \'250\' (TERMINAL)', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);
      source$.next(newTopicMessage({body: 'body', statusCode: ResponseStatusCodes.TERMINAL}));
      expect(captor.getValues()).toEqual([expect.objectContaining<Partial<TopicMessage>>({body: 'body', headers: new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL)})]);
      expect(captor.hasErrored(), 'errored check').toBe(false);
      expect(captor.hasCompleted(), 'completion check').toBe(true);
    });

    it('should complete the Observable if the message has the status code \'250\' (TERMINAL) [payload=undefined]', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);
      source$.next(newTopicMessage({body: undefined, statusCode: ResponseStatusCodes.TERMINAL}));
      expect(captor.getValues()).toEqual([]);
      expect(captor.hasErrored(), 'errored check').toBe(false);
      expect(captor.hasCompleted(), 'completion check').toBe(true);
    });

    it('should error the Observable if the message has a status code greater than or equal to 400', () => {
      for (let i = 400; i <= 999; i++) {
        const captor = new ObserveCaptor<TopicMessage>();
        source$.pipe(throwOnErrorStatus()).subscribe(captor);

        source$.next(newTopicMessage({statusCode: i}));
        expect(captor.getValues()).toEqual([]);
        expect(captor.hasErrored(), `expect message with status '${i}' to error the observable`).toBe(true);
        expect(captor.hasCompleted(), `expect message with status '${i}' not to complete the observable`).toBe(false);
        // expect(captor.getError()).toBeInstanceOf(RequestError); // does not work if transpiling to ES5 (tsconfig.spec.json), enable when dropping support for ES5
        expect(captor.getError().name).toEqual('RequestError');
        expect(captor.getError().status).toEqual(i);
        expect(captor.getError().msg).toEqual(expect.objectContaining<Partial<TopicMessage>>({headers: new Map().set(MessageHeaders.Status, i)}));
      }
    });

    it('should use the message text as error text, but only if it is of type \'string\'', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage({body: 'some error', statusCode: ResponseStatusCodes.ERROR}));
      expect(captor.getValues()).toEqual([]);
      expect(captor.hasErrored(), 'errored check').toBe(true);
      expect(captor.hasCompleted(), 'completion check').toBe(false);
      // expect(captor.getError()).toBeInstanceOf(RequestError); // does not work if transpiling to ES5 (tsconfig.spec.json), enable when dropping support for ES5
      expect(captor.getError().name).toEqual('RequestError');
      expect(captor.getError().status).toEqual(ResponseStatusCodes.ERROR);
      expect(captor.getError().msg).toEqual(newTopicMessage({body: 'some error', statusCode: ResponseStatusCodes.ERROR}));
      expect(captor.getError().message).toEqual('some error');
    });

    it('should set a default error message text if the message text is not of type \'string\' (status code 400)', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage({body: {}, statusCode: ResponseStatusCodes.BAD_REQUEST}));
      expect(captor.getError().message).toEqual('The receiver could not understand the request due to invalid syntax.');
    });

    it('should set a default error message text if the message body is not of type \'string\' (status code 404)', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage({body: {}, statusCode: ResponseStatusCodes.NOT_FOUND}));
      expect(captor.getError().message).toEqual('The receiver could not find the requested resource.');
    });

    it('should set a default error message text if the message body is not of type \'string\' (status code 500)', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage({body: {}, statusCode: ResponseStatusCodes.ERROR}));
      expect(captor.getError().message).toEqual('The receiver encountered an internal error.');
    });

    it('should set a default error message text if the message body is not of type \'string\' (status code 501)', () => {
      const captor = new ObserveCaptor<TopicMessage>();
      source$.pipe(throwOnErrorStatus()).subscribe(captor);

      source$.next(newTopicMessage({body: {}, statusCode: 501}));
      expect(captor.getError().message).toEqual('Request error.');
    });
  });
});

function newTopicMessage(template?: {
  body?: unknown;
  statusCode?: number;
}): TopicMessage {
  const topicMessage: TopicMessage = {
    topic: 'test-topic',
    headers: new Map(),
    body: template?.body,
  };
  if (template?.statusCode !== undefined) {
    topicMessage.headers.set(MessageHeaders.Status, template.statusCode);
  }
  return topicMessage;
}
