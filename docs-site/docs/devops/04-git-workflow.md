---
id: 04-git-workflow
title: Git Workflow
sidebar_position: 5
---

# Git Workflow - Version Control

**Difficulty:** Beginner
**Time to Learn:** 1-2 hours
**Prerequisites:** Basic command line knowledge

---

## What is Git?

Git is a **distributed version control system** that tracks changes to files over time. It allows multiple developers to work on the same codebase without conflicts.

### Why Use Git?

| Problem | Git Solution |
|---------|--------------|
| "I broke something, how do I undo?" | Revert to any previous version |
| "Who changed this and why?" | See full history with blame |
| "Two people edited the same file" | Merge changes intelligently |
| "I need to work on two features" | Branching for isolation |
| "My laptop died" | Code backed up on remote |

---

## Key Concepts

### The Three Areas

```
┌─────────────────────────────────────────────────────────────┐
│                    Working Directory                         │
│                    (Your actual files)                       │
│                                                              │
│    Edit files here                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ git add
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Staging Area (Index)                      │
│                    (Files ready to commit)                   │
│                                                              │
│    Preview what will be committed                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ git commit
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository (.git)                         │
│                    (Commit history)                          │
│                                                              │
│    Permanent record of all changes                           │
└─────────────────────────────────────────────────────────────┘
```

### Branches

Branches let you work on features without affecting the main code:

```
main        ●───●───●───●───●───●───●
                    │       ▲
                    │       │ merge
                    ▼       │
feature/auth        ●───●───●
```

---

## Installing Git

### macOS
```bash
# Usually pre-installed, or:
brew install git
```

### Ubuntu/Debian
```bash
sudo apt install git
```

### Windows
Download from https://git-scm.com/download/win

### Verify Installation
```bash
git --version
# git version 2.43.0
```

---

## Initial Setup

```bash
# Set your identity (used in commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Set default editor
git config --global core.editor "code --wait"  # VS Code

# View all settings
git config --list
```

---

## Basic Git Commands

### Starting a Repository

```bash
# Create new repository
git init

# Clone existing repository
git clone https://github.com/user/repo.git

# Clone to specific folder
git clone https://github.com/user/repo.git my-folder
```

### Daily Workflow

```bash
# Check status (do this often!)
git status

# See what changed
git diff                  # Unstaged changes
git diff --staged         # Staged changes

# Stage files for commit
git add file.txt          # Single file
git add src/              # Directory
git add .                 # All changes
git add -p                # Interactive (review each change)

# Commit staged changes
git commit -m "Add user authentication"

# Push to remote
git push

# Pull latest changes
git pull
```

### Viewing History

```bash
# View commit history
git log

# Compact log
git log --oneline

# Graph view
git log --oneline --graph --all

# Show specific commit
git show abc1234

# Who changed each line
git blame file.txt
```

---

## Branching

### Branch Commands

```bash
# List branches
git branch              # Local branches
git branch -r           # Remote branches
git branch -a           # All branches

# Create branch
git branch feature/new-feature

# Switch branch
git checkout feature/new-feature
# Or (newer syntax)
git switch feature/new-feature

# Create and switch
git checkout -b feature/new-feature
# Or
git switch -c feature/new-feature

# Delete branch
git branch -d feature/new-feature    # Safe delete
git branch -D feature/new-feature    # Force delete

# Rename current branch
git branch -m new-name
```

### Merging

```bash
# Merge branch into current branch
git checkout main
git merge feature/new-feature

# Merge with no fast-forward (keeps branch history)
git merge --no-ff feature/new-feature
```

### Merge Conflicts

When Git can't automatically merge:

```
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> feature/new-feature
```

To resolve:
1. Edit the file to keep what you want
2. Remove the conflict markers
3. Stage and commit

```bash
# After resolving conflicts
git add resolved-file.txt
git commit -m "Resolve merge conflict"
```

---

## Our Branch Strategy

We use a simplified Git Flow:

