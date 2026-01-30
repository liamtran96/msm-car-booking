# Recipes

## CQRS

### CQRS

The flow of simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Create, Read, Update and Delete) applications can be described as follows:

1. The controllers layer handles HTTP requests and delegates tasks to the services layer.
2. The services layer is where most of the business logic lives.
3. Services use repositories / DAOs to change / persist entities.
4. Entities act as containers for the values, with setters and getters.

While this pattern is usually sufficient for small and medium-sized applications, it may not be the best choice for larger, more complex applications. In such cases, the **CQRS** (Command and Query Responsibility Segregation) model may be more appropriate and scalable (depending on the application's requirements). Benefits of this model include:

- **Separation of concerns**. The model separates the read and write operations into separate models.
- **Scalability**. The read and write operations can be scaled independently.
- **Flexibility**. The model allows for the use of different data stores for read and write operations.
- **Performance**. The model allows for the use of different data stores optimized for read and write operations.

To facilitate that model, Nest provides a lightweight [CQRS module](https://github.com/nestjs/cqrs). This chapter describes how to use it.

#### Installation

First install the required package:

```bash
$ npm install --save @nestjs/cqrs
```

Once the installation is complete, navigate to the root module of your application (usually `AppModule`), and import the `CqrsModule.forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot()],
})
export class AppModule {}
```

This module accepts an optional configuration object. The following options are available:

| Attribute                     | Description                                                                                                                  | Default                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `commandPublisher`            | The publisher responsible for dispatching commands to the system.                                                            | `DefaultCommandPubSub`            |
| `eventPublisher`              | The publisher used to publish events, allowing them to be broadcasted or processed.                                          | `DefaultPubSub`                   |
| `queryPublisher`              | The publisher used for publishing queries, which can trigger data retrieval operations.                                      | `DefaultQueryPubSub`              |
| `unhandledExceptionPublisher` | Publisher responsible for handling unhandled exceptions, ensuring they are tracked and reported.                             | `DefaultUnhandledExceptionPubSub` |
| `eventIdProvider`             | Service that provides unique event IDs by generating or retrieving them from event instances.                                | `DefaultEventIdProvider`          |
| `rethrowUnhandled`            | Determines whether unhandled exceptions should be rethrown after being processed, useful for debugging and error management. | `false`                           |

#### Commands

Commands are used to change the application state. They should be task-based, rather than data centric. When a command is dispatched, it is handled by a corresponding **Command Handler**. The handler is responsible for updating the application state.

```typescript
@@filename(heroes-game.service)
@Injectable()
export class HeroesGameService {
  constructor(private commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
@@switch
@Injectable()
@Dependencies(CommandBus)
export class HeroesGameService {
  constructor(commandBus) {
    this.commandBus = commandBus;
  }

  async killDragon(heroId, killDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
```

In the code snippet above, we instantiate the `KillDragonCommand` class and pass it to the `CommandBus`'s `execute()` method. This is the demonstrated command class:

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand extends Command<{
  actionId: string // This type represents the command execution result
}> {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {
    super();
  }
}
@@switch
export class KillDragonCommand extends Command {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

As you can see, the `KillDragonCommand` class extends the `Command` class. The `Command` class is a simple utility class exported from the `@nestjs/cqrs` package that lets you define the command's return type. In this case, the return type is an object with an `actionId` property. Now, whenever the `KillDragonCommand` command is dispatched, the `CommandBus#execute()` method return-type will be inferred as `Promise<{{ '{' }} actionId: string {{ '}' }}>`. This is useful when you want to return some data from the command handler.

> info **Hint** Inheritance from the `Command` class is optional. It is only necessary if you want to define the return type of the command.

The `CommandBus` represents a **stream** of commands. It is responsible for dispatching commands to the appropriate handlers. The `execute()` method returns a promise, which resolves to the value returned by the handler.

Let's create a handler for the `KillDragonCommand` command.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private repository: HeroesRepository) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
```

This handler retrieves the `Hero` entity from the repository, calls the `killEnemy()` method, and then persists the changes. The `KillDragonHandler` class implements the `ICommandHandler` interface, which requires the implementation of the `execute()` method. The `execute()` method receives the command object as an argument.

Note that `ICommandHandler<KillDragonCommand>` forces you to return a value that matches the command's return type. In this case, the return type is an object with an `actionId` property. This only applies to commands that inherit from the `Command` class. Otherwise, you can return whatever you want.

Lastly, make sure to register the `KillDragonHandler` as a provider in a module:

```typescript
providers: [KillDragonHandler];
```

#### Queries

Queries are used to retrieve data from the application state. They should be data centric, rather than task-based. When a query is dispatched, it is handled by a corresponding **Query Handler**. The handler is responsible for retrieving the data.

The `QueryBus` follows the same pattern as the `CommandBus`. Query handlers should implement the `IQueryHandler` interface and be annotated with the `@QueryHandler()` decorator. See the following example:

```typescript
export class GetHeroQuery extends Query<Hero> {
  constructor(public readonly heroId: string) {}
}
```

Similar to the `Command` class, the `Query` class is a simple utility class exported from the `@nestjs/cqrs` package that lets you define the query's return type. In this case, the return type is a `Hero` object. Now, whenever the `GetHeroQuery` query is dispatched, the `QueryBus#execute()` method return-type will be inferred as `Promise<Hero>`.

To retrieve the hero, we need to create a query handler:

```typescript
@@filename(get-hero.handler)
@QueryHandler(GetHeroQuery)
export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
  constructor(private repository: HeroesRepository) {}

  async execute(query: GetHeroQuery) {
    return this.repository.findOneById(query.heroId);
  }
}
@@switch
@QueryHandler(GetHeroQuery)
@Dependencies(HeroesRepository)
export class GetHeroHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(query) {
    return this.repository.findOneById(query.hero);
  }
}
```

The `GetHeroHandler` class implements the `IQueryHandler` interface, which requires the implementation of the `execute()` method. The `execute()` method receives the query object as an argument, and must return the data that matches the query's return type (in this case, a `Hero` object).

Lastly, make sure to register the `GetHeroHandler` as a provider in a module:

```typescript
providers: [GetHeroHandler];
```

Now, to dispatch the query, use the `QueryBus`:

```typescript
const hero = await this.queryBus.execute(new GetHeroQuery(heroId)); // "hero" will be auto-inferred as "Hero" type
```

#### Events

Events are used to notify other parts of the application about changes in the application state. They are dispatched by **models** or directly using the `EventBus`. When an event is dispatched, it is handled by corresponding **Event Handlers**. Handlers can then, for example, update the read model.

For demonstration purposes, let's create an event class:

```typescript
@@filename(hero-killed-dragon.event)
export class HeroKilledDragonEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

Now while events can be dispatched directly using the `EventBus.publish()` method, we can also dispatch them from the model. Let's update the `Hero` model to dispatch the `HeroKilledDragonEvent` event when the `killEnemy()` method is called.

```typescript
@@filename(hero.model)
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
@@switch
export class Hero extends AggregateRoot {
  constructor(id) {
    super();
    this.id = id;
  }

  killEnemy(enemyId) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

The `apply()` method is used to dispatch events. It accepts an event object as an argument. However, since our model is not aware of the `EventBus`, we need to associate it with the model. We can do that by using the `EventPublisher` class.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private repository: HeroesRepository,
    private publisher: EventPublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository, EventPublisher)
export class KillDragonHandler {
  constructor(repository, publisher) {
    this.repository = repository;
    this.publisher = publisher;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
```

The `EventPublisher#mergeObjectContext` method merges the event publisher into the provided object, which means that the object will now be able to publish events to the events stream.

Notice that in this example we also call the `commit()` method on the model. This method is used to dispatch any outstanding events. To automatically dispatch events, we can set the `autoCommit` property to `true`:

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
```

In case we want to merge the event publisher into a non-existing object, but rather into a class, we can use the `EventPublisher#mergeClassContext` method:

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel is a class
```

Now every instance of the `HeroModel` class will be able to publish events without using `mergeObjectContext()` method.

Additionally, we can emit events manually using `EventBus`:

```typescript
this.eventBus.publish(new HeroKilledDragonEvent());
```

> info **Hint** The `EventBus` is an injectable class.

Each event can have multiple **Event Handlers**.

```typescript
@@filename(hero-killed-dragon.handler)
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroesRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // Business logic
  }
}
```

> info **Hint** Be aware that when you start using event handlers you get out of the traditional HTTP web context.
>
> - Errors in `CommandHandlers` can still be caught by built-in [Exception filters](/exception-filters).
> - Errors in `EventHandlers` can't be caught by Exception filters: you will have to handle them manually. Either by a simple `try/catch`, using [Sagas](/recipes/cqrs#sagas) by triggering a compensating event, or whatever other solution you choose.
> - HTTP Responses in `CommandHandlers` can still be sent back to the client.
> - HTTP Responses in `EventHandlers` cannot. If you want to send information to the client you could use [WebSocket](/websockets/gateways), [SSE](/techniques/server-sent-events), or whatever other solution you choose.

As with commands and queries, make sure to register the `HeroKilledDragonHandler` as a provider in a module:

```typescript
providers: [HeroKilledDragonHandler];
```

#### Sagas

Saga is a long-running process that listens to events and may trigger new commands. It is usually used to manage complex workflows in the application. For example, when a user signs up, a saga may listen to the `UserRegisteredEvent` and send a welcome email to the user.

Sagas are an extremely powerful feature. A single saga may listen for 1..\* events. Using the [RxJS](https://github.com/ReactiveX/rxjs) library, we can filter, map, fork, and merge event streams to create sophisticated workflows. Each saga returns an Observable which produces a command instance. This command is then dispatched **asynchronously** by the `CommandBus`.

Let's create a saga that listens to the `HeroKilledDragonEvent` and dispatches the `DropAncientItemCommand` command.

```typescript
@@filename(heroes-game.saga)
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
@@switch
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$) => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
```

> info **Hint** The `ofType` operator and the `@Saga()` decorator are exported from the `@nestjs/cqrs` package.

The `@Saga()` decorator marks the method as a saga. The `events$` argument is an Observable stream of all events. The `ofType` operator filters the stream by the specified event type. The `map` operator maps the event to a new command instance.

In this example, we map the `HeroKilledDragonEvent` to the `DropAncientItemCommand` command. The `DropAncientItemCommand` command is then auto-dispatched by the `CommandBus`.

As with query, command, and event handlers, make sure to register the `HeroesGameSagas` as a provider in a module:

```typescript
providers: [HeroesGameSagas];
```

#### Unhandled exceptions

Event handlers are executed asynchronously, so they must always handle exceptions properly to prevent the application from entering an inconsistent state. If an exception is not handled, the `EventBus` will create an `UnhandledExceptionInfo` object and push it to the `UnhandledExceptionBus` stream. This stream is an `Observable` that can be used to process unhandled exceptions.

```typescript
private destroy$ = new Subject<void>();

constructor(private unhandledExceptionsBus: UnhandledExceptionBus) {
  this.unhandledExceptionsBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((exceptionInfo) => {
      // Handle exception here
      // e.g. send it to external service, terminate process, or publish a new event
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

To filter out exceptions, we can use the `ofType` operator, as follows:

```typescript
this.unhandledExceptionsBus
  .pipe(
    takeUntil(this.destroy$),
    UnhandledExceptionBus.ofType(TransactionNotAllowedException),
  )
  .subscribe((exceptionInfo) => {
    // Handle exception here
  });
```

Where `TransactionNotAllowedException` is the exception we want to filter out.

The `UnhandledExceptionInfo` object contains the following properties:

```typescript
export interface UnhandledExceptionInfo<
  Cause = IEvent | ICommand,
  Exception = any,
> {
  /**
   * The exception that was thrown.
   */
  exception: Exception;
  /**
   * The cause of the exception (event or command reference).
   */
  cause: Cause;
}
```

#### Subscribing to all events

`CommandBus`, `QueryBus` and `EventBus` are all **Observables**. This means that we can subscribe to the entire stream and, for example, process all events. For example, we can log all events to the console, or save them to the event store.

```typescript
private destroy$ = new Subject<void>();

constructor(private eventBus: EventBus) {
  this.eventBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      // Save events to database
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### Request-scoping

For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is **safe** for our applications.

However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes [here](/fundamentals/injection-scopes).

Using request-scoped providers alongside CQRS can be complex because the `CommandBus`, `QueryBus`, and `EventBus` are singletons. Thankfully, the `@nestjs/cqrs` package simplifies this by automatically creating a new instance of request-scoped handlers for each processed command, query, or event.

To make a handler request-scoped, you can either:

1. Depend on a request-scoped provider.
2. Explicitly set its scope to `REQUEST` using the `@CommandHandler`, `@QueryHandler`, or `@EventsHandler` decorator, as shown:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  // Implementation here
}
```

To inject the request payload into any request-scoped provider, you use the `@Inject(REQUEST)` decorator. However, the nature of the request payload in CQRS depends on the context—it could be an HTTP request, a scheduled job, or any other operation that triggers a command.

The payload must be an instance of a class extending `AsyncContext` (provided by `@nestjs/cqrs`), which acts as the request context and holds data accessible throughout the request lifecycle.

```typescript
import { AsyncContext } from '@nestjs/cqrs';

export class MyRequest extends AsyncContext {
  constructor(public readonly user: User) {
    super();
  }
}
```

When executing a command, pass the custom request context as the second argument to the `CommandBus#execute` method:

```typescript
const myRequest = new MyRequest(user);
await this.commandBus.execute(
  new KillDragonCommand(heroId, killDragonDto.dragonId),
  myRequest,
);
```

This makes the `MyRequest` instance available as the `REQUEST` provider to the corresponding handler:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

You can follow the same approach for queries:

```typescript
const myRequest = new MyRequest(user);
const hero = await this.queryBus.execute(new GetHeroQuery(heroId), myRequest);
```

And in the query handler:

```typescript
@QueryHandler(GetHeroQuery, {
  scope: Scope.REQUEST,
})
export class GetHeroHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

For events, while you can pass the request provider to `EventBus#publish`, this is less common. Instead, use `EventPublisher` to merge the request provider into a model:

```typescript
const hero = this.publisher.mergeObjectContext(
  await this.repository.findOneById(+heroId),
  this.request, // Inject the request context here
);
```

Request-scoped event handlers subscribing to these events will have access to the request provider.

Sagas are always singleton instances because they manage long-running processes. However, you can retrieve the request provider from event objects:

```typescript
@Saga()
dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
  return events$.pipe(
    ofType(HeroKilledDragonEvent),
    map((event) => {
      const request = AsyncContext.of(event); // Retrieve the request context
      const command = new DropAncientItemCommand(event.heroId, fakeItemID);

      AsyncContext.merge(request, command); // Merge the request context into the command
      return command;
    }),
  );
}
```

Alternatively, use the `request.attachTo(command)` method to tie the request context to the command.

#### Example

A working example is available [here](https://github.com/kamilmysliwiec/nest-cqrs-example).


---

## Documentation

### Documentation

**Compodoc** is a documentation tool for Angular applications. Since Nest and Angular share similar project and code structures, **Compodoc** works with Nest applications as well.

#### Setup

Setting up Compodoc inside an existing Nest project is very simple. Start by adding the dev-dependency with the following command in your OS terminal:

```bash
$ npm i -D @compodoc/compodoc
```

#### Generation

Generate project documentation using the following command (npm 6 is required for `npx` support). See [the official documentation](https://compodoc.app/guides/usage.html) for more options.

```bash
$ npx @compodoc/compodoc -p tsconfig.json -s
```

Open your browser and navigate to [http://localhost:8080](http://localhost:8080). You should see an initial Nest CLI project:

<figure><img src="/assets/documentation-compodoc-1.jpg" /></figure>
<figure><img src="/assets/documentation-compodoc-2.jpg" /></figure>

#### Contribute

You can participate and contribute to the Compodoc project [here](https://github.com/compodoc/compodoc).


---

## Healthchecks (Terminus)

### Healthchecks (Terminus)

Terminus integration provides you with **readiness/liveness** health checks. Healthchecks are crucial when it comes to complex
backend setups. In a nutshell, a health check in the realm of web development usually consists of a special address, for example, `https://my-website.com/health/readiness`.
A service or a component of your infrastructure (e.g., [Kubernetes](https://kubernetes.io/) checks this address continuously). Depending on the HTTP status code returned from a `GET` request to this address the service will take action when it receives an "unhealthy" response.
Since the definition of "healthy" or "unhealthy" varies with the type of service you provide, the **Terminus** integration supports you with a
set of **health indicators**.

As an example, if your web server uses MongoDB to store its data, it would be vital information whether MongoDB is still up and running.
In that case, you can make use of the `MongooseHealthIndicator`. If configured correctly - more on that later - your health check address will return
a healthy or unhealthy HTTP status code, depending on whether MongoDB is running.

#### Getting started

To get started with `@nestjs/terminus` we need to install the required dependency.

```bash
$ npm install --save @nestjs/terminus
```

#### Setting up a Healthcheck

A health check represents a summary of **health indicators**. A health indicator executes a check of a service, whether it is in a healthy or unhealthy state. A health check is positive if all the assigned health indicators are up and running. Because a lot of applications will need similar health indicators, [`@nestjs/terminus`](https://github.com/nestjs/terminus) provides a set of predefined indicators, such as:

- `HttpHealthIndicator`
- `TypeOrmHealthIndicator`
- `MongooseHealthIndicator`
- `SequelizeHealthIndicator`
- `MikroOrmHealthIndicator`
- `PrismaHealthIndicator`
- `MicroserviceHealthIndicator`
- `GRPCHealthIndicator`
- `MemoryHealthIndicator`
- `DiskHealthIndicator`

To get started with our first health check, let's create the `HealthModule` and import the `TerminusModule` into it in its imports array.

> info **Hint** To create the module using the [Nest CLI](cli/overview), simply execute the `$ nest g module health` command.

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class HealthModule {}
```

Our healthcheck(s) can be executed using a [controller](/controllers), which can be easily set up using the [Nest CLI](cli/overview).

```bash
$ nest g controller health
```

> info **Info** It is highly recommended to enable shutdown hooks in your application. Terminus integration makes use of this lifecycle event if enabled. Read more about shutdown hooks [here](fundamentals/lifecycle-events#application-shutdown).

#### HTTP Healthcheck

Once we have installed `@nestjs/terminus`, imported our `TerminusModule` and created a new controller, we are ready to create a health check.

The `HTTPHealthIndicator` requires the `@nestjs/axios` package so make sure to have it installed:

```bash
$ npm i --save @nestjs/axios axios
```

Now we can setup our `HealthController`:

```typescript
@@filename(health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
@@switch
import { Controller, Dependencies, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
@Dependencies(HealthCheckService, HttpHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private http,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ])
  }
}
```

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
@@switch
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

Our health check will now send a _GET_-request to the `https://docs.nestjs.com` address. If
we get a healthy response from that address, our route at `http://localhost:3000/health` will return
the following object with a 200 status code.

```json
{
  "status": "ok",
  "info": {
    "nestjs-docs": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "nestjs-docs": {
      "status": "up"
    }
  }
}
```

The interface of this response object can be accessed from the `@nestjs/terminus` package with the `HealthCheckResult` interface.

|           |                                                                                                                                                                                             |                                      |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `status`  | If any health indicator failed the status will be `'error'`. If the NestJS app is shutting down but still accepting HTTP requests, the health check will have the `'shutting_down'` status. | `'error' \| 'ok' \| 'shutting_down'` |
| `info`    | Object containing information of each health indicator which is of status `'up'`, or in other words "healthy".                                                                              | `object`                             |
| `error`   | Object containing information of each health indicator which is of status `'down'`, or in other words "unhealthy".                                                                          | `object`                             |
| `details` | Object containing all information of each health indicator                                                                                                                                  | `object`                             |

##### Check for specific HTTP response codes

In certain cases, you might want to check for specific criteria and validate the response. As an example, let's assume
`https://my-external-service.com` returns a response code `204`. With `HttpHealthIndicator.responseCheck` you can
check for that response code specifically and determine all other codes as unhealthy.

In case any other response code other than `204` gets returned, the following example would be unhealthy. The third parameter
requires you to provide a function (sync or async) which returns a boolean whether the response is considered
healthy (`true`) or unhealthy (`false`).


```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.http.responseCheck(
        'my-external-service',
        'https://my-external-service.com',
        (res) => res.status === 204,
      ),
  ]);
}
```


#### TypeOrm health indicator

Terminus offers the capability to add database checks to your health check. In order to get started with this health indicator, you
should check out the [Database chapter](/techniques/sql) and make sure your database connection within your application is established.

> info **Hint** Behind the scenes the `TypeOrmHealthIndicator` simply executes a `SELECT 1`-SQL command which is often used to verify whether the database still alive. In case you are using an Oracle database it uses `SELECT 1 FROM DUAL`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, TypeOrmHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private db,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ])
  }
}
```

If your database is reachable, you should now see the following JSON-result when requesting `http://localhost:3000/health` with a `GET` request:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

In case your app uses [multiple databases](techniques/database#multiple-databases), you need to inject each
connection into your `HealthController`. Then, you can simply pass the connection reference to the `TypeOrmHealthIndicator`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectConnection('albumsConnection')
    private albumsConnection: Connection,
    @InjectConnection()
    private defaultConnection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }),
    ]);
  }
}
```


#### Disk health indicator

With the `DiskHealthIndicator` we can check how much storage is in use. To get started, make sure to inject the `DiskHealthIndicator`
into your `HealthController`. The following example checks the storage used of the path `/` (or on Windows you can use `C:\\`).
If that exceeds more than 50% of the total storage space it would response with an unhealthy Health Check.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, DiskHealthIndicator)
export class HealthController {
  constructor(health, disk) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ])
  }
}
```

With the `DiskHealthIndicator.checkStorage` function you also have the possibility to check for a fixed amount of space.
The following example would be unhealthy in case the path `/my-app/` would exceed 250GB.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', {  path: '/', threshold: 250 * 1024 * 1024 * 1024, })
  ]);
}
```

#### Memory health indicator

To make sure your process does not exceed a certain memory limit the `MemoryHealthIndicator` can be used. 
The following example can be used to check the heap of your process.

> info **Hint** Heap is the portion of memory where dynamically allocated memory resides (i.e. memory allocated via malloc). Memory allocated from the heap will remain allocated until one of the following occurs:
> - The memory is _free_'d
> - The program terminates

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, MemoryHealthIndicator)
export class HealthController {
  constructor(health, memory) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ])
  }
}
```

