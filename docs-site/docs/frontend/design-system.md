---
id: design-system
title: Design System
sidebar_position: 3
---

# Glassmorphism Design System Documentation

This project uses a centralized glassmorphism design system defined in `src/index.css`. This setup allows for global aesthetic modifications by changing a few variables.

## Global Style Control

To change the "look and feel" of the entire application, modify the variables in the `@theme` block of `src/index.css`:

```css
@theme inline {
  /* ... */

  /* Glassmorphism System Variables - CHANGE THESE */
  --glass-opacity: 0.7;       /* Control overall transparency (0.0 - 1.0) */
  --glass-blur: 12px;         /* Control background blur intensity */
  --glass-border-opacity: 0.3; /* Control border subtle-ness */
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08); /* Control elevation */
}
```

## Utility Classes

Use these semantic classes instead of hardcoding transparency and blur in your components:

| Utility Class | Description |
| :--- | :--- |
| `.glass` | Base glass effect (used for headers/banners). |
| `.glass-card` | Standard card styling with hover effects. |
| `.glass-card-info` | Blue-tinted card for informational data. |
| `.glass-card-success` | Green-tinted card for success states. |
| `.glass-card-warning` | Amber-tinted card for highlights/warnings. |
| `.glass-card-danger` | Red-tinted card for destructive actions. |
| `.glass-card-purple` | Purple-tinted card for specific logistics data. |

## Why this approach?

1.  **Consistency**: Ensures all glass elements across the app use the same blur and opacity.
2.  **Maintainability**: If you decide the blur is too strong, you change it in **one place** (`index.css`) and it updates everywhere.
3.  **Tailwind Integration**: All these classes are registered as Tailwind utilities (via `@utility`), meaning you can use them as standard classes (e.g., `<div className="glass-card p-4">`).
