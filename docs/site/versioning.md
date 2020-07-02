<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Versioning

SCION Microfrontend Platform follows the semantic versioning scheme (SemVer) for its releases. In the development of a new major release, we usually release pre-releases and tag them with the beta tag. A beta pre-release is a snapshot of current development, so it is potentially unstable and incomplete. Before releasing the major version, we start releasing one or more release candidates, which we tag with the rc tag. We will publish the official and stable major release if the platform is working as expected and we do not find any critical problems.

<p align="center">
  <img src="/docs/adoc/microfrontend-platform-developer-guide/images/semver.svg" alt="Versioning">
</p>

We are aware that you need stability from the SCION Microfrontend Platform, primarily because microfrontends with potential different lifecycles are involved. Therefore, you can expect a decent release cycle of one or two major releases per year. Changes in the communication protocol between the host and micro applications are backward compatible with the previous major version. When deprecating API, which can occur in any release, it will still be present in the next major release. Removal of deprecated API will occur only in a major release.

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
