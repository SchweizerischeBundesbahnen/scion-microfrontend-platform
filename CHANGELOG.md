# [1.0.0-beta.20](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.0.0-beta.19...1.0.0-beta.20) (2022-01-31)


### Code Refactoring

* **platform:** consolidate API for configuring the platform ([142ce8e](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/142ce8ef446c59ffda32312eea666f3509a155ed)), closes [#39](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/39) [#96](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/96)
* **platform:** remove gateway iframe in client-broker communication ([0a4b4b0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/0a4b4b0bead9c6bb9e09d92a45e33d8cde754f0a)), closes [#14](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/14)


### BREAKING CHANGES

* **platform:** Removing the gateway communication iframe introduced a breaking change in the host/client communication protocol.

  You need to upgrade the version of SCION Microfrontend Platform in host and client applications at the same time.
  The breaking change refers only to the communication protocol, the API of the SCION Microfrontend Platform has not changed.
  
  To migrate, upgrade to the newest version of `@scion/microfrontend-platform` in the host and client applications.
* **platform:** Consolidation of the API for configuring the platform host introduced a breaking change. The communication protocol between host and client is not affected by this change.

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

  - the micro application must now pass its identity (symbolic name) directly as the first argument, rather than via the options object;
  - the options object passed to `MicrofrontendPlatform.connectToHost` has been renamed from ` MicroApplicationConfig` to `ConnectOptions` and messaging options are now top-level options; to migrate:
    - set the flag `MicrofrontendPlatformConnectOptions.connect` instead of `MicroApplicationConfig.messaging.enabled` to control if to connect to the platform host;
    - specify 'broker discovery timeout' in `MicrofrontendPlatformConnectOptions.brokerDiscoverTimeout` instead of `MicroApplicationConfig.messaging.brokerDiscoverTimeout`;
    - specify 'message delivery timeout' in `MicrofrontendPlatformConnectOptions.messageDeliveryTimeout` instead of `MicroApplicationConfig.messaging.deliveryTimeout`;

  ### The following snippets illustrate how a migration could look like:
  
  #### Before migration
  
  ```typescript
  const applications: ApplicationConfig[] = [
    {symbolicName: 'host', manifestUrl: '/manifest.json'}, // optional
    {symbolicName: 'app1', manifestUrl: 'http://app1/manifest.json'},
    {symbolicName: 'app2', manifestUrl: 'http://app2/manifest.json'},
  ];
  await MicrofrontendPlatform.startHost(applications, {symbolicName: 'host'});
  ```
  
  #### After migration
  
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
  
  #### After migration if inlining the host manifest
  
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
       See https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular for more information.
    
    - If an Angular project, add the method `onIntent` to your `NgZone` intent client decorator, as following:
       ```typescript
       public onIntent<IN = any, OUT = any>(selector: IntentSelector, callback: (intentMessage: IntentMessage<IN>) => Observable<OUT> | Promise<OUT> | OUT | void): Subscription {
         return intentClient.onIntent(selector, callback);
       }
       ```
       See https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular for more information.
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
For Angular developers, see [Preparing the MessageClient and IntentClient for use with Angular](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular) how to decorate the `MessageClient` and `IntentClient` for making Observables to emit inside the Angular zone.

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



