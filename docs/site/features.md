<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Feature Overview

This page gives you an overview of existing and planned platform features. Development is mainly driven by requirements of projects at [SBB][link-company-sbb] building a revolutionary traffic management system on behalf of the [SmartRail 4.0 project][link-project-sr40]. Many other features are imaginable. If a feature you need is not listed here or needs to be prioritized, please [file a GitHub issue](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/new?template=feature_request.md).


[![][done]](#) Done&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![][progress]](#) In Progress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![][planned]](#) Planned&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![][deprecated]](#) Deprecated

|Feature|Status|Note|Doc
|-|-|-|-|
|**Communication**|[![][done]](#)|The platform provides a pub/sub layer on top of the native `postMessage` mechanism to allow microfrontends to communicate with each other across origins. The platform supports messaging in two flavors: topic-based and intent-based.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:cross-application-communication)
|**Embedding of Microfrontends**|[![][done]](#)|Microfrontends are embedded using router outlets. A router outlet is a placeholder that the platform dynamically fills based on the current router state. A router outlet is implemented as a web component that wraps an iframe and solves many of the cumbersome quirks of iframes and helps to overcome iframe restrictions. Multiple outlets can display different content, determined by different outlet names, all at the same time. Router outlets can be nested.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:router-outlet)
|**Routing**|[![][done]](#)|In SCION Microfrontend Platform, routing means instructing a router outlet to display the content of a URL. Routing works across application boundaries and enables features such as persistent navigation.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:routing)
|**Controlled Collaboration**|[![][done]](#)|The platform implements the concept of an application manifest per embedded micro application to enable controlled collaboration through the platform's Intention API. A micro application can provide functionality to other micro applications in the form of capabilities that other micro applications can consume by declaring an intention in their manifest.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:intention-api)
|**Activator**|[![][done]](#)|A micro application can register an activator to initialize and connect to the platform when the user loads the host application into his browser. The platform loads all activators into hidden iframes for the entire platform lifecycle, thus, providing a stateful session to micro applications on the client-side.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:activator)
|**Message Interception**|[![][done]](#)|The platform provides a common mechanism to intercept messages before their publication. An interceptor can reject or modify messages. Multiple interceptors form a chain in which each interceptor is called one by one in registration order.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:message-interception)
|**Focus Tracking**|[![][done]](#)|The focus monitor allows observing if the current microfrontend has received focus or contains embedded web content that has received focus. It behaves like the `:focus-within` CSS pseudo-class but operates across iframe boundaries.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:focus-monitor)
|**Keystroke Bubbling**|[![][done]](#)|The router outlet allows the declaration of keystrokes, instructing embedded content at any nesting level to propagate corresponding keyboard events to the outlet.|[Doc](https://scion-microfrontend-platform-developer-guide.vercel.app/#chapter:router-outlet:keystroke-bubbling)
|**Developer Tools**|[![][progress]](#)|The Developer Tools (DevTools) is a SaaS microfrontend that developers can plug in when needed. With the DevTools, you can inspect integrated micro applications, browse available capabilities, analyze dependencies between micro applications, and more.|n/a

[done]: /docs/site/images/icon-done.svg
[progress]: /docs/site/images/icon-in-progress.svg
[planned]: /docs/site/images/icon-planned.svg
[deprecated]: /docs/site/images/icon-deprecated.svg

[link-company-sbb]: http://www.sbb.ch
[link-project-sr40]: https://smartrail40.ch

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
