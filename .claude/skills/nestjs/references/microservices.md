# Microservices

## Custom transporters

### Custom transporters

Nest provides a variety of **transporters** out-of-the-box, as well as an API allowing developers to build new custom transport strategies.
Transporters enable you to connect components over a network using a pluggable communications layer and a very simple application-level message protocol (read full [article](https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3)).

> info **Hint** Building a microservice with Nest does not necessarily mean you must use the `@nestjs/microservices` package. For example, if you want to communicate with external services (let's say other microservices written in different languages), you may not need all the features provided by `@nestjs/microservice` library.
> In fact, if you don't need decorators (`@EventPattern` or `@MessagePattern`) that let you declaratively define subscribers, running a [Standalone Application](/application-context) and manually maintaining connection/subscribing to channels should be enough for most use-cases and will provide you with more flexibility.

With a custom transporter, you can integrate any messaging system/protocol (including Google Cloud Pub/Sub, Amazon Kinesis, and others) or extend the existing one, adding extra features on top (for example, [QoS](https://github.com/mqttjs/MQTT.js/blob/master/README.md#qos) for MQTT).

> info **Hint** To better understand how Nest microservices work and how you can extend the capabilities of existing transporters, we recommend reading the [NestJS Microservices in Action](https://dev.to/johnbiundo/series/4724) and [Advanced NestJS Microservices](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) article series.

#### Creating a strategy

First, let's define a class representing our custom transporter.

```typescript
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * Triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    callback();
  }

  /**
   * Triggered on application shutdown.
   */
  close() {}

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  on(event: string, callback: Function) {
    throw new Error('Method not implemented.');
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **Warning** Please, note we won't be implementing a fully-featured Google Cloud Pub/Sub server in this chapter as this would require diving into transporter specific technical details.

In our example above, we declared the `GoogleCloudPubSubServer` class and provided `listen()` and `close()` methods enforced by the `CustomTransportStrategy` interface.
Also, our class extends the `Server` class imported from the `@nestjs/microservices` package that provides a few useful methods, for example, methods used by Nest runtime to register message handlers. Alternatively, in case you want to extend the capabilities of an existing transport strategy, you could extend the corresponding server class, for example, `ServerRedis`.
Conventionally, we added the `"Server"` suffix to our class as it will be responsible for subscribing to messages/events (and responding to them, if necessary).

With this in place, we can now use our custom strategy instead of using a built-in transporter, as follows:

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new GoogleCloudPubSubServer(),
  },
);
```

Basically, instead of passing the normal transporter options object with `transport` and `options` properties, we pass a single property, `strategy`, whose value is an instance of our custom transporter class.

Back to our `GoogleCloudPubSubServer` class, in a real-world application, we would be establishing a connection to our message broker/external service and registering subscribers/listening to specific channels in `listen()` method (and then removing subscriptions & closing the connection in the `close()` teardown method),
but since this requires a good understanding of how Nest microservices communicate with each other, we recommend reading this [article series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l).
In this chapter instead, we'll focus on the capabilities the `Server` class provides and how you can leverage them to build custom strategies.

For example, let's say that somewhere in our application, the following message handler is defined:

```typescript
@MessagePattern('echo')
echo(@Payload() data: object) {
  return data;
}
```

This message handler will be automatically registered by Nest runtime. With `Server` class, you can see what message patterns have been registered and also, access and execute the actual methods that were assigned to them.
To test this out, let's add a simple `console.log` inside `listen()` method before `callback` function is called:

```typescript
listen(callback: () => void) {
  console.log(this.messageHandlers);
  callback();
}
```

After your application restarts, you'll see the following log in your terminal:

```typescript
Map { 'echo' => [AsyncFunction] { isEventHandler: false } }
```

> info **Hint** If we used the `@EventPattern` decorator, you would see the same output, but with the `isEventHandler` property set to `true`.

As you can see, the `messageHandlers` property is a `Map` collection of all message (and event) handlers, in which patterns are being used as keys.
Now, you can use a key (for example, `"echo"`) to receive a reference to the message handler:

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  console.log(await echoHandler('Hello world!'));
  callback();
}
```

Once we execute the `echoHandler` passing an arbitrary string as an argument (`"Hello world!"` here), we should see it in the console:

```json
Hello world!
```

Which means that our method handler was properly executed.

When using a `CustomTransportStrategy` with [Interceptors](/interceptors) the handlers are wrapped into RxJS streams. This means that you need to subscribe to them in order to execute the streams underlying logic (e.g. continue into the controller logic after an interceptor has been executed).

An example of this can be seen below:

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  const streamOrResult = await echoHandler('Hello World');
  if (isObservable(streamOrResult)) {
    streamOrResult.subscribe();
  }
  callback();
}
```

#### Client proxy

As we mentioned in the first section, you don't necessarily need to use the `@nestjs/microservices` package to create microservices, but if you decide to do so and you need to integrate a custom strategy, you will need to provide a "client" class too.

> info **Hint** Again, implementing a fully-featured client class compatible with all `@nestjs/microservices` features (e.g., streaming) requires a good understanding of communication techniques used by the framework. To learn more, check out this [article](https://dev.to/nestjs/part-4-basic-client-component-16f9).

To communicate with an external service/emit & publish messages (or events) you can either use a library-specific SDK package, or implement a custom client class that extends the `ClientProxy`, as follows:

```typescript
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {}
  async close() {}
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {}
  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {}
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **Warning** Please, note we won't be implementing a fully-featured Google Cloud Pub/Sub client in this chapter as this would require diving into transporter specific technical details.

As you can see, `ClientProxy` class requires us to provide several methods for establishing & closing the connection and publishing messages (`publish`) and events (`dispatchEvent`).
Note, if you don't need a request-response communication style support, you can leave the `publish()` method empty. Likewise, if you don't need to support event-based communication, skip the `dispatchEvent()` method.

To observe what and when those methods are executed, let's add multiple `console.log` calls, as follows:

```typescript
class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    console.log('connect');
  }

  async close() {
    console.log('close');
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {
    console.log('message:', packet);

    // In a real-world application, the "callback" function should be executed
    // with payload sent back from the responder. Here, we'll simply simulate (5 seconds delay)
    // that response came through by passing the same "data" as we've originally passed in.
    //
    // The "isDisposed" bool on the WritePacket tells the response that no further data is
    // expected. If not sent or is false, this will simply emit data to the Observable.
    setTimeout(() => callback({ 
      response: packet.data,
      isDisposed: true,
    }), 5000);

    return () => console.log('teardown');
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

With this in place, let's create an instance of `GoogleCloudPubSubClient` class and run the `send()` method (which you might have seen in earlier chapters), subscribing to the returned observable stream.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .subscribe((response) => console.log(response));
```

Now, you should see the following output in your terminal:

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
Hello world! // <-- after 5 seconds
```

To test if our "teardown" method (which our `publish()` method returns) is properly executed, let's apply a timeout operator to our stream, setting it to 2 seconds to make sure it throws earlier then our `setTimeout` calls the `callback` function.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .pipe(timeout(2000))
  .subscribe(
    (response) => console.log(response),
    (error) => console.error(error.message),
  );
```

> info **Hint** The `timeout` operator is imported from the `rxjs/operators` package.

With `timeout` operator applied, your terminal output should look as follows:

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
teardown // <-- teardown
Timeout has occurred
```

To dispatch an event (instead of sending a message), use the `emit()` method:

```typescript
googlePubSubClient.emit('event', 'Hello world!');
```

And that's what you should see in the console:

```typescript
connect
event to dispatch:  { pattern: 'event', data: 'Hello world!' }
```

#### Message serialization

If you need to add some custom logic around the serialization of responses on the client side, you can use a custom class that extends the `ClientProxy` class or one of its child classes. For modifying successful requests you can override the `serializeResponse` method, and for modifying any errors that go through this client you can override the `serializeError` method. To make use of this custom class, you can pass the class itself to the `ClientsModule.register()` method using the `customClass` property. Below is an example of a custom `ClientProxy` that serializes each error into an `RpcException`.

```typescript
@@filename(error-handling.proxy)
import { ClientTcp, RpcException } from '@nestjs/microservices';

class ErrorHandlingProxy extends ClientTCP {
  serializeError(err: Error) {
    return new RpcException(err);
  }
}
```

and then use it in the `ClientsModule` like so:

```typescript
@@filename(app.module)
@Module({
  imports: [
    ClientsModule.register([{
      name: 'CustomProxy',
      customClass: ErrorHandlingProxy,
    }]),
  ]
})
export class AppModule
```

> info **hint** This is the class itself being passed to `customClass`, not an instance of the class. Nest will create the instance under the hood for you, and will pass any options given to the `options` property to the new `ClientProxy`.


---

## Hybrid application

### Hybrid application

A hybrid application is one that listens for requests from two or more different sources. This can combine an HTTP server with a microservice listener or even just multiple different microservice listeners. The default `createMicroservice` method does not allow for multiple servers so in this case each microservice must be created and started manually. In order to do this, the `INestApplication` instance can be connected with `INestMicroservice` instances through the `connectMicroservice()` method.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
});

await app.startAllMicroservices();
await app.listen(3001);
```

> info **Hint** the `app.listen(port)` method starts an HTTP server on the specified address. If your application does not handle HTTP requests then you should use the `app.init()` method instead.

To connect multiple microservice instances, issue the call to `connectMicroservice()` for each microservice:

```typescript
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

await app.startAllMicroservices();
await app.listen(3001);
```

To bind `@MessagePattern()` to only one transport strategy (for example, MQTT) in a hybrid application with multiple microservices, we can pass the second argument of type `Transport` which is an enum with all the built-in transport strategies defined.

```typescript
@@filename()
@MessagePattern('time.us.*', Transport.NATS)
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*', Transport.NATS)
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@Bind(Payload(), Ctx())
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(data, context) {
  return new Date().toLocaleTimeString(...);
}
```

> info **Hint** `@Payload()`, `@Ctx()`, `Transport` and `NatsContext` are imported from `@nestjs/microservices`.

#### Sharing configuration

By default a hybrid application will not inherit global pipes, interceptors, guards and filters configured for the main (HTTP-based) application.
To inherit these configuration properties from the main application, set the `inheritAppConfig` property in the second argument (an optional options object) of the `connectMicroservice()` call, as follow:

```typescript
const microservice = app.connectMicroservice<MicroserviceOptions>(
  {
    transport: Transport.TCP,
  },
  { inheritAppConfig: true },
);
```


---

## Kafka

### Kafka

[Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform which has three key capabilities:

- Publish and subscribe to streams of records, similar to a message queue or enterprise messaging system.
- Store streams of records in a fault-tolerant durable way.
- Process streams of records as they occur.

The Kafka project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds. It integrates very well with Apache Storm and Spark for real-time streaming data analysis.

#### Installation

To start building Kafka-based microservices, first install the required package:

```bash
$ npm i --save kafkajs
```

#### Overview

Like other Nest microservice transport layer implementations, you select the Kafka transporter mechanism using the `transport` property of the options object passed to the `createMicroservice()` method, along with an optional `options` property, as shown below:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>Kafka</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>client</code></td>
    <td>Client configuration options (read more
      <a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Run configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>Subscribe configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming#frombeginning"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options (read more
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Send configuration options (read more
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>producerOnlyMode</code></td>
    <td>Feature flag to skip consumer group registration and only act as a producer (<code>boolean</code>)</td>
  </tr>
  <tr>
    <td><code>postfixId</code></td>
    <td>Change suffix of clientId value (<code>string</code>)</td>
  </tr>
</table>

#### Client

There is a small difference in Kafka compared to other microservice transporters. Instead of the `ClientProxy` class, we use the `ClientKafkaProxy` class.

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a `ClientKafkaProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'hero',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'hero-consumer'
          }
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

Use the `@Client()` decorator as follows:

```typescript
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer'
    }
  }
})
client: ClientKafkaProxy;
```

#### Message pattern

The Kafka microservice message pattern utilizes two topics for the request and reply channels. The `ClientKafkaProxy.send()` method sends messages with a [return address](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html) by associating a [correlation id](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), reply topic, and reply partition with the request message. This requires the `ClientKafkaProxy` instance to be subscribed to the reply topic and assigned to at least one partition before sending a message.

Subsequently, you need to have at least one reply topic partition for every Nest application running. For example, if you are running 4 Nest applications but the reply topic only has 3 partitions, then 1 of the Nest applications will error out when trying to send a message.

When new `ClientKafkaProxy` instances are launched they join the consumer group and subscribe to their respective topics. This process triggers a rebalance of topic partitions assigned to consumers of the consumer group.

Normally, topic partitions are assigned using the round robin partitioner, which assigns topic partitions to a collection of consumers sorted by consumer names which are randomly set on application launch. However, when a new consumer joins the consumer group, the new consumer can be positioned anywhere within the collection of consumers. This creates a condition where pre-existing consumers can be assigned different partitions when the pre-existing consumer is positioned after the new consumer. As a result, the consumers that are assigned different partitions will lose response messages of requests sent before the rebalance.

To prevent the `ClientKafkaProxy` consumers from losing response messages, a Nest-specific built-in custom partitioner is utilized. This custom partitioner assigns partitions to a collection of consumers sorted by high-resolution timestamps (`process.hrtime()`) that are set on application launch.

#### Message response subscription

> warning **Note** This section is only relevant if you use [request-response](/microservices/basics#request-response) message style (with the `@MessagePattern` decorator and the `ClientKafkaProxy.send` method). Subscribing to the response topic is not necessary for the [event-based](/microservices/basics#event-based) communication (`@EventPattern` decorator and `ClientKafkaProxy.emit` method).

The `ClientKafkaProxy` class provides the `subscribeToResponseOf()` method. The `subscribeToResponseOf()` method takes a request's topic name as an argument and adds the derived reply topic name to a collection of reply topics. This method is required when implementing the message pattern.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

If the `ClientKafkaProxy` instance is created asynchronously, the `subscribeToResponseOf()` method must be called before calling the `connect()` method.

```typescript
@@filename(heroes.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### Incoming

Nest receives incoming Kafka messages as an object with `key`, `value`, and `headers` properties that have values of type `Buffer`. Nest then parses these values by transforming the buffers into strings. If the string is "object like", Nest attempts to parse the string as `JSON`. The `value` is then passed to its associated handler.

#### Outgoing

Nest sends outgoing Kafka messages after a serialization process when publishing events or sending messages. This occurs on arguments passed to the `ClientKafkaProxy` `emit()` and `send()` methods or on values returned from a `@MessagePattern` method. This serialization "stringifies" objects that are not strings or buffers by using `JSON.stringify()` or the `toString()` prototype method.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const dragonId = message.dragonId;
    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];
    return items;
  }
}
```

> info **Hint** `@Payload()` is imported from the `@nestjs/microservices` package.

Outgoing messages can also be keyed by passing an object with the `key` and `value` properties. Keying messages is important for meeting the [co-partitioning requirement](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        realm
      },
      key: heroId,
      value: items
    }
  }
}
```

Additionally, messages passed in this format can also contain custom headers set in the `headers` hash property. Header hash property values must be either of type `string` or type `Buffer`.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        kafka_nestRealm: realm
      },
      key: heroId,
      value: items
    }
  }
}
```

