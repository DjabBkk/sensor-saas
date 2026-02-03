# Git Workflow Guide

This document outlines the Git workflow for this project. We use a **Git Flow** pattern with two main branches:

- **`main`** - Production/stable branch. Only merge here when code is tested, safe, and ready for production.
- **`develop`** - Development/integration branch. This is where all active development happens.

**Workflow:**
1. **Always work on `develop`** (or feature branches created from `develop`)
2. Create feature branches from `develop` using `feat/` prefix (e.g., `feat/new-login`)
3. Merge feature branches into `develop` via Pull Requests
4. Only merge `develop` → `main` when code is fully tested and safe for production

Feature branches use a `feat/` prefix (e.g., `feat/new-login`).

---

## 🧰 Prerequisites

- Git installed.
- GitHub repo set up.
- You're in your local project folder (e.g., via terminal: `cd /path/to/your/repo`).
- Run commands in your terminal.

---

## 🪄 Step 1: Start from the Right Branch (Usually `develop`)

Ensure you're on develop and up-to-date.

```bash
git checkout develop      # Switches to develop
git pull origin develop   # Pulls latest changes from GitHub
```

Check status:

```bash
git status                # Should be clean; commit/stash if changes exist
```

---

## 🌿 Step 2: Create/Switch to Feature Branch

Create a new feature branch from develop:

```bash
git checkout -b feat/your-feature-name   # e.g., feat/add-profile
```

If the branch already exists:

```bash
git checkout feat/your-feature-name
git pull origin feat/your-feature-name
```

---

## 💻 Step 3: Work and Commit in the Feature Branch

- Edit files in your code editor/IDE.
- Test locally (e.g., run your app).

Stage and commit changes:

```bash
git add .
git commit -m "Descriptive message (e.g., Added profile structure)"
```

Repeat for multiple steps—**commit often!**

Push to GitHub for backup:

```bash
# First time
git push -u origin feat/your-feature-name

# Later pushes
git push
```

---

## 🔀 Step 4: Create Pull Request to Merge into `develop`

Once feature is done and tested, push final changes:

```bash
git push
```

Then on GitHub web:

1. Go to your repo → **Pull requests** → **New pull request**  
2. **Base:** `develop` ← **Always merge features into develop first!**  
3. **Compare:** `feat/your-feature-name`  
4. Add title and description  
5. Create PR

Review/Merge on GitHub:

- Check diffs, comment if needed.  
- Merge (e.g., *squash* for clean history).  
- Delete branch after merge.

**Important:** Features should **always** merge into `develop` first, never directly into `main`.

---

## 🔄 Step 5: Update Local After Merge

```bash
git checkout develop
git pull origin develop
git branch -d feat/your-feature-name
```

---

## 🚀 Step 6: Merging `develop` → `main` (Production Release)

**Only do this when code is fully tested and safe for production!**

1. Ensure `develop` is stable and all tests pass
2. Create a Pull Request on GitHub:
   - **Base:** `main`
   - **Compare:** `develop`
   - Title: "Release: [version/description]"
   - Review all changes carefully
3. Merge the PR (prefer squash merge for clean history)
4. After merge, update your local branches:

```bash
git checkout main
git pull origin main
git checkout develop
git pull origin develop
```

## 💡 Tips

- **Always work on `develop`** - this is your default working branch
- Always pull before working to avoid conflicts  
- Use PRs for reviews, even if solo  
- If conflicts: resolve in files, then commit  
- **Never merge directly to `main`** - always go through `develop` first
- Only merge `develop` → `main` when code is tested and production-ready

## 📋 Quick Reference

```bash
# Daily workflow - start here
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feat/your-feature-name

# Work, commit, push
git add .
git commit -m "Your message"
git push -u origin feat/your-feature-name

# After PR merge, clean up
git checkout develop
git pull origin develop
git branch -d feat/your-feature-name
```

---

_This guide provides a clean, consistent workflow suitable for teams or individual developers._
