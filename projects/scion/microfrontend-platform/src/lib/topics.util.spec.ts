/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Topics} from './topics.util';

describe('Topics', () => {

  it('should detect wildcard segments in the topic', () => {
    expect(Topics.containsWildcardSegments('myhome/livingroom/temperature')).toBeFalse();
    expect(Topics.containsWildcardSegments('myhome/livingroom/:measurement')).toBeTrue();
    expect(Topics.containsWildcardSegments('myhome/kitchen/:measurement')).toBeTrue();
    expect(Topics.containsWildcardSegments('myhome/:room/temperature')).toBeTrue();
    expect(Topics.containsWildcardSegments('myhome/:room/:measurement')).toBeTrue();
    expect(Topics.containsWildcardSegments(':building/kitchen/:measurement')).toBeTrue();
    expect(Topics.containsWildcardSegments('myhome/:/temperature')).toBeFalse();
  });

  it('should detect wildcard segment', () => {
    expect(Topics.isWildcardSegment(':room')).toBeTrue();
    expect(Topics.isWildcardSegment('kitchen')).toBeFalse();
  });

  it('should split topic into its segments', () => {
    expect(Topics.split('topic')).toEqual(['topic']);
    expect(Topics.split('myhome/kitchen/temperature')).toEqual(['myhome', 'kitchen', 'temperature']);
    expect(Topics.split('myhome/:room/temperature')).toEqual(['myhome', ':room', 'temperature']);
    expect(Topics.split('')).toEqual([]);
    expect(Topics.split(null)).toEqual([]);
    expect(Topics.split(undefined)).toEqual([]);
  });

  it('should compute wildcard segment permutations', () => {
    expect(Topics.computeWildcardSegmentPermutations('topic', '*')).toEqual(jasmine.arrayWithExactContents(['topic', '*']));
    expect(Topics.computeWildcardSegmentPermutations('myhome/kitchen/temperature', '*')).toEqual(jasmine.arrayWithExactContents([
      'myhome/kitchen/temperature',
      'myhome/kitchen/*',
      'myhome/*/temperature',
      'myhome/*/*',
      '*/kitchen/temperature',
      '*/kitchen/*',
      '*/*/temperature',
      '*/*/*',
    ]));
  });

  it('should replace wildcard segments', () => {
    expect(Topics.replaceWildcardSegments('topic', '*')).toEqual('topic');
    expect(Topics.replaceWildcardSegments(':any', '*')).toEqual('*');
    expect(Topics.replaceWildcardSegments('*', '*')).toEqual('*');
    expect(Topics.replaceWildcardSegments('myhome/kitchen/temperature', '*')).toEqual('myhome/kitchen/temperature');
    expect(Topics.replaceWildcardSegments('myhome/:room/temperature', '*')).toEqual('myhome/*/temperature');
    expect(Topics.replaceWildcardSegments('myhome/:room/:measurement', '*')).toEqual('myhome/*/*');
    expect(Topics.replaceWildcardSegments(':building/:room/:measurement', '*')).toEqual('*/*/*');
    expect(Topics.replaceWildcardSegments(':building/kitchen/:measurement', '*')).toEqual('*/kitchen/*');
    expect(Topics.replaceWildcardSegments('myhome/:room/temperature', '*')).toEqual('myhome/*/temperature');
    expect(Topics.replaceWildcardSegments('myhome/:room/:measurement', '*')).toEqual('myhome/*/*');
  });

  it('should detect empty topic segments', () => {
    expect(Topics.containsEmptySegments('')).toBeTrue();
    expect(Topics.containsEmptySegments('/')).toBeTrue();
    expect(Topics.containsEmptySegments('/a')).toBeTrue();
    expect(Topics.containsEmptySegments('a/')).toBeTrue();
    expect(Topics.containsEmptySegments('/a/')).toBeTrue();
    expect(Topics.containsEmptySegments('a//c')).toBeTrue();
    expect(Topics.containsEmptySegments('/a/b/')).toBeTrue();
    expect(Topics.containsEmptySegments('/a/b')).toBeTrue();
    expect(Topics.containsEmptySegments('a/b/')).toBeTrue();
    expect(Topics.containsEmptySegments('/a/b/c')).toBeTrue();
    expect(Topics.containsEmptySegments('/a/b/c/')).toBeTrue();
    expect(Topics.containsEmptySegments('a/b/c/')).toBeTrue();
    expect(Topics.containsEmptySegments('a/b/c')).toBeFalse();
    expect(Topics.containsEmptySegments('a')).toBeFalse();
  });

  it('should validate a topic', () => {
    expect(Topics.validateTopic('a/b/c', {exactTopic: true})).toBeNull();
    expect(Topics.validateTopic('a/b/c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic('a/:b/c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a/:b/c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic(':a/b/c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic(':a/b/c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic('a/:b/c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a/:b/c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic('a/b/:c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a/b/:c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic(':a/:b/:c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic(':a/:b/:c', {exactTopic: false})).toBeNull();

    expect(Topics.validateTopic(null, {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic(null, {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic(undefined, {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic(undefined, {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('/', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('/', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('/a', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('/a', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('a/', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a/', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('/a/', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('/a/', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('/a/b/c', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('/a/b/c', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('a/b/c/', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a/b/c/', {exactTopic: false})).toMatch(/IllegalTopicError/);

    expect(Topics.validateTopic('a//b', {exactTopic: true})).toMatch(/IllegalTopicError/);
    expect(Topics.validateTopic('a//b', {exactTopic: false})).toMatch(/IllegalTopicError/);
  });
});
