# React - Other

**Pages:** 17

---

## Introduction

**URL:** https://react.dev/learn/react-compiler/introduction

**Contents:**
- Introduction
  - You will learn
- What does React Compiler do?
  - Before React Compiler
  - Note
  - After React Compiler
      - Deep Dive
    - What kind of memoization does React Compiler add?
    - Optimizing Re-renders
    - Expensive calculations also get memoized

React Compiler is a new build-time tool that automatically optimizes your React app. It works with plain JavaScript, and understands the Rules of React, so you don’t need to rewrite any code to use it.

React Compiler automatically optimizes your React application at build time. React is often fast enough without optimization, but sometimes you need to manually memoize components and values to keep your app responsive. This manual memoization is tedious, easy to get wrong, and adds extra code to maintain. React Compiler does this optimization automatically for you, freeing you from this mental burden so you can focus on building features.

Without the compiler, you need to manually memoize components and values to optimize re-renders:

This manual memoization has a subtle bug that breaks memoization:

Even though handleClick is wrapped in useCallback, the arrow function () => handleClick(item) creates a new function every time the component renders. This means that Item will always receive a new onClick prop, breaking memoization.

React Compiler is able to optimize this correctly with or without the arrow function, ensuring that Item only re-renders when props.onClick changes.

With React Compiler, you write the same code without manual memoization:

See this example in the React Compiler Playground

React Compiler automatically applies the optimal memoization, ensuring your app only re-renders when necessary.

React Compiler’s automatic memoization is primarily focused on improving update performance (re-rendering existing components), so it focuses on these two use cases:

React lets you express your UI as a function of their current state (more concretely: their props, state, and context). In its current implementation, when a component’s state changes, React will re-render that component and all of its children — unless you have applied some form of manual memoization with useMemo(), useCallback(), or React.memo(). For example, in the following example, <MessageButton> will re-render whenever <FriendList>’s state changes:

See this example in the React Compiler Playground

React Compiler automatically applies the equivalent of manual memoization, ensuring that only the relevant parts of an app re-render as state changes, which is sometimes referred to as “fine-grained reactivity”. In the above example, React Compiler determines that the return value of <FriendListCard /> can be reused even as friends changes, and can avoid recreating this JSX and avoid re-rendering <MessageButton> as the count changes.

React Compiler can also automatically memoize expensive calculations used during rendering:

See this example in the React Compiler Playground

However, if expensivelyProcessAReallyLargeArrayOfObjects is truly an expensive function, you may want to consider implementing its own memoization outside of React, because:

So if expensivelyProcessAReallyLargeArrayOfObjects was used in many different components, even if the same exact items were passed down, that expensive calculation would be run repeatedly. We recommend profiling first to see if it really is that expensive before making code more complicated.

We encourage everyone to start using React Compiler. While the compiler is still an optional addition to React today, in the future some features may require the compiler in order to fully work.

React Compiler is now stable and has been tested extensively in production. While it has been used in production at companies like Meta, rolling out the compiler to production for your app will depend on the health of your codebase and how well you’ve followed the Rules of React.

React Compiler can be installed across several build tools such as Babel, Vite, Metro, and Rsbuild.

React Compiler is primarily a light Babel plugin wrapper around the core compiler, which was designed to be decoupled from Babel itself. While the initial stable version of the compiler will remain primarily a Babel plugin, we are working with the swc and oxc teams to build first class support for React Compiler so you won’t have to add Babel back to your build pipelines in the future.

Next.js users can enable the swc-invoked React Compiler by using v15.3.1 and up.

By default, React Compiler will memoize your code based on its analysis and heuristics. In most cases, this memoization will be as precise, or moreso, than what you may have written.

However, in some cases developers may need more control over memoization. The useMemo and useCallback hooks can continue to be used with React Compiler as an escape hatch to provide control over which values are memoized. A common use-case for this is if a memoized value is used as an effect dependency, in order to ensure that an effect does not fire repeatedly even when its dependencies do not meaningfully change.

For new code, we recommend relying on the compiler for memoization and using useMemo/useCallback where needed to achieve precise control.

For existing code, we recommend either leaving existing memoization in place (removing it can change compilation output) or carefully testing before removing the memoization.

This section will help you get started with React Compiler and understand how to use it effectively in your projects.

In addition to these docs, we recommend checking the React Compiler Working Group for additional information and discussion about the compiler.

**Examples:**

Example 1 (jsx):
```jsx
import { useMemo, useCallback, memo } from 'react';const ExpensiveComponent = memo(function ExpensiveComponent({ data, onClick }) {  const processedData = useMemo(() => {    return expensiveProcessing(data);  }, [data]);  const handleClick = useCallback((item) => {    onClick(item.id);  }, [onClick]);  return (    <div>      {processedData.map(item => (        <Item key={item.id} onClick={() => handleClick(item)} />      ))}    </div>  );});
```

Example 2 (jsx):
```jsx
<Item key={item.id} onClick={() => handleClick(item)} />
```

Example 3 (jsx):
```jsx
function ExpensiveComponent({ data, onClick }) {  const processedData = expensiveProcessing(data);  const handleClick = (item) => {    onClick(item.id);  };  return (    <div>      {processedData.map(item => (        <Item key={item.id} onClick={() => handleClick(item)} />      ))}    </div>  );}
```

Example 4 (jsx):
```jsx
function FriendList({ friends }) {  const onlineCount = useFriendOnlineCount();  if (friends.length === 0) {    return <NoFriends />;  }  return (    <div>      <span>{onlineCount} online</span>      {friends.map((friend) => (        <FriendListCard key={friend.id} friend={friend} />      ))}      <MessageButton />    </div>  );}
```

---

## Creating a React App

**URL:** https://react.dev/learn/creating-a-react-app

**Contents:**
- Creating a React App
- Full-stack frameworks
  - Note
    - Full-stack frameworks do not require a server.
  - Next.js (App Router)
  - React Router (v7)
  - Expo (for native apps)
- Other frameworks
      - Deep Dive
    - Which features make up the React team’s full-stack architecture vision?

If you want to build a new app or website with React, we recommend starting with a framework.

If your app has constraints not well-served by existing frameworks, you prefer to build your own framework, or you just want to learn the basics of a React app, you can build a React app from scratch.

These recommended frameworks support all the features you need to deploy and scale your app in production. They have integrated the latest React features and take advantage of React’s architecture.

All the frameworks on this page support client-side rendering (CSR), single-page apps (SPA), and static-site generation (SSG). These apps can be deployed to a CDN or static hosting service without a server. Additionally, these frameworks allow you to add server-side rendering on a per-route basis, when it makes sense for your use case.

This allows you to start with a client-only app, and if your needs change later, you can opt-in to using server features on individual routes without rewriting your app. See your framework’s documentation for configuring the rendering strategy.

Next.js’s App Router is a React framework that takes full advantage of React’s architecture to enable full-stack React apps.

Next.js is maintained by Vercel. You can deploy a Next.js app to any hosting provider that supports Node.js or Docker containers, or to your own server. Next.js also supports static export which doesn’t require a server.

React Router is the most popular routing library for React and can be paired with Vite to create a full-stack React framework. It emphasizes standard Web APIs and has several ready to deploy templates for various JavaScript runtimes and platforms.

To create a new React Router framework project, run:

React Router is maintained by Shopify.

Expo is a React framework that lets you create universal Android, iOS, and web apps with truly native UIs. It provides an SDK for React Native that makes the native parts easier to use. To create a new Expo project, run:

If you’re new to Expo, check out the Expo tutorial.

Expo is maintained by Expo (the company). Building apps with Expo is free, and you can submit them to the Google and Apple app stores without restrictions. Expo additionally provides opt-in paid cloud services.

There are other up-and-coming frameworks that are working towards our full stack React vision:

Next.js’s App Router bundler fully implements the official React Server Components specification. This lets you mix build-time, server-only, and interactive components in a single React tree.

For example, you can write a server-only React component as an async function that reads from a database or from a file. Then you can pass data down from it to your interactive components:

Next.js’s App Router also integrates data fetching with Suspense. This lets you specify a loading state (like a skeleton placeholder) for different parts of your user interface directly in your React tree:

Server Components and Suspense are React features rather than Next.js features. However, adopting them at the framework level requires buy-in and non-trivial implementation work. At the moment, the Next.js App Router is the most complete implementation. The React team is working with bundler developers to make these features easier to implement in the next generation of frameworks.

If your app has constraints not well-served by existing frameworks, you prefer to build your own framework, or you just want to learn the basics of a React app, there are other options available for starting a React project from scratch.

Starting from scratch gives you more flexibility, but does require that you make choices on which tools to use for routing, data fetching, and other common usage patterns. It’s a lot like building your own framework, instead of using a framework that already exists. The frameworks we recommend have built-in solutions for these problems.

If you want to build your own solutions, see our guide to build a React app from Scratch for instructions on how to set up a new React project starting with a build tool like Vite, Parcel, or RSbuild.

If you’re a framework author interested in being included on this page, please let us know.

**Examples:**

Example 1 (python):
```python
npx create-next-app@latest
```

Example 2 (python):
```python
npx create-react-router@latest
```

Example 3 (python):
```python
npx create-expo-app@latest
```

Example 4 (javascript):
```javascript
// This component runs *only* on the server (or during the build).async function Talks({ confId }) {  // 1. You're on the server, so you can talk to your data layer. API endpoint not required.  const talks = await db.Talks.findAll({ confId });  // 2. Add any amount of rendering logic. It won't make your JavaScript bundle larger.  const videos = talks.map(talk => talk.video);  // 3. Pass the data down to the components that will run in the browser.  return <SearchableVideoList videos={videos} />;}
```

---

## Editor Setup

**URL:** https://react.dev/learn/editor-setup

**Contents:**
- Editor Setup
  - You will learn
- Your editor
- Recommended text editor features
  - Linting
  - Formatting
    - Formatting on save

A properly configured editor can make code clearer to read and faster to write. It can even help you catch bugs as you write them! If this is your first time setting up an editor or you’re looking to tune up your current editor, we have a few recommendations.

VS Code is one of the most popular editors in use today. It has a large marketplace of extensions and integrates well with popular services like GitHub. Most of the features listed below can be added to VS Code as extensions as well, making it highly configurable!

Other popular text editors used in the React community include:

Some editors come with these features built in, but others might require adding an extension. Check to see what support your editor of choice provides to be sure!

Code linters find problems in your code as you write, helping you fix them early. ESLint is a popular, open source linter for JavaScript.

Make sure that you’ve enabled all the eslint-plugin-react-hooks rules for your project. They are essential and catch the most severe bugs early. The recommended eslint-config-react-app preset already includes them.

The last thing you want to do when sharing your code with another contributor is get into a discussion about tabs vs spaces! Fortunately, Prettier will clean up your code by reformatting it to conform to preset, configurable rules. Run Prettier, and all your tabs will be converted to spaces—and your indentation, quotes, etc will also all be changed to conform to the configuration. In the ideal setup, Prettier will run when you save your file, quickly making these edits for you.

You can install the Prettier extension in VSCode by following these steps:

Ideally, you should format your code on every save. VS Code has settings for this!

If your ESLint preset has formatting rules, they may conflict with Prettier. We recommend disabling all formatting rules in your ESLint preset using eslint-config-prettier so that ESLint is only used for catching logical mistakes. If you want to enforce that files are formatted before a pull request is merged, use prettier --check for your continuous integration.

---

## Escape Hatches

**URL:** https://react.dev/learn/escape-hatches

**Contents:**
- Escape Hatches
  - In this chapter
- Referencing values with refs
- Ready to learn this topic?
- Manipulating the DOM with refs
- Ready to learn this topic?
- Synchronizing with Effects
- Ready to learn this topic?
- You Might Not Need An Effect
- Ready to learn this topic?

Some of your components may need to control and synchronize with systems outside of React. For example, you might need to focus an input using the browser API, play and pause a video player implemented without React, or connect and listen to messages from a remote server. In this chapter, you’ll learn the escape hatches that let you “step outside” React and connect to external systems. Most of your application logic and data flow should not rely on these features.

