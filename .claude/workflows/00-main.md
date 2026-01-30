# Main Workflow

**Single entry point for all tasks. Simple 3-step decision flow.**

> **Note:** This workflow system focuses on *how* to execute tasks.
> `CLAUDE.md` contains *what* (project context, business rules, tech stack).
> When in doubt: workflow files for process, CLAUDE.md for domain knowledge.

---

## Decision Flow

```
User Prompt
    │
    ▼
┌─────────────────────────────────────┐
│  STEP 1: Detect Task Type           │
│                                     │
│  Slash command? → Use directly      │
│  No command? → Detect from keywords │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  STEP 2: Detect Domain              │
│                                     │
│  Frontend | Backend | Database      │
│  DevOps | Integration               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  STEP 3: Assess Complexity          │
│                                     │
│  Trivial → Just do it               │
│  Simple  → Do + Verify              │
│  Complex → Create plan in plans/    │
└─────────────────────────────────────┘
    │
    ▼
Execute (using 01-execution-phases.md)
```

---

## Step 1: Task Type Detection

### Command Mapping

| Command | Task Type | Default Complexity |
|---------|-----------|-------------------|
| `/fix` | Bugfix | Simple |
| `/cook` | Feature | Complex |
| `/refactor` | Refactor | Simple |
| `/debug` | Investigation | Simple |
| `/fix-ci` | CI/CD Debug | Simple |
| `/review` | Review | Simple |
| `/plan` | Planning | Complex |
| `/verify` | Verification | Trivial |
| `/pr` | Pre-merge | Simple |
| `/docs` | Documentation | Trivial |
| `/db` | Database | Simple |
| `/cmp` | Commit | Trivial |
| `/test` | Testing | Simple |
| `/watzup` | Recent Changes | Simple |
| `/fix-test` | Test Fix | Simple |

### Keyword Detection (Fallback)

| Keywords | Task Type |
|----------|-----------|
| `fix`, `bug`, `broken`, `error`, `crash`, `not working`, `fails` | Bugfix |
| `add`, `create`, `implement`, `build`, `new feature` | Feature |
| `refactor`, `clean`, `optimize`, `reorganize`, `improve code` | Refactor |
| `why`, `how`, `explain`, `investigate`, `understand`, `research` | Investigation |
| `CI`, `pipeline`, `github actions`, `build failed`, `deploy` | CI/CD Debug |
| `review`, `check`, `audit`, `assess` | Review |

---

## Step 2: Domain Detection

| Keywords | Domain |
|----------|--------|
| `react`, `component`, `tailwind`, `ui`, `page`, `form`, `modal`, `shadcn`, `vite`, `zustand`, `query` | Frontend |
| `api`, `service`, `controller`, `module`, `typeorm`, `entity`, `guard`, `dto`, `nestjs`, `endpoint` | Backend |
| `table`, `column`, `migration`, `query`, `index`, `schema`, `postgres`, `redis` | Database |
| `pipeline`, `workflow`, `github actions`, `docker`, `deploy`, `ci`, `cd`, `nginx`, `vps` | DevOps |
| `stripe`, `r2`, `resend`, `email`, `webhook`, `storage`, `cloudflare` | Integration |

### Domain Override

User can explicitly specify domain:
- `/fix frontend: button not clickable`
- `/cook backend: add new endpoint`

### Multi-Domain Tasks

When task spans multiple domains:
1. Identify primary domain (where main logic lives)
2. Note secondary domains for cross-cutting concerns
3. Break into domain-specific subtasks in plan

---

## Step 3: Complexity Assessment

### Trivial
- Single-line changes, typo fixes
- Simple config updates
- Direct answer questions
- **Action:** Handle directly, no workflow phases needed

### Simple
- Single-file or few-file changes
- Clear, well-defined scope
- No architectural decisions
- **Action:** Execute + Verify (skip Plan phase)

### Complex
- Multi-file or multi-domain changes
- Architectural decisions required
- Requires planning phase
- **Action:** Create bite-sized plan in `plans/` folder

### Complexity Signals

| Signal | Suggests |
|--------|----------|
| "Add X to Y" (clear target) | Simple |
| "Implement X system" | Complex |
| Touches 1-2 files | Simple |
| Touches 3+ files | Complex |
| Single domain | Simple |
| Multiple domains | Complex |
| User gave detailed spec | Simple |
| User gave vague request | Complex |

---

## Multi-Task Handling

When request contains multiple tasks:

1. **Separate** - Identify distinct tasks
2. **Classify** - Route each task independently
3. **Prioritize** - Order by dependencies (blockers first)
4. **Execute** - Sequential (dependent) or parallel (independent)

Example:
```
User: "Fix the login bug and add a logout button"
→ Task 1: Bugfix (login) - Simple
→ Task 2: Feature (logout) - Simple
→ Order: Bugfix first, then feature
```

---

## Quick Reference

### Start Here

```
1. What type? (command or keywords)
2. What domain? (frontend/backend/database/devops/integration)
3. How complex? (trivial/simple/complex)
4. Execute phases from 01-execution-phases.md
5. Follow rules from 02-rules.md
```

### Files

| File | Purpose |
|------|---------|
| `00-main.md` | This file - routing and classification |
| `01-execution-phases.md` | Unified execution phases for all task types |
| `02-rules.md` | Quality gates, principles, agent reference |
