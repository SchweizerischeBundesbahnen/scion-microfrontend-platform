<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| [SCION Microfrontend Platform][menu-home] | [Projects Overview][menu-projects-overview] | Changelog | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## Changelog

# [1.4.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.3.1...1.4.0) (2025-06-06)


### Features

* **platform:** add support for `@scion/toolkit` version `2.0.0` ([f67cd6b](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f67cd6b8e58942223bafe5bdfb5376636ed94f2c))


### BREAKING CHANGES

* **platform:** SCION Microfrontend Platform now requires `@scion/toolkit` version `1.6.0` or higher.
  For more information, refer to the changelog of `@scion/toolkit`: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/CHANGELOG_TOOLKIT.md.


## [1.3.1](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.3.0...1.3.1) (2024-10-29)


### Bug Fixes

* **platform/router-outlet:** remove inline styles for CSP compliance ([40e4fbd](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/40e4fbdfe2d9fa626ba1edcfdd3d6e0655bba912)), closes [#287](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/287)


### DevTools

* **devtools:** move DevTools to `*.scion.vercel.app` subdomain ([3897efe](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/3897efef940952e0098244d1397a872d302e7c2a))


### BREAKING CHANGES

* **devtools:** The URL of the SCION Microfrontend Platform DevTools has changed.

  The URL of previous releases has not changed. The current version (`1.3.1`) is available at the previous and new URL. New releases will be available only at the new URL.
  
  To migrate, load the DevTools from https://microfrontend-platform-devtools.scion.vercel.app (latest) or http://microfrontend-platform-devtools-vx-y-z.scion.vercel.app (versioned). Previously, DevTools were available at https://scion-microfrontend-platform-devtools.vercel.app and https://scion-microfrontend-platform-devtools-vx-y-x.vercel.app.


# [1.3.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.2.2...1.3.0) (2024-06-04)


### Features

* **platform:** provide method to get a specific application ([c917433](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/c917433cc1093c133ee312c1f72ae884a6095ea1))



## [1.2.2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.2.1...1.2.2) (2023-11-10)


### Bug Fixes

* **platform:** support navigating to blob URL ([5bbb1e0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5bbb1e08bb420b38f476bfad08e4ea856c48d0a3))



## [1.2.1](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.2.0...1.2.1) (2023-11-02)


### Bug Fixes

* **platform/client:** show splash if instructed by the navigator, but only if not navigating to the same capability, if any ([a91286d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/a91286d8c2eff27a87831b1bd7183ae4103c3510))



# [1.2.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.1.0...1.2.0) (2023-10-31)


### Bug Fixes

* **platform/client:** change return type of `MicrofrontendPlatformClient#signalReady` to void ([2ebd65d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2ebd65d908ba87e6b7d2723978f81e416d56a9b8))
* **platform/router-outlet:** ensure transparent router-outlet if empty ([0c44137](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0c44137dfec1746fb0ecc2ab660cd5b5a3fa1331)), closes [/github.com/w3c/csswg-drafts/issues/4772#issuecomment-591553929](https://github.com//github.com/w3c/csswg-drafts/issues/4772/issues/issuecomment-591553929)
* **devtools:** display warning if not opened as microfrontend ([6b0facf](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/6b0facfa75ef69d3269a93fc9872062ec5a10256))
* **devtools:** do not set background color to inherit it from the embedding context ([7f36dfa](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/7f36dfa1b6eab89f6e6a2cf7acdcfcfccab8234d))


### Features

* **platform/client:** enable microfrontend to display a splash until loaded ([f44087f](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f44087f49802ba34091f98b70a6572a8a72565dd))
* **devtools:** display splash while loading ([11f0a53](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/11f0a5376f09046b64cdda933b8fe796508ab02c))
* **devtools:** migrate to new theme of @scion/components ([88f4ce5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/88f4ce5e23935fb5b22a9ce6691d5da40fa40448))



# [1.1.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0...1.1.0) (2023-07-21)


### Bug Fixes

* **platform/client:** add missing method overload to `ContextService#lookup` ([29d4e09](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/29d4e0990c762dac5f00155b6dc96f1f4d47d4b4))


### Features

* **platform:** allow associating arbitrary metadata with platform-specific capabilities ([6eca043](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/6eca04304d5011311adc07d0de9a5c9200166748))
* **platform:** provide API to check if application is qualified for capability ([2204eff](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2204eff52821813c2aebd7beb25d8c8790f36fe5))



# [1.0.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.13...1.0.0) (2023-05-15)


### chore

* **platform:** drop deprecated API and backward compatibility ([ccae819](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/ccae819726aeb3401c7dde31ac8d805d2183fdf1)), closes [#196](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/196)


### BREAKING CHANGES

* **platform:** dropping deprecated API and backward compatibility introduced a breaking change for host and client applications.

  To migrate:
  - Update host and clients to version `1.0.0-rc.13` or higher.
  - Deprecated property `ManifestService.lookupApplications$ ` has been removed; use `ManifestService.applications` instead.
  - Deprecated property `Capability.requiredParams` has been removed; declare required parameters via `Capability.params` instead and mark it as required.
  - Deprecated property `Capability.optionalParams` has been removed; declare optional parameters via `Capability.params` instead and mark it as non-required.



# [1.0.0-rc.13](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.12...1.0.0-rc.13) (2023-03-10)


### Performance Improvements

* **platform:** increase broker gateway message throughput ([579c125](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/579c125e8826990cdf3e86b498892992aa8027f7)), closes [#90](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/90)



# [1.0.0-rc.12](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.11...1.0.0-rc.12) (2022-12-21)


### Bug Fixes

* **platform/client:** do not provide `HttpClient` in client as only used in the host ([e47ed8b](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/e47ed8b37ae49f7e24fed3f3563cc2851cf23288))
* **platform/client:** remove startup progress monitor from client ([755422e](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/755422e9841ccd9435d2a30e07fb3cbc40ca01a0))
* **platform/host:** remove `ManifestObject` from public API since internal ([36f0dd8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/36f0dd81aca7f167cfe9903dd2a2362d65b95c1d))


### Performance Improvements

* **platform:** reduce library bundle size in client application ([fff9953](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/fff9953cb4f67e05e3486f9d2819cabd57e3c58e)), closes [#174](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/174)


### BREAKING CHANGES

* **platform:** reducing the bundle size in client applications introduced a breaking change for host and client applications. The communication protocol between host and client has not changed, i.e., host and clients can be updated independently to the new version.

  To enable tree-shaking of the SCION Microfrontend Platform, the platform was split into three separate entry points. This reduced the raw size of the library in a client application by more than 50%, from 120 KB to 40 KB.
  
  **Platform Entry Points:**
  - `MicrofrontendPlatformHost` to configure and start the platform in the host application;
  - `MicrofrontendPlatformClient` to connect to the platform from a microfrontend;
  - `MicrofrontendPlatform` to react to platform lifecycle events and stop the platform;
  
  To migrate the host application:
    - start the platform via `MicrofrontendPlatformHost.start` instead of `MicrofrontendPlatform.startHost`
    - monitor startup progress via `MicrofrontendPlatformHost.startupProgress$ ` instead of `MicrofrontendPlatform.startupProgress$ `
  
  To migrate the client application:
    - connect to the host via `MicrofrontendPlatformClient.connect` method instead of `MicrofrontendPlatform.connectToHost`
    - test if connected to the host via `MicrofrontendPlatformClient.isConnected` method instead of `MicrofrontendPlatform.isConnectedToHost`

* **platform/client:** removing client startup progress introduced a breaking change in the client.
  
  To reduce the size of the client bundle, the API for monitoring the startup progress in the client has been removed. This API is useful in the host, but not in the client, because the client only connects to the host and does not perform any long-running operation. There is no replacement.
 
* **platform/host:** removing `ManifestObject` from public API introduced a breaking change.
  
  The `ManifestObject` interface is the internal representation of capabilities and intensions in the platform host. It was never intended to be public API.
  
  To migrate:
  - In the unlikely event that you use this interface, replace it with the following union type: `Capability | Intention`.



# [1.0.0-rc.11](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.10...1.0.0-rc.11) (2022-12-06)


### Bug Fixes

* **platform/host:** add secondary origin to allowed origins ([61cddc0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/61cddc09b2a1883c751a0ef0f987baadac3887a7)), closes [#197](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/197)
* **platform/host:** validate params of intent before passing it to interceptors ([1f5f5e5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1f5f5e5f83b5ee1b10457b29816f68a7e888aadb))
* **platform/host:** assert topic not to contain empty segments ([f8c47e3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f8c47e34f68a9ec203843056df49f03372247bbf))
* **platform/client:** stop platform in `beforeunload` to avoid posting messages to disposed window ([3969c17](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/3969c17778024124440b6e2527061b2519749384)), closes [#168](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/168)
* **platform:** do not break clients not supporting the ping liveness protocol ([6d4eb78](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/6d4eb7841eea6f90018cada314ed22de1db2c7b0)), closes [#178](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/178)
* **platform:** do not unregister clients after resuming the computer from hibernation ([a210d4b](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/a210d4bb0b448610c2e3818056850e649e0d091d)), closes [#178](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/178)


### Features

* **platform/client:** provide API for microfrontend to monitor focus ([e5dc6c2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/e5dc6c276d7db5b31f4ce9f11a0d5f9434e4b471))
* **platform/host:** support for intercepting messages after platform-internal interceptors ([bbfac42](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/bbfac423b406db0899685718bc29e26049ba49dc))
* **platform:** drop support for wildcard capability qualifiers and optional wildcard intention qualifiers ([9713cf0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/9713cf0a4c018d8d2230e7dc65386be1a4c580b9)), closes [#163](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/163)
* **platform/client:** provide hook to decorate observable emissions ([4e0e9b4](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/4e0e9b4f3060d9af0103ac0d07c69c1a4b78ef4b))


### Performance Improvements

* **platform:** optimize focus tracking and mouse event dispatching ([daff4f0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/daff4f080e64047f6cd34d8b6ed4e3d24b3ccf11)), closes [#172](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/172)


### BREAKING CHANGES

* **platform/host:** Property for configuring a secondary origin has been renamed from `messageOrigin` to `secondaryOrigin`. This breaking change only refers to the host.

  To migrate, configure the additional allowed origin via the `secondaryOrigin` property instead of `messageOrigin`, as following:

  ```ts
  await MicrofrontendPlatform.startHost({
    applications: [
      {symbolicName: 'client', manifestUrl: 'https://app/manifest.json', secondaryOrigin: 'https://secondary'},
    ],
  });
  ```
* **platform/host:** The host now performs liveness probes to detect and remove stale clients, instead of relying on the heartbeats emitted by the clients of previous versions.

  The breaking change only refers to the host. The communication protocol between host and client has NOT changed. You can independently update host and clients to the new version.

  To migrate setting of a custom probe configuration in the host, specify the `liveness` instead of `heartbeatInterval` property, as follows:

  ```ts
  MicrofrontendPlatform.startHost({
    liveness: {interval: 60, timeout: 10},
    // omitted rest of the config
  });
  ```
* **platform:** Optimization of mouse event dispatching introduced a breaking change for Angular applications.
 
  **IMPORTANT: For Angular applications, we strongly recommend replacing zone-specific decorators for `MessageClient` and `IntentClient` with an `ObservableDecorator`. Otherwise, you may experience performance degradation due to frequent change detection cycles.**

  It turned out that Angular zone synchronization with decorators for `MessageClient` and `IntentClient` is not sufficient and that observables should emit in the same Angular zone in which the subscription was performed. Using the new `ObservableDecorator` API, Angular zone synchronization can now be performed in a single place for all observables exposed by the SCION Microfrontend Platform.

  To migrate:
  - Remove decorators for `MessageClient` and `IntentClient` including their registration in the bean manager (e.g., `NgZoneMessageClientDecorator` and `NgZoneIntentClientDecorator`).
  - Provide a `NgZoneObservableDecorator` and register it in the bean manager before starting the platform. Note to register it as a bean, not as a decorator.

  For a complete example and detailed instructions, see https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:angular-integration-guide:synchronizing-rxjs-observables-with-angular-zone.

  #### Example of a decorator for synchronizing the Angular zone
  ```ts
  /**
  * Mirrors the source, but ensures subscription and emission {@link NgZone} to be identical.
  */
  export class NgZoneObservableDecorator implements ObservableDecorator {
  
    constructor(private zone: NgZone) {
    }
  
    public decorate$<T>(source$: Observable<T>): Observable<T> {
      return new Observable<T>(observer => {
        const insideAngular = NgZone.isInAngularZone();
        const subscription = source$
          .pipe(
            subscribeInside(fn => this.zone.runOutsideAngular(fn)),
            observeInside(fn => insideAngular ? this.zone.run(fn) : this.zone.runOutsideAngular(fn)),
          )
          .subscribe(observer);
        return () => subscription.unsubscribe();
      });
    }
  }
  ```

  #### Registration of the decorator in the bean manager
  ```ts
  const zone: NgZone = ...;
  
  // Register decorator
  Beans.register(ObservableDecorator, {useValue: new NgZoneObservableDecorator(zone)});
  // Connect to the host from a micro app
  zone.runOutsideAngular(() => MicrofrontendPlatform.connectToHost(...));
  // Start platform host in host app
  zone.runOutsideAngular(() => MicrofrontendPlatform.startHost(...));
  ```
* **platform:** dropping support for wildcard capability qualifiers and optional wildcard intention qualifiers introduced a breaking change in the Intention API.

  To migrate:
  - Replace asterisk (`*`) wildcard capability qualifier entries with required params.
  - Replace optional (`?`) wildcard capability qualifier entries with optional params.
  - If using `QualifierMatcher` to match qualifiers, construct it without flags. The matcher now always evaluates asterisk wildcards in the pattern passed in the constructor.

  ### The following snippets illustrate how a migration could look like:

  #### Before migration

  **Capability in Manifest of App 1**
  ```json
  {
    "name": "App 1",
    "capabilities": [
      {
        "type": "microfrontend",
        "qualifier": {
          "entity": "person",
          "id": "*",
          "readonly": "?"
        },
        "private": false,
        "properties": {
          "path": "person/:id?readonly=:readonly"
        }
      }
    ]
  }
  ```

  **Intention in Manifest of App 2**
  ```json
  {
    "name": "App 2",
    "intentions": [
      {
        "type": "microfrontend",
        "qualifier": {
          "entity": "person",
          "id": "*",
          "readonly": "?"
        }
      }
    ]
  }
  ````

  **Sending Intent in App 2**
  ```ts
  const intent: Intent = {
    type: 'microfrontend',
    qualifier: {
      entity: 'person',
      id: '123',
      readonly: true
    }
  };
  Beans.get(IntentClient).publish(intent);
  ```

  #### After migration

  **Capability in Manifest of App 1**
  ```json
  {
    "name": "App 1",
    "capabilities": [
      {
        "type": "microfrontend",
        "qualifier": {
          "entity": "person"
        },
        "params": [
          {
            "name": "id",
            "required": true
          },
          {
            "name": "readonly",
            "required": false
          }
        ],
        "private": false,
        "properties": {
          "path": "person/:id?readonly=:readonly"
        }
      }
    ]
  }
  ```

  **Intention in Manifest of App 2**
  ```json
  {
    "name": "App 2",
    "intentions": [
      {
        "type": "microfrontend",
        "qualifier": {
          "entity": "person"
        }
      }
    ]
  }
  ````

  **Sending Intent in App 2**
  ```ts
  const intent: Intent = {
    type: 'microfrontend',
    qualifier: {
      entity: 'person'
    },
    params: new Map().set('id', '123').set('readonly', true)
  };
  Beans.get(IntentClient).publish(intent);
  ```



# [1.0.0-rc.10](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.9...1.0.0-rc.10) (2022-11-08)


### Bug Fixes

* **platform/messaging:** receive latest retained message per topic in wildcard subscription ([b578317](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b5783173f14f77b06737e418de53b3341d9ff450))
* **devtools:** activate selected tab in application details even after quick navigation ([b9e1cff](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b9e1cffff7dac3c97b3dfd54d4dfac6885ec4938))


### Features

* **platform:** use unique identifier for capability and intention ID ([e2957ba](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/e2957baaa2ed22a73eb79b4cf2a53ce1891fff41)), closes [#162](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/162) [#171](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/171)
* **platform/messaging:** support sending retained intents ([08afb72](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/08afb72037bb6f73cd52edf2068352c7def78142)), closes [#142](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/142)
* **platform/messaging:** support sending retained requests to a topic ([1098f8f](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1098f8f0e797e9d045983075fc63fed5cce94c41))
* **devtools:** allow filtering capabilities by id ([fff5dd7](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/fff5dd7f86e82af3b6c99fe4fa5a17034e1e5a2f))
* **devtools:** remove logical operator for capability filters where not useful ([3909ba3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/3909ba3408d4e62e3d92d35cd4d27010ed41fb8c))
* **devtools:** render logical operators (OR/AND) in capability filters as toggle button ([3130e88](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/3130e88529e8cf186e98bbd73659440b67b9593d))


### BREAKING CHANGES

* **platform/messaging:** The `IntentClient` now uses the same `options` object as the `MessageClient` to control how to send a message or request. The content of the `options` object has not changed, only its name, i.e., migration is only required if assigning it to a typed variable or decorating the `IntentClient`.

  Note that the communication protocol between host and client has NOT changed, i.e., host and clients can be migrated independently.

  To migrate:
  - options for sending an intent was changed from `IntentOptions` to `PublishOptions` (`IntentClient#publish`)
  - options for requesting data was changed from `IntentOptions` to `RequestOptions` (`IntentClient#request`)

* **platform:** Using unique identifier for capability and intention ID introduced a breaking change.

  Previously, the IDs used for capabilities and intentions were stable but not unique, which caused problems when deregistering capabilities and intentions. If your application requires stable capability identifiers, you can register a capability interceptor, as follows:

  ```ts
  import {Capability, CapabilityInterceptor} from '@scion/microfrontend-platform';
  import {Crypto} from '@scion/toolkit/crypto';
  import {Beans} from '@scion/toolkit/bean-manager';
  
  Beans.register(CapabilityInterceptor, {
    useValue: new class implements CapabilityInterceptor {
      public async intercept(capability: Capability): Promise<Capability> {
        const stableId = await Crypto.digest(JSON.stringify({
          type: capability.type,
          qualifier: capability.qualifier,
          application: capability.metadata!.appSymbolicName,
        }));
        return {
          ...capability,
          metadata: {...capability.metadata!, id: stableId},
        };
      }
    },
    multi: true
  })
  ```
  
  Note that the communication protocol between host and client has NOT changed. You can independently upgrade host and clients to the new version.



# [1.0.0-rc.9](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.8...1.0.0-rc.9) (2022-11-02)


### Features

* **platform/devtools:** display platform version per application in DevTools ([1c8d69c](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1c8d69c0b3c2e84a61554ffdefa661496e7fef86))
* **platform:** allow intercepting capabilities before their registration ([ba423af](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/ba423afd604b2f6039280889f9942f191b7142c2))


### Performance Improvements

* **platform/messaging:** index topic subscriptions for faster resolution ([e8c2178](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/e8c2178698058a7d1d10ddef43167f0faa3a1c54))
* **platform/messaging:** subscribe for replies when posting the request in request-response communication ([cb23da3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/cb23da36e35e14fd7e46d19a1dace0b926c3e5a1))
* **platform/messaging:** track the number of subscriptions based on subscription change events ([8b3c877](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/8b3c8771bfa33528fd5b29b38eaa3f6c9c796a9c))



# [1.0.0-rc.8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.7...1.0.0-rc.8) (2022-10-27)


### Features

* **platform/router-outlet:** set name of the iframe to the name of the outlet ([1aa566d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1aa566d65f81c2358f235c9b1766f6738f198ba5))


### Performance Improvements

* **platform/messaging:** transport intents to subscribed clients only ([4247e9d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/4247e9dd0a31d68a1bdb72b982710ee2d2bd9505)), closes [#124](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/124)



# [1.0.0-rc.7](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.6...1.0.0-rc.7) (2022-10-07)


### Bug Fixes

* **platform/router-outlet:** size outlet to the reported initial size of embedded content ([49f036d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/49f036d30f992720a9d2beb5045492d33076bcb1))
* **platform/router:** do not patch URL if protocol is "blob" ([064f1f3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/064f1f35210058b113d911b5efb1ccbe8851d7ee))
* **platform:** mirror Observable if replying with an Observable in message or intent callback ([d0b8e27](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/d0b8e277bd2592fa8bbd5033c080fa4abe897611)), closes [#164](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/164)
* **platform:** report message rejection of asynchronous interceptors back to the sender ([1517366](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1517366d254c858ccc4208046b6ed9082bebac09)), closes [#147](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/147)


### Performance Improvements

* **platform/client:** resend connect request only if loaded into the topmost window ([ba4e9a2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/ba4e9a250c15f93e12e4752dc0af83ca62f6573a))


### BREAKING CHANGES

* **platform:** Fixing message rejection reporting of interceptors introduced a breaking change in the Interceptor API.
  
  This breaking change only refers to the host. The communication protocol between host and client HAS NOT CHANGED. Host and clients can be updated independently to the new version.
  
  In order to report asynchronous message rejection correctly, the Interceptor API has been changed from synchronous to asynchronous message interception. To migrate, change the return type of your interceptors from `void` to `Promise<void>` and change the implementation accordingly.
  
  #### The following snippets illustrate how a migration could look like:
  
  ##### Before migration
  
  ```typescript
  class MessageLoggerInterceptor implements MessageInterceptor {
    public intercept(message: TopicMessage, next: Handler<TopicMessage>): void {
      console.log(message);
  
      // Passes the message along the interceptor chain.
      next.handle(message);
    }
  }
  ```
  
  ##### After migration
  
  ```typescript
  class MessageLoggerInterceptor implements MessageInterceptor {
    public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
      console.log(message);
  
      // Passes the message along the interceptor chain.
      return next.handle(message);
    }
  }
  ```



# [1.0.0-rc.6](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.5...1.0.0-rc.6) (2022-06-04)


### Bug Fixes

* **platform/config:** use the application's symbolic name as application name if not configured ([2058d99](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2058d9939887e3297af7a5e21fc6eb657d69a8a4))
* **platform/router:** do not discard supposedly identical navigations ([5adba59](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5adba59b55dd2bda0bcd69d6ad00990bd2912da3))
* **platform/router:** route the primary outlet if in the context of an activator and if not specified a target outlet ([e99ee13](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/e99ee131c2997dcfba4b8b2710786187421c6a26))


### Features

* **platform/devtools:** facilitate integration in a router outlet or workbench view using intent-based navigation ([bcc0718](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/bcc0718cb5cfd434eeb6420ec36bfcbdd90b6875)), closes [#45](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/45)
* **platform/router:** facilitate intent-based navigation ([052dd4c](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/052dd4cf8ead6991090a09017b46f0d27156f545)), closes [#154](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/154)
* **platform/router:** remove matrix and query parameters not passed for substitution ([b424647](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b4246476de36bdf03ad555b6af20048773d120c3)), closes [#155](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/155)



# [1.0.0-rc.5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.4...1.0.0-rc.5) (2022-05-18)


### Dependencies

* **platform:** migrate to the framework-agnostic package `@scion/toolkit` ([2b53137](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2b5313784c67168bbd0a9283f5f9b82c679ad21c))


### BREAKING CHANGES

* **platform:** Migrating to the framework-agnostic package `@scion/toolkit` introduced a breaking change.

  Previously, framework-agnostic and Angular-specific tools were published in the same NPM package `@scion/toolkit`, which often led to confusion and prevented framework-agnostic tools from having a release cycle independent of the Angular project. Therefore, Angular-specific tools have been moved to the NPM package `@scion/components`. Framework-agnostic tools continue to be released under `@scion/toolkit`, but now starting with version `1.0.0` instead of pre-release versions.

  The breaking change only refers to updating `@scion/toolkit` to version `1.0.0`. API and communication protocol have not changed or are backward compatible. Host and clients can be updated independently to the new version.

  To migrate:
  - Install the NPM package `@scion/toolkit` in version `1.0.0` using the following command: `npm install @scion/toolkit@latest --save`. Note that the toolkit was previously released as pre-releases of version `13.0.0` or older.
  - For further instructions on how to migrate Angular-specific tools that have been moved to `@scion/components`, refer to https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/docs/site/changelog-components/changelog.md#migration-of-angular-specific-components-and-directives.



# [1.0.0-rc.4](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.3...1.0.0-rc.4) (2022-05-02)


### Bug Fixes

* **platform:** discard intent parameter if set to `undefined` ([873541d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/873541d80cb6cb260cc10ef9452b8473292092ca)), closes [#146](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/146)
* **platform:** remove `semver` dependency to avoid bundle optimization bailouts ([bf44720](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/bf44720617b41497603b63b068210349342bb5d5)), closes [#141](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/141)



# [1.0.0-rc.3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.2...1.0.0-rc.3) (2022-04-01)


### Bug Fixes

* **devtools:** allow integrating devtools into the browser window ([af142e9](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/af142e9b6665124fa2e7fd17ba6c22479cc978aa))
* **platform:** connect to the host periodically when starting the platform ([788a444](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/788a444b3b34ecba71749ce73c7d4caad3302d3f))


### Features

* **platform:** allow configuring the message origin for an application ([c8a5bf3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/c8a5bf3154ed87aba179887344609299df7e2133))



# [1.0.0-rc.2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-rc.1...1.0.0-rc.2) (2022-03-18)


### Dependencies

* **platform:** migrate @scion/microfrontend-platform to RxJS 7.5 ([c194c5a](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/c194c5ad0f34ad8188d676e34fa6c7e991b900ba)), closes [/github.com/angular/angular/blob/master/CHANGELOG.md#1312-2022-01-12](https://github.com//github.com/angular/angular/blob/master/CHANGELOG.md/issues/1312-2022-01-12) [#108](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/108)


### BREAKING CHANGES

* **platform:** Upgrading @scion/microfrontend-platform to RxJS 7.x introduced a breaking change.

  The breaking change only refers to updating RxJS to version 7.5. API and communication protocol have not changed or are backward compatible. Host and clients can be updated independently to the new version.

  To migrate, upgrade your application to RxJS 7.5; for detailed migration instructions, refer to https://rxjs.dev/6-to-7-change-summary.



# [1.0.0-rc.1](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.20...1.0.0-rc.1) (2022-03-15)


### Bug Fixes

* **platform:** allow publishing messages during platform shutdown ([0cc9e2d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0cc9e2d1617431b934f35686a68358e8e9aecf14)), closes [#83](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/83)
* **platform:** comply with the API of `MessageClient` and `IntentClient` regarding termination of its Observables ([9bbc4a5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/9bbc4a525d770ed66a128f0f7d61258db5ed6be8))
* **platform:** detect and remove stale client registrations ([1b21bad](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/1b21bad34c46bb0bc829e2797c696d7e71f91bf0))


### Features

* **platform:** detect the version of @scion/microfrontend-platform an application has installed ([c891223](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/c891223cebc8133ef7196ca52361562acfbfcfa4))



# [1.0.0-beta.20](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.19...1.0.0-beta.20) (2022-02-01)


### Bug Fixes

* ensure the SciRouterOutlet to be instantiated after initialization of the platform ([f1514bd](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f1514bd285a83f862b94c6b5599a6b35c1325a42))


### Code Refactoring

* **platform:** consolidate API for configuring the platform ([142ce8e](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/142ce8ef446c59ffda32312eea666f3509a155ed)), closes [#39](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/39) [#96](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/96)
* **platform:** remove gateway iframe in client-broker communication ([0a4b4b0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0a4b4b0bead9c6bb9e09d92a45e33d8cde754f0a)), closes [#14](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/14)


### BREAKING CHANGES

* **platform:** Removing the gateway communication iframe introduced a breaking change in the host/client communication protocol.

  You need to upgrade the version of SCION Microfrontend Platform in host and client applications at the same time.
  The breaking change refers only to the communication protocol, the API of the SCION Microfrontend Platform has not changed.
  
  To migrate, upgrade to the newest version of `@scion/microfrontend-platform` in the host and client applications.
* **platform:** Consolidation of the API for configuring the platform host introduced a breaking change. The communication protocol between host and client is not affected by this change.
 
  #### Host App Migration
  - API for loading the platform config via a config loader has been removed; to migrate, load the config before starting the platform;
  - API for passing an app list to `MicrofrontendPlatform.startHost` has been removed; to migrate, register applications via `MicrofrontendPlatformConfig` object, as follows: `MicrofrontendPlatformConfig.applications`;
  - manual registration of the host application has been removed as now done implicitly; to migrate:
    - remove host app from the app list;
    - configure host privileges via `HostConfig` object, as follows:
      - `MicrofrontendPlatformConfig.host.scopeCheckDisabled`
      - `MicrofrontendPlatformConfig.host.intentionCheckDisabled`
      - `MicrofrontendPlatformConfig.host.intentionRegisterApiDisabled`
    - specify message delivery timeout in `MicrofrontendPlatformConfig.host.messageDeliveryTimeout`;
    - provide the host's manifest, if any, via `MicrofrontendPlatformConfig.host.manifest`, either as object literal or as URL;
    - specify the host's symbolic name in `MicrofrontendPlatformConfig.host.symbolicName`; if not specified, defaults to `host`;
  - the Activator API can now be disabled by setting the flag `MicrofrontendPlatformConfig.activatorApiDisabled` instead of `PlatformConfig.platformFlags.activatorApiDisabled`;
  - the interface `ApplicationManifest` has been renamed to `Manifest`;
  - the bean `MicroApplicationConfig` has been removed; you can now obtain the application's symbolic name as following: `Beans.get<string>(APP_IDENTITY)`
 
  #### Client App Migration
  - the micro application must now pass its identity (symbolic name) directly as the first argument, rather than via the options object;
  - the options object passed to `MicrofrontendPlatform.connectToHost` has been renamed from ` MicroApplicationConfig` to `ConnectOptions` and messaging options are now top-level options; to migrate:
    - set the flag `MicrofrontendPlatformConnectOptions.connect` instead of `MicroApplicationConfig.messaging.enabled` to control if to connect to the platform host;
    - specify 'broker discovery timeout' in `MicrofrontendPlatformConnectOptions.brokerDiscoverTimeout` instead of `MicroApplicationConfig.messaging.brokerDiscoverTimeout`;
    - specify 'message delivery timeout' in `MicrofrontendPlatformConnectOptions.messageDeliveryTimeout` instead of `MicroApplicationConfig.messaging.deliveryTimeout`;
  - the bean `MicroApplicationConfig` has been removed; you can now obtain the application's symbolic name as following: `Beans.get<string>(APP_IDENTITY)`

  ### The following snippets illustrate how a migration could look like:
  
  #### Host App: Before migration
  
  ```typescript
  const applications: ApplicationConfig[] = [
    {symbolicName: 'host', manifestUrl: '/manifest.json'}, // optional
    {symbolicName: 'app1', manifestUrl: 'http://app1/manifest.json'},
    {symbolicName: 'app2', manifestUrl: 'http://app2/manifest.json'},
  ];
  await MicrofrontendPlatform.startHost(applications, {symbolicName: 'host'});
  ```
  
  #### Host App: After migration
  
  ```typescript
  await MicrofrontendPlatform.startHost({
    host: {
      symbolicName: 'host',
      manifest: '/manifest.json'
    },
    applications: [
     {symbolicName: 'app1', manifestUrl: 'http://app1/manifest.json'},
     {symbolicName: 'app2', manifestUrl: 'http://app2/manifest.json'}
    ]
  });
  ```
  
  #### Host App: After migration if inlining the host manifest
  
  ```typescript
  await MicrofrontendPlatform.startHost({
    host: {
      symbolicName: 'host',
      manifest: {
        name: 'Host Application',
        capabilities: [
          // capabilities of the host application
        ],
        intentions: [
          // intentions of the host application
        ]
      }
    },
    applications: [
     {symbolicName: 'app1', manifestUrl: 'http://app1/manifest.json'},
     {symbolicName: 'app2', manifestUrl: 'http://app2/manifest.json'}
    ],
  });
  ```

  #### Client App: Before migration

  ```typescript
  await MicrofrontendPlatform.connectToHost({symbolicName: 'shopping-cart-app'});
  ```

  #### Client App: After migration

  ```typescript
  await MicrofrontendPlatform.connectToHost('shopping-cart-app');
  ```


# [1.0.0-beta.19](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.18...1.0.0-beta.19) (2021-11-05)


### Bug Fixes

* **platform:** do not transport intents to other applications if not declaring a respective intention ([24681e3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/24681e37dcd06527b241825db413a99ec5a62716))



# [1.0.0-beta.18](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.17...1.0.0-beta.18) (2021-09-10)


### Bug Fixes

* **platform:** allow interceptors to reply to requests if no consumer is running ([f22c947](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f22c947caa359e8096c988e5d933101078602047))



# [1.0.0-beta.17](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.16...1.0.0-beta.17) (2021-07-12)


### Bug Fixes

* **devtools:** resolve dependent app also if declaring a wildcard intention ([f321c5b](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f321c5b2789a50efe84b6e7a8340a1067beb67c1))


### Features

* **devtools:** activate a dependency's counterpart tab when navigating to the dependent application ([10dda73](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/10dda73bb10038f57fb74890d467fef9e996cebe))
* **devtools:** allow for quick filtering of capabilities ([85abd52](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/85abd527b4bfee78cd3b7f416a492b98c70c7af5))
* **devtools:** use larger initial width for the main display area ([f96e826](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f96e8265732d67cf8d4aefd81bbe094eec34817a))
* **platform:** allow associating metadata with a capability param ([05952bc](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/05952bcb1ccb6b581c1862ebf7d013eafcf20712)), closes [#77](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/77)



# [1.0.0-beta.16](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.15...1.0.0-beta.16) (2021-07-02)


### chore

* update project workspace to Angular 12 ([31c81c8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/31c81c8bb422f3784a90ef355ab6a2bf3097c032)), closes [#76](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/76)



# [1.0.0-beta.15](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.14...1.0.0-beta.15) (2021-05-20)


### Features

* **platform:** allow setting a timeout for loading manifests and activators ([fe26507](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/fe265079d333391df675a7f01591437b910086f2)), closes [#6](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/6)
* **platform:** report platform startup progress ([0e9300d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0e9300db912a6f76d527e671bbb70e87e7806ca4)), closes [#18](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/18)


### chore

* **platform:** compile with TypeScript strict checks enabled ([bc390a8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/bc390a8fa380b63e0af2aa43b24bb9981aaae342)), closes [#55](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/55)


# [1.0.0-beta.14](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.13...1.0.0-beta.14) (2021-04-22)


### Features

* **platform:** pass intent with resolved capability to intent interceptors ([b51959d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b51959dc1dae9715b049b8c8ffbf67929e587ffa)), closes [#72](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/72)



# [1.0.0-beta.13](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.12...1.0.0-beta.13) (2021-04-12)


### Bug Fixes

* **platform:** allow context key names containing forward slashes or starting with a colon ([5637832](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5637832310538ba817a7cf7170de52d55abdeeba)), closes [#49](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/49)
* **platform:** remove ES2015 import cycles ([5dfc7f6](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5dfc7f61054ee8012d5bb2fac71a882d1f8d9a27)), closes [#42](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/42)


### Features

* **platform:** add wildcard support for unregistering capabilities and intentions ([4d22403](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/4d224036ad1e9607492f994082bcf9a9c36ad811)), closes [#61](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/61)


### BREAKING CHANGES

* **platform:** Allowing context key names containing forward slashes
or starting with a colon introduced a breaking change in the host/client
communication protocol.
  
  The messaging protocol between host and client HAS CHANGED for context
value lookup using the `ContextService`.
Therefore, you must update the host and affected clients to the new
version together. The API has not changed; the breaking change only
applies to the `@scion/microfrontend-platform` version.
  
  To migrate:
  - Upgrade host and clients (which use the `ContextService`) to
`@scion/microfrontend-platform@1.0.0-beta.13`.

* **platform:** Adding wildcard support for unregistering capabilities and intentions introduced a breaking change.

  To migrate:
  - upgrade host and client apps to use `@scion/microfrontend-platform@1.0.0-beta.13`
  - When searching for capabilities with a qualifier filter that contains scalar qualifier values, only capabilities with exactly those values are now returned. This is different from previous versions where a qualifier filter like `{entity: 'person', id: '5'}` matched capabilities with exactly that qualifier, as well as capabilities containing a wildcard (`*` or `?`) in the qualifier, such as `{entity: 'person', id: '*'}` or `{entity: 'person', id: '?'}`. To keep the old lookup behavior, do not pass a qualifier filter and filter the capabilities yourself, e.g. by using the `QualifierMatcher`, as follows:
    ```ts
      Beans.get(ManifestService).lookupCapabilities$({type: 'view'})
      .pipe(filterArray(capability => new QualifierMatcher(capability.qualifier, {evalOptional: true, evalAsterisk: true}).matches({entity: 'person', id: '5'})))
    ```

# [1.0.0-beta.12](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.11...1.0.0-beta.12) (2021-02-22)


### Bug Fixes

* **platform:** allow preventing default action of registered keystrokes ([8ae8595](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/8ae859595731897da09eec2d80d709b919b973e1)), closes [#32](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/32)
* **platform:** propagate topic subscription errors in context service ([08bbaf7](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/08bbaf7ce06fa4e725525a04cea03c753cc8307f))


### chore

* migrate Vercel deployments to the updated Vercel URL format ([f31fe5d](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f31fe5d1c4dda63bc82be3938e063a5feaf516be)), closes [#56](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/56)


### Features

* **platform:** allow collecting values on contextual data lookup ([2e87b51](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2e87b51e0a7a819e3526c1a72265d7df3a6b4ea8))


### BREAKING CHANGES

* URLs of applications deployed on Vercel now end with `*.vercel.app` instead of `*.now.sh`

  To migrate:
  - If using the `SCION Microfrontend Platform DevTools`, load them from https://scion-microfrontend-platform-devtools.vercel.app or from the versioned URL https://scion-microfrontend-platform-devtools-v1-0-0-beta-12.vercel.app.
  - The Developer Guide is now available under https://scion-microfrontend-platform-developer-guide.vercel.app
  - The TypeDoc is now available under https://scion-microfrontend-platform-api.vercel.app

  See https://vercel.com/changelog/urls-are-becoming-consistent for more information.



# [1.0.0-beta.11](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.10...1.0.0-beta.11) (2021-02-03)


### Features

* **platform:** add convenience API to reduce code required to respond to requests ([d0eeaf5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/d0eeaf5aef0bc4cfc39f3de2e8443f5a1988e1ea)), closes [#43](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/43)
* **platform:** allow to specify a generic when registering a capability to increase type safety ([4af9433](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/4af943315d81b6aabc7f68e2ee788b86b04a8520)), closes [#60](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/60)
* **platform:** let the message/intent replier control the lifecycle of the requestor’s Observable ([77a4dd9](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/77a4dd9877188fd8d78edc6404118a6e97b02c46))


### BREAKING CHANGES

* **platform:** Adding the convenience API for responding to requests introduced the following breaking change for Angular projects.
    
    > Note: The messaging protocol between the host and client HAS NOT CHANGED. Thus, you can upgrade the host and clients to the new version independently.
    
    To migrate:
    - If an Angular project, add the method `onMessage` to your `NgZone` message client decorator, as following:
       ```typescript
       public onMessage<IN = any, OUT = any>(topic: string, callback: (message: TopicMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
         return messageClient.onMessage(topic, callback);
       }
       ```
       See https://scion-microfrontend-platform-developer-guide-v1-0-0-rc-10.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular for more information.
    
    - If an Angular project, add the method `onIntent` to your `NgZone` intent client decorator, as following:
       ```typescript
       public onIntent<IN = any, OUT = any>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
         return intentClient.onIntent(selector, callback);
       }
       ```
       See https://scion-microfrontend-platform-developer-guide-v1-0-0-rc-10.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular for more information.
* **platform:** Enabling the message/intent replier to control the requestor’s Observable lifecycle introduced a breaking change in the host/client communication protocol.
    
    > Note: The messaging protocol between host and client HAS CHANGED for registering/unregistering capabilities/intentions using the `ManifestService`. Therefore, you must update the host and affected clients to the new version together. The API has not changed; the breaking change only applies to the `@scion/microfrontend-platform` version.
    
    To migrate:
    - Upgrade host and clients (which use the `ManifestService`) to `@scion/microfrontend-platform@1.0.0-beta.11`.
    - Remove the `throwOnErrorStatus` SCION RxJS operator when using `IntentClient#request$ ` or `MessageClient#request$ ` as already installed by the platform.



# [1.0.0-beta.10](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.9...1.0.0-beta.10) (2021-01-25)


### Bug Fixes

* start platform outside angular zone in testing app and devtools ([f017422](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f0174224cb2ce00e9c73f2c460df185ad4282bb7)), closes [#53](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/53)



# [1.0.0-beta.9](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.8...1.0.0-beta.9) (2021-01-18)


### Bug Fixes

* **devtools:** perform scope check when computing dependencies between micro applications ([5e43bc3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5e43bc3a44c8e7b2056e2d10fa18cbd146c0d895))
* **platform:** resolve host startup promise only once applications and properties are available ([f4067c2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/f4067c26755f62ccf8daff1abbcb55f34413f5ae))


### Features

* **platform:** allow monitoring `sci-router-outlet` whether embedded content has gained or lost focus ([14fb178](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/14fb17884cc9da4dca481894f3d64f8785f512cc))
* **platform:** allow passing params in an intent ([b82b343](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b82b34390269992c20ae48d0dc258febbe02c352)), closes [#44](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/44)
* **platform:** open shadow DOM of the router outlet ([cb10c32](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/cb10c32dab7d7e5a4e3d67ba99efb708650020f0))



# [1.0.0-beta.8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.7...1.0.0-beta.8) (2020-12-18)


### Bug Fixes

* **platform:** allow empty path as url for outlet navigation ([8a0a70b](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/8a0a70b7fbcf432c6928bdc1478aba6685eede4f))
* **platform:** ensure trailing slash in application base URLs ([62a7a92](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/62a7a921a80dd6f340abdafea21342bd135238b0))
* **platform:** make platform startup more robust ([0d30b72](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0d30b726c776dcb56afd0a34454453325a4208ea)), closes [#40](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/40) [#41](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/41)


### Features

* **devtools:** add devtools micro application ([19db8bf](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/19db8bf646b3a46667cd82a513f109c3297f5068)), closes [#4](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/4)
* **platform:** provide a static list of installed applications in the manifest service ([b60015f](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b60015f798a6ce8e5ed765f942536a89df922407))


### BREAKING CHANGES

* **platform:** The `HostPlatformState` bean has been removed as no longer necessary, because activator microfrontends are now installed after completing host platform startup, and because the startup Promise waits until connected to the host.

To migrate: Instead of listening for the host platform to enter the 'started' state, wait for the startup Promise to resolve.
Note: You can independently upgrade host and clients to the new version because the platform was not using the platform status at all.



# [1.0.0-beta.7](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.6...1.0.0-beta.7) (2020-11-05)


### Code Refactoring

* **platform:** move bean manager to @scion/toolkit ([aa00b7e](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/aa00b7e07e4a5f976c7e99cc96c95430bec5574d)), closes [#33](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/33)


### BREAKING CHANGES

* **platform:** The bean manager was moved from `@scion/microfrontend-platform` to `@scion/toolkit` NPM module.

> Note: The messaging protocol between host and client HAS NOT CHANGED. You can therefore independently upgrade host and clients to the new version.

To migrate:
-  Update `@scion/toolkit` to version `10.0.0-beta.3`.
- Import following symbols from `@scion/toolkit/bean-manager` instead of from `@scion/microfrontend-platform`: `BeanManager`, `Beans`, `Initializer`, `InitializerFn`, `BeanDecorator`, `PreDestroy`, `BeanInstanceConstructInstructions`, `Type`, `AbstractType`.
- Replace `InstanceConstructInstructions` with `BeanInstanceConstructInstructions`.
- Use static methods of the `MicrofrontendPlatform` class to interact with states of the platform lifecycle (formerly via `PlatformState` bean), e.g., to wait for the platform to enter a specific state. In this change, we changed the bean `PlatformState` to an `enum` to represent platform states (formerly `PlatformStates`).
Migrate as follows:
  - _Beans.get(PlatformState).whenState_ -> _MicrofrontendPlatform.whenState_, e.g., `Beans.get(PlatformState).whenState(PlatformStates.Starting) -> MicrofrontendPlatform.whenState(PlatformStates.Starting)`
  - _Beans.get(PlatformState).state_ -> _MicrofrontendPlatform.state_
  - _Beans.get(PlatformState).state$_ -> _MicrofrontendPlatform.state$_
- Replace occurrences of `PlatformStates` with `PlatformState`.
- Control bean destruction order by setting its `destroyOrder` in the options object when registering the  bean (formerly by setting the destroy phase). Beans with a lower destroy order are destroyed before beans with a higher destroy order. Beans of the same destroy order are destroyed in reverse construction order. By default, the destroy order is 0.
- Registering a bean now returns a handle to unregister the bean (formerly `void`). If registering a bean inside a `void` expression, register it inside a void operator, as follows: `void (Beans.register(Bean))`



# [1.0.0-beta.6](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.5...1.0.0-beta.6) (2020-09-30)


### Bug Fixes

* **platform:** substitute falsy values in named parameters of URL ([96c84db](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/96c84db683a8949176c59caa03d414850a0cea05)), closes [#24](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/24)


### Features

* **platform:** allow registering beans under a symbol ([98bf890](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/98bf8902762c720a36ae6b481558e488e04bad58)), closes [#28](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/28)
* **platform:** separate message and intent communication APIs ([7610eb0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/7610eb00b4750447ad85b00e3acd470cf1950998))


### BREAKING CHANGES

* **platform:** Use `MessageClient` for topic-based messaging, and `IntentClient` for intent-based messaging

Note: The messaging protocol between host and client HAS NOT CHANGED. You can therefore independently upgrade host and clients to the new version.

#### Breaking changes in MessageClient
Moved or renamed the following methods:
- _MessageClient#onMessage$_ -> _MessageClient.observe$_
- _MessageClient#issueIntent_ -> _IntentClient.publish_
- _MessageClient#requestByIntent$_ -> _IntentClient.request$_
- _MessageClient#onIntent$_ -> _IntentClient.observe$_
- _MessageClient#isConnected_ -> _MicrofrontendPlatform.isConnectedToHost_

Renamed options object of the following methods:
- _MessageClient#request$_: _MessageOptions_ -> _RequestOptions_
- _IntentClient#publish_: _MessageOptions_ -> _IntentOptions_
- _IntentClient#request$_: _MessageOptions_ -> _IntentOptions_

#### Breaking change for decorating MessageClient and IntentClient bean
For Angular developers, see [Preparing the MessageClient and IntentClient for use with Angular](https://scion-microfrontend-platform-developer-guide-v1-0-0-rc-10.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular) how to decorate the `MessageClient` and `IntentClient` for making Observables to emit inside the Angular zone.

#### Breaking change for disabling messaging in tests
Messaging can now be deactivated via options object when starting the platform. Previously you had to register a `NullMessageClient` bean.
```MicrofrontendPlatform.connectToHost({messaging: {enabled: false}}```



# [1.0.0-beta.5](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.4...1.0.0-beta.5) (2020-07-17)


### chore

* update project workspace to Angular 10 ([20a3266](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/20a3266823ce1a3f82063e87e18235988a6ed478)), closes [#19](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/19)


### BREAKING CHANGES

* esm5 and fesm5 format is no longer distributed in `@scion/microfrontend-platform`’s NPM package

We no longer include the distributions for `esm5` and `fesm5` in the `@scion/microfrontend-platform`’s NPM package. Only the formats for `esm2015`, `fesm2015`, and UMD are distributed. Consequently, the module field in package.json now points to the `fesm2015` distribution.

To migrate:
- If requiring `esm5` or `fesm5`, you will need to downlevel to ES5 yourself. If using Angular, the Angular CLI will automatically downlevel the code to ES5 if differential loading is enabled in the Angular project, so no action is required from Angular CLI users.



# [1.0.0-beta.4](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.3...1.0.0-beta.4) (2020-07-14)


### Bug Fixes

* **testapp:** do not render the application shell in activator microfrontends ([2180257](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/2180257deecfe4bbf67862049ecc1e3e5e443151))


### Features

* **platform:** enable activators to signal their readiness ([5beb278](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/5beb278b26e1850fa21e0dbf05677e635a63c4e4)), closes [#6](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/6)



# [1.0.0-beta.3](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.2...1.0.0-beta.3) (2020-06-30)



# [1.0.0-beta.2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.1...1.0.0-beta.2) (2020-06-29)



# 1.0.0-beta.1 (2020-06-21)


### Features

* **platform:** move SCION Microfrontend Platform to a separate Git repository ([b191ccd](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/b191ccdfa4d1c65f6c5086a0fea6702a887c525d))
* **platform:** provide services to manage and query capabilities and intentions ([3923331](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/39233310db259a488de8cd90f4248cdda6c401f1))





[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