When you want a component to “remember” some information, but you don’t want that information to trigger new renders, you can use a ref:

Like state, refs are retained by React between re-renders. However, setting state re-renders a component. Changing a ref does not! You can access the current value of that ref through the ref.current property.

A ref is like a secret pocket of your component that React doesn’t track. For example, you can use refs to store timeout IDs, DOM elements, and other objects that don’t impact the component’s rendering output.

Read Referencing Values with Refs to learn how to use refs to remember information.

React automatically updates the DOM to match your render output, so your components won’t often need to manipulate it. However, sometimes you might need access to the DOM elements managed by React—for example, to focus a node, scroll to it, or measure its size and position. There is no built-in way to do those things in React, so you will need a ref to the DOM node. For example, clicking the button will focus the input using a ref:

Read Manipulating the DOM with Refs to learn how to access DOM elements managed by React.

Some components need to synchronize with external systems. For example, you might want to control a non-React component based on the React state, set up a server connection, or send an analytics log when a component appears on the screen. Unlike event handlers, which let you handle particular events, Effects let you run some code after rendering. Use them to synchronize your component with a system outside of React.

Press Play/Pause a few times and see how the video player stays synchronized to the isPlaying prop value:

Many Effects also “clean up” after themselves. For example, an Effect that sets up a connection to a chat server should return a cleanup function that tells React how to disconnect your component from that server:

In development, React will immediately run and clean up your Effect one extra time. This is why you see "✅ Connecting..." printed twice. This ensures that you don’t forget to implement the cleanup function.

Read Synchronizing with Effects to learn how to synchronize components with external systems.

Effects are an escape hatch from the React paradigm. They let you “step outside” of React and synchronize your components with some external system. If there is no external system involved (for example, if you want to update a component’s state when some props or state change), you shouldn’t need an Effect. Removing unnecessary Effects will make your code easier to follow, faster to run, and less error-prone.

There are two common cases in which you don’t need Effects:

For example, you don’t need an Effect to adjust some state based on other state:

Instead, calculate as much as you can while rendering:

However, you do need Effects to synchronize with external systems.

Read You Might Not Need an Effect to learn how to remove unnecessary Effects.

Effects have a different lifecycle from components. Components may mount, update, or unmount. An Effect can only do two things: to start synchronizing something, and later to stop synchronizing it. This cycle can happen multiple times if your Effect depends on props and state that change over time.

This Effect depends on the value of the roomId prop. Props are reactive values, which means they can change on a re-render. Notice that the Effect re-synchronizes (and re-connects to the server) if roomId changes:

React provides a linter rule to check that you’ve specified your Effect’s dependencies correctly. If you forget to specify roomId in the list of dependencies in the above example, the linter will find that bug automatically.

Read Lifecycle of Reactive Events to learn how an Effect’s lifecycle is different from a component’s.

Event handlers only re-run when you perform the same interaction again. Unlike event handlers, Effects re-synchronize if any of the values they read, like props or state, are different than during last render. Sometimes, you want a mix of both behaviors: an Effect that re-runs in response to some values but not others.

All code inside Effects is reactive. It will run again if some reactive value it reads has changed due to a re-render. For example, this Effect will re-connect to the chat if either roomId or theme have changed:

This is not ideal. You want to re-connect to the chat only if the roomId has changed. Switching the theme shouldn’t re-connect to the chat! Move the code reading theme out of your Effect into an Effect Event:

Code inside Effect Events isn’t reactive, so changing the theme no longer makes your Effect re-connect.

Read Separating Events from Effects to learn how to prevent some values from re-triggering Effects.

When you write an Effect, the linter will verify that you’ve included every reactive value (like props and state) that the Effect reads in the list of your Effect’s dependencies. This ensures that your Effect remains synchronized with the latest props and state of your component. Unnecessary dependencies may cause your Effect to run too often, or even create an infinite loop. The way you remove them depends on the case.

For example, this Effect depends on the options object which gets re-created every time you edit the input:

You don’t want the chat to re-connect every time you start typing a message in that chat. To fix this problem, move creation of the options object inside the Effect so that the Effect only depends on the roomId string:

Notice that you didn’t start by editing the dependency list to remove the options dependency. That would be wrong. Instead, you changed the surrounding code so that the dependency became unnecessary. Think of the dependency list as a list of all the reactive values used by your Effect’s code. You don’t intentionally choose what to put on that list. The list describes your code. To change the dependency list, change the code.

Read Removing Effect Dependencies to learn how to make your Effect re-run less often.

React comes with built-in Hooks like useState, useContext, and useEffect. Sometimes, you’ll wish that there was a Hook for some more specific purpose: for example, to fetch data, to keep track of whether the user is online, or to connect to a chat room. To do this, you can create your own Hooks for your application’s needs.

In this example, the usePointerPosition custom Hook tracks the cursor position, while useDelayedValue custom Hook returns a value that’s “lagging behind” the value you passed by a certain number of milliseconds. Move the cursor over the sandbox preview area to see a moving trail of dots following the cursor:

You can create custom Hooks, compose them together, pass data between them, and reuse them between components. As your app grows, you will write fewer Effects by hand because you’ll be able to reuse custom Hooks you already wrote. There are also many excellent custom Hooks maintained by the React community.

Read Reusing Logic with Custom Hooks to learn how to share logic between components.

Head over to Referencing Values with Refs to start reading this chapter page by page!

**Examples:**

Example 1 (jsx):
```jsx
const ref = useRef(0);
```

Example 2 (jsx):
```jsx
function Form() {  const [firstName, setFirstName] = useState('Taylor');  const [lastName, setLastName] = useState('Swift');  // 🔴 Avoid: redundant state and unnecessary Effect  const [fullName, setFullName] = useState('');  useEffect(() => {    setFullName(firstName + ' ' + lastName);  }, [firstName, lastName]);  // ...}
```

Example 3 (javascript):
```javascript
function Form() {  const [firstName, setFirstName] = useState('Taylor');  const [lastName, setLastName] = useState('Swift');  // ✅ Good: calculated during rendering  const fullName = firstName + ' ' + lastName;  // ...}
```

---

## Using TypeScript

**URL:** https://react.dev/learn/typescript

**Contents:**
- Using TypeScript
  - You will learn
- Installation
  - Adding TypeScript to an existing React project
- TypeScript with React Components
  - Note
  - Note
- Example Hooks
  - useState
  - useReducer

TypeScript is a popular way to add type definitions to JavaScript codebases. Out of the box, TypeScript supports JSX and you can get full React Web support by adding @types/react and @types/react-dom to your project.

All production-grade React frameworks offer support for using TypeScript. Follow the framework specific guide for installation:

To install the latest version of React’s type definitions:

The following compiler options need to be set in your tsconfig.json:

Every file containing JSX must use the .tsx file extension. This is a TypeScript-specific extension that tells TypeScript that this file contains JSX.

Writing TypeScript with React is very similar to writing JavaScript with React. The key difference when working with a component is that you can provide types for your component’s props. These types can be used for correctness checking and providing inline documentation in editors.

Taking the MyButton component from the Quick Start guide, we can add a type describing the title for the button:

These sandboxes can handle TypeScript code, but they do not run the type-checker. This means you can amend the TypeScript sandboxes to learn, but you won’t get any type errors or warnings. To get type-checking, you can use the TypeScript Playground or use a more fully-featured online sandbox.

This inline syntax is the simplest way to provide types for a component, though once you start to have a few fields to describe it can become unwieldy. Instead, you can use an interface or type to describe the component’s props:

The type describing your component’s props can be as simple or as complex as you need, though they should be an object type described with either a type or interface. You can learn about how TypeScript describes objects in Object Types but you may also be interested in using Union Types to describe a prop that can be one of a few different types and the Creating Types from Types guide for more advanced use cases.

The type definitions from @types/react include types for the built-in Hooks, so you can use them in your components without any additional setup. They are built to take into account the code you write in your component, so you will get inferred types a lot of the time and ideally do not need to handle the minutiae of providing the types.

However, we can look at a few examples of how to provide types for Hooks.

The useState Hook will re-use the value passed in as the initial state to determine what the type of the value should be. For example:

This will assign the type of boolean to enabled, and setEnabled will be a function accepting either a boolean argument, or a function that returns a boolean. If you want to explicitly provide a type for the state, you can do so by providing a type argument to the useState call:

This isn’t very useful in this case, but a common case where you may want to provide a type is when you have a union type. For example, status here can be one of a few different strings:

Or, as recommended in Principles for structuring state, you can group related state as an object and describe the different possibilities via object types:

The useReducer Hook is a more complex Hook that takes a reducer function and an initial state. The types for the reducer function are inferred from the initial state. You can optionally provide a type argument to the useReducer call to provide a type for the state, but it is often better to set the type on the initial state instead:

We are using TypeScript in a few key places:

A more explicit alternative to setting the type on initialState is to provide a type argument to useReducer:

The useContext Hook is a technique for passing data down the component tree without having to pass props through components. It is used by creating a provider component and often by creating a Hook to consume the value in a child component.

The type of the value provided by the context is inferred from the value passed to the createContext call:

This technique works when you have a default value which makes sense - but there are occasionally cases when you do not, and in those cases null can feel reasonable as a default value. However, to allow the type-system to understand your code, you need to explicitly set ContextShape | null on the createContext.

This causes the issue that you need to eliminate the | null in the type for context consumers. Our recommendation is to have the Hook do a runtime check for it’s existence and throw an error when not present:

React Compiler automatically memoizes values and functions, reducing the need for manual useMemo calls. You can use the compiler to handle memoization automatically.

The useMemo Hooks will create/re-access a memorized value from a function call, re-running the function only when dependencies passed as the 2nd parameter are changed. The result of calling the Hook is inferred from the return value from the function in the first parameter. You can be more explicit by providing a type argument to the Hook.

React Compiler automatically memoizes values and functions, reducing the need for manual useCallback calls. You can use the compiler to handle memoization automatically.

The useCallback provide a stable reference to a function as long as the dependencies passed into the second parameter are the same. Like useMemo, the function’s type is inferred from the return value of the function in the first parameter, and you can be more explicit by providing a type argument to the Hook.

When working in TypeScript strict mode useCallback requires adding types for the parameters in your callback. This is because the type of the callback is inferred from the return value of the function, and without parameters the type cannot be fully understood.

Depending on your code-style preferences, you could use the *EventHandler functions from the React types to provide the type for the event handler at the same time as defining the callback:

There is quite an expansive set of types which come from the @types/react package, it is worth a read when you feel comfortable with how React and TypeScript interact. You can find them in React’s folder in DefinitelyTyped. We will cover a few of the more common types here.

When working with DOM events in React, the type of the event can often be inferred from the event handler. However, when you want to extract a function to be passed to an event handler, you will need to explicitly set the type of the event.

There are many types of events provided in the React types - the full list can be found here which is based on the most popular events from the DOM.

When determining the type you are looking for you can first look at the hover information for the event handler you are using, which will show the type of the event.

If you need to use an event that is not included in this list, you can use the React.SyntheticEvent type, which is the base type for all events.

There are two common paths to describing the children of a component. The first is to use the React.ReactNode type, which is a union of all the possible types that can be passed as children in JSX:

This is a very broad definition of children. The second is to use the React.ReactElement type, which is only JSX elements and not JavaScript primitives like strings or numbers:

Note, that you cannot use TypeScript to describe that the children are a certain type of JSX elements, so you cannot use the type-system to describe a component which only accepts <li> children.

You can see an example of both React.ReactNode and React.ReactElement with the type-checker in this TypeScript playground.

When using inline styles in React, you can use React.CSSProperties to describe the object passed to the style prop. This type is a union of all the possible CSS properties, and is a good way to ensure you are passing valid CSS properties to the style prop, and to get auto-complete in your editor.