```
main ─────●───────────●───────────●───────────●─── (production)
          │           ▲           ▲
          │           │           │
develop ──●───●───●───●───●───●───●───●───●────── (staging)
              │       ▲       │       ▲
              │       │       │       │
feature/auth ─●───●───●       │       │
                              │       │
feature/trips ────────────────●───●───●
```

### Branch Types

| Branch | Purpose | Created From | Merges To |
|--------|---------|--------------|-----------|
| `main` | Production code | - | - |
| `develop` | Integration branch | `main` | `main` |
| `feature/*` | New features | `develop` | `develop` |
| `bugfix/*` | Bug fixes | `develop` | `develop` |
| `hotfix/*` | Urgent production fixes | `main` | `main` & `develop` |

### Workflow Example

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/user-profile

# 2. Work on feature
# ... make changes ...
git add .
git commit -m "feat: add user profile page"

# 3. Keep up with develop
git checkout develop
git pull origin develop
git checkout feature/user-profile
git merge develop

# 4. Push and create PR
git push -u origin feature/user-profile
# Create Pull Request on GitHub/GitLab

# 5. After PR is approved and merged
git checkout develop
git pull origin develop
git branch -d feature/user-profile
```

---

## Commit Messages

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add login page` |
| `fix` | Bug fix | `fix: resolve login error` |
| `docs` | Documentation | `docs: update API guide` |
| `style` | Formatting | `style: fix indentation` |
| `refactor` | Code restructure | `refactor: extract auth logic` |
| `test` | Add/update tests | `test: add login tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Performance | `perf: optimize queries` |
| `ci` | CI/CD changes | `ci: add GitHub Actions` |

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token support"

# Bug fix
git commit -m "fix(trips): resolve overlapping assignment bug"

# With body
git commit -m "fix(api): handle null user gracefully

The API was crashing when user object was null.
Added null check before accessing user properties.

Fixes #123"
```

### Writing Good Commit Messages

**Do:**
- Use imperative mood ("Add feature" not "Added feature")
- Keep subject line under 50 characters
- Explain WHY, not just WHAT
- Reference issues when applicable

**Don't:**
- "Fixed stuff"
- "WIP"
- "asdfasdf"
- Commit messages longer than the code changed

---

## Remote Repositories

### Working with Remotes

```bash
# List remotes
git remote -v

# Add remote
git remote add origin https://github.com/user/repo.git

# Change remote URL
git remote set-url origin https://github.com/user/new-repo.git

# Remove remote
git remote remove origin
```

### Push and Pull

```bash
# Push to remote
git push origin main

# Push and set upstream (first time)
git push -u origin feature/new-feature

# Pull from remote
git pull origin main

# Fetch without merging
git fetch origin
```

### Pull Request Workflow

```bash
# 1. Create feature branch
git checkout -b feature/awesome

# 2. Make commits
git commit -m "feat: add awesome feature"

# 3. Push to remote
git push -u origin feature/awesome

# 4. Create PR on GitHub/GitLab (web interface)

# 5. After PR is merged, clean up
git checkout main
git pull origin main
git branch -d feature/awesome
git push origin --delete feature/awesome  # Delete remote branch
```

---

## Undoing Changes

### Undo Working Directory Changes

```bash
# Discard changes in file (⚠️ cannot undo!)
git checkout -- file.txt
# Or (newer)
git restore file.txt

# Discard all changes
git checkout -- .
git restore .
```

### Undo Staged Changes

```bash
# Unstage file
git reset HEAD file.txt
# Or (newer)
git restore --staged file.txt

# Unstage all
git reset HEAD
```

### Undo Commits

```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1
# Or
git reset --mixed HEAD~1

# Undo last commit completely (⚠️ loses changes!)
git reset --hard HEAD~1

# Undo specific commit (creates new commit)
git revert abc1234
```

### Amend Last Commit

