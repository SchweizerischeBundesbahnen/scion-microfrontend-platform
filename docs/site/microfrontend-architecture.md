<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Microfrontend Architecture

Web frontends are becoming more and more common, even for complex business applications. To tackle the complexity of enterprise application landscapes, a strong trend towards microservice-based backends and microfrontends on the client-side is emerging. The microfrontend design approach is very tempting and has obvious advantages, especially for large-scale and long-lasting projects, most notably because we are observing an enormous dynamic in web frameworks.

<p align="center">
  <a href="https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/raw/master/docs/adoc/microfrontend-platform-developer-guide/images/microfrontend-architecture.svg"><img src="/docs/adoc/microfrontend-platform-developer-guide/images/microfrontend-architecture.svg" alt="Microfrontend Architecture"></a>
</p>

The microservice and microfrontend architecture design approach enables us to form development teams full-stack in line with the business functionality, resulting in independent so-called micro applications. A micro application deals with well-defined business functionality. Its backend services are collectively referred to as microservice and its user-facing parts as microfrontend.

***

A microfrontend is a term of the microfrontend architecture design approach to developing frontend applications as a composition of small, self-contained components, so-called microfrontends. Each microfrontend focuses on a single business functionality, breaking up hard-to-handle monoliths into parts by allowing independent development, autonomous lifecycles, true code splitting, and the use of different stacks. Microfrontends should be as independent and isolated as possible so that a change in one microfrontend has no impact on other microfrontends.

***

For the end-user, however, it is still a single application that he loads into his browser. The composition of the microfrontends is entirely transparent to him. By striving for a uniform look and feel of the microfrontends, the user does not even notice that different micro applications are involved.

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
 
