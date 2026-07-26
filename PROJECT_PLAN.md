# 📋 KNOTS Project — 4-Week Team Plan

> **Team Size:** 4 members | **Duration:** 4 weeks  
> **Goal:** Fully working application by end of Week 3, Week 4 = testing + polish  
> **Start Date:** July 13, 2026 (Monday)

---

## 👥 Team Roles

| Member | Role | Primary Focus |
|---|---|---|
| **Member 1 (Yash — Team Lead)** | Full-Stack + DevOps | Auth, Core, AI, Admin, Deployment |
| **Member 2** | Full-Stack (Backend Heavy) | Profiles, Jobs, Analytics |
| **Member 3** | Full-Stack (Frontend Heavy) | Posts, Feed, Events, Clubs |
| **Member 4** | Full-Stack (Real-Time) | Connections, Messaging, Notifications |

---

## 📦 Module Map

Here are all the modules and who owns them:

| Module | Backend Folder | Frontend Page | Owner |
|---|---|---|---|
| `core` (DB, Security, Middleware) | `app/core/` | — | Member 1 |
| `auth` (Login, Register, JWT) | `app/auth/` | Login, Register | Member 1 |
| `users` (User CRUD) | `app/users/` | Settings | Member 1 |
| `profiles` (Profile CRUD) | `app/profiles/` | Profile | Member 2 |
| `posts` (Feed, Likes, Comments) | `app/posts/` | Feed | Member 3 |
| `connections` (Follow/Connect) | `app/connections/` | Connections | Member 4 |
| `messaging` (Chat, WebSocket) | `app/messaging/` | Messaging | Member 4 |
| `jobs` (Job Posts, Applications) | `app/jobs/` | Jobs | Member 2 |
| `events` (Campus Events) | `app/events/` | Events | Member 3 |
| `clubs` (Student Clubs) | `app/clubs/` | — (new page) | Member 3 |
| `notifications` (Alerts) | `app/notifications/` | Notifications | Member 4 |
| `admin` (Admin Panel) | `app/admin/` | Admin | Member 1 |
| `ai` (AI Recommendations) | `app/ai/` | Dashboard | Member 1 |
| `analytics` (Metrics) | `app/analytics/` | Dashboard | Member 2 |

---

## 🗓️ WEEK 1 — Foundation & Core Features
**July 13 – July 19**

> [!IMPORTANT]
> This is the most critical week. If the foundation is wrong, everything breaks later.

### Member 1 (Yash) — Auth + Core + Users
**Branch:** `feature/auth-core`

| Day | Task |
|---|---|
| Mon | Complete `core/` — database sessions, security (password hashing, JWT), middleware (CORS, logging), base repository pattern |
| Tue | Complete `auth/` backend — register, login, token refresh, logout, email verification endpoints |
| Wed | Complete `users/` backend — get user, update user, delete user, user roles |
| Thu | Frontend — Login page (form, validation, API integration, token storage) |
| Fri | Frontend — Register page (form, validation, role selection) |
| Sat | Frontend — Settings page (change password, update email) + test full auth flow end-to-end |
| Sun | Merge to `develop`, help team with any blockers |

**Deliverables:** ✅ Working login/register system, JWT auth, protected routes

---

### Member 2 — Profiles
**Branch:** `feature/profiles`

| Day | Task |
|---|---|
| Mon | Study the codebase structure, understand repository pattern, models, schemas |
| Tue | Complete `profiles/` models — education, experience, skills, bio, profile picture |
| Wed | Complete `profiles/` repository + services — CRUD operations |
| Thu | Complete `profiles/` routers — GET/PUT/PATCH profile, upload picture |
| Fri | Frontend — Profile page (display all profile data, edit mode) |
| Sat | Frontend — Profile edit form (education, experience, skills sections) |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can view and edit their full profile

---

### Member 3 — Posts & Feed
**Branch:** `feature/posts-feed`

| Day | Task |
|---|---|
| Mon | Study the codebase structure, understand how auth/middleware works |
| Tue | Complete `posts/` models — Post, Comment, Like, media attachments |
| Wed | Complete `posts/` repository + services — create, read, update, delete posts |
| Thu | Complete `posts/` routers — feed endpoint (paginated), like/unlike, comment |
| Fri | Frontend — Feed page (post cards with like/comment buttons, infinite scroll) |
| Sat | Frontend — Create post form (text + image upload), comment section UI |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can create posts, view feed, like and comment

---

### Member 4 — Connections
**Branch:** `feature/connections`