```bash
# Fix commit message
git commit --amend -m "New message"

# Add forgotten file to last commit
git add forgotten-file.txt
git commit --amend --no-edit
```

⚠️ **Never amend commits that have been pushed!**

---

## Stashing

Save work temporarily without committing:

```bash
# Stash current changes
git stash

# Stash with message
git stash push -m "Work in progress on feature X"

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{2}

# Drop stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

### Use Case

```bash
# You're working on feature, but need to fix a bug
git stash
git checkout main
git checkout -b hotfix/critical-bug
# ... fix bug ...
git commit -m "fix: critical bug"
git checkout feature/my-feature
git stash pop
# Continue working
```

---

## .gitignore

Tell Git which files to ignore:

```bash
# .gitignore

# Dependencies
node_modules/
vendor/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE files
.idea/
.vscode/
*.swp

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Secrets
*.pem
*.key
credentials.json
```

### Patterns

| Pattern | Matches |
|---------|---------|
| `*.log` | All .log files |
| `logs/` | Directory named logs |
| `/logs` | logs in root only |
| `**/temp` | temp in any directory |
| `!important.log` | Don't ignore this file |

---

## Useful Git Commands

### Find Bugs with Bisect

```bash
# Find which commit introduced a bug
git bisect start
git bisect bad                    # Current commit is bad
git bisect good abc1234           # This commit was good
# Git checks out middle commit, you test
git bisect good                   # Or: git bisect bad
# Repeat until bug found
git bisect reset
```

### View File at Specific Commit

```bash
git show abc1234:path/to/file.txt
```

### Search in History

```bash
# Search commit messages
git log --grep="bug fix"

# Search code changes
git log -S "function_name"
```

### Clean Untracked Files

```bash
# Preview what will be deleted
git clean -n

# Delete untracked files
git clean -f

# Delete untracked files and directories
git clean -fd
```

### Cherry Pick

```bash
# Apply specific commit to current branch
git cherry-pick abc1234
```

---

## Git Aliases

Add shortcuts to `~/.gitconfig`:

```ini
[alias]
    s = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --all
    last = log -1 HEAD
    unstage = reset HEAD --
    amend = commit --amend --no-edit
```

Or via command:
```bash
git config --global alias.s status
git config --global alias.co checkout
```

Now you can use:
```bash
git s          # git status
git co main    # git checkout main
git lg         # Pretty log
```

---

## Troubleshooting

### Accidentally Committed to Wrong Branch

```bash
# Move commits to correct branch
git checkout correct-branch
git cherry-pick abc1234
git checkout wrong-branch
git reset --hard HEAD~1
```

### Need to Pull but Have Local Changes

```bash
# Option 1: Stash and pull
git stash
git pull
git stash pop

# Option 2: Commit and pull
git add .
git commit -m "WIP"
git pull
git reset --soft HEAD~1    # Undo WIP commit
```

### Merge Conflict on Pull

```bash
# See conflicts
git status

# Edit conflicted files

# Mark as resolved
git add resolved-file.txt

# Complete merge
git commit
```

### Forgot to Add File to Last Commit

```bash
git add forgotten-file.txt
git commit --amend --no-edit
```

### Undo a Merge

```bash
# If not pushed yet
git reset --hard HEAD~1

# If already pushed
git revert -m 1 HEAD
```

---

## Summary

### Daily Commands

```bash
git status             # Check status
git add .              # Stage changes
git commit -m "msg"    # Commit
git push               # Push to remote
git pull               # Pull from remote
```

### Branch Commands

```bash
git branch             # List branches
git checkout -b name   # Create and switch
git merge branch       # Merge branch
git branch -d name     # Delete branch
```

### Undo Commands

```bash
git restore file       # Discard changes
git restore --staged   # Unstage
git reset --soft HEAD~1  # Undo commit (keep changes)
git revert abc123      # Undo commit (new commit)
```

---

**Next:** Learn [CI/CD with Jenkins](./05-cicd-jenkins.md) to automate your workflow.
