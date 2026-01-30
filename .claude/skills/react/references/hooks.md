# React - Hooks

**Pages:** 4

---

## Manipulating the DOM with Refs

**URL:** https://react.dev/learn/manipulating-the-dom-with-refs

**Contents:**
- Manipulating the DOM with Refs
  - You will learn
- Getting a ref to the node
  - Example: Focusing a text input
  - Example: Scrolling to an element
      - Deep Dive
    - How to manage a list of refs using a ref callback
  - Note
- Accessing another component’s DOM nodes
  - Pitfall

React automatically updates the DOM to match your render output, so your components won’t often need to manipulate it. However, sometimes you might need access to the DOM elements managed by React—for example, to focus a node, scroll to it, or measure its size and position. There is no built-in way to do those things in React, so you will need a ref to the DOM node.

To access a DOM node managed by React, first, import the useRef Hook:

Then, use it to declare a ref inside your component:

Finally, pass your ref as the ref attribute to the JSX tag for which you want to get the DOM node:

The useRef Hook returns an object with a single property called current. Initially, myRef.current will be null. When React creates a DOM node for this <div>, React will put a reference to this node into myRef.current. You can then access this DOM node from your event handlers and use the built-in browser APIs defined on it.

In this example, clicking the button will focus the input:

While DOM manipulation is the most common use case for refs, the useRef Hook can be used for storing other things outside React, like timer IDs. Similarly to state, refs remain between renders. Refs are like state variables that don’t trigger re-renders when you set them. Read about refs in Referencing Values with Refs.

You can have more than a single ref in a component. In this example, there is a carousel of three images. Each button centers an image by calling the browser scrollIntoView() method on the corresponding DOM node:

In the above examples, there is a predefined number of refs. However, sometimes you might need a ref to each item in the list, and you don’t know how many you will have. Something like this wouldn’t work:

This is because Hooks must only be called at the top-level of your component. You can’t call useRef in a loop, in a condition, or inside a map() call.

One possible way around this is to get a single ref to their parent element, and then use DOM manipulation methods like querySelectorAll to “find” the individual child nodes from it. However, this is brittle and can break if your DOM structure changes.

Another solution is to pass a function to the ref attribute. This is called a ref callback. React will call your ref callback with the DOM node when it’s time to set the ref, and call the cleanup function returned from the callback when it’s time to clear it. This lets you maintain your own array or a Map, and access any ref by its index or some kind of ID.

This example shows how you can use this approach to scroll to an arbitrary node in a long list:

In this example, itemsRef doesn’t hold a single DOM node. Instead, it holds a Map from item ID to a DOM node. (Refs can hold any values!) The ref callback on every list item takes care to update the Map:

This lets you read individual DOM nodes from the Map later.

When Strict Mode is enabled, ref callbacks will run twice in development.

Read more about how this helps find bugs in callback refs.

Refs are an escape hatch. Manually manipulating another component’s DOM nodes can make your code fragile.

You can pass refs from parent component to child components just like any other prop.

In the above example, a ref is created in the parent component, MyForm, and is passed to the child component, MyInput. MyInput then passes the ref to <input>. Because <input> is a built-in component React sets the .current property of the ref to the <input> DOM element.

The inputRef created in MyForm now points to the <input> DOM element returned by MyInput. A click handler created in MyForm can access inputRef and call focus() to set the focus on <input>.

In the above example, the ref passed to MyInput is passed on to the original DOM input element. This lets the parent component call focus() on it. However, this also lets the parent component do something else—for example, change its CSS styles. In uncommon cases, you may want to restrict the exposed functionality. You can do that with useImperativeHandle:

Here, realInputRef inside MyInput holds the actual input DOM node. However, useImperativeHandle instructs React to provide your own special object as the value of a ref to the parent component. So inputRef.current inside the Form component will only have the focus method. In this case, the ref “handle” is not the DOM node, but the custom object you create inside useImperativeHandle call.

In React, every update is split in two phases:

