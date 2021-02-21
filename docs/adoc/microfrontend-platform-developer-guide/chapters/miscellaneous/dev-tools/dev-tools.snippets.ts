`
  // tag::dev-tools:register-dev-tools[]
  await MicrofrontendPlatform.startHost({
    apps: [
      // your apps
      {
        symbolicName: 'devtools',
        manifestUrl: 'https://scion-microfrontend-platform-devtools-<version>.vercel.app/assets/manifest.json', <1>
        intentionCheckDisabled: true, <2>
        scopeCheckDisabled: true, <2>
      },
    ],
  });
  // end::dev-tools:register-dev-tools[]
`;

`
  // tag::dev-tools:dev-tools-outlet[]
  <sci-router-outlet name="DEV-TOOLS"></sci-router-outlet>
  // end::dev-tools:dev-tools-outlet[]
`;

`
  // tag::dev-tools:dev-tools-navigation[]
  Beans.get(OutletRouter).navigate('https://scion-microfrontend-platform-devtools-<version>.vercel.app', {outlet: 'DEV-TOOLS'});
  // end::dev-tools:dev-tools-navigation[]
`;
