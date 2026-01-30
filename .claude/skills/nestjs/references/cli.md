# Cli

## CLI Plugin

### CLI Plugin

[TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html)'s metadata reflection system has several limitations which make it impossible to, for instance, determine what properties a class consists of or recognize whether a given property is optional or required. However, some of these constraints can be addressed at compilation time. Nest provides a plugin that enhances the TypeScript compilation process to reduce the amount of boilerplate code required.

> info **Hint** This plugin is **opt-in**. If you prefer, you can declare all decorators manually, or only specific decorators where you need them.

#### Overview

The Swagger plugin will automatically:

- annotate all DTO properties with `@ApiProperty` unless `@ApiHideProperty` is used
- set the `required` property depending on the question mark (e.g. `name?: string` will set `required: false`)
- set the `type` or `enum` property depending on the type (supports arrays as well)
- set the `default` property based on the assigned default value
- set several validation rules based on `class-validator` decorators (if `classValidatorShim` set to `true`)
- add a response decorator to every endpoint with a proper status and `type` (response model)
- generate descriptions for properties and endpoints based on comments (if `introspectComments` set to `true`)
- generate example values for properties based on comments (if `introspectComments` set to `true`)

Please, note that your filenames **must have** one of the following suffixes: `['.dto.ts', '.entity.ts']` (e.g., `create-user.dto.ts`) in order to be analysed by the plugin.

If you are using a different suffix, you can adjust the plugin's behavior by specifying the `dtoFileNameSuffix` option (see below).

Previously, if you wanted to provide an interactive experience with the Swagger UI,
you had to duplicate a lot of code to let the package know how your models/components should be declared in the specification. For example, you could define a simple `CreateUserDto` class as follows:

```typescript
export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: RoleEnum, default: [], isArray: true })
  roles: RoleEnum[] = [];

  @ApiProperty({ required: false, default: true })
  isEnabled?: boolean = true;
}
```

While not a significant issue with medium-sized projects, it becomes verbose & hard to maintain once you have a large set of classes.

By [enabling the Swagger plugin](/openapi/cli-plugin#using-the-cli-plugin), the above class definition can be declared simply:

```typescript
export class CreateUserDto {
  email: string;
  password: string;
  roles: RoleEnum[] = [];
  isEnabled?: boolean = true;
}
```

> info **Note** The Swagger plugin will derive the @ApiProperty() annotations from the TypeScript types and class-validator decorators. This helps in clearly describing your API for the generated Swagger UI documentation. However, the validation at runtime would still be handled by class-validator decorators. So, it is required to continue using validators like `IsEmail()`, `IsNumber()`, etc.

Hence, if you intend to rely on automatic annotations for generating documentations and still wish for runtime validations, then the class-validator decorators are still necessary.

> info **Hint** When using [mapped types utilities](https://docs.nestjs.com/openapi/mapped-types) (like `PartialType`) in DTOs import them from `@nestjs/swagger` instead of `@nestjs/mapped-types` for the plugin to pick up the schema.

The plugin adds appropriate decorators on the fly based on the **Abstract Syntax Tree**. Thus you won't have to struggle with `@ApiProperty` decorators scattered throughout the code.

> info **Hint** The plugin will automatically generate any missing swagger properties, but if you need to override them, you simply set them explicitly via `@ApiProperty()`.

#### Comments introspection

With the comments introspection feature enabled, CLI plugin will generate descriptions and example values for properties based on comments.

For example, given an example `roles` property:

```typescript
/**
 * A list of user's roles
 * @example ['admin']
 */
@ApiProperty({
  description: `A list of user's roles`,
  example: ['admin'],
})
roles: RoleEnum[] = [];
```

You must duplicate both description and example values. With `introspectComments` enabled, the CLI plugin can extract these comments and automatically provide descriptions (and examples, if defined) for properties. Now, the above property can be declared simply as follows:

```typescript
/**
 * A list of user's roles
 * @example ['admin']
 */
roles: RoleEnum[] = [];
```

There are `dtoKeyOfComment` and `controllerKeyOfComment` plugin options available for customizing how the plugin assigns values to the `ApiProperty` and `ApiOperation` decorators, respectively. See the example below:

```typescript
export class SomeController {
  /**
   * Create some resource
   */
  @Post()
  create() {}
}
```

This is equivalent to the following instruction:

```typescript
@ApiOperation({ summary: "Create some resource" })
```

> info **Hint** For models, the same logic applies but is used with the `ApiProperty` decorator instead.

For controllers, you can provide not only a summary but also a description (remarks), tags (such as` @deprecated`), and response examples, like this:

```ts
/**
 * Create a new cat
 *
 * @remarks This operation allows you to create a new cat.
 *
 * @deprecated
 * @throws {500} Something went wrong.
 * @throws {400} Bad Request.
 */
@Post()
async create(): Promise<Cat> {}
```

#### Using the CLI plugin

To enable the plugin, open `nest-cli.json` (if you use [Nest CLI](/cli/overview)) and add the following `plugins` configuration:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

You can use the `options` property to customize the behavior of the plugin.

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": false,
          "introspectComments": true,
          "skipAutoHttpCode": true
        }
      }
    ]
  }
}
```

The `options` property has to fulfill the following interface:

