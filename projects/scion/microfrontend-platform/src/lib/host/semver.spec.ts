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
      expect(() => semver.major('1')).toThrowError(/SemVerError/);
      expect(() => semver.major('1.0')).toThrowError(/SemVerError/);
      expect(() => semver.major('')).toThrowError(/SemVerError/);
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
      expect(semver.lt('1.0.0', '1.0.0')).withContext('1.0.0 < 1.0.0').toBeFalse();
      expect(semver.lt('1.0.0', '2.0.0')).withContext('1.0.0 < 2.0.0').toBeTrue();
      expect(semver.lt('2.0.0', '2.1.0')).withContext('2.0.0 < 2.1.0').toBeTrue();
      expect(semver.lt('2.1.0', '2.1.1')).withContext('2.1.0 < 2.1.1').toBeTrue();
      expect(semver.lt('2.1.0', '2.2.0')).withContext('2.1.0 < 2.2.0').toBeTrue();
      expect(semver.lt('2.1.1', '2.2.0')).withContext('2.1.1 < 2.2.0').toBeTrue();
      expect(semver.lt('2.1.1', '2.1.2')).withContext('2.1.1 < 2.1.2').toBeTrue();
    });

    it('should compare pre-release version', () => {
      expect(semver.lt('1.0.0-alpha', '1.0.0-alpha')).withContext('1.0.0-alpha < 1.0.0-alpha').toBeFalse();

      expect(semver.lt('1.0.0-alpha', '1.0.0')).withContext('1.0.0-alpha < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-alpha')).withContext('1.0.0 < 1.0.0-alpha').toBeFalse();

      expect(semver.lt('1.0.0-alpha.1', '1.0.0')).withContext('1.0.0-alpha.1 < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-alpha.1')).withContext('1.0.0 < 1.0.0-alpha.1').toBeFalse();

      expect(semver.lt('1.0.0-alpha.beta', '1.0.0')).withContext('1.0.0-alpha.beta < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-alpha.beta')).withContext('1.0.0, 1.0.0-alpha.beta').toBeFalse();

      expect(semver.lt('1.0.0-beta', '1.0.0')).withContext('1.0.0-beta < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-beta')).withContext('1.0.0 < 1.0.0-beta').toBeFalse();

      expect(semver.lt('1.0.0-beta.2', '1.0.0')).withContext('1.0.0-beta.2 < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-beta.2')).withContext('1.0.0 < 1.0.0-beta.2').toBeFalse();

      expect(semver.lt('1.0.0-beta.11', '1.0.0')).withContext('1.0.0-beta.11 < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-beta.11')).withContext('1.0.0 < 1.0.0-beta.11').toBeFalse();

      expect(semver.lt('1.0.0-rc.1', '1.0.0')).withContext('1.0.0-rc.1 < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-rc.1')).withContext('1.0.0 < 1.0.0-rc.1').toBeFalse();

      expect(semver.lt('1.0.0-alpha', '1.0.0-alpha.1')).withContext('1.0.0-alpha < 1.0.0-alpha.1').toBeTrue();
      expect(semver.lt('1.0.0-alpha.1', '1.0.0-alpha')).withContext('1.0.0-alpha.1 < 1.0.0-alpha').toBeFalse();

      expect(semver.lt('1.0.0-alpha.1', '1.0.0-alpha.beta')).withContext('1.0.0-alpha.1 < 1.0.0-alpha.beta').toBeTrue();
      expect(semver.lt('1.0.0-alpha.beta', '1.0.0-alpha.1')).withContext('1.0.0-alpha.beta < 1.0.0-alpha.1').toBeFalse();

      expect(semver.lt('1.0.0-alpha.beta', '1.0.0-beta')).withContext('1.0.0-alpha.beta < 1.0.0-beta').toBeTrue();
      expect(semver.lt('1.0.0-beta', '1.0.0-alpha.beta')).withContext('1.0.0-beta < 1.0.0-alpha.beta').toBeFalse();

      expect(semver.lt('1.0.0-beta', '1.0.0-beta.2')).withContext('1.0.0-beta < 1.0.0-beta.2').toBeTrue();
      expect(semver.lt('1.0.0-beta.2', '1.0.0-beta')).withContext('1.0.0-beta.2 < 1.0.0-beta').toBeFalse();

      expect(semver.lt('1.0.0-beta.2', '1.0.0-beta.11')).withContext('1.0.0-beta.2 < 1.0.0-beta.11').toBeTrue();
      expect(semver.lt('1.0.0-beta.11', '1.0.0-beta.2')).withContext('1.0.0-beta.11 < 1.0.0-beta.2').toBeFalse();

      expect(semver.lt('1.0.0-beta.11', '1.0.0-rc.1')).withContext('1.0.0-beta.11 < 1.0.0-rc.1').toBeTrue();
      expect(semver.lt('1.0.0-rc.1', '1.0.0-beta.11')).withContext('1.0.0-rc.1 < 1.0.0-beta.11').toBeFalse();

      expect(semver.lt('1.0.0-rc.1', '1.0.0-rc.2')).withContext('1.0.0-rc.1 < 1.0.0-rc.2').toBeTrue();
      expect(semver.lt('1.0.0-rc.2', '1.0.0-rc.1')).withContext('1.0.0-rc.2 < 1.0.0-rc.1').toBeFalse();

      expect(semver.lt('1.0.0-rc.1', '1.0.0')).withContext('1.0.0-rc.1 < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', '1.0.0-rc.1')).withContext('1.0.0 < 1.0.0-rc.1').toBeFalse();
    });

    it('should compare `null` lower than a normal version', () => {
      expect(semver.lt(null, '0.0.0')).withContext('null < 0.0.0').toBeTrue();
      expect(semver.lt('0.0.0', null)).withContext('0.0.0 < null').toBeFalse();

      expect(semver.lt(null, '0.0.0-beta.1')).withContext('null < 0.0.0-beta.1').toBeTrue();
      expect(semver.lt('0.0.0-beta.1', null)).withContext('0.0.0-beta.1 < null').toBeFalse();

      expect(semver.lt(null, '1.0.0')).withContext('null < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', null)).withContext('1.0.0 < null').toBeFalse();

      expect(semver.lt(null, '1.0.0-beta.1')).withContext('null < 1.0.0-beta.1').toBeTrue();
      expect(semver.lt('1.0.0-beta.1', null)).withContext('1.0.0-beta.1 < null').toBeFalse();
    });

    it('should compare `undefined` lower than a normal version', () => {
      expect(semver.lt(undefined, '0.0.0')).withContext('undefined < 0.0.0').toBeTrue();
      expect(semver.lt('0.0.0', undefined)).withContext('0.0.0 < undefined').toBeFalse();

      expect(semver.lt(undefined, '0.0.0-beta.1')).withContext('undefined < 0.0.0-beta.1').toBeTrue();
      expect(semver.lt('0.0.0-beta.1', undefined)).withContext('0.0.0-beta.1 < undefined').toBeFalse();

      expect(semver.lt(undefined, '1.0.0')).withContext('undefined < 1.0.0').toBeTrue();
      expect(semver.lt('1.0.0', undefined)).withContext('1.0.0 < undefined').toBeFalse();

      expect(semver.lt(undefined, '1.0.0-beta.1')).withContext('undefined < 1.0.0-beta.1').toBeTrue();
      expect(semver.lt('1.0.0-beta.1', undefined)).withContext('1.0.0-beta.1 < undefined').toBeFalse();
    });

    it('should compare `undefined` and `null` identically', () => {
      expect(semver.lt(undefined, undefined)).withContext('undefined < undefined').toBeFalse();
      expect(semver.lt(undefined, null)).withContext('undefined < null').toBeFalse();
      expect(semver.lt(null, undefined)).withContext('null < undefined').toBeFalse();
      expect(semver.lt(null, null)).withContext('null < null').toBeFalse();
    });
  });
});