This guide has covered the basics of using TypeScript with React, but there is a lot more to learn. Individual API pages on the docs may contain more in-depth documentation on how to use them with TypeScript.

We recommend the following resources:

The TypeScript handbook is the official documentation for TypeScript, and covers most key language features.

The TypeScript release notes cover new features in depth.

React TypeScript Cheatsheet is a community-maintained cheatsheet for using TypeScript with React, covering a lot of useful edge cases and providing more breadth than this document.

TypeScript Community Discord is a great place to ask questions and get help with TypeScript and React issues.

**Examples:**

Example 1 (python):
```python
npm install --save-dev @types/react @types/react-dom
```

Example 2 (jsx):
```jsx
// Infer the type as "boolean"const [enabled, setEnabled] = useState(false);
```

Example 3 (tsx):
```tsx
// Explicitly set the type to "boolean"const [enabled, setEnabled] = useState<boolean>(false);
```

Example 4 (typescript):
```typescript
type Status = "idle" | "loading" | "success" | "error";const [status, setStatus] = useState<Status>("idle");
```

---

## Describing the UI

**URL:** https://react.dev/learn/describing-the-ui

**Contents:**
- Describing the UI
  - In this chapter
- Your first component
- Ready to learn this topic?
- Importing and exporting components
- Ready to learn this topic?
- Writing markup with JSX
- Ready to learn this topic?
- JavaScript in JSX with curly braces
- Ready to learn this topic?

React is a JavaScript library for rendering user interfaces (UI). UI is built from small units like buttons, text, and images. React lets you combine them into reusable, nestable components. From web sites to phone apps, everything on the screen can be broken down into components. In this chapter, you’ll learn to create, customize, and conditionally display React components.

React applications are built from isolated pieces of UI called components. A React component is a JavaScript function that you can sprinkle with markup. Components can be as small as a button, or as large as an entire page. Here is a Gallery component rendering three Profile components:

Read Your First Component to learn how to declare and use React components.

You can declare many components in one file, but large files can get difficult to navigate. To solve this, you can export a component into its own file, and then import that component from another file:

Read Importing and Exporting Components to learn how to split components into their own files.

Each React component is a JavaScript function that may contain some markup that React renders into the browser. React components use a syntax extension called JSX to represent that markup. JSX looks a lot like HTML, but it is a bit stricter and can display dynamic information.

If we paste existing HTML markup into a React component, it won’t always work:

If you have existing HTML like this, you can fix it using a converter:

Read Writing Markup with JSX to learn how to write valid JSX.

JSX lets you write HTML-like markup inside a JavaScript file, keeping rendering logic and content in the same place. Sometimes you will want to add a little JavaScript logic or reference a dynamic property inside that markup. In this situation, you can use curly braces in your JSX to “open a window” to JavaScript:

Read JavaScript in JSX with Curly Braces to learn how to access JavaScript data from JSX.

React components use props to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, functions, and even JSX!

Read Passing Props to a Component to learn how to pass and read props.

Your components will often need to display different things depending on different conditions. In React, you can conditionally render JSX using JavaScript syntax like if statements, &&, and ? : operators.

In this example, the JavaScript && operator is used to conditionally render a checkmark:

Read Conditional Rendering to learn the different ways to render content conditionally.

You will often want to display multiple similar components from a collection of data. You can use JavaScript’s filter() and map() with React to filter and transform your array of data into an array of components.

For each array item, you will need to specify a key. Usually, you will want to use an ID from the database as a key. Keys let React keep track of each item’s place in the list even if the list changes.

Read Rendering Lists to learn how to render a list of components, and how to choose a key.

Some JavaScript functions are pure. A pure function:

By strictly only writing your components as pure functions, you can avoid an entire class of baffling bugs and unpredictable behavior as your codebase grows. Here is an example of an impure component:

You can make this component pure by passing a prop instead of modifying a preexisting variable:

Read Keeping Components Pure to learn how to write components as pure, predictable functions.

React uses trees to model the relationships between components and modules.

A React render tree is a representation of the parent and child relationship between components.

An example React render tree.

Components near the top of the tree, near the root component, are considered top-level components. Components with no child components are leaf components. This categorization of components is useful for understanding data flow and rendering performance.

Modelling the relationship between JavaScript modules is another useful way to understand your app. We refer to it as a module dependency tree.

An example module dependency tree.

A dependency tree is often used by build tools to bundle all the relevant JavaScript code for the client to download and render. A large bundle size regresses user experience for React apps. Understanding the module dependency tree is helpful to debug such issues.

Read Your UI as a Tree to learn how to create a render and module dependency trees for a React app and how they’re useful mental models for improving user experience and performance.

Head over to Your First Component to start reading this chapter page by page!

Or, if you’re already familiar with these topics, why not read about Adding Interactivity?

---

## Understanding Your UI as a Tree

**URL:** https://react.dev/learn/understanding-your-ui-as-a-tree

**Contents:**
- Understanding Your UI as a Tree
  - You will learn
- Your UI as a tree
- The Render Tree
      - Deep Dive
    - Where are the HTML tags in the render tree?
- The Module Dependency Tree
- Recap

Your React app is taking shape with many components being nested within each other. How does React keep track of your app’s component structure?

React, and many other UI libraries, model UI as a tree. Thinking of your app as a tree is useful for understanding the relationship between components. This understanding will help you debug future concepts like performance and state management.

Trees are a relationship model between items. The UI is often represented using tree structures. For example, browsers use tree structures to model HTML (DOM) and CSS (CSSOM). Mobile platforms also use trees to represent their view hierarchy.

React creates a UI tree from your components. In this example, the UI tree is then used to render to the DOM.

Like browsers and mobile platforms, React also uses tree structures to manage and model the relationship between components in a React app. These trees are useful tools to understand how data flows through a React app and how to optimize rendering and app size.

A major feature of components is the ability to compose components of other components. As we nest components, we have the concept of parent and child components, where each parent component may itself be a child of another component.

When we render a React app, we can model this relationship in a tree, known as the render tree.

Here is a React app that renders inspirational quotes.

React creates a render tree, a UI tree, composed of the rendered components.

From the example app, we can construct the above render tree.

The tree is composed of nodes, each of which represents a component. App, FancyText, Copyright, to name a few, are all nodes in our tree.

The root node in a React render tree is the root component of the app. In this case, the root component is App and it is the first component React renders. Each arrow in the tree points from a parent component to a child component.

You’ll notice in the above render tree, there is no mention of the HTML tags that each component renders. This is because the render tree is only composed of React components.

React, as a UI framework, is platform agnostic. On react.dev, we showcase examples that render to the web, which uses HTML markup as its UI primitives. But a React app could just as likely render to a mobile or desktop platform, which may use different UI primitives like UIView or FrameworkElement.

These platform UI primitives are not a part of React. React render trees can provide insight to our React app regardless of what platform your app renders to.

A render tree represents a single render pass of a React application. With conditional rendering, a parent component may render different children depending on the data passed.

We can update the app to conditionally render either an inspirational quote or color.

With conditional rendering, across different renders, the render tree may render different components.

In this example, depending on what inspiration.type is, we may render <FancyText> or <Color>. The render tree may be different for each render pass.

Although render trees may differ across render passes, these trees are generally helpful for identifying what the top-level and leaf components are in a React app. Top-level components are the components nearest to the root component and affect the rendering performance of all the components beneath them and often contain the most complexity. Leaf components are near the bottom of the tree and have no child components and are often frequently re-rendered.

Identifying these categories of components are useful for understanding data flow and performance of your app.

Another relationship in a React app that can be modeled with a tree are an app’s module dependencies. As we break up our components and logic into separate files, we create JS modules where we may export components, functions, or constants.

Each node in a module dependency tree is a module and each branch represents an import statement in that module.

If we take the previous Inspirations app, we can build a module dependency tree, or dependency tree for short.

The module dependency tree for the Inspirations app.

The root node of the tree is the root module, also known as the entrypoint file. It often is the module that contains the root component.

Comparing to the render tree of the same app, there are similar structures but some notable differences:

Dependency trees are useful to determine what modules are necessary to run your React app. When building a React app for production, there is typically a build step that will bundle all the necessary JavaScript to ship to the client. The tool responsible for this is called a bundler, and bundlers will use the dependency tree to determine what modules should be included.

As your app grows, often the bundle size does too. Large bundle sizes are expensive for a client to download and run. Large bundle sizes can delay the time for your UI to get drawn. Getting a sense of your app’s dependency tree may help with debugging these issues.

---

## Add React to an Existing Project

**URL:** https://react.dev/learn/add-react-to-an-existing-project

**Contents:**
- Add React to an Existing Project
  - Note
- Using React for an entire subroute of your existing website
- Using React for a part of your existing page
  - Step 1: Set up a modular JavaScript environment
  - Note
  - Step 2: Render React components anywhere on the page
- Using React Native in an existing native mobile app

If you want to add some interactivity to your existing project, you don’t have to rewrite it in React. Add React to your existing stack, and render interactive React components anywhere.

You need to install Node.js for local development. Although you can try React online or with a simple HTML page, realistically most JavaScript tooling you’ll want to use for development requires Node.js.

Let’s say you have an existing web app at example.com built with another server technology (like Rails), and you want to implement all routes starting with example.com/some-app/ fully with React.

Here’s how we recommend to set it up:

This ensures the React part of your app can benefit from the best practices baked into those frameworks.

Many React-based frameworks are full-stack and let your React app take advantage of the server. However, you can use the same approach even if you can’t or don’t want to run JavaScript on the server. In that case, serve the HTML/CSS/JS export (next export output for Next.js, default for Gatsby) at /some-app/ instead.

Let’s say you have an existing page built with another technology (either a server one like Rails, or a client one like Backbone), and you want to render interactive React components somewhere on that page. That’s a common way to integrate React—in fact, it’s how most React usage looked at Meta for many years!

You can do this in two steps:

The exact approach depends on your existing page setup, so let’s walk through some details.

A modular JavaScript environment lets you write your React components in individual files, as opposed to writing all of your code in a single file. It also lets you use all the wonderful packages published by other developers on the npm registry—including React itself! How you do this depends on your existing setup:

If your app is already split into files that use import statements, try to use the setup you already have. Check whether writing <div /> in your JS code causes a syntax error. If it causes a syntax error, you might need to transform your JavaScript code with Babel, and enable the Babel React preset to use JSX.

If your app doesn’t have an existing setup for compiling JavaScript modules, set it up with Vite. The Vite community maintains many integrations with backend frameworks, including Rails, Django, and Laravel. If your backend framework is not listed, follow this guide to manually integrate Vite builds with your backend.

To check whether your setup works, run this command in your project folder:

Then add these lines of code at the top of your main JavaScript file (it might be called index.js or main.js):

If the entire content of your page was replaced by a “Hello, world!”, everything worked! Keep reading.

Integrating a modular JavaScript environment into an existing project for the first time can feel intimidating, but it’s worth it! If you get stuck, try our community resources or the Vite Chat.

In the previous step, you put this code at the top of your main file:

Of course, you don’t actually want to clear the existing HTML content!

Instead, you probably want to render your React components in specific places in your HTML. Open your HTML page (or the server templates that generate it) and add a unique id attribute to any tag, for example:

This lets you find that HTML element with document.getElementById and pass it to createRoot so that you can render your own React component inside:

Notice how the original HTML content from index.html is preserved, but your own NavigationBar React component now appears inside the <nav id="navigation"> from your HTML. Read the createRoot usage documentation to learn more about rendering React components inside an existing HTML page.

When you adopt React in an existing project, it’s common to start with small interactive components (like buttons), and then gradually keep “moving upwards” until eventually your entire page is built with React. If you ever reach that point, we recommend migrating to a React framework right after to get the most out of React.

React Native can also be integrated into existing native apps incrementally. If you have an existing native app for Android (Java or Kotlin) or iOS (Objective-C or Swift), follow this guide to add a React Native screen to it.

**Examples:**

Example 1 (unknown):
```unknown
npm install react react-dom
```

