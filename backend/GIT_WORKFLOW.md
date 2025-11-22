# Git Workflow for StockMaster Backend

## Solo Development Workflow

This document outlines the Git workflow for solo development on the StockMaster project, following best practices for code organization and change tracking.

## Branch Structure

### Main Branches
- `main`: Production-ready code. Always stable and deployable.
- `develop`: Integration branch for features. Used for staging/testing.

### Feature Branches
- Naming: `feature/<feature-name>`
- Examples:
  - `feature/auth-system`
  - `feature/operations-module`
  - `feature/realtime-updates`

### Bug Fix Branches
- Naming: `fix/<bug-description>`
- Examples:
  - `fix/stock-calculation-bug`
  - `fix/jwt-refresh-issue`

### Hotfix Branches
- Naming: `hotfix/<issue>`
- For urgent production fixes
- Merge directly to `main` and `develop`

## Workflow Steps

### 1. Starting New Work

```bash
# Update your local repository
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/new-feature

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Making Changes

```bash
# Make your changes
# ...

# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add product stock calculation

- Implement stock ledger pattern
- Add caching for performance
- Include tests for edge cases"
```

### 3. Commit Message Convention

Follow the Conventional Commits specification:

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

**Examples**:
```bash
git commit -m "feat(auth): implement JWT refresh token rotation"
git commit -m "fix(operations): correct stock movement calculation"
git commit -m "docs(readme): add API documentation"
git commit -m "test(operations): add integration tests for receipts"
git commit -m "refactor(cache): improve Redis connection handling"
git commit -m "chore(deps): update Fastify to v5.2.0"
```

### 4. Keeping Branch Updated

```bash
# Regularly sync with main
git checkout main
git pull origin main

git checkout feature/your-feature
git merge main

# Or use rebase for cleaner history
git rebase main
```

### 5. Self Pull Request Process

Even as a solo developer, create PRs for code review:

```bash
# Push your branch
git push origin feature/your-feature

# On GitHub/GitLab:
# 1. Create Pull Request from feature/your-feature to main
# 2. Write clear PR description
# 3. Review your own changes
# 4. Run tests: npm test
# 5. Check linting: npm run lint
# 6. Merge PR
```

**PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Refactoring

## Changes Made
- List of specific changes
- ...

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
```

### 6. Merging to Main

```bash
# After PR approval (self-review)
git checkout main
git pull origin main
git merge --no-ff feature/your-feature
git push origin main

# Delete feature branch
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

## Daily Workflow

### Morning
```bash
# Start your day
git checkout main
git pull origin main

# Create/switch to working branch
git checkout -b feature/todays-work
# or
git checkout feature/existing-feature
git merge main  # Sync with latest
```

### During Development
```bash
# Commit frequently (small, logical chunks)
git add src/module/new-file.ts
git commit -m "feat(module): add new functionality"

# Push to remote regularly
git push origin feature/todays-work
```

### End of Day
```bash
# Ensure everything is committed
git status

# Push final changes
git push origin feature/todays-work

# Create PR if feature is complete
```

## Best Practices

### 1. Commit Frequency
- Commit after completing a logical unit of work
- Don't wait until end of day to commit
- Each commit should be self-contained and buildable

### 2. Commit Size
- **Good**: Small, focused commits (50-200 lines)
- **Avoid**: Large commits with unrelated changes

### 3. Branch Lifetime
- Keep feature branches short-lived (1-3 days)
- Merge to main frequently to avoid conflicts
- Delete branches after merging

### 4. Code Review Checklist
Even when reviewing your own code:
- [ ] Does it solve the stated problem?
- [ ] Is the code readable and maintainable?
- [ ] Are there any edge cases not handled?
- [ ] Are there adequate tests?
- [ ] Is the documentation updated?
- [ ] Are there any security concerns?
- [ ] Is error handling appropriate?
- [ ] Are there any performance concerns?

### 5. Testing Before Merge
```bash
# Run full test suite
npm test

# Check linting
npm run lint

# Type check
npm run typecheck

# Build project
npm run build

# Manual testing of affected features
```

### 6. Git Hygiene
```bash
# View commit history
git log --oneline --graph --all

# Amend last commit (if not pushed)
git commit --amend -m "Updated message"

# Interactive rebase for cleaning history
git rebase -i HEAD~3

# Squash multiple commits
git rebase -i main
# Mark commits as 'squash' or 's'

# Check what would be pushed
git diff main..feature/your-feature
```

## Emergency Procedures

### Undo Last Commit (Not Pushed)
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes and commit
git reset --hard HEAD~1
```

### Undo Pushed Commit
```bash
# Create revert commit
git revert <commit-hash>
git push origin main
```

### Recover Deleted Branch
```bash
# Find the commit hash
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

### Resolve Merge Conflicts
```bash
# During merge
git merge feature/branch
# CONFLICT in file.ts

# Edit conflicting files
# Remove conflict markers (<<<<, ====, >>>>)

git add file.ts
git commit -m "merge: resolve conflicts from feature/branch"
```

## Release Process

### Creating a Release
```bash
# Update version in package.json
npm version patch  # or minor, or major

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Push changes
git push origin main
```

### Hotfix Process
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the bug
# ...

# Commit
git commit -m "fix: resolve critical production bug"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-bug
git push origin main

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

## Tools & Automation

### Pre-commit Hooks
Install husky for git hooks:
```bash
npm install -D husky
npx husky init

# Add pre-commit hook
echo "npm run lint && npm run typecheck" > .husky/pre-commit
```

### Useful Git Aliases
Add to `~/.gitconfig`:
```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --oneline --graph --all --decorate
    aliases = config --get-regexp alias
```

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)

## Questions?

Document your own patterns and decisions as you work. Update this guide when you discover better practices.

