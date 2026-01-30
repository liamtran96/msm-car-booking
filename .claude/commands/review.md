---
description: Perform code review on recent changes or specified files
---

Delegate to `code-reviewer` agent to review:
- Recent changes (default): `git diff HEAD~1`
- Specified files: $ARGUMENTS

**Workflow:** `.claude/workflows/` (Task Type: Review)

Provide summary report with:
- Critical/high/medium/low issues
- Positive observations
- Recommendations
