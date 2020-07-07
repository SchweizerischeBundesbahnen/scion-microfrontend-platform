<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| SCION Microfrontend Platform | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## [SCION Microfrontend Platform][menu-home] > Installation

This short manual helps to install the SCION Microfrontend Platform and describes how to start the platform. For more detailed instructions, please refer to the [Developer Guide][link-developer-guide#configuration].


1. **Install `SCION Microfrontend Platform` using the NPM command-line tool**

   ```console
   npm install @scion/microfrontend-platform --save
   ```
  
1. **Install `SCION Toolkit` using the NPM command-line tool**

   ```console
   npm install @scion/toolkit --save
   ```

   > SCION Microfrontend Platform requires some tools of the module [SCION Toolkit][link-scion-toolkit]. SCION Toolkit has different entry points. Please note that the toolkit has an optional peer dependency on the Angular framework, as some tools are Angular-agnostic. However, the SCION Microfrontend Platform only uses framework-agnostic tools. **So do not be misled by the warning that Angular is missing. The platform does not depend on the Angular framework.**

1. **Start the platform**

   The platform is started differently in the host application and the micro applications to be integrated.

   <details>
     <summary><strong>Start the platform in the host application</strong></summary>
     <br>
    
   The host application provides the top-level integration container for microfrontends. Typically, it is the web app which the user loads into his browser and provides the main application shell, defining areas to embed microfrontends. The host application registers the micro applications when starting the platform host.

   3.1. *Registering micro applications*

      For each micro application to register, you must provide an application config with the application's symbolic name and the URL to its manifest.
      ```ts
      const platformConfig: MicroApplicationConfig[] = [
        {symbolicName: 'host-app', manifestUrl: '/manifest.json'}, // optional
        {symbolicName: 'products-app', manifestUrl: 'http://localhost:4201/manifest.json'},
        {symbolicName: 'shopping-cart-app', manifestUrl: 'http://localhost:4202/manifest.json'},
      ];
      ```
      Symbolic names must be unique and are used by the micro applications to connect to the platform host. The manifest is a JSON file that contains information about a micro application.
   
   3.2. *Starting the platform*

      When starting the platform, you pass the app config array as first argument, as following:
      ```ts
      await MicrofrontendPlatform.startHost(platformConfig, {symbolicName: 'host-app'});
      ```
      Alternatively, you could load the config asynchronously using a config loader, e.g., for loading the config over the network.

      The second argument is the symbolic name of the micro application starting the platform host. It is optional. If specified, the host app can interact with the platform and other micro applications, e.g., publish messages or navigate in router outlets. The host application has no extra privileges compared to other micro applications and must also provide a manifest file. The manifest declares at least the name of the application, as follows:
 
      ```json
      {
        "name": "Host App"
      }
      ```

      The method for starting the platform host returns a Promise that resolves when the platform started successfully and activators, if any, signaled ready. You should wait for the Promise to resolve before interacting with the platform.
   </details>    
 
   <details>
     <summary><strong>Start the platform in micro applications</strong></summary>
     <br>
     
   For a micro application to connect to the platform host, it must be registered in the host application. For this, the micro application must provide a manifest file.  
 
   3.1. *Providing a manifest*
  
      Create the manifest file, for example, `manifest.json`. The manifest declares at least the name of the application.
 
      ```json
      {
        "name": "Products App"
      }
      ```
   
   3.2. *Connecting to the platform host*
   
      ```ts
      await MicrofrontendPlatform.connectToHost({symbolicName: 'products-app'});
      ```
   
      As the symbolic name, you must pass the exact same name under which you registered the micro application in the host application.
      
      The method for connecting to the platform host returns a Promise that resolves when connected to the platform host, or that rejects if not finding the platform host or if the micro application is not authorized to connect. You should wait for the Promise to resolve before interacting with the platform.
  
   </details>
   
   ***
   
   For Angular applications, we recommend starting the platform in an app initializer and synchronizing the message client with the Angular zone. For more detailed information on integrating the SCION Microfrontend Platform into an Angular application, please refer to the [Angular Integration Guide][link-developer-guide#angular_integration_guide].
   

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-developer-guide#configuration]: https://scion-microfrontend-platform-developer-guide.now.sh#chapter:configuration
[link-developer-guide#angular_integration_guide]: https://scion-microfrontend-platform-developer-guide.now.sh#chapter:angular_integration_guide
[link-scion-toolkit]: https://github.com/SchweizerischeBundesbahnen/scion-toolkit/blob/master/README.md
