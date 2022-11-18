import {FocusMonitor} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

{
  // tag::focus-monitor#focus$[]
  Beans.get(FocusMonitor).focus$.subscribe(hasFocus => {
    console.log('on focus change', hasFocus);
  });
// end::focus-monitor#focus$[]
}

{
  // tag::focus-monitor#focus-within$[]
  Beans.get(FocusMonitor).focusWithin$.subscribe(isFocusWithin => {
    console.log('on focus change', isFocusWithin);
  });
// end::focus-monitor#focus-within$[]
}

{
  `
  // tag::onfocuswithin-event[]
  <sci-router-outlet onfocuswithin="onFocusWithin()"></sci-router-outlet>
  // end::onfocuswithin-event[]
  `;
}

{
  `
  // tag::onfocuswithin-event-angular[]
  <sci-router-outlet (focuswithin)="onFocusWithin($event)"></sci-router-outlet>
  // end::onfocuswithin-event-angular[]
  `;
}
