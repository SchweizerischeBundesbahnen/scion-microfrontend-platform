import { FocusMonitor } from '@scion/microfrontend-platform';
import { filter } from 'rxjs/operators';
import { Beans } from '@scion/toolkit/bean-manager';
// tslint:disable:no-unused-expression

{
  // tag::focus-monitor[]
  Beans.get(FocusMonitor).focusWithin$
    .pipe(filter(focusWithin => !focusWithin))
    .subscribe(() => {
      console.log('focus lost');
    });
// end::focus-monitor[]
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
