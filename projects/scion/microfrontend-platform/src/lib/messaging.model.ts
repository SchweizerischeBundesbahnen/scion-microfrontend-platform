/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Capability, Qualifier } from './platform.model';
import { MonoTypeOperatorFunction, Observable, of, OperatorFunction, pipe, throwError } from 'rxjs';
import { filter, map, mergeMap, takeWhile } from 'rxjs/operators';

/**
 * Represents a message with headers to transport additional information with a message.
 *
 * @category Messaging
 */
export interface Message {
  /**
   * Additional information attached to this message.
   *
   * Header values must be JSON serializable. If no headers are set, the `Map` is empty.
   */
  headers: Map<string, any>;
}

/**
 * Represents an intent issued by an application.
 *
 * The intent is transported to all clients that provide a satisfying capability visible to the issuing application.
 *
 * @category Messaging
 */
export interface IntentMessage<BODY = any> extends Message {
  /**
   * Intent that represents this message.
   */
  intent: Intent;
  /**
   * Optional data passed along with the intent.
   */
  body?: BODY;
  /**
   * Capability that fulfills the intent.
   */
  capability: Capability;
}

/**
 * The intent is the message that a micro application passes to interact with functionality that is available in the form of a capability.
 *
 * The platform transports the intent to the micro applications that provide the requested capability. A micro application can issue an
 * intent only if having declared an intention in its manifest. Otherwise, the platform rejects the intent.
 *
 * An intent is formulated in an abstract way, having assigned a type, and optionally a qualifier. This information is used for resolving
 * the capability; thus, it can be thought of as a form of capability addressing.
 *
 * @category Messaging
 */
export interface Intent {
  /**
   * Type of functionality to intend.
   */
  type: string;
  /**
   * The qualifier is an abstract description of the intent and is expressed in the form of a dictionary.
   *
   * When issuing an intent, the qualifier must be exact, i.e. not contain wildcards.
   */
  qualifier?: Qualifier;
  /**
   * Parameters allow additional data to be passed along with the intent.
   *
   * They are part of the contract between the intent publisher and the capability provider. The capability provider
   * can declare mandatory and optional parameters. No additional parameters may be included.
   *
   * Parameters have no effect on the intent routing, unlike the qualifier. If mandatory parameters
   * are missing or non-specified parameters are included, the intent is rejected.
   */
  params?: Map<string, any>;
}

/**
 * Represents a message published to a topic.
 *
 * The message is transported to all consumers subscribed to the topic.
 *
 * @category Messaging
 */
export interface TopicMessage<BODY = any> extends Message {
  /**
   * The topic where to publish this message to.
   */
  topic: string;
  /**
   * Optional message.
   */
  body?: BODY;
  /**
   * Instructs the broker to store this message as retained message for the topic. With the retained flag set to `true`,
   * a client receives this message immediately upon subscription. The broker stores only one retained message per topic.
   */
  retain?: boolean;
  /**
   * Contains the resolved values of the wildcard segments as specified in the topic.
   * For example: If subscribed to the topic `person/:id` and a message is published to the topic `person/5`,
   * the resolved id with the value `5` is contained in the params map.
   */
  params?: Map<string, string>;
}

/**
 * Declares headers set by the platform when sending a message.
 *
 * Clients are allowed to read platform-defined headers from a message.
 *
 * @category Messaging
 */
export enum MessageHeaders {
  /**
   * Identifies the sending client instance of a message.
   * This header is set by the platform when publishing a message or intent.
   */
  ClientId = 'ɵCLIENT_ID',
  /**
   * Identifies the sending application of a message.
   * This header is set by the platform when publishing a message or intent.
   */
  AppSymbolicName = 'ɵAPP_SYMBOLIC_NAME',
  /**
   * Unique identity of the message.
   * This header is set by the platform when publishing a message or intent.
   */
  MessageId = 'ɵMESSAGE_ID',
  /**
   * Destination to which to send a response to this message.
   * This header is set by the platform when sending a request.
   */
  ReplyTo = 'ɵREPLY_TO',
  /**
   * The time the message was sent.
   * This header is set by the platform when publishing a message or intent.
   */
  Timestamp = 'ɵTIMESTAMP',
  /**
   * Use this header to set the request method to indicate the desired action to be performed for a given resource.
   * @see RequestMethods
   */
  Method = 'ɵMETHOD',
  /**
   * Use this header to set the response status code to indicate whether a request has been successfully completed.
   * See {@link ResponseStatusCodes} for available status codes. Other codes are also allowed.
   *
   * Status codes are primarily used in request-reply communication. In request-response communication, by default,
   * the requestor’s Observable never completes. However, the replier can include a response status code in the reply’s
   * headers, allowing to control the lifecycle of the requestor’s Observable.
   *
   * For example, the status code {@link ResponseStatusCodes.TERMINAL 250} allows completing the requestor’s Observable
   * after emitted the reply, or the status code {@link ResponseStatusCodes.ERROR 500} to error the Observable.
   *
   * Note that the platform evaluates status codes only in request-response communication. They are ignored when observing
   * topics or intents in pub/sub communication but can still be used; however, they must be handled by the application,
   * e.g., by using the {@link throwOnErrorStatus} SCION RxJS operator.
   *
   * @see ResponseStatusCodes
   */
  Status = 'ɵSTATUS',
  /**
   * Unique identity of a topic subscriber.
   *
   * @internal
   */
  ɵTopicSubscriberId = 'ɵTOPIC_SUBSCRIBER_ID',
}

