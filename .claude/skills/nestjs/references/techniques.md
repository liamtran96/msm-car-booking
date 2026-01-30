# Techniques

## Caching

### Caching

Caching is a powerful and straightforward **technique** for enhancing your application's performance. By acting as a temporary storage layer, it allows for quicker access to frequently used data, reducing the need to repeatedly fetch or compute the same information. This results in faster response times and improved overall efficiency.

#### Installation

To get started with caching in Nest, you need to install the `@nestjs/cache-manager` package along with the `cache-manager` package.

```bash
$ npm install @nestjs/cache-manager cache-manager
```

By default, everything is stored in memory; Since `cache-manager` uses [Keyv](https://keyv.org/docs/) under the hood, you can easily switch to a more advanced storage solution, such as Redis, by installing the appropriate package. We'll cover this in more detail later.

#### In-memory cache

To enable caching in your application, import the `CacheModule` and configure it using the `register()` method:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

This setup initializes in-memory caching with default settings, allowing you to start caching data immediately.

#### Interacting with the Cache store

To interact with the cache manager instance, inject it to your class using the `CACHE_MANAGER` token, as follows:

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> info **Hint** The `Cache` class and the `CACHE_MANAGER` token are both imported from the `@nestjs/cache-manager` package.

The `get` method on the `Cache` instance (from the `cache-manager` package) is used to retrieve items from the cache. If the item does not exist in the cache, `null` will be returned.

```typescript
const value = await this.cacheManager.get('key');
```

To add an item to the cache, use the `set` method:

```typescript
await this.cacheManager.set('key', 'value');
```

> warning **Note** The in-memory cache storage can only store values of types that are supported by [the structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types).

You can manually specify a TTL (expiration time in milliseconds) for this specific key, as follows:

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

Where `1000` is the TTL in milliseconds - in this case, the cache item will expire after one second.

To disable expiration of the cache, set the `ttl` configuration property to `0`:

```typescript
await this.cacheManager.set('key', 'value', 0);
```

To remove an item from the cache, use the `del` method:

```typescript
await this.cacheManager.del('key');
```

To clear the entire cache, use the `clear` method:

```typescript
await this.cacheManager.clear();
```

#### Auto-caching responses

> warning **Warning** In [GraphQL](/graphql/quick-start) applications, interceptors are executed separately for each field resolver. Thus, `CacheModule` (which uses interceptors to cache responses) will not work properly.

To enable auto-caching responses, just tie the `CacheInterceptor` where you want to cache data.

```typescript
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> warning**Warning** Only `GET` endpoints are cached. Also, HTTP server routes that inject the native response object (`@Res()`) cannot use the Cache Interceptor. See
> <a href="https://docs.nestjs.com/interceptors#response-mapping">response mapping</a> for more details.

To reduce the amount of required boilerplate, you can bind `CacheInterceptor` to all endpoints globally:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Time-to-live (TTL)

The default value for `ttl` is `0`, meaning the cache will never expire. To specify a custom [TTL](https://en.wikipedia.org/wiki/Time_to_live), you can provide the `ttl` option in the `register()` method, as demonstrated below:

```typescript
CacheModule.register({
  ttl: 5000, // milliseconds
});
```

#### Use module globally

When you want to use `CacheModule` in other modules, you'll need to import it (as is standard with any Nest module). Alternatively, declare it as a [global module](https://docs.nestjs.com/modules#global-modules) by setting the options object's `isGlobal` property to `true`, as shown below. In that case, you will not need to import `CacheModule` in other modules once it's been loaded in the root module (e.g., `AppModule`).

```typescript
CacheModule.register({
  isGlobal: true,
});
```

#### Global cache overrides

While global cache is enabled, cache entries are stored under a `CacheKey` that is auto-generated based on the route path. You may override certain cache settings (`@CacheKey()` and `@CacheTTL()`) on a per-method basis, allowing customized caching strategies for individual controller methods. This may be most relevant while using [different cache stores.](https://docs.nestjs.com/techniques/caching#different-stores)

You can apply the `@CacheTTL()` decorator on a per-controller basis to set a caching TTL for the entire controller. In situations where both controller-level and method-level cache TTL settings are defined, the cache TTL settings specified at the method level will take priority over the ones set at the controller level.

```typescript
@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
```

> info **Hint** The `@CacheKey()` and `@CacheTTL()` decorators are imported from the `@nestjs/cache-manager` package.

The `@CacheKey()` decorator may be used with or without a corresponding `@CacheTTL()` decorator and vice versa. One may choose to override only the `@CacheKey()` or only the `@CacheTTL()`. Settings that are not overridden with a decorator will use the default values as registered globally (see [Customize caching](https://docs.nestjs.com/techniques/caching#customize-caching)).

#### WebSockets and Microservices

You can also apply the `CacheInterceptor` to WebSocket subscribers as well as Microservice's patterns (regardless of the transport method that is being used).

```typescript
@@filename()
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

However, the additional `@CacheKey()` decorator is required in order to specify a key used to subsequently store and retrieve cached data. Also, please note that you **shouldn't cache everything**. Actions which perform some business operations rather than simply querying the data should never be cached.

Additionally, you may specify a cache expiration time (TTL) by using the `@CacheTTL()` decorator, which will override the global default TTL value.

```typescript
@@filename()
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

> info **Hint** The `@CacheTTL()` decorator may be used with or without a corresponding `@CacheKey()` decorator.

#### Adjust tracking

By default, Nest uses the request URL (in an HTTP app) or cache key (in websockets and microservices apps, set through the `@CacheKey()` decorator) to associate cache records with your endpoints. Nevertheless, sometimes you might want to set up tracking based on different factors, for example, using HTTP headers (e.g. `Authorization` to properly identify `profile` endpoints).

In order to accomplish that, create a subclass of `CacheInterceptor` and override the `trackBy()` method.

```typescript
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

#### Using alternative Cache stores

Switching to a different cache store is straightforward. First, install the appropriate package. For example, to use Redis, install the `@keyv/redis` package:

```bash
$ npm install @keyv/redis
```

With this in place, you can register the `CacheModule` with multiple stores as shown below:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

In this example, we've registered two stores: `CacheableMemory` and `KeyvRedis`. The `CacheableMemory` store is a simple in-memory store, while `KeyvRedis` is a Redis store. The `stores` array is used to specify the stores you want to use. The first store in the array is the default store, and the rest are fallback stores.

Check out the [Keyv documentation](https://keyv.org/docs/) for more information on available stores.

#### Async configuration

You may want to asynchronously pass in module options instead of passing them statically at compile time. In this case, use the `registerAsync()` method, which provides several ways to deal with async configuration.

One approach is to use a factory function:

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5,
  }),
});
```

Our factory behaves like all other asynchronous module factories (it can be `async` and is able to inject dependencies through `inject`).

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` method:

```typescript
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
```

The above construction will instantiate `CacheConfigService` inside `CacheModule` and will use it to get the options object. The `CacheConfigService` has to implement the `CacheOptionsFactory` interface in order to provide the configuration options:

```typescript
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}
```

If you wish to use an existing configuration provider imported from a different module, use the `useExisting` syntax:

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This works the same as `useClass` with one critical difference - `CacheModule` will lookup imported modules to reuse any already-created `ConfigService`, instead of instantiating its own.

> info **Hint** `CacheModule#register`, `CacheModule#registerAsync` and `CacheOptionsFactory` have an optional generic (type argument) to narrow down store-specific configuration options, making it type safe.

You can also pass so-called `extraProviders` to the `registerAsync()` method. These providers will be merged with the module providers.

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when you want to provide additional dependencies to the factory function or the class constructor.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/20-cache).


---

## Compression

### Compression

Compression can greatly decrease the size of the response body, thereby increasing the speed of a web app.

For **high-traffic** websites in production, it is strongly recommended to offload compression from the application server - typically in a reverse proxy (e.g., Nginx). In that case, you should not use compression middleware.

#### Use with Express (default)

