---
description: Git branch workflow - create branch, commit, push, merge to master
---

## Push Workflow

### 1. Create a branch for the current work
```bash
git checkout -b <branch-name>
```
Name the branch after what was worked on (e.g. `settings-page`, `community-updates`).

### 2. Stage and commit all changes
```bash
git add .
git commit -m "<descriptive commit message>"
```

### 3. Push the branch to origin
```bash
git push -u origin <branch-name>
```

### 4. Merge into master
```bash
git checkout master
git pull origin master
git merge <branch-name>
git push origin master
```

If there are merge conflicts, resolve them before pushing.

### 5. Clean up (optional)
```bash
git branch -d <branch-name>
```