It is also possible to verify the memory RSS of your process with `MemoryHealthIndicator.checkRSS`. This example
would return an unhealthy response code in case your process does have more than 150MB allocated.

> info **Hint** RSS is the Resident Set Size and is used to show how much memory is allocated to that process and is in RAM.
> It does not include memory that is swapped out. It does include memory from shared libraries as long as the pages from
> those libraries are actually in memory. It does include all stack and heap memory.


```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
  ]);
}
```


#### Custom health indicator

In some cases, the predefined health indicators provided by `@nestjs/terminus` do not cover all of your health check requirements. In that case, you can set up a custom health indicator according to your needs.

Let's get started by creating a service that will represent our custom indicator. To get a basic understanding of how an indicator is structured, we will create an example `DogHealthIndicator`. This service should have the state `'up'` if every `Dog` object has the type `'goodboy'`. If that condition is not satisfied then it should throw an error.

```typescript
@@filename(dog.health)
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  private dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
@Dependencies(HealthIndicatorService)
export class DogHealthIndicator {
  constructor(healthIndicatorService) {
    this.healthIndicatorService = healthIndicatorService;
  }

  private dogs = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
```

The next thing we need to do is register the health indicator as a provider.

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DogHealthIndicator } from './dog.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [DogHealthIndicator]
})
export class HealthModule { }
```

> info **Hint** In a real-world application the `DogHealthIndicator` should be provided in a separate module, for example, `DogModule`, which then will be imported by the `HealthModule`.

The last required step is to add the now available health indicator in the required health check endpoint. For that, we go back to our `HealthController` and add it to our `check` function.

```typescript
@@filename(health.controller)
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Dependencies, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dogHealthIndicator: DogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
@@switch
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
@Dependencies(HealthCheckService, DogHealthIndicator)
export class HealthController {
  constructor(
    health,
    dogHealthIndicator
  ) {
    this.health = health;
    this.dogHealthIndicator = dogHealthIndicator;
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
```

#### Logging

Terminus only logs error messages, for instance when a Healthcheck has failed. With the `TerminusModule.forRoot()` method you have more control over how errors are being logged
as well as completely take over the logging itself.

In this section, we are going to walk you through how you create a custom logger `TerminusLogger`. This logger extends the built-in logger.
Therefore you can pick and choose which part of the logger you would like to overwrite

> info **Info** If you want to learn more about custom loggers in NestJS, [read more here](/techniques/logger#injecting-a-custom-logger).


```typescript
@@filename(terminus-logger.service)
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TerminusLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: unknown,
    ...rest: unknown[]
  ): void {
    // Overwrite here how error messages should be logged
  }
}
```

Once you have created your custom logger, all you need to do is simply pass it into the `TerminusModule.forRoot()` as such.

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: TerminusLogger,
  }),
],
})
export class HealthModule {}
```


