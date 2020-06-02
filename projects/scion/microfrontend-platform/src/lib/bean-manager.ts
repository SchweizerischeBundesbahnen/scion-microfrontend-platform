/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Defined } from '@scion/toolkit/util';
import { PlatformState, PlatformStates } from './platform-state';

/** @ignore */
const initializers: InitializerFn[] = [];
/** @ignore */
const beanRegistry = new Map<Type<any> | AbstractType<any>, Set<BeanInfo>>();
/** @ignore */
const beanDecoratorRegistry = new Map<Type<any> | AbstractType<any>, BeanDecorator<any>[]>();

/**
 * The bean manager allows you to get references to platform singleton objects, so-called beans. The application may also register
 * beans in the bean manager, e.g., register framework-specific objects and make them available in platform-managed beans, such as
 * in message interceptors or bean decorators.
 *
 * #### Bean
 * A bean can be any object or even a primitive like a `boolean`. A bean is registered under some symbol in the bean manager. In most
 * cases, the class of the bean is used as the symbol. You can then look up the bean under its registration symbol. A symbol is either
 * a class type or an abstract class type.
 *
 * #### Bean Scope
 * Beans are application-scoped, sometimes also referred to as singleton objects.
 *
 * #### Bean Construction
 * By default, the bean manager constructs beans lazily when looked up for the first time. Subsequent lookups then get the same bean instance.
 * When registering a bean, however, you can instruct the bean manager to construct the bean eagerly at platform startup.
 *
 * #### Registering Beans
 * A bean is registered in the bean manager under some class or abstract class symbol. In most cases, the symbol is also the type of the bean
 * instance but does not have to be. You can then look up the bean from the bean manager using that symbol.
 *
 * When registering a bean, you must tell the bean manager how to construct the bean. Different strategies are supported, as listed below.
 *
 * |Strategy|Description|Example|
 * |-|-|-|
 * |useClass             |if to create an instance of a class                                   |```Beans.register(Logger, {useClass: ConsoleLogger});```|
 * |useClass (shorthand) |Shorthand syntax if class and lookup symbols are identical            |```Beans.register(ConsoleLogger);```|
 * |useValue             |if to use a static value as bean                                      |```Beans.register(LoggingConfig, {useValue: loggingConfig});```|
 * |useFactory           |if to construct the bean with a factory function                      |```Beans.register(Logger, {useFactory: () => new ConsoleLogger()});```|
 * |useExisting          |if to create an alias for another bean registered in the bean manager |```Beans.register(Logger, {useExisting: ConsoleLogger});```|
 *
 * Typically, you register beans in the process of starting the platform. A good place to register beans is the Starting platform lifecycle hook.
 *
 * ```ts
 * Beans.get(PlatformState).whenState(PlatformStates.Starting).then(() => {
 *   // Register your beans here
 * });
 * ```
 *
 * #### Registering Multiple Beans on the same Symbol
 * Multiple beans can be registered under the same symbol. For example, message interceptors are all registered under the same symbol. When looking up beans of a
 * 'multi-bean' symbol, beans are returned in an array in registration order.
 *
 * You can register multiple beans under the same symbol by setting the multi flag to true. If not setting that flag, a previously registered bean would be replaced.
 *
 * ```ts
 * Beans.register(MessageInterceptor, {useClass: MessageLoggerInterceptor, multi: true});
 * ```
 *
 * #### Looking up Beans
 * Beans are looked up using the symbol under which they were registered. The bean manager providers different methods to lookup beans, as listed below.
 *
 * |Method|Description|
 * |-|-|
 * |`Beans.get` |Returns the bean registered under the given symbol. If no or multiple beans are registered under the given symbol, an error is thrown. |
 * |`Beans.opt` |Returns the bean registered under the given symbol, if any, or returns `undefined` otherwise. |
 * |`Beans.all` |Returns all beans registered under the given symbol. Returns an empty array if no bean is found. |
 *
 * #### Overriding Beans
 * Some platform beans can be overridden, e.g., to override built-in platform behavior, or to mock beans in tests. For that, register the overridden bean(s)
 * under its original symbol when starting the platform.
 *
 * #### Decorating Beans
 * The bean manager allows decorating a bean to intercept invocations to its methods and properties. Multiple decorators can decorate a single bean. Decoration
 * takes place in decorator registration order.
 *
 * Decorators are registered in the bean manager using the `Beans.registerDecorator` method, passing the symbol of the bean to be decorated and the decorator.
 * As with the registration of a bean, you must tell the bean manager how to construct the decorator. For more information, see Bean Construction Strategies.
 * Decorators must be registered in the process of starting the platform, i.e., in the Starting platform lifecycle hook.
 *
 * A decorator must implement the decorate method of the BeanDecorator interface and return the proxied bean. To proxy a bean, you can create a JavaScript proxy,
 * or create an anonymous class delegating to the actual bean.
 *
 * #### Initializers
 * Initializers help to run initialization work before eager beans are constructed. Initializers are registered in the bean manager using the `Beans.registerInitializer`
 * method, passing a function or an initializer class. Initializers may run in parallel. For this reason, there must be no dependency in any initializer on the order of
 * the execution of the initializers.
 *
 * An initializer must return a Promise which to resolve when completed initialization. The platform waits with the construction of eager beans until all initializers resolved.
 *
 * @category Platform
 */
