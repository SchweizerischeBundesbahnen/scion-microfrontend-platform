import {Intent, IntentClient, IntentMessage, IntentSelector, MessageClient, MessageHeaders, OutletRouter, PRIMARY_OUTLET, ResponseStatusCodes, takeUntilUnsubscribe, TopicMessage} from '@scion/microfrontend-platform';
import {Subject} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {map, take} from 'rxjs/operators';

`
// tag::intention-declaration[]
{
  "intentions": [ // <1>
    {
      "type": "microfrontend", // <2>
      "qualifier": {
        "entity": "product"
      }
    }
  ]
}
// end::intention-declaration[]
`;

`
// tag::capability-declaration[]
{
  "capabilities": [ // <1>
    {
      "description": "Opens the product microfrontend.", // <2>
      "type": "microfrontend", // <3>
      "qualifier": { // <4>
        "entity": "product"
      },
      "params": [ // <5>
        {"name": "productId", "required": true, "description": "Identifies the product to display."},
        {"name": "outlet", "required": false, "description": "Controls in which router outlet to display the microfrontend."},
      ],
      "private": false, // <6>
      "properties": {
        "path": "/products/:productId", // <7>
      }
    }
  ]
}
// end::capability-declaration[]
`;

{
// tag::handle-intent[]
  const selector: IntentSelector = { // <1>
    type: 'microfrontend',
    qualifier: {entity: 'product'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => { // <2>
    const microfrontendPath = message.capability.properties.path; // <3>

    // Instruct the router to display the microfrontend in an outlet.
    Beans.get(OutletRouter).navigate(microfrontendPath, { // <4>
      outlet: message.intent.params.get('outlet'), // <5>
      params: message.intent.params, // <6>
    });
  });
// end::handle-intent[]
}

{
// tag::issue-intent[]
  const intent: Intent = { // <1>
    type: 'microfrontend',
    qualifier: {entity: 'product'},
    params: new Map()
      .set('productId', '500f3dba-a638-4d1c-a73c-d9c1b6a8f812') // <2>
      .set('outlet', 'primary'), // <3>
  };

  Beans.get(IntentClient).publish(intent); // <4>
// end::issue-intent[]
}

{
  // tag::request[]
  const authTokenIntent: Intent = {
    type: 'auth',
    qualifier: {entity: 'user-access-token'},
  };

  Beans.get(IntentClient).request$(authTokenIntent).subscribe(reply => { // <1>
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
    qualifier: {entity: 'user-access-token'},
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
    qualifier: {entity: 'user-access-token'},
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