Use the [compression](https://github.com/expressjs/compression) middleware package to enable gzip compression.

First install the required package:

```bash
$ npm i --save compression
$ npm i --save-dev @types/compression
```

Once the installation is complete, apply the compression middleware as global middleware.

```typescript
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
```

#### Use with Fastify

If using the `FastifyAdapter`, you'll want to use [fastify-compress](https://github.com/fastify/fastify-compress):

```bash
$ npm i --save @fastify/compress
```

Once the installation is complete, apply the `@fastify/compress` middleware as global middleware.

> warning **Warning** Please ensure, that you use the type `NestFastifyApplication` when creating the application. Otherwise, you cannot use `register` to apply the compression-middleware.

```typescript
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import compression from '@fastify/compress';

// inside bootstrap()
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(compression);
```

By default, `@fastify/compress` will use Brotli compression (on Node >= 11.7.0) when browsers indicate support for the encoding. While Brotli can be quite efficient in terms of compression ratio, it can also be quite slow. By default, Brotli sets a maximum compression quality of 11, although it can be adjusted to reduce compression time in lieu of compression quality by adjusting the `BROTLI_PARAM_QUALITY` between 0 min and 11 max. This will require fine tuning to optimize space/time performance. An example with quality 4: 

```typescript
import { constants } from 'node:zlib';
// somewhere in your initialization file
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
```

To simplify, you may want to tell `fastify-compress` to only use deflate and gzip to compress responses; you'll end up with potentially larger responses but they'll be delivered much more quickly.

To specify encodings, provide a second argument to `app.register`:

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

The above tells `fastify-compress` to only use gzip and deflate encodings, preferring gzip if the client supports both.


---

## Configuration

### Configuration

Applications often run in different **environments**. Depending on the environment, different configuration settings should be used. For example, usually the local environment relies on specific database credentials, valid only for the local DB instance. The production environment would use a separate set of DB credentials. Since configuration variables change, best practice is to [store configuration variables](https://12factor.net/config) in the environment.

Externally defined environment variables are visible inside Node.js through the `process.env` global. We could try to solve the problem of multiple environments by setting the environment variables separately in each environment. This can quickly get unwieldy, especially in the development and testing environments where these values need to be easily mocked and/or changed.

In Node.js applications, it's common to use `.env` files, holding key-value pairs where each key represents a particular value, to represent each environment. Running an app in different environments is then just a matter of swapping in the correct `.env` file.

A good approach for using this technique in Nest is to create a `ConfigModule` that exposes a `ConfigService` which loads the appropriate `.env` file. While you may choose to write such a module yourself, for convenience Nest provides the `@nestjs/config` package out-of-the box. We'll cover this package in the current chapter.

#### Installation

To begin using it, we first install the required dependency.

```bash
$ npm i --save @nestjs/config
```

> info **Hint** The `@nestjs/config` package internally uses [dotenv](https://github.com/motdotla/dotenv).

> warning **Note** `@nestjs/config` requires TypeScript 4.1 or later.

#### Getting started

Once the installation process is complete, we can import the `ConfigModule`. Typically, we'll import it into the root `AppModule` and control its behavior using the `.forRoot()` static method. During this step, environment variable key/value pairs are parsed and resolved. Later, we'll see several options for accessing the `ConfigService` class of the `ConfigModule` in our other feature modules.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

The above code will load and parse a `.env` file from the default location (the project root directory), merge key/value pairs from the `.env` file with environment variables assigned to `process.env`, and store the result in a private structure that you can access through the `ConfigService`. The `forRoot()` method registers the `ConfigService` provider, which provides a `get()` method for reading these parsed/merged configuration variables. Since `@nestjs/config` relies on [dotenv](https://github.com/motdotla/dotenv), it uses that package's rules for resolving conflicts in environment variable names. When a key exists both in the runtime environment as an environment variable (e.g., via OS shell exports like `export DATABASE_USER=test`) and in a `.env` file, the runtime environment variable takes precedence.

A sample `.env` file looks something like this:

```json
DATABASE_USER=test
DATABASE_PASSWORD=test
```

If you need some env variables to be available even before the `ConfigModule` is loaded and Nest application is bootstrapped (for example, to pass the microservice configuration to the `NestFactory#createMicroservice` method), you can use the `--env-file` option of the Nest CLI. This option allows you to specify the path to the `.env` file that should be loaded before the application starts. `--env-file` flag support was introduced in Node v20, see [the documentation](https://nodejs.org/dist/v20.18.1/docs/api/cli.html#--env-fileconfig) for more details.

```bash
$ nest start --env-file .env
```

#### Custom env file path

By default, the package looks for a `.env` file in the root directory of the application. To specify another path for the `.env` file, set the `envFilePath` property of an (optional) options object you pass to `forRoot()`, as follows:

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

You can also specify multiple paths for `.env` files like this:

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

If a variable is found in multiple files, the first one takes precedence.

#### Disable env variables loading

If you don't want to load the `.env` file, but instead would like to simply access environment variables from the runtime environment (as with OS shell exports like `export DATABASE_USER=test`), set the options object's `ignoreEnvFile` property to `true`, as follows:

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### Use module globally

When you want to use `ConfigModule` in other modules, you'll need to import it (as is standard with any Nest module). Alternatively, declare it as a [global module](https://docs.nestjs.com/modules#global-modules) by setting the options object's `isGlobal` property to `true`, as shown below. In that case, you will not need to import `ConfigModule` in other modules once it's been loaded in the root module (e.g., `AppModule`).

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

#### Custom configuration files

For more complex projects, you may utilize custom configuration files to return nested configuration objects. This allows you to group related configuration settings by function (e.g., database-related settings), and to store related settings in individual files to help manage them independently.

A custom configuration file exports a factory function that returns a configuration object. The configuration object can be any arbitrarily nested plain JavaScript object. The `process.env` object will contain the fully resolved environment variable key/value pairs (with `.env` file and externally defined variables resolved and merged as described <a href="techniques/configuration#getting-started">above</a>). Since you control the returned configuration object, you can add any required logic to cast values to an appropriate type, set default values, etc. For example:

```typescript
@@filename(config/configuration)
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
```

We load this file using the `load` property of the options object we pass to the `ConfigModule.forRoot()` method:

```typescript
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **Notice** The value assigned to the `load` property is an array, allowing you to load multiple configuration files (e.g. `load: [databaseConfig, authConfig]`)

With custom configuration files, we can also manage custom files such as YAML files. Here is an example of a configuration using YAML format:

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

To read and parse YAML files, we can leverage the `js-yaml` package.

```bash
$ npm i js-yaml
$ npm i -D @types/js-yaml
```

Once the package is installed, we use the `yaml#load` function to load the YAML file we just created above.

```typescript
@@filename(config/configuration)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> warning **Note** Nest CLI does not automatically move your "assets" (non-TS files) to the `dist` folder during the build process. To make sure that your YAML files are copied, you have to specify this in the `compilerOptions#assets` object in the `nest-cli.json` file. As an example, if the `config` folder is at the same level as the `src` folder, add `compilerOptions#assets` with the value `"assets": [{{ '{' }}"include": "../config/*.yaml", "outDir": "./dist/config"{{ '}' }}]`. Read more [here](/cli/monorepo#assets).

Just a quick note - configuration files aren't automatically validated, even if you're using the `validationSchema` option in NestJS's `ConfigModule`. If you need validation or want to apply any transformations, you'll have to handle that within the factory function where you have complete control over the configuration object. This allows you to implement any custom validation logic as needed.

For example, if you want to ensure that port is within a certain range, you can add a validation step to the factory function:

```typescript
@@filename(config/configuration)
export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  if (config.http.port < 1024 || config.http.port > 49151) {
    throw new Error('HTTP port must be between 1024 and 49151');
  }

  return config;
};
```

Now, if the port is outside the specified range, the application will throw an error during startup.

<app-banner-devtools></app-banner-devtools>

#### Using the `ConfigService`

To access configuration values from our `ConfigService`, we first need to inject `ConfigService`. As with any provider, we need to import its containing module - the `ConfigModule` - into the module that will use it (unless you set the `isGlobal` property in the options object passed to the `ConfigModule.forRoot()` method to `true`). Import it into a feature module as shown below.

```typescript
@@filename(feature.module)
@Module({
  imports: [ConfigModule],
  // ...
})
```

Then we can inject it using standard constructor injection:

```typescript
constructor(private configService: ConfigService) {}
```

> info **Hint** The `ConfigService` is imported from the `@nestjs/config` package.

And use it in our class:

```typescript
// get an environment variable
const dbUser = this.configService.get<string>('DATABASE_USER');

// get a custom configuration value
const dbHost = this.configService.get<string>('database.host');
```

As shown above, use the `configService.get()` method to get a simple environment variable by passing the variable name. You can do TypeScript type hinting by passing the type, as shown above (e.g., `get<string>(...)`). The `get()` method can also traverse a nested custom configuration object (created via a <a href="techniques/configuration#custom-configuration-files">Custom configuration file</a>), as shown in the second example above.

You can also get the whole nested custom configuration object using an interface as the type hint:

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// you can now use `dbConfig.port` and `dbConfig.host`
const port = dbConfig.port;
```

The `get()` method also takes an optional second argument defining a default value, which will be returned when the key doesn't exist, as shown below:

```typescript
// use "localhost" when "database.host" is not defined
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

`ConfigService` has two optional generics (type arguments). The first one is to help prevent accessing a config property that does not exist. Use it as shown below:

```typescript
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// somewhere in the code
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // TypeScript Error: this is invalid as the URL property is not defined in EnvironmentVariables
  const url = this.configService.get('URL', { infer: true });
}
```

With the `infer` property set to `true`, the `ConfigService#get` method will automatically infer the property type based on the interface, so for example, `typeof port === "number"` (if you're not using `strictNullChecks` flag from TypeScript) since `PORT` has a `number` type in the `EnvironmentVariables` interface.

Also, with the `infer` feature, you can infer the type of a nested custom configuration object's property, even when using dot notation, as follows:

```typescript
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> non-null assertion operator
}
```

The second generic relies on the first one, acting as a type assertion to get rid of all `undefined` types that `ConfigService`'s methods can return when `strictNullChecks` is on. For instance:

```typescript
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ The type of port will be 'number' thus you don't need TS type assertions anymore
}
```

> info **Hint** To make sure the `ConfigService#get` method retrieves values exclusively from custom configuration files and ignores `process.env` variables, set the `skipProcessEnv` option to `true` in the options object of the `ConfigModule`'s `forRoot()` method.

#### Configuration namespaces

The `ConfigModule` allows you to define and load multiple custom configuration files, as shown in <a href="techniques/configuration#custom-configuration-files">Custom configuration files</a> above. You can manage complex configuration object hierarchies with nested configuration objects as shown in that section. Alternatively, you can return a "namespaced" configuration object with the `registerAs()` function as follows:

```typescript
@@filename(config/database.config)
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

As with custom configuration files, inside your `registerAs()` factory function, the `process.env` object will contain the fully resolved environment variable key/value pairs (with `.env` file and externally defined variables resolved and merged as described <a href="techniques/configuration#getting-started">above</a>).

> info **Hint** The `registerAs` function is exported from the `@nestjs/config` package.

Load a namespaced configuration with the `load` property of the `forRoot()` method's options object, in the same way you load a custom configuration file:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

Now, to get the `host` value from the `database` namespace, use dot notation. Use `'database'` as the prefix to the property name, corresponding to the name of the namespace (passed as the first argument to the `registerAs()` function):

```typescript
const dbHost = this.configService.get<string>('database.host');
```

A reasonable alternative is to inject the `database` namespace directly. This allows us to benefit from strong typing:

```typescript
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

> info **Hint** The `ConfigType` is exported from the `@nestjs/config` package.

#### Namespaced configurations in modules

To use a namespaced configuration as a configuration object for another module in your application, you can utilize the `.asProvider()` method of the configuration object. This method converts your namespaced configuration into a provider, which can then be passed to the `forRootAsync()` (or any equivalent method) of the module you want to use.

Here's an example:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
})
```

To understand how the `.asProvider()` method functions, let's examine the return value:

```typescript
// Return value of the .asProvider() method
{
  imports: [ConfigModule.forFeature(databaseConfig)],
  useFactory: (configuration: ConfigType<typeof databaseConfig>) => configuration,
  inject: [databaseConfig.KEY]
}
```

This structure allows you to seamlessly integrate namespaced configurations into your modules, ensuring that your application remains organized and modular, without writing boilerplate, repetitive code.

#### Cache environment variables

As accessing `process.env` can be slow, you can set the `cache` property of the options object passed to `ConfigModule.forRoot()` to increase the performance of `ConfigService#get` method when it comes to variables stored in `process.env`.

```typescript
ConfigModule.forRoot({
  cache: true,
});
```

#### Partial registration

Thus far, we've processed configuration files in our root module (e.g., `AppModule`), with the `forRoot()` method. Perhaps you have a more complex project structure, with feature-specific configuration files located in multiple different directories. Rather than load all these files in the root module, the `@nestjs/config` package provides a feature called **partial registration**, which references only the configuration files associated with each feature module. Use the `forFeature()` static method within a feature module to perform this partial registration, as follows:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> info **Warning** In some circumstances, you may need to access properties loaded via partial registration using the `onModuleInit()` hook, rather than in a constructor. This is because the `forFeature()` method is run during module initialization, and the order of module initialization is indeterminate. If you access values loaded this way by another module, in a constructor, the module that the configuration depends upon may not yet have initialized. The `onModuleInit()` method runs only after all modules it depends upon have been initialized, so this technique is safe.

#### Schema validation

It is standard practice to throw an exception during application startup if required environment variables haven't been provided or if they don't meet certain validation rules. The `@nestjs/config` package enables two different ways to do this:

- [Joi](https://github.com/sideway/joi) built-in validator. With Joi, you define an object schema and validate JavaScript objects against it.
- A custom `validate()` function which takes environment variables as an input.

To use Joi, we must install Joi package:

```bash
$ npm install --save joi
```

Now we can define a Joi validation schema and pass it via the `validationSchema` property of the `forRoot()` method's options object, as shown below:

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

By default, all schema keys are considered optional. Here, we set default values for `NODE_ENV` and `PORT` which will be used if we don't provide these variables in the environment (`.env` file or process environment). Alternatively, we can use the `required()` validation method to require that a value must be defined in the environment (`.env` file or process environment). In this case, the validation step will throw an exception if we don't provide the variable in the environment. See [Joi validation methods](https://joi.dev/api/?v=17.3.0#example) for more on how to construct validation schemas.

By default, unknown environment variables (environment variables whose keys are not present in the schema) are allowed and do not trigger a validation exception. By default, all validation errors are reported. You can alter these behaviors by passing an options object via the `validationOptions` key of the `forRoot()` options object. This options object can contain any of the standard validation options properties provided by [Joi validation options](https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options). For example, to reverse the two settings above, pass options like this:

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

The `@nestjs/config` package uses default settings of:

- `allowUnknown`: controls whether or not to allow unknown keys in the environment variables. Default is `true`
- `abortEarly`: if true, stops validation on the first error; if false, returns all errors. Defaults to `false`.

Note that once you decide to pass a `validationOptions` object, any settings you do not explicitly pass will default to `Joi` standard defaults (not the `@nestjs/config` defaults). For example, if you leave `allowUnknowns` unspecified in your custom `validationOptions` object, it will have the `Joi` default value of `false`. Hence, it is probably safest to specify **both** of these settings in your custom object.

> info **Hint** To disable validation of predefined environment variables, set the `validatePredefined` attribute to `false` in the `forRoot()` method's options object. Predefined environment variables are process variables (`process.env` variables) that were set before the module was imported. For example, if you start your application with `PORT=3000 node main.js`, then `PORT` is a predefined environment variable.

#### Custom validate function

Alternatively, you can specify a **synchronous** `validate` function that takes an object containing the environment variables (from env file and process) and returns an object containing validated environment variables so that you can convert/mutate them if needed. If the function throws an error, it will prevent the application from bootstrapping.

In this example, we'll proceed with the `class-transformer` and `class-validator` packages. First, we have to define:

- a class with validation constraints,
- a validate function that makes use of the `plainToInstance` and `validateSync` functions.

```typescript
@@filename(env.validation)
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

With this in place, use the `validate` function as a configuration option of the `ConfigModule`, as follows:

```typescript
@@filename(app.module)
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

#### Custom getter functions

`ConfigService` defines a generic `get()` method to retrieve a configuration value by key. We may also add `getter` functions to enable a little more natural coding style:

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
@@switch
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

Now we can use the getter function as follows:

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
@@switch
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
```

#### Environment variables loaded hook

If a module configuration depends on the environment variables, and these variables are loaded from the `.env` file, you can use the `ConfigModule.envVariablesLoaded` hook to ensure that the file was loaded before interacting with the `process.env` object, see the following example:

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

This construction guarantees that after the `ConfigModule.envVariablesLoaded` Promise resolves, all configuration variables are loaded up.

#### Conditional module configuration

There may be times where you want to conditionally load in a module and specify the condition in an env variable. Fortunately, `@nestjs/config` provides a `ConditionalModule` that allows you to do just that.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
  ],
})
export class AppModule {}
```

The above module would only load in the `FooModule` if in the `.env` file there is not a `false` value for the env variable `USE_FOO`. You can also pass a custom condition yourself, a function receiving the `process.env` reference that should return a boolean for the `ConditionalModule` to handle:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(
      FooBarModule,
      (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'],
    ),
  ],
})
export class AppModule {}
```

It is important to be sure that when using the `ConditionalModule` you also have the `ConfigModule` loaded in the application, so that the `ConfigModule.envVariablesLoaded` hook can be properly referenced and utilized. If the hook is not flipped to true within 5 seconds, or a timeout in milliseconds, set by the user in the third options parameter of the `registerWhen` method, then the `ConditionalModule` will throw an error and Nest will abort starting the application.

#### Expandable variables

The `@nestjs/config` package supports environment variable expansion. With this technique, you can create nested environment variables, where one variable is referred to within the definition of another. For example:

```json
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

With this construction, the variable `SUPPORT_EMAIL` resolves to `'support@mywebsite.com'`. Note the use of the `${{ '{' }}...{{ '}' }}` syntax to trigger resolving the value of the variable `APP_URL` inside the definition of `SUPPORT_EMAIL`.

> info **Hint** For this feature, `@nestjs/config` package internally uses [dotenv-expand](https://github.com/motdotla/dotenv-expand).

Enable environment variable expansion using the `expandVariables` property in the options object passed to the `forRoot()` method of the `ConfigModule`, as shown below:

```typescript
@@filename(app.module)
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

#### Using in the `main.ts`

While our config is stored in a service, it can still be used in the `main.ts` file. This way, you can use it to store variables such as the application port or the CORS host.

To access it, you must use the `app.get()` method, followed by the service reference:

```typescript
const configService = app.get(ConfigService);
```

You can then use it as usual, by calling the `get` method with the configuration key:

```typescript
const port = configService.get('PORT');
```


---

## Cookies

### Cookies

An **HTTP cookie** is a small piece of data stored by the user's browser. Cookies were designed to be a reliable mechanism for websites to remember stateful information. When the user visits the website again, the cookie is automatically sent with the request.

#### Use with Express (default)

First install the [required package](https://github.com/expressjs/cookie-parser) (and its types for TypeScript users):

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

Once the installation is complete, apply the `cookie-parser` middleware as global middleware (for example, in your `main.ts` file).

```typescript
import * as cookieParser from 'cookie-parser';
// somewhere in your initialization file
app.use(cookieParser());
```

You can pass several options to the `cookieParser` middleware:

- `secret` a string or array used for signing cookies. This is optional and if not specified, will not parse signed cookies. If a string is provided, this is used as the secret. If an array is provided, an attempt will be made to unsign the cookie with each secret in order.
- `options` an object that is passed to `cookie.parse` as the second option. See [cookie](https://www.npmjs.org/package/cookie) for more information.

The middleware will parse the `Cookie` header on the request and expose the cookie data as the property `req.cookies` and, if a secret was provided, as the property `req.signedCookies`. These properties are name value pairs of the cookie name to cookie value.

When a secret is provided, this module will unsign and validate any signed cookie values and move those name value pairs from `req.cookies` into `req.signedCookies`. A signed cookie is a cookie that has a value prefixed with `s:`. Signed cookies that fail signature validation will have the value `false` instead of the tampered value.

With this in place, you can now read cookies from within the route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
  // or console.log(request.signedCookies);
}
```

> info **Hint** The `@Req()` decorator is imported from the `@nestjs/common`, while `Request` from the `express` package.

To attach a cookie to an outgoing response, use the `Response#cookie()` method:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value')
}
```

> warning **Warning** If you want to leave the response handling logic to the framework, remember to set the `passthrough` option to `true`, as shown above. Read more [here](/controllers#library-specific-approach).

> info **Hint** The `@Res()` decorator is imported from the `@nestjs/common`, while `Response` from the `express` package.

#### Use with Fastify

First install the required package:

```shell
$ npm i @fastify/cookie
```

Once the installation is complete, register the `@fastify/cookie` plugin:

```typescript
import fastifyCookie from '@fastify/cookie';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, {
  secret: 'my-secret', // for cookies signature
});
```

With this in place, you can now read cookies from within the route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
}
```

> info **Hint** The `@Req()` decorator is imported from the `@nestjs/common`, while `FastifyRequest` from the `fastify` package.

To attach a cookie to an outgoing response, use the `FastifyReply#setCookie()` method:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value')
}
```

To read more about `FastifyReply#setCookie()` method, check out this [page](https://github.com/fastify/fastify-cookie#sending).

> warning **Warning** If you want to leave the response handling logic to the framework, remember to set the `passthrough` option to `true`, as shown above. Read more [here](/controllers#library-specific-approach).

> info **Hint** The `@Res()` decorator is imported from the `@nestjs/common`, while `FastifyReply` from the `fastify` package.

#### Creating a custom decorator (cross-platform)

To provide a convenient, declarative way of accessing incoming cookies, we can create a [custom decorator](/custom-decorators).

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
```

The `@Cookies()` decorator will extract all cookies, or a named cookie from the `req.cookies` object and populate the decorated parameter with that value.

With this in place, we can now use the decorator in a route handler signature, as follows:

```typescript
@Get()
findAll(@Cookies('name') name: string) {}
```


---

## Database

### Database

Nest is database agnostic, allowing you to easily integrate with any SQL or NoSQL database. You have a number of options available to you, depending on your preferences. At the most general level, connecting Nest to a database is simply a matter of loading an appropriate Node.js driver for the database, just as you would with [Express](https://expressjs.com/en/guide/database-integration.html) or Fastify.

You can also directly use any general purpose Node.js database integration **library** or ORM, such as [MikroORM](https://mikro-orm.io/) (see [MikroORM recipe](/recipes/mikroorm)), [Sequelize](https://sequelize.org/) (see [Sequelize integration](/techniques/database#sequelize-integration)), [Knex.js](https://knexjs.org/) (see [Knex.js tutorial](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an)), [TypeORM](https://github.com/typeorm/typeorm), and [Prisma](https://www.github.com/prisma/prisma) (see [Prisma recipe](/recipes/prisma)), to operate at a higher level of abstraction.

For convenience, Nest provides tight integration with TypeORM and Sequelize out-of-the-box with the `@nestjs/typeorm` and `@nestjs/sequelize` packages respectively, which we'll cover in the current chapter, and Mongoose with `@nestjs/mongoose`, which is covered in [this chapter](/techniques/mongodb). These integrations provide additional NestJS-specific features, such as model/repository injection, testability, and asynchronous configuration to make accessing your chosen database even easier.

### TypeORM Integration

For integrating with SQL and NoSQL databases, Nest provides the `@nestjs/typeorm` package. [TypeORM](https://github.com/typeorm/typeorm) is the most mature Object Relational Mapper (ORM) available for TypeScript. Since it's written in TypeScript, it integrates well with the Nest framework.

To begin using it, we first install the required dependencies. In this chapter, we'll demonstrate using the popular [MySQL](https://www.mysql.com/) Relational DBMS, but TypeORM provides support for many relational databases, such as PostgreSQL, Oracle, Microsoft SQL Server, SQLite, and even NoSQL databases like MongoDB. The procedure we walk through in this chapter will be the same for any database supported by TypeORM. You'll simply need to install the associated client API libraries for your selected database.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

Once the installation process is complete, we can import the `TypeOrmModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** Setting `synchronize: true` shouldn't be used in production - otherwise you can lose production data.

The `forRoot()` method supports all the configuration properties exposed by the `DataSource` constructor from the [TypeORM](https://typeorm.io/data-source-options#common-data-source-options) package. In addition, there are several extra configuration properties described below.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of attempts to connect to the database (default: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between connection retry attempts (ms) (default: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>If <code>true</code>, entities will be loaded automatically (default: <code>false</code>)</td>
  </tr>
</table>

> info **Hint** Learn more about the data source options [here](https://typeorm.io/data-source-options).

Once this is done, the TypeORM `DataSource` and `EntityManager` objects will be available to inject across the entire project (without needing to import any modules), for example:

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
```

#### Repository pattern

[TypeORM](https://github.com/typeorm/typeorm) supports the **repository design pattern**, so each entity has its own repository. These repositories can be obtained from the database data source.

To continue the example, we need at least one entity. Let's define the `User` entity.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
```

> info **Hint** Learn more about entities in the [TypeORM documentation](https://typeorm.io/docs/entity/entities/).

The `User` entity file sits in the `users` directory. This directory contains all files related to the `UsersModule`. You can decide where to keep your model files, however, we recommend creating them near their **domain**, in the corresponding module directory.

To begin using the `User` entity, we need to let TypeORM know about it by inserting it into the `entities` array in the module `forRoot()` method options (unless you use a static glob path):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Next, let's look at the `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

This module uses the `forFeature()` method to define which repositories are registered in the current scope. With that in place, we can inject the `UsersRepository` into the `UsersService` using the `@InjectRepository()` decorator:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
```

> warning **Notice** Don't forget to import the `UsersModule` into the root `AppModule`.

If you want to use the repository outside of the module which imports `TypeOrmModule.forFeature`, you'll need to re-export the providers generated by it.
You can do this by exporting the whole module, like this:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
```

Now if we import `UsersModule` in `UserHttpModule`, we can use `@InjectRepository(User)` in the providers of the latter module.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

Relations are associations established between two or more tables. Relations are based on common fields from each table, often involving primary and foreign keys.

There are three types of relations:

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>Every row in the primary table has one and only one associated row in the foreign table.  Use the <code>@OneToOne()</code> decorator to define this type of relation.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>Every row in the primary table has one or more related rows in the foreign table. Use the <code>@OneToMany()</code> and <code>@ManyToOne()</code> decorators to define this type of relation.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>Every row in the primary table has many related rows in the foreign table, and every record in the foreign table has many related rows in the primary table. Use the <code>@ManyToMany()</code> decorator to define this type of relation.</td>
  </tr>
</table>

To define relations in entities, use the corresponding **decorators**. For example, to define that each `User` can have multiple photos, use the `@OneToMany()` decorator.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

> info **Hint** To learn more about relations in TypeORM, visit the [TypeORM documentation](https://typeorm.io/docs/relations/relations).

#### Auto-load entities

Manually adding entities to the `entities` array of the data source options can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and causes leaking implementation details to other parts of the application. To address this issue, an alternative solution is provided. To automatically load entities, set the `autoLoadEntities` property of the configuration object (passed into the `forRoot()` method) to `true`, as shown below:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

With that option specified, every entity registered through the `forFeature()` method will be automatically added to the `entities` array of the configuration object.

> warning **Warning** Note that entities that aren't registered through the `forFeature()` method, but are only referenced from the entity (via a relationship), won't be included by way of the `autoLoadEntities` setting.

#### Separating entity definition

You can define an entity and its columns right in the model, using decorators. But some people prefer to define entities and their columns inside separate files using the ["entity schemas"](https://typeorm.io/docs/entity/separating-entity-definition).

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // the name of the PhotoSchema
    },
  },
});
```

> warning error **Warning** If you provide the `target` option, the `name` option value has to be the same as the name of the target class.
> If you do not provide the `target` you can use any name.

Nest allows you to use an `EntitySchema` instance wherever an `Entity` is expected, for example:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### TypeORM Transactions

A database transaction symbolizes a unit of work performed within a database management system against a database, and treated in a coherent and reliable way independent of other transactions. A transaction generally represents any change in a database ([learn more](https://en.wikipedia.org/wiki/Database_transaction)).

There are many different strategies to handle [TypeORM transactions](https://typeorm.io/docs/advanced-topics/transactions/). We recommend using the `QueryRunner` class because it gives full control over the transaction.

First, we need to inject the `DataSource` object into a class in the normal way:

```typescript
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
```

> info **Hint** The `DataSource` class is imported from the `typeorm` package.

Now, we can use this object to create a transaction.

```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // since we have errors lets rollback the changes we made
    await queryRunner.rollbackTransaction();
  } finally {
    // you need to release a queryRunner which was manually instantiated
    await queryRunner.release();
  }
}
```

> info **Hint** Note that the `dataSource` is used only to create the `QueryRunner`. However, to test this class would require mocking the entire `DataSource` object (which exposes several methods). Thus, we recommend using a helper factory class (e.g., `QueryRunnerFactory`) and defining an interface with a limited set of methods required to maintain transactions. This technique makes mocking these methods pretty straightforward.

<app-banner-devtools></app-banner-devtools>

Alternatively, you can use the callback-style approach with the `transaction` method of the `DataSource` object ([read more](https://typeorm.io/docs/advanced-topics/transactions/#creating-and-using-transactions)).

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

#### Subscribers

With TypeORM [subscribers](https://typeorm.io/docs/advanced-topics/listeners-and-subscribers#what-is-a-subscriber), you can listen to specific entity events.

```typescript
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```

> error **Warning** Event subscribers can not be [request-scoped](/fundamentals/injection-scopes).

Now, add the `UserSubscriber` class to the `providers` array:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### Migrations

[Migrations](https://typeorm.io/docs/advanced-topics/migrations/) provide a way to incrementally update the database schema to keep it in sync with the application's data model while preserving existing data in the database. To generate, run, and revert migrations, TypeORM provides a dedicated [CLI](https://typeorm.io/docs/advanced-topics/migrations/#creating-a-new-migration).

Migration classes are separate from the Nest application source code. Their lifecycle is maintained by the TypeORM CLI. Therefore, you are not able to leverage dependency injection and other Nest specific features with migrations. To learn more about migrations, follow the guide in the [TypeORM documentation](https://typeorm.io/docs/advanced-topics/migrations/).

#### Multiple databases

Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, data source naming becomes **mandatory**.

Suppose you have an `Album` entity stored in its own database.

```typescript
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** If you don't set the `name` for a data source, its name is set to `default`. Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.

> warning **Notice** If you are using `TypeOrmModule.forRootAsync`, you have to **also** set the data source name outside `useFactory`. For example:
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> See [this issue](https://github.com/nestjs/typeorm/issues/86) for more details.

At this point, you have `User` and `Album` entities registered with their own data source. With this setup, you have to tell the `TypeOrmModule.forFeature()` method and the `@InjectRepository()` decorator which data source should be used. If you do not pass any data source name, the `default` data source is used.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

You can also inject the `DataSource` or `EntityManager` for a given data source:

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
```

It's also possible to inject any `DataSource` to the providers:

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Testing

When it comes to unit testing an application, we usually want to avoid making a database connection, keeping our test suites independent and their execution process as fast as possible. But our classes might depend on repositories that are pulled from the data source (connection) instance. How do we handle that? The solution is to create mock repositories. In order to achieve that, we set up [custom providers](/fundamentals/custom-providers). Each registered repository is automatically represented by an `<EntityName>Repository` token, where `EntityName` is the name of your entity class.

The `@nestjs/typeorm` package exposes the `getRepositoryToken()` function which returns a prepared token based on a given entity.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

Now a substitute `mockRepository` will be used as the `UsersRepository`. Whenever any class asks for `UsersRepository` using an `@InjectRepository()` decorator, Nest will use the registered `mockRepository` object.

#### Async configuration

You may want to pass your repository module options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which provides several ways to deal with async configuration.

One approach is to use a factory function:

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

The construction above will instantiate `TypeOrmConfigService` inside `TypeOrmModule` and use it to provide an options object by calling `createTypeOrmOptions()`. Note that this means that the `TypeOrmConfigService` has to implement the `TypeOrmOptionsFactory` interface, as shown below:

```typescript
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
```

In order to prevent the creation of `TypeOrmConfigService` inside `TypeOrmModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `TypeOrmModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

> info **Hint** Make sure that the `name` property is defined at the same level as the `useFactory`, `useClass`, or `useValue` property. This will allow Nest to properly register the data source under the appropriate injection token.

#### Custom DataSource Factory

In conjunction with async configuration using `useFactory`, `useClass`, or `useExisting`, you can optionally specify a `dataSourceFactory` function which will allow you to provide your own TypeORM data source rather than allowing `TypeOrmModule` to create the data source.

`dataSourceFactory` receives the TypeORM `DataSourceOptions` configured during async configuration using `useFactory`, `useClass`, or `useExisting` and returns a `Promise` that resolves a TypeORM `DataSource`.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Use useFactory, useClass, or useExisting
  // to configure the DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource receives the configured DataSourceOptions
  // and returns a Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

> info **Hint** The `DataSource` class is imported from the `typeorm` package.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm).

<app-banner-enterprise></app-banner-enterprise>

### Sequelize Integration

An alternative to using TypeORM is to use the [Sequelize](https://sequelize.org/) ORM with the `@nestjs/sequelize` package. In addition, we leverage the [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) package which provides a set of additional decorators to declaratively define entities.

To begin using it, we first install the required dependencies. In this chapter, we'll demonstrate using the popular [MySQL](https://www.mysql.com/) Relational DBMS, but Sequelize provides support for many relational databases, such as PostgreSQL, MySQL, Microsoft SQL Server, SQLite, and MariaDB. The procedure we walk through in this chapter will be the same for any database supported by Sequelize. You'll simply need to install the associated client API libraries for your selected database.

```bash
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

Once the installation process is complete, we can import the `SequelizeModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```

The `forRoot()` method supports all the configuration properties exposed by the Sequelize constructor ([read more](https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database)). In addition, there are several extra configuration properties described below.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of attempts to connect to the database (default: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between connection retry attempts (ms) (default: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadModels</code></td>
    <td>If <code>true</code>, models will be loaded automatically (default: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>keepConnectionAlive</code></td>
    <td>If <code>true</code>, connection will not be closed on the application shutdown (default: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>synchronize</code></td>
    <td>If <code>true</code>, automatically loaded models will be synchronized (default: <code>true</code>)</td>
  </tr>
</table>

Once this is done, the `Sequelize` object will be available to inject across the entire project (without needing to import any modules), for example:

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
  constructor(private sequelize: Sequelize) {}
}
@@switch
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
}
```

#### Models

Sequelize implements the Active Record pattern. With this pattern, you use model classes directly to interact with the database. To continue the example, we need at least one model. Let's define the `User` model.

```typescript
@@filename(user.model)
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
```

> info **Hint** Learn more about the available decorators [here](https://github.com/RobinBuschmann/sequelize-typescript#column).

The `User` model file sits in the `users` directory. This directory contains all files related to the `UsersModule`. You can decide where to keep your model files, however, we recommend creating them near their **domain**, in the corresponding module directory.

To begin using the `User` model, we need to let Sequelize know about it by inserting it into the `models` array in the module `forRoot()` method options:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}
```

Next, let's look at the `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

This module uses the `forFeature()` method to define which models are registered in the current scope. With that in place, we can inject the `UserModel` into the `UsersService` using the `@InjectModel()` decorator:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  findOne(id) {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
```

> warning **Notice** Don't forget to import the `UsersModule` into the root `AppModule`.

If you want to use the model outside of the module which imports `SequelizeModule.forFeature`, you'll need to re-export the providers generated by it.
You can do this by exporting the whole module, like this:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  exports: [SequelizeModule]
})
export class UsersModule {}
```

Now if we import `UsersModule` in `UserHttpModule`, we can use `@InjectModel(User)` in the providers of the latter module.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

Relations are associations established between two or more tables. Relations are based on common fields from each table, often involving primary and foreign keys.

There are three types of relations:

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>Every row in the primary table has one and only one associated row in the foreign table</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>Every row in the primary table has one or more related rows in the foreign table</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>Every row in the primary table has many related rows in the foreign table, and every record in the foreign table has many related rows in the primary table</td>
  </tr>
</table>

To define relations in models, use the corresponding **decorators**. For example, to define that each `User` can have multiple photos, use the `@HasMany()` decorator.

```typescript
@@filename(user.model)
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
```

> info **Hint** To learn more about associations in Sequelize, read [this](https://github.com/RobinBuschmann/sequelize-typescript#model-association) chapter.

#### Auto-load models

Manually adding models to the `models` array of the connection options can be tedious. In addition, referencing models from the root module breaks application domain boundaries and causes leaking implementation details to other parts of the application. To solve this issue, automatically load models by setting both `autoLoadModels` and `synchronize` properties of the configuration object (passed into the `forRoot()` method) to `true`, as shown below:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

With that option specified, every model registered through the `forFeature()` method will be automatically added to the `models` array of the configuration object.

> warning **Warning** Note that models that aren't registered through the `forFeature()` method, but are only referenced from the model (via an association), won't be included.

#### Sequelize Transactions

A database transaction symbolizes a unit of work performed within a database management system against a database, and treated in a coherent and reliable way independent of other transactions. A transaction generally represents any change in a database ([learn more](https://en.wikipedia.org/wiki/Database_transaction)).

There are many different strategies to handle [Sequelize transactions](https://sequelize.org/docs/v6/other-topics/transactions/). Below is a sample implementation of a managed transaction (auto-callback).

First, we need to inject the `Sequelize` object into a class in the normal way:

```typescript
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
```

> info **Hint** The `Sequelize` class is imported from the `sequelize-typescript` package.

Now, we can use this object to create a transaction.

```typescript
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // Transaction has been rolled back
    // err is whatever rejected the promise chain returned to the transaction callback
  }
}
```

> info **Hint** Note that the `Sequelize` instance is used only to start the transaction. However, to test this class would require mocking the entire `Sequelize` object (which exposes several methods). Thus, we recommend using a helper factory class (e.g., `TransactionRunner`) and defining an interface with a limited set of methods required to maintain transactions. This technique makes mocking these methods pretty straightforward.

#### Migrations

[Migrations](https://sequelize.org/docs/v6/other-topics/migrations/) provide a way to incrementally update the database schema to keep it in sync with the application's data model while preserving existing data in the database. To generate, run, and revert migrations, Sequelize provides a dedicated [CLI](https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli).

Migration classes are separate from the Nest application source code. Their lifecycle is maintained by the Sequelize CLI. Therefore, you are not able to leverage dependency injection and other Nest specific features with migrations. To learn more about migrations, follow the guide in the [Sequelize documentation](https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli).

<app-banner-courses></app-banner-courses>

#### Multiple databases

Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, connection naming becomes **mandatory**.

Suppose you have an `Album` entity stored in its own database.

```typescript
const defaultOptions = {
  dialect: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      models: [User],
    }),
    SequelizeModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      models: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** If you don't set the `name` for a connection, its name is set to `default`. Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.

At this point, you have `User` and `Album` models registered with their own connection. With this setup, you have to tell the `SequelizeModule.forFeature()` method and the `@InjectModel()` decorator which connection should be used. If you do not pass any connection name, the `default` connection is used.

```typescript
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    SequelizeModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

You can also inject the `Sequelize` instance for a given connection:

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectConnection('albumsConnection')
    private sequelize: Sequelize,
  ) {}
}
```

It's also possible to inject any `Sequelize` instance to the providers:

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsSequelize: Sequelize) => {
        return new AlbumsService(albumsSequelize);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Testing

When it comes to unit testing an application, we usually want to avoid making a database connection, keeping our test suites independent and their execution process as fast as possible. But our classes might depend on models that are pulled from the connection instance. How do we handle that? The solution is to create mock models. In order to achieve that, we set up [custom providers](/fundamentals/custom-providers). Each registered model is automatically represented by a `<ModelName>Model` token, where `ModelName` is the name of your model class.

The `@nestjs/sequelize` package exposes the `getModelToken()` function which returns a prepared token based on a given model.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getModelToken(User),
      useValue: mockModel,
    },
  ],
})
export class UsersModule {}
```

Now a substitute `mockModel` will be used as the `UserModel`. Whenever any class asks for `UserModel` using an `@InjectModel()` decorator, Nest will use the registered `mockModel` object.

#### Async configuration

You may want to pass your `SequelizeModule` options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which provides several ways to deal with async configuration.

One approach is to use a factory function:

```typescript
SequelizeModule.forRootAsync({
  useFactory: () => ({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    models: [],
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dialect: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    models: [],
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
SequelizeModule.forRootAsync({
  useClass: SequelizeConfigService,
});
```

The construction above will instantiate `SequelizeConfigService` inside `SequelizeModule` and use it to provide an options object by calling `createSequelizeOptions()`. Note that this means that the `SequelizeConfigService` has to implement the `SequelizeOptionsFactory` interface, as shown below:

```typescript
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    };
  }
}
```

In order to prevent the creation of `SequelizeConfigService` inside `SequelizeModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `SequelizeModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/07-sequelize).


---

## Events

### Events

[Event Emitter](https://www.npmjs.com/package/@nestjs/event-emitter) package (`@nestjs/event-emitter`) provides a simple observer implementation, allowing you to subscribe and listen for various events that occur in your application. Events serve as a great way to decouple various aspects of your application, since a single event can have multiple listeners that do not depend on each other.

`EventEmitterModule` internally uses the [eventemitter2](https://github.com/EventEmitter2/EventEmitter2) package.

#### Getting started

First install the required package:

```shell
$ npm i --save @nestjs/event-emitter
```

Once the installation is complete, import the `EventEmitterModule` into the root `AppModule` and run the `forRoot()` static method as shown below:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
```

The `.forRoot()` call initializes the event emitter and registers any declarative event listeners that exist within your app. Registration occurs when the `onApplicationBootstrap` lifecycle hook occurs, ensuring that all modules have loaded and declared any scheduled jobs.

To configure the underlying `EventEmitter` instance, pass the configuration object to the `.forRoot()` method, as follows:

```typescript
EventEmitterModule.forRoot({
  // set this to `true` to use wildcards
  wildcard: false,
  // the delimiter used to segment namespaces
  delimiter: '.',
  // set this to `true` if you want to emit the newListener event
  newListener: false,
  // set this to `true` if you want to emit the removeListener event
  removeListener: false,
  // the maximum amount of listeners that can be assigned to an event
  maxListeners: 10,
  // show event name in memory leak message when more than maximum amount of listeners is assigned
  verboseMemoryLeak: false,
  // disable throwing uncaughtException if an error event is emitted and it has no listeners
  ignoreErrors: false,
});
```

#### Dispatching events

To dispatch (i.e., fire) an event, first inject `EventEmitter2` using standard constructor injection:

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **Hint** Import the `EventEmitter2` from the `@nestjs/event-emitter` package.

Then use it in a class as follows:

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### Listening to events

To declare an event listener, decorate a method with the `@OnEvent()` decorator preceding the method definition containing the code to be executed, as follows:

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

> warning **Warning** Event subscribers cannot be request-scoped.

The first argument can be a `string` or `symbol` for a simple event emitter and a `string | symbol | Array<string | symbol>` in a case of a wildcard emitter.

The second argument (optional) is a listener options object as follows:

```typescript
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of append) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", the onEvent callback will not throw an error while handling the event. Otherwise, if "false" it will throw an error.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **Hint** Read more about the `OnOptions` options object from [`eventemitter2`](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean).

```typescript
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

To use namespaces/wildcards, pass the `wildcard` option into the `EventEmitterModule#forRoot()` method. When namespaces/wildcards are enabled, events can either be strings (`foo.bar`) separated by a delimiter or arrays (`['foo', 'bar']`). The delimiter is also configurable as a configuration property (`delimiter`). With namespaces feature enabled, you can subscribe to events using a wildcard:

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // handle and process an event
}
```

Note that such a wildcard only applies to one block. The argument `order.*` will match, for example, the events `order.created` and `order.shipped` but not `order.delayed.out_of_stock`. In order to listen to such events,
use the `multilevel wildcard` pattern (i.e, `**`), described in the `EventEmitter2` [documentation](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards).

With this pattern, you can, for example, create an event listener that catches all events.

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // handle and process an event
}
```

> info **Hint** `EventEmitter2` class provides several useful methods for interacting with events, like `waitFor` and `onAny`. You can read more about them [here](https://github.com/EventEmitter2/EventEmitter2).

#### Preventing event loss

Events triggered before or during the `onApplicationBootstrap` lifecycle hook—such as those from module constructors or the `onModuleInit` method—may be missed because the `EventSubscribersLoader` might not have finished setting up the listeners.

To avoid this issue, you can use the `waitUntilReady` method of the `EventEmitterReadinessWatcher`, which returns a promise that resolves once all listeners have been registered. This method can be called in the `onApplicationBootstrap` lifecycle hook of a module to ensure that all events are properly captured.

```typescript
await this.eventEmitterReadinessWatcher.waitUntilReady();
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({ orderId: 1, payload: {} }),
);
```

> info **Note** This is only necessary for events emitted before the `onApplicationBootstrap` lifecycle hook is complete.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter).


---

## File upload

### File upload

To handle file uploading, Nest provides a built-in module based on the [multer](https://github.com/expressjs/multer) middleware package for Express. Multer handles data posted in the `multipart/form-data` format, which is primarily used for uploading files via an HTTP `POST` request. This module is fully configurable and you can adjust its behavior to your application requirements.

> warning **Warning** Multer cannot process data which is not in the supported multipart format (`multipart/form-data`). Also, note that this package is not compatible with the `FastifyAdapter`.

For better type safety, let's install Multer typings package:

```shell
$ npm i -D @types/multer
```

With this package installed, we can now use the `Express.Multer.File` type (you can import this type as follows: `import {{ '{' }} Express {{ '}' }} from 'express'`).

#### Basic example

To upload a single file, simply tie the `FileInterceptor()` interceptor to the route handler and extract `file` from the `request` using the `@UploadedFile()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
@@switch
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
```

> info **Hint** The `FileInterceptor()` decorator is exported from the `@nestjs/platform-express` package. The `@UploadedFile()` decorator is exported from `@nestjs/common`.

The `FileInterceptor()` decorator takes two arguments:

- `fieldName`: string that supplies the name of the field from the HTML form that holds a file
- `options`: optional object of type `MulterOptions`. This is the same object used by the multer constructor (more details [here](https://github.com/expressjs/multer#multeropts)).

> warning **Warning** `FileInterceptor()` may not be compatible with third party cloud providers like Google Firebase or others.

#### File validation

Often times it can be useful to validate incoming file metadata, like file size or file mime-type. For this, you can create your own [Pipe](https://docs.nestjs.com/pipes) and bind it to the parameter annotated with the `UploadedFile` decorator. The example below demonstrates how a basic file size validator pipe could be implemented:

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value" is an object containing the file's attributes and metadata
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
```

This can be used in conjunction with the `FileInterceptor` as follows:

```typescript
@Post('file')
@UseInterceptors(FileInterceptor('file'))
uploadFileAndValidate(@UploadedFile(
  new FileSizeValidationPipe(),
  // other pipes can be added here
) file: Express.Multer.File, ) {
  return file;
}
```

Nest provides a built-in pipe to handle common use cases and facilitate/standardize the addition of new ones. This pipe is called `ParseFilePipe`, and you can use it as follows:

```typescript
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... Set of file validator instances here
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
```

As you can see, it's required to specify an array of file validators that will be executed by the `ParseFilePipe`. We'll discuss the interface of a validator, but it's worth mentioning this pipe also has two additional **optional** options:

<table>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td>The HTTP status code to be thrown in case <b>any</b> validator fails. Default is <code>400</code> (BAD REQUEST)</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td>A factory which receives the error message and returns an error.</td>
  </tr>
</table>

Now, back to the `FileValidator` interface. To integrate validators with this pipe, you have to either use built-in implementations or provide your own custom `FileValidator`. See example below:

```typescript
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * Indicates if this file should be considered valid, according to the options passed in the constructor.
   * @param file the file from the request object
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * Builds an error message in case the validation fails.
   * @param file the file from the request object
   */
  abstract buildErrorMessage(file: any): string;
}
```

> info **Hint** The `FileValidator` interfaces supports async validation via its `isValid` function. To leverage type security, you can also type the `file` parameter as `Express.Multer.File` in case you are using express (default) as a driver.

`FileValidator` is a regular class that has access to the file object and validates it according to the options provided by the client. Nest has two built-in `FileValidator` implementations you can use in your project:

- `MaxFileSizeValidator` - Checks if a given file's size is less than the provided value (measured in `bytes`)
- `FileTypeValidator` - Checks if a given file's mime-type matches a given string or RegExp.  By default, validates the mime-type using file content [magic number](https://www.ibm.com/support/pages/what-magic-number)

To understand how these can be used in conjunction with the aforementioned `FileParsePipe`, we'll use an altered snippet of the last presented example:

```typescript
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
```

> info **Hint** If the number of validators increase largely or their options are cluttering the file, you can define this array in a separate file and import it here as a named constant like `fileValidators`.

Finally, you can use the special `ParseFilePipeBuilder` class that lets you compose & construct your validators. By using it as shown below you can avoid manual instantiation of each validator and just pass their options directly:

```typescript
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
```

> info **Hint** File presence is required by default, but you can make it optional by adding `fileIsRequired: false` parameter inside `build` function options (at the same level as `errorHttpStatusCode`).

#### Array of files

To upload an array of files (identified with a single field name), use the `FilesInterceptor()` decorator (note the plural **Files** in the decorator name). This decorator takes three arguments:

- `fieldName`: as described above
- `maxCount`: optional number defining the maximum number of files to accept
- `options`: optional `MulterOptions` object, as described above

When using `FilesInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
```

> info **Hint** The `FilesInterceptor()` decorator is exported from the `@nestjs/platform-express` package. The `@UploadedFiles()` decorator is exported from `@nestjs/common`.

#### Multiple files

To upload multiple files (all with different field name keys), use the `FileFieldsInterceptor()` decorator. This decorator takes two arguments:

- `uploadedFields`: an array of objects, where each object specifies a required `name` property with a string value specifying a field name, as described above, and an optional `maxCount` property, as described above
- `options`: optional `MulterOptions` object, as described above

When using `FileFieldsInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
```

#### Any files

To upload all fields with arbitrary field name keys, use the `AnyFilesInterceptor()` decorator. This decorator can accept an optional `options` object as described above.

When using `AnyFilesInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
```

#### No files

To accept `multipart/form-data` but not allow any files to be uploaded, use the `NoFilesInterceptor`. This sets multipart data as attributes on the request body. Any files sent with the request will throw a `BadRequestException`.

```typescript
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
```

#### Default options

You can specify multer options in the file interceptors as described above. To set default options, you can call the static `register()` method when you import the `MulterModule`, passing in supported options. You can use all options listed [here](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register({
  dest: './upload',
});
```

> info **Hint** The `MulterModule` class is exported from the `@nestjs/platform-express` package.

#### Async configuration

When you need to set `MulterModule` options asynchronously instead of statically, use the `registerAsync()` method. As with most dynamic modules, Nest provides several techniques to deal with async configuration.

One technique is to use a factory function:

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
```

Like other [factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory), our factory function can be `async` and can inject dependencies through `inject`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `MulterModule` using a class instead of a factory, as shown below:

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

The construction above instantiates `MulterConfigService` inside `MulterModule`, using it to create the required options object. Note that in this example, the `MulterConfigService` has to implement the `MulterOptionsFactory` interface, as shown below. The `MulterModule` will call the `createMulterOptions()` method on the instantiated object of the supplied class.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
```

If you want to reuse an existing options provider instead of creating a private copy inside the `MulterModule`, use the `useExisting` syntax.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

You can also pass so-called `extraProviders` to the `registerAsync()` method. These providers will be merged with the module providers.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when you want to provide additional dependencies to the factory function or the class constructor.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/29-file-upload).


---

## HTTP module

### HTTP module

[Axios](https://github.com/axios/axios) is a richly featured HTTP client package that is widely used. Nest wraps Axios and exposes it via the built-in `HttpModule`. The `HttpModule` exports the `HttpService` class, which exposes Axios-based methods to perform HTTP requests. The library also transforms the resulting HTTP responses into `Observables`.

> info **Hint** You can also use any general purpose Node.js HTTP client library directly, including [got](https://github.com/sindresorhus/got) or [undici](https://github.com/nodejs/undici).

#### Installation

To begin using it, we first install required dependencies.

```bash
$ npm i --save @nestjs/axios axios
```

#### Getting started

Once the installation process is complete, to use the `HttpService`, first import `HttpModule`.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

Next, inject `HttpService` using normal constructor injection.

> info **Hint** `HttpModule` and `HttpService` are imported from `@nestjs/axios` package.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> info **Hint** `AxiosResponse` is an interface exported from the `axios` package (`$ npm i axios`).

All `HttpService` methods return an `AxiosResponse` wrapped in an `Observable` object.

#### Configuration

[Axios](https://github.com/axios/axios) can be configured with a variety of options to customize the behavior of the `HttpService`. Read more about them [here](https://github.com/axios/axios#request-config). To configure the underlying Axios instance, pass an optional options object to the `register()` method of `HttpModule` when importing it. This options object will be passed directly to the underlying Axios constructor.

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `registerAsync()` method. As with most dynamic modules, Nest provides several techniques to deal with async configuration.

One technique is to use a factory function:

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

Like other factory providers, our factory function can be [async](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) and can inject dependencies through `inject`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `HttpModule` using a class instead of a factory, as shown below.

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

The construction above instantiates `HttpConfigService` inside `HttpModule`, using it to create an options object. Note that in this example, the `HttpConfigService` has to implement `HttpModuleOptionsFactory` interface as shown below. The `HttpModule` will call the `createHttpOptions()` method on the instantiated object of the supplied class.

```typescript
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
```

If you want to reuse an existing options provider instead of creating a private copy inside the `HttpModule`, use the `useExisting` syntax.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
```

You can also pass so-called `extraProviders` to the `registerAsync()` method. These providers will be merged with the module providers.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useClass: HttpConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when you want to provide additional dependencies to the factory function or the class constructor.

#### Using Axios directly

If you think that `HttpModule.register`'s options are not enough for you, or if you just want to access the underlying Axios instance created by `@nestjs/axios`, you can access it via `HttpService#axiosRef` as follows:

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ AxiosInstance interface
  }
}
```

#### Full example

Since the return value of the `HttpService` methods is an Observable, we can use `rxjs` - `firstValueFrom` or `lastValueFrom` to retrieve the data of the request in the form of a promise.

```typescript
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```

> info **Hint** Visit RxJS's documentation on [`firstValueFrom`](https://rxjs.dev/api/index/function/firstValueFrom) and [`lastValueFrom`](https://rxjs.dev/api/index/function/lastValueFrom) for differences between them.


---

## Injection scopes

### Injection scopes

For people coming from different programming language backgrounds, it might be unexpected to learn that in Nest, almost everything is shared across incoming requests. We have a connection pool to the database, singleton services with global state, etc. Remember that Node.js doesn't follow the request/response Multi-Threaded Stateless Model in which every request is processed by a separate thread. Hence, using singleton instances is fully **safe** for our applications.

However, there are edge cases when request-based lifetime may be the desired behavior, for instance, per-request caching in GraphQL applications, request tracking, and multi-tenancy. Injection scopes provide a mechanism to obtain the desired provider lifetime behavior.

#### Provider scope

A provider can have any of the following scopes:

<table>
  <tr>
    <td><code>DEFAULT</code></td>
    <td>A single instance of the provider is shared across the entire application. The instance lifetime is tied directly to the application lifecycle. Once the application has bootstrapped, all singleton providers have been instantiated. Singleton scope is used by default.</td>
  </tr>
  <tr>
    <td><code>REQUEST</code></td>
    <td>A new instance of the provider is created exclusively for each incoming <strong>request</strong>.  The instance is garbage-collected after the request has completed processing.</td>
  </tr>
  <tr>
    <td><code>TRANSIENT</code></td>
    <td>Transient providers are not shared across consumers. Each consumer that injects a transient provider will receive a new, dedicated instance.</td>
  </tr>
</table>

> info **Hint** Using singleton scope is **recommended** for most use cases. Sharing providers across consumers and across requests means that an instance can be cached and its initialization occurs only once, during application startup.

#### Usage

Specify injection scope by passing the `scope` property to the `@Injectable()` decorator options object:

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

Similarly, for [custom providers](/fundamentals/custom-providers), set the `scope` property in the long-hand form for a provider registration:

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

> info **Hint** Import the `Scope` enum from `@nestjs/common`

Singleton scope is used by default and does not need be declared. If you do want to declare a provider as singleton scoped, use the `Scope.DEFAULT` value for the `scope` property.

> warning **Notice** Websocket Gateways should not use request-scoped providers because they must act as singletons. Each gateway encapsulates a real socket and cannot be instantiated multiple times. The limitation also applies to some other providers, like [_Passport strategies_](../security/authentication#request-scoped-strategies) or _Cron controllers_.

#### Controller scope

Controllers can also have scope, which applies to all request method handlers declared in that controller. Like provider scope, the scope of a controller declares its lifetime. For a request-scoped controller, a new instance is created for each inbound request, and garbage-collected when the request has completed processing.

Declare controller scope with the `scope` property of the `ControllerOptions` object:

```typescript
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

#### Scope hierarchy

The `REQUEST` scope bubbles up the injection chain. A controller that depends on a request-scoped provider will, itself, be request-scoped.

Imagine the following dependency graph: `CatsController <- CatsService <- CatsRepository`. If `CatsService` is request-scoped (and the others are default singletons), the `CatsController` will become request-scoped as it is dependent on the injected service. The `CatsRepository`, which is not dependent, would remain singleton-scoped.

Transient-scoped dependencies don't follow that pattern. If a singleton-scoped `DogsService` injects a transient `LoggerService` provider, it will receive a fresh instance of it. However, `DogsService` will stay singleton-scoped, so injecting it anywhere would _not_ resolve to a new instance of `DogsService`. In case it's desired behavior, `DogsService` must be explicitly marked as `TRANSIENT` as well.

<app-banner-courses></app-banner-courses>

#### Request provider

In an HTTP server-based application (e.g., using `@nestjs/platform-express` or `@nestjs/platform-fastify`), you may want to access a reference to the original request object when using request-scoped providers. You can do this by injecting the `REQUEST` object.

The `REQUEST` provider is inherently request-scoped, meaning you don't need to specify the `REQUEST` scope explicitly when using it. Additionally, even if you attempt to do so, it will be disregarded. Any provider that relies on a request-scoped provider automatically adopts a request scope, and this behavior cannot be altered.

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

Because of underlying platform/protocol differences, you access the inbound request slightly differently for Microservice or GraphQL applications. In [GraphQL](/graphql/quick-start) applications, you inject `CONTEXT` instead of `REQUEST`:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

You then configure your `context` value (in the `GraphQLModule`) to contain `request` as its property.

#### Inquirer provider

If you want to get the class where a provider was constructed, for instance in logging or metrics providers, you can inject the `INQUIRER` token.

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

And then use it as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
```

In the example above when `AppService#getRoot` is called, `"AppService: My name is getRoot"` will be logged to the console.

#### Performance

Using request-scoped providers will have an impact on application performance. While Nest tries to cache as much metadata as possible, it will still have to create an instance of your class on each request. Hence, it will slow down your average response time and overall benchmarking result. Unless a provider must be request-scoped, it is strongly recommended that you use the default singleton scope.

> info **Hint** Although it all sounds quite intimidating, a properly designed application that leverages request-scoped providers should not slow down by more than ~5% latency-wise.

#### Durable providers

Request-scoped providers, as mentioned in the section above, may lead to increased latency since having at least 1 request-scoped provider (injected into the controller instance, or deeper - injected into one of its providers) makes the controller request-scoped as well. That means it must be recreated (instantiated) per each individual request (and garbage collected afterward). Now, that also means, that for let's say 30k requests in parallel, there will be 30k ephemeral instances of the controller (and its request-scoped providers).

Having a common provider that most providers depend on (think of a database connection, or a logger service), automatically converts all those providers to request-scoped providers as well. This can pose a challenge in **multi-tenant applications**, especially for those that have a central request-scoped "data source" provider that grabs headers/token from the request object and based on its values, retrieves the corresponding database connection/schema (specific to that tenant).

For instance, let's say you have an application alternately used by 10 different customers. Each customer has its **own dedicated data source**, and you want to make sure customer A will never be able to reach customer B's database. One way to achieve this could be to declare a request-scoped "data source" provider that - based on the request object - determines what's the "current customer" and retrieves its corresponding database. With this approach, you can turn your application into a multi-tenant application in just a few minutes. But, a major downside to this approach is that since most likely a large chunk of your application' components rely on the "data source" provider, they will implicitly become "request-scoped", and therefore you will undoubtedly see an impact in your apps performance.

But what if we had a better solution? Since we only have 10 customers, couldn't we have 10 individual [DI sub-trees](/fundamentals/module-ref#resolving-scoped-providers) per customer (instead of recreating each tree per request)? If your providers don't rely on any property that's truly unique for each consecutive request (e.g., request UUID) but instead there're some specific attributes that let us aggregate (classify) them, there's no reason to _recreate DI sub-tree_ on every incoming request.

And that's exactly when the **durable providers** come in handy.

Before we start flagging providers as durable, we must first register a **strategy** that instructs Nest what are those "common request attributes", provide logic that groups requests - associates them with their corresponding DI sub-trees.

```typescript
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // If tree is not durable, return the original "contextId" object
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
```

> info **Hint** Similar to the request scope, durability bubbles up the injection chain. That means if A depends on B which is flagged as `durable`, A implicitly becomes durable too (unless `durable` is explicitly set to `false` for A provider).

> warning **Warning** Note this strategy is not ideal for applications operating with a large number of tenants.

The value returned from the `attach` method instructs Nest what context identifier should be used for a given host. In this case, we specified that the `tenantSubTreeId` should be used instead of the original, auto-generated `contextId` object, when the host component (e.g., request-scoped controller) is flagged as durable (you can learn how to mark providers as durable below). Also, in the above example, **no payload** would be registered (where payload = `REQUEST`/`CONTEXT` provider that represents the "root" - parent of the sub-tree).

If you want to register the payload for a durable tree, use the following construction instead:

```typescript
// The return of `AggregateByTenantContextIdStrategy#attach` method:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
```

Now whenever you inject the `REQUEST` provider (or `CONTEXT` for GraphQL applications) using the `@Inject(REQUEST)`/`@Inject(CONTEXT)`, the `payload` object would be injected (consisting of a single property - `tenantId` in this case).

Alright so with this strategy in place, you can register it somewhere in your code (as it applies globally anyway), so for example, you could place it in the `main.ts` file:

```typescript
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
```

> info **Hint** The `ContextIdFactory` class is imported from the `@nestjs/core` package.

As long as the registration occurs before any request hits your application, everything will work as intended.

Lastly, to turn a regular provider into a durable provider, simply set the `durable` flag to `true` and change its scope to `Scope.REQUEST` (not needed if the REQUEST scope is in the injection chain already):

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

Similarly, for [custom providers](/fundamentals/custom-providers), set the `durable` property in the long-hand form for a provider registration:

```typescript
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
```


---

## Lifecycle Events

### Lifecycle Events

A Nest application, as well as every application element, has a lifecycle managed by Nest. Nest provides **lifecycle hooks** that give visibility into key lifecycle events, and the ability to act (run registered code on your modules, providers or controllers) when they occur.

#### Lifecycle sequence

The following diagram depicts the sequence of key application lifecycle events, from the time the application is bootstrapped until the node process exits. We can divide the overall lifecycle into three phases: **initializing**, **running** and **terminating**. Using this lifecycle, you can plan for appropriate initialization of modules and services, manage active connections, and gracefully shutdown your application when it receives a termination signal.

<figure><img class="illustrative-image" src="/assets/lifecycle-events.png" /></figure>

#### Lifecycle events

Lifecycle events happen during application bootstrapping and shutdown. Nest calls registered lifecycle hook methods on modules, providers and controllers at each of the following lifecycle events (**shutdown hooks** need to be enabled first, as described [below](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown)). As shown in the diagram above, Nest also calls the appropriate underlying methods to begin listening for connections, and to stop listening for connections.

In the following table, `onModuleInit` and `onApplicationBootstrap` are only triggered if you explicitly call `app.init()` or `app.listen()`.

In the following table, `onModuleDestroy`, `beforeApplicationShutdown` and `onApplicationShutdown` are only triggered if you explicitly call `app.close()` or if the process receives a special system signal (such as SIGTERM) and you have correctly called `enableShutdownHooks` at application bootstrap (see below **Application shutdown** part).

| Lifecycle hook method           | Lifecycle event triggering the hook method call                                                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onModuleInit()`                | Called once the host module's dependencies have been resolved.                                                                                                                                                    |
| `onApplicationBootstrap()`      | Called once all modules have been initialized, but before listening for connections.                                                                                                                              |
| `onModuleDestroy()`\*           | Called after a termination signal (e.g., `SIGTERM`) has been received.                                                                                                                                            |
| `beforeApplicationShutdown()`\* | Called after all `onModuleDestroy()` handlers have completed (Promises resolved or rejected);<br />once complete (Promises resolved or rejected), all existing connections will be closed (`app.close()` called). |
| `onApplicationShutdown()`\*     | Called after connections close (`app.close()` resolves).                                                                                                                                                          |

\* For these events, if you're not calling `app.close()` explicitly, you must opt-in to make them work with system signals such as `SIGTERM`. See [Application shutdown](fundamentals/lifecycle-events#application-shutdown) below.

> warning **Warning** The lifecycle hooks listed above are not triggered for **request-scoped** classes. Request-scoped classes are not tied to the application lifecycle and their lifespan is unpredictable. They are exclusively created for each request and automatically garbage-collected after the response is sent.

> info **Hint** Execution order of `onModuleInit()` and `onApplicationBootstrap()` directly depends on the order of module imports, awaiting the previous hook.

#### Usage

Each lifecycle hook is represented by an interface. Interfaces are technically optional because they do not exist after TypeScript compilation. Nonetheless, it's good practice to use them in order to benefit from strong typing and editor tooling. To register a lifecycle hook, implement the appropriate interface. For example, to register a method to be called during module initialization on a particular class (e.g., Controller, Provider or Module), implement the `OnModuleInit` interface by supplying an `onModuleInit()` method, as shown below:

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

#### Asynchronous initialization

Both the `OnModuleInit` and `OnApplicationBootstrap` hooks allow you to defer the application initialization process (return a `Promise` or mark the method as `async` and `await` an asynchronous method completion in the method body).

```typescript
@@filename()
async onModuleInit(): Promise<void> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```

#### Application shutdown

The `onModuleDestroy()`, `beforeApplicationShutdown()` and `onApplicationShutdown()` hooks are called in the terminating phase (in response to an explicit call to `app.close()` or upon receipt of system signals such as SIGTERM if opted-in). This feature is often used with [Kubernetes](https://kubernetes.io/) to manage containers' lifecycles, by [Heroku](https://www.heroku.com/) for dynos or similar services.

Shutdown hook listeners consume system resources, so they are disabled by default. To use shutdown hooks, you **must enable listeners** by calling `enableShutdownHooks()`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **warning** Due to inherent platform limitations, NestJS has limited support for application shutdown hooks on Windows. You can expect `SIGINT` to work, as well as `SIGBREAK` and to some extent `SIGHUP` - [read more](https://nodejs.org/api/process.html#process_signal_events). However `SIGTERM` will never work on Windows because killing a process in the task manager is unconditional, "i.e., there's no way for an application to detect or prevent it". Here's some [relevant documentation](https://docs.libuv.org/en/v1.x/signal.html) from libuv to learn more about how `SIGINT`, `SIGBREAK` and others are handled on Windows. Also, see Node.js documentation of [Process Signal Events](https://nodejs.org/api/process.html#process_signal_events)

> info **Info** `enableShutdownHooks` consumes memory by starting listeners. In cases where you are running multiple Nest apps in a single Node process (e.g., when running parallel tests with Jest), Node may complain about excessive listener processes. For this reason, `enableShutdownHooks` is not enabled by default. Be aware of this condition when you are running multiple instances in a single Node process.

When the application receives a termination signal it will call any registered `onModuleDestroy()`, `beforeApplicationShutdown()`, then `onApplicationShutdown()` methods (in the sequence described above) with the corresponding signal as the first parameter. If a registered function awaits an asynchronous call (returns a promise), Nest will not continue in the sequence until the promise is resolved or rejected.

```typescript
@@filename()
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
  }
}
@@switch
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // e.g. "SIGINT"
  }
}
```

> info **Info** Calling `app.close()` doesn't terminate the Node process but only triggers the `onModuleDestroy()` and `onApplicationShutdown()` hooks, so if there are some intervals, long-running background tasks, etc. the process won't be automatically terminated.


---

## Logger

### Logger

Nest comes with a built-in text-based logger which is used during application bootstrapping and several other circumstances such as displaying caught exceptions (i.e., system logging). This functionality is provided via the `Logger` class in the `@nestjs/common` package. You can fully control the behavior of the logging system, including any of the following:

- disable logging entirely
- specify the log level of detail (e.g., display errors, warnings, debug information, etc.)
- configure formatting of log messages (raw, json, colorized, etc.)
- override timestamp in the default logger (e.g., use ISO8601 standard as date format)
- completely override the default logger
- customize the default logger by extending it
- make use of dependency injection to simplify composing and testing your application

You can also make use of the built-in logger, or create your own custom implementation, to log your own application-level events and messages.

If your application requires integration with external logging systems, automatic file-based logging, or forwarding logs to a centralized logging service, you can implement a fully custom logging solution using a Node.js logging library. One popular choice is [Pino](https://github.com/pinojs/pino), known for its high performance and flexibility.

#### Basic customization

To disable logging, set the `logger` property to `false` in the (optional) Nest application options object passed as the second argument to the `NestFactory.create()` method.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(process.env.PORT ?? 3000);
```

To enable specific logging levels, set the `logger` property to an array of strings specifying the log levels to display, as follows:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(process.env.PORT ?? 3000);
```

Values in the array can be any combination of `'log'`, `'fatal'`, `'error'`, `'warn'`, `'debug'`, and `'verbose'`.

To disable colorized output, pass the `ConsoleLogger` object with the `colors` property set to `false` as the value of the `logger` property.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    colors: false,
  }),
});
```

To configure a prefix for each log message, pass the `ConsoleLogger` object with the `prefix` attribute set:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    prefix: 'MyApp', // Default is "Nest"
  }),
});
```

Here are all the available options listed in the table below:

| Option            | Description                                                                                                                                                                                                                                                                                                                                          | Default                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `logLevels`       | Enabled log levels.                                                                                                                                                                                                                                                                                                                                  | `['log', 'fatal', 'error', 'warn', 'debug', 'verbose']` |
| `timestamp`       | If enabled, will print timestamp (time difference) between current and previous log message. Note: This option is not used when `json` is enabled.                                                                                                                                                                                                   | `false`                                        |
| `prefix`          | A prefix to be used for each log message. Note: This option is not used when `json` is enabled.                                                                                                                                                                                                                                                      | `Nest`                                         |
| `json`            | If enabled, will print the log message in JSON format.                                                                                                                                                                                                                                                                                               | `false`                                        |
| `colors`          | If enabled, will print the log message in color. Default true if json is disabled, false otherwise.                                                                                                                                                                                                                                                  | `true`                                         |
| `context`         | The context of the logger.                                                                                                                                                                                                                                                                                                                           | `undefined`                                    |
| `compact`         | If enabled, will print the log message in a single line, even if it is an object with multiple properties. If set to a number, the most n inner elements are united on a single line as long as all properties fit into breakLength. Short array elements are also grouped together.                                                                 | `true`                                         |
| `maxArrayLength`  | Specifies the maximum number of Array, TypedArray, Map, Set, WeakMap, and WeakSet elements to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no elements. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.             | `100`                                          |
| `maxStringLength` | Specifies the maximum number of characters to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no characters. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                                           | `10000`                                        |
| `sorted`          | If enabled, will sort keys while formatting objects. Can also be a custom sorting function. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                                                                                                                | `false`                                        |
| `depth`           | Specifies the number of times to recurse while formatting object. This is useful for inspecting large objects. To recurse up to the maximum call stack size pass Infinity or null. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                         | `5`                                            |
| `showHidden`      | If true, object's non-enumerable symbols and properties are included in the formatted result. WeakMap and WeakSet entries are also included as well as user defined prototype properties                                                                                                                                                             | `false`                                        |
| `breakLength`     | The length at which input values are split across multiple lines. Set to Infinity to format the input as a single line (in combination with "compact" set to true). Default Infinity when "compact" is true, 80 otherwise. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output. | `Infinity`                                     |

#### JSON logging

JSON logging is essential for modern application observability and integration with log management systems. To enable JSON logging in your NestJS application, configure the `ConsoleLogger` object with its `json` property set to `true`. Then, provide this logger configuration as the value for the `logger` property when creating the application instance.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    json: true,
  }),
});
```

This configuration outputs logs in a structured JSON format, making it easier to integrate with external systems such as log aggregators and cloud platforms. For example, platforms like **AWS ECS** (Elastic Container Service) natively support JSON logs, enabling advanced features like:

- **Log Filtering**: Easily narrow down logs based on fields like log level, timestamp, or custom metadata.
- **Search and Analysis**: Use query tools to analyze and track trends in your application's behavior.

Additionally, if you're using [NestJS Mau](https://mau.nestjs.com), JSON logging simplifies the process of viewing logs in a well-organized, structured format, which is especially useful for debugging and performance monitoring.

> info **Note** When `json` is set to `true`, the `ConsoleLogger` automatically disables text colorization by setting the `colors` property to `false`. This ensures that the output remains valid JSON, free of formatting artifacts. However, for development purposes, you can override this behavior by explicitly setting `colors` to `true`. This adds colorized JSON logs, which can make log entries more readable during local debugging.

When JSON logging is enabled, the log output will look like this (in a single line):

```json
{
  "level": "log",
  "pid": 19096,
  "timestamp": 1607370779834,
  "message": "Starting Nest application...",
  "context": "NestFactory"
}
```

You can see different variants in this [Pull Request](https://github.com/nestjs/nest/pull/14121).

#### Using the logger for application logging

We can combine several of the techniques above to provide consistent behavior and formatting across both Nest system logging and our own application event/message logging.

A good practice is to instantiate `Logger` class from `@nestjs/common` in each of our services. We can supply our service name as the `context` argument in the `Logger` constructor, like so:

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something...');
  }
}
```

In the default logger implementation, `context` is printed in the square brackets, like `NestFactory` in the example below:

```bash
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
```

If we supply a custom logger via `app.useLogger()`, it will actually be used by Nest internally. That means that our code remains implementation agnostic, while we can easily substitute the default logger for our custom one by calling `app.useLogger()`.

That way if we follow the steps from the previous section and call `app.useLogger(app.get(MyLogger))`, the following calls to `this.logger.log()` from `MyService` would result in calls to method `log` from `MyLogger` instance.

This should be suitable for most cases. But if you need more customization (like adding and calling custom methods), move to the next section.

#### Logs with timestamps

To enable timestamp logging for every logged message, you can use the optional `timestamp: true` setting when creating the logger instance.

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name, { timestamp: true });

  doSomething() {
    this.logger.log('Doing something with timestamp here ->');
  }
}
```

This will produce output in the following format:

```bash
[Nest] 19096   - 04/19/2024, 7:12:59 AM   [MyService] Doing something with timestamp here +5ms
```

Note the `+5ms` at the end of the line. For each log statement, the time difference from the previous message is calculated and displayed at the end of the line.

#### Custom implementation

You can provide a custom logger implementation to be used by Nest for system logging by setting the value of the `logger` property to an object that fulfills the `LoggerService` interface. For example, you can tell Nest to use the built-in global JavaScript `console` object (which implements the `LoggerService` interface), as follows:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(process.env.PORT ?? 3000);
```

Implementing your own custom logger is straightforward. Simply implement each of the methods of the `LoggerService` interface as shown below.

```typescript
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, ...optionalParams: any[]) {}

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

You can then supply an instance of `MyLogger` via the `logger` property of the Nest application options object.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(process.env.PORT ?? 3000);
```

This technique, while simple, doesn't utilize dependency injection for the `MyLogger` class. This can pose some challenges, particularly for testing, and limit the reusability of `MyLogger`. For a better solution, see the <a href="techniques/logger#dependency-injection">Dependency Injection</a> section below.

#### Extend built-in logger

Rather than writing a logger from scratch, you may be able to meet your needs by extending the built-in `ConsoleLogger` class and overriding selected behavior of the default implementation.

```typescript
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // add your tailored logic here
    super.error(...arguments);
  }
}
```

You can use such an extended logger in your feature modules as described in the <a href="techniques/logger#using-the-logger-for-application-logging">Using the logger for application logging</a> section below.

You can tell Nest to use your extended logger for system logging by passing an instance of it via the `logger` property of the application options object (as shown in the <a href="techniques/logger#custom-logger-implementation">Custom implementation</a> section above), or by using the technique shown in the <a href="techniques/logger#dependency-injection">Dependency Injection</a> section below. If you do so, you should take care to call `super`, as shown in the sample code above, to delegate the specific log method call to the parent (built-in) class so that Nest can rely on the built-in features it expects.

<app-banner-courses></app-banner-courses>

#### Dependency injection

For more advanced logging functionality, you'll want to take advantage of dependency injection. For example, you may want to inject a `ConfigService` into your logger to customize it, and in turn inject your custom logger into other controllers and/or providers. To enable dependency injection for your custom logger, create a class that implements `LoggerService` and register that class as a provider in some module. For example, you can

1. Define a `MyLogger` class that either extends the built-in `ConsoleLogger` or completely overrides it, as shown in previous sections. Be sure to implement the `LoggerService` interface.
2. Create a `LoggerModule` as shown below, and provide `MyLogger` from that module.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

With this construct, you are now providing your custom logger for use by any other module. Because your `MyLogger` class is part of a module, it can use dependency injection (for example, to inject a `ConfigService`). There's one more technique needed to provide this custom logger for use by Nest for system logging (e.g., for bootstrapping and error handling).

Because application instantiation (`NestFactory.create()`) happens outside the context of any module, it doesn't participate in the normal Dependency Injection phase of initialization. So we must ensure that at least one application module imports the `LoggerModule` to trigger Nest to instantiate a singleton instance of our `MyLogger` class.

We can then instruct Nest to use the same singleton instance of `MyLogger` with the following construction:

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(process.env.PORT ?? 3000);
```

> info **Note** In the example above, we set the `bufferLogs` to `true` to make sure all logs will be buffered until a custom logger is attached (`MyLogger` in this case) and the application initialisation process either completes or fails. If the initialisation process fails, Nest will fallback to the original `ConsoleLogger` to print out any reported error messages. Also, you can set the `autoFlushLogs` to `false` (default `true`) to manually flush logs (using the `Logger.flush()` method).

Here we use the `get()` method on the `NestApplication` instance to retrieve the singleton instance of the `MyLogger` object. This technique is essentially a way to "inject" an instance of a logger for use by Nest. The `app.get()` call retrieves the singleton instance of `MyLogger`, and depends on that instance being first injected in another module, as described above.

You can also inject this `MyLogger` provider in your feature classes, thus ensuring consistent logging behavior across both Nest system logging and application logging. See <a href="techniques/logger#using-the-logger-for-application-logging">Using the logger for application logging</a> and <a href="techniques/logger#injecting-a-custom-logger">Injecting a custom logger</a> below for more information.

#### Injecting a custom logger

To start, extend the built-in logger with code like the following. We supply the `scope` option as configuration metadata for the `ConsoleLogger` class, specifying a [transient](/fundamentals/injection-scopes) scope, to ensure that we'll have a unique instance of the `MyLogger` in each feature module. In this example, we do not extend the individual `ConsoleLogger` methods (like `log()`, `warn()`, etc.), though you may choose to do so.

```typescript
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
```

Next, create a `LoggerModule` with a construction like this:

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Next, import the `LoggerModule` into your feature module. Since we extended default `Logger` we have the convenience of using `setContext` method. So we can start using the context-aware custom logger, like this:

```typescript
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // Due to transient scope, CatsService has its own unique instance of MyLogger,
    // so setting context here will not affect other instances in other services
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // You can call all the default methods
    this.myLogger.warn('About to return cats!');
    // And your custom methods
    this.myLogger.customLog();
    return this.cats;
  }
}
```

Finally, instruct Nest to use an instance of the custom logger in your `main.ts` file as shown below. Of course in this example, we haven't actually customized the logger behavior (by extending the `Logger` methods like `log()`, `warn()`, etc.), so this step isn't actually needed. But it **would** be needed if you added custom logic to those methods and wanted Nest to use the same implementation.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(process.env.PORT ?? 3000);
```

> info **Hint** Alternatively, instead of setting `bufferLogs` to `true`, you could temporarily disable the logger with `logger: false` instruction. Be mindful that if you supply `logger: false` to `NestFactory.create`, nothing will be logged until you call `useLogger`, so you may miss some important initialization errors. If you don't mind that some of your initial messages will be logged with the default logger, you can just omit the `logger: false` option.

#### Use external logger

Production applications often have specific logging requirements, including advanced filtering, formatting and centralized logging. Nest's built-in logger is used for monitoring Nest system behavior, and can also be useful for basic formatted text logging in your feature modules while in development, but production applications often take advantage of dedicated logging modules like [Winston](https://github.com/winstonjs/winston). As with any standard Node.js application, you can take full advantage of such modules in Nest.


---

## Model-View-Controller

### Model-View-Controller

Nest, by default, makes use of the [Express](https://github.com/expressjs/express) library under the hood. Hence, every technique for using the MVC (Model-View-Controller) pattern in Express applies to Nest as well.

First, let's scaffold a simple Nest application using the [CLI](https://github.com/nestjs/nest-cli) tool:

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

In order to create an MVC app, we also need a [template engine](https://expressjs.com/en/guide/using-template-engines.html) to render our HTML views:

```bash
$ npm install --save hbs
```

We've used the `hbs` ([Handlebars](https://github.com/pillarjs/hbs#readme)) engine, though you can use whatever fits your requirements. Once the installation process is complete, we need to configure the express instance using the following code:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

We told [Express](https://github.com/expressjs/express) that the `public` directory will be used for storing static assets, `views` will contain templates, and the `hbs` template engine should be used to render HTML output.

#### Template rendering

Now, let's create a `views` directory and `index.hbs` template inside it. In the template, we'll print a `message` passed from the controller:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ "{{ message }\}" }}
  </body>
</html>
```

Next, open the `app.controller` file and replace the `root()` method with the following code:

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
```

In this code, we are specifying the template to use in the `@Render()` decorator, and the return value of the route handler method is passed to the template for rendering. Notice that the return value is an object with a property `message`, matching the `message` placeholder we created in the template.

While the application is running, open your browser and navigate to `http://localhost:3000`. You should see the `Hello world!` message.

#### Dynamic template rendering

If the application logic must dynamically decide which template to render, then we should use the `@Res()` decorator, and supply the view name in our route handler, rather than in the `@Render()` decorator:

> info **Hint** When Nest detects the `@Res()` decorator, it injects the library-specific `response` object. We can use this object to dynamically render the template. Learn more about the `response` object API [here](https://expressjs.com/en/api.html).

```typescript
@@filename(app.controller)
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/15-mvc).

#### Fastify

As mentioned in this [chapter](/techniques/performance), we are able to use any compatible HTTP provider together with Nest. One such library is [Fastify](https://github.com/fastify/fastify). In order to create an MVC application with Fastify, we have to install the following packages:

```bash
$ npm i --save @fastify/static @fastify/view handlebars
```

The next steps cover almost the same process used with Express, with minor differences specific to the platform. Once the installation process is complete, open the `main.ts` file and update its contents:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

The Fastify API has a few differences, but the end result of these method calls is the same. One notable difference is that when using Fastify, the template name you pass into the `@Render()` decorator must include the file extension.

Here’s how you can set it up:

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
```

Alternatively, you can use the `@Res()` decorator to directly inject the response and specify the view you want to render, as shown below:

```typescript
import { Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Get()
root(@Res() res: FastifyReply) {
  return res.view('index.hbs', { title: 'Hello world!' });
}
```

While the application is running, open your browser and navigate to `http://localhost:3000`. You should see the `Hello world!` message.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify).


---

## Mongo

### Mongo

Nest supports two methods for integrating with the [MongoDB](https://www.mongodb.com/) database. You can either use the built-in [TypeORM](https://github.com/typeorm/typeorm) module described [here](/techniques/database), which has a connector for MongoDB, or use [Mongoose](https://mongoosejs.com), the most popular MongoDB object modeling tool. In this chapter we'll describe the latter, using the dedicated `@nestjs/mongoose` package.

Start by installing the [required dependencies](https://github.com/Automattic/mongoose):

```bash
$ npm i @nestjs/mongoose mongoose
```

Once the installation process is complete, we can import the `MongooseModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `mongoose.connect()` from the Mongoose package, as described [here](https://mongoosejs.com/docs/connections.html).

#### Model injection

With Mongoose, everything is derived from a [Schema](http://mongoosejs.com/docs/guide.html). Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. Schemas are used to define [Models](https://mongoosejs.com/docs/models.html). Models are responsible for creating and reading documents from the underlying MongoDB database.

Schemas can be created with NestJS decorators, or with Mongoose itself manually. Using decorators to create schemas greatly reduces boilerplate and improves overall code readability.

Let's define the `CatSchema`:

```typescript
@@filename(schemas/cat.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

> info **Hint** Note you can also generate a raw schema definition using the `DefinitionsFactory` class (from the `nestjs/mongoose`). This allows you to manually modify the schema definition generated based on the metadata you provided. This is useful for certain edge-cases where it may be hard to represent everything with decorators.

The `@Schema()` decorator marks a class as a schema definition. It maps our `Cat` class to a MongoDB collection of the same name, but with an additional “s” at the end - so the final mongo collection name will be `cats`. This decorator accepts a single optional argument which is a schema options object. Think of it as the object you would normally pass as a second argument of the `mongoose.Schema` class' constructor (e.g., `new mongoose.Schema(_, options)`)). To learn more about available schema options, see [this](https://mongoosejs.com/docs/guide.html#options) chapter.

The `@Prop()` decorator defines a property in the document. For example, in the schema definition above, we defined three properties: `name`, `age`, and `breed`. The [schema types](https://mongoosejs.com/docs/schematypes.html) for these properties are automatically inferred thanks to TypeScript metadata (and reflection) capabilities. However, in more complex scenarios in which types cannot be implicitly reflected (for example, arrays or nested object structures), types must be indicated explicitly, as follows:

```typescript
@Prop([String])
tags: string[];
```

Alternatively, the `@Prop()` decorator accepts an options object argument ([read more](https://mongoosejs.com/docs/schematypes.html#schematype-options) about the available options). With this, you can indicate whether a property is required or not, specify a default value, or mark it as immutable. For example:

```typescript
@Prop({ required: true })
name: string;
```

In case you want to specify relation to another model, later for populating, you can use `@Prop()` decorator as well. For example, if `Cat` has `Owner` which is stored in a different collection called `owners`, the property should have type and ref. For example:

```typescript
import * as mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema';

// inside the class definition
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
```

In case there are multiple owners, your property configuration should look as follows:

```typescript
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
```

If you don’t intend to always populate a reference to another collection, consider using `mongoose.Types.ObjectId` as the type instead:

```typescript
@Prop({ type: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' } })
// This ensures the field is not confused with a populated reference
owner: mongoose.Types.ObjectId;
```

Then, when you need to selectively populate it later, you can use a repository function that specifies the correct type:

```typescript
import { Owner } from './schemas/owner.schema';

// e.g. inside a service or repository
async findAllPopulated() {
  return this.catModel.find().populate<{ owner: Owner }>("owner");
}
```

> info **Hint** If there is no foreign document to populate, the type could be `Owner | null`, depending on your [Mongoose configuration](https://mongoosejs.com/docs/populate.html#doc-not-found). Alternatively, it might throw an error, in which case the type will be `Owner`.

Finally, the **raw** schema definition can also be passed to the decorator. This is useful when, for example, a property represents a nested object which is not defined as a class. For this, use the `raw()` function from the `@nestjs/mongoose` package, as follows:

```typescript
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
```

Alternatively, if you prefer **not using decorators**, you can define a schema manually. For example:

```typescript
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

The `cat.schema` file resides in a folder in the `cats` directory, where we also define the `CatsModule`. While you can store schema files wherever you prefer, we recommend storing them near their related **domain** objects, in the appropriate module directory.

Let's look at the `CatsModule`:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

The `MongooseModule` provides the `forFeature()` method to configure the module, including defining which models should be registered in the current scope. If you also want to use the models in another module, add MongooseModule to the `exports` section of `CatsModule` and import `CatsModule` in the other module.

Once you've registered the schema, you can inject a `Cat` model into the `CatsService` using the `@InjectModel()` decorator:

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';

@Injectable()
@Dependencies(getModelToken(Cat.name))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

#### Connection

At times you may need to access the native [Mongoose Connection](https://mongoosejs.com/docs/api.html#Connection) object. For example, you may want to make native API calls on the connection object. You can inject the Mongoose Connection by using the `@InjectConnection()` decorator as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
```

#### Sessions

To start a session with Mongoose, it's recommended to inject the database connection using `@InjectConnection` rather than calling `mongoose.startSession()` directly. This approach allows better integration with the NestJS dependency injection system, ensuring proper connection management.

Here's an example of how to start a session:

```typescript
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    // Your transaction logic here
  }
}
```

In this example, `@InjectConnection()` is used to inject the Mongoose connection into the service. Once the connection is injected, you can use `connection.startSession()` to begin a new session. This session can be used to manage database transactions, ensuring atomic operations across multiple queries. After starting the session, remember to commit or abort the transaction based on your logic.

#### Multiple databases

Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, connection naming becomes **mandatory**.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.

With this setup, you have to tell the `MongooseModule.forFeature()` function which connection should be used.

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats'),
  ],
})
export class CatsModule {}
```

You can also inject the `Connection` for a given connection:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
```

To inject a given `Connection` to a custom provider (for example, factory provider), use the `getConnectionToken()` function passing the name of the connection as an argument.

```typescript
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
```

If you are just looking to inject the model from a named database, you can use the connection name as a second parameter to the `@InjectModel()` decorator.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
@@switch
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
```

#### Hooks (middleware)

Middleware (also called pre and post hooks) are functions which are passed control during execution of asynchronous functions. Middleware is specified on the schema level and is useful for writing plugins ([source](https://mongoosejs.com/docs/middleware.html)). Calling `pre()` or `post()` after compiling a model does not work in Mongoose. To register a hook **before** model registration, use the `forFeatureAsync()` method of the `MongooseModule` along with a factory provider (i.e., `useFactory`). With this technique, you can access a schema object, then use the `pre()` or `post()` method to register a hook on that schema. See example below:

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.pre('save', function () {
            console.log('Hello from pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Like other [factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory), our factory function can be `async` and can inject dependencies through `inject`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatsSchema;
          schema.pre('save', function() {
            console.log(
              `${configService.get('APP_NAME')}: Hello from pre save`,
            ),
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

#### Plugins

To register a [plugin](https://mongoosejs.com/docs/plugins.html) for a given schema, use the `forFeatureAsync()` method.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.plugin(require('mongoose-autopopulate'));
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

To register a plugin for all schemas at once, call the `.plugin()` method of the `Connection` object. You should access the connection before models are created; to do this, use the `connectionFactory`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
  ],
})
export class AppModule {}
```

#### Discriminators

[Discriminators](https://mongoosejs.com/docs/discriminators.html) are a schema inheritance mechanism. They enable you to have multiple models with overlapping schemas on top of the same underlying MongoDB collection.

Suppose you wanted to track different types of events in a single collection. Every event will have a timestamp.

```typescript
@@filename(event.schema)
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
```

> info **Hint** The way mongoose tells the difference between the different discriminator models is by the "discriminator key", which is `__t` by default. Mongoose adds a String path called `__t` to your schemas that it uses to track which discriminator this document is an instance of.
> You may also use the `discriminatorKey` option to define the path for discrimination.

`SignedUpEvent` and `ClickedLinkEvent` instances will be stored in the same collection as generic events.

Now, let's define the `ClickedLinkEvent` class, as follows:

```typescript
@@filename(click-link-event.schema)
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
```

And `SignUpEvent` class:

```typescript
@@filename(sign-up-event.schema)
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
```

With this in place, use the `discriminators` option to register a discriminator for a given schema. It works on both `MongooseModule.forFeature` and `MongooseModule.forFeatureAsync`:

```typescript
@@filename(event.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
```

#### Testing

When unit testing an application, we usually want to avoid any database connection, making our test suites simpler to set up and faster to execute. But our classes might depend on models that are pulled from the connection instance. How do we resolve these classes? The solution is to create mock models.

To make this easier, the `@nestjs/mongoose` package exposes a `getModelToken()` function that returns a prepared [injection token](https://docs.nestjs.com/fundamentals/custom-providers#di-fundamentals) based on a token name. Using this token, you can easily provide a mock implementation using any of the standard [custom provider](/fundamentals/custom-providers) techniques, including `useClass`, `useValue`, and `useFactory`. For example:

```typescript
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

In this example, a hardcoded `catModel` (object instance) will be provided whenever any consumer injects a `Model<Cat>` using an `@InjectModel()` decorator.

<app-banner-courses></app-banner-courses>

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `forRootAsync()` method. As with most dynamic modules, Nest provides several techniques to deal with async configuration.

One technique is to use a factory function:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

Like other [factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory), our factory function can be `async` and can inject dependencies through `inject`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `MongooseModule` using a class instead of a factory, as shown below:

```typescript
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

The construction above instantiates `MongooseConfigService` inside `MongooseModule`, using it to create the required options object. Note that in this example, the `MongooseConfigService` has to implement the `MongooseOptionsFactory` interface, as shown below. The `MongooseModule` will call the `createMongooseOptions()` method on the instantiated object of the supplied class.

```typescript
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

If you want to reuse an existing options provider instead of creating a private copy inside the `MongooseModule`, use the `useExisting` syntax.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### Connection events

You can listen to Mongoose [connection events](https://mongoosejs.com/docs/connections.html#connection-events) by using the `onConnectionCreate` configuration option. This allows you to implement custom logic whenever a connection is established. For instance, you can register event listeners for the `connected`, `open`, `disconnected`, `reconnected`, and `disconnecting` events, as demonstrated below:

```typescript
MongooseModule.forRoot('mongodb://localhost/test', {
  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => console.log('connected'));
    connection.on('open', () => console.log('open'));
    connection.on('disconnected', () => console.log('disconnected'));
    connection.on('reconnected', () => console.log('reconnected'));
    connection.on('disconnecting', () => console.log('disconnecting'));

    return connection;
  },
}),
```

In this code snippet, we are establishing a connection to a MongoDB database at `mongodb://localhost/test`. The `onConnectionCreate` option enables you to set up specific event listeners for monitoring the connection's status:

- `connected`: Triggered when the connection is successfully established.
- `open`: Fires when the connection is fully opened and ready for operations.
- `disconnected`: Called when the connection is lost.
- `reconnected`: Invoked when the connection is re-established after being disconnected.
- `disconnecting`: Occurs when the connection is in the process of closing.

You can also incorporate the `onConnectionCreate` property into async configurations created with `MongooseModule.forRootAsync()`:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/test',
    onConnectionCreate: (connection: Connection) => {
      // Register event listeners here
      return connection;
    },
  }),
}),
```

This provides a flexible way to manage connection events, enabling you to handle changes in connection status effectively.

#### Subdocuments

To nest subdocuments within a parent document, you can define your schemas as follows:

```typescript
@@filename(name.schema)
@Schema()
export class Name {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name);
```

And then reference the subdocument in the parent schema:

```typescript
@@filename(person.schema)
@Schema()
export class Person {
  @Prop(NameSchema)
  name: Name;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.Subdocument<Types.ObjectId> & Name;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

If you want to include multiple subdocuments, you can use an array of subdocuments. It's important to override the type of the property accordingly:

```typescript
@@filename(name.schema)
@Schema()
export class Person {
  @Prop([NameSchema])
  name: Name[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.DocumentArray<Name>;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

#### Virtuals

In Mongoose, a **virtual** is a property that exists on a document but is not persisted to MongoDB. It is not stored in the database but is computed dynamically whenever it's accessed. Virtuals are typically used for derived or computed values, like combining fields (e.g., creating a `fullName` property by concatenating `firstName` and `lastName`), or for creating properties that rely on existing data in the document.

```ts
class Person {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: Person) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullName: string;
}
```

> info **Hint** The `@Virtual()` decorator is imported from the `@nestjs/mongoose` package.

In this example, the `fullName` virtual is derived from `firstName` and `lastName`. Even though it behaves like a normal property when accessed, it’s never saved to the MongoDB document.:

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/06-mongoose).


---

## MongoDB (Mongoose)

### MongoDB (Mongoose)

> **Warning** In this article, you'll learn how to create a `DatabaseModule` based on the **Mongoose** package from scratch using custom components. As a consequence, this solution contains a lot of overhead that you can omit using ready to use and available out-of-the-box dedicated `@nestjs/mongoose` package. To learn more, see [here](/techniques/mongodb).

[Mongoose](https://mongoosejs.com) is the most popular [MongoDB](https://www.mongodb.org/) object modeling tool.

#### Getting started

To start the adventure with this library we have to install all required dependencies:

```typescript
$ npm install --save mongoose
```

The first step we need to do is to establish the connection with our database using `connect()` function. The `connect()` function returns a `Promise`, and therefore we have to create an [async provider](/fundamentals/async-components).

```typescript
@@filename(database.providers)
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb://localhost/nest'),
  },
];
@@switch
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: () => mongoose.connect('mongodb://localhost/nest'),
  },
];
```

> info **Hint** Following best practices, we declared the custom provider in the separated file which has a `*.providers.ts` suffix.

Then, we need to export these providers to make them **accessible** for the rest part of the application.

```typescript
@@filename(database.module)
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Now we can inject the `Connection` object using `@Inject()` decorator. Each class that would depend on the `Connection` async provider will wait until a `Promise` is resolved.

