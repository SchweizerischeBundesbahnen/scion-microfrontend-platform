import { Beans, ContextService, MessageClient, OutletRouter, PreferredSizeService, SciRouterOutletElement } from '@scion/microfrontend-platform';
import { UUID } from '@scion/toolkit/util';

{
  `
  // tag::router-outlet[]
  <sci-router-outlet name="aside"></sci-router-outlet>
  // end::router-outlet[]
`
}

{
  // tag::outlet-router[]
  Beans.get(OutletRouter).navigate('https://micro-frontends.org', {outlet: 'aside'});
  // end::outlet-router[]
}

{
  `
  // tag::router-outlet:keystrokes-html-template[]
  <sci-router-outlet keystrokes="keydown.escape,keydown.control.alt.enter,keydown.control.space">
  </sci-router-outlet>
  // end::router-outlet:keystrokes-html-template[]
  `
}

{
  // tag::router-outlet:keystrokes-typescript[]
  const outlet: SciRouterOutletElement = document.querySelector('sci-router-outlet');
  outlet.keystrokes = [
    'keydown.escape',
    'keydown.control.alt.enter',
    'keydown.control.space',
  ];
  // end::router-outlet:keystrokes-typescript[]
}

{
  // tag::router-outlet:preferred-size[]
  Beans.get(PreferredSizeService).setPreferredSize({width: '100%', minHeight: '400px'});
  // end::router-outlet:preferred-size[]

  // tag::router-outlet:preferred-size-fromDimension[]
  const mainElement = document.querySelector('main');

  // Bind the element to automatically report its size.
  Beans.get(PreferredSizeService).fromDimension(mainElement);
  // end::router-outlet:preferred-size-fromDimension[]
}

{
  `
  // tag::router-outlet:page-scrolling-disabled[]
  <sci-router-outlet scrollable="false"></sci-router-outlet>
  // end::router-outlet:page-scrolling-disabled[]
  `
}

{
  `
  // tag::router-outlet:listen-to-activate-event-in-template[]
  <sci-router-outlet onactivate="onActivate()"></sci-router-outlet>
  // end::router-outlet:listen-to-activate-event-in-template[]
  `
}

{
  // tag::router-outlet:listen-to-activate-event[]
  const outlet: SciRouterOutletElement = document.querySelector('sci-router-outlet');
  outlet.addEventListener('activate', (event: CustomEvent) => console.log(event.detail));
  // end::router-outlet:listen-to-activate-event[]
}

{
  // tag::router-outlet:set-context-value[]
  const highlightingTopic = UUID.randomUUID(); // <1>

  const tabOutlet: SciRouterOutletElement = document.querySelector('sci-router-outlet');
  tabOutlet.setContextValue('highlighting-topic', highlightingTopic); // <2>

  // Subscribe to highlighting events to highlight the tab
  Beans.get(MessageClient).onMessage$(highlightingTopic).subscribe(() => {
    // highlight the tab
  });

  // end::router-outlet:set-context-value[]
}

{
  async function asyncFunction(): Promise<void> {
    // tag::router-outlet:observe-context-value[]
    const highlightingTopic = await Beans.get(ContextService).lookup<string>('highlighting-topic'); // <1>

    /** Method invoked when data of the microfrontend changes. **/
    function onMicrofrontendDataChange(): void {
      Beans.get(MessageClient).publish(highlightingTopic); // <2>
    }

    // end::router-outlet:observe-context-value[]
  }
}
