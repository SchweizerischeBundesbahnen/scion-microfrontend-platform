/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Provides utilities for working with topics.
 *
 * @internal
 */
export namespace Topics {

  /**
   * Tests whether given topic contains wildcard segments.
   */
  export function containsWildcardSegments(topic: string): boolean {
    return split(topic).some(isWildcardSegment);
  }

  /**
   * Tests whether given topic contains empty segments.
   */
  export function containsEmptySegments(topic: string): boolean {
    return topic.split('/').some(segment => !segment.length);
  }

  /**
   * Tests whether given segment is a wildcard segment.
   */
  export function isWildcardSegment(segment: string): boolean {
    return segment.startsWith(':') && segment.length > 1;
  }

  /**
   * Splits given topic into its segments.
   */
  export function split(topic: string | null | undefined): string[] {
    return topic?.split('/').filter(Boolean) ?? [];
  }

  /**
   * Returns unnamed wildcard permutations for given exact topic.
   * These are 2^n variations, where n is the number of segments.
   *
   * Example:
   * Topic: myhome/kitchen/temperature
   *
   * +-----------+-----------+-----------*-+
   * | Segment 1 | Segment 2 | Segment 3   |
   * +-----------+-----------+-*-----------+
   * | myhome    | kitchen   | temperature |
   * | myhome    | kitchen   | *           |
   * | myhome    | *         | temperature |
   * | myhome    | *         | *           |
   * | *         | kitchen   | temperature |
   * | *         | kitchen   | *           |
   * | *         | *         | temperature |
   * | *         | *         | *           |
   * +-----------+-----------+-------------+
   */
  export function computeWildcardSegmentPermutations(topic: string | string[], wildcardCharacter: string): string[] {
    const segments = typeof topic === 'string' ? Topics.split(topic) : topic;

    if (segments.length === 1) {
      return [segments[0], wildcardCharacter];
    }

    return computeWildcardSegmentPermutations(segments.slice(1), wildcardCharacter).reduce((permutations, permutation) => {
      permutations.push(`${segments[0]}/${permutation}`);
      permutations.push(`${wildcardCharacter}/${permutation}`);
      return permutations;
    }, new Array<string>());
  }

  /**
   * Replaces named wildcard segments with given replacement.
   *
   * Example: "myhome/:room/temperature" => "myhome/REPLACEMENT/temperature"
   *
   */
  export function replaceWildcardSegments(topic: string, replacement: string): string {
    return topic.replace(/:[^/]+/g, replacement);
  }

  /**
   * Validates given topic.
   *
   * @return `null` if valid, or the `Error` otherwise.
   */
  export function validateTopic(topic: string | null | undefined, options: {exactTopic: boolean}): Error | null {
    if (!topic) {
      return Error('[IllegalTopicError] Topic must not be `null`, `undefined` or empty');
    }
    if (Topics.containsEmptySegments(topic)) {
      return Error(`[IllegalTopicError] Topic must not contain empty segments [topic='${topic}']`);
    }
    if (options.exactTopic && Topics.containsWildcardSegments(topic)) {
      return Error(`[IllegalTopicError] Topic must be exact, i.e., not contain wildcard segments [topic='${topic}']`);
    }
    return null;
  }
}
