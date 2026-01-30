# Other

## Async Local Storage

### Async Local Storage

`AsyncLocalStorage` is a [Node.js API](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage) (based on the `async_hooks` API) that provides an alternative way of propagating local state through the application without the need to explicitly pass it as a function parameter. It is similar to a thread-local storage in other languages.

The main idea of Async Local Storage is that we can _wrap_ some function call with the `AsyncLocalStorage#run` call. All code that is invoked within the wrapped call gets access to the same `store`, which will be unique to each call chain.

In the context of NestJS, that means if we can find a place within the request's lifecycle where we can wrap the rest of the request's code, we will be able to access and modify state visible only to that request, which may serve as an alternative to REQUEST-scoped providers and some of their limitations.

Alternatively, we can use ALS to propagate context for only a part of the system (for example the _transaction_ object) without passing it around explicitly across services, which can increase isolation and encapsulation.

#### Custom implementation

NestJS itself does not provide any built-in abstraction for `AsyncLocalStorage`, so let's walk through how we could implement it ourselves for the simplest HTTP case to get a better understanding of the whole concept:

> info **info** For a ready-made [dedicated package](recipes/async-local-storage#nestjs-cls), continue reading below.

1. First, create a new instance of the `AsyncLocalStorage` in some shared source file. Since we're using NestJS, let's also turn it into a module with a custom provider.

```ts
@@filename(als.module)
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
```
>  info **Hint** `AsyncLocalStorage` is imported from `async_hooks`.

2. We're only concerned with HTTP, so let's use a middleware to wrap the `next` function with `AsyncLocalStorage#run`. Since a middleware is the first thing that the request hits, this will make the `store` available in all enhancers and the rest of the system.

```ts
@@filename(app.module)
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule implements NestModule {
  constructor(
    // inject the AsyncLocalStorage in the module constructor,
    private readonly als: AsyncLocalStorage
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
@@switch
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
@Dependencies(AsyncLocalStorage)
export class AppModule {
  constructor(als) {
    // inject the AsyncLocalStorage in the module constructor,
    this.als = als
  }

  configure(consumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
```

3. Now, anywhere within the lifecycle of a request, we can access the local store instance.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ALS instance.
    private readonly als: AsyncLocalStorage,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(als, catsRepository) {
    // We can inject the provided ALS instance.
    this.als = als
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
```

4. That's it. Now we have a way to share request related state without needing to inject the whole `REQUEST` object.

> warning **warning** Please be aware that while the technique is useful for many use-cases, it inherently obfuscates the code flow (creating implicit context), so use it responsibly and especially avoid creating contextual "[God objects](https://en.wikipedia.org/wiki/God_object)".

### NestJS CLS

The [nestjs-cls](https://github.com/Papooch/nestjs-cls) package provides several DX improvements over using plain `AsyncLocalStorage` (`CLS` is an abbreviation of the term _continuation-local storage_). It abstracts the implementation into a `ClsModule` that offers various ways of initializing the `store` for different transports (not only HTTP), as well as a strong-typing support.

The store can then be accessed with an injectable `ClsService`, or entirely abstracted away from the business logic by using [Proxy Providers](https://www.npmjs.com/package/nestjs-cls#proxy-providers).

> info **info** `nestjs-cls` is a third party package and is not managed by the NestJS core team. Please, report any issues found with the library in the [appropriate repository](https://github.com/Papooch/nestjs-cls/issues).

#### Installation

Apart from a peer dependency on the `@nestjs` libs, it only uses the built-in Node.js API. Install it as any other package.

```bash
npm i nestjs-cls
```

#### Usage

A similar functionality as described [above](recipes/async-local-storage#custom-implementation) can be implemented using `nestjs-cls` as follows:

1. Import the `ClsModule` in the root module.

```ts
@@filename(app.module)
@Module({
  imports: [
    // Register the ClsModule,
    ClsModule.forRoot({
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule {}
```

2. And then can use the `ClsService` to access the store values.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ClsService instance,
    private readonly cls: ClsService,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(cls, catsRepository) {
    // We can inject the provided ClsService instance,
    this.cls = cls
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
```

3. To get strong typing of the store values managed by the `ClsService` (and also get auto-suggestions of the string keys), we can use an optional type parameter `ClsService<MyClsStore>` when injecting it.

```ts
export interface MyClsStore extends ClsStore {
  userId: number;
}
```

> info **hint** It it also possible to let the package automatically generate a Request ID and access it later with `cls.getId()`, or to get the whole Request object using `cls.get(CLS_REQ)`.
#### Testing

Since the `ClsService` is just another injectable provider, it can be entirely mocked out in unit tests.

However, in certain integration tests, we might still want to use the real `ClsService` implementation. In that case, we will need to wrap the context-aware piece of code with a call to `ClsService#run` or `ClsService#runWith`.

```ts
describe('CatsService', () => {
  let service: CatsService
  let cls: ClsService
  const mockCatsRepository = createMock<CatsRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Set up most of the testing module as we normally would.
      providers: [
        CatsService,
        {
          provide: CatsRepository
          useValue: mockCatsRepository
        }
      ],
      imports: [
        // Import the static version of ClsModule which only provides
        // the ClsService, but does not set up the store in any way.
        ClsModule
      ],
    }).compile()

    service = module.get(CatsService)

    // Also retrieve the ClsService for later use.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mocksCatsRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // Wrap the test call in the `runWith` method
      // in which we can pass hand-crafted store values.
      const cat = await cls.runWith(
        { userId: expectedUserId },
        () => service.getCatForUser()
      )

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
```

#### More information

Visit the [NestJS CLS GitHub Page](https://github.com/Papooch/nestjs-cls) for the full API documentation and more code examples.


---

## Deployment

### Deployment

When you're ready to deploy your NestJS application to production, there are key steps you can take to ensure it runs as efficiently as possible. In this guide, we'll explore essential tips and best practices to help you deploy your NestJS application successfully.

#### Prerequisites

Before deploying your NestJS application, ensure you have:

- A working NestJS application that is ready for deployment.
- Access to a deployment platform or server where you can host your application.
- All necessary environment variables set up for your application.
- Any required services, like a database, set up and ready to go.
- At least an LTS version of Node.js installed on your deployment platform.

> info **Hint** If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com/ 'Deploy Nest'), our official platform for deploying NestJS applications on AWS. With Mau, deploying your NestJS application is as simple as clicking a few buttons and running a single command:
>
> ```bash
> $ npm install -g @nestjs/mau
> $ mau deploy
> ```
>
> Once the deployment is complete, you'll have your NestJS application up and running on AWS in seconds!

#### Building your application

To build your NestJS application, you need to compile your TypeScript code into JavaScript. This process generates a `dist` directory containing the compiled files. You can build your application by running the following command:

```bash
$ npm run build
```

This command typically runs the `nest build` command under the hood, which is basically a wrapper around the TypeScript compiler with some additional features (assets copying, etc.). In case you have a custom build script, you can run it directly. Also, for NestJS CLI mono-repos, make sure to pass the name of the project to build as an argument (`npm run build my-app`).

Upon successful compilation, you should see a `dist` directory in your project root containing the compiled files, with the entry point being `main.js`. If you have any `.ts` files located in the root directory of your project (and your `tsconfig.json` configured to compile them), they will be copied to the `dist` directory as well, modifying the directory structure a bit (instead of `dist/main.js`, you will have `dist/src/main.js` so keep that in mind when configuring your server).

#### Production environment

Your production environment is where your application will be accessible to external users. This could be a cloud-based platform like [AWS](https://aws.amazon.com/) (with EC2, ECS, etc.), [Azure](https://azure.microsoft.com/), or [Google Cloud](https://cloud.google.com/), or even a dedicated server you manage, such as [Hetzner](https://www.hetzner.com/).

To simplify the deployment process and avoid manual setup, you can use a service like [Mau](https://mau.nestjs.com/ 'Deploy Nest'), our official platform for deploying NestJS applications on AWS. For more details, check out [this section](todo).

Some of the pros of using a **cloud-based platform** or service like [Mau](https://mau.nestjs.com/ 'Deploy Nest') include:

- Scalability: Easily scale your application as your user base grows.
- Security: Benefit from built-in security features and compliance certifications.
- Monitoring: Monitor your application's performance and health in real-time.
- Reliability: Ensure your application is always available with high uptime guarantees.

On the other hand, cloud-based platforms are typically more expensive than self-hosting, and you may have less control over the underlying infrastructure. Simple VPS can be a good choice if you're looking for a more cost-effective solution and have the technical expertise to manage the server yourself, but keep in mind that you'll need to handle tasks like server maintenance, security, and backups manually.

#### NODE_ENV=production

While there's technically no difference between development and production in Node.js and NestJS, it's a good practice to set the `NODE_ENV` environment variable to `production` when running your application in a production environment, as some libraries in the ecosystem may behave differently based on this variable (e.g., enabling or disabling debugging output, etc.).

You can set the `NODE_ENV` environment variable when starting your application like so:

```bash
$ NODE_ENV=production node dist/main.js
```

Or just set it in your cloud provider's/Mau dashboard.

#### Running your application

To run your NestJS application in production, just use the following command:

```bash
$ node dist/main.js # Adjust this based on your entry point location
```

This command starts your application, which will listen on the specified port (usually `3000` by default). Ensure that this matches the port you’ve configured in your application.

Alternatively, you can use the `nest start` command. This command is a wrapper around `node dist/main.js`, but it has one key difference: it automatically runs `nest build` before starting the application, so you don’t need to manually execute `npm run build`.

#### Health checks

Health checks are essential for monitoring the health and status of your NestJS application in production. By setting up a health check endpoint, you can regularly verify that your app is running as expected and respond to issues before they become critical.

In NestJS, you can easily implement health checks using the **@nestjs/terminus** package, which provides a powerful tool for adding health checks, including database connections, external services, and custom checks.

Check out [this guide](/recipes/terminus) to learn how to implement health checks in your NestJS application, and ensure your app is always monitored and responsive.

#### Logging

Logging is essential for any production-ready application. It helps track errors, monitor behavior, and troubleshoot issues. In NestJS, you can easily manage logging with the built-in logger or opt for external libraries if you need more advanced features.

Best practices for logging:

- Log Errors, Not Exceptions: Focus on logging detailed error messages to speed up debugging and issue resolution.
- Avoid Sensitive Data: Never log sensitive information like passwords or tokens to protect security.
- Use Correlation IDs: In distributed systems, include unique identifiers (like correlation IDs) in your logs to trace requests across different services.
- Use Log Levels: Categorize logs by severity (e.g., `info`, `warn`, `error`) and disable debug or verbose logs in production to reduce noise.

> info **Hint** If you're using [AWS](https://aws.amazon.com/) (with [Mau](https://mau.nestjs.com/ 'Deploy Nest') or directly), consider JSON logging to make it easier to parse and analyze your logs.

For distributed applications, using a centralized logging service like ElasticSearch, Loggly, or Datadog can be incredibly useful. These tools offer powerful features like log aggregation, search, and visualization, making it easier to monitor and analyze your application's performance and behavior.

#### Scaling up or out

Scaling your NestJS application effectively is crucial for handling increased traffic and ensuring optimal performance. There are two primary strategies for scaling: **vertical scaling** and **horizontal scaling**. Understanding these approaches will help you design your application to manage load efficiently.

**Vertical scaling**, often referred to as "scaling up" involves increasing the resources of a single server to enhance its performance. This could mean adding more CPU, RAM, or storage to your existing machine. Here are some key points to consider:

- Simplicity: Vertical scaling is generally simpler to implement since you only need to upgrade your existing server rather than manage multiple instances.
- Limitations: There are physical limits to how much you can scale a single machine. Once you reach the maximum capacity, you may need to consider other options.
- Cost-Effectiveness: For applications with moderate traffic, vertical scaling can be cost-effective, as it reduces the need for additional infrastructure.

Example: If your NestJS app is hosted on a virtual machine and you notice that it’s running slowly during peak hours, you can upgrade your VM to a larger instance with more resources. To upgrade your VM, just navigate to your current provider's dashboard and select a larger instance type.

**Horizontal scaling**, or "scaling out" involves adding more servers or instances to distribute the load. This strategy is widely used in cloud environments and is essential for applications expecting high traffic. Here are the benefits and considerations:

- Increased Capacity: By adding more instances of your application, you can handle a larger number of concurrent users without degrading performance.
- Redundancy: Horizontal scaling offers redundancy, as the failure of one server won't bring down your entire application. Traffic can be redistributed among the remaining servers.
- Load Balancing: To manage multiple instances effectively, use load balancers (like Nginx or AWS Elastic Load Balancing) to distribute incoming traffic evenly across your servers.

Example: For a NestJS application experiencing high traffic, you can deploy multiple instances of your app in a cloud environment and use a load balancer to route requests, ensuring that no single instance becomes a bottleneck.

This process is straightforward with containerization technologies like [Docker](https://www.docker.com/) and container orchestration platforms such as [Kubernetes](https://kubernetes.io/). Additionally, you can leverage cloud-specific load balancers like [AWS Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/) or [Azure Load Balancer](https://azure.microsoft.com/en-us/services/load-balancer/) to distribute traffic across your application instances.

> info **Hint** [Mau](https://mau.nestjs.com/ 'Deploy Nest') offers built-in support for horizontal scaling on AWS, allowing you to easily deploy multiple instances of your NestJS application and manage them with just a few clicks.

#### Some other tips

There are a few more tips to keep in mind when deploying your NestJS application:

- **Security**: Ensure your application is secure and protected from common threats like SQL injection, XSS, etc. See the "Security" category for more details.
- **Monitoring**: Use monitoring tools like [Prometheus](https://prometheus.io/) or [New Relic](https://newrelic.com/) to track your application's performance and health. If you're using a cloud provider/Mau, they may offer built-in monitoring services (like [AWS CloudWatch](https://aws.amazon.com/cloudwatch/) etc.)
- **Do not hardcode environment variables**: Avoid hardcoding sensitive information like API keys, passwords, or tokens in your code. Use environment variables or a secrets manager to store and access these values securely.
- **Backups**: Regularly back up your data to prevent data loss in case of an incident.
- **Automate deployments**: Use CI/CD pipelines to automate your deployment process and ensure consistency across environments.
- **Rate limiting**: Implement rate limiting to prevent abuse and protect your application from DDoS attacks. Check out [Rate limiting chapter](/security/rate-limiting) for more details, or use a service like [AWS WAF](https://aws.amazon.com/waf/) for advanced protection.

#### Dockerizing your application

[Docker](https://www.docker.com/) is a platform that uses containerization to allow developers to package applications along with their dependencies into a standardized unit called a container. Containers are lightweight, portable, and isolated, making them ideal for deploying applications in various environments, from local development to production.

Benefits of Dockerizing your NestJS application:

- Consistency: Docker ensures that your application runs the same way on any machine, eliminating the "it works on my machine" problem.
- Isolation: Each container runs in its isolated environment, preventing conflicts between dependencies.
- Scalability: Docker makes it easy to scale your application by running multiple containers across different machines or cloud instances.
- Portability: Containers can be easily moved between environments, making it simple to deploy your application on different platforms.

To install Docker, follow the instructions on the [official website](https://www.docker.com/get-started). Once Docker is installed, you can create a `Dockerfile` in your NestJS project to define the steps for building your container image.

The `Dockerfile` is a text file that contains the instructions Docker uses to build your container image.

Here's a sample Dockerfile for a NestJS application:

```bash
# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
```

> info **Hint** Make sure to replace `node:20` with the appropriate Node.js version you're using in your project. You can find the available Node.js Docker images on the [official Docker Hub repository](https://hub.docker.com/_/node).

This is a basic Dockerfile that sets up a Node.js environment, installs the application dependencies, builds the NestJS application, and runs it. You can customize this file based on your project requirements (e.g., use different base images, optimize the build process, only install production dependencies, etc.).

Let's also create a `.dockerignore` file to specify which files and directories Docker should ignore when building the image. Create a `.dockerignore` file in your project root:

```bash
node_modules
dist
*.log
*.md
.git
```

This file ensures that unnecessary files are not included in the container image, keeping it lightweight. Now that you have your Dockerfile set up, you can build your Docker image. Open your terminal, navigate to your project directory, and run the following command:

```bash
docker build -t my-nestjs-app .
```

In this command:

- `-t my-nestjs-app`: Tags the image with the name `my-nestjs-app`.
- `.`: Indicates the current directory as the build context.

After building the image, you can run it as a container. Execute the following command:

```bash
docker run -p 3000:3000 my-nestjs-app
```

In this command:

- `-p 3000:3000`: Maps port 3000 on your host machine to port 3000 in the container.
- `my-nestjs-app`: Specifies the image to run.

Your NestJS application should now be running inside a Docker container.

If you want to deploy your Docker image to a cloud provider or share it with others, you'll need to push it to a Docker registry (like [Docker Hub](https://hub.docker.com/), [AWS ECR](https://aws.amazon.com/ecr/), or [Google Container Registry](https://cloud.google.com/container-registry)).

Once you decide on a registry, you can push your image by following these steps:

```bash
docker login # Log in to your Docker registry
docker tag my-nestjs-app your-dockerhub-username/my-nestjs-app # Tag your image
docker push your-dockerhub-username/my-nestjs-app # Push your image
```

Replace `your-dockerhub-username` with your Docker Hub username or the appropriate registry URL. After pushing your image, you can pull it on any machine and run it as a container.

Cloud providers like AWS, Azure, and Google Cloud offer managed container services that simplify deploying and managing containers at scale. These services provide features like auto-scaling, load balancing, and monitoring, making it easier to run your NestJS application in production.

#### Easy deployment with Mau

[Mau](https://mau.nestjs.com/ 'Deploy Nest') is our official platform for deploying NestJS applications on [AWS](https://aws.amazon.com/). If you're not ready to manage your infrastructure manually (or just want to save time), Mau is the perfect solution for you.

With Mau, provisioning and maintaining your infrastructure is as simple as clicking just a few buttons. Mau is designed to be simple and intuitive, so you can focus on building your applications and not worry about the underlying infrastructure. Under the hood, we use **Amazon Web Services** to provide you with a powerful and reliable platform, while abstracting away all the complexity of AWS. We take care of all the heavy lifting for you, so you can focus on building your applications and growing your business.

[Mau](https://mau.nestjs.com/ 'Deploy Nest') is perfect for startups, small-to-medium businesses, large enterprises, and developers who want to get up and running quickly without having to spend a lot of time on learning and managing infrastructure. It's incredibly easy to use, and you can have your infrastructure up and running in minutes. It also leverages AWS behind the scenes, giving you all the advantages of AWS without the hassle of managing its complexities.

<figure><img src="/assets/mau-metrics.png" /></figure>

With [Mau](https://mau.nestjs.com/ 'Deploy Nest'), you can:

- Deploy your NestJS applications with just a few clicks (APIs, microservices, etc.).
- Provision **databases** such as:
  - PostgreSQL
  - MySQL
  - MongoDB (DocumentDB)
  - Redis
  - more
- Set up broker services like:
  - RabbitMQ
  - Kafka
  - NATS
- Deploy scheduled tasks (**CRON jobs**) and background workers.
- Deploy lambda functions and serverless applications.
- Setup **CI/CD pipelines** for automated deployments.
- And much more!

To deploy your NestJS application with Mau, just run the following command:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Sign up today and [Deploy with Mau](https://mau.nestjs.com/ 'Deploy Nest') to get your NestJS applications up and running on AWS in minutes!


---

## Global prefix

### Global prefix

To set a prefix for **every route** registered in an HTTP application, use the `setGlobalPrefix()` method of the `INestApplication` instance.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

You can exclude routes from the global prefix using the following construction:

```typescript
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
```

Alternatively, you can specify route as a string (it will apply to every request method):

```typescript
app.setGlobalPrefix('v1', { exclude: ['cats'] });
```

> info **Hint** The `path` property supports wildcard parameters using the [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) package. Note: this does not accept wildcard asterisks `*`. Instead, you must use parameters (`:param`) or named wildcards (`*splat`).


---

## Migration guide

### Migration guide

This article offers a comprehensive guide for migrating from NestJS version 10 to version 11. To explore the new features introduced in v11, take a look at [this article](https://trilon.io/blog/announcing-nestjs-11-whats-new). While the update includes a few minor breaking changes, they are unlikely to impact most users. You can review the complete list of changes [here](https://github.com/nestjs/nest/releases/tag/v11.0.0).

#### Upgrading packages

Although you can manually upgrade your packages, we recommend using [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) for a more streamlined process.

#### Express v5

After years of development, Express v5 was officially released in 2024 and became a stable version in 2025. With NestJS 11, Express v5 is now the default version integrated into the framework. While this update is seamless for most users, it’s important to be aware that Express v5 introduces some breaking changes. For detailed guidance, refer to the [Express v5 migration guide](https://expressjs.com/en/guide/migrating-5.html).

One of the most notable updates in Express v5 is the revised path route matching algorithm. The following changes have been introduced to how path strings are matched with incoming requests:

- The wildcard `*` must have a name, matching the behavior of parameters: use `/*splat` or `/{{ '{' }}*splat&#125;` instead of `/*`. `splat` is simply the name of the wildcard parameter and has no special meaning. You can name it anything you like, for example, `*wildcard`
- The optional character `?` is no longer supported, use braces instead: `/:file{{ '{' }}.:ext&#125;`.
- Regexp characters are not supported.
- Some characters have been reserved to avoid confusion during upgrade `(()[]?+!)`, use `\` to escape them.
- Parameter names now support valid JavaScript identifiers, or quoted like `:"this"`.

That said, routes that previously worked in Express v4 may not work in Express v5. For example:

```typescript
@Get('users/*')
findAll() {
  // In NestJS 11, this will be automatically converted to a valid Express v5 route.
  // While it may still work, it's no longer advisable to use this wildcard syntax in Express v5.
  return 'This route should not work in Express v5';
}
```

To fix this issue, you can update the route to use a named wildcard:

```typescript
@Get('users/*splat')
findAll() {
  return 'This route will work in Express v5';
}
```

> warning **Warning** Note that `*splat` is a named wildcard that matches any path without the root path. If you need to match the root path as well (`/users`), you can use `/users/{{ '{' }}*splat&#125;`, wrapping the wildcard in braces (optional group). Note that `splat` is simply the name of the wildcard parameter and has no special meaning. You can name it anything you like, for example, `*wildcard`.

Similarly, if you have a middleware that runs on all routes, you may need to update the path to use a named wildcard:

```typescript
// In NestJS 11, this will be automatically converted to a valid Express v5 route.
// While it may still work, it's no longer advisable to use this wildcard syntax in Express v5.
forRoutes('*'); // <-- This should not work in Express v5
```

Instead, you can update the path to use a named wildcard:

```typescript
forRoutes('{*splat}'); // <-- This will work in Express v5
```

Note that `{{ '{' }}*splat&#125;` is a named wildcard that matches any path including the root path. Outer braces make path optional.

#### Query parameters parsing

> info **Note** This change only applies to Express v5.

In Express v5, query parameters are no longer parsed using the `qs` library by default. Instead, the `simple` parser is used, which does not support nested objects or arrays.

As a result, query strings like these:

```plaintext
?filter[where][name]=John&filter[where][age]=30
?item[]=1&item[]=2
```

will no longer be parsed as expected. To revert to the previous behavior, you can configure Express to use the `extended` parser (the default in Express v4) by setting the `query parser` option to `extended`:

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- Make sure to use <NestExpressApplication>
  app.set('query parser', 'extended'); // <-- Add this line
  await app.listen(3000);
}
bootstrap();
```

#### Fastify v5

`@nestjs/platform-fastify` v11 now finally supports Fastify v5. This update should be seamless for most users; however, Fastify v5 introduces a few breaking changes, though these are unlikely to affect the majority of NestJS users. For more detailed information, refer to the [Fastify v5 migration guide](https://fastify.dev/docs/v5.1.x/Guides/Migration-Guide-V5/).

> info **Hint** There have been no changes to path matching in Fastify v5 (except for middleware, see the section below), so you can continue using the wildcard syntax as you did before. The behavior remains the same, and routes defined with wildcards (like `*`) will still work as expected.

#### Fastify CORS

By default, only [CORS-safelisted methods](https://fetch.spec.whatwg.org/#methods) are allowed. If you need to enable additional methods (such as `PUT`, `PATCH`, or `DELETE`), you must explicitly define them in the `methods` option.

```typescript
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']; // OR comma-delimited string 'GET,POST,PUT,PATH,DELETE'

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { cors: { methods } },
);

// OR alternatively, you can use the `enableCors` method
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
app.enableCors({ methods });
```

#### Fastify middleware registration

NestJS 11 now uses the latest version of the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) package to match **middleware paths** in `@nestjs/platform-fastify`. As a result, the `(.*)` syntax for matching all paths is no longer supported. Instead, you should use named wildcards.

For example, if you have a middleware that applies to all routes:

```typescript
// In NestJS 11, this will automatically be converted to a valid route, even if you don't update it.
.forRoutes('(.*)');
```

You'll need to update it to use a named wildcard instead:

```typescript
.forRoutes('*splat');
```

Where `splat` is just an arbitrary name for the wildcard parameter. You can name it anything you like.

#### Module resolution algorithm

Starting with NestJS 11, the module resolution algorithm has been improved to enhance performance and reduce memory usage for most applications. This change does not require any manual intervention, but there are some edge cases where the behavior may differ from previous versions.

In NestJS v10 and earlier, dynamic modules were assigned a unique opaque key generated from the module's dynamic metadata. This key was used to identify the module in the module registry. For example, if you included `TypeOrmModule.forFeature([User])` in multiple modules, NestJS would deduplicate the modules and treat them as a single module node in the registry. This process is known as node deduplication.

With the release of NestJS v11, we no longer generate predictable hashes for dynamic modules. Instead, object references are now used to determine if one module is equivalent to another. To share the same dynamic module across multiple modules, simply assign it to a variable and import it wherever needed. This new approach provides more flexibility and ensures that dynamic modules are handled more efficiently.

This new algorithm might impact your integration tests if you use a lot of dynamic modules, because without the manually deduplication mentioned above, your TestingModule could have multiple instances of a dependency. This makes it a bit trickier to stub a method, because you'll need to target the correct instance. Your options are to either:

- Deduplicate the dynamic module you'd like to stub
- Use `module.select(ParentModule).get(Target)` to find the correct instance
- Stub all instances using `module.get(Target, {{ '{' }} each: true &#125;)`
- Or switch your test back to the old algorithm using `Test.createTestingModule({{ '{' }}&#125;, {{ '{' }} moduleIdGeneratorAlgorithm: 'deep-hash' &#125;)`

#### Reflector type inference

NestJS 11 introduces several improvements to the `Reflector` class, enhancing its functionality and type inference for metadata values. These updates provide a more intuitive and robust experience when working with metadata.

1. `getAllAndMerge` now returns an object rather than an array containing a single element when there is only one metadata entry, and the `value` is of type `object`. This change improves consistency when dealing with object-based metadata.
2. The `getAllAndOverride` return type has been updated to `T | undefined` instead of `T`. This update better reflects the possibility of no metadata being found and ensures proper handling of undefined cases.
3. The `ReflectableDecorator`'s transformed type argument is now properly inferred across all methods.

These enhancements improve the overall developer experience by providing better type safety and handling of metadata in NestJS 11.

#### Lifecycle hooks execution order

Termination lifecycle hooks are now executed in the reverse order to their initialization counterparts. That said, hooks like `OnModuleDestroy`, `BeforeApplicationShutdown`, and `OnApplicationShutdown` are now executed in the reverse order.

Imagine the following scenario:

```plaintext
// Where A, B, and C are modules and "->" represents the module dependency.
A -> B -> C
```

In this case, the `OnModuleInit` hooks are executed in the following order:

```plaintext
C -> B -> A
```

While the `OnModuleDestroy` hooks are executed in the reverse order:

```plaintext
A -> B -> C
```

> info **Hint** Global modules are treated as a dependency of all other modules. This means that global modules are initialized first and destroyed last.

#### Middleware registration order

In NestJS v11, the behavior of middleware registration has been updated. Previously, the order of middleware registration was determined by the topological sort of the module dependency graph, where the distance from the root module defined the order of middleware registration, regardless of whether the middleware was registered in a global module or a regular module. Global modules were treated like regular modules in this respect, which led to inconsistent behavior, especially when compared to other framework features.

From v11 onwards, middleware registered in global modules is now **executed first**, regardless of its position in the module dependency graph. This change ensures that global middleware always runs before any middleware from imported modules, maintaining a consistent and predictable order.

#### Cache module

The `CacheModule` (from the `@nestjs/cache-manager` package) has been updated to support the latest version of the `cache-manager` package. This update brings a few breaking changes, including a migration to [Keyv](https://keyv.org/), which offers a unified interface for key-value storage across multiple backend stores through storage adapters.

The key difference between the previous version and the new version lies in the configuration of external stores. In the previous version, to register a Redis store, you would have likely configured it like this:

```ts
// Old version - no longer supported
CacheModule.registerAsync({
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });

    return {
      store,
    };
  },
}),
```

In the new version, you should use the `Keyv` adapter to configure the store:

```ts
// New version - supported
CacheModule.registerAsync({
  useFactory: async () => {
    return {
      stores: [
        new KeyvRedis('redis://localhost:6379'),
      ],
    };
  },
}),
```

Where `KeyvRedis` is imported from the `@keyv/redis` package. See the [Caching documentation](/techniques/caching) to learn more.

> warning **Warning** In this update, cached data handled by the Keyv library is now structured as an object containing `value` and `expires` fields, for example: `{{ '{' }}"value": "yourData", "expires": 1678901234567{{ '}' }}`. While Keyv automatically retrieves the `value` field when accessing data through its API, it’s important to note this change if you interact with the cache data directly (e.g., outside of the cache-manager API) or need to support data written using the previous version of `@nestjs/cache-manager`.

#### Config module

If you're using the `ConfigModule` from the `@nestjs/config` package, be aware of several breaking changes introduced in `@nestjs/config@4.0.0`. Most notably, the order in which configuration variables are read by the `ConfigService#get` method has been updated. The new order is:

- Internal configuration (config namespaces and custom config files)
- Validated environment variables (if validation is enabled and a schema is provided)
- The `process.env` object

Previously, validated environment variables and the `process.env` object were read first, preventing them from being overridden by internal configuration. With this update, internal configuration will now always take precedence over environment variables.

Additionally, the `ignoreEnvVars` configuration option, which previously allowed disabling validation of the `process.env` object, has been deprecated. Instead, use the `validatePredefined` option (set to `false` to disable validation of predefined environment variables). Predefined environment variables refer to `process.env` variables that were set before the module was imported. For example, if you start your application with `PORT=3000 node main.js`, the `PORT` variable is considered predefined. However, variables loaded by the `ConfigModule` from a `.env` file are not classified as predefined.

A new `skipProcessEnv` option has also been introduced. This option allows you to prevent the `ConfigService#get` method from accessing the `process.env` object entirely, which can be helpful when you want to restrict the service from reading environment variables directly.

#### Terminus module

If you are using the `TerminusModule` and have built your own custom health indicator, a new API has been introduced in version 11. The new `HealthIndicatorService` is designed to enhance the readability and testability of custom health indicators.

Before version 11, a health indicator might have looked like this:

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      const result = this.getStatus(key, isHealthy, {
        badboys: badboys.length,
      });

      if (!isHealthy) {
        throw new HealthCheckError('Dog check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, isHealthy);
      throw new HealthCheckError('Dog check failed', result);
    }
  }

  private getBadboys() {
    return firstValueFrom(
      this.httpService.get<Dog[]>('https://example.com/dog').pipe(
        map((response) => response.data),
        map((dogs) => dogs.filter((dog) => dog.state === DogState.BAD_BOY)),
      ),
    );
  }
}
```

Starting with version 11, it is recommended to use the new `HealthIndicatorService` API, which streamlines the implementation process. Here's how the same health indicator can now be implemented:

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    //  Inject the `HealthIndicatorService` provided by the `TerminusModule`
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    // Start the health indicator check for the given key
    const indicator = this.healthIndicatorService.check(key);

    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      if (!isHealthy) {
        // Mark the indicator as "down" and add additional info to the response
        return indicator.down({ badboys: badboys.length });
      }

      // Mark the health indicator as up
      return indicator.up();
    } catch (error) {
      return indicator.down('Unable to retrieve dogs');
    }
  }

  private getBadboys() {
    // ...
  }
}
```

Key changes:

- The `HealthIndicatorService` replaces the legacy `HealthIndicator` and `HealthCheckError` classes, providing a cleaner API for health checks.
- The `check` method allows for easy state tracking (`up` or `down`) while supporting the inclusion of additional metadata in health check responses.

> info **Info** Please note that the `HealthIndicator` and `HealthCheckError` classes have been marked as deprecated and are scheduled for removal in the next major release.

#### Node.js v16 and v18 no longer supported

Starting with NestJS 11, Node.js v16 is no longer supported, as it reached its end-of-life (EOL) on September 11, 2023. Likewise, the security support is scheduled to end on April 30, 2025 for Node.js v18, so we went ahead and dropped support for it as well.

NestJS 11 now requires **Node.js v20 or higher**.

To ensure the best experience, we strongly recommend using the latest LTS version of Node.js.

#### Mau official deployment platform

In case you missed the announcement, we launched our official deployment platform, [Mau](https://www.mau.nestjs.com/), in 2024.
Mau is a fully managed platform that simplifies the deployment process for NestJS applications. With Mau, you can deploy your applications to the cloud (**AWS**; Amazon Web Services) with a single command, manage your environment variables, and monitor your application's performance in real-time.

Mau makes provisioning and maintaining your infrastructure as simple as clicking just a few buttons. Mau is designed to be simple and intuitive, so you can focus on building your applications and not worry about the underlying infrastructure. Under the hood, we use Amazon Web Services to provide you with a powerful and reliable platform, while abstracting away all the complexity of AWS. We take care of all the heavy lifting for you, so you can focus on building your applications and growing your business.

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

You can learn more about Mau [in this chapter](/deployment#easy-deployment-with-mau).


---

## Necord

### Necord

Necord is a powerful module that simplifies the creation of [Discord](https://discord.com) bots, allowing for seamless integration with your NestJS application.

> info **Note** Necord is a third-party package and is not officially maintained by the NestJS core team. If you encounter any issues, please report them in the [official repository](https://github.com/necordjs/necord).

#### Installation

To get started, you need to install Necord alongside its dependency, [`Discord.js`](https://discord.js.org).

```bash
$ npm install necord discord.js
```

#### Usage

To utilize Necord in your project, import the `NecordModule` and configure it with the necessary options.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { AppService } from './app.service';

@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```

> info **Hint** You can find a comprehensive list of available intents [here](https://discord.com/developers/docs/topics/gateway#gateway-intents).

With this setup, you can inject the `AppService` into your providers to easily register commands, events, and more.

```typescript
@@filename(app.service)
import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client } from 'discord.js';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }
}
```

##### Understanding context

You may have noticed the `@Context` decorator in the examples above. This decorator injects the event context into your method, allowing you to access various event-specific data. Since there are multiple types of events, the context type is inferred using the `ContextOf<type: string>` type. You can easily access context variables by using the `@Context()` decorator, which fills the variable with an array of arguments relevant to the event.

#### Text commands

> warning **Caution** Text commands rely on message content, which is set to be deprecated for verified bots and applications with over 100 servers. This means that if your bot is unable to access message content, text commands will not function. Read more about this change [here](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots).

Here's how to create a simple command handler for messages using the `@TextCommand` decorator.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, TextCommand, TextCommandContext, Arguments } from 'necord';

@Injectable()
export class AppCommands {
  @TextCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public onPing(
    @Context() [message]: TextCommandContext,
    @Arguments() args: string[],
  ) {
    return message.reply('pong!');
  }
}
```

#### Application commands

Application commands provide a native way for users to interact with your app within the Discord client. There are three types of application commands that can be accessed through different interfaces: chat input, message context menu (accessed by right-clicking a message), and user context menu (accessed by right-clicking a user).

<figure><img class="illustrative-image" src="https://i.imgur.com/4EmG8G8.png" /></figure>

#### Slash commands

Slash commands are an excellent way to engage with users in a structured manner. They allow you to create commands with precise arguments and options, enhancing the user experience significantly.

To define a slash command using Necord, you can use the `SlashCommand` decorator.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong!' });
  }
}
```

> info **Hint** When your bot client logs in, it will automatically register all defined commands. Note that global commands are cached for up to an hour. To avoid issues with the global cache, utilize the `development` argument in the Necord module, which restricts command visibility to a single guild.

##### Options

You can define parameters for your slash commands using option decorators. Let's create a `TextDto` class for this purpose:

```typescript
@@filename(text.dto)
import { StringOption } from 'necord';

export class TextDto {
  @StringOption({
    name: 'text',
    description: 'Input your text here',
    required: true,
  })
  text: string;
}
```

You can then use this DTO in the `AppCommands` class:

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { TextDto } from './length.dto';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
    });
  }
}
```

For a complete list of built-in option decorators, check out [this documentation](https://necord.org/interactions/slash-commands#options).

##### Autocomplete

To implement autocomplete functionality for your slash commands, you'll need to create an interceptor. This interceptor will handle requests as users type in the autocomplete field.

```typescript
@@filename(cats-autocomplete.interceptor)
import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
class CatsAutocompleteInterceptor extends AutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    let choices: string[];

    if (focused.name === 'cat') {
      choices = ['Siamese', 'Persian', 'Maine Coon'];
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
```

You will also need to mark your options class with `autocomplete: true`:

```typescript
@@filename(cat.dto)
import { StringOption } from 'necord';

export class CatDto {
  @StringOption({
    name: 'cat',
    description: 'Choose a cat breed',
    autocomplete: true,
    required: true,
  })
  cat: string;
}
```

Finally, apply the interceptor to your slash command:

```typescript
@@filename(cats.commands)
import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { CatDto } from '/cat.dto';
import { CatsAutocompleteInterceptor } from './cats-autocomplete.interceptor';

@Injectable()
export class CatsCommands {
  @UseInterceptors(CatsAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: CatDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
    });
  }
}
```

#### User context menu

User commands appear on the context menu that appears when right-clicking (or tapping) on users. These commands provide quick actions that target users directly.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, UserCommand, UserCommandContext, TargetUser } from 'necord';
import { User } from 'discord.js';

@Injectable()
export class AppCommands {
  @UserCommand({ name: 'Get avatar' })
  public async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(`Avatar of ${user.username}`)
          .setImage(user.displayAvatarURL({ size: 4096, dynamic: true })),
      ],
    });
  }
}
```

#### Message context menu

Message commands show up in the context menu when right-clicking on messages, allowing for quick actions relevant to those messages.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, MessageCommand, MessageCommandContext, TargetMessage } from 'necord';
import { Message } from 'discord.js';

@Injectable()
export class AppCommands {
  @MessageCommand({ name: 'Copy Message' })
  public async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({ content: message.content });
  }
}
```

#### Buttons

[Buttons](https://discord.com/developers/docs/interactions/message-components#buttons) are interactive elements that can be included in messages. When clicked, they send an [interaction](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object) to your application.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, Button, ButtonContext } from 'necord';

@Injectable()
export class AppComponents {
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' });
  }
}
```

#### Select menus

[Select menus](https://discord.com/developers/docs/interactions/message-components#select-menus) are another type of interactive component that appears on messages. They provide a dropdown-like UI for users to select options.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, StringSelect, StringSelectContext, SelectedStrings } from 'necord';

@Injectable()
export class AppComponents {
  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: `You selected: ${values.join(', ')}` });
  }
}
```

For a full list of built-in select menu components, visit [this link](https://necord.org/interactions/message-components#select-menu).

#### Modals

Modals are pop-up forms that allow users to submit formatted input. Here's how to create and handle modals using Necord:

```typescript
@@filename(app.modals)
import { Injectable } from '@nestjs/common';
import { Context, Modal, ModalContext } from 'necord';

@Injectable()
export class AppModals {
  @Modal('pizza')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: `Your fav pizza : ${interaction.fields.getTextInputValue('pizza')}`
    });
  }
}
```

#### More information

Visit the [Necord](https://necord.org) website for more information.


---

## Official NestJS Consulting

### Official NestJS Consulting

Our goal is to ensure that your developers are successful and productive with NestJS as well as other modern technologies in today's ever-changing tech world.

### Official Support

With official support, get expert help directly from the NestJS core team. We tackle your toughest challenges, and collaborate with your team on many levels such as:

- Providing technical guidance & architectural reviews
- **Mentoring** team members
- Advising best practices
- Solving design decisions
- Addressing security & performance concerns
- Performing **in-depth** code reviews

<div class="row">
  <div class="content">
    <h4>Team Augmentation & Development</h4>
    <p>
      With team augmentation, NestJS core team members can work directly with your team on a daily basis to help take your project to the next-level. Consider us “part of your team”, tackling the most ambitious projects - right by your side.
    </p>
  </div>
  <div class="thumbnail p-l-30">
    <img src="/assets/enterprise/help.svg" />
  </div>
</div>

<div class="row">
<div class="thumbnail p-r-30">
    <img src="/assets/enterprise/contact.svg" />
  </div>
  <div class="content">
    <h4>NestJS Best Practices</h4>
    <p>
      Frequent code reviews can eliminate potentially hazardous bugs & issues at an early stage and help enforce best practices. Let us perform PR reviews & audits to ensure your code quality, performance, and security.
    </p>
  </div>
</div>

#### First-hand access

Direct communication channel will boost team velocity, giving a quick access to discuss and solve problems.

#### NestJS Workshops and Trainings

We provide solid kick-off training as well as more advanced ones that give teams an in-depth understanding of NestJS. We offer on-site workshops and remote intensive sessions which help get you up and running _quickly_ within the NestJS ecosystem.

<div class="contact-us">
  <div class="column column-text">
    <h5>Contact us!</h5>
    <p>
    Let's talk how we can help you become successful with NestJS.
    </p> 
  </div>
   <div class="column column-action">
     <a href="mailto:support@nestjs.com">CONTACT US</a>
   </div>
</div>

Reach out to us at [support@nestjs.com](mailto:support@nestjs.com), and let’s talk about your project & teams needs!


---

## Rate Limiting

### Rate Limiting

A common technique to protect applications from brute-force attacks is **rate-limiting**. To get started, you'll need to install the `@nestjs/throttler` package.

```bash
$ npm i --save @nestjs/throttler
```

Once the installation is complete, the `ThrottlerModule` can be configured as any other Nest package with `forRoot` or `forRootAsync` methods.

```typescript
@@filename(app.module)
@Module({
  imports: [
     ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
})
export class AppModule {}
```

The above will set the global options for the `ttl`, the time to live in milliseconds, and the `limit`, the maximum number of requests within the ttl, for the routes of your application that are guarded.

Once the module has been imported, you can then choose how you would like to bind the `ThrottlerGuard`. Any kind of binding as mentioned in the [guards](https://docs.nestjs.com/guards) section is fine. If you wanted to bind the guard globally, for example, you could do so by adding this provider to any module:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Multiple Throttler Definitions

There may come upon times where you want to set up multiple throttling definitions, like no more than 3 calls in a second, 20 calls in 10 seconds, and 100 calls in a minute. To do so, you can set up your definitions in the array with named options, that can later be referenced in the `@SkipThrottle()` and `@Throttle()` decorators to change the options again.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

#### Customization

There may be a time where you want to bind the guard to a controller or globally, but want to disable rate limiting for one or more of your endpoints. For that, you can use the `@SkipThrottle()` decorator, to negate the throttler for an entire class or a single route. The `@SkipThrottle()` decorator can also take in an object of string keys with boolean values for if there is a case where you want to exclude _most_ of a controller, but not every route, and configure it per throttler set if you have more than one. If you do not pass an object, the default is to use `{{ '{' }} default: true {{ '}' }}`

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

This `@SkipThrottle()` decorator can be used to skip a route or a class or to negate the skipping of a route in a class that is skipped.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {
  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'List users work with Rate limiting.';
  }
  // This route will skip rate limiting.
  doSkip() {
    return 'List users work without Rate limiting.';
  }
}
```

There is also the `@Throttle()` decorator which can be used to override the `limit` and `ttl` set in the global module, to give tighter or looser security options. This decorator can be used on a class or a function as well. With version 5 and onwards, the decorator takes in an object with the string relating to the name of the throttler set, and an object with the limit and ttl keys and integer values, similar to the options passed to the root module. If you do not have a name set in your original options, use the string `default`. You have to configure it like this:

```typescript
// Override default configuration for Rate limiting and duration.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
```

#### Proxies

If your application is running behind a proxy server, it’s essential to configure the HTTP adapter to trust the proxy. You can refer to the specific HTTP adapter options for [Express](http://expressjs.com/en/guide/behind-proxies.html) and [Fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy) to enable the `trust proxy` setting.

Here's an example that demonstrates how to enable `trust proxy` for the Express adapter:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
```

Enabling `trust proxy` allows you to retrieve the original IP address from the `X-Forwarded-For` header. You can also customize the behavior of your application by overriding the `getTracker()` method to extract the IP address from this header instead of relying on `req.ip`. The following example demonstrates how to achieve this for both Express and Fastify:

```typescript
@@filename(throttler-behind-proxy.guard)
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  }
}
```

> info **Hint** You can find the API of the `req` Request object for express [here](https://expressjs.com/en/api.html#req.ips) and for fastify [here](https://www.fastify.io/docs/latest/Reference/Request/).

#### Websockets

This module can work with websockets, but it requires some class extension. You can extend the `ThrottlerGuard` and override the `handleRequest` method like so:

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;

    const client = context.switchToWs().getClient();
    const tracker = client._socket.remoteAddress;
    const key = generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name,
      );

    const getThrottlerSuffix = (name: string) =>
      name === 'default' ? '' : `-${name}`;

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
```

> info **Hint** If you are using ws, it is necessary to replace the `_socket` with `conn`

There's a few things to keep in mind when working with WebSockets:

- Guard cannot be registered with the `APP_GUARD` or `app.useGlobalGuards()`
- When a limit is reached, Nest will emit an `exception` event, so make sure there is a listener ready for this

> info **Hint** If you are using the `@nestjs/platform-ws` package you can use `client._socket.remoteAddress` instead.

#### GraphQL

The `ThrottlerGuard` can also be used to work with GraphQL requests. Again, the guard can be extended, but this time the `getRequestResponse` method will be overridden

```typescript
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

#### Configuration

The following options are valid for the object passed to the array of the `ThrottlerModule`'s options:

<table>
  <tr>
    <td><code>name</code></td>
    <td>the name for internal tracking of which throttler set is being used. Defaults to <code>default</code> if not passed</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>the number of milliseconds that each request will last in storage</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>the maximum number of requests within the TTL limit</td>
  </tr>
  <tr>
    <td><code>blockDuration</code></td>
    <td>the number of milliseconds that request will be blocked for that time</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions of user-agents to ignore when it comes to throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes in the <code>ExecutionContext</code> and returns a <code>boolean</code> to short circuit the throttler logic. Like <code>@SkipThrottler()</code>, but based on the request</td>
  </tr>
</table>

If you need to set up storage instead, or want to use some of the above options in a more global sense, applying to each throttler set, you can pass the options above via the `throttlers` option key and use the below table

<table>
  <tr>
    <td><code>storage</code></td>
    <td>a custom storage service for where the throttling should be kept track. <a href="/security/rate-limiting#storages">See here.</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>an array of regular expressions of user-agents to ignore when it comes to throttling requests</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>a function that takes in the <code>ExecutionContext</code> and returns a <code>boolean</code> to short circuit the throttler logic. Like <code>@SkipThrottler()</code>, but based on the request</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>an array of throttler sets, defined using the table above</td>
  </tr>
  <tr>
    <td><code>errorMessage</code></td>
    <td>a <code>string</code> OR a function that takes in the <code>ExecutionContext</code> and the <code>ThrottlerLimitDetail</code> and returns a <code>string</code> which overrides the default throttler error message</td>
  </tr>
  <tr>
    <td><code>getTracker</code></td>
    <td>a function that takes in the <code>Request</code> and returns a <code>string</code> to override the default logic of the <code>getTracker</code> method</td>
  </tr>
  <tr>
    <td><code>generateKey</code></td>
    <td>a function that takes in the <code>ExecutionContext</code>, the tacker <code>string</code> and the throttler name as a <code>string</code> and returns a <code>string</code> to override the final key which will be used to store the rate limit value. This overrides the default logic of the <code>generateKey</code> method</td>
  </tr>
</table>

#### Async Configuration

You may want to get your rate-limiting configuration asynchronously instead of synchronously. You can use the `forRootAsync()` method, which allows for dependency injection and `async` methods.

One approach would be to use a factory function:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

You can also use the `useClass` syntax:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
```

This is doable, as long as `ThrottlerConfigService` implements the interface `ThrottlerOptionsFactory`.

#### Storages

The built in storage is an in memory cache that keeps track of the requests made until they have passed the TTL set by the global options. You can drop in your own storage option to the `storage` option of the `ThrottlerModule` so long as the class implements the `ThrottlerStorage` interface.

For distributed servers you could use the community storage provider for [Redis](https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis) to have a single source of truth.

> info **Note** `ThrottlerStorage` can be imported from `@nestjs/throttler`.

#### Time Helpers

There are a couple of helper methods to make the timings more readable if you prefer to use them over the direct definition. `@nestjs/throttler` exports five different helpers, `seconds`, `minutes`, `hours`, `days`, and `weeks`. To use them, simply call `seconds(5)` or any of the other helpers, and the correct number of milliseconds will be returned.

#### Migration Guide

For most people, wrapping your options in an array will be enough.

If you are using a custom storage, you should wrap your `ttl` and `limit` in an
array and assign it to the `throttlers` property of the options object.

Any `@SkipThrottle()` decorator can be used to bypass throttling for specific routes or methods. It accepts an optional boolean parameter, which defaults to `true`. This is useful when you want to skip rate limiting on particular endpoints.

Any `@Throttle()` decorators should also now take in an object with string keys,
relating to the names of the throttler contexts (again, `'default'` if no name)
and values of objects that have `limit` and `ttl` keys.

> Warning **Important** The `ttl` is now in **milliseconds**. If you want to keep your ttl
> in seconds for readability, use the `seconds` helper from this package. It just
> multiplies the ttl by 1000 to make it in milliseconds.

For more info, see the [Changelog](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500)


---

## Serverless

### Serverless

Serverless computing is a cloud computing execution model in which the cloud provider allocates machine resources on-demand, taking care of the servers on behalf of their customers. When an app is not in use, there are no computing resources allocated to the app. Pricing is based on the actual amount of resources consumed by an application ([source](https://en.wikipedia.org/wiki/Serverless_computing)).

With a **serverless architecture**, you focus purely on the individual functions in your application code. Services such as AWS Lambda, Google Cloud Functions, and Microsoft Azure Functions take care of all the physical hardware, virtual machine operating system, and web server software management.

> info **Hint** This chapter does not cover the pros and cons of serverless functions nor dives into the specifics of any cloud providers.

#### Cold start

A cold start is the first time your code has been executed in a while. Depending on a cloud provider you use, it may span several different operations, from downloading the code and bootstrapping the runtime to eventually running your code.
This process adds **significant latency** depending on several factors, the language, the number of packages your application require, etc.

The cold start is important and although there are things which are beyond our control, there's still a lot of things we can do on our side to make it as short as possible.

While you can think of Nest as a fully-fledged framework designed to be used in complex, enterprise applications,
it is also **suitable for much "simpler" applications** (or scripts). For example, with the use of [Standalone applications](/standalone-applications) feature, you can take advantage of Nest's DI system in simple workers, CRON jobs, CLIs, or serverless functions.

#### Benchmarks

To better understand what's the cost of using Nest or other, well-known libraries (like `express`) in the context of serverless functions, let's compare how much time Node runtime needs to run the following scripts:

```typescript
// #1 Express
import * as express from 'express';

async function bootstrap() {
  const app = express();
  app.get('/', (req, res) => res.send('Hello world!'));
  await new Promise<void>((resolve) => app.listen(3000, resolve));
}
bootstrap();

// #2 Nest (with @nestjs/platform-express)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

// #3 Nest as a Standalone application (no HTTP server)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  console.log(app.get(AppService).getHello());
}
bootstrap();

// #4 Raw Node.js script
async function bootstrap() {
  console.log('Hello world!');
}
bootstrap();
```

For all these scripts, we used the `tsc` (TypeScript) compiler and so the code remains unbundled (`webpack` isn't used).

|                                      |                   |
| ------------------------------------ | ----------------- |
| Express                              | 0.0079s (7.9ms)   |
| Nest with `@nestjs/platform-express` | 0.1974s (197.4ms) |
| Nest (standalone application)        | 0.1117s (111.7ms) |
| Raw Node.js script                   | 0.0071s (7.1ms)   |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

Now, let's repeat all benchmarks but this time, using `webpack` (if you have [Nest CLI](/cli/overview) installed, you can run `nest build --webpack`) to bundle our application into a single executable JavaScript file.
However, instead of using the default `webpack` configuration that Nest CLI ships with, we'll make sure to bundle all dependencies (`node_modules`) together, as follows:

```javascript
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
```

> info **Hint** To instruct Nest CLI to use this configuration, create a new `webpack.config.js` file in the root directory of your project.

With this configuration, we received the following results:

|                                      |                  |
| ------------------------------------ | ---------------- |
| Express                              | 0.0068s (6.8ms)  |
| Nest with `@nestjs/platform-express` | 0.0815s (81.5ms) |
| Nest (standalone application)        | 0.0319s (31.9ms) |
| Raw Node.js script                   | 0.0066s (6.6ms)  |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

> info **Hint** You could optimize it even further by applying additional code minification & optimization techniques (using `webpack` plugins, etc.).

As you can see, the way you compile (and whether you bundle your code) is crucial and has a significant impact on the overall startup time. With `webpack`, you can get the bootstrap time of a standalone Nest application (starter project with one module, controller, and service) down to ~32ms on average, and down to ~81.5ms for a regular HTTP, express-based NestJS app.

For more complicated Nest applications, for example, with 10 resources (generated through `$ nest g resource` schematic = 10 modules, 10 controllers, 10 services, 20 DTO classes, 50 HTTP endpoints + `AppModule`), the overall startup on MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD is approximately 0.1298s (129.8ms). Running a monolithic application as a serverless function typically doesn't make too much sense anyway, so think of this benchmark more as an example of how the bootstrap time may potentially increase as your application grows.

#### Runtime optimizations

Thus far we covered compile-time optimizations. These are unrelated to the way you define providers and load Nest modules in your application, and that plays an essential role as your application gets bigger.

For example, imagine having a database connection defined as an [asynchronous provider](/fundamentals/async-providers). Async providers are designed to delay the application start until one or more asynchronous tasks are completed.
That means, if your serverless function on average requires 2s to connect to the database (on bootstrap), your endpoint will need at least two extra seconds (because it must wait till the connection is established) to send a response back (when it's a cold start and your application wasn't running already).

As you can see, the way you structure your providers is somewhat different in a **serverless environment** where bootstrap time is important.
Another good example is if you use Redis for caching, but only in certain scenarios. Perhaps, in this case, you should not define a Redis connection as an async provider, as it would slow down the bootstrap time, even if it's not required for this specific function invocation.

Also, sometimes you could lazy load entire modules, using the `LazyModuleLoader` class, as described in [this chapter](/fundamentals/lazy-loading-modules). Caching is a great example here too.
Imagine that your application has, let's say, `CacheModule` which internally connects to Redis and also, exports the `CacheService` to interact with the Redis storage. If you don't need it for all potential function invocations,
you can just load it on-demand, lazily. This way you'll get a faster startup time (when a cold start occurs) for all invocations that don't require caching.

```typescript
if (request.method === RequestMethod[RequestMethod.GET]) {
  const { CacheModule } = await import('./cache.module');
  const moduleRef = await this.lazyModuleLoader.load(() => CacheModule);

  const { CacheService } = await import('./cache.service');
  const cacheService = moduleRef.get(CacheService);

  return cacheService.get(ENDPOINT_KEY);
}
```

Another great example is a webhook or worker, which depending on some specific conditions (e.g., input arguments), may perform different operations.
In such a case, you could specify a condition inside your route handler that lazily loads an appropriate module for the specific function invocation, and just load every other module lazily.

```typescript
if (workerType === WorkerType.A) {
  const { WorkerAModule } = await import('./worker-a.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerAModule);
  // ...
} else if (workerType === WorkerType.B) {
  const { WorkerBModule } = await import('./worker-b.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerBModule);
  // ...
}
```

#### Example integration

The way your application's entry file (typically `main.ts` file) is supposed to look like **depends on several factors** and so **there's no single template** that just works for every scenario.
For example, the initialization file required to spin up your serverless function varies by cloud providers (AWS, Azure, GCP, etc.).
Also, depending on whether you want to run a typical HTTP application with multiple routes/endpoints or just provide a single route (or execute a specific portion of code),
your application's code will look different (for example, for the endpoint-per-function approach you could use the `NestFactory.createApplicationContext` instead of booting the HTTP server, setting up middleware, etc.).

Just for illustration purposes, we'll integrate Nest (using `@nestjs/platform-express` and so spinning up the whole, fully functional HTTP router)
with the [Serverless](https://www.serverless.com/) framework (in this case, targeting AWS Lambda). As we've mentioned earlier, your code will differ depending on the cloud provider you choose, and many other factors.

First, let's install the required packages:

```bash
$ npm i @codegenie/serverless-express aws-lambda
$ npm i -D @types/aws-lambda serverless-offline
```

> info **Hint** To speed up development cycles, we install the `serverless-offline` plugin which emulates AWS λ and API Gateway.

Once the installation process is complete, let's create the `serverless.yml` file to configure the Serverless framework:

```yaml
service: serverless-example

plugins:
  - serverless-offline

provider:
  name: aws
  runtime: nodejs14.x

functions:
  main:
    handler: dist/main.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

> info **Hint** To learn more about the Serverless framework, visit the [official documentation](https://www.serverless.com/framework/docs/).

With this in place, we can now navigate to the `main.ts` file and update our bootstrap code with the required boilerplate:

```typescript
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

> info **Hint** For creating multiple serverless functions and sharing common modules between them, we recommend using the [CLI Monorepo mode](/cli/monorepo#monorepo-mode).

> warning **Warning** If you use `@nestjs/swagger` package, there are a few additional steps required to make it work properly in the context of serverless function. Check out this [thread](https://github.com/nestjs/swagger/issues/199) for more information.

Next, open up the `tsconfig.json` file and make sure to enable the `esModuleInterop` option to make the `@codegenie/serverless-express` package load properly.

```json
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
```

Now we can build our application (with `nest build` or `tsc`) and use the `serverless` CLI to start our lambda function locally:

```bash
$ npm run build
$ npx serverless offline
```

Once the application is running, open your browser and navigate to `http://localhost:3000/dev/[ANY_ROUTE]` (where `[ANY_ROUTE]` is any endpoint registered in your application).

In the sections above, we've shown that using `webpack` and bundling your app can have significant impact on the overall bootstrap time.
However, to make it work with our example, there are a few additional configurations you must add in your `webpack.config.js` file. Generally,
to make sure our `handler` function will be picked up, we must change the `output.libraryTarget` property to `commonjs2`.

```javascript
return {
  ...options,
  externals: [],
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

With this in place, you can now use `$ nest build --webpack` to compile your function's code (and then `$ npx serverless offline` to test it).

It's also recommended (but **not required** as it will slow down your build process) to install the `terser-webpack-plugin` package and override its configuration to keep classnames intact when minifying your production build. Not doing so can result in incorrect behavior when using `class-validator` within your application.

```javascript
const TerserPlugin = require('terser-webpack-plugin');

return {
  ...options,
  externals: [],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

#### Using standalone application feature

Alternatively, if you want to keep your function very lightweight and you don't need any HTTP-related features (routing, but also guards, interceptors, pipes, etc.),
you can just use `NestFactory.createApplicationContext` (as mentioned earlier) instead of running the entire HTTP server (and `express` under the hood), as follows:

```typescript
@@filename(main)
import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
```

> info **Hint** Be aware that `NestFactory.createApplicationContext` does not wrap controller methods with enhancers (guard, interceptors, etc.). For this, you must use the `NestFactory.create` method.

You could also pass the `event` object down to, let's say, `EventsService` provider that could process it and return a corresponding value (depending on the input value and your business logic).

```typescript
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const eventsService = appContext.get(EventsService);
  return eventsService.process(event);
};
```


---

## Standalone applications

### Standalone applications

There are several ways of mounting a Nest application. You can create a web app, a microservice or just a bare Nest **standalone application** (without any network listeners). The Nest standalone application is a wrapper around the Nest **IoC container**, which holds all instantiated classes. We can obtain a reference to any existing instance from within any imported module directly using the standalone application object. Thus, you can take advantage of the Nest framework anywhere, including, for example, scripted **CRON** jobs. You can even build a **CLI** on top of it.

#### Getting started

To create a Nest standalone application, use the following construction:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // your application logic here ...
}
bootstrap();
```

#### Retrieving providers from static modules

The standalone application object allows you to obtain a reference to any instance registered within the Nest application. Let's imagine that we have a `TasksService` provider in the `TasksModule` module that was imported by our `AppModule` module. This class provides a set of methods that we want to call from within a CRON job.

```typescript
@@filename()
const tasksService = app.get(TasksService);
```

To access the `TasksService` instance we use the `get()` method. The `get()` method acts like a **query** that searches for an instance in each registered module. You can pass any provider's token to it. Alternatively, for strict context checking, pass an options object with the `strict: true` property. With this option in effect, you have to navigate through specific modules to obtain a particular instance from the selected context.

```typescript
@@filename()
const tasksService = app.select(TasksModule).get(TasksService, { strict: true });
```

Following is a summary of the methods available for retrieving instance references from the standalone application object.

<table>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Retrieves an instance of a controller or provider (including guards, filters, and so on) available in the application context.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the module's graph to pull out a specific instance of the selected module (used together with strict mode as described above).
    </td>
  </tr>
</table>

> info **Hint** In non-strict mode, the root module is selected by default. To select any other module, you need to navigate the modules graph manually, step by step.

Keep in mind that a standalone application does not have any network listeners, so any Nest features related to HTTP (e.g., middleware, interceptors, pipes, guards, etc.) are not available in this context.

For example, even if you register a global interceptor in your application and then retrieve a controller's instance using the `app.get()` method, the interceptor will not be executed.

#### Retrieving providers from dynamic modules

When dealing with [dynamic modules](/fundamentals/dynamic-modules), we should supply the same object that represents the registered dynamic module in the application to `app.select`. For example:

```typescript
@@filename()
export const dynamicConfigModule = ConfigModule.register({ folder: './config' });

@Module({
  imports: [dynamicConfigModule],
})
export class AppModule {}
```

Then you can select that module later on:

```typescript
@@filename()
const configService = app.select(dynamicConfigModule).get(ConfigService, { strict: true });
```

#### Terminating phase

If you want the Node application to close after the script finishes (e.g., for a script running CRON jobs), you must call the `app.close()` method in the end of your `bootstrap` function like this:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // application logic...
  await app.close();
}
bootstrap();
```

And as mentioned in the [Lifecycle events](/fundamentals/lifecycle-events) chapter, that will trigger lifecycle hooks.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/18-context).


---

## Support

### Support

Nest is an MIT-licensed open source project with its ongoing development made possible thanks to the support by the community. This framework is a result of the long road, full of sleepless nights, working **after hours**, and busy weekends.

#### How can you help?

Nest doesn't have a large company that sits behind and is continuously paying for hours spent on the development. I fully rely on the **goodness** ❤️ of the people. However, I would love to make this framework even more **powerful**, to be fully focused on delivering you great solutions that make coding process enjoyable: In order to help me, I run few supporting platforms:

- become a backer or sponsor on [OpenCollective](https://opencollective.com/nest)
- use [PayPal](https://paypal.me/kamilmysliwiec) to send a one-time donation
- or reach me directly: [mail@kamilmysliwiec.com](mailto:mail@kamilmysliwiec.com)

If you fell in love with Nest, or you run a business which is using Nest, consider sponsoring its development to ensure that the project which your product relies on is **actively maintained** and improved. Also, your support could help me to work more on content that benefits whole Nest community, writing either educational blog posts or recording videos.


---

## Who is using Nest?

### Who is using Nest?

We are proudly helping various companies building their products at scale.
If you are using Nest and would you like to be listed here, see this [thread](https://github.com/nestjs/nest/issues/1006).
We are willing to put your logo here!

#### Companies

According to our knowledge, all the following companies have built awesome projects on top of our framework:


---