export class BeanManager {

  constructor() {
    this.register(PlatformState, {destroyPhase: 'none', eager: true});
  }

  /**
   * Registers a bean under the given symbol.
   *
   * If not providing instructions, the given symbol is used as the constructor function to construct the bean.
   *
   * By default, bean construction is lazy, meaning that the bean is constructed when looked up for the first time.
   * If another bean is registered under the same symbol, that other bean is disposed and replaced with the given bean.
   * To register multiple beans on the same symbol, register it with the flag `multi` set to `true`.
   *
   * @param  symbol - Symbol under which to register the bean.
   * @param  instructions - Control bean construction; see {@link BeanInstanceConstructInstructions} for more detail.
   */
  public register<T>(symbol: Type<T | any> | AbstractType<T | any>, instructions?: BeanInstanceConstructInstructions<T>): void {
    if (!symbol) {
      throw Error('[BeanRegisterError] Missing bean lookup symbol.');
    }

    // Check that only 'multi' or 'non-multi' beans are registered on the same symbol.
    const multi = Defined.orElse(instructions && instructions.multi, false);
    if (multi && beanRegistry.has(symbol) && Array.from(beanRegistry.get(symbol)).some(metaData => !metaData.multi)) {
      throw Error('[BeanRegisterError] Trying to register a bean as \'multi-bean\' on a symbol that has already registered a \'non-multi-bean\'. This is probably not what was intended.');
    }
    if (!multi && beanRegistry.has(symbol) && Array.from(beanRegistry.get(symbol)).some(metaData => metaData.multi)) {
      throw Error('[BeanRegisterError] Trying to register a bean on a symbol that has already registered a \'multi-bean\'. This is probably not what was intended.');
    }

    // Destroy an already registered bean on the same symbol, if any, unless multi is set to `true`.
    if (!multi && beanRegistry.has(symbol)) {
      destroyBean(beanRegistry.get(symbol).values().next().value);
    }

    const beanInfo: BeanInfo<T> = {
      symbol: symbol,
      beanConstructFn: deriveConstructFunction(symbol, instructions),
      eager: Defined.orElse(instructions && (instructions.eager || instructions.useValue !== undefined), false),
      multi: multi,
      destroyPhase: Defined.orElse(instructions && instructions.destroyPhase as any, PlatformStates.Stopping),
      useExisting: instructions && instructions.useExisting,
    };

    if (multi) {
      const beans = beanRegistry.get(symbol) || new Set<BeanInfo>();
      beanRegistry.set(symbol, beans.add(beanInfo));
    }
    else {
      beanRegistry.set(symbol, new Set<BeanInfo>([beanInfo]));
    }

    // Construct the bean if eager unless the platform is not startet yet.
    beanInfo.eager && this.get(PlatformState).whenState(PlatformStates.Started).then(() => {
      // Check if the bean is still registered in the bean manager
      if (beanRegistry.has(beanInfo.symbol) && beanRegistry.get(beanInfo.symbol).has(beanInfo)) {
        getOrConstructBeanInstance(beanInfo);
      }
    });

    // Destroy the bean on platform shutdown.
    if (beanInfo.destroyPhase !== 'none') {
      this.get(PlatformState).whenState(PlatformStates.Starting) // wait until starting the platform
        .then(() => this.get(PlatformState).whenState(beanInfo.destroyPhase as PlatformStates))
        .then(() => destroyBean(beanInfo));
    }
  }

