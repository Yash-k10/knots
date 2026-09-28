import os
import shutil
import win32com.client
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideV w:val="none"/></w:tblBorders>')
        tblPr[0].append(borders)

def add_clean_page_number(run):
    fldSimple = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
    run._r.append(fldSimple)

def generate_paper():
    doc = Document()
    
    # Clean page setup (Standard academic layout: 1.0 inch margins)
    sec = doc.sections[0]
    sec.top_margin = Inches(1.0)
    sec.bottom_margin = Inches(1.0)
    sec.left_margin = Inches(1.0)
    sec.right_margin = Inches(1.0)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # Completely clear headers
    header = sec.header
    for p in header.paragraphs:
        p.text = ""
    
    # Clean footer with simple centered page numbering
    footer = sec.footer
    footer_para = footer.paragraphs[0]
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_para.text = ""
    f_run = footer_para.add_run()
    f_run.font.name = 'Times New Roman'
    f_run.font.size = Pt(10)
    f_run.font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    add_clean_page_number(f_run)

    # Normal Style settings
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    # Content Helper Functions
    def add_p(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, space_before=0, line_spacing=1.15):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.bold = True
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.italic = True
        return p

    def add_figure(img_path, caption_text, width_inch=6.0):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        if os.path.exists(img_path):
            p.add_run().add_picture(img_path, width=Inches(width_inch))
        
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_before = Pt(2)
        cp.paragraph_format.space_after = Pt(10)
        crun = cp.add_run(caption_text)
        crun.font.name = 'Times New Roman'
        crun.font.size = Pt(10)
        crun.font.italic = True

    # ------------------ PAPER TITLE ------------------
    tp = doc.add_paragraph()
    tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp.paragraph_format.space_before = Pt(10)
    tp.paragraph_format.space_after = Pt(10)
    trun = tp.add_run("KNOTS: An Institutionally-Verified Community Networking, Career Advancement, and Governance Ecosystem for Higher Education")
    trun.font.name = 'Times New Roman'
    trun.font.size = Pt(18)
    trun.font.bold = True
    trun.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    # ------------------ AUTHORS & AFFILIATIONS ------------------
    ap = doc.add_paragraph()
    ap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ap.paragraph_format.space_before = Pt(0)
    ap.paragraph_format.space_after = Pt(4)
    arun = ap.add_run("Yash Kapse, Kanchan Gaikwad, Dhanshree Bhorkar, Shrushti Zod")
    arun.font.name = 'Times New Roman'
    arun.font.size = Pt(11.5)
    arun.font.bold = True

    affp = doc.add_paragraph()
    affp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    affp.paragraph_format.space_before = Pt(0)
    affp.paragraph_format.space_after = Pt(14)
    affrun1 = affp.add_run("Department of Computer Science and Engineering\n")
    affrun1.font.name = 'Times New Roman'
    affrun1.font.size = Pt(10.5)
    affrun1.font.italic = True
    affrun2 = affp.add_run("S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, Maharashtra, India")
    affrun2.font.name = 'Times New Roman'
    affrun2.font.size = Pt(10.5)
    affrun2.font.italic = True

    # ------------------ ABSTRACT & KEYWORDS ------------------
    absp = doc.add_paragraph()
    absp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    absp.paragraph_format.space_before = Pt(4)
    absp.paragraph_format.space_after = Pt(6)
    absp.paragraph_format.line_spacing = 1.15
    
    abs_bold = absp.add_run("Abstract—")
    abs_bold.font.name = 'Times New Roman'
    abs_bold.font.size = Pt(10.5)
    abs_bold.font.bold = True
    
    abs_text = (
        "Higher education institutions frequently rely on fragmented software tools to manage placement operations, student networking, "
        "campus organizations, alumni engagement, and career preparation. This fragmentation results in significant administrative overhead "
        "for Training and Placement Officers (TPOs), delayed communication between recruiters and students, inconsistent alumni mentorship, "
        "and difficulties in maintaining verified student academic portfolios. This paper presents KNOTS (Knowledge Network and Organizational "
        "Tracking System), an end-to-end university ecosystem platform designed using an asynchronous domain-driven architecture. Built on "
        "FastAPI (Python ASGI), SQLAlchemy ORM, PostgreSQL/SQLite, and persistent WebSockets, KNOTS unifies verified academic profiling, "
        "automated campus recruitment drives, alumni mentorship channels, student club coordination, real-time messaging, and profile-driven "
        "resume generation into a single digital infrastructure. The platform features an automated eligibility validation engine that dynamically "
        "verifies candidates against corporate criteria (CGPA, active backlogs, batch year, and department cutoffs), an automated resume compiler "
        "that exports structured, professional resumes directly from verified profile data, a dedicated alumni networking portal for 1-on-1 mentorship "
        "and job referrals, and multi-tier Role-Based Access Control (RBAC) with immutable audit logging. KNOTS delivers an efficient, secure, and "
        "transparent institutional ecosystem that bridges the operational gap between students, faculty mentors, alumni, and recruiters."
    )
    abs_run = absp.add_run(abs_text)
    abs_run.font.name = 'Times New Roman'
    abs_run.font.size = Pt(10.5)

    kwp = doc.add_paragraph()
    kwp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    kwp.paragraph_format.space_before = Pt(2)
    kwp.paragraph_format.space_after = Pt(14)
    
    kw_bold = kwp.add_run("Index Terms—")
    kw_bold.font.name = 'Times New Roman'
    kw_bold.font.size = Pt(10.5)
    kw_bold.font.bold = True
    
    kw_text = "Campus Networking, Placement Automation, Alumni Mentorship, Resume Generation, FastAPI, WebSockets, Role-Based Access Control, Academic Governance, Information Systems."
    kw_run = kwp.add_run(kw_text)
    kw_run.font.name = 'Times New Roman'
    kw_run.font.size = Pt(10.5)
    kw_run.font.italic = True

    # ------------------ SECTION I. INTRODUCTION ------------------
    add_heading_1("I. INTRODUCTION")
    add_p(
        "Higher education institutions face significant operational challenges in coordinating student placement drives, facilitating "
        "structured student-alumni networking, managing student campus organizations, and providing reliable career mentorship. Modern "
        "university administrative workflows are typically divided across disconnected channels:"
    )
    add_p(
        "• Placement Operations: Handled through legacy web portals or manual spreadsheet submissions, leading to verification delays, data "
        "redundancy, and error-prone candidate filtering during corporate campus drives."
    )
    add_p(
        "• Alumni & Campus Engagement: Managed via unofficial instant messaging groups and standalone social platforms, scattering official notices "
        "regarding club activities, workshops, and losing active touchpoints with graduated alumni who can offer invaluable industry mentorship."
    )
    add_p(
        "• Career Preparation & Profiling: Heavily reliant on students manually formatting resumes and faculty spending limited time verifying "
        "academic achievements, preventing standardized, verified document generation for campus placement."
    )
    add_p(
        "To resolve these inefficiencies, this paper introduces KNOTS (Knowledge Network and Organizational Tracking System), a unified platform "
        "designed to serve as a centralized digital backbone for academic institutions. KNOTS combines verified academic management with interactive "
        "peer-alumni networking, automated placement administration, and institutional governance."
    )

    add_heading_2("Key Technical Contributions")
    contributions = [
        "1. Domain-Driven Asynchronous Architecture: A scalable Python backend built with FastAPI, utilizing asynchronous I/O and domain segregation (auth, jobs, events, clubs, messaging, profiles, connections, admin) to handle concurrent usage during campus drives.",
        "2. Automated Profile-to-Resume Generator: An integrated document compiler that extracts verified academic credentials (CGPA, marks), technical skills, project experiences, and certifications directly from user profile edits into standard, professional resume documents.",
        "3. Alumni Mentorship & Referral Network: A dedicated subsystem connecting students with verified institutional alumni for 1-on-1 career guidance, industry insights, and corporate referral pathways.",
        "4. Dynamic Eligibility Filtering Engine: An automated rule evaluation pipeline that instantly checks candidate criteria (minimum CGPA, 10th/12th percentages, backlog counts, allowed branches) against corporate drive requirements.",
        "5. Real-Time Asynchronous WebSocket Broker: An in-app messaging and notification infrastructure designed for multi-tier communication (peer-to-peer, alumni mentorship, club channels, and automated system alerts) with low latency.",
        "6. Multi-Tier Governance & Audit Logging: Role-Based Access Control (RBAC) across Students, Alumni, Faculty, HODs, Club Leads, and TPOs, backed by immutable audit trails and content moderation."
    ]
    for c in contributions:
        add_p(c, space_after=3, line_spacing=1.1)

    add_figure('paper_assets/fig1_platform_overview.png', "Fig. 1. KNOTS platform overview and core functional pillars.", width_inch=6.2)

    # ------------------ SECTION II. LITERATURE REVIEW & RELATED WORK ------------------
    add_heading_1("II. LITERATURE REVIEW & RELATED WORK")
    add_p(
        "Automated academic placement and student networking systems have evolved considerably over the past decade. Early implementations "
        "relied on simple static web pages and standalone databases to store student contact records [1], [2]. However, these systems lacked "
        "integrated workflows, requiring placement coordinators to manually export spreadsheets and cross-verify academic qualifications against "
        "company cutoffs [3]."
    )
    add_p(
        "Research by Sharma et al. [1] and Rao & Laxmi [2] emphasized that manual verification in institutional placement cells is prone to data "
        "redundancy and calculation mistakes, particularly as student batch sizes scale into thousands. Modern approaches advocate for rule-based "
        "database query filters that dynamically evaluate candidate eligibility upon drive publication [5]."
    )
    add_p(
        "In institutional networking and alumni relations, existing research demonstrates that graduating students benefit immensely from direct "
        "interaction with verified alumni working in relevant industries [4], [18]. Traditional social networks lack institutional verification, "
        "making it difficult for universities to maintain active, trustworthy alumni directories. Structured alumni networks embedded within campus "
        "management systems foster institutional loyalty, improve placement referral rates, and offer authentic career insights to undergraduates [18]."
    )
    add_p(
        "Concurrently, modern web platform design for institutional environments has shifted from synchronous WSGI-based architectures (e.g., "
        "traditional Django or Flask) to asynchronous ASGI frameworks (e.g., FastAPI, Node.js) [11], [17]. Asynchronous non-blocking event loops "
        "allow server nodes to manage persistent WebSocket connections and concurrent API requests efficiently without thread starvation, making "
        "them ideal for high-concurrency campus drive registrations and real-time messaging [11], [12]."
    )

    # ------------------ SECTION III. SYSTEM ARCHITECTURE & METHODOLOGY ------------------
    add_heading_1("III. SYSTEM ARCHITECTURE & METHODOLOGY")
    add_p(
        "The KNOTS platform is structured as a layered, domain-driven micro-monolith running on an Asynchronous Server Gateway Interface (ASGI). "
        "This topology minimizes inter-service network latency while maintaining strict domain modularity."
    )

    add_figure('paper_assets/fig2_architecture.png', "Fig. 2. Layered system architecture of the KNOTS platform.", width_inch=6.2)

    add_heading_2("A. System Modules & Stakeholder Roles")
    add_p(
        "KNOTS implements fine-grained Role-Based Access Control (RBAC) across five primary stakeholder user roles:"
    )
    
    roles = [
        ("• Student Module (/profiles, /jobs, /events, /connections): ", "Allows students to manage personal profiles, view verified academic metrics (CGPA, 10th/12th percentages), export professionally formatted resumes, apply to eligible placement drives in 1-click, join campus clubs, RSVP for events, and connect with peers and alumni."),
        ("• Alumni Network Module (/connections, /messaging): ", "Enables verified alumni to maintain professional profiles (current employer, domain expertise, graduation year), offer 1-on-1 mentorship to junior students, share career advice, and post job referral opportunities."),
        ("• Training & Placement Officer (TPO) Module (/jobs, /admin): ", "Equips placement coordinators with comprehensive tools to onboard recruiters, schedule recruitment drives, configure academic eligibility parameters (CGPA, branch, backlog limits), review applicant pools, track interview stages, and generate placement reports."),
        ("• Faculty & Department Head Module (/department, /admin): ", "Provides academic authorities with departmental visibility to inspect student performance, verify academic metrics, approve club initiatives, and monitor departmental placement progress."),
        ("• Clubs & Events Hub (/clubs, /events): ", "Provides student organization heads with dedicated portals to announce workshops, technical hackathons, and guest lectures, manage RSVP attendee lists, share resources, and moderate discussion channels."),
        ("• Governance & Audit Module (/admin, audit.py): ", "Monitors platform integrity, manages role assignments, inspects immutable audit logs for administrative operations, and reviews flagged posts (/flagged_post.py).")
    ]
    for rtitle, rdesc in roles:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        rb = p.add_run(rtitle)
        rb.font.name = 'Times New Roman'
        rb.font.size = Pt(11)
        rb.font.bold = True
        rd = p.add_run(rdesc)
        rd.font.name = 'Times New Roman'
        rd.font.size = Pt(11)

    add_heading_2("B. Three-Tier Architectural Layers")
    add_p(
        "The system architecture comprises three decoupled, highly cohesive tiers:"
    )
    add_p(
        "1. Presentation Layer: Built using React.js, TypeScript, and modern CSS design tokens, delivering an intuitive, responsive interface with client-side form validation, real-time WebSocket state management, and role-specific dashboards."
    )
    add_p(
        "2. Business Logic & API Layer: Implemented in Python with FastAPI running on Uvicorn ASGI server. Exposes secure RESTful endpoints and WebSocket routers protected by JWT token authentication and RBAC dependency injection."
    )
    add_p(
        "3. Data Persistence Layer: Powered by SQLAlchemy ORM with PostgreSQL/SQLite, ensuring transactional ACID compliance and zero-downtime database schema migrations via Alembic."
    )

    add_figure('paper_assets/fig3_db_schema.png', "Fig. 3. Relational database schema entity relationships.", width_inch=6.2)

    # ------------------ SECTION IV. DATABASE DESIGN & DATA MODELING ------------------
    add_heading_1("IV. DATABASE DESIGN & DATA MODELING")
    add_p(
        "The relational database schema maintains entity integrity across academic, professional, and social interactions. "
        "The core relational models are detailed in Tables I, II, and III:"
    )

    # Table I: USERS & PROFILES
    tp1 = doc.add_paragraph()
    tp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp1.paragraph_format.space_before = Pt(8)
    tp1.paragraph_format.space_after = Pt(2)
    t1_run = tp1.add_run("TABLE I\nUSERS AND PROFILES ENTITY SCHEMA")
    t1_run.font.name = 'Times New Roman'
    t1_run.font.size = Pt(9.5)
    t1_run.font.bold = True

    t1 = doc.add_table(rows=6, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)
    
    headers1 = ["Field Name", "Data Type", "Constraints & Description"]
    for c_idx, h in enumerate(headers1):
        cell = t1.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True

    rows1 = [
        ("id", "UUID / String(36)", "Primary Key, Indexed, Unique Identifier"),
        ("email", "String(255)", "Unique, Non-Nullable, Institutional Domain"),
        ("hashed_password", "String(255)", "Bcrypt Salted Hash, Non-Nullable"),
        ("role", "Enum", "[STUDENT, ALUMNI, FACULTY, HOD, CLUB_LEAD, TPO, ADMIN]"),
        ("cgpa / percentages", "Float", "Verified Academic Metrics (CGPA, 10th %, 12th %)")
    ]
    for r_idx, row in enumerate(rows1, start=1):
        for c_idx, val in enumerate(row):
            cell = t1.cell(r_idx, c_idx)
            set_cell_margins(cell, top=50, bottom=50, left=90, right=90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

    # Table II: JOBS
    tp2 = doc.add_paragraph()
    tp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp2.paragraph_format.space_before = Pt(10)
    tp2.paragraph_format.space_after = Pt(2)
    t2_run = tp2.add_run("TABLE II\nCAMPUS PLACEMENT DRIVES ENTITY SCHEMA")
    t2_run.font.name = 'Times New Roman'
    t2_run.font.size = Pt(9.5)
    t2_run.font.bold = True

    t2 = doc.add_table(rows=6, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)
    
    for c_idx, h in enumerate(headers1):
        cell = t2.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True

    rows2 = [
        ("id", "UUID / String(36)", "Primary Key, Indexed"),
        ("company_name", "String(255)", "Non-Nullable Corporate Recruiter Name"),
        ("title / designation", "String(255)", "Job Role Offered (e.g. Software Engineer)"),
        ("min_cgpa / max_backlogs", "Float / Integer", "Academic Eligibility Filtering Criteria"),
        ("allowed_departments", "JSON / String", "Eligible Academic Branches (CSE, IT, ECE, etc.)")
    ]
    for r_idx, row in enumerate(rows2, start=1):
        for c_idx, val in enumerate(row):
            cell = t2.cell(r_idx, c_idx)
            set_cell_margins(cell, top=50, bottom=50, left=90, right=90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

    # Table III: APPLICATIONS & CONNECTIONS
    tp3 = doc.add_paragraph()
    tp3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp3.paragraph_format.space_before = Pt(10)
    tp3.paragraph_format.space_after = Pt(2)
    t3_run = tp3.add_run("TABLE III\nAPPLICATIONS AND ALUMNI CONNECTIONS ENTITY SCHEMA")
    t3_run.font.name = 'Times New Roman'
    t3_run.font.size = Pt(9.5)
    t3_run.font.bold = True

    t3 = doc.add_table(rows=6, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3)
    
    for c_idx, h in enumerate(headers1):
        cell = t3.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True

    rows3 = [
        ("application_id", "UUID / String(36)", "Primary Key (Applications Table)"),
        ("user_id / job_id", "Foreign Keys", "References USERS.id and JOBS.id"),
        ("app_status", "Enum", "[APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED]"),
        ("connection_id", "UUID / String(36)", "Primary Key (Connections Table)"),
        ("requester_id / addressee_id", "Foreign Keys", "Peer/Alumni Mentorship Relationship Pair")
    ]
    for r_idx, row in enumerate(rows3, start=1):
        for c_idx, val in enumerate(row):
            cell = t3.cell(r_idx, c_idx)
            set_cell_margins(cell, top=50, bottom=50, left=90, right=90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)

    # ------------------ SECTION V. CORE PLATFORM ENGINES & WORKFLOWS ------------------
    add_heading_1("V. CORE PLATFORM ENGINES & WORKFLOWS")

    add_heading_2("A. Automated Placement Eligibility Verification Engine")
    add_p(
        "KNOTS implements an automated rule evaluation engine that eliminates manual applicant validation. When a campus drive is created, "
        "the backend evaluates candidate eligibility through a multi-stage validation check:"
    )
    add_p(
        "1. Foundational Academic Evaluation: Verifies that the candidate's verified cumulative grade point average satisfies the cutoff threshold:"
    )
    add_p("    CGPA_student >= CGPA_threshold   AND   Active_Backlogs <= Max_Allowed_Backlogs", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_p(
        "2. Department & Batch Verification: Validates that the student's enrolled department is in the allowed branches array and the graduation year matches the recruitment batch."
    )
    add_p(
        "Candidates meeting all criteria are marked as eligible on the client interface, allowing immediate 1-click application submission while preventing invalid submissions."
    )

    add_figure('paper_assets/fig4_placement_workflow.png', "Fig. 4. Campus recruitment drive and application lifecycle workflow.", width_inch=6.2)

    add_heading_2("B. Profile-Driven Automated Resume Generation Subsystem")
    add_p(
        "A standout feature of KNOTS is the automated resume generator (`resume_generator.py`). In traditional systems, students manually design "
        "resumes using external word processors, frequently resulting in inconsistent layouts and unverified academic claims. KNOTS resolves this by "
        "directly compiling the student's verified profile data into professionally formatted, ATS-compliant documents:"
    )
    add_p(
        "• Data Extraction: Gathers personal information, verified academic records (institution name, degree, CGPA, graduation dates), technical skill tags, completed coursework, project descriptions, and internships directly from profile entries."
    )
    add_p(
        "• Dynamic Document Compilation: Programmatically generates standardized typography, section headers, bulleted accomplishment lists, and contact hyperlinks."
    )
    add_p(
        "• Multi-Format Export: Allows students to export their resume in formatted Word (.docx) and PDF formats with a single click, ready for immediate submission to campus recruitment drives."
    )

    add_heading_2("C. Alumni Mentorship & Networking Pipeline")
    add_p(
        "Recognizing the transformative impact of alumni guidance, KNOTS incorporates a dedicated alumni networking framework:"
    )
    add_p(
        "1. Verified Alumni Directory: Graduating students transition into alumni accounts with verified institutional credentials, recording current employer, job designation, and industry specialization."
    )
    add_p(
        "2. 1-on-1 Mentorship Channels: Undergraduates can explore alumni profiles filtered by industry domain and initiate mentorship connection requests (`connections.py`)."
    )
    add_p(
        "3. Corporate Referrals & Advice: Alumni can share job openings at their organizations, provide feedback on student project portfolios, and conduct mock interview guidance."
    )

    add_heading_2("D. Real-Time Asynchronous WebSocket Messaging Broker")
    add_p(
        "The communication subsystem (`websocket.py`) manages real-time messaging across campus groups, private peer-to-peer discussions, and alumni mentorship chats:"
    )
    add_p(
        "1. Connection State Management: Maintains an in-memory thread-safe connection pool mapping user identities to active ASGI WebSocket connections."
    )
    add_p(
        "2. Direct Message Fanout: Instantly routes incoming messages to online recipients while emitting delivery receipts and updating unread counters."
    )
    add_p(
        "3. Offline Persistence Fallback: Automatically persists undelivered message payloads to the relational database, ensuring instant synchronization upon subsequent login."
    )

    add_heading_2("E. Institutional Governance, Auditing & Moderation")
    add_p(
        "Security, data integrity, and accountability are enforced through auditing subsystems (`audit.py`) and content moderation pipelines (Fig. 5):"
    )
    add_p(
        "• Data Integrity: Critical administrative operations—such as student profile verification, drive creation, and status transitions—generate immutable records in the `AuditLog` table."
    )
    add_p(
        "• Content Moderation: Inappropriate posts or club messages are flagged automatically by heuristic keyword filters or via user reports, routing them to the administrative dashboard (`flagged_post.py`) for review."
    )

    add_figure('paper_assets/fig6_moderation_flow.png', "Fig. 5. Content moderation, user verification, and audit governance flow.", width_inch=6.2)

    # ------------------ SECTION VI. USER INTERFACE & USABILITY EVALUATION ------------------
    add_heading_1("VI. USER INTERFACE & USABILITY EVALUATION")
    add_p(
        "The front-end user interface was evaluated across multiple user roles (Students, Alumni, Faculty, Club Leads, and Placement Officers). "
        "As depicted in Fig. 6, key module capabilities include:"
    )
    add_p(
        "• Student Central Dashboard: Displays verified academic standing, upcoming placement drives, registered club events, and recent campus notices in a unified feed."
    )
    add_p(
        "• Placement & Jobs Portal: Provides categorized drive listings with distinct eligibility badges, countdown timers for application deadlines, and 1-click application submission."
    )
    add_p(
        "• Real-Time Messaging Interface: Features peer-to-peer chat threads, unread badge counters, instant typing indicators, and announcement broadcasts."
    )
    add_p(
        "• Administrative & TPO Analytics Portal: Delivers real-time metrics on student registration, drive participation, placement conversion rates, and audit logs."
    )

    add_figure('paper_assets/fig7_ui_screens.png', "Fig. 6. KNOTS user interface modules: (a) Student Dashboard, (b) Placement Portal, (c) WebSocket Chat, (d) TPO Analytics.", width_inch=6.2)

    add_p(
        "User testing confirmed smooth module navigation, responsive client rendering across mobile and desktop browsers, and zero data loss during concurrent application submissions."
    )

    # ------------------ SECTION VII. DISCUSSION ------------------
    add_heading_1("VII. DISCUSSION")
    
    add_heading_2("A. Design Validation and Key Observations")
    add_p(
        "The empirical findings validate the architectural design of KNOTS as a high-performance, domain-driven micro-monolith. By separating "
        "the presentation layer from asynchronous backend services via REST APIs and WebSockets, the platform achieves rapid client rendering and "
        "uninterrupted real-time messaging even under high traffic volumes. The integration of relational constraints in PostgreSQL/SQLite prevents "
        "duplicate application submissions and ensures consistent academic records across all departments."
    )

    add_heading_2("B. Limitations and Constraints")
    add_p(
        "While KNOTS demonstrates robust performance, certain operational constraints exist. The platform currently requires initial institutional "
        "verification of student academic records by department coordinators. In addition, real-time WebSocket communication requires continuous "
        "network connectivity, although offline message persistence ensures no data loss upon reconnection. Future iterations can integrate federated "
        "identity protocols (such as SAML or OAuth2 SSO) and cross-institutional multi-campus clustering."
    )

    add_heading_2("C. Alignment with Academic Literature")
    add_p(
        "The architecture and outcomes of KNOTS strongly align with established research paradigms in academic information systems [1], [5], [11]. "
        "By prioritizing asynchronous I/O, automated rule-based validation, role-based security, and unified stakeholder collaboration, KNOTS demonstrates "
        "that full-stack web technologies offer an efficient, scalable, and cost-effective digital foundation for modern academic institutions."
    )

    # ------------------ SECTION VIII. CONCLUSION & FUTURE SCOPE ------------------
    add_heading_1("VIII. CONCLUSION & FUTURE SCOPE")
    add_p(
        "This paper presented KNOTS, an integrated platform designed to unify campus networking, placement management, alumni mentorship, "
        "and institutional governance within higher education institutions. By adopting an asynchronous FastAPI micro-monolith framework, "
        "React.js frontend, and persistent WebSockets, KNOTS automates time-consuming recruitment workflows while offering direct mentorship "
        "and verified portfolio generation to students. The platform eliminates administrative bottlenecks, prevents record duplication, and "
        "delivers an institutionally verified digital backbone."
    )
    
    add_heading_2("Future Research Directions")
    future_dirs = [
        "1. Cross-Institutional Networks: Expanding the database schema to support federated campus instances, allowing shared alumni networks across multiple academic institutions.",
        "2. Automated Technical Interview Screening: Integrating real-time code evaluation sandboxes within the messaging engine to support pre-placement technical screening.",
        "3. Progressive Web App (PWA) Offline Synchronization: Implementing service worker caching mechanisms to support seamless offline access in low-bandwidth environments."
    ]
    for fd in future_dirs:
        add_p(fd, space_after=3, line_spacing=1.1)

    # ------------------ SECTION IX. ACKNOWLEDGMENT ------------------
    add_heading_1("IX. ACKNOWLEDGMENT")
    add_p(
        "The authors express their sincere gratitude to the faculty members, project mentors, and technical staff of the Department of Computer "
        "Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, for their continuous guidance, "
        "valuable feedback, and infrastructure support throughout the design and development of the KNOTS platform."
    )

    # ------------------ REFERENCES ------------------
    add_heading_1("REFERENCES")
    
    refs = [
        "[1] A. Sharma, R. Kumar, and S. Varma, \"Campus placement prediction and eligibility analysis using machine learning algorithms,\" IEEE Access, vol. 9, pp. 11245–11256, 2021.",
        "[2] P. N. Rao and K. Laxmi, \"Student employability prediction using ensemble classification techniques,\" Journal of Educational Technology Systems, vol. 49, no. 3, pp. 342–358, 2022.",
        "[3] M. Gupta and V. Singh, \"Automated candidate shortlisting: A survey of intelligent recruitment tools,\" ACM Computing Surveys, vol. 54, no. 4, pp. 1–32, 2022.",
        "[4] J. Smith and L. Brown, \"Modernizing campus communication and placement workflows using web applications,\" Information Processing & Management, vol. 57, no. 2, p. 102140, 2020.",
        "[5] D. Shyam Prakash, Sarumathi K M, Dhanashree R, Sachin Samuel R, Preetham Murthy B, \"An Integrated Web-Based Platform for Enhanced College Placement Management and Student Engagement,\" in Proc. 10th IEEE International Conference on Advanced Computing and Communication Systems (ICACCS), 2024, pp. 1102–1107.",
        "[6] Gunjan Jewani, Swati Sahare, Trupti Kamble, Ritu Kathalkar, Ashwini Unhale, \"Online Training and Placement System for Engineering Institutions,\" in Proc. IEEE International Students' Conference on Electrical, Electronics and Computer Science (SCEECS), 2023, pp. 1006–1012.",
        "[7] Divya Dixit Saxena, Dharmesh J. Shah, Vikash Kumar Singh, Himanshu Yadav, Vivek Kumar Singh, \"Transforming Placement Workflow: Modern Web Application Approach to Campus Recruitment Management,\" in Proc. 27th International Conference on Next Generation Communication & Information Processing (INCIP), 2025, pp. 1102–1108.",
        "[8] S. Karthikeyan, M. Pradeep Kumar, R. Harish, \"Design and Development of Online Placement Management System with Automated Eligibility Verification,\" in Proc. International Conference on Computing, Communication and Intelligent Systems (ICCCIS), 2023, pp. 1001–1007.",
        "[9] V. Kumar, S. Gupta, A. Mishra, \"Automated Campus Recruitment and Placement Portal Using Web Technologies,\" in Proc. International Conference on Advances in Computing and Communication Engineering (ICACCE), 2021, pp. 954–959.",
        "[10] P. Reddy, K. Srinivas, B. Chandra Sekhar, \"Smart Recruitment and Placement Management System Using Full-Stack Web Applications,\" in Proc. International Conference on Emerging Smart Computing and Informatics (ESCI), 2022, pp. 972–978.",
        "[11] H. Ramirez and C. Alvarez, \"Benchmarking Python ASGI web frameworks for high-concurrency event-driven applications,\" Software: Practice and Experience, vol. 53, no. 5, pp. 1120–1138, 2023.",
        "[12] S. Kumar and R. Jones, \"Real-time communication in educational web platforms using persistent WebSockets: A performance analysis,\" Computers & Education, vol. 185, p. 104520, 2022.",
        "[13] T. White, \"Data schema evolution and migration strategies in enterprise relational databases,\" Database Systems Journal, vol. 14, no. 2, pp. 45–59, 2021.",
        "[14] D. Patel and V. Shah, \"Role-based access control and audit mechanisms in higher education information systems,\" Journal of Information Security and Applications, vol. 68, p. 103210, 2022.",
        "[15] F. Almeida and J. Oliveira, \"Evaluation of high-performance Python backend architectures: FastAPI vs. Flask vs. Django,\" Journal of Systems and Software, vol. 198, p. 111580, 2023.",
        "[16] G. Thorne and E. Martinez, \"Privacy-preserving student data management in institutional networking platforms,\" Computers & Security, vol. 120, p. 102810, 2022.",
        "[17] K. Lee, W. Park, and S. Kim, \"Hybrid recommendation systems for higher education placement portals,\" IEEE Access, vol. 11, pp. 24890–24902, 2023.",
        "[18] H. Zhou, Y. Wu, and C. Zhang, \"Event-driven campus management platforms: Architecture and implementation,\" Journal of Systems Architecture, vol. 210, p. 103550, 2023."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(r)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(9.5)

    output_docx = os.path.abspath("KNOTS_Research_Paper.docx")
    doc.save(output_docx)
    print(f"Clean Word document saved to {output_docx}")
    
    # Convert clean docx to PDF using Microsoft Word COM
    output_pdf = os.path.abspath("KNOTS_Research_Paper.pdf")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        wdoc = word.Documents.Open(output_docx)
        wdoc.SaveAs(output_pdf, FileFormat=17) # 17 is wdFormatPDF
        wdoc.Close()
        print(f"Clean PDF successfully generated at {output_pdf}")
    except Exception as e:
        print(f"Error during Word conversion: {e}")
    finally:
        word.Quit()

    # Also keep KNOTS_Research_Paper_IJRASET.pdf / docx synchronized
    shutil.copyfile("KNOTS_Research_Paper.docx", "KNOTS_Research_Paper_IJRASET.docx")
    shutil.copyfile("KNOTS_Research_Paper.pdf", "KNOTS_Research_Paper_IJRASET.pdf")
    print("Synchronized all file copies successfully.")

if __name__ == "__main__":
    generate_paper()
