/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {$, browser, ElementFinder, Key, logging, protractor, WebElement} from 'protractor';
import Level = logging.Level;

/**
 * Returns if given CSS class is present on given element.
 */
export async function isCssClassPresent(elementFinder: ElementFinder, cssClass: string): Promise<boolean> {
  const classes: string[] = await getCssClasses(elementFinder);
  return classes.includes(cssClass);
}

/**
 * Returns CSS classes on given element.
 */
export async function getCssClasses(elementFinder: ElementFinder): Promise<string[]> {
  const classAttr: string = await elementFinder.getAttribute('class');
  if (!classAttr) {
    return [];
  }
  return classAttr.split(/\s+/);
}

/**
 * Sends the given keys to the currently focused element.
 */
export async function sendKeys(...keys: string[]): Promise<void> {
  return browser.actions().sendKeys(...keys).perform();
}

/**
 * Enters the given text into the given input field.
 *
 * By default, the text is set directly as input to the field, because 'sendKeys' is very slow.
 */
export async function enterText(text: string, elementFinder: ElementFinder, inputStrategy: 'sendKeys' | 'setValue' = 'setValue'): Promise<void> {
  const enterTextFn = async (): Promise<void> => {
    switch (inputStrategy) {
      case 'sendKeys': { // send keys is slow for long texts
        await elementFinder.clear();
        await elementFinder.click();
        await sendKeys(text);
        break;
      }
      case 'setValue': {
        // fire the 'input' event manually because not fired when setting the value with javascript
        await elementFinder.click();
        await browser.executeScript('arguments[0].value=arguments[1]; arguments[0].dispatchEvent(new Event(\'input\'));', elementFinder.getWebElement(), text);
        await sendKeys(Key.TAB);
        break;
      }
      default: {
        throw Error('[UnsupportedStrategyError] Input strategy not supported.');
      }
    }
  };

  try {
    await enterTextFn();
  }
  catch (error) {
    // Maybe, the element is not interactable because not scrolled into view. Try again, but scroll it into view first.
    // This error often occurs on GitHub CI, but not when running tests locally.
    if (error instanceof Error && error.name === 'ElementNotVisibleError') {
      console.log(`[ElementNotVisibleError] Element not interactable: ${elementFinder.locator().toString()}. Scrolling it into view and trying to enter text again.`, error);
      await browser.executeScript('arguments[0].scrollIntoView()', elementFinder.getWebElement());
      await enterTextFn();
      console.log(`Text successfully entered into input field: ${elementFinder.locator().toString()}`);
    }
    else {
      throw error;
    }
  }
}

/**
 * Sets an attribute of the given name and value on the specified element.
 */
export async function setAttribute(elementFinder: ElementFinder, name: string, value: string): Promise<void> {
  await browser.executeScript('arguments[0].setAttribute(arguments[1], arguments[2]);', elementFinder.getWebElement(), name, value);
}

/**
 * Removes the given attribute from the specified element.
 */
export async function removeAttribute(elementFinder: ElementFinder, name: string): Promise<void> {
  await browser.executeScript('arguments[0].removeAttribute(arguments[1]);', elementFinder.getWebElement(), name);
}

/**
 * Selects an option of a select dropdown.
 */