  /**
   * Registers a bean under the given symbol, but only if no other bean is registered under that symbol yet.
   *
   * For detailed information about how to register a bean, see {@link register}.
   *
   * @param symbol - Symbol under which to register the bean.
   * @param instructions - Control bean construction; see {@link BeanInstanceConstructInstructions} for more detail.
   *
   * @internal
   */
  public registerIfAbsent<T>(symbol: Type<T | any> | AbstractType<T | any>, instructions?: BeanInstanceConstructInstructions<T>): void {
    if (!symbol) {
      throw Error('[BeanRegisterError] Missing bean lookup symbol.');
    }

    if (!beanRegistry.has(symbol)) {
      this.register(symbol, instructions);
    }
  }

  /**
   * Registers a decorator to proxy a bean allowing to intercept invocations to its methods and properties.
   *
   * The decorator is invoked when the bean is constructed. Multiple decorators can be registered
   * to decorate a bean. They are invoked in the order as registered.
   *
   * @param symbol - Identifies the bean(s) which to decorate. If multiple beans are registered under that symbol, they all are decorated.
   * @param decorator - Specifies the decorator.
   */
  public registerDecorator<T extends BeanDecorator<any>>(symbol: Type<any> | AbstractType<any>, decorator: { useValue: T } | { useClass?: Type<T> } | { useFactory?: () => T }): void {
    if (!symbol) {
      throw Error('[BeanDecoratorRegisterError] A decorator requires a symbol.');
    }

    const decorators = beanDecoratorRegistry.get(symbol) || [];
    beanDecoratorRegistry.set(symbol, decorators.concat(deriveConstructFunction(undefined, decorator)()));
  }

  /**
   * Registers an initializer which is executed before the construction of beans having an eager construction strategy.
   */
  public registerInitializer(initializer: InitializerFn | { useFunction?: InitializerFn, useClass?: Type<Initializer> }): void {
    if (typeof initializer === 'function') {
      initializers.push(initializer);
    }
    else if (initializer.useFunction) {
      initializers.push(initializer.useFunction);
    }
    else if (initializer.useClass) {
      initializers.push((): Promise<void> => new initializer.useClass().init());
    }
    else {
      throw Error('[NullInitializerError] No initializer specified.');
    }
  }

