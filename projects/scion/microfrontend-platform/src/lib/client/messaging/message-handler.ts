import {MessageClient, takeUntilUnsubscribe} from './message-client';
import {Message, MessageHeaders, ResponseStatusCodes} from '../../messaging.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {EMPTY, from, Observable, of, Subscription, throwError} from 'rxjs';
import {runSafe} from '../../safe-runner';
import {stringifyError} from '../../error.util';
import {filter, finalize, takeUntil} from 'rxjs/operators';
import {MicrofrontendPlatformRef} from '../../microfrontend-platform-ref';
import {PlatformState} from '../../platform-state';

/**
 * Subscribes to messages, passing each message to the callback.
 *
 * The callback can return a response to be transported to the requestor, if any. When the final response is produced,
 * the handler terminates the communication, completing the requestor's Observable. If the callback errors, the error is
 * transported to the requestor, erroring the requestor's Observable.
 *
 * @internal
 */
export class MessageHandler<MSG extends Message, REPLY> {

  private _messageClient = Beans.get(MessageClient);

  /**
   * Represents this handler's subscription for receiving messages. Calling {@link Subscription.unsubscribe} will also complete
   * the Observable of all requestors, if any.
   */
  public readonly subscription = new Subscription();

  constructor(message$: Observable<MSG>, private _callback: (message: MSG) => Observable<REPLY> | Promise<REPLY> | REPLY | void) {
    this.subscription.add(message$.subscribe(message => {
      if (message.headers.has(MessageHeaders.ReplyTo)) {
        this.handleMessage(message);
      }
      else {
        this.consumeMessage(message);
      }
    }));
  }

  /**
   * The requestor has initiated a fire-and-forget communication, thus we simply pass the message to the callback and ignore response(s).
   */
  private consumeMessage(message: MSG): void {
    runSafe(() => this._callback(message));
  }

  /**
   * The requestor has initiated a request-response communication, thus we pass the request to the callback and send response(s)
   * or a potential completion or error to the requestor.
   */
  private handleMessage(request: MSG): void {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo);
    const platformStopping$ = Beans.get(MicrofrontendPlatformRef).state$.pipe(filter(state => state === PlatformState.Stopping));

    // Invoke the callback to produce value(s).
    let reply: Observable<REPLY> | Promise<REPLY> | REPLY | void;
    try {
      reply = this._callback(request);
    }
    catch (error) {
      reply = throwError(() => error);
    }

    // Send response(s) or a potential completion or error back to the requestor.
    let observableStatus: 'alive' | 'completed' | 'errored' = 'alive';
    this.subscription.add(fromCallbackResult$(reply)
      .pipe(
        takeUntilUnsubscribe(replyTo), // unsubscribe once the requestor terminates the communication
        takeUntil(platformStopping$), // terminate the communication when the platform is shutting down.
        finalize(() => {
          // Note that the `finalize` operator is also called when unsubscribing from the observable, e.g. when unsubscribing
          // from the handler. If the observable errors or completes, the `finalize` operator is guaranteed to be called after
          // the observer's `complete` or `error` methods; thus, the variable `observableStatus` is only `alive` when
          // unsubscribing from the observable.
          if (observableStatus === 'alive') {
            // Terminate the communication when the handler is being unsubscribed.
            const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL);
            this._messageClient.publish(replyTo, undefined, {headers: replyHeaders}).then();
          }
        }),
      )
      .subscribe({
        next: next => {
          // Transport the value to the requestor.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK);
          this._messageClient.publish(replyTo, next, {headers: replyHeaders}).then();
        },
        error: error => {
          observableStatus = 'errored';
          // Transport the error to the requestor.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR);
          this._messageClient.publish(replyTo, stringifyError(error), {headers: replyHeaders}).then();
        },
        complete: () => {
          observableStatus = 'completed';
          // Terminate the communication when finished producing responses.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL);
          this._messageClient.publish(replyTo, undefined, {headers: replyHeaders}).then();
        },
      }));
  }
}

/**
 * Creates an Observable from the result of the callback.
 *
 * If the callback returns no value (`void`), returns `undefined`, or returns a Promise that resolves to `undefined`,
 * the returned observable will complete immediately.
 */
function fromCallbackResult$<T>(value: T | Observable<T> | Promise<T>): Observable<T> {
  if (value === undefined) {
    return EMPTY;
  }
  if (value instanceof Observable) {
    return value;
  }
  if (value instanceof Promise) {
    return from(value).pipe(filter(resolved => resolved !== undefined));
  }
  return of(value);
}
