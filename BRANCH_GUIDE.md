# 🌿 Branch Guide

## Available Branches

### 1. `production-ready` (Main Branch)
**Purpose**: Production-ready code with all features

**Contains**:
- ✅ Full application code
- ✅ All features implemented
- ✅ Documentation and guides
- ✅ Clean database
- ✅ Security improvements

**Use When**:
- Deploying to production
- Adding new features
- General development

**Switch To**:
```bash
git checkout production-ready
```

### 2. `security-testing` (Testing Branch)
**Purpose**: Dedicated security testing and validation

**Contains**:
- ✅ Clean codebase (no test utilities)
- ✅ All security tests
- ✅ Testing documentation
- ✅ No pre-configured data
- ✅ Production-ready code

**Use When**:
- Running security tests
- Penetration testing
- Security audits
- Code reviews
- Pre-deployment validation

**Switch To**:
```bash
git checkout security-testing
```

## Quick Commands

### View All Branches
```bash
git branch -a
```

### Create New Branch
```bash
git checkout -b branch-name
```

### Switch Branch
```bash
git checkout branch-name
```

### Compare Branches
```bash
git diff production-ready security-testing
```

### Merge Changes
```bash
# Merge security-testing into production-ready
git checkout production-ready
git merge security-testing
```

## Branch Workflow

### For Security Testing

1. **Switch to security-testing branch**
   ```bash
   git checkout security-testing
   ```

2. **Verify clean state**
   ```bash
   node verify-clean.js
   ```

3. **Run security tests**
   ```bash
   cd backend
   npm test -- --testPathPattern=security
   ```

4. **Document findings**
   - Update test results
   - Note any issues
   - Create fix recommendations

5. **Commit fixes (if any)**
   ```bash
   git add .
   git commit -m "fix: security issue description"
   ```

6. **Merge back to production-ready**
   ```bash
   git checkout production-ready
   git merge security-testing
   ```

### For Feature Development

1. **Switch to production-ready**
   ```bash
   git checkout production-ready
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/feature-name
   ```

3. **Develop feature**
   - Write code
   - Write tests
   - Update documentation

4. **Test feature**
   ```bash
   npm test
   ```

5. **Merge to production-ready**
   ```bash
   git checkout production-ready
   git merge feature/feature-name
   ```

## Branch Differences

| Feature | production-ready | security-testing |
|---------|-----------------|------------------|
| Application Code | ✅ | ✅ |
| Security Tests | ✅ | ✅ |
| Seed Files | ❌ (deleted) | ❌ |
| Test Utilities | ❌ (deleted) | ❌ |
| Documentation | ✅ Full | ✅ Testing-focused |
| Database | Clean | Clean |
| Purpose | Development | Testing |

## Best Practices

### DO:
- ✅ Keep branches in sync
- ✅ Test before merging
- ✅ Document changes
- ✅ Use descriptive commit messages
- ✅ Clean up after testing

### DON'T:
- ❌ Commit sensitive data
- ❌ Commit test utilities
- ❌ Merge without testing
- ❌ Force push to main branches
- ❌ Leave branches stale

## Common Scenarios

### Scenario 1: Found Security Issue
```bash
# On security-testing branch
git checkout security-testing

# Fix the issue
# ... make changes ...

# Commit fix
git add .
git commit -m "fix: security vulnerability in auth"

# Merge to production-ready
git checkout production-ready
git merge security-testing

# Push changes
git push origin production-ready
```

### Scenario 2: Need Fresh Testing Environment
```bash
# Switch to security-testing
git checkout security-testing

# Clean database
node clean-database.js

# Verify clean
node verify-clean.js

# Run tests
cd backend && npm test
```

### Scenario 3: Deploy to Production
```bash
# Ensure on production-ready
git checkout production-ready

# Pull latest changes
git pull origin production-ready

# Run all tests
cd backend && npm test

# If tests pass, deploy
# ... deployment commands ...
```

## Troubleshooting

### Issue: Branch Out of Sync
```bash
# Update from remote
git fetch origin

# Merge changes
git merge origin/production-ready
```

### Issue: Uncommitted Changes
```bash
# Stash changes
git stash

# Switch branch
git checkout other-branch

# Apply stashed changes
git stash pop
```

### Issue: Merge Conflicts
```bash
# View conflicts
git status

# Resolve conflicts in files
# ... edit files ...

# Mark as resolved
git add .

# Complete merge
git commit
```

## Branch Status

### production-ready
- **Status**: ✅ Clean, ready for development
- **Last Update**: 2025-11-20
- **Tests**: 62% auth, 100% authorization
- **Database**: Clean (0 collections)

### security-testing
- **Status**: ✅ Ready for testing
- **Last Update**: 2025-11-20
- **Tests**: Same as production-ready
- **Database**: Clean (0 collections)
- **Purpose**: Security validation

## Quick Reference

```bash
# View current branch
git branch

# Switch to production-ready
git checkout production-ready

# Switch to security-testing
git checkout security-testing

# View branch differences
git diff production-ready security-testing

# Sync branches
git checkout production-ready
git merge security-testing
```

---

**Remember**: Always test before merging to production-ready!
