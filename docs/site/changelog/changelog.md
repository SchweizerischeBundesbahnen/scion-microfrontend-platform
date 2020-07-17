<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| [SCION Microfrontend Platform][menu-home] | [Projects Overview][menu-projects-overview] | Changelog | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## Changelog

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
