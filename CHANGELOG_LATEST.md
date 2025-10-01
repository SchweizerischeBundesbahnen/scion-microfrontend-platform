# [1.6.0](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/compare/1.5.0...1.6.0) (2025-10-01)


### Features

* **platform:** support excluding capability ([ed209a2](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/commit/ed209a23922b82e9ffb10c292e153bfb0e8aff10)), closes [#319](https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/issues/319)


### RECOMMENDATIONS

* **devtools:** Disable `Capability Active Check` to display excluded (inactive) capabilities in the SCION DevTools.
 
  ```ts
    MicrofrontendPlatformHost.start({
      applications: [
        // Register SCION DevTools application
        {
          symbolicName: 'devtools',
          manifestUrl: 'https://microfrontend-platform-devtools-<version>.scion.vercel.app/manifest.json',
          intentionCheckDisabled: true,
          scopeCheckDisabled: true,
          capabilityActiveCheckDisabled: true, // Disable this check
        },
      ],
    });
  ```