To completely suppress any log messages coming from Terminus, including error messages, configure Terminus as such.

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: false,
  }),
],
})
export class HealthModule {}
```



Terminus allows you to configure how Healthcheck errors should be displayed in your logs.

| Error Log Style          | Description                                                                                                                        | Example                                                              |
|:------------------|:-----------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| `json`  (default) | Prints a summary of the health check result in case of an error as JSON object                                                     | <figure><img src="/assets/Terminus_Error_Log_Json.png" /></figure>   |
| `pretty`          | Prints a summary of the health check result in case of an error within formatted boxes and highlights successful/erroneous results | <figure><img src="/assets/Terminus_Error_Log_Pretty.png" /></figure> |

You can change the log style using the `errorLogStyle` configuration option as in the following snippet.

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ]
})
export class HealthModule {}
```

#### Graceful shutdown timeout

If your application requires postponing its shutdown process, Terminus can handle it for you.
This setting can prove particularly beneficial when working with an orchestrator such as Kubernetes.
By setting a delay slightly longer than the readiness check interval, you can achieve zero downtime when shutting down containers.

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ]
})
export class HealthModule {}
```

#### More examples

More working examples are available [here](https://github.com/nestjs/terminus/tree/master/sample).


---

## Hot Reload

### Hot Reload

The highest impact on your application's bootstrapping process is **TypeScript compilation**. Fortunately, with [webpack](https://github.com/webpack/webpack) HMR (Hot-Module Replacement), we don't need to recompile the entire project each time a change occurs. This significantly decreases the amount of time necessary to instantiate your application, and makes iterative development a lot easier.

> warning **Warning** Note that `webpack` won't automatically copy your assets (e.g. `graphql` files) to the `dist` folder. Similarly, `webpack` is not compatible with glob static paths (e.g., the `entities` property in `TypeOrmModule`).

### With CLI

If you are using the [Nest CLI](https://docs.nestjs.com/cli/overview), the configuration process is pretty straightforward. The CLI wraps `webpack`, which allows use of the `HotModuleReplacementPlugin`.

#### Installation

First install the required packages:

```bash
$ npm i --save-dev webpack-node-externals run-script-webpack-plugin webpack
```

> info **Hint** If you use **Yarn Berry** (not classic Yarn), install the `webpack-pnp-externals` package instead of the `webpack-node-externals`.

#### Configuration

Once the installation is complete, create a `webpack-hmr.config.js` file in the root directory of your application.

```typescript
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
    ],
  };
};
```

> info **Hint** With **Yarn Berry** (not classic Yarn), instead of using the `nodeExternals` in the `externals` configuration property, use the `WebpackPnpExternals` from `webpack-pnp-externals` package: `WebpackPnpExternals({{ '{' }} exclude: ['webpack/hot/poll?100'] {{ '}' }})`.

This function takes the original object containing the default webpack configuration as a first argument, and the reference to the underlying `webpack` package used by the Nest CLI as the second one. Also, it returns a modified webpack configuration with the `HotModuleReplacementPlugin`, `WatchIgnorePlugin`, and `RunScriptWebpackPlugin` plugins.

#### Hot-Module Replacement

To enable **HMR**, open the application entry file (`main.ts`) and add the following webpack-related instructions:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add a script to your `package.json` file.

```json
"start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js --watch"
```

Now simply open your command line and run the following command:

```bash
$ npm run start:dev
```

### Without CLI

If you are not using the [Nest CLI](https://docs.nestjs.com/cli/overview), the configuration will be slightly more complex (will require more manual steps).

#### Installation

First install the required packages:

```bash
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader run-script-webpack-plugin
```

> info **Hint** If you use **Yarn Berry** (not classic Yarn), install the `webpack-pnp-externals` package instead of the `webpack-node-externals`.

#### Configuration

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application.

```typescript
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  target: 'node',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin(), new RunScriptWebpackPlugin({ name: 'server.js', autoRestart: false })],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
```

> info **Hint** With **Yarn Berry** (not classic Yarn), instead of using the `nodeExternals` in the `externals` configuration property, use the `WebpackPnpExternals` from `webpack-pnp-externals` package: `WebpackPnpExternals({{ '{' }} exclude: ['webpack/hot/poll?100'] {{ '}' }})`.

This configuration tells webpack a few essential things about your application: location of the entry file, which directory should be used to hold **compiled** files, and what kind of loader we want to use to compile source files. Generally, you should be able to use this file as-is, even if you don't fully understand all of the options.

#### Hot-Module Replacement

To enable **HMR**, open the application entry file (`main.ts`) and add the following webpack-related instructions:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add a script to your `package.json` file.

```json
"start:dev": "webpack --config webpack.config.js --watch"
```

Now simply open your command line and run the following command:

```bash
$ npm run start:dev
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/08-webpack).


---

## MikroORM

### MikroORM

