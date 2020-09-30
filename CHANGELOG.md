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
For Angular developers, see [Preparing the MessageClient and IntentClient for use with Angular](https://scion-microfrontend-platform-developer-guide.now.sh/#chapter:angular-integration-guide:preparing-messaging-for-use-with-angular) how to decorate the `MessageClient` and `IntentClient` for making Observables to emit inside the Angular zone.

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



