import {Handler, IntentInterceptor, IntentMessage, MessageInterceptor, MicrofrontendPlatform, PlatformState, TopicMatcher, TopicMessage} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';

{
  // tag::message-logger-interceptor[]
  /** Message Interceptor */
  class MessageLoggerInterceptor implements MessageInterceptor {

    public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
      console.log(message);

      // Passes the message along the interceptor chain.
      return next.handle(message);
    }
  }

  /** Intent Interceptor */
  class IntentLoggerInterceptor implements IntentInterceptor {

    public intercept(intent: IntentMessage<any>, next: Handler<IntentMessage>): Promise<void> {
      console.log(intent);

      // Passes the intent along the interceptor chain.
      return next.handle(intent);
    }
  }

  // end::message-logger-interceptor[]

  // tag::message-logger-interceptor-registration[]
  MicrofrontendPlatform.whenState(PlatformState.Starting).then(() => {
    Beans.register(MessageInterceptor, {useClass: MessageLoggerInterceptor, multi: true}); // <1>
    Beans.register(IntentInterceptor, {useClass: IntentLoggerInterceptor, multi: true}); // <2>
  });

  // Start the platform.
  MicrofrontendPlatform.startHost(...); // <3>
  // end::message-logger-interceptor-registration[]
}

{
  // tag::topic-matcher[]
  const pattern = 'product/:id';

  // Matches the topic 'product/123' against the pattern 'product/:id'
  const positiveMatch = new TopicMatcher(pattern).match('product/123');
  console.log(positiveMatch.matches); // true
  console.log(positiveMatch.params); // {id => 123}

  // Matches the topic 'person/123' against the pattern 'product/:id'
  const negativeMatch = new TopicMatcher(pattern).match('person/123');
  console.log(negativeMatch.matches); // false
  // end::topic-matcher[]
}

{
  // tag::message-validator[]
  class MessageValidatorInterceptor implements MessageInterceptor {

    private topicMatcher: TopicMatcher;
    private schemaValidator: JsonSchemaValidator;

    constructor(topic: string, jsonSchema: any) {
      this.topicMatcher = new TopicMatcher(topic); // <1>
      this.schemaValidator = new JsonSchemaValidator(jsonSchema); // <2>
    }

    public intercept(message: TopicMessage, next: Handler<TopicMessage>): Promise<void> {
      // Pass messages sent to other topics.
      if (!this.topicMatcher.match(message.topic).matches) {
        return next.handle(message); // <3>
      }

      // Validate the payload of the message.
      if (this.schemaValidator.isValid(message.body)) {
        return next.handle(message); // <4>
      }

      throw Error('Message failed schema validation'); // <5>
    }
  }

  // end::message-validator[]

  // tag::message-validator-registration[]
  // Register interceptor to validate product related messages
  Beans.register(MessageInterceptor, {
    useFactory: (): MessageInterceptor => {
      const productTopic = 'products/:id'; // <1>
      const productJsonSchema = import('./product.schema.json'); // <2>
      return new MessageValidatorInterceptor(productTopic, productJsonSchema); // <3>
    },
    multi: true,
  });

  // end::message-validator-registration[]

  class JsonSchemaValidator {

    constructor(schema: any) {
    }

    public isValid(json: string): boolean {
      return true;
    }
  }
}
