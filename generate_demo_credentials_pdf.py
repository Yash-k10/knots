import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 25, page_str)
        self.drawString(40, 25, "KNOTS Platform — Official Demonstration & Testing Credentials")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 35, letter[0] - 40, 35)
        self.restoreState()

def generate_pdf():
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "KNOTS_Demo_Accounts_Credentials.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=50
    )
    
    PRIMARY = colors.HexColor("#4338CA")
    SECONDARY = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#64748B")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BG_ALT = colors.HexColor("#F1F5F9")
    ACCENT_BOX = colors.HexColor("#EEF2FF")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_MUTED,
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'SecHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=4
    )

    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=SECONDARY
    )

    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=SECONDARY
    )

    cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#312E81")
    )

    cell_hdr = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("KNOTS Platform — Demo Accounts & Login Credentials", title_style))
    story.append(Paragraph("Official Reference Document for Live Evaluation, Viva & Feature Demonstration | SBJIT Campus", subtitle_style))

    # Universal Password Callout Banner
    pwd_data = [
        [
            Paragraph("<b>🔑 Universal Master Password for All Accounts:</b> &nbsp;&nbsp;<font color='#4338CA' face='Courier-Bold' size='10'><b>pass@knots</b></font><br/><font size='7.5' color='#475569'>All pre-seeded demo accounts are fully activated, email-verified, and pre-configured with complete role permissions in the database.</font>", cell_style)
        ]
    ]
    t_pwd = Table(pwd_data, colWidths=[540])
    t_pwd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ACCENT_BOX),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#6366F1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_pwd)
    story.append(Spacer(1, 8))

    headers = ['Role', 'Email Address (Username)', 'Password', 'Designation / Purpose']
    col_widths = [85, 165, 75, 215]

    def build_table(rows):
        data = [[
            Paragraph(headers[0], cell_hdr),
            Paragraph(headers[1], cell_hdr),
            Paragraph(headers[2], cell_hdr),
            Paragraph(headers[3], cell_hdr)
        ]]
        for r in rows:
            data.append([
                Paragraph(r[0], cell_bold),
                Paragraph(r[1], cell_code),
                Paragraph(r[2], cell_code),
                Paragraph(r[3], cell_style)
            ])
        t = Table(data, colWidths=col_widths, repeatRows=1)
        t_style = [
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                t_style.append(('BACKGROUND', (0, i), (-1, i), BG_ALT))
            else:
                t_style.append(('BACKGROUND', (0, i), (-1, i), colors.white))
        t.setStyle(TableStyle(t_style))
        return t

    # 1. Executive Leadership & Central Administration
    story.append(Paragraph("1. Campus Leadership & Central Administration", h2_style))
    lead_rows = [
        ['Central Admin', 'centraladmin@sbjit.edu.in', 'pass@knots', 'Master Central Administrator (Campus Governance & Roles)'],
        ['Super Admin', 'superadmin.demo@sbjit.edu.in', 'pass@knots', 'Super Administrator (Master Platform Controls)'],
        ['TPO Lead', 'tpo@sbjit.edu.in', 'pass@knots', 'Head - Training & Placement Office (Placement & Drives)'],
        ['Dean', 'dean.demo@sbjit.edu.in', 'pass@knots', 'Dean of Academic Affairs (Curriculum & Policy)'],
        ['Principal', 'principal.demo@sbjit.edu.in', 'pass@knots', 'Principal of SBJIT (Institutional Executive)'],
        ['CEO', 'ceo.demo@sbjit.edu.in', 'pass@knots', 'Chief Executive Officer (Strategic Roadmap)'],
    ]
    story.append(build_table(lead_rows))
    story.append(Spacer(1, 8))

    # 2. AIML Department
    story.append(Paragraph("2. Department of AI & Machine Learning (AIML)", h2_style))
    aiml_rows = [
        ['HOD (AIML)', 'hod.aiml@sbjit.edu.in', 'pass@knots', 'Dr. Manisha Kulkarni (AIML Department HOD)'],
        ['Controller (AIML)', 'controller.aiml@sbjit.edu.in', 'pass@knots', 'Prof. Deepak Verma (Dept Operations & Clubs)'],
        ['Faculty 1 (AIML)', 'faculty1.aiml@sbjit.edu.in', 'pass@knots', 'Dr. Pradeep Mishra (Associate Prof - AI Lab Lead)'],
        ['Faculty 2 (AIML)', 'faculty2.aiml@sbjit.edu.in', 'pass@knots', 'Prof. Kavita Rao (Assistant Prof - Computer Vision)'],
        ['Faculty 3 (AIML)', 'faculty3.aiml@sbjit.edu.in', 'pass@knots', 'Dr. Sanjay Trivedi (Assistant Prof - NLP & Graphs)'],
        ['Faculty 4 (AIML)', 'faculty4.aiml@sbjit.edu.in', 'pass@knots', 'Prof. Anjali Somani (Assistant Prof - ML & Data Mining)'],
        ['Student 1 (AIML)', 'student1.aiml@sbjit.edu.in', 'pass@knots', 'Aryan Kapoor (4th Year AIML - GenAI & LLMs)'],
        ['Student 2 (AIML)', 'student2.aiml@sbjit.edu.in', 'pass@knots', 'Isha Sen (4th Year AIML - Computer Vision)'],
        ['Student 3 (AIML)', 'student3.aiml@sbjit.edu.in', 'pass@knots', 'Varun Malhotra (4th Year AIML - MLOps)'],
        ['Student 4 (AIML)', 'student4.aiml@sbjit.edu.in', 'pass@knots', 'Mehak Chawla (3rd Year AIML - NLP)'],
        ['Student 5 (AIML)', 'student5.aiml@sbjit.edu.in', 'pass@knots', 'Dev Singhania (3rd Year AIML - Robotics & RL)'],
        ['Student 6 (AIML)', 'student6.aiml@sbjit.edu.in', 'pass@knots', 'Shreya Ghoshal (3rd Year AIML - Data Science)'],
        ['Student 7 (AIML)', 'student7.aiml@sbjit.edu.in', 'pass@knots', 'Kabir Bedi (2nd Year AIML - ML Core)'],
        ['Student 8 (AIML)', 'student8.aiml@sbjit.edu.in', 'pass@knots', 'Simran Kaur (2nd Year AIML - Deep Learning)'],
        ['Student 9 (AIML)', 'student9.aiml@sbjit.edu.in', 'pass@knots', 'Ayush Roy (2nd Year AIML - AI Web Apps)'],
        ['Student 10 (AIML)', 'student10.aiml@sbjit.edu.in', 'pass@knots', 'Kriti Sanon (2nd Year AIML - Ethical AI)'],
        ['Alumni 1 (AIML)', 'alumni1.aiml@sbjit.edu.in', 'pass@knots', 'Sameer Sheikh (AI Research Engineer @ OpenAI)'],
        ['Alumni 2 (AIML)', 'alumni2.aiml@sbjit.edu.in', 'pass@knots', 'Nidhi Agrawal (Senior ML Engineer @ NVIDIA)'],
        ['Alumni 3 (AIML)', 'alumni3.aiml@sbjit.edu.in', 'pass@knots', 'Gaurav Taneja (Computer Vision Engineer @ Tesla)'],
        ['Alumni 4 (AIML)', 'alumni4.aiml@sbjit.edu.in', 'pass@knots', 'Pallavi Shrestha (NLP Scientist @ Meta)'],
        ['Alumni 5 (AIML)', 'alumni5.aiml@sbjit.edu.in', 'pass@knots', 'Nikhil Kamath (Perception Lead @ Boston Dynamics)'],
    ]
    story.append(build_table(aiml_rows))
    story.append(Spacer(1, 8))

    # 3. CSE Department
    story.append(Paragraph("3. Department of Computer Science & Engineering (CSE)", h2_style))
    cse_rows = [
        ['HOD (CSE)', 'hod.cse@sbjit.edu.in', 'pass@knots', 'Dr. Arvind Sharma (CSE Department HOD)'],
        ['Controller (CSE)', 'controller.cse@sbjit.edu.in', 'pass@knots', 'Prof. Amit Saxena (Dept Operations & Clubs)'],
        ['Faculty 1 (CSE)', 'faculty1.cse@sbjit.edu.in', 'pass@knots', 'Dr. Rajesh Kumar (Assistant Prof - Distributed Systems)'],
        ['Faculty 2 (CSE)', 'faculty2.cse@sbjit.edu.in', 'pass@knots', 'Prof. Sunita Rao (Associate Prof - DBMS & SE)'],
        ['Faculty 3 (CSE)', 'faculty3.cse@sbjit.edu.in', 'pass@knots', 'Dr. Vikram Patil (Assistant Prof - Cybersecurity)'],
        ['Faculty 4 (CSE)', 'faculty4.cse@sbjit.edu.in', 'pass@knots', 'Prof. Neha Deshpande (Assistant Prof - Web Tech)'],
        ['Student 1 (CSE)', 'student1.cse@sbjit.edu.in', 'pass@knots', 'Aarav Sharma (4th Year CSE - Cloud & Full-Stack)'],
        ['Student 2 (CSE)', 'student2.cse@sbjit.edu.in', 'pass@knots', 'Priya Patel (4th Year CSE - Frontend Architect)'],
        ['Student 3 (CSE)', 'student3.cse@sbjit.edu.in', 'pass@knots', 'Rohan Verma (4th Year CSE - Algorithms & System Design)'],
        ['Student 4 (CSE)', 'student4.cse@sbjit.edu.in', 'pass@knots', 'Ananya Iyer (3rd Year CSE - Backend & Databases)'],
        ['Student 5 (CSE)', 'student5.cse@sbjit.edu.in', 'pass@knots', 'Aditya Joshi (3rd Year CSE - DevOps & Cloud)'],
        ['Student 6 (CSE)', 'student6.cse@sbjit.edu.in', 'pass@knots', 'Sneha Kulkarni (3rd Year CSE - Scalable Web Apps)'],
        ['Student 7 (CSE)', 'student7.cse@sbjit.edu.in', 'pass@knots', 'Tanmay Deshmukh (2nd Year CSE - Core CS & Web)'],
        ['Student 8 (CSE)', 'student8.cse@sbjit.edu.in', 'pass@knots', 'Riya Gupta (2nd Year CSE - Problem Solving & Git)'],
        ['Student 9 (CSE)', 'student9.cse@sbjit.edu.in', 'pass@knots', 'Harsh Mehta (2nd Year CSE - OOP & Tech Clubs)'],
        ['Student 10 (CSE)', 'student10.cse@sbjit.edu.in', 'pass@knots', 'Pooja Nair (2nd Year CSE - UI/UX & React)'],
        ['Alumni 1 (CSE)', 'alumni1.cse@sbjit.edu.in', 'pass@knots', 'Kunal Shinde (SDE-2 @ Microsoft)'],
        ['Alumni 2 (CSE)', 'alumni2.cse@sbjit.edu.in', 'pass@knots', 'Meera Bhatt (Cloud Engineer @ AWS)'],
        ['Alumni 3 (CSE)', 'alumni3.cse@sbjit.edu.in', 'pass@knots', 'Siddharth Jain (Senior Backend Engineer @ Razorpay)'],
        ['Alumni 4 (CSE)', 'alumni4.cse@sbjit.edu.in', 'pass@knots', 'Divya Wagh (Software Engineer @ Google)'],
        ['Alumni 5 (CSE)', 'alumni5.cse@sbjit.edu.in', 'pass@knots', 'Akash Mohite (Staff Data Engineer @ Uber)'],
    ]
    story.append(build_table(cse_rows))
    story.append(Spacer(1, 8))

    # 4. Other Department Controllers & Role Demos
    story.append(Paragraph("4. Other Department Controllers & Generic Demo Accounts", h2_style))
    other_rows = [
        ['Controller (FY)', 'controller.fy@sbjit.edu.in', 'pass@knots', 'First Year Engineering Controller'],
        ['Controller (AIDS)', 'controller.aids@sbjit.edu.in', 'pass@knots', 'AI & Data Science Controller'],
        ['Controller (IT)', 'controller.it@sbjit.edu.in', 'pass@knots', 'Information Technology Controller'],
        ['Controller (ETC)', 'controller.etc@sbjit.edu.in', 'pass@knots', 'Electronics & Telecom Controller'],
        ['Controller (EE)', 'controller.ee@sbjit.edu.in', 'pass@knots', 'Electrical Engineering Controller'],
        ['Controller (ME)', 'controller.me@sbjit.edu.in', 'pass@knots', 'Mechanical Engineering Controller'],
        ['Controller (BCA)', 'controller.bca@sbjit.edu.in', 'pass@knots', 'BCA Department Controller'],
        ['Controller (MCA)', 'controller.mca@sbjit.edu.in', 'pass@knots', 'MCA Department Controller'],
        ['Controller (MBA)', 'controller.mba@sbjit.edu.in', 'pass@knots', 'MBA Department Controller'],
        ['Demo Student', 'studentdemo@sbjit.edu.in', 'pass@knots', 'Standard Student Sandbox Account'],
        ['Demo Student 2', 'studentdemo1@sbjit.edu.in', 'pass@knots', 'Secondary Student Sandbox Account'],
        ['Demo Faculty', 'faculty.demo@sbjit.edu.in', 'pass@knots', 'Standard Faculty Sandbox Account'],
        ['Demo HOD', 'hod.demo@sbjit.edu.in', 'pass@knots', 'Standard HOD Sandbox Account'],
        ['Demo Alumni', 'alumni.demo@sbjit.edu.in', 'pass@knots', 'Standard Alumni Sandbox Account'],
    ]
    story.append(build_table(other_rows))
    story.append(Spacer(1, 10))

    # 5. Recommended Live Demonstration Testing Flows
    story.append(Paragraph("5. Recommended Live Demonstration Testing Workflows", h2_style))
    flows = [
        ("Faculty Posting Opportunities:", "Login as <b>faculty1.aiml@sbjit.edu.in</b> &rarr; Navigate to Opportunities (/jobs) &rarr; Click 'Post Opportunity' &rarr; Create research, internship, or project opening with required skills, stipend, and deadlines."),
        ("Student Viewing & Applying:", "Login as <b>student1.aiml@sbjit.edu.in</b> (or student1.cse) &rarr; Explore feed / Faculty Opportunities tab &rarr; Click 'Apply to Faculty' on Dr. Pradeep Mishra's posting &rarr; Enter statement of interest &rarr; Submit and track in 'My Applications'."),
        ("HOD Academic Dashboard:", "Login as <b>hod.aiml@sbjit.edu.in</b> or <b>hod.cse@sbjit.edu.in</b> &rarr; Access Department Analytics, faculty KPI tracking, and student engagement metrics."),
        ("TPO Placement Drives:", "Login as <b>tpo@sbjit.edu.in</b> &rarr; Manage corporate job drives, view applicant resumes, filter candidates with Student Finder, and update hiring statuses."),
        ("Alumni Referral Hub:", "Login as <b>alumni1.cse@sbjit.edu.in</b> &rarr; Post company openings, share referral criteria, and connect with students in the Alumni Directory.")
    ]
    for title, desc in flows:
        story.append(Paragraph(f"• <b>{title}</b> {desc}", cell_style))
        story.append(Spacer(1, 3))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated PDF successfully at: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
