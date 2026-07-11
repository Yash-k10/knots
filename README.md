# KNOTS (Knowledge Networking and Opportunity Tracking System)

KNOTS is an AI-powered community-based career and collaboration platform for colleges. It facilitates connection, networking, and opportunities between Students, Alumni, Faculty, Placement Cells, Club Heads, and Admins.

---

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, React Router, React Query
- **Backend**: FastAPI (Python), SQLAlchemy 2.0, Alembic, PostgreSQL, Redis, JWT Authentication
- **Future AI (Placeholders)**: LangChain, FAISS, Sentence Transformers, OpenAI-compatible APIs

---

## Project Structure

```
knots/
├── backend/                  # FastAPI Application
│   ├── alembic/              # DB Migrations history & env configurations
│   ├── app/                  # Main source directory
│   │   ├── core/             # Base configurations, logging, db connectors, middlewares
│   │   ├── modules/          # Domain-driven feature modules (Auth, Users, Jobs, etc.)
│   │   └── main.py           # Application entrypoint
│   ├── requirements.txt      # Backend Python dependencies
│   ├── Dockerfile            # Multi-stage production Docker definition
│   └── .env.example          # Sample environment configurations
├── frontend/                 # React Vite TypeScript Application
│   ├── src/                  # Source code (Components, Pages, Hooks, Routes, etc.)
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── tsconfig.json         # TypeScript compiler configurations
│   ├── vite.config.ts        # Vite configuration
│   └── Dockerfile            # Frontend production static build Docker definition
├── docker-compose.yml        # Local orchestration file
└── README.md                 # Project README and developer manual
```

---

## Development Guidelines

### 1. Code Standards & Architecture
- **SOLID Principles**: Keep interfaces small, dependencies injected, and separation of concerns high.
- **Repository Pattern**: All database access should go through repository classes to isolate SQLAlchemy from service layer logic.
- **Service Layer**: Business logic lives strictly in services. Routers handle HTTP-specific requests/responses.
- **Dependency Injection**: Leverage FastAPI's `Depends` for providing repositories, databases, services, and security credentials.
- **TypeScript Best Practices**: Avoid `any`. Define strong interfaces and return types for hooks and services.

### 2. Git Branching Strategy
We use a standard branching strategy:
- **main**: Deployable production state.
- **develop**: Integration branch for new features. All pull requests target `develop`.
- **feature/[developer]-[short-desc]**: Topic branches for new components or modules.
  - Examples: `feature/dev-a-auth-api`, `feature/dev-c-posts-feed`.

### 3. Commit Convention (Conventional Commits)
Format your commit messages as: `<type>(<scope>): <description>`
- `feat`: A new feature (e.g. `feat(auth): implement refresh token rotation`)
- `fix`: A bug fix (e.g. `fix(db): correct user role foreign key constraint`)
- `docs`: Documentation updates (e.g. `docs(readme): update build commands`)
- `style`: Changes that do not affect code logic (e.g. formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests

---

## Development Roadmap & Minimizing Merge Conflicts

To enable four developers to work in parallel over the next several months, the work is scoped into distinct modules and layers:

| Developer | Primary Responsibility | Target Modules |
| :--- | :--- | :--- |
| **Developer A** | Core Platform Infra & DB | Admin, Analytics, Audit Logs, core database setups, Alembic migrations |
| **Developer B** | Core Identity & Networks | Auth, Users, Profiles, Connections, Roles, Permissions |
| **Developer C** | Core Content & Collaboration | Posts, Comments, Likes, Clubs, Club Members, Messaging |
| **Developer D** | Opportunities & Intelligence | Jobs, Referrals, Events, Notifications, AI integration hooks |

### Milestone Delivery Path
1. **Milestone 1: Project Setup** (Current State)
2. **Milestone 2: Authentication & Core IAM** (Dev B + Dev A)
3. **Milestone 3: Profiles & Resume Uploads** (Dev B + Dev D)
4. **Milestone 4: Posts, Comments & Engagement** (Dev C)
5. **Milestone 5: Connections & Networking** (Dev B + Dev C)
6. **Milestone 6: Real-time Messaging** (Dev C + Dev A)
7. **Milestone 7: Job Board & Referral Requests** (Dev D)
8. **Milestone 8: Campus Events & Schedules** (Dev D + Dev C)
9. **Milestone 9: System Notifications & Alerts** (Dev D + Dev A)
10. **Milestone 10: AI Recommendation Engine** (Dev D - integration of LangChain/FAISS)

---

## Local Setup

### Running with Docker
1. Copy backend and frontend environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Start the database, memory store, and application containers:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://localhost:8000/docs` and the frontend at `http://localhost`.
