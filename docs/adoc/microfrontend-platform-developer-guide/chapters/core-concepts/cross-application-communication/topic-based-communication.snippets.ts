import { MessageClient, MessageHeaders, ResponseStatusCodes, takeUntilUnsubscribe, TopicMessage } from '@scion/microfrontend-platform';
import { Subject } from 'rxjs';
import { Beans } from '@scion/toolkit/bean-manager';
import { map, take } from 'rxjs/operators';

{
  // tag::publish[]
  const topic: string = 'myhome/livingroom/temperature'; // <1>
  const payload: any = '22 °C';

  Beans.get(MessageClient).publish(topic, payload); // <2>
  // end::publish[]
}

{
  // tag::subscribe[]
  const topic: string = 'myhome/livingroom/temperature'; // <1>

  Beans.get(MessageClient).observe$(topic).subscribe((message: TopicMessage) => {
    console.log(message.body); // <2>
  });
  // end::subscribe[]
}

{
  // tag::subscribe-with-wildcard-segments[]
  const topic: string = 'myhome/:room/temperature'; // <1>

  Beans.get(MessageClient).observe$(topic).subscribe((message: TopicMessage) => {
    console.log(message.params); // <2>
  });
  // end::subscribe-with-wildcard-segments[]
}

{
  // tag::publish-retained-message[]
  const topic: string = 'myhome/livingroom/temperature';
  const payload: any = '22 °C';

  Beans.get(MessageClient).publish(topic, payload, {retain: true}); // <1>
  // end::publish-retained-message[]
}

{
  // tag::publish-message-with-headers[]
  const topic: string = 'myhome/livingroom/temperature';
  const payload: any = '22 °C';
  const headers = new Map().set('sensor-type', 'analog'); // <1>

  Beans.get(MessageClient).publish(topic, payload, {headers: headers});
  // end::publish-message-with-headers[]
}

{
  // tag::receive-message-with-headers[]
  const topic: string = 'myhome/livingroom/temperature';

  Beans.get(MessageClient).observe$(topic).subscribe((message: TopicMessage) => {
    console.log(message.headers); // <1>
  });
  // end::receive-message-with-headers[]
}

{
  // tag::request[]
  const topic: string = 'myhome/livingroom/temperature';

  Beans.get(MessageClient).request$(topic).subscribe(reply => {  // <1>
    console.log(reply.body); // <2>
  });
  // end::request[]
}

{
  const sensor$ = new Subject<number>();

  // tag::reply[]
  const topic: string = 'myhome/livingroom/temperature';

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(MessageClient).observe$(topic).subscribe((request: TopicMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>

    sensor$
      .pipe(takeUntilUnsubscribe(replyTo)) // <3>
      .subscribe(temperature => {
        Beans.get(MessageClient).publish(replyTo, `${temperature} °C`); // <2>
      });
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(MessageClient).observe$(topic).subscribe((request: TopicMessage) => {
    const replyTo = request.headers.get(MessageHeaders.ReplyTo); // <1>
    const headers = new Map().set(MessageHeaders.Status, ResponseStatusCodes.TERMINAL); // <4>

    sensor$
      .pipe(take(1))
      .subscribe(temperature => {
        Beans.get(MessageClient).publish(replyTo, `${temperature} °C`, {headers});
      });

  });
  // end::reply[]
}

{
  const sensor$ = new Subject<number>();

  // tag::onMessage[]
  const topic: string = 'myhome/livingroom/temperature';

  // Stream data as long as the requestor is subscribed to receive replies.
  Beans.get(MessageClient).onMessage(topic, message => {
    return sensor$.pipe(map(temperature => `${temperature} °C`));
  });

  // Alternatively, you can complete the requestor's Observable with the first reply.
  Beans.get(MessageClient).onMessage(topic, message => {
    return sensor$.pipe(map(temperature => `${temperature} °C`), take(1));
  });
  // end::onMessage[]
}
