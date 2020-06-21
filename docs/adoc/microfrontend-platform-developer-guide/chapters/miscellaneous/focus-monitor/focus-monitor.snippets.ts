import { Beans, FocusMonitor } from '@scion/microfrontend-platform';
import { filter } from 'rxjs/operators';

{
  // tag::focus-monitor[]
  Beans.get(FocusMonitor).focusWithin$
    .pipe(filter(focusWithin => !focusWithin))
    .subscribe(() => {
      console.log('focus lost');
    });
// end::focus-monitor[]
}
