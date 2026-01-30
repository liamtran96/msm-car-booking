# Rules

**Quality gates, core principles, and agent quick reference.**

---

## Quality Gates

### Mandatory Gates

Must pass to proceed. No exceptions.

| Gate | When | Fail Action |
|------|------|-------------|
| **G1: Understand** | Before planning/executing | Ask clarifying questions |
| **G2: Plan Approved** | Complex tasks only | Get user approval |
| **G3: Compiles** | After code changes | Fix compilation errors |
| **G4: Tests Pass** | Before commit | Fix failing tests |
| **G5: Lint Pass** | Before commit | Fix lint errors |

### Conditional Gates

Required based on context:

| Gate | When Required |
|------|--------------|
| **G6: Review Passed** | Medium+ complexity features |
| **G7: Docs Updated** | User-facing changes |
| **G8: Pipeline Passes** | CI/CD debug, pre-merge |
| **G9: No Behavior Change** | Refactor only |

### Gate Failure Protocol

```
1. Document what failed and why
2. Fix the root cause (don't workaround)
3. Retry the gate
4. Only proceed when gate passes
```

### Escalation Protocol

When stuck after 3 attempts at the same gate:

```
STEP 1: Document
- What was tried (3 approaches)
- Why each failed
- Current hypothesis

STEP 2: Decide
- Different approach available? → Try it (reset attempt count)
- Need more context? → Ask user for clarification
- Out of ideas? → Ask user for guidance

STEP 3: Ask
Present to user:
"I've tried [X, Y, Z] but [gate] still fails because [reason].
Options:
A) Try [alternative approach]
B) You provide guidance
C) Skip this task for now"

NEVER:
- Continue without passing gate
- Fake success to move forward
- Silently abandon the task
```

---

## Core Principles

### YAGNI - You Aren't Gonna Need It

- Only implement what is explicitly required
- Don't add features "just in case"
- Avoid premature abstraction
- Delete unused code immediately

### KISS - Keep It Simple, Stupid

- Prefer simple solutions over clever ones
- If it's hard to explain, it's probably too complex
- Avoid over-engineering
- One function = one purpose

### DRY - Don't Repeat Yourself

- Extract duplicated code into shared utilities
- Use existing utilities from `src/lib/` and `src/constants/`
- Check if a helper exists before creating inline logic
- BUT: Don't abstract prematurely (3 occurrences rule)

### TDD - Test Driven Development

- Write failing test first
- Run test to verify it fails
- Write minimal implementation
- Run test to verify it passes
- Wait for user review before commit

---

## Critical Rules

### No Simulation

```
FORBIDDEN:
- Fake data to pass tests
- Mocks that don't reflect real behavior
- Cheats or tricks to pass builds
- Temporary solutions left as permanent
- Simulated implementations

REQUIRED:
- Real implementations always
- Actual database queries
- Real API calls (or proper test doubles)
- Complete error handling
```

### No Duplicate Files

```
FORBIDDEN:
- Creating `component-v2.tsx` alongside `component.tsx`
- Adding `service-enhanced.ts` instead of updating `service.ts`
- Duplicating files with "new", "updated", "improved" suffixes

REQUIRED:
- Update existing files directly
- Refactor in place
- Delete old code, don't keep "backup" versions
```

### Testing Integrity

```
NEVER finish a session with failing tests.

If tests fail:
1. Analyze the failure
2. Fix the root cause
3. Run tests again
4. Repeat until ALL tests pass

FORBIDDEN:
- Skipping tests to pass CI
- Disabling tests temporarily
- Using --no-verify to bypass hooks
- Mocking to hide real failures
- Reducing test coverage to pass
```

### Verify Before Claiming

```
Before saying "done":
1. Run pnpm lint
2. Run pnpm build
3. Run pnpm test
4. All must pass

Evidence before assertions, always.
```

---

## File Standards

### Naming

- Use **kebab-case** for all file names
- Names should be descriptive and meaningful
- Long names are acceptable if they describe purpose clearly

```
GOOD:
- user-authentication-service.ts
- trip-cost-calculation-utils.ts
- driver-salary-management-page.tsx

BAD:
- utils.ts (too vague)
- helpers.ts (too vague)
- service2.ts (meaningless)
```

### Size

- Keep files **under 200 lines** for optimal context
- Split large files into smaller, focused modules
- Extract utility functions into separate modules

---

## Skills vs Agents

**Simple Rule:**
```
SKILLS = Knowledge (patterns, best practices, how-to)
AGENTS = Workers (run commands, analyze output, produce reports)
```

| Use | When |
|-----|------|
| **Skill** | Need domain expertise while YOU do the work |
| **Agent** | Need to delegate work that produces a report/result |

