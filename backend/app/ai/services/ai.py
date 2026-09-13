# Placeholder AI services for KNOTS final year project.
# These services are defined structurally to support future implementation.

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.schemas.connection_suggestion import ConnectionSuggestionResponse
from app.ai.schemas.content_recommendation import ContentRecommendationResponse
from app.ai.schemas.job_recommendation import JobRecommendationResponse
from app.connections.models.connection import Connection
from app.jobs.models.application import Application
from app.jobs.models.enums import JobStatusEnum
from app.jobs.models.job_posting import JobPosting
from app.posts.models.post import Post, PostVisibility
from app.profiles.models.profile import Profile
from app.users.models.role import Role
from app.users.models.user import User


class AIResumeService:
    """High-level Software Engineering Resume Analyzer, ATS Scorer & STAR Impact Optimizer."""

    # Software Engineering Skills Taxonomy
    SWE_SKILLS_TAXONOMY = {
        "Languages": [
            "Python",
            "JavaScript",
            "TypeScript",
            "Java",
            "C++",
            "C#",
            "Go",
            "Golang",
            "Rust",
            "SQL",
            "HTML5",
            "CSS3",
            "PHP",
            "Ruby",
            "Kotlin",
            "Swift",
            "Bash",
            "Shell",
        ],
        "Frameworks & Web": [
            "React",
            "Next.js",
            "Vue",
            "Angular",
            "Node.js",
            "Express",
            "FastAPI",
            "Django",
            "Flask",
            "Spring Boot",
            "ASP.NET",
            "TailwindCSS",
            "Redux",
            "GraphQL",
            "REST",
            "RESTful",
        ],
        "Databases & Caching": [
            "PostgreSQL",
            "MySQL",
            "MongoDB",
            "Redis",
            "Elasticsearch",
            "SQLite",
            "DynamoDB",
            "Cassandra",
            "Kafka",
            "RabbitMQ",
            "Prisma",
            "SQLAlchemy",
        ],
        "Cloud & DevOps": [
            "AWS",
            "GCP",
            "Google Cloud",
            "Azure",
            "Docker",
            "Kubernetes",
            "CI/CD",
            "GitHub Actions",
            "GitLab CI",
            "Terraform",
            "Linux",
            "Nginx",
            "Prometheus",
            "Grafana",
            "Microservices",
        ],
        "Engineering Best Practices": [
            "Unit Testing",
            "Integration Testing",
            "Pytest",
            "Jest",
            "TDD",
            "System Design",
            "Agile",
            "Scrum",
            "Git",
            "Design Patterns",
            "Data Structures",
            "Algorithms",
            "OOP",
        ],
    }

    ACTION_VERBS = [
        "architected",
        "engineered",
        "developed",
        "designed",
        "implemented",
        "optimized",
        "reduced",
        "scaled",
        "automated",
        "refactored",
        "deployed",
        "spearheaded",
        "accelerated",
        "decreased",
        "increased",
        "built",
        "integrated",
        "streamlined",
        "configured",
        "mentored",
    ]

    async def analyze_resume(
        self, resume_text: str, target_role: str = "Software Developer"
    ) -> dict:
        import re

        clean_text = resume_text or ""
        lower_text = clean_text.lower()
        word_count = len(clean_text.split())

        # 1. Detect Skills
        detected_skills: dict[str, list[str]] = {}
        all_detected: list[str] = []
        for category, skills in self.SWE_SKILLS_TAXONOMY.items():
            found = [
                s
                for s in skills
                if re.search(r"\b" + re.escape(s.lower()) + r"\b", lower_text)
            ]
            if found:
                detected_skills[category] = found
                all_detected.extend(found)

        # 2. Detect Action Verbs & Metrics
        found_verbs = [
            v.capitalize()
            for v in self.ACTION_VERBS
            if re.search(r"\b" + v + r"\b", lower_text)
        ]
        metric_matches = re.findall(
            r"(\d+%\s*|\d+x\s*|\$\d+[\w]*|\d+\s*(?:ms|seconds|users|requests|rps|qps|dau|mau|k|m|gb|tb))",
            clean_text,
            re.IGNORECASE,
        )

        # 3. Detect Sections
        has_experience = bool(
            re.search(
                r"\b(experience|employment|work history|internship)\b", lower_text
            )
        )
        has_projects = bool(
            re.search(
                r"\b(projects|technical projects|portfolio|open source)\b", lower_text
            )
        )
        has_skills = bool(
            re.search(r"\b(skills|technical skills|technologies|tools)\b", lower_text)
        )
        has_education = bool(
            re.search(
                r"\b(education|university|college|b\.tech|degree|bachelor)\b",
                lower_text,
            )
        )

        # 4. Compute High-Level Dimensional Scores (0 - 100)
        # Tech Stack Match (breadth across categories)
        cat_count = len(detected_skills.keys())
        tech_score = min(100, int((len(all_detected) * 4) + (cat_count * 10)))

        # Impact & Metrics Score (STAR method)
        metric_count = len(metric_matches)
        impact_score = min(100, int((metric_count * 18) + (len(found_verbs) * 4)))

        # ATS Readability Score
        section_pts = (
            int(has_experience)
            + int(has_projects)
            + int(has_skills)
            + int(has_education)
        ) * 20
        length_pts = (
            20 if (150 <= word_count <= 800) else (10 if word_count > 50 else 5)
        )
        ats_score = min(100, section_pts + length_pts)

        # Weighted Overall Score
        overall_score = min(
            98,
            max(
                45,
                int((tech_score * 0.35) + (impact_score * 0.35) + (ats_score * 0.30)),
            ),
        )

        # 5. Role-Tailored Missing Keywords
        target_role_lower = target_role.lower()
        recommended_missing = []
        if (
            "backend" in target_role_lower
            or "full" in target_role_lower
            or "software" in target_role_lower
        ):
            key_candidates = [
                "Docker",
                "PostgreSQL",
                "Redis",
                "CI/CD",
                "FastAPI",
                "Microservices",
                "Unit Testing",
                "Kubernetes",
            ]
            recommended_missing = [k for k in key_candidates if k not in all_detected][
                :5
            ]
        elif "frontend" in target_role_lower or "web" in target_role_lower:
            key_candidates = [
                "TypeScript",
                "Next.js",
                "TailwindCSS",
                "Redux",
                "Jest",
                "GraphQL",
                "Responsive Design",
            ]
            recommended_missing = [k for k in key_candidates if k not in all_detected][
                :5
            ]
        elif (
            "ai" in target_role_lower
            or "data" in target_role_lower
            or "ml" in target_role_lower
        ):
            key_candidates = [
                "PyTorch",
                "TensorFlow",
                "Pandas",
                "Scikit-Learn",
                "PostgreSQL",
                "Docker",
                "MLOps",
            ]
            recommended_missing = [k for k in key_candidates if k not in all_detected][
                :5
            ]
        else:
            key_candidates = [
                "Docker",
                "Git",
                "REST APIs",
                "SQL",
                "Unit Testing",
                "System Design",
            ]
            recommended_missing = [k for k in key_candidates if k not in all_detected][
                :5
            ]

        # 6. High-Impact Bullet Rewrites (STAR Format transformations)
        bullet_rewrites = [
            {
                "original": "Built backend APIs for user management and authentication.",
                "improved": "Architected secure RESTful auth microservices using FastAPI, JWT, and PostgreSQL, reducing login endpoint latency by 35% across 10,000+ active users.",
                "reason": "Quantifies scale, latency improvements, and explicitly highlights technical tools (JWT, PostgreSQL, FastAPI).",
            },
            {
                "original": "Worked on frontend pages and improved design with React.",
                "improved": "Engineered modular React & TypeScript components with TanStack Query caching, boosting Lighthouse performance score from 68 to 94 and cutting bundle size by 28%.",
                "reason": "Replaces generic description with concrete engineering metrics (Lighthouse score, bundle size reduction, TypeScript).",
            },
            {
                "original": "Deployed application to server and handled bug fixes.",
                "improved": "Automated zero-downtime deployment pipelines using Docker and GitHub Actions to AWS ECS, accelerating release velocity from weekly to multiple daily deployments.",
                "reason": "Demonstrates modern DevOps proficiency (Docker, CI/CD, AWS ECS) and business velocity impact.",
            },
        ]

        # 7. Strengths & Critical Improvements
        strengths = []
        if len(all_detected) >= 5:
            strengths.append(
                f"Demonstrates strong technical repertoire across {len(all_detected)} core software technologies."
            )
        if metric_count >= 2:
            strengths.append(
                "Contains quantified metrics demonstrating measurable engineering impact."
            )
        if len(found_verbs) >= 4:
            strengths.append(
                f"Effective use of active technical verbs ({', '.join(found_verbs[:4])})."
            )
        if has_projects and has_experience:
            strengths.append(
                "Clear structural balance between hands-on project portfolio and engineering experience."
            )
        if not strengths:
            strengths.append(
                "Good baseline technical foundation ready for professional ATS enhancement."
            )

        improvements = []
        if metric_count < 3:
            improvements.append(
                "Quantify bullet points with STAR metrics (e.g. latency reduced by X%, query throughput increased by Y, supported Z users)."
            )
        if (
            "Docker" not in all_detected
            and "Kubernetes" not in all_detected
            and "CI/CD" not in all_detected
        ):
            improvements.append(
                "Highlight containerization and deployment skills (e.g., Docker, GitHub Actions CI/CD) to meet modern SWE industry benchmarks."
            )
        if (
            "Unit Testing" not in all_detected
            and "Pytest" not in all_detected
            and "Jest" not in all_detected
        ):
            improvements.append(
                "Explicitly state testing & code quality practices (e.g. Pytest, Jest, automated integration tests, >80% code coverage)."
            )
        if word_count < 150:
            improvements.append(
                "Expand on architectural design decisions, database schema optimizations, and distributed challenges solved in projects."
            )

        rating = (
            "Excellent"
            if overall_score >= 85
            else ("Strong" if overall_score >= 70 else "Needs Optimization")
        )

        return {
            "score": overall_score,
            "rating": rating,
            "target_role": target_role,
            "dimensions": {
                "overall": overall_score,
                "ats_compatibility": ats_score,
                "impact_metrics": impact_score,
                "tech_stack_depth": tech_score,
            },
            "detected_skills": detected_skills,
            "detected_skills_count": len(all_detected),
            "missing_high_impact_keywords": recommended_missing,
            "bullet_rewrites": bullet_rewrites,
            "feedback": improvements,
            "strengths": strengths,
            "suggestions": improvements,
        }