Example 2 (jsx):
```jsx
import { createRoot } from 'react-dom/client';// Clear the existing HTML contentdocument.body.innerHTML = '<div id="app"></div>';// Render your React component insteadconst root = createRoot(document.getElementById('app'));root.render(<h1>Hello, world</h1>);
```

Example 3 (jsx):
```jsx
<!-- ... somewhere in your html ... --><nav id="navigation"></nav><!-- ... more html ... -->
```

---

## Quick Start

**URL:** https://react.dev/learn

**Contents:**
- Quick Start
  - You will learn
- Creating and nesting components
- Writing markup with JSX
- Adding styles
- Displaying data
- Conditional rendering
- Rendering lists
- Responding to events
- Updating the screen

Welcome to the React documentation! This page will give you an introduction to 80% of the React concepts that you will use on a daily basis.

React apps are made out of components. A component is a piece of the UI (user interface) that has its own logic and appearance. A component can be as small as a button, or as large as an entire page.

React components are JavaScript functions that return markup:

Now that you’ve declared MyButton, you can nest it into another component:

Notice that <MyButton /> starts with a capital letter. That’s how you know it’s a React component. React component names must always start with a capital letter, while HTML tags must be lowercase.

Have a look at the result:

The export default keywords specify the main component in the file. If you’re not familiar with some piece of JavaScript syntax, MDN and javascript.info have great references.

The markup syntax you’ve seen above is called JSX. It is optional, but most React projects use JSX for its convenience. All of the tools we recommend for local development support JSX out of the box.

JSX is stricter than HTML. You have to close tags like <br />. Your component also can’t return multiple JSX tags. You have to wrap them into a shared parent, like a <div>...</div> or an empty <>...</> wrapper:

If you have a lot of HTML to port to JSX, you can use an online converter.

In React, you specify a CSS class with className. It works the same way as the HTML class attribute:

Then you write the CSS rules for it in a separate CSS file:

React does not prescribe how you add CSS files. In the simplest case, you’ll add a <link> tag to your HTML. If you use a build tool or a framework, consult its documentation to learn how to add a CSS file to your project.

JSX lets you put markup into JavaScript. Curly braces let you “escape back” into JavaScript so that you can embed some variable from your code and display it to the user. For example, this will display user.name:

You can also “escape into JavaScript” from JSX attributes, but you have to use curly braces instead of quotes. For example, className="avatar" passes the "avatar" string as the CSS class, but src={user.imageUrl} reads the JavaScript user.imageUrl variable value, and then passes that value as the src attribute:

You can put more complex expressions inside the JSX curly braces too, for example, string concatenation:

In the above example, style={{}} is not a special syntax, but a regular {} object inside the style={ } JSX curly braces. You can use the style attribute when your styles depend on JavaScript variables.

In React, there is no special syntax for writing conditions. Instead, you’ll use the same techniques as you use when writing regular JavaScript code. For example, you can use an if statement to conditionally include JSX:

If you prefer more compact code, you can use the conditional ? operator. Unlike if, it works inside JSX:

When you don’t need the else branch, you can also use a shorter logical && syntax:

All of these approaches also work for conditionally specifying attributes. If you’re unfamiliar with some of this JavaScript syntax, you can start by always using if...else.

You will rely on JavaScript features like for loop and the array map() function to render lists of components.

For example, let’s say you have an array of products:

Inside your component, use the map() function to transform an array of products into an array of <li> items:

Notice how <li> has a key attribute. For each item in a list, you should pass a string or a number that uniquely identifies that item among its siblings. Usually, a key should be coming from your data, such as a database ID. React uses your keys to know what happened if you later insert, delete, or reorder the items.

You can respond to events by declaring event handler functions inside your components:

Notice how onClick={handleClick} has no parentheses at the end! Do not call the event handler function: you only need to pass it down. React will call your event handler when the user clicks the button.

Often, you’ll want your component to “remember” some information and display it. For example, maybe you want to count the number of times a button is clicked. To do this, add state to your component.

First, import useState from React:

Now you can declare a state variable inside your component:

You’ll get two things from useState: the current state (count), and the function that lets you update it (setCount). You can give them any names, but the convention is to write [something, setSomething].

The first time the button is displayed, count will be 0 because you passed 0 to useState(). When you want to change state, call setCount() and pass the new value to it. Clicking this button will increment the counter:

React will call your component function again. This time, count will be 1. Then it will be 2. And so on.

If you render the same component multiple times, each will get its own state. Click each button separately:

Notice how each button “remembers” its own count state and doesn’t affect other buttons.

Functions starting with use are called Hooks. useState is a built-in Hook provided by React. You can find other built-in Hooks in the API reference. You can also write your own Hooks by combining the existing ones.

Hooks are more restrictive than other functions. You can only call Hooks at the top of your components (or other Hooks). If you want to use useState in a condition or a loop, extract a new component and put it there.

In the previous example, each MyButton had its own independent count, and when each button was clicked, only the count for the button clicked changed:

Initially, each MyButton’s count state is 0

The first MyButton updates its count to 1

However, often you’ll need components to share data and always update together.

To make both MyButton components display the same count and update together, you need to move the state from the individual buttons “upwards” to the closest component containing all of them.

In this example, it is MyApp:

Initially, MyApp’s count state is 0 and is passed down to both children

On click, MyApp updates its count state to 1 and passes it down to both children

Now when you click either button, the count in MyApp will change, which will change both of the counts in MyButton. Here’s how you can express this in code.

First, move the state up from MyButton into MyApp:

Then, pass the state down from MyApp to each MyButton, together with the shared click handler. You can pass information to MyButton using the JSX curly braces, just like you previously did with built-in tags like <img>:

The information you pass down like this is called props. Now the MyApp component contains the count state and the handleClick event handler, and passes both of them down as props to each of the buttons.

Finally, change MyButton to read the props you have passed from its parent component:

When you click the button, the onClick handler fires. Each button’s onClick prop was set to the handleClick function inside MyApp, so the code inside of it runs. That code calls setCount(count + 1), incrementing the count state variable. The new count value is passed as a prop to each button, so they all show the new value. This is called “lifting state up”. By moving state up, you’ve shared it between components.

By now, you know the basics of how to write React code!

Check out the Tutorial to put them into practice and build your first mini-app with React.

**Examples:**

Example 1 (javascript):
```javascript
function MyButton() {  return (    <button>I'm a button</button>  );}
```

Example 2 (jsx):
```jsx
export default function MyApp() {  return (    <div>      <h1>Welcome to my app</h1>      <MyButton />    </div>  );}
```

Example 3 (jsx):
```jsx
function AboutPage() {  return (    <>      <h1>About</h1>      <p>Hello there.<br />How do you do?</p>    </>  );}
```

Example 4 (jsx):
```jsx
<img className="avatar" />
```

---

## Build a React app from Scratch

**URL:** https://react.dev/learn/build-a-react-app-from-scratch

**Contents:**
- Build a React app from Scratch
      - Deep Dive
    - Consider using a framework
- Step 1: Install a build tool
  - Vite
  - Parcel
  - Rsbuild
  - Note
    - Metro for React Native
- Step 2: Build Common Application Patterns

If your app has constraints not well-served by existing frameworks, you prefer to build your own framework, or you just want to learn the basics of a React app, you can build a React app from scratch.

Starting from scratch is an easy way to get started using React, but a major tradeoff to be aware of is that going this route is often the same as building your own adhoc framework. As your requirements evolve, you may need to solve more framework-like problems that our recommended frameworks already have well developed and supported solutions for.

For example, if in the future your app needs support for server-side rendering (SSR), static site generation (SSG), and/or React Server Components (RSC), you will have to implement those on your own. Similarly, future React features that require integrating at the framework level will have to be implemented on your own if you want to use them.

Our recommended frameworks also help you build better performing apps. For example, reducing or eliminating waterfalls from network requests makes for a better user experience. This might not be a high priority when you are building a toy project, but if your app gains users you may want to improve its performance.

Going this route also makes it more difficult to get support, since the way you develop routing, data-fetching, and other features will be unique to your situation. You should only choose this option if you are comfortable tackling these problems on your own, or if you’re confident that you will never need these features.

For a list of recommended frameworks, check out Creating a React App.

The first step is to install a build tool like vite, parcel, or rsbuild. These build tools provide features to package and run source code, provide a development server for local development and a build command to deploy your app to a production server.

Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects.

Vite is opinionated and comes with sensible defaults out of the box. Vite has a rich ecosystem of plugins to support fast refresh, JSX, Babel/SWC, and other common features. See Vite’s React plugin or React SWC plugin and React SSR example project to get started.

Vite is already being used as a build tool in one of our recommended frameworks: React Router.

Parcel combines a great out-of-the-box development experience with a scalable architecture that can take your project from just getting started to massive production applications.

Parcel supports fast refresh, JSX, TypeScript, Flow, and styling out of the box. See Parcel’s React recipe to get started.

Rsbuild is an Rspack-powered build tool that provides a seamless development experience for React applications. It comes with carefully tuned defaults and performance optimizations ready to use.

Rsbuild includes built-in support for React features like fast refresh, JSX, TypeScript, and styling. See Rsbuild’s React guide to get started.

If you’re starting from scratch with React Native you’ll need to use Metro, the JavaScript bundler for React Native. Metro supports bundling for platforms like iOS and Android, but lacks many features when compared to the tools here. We recommend starting with Vite, Parcel, or Rsbuild unless your project requires React Native support.

The build tools listed above start off with a client-only, single-page app (SPA), but don’t include any further solutions for common functionality like routing, data fetching, or styling.

The React ecosystem includes many tools for these problems. We’ve listed a few that are widely used as a starting point, but feel free to choose other tools if those work better for you.

Routing determines what content or pages to display when a user visits a particular URL. You need to set up a router to map URLs to different parts of your app. You’ll also need to handle nested routes, route parameters, and query parameters. Routers can be configured within your code, or defined based on your component folder and file structures.

Routers are a core part of modern applications, and are usually integrated with data fetching (including prefetching data for a whole page for faster loading), code splitting (to minimize client bundle sizes), and page rendering approaches (to decide how each page gets generated).

Fetching data from a server or other data source is a key part of most applications. Doing this properly requires handling loading states, error states, and caching the fetched data, which can be complex.

Purpose-built data fetching libraries do the hard work of fetching and caching the data for you, letting you focus on what data your app needs and how to display it. These libraries are typically used directly in your components, but can also be integrated into routing loaders for faster pre-fetching and better performance, and in server rendering as well.

Note that fetching data directly in components can lead to slower loading times due to network request waterfalls, so we recommend prefetching data in router loaders or on the server as much as possible! This allows a page’s data to be fetched all at once as the page is being displayed.

If you’re fetching data from most backends or REST-style APIs, we suggest using:

If you’re fetching data from a GraphQL API, we suggest using:

Code-splitting is the process of breaking your app into smaller bundles that can be loaded on demand. An app’s code size increases with every new feature and additional dependency. Apps can become slow to load because all of the code for the entire app needs to be sent before it can be used. Caching, reducing features/dependencies, and moving some code to run on the server can help mitigate slow loading but are incomplete solutions that can sacrifice functionality if overused.

Similarly, if you rely on the apps using your framework to split the code, you might encounter situations where loading becomes slower than if no code splitting were happening at all. For example, lazily loading a chart delays sending the code needed to render the chart, splitting the chart code from the rest of the app. Parcel supports code splitting with React.lazy. However, if the chart loads its data after it has been initially rendered you are now waiting twice. This is a waterfall: rather than fetching the data for the chart and sending the code to render it simultaneously, you must wait for each step to complete one after the other.

Splitting code by route, when integrated with bundling and data fetching, can reduce the initial load time of your app and the time it takes for the largest visible content of the app to render (Largest Contentful Paint).

For code-splitting instructions, see your build tool docs:

Since the build tool you select only supports single page apps (SPAs), you’ll need to implement other rendering patterns like server-side rendering (SSR), static site generation (SSG), and/or React Server Components (RSC). Even if you don’t need these features at first, in the future there may be some routes that would benefit SSR, SSG or RSC.

