# React - Components

**Pages:** 13

---

## Writing Markup with JSX

**URL:** https://react.dev/learn/writing-markup-with-jsx

**Contents:**
- Writing Markup with JSX
  - You will learn
- JSX: Putting markup into JavaScript
  - Note
- Converting HTML to JSX
  - Note
- The Rules of JSX
  - 1. Return a single root element
      - Deep Dive
    - Why do multiple JSX tags need to be wrapped?

JSX is a syntax extension for JavaScript that lets you write HTML-like markup inside a JavaScript file. Although there are other ways to write components, most React developers prefer the conciseness of JSX, and most codebases use it.

The Web has been built on HTML, CSS, and JavaScript. For many years, web developers kept content in HTML, design in CSS, and logic in JavaScript—often in separate files! Content was marked up inside HTML while the page’s logic lived separately in JavaScript:

But as the Web became more interactive, logic increasingly determined content. JavaScript was in charge of the HTML! This is why in React, rendering logic and markup live together in the same place—components.

Sidebar.js React component

Form.js React component

Keeping a button’s rendering logic and markup together ensures that they stay in sync with each other on every edit. Conversely, details that are unrelated, such as the button’s markup and a sidebar’s markup, are isolated from each other, making it safer to change either of them on their own.

Each React component is a JavaScript function that may contain some markup that React renders into the browser. React components use a syntax extension called JSX to represent that markup. JSX looks a lot like HTML, but it is a bit stricter and can display dynamic information. The best way to understand this is to convert some HTML markup to JSX markup.

JSX and React are two separate things. They’re often used together, but you can use them independently of each other. JSX is a syntax extension, while React is a JavaScript library.

Suppose that you have some (perfectly valid) HTML:

And you want to put it into your component:

If you copy and paste it as is, it will not work:

This is because JSX is stricter and has a few more rules than HTML! If you read the error messages above, they’ll guide you to fix the markup, or you can follow the guide below.

Most of the time, React’s on-screen error messages will help you find where the problem is. Give them a read if you get stuck!

To return multiple elements from a component, wrap them with a single parent tag.

For example, you can use a <div>:

If you don’t want to add an extra <div> to your markup, you can write <> and </> instead:

This empty tag is called a Fragment. Fragments let you group things without leaving any trace in the browser HTML tree.

JSX looks like HTML, but under the hood it is transformed into plain JavaScript objects. You can’t return two objects from a function without wrapping them into an array. This explains why you also can’t return two JSX tags without wrapping them into another tag or a Fragment.

JSX requires tags to be explicitly closed: self-closing tags like <img> must become <img />, and wrapping tags like <li>oranges must be written as <li>oranges</li>.

This is how Hedy Lamarr’s image and list items look closed:

JSX turns into JavaScript and attributes written in JSX become keys of JavaScript objects. In your own components, you will often want to read those attributes into variables. But JavaScript has limitations on variable names. For example, their names can’t contain dashes or be reserved words like class.

This is why, in React, many HTML and SVG attributes are written in camelCase. For example, instead of stroke-width you use strokeWidth. Since class is a reserved word, in React you write className instead, named after the corresponding DOM property:

You can find all these attributes in the list of DOM component props. If you get one wrong, don’t worry—React will print a message with a possible correction to the browser console.

For historical reasons, aria-* and data-* attributes are written as in HTML with dashes.

Converting all these attributes in existing markup can be tedious! We recommend using a converter to translate your existing HTML and SVG to JSX. Converters are very useful in practice, but it’s still worth understanding what is going on so that you can comfortably write JSX on your own.

Here is your final result:

Now you know why JSX exists and how to use it in components:

This HTML was pasted into a component, but it’s not valid JSX. Fix it:

Whether to do it by hand or using the converter is up to you!

**Examples:**

Example 1 (jsx):
```jsx
<h1>Hedy Lamarr's Todos</h1><img   src="https://i.imgur.com/yXOvdOSs.jpg"   alt="Hedy Lamarr"   class="photo"><ul>    <li>Invent new traffic lights    <li>Rehearse a movie scene    <li>Improve the spectrum technology</ul>
```

Example 2 (javascript):
```javascript
export default function TodoList() {  return (    // ???  )}
```

Example 3 (jsx):
```jsx
<div>  <h1>Hedy Lamarr's Todos</h1>  <img     src="https://i.imgur.com/yXOvdOSs.jpg"     alt="Hedy Lamarr"     class="photo"  >  <ul>    ...  </ul></div>
```

Example 4 (jsx):
```jsx
<>  <h1>Hedy Lamarr's Todos</h1>  <img     src="https://i.imgur.com/yXOvdOSs.jpg"     alt="Hedy Lamarr"     class="photo"  >  <ul>    ...  </ul></>
```

---

## Setup

**URL:** https://react.dev/learn/setup

**Contents:**
- Setup
- Editor Setup
- Using TypeScript
- React Developer Tools
- React Compiler
- Next steps

React integrates with tools like editors, TypeScript, browser extensions, and compilers. This section will help you get your environment set up.

See our recommended editors and learn how to set them up to work with React.

TypeScript is a popular way to add type definitions to JavaScript codebases. Learn how to integrate TypeScript into your React projects.

React Developer Tools is a browser extension that can inspect React components, edit props and state, and identify performance problems. Learn how to install it here.

React Compiler is a tool that automatically optimizes your React app. Learn more.

Head to the Quick Start guide for a tour of the most important React concepts you will encounter every day.

---

## Your First Component

**URL:** https://react.dev/learn/your-first-component

**Contents:**
- Your First Component
  - You will learn
- Components: UI building blocks
- Defining a component
  - Step 1: Export the component
  - Step 2: Define the function
  - Pitfall
  - Step 3: Add markup
  - Pitfall
- Using a component

Components are one of the core concepts of React. They are the foundation upon which you build user interfaces (UI), which makes them the perfect place to start your React journey!

On the Web, HTML lets us create rich structured documents with its built-in set of tags like <h1> and <li>:

This markup represents this article <article>, its heading <h1>, and an (abbreviated) table of contents as an ordered list <ol>. Markup like this, combined with CSS for style, and JavaScript for interactivity, lies behind every sidebar, avatar, modal, dropdown—every piece of UI you see on the Web.

React lets you combine your markup, CSS, and JavaScript into custom “components”, reusable UI elements for your app. The table of contents code you saw above could be turned into a <TableOfContents /> component you could render on every page. Under the hood, it still uses the same HTML tags like <article>, <h1>, etc.

Just like with HTML tags, you can compose, order and nest components to design whole pages. For example, the documentation page you’re reading is made out of React components:

As your project grows, you will notice that many of your designs can be composed by reusing components you already wrote, speeding up your development. Our table of contents above could be added to any screen with <TableOfContents />! You can even jumpstart your project with the thousands of components shared by the React open source community like Chakra UI and Material UI.

