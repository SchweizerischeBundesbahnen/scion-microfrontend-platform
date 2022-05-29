/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {RouterOutlets} from './router-outlet.element';
import {OutletRouter} from './outlet-router';
import {NavigationOptions} from './metadata';
import {expectPromise} from '../../testing/spec.util.spec';
import {UUID} from '@scion/toolkit/uuid';
import {mapToBody} from '../../messaging.model';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageClient} from '../messaging/message-client';
import {firstValueFrom} from 'rxjs';

describe('OutletRouter', () => {

  describe('Named parameter substitution', () => {

    beforeAll(async () => await MicrofrontendPlatform.startHost({applications: []}));
    afterAll(async () => await MicrofrontendPlatform.destroy());

    describe('absolute URL (hash-based routing)', () => testSubstitution('http://localhost:4200/#/', {expectedBasePath: 'http://localhost:4200/#/'}));
    describe('absolute URL (push-state routing)', () => testSubstitution('http://localhost:4200/', {expectedBasePath: 'http://localhost:4200/'}));

    describe('relative URL (hash-based routing)', () => testSubstitution('/', {expectedBasePath: 'http://localhost:4200/#/', relativeTo: 'http://localhost:4200/#/a/b/c'}));
    describe('relative URL (push-based routing)', () => testSubstitution('/', {expectedBasePath: 'http://localhost:4200/', relativeTo: 'http://localhost:4200/a/b/c'}));

    function testSubstitution(basePath: string, options: {relativeTo?: string; expectedBasePath: string}): void {
      it('should substitute a named path param', async () => {
        const url = navigate(`${basePath}order/:id`, {
          params: new Map().set('id', 123),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123`);
      });

      it('should substitute multiple named path params (1)', async () => {
        const url = navigate(`${basePath}order/:orderId/product/:productId`, {
          params: new Map().set('orderId', 123).set('productId', 456),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123/product/456`);
      });

      it('should substitute multiple named path params (2)', async () => {
        const url = navigate(`${basePath}order/:orderId/product/:productId/vendor`, {
          params: new Map().set('orderId', 123).set('productId', 456),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123/product/456/vendor`);
      });

      it('should substitute a named query param', async () => {
        const url = navigate(`${basePath}order/:orderId?product=:productId`, {
          params: new Map().set('orderId', 123).set('productId', 456),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123?product=456`);
      });

      it('should substitute multiple named query params', async () => {
        const url = navigate(`${basePath}order/:orderId?product=:productId&stock=:stock`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('stock', 5),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123?product=456&stock=5`);
      });

      it('should substitute multiple named query params (2)', async () => {
        const url = navigate(`${basePath}order/:orderId?product=:productId&stock=:stock&vendor=true`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('stock', 5),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123?product=456&stock=5&vendor=true`);
      });

      it('should substitute a named matrix param', async () => {
        const url = navigate(`${basePath}order/:orderId;product=:productId`, {
          params: new Map().set('orderId', 123).set('productId', 456),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123;product=456`);
      });

      it('should substitute multiple named matrix params', async () => {
        const url = navigate(`${basePath}order/:orderId;product=:productId;stock=:stock`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('stock', 5),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123;product=456;stock=5`);
      });

      it('should substitute multiple named matrix params (2)', async () => {
        const url = navigate(`${basePath}order/:orderId;product=:productId;stock=:stock;vendor=true`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('stock', 5),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123;product=456;stock=5;vendor=true`);
      });

      it('should substitute a named fragment param (1)', async () => {
        const url = navigate(`${basePath}order/:orderId#:fragment`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('fragment', 'abc'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123#abc`);
      });

      it('should substitute a named fragment param (2)', async () => {
        const url = navigate(`${basePath}order/:orderId#fragment:fragment`, {
          params: new Map().set('orderId', 123).set('productId', 456).set('fragment', 'abc'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order/123#fragmentabc`);
      });

      it('should substitute named path params, named query params, named matrix params and named fragment params', async () => {
        const url = navigate(`${basePath}a/:param1/b/:param2;mp1=:param3;mp2=:param4;mp3=:param1;m4=static?qp1=:param5&qp2=:param6&qp3=static#frag_:param7`, {
          params: new Map()
            .set('param1', 'PARAM1')
            .set('param2', 'PARAM2')
            .set('param3', 'PARAM3')
            .set('param4', 'PARAM4')
            .set('param5', 'PARAM5')
            .set('param6', 'PARAM6')
            .set('param7', 'PARAM7'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/PARAM1/b/PARAM2;mp1=PARAM3;mp2=PARAM4;mp3=PARAM1;m4=static?qp1=PARAM5&qp2=PARAM6&qp3=static#frag_PARAM7`);
      });

      it('should substitute falsy params', async () => {
        const url = navigate(`${basePath}a?0=:0&false=:false&null=:null&undefined=:undefined`, {
          params: new Map()
            .set('0', 0)
            .set('false', false)
            .set('null', null)
            .set('undefined', undefined),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a?0=0&false=false&null=null`);
      });

      it('should format array values as comma-separated list (query param) (1)', async () => {
        const url = navigate(`${basePath}order?array=:array`, {
          params: new Map().set('array', ['a', 'b', 'c']),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?array=a,b,c`);
      });

      it('should format array values as comma-separated list (query param) (2)', async () => {
        const url = navigate(`${basePath}order?array=:array&a=b`, {
          params: new Map().set('array', ['a', 'b', 'c']),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?array=a,b,c&a=b`);
      });

      it('should format array values as comma-separated list (matrix param) (1)', async () => {
        const url = navigate(`${basePath}order;array=:array`, {
          params: new Map().set('array', ['a', 'b', 'c']),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;array=a,b,c`);
      });

      it('should format array values as comma-separated list (matrix param) (2)', async () => {
        const url = navigate(`${basePath}order;array=:array;a=b`, {
          params: new Map().set('array', ['a', 'b', 'c']),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;array=a,b,c;a=b`);
      });

      it('should not remove missing path params (1)', async () => {
        const url = navigate(`${basePath}:a/b/c`, {
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}:a/b/c`);
      });

      it('should not remove missing path params (2)', async () => {
        const url = navigate(`${basePath}a/:b/c`, {
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b/c`);
      });

      it('should not remove missing path params (3)', async () => {
        const url = navigate(`${basePath}a/b/:c`, {
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/b/:c`);
      });

      it('should not remove missing path params (4)', async () => {
        const url = navigate(`${basePath}a/b/:c?a=b`, {
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/b/:c?a=b`);
      });

      it('should not remove missing path params (5)', async () => {
        const url = navigate(`${basePath}a/b/:c;a=b`, {
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/b/:c;a=b`);
      });

      it('should remove missing query params (1)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=qp2`, {
          params: new Map().set('qp1', 'QP1'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp1=QP1&qp2=qp2`);
      });

      it('should remove missing query params (2a)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=qp2`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp2=qp2`);
      });

      it('should remove missing query params (2b)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=qp2`, {
          params: new Map().set('qp1', undefined),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp2=qp2`);
      });

      it('should remove missing query params (3)', async () => {
        const url = navigate(`${basePath}order?qp1=qp1&qp2=:qp2`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp1=qp1`);
      });

      it('should remove missing query params (4)', async () => {
        const url = navigate(`${basePath}order?qp1=qp1&qp2=:qp2&qp3=qp3`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp1=qp1&qp3=qp3`);
      });

      it('should remove missing query params (5)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=:qp2&qp3=:qp3`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order`);
      });

      it('should remove missing query params (6)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=:qp2&qp3=:qp3`, {
          params: new Map().set('qp1', 'QP1').set('qp2', 'QP2'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp1=QP1&qp2=QP2`);
      });

      it('should remove missing query params (7)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=:qp2#fragment`, {
          params: new Map().set('qp1', 'QP1'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp1=QP1#fragment`);
      });

      it('should remove missing query params (8)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=:qp2#fragment`, {
          params: new Map().set('qp2', 'QP2'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp2=QP2#fragment`);
      });

      it('should remove missing query params (9)', async () => {
        const url = navigate(`${basePath}order?qp1=:qp1&qp2=:qp2#fragment`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order#fragment`);
      });

      it('should remove missing matrix params (1)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=mp2`, {
          params: new Map().set('mp1', 'MP1'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp1=MP1;mp2=mp2`);
      });

      it('should remove missing matrix params (2a)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=mp2`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp2=mp2`);
      });

      it('should remove missing matrix params (2b)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=mp2`, {
          params: new Map().set('mp1', undefined),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp2=mp2`);
      });

      it('should remove missing matrix params (3)', async () => {
        const url = navigate(`${basePath}order;mp1=mp1;mp2=:mp2`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp1=mp1`);
      });

      it('should remove missing matrix params (4)', async () => {
        const url = navigate(`${basePath}order;mp1=mp1;mp2=:mp2;mp3=mp3`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp1=mp1;mp3=mp3`);
      });

      it('should remove missing matrix params (5)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2;mp3=:mp3`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order`);
      });

      it('should remove missing matrix params (6)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2;mp3=:mp3`, {
          params: new Map().set('mp1', 'MP1').set('mp2', 'MP2'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp1=MP1;mp2=MP2`);
      });

      it('should remove missing matrix params (7)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2#fragment`, {
          params: new Map().set('mp1', 'MP1'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp1=MP1#fragment`);
      });

      it('should remove missing matrix params (8)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2#fragment`, {
          params: new Map().set('mp2', 'MP2'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order;mp2=MP2#fragment`);
      });

      it('should remove missing matrix params (9)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2#fragment`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order#fragment`);
      });

      it('should remove missing matrix params (10)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2?a=b`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?a=b`);
      });

      it('should remove missing matrix params (11)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2#fragment`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order#fragment`);
      });

      it('should remove missing matrix params (12)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2?qp1=:qp1&qp2=:qp2#fragment`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order#fragment`);
      });

      it('should remove missing matrix params (13)', async () => {
        const url = navigate(`${basePath}order;mp1=:mp1;mp2=:mp2?qp1=:qp1&qp2=:qp2#fragment`, {
          params: new Map().set('qp2', 'QP2'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}order?qp2=QP2#fragment`);
      });

      it('should remove missing matrix params (14)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1;mp2=mp2/c`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b;mp2=mp2/c`);
      });

      it('should remove missing matrix params (15)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1;mp2=mp2/c`, {
          params: new Map().set('b', 'b'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/b;mp2=mp2/c`);
      });

      it('should remove missing matrix params (16)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1;mp2=:mp2/c`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b/c`);
      });

      it('should remove missing matrix params (17)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1/c`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b/c`);
      });

      it('should remove missing matrix params (18)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1`, {
          params: new Map(),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b`);
      });

      it('should remove missing matrix params (19)', async () => {
        const url = navigate(`${basePath}a/:b;mp1=:mp1`, {
          params: new Map().set('mp1', 'MP1'),
          relativeTo: options.relativeTo,
        });
        await expectPromise(url).toResolve(`${options.expectedBasePath}a/:b;mp1=MP1`);
      });
    }

    async function navigate(url: string, navigationOptions: NavigationOptions): Promise<string> {
      const outlet = UUID.randomUUID();
      // Navigate to the given URL
      await Beans.get(OutletRouter).navigate(url, {...navigationOptions, outlet});
      // Lookup the navigated URL
      return firstValueFrom(Beans.get(MessageClient).observe$<string>(RouterOutlets.urlTopic(outlet)).pipe(mapToBody<string>()));
    }
  });
});