#### Model injection

With Mongoose, everything is derived from a [Schema](https://mongoosejs.com/docs/guide.html). Let's define the `CatSchema`:

```typescript
@@filename(schemas/cat.schema)
import * as mongoose from 'mongoose';

export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

The `CatsSchema` belongs to the `cats` directory. This directory represents the `CatsModule`.

Now it's time to create a **Model** provider:

```typescript
@@filename(cats.providers)
import { Connection } from 'mongoose';
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection: Connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
@@switch
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
```

> warning **Warning** In the real-world applications you should avoid **magic strings**. Both `CAT_MODEL` and `DATABASE_CONNECTION` should be kept in the separated `constants.ts` file.

Now we can inject the `CAT_MODEL` to the `CatsService` using the `@Inject()` decorator:

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CAT_MODEL')
    private catModel: Model<Cat>,
  ) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('CAT_MODEL')
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

In the above example we have used the `Cat` interface. This interface extends the `Document` from the mongoose package:

```typescript
import { Document } from 'mongoose';

export interface Cat extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

The database connection is **asynchronous**, but Nest makes this process completely invisible for the end-user. The `CatModel` class is waiting for the db connection, and the `CatsService` is delayed until model is ready to use. The entire application can start when each class is instantiated.

Here is a final `CatsModule`:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
```

> info **Hint** Do not forget to import the `CatsModule` into the root `AppModule`.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/14-mongoose-base).

---

## Performance (Fastify)

### Performance (Fastify)

By default, Nest makes use of the [Express](https://expressjs.com/) framework. As mentioned earlier, Nest also provides compatibility with other libraries such as, for example, [Fastify](https://github.com/fastify/fastify). Nest achieves this framework independence by implementing a framework adapter whose primary function is to proxy middleware and handlers to appropriate library-specific implementations.

> info **Hint** Note that in order for a framework adapter to be implemented, the target library has to provide similar request/response pipeline processing as found in Express.

[Fastify](https://github.com/fastify/fastify) provides a good alternative framework for Nest because it solves design issues in a similar manner to Express. However, fastify is much **faster** than Express, achieving almost two times better benchmarks results. A fair question is why does Nest use Express as the default HTTP provider? The reason is that Express is widely-used, well-known, and has an enormous set of compatible middleware, which is available to Nest users out-of-the-box.

But since Nest provides framework-independence, you can easily migrate between them. Fastify can be a better choice when you place high value on very fast performance. To utilize Fastify, simply choose the built-in `FastifyAdapter` as shown in this chapter.

#### Installation

First, we need to install the required package:

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Adapter

Once the Fastify platform is installed, we can use the `FastifyAdapter`.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

By default, Fastify listens only on the `localhost 127.0.0.1` interface ([read more](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)). If you want to accept connections on other hosts, you should specify `'0.0.0.0'` in the `listen()` call:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
```

#### Platform specific packages

Keep in mind that when you use the `FastifyAdapter`, Nest uses Fastify as the **HTTP provider**. This means that each recipe that relies on Express may no longer work. You should, instead, use Fastify equivalent packages.

#### Redirect response

Fastify handles redirect responses slightly differently than Express. To do a proper redirect with Fastify, return both the status code and the URL, as follows:

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Fastify options

You can pass options into the Fastify constructor through the `FastifyAdapter` constructor. For example:

```typescript
new FastifyAdapter({ logger: true });
```

#### Middleware

Middleware functions retrieve the raw `req` and `res` objects instead of Fastify's wrappers. This is how the `middie` package works (that's used under the hood) and `fastify` - check out this [page](https://www.fastify.io/docs/latest/Reference/Middleware/) for more information,

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

#### Route Config

You can use the [route config](https://fastify.dev/docs/latest/Reference/Routes/#config) feature of Fastify with the `@RouteConfig()` decorator.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

#### Route Constraints

As of v10.3.0, `@nestjs/platform-fastify` supports [route constraints](https://fastify.dev/docs/latest/Reference/Routes/#constraints) feature of Fastify with `@RouteConstraints` decorator.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **Hint** `@RouteConfig()` and `@RouteConstraints` are imported from `@nestjs/platform-fastify`.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/10-fastify).


---

## Queues

### Queues

Queues are a powerful design pattern that help you deal with common application scaling and performance challenges. Some examples of problems that Queues can help you solve are:

- Smooth out processing peaks. For example, if users can initiate resource-intensive tasks at arbitrary times, you can add these tasks to a queue instead of performing them synchronously. Then you can have worker processes pull tasks from the queue in a controlled manner. You can easily add new Queue consumers to scale up the back-end task handling as the application scales up.
- Break up monolithic tasks that may otherwise block the Node.js event loop. For example, if a user request requires CPU intensive work like audio transcoding, you can delegate this task to other processes, freeing up user-facing processes to remain responsive.
- Provide a reliable communication channel across various services. For example, you can queue tasks (jobs) in one process or service, and consume them in another. You can be notified (by listening for status events) upon completion, error or other state changes in the job life cycle from any process or service. When Queue producers or consumers fail, their state is preserved and task handling can restart automatically when nodes are restarted.

Nest provides the `@nestjs/bullmq` package for BullMQ integration and `@nestjs/bull` package for Bull integration. Both packages are abstractions/wrappers on top of their respective libraries, which were developed by the same team. Bull is currently in maintenance mode, with the team focusing on fixing bugs, while BullMQ is actively developed, featuring a modern TypeScript implementation and a different set of features. If Bull meets your requirements, it remains a reliable and battle-tested choice. The Nest packages make it easy to integrate both, BullMQ or Bull Queues, into your Nest application in a friendly way.

Both BullMQ and Bull use [Redis](https://redis.io/) to persist job data, so you'll need to have Redis installed on your system. Because they are Redis-backed, your Queue architecture can be completely distributed and platform-independent. For example, you can have some Queue <a href="techniques/queues#producers">producers</a> and <a href="techniques/queues#consumers">consumers</a> and <a href="techniques/queues#event-listeners">listeners</a> running in Nest on one (or several) nodes, and other producers, consumers and listeners running on other Node.js platforms on other network nodes.

This chapter covers the `@nestjs/bullmq` and `@nestjs/bull` packages. We also recommend reading the [BullMQ](https://docs.bullmq.io/) and [Bull](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md) documentation for more background and specific implementation details.

#### BullMQ installation

To begin using BullMQ, we first install the required dependencies.

```bash
$ npm install --save @nestjs/bullmq bullmq
```

Once the installation process is complete, we can import the `BullModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

The `forRoot()` method is used to register a `bullmq` package configuration object that will be used by all queues registered in the application (unless specified otherwise). For your reference, the following are a few of the properties within a configuration object:

- `connection: ConnectionOptions` - Options to configure the Redis connection. See [Connections](https://docs.bullmq.io/guide/connections) for more information. Optional.
- `prefix: string` - Prefix for all queue keys. Optional.
- `defaultJobOptions: JobOpts` - Options to control the default settings for new jobs. See [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) for more information. Optional.
- `settings: AdvancedSettings` - Advanced Queue configuration settings. These should usually not be changed. See [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information. Optional.
- `extraOptions` - Extra options for module init. See [Manual Registration](https://docs.nestjs.com/techniques/queues#manual-registration)

All the options are optional, providing detailed control over queue behavior. These are passed directly to the BullMQ `Queue` constructor. Read more about these options and other options [here](https://api.docs.bullmq.io/interfaces/v4.QueueOptions.html).

To register a queue, import the `BullModule.registerQueue()` dynamic module, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Hint** Create multiple queues by passing multiple comma-separated configuration objects to the `registerQueue()` method.

The `registerQueue()` method is used to instantiate and/or register queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is unique by its name property. A queue name is used as both an injection token (for injecting the queue into controllers/providers), and as an argument to decorators to associate consumer classes and listeners with queues.

You can also override some of the pre-configured options for a specific queue, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
```

BullMQ also supports parent - child relationships between jobs. This functionality enables the creation of flows where jobs are the node of trees of arbitrary depth. To read more about them check [here](https://docs.bullmq.io/guide/flows).

To add a flow, you can do the following:

```typescript
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
```

Since jobs are persisted in Redis, each time a specific named queue is instantiated (e.g., when an app is started/restarted), it attempts to process any old jobs that may exist from a previous unfinished session.

Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. Controlling queue processing order is discussed <a href="techniques/queues#consumers">here</a>.

<app-banner-enterprise></app-banner-enterprise>

#### Named configurations

If your queues connect to multiple different Redis instances, you can use a technique called **named configurations**. This feature allows you to register several configurations under specified keys, which then you can refer to in the queue options.

For example, assuming that you have an additional Redis instance (apart from the default one) used by a few queues registered in your application, you can register its configuration as follows:

```typescript
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
```

In the example above, `'alternative-config'` is just a configuration key (it can be any arbitrary string).

With this in place, you can now point to this configuration in the `registerQueue()` options object:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producers

Job producers add jobs to queues. Producers are typically application services (Nest [providers](/providers)). To add jobs to a queue, first inject the queue into the service as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Hint** The `@InjectQueue()` decorator identifies the queue by its name, as provided in the `registerQueue()` method call (e.g., `'audio'`).

Now, add a job by calling the queue's `add()` method, passing a user-defined job object. Jobs are represented as serializable JavaScript objects (since that is how they are stored in the Redis database). The shape of the job you pass is arbitrary; use it to represent the semantics of your job object. You also need to give it a name. This allows you to create specialized <a href="techniques/queues#consumers">consumers</a> that will only process jobs with a given name.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

#### Job options

Jobs can have additional options associated with them. Pass an options object after the `job` argument in the `Queue.add()` method. Some of the job options properties are:

- `priority`: `number` - Optional priority value. Ranges from 1 (highest priority) to MAX_INT (lowest priority). Note that using priorities has a slight impact on performance, so use them with caution.
- `delay`: `number` - An amount of time (milliseconds) to wait until this job can be processed. Note that for accurate delays, both server and clients should have their clocks synchronized.
- `attempts`: `number` - The total number of attempts to try the job until it completes.
- `repeat`: `RepeatOpts` - Repeat job according to a cron specification. See [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Backoff setting for automatic retries if the job fails. See [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - If true, adds the job to the right end of the queue instead of the left (default false).
- `jobId`: `number` | `string` - Override the job ID - by default, the job ID is a unique
  integer, but you can use this setting to override it. If you use this option, it is up to you to ensure the jobId is unique. If you attempt to add a job with an id that already exists, it will not be added.
- `removeOnComplete`: `boolean | number` - If true, removes the job when it successfully completes. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the completed set.
- `removeOnFail`: `boolean | number` - If true, removes the job when it fails after all attempts. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the failed set.
- `stackTraceLimit`: `number` - Limits the amount of stack trace lines that will be recorded in the stacktrace.

Here are a few examples of customizing jobs with job options.

To delay the start of a job, use the `delay` configuration property.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

To add a job to the right end of the queue (process the job as **LIFO** (Last In First Out)), set the `lifo` property of the configuration object to `true`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

To prioritize a job, use the `priority` property.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

For a full list of options, check the API documentation [here](https://api.docs.bullmq.io/types/v4.JobsOptions.html) and [here](https://api.docs.bullmq.io/interfaces/v4.BaseJobOptions.html).

#### Consumers

A consumer is a **class** defining methods that either process jobs added into the queue, or listen for events on the queue, or both. Declare a consumer class using the `@Processor()` decorator as follows:

```typescript
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
```

> info **Hint** Consumers must be registered as `providers` so the `@nestjs/bullmq` package can pick them up.

Where the decorator's string argument (e.g., `'audio'`) is the name of the queue to be associated with the class methods.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.updateProgress(progress);
    }
    return {};
  }
}
```

The process method is called whenever the worker is idle and there are jobs to process in the queue. This handler method receives the `job` object as its only argument. The value returned by the handler method is stored in the job object and can be accessed later on, for example in a listener for the completed event.

`Job` objects have multiple methods that allow you to interact with their state. For example, the above code uses the `updateProgress()` method to update the job's progress. See [here](https://api.docs.bullmq.io/classes/v4.Job.html) for the complete `Job` object API reference.

In the older version, Bull, you could designate that a job handler method will handle **only** jobs of a certain type (jobs with a specific `name`) by passing that `name` to the `@Process()` decorator as shown below.

> warning **Warning** This doesn't work with BullMQ, keep reading.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

This behavior is not supported in BullMQ due to confusions it generated. Instead, you need switch cases to call different services or logic for each job name:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.progress(progress);
        }
        return {};
      }
      case 'concatenate': {
        await doSomeLogic2();
        break;
      }
    }
  }
}
```

This is covered in the [named processor](https://docs.bullmq.io/patterns/named-processor) section of the BullMQ documentation.

#### Request-scoped consumers

When a consumer is flagged as request-scoped (learn more about the injection scopes [here](/fundamentals/injection-scopes#provider-scope)), a new instance of the class will be created exclusively for each job. The instance will be garbage-collected after the job has completed.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Since request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject a `JOB_REF` through the constructor using a standard approach.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Hint** The `JOB_REF` token is imported from the `@nestjs/bullmq` package.

#### Event listeners

BullMQ generates a set of useful events when queue and/or job state changes occur. These events can be subscribed to at the Worker level using the `@OnWorkerEvent(event)` decorator, or at the Queue level with a dedicated listener class and the `@OnQueueEvent(event)` decorator.

Worker events must be declared within a <a href="techniques/queues#consumers">consumer</a> class (i.e., within a class decorated with the `@Processor()` decorator). To listen for an event, use the `@OnWorkerEvent(event)` decorator with the event you want to be handled. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import { Processor, Process, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer {
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  // ...
}
```

You can see the complete list of events and their arguments as properties of WorkerListener [here](https://api.docs.bullmq.io/interfaces/v4.WorkerListener.html).

QueueEvent listeners must use the `@QueueEventsListener(queue)` decorator and extend the `QueueEventsHost` class provided by `@nestjs/bullmq`. To listen for an event, use the `@OnQueueEvent(event)` decorator with the event you want to be handled. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';

@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    console.log(`Processing job ${job.jobId}...`);
  }

  // ...
}
```

> info **Hint** QueueEvent Listeners must be registered as `providers` so the `@nestjs/bullmq` package can pick them up.

You can see the complete list of events and their arguments as properties of QueueEventsListener [here](https://api.docs.bullmq.io/interfaces/v4.QueueEventsListener.html).

#### Queue management

Queues have an API that allows you to perform management functions like pausing and resuming, retrieving the count of jobs in various states, and several more. You can find the full queue API [here](https://api.docs.bullmq.io/classes/v4.Queue.html). Invoke any of these methods directly on the `Queue` object, as shown below with the pause/resume examples.

Pause a queue with the `pause()` method call. A paused queue will not process new jobs until resumed, but current jobs being processed will continue until they are finalized.

```typescript
await audioQueue.pause();
```

To resume a paused queue, use the `resume()` method, as follows:

```typescript
await audioQueue.resume();
```

#### Separate processes

Job handlers can also be run in a separate (forked) process ([source](https://docs.bullmq.io/guide/workers/sandboxed-processors)). This has several advantages:

- The process is sandboxed so if it crashes it does not affect the worker.
- You can run blocking code without affecting the queue (jobs will not stall).
- Much better utilization of multi-core CPUs.
- Less connections to redis.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'node:path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** Please note that because your function is being executed in a forked process, Dependency Injection (and IoC container) won't be available. That means that your processor function will need to contain (or create) all instances of external dependencies it needs.

#### Async configuration

You may want to pass `bullmq` options asynchronously instead of statically. In this case, use the `forRootAsync()` method which provides several ways to deal with async configuration. Likewise, if you want to pass queue options asynchronously, use the `registerQueueAsync()` method.

One approach is to use a factory function:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

The construction above will instantiate `BullConfigService` inside `BullModule` and use it to provide an options object by calling `createSharedConfiguration()`. Note that this means that the `BullConfigService` has to implement the `SharedBullConfigurationFactory` interface, as shown below:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

In order to prevent the creation of `BullConfigService` inside `BullModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `BullModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

Likewise, if you want to pass queue options asynchronously, use the `registerQueueAsync()` method, just keep in mind to specify the `name` attribute outside the factory function.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Manual registration

By default, `BullModule` automatically registers BullMQ components (queues, processors, and event listener services) in the `onModuleInit` lifecycle function. However, in some cases, this behavior may not be ideal. To prevent automatic registration, enable `manualRegistration` in `BullModule` like this:

```typescript
BullModule.forRoot({
  extraOptions: {
    manualRegistration: true,
  },
});
```

To register these components manually, inject `BullRegistrar` and call the `register` function, ideally within `OnModuleInit` or `OnApplicationBootstrap`.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BullRegistrar } from '@nestjs/bullmq';

@Injectable()
export class AudioService implements OnModuleInit {
  constructor(private bullRegistrar: BullRegistrar) {}

  onModuleInit() {
    if (yourConditionHere) {
      this.bullRegistrar.register();
    }
  }
}
```

Unless you call the `BullRegistrar#register` function, no BullMQ components will work—meaning no jobs will be processed.

#### Bull installation

> warning **Note** If you decided to use BullMQ, skip this section and the following chapters.

To begin using Bull, we first install the required dependencies.

```bash
$ npm install --save @nestjs/bull bull
```

Once the installation process is complete, we can import the `BullModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

The `forRoot()` method is used to register a `bull` package configuration object that will be used by all queues registered in the application (unless specified otherwise). A configuration object consists of the following properties:

- `limiter: RateLimiter` - Options to control the rate at which the queue's jobs are processed. See [RateLimiter](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information. Optional.
- `redis: RedisOpts` - Options to configure the Redis connection. See [RedisOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information. Optional.
- `prefix: string` - Prefix for all queue keys. Optional.
- `defaultJobOptions: JobOpts` - Options to control the default settings for new jobs. See [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) for more information. Optional. **Note: These do not take effect if you schedule jobs via a FlowProducer. See [bullmq#1034](https://github.com/taskforcesh/bullmq/issues/1034) for explanation.**
- `settings: AdvancedSettings` - Advanced Queue configuration settings. These should usually not be changed. See [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information. Optional.

All the options are optional, providing detailed control over queue behavior. These are passed directly to the Bull `Queue` constructor. Read more about these options [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue).

To register a queue, import the `BullModule.registerQueue()` dynamic module, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Hint** Create multiple queues by passing multiple comma-separated configuration objects to the `registerQueue()` method.

The `registerQueue()` method is used to instantiate and/or register queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is unique by its name property. A queue name is used as both an injection token (for injecting the queue into controllers/providers), and as an argument to decorators to associate consumer classes and listeners with queues.

You can also override some of the pre-configured options for a specific queue, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
```

Since jobs are persisted in Redis, each time a specific named queue is instantiated (e.g., when an app is started/restarted), it attempts to process any old jobs that may exist from a previous unfinished session.

Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. Controlling queue processing order is discussed <a href="techniques/queues#consumers">here</a>.

<app-banner-enterprise></app-banner-enterprise>

#### Named configurations

If your queues connect to multiple Redis instances, you can use a technique called **named configurations**. This feature allows you to register several configurations under specified keys, which then you can refer to in the queue options.

For example, assuming that you have an additional Redis instance (apart from the default one) used by a few queues registered in your application, you can register its configuration as follows:

```typescript
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
```

In the example above, `'alternative-config'` is just a configuration key (it can be any arbitrary string).

With this in place, you can now point to this configuration in the `registerQueue()` options object:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producers

Job producers add jobs to queues. Producers are typically application services (Nest [providers](/providers)). To add jobs to a queue, first inject the queue into the service as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Hint** The `@InjectQueue()` decorator identifies the queue by its name, as provided in the `registerQueue()` method call (e.g., `'audio'`).

Now, add a job by calling the queue's `add()` method, passing a user-defined job object. Jobs are represented as serializable JavaScript objects (since that is how they are stored in the Redis database). The shape of the job you pass is arbitrary; use it to represent the semantics of your job object.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

#### Named jobs

Jobs may have unique names. This allows you to create specialized <a href="techniques/queues#consumers">consumers</a> that will only process jobs with a given name.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

> Warning **Warning** When using named jobs, you must create processors for each unique name added to a queue, or the queue will complain that you are missing a processor for the given job. See <a href="techniques/queues#consumers">here</a> for more information on consuming named jobs.

#### Job options

Jobs can have additional options associated with them. Pass an options object after the `job` argument in the `Queue.add()` method. Job options properties are:

- `priority`: `number` - Optional priority value. Ranges from 1 (highest priority) to MAX_INT (lowest priority). Note that using priorities has a slight impact on performance, so use them with caution.
- `delay`: `number` - An amount of time (milliseconds) to wait until this job can be processed. Note that for accurate delays, both server and clients should have their clocks synchronized.
- `attempts`: `number` - The total number of attempts to try the job until it completes.
- `repeat`: `RepeatOpts` - Repeat job according to a cron specification. See [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Backoff setting for automatic retries if the job fails. See [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - If true, adds the job to the right end of the queue instead of the left (default false).
- `timeout`: `number` - The number of milliseconds after which the job should fail with a timeout error.
- `jobId`: `number` | `string` - Override the job ID - by default, the job ID is a unique
  integer, but you can use this setting to override it. If you use this option, it is up to you to ensure the jobId is unique. If you attempt to add a job with an id that already exists, it will not be added.
- `removeOnComplete`: `boolean | number` - If true, removes the job when it successfully completes. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the completed set.
- `removeOnFail`: `boolean | number` - If true, removes the job when it fails after all attempts. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the failed set.
- `stackTraceLimit`: `number` - Limits the amount of stack trace lines that will be recorded in the stacktrace.

Here are a few examples of customizing jobs with job options.

To delay the start of a job, use the `delay` configuration property.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

To add a job to the right end of the queue (process the job as **LIFO** (Last In First Out)), set the `lifo` property of the configuration object to `true`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

To prioritize a job, use the `priority` property.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

#### Consumers

A consumer is a **class** defining methods that either process jobs added into the queue, or listen for events on the queue, or both. Declare a consumer class using the `@Processor()` decorator as follows:

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

> info **Hint** Consumers must be registered as `providers` so the `@nestjs/bull` package can pick them up.

Where the decorator's string argument (e.g., `'audio'`) is the name of the queue to be associated with the class methods.

Within a consumer class, declare job handlers by decorating handler methods with the `@Process()` decorator.

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

The decorated method (e.g., `transcode()`) is called whenever the worker is idle and there are jobs to process in the queue. This handler method receives the `job` object as its only argument. The value returned by the handler method is stored in the job object and can be accessed later on, for example in a listener for the completed event.

`Job` objects have multiple methods that allow you to interact with their state. For example, the above code uses the `progress()` method to update the job's progress. See [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job) for the complete `Job` object API reference.

You can designate that a job handler method will handle **only** jobs of a certain type (jobs with a specific `name`) by passing that `name` to the `@Process()` decorator as shown below. You can have multiple `@Process()` handlers in a given consumer class, corresponding to each job type (`name`). When you use named jobs, be sure to have a handler corresponding to each name.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

> warning **Warning** When defining multiple consumers for the same queue, the `concurrency` option in `@Process({{ '{' }} concurrency: 1 {{ '}' }})` won't take effect. The minimum `concurrency` will match the number of consumers defined. This also applies even if `@Process()` handlers use a different `name` to handle named jobs.

#### Request-scoped consumers

When a consumer is flagged as request-scoped (learn more about the injection scopes [here](/fundamentals/injection-scopes#provider-scope)), a new instance of the class will be created exclusively for each job. The instance will be garbage-collected after the job has completed.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Since request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject a `JOB_REF` through the constructor using a standard approach.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Hint** The `JOB_REF` token is imported from the `@nestjs/bull` package.

#### Event listeners

Bull generates a set of useful events when queue and/or job state changes occur. Nest provides a set of decorators that allow subscribing to a core set of standard events. These are exported from the `@nestjs/bull` package.

Event listeners must be declared within a <a href="techniques/queues#consumers">consumer</a> class (i.e., within a class decorated with the `@Processor()` decorator). To listen for an event, use one of the decorators in the table below to declare a handler for the event. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
  ...
```

Since Bull operates in a distributed (multi-node) environment, it defines the concept of event locality. This concept recognizes that events may be triggered either entirely within a single process, or on shared queues from different processes. A **local** event is one that is produced when an action or state change is triggered on a queue in the local process. In other words, when your event producers and consumers are local to a single process, all events happening on queues are local.

When a queue is shared across multiple processes, we encounter the possibility of **global** events. For a listener in one process to receive an event notification triggered by another process, it must register for a global event.

Event handlers are invoked whenever their corresponding event is emitted. The handler is called with the signature shown in the table below, providing access to information relevant to the event. We discuss one key difference between local and global event handler signatures below.

<table>
  <tr>
    <th>Local event listeners</th>
    <th>Global event listeners</th>
    <th>Handler method signature / When fired</th>
  </tr>
  <tr>
    <td><code>@OnQueueError()</code></td><td><code>@OnGlobalQueueError()</code></td><td><code>handler(error: Error)</code> - An error occurred. <code>error</code> contains the triggering error.</td>
  </tr>
  <tr>
    <td><code>@OnQueueWaiting()</code></td><td><code>@OnGlobalQueueWaiting()</code></td><td><code>handler(jobId: number | string)</code> - A Job is waiting to be processed as soon as a worker is idling. <code>jobId</code> contains the id for the job that has entered this state.</td>
  </tr>
  <tr>
    <td><code>@OnQueueActive()</code></td><td><code>@OnGlobalQueueActive()</code></td><td><code>handler(job: Job)</code> - Job <code>job</code>has started. </td>
  </tr>
  <tr>
    <td><code>@OnQueueStalled()</code></td><td><code>@OnGlobalQueueStalled()</code></td><td><code>handler(job: Job)</code> - Job <code>job</code> has been marked as stalled. This is useful for debugging job workers that crash or pause the event loop.</td>
  </tr>
  <tr>
    <td><code>@OnQueueProgress()</code></td><td><code>@OnGlobalQueueProgress()</code></td><td><code>handler(job: Job, progress: number)</code> - Job <code>job</code>'s progress was updated to value <code>progress</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCompleted()</code></td><td><code>@OnGlobalQueueCompleted()</code></td><td><code>handler(job: Job, result: any)</code> Job <code>job</code> successfully completed with a result <code>result</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueFailed()</code></td><td><code>@OnGlobalQueueFailed()</code></td><td><code>handler(job: Job, err: Error)</code> Job <code>job</code> failed with reason <code>err</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueuePaused()</code></td><td><code>@OnGlobalQueuePaused()</code></td><td><code>handler()</code> The queue has been paused.</td>
  </tr>
  <tr>
    <td><code>@OnQueueResumed()</code></td><td><code>@OnGlobalQueueResumed()</code></td><td><code>handler(job: Job)</code> The queue has been resumed.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCleaned()</code></td><td><code>@OnGlobalQueueCleaned()</code></td><td><code>handler(jobs: Job[], type: string)</code> Old jobs have been cleaned from the queue. <code>jobs</code> is an array of cleaned jobs, and <code>type</code> is the type of jobs cleaned.</td>
  </tr>
  <tr>
    <td><code>@OnQueueDrained()</code></td><td><code>@OnGlobalQueueDrained()</code></td><td><code>handler()</code> Emitted whenever the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed).</td>
  </tr>
  <tr>
    <td><code>@OnQueueRemoved()</code></td><td><code>@OnGlobalQueueRemoved()</code></td><td><code>handler(job: Job)</code> Job <code>job</code> was successfully removed.</td>
  </tr>
</table>

When listening for global events, the method signatures can be slightly different from their local counterpart. Specifically, any method signature that receives `job` objects in the local version, instead receives a `jobId` (`number`) in the global version. To get a reference to the actual `job` object in such a case, use the `Queue#getJob` method. This call should be awaited, and therefore the handler should be declared `async`. For example:

```typescript
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
```

> info **Hint** To access the `Queue` object (to make a `getJob()` call), you must of course inject it. Also, the Queue must be registered in the module where you are injecting it.

In addition to the specific event listener decorators, you can also use the generic `@OnQueueEvent()` decorator in combination with either `BullQueueEvents` or `BullQueueGlobalEvents` enums. Read more about events [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events).

#### Queue management

Queue's have an API that allows you to perform management functions like pausing and resuming, retrieving the count of jobs in various states, and several more. You can find the full queue API [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue). Invoke any of these methods directly on the `Queue` object, as shown below with the pause/resume examples.

Pause a queue with the `pause()` method call. A paused queue will not process new jobs until resumed, but current jobs being processed will continue until they are finalized.

```typescript
await audioQueue.pause();
```

To resume a paused queue, use the `resume()` method, as follows:

```typescript
await audioQueue.resume();
```

#### Separate processes

Job handlers can also be run in a separate (forked) process ([source](https://github.com/OptimalBits/bull#separate-processes)). This has several advantages:

- The process is sandboxed so if it crashes it does not affect the worker.
- You can run blocking code without affecting the queue (jobs will not stall).
- Much better utilization of multi-core CPUs.
- Less connections to redis.

```ts
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

Please note that because your function is being executed in a forked process, Dependency Injection (and IoC container) won't be available. That means that your processor function will need to contain (or create) all instances of external dependencies it needs.

```ts
@@filename(processor)
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(`[${process.pid}] ${JSON.stringify(job.data)}`);
  cb(null, 'It works');
}
```

#### Async configuration

You may want to pass `bull` options asynchronously instead of statically. In this case, use the `forRootAsync()` method which provides several ways to deal with async configuration.

One approach is to use a factory function:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

The construction above will instantiate `BullConfigService` inside `BullModule` and use it to provide an options object by calling `createSharedConfiguration()`. Note that this means that the `BullConfigService` has to implement the `SharedBullConfigurationFactory` interface, as shown below:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

In order to prevent the creation of `BullConfigService` inside `BullModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `BullModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

Likewise, if you want to pass queue options asynchronously, use the `registerQueueAsync()` method, just keep in mind to specify the `name` attribute outside the factory function.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/26-queues).


---

## SQL (Sequelize)

### SQL (Sequelize)

##### This chapter applies only to TypeScript

> **Warning** In this article, you'll learn how to create a `DatabaseModule` based on the **Sequelize** package from scratch using custom components. As a consequence, this technique contains a lot of overhead that you can avoid by using the dedicated, out-of-the-box `@nestjs/sequelize` package. To learn more, see [here](/techniques/database#sequelize-integration).

[Sequelize](https://github.com/sequelize/sequelize) is a popular Object Relational Mapper (ORM) written in a vanilla JavaScript, but there is a [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) TypeScript wrapper which provides a set of decorators and other extras for the base sequelize.

#### Getting started

To start the adventure with this library we have to install the following dependencies:

```bash
$ npm install --save sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

The first step we need to do is create a **Sequelize** instance with an options object passed into the constructor. Also, we need to add all models (the alternative is to use `modelPaths` property) and `sync()` our database tables.

```typescript
@@filename(database.providers)
import { Sequelize } from 'sequelize-typescript';
import { Cat } from '../cats/cat.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'nest',
      });
      sequelize.addModels([Cat]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
```

> info **Hint** Following best practices, we declared the custom provider in the separated file which has a `*.providers.ts` suffix.

Then, we need to export these providers to make them **accessible** for the rest part of the application.

```typescript
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Now we can inject the `Sequelize` object using `@Inject()` decorator. Each class that would depend on the `Sequelize` async provider will wait until a `Promise` is resolved.

#### Model injection

In [Sequelize](https://github.com/sequelize/sequelize) the **Model** defines a table in the database. Instances of this class represent a database row. Firstly, we need at least one entity:

```typescript
@@filename(cat.entity)
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class Cat extends Model {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;
}
```

The `Cat` entity belongs to the `cats` directory. This directory represents the `CatsModule`. Now it's time to create a **Repository** provider:

```typescript
@@filename(cats.providers)
import { Cat } from './cat.entity';

export const catsProviders = [
  {
    provide: 'CATS_REPOSITORY',
    useValue: Cat,
  },
];
```

> warning **Warning** In the real-world applications you should avoid **magic strings**. Both `CATS_REPOSITORY` and `SEQUELIZE` should be kept in the separated `constants.ts` file.

In Sequelize, we use static methods to manipulate the data, and thus we created an **alias** here.

Now we can inject the `CATS_REPOSITORY` to the `CatsService` using the `@Inject()` decorator:

```typescript
@@filename(cats.service)
import { Injectable, Inject } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CATS_REPOSITORY')
    private catsRepository: typeof Cat
  ) {}

  async findAll(): Promise<Cat[]> {
    return this.catsRepository.findAll<Cat>();
  }
}
```

The database connection is **asynchronous**, but Nest makes this process completely invisible for the end-user. The `CATS_REPOSITORY` provider is waiting for the db connection, and the `CatsService` is delayed until repository is ready to use. The entire application can start when each class is instantiated.

Here is a final `CatsModule`:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
```

> info **Hint** Do not forget to import the `CatsModule` into the root `AppModule`.


---

## Sentry

### Sentry

[Sentry](https://sentry.io) is an error tracking and performance monitoring platform that helps developers identify and fix issues in real-time. This recipe shows how to integrate Sentry's [NestJS SDK](https://docs.sentry.io/platforms/javascript/guides/nestjs/) with your NestJS application.

#### Installation

First, install the required dependencies:

```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```

> info **Hint** `@sentry/profiling-node` is optional, but recommended for performance profiling.

#### Basic setup

To get started with Sentry, you'll need to create a file named `instrument.ts` that should be imported before any other modules in your application:

```typescript
@@filename(instrument)
const Sentry = require("@sentry/nestjs");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
```

Update your `main.ts` file to import `instrument.ts` before other imports:

```typescript
@@filename(main)
// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

Afterwards, add the `SentryModule` as a root module to your main module:

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...other modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Exception handling

If you're using a global catch-all exception filter (which is either a filter registered with `app.useGlobalFilters()` or a filter registered in your app module providers annotated with a `@Catch()` decorator without arguments), add a `@SentryExceptionCaptured()` decorator to the filter's `catch()` method. This decorator will report all unexpected errors that are received by your global error filter to Sentry:

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // your implementation here
  }
}
```

By default, only unhandled exceptions that are not caught by an error filter are reported to Sentry. `HttpExceptions` (including [derivatives](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)) are also not captured by default because they mostly act as control flow vehicles.

If you don't have a global catch-all exception filter, add the `SentryGlobalFilter` to the providers of your main module. This filter will report any unhandled errors that aren't caught by other error filters to Sentry.

> warning **Warning** The `SentryGlobalFilter` needs to be registered before any other exception filters.

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // ..other providers
  ],
})
export class AppModule {}
```

#### Readable stack traces

Depending on how you've set up your project, the stack traces in your Sentry errors probably won't look like your actual code.

To fix this, upload your source maps to Sentry. The easiest way to do this is by using the Sentry Wizard:

```bash
npx @sentry/wizard@latest -i sourcemaps
```

#### Testing the integration

To verify your Sentry integration is working, you can add a test endpoint that throws an error:

```typescript
@Get("debug-sentry")
getError() {
  throw new Error("My first Sentry error!");
}
```

Visit `/debug-sentry` in your application, and you should see the error appear in your Sentry dashboard.

### Summary

For complete documentation about Sentry's NestJS SDK, including advanced configuration options and features, visit the [official Sentry documentation](https://docs.sentry.io/platforms/javascript/guides/nestjs/).

While software bugs are Sentry's thing, we still write them. If you come across any problems while installing our SDK, please open a [GitHub Issue](https://github.com/getsentry/sentry-javascript/issues) or reach out on [Discord](https://discord.com/invite/sentry).


---

## Serialization

### Serialization

Serialization is a process that happens before objects are returned in a network response. This is an appropriate place to provide rules for transforming and sanitizing the data to be returned to the client. For example, sensitive data like passwords should always be excluded from the response. Or, certain properties might require additional transformation, such as sending only a subset of properties of an entity. Performing these transformations manually can be tedious and error prone, and can leave you uncertain that all cases have been covered.

#### Overview

Nest provides a built-in capability to help ensure that these operations can be performed in a straightforward way. The `ClassSerializerInterceptor` interceptor uses the powerful [class-transformer](https://github.com/typestack/class-transformer) package to provide a declarative and extensible way of transforming objects. The basic operation it performs is to take the value returned by a method handler and apply the `instanceToPlain()` function from [class-transformer](https://github.com/typestack/class-transformer). In doing so, it can apply rules expressed by `class-transformer` decorators on an entity/DTO class, as described below.

> info **Hint** The serialization does not apply to [StreamableFile](https://docs.nestjs.com/techniques/streaming-files#streamable-file-class) responses.

#### Exclude properties

Let's assume that we want to automatically exclude a `password` property from a user entity. We annotate the entity as follows:

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

Now consider a controller with a method handler that returns an instance of this class.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    password: 'password',
  });
}
```

> **Warning** Note that we must return an instance of the class. If you return a plain JavaScript object, for example, `{{ '{' }} user: new UserEntity() {{ '}' }}`, the object won't be properly serialized.

> info **Hint** The `ClassSerializerInterceptor` is imported from `@nestjs/common`.

When this endpoint is requested, the client receives the following response:

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe"
}
```

Note that the interceptor can be applied application-wide (as covered [here](https://docs.nestjs.com/interceptors#binding-interceptors)). The combination of the interceptor and the entity class declaration ensures that **any** method that returns a `UserEntity` will be sure to remove the `password` property. This gives you a measure of centralized enforcement of this business rule.

#### Expose properties

You can use the `@Expose()` decorator to provide alias names for properties, or to execute a function to calculate a property value (analogous to **getter** functions), as shown below.

```typescript
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

#### Transform

You can perform additional data transformation using the `@Transform()` decorator. For example, the following construct returns the name property of the `RoleEntity` instead of returning the whole object.

```typescript
@Transform(({ value }) => value.name)
role: RoleEntity;
```

#### Pass options

You may want to modify the default behavior of the transformation functions. To override default settings, pass them in an `options` object with the `@SerializeOptions()` decorator.

```typescript
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
```

> info **Hint** The `@SerializeOptions()` decorator is imported from `@nestjs/common`.

Options passed via `@SerializeOptions()` are passed as the second argument of the underlying `instanceToPlain()` function. In this example, we are automatically excluding all properties that begin with the `_` prefix.

#### Transform plain objects

You can enforce transformations at the controller level by using the `@SerializeOptions` decorator. This ensures that all responses are transformed into instances of the specified class, applying any decorators from class-validator or class-transformer, even when plain objects are returned. This approach leads to cleaner code without the need to repeatedly instantiate the class or call `plainToInstance`.

In the example below, despite returning plain JavaScript objects in both conditional branches, they will be automatically converted into `UserEntity` instances, with the relevant decorators applied:

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: UserEntity })
@Get()
findOne(@Query() { id }: { id: number }): UserEntity {
  if (id === 1) {
    return {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      password: 'password',
    };
  }

  return {
    id: 2,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password2',
  };
}
```

> info **Hint** By specifying the expected return type for the controller, you can leverage TypeScript's type-checking capabilities to ensure that the returned plain object adheres to the shape of the DTO or entity. The `plainToInstance` function doesn't provide this level of type hinting, which can lead to potential bugs if the plain object doesn't match the expected DTO or entity structure.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/21-serializer).

#### WebSockets and Microservices

While this chapter shows examples using HTTP style applications (e.g., Express or Fastify), the `ClassSerializerInterceptor` works the same for WebSockets and Microservices, regardless of the transport method that is used.

#### Learn more

Read more about available decorators and options as provided by the `class-transformer` package [here](https://github.com/typestack/class-transformer).


---

## Server-Sent Events

### Server-Sent Events

Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via HTTP connection. Each notification is sent as a block of text terminated by a pair of newlines (learn more [here](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).

#### Usage

To enable Server-Sent events on a route (route registered within a **controller class**), annotate the method handler with the `@Sse()` decorator.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **Hint** The `@Sse()` decorator and `MessageEvent` interface are imported from the `@nestjs/common`, while `Observable`, `interval`, and `map` are imported from the `rxjs` package.

> warning **Warning** Server-Sent Events routes must return an `Observable` stream.

In the example above, we defined a route named `sse` that will allow us to propagate real-time updates. These events can be listened to using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

The `sse` method returns an `Observable` that emits multiple `MessageEvent` (in this example, it emits a new `MessageEvent` every second). The `MessageEvent` object should respect the following interface to match the specification:

```typescript
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

With this in place, we can now create an instance of the `EventSource` class in our client-side application, passing the `/sse` route (which matches the endpoint we have passed into the `@Sse()` decorator above) as a constructor argument.

`EventSource` instance opens a persistent connection to an HTTP server, which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.

Once the connection is opened, incoming messages from the server are delivered to your code in the form of events. If there is an event field in the incoming message, the triggered event is the same as the event field value. If no event field is present, then a generic `message` event is fired ([source](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/28-sse).


---

## Session

### Session

**HTTP sessions** provide a way to store information about the user across multiple requests, which is particularly useful for [MVC](/techniques/mvc) applications.

#### Use with Express (default)

First install the [required package](https://github.com/expressjs/session) (and its types for TypeScript users):

```shell
$ npm i express-session
$ npm i -D @types/express-session
```

Once the installation is complete, apply the `express-session` middleware as global middleware (for example, in your `main.ts` file).

```typescript
import * as session from 'express-session';
// somewhere in your initialization file
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
```

> warning **Notice** The default server-side session storage is purposely not designed for a production environment. It will leak memory under most conditions, does not scale past a single process, and is meant for debugging and developing. Read more in the [official repository](https://github.com/expressjs/session).

The `secret` is used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets. If an array of secrets is provided, only the first element will be used to sign the session ID cookie, while all the elements will be considered when verifying the signature in requests. The secret itself should be not easily parsed by a human and would best be a random set of characters.

Enabling the `resave` option forces the session to be saved back to the session store, even if the session was never modified during the request. The default value is `true`, but using the default has been deprecated, as the default will change in the future.

Likewise, enabling the `saveUninitialized` option Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing `false` will also help with race conditions where a client makes multiple parallel requests without a session ([source](https://github.com/expressjs/session#saveuninitialized)).

You can pass several other options to the `session` middleware, read more about them in the [API documentation](https://github.com/expressjs/session#options).

> info **Hint** Please note that `secure: true` is a recommended option. However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies. If secure is set, and you access your site over HTTP, the cookie will not be set. If you have your node.js behind a proxy and are using `secure: true`, you need to set `"trust proxy"` in express.

With this in place, you can now set and read session values from within the route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
```

> info **Hint** The `@Req()` decorator is imported from the `@nestjs/common`, while `Request` from the `express` package.

Alternatively, you can use the `@Session()` decorator to extract a session object from the request, as follows:

```typescript
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```

> info **Hint** The `@Session()` decorator is imported from the `@nestjs/common` package.

#### Use with Fastify

First install the required package:

```shell
$ npm i @fastify/secure-session
```

Once the installation is complete, register the `fastify-secure-session` plugin:

```typescript
import secureSession from '@fastify/secure-session';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
```

> info **Hint** You can also pregenerate a key ([see instructions](https://github.com/fastify/fastify-secure-session)) or use [keys rotation](https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation).

Read more about the available options in the [official repository](https://github.com/fastify/fastify-secure-session).

With this in place, you can now set and read session values from within the route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
```

Alternatively, you can use the `@Session()` decorator to extract a session object from the request, as follows:

```typescript
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

> info **Hint** The `@Session()` decorator is imported from the `@nestjs/common`, while `secureSession.Session` from the `@fastify/secure-session` package (import statement: `import * as secureSession from '@fastify/secure-session'`).


---

## Streaming files

### Streaming files

> info **Note** This chapter shows how you can stream files from your **HTTP application**. The examples presented below do not apply to GraphQL or Microservice applications.

There may be times where you would like to send back a file from your REST API to the client. To do this with Nest, normally you'd do the following:

```ts
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

But in doing so you end up losing access to your post-controller interceptor logic. To handle this, you can return a `StreamableFile` instance and under the hood, the framework will take care of piping the response.

#### Streamable File class

A `StreamableFile` is a class that holds onto the stream that is to be returned. To create a new `StreamableFile`, you can pass either a `Buffer` or a `Stream` to the `StreamableFile` constructor.

> info **hint** The `StreamableFile` class can be imported from `@nestjs/common`.

#### Cross-platform support

Fastify, by default, can support sending files without needing to call `stream.pipe(res)`, so you don't need to use the `StreamableFile` class at all. However, Nest supports the use of `StreamableFile` in both platform types, so if you end up switching between Express and Fastify there's no need to worry about compatibility between the two engines.

#### Example

You can find a simple example of returning the `package.json` as a file instead of a JSON below, but the idea extends out naturally to images, documents, and any other file type.

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

The default content type (the value for `Content-Type` HTTP response header) is `application/octet-stream`. If you need to customize this value you can use the `type` option from `StreamableFile`, or use the `res.set` method or the [`@Header()`](/controllers#response-headers) decorator, like this:

```ts
import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import type { Response } from 'express'; // Assuming that we are using the ExpressJS HTTP Adapter

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
      // If you want to define the Content-Length value to another value instead of file's length:
      // length: 123,
    });
  }

  // Or even:
  @Get()
  getFileChangingResponseObjDirectly(@Res({ passthrough: true }) res: Response): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }

  // Or even:
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="package.json"')
  getFileUsingStaticValues(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }  
}
```


---

## Suites

### Suites

[Suites](https://suites.dev) is an [open-source](https://github.com/suites-dev/suites) unit-testing framework for TypeScript dependency injection frameworks. It is used as an **alternative** to manually creating mocks, verbose test setup with multiple mock configurations, or working with untyped test doubles (like mocks and stubs).

Suites reads metadata from nestjs services at runtime and automatically generates fully-typed mocks for all dependencies.
This removes boilerplate mock setup and ensures type-safe tests. While Suites can be used alongside `Test.createTestingModule()`, it excels at focused unit testing.
Use `Test.createTestingModule()` when validating module wiring, decorators, guards, and interceptors.
Use Suites for fast unit tests with automatic mock generation.

For more information on module-based testing, see the [testing fundamentals](/fundamentals/testing) chapter.

> info **Note** `Suites` is a third-party package and is not maintained by the NestJS core team. Please report any issues to the [appropriate repository](https://github.com/suites-dev/suites).

#### Getting started

This guide demonstrates using Suites to test NestJS services. It covers both isolated testing (all dependencies mocked) and sociable testing (selected real implementations).

#### Install Suites

Verify NestJS runtime dependencies are installed:

```bash
$ npm install @nestjs/common @nestjs/core reflect-metadata
```

Install Suites core, the NestJS adapter, and the doubles adapter:

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.jest
```

The doubles adapter (`@suites/doubles.jest`) provides wrappers around Jest's mocking capabilities. It exposes `mock()` and `stub()` functions that create type-safe test doubles.

Ensure Jest and TypeScript are available:

```bash
$ npm install --save-dev ts-jest @types/jest jest typescript
```

<details><summary>Expand if you're using Vitest</summary>

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.vitest
```

</details>

<details><summary>Expand if you're using Sinon</summary>

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.sinon
```

</details>

#### Set up type definitions

Create `global.d.ts` at your project root:

```typescript
/// <reference types="@suites/doubles.jest/unit" />
/// <reference types="@suites/di.nestjs/types" />
```

#### Create a sample service

This guide uses a simple `UserService` with two dependencies:

```typescript
@@filename(user.repository)
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Database query
  }

  async save(user: User): Promise<User> {
    // Database save
  }
}
```
```typescript
@@filename(user.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private logger: Logger,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    this.logger.log(`Found user ${id}`);
    return user;
  }

  async create(email: string, name: string): Promise<User> {
    const user = { id: generateId(), email, name };
    await this.repository.save(user);
    this.logger.log(`Created user ${user.id}`);
    return user;
  }
}
```

#### Write a unit test

Use `TestBed.solitary()` to create isolated tests with all dependencies mocked:

```typescript
@@filename(user.service.spec)
import { TestBed, type Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('User Service Unit Spec', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;
  let logger: Mocked<Logger>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(UserService).compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
    logger = unitRef.get(Logger);
  });

  it('should find user by id', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test' };
    repository.findById.mockResolvedValue(user);

    const result = await userService.findById('1');

    expect(result).toEqual(user);
    expect(logger.log).toHaveBeenCalled();
  });
});
```

`TestBed.solitary()` analyzes the constructor and creates typed mocks for all dependencies.
The `Mocked<T>` type provides IntelliSense support for mock configuration.

#### Pre-compile mock configuration

Configure mock behavior before compilation using `.mock().impl()`:

```typescript
@@filename(user.service.spec)
import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec - pre-configured', () => {
  let unit: UserService;
  let repository: Mocked<UserRepository>;
  
  beforeAll(async () => {
    const { unit: underTest, unitRef } = await TestBed.solitary(UserService)
      .mock(UserRepository)
      .impl(stubFn => ({
        findById: stubFn().mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test' })
      }))
      .compile();
    
    repository = unitRef.get(UserRepository);
    unit = underTest;
  })
  
  it('should find user with pre-configured mock', async () => {
    const result = await unit.findById('1');
    
    expect(repository.findById).toHaveBeenCalled();
    expect(result.email).toBe('test@example.com');
  });
});
```

The `stubFn` parameter corresponds to the installed doubles adapter (`jest.fn()` for Jest, `vi.fn()` for Vitest, `sinon.stub()` for Sinon).

#### Testing with real dependencies

Use `TestBed.sociable()` with `.expose()` to use real implementations for specific dependencies:

```typescript
@@filename(user.service.spec)
import { TestBed, Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('UserService - with real logger', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.sociable(UserService)
      .expose(Logger)
      .compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
  });

  it('should log when finding user', async () => {
    const user = { id: '1', email: 'test@example.com' };
    repository.findById.mockResolvedValue(user);

    await userService.findById('1');

    // Logger actually executes, no mock needed
  });
});
```

`.expose(Logger)` instantiates `Logger` with its real implementation while keeping other dependencies mocked.

#### Token-based dependencies

Suites handles custom injection tokens (strings or symbols):

```typescript
@@filename(config.service)
import { Injectable, Inject } from '@nestjs/common';

export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_OPTIONS) private options: { apiKey: string },
  ) {}

  getApiKey(): string {
    return this.options.apiKey;
  }
}
```

Access token-based dependencies with `unitRef.get()`:

```typescript
@@filename(config.service.spec)
import { TestBed } from '@suites/unit';
import { ConfigService, CONFIG_OPTIONS, ConfigOptions } from './config.service';

describe('Config Service Unit Spec', () => {
  let configService: ConfigService;
  let options: ConfigOptions;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(ConfigService).compile();
    configService = unit;

    options = unitRef.get<ConfigOptions>(CONFIG_OPTIONS);
  });

  it('should return api key', () => { ... });
});
```

#### Using mock() and stub() directly

For those who prefer direct control without `TestBed`, the doubles adapter package provides `mock()` and `stub()` functions:

```typescript
@@filename(user.service.spec)
import { mock } from '@suites/unit';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec', () => {
  it('should work with direct mocks', async () => {
    const repository = mock<UserRepository>();
    const logger = mock<Logger>();

    const service = new UserService(repository, logger);

    // ...
  });
});
```

`mock()` creates a typed mock object, and `stub()` wraps the underlying mocking library (Jest in this example) to provide methods like `mockResolvedValue()`
These functions come from the installed doubles adapter (`@suites/doubles.jest`), which adapts the native mocking capabilities of the test framework.

> info **Hint** The `mock()` function is an alternative to `createMock` from `@golevelup/ts-jest`. Both create typed mock objects. See the [testing fundamentals](/fundamentals/testing#auto-mocking) chapter for more on `createMock`.

#### Summary

**Use `Test.createTestingModule()` for:**
- Validating module configuration and provider wiring
- Testing decorators, guards, interceptors, and pipes
- Verifying dependency injection across modules
- Testing full application context with middleware

**Use Suites for:**
- Fast unit tests focused on business logic
- Automatic mock generation for multiple dependencies
- Type-safe test doubles with IntelliSense

Organize tests by purpose: use Suites for unit tests verifying individual service behavior, and use `Test.createTestingModule()` for integration tests verifying module configuration.

For more information:
- [Suites Documentation](https://suites.dev/docs)
- [Suites GitHub Repository](https://github.com/suites-dev/suites)
- [NestJS Testing Documentation](/fundamentals/testing)


---

## Task scheduling

### Task scheduling

Task scheduling allows you to schedule arbitrary code (methods/functions) to execute at a fixed date/time, at recurring intervals, or once after a specified interval. In the Linux world, this is often handled by packages like [cron](https://en.wikipedia.org/wiki/Cron) at the OS level. For Node.js apps, there are several packages that emulate cron-like functionality. Nest provides the `@nestjs/schedule` package, which integrates with the popular Node.js [cron](https://github.com/kelektiv/node-cron) package. We'll cover this package in the current chapter.

#### Installation

To begin using it, we first install the required dependencies.

```bash
$ npm install --save @nestjs/schedule
```

To activate job scheduling, import the `ScheduleModule` into the root `AppModule` and run the `forRoot()` static method as shown below:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
```

The `.forRoot()` call initializes the scheduler and registers any declarative <a href="techniques/task-scheduling#declarative-cron-jobs">cron jobs</a>, <a href="techniques/task-scheduling#declarative-timeouts">timeouts</a> and <a href="techniques/task-scheduling#declarative-intervals">intervals</a> that exist within your app. Registration occurs when the `onApplicationBootstrap` lifecycle hook occurs, ensuring that all modules have loaded and declared any scheduled jobs.

#### Declarative cron jobs

A cron job schedules an arbitrary function (method call) to run automatically. Cron jobs can run:

- Once, at a specified date/time.
- On a recurring basis; recurring jobs can run at a specified instant within a specified interval (for example, once per hour, once per week, once every 5 minutes)

Declare a cron job with the `@Cron()` decorator preceding the method definition containing the code to be executed, as follows:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Called when the current second is 45');
  }
}
```

In this example, the `handleCron()` method will be called each time the current second is `45`. In other words, the method will be run once per minute, at the 45 second mark.

The `@Cron()` decorator supports the following standard [cron patterns](http://crontab.org/):

- Asterisk (e.g. `*`)
- Ranges (e.g. `1-3,5`)
- Steps (e.g. `*/2`)

In the example above, we passed `45 * * * * *` to the decorator. The following key shows how each position in the cron pattern string is interpreted:

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | day of week
| | | | months
| | | day of month
| | hours
| minutes
seconds (optional)
</code></pre>

Some sample cron patterns are:

<table>
  <tbody>
    <tr>
      <td><code>* * * * * *</code></td>
      <td>every second</td>
    </tr>
    <tr>
      <td><code>45 * * * * *</code></td>
      <td>every minute, on the 45th second</td>
    </tr>
    <tr>
      <td><code>0 10 * * * *</code></td>
      <td>every hour, at the start of the 10th minute</td>
    </tr>
    <tr>
      <td><code>0 */30 9-17 * * *</code></td>
      <td>every 30 minutes between 9am and 5pm</td>
    </tr>
   <tr>
      <td><code>0 30 11 * * 1-5</code></td>
      <td>Monday to Friday at 11:30am</td>
    </tr>
  </tbody>
</table>

The `@nestjs/schedule` package provides a convenient enum with commonly used cron patterns. You can use this enum as follows:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Called every 30 seconds');
  }
}
```

In this example, the `handleCron()` method will be called every `30` seconds. If an exception occurs, it will be logged to the console, as every method annotated with `@Cron()` is automatically wrapped in a `try-catch` block.

Alternatively, you can supply a JavaScript `Date` object to the `@Cron()` decorator. Doing so causes the job to execute exactly once, at the specified date.

> info **Hint** Use JavaScript date arithmetic to schedule jobs relative to the current date. For example, `@Cron(new Date(Date.now() + 10 * 1000))` to schedule a job to run 10 seconds after the app starts.

Also, you can supply additional options as the second parameter to the `@Cron()` decorator.

<table>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>
        Useful to access and control a cron job after it's been declared.
      </td>
    </tr>
    <tr>
      <td><code>timeZone</code></td>
      <td>
        Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at <a href="http://momentjs.com/timezone/">Moment Timezone</a> website.
      </td>
    </tr>
    <tr>
      <td><code>utcOffset</code></td>
      <td>
        This allows you to specify the offset of your timezone rather than using the <code>timeZone</code> param.
      </td>
    </tr>
    <tr>
      <td><code>waitForCompletion</code></td>
      <td>
        If <code>true</code>, no additional instances of the cron job will run until the current onTick callback has been completed. Any new scheduled executions that occur while the current cron job is running will be skipped entirely.
      </td>
    </tr>
    <tr>
      <td><code>disabled</code></td>
      <td>
       This indicates whether the job will be executed at all.
      </td>
    </tr>
  </tbody>
</table>

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron('* * 0 * * *', {
    name: 'notifications',
    timeZone: 'Europe/Paris',
  })
  triggerNotifications() {}
}
```

You can access and control a cron job after it's been declared, or dynamically create a cron job (where its cron pattern is defined at runtime) with the <a href="/techniques/task-scheduling#dynamic-schedule-module-api">Dynamic API</a>. To access a declarative cron job via the API, you must associate the job with a name by passing the `name` property in an optional options object as the second argument of the decorator.

#### Declarative intervals

To declare that a method should run at a (recurring) specified interval, prefix the method definition with the `@Interval()` decorator. Pass the interval value, as a number in milliseconds, to the decorator as shown below:

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
```

