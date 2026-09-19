"""
KNOTS Platform - Master Documentation Generator Script
Builds the complete, exhaustive Word document (.docx) covering all aspects of KNOTS.
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

sys.path.append(os.path.abspath("scratch"))
from doc_helpers import (
    set_cell_background,
    set_cell_margins,
    set_table_borders,
    add_callout,
    format_table,
    add_code_block
)
from builder_core import (
    add_heading_1,
    add_heading_2,
    add_heading_3,
    add_body_p,
    add_bullet
)

def build_full_knots_doc():
    doc = docx.Document()
    
    # 1-inch margins
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)
        
        # Header & Footer
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("KNOTS: Knowledge Networking and Opportunity Tracking System")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Confidential - Final Year Project Comprehensive Technical Manual")
        frun.font.name = "Arial"
        frun.font.size = Pt(8)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(36)
    p_pre.paragraph_format.space_after = Pt(8)
    r_inst = p_pre.add_run("S.B. JAIN INSTITUTE OF TECHNOLOGY, MANAGEMENT & RESEARCH, NAGPUR\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")
    r_inst.font.name = "Arial"
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(100, 116, 139)
    p_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(24)
    p_title.paragraph_format.space_after = Pt(12)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("KNOTS\nKnowledge Networking and Opportunity Tracking System")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(26)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138) # Deep Navy

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(36)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Comprehensive System Architecture, Engineering Blueprint, Algorithms, Database Schema, API Specification & Developer Guide")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(79, 70, 229) # Indigo

    # Metadata Box
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = [Inches(2.5), Inches(4.0)]
    format_table(meta_table, col_w)
    
    meta_data = [
        ("Project Title", "KNOTS (Knowledge Networking and Opportunity Tracking System)"),
        ("Target Domain", "Higher Education Institutional ERP & AI Social Career Ecosystem"),
        ("Architecture Pattern", "Decoupled Async Micro-Modular Monolith (FastAPI + React Vite)"),
        ("Primary Technology Stack", "React 18, TypeScript, Tailwind CSS, FastAPI, PostgreSQL 16, Redis, WebSockets, Gemini AI"),
        ("Document Version & Date", "Version 2.0 (Comprehensive Release) | Academic Year 2025-2026")
    ]
    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        row.cells[0].paragraphs[0].text = label
        row.cells[1].paragraphs[0].text = val
    format_table(meta_table, col_w)

    doc.add_page_break()

    # =========================================================================
    # TABLE OF CONTENTS / OUTLINE
    # =========================================================================
    add_heading_1(doc, "Document Table of Contents")
    add_body_p(doc, "This document provides an exhaustive, granular engineering specification of the KNOTS platform. Every subsystem, algorithm, database model, API endpoint, routing rule, frontend component, backend service, and deployment configuration is detailed herein.")

    toc_items = [
        "1. Executive Summary & System Working (Vision, Lifecycle & Personas)",
        "2. Complete Technology Stack & Architectural Decision Records (ADRs)",
        "3. Algorithms, Mathematical Logic & Business Rules (Detailed Formulations)",
        "4. System Architecture, Data Flow & Request Lifecycles",
        "5. Complete Database Schema (All 29 Models, Fields, Types, Relationships)",
        "6. Master API Reference Catalog (All 85+ Endpoints across 17 Modules)",
        "7. Frontend Deep-Dive (Architecture, Routing Matrix, 23 Pages, Components, Design System)",
        "8. Backend Deep-Dive (FastAPI, Modular Layered Architecture, Services, Repositories, Middlewares)",
        "9. Real-Time Communication, Security & Role-Based Access Control (RBAC)",
        "10. Server Configuration, Environment Variables, Docker & Deployment Guide",
        "11. Comprehensive Project Directory Structure (Annotated File Tree)"
    ]
    for item in toc_items:
        add_bullet(doc, item)

    add_callout(doc, "This document serves as the single source of truth for project viva examinations, technical defense, accreditation auditing (NAAC/NBA), and future developer onboarding.", "DOCUMENT CONTROL", "important")

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & SYSTEM WORKING
    # =========================================================================
    add_heading_1(doc, "1. Executive Summary & System Working")
    
    add_heading_2(doc, "1.1 The Institutional Problem Statement")
    add_body_p(doc, "Modern collegiate institutions face acute fragmentation across student academic progression, alumni relations, campus placement drives, departmental administration, and extracurricular clubs. Typically, colleges rely on disconnected silos: WhatsApp groups for informal club communication, LinkedIn for professional networking (where college context is diluted), Google Forms/Sheets for placement tracking, legacy ERP portals for attendance, and email chains for HOD approvals.")
    add_body_p(doc, "This fragmentation leads to critical institutional bottlenecks:")
    add_bullet(doc, "Students miss critical placement drives and lack actionable ATS resume feedback tailored to college recruitment.", "Placement Friction: ")
    add_bullet(doc, "Institutions lose track of graduated batches; alumni have no dedicated institutional channel to post referrals or mentor juniors.", "Alumni Disconnect: ")
    add_bullet(doc, "Heads of Department (HODs) spend hundreds of hours collecting student achievements and placement records manually for accreditation bodies (NAAC/NBA).", "Administrative Burden: ")
    add_bullet(doc, "Campus events and student clubs struggle with low attendance, manual RSVP tracking, and fragmented announcements.", "Campus Life Silos: ")

    add_heading_2(doc, "1.2 The KNOTS Solution & Unified Ecosystem")
    add_body_p(doc, "KNOTS (Knowledge Networking and Opportunity Tracking System) solves these challenges through a centralized, AI-augmented digital campus platform. It integrates professional networking, placement automation, departmental governance, real-time messaging, club coordination, and career intelligence into a single high-performance web platform.")

    add_heading_2(doc, "1.3 Multi-Persona Working & Workflows")
    add_body_p(doc, "The platform is engineered around strict Role-Based Access Control (RBAC) supporting nine distinct campus personas:")

    personas = [
        ("Student Workflow", "Students register using institutional email (@sbjit.edu.in) verified via 6-digit OTP. They build a comprehensive profile (education, experience, technical skills, certifications, 10th/12th/Diploma marks, GitHub/LeetCode/LinkedIn links). They can submit resumes to the AI ATS Resume Analyzer for instant deterministic & STAR-based rewrites; generate personalized Career Roadmaps; apply to campus jobs/internships; network with peers & alumni; RSVP to campus events; join student clubs; and chat in real-time."),
        ("Alumni Workflow", "Graduated students transition to Alumni status. They can post job referrals, share career insights on the campus feed, mentor students via direct messaging, connect with fellow alumni, and participate in departmental alumni directories and institutional networking meets."),
        ("Faculty Workflow", "Faculty members monitor student academic progress, broadcast class announcements, review and verify student co-curricular achievements, and collaborate with HODs on departmental accreditation reports."),
        ("Head of Department (HOD) Workflow", "HODs access the dedicated Department Console. They view real-time department statistics (student count, faculty count, alumni strength, placement percentage), review and verify pending student achievements with certificate previews, submit formal departmental reports to management, generate Management Connect requests (for lab equipment, budget, syllabus updates), broadcast departmental notices, and analyze cohort CGPA and placement distributions."),
        ("Training & Placement Officer (TPO) Workflow", "TPOs manage the corporate recruitment pipeline: onboarding companies, creating job/internship listings with strict eligibility criteria (10th/12th/Diploma minimum cutoffs, eligible departments), reviewing candidate applications across a 5-stage lifecycle (Pending -> Reviewing -> Interviewing -> Offered -> Rejected), tracking campus placement ratios, and exporting structured placement audit CSV reports."),
        ("Department Controller Workflow", "Department Controllers are operational coordinators assigned per department. Registration requires a cryptographically strong Department Controller Verification Key. Controllers coordinate departmental events, approve club initiatives, track student participation, and interface between students and HODs."),
        ("Central Administrator / Management Workflow", "Super Administrators use the Master Admin Security Key to manage platform-wide operations: viewing global system statistics, reviewing flagged posts/comments, banning/unbanning malicious users, creating high-entropy one-time Controller Activation Codes, and reviewing immutable audit logs for all administrative actions."),
        ("Institutional Leadership (Dean, Principal, CEO)", "Executive stakeholders access the Institution Overview and Academic Overview dashboards. They review aggregated institutional KPIs, inter-departmental performance comparisons, NIRF/NAAC readiness indicators, and overarching placement statistics.")
    ]

    for title, desc in personas:
        add_body_p(doc, desc, bold_prefix=f"{title}: ")

    doc.add_page_break()

    # =========================================================================
    # SECTION 2: TECHNOLOGY STACK & ARCHITECTURAL DECISION RECORDS
    # =========================================================================
    add_heading_1(doc, "2. Technology Stack & Architectural Decision Records")
    add_body_p(doc, "KNOTS is built using modern, production-grade technologies selected for high concurrency, type safety, modular maintainability, and responsiveness.")

    tech_table = doc.add_table(rows=12, cols=4)
    tech_widths = [Inches(1.5), Inches(1.5), Inches(1.2), Inches(2.3)]
    format_table(tech_table, tech_table_col_widths := tech_widths)
    
    headers = ["Layer", "Technology", "Version", "Key Rationale & Purpose"]
    for i, h in enumerate(headers):
        tech_table.rows[0].cells[i].paragraphs[0].text = h

    stack_data = [
        ("Frontend Framework", "React", "18.3.1", "Component-based reactive UI with concurrent rendering and hooks."),
        ("Build Tooling", "Vite", "5.4.19", "Instant Hot Module Replacement (HMR) and optimized ES-module bundling."),
        ("Language (Client)", "TypeScript", "5.8.3", "End-to-end type safety, preventing runtime errors in complex data structures."),
        ("Styling & UI", "Tailwind CSS + Lucide", "3.4.17", "Utility-first design system with sleek dark-mode glassmorphism and modern icons."),
        ("Data Visualization", "Recharts", "2.15.4", "Declarative charting for placement analytics, CGPA curves, and profile view timelines."),
        ("Backend Framework", "FastAPI (ASGI)", "0.110.0+", "Asynchronous high-performance Python web framework with auto-OpenAPI generation."),
        ("Database ORM", "SQLAlchemy (Async)", "2.0.28+", "Modern async ORM using asyncpg driver for high-throughput non-blocking queries."),
        ("Relational Database", "PostgreSQL", "16.x", "ACID-compliant relational database with JSONB support for polymorphic profile skills."),
        ("Cache & Messaging", "Redis", "7.x", "In-memory key-value store for session caching, rate-limiting, and WebSocket brokering."),
        ("AI / LLM Engine", "Google Gemini 2.5 Flash", "Latest SDK", "Structured JSON Schema generation for resume ATS rewrites and career milestones."),
        ("Database Migrations", "Alembic", "1.13.1+", "Version-controlled database schema migrations with automated upgrade/downgrade scripts.")
    ]

    for idx, (layer, tech, ver, rat) in enumerate(stack_data, start=1):
        row = tech_table.rows[idx]
        row.cells[0].paragraphs[0].text = layer
        row.cells[1].paragraphs[0].text = tech
        row.cells[2].paragraphs[0].text = ver
        row.cells[3].paragraphs[0].text = rat
    format_table(tech_table, tech_widths)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_heading_2(doc, "2.1 Key Architectural Decision Records (ADRs)")
    
    add_body_p(doc, "FastAPI was chosen over Django and Flask because its native async/await capabilities allow non-blocking database queries via SQLAlchemy 2.0 and asyncpg, enabling thousands of concurrent requests with low memory footprints. FastAPI automatically generates OpenAPI/Swagger schemas directly from Pydantic models, dramatically reducing frontend-backend communication errors.", bold_prefix="ADR 1: FastAPI Async Monolith vs Django/Flask: ")
    
    add_body_p(doc, "While NoSQL databases (like MongoDB) offer flexible schemas, KNOTS requires strict relational integrity across foreign keys (e.g. applications referencing job postings and users, RSVPs referencing events and attendees, department controller keys tied to users). PostgreSQL provides full ACID guarantees, powerful JOIN performance, composite indexes, and native JSONB columns for polymorphic attributes such as categorized skills, projects, and certifications.", bold_prefix="ADR 2: Relational PostgreSQL vs Document NoSQL: ")

    add_body_p(doc, "Third-party services introduce subscription costs, network latency, and vendor lock-in. KNOTS implements a native FastAPI WebSocket endpoint (/api/v1/ws/chat) managed by an in-memory ConnectionManager with heartbeat ping/pong, presence tracking, typing indicators, and instant database message persistence.", bold_prefix="ADR 3: Native WebSockets vs Third-Party Chat SaaS: ")

    add_body_p(doc, "External LLM APIs can be subject to rate-limiting, network latency, and operational costs. KNOTS implements a high-performance local deterministic rule-based engine for resume parsing and roadmaps, with optional zero-shot enhancement via Gemini 2.5 Flash when API keys are available, ensuring 100% platform availability even in offline or air-gapped lab environments.", bold_prefix="ADR 4: Hybrid Deterministic & Generative AI Architecture: ")

    doc.add_page_break()

    # =========================================================================
    # SECTION 3: ALGORITHMS, MATHEMATICAL LOGIC & FORMULAS
    # =========================================================================
    add_heading_1(doc, "3. Algorithms, Mathematical Logic & Business Rules")
    add_body_p(doc, "KNOTS incorporates specialized algorithmic logic across multiple modules to deliver personalized intelligence, platform moderation, and automated scoring.")

    # Algorithm 1: ATS Resume Scoring
    add_heading_2(doc, "3.1 Algorithm 1: Deterministic ATS Resume Scoring Engine")
    add_body_p(doc, "Location: backend/app/ai/services/resume_analyzer_service.py -> LocalResumeAnalyzerService")
    add_body_p(doc, "The resume analysis engine performs deep heuristic inspection of candidate resume text, scoring four core dimensions out of 100 before computing a composite ATS compatibility score:")
    
    add_bullet(doc, "Validates contact information (Email regex, 10-digit/E.164 Phone regex, LinkedIn URL, GitHub/GitLab/Portfolio URL). Score: Up to 40 points for contact + up to 60 points for essential headings (Experience, Education, Projects, Skills, Certifications).", "1. ATS Compatibility Dimension (Weight: 35%): ")
    add_bullet(doc, "Scans all bullet points for quantifiable metrics (percentages, dollar/rupee amounts, multipliers like 2x/10x, raw performance counts). Formula: min(metric_count * 15, 100). Penalizes weak passive phrases ('worked on', 'assisted in', 'handled', 'tried to') by -4 points per occurrence.", "2. Impact & Quantification Dimension (Weight: 25%): ")
    add_bullet(doc, "Matches resume content against a curated taxonomy of 150+ technical skills categorized into 7 domains: Frontend, Backend & APIs, Databases & Storage, DevOps & Cloud, AI/ML & Data, Core CS & Languages, and Methodologies/Tools. Formula: min(detected_skill_count * 8, 100).", "3. Tech Stack Depth Dimension (Weight: 25%): ")
    add_bullet(doc, "Evaluates text density, bullet count (ideal: 8-30 bullets), section sequence, and overall readability. Formula: min(bullet_count * 4 + length_score, 100).", "4. Overall Structure Dimension (Weight: 15%): ")

    add_body_p(doc, "Composite Score Formula:", bold_prefix="Mathematical Composite Formula: ")
    add_code_block(doc, "Composite_Score = (ATS_Compatibility * 0.35) + (Impact_Metrics * 0.25) + (Tech_Stack_Depth * 0.25) + (Overall_Structure * 0.15)\n\nRating Bands:\n- Score >= 85: 'Excellent' (Green)\n- 70 <= Score < 85: 'Competitive' (Indigo)\n- 50 <= Score < 70: 'Needs Optimization' (Amber)\n- Score < 50: 'Needs Attention' (Rose)")

    add_body_p(doc, "When Gemini 2.5 Flash is active, the engine executes a structured prompt generating 3 bullet rewrites following the Google/Amazon STAR method (Situation, Task, Action, Result), outputting guaranteed Pydantic-validated JSON.")

    # Algorithm 2: Career Roadmap Generator
    add_heading_2(doc, "3.2 Algorithm 2: Dynamic Career Roadmap & Skill Gap Engine")
    add_body_p(doc, "Location: backend/app/ai/services/career_roadmap_service.py -> LocalCareerRoadmapService")
    add_body_p(doc, "Generates targeted milestone-driven roadmaps based on candidate current skills versus industry target role requirements:")
    add_bullet(doc, "Evaluates candidate skill set against required skills for 6 core tracks (Full Stack Web Developer, AI/Machine Learning Engineer, Cloud & DevOps Engineer, Mobile Application Developer, Data Analyst/Engineer, Cybersecurity Specialist).", "1. Set Intersection & Readiness Score: ")
    add_code_block(doc, "Readiness_Percentage = round((len(matching_skills) / len(target_role_required_skills)) * 100)")
    add_bullet(doc, "Generates a 3-phase curriculum: Phase 1 (Core Foundations), Phase 2 (Advanced Architecture & Frameworks), Phase 3 (Production-Grade Capstone Project & System Design Interview Prep).", "2. Phase Scheduling: ")

    # Algorithm 3: Peer Connection Suggestion
    add_heading_2(doc, "3.3 Algorithm 3: AI Peer & Mentor Connection Matcher")
    add_body_p(doc, "Location: backend/app/ai/services/ai.py -> AIConnectionSuggestionService.get_connection_suggestions()")
    add_body_p(doc, "Computes mutual affinity scores between the authenticated user and all active campus peers, excluding existing connections, pending requests, and administrators:")
    add_code_block(doc, "Match_Score = Base_Score (40)\n            + Department_Match_Bonus (30 if user_dept == candidate_dept else 0)\n            + Common_Skill_Bonus (min(len(common_skills) * 10, 30))\n            + Graduation_Proximity_Bonus (10 if diff == 0 else (5 if diff == 1 else 0))\n\nMatch_Score = min(Match_Score, 98)")

    # Algorithm 4: Job Recommendation Matcher
    add_heading_2(doc, "3.4 Algorithm 4: AI Job & Internship Recommendation Engine")
    add_body_p(doc, "Location: backend/app/ai/services/ai.py -> AIJobRecommendationService.get_job_recommendations()")
    add_body_p(doc, "Matches active open job postings against the user's profile skills and department, filtering out jobs already applied for:")
    add_code_block(doc, "Match_Score = Base_Score (40)\n            + Skill_Match_Points (min(len(matching_skills) * 15, 45))\n            + Department_Domain_Relevance (15 if user_dept in job_title_or_desc else 0)\n\nMatch_Score = min(Match_Score, 98)")

    # Algorithm 5: Feed Content Recommendation
    add_heading_2(doc, "3.5 Algorithm 5: AI Feed Personalization & Content Recommendation")
    add_body_p(doc, "Location: backend/app/ai/services/ai.py -> AIContentRecommendationService.get_content_recommendations()")
    add_body_p(doc, "Extracts interest vectors from candidate profile skills and department, scoring public feed posts by topical overlap and community engagement:")
    add_code_block(doc, "Relevance_Score = Base_Score (35)\n                + Topic_Match_Points (min(len(matched_topics) * 20, 40))\n                + Community_Engagement_Bonus (15 if likes + comments >= 3 else (5 if > 0 else 0))\n\nRelevance_Score = min(Relevance_Score, 98)")

    # Algorithm 6: Trending Posts Formula
    add_heading_2(doc, "3.6 Algorithm 6: Platform Trending Posts Weighted Engagement Algorithm")
    add_body_p(doc, "Location: backend/app/analytics/repository/analytics.py -> get_trending_posts()")
    add_body_p(doc, "Ranks top posts created within a rolling time window (default: 7 days) using a weighted engagement formula prioritizing comments and likes over raw impressions:")
    add_code_block(doc, "Weighted_Engagement_Score = (Likes * 2) + (Comments * 5) + (Views * 1)\n\nFallback: If no posts are created in the rolling window, the window expands to all-time posts to guarantee zero empty states.")

    # Algorithm 7: Cryptographic Controller Key Verification
    add_heading_2(doc, "3.7 Algorithm 7: Cryptographic Controller Verification & Master Admin Activation")
    add_body_p(doc, "Location: backend/app/admin/services/controller_invite.py & backend/app/auth/services/auth.py")
    add_body_p(doc, "To prevent unauthorized departmental elevation, Department Controllers must supply high-entropy cryptographic keys matching the departmental pattern during registration:")
    add_code_block(doc, "Key Format: SBJIT-CTRL-<DEPT_CODE>-<BLOCK1>-<BLOCK2>-<BLOCK3>-<BLOCK4>\nExample:    SBJIT-CTRL-CSE-8F3A-7E2D-9B4C-1A05\nMaster Key: SBJIT-SUPER-ADMIN-9X8K-4M2P-7Q1W-5V3Z-9842\n\nVerification Workflow:\n1. Incoming registration payload checks role == 'Controller'.\n2. Looks up active unused invite key in controller_invites table or master department key list.\n3. Checks expiration date and is_used boolean flag.\n4. If valid, binds user_id, sets is_used = True, updates user.role_id, and writes to audit_logs.")

    # Algorithm 8: Real-Time Presence & Read Receipt Engine
    add_heading_2(doc, "3.8 Algorithm 8: WebSocket Real-Time Presence & Duplex Messaging Protocol")
    add_body_p(doc, "Location: backend/app/messaging/websocket_manager.py & backend/app/messaging/routers/websocket.py")
    add_body_p(doc, "Maintains concurrent active WebSocket connections using an asynchronous manager:")
    add_bullet(doc, "Active connections stored in active_connections: dict[int, set[WebSocket]], allowing multiple devices/tabs per user.", "Connection Registry: ")
    add_bullet(doc, "Handles heartbeat ping frames ({'type': 'ping'}) returning {'type': 'pong'} to prevent reverse-proxy timeouts.", "Heartbeat Keep-Alive: ")
    add_bullet(doc, "Broadcasts typing start/stop events directly to participants of active conversation threads.", "Typing Indicators: ")
    add_bullet(doc, "Marks incoming message IDs as read in read_receipts table and transmits receipt confirmations to sender.", "Read Receipts: ")

    doc.add_page_break()

    # =========================================================================
    # SECTION 4: SYSTEM ARCHITECTURE & DATA FLOW
    # =========================================================================
    add_heading_1(doc, "4. System Architecture & Data Flow")
    add_body_p(doc, "KNOTS adheres to the clean Domain-Driven Modular Layered Monolith pattern, ensuring strict separation of concerns, high testability, and isolated failure domains.")

    add_heading_2(doc, "4.1 Monolithic Modular Architecture & Tiered Layers")
    add_body_p(doc, "The backend is structured into five distinct operational tiers:")
    add_bullet(doc, "Exposes REST endpoints, validates HTTP query parameters, path variables, and request payloads using Pydantic schemas. Performs zero direct database operations.", "1. Presentation / Router Layer (app/*/routers/): ")
    add_bullet(doc, "Injects current user authentication (get_current_user), RBAC role validation (RoleRequired), database session generators (get_db), and rate limiters.", "2. Dependency & Security Layer (app/auth/dependencies/): ")
    add_bullet(doc, "Coordinates domain workflows, executes business algorithms, verifies state machines (e.g., job application status transitions), and triggers audit logs.", "3. Service Layer (app/*/services/): ")
    add_bullet(doc, "Encapsulates all SQLAlchemy 2.0 select, insert, update, and delete queries. Abstracts database details from the service layer.", "4. Repository Layer (app/*/repository/): ")
    add_bullet(doc, "Defines database table structures, foreign key constraints, composite indexes, and SQLAlchemy relationships.", "5. Data Persistence Layer (app/*/models/): ")

    add_heading_2(doc, "4.2 Request-Response Lifecycle Flow")
    add_code_block(doc, "Client (Browser/Vite React) \n       |  (1) Axios Request with 'Authorization: Bearer <JWT>'\n       v\nUvicorn ASGI Server (Port 8000)\n       |\n       +--> CORS Middleware (Origin Validation, Allowed Headers)\n       +--> Request Profiling Middleware (Process Time Header X-Process-Time)\n       +--> Audit Log Middleware (Intercepts modifying operations)\n       |\n       v\nFastAPI v1_router Dispatcher (/api/v1/...)\n       |\n       v\nDependency Injection Container:\n  [get_db] -> Generates AsyncSession from connection pool\n  [get_current_user] -> Decodes JWT, validates signature, retrieves User\n  [RoleRequired(['HOD', 'Admin'])] -> Validates role permissions\n       |\n       v\nDomain Router Handler (e.g. get_department_stats)\n       |\n       v\nDomain Service (Business rules, validations, algorithms)\n       |\n       v\nDomain Repository (SQLAlchemy ORM async query)\n       |\n       v\nPostgreSQL 16 Database Engine\n       |\n       v (Returns ORM Models)\nRepository -> Service -> Router -> Pydantic Response Serialization\n       |\n       v\nStandardized APIResponse JSON Envelope returned to Client:\n{\n  \"success\": true,\n  \"message\": \"Operation completed successfully\",\n  \"data\": { ... },\n  \"errors\": null\n}")

    add_heading_2(doc, "4.3 Standardized Error Envelope Standard")
    add_body_p(doc, "All error responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error, 500 Server Error) conform to the exact same envelope structure, ensuring predictable error handling across the frontend:")
    add_code_block(doc, "{\n  \"success\": false,\n  \"message\": \"Detailed human-readable error description\",\n  \"data\": null,\n  \"errors\": [\n    {\n      \"field\": \"email\",\n      \"message\": \"Email must belong to the @sbjit.edu.in institutional domain\"\n    }\n  ]\n}")

    doc.add_page_break()

    # =========================================================================
    # SECTION 5: COMPLETE DATABASE SCHEMA (ALL 29 MODELS)
    # =========================================================================
    add_heading_1(doc, "5. Complete Database Schema (All 29 Models)")
    add_body_p(doc, "All database tables, fields, constraints, and relationships are declared in SQLAlchemy 2.0 and registered in app/core/base.py for Alembic tracking.")

    models_info = [
        ("roles", "Defines RBAC permission tiers.", [
            ("id", "Integer, PK, Autoincrement", "Unique Role ID"),
            ("name", "String(50), Unique, Indexed", "Role name: Student, Alumni, Faculty, HOD, TPO, Controller, Admin"),
            ("permissions", "JSON, Nullable", "Array of permitted string scopes: ['read_posts', 'create_job']")
        ]),
        ("users", "Central authentication identity table.", [
            ("id", "Integer, PK, Autoincrement", "Unique User ID"),
            ("email", "String(255), Unique, Indexed", "College email address (@sbjit.edu.in)"),
            ("hashed_password", "String(255), Not Null", "Bcrypt hashed credential string"),
            ("role_id", "Integer, FK(roles.id), Indexed", "Foreign key to assigned user role"),
            ("is_active", "Boolean, Default True", "Account active/suspended status flag"),
            ("is_verified", "Boolean, Default False", "Email OTP verification completion flag"),
            ("created_at / updated_at", "DateTime, UTC", "Auditing timestamps")
        ]),
        ("profiles", "Detailed professional and academic user attributes.", [
            ("id", "Integer, PK, Autoincrement", "Profile ID"),
            ("user_id", "Integer, FK(users.id), Unique", "Foreign key to user account (1-to-1)"),
            ("first_name / last_name", "String(100), Nullable", "User legal first and last name"),
            ("bio", "Text, Nullable", "Personal bio or career headline"),
            ("graduation_year", "Integer, Indexed", "Expected or actual graduation year"),
            ("department", "String(100), Indexed", "Department: CSE, AIML, AIDS, IT, ETC, EE, ME, BCA, MCA, MBA"),
            ("designation / degree / experience", "String(100), Nullable", "Professional titles and academic qualifications"),
            ("skills", "JSONB, Nullable", "Polymorphic array or categorized dictionary of skills"),
            ("profile_picture", "String(255), Nullable", "Relative URL path to stored avatar image"),
            ("certifications / projects", "JSONB, Nullable", "Structured lists of credentials and projects"),
            ("github / leetcode / linkedin_url", "String(255), Nullable", "External profile hyperlinks"),
            ("tenth / twelfth_diploma_percentage", "Float, Nullable", "Academic cutoff metrics for TPO placement eligibility")
        ]),
        ("posts", "Campus social feed posts.", [
            ("id", "Integer, PK, Autoincrement", "Post ID"),
            ("author_id", "Integer, FK(users.id), Indexed", "User ID of author"),
            ("content", "Text, Not Null", "Post body text"),
            ("image_url", "String(255), Nullable", "Attached post media image URL"),
            ("visibility", "Enum(PUBLIC, CONNECTIONS, CLUB)", "Audience visibility scope"),
            ("created_at / updated_at", "DateTime, UTC", "Post creation and modification timestamps")
        ]),
        ("comments", "Discussion comments on feed posts.", [
            ("id", "Integer, PK, Autoincrement", "Comment ID"),
            ("post_id", "Integer, FK(posts.id), Indexed", "Target post ID"),
            ("author_id", "Integer, FK(users.id), Indexed", "Author user ID"),
            ("content", "Text, Not Null", "Comment text body"),
            ("created_at", "DateTime, UTC", "Comment timestamp")
        ]),
        ("likes", "Post engagement likes.", [
            ("id", "Integer, PK, Autoincrement", "Like ID"),
            ("post_id", "Integer, FK(posts.id), Indexed", "Target post ID"),
            ("user_id", "Integer, FK(users.id), Indexed", "Liking user ID (Unique constraint on (post_id, user_id))")
        ]),
        ("connections", "Bidirectional student & alumni networking.", [
            ("id", "Integer, PK, Autoincrement", "Connection ID"),
            ("requester_id", "Integer, FK(users.id), Indexed", "User initiating the connection"),
            ("addressee_id", "Integer, FK(users.id), Indexed", "Target user receiving the connection"),
            ("status", "Enum(PENDING, ACCEPTED, REJECTED)", "State of the connection request"),
            ("created_at / updated_at", "DateTime, UTC", "Request timestamps")
        ]),
        ("conversations", "Chat conversation channels.", [
            ("id", "Integer, PK, Autoincrement", "Conversation ID"),
            ("is_group", "Boolean, Default False", "Flag indicating direct 1-to-1 vs group channel"),
            ("title", "String(100), Nullable", "Channel title (for group chats/clubs)"),
            ("created_at / updated_at", "DateTime, UTC", "Channel lifecycle timestamps")
        ]),
        ("conversation_participants", "Participant mapping table for chat.", [
            ("id", "Integer, PK, Autoincrement", "Record ID"),
            ("conversation_id", "Integer, FK(conversations.id)", "Channel reference"),
            ("user_id", "Integer, FK(users.id), Indexed", "Participant user reference")
        ]),
        ("messages", "Real-time chat messages.", [
            ("id", "Integer, PK, Autoincrement", "Message ID"),
            ("conversation_id", "Integer, FK(conversations.id)", "Conversation reference"),
            ("sender_id", "Integer, FK(users.id), Indexed", "Message author"),
            ("content", "Text, Not Null", "Message text content"),
            ("attachment_url", "String(255), Nullable", "Optional image or document attachment URL"),
            ("created_at", "DateTime, UTC", "Message transmission timestamp")
        ]),
        ("read_receipts", "Message delivery & read tracking.", [
            ("id", "Integer, PK, Autoincrement", "Receipt ID"),
            ("message_id", "Integer, FK(messages.id)", "Message reference"),
            ("user_id", "Integer, FK(users.id)", "Recipient who read the message"),
            ("read_at", "DateTime, UTC", "Timestamp when read")
        ]),
        ("companies", "Corporate recruiter directory.", [
            ("id", "Integer, PK, Autoincrement", "Company ID"),
            ("name", "String(150), Unique, Indexed", "Company legal name"),
            ("website / logo_url", "String(255), Nullable", "Corporate website and logo"),
            ("description", "Text, Nullable", "Company profile and industry overview")
        ]),
        ("job_postings", "Campus job and internship opportunities.", [
            ("id", "Integer, PK, Autoincrement", "Job ID"),
            ("company_id", "Integer, FK(companies.id)", "Hiring company"),
            ("posted_by_id", "Integer, FK(users.id)", "TPO or Alumni who created posting"),
            ("title", "String(150), Indexed", "Job title (e.g. Graduate Software Engineer)"),
            ("description", "Text, Not Null", "Role responsibilities and qualifications"),
            ("job_type", "Enum(FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT)", "Employment classification"),
            ("workplace_type", "Enum(ON_SITE, HYBRID, REMOTE)", "Work location model"),
            ("location", "String(100), Nullable", "Office city / campus drive location"),
            ("salary_range", "String(50), Nullable", "Compensation package (e.g. 6-8 LPA)"),
            ("required_skills", "JSONB, Nullable", "Array of mandatory skills"),
            ("status", "Enum(OPEN, CLOSED, ARCHIVED)", "Posting availability flag"),
            ("created_at / deadline", "DateTime, UTC", "Posting date and application deadline")
        ]),
        ("applications", "Candidate job applications.", [
            ("id", "Integer, PK, Autoincrement", "Application ID"),
            ("job_posting_id", "Integer, FK(job_postings.id)", "Target job posting"),
            ("applicant_id", "Integer, FK(users.id), Indexed", "Applying student"),
            ("status", "Enum(PENDING, REVIEWING, INTERVIEWING, OFFERED, REJECTED)", "Application lifecycle state"),
            ("resume_url", "String(255), Nullable", "Submitted resume PDF URL"),
            ("cover_letter", "Text, Nullable", "Candidate statement of purpose"),
            ("created_at / updated_at", "DateTime, UTC", "Application timestamps")
        ]),
        ("referrals", "Alumni job referral requests.", [
            ("id", "Integer, PK, Autoincrement", "Referral ID"),
            ("job_posting_id", "Integer, FK(job_postings.id)", "Job posting reference"),
            ("referrer_id", "Integer, FK(users.id)", "Alumni submitting referral"),
            ("candidate_name / candidate_email", "String, Not Null", "Referred student details"),
            ("notes", "Text, Nullable", "Recommendation comments")
        ]),
        ("events", "Campus events and conferences.", [
            ("id", "Integer, PK, Autoincrement", "Event ID"),
            ("title", "String(150), Indexed", "Event title"),
            ("description", "Text, Not Null", "Event agenda and details"),
            ("location", "String(150), Nullable", "Campus venue or online meeting link"),
            ("start_time / end_time", "DateTime, UTC", "Event schedule"),
            ("organizer_id", "Integer, FK(users.id)", "Organizing Club Head or Faculty"),
            ("category_id", "Integer, FK(event_categories.id)", "Category (Technical, Cultural, Sports, Workshop)"),
            ("event_leads", "JSONB, Nullable", "List of assigned student event coordinators"),
            ("requires_approval", "Boolean, Default False", "Flag requiring coordinator approval for RSVPs")
        ]),
        ("rsvps", "Student event registrations.", [
            ("id", "Integer, PK, Autoincrement", "RSVP ID"),
            ("event_id", "Integer, FK(events.id), Indexed", "Target event reference"),
            ("user_id", "Integer, FK(users.id), Indexed", "Registered student user"),
            ("status", "Enum(GOING, INTERESTED, NOT_GOING, PENDING)", "Registration status"),
            ("created_at", "DateTime, UTC", "Registration timestamp")
        ]),
        ("clubs", "Student organizations and societies.", [
            ("id", "Integer, PK, Autoincrement", "Club ID"),
            ("name", "String(100), Unique, Indexed", "Club name (e.g. Coding Club, Robotics Club)"),
            ("description", "Text, Nullable", "Club mission and activities"),
            ("lead_id", "Integer, FK(users.id)", "Designated student President / Lead"),
            ("department", "String(100), Nullable", "Departmental affiliation"),
            ("conversation_id", "Integer, FK(conversations.id), Nullable", "Dedicated group chat conversation ID")
        ]),
        ("club_members", "Club membership directory.", [
            ("id", "Integer, PK, Autoincrement", "Membership ID"),
            ("club_id", "Integer, FK(clubs.id)", "Club reference"),
            ("user_id", "Integer, FK(users.id)", "Member user reference"),
            ("role", "String(50), Default 'Member'", "Club role: President, Vice-President, Coordinator, Member"),
            ("joined_at", "DateTime, UTC", "Join timestamp")
        ]),
        ("notifications", "In-app alerts and notifications.", [
            ("id", "Integer, PK, Autoincrement", "Notification ID"),
            ("user_id", "Integer, FK(users.id), Indexed", "Recipient user"),
            ("type", "String(50), Indexed", "Notification category: connection_request, job_alert, event_reminder, chat"),
            ("title / content", "String / Text", "Notification headline and payload"),
            ("is_read", "Boolean, Default False", "Read status flag"),
            ("created_at", "DateTime, UTC", "Creation timestamp")
        ]),
        ("audit_logs", "Immutable system audit trail.", [
            ("id", "Integer, PK, Autoincrement", "Audit Log ID"),
            ("actor_id", "Integer, FK(users.id), Indexed", "Admin or Controller performing the action"),
            ("action", "String(100), Indexed", "Action name: BAN_USER, REMOVE_POST, GENERATE_INVITE"),
            ("target_type / target_id", "String / Integer", "Entity affected (e.g. User #42, Post #108)"),
            ("ip_address", "String(50), Nullable", "Client IP address for forensic accountability"),
            ("created_at", "DateTime, UTC", "Timestamp of action")
        ]),
        ("controller_invites", "One-time Controller Activation Codes.", [
            ("id", "Integer, PK, Autoincrement", "Invite ID"),
            ("code", "String(100), Unique, Indexed", "High-entropy cryptographic activation token"),
            ("department", "String(100), Indexed", "Department scope: CSE, AIML, etc."),
            ("created_by_id", "Integer, FK(users.id)", "Admin who created the key"),
            ("is_used", "Boolean, Default False", "Single-use redemption flag"),
            ("used_by_id", "Integer, FK(users.id), Nullable", "Controller user who redeemed code"),
            ("expires_at", "DateTime, UTC", "Code expiration deadline")
        ]),
        ("flagged_posts", "Community moderation queue.", [
            ("id", "Integer, PK, Autoincrement", "Flag ID"),
            ("post_id", "Integer, FK(posts.id), Indexed", "Reported post"),
            ("reporter_id", "Integer, FK(users.id)", "User reporting content"),
            ("reason", "String(255), Not Null", "Violation reason: Spam, Harassment, Inappropriate"),
            ("status", "Enum(PENDING, RESOLVED, DISMISSED)", "Moderation state"),
            ("created_at", "DateTime, UTC", "Flag creation timestamp")
        ]),
        ("profile_views", "Profile view analytics history.", [
            ("id", "Integer, PK, Autoincrement", "Record ID"),
            ("profile_id", "Integer, FK(profiles.id), Indexed", "Viewed profile"),
            ("viewer_id", "Integer, FK(users.id), Nullable", "Viewer user ID (if authenticated)"),
            ("created_at", "DateTime, UTC, Indexed", "View timestamp for time-series grouping")
        ]),
        ("post_engagements", "Granular post interaction metrics.", [
            ("id", "Integer, PK, Autoincrement", "Record ID"),
            ("post_id", "Integer, FK(posts.id), Indexed", "Interacted post"),
            ("user_id", "Integer, FK(users.id), Nullable", "Interacting user"),
            ("engagement_type", "String(50)", "Type: 'view', 'share', 'bookmark'"),
            ("created_at", "DateTime, UTC", "Interaction timestamp")
        ]),
        ("skill_endorsements", "Peer skill validation network.", [
            ("id", "Integer, PK, Autoincrement", "Endorsement ID"),
            ("profile_id", "Integer, FK(profiles.id), Indexed", "Profile receiving endorsement"),
            ("endorser_id", "Integer, FK(users.id), Indexed", "Peer endorsing the skill"),
            ("skill_name", "String(100), Indexed", "Endorsed skill name (e.g. 'React.js')"),
            ("created_at", "DateTime, UTC", "Timestamp")
        ])
    ]

    for tbl_name, tbl_desc, cols in models_info:
        add_heading_2(doc, f"5.{models_info.index((tbl_name, tbl_desc, cols)) + 1} Table: {tbl_name}")
        add_body_p(doc, tbl_desc)
        
        t = doc.add_table(rows=len(cols) + 1, cols=3)
        t_w = [Inches(2.0), Inches(2.3), Inches(2.2)]
        format_table(t, t_w)
        
        t.rows[0].cells[0].paragraphs[0].text = "Column Name"
        t.rows[0].cells[1].paragraphs[0].text = "Data Type & Constraints"
        t.rows[0].cells[2].paragraphs[0].text = "Description & Purpose"
        
        for r_i, (c_name, c_type, c_desc) in enumerate(cols, start=1):
            row = t.rows[r_i]
            row.cells[0].paragraphs[0].text = c_name
            row.cells[1].paragraphs[0].text = c_type
            row.cells[2].paragraphs[0].text = c_desc
        format_table(t, t_w)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    doc.add_page_break()

    # =========================================================================
    # SECTION 6: MASTER API REFERENCE CATALOG
    # =========================================================================
    add_heading_1(doc, "6. Master API Reference Catalog")
    add_body_p(doc, "All routes are mounted under the /api/v1 prefix and return the standardized APIResponse envelope. Interactive documentation is accessible via Swagger UI (/docs) and ReDoc (/redoc).")

    api_modules = [
        ("Authentication API", "backend/app/auth/routers/auth.py", [
            ("POST", "/auth/register", "Register new student/faculty with college email & password", "Public"),
            ("POST", "/auth/login", "Authenticate user and return JWT access & refresh token pair", "Public"),
            ("POST", "/auth/send-otp", "Send 6-digit email verification OTP to institutional email", "Public"),
            ("POST", "/auth/login-otp", "Authenticate directly via 6-digit email OTP", "Public"),
            ("POST", "/auth/google", "Verify Google OAuth token and authenticate account", "Public"),
            ("POST", "/auth/refresh", "Rotate and exchange refresh token for a new access token", "Public"),
            ("POST", "/auth/logout", "Revoke user tokens and terminate active session", "Authenticated"),
            ("POST", "/auth/reset-password", "Reset forgotten password using verified OTP", "Public"),
            ("GET", "/auth/verify-email", "Validate email verification status", "Public")
        ]),
        ("User Account Management API", "backend/app/users/routers/user.py", [
            ("GET", "/users/me", "Retrieve authenticated user's credentials and role", "Authenticated"),
            ("DELETE", "/users/me", "Permanently delete current user account", "Authenticated"),
            ("POST", "/users/me/change-password", "Update user password with old password verification", "Authenticated"),
            ("GET", "/users", "List users with role and department filtering", "Admin / HOD"),
            ("GET", "/users/roles", "List all available institutional roles in system", "Authenticated"),
            ("GET", "/users/{id}", "Retrieve public user record by user ID", "Authenticated"),
            ("PATCH", "/users/{id}", "Update user account status (active/suspended)", "Admin"),
            ("DELETE", "/users/{id}", "Delete user account as Administrator", "Admin"),
            ("PUT", "/users/{id}/role", "Assign new role to user (e.g. elevate to Controller)", "Admin")
        ]),
        ("Profiles & Resume API", "backend/app/profiles/routers/profile.py", [
            ("GET", "/profiles/me", "Retrieve current user's profile, education, and experience", "Authenticated"),
            ("PUT", "/profiles/me", "Update profile details (name, bio, skills, socials, marks)", "Authenticated"),
            ("POST", "/profiles/me/picture", "Upload profile picture avatar image", "Authenticated"),
            ("POST", "/profiles/me/certificate", "Upload student achievement certificate PDF/Image", "Authenticated"),
            ("GET", "/profiles/me/resume/download", "Generate and download ATS-formatted student resume PDF", "Authenticated"),
            ("POST", "/profiles/me/education", "Add academic history record", "Authenticated"),
            ("PUT", "/profiles/me/education/{id}", "Update existing education record", "Authenticated"),
            ("DELETE", "/profiles/me/education/{id}", "Delete education record", "Authenticated"),
            ("POST", "/profiles/me/experience", "Add work or internship experience record", "Authenticated"),
            ("PUT", "/profiles/me/experience/{id}", "Update work experience record", "Authenticated"),
            ("DELETE", "/profiles/me/experience/{id}", "Delete work experience record", "Authenticated"),
            ("GET", "/profiles/{user_id}", "Retrieve peer or alumni profile by ID", "Authenticated"),
            ("POST", "/profiles/{user_id}/skills/{skill}/endorse", "Endorse a peer's technical skill", "Authenticated"),
            ("DELETE", "/profiles/{user_id}/skills/{skill}/endorse", "Remove skill endorsement", "Authenticated")
        ]),
        ("Social Feed & Engagement API", "backend/app/posts/routers/post.py", [
            ("GET", "/posts/feed", "Retrieve paginated campus social feed with cursor/skip", "Authenticated"),
            ("POST", "/posts", "Create a new post with text content and optional image", "Authenticated"),
            ("POST", "/posts/upload-image", "Upload image attachment for post", "Authenticated"),
            ("GET", "/posts/user/{user_id}", "Retrieve all posts created by a specific user", "Authenticated"),
            ("GET", "/posts/{post_id}", "Retrieve single post details and thread", "Authenticated"),
            ("PUT", "/posts/{post_id}", "Update post content (author only)", "Authenticated"),
            ("DELETE", "/posts/{post_id}", "Delete post (author or admin)", "Authenticated"),
            ("POST", "/posts/{post_id}/like", "Like a post", "Authenticated"),
            ("DELETE", "/posts/{post_id}/like", "Unlike a post", "Authenticated"),
            ("GET", "/posts/{post_id}/comments", "List comments on post thread", "Authenticated"),
            ("POST", "/posts/{post_id}/comments", "Add comment to post thread", "Authenticated"),
            ("DELETE", "/posts/{post_id}/comments/{comment_id}", "Delete comment", "Authenticated"),
            ("POST", "/posts/{post_id}/flag", "Report inappropriate post to moderation queue", "Authenticated")
        ]),
        ("Peer Networking & Connections API", "backend/app/connections/routers/connection.py", [
            ("GET", "/connections/me", "List all accepted active connections", "Authenticated"),
            ("GET", "/connections/me/requests", "List incoming pending connection requests", "Authenticated"),
            ("GET", "/connections/me/sent-requests", "List outgoing pending connection requests", "Authenticated"),
            ("POST", "/connections", "Send new connection request to target user", "Authenticated"),
            ("PATCH", "/connections/{id}/accept", "Accept pending connection request", "Authenticated"),
            ("PATCH", "/connections/{id}/reject", "Reject pending connection request", "Authenticated"),
            ("DELETE", "/connections/{id}/withdraw", "Withdraw sent connection request", "Authenticated"),
            ("GET", "/connections/mutual/{user_id}", "List mutual connections between users", "Authenticated")
        ]),
        ("Real-Time Messaging & Chat API", "backend/app/messaging/routers/", [
            ("GET", "/conversations", "List active conversations with last message snippet", "Authenticated"),
            ("POST", "/conversations/direct/{user_id}", "Get or initialize direct 1-to-1 conversation", "Authenticated"),
            ("POST", "/conversations/group", "Create new group conversation channel", "Authenticated"),
            ("GET", "/conversations/{id}/messages", "Retrieve paginated message history", "Authenticated"),
            ("POST", "/conversations/{id}/read", "Mark all messages in conversation as read", "Authenticated"),
            ("POST", "/messages/direct", "Send direct message via REST fallback", "Authenticated"),
            ("POST", "/messages/upload", "Upload chat attachment (image/document)", "Authenticated"),
            ("GET", "/messages/unread/count", "Get unread message badge count", "Authenticated"),
            ("WS", "/ws/chat?token=<jwt>", "WebSocket duplex connection for real-time chat & typing", "Authenticated")
        ]),
        ("Jobs, Placements & Referrals API", "backend/app/jobs/routers/job.py", [
            ("GET", "/jobs", "Search and filter job and internship postings", "Authenticated"),
            ("POST", "/jobs", "Create new job posting with skill requirements", "TPO / Controller"),
            ("GET", "/jobs/{id}", "Get detailed job description and company info", "Authenticated"),
            ("PUT", "/jobs/{id}", "Update job posting details or deadline", "TPO / Controller"),
            ("DELETE", "/jobs/{id}", "Archive or delete job posting", "TPO / Admin"),
            ("POST", "/jobs/{id}/apply", "Submit job application with cover letter & resume", "Student"),
            ("GET", "/jobs/{id}/applications", "View all student applicants for a job", "TPO / Admin"),
            ("GET", "/jobs/applications/me", "List user's submitted job applications", "Student"),
            ("PATCH", "/jobs/applications/{id}", "Update candidate status (REVIEWING, OFFERED, etc.)", "TPO / Admin"),
            ("GET", "/jobs/companies", "List all partner hiring companies", "Authenticated"),
            ("POST", "/jobs/companies", "Register new partner hiring company", "TPO / Admin"),
            ("GET", "/jobs/referrals", "List alumni job referrals", "Authenticated"),
            ("POST", "/jobs/referrals", "Submit job referral for junior students", "Alumni / Faculty")
        ]),
        ("Campus Events & RSVPs API", "backend/app/events/routers/event.py", [
            ("GET", "/events", "List upcoming and past campus events with filters", "Authenticated"),
            ("POST", "/events", "Create new campus event with categories and leads", "Controller / Faculty / Club"),
            ("GET", "/events/categories", "List all event categories (Technical, Cultural, etc.)", "Authenticated"),
            ("GET", "/events/upcoming", "Retrieve top upcoming events", "Authenticated"),
            ("GET", "/events/{id}", "Get event details, agenda, venue, and leads", "Authenticated"),
            ("PUT", "/events/{id}", "Update event details", "Organizer / Controller"),
            ("DELETE", "/events/{id}", "Cancel and remove event", "Organizer / Admin"),
            ("POST", "/events/{id}/rsvp", "Submit RSVP (GOING, INTERESTED, NOT_GOING)", "Authenticated"),
            ("DELETE", "/events/{id}/rsvp", "Cancel event RSVP", "Authenticated"),
            ("GET", "/events/{id}/rsvps", "List all RSVPs and attendees for event", "Organizer / Controller"),
            ("PUT", "/events/{id}/rsvps/{user_id}/status", "Approve or reject RSVP registration", "Organizer / Controller")
        ]),
        ("Clubs & Organizations API", "backend/app/clubs/routers/club.py", [
            ("GET", "/clubs", "List all student clubs and societies", "Authenticated"),
            ("POST", "/clubs", "Register new student club and initialize group chat", "Controller / Admin"),
            ("GET", "/clubs/{id}", "Get club overview, executive committee, and members", "Authenticated"),
            ("PUT", "/clubs/{id}", "Update club details and mission statement", "Club Lead / Controller"),
            ("DELETE", "/clubs/{id}", "Disband club", "Admin"),
            ("POST", "/clubs/{id}/join", "Join student club as member", "Student"),
            ("POST", "/clubs/{id}/leave", "Leave student club", "Student"),
            ("GET", "/clubs/{id}/members", "List all club members and designated roles", "Authenticated"),
            ("PUT", "/clubs/{id}/members/{user_id}/role", "Promote member to Lead/Coordinator", "Club Lead / Controller")
        ]),
        ("Department & HOD Governance API", "backend/app/department/routers/department.py", [
            ("GET", "/departments/stats", "HOD department statistics (students, faculty, alumni, placement)", "HOD / Controller"),
            ("GET", "/departments/students", "List all department students with CGPA and skills", "HOD / Faculty"),
            ("GET", "/departments/faculty", "List departmental faculty directory and subjects", "HOD / Controller"),
            ("GET", "/departments/alumni", "List department alumni directory with companies", "HOD / Faculty"),
            ("GET", "/departments/achievements", "List student co-curricular achievements for verification", "HOD / Faculty"),
            ("POST", "/departments/achievements/verify", "Approve or reject student achievement certificate", "HOD / Faculty"),
            ("GET", "/departments/management-connect/requests", "List formal requests submitted to management", "HOD / Management"),
            ("POST", "/departments/management-connect/requests", "Submit new request to management (Budget, Labs, Syllabus)", "HOD"),
            ("PATCH", "/departments/management-connect/requests/{id}", "Update management request status (Approved/Rejected)", "Management / Admin"),
            ("GET", "/departments/management-connect/announcements", "List executive institutional announcements", "HOD / Faculty"),
            ("GET", "/departments/reports", "List submitted departmental accreditation reports", "HOD / Admin"),
            ("POST", "/departments/reports/submit", "Submit formal departmental NAAC/NBA report", "HOD"),
            ("GET", "/departments/analytics", "Department analytics: CGPA distribution, placement trends", "HOD / Management")
        ]),
        ("AI Intelligence & Recommendation API", "backend/app/ai/routers/ai.py", [
            ("POST", "/ai/analyze-resume", "Deterministic & STAR ATS resume scoring and rewrite", "Authenticated"),
            ("POST", "/ai/roadmap", "Generate milestone career learning roadmap", "Authenticated"),
            ("GET", "/ai/connection-suggestions", "AI peer & alumni connection suggestions", "Authenticated"),
            ("GET", "/ai/job-recommendations", "AI job & internship match recommendations", "Authenticated"),
            ("GET", "/ai/content-recommendations", "AI feed content recommendations", "Authenticated")
        ]),
        ("Platform Analytics API", "backend/app/analytics/routers/analytics.py", [
            ("GET", "/analytics/stats", "System summary statistics (users, jobs, posts, etc.)", "Public / Auth"),
            ("GET", "/analytics/platform/engagement-summary", "Total engagement counts and rates", "Public / Auth"),
            ("GET", "/analytics/profile/views", "Time-series profile view history for current user", "Authenticated"),
            ("GET", "/analytics/posts/engagement", "Post engagement totals for user's content", "Authenticated"),
            ("GET", "/analytics/trending-posts", "Platform trending posts ranked by engagement formula", "Public / Auth"),
            ("POST", "/analytics/posts/{id}/view", "Record analytical post view event", "Public / Auth"),
            ("POST", "/analytics/profile/{id}/view", "Record analytical profile view event", "Public / Auth"),
            ("GET", "/analytics/reports/export", "Export department & placement analytics to CSV", "HOD / TPO / Admin")
        ]),
        ("Central Administrator & Moderation API", "backend/app/admin/routers/admin.py", [
            ("GET", "/admin/stats", "Comprehensive system metrics for Admin Dashboard", "Admin Only"),
            ("GET", "/admin/audit-logs", "Retrieve immutable system audit logs with actor and IP", "Admin Only"),
            ("GET", "/admin/users", "Paginated user management list with status controls", "Admin Only"),
            ("POST", "/admin/users/{id}/ban", "Ban user account and log action in audit trail", "Admin Only"),
            ("POST", "/admin/users/{id}/unban", "Unban user account", "Admin Only"),
            ("DELETE", "/admin/users/{id}", "Permanently delete user record", "Admin Only"),
            ("GET", "/admin/posts/flagged", "List flagged community posts awaiting moderation", "Admin Only"),
            ("POST", "/admin/posts/{flag_id}/resolve", "Mark flagged post as dismissed or removed", "Admin Only"),
            ("DELETE", "/admin/posts/{id}", "Remove violating post with administrative audit log", "Admin Only"),
            ("POST", "/admin/controller-invites", "Generate high-entropy one-time Controller Activation Code", "Admin Only"),
            ("GET", "/admin/controller-invites", "List all active and redeemed controller codes", "Admin Only"),
            ("DELETE", "/admin/controller-invites/{id}", "Revoke active controller code", "Admin Only")
        ]),
        ("Notifications & Preferences API", "backend/app/notifications/routers/", [
            ("GET", "/notifications", "Retrieve paginated notifications list for user", "Authenticated"),
            ("GET", "/notifications/unread-count", "Get unread alert badge counter", "Authenticated"),
            ("PATCH", "/notifications/{id}/read", "Mark individual notification as read", "Authenticated"),
            ("PATCH", "/notifications/read-all", "Mark all user notifications as read", "Authenticated"),
            ("GET", "/notifications/preferences", "Retrieve notification email/push preferences", "Authenticated"),
            ("PATCH", "/notifications/preferences", "Update notification preference flags", "Authenticated")
        ]),
        ("Global Search API", "backend/app/search/routers/search.py", [
            ("GET", "/search", "Global search across Users, Posts, Jobs, Events, and Clubs", "Authenticated")
        ])
    ]

    for mod_title, mod_file, endpoints in api_modules:
        add_heading_2(doc, mod_title)
        add_body_p(doc, f"Source File: {mod_file}")
        
        t = doc.add_table(rows=len(endpoints) + 1, cols=4)
        t_w = [Inches(1.0), Inches(2.2), Inches(2.3), Inches(1.0)]
        format_table(t, t_w)
        
        t.rows[0].cells[0].paragraphs[0].text = "Method"
        t.rows[0].cells[1].paragraphs[0].text = "Endpoint Path"
        t.rows[0].cells[2].paragraphs[0].text = "Summary / Purpose"
        t.rows[0].cells[3].paragraphs[0].text = "Auth Level"
        
        for r_i, (m, p, desc, auth) in enumerate(endpoints, start=1):
            row = t.rows[r_i]
            row.cells[0].paragraphs[0].text = m
            row.cells[1].paragraphs[0].text = p
            row.cells[2].paragraphs[0].text = desc
            row.cells[3].paragraphs[0].text = auth
        format_table(t, t_w)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    doc.add_page_break()

    # =========================================================================
    # SECTION 7: FRONTEND DEEP-DIVE
    # =========================================================================
    add_heading_1(doc, "7. Frontend Deep-Dive (Architecture, Routing & Pages)")
    add_body_p(doc, "The frontend is a modern Single-Page Application (SPA) built on React 18, Vite, and TypeScript. It features a custom dark-mode design system with glassmorphic cards, dynamic navigation, responsive drawer layouts, and role-based route gating.")

    add_heading_2(doc, "7.1 Frontend Architecture & Routing Security Matrix")
    add_body_p(doc, "Location: frontend/src/routes/AppRoutes.tsx")
    add_body_p(doc, "Frontend routing is protected by five specialized Higher-Order Wrapper Components:")
    add_bullet(doc, "Verifies existence of 'knots_token' in localStorage. If absent, redirects to /landing.", "1. ProtectedRoute: ")
    add_bullet(doc, "Prevents authenticated users from seeing Login or Register pages by redirecting active sessions to /.", "2. PublicOnlyRoute: ")
    add_bullet(doc, "Restricts access to users with role Controller, Admin, Super Admin, Central Admin, or Management.", "3. ControllerRoute: ")
    add_bullet(doc, "Restricts access strictly to Central Admin and Super Admin users.", "4. AdminRoute: ")
    add_bullet(doc, "Whitelists specific allowedRoles (e.g. ['hod', 'controller']) while granting universal access to Admin.", "5. RoleAllowedRoute: ")

    # Route Table
    route_table = doc.add_table(rows=16, cols=3)
    r_w = [Inches(1.8), Inches(2.5), Inches(2.2)]
    format_table(route_table, r_w)
    
    route_table.rows[0].cells[0].paragraphs[0].text = "Path"
    route_table.rows[0].cells[1].paragraphs[0].text = "Page Component"
    route_table.rows[0].cells[2].paragraphs[0].text = "Access Authorization Scope"

    route_data = [
        ("/", "Dashboard.tsx", "All Authenticated Users"),
        ("/feed", "Feed.tsx", "All Authenticated Users"),
        ("/profile & /profile/:id", "Profile.tsx", "All Authenticated Users"),
        ("/connections", "Connections.tsx", "All Authenticated Users"),
        ("/students", "Students.tsx", "Faculty, TPO, Controller, HOD, Admin"),
        ("/department & /departments", "DepartmentPage.tsx", "HOD, Controller, Admin, Super Admin"),
        ("/applications", "ApplicationsPage.tsx", "Controller, TPO, Admin"),
        ("/placements", "PlacementsPage.tsx", "TPO, HOD, Controller, Admin"),
        ("/reports", "ReportsPage.tsx", "HOD, Controller, Admin, Super Admin"),
        ("/management-connect", "ManagementConnectPage.tsx", "HOD, Admin, Super Admin, Management"),
        ("/department-analytics", "DepartmentAnalyticsPage.tsx", "HOD, Controller, Admin, Management"),
        ("/institution", "InstitutionOverview.tsx", "Principal, CEO, Admin"),
        ("/academic-overview", "InstitutionOverview.tsx", "Dean, Admin"),
        ("/jobs", "Jobs.tsx", "Student, Alumni, Controller, TPO, Admin"),
        ("/clubs", "Clubs.tsx", "Student, Controller, Admin, Management")
    ]

    for idx, (p_path, comp, auth_scope) in enumerate(route_data, start=1):
        row = route_table.rows[idx]
        row.cells[0].paragraphs[0].text = p_path
        row.cells[1].paragraphs[0].text = comp
        row.cells[2].paragraphs[0].text = auth_scope
    format_table(route_table, r_w)

    add_heading_2(doc, "7.2 Detailed Walkthrough of Key Frontend Pages")

    pages_detail = [
        ("Dashboard.tsx", "The unified landing hub post-login. Displays personalized quick stats (Connection count, Profile views, Active jobs, Event RSVPs), AI-recommended jobs, AI-suggested connections, and upcoming campus events in a clean 3-column responsive grid."),
        ("DepartmentPage.tsx", "The comprehensive departmental control center (1300+ lines). Features 6 interactive tabs: Overview (KPIs), Students Directory (with search, CGPA filters, and skills), Faculty Directory (with subject and designation badges), Alumni Tracking (with company and graduation year), Student Achievements Verification (allows HODs to view certificate images and click Verify or Reject), and Management Connect (official departmental requests)."),
        ("ReportsPage.tsx", "Accreditation and institutional reporting suite. Enables HODs and Controllers to review quarterly department reports, draft and submit new reports with student count, placement ratios, academic passing rates, and research publications, and export formatted CSV summaries for NAAC/NBA reviews."),
        ("ManagementConnectPage.tsx", "Direct communication pipeline between Department Heads and College Leadership (Principal, Dean, Management). HODs create categorized requests (Lab Infrastructure, Faculty Recruitment, Syllabus Revision, Budget Allocation) with priority indicators (High, Medium, Low) and track approval statuses."),
        ("DepartmentAnalyticsPage.tsx", "Visual intelligence dashboard rendering interactive Recharts graphics: Student CGPA Bell Curves, Cohort Placement Progression (Placed vs Unplaced vs Higher Studies), Skill Category Word Clouds, and Year-over-Year Placement Package Trends."),
        ("Feed.tsx", "Interactive campus social stream. Features rich post creation with image uploads, dynamic like/unlike optimistic updates, collapsible nested comments, post sharing, reporting/flagging dialogs, and AI trending recommendations in the right sidebar."),
        ("Profile.tsx", "Comprehensive professional portfolio. Features ProfileHeader with avatar upload, bio, social links, 10th/12th percentages, EducationSection (editable degree history), ExperienceSection (editable job history), Certifications list, and instant ATS Resume Download."),
        ("Jobs.tsx", "Full-featured recruitment portal. Displays company logos, salary ranges, required skill tags, remote/hybrid badges, one-click application submission with cover letter, application status trackers, and an Alumni Referrals board."),
        ("Messaging.tsx", "Real-time communication suite. Split-pane layout with conversations list on the left (search, unread badges, last message time) and active chat on the right with real-time incoming messages via WebSocket, typing bubbles, read checkmarks, and file attachment previews."),
        ("Admin.tsx", "Central administrator console. Features 4 management panes: Platform Statistics, Audit Logs (actor, IP, action, timestamp), User Moderation (ban/unban/delete accounts), Flagged Posts Review (dismiss flag or delete post), and Controller Invite Code Generator.")
    ]

    for p_name, p_desc in pages_detail:
        add_body_p(doc, p_desc, bold_prefix=f"{p_name}: ")

    doc.add_page_break()

    # =========================================================================
    # SECTION 8: BACKEND DEEP-DIVE
    # =========================================================================
    add_heading_1(doc, "8. Backend Deep-Dive (Core & Middleware Architecture)")
    add_body_p(doc, "The backend is implemented in asynchronous Python using FastAPI 0.110+, structured strictly according to Domain-Driven Design (DDD).")

    add_heading_2(doc, "8.1 Backend Core Modules")
    add_bullet(doc, "Pydantic BaseSettings loading all environment variables (DATABASE_URL, REDIS_URL, SECRET_KEY, GEMINI_API_KEY, CORS_ORIGINS). Enforces type validation at startup.", "app/core/config.py: ")
    add_bullet(doc, "Configures the asynchronous SQLAlchemy 2.0 engine via asyncpg (create_async_engine). Defines SessionLocal sessionmaker and the get_db dependency generator using contextlib.", "app/core/database.py: ")
    add_bullet(doc, "Cryptographic utilities: passlib.context.CryptContext with bcrypt for password hashing and pyjwt for signing and decoding HS256 JWT access and refresh tokens.", "app/core/security.py: ")
    add_bullet(doc, "Registers CORSMiddleware, RequestProfilingMiddleware (calculates request execution latency and injects X-Process-Time header), and AuditLoggingMiddleware.", "app/core/middleware.py: ")
    add_bullet(doc, "Centralized exception handlers for HTTPException, RequestValidationError, and custom domain exceptions (NotFoundError, AuthorizationError, ConflictError).", "app/core/exceptions.py: ")
    add_bullet(doc, "Generic Pydantic APIResponse[T] wrapper ensuring all JSON responses conform to the {success, message, data, errors} standard.", "app/core/response_models.py: ")

    add_heading_2(doc, "8.2 Static File Storage Architecture")
    add_body_p(doc, "Location: backend/app/main.py (lines 94-100)")
    add_body_p(doc, "To ensure rapid asset delivery without third-party cloud dependencies, FastAPI mounts a local static storage directory (/static) partitioned into dedicated subdirectories:")
    add_bullet(doc, "Stores user avatars uploaded via /api/v1/profiles/me/picture.", "static/profiles/: ")
    add_bullet(doc, "Stores post media attachments uploaded via /api/v1/posts/upload-image.", "static/posts/: ")
    add_bullet(doc, "Stores student co-curricular certificates uploaded for HOD verification via /api/v1/profiles/me/certificate.", "static/certificates/: ")
    add_bullet(doc, "Stores chat media and document attachments uploaded via /api/v1/messages/upload.", "static/messages/: ")
    add_body_p(doc, "All uploaded files are renamed with a cryptographically secure UUID4 prefix (e.g. 550e8400-e29b-41d4-a716-446655440000_cert.pdf) to eliminate path traversal vulnerabilities and collision risks.")

    doc.add_page_break()

    # =========================================================================
    # SECTION 9: SERVER CONFIGURATION, DOCKER & DEPLOYMENT GUIDE
    # =========================================================================
    add_heading_1(doc, "9. Server Configuration, Docker & Deployment Guide")
    add_body_p(doc, "KNOTS is engineered for seamless local development and multi-container production deployment using Docker and Docker Compose.")

    add_heading_2(doc, "9.1 Environment Variables Configuration")
    add_body_p(doc, "Backend Configuration (.env):")
    add_code_block(doc, "PROJECT_NAME=\"KNOTS\"\nENVIRONMENT=\"development\"\nSECRET_KEY=\"your-32-byte-ultra-secure-hex-secret-key\"\nACCESS_TOKEN_EXPIRE_MINUTES=60\nREFRESH_TOKEN_EXPIRE_DAYS=7\n\n# PostgreSQL Async Database Connection String\nDATABASE_URL=\"postgresql+asyncpg://postgres:postgres@localhost:5432/knots_db\"\n\n# In-Memory Cache Connection String\nREDIS_URL=\"redis://localhost:6379/0\"\n\n# Google Gemini LLM API Key (Optional for Local Mode)\nGEMINI_API_KEY=\"AIzaSy...\"\n\n# Allowed CORS Origins (Comma-separated)\nCORS_ORIGINS=\"http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173\"")

    add_body_p(doc, "Frontend Configuration (.env):")
    add_code_block(doc, "VITE_API_BASE_URL=\"http://localhost:8000/api/v1\"\nVITE_WS_BASE_URL=\"ws://localhost:8000/api/v1/ws/chat\"")

    add_heading_2(doc, "9.2 Local Development Setup (Step-by-Step)")
    add_bullet(doc, "git clone https://github.com/Yash-k10/knots.git && cd knots", "1. Clone Repository: ")
    add_bullet(doc, "cd backend && python -m venv venv && .\\venv\\Scripts\\activate", "2. Backend Virtual Environment: ")
    add_bullet(doc, "pip install -r requirements.txt", "3. Install Dependencies: ")
    add_bullet(doc, "alembic upgrade head", "4. Run Database Migrations: ")
    add_bullet(doc, "uvicorn app.main:app --reload --port 8000", "5. Start Backend Server: ")
    add_bullet(doc, "cd ../frontend && npm install", "6. Frontend Dependencies: ")
    add_bullet(doc, "npm run dev", "7. Start Frontend Dev Server: ")
    add_bullet(doc, "Navigate to http://localhost:5173 (Frontend) and http://localhost:8000/docs (Swagger UI).", "8. Access Platform: ")

    add_heading_2(doc, "9.3 Docker Multi-Container Orchestration")
    add_body_p(doc, "The platform includes a root docker-compose.yml orchestrating 4 services:")
    add_bullet(doc, "Image: postgres:16-alpine with persistent named volume knots_pgdata.", "1. Database (postgres): ")
    add_bullet(doc, "Image: redis:7-alpine for caching and WebSocket pub/sub.", "2. In-Memory Store (redis): ")
    add_bullet(doc, "Built using backend/Dockerfile (Python 3.11-slim multi-stage). Runs Alembic migrations on entry and launches Uvicorn.", "3. API Backend (backend): ")
    add_bullet(doc, "Built using frontend/Dockerfile (Node.js build stage -> Nginx Alpine static web server on Port 80).", "4. Web Frontend (frontend): ")

    doc.add_page_break()

    # =========================================================================
    # SECTION 10: COMPLETE ANNOTATED DIRECTORY STRUCTURE
    # =========================================================================
    add_heading_1(doc, "10. Complete Annotated Project Directory Structure")
    add_body_p(doc, "Below is the complete file and directory hierarchy of the KNOTS codebase with annotations explaining the function of each module:")

    dir_tree = """knots/
