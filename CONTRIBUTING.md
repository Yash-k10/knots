# 🚀 KNOTS Project — Team Git Workflow Guide

> This guide is for all 4 team members. Follow it step by step.

---

## 📌 Branch Structure

```
main ──────────────── (stable, production-ready — DON'T touch directly)
  └── develop ─────── (integration branch — all features merge here)
        ├── feature/auth-system       (Yash's feature)
        ├── feature/messaging         (Teammate 2's feature)
        ├── feature/job-portal        (Teammate 3's feature)
        └── feature/event-management  (Teammate 4's feature)
```

> [!CAUTION]
> **NEVER push directly to `main` branch.** Always work on feature branches and merge into `develop`.

---

## 🔧 STEP 1: One-Time Setup (Every Teammate Does This Once)

### 1.1 Clone the Repository
```bash
git clone https://github.com/Yash-k10/knots.git
cd knots
```

### 1.2 Switch to the `develop` Branch
```bash
git checkout develop
```

### 1.3 Set Up the Backend
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows CMD:
venv\Scripts\activate
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 1.4 Set Up the `.env` File
Each teammate must create their own `backend/.env` file (it's gitignored, so it won't be shared):

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/knots_db
SYNC_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/knots_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

> [!IMPORTANT]
> Each teammate must install **PostgreSQL** and **Redis** on their own laptop and create a database called `knots_db`. Replace `YOUR_PASSWORD` with your own PostgreSQL password.

### 1.5 Run Database Migrations
```bash
cd backend
alembic upgrade head
```

### 1.6 Set Up the Frontend
```bash
cd frontend
npm install
```

### 1.7 Verify Everything Works
```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 🌿 STEP 2: Creating a Feature Branch (Before Starting Any New Work)

> [!IMPORTANT]
> **Every new feature/task must be done on a separate branch.** Never code directly on `develop`.

### 2.1 Make Sure You're on `develop` and It's Up-to-Date
```bash
git checkout develop
git pull origin develop
```

### 2.2 Create Your Feature Branch
```bash
git checkout -b feature/your-feature-name
```

**Naming examples:**
| Feature | Branch Name |
|---|---|
| Login/Signup system | `feature/auth-system` |
| Messaging/Chat | `feature/messaging` |
| Job posting | `feature/job-portal` |
| Event management | `feature/event-management` |
| Profile page UI | `feature/profile-page` |
| Bug fix for login | `bugfix/login-error` |

---

## 💻 STEP 3: Working on Your Feature (Daily Workflow)

### 3.1 Write Your Code
Make your changes in the code editor as normal.

### 3.2 Check What You Changed
```bash
git status
```

### 3.3 Stage Your Changes
```bash
# Add specific files
git add backend/app/messaging/models/message.py
git add backend/app/messaging/routers/message.py

# OR add all changes at once
git add .
```

### 3.4 Commit with a Meaningful Message
```bash
git commit -m "feat(messaging): add message model and basic routes"
```

**Commit message format:**
```
type(scope): short description

Types:
  feat     → new feature
  fix      → bug fix
  style    → formatting, no code change
  refactor → code restructuring
  docs     → documentation
  test     → adding tests
```

**Good examples:**
```bash
git commit -m "feat(auth): add JWT token refresh endpoint"
git commit -m "fix(jobs): fix date filter not working"
git commit -m "style(frontend): fix button alignment on profile page"
git commit -m "feat(events): add create event API and model"
```

### 3.5 Push Your Branch to GitHub
```bash
git push origin feature/your-feature-name
```

> [!TIP]
> **First time pushing a new branch?** Use:
> ```bash
> git push -u origin feature/your-feature-name
> ```
> After that, just `git push` will work.

---

## 🔀 STEP 4: Merging Your Feature into `develop`

> Do this when your feature is **complete and working**.

### 4.1 First, Update Your Branch with Latest `develop`
```bash
# Switch to develop and get latest changes
git checkout develop
git pull origin develop

# Switch back to your feature branch
git checkout feature/your-feature-name

