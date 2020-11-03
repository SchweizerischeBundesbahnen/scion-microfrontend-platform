import { IntentClient, IntentMessage, IntentSelector, MessageClient, OutletRouter, PRIMARY_OUTLET } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';
// tslint:disable:no-unused-expression

{
  `
  // tag::router-outlet[]
  <sci-router-outlet name="aside"></sci-router-outlet>
  // end::router-outlet[]
`;
}

{
  // tag::outlet-router[]
  Beans.get(OutletRouter).navigate('https://micro-frontends.org', {outlet: 'aside'});
  // end::outlet-router[]
}

{
  // tag::relative-navigation[]
  // Navigation relative to the root path segment
  Beans.get(OutletRouter).navigate('/products/:id', {outlet: PRIMARY_OUTLET});

  // Navigation relative to the parent path segment
  Beans.get(OutletRouter).navigate('../products/:id', {outlet: PRIMARY_OUTLET});

  // Navigation relative to https://product-catalog.webshop.io/
  Beans.get(OutletRouter).navigate('/products/:id', {
    outlet: PRIMARY_OUTLET,
    relativeTo: 'https://product-catalog.webshop.io/',
  });
  // end::relative-navigation[]
}

{
  // tag::persistent-navigation:capture-and-persist[]
  Beans.get(MessageClient).observe$<string>('sci-router-outlets/:outlet/url')
    .subscribe(navigation => { // <1>
      const topic = navigation.topic;
      const url = navigation.body;
      persistNavigation(topic, url); // <2>
    });

  // end::persistent-navigation:capture-and-persist[]
  function persistNavigation(outlet: string, url: string): void {
  }
}

{
  // tag::persistent-navigation:replay[]
  loadNavigations().forEach(([url, outlet]) => { // <1>
    Beans.get(OutletRouter).navigate(url, {outlet: outlet}); // <2>
  });

  // end::persistent-navigation:replay[]
  function loadNavigations(): Map<string, string> {
    return null;
  }
}

`
// tag::named-url-parameter:capability[]
{
  "description": "Shows the product microfrontend.",
  "type": "microfrontend",
  "qualifier": {
    "entity": "product",
    "id": "*", // <1>
  }
  "properties": {
    "path": "/products/:id", // <2>
  }
}
// end::named-url-parameter:capability[]
`;

{
// tag::named-url-parameter:handle-intent[]
  const selector: IntentSelector = {
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '*'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => {
    const microfrontendPath = message.capability.properties.path; // <1>

    // Instruct the router to display the microfrontend in an outlet.
    Beans.get(OutletRouter).navigate(microfrontendPath, { // <2>
      outlet: PRIMARY_OUTLET,
      params: message.intent.qualifier, // <3>
    });
  });
// end::named-url-parameter:handle-intent[]
}

{
  // tag::push-state-to-session-history-stack[]
  Beans.get(OutletRouter).navigate('https://micro-frontends.org', {
    outlet: 'aside',
    pushStateToSessionHistoryStack: true, // <1>
  });
  // end::push-state-to-session-history-stack[]
}

{
  // tag::clear-outlet-content[]
  Beans.get(OutletRouter).navigate(null, {outlet: 'aside'});
  // end::clear-outlet-content[]
}
