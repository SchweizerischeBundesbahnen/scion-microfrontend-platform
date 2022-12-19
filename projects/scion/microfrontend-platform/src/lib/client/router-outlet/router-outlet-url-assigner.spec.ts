/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {RouterOutletUrlAssigner} from './router-outlet-url-assigner';
import {ɵWINDOW_TOP} from '../../ɵplatform.model';
import {Beans} from '@scion/toolkit/bean-manager';

describe('RouterOutletUrlAssigner#patchUrl', () => {

  beforeEach(() => {
    Beans.register(ɵWINDOW_TOP, {useValue: window.top});
  });

  afterEach(() => {
    Beans.destroy();
  });

  it('should not patch URL if protocol is "about"', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('about:blank')).toEqual('about:blank');
    expect(testee.patchUrl('about:blank', 'http://localhost:1111/1111')).toEqual('about:blank');
  });

  it('should not patch URL if protocol is "blob"', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('blob:http://localhost:1234/path')).toEqual('blob:http://localhost:1234/path');
    expect(testee.patchUrl('blob:http://localhost:1234/path', 'http://localhost:9999/path')).toEqual('blob:http://localhost:1234/path');
  });

  it('should not patch URL if URL has query params', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('http://localhost:1234/path?qp=')).toEqual('http://localhost:1234/path?qp=');
  });

  it('should not patch URL if origin and path did not change', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('http://localhost:1234/path#123', 'http://localhost:1234/path#456')).toEqual('http://localhost:1234/path#123');
  });

  it('should not patch URL if invalid', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('')).toEqual('');
    expect(testee.patchUrl('localhost')).toEqual('localhost');
  });

  it('should patch URL', async () => {
    const testee = new RouterOutletUrlAssigner();

    expect(testee.patchUrl('http://localhost:1234/path')).toEqual('http://localhost:1234/path?_=');
    expect(testee.patchUrl('http://localhost:1234/path#path')).toEqual('http://localhost:1234/path?_=#path');
    expect(testee.patchUrl('http://localhost:1234/path#path?qp=')).toEqual('http://localhost:1234/path?_=#path?qp=');
    expect(testee.patchUrl('http://localhost:1234/path#path;a=b;c=d?qp=')).toEqual('http://localhost:1234/path?_=#path;a=b;c=d?qp=');
    expect(testee.patchUrl('http://localhost:1234/path#path;a=b;c=d')).toEqual('http://localhost:1234/path?_=#path;a=b;c=d');
    expect(testee.patchUrl('http://localhost:1234/path#?qp=')).toEqual('http://localhost:1234/path?_=#?qp=');
  });
});