#### Event-based

While the request-response method is ideal for exchanging messages between services, it is less suitable when your message style is event-based (which in turn is ideal for Kafka) - when you just want to publish events **without waiting for a response**. In that case, you do not want the overhead required by request-response for maintaining two topics.

Check out these two sections to learn more about this: [Overview: Event-based](/microservices/basics#event-based) and [Overview: Publishing events](/microservices/basics#publishing-events).

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the Kafka transporter, you can access the `KafkaContext` object.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `KafkaContext` are imported from the `@nestjs/microservices` package.

To access the original Kafka `IncomingMessage` object, use the `getMessage()` method of the `KafkaContext` object, as follows:

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
```

Where the `IncomingMessage` fulfills the following interface:

```typescript
interface IncomingMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  key: any;
  value: any;
  headers: Record<string, any>;
}
```

If your handler involves a slow processing time for each received message you should consider using the `heartbeat` callback. To retrieve the `heartbeat` function, use the `getHeartbeat()` method of the `KafkaContext`, as follows:

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
async killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const heartbeat = context.getHeartbeat();

  // Do some slow processing
  await doWorkPart1();

  // Send heartbeat to not exceed the sessionTimeout
  await heartbeat();

  // Do some slow processing again
  await doWorkPart2();
}
```

#### Naming conventions

