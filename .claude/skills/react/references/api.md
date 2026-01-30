# React - Api

**Pages:** 2

---

## React DOM APIs

**URL:** https://react.dev/reference/react-dom

**Contents:**
- React DOM APIs
- APIs
- Resource Preloading APIs
- Entry points
- Removed APIs

The react-dom package contains methods that are only supported for the web applications (which run in the browser DOM environment). They are not supported for React Native.

These APIs can be imported from your components. They are rarely used:

These APIs can be used to make apps faster by pre-loading resources such as scripts, stylesheets, and fonts as soon as you know you need them, for example before navigating to another page where the resources will be used.

React-based frameworks frequently handle resource loading for you, so you might not have to call these APIs yourself. Consult your framework’s documentation for details.

The react-dom package provides two additional entry points:

These APIs were removed in React 19:

---

## React Reference Overview

**URL:** https://react.dev/reference/react

**Contents:**
- React Reference Overview
- React
- React DOM
- React Compiler
- ESLint Plugin React Hooks
- Rules of React
- Legacy APIs

This section provides detailed reference documentation for working with React. For an introduction to React, please visit the Learn section.

The React reference documentation is broken down into functional subsections:

Programmatic React features:

React DOM contains features that are only supported for web applications (which run in the browser DOM environment). This section is broken into the following:

The React Compiler is a build-time optimization tool that automatically memoizes your React components and values:

The ESLint plugin for React Hooks helps enforce the Rules of React:

React has idioms — or rules — for how to express patterns in a way that is easy to understand and yields high-quality applications:

---
