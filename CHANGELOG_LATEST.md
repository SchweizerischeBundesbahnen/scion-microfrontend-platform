# [3.0.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/2.1.0...3.0.0) (2026-08-28)


### Features

* **platform:** stop platform on `pagehide` event synchronously ([50ee59f](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/50ee59fa4f298de6be237a218d22c1f7c12f437c)), closes [#372](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/372)


### BREAKING CHANGES

* **platform:** The synchronous shutdown introduces a breaking change for both host and client applications.

  To migrate:
  - `MicrofrontendPlatform.destroy` now returns `void` instead of `Promise`.
  - `MicrofrontendPlatform.whenState` has been renamed to `MicrofrontendPlatform.onState`. It now accepts a callback function as its second argument instead of returning a `Promise`.

    ```ts
    // Before Migration
    MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
      // invoked when the platform is about to start.
    });

    // After Migration
    MicrofrontendPlatform.onState(PlatformState.Starting, () => {
      // invoked when the platform is about to start.
    });
    ```
