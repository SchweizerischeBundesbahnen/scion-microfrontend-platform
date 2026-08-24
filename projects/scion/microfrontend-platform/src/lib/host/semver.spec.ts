/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {semver} from './semver';

describe('semver', () => {

  describe('semver#major', () => {
    it('should error if passing an invalid semver version', () => {
      expect(() => semver.major('1')).toThrow(/SemVerError/);
      expect(() => semver.major('1.0')).toThrow(/SemVerError/);
      expect(() => semver.major('')).toThrow(/SemVerError/);
    });

    it('should parse major version', () => {
      expect(semver.major('1.0.0')).toEqual(1);
      expect(semver.major('1.2.3')).toEqual(1);
      expect(semver.major('2.3.4')).toEqual(2);
      expect(semver.major('2.3.4')).toEqual(2);
      expect(semver.major('1.0.0-beta.2')).toEqual(1);
      expect(semver.major('2.0.0-beta.2')).toEqual(2);
    });

    it('should return "0" if the version is `null`', () => {
      expect(semver.major(null)).toEqual(0);
    });

    it('should return "0" if the version is `undefined`', () => {
      expect(semver.major(undefined)).toEqual(0);
    });
  });

  // See https://semver.org/#semantic-versioning-specification-semver
  describe('semver#lt', () => {

    it('should compare major, minor and patch version', () => {
      expect(semver.lt('1.0.0', '1.0.0'), '1.0.0 < 1.0.0').toBe(false);
      expect(semver.lt('1.0.0', '2.0.0'), '1.0.0 < 2.0.0').toBe(true);
      expect(semver.lt('2.0.0', '2.1.0'), '2.0.0 < 2.1.0').toBe(true);
      expect(semver.lt('2.1.0', '2.1.1'), '2.1.0 < 2.1.1').toBe(true);
      expect(semver.lt('2.1.0', '2.2.0'), '2.1.0 < 2.2.0').toBe(true);
      expect(semver.lt('2.1.1', '2.2.0'), '2.1.1 < 2.2.0').toBe(true);
      expect(semver.lt('2.1.1', '2.1.2'), '2.1.1 < 2.1.2').toBe(true);
    });

    it('should compare pre-release version', () => {
      expect(semver.lt('1.0.0-alpha', '1.0.0-alpha'), '1.0.0-alpha < 1.0.0-alpha').toBe(false);

      expect(semver.lt('1.0.0-alpha', '1.0.0'), '1.0.0-alpha < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-alpha'), '1.0.0 < 1.0.0-alpha').toBe(false);

      expect(semver.lt('1.0.0-alpha.1', '1.0.0'), '1.0.0-alpha.1 < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-alpha.1'), '1.0.0 < 1.0.0-alpha.1').toBe(false);

      expect(semver.lt('1.0.0-alpha.beta', '1.0.0'), '1.0.0-alpha.beta < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-alpha.beta'), '1.0.0, 1.0.0-alpha.beta').toBe(false);

      expect(semver.lt('1.0.0-beta', '1.0.0'), '1.0.0-beta < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-beta'), '1.0.0 < 1.0.0-beta').toBe(false);

      expect(semver.lt('1.0.0-beta.2', '1.0.0'), '1.0.0-beta.2 < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-beta.2'), '1.0.0 < 1.0.0-beta.2').toBe(false);

      expect(semver.lt('1.0.0-beta.11', '1.0.0'), '1.0.0-beta.11 < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-beta.11'), '1.0.0 < 1.0.0-beta.11').toBe(false);

      expect(semver.lt('1.0.0-rc.1', '1.0.0'), '1.0.0-rc.1 < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-rc.1'), '1.0.0 < 1.0.0-rc.1').toBe(false);

      expect(semver.lt('1.0.0-alpha', '1.0.0-alpha.1'), '1.0.0-alpha < 1.0.0-alpha.1').toBe(true);
      expect(semver.lt('1.0.0-alpha.1', '1.0.0-alpha'), '1.0.0-alpha.1 < 1.0.0-alpha').toBe(false);

      expect(semver.lt('1.0.0-alpha.1', '1.0.0-alpha.beta'), '1.0.0-alpha.1 < 1.0.0-alpha.beta').toBe(true);
      expect(semver.lt('1.0.0-alpha.beta', '1.0.0-alpha.1'), '1.0.0-alpha.beta < 1.0.0-alpha.1').toBe(false);

      expect(semver.lt('1.0.0-alpha.beta', '1.0.0-beta'), '1.0.0-alpha.beta < 1.0.0-beta').toBe(true);
      expect(semver.lt('1.0.0-beta', '1.0.0-alpha.beta'), '1.0.0-beta < 1.0.0-alpha.beta').toBe(false);

      expect(semver.lt('1.0.0-beta', '1.0.0-beta.2'), '1.0.0-beta < 1.0.0-beta.2').toBe(true);
      expect(semver.lt('1.0.0-beta.2', '1.0.0-beta'), '1.0.0-beta.2 < 1.0.0-beta').toBe(false);

      expect(semver.lt('1.0.0-beta.2', '1.0.0-beta.11'), '1.0.0-beta.2 < 1.0.0-beta.11').toBe(true);
      expect(semver.lt('1.0.0-beta.11', '1.0.0-beta.2'), '1.0.0-beta.11 < 1.0.0-beta.2').toBe(false);

      expect(semver.lt('1.0.0-beta.11', '1.0.0-rc.1'), '1.0.0-beta.11 < 1.0.0-rc.1').toBe(true);
      expect(semver.lt('1.0.0-rc.1', '1.0.0-beta.11'), '1.0.0-rc.1 < 1.0.0-beta.11').toBe(false);

      expect(semver.lt('1.0.0-rc.1', '1.0.0-rc.2'), '1.0.0-rc.1 < 1.0.0-rc.2').toBe(true);
      expect(semver.lt('1.0.0-rc.2', '1.0.0-rc.1'), '1.0.0-rc.2 < 1.0.0-rc.1').toBe(false);

      expect(semver.lt('1.0.0-rc.1', '1.0.0'), '1.0.0-rc.1 < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', '1.0.0-rc.1'), '1.0.0 < 1.0.0-rc.1').toBe(false);
    });

    it('should compare `null` lower than a normal version', () => {
      expect(semver.lt(null, '0.0.0'), 'null < 0.0.0').toBe(true);
      expect(semver.lt('0.0.0', null), '0.0.0 < null').toBe(false);

      expect(semver.lt(null, '0.0.0-beta.1'), 'null < 0.0.0-beta.1').toBe(true);
      expect(semver.lt('0.0.0-beta.1', null), '0.0.0-beta.1 < null').toBe(false);

      expect(semver.lt(null, '1.0.0'), 'null < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', null), '1.0.0 < null').toBe(false);

      expect(semver.lt(null, '1.0.0-beta.1'), 'null < 1.0.0-beta.1').toBe(true);
      expect(semver.lt('1.0.0-beta.1', null), '1.0.0-beta.1 < null').toBe(false);
    });

    it('should compare `undefined` lower than a normal version', () => {
      expect(semver.lt(undefined, '0.0.0'), 'undefined < 0.0.0').toBe(true);
      expect(semver.lt('0.0.0', undefined), '0.0.0 < undefined').toBe(false);

      expect(semver.lt(undefined, '0.0.0-beta.1'), 'undefined < 0.0.0-beta.1').toBe(true);
      expect(semver.lt('0.0.0-beta.1', undefined), '0.0.0-beta.1 < undefined').toBe(false);

      expect(semver.lt(undefined, '1.0.0'), 'undefined < 1.0.0').toBe(true);
      expect(semver.lt('1.0.0', undefined), '1.0.0 < undefined').toBe(false);

      expect(semver.lt(undefined, '1.0.0-beta.1'), 'undefined < 1.0.0-beta.1').toBe(true);
      expect(semver.lt('1.0.0-beta.1', undefined), '1.0.0-beta.1 < undefined').toBe(false);
    });

    it('should compare `undefined` and `null` identically', () => {
      expect(semver.lt(undefined, undefined), 'undefined < undefined').toBe(false);
      expect(semver.lt(undefined, null), 'undefined < null').toBe(false);
      expect(semver.lt(null, undefined), 'null < undefined').toBe(false);
      expect(semver.lt(null, null), 'null < null').toBe(false);
    });
  });
});
