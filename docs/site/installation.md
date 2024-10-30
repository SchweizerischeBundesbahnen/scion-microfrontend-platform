<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Installation

This short manual helps to install the SCION Microfrontend Platform and describes how to start the platform. For more detailed instructions, please refer to the [Developer Guide][link-developer-guide#configuration].

1. **Install `SCION Microfrontend Platform` using the NPM command-line tool**

   ```console
   npm install @scion/microfrontend-platform @scion/toolkit rxjs@^7.5.0 --save
   ```
   > SCION Microfrontend Platform requires some tools of the module [@scion/toolkit][link-scion-toolkit]. By using the above command, those are installed as well.

1. **Start the platform**

   The platform is started differently in the host application and the micro applications to be integrated.

   <details>
     <summary><strong>Start the platform in the host application</strong></summary>
     <br>

     The host application provides the top-level integration container for microfrontends. Typically, it is the web app which the user loads into the browser that provides the main application shell, defining areas to embed microfrontends.

     The host application starts the platform by invoking the method `MicrofrontendPlatformHost.start` and passing a config with the web applications to register as micro applications. Registered micro applications can interact with the platform and other micro applications.

     ```ts
     await MicrofrontendPlatformHost.start({
       applications: [
         {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
         {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
       ],
     });
     ```

     For each micro application to register, you must provide an application config with the application's symbolic name and the URL to its manifest. Symbolic names must be unique and are used by the micro applications to connect to the platform host. The manifest is a JSON file that contains information about the micro application.

     As with micro applications, the host can provide a manifest to contribute behavior, as following:

     ```ts
     await MicrofrontendPlatformHost.start({
       host: {
         manifest: {
           name: 'Host Application',
           capabilities: [
             // capabilities of the host application
           ],
           intentions: [
             // intentions of the host application
           ],
         }
       },
       applications: [
         {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
         {symbolicName: 'customers-app', manifestUrl: 'http://localhost:4202/manifest.json'},
       ],
     });
     ```

     The method for starting the platform host returns a Promise that resolves once platform startup completed. You should wait for the Promise to resolve before interacting with the platform.
   </details>

   <details>
     <summary><strong>Connect to the platform host in a micro application</strong></summary>
     <br>

     For a micro application to connect to the platform host, it needs to provide a manifest file and be registered in the host application.

     Create the manifest file, for example, `manifest.json`. The manifest declares at minimum the name of the application.

     ```json
     {
       "name": "Products Application"
     }
     ```

     A micro application connects to the platform host by invoking the method `MicrofrontendPlatformClient.connect` and passing its identity as argument. The host checks whether the connecting micro application is qualified to connect, i.e., is registered in the host application under that origin; otherwise, the host will reject the connection attempt.

     ```ts
     await MicrofrontendPlatformClient.connect('products-app');
     ```

     As the symbolic name, you must pass the exact same name under which you registered the micro application in the host application.

     The method for connecting to the platform host returns a Promise that resolves when connected to the platform host. You should wait for the Promise to resolve before interacting with the platform.

   </details>

   ***

   For Angular applications, we recommend starting the platform in an app initializer and synchronizing the message client with the Angular zone. For more detailed information on integrating the SCION Microfrontend Platform into an Angular application, please refer to the [Angular Integration Guide][link-developer-guide#angular_integration_guide].


[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-developer-guide#configuration]: https://microfrontend-platform-developer-guide.scion.vercel.app#chapter:configuration
[link-developer-guide#angular_integration_guide]: https://microfrontend-platform-developer-guide.scion.vercel.app#chapter:angular_integration_guide
[link-scion-toolkit]: https://www.npmjs.com/package/@scion/toolkit
