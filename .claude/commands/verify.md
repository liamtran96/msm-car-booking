---
description: Run all quality gates before commit
---

Execute verification sequence:
1. Lint: `pnpm lint`
2. Build: `pnpm build`
3. Tests: `pnpm test` (delegate to `tester`)
4. Review: `code-reviewer` (if $ARGUMENTS includes --with-review)

**Output:**
```
Verification Results:
|-- Lint:   [PASS/FAIL]
|-- Build:  [PASS/FAIL]
|-- Tests:  [PASS/FAIL]
|-- Status: Ready / Needs fixes
```