| Day | Task |
|---|---|
| Mon | Study the codebase structure, understand how auth works |
| Tue | Complete `connections/` models — connection request, connection status (pending/accepted/rejected) |
| Wed | Complete `connections/` repository + services — send request, accept, reject, list connections |
| Thu | Complete `connections/` routers — all connection endpoints |
| Fri | Frontend — Connections page (pending requests, my connections, people you may know) |
| Sat | Frontend — Connection card component, accept/reject buttons, search people |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can send/accept/reject connection requests, view connections

---

## 🗓️ WEEK 2 — Social & Communication Features
**July 20 – July 26**

### Member 1 (Yash) — Admin Panel
**Branch:** `feature/admin-panel`

| Day | Task |
|---|---|
| Mon | `admin/` backend — user management (list, ban, unban, delete users) |
| Tue | `admin/` backend — content moderation (flag/remove posts), audit logs |
| Wed | `admin/` backend — dashboard stats (total users, posts, daily activity) |
| Thu | Frontend — Admin page (user table with actions, stats cards) |
| Fri | Frontend — Admin moderation panel (flagged content, audit log view) |
| Sat | Role-based access control — only admin role can access admin routes |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Admin can manage users, moderate content, view platform stats

---

### Member 2 — Jobs Portal
**Branch:** `feature/jobs`

| Day | Task |
|---|---|
| Mon | `jobs/` models — Job posting, Application, Referral, company info |
| Tue | `jobs/` repository + services — create job, apply, list jobs, filter/search |
| Wed | `jobs/` routers — all job endpoints (CRUD + apply + my applications) |
| Thu | Frontend — Jobs page (job cards, search/filter bar, apply button) |
| Fri | Frontend — Job detail page, application form, "My Applications" section |
| Sat | Frontend — Post a job form (for recruiters/alumni) |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can browse jobs, apply, and post job listings

---

### Member 3 — Events & Clubs
**Branch:** `feature/events-clubs`

| Day | Task |
|---|---|
| Mon | `events/` models — Event, RSVP, event categories |
| Tue | `events/` repository + services — create event, RSVP, list events, filter by date |
| Wed | `events/` routers — all event endpoints |
| Thu | `clubs/` backend — Club model, membership, create/join/leave club |
| Fri | Frontend — Events page (event cards, calendar view, RSVP button) |
| Sat | Frontend — Clubs page (club cards, join button, club detail view) |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can create/view events, RSVP, create/join clubs

---

### Member 4 — Messaging (Real-Time Chat)
**Branch:** `feature/messaging`

| Day | Task |
|---|---|
| Mon | `messaging/` models — Conversation, Message, read receipts |
| Tue | `messaging/` repository + services — send message, get conversations, get messages |
| Wed | WebSocket implementation — real-time message delivery using FastAPI WebSockets |
| Thu | `messaging/` routers — REST endpoints + WebSocket endpoint |
| Fri | Frontend — Messaging page (conversation list, chat window, message input) |
| Sat | Frontend — Real-time message updates, typing indicator, online status |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Users can chat in real-time with connections

---

## 🗓️ WEEK 3 — Advanced Features & Integration
**July 27 – August 2**

> [!IMPORTANT]
> By end of this week, the app should be **fully functional and demo-ready**.

### Member 1 (Yash) — AI Features + Dashboard
**Branch:** `feature/ai-dashboard`

| Day | Task |
|---|---|
| Mon | `ai/` backend — AI-powered connection suggestions (based on skills, department) |
| Tue | `ai/` backend — Job recommendations, content recommendations for feed |
| Wed | Frontend — Dashboard page (personalized recommendations, activity summary) |
| Thu | Integration testing — test all API endpoints together |
| Fri | Fix critical bugs across all modules |
| Sat | Set up production deployment (Docker / hosting) |
| Sun | Final merge all feature branches → `develop` → verify CI passes |

**Deliverables:** ✅ AI recommendations, Dashboard, deployment ready

---

### Member 2 — Analytics + Profile Polish
**Branch:** `feature/analytics`

| Day | Task |
|---|---|
| Mon | `analytics/` backend — profile views, post engagement metrics |
| Tue | `analytics/` backend — platform-wide stats, trending posts |
| Wed | Frontend — Analytics widgets on Dashboard (charts, graphs using a chart library) |
| Thu | Polish Profile page — add skills endorsement, connection count, activity feed |
| Fri | Fix bugs in profiles, jobs modules |
| Sat | Write API documentation (Swagger/OpenAPI is auto-generated, review and clean up) |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Analytics dashboard, polished profiles

