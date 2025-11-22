# Git Workflow for StockMaster

This document describes the Git workflow and branching strategy for the StockMaster project.

## Branching Strategy

### Main Branches

- **main**: Production-ready code. Every commit on main should be deployable.
- **dev**: Integration branch for features. All feature branches merge here first.

### Supporting Branches

- **feature/***: For new features or enhancements
- **bugfix/***: For bug fixes
- **hotfix/***: For urgent production fixes

## Branch Naming Convention

- Features: `feature/receipt-creation`, `feature/dashboard-kpis`
- Bug fixes: `bugfix/login-validation`, `bugfix/websocket-reconnect`
- Hotfixes: `hotfix/security-patch`, `hotfix/critical-bug`

## Workflow Steps

### 1. Starting a New Feature

```bash
# Make sure you're on dev and it's up to date
git checkout dev
git pull origin dev

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add receipt creation form with validation"
```

### 3. Keeping Feature Branch Updated

```bash
# Regularly sync with dev to avoid conflicts
git checkout dev
git pull origin dev
git checkout feature/your-feature-name
git merge dev
```

### 4. Completing a Feature

```bash
# Push your feature branch
git push origin feature/your-feature-name

# Create a Pull Request (PR) to dev branch
# Review your own code before requesting review
```

### 5. After PR Approval

```bash
# Squash and merge into dev
# Delete the feature branch

# For local cleanup:
git checkout dev
git pull origin dev
git branch -d feature/your-feature-name
```

### 6. Releasing to Production

```bash
# When dev is stable and ready
git checkout main
git pull origin main
git merge dev
git push origin main

# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(auth): add password reset flow with OTP

- Implement request OTP endpoint
- Add reset password form with validation
- Add email verification

Closes #123
```

```bash
fix(websocket): handle reconnection with exponential backoff

Previously, reconnection attempts were too aggressive.
Now using exponential backoff with max 30s delay.

Fixes #456
```

```bash
refactor(operations): extract status logic into service

Move status calculation logic from component to service
for better testability and reusability.
```

## Pull Request Guidelines

### Before Creating a PR

1. **Self-review**: Review your own code first
2. **Test**: Ensure all functionality works
3. **Format**: Run linter and formatter
4. **Conflicts**: Resolve any merge conflicts with dev
5. **Documentation**: Update relevant documentation

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How have you tested this?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tested offline/online transitions (if applicable)
```

### PR Review Process

1. **Code Review**: At least one approval required (for team)
2. **Testing**: Reviewer should test functionality
3. **Merge**: Squash and merge into dev
4. **Cleanup**: Delete feature branch after merge

## Hotfix Workflow

For urgent production fixes:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-issue

# Make the fix
# ... edit files ...
git commit -m "hotfix: fix critical security vulnerability"

# Merge to main
git checkout main
git merge hotfix/critical-issue
git push origin main

# Also merge to dev
git checkout dev
git merge hotfix/critical-issue
git push origin dev

# Tag the hotfix
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin v1.0.1

# Delete hotfix branch
git branch -d hotfix/critical-issue
```

## Solo Development Notes

Even when working solo:

1. **Use feature branches**: Helps organize work and rollback if needed
2. **Write meaningful commits**: Your future self will thank you
3. **Review before merging**: Take a break, then review your own PR
4. **Keep dev stable**: Don't merge broken code to dev
5. **Tag releases**: Makes it easy to rollback to specific versions

## Best Practices

### DO:
- Commit frequently with clear messages
- Keep commits focused on single changes
- Write descriptive PR descriptions
- Test before pushing
- Keep branches short-lived (merge within a week)
- Delete merged branches

### DON'T:
- Commit directly to main
- Push broken code to dev
- Create massive commits with unrelated changes
- Leave branches unmerged for weeks
- Commit sensitive data (API keys, passwords)
- Force push to shared branches

## Handling Conflicts

```bash
# When conflicts occur during merge
git status  # See conflicted files

# Edit conflicted files
# Look for <<<<<<< HEAD markers
# Choose the correct version or combine changes

# After resolving
git add .
git commit -m "resolve merge conflicts"
```

## Emergency Rollback

If something breaks in production:

```bash
# Find the last good commit
git log --oneline

# Create a new branch from that commit
git checkout -b rollback/emergency <good-commit-hash>

# Push to main
git checkout main
git reset --hard <good-commit-hash>
git push -f origin main  # Use force push carefully!

# Or revert the bad commit
git revert <bad-commit-hash>
git push origin main
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