Traditionally when creating web pages, web developers marked up their content and then added interaction by sprinkling on some JavaScript. This worked great when interaction was a nice-to-have on the web. Now it is expected for many sites and all apps. React puts interactivity first while still using the same technology: a React component is a JavaScript function that you can sprinkle with markup. Here’s what that looks like (you can edit the example below):

And here’s how to build a component:

The export default prefix is a standard JavaScript syntax (not specific to React). It lets you mark the main function in a file so that you can later import it from other files. (More on importing in Importing and Exporting Components!)

With function Profile() { } you define a JavaScript function with the name Profile.

React components are regular JavaScript functions, but their names must start with a capital letter or they won’t work!

The component returns an <img /> tag with src and alt attributes. <img /> is written like HTML, but it is actually JavaScript under the hood! This syntax is called JSX, and it lets you embed markup inside JavaScript.

Return statements can be written all on one line, as in this component:

But if your markup isn’t all on the same line as the return keyword, you must wrap it in a pair of parentheses:

Without parentheses, any code on the lines after return will be ignored!

Now that you’ve defined your Profile component, you can nest it inside other components. For example, you can export a Gallery component that uses multiple Profile components:

Notice the difference in casing:

And Profile contains even more HTML: <img />. In the end, this is what the browser sees:

Components are regular JavaScript functions, so you can keep multiple components in the same file. This is convenient when components are relatively small or tightly related to each other. If this file gets crowded, you can always move Profile to a separate file. You will learn how to do this shortly on the page about imports.

Because the Profile components are rendered inside Gallery—even several times!—we can say that Gallery is a parent component, rendering each Profile as a “child”. This is part of the magic of React: you can define a component once, and then use it in as many places and as many times as you like.

Components can render other components, but you must never nest their definitions:

The snippet above is very slow and causes bugs. Instead, define every component at the top level:

When a child component needs some data from a parent, pass it by props instead of nesting definitions.

Your React application begins at a “root” component. Usually, it is created automatically when you start a new project. For example, if you use CodeSandbox or if you use the framework Next.js, the root component is defined in pages/index.js. In these examples, you’ve been exporting root components.

Most React apps use components all the way down. This means that you won’t only use components for reusable pieces like buttons, but also for larger pieces like sidebars, lists, and ultimately, complete pages! Components are a handy way to organize UI code and markup, even if some of them are only used once.

React-based frameworks take this a step further. Instead of using an empty HTML file and letting React “take over” managing the page with JavaScript, they also generate the HTML automatically from your React components. This allows your app to show some content before the JavaScript code loads.

Still, many websites only use React to add interactivity to existing HTML pages. They have many root components instead of a single one for the entire page. You can use as much—or as little—React as you need.

You’ve just gotten your first taste of React! Let’s recap some key points.

React lets you create components, reusable UI elements for your app.

In a React app, every piece of UI is a component.

React components are regular JavaScript functions except:

This sandbox doesn’t work because the root component is not exported:

Try to fix it yourself before looking at the solution!

**Examples:**

Example 1 (julia):
```julia
<article>  <h1>My First Component</h1>  <ol>    <li>Components: UI Building Blocks</li>    <li>Defining a Component</li>    <li>Using a Component</li>  </ol></article>
```

Example 2 (jsx):
```jsx
<PageLayout>  <NavigationHeader>    <SearchBar />    <Link to="/docs">Docs</Link>  </NavigationHeader>  <Sidebar />  <PageContent>    <TableOfContents />    <DocumentationText />  </PageContent></PageLayout>
```

Example 3 (jsx):
```jsx
return <img src="https://i.imgur.com/MK3eW3As.jpg" alt="Katherine Johnson" />;
```

Example 4 (jsx):
```jsx
return (  <div>    <img src="https://i.imgur.com/MK3eW3As.jpg" alt="Katherine Johnson" />  </div>);
```

---

## Adding Interactivity

**URL:** https://react.dev/learn/adding-interactivity

**Contents:**
- Adding Interactivity
  - In this chapter
- Responding to events
- Ready to learn this topic?
- State: a component’s memory
- Ready to learn this topic?
- Render and commit
- Ready to learn this topic?
- State as a snapshot
- Ready to learn this topic?

Some things on the screen update in response to user input. For example, clicking an image gallery switches the active image. In React, data that changes over time is called state. You can add state to any component, and update it as needed. In this chapter, you’ll learn how to write components that handle interactions, update their state, and display different output over time.

React lets you add event handlers to your JSX. Event handlers are your own functions that will be triggered in response to user interactions like clicking, hovering, focusing on form inputs, and so on.

Built-in components like <button> only support built-in browser events like onClick. However, you can also create your own components, and give their event handler props any application-specific names that you like.

Read Responding to Events to learn how to add event handlers.

Components often need to change what’s on the screen as a result of an interaction. Typing into the form should update the input field, clicking “next” on an image carousel should change which image is displayed, clicking “buy” puts a product in the shopping cart. Components need to “remember” things: the current input value, the current image, the shopping cart. In React, this kind of component-specific memory is called state.

You can add state to a component with a useState Hook. Hooks are special functions that let your components use React features (state is one of those features). The useState Hook lets you declare a state variable. It takes the initial state and returns a pair of values: the current state, and a state setter function that lets you update it.

Here is how an image gallery uses and updates state on click:

Read State: A Component’s Memory to learn how to remember a value and update it on interaction.

Before your components are displayed on the screen, they must be rendered by React. Understanding the steps in this process will help you think about how your code executes and explain its behavior.

Imagine that your components are cooks in the kitchen, assembling tasty dishes from ingredients. In this scenario, React is the waiter who puts in requests from customers and brings them their orders. This process of requesting and serving UI has three steps:

Illustrated by Rachel Lee Nabors

Read Render and Commit to learn the lifecycle of a UI update.

Unlike regular JavaScript variables, React state behaves more like a snapshot. Setting it does not change the state variable you already have, but instead triggers a re-render. This can be surprising at first!

This behavior helps you avoid subtle bugs. Here is a little chat app. Try to guess what happens if you press “Send” first and then change the recipient to Bob. Whose name will appear in the alert five seconds later?

Read State as a Snapshot to learn why state appears “fixed” and unchanging inside the event handlers.

This component is buggy: clicking “+3” increments the score only once.

State as a Snapshot explains why this is happening. Setting state requests a new re-render, but does not change it in the already running code. So score continues to be 0 right after you call setScore(score + 1).

You can fix this by passing an updater function when setting state. Notice how replacing setScore(score + 1) with setScore(s => s + 1) fixes the “+3” button. This lets you queue multiple state updates.

Read Queueing a Series of State Updates to learn how to queue a sequence of state updates.

State can hold any kind of JavaScript value, including objects. But you shouldn’t change objects and arrays that you hold in the React state directly. Instead, when you want to update an object and array, you need to create a new one (or make a copy of an existing one), and then update the state to use that copy.

Usually, you will use the ... spread syntax to copy objects and arrays that you want to change. For example, updating a nested object could look like this:

