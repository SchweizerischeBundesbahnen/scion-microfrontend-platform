/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {concat, firstValueFrom, NEVER, Observable, Observer, of, Subject, switchMap, TeardownLogic} from 'rxjs';
import {filter, first, map, startWith, take, takeUntil} from 'rxjs/operators';
import {UUID} from '@scion/toolkit/uuid';
import {MessageClient} from '../messaging/message-client';
import {mapToBody, MessageHeaders, ResponseStatusCodes} from '../../messaging.model';
import {ContextLookupOptions, Contexts} from './context.model';
import {IS_PLATFORM_HOST} from '../../platform.model';
import {Beans, PreDestroy} from '@scion/toolkit/bean-manager';
import {decorateObservable} from '../../observable-decorator';

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
 * | {@link ACTIVATION_CONTEXT ɵACTIVATION_CONTEXT} | {@link ActivationContext} | Information about the activation context if loaded by an activator. See {@link ActivatorCapability} for more information about activators. |
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
   * The Observable emits the most specific value, i.e., the value of the closest context that has a value associated with that name.
   * To collect all values in the context hierarchy associated with that name, set {@link ContextLookupOptions#collect} to `true`.
   *
   * If not finding a value associated with the given name in the current context, the lookup is retried on the parent context, repeating
   * until either a value is found or the root of the context tree has been reached. If not finding a value in any context, the Observable
   * emits `null`.
   *
   * @param  name - The name of the context value to observe.
   * @param  options - Instructs how to look up the context value.
   * @return An Observable that emits the value associated with the given name, or `null` if not finding a value.
   *         Upon subscription, the Observable emits the currently associated value, and then continuously when it changes, at any level
   *         in the context tree. It never completes.
   */
  public observe$<T>(name: string, options?: ContextLookupOptions & {collect: false}): Observable<T | null>;
  /**
   * Observes the context values associated with the given name.
   *
   * The Observable emits all associated values in the context tree as array in context-descending order,
   * i.e., more specific context values precede others, in other words, values of child contexts precede values of parent contexts.
   * If not finding a value in any context, the Observable emits an empty array.
   *
   * To only obtain the most specific value, i.e., the value of the closest context that has a value associated with that name,
   * set {@link ContextLookupOptions#collect} to `false`.
   *
   * @param  name - The name of the context values to observe.
   * @param  options - Instructs how to look up context values.
   * @return An Observable that emits the values associated with the given name, or an empty array if not finding a value.
   *         Upon subscription, the Observable emits currently associated values, and then continuously when they change.
   *         It never completes. Collected values are emitted as array in context-descending order, i.e., more specific
   *         context values precede others, in other words, values of child contexts precede values of parent contexts.
   */
  public observe$<T>(name: string, options: ContextLookupOptions & {collect: true}): Observable<T[]>;

  public observe$<T>(name: string, options?: ContextLookupOptions): Observable<T | T[] | null>;
  public observe$<T>(name: string, options?: ContextLookupOptions): Observable<T | T[] | null> {
    if (Beans.get(IS_PLATFORM_HOST)) {
      return concat(of(options?.collect ? [] : null), NEVER);
    }

    return this._contextTreeChange$
      .pipe(
        filter(event => event.name === name),
        startWith(undefined as void),
        switchMap(() => this.lookupContextValue$<T>(name, options)),
        decorateObservable(),
      );
  }

  /**
   * Looks up the context value associated with the given name.
   *
   * The Promise resolves to the most specific value, i.e., the value of the closest context that has a value associated with that name.
   * To collect all values in the context hierarchy associated with that name, set {@link ContextLookupOptions#collect} to `true`.
   *
   * If not finding a value associated with the given name in the current context, the lookup is retried on the parent context, repeating
   * until either a value is found or the root of the context tree has been reached. If not finding a value in any context, the returned
   * Promise resolves to `null`.
   *
   * @param  name - The name of the context value to look up.
   * @param  options - Instructs how to look up the context value.
   * @return A Promise that resolves to the value associated with the given name, or `null` if not finding a value.
   */
  public lookup<T>(name: string, options?: ContextLookupOptions & {collect: false}): Promise<T | null>;
  /**
   * Looks up context values associated with the given name.
   *
   * The Promise resolves to all associated values in the context tree as array in context-descending order,
   * i.e., more specific context values precede others, in other words, values of child contexts precede values of parent contexts.
   * If not finding a value in any context, the Promise resolves to an empty array.
   *
   * To only obtain the most specific value, i.e., the value of the closest context that has a value associated with that name,
   * set {@link ContextLookupOptions#collect} to `false`.
   *
   * @param  name - The name of the context values to look up.
   * @param  options - Instructs how to look up context values.
   * @return A Promise that resolves to the values associated with the given name, or an empty array if not finding a value.
   *         Collected values are sorted in context-descending order, i.e., more specific context values precede others, in
   *         other words, values of child contexts precede values of parent contexts.
   */
  public lookup<T>(name: string, options: ContextLookupOptions & {collect: true}): Promise<T[]>;
  public lookup<T>(name: string, options?: ContextLookupOptions): Promise<T | T[] | null>;
  public lookup<T>(name: string, options?: ContextLookupOptions): Promise<T | T[] | null> {
    return firstValueFrom(this.observe$<T>(name, options));
  }

  /**
   * Checks if a context value is associated with the given name at any level in the context tree.
   *
   * @param name - The name of the context value to check if present.
   * @return A Promise that resolves to `true` if a context value is associated with the given name, or that resolves to `false` otherwise.
   */
  public isPresent(name: string): Promise<boolean> {
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
        switchMap(() => this.lookupContextNames$()),
        decorateObservable(),
      );
  }

  /**
   * Looks up the context tree for a value associated with the given name.
   *
   * @param  name - The name of the value to return.
   * @param  options - Options to control context lookup.
   * @return An Observable that emits the context value associated with the given key and then completes.
   *         When the requested value is not found in a context, the Observable emits `null` and then completes.
   */
  private lookupContextValue$<T>(name: string, options?: ContextLookupOptions): Observable<T | T[] | null> {
    return new Observable((observer: Observer<T | T[] | null>): TeardownLogic => {
      const replyTo = UUID.randomUUID();
      const unsubscribe$ = new Subject<void>();
      const contextValueLookupRequest = Contexts.newContextValueLookupRequest(name, replyTo, options);

      // Wait until the reply is received.
      Beans.get(MessageClient).observe$<T | T[] | null | undefined>(replyTo)
        .pipe(
          take(1),
          map(reply => reply.headers.get(MessageHeaders.Status) === ResponseStatusCodes.OK ? (reply.body ?? null) : null),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      // Send the request.
      Promise.all([whenSubscribedToReplyTopic(replyTo), this._whenContextTreeChangeListenerInstalled])
        .then(() => window.parent.postMessage(contextValueLookupRequest, '*'))
        .catch(error => observer.error(error));

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
      Beans.get(MessageClient).observe$<Set<string>>(replyTo)
        .pipe(
          take(1),
          map(reply => reply.headers.get(MessageHeaders.Status) === ResponseStatusCodes.OK ? reply.body! : new Set<string>()),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      // Send the request.
      Promise.all([whenSubscribedToReplyTopic(replyTo), this._whenContextTreeChangeListenerInstalled])
        .then(() => window.parent.postMessage(contextNamesLookupRequest, '*'))
        .catch(error => observer.error(error));
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

    return new Promise<void>((resolve, reject) => {
      // Receive change notifications.
      Beans.get(MessageClient).observe$<Contexts.ContextTreeChangeEvent | Contexts.RootContextSubscribeEventType>(replyTo)
        .pipe(
          mapToBody(),
          takeUntil(this._destroy$),
        )
        .subscribe({
          next: (event: Contexts.ContextTreeChangeEvent | Contexts.RootContextSubscribeEventType) => {
            if (event === Contexts.RootContextSubscribeEvent) {
              resolve(); // resolve the promise as subscribed to all parent contexts.
            }
            else {
              listener(event);
            }
          },
          error: reject,
        });

      // Send the observe request.
      whenSubscribedToReplyTopic(replyTo)
        .then(() => window.parent.postMessage(contextObserveRequest, '*'))
        .catch(error => reject(error));
    });
  }

  /** @ignore */
  public preDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Resolves when subscribed to the given reply topic.
 */
function whenSubscribedToReplyTopic(topic: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Beans.get(MessageClient).subscriberCount$(topic)
      .pipe(first(count => count === 1))
      .subscribe({
        error: reject,
        complete: resolve,
      });
  });
}
