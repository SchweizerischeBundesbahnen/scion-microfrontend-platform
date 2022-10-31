/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Arrays} from '@scion/toolkit/util';
import {Topics} from './topics.util';

/**
 * Allows testing whether an exact topic matches a pattern topic. The pattern topic may contain wildcard segments.
 *
 * Topics are case-sensitive and consist of one or more segments, each separated by a forward slash.
 */
export class TopicMatcher {

  private readonly _patternSegments: string[];

  /**
   * Constructs a matcher that will match given topics against this pattern.
   *
   * @param pattern - Pattern to match topics. The pattern is a topic, not a regular expression; thus, it must consist of one or more segments,
   *                  each separated by a forward slash. The pattern supports wildcard segments beginning with a colon (`:`). Wildcard segments
   *                  act as a placeholder for any segment value.
   */
  constructor(pattern: string) {
    this._patternSegments = Topics.split(pattern);
    if (!this._patternSegments.length) {
      throw Error('[TopicMatcherError] Invalid pattern syntax. The pattern must consist of one or more topic segments, each separated by a forward slash.');
    }
  }

  /**
   * Attempts to match the given topic against the pattern which was passed to the constructor.
   *
   * If the match succeeds, then {@link MatcherResult.matches} evaluates to `true`. If the pattern contains wildcard segments,
   * the matched segments can be read using the property {@link TopicMessage.params} property.
   *
   * @param topic - The topic to match against the configured pattern; must be an exact topic, thus not contain wildcard segments.
   * @return The result of the topic matcher test.
   */
  public match(topic: string): MatcherResult {
    const inputTopicSegments = Topics.split(topic);
    const patternSegments = this._patternSegments;

    if (!inputTopicSegments.length) {
      throw Error('[TopicMatcherError] Invalid topic. The topic must consist of one or more segments, each separated by a forward slash.');
    }
    if (inputTopicSegments.some(Topics.isWildcardSegment)) {
      throw Error('[TopicMatcherError] Invalid topic. Wildcard segments not allowed in an exact topic.');
    }
    if (patternSegments.length !== inputTopicSegments.length) {
      return {matches: false};
    }
    if (Arrays.isEqual(inputTopicSegments, patternSegments, {exactOrder: true})) {
      return {matches: true, params: new Map()};
    }
    if (!patternSegments.some(Topics.isWildcardSegment)) {
      return {matches: false};
    }
    if (!patternSegments.every((patternSegment, i) => patternSegment === inputTopicSegments[i] || Topics.isWildcardSegment(patternSegment))) {
      return {matches: false};
    }

    return {
      matches: true,
      params: patternSegments.reduce((params, segment, i) => {
        if (Topics.isWildcardSegment(segment)) {
          return params.set(segment.substring(1), inputTopicSegments[i]);
        }
        return params;
      }, new Map()),
    };
  }
}

/**
 * Represents the result of a topic matcher test.
 */
export interface MatcherResult {
  /**
   * Indicates if the topic matches the pattern topic.
   */
  matches: boolean;
  /**
   * Contains the actual values for the wildcard segments as defined in the pattern topic; is only set if the match is successful.
   */
  params?: Map<string, string>;
}
