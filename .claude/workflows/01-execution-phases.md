# Execution Phases

**Unified 4-phase model for all task types.**

---

## Overview

All tasks follow the same structure with task-specific actions:

```
PHASE 1: UNDERSTAND ──► Gate: I understand the problem/task
    │
PHASE 2: PLAN ────────► Gate: Plan with bite-sized tasks (skip if trivial/simple)
    │
PHASE 3: EXECUTE ─────► Gate: Code compiles (if code changed)
    │
PHASE 4: VERIFY ──────► Gate: All checks pass
```

---

## Phase 1: UNDERSTAND

**Objective:** Fully understand what needs to be done before acting.

### Task-Specific Actions

| Task Type | Understand Actions |
|-----------|-------------------|
| **Bugfix** | Reproduce issue → Find root cause → Document expected vs actual |
| **Feature** | Clarify scope → Check existing patterns → Identify affected areas |
| **Refactor** | Identify scope → Run baseline tests → Document current behavior |
| **Investigation** | Define question → Set time-box (see below) → List areas to examine |
| **CI/CD Debug** | Collect logs (`gh run view`) → Identify failing step → Get error message |
| **Review** | Read changes → Understand purpose → Check prerequisites (build, tests) |

### Agent Activation

| Condition | Agent |
|-----------|-------|
| Server/production issue | `debugger` |
| Database-related | `database-admin` |
| Complex trace needed | `debugger` + `root-cause-tracing` skill |
| CI/CD failure | `debugger` |
| Need latest docs | `docs-seeker` skill |

### Time-Box Guidelines (Investigation)

```
Default: 15 minutes for initial investigation

When time-box expires:
1. STOP investigating
2. Summarize what you found
3. Present options to user:
   - "Found partial answer: [summary]. Continue investigating?"
   - "No clear answer yet. Tried [X, Y, Z]. Extend time-box?"
   - "This needs deeper analysis. Delegate to [agent]?"

NEVER:
- Continue indefinitely without check-in
- Silently extend time-box
- Abandon without summary
```

### Quality Gate: Understand

```
[ ] Can explain the task/problem in one sentence
[ ] Know which files/components are affected
[ ] Know what success looks like
```

**STOP if gate fails. Do not proceed without understanding.**

---

## Phase 2: PLAN

**Objective:** Create bite-sized implementation plan before coding.

**Skip this phase for:** Trivial and Simple complexity tasks.

### Plan Creation

For complex tasks, create a plan file in `plans/` with bite-sized steps.

**File naming:** `plans/YYYYMMDD-feature-name.md`

### Plan Structure (Bite-Sized Tasks)

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Domain:** Frontend | Backend | Database | DevOps
**Files to touch:** [List of files]

---

## Task 1: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/exact/path/to/test.ts`

**Step 1: Write the failing test**
```typescript
// Complete test code here
```

**Step 2: Run test to verify it fails**
Run: `pnpm test path/to/test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
```typescript
// Complete implementation code here
```

**Step 4: Run test to verify it passes**
Run: `pnpm test path/to/test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add <files>
git commit -m "feat: add specific feature"
```

---

## Task 2: [Next Component]
...
```

### Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code" - step
- "Run tests to verify pass" - step
- (Wait for user review before commit)

### Agent Activation

| Condition | Agent |
|-----------|-------|
| Complex features | `planner-researcher` |
| Database schema changes | `database-admin` (consultation) |
| UI/UX work | `ui-ux-pro-max` skill |
| Need latest docs | `docs-seeker` skill |

### Quality Gate: Plan Approved

```
[ ] Plan exists in ./plans/ directory
[ ] Tasks are bite-sized (2-5 min each step)
[ ] Exact file paths specified
[ ] Complete code examples in plan
[ ] User approved approach (if significant change)
```

**STOP if gate fails. Do not code without approved plan.**

### Approval Checkpoints (Pause & Wait)

These are HARD STOPS - do not proceed until user responds:

| Checkpoint | When | What to Present |
|------------|------|-----------------|
| **Plan Approval** | After creating plan for complex task | Summary of approach + "Proceed?" |
| **Architecture Decision** | Multiple valid approaches exist | Options with trade-offs + "Which?" |
| **Breaking Change** | Change affects existing behavior | Impact summary + "Confirm?" |
| **Before Commit** | After all tests pass | Summary of changes + "Commit?" |

**How to Ask:**
```
Present concise summary, then:
"Ready to proceed? (yes/no/questions)"

WAIT for response. Do not assume approval.
```

---

## Phase 3: EXECUTE

**Objective:** Implement the solution following the plan.

### Task-Specific Actions

| Task Type | Execute Actions |
|-----------|----------------|
| **Bugfix** | Apply minimal fix → Self-review diff → Check for edge cases |
| **Feature** | Follow plan step by step → TDD approach → Frequent commits |
| **Refactor** | Apply incremental changes → Run tests frequently → Preserve behavior |
| **Investigation** | Gather info → Analyze → Document findings |
| **CI/CD Debug** | Apply fix → Local verification → Commit and push |
| **Review** | Analyze code → Document issues → Categorize by severity |