> info **Hint** This mechanism uses the JavaScript `setInterval()` function under the hood. You can also utilize a cron job to schedule recurring jobs.

If you want to control your declarative interval from outside the declaring class via the <a href="/techniques/task-scheduling#dynamic-schedule-module-api">Dynamic API</a>, associate the interval with a name using the following construction:

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

If an exception occurs, it will be logged to the console, as every method annotated with `@Interval()` is automatically wrapped in a `try-catch` block.

The <a href="techniques/task-scheduling#dynamic-intervals">Dynamic API</a> also enables **creating** dynamic intervals, where the interval's properties are defined at runtime, and **listing and deleting** them.

<app-banner-enterprise></app-banner-enterprise>

#### Declarative timeouts

To declare that a method should run (once) at a specified timeout, prefix the method definition with the `@Timeout()` decorator. Pass the relative time offset (in milliseconds), from application startup, to the decorator as shown below:

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Called once after 5 seconds');
}
```

> info **Hint** This mechanism uses the JavaScript `setTimeout()` function under the hood.

If an exception occurs, it will be logged to the console, as every method annotated with `@Timeout()` is automatically wrapped in a `try-catch` block.

If you want to control your declarative timeout from outside the declaring class via the <a href="/techniques/task-scheduling#dynamic-schedule-module-api">Dynamic API</a>, associate the timeout with a name using the following construction:

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

The <a href="techniques/task-scheduling#dynamic-timeouts">Dynamic API</a> also enables **creating** dynamic timeouts, where the timeout's properties are defined at runtime, and **listing and deleting** them.

#### Dynamic schedule module API

The `@nestjs/schedule` module provides a dynamic API that enables managing declarative <a href="techniques/task-scheduling#declarative-cron-jobs">cron jobs</a>, <a href="techniques/task-scheduling#declarative-timeouts">timeouts</a> and <a href="techniques/task-scheduling#declarative-intervals">intervals</a>. The API also enables creating and managing **dynamic** cron jobs, timeouts and intervals, where the properties are defined at runtime.

#### Dynamic cron jobs

Obtain a reference to a `CronJob` instance by name from anywhere in your code using the `SchedulerRegistry` API. First, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

> info **Hint** Import the `SchedulerRegistry` from the `@nestjs/schedule` package.

Then use it in a class as follows. Assume a cron job was created with the following declaration:

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

Access this job using the following:

```typescript
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
```

The `getCronJob()` method returns the named cron job. The returned `CronJob` object has the following methods:

- `stop()` - stops a job that is scheduled to run.
- `start()` - restarts a job that has been stopped.
- `setTime(time: CronTime)` - stops a job, sets a new time for it, and then starts it
- `lastDate()` - returns a `DateTime` representation of the date on which the last execution of a job occurred.
- `nextDate()` - returns a `DateTime` representation of the date when the next execution of a job is scheduled.
- `nextDates(count: number)` - Provides an array (size `count`) of `DateTime` representations for the next set of dates that will trigger job execution. `count` defaults to 0, returning an empty array.

> info **Hint** Use `toJSDate()` on `DateTime` objects to render them as a JavaScript Date equivalent to this DateTime.

**Create** a new cron job dynamically using the `SchedulerRegistry#addCronJob` method, as follows:

