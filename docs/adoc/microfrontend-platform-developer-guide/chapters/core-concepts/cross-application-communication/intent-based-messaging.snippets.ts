import {Intent, IntentClient, IntentMessage, IntentSelector, MessageClient, MessageHeaders, OutletRouter, ResponseStatusCodes, takeUntilUnsubscribe} from '@scion/microfrontend-platform';
import {Subject} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {take} from 'rxjs/operators';

`
// tag::intention-declaration[]
{
  "intentions": [
    {
      "type": "wizard", // <1>
      "qualifier": {
        "process": "checkout"
      }
    }
  ]
}
// end::intention-declaration[]
`;

`
// tag::capability-declaration[]
{
  "capabilities": [
    {
      "description": "Starts the checkout wizard.", // <1>
      "type": "wizard", // <2>
      "qualifier": { // <3>
        "process": "checkout"
      },
      "private": false, // <4>
    }
  ]
}
// end::capability-declaration[]
`;

{
// tag::handle-intent[]
  const selector: IntentSelector = { // <1>
    type: 'wizard',
    qualifier: {process: 'checkout'},
  };

  Beans.get(IntentClient).observe$(selector) // <2>
    .subscribe((message: IntentMessage) => {
      // start the checkout wizard
    });
// end::handle-intent[]
}

{
// tag::issue-intent[]
  const intent: Intent = { // <1>
    type: 'wizard',
    qualifier: {process: 'checkout'},
  };

  Beans.get(IntentClient).publish(intent); // <2>
// end::issue-intent[]
}

{
  // tag::request[]
  const accessTokenIntent: Intent = {
    type: 'auth',
    qualifier: {object: 'access-token'},
  };

  Beans.get(IntentClient).request$(accessTokenIntent).subscribe(reply => { // <1>
    console.log(`token: ${reply.body}`); // <2>
  });
  // end::request[]
}

{
  const authService = new class {
    public userAccessToken$ = new Subject<string>();
  };

  // tag::reply[]
  const selector: IntentSelector = {
    type: 'auth',
    qualifier: {object: 'access-token'},
  };

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(IntentClient).observe$(selector).subscribe((request: IntentMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>

    authService.userAccessToken$
      .pipe(takeUntilUnsubscribe(replyTo)) // <3>
      .subscribe(token => {
        Beans.get(MessageClient).publish(replyTo, token); // <2>
      });
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(IntentClient).observe$(selector).subscribe((request: IntentMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>
    const headers = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL); // <4>

    authService.userAccessToken$
      .pipe(take(1))
      .subscribe(token => {
        Beans.get(MessageClient).publish(replyTo, token, {headers});
      });

  });
  // end::reply[]
}

{
  const authService = new class {
    public userAccessToken$ = new Subject<string>();
  };

  // tag::onIntent[]
  const selector: IntentSelector = {
    type: 'auth',
    qualifier: {object: 'access-token'},
  };

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(IntentClient).onIntent(selector, intentMessage => {
    return authService.userAccessToken$;
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(IntentClient).onIntent(selector, intentMessage => {
    return authService.userAccessToken$.pipe(take(1));
  });
  // end::onIntent[]
}