In general, you don’t want to access refs during rendering. That goes for refs holding DOM nodes as well. During the first render, the DOM nodes have not yet been created, so ref.current will be null. And during the rendering of updates, the DOM nodes haven’t been updated yet. So it’s too early to read them.

React sets ref.current during the commit. Before updating the DOM, React sets the affected ref.current values to null. After updating the DOM, React immediately sets them to the corresponding DOM nodes.

Usually, you will access refs from event handlers. If you want to do something with a ref, but there is no particular event to do it in, you might need an Effect. We will discuss Effects on the next pages.

Consider code like this, which adds a new todo and scrolls the screen down to the last child of the list. Notice how, for some reason, it always scrolls to the todo that was just before the last added one:

The issue is with these two lines:

In React, state updates are queued. Usually, this is what you want. However, here it causes a problem because setTodos does not immediately update the DOM. So the time you scroll the list to its last element, the todo has not yet been added. This is why scrolling always “lags behind” by one item.

To fix this issue, you can force React to update (“flush”) the DOM synchronously. To do this, import flushSync from react-dom and wrap the state update into a flushSync call:

This will instruct React to update the DOM synchronously right after the code wrapped in flushSync executes. As a result, the last todo will already be in the DOM by the time you try to scroll to it:

Refs are an escape hatch. You should only use them when you have to “step outside React”. Common examples of this include managing focus, scroll position, or calling browser APIs that React does not expose.

If you stick to non-destructive actions like focusing and scrolling, you shouldn’t encounter any problems. However, if you try to modify the DOM manually, you can risk conflicting with the changes React is making.

To illustrate this problem, this example includes a welcome message and two buttons. The first button toggles its presence using conditional rendering and state, as you would usually do in React. The second button uses the remove() DOM API to forcefully remove it from the DOM outside of React’s control.

Try pressing “Toggle with setState” a few times. The message should disappear and appear again. Then press “Remove from the DOM”. This will forcefully remove it. Finally, press “Toggle with setState”:

After you’ve manually removed the DOM element, trying to use setState to show it again will lead to a crash. This is because you’ve changed the DOM, and React doesn’t know how to continue managing it correctly.

Avoid changing DOM nodes managed by React. Modifying, adding children to, or removing children from elements that are managed by React can lead to inconsistent visual results or crashes like above.

However, this doesn’t mean that you can’t do it at all. It requires caution. You can safely modify parts of the DOM that React has no reason to update. For example, if some <div> is always empty in the JSX, React won’t have a reason to touch its children list. Therefore, it is safe to manually add or remove elements there.

In this example, the button toggles a state variable to switch between a playing and a paused state. However, in order to actually play or pause the video, toggling state is not enough. You also need to call play() and pause() on the DOM element for the <video>. Add a ref to it, and make the button work.

For an extra challenge, keep the “Play” button in sync with whether the video is playing even if the user right-clicks the video and plays it using the built-in browser media controls. You might want to listen to onPlay and onPause on the video to do that.

**Examples:**

Example 1 (sql):
```sql
import { useRef } from 'react';
```

Example 2 (jsx):
```jsx
const myRef = useRef(null);
```

Example 3 (jsx):
```jsx
<div ref={myRef}>
```

Example 4 (unknown):
```unknown
// You can use any browser APIs, for example:myRef.current.scrollIntoView();
```

---

## React Compiler

**URL:** https://react.dev/learn/react-compiler

**Contents:**
- React Compiler
- Introduction
- Installation
- Incremental Adoption
- Debugging and Troubleshooting
- Configuration and Reference
- Additional resources

Learn what React Compiler does and how it automatically optimizes your React application by handling memoization for you, eliminating the need for manual useMemo, useCallback, and React.memo.

Get started with installing React Compiler and learn how to configure it with your build tools.

Learn strategies for gradually adopting React Compiler in your existing codebase if you’re not ready to enable it everywhere yet.

