import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styles & Colors
    PRIMARY_COLOR = RGBColor(30, 58, 138)     # Navy Blue #1E3A8A
    SECONDARY_COLOR = RGBColor(79, 70, 229)   # Indigo #4F46E5
    DARK_TEXT = RGBColor(15, 23, 42)          # Slate 900 #0F172A
    MUTED_TEXT = RGBColor(71, 85, 105)        # Slate 600 #475569
    ACCENT_TEAL = RGBColor(14, 165, 233)      # Sky Blue #0EA5E9

    # Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = DARK_TEXT
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # COVER / TITLE BLOCK
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(24)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("KNOTS : Campus Hub")
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(28)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("Next-Generation Academic Networking, Real-Time Collaboration & AI-Driven Career Acceleration Platform")
    run_sub.font.name = 'Segoe UI'
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = SECONDARY_COLOR

    # Meta banner table
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    meta_cell.width = Inches(6.5)
    set_cell_background(meta_cell, "F1F5F9")
    set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)
    
    mp = meta_cell.paragraphs[0]
    mp.paragraph_format.space_after = Pt(2)
    r1 = mp.add_run("System Specification & Engineering Reference Manual\n")
    r1.font.bold = True
    r1.font.size = Pt(10)
    r1.font.color.rgb = PRIMARY_COLOR
    
    r2 = mp.add_run("Platform: ")
    r2.font.bold = True
    r2.font.size = Pt(9.5)
    mp.add_run("KNOTS Unified Web Application | ")
    
    r3 = mp.add_run("Stack: ")
    r3.font.bold = True
    r3.font.size = Pt(9.5)
    mp.add_run("FastAPI (Python 3.11+), React 18, TypeScript, Tailwind CSS, PostgreSQL, WebSockets, Google Gemini AI\n")
    
    r4 = mp.add_run("Classification: ")
    r4.font.bold = True
    r4.font.size = Pt(9.5)
    mp.add_run("Academic & Institutional Production Architecture")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = SECONDARY_COLOR
        return h

    def add_heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = 'Segoe UI'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = DARK_TEXT
        return h

    def add_bullet(text, prefix="• "):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(f"{prefix}{text}")
        return p

    def add_callout(text, title="KEY ARCHITECTURAL HIGHLIGHT"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "EEF2FF")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"[{title}] ")
        r_title.font.bold = True
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = SECONDARY_COLOR
        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & WHAT IS KNOTS
    # -------------------------------------------------------------
    add_heading_1("1. Executive Summary & What is KNOTS")
    
    p = doc.add_paragraph()
    p.add_run("KNOTS (Campus Hub) ").bold = True
    p.add_run("is a state-of-the-art, unified campus networking and career acceleration ecosystem engineered to bridge the critical disconnect between academic education, peer collaboration, institutional administration, and professional industry recruitment. Built specifically for universities, colleges, and technical institutes, KNOTS replaces fragmented communication channels (WhatsApp groups, Telegram channels, static bulletin boards, and disjointed email threads) with a centralized, secure, role-governed, and AI-augmented platform.")

    p2 = doc.add_paragraph()
    p2.add_run("Core Mission & Objectives:").bold = True
    add_bullet("Institutional Networking: Facilitate friction-free connections between Students, Faculty, Department Heads (HOD), Training & Placement Officers (TPO), Alumni, Deans, and College Leadership.", "1. ")
    add_bullet("AI-Powered Career Transformation: Provide personalized career roadmaps, real-time ATS resume analysis with bullet-point rewrites, and skill-gap bridging using Google Gemini AI.", "2. ")
    add_bullet("Real-Time Campus Collaboration: Deliver zero-latency instant messaging with rich attachments, voice audio notes, typing indicators, read receipts, and hierarchy-governed direct channels.", "3. ")
    add_bullet("Centralized Academic & Opportunity Hub: Manage campus hackathons, technical events, internships, full-time job drives, and student club memberships in one unified interface.", "4. ")
    add_bullet("Administrative Governance: Provide multi-tiered Role-Based Access Control (RBAC) with stealth administrative protection, controller invites, and institutional verification.", "5. ")

    add_callout("KNOTS integrates enterprise-grade web engineering standards: Async Python backend with FastAPI & SQLAlchemy, responsive React 18 TypeScript frontend, RFC 6455 full-duplex WebSockets, and Google Gemini Generative AI for structured career recommendations.", "SYSTEM ARCHITECTURE")

    # -------------------------------------------------------------
    # SECTION 2: CORE PLATFORM FEATURES & MODULES
    # -------------------------------------------------------------
    add_heading_1("2. Core Platform Features & Functional Modules")

    add_heading_2("2.1 Comprehensive Student & Alumni Profiles")
    p = doc.add_paragraph()
    p.add_run("The user profile serves as a dynamic, interactive digital portfolio highlighting a student's complete academic trajectory and professional readiness:")
    add_bullet("Education History: Institutions, degree titles, majors, CGPA/percentages, start/end dates, and academic awards.")
    add_bullet("Work Experience & Internships: Organization names, job designations, duration, and detailed impact bullet points.")
    add_bullet("Technical & Soft Skills: Tagged skill repository categorized into Frontend, Backend, Cloud/DevOps, AI/ML, and Core CS.")
    add_bullet("Peer Skill Endorsements: Verified peers and faculty can endorse skills with one click, establishing community validation.")
    add_bullet("Projects & Certifications: Live project URLs, GitHub source repositories, issuing certification authorities, and verifiable credentials.")
    add_bullet("Profile Picture & Media Uploader: Multi-format avatar uploads with client-side preview and server-side static media storage.")

    add_heading_2("2.2 Real-Time Full-Duplex Messaging Hub")
    p = doc.add_paragraph()
    p.add_run("A dedicated communication backbone operating over persistent WebSockets:")
    add_bullet("1-on-1 Direct Messaging: Real-time private conversations with instant delivery confirmation and status indicators.")
    add_bullet("Group Collaborative Chats: Multi-user group discussions for project teams, study cohorts, and club executive committees.")
    add_bullet("Rich Attachment Support: Upload and transfer images (.png, .jpg, .webp), documents (.pdf, .docx, .zip), and code files.")
    add_bullet("Voice Note Audio Messaging: In-browser audio recording (.webm/.wav) with real-time waveform playback controls.")
    add_bullet("Typing Indicators & Read Receipts: Visual presence alerts when peers are typing and live double-tick read tracking.")
    add_bullet("Hierarchical Safety Restrictions: Automatic validation ensuring communication complies with institutional hierarchy rules.")

    add_heading_2("2.3 Campus Social Feed & Engagement Engine")
    p = doc.add_paragraph()
    p.add_run("An interactive social feed designed for academic knowledge sharing and announcements:")
    add_bullet("Visibility Controls: Public (campus-wide), Connections-Only, or Department-Only post audiences.")
    add_bullet("Rich Media Attachments: Multi-image carousels and downloadable document previews.")
    add_bullet("Interactive Reactions & Nested Comments: Instant likes, heart reactions, and threaded comment discussions.")
    add_bullet("Bookmark & Save Posts: Students can archive important placement tips, notes, and study resources for offline review.")

    add_heading_2("2.4 Campus Events, Hackathons & RSVP Management")
    p = doc.add_paragraph()
    p.add_run("A unified event scheduling and attendee tracking module:")
    add_bullet("Categorized Event Listings: Technical Hackathons, Cultural Festivals, Placement Preparation Webinars, and Workshops.")
    add_bullet("Real-Time RSVP Tracking: 1-click RSVP registration with live counter updates and attendee rosters.")
    add_bullet("Location & Virtual Links: Physical venue coordinates or direct Google Meet/Zoom meeting hyperlinks.")

    add_heading_2("2.5 Placements, Jobs & Referral Network")
    p = doc.add_paragraph()
    p.add_run("A dedicated bridge connecting students directly to hiring opportunities:")
    add_bullet("Job & Internship Postings: Detailed job descriptions, eligibility criteria, CTC/stipend packages, and application deadlines.")
    add_bullet("Student Application Pipeline: Direct 1-click applications with resume attachment and status tracking (Applied -> Under Review -> Interview -> Selected).")
    add_bullet("Alumni Referral Requests: Students can directly request referrals from verified alumni working in tier-1 tech enterprises.")

    add_heading_2("2.6 Student Clubs & Community Hub")
    p = doc.add_paragraph()
    p.add_run("Organization and governance portal for collegiate clubs:")
    add_bullet("Club Directory: Coding Clubs, Robotics Societies, Entrepreneurship Cells (E-Cell), and Cultural Committees.")
    add_bullet("Executive Leadership & Roster: Displays Faculty Advisors, Club Presidents, and active student members.")
    add_bullet("Official Club Announcements: Broadcast feeds exclusive to registered club members.")

    add_heading_2("2.7 Multi-Tier Role-Based Access Control (RBAC)")
    p = doc.add_paragraph()
    p.add_run("A granular security matrix governing 10 institutional roles:")
    add_bullet("Roles: Student, Faculty, HOD (Head of Department), Controller of Examinations, Alumni, TPO (Training & Placement Officer), Dean, Principal, CEO / Management, Admin, Super Admin.")
    add_bullet("Stealth Admin Protection: Higher administrative roles (Super Admin) are protected by stealth filters preventing unauthorized spam.")
    add_bullet("Controller Invite Flow: Secure, cryptographic token-based onboarding for newly appointed administrative controllers.")

    # -------------------------------------------------------------
    # SECTION 3: INTELLIGENT ALGORITHMS & MATHEMATICAL FORMULATIONS
    # -------------------------------------------------------------
    add_heading_1("3. Intelligent AI Algorithms & Formulations")

    add_heading_2("3.1 AI Resume Analyzer & ATS Compatibility Algorithm")
    p = doc.add_paragraph()
    p.add_run("The KNOTS Resume Analyzer executes a 4-dimensional evaluation pipeline using structured LLM synthesis via Google Gemini GenAI:")
    
    add_bullet("1. ATS Structural Compatibility Score (Weight: 25%): Evaluates section headers, standard typography, bullet formatting, and absence of parsing anomalies.")
    add_bullet("2. Impact Metric Quantification Score (Weight: 30%): Analyzes experience bullet points for quantifiable business impact (e.g., 'Improved latency by 42%', 'Managed $10k budget').")
    add_bullet("3. Tech Stack Depth & Keyword Match Score (Weight: 25%): Compares detected skills against industry role taxonomies (e.g., Full Stack, DevOps, Data Science).")
    add_bullet("4. Action Verb & Brevity Optimization (Weight: 20%): Flags weak passive phrases and replaces them with strong, active verbs (e.g., 'Assisted with' -> 'Architected and deployed').")

    add_callout("Overall ATS Score = 0.25*(ATS_Score) + 0.30*(Impact_Score) + 0.25*(TechDepth_Score) + 0.20*(ActionVerb_Score)\nIncludes automated bullet rewrites in XYZ format: 'Accomplished [X] as measured by [Y], by doing [Z]'.", "ATS SCORING FORMULA")

    add_heading_2("3.2 Dynamic AI Career Roadmap Generator")
    p = doc.add_paragraph()
    p.add_run("Generates milestone-phased, personalized learning paths tailored to a student's current proficiency:")
    add_bullet("Phase Decomposition: Breaks career paths into sequential phases (Foundation -> Intermediate Mastery -> Advanced Architecture -> Production Projects).")
    add_bullet("Skill-Gap Graph Computation: Computes symmetric difference between target role prerequisites and student's verified skills.")
    add_bullet("Portfolio Project Synthesis: Generates complete project specifications with modern tech stacks to maximize portfolio hiring value.")
    add_bullet("Interview Prep Syllabus: Structures technical DSA, System Design, and Behavioral interview modules for the target designation.")

    add_heading_2("3.3 Feed Personalization & Trending Post Ranking Algorithm")
    p = doc.add_paragraph()
    p.add_run("KNOTS employs a time-decay engagement algorithm to surface high-value campus posts and announcements:")

    add_callout("Trending Score = (L * 3.0 + C * 5.0 + V * 0.5) / (AgeInHours + 2.0)^1.5\nWhere L = Total Likes, C = Total Comments, V = Unique Post Views, AgeInHours = Time elapsed since publication.", "TRENDING RANKING ALGORITHM")

    add_heading_2("3.4 Peer Connection & Mentorship Matching Algorithm")
    p = doc.add_paragraph()
    p.add_run("Computes peer recommendation scores S(u, v) between user u and user v based on multi-attribute cosine similarity:")
    add_bullet("Mutual Connections (Weight: 40%): Shared peer network size.")
    add_bullet("Department & Branch Proximity (Weight: 30%): Same academic division or complementary branches.")
    add_bullet("Skill Overlap (Weight: 20%): Intersection of technical interests (Jaccard similarity).")
    add_bullet("Alumni-Student Mentorship Bridge (Weight: 10%): Boost applied when an alumnus shares past clubs or target industry with a student.")

    add_heading_2("3.5 Communication Hierarchy Validation Matrix")
    p = doc.add_paragraph()
    p.add_run("Enforces institutional etiquette and anti-harassment safeguards across institutional ranks using a directed permission graph:")
    
    # Table of Hierarchy
    h_table = doc.add_table(rows=6, cols=3)
    h_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Sender Role", "Authorized Direct Recipients", "Permission Scope"]
    for i, title in enumerate(headers):
        cell = h_table.cell(0, i)
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Student", "Students, Faculty, Alumni", "Peer networking, academic queries, mentorship"),
        ("Faculty", "Students, Faculty, HOD, Controller, Alumni", "Coursework notices, grade coordination, mentoring"),
        ("HOD", "Faculty, Controller, Alumni, TPO, Dean, Students", "Departmental administration, academic reviews"),
        ("TPO", "Central Admin, Dean, Principal, Alumni, HOD, Students", "Placement drives, recruitment announcements, alumni bridging"),
        ("Admin / Super Admin", "All Platform Roles (*)", "Full institutional administration and system alerts"),
    ]

    for row_idx, row_data in enumerate(data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = h_table.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 4: TECHNOLOGY STACK & ARCHITECTURE
    # -------------------------------------------------------------
    add_heading_1("4. Technology Stack & Architectural Specifications")

    add_heading_2("4.1 Frontend Engineering Stack")
    add_bullet("Core Framework: React 18.2 with TypeScript 5.2 for bulletproof type-safety and component reusability.")
    add_bullet("Build System & Bundler: Vite 5.0 delivering ultra-fast Hot Module Replacement (HMR) and optimized tree-shaken production bundles.")
    add_bullet("Styling & Design System: Tailwind CSS 3.3 with customized HSL theme tokens, dynamic dark mode, and sleek glassmorphism.")
    add_bullet("Component Icons: Lucide React 0.294 (modern, clean, accessible SVG icons).")
    add_bullet("Data Visualization: Recharts 3.10 for interactive profile views, engagement analytics, and application statistics.")
    add_bullet("State & Server Cache: TanStack React Query v5 for asynchronous server-state caching and background synchronization.")
    add_bullet("Real-Time Client: Native browser WebSocket client with automated heartbeat (25s ping/pong), exponential backoff reconnection, and optimistic UI dispatch.")

    add_heading_2("4.2 Backend Engineering Stack")
    add_bullet("Web Framework: FastAPI (Python 3.11+) asynchronous microframework with high-throughput ASGI runtime.")
    add_bullet("Database ORM: SQLAlchemy 2.0 with Asyncpg driver providing high-concurrency non-blocking database queries.")
    add_bullet("Data Validation & Serialization: Pydantic v2 schemas for strict request/response data contracts.")
    add_bullet("Authentication & Cryptography: Passlib with Bcrypt password hashing, PyJWT for cryptographic HMAC-SHA256 token issuance.")
    add_bullet("Generative AI Integration: Google GenAI SDK (google-genai) utilizing Gemini 2.5/Flash for structured schema reasoning.")
    add_bullet("Real-Time Connection Manager: Custom asyncio-based ConnectionManager maintaining concurrent active WebSocket sessions.")
    add_bullet("Email Service: SMTP Protocol with secure TLS delivery for OTP verifications and event alerts.")

    add_heading_2("4.3 Database & Infrastructure Layer")
    add_bullet("Primary Relational Database: PostgreSQL 15+ (Hosted on Supabase / Neon Cloud) with connection pooling.")
    add_bullet("Database Migrations: Alembic for version-controlled, automated database schema migrations.")
    add_bullet("In-Memory Caching & PubSub: Redis / Upstash for distributed session state, presence indicators, and rate limiting.")
    add_bullet("Static File Storage: Static media server with UUID-based filename sanitization and MIME-type validation.")

    # -------------------------------------------------------------
    # SECTION 5: DATABASE SCHEMA & ENTITY RELATIONSHIPS
    # -------------------------------------------------------------
    add_heading_1("5. Database Schema & Entity Relationships")
    p = doc.add_paragraph()
    p.add_run("KNOTS features a normalized, relational database schema comprising 16 interconnected tables:")
    
    # Table of Entities
    e_table = doc.add_table(rows=9, cols=3)
    e_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    e_headers = ["Entity / Table", "Primary Attributes", "Relationships & Foreign Keys"]
    for i, title in enumerate(e_headers):
        cell = e_table.cell(0, i)
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    entities = [
        ("users", "id, email, hashed_password, role_id, is_active, is_verified, created_at", "Belongs to Role; Has one Profile; Has many Posts, Connections, Messages"),
        ("profiles", "id, user_id, first_name, last_name, bio, headline, department, avatar_url", "Belongs to User; Has many Education, Experience, Skills, Certifications"),
        ("conversations", "id, is_group, name, created_at, updated_at", "Has many ConversationParticipants, Messages"),
        ("conversation_participants", "id, conversation_id, user_id, joined_at, last_read_at", "Composite relation connecting Users to Conversations"),
        ("messages", "id, conversation_id, sender_id, receiver_id, content, is_read, created_at", "Belongs to Conversation and User (Sender/Receiver)"),
        ("posts", "id, user_id, content, media_urls, visibility, created_at", "Belongs to User; Has many Likes, Comments, Bookmarks"),
        ("events", "id, title, description, category, start_time, end_time, location, max_attendees", "Has many EventRSVPs"),
        ("job_postings", "id, title, company_name, location, job_type, salary_range, deadline", "Has many Applications, ReferralRequests"),
    ]

    for row_idx, row_data in enumerate(entities, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = e_table.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 6: SECURITY, AUTHENTICATION & GOVERNANCE
    # -------------------------------------------------------------
    add_heading_1("6. Security, Authentication & Platform Governance")
    add_bullet("Stateless JWT Token Lifecycle: 30-minute expiration Access Tokens paired with 7-day cryptographically stored Refresh Tokens with automatic client-side silent renewal.")
    add_bullet("Google OAuth 2.0 Integration: Seamless single sign-on enabling institutional email authentication with Google Identity Services.")
    add_bullet("Multi-Factor Email OTP Verification: Secure 6-digit cryptographic verification codes sent via TLS SMTP during registration and credential resets.")
    add_bullet("Stealth Administrator Protection: Super Admin and Executive Management accounts are shielded from unsolicited discovery, preventing spam and credential harvesting.")
    add_bullet("Input Sanitization & SQL Injection Immunity: Complete parameterization via SQLAlchemy async ORM and Pydantic schema validation.")
    add_bullet("CORS & Origin Whitelisting: Strict cross-origin resource sharing headers allowing only authenticated institutional web domains.")

    # -------------------------------------------------------------
    # SECTION 7: SUMMARY & CONCLUSION
    # -------------------------------------------------------------
    add_heading_1("7. Summary & Professional Impact")
    p = doc.add_paragraph()
    p.add_run("KNOTS represents a monumental advancement in collegiate networking technology. By unifying social interaction, real-time messaging, institutional administrative hierarchy, and cutting-edge artificial intelligence, KNOTS equips universities with a modern, scalable digital campus. Students gain a measurable competitive edge in career preparation, while institutions gain comprehensive oversight, community engagement, and placement success.")

    # Save to disk
    output_path = os.path.abspath(r"c:\Users\kanchan\OneDrive\Desktop\knots_update\KNOTS_Comprehensive_Technical_Documentation.docx")
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
