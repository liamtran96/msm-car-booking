# Getting Started

## CRUD generator (TypeScript only)

### CRUD generator (TypeScript only)

Throughout the life span of a project, when we build new features, we often need to add new resources to our application. These resources typically require multiple, repetitive operations that we have to repeat each time we define a new resource.

#### Introduction

Let's imagine a real-world scenario, where we need to expose CRUD endpoints for 2 entities, let's say **User** and **Product** entities.
Following the best practices, for each entity we would have to perform several operations, as follows:

- Generate a module (`nest g mo`) to keep code organized and establish clear boundaries (grouping related components)
- Generate a controller (`nest g co`) to define CRUD routes (or queries/mutations for GraphQL applications)
- Generate a service (`nest g s`) to implement & isolate business logic
- Generate an entity class/interface to represent the resource data shape
- Generate Data Transfer Objects (or inputs for GraphQL applications) to define how the data will be sent over the network

That's a lot of steps!

To help speed up this repetitive process, [Nest CLI](/cli/overview) provides a generator (schematic) that automatically generates all the boilerplate code to help us avoid doing all of this, and make the developer experience much simpler.

> info **Note** The schematic supports generating **HTTP** controllers, **Microservice** controllers, **GraphQL** resolvers (both code first and schema first), and **WebSocket** Gateways.

#### Generating a new resource

To create a new resource, simply run the following command in the root directory of your project:

```shell
$ nest g resource
```

`nest g resource` command not only generates all the NestJS building blocks (module, service, controller classes) but also an entity class, DTO classes as well as the testing (`.spec`) files.

Below you can see the generated controller file (for REST API):

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

Also, it automatically creates placeholders for all the CRUD endpoints (routes for REST APIs, queries and mutations for GraphQL, message subscribes for both Microservices and WebSocket Gateways) - all without having to lift a finger.

> warning **Note** Generated service classes are **not** tied to any specific **ORM (or data source)**. This makes the generator generic enough to meet the needs of any project. By default, all methods will contain placeholders, allowing you to populate it with the data sources specific to your project.

Likewise, if you want to generate resolvers for a GraphQL application, simply select the `GraphQL (code first)` (or `GraphQL (schema first)`) as your transport layer.

In this case, NestJS will generate a resolver class instead of a REST API controller:

```shell
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **Hint** To avoid generating test files, you can pass the `--no-spec` flag, as follows: `nest g resource users --no-spec`

We can see below, that not only were all boilerplate mutations and queries created, but everything is all tied together. We're utilizing the `UsersService`, `User` Entity, and our DTO's.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```


---

## Common errors

### Common errors

During your development with NestJS, you may encounter various errors as you learn the framework.

#### "Cannot resolve dependency" error

