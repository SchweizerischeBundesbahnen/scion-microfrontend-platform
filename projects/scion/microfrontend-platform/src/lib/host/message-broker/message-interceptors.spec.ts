/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Beans} from '@scion/toolkit/bean-manager';
import {MicrofrontendPlatform} from '../../microfrontend-platform';
import {Handler, MessageInterceptor} from './message-interception';
import {TopicMessage} from '../../messaging.model';
import {MessageClient} from '../../client/messaging/message-client';
import {PlatformState} from '../../platform-state';
import {MicrofrontendPlatformConfig} from '../microfrontend-platform-config';

describe('Message Interceptors', () => {

  beforeEach(async () => MicrofrontendPlatform.destroy());

  afterEach(async () => MicrofrontendPlatform.destroy());

  it('should invoke interceptors in the order as registered', async () => {
    const invocations = new Array<string>;

    class Interceptor1 implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('interceptor-1');
        }
        return next.handle(message);
      }
    }

    class Interceptor2 implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('interceptor-2');
        }
        return next.handle(message);
      }
    }

    class Interceptor3 implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('interceptor-3');
        }
        return next.handle(message);
      }
    }

    Beans.register(MessageInterceptor, {useClass: Interceptor1, multi: true});
    Beans.register(MessageInterceptor, {useClass: Interceptor2, multi: true});
    Beans.register(MessageInterceptor, {useClass: Interceptor3, multi: true});
    await MicrofrontendPlatform.startHost({applications: []});

    await Beans.get(MessageClient).publish('testee');
    expect(invocations).toEqual(['interceptor-1', 'interceptor-2', 'interceptor-3']);
  });

  it('should, by default, install app-specific interceptor before platform interceptors', async () => {
    const invocations = new Array<string>;

    const appInterceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('app-interceptor');
        }
        return next.handle(message);
      }
    };

    const platformInterceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('platform-interceptor');
        }
        return next.handle(message);
      }
    };

    // Register app-specific interceptor before starting the platform.
    Beans.register(MessageInterceptor, {useValue: appInterceptor, multi: true});

    // Start the platform.
    await startHost({applications: []}, () => {
      // Register platform-internal interceptor.
      Beans.register(MessageInterceptor, {useValue: platformInterceptor, multi: true});
    });

    // Expect app-specific interceptor to be registered before platform interceptor.
    await Beans.get(MessageClient).publish('testee');
    expect(invocations).toEqual(['app-interceptor', 'platform-interceptor']);
  });

  it('should support installing app-specific interceptor after platform interceptors', async () => {
    const invocations = new Array<string>;

    const appInterceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('app-interceptor');
        }
        return next.handle(message);
      }
    };

    const platformInterceptor = new class implements MessageInterceptor {
      public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
        if (message.topic === 'testee') {
          invocations.push('platform-interceptor');
        }
        return next.handle(message);
      }
    };

    // Register app-specific interceptor when starting the platform.
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      Beans.register(MessageInterceptor, {useValue: appInterceptor, multi: true});
    });

    // Start the platform.
    await startHost({applications: []}, () => {
      // Register platform-internal interceptor.
      Beans.register(MessageInterceptor, {useValue: platformInterceptor, multi: true});
    });

    // Expect app-specific interceptor to be registered after platform interceptor.
    await Beans.get(MessageClient).publish('testee');
    expect(invocations).toEqual(['platform-interceptor', 'app-interceptor']);
  });

  /**
   * Invokes {@link MicrofrontendPlatform#startHost}, additionally invoking the specified function when starting the platform.
   */
  async function startHost(config: MicrofrontendPlatformConfig, startupFn: () => void): Promise<void> {
    const originalStartPlatformFn = MicrofrontendPlatform.startPlatform;
    try {
      MicrofrontendPlatform.startPlatform = async (originalStartupFn: () => void) => {
        return originalStartPlatformFn(() => {
          originalStartupFn();
          startupFn();
        });
      };
      await MicrofrontendPlatform.startHost(config);
    }
    finally {
      MicrofrontendPlatform.startPlatform = originalStartPlatformFn;
    }
  }
});
