/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {TopicMatcher} from './topic-matcher.util';

describe('TopicMatcher', () => {

  it('should detect wildcard segments in the topic', () => {
    expect(TopicMatcher.containsWildcardSegments('myhome/livingroom/temperature')).toBeFalse();
    expect(TopicMatcher.containsWildcardSegments('myhome/livingroom/:measurement')).toBeTrue();
    expect(TopicMatcher.containsWildcardSegments('myhome/kitchen/:measurement')).toBeTrue();
    expect(TopicMatcher.containsWildcardSegments('myhome/:room/temperature')).toBeTrue();
    expect(TopicMatcher.containsWildcardSegments('myhome/:room/:measurement')).toBeTrue();
    expect(TopicMatcher.containsWildcardSegments(':building/kitchen/:measurement')).toBeTrue();
    expect(TopicMatcher.containsWildcardSegments('myhome/:/temperature')).toBeFalse();
  });

  it('should throw if the subscription topic is `null`, `undefined` or empty', () => {
    expect(() => new TopicMatcher('')).toThrowError(/TopicMatcherError/);
    expect(() => new TopicMatcher(null)).toThrowError(/TopicMatcherError/);
    expect(() => new TopicMatcher(undefined)).toThrowError(/TopicMatcherError/);
  });

  it('should throw if the publish topic is `null`, `undefined` or empty', () => {
    expect(() => new TopicMatcher('myhome/livingroom/temperature').match('')).toThrowError(/TopicMatcherError/);
    expect(() => new TopicMatcher('myhome/livingroom/temperature').match(null)).toThrowError(/TopicMatcherError/);
    expect(() => new TopicMatcher('myhome/livingroom/temperature').match(undefined)).toThrowError(/TopicMatcherError/);
  });

  it('should throw if the publish topic contains wildcard segments', () => {
    expect(() => new TopicMatcher('myhome/livingroom/temperature').match('myhome/livingroom/:temperature')).toThrowError(/TopicMatcherError/);
  });

  describe('The topic \'myhome/livingroom/temperature\'', () => {

    const publishTopic = 'myhome/livingroom/temperature';

    it('should not match the subscription \'myhome/livingroom\'', () => {
      const match = new TopicMatcher('myhome/livingroom').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should not match the subscription \'myhome/temperature/livingroom\'', () => {
      const match = new TopicMatcher('myhome/temperature/livingroom').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should not match the subscription \'myhome/livingroom/temperature/celsius\'', () => {
      const match = new TopicMatcher('myhome/livingroom/temperature/celsius').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should match the subscription \'myhome/livingroom/temperature\'', () => {
      const match = new TopicMatcher('myhome/livingroom/temperature').match(publishTopic);
      expect(match.matches).toBeTrue();
      expect(match.params).toEqual(new Map());
    });

    it('should match the subscription \'myhome/livingroom/:measurement\'', () => {
      const match = new TopicMatcher('myhome/livingroom/:measurement').match(publishTopic);
      expect(match.matches).toBeTrue();
      expect(match.params).toEqual(new Map().set('measurement', 'temperature'));
    });

    it('should not match the subscription \'myhome/kitchen/:measurement\'', () => {
      const match = new TopicMatcher('myhome/kitchen/:measurement').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should match the subscription \'myhome/:room/temperature\'', () => {
      const match = new TopicMatcher('myhome/:room/temperature').match(publishTopic);
      expect(match.matches).toBeTrue();
      expect(match.params).toEqual(new Map().set('room', 'livingroom'));
    });

    it('should match the subscription \'myhome/:room/:measurement\'', () => {
      const match = new TopicMatcher('myhome/:room/:measurement').match(publishTopic);
      expect(match.matches).toBeTrue();
      expect(match.params).toEqual(new Map().set('room', 'livingroom').set('measurement', 'temperature'));
    });

    it('should not match the subscription \':building/kitchen/:measurement\'', () => {
      const match = new TopicMatcher(':building/kitchen/:measurement').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should match the subscription \':building/livingroom/:measurement\'', () => {
      const match = new TopicMatcher(':building/livingroom/:measurement').match(publishTopic);
      expect(match.matches).toBeTrue();
      expect(match.params).toEqual(new Map().set('building', 'myhome').set('measurement', 'temperature'));
    });

    it('should not match the subscription \'myhome/bedroom/temperature\'', () => {
      const match = new TopicMatcher('myhome/bedroom/temperature').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });

    it('should not match the subscription \'myhome/:/temperature\'', () => {
      const match = new TopicMatcher('myhome/:/temperature').match(publishTopic);
      expect(match.matches).toBeFalse();
      expect(match.params).toBeUndefined();
    });
  });
});
