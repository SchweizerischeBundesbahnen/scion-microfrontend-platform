<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Announcements

On this page you will find the latest news about the development of the SCION Microfrontend Platform.

- **2020-12: Developer Tools**\
We released the DevTools! With the DevTools, you can inspect integrated micro applications, browse available capabilities, analyze dependencies between micro applications, and more.
\
For more information, see https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:dev-tools.

- **2020-07: esm5 and fesm5 format is no longer distributed in @scion/microfrontend-platform’s NPM package**\
Since version `1.0.0-beta.5` we no longer include the distributions for `esm5` and `fesm5` in the `@scion/microfrontend-platform`’s NPM package. Only the formats for `esm2015`, `fesm2015`, and UMD are distributed. Consequently, the module field in package.json now points to the `fesm2015` distribution.\
\
If requiring `esm5` or `fesm5`, you will need to downlevel to ES5 yourself. If using Angular, the Angular CLI will automatically downlevel the code to ES5 if differential loading is enabled in the Angular project, so no action is required from Angular CLI users.\
\
For more information, see https://microfrontend-platform-developer-guide.scion.vercel.app/#chapter:transpilation-level.

- **2020-06: Developer Tools**\
We are working on a DevTools microfrontend that developers can plug in when needed. With the DevTools, you can inspect integrated micro applications, browse available capabilities, analyze dependencies between micro applications, and more.

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