  /**
   * Returns the bean registered under the given symbol.
   *
   * By default, if no or multiple beans are registered under the given symbol, an error is thrown.
   *
   * @param symbol - Symbol to lookup the bean.
   * @param orElse - Controls what to do if no bean is found under the given symbol. If not set and if no bean is found, the bean manager throws an error.
   * @throws if not finding a bean, or if multiple beans are found under the given symbol.
   */
  public get<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any>, orElse?: { orElseGet?: T, orElseSupply?: () => T }): T {
    const beans = this.all(symbol);
    switch (beans.length) {
      case 0: {
        if (orElse && orElse.orElseGet) {
          return orElse.orElseGet;
        }
        if (orElse && orElse.orElseSupply) {
          return orElse.orElseSupply();
        }
        throw Error(`[NullBeanError] No bean registered under the symbol '${symbol.name}'.`);
      }
      case 1: {
        return beans[0];
      }
      default: {
        throw Error(`[MultiBeanError] Multiple beans registered under the symbol '${symbol.name}'.`);
      }
    }
  }

  /**
   * Returns the bean registered under the given symbol, if any, or returns `undefined` otherwise.
   *
   * @param symbol - Symbol to lookup the bean.
   * @throws if multiple beans are found under the given symbol.
   */
  public opt<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any>): T | undefined {
    return this.get(symbol, {orElseSupply: (): undefined => undefined});
  }

  /**
   * Returns all beans registered under the given symbol. Returns an empty array if no bean is found.
   *
   * @param symbol - Symbol to lookup the beans.
   */
  public all<T>(symbol: Type<T> | AbstractType<T> | Type<any> | AbstractType<any>): T[] {
    const beanInfos = Array.from(beanRegistry.get(symbol) || new Set<BeanInfo>());
    if (!beanInfos || !beanInfos.length) {
      return [];
    }
    if (beanInfos.some(beanInfo => beanInfo.constructing)) {
      throw Error(`[BeanConstructError] Circular bean construction cycle detected [bean={${symbol.name}}].`);
    }

    return beanInfos.map(beanInfo => getOrConstructBeanInstance(beanInfo));
  }

  /**
   * Returns metadata about beans registered under the given symbol.
   *
   * @internal
   */
  public getBeanInfo<T>(symbol: Type<T | any> | AbstractType<T | any>): Set<BeanInfo<T>> {
    return beanRegistry.get(symbol);
  }

  /**
   * @internal
   */
  public runInitializers(): Promise<void> {
    return Promise.all(initializers.map(fn => fn()))
      .then(() => Promise.resolve())
      .catch(error => Promise.reject(`[BeanManagerInitializerError] Initializer rejected with an error: ${error}`));
  }

  /** @internal */
  public destroy(): void {
    beanDecoratorRegistry.clear();
    initializers.length = 0;
  }
}

/**
 * Provides access to the {@link BeanManager} of the platform.
 *
 * @category Platform
 */
export const Beans = new BeanManager();

/** @ignore */
function getOrConstructBeanInstance<T>(beanInfo: BeanInfo): T {
  // Check if the bean is already constructed.
  if (beanInfo.instance) {
    return beanInfo.instance;
  }

  // Construct the bean and decorate it.
  beanInfo.constructing = true;
  try {
    const bean: T = beanInfo.beanConstructFn();
    const decorators = beanDecoratorRegistry.get(beanInfo.symbol) || [];
    return beanInfo.instance = decorators.reduce((decoratedBean, decorator) => decorator.decorate(decoratedBean), bean);
  }
  finally {
    beanInfo.constructing = false;
  }
}

/** @ignore */
function destroyBean(beanInfo: BeanInfo): void {
  // Destroy the bean instance unless it is an alias for another bean, or if the bean does not implement 'preDestroy' lifecycle hook.
  if (!beanInfo.useExisting && beanInfo.instance && typeof (beanInfo.instance as PreDestroy).preDestroy === 'function') {
    beanInfo.instance.preDestroy();
  }

  const symbol = beanInfo.symbol;
  const beans = beanRegistry.get(symbol) || new Set<BeanInfo>();
  if (beans.delete(beanInfo) && beans.size === 0) {
    beanRegistry.delete(symbol);
  }
}

/** @ignore */
function deriveConstructFunction<T>(symbol: Type<T | any> | AbstractType<T | any>, instructions?: InstanceConstructInstructions<T>): () => T {
  if (instructions && instructions.useValue !== undefined) {
    return (): T => instructions.useValue;
  }
  else if (instructions && instructions.useClass) {
    return (): T => new instructions.useClass();
  }
  else if (instructions && instructions.useFactory) {
    return (): T => instructions.useFactory();
  }
  else if (instructions && instructions.useExisting) {
    return (): T => Beans.get(instructions.useExisting);
  }
  else {
    return (): T => new (symbol as Type<T>)();
  }
}