/**
 * Defines a set of request methods to indicate the desired action to be performed for a given resource.
 *
 * @category Messaging
 */
export enum RequestMethods {
  /**
   * The GET method requests a representation of the specified resource. Requests using GET should only retrieve data.
   */
  GET = 'GET',
  /**
   * The DELETE method deletes the specified resource.
   */
  DELETE = 'DELETE',
  /**
   * The PUT method replaces all current representations of the target resource with the request payload.
   */
  PUT = 'PUT',
  /**
   * The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
   */
  POST = 'POST',
  /**
   * The OBSERVE method is used to observe the specified resource.
   */
  OBSERVE = 'OBSERVE'
}

/**
 * Defines a set of response status codes to indicate whether a request has been successfully completed.
 *
 * @see throwOnErrorStatus
 * @see MessageClient.request$
 * @see IntentClient.request$
 *
 * @category Messaging
 */
export enum ResponseStatusCodes {
  /**
   * The request has succeeded.
   */
  OK = 200,
  /**
   * The request has succeeded. No further response to be expected.
   *
   * In request-reply communication, setting this status code will complete the requestor's Observable
   * after emitted the reply. The reply is only emitted if not `undefined`.
   */
  TERMINAL = 250,
  /**
   * The receiver could not understand the request due to invalid syntax.
   *
   * In request-reply communication, setting this status code will error the requestor's Observable.
   */
  BAD_REQUEST = 400,
  /**
   * The receiver could not find the requested resource.
   *
   * In request-reply communication, setting this status code will error the requestor's Observable.
   */
  NOT_FOUND = 404,
  /**
   * The receiver encountered an internal error. Optionally, set the error as message payload.
   *
   * In request-reply communication, setting this status code will error the requestor's Observable.
   */
  ERROR = 500,
}

/**
 * Returns an Observable that mirrors the source Observable unless receiving a message with
 * a response status code greater than or equal to 400. Then, the stream will end with an
 * {@link RequestError error} and the source Observable unsubscribed.
 *
 * When receiving a message with the response status code {@link ResponseStatusCodes.TERMINAL},
 * the Observable emits this message and completes.
 *
 * If a message does not include a response status code, the message is emitted as is.
 *
 * Note that this operator is installed in {@link MessageClient.request$} and {@link IntentClient.request$}.
 *
 * @category Messaging
 */
export function throwOnErrorStatus<BODY>(): MonoTypeOperatorFunction<TopicMessage<BODY>> {
  return pipe(
    mergeMap((message: TopicMessage<BODY>): Observable<TopicMessage<BODY>> => {
      const status = message.headers.get(MessageHeaders.Status) ?? ResponseStatusCodes.OK;
      if (status < 400) {
        return of(message); // 1xx: informational responses, 2xx: successful responses, 4xx: client errors, 5xx: server errors
      }

      if (typeof message.body === 'string') {
        return throwError(new RequestError(message.body, status, message));
      }

      switch (status) {
        case ResponseStatusCodes.BAD_REQUEST: {
          return throwError(new RequestError('The receiver could not understand the request due to invalid syntax.', status, message));
        }
        case ResponseStatusCodes.NOT_FOUND: {
          return throwError(new RequestError('The receiver could not find the requested resource.', status, message));
        }
        case ResponseStatusCodes.ERROR: {
          return throwError(new RequestError('The receiver encountered an internal error.', status, message));
        }
        default: {
          return throwError(new RequestError('Request error.', status, message));
        }
      }
    }),
    takeWhile((message: TopicMessage<BODY>) => {
      return message.headers.get(MessageHeaders.Status) !== ResponseStatusCodes.TERMINAL;
    }, true),
    filter((message: TopicMessage<BODY>) => {
      const isTerminalMessage = message.headers.get(MessageHeaders.Status) === ResponseStatusCodes.TERMINAL;
      return (!isTerminalMessage || message.body !== undefined);
    }),
  );
}

/**
 * Maps each message to its body.
 *
 * @category Messaging
 */
export function mapToBody<T>(): OperatorFunction<TopicMessage<T> | IntentMessage<T>, T> {
  return map(message => message.body);
}

/**
 * Indicates that the request handler responded with an error response.
 *
 * @ignore
 */
export class RequestError extends Error {

  constructor(error: string, public status: number, public msg: Message) {
    super(error);
    this.name = 'RequestError';
  }
}
