/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {firstValueFrom, Observer, timer} from 'rxjs';
import {MatcherResult, TopicMatcher} from '../../topic-matcher.util';
import {UUID} from '@scion/toolkit/uuid';
import {Dictionary} from '@scion/toolkit/util';

export function noop(): void { // eslint-disable-line @typescript-eslint/no-empty-function
}

export function testcase_1(): void {
  const testeeDiv = document.body.appendChild(document.createElement('div'));
  testeeDiv.innerText = 'TESTEE';
  testeeDiv.classList.add('testee');
}

export function testcase_2(params: Dictionary, observer: Observer<string>): void {
  observer.next('a');
  observer.next('b');
  observer.next('c');
  observer.complete();
}

export function testcase_3(params: Dictionary, observer: Observer<never>): void {
  observer.error('ERROR FROM SCRIPT');
}

export function testcase_4(): void {
  throw 'SCRIPT EXECUTION ERROR';
}

export function testcase_5(params: Dictionary, observer: Observer<void>): void {
  observer.complete();
}

export async function testcase_6(): Promise<void> {
  // Delay script execution.
  await firstValueFrom(timer(500));

  // Add testee div after delay.
  const testeeDiv = document.body.appendChild(document.createElement('div'));
  testeeDiv.innerText = 'TESTEE';
  testeeDiv.classList.add('testee', 'delayed');
}

export function testcase_7(params: Dictionary, observer: Observer<MatcherResult>): void {
  observer.next(new TopicMatcher('a/b/c').match('a/b/c')); // {TopicMatcher} is a project-specific type
}

export function testcase_8(params: Dictionary, observer: Observer<string>): void {
  observer.next(UUID.randomUUID()); // {UUID} is provided by `@scion/toolkit`
}

export function testcase_9a(): void {
  const testeeDiv = document.body.appendChild(document.createElement('div'));
  testeeDiv.innerText = 'TESTEE 1';
  testeeDiv.classList.add('testee-1');
}

export function testcase_9b(): void {
  const testeeDiv = document.body.appendChild(document.createElement('div'));
  testeeDiv.innerText = 'TESTEE 2';
  testeeDiv.classList.add('testee-2');
}

export function testcase_10a(params: Dictionary, observer: Observer<string>): void {
  observer.next('ready (10a)');
}

export function testcase_10b(params: Dictionary, observer: Observer<string>): void {
  observer.next('ready (10b)');
}

export function testcase_11(params: Dictionary, observer: Observer<any>): void {
  observer.next(params);
}
