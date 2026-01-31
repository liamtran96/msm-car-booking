# PostgreSQL - Appendix Color

## N.2. Configuring the Colors #


**URL:** https://www.postgresql.org/docs/18/color-which.html

**Contents:**
- N.2. Configuring the Colors #
  - Tip

The actual colors to be used are configured using the environment variable PG_COLORS (note plural). The value is a colon-separated list of key=value pairs. The keys specify what the color is to be used for. The values are SGR (Select Graphic Rendition) specifications, which are interpreted by the terminal.

The following keys are currently in use:

used to highlight the text “error” in error messages

used to highlight the text “warning” in warning messages

used to highlight the text “detail” and “hint” in such messages

used to highlight location information (e.g., program name and file name) in messages

The default value is error=01;31:warning=01;35:note=01;36:locus=01 (01;31 = bold red, 01;35 = bold magenta, 01;36 = bold cyan, 01 = bold default color).

This color specification format is also used by other software packages such as GCC, GNU coreutils, and GNU grep.

**Examples:**

Example 1 (typescript):
```typescript
error=01;31:warning=01;35:note=01;36:locus=01
```

---


---

## Appendix N. Color Support


**URL:** https://www.postgresql.org/docs/18/color.html

**Contents:**
- Appendix N. Color Support

Most programs in the PostgreSQL package can produce colorized console output. This appendix describes how that is configured.

---


---

## N.1. When Color is Used #


**URL:** https://www.postgresql.org/docs/18/color-when.html

**Contents:**
- N.1. When Color is Used #

To use colorized output, set the environment variable PG_COLOR as follows:

If the value is always, then color is used.

If the value is auto and the standard error stream is associated with a terminal device, then color is used.

Otherwise, color is not used.

---


---

