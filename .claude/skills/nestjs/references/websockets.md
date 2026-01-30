# Websockets

## Adapters

### Adapters

The WebSockets module is platform-agnostic, hence, you can bring your own library (or even a native implementation) by making use of `WebSocketAdapter` interface. This interface forces to implement few methods described in the following table:

<table>
  <tr>
    <td><code>create</code></td>
    <td>Creates a socket instance based on passed arguments</td>
  </tr>
  <tr>
    <td><code>bindClientConnect</code></td>
    <td>Binds the client connection event</td>
  </tr>
  <tr>
    <td><code>bindClientDisconnect</code></td>
    <td>Binds the client disconnection event (optional*)</td>
  </tr>
  <tr>
    <td><code>bindMessageHandlers</code></td>
    <td>Binds the incoming message to the corresponding message handler</td>
  </tr>
  <tr>
    <td><code>close</code></td>
    <td>Terminates a server instance</td>
  </tr>
</table>

#### Extend socket.io

The [socket.io](https://github.com/socketio/socket.io) package is wrapped in an `IoAdapter` class. What if you would like to enhance the basic functionality of the adapter? For instance, your technical requirements require a capability to broadcast events across multiple load-balanced instances of your web service. For this, you can extend `IoAdapter` and override a single method which responsibility is to instantiate new socket.io servers. But first of all, let's install the required package.

> warning **Warning** To use socket.io with multiple load-balanced instances you either have to disable polling by setting `transports: ['websocket']` in your clients socket.io configuration or you have to enable cookie based routing in your load balancer. Redis alone is not enough. See [here](https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session) for more information.

```bash
$ npm i --save redis socket.io @socket.io/redis-adapter
```

Once the package is installed, we can create a `RedisIoAdapter` class.

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://localhost:6379` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

Afterward, simply switch to your newly created Redis adapter.

```typescript
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();

app.useWebSocketAdapter(redisIoAdapter);
```

#### Ws library

Another available adapter is a `WsAdapter` which in turn acts like a proxy between the framework and integrate blazing fast and thoroughly tested [ws](https://github.com/websockets/ws) library. This adapter is fully compatible with native browser WebSockets and is far faster than socket.io package. Unluckily, it has significantly fewer functionalities available out-of-the-box. In some cases, you don't necessarily need them though.

> info **Hint** `ws` library does not support namespaces (communication channels popularised by `socket.io`). However, to somehow mimic this feature, you can mount multiple `ws` servers on different paths (example: `@WebSocketGateway({{ '{' }} path: '/users' {{ '}' }})`).

In order to use `ws`, we firstly have to install the required package:

```bash
$ npm i --save @nestjs/platform-ws
```

Once the package is installed, we can switch an adapter:

```typescript
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

> info **Hint** The `WsAdapter` is imported from `@nestjs/platform-ws`.

The `wsAdapter` is designed to handle messages in the `{{ '{' }} event: string, data: any {{ '}' }}` format. If you need to receive and process messages in a different format, you'll need to configure a message parser to convert them into this required format.

```typescript
const wsAdapter = new WsAdapter(app, {
  // To handle messages in the [event, data] format
  messageParser: (data) => {
    const [event, payload] = JSON.parse(data.toString());
    return { event, data: payload };
  },
});
```

Alternatively, you can configure the message parser after the adapter is created by using the `setMessageParser` method.

#### Advanced (custom adapter)

For demonstration purposes, we are going to integrate the [ws](https://github.com/websockets/ws) library manually. As mentioned, the adapter for this library is already created and is exposed from the `@nestjs/platform-ws` package as a `WsAdapter` class. Here is how the simplified implementation could potentially look like:

```typescript
@@filename(ws-adapter)
import * as WebSocket from 'ws';
import { WebSocketAdapter, INestApplicationContext } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
```

> info **Hint** When you want to take advantage of [ws](https://github.com/websockets/ws) library, use built-in `WsAdapter` instead of creating your own one.

Then, we can set up a custom adapter using `useWebSocketAdapter()` method:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

#### Example

A working example that uses `WsAdapter` is available [here](https://github.com/nestjs/nest/tree/master/sample/16-gateways-ws).


---

## Gateways

### Gateways

Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to gateways. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to WebSockets.

In Nest, a gateway is simply a class annotated with `@WebSocketGateway()` decorator. Technically, gateways are platform-agnostic which makes them compatible with any WebSockets library once an adapter is created. There are two WS platforms supported out-of-the-box: [socket.io](https://github.com/socketio/socket.io) and [ws](https://github.com/websockets/ws). You can choose the one that best suits your needs. Also, you can build your own adapter by following this [guide](/websockets/adapter).

<figure><img class="illustrative-image" src="/assets/Gateways_1.png" /></figure>

> info **Hint** Gateways can be treated as [providers](/providers); this means they can inject dependencies through the class constructor. Also, gateways can be injected by other classes (providers and controllers) as well.

#### Installation

To start building WebSockets-based applications, first install the required package:

```bash
@@filename()
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
@@switch
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
```

#### Overview

In general, each gateway is listening on the same port as the **HTTP server**, unless your app is not a web application, or you have changed the port manually. This default behavior can be modified by passing an argument to the `@WebSocketGateway(80)` decorator where `80` is a chosen port number. You can also set a [namespace](https://socket.io/docs/v4/namespaces/) used by the gateway using the following construction:

```typescript
@WebSocketGateway(80, { namespace: 'events' })
```

> warning **Warning** Gateways are not instantiated until they are referenced in the providers array of an existing module.

You can pass any supported [option](https://socket.io/docs/v4/server-options/) to the socket constructor with the second argument to the `@WebSocketGateway()` decorator, as shown below:

```typescript
@WebSocketGateway(81, { transports: ['websocket'] })
```

The gateway is now listening, but we have not yet subscribed to any incoming messages. Let's create a handler that will subscribe to the `events` messages and respond to the user with the exact same data.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): string {
  return data;
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  return data;
}
```

> info **Hint** `@SubscribeMessage()` and `@MessageBody()` decorators are imported from `@nestjs/websockets` package.

Once the gateway is created, we can register it in our module.

```typescript
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@@filename(events.module)
@Module({
  providers: [EventsGateway]
})
export class EventsModule {}
```

You can also pass in a property key to the decorator to extract it from the incoming message body:

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody('id') id: number): number {
  // id === messageBody.id
  return id;
}
@@switch
@Bind(MessageBody('id'))
@SubscribeMessage('events')
handleEvent(id) {
  // id === messageBody.id
  return id;
}
```

If you would prefer not to use decorators, the following code is functionally equivalent:

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(client: Socket, data: string): string {
  return data;
}
@@switch
@SubscribeMessage('events')
handleEvent(client, data) {
  return data;
}
```

In the example above, the `handleEvent()` function takes two arguments. The first one is a platform-specific [socket instance](https://socket.io/docs/v4/server-api/#socket), while the second one is the data received from the client. This approach is not recommended though, because it requires mocking the `socket` instance in each unit test.

Once the `events` message is received, the handler sends an acknowledgment with the same data that was sent over the network. In addition, it's possible to emit messages using a library-specific approach, for example, by making use of `client.emit()` method. In order to access a connected socket instance, use `@ConnectedSocket()` decorator.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @ConnectedSocket() client: Socket,
): string {
  return data;
}
@@switch
@Bind(MessageBody(), ConnectedSocket())
@SubscribeMessage('events')
handleEvent(data, client) {
  return data;
}
```

> info **Hint** `@ConnectedSocket()` decorator is imported from `@nestjs/websockets` package.

However, in this case, you won't be able to leverage interceptors. If you don't want to respond to the user, you can simply skip the `return` statement (or explicitly return a "falsy" value, e.g. `undefined`).

Now when a client emits the message as follows:

```typescript
socket.emit('events', { name: 'Nest' });
```

The `handleEvent()` method will be executed. In order to listen for messages emitted from within the above handler, the client has to attach a corresponding acknowledgment listener:

```typescript
socket.emit('events', { name: 'Nest' }, (data) => console.log(data));
```

While returning a value from a message handler implicitly sends an acknowledgement, advanced scenarios often require direct control over the acknowledgement callback.

The `@Ack()` parameter decorator allows injecting the `ack` callback function directly into a message handler.
Without using the decorator, this callback is passed as the third argument of the method.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @Ack() ack: (response: { status: string; data: string }) => void,
) {
  ack({ status: 'received', data });
}
@@switch
@Bind(MessageBody(), Ack())
@SubscribeMessage('events')
handleEvent(data, ack) {
  ack({ status: 'received', data });
}
```

#### Multiple responses

The acknowledgment is dispatched only once. Furthermore, it is not supported by native WebSockets implementation. To solve this limitation, you may return an object which consists of two properties. The `event` which is a name of the emitted event and the `data` that has to be forwarded to the client.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  const event = 'events';
  return { event, data };
}
```

> info **Hint** The `WsResponse` interface is imported from `@nestjs/websockets` package.

> warning **Warning** You should return a class instance that implements `WsResponse` if your `data` field relies on `ClassSerializerInterceptor`, as it ignores plain JavaScript object responses.

In order to listen for the incoming response(s), the client has to apply another event listener.

```typescript
socket.on('events', (data) => console.log(data));
```

#### Asynchronous responses

Message handlers are able to respond either synchronously or **asynchronously**. Hence, `async` methods are supported. A message handler is also able to return an `Observable`, in which case the result values will be emitted until the stream is completed.

```typescript
@@filename(events.gateway)
@SubscribeMessage('events')
onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
@@switch
@Bind(MessageBody())
@SubscribeMessage('events')
onEvent(data) {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
```

In the example above, the message handler will respond **3 times** (with each item from the array).

#### Lifecycle hooks

There are 3 useful lifecycle hooks available. All of them have corresponding interfaces and are described in the following table:

<table>
  <tr>
    <td>
      <code>OnGatewayInit</code>
    </td>
    <td>
      Forces to implement the <code>afterInit()</code> method. Takes library-specific server instance as an argument (and
      spreads the rest if required).
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayConnection</code>
    </td>
    <td>
      Forces to implement the <code>handleConnection()</code> method. Takes library-specific client socket instance as
      an argument.
    </td>
  </tr>
  <tr>
    <td>
      <code>OnGatewayDisconnect</code>
    </td>
    <td>
      Forces to implement the <code>handleDisconnect()</code> method. Takes library-specific client socket instance as
      an argument.
    </td>
  </tr>
</table>

> info **Hint** Each lifecycle interface is exposed from `@nestjs/websockets` package.

#### Server and Namespace

Occasionally, you may want to have a direct access to the native, **platform-specific** server instance. The reference to this object is passed as an argument to the `afterInit()` method (`OnGatewayInit` interface). Another option is to use the `@WebSocketServer()` decorator.

```typescript
@WebSocketServer()
server: Server;
```

Also, you can retrieve the corresponding namespace using the `namespace` attribute, as follows:

```typescript
@WebSocketGateway({ namespace: 'my-namespace' })
export class EventsGateway {
  @WebSocketServer()
  namespace: Namespace;
}
```

`@WebSocketServer()` decorator injects a server instance by referencing the metadata stored by the `@WebSocketGateway()` decorator. If you provide the namespace option to the `@WebSocketGateway()` decorator, `@WebSocketServer()` decorator returns a `Namespace` instance instead of a `Server` instance.

> warning **Notice** The `@WebSocketServer()` decorator is imported from the `@nestjs/websockets` package.

Nest will automatically assign the server instance to this property once it is ready to use.

<app-banner-enterprise></app-banner-enterprise>

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/02-gateways).


---

## HTTP adapter

### HTTP adapter

Occasionally, you may want to access the underlying HTTP server, either within the Nest application context or from the outside.

Every native (platform-specific) HTTP server/library (e.g., Express and Fastify) instance is wrapped in an **adapter**. The adapter is registered as a globally available provider that can be retrieved from the application context, as well as injected into other providers.

#### Outside application context strategy

To get a reference to the `HttpAdapter` from outside of the application context, call the `getHttpAdapter()` method.

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
const httpAdapter = app.getHttpAdapter();
```

#### As injectable

To get a reference to the `HttpAdapterHost` from within the application context, inject it using the same technique as any other existing provider (e.g., using constructor injection).

```typescript
@@filename()
export class CatsService {
  constructor(private adapterHost: HttpAdapterHost) {}
}
@@switch
@Dependencies(HttpAdapterHost)
export class CatsService {
  constructor(adapterHost) {
    this.adapterHost = adapterHost;
  }
}
```

> info **Hint** The `HttpAdapterHost` is imported from the `@nestjs/core` package.

The `HttpAdapterHost` is **not** an actual `HttpAdapter`. To get the actual `HttpAdapter` instance, simply access the `httpAdapter` property.

```typescript
const adapterHost = app.get(HttpAdapterHost);
const httpAdapter = adapterHost.httpAdapter;
```

The `httpAdapter` is the actual instance of the HTTP adapter used by the underlying framework. It is an instance of either `ExpressAdapter` or `FastifyAdapter` (both classes extend `AbstractHttpAdapter`).

The adapter object exposes several useful methods to interact with the HTTP server. However, if you want to access the library instance (e.g., the Express instance) directly, call the `getInstance()` method.

```typescript
const instance = httpAdapter.getInstance();
```

#### Listening event

To execute an action when the server begins listening for incoming requests, you can subscribe to the `listen$` stream, as demonstrated below:

```typescript
this.httpAdapterHost.listen$.subscribe(() =>
  console.log('HTTP server is listening'),
);
```

Additionally, the `HttpAdapterHost` provides a `listening` boolean property that indicates whether the server is currently active and listening:

```typescript
if (this.httpAdapterHost.listening) {
  console.log('HTTP server is listening');
}
```


---

## HTTPS

### HTTPS

To create an application that uses the HTTPS protocol, set the `httpsOptions` property in the options object passed to the `create()` method of the `NestFactory` class:

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
await app.listen(process.env.PORT ?? 3000);
```

If you use the `FastifyAdapter`, create the application as follows:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### Multiple simultaneous servers

The following recipe shows how to instantiate a Nest application that listens on multiple ports (for example, on a non-HTTPS port and an HTTPS port) simultaneously.

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();

const httpServer = http.createServer(server).listen(3000);
const httpsServer = https.createServer(httpsOptions, server).listen(443);
```

Because we called `http.createServer` / `https.createServer` ourselves, NestJS doesn't close them when calling `app.close` / on termination signal. We need to do this ourselves:

```typescript
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
  private httpServers: http.Server[] = [];

  public addHttpServer(server: http.Server): void {
    this.httpServers.push(server);
  }

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(
      this.httpServers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve(null);
              }
            });
          }),
      ),
    );
  }
}

const shutdownObserver = app.get(ShutdownObserver);
shutdownObserver.addHttpServer(httpServer);
shutdownObserver.addHttpServer(httpsServer);
```

> info **Hint** The `ExpressAdapter` is imported from the `@nestjs/platform-express` package. The `http` and `https` packages are native Node.js packages.

> **Warning** This recipe does not work with [GraphQL Subscriptions](/graphql/subscriptions).


---

## Keep alive connections

### Keep alive connections

By default, the HTTP adapters of NestJS will wait until the response is finished before closing the application. But sometimes, this behavior is not desired, or unexpected. There might be some requests that use `Connection: Keep-Alive` headers that live for a long time.

For these scenarios where you always want your application to exit without waiting for requests to end, you can enable the `forceCloseConnections` option when creating your NestJS application.

> warning **Tip** Most users will not need to enable this option. But the symptom of needing this option is that your application will not exit when you expect it to. Usually when `app.enableShutdownHooks()` is enabled and you notice that the application is not restarting/exiting. Most likely while running the NestJS application during development with `--watch`.

#### Usage

In your `main.ts` file, enable the option when creating your NestJS application:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```


---