```typescript
addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`time (${seconds}) for job ${name} to run!`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    `job ${name} added for each minute at ${seconds} seconds!`,
  );
}
```

In this code, we use the `CronJob` object from the `cron` package to create the cron job. The `CronJob` constructor takes a cron pattern (just like the `@Cron()` <a href="techniques/task-scheduling#declarative-cron-jobs">decorator</a>) as its first argument, and a callback to be executed when the cron timer fires as its second argument. The `SchedulerRegistry#addCronJob` method takes two arguments: a name for the `CronJob`, and the `CronJob` object itself.

> warning **Warning** Remember to inject the `SchedulerRegistry` before accessing it. Import `CronJob` from the `cron` package.

**Delete** a named cron job using the `SchedulerRegistry#deleteCronJob` method, as follows:

```typescript
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(`job ${name} deleted!`);
}
```

**List** all cron jobs using the `SchedulerRegistry#getCronJobs` method as follows:

```typescript
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDate().toJSDate();
    } catch (e) {
      next = 'error: next fire date is in the past!';
    }
    this.logger.log(`job: ${key} -> next: ${next}`);
  });
}
```

The `getCronJobs()` method returns a `map`. In this code, we iterate over the map and attempt to access the `nextDate()` method of each `CronJob`. In the `CronJob` API, if a job has already fired and has no future firing date, it throws an exception.

