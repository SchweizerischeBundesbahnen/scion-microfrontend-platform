/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { concat, EMPTY, NEVER, Observable, Observer, of, Subject, TeardownLogic } from 'rxjs';
import { filter, map, mergeMapTo, startWith, switchMapTo, take, takeUntil } from 'rxjs/operators';
import { UUID } from '@scion/toolkit/uuid';
import { Beans, PreDestroy } from '../../bean-manager';
import { mapToBody, MessageClient } from '../messaging/message-client';
import { MessageHeaders, ResponseStatusCodes } from '../../messaging.model';
import { Contexts } from './context.model';
import { IS_PLATFORM_HOST } from '../../platform.model';

/**
 * Allows looking up contextual data set on a {@link SciRouterOutletElement `<sci-router-outlet>`} at any parent level.
 *
 * The platform allows associating contextual data with an outlet, which then is available in embedded content using {@link ContextService}.
 * Contextual data must be serializable with the structured clone algorithm.
 *
 * Each outlet spans a new context. A context is similar to a `Map`, but is linked to its parent outlet context, if any, thus forming a hierarchical tree structure.
 * When looking up a value and if the value is not found in the outlet context, the lookup is retried on the parent context, repeating until either a value
 * is found or the root of the context tree has been reached.
 *
 * The platform sets the following context values by default:
 *
 * | Key | Value type | Description |
 * |-----|------------|-------------|
 * | {@link OUTLET_CONTEXT ɵOUTLET} | {@link OutletContext} | Information about the outlet which embeds the microfrontend. |
 * | {@link ACTIVATION_CONTEXT ɵACTIVATION_CONTEXT} | {@link ActivationContext} | Information about the activation context if loaded by an activator. See {@link Activator} for more information about activators. |
 *
 *
 * @category Context
 */
export class ContextService implements PreDestroy {

  private _destroy$ = new Subject<void>();
  private _contextTreeChange$ = new Subject<Contexts.ContextTreeChangeEvent>();
  private _whenContextTreeChangeListenerInstalled: Promise<void>;

  constructor() {
    this._whenContextTreeChangeListenerInstalled = this.installContextTreeChangeListener(changeEvent => this._contextTreeChange$.next(changeEvent));
  }

  /**
   * Observes the context value associated with the given name.
   *
   * When the name is not found in a context, the lookup is retried on the parent context, repeating until either a value is found
   * or the root of the context tree has been reached.
   *
   * @param  name - The name of the context value to observe.
   * @return An Observable that emits the context value associated with the given name.
   *         Upon subscription, the tree of contexts is looked up for a value registered under the given name.
   *         If not found, the Observable emits `null`. The Observable never completes. It emits every time
   *         a value for the specified name is set or removed, and this at all levels of the context tree.
   */
  public observe$<T>(name: string): Observable<T | null> {
    if (Beans.get(IS_PLATFORM_HOST)) {
      return concat(of(null), NEVER);
    }

    return this._contextTreeChange$
      .pipe(
        filter(event => event.name === name),
        startWith(undefined as void),
        switchMapTo(this.lookupContextValue$<T>(name)),
      );
  }

  /**
   * Looks up the context value associated with the given name.
   *
   * When the name is not found in a context, the lookup is retried on the parent context, repeating until either a value is found
   * or the root of the context tree has been reached.
   *
   * @param name - The name of the context value to observe.
   * @return A Promise that resolves to the context value associated with the given name. It resolves to `null` if not found.
   */
  public lookup<T>(name: string): Promise<T | null> {
    return this.observe$<T>(name).pipe(take(1)).toPromise();
  }

  /**
   * Checks if a context value associated with the given name.
   *
   * @param name - The name of the context value to check if present.
   * @return A Promise that resolves to `true` if a context value is associated with the given name, or that resolves to `false` otherwise.
   */
  public isPresent<T>(name: string): Promise<boolean> {
    return this.lookup(name).then(value => value !== null);
  }