**Examples:**
```
"How should I structure this NestJS module?" → nestjs skill
"Run tests and tell me what failed" → tester agent

"What's the best practice for forms?" → shadcn-ui skill
"Review my code for issues" → code-reviewer agent

"Find latest React docs" → docs-seeker skill
"Investigate why server is slow" → debugger agent
```

---

## Agent Quick Reference

### When to Use Each Agent

| Need | Agent |
|------|-------|
| Research, planning, design | `planner-researcher` |
| Running tests, coverage analysis | `tester` |
| Issue investigation, log analysis | `debugger` |
| Schema, queries, optimization | `database-admin` |
| Code quality assessment | `code-reviewer` |
| Documentation updates | `docs-manager` |
| Commits, branches, PRs | `git-manager` |

### Agent Activation by Phase

| Phase | Condition | Agent |
|-------|-----------|-------|
| Understand | Complex debugging | `debugger` |
| Understand | Database issues | `database-admin` |
| Plan | Complex tasks | `planner-researcher` |
| Execute | After implementation | `code-reviewer` |
| Verify | Run tests | `tester` |
| Verify | Update docs | `docs-manager` |
| Post-verify | Ready to commit | `git-manager` |

### Quick Patterns

```
Simple bug → Direct fix → tester
Complex bug → debugger → fix → tester → code-reviewer

Simple feature → implement → tester
Complex feature → planner-researcher → implement → tester → code-reviewer → docs-manager

CI/CD issue → debugger → fix → verify pipeline

Quick research → docs-seeker skill
Deep research → planner-researcher agent
```

---

## Skill Quick Reference

### Backend (NestJS)

| Task | Skill |
|------|-------|
| New endpoint | `nestjs` |
| Authentication | `nestjs` |
| File upload | `cloudflare-r2` |
| Database ops | `supabase` |

### Frontend (React)

| Task | Skill |
|------|-------|
| New component | `vercel-react-best-practices`, `shadcn-ui` |
| Styling | `tailwindcss` |
| UI design | `ui-ux-pro-max` |
| Forms | `shadcn-ui` |

### Debugging

| Issue | Skill |
|-------|-------|
| Complex bug | `systematic-debugging` |
| Deep trace | `root-cause-tracing` |
| Flaky test | `condition-based-waiting` |

### Planning

| Need | Skill |
|------|-------|
| Create implementation plan | `writing-plans` |
| Latest docs | `docs-seeker` |
| Design thinking | `brainstorming` |
| Final checks | `verification-before-completion` |

---

## Project Structure

### Where Things Live

| Location | Purpose |
|----------|---------|
| `plans/` | Implementation plans (bite-sized tasks) |
| `docs-site/docs/` | Reference documentation |
| `.claude/workflows/` | This workflow system |
| `.claude/agents/` | Agent definitions |
| `.claude/skills/` | Skill definitions |

### Plan Lifecycle

```
1. Create plan in plans/YYYYMMDD-feature-name.md
2. Execute plan step by step (TDD)
3. Commit frequently after each task
4. Delete plan file after implementation complete
```

### After Implementation

```
[ ] Delete plan file from plans/
[ ] Update CLAUDE.md if new features/rules added
[ ] Update docs-site/docs/ if patterns changed
```

---

## Commands Reference

### Development

```bash
pnpm start:dev      # Start in watch mode
pnpm build          # Build for production
pnpm lint           # Run ESLint
pnpm format         # Run Prettier
```

### Testing

```bash
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm test:cov       # Coverage
```

### Database

```bash
pnpm typeorm migration:generate src/database/migrations/Name
pnpm typeorm migration:run
pnpm typeorm migration:revert
pnpm seed:run
pnpm db:reset
```

### CI/CD

```bash
gh run list --limit 5
gh run view <run-id>
gh run view <run-id> --log-failed
gh run watch
```

---

## Checklist

### Before Starting

- [ ] Understand task fully
- [ ] Check existing code patterns
- [ ] Identify files to modify

### During Implementation (TDD)

- [ ] Write failing test first
- [ ] Run test to verify it fails
- [ ] Write minimal implementation
- [ ] Run test to verify it passes
- [ ] Follow YAGNI/KISS/DRY
- [ ] Keep files under 200 lines
- [ ] Use kebab-case naming
- [ ] Wait for user review before commit

### Before Completing

- [ ] All tests pass (mandatory)
- [ ] No linting errors
- [ ] Documentation updated if needed
- [ ] No debug code left
- [ ] Code reviewed (for complex tasks)
- [ ] Plan file deleted from plans/
