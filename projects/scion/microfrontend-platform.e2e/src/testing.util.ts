/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Locator} from '@playwright/test';
import {filter, firstValueFrom, map, pairwise, switchMap, timer} from 'rxjs';

/**
 * Returns if given CSS class is present on given element.
 */
export async function isCssClassPresent(element: Locator, cssClass: string): Promise<boolean> {
  const classes: string[] = await getCssClasses(element);
  return classes.includes(cssClass);
}

/**
 * Returns CSS classes on given element.
 */
export async function getCssClasses(element: Locator): Promise<string[]> {
  const classAttr: string = await element.getAttribute('class');
  if (!classAttr) {
    return [];
  }
  return classAttr.split(/\s+/);
}

/**
 * Finds an element in the given list supporting returning a promise in the predicate.
 */
export async function findAsync<T>(items: T[], predicate: (item: T) => Promise<boolean>): Promise<T | undefined> {
  for (const item of items) {
    if (await predicate(item)) {
      return item;
    }
  }
  return undefined;
}

/**
 * Returns true if the element is present in the DOM.
 */
export async function isPresent(element: Locator): Promise<boolean> {
  return await element.count() > 0;
}

/**
 * Evaluates `location.href` in the the browsing context of the specified locator.
 */
export async function getLocationHref(frameLocator: FrameLocator): Promise<string> {
  return await frameLocator.locator('html').evaluate(() => window.location.href);
}

/**
 * Invokes `location.href` in the the browsing context of the specified locator.
 */
export async function setLocationHref(locator: FrameLocator, url: string): Promise<void> {
  await locator.locator('html').evaluate((el, value) => window.location.href = value, url);
}

/**
 * Waits for a value to become stable.
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 500ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A>, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  const value$ = timer(0, options?.probeInterval ?? 500)
    .pipe(
      switchMap(() => value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}

/**
 * Parses given keystroke.
 *
 * Format: "keydown.control.alt.enter{preventDefault=true}"
 *         |<------- parts --------->|<----- flags ----->|
 *
 * @see keystroke.ts
 */
export function parseKeystroke(keystroke: string): {parts: string; flags: string} {
  const groups = keystroke.match(/(?<parts>[^{]*)({(?<flags>.*)})?/).groups;
  return {parts: groups['parts'], flags: groups['flags']};
}