If copying objects in code gets tedious, you can use a library like Immer to reduce repetitive code:

Read Updating Objects in State to learn how to update objects correctly.

Arrays are another type of mutable JavaScript objects you can store in state and should treat as read-only. Just like with objects, when you want to update an array stored in state, you need to create a new one (or make a copy of an existing one), and then set state to use the new array:

If copying arrays in code gets tedious, you can use a library like Immer to reduce repetitive code:

Read Updating Arrays in State to learn how to update arrays correctly.

Head over to Responding to Events to start reading this chapter page by page!

Or, if you’re already familiar with these topics, why not read about Managing State?

**Examples:**

Example 1 (jsx):
```jsx
const [index, setIndex] = useState(0);const [showMore, setShowMore] = useState(false);
```

Example 2 (javascript):
```javascript
console.log(count);  // 0setCount(count + 1); // Request a re-render with 1console.log(count);  // Still 0!
```

Example 3 (javascript):
```javascript
console.log(score);  // 0setScore(score + 1); // setScore(0 + 1);console.log(score);  // 0setScore(score + 1); // setScore(0 + 1);console.log(score);  // 0setScore(score + 1); // setScore(0 + 1);console.log(score);  // 0
```

---

## Conditional Rendering

**URL:** https://react.dev/learn/conditional-rendering

**Contents:**
- Conditional Rendering
  - You will learn
- Conditionally returning JSX
  - Conditionally returning nothing with null
- Conditionally including JSX
  - Conditional (ternary) operator (? :)
      - Deep Dive
    - Are these two examples fully equivalent?
  - Logical AND operator (&&)
  - Pitfall

Your components will often need to display different things depending on different conditions. In React, you can conditionally render JSX using JavaScript syntax like if statements, &&, and ? : operators.

Let’s say you have a PackingList component rendering several Items, which can be marked as packed or not:

Notice that some of the Item components have their isPacked prop set to true instead of false. You want to add a checkmark (✅) to packed items if isPacked={true}.

You can write this as an if/else statement like so:

If the isPacked prop is true, this code returns a different JSX tree. With this change, some of the items get a checkmark at the end:

Try editing what gets returned in either case, and see how the result changes!

Notice how you’re creating branching logic with JavaScript’s if and return statements. In React, control flow (like conditions) is handled by JavaScript.

In some situations, you won’t want to render anything at all. For example, say you don’t want to show packed items at all. A component must return something. In this case, you can return null:

If isPacked is true, the component will return nothing, null. Otherwise, it will return JSX to render.

In practice, returning null from a component isn’t common because it might surprise a developer trying to render it. More often, you would conditionally include or exclude the component in the parent component’s JSX. Here’s how to do that!

In the previous example, you controlled which (if any!) JSX tree would be returned by the component. You may already have noticed some duplication in the render output:

Both of the conditional branches return <li className="item">...</li>:

While this duplication isn’t harmful, it could make your code harder to maintain. What if you want to change the className? You’d have to do it in two places in your code! In such a situation, you could conditionally include a little JSX to make your code more DRY.

JavaScript has a compact syntax for writing a conditional expression — the conditional operator or “ternary operator”.

You can read it as “if isPacked is true, then (?) render name + ' ✅', otherwise (:) render name”.

If you’re coming from an object-oriented programming background, you might assume that the two examples above are subtly different because one of them may create two different “instances” of <li>. But JSX elements aren’t “instances” because they don’t hold any internal state and aren’t real DOM nodes. They’re lightweight descriptions, like blueprints. So these two examples, in fact, are completely equivalent. Preserving and Resetting State goes into detail about how this works.

Now let’s say you want to wrap the completed item’s text into another HTML tag, like <del> to strike it out. You can add even more newlines and parentheses so that it’s easier to nest more JSX in each of the cases:

This style works well for simple conditions, but use it in moderation. If your components get messy with too much nested conditional markup, consider extracting child components to clean things up. In React, markup is a part of your code, so you can use tools like variables and functions to tidy up complex expressions.

Another common shortcut you’ll encounter is the JavaScript logical AND (&&) operator. Inside React components, it often comes up when you want to render some JSX when the condition is true, or render nothing otherwise. With &&, you could conditionally render the checkmark only if isPacked is true:

You can read this as “if isPacked, then (&&) render the checkmark, otherwise, render nothing”.

Here it is in action:

A JavaScript && expression returns the value of its right side (in our case, the checkmark) if the left side (our condition) is true. But if the condition is false, the whole expression becomes false. React considers false as a “hole” in the JSX tree, just like null or undefined, and doesn’t render anything in its place.

Don’t put numbers on the left side of &&.

To test the condition, JavaScript converts the left side to a boolean automatically. However, if the left side is 0, then the whole expression gets that value (0), and React will happily render 0 rather than nothing.

For example, a common mistake is to write code like messageCount && <p>New messages</p>. It’s easy to assume that it renders nothing when messageCount is 0, but it really renders the 0 itself!

To fix it, make the left side a boolean: messageCount > 0 && <p>New messages</p>.

When the shortcuts get in the way of writing plain code, try using an if statement and a variable. You can reassign variables defined with let, so start by providing the default content you want to display, the name:

Use an if statement to reassign a JSX expression to itemContent if isPacked is true:

Curly braces open the “window into JavaScript”. Embed the variable with curly braces in the returned JSX tree, nesting the previously calculated expression inside of JSX:

This style is the most verbose, but it’s also the most flexible. Here it is in action:

Like before, this works not only for text, but for arbitrary JSX too:

If you’re not familiar with JavaScript, this variety of styles might seem overwhelming at first. However, learning them will help you read and write any JavaScript code — and not just React components! Pick the one you prefer for a start, and then consult this reference again if you forget how the other ones work.

Use the conditional operator (cond ? a : b) to render a ❌ if isPacked isn’t true.

**Examples:**

Example 1 (jsx):
```jsx
if (isPacked) {  return <li className="item">{name} ✅</li>;}return <li className="item">{name}</li>;
```

Example 2 (jsx):
```jsx
if (isPacked) {  return null;}return <li className="item">{name}</li>;
```

Example 3 (jsx):
```jsx
<li className="item">{name} ✅</li>
```

Example 4 (jsx):
```jsx
<li className="item">{name}</li>
```

---

## Keeping Components Pure

**URL:** https://react.dev/learn/keeping-components-pure

**Contents:**
- Keeping Components Pure
  - You will learn
- Purity: Components as formulas
- Side Effects: (un)intended consequences
      - Deep Dive
    - Detecting impure calculations with StrictMode
  - Local mutation: Your component’s little secret
- Where you can cause side effects
      - Deep Dive
    - Why does React care about purity?

Some JavaScript functions are pure. Pure functions only perform a calculation and nothing more. By strictly only writing your components as pure functions, you can avoid an entire class of baffling bugs and unpredictable behavior as your codebase grows. To get these benefits, though, there are a few rules you must follow.

In computer science (and especially the world of functional programming), a pure function is a function with the following characteristics:

