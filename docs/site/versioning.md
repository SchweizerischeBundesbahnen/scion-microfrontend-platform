<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Versioning

SCION Microfrontend Platform follows the semantic versioning scheme (SemVer) for its releases. In the development of a new major release, we usually release pre-releases and tag them with the beta tag. A beta pre-release is a snapshot of current development, so it is potentially unstable and incomplete. Before releasing the major version, we start releasing one or more release candidates, which we tag with the rc tag. We will publish the official and stable major release if the platform is working as expected and we do not find any critical problems.

**Major Version:**\
Major versions contain breaking changes.

**Minor Version**\
Minor versions add new features or deprecate existing features without breaking changes.

**Patch Level**\
Patch versions fix bugs or optimize existing features without breaking changes.

<p align="center">
  <img src="/docs/adoc/microfrontend-platform-developer-guide/images/semver.svg" alt="Versioning">
</p>

We are aware that you need stability from the SCION Microfrontend Platform, primarily because microfrontends with potential different lifecycles are involved. Therefore, you can expect a decent release cycle of one or two major releases per year with strict [semantic versioning](https://semver.org) policy. Changes to the communication protocol between the host and micro applications are backward compatible in the same major release. This allows for the host and its clients to update independently.

Deprecation of APIs can occur in any release. Deprecated APIs are only removed in a major release.

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
