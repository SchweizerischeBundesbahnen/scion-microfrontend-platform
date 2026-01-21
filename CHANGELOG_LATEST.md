# [2.0.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.6.0...2.0.0) (2026-01-21)


### Features

* **platform:** support default value for optional capability parameter ([123b3af](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/123b3affa7ebf60a670e9ed23beef8688411a41d))
* **platform:** support rejecting capability in a capability interceptor ([d486b25](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/d486b25527c3f025971c35744205d2dae1d19042)), closes [#311](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/311)


### Code Refactoring
* **platform:** replace type `any` by `unknown` ([10618d8](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/10618d8de463b107b6ac079ed53847c0b9f6cd84))


### BREAKING CHANGES

* **platform:** Type `any` has been replaced by `unknown` for parameters and return values. An explicit cast may be required now.
* **platform:** `ManifestService.registerCapability` now returns `null` if an interceptor prevented registration.


