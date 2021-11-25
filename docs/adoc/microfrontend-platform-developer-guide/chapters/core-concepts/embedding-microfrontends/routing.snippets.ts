import {IntentClient, IntentMessage, IntentSelector, MessageClient, OutletRouter, PRIMARY_OUTLET} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

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

{
// tag::named-url-parameter[]
  Beans.get(OutletRouter).navigate('/products/:id', { // <1>
    outlet: 'aside', // <2>
    params: new Map().set('id', '500f3dba-a638-4d1c-a73c-d9c1b6a8f812'), // <3>
  });
// end::named-url-parameter[]
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
