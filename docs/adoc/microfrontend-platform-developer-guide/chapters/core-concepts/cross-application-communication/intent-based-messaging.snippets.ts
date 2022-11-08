import {Intent, IntentClient, IntentMessage, IntentSelector, MessageClient, MessageHeaders, ResponseStatusCodes, takeUntilUnsubscribe} from '@scion/microfrontend-platform';
import {Subject} from 'rxjs';
import {Beans} from '@scion/toolkit/bean-manager';
import {take} from 'rxjs/operators';

`
// tag::intention-declaration[]
{
  "intentions": [
    {
      "type": "temperature", // <1>
      "qualifier": {
        "room": "kitchen"
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
      "description": "Sensor to adjust the room temperature in the kitchen.", // <1>
      "type": "temperature", // <2>
      "qualifier": { // <3>
        "room": "kitchen"
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
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  Beans.get(IntentClient).observe$(selector) // <2>
    .subscribe((message: IntentMessage) => {
      // do something
    });
// end::handle-intent[]
}

{
  // tag::publish-retained-intent[]
  const intent: Intent = {type: 'temperature', qualifier: {room: 'kitchen'}};

  Beans.get(IntentClient).publish(intent, '22°C', {retain: true}); // <1>
  // end::publish-retained-intent[]
}

{
// tag::publish-intent[]
  const intent: Intent = { // <1>
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  Beans.get(IntentClient).publish(intent, '22°C'); // <2>
// end::publish-intent[]
}

{
  // tag::request[]
  const intent: Intent = { // <1>
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  Beans.get(IntentClient).request$(intent).subscribe(reply => { // <1>
    // do something <2>
  });
  // end::request[]
}

{
  const sensor$ = new Subject<number>();

  // tag::reply[]
  const selector: IntentSelector = {
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(IntentClient).observe$(selector).subscribe((request: IntentMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>

    sensor$
      .pipe(takeUntilUnsubscribe(replyTo)) // <3>
      .subscribe(temperature => {
        Beans.get(MessageClient).publish(replyTo, `${temperature}°C`); // <2>
      });
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(IntentClient).observe$(selector).subscribe((request: IntentMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>
    const headers = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL); // <4>

    sensor$
      .pipe(take(1))
      .subscribe(temperature => {
        Beans.get(MessageClient).publish(replyTo, `${temperature}°C`, {headers});
      });

  });
  // end::reply[]
}

{
  const sensor$ = new Subject<number>();

  // tag::onIntent[]
  const selector: IntentSelector = {
    type: 'temperature',
    qualifier: {room: 'kitchen'},
  };

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(IntentClient).onIntent(selector, intentMessage => {
    return sensor$;
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(IntentClient).onIntent(selector, intentMessage => {
    return sensor$.pipe(take(1));
  });
  // end::onIntent[]
}