#### Dynamic intervals

Obtain a reference to an interval with the `SchedulerRegistry#getInterval` method. As above, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

And use it as follows:

```typescript
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
```

**Create** a new interval dynamically using the `SchedulerRegistry#addInterval` method, as follows:

```typescript
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Interval ${name} executing at time (${milliseconds})!`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
```

In this code, we create a standard JavaScript interval, then pass it to the `SchedulerRegistry#addInterval` method.
That method takes two arguments: a name for the interval, and the interval itself.

**Delete** a named interval using the `SchedulerRegistry#deleteInterval` method, as follows:

```typescript
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(`Interval ${name} deleted!`);
}
```

**List** all intervals using the `SchedulerRegistry#getIntervals` method as follows:

```typescript
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(`Interval: ${key}`));
}
```

#### Dynamic timeouts

Obtain a reference to a timeout with the `SchedulerRegistry#getTimeout` method. As above, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

And use it as follows:

```typescript
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
```

**Create** a new timeout dynamically using the `SchedulerRegistry#addTimeout` method, as follows:

```typescript
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Timeout ${name} executing after (${milliseconds})!`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
```

In this code, we create a standard JavaScript timeout, then pass it to the `SchedulerRegistry#addTimeout` method.
That method takes two arguments: a name for the timeout, and the timeout itself.

