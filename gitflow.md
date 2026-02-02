# Git Workflow Guide

This document outlines a simple Git workflow for working on features in isolated branches, committing changes, and merging via Pull Requests (PRs) into `develop` or `main`.  
Assumes you have a repo with `main` (production/stable) and `develop` (integration/testing) branches.  
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

## 🔀 Step 4: Create Pull Request to Merge

Once feature is done and tested, push final changes:

```bash
git push
```

Then on GitHub web:

1. Go to your repo → **Pull requests** → **New pull request**  
2. **Base:** `develop` (or `main` if merging to production)  
3. **Compare:** `feat/your-feature-name`  
4. Add title and description  
5. Create PR

Review/Merge on GitHub:

- Check diffs, comment if needed.  
- Merge (e.g., *squash* for clean history).  
- Delete branch after merge.

---

## 🔄 Step 5: Update Local After Merge

```bash
git checkout develop
git pull origin develop
git branch -d feat/your-feature-name
```

---

## 💡 Tips

- Always pull before working to avoid conflicts.  
- Use PRs for reviews, even if solo.  
- If conflicts: resolve in files, then commit.  
- For `develop` → `main`: same PR process after testing.  

---

_This guide provides a clean, consistent workflow suitable for teams or individual developers._