You might already be familiar with one example of pure functions: formulas in math.

Consider this math formula: y = 2x.

If x = 2 then y = 4. Always.

If x = 3 then y = 6. Always.

If x = 3, y won’t sometimes be 9 or –1 or 2.5 depending on the time of day or the state of the stock market.

If y = 2x and x = 3, y will always be 6.

If we made this into a JavaScript function, it would look like this:

In the above example, double is a pure function. If you pass it 3, it will return 6. Always.

React is designed around this concept. React assumes that every component you write is a pure function. This means that React components you write must always return the same JSX given the same inputs:

When you pass drinkers={2} to Recipe, it will return JSX containing 2 cups of water. Always.

If you pass drinkers={4}, it will return JSX containing 4 cups of water. Always.

Just like a math formula.

You could think of your components as recipes: if you follow them and don’t introduce new ingredients during the cooking process, you will get the same dish every time. That “dish” is the JSX that the component serves to React to render.

Illustrated by Rachel Lee Nabors

React’s rendering process must always be pure. Components should only return their JSX, and not change any objects or variables that existed before rendering—that would make them impure!

Here is a component that breaks this rule:

This component is reading and writing a guest variable declared outside of it. This means that calling this component multiple times will produce different JSX! And what’s more, if other components read guest, they will produce different JSX, too, depending on when they were rendered! That’s not predictable.

Going back to our formula y = 2x, now even if x = 2, we cannot trust that y = 4. Our tests could fail, our users would be baffled, planes would fall out of the sky—you can see how this would lead to confusing bugs!

You can fix this component by passing guest as a prop instead:

Now your component is pure, as the JSX it returns only depends on the guest prop.

In general, you should not expect your components to be rendered in any particular order. It doesn’t matter if you call y = 2x before or after y = 5x: both formulas will resolve independently of each other. In the same way, each component should only “think for itself”, and not attempt to coordinate with or depend upon others during rendering. Rendering is like a school exam: each component should calculate JSX on their own!

Although you might not have used them all yet, in React there are three kinds of inputs that you can read while rendering: props, state, and context. You should always treat these inputs as read-only.

When you want to change something in response to user input, you should set state instead of writing to a variable. You should never change preexisting variables or objects while your component is rendering.

React offers a “Strict Mode” in which it calls each component’s function twice during development. By calling the component functions twice, Strict Mode helps find components that break these rules.

Notice how the original example displayed “Guest #2”, “Guest #4”, and “Guest #6” instead of “Guest #1”, “Guest #2”, and “Guest #3”. The original function was impure, so calling it twice broke it. But the fixed pure version works even if the function is called twice every time. Pure functions only calculate, so calling them twice won’t change anything—just like calling double(2) twice doesn’t change what’s returned, and solving y = 2x twice doesn’t change what y is. Same inputs, same outputs. Always.

Strict Mode has no effect in production, so it won’t slow down the app for your users. To opt into Strict Mode, you can wrap your root component into <React.StrictMode>. Some frameworks do this by default.

In the above example, the problem was that the component changed a preexisting variable while rendering. This is often called a “mutation” to make it sound a bit scarier. Pure functions don’t mutate variables outside of the function’s scope or objects that were created before the call—that makes them impure!

However, it’s completely fine to change variables and objects that you’ve just created while rendering. In this example, you create an [] array, assign it to a cups variable, and then push a dozen cups into it:

If the cups variable or the [] array were created outside the TeaGathering function, this would be a huge problem! You would be changing a preexisting object by pushing items into that array.

However, it’s fine because you’ve created them during the same render, inside TeaGathering. No code outside of TeaGathering will ever know that this happened. This is called “local mutation”—it’s like your component’s little secret.

While functional programming relies heavily on purity, at some point, somewhere, something has to change. That’s kind of the point of programming! These changes—updating the screen, starting an animation, changing the data—are called side effects. They’re things that happen “on the side”, not during rendering.

In React, side effects usually belong inside event handlers. Event handlers are functions that React runs when you perform some action—for example, when you click a button. Even though event handlers are defined inside your component, they don’t run during rendering! So event handlers don’t need to be pure.

If you’ve exhausted all other options and can’t find the right event handler for your side effect, you can still attach it to your returned JSX with a useEffect call in your component. This tells React to execute it later, after rendering, when side effects are allowed. However, this approach should be your last resort.

When possible, try to express your logic with rendering alone. You’ll be surprised how far this can take you!

Writing pure functions takes some habit and discipline. But it also unlocks marvelous opportunities:

Every new React feature we’re building takes advantage of purity. From data fetching to animations to performance, keeping components pure unlocks the power of the React paradigm.

This component tries to set the <h1>’s CSS class to "night" during the time from midnight to six hours in the morning, and "day" at all other times. However, it doesn’t work. Can you fix this component?

You can verify whether your solution works by temporarily changing the computer’s timezone. When the current time is between midnight and six in the morning, the clock should have inverted colors!

**Examples:**

Example 1 (javascript):
```javascript
function double(number) {  return 2 * number;}
```

---

## Importing and Exporting Components

**URL:** https://react.dev/learn/importing-and-exporting-components

**Contents:**
- Importing and Exporting Components
  - You will learn
- The root component file
- Exporting and importing a component
  - Note
      - Deep Dive
    - Default vs named exports
- Exporting and importing multiple components from the same file
  - Note
- Recap

The magic of components lies in their reusability: you can create components that are composed of other components. But as you nest more and more components, it often makes sense to start splitting them into different files. This lets you keep your files easy to scan and reuse components in more places.

In Your First Component, you made a Profile component and a Gallery component that renders it:

These currently live in a root component file, named App.js in this example. Depending on your setup, your root component could be in another file, though. If you use a framework with file-based routing, such as Next.js, your root component will be different for every page.

What if you want to change the landing screen in the future and put a list of science books there? Or place all the profiles somewhere else? It makes sense to move Gallery and Profile out of the root component file. This will make them more modular and reusable in other files. You can move a component in three steps:

Here both Profile and Gallery have been moved out of App.js into a new file called Gallery.js. Now you can change App.js to import Gallery from Gallery.js:

Notice how this example is broken down into two component files now:

You may encounter files that leave off the .js file extension like so:

Either './Gallery.js' or './Gallery' will work with React, though the former is closer to how native ES Modules work.

There are two primary ways to export values with JavaScript: default exports and named exports. So far, our examples have only used default exports. But you can use one or both of them in the same file. A file can have no more than one default export, but it can have as many named exports as you like.

How you export your component dictates how you must import it. You will get an error if you try to import a default export the same way you would a named export! This chart can help you keep track:

When you write a default import, you can put any name you want after import. For example, you could write import Banana from './Button.js' instead and it would still provide you with the same default export. In contrast, with named imports, the name has to match on both sides. That’s why they are called named imports!

People often use default exports if the file exports only one component, and use named exports if it exports multiple components and values. Regardless of which coding style you prefer, always give meaningful names to your component functions and the files that contain them. Components without names, like export default () => {}, are discouraged because they make debugging harder.