  /**
   * Observes the names of context values registered at any level in the context tree.
   *
   * @return An Observable that emits the names of context values registered at any level in the context tree.
   *         Upon subscription, it emits the names of context values currently registered, and then it emits whenever
   *         some value is registered or unregistered from a context. The Observable never completes.
   */
  public names$(): Observable<Set<string>> {
    if (Beans.get(IS_PLATFORM_HOST)) {
      return concat(of(new Set<string>()), NEVER);
    }

    return this._contextTreeChange$
      .pipe(
        startWith(undefined as void),
        switchMapTo(this.lookupContextNames$()),
      );
  }

  /**
   * Looks up the context tree for a value associated with the given name.
   *
   * @param  name - The name of the value to return.
   * @return An Observable that emits the context value associated with the given key and then completes.
   *         When the requested value is not found in a context, the Observable emits `null` and then completes.
   */
  private lookupContextValue$<T>(name: string): Observable<T | null> {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      const replyTo = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const contextValueLookupRequest = Contexts.newContextValueLookupRequest(name, replyTo);

      // Wait until the reply is received.
      Beans.get(MessageClient).onMessage$<T>(replyTo)
        .pipe(
          take(1),
          map(reply => reply.headers.get(MessageHeaders.Status) === ResponseStatusCodes.OK ? reply.body : null),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      // Send the request.
      Promise.all([whenSubscribedToReplyTopic(replyTo), this._whenContextTreeChangeListenerInstalled]).then(() => {
        window.parent.postMessage(contextValueLookupRequest, '*');
      });

      return (): void => unsubscribe$.next();
    });
  }

  /**
   * Looks up the context names of all values registered in the current and parent contexts.
   *
   * @return An Observable that emits the names of all values registered in the current and parent contexts and then completes.
   */
  private lookupContextNames$(): Observable<Set<string>> {
    return new Observable((observer: Observer<Set<string>>): TeardownLogic => {
      const replyTo = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const contextNamesLookupRequest = Contexts.newContextTreeNamesLookupRequest(replyTo);

      // Wait until the reply is received.
      Beans.get(MessageClient).onMessage$<Set<string>>(replyTo)
        .pipe(
          take(1),
          map(reply => reply.headers.get(MessageHeaders.Status) === ResponseStatusCodes.OK ? reply.body : new Set()),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      // Send the request.
      Promise.all([whenSubscribedToReplyTopic(replyTo), this._whenContextTreeChangeListenerInstalled]).then(() => {
        window.parent.postMessage(contextNamesLookupRequest, '*');
      });
      return (): void => unsubscribe$.next();
    });
  }

  /**
   * Installs a listener to get notified about context changes at any level in the context tree.
   *
   * @return A Promise that resolves when installed the listener.
   */
  private installContextTreeChangeListener(listener: (changeEvent: Contexts.ContextTreeChangeEvent) => void): Promise<void> {
    const replyTo = UUID.randomUUID();
    const contextObserveRequest = Contexts.newContextTreeObserveRequest(replyTo);

    return new Promise<void>(resolve => {
      // Receive change notifications.
      Beans.get(MessageClient).onMessage$<Contexts.ContextTreeChangeEvent | Contexts.RootContextSubscribeEventType>(replyTo)
        .pipe(
          mapToBody(),
          takeUntil(this._destroy$),
        )
        .subscribe((event: Contexts.ContextTreeChangeEvent | Contexts.RootContextSubscribeEventType) => {
          if (event === Contexts.RootContextSubscribeEvent) {
            resolve(); // resolve the promise as subscribed to all parent contexts.
          }
          else {
            listener(event);
          }
        });

      // Send the observe request.
      whenSubscribedToReplyTopic(replyTo).then(() => window.parent.postMessage(contextObserveRequest, '*'));
    });
  }

  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Resolves when subscribed to the given reply topic.
 *
 * @ignore
 */
function whenSubscribedToReplyTopic(topic: string): Promise<void> {
  return Beans.get(MessageClient).subscriberCount$(topic)
    .pipe(
      filter(count => count === 1),
      take(1),
      mergeMapTo(EMPTY))
    .toPromise()
    .then(() => Promise.resolve());
}
