/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

// See semantic versioning specification: https://semver.org/#semantic-versioning-specification-semver
const SEMVER_REGEX = /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<prerelease>.+))?/;

/*
 * Allows working with semantic versions (semver).
 *
 * ### Why not using `semver` NPM package (as of 2022-04)
 * We no longer depend on the NPM package `semver` as not yet been published as an ECMAScript module (ESM).
 * It is recommended to avoid dependencies on CommonJS modules as bundlers and minifiers may not be able to
 * optimize the application code, resulting in larger bundle size.
 *
 * For example, the Angular compiler would generate the following warning when using `semver`:
 * `Warning: ... depends on 'semver'. CommonJS or AMD dependencies can cause optimization bailouts.`
 *
 * ---
 *
 * The following rules for comparing two semantic versions are copied directly from the semantic versioning specification,
 * which can be found here: https://semver.org/#semantic-versioning-specification-semver
 *
 * ```
 * Precedence refers to how versions are compared to each other when ordered.
 *
 * 1. Precedence MUST be calculated by separating the version into major, minor, patch and pre-release identifiers
 *    in that order (Build metadata does not figure into precedence).
 *
 * 2. Precedence is determined by the first difference when comparing each of these identifiers from left to right as follows:
 *    Major, minor, and patch versions are always compared numerically.
 *    Example: 1.0.0 < 2.0.0 < 2.1.0 < 2.1.1.
 *
 * 3. When major, minor, and patch are equal, a pre-release version has lower precedence than a normal version:
 *    Example: 1.0.0-alpha < 1.0.0.
 *
 * 4. Precedence for two pre-release versions with the same major, minor, and patch version MUST be determined by comparing
 *    each dot separated identifier from left to right until a difference is found as follows:
 *
 *    1. Identifiers consisting of only digits are compared numerically.
 *    2. Identifiers with letters or hyphens are compared lexically in ASCII sort order.
 *    3. Numeric identifiers always have lower precedence than non-numeric identifiers.
 *    4. A larger set of pre-release fields has a higher precedence than a smaller set, if all of the preceding identifiers are equal.
 *
 *   Example: 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0.
 * ```
 *
 * NOTE: Use static class instead of namespace to be tree shakable, i.e., to not be included in client app.
 *
 * @internal
 */
export class semver {

  private constructor() {
  }

  /**
   * Return the major version number.
   */
  public static major(version: string | undefined | null): number {
    return parseVersion(version ?? '0.0.0').major;
  }

  /**
   * Tests if `version1` is lower than `version2`.
   *
   * @return `true` if `version1` is lower than `version2`, or `false` otherwise.
   *         The values `null` and `undefined` have lower precedence than a normal version.
   * @throws throws if passed version is not a valid semantic version.
   */
  public static lt(version1: string | undefined | null, version2: string | undefined | null): boolean {
    return compare(version1, version2) < 0;
  }
}

/**
 * Compares given two versions.
 *
 * @return -1: if `v1` is lower than `v2`
 *          0: if both version are identical
 *         +1: if `v1` is greater than `v2`
 */
function compare(v1: string | undefined | null, v2: string | undefined | null): number {
  if (!v1 && v2) {
    return -1;
  }
  if (!v1 && !v2) {
    return 0;
  }
  if (v1 && !v2) {
    return +1;
  }

  const semVer1 = parseVersion(v1!);
  const semVer2 = parseVersion(v2!);

  // Compare major version
  const majorCompare = Math.sign(semVer1.major - semVer2.major);
  if (majorCompare !== 0) {
    return majorCompare;
  }

  // Compare minor version
  const minorCompare = Math.sign(semVer1.minor - semVer2.minor);
  if (minorCompare !== 0) {
    return minorCompare;
  }

  // Compare patch version
  const patchCompare = Math.sign(semVer1.patch - semVer2.patch);
  if (patchCompare !== 0) {
    return patchCompare;
  }

  // Compare pre-release portion.
  return comparePreRelease(semVer1, semVer2);
}

/**
 * Compares the prerelease portion of two versions.
 *
 * @return -1: if `version1` is lower than `version2`
 *          0: if both version are identical
 *         +1: if `version1` is greater than `version2`
 */
function comparePreRelease(v1: SemVer, v2: SemVer): number {
  if (v1.preRelease && !v2.preRelease) {
    return -1;
  }
  if (!v1.preRelease && !v2.preRelease) {
    return 0;
  }
  if (!v1.preRelease && v2.preRelease) {
    return 1;
  }

  for (let i = 0; i < Math.max(v1.preRelease!.length, v2.preRelease!.length); i++) {
    const identifier1 = v1.preRelease![i];
    const identifier2 = v2.preRelease![i];

    if (identifier1 === undefined) {
      return -1;
    }
    if (identifier2 === undefined) {
      return +1;
    }

    if (typeof identifier1 === 'number' && typeof identifier2 === 'string') {
      return -1;
    }
    if (typeof identifier1 === 'string' && typeof identifier2 === 'number') {
      return +1;
    }

    if (identifier1 < identifier2) {
      return -1;
    }
    if (identifier1 > identifier2) {
      return +1;
    }
  }
  return 0;
}

/**
 * Parses given version into a {@link SemVer} instance.
 *
 * @throws throws if passed version is not a valid semantic version.
 */
function parseVersion(version: string): SemVer {
  const match = version.match(SEMVER_REGEX);
  if (!match) {
    throw Error(`[SemVerError] Version '${version}' is not a valid semantic version (semver).`);
  }

  return {
    major: +match.groups!['major']!,
    minor: +match.groups!['minor']!,
    patch: +match.groups!['patch']!,
    preRelease: match.groups!['prerelease']?.split('.').map(identifier => {
      const numericIdentifier = +identifier;
      return Number.isNaN(numericIdentifier) ? identifier : numericIdentifier;
    }),
  };
}

/**
 * Represents a parsed semantic version.
 */
interface SemVer {
  major: number;
  minor: number;
  patch: number;
  preRelease?: Array<string | number>;
}