What if you want to show just one Profile instead of a gallery? You can export the Profile component, too. But Gallery.js already has a default export, and you can’t have two default exports. You could create a new file with a default export, or you could add a named export for Profile. A file can only have one default export, but it can have numerous named exports!

To reduce the potential confusion between default and named exports, some teams choose to only stick to one style (default or named), or avoid mixing them in a single file. Do what works best for you!

First, export Profile from Gallery.js using a named export (no default keyword):

Then, import Profile from Gallery.js to App.js using a named import (with the curly braces):

Finally, render <Profile /> from the App component:

Now Gallery.js contains two exports: a default Gallery export, and a named Profile export. App.js imports both of them. Try editing <Profile /> to <Gallery /> and back in this example:

Now you’re using a mix of default and named exports:

On this page you learned:

Currently, Gallery.js exports both Profile and Gallery, which is a bit confusing.

Move the Profile component to its own Profile.js, and then change the App component to render both <Profile /> and <Gallery /> one after another.

You may use either a default or a named export for Profile, but make sure that you use the corresponding import syntax in both App.js and Gallery.js! You can refer to the table from the deep dive above:

After you get it working with one kind of exports, make it work with the other kind.

**Examples:**

Example 1 (sql):
```sql
import Gallery from './Gallery';
```

Example 2 (javascript):
```javascript
export function Profile() {  // ...}
```

Example 3 (sql):
```sql
import { Profile } from './Gallery.js';
```

Example 4 (jsx):
```jsx
export default function App() {  return <Profile />;}
```

---

## JavaScript in JSX with Curly Braces

**URL:** https://react.dev/learn/javascript-in-jsx-with-curly-braces

**Contents:**
- JavaScript in JSX with Curly Braces
  - You will learn
- Passing strings with quotes
- Using curly braces: A window into the JavaScript world
  - Where to use curly braces
- Using “double curlies”: CSS and other objects in JSX
  - Pitfall
- More fun with JavaScript objects and curly braces
- Recap
- Try out some challenges

JSX lets you write HTML-like markup inside a JavaScript file, keeping rendering logic and content in the same place. Sometimes you will want to add a little JavaScript logic or reference a dynamic property inside that markup. In this situation, you can use curly braces in your JSX to open a window to JavaScript.

When you want to pass a string attribute to JSX, you put it in single or double quotes:

Here, "https://i.imgur.com/7vQD0fPs.jpg" and "Gregorio Y. Zara" are being passed as strings.

But what if you want to dynamically specify the src or alt text? You could use a value from JavaScript by replacing " and " with { and }:

Notice the difference between className="avatar", which specifies an "avatar" CSS class name that makes the image round, and src={avatar} that reads the value of the JavaScript variable called avatar. That’s because curly braces let you work with JavaScript right there in your markup!

JSX is a special way of writing JavaScript. That means it’s possible to use JavaScript inside it—with curly braces { }. The example below first declares a name for the scientist, name, then embeds it with curly braces inside the <h1>:

Try changing the name’s value from 'Gregorio Y. Zara' to 'Hedy Lamarr'. See how the list title changes?

Any JavaScript expression will work between curly braces, including function calls like formatDate():

You can only use curly braces in two ways inside JSX:

In addition to strings, numbers, and other JavaScript expressions, you can even pass objects in JSX. Objects are also denoted with curly braces, like { name: "Hedy Lamarr", inventions: 5 }. Therefore, to pass a JS object in JSX, you must wrap the object in another pair of curly braces: person={{ name: "Hedy Lamarr", inventions: 5 }}.

You may see this with inline CSS styles in JSX. React does not require you to use inline styles (CSS classes work great for most cases). But when you need an inline style, you pass an object to the style attribute:

Try changing the values of backgroundColor and color.

You can really see the JavaScript object inside the curly braces when you write it like this:

The next time you see {{ and }} in JSX, know that it’s nothing more than an object inside the JSX curlies!

Inline style properties are written in camelCase. For example, HTML <ul style="background-color: black"> would be written as <ul style={{ backgroundColor: 'black' }}> in your component.

You can move several expressions into one object, and reference them in your JSX inside curly braces:

In this example, the person JavaScript object contains a name string and a theme object:

The component can use these values from person like so:

JSX is very minimal as a templating language because it lets you organize data and logic using JavaScript.

Now you know almost everything about JSX:

This code crashes with an error saying Objects are not valid as a React child:

Can you find the problem?

**Examples:**

Example 1 (jsx):
```jsx
<ul style={  {    backgroundColor: 'black',    color: 'pink'  }}>
```

Example 2 (css):
```css
const person = {  name: 'Gregorio Y. Zara',  theme: {    backgroundColor: 'black',    color: 'pink'  }};
```

Example 3 (jsx):
```jsx
<div style={person.theme}>  <h1>{person.name}'s Todos</h1>
```

---

## State: A Component's Memory

**URL:** https://react.dev/learn/state-a-components-memory

**Contents:**
- State: A Component's Memory
  - You will learn
- When a regular variable isn’t enough
- Adding a state variable
  - Meet your first Hook
  - Pitfall
  - Anatomy of useState
  - Note
- Giving a component multiple state variables
      - Deep Dive

Components often need to change what’s on the screen as a result of an interaction. Typing into the form should update the input field, clicking “next” on an image carousel should change which image is displayed, clicking “buy” should put a product in the shopping cart. Components need to “remember” things: the current input value, the current image, the shopping cart. In React, this kind of component-specific memory is called state.

Here’s a component that renders a sculpture image. Clicking the “Next” button should show the next sculpture by changing the index to 1, then 2, and so on. However, this won’t work (you can try it!):

The handleClick event handler is updating a local variable, index. But two things prevent that change from being visible:

To update a component with new data, two things need to happen:

The useState Hook provides those two things:

To add a state variable, import useState from React at the top of the file:

Then, replace this line:

index is a state variable and setIndex is the setter function.

The [ and ] syntax here is called array destructuring and it lets you read values from an array. The array returned by useState always has exactly two items.

This is how they work together in handleClick:

Now clicking the “Next” button switches the current sculpture:

In React, useState, as well as any other function starting with “use”, is called a Hook.

Hooks are special functions that are only available while React is rendering (which we’ll get into in more detail on the next page). They let you “hook into” different React features.

State is just one of those features, but you will meet the other Hooks later.

Hooks—functions starting with use—can only be called at the top level of your components or your own Hooks. You can’t call Hooks inside conditions, loops, or other nested functions. Hooks are functions, but it’s helpful to think of them as unconditional declarations about your component’s needs. You “use” React features at the top of your component similar to how you “import” modules at the top of your file.

When you call useState, you are telling React that you want this component to remember something:

In this case, you want React to remember index.

The convention is to name this pair like const [something, setSomething]. You could name it anything you like, but conventions make things easier to understand across projects.