---

### Member 3 — Notifications + UI Polish
**Branch:** `feature/notifications-ui`

| Day | Task |
|---|---|
| Mon | `notifications/` backend — create notification on events (new like, comment, connection request, event RSVP) |
| Tue | `notifications/` backend — mark as read, notification preferences |
| Wed | Frontend — Notifications page (notification list, mark as read, real-time badge count) |
| Thu | UI Polish — make Feed page responsive, beautiful post cards, animations |
| Fri | UI Polish — Events and Clubs pages, consistent styling across all pages |
| Sat | Fix bugs in posts, events, clubs modules |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Working notifications, polished UI across social features

---

### Member 4 — Notifications (Real-Time) + Search
**Branch:** `feature/realtime-search`

| Day | Task |
|---|---|
| Mon | WebSocket notifications — real-time notification delivery (badge updates without refresh) |
| Tue | Global search — search users, posts, jobs, events across the platform |
| Wed | Frontend — Search bar component with dropdown results |
| Thu | Polish Messaging UI — message timestamps, delivery status, emoji support |
| Fri | Polish Connections page — mutual connections, suggestion algorithm |
| Sat | Fix bugs in messaging, connections, notifications modules |
| Sun | Test + merge to `develop` |

**Deliverables:** ✅ Real-time notifications, global search, polished messaging

---

## 🗓️ WEEK 4 — Testing, Bug Fixing & Final Demo
**August 3 – August 9**

> [!TIP]
> No new features this week. Only fix, test, and polish!

### All Members Together

| Day | Task | Who |
|---|---|---|
| Mon | Full integration testing — test all features end-to-end | Everyone |
| Tue | Bug fixing sprint — each member fixes bugs in their own modules | Everyone |
| Wed | UI consistency — fonts, colors, spacing, responsive design on all pages | Member 3 + 4 |
| Wed | Backend — error handling, input validation, edge cases | Member 1 + 2 |
| Thu | Performance — optimize database queries, add pagination everywhere | Member 1 + 2 |
| Thu | Frontend — loading states, error states, empty states on all pages | Member 3 + 4 |
| Fri | Final demo dry run — test the complete user journey | Everyone |
| Sat | Prepare presentation/documentation for college submission | Everyone |
| Sun | **Merge `develop` → `main`** 🚀 Final production push | Member 1 (Yash) |

---

## 📊 Weekly Merge Schedule

```
Week 1 (Sun) → All members merge feature branches → develop
Week 2 (Sun) → All members merge feature branches → develop  
Week 3 (Sun) → All members merge feature branches → develop
Week 4 (Sun) → Yash merges develop → main (PRODUCTION RELEASE 🎉)
```

---

## 🎯 Weekly Milestones Checklist

### ✅ Week 1 Complete When:
- [x] User can register and login
- [x] User can view and edit their profile  
- [x] User can create and view posts in feed
- [x] User can send and accept connection requests

### ✅ Week 2 Complete When:
- [x] Admin can manage users and moderate content
- [x] Users can browse and apply for jobs
- [x] Users can create and RSVP to events, join clubs
- [x] Users can chat with connections in real-time

### ✅ Week 3 Complete When:
- [x] Dashboard shows AI-powered recommendations
- [x] Analytics and engagement metrics are visible
- [ ] Notifications work in real-time
- [ ] Global search works across the platform
- [ ] All pages are polished and responsive

### ✅ Week 4 Complete When:
- [ ] All features tested end-to-end
- [ ] No critical bugs remaining
- [ ] UI is consistent and professional
- [ ] App is deployed and accessible
- [ ] Documentation/presentation ready

---

## ⚡ Git Workflow Reminder

```bash
# Every morning
git checkout develop && git pull origin develop
git checkout feature/your-branch && git merge develop

# Every evening  
git add . && git commit -m "feat(module): what you did"
git push origin feature/your-branch

# Every Sunday (merge day)
cd backend && black . && ruff check --fix .
git add . && git commit -m "style: format code"
git checkout develop && git pull origin develop
git merge feature/your-branch && git push origin develop
```

---

> [!CAUTION]
> **Rules for the team:**
> 1. **Commit every day** — even if the feature is incomplete, commit your progress
> 2. **Pull `develop` every morning** — avoid merge conflicts
> 3. **Don't touch other members' modules** without telling them
> 4. **Run `black .` and `ruff check .`** before every merge
> 5. **Communicate!** If you're stuck, ask in the group chat immediately
