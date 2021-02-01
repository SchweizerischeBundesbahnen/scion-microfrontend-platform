import { Intent, IntentClient, IntentMessage, IntentSelector, MessageClient, MessageHeaders, OutletRouter, PRIMARY_OUTLET, ResponseStatusCodes, takeUntilUnsubscribe, TopicMessage } from '@scion/microfrontend-platform';
import { Subject } from 'rxjs';
import { Beans } from '@scion/toolkit/bean-manager';
import { take } from 'rxjs/operators';

`
// tag::intention-declaration[]
{
  "intentions": [ // <1>
    {
      "type": "microfrontend", // <2>
      "qualifier": {
        "entity": "product",
        "id": "*"
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
      "description": "Shows a product.", // <2>
      "type": "microfrontend", // <3>
      "qualifier": { // <4>
        "entity": "product",
        "id": "*",
      },
      "private": false, // <5>
      "properties": {
        "path": "/products/:id", // <6>
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
    qualifier: {entity: 'product', id: '*'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => { // <2>
    const microfrontendPath = message.capability.properties.path; // <3>

    // Instruct the router to display the microfrontend in an outlet.
    Beans.get(OutletRouter).navigate(microfrontendPath, { // <4>
      outlet: message.body, // <5>
      params: message.intent.qualifier, // <6>
    });
  });
// end::handle-intent[]
}

{
// tag::issue-intent[]
  const intent: Intent = { // <1>
    type: 'microfrontend',
    qualifier: {
      entity: 'product',
      id: '3bca695e-411f-4e0e-908d-9568f1c61556',
    },
  };
  const transferData = PRIMARY_OUTLET; // <2>

  Beans.get(IntentClient).publish(intent, transferData); // <3>
// end::issue-intent[]
}

{
  // tag::issue-intent-with-headers[]
  const headers = new Map().set('outlet', PRIMARY_OUTLET); // <1>
  const intent: Intent = {
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '3bca695e-411f-4e0e-908d-9568f1c61556'},
  };

  Beans.get(IntentClient).publish(intent, null, {headers: headers});
  // end::issue-intent-with-headers[]
}

{
  // tag::handle-intent-with-headers[]
  const selector: IntentSelector = {
    type: 'microfrontend',
    qualifier: {entity: 'product', id: '*'},
  };

  Beans.get(IntentClient).observe$(selector).subscribe((message: IntentMessage) => {
    const outlet = message.headers.get('outlet');  // <1>
    const microfrontendPath = message.capability.properties.path;

    // Instruct the router to display the microfrontend in an outlet.
    Beans.get(OutletRouter).navigate(microfrontendPath, {
      outlet: outlet, // <2>
      params: message.intent.qualifier,
    });
  });
  // end::handle-intent-with-headers[]
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
    userAccessToken$ = new Subject<string>();
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