Single-page apps (SPA) load a single HTML page and dynamically updates the page as the user interacts with the app. SPAs are easier to get started with, but they can have slower initial load times. SPAs are the default architecture for most build tools.

Streaming Server-side rendering (SSR) renders a page on the server and sends the fully rendered page to the client. SSR can improve performance, but it can be more complex to set up and maintain than a single-page app. With the addition of streaming, SSR can be very complex to set up and maintain. See Vite’s SSR guide.

Static site generation (SSG) generates static HTML files for your app at build time. SSG can improve performance, but it can be more complex to set up and maintain than server-side rendering. See Vite’s SSG guide.

React Server Components (RSC) lets you mix build-time, server-only, and interactive components in a single React tree. RSC can improve performance, but it currently requires deep expertise to set up and maintain. See Parcel’s RSC examples.

Your rendering strategies need to integrate with your router so apps built with your framework can choose the rendering strategy on a per-route level. This will enable different rendering strategies without having to rewrite your whole app. For example, the landing page for your app might benefit from being statically generated (SSG), while a page with a content feed might perform best with server-side rendering.

Using the right rendering strategy for the right routes can decrease the time it takes for the first byte of content to be loaded (Time to First Byte), the first piece of content to render (First Contentful Paint), and the largest visible content of the app to render (Largest Contentful Paint).

These are just a few examples of the features a new app will need to consider when building from scratch. Many limitations you’ll hit can be difficult to solve as each problem is interconnected with the others and can require deep expertise in problem areas you may not be familiar with.

If you don’t want to solve these problems on your own, you can get started with a framework that provides these features out of the box.

**Examples:**

Example 1 (python):
```python
npm create vite@latest my-app -- --template react-ts
```

Example 2 (unknown):
```unknown
npm install --save-dev parcel
```

Example 3 (unknown):
```unknown
npx create-rsbuild --template react
```

---

## Rendering Lists

**URL:** https://react.dev/learn/rendering-lists

**Contents:**
- Rendering Lists
  - You will learn
- Rendering data from arrays
- Filtering arrays of items
  - Pitfall
- Keeping list items in order with key
  - Note
      - Deep Dive
    - Displaying several DOM nodes for each list item
  - Where to get your key

You will often want to display multiple similar components from a collection of data. You can use the JavaScript array methods to manipulate an array of data. On this page, you’ll use filter() and map() with React to filter and transform your array of data into an array of components.

Say that you have a list of content.

The only difference among those list items is their contents, their data. You will often need to show several instances of the same component using different data when building interfaces: from lists of comments to galleries of profile images. In these situations, you can store that data in JavaScript objects and arrays and use methods like map() and filter() to render lists of components from them.

Here’s a short example of how to generate a list of items from an array:

Notice the sandbox above displays a console error:

You’ll learn how to fix this error later on this page. Before we get to that, let’s add some structure to your data.

This data can be structured even more.

Let’s say you want a way to only show people whose profession is 'chemist'. You can use JavaScript’s filter() method to return just those people. This method takes an array of items, passes them through a “test” (a function that returns true or false), and returns a new array of only those items that passed the test (returned true).

You only want the items where profession is 'chemist'. The “test” function for this looks like (person) => person.profession === 'chemist'. Here’s how to put it together:

Arrow functions implicitly return the expression right after =>, so you didn’t need a return statement:

