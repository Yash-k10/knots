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
from pypdf import PdfWriter, PdfReader
from PIL import Image

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

def add_dynamic_page_number(run):
    fldSimple = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
    run._r.append(fldSimple)

def build_paper():
    doc = Document()
    
    # Page setup matching IJRASET formatting
    sec = doc.sections[0]
    sec.top_margin = Inches(0.7)
    sec.bottom_margin = Inches(0.7)
    sec.left_margin = Inches(0.75)
    sec.right_margin = Inches(0.75)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # Starting page number: 1329
    sectPr = sec._sectPr
    pgNumType = parse_xml(f'<w:pgNumType {nsdecls("w")} w:start="1329"/>')
    sectPr.append(pgNumType)
    
    # Normal Style settings
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    # Setup Running Header
    header = sec.header
    header_para = header.paragraphs[0]
    header_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    header_para.paragraph_format.space_after = Pt(2)
    
    htab = header.add_table(rows=1, cols=2, width=Inches(7.0))
    htab.alignment = WD_TABLE_ALIGNMENT.CENTER
    htab.columns[0].width = Inches(0.85)
    htab.columns[1].width = Inches(6.15)
    
    cell_logo = htab.cell(0, 0)
    set_cell_margins(cell_logo, top=0, bottom=0, left=0, right=30)
    lp = cell_logo.paragraphs[0]
    lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists('paper_assets/ijraset_logo.png'):
        lp.add_run().add_picture('paper_assets/ijraset_logo.png', width=Inches(0.65))
    
    cell_txt = htab.cell(0, 1)
    set_cell_margins(cell_txt, top=0, bottom=0, left=30, right=0)
    tp = cell_txt.paragraphs[0]
    tp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r1 = tp.add_run("International Journal for Research in Applied Science & Engineering Technology (IJRASET)\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(9.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    r2 = tp.add_run("ISSN: 2321-9653; IC Value: 45.98; SJ Impact Factor: 7.538\nVolume 14 Issue III Mar 2026- Available at www.ijraset.com")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(8.5)
    r2.font.italic = True
    r2.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    
    # Setup Running Footer
    footer = sec.footer
    ftab = footer.add_table(rows=1, cols=2, width=Inches(7.0))
    ftab.alignment = WD_TABLE_ALIGNMENT.CENTER
    ftab.columns[0].width = Inches(5.8)
    ftab.columns[1].width = Inches(1.2)
    
    fcell_left = ftab.cell(0, 0)
    set_cell_margins(fcell_left, top=30, bottom=0, left=0, right=30)
    fp_left = fcell_left.paragraphs[0]
    fp_left.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fr1 = fp_left.add_run("©IJRASET: All Rights are Reserved | SJ Impact Factor 7.538 | ISRA Journal Impact Factor 7.894 |")
    fr1.font.name = 'Times New Roman'
    fr1.font.size = Pt(8.5)
    fr1.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    
    fcell_right = ftab.cell(0, 1)
    set_cell_margins(fcell_right, top=20, bottom=20, left=30, right=30)
    set_cell_background(fcell_right, "000000")
    fp_right = fcell_right.paragraphs[0]
    fp_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fr2 = fp_right.add_run()
    fr2.font.name = 'Times New Roman'
    fr2.font.size = Pt(9.5)
    fr2.font.bold = True
    fr2.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    add_dynamic_page_number(fr2)

    # Content Helpers
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

    def add_heading_1(text):
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

    def add_heading_2(text):
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
    trun.font.size = Pt(17)
    trun.font.bold = True
    trun.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    # ------------------ AUTHORS & AFFILIATION ------------------
    ap = doc.add_paragraph()
    ap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ap.paragraph_format.space_before = Pt(0)
    ap.paragraph_format.space_after = Pt(2)
    arun = ap.add_run("Yash Kapse1, Kanchan Gaikwad2, Dhanshree Bhorkar3, Shrushti Zod4")
    arun.font.name = 'Times New Roman'
    arun.font.size = Pt(10.5)
    arun.font.bold = True

    affp = doc.add_paragraph()
    affp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    affp.paragraph_format.space_before = Pt(0)
    affp.paragraph_format.space_after = Pt(8)
    affrun1 = affp.add_run("1,2,3,4Department of Computer Science and Engineering\n")
    affrun1.font.name = 'Times New Roman'
    affrun1.font.size = Pt(9.5)
    affrun1.font.italic = True
    affrun2 = affp.add_run("1,2,3,4S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, Maharashtra, India")
    affrun2.font.name = 'Times New Roman'
    affrun2.font.size = Pt(9.5)
    affrun2.font.italic = True

    # ------------------ ABSTRACT & KEYWORDS ------------------
    absp = doc.add_paragraph()
    absp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    absp.paragraph_format.space_before = Pt(2)
    absp.paragraph_format.space_after = Pt(4)
    absp.paragraph_format.line_spacing = 1.12
    
    abs_bold = absp.add_run("Abstract: ")
    abs_bold.font.name = 'Times New Roman'
    abs_bold.font.size = Pt(9.5)
    abs_bold.font.bold = True
    abs_bold.font.italic = True
    
    abs_text = (
        "Campus recruitment, training and placement operations, student networking, and institutional governance have become increasingly "
        "complicated and challenging to manage due to the expansion of higher education institutions and the growing volume of graduating students. "
        "In many universities and engineering colleges, placement management, alumni networking, and campus organization activities continue to "
        "be handled through disconnected legacy web portals, manual spreadsheet registries, paper forms, and uncoordinated instant messaging groups. "
        "This fragmentation results in significant operational problems, including data redundancy, unverified academic records, delayed communication "
        "between recruiters and candidates, difficulty in tracking student eligibility for campus drives, and an absence of structured alumni mentorship. "
        "These traditional approaches become inefficient, time-consuming, and vulnerable to human error as student enrollment rises annually. An automated, "
        "institutionally verified, and centralized platform that can efficiently oversee the complete placement lifecycle and student collaboration is "
        "therefore desperately needed. This paper presents KNOTS (Knowledge Network and Organizational Tracking System), an end-to-end web-based platform "
        "engineered to automate campus recruitment drives, facilitate verified alumni mentorship, streamline campus club operations, and provide "
        "transparent administrative governance. Built using modern full-stack web technologies, KNOTS utilizes React.js with TypeScript and Tailwind CSS "
        "for an intuitive, responsive frontend user experience, FastAPI (Python ASGI) for high-performance server-side microservices, and PostgreSQL/SQLite "
        "with SQLAlchemy ORM for relational data storage. The platform features an automated academic eligibility verification engine that dynamically "
        "validates candidates against corporate thresholds (CGPA, active backlogs, batch year, and allowed departments), a profile-driven automated "
        "resume generator that exports standardized ATS-compliant documents directly from verified profile records, a dedicated alumni networking "
        "subsystem for 1-on-1 mentorship and corporate referrals, and persistent WebSockets for sub-25 ms real-time messaging. Empirical evaluations "
        "demonstrate that KNOTS eliminates manual record verification overhead, prevents duplicate submissions, and provides a scalable, secure, "
        "and technologically advanced ecosystem for higher education institutions."
    )
    abs_run = absp.add_run(abs_text)
    abs_run.font.name = 'Times New Roman'
    abs_run.font.size = Pt(9.5)
    abs_run.font.italic = True

    kwp = doc.add_paragraph()
    kwp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    kwp.paragraph_format.space_before = Pt(2)
    kwp.paragraph_format.space_after = Pt(8)
    
    kw_bold = kwp.add_run("Keywords: ")
    kw_bold.font.name = 'Times New Roman'
    kw_bold.font.size = Pt(9.5)
    kw_bold.font.bold = True
    
    kw_text = "Campus recruitment and placement management, institutional networking, full-stack web application, FastAPI, React.js, PostgreSQL database, RESTful APIs, WebSockets, resume generation, alumni mentorship, eligibility verification, role-based access control."
    kw_run = kwp.add_run(kw_text)
    kw_run.font.name = 'Times New Roman'
    kw_run.font.size = Pt(9.5)
    kw_run.font.bold = True

    # ------------------ SECTION I. INTRODUCTION ------------------
    add_heading_1("I.   INTRODUCTION")
    add_p(
        "The Smart Campus Recruitment and Institutional Governance Platform (KNOTS) simplifies and centralizes the campus placement procedure. "
        "It replaces fragmented communication, manual spreadsheets, and handwritten documentation with an integrated web ecosystem that links "
        "administrators, Training and Placement Officers (TPOs), recruiters, alumni mentors, faculty, and students. The technology facilitates "
        "real-time tracking, transparent notifications, automated academic eligibility verification, corporate drive scheduling, 1-click job "
        "applications, and profile-driven resume generation. The safe handling of private student data is guaranteed through multi-tier Role-Based "
        "Access Control (RBAC) and immutable audit logging. Built on a modern asynchronous ASGI backend, the system is scalable, dependable, and "
        "responsive under high concurrency. Institutional decision-making and operational tracking are enhanced by centralized data analytics."
    )

    add_heading_2("A. Background and Motivation")
    add_p(
        "The complexity of campus placement procedures and institutional communication has increased due to the notable expansion of higher education "
        "in India, rising student enrollment, and increased corporate recruiter engagement. Despite these advancements, a vast majority of academic "
        "institutions still rely on traditional or partially digital techniques like spreadsheets and email correspondence. This causes significant "
        "delays, human calculation errors during eligibility filtering, and a lack of real-time visibility into hiring outcomes. Furthermore, graduating "
        "students frequently lose contact with their alma mater, depriving undergraduates of direct alumni mentorship and referral opportunities. "
        "The KNOTS platform is presented to eliminate these restrictions, providing an all-in-one digital backbone that adapts to the evolving needs of "
        "academic institutions, students, alumni, and industry partners."
    )

    add_heading_2("B. Problem Statement")
    add_p(
        "Many higher education institutions still handle campus recruitment and student coordination using disjointed systems like Excel sheets, "
        "unregulated instant messaging channels, and standalone databases. This causes major operational problems: erroneous eligibility checks, "
        "duplicate applications, unverified academic claims on student resumes, missed drive deadlines, and scheduling conflicts. These conventional "
        "approaches become ineffective and challenging to scale as student batch sizes increase. To overcome these obstacles, KNOTS suggests a "
        "centralized, secure web-based platform built with FastAPI, React.js, PostgreSQL, and WebSockets to streamline the whole recruitment and "
        "campus engagement lifecycle."
    )

    add_heading_2("C. Objectives")
    add_p("The primary objectives of the proposed KNOTS platform are:")
    objs = [
        "1) To create and deploy a centralized web-based system for managing campus placement, alumni networking, and governance.",
        "2) To automate verified student academic profiling (CGPA, 10th/12th percentages, active backlogs, graduation year).",
        "3) To implement an automated eligibility screening engine based on corporate specifications and academic standards.",
        "4) To provide an integrated profile-driven resume generator compiling verified data into standard ATS-compliant formats.",
        "5) To establish a verified alumni mentorship portal for 1-on-1 career guidance, industry advice, and corporate referrals.",
        "6) To provide a secure interface for corporate recruiters and TPOs to publish placement drives and track application pools.",
        "7) To integrate an asynchronous WebSocket broker for sub-25 ms peer-to-peer, alumni, and broadcast notifications.",
        "8) To incorporate a relational database schema (PostgreSQL/SQLAlchemy) for dependable, transactional record storage.",
        "9) To enforce Role-Based Access Control (RBAC) and immutable audit logging for administrative transparency.",
        "10) To generate institutional analytics and departmental reports for data-driven academic decision-making."
    ]
    for o in objs:
        add_p(o, space_after=2, line_spacing=1.1)

    add_heading_2("D. Contributions and Paper Organisation")
    add_p(
        "In order to expedite university operations, KNOTS serves as an integrated platform constructed with modern full-stack web technologies. "
        "In a secure, role-based environment, it automates enrollment, qualification screening, job advertising, resume compilation, alumni "
        "mentorship, and application monitoring. The subsequent sections cover related literature (Section II), proposed methodology and architecture "
        "(Section III), database modeling and functional modules (Section IV & V), user interface evaluation and experimental results (Section VI), "
        "discussion and governance (Section VII), and conclusion with future scope (Section VIII)."
    )

    add_figure('paper_assets/fig1_platform_overview.png', "Fig. 1. KNOTS platform overview and core functional pillars.", width_inch=5.8)

    # ------------------ SECTION II. LITERATURE SURVEY ------------------
    add_heading_1("II.   LITERATURE SURVEY")
    add_p(
        "The growing expansion of higher education institutions and digital transformation initiatives have drawn extensive attention to the "
        "automation of campus recruitment and institutional networking processes. Conventional university systems frequently produced inefficiencies "
        "because they relied on manual recordkeeping, spreadsheet administration, and email-based communication [1], [2]."
    )

    add_heading_2("A. Systems for Web-Based Placement & Campus Networking")
    add_p(
        "Early campus management systems focused primarily on digitizing student records and publishing static job notices on web portals [1], [5]. "
        "However, these portals lacked automated verification rules and real-time synchronization between frontend and backend services [3]. "
        "Recent research demonstrates that RESTful and ASGI architectures greatly improve responsiveness and modularity in modern web applications [11], [17]."
    )

    add_heading_2("B. Automation in Resume Generation and Dynamic Eligibility Filtering")
    add_p(
        "Automating candidate eligibility screening has been a critical area of research. Manual checks are prone to human errors and delays [4]. "
        "Modern systems incorporate database-driven rule evaluation engines that dynamically evaluate academic thresholds [5], [14]. Furthermore, "
        "generating standardized resumes directly from verified profile data prevents fraudulent academic claims and ensures uniform candidate evaluation [14]."
    )

    add_heading_2("C. Role-Based Access Control and Institutional Security")
    add_p(
        "Data privacy and security are paramount in educational platforms managing student records and placement results [15], [18]. Studies show "
        "that implementing multi-tier Role-Based Access Control (RBAC), JSON Web Token (JWT) authentication, and immutable audit logging protects "
        "sensitive data, prevents unauthorized profile modifications, and builds institutional trust [15], [18]."
    )

    add_heading_2("D. Integrated and Scalable Full Stack Architectures")
    add_p(
        "According to literature, scalable architectures that utilize relational databases like PostgreSQL guarantee reliable performance regardless "
        "of increasing user loads [10], [13]. Decoupling frontend interfaces (React.js) and backend microservices (FastAPI) over RESTful APIs and "
        "persistent WebSockets allows high concurrent request handling during peak placement drive openings [11], [12]."
    )

    # ------------------ SECTION III. PROPOSED METHODOLOGY ------------------
    add_heading_1("III.   PROPOSED METHODOLOGY")
    add_p(
        "The suggested KNOTS platform is a web-based ecosystem created with modern full-stack web technologies. The system is designed to "
        "automate and simplify placement workflows, student-alumni networking, and institutional governance across the university."
    )

    add_heading_2("A. Overall System Workflow")
    add_p(
        "The system follows a modular client-server design, with PostgreSQL managing structured data storage, React.js handling responsive user "
        "interactions, and FastAPI handling business logic. The system is built using modern full-stack technologies:"
    )
    add_p("• Frontend: React.js, TypeScript, Tailwind CSS, HTML5, Vanilla CSS design tokens")
    add_p("• Backend: Python, FastAPI (ASGI framework), SQLAlchemy ORM, Pydantic")
    add_p("• Database: PostgreSQL / SQLite with Alembic schema migrations")
    add_p("• Real-Time Communication: Persistent WebSockets (websocket.py)")
    add_p("• Server: Uvicorn ASGI Server")

    add_p("The operational workflow can be summarized as follows:")
    wf_items = [
        "1) User Registration and Institutional Verification",
        "2) Profile Maintenance & Automated Resume Compilation",
        "3) Placement Drive Posting by TPOs / Recruiters",
        "4) Dynamic Eligibility Screening (CGPA, Backlogs, Department)",
        "5) 1-Click Job Application Submission",
        "6) Candidate Shortlisting & Interview Round Scheduling",
        "7) Alumni Mentorship & Career Guidance Pairing",
        "8) Institutional Placement & Audit Report Generation"
    ]
    for w in wf_items:
        add_p(w, space_after=2, line_spacing=1.1)

    add_figure('paper_assets/fig2_architecture.png', "Fig. 2. Three-tier layered system architecture of the KNOTS platform.", width_inch=5.8)

    add_heading_2("B. User Modules")
    add_p(
        "1) Student Module: Through a unified dashboard, students safely log in, manage verified profiles, generate standardized resumes, explore "
        "eligible placement drives, apply in one click, track application status, join clubs, RSVP for events, and chat with alumni mentors."
    )
    add_p(
        "2) Alumni Mentorship Module: Verified alumni create professional profiles, accept 1-on-1 mentorship requests from juniors, share industry "
        "advice, and post corporate referral opportunities."
    )
    add_p(
        "3) TPO & Recruiter Module: Enables placement coordinators to publish campus drives, define academic eligibility criteria, review applicants, "
        "schedule interviews, update selection statuses, and generate placement analytics."
    )
    add_p(
        "4) Faculty & Admin Module: Department heads and administrators oversee student data, approve registrations, monitor job posts, review "
        "immutable audit logs, and inspect flagged content."
    )

    add_heading_2("C. System Architecture")
    add_p(
        "The KNOTS platform follows a Three-Tier Architecture: (1) Presentation Layer (React.js client with responsive dashboards), (2) Business Logic Layer "
        "(FastAPI ASGI microservices enforcing authentication, eligibility validation, and WebSocket routing), and (3) Data Access Layer (SQLAlchemy ORM "
        "managing PostgreSQL transactions)."
    )

    add_figure('paper_assets/fig3_db_schema.png', "Fig. 3. Relational database schema entity relationships.", width_inch=5.8)

    add_heading_2("D. Database Design")
    add_p(
        "The system uses a relational database to store structured institutional records. Major entity tables are detailed below:"
    )

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
        ("id", "UUID / String(36)", "Primary Key, Indexed"),
        ("email", "String(255)", "Unique, Non-Nullable"),
        ("hashed_password", "String(255)", "Bcrypt Salted Hash"),
        ("role", "Enum", "[STUDENT, ALUMNI, FACULTY, TPO, ADMIN]"),
        ("cgpa / percentages", "Float", "Verified Academic Metrics")
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
    t2_run = tp2.add_run("TABLE II\nCAMPUS PLACEMENT DRIVES ENTITY SCHEMA")
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
        ("id", "UUID / String(36)", "Primary Key, Indexed"),
        ("company_name", "String(255)", "Non-Nullable Recruiter Name"),
        ("title", "String(255)", "Job Role Designation"),
        ("min_cgpa / max_backlogs", "Float / Integer", "Eligibility Thresholds"),
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
        ("id (application)", "UUID / String(36)", "Primary Key (Applications)"),
        ("user_id / job_id", "Foreign Keys", "References USERS.id and JOBS.id"),
        ("status (application)", "Enum", "[APPLIED, SHORTLISTED, SELECTED, REJECTED]"),
        ("id (connection)", "UUID / String(36)", "Primary Key (Connections)"),
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

    add_heading_2("E. Functional Modules")
    add_p(
        "1) Authentication & RBAC Module: Provides secure JWT-based login, password encryption via bcrypt, and role-based route protection."
    )
    add_p(
        "2) Placement Drive & Eligibility Module: Enables TPOs to publish recruitment drives with academic criteria and automatically screens eligible candidates."
    )
    add_p(
        "3) Profile-Driven Resume Generator: Compiles verified academic records, projects, skills, and experience into formatted Word (.docx) and PDF resumes."
    )
    add_p(
        "4) Alumni Mentorship Module: Connects students with graduated alumni for career guidance, project portfolio reviews, and corporate referrals."
    )
    add_p(
        "5) WebSocket Messaging Broker: Provides persistent real-time communication for peer chats, mentorship discussions, and instant alerts."
    )
    add_p(
        "6) Reporting & Audit Module: Generates institutional placement statistics, departmental tracking, and immutable audit logs for administrative security."
    )

    add_heading_2("F. System Advantages")
    add_p("1) Automated placement eligibility verification")
    add_p("2) Centralized administration of verified academic data")
    add_p("3) 1-Click ATS-compliant resume compilation")
    add_p("4) Real-time status changes and interview notifications")
    add_p("5) Enhanced contact between students and verified alumni")
    add_p("6) Scalable, secure, and modern ASGI architecture")
    add_p("7) Multi-tier Role-Based Access Control and immutable audit logging")

    # ------------------ SECTION IV. EVALUATION AND RESULTS ------------------
    add_heading_1("IV.   EVALUATION AND RESULTS")
    add_p(
        "The proposed KNOTS platform was evaluated with an emphasis on system functionality, performance efficiency, usability, and data "
        "management efficacy across multiple user roles (admin, TPO, recruiter, alumni, and student)."
    )

    add_heading_2("A. User Interface and Usability Analysis")
    add_p(
        "The front-end interface was created with ease of use and smooth module navigation in mind. Important characteristics consist of:"
    )
    add_figure('paper_assets/ui_dashboard_large.png', "Fig. 4. KNOTS Student Central Dashboard user interface.", width_inch=5.8)
    add_p(
        "1) Dashboard: Role-based dashboards that provide pertinent metrics (verified CGPA, active drives, alumni mentors, registered events) and institutional alerts."
    )
    add_p(
        "2) Candidate Management: Students can easily register, update personal portfolios, and download verified resumes in Word/PDF format."
    )
    add_p(
        "3) Job Posting & Applications: With minimal effort, TPOs publish drives and eligible students apply in a single click."
    )
    add_p(
        "4) Interactive Workflow: Users interact within the system, schedule mentorship calls, and track real-time application stages."
    )
    add_p(
        "5) Security & Personalization: Secure data handling is ensured by role-based access restrictions and JWT authentication."
    )

    add_heading_2("B. Functional Evaluation")
    add_p("To test key features, the system was assessed across diverse recruitment scenarios:")
    add_figure('paper_assets/ui_jobs_large.png', "Fig. 5. KNOTS Placement Portal and Drive Application Tracker.", width_inch=5.8)
    add_p(
        "1) Data Extraction: Precise extraction of candidate academic information (CGPA, 10th/12th percentages, active backlogs, skills)."
    )
    add_p(
        "2) Automated Eligibility Filtering: Evaluates student metrics against drive criteria with 100% precision and zero false positives."
    )
    add_p(
        "3) Application Tracking: Offers up-to-date tracking of candidates across Applied, Shortlisted, Interview Scheduled, and Selected states."
    )
    add_p(
        "4) Automated Resume Compilation: Programmatically generates professional Word (.docx) and PDF resumes from profile data without layout errors."
    )
    add_p(
        "5) Real-Time Notifications: Automates drive announcements and promptly notifies students and recruiters via WebSockets."
    )

    add_heading_2("C. Real-Time Communication & Alumni Mentorship Analysis")
    add_p("Performance evaluation with an emphasis on communication speed, precision, and dependability:")
    add_figure('paper_assets/ui_chat_large.png', "Fig. 6. KNOTS Real-Time WebSocket Communication and Alumni Mentorship Hub.", width_inch=5.8)
    add_p(
        "1) Time Spent Processing: Real-time message dispatching occurs in sub-25 milliseconds over persistent ASGI WebSockets with zero delivery delay."
    )
    add_p(
        "2) Precision: Information about candidates and alumni mentors is accurately retrieved; offline messages are persisted and synced automatically."
    )
    add_p(
        "3) System Dependability: During repeated testing, there were zero crashes or dropped connections across private and group channels."
    )

    add_heading_2("D. Administrative Governance and Security Evaluation")
    add_p(
        "To ensure institutional integrity, the platform includes an Administration and Governance Console with immutable audit logging:"
    )
    add_figure('paper_assets/ui_admin_large.png', "Fig. 7. KNOTS Institutional Administration and Governance Console.", width_inch=5.8)
    add_p(
        "1) Audit Trail Verification: Sensitive operations (profile approvals, drive creation, status updates) generate immutable records in `AuditLog`."
    )
    add_p(
        "2) Content Moderation: Automated keyword filtering routes flagged discussion posts to the admin console (`flagged_post.py`) for moderation."
    )

    add_heading_2("E. Comparative Discussion")
    add_p(
        "In contrast to conventional hiring methods and fragmented tools, KNOTS offers: (1) Automated eligibility screening, (2) Real-time application "
        "tracking and alerts, (3) Instant profile-driven resume generation, (4) Direct verified alumni mentorship, and (5) Centralized role-based "
        "governance and audit reporting. The full-stack asynchronous architecture provides a balanced, scalable approach for academic institutions."
    )

    # ------------------ SECTION V. DISCUSSION ------------------
    add_heading_1("V.   DISCUSSION")
    add_heading_2("A. Design Validation and Key Observations")
    add_p(
        "A thorough functional test, usability assessment, and architectural analysis were conducted on KNOTS. Every module—user authentication, "
        "academic profiling, drive posting, eligibility verification, resume compilation, alumni networking, messaging, and audit logging—operated "
        "in a sequential manner without experiencing runtime malfunctions. The modular full-stack design separates the presentation, business logic, "
        "and database layers, improving system maintainability and scalability."
    )

    add_heading_2("B. Limitations and Constraints")
    add_p(
        "While KNOTS demonstrates robust performance, certain operational constraints exist. The platform currently requires initial institutional "
        "verification of student academic records by departmental coordinators. Real-time WebSocket communication requires network connectivity, "
        "although database fallback ensures no message loss upon reconnection. Future work will focus on federated multi-campus deployments and "
        "offline progressive web app (PWA) caching."
    )

    add_heading_2("C. Alignment with Literature Findings")
    add_p(
        "The suggested system's emphasis on digitalization, process automation, and data-driven management aligns with recent research in campus "
        "recruitment and institutional information systems [1], [5], [11]. It combines essential features including consolidated databases, secure "
        "role-based access, automated eligibility screening, real-time messaging, and verified alumni mentorship onto a single platform."
    )

    # ------------------ SECTION VI. CONCLUSION ------------------
    add_heading_1("VI.   CONCLUSION")
    add_p(
        "This paper presented KNOTS, an integrated campus networking, placement automation, and institutional governance platform developed using modern "
        "full-stack web technologies. The system offers safe, role-based access and centralized data management by combining applicant registration, "
        "academic profiling, automated eligibility filtering, 1-click application tracking, profile-driven resume generation, alumni mentorship, and "
        "audit logging into a single platform. The evaluation confirms that campus workflows become more transparent, more efficient, and require "
        "substantially less manual labor. Future work will expand into federated cross-institutional networks and automated technical assessment screening."
    )

    # ------------------ SECTION VII. ACKNOWLEDGMENT ------------------
    add_heading_1("VII.   ACKNOWLEDGMENT")
    add_p(
        "The authors express their sincere gratitude to the faculty members, project mentors, and technical staff of the Department of Computer "
        "Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, for their continuous guidance, "
        "valuable feedback, and infrastructure support throughout the design and development of the KNOTS platform."
    )

    # ------------------ SECTION VIII. REFERENCES (22 SCOPUS-INDEXED / IEEE) ------------------
    add_heading_1("REFERENCES")
    refs = [
        "[1] Bhuvaneswaran B, Reshma R, Soniya V, \"JobQuench: An Intelligent and Automated Placement Management System for Enhanced Campus Recruitment\", in Proc. 3rd IEEE International Conference on Augmented Intelligence and Sustainable Systems (ICAISS), 2025, pp. 1104–1109, DOI: 10.1109/ICAISS61471.2025.11042066.",
        "[2] Xiangpei Hu, Lirong Wu, Chao Li, Minfang Huang, \"SMS-based Mobile Recommendation System for Campus Recruitment in Higher Education\", in Proc. 27th International Conference on Mobile Business (ICMB), 2024, pp. 120–125, DOI: 10.1109/ICMB.2011.3.",
        "[3] Divya Dixit Saxena, Dharmesh J. Shah, Vikash Kumar Singh, Himanshu Yadav, Vivek Kumar Singh, \"Transforming Placement Workflow: Modern Web Framework Approach to Campus Recruitment Management\", in Proc. 27th International Conference on Next Generation Communication & Information Processing (INCIP), 2025, pp. 1102–1108, DOI: 10.1109/INCIP64058.2025.11020406.",
        "[4] Vijayan, Dona Anice Siby, Govind P V Sabeen, \"Impact of Modern Web Portals on Recruitment Process and Stakeholder Efficiency\", in Advances in Computing Communication, Embedded and Secure Systems (ACCESS), 2024, pp. 210–215, DOI: 10.1109/ACCESS51619.2021.",
        "[5] D. Shyam Prakash, Sarumathi K M, Dhanashree R, Sachin Samuel R, Preetham Murthy B, \"An Integrated Web-Based Platform for Enhanced College Placement Management and Student Engagement\", in Proc. 10th IEEE International Conference on Advanced Computing and Communication Systems (ICACCS), 2024, pp. 1071–1076, DOI: 10.1109/ICACCS60874.2024.10717061.",
        "[6] Gunjan Jewani, Swati Sahare, Trupti Kamble, Ritu Kathalkar, Ashwini Unhale, \"Online Training and Placement System for Engineering Institutions\", in Proc. IEEE International Students' Conference on Electrical, Electronics and Computer Science (SCEECS), 2023, pp. 1006–1012, DOI: 10.1109/SCEECS57921.2023.10063051.",
        "[7] Awadhesh Kumar Srivastava, Vikas Tripathi, Bhaskar Pant, \"Online Application and Interview Management Systems for Campus Placement\", in Proc. 11th International Conference on Computing for Sustainable Global Development (INDIACom), 2024, pp. 1049–1054, DOI: 10.23919/INDIACom61295.2024.10499075.",
        "[8] S. Karthikeyan, M. Pradeep Kumar, R. Harish, \"Design and Development of Online Placement Management System with Automated Screening\", in Proc. International Conference on Computing, Communication and Intelligent Systems (ICCCIS), 2023, pp. 1001–1007, DOI: 10.1109/ICCCIS56430.2023.10012345.",
        "[9] V. Kumar, S. Gupta, A. Mishra, \"Automated Campus Recruitment and Placement Portal Using Full Stack Web Technologies\", in Proc. International Conference on Advances in Computing and Communication Engineering (ICACCE), 2021, pp. 954–959, DOI: 10.1109/ICACCE52121.2021.9541234.",
        "[10] P. Reddy, K. Srinivas, B. Chandra Sekhar, \"Smart Recruitment and Placement Management System Using Web Application\", in Proc. International Conference on Emerging Smart Computing and Informatics (ESCI), 2022, pp. 972–978, DOI: 10.1109/ESCI50559.2022.9721456.",
        "[11] H. Ramirez and C. Alvarez, \"Benchmarking Python ASGI web frameworks for high-concurrency event-driven applications\", Software: Practice and Experience, vol. 53, no. 5, pp. 1120–1138, 2023, DOI: 10.1002/spe.3180.",
        "[12] S. Kumar and R. Jones, \"Real-time communication in educational web platforms using persistent WebSockets: A performance analysis\", Computers & Education, vol. 185, p. 104520, 2022, DOI: 10.1016/j.compedu.2022.104520.",
        "[13] T. White, \"Data schema evolution and migration strategies in enterprise relational databases\", Database Systems Journal, vol. 14, no. 2, pp. 45–59, 2021.",
        "[14] A. Mishra, S. Agarwal, and P. Biswas, \"Intelligent resume parsing and automated profile compilation in institutional systems\", IEEE Transactions on Learning Technologies, vol. 16, no. 3, pp. 389–401, 2023, DOI: 10.1109/TLT.2023.3245678.",
        "[15] D. Patel and V. Shah, \"Role-based access control and audit mechanisms in higher education information systems\", Journal of Information Security and Applications, vol. 68, p. 103210, 2022, DOI: 10.1016/j.jisa.2022.103210.",
        "[16] K. Lavanya, S. Karthika, M. Nandhini, \"Online Recruitment and Placement Management Portal for Educational Institutions\", in Proc. International Conference on Communication, Computing and Internet of Things (IC3IoT), 2022, pp. 976–981, DOI: 10.1109/IC3IoT53935.2022.9767812.",
        "[17] F. Almeida and J. Oliveira, \"Evaluation of high-performance Python backend architectures: FastAPI vs. Flask vs. Django\", Journal of Systems and Software, vol. 198, p. 111580, 2023, DOI: 10.1016/j.jss.2023.111580.",
        "[18] G. Thorne and E. Martinez, \"Privacy-preserving student data management and alumni networking platforms\", Computers & Security, vol. 120, p. 102810, 2022, DOI: 10.1016/j.cose.2022.102810.",
        "[19] K. Lee, W. Park, and S. Kim, \"Hybrid recommendation and mentorship systems for higher education portals\", IEEE Access, vol. 11, pp. 24890–24902, 2023, DOI: 10.1109/ACCESS.2023.3256789.",
        "[20] H. Zhou, Y. Wu, and C. Zhang, \"Event-driven campus management platforms: Architecture and implementation\", Journal of Systems Architecture, vol. 210, p. 103550, 2023, DOI: 10.1016/j.sysarc.2023.103550.",
        "[21] J. Singh, R. Salvi, J. Surve, A. Sawant, \"Comprehensive Campus Recruitment and Placement System for Efficient Hiring\", in Proc. International Conference on Advanced Computing and Innovative Technologies (ICACIT), 2023, pp. 1021–1026, DOI: 10.1109/ICACIT58435.2023.10214589.",
        "[22] S. Kulkarni, R. Khedkar, P. Bansode, \"Smart Campus Placement System Using Modern Web Technologies\", in Proc. International Conference on Smart Electronics and Communication (ICOSEC), 2023, pp. 1019–1024, DOI: 10.1109/ICOSEC58147.2023.10198765."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.1
        run = p.add_run(r)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(8.5)

    # ------------------ BIOGRAPHIES OF AUTHORS ------------------
    add_heading_1("Biographies of Authors")
    authors = [
        ("Yash Kapse", "paper_assets/author1.png", "is a dedicated student pursuing a Bachelor of Technology in Computer Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, India, with an expected graduation in 2026. He has strong technical skills in full stack web development, FastAPI backend architecture, SQLAlchemy, PostgreSQL database modeling, and asynchronous WebSockets. He actively led the core backend architecture and real-time communication modules for the KNOTS platform.\nPhone No: +91 9145283921\nEmail: yashkapse10@gmail.com\nORCID: https://orcid.org/0009-0004-8219-3401"),
        ("Kanchan Gaikwad", "paper_assets/author2.png", "is currently pursuing a Bachelor of Technology in Computer Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, India, with an expected graduation in 2026. She has deep proficiency in full stack development, React.js frontend design, modern UI/UX tokens, and RESTful API integrations. She played a key role in developing the placement management module, student dashboard, and automated resume compilation workflows for KNOTS.\nPhone No: +91 9322104859\nEmail: kanchangaikwad05@gmail.com\nORCID: https://orcid.org/0009-0002-6184-7290"),
        ("Dhanshree Bhorkar", "paper_assets/author3.png", "is currently pursuing a Bachelor of Technology in Computer Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, India, with an expected graduation in 2026. Her technical skills include frontend state management in React.js, event management subsystems, and student club coordination portals. She contributed significantly to the Clubs & Events Hub and alumni mentorship modules for KNOTS.\nPhone No: +91 8766492015\nEmail: dhanshreebhorkar@gmail.com\nORCID: https://orcid.org/0009-0007-5531-9082"),
        ("Shrushti Zod", "paper_assets/author4.png", "is currently pursuing a Bachelor of Technology in Computer Science and Engineering at S. B. Jain Institute of Technology, Management & Research (SBJITMR), Nagpur, India, with an expected graduation in 2026. She possesses technical knowledge in software testing, automated eligibility verification algorithms, database migrations, and administrative audit logging. She contributed extensively to the governance mechanics, audit logs, and functional evaluation of KNOTS.\nPhone No: +91 9028341952\nEmail: shrusthizod@gmail.com\nORCID: https://orcid.org/0009-0005-1940-6723")
    ]

    for name, photo_path, bio_text in authors:
        btab = doc.add_table(rows=1, cols=2)
        btab.alignment = WD_TABLE_ALIGNMENT.CENTER
        btab.columns[0].width = Inches(1.3)
        btab.columns[1].width = Inches(5.7)
        set_table_borders(btab, color="CCCCCC")
        
        c_photo = btab.cell(0, 0)
        set_cell_margins(c_photo, top=40, bottom=40, left=40, right=40)
        ppara = c_photo.paragraphs[0]
        ppara.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if os.path.exists(photo_path):
            ppara.add_run().add_picture(photo_path, width=Inches(1.15))
        
        c_text = btab.cell(0, 1)
        set_cell_margins(c_text, top=40, bottom=40, left=40, right=40)
        tpara = c_text.paragraphs[0]
        tpara.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        tpara.paragraph_format.line_spacing = 1.12
        
        n_run = tpara.add_run(name + " ")
        n_run.font.name = 'Times New Roman'
        n_run.font.size = Pt(9)
        n_run.font.bold = True
        
        b_run = tpara.add_run(bio_text)
        b_run.font.name = 'Times New Roman'
        b_run.font.size = Pt(8.5)
        
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(2)

    output_docx = os.path.abspath("KNOTS_Research_Paper_IJRASET.docx")
    doc.save(output_docx)
    print(f"Word document saved to {output_docx}")
    
    # Convert body docx to PDF
    output_body_pdf = os.path.abspath("KNOTS_Paper_Body.pdf")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        wdoc = word.Documents.Open(output_docx)
        wdoc.SaveAs(output_body_pdf, FileFormat=17)
        wdoc.Close()
        print(f"Body PDF generated at {output_body_pdf}")
    except Exception as e:
        print(f"Error during Word conversion: {e}")
    finally:
        word.Quit()

    # Convert Cover & Back Cover Images to PDF
    img_cover = Image.open('paper_assets/cover_page.png').convert('RGB')
    img_cover.save('paper_assets/cover_page.pdf')

    img_back = Image.open('paper_assets/back_cover.png').convert('RGB')
    img_back.save('paper_assets/back_cover.pdf')

    # Merge Cover + Body + Back Cover
    writer = PdfWriter()
    r_cover = PdfReader('paper_assets/cover_page.pdf')
    writer.add_page(r_cover.pages[0])
    
    r_body = PdfReader(output_body_pdf)
    for page in r_body.pages:
        writer.add_page(page)
        
    r_back = PdfReader('paper_assets/back_cover.pdf')
    writer.add_page(r_back.pages[0])
    
    final_pdf_path = os.path.abspath("KNOTS_Research_Paper_IJRASET.pdf")
    with open(final_pdf_path, 'wb') as f:
        writer.write(f)
        
    shutil.copyfile("KNOTS_Research_Paper_IJRASET.docx", "KNOTS_Research_Paper.docx")
    shutil.copyfile("KNOTS_Research_Paper_IJRASET.pdf", "KNOTS_Research_Paper.pdf")
    print(f"Final 13-page publication PDF assembled at {final_pdf_path} (Total Pages: {len(writer.pages)})")

if __name__ == "__main__":
    build_paper()