The Kafka microservice components append a description of their respective role onto the `client.clientId` and `consumer.groupId` options to prevent collisions between Nest microservice client and server components. By default the `ClientKafkaProxy` components append `-client` and the `ServerKafka` components append `-server` to both of these options. Note how the provided values below are transformed in that way (as shown in the comments).

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-server
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-server
    },
  }
});
```

And for the client:

```typescript
@@filename(heroes.controller)
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-client
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-client
    }
  }
})
client: ClientKafkaProxy;
```

> info **Hint** Kafka client and consumer naming conventions can be customized by extending `ClientKafkaProxy` and `KafkaServer` in your own custom provider and overriding the constructor.

Since the Kafka microservice message pattern utilizes two topics for the request and reply channels, a reply pattern should be derived from the request topic. By default, the name of the reply topic is the composite of the request topic name with `.reply` appended.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```

> info **Hint** Kafka reply topic naming conventions can be customized by extending `ClientKafkaProxy` in your own custom provider and overriding the `getResponsePatternName` method.

#### Retriable exceptions

Similar to other transporters, all unhandled exceptions are automatically wrapped into an `RpcException` and converted to a "user-friendly" format. However, there are edge-cases when you might want to bypass this mechanism and let exceptions be consumed by the `kafkajs` driver instead. Throwing an exception when processing a message instructs `kafkajs` to **retry** it (redeliver it) which means that even though the message (or event) handler was triggered, the offset won't be committed to Kafka.

> warning **Warning** For event handlers (event-based communication), all unhandled exceptions are considered **retriable exceptions** by default.

For this, you can use a dedicated class called `KafkaRetriableException`, as follows:

```typescript
throw new KafkaRetriableException('...');
```

> info **Hint** `KafkaRetriableException` class is exported from the `@nestjs/microservices` package.

### Custom exception handling

Along with the default error handling mechanisms, you can create a custom Exception Filter for Kafka events to manage retry logic. For instance, the example below demonstrates how to skip a problematic event after a configurable number of retries:

```typescript
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { KafkaContext } from '../ctx-host';

@Catch()
export class KafkaMaxRetryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(KafkaMaxRetryExceptionFilter.name);

  constructor(
    private readonly maxRetries: number,
    // Optional custom function executed when max retries are exceeded
    private readonly skipHandler?: (message: any) => Promise<void>,
  ) {
    super();
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const kafkaContext = host.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const currentRetryCount = this.getRetryCountFromContext(kafkaContext);

    if (currentRetryCount >= this.maxRetries) {
      this.logger.warn(
        `Max retries (${
          this.maxRetries
        }) exceeded for message: ${JSON.stringify(message)}`,
      );

      if (this.skipHandler) {
        try {
          await this.skipHandler(message);
        } catch (err) {
          this.logger.error('Error in skipHandler:', err);
        }
      }

      try {
        await this.commitOffset(kafkaContext);
      } catch (commitError) {
        this.logger.error('Failed to commit offset:', commitError);
      }
      return; // Stop propagating the exception
    }

    // If retry count is below the maximum, proceed with the default Exception Filter logic
    super.catch(exception, host);
  }

  private getRetryCountFromContext(context: KafkaContext): number {
    const headers = context.getMessage().headers || {};
    const retryHeader = headers['retryCount'] || headers['retry-count'];
    return retryHeader ? Number(retryHeader) : 0;
  }

  private async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer && context.getConsumer();
    if (!consumer) {
      throw new Error('Consumer instance is not available from KafkaContext.');
    }

    const topic = context.getTopic && context.getTopic();
    const partition = context.getPartition && context.getPartition();
    const message = context.getMessage();
    const offset = message.offset;

    if (!topic || partition === undefined || offset === undefined) {
      throw new Error(
        'Incomplete Kafka message context for committing offset.',
      );
    }

    await consumer.commitOffsets([
      {
        topic,
        partition,
        // When committing an offset, commit the next number (i.e., current offset + 1)
        offset: (Number(offset) + 1).toString(),
      },
    ]);
  }
}
```

This filter offers a way to retry processing a Kafka event up to a configurable number of times. Once the maximum retries are reached, it triggers a custom `skipHandler` (if provided) and commits the offset, effectively skipping the problematic event. This allows subsequent events to be processed without interruption.

You can integrate this filter by adding it to your event handlers:

```typescript
@UseFilters(new KafkaMaxRetryExceptionFilter(5))
export class MyEventHandler {
  @EventPattern('your-topic')
  async handleEvent(@Payload() data: any, @Ctx() context: KafkaContext) {
    // Your event processing logic...
  }
}
```

#### Commit offsets