This recipe is here to help users get started with MikroORM in Nest. MikroORM is the TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. It is a great alternative to TypeORM and migration from TypeORM should be fairly easy. The complete documentation on MikroORM can be found [here](https://mikro-orm.io/docs).

> info **info** `@mikro-orm/nestjs` is a third party package and is not managed by the NestJS core team. Please report any issues found with the library in the [appropriate repository](https://github.com/mikro-orm/nestjs).

#### Installation

Easiest way to integrate MikroORM to Nest is via [`@mikro-orm/nestjs` module](https://github.com/mikro-orm/nestjs).
Simply install it next to Nest, MikroORM and underlying driver:

```bash
$ npm i @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite
```

MikroORM also supports `postgres`, `sqlite`, and `mongo`. See the [official docs](https://mikro-orm.io/docs/usage-with-sql/) for all drivers.

Once the installation process is completed, we can import the `MikroOrmModule` into the root `AppModule`.

```typescript
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      driver: SqliteDriver,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `init()` from the MikroORM package. Check [this page](https://mikro-orm.io/docs/configuration) for the complete configuration documentation.

Alternatively we can [configure the CLI](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool) by creating a configuration file `mikro-orm.config.ts` and then call the `forRoot()` without any arguments.

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot(),
  ],
  ...
})
export class AppModule {}
```

But this won't work when you use a build tools that use tree shaking, for that it is better to provide the config explicitly:

```typescript
import config from './mikro-orm.config'; // your ORM config

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
  ],
  ...
})
export class AppModule {}
```

Afterward, the `EntityManager` will be available to inject across the entire project (without importing any module elsewhere).

```ts
// Import everything from your driver package or `@mikro-orm/knex`
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class MyService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
```

> info **info** Notice that the `EntityManager` is imported from the `@mikro-orm/driver` package, where driver is `mysql`, `sqlite`, `postgres` or what driver you are using. In case you have `@mikro-orm/knex` installed as a dependency, you can also import the `EntityManager` from there.

#### Repositories

MikroORM supports the repository design pattern. For every entity, we can create a repository. Read the complete documentation on repositories [here](https://mikro-orm.io/docs/repositories). To define which repositories should be registered in the current scope you can use the `forFeature()` method. For example, in this way:

> info **info** You should **not** register your base entities via `forFeature()`, as there are no
> repositories for those. On the other hand, base entities need to be part of the list in `forRoot()` (or in the ORM config in general).

```typescript
// photo.module.ts
@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

and import it into the root `AppModule`:

```typescript
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

In this way we can inject the `PhotoRepository` to the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
  ) {}
}
```

#### Using custom repositories

When using custom repositories, we no longer need the `@InjectRepository()`
decorator, as Nest DI resolved based on the class references.

```ts
// `**./author.entity.ts**`
@Entity({ repository: () => AuthorRepository })
export class Author {
  // to allow inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;
}

// `**./author.repository.ts**`
export class AuthorRepository extends EntityRepository<Author> {
  // your custom methods...
}
```

As the custom repository name is the same as what `getRepositoryToken()` would
return, we do not need the `@InjectRepository()` decorator anymore:

```ts
@Injectable()
export class MyService {
  constructor(private readonly repo: AuthorRepository) {}
}
```

#### Load entities automatically

Manually adding entities to the entities array of the connection options can be
tedious. In addition, referencing entities from the root module breaks application
domain boundaries and causes leaking implementation details to other parts of the
application. To solve this issue, static glob paths can be used.

Note, however, that glob paths are not supported by webpack, so if you are building
your application within a monorepo, you won't be able to use them. To address this
issue, an alternative solution is provided. To automatically load entities, set the
`autoLoadEntities` property of the configuration object (passed into the `forRoot()`
method) to `true`, as shown below:

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

With that option specified, every entity registered through the `forFeature()`
method will be automatically added to the entities array of the configuration
object.

> info **info** Note that entities that aren't registered through the `forFeature()` method, but
> are only referenced from the entity (via a relationship), won't be included by
> way of the `autoLoadEntities` setting.

> info **info** Using `autoLoadEntities` also has no effect on the MikroORM CLI - for that we
> still need CLI config with the full list of entities. On the other hand, we can
> use globs there, as the CLI won't go thru webpack.

#### Serialization

> warning **Note** MikroORM wraps every single entity relation in a `Reference<T>` or a `Collection<T>` object, in order to provide better type-safety. This will make [Nest's built-in serializer](/techniques/serialization) blind to any wrapped relations. In other words, if you return MikroORM entities from your HTTP or WebSocket handlers, all of their relations will NOT be serialized.

Luckily, MikroORM provides a [serialization API](https://mikro-orm.io/docs/serializing) which can be used in lieu of `ClassSerializerInterceptor`.

```typescript
@Entity()
export class Book {
  @Property({ hidden: true }) // Equivalent of class-transformer's `@Exclude`
  hiddenField = Date.now();

  @Property({ persist: false }) // Similar to class-transformer's `@Expose()`. Will only exist in memory, and will be serialized.
  count?: number;

  @ManyToOne({
    serializer: (value) => value.name,
    serializedName: 'authorName',
  }) // Equivalent of class-transformer's `@Transform()`
  author: Author;
}
```

#### Request scoped handlers in queues

As mentioned in the [docs](https://mikro-orm.io/docs/identity-map), we need a clean state for each request. That is handled automatically thanks to the `RequestContext` helper registered via middleware.

But middlewares are executed only for regular HTTP request handles, what if we need
a request scoped method outside of that? One example of that is queue handlers or
scheduled tasks.

We can use the `@CreateRequestContext()` decorator. It requires you to first inject the
`MikroORM` instance to current context, it will be then used to create the context
for you. Under the hood, the decorator will register new request context for your
method and execute it inside the context.

```ts
@Injectable()
export class MyService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }
}
```

> warning **Note** As the name suggests, this decorator always creates new context, as opposed to its alternative `@EnsureRequestContext` that only creates it if it's already not inside another one.

#### Testing

The `@mikro-orm/nestjs` package exposes `getRepositoryToken()` function that returns prepared token based on a given entity to allow mocking the repository.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      // or when you have a custom repository: `provide: PhotoRepository`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```

#### Example

A real world example of NestJS with MikroORM can be found [here](https://github.com/mikro-orm/nestjs-realworld-example-app)


---

## Nest Commander

### Nest Commander

Expanding on the [standalone application](/standalone-applications) docs there's also the [nest-commander](https://jmcdo29.github.io/nest-commander) package for writing command line applications in a structure similar to your typical Nest application.

> info **info** `nest-commander` is a third party package and is not managed by the entirety of the NestJS core team. Please, report any issues found with the library in the [appropriate repository](https://github.com/jmcdo29/nest-commander/issues/new/choose)

#### Installation

Just like any other package, you've got to install it before you can use it.

```bash
$ npm i nest-commander
```

#### A Command file

`nest-commander` makes it easy to write new command-line applications with [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) via the `@Command()` decorator for classes and the `@Option()` decorator for methods of that class. Every command file should implement the `CommandRunner` abstract class and should be decorated with a `@Command()` decorator.

Every command is seen as an `@Injectable()` by Nest, so your normal Dependency Injection still works as you would expect it to. The only thing to take note of is the abstract class `CommandRunner`, which should be implemented by each command. The `CommandRunner` abstract class ensures that all commands have a `run` method that returns a `Promise<void>` and takes in the parameters `string[], Record<string, any>`. The `run` command is where you can kick all of your logic off from, it will take in whatever parameters did not match option flags and pass them in as an array, just in case you are really meaning to work with multiple parameters. As for the options, the `Record<string, any>`, the names of these properties match the `name` property given to the `@Option()` decorators, while their value matches the return of the option handler. If you'd like better type safety, you are welcome to create an interface for your options as well.

#### Running the Command

Similar to how in a NestJS application we can use the `NestFactory` to create a server for us, and run it using `listen`, the `nest-commander` package exposes a simple to use API to run your server. Import the `CommandFactory` and use the `static` method `run` and pass in the root module of your application. This would probably look like below

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

By default, Nest's logger is disabled when using the `CommandFactory`. It's possible to provide it though, as the second argument to the `run` function. You can either provide a custom NestJS logger, or an array of log levels you want to keep - it might be useful to at least provide `['error']` here, if you only want to print out Nest's error logs.

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { LogService } './log.service';

async function bootstrap() {
  await CommandFactory.run(AppModule, new LogService());

  // or, if you only want to print Nest's warnings and errors
  await CommandFactory.run(AppModule, ['warn', 'error']);
}

bootstrap();
```

And that's it. Under the hood, `CommandFactory` will worry about calling `NestFactory` for you and calling `app.close()` when necessary, so you shouldn't need to worry about memory leaks there. If you need to add in some error handling, there's always `try/catch` wrapping the `run` command, or you can chain on some `.catch()` method to the `bootstrap()` call.

#### Testing

So what's the use of writing a super awesome command line script if you can't test it super easily, right? Fortunately, `nest-commander` has some utilities you can make use of that fits in perfectly with the NestJS ecosystem, it'll feel right at home to any Nestlings out there. Instead of using the `CommandFactory` for building the command in test mode, you can use `CommandTestFactory` and pass in your metadata, very similarly to how `Test.createTestingModule` from `@nestjs/testing` works. In fact, it uses this package under the hood. You're also still able to chain on the `overrideProvider` methods before calling `compile()` so you can swap out DI pieces right in the test.

#### Putting it all together

The following class would equate to having a CLI command that can take in the subcommand `basic` or be called directly, with `-n`, `-s`, and `-b` (along with their long flags) all being supported and with custom parsers for each option. The `--help` flag is also supported, as is customary with commander.

```ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { LogService } from './log.service';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'basic', description: 'A parameter parse' })
export class BasicCommand extends CommandRunner {
  constructor(private readonly logService: LogService) {
    super()
  }

  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    if (options?.boolean !== undefined && options?.boolean !== null) {
      this.runWithBoolean(passedParam, options.boolean);
    } else if (options?.number) {
      this.runWithNumber(passedParam, options.number);
    } else if (options?.string) {
      this.runWithString(passedParam, options.string);
    } else {
      this.runWithNone(passedParam);
    }
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }

  @Option({
    flags: '-s, --string [string]',
    description: 'A string return',
  })
  parseString(val: string): string {
    return val;
  }

  @Option({
    flags: '-b, --boolean [boolean]',
    description: 'A boolean parser',
  })
  parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  runWithString(param: string[], option: string): void {
    this.logService.log({ param, string: option });
  }

  runWithNumber(param: string[], option: number): void {
    this.logService.log({ param, number: option });
  }

  runWithBoolean(param: string[], option: boolean): void {
    this.logService.log({ param, boolean: option });
  }

  runWithNone(param: string[]): void {
    this.logService.log({ param });
  }
}
```

Make sure the command class is added to a module

```ts
@Module({
  providers: [LogService, BasicCommand],
})
export class AppModule {}
```

And now to be able to run the CLI in your main.ts you can do the following

```ts
async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

And just like that, you've got a command line application.

#### More Information