class CareerRoadmapService:
    """High-level Software Developer Career Roadmap & Milestone Blueprint Generator."""

    ROLE_ROADMAPS = {
        "full-stack": {
            "title": "Full-Stack Software Engineer",
            "market_demand": "Very High (Top 3 tech hiring priority)",
            "salary_range": "$95k - $145k / ₹12L - ₹28L",
            "estimated_weeks": 20,
            "required_core_skills": [
                "TypeScript",
                "React",
                "Node.js",
                "Python",
                "PostgreSQL",
                "Docker",
                "Redis",
                "CI/CD",
            ],
            "milestones": [
                {
                    "phase": "Phase 1: Advanced Language Internals & Full-Stack Core",
                    "title": "Deep TypeScript & Modern Asynchronous Architectures",
                    "duration": "Weeks 1 - 5",
                    "description": "Master advanced TypeScript generics, event-loop concurrency, REST/GraphQL API design, and SQL relational schema normalization.",
                    "key_topics": [
                        "TypeScript Strict Typing & Generics",
                        "FastAPI / Node.js Microservices",
                        "PostgreSQL Query Optimization & Indexing",
                        "Authentication (JWT / OAuth2 / RBAC)",
                    ],
                    "project": {
                        "title": "Production-Ready Multi-Tenant Auth & API Gateway",
                        "description": "Build an asynchronous API gateway with role-based access control, rate limiting with Redis token buckets, and automated database migrations.",
                        "tech_stack": "FastAPI, PostgreSQL, Redis, Docker, Pytest",
                    },
                    "interview_focus": "Data Structures (Hash Maps, Trees, Graphs), SQL vs NoSQL trade-offs, Asynchronous execution model.",
                },
                {
                    "phase": "Phase 2: Scalable Frontend Architecture & State Orchestration",
                    "title": "Modern React 18, Next.js App Router & Client Performance",
                    "duration": "Weeks 6 - 10",
                    "description": "Engineer high-performance client applications with server-side rendering, optimistic UI mutations, and state management.",
                    "key_topics": [
                        "Next.js App Router & Server Components",
                        "TanStack Query & Optimistic Updates",
                        "Responsive UI Systems (Tailwind / Radix)",
                        "Lighthouse 95+ Core Web Vitals Optimization",
                    ],
                    "project": {
                        "title": "Real-Time Collaborative Dashboard with Live Streams",
                        "description": "Develop a real-time reactive interface with WebSocket feeds, interactive analytics charts, and optimistic drag-and-drop kanban boards.",
                        "tech_stack": "Next.js, TypeScript, TailwindCSS, WebSockets, Recharts",
                    },
                    "interview_focus": "Frontend System Design (Virtualization, Debouncing, State normalization), DOM rendering pipeline, Component composition.",
                },
                {
                    "phase": "Phase 3: Distributed Systems, Caching & Cloud CI/CD",
                    "title": "Containerization, Cloud Infrastructure & Asynchronous Queues",
                    "duration": "Weeks 11 - 15",
                    "description": "Transition from monolithic setups to containerized, distributed architectures with background worker queues and automated pipelines.",
                    "key_topics": [
                        "Docker Multi-Stage Builds",
                        "Redis Caching Strategies & Pub/Sub",
                        "Celery / BullMQ Background Task Queues",
                        "GitHub Actions CI/CD to AWS ECS / Cloud Run",
                    ],
                    "project": {
                        "title": "Distributed Media Processing & Notification Engine",
                        "description": "Construct an asynchronous pipeline that processes media uploads, extracts metadata, coordinates email/SMS notifications, and guarantees idempotency.",
                        "tech_stack": "Docker, AWS S3, Redis Queues, Celery, GitHub Actions",
                    },
                    "interview_focus": "System Design: Scalable Notification Service, Cache invalidation strategies, Idempotency keys.",
                },
                {
                    "phase": "Phase 4: Capstone, Production Observability & Technical Leadership",
                    "title": "End-to-End Enterprise SaaS & High-Availability Architecture",
                    "duration": "Weeks 16 - 20",
                    "description": "Deploy a complete SaaS product with telemetry (Prometheus/Grafana), automated E2E testing suites, and load testing.",
                    "key_topics": [
                        "Prometheus & Grafana Observability",
                        "Playwright End-to-End Testing",
                        "System Load Testing (k6 / Locust)",
                        "Technical Architecture Documentation",
                    ],
                    "project": {
                        "title": "Enterprise Cloud Collaboration & Team Operations Platform",
                        "description": "Complete production portfolio product supporting 1,000+ concurrent requests, automated health checks, error budgets, and full CI/CD deployment.",
                        "tech_stack": "Full Stack Monorepo, Kubernetes / AWS, Prometheus, Playwright",
                    },
                    "interview_focus": "Mock Technical Interviews: End-to-End System Design (e.g. Design Uber / Slack), Behavioral STAR scenarios.",
                },
            ],
            "interview_prep": {
                "system_design": [
                    "Design a Rate Limiter",
                    "Design a Distributed URL Shortener",
                    "Design a Real-Time Chat System",
                    "Design an E-Commerce Checkout with Stripe",
                ],
                "dsa_focus": [
                    "Array & Sliding Window",
                    "Graph BFS/DFS & Topo Sort",
                    "Dynamic Programming Fundamentals",
                    "Heap & Priority Queues",
                ],
                "behavioral": [
                    "Handling a High-Severity Production Incident",
                    "Navigating Architectural Disagreements",
                    "Mentoring Junior Developers",
                ],
            },
        },
        "backend": {
            "title": "Backend Systems & Cloud Engineer",
            "market_demand": "Very High",
            "salary_range": "$105k - $160k / ₹14L - ₹32L",
            "estimated_weeks": 20,
            "required_core_skills": [
                "Python",
                "Go",
                "PostgreSQL",
                "Redis",
                "Kafka",
                "Docker",
                "Kubernetes",
                "System Design",
            ],
            "milestones": [
                {
                    "phase": "Phase 1: Advanced Backend Fundamentals & Database Engineering",
                    "title": "High-Throughput APIs, Connection Pooling & Index Tuning",
                    "duration": "Weeks 1 - 5",
                    "description": "Master low-level database execution plans, ACID transactions, isolation levels, and non-blocking asynchronous APIs.",
                    "key_topics": [
                        "AsyncIO & Concurrency Primitives",
                        "PostgreSQL EXPLAIN ANALYZE & B-Tree Indexing",
                        "Connection Pooling & Deadlock Resolution",
                        "gRPC & Protocol Buffers",
                    ],
                    "project": {
                        "title": "High-Throughput Financial Ledger API Engine",
                        "description": "Engineered transactional ledger API supporting double-entry bookkeeping, ACID atomicity, and sub-10ms response times.",
                        "tech_stack": "FastAPI / Go, PostgreSQL, Asyncpg, Pytest",
                    },
                    "interview_focus": "Database locking, Transaction isolation, Concurrency vs Parallelism.",
                },
                {
                    "phase": "Phase 2: Event-Driven Architectures & Stream Processing",
                    "title": "Kafka / RabbitMQ, Event Sourcing & CQRS",
                    "duration": "Weeks 6 - 10",
                    "description": "Design distributed event pipelines handling stream ingestion, consumer group balancing, and at-least-once delivery guarantees.",
                    "key_topics": [
                        "Apache Kafka Partitioning & Offsets",
                        "Event Sourcing & CQRS Pattern",
                        "Distributed Transaction Sagas",
                        "Dead Letter Queues",
                    ],
                    "project": {
                        "title": "Real-Time Telemetry & Event Ingestion Pipeline",
                        "description": "Event-driven system ingesting 50,000 events/sec via Kafka with partitioned consumers and timescale analytics storage.",
                        "tech_stack": "Go / Python, Kafka, Redis, TimescaleDB, Docker",
                    },
                    "interview_focus": "System Design: Design an Event Ingestion Pipeline, Kafka vs RabbitMQ trade-offs.",
                },
                {
                    "phase": "Phase 3: Cloud Infrastructure, Kubernetes & Microservices",
                    "title": "Service Mesh, Container Orchestration & Distributed Caching",
                    "duration": "Weeks 11 - 15",
                    "description": "Deploy containerized services across Kubernetes clusters with Istio service mesh, distributed tracing, and Redis clustering.",
                    "key_topics": [
                        "Kubernetes Deployments & Services",
                        "Distributed Tracing (OpenTelemetry)",
                        "Circuit Breakers & Exponential Backoff",
                        "Redis Sentinel & Sharding",
                    ],
                    "project": {
                        "title": "Resilient Microservices Cluster with Chaos Engineering",
                        "description": "Deploy 4 interconnected microservices with distributed OpenTelemetry tracing and automated failover recovery.",
                        "tech_stack": "Kubernetes, Docker, OpenTelemetry, Jaeger, Redis",
                    },
                    "interview_focus": "Distributed consensus (Raft/Paxos), CAP theorem, Cache stampede mitigation.",
                },
                {
                    "phase": "Phase 4: High-Scale Capstone & Senior System Design",
                    "title": "Production Scale & Reliability Engineering",
                    "duration": "Weeks 16 - 20",
                    "description": "Build and load-test a geo-distributed service to withstand node failure and traffic spikes.",
                    "key_topics": [
                        "Geo-Distributed Database Replication",
                        "Load Testing with k6 (100k RPM)",
                        "Rate Limiting & DDoS Defense",
                        "Architecture Decision Records (ADRs)",
                    ],
                    "project": {
                        "title": "Global Rate Limiter & Webhook Dispatch Platform",
                        "description": "Production platform delivering reliable webhooks with exponential retries, signature verification, and latency analytics.",
                        "tech_stack": "Go/Python, AWS Lambda, DynamoDB, Redis Cluster",
                    },
                    "interview_focus": "Staff/Senior System Design interviews (Design YouTube / Google Drive / Payment Gateway).",
                },
            ],
            "interview_prep": {
                "system_design": [
                    "Design a Distributed Unique ID Generator (Snowflake)",
                    "Design a Key-Value Store",
                    "Design a Distributed Message Broker",
                    "Design a Video Streaming Backend",
                ],
                "dsa_focus": [
                    "Graphs & Dijkstra/MST",
                    "Trie & String Matching",
                    "LRU Cache Implementation",
                    "Bit Manipulation & Memory Limits",
                ],
                "behavioral": [
                    "Handling Data Inconsistencies in Production",
                    "Designing for Backward Compatibility",
                ],
            },
        },
    }

    async def generate_roadmap(
        self,
        target_role: str,
        current_skills: list[str],
        experience_level: str = "Mid-Level",
    ) -> dict:
        clean_role = (target_role or "Software Developer").strip()
        role_key = "backend" if "backend" in clean_role.lower() else "full-stack"
        template = self.ROLE_ROADMAPS.get(role_key, self.ROLE_ROADMAPS["full-stack"])

        user_skills_lower = {s.strip().lower() for s in current_skills if s.strip()}
        required_skills = template["required_core_skills"]

        matching = [s for s in required_skills if s.lower() in user_skills_lower]
        missing = [s for s in required_skills if s.lower() not in user_skills_lower]

        milestones = template["milestones"]

        return {
            "target_role": clean_role,
            "experience_level": experience_level,
            "role_overview": {
                "title": template["title"],
                "market_demand": template["market_demand"],
                "salary_range": template["salary_range"],
                "estimated_duration": f"{template['estimated_weeks']} Weeks",
            },
            "skill_gap_analysis": {
                "matching_skills": matching,
                "skills_to_acquire": missing,
                "readiness_percentage": int(
                    (len(matching) / max(len(required_skills), 1)) * 100
                ),
            },
            "milestones": milestones,
            "recommended_skills": missing if missing else required_skills[:4],
            "interview_prep": template["interview_prep"],
        }