**Delete** a named timeout using the `SchedulerRegistry#deleteTimeout` method, as follows:

```typescript
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(`Timeout ${name} deleted!`);
}
```

**List** all timeouts using the `SchedulerRegistry#getTimeouts` method as follows:

```typescript
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(`Timeout: ${key}`));
}
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/27-scheduling).


---

## Testing

### Testing

Automated testing is considered an essential part of any serious software development effort. Automation makes it easy to repeat individual tests or test suites quickly and easily during development. This helps ensure that releases meet quality and performance goals. Automation helps increase coverage and provides a faster feedback loop to developers. Automation both increases the productivity of individual developers and ensures that tests are run at critical development lifecycle junctures, such as source code control check-in, feature integration, and version release.

Such tests often span a variety of types, including unit tests, end-to-end (e2e) tests, integration tests, and so on. While the benefits are unquestionable, it can be tedious to set them up. Nest strives to promote development best practices, including effective testing, so it includes features such as the following to help developers and teams build and automate tests. Nest:

- automatically scaffolds default unit tests for components and e2e tests for applications
- provides default tooling (such as a test runner that builds an isolated module/application loader)
- provides integration with [Jest](https://github.com/facebook/jest) and [Supertest](https://github.com/visionmedia/supertest) out-of-the-box, while remaining agnostic to testing tools
- makes the Nest dependency injection system available in the testing environment for easily mocking components

As mentioned, you can use any **testing framework** that you like, as Nest doesn't force any specific tooling. Simply replace the elements needed (such as the test runner), and you will still enjoy the benefits of Nest's ready-made testing facilities.

#### Installation

To get started, first install the required package:

```bash
$ npm i --save-dev @nestjs/testing
```

#### Unit testing

In the following example, we test two classes: `CatsController` and `CatsService`. As mentioned, [Jest](https://github.com/facebook/jest) is provided as the default testing framework. It serves as a test-runner and also provides assert functions and test-double utilities that help with mocking, spying, etc. In the following basic test, we manually instantiate these classes, and ensure that the controller and service fulfill their API contract.

```typescript
@@filename(cats.controller.spec)
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

> info **Hint** Keep your test files located near the classes they test. Testing files should have a `.spec` or `.test` suffix.

Because the above sample is trivial, we aren't really testing anything Nest-specific. Indeed, we aren't even using dependency injection (notice that we pass an instance of `CatsService` to our `catsController`). This form of testing - where we manually instantiate the classes being tested - is often called **isolated testing** as it is independent from the framework. Let's introduce some more advanced capabilities that help you test applications that make more extensive use of Nest features.

#### Testing utilities

The `@nestjs/testing` package provides a set of utilities that enable a more robust testing process. Let's rewrite the previous example using the built-in `Test` class:

```typescript
@@filename(cats.controller.spec)
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

The `Test` class is useful for providing an application execution context that essentially mocks the full Nest runtime, but gives you hooks that make it easy to manage class instances, including mocking and overriding. The `Test` class has a `createTestingModule()` method that takes a module metadata object as its argument (the same object you pass to the `@Module()` decorator). This method returns a `TestingModule` instance which in turn provides a few methods. For unit tests, the important one is the `compile()` method. This method bootstraps a module with its dependencies (similar to the way an application is bootstrapped in the conventional `main.ts` file using `NestFactory.create()`), and returns a module that is ready for testing.

> info **Hint** The `compile()` method is **asynchronous** and therefore has to be awaited. Once the module is compiled you can retrieve any **static** instance it declares (controllers and providers) using the `get()` method.

`TestingModule` inherits from the [module reference](/fundamentals/module-ref) class, and therefore its ability to dynamically resolve scoped providers (transient or request-scoped). Do this with the `resolve()` method (the `get()` method can only retrieve static instances).

```typescript
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
  providers: [CatsService],
}).compile();