/**
 * Lifecycle hook will be executed before destroying this bean.
 *
 * On platform shutdown, beans are destroyed when the platform enters {@link PlatformStates.Stopping} state.
 *
 * @category Platform
 */
export interface PreDestroy {
  preDestroy(): void;
}

/**
 * Metadata about a bean.
 *
 * @ignore
 */
export interface BeanInfo<T = any> {
  symbol: Type<T | any> | AbstractType<T | any>;
  instance?: T;
  constructing?: boolean;
  beanConstructFn: () => T;
  eager: boolean;
  multi: boolean;
  useExisting: Type<any> | AbstractType<any>;
  destroyPhase?: PlatformStates | 'none';
}

/**
 * Describes how an instance is created.
 *
 * @category Platform
 */
export interface InstanceConstructInstructions<T = any> {
  /**
   * Set if to use a static value as bean.
   */
  useValue?: T;
  /**
   * Set if to create an instance of a class.
   */
  useClass?: Type<T>;
  /**
   * Set if to construct the instance with a factory function.
   */
  useFactory?: () => T;
  /**
   * Set if to create an alias for another bean.
   */
  useExisting?: Type<any> | AbstractType<any>;
}

/**
 * Describes how a bean instance is created.
 *
 * @category Platform
 */
export interface BeanInstanceConstructInstructions<T = any> extends InstanceConstructInstructions {
  /**
   * Set if to construct the bean eagerly. By default, bean construction is lazy when the bean is looked up for the first time.
   */
  eager?: boolean;
  /**
   * Set if to provide multiple beans for a single symbol.
   */
  multi?: boolean;
  /**
   * Set in which phase to destroy the bean on platform shutdown, or set to 'none' to not destroy the bean.
   * If not set, the bean is destroyed in the phase {@link PlatformStates.Stopping}.
   */
  destroyPhase?: PlatformStates | 'none';
}

/**
 * Allows executing some asynchronous work before constructing eager beans.
 *
 * Initializers may run in parallel. For this reason, there must be no dependency in any initializer on the order
 * of execution of the initializers.
 *
 * It is allowed to lookup beans inside an initializer.
 *
 * @see {@link BeanManager.registerInitializer Beans.registerInitializer}
 * @category Platform
 */
export interface Initializer {
  /**
   * Invoked at platform startup to execute some work before constructing eager beans.
   *
   * @return a Promise that resolves when this initializer completes its initialization.
   */
  init(): Promise<void>;
}

/**
 * Allows executing some asynchronous work before constructing eager beans.
 *
 * Initializers may run in parallel. For this reason, there must be no dependency in any initializer on the order
 * of execution of the initializers.
 *
 * It is allowed to lookup beans inside an initializer.
 * The initializer function must return a Promise that resolves when completed its initialization.
 *
 * @see {@link BeanManager.registerInitializer Beans.registerInitializer}
 * @category Platform
 */
export declare type InitializerFn = () => Promise<void>;

/**
 * Allows intercepting bean method or property invocations.
 * When the bean is constructed, it is passed to the decorator in order to be proxied.
 *
 * @see {@link BeanManager.registerDecorator Beans.registerDecorator}
 * @category Platform
 */
export interface BeanDecorator<T> {
  /**
   * Method invoked when the bean is instantiated.
   *
   * @param  bean - The actual bean instance; use it to delegate invoations to the actual bean.
   * @return proxied bean
   */
  decorate(bean: T): T;
}

/**
 * Represents a symbol of an abstract class.
 *
 * @category Platform
 */
export interface AbstractType<T> extends Function {
  prototype: T;
}

/**
 * Represents a symbol of a class.
 *
 * @category Platform
 */
export interface Type<T> extends Function {
  new(...args: any[]): T; // tslint:disable-line:callable-types
}