However, you must write return explicitly if your => is followed by a { curly brace!

Arrow functions containing => { are said to have a “block body”. They let you write more than a single line of code, but you have to write a return statement yourself. If you forget it, nothing gets returned!

Notice that all the sandboxes above show an error in the console:

You need to give each array item a key — a string or a number that uniquely identifies it among other items in that array:

JSX elements directly inside a map() call always need keys!

Keys tell React which array item each component corresponds to, so that it can match them up later. This becomes important if your array items can move (e.g. due to sorting), get inserted, or get deleted. A well-chosen key helps React infer what exactly has happened, and make the correct updates to the DOM tree.

Rather than generating keys on the fly, you should include them in your data:

What do you do when each item needs to render not one, but several DOM nodes?

The short <>...</> Fragment syntax won’t let you pass a key, so you need to either group them into a single <div>, or use the slightly longer and more explicit <Fragment> syntax:

Fragments disappear from the DOM, so this will produce a flat list of <h1>, <p>, <h1>, <p>, and so on.

Different sources of data provide different sources of keys:

Imagine that files on your desktop didn’t have names. Instead, you’d refer to them by their order — the first file, the second file, and so on. You could get used to it, but once you delete a file, it would get confusing. The second file would become the first file, the third file would be the second file, and so on.

File names in a folder and JSX keys in an array serve a similar purpose. They let us uniquely identify an item between its siblings. A well-chosen key provides more information than the position within the array. Even if the position changes due to reordering, the key lets React identify the item throughout its lifetime.

You might be tempted to use an item’s index in the array as its key. In fact, that’s what React will use if you don’t specify a key at all. But the order in which you render items will change over time if an item is inserted, deleted, or if the array gets reordered. Index as a key often leads to subtle and confusing bugs.

Similarly, do not generate keys on the fly, e.g. with key={Math.random()}. This will cause keys to never match up between renders, leading to all your components and DOM being recreated every time. Not only is this slow, but it will also lose any user input inside the list items. Instead, use a stable ID based on the data.

Note that your components won’t receive key as a prop. It’s only used as a hint by React itself. If your component needs an ID, you have to pass it as a separate prop: <Profile key={id} userId={id} />.

On this page you learned:

This example shows a list of all people.

Change it to show two separate lists one after another: Chemists and Everyone Else. Like previously, you can determine whether a person is a chemist by checking if person.profession === 'chemist'.

**Examples:**

Example 1 (typescript):
```typescript
<ul>  <li>Creola Katherine Johnson: mathematician</li>  <li>Mario José Molina-Pasquel Henríquez: chemist</li>  <li>Mohammad Abdus Salam: physicist</li>  <li>Percy Lavon Julian: chemist</li>  <li>Subrahmanyan Chandrasekhar: astrophysicist</li></ul>
```

Example 2 (javascript):
```javascript
const people = [  'Creola Katherine Johnson: mathematician',  'Mario José Molina-Pasquel Henríquez: chemist',  'Mohammad Abdus Salam: physicist',  'Percy Lavon Julian: chemist',  'Subrahmanyan Chandrasekhar: astrophysicist'];
```

Example 3 (typescript):
```typescript
const listItems = people.map(person => <li>{person}</li>);
```

Example 4 (typescript):
```typescript
return <ul>{listItems}</ul>;
```

---

## Render and Commit

**URL:** https://react.dev/learn/render-and-commit

**Contents:**
- Render and Commit
  - You will learn
- Step 1: Trigger a render
  - Initial render
  - Re-renders when state updates
- Step 2: React renders your components
  - Pitfall
      - Deep Dive
    - Optimizing performance
- Step 3: React commits changes to the DOM

Before your components are displayed on screen, they must be rendered by React. Understanding the steps in this process will help you think about how your code executes and explain its behavior.

Imagine that your components are cooks in the kitchen, assembling tasty dishes from ingredients. In this scenario, React is the waiter who puts in requests from customers and brings them their orders. This process of requesting and serving UI has three steps:

Illustrated by Rachel Lee Nabors

There are two reasons for a component to render:

When your app starts, you need to trigger the initial render. Frameworks and sandboxes sometimes hide this code, but it’s done by calling createRoot with the target DOM node, and then calling its render method with your component:

Try commenting out the root.render() call and see the component disappear!

Once the component has been initially rendered, you can trigger further renders by updating its state with the set function. Updating your component’s state automatically queues a render. (You can imagine these as a restaurant guest ordering tea, dessert, and all sorts of things after putting in their first order, depending on the state of their thirst or hunger.)

Illustrated by Rachel Lee Nabors

After you trigger a render, React calls your components to figure out what to display on screen. “Rendering” is React calling your components.

This process is recursive: if the updated component returns some other component, React will render that component next, and if that component also returns something, it will render that component next, and so on. The process will continue until there are no more nested components and React knows exactly what should be displayed on screen.

In the following example, React will call Gallery() and Image() several times:

Rendering must always be a pure calculation:

Otherwise, you can encounter confusing bugs and unpredictable behavior as your codebase grows in complexity. When developing in “Strict Mode”, React calls each component’s function twice, which can help surface mistakes caused by impure functions.

The default behavior of rendering all components nested within the updated component is not optimal for performance if the updated component is very high in the tree. If you run into a performance issue, there are several opt-in ways to solve it described in the Performance section. Don’t optimize prematurely!

After rendering (calling) your components, React will modify the DOM.

React only changes the DOM nodes if there’s a difference between renders. For example, here is a component that re-renders with different props passed from its parent every second. Notice how you can add some text into the <input>, updating its value, but the text doesn’t disappear when the component re-renders:

This works because during this last step, React only updates the content of <h1> with the new time. It sees that the <input> appears in the JSX in the same place as last time, so React doesn’t touch the <input>—or its value!

After rendering is done and React updated the DOM, the browser will repaint the screen. Although this process is known as “browser rendering”, we’ll refer to it as “painting” to avoid confusion throughout the docs.

Illustrated by Rachel Lee Nabors

---

## Responding to Events

**URL:** https://react.dev/learn/responding-to-events

**Contents:**
- Responding to Events
  - You will learn
- Adding event handlers
  - Pitfall
  - Reading props in event handlers
  - Passing event handlers as props
  - Naming event handler props
  - Note
- Event propagation
  - Pitfall

React lets you add event handlers to your JSX. Event handlers are your own functions that will be triggered in response to interactions like clicking, hovering, focusing form inputs, and so on.

To add an event handler, you will first define a function and then pass it as a prop to the appropriate JSX tag. For example, here is a button that doesn’t do anything yet:

You can make it show a message when a user clicks by following these three steps:

You defined the handleClick function and then passed it as a prop to <button>. handleClick is an event handler. Event handler functions:

By convention, it is common to name event handlers as handle followed by the event name. You’ll often see onClick={handleClick}, onMouseEnter={handleMouseEnter}, and so on.

Alternatively, you can define an event handler inline in the JSX:

Or, more concisely, using an arrow function:

All of these styles are equivalent. Inline event handlers are convenient for short functions.

Functions passed to event handlers must be passed, not called. For example:

The difference is subtle. In the first example, the handleClick function is passed as an onClick event handler. This tells React to remember it and only call your function when the user clicks the button.

In the second example, the () at the end of handleClick() fires the function immediately during rendering, without any clicks. This is because JavaScript inside the JSX { and } executes right away.

When you write code inline, the same pitfall presents itself in a different way:

Passing inline code like this won’t fire on click—it fires every time the component renders:

If you want to define your event handler inline, wrap it in an anonymous function like so:

Rather than executing the code inside with every render, this creates a function to be called later.

In both cases, what you want to pass is a function:

Read more about arrow functions.

Because event handlers are declared inside of a component, they have access to the component’s props. Here is a button that, when clicked, shows an alert with its message prop:

This lets these two buttons show different messages. Try changing the messages passed to them.

Often you’ll want the parent component to specify a child’s event handler. Consider buttons: depending on where you’re using a Button component, you might want to execute a different function—perhaps one plays a movie and another uploads an image.

To do this, pass a prop the component receives from its parent as the event handler like so:

Here, the Toolbar component renders a PlayButton and an UploadButton:

Finally, your Button component accepts a prop called onClick. It passes that prop directly to the built-in browser <button> with onClick={onClick}. This tells React to call the passed function on click.

If you use a design system, it’s common for components like buttons to contain styling but not specify behavior. Instead, components like PlayButton and UploadButton will pass event handlers down.

Built-in components like <button> and <div> only support browser event names like onClick. However, when you’re building your own components, you can name their event handler props any way that you like.

By convention, event handler props should start with on, followed by a capital letter.

For example, the Button component’s onClick prop could have been called onSmash:

In this example, <button onClick={onSmash}> shows that the browser <button> (lowercase) still needs a prop called onClick, but the prop name received by your custom Button component is up to you!

When your component supports multiple interactions, you might name event handler props for app-specific concepts. For example, this Toolbar component receives onPlayMovie and onUploadImage event handlers:

Notice how the App component does not need to know what Toolbar will do with onPlayMovie or onUploadImage. That’s an implementation detail of the Toolbar. Here, Toolbar passes them down as onClick handlers to its Buttons, but it could later also trigger them on a keyboard shortcut. Naming props after app-specific interactions like onPlayMovie gives you the flexibility to change how they’re used later.

Make sure that you use the appropriate HTML tags for your event handlers. For example, to handle clicks, use <button onClick={handleClick}> instead of <div onClick={handleClick}>. Using a real browser <button> enables built-in browser behaviors like keyboard navigation. If you don’t like the default browser styling of a button and want to make it look more like a link or a different UI element, you can achieve it with CSS. Learn more about writing accessible markup.

Event handlers will also catch events from any children your component might have. We say that an event “bubbles” or “propagates” up the tree: it starts with where the event happened, and then goes up the tree.

This <div> contains two buttons. Both the <div> and each button have their own onClick handlers. Which handlers do you think will fire when you click a button?

If you click on either button, its onClick will run first, followed by the parent <div>’s onClick. So two messages will appear. If you click the toolbar itself, only the parent <div>’s onClick will run.

All events propagate in React except onScroll, which only works on the JSX tag you attach it to.

Event handlers receive an event object as their only argument. By convention, it’s usually called e, which stands for “event”. You can use this object to read information about the event.

That event object also lets you stop the propagation. If you want to prevent an event from reaching parent components, you need to call e.stopPropagation() like this Button component does:

When you click on a button:

As a result of e.stopPropagation(), clicking on the buttons now only shows a single alert (from the <button>) rather than the two of them (from the <button> and the parent toolbar <div>). Clicking a button is not the same thing as clicking the surrounding toolbar, so stopping the propagation makes sense for this UI.

In rare cases, you might need to catch all events on child elements, even if they stopped propagation. For example, maybe you want to log every click to analytics, regardless of the propagation logic. You can do this by adding Capture at the end of the event name:

Each event propagates in three phases:

Capture events are useful for code like routers or analytics, but you probably won’t use them in app code.

Notice how this click handler runs a line of code and then calls the onClick prop passed by the parent:

You could add more code to this handler before calling the parent onClick event handler, too. This pattern provides an alternative to propagation. It lets the child component handle the event, while also letting the parent component specify some additional behavior. Unlike propagation, it’s not automatic. But the benefit of this pattern is that you can clearly follow the whole chain of code that executes as a result of some event.

If you rely on propagation and it’s difficult to trace which handlers execute and why, try this approach instead.

Some browser events have default behavior associated with them. For example, a <form> submit event, which happens when a button inside of it is clicked, will reload the whole page by default:

You can call e.preventDefault() on the event object to stop this from happening:

Don’t confuse e.stopPropagation() and e.preventDefault(). They are both useful, but are unrelated:

Absolutely! Event handlers are the best place for side effects.

Unlike rendering functions, event handlers don’t need to be pure, so it’s a great place to change something—for example, change an input’s value in response to typing, or change a list in response to a button press. However, in order to change some information, you first need some way to store it. In React, this is done by using state, a component’s memory. You will learn all about it on the next page.

Clicking this button is supposed to switch the page background between white and black. However, nothing happens when you click it. Fix the problem. (Don’t worry about the logic inside handleClick—that part is fine.)

**Examples:**

Example 1 (jsx):
```jsx
<button onClick={function handleClick() {  alert('You clicked me!');}}>
```

Example 2 (jsx):
```jsx
<button onClick={() => {  alert('You clicked me!');}}>
```

Example 3 (jsx):
```jsx
// This alert fires when the component renders, not when clicked!<button onClick={alert('You clicked me!')}>
```

Example 4 (jsx):
```jsx
<button onClick={() => alert('You clicked me!')}>
```

---

## Synchronizing with Effects

**URL:** https://react.dev/learn/synchronizing-with-effects

**Contents:**
- Synchronizing with Effects
  - You will learn
- What are Effects and how are they different from events?
  - Note
- You might not need an Effect
- How to write an Effect
  - Step 1: Declare an Effect
  - Pitfall
  - Step 2: Specify the Effect dependencies
  - Pitfall

Some components need to synchronize with external systems. For example, you might want to control a non-React component based on the React state, set up a server connection, or send an analytics log when a component appears on the screen. Effects let you run some code after rendering so that you can synchronize your component with some system outside of React.

Before getting to Effects, you need to be familiar with two types of logic inside React components:

Rendering code (introduced in Describing the UI) lives at the top level of your component. This is where you take the props and state, transform them, and return the JSX you want to see on the screen. Rendering code must be pure. Like a math formula, it should only calculate the result, but not do anything else.

Event handlers (introduced in Adding Interactivity) are nested functions inside your components that do things rather than just calculate them. An event handler might update an input field, submit an HTTP POST request to buy a product, or navigate the user to another screen. Event handlers contain “side effects” (they change the program’s state) caused by a specific user action (for example, a button click or typing).

Sometimes this isn’t enough. Consider a ChatRoom component that must connect to the chat server whenever it’s visible on the screen. Connecting to a server is not a pure calculation (it’s a side effect) so it can’t happen during rendering. However, there is no single particular event like a click that causes ChatRoom to be displayed.

Effects let you specify side effects that are caused by rendering itself, rather than by a particular event. Sending a message in the chat is an event because it is directly caused by the user clicking a specific button. However, setting up a server connection is an Effect because it should happen no matter which interaction caused the component to appear. Effects run at the end of a commit after the screen updates. This is a good time to synchronize the React components with some external system (like network or a third-party library).

Here and later in this text, capitalized “Effect” refers to the React-specific definition above, i.e. a side effect caused by rendering. To refer to the broader programming concept, we’ll say “side effect”.

Don’t rush to add Effects to your components. Keep in mind that Effects are typically used to “step out” of your React code and synchronize with some external system. This includes browser APIs, third-party widgets, network, and so on. If your Effect only adjusts some state based on other state, you might not need an Effect.

To write an Effect, follow these three steps:

Let’s look at each of these steps in detail.

To declare an Effect in your component, import the useEffect Hook from React:

Then, call it at the top level of your component and put some code inside your Effect:

Every time your component renders, React will update the screen and then run the code inside useEffect. In other words, useEffect “delays” a piece of code from running until that render is reflected on the screen.

Let’s see how you can use an Effect to synchronize with an external system. Consider a <VideoPlayer> React component. It would be nice to control whether it’s playing or paused by passing an isPlaying prop to it:

Your custom VideoPlayer component renders the built-in browser <video> tag:

However, the browser <video> tag does not have an isPlaying prop. The only way to control it is to manually call the play() and pause() methods on the DOM element. You need to synchronize the value of isPlaying prop, which tells whether the video should currently be playing, with calls like play() and pause().

We’ll need to first get a ref to the <video> DOM node.

You might be tempted to try to call play() or pause() during rendering, but that isn’t correct:

The reason this code isn’t correct is that it tries to do something with the DOM node during rendering. In React, rendering should be a pure calculation of JSX and should not contain side effects like modifying the DOM.

Moreover, when VideoPlayer is called for the first time, its DOM does not exist yet! There isn’t a DOM node yet to call play() or pause() on, because React doesn’t know what DOM to create until you return the JSX.

The solution here is to wrap the side effect with useEffect to move it out of the rendering calculation:

By wrapping the DOM update in an Effect, you let React update the screen first. Then your Effect runs.

When your VideoPlayer component renders (either the first time or if it re-renders), a few things will happen. First, React will update the screen, ensuring the <video> tag is in the DOM with the right props. Then React will run your Effect. Finally, your Effect will call play() or pause() depending on the value of isPlaying.

Press Play/Pause multiple times and see how the video player stays synchronized to the isPlaying value:

In this example, the “external system” you synchronized to React state was the browser media API. You can use a similar approach to wrap legacy non-React code (like jQuery plugins) into declarative React components.

Note that controlling a video player is much more complex in practice. Calling play() may fail, the user might play or pause using the built-in browser controls, and so on. This example is very simplified and incomplete.

By default, Effects run after every render. This is why code like this will produce an infinite loop:

Effects run as a result of rendering. Setting state triggers rendering. Setting state immediately in an Effect is like plugging a power outlet into itself. The Effect runs, it sets the state, which causes a re-render, which causes the Effect to run, it sets the state again, this causes another re-render, and so on.

Effects should usually synchronize your components with an external system. If there’s no external system and you only want to adjust some state based on other state, you might not need an Effect.

By default, Effects run after every render. Often, this is not what you want:

To demonstrate the issue, here is the previous example with a few console.log calls and a text input that updates the parent component’s state. Notice how typing causes the Effect to re-run:

You can tell React to skip unnecessarily re-running the Effect by specifying an array of dependencies as the second argument to the useEffect call. Start by adding an empty [] array to the above example on line 14:

You should see an error saying React Hook useEffect has a missing dependency: 'isPlaying':

The problem is that the code inside of your Effect depends on the isPlaying prop to decide what to do, but this dependency was not explicitly declared. To fix this issue, add isPlaying to the dependency array:

Now all dependencies are declared, so there is no error. Specifying [isPlaying] as the dependency array tells React that it should skip re-running your Effect if isPlaying is the same as it was during the previous render. With this change, typing into the input doesn’t cause the Effect to re-run, but pressing Play/Pause does:

The dependency array can contain multiple dependencies. React will only skip re-running the Effect if all of the dependencies you specify have exactly the same values as they had during the previous render. React compares the dependency values using the Object.is comparison. See the useEffect reference for details.

Notice that you can’t “choose” your dependencies. You will get a lint error if the dependencies you specified don’t match what React expects based on the code inside your Effect. This helps catch many bugs in your code. If you don’t want some code to re-run, edit the Effect code itself to not “need” that dependency.

The behaviors without the dependency array and with an empty [] dependency array are different:

We’ll take a close look at what “mount” means in the next step.

This Effect uses both ref and isPlaying, but only isPlaying is declared as a dependency:

This is because the ref object has a stable identity: React guarantees you’ll always get the same object from the same useRef call on every render. It never changes, so it will never by itself cause the Effect to re-run. Therefore, it does not matter whether you include it or not. Including it is fine too:

The set functions returned by useState also have stable identity, so you will often see them omitted from the dependencies too. If the linter lets you omit a dependency without errors, it is safe to do.

Omitting always-stable dependencies only works when the linter can “see” that the object is stable. For example, if ref was passed from a parent component, you would have to specify it in the dependency array. However, this is good because you can’t know whether the parent component always passes the same ref, or passes one of several refs conditionally. So your Effect would depend on which ref is passed.

Consider a different example. You’re writing a ChatRoom component that needs to connect to the chat server when it appears. You are given a createConnection() API that returns an object with connect() and disconnect() methods. How do you keep the component connected while it is displayed to the user?

Start by writing the Effect logic:

It would be slow to connect to the chat after every re-render, so you add the dependency array:

The code inside the Effect does not use any props or state, so your dependency array is [] (empty). This tells React to only run this code when the component “mounts”, i.e. appears on the screen for the first time.

Let’s try running this code:

This Effect only runs on mount, so you might expect "✅ Connecting..." to be printed once in the console. However, if you check the console, "✅ Connecting..." gets printed twice. Why does it happen?

Imagine the ChatRoom component is a part of a larger app with many different screens. The user starts their journey on the ChatRoom page. The component mounts and calls connection.connect(). Then imagine the user navigates to another screen—for example, to the Settings page. The ChatRoom component unmounts. Finally, the user clicks Back and ChatRoom mounts again. This would set up a second connection—but the first connection was never destroyed! As the user navigates across the app, the connections would keep piling up.

Bugs like this are easy to miss without extensive manual testing. To help you spot them quickly, in development React remounts every component once immediately after its initial mount.

Seeing the "✅ Connecting..." log twice helps you notice the real issue: your code doesn’t close the connection when the component unmounts.

To fix the issue, return a cleanup function from your Effect:

React will call your cleanup function each time before the Effect runs again, and one final time when the component unmounts (gets removed). Let’s see what happens when the cleanup function is implemented:

Now you get three console logs in development:

This is the correct behavior in development. By remounting your component, React verifies that navigating away and back would not break your code. Disconnecting and then connecting again is exactly what should happen! When you implement the cleanup well, there should be no user-visible difference between running the Effect once vs running it, cleaning it up, and running it again. There’s an extra connect/disconnect call pair because React is probing your code for bugs in development. This is normal—don’t try to make it go away!

In production, you would only see "✅ Connecting..." printed once. Remounting components only happens in development to help you find Effects that need cleanup. You can turn off Strict Mode to opt out of the development behavior, but we recommend keeping it on. This lets you find many bugs like the one above.

React intentionally remounts your components in development to find bugs like in the last example. The right question isn’t “how to run an Effect once”, but “how to fix my Effect so that it works after remounting”.

Usually, the answer is to implement the cleanup function. The cleanup function should stop or undo whatever the Effect was doing. The rule of thumb is that the user shouldn’t be able to distinguish between the Effect running once (as in production) and a setup → cleanup → setup sequence (as you’d see in development).

Most of the Effects you’ll write will fit into one of the common patterns below.

A common pitfall for preventing Effects firing twice in development is to use a ref to prevent the Effect from running more than once. For example, you could “fix” the above bug with a useRef:

This makes it so you only see "✅ Connecting..." once in development, but it doesn’t fix the bug.

When the user navigates away, the connection still isn’t closed and when they navigate back, a new connection is created. As the user navigates across the app, the connections would keep piling up, the same as it would before the “fix”.

To fix the bug, it is not enough to just make the Effect run once. The effect needs to work after re-mounting, which means the connection needs to be cleaned up like in the solution above.

See the examples below for how to handle common patterns.

Sometimes you need to add UI widgets that aren’t written in React. For example, let’s say you’re adding a map component to your page. It has a setZoomLevel() method, and you’d like to keep the zoom level in sync with a zoomLevel state variable in your React code. Your Effect would look similar to this:

Note that there is no cleanup needed in this case. In development, React will call the Effect twice, but this is not a problem because calling setZoomLevel twice with the same value does not do anything. It may be slightly slower, but this doesn’t matter because it won’t remount needlessly in production.

Some APIs may not allow you to call them twice in a row. For example, the showModal method of the built-in <dialog> element throws if you call it twice. Implement the cleanup function and make it close the dialog:

In development, your Effect will call showModal(), then immediately close(), and then showModal() again. This has the same user-visible behavior as calling showModal() once, as you would see in production.

If your Effect subscribes to something, the cleanup function should unsubscribe:

In development, your Effect will call addEventListener(), then immediately removeEventListener(), and then addEventListener() again with the same handler. So there would be only one active subscription at a time. This has the same user-visible behavior as calling addEventListener() once, as in production.

If your Effect animates something in, the cleanup function should reset the animation to the initial values:

In development, opacity will be set to 1, then to 0, and then to 1 again. This should have the same user-visible behavior as setting it to 1 directly, which is what would happen in production. If you use a third-party animation library with support for tweening, your cleanup function should reset the timeline to its initial state.

If your Effect fetches something, the cleanup function should either abort the fetch or ignore its result:

You can’t “undo” a network request that already happened, but your cleanup function should ensure that the fetch that’s not relevant anymore does not keep affecting your application. If the userId changes from 'Alice' to 'Bob', cleanup ensures that the 'Alice' response is ignored even if it arrives after 'Bob'.

In development, you will see two fetches in the Network tab. There is nothing wrong with that. With the approach above, the first Effect will immediately get cleaned up so its copy of the ignore variable will be set to true. So even though there is an extra request, it won’t affect the state thanks to the if (!ignore) check.

In production, there will only be one request. If the second request in development is bothering you, the best approach is to use a solution that deduplicates requests and caches their responses between components:

This will not only improve the development experience, but also make your application feel faster. For example, the user pressing the Back button won’t have to wait for some data to load again because it will be cached. You can either build such a cache yourself or use one of the many alternatives to manual fetching in Effects.

Writing fetch calls inside Effects is a popular way to fetch data, especially in fully client-side apps. This is, however, a very manual approach and it has significant downsides:

This list of downsides is not specific to React. It applies to fetching data on mount with any library. Like with routing, data fetching is not trivial to do well, so we recommend the following approaches:

You can continue fetching data directly in Effects if neither of these approaches suit you.

Consider this code that sends an analytics event on the page visit:

In development, logVisit will be called twice for every URL, so you might be tempted to try to fix that. We recommend keeping this code as is. Like with earlier examples, there is no user-visible behavior difference between running it once and running it twice. From a practical point of view, logVisit should not do anything in development because you don’t want the logs from the development machines to skew the production metrics. Your component remounts every time you save its file, so it logs extra visits in development anyway.

In production, there will be no duplicate visit logs.

To debug the analytics events you’re sending, you can deploy your app to a staging environment (which runs in production mode) or temporarily opt out of Strict Mode and its development-only remounting checks. You may also send analytics from the route change event handlers instead of Effects. For more precise analytics, intersection observers can help track which components are in the viewport and how long they remain visible.

Some logic should only run once when the application starts. You can put it outside your components:

This guarantees that such logic only runs once after the browser loads the page.

Sometimes, even if you write a cleanup function, there’s no way to prevent user-visible consequences of running the Effect twice. For example, maybe your Effect sends a POST request like buying a product:

You wouldn’t want to buy the product twice. However, this is also why you shouldn’t put this logic in an Effect. What if the user goes to another page and then presses Back? Your Effect would run again. You don’t want to buy the product when the user visits a page; you want to buy it when the user clicks the Buy button.

Buying is not caused by rendering; it’s caused by a specific interaction. It should run only when the user presses the button. Delete the Effect and move your /api/buy request into the Buy button event handler:

This illustrates that if remounting breaks the logic of your application, this usually uncovers existing bugs. From a user’s perspective, visiting a page shouldn’t be different from visiting it, clicking a link, then pressing Back to view the page again. React verifies that your components abide by this principle by remounting them once in development.

This playground can help you “get a feel” for how Effects work in practice.

This example uses setTimeout to schedule a console log with the input text to appear three seconds after the Effect runs. The cleanup function cancels the pending timeout. Start by pressing “Mount the component”:

You will see three logs at first: Schedule "a" log, Cancel "a" log, and Schedule "a" log again. Three second later there will also be a log saying a. As you learned earlier, the extra schedule/cancel pair is because React remounts the component once in development to verify that you’ve implemented cleanup well.

Now edit the input to say abc. If you do it fast enough, you’ll see Schedule "ab" log immediately followed by Cancel "ab" log and Schedule "abc" log. React always cleans up the previous render’s Effect before the next render’s Effect. This is why even if you type into the input fast, there is at most one timeout scheduled at a time. Edit the input a few times and watch the console to get a feel for how Effects get cleaned up.

Type something into the input and then immediately press “Unmount the component”. Notice how unmounting cleans up the last render’s Effect. Here, it clears the last timeout before it has a chance to fire.

Finally, edit the component above and comment out the cleanup function so that the timeouts don’t get cancelled. Try typing abcde fast. What do you expect to happen in three seconds? Will console.log(text) inside the timeout print the latest text and produce five abcde logs? Give it a try to check your intuition!

Three seconds later, you should see a sequence of logs (a, ab, abc, abcd, and abcde) rather than five abcde logs. Each Effect “captures” the text value from its corresponding render. It doesn’t matter that the text state changed: an Effect from the render with text = 'ab' will always see 'ab'. In other words, Effects from each render are isolated from each other. If you’re curious how this works, you can read about closures.

You can think of useEffect as “attaching” a piece of behavior to the render output. Consider this Effect:

Let’s see what exactly happens as the user navigates around the app.

The user visits <ChatRoom roomId="general" />. Let’s mentally substitute roomId with 'general':

The Effect is also a part of the rendering output. The first render’s Effect becomes:

React runs this Effect, which connects to the 'general' chat room.

Let’s say <ChatRoom roomId="general" /> re-renders. The JSX output is the same:

React sees that the rendering output has not changed, so it doesn’t update the DOM.

The Effect from the second render looks like this:

React compares ['general'] from the second render with ['general'] from the first render. Because all dependencies are the same, React ignores the Effect from the second render. It never gets called.

Then, the user visits <ChatRoom roomId="travel" />. This time, the component returns different JSX:

React updates the DOM to change "Welcome to general" into "Welcome to travel".

The Effect from the third render looks like this:

React compares ['travel'] from the third render with ['general'] from the second render. One dependency is different: Object.is('travel', 'general') is false. The Effect can’t be skipped.

Before React can apply the Effect from the third render, it needs to clean up the last Effect that did run. The second render’s Effect was skipped, so React needs to clean up the first render’s Effect. If you scroll up to the first render, you’ll see that its cleanup calls disconnect() on the connection that was created with createConnection('general'). This disconnects the app from the 'general' chat room.

After that, React runs the third render’s Effect. It connects to the 'travel' chat room.

Finally, let’s say the user navigates away, and the ChatRoom component unmounts. React runs the last Effect’s cleanup function. The last Effect was from the third render. The third render’s cleanup destroys the createConnection('travel') connection. So the app disconnects from the 'travel' room.

When Strict Mode is on, React remounts every component once after mount (state and DOM are preserved). This helps you find Effects that need cleanup and exposes bugs like race conditions early. Additionally, React will remount the Effects whenever you save a file in development. Both of these behaviors are development-only.

In this example, the form renders a <MyInput /> component.

Use the input’s focus() method to make MyInput automatically focus when it appears on the screen. There is already a commented out implementation, but it doesn’t quite work. Figure out why it doesn’t work, and fix it. (If you’re familiar with the autoFocus attribute, pretend that it does not exist: we are reimplementing the same functionality from scratch.)

To verify that your solution works, press “Show form” and verify that the input receives focus (becomes highlighted and the cursor is placed inside). Press “Hide form” and “Show form” again. Verify the input is highlighted again.

MyInput should only focus on mount rather than after every render. To verify that the behavior is right, press “Show form” and then repeatedly press the “Make it uppercase” checkbox. Clicking the checkbox should not focus the input above it.

**Examples:**

Example 1 (sql):
```sql
import { useEffect } from 'react';
```

Example 2 (jsx):
```jsx
function MyComponent() {  useEffect(() => {    // Code here will run after *every* render  });  return <div />;}
```

Example 3 (jsx):
```jsx
<VideoPlayer isPlaying={isPlaying} />;
```

Example 4 (jsx):
```jsx
function VideoPlayer({ src, isPlaying }) {  // TODO: do something with isPlaying  return <video src={src} />;}
```

---

## Debugging and Troubleshooting

**URL:** https://react.dev/learn/react-compiler/debugging

**Contents:**
- Debugging and Troubleshooting
  - You will learn
- Understanding Compiler Behavior
  - Compiler Errors vs Runtime Issues
- Common Breaking Patterns
- Debugging Workflow
  - Compiler Build Errors
  - Runtime Issues
  - 1. Temporarily Disable Compilation
  - 2. Fix Issues Step by Step

This guide helps you identify and fix issues when using React Compiler. Learn how to debug compilation problems and resolve common issues.

React Compiler is designed to handle code that follows the Rules of React. When it encounters code that might break these rules, it safely skips optimization rather than risk changing your app’s behavior.

Compiler errors occur at build time and prevent your code from compiling. These are rare because the compiler is designed to skip problematic code rather than fail.

Runtime issues occur when compiled code behaves differently than expected. Most of the time, if you encounter an issue with React Compiler, it’s a runtime issue. This typically happens when your code violates the Rules of React in subtle ways that the compiler couldn’t detect, and the compiler mistakenly compiled a component it should have skipped.

When debugging runtime issues, focus your efforts on finding Rules of React violations in the affected components that were not detected by the ESLint rule. The compiler relies on your code following these rules, and when they’re broken in ways it can’t detect, that’s when runtime problems occur.

One of the main ways React Compiler can break your app is if your code was written to rely on memoization for correctness. This means your app depends on specific values being memoized to work properly. Since the compiler may memoize differently than your manual approach, this can lead to unexpected behavior like effects over-firing, infinite loops, or missing updates.

Common scenarios where this occurs:

Follow these steps when you encounter issues:

If you encounter a compiler error that unexpectedly breaks your build, this is likely a bug in the compiler. Report it to the facebook/react repository with:

For runtime behavior issues:

Use "use no memo" to isolate whether an issue is compiler-related:

If the issue disappears, it’s likely related to a Rules of React violation.

You can also try removing manual memoization (useMemo, useCallback, memo) from the problematic component to verify that your app works correctly without any memoization. If the bug still occurs when all memoization is removed, you have a Rules of React violation that needs to be fixed.

If you believe you’ve found a compiler bug:

**Examples:**

Example 1 (javascript):
```javascript
function ProblematicComponent() {  "use no memo"; // Skip compilation for this component  // ... rest of component}
```

---

## Incremental Adoption

**URL:** https://react.dev/learn/react-compiler/incremental-adoption

**Contents:**
- Incremental Adoption
  - You will learn
- Why Incremental Adoption?
- Approaches to Incremental Adoption
- Directory-Based Adoption with Babel Overrides
  - Basic Configuration
  - Expanding Coverage
  - With Compiler Options
- Opt-in Mode with “use memo”
  - Note

React Compiler can be adopted incrementally, allowing you to try it on specific parts of your codebase first. This guide shows you how to gradually roll out the compiler in existing projects.

React Compiler is designed to optimize your entire codebase automatically, but you don’t have to adopt it all at once. Incremental adoption gives you control over the rollout process, letting you test the compiler on small parts of your app before expanding to the rest.

Starting small helps you build confidence in the compiler’s optimizations. You can verify that your app behaves correctly with compiled code, measure performance improvements, and identify any edge cases specific to your codebase. This approach is especially valuable for production applications where stability is critical.

Incremental adoption also makes it easier to address any Rules of React violations the compiler might find. Instead of fixing violations across your entire codebase at once, you can tackle them systematically as you expand compiler coverage. This keeps the migration manageable and reduces the risk of introducing bugs.

By controlling which parts of your code get compiled, you can also run A/B tests to measure the real-world impact of the compiler’s optimizations. This data helps you make informed decisions about full adoption and demonstrates the value to your team.

There are three main approaches to adopt React Compiler incrementally:

All approaches allow you to test the compiler on specific parts of your application before full rollout.

Babel’s overrides option lets you apply different plugins to different parts of your codebase. This is ideal for gradually adopting React Compiler directory by directory.

Start by applying the compiler to a specific directory:

As you gain confidence, add more directories:

You can also configure compiler options per override:

For maximum control, you can use compilationMode: 'annotation' to only compile components and hooks that explicitly opt in with the "use memo" directive.

This approach gives you fine-grained control over individual components and hooks. It’s useful when you want to test the compiler on specific components without affecting entire directories.

Add "use memo" at the beginning of functions you want to compile:

With compilationMode: 'annotation', you must:

This gives you precise control over which components are compiled while you evaluate the compiler’s impact.

The gating option enables you to control compilation at runtime using feature flags. This is useful for running A/B tests or gradually rolling out the compiler based on user segments.

The compiler wraps optimized code in a runtime check. If the gate returns true, the optimized version runs. Otherwise, the original code runs.

Create a module that exports your gating function:

If you encounter issues during adoption:

**Examples:**

Example 1 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    // Global plugins that apply to all files  ],  overrides: [    {      test: './src/modern/**/*.{js,jsx,ts,tsx}',      plugins: [        'babel-plugin-react-compiler'      ]    }  ]};
```

Example 2 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    // Global plugins  ],  overrides: [    {      test: ['./src/modern/**/*.{js,jsx,ts,tsx}', './src/features/**/*.{js,jsx,ts,tsx}'],      plugins: [        'babel-plugin-react-compiler'      ]    },    {      test: './src/legacy/**/*.{js,jsx,ts,tsx}',      plugins: [        // Different plugins for legacy code      ]    }  ]};
```

Example 3 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [],  overrides: [    {      test: './src/experimental/**/*.{js,jsx,ts,tsx}',      plugins: [        ['babel-plugin-react-compiler', {          // options ...        }]      ]    },    {      test: './src/production/**/*.{js,jsx,ts,tsx}',      plugins: [        ['babel-plugin-react-compiler', {          // options ...        }]      ]    }  ]};
```

Example 4 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'annotation',    }],  ],};
```

---

## Thinking in React

**URL:** https://react.dev/learn/thinking-in-react

**Contents:**
- Thinking in React
- Start with the mockup
- Step 1: Break the UI into a component hierarchy
- Step 2: Build a static version in React
  - Pitfall
- Step 3: Find the minimal but complete representation of UI state
      - Deep Dive
    - Props vs State
- Step 4: Identify where your state should live
- Step 5: Add inverse data flow

React can change how you think about the designs you look at and the apps you build. When you build a user interface with React, you will first break it apart into pieces called components. Then, you will describe the different visual states for each of your components. Finally, you will connect your components together so that the data flows through them. In this tutorial, we’ll guide you through the thought process of building a searchable product data table with React.

Imagine that you already have a JSON API and a mockup from a designer.

The JSON API returns some data that looks like this:

The mockup looks like this:

To implement a UI in React, you will usually follow the same five steps.

Start by drawing boxes around every component and subcomponent in the mockup and naming them. If you work with a designer, they may have already named these components in their design tool. Ask them!

Depending on your background, you can think about splitting up a design into components in different ways:

If your JSON is well-structured, you’ll often find that it naturally maps to the component structure of your UI. That’s because UI and data models often have the same information architecture—that is, the same shape. Separate your UI into components, where each component matches one piece of your data model.

There are five components on this screen:

If you look at ProductTable (lavender), you’ll see that the table header (containing the “Name” and “Price” labels) isn’t its own component. This is a matter of preference, and you could go either way. For this example, it is a part of ProductTable because it appears inside the ProductTable’s list. However, if this header grows to be complex (e.g., if you add sorting), you can move it into its own ProductTableHeader component.

Now that you’ve identified the components in the mockup, arrange them into a hierarchy. Components that appear within another component in the mockup should appear as a child in the hierarchy:

Now that you have your component hierarchy, it’s time to implement your app. The most straightforward approach is to build a version that renders the UI from your data model without adding any interactivity… yet! It’s often easier to build the static version first and add interactivity later. Building a static version requires a lot of typing and no thinking, but adding interactivity requires a lot of thinking and not a lot of typing.

To build a static version of your app that renders your data model, you’ll want to build components that reuse other components and pass data using props. Props are a way of passing data from parent to child. (If you’re familiar with the concept of state, don’t use state at all to build this static version. State is reserved only for interactivity, that is, data that changes over time. Since this is a static version of the app, you don’t need it.)

You can either build “top down” by starting with building the components higher up in the hierarchy (like FilterableProductTable) or “bottom up” by working from components lower down (like ProductRow). In simpler examples, it’s usually easier to go top-down, and on larger projects, it’s easier to go bottom-up.

(If this code looks intimidating, go through the Quick Start first!)

After building your components, you’ll have a library of reusable components that render your data model. Because this is a static app, the components will only return JSX. The component at the top of the hierarchy (FilterableProductTable) will take your data model as a prop. This is called one-way data flow because the data flows down from the top-level component to the ones at the bottom of the tree.

At this point, you should not be using any state values. That’s for the next step!

To make the UI interactive, you need to let users change your underlying data model. You will use state for this.

Think of state as the minimal set of changing data that your app needs to remember. The most important principle for structuring state is to keep it DRY (Don’t Repeat Yourself). Figure out the absolute minimal representation of the state your application needs and compute everything else on-demand. For example, if you’re building a shopping list, you can store the items as an array in state. If you want to also display the number of items in the list, don’t store the number of items as another state value—instead, read the length of your array.

Now think of all of the pieces of data in this example application:

Which of these are state? Identify the ones that are not:

What’s left is probably state.

Let’s go through them one by one again:

This means only the search text and the value of the checkbox are state! Nicely done!

There are two types of “model” data in React: props and state. The two are very different:

Props and state are different, but they work together. A parent component will often keep some information in state (so that it can change it), and pass it down to child components as their props. It’s okay if the difference still feels fuzzy on the first read. It takes a bit of practice for it to really stick!

After identifying your app’s minimal state data, you need to identify which component is responsible for changing this state, or owns the state. Remember: React uses one-way data flow, passing data down the component hierarchy from parent to child component. It may not be immediately clear which component should own what state. This can be challenging if you’re new to this concept, but you can figure it out by following these steps!

For each piece of state in your application:

In the previous step, you found two pieces of state in this application: the search input text, and the value of the checkbox. In this example, they always appear together, so it makes sense to put them into the same place.

Now let’s run through our strategy for them:

So the state values will live in FilterableProductTable.

Add state to the component with the useState() Hook. Hooks are special functions that let you “hook into” React. Add two state variables at the top of FilterableProductTable and specify their initial state:

Then, pass filterText and inStockOnly to ProductTable and SearchBar as props:

You can start seeing how your application will behave. Edit the filterText initial value from useState('') to useState('fruit') in the sandbox code below. You’ll see both the search input text and the table update:

Notice that editing the form doesn’t work yet. There is a console error in the sandbox above explaining why:

In the sandbox above, ProductTable and SearchBar read the filterText and inStockOnly props to render the table, the input, and the checkbox. For example, here is how SearchBar populates the input value:

However, you haven’t added any code to respond to the user actions like typing yet. This will be your final step.

Currently your app renders correctly with props and state flowing down the hierarchy. But to change the state according to user input, you will need to support data flowing the other way: the form components deep in the hierarchy need to update the state in FilterableProductTable.

React makes this data flow explicit, but it requires a little more typing than two-way data binding. If you try to type or check the box in the example above, you’ll see that React ignores your input. This is intentional. By writing <input value={filterText} />, you’ve set the value prop of the input to always be equal to the filterText state passed in from FilterableProductTable. Since filterText state is never set, the input never changes.

You want to make it so whenever the user changes the form inputs, the state updates to reflect those changes. The state is owned by FilterableProductTable, so only it can call setFilterText and setInStockOnly. To let SearchBar update the FilterableProductTable’s state, you need to pass these functions down to SearchBar:

Inside the SearchBar, you will add the onChange event handlers and set the parent state from them:

Now the application fully works!

You can learn all about handling events and updating state in the Adding Interactivity section.

This was a very brief introduction to how to think about building components and applications with React. You can start a React project right now or dive deeper on all the syntax used in this tutorial.

**Examples:**

Example 1 (json):
```json
[  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },  { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },  { category: "Vegetables", price: "$1", stocked: true, name: "Peas" }]
```

Example 2 (jsx):
```jsx
function FilterableProductTable({ products }) {  const [filterText, setFilterText] = useState('');  const [inStockOnly, setInStockOnly] = useState(false);
```

Example 3 (jsx):
```jsx
<div>  <SearchBar     filterText={filterText}     inStockOnly={inStockOnly} />  <ProductTable     products={products}    filterText={filterText}    inStockOnly={inStockOnly} /></div>
```

Example 4 (jsx):
```jsx
function SearchBar({ filterText, inStockOnly }) {  return (    <form>      <input         type="text"         value={filterText}         placeholder="Search..."/>
```

---