export async function selectOption(value: string, selectField: ElementFinder): Promise<void> {
  await selectField.$(`option[value="${value}"`).click();
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
 * Expects the given function to be rejected.
 *
 * Jasmine 3.5 provides 'expectAsync' expectation with the 'toBeRejectedWithError' matcher.
 * But, it does not support to test against a regular expression if the error is not of type 'Error'.
 *
 * The following expectation works:
 *   await expectAsync(Promise.reject(new Error("[SomeError] was thrown."))).toBeRejectedWithError(/SomeError/);
 *
 * Whereas rejecting by providing only a string value doesn't:
 *   await expectAsync(Promise.reject("[SomeError] was thrown.")).toBeRejectedWithError(/SomeError/);
 *
 * @see https://jasmine.github.io/api/3.5/async-matchers.html
 */
export function expectToBeRejectedWithError(promise: Promise<any>, expected?: RegExp): Promise<void> {
  const reasonExtractorFn = (reason: any): string => {
    if (typeof reason === 'string') {
      return reason;
    }
    if (reason instanceof Error) {
      return reason.message;
    }
    return reason.toString();
  };

  return promise
    .then(() => fail('Promise expected to be rejected but was resolved.'))
    .catch(reason => {
      if (expected && !reasonExtractorFn(reason).match(expected)) {
        fail(`Expected promise to be rejected with a reason matching '${expected.source}', but was '${reason}'.`);
      }
      else {
        expect(true).toBe(true);
      }
    });
}

/**
 * Expects the resolved map to contain at least the given map entries.
 *
 * Jasmine 3.5 provides 'mapContaining' matcher.
 */
export function expectMap(actual: Promise<Map<any, any>>): ToContainMatcher & {not: ToContainMatcher} {
  return {
    toContain: async (expected: Map<any, any>): Promise<void> => {
      const expectedTuples = [...expected];
      const actualTuples = [...await actual];
      await expect(actualTuples).toEqual(jasmine.arrayContaining(expectedTuples));
    },
    not: {
      toContain: async (expected: Map<any, any>): Promise<void> => {
        const expectedTuples = [...expected];
        const actualTuples = [...await actual];
        await expect(actualTuples).not.toEqual(jasmine.arrayContaining(expectedTuples));
      },
    },
  };
}

export interface ToContainMatcher {
  toContain(expected: Map<any, any>): Promise<void>;
}

/**
 * Reads the element value of the given element.
 */
export function getInputValue(elementFinder: ElementFinder): Promise<any> {
  return browser.executeScript('return arguments[0].value', elementFinder.getWebElement()) as Promise<any>;
}

/**
 * Reads the log from the browser console.
 * Note that log buffers are reset after this call.
 *
 * By default browser allows recording only WARNING and SEVERE level messages. In order to be able asserting any level,
 * you need to change the loggingPrefs.browser capabilities in `protractor.conf.js`.
 */
export async function consumeBrowserLog(severity: Level = Level.SEVERE, filter?: RegExp): Promise<string[]> {
  await browser.sleep(500); // waits until console log is written
  return (await browser.manage().logs().get('browser'))
    .filter(log => log.level === severity || Level.ALL === severity)
    .map(log => log.message)
    .map(message => message.match(/"(.+)"/)[1]) // log message is contained in double quotes
    .filter(log => filter ? log.match(filter) : true);
}

/**
 * Instructs Protractor to disable Angular synchronization while running the given function.
 */
export async function runOutsideAngularSynchronization<T = void>(fn: () => Promise<T>): Promise<T> {
  const waitForAngularEnabled = await browser.waitForAngularEnabled();
  await browser.waitForAngularEnabled(false);
  try {
    return await fn();
  }
  finally {
    await browser.waitForAngularEnabled(waitForAngularEnabled);
  }
}

/**
 * Invoke this method to wait until Protractor can detect the application as Angular application, if any.
 *
 * Since Angular 9 it may happen that Protractor does not recognize a starting Angular application as such if the Angular application has
 * asynchronous app initializers and is is embedded in an iframe. This causes the following error: 'Both AngularJS testability and Angular
 * testability are undefined'.
 */
export async function waitUntilTestingAppInteractableElseNoop(): Promise<void> {
  await runOutsideAngularSynchronization(async () => {
    // Check if the marker attribute 'data-sci-testing-app' is present, indicating that it is the testing application.
    const testingApp = await $('body[data-sci-testing-app]').isPresent();
    if (testingApp) {
      await browser.wait(protractor.ExpectedConditions.presenceOf($('*[ng-version]')));
    }
  });
}

/**
 * Switches the WebDriver execution context to the given iframe. When resolved, future Protractor commands are sent to that iframe.
 */
export async function switchToIframe(iframe: WebElement): Promise<void> {
  await browser.switchTo().frame(iframe);
  // If the iframe mounts the testing application, wait until Angular finished initialization, that is until asynchronous APP_INITIALIZERs completed.
  // Otherwise, Protractor throws errors like 'Both AngularJS testability and Angular testability are undefined'.
  await waitUntilTestingAppInteractableElseNoop();
}

/**
 * Moves backwards in the browser history.
 */
export async function browserNavigateBack(): Promise<void> {
  await browser.navigate().back();
  await waitUntilTestingAppInteractableElseNoop();
}

/**
 * Waits until the location of the currently active execution context matches the given URL (exact match), or throws an error if not entering that location within 5 seconds.
 */
export async function waitUntilLocation(url: string, timeout: number = 5000): Promise<void> {
  const expiryDate = Date.now() + timeout;
  while (true) {
    const currentUrl = await getUrlOfCurrentWebDriverExecutionContext();
    if (currentUrl === url) {
      break;
    }
    if (Date.now() > expiryDate) {
      throw Error(`[SpecTimeoutError] Timeout elapsed while waiting for the URL to be '${url}' [actual=${currentUrl}]`);
    }
  }
  await waitUntilTestingAppInteractableElseNoop();
}

/**
 * URL of the currently active WebDriver execution context.
 */
export async function getUrlOfCurrentWebDriverExecutionContext(): Promise<string> {
  return runOutsideAngularSynchronization((): Promise<string> => browser.executeScript('return window.location.href') as Promise<string>);
}

