import { MessageClient, takeUntilUnsubscribe } from './message-client';
import { Message, MessageHeaders, ResponseStatusCodes } from '../../messaging.model';
import { Beans } from '@scion/toolkit/bean-manager';
import { Observable, Subscription, throwError } from 'rxjs';
import { Observables } from '@scion/toolkit/util';
import { runSafe } from '../../safe-runner';
import { stringifyError } from '../../error.util';
import { filter, finalize } from 'rxjs/operators';

/**
 * Subscribes to messages, passing each message to the callback.
 *
 * The callback can return a response to be transported to the requestor, if any. When the final response is produced,
 * the handler terminates the communication, completing the requestor's Observable. If the callback errors, the error is
 * transported to the requestor, erroring the requestor's Observable.
 *
 * @ignore
 */
export class MessageHandler<IN, OUT> {

  private _messageClient = Beans.get(MessageClient);

  /**
   * Represents this handler's subscription for receiving messages. Calling {@link Subscription.unsubscribe} will also complete
   * the Observable of all requestors, if any.
   */
  public readonly subscription = new Subscription();

  constructor(message$: Observable<Message>, private _callback: (message: Message) => Observable<OUT> | Promise<OUT> | OUT | void) {
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
  private consumeMessage(message: Message): void {
    runSafe(() => this._callback(message));
  }

  /**
   * The requestor has initiated a request-response communication, thus we pass the request to the callback and send response(s)
   * or a potential completion or error to the requestor.
   */
  private handleMessage(request: Message): void {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo);

    // Invoke the callback to produce value(s).
    let reply: Observable<OUT> | Promise<OUT> | OUT | void;
    try {
      reply = this._callback(request);
    }
    catch (error) {
      reply = throwError(error);
    }

    // Send response(s) or a potential completion or error back to the requestor.
    let observableStatus: 'alive' | 'completed' | 'errored' = 'alive';
    this.subscription.add(Observables.coerce(reply)
      .pipe(
        filter(next => next !== undefined), // filter `undefined` responses, e.g., returned by void callbacks.
        takeUntilUnsubscribe(replyTo), // unsubscribe once the requestor terminates the communication
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
      .subscribe(
        next => {
          // Transport the value to the requestor.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.OK);
          this._messageClient.publish(replyTo, next, {headers: replyHeaders}).then();
        },
        error => {
          observableStatus = 'errored';
          // Transport the error to the requestor.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.ERROR);
          this._messageClient.publish(replyTo, stringifyError(error), {headers: replyHeaders}).then();
        },
        () => {
          observableStatus = 'completed';
          // Terminate the communication when finished producing responses.
          const replyHeaders = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL);
          this._messageClient.publish(replyTo, undefined, {headers: replyHeaders}).then();
        },
      ));
  }
}