Committing offsets is essential when working with Kafka. Per default, messages will be automatically committed after a specific time. For more information visit [KafkaJS docs](https://kafka.js.org/docs/consuming#autocommit). `KafkaContext` offers a way to access the active consumer for manually committing offsets. The consumer is the KafkaJS consumer and works as the [native KafkaJS implementation](https://kafka.js.org/docs/consuming#manual-committing).

```typescript
@@filename()
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
@@switch
@Bind(Payload(), Ctx())
@EventPattern('user.created')
async handleUserCreated(data, context) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
```

To disable auto-committing of messages set `autoCommit: false` in the `run` configuration, as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the Kafka driver, the `status` stream emits `connected`, `disconnected`, `rebalancing`, `crashed`, and `stopped` events.

```typescript
this.client.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

> info **Hint** The `KafkaStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

#### Underlying producer and consumer

For more advanced use cases, you may need to access the underlying producer and consumer instances. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use `producer` and `consumer` getters exposed by the `ClientKafkaProxy` instance.

```typescript
const producer = this.client.producer;
const consumer = this.client.consumer;
```


---

## MQTT

### MQTT

[MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol, optimized for low latency. This protocol provides a scalable and cost-efficient way to connect devices using a **publish/subscribe** model. A communication system built on MQTT consists of the publishing server, a broker and one or more clients. It is designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

#### Installation

To start building MQTT-based microservices, first install the required package:

```bash
$ npm i --save mqtt
```

#### Overview

To use the MQTT transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` object is specific to the chosen transporter. The <strong>MQTT</strong> transporter exposes the properties described [here](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options).

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a MQTT `ClientProxy` instance.

One method for creating an instance is to use use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://localhost:1883',
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the MQTT transporter, you can access the `MqttContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `MqttContext` are imported from the `@nestjs/microservices` package.

To access the original mqtt [packet](https://github.com/mqttjs/mqtt-packet), use the `getPacket()` method of the `MqttContext` object, as follows:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(context.getPacket());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getPacket());
}
```

#### Wildcards

A subscription may be to an explicit topic, or it may include wildcards. Two wildcards are available, `+` and `#`. `+` is a single-level wildcard, while `#` is a multi-level wildcard which covers many topic levels.

```typescript
@@filename()
@MessagePattern('sensors/+/temperature/+')
getTemperature(@Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Ctx())
@MessagePattern('sensors/+/temperature/+')
getTemperature(context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

#### Quality of Service (QoS)

Any subscription created with `@MessagePattern` or `@EventPattern` decorators will subscribe with QoS 0. If a higher QoS is required, it can be set globally using the `subscribeOptions` block when establishing the connection as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
```

If a topic specific QoS is required, consider creating a [Custom transporter](https://docs.nestjs.com/microservices/custom-transport).

#### Record builders

To configure message options (adjust the QoS level, set the Retain or DUP flags, or add additional properties to the payload), you can use the `MqttRecordBuilder` class. For example, to set `QoS` to `2` use the `setQoS` method, as follows:

```typescript
const userProperties = { 'x-version': '1.0.0' };
const record = new MqttRecordBuilder(':cat:')
  .setProperties({ userProperties })
  .setQoS(1)
  .build();
client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** `MqttRecordBuilder` class is exported from the `@nestjs/microservices` package.

And you can read these options on the server-side as well, by accessing the `MqttContext`.

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: MqttContext): string {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

In some cases you might want to configure user properties for multiple requests, you can pass these options to the `ClientProxyFactory`.

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: 'mqtt://localhost:1833',
            userProperties: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the MQTT driver, the `status` stream emits `connected`, `disconnected`, `reconnecting`, and `closed` events.

```typescript
this.client.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

> info **Hint** The `MqttStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

#### Listening to MQTT events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<MqttEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `MqttEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const mqttClient = this.client.unwrap<import('mqtt').MqttClient>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const mqttClient = server.unwrap<import('mqtt').MqttClient>();
```


---

## NATS

### NATS

[NATS](https://nats.io) is a simple, secure and high performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures. The NATS server is written in the Go programming language, but client libraries to interact with the server are available for dozens of major programming languages. NATS supports both **At Most Once** and **At Least Once** delivery. It can run anywhere, from large servers and cloud instances, through edge gateways and even Internet of Things devices.

#### Installation

To start building NATS-based microservices, first install the required package:

```bash
$ npm i --save nats
```

#### Overview

To use the NATS transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` object is specific to the chosen transporter. The <strong>NATS</strong> transporter exposes the properties described [here](https://github.com/nats-io/node-nats#connection-options) as well as the following properties:

<table>
  <tr>
    <td><code>queue</code></td>
    <td>Queue that your server should subscribe to (leave <code>undefined</code> to ignore this setting). Read more about NATS queue groups <a href="https://docs.nestjs.com/microservices/nats#queue-groups">below</a>.
    </td> 
  </tr>
  <tr>
    <td><code>gracefulShutdown</code></td>
    <td>Enables graceful shutdown. When enabled, the server first unsubscribes from all channels before closing the connection. Default is <code>false</code>.
  </tr>
  <tr>
    <td><code>gracePeriod</code></td>
    <td>Time in milliseconds to wait for the server after unsubscribing from all channels. Default is <code>10000</code> ms.
  </tr>
</table>

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a NATS `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Request-response

For the **request-response** message style ([read more](https://docs.nestjs.com/microservices/basics#request-response)), the NATS transporter does not use the NATS built-in [Request-Reply](https://docs.nats.io/nats-concepts/reqreply) mechanism. Instead, a "request" is published on a given subject using the `publish()` method with a unique reply subject name, and responders listen on that subject and send responses to the reply subject. Reply subjects are directed back to the requestor dynamically, regardless of location of either party.

#### Event-based

For the **event-based** message style ([read more](https://docs.nestjs.com/microservices/basics#event-based)), the NATS transporter uses NATS built-in [Publish-Subscribe](https://docs.nats.io/nats-concepts/pubsub) mechanism. A publisher sends a message on a subject and any active subscriber listening on that subject receives the message. Subscribers can also register interest in wildcard subjects that work a bit like a regular expression. This one-to-many pattern is sometimes called fan-out.

#### Queue groups

NATS provides a built-in load balancing feature called [distributed queues](https://docs.nats.io/nats-concepts/queue). To create a queue subscription, use the `queue` property as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'cats_queue',
  },
});
```

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the NATS transporter, you can access the `NatsContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Subject: ${context.getSubject()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are imported from the `@nestjs/microservices` package.

#### Wildcards

A subscription may be to an explicit subject, or it may include wildcards.

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

#### Record builders

To configure message options, you can use the `NatsRecordBuilder` class (note: this is doable for event-based flows as well). For example, to add `x-version` header, use the `setHeaders` method, as follows:

```typescript
import * as nats from 'nats';

// somewhere in your code
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** `NatsRecordBuilder` class is exported from the `@nestjs/microservices` package.

And you can read these headers on the server-side as well, by accessing the `NatsContext`, as follows:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

In some cases you might want to configure headers for multiple requests, you can pass these as options to the `ClientProxyFactory`:

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: ['nats://localhost:4222'],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the NATS driver, the `status` stream emits `connected`, `disconnected`, and `reconnecting` events.

```typescript
this.client.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

> info **Hint** The `NatsStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

#### Listening to Nats events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<NatsEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `NatsEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const natsConnection = this.client.unwrap<import('nats').NatsConnection>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const natsConnection = server.unwrap<import('nats').NatsConnection>();
```


---

## Overview

### Overview

In addition to traditional (sometimes called monolithic) application architectures, Nest natively supports the microservice architectural style of development. Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to microservices. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to microservices.

In Nest, a microservice is fundamentally an application that uses a different **transport** layer than HTTP.

<figure><img class="illustrative-image" src="/assets/Microservices_1.png" /></figure>

Nest supports several built-in transport layer implementations, called **transporters**, which are responsible for transmitting messages between different microservice instances. Most transporters natively support both **request-response** and **event-based** message styles. Nest abstracts the implementation details of each transporter behind a canonical interface for both request-response and event-based messaging. This makes it easy to switch from one transport layer to another -- for example to leverage the specific reliability or performance features of a particular transport layer -- without impacting your application code.

#### Installation

To start building microservices, first install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Getting started

To instantiate a microservice, use the `createMicroservice()` method of the `NestFactory` class:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  await app.listen();
}
bootstrap();
```

> info **Hint** Microservices use the **TCP** transport layer by default.

The second argument of the `createMicroservice()` method is an `options` object. This object may consist of two members:

<table>
  <tr>
    <td><code>transport</code></td>
    <td>Specifies the transporter (for example, <code>Transport.NATS</code>)</td>
  </tr>
  <tr>
    <td><code>options</code></td>
    <td>A transporter-specific options object that determines transporter behavior</td>
  </tr>
</table>
<p>
  The <code>options</code> object is specific to the chosen transporter. The <strong>TCP</strong> transporter exposes
  the properties described below.  For other transporters (e.g, Redis, MQTT, etc.), see the relevant chapter for a description of the available options.
</p>
<table>
  <tr>
    <td><code>host</code></td>
    <td>Connection hostname</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Connection port</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of times to retry message (default: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between message retry attempts (ms) (default: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>serializer</code></td>
    <td>Custom <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/serializer.interface.ts" target="_blank">serializer</a> for outgoing messages</td>
  </tr>
  <tr>
    <td><code>deserializer</code></td>
    <td>Custom <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/deserializer.interface.ts" target="_blank">deserializer</a> for incoming messages</td>
  </tr>
  <tr>
    <td><code>socketClass</code></td>
    <td>A custom Socket that extends <code>TcpSocket</code> (default: <code>JsonSocket</code>)</td>
  </tr>
  <tr>
    <td><code>tlsOptions</code></td>
    <td>Options to configure the tls protocol</td>
  </tr>
</table>

> info **Hint** The above properties are specific to the TCP transporter. For information on available options for other transporters, refer to the relevant chapter.

#### Message and Event Patterns

Microservices recognize both messages and events by **patterns**. A pattern is a plain value, for example, a literal object or a string. Patterns are automatically serialized and sent over the network along with the data portion of a message. In this way, message senders and consumers can coordinate which requests are consumed by which handlers.

#### Request-response

The request-response message style is useful when you need to **exchange** messages between various external services. This paradigm ensures that the service has actually received the message (without requiring you to manually implement an acknowledgment protocol). However, the request-response approach may not always be the best fit. For example, streaming transporters, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming), which use log-based persistence, are optimized for addressing a different set of challenges, more aligned with the event messaging paradigm (see [event-based messaging](https://docs.nestjs.com/microservices/basics#event-based) for more details).

To enable the request-response message type, Nest creates two logical channels: one for transferring data and another for waiting for incoming responses. For some underlying transports, like [NATS](https://nats.io/), this dual-channel support is provided out-of-the-box. For others, Nest compensates by manually creating separate channels. While this is effective, it can introduce some overhead. Therefore, if you don’t require a request-response message style, you may want to consider using the event-based method.

To create a message handler based on the request-response paradigm, use the `@MessagePattern()` decorator, which is imported from the `@nestjs/microservices` package. This decorator should only be used within [controller](https://docs.nestjs.com/controllers) classes, as they serve as the entry points for your application. Using it in providers will have no effect, as they will be ignored by the Nest runtime.

```typescript
@@filename(math.controller)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
@@switch
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
```

In the above code, the `accumulate()` **message handler** listens for messages that match the `{{ '{' }} cmd: 'sum' {{ '}' }}` message pattern. The message handler takes a single argument, the `data` passed from the client. In this case, the data is an array of numbers that need to be accumulated.

#### Asynchronous responses

Message handlers can respond either synchronously or **asynchronously**, meaning that `async` methods are supported.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
async accumulate(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@MessagePattern({ cmd: 'sum' })
async accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

A message handler can also return an `Observable`, in which case the result values will be emitted until the stream completes.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
@@switch
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
```

In the example above, the message handler will respond **three times**, once for each item in the array.

#### Event-based

While the request-response method is perfect for exchanging messages between services, it is less suited for event-based messaging—when you simply want to publish **events** without waiting for a response. In such cases, the overhead of maintaining two channels for request-response is unnecessary.

For example, if you want to notify another service that a specific condition has occurred in this part of the system, the event-based message style is ideal.

To create an event handler, you can use the `@EventPattern()` decorator, which is imported from the `@nestjs/microservices` package.

```typescript
@@filename()
@EventPattern('user_created')
async handleUserCreated(data: Record<string, unknown>) {
  // business logic
}
@@switch
@EventPattern('user_created')
async handleUserCreated(data) {
  // business logic
}
```

> info **Hint** You can register multiple event handlers for a **single** event pattern, and all of them will be automatically triggered in parallel.

The `handleUserCreated()` **event handler** listens for the `'user_created'` event. The event handler takes a single argument, the `data` passed from the client (in this case, an event payload which has been sent over the network).

<app-banner-enterprise></app-banner-enterprise>

#### Additional request details

In more advanced scenarios, you might need to access additional details about the incoming request. For instance, when using NATS with wildcard subscriptions, you may want to retrieve the original subject that the producer sent the message to. Similarly, with Kafka, you may need to access the message headers. To achieve this, you can leverage built-in decorators as shown below:

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are imported from `@nestjs/microservices`.

> info **Hint** You can also pass in a property key to the `@Payload()` decorator to extract a specific property from the incoming payload object, for example, `@Payload('id')`.

#### Client (producer class)

A client Nest application can exchange messages or publish events to a Nest microservice using the `ClientProxy` class. This class provides several methods, such as `send()` (for request-response messaging) and `emit()` (for event-driven messaging), enabling communication with a remote microservice. You can obtain an instance of this class in the following ways:

One approach is to import the `ClientsModule`, which exposes the static `register()` method. This method takes an array of objects representing microservice transporters. Each object must include a `name` property, and optionally a `transport` property (defaulting to `Transport.TCP`), as well as an optional `options` property.

The `name` property acts as an **injection token**, which you can use to inject an instance of `ClientProxy` wherever needed. The value of this `name` property can be any arbitrary string or JavaScript symbol, as described [here](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens).

The `options` property is an object that includes the same properties we saw in the `createMicroservice()` method earlier.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP },
    ]),
  ],
})
```

Alternatively, you can use the `registerAsync()` method if you need to provide configuration or perform any other asynchronous processes during the setup.

```typescript
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'MATH_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            url: configService.get('URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
```

Once the module has been imported, you can inject an instance of the `ClientProxy` configured with the specified options for the `'MATH_SERVICE'` transporter using the `@Inject()` decorator.

```typescript
constructor(
  @Inject('MATH_SERVICE') private client: ClientProxy,
) {}
```

> info **Hint** The `ClientsModule` and `ClientProxy` classes are imported from the `@nestjs/microservices` package.

At times, you may need to fetch the transporter configuration from another service (such as a `ConfigService`), rather than hard-coding it in your client application. To achieve this, you can register a [custom provider](/fundamentals/custom-providers) using the `ClientProxyFactory` class. This class provides a static `create()` method that accepts a transporter options object and returns a customized `ClientProxy` instance.

```typescript
@Module({
  providers: [
    {
      provide: 'MATH_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mathSvcOptions = configService.getMathSvcOptions();
        return ClientProxyFactory.create(mathSvcOptions);
      },
      inject: [ConfigService],
    }
  ]
  ...
})
```

> info **Hint** The `ClientProxyFactory` is imported from the `@nestjs/microservices` package.

Another option is to use the `@Client()` property decorator.

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **Hint** The `@Client()` decorator is imported from the `@nestjs/microservices` package.

Using the `@Client()` decorator is not the preferred technique, as it is harder to test and harder to share a client instance.

The `ClientProxy` is **lazy**. It doesn't initiate a connection immediately. Instead, it will be established before the first microservice call, and then reused across each subsequent call. However, if you want to delay the application bootstrapping process until a connection is established, you can manually initiate a connection using the `ClientProxy` object's `connect()` method inside the `OnApplicationBootstrap` lifecycle hook.

```typescript
@@filename()
async onApplicationBootstrap() {
  await this.client.connect();
}
```

If the connection cannot be created, the `connect()` method will reject with the corresponding error object.

#### Sending messages

The `ClientProxy` exposes a `send()` method. This method is intended to call the microservice and returns an `Observable` with its response. Thus, we can subscribe to the emitted values easily.

```typescript
@@filename()
accumulate(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
@@switch
accumulate() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
```

The `send()` method takes two arguments, `pattern` and `payload`. The `pattern` should match one defined in a `@MessagePattern()` decorator. The `payload` is a message that we want to transmit to the remote microservice. This method returns a **cold `Observable`**, which means that you have to explicitly subscribe to it before the message will be sent.

#### Publishing events

To send an event, use the `ClientProxy` object's `emit()` method. This method publishes an event to the message broker.

```typescript
@@filename()
async publish() {
  this.client.emit<number>('user_created', new UserCreatedEvent());
}
@@switch
async publish() {
  this.client.emit('user_created', new UserCreatedEvent());
}
```

The `emit()` method takes two arguments: `pattern` and `payload`. The `pattern` should match one defined in an `@EventPattern()` decorator, while the `payload` represents the event data that you want to transmit to the remote microservice. This method returns a **hot `Observable`** (in contrast to the cold `Observable` returned by `send()`), meaning that regardless of whether you explicitly subscribe to the observable, the proxy will immediately attempt to deliver the event.

<app-banner-devtools></app-banner-devtools>

#### Request-scoping

For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is **safe** for our applications.

However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes [here](/fundamentals/injection-scopes).

Request-scoped handlers and providers can inject `RequestContext` using the `@Inject()` decorator in combination with the `CONTEXT` token:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private ctx: RequestContext) {}
}
```

This provides access to the `RequestContext` object, which has two properties:

```typescript
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
```

The `data` property is the message payload sent by the message producer. The `pattern` property is the pattern used to identify an appropriate handler to handle the incoming message.

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For instance, if you’re using the TCP transporter (the default), the `status` stream emits `connected` and `disconnected` events.

```typescript
this.client.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

> info **Hint** The `TcpStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

#### Listening to internal events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<TcpEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `TcpEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const netServer = this.client.unwrap<Server>();
```

Here, `Server` is a type imported from the `net` module.

Similarly, you can access the server's underlying driver instance:

```typescript
const netServer = server.unwrap<Server>();
```

#### Handling timeouts

In distributed systems, microservices might sometimes be down or unavailable. To prevent indefinitely long waiting, you can use timeouts. A timeout is a highly useful pattern when communicating with other services. To apply timeouts to your microservice calls, you can use the [RxJS](https://rxjs.dev) `timeout` operator. If the microservice does not respond within the specified time, an exception is thrown, which you can catch and handle appropriately.

To implement this, you'll need to use the [`rxjs`](https://github.com/ReactiveX/rxjs) package. Simply use the `timeout` operator within the pipe:

```typescript
@@filename()
this.client
  .send<TResult, TInput>(pattern, data)
  .pipe(timeout(5000));
@@switch
this.client
  .send(pattern, data)
  .pipe(timeout(5000));
```

> info **Hint** The `timeout` operator is imported from the `rxjs/operators` package.

After 5 seconds, if the microservice isn't responding, it will throw an error.

#### TLS support

When communicating outside of a private network, it’s important to encrypt traffic to ensure security. In NestJS, this can be achieved with TLS over TCP using Node's built-in [TLS](https://nodejs.org/api/tls.html) module. Nest provides built-in support for TLS in its TCP transport, allowing us to encrypt communication between microservices or clients.

To enable TLS for a TCP server, you'll need both a private key and a certificate in PEM format. These are added to the server's options by setting the `tlsOptions` and specifying the key and cert files, as shown below:

```typescript
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const key = fs.readFileSync('<pathToKeyFile>', 'utf8').toString();
  const cert = fs.readFileSync('<pathToCertFile>', 'utf8').toString();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        tlsOptions: {
          key,
          cert,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
```

For a client to communicate securely over TLS, we also define the `tlsOptions` object but this time with the CA certificate. This is the certificate of the authority that signed the server's certificate. This ensures that the client trusts the server's certificate and can establish a secure connection.

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          tlsOptions: {
            ca: [fs.readFileSync('<pathToCaFile>', 'utf-8').toString()],
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
```

You can also pass an array of CAs if your setup involves multiple trusted authorities.

Once everything is set up, you can inject the `ClientProxy` as usual using the `@Inject()` decorator to use the client in your services. This ensures encrypted communication across your NestJS microservices, with Node's `TLS` module handling the encryption details.

For more information, refer to Node’s [TLS documentation](https://nodejs.org/api/tls.html).

#### Dynamic configuration

When a microservice needs to be configured using the `ConfigService` (from the `@nestjs/config` package), but the injection context is only available after the microservice instance is created, `AsyncMicroserviceOptions` offers a solution. This approach allows for dynamic configuration, ensuring smooth integration with the `ConfigService`.

```typescript
import { ConfigService } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('HOST'),
          port: configService.get<number>('PORT'),
        },
      }),
      inject: [ConfigService],
    },
  );

  await app.listen();
}
bootstrap();
```


---

## Platform agnosticism

### Platform agnosticism

Nest is a platform-agnostic framework. This means you can develop **reusable logical parts** that can be used across different types of applications. For example, most components can be re-used without change across different underlying HTTP server frameworks (e.g., Express and Fastify), and even across different _types_ of applications (e.g., HTTP server frameworks, Microservices with different transport layers, and Web Sockets).

#### Build once, use everywhere

The **Overview** section of the documentation primarily shows coding techniques using HTTP server frameworks (e.g., apps providing a REST API or providing an MVC-style server-side rendered app). However, all those building blocks can be used on top of different transport layers ([microservices](/microservices/basics) or [websockets](/websockets/gateways)).

Furthermore, Nest comes with a dedicated [GraphQL](/graphql/quick-start) module. You can use GraphQL as your API layer interchangeably with providing a REST API.

In addition, the [application context](/application-context) feature helps to create any kind of Node.js application - including things like CRON jobs and CLI apps - on top of Nest.

Nest aspires to be a full-fledged platform for Node.js apps that brings a higher-level of modularity and reusability to your applications. Build once, use everywhere!


---

## RabbitMQ

### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/) is an open-source and lightweight message broker which supports multiple messaging protocols. It can be deployed in distributed and federated configurations to meet high-scale, high-availability requirements. In addition, it's the most widely deployed message broker, used worldwide at small startups and large enterprises.

#### Installation

To start building RabbitMQ-based microservices, first install the required packages:

```bash
$ npm i --save amqplib amqp-connection-manager
```

#### Overview

To use the RabbitMQ transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>RabbitMQ</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>An array of connection URLs to try in order</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>Queue name which your server will listen to</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>Sets the prefetch count for the channel</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>Enables per channel prefetching</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td>If <code>false</code>, manual acknowledgment mode enabled</td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>A name which the server will use to distinguish message deliveries for the consumer; mustn’t be already in use on the channel. It’s usually easier to omit this, in which case the server will create a random name and supply it in the reply. Consumer Tag Identifier (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>queueOptions</code></td>
    <td>Additional queue options (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Additional socket options (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#connect" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>Headers to be sent along with every message</td>
  </tr>
  <tr>
    <td><code>replyQueue</code></td>
    <td>Reply queue for the producer. Default is <code>amq.rabbitmq.reply-to</code></td>
  </tr>
  <tr>
    <td><code>persistent</code></td>
    <td>If truthy, the message will survive broker restarts provided it’s in a queue that also survives restarts</td>
  </tr>
  <tr>
    <td><code>noAssert</code></td>
    <td>When false, a queue will not be asserted before consuming</td>
  </tr>
  <tr>
    <td><code>wildcards</code></td>
    <td>Set to true only if you want to use Topic Exchange for routing messages to queues. Enabling this will allow you to use wildcards (*, #) as message and event patterns</td>
  </tr>
  <tr>
    <td><code>exchange</code></td>
    <td>Name for the exchange. Defaults to the queue name when "wildcards" is set to true</td>
  </tr>
  <tr>
    <td><code>exchangeType</code></td>
    <td>Type of the exchange. Default is <code>topic</code>. Valid values are <code>direct</code>, <code>fanout</code>, <code>topic</code>, and <code>headers</code></td>
  </tr>
  <tr>
    <td><code>routingKey</code></td>
    <td>Additional routing key for the topic exchange</td>
  </tr>
  <tr>
    <td><code>maxConnectionAttempts</code></td>
    <td>Maximum number of connection attempts. Applies only to the consumer configuration. -1 === infinite</td>
  </tr>
</table>

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a RabbitMQ `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the RabbitMQ transporter, you can access the `RmqContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(`Pattern: ${context.getPattern()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Pattern: ${context.getPattern()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `RmqContext` are imported from the `@nestjs/microservices` package.

To access the original RabbitMQ message (with the `properties`, `fields`, and `content`), use the `getMessage()` method of the `RmqContext` object, as follows:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getMessage());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
```

To retrieve a reference to the RabbitMQ [channel](https://www.rabbitmq.com/channels.html), use the `getChannelRef` method of the `RmqContext` object, as follows:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getChannelRef());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getChannelRef());
}
```

#### Message acknowledgement

To make sure a message is never lost, RabbitMQ supports [message acknowledgements](https://www.rabbitmq.com/confirms.html). An acknowledgement is sent back by the consumer to tell RabbitMQ that a particular message has been received, processed and that RabbitMQ is free to delete it. If a consumer dies (its channel is closed, connection is closed, or TCP connection is lost) without sending an ack, RabbitMQ will understand that a message wasn't processed fully and will re-queue it.

To enable manual acknowledgment mode, set the `noAck` property to `false`:

```typescript
options: {
  urls: ['amqp://localhost:5672'],
  queue: 'cats_queue',
  noAck: false,
  queueOptions: {
    durable: false
  },
},
```

When manual consumer acknowledgements are turned on, we must send a proper acknowledgement from the worker to signal that we are done with a task.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
```

#### Record builders

To configure message options, you can use the `RmqRecordBuilder` class (note: this is doable for event-based flows as well). For example, to set `headers` and `priority` properties, use the `setOptions` method, as follows:

```typescript
const message = ':cat:';
const record = new RmqRecordBuilder(message)
  .setOptions({
    headers: {
      ['x-version']: '1.0.0',
    },
    priority: 3,
  })
  .build();

this.client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** `RmqRecordBuilder` class is exported from the `@nestjs/microservices` package.

And you can read these values on the server-side as well, by accessing the `RmqContext`, as follows:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: RmqContext): string {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the RMQ driver, the `status` stream emits `connected` and `disconnected` events.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **Hint** The `RmqStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### Listening to RabbitMQ events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<RmqEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `RmqEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const managerRef =
  this.client.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const managerRef =
  server.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

#### Wildcards

RabbitMQ supports the use of wildcards in routing keys to allow for flexible message routing. The `#` wildcard matches zero or more words, while the `*` wildcard matches exactly one word.

For example, the routing key `cats.#` matches `cats`, `cats.meow`, and `cats.meow.purr`. The routing key `cats.*` matches `cats.meow` but not `cats.meow.purr`.

To enable wildcard support in your RabbitMQ microservice, set the `wildcards` configuration option to `true` in the options object:

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'cats_queue',
      wildcards: true,
    },
  },
);
```

With this configuration, you can use wildcards in your routing keys when subscribing to events/messages. For example, to listen for messages with the routing key `cats.#`, you can use the following code:

```typescript
@MessagePattern('cats.#')
getCats(@Payload() data: { message: string }, @Ctx() context: RmqContext) {
  console.log(`Received message with routing key: ${context.getPattern()}`);

  return {
    message: 'Hello from the cats service!',
  }
}
```

To send a message with a specific routing key, you can use the `send()` method of the `ClientProxy` instance:

```typescript
this.client.send('cats.meow', { message: 'Meow!' }).subscribe((response) => {
  console.log(response);
});
```


---

## Redis

### Redis

The [Redis](https://redis.io/) transporter implements the publish/subscribe messaging paradigm and leverages the [Pub/Sub](https://redis.io/topics/pubsub) feature of Redis. Published messages are categorized in channels, without knowing what subscribers (if any) will eventually receive the message. Each microservice can subscribe to any number of channels. In addition, more than one channel can be subscribed to at a time. Messages exchanged through channels are **fire-and-forget**, which means that if a message is published and there are no subscribers interested in it, the message is removed and cannot be recovered. Thus, you don't have a guarantee that either messages or events will be handled by at least one service. A single message can be subscribed to (and received) by multiple subscribers.

<figure><img class="illustrative-image" src="/assets/Redis_1.png" /></figure>

#### Installation

To start building Redis-based microservices, first install the required package:

```bash
$ npm i --save ioredis
```

#### Overview

To use the Redis transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>Redis</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>host</code></td>
    <td>Connection url</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Connection port</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of times to retry message (default: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between message retry attempts (ms) (default: <code>0</code>)</td>
  </tr>
   <tr>
    <td><code>wildcards</code></td>
    <td>Enables Redis wildcard subscriptions, instructing transporter to use <code>psubscribe</code>/<code>pmessage</code> under the hood. (default: <code>false</code>)</td>
  </tr>
</table>

All the properties supported by the official [ioredis](https://redis.github.io/ioredis/index.html#RedisOptions) client are also supported by this transporter.

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a Redis `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the Redis transporter, you can access the `RedisContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RedisContext) {
  console.log(`Channel: ${context.getChannel()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Channel: ${context.getChannel()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `RedisContext` are imported from the `@nestjs/microservices` package.

#### Wildcards

To enable wildcards support, set the `wildcards` option to `true`. This instructs the transporter to use `psubscribe` and `pmessage` under the hood.

```typescript
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    // Other options
    wildcards: true,
  },
});
```

Make sure to pass the `wildcards` option when creating a client instance as well.

With this option enabled, you can use wildcards in your message and event patterns. For example, to subscribe to all channels starting with `notifications`, you can use the following pattern:

```typescript
@EventPattern('notifications.*')
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the Redis driver, the `status` stream emits `connected`, `disconnected`, and `reconnecting` events.

```typescript
this.client.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

> info **Hint** The `RedisStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
```

#### Listening to Redis events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<RedisEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `RedisEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const [pub, sub] =
  this.client.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const [pub, sub] =
  server.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
```

Note that, in contrary to other transporters, the Redis transporter returns a tuple of two `ioredis` instances: the first one is used for publishing messages, and the second one is used for subscribing to messages.


---

## gRPC

### gRPC

[gRPC](https://github.com/grpc/grpc-node) is a modern, open source, high performance RPC framework that can run in any environment. It can efficiently connect services in and across data centers with pluggable support for load balancing, tracing, health checking and authentication.

Like many RPC systems, gRPC is based on the concept of defining a service in terms of functions (methods) that can be called remotely. For each method, you define the parameters and return types. Services, parameters, and return types are defined in `.proto` files using Google's open source language-neutral <a href="https://protobuf.dev">protocol buffers</a> mechanism.

With the gRPC transporter, Nest uses `.proto` files to dynamically bind clients and servers to make it easy to implement remote procedure calls, automatically serializing and deserializing structured data.

#### Installation

To start building gRPC-based microservices, first install the required packages:

```bash
$ npm i --save @grpc/grpc-js @grpc/proto-loader
```

#### Overview

Like other Nest microservices transport layer implementations, you select the gRPC transporter mechanism using the `transport` property of the options object passed to the `createMicroservice()` method. In the following example, we'll set up a hero service. The `options` property provides metadata about that service; its properties are described <a href="microservices/grpc#options">below</a>.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
```

> info **Hint** The `join()` function is imported from the `path` package; the `Transport` enum is imported from the `@nestjs/microservices` package.

In the `nest-cli.json` file, we add the `assets` property that allows us to distribute non-TypeScript files, and `watchAssets` - to turn on watching all non-TypeScript assets. In our case, we want `.proto` files to be automatically copied to the `dist` folder.

```json
{
  "compilerOptions": {
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
```

#### Options

The <strong>gRPC</strong> transporter options object exposes the properties described below.

<table>
  <tr>
    <td><code>package</code></td>
    <td>Protobuf package name (matches <code>package</code> setting from <code>.proto</code> file).  Required</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      Absolute (or relative to the root dir) path to the
      <code>.proto</code> file. Required
    </td>
  </tr>
  <tr>
    <td><code>url</code></td>
    <td>Connection url.  String in the format <code>ip address/dns name:port</code> (for example, <code>'0.0.0.0:50051'</code> for a Docker server) defining the address/port on which the transporter establishes a connection.  Optional.  Defaults to <code>'localhost:5000'</code></td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td>NPM package name for the utility to load <code>.proto</code> files.  Optional.  Defaults to <code>'@grpc/proto-loader'</code></td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      <code>@grpc/proto-loader</code> options. These provide detailed control over the behavior of <code>.proto</code> files. Optional. See
      <a
        href="https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md"
        rel="nofollow"
        target="_blank"
        >here</a
      > for more details
    </td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      Server credentials.  Optional. <a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        >Read more here</a
      >
    </td>
  </tr>
</table>

#### Sample gRPC service

Let's define our sample gRPC service called `HeroesService`. In the above `options` object, the`protoPath` property sets a path to the `.proto` definitions file `hero.proto`. The `hero.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>. Here's what it looks like:

```typescript
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
```

Our `HeroesService` exposes a `FindOne()` method. This method expects an input argument of type `HeroById` and returns a `Hero` message (protocol buffers use `message` elements to define both parameter types and return types).

Next, we need to implement the service. To define a handler that fulfills this definition, we use the `@GrpcMethod()` decorator in a controller, as shown below. This decorator provides the metadata needed to declare a method as a gRPC service method.

> info **Hint** The `@MessagePattern()` decorator (<a href="microservices/basics#request-response">read more</a>) introduced in previous microservices chapters is not used with gRPC-based microservices. The `@GrpcMethod()` decorator effectively takes its place for gRPC-based microservices.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

> info **Hint** The `@GrpcMethod()` decorator is imported from the `@nestjs/microservices` package, while `Metadata` and `ServerUnaryCall` from the `grpc` package.

The decorator shown above takes two arguments. The first is the service name (e.g., `'HeroesService'`), corresponding to the `HeroesService` service definition in `hero.proto`. The second (the string `'FindOne'`) corresponds to the `FindOne()` rpc method defined within `HeroesService` in the `hero.proto` file.

The `findOne()` handler method takes three arguments, the `data` passed from the caller, `metadata` that stores gRPC
request metadata and `call` to obtain the `GrpcCall` object properties such as `sendMetadata` for send metadata to client.

Both `@GrpcMethod()` decorator arguments are optional. If called without the second argument (e.g., `'FindOne'`), Nest will automatically associate the `.proto` file rpc method with the handler based on converting the handler name to upper camel case (e.g., the `findOne` handler is associated with the `FindOne` rpc call definition). This is shown below.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

You can also omit the first `@GrpcMethod()` argument. In this case, Nest automatically associates the handler with the service definition from the proto definitions file based on the **class** name where the handler is defined. For example, in the following code, class `HeroesService` associates its handler methods with the `HeroesService` service definition in the `hero.proto` file based on the matching of the name `'HeroesService'`.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

#### Client

Nest applications can act as gRPC clients, consuming services defined in `.proto` files. You access remote services through a `ClientGrpc` object. You can obtain a `ClientGrpc` object in several ways.

The preferred technique is to import the `ClientsModule`. Use the `register()` method to bind a package of services defined in a `.proto` file to an injection token, and to configure the service. The `name` property is the injection token. For gRPC services, use `transport: Transport.GRPC`. The `options` property is an object with the same properties described <a href="microservices/grpc#options">above</a>.

```typescript
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
```

> info **Hint** The `register()` method takes an array of objects. Register multiple packages by providing a comma separated list of registration objects.

Once registered, we can inject the configured `ClientGrpc` object with `@Inject()`. Then we use the `ClientGrpc` object's `getService()` method to retrieve the service instance, as shown below.

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

> error **Warning** gRPC Client will not send fields that contain underscore `_` in their names unless the `keepCase` options is set to `true` in the proto loader configuration (`options.loader.keepcase` in the microservice transporter configuration).

Notice that there is a small difference compared to the technique used in other microservice transport methods. Instead of the `ClientProxy` class, we use the `ClientGrpc` class, which provides the `getService()` method. The `getService()` generic method takes a service name as an argument and returns its instance (if available).

Alternatively, you can use the `@Client()` decorator to instantiate a `ClientGrpc` object, as follows:

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroesService: HeroesService;

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

Finally, for more complex scenarios, we can inject a dynamically configured client using the `ClientProxyFactory` class as described <a href="/microservices/basics#client">here</a>.

In either case, we end up with a reference to our `HeroesService` proxy object, which exposes the same set of methods that are defined inside the `.proto` file. Now, when we access this proxy object (i.e., `heroesService`), the gRPC system automatically serializes requests, forwards them to the remote system, returns a response, and deserializes the response. Because gRPC shields us from these network communication details, `heroesService` looks and acts like a local provider.

Note, all service methods are **lower camel cased** (in order to follow the natural convention of the language). So, for example, while our `.proto` file `HeroesService` definition contains the `FindOne()` function, the `heroesService` instance will provide the `findOne()` method.

```typescript
interface HeroesService {
  findOne(data: { id: number }): Observable<any>;
}
```

A message handler is also able to return an `Observable`, in which case the result values will be emitted until the stream is completed.

```typescript
@@filename(heroes.controller)
@Get()
call(): Observable<any> {
  return this.heroesService.findOne({ id: 1 });
}
@@switch
@Get()
call() {
  return this.heroesService.findOne({ id: 1 });
}
```

To send gRPC metadata (along with the request), you can pass a second argument, as follows:

```typescript
call(): Observable<any> {
  const metadata = new Metadata();
  metadata.add('Set-Cookie', 'yummy_cookie=choco');

  return this.heroesService.findOne({ id: 1 }, metadata);
}
```

> info **Hint** The `Metadata` class is imported from the `grpc` package.

Please note that this would require updating the `HeroesService` interface that we've defined a few steps earlier.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/04-grpc).

#### gRPC Reflection

The [gRPC Server Reflection Specification](https://grpc.io/docs/guides/reflection/#overview) is a standard which allows gRPC clients to request details about the API that the server exposes, akin to exposing an OpenAPI document for a REST API. This can make working with developer debugging tools such as grpc-ui or postman significantly easier.

To add gRPC reflection support to your server, first install the required implementation package:

```bash
$ npm i --save @grpc/reflection
```

Then it can be hooked into the gRPC server using the `onLoadPackageDefinition` hook in your gRPC server options, as follows:

```typescript
@@filename(main)
import { ReflectionService } from '@grpc/reflection';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    onLoadPackageDefinition: (pkg, server) => {
      new ReflectionService(pkg).addToServer(server);
    },
  },
});
```

Now your server will respond to messages requesting API details using the reflection specification.

#### gRPC Streaming

gRPC on its own supports long-term live connections, conventionally known as `streams`. Streams are useful for cases such as Chatting, Observations or Chunk-data transfers. Find more details in the official documentation [here](https://grpc.io/docs/guides/concepts/).

Nest supports GRPC stream handlers in two possible ways:

- RxJS `Subject` + `Observable` handler: can be useful to write responses right inside of a Controller method or to be passed down to `Subject`/`Observable` consumer
- Pure GRPC call stream handler: can be useful to be passed to some executor which will handle the rest of dispatch for the Node standard `Duplex` stream handler.

<app-banner-enterprise></app-banner-enterprise>

#### Streaming sample

Let's define a new sample gRPC service called `HelloService`. The `hello.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>. Here's what it looks like:

```typescript
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> info **Hint** The `LotsOfGreetings` method can be simply implemented with the `@GrpcMethod` decorator (as in the examples above) since the returned stream can emit multiple values.

Based on this `.proto` file, let's define the `HelloService` interface:

```typescript
interface HelloService {
  bidiHello(upstream: Observable<HelloRequest>): Observable<HelloResponse>;
  lotsOfGreetings(
    upstream: Observable<HelloRequest>,
  ): Observable<HelloResponse>;
}

interface HelloRequest {
  greeting: string;
}

interface HelloResponse {
  reply: string;
}
```

> info **Hint** The proto interface can be automatically generated by the [ts-proto](https://github.com/stephenh/ts-proto) package, learn more [here](https://github.com/stephenh/ts-proto/blob/main/NESTJS.markdown).

#### Subject strategy

The `@GrpcStreamMethod()` decorator provides the function parameter as an RxJS `Observable`. Thus, we can receive and process multiple messages.

```typescript
@GrpcStreamMethod()
bidiHello(messages: Observable<any>, metadata: Metadata, call: ServerDuplexStream<any, any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe({
    next: onNext,
    complete: onComplete,
  });


  return subject.asObservable();
}
```

> warning **Warning** For supporting full-duplex interaction with the `@GrpcStreamMethod()` decorator, the controller method must return an RxJS `Observable`.

> info **Hint** The `Metadata` and `ServerUnaryCall` classes/interfaces are imported from the `grpc` package.

According to the service definition (in the `.proto` file), the `BidiHello` method should stream requests to the service. To send multiple asynchronous messages to the stream from a client, we leverage an RxJS `ReplaySubject` class.

```typescript
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplaySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
```

In the example above, we wrote two messages to the stream (`next()` calls) and notified the service that we've completed sending the data (`complete()` call).

#### Call stream handler

When the method return value is defined as `stream`, the `@GrpcStreamCall()` decorator provides the function parameter as `grpc.ServerDuplexStream`, which supports standard methods like `.on('data', callback)`, `.write(message)` or `.cancel()`. Full documentation on available methods can be found [here](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html).

Alternatively, when the method return value is not a `stream`, the `@GrpcStreamCall()` decorator provides two function parameters, respectively `grpc.ServerReadableStream` (read more [here](https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html)) and `callback`.

Let's start with implementing the `BidiHello` which should support a full-duplex interaction.

```typescript
@GrpcStreamCall()
bidiHello(requestStream: any) {
  requestStream.on('data', message => {
    console.log(message);
    requestStream.write({
      reply: 'Hello, world!'
    });
  });
}
```

> info **Hint** This decorator does not require any specific return parameter to be provided. It is expected that the stream will be handled similar to any other standard stream type.

In the example above, we used the `write()` method to write objects to the response stream. The callback passed into the `.on()` method as a second parameter will be called every time our service receives a new chunk of data.

Let's implement the `LotsOfGreetings` method.

```typescript
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
```

Here we used the `callback` function to send the response once processing of the `requestStream` has been completed.

#### Health checks

When running a gRPC application in an orchestrator such a Kubernetes, you may need to know if it is running and in a healthy state. The [gRPC Health Check specification](https://grpc.io/docs/guides/health-checking/) is a standard that allow gRPC clients to expose their health status to allow the orchestrator to act accordingly.

To add gRPC health check support, first install the [grpc-node](https://github.com/grpc/grpc-node/tree/master/packages/grpc-health-check) package:

```bash
$ npm i --save grpc-health-check
```

Then it can be hooked into the gRPC service using the `onLoadPackageDefinition` hook in your gRPC server options, as follows. Note that the `protoPath` needs to have both the health check and the hero package.

```typescript
@@filename(main)
import { HealthImplementation, protoPath as healthCheckProtoPath } from 'grpc-health-check';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    protoPath: [
      healthCheckProtoPath,
      protoPath: join(__dirname, 'hero/hero.proto'),
    ],
    onLoadPackageDefinition: (pkg, server) => {
      const healthImpl = new HealthImplementation({
        '': 'UNKNOWN',
      });

      healthImpl.addToServer(server);
      healthImpl.setStatus('', 'SERVING');
    },
  },
});
```

> info **Hint** The [gRPC health probe](https://github.com/grpc-ecosystem/grpc-health-probe) is a useful CLI to test gRPC health checks in a containerized environment.

#### gRPC Metadata

Metadata is information about a particular RPC call in the form of a list of key-value pairs, where the keys are strings and the values are typically strings but can be binary data. Metadata is opaque to gRPC itself - it lets the client provide information associated with the call to the server and vice versa. Metadata may include authentication tokens, request identifiers and tags for monitoring purposes, and data information such as the number of records in a data set.

To read the metadata in `@GrpcMethod()` handler, use the second argument (metadata), which is of type `Metadata` (imported from the `grpc` package).

To send back metadata from the handler, use the `ServerUnaryCall#sendMetadata()` method (third handler argument).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
```

Likewise, to read the metadata in handlers annotated with the `@GrpcStreamMethod()` handler ([subject strategy](microservices/grpc#subject-strategy)), use the second argument (metadata), which is of type `Metadata` (imported from the `grpc` package).

To send back metadata from the handler, use the `ServerDuplexStream#sendMetadata()` method (third handler argument).

To read metadata from within the [call stream handlers](microservices/grpc#call-stream-handler) (handlers annotated with `@GrpcStreamCall()` decorator), listen to the `metadata` event on the `requestStream` reference, as follows:

```typescript
requestStream.on('metadata', (metadata: Metadata) => {
  const meta = metadata.get('X-Meta');
});
```


---