├── backend/
│   ├── alembic/                      # Database migrations environment & history
│   │   ├── versions/                 # Individual migration revision scripts
│   │   │   ├── 063fc58f5405_add_designation_degree_experience.py
│   │   │   ├── 1d9b6b6aae91_add_conversation_id_to_clubs.py
│   │   │   └── 1d9b6b6aae91_bridge_migration.py
│   │   └── env.py                    # Alembic migration runner & metadata imports
│   ├── app/                          # Main application source code
│   │   ├── admin/                    # Central admin console, moderation & audit logs
│   │   │   ├── models/               # AuditLog, ControllerInvite, FlaggedPost
│   │   │   ├── routers/admin.py      # Admin endpoints (/api/v1/admin/*)
│   │   │   ├── schemas/admin.py      # Pydantic schemas for admin operations
│   │   │   └── services/admin.py     # Ban user, resolve flags, audit services
│   │   ├── ai/                       # AI Intelligence & Recommendation engines
│   │   │   ├── routers/ai.py         # AI endpoints (/api/v1/ai/*)
│   │   │   ├── schemas/              # Connection, job, and content schemas
│   │   │   └── services/             # Local deterministic resume & roadmap services
│   │   ├── analytics/                # Platform metrics & trending algorithms
│   │   │   ├── models/               # ProfileView, PostEngagement
│   │   │   ├── repository/           # Weighted trending post SQL queries
│   │   │   ├── routers/analytics.py  # Analytics endpoints (/api/v1/analytics/*)
│   │   │   └── services/analytics.py # System summary and time-series services
│   │   ├── auth/                     # Authentication & IAM module
│   │   │   ├── dependencies/auth.py  # get_current_user, RoleRequired
│   │   │   ├── routers/auth.py       # Register, login, OTP, Google OAuth
│   │   │   ├── schemas/auth.py       # LoginRequest, TokenResponse, OTPVerify
│   │   │   └── services/auth.py      # Password verification, JWT issue & rotation
│   │   ├── clubs/                    # Student clubs and societies
│   │   │   ├── models/club.py        # Club, ClubMember models
│   │   │   ├── routers/club.py       # Club directory, join/leave, role update
│   │   │   └── services/club.py      # Membership and group chat synchronization
│   │   ├── connections/              # Peer-to-peer networking
│   │   │   ├── models/connection.py  # Connection model (requester, addressee)
│   │   │   └── routers/connection.py # Request, accept, reject, withdraw
│   │   ├── core/                     # Foundational infrastructure
│   │   │   ├── base.py               # Aggregated database model registry
│   │   │   ├── config.py             # Environment settings & Pydantic validation
│   │   │   ├── database.py           # Async engine, SessionLocal, get_db
│   │   │   ├── exceptions.py         # Standardized exception handlers
│   │   │   ├── middleware.py         # CORS, profiling & audit logging middlewares
│   │   │   ├── response_models.py    # Standardized APIResponse envelope
│   │   │   └── security.py           # Bcrypt hashing & PyJWT token handling
│   │   ├── department/               # HOD & Departmental governance
│   │   │   ├── routers/department.py # HOD stats, students, alumni, achievements
│   │   │   └── schemas/department.py # Pydantic schemas for departmental data
│   │   ├── events/                   # Campus events & RSVPs
│   │   │   ├── models/               # Event, EventCategory, RSVP
│   │   │   └── routers/event.py      # Event schedule, RSVP approval workflow
│   │   ├── jobs/                     # Recruitment & Career module
│   │   │   ├── models/               # Company, JobPosting, Application, Referral
│   │   │   └── routers/job.py        # Job board, application candidate tracking
│   │   ├── messaging/                # Real-time chat & WebSockets
│   │   │   ├── models/               # Conversation, Message, ReadReceipt
│   │   │   ├── routers/websocket.py  # Native FastAPI WebSocket /ws/chat
│   │   │   └── websocket_manager.py  # In-memory connection registry & broadcast
│   │   ├── notifications/            # Alerts & Preferences
│   │   ├── posts/                    # Social feed, comments & likes
│   │   ├── profiles/                 # User profiles, education, experience, resume
│   │   ├── search/                   # Global multi-entity search
│   │   ├── users/                    # User identities & roles
│   │   ├── api_router.py             # Version 1 router aggregator
│   │   └── main.py                   # FastAPI application entrypoint
│   ├── static/                       # Local disk storage for uploads
│   ├── requirements.txt              # Python package dependencies
│   ├── Dockerfile                    # Production container specification
│   └── .env.example                  # Backend configuration template
├── frontend/
│   ├── public/                       # Static branding assets & campus badges
│   ├── src/
│   │   ├── components/
│   │   │   ├── connections/          # ConnectionCard, MutualConnections
│   │   │   ├── layout/DashboardLayout.tsx # Collapsible navigation & header
│   │   │   └── profile/              # ProfileHeader, Education, Experience
│   │   ├── context/AuthContext.tsx   # Global authentication state provider
│   │   ├── pages/                    # 23 Single-Page Application views
│   │   │   ├── Admin.tsx             # Central admin moderation console
│   │   │   ├── DepartmentPage.tsx    # HOD Department Console
│   │   │   ├── DepartmentAnalyticsPage.tsx # Departmental Recharts analytics
│   │   │   ├── ManagementConnectPage.tsx   # HOD to Management requests
│   │   │   ├── ReportsPage.tsx       # Departmental accreditation reports
│   │   │   ├── Feed.tsx              # Campus social feed
│   │   │   ├── Jobs.tsx              # Job board & application tracker
│   │   │   ├── Messaging.tsx         # Real-time split-pane chat interface
│   │   │   ├── Profile.tsx           # Student & alumni portfolio
│   │   │   └── Students.tsx          # Student cohort directory
│   │   ├── routes/AppRoutes.tsx      # ProtectedRoute & Role routing matrix
│   │   ├── services/                 # API client & domain service modules
│   │   │   ├── api.ts                # Axios instance with JWT interceptor
│   │   │   ├── auth.ts               # Login, register, logout, OTP calls
│   │   │   └── department.ts         # Department stats & achievement calls
│   │   ├── App.tsx                   # Top-level application component
│   │   ├── index.css                 # Tailwind directives & dark theme utilities
│   │   └── main.tsx                  # React DOM entrypoint
│   ├── package.json                  # Node.js dependencies
│   ├── tailwind.config.js            # Tailwind theme tokens & color definitions
│   ├── tsconfig.json                 # TypeScript compiler options
│   └── vite.config.ts                # Vite build configuration
├── docker-compose.yml                # Multi-service local orchestration
├── department_controller_keys.md     # Cryptographic security keys inventory
└── README.md                         # Developer manual & project overview"""

    add_code_block(doc, dir_tree)

    # Save Document
    output_path = "KNOTS_Comprehensive_Project_Documentation.docx"
    doc.save(output_path)
    print(f"Successfully generated master Word document: {output_path}")

if __name__ == "__main__":
    build_full_knots_doc()