### Execution Flow (TDD)

```
1. Write failing test
2. Run test → Verify FAIL
3. Write minimal implementation
4. Run test → Verify PASS
5. Repeat for next task
6. Wait for user review before commit
```

### Critical Rules

```
REQUIRED:
- Follow the plan step by step
- Update existing files (never create "v2" or "enhanced" versions)
- Real implementations (no fake data, mocks, or temporary solutions)
- Follow existing code patterns
- Wait for user review before committing
- Run compile check after changes: pnpm lint && pnpm build

FORBIDDEN:
- Creating duplicate files with new/updated/improved suffixes
- Mixing refactor with features
- Changing behavior during refactor
- Over-engineering beyond requirements
- Skipping test steps
- Committing without user approval
```

### Skill Activation

| Context | Skill |
|---------|-------|
| React components | `vercel-react-best-practices` |
| NestJS backend | `nestjs` skill |
| UI components | `shadcn-ui` skill |
| Styling | `tailwindcss` skill |
| File storage | `cloudflare-r2` skill |
| Debugging | `systematic-debugging` skill |

### Quality Gate: Code Compiles

```
[ ] No TypeScript errors
[ ] No lint errors (pnpm lint)
[ ] All imports resolve
[ ] Application builds (pnpm build)
```

---

## Phase 4: VERIFY

**Objective:** Confirm the work is correct and complete.

### Task-Specific Actions

| Task Type | Verify Actions |
|-----------|---------------|
| **Bugfix** | Verify fix works → Run tests → Check for regression |
| **Feature** | Run tests → Code review → Update docs if needed |
| **Refactor** | All tests pass unchanged → No behavior change → Performance OK |
| **Investigation** | Findings documented → Answer clear → Next steps defined |
| **CI/CD Debug** | Pipeline passes (`gh run watch`) → No new warnings |
| **Review** | Feedback delivered → Issues tracked → Resolution status clear |

### Agent Activation

| Condition | Agent |
|-----------|-------|
| Run tests | `tester` |
| Code review | `code-reviewer` |
| Update docs | `docs-manager` |
| Ready to commit | `git-manager` |

### Testing Commands

```bash
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests
pnpm test:cov    # Coverage
pnpm lint        # Linting
pnpm build       # Build check
```

### Quality Gate: All Checks Pass

```
[ ] All tests pass (no skipping, no faking)
[ ] Lint passes
[ ] Build passes
[ ] Code review passed (if medium+ complexity)
[ ] Documentation updated (if user-facing change)
```

**CRITICAL: Never finish with failing tests.**

---

## Post-Verify: Completion

### Cleanup Actions

```
[ ] Delete plan file from plans/ (after implementation complete)
[ ] Update CLAUDE.md if new features/rules added
[ ] Stage relevant files only
[ ] Write clear commit message (conventional format)
[ ] Add changeset if user-facing change
```

### Capture Lessons (Complex Tasks Only)

Before deleting the plan file, check if anything notable happened:

```
Worth capturing? (any of these = yes)
- Unexpected blocker that took time to resolve
- Pattern discovered that could help future tasks
- Tool/approach that worked better than expected
- Gotcha that others might hit

Where to capture:
- New pattern → Update docs-site/docs/ (delegate to docs-manager)
- New rule → Update CLAUDE.md
- New gotcha → Add to relevant section in existing docs

Format:
Brief, actionable. Future-you should understand in 10 seconds.
```

**Skip for:** Routine tasks that went as expected.

### Commit Message Format

```
<type>(<scope>): <description>

- <bullet point>
- <bullet point>
```

Types: `fix`, `feat`, `refactor`, `docs`, `chore`, `test`, `ci`

### Example Commits

```
fix(auth): prevent token expiry race condition

- Root cause: Token refresh overlapped with API call
- Fix: Added mutex lock around token refresh logic
```

```
feat(trips): add detention fee management

- Two-field system for revenue and payout tracking
- Dynamic UI labels based on truck ownership
```

---

## Quick Reference by Task Type

### Bugfix

```
Understand → Reproduce → Root cause
Execute   → Minimal fix → Self-review
Verify    → Tests pass → No regression
```

### Feature (Complex)

```
Understand → Clarify scope → Existing patterns
Plan      → Bite-sized tasks → plans/YYYYMMDD-name.md
Execute   → TDD per task → All tests pass
Verify    → Review → Docs → User approval
Cleanup   → Commit → Delete plan file
```

### Refactor

```
Understand → Scope → Baseline tests
Execute   → Incremental changes → Preserve behavior
Verify    → Tests unchanged → No behavior change
```

### CI/CD Debug

```
Understand → Collect logs → Identify failure
Execute   → Apply fix → Local verify
Verify    → Pipeline passes
```

### Investigation

```
Understand → Define question → Time-box
Execute   → Gather info → Analyze
Verify    → Document findings → Next steps
```

### Review

```
Understand → Read changes → Check prerequisites
Execute   → Analyze → Document issues
Verify    → Feedback delivered → Resolution tracked
```
