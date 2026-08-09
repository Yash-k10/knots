# KNOTS — Technical Approach Flowchart
### SIH 2025 Presentation Slide

> Paste any of these Mermaid code blocks into [mermaid.live](https://mermaid.live) to export high-quality PNG images for your PPT.

---

## Main User Journey Flowchart

```mermaid
flowchart TD
    classDef frontend fill:#d4edda,stroke:#28a745,stroke-width:2px,color:#000
    classDef backend fill:#cce5ff,stroke:#007bff,stroke-width:2px,color:#000
    classDef ai fill:#fff3cd,stroke:#ffc107,stroke-width:2px,color:#000
    classDef database fill:#f8d7da,stroke:#dc3545,stroke-width:2px,color:#000
    classDef decision fill:#e2e3e5,stroke:#6c757d,stroke-width:2px,color:#000

    Start([User Accesses KNOTS Platform]):::frontend --> Login[Login / Registration]:::frontend
    Login --> AuthCheck{JWT Auth Check\nbcrypt + HS256}:::decision
    AuthCheck -- Invalid Token --> Login
    AuthCheck -- Valid Token --> Dashboard[Personalized Feed & Dashboard]:::backend

    Dashboard --> ProfileMgt[Profile Management Module]:::frontend
    ProfileMgt --> ATS[ATS Resume Creator\nKeyword Overlap Algorithm]:::backend
    ProfileMgt --> ProjUpload[Project & Portfolio Upload\nJSON field storage]:::backend
    ProfileMgt --> Achievements[Achievements & Badges\nRule Engine]:::backend

    ATS --> ParseData[Fetch User Skills from Profile]:::backend
    ParseData --> AIFormat[AI Formats to ATS Standards\nscore = 40 + 15/skill]:::ai
    AIFormat --> ExportResume[Generate & Download Resume]:::frontend

    Achievements --> VerifyRole{Verify Club Position\nRule Engine}:::decision
    VerifyRole -- "President / VP / Lead" --> AwardLead[Leadership Badge\n100 pts]:::backend
    VerifyRole -- "Secretary / Treasurer" --> AwardCore[Core Team Badge\n75 pts]:::backend
    VerifyRole -- "Member / Volunteer" --> AwardPart[Active Member Badge\n50 pts]:::backend
    AwardLead & AwardCore & AwardPart --> UpdateProfile[(PostgreSQL User DB)]:::database

    ProjUpload --> SaveProject[(Projects JSON field)]:::database
    SaveProject -.-> AIEngine

    Dashboard --> AIEngine((AI Recommendation\nEngine)):::ai
    AIEngine --> MatchLogic{Content-Based Filtering\nSkill Overlap + Dept Match}:::decision
    MatchLogic -- Skills + Dept Match --> SuggestAlumni[Suggest Alumni to Connect\nscore = 40 + 30 dept + 10/skill]:::backend
    MatchLogic -- Interests + Engagement --> SuggestContent[Suggest Feed Content\nscore = 35 + 20/topic + 15 engagement]:::backend

    SuggestAlumni --> ConnectionReq[Send Connection Request\nstatus = PENDING]:::frontend
    ConnectionReq --> Accept{Addressee Accepts?}:::decision
    Accept -- Yes --> Chat[Real-Time WebSocket Chat\nJWT auth + Event Loop]:::backend
    Accept -- No --> Done([Connection Rejected])

    Dashboard --> JobBoard[Browse Jobs Board\nSQL multi-filter]:::frontend
    JobBoard --> AIJobRec[AI Job Recommendations\nscore = 40 + 15/skill match]:::ai
    AIJobRec --> ApplyJob[Apply for Job\nstatus = PENDING]:::backend
    ApplyJob --> AlumniReferral[Request Alumni Referral\nReferral record links both]:::backend

    subgraph Tech Stack
        T1[Frontend: React + Tailwind + Vite]:::frontend
        T2[Backend: FastAPI + JWT + SQLAlchemy]:::backend
        T3[AI/ML: Content-Based Filtering + NLP]:::ai
        T4[DB: PostgreSQL + JSON fields]:::database
    end
```

---

## Sentinel Six Style — Linear Pipeline Flow

```mermaid
flowchart LR
    classDef step fill:#dbeafe,stroke:#3b82f6,color:#000,stroke-width:2px
    classDef algo fill:#fef9c3,stroke:#eab308,color:#000,stroke-width:2px
    classDef output fill:#dcfce7,stroke:#16a34a,color:#000,stroke-width:2px

    A([User Registration]):::step
    --> B["bcrypt hash\nHS256 JWT"]:::algo
    --> C([Email Verified]):::output
    --> D([Login]):::step
    --> E["Verify hash\naccess 30min\nrefresh 7d"]:::algo
    --> F([JWT Issued]):::output
    --> G([Build Profile]):::step
    --> H["JSON skills\nUUID upload\nUniqueConstraint"]:::algo
    --> I([Profile Live\nAnalytics ON]):::output
    --> J([AI Engine]):::step
    --> K["Content-Based Filtering\nSkill Overlap Score\nDept + Year bonus"]:::algo
    --> L([Alumni Suggestions\nJob Recs\nFeed Content]):::output
    --> M([Apply Job\nATS Check]):::step
    --> N["Keyword Match\nscore=40+15/skill\nmax 98"]:::algo
    --> O([Application PENDING\n→ ACCEPTED]):::output
    --> P([Real-Time Chat]):::step
    --> Q["WebSocket\nEvent Loop\nBroadcast"]:::algo
    --> R([Messages Delivered\nRead Receipts]):::output
```

---

## Technologies & Tools (For PPT Right Panel)

**Frontend**
- React.js (TypeScript + TSX)
- Tailwind CSS
- Vite (build tool)
- React Router, TanStack Query, Recharts

**Backend**
- Python — FastAPI (async)
- SQLAlchemy (async ORM)
- Alembic (DB migrations)
- WebSockets (real-time chat)

**Security**
- JWT — JSON Web Tokens (HS256)
- bcrypt password hashing
- RBAC (Role-Based Access Control)

**Database**
- PostgreSQL (primary relational DB)
- JSON fields for skills, projects, certifications
- UUID-based file naming for profile pictures

**AI / ML**
- Content-Based Filtering (connections, jobs, feed)
- Keyword Overlap Algorithm (ATS resume scoring)
- Rule Engine (badge allocation by position)
- LLM Integration — placeholder for resume critique + career roadmap

**DevOps**
- GitHub Actions CI/CD (`ci-cd.yml`)
- Docker-ready structure
