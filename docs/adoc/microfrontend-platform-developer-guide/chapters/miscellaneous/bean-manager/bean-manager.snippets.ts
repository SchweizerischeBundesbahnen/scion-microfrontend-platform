import { Beans, Handler, MessageInterceptor, MicrofrontendPlatform, PlatformConfig, PlatformConfigLoader, PlatformState, PlatformStates, RouterOutletUrlAssigner, TopicMessage } from '@scion/microfrontend-platform';

class YourPlatformConfigLoader implements PlatformConfigLoader {
  public load(): Promise<PlatformConfig> {
    return undefined;
  }
}

class CustomRouterOutletUrlAssigner extends RouterOutletUrlAssigner {
}

class MessageLoggerInterceptor implements MessageInterceptor {
  public intercept(message: TopicMessage, next: Handler<TopicMessage>): void {
  }
}

abstract class Logger {
}

class ConsoleLogger {
}

class LoggingConfig {
}

{
  // tag::overriding-beans[]
  // Override platform beans.
  Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
    Beans.register(RouterOutletUrlAssigner, {useClass: CustomRouterOutletUrlAssigner}); // <1>
  });

  // Start the platform.
  MicrofrontendPlatform.startHost(YourPlatformConfigLoader); // <2>
// end::overriding-beans[]
}

{
  // tag::register-bean:use-class[]
  // Registers a logger under the {Logger} symbol, instructing the bean manager
  // to create an instance of {ConsoleLogger}.
  Beans.register(Logger, {useClass: ConsoleLogger});

  // Registers a logger under the {ConsoleLogger} symbol, instructing the bean manager
  // to create an instance of {ConsoleLogger}.
  Beans.register(ConsoleLogger, {useClass: ConsoleLogger});
  // end::register-bean:use-class[]
}

{
  // tag::register-bean:use-class-shorthand-expression[]
  // Shorthand syntax if the class symbol and lookup symbol are identical.
  Beans.register(ConsoleLogger);
  // end::register-bean:use-class-shorthand-expression[]
}

{
  // tag::register-bean:use-value[]
  const loggingConfig = {level: 'info'};
  // Registers the logging config under the {LoggingConfig} symbol.
  Beans.register(LoggingConfig, {useValue: loggingConfig});
  // end::register-bean:use-value[]
}

{
  // tag::register-bean:use-factory[]
  // Registers a logger under the {Logger} symbol, instructing the bean manager
  // to invoke a factory function to construct the {ConsoleLogger} instance.
  Beans.register(Logger, {useFactory: () => new ConsoleLogger()});
  // end::register-bean:use-factory[]
}

{
  // tag::register-bean:use-existing[]
  // Instructs the bean manager to register an alias for the {ConsoleLogger} bean.
  Beans.register(Logger, {useExisting: ConsoleLogger});
  // end::register-bean:use-existing[]
}

{
  // tag::bean-registration-hook[]
  // Register beans.
  Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
    // Register your beans here...
  });

  // Start the platform.
  MicrofrontendPlatform.startHost(YourPlatformConfigLoader);
  // end::bean-registration-hook[]
}

{
  // tag::register-multi-bean[]
  Beans.register(MessageInterceptor, {useClass: MessageLoggerInterceptor, multi: true});
  // end::register-multi-bean[]
}

{
  // tag::register-eager-bean[]
  Beans.register(ConsoleLogger, {eager: true});
  // end::register-eager-bean[]
}

{
  // tag::lookup-bean:get[]
  const logger = Beans.get(Logger);
  // end::lookup-bean:get[]
}

{
  // tag::lookup-bean:opt[]
  const consoleLogger = Beans.opt(ConsoleLogger);
  // end::lookup-bean:opt[]
}

{
  // tag::lookup-bean:all[]
  const loggers = Beans.all(Logger);
  // end::lookup-bean:all[]
}

{
  // tag::initializer[]
  Beans.registerInitializer((): Promise<void> => {
    // Initializing...
    return Promise.resolve();
  });
  // end::initializer[]
}