Visit the [nest-commander docs site](https://jmcdo29.github.io/nest-commander) for more information, examples, and API documentation.


---

## Passport (authentication)

### Passport (authentication)

[Passport](https://github.com/jaredhanson/passport) is the most popular node.js authentication library, well-known by the community and successfully used in many production applications. It's straightforward to integrate this library with a **Nest** application using the `@nestjs/passport` module. At a high level, Passport executes a series of steps to:

- Authenticate a user by verifying their "credentials" (such as username/password, JSON Web Token ([JWT](https://jwt.io/)), or identity token from an Identity Provider)
- Manage authenticated state (by issuing a portable token, such as a JWT, or creating an [Express session](https://github.com/expressjs/session))
- Attach information about the authenticated user to the `Request` object for further use in route handlers

Passport has a rich ecosystem of [strategies](http://www.passportjs.org/) that implement various authentication mechanisms. While simple in concept, the set of Passport strategies you can choose from is large and presents a lot of variety. Passport abstracts these varied steps into a standard pattern, and the `@nestjs/passport` module wraps and standardizes this pattern into familiar Nest constructs.

In this chapter, we'll implement a complete end-to-end authentication solution for a RESTful API server using these powerful and flexible modules. You can use the concepts described here to implement any Passport strategy to customize your authentication scheme. You can follow the steps in this chapter to build this complete example.

#### Authentication requirements

Let's flesh out our requirements. For this use case, clients will start by authenticating with a username and password. Once authenticated, the server will issue a JWT that can be sent as a [bearer token in an authorization header](https://tools.ietf.org/html/rfc6750) on subsequent requests to prove authentication. We'll also create a protected route that is accessible only to requests that contain a valid JWT.

We'll start with the first requirement: authenticating a user. We'll then extend that by issuing a JWT. Finally, we'll create a protected route that checks for a valid JWT on the request.

First we need to install the required packages. Passport provides a strategy called [passport-local](https://github.com/jaredhanson/passport-local) that implements a username/password authentication mechanism, which suits our needs for this portion of our use case.

```bash
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

> warning **Notice** For **any** Passport strategy you choose, you'll always need the `@nestjs/passport` and `passport` packages. Then, you'll need to install the strategy-specific package (e.g., `passport-jwt` or `passport-local`) that implements the particular authentication strategy you are building. In addition, you can also install the type definitions for any Passport strategy, as shown above with `@types/passport-local`, which provides assistance while writing TypeScript code.

#### Implementing Passport strategies

We're now ready to implement the authentication feature. We'll start with an overview of the process used for **any** Passport strategy. It's helpful to think of Passport as a mini framework in itself. The elegance of the framework is that it abstracts the authentication process into a few basic steps that you customize based on the strategy you're implementing. It's like a framework because you configure it by supplying customization parameters (as plain JSON objects) and custom code in the form of callback functions, which Passport calls at the appropriate time. The `@nestjs/passport` module wraps this framework in a Nest style package, making it easy to integrate into a Nest application. We'll use `@nestjs/passport` below, but first let's consider how **vanilla Passport** works.

In vanilla Passport, you configure a strategy by providing two things:

1. A set of options that are specific to that strategy. For example, in a JWT strategy, you might provide a secret to sign tokens.
2. A "verify callback", which is where you tell Passport how to interact with your user store (where you manage user accounts). Here, you verify whether a user exists (and/or create a new user), and whether their credentials are valid. The Passport library expects this callback to return a full user if the validation succeeds, or a null if it fails (failure is defined as either the user is not found, or, in the case of passport-local, the password does not match).

With `@nestjs/passport`, you configure a Passport strategy by extending the `PassportStrategy` class. You pass the strategy options (item 1 above) by calling the `super()` method in your subclass, optionally passing in an options object. You provide the verify callback (item 2 above) by implementing a `validate()` method in your subclass.

We'll start by generating an `AuthModule` and in it, an `AuthService`:

```bash
$ nest g module auth
$ nest g service auth
```

As we implement the `AuthService`, we'll find it useful to encapsulate user operations in a `UsersService`, so let's generate that module and service now:

```bash
$ nest g module users
$ nest g service users
```

Replace the default contents of these generated files as shown below. For our sample app, the `UsersService` simply maintains a hard-coded in-memory list of users, and a find method to retrieve one by username. In a real app, this is where you'd build your user model and persistence layer, using your library of choice (e.g., TypeORM, Sequelize, Mongoose, etc.).

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
```

In the `UsersModule`, the only change needed is to add the `UsersService` to the exports array of the `@Module` decorator so that it is visible outside this module (we'll soon use it in our `AuthService`).

```typescript
@@filename(users/users.module)
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
@@switch
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Our `AuthService` has the job of retrieving a user and verifying the password. We create a `validateUser()` method for this purpose. In the code below, we use a convenient ES6 spread operator to strip the password property from the user object before returning it. We'll be calling into the `validateUser()` method from our Passport local strategy in a moment.

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

> Warning **Warning** Of course in a real application, you wouldn't store a password in plain text. You'd instead use a library like [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme), with a salted one-way hash algorithm. With that approach, you'd only store hashed passwords, and then compare the stored password to a hashed version of the **incoming** password, thus never storing or exposing user passwords in plain text. To keep our sample app simple, we violate that absolute mandate and use plain text. **Don't do this in your real app!**

Now, we update our `AuthModule` to import the `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

#### Implementing Passport local

Now we can implement our Passport **local authentication strategy**. Create a file called `local.strategy.ts` in the `auth` folder, and add the following code:

```typescript
@@filename(auth/local.strategy)
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
@@switch
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

We've followed the recipe described earlier for all Passport strategies. In our use case with passport-local, there are no configuration options, so our constructor simply calls `super()`, without an options object.

> info **Hint** We can pass an options object in the call to `super()` to customize the behavior of the passport strategy. In this example, the passport-local strategy by default expects properties called `username` and `password` in the request body. Pass an options object to specify different property names, for example: `super({{ '{' }} usernameField: 'email' {{ '}' }})`. See the [Passport documentation](http://www.passportjs.org/docs/configure/) for more information.

We've also implemented the `validate()` method. For each strategy, Passport will call the verify function (implemented with the `validate()` method in `@nestjs/passport`) using an appropriate strategy-specific set of parameters. For the local-strategy, Passport expects a `validate()` method with the following signature: `validate(username: string, password:string): any`.

Most of the validation work is done in our `AuthService` (with the help of our `UsersService`), so this method is quite straightforward. The `validate()` method for **any** Passport strategy will follow a similar pattern, varying only in the details of how credentials are represented. If a user is found and the credentials are valid, the user is returned so Passport can complete its tasks (e.g., creating the `user` property on the `Request` object), and the request handling pipeline can continue. If it's not found, we throw an exception and let our <a href="exception-filters">exceptions layer</a> handle it.

Typically, the only significant difference in the `validate()` method for each strategy is **how** you determine if a user exists and is valid. For example, in a JWT strategy, depending on requirements, we may evaluate whether the `userId` carried in the decoded token matches a record in our user database, or matches a list of revoked tokens. Hence, this pattern of sub-classing and implementing strategy-specific validation is consistent, elegant and extensible.

We need to configure our `AuthModule` to use the Passport features we just defined. Update `auth.module.ts` to look like this:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

#### Built-in Passport Guards

The <a href="guards">Guards</a> chapter describes the primary function of Guards: to determine whether a request will be handled by the route handler or not. That remains true, and we'll use that standard capability soon. However, in the context of using the `@nestjs/passport` module, we will also introduce a slight new wrinkle that may at first be confusing, so let's discuss that now. Consider that your app can exist in two states, from an authentication perspective:

1. the user/client is **not** logged in (is not authenticated)
2. the user/client **is** logged in (is authenticated)

In the first case (user is not logged in), we need to perform two distinct functions:

- Restrict the routes an unauthenticated user can access (i.e., deny access to restricted routes). We'll use Guards in their familiar capacity to handle this function, by placing a Guard on the protected routes. As you may anticipate, we'll be checking for the presence of a valid JWT in this Guard, so we'll work on this Guard later, once we are successfully issuing JWTs.

- Initiate the **authentication step** itself when a previously unauthenticated user attempts to login. This is the step where we'll **issue** a JWT to a valid user. Thinking about this for a moment, we know we'll need to `POST` username/password credentials to initiate authentication, so we'll set up a `POST /auth/login` route to handle that. This raises the question: how exactly do we invoke the passport-local strategy in that route?

The answer is straightforward: by using another, slightly different type of Guard. The `@nestjs/passport` module provides us with a built-in Guard that does this for us. This Guard invokes the Passport strategy and kicks off the steps described above (retrieving credentials, running the verify function, creating the `user` property, etc).

The second case enumerated above (logged in user) simply relies on the standard type of Guard we already discussed to enable access to protected routes for logged in users.

<app-banner-courses-auth></app-banner-courses-auth>

#### Login route

With the strategy in place, we can now implement a bare-bones `/auth/login` route, and apply the built-in Guard to initiate the passport-local flow.

Open the `app.controller.ts` file and replace its contents with the following:

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
```

With `@UseGuards(AuthGuard('local'))` we are using an `AuthGuard` that `@nestjs/passport` **automatically provisioned** for us when we extended the passport-local strategy. Let's break that down. Our Passport local strategy has a default name of `'local'`. We reference that name in the `@UseGuards()` decorator to associate it with code supplied by the `passport-local` package. This is used to disambiguate which strategy to invoke in case we have multiple Passport strategies in our app (each of which may provision a strategy-specific `AuthGuard`). While we only have one such strategy so far, we'll shortly add a second, so this is needed for disambiguation.

In order to test our route we'll have our `/auth/login` route simply return the user for now. This also lets us demonstrate another Passport feature: Passport automatically creates a `user` object, based on the value we return from the `validate()` method, and assigns it to the `Request` object as `req.user`. Later, we'll replace this with code to create and return a JWT instead.

Since these are API routes, we'll test them using the commonly available [cURL](https://curl.haxx.se/) library. You can test with any of the `user` objects hard-coded in the `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
```

While this works, passing the strategy name directly to the `AuthGuard()` introduces magic strings in the codebase. Instead, we recommend creating your own class, as shown below:

```typescript
@@filename(auth/local-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Now, we can update the `/auth/login` route handler and use the `LocalAuthGuard` instead:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
```

#### Logout route

To log out, we can create an additional route that invokes `req.logout()` to clear the user's session. This is a typical approach used in session-based authentication, but it does not apply to JWTs.

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/logout')
async logout(@Request() req) {
  return req.logout();
}
```

#### JWT functionality

We're ready to move on to the JWT portion of our auth system. Let's review and refine our requirements:

- Allow users to authenticate with username/password, returning a JWT for use in subsequent calls to protected API endpoints. We're well on our way to meeting this requirement. To complete it, we'll need to write the code that issues a JWT.
- Create API routes which are protected based on the presence of a valid JWT as a bearer token

We'll need to install a couple more packages to support our JWT requirements:

```bash
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
```

The `@nestjs/jwt` package (see more [here](https://github.com/nestjs/jwt)) is a utility package that helps with JWT manipulation. The `passport-jwt` package is the Passport package that implements the JWT strategy and `@types/passport-jwt` provides the TypeScript type definitions.

Let's take a closer look at how a `POST /auth/login` request is handled. We've decorated the route using the built-in `AuthGuard` provided by the passport-local strategy. This means that:

1. The route handler **will only be invoked if the user has been validated**
2. The `req` parameter will contain a `user` property (populated by Passport during the passport-local authentication flow)

With this in mind, we can now finally generate a real JWT, and return it in this route. To keep our services cleanly modularized, we'll handle generating the JWT in the `authService`. Open the `auth.service.ts` file in the `auth` folder, and add the `login()` method, and import the `JwtService` as shown:

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

We're using the `@nestjs/jwt` library, which supplies a `sign()` function to generate our JWT from a subset of the `user` object properties, which we then return as a simple object with a single `access_token` property. Note: we choose a property name of `sub` to hold our `userId` value to be consistent with JWT standards. Don't forget to inject the JwtService provider into the `AuthService`.

We now need to update the `AuthModule` to import the new dependencies and configure the `JwtModule`.

First, create `constants.ts` in the `auth` folder, and add the following code:

```typescript
@@filename(auth/constants)
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
@@switch
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
```

We'll use this to share our key between the JWT signing and verifying steps.

> Warning **Warning** **Do not expose this key publicly**. We have done so here to make it clear what the code is doing, but in a production system **you must protect this key** using appropriate measures such as a secrets vault, environment variable, or configuration service.

Now, open `auth.module.ts` in the `auth` folder and update it to look like this:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

We configure the `JwtModule` using `register()`, passing in a configuration object. See [here](https://github.com/nestjs/jwt/blob/master/README.md) for more on the Nest `JwtModule` and [here](https://github.com/auth0/node-jsonwebtoken#usage) for more details on the available configuration options.

Now we can update the `/auth/login` route to return a JWT.

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
```

Let's go ahead and test our routes using cURL again. You can test with any of the `user` objects hard-coded in the `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
```

#### Implementing Passport JWT

We can now address our final requirement: protecting endpoints by requiring a valid JWT be present on the request. Passport can help us here too. It provides the [passport-jwt](https://github.com/mikenicholson/passport-jwt) strategy for securing RESTful endpoints with JSON Web Tokens. Start by creating a file called `jwt.strategy.ts` in the `auth` folder, and add the following code:

```typescript
@@filename(auth/jwt.strategy)
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
@@switch
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

With our `JwtStrategy`, we've followed the same recipe described earlier for all Passport strategies. This strategy requires some initialization, so we do that by passing in an options object in the `super()` call. You can read more about the available options [here](https://github.com/mikenicholson/passport-jwt#configure-strategy). In our case, these options are:

- `jwtFromRequest`: supplies the method by which the JWT will be extracted from the `Request`. We will use the standard approach of supplying a bearer token in the Authorization header of our API requests. Other options are described [here](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request).
- `ignoreExpiration`: just to be explicit, we choose the default `false` setting, which delegates the responsibility of ensuring that a JWT has not expired to the Passport module. This means that if our route is supplied with an expired JWT, the request will be denied and a `401 Unauthorized` response sent. Passport conveniently handles this automatically for us.
- `secretOrKey`: we are using the expedient option of supplying a symmetric secret for signing the token. Other options, such as a PEM-encoded public key, may be more appropriate for production apps (see [here](https://github.com/mikenicholson/passport-jwt#configure-strategy) for more information). In any case, as cautioned earlier, **do not expose this secret publicly**.

The `validate()` method deserves some discussion. For the jwt-strategy, Passport first verifies the JWT's signature and decodes the JSON. It then invokes our `validate()` method passing the decoded JSON as its single parameter. Based on the way JWT signing works, **we're guaranteed that we're receiving a valid token** that we have previously signed and issued to a valid user.

As a result of all this, our response to the `validate()` callback is trivial: we simply return an object containing the `userId` and `username` properties. Recall again that Passport will build a `user` object based on the return value of our `validate()` method, and attach it as a property on the `Request` object.

Additionally, you can return an array, where the first value is used to create a `user` object and the second value is used to create an `authInfo` object.

It's also worth pointing out that this approach leaves us room ('hooks' as it were) to inject other business logic into the process. For example, we could do a database lookup in our `validate()` method to extract more information about the user, resulting in a more enriched `user` object being available in our `Request`. This is also the place we may decide to do further token validation, such as looking up the `userId` in a list of revoked tokens, enabling us to perform token revocation. The model we've implemented here in our sample code is a fast, "stateless JWT" model, where each API call is immediately authorized based on the presence of a valid JWT, and a small bit of information about the requester (its `userId` and `username`) is available in our Request pipeline.

Add the new `JwtStrategy` as a provider in the `AuthModule`:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

By importing the same secret used when we signed the JWT, we ensure that the **verify** phase performed by Passport, and the **sign** phase performed in our AuthService, use a common secret.

Finally, we define the `JwtAuthGuard` class which extends the built-in `AuthGuard`:

```typescript
@@filename(auth/jwt-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### Implement protected route and JWT strategy guards

We can now implement our protected route and its associated Guard.

Open the `app.controller.ts` file and update it as shown below:

```typescript
@@filename(app.controller)
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
```

Once again, we're applying the `AuthGuard` that the `@nestjs/passport` module has automatically provisioned for us when we configured the passport-jwt module. This Guard is referenced by its default name, `jwt`. When our `GET /profile` route is hit, the Guard will automatically invoke our passport-jwt custom configured strategy, validate the JWT, and assign the `user` property to the `Request` object.

Ensure the app is running, and test the routes using `cURL`.

```bash
$ # GET /profile
$ curl http://localhost:3000/profile
$ # result -> {"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # result -> {"userId":1,"username":"john"}
```

Note that in the `AuthModule`, we configured the JWT to have an expiration of `60 seconds`. This is probably too short an expiration, and dealing with the details of token expiration and refresh is beyond the scope of this article. However, we chose that to demonstrate an important quality of JWTs and the passport-jwt strategy. If you wait 60 seconds after authenticating before attempting a `GET /profile` request, you'll receive a `401 Unauthorized` response. This is because Passport automatically checks the JWT for its expiration time, saving you the trouble of doing so in your application.

We've now completed our JWT authentication implementation. JavaScript clients (such as Angular/React/Vue), and other JavaScript apps, can now authenticate and communicate securely with our API Server.

#### Extending guards

In most cases, using a provided `AuthGuard` class is sufficient. However, there might be use-cases when you would like to simply extend the default error handling or authentication logic. For this, you can extend the built-in class and override methods within a sub-class.

```typescript
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

In addition to extending the default error handling and authentication logic, we can allow authentication to go through a chain of strategies. The first strategy to succeed, redirect, or error will halt the chain. Authentication failures will proceed through each strategy in series, ultimately failing if all strategies fail.

```typescript
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
```

#### Enable authentication globally

If the vast majority of your endpoints should be protected by default, you can register the authentication guard as a [global guard](/guards#binding-guards) and instead of using `@UseGuards()` decorator on top of each controller, you could simply flag which routes should be public.

First, register the `JwtAuthGuard` as a global guard using the following construction (in any module):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

With this in place, Nest will automatically bind `JwtAuthGuard` to all endpoints.

Now we must provide a mechanism for declaring routes as public. For this, we can create a custom decorator using the `SetMetadata` decorator factory function.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

In the file above, we exported two constants. One being our metadata key named `IS_PUBLIC_KEY`, and the other being our new decorator itself that we’re going to call `Public` (you can alternatively name it `SkipAuth` or `AllowAnon`, whatever fits your project).

Now that we have a custom `@Public()` decorator, we can use it to decorate any method, as follows:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Lastly, we need the `JwtAuthGuard` to return `true` when the `"isPublic"` metadata is found. For this, we'll use the `Reflector` class (read more [here](/guards#putting-it-all-together)).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

#### Request-scoped strategies

The passport API is based on registering strategies to the global instance of the library. Therefore strategies are not designed to have request-dependent options or to be dynamically instantiated per request (read more about the [request-scoped](/fundamentals/injection-scopes) providers). When you configure your strategy to be request-scoped, Nest will never instantiate it since it's not tied to any specific route. There is no physical way to determine which "request-scoped" strategies should be executed per request.

However, there are ways to dynamically resolve request-scoped providers within the strategy. For this, we leverage the [module reference](/fundamentals/module-ref) feature.

First, open the `local.strategy.ts` file and inject the `ModuleRef` in the normal way:

```typescript
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
```

> info **Hint** The `ModuleRef` class is imported from the `@nestjs/core` package.

Be sure to set the `passReqToCallback` configuration property to `true`, as shown above.

In the next step, the request instance will be used to obtain the current context identifier, instead of generating a new one (read more about request context [here](/fundamentals/module-ref#getting-current-sub-tree)).

Now, inside the `validate()` method of the `LocalStrategy` class, use the `getByRequest()` method of the `ContextIdFactory` class to create a context id based on the request object, and pass this to the `resolve()` call:

```typescript
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService" is a request-scoped provider
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
```

In the example above, the `resolve()` method will asynchronously return the request-scoped instance of the `AuthService` provider (we assumed that `AuthService` is marked as a request-scoped provider).

#### Customize Passport

Any standard Passport customization options can be passed the same way, using the `register()` method. The available options depend on the strategy being implemented. For example:

```typescript
PassportModule.register({ session: true });
```

You can also pass strategies an options object in their constructors to configure them.
For the local strategy you can pass e.g.:

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

Take a look at the official [Passport Website](http://www.passportjs.org/docs/oauth/) for property names.

#### Named strategies

When implementing a strategy, you can provide a name for it by passing a second argument to the `PassportStrategy` function. If you don't do this, each strategy will have a default name (e.g., 'jwt' for jwt-strategy):

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

Then, you refer to this via a decorator like `@UseGuards(AuthGuard('myjwt'))`.

#### GraphQL

In order to use an AuthGuard with [GraphQL](https://docs.nestjs.com/graphql/quick-start), extend the built-in `AuthGuard` class and override the `getRequest()` method.

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

To get the current authenticated user in your graphql resolver, you can define a `@CurrentUser()` decorator:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

To use above decorator in your resolver, be sure to include it as a parameter of your query or mutation:

```typescript
@Query(() => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
```

For the passport-local strategy, you'll also need to add the GraphQL context's arguments to the request body so Passport can access them for validation. Otherwise, you'll get an Unauthorized error.

```typescript
@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    const gqlContext = gqlExecutionContext.getContext();
    const gqlArgs = gqlExecutionContext.getArgs();

    gqlContext.req.body = { ...gqlContext.req.body, ...gqlArgs };
    return gqlContext.req;
  }
}
```


---

## Prisma

### Prisma

[Prisma](https://www.prisma.io) is an [open-source](https://github.com/prisma/prisma) ORM for Node.js and TypeScript. It is used as an **alternative** to writing plain SQL, or using another database access tool such as SQL query builders (like [knex.js](https://knexjs.org/)) or ORMs (like [TypeORM](https://typeorm.io/) and [Sequelize](https://sequelize.org/)). Prisma currently supports PostgreSQL, MySQL, SQL Server, SQLite, MongoDB and CockroachDB ([Preview](https://www.prisma.io/docs/orm/reference/supported-databases)).

While Prisma can be used with plain JavaScript, it embraces TypeScript and provides a level to type-safety that goes beyond the guarantees other ORMs in the TypeScript ecosystem. You can find an in-depth comparison of the type-safety guarantees of Prisma and TypeORM [here](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm#type-safety).

> info **Note** If you want to get a quick overview of how Prisma works, you can follow the [Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres) or read the [Introduction](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma) in the [documentation](https://www.prisma.io/docs). There also are ready-to-run examples for [REST](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest) and [GraphQL](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest-graphql) in the [`prisma-examples`](https://github.com/prisma/prisma-examples/) repo.

#### Getting started

In this recipe, you'll learn how to get started with NestJS and Prisma from scratch. You are going to build a sample NestJS application with a REST API that can read and write data in a database.

For the purpose of this guide, you'll use a [SQLite](https://sqlite.org/) database to save the overhead of setting up a database server. Note that you can still follow this guide, even if you're using PostgreSQL or MySQL – you'll get extra instructions for using these databases at the right places.

> info **Note** If you already have an existing project and consider migrating to Prisma, you can follow the guide for [adding Prisma to an existing project](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres). If you are migrating from TypeORM, you can read the guide [Migrating from TypeORM to Prisma](https://www.prisma.io/docs/guides/migrate-from-typeorm).

#### Create your NestJS project

To get started, install the NestJS CLI and create your app skeleton with the following commands:

```bash
$ npm install -g @nestjs/cli
$ nest new hello-prisma
```

See the [First steps](https://docs.nestjs.com/first-steps) page to learn more about the project files created by this command. Note also that you can now run `npm start` to start your application. The REST API running at `http://localhost:3000/` currently serves a single route that's implemented in `src/app.controller.ts`. Over the course of this guide, you'll implement additional routes to store and retrieve data about _users_ and _posts_.

#### Set up Prisma

Start by installing the Prisma CLI as a development dependency in your project:

```bash
$ cd hello-prisma
$ npm install prisma --save-dev
```

In the following steps, we'll be utilizing the [Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli). As a best practice, it's recommended to invoke the CLI locally by prefixing it with `npx`:

```bash
$ npx prisma
```

<details><summary>Expand if you're using Yarn</summary>

If you're using Yarn, then you can install the Prisma CLI as follows:

```bash
$ yarn add prisma --dev
```

Once installed, you can invoke it by prefixing it with `yarn`:

```bash
$ yarn prisma
```

</details>

Now create your initial Prisma setup using the `init` command of the Prisma CLI:

```bash
$ npx prisma init
```

This command creates a new `prisma` directory with the following contents:

- `schema.prisma`: Specifies your database connection and contains the database schema
- `prisma.config.ts`: A configuration file for your projects
- `.env`: A [dotenv](https://github.com/motdotla/dotenv) file, typically used to store your database credentials in a group of environment variables

#### Set the generator output path

Specify your output `path` for the generated Prisma client either by passing `--output ../src/generated/prisma` during prisma init, or directly in your Prisma schema:

```groovy
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
}
```

#### Configure the module format

Set `moduleFormat` in the generator to `cjs`:

```groovy
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat    = "cjs"
}
```

> info **Note** The `moduleFormat` configuration is required because Prisma v7 ships as an ES module by default, which does not work with NestJS's CommonJS setup. Setting `moduleFormat` to `cjs` forces Prisma to generate a CommonJS module instead of ESM.

#### Set the database connection

Your database connection is configured in the `datasource` block in your `schema.prisma` file. By default it's set to `postgresql`, but since you're using a SQLite database in this guide you need to adjust the `provider` field of the `datasource` block to `sqlite`:

```groovy
datasource db {
  provider = "sqlite"
}

generator client {
  provider      = "prisma-client"
  output        = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
```

Now, open up `.env` and adjust the `DATABASE_URL` environment variable to look as follows:

```bash
DATABASE_URL="file:./dev.db"
```

Make sure you have a [ConfigModule](https://docs.nestjs.com/techniques/configuration) configured, otherwise the `DATABASE_URL` variable will not be picked up from `.env`.

SQLite databases are simple files; no server is required to use a SQLite database. So instead of configuring a connection URL with a _host_ and _port_, you can just point it to a local file which in this case is called `dev.db`. This file will be created in the next step.

<details><summary>Expand if you're using PostgreSQL, MySQL, MsSQL or Azure SQL</summary>

With PostgreSQL and MySQL, you need to configure the connection URL to point to the _database server_. You can learn more about the required connection URL format [here](https://www.prisma.io/docs/reference/database-reference/connection-urls).

**PostgreSQL**

If you're using PostgreSQL, you have to adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
```

**`.env`**

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Replace the placeholders spelled in all uppercase letters with your database credentials. Note that if you're unsure what to provide for the `SCHEMA` placeholder, it's most likely the default value `public`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

If you want to learn how to set up a PostgreSQL database, you can follow this guide on [setting up a free PostgreSQL database on Heroku](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1).

**MySQL**

If you're using MySQL, you have to adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
```

**`.env`**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Replace the placeholders spelled in all uppercase letters with your database credentials.

**Microsoft SQL Server / Azure SQL Server**

If you're using Microsoft SQL Server or Azure SQL Server, you have to adjust the `schema.prisma` and `.env` files as follows:

**`schema.prisma`**

```groovy
datasource db {
  provider = "sqlserver"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
```

**`.env`**

Replace the placeholders spelled in all uppercase letters with your database credentials. Note that if you're unsure what to provide for the `encrypt` placeholder, it's most likely the default value `true`:

```bash
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true"
```

</details>

#### Create two database tables with Prisma Migrate

In this section, you'll create two new tables in your database using [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started). Prisma Migrate generates SQL migration files for your declarative data model definition in the Prisma schema. These migration files are fully customizable so that you can configure any additional features of the underlying database or include additional commands, e.g. for seeding.

Add the following two models to your `schema.prisma` file:

```groovy
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

With your Prisma models in place, you can generate your SQL migration files and run them against the database. Run the following commands in your terminal:

```bash
$ npx prisma migrate dev --name init
```

This `prisma migrate dev` command generates SQL files and directly runs them against the database. In this case, the following migration files was created in the existing `prisma` directory:

```bash
$ tree prisma
prisma
├── dev.db
├── migrations
│   └── 20201207100915_init
│       └── migration.sql
└── schema.prisma
```

<details><summary>Expand to view the generated SQL statements</summary>

The following tables were created in your SQLite database:

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN DEFAULT false,
    "authorId" INTEGER,

    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");
```

</details>

#### Install and generate Prisma Client

Prisma Client is a type-safe database client that's _generated_ from your Prisma model definition. Because of this approach, Prisma Client can expose [CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud) operations that are _tailored_ specifically to your models.

To install Prisma Client in your project, run the following command in your terminal:

```bash
$ npm install @prisma/client
```

Once installed, you can run the generate command to generate the types and Client needed for your project. If any changes are made to your schema, you will need to rerun the `generate` command to keep those types in sync.

```bash
$ npx prisma generate
```

In addition to Prisma Client, you also need to a driver adapter for the type of database you are working with. For SQLite, you can install the `@prisma/adapter-better-sqlite3` driver.

```bash
npm install @prisma/adapter-better-sqlite3
```

<details> <summary>Expand if you're using PostgreSQL, MySQL, MsSQL, or AzureSQL</summary>

- For PostgreSQL

```bash
npm install @prisma/adapter-pg
```

- For MySQL, MsSQL, AzureSQL:

```bash
npm install @prisma/adapter-mariadb
```

</details>

#### Use Prisma Client in your NestJS services

You're now able to send database queries with Prisma Client. If you want to learn more about building queries with Prisma Client, check out the [API documentation](https://www.prisma.io/docs/orm/reference/prisma-client-reference).

When setting up your NestJS application, you'll want to abstract away the Prisma Client API for database queries within a service. To get started, you can create a new `PrismaService` that takes care of instantiating `PrismaClient` and connecting to your database.

Inside the `src` directory, create a new file called `prisma.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
    super({ adapter });
  }
}
```

Next, you can write services that you can use to make database calls for the `User` and `Post` models from your Prisma schema.

Still inside the `src` directory, create a new file called `user.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

Notice how you're using Prisma Client's generated types to ensure that the methods that are exposed by your service are properly typed. You therefore save the boilerplate of typing your models and creating additional interface or DTO files.

Now do the same for the `Post` model.

Still inside the `src` directory, create a new file called `post.service.ts` and add the following code to it:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Post, Prisma } from 'generated/prisma';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
```

Your `UsersService` and `PostsService` currently wrap the CRUD queries that are available in Prisma Client. In a real world application, the service would also be the place to add business logic to your application. For example, you could have a method called `updatePassword` inside the `UsersService` that would be responsible for updating the password of a user.

Remember to register the new services in the app module.

##### Implement your REST API routes in the main app controller

Finally, you'll use the services you created in the previous sections to implement the different routes of your app. For the purpose of this guide, you'll put all your routes into the already existing `AppController` class.

Replace the contents of the `app.controller.ts` file with the following code:

```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { PostsService } from './post.service';
import { User as UserModel, Post as PostModel } from 'generated/prisma';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UsersService,
    private readonly postService: PostsService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
```

This controller implements the following routes:

###### `GET`

- `/post/:id`: Fetch a single post by its `id`
- `/feed`: Fetch all _published_ posts
- `/filter-posts/:searchString`: Filter posts by `title` or `content`

###### `POST`

- `/post`: Create a new post
  - Body:
    - `title: String` (required): The title of the post
    - `content: String` (optional): The content of the post
    - `authorEmail: String` (required): The email of the user that creates the post
- `/user`: Create a new user
  - Body:
    - `email: String` (required): The email address of the user
    - `name: String` (optional): The name of the user

###### `PUT`

- `/publish/:id`: Publish a post by its `id`

###### `DELETE`

- `/post/:id`: Delete a post by its `id`

#### Summary

In this recipe, you learned how to use Prisma along with NestJS to implement a REST API. The controller that implements the routes of the API is calling a `PrismaService` which in turn uses Prisma Client to send queries to a database to fulfill the data needs of incoming requests.

If you want to learn more about using NestJS with Prisma, be sure to check out the following resources:

- [NestJS & Prisma](https://www.prisma.io/nestjs)
- [Ready-to-run example projects for REST & GraphQL](https://github.com/prisma/prisma-examples/)
- [Production-ready starter kit](https://github.com/notiz-dev/nestjs-prisma-starter#instructions)
- [Video: Accessing Databases using NestJS with Prisma (5min)](https://www.youtube.com/watch?v=UlVJ340UEuk&ab_channel=Prisma) by [Marc Stammerjohann](https://github.com/marcjulian)


---

## Read-Eval-Print-Loop (REPL)

### Read-Eval-Print-Loop (REPL)

REPL is a simple interactive environment that takes single user inputs, executes them, and returns the result to the user.
The REPL feature lets you inspect your dependency graph and call methods on your providers (and controllers) directly from your terminal.

#### Usage

To run your NestJS application in REPL mode, create a new `repl.ts` file (alongside the existing `main.ts` file) and add the following code inside:

```typescript
@@filename(repl)
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
@@switch
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
```

Now in your terminal, start the REPL with the following command:

```bash
$ npm run start -- --entryFile repl
```

> info **Hint** `repl` returns a [Node.js REPL server](https://nodejs.org/api/repl.html) object.

Once it's up and running, you should see the following message in your console:

```bash
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized
LOG REPL initialized
```

And now you can start interacting with your dependencies graph. For instance, you can retrieve an `AppService` (we are using the starter project as an example here) and call the `getHello()` method:

```typescript
> get(AppService).getHello()
'Hello World!'
```

You can execute any JavaScript code from within your terminal, for example, assign an instance of the `AppController` to a local variable, and use `await` to call an asynchronous method:

```typescript
> appController = get(AppController)
AppController { appService: AppService {} }
> await appController.getHello()
'Hello World!'
```

To display all public methods available on a given provider or controller, use the `methods()` function, as follows:

```typescript
> methods(AppController)

Methods:
 ◻ getHello
```

To print all registered modules as a list together with their controllers and providers, use `debug()`.

```typescript
> debug()

AppModule:
 - controllers:
  ◻ AppController
 - providers:
  ◻ AppService
```

Quick demo:

<figure><img src="/assets/repl.gif" alt="REPL example" /></figure>

You can find more information about the existing, predefined native methods in the section below.

#### Native functions

The built-in NestJS REPL comes with a few native functions that are globally available when you start REPL. You can call `help()` to list them out.

If you don't recall what's the signature (ie: expected parameters and a return type) of a function, you can call `<function_name>.help`.
For instance:

```text
> $.help
Retrieves an instance of either injectable or controller, otherwise, throws exception.
Interface: $(token: InjectionToken) => any
```

> info **Hint** Those function interfaces are written in [TypeScript function type expression syntax](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions).

| Function     | Description                                                                                                        | Signature                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `debug`      | Print all registered modules as a list together with their controllers and providers.                              | `debug(moduleCls?: ClassRef \| string) => void`                       |
| `get` or `$` | Retrieves an instance of either injectable or controller, otherwise, throws exception.                             | `get(token: InjectionToken) => any`                                   |
| `methods`    | Display all public methods available on a given provider or controller.                                            | `methods(token: ClassRef \| string) => void`                          |
| `resolve`    | Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception.     | `resolve(token: InjectionToken, contextId: any) => Promise<any>`      |
| `select`     | Allows navigating through the modules tree, for example, to pull out a specific instance from the selected module. | `select(token: DynamicModule \| ClassRef) => INestApplicationContext` |

#### Watch mode

During development it is useful to run REPL in a watch mode to reflect all the code changes automatically:

```bash
$ npm run start -- --watch --entryFile repl
```

This has one flaw, the REPL's command history is discarded after each reload which might be cumbersome.
Fortunately, there is a very simple solution. Modify your `bootstrap` function like this:

```typescript
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory(".nestjs_repl_history", (err) => {
    if (err) {
      console.error(err);
    }
  });
}
```

Now the history is preserved between the runs/reloads.


---

## Router module

### Router module

> info **Hint** This chapter is only relevant to HTTP-based applications.

In an HTTP application (for example, REST API), the route path for a handler is determined by concatenating the (optional) prefix declared for the controller (inside the `@Controller` decorator),
and any path specified in the method's decorator (e.g, `@Get('users')`). You can learn more about that in [this section](/controllers#routing). Additionally,
you can define a [global prefix](/faq/global-prefix) for all routes registered in your application, or enable [versioning](/techniques/versioning).

Also, there are edge-cases when defining a prefix at a module-level (and so for all controllers registered inside that module) may come in handy.
For example, imagine a REST application that exposes several different endpoints being used by a specific portion of your application called "Dashboard".
In such a case, instead of repeating the `/dashboard` prefix within each controller, you could use a utility `RouterModule` module, as follows:

```typescript
@Module({
  imports: [
    DashboardModule,
    RouterModule.register([
      {
        path: 'dashboard',
        module: DashboardModule,
      },
    ]),
  ],
})
export class AppModule {}
```

> info **Hint** The `RouterModule` class is exported from the `@nestjs/core` package.

In addition, you can define hierarchical structures. This means each module can have `children` modules.
The children modules will inherit their parent's prefix. In the following example, we'll register the `AdminModule` as a parent module of `DashboardModule` and `MetricsModule`.

```typescript
@Module({
  imports: [
    AdminModule,
    DashboardModule,
    MetricsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ],
      },
    ])
  ],
});
```

> info **Hint** This feature should be used very carefully, as overusing it can make code difficult to maintain over time.

In the example above, any controller registered inside the `DashboardModule` will have an extra `/admin/dashboard` prefix (as the module concatenates paths from top to bottom - recursively - parent to children).
Likewise, each controller defined inside the `MetricsModule` will have an additional module-level prefix `/admin/metrics`.


---

## SWC

### SWC

[SWC](https://swc.rs/) (Speedy Web Compiler) is an extensible Rust-based platform that can be used for both compilation and bundling.
Using SWC with Nest CLI is a great and simple way to significantly speed up your development process.

> info **Hint** SWC is approximately **x20 times faster** than the default TypeScript compiler.

#### Installation

To get started, first install a few packages:

```bash
$ npm i --save-dev @swc/cli @swc/core
```

#### Getting started

Once the installation process is complete, you can use the `swc` builder with Nest CLI, as follows:

```bash
$ nest start -b swc
# OR nest start --builder swc
```

> info **Hint** If your repository is a monorepo, check out [this section](/recipes/swc#monorepo).

Instead of passing the `-b` flag you can also just set the `compilerOptions.builder` property to `"swc"` in your `nest-cli.json` file, like so:

```json
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

To customize builder's behavior, you can pass an object containing two attributes, `type` (`"swc"`) and `options`, as follows:

```json
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": {
        "swcrcPath": "infrastructure/.swcrc",
      }
    }
  }
}
```

For example, to make the swc compile `.jsx` and `.tsx` files, do:

```json
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": { "extensions": [".ts", ".tsx", ".js", ".jsx"] }
    },
  }
}

```

To run the application in watch mode, use the following command:

```bash
$ nest start -b swc -w
# OR nest start --builder swc --watch
```

#### Type checking

SWC does not perform any type checking itself (as opposed to the default TypeScript compiler), so to turn it on, you need to use the `--type-check` flag:

```bash
$ nest start -b swc --type-check
```

This command will instruct the Nest CLI to run `tsc` in `noEmit` mode alongside SWC, which will asynchronously perform type checking. Again, instead of passing the `--type-check` flag you can also just set the `compilerOptions.typeCheck` property to `true` in your `nest-cli.json` file, like so:

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### CLI Plugins (SWC)

The `--type-check` flag will automatically execute **NestJS CLI plugins** and produce a serialized metadata file which then can be loaded by the application at runtime.

#### SWC configuration

SWC builder is pre-configured to match the requirements of NestJS applications. However, you can customize the configuration by creating a `.swcrc` file in the root directory and tweaking the options as you wish.

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

#### Monorepo

If your repository is a monorepo, then instead of using `swc` builder you have to configure `webpack` to use `swc-loader`.

First, let's install the required package:

```bash
$ npm i --save-dev swc-loader
```

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application with the following content:

```js
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
```

#### Monorepo and CLI plugins

Now if you use CLI plugins, `swc-loader` will not load them automatically. Instead, you have to create a separate file that will load them manually. To do so,
declare a `generate-metadata.ts` file near the `main.ts` file with the following content:

```ts
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname })],
  outputDir: __dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
```

> info **Hint** In this example we used `@nestjs/swagger` plugin, but you can use any plugin of your choice.

The `generate()` method accepts the following options:

|                    |                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `watch`            | Whether to watch the project for changes.                                                      |
| `tsconfigPath`     | Path to the `tsconfig.json` file. Relative to the current working directory (`process.cwd()`). |
| `outputDir`        | Path to the directory where the metadata file will be saved.                                   |
| `visitors`         | An array of visitors that will be used to generate metadata.                                   |
| `filename`         | The name of the metadata file. Defaults to `metadata.ts`.                                      |
| `printDiagnostics` | Whether to print diagnostics to the console. Defaults to `true`.                               |

Finally, you can run the `generate-metadata` script in a separate terminal window with the following command:

```bash
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

#### Common pitfalls

If you use TypeORM/MikroORM or any other ORM in your application, you may stumble upon circular import issues. SWC doesn't handle **circular imports** well, so you should use the following workaround:

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- see "Relation<>" type here instead of just "Profile"
}
```

> info **Hint** `Relation` type is exported from the `typeorm` package.

Doing this prevents the type of the property from being saved in the transpiled code in the property metadata, preventing circular dependency issues.

If your ORM does not provide a similar workaround, you can define the wrapper type yourself:

```typescript
/**
 * Wrapper type used to circumvent ESM modules circular dependency issue
 * caused by reflection metadata saving the type of the property.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```

For all [circular dependency injections](/fundamentals/circular-dependency) in your project, you will also need to use the custom wrapper type described above:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {};
}
```

### Jest + SWC

To use SWC with Jest, you need to install the following packages:

```bash
$ npm i --save-dev jest @swc/core @swc/jest
```

Once the installation is complete, update the `package.json`/`jest.config.js` file (depending on your configuration) with the following content:

```json
{
  "jest": {
    "transform": {
      "^.+\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
```

Additionally you would need to add the following `transform` properties to your `.swcrc` file: `legacyDecorator`, `decoratorMetadata`:

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

If you use NestJS CLI Plugins in your project, you'll have to run `PluginMetadataGenerator` manually. Navigate to [this section](/recipes/swc#monorepo-and-cli-plugins) to learn more.

### Vitest

[Vitest](https://vitest.dev/) is a fast and lightweight test runner designed to work with Vite. It provides a modern, fast, and easy-to-use testing solution that can be integrated with NestJS projects.

#### Installation

To get started, first install the required packages:

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

#### Configuration

Create a `vitest.config.ts` file in the root directory of your application with the following content:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      'src': resolve(__dirname, './src'),
    },
  },
});
```

This configuration file sets up the Vitest environment, root directory, and SWC plugin. You should also create a separate configuration
file for e2e tests, with an additional `include` field that specifies the test path regex:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
```

Additionally, you can set the `alias` options to support TypeScript paths in your tests:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
```

### Path aliases

Unlike Jest, Vitest does not automatically resolve TypeScript path aliases like `src/`. This may lead to dependency resolution errors during testing. To resolve this issue, add the following `resolve.alias` configuration in your `vitest.config.ts` file:

```ts
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
    },
  },
});
```
This ensures that Vitest correctly resolves module imports, preventing errors related to missing dependencies.

#### Update imports in E2E tests

Change any E2E test imports using `import * as request from 'supertest'` to `import request from 'supertest'`. This is necessary because Vitest, when bundled with Vite, expects a default import for supertest. Using a namespace import may cause issues in this specific setup.

Lastly, update the test scripts in your package.json file to the following:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```


These scripts configure Vitest for running tests, watching for changes, generating code coverage reports, and debugging. The test:e2e script is specifically for running E2E tests with a custom configuration file.

With this setup, you can now enjoy the benefits of using Vitest in your NestJS project, including faster test execution and a more modern testing experience.

> info **Hint** You can check out a working example in this [repository](https://github.com/TrilonIO/nest-vitest)


---

## Serve Static

### Serve Static

In order to serve static content like a Single Page Application (SPA) we can use the `ServeStaticModule` from the [`@nestjs/serve-static`](https://www.npmjs.com/package/@nestjs/serve-static) package.

#### Installation

First we need to install the required package:

```bash
$ npm install --save @nestjs/serve-static
```

#### Bootstrap

Once the installation process is done, we can import the `ServeStaticModule` into the root `AppModule` and configure it by passing in a configuration object to the `forRoot()` method.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

With this in place, build the static website and place its content in the location specified by the `rootPath` property.

#### Configuration

[ServeStaticModule](https://github.com/nestjs/serve-static) can be configured with a variety of options to customize its behavior.
You can set the path to render your static app, specify excluded paths, enable or disable setting Cache-Control response header, etc. See the full list of options [here](https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts).

> warning **Notice** The default `renderPath` of the Static App is `*` (all paths), and the module will send "index.html" files in response.
> It lets you create Client-Side routing for your SPA. Paths, specified in your controllers will fallback to the server.
> You can change this behavior setting `serveRoot`, `renderPath` combining them with other options.
> Additionally, the option `serveStaticOptions.fallthrough` has been implemented in the Fastify adapter to mimic Express's fallthrough behavior and needs to be set to `true` to send `index.html` instead of a 404 error for non existing route.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/24-serve-static).


---

