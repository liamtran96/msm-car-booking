---
description: Run test flows and fix issues
---

**Workflow:** `.claude/workflows/` (Task Type: Bugfix)

## Reported Issues
<issue>
 $ARGUMENTS
</issue>

First use the `debugger` subagent and `tester` subagent to find the root cause of the issues, then analyze the reports and implement the fix. Repeat this process until all issues are addressed.

After finish, delegate to `code-reviewer` agent to review code.