catsService = await moduleRef.resolve(CatsService);
```

> warning **Warning** The `resolve()` method returns a unique instance of the provider, from its own **DI container sub-tree**. Each sub-tree has a unique context identifier. Thus, if you call this method more than once and compare instance references, you will see that they are not equal.

> info **Hint** Learn more about the module reference features [here](/fundamentals/module-ref).

Instead of using the production version of any provider, you can override it with a [custom provider](/fundamentals/custom-providers) for testing purposes. For example, you can mock a database service instead of connecting to a live database. We'll cover overrides in the next section, but they're available for unit tests as well.

<app-banner-courses></app-banner-courses>

#### Auto mocking

Nest also allows you to define a mock factory to apply to all of your missing dependencies. This is useful for cases where you have a large number of dependencies in a class and mocking all of them will take a long time and a lot of setup. To make use of this feature, the `createTestingModule()` will need to be chained up with the `useMocker()` method, passing a factory for your dependency mocks. This factory can take in an optional token, which is an instance token, any token which is valid for a Nest provider, and returns a mock implementation. The below is an example of creating a generic mocker using [`jest-mock`](https://www.npmjs.com/package/jest-mock) and a specific mock for `CatsService` using `jest.fn()`.

```typescript
// ...
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(
            mockMetadata,
          ) as ObjectConstructor;
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

You can also retrieve these mocks out of the testing container as you normally would custom providers, `moduleRef.get(CatsService)`.

> info **Hint** A general mock factory, like `createMock` from [`@golevelup/ts-jest`](https://github.com/golevelup/nestjs/tree/master/packages/testing) can also be passed directly.

> info **Hint** `REQUEST` and `INQUIRER` providers cannot be auto-mocked because they're already pre-defined in the context. However, they can be _overwritten_ using the custom provider syntax or by utilizing the `.overrideProvider` method.

#### End-to-end testing

Unlike unit testing, which focuses on individual modules and classes, end-to-end (e2e) testing covers the interaction of classes and modules at a more aggregate level -- closer to the kind of interaction that end-users will have with the production system. As an application grows, it becomes hard to manually test the end-to-end behavior of each API endpoint. Automated end-to-end tests help us ensure that the overall behavior of the system is correct and meets project requirements. To perform e2e tests we use a similar configuration to the one we just covered in **unit testing**. In addition, Nest makes it easy to use the [Supertest](https://github.com/visionmedia/supertest) library to simulate HTTP requests.

```typescript
@@filename(cats.e2e-spec)
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
@@switch
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

> info **Hint** If you're using [Fastify](/techniques/performance) as your HTTP adapter, it requires a slightly different configuration, and has built-in testing capabilities:
>
> ```ts
> let app: NestFastifyApplication;
>
> beforeAll(async () => {
>   app = moduleRef.createNestApplication<NestFastifyApplication>(
>     new FastifyAdapter(),
>   );
>
>   await app.init();
>   await app.getHttpAdapter().getInstance().ready();
> });
>
> it(`/GET cats`, () => {
>   return app
>     .inject({
>       method: 'GET',
>       url: '/cats',
>     })
>     .then((result) => {
>       expect(result.statusCode).toEqual(200);
>       expect(result.payload).toEqual(/* expectedPayload */);
>     });
> });
>
> afterAll(async () => {
>   await app.close();
> });
> ```

In this example, we build on some of the concepts described earlier. In addition to the `compile()` method we used earlier, we now use the `createNestApplication()` method to instantiate a full Nest runtime environment.

One caveat to consider is that when your application is compiled using the `compile()` method, the `HttpAdapterHost#httpAdapter` will be undefined at that time. This is because there isn't an HTTP adapter or server created yet during this compilation phase. If your test requires the `httpAdapter`, you should use the `createNestApplication()` method to create the application instance, or refactor your project to avoid this dependency when initializing the dependencies graph.

Alright, let's break down the example:

We save a reference to the running app in our `app` variable so we can use it to simulate HTTP requests.

We simulate HTTP tests using the `request()` function from Supertest. We want these HTTP requests to route to our running Nest app, so we pass the `request()` function a reference to the HTTP listener that underlies Nest (which, in turn, may be provided by the Express platform). Hence the construction `request(app.getHttpServer())`. The call to `request()` hands us a wrapped HTTP Server, now connected to the Nest app, which exposes methods to simulate an actual HTTP request. For example, using `request(...).get('/cats')` will initiate a request to the Nest app that is identical to an **actual** HTTP request like `get '/cats'` coming in over the network.

In this example, we also provide an alternate (test-double) implementation of the `CatsService` which simply returns a hard-coded value that we can test for. Use `overrideProvider()` to provide such an alternate implementation. Similarly, Nest provides methods to override modules, guards, interceptors, filters and pipes with the `overrideModule()`, `overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, and `overridePipe()` methods respectively.

Each of the override methods (except for `overrideModule()`) returns an object with 3 different methods that mirror those described for [custom providers](https://docs.nestjs.com/fundamentals/custom-providers):

- `useClass`: you supply a class that will be instantiated to provide the instance to override the object (provider, guard, etc.).
- `useValue`: you supply an instance that will override the object.
- `useFactory`: you supply a function that returns an instance that will override the object.

On the other hand, `overrideModule()` returns an object with the `useModule()` method, which you can use to supply a module that will override the original module, as follows:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideModule(CatsModule)
  .useModule(AlternateCatsModule)
  .compile();
```

Each of the override method types, in turn, returns the `TestingModule` instance, and can thus be chained with other methods in the [fluent style](https://en.wikipedia.org/wiki/Fluent_interface). You should use `compile()` at the end of such a chain to cause Nest to instantiate and initialize the module.

Also, sometimes you may want to provide a custom logger e.g. when the tests are run (for example, on a CI server). Use the `setLogger()` method and pass an object that fulfills the `LoggerService` interface to instruct the `TestModuleBuilder` how to log during tests (by default, only "error" logs will be logged to the console).

The compiled module has several useful methods, as described in the following table:

<table>
  <tr>
    <td>
      <code>createNestApplication()</code>
    </td>
    <td>
      Creates and returns a Nest application (<code>INestApplication</code> instance) based on the given module.
      Note that you must manually initialize the application using the <code>init()</code> method.
    </td>
  </tr>
  <tr>
    <td>
      <code>createNestMicroservice()</code>
    </td>
    <td>
      Creates and returns a Nest microservice (<code>INestMicroservice</code> instance) based on the given module.
    </td>
  </tr>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Retrieves a static instance of a controller or provider (including guards, filters, etc.) available in the application context. Inherited from the <a href="/fundamentals/module-ref">module reference</a> class.
    </td>
  </tr>
  <tr>
     <td>
      <code>resolve()</code>
    </td>
    <td>
      Retrieves a dynamically created scoped instance (request or transient) of a controller or provider (including guards, filters, etc.) available in the application context. Inherited from the <a href="/fundamentals/module-ref">module reference</a> class.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the module's dependency graph; can be used to retrieve a specific instance from the selected module (used along with strict mode (<code>strict: true</code>) in <code>get()</code> method).
    </td>
  </tr>
</table>

> info **Hint** Keep your e2e test files inside the `test` directory. The testing files should have a `.e2e-spec` suffix.

#### Overriding globally registered enhancers

If you have a globally registered guard (or pipe, interceptor, or filter), you need to take a few more steps to override that enhancer. To recap the original registration looks like this:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

This is registering the guard as a "multi"-provider through the `APP_*` token. To be able to replace the `JwtAuthGuard` here, the registration needs to use an existing provider in this slot:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
    // ^^^^^^^^ notice the use of 'useExisting' instead of 'useClass'
  },
  JwtAuthGuard,
],
```

> info **Hint** Change the `useClass` to `useExisting` to reference a registered provider instead of having Nest instantiate it behind the token.

Now the `JwtAuthGuard` is visible to Nest as a regular provider that can be overridden when creating the `TestingModule`:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

Now all your tests will use the `MockAuthGuard` on every request.

#### Testing request-scoped instances

[Request-scoped](/fundamentals/injection-scopes) providers are created uniquely for each incoming **request**. The instance is garbage-collected after the request has completed processing. This poses a problem, because we can't access a dependency injection sub-tree generated specifically for a tested request.

We know (based on the sections above) that the `resolve()` method can be used to retrieve a dynamically instantiated class. Also, as described <a href="https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers">here</a>, we know we can pass a unique context identifier to control the lifecycle of a DI container sub-tree. How do we leverage this in a testing context?

The strategy is to generate a context identifier beforehand and force Nest to use this particular ID to create a sub-tree for all incoming requests. In this way we'll be able to retrieve instances created for a tested request.

To accomplish this, use `jest.spyOn()` on the `ContextIdFactory`:

```typescript
const contextId = ContextIdFactory.create();
jest
  .spyOn(ContextIdFactory, 'getByRequest')
  .mockImplementation(() => contextId);
```

Now we can use the `contextId` to access a single generated DI container sub-tree for any subsequent request.

```typescript
catsService = await moduleRef.resolve(CatsService, contextId);
```


---

## Validation

### Validation

It is best practice to validate the correctness of any data sent into a web application. To automatically validate incoming requests, Nest provides several pipes available right out-of-the-box:

- `ValidationPipe`
- `ParseIntPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

The `ValidationPipe` makes use of the powerful [class-validator](https://github.com/typestack/class-validator) package and its declarative validation decorators. The `ValidationPipe` provides a convenient approach to enforce validation rules for all incoming client payloads, where the specific rules are declared with simple annotations in local class/DTO declarations in each module.

#### Overview

In the [Pipes](/pipes) chapter, we went through the process of building simple pipes and binding them to controllers, methods or to the global app to demonstrate how the process works. Be sure to review that chapter to best understand the topics of this chapter. Here, we'll focus on various **real world** use cases of the `ValidationPipe`, and show how to use some of its advanced customization features.

#### Using the built-in ValidationPipe

To begin using it, we first install the required dependency.

```bash
$ npm i --save class-validator class-transformer
```

> info **Hint** The `ValidationPipe` is exported from the `@nestjs/common` package.

Because this pipe uses the [`class-validator`](https://github.com/typestack/class-validator) and [`class-transformer`](https://github.com/typestack/class-transformer) libraries, there are many options available. You configure these settings via a configuration object passed to the pipe. Following are the built-in options:

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

In addition to these, all `class-validator` options (inherited from the `ValidatorOptions` interface) are available:

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>enableDebugMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will print extra warning messages to the console when something is not right.</td>
  </tr>
  <tr>
    <td><code>skipUndefinedProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are undefined in the validating object.</td>
  </tr>
  <tr>
    <td><code>skipNullProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are null in the validating object.</td>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are null or undefined in the validating object.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, instead of stripping non-whitelisted properties validator will throw an exception.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, attempts to validate unknown objects fail immediately.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validation errors will not be returned to the client.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>number</code></td>
    <td>This setting allows you to specify which exception type will be used in case of an error. By default it throws <code>BadRequestException</code>.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>Takes an array of the validation errors and returns an exception object to be thrown.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>Groups to be used during validation of the object.</td>
  </tr>
  <tr>
    <td><code>always</code></td>
    <td><code>boolean</code></td>
    <td>Set default for <code>always</code> option of decorators. Default can be overridden in decorator options.</td>
  </tr>

  <tr>
    <td><code>strictGroups</code></td>
    <td><code>boolean</code></td>
    <td>If <code>groups</code> is not given or is empty, ignore decorators with at least one group.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, the validation will not use default messages. Error message always will be <code>undefined</code>        if
      its not explicitly set.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if target should be exposed in <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if validated value should be exposed in <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>stopAtFirstError</code></td>
    <td><code>boolean</code></td>
    <td>When set to true, validation of the given property will stop after encountering the first error. Defaults to false.</td>
  </tr>
</table>

> info **Notice** Find more information about the `class-validator` package in its [repository](https://github.com/typestack/class-validator).

#### Auto-validation

We'll start by binding `ValidationPipe` at the application level, thus ensuring all endpoints are protected from receiving incorrect data.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

To test our pipe, let's create a basic endpoint.

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

> info **Hint** Since TypeScript does not store metadata about **generics or interfaces**, when you use them in your DTOs, `ValidationPipe` may not be able to properly validate incoming data. For this reason, consider using concrete classes in your DTOs.

> info **Hint** When importing your DTOs, you can't use a type-only import as that would be erased at runtime, i.e. remember to `import {{ '{' }} CreateUserDto {{ '}' }}` instead of `import type {{ '{' }} CreateUserDto {{ '}' }}`.

Now we can add a few validation rules in our `CreateUserDto`. We do this using decorators provided by the `class-validator` package, described in detail [here](https://github.com/typestack/class-validator#validation-decorators). In this fashion, any route that uses the `CreateUserDto` will automatically enforce these validation rules.

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

With these rules in place, if a request hits our endpoint with an invalid `email` property in the request body, the application will automatically respond with a `400 Bad Request` code, along with the following response body:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

In addition to validating request bodies, the `ValidationPipe` can be used with other request object properties as well. Imagine that we would like to accept `:id` in the endpoint path. To ensure that only numbers are accepted for this request parameter, we can use the following construct:

```typescript
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

`FindOneParams`, like a DTO, is simply a class that defines validation rules using `class-validator`. It would look like this:

```typescript
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}
```

#### Disable detailed errors

Error messages can be helpful to explain what was incorrect in a request. However, some production environments prefer to disable detailed errors. Do this by passing an options object to the `ValidationPipe`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
```

As a result, detailed error messages won't be displayed in the response body.

#### Stripping properties

Our `ValidationPipe` can also filter out properties that should not be received by the method handler. In this case, we can **whitelist** the acceptable properties, and any property not included in the whitelist is automatically stripped from the resulting object. For example, if our handler expects `email` and `password` properties, but a request also includes an `age` property, this property can be automatically removed from the resulting DTO. To enable such behavior, set `whitelist` to `true`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

When set to true, this will automatically remove non-whitelisted properties (those without any decorator in the validation class).

Alternatively, you can stop the request from processing when non-whitelisted properties are present, and return an error response to the user. To enable this, set the `forbidNonWhitelisted` option property to `true`, in combination with setting `whitelist` to `true`.

<app-banner-courses></app-banner-courses>

#### Transform payload objects

Payloads coming in over the network are plain JavaScript objects. The `ValidationPipe` can automatically transform payloads to be objects typed according to their DTO classes. To enable auto-transformation, set `transform` to `true`. This can be done at a method level:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

To enable this behavior globally, set the option on a global pipe:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
```

With the auto-transformation option enabled, the `ValidationPipe` will also perform conversion of primitive types. In the following example, the `findOne()` method takes one argument which represents an extracted `id` path parameter:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

By default, every path parameter and query parameter comes over the network as a `string`. In the above example, we specified the `id` type as a `number` (in the method signature). Therefore, the `ValidationPipe` will try to automatically convert a string identifier to a number.

#### Explicit conversion

In the above section, we showed how the `ValidationPipe` can implicitly transform query and path parameters based on the expected type. However, this feature requires having auto-transformation enabled.

Alternatively (with auto-transformation disabled), you can explicitly cast values using the `ParseIntPipe` or `ParseBoolPipe` (note that `ParseStringPipe` is not needed because, as mentioned earlier, every path parameter and query parameter comes over the network as a `string` by default).

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

> info **Hint** The `ParseIntPipe` and `ParseBoolPipe` are exported from the `@nestjs/common` package.

#### Mapped types

As you build out features like **CRUD** (Create/Read/Update/Delete) it's often useful to construct variants on a base entity type. Nest provides several utility functions that perform type transformations to make this task more convenient.

> **Warning** If your application uses the `@nestjs/swagger` package, see [this chapter](/openapi/mapped-types) for more information about Mapped Types. Likewise, if you use the `@nestjs/graphql` package see [this chapter](/graphql/mapped-types). Both packages heavily rely on types and so they require a different import to be used. Therefore, if you used `@nestjs/mapped-types` (instead of an appropriate one, either `@nestjs/swagger` or `@nestjs/graphql` depending on the type of your app), you may face various, undocumented side-effects.

When building input validation types (also called DTOs), it's often useful to build **create** and **update** variations on the same type. For example, the **create** variant may require all fields, while the **update** variant may make all fields optional.

Nest provides the `PartialType()` utility function to make this task easier and minimize boilerplate.

The `PartialType()` function returns a type (class) with all the properties of the input type set to optional. For example, suppose we have a **create** type as follows:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

By default, all of these fields are required. To create a type with the same fields, but with each one optional, use `PartialType()` passing the class reference (`CreateCatDto`) as an argument:

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **Hint** The `PartialType()` function is imported from the `@nestjs/mapped-types` package.

The `PickType()` function constructs a new type (class) by picking a set of properties from an input type. For example, suppose we start with a type like:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

We can pick a set of properties from this class using the `PickType()` utility function:

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **Hint** The `PickType()` function is imported from the `@nestjs/mapped-types` package.

The `OmitType()` function constructs a type by picking all properties from an input type and then removing a particular set of keys. For example, suppose we start with a type like:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

We can generate a derived type that has every property **except** `name` as shown below. In this construct, the second argument to `OmitType` is an array of property names.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **Hint** The `OmitType()` function is imported from the `@nestjs/mapped-types` package.

The `IntersectionType()` function combines two types into one new type (class). For example, suppose we start with two types like:

```typescript
export class CreateCatDto {
  name: string;
  breed: string;
}

export class AdditionalCatInfo {
  color: string;
}
```

We can generate a new type that combines all properties in both types.

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

> info **Hint** The `IntersectionType()` function is imported from the `@nestjs/mapped-types` package.

The type mapping utility functions are composable. For example, the following will produce a type (class) that has all of the properties of the `CreateCatDto` type except for `name`, and those properties will be set to optional:

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

#### Parsing and validating arrays

TypeScript does not store metadata about generics or interfaces, so when you use them in your DTOs, `ValidationPipe` may not be able to properly validate incoming data. For instance, in the following code, `createUserDtos` won't be correctly validated:

```typescript
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
```

To validate the array, create a dedicated class which contains a property that wraps the array, or use the `ParseArrayPipe`.

```typescript
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

In addition, the `ParseArrayPipe` may come in handy when parsing query parameters. Let's consider a `findByIds()` method that returns users based on identifiers passed as query parameters.

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

This construction validates the incoming query parameters from an HTTP `GET` request like the following:

```bash
GET /?ids=1,2,3
```

#### WebSockets and Microservices

While this chapter shows examples using HTTP style applications (e.g., Express or Fastify), the `ValidationPipe` works the same for WebSockets and microservices, regardless of the transport method that is used.

#### Learn more

Read more about custom validators, error messages, and available decorators as provided by the `class-validator` package [here](https://github.com/typestack/class-validator).


---

## Versioning

### Versioning

> info **Hint** This chapter is only relevant to HTTP-based applications.

Versioning allows you to have **different versions** of your controllers or individual routes running within the same application. Applications change very often and it is not unusual that there are breaking changes that you need to make while still needing to support the previous version of the application.

There are 4 types of versioning that are supported:

<table>
  <tr>
    <td><a href='techniques/versioning#uri-versioning-type'><code>URI Versioning</code></a></td>
    <td>The version will be passed within the URI of the request (default)</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#header-versioning-type'><code>Header Versioning</code></a></td>
    <td>A custom request header will specify the version</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#media-type-versioning-type'><code>Media Type Versioning</code></a></td>
    <td>The <code>Accept</code> header of the request will specify the version</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#custom-versioning-type'><code>Custom Versioning</code></a></td>
    <td>Any aspect of the request may be used to specify the version(s). A custom function is provided to extract said version(s).</td>
  </tr>
</table>

#### URI Versioning Type

URI Versioning uses the version passed within the URI of the request, such as `https://example.com/v1/route` and `https://example.com/v2/route`.

> warning **Notice** With URI Versioning the version will be automatically added to the URI after the <a href="faq/global-prefix">global path prefix</a> (if one exists), and before any controller or route paths.

To enable URI Versioning for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
// or "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
```

> warning **Notice** The version in the URI will be automatically prefixed with `v` by default, however the prefix value can be configured by setting the `prefix` key to your desired prefix or `false` if you wish to disable it.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Header Versioning Type

Header Versioning uses a custom, user specified, request header to specify the version where the value of the header will be the version to use for the request.

Example HTTP Requests for Header Versioning:

To enable **Header Versioning** for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
```

The `header` property should be the name of the header that will contain the version of the request.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Media Type Versioning Type

Media Type Versioning uses the `Accept` header of the request to specify the version.

Within the `Accept` header, the version will be separated from the media type with a semi-colon, `;`. It should then contain a key-value pair that represents the version to use for the request, such as `Accept: application/json;v=2`. They key is treated more as a prefix when determining the version will to be configured to include the key and separator.

To enable **Media Type Versioning** for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
```

The `key` property should be the key and separator of the key-value pair that contains the version. For the example `Accept: application/json;v=2`, the `key` property would be set to `v=`.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Custom Versioning Type

Custom Versioning uses any aspect of the request to specify the version (or versions). The incoming request is analyzed
using an `extractor` function that returns a string or array of strings.

If multiple versions are provided by the requester, the extractor function can return an array of strings, sorted in
order of greatest/highest version to smallest/lowest version. Versions are matched to routes in order from highest to
lowest.

If an empty string or array is returned from the `extractor`, no routes are matched and a 404 is returned.

For example, if an incoming request specifies it supports versions `1`, `2`, and `3`, the `extractor` **MUST** return `[3, 2, 1]`. This ensures that the highest possible route version is selected first.

If versions `[3, 2, 1]` are extracted, but routes only exist for version `2` and `1`, the route that matches version `2`
is selected (version `3` is automatically ignored).

> warning **Notice** Selecting the highest matching version based on the array returned from `extractor` > **does not reliably work** with the Express adapter due to design limitations. A single version (either a string or
> array of 1 element) works just fine in Express. Fastify correctly supports both highest matching version
> selection and single version selection.

To enable **Custom Versioning** for your application, create an `extractor` function and pass it into your application
like so:

```typescript
@@filename(main)
// Example extractor that pulls out a list of versions from a custom header and turns it into a sorted array.
// This example uses Fastify, but Express requests can be processed in a similar way.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
```

#### Usage

Versioning allows you to version controllers, individual routes, and also provides a way for certain resources to opt-out of versioning. The usage of versioning is the same regardless of the Versioning Type your application uses.

> warning **Notice** If versioning is enabled for the application but the controller or route does not specify the version, any requests to that controller/route will be returned a `404` response status. Similarly, if a request is received containing a version that does not have a corresponding controller or route, it will also be returned a `404` response status.

#### Controller versions

A version can be applied to a controller, setting the version for all routes within the controller.

To add a version to a controller do the following:

```typescript
@@filename(cats.controller)
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
@@switch
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1';
  }
}
```

#### Route versions

A version can be applied to an individual route. This version will override any other version that would effect the route, such as the Controller Version.

To add a version to an individual route do the following:

```typescript
@@filename(cats.controller)
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
@@switch
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'This action returns all cats for version 2';
  }
}
```

#### Multiple versions

Multiple versions can be applied to a controller or route. To use multiple versions, you would set the version to be an Array.

To add multiple versions do the following:

```typescript
@@filename(cats.controller)
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
@@switch
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1 or 2';
  }
}
```

#### Version "Neutral"

Some controllers or routes may not care about the version and would have the same functionality regardless of the version. To accommodate this, the version can be set to `VERSION_NEUTRAL` symbol.

An incoming request will be mapped to a `VERSION_NEUTRAL` controller or route regardless of the version sent in the request in addition to if the request does not contain a version at all.

> warning **Notice** For URI Versioning, a `VERSION_NEUTRAL` resource would not have the version present in the URI.

To add a version neutral controller or route do the following:

```typescript
@@filename(cats.controller)
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
@@switch
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats regardless of version';
  }
}
```

#### Global default version

If you do not want to provide a version for each controller/or individual routes, or if you want to have a specific version set as the default version for every controller/route that don't have the version specified, you could set the `defaultVersion` as follows:

```typescript
@@filename(main)
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // or
  defaultVersion: ['1', '2']
  // or
  defaultVersion: VERSION_NEUTRAL
});
```

#### Middleware versioning

[Middlewares](https://docs.nestjs.com/middleware) can also use versioning metadata to configure the middleware for a specific route's version. To do so, provide the version number as one of the parameters for the `MiddlewareConsumer.forRoutes()` method:

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

With the code above, the `LoggerMiddleware` will only be applied to the version '2' of `/cats` endpoint.

> info **Notice** Middlewares work with any versioning type described in the this section: `URI`, `Header`, `Media Type` or `Custom`.


---

