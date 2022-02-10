<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Introduction

**SCION Microfrontend Platform is a TypeScript-based open-source library that helps to implement a microfrontend architecture.**

The platform enables you to successfully implement a framework-agnostic microfrontend architecture by providing you with fundamental APIs for client-side communication, embedding microfrontends, and navigating between the microfrontends. You can continue using the frameworks you love since the platform integrates microfrontends via iframes. Iframes by nature provide maximum isolation and allow the integration of any web application without complex adaptation. The platform aims to shield developers from iframe specifics and the low-level messaging mechanism to focus instead on integrating microfrontends.

***
*SCION Microfrontend Platform is a lightweight, web stack agnostic library but not a framework. It has no user-facing components, and does not dictate any form of application structure.*
***

#### Cross-microfrontend communication
The platform adds a pub/sub layer on top of the native `postMessage` mechanism to allow microfrontends to communicate with each other easily across origins. Communication comes in two flavors: topic-based and intent-based. Both models feature the request-response message exchange pattern, let you include message headers, and support message interception to implement cross-cutting messaging concerns.

Topic-based messaging enables you to publish messages to multiple subscribers via a common topic. Intent-based communication focuses on controlled collaboration between applications. To collaborate, an application must express an intention. Manifesting intentions allows us to see dependencies between applications down to the functional level.

For more information, see chapters [Cross Application Communication][link-developer-guide#cross-application-communication] and [Intention API][link-developer-guide#intention-api] in the SCION Microfrontend Platform Developer Guide.

#### Microfrontend Integration and Routing
The platform makes it easy to integrate microfrontends through its router-outlet. The router-outlet is a web component that wraps an iframe. It solves many of the cumbersome quirks of iframes and helps to overcome iframe restrictions. For example, it can adapt its size to the preferred size of embedded content, supports keyboard event propagation and allows you to pass contextual data to embedded content. Using the router, you control which web content to display in an outlet. Multiple outlets can display different content, determined by different outlet names, all at the same time. Routing works across application boundaries and enables features such as persistent navigation.

For more information, see chapter [Embedding Microfrontends][link-developer-guide#embedding-microfrontends] in SCION Microfrontend Platform Developer Guide.

***

A microfrontend architecture can be achieved in many different ways, each with its pros and cons. The SCION Microfrontend Platform uses the iframe approach primarily since iframes by nature provide the highest possible level of isolation through a separate browsing context. The microfrontend design approach is very tempting and has obvious advantages, especially for large-scale and long-lasting projects, most notably because we are observing an enormous dynamic in web frameworks. The SCION Microfrontend Platform provides you with the necessary tools to best support you in implementing such an architecture.

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-developer-guide#cross-application-communication]: https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:cross-application-communication
[link-developer-guide#intention-api]: https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:intention-api
[link-developer-guide#embedding-microfrontends]: https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:embedding-microfrontends