When things don’t work as expected, use our debugging guide to understand the difference between compiler errors and runtime issues, identify common breaking patterns, and follow a systematic debugging workflow.

For detailed configuration options and API reference:

In addition to these docs, we recommend checking the React Compiler Working Group for additional information and discussion about the compiler.

---

## Built-in React Hooks

**URL:** https://react.dev/reference/react/hooks

**Contents:**
- Built-in React Hooks
- State Hooks
- Context Hooks
- Ref Hooks
- Effect Hooks
- Performance Hooks
- Other Hooks
- Your own Hooks

Hooks let you use different React features from your components. You can either use the built-in Hooks or combine them to build your own. This page lists all built-in Hooks in React.

State lets a component “remember” information like user input. For example, a form component can use state to store the input value, while an image gallery component can use state to store the selected image index.

To add state to a component, use one of these Hooks:

Context lets a component receive information from distant parents without passing it as props. For example, your app’s top-level component can pass the current UI theme to all components below, no matter how deep.

Refs let a component hold some information that isn’t used for rendering, like a DOM node or a timeout ID. Unlike with state, updating a ref does not re-render your component. Refs are an “escape hatch” from the React paradigm. They are useful when you need to work with non-React systems, such as the built-in browser APIs.

Effects let a component connect to and synchronize with external systems. This includes dealing with network, browser DOM, animations, widgets written using a different UI library, and other non-React code.

Effects are an “escape hatch” from the React paradigm. Don’t use Effects to orchestrate the data flow of your application. If you’re not interacting with an external system, you might not need an Effect.

There are two rarely used variations of useEffect with differences in timing:

A common way to optimize re-rendering performance is to skip unnecessary work. For example, you can tell React to reuse a cached calculation or to skip a re-render if the data has not changed since the previous render.

To skip calculations and unnecessary re-rendering, use one of these Hooks:

Sometimes, you can’t skip re-rendering because the screen actually needs to update. In that case, you can improve performance by separating blocking updates that must be synchronous (like typing into an input) from non-blocking updates which don’t need to block the user interface (like updating a chart).

To prioritize rendering, use one of these Hooks:

These Hooks are mostly useful to library authors and aren’t commonly used in the application code.

You can also define your own custom Hooks as JavaScript functions.

**Examples:**

Example 1 (jsx):
```jsx
function ImageGallery() {  const [index, setIndex] = useState(0);  // ...
```

Example 2 (javascript):
```javascript
function Button() {  const theme = useContext(ThemeContext);  // ...
```

Example 3 (javascript):
```javascript
function Form() {  const inputRef = useRef(null);  // ...
```

Example 4 (javascript):
```javascript
function ChatRoom({ roomId }) {  useEffect(() => {    const connection = createConnection(roomId);    connection.connect();    return () => connection.disconnect();  }, [roomId]);  // ...
```

---

## Referencing Values with Refs

**URL:** https://react.dev/learn/referencing-values-with-refs

**Contents:**
- Referencing Values with Refs
  - You will learn
- Adding a ref to your component
- Example: building a stopwatch
- Differences between refs and state
      - Deep Dive
    - How does useRef work inside?
- When to use refs
- Best practices for refs
- Refs and the DOM

When you want a component to “remember” some information, but you don’t want that information to trigger new renders, you can use a ref.

You can add a ref to your component by importing the useRef Hook from React:

Inside your component, call the useRef Hook and pass the initial value that you want to reference as the only argument. For example, here is a ref to the value 0:

useRef returns an object like this:

Illustrated by Rachel Lee Nabors

You can access the current value of that ref through the ref.current property. This value is intentionally mutable, meaning you can both read and write to it. It’s like a secret pocket of your component that React doesn’t track. (This is what makes it an “escape hatch” from React’s one-way data flow—more on that below!)

Here, a button will increment ref.current on every click:

The ref points to a number, but, like state, you could point to anything: a string, an object, or even a function. Unlike state, ref is a plain JavaScript object with the current property that you can read and modify.