# Merge develop into your branch (to get other teammates' changes)
git merge develop
```

> [!WARNING]
> If there are **merge conflicts**, Git will show you the conflicting files. Open them, resolve the conflicts manually, then:
> ```bash
> git add .
> git commit -m "merge: resolve conflicts with develop"
> ```

### 4.2 Run Linting Before Merging (Avoid CI Failures!)
```bash
cd backend
venv\Scripts\activate
pip install ruff black

# Check formatting
black --check .

# If black shows errors, auto-fix them:
black .

# Check linting
ruff check .

# If ruff shows errors, auto-fix them:
ruff check --fix .

# Commit any formatting fixes
git add .
git commit -m "style: format code with black and ruff"
```

### 4.3 Merge into `develop`
```bash
git checkout develop
git pull origin develop
git merge feature/your-feature-name
git push origin develop
```

### 4.4 (Optional) Delete Your Feature Branch After Merging
```bash
# Delete locally
git branch -d feature/your-feature-name

# Delete on GitHub
git push origin --delete feature/your-feature-name
```

---

## 🔄 STEP 5: Staying in Sync (Do This Every Day!)

### Before Starting Work Each Day:
```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop
```

This ensures you have the latest code from all teammates.

---

## 🚢 STEP 6: Merging `develop` → `main` (Only Yash / Team Lead Does This)

> Do this only when the project is **stable and ready for demo/submission**.

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

---

## ⚠️ Common Problems & Solutions

### Problem: "I made changes on the wrong branch!"
```bash
# Stash your changes (save them temporarily)
git stash

# Switch to the correct branch
git checkout feature/correct-branch

# Apply your stashed changes
git stash pop
```

### Problem: "I need to undo my last commit"
```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes (DANGEROUS!)
git reset --hard HEAD~1
```

### Problem: "Git says I have merge conflicts"
1. Open the conflicting file in your editor
2. Look for conflict markers:
```
<<<<<<< HEAD
your code
=======
teammate's code
>>>>>>> develop
```
3. Keep the correct code, remove the markers
4. Save the file
5. Run:
```bash
git add .
git commit -m "merge: resolve conflicts"
```

### Problem: "CI pipeline failed on GitHub"
```bash
# Run these locally before pushing
cd backend
black .          # Auto-format Python code
ruff check .     # Check for linting errors
```

---

## 📋 Quick Reference Card

| Action | Command |
|---|---|
| Clone repo | `git clone https://github.com/Yash-k10/knots.git` |
| Switch branch | `git checkout branch-name` |
| Create new branch | `git checkout -b feature/name` |
| See current branch | `git branch` |
| See all branches | `git branch -a` |
| Pull latest changes | `git pull origin branch-name` |
| Check status | `git status` |
| Stage files | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin branch-name` |
| Merge branch | `git merge branch-name` |
| See commit history | `git log --oneline -10` |
| Stash changes | `git stash` |
| Apply stash | `git stash pop` |

---

## 👥 Example: Full Workflow for a Teammate

Let's say **Rahul** wants to build the **messaging feature**:

```bash
# 1. Clone and setup (one-time)
git clone https://github.com/Yash-k10/knots.git
cd knots
git checkout develop

# 2. Setup backend & frontend (one-time)
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
# Create .env file, install PostgreSQL, create knots_db database
alembic upgrade head
cd ../frontend && npm install

# 3. Create feature branch
git checkout -b feature/messaging

# 4. Write code... (spend hours coding 😄)

# 5. Save progress
git add .
git commit -m "feat(messaging): add message model and send message API"
git push origin feature/messaging

# 6. Next day - get latest code first
git checkout develop
git pull origin develop
git checkout feature/messaging
git merge develop

# 7. Continue coding...
git add .
git commit -m "feat(messaging): add real-time chat with WebSocket"
git push origin feature/messaging

# 8. Feature complete! Format code first
cd backend
black .
ruff check --fix .
git add .
git commit -m "style: format messaging code"
git push origin feature/messaging

# 9. Merge to develop
git checkout develop
git pull origin develop
git merge feature/messaging
git push origin develop

# 10. Cleanup
git branch -d feature/messaging
git push origin --delete feature/messaging
```

---

> [!TIP]
> **Share this guide with your team!** You can also find it in your GitHub repo's wiki or as a `CONTRIBUTING.md` file in the project root.