```typescript
export interface PluginOptions {
  dtoFileNameSuffix?: string[];
  controllerFileNameSuffix?: string[];
  classValidatorShim?: boolean;
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  skipAutoHttpCode?: boolean;
  esmCompatible?: boolean;
}
```

<table>
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>dtoFileNameSuffix</code></td>
    <td><code>['.dto.ts', '.entity.ts']</code></td>
    <td>DTO (Data Transfer Object) files suffix</td>
  </tr>
  <tr>
    <td><code>controllerFileNameSuffix</code></td>
    <td><code>.controller.ts</code></td>
    <td>Controller files suffix</td>
  </tr>
  <tr>
    <td><code>classValidatorShim</code></td>
    <td><code>true</code></td>
    <td>If set to true, the module will reuse <code>class-validator</code> validation decorators (e.g. <code>@Max(10)</code> will add <code>max: 10</code> to schema definition) </td>
  </tr>
  <tr>
    <td><code>dtoKeyOfComment</code></td>
    <td><code>'description'</code></td>
    <td>The property key to set the comment text to on <code>ApiProperty</code>.</td>
  </tr>
  <tr>
    <td><code>controllerKeyOfComment</code></td>
    <td><code>'summary'</code></td>
    <td>The property key to set the comment text to on <code>ApiOperation</code>.</td>
  </tr>
  <tr>
    <td><code>introspectComments</code></td>
    <td><code>false</code></td>
    <td>If set to true, plugin will generate descriptions and example values for properties based on comments</td>
  </tr>
  <tr>
    <td><code>skipAutoHttpCode</code></td>
    <td><code>false</code></td>
    <td>Disables the automatic addition of <code>@HttpCode()</code> in controllers</td>
  </tr>
  <tr>
    <td><code>esmCompatible</code></td>
    <td><code>false</code></td>
    <td>If set to true, resolves syntax errors encountered when using ESM (<code>&#123; "type": "module" &#125;</code>).</td>
  </tr>
</table>

Make sure to delete the `/dist` folder and rebuild your application whenever plugin options are updated.
If you don't use the CLI but instead have a custom `webpack` configuration, you can use this plugin in combination with `ts-loader`:

```javascript
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
```

#### SWC builder

For standard setups (non-monorepo), to use CLI Plugins with the SWC builder, you need to enable type checking, as described [here](/recipes/swc#type-checking).

```bash
$ nest start -b swc --type-check
```

For monorepo setups, follow the instructions [here](/recipes/swc#monorepo-and-cli-plugins).

```bash
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

Now, the serialized metadata file must be loaded by the `SwaggerModule#loadPluginMetadata` method, as shown below:

```typescript
import metadata from './metadata'; // <-- file auto-generated by the "PluginMetadataGenerator"

await SwaggerModule.loadPluginMetadata(metadata); // <-- here
const document = SwaggerModule.createDocument(app, config);
```

#### Integration with `ts-jest` (e2e tests)

To run e2e tests, `ts-jest` compiles your source code files on the fly, in memory. This means, it doesn't use Nest CLI compiler and does not apply any plugins or perform AST transformations.

To enable the plugin, create the following file in your e2e tests directory:

```javascript
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/swagger/plugin options (can be empty)
    },
    cs.program, // "cs.tsCompiler.program" for older versions of Jest (<= v27)
  );
};
```

With this in place, import AST transformer within your `jest` configuration file. By default (in the starter application), e2e tests configuration file is located under the `test` folder and is named `jest-e2e.json`.

If you use `jest@<29`, then use the snippet below.

```json
{
  ... // other configuration
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<path to the file created above>"]
      }
    }
  }
}
```

If you use `jest@^29`, then use the snippet below, as the previous approach got deprecated.

```json
{
  ... // other configuration
  "transform": {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        "astTransformers": {
          "before": ["<path to the file created above>"]
        }
      }
    ]
  }
}
```

#### Troubleshooting `jest` (e2e tests)

In case `jest` does not seem to pick up your configuration changes, it's possible that Jest has already **cached** the build result. To apply the new configuration, you need to clear Jest's cache directory.

To clear the cache directory, run the following command in your NestJS project folder:

```bash
$ npx jest --clearCache
```

In case the automatic cache clearance fails, you can still manually remove the cache folder with the following commands:

```bash
# Find jest cache directory (usually /tmp/jest_rs)
# by running the following command in your NestJS project root
$ npx jest --showConfig | grep cache
# ex result:
#   "cache": true,
#   "cacheDirectory": "/tmp/jest_rs"

# Remove or empty the Jest cache directory
$ rm -rf  <cacheDirectory value>
# ex:
# rm -rf /tmp/jest_rs
```


---

## CLI command reference

### CLI command reference

#### nest new

Creates a new (standard mode) Nest project.

```bash
$ nest new <name> [options]
$ nest n <name> [options]
```

##### Description

Creates and initializes a new Nest project. Prompts for package manager.

- Creates a folder with the given `<name>`
- Populates the folder with configuration files
- Creates sub-folders for source code (`/src`) and end-to-end tests (`/test`)
- Populates the sub-folders with default files for app components and tests

##### Arguments

| Argument | Description                 |
| -------- | --------------------------- |
| `<name>` | The name of the new project |

##### Options

| Option                                | Description                                                                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                           | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                                                                                                             |
| `--skip-git`                          | Skip git repository initialization.<br/> Alias: `-g`                                                                                                                                                 |
| `--skip-install`                      | Skip package installation.<br/> Alias: `-s`                                                                                                                                                          |
| `--package-manager [package-manager]` | Specify package manager. Use `npm`, `yarn`, or `pnpm`. Package manager must be installed globally.<br/> Alias: `-p`                                                                                  |
| `--language [language]`               | Specify programming language (`TS` or `JS`).<br/> Alias: `-l`                                                                                                                                        |
| `--collection [collectionName]`       | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c`                                                                                      |
| `--strict`                            | Start the project with the following TypeScript compiler flags enabled: `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch` |

#### nest generate

Generates and/or modifies files based on a schematic

```bash
$ nest generate <schematic> <name> [options]
$ nest g <schematic> <name> [options]
```

##### Arguments

| Argument      | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `<schematic>` | The `schematic` or `collection:schematic` to generate. See the table below for the available schematics. |
| `<name>`      | The name of the generated component.                                                                     |

##### Schematics

| Name          | Alias | Description                                                                                                            |
| ------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `app`         |       | Generate a new application within a monorepo (converting to monorepo if it's a standard structure).                    |
| `library`     | `lib` | Generate a new library within a monorepo (converting to monorepo if it's a standard structure).                        |
| `class`       | `cl`  | Generate a new class.                                                                                                  |
| `controller`  | `co`  | Generate a controller declaration.                                                                                     |
| `decorator`   | `d`   | Generate a custom decorator.                                                                                           |
| `filter`      | `f`   | Generate a filter declaration.                                                                                         |
| `gateway`     | `ga`  | Generate a gateway declaration.                                                                                        |
| `guard`       | `gu`  | Generate a guard declaration.                                                                                          |
| `interface`   | `itf` | Generate an interface.                                                                                                 |
| `interceptor` | `itc` | Generate an interceptor declaration.                                                                                   |
| `middleware`  | `mi`  | Generate a middleware declaration.                                                                                     |
| `module`      | `mo`  | Generate a module declaration.                                                                                         |
| `pipe`        | `pi`  | Generate a pipe declaration.                                                                                           |
| `provider`    | `pr`  | Generate a provider declaration.                                                                                       |
| `resolver`    | `r`   | Generate a resolver declaration.                                                                                       |
| `resource`    | `res` | Generate a new CRUD resource. See the [CRUD (resource) generator](/recipes/crud-generator) for more details. (TS only) |
| `service`     | `s`   | Generate a service declaration.                                                                                        |

##### Options

| Option                          | Description                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                        |
| `--project [project]`           | Project that element should be added to.<br/> Alias: `-p`                                                       |
| `--flat`                        | Do not generate a folder for the element.                                                                       |
| `--collection [collectionName]` | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c` |
| `--spec`                        | Enforce spec files generation (default)                                                                         |
| `--no-spec`                     | Disable spec files generation                                                                                   |

#### nest build

Compiles an application or workspace into an output folder.

Also, the `build` command is responsible for:

- mapping paths (if using path aliases) via `tsconfig-paths`
- annotating DTOs with OpenAPI decorators (if `@nestjs/swagger` CLI plugin is enabled)
- annotating DTOs with GraphQL decorators (if `@nestjs/graphql` CLI plugin is enabled)

```bash
$ nest build <name> [options]
```

##### Arguments

| Argument | Description                       |
| -------- | --------------------------------- |
| `<name>` | The name of the project to build. |

##### Options

| Option                  | Description                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                                                                                   |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                                                                                     |
| `--watch`               | Run in watch mode (live-reload).<br /> If you're using `tsc` for compilation, you can type `rs` to restart the application (when `manualRestart` option is set to `true`). <br/>Alias `-w` |
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `webpack`). <br/>Alias `-b`                                                                                                   |
| `--webpack`             | Use webpack for compilation (deprecated: use `--builder webpack` instead).                                                                                                                 |
| `--webpackPath`         | Path to webpack configuration.                                                                                                                                                             |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                                                                           |
| `--watchAssets`         | Watch non-TS files (assets like `.graphql` etc.). See [Assets](cli/monorepo#assets) for more details.                                                                                      |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                                                                                   |
| `--all`                 | Build all projects in a monorepo.                                                                                                                                                          |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                                                                         |

#### nest start

Compiles and runs an application (or default project in a workspace).

```bash
$ nest start <name> [options]
```

##### Arguments

| Argument | Description                     |
| -------- | ------------------------------- |
| `<name>` | The name of the project to run. |

##### Options

| Option                  | Description                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                           |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                             |
| `--watch`               | Run in watch mode (live-reload) <br/>Alias `-w`                                                                                    |
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `webpack`). <br/>Alias `-b`                                           |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                 |
| `--watchAssets`         | Run in watch mode (live-reload), watching non-TS files (assets). See [Assets](cli/monorepo#assets) for more details.               |
| `--debug [hostport]`    | Run in debug mode (with --inspect flag) <br/>Alias `-d`                                                                            |
| `--webpack`             | Use webpack for compilation. (deprecated: use `--builder webpack` instead)                                                         |
| `--webpackPath`         | Path to webpack configuration.                                                                                                     |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                   |
| `--exec [binary]`       | Binary to run (default: `node`). <br/>Alias `-e`                                                                                   |
| `--no-shell`            | Do not spawn child processes within a shell (see node's `child_process.spawn()` method docs).                                      |
| `--env-file`            | Loads environment variables from a file relative to the current directory, making them available to applications on `process.env`. |
| `-- [key=value]`        | Command-line arguments that can be referenced with `process.argv`.                                                                 |

#### nest add

Imports a library that has been packaged as a **nest library**, running its install schematic.

```bash
$ nest add <name> [options]
```

##### Arguments

| Argument | Description                        |
| -------- | ---------------------------------- |
| `<name>` | The name of the library to import. |

#### nest info

Displays information about installed nest packages and other helpful system info. For example:

```bash
$ nest info
```

```bash
 _   _             _      ___  _____  _____  _     _____
| \ | |           | |    |_  |/  ___|/  __ \| |   |_   _|
|  \| |  ___  ___ | |_     | |\ `--. | /  \/| |     | |
| . ` | / _ \/ __|| __|    | | `--. \| |    | |     | |
| |\  ||  __/\__ \| |_ /\__/ //\__/ /| \__/\| |_____| |_
\_| \_/ \___||___/ \__|\____/ \____/  \____/\_____/\___/

[System Information]
OS Version : macOS High Sierra
NodeJS Version : v20.18.0
[Nest Information]
microservices version : 10.0.0
websockets version : 10.0.0
testing version : 10.0.0
common version : 10.0.0
core version : 10.0.0
```


---

## Libraries

### Libraries

Many applications need to solve the same general problems, or re-use a modular component in several different contexts. Nest has a few ways of addressing this, but each works at a different level to solve the problem in a way that helps meet different architectural and organizational objectives.

Nest [modules](/modules) are useful for providing an execution context that enables sharing components within a single application. Modules can also be packaged with [npm](https://npmjs.com) to create a reusable library that can be installed in different projects. This can be an effective way to distribute configurable, re-usable libraries that can be used by different, loosely connected or unaffiliated organizations (e.g., by distributing/installing 3rd party libraries).

For sharing code within closely organized groups (e.g., within company/project boundaries), it can be useful to have a more lightweight approach to sharing components. Monorepos have arisen as a construct to enable that, and within a monorepo, a **library** provides a way to share code in an easy, lightweight fashion. In a Nest monorepo, using libraries enables easy assembly of applications that share components. In fact, this encourages decomposition of monolithic applications and development processes to focus on building and composing modular components.

#### Nest libraries

A Nest library is a Nest project that differs from an application in that it cannot run on its own. A library must be imported into a containing application in order for its code to execute. The built-in support for libraries described in this section is only available for **monorepos** (standard mode projects can achieve similar functionality using npm packages).

For example, an organization may develop an `AuthModule` that manages authentication by implementing company policies that govern all internal applications. Rather than build that module separately for each application, or physically packaging the code with npm and requiring each project to install it, a monorepo can define this module as a library. When organized this way, all consumers of the library module can see an up-to-date version of the `AuthModule` as it is committed. This can have significant benefits for coordinating component development and assembly, and simplifying end-to-end testing.

#### Creating libraries

Any functionality that is suitable for re-use is a candidate for being managed as a library. Deciding what should be a library, and what should be part of an application, is an architectural design decision. Creating libraries involves more than simply copying code from an existing application to a new library. When packaged as a library, the library code must be decoupled from the application. This may require **more** time up front and force some design decisions that you may not face with more tightly coupled code. But this additional effort can pay off when the library can be used to enable more rapid application assembly across multiple applications.

To get started with creating a library, run the following command:

```bash
$ nest g library my-library
```

When you run the command, the `library` schematic prompts you for a prefix (AKA alias) for the library:

```bash
What prefix would you like to use for the library (default: @app)?
```

This creates a new project in your workspace called `my-library`.
A library-type project, like an application-type project, is generated into a named folder using a schematic. Libraries are managed under the `libs` folder of the monorepo root. Nest creates the `libs` folder the first time a library is created.

The files generated for a library are slightly different from those generated for an application. Here is the contents of the `libs` folder after executing the command above:

<div class="file-tree">
  <div class="item">libs</div>
  <div class="children">
    <div class="item">my-library</div>
    <div class="children">
      <div class="item">src</div>
      <div class="children">
        <div class="item">index.ts</div>
        <div class="item">my-library.module.ts</div>
        <div class="item">my-library.service.ts</div>
      </div>
      <div class="item">tsconfig.lib.json</div>
    </div>
  </div>
</div>

The `nest-cli.json` file will have a new entry for the library under the `"projects"` key:

```javascript
...
{
    "my-library": {
      "type": "library",
      "root": "libs/my-library",
      "entryFile": "index",
      "sourceRoot": "libs/my-library/src",
      "compilerOptions": {
        "tsConfigPath": "libs/my-library/tsconfig.lib.json"
      }
}
...
```

There are two differences in `nest-cli.json` metadata between libraries and applications:

- the `"type"` property is set to `"library"` instead of `"application"`
- the `"entryFile"` property is set to `"index"` instead of `"main"`

These differences key the build process to handle libraries appropriately. For example, a library exports its functions through the `index.js` file.

As with application-type projects, libraries each have their own `tsconfig.lib.json` file that extends the root (monorepo-wide) `tsconfig.json` file. You can modify this file, if necessary, to provide library-specific compiler options.

You can build the library with the CLI command:

```bash
$ nest build my-library
```

#### Using libraries

With the automatically generated configuration files in place, using libraries is straightforward. How would we import `MyLibraryService` from the `my-library` library into the `my-project` application?

First, note that using library modules is the same as using any other Nest module. What the monorepo does is manage paths in a way that importing libraries and generating builds is now transparent. To use `MyLibraryService`, we need to import its declaring module. We can modify `my-project/src/app.module.ts` as follows to import `MyLibraryModule`.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLibraryModule } from '@app/my-library';

@Module({
  imports: [MyLibraryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Notice above that we've used a path alias of `@app` in the ES module `import` line, which was the `prefix` we supplied with the `nest g library` command above. Under the covers, Nest handles this through tsconfig path mapping. When adding a library, Nest updates the global (monorepo) `tsconfig.json` file's `"paths"` key like this:

```javascript
"paths": {
    "@app/my-library": [
        "libs/my-library/src"
    ],
    "@app/my-library/*": [
        "libs/my-library/src/*"
    ]
}
```

So, in a nutshell, the combination of the monorepo and library features has made it easy and intuitive to include library modules into applications.

This same mechanism enables building and deploying applications that compose libraries. Once you've imported the `MyLibraryModule`, running `nest build` handles all the module resolution automatically and bundles the app along with any library dependencies, for deployment. The default compiler for a monorepo is **webpack**, so the resulting distribution file is a single file that bundles all of the transpiled JavaScript files into a single file. You can also switch to `tsc` as described <a href="https://docs.nestjs.com/cli/monorepo#global-compiler-options">here</a>.


---

## Nest CLI and scripts

### Nest CLI and scripts

This section provides additional background on how the `nest` command interacts with compilers and scripts to help DevOps personnel manage the development environment.

A Nest application is a **standard** TypeScript application that needs to be compiled to JavaScript before it can be executed. There are various ways to accomplish the compilation step, and developers/teams are free to choose a way that works best for them. With that in mind, Nest provides a set of tools out-of-the-box that seek to do the following:

- Provide a standard build/execute process, available at the command line, that "just works" with reasonable defaults.
- Ensure that the build/execute process is **open**, so developers can directly access the underlying tools to customize them using native features and options.
- Remain a completely standard TypeScript/Node.js framework, so that the entire compile/deploy/execute pipeline can be managed by any external tools that the development team chooses to use.

This goal is accomplished through a combination of the `nest` command, a locally installed TypeScript compiler, and `package.json` scripts. We describe how these technologies work together below. This should help you understand what's happening at each step of the build/execute process, and how to customize that behavior if necessary.

#### The nest binary

The `nest` command is an OS level binary (i.e., runs from the OS command line). This command actually encompasses 3 distinct areas, described below. We recommend that you run the build (`nest build`) and execution (`nest start`) sub-commands via the `package.json` scripts provided automatically when a project is scaffolded (see [typescript starter](https://github.com/nestjs/typescript-starter) if you wish to start by cloning a repo, instead of running `nest new`).

#### Build

`nest build` is a wrapper on top of the standard `tsc` compiler or `swc` compiler (for [standard projects](https://docs.nestjs.com/cli/overview#project-structure)) or the webpack bundler using the `ts-loader` (for [monorepos](https://docs.nestjs.com/cli/overview#project-structure)). It does not add any other compilation features or steps except for handling `tsconfig-paths` out of the box. The reason it exists is that most developers, especially when starting out with Nest, do not need to adjust compiler options (e.g., `tsconfig.json` file) which can sometimes be tricky.

See the [nest build](https://docs.nestjs.com/cli/usages#nest-build) documentation for more details.

#### Execution

`nest start` simply ensures the project has been built (same as `nest build`), then invokes the `node` command in a portable, easy way to execute the compiled application. As with builds, you are free to customize this process as needed, either using the `nest start` command and its options, or completely replacing it. The entire process is a standard TypeScript application build and execute pipeline, and you are free to manage the process as such.

See the [nest start](https://docs.nestjs.com/cli/usages#nest-start) documentation for more details.

#### Generation

The `nest generate` commands, as the name implies, generate new Nest projects, or components within them.

#### Package scripts

Running the `nest` commands at the OS command level requires that the `nest` binary be installed globally. This is a standard feature of npm, and outside of Nest's direct control. One consequence of this is that the globally installed `nest` binary is **not** managed as a project dependency in `package.json`. For example, two different developers can be running two different versions of the `nest` binary. The standard solution for this is to use package scripts so that you can treat the tools used in the build and execute steps as development dependencies.

When you run `nest new`, or clone the [typescript starter](https://github.com/nestjs/typescript-starter), Nest populates the new project's `package.json` scripts with commands like `build` and `start`. It also installs the underlying compiler tools (such as `typescript`) as **dev dependencies**.

You run the build and execute scripts with commands like:

```bash
$ npm run build
```

and

```bash
$ npm run start
```

These commands use npm's script running capabilities to execute `nest build` or `nest start` using the **locally installed** `nest` binary. By using these built-in package scripts, you have full dependency management over the Nest CLI commands\*. This means that, by following this **recommended** usage, all members of your organization can be assured of running the same version of the commands.

\*This applies to the `build` and `start` commands. The `nest new` and `nest generate` commands aren't part of the build/execute pipeline, so they operate in a different context, and do not come with built-in `package.json` scripts.

For most developers/teams, it is recommended to utilize the package scripts for building and executing their Nest projects. You can fully customize the behavior of these scripts via their options (`--path`, `--webpack`, `--webpackPath`) and/or customize the `tsc` or webpack compiler options files (e.g., `tsconfig.json`) as needed. You are also free to run a completely custom build process to compile the TypeScript (or even to execute TypeScript directly with `ts-node`).

#### Backward compatibility

Because Nest applications are pure TypeScript applications, previous versions of the Nest build/execute scripts will continue to operate. You are not required to upgrade them. You can choose to take advantage of the new `nest build` and `nest start` commands when you are ready, or continue running previous or customized scripts.

#### Migration

While you are not required to make any changes, you may want to migrate to using the new CLI commands instead of using tools such as `tsc-watch` or `ts-node`. In this case, simply install the latest version of the `@nestjs/cli`, both globally and locally:

```bash
$ npm install -g @nestjs/cli
$ cd  /some/project/root/folder
$ npm install -D @nestjs/cli
```

You can then replace the `scripts` defined in `package.json` with the following ones:

```typescript
"build": "nest build",
"start": "nest start",
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
```


---

## Workspaces

### Workspaces

Nest has two modes for organizing code:

- **standard mode**: useful for building individual project-focused applications that have their own dependencies and settings, and don't need to optimize for sharing modules, or optimizing complex builds. This is the default mode.
- **monorepo mode**: this mode treats code artifacts as part of a lightweight **monorepo**, and may be more appropriate for teams of developers and/or multi-project environments. It automates parts of the build process to make it easy to create and compose modular components, promotes code re-use, makes integration testing easier, makes it easy to share project-wide artifacts like `eslint` rules and other configuration policies, and is easier to use than alternatives like Git submodules. Monorepo mode employs the concept of a **workspace**, represented in the `nest-cli.json` file, to coordinate the relationship between the components of the monorepo.

It's important to note that virtually all of Nest's features are independent of your code organization mode. The **only** effect of this choice is how your projects are composed and how build artifacts are generated. All other functionality, from the CLI to core modules to add-on modules work the same in either mode.

Also, you can easily switch from **standard mode** to **monorepo mode** at any time, so you can delay this decision until the benefits of one or the other approach become more clear.

#### Standard mode

When you run `nest new`, a new **project** is created for you using a built-in schematic. Nest does the following:

1. Create a new folder, corresponding to the `name` argument you provide to `nest new`
2. Populate that folder with default files corresponding to a minimal base-level Nest application. You can examine these files at the [typescript-starter](https://github.com/nestjs/typescript-starter) repository.
3. Provide additional files such as `nest-cli.json`, `package.json` and `tsconfig.json` that configure and enable various tools for compiling, testing and serving your application.

From there, you can modify the starter files, add new components, add dependencies (e.g., `npm install`), and otherwise develop your application as covered in the rest of this documentation.

#### Monorepo mode

To enable monorepo mode, you start with a _standard mode_ structure, and add **projects**. A project can be a full **application** (which you add to the workspace with the command `nest generate app`) or a **library** (which you add to the workspace with the command `nest generate library`). We'll discuss the details of these specific types of project components below. The key point to note now is that it is the **act of adding a project** to an existing standard mode structure that **converts it** to monorepo mode. Let's look at an example.

If we run:

```bash
$ nest new my-project
```

We've constructed a _standard mode_ structure, with a folder structure that looks like this:

<div class="file-tree">
  <div class="item">node_modules</div>
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">eslint.config.mjs</div>
</div>

We can convert this to a monorepo mode structure as follows:

```bash
$ cd my-project
$ nest generate app my-app
```

At this point, `nest` converts the existing structure to a **monorepo mode** structure. This results in a few important changes. The folder structure now looks like this:

<div class="file-tree">
  <div class="item">apps</div>
    <div class="children">
      <div class="item">my-app</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
      <div class="item">my-project</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
    </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">eslint.config.mjs</div>
</div>

The `generate app` schematic has reorganized the code - moving each **application** project under the `apps` folder, and adding a project-specific `tsconfig.app.json` file in each project's root folder. Our original `my-project` app has become the **default project** for the monorepo, and is now a peer with the just-added `my-app`, located under the `apps` folder. We'll cover default projects below.

> error **Warning** The conversion of a standard mode structure to monorepo only works for projects that have followed the canonical Nest project structure. Specifically, during conversion, the schematic attempts to relocate the `src` and `test` folders in a project folder beneath the `apps` folder in the root. If a project does not use this structure, the conversion will fail or produce unreliable results.

#### Workspace projects

A monorepo uses the concept of a workspace to manage its member entities. Workspaces are composed of **projects**. A project may be either:

- an **application**: a full Nest application including a `main.ts` file to bootstrap the application. Aside from compile and build considerations, an application-type project within a workspace is functionally identical to an application within a _standard mode_ structure.
- a **library**: a library is a way of packaging a general purpose set of features (modules, providers, controllers, etc.) that can be used within other projects. A library cannot run on its own, and has no `main.ts` file. Read more about libraries [here](/cli/libraries).

All workspaces have a **default project** (which should be an application-type project). This is defined by the top-level `"root"` property in the `nest-cli.json` file, which points at the root of the default project (see [CLI properties](/cli/monorepo#cli-properties) below for more details). Usually, this is the **standard mode** application you started with, and later converted to a monorepo using `nest generate app`. When you follow these steps, this property is populated automatically.

Default projects are used by `nest` commands like `nest build` and `nest start` when a project name is not supplied.

For example, in the above monorepo structure, running

```bash
$ nest start
```

will start up the `my-project` app. To start `my-app`, we'd use:

```bash
$ nest start my-app
```

#### Applications

Application-type projects, or what we might informally refer to as just "applications", are complete Nest applications that you can run and deploy. You generate an application-type project with `nest generate app`.

This command automatically generates a project skeleton, including the standard `src` and `test` folders from the [typescript starter](https://github.com/nestjs/typescript-starter). Unlike standard mode, an application project in a monorepo does not have any of the package dependency (`package.json`) or other project configuration artifacts like `.prettierrc` and `eslint.config.mjs`. Instead, the monorepo-wide dependencies and config files are used.

However, the schematic does generate a project-specific `tsconfig.app.json` file in the root folder of the project. This config file automatically sets appropriate build options, including setting the compilation output folder properly. The file extends the top-level (monorepo) `tsconfig.json` file, so you can manage global settings monorepo-wide, but override them if needed at the project level.

#### Libraries

As mentioned, library-type projects, or simply "libraries", are packages of Nest components that need to be composed into applications in order to run. You generate a library-type project with `nest generate library`. Deciding what belongs in a library is an architectural design decision. We discuss libraries in depth in the [libraries](/cli/libraries) chapter.

#### CLI properties

Nest keeps the metadata needed to organize, build and deploy both standard and monorepo structured projects in the `nest-cli.json` file. Nest automatically adds to and updates this file as you add projects, so you usually do not have to think about it or edit its contents. However, there are some settings you may want to change manually, so it's helpful to have an overview understanding of the file.

After running the steps above to create a monorepo, our `nest-cli.json` file looks like this:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/my-project/src",
  "monorepo": true,
  "root": "apps/my-project",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/my-project/tsconfig.app.json"
  },
  "projects": {
    "my-project": {
      "type": "application",
      "root": "apps/my-project",
      "entryFile": "main",
      "sourceRoot": "apps/my-project/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-project/tsconfig.app.json"
      }
    },
    "my-app": {
      "type": "application",
      "root": "apps/my-app",
      "entryFile": "main",
      "sourceRoot": "apps/my-app/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-app/tsconfig.app.json"
      }
    }
  }
}
```

The file is divided into sections:

- a global section with top-level properties controlling standard and monorepo-wide settings
- a top level property (`"projects"`) with metadata about each project. This section is present only for monorepo-mode structures.

The top-level properties are as follows:

- `"collection"`: points at the collection of schematics used to generate components; you generally should not change this value
- `"sourceRoot"`: points at the root of the source code for the single project in standard mode structures, or the _default project_ in monorepo mode structures
- `"compilerOptions"`: a map with keys specifying compiler options and values specifying the option setting; see details below
- `"generateOptions"`: a map with keys specifying global generate options and values specifying the option setting; see details below
- `"monorepo"`: (monorepo only) for a monorepo mode structure, this value is always `true`
- `"root"`: (monorepo only) points at the project root of the _default project_

#### Global compiler options

These properties specify the compiler to use as well as various options that affect **any** compilation step, whether as part of `nest build` or `nest start`, and regardless of the compiler, whether `tsc` or webpack.

| Property Name       | Property Value Type | Description                                                                                                                                                                                                                                                               |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webpack`           | boolean             | If `true`, use [webpack compiler](https://webpack.js.org/). If `false` or not present, use `tsc`. In monorepo mode, the default is `true` (use webpack), in standard mode, the default is `false` (use `tsc`). See below for details. (deprecated: use `builder` instead) |
| `tsConfigPath`      | string              | (**monorepo only**) Points at the file containing the `tsconfig.json` settings that will be used when `nest build` or `nest start` is called without a `project` option (e.g., when the default project is built or started).                                             |
| `webpackConfigPath` | string              | Points at a webpack options file. If not specified, Nest looks for the file `webpack.config.js`. See below for more details.                                                                                                                                              |
| `deleteOutDir`      | boolean             | If `true`, whenever the compiler is invoked, it will first remove the compilation output directory (as configured in `tsconfig.json`, where the default is `./dist`).                                                                                                     |
| `assets`            | array               | Enables automatically distributing non-TypeScript assets whenever a compilation step begins (asset distribution does **not** happen on incremental compiles in `--watch` mode). See below for details.                                                                    |
| `watchAssets`       | boolean             | If `true`, run in watch-mode, watching **all** non-TypeScript assets. (For more fine-grained control of the assets to watch, see [Assets](cli/monorepo#assets) section below).                                                                                            |
| `manualRestart`     | boolean             | If `true`, enables the shortcut `rs` to manually restart the server. Default value is `false`.                                                                                                                                                                            |
| `builder`           | string/object       | Instructs CLI on what `builder` to use to compile the project (`tsc`, `swc`, or `webpack`). To customize builder's behavior, you can pass an object containing two attributes: `type` (`tsc`, `swc`, or `webpack`) and `options`.                                         |
| `typeCheck`         | boolean             | If `true`, enables type checking for SWC-driven projects (when `builder` is `swc`). Default value is `false`.                                                                                                                                                             |

#### Global generate options

These properties specify the default generate options to be used by the `nest generate` command.

| Property Name | Property Value Type | Description                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`        | boolean _or_ object | If the value is boolean, a value of `true` enables `spec` generation by default and a value of `false` disables it. A flag passed on the CLI command line overrides this setting, as does a project-specific `generateOptions` setting (more below). If the value is an object, each key represents a schematic name, and the boolean value determines whether the default spec generation is enabled / disabled for that specific schematic. |
| `flat`        | boolean             | If true, all generate commands will generate a flat structure                                                                                                                                                                                                                                                                                                                                                                                 |

The following example uses a boolean value to specify that spec file generation should be disabled by default for all projects:

```javascript
{
  "generateOptions": {
    "spec": false
  },
  ...
}
```

The following example uses a boolean value to specify flat file generation should be the default for all projects:

```javascript
{
  "generateOptions": {
    "flat": true
  },
  ...
}
```

In the following example, `spec` file generation is disabled only for `service` schematics (e.g., `nest generate service...`):

```javascript
{
  "generateOptions": {
    "spec": {
      "service": false
    }
  },
  ...
}
```

> warning **Warning** When specifying the `spec` as an object, the key for the generation schematic does not currently support automatic alias handling. This means that specifying a key as for example `service: false` and trying to generate a service via the alias `s`, the spec would still be generated. To make sure both the normal schematic name and the alias work as intended, specify both the normal command name as well as the alias, as seen below.
>
> ```javascript
> {
>   "generateOptions": {
>     "spec": {
>       "service": false,
>       "s": false
>     }
>   },
>   ...
> }
> ```

#### Project-specific generate options

In addition to providing global generate options, you may also specify project-specific generate options. The project specific generate options follow the exact same format as the global generate options, but are specified directly on each project.

Project-specific generate options override global generate options.

```javascript
{
  "projects": {
    "cats-project": {
      "generateOptions": {
        "spec": {
          "service": false
        }
      },
      ...
    }
  },
  ...
}
```

> warning **Warning** The order of precedence for generate options is as follows. Options specified on the CLI command line take precedence over project-specific options. Project-specific options override global options.

#### Specified compiler

The reason for the different default compilers is that for larger projects (e.g., more typical in a monorepo) webpack can have significant advantages in build times and in producing a single file bundling all project components together. If you wish to generate individual files, set `"webpack"` to `false`, which will cause the build process to use `tsc` (or `swc`).

#### Webpack options

The webpack options file can contain standard [webpack configuration options](https://webpack.js.org/configuration/). For example, to tell webpack to bundle `node_modules` (which are excluded by default), add the following to `webpack.config.js`:

```javascript
module.exports = {
  externals: [],
};
```

Since the webpack config file is a JavaScript file, you can even expose a function that takes default options and returns a modified object:

```javascript
module.exports = function (options) {
  return {
    ...options,
    externals: [],
  };
};
```

#### Assets

TypeScript compilation automatically distributes compiler output (`.js` and `.d.ts` files) to the specified output directory. It can also be convenient to distribute non-TypeScript files, such as `.graphql` files, `images`, `.html` files and other assets. This allows you to treat `nest build` (and any initial compilation step) as a lightweight **development build** step, where you may be editing non-TypeScript files and iteratively compiling and testing.
The assets should be located in the `src` folder otherwise they will not be copied.

The value of the `assets` key should be an array of elements specifying the files to be distributed. The elements can be simple strings with `glob`-like file specs, for example:

```typescript
"assets": ["**/*.graphql"],
"watchAssets": true,
```

For finer control, the elements can be objects with the following keys:

- `"include"`: `glob`-like file specifications for the assets to be distributed
- `"exclude"`: `glob`-like file specifications for assets to be **excluded** from the `include` list
- `"outDir"`: a string specifying the path (relative to the root folder) where the assets should be distributed. Defaults to the same output directory configured for compiler output.
- `"watchAssets"`: boolean; if `true`, run in watch mode watching specified assets

For example:

```typescript
"assets": [
  { "include": "**/*.graphql", "exclude": "**/omitted.graphql", "watchAssets": true },
]
```

> warning **Warning** Setting `watchAssets` in a top-level `compilerOptions` property overrides any `watchAssets` settings within the `assets` property.

#### Project properties

This element exists only for monorepo-mode structures. You generally should not edit these properties, as they are used by Nest to locate projects and their configuration options within the monorepo.


---