The only argument to useState is the initial value of your state variable. In this example, the index’s initial value is set to 0 with useState(0).

Every time your component renders, useState gives you an array containing two values:

Here’s how that happens in action:

You can have as many state variables of as many types as you like in one component. This component has two state variables, a number index and a boolean showMore that’s toggled when you click “Show details”:

It is a good idea to have multiple state variables if their state is unrelated, like index and showMore in this example. But if you find that you often change two state variables together, it might be easier to combine them into one. For example, if you have a form with many fields, it’s more convenient to have a single state variable that holds an object than state variable per field. Read Choosing the State Structure for more tips.

You might have noticed that the useState call does not receive any information about which state variable it refers to. There is no “identifier” that is passed to useState, so how does it know which of the state variables to return? Does it rely on some magic like parsing your functions? The answer is no.

Instead, to enable their concise syntax, Hooks rely on a stable call order on every render of the same component. This works well in practice because if you follow the rule above (“only call Hooks at the top level”), Hooks will always be called in the same order. Additionally, a linter plugin catches most mistakes.

Internally, React holds an array of state pairs for every component. It also maintains the current pair index, which is set to 0 before rendering. Each time you call useState, React gives you the next state pair and increments the index. You can read more about this mechanism in React Hooks: Not Magic, Just Arrays.

This example doesn’t use React but it gives you an idea of how useState works internally:

You don’t have to understand it to use React, but you might find this a helpful mental model.

State is local to a component instance on the screen. In other words, if you render the same component twice, each copy will have completely isolated state! Changing one of them will not affect the other.

In this example, the Gallery component from earlier is rendered twice with no changes to its logic. Try clicking the buttons inside each of the galleries. Notice that their state is independent:

This is what makes state different from regular variables that you might declare at the top of your module. State is not tied to a particular function call or a place in the code, but it’s “local” to the specific place on the screen. You rendered two <Gallery /> components, so their state is stored separately.

Also notice how the Page component doesn’t “know” anything about the Gallery state or even whether it has any. Unlike props, state is fully private to the component declaring it. The parent component can’t change it. This lets you add state to any component or remove it without impacting the rest of the components.

What if you wanted both galleries to keep their states in sync? The right way to do it in React is to remove state from child components and add it to their closest shared parent. The next few pages will focus on organizing state of a single component, but we will return to this topic in Sharing State Between Components.

When you press “Next” on the last sculpture, the code crashes. Fix the logic to prevent the crash. You may do this by adding extra logic to event handler or by disabling the button when the action is not possible.

After fixing the crash, add a “Previous” button that shows the previous sculpture. It shouldn’t crash on the first sculpture.

**Examples:**

Example 1 (sql):
```sql
import { useState } from 'react';
```

Example 2 (javascript):
```javascript
let index = 0;
```

Example 3 (jsx):
```jsx
const [index, setIndex] = useState(0);
```

Example 4 (javascript):
```javascript
function handleClick() {  setIndex(index + 1);}
```

---

## Passing Props to a Component

**URL:** https://react.dev/learn/passing-props-to-a-component

**Contents:**
- Passing Props to a Component
  - You will learn
- Familiar props
- Passing props to a component
  - Step 1: Pass props to the child component
  - Note
  - Step 2: Read props inside the child component
  - Pitfall
- Specifying a default value for a prop
- Forwarding props with the JSX spread syntax

React components use props to communicate with each other. Every parent component can pass some information to its child components by giving them props. Props might remind you of HTML attributes, but you can pass any JavaScript value through them, including objects, arrays, and functions.

Props are the information that you pass to a JSX tag. For example, className, src, alt, width, and height are some of the props you can pass to an <img>:

The props you can pass to an <img> tag are predefined (ReactDOM conforms to the HTML standard). But you can pass any props to your own components, such as <Avatar>, to customize them. Here’s how!

In this code, the Profile component isn’t passing any props to its child component, Avatar:

You can give Avatar some props in two steps.

First, pass some props to Avatar. For example, let’s pass two props: person (an object), and size (a number):

If double curly braces after person= confuse you, recall they’re merely an object inside the JSX curlies.

Now you can read these props inside the Avatar component.

You can read these props by listing their names person, size separated by the commas inside ({ and }) directly after function Avatar. This lets you use them inside the Avatar code, like you would with a variable.

Add some logic to Avatar that uses the person and size props for rendering, and you’re done.

Now you can configure Avatar to render in many different ways with different props. Try tweaking the values!

Props let you think about parent and child components independently. For example, you can change the person or the size props inside Profile without having to think about how Avatar uses them. Similarly, you can change how the Avatar uses these props, without looking at the Profile.

You can think of props like “knobs” that you can adjust. They serve the same role as arguments serve for functions—in fact, props are the only argument to your component! React component functions accept a single argument, a props object:

Usually you don’t need the whole props object itself, so you destructure it into individual props.

Don’t miss the pair of { and } curlies inside of ( and ) when declaring props:

This syntax is called “destructuring” and is equivalent to reading properties from a function parameter:

If you want to give a prop a default value to fall back on when no value is specified, you can do it with the destructuring by putting = and the default value right after the parameter:

Now, if <Avatar person={...} /> is rendered with no size prop, the size will be set to 100.

The default value is only used if the size prop is missing or if you pass size={undefined}. But if you pass size={null} or size={0}, the default value will not be used.

Sometimes, passing props gets very repetitive:

There’s nothing wrong with repetitive code—it can be more legible. But at times you may value conciseness. Some components forward all of their props to their children, like how this Profile does with Avatar. Because they don’t use any of their props directly, it can make sense to use a more concise “spread” syntax:

This forwards all of Profile’s props to the Avatar without listing each of their names.

Use spread syntax with restraint. If you’re using it in every other component, something is wrong. Often, it indicates that you should split your components and pass children as JSX. More on that next!

It is common to nest built-in browser tags:

Sometimes you’ll want to nest your own components the same way:

When you nest content inside a JSX tag, the parent component will receive that content in a prop called children. For example, the Card component below will receive a children prop set to <Avatar /> and render it in a wrapper div:

Try replacing the <Avatar> inside <Card> with some text to see how the Card component can wrap any nested content. It doesn’t need to “know” what’s being rendered inside of it. You will see this flexible pattern in many places.

You can think of a component with a children prop as having a “hole” that can be “filled in” by its parent components with arbitrary JSX. You will often use the children prop for visual wrappers: panels, grids, etc.

Illustrated by Rachel Lee Nabors

The Clock component below receives two props from its parent component: color and time. (The parent component’s code is omitted because it uses state, which we won’t dive into just yet.)

Try changing the color in the select box below:

This example illustrates that a component may receive different props over time. Props are not always static! Here, the time prop changes every second, and the color prop changes when you select another color. Props reflect a component’s data at any point in time, rather than only in the beginning.

However, props are immutable—a term from computer science meaning “unchangeable”. When a component needs to change its props (for example, in response to a user interaction or new data), it will have to “ask” its parent component to pass it different props—a new object! Its old props will then be cast aside, and eventually the JavaScript engine will reclaim the memory taken by them.

