/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {merge, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Maps} from '@scion/toolkit/util';

/**
 * Selects items emitted by an Observable according to a static criterion.
 *
 * This selector was introduced to quickly filter many messages from many subscribers.
 * Instead of a predicate, a key is used to dispatch messages with O(1) complexity to the subscribers.
 *
 * Prior to this selector, performance degraded significantly when sending more than 1000 messages
 * simultaneously, since filtering of message acknowledgements per-subscriber scaled worse than linearly.
 *
 * ---
 * ### Usage
 *
 * ```ts
 * // Create message source.
 * const messages$ = new Subject<{id: string; text: string}>();
 *
 * // Create selector to filter messages by id.
 * const selectMessagesById = new MessageSelector({source$: messages$, keySelector: message => message.id});
 *
 * // Receive only messages with id '1'.
 * selectMessagesById.select$('1').subscribe(msg => {
 *   // do something
 * });
 *
 * // Emit messages.
 * messages$.next({id: '1', text: 'foo'});
 * messages$.next({id: '2', text: 'bar'});
 * ```
 *
 * @internal
 */
export class MessageSelector<T> {

  private _selectors = new Map<string, Array<Subject<T>>>;
  private _sourceError$ = new Subject<never>();
  private _sourceComplete$ = new Subject<void>();
  private _destroy$ = new Subject<void>();

  /**
   * @param config - Controls how to select messages.
   */
  constructor(config: SelectorConfig<T>) {
    const {source$, keySelector} = config;

    source$
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: item => {
          const key = keySelector(item);
          this._selectors.get(key)?.forEach(selector => selector.next(item));
        },
        error: error => this._sourceError$.error(error),
        complete: () => this._sourceComplete$.next(),
      });
  }

  /**
   * Selects items emitted by the source Observable that match the given key.
   *
   * @param key - Specifies the key to select items.
   */
  public select$<R extends T>(key: string): Observable<R> {
    return new Observable(observer => {
      const selector$ = new Subject<any>();
      Maps.addListValue(this._selectors, key, selector$);
      const subscription = merge(selector$, this._sourceError$)
        .pipe(takeUntil(this._sourceComplete$))
        .subscribe(observer);

      return () => {
        Maps.removeListValue(this._selectors, key, selector$);
        subscription.unsubscribe();
      };
    });
  }

  /**
   * Returns the current subscriber count.
   */
  public ɵsubscriberCount(): number {
    return Array.from(this._selectors.values()).reduce((count, selectors) => count + selectors.length, 0);
  }

  /**
   * Disconnects this selector from the source Observable.
   */
  public disconnect(): void {
    this._destroy$.next();
  }
}

/**
 * Controls how to select items.
 *
 * @internal
 */
export interface SelectorConfig<T> {
  /**
   * Specifies the Observable to select items from.
   */
  source$: Observable<T>;
  /**
   * Specifies the function to compute the key of an item.
   *
   * A selector can then subscribe for items matching the key.
   */
  keySelector: (item: T) => string;
}
