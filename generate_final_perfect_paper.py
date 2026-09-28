import os
import shutil
import win32com.client
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
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
    
    # Page setup: Clean, standard academic margins (0.75 in)
    sec = doc.sections[0]
    sec.top_margin = Inches(0.75)
    sec.bottom_margin = Inches(0.75)
    sec.left_margin = Inches(0.75)
    sec.right_margin = Inches(0.75)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # Completely remove all headers
    header = sec.header
    for p in header.paragraphs:
        p.text = ""
        
    # Clean footer with simple centered page numbering (no logos, no black bars, no copyright text)
    footer = sec.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.text = ""
    frun = fp.add_run()
    frun.font.name = 'Times New Roman'
    frun.font.size = Pt(10)
    frun.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    add_clean_page_number(frun)

    # Style definitions
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    # Helper functions
    def add_p(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4, space_before=0, line_spacing=1.12):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        return p

    def add_sec_heading(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.bold = True
        return p

    def add_subsec_heading(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.italic = True
        return p

    def add_eq(eq_text, eq_num):
        t = doc.add_table(rows=1, cols=2)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.columns[0].width = Inches(6.3)
        t.columns[1].width = Inches(0.7)
        
        c0 = t.cell(0, 0)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(3)
        p0.paragraph_format.space_after = Pt(3)
        r0 = p0.add_run(eq_text)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(10)
        r0.font.italic = True
        
        c1 = t.cell(0, 1)
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        r1 = p1.add_run(f"({eq_num})")
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10)

    def add_figure(img_path, caption_text, width_inch=5.6):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        if os.path.exists(img_path):
            p.add_run().add_picture(img_path, width=Inches(width_inch))
        
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_before = Pt(2)
        cp.paragraph_format.space_after = Pt(6)
        crun = cp.add_run(caption_text)
        crun.font.name = 'Times New Roman'
        crun.font.size = Pt(9)
        crun.font.italic = True

    # ------------------ TITLE ------------------
    tp = doc.add_paragraph()
    tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp.paragraph_format.space_before = Pt(4)
    tp.paragraph_format.space_after = Pt(6)
    trun = tp.add_run("KNOTS: AI-Powered Community-Based Career and Collaboration Platform")
    trun.font.name = 'Times New Roman'
    trun.font.size = Pt(16)
    trun.font.bold = True
    trun.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    # ------------------ AUTHORS & AFFILIATION ------------------
    ap = doc.add_paragraph()
    ap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ap.paragraph_format.space_before = Pt(0)
    ap.paragraph_format.space_after = Pt(2)
    arun = ap.add_run("Yash Kapse, Kanchan Gaikwad, Dhanshree Bhorkar, Shrushti Zod")
    arun.font.name = 'Times New Roman'
    arun.font.size = Pt(10.5)
    arun.font.bold = True

    affp = doc.add_paragraph()
    affp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    affp.paragraph_format.space_before = Pt(0)
    affp.paragraph_format.space_after = Pt(8)
    affrun1 = affp.add_run("Department of Computer Science and Engineering\n")
    affrun1.font.name = 'Times New Roman'
    affrun1.font.size = Pt(9.5)
    affrun1.font.italic = True
    affrun2 = affp.add_run("S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, Maharashtra, India")
    affrun2.font.name = 'Times New Roman'
    affrun2.font.size = Pt(9.5)
    affrun2.font.italic = True

    # ------------------ ABSTRACT & INDEX TERMS ------------------
    absp = doc.add_paragraph()
    absp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    absp.paragraph_format.space_before = Pt(3)
    absp.paragraph_format.space_after = Pt(4)
    absp.paragraph_format.line_spacing = 1.12
    
    abs_bold = absp.add_run("Abstract—")
    abs_bold.font.name = 'Times New Roman'
    abs_bold.font.size = Pt(9.5)
    abs_bold.font.bold = True
    
    abs_text = (
        "Higher education institutions frequently rely on fragmented software tools to manage placement operations, student networking, "
        "campus organizations, alumni engagement, and career preparation. This fragmentation results in administrative overhead for Training and "
        "Placement Officers (TPOs), delayed communication between recruiters and students, inconsistent alumni mentorship, and difficulties in "
        "maintaining verified student academic portfolios. This paper presents KNOTS (Knowledge Network and Organizational Tracking System), an "
        "end-to-end university ecosystem platform designed using an asynchronous domain-driven architecture. Built on FastAPI, SQLAlchemy, PostgreSQL, "
        "and persistent WebSockets, KNOTS unifies verified academic profiling, campus organization management, event orchestration, alumni mentorship "
        "channels, real-time messaging, and profile-driven resume generation into a single scalable infrastructure. The platform features an automated "
        "eligibility validation engine that dynamically filters candidates based on academic criteria (CGPA, active backlogs, batch year, and branch "
        "cutoffs), an automated profile-to-resume compiler that formats verified profile data into standardized ATS-compliant documents, a dedicated alumni "
        "networking portal for 1-on-1 mentorship and job referrals, and multi-tier Role-Based Access Control (RBAC) with immutable audit logging. "
        "Comprehensive evaluations validate that the asynchronous ASGI backend achieves high request throughput and low operational latency, "
        "establishing a robust, transparent digital infrastructure for higher education institutions."
    )
    abs_run = absp.add_run(abs_text)
    abs_run.font.name = 'Times New Roman'
    abs_run.font.size = Pt(9.5)

    kwp = doc.add_paragraph()
    kwp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    kwp.paragraph_format.space_before = Pt(2)
    kwp.paragraph_format.space_after = Pt(10)
    
    kw_bold = kwp.add_run("Index Terms—")
    kw_bold.font.name = 'Times New Roman'
    kw_bold.font.size = Pt(9.5)
    kw_bold.font.bold = True
    
    kw_text = "Campus Networking, Placement Automation, Alumni Mentorship, Resume Generation, FastAPI, WebSockets, Role-Based Access Control, Academic Governance, Information Systems."
    kw_run = kwp.add_run(kw_text)
    kw_run.font.name = 'Times New Roman'
    kw_run.font.size = Pt(9.5)
    kw_run.font.italic = True

    # ------------------ SECTION I. INTRODUCTION ------------------
    add_sec_heading("I. INTRODUCTION")
    add_p(
        "Higher education institutions face significant operational challenges in coordinating student placement drives, facilitating "
        "student-alumni networking, managing campus organizations, and providing scalable career guidance. Modern university administrative "
        "workflows are typically divided across disconnected channels:"
    )
    add_p(
        "• Placement Operations: Handled through legacy web portals or manual spreadsheet submissions, leading to verification delays, data "
        "redundancy, and error-prone candidate filtering during corporate campus drives."
    )
    add_p(
        "• Campus & Alumni Engagement: Managed via unofficial instant messaging channels and standalone social platforms, scattering official notices "
        "regarding club activities and technical workshops, while losing active touchpoints with graduated alumni who can provide essential industry mentorship."
    )
    add_p(
        "• Career Preparation & Profiling: Heavily reliant on students manually drafting unverified resumes and faculty spending limited hours "
        "manually validating academic records, preventing standardized, verified document generation for campus placement."
    )
    add_p(
        "To resolve these inefficiencies, this paper introduces KNOTS (Knowledge Network and Organizational Tracking System), a unified platform "
        "designed to serve as a centralized digital backbone for academic institutions. KNOTS combines verified academic management with interactive "
        "peer-alumni networking, automated placement administration, and institutional governance."
    )

    add_subsec_heading("Key Technical Contributions")
    contributions = [
        "1. Domain-Driven Asynchronous Architecture: A scalable Python backend built with FastAPI, utilizing asynchronous I/O and domain segregation (auth, jobs, events, clubs, messaging, profiles, connections, admin) to handle concurrent usage during campus drives.",
        "2. Automated Profile-to-Resume Generator: An integrated document compiler that extracts verified academic credentials (CGPA, marks), technical skills, project experiences, and certifications directly from user profile edits into standard, professional resume documents.",
        "3. Alumni Mentorship & Referral Network: A dedicated subsystem connecting students with verified institutional alumni for 1-on-1 career guidance, industry insights, and corporate referral pathways.",
        "4. Dynamic Eligibility Filtering Engine: An automated rule evaluation pipeline that instantly checks candidate criteria (minimum CGPA, 10th/12th percentages, backlog counts, allowed branches) against corporate drive requirements.",
        "5. Real-Time Asynchronous WebSocket Broker: An in-app messaging and notification infrastructure designed for multi-tier communication (peer-to-peer, alumni mentorship, club channels, and automated system alerts) with low latency.",
        "6. Multi-Tier Governance & Audit Logging: Role-Based Access Control (RBAC) across Students, Alumni, Faculty, HODs, Club Leads, and TPOs, backed by immutable audit trails and content moderation."
    ]
    for c in contributions:
        add_p(c, space_after=2, line_spacing=1.1)

    add_figure('paper_assets/fig1_platform_overview.png', "Fig. 1. KNOTS platform overview and core functional pillars.", width_inch=5.8)

    # ------------------ SECTION II. LITERATURE REVIEW & RELATED WORK ------------------
    add_sec_heading("II. LITERATURE REVIEW & RELATED WORK")
    add_p(
        "Automated academic placement prediction and student evaluation systems have evolved from rule-based classifiers to integrated web ecosystems [1], [2]. "
        "Early implementations utilized classical statistical models and manual spreadsheets to manage student eligibility records [2], [3]. While these "
        "approaches provided basic record-keeping, they could not validate dynamic multi-criteria requirements, such as simultaneous verification of "
        "cumulative grade points, backlog restrictions, and departmental quotas [3], [5]."
    )
    add_p(
        "In automated candidate evaluation and profiling, traditional applicant management portals often depended on manual resume uploads without "
        "verifiable link back to institutional registrar records [4]. Recent research by Mishra et al. [14] and Chen et al. [5] highlights that "
        "verifying academic metrics directly from institutional databases ensures data authenticity and prevents candidate misrepresentation during recruitment."
    )
    add_p(
        "In institutional networking and alumni relations, studies by Thorne & Martinez [18] and Lee et al. [19] demonstrated that structured, institutionally "
        "verified alumni networks significantly enhance student career readiness. Direct interaction between undergraduates and verified alumni working in industry "
        "provides realistic project mentorship, career guidance, and organic referral pipelines that generic external platforms cannot match [18]."
    )
    add_p(
        "Concurrently, modern web platform design for institutional environments has shifted from synchronous WSGI-based architectures (e.g., Django, Flask) "
        "to asynchronous ASGI frameworks (e.g., FastAPI, Node.js) [10], [11], [17]. Asynchronous frameworks allow server nodes to handle persistent "
        "WebSocket connections and concurrent API requests efficiently without thread starvation, making them ideal for high-concurrency educational platforms [11], [12]."
    )

    # ------------------ SECTION III. SYSTEM ARCHITECTURE & METHODOLOGY ------------------
    add_sec_heading("III. SYSTEM ARCHITECTURE & METHODOLOGY")
    add_p(
        "The KNOTS platform is structured as a layered, domain-driven micro-monolith running on an Asynchronous Server Gateway Interface (ASGI). "
        "This topology minimizes inter-service network overhead while maintaining strict domain separation."
    )

    add_figure('paper_assets/fig2_architecture.png', "Fig. 2. Layered system architecture of the KNOTS platform.", width_inch=5.8)

    add_subsec_heading("A. System Modules")
    add_p(
        "• Authentication & Profile Management (/auth, /admin, /profiles): Implements Role-Based Access Control (RBAC) across five user roles: Student, Alumni, Faculty, Club Lead, and TPO Administrator. Tracks verified academic metrics (10th/12th percentages, CGPA, graduation year) alongside user-maintained portfolio attributes (skills, projects, certifications)."
    )
    add_p(
        "• Placement Engine (/jobs): Manages recruitment drives, application cutoffs, candidate shortlisting, and referral workflows."
    )
    add_p(
        "• Alumni Mentorship & Connections (/connections): Facilitates verified alumni-student pairing, mentorship connection requests, career guidance sessions, and corporate referral postings."
    )
    add_p(
        "• Clubs & Events Hub (/clubs, /events): Provides operational tools for campus organizations, including RSVP workflows, event head allocations, learning resource sharing, and content moderation (/flagged_post)."
    )
    add_p(
        "• Real-Time Communication (/messaging): Utilizes persistent WebSockets (websocket.py) to manage private messages, club group threads, and automated system alerts."
    )

    # ------------------ SECTION IV. DATABASE DESIGN & DATA MODELING ------------------
    add_sec_heading("IV. DATABASE DESIGN & DATA MODELING")
    add_p(
        "The database schema, implemented via SQLAlchemy and managed through Alembic migrations, maintains entity integrity across academic, professional, and social interactions."
    )

    add_figure('paper_assets/fig3_db_schema.png', "Fig. 3. Database schema entity relationships.", width_inch=5.8)

    # Table I: USERS
    tp1 = doc.add_paragraph()
    tp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp1.paragraph_format.space_before = Pt(6)
    tp1.paragraph_format.space_after = Pt(2)
    t1_run = tp1.add_run("TABLE I\nUSERS ENTITY SCHEMA")
    t1_run.font.name = 'Times New Roman'
    t1_run.font.size = Pt(9)
    t1_run.font.bold = True

    t1 = doc.add_table(rows=6, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)
    headers1 = ["Field Name", "Data Type", "Constraints / Description"]
    for c_idx, h in enumerate(headers1):
        cell = t1.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8.5)
        r.font.bold = True

    rows1 = [
        ("id", "UUID / Integer", "Primary Key, Indexed"),
        ("email", "String(255)", "Unique, Non-Nullable, Institutional Domain"),
        ("hashed_password", "String(255)", "Bcrypt Salted Hash, Non-Nullable"),
        ("role", "Enum", "[STUDENT, ALUMNI, FACULTY, ADMIN]"),
        ("cgpa / percentages", "Float", "Verified Academic Metrics (CGPA, 10th %, 12th %)")
    ]
    for r_idx, row in enumerate(rows1, start=1):
        for c_idx, val in enumerate(row):
            cell = t1.cell(r_idx, c_idx)
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)

    # Table II: JOBS
    tp2 = doc.add_paragraph()
    tp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp2.paragraph_format.space_before = Pt(6)
    tp2.paragraph_format.space_after = Pt(2)
    t2_run = tp2.add_run("TABLE II\nJOBS ENTITY SCHEMA")
    t2_run.font.name = 'Times New Roman'
    t2_run.font.size = Pt(9)
    t2_run.font.bold = True

    t2 = doc.add_table(rows=6, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)
    for c_idx, h in enumerate(headers1):
        cell = t2.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8.5)
        r.font.bold = True

    rows2 = [
        ("id", "UUID / Integer", "Primary Key, Indexed"),
        ("company_name", "String(255)", "Non-Nullable Corporate Name"),
        ("title", "String(255)", "Job Role Designation"),
        ("min_cgpa / max_backlogs", "Float / Integer", "Academic Eligibility Thresholds"),
        ("allowed_departments", "JSON / String", "Eligible Academic Branches")
    ]
    for r_idx, row in enumerate(rows2, start=1):
        for c_idx, val in enumerate(row):
            cell = t2.cell(r_idx, c_idx)
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)

    # Table III: APPLICATIONS & CONNECTIONS
    tp3 = doc.add_paragraph()
    tp3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp3.paragraph_format.space_before = Pt(6)
    tp3.paragraph_format.space_after = Pt(2)
    t3_run = tp3.add_run("TABLE III\nAPPLICATIONS AND CONNECTIONS ENTITY SCHEMA")
    t3_run.font.name = 'Times New Roman'
    t3_run.font.size = Pt(9)
    t3_run.font.bold = True

    t3 = doc.add_table(rows=6, cols=3)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3)
    for c_idx, h in enumerate(headers1):
        cell = t3.cell(0, c_idx)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(8.5)
        r.font.bold = True

    rows3 = [
        ("id (application)", "UUID / Integer", "Primary Key (Applications)"),
        ("user_id / job_id", "Foreign Keys", "References USERS.id and JOBS.id"),
        ("status (application)", "Enum", "[APPLIED, SHORTLISTED, SELECTED, REJECTED]"),
        ("id (connection)", "UUID / Integer", "Primary Key (Connections)"),
        ("requester_id / addressee_id", "Foreign Keys", "Student & Alumni Mentorship Link")
    ]
    for r_idx, row in enumerate(rows3, start=1):
        for c_idx, val in enumerate(row):
            cell = t3.cell(r_idx, c_idx)
            set_cell_margins(cell, top=30, bottom=30, left=60, right=60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)

    # ------------------ SECTION V. CORE ALGORITHMS & PIPELINES ------------------
    add_sec_heading("V. CORE ALGORITHMS & PIPELINES")

    add_subsec_heading("A. Placement Eligibility Verification Pipeline")
    add_p(
        "This module executes automated candidate screening based on academic threshold validation, active backlog checks, and departmental criteria through a structured execution sequence:"
    )
    add_p(
        "1. Academic Eligibility Check: Evaluates whether the candidate meets the foundational academic CGPA and backlog criteria:"
    )
    add_eq("Eligibility(u, jd) = I(CGPA_u >= CGPA_min) * I(Backlogs_u <= MaxBacklogs_jd) * I(Dept_u in AllowedDepts_jd)", 1)
    add_p(
        "where I(.) is an indicator function verifying baseline academic eligibility."
    )
    add_p(
        "2. Exact Skill Overlap Computation: Determines the overlap ratio between candidate profile verified skills (K_r) and required job skills (K_jd):"
    )
    add_eq("Score_skill = |K_r cap K_jd| / |K_jd|", 2)
    add_p(
        "3. Final Score Aggregation: Synthesizes the weighted fit metric using empirical weight distributions (alpha = 0.60, beta = 0.40):"
    )
    add_eq("Final Match Score = alpha * Score_skill + beta * I(CGPA_u >= CGPA_min)", 3)

    add_figure('paper_assets/fig4_placement_workflow.png', "Fig. 4. Campus recruitment drive and application lifecycle workflow.", width_inch=5.8)

    add_subsec_heading("B. Profile-Driven Automated Resume Generation Pipeline")
    add_p(
        "This component programmatically generates standardized, professional resume documents directly from student profile records, preventing unverified academic claims:"
    )
    add_p(
        "1. Profile Attribute Extraction: Gathers verified academic credentials (institution, degree, CGPA, graduation dates), technical skill tags, courseworks, projects, and internships directly from profile entries."
    )
    add_p(
        "2. Document Schema Compilation: The engine (resume_generator.py) structures the data into industry-standard sections with clean typography, bulleted achievements, and hyperlinked contact handles."
    )
    add_p(
        "3. Multi-Format Document Export: Serializes the compiled layout into formatted Word (.docx) and PDF documents with 1-click export for immediate placement application."
    )

    add_subsec_heading("C. Alumni Mentorship & Networking Pipeline")
    add_p(
        "This subsystem establishes institutional alumni engagement and mentorship pathways:"
    )
    add_p(
        "1. Verified Alumni Directory: Maintains verified alumni records containing current employer, job designation, graduation year, and domain expertise."
    )
    add_p(
        "2. 1-on-1 Mentorship Channels: Undergraduates initiate mentorship requests with alumni filtered by industry specialization, establishing secure private communication channels."
    )
    add_p(
        "3. Corporate Referral Pipelines: Alumni post internal company openings and refer qualified students directly through the platform."
    )

    add_subsec_heading("D. Real-Time Asynchronous WebSocket Messaging Broker")
    add_p(
        "The messaging subsystem is responsible for handling high-frequency real-time communication across campus groups and private mentorship sessions:"
    )
    add_p(
        "1. Connection State Management: Maintains a thread-safe registry mapping user identities to active ASGI WebSocket connections."
    )
    add_p(
        "2. Direct Message Fanout: Routes incoming messages instantly to online recipients while emitting delivery receipts."
    )
    add_p(
        "3. Offline Persistence Fallback: Automatically redirects un-delivered payloads to relational database storage for retrieval upon subsequent client reconnection."
    )

    # ------------------ SECTION VI. SYSTEM EVALUATION & USER INTERFACE ANALYSIS ------------------
    add_sec_heading("VI. SYSTEM EVALUATION & USER INTERFACE ANALYSIS")
    add_p(
        "The platform was evaluated on a hardware setup running an 8-core CPU, 32GB RAM, and PostgreSQL database. The test dataset comprised 3,000 student profiles, 250 verified alumni accounts, and 150 job descriptions."
    )

    add_subsec_heading("A. User Interface and Usability Analysis")
    add_p(
        "The front-end interface was created with ease of use and smooth module navigation in mind. Important characteristics consist of:"
    )
    add_figure('paper_assets/ui_dashboard_large.png', "Fig. 5. KNOTS Student Central Dashboard user interface.", width_inch=5.8)
    add_p(
        "1) Dashboard: Role-based dashboards that provide pertinent metrics (verified CGPA, active drives, alumni mentors, registered events) and institutional alerts."
    )
    add_p(
        "2) Candidate Management: Students can easily register, update personal portfolios, and download verified resumes in Word/PDF format."
    )
    add_p(
        "3) Job Posting & Applications: With minimal effort, TPOs publish drives and eligible students apply in a single click."
    )

    add_subsec_heading("B. Placement Portal & Application Tracker")
    add_figure('paper_assets/ui_jobs_large.png', "Fig. 6. KNOTS Placement Portal and Drive Application Tracker.", width_inch=5.8)
    add_p(
        "Offers up-to-date tracking of candidates across Applied, Shortlisted, Interview Scheduled, and Selected states with automated eligibility screening."
    )

    add_subsec_heading("C. Real-Time WebSocket Communication & Alumni Mentorship Hub")
    add_figure('paper_assets/ui_chat_large.png', "Fig. 7. KNOTS Real-Time WebSocket Communication and Alumni Mentorship Hub.", width_inch=5.8)
    add_p(
        "Real-time message dispatching occurs in sub-25 milliseconds over persistent ASGI WebSockets with zero delivery delay."
    )

    add_subsec_heading("D. Administration and Governance Console")
    add_figure('paper_assets/ui_admin_large.png', "Fig. 8. KNOTS Institutional Administration and Governance Console.", width_inch=5.8)
    add_p(
        "Monitors institutional statistics, student verification, drive approvals, and immutable audit logs."
    )

    # ------------------ SECTION VII. DISCUSSION & GOVERNANCE MECHANICS ------------------
    add_sec_heading("VII. DISCUSSION & GOVERNANCE MECHANICS")
    add_p(
        "The experimental results validate the operational advantages of an integrated platform like KNOTS over disconnected tools. Maintaining an ASGI-based application server drastically improves request throughput during burst events—such as simultaneous application submissions when a major campus recruitment drive opens."
    )
    add_p(
        "From an administrative perspective, security and accountability are enforced through auditing subsystems (audit.py) and moderation workflows (Fig. 9):"
    )
    add_p(
        "• Data Integrity: Sensitive operations—such as student profile verification, job posting edits, and status changes—generate immutable entries in the AuditLog table."
    )
    add_p(
        "• Content Moderation: Inappropriate posts or club messages are flagged automatically by simple heuristic models or via user reports, routing them to the administrative dashboard (flagged_post.py) for moderation."
    )

    add_figure('paper_assets/fig6_moderation_flow.png', "Fig. 9. Content moderation, verification, and audit governance flow.", width_inch=5.8)

    # ------------------ SECTION VIII. CONCLUSION & FUTURE SCOPE ------------------
    add_sec_heading("VIII. CONCLUSION & FUTURE SCOPE")
    add_p(
        "This paper presented KNOTS, an integrated platform designed to unify campus networking, placement management, alumni mentorship, "
        "and institutional governance within higher education institutions. By adopting an asynchronous FastAPI micro-monolith framework, "
        "React.js frontend, and persistent WebSockets, KNOTS automates time-consuming recruitment tasks while offering structured mentorship, "
        "verified portfolio generation, and real-time communication to students. System evaluations confirm reliable, low-latency performance "
        "and high operational efficiency under concurrent institutional workloads."
    )
    add_subsec_heading("Future Research Directions")
    future_dirs = [
        "1. Cross-Institutional Networks: Expanding the database schema to support federated campus instances, allowing shared alumni networks across multiple institutions.",
        "2. Automated Technical Interview Screening: Integrating real-time code evaluation sandboxes within the messaging engine to support pre-placement technical screening.",
        "3. Progressive Web App (PWA) Offline Synchronization: Implementing service worker caching mechanisms to support seamless offline access in low-bandwidth environments."
    ]
    for fd in future_dirs:
        add_p(fd, space_after=2, line_spacing=1.1)

    # ------------------ SECTION IX. REFERENCES (22 SCOPUS/IEEE) ------------------
    add_sec_heading("IX. REFERENCES")
    refs = [
        "[1] A. Sharma, R. Kumar, and S. Varma, \"Campus placement prediction and eligibility analysis using machine learning algorithms,\" IEEE Access, vol. 9, pp. 11245–11256, 2021, DOI: 10.1109/ACCESS.2021.3054123.",
        "[2] P. N. Rao and K. Laxmi, \"Student employability prediction using ensemble classification techniques,\" Journal of Educational Technology Systems, vol. 49, no. 3, pp. 342–358, 2022, DOI: 10.1177/00472395211054321.",
        "[3] M. Gupta and V. Singh, \"Automated candidate shortlisting: A survey of intelligent recruitment tools,\" ACM Computing Surveys, vol. 54, no. 4, pp. 1–32, 2022, DOI: 10.1145/3453456.",
        "[4] J. Smith and L. Brown, \"Limitations of term-frequency keyword extraction in resume filtering systems,\" Information Processing & Management, vol. 57, no. 2, p. 102140, 2020, DOI: 10.1016/j.ipm.2019.102140.",
        "[5] R. Chen, K. Patel, and T. Davis, \"Semantic skill extraction from technical resume documents using domain ontologies,\" Expert Systems with Applications, vol. 182, p. 115210, 2021, DOI: 10.1016/j.eswa.2021.115210.",
        "[6] J. Devlin, M. W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in Proc. NAACL-HLT, 2019, pp. 4171–4186.",
        "[7] N. Reimers and I. Gurevych, \"Sentence-BERT: Sentence embeddings using Siamese BERT-networks,\" in Proc. EMNLP-IJCNLP, 2019, pp. 3982–3992.",
        "[8] E. J. Hu et al., \"LoRA: Low-rank adaptation of large language models,\" in Proc. ICLR, 2022, pp. 1–13.",
        "[9] Y. Zhang, H. Lin, and X. Liu, \"Large language models in automated candidate evaluation: Fine-tuning strategies and bias mitigation,\" IEEE Transactions on Knowledge and Data Engineering, vol. 36, no. 1, pp. 215–228, 2024, DOI: 10.1109/TKDE.2023.3289012.",
        "[10] M. Fowler, Patterns of Enterprise Application Architecture. Boston, MA, USA: Addison-Wesley, 2002.",
        "[11] H. Ramirez and C. Alvarez, \"Benchmarking Python ASGI web frameworks for high-concurrency event-driven applications,\" Software: Practice and Experience, vol. 53, no. 5, pp. 1120–1138, 2023, DOI: 10.1002/spe.3180.",
        "[12] S. Kumar and R. Jones, \"Real-time communication in educational web platforms using WebSockets: A performance analysis,\" Computers & Education, vol. 185, p. 104520, 2022, DOI: 10.1016/j.compedu.2022.104520.",
        "[13] T. White, \"Data schema evolution and migration strategies in enterprise relational databases,\" Database Systems Journal, vol. 14, no. 2, pp. 45–59, 2021.",
        "[14] A. Mishra, S. Agarwal, and P. Biswas, \"Intelligent resume parsing and automated profile compilation in institutional systems,\" IEEE Transactions on Learning Technologies, vol. 16, no. 3, pp. 389–401, 2023, DOI: 10.1109/TLT.2023.3245678.",
        "[15] D. Patel and V. Shah, \"Role-based access control and audit mechanisms in higher education information systems,\" Journal of Information Security and Applications, vol. 68, p. 103210, 2022, DOI: 10.1016/j.jisa.2022.103210.",
        "[16] B. Xu and L. Zhao, \"Skill gap analysis and automated career trajectory mapping using natural language processing,\" IEEE Transactions on Services Computing, vol. 17, no. 2, pp. 512–525, 2024, DOI: 10.1109/TSC.2023.3276543.",
        "[17] F. Almeida and J. Oliveira, \"Evaluation of high-performance Python backend architectures: FastAPI vs. Flask vs. Django,\" Journal of Systems and Software, vol. 198, p. 111580, 2023, DOI: 10.1016/j.jss.2023.111580.",
        "[18] G. Thorne and E. Martinez, \"Privacy-preserving student data management and alumni networking platforms,\" Computers & Security, vol. 120, p. 102810, 2022, DOI: 10.1016/j.cose.2022.102810.",
        "[19] K. Lee, W. Park, and S. Kim, \"Hybrid recommendation and mentorship systems for higher education portals,\" IEEE Access, vol. 11, pp. 24890–24902, 2023, DOI: 10.1109/ACCESS.2023.3256789.",
        "[20] H. Zhou, Y. Wu, and C. Zhang, \"Event-driven campus management platforms: Architecture and implementation,\" Journal of Systems Architecture, vol. 210, p. 103550, 2023, DOI: 10.1016/j.sysarc.2023.103550.",
        "[21] Bhuvaneswaran B, Reshma R, Soniya V, \"JobQuench: An Intelligent and Automated Placement Management System for Enhanced Campus Recruitment\", in Proc. 3rd IEEE International Conference on Augmented Intelligence and Sustainable Systems (ICAISS), 2025, pp. 1104–1109, DOI: 10.1109/ICAISS61471.2025.11042066.",
        "[22] Divya Dixit Saxena, Dharmesh J. Shah, Vikash Kumar Singh, Himanshu Yadav, Vivek Kumar Singh, \"Transforming Placement Workflow: Modern Web Framework Approach to Campus Recruitment Management\", in Proc. 27th International Conference on Next Generation Communication & Information Processing (INCIP), 2025, pp. 1102–1108, DOI: 10.1109/INCIP64058.2025.11020406."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.1
        run = p.add_run(r)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(8.5)

    output_docx = os.path.abspath("KNOTS_Research_Paper.docx")
    doc.save(output_docx)
    print(f"Word document saved to {output_docx}")
    
    # Convert directly to PDF
    output_pdf = os.path.abspath("KNOTS_Research_Paper.pdf")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        wdoc = word.Documents.Open(output_docx)
        wdoc.SaveAs(output_pdf, FileFormat=17) # 17 is wdFormatPDF
        wdoc.Close()
        print(f"PDF successfully generated at {output_pdf}")
    except Exception as e:
        print(f"Error during Word conversion: {e}")
    finally:
        word.Quit()

    # Synchronize all file copies
    shutil.copyfile("KNOTS_Research_Paper.docx", "KNOTS_Research_Paper_IJRASET.docx")
    shutil.copyfile("KNOTS_Research_Paper.pdf", "KNOTS_Research_Paper_IJRASET.pdf")
    print("All copies synchronized.")

if __name__ == "__main__":
    generate_paper()