Don’t try to “change props”. When you need to respond to the user input (like changing the selected color), you will need to “set state”, which you can learn about in State: A Component’s Memory.

This Gallery component contains some very similar markup for two profiles. Extract a Profile component out of it to reduce the duplication. You’ll need to choose what props to pass to it.

**Examples:**

Example 1 (jsx):
```jsx
export default function Profile() {  return (    <Avatar />  );}
```

Example 2 (javascript):
```javascript
export default function Profile() {  return (    <Avatar      person={{ name: 'Lin Lanying', imageId: '1bX5QH6' }}      size={100}    />  );}
```

Example 3 (javascript):
```javascript
function Avatar({ person, size }) {  // person and size are available here}
```

Example 4 (javascript):
```javascript
function Avatar(props) {  let person = props.person;  let size = props.size;  // ...}
```

---

## Sharing State Between Components

**URL:** https://react.dev/learn/sharing-state-between-components

**Contents:**
- Sharing State Between Components
  - You will learn
- Lifting state up by example
  - Step 1: Remove state from the child components
  - Step 2: Pass hardcoded data from the common parent
  - Step 3: Add state to the common parent
      - Deep Dive
    - Controlled and uncontrolled components
- A single source of truth for each state
- Recap

Sometimes, you want the state of two components to always change together. To do it, remove state from both of them, move it to their closest common parent, and then pass it down to them via props. This is known as lifting state up, and it’s one of the most common things you will do writing React code.

In this example, a parent Accordion component renders two separate Panels:

Each Panel component has a boolean isActive state that determines whether its content is visible.

Press the Show button for both panels:

Notice how pressing one panel’s button does not affect the other panel—they are independent.

Initially, each Panel’s isActive state is false, so they both appear collapsed

Clicking either Panel’s button will only update that Panel’s isActive state alone

But now let’s say you want to change it so that only one panel is expanded at any given time. With that design, expanding the second panel should collapse the first one. How would you do that?

To coordinate these two panels, you need to “lift their state up” to a parent component in three steps:

This will allow the Accordion component to coordinate both Panels and only expand one at a time.

You will give control of the Panel’s isActive to its parent component. This means that the parent component will pass isActive to Panel as a prop instead. Start by removing this line from the Panel component:

And instead, add isActive to the Panel’s list of props:

Now the Panel’s parent component can control isActive by passing it down as a prop. Conversely, the Panel component now has no control over the value of isActive—it’s now up to the parent component!

To lift state up, you must locate the closest common parent component of both of the child components that you want to coordinate:

In this example, it’s the Accordion component. Since it’s above both panels and can control their props, it will become the “source of truth” for which panel is currently active. Make the Accordion component pass a hardcoded value of isActive (for example, true) to both panels:

Try editing the hardcoded isActive values in the Accordion component and see the result on the screen.

Lifting state up often changes the nature of what you’re storing as state.

In this case, only one panel should be active at a time. This means that the Accordion common parent component needs to keep track of which panel is the active one. Instead of a boolean value, it could use a number as the index of the active Panel for the state variable:

When the activeIndex is 0, the first panel is active, and when it’s 1, it’s the second one.

Clicking the “Show” button in either Panel needs to change the active index in Accordion. A Panel can’t set the activeIndex state directly because it’s defined inside the Accordion. The Accordion component needs to explicitly allow the Panel component to change its state by passing an event handler down as a prop:

The <button> inside the Panel will now use the onShow prop as its click event handler:

This completes lifting state up! Moving state into the common parent component allowed you to coordinate the two panels. Using the active index instead of two “is shown” flags ensured that only one panel is active at a given time. And passing down the event handler to the child allowed the child to change the parent’s state.

Initially, Accordion’s activeIndex is 0, so the first Panel receives isActive = true

When Accordion’s activeIndex state changes to 1, the second Panel receives isActive = true instead

It is common to call a component with some local state “uncontrolled”. For example, the original Panel component with an isActive state variable is uncontrolled because its parent cannot influence whether the panel is active or not.

In contrast, you might say a component is “controlled” when the important information in it is driven by props rather than its own local state. This lets the parent component fully specify its behavior. The final Panel component with the isActive prop is controlled by the Accordion component.

Uncontrolled components are easier to use within their parents because they require less configuration. But they’re less flexible when you want to coordinate them together. Controlled components are maximally flexible, but they require the parent components to fully configure them with props.

In practice, “controlled” and “uncontrolled” aren’t strict technical terms—each component usually has some mix of both local state and props. However, this is a useful way to talk about how components are designed and what capabilities they offer.

When writing a component, consider which information in it should be controlled (via props), and which information should be uncontrolled (via state). But you can always change your mind and refactor later.

In a React application, many components will have their own state. Some state may “live” close to the leaf components (components at the bottom of the tree) like inputs. Other state may “live” closer to the top of the app. For example, even client-side routing libraries are usually implemented by storing the current route in the React state, and passing it down by props!

For each unique piece of state, you will choose the component that “owns” it. This principle is also known as having a “single source of truth”. It doesn’t mean that all state lives in one place—but that for each piece of state, there is a specific component that holds that piece of information. Instead of duplicating shared state between components, lift it up to their common shared parent, and pass it down to the children that need it.

Your app will change as you work on it. It is common that you will move state down or back up while you’re still figuring out where each piece of the state “lives”. This is all part of the process!

To see what this feels like in practice with a few more components, read Thinking in React.

These two inputs are independent. Make them stay in sync: editing one input should update the other input with the same text, and vice versa.

**Examples:**

Example 1 (jsx):
```jsx
const [isActive, setIsActive] = useState(false);
```

Example 2 (javascript):
```javascript
function Panel({ title, children, isActive }) {
```

Example 3 (jsx):
```jsx
const [activeIndex, setActiveIndex] = useState(0);
```

Example 4 (jsx):
```jsx
<>  <Panel    isActive={activeIndex === 0}    onShow={() => setActiveIndex(0)}  >    ...  </Panel>  <Panel    isActive={activeIndex === 1}    onShow={() => setActiveIndex(1)}  >    ...  </Panel></>
```

---

## React Developer Tools

**URL:** https://react.dev/learn/react-developer-tools

**Contents:**
- React Developer Tools
  - You will learn
- Browser extension
  - Safari and other browsers
- Mobile (React Native)

Use React Developer Tools to inspect React components, edit props and state, and identify performance problems.

The easiest way to debug websites built with React is to install the React Developer Tools browser extension. It is available for several popular browsers:

Now, if you visit a website built with React, you will see the Components and Profiler panels.

For other browsers (for example, Safari), install the react-devtools npm package:

Next open the developer tools from the terminal:

Then connect your website by adding the following <script> tag to the beginning of your website’s <head>:

Reload your website in the browser now to view it in developer tools.

To inspect apps built with React Native, you can use React Native DevTools, the built-in debugger that deeply integrates React Developer Tools. All features work identically to the browser extension, including native element highlighting and selection.