class AIConnectionSuggestionService:
    """AI-powered connection suggestions service based on skills, department, and graduation year."""

    async def get_connection_suggestions(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[ConnectionSuggestionResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        conn_stmt = select(Connection).where(
            or_(
                Connection.requester_id == current_user_id,
                Connection.addressee_id == current_user_id,
            )
        )
        conn_res = await db.execute(conn_stmt)
        existing_connections = conn_res.scalars().all()

        excluded_ids = {current_user_id}
        for conn in existing_connections:
            excluded_ids.add(conn.requester_id)
            excluded_ids.add(conn.addressee_id)

        cand_stmt = (
            select(User)
            .outerjoin(Profile, User.id == Profile.user_id)
            .outerjoin(Role, User.role_id == Role.id)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(
                and_(
                    User.is_active == True,
                    User.id.notin_(excluded_ids),
                    or_(
                        Role.name.is_(None),
                        and_(
                            Role.name != "Super Admin",
                            Role.name != "super admin",
                            Role.name != "superadmin",
                            Role.name != "SUPER ADMIN",
                        ),
                    ),
                )
            )
        )
        cand_res = await db.execute(cand_stmt)
        candidates = cand_res.scalars().all()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None
        user_grad_year = current_profile.graduation_year if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        user_skills_lower = {s.lower(): s for s in user_skills}
        suggestions: list[ConnectionSuggestionResponse] = []

        for user in candidates:
            profile = user.profile
            cand_skills: list[str] = []
            if profile and profile.skills:
                if isinstance(profile.skills, list):
                    cand_skills = [str(s).strip() for s in profile.skills]
                elif isinstance(profile.skills, dict):
                    for val in profile.skills.values():
                        if isinstance(val, list):
                            cand_skills.extend([str(s).strip() for s in val])

            common_skills: list[str] = []
            for s in cand_skills:
                if s.lower() in user_skills_lower:
                    if s not in common_skills:
                        common_skills.append(s)

            score = 40
            reasons: list[str] = []

            cand_dept = profile.department if profile else None
            cand_grad_year = profile.graduation_year if profile else None
            cand_bio = profile.bio if profile else None
            cand_picture = profile.profile_picture if profile else None

            if (
                user_dept
                and cand_dept
                and user_dept.strip().lower() == cand_dept.strip().lower()
            ):
                score += 30
                reasons.append(f"Matching department: {cand_dept}")
            elif cand_dept:
                reasons.append(f"Department: {cand_dept}")

            if common_skills:
                skill_points = min(len(common_skills) * 10, 30)
                score += skill_points
                skills_str = ", ".join(common_skills[:3])
                reasons.append(
                    f"{len(common_skills)} shared skill{'s' if len(common_skills) > 1 else ''} ({skills_str})"
                )

            if user_grad_year and cand_grad_year:
                year_diff = abs(user_grad_year - cand_grad_year)
                if year_diff == 0:
                    score += 10
                    reasons.append(f"Same graduation year ({cand_grad_year})")
                elif year_diff == 1:
                    score += 5

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else f"Recommended {user.role.name if user.role else 'campus peer'}"
            )

            clean_first = profile.first_name if profile else None
            clean_last = profile.last_name if profile else None
            if not clean_first or clean_first.strip().lower() == "user":
                email_handle = user.email.split("@")[0]
                parts = [
                    p.capitalize()
                    for p in email_handle.replace("_", ".").split(".")
                    if p
                ]
                clean_first = parts[0] if parts else "Student"
                clean_last = (
                    " ".join(parts[1:]) if len(parts) > 1 else (clean_last or "")
                )

            suggestions.append(
                ConnectionSuggestionResponse(
                    user_id=user.id,
                    email=user.email,
                    first_name=clean_first,
                    last_name=clean_last or "",
                    bio=cand_bio,
                    department=cand_dept
                    or (user.role.name if user.role else "Student"),
                    graduation_year=cand_grad_year,
                    profile_picture=cand_picture,
                    skills=cand_skills,
                    match_score=score,
                    common_skills=common_skills,
                    reason=reason_text,
                )
            )

        suggestions.sort(key=lambda x: x.match_score, reverse=True)
        return suggestions[:limit]


class AIJobRecommendationService:
    """AI-powered job recommendations service based on user skills, department, and career details."""

    async def get_job_recommendations(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[JobRecommendationResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        user_skills_lower = {s.lower(): s for s in user_skills}

        app_stmt = select(Application.job_posting_id).where(
            Application.applicant_id == current_user_id
        )
        app_res = await db.execute(app_stmt)
        applied_job_ids = set(app_res.scalars().all())

        job_stmt = (
            select(JobPosting)
            .options(selectinload(JobPosting.company))
            .where(
                and_(
                    JobPosting.status == JobStatusEnum.OPEN,
                    JobPosting.id.notin_(applied_job_ids) if applied_job_ids else True,
                )
            )
        )
        job_res = await db.execute(job_stmt)
        jobs = job_res.scalars().all()

        recommendations: list[JobRecommendationResponse] = []

        for job in jobs:
            req_skills: list[str] = []
            if job.required_skills:
                if isinstance(job.required_skills, list):
                    req_skills = [str(s).strip() for s in job.required_skills]
                elif isinstance(job.required_skills, dict):
                    for val in job.required_skills.values():
                        if isinstance(val, list):
                            req_skills.extend([str(s).strip() for s in val])

            matching_skills: list[str] = []
            for s in req_skills:
                if s.lower() in user_skills_lower:
                    if s not in matching_skills:
                        matching_skills.append(s)

            score = 40
            reasons: list[str] = []

            if matching_skills:
                skill_points = min(len(matching_skills) * 15, 45)
                score += skill_points
                skills_str = ", ".join(matching_skills[:3])
                reasons.append(
                    f"{len(matching_skills)} matching skill{'s' if len(matching_skills) > 1 else ''} ({skills_str})"
                )

            title_desc_lower = f"{job.title} {job.description or ''}".lower()
            if user_dept and user_dept.strip().lower() in title_desc_lower:
                score += 15
                reasons.append(f"Relevant to department: {user_dept}")

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else "Recommended based on open position requirements"
            )

            job_type_val = (
                job.job_type.value
                if hasattr(job.job_type, "value")
                else str(job.job_type)
            )
            workplace_val = (
                job.workplace_type.value
                if hasattr(job.workplace_type, "value")
                else str(job.workplace_type)
            )
            company_name = job.company.name if job.company else None

            recommendations.append(
                JobRecommendationResponse(
                    job_id=job.id,
                    title=job.title,
                    company_name=company_name,
                    location=job.location,
                    job_type=job_type_val,
                    workplace_type=workplace_val,
                    salary_range=job.salary_range,
                    required_skills=req_skills,
                    match_score=score,
                    matching_skills=matching_skills,
                    reason=reason_text,
                )
            )

        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]


class AIContentRecommendationService:
    """AI-powered content recommendations for feed based on user interest & engagement metrics."""

    async def get_content_recommendations(
        self, db: AsyncSession, current_user_id: int, limit: int = 10
    ) -> list[ContentRecommendationResponse]:
        stmt = select(Profile).where(Profile.user_id == current_user_id)
        res = await db.execute(stmt)
        current_profile = res.scalars().first()

        user_skills: list[str] = []
        user_dept = current_profile.department if current_profile else None

        if current_profile and current_profile.skills:
            if isinstance(current_profile.skills, list):
                user_skills = [str(s).strip() for s in current_profile.skills]
            elif isinstance(current_profile.skills, dict):
                for val in current_profile.skills.values():
                    if isinstance(val, list):
                        user_skills.extend([str(s).strip() for s in val])

        search_topics = set()
        for s in user_skills:
            if len(s) > 2:
                search_topics.add(s.lower())
        if user_dept:
            search_topics.add(user_dept.lower())

        post_stmt = (
            select(Post)
            .options(
                selectinload(Post.author).selectinload(User.profile),
                selectinload(Post.likes),
                selectinload(Post.comments),
            )
            .where(Post.visibility == PostVisibility.PUBLIC)
        )
        post_res = await db.execute(post_stmt)
        posts = post_res.scalars().all()

        recommendations: list[ContentRecommendationResponse] = []

        for post in posts:
            content_lower = post.content.lower()
            matched_topics: list[str] = []

            for topic in search_topics:
                if topic in content_lower:
                    matched_topics.append(topic.capitalize())

            score = 35
            reasons: list[str] = []

            if matched_topics:
                topic_points = min(len(matched_topics) * 20, 40)
                score += topic_points
                topics_str = ", ".join(matched_topics[:3])
                reasons.append(f"Matches interests: {topics_str}")

            like_count = len(post.likes) if post.likes else 0
            comment_count = len(post.comments) if post.comments else 0

            if like_count + comment_count >= 3:
                score += 15
                reasons.append("High community engagement")
            elif like_count + comment_count > 0:
                score += 5

            score = min(score, 98)
            reason_text = (
                " | ".join(reasons)
                if reasons
                else "Recommended trending campus content"
            )

            author_name = None
            author_avatar = None
            if post.author and post.author.profile:
                p = post.author.profile
                author_name = f"{p.first_name or ''} {p.last_name or ''}".strip()
                if not author_name:
                    author_name = post.author.email.split("@")[0]
                author_avatar = p.profile_picture

            created_at_str = post.created_at.isoformat() if post.created_at else None

            recommendations.append(
                ContentRecommendationResponse(
                    post_id=post.id,
                    author_id=post.author_id,
                    author_name=author_name,
                    author_avatar=author_avatar,
                    content=post.content,
                    image_url=post.image_url,
                    created_at=created_at_str,
                    like_count=like_count,
                    comment_count=comment_count,
                    relevance_score=score,
                    matched_topics=matched_topics,
                    reason=reason_text,
                )
            )

        recommendations.sort(key=lambda x: x.relevance_score, reverse=True)
        return recommendations[:limit]
