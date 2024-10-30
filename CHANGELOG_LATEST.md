## [1.3.1](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.3.0...1.3.1) (2024-10-29)


### Bug Fixes

* **platform/router-outlet:** remove inline styles for CSP compliance ([40e4fbd](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/40e4fbdfe2d9fa626ba1edcfdd3d6e0655bba912)), closes [#287](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/287)


### DevTools

* **devtools:** move DevTools to `*.scion.vercel.app` subdomain ([3897efe](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/3897efef940952e0098244d1397a872d302e7c2a))


### BREAKING CHANGES

* **devtools:** The URL of the SCION Microfrontend Platform DevTools has changed.

  The URL of previous releases has not changed. The current version (`1.3.1`) is available at the previous and new URL. New releases will be available only at the new URL.

  To migrate, load the DevTools from https://microfrontend-platform-devtools.scion.vercel.app (latest) or http://microfrontend-platform-devtools-vx-y-z.scion.vercel.app (versioned). Previously, DevTools were available at https://scion-microfrontend-platform-devtools.vercel.app and https://scion-microfrontend-platform-devtools-vx-y-x.vercel.app.



