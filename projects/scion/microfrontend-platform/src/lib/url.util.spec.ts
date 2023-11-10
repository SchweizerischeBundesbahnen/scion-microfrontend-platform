/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Urls} from './url.util';

describe('Urls', () => {

  describe('Urls.isAbsoluteUrl', () => {

    it('should evaluate to `true` if given an absolute URL (http)', () => {
      expect(Urls.isAbsoluteUrl('http://localhost:4200')).toBeTrue();
      expect(Urls.isAbsoluteUrl('http://localhost:4200/#/')).toBeTrue();
      expect(Urls.isAbsoluteUrl('http://localhost:4200/a/b/c')).toBeTrue();
      expect(Urls.isAbsoluteUrl('http://localhost:4200/#/a/b/c')).toBeTrue();
    });

    it('should evaluate to `true` if given an absolute URL (https)', () => {
      expect(Urls.isAbsoluteUrl('https://localhost:4200')).toBeTrue();
      expect(Urls.isAbsoluteUrl('https://localhost:4200/#/')).toBeTrue();
      expect(Urls.isAbsoluteUrl('https://localhost:4200/a/b/c')).toBeTrue();
      expect(Urls.isAbsoluteUrl('https://localhost:4200/#/a/b/c')).toBeTrue();
    });

    it('should evaluate to `false` if given a relative URL', () => {
      expect(Urls.isAbsoluteUrl('../a/b/c')).toBeFalse();
      expect(Urls.isAbsoluteUrl('./a/b/c')).toBeFalse();
      expect(Urls.isAbsoluteUrl('/a/b/c')).toBeFalse();
      expect(Urls.isAbsoluteUrl('a/b/c')).toBeFalse();
    });

    it('should evaluate to `true` if given the \'about:blank\' URL', () => {
      expect(Urls.isAbsoluteUrl('about:blank')).toBeTrue();
    });

    it('should evaluate to `true` if given a blob URL', () => {
      expect(Urls.isAbsoluteUrl('blob:https://localhost:4200/bbcc7119-13e2-4f99-95fc-c1872f1e322c')).toBeTrue();
    });
  });

  describe('Urls.ensureTrailingSlash', () => {

    it('should append a trailing slash if not present', () => {
      expect(Urls.ensureTrailingSlash('http://localhost:4200')).toEqual('http://localhost:4200/');
    });

    it('should do nothing if a trailing slash is already present', () => {
      expect(Urls.ensureTrailingSlash('http://localhost:4200/')).toEqual('http://localhost:4200/');
    });
  });

  describe('Urls.newUrl', () => {

    it('should behave like `new URL(url)`', () => {
      expect(Urls.newUrl('http://localhost:4200').toString()).toEqual(new URL('http://localhost:4200').toString());
      expect(Urls.newUrl('http://localhost:4200/').toString()).toEqual(new URL('http://localhost:4200/').toString());
      expect(Urls.newUrl('http://localhost:4200/a/b').toString()).toEqual(new URL('http://localhost:4200/a/b').toString());
      expect(Urls.newUrl('http://localhost:4200/a/b/').toString()).toEqual(new URL('http://localhost:4200/a/b/').toString());

      expect(Urls.newUrl('http://localhost:4200/a/b/q1=v1').toString()).toEqual(new URL('http://localhost:4200/a/b/q1=v1').toString());
      expect(Urls.newUrl('http://localhost:4200/a/b/#fragment').toString()).toEqual(new URL('http://localhost:4200/a/b/#fragment').toString());
      expect(Urls.newUrl('http://localhost:4200/a/b/q1=v1&q2=v2#fragment').toString()).toEqual(new URL('http://localhost:4200/a/b/q1=v1&q2=v2#fragment').toString());

      expect(Urls.newUrl('x/y', 'http://localhost:4200/a/b/').toString()).toEqual(new URL('x/y', 'http://localhost:4200/a/b/').toString());
      expect(Urls.newUrl('x/y/q1=v1', 'http://localhost:4200/a/b/').toString()).toEqual(new URL('x/y/q1=v1', 'http://localhost:4200/a/b/').toString());
      expect(Urls.newUrl('x/y/#fragment', 'http://localhost:4200/a/b/').toString()).toEqual(new URL('x/y/#fragment', 'http://localhost:4200/a/b/').toString());
      expect(Urls.newUrl('x/y/q1=v1&q2=v2#fragment', 'http://localhost:4200/a/b/').toString()).toEqual(new URL('x/y/q1=v1&q2=v2#fragment', 'http://localhost:4200/a/b/').toString());

      expect(Urls.newUrl('x/y/../z', 'http://localhost:4200/a/b/').toString()).toEqual(new URL('x/y/../z', 'http://localhost:4200/a/b/').toString());

    });

    it('should correctly construct urls with a base that have no leading slash (unlike when using `new URL(url, base)`)', () => {
      expect(Urls.newUrl('x/y', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/b/x/y');
      expect(new URL('x/y', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/x/y');

      expect(Urls.newUrl('x/y?q1=v1', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/b/x/y?q1=v1');
      expect(new URL('x/y?q1=v1', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/x/y?q1=v1');

      expect(Urls.newUrl('x/y?q1=v1#fragment', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/b/x/y?q1=v1#fragment');
      expect(new URL('x/y?q1=v1#fragment', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/x/y?q1=v1#fragment');

      expect(Urls.newUrl('x/y?q1=v1&q2=v2#fragment', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/b/x/y?q1=v1&q2=v2#fragment');
      expect(new URL('x/y?q1=v1&q2=v2#fragment', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/x/y?q1=v1&q2=v2#fragment');

      expect(Urls.newUrl('x/y/../z', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/b/x/z');
      expect(new URL('x/y/../z', 'http://localhost:4200/a/b').toString()).toEqual('http://localhost:4200/a/x/z');
    });
  });
});
