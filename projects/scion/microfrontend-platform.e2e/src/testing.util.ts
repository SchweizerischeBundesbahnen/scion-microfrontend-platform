/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {FrameLocator, Locator, Page} from '@playwright/test';
import {exhaustMap, filter, firstValueFrom, map, pairwise, timer} from 'rxjs';

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
  const classAttr = await element.getAttribute('class');
  return classAttr?.split(/\s+/) ?? [];
}

/**
 * Finds an element in the given list supporting returning a promise in the predicate.
 */
export async function findAsync<T>(items: T[], predicate: (item: T) => Promise<boolean>): Promise<T> {
  for (const item of items) {
    if (await predicate(item)) {
      return item;
    }
  }
  throw Error('[ElementNotFoundError] Element not found.');
}

/**
 * Returns true if the element is present in the DOM.
 */
export async function isPresent(element: Locator): Promise<boolean> {
  return await waitUntilStable(() => element.count(), {probeInterval: 25}) > 0;
}

/**
 * Evaluates `location.href` in the browsing context of the specified locator.
 */
export async function getLocationHref(frameLocator: FrameLocator): Promise<string> {
  await frameLocator.locator('html').waitFor({state: 'attached'});
  return await frameLocator.locator('html').evaluate(() => window.location.href);
}

/**
 * Invokes `location.href` in the browsing context of the specified locator.
 */
export async function setLocationHref(locator: FrameLocator, url: string): Promise<void> {
  await locator.locator('html').evaluate((el, value) => window.location.href = value, url);
}

/**
 * Waits for a value to become stable.
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  const value$ = timer(0, options?.probeInterval ?? 100)
    .pipe(
      exhaustMap(async () => await value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}

/**
 * Waits until the frame URLs are stable, i.e., navigation has completed.
 *
 * Consider calling this method after a navigation before continuing browser interaction.
 */
export async function waitUntilNavigationStable(page: Page): Promise<void> {
  await Promise.all(page.frames().map(frame => waitUntilStable(() => frame.url(), {probeInterval: 500})));
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
  const groups = /(?<parts>[^{]*)({(?<flags>.*)})?/.exec(keystroke)!.groups;
  return {parts: groups!.parts!, flags: groups!.flags!};
}