Note that the component doesn’t re-render with every increment. Like state, refs are retained by React between re-renders. However, setting state re-renders a component. Changing a ref does not!

You can combine refs and state in a single component. For example, let’s make a stopwatch that the user can start or stop by pressing a button. In order to display how much time has passed since the user pressed “Start”, you will need to keep track of when the Start button was pressed and what the current time is. This information is used for rendering, so you’ll keep it in state:

When the user presses “Start”, you’ll use setInterval in order to update the time every 10 milliseconds:

When the “Stop” button is pressed, you need to cancel the existing interval so that it stops updating the now state variable. You can do this by calling clearInterval, but you need to give it the interval ID that was previously returned by the setInterval call when the user pressed Start. You need to keep the interval ID somewhere. Since the interval ID is not used for rendering, you can keep it in a ref:

When a piece of information is used for rendering, keep it in state. When a piece of information is only needed by event handlers and changing it doesn’t require a re-render, using a ref may be more efficient.

Perhaps you’re thinking refs seem less “strict” than state—you can mutate them instead of always having to use a state setting function, for instance. But in most cases, you’ll want to use state. Refs are an “escape hatch” you won’t need often. Here’s how state and refs compare:

Here is a counter button that’s implemented with state:

Because the count value is displayed, it makes sense to use a state value for it. When the counter’s value is set with setCount(), React re-renders the component and the screen updates to reflect the new count.

If you tried to implement this with a ref, React would never re-render the component, so you’d never see the count change! See how clicking this button does not update its text:

This is why reading ref.current during render leads to unreliable code. If you need that, use state instead.

Although both useState and useRef are provided by React, in principle useRef could be implemented on top of useState. You can imagine that inside of React, useRef is implemented like this:

During the first render, useRef returns { current: initialValue }. This object is stored by React, so during the next render the same object will be returned. Note how the state setter is unused in this example. It is unnecessary because useRef always needs to return the same object!

React provides a built-in version of useRef because it is common enough in practice. But you can think of it as a regular state variable without a setter. If you’re familiar with object-oriented programming, refs might remind you of instance fields—but instead of this.something you write somethingRef.current.

Typically, you will use a ref when your component needs to “step outside” React and communicate with external APIs—often a browser API that won’t impact the appearance of the component. Here are a few of these rare situations:

If your component needs to store some value, but it doesn’t impact the rendering logic, choose refs.

Following these principles will make your components more predictable:

Limitations of React state don’t apply to refs. For example, state acts like a snapshot for every render and doesn’t update synchronously. But when you mutate the current value of a ref, it changes immediately:

This is because the ref itself is a regular JavaScript object, and so it behaves like one.

You also don’t need to worry about avoiding mutation when you work with a ref. As long as the object you’re mutating isn’t used for rendering, React doesn’t care what you do with the ref or its contents.

You can point a ref to any value. However, the most common use case for a ref is to access a DOM element. For example, this is handy if you want to focus an input programmatically. When you pass a ref to a ref attribute in JSX, like <div ref={myRef}>, React will put the corresponding DOM element into myRef.current. Once the element is removed from the DOM, React will update myRef.current to be null. You can read more about this in Manipulating the DOM with Refs.

Type a message and click “Send”. You will notice there is a three second delay before you see the “Sent!” alert. During this delay, you can see an “Undo” button. Click it. This “Undo” button is supposed to stop the “Sent!” message from appearing. It does this by calling clearTimeout for the timeout ID saved during handleSend. However, even after “Undo” is clicked, the “Sent!” message still appears. Find why it doesn’t work, and fix it.

**Examples:**

Example 1 (sql):
```sql
import { useRef } from 'react';
```

Example 2 (jsx):
```jsx
const ref = useRef(0);
```

Example 3 (json):
```json
{   current: 0 // The value you passed to useRef}
```

Example 4 (jsx):
```jsx
const [startTime, setStartTime] = useState(null);const [now, setNow] = useState(null);
```

---