> info **Hint** Check out the [NestJS Devtools](/devtools/overview#investigating-the-cannot-resolve-dependency-error) which can help you resolve the "Cannot resolve dependency" error effortlessly.

Probably the most common error message is about Nest not being able to resolve dependencies of a provider. The error message usually looks something like this:

```bash
Nest can't resolve dependencies of the <provider> (?). Please make sure that the argument <unknown_token> at index [<index>] is available in the <module> context.

Potential solutions:
- Is <module> a valid NestJS module?
- If <unknown_token> is a provider, is it part of the current <module>?
- If <unknown_token> is exported from a separate @Module, is that module imported within <module>?
  @Module({
    imports: [ /* the Module containing <unknown_token> */ ]
  })
```

The most common culprit of the error, is not having the `<provider>` in the module's `providers` array. Please make sure that the provider is indeed in the `providers` array and following [standard NestJS provider practices](/fundamentals/custom-providers#di-fundamentals).

There are a few gotchas, that are common. One is putting a provider in an `imports` array. If this is the case, the error will have the provider's name where `<module>` should be.

If you run across this error while developing, take a look at the module mentioned in the error message and look at its `providers`. For each provider in the `providers` array, make sure the module has access to all of the dependencies. Often times, `providers` are duplicated in a "Feature Module" and a "Root Module" which means Nest will try to instantiate the provider twice. More than likely, the module containing the `<provider>` being duplicated should be added in the "Root Module"'s `imports` array instead.

If the `<unknown_token>` above is `dependency`, you might have a circular file import. This is different from the [circular dependency](/faq/common-errors#circular-dependency-error) below because instead of having providers depend on each other in their constructors, it just means that two files end up importing each other. A common case would be a module file declaring a token and importing a provider, and the provider import the token constant from the module file. If you are using barrel files, ensure that your barrel imports do not end up creating these circular imports as well.

If the `<unknown_token>` above is `Object`, it means that you're injecting using an type/interface without a proper provider's token. To fix that, make sure that:

1. you're importing the class reference or use a custom token with `@Inject()` decorator. Read the [custom providers page](/fundamentals/custom-providers), and
2. for class-based providers, you're importing the concrete classes instead of only the type via [`import type ...`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) syntax.

Also, make sure you didn't end up injecting the provider on itself because self-injections are not allowed in NestJS. When this happens, `<unknown_token>` will likely be equal to `<provider>`.

<app-banner-devtools></app-banner-devtools>

If you are in a **monorepo setup**, you may face the same error as above but for core provider called `ModuleRef` as a `<unknown_token>`:

```bash
Nest can't resolve dependencies of the <provider> (?).
Please make sure that the argument ModuleRef at index [<index>] is available in the <module> context.
...
```

This likely happens when your project end up loading two Node modules of the package `@nestjs/core`, like this:

```text
.
├── package.json
├── apps
│   └── api
│       └── node_modules
│           └── @nestjs/bull
│               └── node_modules
│                   └── @nestjs/core
└── node_modules
    ├── (other packages)
    └── @nestjs/core
```

Solutions:

- For **Yarn** Workspaces, use the [nohoist feature](https://classic.yarnpkg.com/blog/2018/02/15/nohoist) to prevent hoisting the package `@nestjs/core`.
- For **pnpm** Workspaces, set `@nestjs/core` as a peerDependencies in your other module and `"dependenciesMeta": {{ '{' }}"other-module-name": {{ '{' }}"injected": true &#125;&#125;` in the app package.json where the module is imported. see: [dependenciesmetainjected](https://pnpm.io/package_json#dependenciesmetainjected)

#### "Circular dependency" error

Occasionally you'll find it difficult to avoid [circular dependencies](https://docs.nestjs.com/fundamentals/circular-dependency) in your application. You'll need to take some steps to help Nest resolve these. Errors that arise from circular dependencies look like this:

```bash
Nest cannot create the <module> instance.
The module at index [<index>] of the <module> "imports" array is undefined.

Potential causes:
- A circular dependency between modules. Use forwardRef() to avoid it. Read more: https://docs.nestjs.com/fundamentals/circular-dependency
- The module at index [<index>] is of type "undefined". Check your import statements and the type of the module.

Scope [<module_import_chain>]
# example chain AppModule -> FooModule
```

Circular dependencies can arise from both providers depending on each other, or typescript files depending on each other for constants, such as exporting constants from a module file and importing them in a service file. In the latter case, it is advised to create a separate file for your constants. In the former case, please follow the guide on circular dependencies and make sure that both the modules **and** the providers are marked with `forwardRef`.

#### Debugging dependency errors

Along with just manually verifying your dependencies are correct, as of Nest 8.1.0 you can set the `NEST_DEBUG` environment variable to a string that resolves as truthy, and get extra logging information while Nest is resolving all of the dependencies for the application.

<figure><img src="/assets/injector_logs.png" /></figure>

In the above image, the string in yellow is the host class of the dependency being injected, the string in blue is the name of the injected dependency, or its injection token, and the string in purple is the module in which the dependency is being searched for. Using this, you can usually trace back the dependency resolution for what's happening and why you're getting dependency injection problems.

#### "File change detected" loops endlessly

Windows users who are using TypeScript version 4.9 and up may encounter this problem.
This happens when you're trying to run your application in watch mode, e.g `npm run start:dev` and see an endless loop of the log messages:

```bash
XX:XX:XX AM - File change detected. Starting incremental compilation...
XX:XX:XX AM - Found 0 errors. Watching for file changes.
```

When you're using the NestJS CLI to start your application in watch mode it is done by calling `tsc --watch`, and as of version 4.9 of TypeScript, a [new strategy](https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/#file-watching-now-uses-file-system-events) for detecting file changes is used which is likely to be the cause of this problem.
In order to fix this problem, you need to add a setting to your tsconfig.json file after the `"compilerOptions"` option as follows:

```bash
  "watchOptions": {
    "watchFile": "fixedPollingInterval"
  }
```

This tells TypeScript to use the polling method for checking for file changes instead of file system events (the new default method), which can cause issues on some machines.
You can read more about the `"watchFile"` option in [TypeScript documentation](https://www.typescriptlang.org/tsconfig#watch-watchDirectory).


---

## First steps

### First steps

In this set of articles, you'll learn the **core fundamentals** of Nest. To get familiar with the essential building blocks of Nest applications, we'll build a basic CRUD application with features that cover a lot of ground at an introductory level.

#### Language

We're in love with [TypeScript](https://www.typescriptlang.org/), but above all - we love [Node.js](https://nodejs.org/en/). That's why Nest is compatible with both TypeScript and pure JavaScript. Nest takes advantage of the latest language features, so to use it with vanilla JavaScript we need a [Babel](https://babeljs.io/) compiler.

We'll mostly use TypeScript in the examples we provide, but you can always **switch the code snippets** to vanilla JavaScript syntax (simply click to toggle the language button in the upper right hand corner of each snippet).

#### Prerequisites

Please make sure that [Node.js](https://nodejs.org) (version >= 20) is installed on your operating system.

#### Setup

Setting up a new project is quite simple with the [Nest CLI](/cli/overview). With [npm](https://www.npmjs.com/) installed, you can create a new Nest project with the following commands in your OS terminal:

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **Hint** To create a new project with TypeScript's [stricter](https://www.typescriptlang.org/tsconfig#strict) feature set, pass the `--strict` flag to the `nest new` command.

The `project-name` directory will be created, node modules and a few other boilerplate files will be installed, and a `src/` directory will be created and populated with several core files.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.spec.ts</div>
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

Here's a brief overview of those core files:

|                          |                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `app.controller.ts`      | A basic controller with a single route.                                                                             |
| `app.controller.spec.ts` | The unit tests for the controller.                                                                                  |
| `app.module.ts`          | The root module of the application.                                                                                 |
| `app.service.ts`         | A basic service with a single method.                                                                               |
| `main.ts`                | The entry file of the application which uses the core function `NestFactory` to create a Nest application instance. |

The `main.ts` includes an async function, which will **bootstrap** our application:

```typescript
@@filename(main)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

To create a Nest application instance, we use the core `NestFactory` class. `NestFactory` exposes a few static methods that allow creating an application instance. The `create()` method returns an application object, which fulfills the `INestApplication` interface. This object provides a set of methods which are described in the coming chapters. In the `main.ts` example above, we simply start up our HTTP listener, which lets the application await inbound HTTP requests.

Note that a project scaffolded with the Nest CLI creates an initial project structure that encourages developers to follow the convention of keeping each module in its own dedicated directory.

> info **Hint** By default, if any error happens while creating the application your app will exit with the code `1`. If you want to make it throw an error instead disable the option `abortOnError` (e.g., `NestFactory.create(AppModule, {{ '{' }} abortOnError: false {{ '}' }})`).

<app-banner-courses></app-banner-courses>

#### Platform

Nest aims to be a platform-agnostic framework. Platform independence makes it possible to create reusable logical parts that developers can take advantage of across several different types of applications. Technically, Nest is able to work with any Node HTTP framework once an adapter is created. There are two HTTP platforms supported out-of-the-box: [express](https://expressjs.com/) and [fastify](https://www.fastify.io). You can choose the one that best suits your needs.

|                    |                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-express` | [Express](https://expressjs.com/) is a well-known minimalist web framework for node. It's a battle tested, production-ready library with lots of resources implemented by the community. The `@nestjs/platform-express` package is used by default. Many users are well served with Express, and need take no action to enable it. |
| `platform-fastify` | [Fastify](https://www.fastify.io/) is a high performance and low overhead framework highly focused on providing maximum efficiency and speed. Read how to use it [here](/techniques/performance).                                                                                                                                  |

Whichever platform is used, it exposes its own application interface. These are seen respectively as `NestExpressApplication` and `NestFastifyApplication`.

When you pass a type to the `NestFactory.create()` method, as in the example below, the `app` object will have methods available exclusively for that specific platform. Note, however, you don't **need** to specify a type **unless** you actually want to access the underlying platform API.

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

#### Running the application

Once the installation process is complete, you can run the following command at your OS command prompt to start the application listening for inbound HTTP requests:

```bash
$ npm run start
```

> info **Hint** To speed up the development process (x20 times faster builds), you can use the [SWC builder](/recipes/swc) by passing the `-b swc` flag to the `start` script, as follows `npm run start -- -b swc`.

This command starts the app with the HTTP server listening on the port defined in the `src/main.ts` file. Once the application is running, open your browser and navigate to `http://localhost:3000/`. You should see the `Hello World!` message.

To watch for changes in your files, you can run the following command to start the application:

```bash
$ npm run start:dev
```

This command will watch your files, automatically recompiling and reloading the server.

#### Linting and formatting

[CLI](/cli/overview) provides best effort to scaffold a reliable development workflow at scale. Thus, a generated Nest project comes with both a code **linter** and **formatter** preinstalled (respectively [eslint](https://eslint.org/) and [prettier](https://prettier.io/)).

> info **Hint** Not sure about the role of formatters vs linters? Learn the difference [here](https://prettier.io/docs/en/comparison.html).

To ensure maximum stability and extensibility, we use the base [`eslint`](https://www.npmjs.com/package/eslint) and [`prettier`](https://www.npmjs.com/package/prettier) cli packages. This setup allows neat IDE integration with official extensions by design.

For headless environments where an IDE is not relevant (Continuous Integration, Git hooks, etc.) a Nest project comes with ready-to-use `npm` scripts.

```bash
# Lint and autofix with eslint
$ npm run lint

# Format with prettier
$ npm run format
```


---

## Introduction

### Introduction

Nest (NestJS) is a framework for building efficient, scalable [Node.js](https://nodejs.org/) server-side applications. It uses progressive JavaScript, is built with and fully supports [TypeScript](http://www.typescriptlang.org/) (yet still enables developers to code in pure JavaScript) and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

Under the hood, Nest makes use of robust HTTP Server frameworks like [Express](https://expressjs.com/) (the default) and optionally can be configured to use [Fastify](https://github.com/fastify/fastify) as well!

Nest provides a level of abstraction above these common Node.js frameworks (Express/Fastify), but also exposes their APIs directly to the developer. This gives developers the freedom to use the myriad of third-party modules which are available for the underlying platform.

#### Philosophy

In recent years, thanks to Node.js, JavaScript has become the “lingua franca” of the web for both front and backend applications. This has given rise to awesome projects like [Angular](https://angular.dev/), [React](https://github.com/facebook/react) and [Vue](https://github.com/vuejs/vue), which improve developer productivity and enable the creation of fast, testable, and extensible frontend applications. However, while plenty of superb libraries, helpers, and tools exist for Node (and server-side JavaScript), none of them effectively solve the main problem of **architecture**.

Nest provides an out-of-the-box application architecture which allows developers and teams to create highly testable, scalable, loosely coupled, and easily maintainable applications. The architecture is heavily inspired by Angular.

#### Installation

To get started, you can either scaffold the project with the [Nest CLI](/cli/overview), or [clone a starter project](#alternatives) (both will produce the same outcome).

To scaffold the project with the Nest CLI, run the following commands. This will create a new project directory, and populate the directory with the initial core Nest files and supporting modules, creating a conventional base structure for your project. Creating a new project with the **Nest CLI** is recommended for first-time users. We'll continue with this approach in [First Steps](first-steps).

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **Hint** To create a new TypeScript project with stricter feature set, pass the `--strict` flag to the `nest new` command.

#### Alternatives

Alternatively, to install the TypeScript starter project with **Git**:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **Hint** If you'd like to clone the repository without the git history, you can use [degit](https://github.com/Rich-Harris/degit).

Open your browser and navigate to [`http://localhost:3000/`](http://localhost:3000/).

To install the JavaScript flavor of the starter project, use `javascript-starter.git` in the command sequence above.

You can also start a new project from scratch by installing the core and supporting packages. Keep in mind that you'll need to set up the project boilerplate files on your own. At a minimum, you'll need these dependencies: `@nestjs/core`, `@nestjs/common`, `rxjs`, and `reflect-metadata`. Check out this short article on how to create a complete project: [5 steps to create a bare minimum NestJS app from scratch!](https://dev.to/micalevisk/5-steps-to-create-a-bare-minimum-nestjs-app-from-scratch-5c3b).


---

## Introduction

### Introduction

The [OpenAPI](https://swagger.io/specification/) specification is a language-agnostic definition format used to describe RESTful APIs. Nest provides a dedicated [module](https://github.com/nestjs/swagger) which allows generating such a specification by leveraging decorators.

#### Installation

To begin using it, we first install the required dependency.

```bash
$ npm install --save @nestjs/swagger
```

#### Bootstrap

Once the installation process is complete, open the `main.ts` file and initialize Swagger using the `SwaggerModule` class:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> info **Hint** The factory method `SwaggerModule.createDocument()` is used specifically to generate the Swagger document when you request it. This approach helps save some initialization time, and the resulting document is a serializable object that conforms to the [OpenAPI Document](https://swagger.io/specification/#openapi-document) specification. Instead of serving the document over HTTP, you can also save it as a JSON or YAML file and use it in various ways.

The `DocumentBuilder` helps to structure a base document that conforms to the OpenAPI Specification. It provides several methods that allow setting such properties as title, description, version, etc. In order to create a full document (with all HTTP routes defined) we use the `createDocument()` method of the `SwaggerModule` class. This method takes two arguments, an application instance and a Swagger options object. Alternatively, we can provide a third argument, which should be of type `SwaggerDocumentOptions`. More on this in the [Document options section](/openapi/introduction#document-options).

Once we create a document, we can call the `setup()` method. It accepts:

1. The path to mount the Swagger UI
2. An application instance
3. The document object instantiated above
4. Optional configuration parameter (read more [here](/openapi/introduction#setup-options))

Now you can run the following command to start the HTTP server:

```bash
$ npm run start
```

While the application is running, open your browser and navigate to `http://localhost:3000/api`. You should see the Swagger UI.

<figure><img src="/assets/swagger1.png" /></figure>

As you can see, the `SwaggerModule` automatically reflects all of your endpoints.

> info **Hint** To generate and download a Swagger JSON file, navigate to `http://localhost:3000/api-json` (assuming that your Swagger documentation is available under `http://localhost:3000/api`).
> It is also possible to expose it on a route of your choice using only the setup method from `@nestjs/swagger`, like this:
>
> ```typescript
> SwaggerModule.setup('swagger', app, documentFactory, {
>   jsonDocumentUrl: 'swagger/json',
> });
> ```
>
> Which would expose it at `http://localhost:3000/swagger/json`

> warning **Warning** When using `fastify` and `helmet`, there may be a problem with [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), to solve this collision, configure the CSP as shown below:
>
> ```typescript
> app.register(helmet, {
>   contentSecurityPolicy: {
>     directives: {
>       defaultSrc: [`'self'`],
>       styleSrc: [`'self'`, `'unsafe-inline'`],
>       imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>     },
>   },
> });
>
> // If you are not going to use CSP at all, you can use this:
> app.register(helmet, {
>   contentSecurityPolicy: false,
> });
> ```

#### Document options

When creating a document, it is possible to provide some extra options to fine tune the library's behavior. These options should be of type `SwaggerDocumentOptions`, which can be the following:

```TypeScript
export interface SwaggerDocumentOptions {
  /**
   * List of modules to include in the specification
   */
  include?: Function[];

  /**
   * Additional, extra models that should be inspected and included in the specification
   */
  extraModels?: Function[];

  /**
   * If `true`, swagger will ignore the global prefix set through `setGlobalPrefix()` method
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * If `true`, swagger will also load routes from the modules imported by `include` modules
   */
  deepScanRoutes?: boolean;

  /**
   * Custom operationIdFactory that will be used to generate the `operationId`
   * based on the `controllerKey`, `methodKey`, and version.
   * @default () => controllerKey_methodKey_version
   */
  operationIdFactory?: OperationIdFactory;

  /**
   * Custom linkNameFactory that will be used to generate the name of links
   * in the `links` field of responses
   *
   * @see [Link objects](https://swagger.io/docs/specification/links/)
   *
   * @default () => `${controllerKey}_${methodKey}_from_${fieldKey}`
   */
  linkNameFactory?: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;

  /*
   * Generate tags automatically based on the controller name.
   * If `false`, you must use the `@ApiTags()` decorator to define tags.
   * Otherwise, the controller name without the suffix `Controller` will be used.
   * @default true
   */
  autoTagControllers?: boolean;
}
```

For example, if you want to make sure that the library generates operation names like `createUser` instead of `UsersController_createUser`, you can set the following:

```TypeScript
const options: SwaggerDocumentOptions =  {
  operationIdFactory: (
    controllerKey: string,
    methodKey: string
  ) => methodKey
};
const documentFactory = () => SwaggerModule.createDocument(app, config, options);
```

#### Setup options

You can configure Swagger UI by passing the options object which fulfills the `SwaggerCustomOptions` interface as a fourth argument of the `SwaggerModule#setup` method.

```TypeScript
export interface SwaggerCustomOptions {
  /**
   * If `true`, Swagger resources paths will be prefixed by the global prefix set through `setGlobalPrefix()`.
   * Default: `false`.
   * @see https://docs.nestjs.com/faq/global-prefix
   */
  useGlobalPrefix?: boolean;

  /**
   * If `false`, the Swagger UI will not be served. Only API definitions (JSON and YAML)
   * will be accessible (on `/{path}-json` and `/{path}-yaml`). To fully disable both the Swagger UI and API definitions, use `raw: false`.
   * Default: `true`.
   * @deprecated Use `ui` instead.
   */
  swaggerUiEnabled?: boolean;

  /**
   * If `false`, the Swagger UI will not be served. Only API definitions (JSON and YAML)
   * will be accessible (on `/{path}-json` and `/{path}-yaml`). To fully disable both the Swagger UI and API definitions, use `raw: false`.
   * Default: `true`.
   */
  ui?: boolean;

  /**
   * If `true`, raw definitions for all formats will be served.
   * Alternatively, you can pass an array to specify the formats to be served, e.g., `raw: ['json']` to serve only JSON definitions.
   * If omitted or set to an empty array, no definitions (JSON or YAML) will be served.
   * Use this option to control the availability of Swagger-related endpoints.
   * Default: `true`.
   */
  raw?: boolean | Array<'json' | 'yaml'>;

  /**
   * Url point the API definition to load in Swagger UI.
   */
  swaggerUrl?: string;

  /**
   * Path of the JSON API definition to serve.
   * Default: `<path>-json`.
   */
  jsonDocumentUrl?: string;

  /**
   * Path of the YAML API definition to serve.
   * Default: `<path>-yaml`.
   */
  yamlDocumentUrl?: string;

  /**
   * Hook allowing to alter the OpenAPI document before being served.
   * It's called after the document is generated and before it is served as JSON & YAML.
   */
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;

  /**
   * If `true`, the selector of OpenAPI definitions is displayed in the Swagger UI interface.
   * Default: `false`.
   */
  explorer?: boolean;

  /**
   * Additional Swagger UI options
   */
  swaggerOptions?: SwaggerUiOptions;

  /**
   * Custom CSS styles to inject in Swagger UI page.
   */
  customCss?: string;

  /**
   * URL(s) of a custom CSS stylesheet to load in Swagger UI page.
   */
  customCssUrl?: string | string[];

  /**
   * URL(s) of custom JavaScript files to load in Swagger UI page.
   */
  customJs?: string | string[];

  /**
   * Custom JavaScript scripts to load in Swagger UI page.
   */
  customJsStr?: string | string[];

  /**
   * Custom favicon for Swagger UI page.
   */
  customfavIcon?: string;

  /**
   * Custom title for Swagger UI page.
   */
  customSiteTitle?: string;

  /**
   * File system path (ex: ./node_modules/swagger-ui-dist) containing static Swagger UI assets.
   */
  customSwaggerUiPath?: string;

  /**
   * @deprecated This property has no effect.
   */
  validatorUrl?: string;

  /**
   * @deprecated This property has no effect.
   */
  url?: string;

  /**
   * @deprecated This property has no effect.
   */
  urls?: Record<'url' | 'name', string>[];
}
```

> info **Hint** `ui` and `raw` are independent options. Disabling Swagger UI (`ui: false`) does not disable API definitions (JSON/YAML). Conversely, disabling API definitions (`raw: []`) does not disable the Swagger UI.
>
> For example, the following configuration will disable the Swagger UI but still allow access to API definitions:
>
> ```typescript
> const options: SwaggerCustomOptions = {
>   ui: false, // Swagger UI is disabled
>   raw: ['json'], // JSON API definition is still accessible (YAML is disabled)
> };
> SwaggerModule.setup('api', app, options);
> ```
>
> In this case, http://localhost:3000/api-json will still be accessible, but http://localhost:3000/api (Swagger UI) will not.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/11-swagger).


---

## Overview

### Overview

The [Nest CLI](https://github.com/nestjs/nest-cli) is a command-line interface tool that helps you to initialize, develop, and maintain your Nest applications. It assists in multiple ways, including scaffolding the project, serving it in development mode, and building and bundling the application for production distribution. It embodies best-practice architectural patterns to encourage well-structured apps.

#### Installation

**Note**: In this guide we describe using [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install packages, including the Nest CLI. Other package managers may be used at your discretion. With npm, you have several options available for managing how your OS command line resolves the location of the `nest` CLI binary file. Here, we describe installing the `nest` binary globally using the `-g` option. This provides a measure of convenience, and is the approach we assume throughout the documentation. Note that installing **any** `npm` package globally leaves the responsibility of ensuring they're running the correct version up to the user. It also means that if you have different projects, each will run the **same** version of the CLI. A reasonable alternative is to use the [npx](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npx.md) program, built into the `npm` cli (or similar features with other package managers) to ensure that you run a **managed version** of the Nest CLI. We recommend you consult the [npx documentation](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npx.md) and/or your DevOps support staff for more information.

Install the CLI globally using the `npm install -g` command (see the **Note** above for details about global installs).

```bash
$ npm install -g @nestjs/cli
```

> info **Hint** Alternatively, you can use this command `npx @nestjs/cli@latest` without installing the cli globally.

#### Basic workflow

Once installed, you can invoke CLI commands directly from your OS command line through the `nest` executable. See the available `nest` commands by entering the following:

```bash
$ nest --help
```

Get help on an individual command using the following construct. Substitute any command, like `new`, `add`, etc., where you see `generate` in the example below to get detailed help on that command:

```bash
$ nest generate --help
```

To create, build and run a new basic Nest project in development mode, go to the folder that should be the parent of your new project, and run the following commands:

```bash
$ nest new my-nest-project
$ cd my-nest-project
$ npm run start:dev
```

In your browser, open [http://localhost:3000](http://localhost:3000) to see the new application running. The app will automatically recompile and reload when you change any of the source files.

> info **Hint** We recommend using the [SWC builder](/recipes/swc) for faster builds (10x more performant than the default TypeScript compiler).

#### Project structure

When you run `nest new`, Nest generates a boilerplate application structure by creating a new folder and populating an initial set of files. You can continue working in this default structure, adding new components, as described throughout this documentation. We refer to the project structure generated by `nest new` as **standard mode**. Nest also supports an alternate structure for managing multiple projects and libraries called **monorepo mode**.

Aside from a few specific considerations around how the **build** process works (essentially, monorepo mode simplifies build complexities that can sometimes arise from monorepo-style project structures), and built-in [library](/cli/libraries) support, the rest of the Nest features, and this documentation, apply equally to both standard and monorepo mode project structures. In fact, you can easily switch from standard mode to monorepo mode at any time in the future, so you can safely defer this decision while you're still learning about Nest.

You can use either mode to manage multiple projects. Here's a quick summary of the differences:

| Feature                                                    | Standard Mode                                                      | Monorepo Mode                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Multiple projects                                          | Separate file system structure                                     | Single file system structure                               |
| `node_modules` & `package.json`                            | Separate instances                                                 | Shared across monorepo                                     |
| Default compiler                                           | `tsc`                                                              | webpack                                                    |
| Compiler settings                                          | Specified separately                                               | Monorepo defaults that can be overridden per project       |
| Config files like `eslint.config.mjs`, `.prettierrc`, etc. | Specified separately                                               | Shared across monorepo                                     |
| `nest build` and `nest start` commands                     | Target defaults automatically to the (only) project in the context | Target defaults to the **default project** in the monorepo |
| Libraries                                                  | Managed manually, usually via npm packaging                        | Built-in support, including path management and bundling   |

Read the sections on [Workspaces](/cli/monorepo) and [Libraries](/cli/libraries) for more detailed information to help you decide which mode is most suitable for you.

<app-banner-courses></app-banner-courses>

#### CLI command syntax

All `nest` commands follow the same format:

```bash
nest commandOrAlias requiredArg [optionalArg] [options]
```

For example:

```bash
$ nest new my-nest-project --dry-run
```

Here, `new` is the _commandOrAlias_. The `new` command has an alias of `n`. `my-nest-project` is the _requiredArg_. If a _requiredArg_ is not supplied on the command line, `nest` will prompt for it. Also, `--dry-run` has an equivalent short-hand form `-d`. With this in mind, the following command is the equivalent of the above:

```bash
$ nest n my-nest-project -d
```

Most commands, and some options, have aliases. Try running `nest new --help` to see these options and aliases, and to confirm your understanding of the above constructs.

#### Command overview

Run `nest <command> --help` for any of the following commands to see command-specific options.

See [usage](/cli/usages) for detailed descriptions for each command.

| Command    | Alias | Description                                                                                    |
| ---------- | ----- | ---------------------------------------------------------------------------------------------- |
| `new`      | `n`   | Scaffolds a new _standard mode_ application with all boilerplate files needed to run.          |
| `generate` | `g`   | Generates and/or modifies files based on a schematic.                                          |
| `build`    |       | Compiles an application or workspace into an output folder.                                    |
| `start`    |       | Compiles and runs an application (or default project in a workspace).                          |
| `add`      |       | Imports a library that has been packaged as a **nest library**, running its install schematic. |
| `info`     | `i`   | Displays information about installed nest packages and other helpful system info.              |

#### Requirements

Nest CLI requires a Node.js binary built with [internationalization support](https://nodejs.org/api/intl.html) (ICU), such as the official binaries from the [Node.js project page](https://nodejs.org/en/download). If you encounter errors related to ICU, check that your binary meets this requirement.

```bash
node -p process.versions.icu
```

If the command prints `undefined`, your Node.js binary has no internationalization support.


---

## Overview

### Overview

> info **Hint** This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the [Devtools](https://devtools.nestjs.com) website.

To start debugging your local application, open up the `main.ts` file and make sure to set the `snapshot` attribute to `true` in the application options object, as follows:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
```

This will instruct the framework to collect necessary metadata that will let Nest Devtools visualize your application's graph.

Next up, let's install the required dependency:

```bash
$ npm i @nestjs/devtools-integration
```

> warning **Warning** If you're using `@nestjs/graphql` package in your application, make sure to install the latest version (`npm i @nestjs/graphql@11`).

With this dependency in place, let's open up the `app.module.ts` file and import the `DevtoolsModule` that we just installed:

```typescript
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

> warning **Warning** The reason we are checking the `NODE_ENV` environment variable here is that you should never use this module in production!

Once the `DevtoolsModule` is imported and your application is up and running (`npm run start:dev`), you should be able to navigate to [Devtools](https://devtools.nestjs.com) URL and see the instrospected graph.

<figure><img src="/assets/devtools/modules-graph.png" /></figure>

> info **Hint** As you can see on the screenshot above, every module connects to the `InternalCoreModule`. `InternalCoreModule` is a global module that is always imported into the root module. Since it's registered as a global node, Nest automatically creates edges between all of the modules and the `InternalCoreModule` node. Now, if you want to hide global modules from the graph, you can use the "**Hide global modules**" checkbox (in the sidebar).

So as we can see, `DevtoolsModule` makes your application expose an additional HTTP server (on port 8000) that the Devtools application will use to introspect your app.

Just to double-check that everything works as expected, change the graph view to "Classes". You should see the following screen:

<figure><img src="/assets/devtools/classes-graph.png" /></figure>

To focus on a specific node, click on the rectangle and the graph will show a popup window with the **"Focus"** button. You can also use the search bar (located in the sidebar) to find a specific node.

> info **Hint** If you click on the **Inspect** button, application will take you to the `/debug` page with that specific node selected.

<figure><img src="/assets/devtools/node-popup.png" /></figure>

> info **Hint** To export a graph as an image, click on the **Export as PNG** button in the right corner of the graph.

Using the form controls located in the sidebar (on the left), you can control edges proximity to, for example, visualize a specific application sub-tree:

<figure><img src="/assets/devtools/subtree-view.png" /></figure>

This can be particularly useful when you have **new developers** on your team and you want to show them how your application is structured. You can also use this feature to visualize a specific module (e.g. `TasksModule`) and all of its dependencies, which can come in handy when you're breaking down a large application into smaller modules (for example, individual micro-services).

You can watch this video to see the **Graph Explorer** feature in action:

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/bW8V-ssfnvM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Investigating the "Cannot resolve dependency" error

> info **Note** This feature is supported for `@nestjs/core` >= `v9.3.10`.

Probably the most common error message you might have seen is about Nest not being able to resolve dependencies of a provider. Using Nest Devtools, you can effortlessly identify the issue and learn how to resolve it.

First, open up the `main.ts` file and update the `bootstrap()` call, as follows:

```typescript
bootstrap().catch((err) => {
  fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? '');
  process.exit(1);
});
```

Also, make sure to set the `abortOnError` to `false`:

```typescript
const app = await NestFactory.create(AppModule, {
  snapshot: true,
  abortOnError: false, // <--- THIS
});
```

Now every time your application fails to bootstrap due to the **"Cannot resolve dependency"** error, you'll find the `graph.json` (that represents a partial graph) file in the root directory. You can then drag & drop this file into Devtools (make sure to switch the current mode from "Interactive" to "Preview"):

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

Upon successful upload, you should see the following graph & dialog window:

<figure><img src="/assets/devtools/partial-graph-modules-view.png" /></figure>

As you can see, the highlighted `TasksModule` is the one we should look into. Also, in the dialog window you can already see some instructions on how to fix this issue.

If we switch to the "Classes" view instead, that's what we'll see:

<figure><img src="/assets/devtools/partial-graph-classes-view.png" /></figure>

This graph illustrates that the `DiagnosticsService` which we want to inject into the `TasksService` was not found in the context of the `TasksModule` module, and we should likely just import the `DiagnosticsModule` into the `TasksModule` module to fix this up!

#### Routes explorer

When you navigate to the **Routes explorer** page, you should see all of the registered entrypoints:

<figure><img src="/assets/devtools/routes.png" /></figure>

> info **Hint** This page shows not only HTTP routes, but also all of the other entrypoints (e.g. WebSockets, gRPC, GraphQL resolvers etc.).

Entrypoints are grouped by their host controllers. You can also use the search bar to find a specific entrypoint.

If you click on a specific entrypoint, **a flow graph** will be displayed. This graph shows the execution flow of the entrypoint (e.g. guards, interceptors, pipes, etc. bound to this route). This is particularly useful when you want to understand how the request/response cycle looks for a specific route, or when troubleshooting why a specific guard/interceptor/pipe is not being executed.

#### Sandbox

To execute JavaScript code on the fly & interact with your application in real-time, navigate to the **Sandbox** page:

<figure><img src="/assets/devtools/sandbox.png" /></figure>

The playground can be used to test and debug API endpoints in **real-time**, allowing developers to quickly identify and fix issues without using, for example, an HTTP client. We can also bypass the authentication layer, and so we no longer need that extra step of logging in, or even a special user account for testing purposes. For event-driven applications, we can also trigger events directly from the playground, and see how the application reacts to them.

Anything that gets logged down is streamlined to the playground's console, so we can easily see what's going on.

Just execute the code **on the fly** and see the results instantly, without having to rebuild the application and restart the server.

<figure><img src="/assets/devtools/sandbox-table.png" /></figure>

> info **Hint** To pretty display an array of objects, use the `console.table()` (or just `table()`) function.

You can watch this video to see the **Interactive Playground** feature in action:

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/liSxEN_VXKM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Bootstrap performance analyzer

To see a list of all class nodes (controllers, providers, enhancers, etc.) and their corresponding instantiation times, navigate to the **Bootstrap performance** page:

<figure><img src="/assets/devtools/bootstrap-performance.png" /></figure>

This page is particularly useful when you want to identify the slowest parts of your application's bootstrap process (e.g. when you want to optimize the application's startup time which is crucial for, for example, serverless environments).

#### Audit

To see the auto-generated audit - errors/warnings/hints that the application came up with while analyzing your serialized graph, navigate to the **Audit** page:

<figure><img src="/assets/devtools/audit.png" /></figure>

> info **Hint** The screenshot above doesn't show all of the available audit rules.

This page comes in handy when you want to identify potential issues in your application.

#### Preview static files

To save a serialized graph to a file, use the following code:

```typescript
await app.listen(process.env.PORT ?? 3000); // OR await app.init()
fs.writeFileSync('./graph.json', app.get(SerializedGraph).toString());
```

> info **Hint** `SerializedGraph` is exported from the `@nestjs/core` package.

Then you can drag and drop/upload this file:

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

This is helpful when you want to share your graph with someone else (e.g., co-worker), or when you want to analyze it offline.


---