Learn more about debugging in React Native.

For versions of React Native earlier than 0.76, please use the standalone build of React DevTools by following the Safari and other browsers guide above.

**Examples:**

Example 1 (markdown):
```markdown
# Yarnyarn global add react-devtools# Npmnpm install -g react-devtools
```

Example 2 (unknown):
```unknown
react-devtools
```

Example 3 (html):
```html
<html>  <head>    <script src="http://localhost:8097"></script>
```

---

## Passing Data Deeply with Context

**URL:** https://react.dev/learn/passing-data-deeply-with-context

**Contents:**
- Passing Data Deeply with Context
  - You will learn
- The problem with passing props
- Context: an alternative to passing props
  - Step 1: Create the context
  - Step 2: Use the context
  - Step 3: Provide the context
- Using and providing context from the same component
  - Note
- Context passes through intermediate components

Usually, you will pass information from a parent component to a child component via props. But passing props can become verbose and inconvenient if you have to pass them through many components in the middle, or if many components in your app need the same information. Context lets the parent component make some information available to any component in the tree below it—no matter how deep—without passing it explicitly through props.

Passing props is a great way to explicitly pipe data through your UI tree to the components that use it.

But passing props can become verbose and inconvenient when you need to pass some prop deeply through the tree, or if many components need the same prop. The nearest common ancestor could be far removed from the components that need data, and lifting state up that high can lead to a situation called “prop drilling”.

Wouldn’t it be great if there were a way to “teleport” data to the components in the tree that need it without passing props? With React’s context feature, there is!

Context lets a parent component provide data to the entire tree below it. There are many uses for context. Here is one example. Consider this Heading component that accepts a level for its size:

Let’s say you want multiple headings within the same Section to always have the same size:

Currently, you pass the level prop to each <Heading> separately:

It would be nice if you could pass the level prop to the <Section> component instead and remove it from the <Heading>. This way you could enforce that all headings in the same section have the same size:

But how can the <Heading> component know the level of its closest <Section>? That would require some way for a child to “ask” for data from somewhere above in the tree.

You can’t do it with props alone. This is where context comes into play. You will do it in three steps:

Context lets a parent—even a distant one!—provide some data to the entire tree inside of it.

Using context in close children

Using context in distant children

First, you need to create the context. You’ll need to export it from a file so that your components can use it:

The only argument to createContext is the default value. Here, 1 refers to the biggest heading level, but you could pass any kind of value (even an object). You will see the significance of the default value in the next step.

Import the useContext Hook from React and your context:

Currently, the Heading component reads level from props:

Instead, remove the level prop and read the value from the context you just imported, LevelContext:

useContext is a Hook. Just like useState and useReducer, you can only call a Hook immediately inside a React component (not inside loops or conditions). useContext tells React that the Heading component wants to read the LevelContext.

Now that the Heading component doesn’t have a level prop, you don’t need to pass the level prop to Heading in your JSX like this anymore:

Update the JSX so that it’s the Section that receives it instead:

As a reminder, this is the markup that you were trying to get working:

Notice this example doesn’t quite work, yet! All the headings have the same size because even though you’re using the context, you have not provided it yet. React doesn’t know where to get it!

If you don’t provide the context, React will use the default value you’ve specified in the previous step. In this example, you specified 1 as the argument to createContext, so useContext(LevelContext) returns 1, setting all those headings to <h1>. Let’s fix this problem by having each Section provide its own context.

The Section component currently renders its children:

Wrap them with a context provider to provide the LevelContext to them:

This tells React: “if any component inside this <Section> asks for LevelContext, give them this level.” The component will use the value of the nearest <LevelContext> in the UI tree above it.

It’s the same result as the original code, but you did not need to pass the level prop to each Heading component! Instead, it “figures out” its heading level by asking the closest Section above:

Currently, you still have to specify each section’s level manually:

Since context lets you read information from a component above, each Section could read the level from the Section above, and pass level + 1 down automatically. Here is how you could do it:

With this change, you don’t need to pass the level prop either to the <Section> or to the <Heading>:

Now both Heading and Section read the LevelContext to figure out how “deep” they are. And the Section wraps its children into the LevelContext to specify that anything inside of it is at a “deeper” level.

This example uses heading levels because they show visually how nested components can override context. But context is useful for many other use cases too. You can pass down any information needed by the entire subtree: the current color theme, the currently logged in user, and so on.

You can insert as many components as you like between the component that provides context and the one that uses it. This includes both built-in components like <div> and components you might build yourself.

In this example, the same Post component (with a dashed border) is rendered at two different nesting levels. Notice that the <Heading> inside of it gets its level automatically from the closest <Section>:

You didn’t do anything special for this to work. A Section specifies the context for the tree inside it, so you can insert a <Heading> anywhere, and it will have the correct size. Try it in the sandbox above!

Context lets you write components that “adapt to their surroundings” and display themselves differently depending on where (or, in other words, in which context) they are being rendered.

How context works might remind you of CSS property inheritance. In CSS, you can specify color: blue for a <div>, and any DOM node inside of it, no matter how deep, will inherit that color unless some other DOM node in the middle overrides it with color: green. Similarly, in React, the only way to override some context coming from above is to wrap children into a context provider with a different value.

In CSS, different properties like color and background-color don’t override each other. You can set all <div>’s color to red without impacting background-color. Similarly, different React contexts don’t override each other. Each context that you make with createContext() is completely separate from other ones, and ties together components using and providing that particular context. One component may use or provide many different contexts without a problem.

Context is very tempting to use! However, this also means it’s too easy to overuse it. Just because you need to pass some props several levels deep doesn’t mean you should put that information into context.

Here’s a few alternatives you should consider before using context:

If neither of these approaches works well for you, consider context.

Context is not limited to static values. If you pass a different value on the next render, React will update all the components reading it below! This is why context is often used in combination with state.

In general, if some information is needed by distant components in different parts of the tree, it’s a good indication that context will help you.

In this example, toggling the checkbox changes the imageSize prop passed to each <PlaceImage>. The checkbox state is held in the top-level App component, but each <PlaceImage> needs to be aware of it.

Currently, App passes imageSize to List, which passes it to each Place, which passes it to the PlaceImage. Remove the imageSize prop, and instead pass it from the App component directly to PlaceImage.

You can declare context in Context.js.

**Examples:**

Example 1 (jsx):
```jsx
<Section>  <Heading level={3}>About</Heading>  <Heading level={3}>Photos</Heading>  <Heading level={3}>Videos</Heading></Section>
```

Example 2 (jsx):
```jsx
<Section level={3}>  <Heading>About</Heading>  <Heading>Photos</Heading>  <Heading>Videos</Heading></Section>
```

Example 3 (sql):
```sql
import { useContext } from 'react';import { LevelContext } from './LevelContext.js';
```

Example 4 (javascript):
```javascript
export default function Heading({ level, children }) {  // ...}
```

---
